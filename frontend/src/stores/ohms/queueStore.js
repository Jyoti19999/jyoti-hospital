import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Priority levels and logic from token service
const PRIORITY_LEVELS = {
  EMERGENCY: 1,
  POST_OPERATIVE: 2,
  PRE_OPERATIVE: 3,
  CHILD_UNDER_5: 4,
  ELDERLY_60_PLUS: 5,
  LONG_WAITING: 6,
  REFERRAL: 7,
  REVIEW: 8,
  FOLLOW_UP: 9,
  NEW: 10,
  ROUTINE: 11
};

const PRIORITY_DESCRIPTIONS = {
  1: 'Emergency case - immediate attention required',
  2: 'Post-operative follow-up',
  3: 'Pre-operative/OT evaluation', 
  4: 'Child under 5 years',
  5: 'Senior citizen (60+)',
  6: 'Long-waiting patient (auto-detected)',
  7: 'Referral case',
  8: 'Review appointment',
  9: 'Follow-up consultation',
  10: 'New patient',
  11: 'Routine check-up'
};

const useQueueStore = create(
  persist(
    (set, get) => ({
      // State
      optometristQueue: [],
      ophthalmologistQueue: [],
      nextInLineOptometrist: [],
      nextInLineOphthalmologist: [],
      queueSettings: {
        maxNextInLine: 3,
        autoRefreshInterval: 30000, // 30 seconds
        priorityOverrideReasons: {}
      },
      lastQueueUpdate: Date.now(),
      
      // Queue Management Actions
      addToOptometristQueue: (patient) => {
        const state = get();
        const queuePosition = state.optometristQueue.length + 1;
        const priority = calculatePatientPriority(patient);
        
        const queueEntry = {
          id: patient.id || Date.now().toString(),
          patientId: patient.patientId,
          token: patient.token,
          priority,
          priorityDescription: PRIORITY_DESCRIPTIONS[priority],
          queuePosition,
          addedTime: Date.now(),
          estimatedWaitTime: calculateWaitTime(queuePosition, priority),
          status: 'waiting',
          patientInfo: patient.patientInfo || {},
          appointmentDetails: patient.appointmentDetails || {}
        };
        
        const updatedQueue = [...state.optometristQueue, queueEntry].sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return a.addedTime - b.addedTime;
        });
        
        set({ 
          optometristQueue: updatedQueue,
          lastQueueUpdate: Date.now()
        });
        
        get().updateNextInLine('optometrist');
        return queueEntry;
      },
      
      addToOphthalmologistQueue: (patient) => {
        const state = get();
        const queuePosition = state.ophthalmologistQueue.length + 1;
        const priority = calculatePatientPriority(patient);
        
        const queueEntry = {
          id: patient.id || Date.now().toString(),
          patientId: patient.patientId,
          token: patient.token,
          priority,
          priorityDescription: PRIORITY_DESCRIPTIONS[priority],
          queuePosition,
          addedTime: Date.now(),
          estimatedWaitTime: calculateWaitTime(queuePosition, priority),
          status: 'waiting',
          patientInfo: patient.patientInfo || {},
          appointmentDetails: patient.appointmentDetails || {},
          fromOptometrist: patient.fromOptometrist || false,
          optometristCompletedAt: patient.optometristCompletedAt || null
        };
        
        const updatedQueue = [...state.ophthalmologistQueue, queueEntry].sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return a.addedTime - b.addedTime;
        });
        
        set({ 
          ophthalmologistQueue: updatedQueue,
          lastQueueUpdate: Date.now()
        });
        
        get().updateNextInLine('ophthalmologist');
        return queueEntry;
      },
      
      removeFromQueue: (patientId, queueType) => {
        const state = get();
        const queueKey = queueType === 'optometrist' ? 'optometristQueue' : 'ophthalmologistQueue';
        
        const updatedQueue = state[queueKey].filter(entry => entry.patientId !== patientId);
        
        set({ 
          [queueKey]: updatedQueue,
          lastQueueUpdate: Date.now()
        });
        
        get().updateNextInLine(queueType);
      },
      
      updatePatientStatus: (patientId, queueType, status, additionalData = {}) => {
        const state = get();
        const queueKey = queueType === 'optometrist' ? 'optometristQueue' : 'ophthalmologistQueue';
        
        const updatedQueue = state[queueKey].map(entry => 
          entry.patientId === patientId 
            ? { ...entry, status, ...additionalData, lastUpdated: Date.now() }
            : entry
        );
        
        set({ 
          [queueKey]: updatedQueue,
          lastQueueUpdate: Date.now()
        });
        
        get().updateNextInLine(queueType);
      },
      
      updateNextInLine: (queueType) => {
        const state = get();
        const queueKey = queueType === 'optometrist' ? 'optometristQueue' : 'ophthalmologistQueue';
        const nextInLineKey = queueType === 'optometrist' ? 'nextInLineOptometrist' : 'nextInLineOphthalmologist';
        
        const waitingPatients = state[queueKey]
          .filter(entry => entry.status === 'waiting')
          .slice(0, state.queueSettings.maxNextInLine);
        
        set({ [nextInLineKey]: waitingPatients });
      },
      
      manualPriorityOverride: (patientId, queueType, newPriority, reason, staffId) => {
        const state = get();
        const queueKey = queueType === 'optometrist' ? 'optometristQueue' : 'ophthalmologistQueue';
        
        const updatedQueue = state[queueKey].map(entry => 
          entry.patientId === patientId 
            ? { 
                ...entry, 
                priority: newPriority,
                priorityDescription: PRIORITY_DESCRIPTIONS[newPriority],
                manualOverride: {
                  reason,
                  staffId,
                  timestamp: Date.now(),
                  originalPriority: entry.priority
                }
              }
            : entry
        ).sort((a, b) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          return a.addedTime - b.addedTime;
        });
        
        set({ 
          [queueKey]: updatedQueue,
          lastQueueUpdate: Date.now()
        });
        
        get().updateNextInLine(queueType);
      },
      
      getQueuePosition: (patientId, queueType) => {
        const state = get();
        const queueKey = queueType === 'optometrist' ? 'optometristQueue' : 'ophthalmologistQueue';
        const queue = state[queueKey].filter(entry => entry.status === 'waiting');
        
        const position = queue.findIndex(entry => entry.patientId === patientId);
        return position >= 0 ? position + 1 : -1;
      },
      
      getEstimatedWaitTime: (patientId, queueType) => {
        const state = get();
        const position = get().getQueuePosition(patientId, queueType);
        
        if (position <= 0) return 0;
        
        const averageConsultationTime = queueType === 'optometrist' ? 15 : 25; // minutes
        return position * averageConsultationTime;
      },
      
      getQueueStatistics: (queueType) => {
        const state = get();
        const queueKey = queueType === 'optometrist' ? 'optometristQueue' : 'ophthalmologistQueue';
        const queue = state[queueKey];
        
        return {
          total: queue.length,
          waiting: queue.filter(e => e.status === 'waiting').length,
          inProgress: queue.filter(e => e.status === 'in-progress').length,
          averageWaitTime: queue.length > 0 ? 
            queue.reduce((sum, entry) => sum + entry.estimatedWaitTime, 0) / queue.length : 0,
          oldestWaitTime: queue.length > 0 ? 
            Math.max(...queue.map(entry => Date.now() - entry.addedTime)) / (1000 * 60) : 0
        };
      },
      
      // Debug function
      getDebugState: () => {
        const state = get();
        return state;
      },
      
      clearAllQueues: () => {
        set({
          optometristQueue: [],
          ophthalmologistQueue: [],
          nextInLineOptometrist: [],
          nextInLineOphthalmologist: [],
          lastQueueUpdate: Date.now()
        });
      }
    }),
    {
      name: 'ohms-queue-store',
      partialize: (state) => ({
        optometristQueue: state.optometristQueue,
        ophthalmologistQueue: state.ophthalmologistQueue,
        queueSettings: state.queueSettings
      })
    }
  )
);

// Helper functions
function calculatePatientPriority(patient) {
  // Emergency check
  if (patient.isEmergency || patient.priorityLevel === 'emergency') {
    return PRIORITY_LEVELS.EMERGENCY;
  }
  
  // Post-operative
  if (patient.visitType === 'post-operative' || patient.isPostOp) {
    return PRIORITY_LEVELS.POST_OPERATIVE;
  }
  
  // Pre-operative
  if (patient.visitType === 'pre-operative' || patient.isPreOp) {
    return PRIORITY_LEVELS.PRE_OPERATIVE;
  }
  
  // Age-based priority
  const age = patient.patientInfo?.age || patient.age;
  if (age && age < 5) {
    return PRIORITY_LEVELS.CHILD_UNDER_5;
  }
  if (age && age >= 60) {
    return PRIORITY_LEVELS.ELDERLY_60_PLUS;
  }
  
  // Referral
  if (patient.hasReferral || patient.visitType === 'referral') {
    return PRIORITY_LEVELS.REFERRAL;
  }
  
  // Review
  if (patient.visitType === 'review') {
    return PRIORITY_LEVELS.REVIEW;
  }
  
  // Follow-up
  if (patient.visitType === 'follow-up') {
    return PRIORITY_LEVELS.FOLLOW_UP;
  }
  
  // New patient
  if (patient.visitType === 'new' || patient.isNewPatient) {
    return PRIORITY_LEVELS.NEW;
  }
  
  // Default to routine
  return PRIORITY_LEVELS.ROUTINE;
}

function calculateWaitTime(queuePosition, priority) {
  const baseWaitTime = 15; // minutes per patient
  const priorityMultiplier = priority <= 3 ? 0.5 : priority <= 6 ? 0.75 : 1;
  
  return Math.ceil(queuePosition * baseWaitTime * priorityMultiplier);
}

export default useQueueStore;