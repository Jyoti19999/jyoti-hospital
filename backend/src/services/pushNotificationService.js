/**
 * Push Notification Service
 * Sends push notifications via Expo Push API (uses FCM under the hood for Android)
 * 
 * Expo Push API docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */
const prisma = require('../utils/prisma');

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send push notifications to specific staff members
 * @param {string[]} staffIds - Array of staff IDs to notify
 * @param {object} notification - { title, body, data }
 */
async function sendToStaff(staffIds, notification) {
  try {
    if (!staffIds || staffIds.length === 0) return;

    // Get active push tokens for these staff members
    const tokens = await prisma.pushToken.findMany({
      where: {
        staffId: { in: staffIds },
        isActive: true,
      },
      select: { token: true, id: true },
    });

    if (tokens.length === 0) {
      console.log('📱 No push tokens found for staff:', staffIds);
      return;
    }

    const expoPushTokens = tokens.map((t) => t.token);
    await sendExpoPush(expoPushTokens, notification);
  } catch (error) {
    console.error('❌ Error sending push to staff:', error.message);
  }
}

/**
 * Send push notifications to staff by their staffType
 * @param {string} staffType - e.g. 'receptionist2', 'ophthalmologist', 'optometrist'
 * @param {object} notification - { title, body, data }
 * @param {string[]} [excludeStaffIds] - Staff IDs to exclude (e.g. the sender)
 */
async function sendToStaffType(staffType, notification, excludeStaffIds = []) {
  try {
    const whereClause = {
      isActive: true,
      staff: {
        staffType: staffType,
        isActive: true,
      },
    };

    if (excludeStaffIds.length > 0) {
      whereClause.staffId = { notIn: excludeStaffIds };
    }

    const tokens = await prisma.pushToken.findMany({
      where: whereClause,
      select: { token: true },
    });

    if (tokens.length === 0) {
      console.log(`📱 No push tokens found for staffType: ${staffType}`);
      return;
    }

    const expoPushTokens = tokens.map((t) => t.token);
    await sendExpoPush(expoPushTokens, notification);
  } catch (error) {
    console.error('❌ Error sending push to staffType:', error.message);
  }
}

/**
 * Send push notifications to multiple staff types
 * @param {string[]} staffTypes - Array of staff types
 * @param {object} notification - { title, body, data }
 * @param {string[]} [excludeStaffIds] - Staff IDs to exclude
 */
async function sendToMultipleStaffTypes(staffTypes, notification, excludeStaffIds = []) {
  try {
    const whereClause = {
      isActive: true,
      staff: {
        staffType: { in: staffTypes },
        isActive: true,
      },
    };

    if (excludeStaffIds.length > 0) {
      whereClause.staffId = { notIn: excludeStaffIds };
    }

    const tokens = await prisma.pushToken.findMany({
      where: whereClause,
      select: { token: true },
    });

    if (tokens.length === 0) return;

    const expoPushTokens = tokens.map((t) => t.token);
    await sendExpoPush(expoPushTokens, notification);
  } catch (error) {
    console.error('❌ Error sending push to multiple staffTypes:', error.message);
  }
}

/**
 * Core function to send push notifications via Expo Push API
 * Handles chunking (max 100 per request as per Expo docs)
 * @param {string[]} pushTokens - Array of Expo push tokens
 * @param {object} notification - { title, body, data }
 */
async function sendExpoPush(pushTokens, notification) {
  try {
    // Filter valid Expo push tokens
    const validTokens = pushTokens.filter(
      (token) => token && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
    );

    if (validTokens.length === 0) {
      console.log('📱 No valid Expo push tokens to send to');
      return;
    }

    // Build messages array
    const messages = validTokens.map((token) => ({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      priority: 'high',
      channelId: 'queue-updates', // Must match Android channel in the mobile app
    }));

    // Chunk into batches of 100 (Expo API limit)
    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    const fetch = require('node-fetch');

    for (const chunk of chunks) {
      const response = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      const result = await response.json();

      // Handle invalid/expired tokens
      if (result.data) {
        for (let i = 0; i < result.data.length; i++) {
          const ticket = result.data[i];
          if (ticket.status === 'error') {
            console.error(`❌ Push error for token: ${ticket.message}`);
            
            // Deactivate invalid tokens
            if (
              ticket.details?.error === 'DeviceNotRegistered' ||
              ticket.details?.error === 'InvalidCredentials'
            ) {
              await deactivateToken(chunk[i].to);
            }
          }
        }
      }

      console.log(`📱 Sent ${chunk.length} push notification(s)`);
    }
  } catch (error) {
    console.error('❌ Error sending Expo push:', error.message);
  }
}

/**
 * Deactivate a push token (device unregistered or token expired)
 */
async function deactivateToken(token) {
  try {
    await prisma.pushToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
    console.log(`🔕 Deactivated push token: ${token.substring(0, 30)}...`);
  } catch (error) {
    console.error('❌ Error deactivating token:', error.message);
  }
}

/**
 * Register a push token for a staff member
 */
async function registerToken(staffId, token, platform = 'android') {
  try {
    // Upsert - update if token exists, create if not
    const result = await prisma.pushToken.upsert({
      where: { token },
      update: {
        staffId,
        platform,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        staffId,
        token,
        platform,
        isActive: true,
      },
    });

    console.log(`📱 Registered push token for staff ${staffId}`);
    return result;
  } catch (error) {
    console.error('❌ Error registering push token:', error.message);
    throw error;
  }
}

/**
 * Unregister a push token
 */
async function unregisterToken(token) {
  try {
    await prisma.pushToken.updateMany({
      where: { token },
      data: { isActive: false },
    });
    console.log(`🔕 Unregistered push token`);
  } catch (error) {
    console.error('❌ Error unregistering push token:', error.message);
    throw error;
  }
}

/**
 * Remove all tokens for a staff member (on full logout)
 */
async function removeAllTokensForStaff(staffId) {
  try {
    const result = await prisma.pushToken.deleteMany({
      where: { staffId },
    });
    console.log(`🔕 Removed ${result.count} push token(s) for staff ${staffId}`);
    return result;
  } catch (error) {
    console.error('❌ Error removing tokens for staff:', error.message);
  }
}

module.exports = {
  sendToStaff,
  sendToStaffType,
  sendToMultipleStaffTypes,
  registerToken,
  unregisterToken,
  removeAllTokensForStaff,
  deactivateToken,
};
