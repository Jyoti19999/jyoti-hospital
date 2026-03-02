/**
 * Notification Routes
 * Handles notification CRUD, preferences, and push token registration/unregistration
 */
const express = require('express');
const router = express.Router();
const { authenticateToken, requireStaff, requireAnyUser } = require('../middleware/auth');
const pushService = require('../services/pushNotificationService');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences
} = require('../controllers/notificationController');

// ─── General Notification Routes (any authenticated user) ────────────────────

// Get notifications for current user
router.get('/', authenticateToken, requireAnyUser, getNotifications);

// Get unread count
router.get('/unread-count', authenticateToken, requireAnyUser, getUnreadCount);

// Get user preferences
router.get('/preferences', authenticateToken, requireAnyUser, getPreferences);

// Update user preferences
router.put('/preferences', authenticateToken, requireAnyUser, updatePreferences);

// Mark specific notification as read
router.post('/:id/read', authenticateToken, requireAnyUser, markAsRead);

// Mark all notifications as read
router.post('/read-all', authenticateToken, requireAnyUser, markAllAsRead);

// Delete a notification
router.delete('/:id', authenticateToken, requireAnyUser, deleteNotification);

// ─── Push Token Routes (staff only) ─────────────────────────────────────────

/**
 * POST /api/v1/notifications/register-token
 * Register a device push token for the authenticated staff member
 * Body: { token: string, platform?: 'android' | 'ios' }
 */
router.post('/register-token', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { token, platform } = req.body;
    const staffId = req.user.id;

    if (!token) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    // Validate it looks like an Expo push token
    if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
      return res.status(400).json({ error: 'Invalid Expo push token format' });
    }

    const result = await pushService.registerToken(staffId, token, platform || 'android');

    res.status(200).json({
      success: true,
      message: 'Push token registered successfully',
      data: { id: result.id },
    });
  } catch (error) {
    console.error('❌ Error registering push token:', error.message);
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

/**
 * POST /api/v1/notifications/unregister-token
 * Unregister a device push token (e.g. on logout)
 * Body: { token: string }
 */
router.post('/unregister-token', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    await pushService.unregisterToken(token);

    res.status(200).json({
      success: true,
      message: 'Push token unregistered successfully',
    });
  } catch (error) {
    console.error('❌ Error unregistering push token:', error.message);
    res.status(500).json({ error: 'Failed to unregister push token' });
  }
});

/**
 * DELETE /api/v1/notifications/tokens
 * Remove all push tokens for the authenticated staff member
 */
router.delete('/tokens', authenticateToken, requireStaff, async (req, res) => {
  try {
    const staffId = req.user.id;
    await pushService.removeAllTokensForStaff(staffId);

    res.status(200).json({
      success: true,
      message: 'All push tokens removed',
    });
  } catch (error) {
    console.error('❌ Error removing push tokens:', error.message);
    res.status(500).json({ error: 'Failed to remove push tokens' });
  }
});

module.exports = router;
