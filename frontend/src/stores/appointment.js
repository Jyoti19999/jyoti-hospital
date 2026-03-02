// Appointment management store with token and QR code integration

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAppointmentToken } from '@/lib/tokenService';
import { generateIdentityPackage } from '@/lib/identityService';

const useAppointmentStore = create(
  persist(
    (set, get) => ({
      // Current appointments
      appointments: [],
      
      // Current patient's active appointment
      activeAppointment: null,
      
      // Patient identity data
      patientUID: null,
      
      // Appointment booking state
      bookingData: null,
      isBookingComplete: false,
      
      // Traffic and queue data
      currentTraffic: {},
      
      // Actions
      createAppointment: (patientData, appointmentData) => {
        // Generate token with priority
        const tokenData = createAppointmentToken(patientData, appointmentData);
        
        // Generate complete identity package (UID, QR code, barcode)
        const identityPackage = generateIdentityPackage(
          patientData, 
          appointmentData, 
          tokenData.token
        );
        
        const appointment = {
          id: Date.now().toString(),
          ...tokenData,
          ...identityPackage,
          patientData,
          appointmentData,
          status: 'booked',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        set(state => ({
          appointments: [...state.appointments, appointment],
          activeAppointment: appointment,
          patientUID: identityPackage.uid,
          bookingData: appointment,
          isBookingComplete: true
        }));
        
        return appointment;
      },
      
      // Update appointment stage (A -> R -> O -> S -> P)
      updateAppointmentStage: (appointmentId, newStage) => {
        set(state => ({
          appointments: state.appointments.map(apt => {
            if (apt.id === appointmentId) {
              const updatedToken = apt.token.replace(/^[A-Z]/, newStage);
              return {
                ...apt,
                token: updatedToken,
                stage: newStage,
                updatedAt: new Date().toISOString()
              };
            }
            return apt;
          }),
          activeAppointment: state.activeAppointment?.id === appointmentId ? {
            ...state.activeAppointment,
            token: state.activeAppointment.token.replace(/^[A-Z]/, newStage),
            stage: newStage,
            updatedAt: new Date().toISOString()
          } : state.activeAppointment
        }));
      },
      
      // Check-in patient (A -> R transition)
      checkInPatient: (appointmentId) => {
        get().updateAppointmentStage(appointmentId, 'R');
        
        set(state => ({
          appointments: state.appointments.map(apt => {
            if (apt.id === appointmentId) {
              return {
                ...apt,
                status: 'checked-in',
                checkedInAt: new Date().toISOString()
              };
            }
            return apt;
          })
        }));
      },
      
      // Get appointment by token
      getAppointmentByToken: (token) => {
        return get().appointments.find(apt => apt.token === token);
      },
      
      // Get appointments by UID
      getAppointmentsByUID: (uid) => {
        return get().appointments.filter(apt => apt.uid === uid);
      },
      
      // Update traffic data
      updateTraffic: (department, trafficData) => {
        set(state => ({
          currentTraffic: {
            ...state.currentTraffic,
            [department]: trafficData
          }
        }));
      },
      
      // Reset booking state
      resetBooking: () => {
        set({
          bookingData: null,
          isBookingComplete: false
        });
      },
      
      // Get active appointment for current patient
      getActiveAppointment: () => {
        return get().activeAppointment;
      },
      
      // Cancel appointment
      cancelAppointment: (appointmentId) => {
        set(state => ({
          appointments: state.appointments.map(apt => {
            if (apt.id === appointmentId) {
              return {
                ...apt,
                status: 'cancelled',
                cancelledAt: new Date().toISOString()
              };
            }
            return apt;
          }),
          activeAppointment: state.activeAppointment?.id === appointmentId ? 
            null : state.activeAppointment
        }));
      },
      
      // Complete appointment
      completeAppointment: (appointmentId, results = {}) => {
        set(state => ({
          appointments: state.appointments.map(apt => {
            if (apt.id === appointmentId) {
              return {
                ...apt,
                status: 'completed',
                completedAt: new Date().toISOString(),
                results
              };
            }
            return apt;
          })
        }));
      },
      
      // Get appointment history
      getAppointmentHistory: () => {
        return get().appointments.filter(apt => 
          apt.status === 'completed' || apt.status === 'cancelled'
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      },
      
      // Get upcoming appointments
      getUpcomingAppointments: () => {
        return get().appointments.filter(apt => 
          apt.status === 'booked' || apt.status === 'checked-in'
        ).sort((a, b) => new Date(a.appointmentData.date) - new Date(b.appointmentData.date));
      }
    }),
    {
      name: 'appointment-store',
      partialize: (state) => ({
        appointments: state.appointments,
        patientUID: state.patientUID,
        activeAppointment: state.activeAppointment
      })
    }
  )
);

export default useAppointmentStore;