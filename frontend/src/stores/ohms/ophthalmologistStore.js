import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useOphthalmologistStore = create(
  persist(
    (set, get) => ({
      // State
      activeConsultations: [],
      underObservation: [],
      completedConsultations: [],
      selectedPatient: null,
      consultationInProgress: null,
      isConsultationModalOpen: false,
      observationSettings: {
        defaultObservationTime: 30, // minutes
        reminderInterval: 15, // minutes
        maxObservationTime: 120 // minutes
      },
      
      // Consultation Actions
      startConsultation: (patient) => {
        const consultationRecord = {
          id: Date.now().toString(),
          patientId: patient.patientId,
          patientInfo: patient.patientInfo,
          appointmentDetails: patient.appointmentDetails,
          startTime: Date.now(),
          status: 'in-progress',
          consultationNotes: [],
          testOrders: [],
          diagnoses: [],
          prescriptions: [],
          iterationCount: 1,
          lastActivity: Date.now()
        };
        
        const state = get();
        const updatedConsultations = [...state.activeConsultations, consultationRecord];
        
        set({ 
          activeConsultations: updatedConsultations,
          selectedPatient: patient,
          consultationInProgress: consultationRecord,
          isConsultationModalOpen: true
        });
        
        return consultationRecord;
      },
      
      updateConsultationNotes: (consultationId, notes) => {
        const state = get();
        const updatedConsultations = state.activeConsultations.map(consultation => 
          consultation.id === consultationId 
            ? { 
                ...consultation, 
                consultationNotes: [...consultation.consultationNotes, {
                  id: Date.now().toString(),
                  content: notes,
                  timestamp: Date.now(),
                  type: 'general'
                }],
                lastActivity: Date.now()
              }
            : consultation
        );
        
        set({ activeConsultations: updatedConsultations });
        
        // Update consultation in progress if it's the active one
        const updatedInProgress = updatedConsultations.find(c => c.id === consultationId);
        if (state.consultationInProgress?.id === consultationId) {
          set({ consultationInProgress: updatedInProgress });
        }
      },
      
      addDiagnosis: (consultationId, diagnosis) => {
        const state = get();
        const updatedConsultations = state.activeConsultations.map(consultation => 
          consultation.id === consultationId 
            ? { 
                ...consultation, 
                diagnoses: [...consultation.diagnoses, {
                  id: Date.now().toString(),
                  code: diagnosis.icd11Code,
                  description: diagnosis.description,
                  severity: diagnosis.severity || 'moderate',
                  timestamp: Date.now()
                }],
                lastActivity: Date.now()
              }
            : consultation
        );
        
        set({ activeConsultations: updatedConsultations });
        
        const updatedInProgress = updatedConsultations.find(c => c.id === consultationId);
        if (state.consultationInProgress?.id === consultationId) {
          set({ consultationInProgress: updatedInProgress });
        }
      },
      
      orderTest: (consultationId, testOrder) => {
        const state = get();
        const updatedConsultations = state.activeConsultations.map(consultation => 
          consultation.id === consultationId 
            ? { 
                ...consultation, 
                testOrders: [...consultation.testOrders, {
                  id: Date.now().toString(),
                  testType: testOrder.testType,
                  instructions: testOrder.instructions,
                  urgency: testOrder.urgency || 'routine',
                  orderedAt: Date.now(),
                  status: 'ordered'
                }],
                lastActivity: Date.now()
              }
            : consultation
        );
        
        set({ activeConsultations: updatedConsultations });
        
        const updatedInProgress = updatedConsultations.find(c => c.id === consultationId);
        if (state.consultationInProgress?.id === consultationId) {
          set({ consultationInProgress: updatedInProgress });
        }
      },
      
      sendToObservation: (consultationId, observationType, duration = null) => {
        const state = get();
        const consultation = state.activeConsultations.find(c => c.id === consultationId);
        
        if (!consultation) return;
        
        const observationRecord = {
          ...consultation,
          observationType, // 'dilation', 'test-results', 'medication-effect', 'rest'
          observationStart: Date.now(),
          observationDuration: duration || state.observationSettings.defaultObservationTime,
          status: 'under-observation',
          nextReminderTime: Date.now() + (state.observationSettings.reminderInterval * 60 * 1000),
          observationNotes: []
        };
        
        const updatedConsultations = state.activeConsultations.filter(c => c.id !== consultationId);
        const updatedObservations = [...state.underObservation, observationRecord];
        
        set({ 
          activeConsultations: updatedConsultations,
          underObservation: updatedObservations
        });
        
        // Set reminder
        setTimeout(() => {
          get().triggerObservationReminder(observationRecord.id);
        }, state.observationSettings.reminderInterval * 60 * 1000);
        
        return observationRecord;
      },
      
      callBackFromObservation: (observationId) => {
        const state = get();
        const observation = state.underObservation.find(o => o.id === observationId);
        
        if (!observation) return;
        
        const consultationRecord = {
          ...observation,
          status: 'in-progress',
          iterationCount: observation.iterationCount + 1,
          returnedFromObservation: Date.now(),
          lastActivity: Date.now()
        };
        
        const updatedObservations = state.underObservation.filter(o => o.id !== observationId);
        const updatedConsultations = [...state.activeConsultations, consultationRecord];
        
        set({ 
          underObservation: updatedObservations,
          activeConsultations: updatedConsultations,
          selectedPatient: observation.patientInfo,
          consultationInProgress: consultationRecord,
          isConsultationModalOpen: true
        });
        
        return consultationRecord;
      },
      
      completeConsultation: (consultationId, outcome) => {
        const state = get();
        const consultation = state.activeConsultations.find(c => c.id === consultationId);
        
        if (!consultation) return;
        
        const completedRecord = {
          ...consultation,
          status: 'completed',
          endTime: Date.now(),
          outcome: outcome.type, // 'prescription', 'surgery', 'referral', 'follow-up'
          outcomeDetails: outcome.details,
          totalConsultationTime: Date.now() - consultation.startTime,
          completedBy: outcome.doctorId || 'current-doctor'
        };
        
        const updatedConsultations = state.activeConsultations.filter(c => c.id !== consultationId);
        const updatedCompleted = [...state.completedConsultations, completedRecord];
        
        set({ 
          activeConsultations: updatedConsultations,
          completedConsultations: updatedCompleted,
          consultationInProgress: null,
          selectedPatient: null,
          isConsultationModalOpen: false
        });
        
        return completedRecord;
      },
      
      triggerObservationReminder: (observationId) => {
        const state = get();
        const observation = state.underObservation.find(o => o.id === observationId);
        
        if (!observation) return;
        
        // Update next reminder time
        const updatedObservations = state.underObservation.map(o => 
          o.id === observationId 
            ? { 
                ...o, 
                nextReminderTime: Date.now() + (state.observationSettings.reminderInterval * 60 * 1000),
                reminderCount: (o.reminderCount || 0) + 1
              }
            : o
        );
        
        set({ underObservation: updatedObservations });
        
        // Could trigger notification here
        
        // Schedule next reminder if observation is still ongoing
        if (Date.now() - observation.observationStart < observation.observationDuration * 60 * 1000) {
          setTimeout(() => {
            get().triggerObservationReminder(observationId);
          }, state.observationSettings.reminderInterval * 60 * 1000);
        }
      },
      
      addObservationNote: (observationId, note) => {
        const state = get();
        const updatedObservations = state.underObservation.map(observation => 
          observation.id === observationId 
            ? { 
                ...observation, 
                observationNotes: [...(observation.observationNotes || []), {
                  id: Date.now().toString(),
                  content: note,
                  timestamp: Date.now()
                }]
              }
            : observation
        );
        
        set({ underObservation: updatedObservations });
      },
      
      // Modal and UI Actions
      openConsultationModal: (patient) => {
        set({ 
          selectedPatient: patient,
          isConsultationModalOpen: true
        });
      },
      
      closeConsultationModal: () => {
        set({ 
          isConsultationModalOpen: false,
          selectedPatient: null
        });
      },
      
      // Statistics and Analytics
      getConsultationStatistics: () => {
        const state = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaysCompleted = state.completedConsultations.filter(c => {
          const completedDate = new Date(c.endTime);
          completedDate.setHours(0, 0, 0, 0);
          return completedDate.getTime() === today.getTime();
        });
        
        return {
          active: state.activeConsultations.length,
          underObservation: state.underObservation.length,
          completedToday: todaysCompleted.length,
          averageConsultationTime: todaysCompleted.length > 0 ? 
            todaysCompleted.reduce((sum, c) => sum + c.totalConsultationTime, 0) / todaysCompleted.length / (1000 * 60) : 0,
          outcomeDistribution: todaysCompleted.reduce((acc, c) => {
            acc[c.outcome] = (acc[c.outcome] || 0) + 1;
            return acc;
          }, {})
        };
      },
      
      getDueReminders: () => {
        const state = get();
        const now = Date.now();
        
        return state.underObservation.filter(observation => 
          observation.nextReminderTime <= now
        );
      },
      
      // Debug function
      getDebugState: () => {
        const state = get();
        return state;
      },
      
      clearAllData: () => {
        set({
          activeConsultations: [],
          underObservation: [],
          completedConsultations: [],
          selectedPatient: null,
          consultationInProgress: null,
          isConsultationModalOpen: false
        });
      }
    }),
    {
      name: 'ohms-ophthalmologist-store',
      partialize: (state) => ({
        completedConsultations: state.completedConsultations,
        observationSettings: state.observationSettings
      })
    }
  )
);

export default useOphthalmologistStore;