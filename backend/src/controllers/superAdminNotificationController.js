/**
 * Super Admin Notification Controller
 * Handles notification management for super administrators
 */

const notificationService = require('../services/notificationService');

/**
 * Create and broadcast a new notification
 * POST /admin/notifications
 */
const createNotification = async (req, res) => {
    try {
        const {
            title,
            message,
            type,
            priority,
            recipientType,
            targetStaffTypes,
            targetUserIds,
            targetDepartments,
            actionable,
            actionType,
            actionData,
            playSound,
            soundType,
            expiresAt
        } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                error: 'Title and message are required'
            });
        }

        const notification = await notificationService.createNotification({
            title,
            message,
            type: type || 'custom',
            priority: priority || 'normal',
            recipientType: recipientType || 'all',
            targetStaffTypes: targetStaffTypes || [],
            targetUserIds: targetUserIds || [],
            targetDepartments: targetDepartments || [],
            actionable: actionable || false,
            actionType,
            actionData,
            playSound: playSound !== false,
            soundType: soundType || 'default',
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            createdById: req.user.id,
            createdByType: 'super_admin'
        });

        res.status(201).json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create notification'
        });
    }
};

/**
 * Get all notifications (admin view)
 * GET /admin/notifications
 */
const getAllNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, priority, includeInactive } = req.query;

        const result = await notificationService.getAllNotifications({
            page: parseInt(page),
            limit: parseInt(limit),
            type,
            priority,
            includeInactive: includeInactive === 'true'
        });

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error getting all notifications:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get notifications'
        });
    }
};

/**
 * Get notification statistics
 * GET /admin/notifications/statistics
 */
const getStatistics = async (req, res) => {
    try {
        const statistics = await notificationService.getNotificationStatistics();

        res.json({
            success: true,
            statistics
        });
    } catch (error) {
        console.error('Error getting notification statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get statistics'
        });
    }
};

/**
 * Delete a notification
 * DELETE /admin/notifications/:id
 */
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

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
 * Broadcast notification to specific staff types
 * POST /admin/notifications/broadcast
 */
const broadcastNotification = async (req, res) => {
    try {
        const {
            title,
            message,
            targetStaffTypes,
            priority,
            playSound,
            soundType
        } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                error: 'Title and message are required'
            });
        }

        if (!targetStaffTypes || targetStaffTypes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one target staff type is required'
            });
        }

        const notification = await notificationService.createNotification({
            title,
            message,
            type: 'custom',
            priority: priority || 'normal',
            recipientType: 'staff_type',
            targetStaffTypes,
            playSound: playSound !== false,
            soundType: soundType || 'default',
            createdById: req.user.id,
            createdByType: 'super_admin'
        });

        res.status(201).json({
            success: true,
            notification,
            message: `Notification broadcast to ${targetStaffTypes.join(', ')}`
        });
    } catch (error) {
        console.error('Error broadcasting notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to broadcast notification'
        });
    }
};

/**
 * Send notification to specific users
 * POST /admin/notifications/send-to-users
 */
const sendToUsers = async (req, res) => {
    try {
        const {
            title,
            message,
            targetUserIds,
            priority,
            playSound,
            soundType
        } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                error: 'Title and message are required'
            });
        }

        if (!targetUserIds || targetUserIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one target user ID is required'
            });
        }

        const notification = await notificationService.createNotification({
            title,
            message,
            type: 'custom',
            priority: priority || 'normal',
            recipientType: 'specific_user',
            targetUserIds,
            playSound: playSound !== false,
            soundType: soundType || 'default',
            createdById: req.user.id,
            createdByType: 'super_admin'
        });

        res.status(201).json({
            success: true,
            notification,
            message: `Notification sent to ${targetUserIds.length} user(s)`
        });
    } catch (error) {
        console.error('Error sending notification to users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send notification'
        });
    }
};

/**
 * Send emergency notification to all
 * POST /admin/notifications/emergency
 */
const sendEmergencyNotification = async (req, res) => {
    try {
        const { title, message } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                error: 'Title and message are required'
            });
        }

        const notification = await notificationService.createEmergencyNotification(
            title,
            message,
            {
                createdById: req.user.id,
                createdByType: 'super_admin'
            }
        );

        res.status(201).json({
            success: true,
            notification,
            message: 'Emergency notification sent to all users'
        });
    } catch (error) {
        console.error('Error sending emergency notification:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to send emergency notification'
        });
    }
};

/**
 * Get available staff types for targeting
 * GET /admin/notifications/staff-types
 */
const getStaffTypes = async (req, res) => {
    try {
        // These are the staff types available in the system
        const staffTypes = [
            { value: 'doctor', label: 'Doctor' },
            { value: 'ophthalmologist', label: 'Ophthalmologist' },
            { value: 'optometrist', label: 'Optometrist' },
            { value: 'receptionist', label: 'Receptionist' },
            { value: 'receptionist2', label: 'Receptionist 2' },
            { value: 'nurse', label: 'Nurse' },
            { value: 'sister', label: 'Sister' },
            { value: 'technician', label: 'Technician' },
            { value: 'surgeon', label: 'Surgeon' },
            { value: 'anesthesiologist', label: 'Anesthesiologist' },
            { value: 'ot_admin', label: 'OT Admin' },
            { value: 'tpa', label: 'TPA' },
            { value: 'admin', label: 'Admin' }
        ];

        res.json({
            success: true,
            staffTypes
        });
    } catch (error) {
        console.error('Error getting staff types:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get staff types'
        });
    }
};

/**
 * Get notification types
 * GET /admin/notifications/types
 */
const getNotificationTypes = async (req, res) => {
    try {
        const types = [
            { value: 'system', label: 'System', description: 'General system notifications' },
            { value: 'queue', label: 'Queue', description: 'Patient queue updates' },
            { value: 'emergency', label: 'Emergency', description: 'Emergency alerts' },
            { value: 'appointment', label: 'Appointment', description: 'Appointment reminders' },
            { value: 'surgery', label: 'Surgery', description: 'Surgery related notifications' },
            { value: 'billing', label: 'Billing', description: 'Billing and payment notifications' },
            { value: 'custom', label: 'Custom', description: 'Custom notifications' }
        ];

        const priorities = [
            { value: 'low', label: 'Low', color: 'gray' },
            { value: 'normal', label: 'Normal', color: 'blue' },
            { value: 'high', label: 'High', color: 'orange' },
            { value: 'critical', label: 'Critical', color: 'red' }
        ];

        const soundTypes = [
            { value: 'default', label: 'Default' },
            { value: 'urgent', label: 'Urgent' },
            { value: 'subtle', label: 'Subtle' }
        ];

        res.json({
            success: true,
            types,
            priorities,
            soundTypes
        });
    } catch (error) {
        console.error('Error getting notification types:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get notification types'
        });
    }
};

module.exports = {
    createNotification,
    getAllNotifications,
    getStatistics,
    deleteNotification,
    broadcastNotification,
    sendToUsers,
    sendEmergencyNotification,
    getStaffTypes,
    getNotificationTypes
};
