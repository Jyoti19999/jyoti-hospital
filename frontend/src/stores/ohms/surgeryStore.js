import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useSurgeryStore = create(
  persist(
    (set, get) => ({
      // State
      surgeryQueue: [],
      scheduledSurgeries: [],
      completedSurgeries: [],
      postOpPatients: [],
      surgerySettings: {
        defaultPreOpTime: 60, // minutes
        defaultSurgeryDuration: 90, // minutes
        defaultPostOpTime: 120, // minutes
        maxDailySurgeries: 10
      },
      
      // Surgery Scheduling Actions
      scheduleSurgery: (patientData, surgeryDetails) => {
        const surgeryRecord = {
          id: Date.now().toString(),
          patientId: patientData.patientId,
          patientInfo: patientData.patientInfo,
          consultationId: patientData.consultationId,
          surgeryType: surgeryDetails.surgeryType,
          procedure: surgeryDetails.procedure,
          urgency: surgeryDetails.urgency || 'elective', // 'emergency', 'urgent', 'elective'
          scheduledDate: surgeryDetails.scheduledDate,
          scheduledTime: surgeryDetails.scheduledTime,
          estimatedDuration: surgeryDetails.estimatedDuration || get().surgerySettings.defaultSurgeryDuration,
          surgeon: surgeryDetails.surgeon,
          assistantSurgeon: surgeryDetails.assistantSurgeon || null,
          anesthesiaType: surgeryDetails.anesthesiaType || 'local',
          specialInstructions: surgeryDetails.specialInstructions || '',
          preOpRequirements: surgeryDetails.preOpRequirements || [],
          status: 'scheduled',
          createdAt: Date.now(),
          lastUpdated: Date.now()
        };
        
        const state = get();
        const updatedQueue = [...state.surgeryQueue, surgeryRecord];
        const updatedScheduled = [...state.scheduledSurgeries, surgeryRecord];
        
        set({ 
          surgeryQueue: updatedQueue,
          scheduledSurgeries: updatedScheduled
        });
        
        return surgeryRecord;
      },
      
      updateSurgeryStatus: (surgeryId, status, additionalData = {}) => {
        const state = get();
        
        // Update in all relevant arrays
        const updateRecord = (record) => 
          record.id === surgeryId 
            ? { ...record, status, ...additionalData, lastUpdated: Date.now() }
            : record;
        
        const updatedQueue = state.surgeryQueue.map(updateRecord);
        const updatedScheduled = state.scheduledSurgeries.map(updateRecord);
        const updatedCompleted = state.completedSurgeries.map(updateRecord);
        
        set({ 
          surgeryQueue: updatedQueue,
          scheduledSurgeries: updatedScheduled,
          completedSurgeries: updatedCompleted
        });
      },
      
      startPreOp: (surgeryId) => {
        const state = get();
        const surgery = state.surgeryQueue.find(s => s.id === surgeryId);
        
        if (!surgery) return { success: false, error: 'Surgery not found' };
        
        const preOpRecord = {
          ...surgery,
          status: 'pre-op',
          preOpStartTime: Date.now(),
          preOpChecklist: [
            { item: 'Patient identity verification', completed: false },
            { item: 'Consent form signed', completed: false },
            { item: 'Pre-surgical examination', completed: false },
            { item: 'Anesthesia consultation', completed: false },
            { item: 'Surgical site marking', completed: false },
            { item: 'Equipment preparation', completed: false }
          ]
        };
        
        get().updateSurgeryStatus(surgeryId, 'pre-op', {
          preOpStartTime: Date.now(),
          preOpChecklist: preOpRecord.preOpChecklist
        });
        
        return { success: true, record: preOpRecord };
      },
      
      updatePreOpChecklist: (surgeryId, checklistItem, completed) => {
        const state = get();
        
        const updateChecklist = (record) => {
          if (record.id !== surgeryId) return record;
          
          const updatedChecklist = record.preOpChecklist?.map(item => 
            item.item === checklistItem 
              ? { ...item, completed, completedAt: completed ? Date.now() : null }
              : item
          ) || [];
          
          const allCompleted = updatedChecklist.every(item => item.completed);
          
          return {
            ...record,
            preOpChecklist: updatedChecklist,
            preOpCompleted: allCompleted,
            readyForSurgery: allCompleted,
            lastUpdated: Date.now()
          };
        };
        
        const updatedQueue = state.surgeryQueue.map(updateChecklist);
        const updatedScheduled = state.scheduledSurgeries.map(updateChecklist);
        
        set({ 
          surgeryQueue: updatedQueue,
          scheduledSurgeries: updatedScheduled
        });
      },
      
      startSurgery: (surgeryId) => {
        const state = get();
        const surgery = state.surgeryQueue.find(s => s.id === surgeryId);
        
        if (!surgery || !surgery.readyForSurgery) {
          return { success: false, error: 'Surgery not ready or not found' };
        }
        
        get().updateSurgeryStatus(surgeryId, 'in-progress', {
          surgeryStartTime: Date.now(),
          actualStartTime: Date.now()
        });
        
        return { success: true };
      },
      
      completeSurgery: (surgeryId, surgeryReport) => {
        const state = get();
        const surgery = state.surgeryQueue.find(s => s.id === surgeryId);
        
        if (!surgery) return { success: false, error: 'Surgery not found' };
        
        const completedRecord = {
          ...surgery,
          status: 'completed',
          surgeryEndTime: Date.now(),
          actualDuration: Date.now() - (surgery.surgeryStartTime || Date.now()),
          surgeryReport: {
            procedure: surgeryReport.procedure,
            findings: surgeryReport.findings,
            complications: surgeryReport.complications || 'None',
            implants: surgeryReport.implants || [],
            postOpInstructions: surgeryReport.postOpInstructions,
            followUpSchedule: surgeryReport.followUpSchedule,
            surgeon: surgery.surgeon,
            assistantSurgeon: surgery.assistantSurgeon,
            anesthesiaUsed: surgeryReport.anesthesiaUsed
          }
        };
        
        // Move to completed surgeries
        const updatedQueue = state.surgeryQueue.filter(s => s.id !== surgeryId);
        const updatedCompleted = [...state.completedSurgeries, completedRecord];
        
        set({ 
          surgeryQueue: updatedQueue,
          completedSurgeries: updatedCompleted
        });
        
        // Add to post-op monitoring
        get().addToPostOp(completedRecord);
        
        return { success: true, record: completedRecord };
      },
      
      addToPostOp: (surgeryRecord) => {
        const postOpRecord = {
          ...surgeryRecord,
          postOpStartTime: Date.now(),
          postOpStatus: 'monitoring',
          vitalSigns: [],
          complications: [],
          dischargeChecklist: [
            { item: 'Vital signs stable', completed: false },
            { item: 'Pain management adequate', completed: false },
            { item: 'No immediate complications', completed: false },
            { item: 'Patient alert and oriented', completed: false },
            { item: 'Discharge instructions given', completed: false },
            { item: 'Follow-up appointment scheduled', completed: false }
          ],
          estimatedDischargeTime: Date.now() + (get().surgerySettings.defaultPostOpTime * 60 * 1000)
        };
        
        const state = get();
        const updatedPostOp = [...state.postOpPatients, postOpRecord];
        
        set({ postOpPatients: updatedPostOp });
        
        return postOpRecord;
      },
      
      updateVitalSigns: (patientId, vitalSigns) => {
        const state = get();
        const updatedPostOp = state.postOpPatients.map(patient => 
          patient.patientId === patientId 
            ? { 
                ...patient, 
                vitalSigns: [...(patient.vitalSigns || []), {
                  timestamp: Date.now(),
                  bloodPressure: vitalSigns.bloodPressure,
                  heartRate: vitalSigns.heartRate,
                  temperature: vitalSigns.temperature,
                  oxygenSaturation: vitalSigns.oxygenSaturation,
                  painLevel: vitalSigns.painLevel,
                  recordedBy: vitalSigns.recordedBy
                }],
                lastUpdated: Date.now()
              }
            : patient
        );
        
        set({ postOpPatients: updatedPostOp });
      },
      
      updateDischargeChecklist: (patientId, checklistItem, completed) => {
        const state = get();
        const updatedPostOp = state.postOpPatients.map(patient => {
          if (patient.patientId !== patientId) return patient;
          
          const updatedChecklist = patient.dischargeChecklist?.map(item => 
            item.item === checklistItem 
              ? { ...item, completed, completedAt: completed ? Date.now() : null }
              : item
          ) || [];
          
          const allCompleted = updatedChecklist.every(item => item.completed);
          
          return {
            ...patient,
            dischargeChecklist: updatedChecklist,
            readyForDischarge: allCompleted,
            lastUpdated: Date.now()
          };
        });
        
        set({ postOpPatients: updatedPostOp });
      },
      
      dischargePatient: (patientId, dischargeData) => {
        const state = get();
        const patient = state.postOpPatients.find(p => p.patientId === patientId);
        
        if (!patient || !patient.readyForDischarge) {
          return { success: false, error: 'Patient not ready for discharge or not found' };
        }
        
        const dischargeRecord = {
          ...patient,
          postOpStatus: 'discharged',
          dischargeTime: Date.now(),
          dischargeInstructions: dischargeData.instructions,
          medications: dischargeData.medications || [],
          followUpAppointments: dischargeData.followUpAppointments || [],
          emergencyContact: dischargeData.emergencyContact,
          dischargedBy: dischargeData.dischargedBy
        };
        
        // Remove from post-op monitoring
        const updatedPostOp = state.postOpPatients.filter(p => p.patientId !== patientId);
        
        // Update completed surgeries with discharge info
        const updatedCompleted = state.completedSurgeries.map(surgery => 
          surgery.patientId === patientId 
            ? { ...surgery, ...dischargeRecord }
            : surgery
        );
        
        set({ 
          postOpPatients: updatedPostOp,
          completedSurgeries: updatedCompleted
        });
        
        return { success: true, record: dischargeRecord };
      },
      
      // Query functions
      getTodaysSurgeries: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        
        return state.scheduledSurgeries.filter(surgery => 
          surgery.scheduledDate === today
        ).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
      },
      
      getSurgeryStatistics: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        
        const todaysSurgeries = get().getTodaysSurgeries();
        const completedToday = state.completedSurgeries.filter(surgery => {
          const completedDate = new Date(surgery.surgeryEndTime).toISOString().split('T')[0];
          return completedDate === today;
        });
        
        return {
          scheduled: todaysSurgeries.length,
          completed: completedToday.length,
          inProgress: state.surgeryQueue.filter(s => s.status === 'in-progress').length,
          preOp: state.surgeryQueue.filter(s => s.status === 'pre-op').length,
          postOp: state.postOpPatients.length,
          readyForDischarge: state.postOpPatients.filter(p => p.readyForDischarge).length
        };
      },
      
      // Debug function
      getDebugState: () => {
        const state = get();
        return state;
      },
      
      clearAllData: () => {
        set({
          surgeryQueue: [],
          scheduledSurgeries: [],
          completedSurgeries: [],
          postOpPatients: []
        });
      }
    }),
    {
      name: 'ohms-surgery-store',
      partialize: (state) => ({
        scheduledSurgeries: state.scheduledSurgeries,
        completedSurgeries: state.completedSurgeries,
        surgerySettings: state.surgerySettings
      })
    }
  )
);

export default useSurgeryStore;