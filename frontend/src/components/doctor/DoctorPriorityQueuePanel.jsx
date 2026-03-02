import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useNavigate } from 'react-router-dom';
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
  FastForward,
  CalendarDays,
  ArrowUpDown,
  Maximize2,
  X
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
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
import ophthalmologistQueueService from '@/services/ophthalmologistQueueService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useDoctorQueueSocket, useSocketConnectionStatus } from '@/hooks/useQueueSocket';
import NextInLineOphthalmologist from './NextInLineOphthalmologist';
import PatientsUnderObservation from './PatientsUnderObservation';
import PatientExaminationModal from './PatientExaminationModal';

// Focus View Consultation Panel - shows CALLED/IN_PROGRESS patients in focus mode
const FocusViewConsultationPanel = ({ user, openExaminationModal }) => {
  const queryClient = useQueryClient();

  // Use the same query key as PatientQueue to leverage React Query cache
  const { data: queueData, isLoading } = useQuery({
    queryKey: ['ophthalmologist-queue', user?.id],
    queryFn: () => ophthalmologistQueueService.getOphthalmologistQueue(),
    staleTime: 0,
    cacheTime: 0,
    enabled: !!user?.id,
  });

  const myPatients = queueData?.queueEntries?.filter(p => p.assignedStaff?.id === user?.id) || [];
  const activeAppointments = myPatients.filter(p => p.status === 'CALLED' || p.status === 'IN_PROGRESS');

  return (
    <Card className="h-full flex flex-col bg-white shadow-sm border">
      <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
            <UserCheck className="h-5 w-5 text-purple-600" />
            Patient Consultation ({activeAppointments.length}/3)
          </CardTitle>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
            {activeAppointments.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-gray-100">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="h-10 w-10 mx-auto mb-3 opacity-50 animate-spin" />
            <p className="text-sm">Loading consultation data...</p>
          </div>
        ) : activeAppointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No patients in consultation</p>
            <p className="text-xs mt-1">Click "Call Next" to bring patients from your queue</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeAppointments.map((appointment) => (
              <Card key={appointment.id} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{appointment.fullName}</h4>
                      <p className="text-xs text-gray-600">{appointment.visitType} • Age {appointment.age}</p>
                      <p className="text-xs text-gray-500">Token: {appointment.token}</p>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Badge className={`text-xs ${
                        appointment.priorityLabel === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                        appointment.priorityLabel === 'PRIORITY' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.priorityLabel || 'ROUTINE'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                  {/* Patient Presence Confirmation Badge */}
                  {appointment.receptionist2Review && (
                    <div className="mb-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          appointment.receptionist2Review.reviewed 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        {appointment.receptionist2Review.reviewed ? '✓ Present at Premises' : '⏳ Presence Not Confirmed'}
                      </Badge>
                    </div>
                  )}
                  {/* Action Buttons for Examination */}
                  {appointment.status === 'CALLED' && (
                    <Button
                      onClick={() => openExaminationModal(appointment.queueEntryId)}
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Stethoscope className="h-3.5 w-3.5 mr-1.5" />
                      Start Examination
                    </Button>
                  )}
                  {appointment.status === 'IN_PROGRESS' && (
                    <Button
                      onClick={() => openExaminationModal(appointment.queueEntryId)}
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Activity className="h-3.5 w-3.5 mr-1.5" />
                      Continue Examination
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DoctorPriorityQueuePanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 🔌 WebSocket real-time updates
  useDoctorQueueSocket();
  const isSocketConnected = useSocketConnectionStatus();

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [positionInput, setPositionInput] = useState({});
  const [openPopovers, setOpenPovers] = useState({});
  const [nextInLineConfirmation, setNextInLineConfirmation] = useState({
    isOpen: false,
    patient: null,
  });
  const [fcfsDialogOpen, setFcfsDialogOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [examinationModalOpen, setExaminationModalOpen] = useState(false);
  const [selectedQueueEntryId, setSelectedQueueEntryId] = useState(null);

  // Open examination modal
  const openExaminationModal = (queueEntryId) => {
    setSelectedQueueEntryId(queueEntryId);
    setExaminationModalOpen(true);
  };

  // Close examination modal
  const closeExaminationModal = () => {
    setExaminationModalOpen(false);
    setSelectedQueueEntryId(null);
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch doctor-specific queue data from API - WebSocket handles real-time updates!
  const { data: queueData, isLoading: queueLoading, error: queueError, refetch } = useQuery({
    queryKey: ['doctor-assigned-queue', user?.id],
    queryFn: ophthalmologistQueueService.getDoctorQueue,
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
    retryDelay: 300,
    networkMode: 'always',
    onSuccess: (data) => {
    },
    onError: (error) => {
    }
  });

  // Queue reordering mutation - SIMPLIFIED for reliable UI sync
  const reorderMutation = useMutation({
    mutationFn: (reorderedPatients) => {
      return ophthalmologistQueueService.reorderDoctorQueue(reorderedPatients);
    },
    onMutate: (variables) => {
    },
    onSuccess: async (data) => {
      toast.success('Queue reordered successfully');

      // FORCE immediate cache invalidation and refetch
      await queryClient.invalidateQueries(['doctor-assigned-queue', user?.id]);
      await queryClient.refetchQueries(['doctor-assigned-queue', user?.id]);

      // Additional forced refetch after short delay
      setTimeout(() => {
        refetch();
      }, 500);
    },
    onError: async (error) => {
      toast.error('Failed to reorder queue: ' + (error.response?.data?.message || error.message));

      // Force fresh data on error
      await queryClient.invalidateQueries(['doctor-assigned-queue', user?.id]);
      refetch();
    }
  });

  // Apply FCFS mutation
  const applyFCFSMutation = useMutation({
    mutationFn: () => ophthalmologistQueueService.applyDoctorFCFS(user?.id),
    onSuccess: async (data) => {
      toast.success(`Queue reordered by FCFS - ${data?.message || 'Patients sorted by optometrist completion time'}`);
      setFcfsDialogOpen(false);
      
      // FORCE immediate cache invalidation and refetch
      await queryClient.invalidateQueries(['doctor-assigned-queue', user?.id]);
      await queryClient.refetchQueries(['doctor-assigned-queue', user?.id]);
      
      // Additional forced refetch after short delay
      setTimeout(() => {
        refetch();
      }, 500);
    },
    onError: (error) => {
      toast.error('Failed to apply FCFS: ' + (error.response?.data?.message || error.message));
      setFcfsDialogOpen(false);
    }
  });

  // Bring to top mutation - Move to position 4 (top of PriorityQueue, not NextInLine)
  const bringToTopMutation = useMutation({
    mutationFn: async ({ queueEntryId, reason }) => {
      const allPatients = getAllAssignedPatientsInOrder(); // Use complete list for reordering

      const targetPatient = allPatients.find(p => p.id === queueEntryId);
      const otherPatients = allPatients.filter(p => p.id !== queueEntryId);

      // Create new order: positions 1-3 stay same, target patient goes to position 4, rest shift down
      const reorderedPatients = [];

      // Keep first 3 patients in their positions (NextInLine positions)
      for (let i = 0; i < Math.min(3, otherPatients.length); i++) {
        reorderedPatients.push({
          queueEntryId: otherPatients[i].id,
          doctorQueuePosition: i + 1
        });
      }

      // Place target patient at position 4 (top of PriorityQueue)
      if (targetPatient) {
        reorderedPatients.push({
          queueEntryId: targetPatient.id,
          doctorQueuePosition: 4
        });
      }

      // Place remaining patients from position 5 onwards
      const remainingPatients = otherPatients.slice(3);
      remainingPatients.forEach((patient, index) => {
        reorderedPatients.push({
          queueEntryId: patient.id,
          doctorQueuePosition: 5 + index
        });
      });


      // Validate that all queueEntryIds are valid
      const invalidEntries = reorderedPatients.filter(p => !p.queueEntryId || p.queueEntryId.length < 10);
      if (invalidEntries.length > 0) {
        throw new Error('Invalid queue entry IDs detected');
      }

      return ophthalmologistQueueService.reorderDoctorQueue(reorderedPatients);
    },
    onSuccess: async (data, variables) => {
      toast.success(`Patient moved to top position - ${variables.reason}`);

      // FORCE multiple refreshes to ensure UI sync
      await queryClient.invalidateQueries(['doctor-assigned-queue', user?.id]);
      await refetch();
      setTimeout(() => refetch(), 300);
    },
    onError: async (error) => {
      toast.error('Failed to move patient to top: ' + error.message);
      await refetch();
    }
  });

  // Move to specific position mutation - SIMPLIFIED with forced refresh
  const moveToPositionMutation = useMutation({
    mutationFn: async ({ queueEntryId, targetPosition }) => {
      const allPatients = getAllAssignedPatientsInOrder(); // Use complete list for reordering
      const sortedPatients = sortPatientsByDoctorPosition(allPatients);


      // Remove the patient from current position
      const patientToMove = sortedPatients.find(p => p.id === queueEntryId);
      const otherPatients = sortedPatients.filter(p => p.id !== queueEntryId);


      // Insert at target position
      otherPatients.splice(targetPosition - 1, 0, patientToMove);

      // Reassign positions
      const reorderedPatients = otherPatients.map((patient, index) => ({
        queueEntryId: patient.id,
        doctorQueuePosition: index + 1
      }));

      return ophthalmologistQueueService.reorderDoctorQueue(reorderedPatients);
    },
    onSuccess: async (data, variables) => {
      toast.success(`Patient moved to position ${variables.targetPosition}`);

      // FORCE multiple refreshes to ensure UI sync
      await queryClient.invalidateQueries(['doctor-assigned-queue', user?.id]);
      await refetch();
      setTimeout(() => refetch(), 300);
    },
    onError: async (error) => {
      toast.error('Failed to move patient: ' + error.message);
      await refetch();
    }
  });

  // Move to Next-in-Line mutation (positions 1-3) using doctorQueuePosition
  const moveToNextInLineMutation = useMutation({
    mutationFn: async ({ queueEntryId }) => {
      const allPatients = getAllAssignedPatientsInOrder();
      

      const targetPatient = allPatients.find(p => p.id === queueEntryId);
      if (!targetPatient) {
        throw new Error('Patient not found in queue');
      }

      // Separate patients into active (positions 1-3 with CALLED/IN_PROGRESS status) and waiting
      const activePatients = allPatients.filter(p => 
        p.doctorQueuePosition <= 3 && (p.status === 'CALLED' || p.status === 'IN_PROGRESS')
      ).sort((a, b) => a.doctorQueuePosition - b.doctorQueuePosition);

      const waitingPatients = allPatients.filter(p => 
        p.status === 'WAITING'
      );



      // Find the highest locked position (active patients in positions 1-3)
      const maxLockedPosition = activePatients.length > 0
        ? Math.max(...activePatients.map(p => p.doctorQueuePosition))
        : 0;

      // Calculate the optimal insertion position for the target patient
      // If positions 1-3 have active patients, insert just after them
      // Otherwise, insert at position 1
      let targetInsertPosition;
      if (maxLockedPosition > 0) {
        targetInsertPosition = maxLockedPosition + 1;
      } else {
        targetInsertPosition = 1;
      }

      // Ensure the target position is within the Next-in-Line range (1-3)
      targetInsertPosition = Math.min(targetInsertPosition, 3);


      // Build reorder request: Include target patient and all other waiting patients
      const reorderedQueueEntries = [];

      // Add target patient at the desired position
      reorderedQueueEntries.push({
        queueEntryId: targetPatient.id,
        newPosition: targetInsertPosition
      });

      // Add all other waiting patients with their current or shifted positions
      waitingPatients.forEach(p => {
        if (p.id !== queueEntryId) {
          // Keep their current position (backend will handle the shifting)
          reorderedQueueEntries.push({
            queueEntryId: p.id,
            newPosition: p.doctorQueuePosition
          });
        }
      });


      // Call the new backend endpoint specifically for Next-in-Line reordering
      return ophthalmologistQueueService.reorderDoctorNextInLine(reorderedQueueEntries);
    },
    onSuccess: async (data) => {
      toast.success('Patient moved to Next-in-Line successfully');
      setNextInLineConfirmation({ isOpen: false, patient: null });

      // FORCE multiple refreshes to ensure UI sync
      await queryClient.invalidateQueries(['doctor-assigned-queue', user?.id]);
      await refetch();
      setTimeout(() => refetch(), 300);
    },
    onError: async (error) => {
      toast.error('Failed to move patient to Next-in-Line: ' + (error.response?.data?.message || error.message));
      await refetch();
    }
  });

  // Helper function to get all assigned patients in correct order (same logic as NextInLineOphthalmologist)
  const getAllAssignedPatientsInOrder = () => {
    if (!queueData?.queueEntries) return [];

    // Filter patients assigned to current doctor with WAITING status
    const assignedWaitingPatients = queueData.queueEntries
      .filter(entry => {
        const isAssignedToMe = entry.assignedStaff?.id === user.id;
        const isWaiting = entry.status === 'WAITING';
        return isAssignedToMe && isWaiting;
      });

    // Sort patients: 
    // 1. Patients WITH doctorQueuePosition (ascending order)
    // 2. Patients WITHOUT doctorQueuePosition (chronological order by joinedAt)
    const sortedPatients = assignedWaitingPatients.sort((a, b) => {
      const aPos = a.doctorQueuePosition;
      const bPos = b.doctorQueuePosition;

      // Both have positions - sort by position
      if (aPos != null && bPos != null) {
        return aPos - bPos;
      }

      // A has position, B doesn't - A comes first
      if (aPos != null && bPos == null) {
        return -1;
      }

      // B has position, A doesn't - B comes first
      if (aPos == null && bPos != null) {
        return 1;
      }

      // Neither has position - sort by joinedAt (earlier = higher priority)
      return new Date(a.joinedAt) - new Date(b.joinedAt);
    });


    return sortedPatients;
  };

  // Get only assigned patients EXCLUDING top 3 (that are shown in NextInLineOphthalmologist)
  const getAssignedPatients = () => {
    if (queueLoading) {
      return [];
    }

    // Get all assigned patients in correct order
    const allAssignedPatients = getAllAssignedPatientsInOrder();

    // Exclude top 3 patients (they are shown in NextInLineOphthalmologist)
    const patientsAfterTop3 = allAssignedPatients.slice(3);


    return patientsAfterTop3;
  };

  // No sorting needed - API returns data already sorted by doctorQueuePosition
  // Just keep this function for compatibility with filterPatientsByTab
  const sortPatientsByDoctorPosition = (patients) => {
    return patients; // Return as-is since API already sorted
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

  // Filter patients by priorityLabel with automatic categorization
  const filterPatientsByTab = (patients, tabValue) => {
    if (!patients || patients.length === 0) return [];


    let filtered;
    switch (tabValue) {
      case 'all':
        filtered = patients;
        break;
      case 'priority':
        filtered = patients.filter(p => p.priorityLabel === 'PRIORITY');
        break;
      case 'emergency':
        filtered = patients.filter(p => p.priorityLabel === 'EMERGENCY');
        break;
      case 'children':
        // Auto-calculate: Children are patients under 12 years old
        filtered = patients.filter(p => {
          const age = calculateAge(p.patient?.dateOfBirth);
          return age !== null && age < 12;
        });
        break;
      case 'seniors':
        // Auto-calculate: Seniors are patients 60 years or older
        filtered = patients.filter(p => {
          const age = calculateAge(p.patient?.dateOfBirth);
          return age !== null && age >= 60;
        });
        break;
      case 'longwait':
        // Auto-calculate: Long wait patients waiting more than 2 hours (120 minutes)
        filtered = patients.filter(p => {
          const waitTime = getWaitTime(p);
          return waitTime > 120;
        });
        break;
      case 'referral':
        filtered = patients.filter(p => p.priorityLabel === 'REFERRAL');
        break;
      case 'followup':
        filtered = patients.filter(p => p.priorityLabel === 'FOLLOWUP');
        break;
      case 'routine':
        filtered = patients.filter(p => p.priorityLabel === 'ROUTINE');
        break;
      case 'prepostop':
        filtered = patients.filter(p => p.priorityLabel === 'PREPOSTOP');
        break;
      case 'scheduled':
        filtered = patients.filter(p => {
          const notes = p.patientVisit?.appointment?.notes || '';
          return notes.toLowerCase().includes('scheduled appointment');
        });
        break;
      default:
        filtered = patients;
    }


    // Sort filtered results by doctor position - CRITICAL for proper ordering
    const sortedFiltered = sortPatientsByDoctorPosition(filtered);


    return sortedFiltered;
  };

  // Update filtered patients when search term, API data, or active tab changes
  useEffect(() => {
    const assignedPatients = getAssignedPatients();


    if (searchTerm.trim()) {
      // If there's a search term, filter by search and then by tab
      const searchResults = assignedPatients.filter(patient => {
        const fullName = `${patient.patient.firstName}${patient.patient.middleName ? ' ' + patient.patient.middleName : ''} ${patient.patient.lastName}`;
        const patientNumber = patient.patient.patientNumber;
        const token = patient.patientVisit.appointment.tokenNumber;

        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patientNumber.toString().includes(searchTerm) ||
          token.includes(searchTerm);
      });
      const finalResults = filterPatientsByTab(searchResults, activeTab);
      setFilteredPatients(finalResults);
    } else {
      // No search term, just filter by tab
      const finalResults = filterPatientsByTab(assignedPatients, activeTab);
      setFilteredPatients(finalResults);
    }

    // Update stats
    setStats({
      total: assignedPatients.length,
      emergency: assignedPatients.filter(p => p.priorityLabel === 'EMERGENCY').length,
      averageWaitTime: Math.round(assignedPatients.reduce((sum, p) => {
        const waitTime = (new Date() - new Date(p.joinedAt)) / (1000 * 60);
        return sum + waitTime;
      }, 0) / (assignedPatients.length || 1))
    });
  }, [searchTerm, queueData, activeTab, user?.id, isDragging]);

  // Helper functions
  const getWaitTime = (patient) => {
    const now = new Date();
    const waitStart = new Date(patient.joinedAt);
    return Math.floor((now - waitStart) / (1000 * 60)); // in minutes
  };

  const formatWaitTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getPriorityIcon = (priority) => {
    if (priority <= 3) return AlertTriangle;
    if (priority <= 6) return Clock;
    return Timer;
  };

  const getStatusIcon = (patient) => {
    return patient.status === 'IN_PROGRESS' ? Stethoscope : Clock;
  };

  // Drag and drop handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    setIsDragging(true);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = filteredPatients.findIndex(patient => patient.id === active.id);
    const overIndex = filteredPatients.findIndex(patient => patient.id === over.id);


    if (activeIndex !== -1 && overIndex !== -1) {
      // Get ALL assigned patients (including top 3) for proper reordering
      const allAssignedPatients = getAllAssignedPatientsInOrder();


      // NO optimistic updates - let backend handle it and refresh UI
      // Just create the new order and send to backend
      const reorderedAllPatients = [...allAssignedPatients];

      // Find dragged patient in full list
      const draggedPatientIndex = reorderedAllPatients.findIndex(p => p.id === active.id);
      const targetPatientIndex = reorderedAllPatients.findIndex(p => p.id === over.id);

      if (draggedPatientIndex !== -1 && targetPatientIndex !== -1) {
        // Move patient to new position in full list
        const [draggedPatient] = reorderedAllPatients.splice(draggedPatientIndex, 1);
        reorderedAllPatients.splice(targetPatientIndex, 0, draggedPatient);

        // Reassign sequential positions (1,2,3...)
        const reorderedPatients = reorderedAllPatients.map((patient, index) => ({
          queueEntryId: patient.id,
          doctorQueuePosition: index + 1
        }));


        // Send to backend - UI will update after successful response
        reorderMutation.mutate(reorderedPatients);
      } else {
      }
    } else {
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setIsDragging(false);
  };

  // Handle bringing all patients of a priority to top
  const handleBringPriorityToTop = (priorityLabel) => {
    const assignedPatients = getAllAssignedPatientsInOrder(); // Use complete list for reordering
    const priorityPatients = assignedPatients.filter(p => p.priorityLabel === priorityLabel);

    if (priorityPatients.length === 0) {
      toast.info(`No ${priorityLabel.toLowerCase()} patients to move`);
      return;
    }


    // Create new order: 
    // - First 3 positions remain unchanged (NextInLine)
    // - Priority patients go to positions 4+ (top of PriorityQueue)
    // - Other patients follow after priority patients
    const otherPatients = assignedPatients.filter(p => p.priorityLabel !== priorityLabel);

    // Separate first 3 patients (NextInLine) from the rest
    const nextInLinePatients = otherPatients.slice(0, 3);
    const remainingOtherPatients = otherPatients.slice(3);

    // New order: NextInLine (1-3) + Priority patients (4+) + Remaining patients
    const reorderedList = [...nextInLinePatients, ...priorityPatients, ...remainingOtherPatients];


    const reorderedPatients = reorderedList.map((patient, index) => ({
      queueEntryId: patient.id, // Use patient.id instead of patient.queueEntryId
      doctorQueuePosition: index + 1
    }));

    reorderMutation.mutate(reorderedPatients);
  };

  // Handle moving single patient to top of PriorityQueue (position 4)
  const handleBringPatientToTop = (patientId, patientName, reason = 'Priority escalation') => {
    bringToTopMutation.mutate({ queueEntryId: patientId, reason: `${reason} for ${patientName}` });
  };

  // Handle opening Next-in-Line confirmation modal
  const handleMoveToNextInLineClick = (patient) => {
    setNextInLineConfirmation({
      isOpen: true,
      patient: patient
    });
  };

  // Handle confirming move to Next-in-Line
  const handleConfirmMoveToNextInLine = () => {
    if (nextInLineConfirmation.patient) {
      moveToNextInLineMutation.mutate({
        queueEntryId: nextInLineConfirmation.patient.id
      });
    }
  };

  // Handle moving patient to specific position (must be 4+ for PriorityQueue)
  const handleMoveToPosition = (queueEntryId, targetPosition, patientName) => {
    const maxPosition = getAllAssignedPatientsInOrder().length; // Use complete list for max position

    // Enforce position 4+ boundary for PriorityQueue panel
    if (targetPosition < 4 || targetPosition > maxPosition) {
      toast.error(`Position must be between 4 and ${maxPosition} (positions 1-3 are reserved for Next-in-Line)`);
      return;
    }

    moveToPositionMutation.mutate({ queueEntryId, targetPosition });

    // Close the popover
    setOpenPopovers(prev => ({ ...prev, [patientId]: false }));
    setPositionInput(prev => ({ ...prev, [patientId]: '' }));
  };

  // Handle position input submission
  const handlePositionSubmit = (patientId, patientName) => {
    const targetPosition = parseInt(positionInput[patientId]);
    if (isNaN(targetPosition)) {
      toast.error('Please enter a valid position number');
      return;
    }
    handleMoveToPosition(patientId, targetPosition, patientName);
  };

  // Toggle popover
  const togglePopover = (patientId) => {
    setOpenPopovers(prev => ({
      ...prev,
      [patientId]: !prev[patientId]
    }));
  };

  // Sortable Patient Card Component
  const SortablePatientCard = ({ patient, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging: isSortableDragging,
    } = useSortable({ id: patient.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isSortableDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <PatientCard
          patient={patient}
          index={index}
          isDragging={isSortableDragging}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      </div>
    );
  };

  // Patient Card Component
  const PatientCard = ({ patient, index, isDragging = false, dragHandleProps = {} }) => {
    const waitTime = getWaitTime(patient);

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

    // Get background color based on priority label - using different shades of blue
    const getPriorityBackgroundColor = (priorityLabel) => {
      switch (priorityLabel) {
        case 'EMERGENCY': return 'bg-blue-100 border-blue-300 hover:bg-blue-150';
        case 'PRIORITY': return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
        case 'CHILDREN': return 'bg-sky-50 border-sky-200 hover:bg-sky-100';
        case 'SENIORS': return 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100';
        case 'LONGWAIT': return 'bg-slate-50 border-slate-200 hover:bg-slate-100';
        case 'REFERRAL': return 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100';
        case 'FOLLOWUP': return 'bg-teal-50 border-teal-200 hover:bg-teal-100';
        case 'PREPOSTOP': return 'bg-blue-75 border-blue-250 hover:bg-blue-125';
        case 'ROUTINE': return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
        default: return 'bg-white border hover:bg-blue-25';
      }
    };

    const priorityNumber = getPriorityNumber(patient.priorityLabel);
    const PriorityIcon = getPriorityIcon(priorityNumber);
    const StatusIcon = getStatusIcon(patient);
    const priorityBackgroundColor = getPriorityBackgroundColor(patient.priorityLabel);

    return (
      <Card
        key={patient.id}
        className={`transition-all duration-200 hover:shadow-md ${priorityBackgroundColor} border ${isDragging ? 'shadow-lg scale-105 z-50' : ''
          }`}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Drag Handle */}
              <div
                {...dragHandleProps}
                className="flex flex-col items-center cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500">Drag</span>
              </div>

              {/* Doctor Queue Position */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-700">
                    {patient.doctorQueuePosition || 'X'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">My #{patient.doctorQueuePosition || 'unset'}</span>
              </div>

              {/* Priority Indicator */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${priorityNumber <= 3 ? 'bg-red-100' :
                  priorityNumber <= 6 ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                  <PriorityIcon className={`h-4 w-4 ${priorityNumber <= 3 ? 'text-red-600' :
                    priorityNumber <= 6 ? 'text-orange-600' : 'text-blue-600'
                    }`} />
                </div>
                <span className="text-xs text-gray-500 mt-1">P{priorityNumber}</span>
              </div>

              {/* Patient Information */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-bold text-gray-800 text-base">
                    {patient.patient.firstName}{patient.patient.middleName ? ' ' + patient.patient.middleName : ''} {patient.patient.lastName}
                  </h4>
                  <Badge variant="outline" className="text-xs bg-gray-100 border-gray-300 text-gray-700">
                    {new Date().getFullYear() - new Date(patient.patient.dateOfBirth).getFullYear()} years • {patient.patient.gender}
                  </Badge>
                </div>                <div className="flex items-center space-x-4 text-sm text-slate-600">
                  <span className="font-medium">MRN: {patient.patient.patientNumber}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <StatusIcon className="h-4 w-4" />
                    <span className="capitalize">{patient.status === 'IN_PROGRESS' ? 'In Progress' : patient.status}</span>
                  </div>
                  <span>•</span>
                  <span className="capitalize">
                    {patient.visitType || 'Consultation'}
                  </span>
                </div>

                <div className="flex items-center space-x-3 mt-1">
                  <Badge className={`text-xs ${priorityNumber <= 3 ? 'bg-red-600' :
                    priorityNumber <= 6 ? 'bg-orange-600' : 'bg-blue-600'
                    } text-white`}>
                    {patient.patientVisit.appointment.tokenNumber}
                  </Badge>

                  <Badge variant="outline" className={`text-xs ${waitTime > 60 ? 'border-red-500 text-red-700' :
                    waitTime > 30 ? 'border-orange-500 text-orange-700' :
                      'border-slate-500 text-slate-700'
                    }`}>
                    <Clock className="h-3 w-3 mr-1" />
                    {formatWaitTime(waitTime)}
                  </Badge>

                  <Badge variant="outline" className={`text-xs ${patient.priorityLabel === 'EMERGENCY' ? 'border-red-500 text-red-700 bg-red-50' :
                    patient.priorityLabel === 'PRIORITY' ? 'border-orange-500 text-orange-700 bg-orange-50' :
                      patient.priorityLabel === 'CHILDREN' ? 'border-purple-500 text-purple-700 bg-purple-50' :
                        patient.priorityLabel === 'SENIORS' ? 'border-amber-500 text-amber-700 bg-amber-50' :
                          patient.priorityLabel === 'LONGWAIT' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                            patient.priorityLabel === 'REFERRAL' ? 'border-indigo-500 text-indigo-700 bg-indigo-50' :
                              patient.priorityLabel === 'FOLLOWUP' ? 'border-green-500 text-green-700 bg-green-50' :
                                patient.priorityLabel === 'PREPOSTOP' ? 'border-cyan-500 text-cyan-700 bg-cyan-50' :
                                  'border-blue-500 text-blue-700 bg-blue-50'
                    }`}>
                    {patient.priorityLabel || 'ROUTINE'}
                  </Badge>

                  <Badge 
                    variant="outline"
                    className={`text-xs ${patient.receptionist2Reviewed 
                      ? 'bg-green-50 border-green-300 text-green-700' 
                      : 'bg-yellow-50 border-yellow-300 text-yellow-700'
                    }`}
                  >
                    {patient.receptionist2Reviewed ? '✓ Present' : '⏳ Not Confirmed'}
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
                        onClick={() => handleBringPatientToTop(patient.id, `${patient.patient.firstName} ${patient.patient.lastName}`, 'Emergency escalation')}
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 text-red-600 border-red-200 hover:bg-red-50"
                        disabled={bringToTopMutation.isPending}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Bring to top</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleMoveToNextInLineClick(patient)}
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
              </div>

              {/* Main Action Button */}
              <div>
                {patient.status === 'CALLED' && (
                  <Button
                    onClick={() => navigate(`/patient-examination/${patient.id}`)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Start Examination
                  </Button>
                )}
                {patient.status === 'IN_PROGRESS' && (
                  <Button
                    onClick={() => navigate(`/patient-examination/${patient.id}`)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Continue Examination
                  </Button>
                )}
                {patient.status === 'WAITING' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Waiting
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Separator className="my-6" />

        {/* Doctor's Priority Queue Section - styled to match Optometry Priority Queue Management */}
        <Card className="w-full shadow-sm border h-[600px] lg:h-[calc(100vh-420px)] flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                  My Queue - Drag to Reorder
                  {isSocketConnected && (
                    <div className="relative w-2 h-2 ml-2">
                      <div className="absolute w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                      <div className="absolute w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  )}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {stats.total} assigned
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {stats.emergency} emergency
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    {stats.averageWaitTime}m avg wait
                  </span>
                  {isDragging && (
                    <span className="flex items-center gap-1 text-green-600">
                      <GripVertical className="h-4 w-4" />
                      Reordering...
                    </span>
                  )}
                  {reorderMutation.isPending && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving order...
                    </span>
                  )}
                  {queueLoading && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Syncing (5s)...
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search assigned patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button
                  onClick={async () => {
                    await queryClient.invalidateQueries(['doctor-assigned-queue', user?.id]);
                    await refetch();
                    toast.info('Data refreshed from server');
                  }}
                  variant="outline"
                  size="sm"
                  disabled={queueLoading}
                  title="Force refresh from server"
                >
                  <RefreshCw className={`h-4 w-4 ${queueLoading ? 'animate-spin' : ''}`} />
                  {queueLoading ? 'Syncing...' : 'Refresh'}
                </Button>

                <Button
                  size="sm"
                  onClick={() => setFcfsDialogOpen(true)}
                  disabled={applyFCFSMutation.isPending || !getAllAssignedPatientsInOrder()?.length}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Apply FCFS
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
              {/* Enhanced Tab List */}
              <TabsList className="flex w-full gap-1 mb-6 p-1 bg-gray-50 rounded-lg h-auto shadow-inner flex-shrink-0">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
                >
                  <Users className="h-4 w-4" />
                  <span>All</span>
                  <span className="text-xs">({filterPatientsByTab(getAssignedPatients(), 'all').length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="priority"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1 relative group"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Priority</span>
                  <span className="text-xs">({filterPatientsByTab(getAssignedPatients(), 'priority').length})</span>
                  {filterPatientsByTab(getAssignedPatients(), 'priority').length > 0 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBringPriorityToTop('PRIORITY');
                      }}
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white rounded-full transition-opacity"
                      title="Bring all priority patients to top"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="emergency"
                  className="data-[state=active]:bg-red-700 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1 relative group"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Emergency</span>
                  <span className="text-xs">({filterPatientsByTab(getAssignedPatients(), 'emergency').length})</span>
                  {filterPatientsByTab(getAssignedPatients(), 'emergency').length > 0 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBringPriorityToTop('EMERGENCY');
                      }}
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-red-600 hover:bg-red-700 text-white rounded-full transition-opacity"
                      title="Bring all emergency patients to top"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="children"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1 relative group"
                >
                  <Baby className="h-4 w-4" />
                  <span>Children</span>
                  <span className="text-xs">({filterPatientsByTab(getAssignedPatients(), 'children').length})</span>
                  {filterPatientsByTab(getAssignedPatients(), 'children').length > 0 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBringPriorityToTop('CHILDREN');
                      }}
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-opacity"
                      title="Bring all children to top"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="seniors"
                  className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1 relative group"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Seniors</span>
                  <span className="text-xs">({filterPatientsByTab(getAssignedPatients(), 'seniors').length})</span>
                  {filterPatientsByTab(getAssignedPatients(), 'seniors').length > 0 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBringPriorityToTop('SENIORS');
                      }}
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-orange-600 hover:bg-orange-700 text-white rounded-full transition-opacity"
                      title="Bring all senior patients to top"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="longwait"
                  className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1 relative group"
                >
                  <Clock className="h-4 w-4" />
                  <span>Long Wait</span>
                  <span className="text-xs">({filterPatientsByTab(getAssignedPatients(), 'longwait').length})</span>
                  {filterPatientsByTab(getAssignedPatients(), 'longwait').length > 0 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBringPriorityToTop('LONGWAIT');
                      }}
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-amber-600 hover:bg-amber-700 text-white rounded-full transition-opacity"
                      title="Bring all long-wait patients to top"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="referral"
                  className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1 relative group"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Referral</span>
                  <span className="text-xs">({filterPatientsByTab(getAssignedPatients(), 'referral').length})</span>
                  {filterPatientsByTab(getAssignedPatients(), 'referral').length > 0 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBringPriorityToTop('REFERRAL');
                      }}
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-opacity"
                      title="Bring all referral patients to top"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="followup"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1 relative group"
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span>Follow-Up</span>
                  <span className="text-xs">({filterPatientsByTab(getAssignedPatients(), 'followup').length})</span>
                  {filterPatientsByTab(getAssignedPatients(), 'followup').length > 0 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBringPriorityToTop('FOLLOWUP');
                      }}
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-green-600 hover:bg-green-700 text-white rounded-full transition-opacity"
                      title="Bring all follow-up patients to top"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="routine"
                  className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1 relative group"
                >
                  <Activity className="h-4 w-4" />
                  <span>Routine</span>
                  <span className="text-xs">({filterPatientsByTab(getAssignedPatients(), 'routine').length})</span>
                  {filterPatientsByTab(getAssignedPatients(), 'routine').length > 0 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBringPriorityToTop('ROUTINE');
                      }}
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-teal-600 hover:bg-teal-700 text-white rounded-full transition-opacity"
                      title="Bring all routine patients to top"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="prepostop"
                  className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1 relative group"
                >
                  <Scissors className="h-4 w-4" />
                  <span>Pre/Post-Op</span>
                  <span className="text-xs">({filterPatientsByTab(getAssignedPatients(), 'prepostop').length})</span>
                  {filterPatientsByTab(getAssignedPatients(), 'prepostop').length > 0 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBringPriorityToTop('PREPOSTOP');
                      }}
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full transition-opacity"
                      title="Bring all pre/post-op patients to top"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="scheduled"
                  className="data-[state=active]:bg-lime-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1 relative group"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>Scheduled</span>
                  <span className="text-xs">({filterPatientsByTab(getAssignedPatients(), 'scheduled').length})</span>
                  {filterPatientsByTab(getAssignedPatients(), 'scheduled').length > 0 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBringPriorityToTop('SCHEDULED');
                      }}
                      size="sm"
                      variant="ghost"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 bg-lime-600 hover:bg-lime-700 text-white rounded-full transition-opacity"
                      title="Bring all scheduled patients to top"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Tab Content for All Categories */}
              {['all', 'priority', 'emergency', 'children', 'seniors', 'longwait', 'referral', 'followup', 'routine', 'prepostop', 'scheduled'].map(tabValue => (
                <TabsContent key={tabValue} value={tabValue} className="flex-1 overflow-y-auto data-[state=inactive]:hidden scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
                  <div className="space-y-3 pr-2">
                    {filteredPatients.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        {queueLoading && <RefreshCw className="h-16 w-16 mx-auto mb-4 opacity-50 animate-spin" />}
                        {queueError && <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50 text-red-500" />}
                        {!queueLoading && !queueError && (
                          <>
                            {tabValue === 'all' && <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-50" />}
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
                          {queueLoading && 'Loading assigned patients...'}
                          {queueError && 'Failed to load assigned patients'}
                          {!queueLoading && !queueError && (
                            <>
                              {tabValue === 'all' && 'No assigned patients'}
                              {tabValue === 'priority' && 'No priority patients assigned'}
                              {tabValue === 'emergency' && 'No emergency patients assigned'}
                              {tabValue === 'children' && 'No pediatric patients assigned'}
                              {tabValue === 'seniors' && 'No senior patients assigned'}
                              {tabValue === 'longwait' && 'No patients with long wait times assigned'}
                              {tabValue === 'referral' && 'No referral patients assigned'}
                              {tabValue === 'followup' && 'No follow-up patients assigned'}
                              {tabValue === 'routine' && 'No routine patients assigned'}
                              {tabValue === 'prepostop' && 'No pre/post-operative patients assigned'}
                              {tabValue === 'scheduled' && 'No scheduled appointment patients assigned'}
                            </>
                          )}
                        </h3>
                        <p className="text-sm">
                          {queueLoading && 'Please wait while we fetch your assigned patients...'}
                          {queueError && `Error: ${queueError.message || 'Unable to connect to server'}`}
                          {!queueLoading && !queueError && (
                            <>
                              {tabValue === 'all' && 'Patients assigned to you will appear here.'}
                              {tabValue === 'priority' && 'High-priority patients assigned to you will appear here.'}
                              {tabValue === 'emergency' && 'Emergency patients assigned to you will appear here.'}
                              {tabValue === 'children' && 'Pediatric patients assigned to you will appear here.'}
                              {tabValue === 'seniors' && 'Senior patients assigned to you will appear here.'}
                              {tabValue === 'longwait' && 'Patients with long wait times assigned to you will appear here.'}
                              {tabValue === 'referral' && 'Referral patients assigned to you will appear here.'}
                              {tabValue === 'followup' && 'Follow-up patients assigned to you will appear here.'}
                              {tabValue === 'routine' && 'Routine patients assigned to you will appear here.'}
                              {tabValue === 'prepostop' && 'Pre/post-operative patients assigned to you will appear here.'}
                              {tabValue === 'scheduled' && 'Patients with pre-scheduled appointments assigned to you will appear here.'}
                            </>
                          )}
                        </p>
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                      >
                        <SortableContext
                          items={filteredPatients.map(p => p.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {filteredPatients.map((patient, index) => (
                              <SortablePatientCard
                                key={patient.id}
                                patient={patient}
                                index={index}
                              />
                            ))}
                          </div>
                        </SortableContext>
                        <DragOverlay>
                          {activeId ? (
                            <PatientCard
                              patient={filteredPatients.find(p => p.id === activeId)}
                              index={filteredPatients.findIndex(p => p.id === activeId)}
                              isDragging={true}
                            />
                          ) : null}
                        </DragOverlay>
                      </DndContext>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Move to Next-in-Line Confirmation Dialog */}
      <Dialog 
        open={nextInLineConfirmation.isOpen} 
        onOpenChange={(open) => setNextInLineConfirmation({ isOpen: open, patient: null })}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <FastForward className="h-5 w-5" />
              Move to Next-in-Line
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to move this patient to the Next-in-Line panel?
            </DialogDescription>
          </DialogHeader>
          
          {nextInLineConfirmation.patient && (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Patient Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">
                      {nextInLineConfirmation.patient.patient.firstName}{nextInLineConfirmation.patient.patient.middleName ? ' ' + nextInLineConfirmation.patient.patient.middleName : ''} {nextInLineConfirmation.patient.patient.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MRN:</span>
                    <span className="font-medium">{nextInLineConfirmation.patient.patient.patientNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Position:</span>
                    <span className="font-medium">#{nextInLineConfirmation.patient.doctorQueuePosition || 'unset'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token:</span>
                    <span className="font-medium">{nextInLineConfirmation.patient.patientVisit.appointment.tokenNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        nextInLineConfirmation.patient.priorityLabel === 'EMERGENCY' ? 'border-red-500 text-red-700 bg-red-50' :
                        nextInLineConfirmation.patient.priorityLabel === 'PRIORITY' ? 'border-orange-500 text-orange-700 bg-orange-50' :
                        nextInLineConfirmation.patient.priorityLabel === 'CHILDREN' ? 'border-purple-500 text-purple-700 bg-purple-50' :
                        nextInLineConfirmation.patient.priorityLabel === 'SENIORS' ? 'border-amber-500 text-amber-700 bg-amber-50' :
                        'border-blue-500 text-blue-700 bg-blue-50'
                      }`}
                    >
                      {nextInLineConfirmation.patient.priorityLabel || 'ROUTINE'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Note:</strong> This patient will be moved to the Next-in-Line panel (positions 1-3), 
                  placing them at the front of your queue for immediate attention.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNextInLineConfirmation({ isOpen: false, patient: null })}
              disabled={moveToNextInLineMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMoveToNextInLine}
              disabled={moveToNextInLineMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FCFS Confirmation Dialog */}
      <Dialog open={fcfsDialogOpen} onOpenChange={setFcfsDialogOpen}>
        <DialogContent style={{ fontFamily: 'Bricolage Grotesque' }}>
          <DialogHeader>
            <DialogTitle>Apply First-Come-First-Served Order?</DialogTitle>
            <DialogDescription>
              This will reorder your assigned patients based on when they completed their optometrist examination.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> This action will override any manual reordering you've done. 
                Patients who completed their examination earlier will be moved to higher priority positions.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFcfsDialogOpen(false)}
              disabled={applyFCFSMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => applyFCFSMutation.mutate()}
              disabled={applyFCFSMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {applyFCFSMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Apply FCFS
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-Screen Focus Mode Modal */}
      <Dialog open={isFocusMode} onOpenChange={setIsFocusMode}>
        <DialogPortal>
          {/* Custom overlay with blur effect */}
          <DialogOverlay className="fixed inset-0 z-50 bg-white/10 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          
          {/* Full-screen content */}
          <DialogPrimitive.Content
            className="fixed inset-0 z-50 w-screen h-screen m-0 p-0 border-0 outline-none focus:outline-none overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {/* Floating Close Button */}
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
              {/* Row 1, Column 1: Queue Panels (Next-in-Line + Under Observation) */}
              <div 
                className="overflow-hidden rounded-lg"
                style={{ minHeight: 0 }}
              >
                <Card className="h-full flex flex-col bg-white shadow-sm border">
                  {/* Minimal header with title */}
                  <div className="flex-shrink-0 px-3 py-2 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <Users className="h-4 w-4 text-blue-600" />
                      Queue Panels
                    </div>
                  </div>
                  
                  {/* Tabs - flush with edges, no extra padding */}
                  <Tabs defaultValue="next-in-line" className="flex-1 flex flex-col min-h-0">
                    <TabsList className="flex-shrink-0 grid w-full grid-cols-2 rounded-none border-b bg-gray-50 h-10">
                      <TabsTrigger 
                        value="next-in-line" 
                        className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-none border-r text-xs h-full"
                      >
                        Next in Line
                      </TabsTrigger>
                      <TabsTrigger 
                        value="under-observation" 
                        className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-none text-xs h-full"
                      >
                        Under Observation
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Content area - child components render in focus view mode */}
                    <TabsContent 
                      value="next-in-line" 
                      className="flex-1 m-0 p-0 data-[state=inactive]:hidden overflow-hidden"
                    >
                      <NextInLineOphthalmologist focusViewMode={true} />
                    </TabsContent>
                    <TabsContent 
                      value="under-observation" 
                      className="flex-1 m-0 p-0 data-[state=inactive]:hidden overflow-hidden"
                    >
                      <PatientsUnderObservation user={user} focusViewMode={true} />
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>

              {/* Row 1, Column 2: Patient Consultation (CALLED / IN_PROGRESS patients) */}
              <div 
                className="overflow-hidden rounded-lg"
                style={{ minHeight: 0 }}
              >
                <FocusViewConsultationPanel user={user} openExaminationModal={openExaminationModal} />
              </div>

              {/* Row 2: My Queue - Drag to Reorder - spans both columns */}
              <div className="overflow-hidden rounded-lg" style={{ gridColumn: '1 / -1', minHeight: 0 }}>
                <Card className="w-full h-full shadow-lg border-2 border-blue-200/50 flex flex-col bg-white">
                  <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0 bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base font-bold text-gray-800">
                          <UserCheck className="h-5 w-5 text-purple-600" />
                          My Queue - Drag to Reorder
                          {isSocketConnected && (
                            <div className="relative w-2 h-2 ml-2">
                              <div className="absolute w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                              <div className="absolute w-2 h-2 rounded-full bg-green-500"></div>
                            </div>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                          {stats.total !== undefined && !isNaN(stats.total) && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {stats.total} assigned
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
                          size="sm"
                          onClick={() => setFcfsDialogOpen(true)}
                          disabled={applyFCFSMutation.isPending || !getAllAssignedPatientsInOrder()?.length}
                          className="bg-blue-500 text-white hover:bg-blue-600"
                        >
                          {applyFCFSMutation.isPending ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            <>
                              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
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
                        {['all', 'priority', 'emergency', 'children', 'seniors', 'longwait', 'referral', 'followup', 'routine', 'prepostop', 'scheduled'].map(tabValue => {
                          const tabConfig = {
                            all: { icon: Users, label: 'All', activeClass: 'data-[state=active]:bg-purple-600' },
                            priority: { icon: AlertTriangle, label: 'Priority', activeClass: 'data-[state=active]:bg-red-600' },
                            emergency: { icon: AlertCircle, label: 'Emergency', activeClass: 'data-[state=active]:bg-red-700' },
                            children: { icon: Baby, label: 'Children', activeClass: 'data-[state=active]:bg-purple-600' },
                            seniors: { icon: UserCheck, label: 'Seniors', activeClass: 'data-[state=active]:bg-orange-600' },
                            longwait: { icon: Clock, label: 'Long Wait', activeClass: 'data-[state=active]:bg-amber-600' },
                            referral: { icon: RefreshCw, label: 'Referral', activeClass: 'data-[state=active]:bg-indigo-600' },
                            followup: { icon: CalendarCheck, label: 'Follow-Up', activeClass: 'data-[state=active]:bg-green-600' },
                            routine: { icon: Activity, label: 'Routine', activeClass: 'data-[state=active]:bg-teal-600' },
                            prepostop: { icon: Scissors, label: 'Pre/Post-Op', activeClass: 'data-[state=active]:bg-cyan-600' },
                            scheduled: { icon: CalendarDays, label: 'Scheduled', activeClass: 'data-[state=active]:bg-lime-600' },
                          };
                          const config = tabConfig[tabValue];
                          const TabIcon = config.icon;
                          return (
                            <TabsTrigger
                              key={tabValue}
                              value={tabValue}
                              className={`flex-1 ${config.activeClass} data-[state=active]:text-white text-[10px] px-1 py-1 flex flex-col items-center gap-0 min-h-[36px]`}
                            >
                              <TabIcon className="h-3 w-3" />
                              <span>{config.label}</span>
                              <span className="text-[10px]">({filterPatientsByTab(getAssignedPatients(), tabValue).length})</span>
                            </TabsTrigger>
                          );
                        })}
                      </TabsList>

                      {/* Tab Content - Reuse existing filtered patients with drag and drop */}
                      {['all', 'priority', 'emergency', 'children', 'seniors', 'longwait', 'referral', 'followup', 'routine', 'prepostop', 'scheduled'].map(tabValue => (
                        <TabsContent key={tabValue} value={tabValue} className="flex-1 overflow-y-auto data-[state=inactive]:hidden scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 min-h-0">
                          <div className="space-y-2 pr-2">
                            {filteredPatients.length === 0 ? (
                              <div className="text-center py-6 text-slate-500 flex flex-col items-center justify-center">
                                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                <h3 className="text-sm font-medium mb-1">
                                  {queueLoading ? 'Loading...' : queueError ? 'Failed to load' : `No ${tabValue === 'all' ? '' : tabValue} patients`}
                                </h3>
                                <p className="text-xs">
                                  {!queueLoading && !queueError && 'Assigned patients will appear here'}
                                </p>
                              </div>
                            ) : (
                              <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragCancel={handleDragCancel}
                              >
                                <SortableContext
                                  items={filteredPatients.map(p => p.id)}
                                  strategy={verticalListSortingStrategy}
                                >
                                  <div className="space-y-2">
                                    {filteredPatients.map((patient, index) => (
                                      <SortablePatientCard
                                        key={patient.id}
                                        patient={patient}
                                        index={index}
                                      />
                                    ))}
                                  </div>
                                </SortableContext>
                                <DragOverlay>
                                  {activeId ? (
                                    <PatientCard
                                      patient={filteredPatients.find(p => p.id === activeId)}
                                      index={filteredPatients.findIndex(p => p.id === activeId)}
                                      isDragging={true}
                                    />
                                  ) : null}
                                </DragOverlay>
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

      {/* Patient Examination Modal */}
      <PatientExaminationModal
        isOpen={examinationModalOpen}
        onClose={closeExaminationModal}
        queueEntryId={selectedQueueEntryId}
      />
    </TooltipProvider>
  );
};

export default DoctorPriorityQueuePanel;