import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search,
  Filter,
  AlertTriangle,
  Baby,
  Users,
  Clock,
  Eye,
  Stethoscope,
  AlertCircle,
  Timer,
  ChevronUp,
  ChevronDown,
  UserCheck,
  RefreshCw,
  CalendarCheck,
  Activity,
  Scissors,
  GripVertical,
  User,
  Phone,
  Mail,
  ClipboardList,
  Calendar as CalendarIcon,
  FastForward,
  CalendarDays,
  Maximize2,
  X
} from 'lucide-react';
import useOptometristStore from '@/stores/optometrist';
import NextInLinePanel from './NextInLinePanel';
import NextInLineQueueManagement from './NextInLineQueueManagement';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { optometristQueueService } from '@/services/optometristQueueService';
import { useOptometristQueueSocket } from '@/hooks/useQueueSocket';
import { socket } from '@/lib/socket';
import { toast } from 'sonner';

// DnD Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

// Queue Patient Details Modal Component
const QueuePatientDetailsModal = ({ queuePatient, isOpen, onClose }) => {
  if (!queuePatient) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const isQueueManagementNote = (note) => {
    if (!note) return false;
    const queueManagementKeywords = [
      'reordered', 'moved up', 'moved down', 'priority changed',
      'position changed', 'queue', 'management'
    ];
    return queueManagementKeywords.some(keyword =>
      note.toLowerCase().includes(keyword)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <span>Queue Patient Details - {queuePatient.patient?.fullName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <span>Patient Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Patient Number</Label>
                  <p className="text-lg font-bold text-blue-600">#{queuePatient.patient?.patientNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                  <p className="text-lg font-semibold">{queuePatient.patient?.fullName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                  <p>{formatDate(queuePatient.patient?.dateOfBirth)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Gender</Label>
                  <p className="capitalize">{queuePatient.patient?.gender || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                  <p className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span>{queuePatient.patient?.phone || 'Not provided'}</span>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span>{queuePatient.patient?.email || 'Not provided'}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Queue Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ClipboardList className="h-4 w-4 text-purple-600" />
                <span>Queue Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Queue Position</Label>
                  <p className="text-lg font-bold text-purple-600">#{queuePatient.queueNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Queue Status</Label>
                  <Badge className={
                    queuePatient.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800' :
                      queuePatient.status === 'CALLED' ? 'bg-blue-100 text-blue-800' :
                        queuePatient.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' :
                          queuePatient.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                  }>
                    {queuePatient.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Priority</Label>
                  <Badge className={
                    queuePatient.priorityLabel === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                      queuePatient.priorityLabel === 'PRIORITY' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                  }>
                    {queuePatient.priorityLabel}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Joined Queue</Label>
                  <p>{formatDateTime(queuePatient.joinedAt)}</p>
                </div>
                {queuePatient.calledAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Called At</Label>
                    <p>{formatDateTime(queuePatient.calledAt)}</p>
                  </div>
                )}
                {queuePatient.inProgressAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Started At</Label>
                    <p>{formatDateTime(queuePatient.inProgressAt)}</p>
                  </div>
                )}
                {queuePatient.estimatedWaitTime && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Estimated Wait</Label>
                    <p>{queuePatient.estimatedWaitTime} minutes</p>
                  </div>
                )}
              </div>

              {queuePatient.assignedStaff && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <Label className="text-sm font-medium text-blue-600">Assigned Staff</Label>
                  <p className="font-medium">{queuePatient.assignedStaff?.name || 'Not assigned'}</p>
                  <p className="text-sm text-blue-600 capitalize">{queuePatient.assignedStaff?.staffType || 'N/A'}</p>
                </div>
              )}

              {queuePatient.notes && !isQueueManagementNote(queuePatient.notes) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                  <Label className="text-sm font-medium text-gray-600">Notes</Label>
                  <p className="text-sm text-gray-600 mt-1">{queuePatient.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-green-600" />
                <span>Appointment Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Token Number</Label>
                  <p className="text-lg font-bold text-green-600">{queuePatient.appointment?.tokenNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Appointment Time</Label>
                  <p>{queuePatient.appointment?.appointmentTime}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Appointment Type</Label>
                  <p className="capitalize">{queuePatient.appointment?.appointmentType || 'Standard'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Purpose</Label>
                  <p>{queuePatient.appointment?.purpose || 'General consultation'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span>Visit Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Visit Number</Label>
                  <p className="font-medium">#{queuePatient.visit?.visitNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Visit Type</Label>
                  <p className="capitalize">{queuePatient.visit?.visitType || 'OPD'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Visit Status</Label>
                  <Badge className={
                    queuePatient.visit?.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800' :
                      queuePatient.visit?.status === 'WITH_OPTOMETRIST' ? 'bg-green-100 text-green-800' :
                        queuePatient.visit?.status === 'AWAITING_DOCTOR' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                  }>
                    {queuePatient.visit?.status?.replace('_', ' ') || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Check-in Time</Label>
                  <p>{formatDateTime(queuePatient.visit?.checkedInAt)}</p>
                </div>
              </div>

              {queuePatient.doctor && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <Label className="text-sm font-medium text-green-600">Assigned Doctor</Label>
                  <p className="font-medium">{queuePatient.doctor?.name || 'Not assigned'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PriorityQueuePanel = () => {
  const {
    activePatients,
    queueFilters,
    setQueueFilter,
    getFilteredActivePatients,
    searchPatients,
    startExam,
    updatePatientPriority,
    checkWaitTimes,
    getPatientStatistics,
    movePatientUp,
    movePatientDown,
    reorderQueue
  } = useOptometristStore();

  // State for queue patient details modal
  const [selectedQueuePatient, setSelectedQueuePatient] = useState(null);
  const [queuePatientDetailsOpen, setQueuePatientDetailsOpen] = useState(false);

  // State for move to next-in-line confirmation modal
  const [moveToNextInLinePatient, setMoveToNextInLinePatient] = useState(null);
  const [moveToNextInLineModalOpen, setMoveToNextInLineModalOpen] = useState(false);

  // State for FCFS confirmation dialog
  const [fcfsDialogOpen, setFcfsDialogOpen] = useState(false);

  // State for focus mode
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Track socket connection status for fallback polling
  const [isSocketConnected, setIsSocketConnected] = useState(true);

  const queryClient = useQueryClient();

  // 🔌 WebSocket real-time updates
  useOptometristQueueSocket();

  useEffect(() => {
    const handleConnect = () => {
      console.log('✅ Socket connected - disabling fallback polling');
      setIsSocketConnected(true);
    };
    
    const handleDisconnect = () => {
      console.log('⚠️ Socket disconnected - enabling fallback polling');
      setIsSocketConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    setIsSocketConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  // DnD Kit sensors for drag and drop functionality
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle viewing queue patient details
  const handleViewQueuePatient = (patient) => {
    setSelectedQueuePatient(patient);
    setQueuePatientDetailsOpen(true);
  };

  // Handle move to next-in-line confirmation
  const handleMoveToNextInLine = (patient) => {
    setMoveToNextInLinePatient(patient);
    setMoveToNextInLineModalOpen(true);
  };

  // Confirm move to next-in-line
  const confirmMoveToNextInLine = () => {
    if (moveToNextInLinePatient) {
      moveToNextInLineMutation.mutate({
        queueEntryId: moveToNextInLinePatient.queueEntryId,
        patientName: moveToNextInLinePatient.patient?.fullName
      });
    }
  };

  // Handle Apply FCFS button click
  const handleApplyFCFS = () => {
    setFcfsDialogOpen(true);
  };

  // Confirm FCFS application
  const confirmApplyFCFS = () => {
    applyFCFSMutation.mutate();
    setFcfsDialogOpen(false);
  };

  // Reorder queue mutation
  const reorderQueueMutation = useMutation({
    mutationFn: ({ reorderedEntries, reason }) => optometristQueueService.reorderQueue(reorderedEntries, reason),
    onSuccess: (data, variables) => {

      // Show appropriate toast message based on the type of reorder
      const { reason } = variables;
      const isPriorityGroupReorder = reason && reason !== 'Direct queue reorder via drag and drop';

      if (isPriorityGroupReorder) {
        toast.success('Priority Group Reordered', {
          description: `Queue order updated successfully. Reason: ${reason}`,
          duration: 4000,
        });
      } else {
        toast.success('Queue Reordered', {
          description: `${data?.data?.updatedEntries?.length || 'Patients'} patients reordered successfully`,
          duration: 3000,
        });
      }

      // Refresh the queue data
      queryClient.invalidateQueries(['optometrist-queue']);
    },
    onError: (error) => {

      toast.error('Reorder Failed', {
        description: error.message || 'Failed to reorder queue. Please try again.',
        duration: 4000,
      });

      // Refresh to get latest state
      queryClient.invalidateQueries(['optometrist-queue']);
    }
  });

  // Move to Next-in-Line mutation - Move patient to first waiting position in Next-in-Line
  const moveToNextInLineMutation = useMutation({
    mutationFn: async ({ queueEntryId, patientName }) => {
      const allPatients = getCompleteQueueData(); // Get all queue patients

      if (!allPatients || allPatients.length === 0) {
        throw new Error('No patients found in queue');
      }

      const targetPatient = allPatients.find(p => p.queueEntryId === queueEntryId);
      
      if (!targetPatient) {
        throw new Error('Patient not found in queue');
      }


      // Separate patients by status
      const otherPatients = allPatients.filter(p => p.queueEntryId !== queueEntryId);
      const activePatients = otherPatients.filter(p => p.status === 'CALLED' || p.status === 'IN_PROGRESS');
      const waitingPatients = otherPatients.filter(p => p.status === 'WAITING');


      // Find optimal insertion position: first waiting position after active patients
      let targetPosition = 1;
      
      
      // Find the highest position occupied by active patients in range 1-3
      const activePositions = activePatients
        .filter(p => p.queueNumber <= 3)
        .map(p => p.queueNumber)
        .sort((a, b) => a - b);
      
      if (activePositions.length > 0) {
        // Insert right after the last active patient
        targetPosition = activePositions[activePositions.length - 1] + 1;
      } else {
        // No active patients, insert at position 1
        targetPosition = 1;
      }


      // Build reorder payload - ONLY WAITING PATIENTS
      const reorderedPatients = [];
      

      // Place target patient at insertion position
      reorderedPatients.push({
        queueEntryId: targetPatient.queueEntryId,
        currentQueueNumber: targetPatient.queueNumber,
        newQueueNumber: targetPosition
      });

      // Reposition other waiting patients
      let nextPosition = targetPosition + 1;
      
      waitingPatients
        .sort((a, b) => a.queueNumber - b.queueNumber)
        .forEach(patient => {
          // Skip positions occupied by active patients
          while (activePatients.some(ap => ap.queueNumber === nextPosition)) {
            nextPosition++;
          }
          
          reorderedPatients.push({
            queueEntryId: patient.queueEntryId,
            currentQueueNumber: patient.queueNumber,
            newQueueNumber: nextPosition
          });
          nextPosition++;
        });

      // Sort by new position
      reorderedPatients.sort((a, b) => a.newQueueNumber - b.newQueueNumber);

      reorderedPatients.forEach(entry => {
        const patient = allPatients.find(p => p.queueEntryId === entry.queueEntryId);
      });

      // Validate: check for duplicate positions
      const newPositions = reorderedPatients.map(p => p.newQueueNumber);
      const uniquePositions = new Set(newPositions);
      if (uniquePositions.size !== newPositions.length) {
        const duplicates = newPositions.filter((pos, idx) => newPositions.indexOf(pos) !== idx);
        throw new Error('Queue reordering error: duplicate positions detected');
      }


      return optometristQueueService.reorderQueue(reorderedPatients, `Priority escalation - ${patientName} moved to Next-in-Line position ${targetPosition}`);
    },
    onSuccess: (data, variables) => {
      toast.success('Moved to Next-in-Line', {
        description: `${variables.patientName} moved to Next-in-Line panel`,
        duration: 3000,
      });

      // Refresh the queue data to update both panels
      queryClient.invalidateQueries(['optometrist-queue']);
      queryClient.invalidateQueries(['next-in-line']);
      
      // Close modal
      setMoveToNextInLineModalOpen(false);
      setMoveToNextInLinePatient(null);
    },
    onError: (error) => {
      toast.error('Move Failed', {
        description: error.message || 'Failed to move patient to Next-in-Line. Please try again.',
        duration: 4000,
      });

      // Refresh to get latest state
      queryClient.invalidateQueries(['optometrist-queue']);
      
      // Keep modal open on error so user can try again
    }
  });

  // Bring to top mutation - Move patient to position 4 (top of PriorityQueue, not NextInLine)
  const bringToTopMutation = useMutation({
    mutationFn: async ({ queueEntryId, patientName, reason }) => {
      const allPatients = getCompleteQueueData(); // Get all queue patients

      const targetPatient = allPatients.find(p => p.queueEntryId === queueEntryId);
      const otherPatients = allPatients.filter(p => p.queueEntryId !== queueEntryId);

      if (!targetPatient) {
        throw new Error('Patient not found in queue');
      }

      // Create new order: positions 1-3 stay same, target patient goes to position 4, rest shift down
      const reorderedPatients = [];

      // Keep first 3 patients in their positions (NextInLine positions)
      for (let i = 0; i < Math.min(3, otherPatients.length); i++) {
        reorderedPatients.push({
          queueEntryId: otherPatients[i].queueEntryId,
          newQueueNumber: i + 1
        });
      }

      // Place target patient at position 4 (top of PriorityQueue)
      reorderedPatients.push({
        queueEntryId: targetPatient.queueEntryId,
        newQueueNumber: 4
      });

      // Place remaining patients from position 5 onwards
      const remainingPatients = otherPatients.slice(3);
      remainingPatients.forEach((patient, index) => {
        reorderedPatients.push({
          queueEntryId: patient.queueEntryId,
          newQueueNumber: 5 + index
        });
      });


      return optometristQueueService.reorderQueue(reorderedPatients, reason);
    },
    onSuccess: (data, variables) => {
      toast.success('Moved to Top', {
        description: `${variables.patientName} moved to position 4`,
        duration: 3000,
      });

      // Refresh the queue data
      queryClient.invalidateQueries(['optometrist-queue']);
    },
    onError: (error) => {
      toast.error('Move Failed', {
        description: error.message || 'Failed to move patient to top. Please try again.',
        duration: 4000,
      });

      // Refresh to get latest state
      queryClient.invalidateQueries(['optometrist-queue']);
    }
  });

  // Apply FCFS mutation - Reorder queue from position 4 onwards based on joinedAt timestamp
  const applyFCFSMutation = useMutation({
    mutationFn: () => optometristQueueService.applyFCFS(),
    onSuccess: (data) => {
      toast.success('FCFS Applied Successfully', {
        description: `Queue reordered from position 4 onwards based on arrival time`,
        duration: 3000,
      });

      // Refresh the queue data
      queryClient.invalidateQueries(['optometrist-queue']);
    },
    onError: (error) => {
      toast.error('FCFS Application Failed', {
        description: error.message || 'Failed to apply first-come-first-served ordering. Please try again.',
        duration: 4000,
      });

      // Refresh to get latest state
      queryClient.invalidateQueries(['optometrist-queue']);
    }
  });

  // Fetch optometrist queue data from API - WebSocket handles real-time updates!
  const { data: queueData, isLoading: queueLoading, error: queueError, refetch: refetchQueue } = useQuery({
    queryKey: ['optometrist-queue'],
    queryFn: optometristQueueService.getOptometristQueue,
    // Background polling disabled - WebSocket provides real-time updates via setQueryData
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true, // Refetch when user focuses window
    refetchOnMount: true, // Always refetch on mount
    refetchOnReconnect: true, // Refetch when reconnecting
    staleTime: 0, // No caching - always fresh
    gcTime: 0, // No garbage collection time (was cacheTime in v4)
    retry: 2,
    retryDelay: 500,
    networkMode: 'always',
    onSuccess: (data) => {
      // console.log('✅ Queue data loaded for main queue:', data);
    },
    onError: (error) => {
    }
  });

  // Start examination mutation
  const startExaminationMutation = useMutation({
    mutationFn: (queueEntryId) => optometristQueueService.startExamination(queueEntryId),
    onSuccess: () => {
      // Refresh the queue after starting examination
      queryClient.invalidateQueries(['optometrist-queue']);
    },
    onError: (error) => {
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('all');

  // Get API patients or fallback to store data - Show patients from 4th position onwards
  const getAPIPatients = () => {
    // If still loading, return empty array to show loading state
    if (queueLoading) {
      return [];
    }

    if (queueData?.data?.queueEntries) {
      const waitingEntries = queueData.data.queueEntries
        .filter(entry => entry.status === 'WAITING') // Show only waiting patients in main queue
        .slice(3); // Start from 4th position (index 3) onwards


      // Use the API data directly since it's already well formatted

      return waitingEntries;
    }

    // Only use fallback if API failed (not loading) - also slice for 4th position onwards
    if (queueError) {
      return activePatients.slice(3);
    }

    return [];
  };

  // Get complete queue data for NextInLineQueueManagement (all patients, not sliced)
  const getCompleteQueueData = () => {
    // If still loading, return empty array to show loading state
    if (queueLoading) {
      return [];
    }

    if (queueData?.data?.queueEntries) {
      const waitingEntries = queueData.data.queueEntries
        .filter(entry => entry.status === 'WAITING'); // Show only waiting patients, but all of them


      return waitingEntries;
    }

    // Only use fallback if API failed (not loading) - return all patients
    if (queueError) {
      return activePatients;
    }

    return [];
  };

  // Helper function to calculate patient age
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Helper function to calculate wait time in minutes
  const calculateWaitTime = (joinedAt) => {
    if (!joinedAt) return 0;
    const now = new Date();
    const waitStart = new Date(joinedAt);
    return Math.floor((now - waitStart) / (1000 * 60)); // in minutes
  };

  // Filter patients by priorityLabel from API response with automatic categorization
  const filterPatientsByTab = (patients, tabValue) => {
    if (!patients || patients.length === 0) return [];

    switch (tabValue) {
      case 'all':
        return patients;
      case 'priority':
        return patients.filter(p =>
          p.priorityLabel === 'PRIORITY'
        );
      case 'emergency':
        return patients.filter(p =>
          p.priorityLabel === 'EMERGENCY'
        );
      case 'children':
        // Auto-calculate: Children are patients under 12 years old
        return patients.filter(p => {
          const age = calculateAge(p.patient?.dateOfBirth);
          return age !== null && age < 12;
        });
      case 'seniors':
        // Auto-calculate: Seniors are patients 60 years or older
        return patients.filter(p => {
          const age = calculateAge(p.patient?.dateOfBirth);
          return age !== null && age >= 60;
        });
      case 'longwait':
        // Auto-calculate: Long wait patients waiting more than 2 hours (120 minutes)
        return patients.filter(p => {
          const waitTime = calculateWaitTime(p.joinedAt);
          return waitTime > 120;
        });
      case 'referral':
        return patients.filter(p =>
          p.priorityLabel === 'REFERRAL'
        );
      case 'followup':
        return patients.filter(p =>
          p.priorityLabel === 'FOLLOWUP'
        );
      case 'routine':
        return patients.filter(p =>
          p.priorityLabel === 'ROUTINE'
        );
      case 'prepostop':
        return patients.filter(p =>
          p.priorityLabel === 'PREPOSTOP'
        );
      case 'scheduled':
        return patients.filter(p =>
          p.appointment?.notes?.toLowerCase().includes('scheduled appointment')
        );
      default:
        return patients;
    }
  };

  // Update filtered patients when search term, API data, or active tab changes
  useEffect(() => {
    const apiPatients = getAPIPatients();

    if (searchTerm.trim()) {
      // If there's a search term, filter by search and then by tab
      const searchResults = apiPatients.filter(patient =>
        patient.patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient.patientNumber.toString().includes(searchTerm) ||
        patient.appointment?.tokenNumber?.includes(searchTerm)
      );
      const finalResults = filterPatientsByTab(searchResults, activeTab);
      setFilteredPatients(finalResults);
    } else {
      // No search term, just filter by tab
      const finalResults = filterPatientsByTab(apiPatients, activeTab);
      setFilteredPatients(finalResults);
    }

    // Update stats using API data or fallback
    if (queueData?.data?.statistics) {
      setStats({
        total: queueData.data.statistics.totalPatients,
        emergency: apiPatients.filter(p =>
          p.visitData?.visitType === 'Emergency'
        ).length,
        averageWaitTime: Math.round(apiPatients.reduce((sum, p) => {
          const waitTime = (new Date() - new Date(p.waitStartTime)) / (1000 * 60);
          return sum + waitTime;
        }, 0) / (apiPatients.length || 1))
      });
    } else {
      setStats(getPatientStatistics());
    }
  }, [searchTerm, queueData, activeTab]);

  // Check wait times periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkWaitTimes();
      setStats(getPatientStatistics());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Drag and drop handlers
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const currentPatients = filteredPatients;
    const activeIndex = currentPatients.findIndex(p => p.queueEntryId === active.id);
    const overIndex = currentPatients.findIndex(p => p.queueEntryId === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      const movedPatient = currentPatients[activeIndex];

      // Temporarily update local state for smooth UX
      const newOrder = arrayMove(currentPatients, activeIndex, overIndex);
      setFilteredPatients(newOrder);

      // Show loading toast
      const loadingToastId = toast.loading('Reordering Queue...', {
        description: `Moving ${movedPatient.patient?.fullName || 'Patient'} to new position`,
      });

      // Prepare reorder data for API - matching NextInLineQueueManagement structure
      const reorderedEntries = newOrder.map((patient, index) => ({
        queueEntryId: patient.queueEntryId,
        currentQueueNumber: patient.queueNumber,
        newQueueNumber: 4 + index // Positions start from 4 since we show from 4th position onwards
      }));

      // Send to API with proper structure
      reorderQueueMutation.mutate({
        reorderedEntries,
        reason: 'Direct queue reorder via drag and drop'
      }, {
        onSettled: () => {
          // Dismiss loading toast
          toast.dismiss(loadingToastId);
        }
      });
    }
  };

  // Priority group reordering functions
  const bringPriorityGroupToTop = (priorityLabel) => {
    const allPatients = getAPIPatients();
    const priorityPatients = allPatients.filter(p => p.priorityLabel === priorityLabel);
    const nonPriorityPatients = allPatients.filter(p => p.priorityLabel !== priorityLabel);

    if (priorityPatients.length === 0) {
      toast.info(`No ${priorityLabel.toLowerCase()} patients found in this range`);
      return;
    }

    const reorderedPatients = [...priorityPatients, ...nonPriorityPatients];

    // Show loading toast
    const loadingToastId = toast.loading(`Bringing ${priorityLabel.toLowerCase()} patients to top...`);

    // Prepare reorder data matching API expectations
    const reorderedEntries = reorderedPatients.map((patient, index) => ({
      queueEntryId: patient.queueEntryId,
      currentQueueNumber: patient.queueNumber,
      newQueueNumber: 4 + index // Start from position 4
    }));

    // Call API to reorder
    reorderQueueMutation.mutate({
      reorderedEntries,
      reason: `Brought ${priorityLabel} patients to top of queue`
    }, {
      onSettled: () => {
        toast.dismiss(loadingToastId);
      }
    });
  };

  // Handle moving single patient to top of PriorityQueue (position 4)
  const handleBringPatientToTop = (queueEntryId, patientName) => {
    bringToTopMutation.mutate({
      queueEntryId,
      patientName,
      reason: `Priority escalation - ${patientName} moved to top`
    });
  };

  // Helper functions
  const getWaitTime = (patient) => {
    const now = new Date();
    const waitStart = new Date(patient.joinedAt); // Use joinedAt from API response
    return Math.floor((now - waitStart) / (1000 * 60)); // in minutes
  };

  const formatWaitTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const isQueueManagementNote = (note) => {
    if (!note) return false;
    const queueManagementKeywords = [
      'reordered', 'moved up', 'moved down', 'priority changed',
      'position changed', 'queue', 'management'
    ];
    return queueManagementKeywords.some(keyword =>
      note.toLowerCase().includes(keyword)
    );
  };

  const getPriorityIcon = (priority) => {
    if (priority <= 3) return AlertTriangle;
    if (priority <= 6) return Clock;
    return Timer;
  };

  const getStatusIcon = (patient) => {
    return patient.status === 'examining' ? Stethoscope : Clock;
  };

  // Sortable Patient Item Component for drag and drop
  const SortablePatientItem = ({ patient, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: patient.queueEntryId });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const waitTime = getWaitTime(patient);
    const actualPosition = patient.queueNumber || (4 + index); // Use actual queue number from API

    // Map priority label to priority number for UI compatibility
    const getPriorityNumber = (priorityLabel) => {
      switch (priorityLabel) {
        case 'EMERGENCY': return 1;
        case 'PRIORITY': return 2;
        case 'CHILDREN': return 3;
        case 'SENIORS': return 3;
        case 'LONGWAIT': return 4;
        case 'REFERRAL': return 5;
        case 'FOLLOWUP': return 6;
        case 'PREPOSTOP': return 7;
        case 'ROUTINE': return 8;
        default: return 8;
      }
    };

    // Get background color based on priority label --
    const getPriorityBackgroundColor = (priorityLabel) => {
      switch (priorityLabel) {
        case 'EMERGENCY': return 'bg-red-50 border-red-200 hover:bg-red-100';
        case 'PRIORITY': return 'bg-orange-50 border-orange-200 hover:bg-orange-100';
        case 'CHILDREN': return 'bg-purple-50 border-purple-200 hover:bg-purple-100';
        case 'SENIORS': return 'bg-amber-50 border-amber-200 hover:bg-amber-100';
        case 'LONGWAIT': return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
        case 'REFERRAL': return 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100';
        case 'FOLLOWUP': return 'bg-green-50 border-green-200 hover:bg-green-100';
        case 'PREPOSTOP': return 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100';
        case 'ROUTINE': return 'bg-teal-50 border-teal-200 hover:bg-teal-100';
        default: return 'bg-white border hover:bg-gray-50';
      }
    };

    const priorityNumber = getPriorityNumber(patient.priorityLabel);
    const PriorityIcon = getPriorityIcon(priorityNumber);
    const StatusIcon = getStatusIcon(patient);
    const priorityBackgroundColor = getPriorityBackgroundColor(patient.priorityLabel);

    return (
      <div ref={setNodeRef} style={style}>
        <Card className={`transition-all duration-200 hover:shadow-md ${priorityBackgroundColor} border ${isDragging ? 'ring-2 ring-blue-500' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Drag handle */}
              <div
                {...attributes}
                {...listeners}
                className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded cursor-move mr-2"
                title="Drag to reorder"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>

              <div className="flex items-center space-x-4 flex-1">
                {/* Queue Position */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-700">{actualPosition}</span>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">Position</span>
                </div>

                {/* Priority Indicator */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${priorityNumber <= 3 ? 'bg-red-100' :
                      priorityNumber <= 6 ? 'bg-orange-100' : 'bg-blue-100'
                    }`}>
                    <PriorityIcon className={`h-5 w-5 ${priorityNumber <= 3 ? 'text-red-600' :
                        priorityNumber <= 6 ? 'text-orange-600' : 'text-blue-600'
                      }`} />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">P{priorityNumber}</span>
                </div>

                {/* Patient Information */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-bold text-lg text-gray-800">{patient.patient.fullName}</h4>
                    <Badge variant="outline" className="text-xs bg-gray-100 border-gray-300 text-gray-700">
                      {patient.patient.gender}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <span className="font-medium">MRN: {patient.patient.patientNumber}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <StatusIcon className="h-4 w-4" />
                      <span className="capitalize">{patient.status === 'IN_PROGRESS' ? 'In Progress' : 'Waiting'}</span>
                    </div>
                    <span>•</span>
                    <span className="capitalize">
                      {patient.visit?.visitType || patient.appointment?.appointmentType || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 mt-2">
                    <Badge className={`text-xs ${priorityNumber <= 3 ? 'bg-red-600' :
                        priorityNumber <= 6 ? 'bg-orange-600' : 'bg-blue-600'
                      } text-white`}>
                      {patient.appointment?.tokenNumber || 'No Token'}
                    </Badge>

                    <Badge variant="outline" className={`text-xs ${waitTime > 60 ? 'border-red-500 text-red-700' :
                        waitTime > 30 ? 'border-orange-500 text-orange-700' :
                          'border-slate-500 text-slate-700'
                      }`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {formatWaitTime(waitTime)}
                    </Badge>

                    <Badge variant="outline" className="text-xs">
                      {patient.priorityLabel}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                {/* Quick Actions Row */}
                <div className="flex items-center space-x-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleMoveToNextInLine(patient)}
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 text-green-600 border-green-200 hover:bg-green-50"
                          disabled={moveToNextInLineMutation.isPending}
                        >
                          <FastForward className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Move to Next-in-Line</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handleBringPatientToTop(patient.queueEntryId, patient.patient.fullName)}
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 text-red-600 border-red-200 hover:bg-red-50"
                          disabled={bringToTopMutation.isPending}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Move to top (position 4)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:bg-blue-50 flex-1"
                    onClick={() => handleViewQueuePatient(patient)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </div>

            {/* Long wait warning */}
            {waitTime > 45 && patient.status !== 'examining' && (
              <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-800">
                    Long wait time: Consider priority adjustment
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Next-in-Line Section - Fixed height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NextInLineQueueManagement
          queuePatients={getCompleteQueueData()}
          isLoading={queueLoading}
          error={queueError}
        />
        <NextInLinePanel />
      </div>

      <Separator className="my-6" />

      {/* Priority Queue Management - Fixed height, touches bottom of viewport, has internal scroll */}
      <Card className="w-full shadow-sm border h-[600px] lg:h-[calc(100vh-420px)] flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <Stethoscope className="h-6 w-6 text-blue-600" />
                Priority Queue Management (Position 4+)
                {isSocketConnected && (
                  <div className="relative w-2 h-2 ml-1">
                    <div className="absolute w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                    <div className="absolute w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                )}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {stats.total !== undefined && !isNaN(stats.total) && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {stats.total} total
                  </span>
                )}
                {stats.emergency !== undefined && !isNaN(stats.emergency) && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {stats.emergency} emergency
                  </span>
                )}
                {queueLoading && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsFocusMode(true)}
                variant="outline"
                size="sm"
                className="border-blue-500 text-blue-600 hover:bg-blue-50 shadow-sm"
                title="Open full-screen focus view for monitoring all queue sections"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Focus View
              </Button>
              <Button
                onClick={handleApplyFCFS}
                disabled={applyFCFSMutation.isPending || queueLoading}
                className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-sm"
              >
                {applyFCFSMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Apply FCFS
                  </>
                )}
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            {/* Enhanced Tab List - Proper Radix UI Structure */}
            <TabsList className="flex w-full gap-1 mb-4 p-1 bg-gray-50 rounded-lg h-auto shadow-inner flex-shrink-0">
              <TabsTrigger
                value="all"
                onClick={() => setActiveTab('all')}
                className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] relative"
              >
                <Users className="h-4 w-4" />
                <span>All</span>
                <span className="text-xs">({filterPatientsByTab(getAPIPatients(), 'all').length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="priority"
                onClick={() => setActiveTab('priority')}
                className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] relative"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Priority</span>
                <span className="text-xs">({filterPatientsByTab(getAPIPatients(), 'priority').length})</span>
                {filterPatientsByTab(getAPIPatients(), 'priority').length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      bringPriorityGroupToTop('PRIORITY');
                    }}
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 hover:bg-red-100 hover:text-red-700 rounded-full disabled:opacity-50"
                    disabled={reorderQueueMutation.isPending}
                    title="Bring Priority to Top"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="emergency"
                onClick={() => setActiveTab('emergency')}
                className="flex-1 data-[state=active]:bg-red-700 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] relative"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Emergency</span>
                <span className="text-xs">({filterPatientsByTab(getAPIPatients(), 'emergency').length})</span>
                {filterPatientsByTab(getAPIPatients(), 'emergency').length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      bringPriorityGroupToTop('EMERGENCY');
                    }}
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 hover:bg-red-100 hover:text-red-700 rounded-full disabled:opacity-50"
                    disabled={reorderQueueMutation.isPending}
                    title="Bring Emergency to Top"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="children"
                onClick={() => setActiveTab('children')}
                className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] relative"
              >
                <Baby className="h-4 w-4" />
                <span>Children</span>
                <span className="text-xs">({filterPatientsByTab(getAPIPatients(), 'children').length})</span>
                {filterPatientsByTab(getAPIPatients(), 'children').length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      bringPriorityGroupToTop('CHILDREN');
                    }}
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 hover:bg-purple-100 hover:text-purple-700 rounded-full disabled:opacity-50"
                    disabled={reorderQueueMutation.isPending}
                    title="Bring Children to Top"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="seniors"
                onClick={() => setActiveTab('seniors')}
                className="flex-1 data-[state=active]:bg-orange-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] relative"
              >
                <UserCheck className="h-4 w-4" />
                <span>Seniors</span>
                <span className="text-xs">({filterPatientsByTab(getAPIPatients(), 'seniors').length})</span>
                {filterPatientsByTab(getAPIPatients(), 'seniors').length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      bringPriorityGroupToTop('SENIORS');
                    }}
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 hover:bg-orange-100 hover:text-orange-700 rounded-full disabled:opacity-50"
                    disabled={reorderQueueMutation.isPending}
                    title="Bring Seniors to Top"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="longwait"
                onClick={() => setActiveTab('longwait')}
                className="flex-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] relative"
              >
                <Clock className="h-4 w-4" />
                <span>Long Wait</span>
                <span className="text-xs">({filterPatientsByTab(getAPIPatients(), 'longwait').length})</span>
                {filterPatientsByTab(getAPIPatients(), 'longwait').length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      bringPriorityGroupToTop('LONGWAIT');
                    }}
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 hover:bg-amber-100 hover:text-amber-700 rounded-full disabled:opacity-50"
                    disabled={reorderQueueMutation.isPending}
                    title="Bring Long Wait to Top"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="referral"
                onClick={() => setActiveTab('referral')}
                className="flex-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] relative"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Referral</span>
                <span className="text-xs">({filterPatientsByTab(getAPIPatients(), 'referral').length})</span>
                {filterPatientsByTab(getAPIPatients(), 'referral').length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      bringPriorityGroupToTop('REFERRAL');
                    }}
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 hover:bg-indigo-100 hover:text-indigo-700 rounded-full disabled:opacity-50"
                    disabled={reorderQueueMutation.isPending}
                    title="Bring Referral to Top"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="followup"
                onClick={() => setActiveTab('followup')}
                className="flex-1 data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] relative"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>Follow-Up</span>
                <span className="text-xs">({filterPatientsByTab(getAPIPatients(), 'followup').length})</span>
                {filterPatientsByTab(getAPIPatients(), 'followup').length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      bringPriorityGroupToTop('FOLLOWUP');
                    }}
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 hover:bg-green-100 hover:text-green-700 rounded-full disabled:opacity-50"
                    disabled={reorderQueueMutation.isPending}
                    title="Bring Follow-Up to Top"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="routine"
                onClick={() => setActiveTab('routine')}
                className="flex-1 data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] relative"
              >
                <Activity className="h-4 w-4" />
                <span>Routine</span>
                <span className="text-xs">({filterPatientsByTab(getAPIPatients(), 'routine').length})</span>
                {filterPatientsByTab(getAPIPatients(), 'routine').length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      bringPriorityGroupToTop('ROUTINE');
                    }}
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 hover:bg-teal-100 hover:text-teal-700 rounded-full disabled:opacity-50"
                    disabled={reorderQueueMutation.isPending}
                    title="Bring Routine to Top"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="prepostop"
                onClick={() => setActiveTab('prepostop')}
                className="flex-1 data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] relative"
              >
                <Scissors className="h-4 w-4" />
                <span>Pre/Post-Op</span>
                <span className="text-xs">({filterPatientsByTab(getAPIPatients(), 'prepostop').length})</span>
                {filterPatientsByTab(getAPIPatients(), 'prepostop').length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      bringPriorityGroupToTop('PREPOSTOP');
                    }}
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 hover:bg-cyan-100 hover:text-cyan-700 rounded-full disabled:opacity-50"
                    disabled={reorderQueueMutation.isPending}
                    title="Bring Pre/Post-Op to Top"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="scheduled"
                onClick={() => setActiveTab('scheduled')}
                className="flex-1 data-[state=active]:bg-lime-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] relative"
              >
                <CalendarDays className="h-4 w-4" />
                <span>Scheduled</span>
                <span className="text-xs">({filterPatientsByTab(getAPIPatients(), 'scheduled').length})</span>
                {filterPatientsByTab(getAPIPatients(), 'scheduled').length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      bringPriorityGroupToTop('SCHEDULED');
                    }}
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 hover:bg-lime-100 hover:text-lime-700 rounded-full disabled:opacity-50"
                    disabled={reorderQueueMutation.isPending}
                    title="Bring Scheduled to Top"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab Content for All Categories - Internal scroll area */}
            {['all', 'priority', 'emergency', 'children', 'seniors', 'longwait', 'referral', 'followup', 'routine', 'prepostop', 'scheduled'].map(tabValue => (
              <TabsContent key={tabValue} value={tabValue} className="flex-1 overflow-y-auto data-[state=inactive]:hidden scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100">
                <div className="space-y-3 pr-2">
                  {filteredPatients.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 min-h-[300px] flex flex-col items-center justify-center">
                      {queueLoading && <RefreshCw className="h-16 w-16 mx-auto mb-4 opacity-50 animate-spin" />}
                      {queueError && <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50 text-red-500" />}
                      {!queueLoading && !queueError && (
                        <>
                          {tabValue === 'all' && <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />}
                          {tabValue === 'priority' && <AlertTriangle className="h-16 w-16 mx-auto mb-4 opacity-50" />}
                          {tabValue === 'emergency' && <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />}
                          {tabValue === 'children' && <Baby className="h-16 w-16 mx-auto mb-4 opacity-50" />}
                          {tabValue === 'seniors' && <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />}
                          {tabValue === 'longwait' && <Clock className="h-16 w-16 mx-auto mb-4 opacity-50" />}
                          {tabValue === 'referral' && <RefreshCw className="h-16 w-16 mx-auto mb-4 opacity-50" />}
                          {tabValue === 'followup' && <CalendarCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />}
                          {tabValue === 'routine' && <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />}
                          {tabValue === 'prepostop' && <Scissors className="h-16 w-16 mx-auto mb-4 opacity-50" />}
                          {tabValue === 'scheduled' && <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-50" />}
                        </>
                      )}

                      <h3 className="text-lg font-medium mb-2">
                        {queueLoading && 'Loading queue data...'}
                        {queueError && 'Failed to load queue data'}
                        {!queueLoading && !queueError && (
                          <>
                            {tabValue === 'all' && 'No patients in priority queue (position 4+)'}
                            {tabValue === 'priority' && 'No priority patients in this range'}
                            {tabValue === 'emergency' && 'No emergency patients in this range'}
                            {tabValue === 'children' && 'No pediatric patients in this range'}
                            {tabValue === 'seniors' && 'No senior patients in this range'}
                            {tabValue === 'longwait' && 'No patients with long wait times in this range'}
                            {tabValue === 'referral' && 'No referral patients in this range'}
                            {tabValue === 'followup' && 'No follow-up patients in this range'}
                            {tabValue === 'routine' && 'No routine check-up patients in this range'}
                            {tabValue === 'prepostop' && 'No pre/post-operative patients in this range'}
                            {tabValue === 'scheduled' && 'No scheduled appointment patients in this range'}
                          </>
                        )}
                      </h3>
                      <p className="text-sm">
                        {queueLoading && 'Please wait while we fetch the latest queue information...'}
                        {queueError && `Error: ${queueError.message || 'Unable to connect to server'}`}
                        {!queueLoading && !queueError && (
                          <>
                            {tabValue === 'all' && 'This panel shows patients from the 4th position onwards. The first 3 patients are managed in the "Next in Line" panel above.'}
                            {tabValue === 'priority' && 'High-priority patients (Priority 1-3) from position 4+ will appear here.'}
                            {tabValue === 'emergency' && 'Emergency patients from position 4+ requiring immediate attention will appear here.'}
                            {tabValue === 'children' && 'Pediatric patients (under 18) from position 4+ will appear here.'}
                            {tabValue === 'seniors' && 'Senior patients (65+) from position 4+ will appear here.'}
                            {tabValue === 'longwait' && 'Patients waiting more than 45 minutes from position 4+ will appear here.'}
                            {tabValue === 'referral' && 'Patients referred from other departments from position 4+ will appear here.'}
                            {tabValue === 'followup' && 'Patients returning for follow-up consultations from position 4+ will appear here.'}
                            {tabValue === 'routine' && 'Patients scheduled for routine eye exams from position 4+ will appear here.'}
                            {tabValue === 'prepostop' && 'Patients scheduled for or recovering from surgery from position 4+ will appear here.'}
                            {tabValue === 'scheduled' && 'Patients with pre-scheduled appointments from position 4+ will appear here.'}
                          </>
                        )}
                      </p>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={filteredPatients.map(p => p.queueEntryId)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                          {filteredPatients.map((patient, index) => (
                            <SortablePatientItem key={patient.queueEntryId} patient={patient} index={index} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Queue Patient Details Modal */}
      <QueuePatientDetailsModal
        queuePatient={selectedQueuePatient}
        isOpen={queuePatientDetailsOpen}
        onClose={() => {
          setQueuePatientDetailsOpen(false);
          setSelectedQueuePatient(null);
        }}
      />

      {/* Move to Next-in-Line Confirmation Modal */}
      <Dialog open={moveToNextInLineModalOpen} onOpenChange={setMoveToNextInLineModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FastForward className="h-5 w-5 text-green-600" />
              <span>Move to Next-in-Line</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    Are you sure you want to move this patient to the top of the Next-in-Line panel?
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    This action will prioritize their examination immediately.
                  </p>
                </div>
              </div>
            </div>

            {moveToNextInLinePatient && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <p className="font-semibold text-lg text-gray-800">
                      {moveToNextInLinePatient.patient?.fullName}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                      <span>MRN: {moveToNextInLinePatient.patient?.patientNumber}</span>
                      <span>•</span>
                      <span>Token: {moveToNextInLinePatient.appointment?.tokenNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className="text-xs">
                        Current Position: #{moveToNextInLinePatient.queueNumber}
                      </Badge>
                      <Badge className="text-xs bg-green-600 text-white">
                        Moving to Next-in-Line
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setMoveToNextInLineModalOpen(false);
                  setMoveToNextInLinePatient(null);
                }}
                disabled={moveToNextInLineMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={confirmMoveToNextInLine}
                disabled={moveToNextInLineMutation.isPending}
              >
                {moveToNextInLineMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Moving...
                  </>
                ) : (
                  <>
                    <FastForward className="h-4 w-4 mr-2" />
                    Confirm Move
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Apply FCFS Confirmation Dialog */}
      <Dialog open={fcfsDialogOpen} onOpenChange={setFcfsDialogOpen}>
        <DialogContent className="max-w-md" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-base">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Apply FCFS Ordering</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Reorder patients from position 4 onwards based on arrival time. Next in Line (positions 1-3) will remain unchanged.
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setFcfsDialogOpen(false)}
                disabled={applyFCFSMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={confirmApplyFCFS}
                disabled={applyFCFSMutation.isPending}
              >
                {applyFCFSMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Confirm Apply
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-Screen Focus Mode Modal */}
      <Dialog open={isFocusMode} onOpenChange={setIsFocusMode}>
        <DialogPortal>
          {/* Custom overlay with blur effect instead of dark background */}
          <DialogOverlay className="fixed inset-0 z-50 bg-white/10 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          
          {/* Full-screen content without header */}
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 w-screen h-screen m-0 p-0 border-0 outline-none focus:outline-none overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {/* Floating Close Button - absolutely positioned in viewport top-right */}
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="fixed top-3 right-3 z-[60] h-9 w-9 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors"
                title="Exit focus view (ESC)"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogPrimitive.Close>

            {/* Grid-based layout: 2 rows - top row split into 2 columns, bottom row full-width */}
            <div 
              className="w-full h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-3"
              style={{
                display: 'grid',
                gridTemplateRows: 'minmax(200px, 42%) 1fr',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              {/* Row 1, Column 1: Next in Line Queue Management */}
              <div 
                className="overflow-hidden rounded-lg [&>div]:h-full [&>div]:flex [&>div]:flex-col [&>div>div:last-child]:flex-1 [&>div>div:last-child]:overflow-y-auto [&>div>div:last-child]:scrollbar-thin [&>div>div:last-child]:scrollbar-thumb-blue-400 [&>div>div:last-child]:scrollbar-track-gray-100 [&>div>div:last-child]:pr-2"
                style={{ minHeight: 0 }}
              >
                <NextInLineQueueManagement
                  queuePatients={getCompleteQueueData()}
                  isLoading={queueLoading}
                  error={queueError}
                />
              </div>

              {/* Row 1, Column 2: Patients Under Examination (NextInLinePanel) */}
              <div 
                className="overflow-hidden rounded-lg [&>div]:h-full [&>div]:flex [&>div]:flex-col [&>div>div:last-child]:flex-1 [&>div>div:last-child]:overflow-y-auto [&>div>div:last-child]:scrollbar-thin [&>div>div:last-child]:scrollbar-thumb-blue-400 [&>div>div:last-child]:scrollbar-track-gray-100 [&>div>div:last-child]:pr-2"
                style={{ minHeight: 0 }}
              >
                <NextInLinePanel />
              </div>

              {/* Row 2: Priority Queue Management - spans both columns */}
              <div className="overflow-hidden rounded-lg" style={{ gridColumn: '1 / -1', minHeight: 0 }}>
                <Card className="w-full h-full shadow-lg border-2 border-blue-200/50 flex flex-col bg-white">
                  <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                          <Stethoscope className="h-5 w-5 text-blue-600" />
                          Priority Queue Management (Position 4+)
                          {isSocketConnected && (
                            <div className="relative w-2 h-2 ml-1">
                              <div className="absolute w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                              <div className="absolute w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                          {stats.total !== undefined && !isNaN(stats.total) && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {stats.total} total
                            </span>
                          )}
                          {stats.emergency !== undefined && !isNaN(stats.emergency) && (
                            <span className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {stats.emergency} emergency
                            </span>
                          )}
                          {queueLoading && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              Loading...
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handleApplyFCFS}
                          disabled={applyFCFSMutation.isPending || queueLoading}
                          size="sm"
                          className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-sm"
                        >
                          {applyFCFSMutation.isPending ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                              Apply FCFS
                            </>
                          )}
                        </Button>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                          <Input
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 w-56 h-9 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-hidden flex flex-col p-3 min-h-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col min-h-0">
                      {/* Compact Tab List for focus mode */}
                      <TabsList className="flex w-full gap-0.5 mb-2 p-0.5 bg-gray-50 rounded-lg h-auto shadow-inner flex-shrink-0">
                        <TabsTrigger
                          value="all"
                          className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[10px] px-1 py-1 flex flex-col items-center gap-0 min-h-[36px]"
                        >
                          <Users className="h-3 w-3" />
                          <span>All</span>
                          <span className="text-[10px]">({filterPatientsByTab(getAPIPatients(), 'all').length})</span>
                        </TabsTrigger>

                        <TabsTrigger
                          value="priority"
                          className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white text-[10px] px-1 py-1 flex flex-col items-center gap-0 min-h-[36px]"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span>Priority</span>
                          <span className="text-[10px]">({filterPatientsByTab(getAPIPatients(), 'priority').length})</span>
                        </TabsTrigger>

                        <TabsTrigger
                          value="emergency"
                          className="flex-1 data-[state=active]:bg-red-700 data-[state=active]:text-white text-[10px] px-1 py-1 flex flex-col items-center gap-0 min-h-[36px]"
                        >
                          <AlertCircle className="h-3 w-3" />
                          <span>Emergency</span>
                          <span className="text-[10px]">({filterPatientsByTab(getAPIPatients(), 'emergency').length})</span>
                        </TabsTrigger>

                        <TabsTrigger
                          value="children"
                          className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-[10px] px-1 py-1 flex flex-col items-center gap-0 min-h-[36px]"
                        >
                          <Baby className="h-3 w-3" />
                          <span>Children</span>
                          <span className="text-[10px]">({filterPatientsByTab(getAPIPatients(), 'children').length})</span>
                        </TabsTrigger>

                        <TabsTrigger
                          value="seniors"
                          className="flex-1 data-[state=active]:bg-orange-600 data-[state=active]:text-white text-[10px] px-1 py-1 flex flex-col items-center gap-0 min-h-[36px]"
                        >
                          <UserCheck className="h-3 w-3" />
                          <span>Seniors</span>
                          <span className="text-[10px]">({filterPatientsByTab(getAPIPatients(), 'seniors').length})</span>
                        </TabsTrigger>

                        <TabsTrigger
                          value="longwait"
                          className="flex-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white text-[10px] px-1 py-1 flex flex-col items-center gap-0 min-h-[36px]"
                        >
                          <Clock className="h-3 w-3" />
                          <span>Long Wait</span>
                          <span className="text-[10px]">({filterPatientsByTab(getAPIPatients(), 'longwait').length})</span>
                        </TabsTrigger>

                        <TabsTrigger
                          value="referral"
                          className="flex-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-[10px] px-1 py-1 flex flex-col items-center gap-0 min-h-[36px]"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Referral</span>
                          <span className="text-[10px]">({filterPatientsByTab(getAPIPatients(), 'referral').length})</span>
                        </TabsTrigger>

                        <TabsTrigger
                          value="followup"
                          className="flex-1 data-[state=active]:bg-green-600 data-[state=active]:text-white text-[10px] px-1 py-1 flex flex-col items-center gap-0 min-h-[36px]"
                        >
                          <CalendarCheck className="h-3 w-3" />
                          <span>Follow-Up</span>
                          <span className="text-[10px]">({filterPatientsByTab(getAPIPatients(), 'followup').length})</span>
                        </TabsTrigger>

                        <TabsTrigger
                          value="routine"
                          className="flex-1 data-[state=active]:bg-teal-600 data-[state=active]:text-white text-[10px] px-1 py-1 flex flex-col items-center gap-0 min-h-[36px]"
                        >
                          <Activity className="h-3 w-3" />
                          <span>Routine</span>
                          <span className="text-[10px]">({filterPatientsByTab(getAPIPatients(), 'routine').length})</span>
                        </TabsTrigger>

                        <TabsTrigger
                          value="prepostop"
                          className="flex-1 data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-[10px] px-1 py-1 flex flex-col items-center gap-0 min-h-[36px]"
                        >
                          <Scissors className="h-3 w-3" />
                          <span>Pre/Post-Op</span>
                          <span className="text-[10px]">({filterPatientsByTab(getAPIPatients(), 'prepostop').length})</span>
                        </TabsTrigger>

                        <TabsTrigger
                          value="scheduled"
                          className="flex-1 data-[state=active]:bg-lime-600 data-[state=active]:text-white text-[10px] px-1 py-1 flex flex-col items-center gap-0 min-h-[36px]"
                        >
                          <CalendarDays className="h-3 w-3" />
                          <span>Scheduled</span>
                          <span className="text-[10px]">({filterPatientsByTab(getAPIPatients(), 'scheduled').length})</span>
                        </TabsTrigger>
                      </TabsList>

                      {/* Tab Content - Reuse existing filtered patients with drag and drop */}
                      {['all', 'priority', 'emergency', 'children', 'seniors', 'longwait', 'referral', 'followup', 'routine', 'prepostop', 'scheduled'].map(tabValue => (
                        <TabsContent key={tabValue} value={tabValue} className="flex-1 overflow-y-auto data-[state=inactive]:hidden scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100 min-h-0">
                          <div className="space-y-2 pr-2">
                            {filteredPatients.length === 0 ? (
                              <div className="text-center py-6 text-slate-500 flex flex-col items-center justify-center">
                                {queueLoading && <RefreshCw className="h-10 w-10 mx-auto mb-2 opacity-50 animate-spin" />}
                                {queueError && <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50 text-red-500" />}
                                {!queueLoading && !queueError && (
                                  <>
                                    {tabValue === 'all' && <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />}
                                    {tabValue === 'priority' && <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-50" />}
                                    {tabValue === 'emergency' && <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />}
                                    {tabValue === 'children' && <Baby className="h-10 w-10 mx-auto mb-2 opacity-50" />}
                                    {tabValue === 'seniors' && <UserCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />}
                                    {tabValue === 'longwait' && <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />}
                                    {tabValue === 'referral' && <RefreshCw className="h-10 w-10 mx-auto mb-2 opacity-50" />}
                                    {tabValue === 'followup' && <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />}
                                    {tabValue === 'routine' && <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />}
                                    {tabValue === 'prepostop' && <Scissors className="h-10 w-10 mx-auto mb-2 opacity-50" />}
                                    {tabValue === 'scheduled' && <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />}
                                  </>
                                )}

                                <h3 className="text-sm font-medium mb-1">
                                  {queueLoading && 'Loading queue data...'}
                                  {queueError && 'Failed to load queue data'}
                                  {!queueLoading && !queueError && `No ${tabValue === 'all' ? '' : tabValue} patients in queue`}
                                </h3>
                                <p className="text-xs">
                                  {!queueLoading && !queueError && 'Patients from position 4+ will appear here'}
                                </p>
                              </div>
                            ) : (
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                              >
                                <SortableContext items={filteredPatients.map(p => p.queueEntryId)} strategy={verticalListSortingStrategy}>
                                  <div className="space-y-2">
                                    {filteredPatients.map((patient, index) => (
                                      <SortablePatientItem key={patient.queueEntryId} patient={patient} index={index} />
                                    ))}
                                  </div>
                                </SortableContext>
                              </DndContext>
                            )}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
};

export default PriorityQueuePanel;