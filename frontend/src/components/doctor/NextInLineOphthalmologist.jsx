import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RotateCcw, Users, Eye, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import ophthalmologistQueueService from '@/services/ophthalmologistQueueService';
import OverrideReasonModal from './OverrideReasonModal';
import { useDoctorQueueSocket } from '@/hooks/useQueueSocket';

const NextInLineOphthalmologist = ({ focusViewMode = false }) => {
  const { user } = useAuth();
  
  // 🔌 WebSocket real-time updates
  useDoctorQueueSocket();
  
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [pendingOverrideOrder, setPendingOverrideOrder] = useState([]);
  const [nextInLineList, setNextInLineList] = useState([]);

  const queryClient = useQueryClient();

  // Fetch doctor-specific queue data - WebSocket handles real-time updates!
  const { data: queueData, isLoading: queueLoading, error: queueError } = useQuery({
    queryKey: ['doctor-assigned-queue', user?.id],
    queryFn: ophthalmologistQueueService.getDoctorQueue,
    staleTime: 0, // Always consider data stale for immediate updates
    cacheTime: 0, // Don't cache
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: !!user?.id
  });

  // Reorder queue mutation
  const reorderQueueMutation = useMutation({
    mutationFn: (reorderedPatients) => ophthalmologistQueueService.reorderDoctorQueue(reorderedPatients),
    onSuccess: (data, variables) => {
      
      toast.success('Next-in-Line Reordered', {
        description: `Top 3 patients reordered successfully`,
        duration: 4000,
      });
      
      // Refresh the queue data
      queryClient.invalidateQueries(['doctor-assigned-queue']);
    },
    onError: (error) => {
      
      toast.error('Reorder Failed', {
        description: error.message || 'Failed to reorder next-in-line queue. Please try again.',
        duration: 4000,
      });
    }
  });

  // Get assigned patients and handle both scenarios
  const getAssignedPatients = () => {
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

  const assignedPatients = getAssignedPatients();
  // Next-in-line: First 3 assigned patients
  const nextInLinePatients = assignedPatients.slice(0, 3);

  // Update lists when patients change
  useEffect(() => {
    setNextInLineList([...nextInLinePatients]);
  }, [JSON.stringify(nextInLinePatients)]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for next-in-line patients
  const handleNextInLineDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }


    const oldIndex = nextInLineList.findIndex(patient => (patient.queueEntryId || patient.id) === active.id);
    const newIndex = nextInLineList.findIndex(patient => (patient.queueEntryId || patient.id) === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }


    // Create new order for top 3 positions
    const newOrder = arrayMove(nextInLineList, oldIndex, newIndex);
    
    // Set pending order and show override modal (require reason for reordering)
    setPendingOverrideOrder(newOrder);
    setIsOverrideModalOpen(true);
  };

  const handleManualOverride = () => {
    const newOrder = [...nextInLinePatients];
    setPendingOverrideOrder(newOrder);
    setIsOverrideModalOpen(true);
  };

  const handleConfirmOverride = (reason) => {
    // Show loading toast
    const loadingToastId = toast.loading('Reordering Next-in-Line...', {
      description: `Updating top 3 patients priority with reason: ${reason}`,
    });

    // Get all assigned patients (not just top 3)
    const allAssignedPatients = getAssignedPatients();
    

    // Create the new complete order:
    // 1. First 3 positions = pendingOverrideOrder (reordered by user)
    // 2. Remaining positions = existing patients after position 3
    const reorderedCompleteList = [
      ...pendingOverrideOrder,  // New order for top 3 (positions 1, 2, 3)
      ...allAssignedPatients.slice(3) // Rest unchanged (positions 4+)
    ];

    // Map to API format - assign sequential doctorQueuePosition starting from 1
    const reorderedPatients = reorderedCompleteList.map((patient, index) => ({
      queueEntryId: patient.queueEntryId || patient.id,
      doctorQueuePosition: index + 1
    }));


    // Update the local next-in-line list for immediate UI feedback
    setNextInLineList([...pendingOverrideOrder]);

    // Call the same API endpoint used by DoctorPriorityQueuePanel
    reorderQueueMutation.mutate(reorderedPatients, {
      onSettled: () => {
        // Dismiss loading toast
        toast.dismiss(loadingToastId);
      }
    });

    setPendingOverrideOrder([]);
  };

  const getWaitTime = (patient) => {
    const now = new Date();
    const waitStart = new Date(patient.joinedAt);
    return Math.floor((now - waitStart) / (1000 * 60));
  };

  const formatWaitTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getPriorityColor = (priorityLabel) => {
    switch (priorityLabel) {
      case 'EMERGENCY': return 'bg-red-600 text-white';
      case 'PRIORITY': return 'bg-red-500 text-white';
      case 'CHILDREN': 
      case 'SENIORS': return 'bg-orange-500 text-white';
      case 'LONGWAIT': return 'bg-orange-400 text-white';
      case 'REFERRAL':
      case 'FOLLOWUP': return 'bg-blue-500 text-white';
      case 'PREPOSTOP': return 'bg-purple-500 text-white';
      case 'ROUTINE':
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Sortable Item Component for Drag and Drop
  const SortablePatientItem = ({ patient, index }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ 
      id: patient.queueEntryId || patient.id // Handle both field names
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.8 : 1,
    };

    const isNext = index === 0;

    return (
      <div 
        ref={setNodeRef}
        style={style}
        className={`transition-all duration-200 p-4 rounded-lg border ${
          isNext 
            ? 'ring-2 ring-blue-500 bg-blue-50/50 border-blue-200' 
            : 'bg-white border-gray-200 hover:bg-gray-50'
        } ${isDragging ? 'shadow-lg z-50' : ''} ${index > 0 ? 'mt-3' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                isNext 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {index + 1}
              </div>
              {isNext && (
                <Badge variant="default" className="text-xs mt-1">
                  NEXT
                </Badge>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">
                  {patient.patient ? 
                    `${patient.patient.firstName}${patient.patient.middleName ? ' ' + patient.patient.middleName : ''} ${patient.patient.lastName}` : 
                    'N/A'
                  }
                </h4>
                <Badge className={`text-xs ${getPriorityColor(patient.priorityLabel)}`}>
                  {patient.patientVisit?.appointment?.tokenNumber || 'No Token'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {formatWaitTime(getWaitTime(patient))}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {patient.patient?.gender || 'Unknown'} • {patient.patientVisit?.appointment?.appointmentType || patient.patientVisit?.visitType || 'N/A'}
              </p>
              {/* Presence Confirmation Status */}
              <Badge 
                variant={patient.receptionist2Reviewed ? "success" : "secondary"} 
                className={`text-xs mt-1 ${
                  patient.receptionist2Reviewed 
                    ? 'bg-green-100 text-green-700 border-green-300' 
                    : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                }`}
              >
                {patient.receptionist2Reviewed ? '✓ Present at Premises' : '⏳ Presence Not Confirmed'}
              </Badge>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              Queue Pos: {patient.doctorQueuePosition || 'Unset'}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  // Focus View Mode: Render without Card wrapper, with fixed title and scrollable content
  if (focusViewMode) {
    return (
      <div className="flex flex-col h-full p-3">
        {/* Fixed Title Section */}
        {/* <div className="flex-shrink-0 px-3 py-2 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Eye className="h-4 w-4 text-blue-600" />
              Next-in-Line Panel
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                disabled={queueLoading}
                className="h-7 px-2 text-xs"
              >
                <RotateCcw className={`h-3 w-3 ${queueLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualOverride}
                disabled={nextInLinePatients.length === 0}
                className="text-orange-600 border-orange-600 hover:bg-orange-50 h-7 px-2 text-xs"
              >
                <AlertTriangle className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div> */}
        
        {/* Content - No scrolling needed, shows exactly 3 patients */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-gray-100">
          {queueLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <RotateCcw className="h-10 w-10 mx-auto mb-3 opacity-50 animate-spin" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : queueError ? (
            <div className="text-center py-8 text-red-500">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3" />
              <p className="text-sm">Failed to load</p>
            </div>
          ) : nextInLinePatients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No patients waiting</p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleNextInLineDragEnd}
            >
              <SortableContext 
                items={nextInLineList.map(p => p.queueEntryId || p.id)}
                strategy={verticalListSortingStrategy}
              >
                {nextInLineList.map((patient, index) => (
                  <SortablePatientItem
                    key={patient.queueEntryId || patient.id}
                    patient={patient}
                    index={index}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
        
        <OverrideReasonModal
          isOpen={isOverrideModalOpen}
          onClose={() => {
            setIsOverrideModalOpen(false);
            setPendingOverrideOrder([]);
          }}
          onConfirm={handleConfirmOverride}
          affectedPatients={pendingOverrideOrder}
        />
      </div>
    );
  }

  // Normal Mode: Render with Card wrapper
  return (
    <Card className="bg-white shadow-sm border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
            <Eye className="h-5 w-5 text-blue-600" />
            Next-in-Line Panel
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              disabled={queueLoading}
              className="h-8 px-3"
            >
              <RotateCcw className={`h-3.5 w-3.5 mr-1 ${queueLoading ? 'animate-spin' : ''}`} />
              {queueLoading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualOverride}
              disabled={nextInLinePatients.length === 0}
              className="text-orange-600 border-orange-600 hover:bg-orange-50 h-8 px-3"
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              Override Order
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {queueLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-50 animate-spin" />
            <p>Loading assigned patients...</p>
          </div>
        ) : queueError ? (
          <div className="text-center py-8 text-red-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3" />
            <p>Failed to load assigned patients</p>
            <p className="text-sm mt-1 text-muted-foreground">{queueError.message}</p>
          </div>
        ) : nextInLinePatients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No assigned patients waiting</p>
            <p className="text-sm mt-1">Assigned patients will appear here when they're in your queue</p>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleNextInLineDragEnd}
          >
            <SortableContext 
              items={nextInLineList.map(p => p.queueEntryId || p.id)}
              strategy={verticalListSortingStrategy}
            >
              {nextInLineList.map((patient, index) => (
                <SortablePatientItem
                  key={patient.queueEntryId || patient.id}
                  patient={patient}
                  index={index}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <OverrideReasonModal
        isOpen={isOverrideModalOpen}
        onClose={() => {
          setIsOverrideModalOpen(false);
          setPendingOverrideOrder([]);
        }}
        onConfirm={handleConfirmOverride}
        affectedPatients={pendingOverrideOrder}
      />
    </Card>
  );
};

export default NextInLineOphthalmologist;