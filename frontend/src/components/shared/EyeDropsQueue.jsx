import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Eye,
  RefreshCw,
  Timer,
  Clock,
  Search,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * CountdownTimer Component for Eye Drop Queue
 * Displays countdown and triggers alarm when timer expires
 */
const CountdownTimer = ({ estimatedResumeTime, patientId }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasPlayedAlarm, setHasPlayedAlarm] = useState(false);

  useEffect(() => {
    if (!estimatedResumeTime) {
      setTimeRemaining(0);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date();
      const resumeTime = new Date(estimatedResumeTime);
      const diff = Math.max(0, Math.floor((resumeTime - now) / 1000));
      return diff;
    };

    // Initial calculation
    const initialTime = calculateTimeRemaining();
    setTimeRemaining(initialTime);

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Play alarm sound when timer hits 0
      if (remaining === 0 && !hasPlayedAlarm) {
        setHasPlayedAlarm(true);
        
        // Play alarm sound
        const audio = new Audio('/alarm.mp3');
        audio.play().catch(err => {});

        // Show toast notification
        toast.success('Eye drop timer expired! Patient ready for examination.', {
          duration: 5000,
          position: 'top-center'
        });

        // Trigger a small delay then force re-render
        setTimeout(() => {
          setTimeRemaining(-1);
        }, 100);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [estimatedResumeTime, patientId, hasPlayedAlarm]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render anything if timer expired - show buttons instead
  if (timeRemaining === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Badge className="bg-blue-100 text-blue-800">
        <Timer className="h-3 w-3 mr-1" />
        {formatTime(timeRemaining)}
      </Badge>
    </div>
  );
};

/**
 * EyeDropsQueue Component
 * Shared component for managing eye drop queue across multiple dashboards
 * 
 * @param {Object} props
 * @param {Array} props.patients - Array of patient objects in the queue
 * @param {Object} props.statistics - Queue statistics (totalOnHold, needingDrops, waitingForDilation, readyToResume)
 * @param {boolean} props.loading - Loading state for initial data fetch
 * @param {boolean} props.fetching - Fetching state for background updates
 * @param {Object} props.error - Error object if fetch failed
 * @param {Function} props.onRefresh - Callback to refresh queue data
 * @param {Function} props.onApplyEyeDrops - Callback when applying eye drops (patient, useCustomTimer)
 * @param {Function} props.onRepeatDilation - Callback for repeating dilation
 * @param {Function} props.onMarkReady - Callback for marking patient ready
 * @param {Object} props.applyEyeDropsMutation - TanStack mutation object for applying eye drops
 * @param {string} props.themeColor - Primary theme color (default: 'orange')
 * @param {string} props.gradientFrom - Gradient start color (default: 'from-orange-50')
 * @param {string} props.gradientTo - Gradient end color (default: 'to-yellow-50')
 */
const EyeDropsQueue = ({
  patients = [],
  statistics = {},
  loading = false,
  fetching = false,
  error = null,
  onRefresh,
  onApplyEyeDrops,
  onRepeatDilation,
  onMarkReady,
  applyEyeDropsMutation,
  themeColor = 'orange',
  gradientFrom = 'from-orange-50',
  gradientTo = 'to-yellow-50'
}) => {
  const queryClient = useQueryClient();

  // Timer settings
  const [defaultTimerDuration, setDefaultTimerDuration] = useState(() => {
    const saved = localStorage.getItem('eyeDropTimerDuration');
    return saved ? parseInt(saved) : 10;
  });
  const [showTimerSettings, setShowTimerSettings] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roundFilter, setRoundFilter] = useState('all');

  // Extract statistics with fallbacks
  const totalOnHold = statistics?.totalOnHold || 0;
  const needingDrops = statistics?.needingDrops || 0;
  const waitingForDilation = statistics?.waitingForDilation || 0;
  const readyToResume = statistics?.readyToResume || 0;

  // Filter patients based on search, status, and round
  const getFilteredPatients = () => {
    let filtered = patients;

    // Apply search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.patient?.fullName?.toLowerCase().includes(query) ||
        patient.visit?.tokenNumber?.toString().includes(query) ||
        patient.patient?.patientNumber?.toLowerCase().includes(query) ||
        patient.holdReason?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'needs_drops') {
        filtered = filtered.filter(p => p.timing?.needsDrops);
      } else if (statusFilter === 'waiting') {
        filtered = filtered.filter(p => p.timing?.dropsApplied && !p.timing?.markedReady);
      } else if (statusFilter === 'ready') {
        filtered = filtered.filter(p => {
          const estimatedTime = p.estimatedResumeTime || p.timing?.estimatedResumeTime;
          return estimatedTime && new Date(estimatedTime) <= new Date();
        });
      }
    }

    // Apply round filter
    if (roundFilter !== 'all') {
      const targetRound = parseInt(roundFilter);
      filtered = filtered.filter(p => Math.max(p.timing?.dilationRound || 0, 1) === targetRound);
    }

    return filtered;
  };

  const filteredPatients = getFilteredPatients();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${themeColor}-600`}></div>
        <span className="ml-3">Loading eye drop queue...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="flex flex-col flex-1 overflow-hidden">
        <CardHeader className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} border-b border-gray-200 flex-shrink-0`}>
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${fetching ? `bg-${themeColor}-500 animate-pulse` : 'bg-green-500'}`}></div>
              <Eye className={`h-5 w-5 mr-2 text-${themeColor}-600`} />
              Eye Drops Queue - ON HOLD Patients
              {fetching && (
                <span className={`text-sm text-${themeColor}-500 ml-2 font-normal flex items-center`}>
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  Updating...
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`bg-${themeColor}-50 text-${themeColor}-700 border-${themeColor}-300`}>
                {totalOnHold} Total
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                {needingDrops} Need Drops
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {waitingForDilation} Waiting
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                {readyToResume} Ready
              </Badge>
              <Badge variant="outline">
                {filteredPatients.length} Result{filteredPatients.length !== 1 ? 's' : ''}
              </Badge>
              
              {/* Timer Settings Dialog */}
              <Dialog open={showTimerSettings} onOpenChange={setShowTimerSettings}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9"
                    title="Default Timer Settings"
                  >
                    <Timer className="h-4 w-4 mr-1" />
                    Default: {defaultTimerDuration}m
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Timer className={`h-5 w-5 text-${themeColor}-600`} />
                      <span>Default Timer Settings</span>
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="timer-duration">Default Timer Duration (minutes)</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="timer-duration"
                          type="number"
                          min="1"
                          max="60"
                          value={defaultTimerDuration}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 10;
                            setDefaultTimerDuration(value);
                            localStorage.setItem('eyeDropTimerDuration', value.toString());
                          }}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-500">minutes</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Set the default wait time after applying eye drops. You can customize it for each patient.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <p className="text-sm text-blue-800">
                        An alarm will sound when the timer expires to alert you.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Quick Presets</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 20].map((preset) => (
                          <Button
                            key={preset}
                            size="sm"
                            variant={defaultTimerDuration === preset ? "default" : "outline"}
                            onClick={() => {
                              setDefaultTimerDuration(preset);
                              localStorage.setItem('eyeDropTimerDuration', preset.toString());
                            }}
                          >
                            {preset}m
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setShowTimerSettings(false)}>
                      Done
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={fetching}
                className="h-9"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${fetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Integrated Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name, token, ID, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="needs_drops">Need Drops</SelectItem>
                <SelectItem value="waiting">Waiting for Dilation</SelectItem>
                <SelectItem value="ready">Ready to Resume</SelectItem>
              </SelectContent>
            </Select>
            <Select value={roundFilter} onValueChange={setRoundFilter}>
              <SelectTrigger className="w-full sm:w-40 h-10">
                <SelectValue placeholder="Filter by round" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rounds</SelectItem>
                <SelectItem value="1">Round 1</SelectItem>
                <SelectItem value="2">Round 2</SelectItem>
                <SelectItem value="3">Round 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto tab-content-container pr-2">
          {error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load eye drop queue</h3>
              <p className="text-gray-500 mb-4">{error.message}</p>
              <Button onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : (
            <div className="relative">
              {fetching && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-white bg-opacity-50 z-10 flex items-center justify-center">
                  <div className="flex items-center bg-white rounded-lg shadow-md px-4 py-2">
                    <RefreshCw className={`h-4 w-4 animate-spin text-${themeColor}-500 mr-2`} />
                    <span className={`text-sm text-${themeColor}-500`}>Refreshing queue...</span>
                  </div>
                </div>
              )}
              {filteredPatients.length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">
                    {patients.length === 0 ? 'No Patients on Hold' : 'No Results Found'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {patients.length === 0 
                      ? 'Patients requiring eye drops will appear here' 
                      : 'Try adjusting your search criteria.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPatients.map((patient, index) => (
                    <div key={patient.queueEntryId} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left Section: Patient Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 bg-${themeColor}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                            <span className={`text-sm text-${themeColor}-600 font-semibold`}>
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 truncate">
                                {patient.patient.fullName}
                              </h4>
                              <span className="text-xs text-gray-500 flex-shrink-0">
                                {patient.patient.age}y • {patient.patient.gender?.charAt(0)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                Token: {patient.visit.tokenNumber}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Round {Math.max(patient.timing.dilationRound || 0, 1)}/3
                              </span>
                              <span className="text-xs text-gray-400">
                                • {patient.timing.waitingSinceMinutes}m
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 truncate" title={patient.holdReason || 'N/A'}>
                              Reason: {patient.holdReason || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Right Section: Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Initial: Show Process Patient and Custom buttons */}
                          {patient.timing.needsDrops && (
                            <>
                              <Button
                                size="sm"
                                className={`bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white h-8`}
                                onClick={() => onApplyEyeDrops(patient, false)}
                                disabled={applyEyeDropsMutation?.isPending}
                              >
                                {applyEyeDropsMutation?.isPending ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                    Applying...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Process ({defaultTimerDuration}m)
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className={`h-8 border-${themeColor}-600 text-${themeColor}-600 hover:bg-${themeColor}-50`}
                                onClick={() => onApplyEyeDrops(patient, true)}
                                disabled={applyEyeDropsMutation?.isPending}
                              >
                                <Timer className="h-3 w-3 mr-1" />
                                Custom
                              </Button>
                            </>
                          )}

                          {/* Timer Running or Expired: Show countdown or buttons */}
                          {patient.timing.dropsApplied && !patient.timing.markedReady && (() => {
                            const estimatedTime = patient.estimatedResumeTime || patient.timing.estimatedResumeTime;
                            const isExpired = estimatedTime && new Date(estimatedTime) <= new Date();
                            
                            if (isExpired) {
                              // Timer expired - show buttons
                              return (
                                <div className="flex gap-2">
                                  {/* Show Repeat button if not at round 3 */}
                                  {Math.max(patient.timing.dilationRound || 0, 1) < 3 && (
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                                      onClick={() => onRepeatDilation(patient)}
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1" />
                                      Repeat
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white h-8"
                                    onClick={() => onMarkReady(patient.queueEntryId)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Ready
                                  </Button>
                                </div>
                              );
                            } else {
                              // Timer still running - show countdown
                              return (
                                <div className="text-center">
                                  <CountdownTimer
                                    estimatedResumeTime={estimatedTime}
                                    patientId={patient.queueEntryId}
                                  />
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EyeDropsQueue;
