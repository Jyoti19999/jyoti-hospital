import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useNotificationStore = create(
  persist(
    (set, get) => ({
      // State
      notifications: [],
      staffNotifications: [],
      patientNotifications: [],
      notificationSettings: {
        enableSoundAlerts: true,
        enableQueueUpdates: true,
        enableReminderAlerts: true,
        reminderInterval: 15, // minutes
        maxNotifications: 50
      },
      unreadCount: 0,
      
      // Notification Actions
      addNotification: (notification) => {
        const notificationRecord = {
          id: notification.id || Date.now().toString(),
          type: notification.type, // 'queue-update', 'reminder', 'emergency', 'system', 'consultation'
          title: notification.title,
          message: notification.message,
          recipient: notification.recipient, // 'staff', 'patient', 'doctor'
          recipientId: notification.recipientId,
          priority: notification.priority || 'normal', // 'low', 'normal', 'high', 'critical'
          timestamp: Date.now(),
          read: false,
          actionable: notification.actionable || false,
          action: notification.action || null,
          data: notification.data || {}
        };
        
        const state = get();
        let updatedNotifications = [...state.notifications, notificationRecord];
        
        // Maintain max notifications limit
        if (updatedNotifications.length > state.notificationSettings.maxNotifications) {
          updatedNotifications = updatedNotifications.slice(-state.notificationSettings.maxNotifications);
        }
        
        // Add to specific recipient lists
        let updatedStaffNotifications = state.staffNotifications;
        let updatedPatientNotifications = state.patientNotifications;
        
        if (notification.recipient === 'staff' || notification.recipient === 'doctor') {
          updatedStaffNotifications = [...state.staffNotifications, notificationRecord];
        } else if (notification.recipient === 'patient') {
          updatedPatientNotifications = [...state.patientNotifications, notificationRecord];
        }
        
        set({ 
          notifications: updatedNotifications,
          staffNotifications: updatedStaffNotifications,
          patientNotifications: updatedPatientNotifications,
          unreadCount: state.unreadCount + 1
        });
        
        // Play sound if enabled
        if (state.notificationSettings.enableSoundAlerts && notification.priority !== 'low') {
          get().playNotificationSound(notification.priority);
        }
        
        return notificationRecord;
      },
      
      markAsRead: (notificationId) => {
        const state = get();
        const updatedNotifications = state.notifications.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        );
        
        const updatedStaffNotifications = state.staffNotifications.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        );
        
        const updatedPatientNotifications = state.patientNotifications.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        );
        
        const wasUnread = state.notifications.find(n => n.id === notificationId && !n.read);
        const newUnreadCount = wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount;
        
        set({ 
          notifications: updatedNotifications,
          staffNotifications: updatedStaffNotifications,
          patientNotifications: updatedPatientNotifications,
          unreadCount: newUnreadCount
        });
      },
      
      markAllAsRead: (recipient = null) => {
        const state = get();
        
        if (recipient) {
          const updatedNotifications = state.notifications.map(notif => 
            notif.recipient === recipient ? { ...notif, read: true } : notif
          );
          
          let updatedStaffNotifications = state.staffNotifications;
          let updatedPatientNotifications = state.patientNotifications;
          
          if (recipient === 'staff' || recipient === 'doctor') {
            updatedStaffNotifications = state.staffNotifications.map(notif => ({ ...notif, read: true }));
          } else if (recipient === 'patient') {
            updatedPatientNotifications = state.patientNotifications.map(notif => ({ ...notif, read: true }));
          }
          
          const unreadRecipientCount = state.notifications.filter(n => n.recipient === recipient && !n.read).length;
          
          set({ 
            notifications: updatedNotifications,
            staffNotifications: updatedStaffNotifications,
            patientNotifications: updatedPatientNotifications,
            unreadCount: Math.max(0, state.unreadCount - unreadRecipientCount)
          });
        } else {
          const updatedNotifications = state.notifications.map(notif => ({ ...notif, read: true }));
          const updatedStaffNotifications = state.staffNotifications.map(notif => ({ ...notif, read: true }));
          const updatedPatientNotifications = state.patientNotifications.map(notif => ({ ...notif, read: true }));
          
          set({ 
            notifications: updatedNotifications,
            staffNotifications: updatedStaffNotifications,
            patientNotifications: updatedPatientNotifications,
            unreadCount: 0
          });
        }
      },
      
      deleteNotification: (notificationId) => {
        const state = get();
        const notification = state.notifications.find(n => n.id === notificationId);
        
        const updatedNotifications = state.notifications.filter(notif => notif.id !== notificationId);
        const updatedStaffNotifications = state.staffNotifications.filter(notif => notif.id !== notificationId);
        const updatedPatientNotifications = state.patientNotifications.filter(notif => notif.id !== notificationId);
        
        const wasUnread = notification && !notification.read;
        const newUnreadCount = wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount;
        
        set({ 
          notifications: updatedNotifications,
          staffNotifications: updatedStaffNotifications,
          patientNotifications: updatedPatientNotifications,
          unreadCount: newUnreadCount
        });
      },
      
      // Specific notification types
      addQueueUpdateNotification: (patientInfo, queuePosition, estimatedWaitTime, queueType) => {
        return get().addNotification({
          type: 'queue-update',
          title: 'Queue Position Updated',
          message: `${patientInfo.name} is now #${queuePosition} in ${queueType} queue. Estimated wait: ${estimatedWaitTime} minutes.`,
          recipient: 'patient',
          recipientId: patientInfo.patientId,
          priority: 'normal',
          data: {
            queuePosition,
            estimatedWaitTime,
            queueType,
            patientId: patientInfo.patientId
          }
        });
      },
      
      addPatientCalledNotification: (patientInfo, doctorName, roomNumber) => {
        return get().addNotification({
          type: 'patient-called',
          title: 'You are called for consultation',
          message: `Please proceed to ${doctorName}'s room (${roomNumber}) for your consultation.`,
          recipient: 'patient',
          recipientId: patientInfo.patientId,
          priority: 'high',
          actionable: true,
          action: 'proceed-to-consultation',
          data: {
            doctorName,
            roomNumber,
            patientId: patientInfo.patientId
          }
        });
      },
      
      addObservationReminderNotification: (patientInfo, observationType, duration) => {
        return get().addNotification({
          type: 'observation-reminder',
          title: 'Patient Under Observation',
          message: `${patientInfo.name} has been under ${observationType} observation for ${duration} minutes.`,
          recipient: 'doctor',
          recipientId: 'current-doctor',
          priority: 'normal',
          actionable: true,
          action: 'check-observation-patient',
          data: {
            patientId: patientInfo.patientId,
            observationType,
            duration
          }
        });
      },
      
      addEmergencyNotification: (patientInfo, emergencyType, location) => {
        return get().addNotification({
          type: 'emergency',
          title: 'Emergency Alert',
          message: `Emergency: ${emergencyType} - Patient ${patientInfo.name} at ${location}`,
          recipient: 'staff',
          priority: 'critical',
          actionable: true,
          action: 'handle-emergency',
          data: {
            patientId: patientInfo.patientId,
            emergencyType,
            location
          }
        });
      },
      
      addSystemNotification: (title, message, priority = 'normal') => {
        return get().addNotification({
          type: 'system',
          title,
          message,
          recipient: 'staff',
          priority
        });
      },
      
      // Utility functions
      getUnreadNotifications: (recipient = null) => {
        const state = get();
        let notifications = state.notifications.filter(notif => !notif.read);
        
        if (recipient) {
          notifications = notifications.filter(notif => notif.recipient === recipient);
        }
        
        return notifications.sort((a, b) => b.timestamp - a.timestamp);
      },
      
      getNotificationsByType: (type, recipient = null) => {
        const state = get();
        let notifications = state.notifications.filter(notif => notif.type === type);
        
        if (recipient) {
          notifications = notifications.filter(notif => notif.recipient === recipient);
        }
        
        return notifications.sort((a, b) => b.timestamp - a.timestamp);
      },
      
      getNotificationsByPriority: (priority, recipient = null) => {
        const state = get();
        let notifications = state.notifications.filter(notif => notif.priority === priority);
        
        if (recipient) {
          notifications = notifications.filter(notif => notif.recipient === recipient);
        }
        
        return notifications.sort((a, b) => b.timestamp - a.timestamp);
      },
      
      playNotificationSound: (priority) => {
        const state = get();
        if (!state.notificationSettings.enableSoundAlerts) return;
        
        // Different sounds for different priorities
        const sounds = {
          low: 'notification-low.mp3',
          normal: 'notification-normal.mp3',
          high: 'notification-high.mp3',
          critical: 'notification-critical.mp3'
        };
        
        // In a real implementation, this would play the actual sound file
      },
      
      // Settings
      updateNotificationSettings: (newSettings) => {
        const state = get();
        set({ 
          notificationSettings: { ...state.notificationSettings, ...newSettings }
        });
      },
      
      // Statistics
      getNotificationStatistics: () => {
        const state = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaysNotifications = state.notifications.filter(notif => {
          const notifDate = new Date(notif.timestamp);
          notifDate.setHours(0, 0, 0, 0);
          return notifDate.getTime() === today.getTime();
        });
        
        return {
          total: state.notifications.length,
          unread: state.unreadCount,
          today: todaysNotifications.length,
          byType: state.notifications.reduce((acc, notif) => {
            acc[notif.type] = (acc[notif.type] || 0) + 1;
            return acc;
          }, {}),
          byPriority: state.notifications.reduce((acc, notif) => {
            acc[notif.priority] = (acc[notif.priority] || 0) + 1;
            return acc;
          }, {}),
          byRecipient: state.notifications.reduce((acc, notif) => {
            acc[notif.recipient] = (acc[notif.recipient] || 0) + 1;
            return acc;
          }, {})
        };
      },
      
      // Debug function
      getDebugState: () => {
        const state = get();
        return state;
      },
      
      clearAllNotifications: () => {
        set({
          notifications: [],
          staffNotifications: [],
          patientNotifications: [],
          unreadCount: 0
        });
      }
    }),
    {
      name: 'ohms-notification-store',
      partialize: (state) => ({
        notificationSettings: state.notificationSettings
      })
    }
  )
);

export default useNotificationStore;