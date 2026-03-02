/**
 * Notification API Service
 * Handles all HTTP requests to the notification backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Headers for API requests
// Note: Authentication is handled via httpOnly cookies sent automatically with credentials: 'include'
// We do NOT manually set Authorization header since the auth cookie is httpOnly and cannot be read by JavaScript
const getHeaders = () => ({
    'Content-Type': 'application/json'
});

/**
 * Get notifications for the current user
 */
export const getUserNotifications = async (options = {}) => {
    const { page = 1, limit = 20, unreadOnly = false, type = null } = options;
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(unreadOnly && { unreadOnly: 'true' }),
        ...(type && { type })
    });

    const response = await fetch(`${API_BASE_URL}/notifications?${params}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to fetch notifications');
    }

    return response.json();
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to fetch unread count');
    }

    return response.json();
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to mark notification as read');
    }

    return response.json();
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
    }

    return response.json();
};

/**
 * Get user notification preferences
 */
export const getNotificationPreferences = async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/preferences`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to fetch preferences');
    }

    return response.json();
};

/**
 * Update user notification preferences
 */
export const updateNotificationPreferences = async (preferences) => {
    const response = await fetch(`${API_BASE_URL}/notifications/preferences`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(preferences)
    });

    if (!response.ok) {
        throw new Error('Failed to update preferences');
    }

    return response.json();
};

// ==================== SUPER ADMIN ENDPOINTS ====================

/**
 * Create a new notification (Super Admin)
 */
export const createNotification = async (notificationData) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/notifications`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(notificationData)
    });

    if (!response.ok) {
        throw new Error('Failed to create notification');
    }

    return response.json();
};

/**
 * Get all notifications (Super Admin)
 */
export const getAllNotifications = async (options = {}) => {
    const { page = 1, limit = 20, type, priority, includeInactive = false } = options;
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(type && { type }),
        ...(priority && { priority }),
        ...(includeInactive && { includeInactive: 'true' })
    });

    const response = await fetch(`${API_BASE_URL}/super-admin/notifications?${params}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to fetch notifications');
    }

    return response.json();
};

/**
 * Get notification statistics (Super Admin)
 */
export const getNotificationStatistics = async () => {
    const response = await fetch(`${API_BASE_URL}/super-admin/notifications/statistics`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to fetch statistics');
    }

    return response.json();
};

/**
 * Broadcast notification to staff types (Super Admin)
 */
export const broadcastNotification = async (data) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/notifications/broadcast`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('Failed to broadcast notification');
    }

    return response.json();
};

/**
 * Send notification to specific users (Super Admin)
 */
export const sendToUsers = async (data) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/notifications/send-to-users`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('Failed to send notification');
    }

    return response.json();
};

/**
 * Send emergency notification (Super Admin)
 */
export const sendEmergencyNotification = async (title, message) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/notifications/emergency`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ title, message })
    });

    if (!response.ok) {
        throw new Error('Failed to send emergency notification');
    }

    return response.json();
};

/**
 * Delete a notification (Super Admin)
 */
export const deleteNotification = async (notificationId) => {
    const response = await fetch(`${API_BASE_URL}/super-admin/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to delete notification');
    }

    return response.json();
};

/**
 * Get available staff types for targeting (Super Admin)
 */
export const getStaffTypes = async () => {
    const response = await fetch(`${API_BASE_URL}/super-admin/notifications/staff-types`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to fetch staff types');
    }

    return response.json();
};

/**
 * Get notification types and priorities (Super Admin)
 */
export const getNotificationTypes = async () => {
    const response = await fetch(`${API_BASE_URL}/super-admin/notifications/types`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to fetch notification types');
    }

    return response.json();
};

export default {
    // User endpoints
    getUserNotifications,
    getUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getNotificationPreferences,
    updateNotificationPreferences,

    // Admin endpoints
    createNotification,
    getAllNotifications,
    getNotificationStatistics,
    broadcastNotification,
    sendToUsers,
    sendEmergencyNotification,
    deleteNotification,
    getStaffTypes,
    getNotificationTypes
};
