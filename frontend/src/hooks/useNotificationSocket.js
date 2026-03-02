import { useEffect, useCallback, useRef } from 'react';
import { socket } from '@/lib/socket';
import { useSocketConnection } from './useSocket';
import useNotificationStore from '@/stores/ohms/notificationStore';
import { playPrioritySound, playCustomSound, playSoundFromUrl, resumeAudioContext } from '@/utils/soundManager';

/**
 * Custom hook to handle notification socket events
 * Automatically joins notification rooms based on user type and listens for real-time notifications
 * 
 * @param {Object} user - Current user object with { id, userType, staffType, department }
 * @returns {Object} - { isConnected, joinedRooms, unreadCount }
 */
export const useNotificationSocket = (user) => {
    const isConnected = useSocketConnection();
    const joinedRoomsRef = useRef([]);

    // Get store actions
    const addNotification = useNotificationStore(state => state.addNotification);
    const markAsRead = useNotificationStore(state => state.markAsRead);
    const notificationSettings = useNotificationStore(state => state.notificationSettings);
    const unreadCount = useNotificationStore(state => state.unreadCount);

    // Handle new notification from server
    const handleNewNotification = useCallback(async (notification) => {
        console.log('🔔 New notification received:', notification);

        // Add to local store
        addNotification({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority,
            timestamp: new Date(notification.createdAt).getTime(),
            actionable: notification.actionable,
            action: notification.actionType,
            data: notification.actionData || {},
            read: false,
            recipient: notification.recipientType === 'all' ? 'all' : 'staff'
        });

        // Play sound if enabled
        console.log(`🔊 Sound Check - Enabled: ${notificationSettings.enableSoundAlerts}, PlaySound: ${notification.playSound}, Priority: ${notification.priority}`);

        if (notificationSettings.enableSoundAlerts && notification.playSound) {
            try {
                console.log('🔊 Attempting to resume audio context...');
                await resumeAudioContext();
                console.log('🔊 Audio context resumed. Playing sound...');

                if (notification.actionData?.customSound) {
                    // Use the full URL provided in actionData
                    let soundUrl = notification.actionData.customSound;
                    // Add base URL if it's a relative path and doesn't explicitly start with http
                    // (Note: playSoundFromUrl handles simple relative paths, but we ensure consistency here)
                    if (soundUrl.startsWith('/') && !soundUrl.includes('http')) {
                        soundUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${soundUrl}`;
                    }
                    await playSoundFromUrl(soundUrl);
                } else if (notification.soundType === 'custom' && notification.actionData?.customSoundId) {
                    await playCustomSound(notification.actionData.customSoundId);
                } else {
                    await playPrioritySound(notification.priority);
                }
            } catch (error) {
                console.warn('Could not play notification sound:', error);
            }
        }
    }, [addNotification, notificationSettings.enableSoundAlerts]);

    // Handle notification being marked as read
    const handleNotificationRead = useCallback((data) => {
        markAsRead(data.notificationId);
    }, [markAsRead]);

    // Handle notification deleted
    const handleNotificationDeleted = useCallback((data) => {
        const store = useNotificationStore.getState();
        store.deleteNotification(data.notificationId);
    }, []);

    // Handle unread count update from server
    const handleUnreadCountUpdate = useCallback((data) => {
        console.log('📊 Unread count update:', data.unreadCount);
        // The server sends authoritative unread count - could sync here if needed
    }, []);

    // Handle notification error
    const handleError = useCallback((data) => {
        console.error('🔴 Notification error:', data.message);
    }, []);

    // Join notification rooms
    useEffect(() => {
        if (!isConnected || !user?.id) return;

        // Determine userType for socket - AuthContext uses 'role' but socket expects 'userType'
        // Super admin: role='superadmin' or no staffType and no patientId
        // Staff: has staffType
        // Patient: has patientId
        let userType = user.userType;
        if (!userType) {
            if (user.role === 'superadmin' || user.role === 'super_admin') {
                userType = 'super_admin';
            } else if (user.staffType) {
                userType = 'staff';
            } else if (user.patientId || user.role === 'patient') {
                userType = 'patient';
            } else {
                // Default to super_admin if no other indicators
                userType = 'super_admin';
            }
        }

        const joinData = {
            userId: user.id,
            userType: userType,
            staffType: user.staffType,
            department: user.department
        };

        console.log('📡 Joining notification rooms:', joinData);
        socket.emit('notification:join', joinData);

        // Handle join confirmation
        const handleJoined = (data) => {
            console.log('✅ Joined notification rooms:', data.rooms);
            joinedRoomsRef.current = data.rooms;
        };

        socket.on('notification:joined', handleJoined);

        return () => {
            socket.off('notification:joined', handleJoined);
        };
    }, [isConnected, user?.id, user?.userType, user?.role, user?.staffType, user?.department]);

    // Set up event listeners
    useEffect(() => {
        if (!isConnected) return;

        // Listen for notifications
        socket.on('notification:new', handleNewNotification);
        socket.on('notification:read-success', handleNotificationRead);
        socket.on('notification:deleted', handleNotificationDeleted);
        socket.on('notification:unread-count', handleUnreadCountUpdate);
        socket.on('notification:error', handleError);

        return () => {
            socket.off('notification:new', handleNewNotification);
            socket.off('notification:read-success', handleNotificationRead);
            socket.off('notification:deleted', handleNotificationDeleted);
            socket.off('notification:unread-count', handleUnreadCountUpdate);
            socket.off('notification:error', handleError);
        };
    }, [
        isConnected,
        handleNewNotification,
        handleNotificationRead,
        handleNotificationDeleted,
        handleUnreadCountUpdate,
        handleError
    ]);

    // Mark notification as read via socket
    const markAsReadViaSocket = useCallback((notificationId) => {
        if (isConnected) {
            socket.emit('notification:read', { notificationId });
        }
    }, [isConnected]);

    // Mark all as read via socket
    const markAllAsReadViaSocket = useCallback(() => {
        if (isConnected) {
            socket.emit('notification:read-all');
        }
    }, [isConnected]);

    // Get unread count via socket
    const refreshUnreadCount = useCallback(() => {
        if (isConnected) {
            socket.emit('notification:get-unread-count');
        }
    }, [isConnected]);

    return {
        isConnected,
        joinedRooms: joinedRoomsRef.current,
        unreadCount,
        markAsReadViaSocket,
        markAllAsReadViaSocket,
        refreshUnreadCount
    };
};

export default useNotificationSocket;
