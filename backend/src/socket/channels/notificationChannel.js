/**
 * Notification Channel - Handles real-time notification events via Socket.IO
 * 
 * Rooms:
 * - 'notifications:all' - All users (broadcast)
 * - 'notifications:super_admin' - All super admins
 * - 'notifications:staff:{staffType}' - Staff by type (e.g., 'notifications:staff:doctor')
 * - 'notifications:user:{userId}' - Specific user
 * - 'notifications:department:{dept}' - Department-wide
 */

const notificationService = require('../../services/notificationService');

module.exports = (io, socket) => {
    /**
     * Join notification rooms based on user type and role
     * Client should emit this after authentication
     */
    socket.on('notification:join', async (data) => {
        const { userId, userType, staffType, department } = data;

        if (!userId || !userType) {
            socket.emit('notification:error', { message: 'userId and userType are required' });
            return;
        }

        // Join user-specific room
        const userRoom = `notifications:user:${userId}`;
        socket.join(userRoom);
        console.log(`🔔 User ${userId} joined notification room: ${userRoom}`);

        // Join broadcast room
        socket.join('notifications:all');

        // Join role-specific rooms
        if (userType === 'super_admin') {
            socket.join('notifications:super_admin');
            console.log(`🔔 Super admin ${userId} joined notifications:super_admin`);
        } else if (userType === 'staff' && staffType) {
            const staffRoom = `notifications:staff:${staffType}`;
            socket.join(staffRoom);
            console.log(`🔔 Staff ${userId} (${staffType}) joined ${staffRoom}`);

            // Join department room if provided
            if (department) {
                const deptRoom = `notifications:department:${department}`;
                socket.join(deptRoom);
                console.log(`🔔 Staff ${userId} joined department room: ${deptRoom}`);
            }
        } else if (userType === 'patient') {
            socket.join('notifications:patient');
            console.log(`🔔 Patient ${userId} joined notifications:patient`);
        }

        // Store user info on socket for later use
        socket.userData = { userId, userType, staffType, department };

        // Send confirmation with unread count
        try {
            const unreadCount = await notificationService.getUnreadCount(userId, userType, staffType);
            socket.emit('notification:joined', {
                success: true,
                unreadCount,
                rooms: Array.from(socket.rooms)
            });
        } catch (error) {
            console.error('Error getting unread count:', error);
            socket.emit('notification:joined', {
                success: true,
                unreadCount: 0,
                rooms: Array.from(socket.rooms)
            });
        }
    });

    /**
     * Mark a notification as read
     */
    socket.on('notification:read', async (data) => {
        const { notificationId } = data;
        const userData = socket.userData;

        if (!userData || !notificationId) {
            socket.emit('notification:error', { message: 'Not authenticated or missing notificationId' });
            return;
        }

        try {
            await notificationService.markAsRead(notificationId, userData.userId, userData.userType);
            socket.emit('notification:read-success', { notificationId });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            socket.emit('notification:error', { message: 'Failed to mark as read' });
        }
    });

    /**
     * Mark all notifications as read
     */
    socket.on('notification:read-all', async () => {
        const userData = socket.userData;

        if (!userData) {
            socket.emit('notification:error', { message: 'Not authenticated' });
            return;
        }

        try {
            const result = await notificationService.markAllAsRead(
                userData.userId,
                userData.userType,
                userData.staffType
            );
            socket.emit('notification:read-all-success', result);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            socket.emit('notification:error', { message: 'Failed to mark all as read' });
        }
    });

    /**
     * Get current unread count
     */
    socket.on('notification:get-unread-count', async () => {
        const userData = socket.userData;

        if (!userData) {
            socket.emit('notification:error', { message: 'Not authenticated' });
            return;
        }

        try {
            const unreadCount = await notificationService.getUnreadCount(
                userData.userId,
                userData.userType,
                userData.staffType
            );
            socket.emit('notification:unread-count', { unreadCount });
        } catch (error) {
            console.error('Error getting unread count:', error);
            socket.emit('notification:error', { message: 'Failed to get unread count' });
        }
    });

    /**
     * Get user preferences
     */
    socket.on('notification:get-preferences', async () => {
        const userData = socket.userData;

        if (!userData) {
            socket.emit('notification:error', { message: 'Not authenticated' });
            return;
        }

        try {
            const preferences = await notificationService.getPreferences(
                userData.userId,
                userData.userType
            );
            socket.emit('notification:preferences', preferences);
        } catch (error) {
            console.error('Error getting preferences:', error);
            socket.emit('notification:error', { message: 'Failed to get preferences' });
        }
    });

    /**
     * Update user preferences
     */
    socket.on('notification:update-preferences', async (preferencesData) => {
        const userData = socket.userData;

        if (!userData) {
            socket.emit('notification:error', { message: 'Not authenticated' });
            return;
        }

        try {
            const preferences = await notificationService.updatePreferences(
                userData.userId,
                userData.userType,
                preferencesData
            );
            socket.emit('notification:preferences-updated', preferences);
        } catch (error) {
            console.error('Error updating preferences:', error);
            socket.emit('notification:error', { message: 'Failed to update preferences' });
        }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
        if (socket.userData) {
            console.log(`🔕 User ${socket.userData.userId} disconnected from notifications`);
        }
    });
};

/**
 * Helper function to emit notification to all connected users in target rooms
 * This can be called from other services
 */
const emitNotification = (io, notification) => {
    const rooms = notificationService.getNotificationTargetRooms(notification);

    rooms.forEach(room => {
        io.to(room).emit('notification:new', notification);
    });

    console.log(`📢 Emitted notification to rooms:`, rooms);
};

/**
 * Emit unread count update to a specific user
 */
const emitUnreadCountUpdate = async (io, userId, userType, staffType) => {
    try {
        const unreadCount = await notificationService.getUnreadCount(userId, userType, staffType);
        io.to(`notifications:user:${userId}`).emit('notification:unread-count', { unreadCount });
    } catch (error) {
        console.error('Error emitting unread count update:', error);
    }
};

module.exports.emitNotification = emitNotification;
module.exports.emitUnreadCountUpdate = emitUnreadCountUpdate;
