import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Users, Clock, ArrowUp, ArrowDown, Phone, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useOptometristStore from '@/stores/optometrist';
import { optometristQueueService } from '@/services/optometristQueueService';
import { useOptometristQueueSocket } from '@/hooks/useQueueSocket';
import { toast } from 'sonner';

const NextInLinePanel = () => {
  const { nextInLinePatients, callNextPatient } = useOptometristStore();
  const queryClient = useQueryClient();
  
  // State for discontinue confirmation dialog
  const [discontinueDialogOpen, setDiscontinueDialogOpen] = useState(false);
  const [patientToDiscontinue, setPatientToDiscontinue] = useState(null);

  // 🔌 WebSocket real-time updates
  useOptometristQueueSocket();

  // Fetch queue data from backend - WebSocket handles real-time updates!
  const { data: queueData, isLoading, error, refetch } = useQuery({
    queryKey: ['optometrist-queue'],
    queryFn: optometristQueueService.getOptometristQueue,
    // ❌ REMOVED POLLING - WebSocket handles updates now!
    // refetchInterval: 8000,
    // refetchIntervalInBackground: true,
    refetchOnWindowFocus: true, // Changed to true to refetch when window gains focus
    refetchOnMount: true,
    staleTime: 0, // Changed from 30000 to 0 - always consider data stale for immediate updates
    cacheTime: 30000,
    retry: 2,
    retryDelay: 500,
    networkMode: 'always',
    onSuccess: (data) => {
    },
    onError: (error) => {
    }
  });

  // Call next patient mutation
  const callNextMutation = useMutation({
    mutationFn: optometristQueueService.callNextPatient,
    onMutate: async () => {
      // Show immediate loading toast
      // console.log('🔄 Starting to call next patient...');
      toast.loading('Calling next patient...', {
        id: 'call-next-patient'
      });

      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries(['optometrist-queue']);

      // Snapshot the previous value for potential rollback
      const previousQueueData = queryClient.getQueryData(['optometrist-queue']);

      // Optimistically update the cache to show immediate feedback
      queryClient.setQueryData(['optometrist-queue'], (old) => {
        if (!old?.data?.queueEntries) return old;

        // console.log('🔄 Applying optimistic update for call next patient...');
        
        // Find the first WAITING patient to "call"
        const waitingPatients = old.data.queueEntries.filter(entry => entry.status === 'WAITING');
        
        if (waitingPatients.length > 0) {
          const patientToCall = waitingPatients[0];
          
          // Update the queue entries to move the first waiting patient to called
          const updatedEntries = old.data.queueEntries.map(entry => {
            if (entry.queueEntryId === patientToCall.queueEntryId) {
              return {
                ...entry,
                status: 'CALLED',
                calledAt: new Date().toISOString()
              };
            }
            return entry;
          });

          // Update statistics optimistically
          const updatedStats = {
            ...old.data.statistics,
            waitingPatients: Math.max(0, (old.data.statistics.waitingPatients || 0) - 1),
            calledPatients: (old.data.statistics.calledPatients || 0) + 1
          };

          // console.log('✅ Optimistic update applied - patient moved to CALLED status');

          return {
            ...old,
            data: {
              ...old.data,
              queueEntries: updatedEntries,
              statistics: updatedStats
            }
          };
        }

        return old;
      });

      // Return context for potential rollback
      return { previousQueueData };
    },
    onSuccess: async (data) => {
      // console.log('✅ Next patient called successfully:', data);
      
      // Show success toast with patient name if available
      const patientName = data?.data?.patient?.name || data?.data?.patient?.firstName + ' ' + data?.data?.patient?.lastName;
      
      if (patientName) {
        toast.success(`${patientName} has been called!`, {
          id: 'call-next-patient',
          description: 'Patient is ready for examination',
          duration: 4000
        });
      } else {
        toast.success('Next patient called successfully!', {
          id: 'call-next-patient',
          duration: 3000
        });
      }
      
      // Immediate and aggressive UI update strategy
      
      // Cancel any ongoing queries to prevent conflicts
      await queryClient.cancelQueries(['optometrist-queue']);
      
      // Immediately invalidate and refetch with highest priority
      await queryClient.invalidateQueries(['optometrist-queue']);
      
      // Force immediate refetch of this specific component
      await refetch();
      
    },
    onError: (error, variables, context) => {
      // console.error('❌ Error calling next patient:', error);

      // Rollback optimistic update on error
      if (context?.previousQueueData) {
        queryClient.setQueryData(['optometrist-queue'], context.previousQueueData);
        // console.log('🔄 Rolled back optimistic update due to API error');
      }
      
      // Show error toast
      toast.error('Failed to call next patient', {
        id: 'call-next-patient',
        description: error.message || 'Please try again or contact support',
        duration: 5000
      });
    }
  });

  // Start examination mutation
  const startExaminationMutation = useMutation({
    mutationFn: (queueEntryId) => optometristQueueService.startExamination(queueEntryId),
    onSuccess: (data) => {
      // Refresh the queue after starting examination
      queryClient.invalidateQueries(['optometrist-queue']);
    },
    onError: (error) => {
    }
  });

  // Discontinue examination mutation
  const discontinueExaminationMutation = useMutation({
    mutationFn: ({ queueEntryId, reason }) => 
      optometristQueueService.discontinueExamination(queueEntryId, reason),
    onMutate: async () => {
      toast.loading('Discontinuing examination...', {
        id: 'discontinue-examination'
      });
    },
    onSuccess: async (data) => {
      const patientName = patientToDiscontinue?.name || 'Patient';
      
      toast.success(`${patientName}'s examination has been discontinued`, {
        id: 'discontinue-examination',
        description: 'Visit marked as DISCONTINUED. Patient removed from queue.',
        duration: 5000
      });
      
      // Close the dialog
      setDiscontinueDialogOpen(false);
      setPatientToDiscontinue(null);
      
      // Aggressive UI refresh
      await queryClient.cancelQueries(['optometrist-queue']);
      await queryClient.invalidateQueries(['optometrist-queue']);
      await refetch();
    },
    onError: (error) => {
      console.error('❌ Error discontinuing examination:', error);
      
      toast.error('Failed to discontinue examination', {
        id: 'discontinue-examination',
        description: error.message || 'Please try again or contact support',
        duration: 5000
      });
      
      // Keep dialog open on error so user can retry
    }
  });

  // Get CALLED and IN_PROGRESS patients for "Under Examination" display
  // This ensures patients remain visible even after page refresh
  const getDisplayPatients = () => {
    // If still loading, return empty array to show loading state
    if (isLoading) {
      return [];
    }
    
    if (queueData?.data?.queueEntries) {
      // Debug: Log all queue entries to see what we have
      console.log('📊 All Queue Entries:', queueData.data.queueEntries.map(e => ({ 
        id: e.queueEntryId, 
        name: e.patient?.fullName, 
        status: e.status 
      })));
      
      // Get CALLED and IN_PROGRESS patients (patients under examination)
      // CALLED = Called but examination not yet started
      // IN_PROGRESS = Examination actively in progress (modal open)
      const underExaminationPatients = queueData.data.queueEntries
        .filter(entry => entry.status === 'CALLED' || entry.status === 'IN_PROGRESS')
        .sort((a, b) => {
          // Sort by status priority: IN_PROGRESS first (active exams), then CALLED
          if (a.status === 'IN_PROGRESS' && b.status === 'CALLED') return -1;
          if (a.status === 'CALLED' && b.status === 'IN_PROGRESS') return 1;
          
          // Within same status, sort by calledAt/inProgressAt timestamp (earliest first - FIFO)
          const timeA = new Date(a.inProgressAt || a.calledAt).getTime();
          const timeB = new Date(b.inProgressAt || b.calledAt).getTime();
          return timeA - timeB;
        })
        .slice(0, 3)  // Show maximum 3 patients under examination
        .map(entry => optometristQueueService.formatForUI(entry));
      
      console.log('👥 Under Examination Patients:', underExaminationPatients.map(p => ({ 
        name: p.name, 
        status: p.status 
      })));
      
      return underExaminationPatients;
    }
    
    // Only use fallback if API failed (not loading)
    if (error) {
      return nextInLinePatients;
    }
    
    return [];
  };

  const displayPatients = getDisplayPatients();

  // Get count of WAITING patients (not CALLED) to determine if button should be enabled
  const getWaitingPatientsCount = () => {
    if (queueData?.data?.queueEntries) {
      return queueData.data.queueEntries.filter(entry => entry.status === 'WAITING').length;
    }
    return 0;
  };

  const waitingPatientsCount = getWaitingPatientsCount();

  const getWaitTime = (patient) => {
    const now = new Date();
    const waitStart = new Date(patient.waitStartTime);
    return Math.floor((now - waitStart) / (1000 * 60)); // in minutes
  };

  const formatWaitTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getPriorityColor = (priority) => {
    if (priority <= 3) return 'bg-destructive text-destructive-foreground';
    if (priority <= 6) return 'bg-orange-500 text-white';
    return 'bg-muted text-muted-foreground';
  };

  const handleCallNextPatient = () => {
    // console.log('🔄 User clicked Call Next Patient button');
    
    // Check if there are already 3 or more patients under examination (CALLED or IN_PROGRESS status)
    const underExaminationCount = displayPatients.length;
    
    // Additional check: Count IN_PROGRESS patients specifically (should never exceed 3)
    const inProgressCount = displayPatients.filter(p => p.status === 'IN_PROGRESS').length;
    
    if (inProgressCount > 3) {
      toast.error('System Error: Too many concurrent examinations', {
        description: `${inProgressCount} examinations are in progress. This exceeds the system limit of 3. Please contact your administrator.`,
        duration: 8000
      });
      return;
    }
    
    if (underExaminationCount >= 3) {
      toast.error('Maximum examination limit reached', {
        description: `${underExaminationCount} patients are currently under examination (${inProgressCount} active, ${underExaminationCount - inProgressCount} called). Please complete current examinations first.`,
        duration: 6000
      });
      return; // Exit early without making API call
    }
    
    // Call the backend API to call next patient from WAITING queue
    callNextMutation.mutate();
  };

  const handleStartExamination = (patient) => {
    // console.log('🔄 Starting examination for patient:', patient);
    
    // Start examination API call for the called patient
    const queueEntryId = patient.queueEntryId || patient.id;
    startExaminationMutation.mutate(queueEntryId);
    
    // Directly set the selected patient and open modal in the store
    const state = useOptometristStore.getState();
    
    // Prepare patient data for examination modal
    const patientForExam = {
      ...patient,
      status: 'examining',
      examStartTime: new Date().toISOString(),
      auditTrail: [
        ...(patient.auditTrail || []),
        {
          action: 'examination_started',
          timestamp: new Date().toISOString(),
          userId: 'optometrist_user',
          notes: 'Patient examination started from Next in Line panel'
        }
      ]
    };
    
    // Directly update the store to open the modal with the patient
    useOptometristStore.setState({
      selectedPatient: patientForExam,
      isModalOpen: true
    });
    
    // Verify the store was updated
    const newState = useOptometristStore.getState();
    // console.log('✅ Examination modal opened for patient:', patient.name);
  };

  const handleCallPatient = (patientId) => {
    // This is for individual patient call (keeping for compatibility)
    callNextPatient(patientId);
  };

  // Handle discontinue examination button click
  const handleDiscontinueClick = (patient) => {
    setPatientToDiscontinue(patient);
    setDiscontinueDialogOpen(true);
  };

  // Confirm discontinue examination
  const handleConfirmDiscontinue = () => {
    if (!patientToDiscontinue) return;
    
    const queueEntryId = patientToDiscontinue.queueEntryId || patientToDiscontinue.id;
    const reason = 'Patient left hospital without completing examination';
    
    discontinueExaminationMutation.mutate({ queueEntryId, reason });
  };

  return (
    <Card className="bg-white shadow-sm border">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading queue...</span>
          </div>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Users className="h-5 w-5 text-blue-600" />
              Patients Under Examination
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {isLoading ? 'Loading...' : `${displayPatients.length}/3 patients`}
            </Badge>
            {error && (
              <Badge variant="destructive" className="text-xs">
                API Error
              </Badge>
            )}
          </div>
          
          {/* Call Next Patient Button - moved to right side */}
          <div className="flex items-center gap-2">
            {/* <Button
              onClick={() => {
                refetch();
              }}
              variant="outline"
              size="sm"
              title="Manually refresh queue data"
            >
              <Clock className="h-4 w-4 mr-1" />
              Refresh
            </Button> */}
            <Button
              onClick={handleCallNextPatient}
              disabled={callNextMutation.isLoading || isLoading || waitingPatientsCount === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              size="sm"
              title={waitingPatientsCount === 0 ? 'No patients waiting in queue' : 'Call next patient from waiting queue'}
            >
              {callNextMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Calling...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Next Patient
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 mb-3.5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100 pr-2 mr-2">        
        {displayPatients.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {error ? (
              <>
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50 text-red-500" />
                <p className="text-sm">Failed to load examination queue</p>
                <p className="text-xs mt-1">Using fallback data if available</p>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No patients under examination</p>
                <p className="text-xs mt-1">Call next patient to begin examination</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 pr-2 pb-3">
            {displayPatients.map((patient, index) => {
              const isInProgress = patient.status === 'IN_PROGRESS';
              const isCalled = patient.status === 'CALLED';
              
              return (
                <Card key={patient.id} className={`transition-all duration-200 hover:shadow-md border ${
                  isInProgress
                    ? 'ring-2 ring-green-500 bg-green-50/50'
                    : index === 0 
                      ? 'ring-2 ring-blue-500 bg-blue-50/50' 
                      : 'bg-white'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isInProgress
                              ? 'bg-green-600 text-white animate-pulse'
                              : index === 0 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                          {isInProgress ? (
                            <Badge variant="default" className="text-xs mt-1 bg-green-600">
                              IN EXAM
                            </Badge>
                          ) : index === 0 && (
                            <Badge variant="default" className="text-xs mt-1">
                              NEXT
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-base mb-1">{patient.name}</h4>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>Age: {patient.age}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatWaitTime(getWaitTime(patient))}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isCalled && (
                          <Button
                            size="sm"
                            onClick={() => handleStartExamination(patient)}
                            disabled={startExaminationMutation.isLoading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {startExaminationMutation.isLoading ? 'Starting...' : 'Start Examination'}
                          </Button>
                        )}
                        {isInProgress && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleStartExamination(patient)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Continue Examination
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDiscontinueClick(patient)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Discontinue
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  
                  {index === 0 && patient.priority <= 3 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-xs text-red-700 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Priority Case: {patient.priorityDescription || patient.priorityLabel}
                      </p>
                    </div>
                  )}

                  {patient.overrideReason && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-xs text-amber-800 font-medium flex items-center gap-1">
                        <ArrowUp className="h-3 w-3" />
                        Override Applied: {patient.overrideReason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
        
        {displayPatients.length > 0 && (
          <div className="text-center pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              🟢 Green badge = Examination in progress • 🔵 Blue highlight = Ready to start
            </p>
          </div>
        )}
      </CardContent>
      
      {/* Discontinue Examination Confirmation Dialog */}
      <AlertDialog open={discontinueDialogOpen} onOpenChange={setDiscontinueDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Discontinue Examination?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <div className="text-sm">
                You are about to discontinue the examination for:
              </div>
              {patientToDiscontinue && (
                <div className="bg-gray-50 p-3 rounded-md border">
                  <p className="font-semibold text-gray-900">{patientToDiscontinue.name}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Age: {patientToDiscontinue.age} • MRN: {patientToDiscontinue.mrn}
                  </p>
                </div>
              )}
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                <p className="font-semibold mb-1">⚠️ This action will:</p>
                <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                  <li>Mark the patient's visit as <strong>DISCONTINUED</strong></li>
                  <li>Remove the patient from the optometry queue</li>
                  <li>End the patient's visit for today</li>
                  <li>Prevent progression to doctor consultation</li>
                </ul>
              </div>
              <p className="text-sm font-medium text-gray-700">
                Use this only when a patient has left the hospital without completing their examination.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={discontinueExaminationMutation.isLoading}
              onClick={() => {
                setDiscontinueDialogOpen(false);
                setPatientToDiscontinue(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDiscontinue}
              disabled={discontinueExaminationMutation.isLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {discontinueExaminationMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Discontinuing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Discontinue Examination
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default NextInLinePanel;