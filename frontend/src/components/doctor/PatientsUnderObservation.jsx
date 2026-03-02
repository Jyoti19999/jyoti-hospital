import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Monitor, 
  Clock, 
  AlertTriangle, 
  Timer, 
  CheckCircle, 
  UserCheck,
  Droplets,
  Play,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ophthalmologistQueueService from '@/services/ophthalmologistQueueService';
import { useDoctorQueueSocket } from '@/hooks/useQueueSocket';

// Countdown Timer Component for real-time display
const CountdownTimer = ({ estimatedResumeTime }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!estimatedResumeTime) return 0;
      
      const resumeTime = new Date(estimatedResumeTime);
      const now = new Date();
      
      if (isNaN(resumeTime.getTime())) return 0;
      
      const remainingMs = resumeTime - now;
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      
      return Math.max(0, remainingSeconds);
    };

    setTimeRemaining(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [estimatedResumeTime]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  if (timeRemaining === 0) {
    return (
      <div className="flex items-center gap-1 text-green-600 font-semibold text-xs">
        <CheckCircle className="h-3 w-3" />
        <span>Timer Expired</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-blue-600 font-mono text-xs font-semibold">
      <Timer className="h-3 w-3 animate-pulse" />
      <span>{minutes}m {seconds}s</span>
    </div>
  );
};

const PatientsUnderObservation = ({ user, focusViewMode = false }) => {
  // 🔌 WebSocket real-time updates
  useDoctorQueueSocket();
  
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // ✅ Use React Query with aggressive refetching to ensure latest dilation timer data
  const { data: onHoldData, refetch: refetchOnHoldPatients, isRefetching } = useQuery({
    queryKey: ['doctor-on-hold-patients', user.id],
    queryFn: () => ophthalmologistQueueService.getMyOnHoldPatients(),
    refetchOnWindowFocus: true, // ✅ Refetch when window regains focus
    refetchOnMount: true, // ✅ Refetch when component mounts
    refetchInterval: 10000, // ✅ Auto-refresh every 10 seconds
    refetchIntervalInBackground: true, // ✅ Continue refetching in background
    staleTime: 5000, // ✅ Consider data stale after 5 seconds (more aggressive)
  });

  // ✅ Auto-refresh when component becomes visible (tab switch)
  useEffect(() => {
    refetchOnHoldPatients();
  }, [refetchOnHoldPatients]);

  const handleResumeFromHold = async (queueEntryId) => {
    if (!queueEntryId) {
      toast.error('Invalid queue entry ID');
      return;
    }

    setLoading(true);
    try {
      await ophthalmologistQueueService.resumePatientFromHold(queueEntryId);
      toast.success('Patient resumed from observation');
      // ✅ Invalidate React Query cache - socket will handle the rest!
      queryClient.invalidateQueries(['doctor-on-hold-patients', user.id]);
      queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
    } catch (error) {
      toast.error(error.message || 'Failed to resume patient');
    } finally {
      setLoading(false);
    }
  };

  // Focus View Mode: Render without Card wrapper, with fixed title and scrollable content
  if (focusViewMode) {
    return (
      <div className="flex flex-col p-3 h-full">
        {/* Fixed Title Section */}
        {/* <div className="flex-shrink-0 px-3 py-2 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Monitor className="h-4 w-4 text-purple-600" />
              Patients Under Observation
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs ml-1">
                {onHoldData?.queueEntries?.length || 0}
              </Badge>
            </div>
            <Button
              onClick={() => refetchOnHoldPatients()}
              disabled={isRefetching}
              size="sm"
              variant="outline"
              className="h-7 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div> */}
        
        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-gray-100">
          <div className="space-y-2">
            {!onHoldData?.queueEntries || onHoldData.queueEntries.length === 0 ? (
              <div className="text-center py-8">
                <Monitor className="h-10 w-10 mx-auto mb-3 opacity-50 text-purple-600" />
                <p className="text-gray-500 text-sm font-medium">No patients under observation</p>
              </div>
            ) : (
              onHoldData.queueEntries.map((patient) => (
              <Card key={patient.id} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow w-full">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-bold text-sm">
                          #{patient.queueNumber}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{patient.fullName}</h4>
                        <p className="text-sm text-gray-600">{patient.visitType}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex-shrink-0">
                      Token: {patient.token}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{patient.timing.waitTime}</span>
                      </div>
                      {patient.holdReason && (
                        <span className="text-gray-500 text-xs italic truncate ml-2" title={patient.holdReason}>
                          {patient.holdReason}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {patient.timing.needsDrops && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs px-2 py-0.5">
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                          Waiting for Drops
                        </Badge>
                      )}
                      
                      {patient.timing.dropsApplied && (
                        <>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-0.5">
                            <Droplets className="h-2.5 w-2.5 mr-1" />
                            Round {patient.timing.roundDisplay}
                          </Badge>
                          
                          {!patient.timing.isTimerExpired ? (
                            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs px-2 py-0.5">
                              <CountdownTimer estimatedResumeTime={patient.estimatedResumeTime} />
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-0.5">
                              <CheckCircle className="h-2.5 w-2.5 mr-1" />
                              Timer Complete
                            </Badge>
                          )}
                        </>
                      )}
                      
                      {patient.timing.markedReady && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-0.5">
                          <CheckCircle className="h-2.5 w-2.5 mr-1" />
                          Marked Ready
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Always show Resume button - doctor can resume anytime */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <Button
                      onClick={() => handleResumeFromHold(patient.queueEntryId)}
                      disabled={loading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-1.5 px-3"
                      size="sm"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Resuming...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Resume Examination
                          {!patient.timing.isTimerExpired && patient.timing.dropsApplied && (
                            <span className="ml-2 text-xs opacity-75">(Override Timer)</span>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal Mode: Render with Card wrapper
  return (
    <Card className="bg-white shadow-lg h-[28rem] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Monitor className="h-5 w-5 text-purple-600" />
          <span>Patients Under Observation</span>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {onHoldData?.queueEntries?.length || 0} Patients
          </Badge>
          <Button
            onClick={() => refetchOnHoldPatients()}
            disabled={isRefetching}
            size="sm"
            variant="outline"
            className="h-8 px-2"
            title="Refresh to get latest dilation timer status"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[25rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="space-y-3 p-4">
          {!onHoldData?.queueEntries || onHoldData.queueEntries.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Monitor className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-gray-500 text-lg font-medium">No patients under observation</p>
              <p className="text-gray-400 text-sm">Patients requiring observation or dilation will appear here</p>
            </div>
          ) : (
            onHoldData.queueEntries.map((patient) => (
              <Card key={patient.id} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow w-full">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-bold text-sm">
                          #{patient.queueNumber}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{patient.fullName}</h4>
                        <p className="text-sm text-gray-600">{patient.visitType}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex-shrink-0">
                      Token: {patient.token}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{patient.timing.waitTime}</span>
                      </div>
                      {patient.holdReason && (
                        <span className="text-gray-500 text-xs italic truncate ml-2" title={patient.holdReason}>
                          {patient.holdReason}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {patient.timing.needsDrops && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs px-2 py-0.5">
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                          Waiting for Drops
                        </Badge>
                      )}
                      
                      {patient.timing.dropsApplied && (
                        <>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-0.5">
                            <Droplets className="h-2.5 w-2.5 mr-1" />
                            Round {patient.timing.roundDisplay}
                          </Badge>
                          
                          {!patient.timing.isTimerExpired ? (
                            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs px-2 py-0.5">
                              <CountdownTimer estimatedResumeTime={patient.estimatedResumeTime} />
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-0.5">
                              <CheckCircle className="h-2.5 w-2.5 mr-1" />
                              Timer Complete
                            </Badge>
                          )}
                        </>
                      )}
                      
                      {patient.timing.markedReady && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-0.5">
                          <CheckCircle className="h-2.5 w-2.5 mr-1" />
                          Marked Ready
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Always show Resume button - doctor can resume anytime */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <Button
                      onClick={() => handleResumeFromHold(patient.queueEntryId)}
                      disabled={loading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-1.5 px-3"
                      size="sm"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Resuming...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Resume Examination
                          {!patient.timing.isTimerExpired && patient.timing.dropsApplied && (
                            <span className="ml-2 text-xs opacity-75">(Override Timer)</span>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PatientsUnderObservation;