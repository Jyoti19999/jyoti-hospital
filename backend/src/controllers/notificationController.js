/**
 * Notification Controller
 * Handles HTTP requests for notification-related operations
 */

const notificationService = require('../services/notificationService');

/**
 * Get notifications for the authenticated user
 * GET /notifications
 */
const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly, type } = req.query;
        const userId = req.user.id;
        const userType = req.userType;
        const staffType = req.user.staffType;

        const result = await notificationService.getNotificationsForUser(
            userId,
            userType,
            staffType,
            {
                page: parseInt(page),
                limit: parseInt(limit),
                unreadOnly: unreadOnly === 'true',
                type
            }
        );

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get notifications'
        });
    }
};

/**
 * Get unread notification count
 * GET /notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.userType;
        const staffType = req.user.staffType;

        const unreadCount = await notificationService.getUnreadCount(userId, userType, staffType);

        res.json({
            success: true,
            unreadCount
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get unread count'
        });
    }
};

/**
 * Mark a notification as read
 * POST /notifications/:id/read
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userType = req.userType;

        await notificationService.markAsRead(id, userId, userType);

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark notification as read'
        });
    }
};

/**
 * Mark all notifications as read
 * POST /notifications/read-all
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.userType;
        const staffType = req.user.staffType;

        const result = await notificationService.markAllAsRead(userId, userType, staffType);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark all notifications as read'
        });
    }
};

/**
 * Delete a notification (own notifications only, or admin for all)
 * DELETE /notifications/:id
 */
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        // For now, only super admins can delete notifications
        if (req.userType !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: 'Only super admins can delete notifications'
            });
        }

        await notificationService.deleteNotification(id);

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete notification'
        });
    }
};

/**
 * Get user notification preferences
 * GET /notifications/preferences
 */
const getPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.userType;

        const preferences = await notificationService.getPreferences(userId, userType);

        res.json({
            success: true,
            preferences
        });
    } catch (error) {
        console.error('Error getting preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get preferences'
        });
    }
};

/**
 * Update user notification preferences
 * PUT /notifications/preferences
 */
const updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.userType;
        const preferencesData = req.body;

        const preferences = await notificationService.updatePreferences(
            userId,
            userType,
            preferencesData
        );

        res.json({
            success: true,
            preferences
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update preferences'
        });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getPreferences,
    updatePreferences
};
