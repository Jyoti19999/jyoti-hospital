import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, ArrowUp, ArrowDown, RotateCcw, Users, Lock, GripVertical, Eye, Clock } from 'lucide-react';
import useOptometristStore from '@/stores/optometrist';
import OverrideReasonModal from './OverrideReasonModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { optometristQueueService } from '@/services/optometristQueueService';
import { toast } from 'sonner';

const NextInLineQueueManagement = ({ queuePatients = [], isLoading = false, error = null }) => {
  const {
    movePatientUp,
    movePatientDown,
    overrideNextInLine,
    reorderQueue: storeReorderQueue
  } = useOptometristStore();

  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [pendingOverrideOrder, setPendingOverrideOrder] = useState([]);
  const [nextInLineList, setNextInLineList] = useState([]);

  const queryClient = useQueryClient();

  // Reorder queue mutation
  const reorderQueueMutation = useMutation({
    mutationFn: ({ reorderedEntries, reason }) => optometristQueueService.reorderQueue(reorderedEntries, reason),
    onSuccess: (data, variables) => {
      
      // Show appropriate toast message based on the type of reorder
      const { reason } = variables;
      const isNextInLineReorder = reason && reason !== 'Direct queue reorder via drag and drop';
      
      if (isNextInLineReorder) {
        toast.success('Next-in-Line Reordered', {
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
    }
  });

  // Use real API data instead of store data
  const activePatients = queuePatients;
  
  // Debug: Log what we received
  
  // Next-in-line: First 3 patients in queue
  const nextInLinePatients = activePatients.slice(0, 3);
  

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

  // Handle drag end for next-in-line patients (requires override modal)
  const handleNextInLineDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = nextInLineList.findIndex(patient => patient.queueEntryId === active.id);
    const newIndex = nextInLineList.findIndex(patient => patient.queueEntryId === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Update local state for preview
    const newOrder = arrayMove(nextInLineList, oldIndex, newIndex);
    
    // Set pending order and show override modal
    setPendingOverrideOrder(newOrder);
    setIsOverrideModalOpen(true);
  };

  const handleManualOverride = () => {
    const newOrder = [...nextInLinePatients];
    setPendingOverrideOrder(newOrder);
    setIsOverrideModalOpen(true);
  };

  const handleConfirmOverride = (reason) => {
    // Show loading toast for next-in-line reorder
    const loadingToastId = toast.loading('Reordering Next-in-Line...', {
      description: `Updating priority order with reason: ${reason}`,
    });

    // Prepare reorder data for next-in-line override
    const reorderedEntries = pendingOverrideOrder.map((patient, index) => ({
      queueEntryId: patient.queueEntryId,
      currentQueueNumber: patient.queueNumber,
      newQueueNumber: index + 1 // Positions 1, 2, 3 for next-in-line
    }));

    // Update the local next-in-line list
    setNextInLineList(pendingOverrideOrder);

    // Call API with reason
    reorderQueueMutation.mutate({ 
      reorderedEntries, 
      reason 
    }, {
      onSettled: () => {
        // Dismiss loading toast
        toast.dismiss(loadingToastId);
      }
    });

    setPendingOverrideOrder([]);
  };

  // Removed moveInNextInLine function - now using drag and drop

  const getWaitTime = (patient) => {
    const now = new Date();
    const waitStart = new Date(patient.joinedAt); // Use joinedAt from API response
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
      id: patient.queueEntryId // Use queueEntryId from API response
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
          <div className="flex items-center gap-3 flex-1">
            {/* Drag Handle - always visible now */}
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
                {patient.queueNumber}
              </div>
              {isNext && (
                <Badge variant="default" className="text-xs mt-1">
                  NEXT
                </Badge>
              )}
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold">{patient.patient?.fullName || 'N/A'}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {patient.patient?.gender} • {patient.visit?.visitType || patient.appointment?.appointmentType || 'N/A'}
              </p>
            </div>
          </div>
          
          {/* Status and Wait Time - Vertically centered at the end */}
          <div className="flex flex-col gap-1 items-end">
            {/* Show status with icon */}
            <Badge variant="outline" className="text-xs flex items-center gap-1 bg-yellow-50 border-yellow-300 text-yellow-800">
              {patient.status === 'WAITING' && <Clock className="h-3 w-3" />}
              {patient.status}
            </Badge>
            <Badge variant="outline" className="text-xs bg-gray-50 border-gray-300 text-gray-700">
              {formatWaitTime(getWaitTime(patient))}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-white shadow-sm border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
            <Eye className="h-5 w-5 text-blue-600" />
            Next-in-Line Panel
          </CardTitle>
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
      </CardHeader>
      <CardContent className="pt-2 mb-3.5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100 pr-2 mr-2">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-50 animate-spin" />
            <p>Loading queue data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3" />
            <p>Failed to load queue data</p>
            <p className="text-sm mt-1 text-muted-foreground">{error.message}</p>
          </div>
        ) : nextInLinePatients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No patients in queue</p>
            <p className="text-sm mt-1">Patients will appear here when they check in</p>
          </div>
        ) : (
          <div className="pr-2 pb-3">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleNextInLineDragEnd}
            >
              <SortableContext 
                items={nextInLineList.map(p => p.queueEntryId)}
                strategy={verticalListSortingStrategy}
              >
                {nextInLineList.map((patient, index) => (
                  <SortablePatientItem
                    key={patient.queueEntryId}
                    patient={patient}
                    index={index}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
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

export default NextInLineQueueManagement;