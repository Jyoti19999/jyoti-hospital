// src/stores/optometrist.js
import { create } from 'zustand';
import { 
  generateToken, 
  parseToken, 
  updateTokenStage, 
  determinePriority,
  STAGE_PREFIXES, 
  PRIORITY_LEVELS,
  PRIORITY_DESCRIPTIONS 
} from '@/lib/tokenService';

// Priority color mappings for UI
export const PRIORITY_COLORS = {
  1: 'bg-red-100 text-red-800 border-red-200', // Emergency
  2: 'bg-red-100 text-red-800 border-red-200', // Post-op
  3: 'bg-red-100 text-red-800 border-red-200', // Pre-op
  4: 'bg-orange-100 text-orange-800 border-orange-200', // Child under 5
  5: 'bg-orange-100 text-orange-800 border-orange-200', // Senior 60+
  6: 'bg-orange-100 text-orange-800 border-orange-200', // Extended wait
  7: 'bg-orange-100 text-orange-800 border-orange-200', // Referral
  8: 'bg-orange-100 text-orange-800 border-orange-200', // Review
  9: 'bg-green-100 text-green-800 border-green-200', // Follow-up
  10: 'bg-green-100 text-green-800 border-green-200', // New patient
  11: 'bg-green-100 text-green-800 border-green-200', // Routine
};

const useOptometristStore = create((set, get) => ({

  activePatients: [],
  
  // dashboard summary counts (numbers)
  
  totalPatientsInQueue: 0,
  patientsWaiting: 0,
  averageConsultationTime: 0,
  averageWaitTime: 0,
  isLoading: false,

  fetchDashboardStats: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/optometrist/dashboard/stats`, {
        credentials: 'include'
      });
      const result = await response.json();
      const stats = result.data;

      // stats.patients.activeToday is a number (count) from your backend.
      // Keep activePatients array intact (do not overwrite) — queue data should be fetched from a dedicated endpoint.
      set({
        totalPatientsInQueue: stats.todayStats?.totalPatients || 0,
        patientsWaiting: stats.todayStats?.waitingPatients || 0,
        averageConsultationTime: stats.todayStats?.averageConsultationTime || 0,
        averageWaitTime: stats.todayStats?.averageWaitTime || 0,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  completedPatients: [], // Patients ready for ophthalmologist (token changes to 'D')
  
  // Next-in-Line Management
  nextInLinePatients: [], // Top 3 patients in the queue display
  overrideHistory: [], // Track override reasons and timestamps
  
  // UI State
  selectedPatient: null,
  isModalOpen: false,
  alertPatients: [], // Patients requiring immediate attention
  
  // Queue Management
  queueFilters: {
    showAll: true,
    showHighPriority: false,
    showChildren: false,
    showSeniors: false,
    showEmergency: false,
    showLongWait: false,
    showReferral: false,
    showFollowUp: false,
    showRoutine: false,
    showPrePostOp: false
  },
  
  // Actions
  addPatient: (patientData) => {
    const priority = determinePriority(patientData);
    const token = generateToken(STAGE_PREFIXES.OPTOMETRIST, priority);
    
    const newPatient = {
      // Basic Information
      id: Date.now().toString(),
      token,
      name: patientData.name,
      age: patientData.age || Math.floor(Math.random() * 50) + 20,
      gender: patientData.gender || (Math.random() > 0.5 ? 'Male' : 'Female'),
      mrn: patientData.mrn || `MRN${Date.now()}`,
      abhaId: patientData.abhaId || null,
      
      // Priority and Visit Information
      priority,
      priorityDescription: PRIORITY_DESCRIPTIONS[priority],
      priorityColor: PRIORITY_COLORS[priority],
      visitType: patientData.visitType || 'routine',
      isEmergency: patientData.isEmergency || false,
      isFollowUp: patientData.isFollowUp || false,
      
      // Status and Timing
      status: 'waiting',
      currentStage: 'optometrist_queue',
      addedAt: new Date().toISOString(),
      waitStartTime: new Date().toISOString(),
      appointmentTime: patientData.appointmentTime || new Date().toLocaleTimeString(),
      
      // Medical History
      previousVisits: patientData.previousVisits || [],
      allergies: patientData.allergies || [],
      currentMedications: patientData.currentMedications || [],
      medicalHistory: patientData.medicalHistory || {},
      
      // Examination Data (empty initially)
      examData: {
        visualAcuity: { distance: {}, near: {}, aided: {}, unaided: {} },
        refraction: { sphere: {}, cylinder: {}, axis: {}, add: {}, pd: {} },
        tonometry: { iop: {} },
        additionalTests: {
          pupilReaction: '',
          colorVision: '',
          eyeAlignment: '',
          anteriorSegment: ''
        },
        clinicalNotes: '',
        preliminaryDiagnosis: '',
        additionalOrders: []
      },
      
      // Workflow decisions
      decisions: {
        nextStage: null,
        referrals: [],
        prescriptions: [],
        followUpRequired: false
      },
      
      // Audit trail
      auditTrail: [{
        action: 'patient_added_to_optometrist_queue',
        timestamp: new Date().toISOString(),
        userId: 'optometrist_user', // TODO: Get from auth context
        notes: `Patient added with priority ${priority} (${PRIORITY_DESCRIPTIONS[priority]})`
      }]
    };
    
    
    // Add alert for high priority patients
    if (priority <= 3) {
      set(state => ({
        alertPatients: [...state.alertPatients, {
          id: newPatient.id,
          message: `Emergency patient ${newPatient.name} added to queue`,
          type: 'emergency',
          timestamp: new Date().toISOString()
        }]
      }));
    }
    
    set(state => ({ 
      activePatients: [...state.activePatients, newPatient].sort((a, b) => {
        // Sort by priority first, then by arrival time
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(a.addedAt) - new Date(b.addedAt);
      })
    }));
  },

  startExam: (patientId) => {
    const state = get();
    const patient = state.activePatients.find(p => p.id === patientId);
    
    if (patient) {
      // Update patient status to 'examining'
      const updatedPatient = {
        ...patient,
        status: 'examining',
        examStartTime: new Date().toISOString(),
        auditTrail: [
          ...patient.auditTrail,
          {
            action: 'examination_started',
            timestamp: new Date().toISOString(),
            userId: 'optometrist_user',
            notes: 'Patient examination started'
          }
        ]
      };
      
      set(state => ({
        activePatients: state.activePatients.map(p => 
          p.id === patientId ? updatedPatient : p
        ),
        selectedPatient: updatedPatient,
        isModalOpen: true
      }));
      
    }
  },

  completeExam: (patientId, examData, nextStageDecision) => {
    const state = get();
    const patient = state.activePatients.find(p => p.id === patientId);
    
    if (patient) {
      // Update token stage based on decision
      let newToken = patient.token;
      let newStage = '';
      
      switch (nextStageDecision.action) {
        case 'refer_to_doctor':
          newToken = updateTokenStage(patient.token, 'OPTOMETRIST'); // Keep as O until doctor actually sees
          newStage = 'waiting_for_doctor';
          break;
        case 'send_for_diagnostics':
          newStage = 'diagnostics_pending';
          break;
        case 'surgery_counseling':
          newToken = updateTokenStage(patient.token, 'SURGERY');
          newStage = 'surgery_counseling';
          break;
        case 'complete_visit':
          newStage = 'visit_completed';
          break;
        default:
          newStage = 'completed';
      }
      
      const completedPatient = {
        ...patient,
        token: newToken,
        examData: { ...patient.examData, ...examData },
        decisions: { ...patient.decisions, ...nextStageDecision },
        status: 'completed',
        currentStage: newStage,
        completedAt: new Date().toISOString(),
        examDuration: Date.now() - new Date(patient.examStartTime || patient.addedAt).getTime(),
        auditTrail: [
          ...patient.auditTrail,
          {
            action: 'examination_completed',
            timestamp: new Date().toISOString(),
            userId: 'optometrist_user',
            notes: `Examination completed. Next stage: ${newStage}. Decision: ${nextStageDecision.action}`
          }
        ]
      };
      
      
      set(state => ({
        activePatients: state.activePatients.filter(p => p.id !== patientId),
        completedPatients: [...state.completedPatients, completedPatient].sort((a, b) => {
          // Sort completed patients by completion time (newest first)
          return new Date(b.completedAt) - new Date(a.completedAt);
        }),
        isModalOpen: false,
        selectedPatient: null
      }));
    }
  },

  // Save examination data without completing (draft mode)
  saveDraftExam: (patientId, examData) => {
    const state = get();
    set(state => ({
      activePatients: state.activePatients.map(p => 
        p.id === patientId 
          ? {
              ...p,
              examData: { ...p.examData, ...examData },
              lastSaved: new Date().toISOString(),
              auditTrail: [
                ...p.auditTrail,
                {
                  action: 'examination_data_saved',
                  timestamp: new Date().toISOString(),
                  userId: 'optometrist_user',
                  notes: 'Examination data saved as draft'
                }
              ]
            }
          : p
      )
    }));
  },

  closeModal: () => {
    set({ isModalOpen: false, selectedPatient: null });
  },

  // Reset examination data and clear selected patient (for after successful completion)
  resetExamData: () => {
    const state = get();
    if (state.selectedPatient) {
      const resetExamData = {
        visualAcuity: { distance: {}, near: {}, aided: {}, unaided: {} },
        refraction: { sphere: {}, cylinder: {}, axis: {}, add: {}, pd: {} },
        tonometry: { iop: {} },
        additionalTests: { pupilReaction: '', colorVision: '', eyeAlignment: '', anteriorSegment: '' },
        clinicalNotes: '',
        preliminaryDiagnosis: '',
        additionalOrders: []
      };
      
      set(state => ({
        selectedPatient: {
          ...state.selectedPatient,
          examData: resetExamData
        }
      }));
      
    }
  },

  clearSelectedPatient: () => {
    set({ selectedPatient: null, isModalOpen: false });
  },

  // Queue Management Functions
  setQueueFilter: (filterType, value) => {
    // Reset all filters first when setting a new one
    const resetFilters = {
      showAll: false,
      showHighPriority: false,
      showChildren: false,
      showSeniors: false,
      showEmergency: false,
      showLongWait: false,
      showReferral: false,
      showFollowUp: false,
      showRoutine: false,
      showPrePostOp: false
    };

    set(state => ({
      queueFilters: {
        ...resetFilters,
        [filterType]: true
      }
    }));
  },

  // Helper functions for category filtering
  isLongWaitPatient: (patient) => {
    const now = new Date();
    const waitStart = new Date(patient.waitStartTime);
    const waitTimeMinutes = Math.floor((now - waitStart) / (1000 * 60));
    return waitTimeMinutes > 45;
  },

  isReferralPatient: (patient) => {
    return patient.visitType.includes('referral') || patient.priority === 7;
  },

  isFollowUpPatient: (patient) => {
    return patient.visitType === 'follow_up' || patient.priority === 9;
  },

  isRoutinePatient: (patient) => {
    return patient.visitType === 'routine_checkup' || patient.priority === 11;
  },

  isEmergencyPatient: (patient) => {
    return patient.isEmergency || patient.priority <= 3;
  },

  isPrePostOpPatient: (patient) => {
    return patient.priority === 2 || patient.priority === 3 || 
           patient.visitType.includes('surgery') || 
           patient.visitType.includes('pre_op') || 
           patient.visitType.includes('post_op');
  },

  getFilteredActivePatients: () => {
    const state = get();
    const { queueFilters } = state;
    let filtered = [...state.activePatients];

    // If showAll is true or no specific filter is set, return all patients
    if (queueFilters.showAll) {
      return filtered;
    }

    // Apply specific filters
    if (queueFilters.showHighPriority) {
      filtered = filtered.filter(p => p.priority <= 3);
    } else if (queueFilters.showChildren) {
      filtered = filtered.filter(p => p.age < 18);
    } else if (queueFilters.showSeniors) {
      filtered = filtered.filter(p => p.age >= 65);
    } else if (queueFilters.showEmergency) {
      filtered = filtered.filter(p => p.status === 'examining');
    } else if (queueFilters.showLongWait) {
      filtered = filtered.filter(p => get().isLongWaitPatient(p));
    } else if (queueFilters.showReferral) {
      filtered = filtered.filter(p => get().isReferralPatient(p));
    } else if (queueFilters.showFollowUp) {
      filtered = filtered.filter(p => get().isFollowUpPatient(p));
    } else if (queueFilters.showRoutine) {
      filtered = filtered.filter(p => get().isRoutinePatient(p));
    } else if (queueFilters.showPrePostOp) {
      filtered = filtered.filter(p => get().isPrePostOpPatient(p));
    }

    return filtered;
  },

  // Search functionality
  searchPatients: (searchTerm) => {
    const state = get();
    if (!searchTerm.trim()) return state.activePatients;
    
    const term = searchTerm.toLowerCase();
    return state.activePatients.filter(patient => 
      patient.name.toLowerCase().includes(term) ||
      patient.token.toLowerCase().includes(term) ||
      patient.mrn.toLowerCase().includes(term)
    );
  },

  // Wait time management
  checkWaitTimes: () => {
    const state = get();
    const now = new Date();
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    const updatedPatients = state.activePatients.map(patient => {
      const waitTime = now - new Date(patient.waitStartTime);
      
      // Auto-escalate if waiting too long and not already high priority
      if (waitTime > thirtyMinutes && patient.priority > 6) {
        
        return {
          ...patient,
          priority: PRIORITY_LEVELS.EXTENDED_WAIT,
          priorityDescription: PRIORITY_DESCRIPTIONS[PRIORITY_LEVELS.EXTENDED_WAIT],
          priorityColor: PRIORITY_COLORS[PRIORITY_LEVELS.EXTENDED_WAIT],
          isEscalated: true,
          auditTrail: [
            ...patient.auditTrail,
            {
              action: 'priority_auto_escalated',
              timestamp: new Date().toISOString(),
              userId: 'system',
              notes: `Priority escalated to ${PRIORITY_LEVELS.EXTENDED_WAIT} due to ${Math.round(waitTime / (1000 * 60))} minutes wait time`
            }
          ]
        };
      }
      
      return patient;
    });
    
    set({ activePatients: updatedPatients.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(a.addedAt) - new Date(b.addedAt);
    })});
  },

  // Manual priority override
  updatePatientPriority: (patientId, newPriority, reason) => {
    const state = get();
    set(state => ({
      activePatients: state.activePatients.map(p => 
        p.id === patientId 
          ? {
              ...p,
              priority: newPriority,
              priorityDescription: PRIORITY_DESCRIPTIONS[newPriority],
              priorityColor: PRIORITY_COLORS[newPriority],
              auditTrail: [
                ...p.auditTrail,
                {
                  action: 'priority_manually_updated',
                  timestamp: new Date().toISOString(),
                  userId: 'optometrist_user',
                  notes: `Priority changed to ${newPriority} (${PRIORITY_DESCRIPTIONS[newPriority]}). Reason: ${reason}`
                }
              ]
            }
          : p
      ).sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return new Date(a.addedAt) - new Date(b.addedAt);
      })
    }));
  },

  patientStatistics: null,
  statisticsLoading: false,
  statisticsError: null,

  // Get patient statistics
  getPatientStatistics: async () => {
    set({ statisticsLoading: true, statisticsError: null });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/patients/statistics/overview`, {
        credentials: 'include'
      });


      if (!response.ok) {
        throw new Error('Failed to fetch patient statistics');
      }

      const result = await response.json();

      set({
        patientStatistics: result.data,
        statisticsLoading: false
      });

      return result.data;
    } catch (error) {
      set({
        statisticsError: error.message,
        statisticsLoading: false
      });
      throw error;
    }
  },
  
  // Clear alerts
  clearAlert: (alertId) => {
    set(state => ({
      alertPatients: state.alertPatients.filter(alert => alert.id !== alertId)
    }));
  },

  clearAllAlerts: () => {
    set({ alertPatients: [] });
  },

  // Queue reordering functions
  movePatientUp: (patientId) => {
    const state = get();
    const currentIndex = state.activePatients.findIndex(p => p.id === patientId);
    if (currentIndex > 0) {
      const updatedPatients = [...state.activePatients];
      [updatedPatients[currentIndex - 1], updatedPatients[currentIndex]] = 
      [updatedPatients[currentIndex], updatedPatients[currentIndex - 1]];
      
      const patient = updatedPatients[currentIndex - 1];
      const auditEntry = {
        action: 'queue_position_changed',
        timestamp: new Date().toISOString(),
        userId: 'optometrist_user',
        notes: `Patient moved up in queue from position ${currentIndex + 1} to ${currentIndex}`
      };
      
      updatedPatients[currentIndex - 1] = {
        ...patient,
        auditTrail: [...patient.auditTrail, auditEntry]
      };
      
      set({ activePatients: updatedPatients });
    }
  },

  movePatientDown: (patientId) => {
    const state = get();
    const currentIndex = state.activePatients.findIndex(p => p.id === patientId);
    if (currentIndex < state.activePatients.length - 1) {
      const updatedPatients = [...state.activePatients];
      [updatedPatients[currentIndex], updatedPatients[currentIndex + 1]] = 
      [updatedPatients[currentIndex + 1], updatedPatients[currentIndex]];
      
      const patient = updatedPatients[currentIndex + 1];
      const auditEntry = {
        action: 'queue_position_changed',
        timestamp: new Date().toISOString(),
        userId: 'optometrist_user',
        notes: `Patient moved down in queue from position ${currentIndex + 1} to ${currentIndex + 2}`
      };
      
      updatedPatients[currentIndex + 1] = {
        ...patient,
        auditTrail: [...patient.auditTrail, auditEntry]
      };
      
      set({ activePatients: updatedPatients });
    }
  },

  reorderQueue: (dragIndex, hoverIndex) => {
    const state = get();
    const updatedPatients = [...state.activePatients];
    const draggedPatient = updatedPatients[dragIndex];
    
    // Remove dragged patient and insert at new position
    updatedPatients.splice(dragIndex, 1);
    updatedPatients.splice(hoverIndex, 0, draggedPatient);
    
    const auditEntry = {
      action: 'queue_position_changed',
      timestamp: new Date().toISOString(),
      userId: 'optometrist_user',
      notes: `Patient moved from position ${dragIndex + 1} to position ${hoverIndex + 1} via drag-and-drop`
    };
    
    updatedPatients[hoverIndex] = {
      ...draggedPatient,
      auditTrail: [...draggedPatient.auditTrail, auditEntry]
    };
    
    set({ activePatients: updatedPatients });
  },

  // Next-in-Line Management Actions
  updateNextInLine: () => {
    const state = get();
    const availablePatients = state.activePatients.filter(p => p.status === 'waiting');
    const nextInLine = availablePatients.slice(0, 3);
    
    set({ nextInLinePatients: nextInLine });
    
  },

  callNextPatient: (patientId) => {
    const state = get();
    const patient = state.activePatients.find(p => p.id === patientId);
    
    if (patient) {
      // Remove from next-in-line and start exam
      const updatedNextInLine = state.nextInLinePatients.filter(p => p.id !== patientId);
      
      // Update patient with notification
      const notifiedPatient = {
        ...patient,
        status: 'called',
        calledAt: new Date().toISOString(),
        auditTrail: [
          ...patient.auditTrail,
          {
            action: 'patient_called_from_next_in_line',
            timestamp: new Date().toISOString(),
            userId: 'optometrist_user',
            notes: 'Patient called from Next-in-Line display for examination'
          }
        ]
      };
      
      set(state => ({
        activePatients: state.activePatients.map(p => p.id === patientId ? notifiedPatient : p),
        nextInLinePatients: updatedNextInLine
      }));
      
      // Auto-update next-in-line to fill the gap
      setTimeout(() => get().updateNextInLine(), 100);
      
    }
  },

  overrideNextInLine: (newOrder, reason) => {
    const state = get();
    const timestamp = new Date().toISOString();
    
    // Log override in history
    const overrideRecord = {
      id: `override_${Date.now()}`,
      timestamp,
      reason,
      previousOrder: state.nextInLinePatients.map(p => ({ id: p.id, name: p.name, token: p.token })),
      newOrder: newOrder.map(p => ({ id: p.id, name: p.name, token: p.token })),
      userId: 'optometrist_user'
    };
    
    // Add audit entries and override reason to affected patients (only those moved UP)
    const updatedPatients = state.activePatients.map(patient => {
      const oldIndex = state.nextInLinePatients.findIndex(p => p.id === patient.id);
      const newIndex = newOrder.findIndex(p => p.id === patient.id);
      
      // Only apply override reason to patients moved UP (to a better position - lower index)
      if (oldIndex !== -1 && newIndex !== -1 && newIndex < oldIndex) {
        return {
          ...patient,
          overrideReason: reason,
          auditTrail: [
            ...patient.auditTrail,
            {
              action: 'next_in_line_override',
              timestamp,
              userId: 'optometrist_user',
              notes: `Next-in-Line order manually overridden. Reason: ${reason}. Position changed from ${oldIndex + 1} to ${newIndex + 1}`
            }
          ]
        };
      }
      return patient;
    });

    // Apply override reason to the nextInLinePatients array (only those moved UP)
    const updatedNextInLine = newOrder.map(patient => {
      const oldIndex = state.nextInLinePatients.findIndex(p => p.id === patient.id);
      const newIndex = newOrder.findIndex(p => p.id === patient.id);
      
      // Only apply override reason to patients moved UP (to a better position - lower index)
      if (oldIndex !== -1 && newIndex !== -1 && newIndex < oldIndex) {
        return {
          ...patient,
          overrideReason: reason
        };
      }
      return patient;
    });
    
    set(state => ({
      nextInLinePatients: updatedNextInLine,
      overrideHistory: [...state.overrideHistory, overrideRecord],
      activePatients: updatedPatients
    }));
    
  },

  // Get patients not in next-in-line (for reordering)
  getReorderablePatients: () => {
    const state = get();
    const nextInLineIds = state.nextInLinePatients.map(p => p.id);
    return state.activePatients.filter(p => 
      p.status === 'waiting' && !nextInLineIds.includes(p.id)
    );
  },

  // Initialize next-in-line on store creation
  initializeNextInLine: () => {
    get().updateNextInLine();
  },

  // Debug function
  getDebugState: () => {
    const state = get();
    return state;
  }
}));

// Initialize next-in-line when store is created
useOptometristStore.getState().updateNextInLine();

export default useOptometristStore;