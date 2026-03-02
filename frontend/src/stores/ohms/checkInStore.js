import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCheckInStore = create(
  persist(
    (set, get) => ({
      // State
      checkedInPatients: [],
      kioskSettings: {
        autoTimeout: 30000, // 30 seconds
        enableBarcodeScanner: true,
        enableManualEntry: true,
        department: 'optometry'
      },
      scannerStatus: 'ready', // ready, scanning, processing, error
      lastScanResult: null,
      staffCheckIns: [],
      
      // Check-in Actions
      checkInWithQR: async (qrCode, department = 'optometry') => {
        set({ scannerStatus: 'processing' });
        
        try {
          // Parse QR code data
          const patientData = parseQRCode(qrCode);
          
          if (!patientData) {
            throw new Error('Invalid QR code format');
          }
          
          const checkInRecord = {
            id: Date.now().toString(),
            patientId: patientData.patientId,
            token: patientData.token,
            checkInTime: Date.now(),
            department,
            method: 'qr-scan',
            location: 'kiosk',
            patientInfo: patientData.patientInfo,
            appointmentDetails: patientData.appointmentDetails,
            status: 'checked-in'
          };
          
          const state = get();
          const updatedCheckedIn = [...state.checkedInPatients, checkInRecord];
          
          set({ 
            checkedInPatients: updatedCheckedIn,
            scannerStatus: 'ready',
            lastScanResult: {
              success: true,
              patient: patientData,
              timestamp: Date.now()
            }
          });
          
          return { success: true, checkInRecord };
        } catch (error) {
          set({ 
            scannerStatus: 'error',
            lastScanResult: {
              success: false,
              error: error.message,
              timestamp: Date.now()
            }
          });
          
          setTimeout(() => {
            set({ scannerStatus: 'ready' });
          }, 3000);
          
          return { success: false, error: error.message };
        }
      },
      
      checkInWithToken: async (token, department = 'optometry') => {
        try {
          // Look up patient by token
          const patientData = await lookupPatientByToken(token);
          
          if (!patientData) {
            throw new Error('Token not found or invalid');
          }
          
          const checkInRecord = {
            id: Date.now().toString(),
            patientId: patientData.patientId,
            token,
            checkInTime: Date.now(),
            department,
            method: 'manual-token',
            location: 'kiosk',
            patientInfo: patientData.patientInfo,
            appointmentDetails: patientData.appointmentDetails,
            status: 'checked-in'
          };
          
          const state = get();
          const updatedCheckedIn = [...state.checkedInPatients, checkInRecord];
          
          set({ 
            checkedInPatients: updatedCheckedIn,
            lastScanResult: {
              success: true,
              patient: patientData,
              timestamp: Date.now()
            }
          });
          
          return { success: true, checkInRecord };
        } catch (error) {
          set({ 
            lastScanResult: {
              success: false,
              error: error.message,
              timestamp: Date.now()
            }
          });
          
          return { success: false, error: error.message };
        }
      },
      
      staffCheckIn: (patientData, staffId, department = 'optometry') => {
        const checkInRecord = {
          id: Date.now().toString(),
          patientId: patientData.patientId,
          token: patientData.token,
          checkInTime: Date.now(),
          department,
          method: 'staff-manual',
          location: 'front-desk',
          staffId,
          patientInfo: patientData.patientInfo,
          appointmentDetails: patientData.appointmentDetails,
          status: 'checked-in'
        };
        
        const state = get();
        const updatedCheckedIn = [...state.checkedInPatients, checkInRecord];
        const updatedStaffCheckIns = [...state.staffCheckIns, {
          ...checkInRecord,
          staffAction: 'manual-check-in'
        }];
        
        set({ 
          checkedInPatients: updatedCheckedIn,
          staffCheckIns: updatedStaffCheckIns
        });
        
        return checkInRecord;
      },
      
      transferToOphthalmology: (patientId, staffId = null) => {
        const state = get();
        const patient = state.checkedInPatients.find(p => p.patientId === patientId);
        
        if (!patient) {
          return { success: false, error: 'Patient not found' };
        }
        
        const transferRecord = {
          ...patient,
          id: Date.now().toString(),
          transferTime: Date.now(),
          fromDepartment: patient.department,
          toDepartment: 'ophthalmology',
          method: staffId ? 'staff-transfer' : 'self-transfer',
          staffId,
          status: 'transferred',
          ophthalmologyCheckIn: true
        };
        
        const updatedCheckedIn = [...state.checkedInPatients, transferRecord];
        
        set({ checkedInPatients: updatedCheckedIn });
        
        return { success: true, transferRecord };
      },
      
      updatePatientStatus: (patientId, status, additionalData = {}) => {
        const state = get();
        const updatedCheckedIn = state.checkedInPatients.map(patient => 
          patient.patientId === patientId 
            ? { ...patient, status, ...additionalData, lastUpdated: Date.now() }
            : patient
        );
        
        set({ checkedInPatients: updatedCheckedIn });
      },
      
      getPatientCheckInStatus: (patientId) => {
        const state = get();
        const checkIns = state.checkedInPatients
          .filter(record => record.patientId === patientId)
          .sort((a, b) => b.checkInTime - a.checkInTime);
        
        return checkIns.length > 0 ? checkIns[0] : null;
      },
      
      getTodaysCheckIns: (department = null) => {
        const state = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return state.checkedInPatients.filter(record => {
          const checkInDate = new Date(record.checkInTime);
          checkInDate.setHours(0, 0, 0, 0);
          
          const isToday = checkInDate.getTime() === today.getTime();
          const matchesDept = department ? record.department === department : true;
          
          return isToday && matchesDept;
        });
      },
      
      getCheckInStatistics: (department = null) => {
        const todaysCheckIns = get().getTodaysCheckIns(department);
        
        const stats = {
          total: todaysCheckIns.length,
          byMethod: {},
          byStatus: {},
          averageWaitTime: 0,
          hourlyDistribution: {}
        };
        
        todaysCheckIns.forEach(record => {
          // By method
          stats.byMethod[record.method] = (stats.byMethod[record.method] || 0) + 1;
          
          // By status
          stats.byStatus[record.status] = (stats.byStatus[record.status] || 0) + 1;
          
          // Hourly distribution
          const hour = new Date(record.checkInTime).getHours();
          stats.hourlyDistribution[hour] = (stats.hourlyDistribution[hour] || 0) + 1;
        });
        
        return stats;
      },
      
      // Scanner Control
      startScanning: () => {
        set({ scannerStatus: 'scanning' });
      },
      
      stopScanning: () => {
        set({ scannerStatus: 'ready' });
      },
      
      resetScannerStatus: () => {
        set({ 
          scannerStatus: 'ready',
          lastScanResult: null
        });
      },
      
      // Settings
      updateKioskSettings: (newSettings) => {
        const state = get();
        set({ 
          kioskSettings: { ...state.kioskSettings, ...newSettings }
        });
      },
      
      // Debug function
      getDebugState: () => {
        const state = get();
        return state;
      },
      
      clearCheckInHistory: () => {
        set({
          checkedInPatients: [],
          staffCheckIns: [],
          lastScanResult: null
        });
      }
    }),
    {
      name: 'ohms-checkin-store',
      partialize: (state) => ({
        checkedInPatients: state.checkedInPatients,
        staffCheckIns: state.staffCheckIns,
        kioskSettings: state.kioskSettings
      })
    }
  )
);

// Helper functions
function parseQRCode(qrCodeData) {
  try {
    // Handle both JSON string and base64 image data
    if (qrCodeData.startsWith('data:image')) {
      // Extract embedded data from QR code (would need QR decoder library)
      // For now, return mock data
      return {
        patientId: 'PAT-' + Date.now(),
        token: 'TOK-' + Math.random().toString(36).substr(2, 8),
        patientInfo: {
          name: 'John Doe',
          phone: '+91 9876543210',
          age: 35
        },
        appointmentDetails: {
          department: 'optometry',
          doctorName: 'Dr. Smith',
          date: new Date().toISOString().split('T')[0],
          time: '10:00 AM'
        }
      };
    } else {
      // Assume JSON string
      return JSON.parse(qrCodeData);
    }
  } catch (error) {
    return null;
  }
}

async function lookupPatientByToken(token) {
  // This would typically query the appointment store or backend
  // For now, return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        patientId: 'PAT-' + Date.now(),
        token,
        patientInfo: {
          name: 'Jane Smith',
          phone: '+91 9876543210',
          age: 28
        },
        appointmentDetails: {
          department: 'optometry',
          doctorName: 'Dr. Johnson',
          date: new Date().toISOString().split('T')[0],
          time: '11:00 AM'
        }
      });
    }, 1000);
  });
}

export default useCheckInStore;