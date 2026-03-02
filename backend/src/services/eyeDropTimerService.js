/**
 * Eye Drop Timer Service
 * Manages 30-minute observation timers for patients with eye drops
 */

const prisma = require('../utils/prisma');

// Store active timers in memory
const activeTimers = new Map();

/**
 * Start a 30-minute timer for a patient after eye drops are applied
 * @param {string} queueEntryId - Queue entry ID
 * @param {Date} dropsAppliedAt - When drops were applied
 */
const startEyeDropTimer = (queueEntryId, dropsAppliedAt) => {
  // Clear any existing timer for this patient
  if (activeTimers.has(queueEntryId)) {
    clearTimeout(activeTimers.get(queueEntryId));
    console.log(`⏱️ Cleared existing timer for queue entry: ${queueEntryId}`);
  }

  // Calculate time until 30 minutes from drops applied
  const now = new Date();
  const expectedResumeTime = new Date(dropsAppliedAt.getTime() + (30 * 60 * 1000)); // 30 minutes
  const timeUntilReady = expectedResumeTime.getTime() - now.getTime();

  console.log(`⏱️ Starting 30-minute timer for queue entry: ${queueEntryId}`);
  console.log(`   Drops applied at: ${dropsAppliedAt.toLocaleTimeString()}`);
  console.log(`   Will be ready at: ${expectedResumeTime.toLocaleTimeString()}`);
  console.log(`   Time remaining: ${Math.round(timeUntilReady / 1000 / 60)} minutes`);

  // If time has already passed, mark as ready immediately
  if (timeUntilReady <= 0) {
    console.log(`⏱️ Timer already expired, marking as ready immediately`);
    markPatientReadyForResume(queueEntryId);
    return;
  }

  // Set timer to mark patient as ready after 30 minutes
  const timerId = setTimeout(async () => {
    console.log(`⏱️ 30-minute timer completed for queue entry: ${queueEntryId}`);
    await markPatientReadyForResume(queueEntryId);
    activeTimers.delete(queueEntryId);
  }, timeUntilReady);

  // Store timer reference
  activeTimers.set(queueEntryId, timerId);
};

/**
 * Mark patient as ready to resume after 30-minute observation
 * @param {string} queueEntryId - Queue entry ID
 */
const markPatientReadyForResume = async (queueEntryId) => {
  try {
    console.log(`✅ Marking patient ready for resume: ${queueEntryId}`);

    // Get queue entry details
    const queueEntry = await prisma.patientQueue.findUnique({
      where: { id: queueEntryId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        assignedDoctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!queueEntry) {
      console.error(`❌ Queue entry not found: ${queueEntryId}`);
      return;
    }

    // Only update if still ON_HOLD
    if (queueEntry.status !== 'ON_HOLD') {
      console.log(`⚠️ Patient status is ${queueEntry.status}, not ON_HOLD. Skipping update.`);
      return;
    }

    // Update status to indicate ready for resume
    await prisma.patientQueue.update({
      where: { id: queueEntryId },
      data: {
        holdReason: `Eye drops completed - Ready to resume (30 min observation complete)`,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Patient ${queueEntry.patient.firstName} ${queueEntry.patient.lastName} is ready for resume`);

    // Emit WebSocket event to notify doctor and receptionist2
    const { emitPatientReadyForResume } = require('../socket/channels/queueChannel');
    emitPatientReadyForResume({
      queueEntryId: queueEntry.id,
      patientId: queueEntry.patient.id,
      patientName: `${queueEntry.patient.firstName} ${queueEntry.patient.lastName}`,
      doctorId: queueEntry.assignedDoctorId,
      status: 'READY_FOR_RESUME',
      message: '30-minute observation complete - Patient ready for examination',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Error marking patient ready for resume:`, error);
  }
};

/**
 * Cancel timer for a queue entry (e.g., if patient is manually resumed early)
 * @param {string} queueEntryId - Queue entry ID
 */
const cancelEyeDropTimer = (queueEntryId) => {
  if (activeTimers.has(queueEntryId)) {
    clearTimeout(activeTimers.get(queueEntryId));
    activeTimers.delete(queueEntryId);
    console.log(`⏱️ Cancelled timer for queue entry: ${queueEntryId}`);
  }
};

/**
 * Restore timers on server restart
 * Checks database for patients with active eye drop timers
 */
const restoreActiveTimers = async () => {
  try {
    console.log(`🔄 Restoring active eye drop timers...`);

    // Find all patients currently ON_HOLD with estimated resume times
    const onHoldPatients = await prisma.patientQueue.findMany({
      where: {
        status: 'ON_HOLD',
        estimatedResumeTime: {
          not: null
        }
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log(`   Found ${onHoldPatients.length} patients with active timers`);

    // Restore timer for each patient
    for (const queueEntry of onHoldPatients) {
      const dropsAppliedAt = new Date(queueEntry.estimatedResumeTime.getTime() - (30 * 60 * 1000));
      startEyeDropTimer(queueEntry.id, dropsAppliedAt);
      console.log(`   ✅ Restored timer for ${queueEntry.patient.firstName} ${queueEntry.patient.lastName}`);
    }

    console.log(`✅ Timer restoration complete`);
  } catch (error) {
    console.error(`❌ Error restoring timers:`, error);
  }
};

/**
 * Get active timer info for a queue entry
 * @param {string} queueEntryId - Queue entry ID
 * @returns {Object|null} Timer info or null if no active timer
 */
const getTimerInfo = (queueEntryId) => {
  if (!activeTimers.has(queueEntryId)) {
    return null;
  }

  return {
    queueEntryId,
    hasActiveTimer: true,
    timerId: activeTimers.get(queueEntryId)
  };
};

/**
 * Get count of active timers
 * @returns {number} Number of active timers
 */
const getActiveTimerCount = () => {
  return activeTimers.size;
};

module.exports = {
  startEyeDropTimer,
  cancelEyeDropTimer,
  markPatientReadyForResume,
  restoreActiveTimers,
  getTimerInfo,
  getActiveTimerCount
};
