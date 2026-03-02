// QR Code and Appointment Display Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useQRAppointmentStore = create(
  persist(
    (set, get) => ({
      // Current appointment with QR code
      currentAppointment: null,
      qrCodeData: null,
      
      // Patient information
      patientInfo: {
        name: '',
        phone: '',
        email: '',
        age: null
      },
      
      // Doctor and appointment details
      appointmentDetails: {
        doctorName: '',
        doctorSpecialization: '',
        department: '',
        date: '',
        time: '',
        location: '',
        fee: 0,
        token: '',
        waitTime: '',
        trafficLevel: ''
      },
      
      // QR Code generation status
      isQRGenerated: false,
      qrGenerationTimestamp: null,
      
      // Actions
      setCurrentAppointment: (appointmentData, patientData, qrCodeDataURL) => {
        const currentTime = new Date().toISOString();
        
        set({
          currentAppointment: {
            id: `apt_${Date.now()}`,
            createdAt: currentTime,
            status: 'confirmed',
            ...appointmentData
          },
          patientInfo: patientData,
          appointmentDetails: appointmentData,
          qrCodeData: qrCodeDataURL,
          isQRGenerated: true,
          qrGenerationTimestamp: currentTime
        });
      },
      
      updatePatientInfo: (patientData) => {
        set({
          patientInfo: { ...get().patientInfo, ...patientData }
        });
      },
      
      updateAppointmentDetails: (appointmentData) => {
        set({
          appointmentDetails: { ...get().appointmentDetails, ...appointmentData }
        });
      },
      
      // Get formatted appointment for display
      getFormattedAppointment: () => {
        const state = get();
        if (!state.currentAppointment) return null;
        
        return {
          id: state.currentAppointment.id,
          patient: state.patientInfo,
          doctor: {
            name: state.appointmentDetails.doctorName,
            specialization: state.appointmentDetails.doctorSpecialization,
            department: state.appointmentDetails.department
          },
          appointment: {
            date: state.appointmentDetails.date,
            time: state.appointmentDetails.time,
            location: state.appointmentDetails.location,
            fee: state.appointmentDetails.fee,
            token: state.appointmentDetails.token,
            waitTime: state.appointmentDetails.waitTime,
            trafficLevel: state.appointmentDetails.trafficLevel
          },
          qrCode: state.qrCodeData,
          status: state.currentAppointment.status,
          createdAt: state.currentAppointment.createdAt,
          isQRGenerated: state.isQRGenerated
        };
      },
      
      // Clear appointment data
      clearAppointment: () => {
        set({
          currentAppointment: null,
          qrCodeData: null,
          patientInfo: {
            name: '',
            phone: '',
            email: '',
            age: null
          },
          appointmentDetails: {
            doctorName: '',
            doctorSpecialization: '',
            department: '',
            date: '',
            time: '',
            location: '',
            fee: 0,
            token: '',
            waitTime: '',
            trafficLevel: ''
          },
          isQRGenerated: false,
          qrGenerationTimestamp: null
        });
      },
      
      // Update appointment status
      updateAppointmentStatus: (status) => {
        set((state) => ({
          currentAppointment: state.currentAppointment ? {
            ...state.currentAppointment,
            status
          } : null
        }));
      },
      
      // Check if appointment is valid (not expired)
      isAppointmentValid: () => {
        const state = get();
        if (!state.currentAppointment || !state.appointmentDetails.date || !state.appointmentDetails.time) {
          return false;
        }
        
        const appointmentDateTime = new Date(`${state.appointmentDetails.date} ${state.appointmentDetails.time}`);
        const now = new Date();
        
        // Consider appointment valid if it's within 24 hours from now
        const timeDiff = appointmentDateTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        return hoursDiff > -2 && hoursDiff < 24; // Valid from 2 hours before to 24 hours in future
      },
      
      // Get time until appointment
      getTimeUntilAppointment: () => {
        const state = get();
        if (!state.appointmentDetails.date || !state.appointmentDetails.time) {
          return null;
        }
        
        const appointmentDateTime = new Date(`${state.appointmentDetails.date} ${state.appointmentDetails.time}`);
        const now = new Date();
        const timeDiff = appointmentDateTime.getTime() - now.getTime();
        
        if (timeDiff < 0) {
          return { type: 'past', value: 'Appointment time has passed' };
        }
        
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours < 1) {
          return { type: 'minutes', value: `${minutes} minutes` };
        } else if (hours < 24) {
          return { type: 'hours', value: `${hours} hours ${minutes} minutes` };
        } else {
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          return { type: 'days', value: `${days} days ${remainingHours} hours` };
        }
      }
    }),
    {
      name: 'qr-appointment-store',
      partialize: (state) => ({
        currentAppointment: state.currentAppointment,
        qrCodeData: state.qrCodeData,
        patientInfo: state.patientInfo,
        appointmentDetails: state.appointmentDetails,
        isQRGenerated: state.isQRGenerated,
        qrGenerationTimestamp: state.qrGenerationTimestamp
      })
    }
  )
);

export default useQRAppointmentStore;
