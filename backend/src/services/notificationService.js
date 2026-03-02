/**
 * Notification Service
 * Handles all notification-related business logic including:
 * - Creating and broadcasting notifications
 * - Managing read receipts
 * - User notification preferences
 * - Socket.IO integration for real-time delivery
 */

const prisma = require('../utils/prisma');

// Notification types
const NOTIFICATION_TYPES = {
  SYSTEM: 'system',
  QUEUE: 'queue',
  EMERGENCY: 'emergency',
  APPOINTMENT: 'appointment',
  SURGERY: 'surgery',
  BILLING: 'billing',
  CUSTOM: 'custom'
};

// Priority levels
const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Recipient types
const RECIPIENT_TYPES = {
  ALL: 'all',
  STAFF_TYPE: 'staff_type',
  SPECIFIC_USER: 'specific_user',
  DEPARTMENT: 'department'
};

// Sound types
const SOUND_TYPES = {
  DEFAULT: 'default',
  URGENT: 'urgent',
  SUBTLE: 'subtle',
  CUSTOM: 'custom'
};

/**
 * Helper to get active audio for a notification type
 */
const getActiveAudioUrl = async (type) => {
  try {
    const audio = await prisma.notificationAudio.findFirst({
      where: {
        type,
        isActive: true,
        isDefault: true
      }
    });

    if (audio) {
      // Return full URL path
      return `/api/admin/notification-audios/${audio.filename}`;
    }
    return null;
  } catch (error) {
    console.error('Error fetching active audio:', error);
    return null;
  }
};

/**
 * Create a new notification and optionally broadcast it via Socket.IO
 */
const createNotification = async (notificationData, broadcastImmediately = true) => {
  try {
    // If playSound is true and no soundType is provided, try to find a custom audio for this type
    let customSoundUrl = null;
    if (notificationData.playSound !== false) {
      const audioType = notificationData.type;
      // Get custom audio URL if configured
      const audio = await prisma.notificationAudio.findFirst({
        where: {
          type: audioType,
          isActive: true,
          isDefault: true
        }
      });

      if (audio) {
        // Construct URL for the frontend to play
        // We'll use a direct static file path convention or an API route
        // For now, assuming standard verified uploads path
        // Use environment variable in production, but relative path works for static serve
        customSoundUrl = `/uploads/notifications/${audio.filename}`;
      }
    }

    const notification = await prisma.notification.create({
      data: {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || NOTIFICATION_TYPES.SYSTEM,
        priority: notificationData.priority || PRIORITY_LEVELS.NORMAL,
        recipientType: notificationData.recipientType || RECIPIENT_TYPES.ALL,
        targetStaffTypes: notificationData.targetStaffTypes || [],
        targetUserIds: notificationData.targetUserIds || [],
        targetDepartments: notificationData.targetDepartments || [],
        actionable: notificationData.actionable || false,
        actionType: notificationData.actionType,
        actionData: {
          ...(notificationData.actionData || {}),
          customSound: customSoundUrl // Inject the custom sound URL into actionData
        },
        playSound: notificationData.playSound !== false,
        soundType: customSoundUrl ? SOUND_TYPES.CUSTOM : (notificationData.soundType || SOUND_TYPES.DEFAULT),
        createdById: notificationData.createdById,
        createdByType: notificationData.createdByType,
        expiresAt: notificationData.expiresAt
      }
    });

    // Broadcast via Socket.IO if requested
    if (broadcastImmediately) {
      await broadcastNotification(notification);
    }

    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

/**
 * Broadcast a notification to appropriate socket rooms
 */
const broadcastNotification = async (notification) => {
  try {
    const { getIO } = require('../socket');
    const io = getIO();

    const rooms = getNotificationTargetRooms(notification);

    const notificationPayload = {
      ...notification,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
      expiresAt: notification.expiresAt?.toISOString()
    };

    rooms.forEach(room => {
      io.to(room).emit('notification:new', notificationPayload);
    });

    console.log(`📢 Broadcasted notification "${notification.title}" to rooms:`, rooms);
  } catch (error) {
    // Socket.IO might not be initialized yet, log but don't throw
    console.warn('⚠️ Could not broadcast notification:', error.message);
  }
};

/**
 * Determine which socket rooms should receive a notification
 */
const getNotificationTargetRooms = (notification) => {
  const rooms = [];

  switch (notification.recipientType) {
    case RECIPIENT_TYPES.ALL:
      rooms.push('notifications:all');
      rooms.push('notifications:super_admin');
      break;

    case RECIPIENT_TYPES.STAFF_TYPE:
      if (notification.targetStaffTypes && notification.targetStaffTypes.length > 0) {
        notification.targetStaffTypes.forEach(staffType => {
          rooms.push(`notifications:staff:${staffType}`);
        });
      }
      // Super admins always get staff-type notifications
      rooms.push('notifications:super_admin');
      break;

    case RECIPIENT_TYPES.SPECIFIC_USER:
      if (notification.targetUserIds && notification.targetUserIds.length > 0) {
        notification.targetUserIds.forEach(userId => {
          rooms.push(`notifications:user:${userId}`);
        });
      }
      break;

    case RECIPIENT_TYPES.DEPARTMENT:
      if (notification.targetDepartments && notification.targetDepartments.length > 0) {
        notification.targetDepartments.forEach(dept => {
          rooms.push(`notifications:department:${dept}`);
        });
      }
      // Super admins always get department notifications
      rooms.push('notifications:super_admin');
      break;

    default:
      rooms.push('notifications:all');
  }

  return rooms;
};

/**
 * Get notifications for a specific user
 */
const getNotificationsForUser = async (userId, userType, staffType = null, options = {}) => {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null
  } = options;

  const skip = (page - 1) * limit;

  // Build the where clause for notifications this user should see
  const whereConditions = [
    { isActive: true },
    {
      OR: [
        // Notifications for everyone
        { recipientType: RECIPIENT_TYPES.ALL },
        // Specific user notifications
        {
          recipientType: RECIPIENT_TYPES.SPECIFIC_USER,
          targetUserIds: { has: userId }
        }
      ]
    }
  ];

  // Add staff type targeting for staff users
  if (userType === 'staff' && staffType) {
    whereConditions[1].OR.push({
      recipientType: RECIPIENT_TYPES.STAFF_TYPE,
      targetStaffTypes: { has: staffType }
    });
  }

  // Super admins see all notifications
  if (userType === 'super_admin') {
    whereConditions[1] = {}; // Remove targeting filter for super admins
  }

  // Filter by type if specified
  if (type) {
    whereConditions.push({ type });
  }

  // Filter out expired notifications
  whereConditions.push({
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ]
  });

  // Get notifications with read status
  const notifications = await prisma.notification.findMany({
    where: { AND: whereConditions },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
    include: {
      readReceipts: {
        where: {
          userId,
          userType
        },
        select: {
          readAt: true
        }
      }
    }
  });

  // Transform to include read status
  const transformedNotifications = notifications.map(notif => ({
    ...notif,
    isRead: notif.readReceipts.length > 0,
    readAt: notif.readReceipts[0]?.readAt || null,
    readReceipts: undefined
  }));

  // Apply unread filter after fetching (to maintain correct pagination)
  const filteredNotifications = unreadOnly
    ? transformedNotifications.filter(n => !n.isRead)
    : transformedNotifications;

  // Get total count
  const totalCount = await prisma.notification.count({
    where: { AND: whereConditions }
  });

  return {
    notifications: filteredNotifications,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

/**
 * Get unread notification count for a user
 */
const getUnreadCount = async (userId, userType, staffType = null) => {
  // Get all notifications for this user
  const result = await getNotificationsForUser(userId, userType, staffType, {
    limit: 1000,
    unreadOnly: true
  });

  return result.notifications.length;
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (notificationId, userId, userType) => {
  try {
    await prisma.notificationReadReceipt.upsert({
      where: {
        notificationId_userId_userType: {
          notificationId,
          userId,
          userType
        }
      },
      create: {
        notificationId,
        userId,
        userType
      },
      update: {
        readAt: new Date()
      }
    });

    return true;
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId, userType, staffType = null) => {
  try {
    // Get all unread notifications for this user
    const { notifications } = await getNotificationsForUser(userId, userType, staffType, {
      limit: 1000,
      unreadOnly: true
    });

    // Create read receipts for all
    const createPromises = notifications.map(notif =>
      prisma.notificationReadReceipt.upsert({
        where: {
          notificationId_userId_userType: {
            notificationId: notif.id,
            userId,
            userType
          }
        },
        create: {
          notificationId: notif.id,
          userId,
          userType
        },
        update: {
          readAt: new Date()
        }
      })
    );

    await Promise.all(createPromises);

    return { markedCount: notifications.length };
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete a notification (admin only)
 */
const deleteNotification = async (notificationId) => {
  try {
    // Soft delete by setting isActive to false
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isActive: false }
    });

    // Notify connected clients about deletion
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      io.emit('notification:deleted', { notificationId });
    } catch (e) {
      console.warn('⚠️ Could not broadcast notification deletion');
    }

    return true;
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    throw error;
  }
};

/**
 * Get user notification preferences
 */
const getPreferences = async (userId, userType) => {
  let preferences = await prisma.notificationPreference.findUnique({
    where: {
      userId_userType: { userId, userType }
    }
  });

  // Return defaults if no preferences exist
  if (!preferences) {
    preferences = {
      userId,
      userType,
      enableSound: true,
      enablePush: true,
      enableEmail: false,
      mutedTypes: [],
      mutedPriorities: []
    };
  }

  return preferences;
};

/**
 * Update user notification preferences
 */
const updatePreferences = async (userId, userType, preferencesData) => {
  const preferences = await prisma.notificationPreference.upsert({
    where: {
      userId_userType: { userId, userType }
    },
    create: {
      userId,
      userType,
      enableSound: preferencesData.enableSound ?? true,
      enablePush: preferencesData.enablePush ?? true,
      enableEmail: preferencesData.enableEmail ?? false,
      mutedTypes: preferencesData.mutedTypes || [],
      mutedPriorities: preferencesData.mutedPriorities || []
    },
    update: {
      enableSound: preferencesData.enableSound,
      enablePush: preferencesData.enablePush,
      enableEmail: preferencesData.enableEmail,
      mutedTypes: preferencesData.mutedTypes,
      mutedPriorities: preferencesData.mutedPriorities
    }
  });

  return preferences;
};

/**
 * Get all notifications (admin only)
 */
const getAllNotifications = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    type = null,
    priority = null,
    includeInactive = false
  } = options;

  const skip = (page - 1) * limit;

  const where = {};

  if (!includeInactive) {
    where.isActive = true;
  }

  if (type) {
    where.type = type;
  }

  if (priority) {
    where.priority = priority;
  }

  const [notifications, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: {
          select: { readReceipts: true }
        }
      }
    }),
    prisma.notification.count({ where })
  ]);

  return {
    notifications: notifications.map(n => ({
      ...n,
      readCount: n._count.readReceipts,
      _count: undefined
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

/**
 * Get notification statistics (admin only)
 */
const getNotificationStatistics = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalCount,
    todayCount,
    byType,
    byPriority,
    totalReadReceipts
  ] = await Promise.all([
    prisma.notification.count({ where: { isActive: true } }),
    prisma.notification.count({
      where: {
        isActive: true,
        createdAt: { gte: today }
      }
    }),
    prisma.notification.groupBy({
      by: ['type'],
      where: { isActive: true },
      _count: true
    }),
    prisma.notification.groupBy({
      by: ['priority'],
      where: { isActive: true },
      _count: true
    }),
    prisma.notificationReadReceipt.count()
  ]);

  return {
    total: totalCount,
    today: todayCount,
    totalReadReceipts,
    byType: byType.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {}),
    byPriority: byPriority.reduce((acc, item) => {
      acc[item.priority] = item._count;
      return acc;
    }, {})
  };
};

/**
 * Create system notification helper
 */
const createSystemNotification = async (title, message, options = {}) => {
  return createNotification({
    title,
    message,
    type: NOTIFICATION_TYPES.SYSTEM,
    priority: options.priority || PRIORITY_LEVELS.NORMAL,
    recipientType: options.recipientType || RECIPIENT_TYPES.ALL,
    targetStaffTypes: options.targetStaffTypes,
    targetUserIds: options.targetUserIds,
    createdByType: 'system',
    ...options
  });
};

/**
 * Create emergency notification helper
 */
const createEmergencyNotification = async (title, message, options = {}) => {
  return createNotification({
    title,
    message,
    type: NOTIFICATION_TYPES.EMERGENCY,
    priority: PRIORITY_LEVELS.CRITICAL,
    recipientType: options.recipientType || RECIPIENT_TYPES.ALL,
    targetStaffTypes: options.targetStaffTypes,
    soundType: SOUND_TYPES.URGENT,
    createdByType: options.createdByType || 'system',
    createdById: options.createdById,
    ...options
  });
};

/**
 * Create queue notification helper
 */
const createQueueNotification = async (title, message, targetStaffTypes, options = {}) => {
  return createNotification({
    title,
    message,
    type: NOTIFICATION_TYPES.QUEUE,
    priority: options.priority || PRIORITY_LEVELS.NORMAL,
    recipientType: RECIPIENT_TYPES.STAFF_TYPE,
    targetStaffTypes,
    createdByType: 'system',
    ...options
  });
};

/**
 * Create priority notification (Doctor/Optometrist only)
 */
const createPriorityNotification = async (title, message, patientVisitId, options = {}) => {
  try {
    // Find the concerned doctor/optometrist from the visit
    const visit = await prisma.patientVisit.findUnique({
      where: { id: patientVisitId },
      include: {
        doctor: true,
        optometristExamination: {
          include: { optometrist: true }
        }
      }
    });

    const targetUserIds = [];

    if (visit?.doctorId) {
      targetUserIds.push(visit.doctorId);
    }

    // Also notify if there's an optometrist involved and it's relevant
    if (visit?.optometristExamination?.optometristId) {
      targetUserIds.push(visit.optometristExamination.optometristId);
    }

    return createNotification({
      title,
      message,
      type: NOTIFICATION_TYPES.APPOINTMENT, // Or custom type 'priority'
      priority: PRIORITY_LEVELS.HIGH,
      recipientType: targetUserIds.length > 0 ? RECIPIENT_TYPES.SPECIFIC_USER : RECIPIENT_TYPES.STAFF_TYPE,
      targetUserIds: targetUserIds,
      targetStaffTypes: targetUserIds.length === 0 ? ['doctor', 'optometrist'] : [], // Fallback if no specific doctor found
      soundType: SOUND_TYPES.URGENT,
      createdByType: 'system',
      ...options
    });
  } catch (error) {
    console.error('Error creating priority notification:', error);
    // Fallback to notifying all doctors if something goes wrong
    return createNotification({
      title,
      message,
      type: NOTIFICATION_TYPES.APPOINTMENT,
      priority: PRIORITY_LEVELS.HIGH,
      recipientType: RECIPIENT_TYPES.STAFF_TYPE,
      targetStaffTypes: ['doctor'],
      createdByType: 'system',
      ...options
    });
  }
};

/**
 * Create dilation observation notification (Doctor & Sister)
 */
const createDilationNotification = async (title, message, patientQueueId, options = {}) => {
  try {
    // Find the concerned doctor and assigned sister
    const queue = await prisma.patientQueue.findUnique({
      where: { id: patientQueueId },
      include: {
        patientVisit: {
          include: { doctor: true }
        },
        assignedStaff: true // This might be the sister or staff who put them in queue
      }
    });

    const targetUserIds = [];

    // 1. Concerned Doctor
    if (queue?.patientVisit?.doctorId) {
      targetUserIds.push(queue.patientVisit.doctorId);
    }

    // 2. Assigned Staff (Sister/Nurse) who might be monitoring
    if (queue?.assignedStaffId) {
      targetUserIds.push(queue.assignedStaffId);
    }

    return createNotification({
      title,
      message,
      type: 'observation', // Custom type
      priority: PRIORITY_LEVELS.NORMAL,
      recipientType: targetUserIds.length > 0 ? RECIPIENT_TYPES.SPECIFIC_USER : RECIPIENT_TYPES.STAFF_TYPE,
      targetUserIds: targetUserIds,
      // Fallback: Notify doctors and nurses if specific users not found
      targetStaffTypes: targetUserIds.length === 0 ? ['doctor', 'nurse', 'sister'] : [],
      createdByType: 'system',
      ...options
    });
  } catch (error) {
    console.error('Error creating dilation notification:', error);
    return createNotification({
      title,
      message,
      type: 'observation',
      recipientType: RECIPIENT_TYPES.STAFF_TYPE,
      targetStaffTypes: ['doctor', 'nurse'],
      createdByType: 'system',
      ...options
    });
  }
};

module.exports = {
  // Core functions
  createNotification,
  broadcastNotification,
  getActiveAudioUrl,
  getNotificationTargetRooms,
  getNotificationsForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,

  // Preferences
  getPreferences,
  updatePreferences,

  // Admin functions
  getAllNotifications,
  getNotificationStatistics,

  // Helper functions
  createSystemNotification,
  createEmergencyNotification,
  createQueueNotification,
  createPriorityNotification,
  createDilationNotification,

  // Constants
  NOTIFICATION_TYPES,
  PRIORITY_LEVELS,
  RECIPIENT_TYPES,
  SOUND_TYPES
};
