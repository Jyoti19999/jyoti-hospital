// src/services/scheduledTasks.js
const cron = require('node-cron');
const equipmentService = require('./equipmentService');
const prisma = require('../utils/prisma');
const notificationService = require('./notificationService');

class ScheduledTasksService {
  constructor() {
    this.tasks = [];
  }

  // Initialize all scheduled tasks
  initializeTasks() {
    console.log('🕐 Initializing scheduled tasks...');

    // Daily stock sync at midnight (00:01 AM) - BACKUP ONLY
    // Primary sync is handled by Prisma Middleware in real-time
    const dailyStockSync = cron.schedule('1 0 * * *', async () => {
      console.log('⏰ Running daily backup stock sync task...');
      console.log('ℹ️  Note: This is a backup sync. Real-time sync is handled by Prisma Middleware.');
      try {
        const result = await equipmentService.syncAllMedicinesToRegisters();
        if (result.success) {
          console.log(`✅ Daily backup sync completed: ${result.synced} medicines synced`);
        } else {
          console.error(`❌ Daily backup sync failed: ${result.error}`);
        }
      } catch (error) {
        console.error('❌ Error in daily backup sync task:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata" // Adjust to your timezone
    });

    this.tasks.push({ name: 'Daily Backup Stock Sync', task: dailyStockSync });

    // Check for expired dilation timers every 10 seconds
    const checkExpiredDilationTimers = cron.schedule('*/10 * * * * *', async () => {
      // console.log('⏰ Checking for expired dilation timers...');
      try {
        const now = new Date();

        // Find patients whose dilation timer has expired and haven't been notified yet
        const expiredDilations = await prisma.patientQueue.findMany({
          where: {
            queueFor: 'OPHTHALMOLOGIST',
            status: 'ON_HOLD',
            estimatedResumeTime: {
              lte: now
            },
            alarmPlayed: false
          },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                patientNumber: true
              }
            }
          }
        });

        if (expiredDilations.length > 0) {
          console.log(`🔔 Found ${expiredDilations.length} expired dilation timers. Sending notifications...`);

          for (const record of expiredDilations) {
            const patientName = `${record.patient.firstName} ${record.patient.lastName}`;

            // 1. Create and send notification
            // We use a special 'custom' sound type to trigger the specific alarm sound on frontend
            await notificationService.createNotification({
              title: `Eye Drop Timer Expired: ${patientName}`,
              message: `Timer finished for ${patientName}. Patient is ready for examination.`,
              type: 'queue',
              priority: 'high',
              recipientType: 'staff_type',
              targetStaffTypes: ['receptionist2', 'nurse', 'sister'], // Targeted staff
              playSound: true,
              soundType: 'custom', // Special flag for frontend to play /alarm.mp3
              actionable: true,
              actionType: 'navigate',
              actionData: {
                url: '/sister/dashboard',
                patientId: record.patientId,
                queueEntryId: record.id,
                customSound: '/alarm.mp3'
              },
              createdByType: 'system'
            });

            // 2. Mark alarm as played to prevent repeat notifications
            await prisma.patientQueue.update({
              where: { id: record.id },
              data: {
                alarmPlayed: true,
                alarmPlayedAt: new Date()
              }
            });

            console.log(`✅ Sent expiration notification for patient ${patientName}`);
          }
        }
      } catch (error) {
        console.error('❌ Error checking expired dilation timers:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.tasks.push({ name: 'Check Expired Dilation Timers', task: checkExpiredDilationTimers });

    // Delete completed ophthalmologist queue records every 3 days at 2:00 AM
    const cleanupCompletedQueue = cron.schedule('0 2 */3 * *', async () => {
      console.log('⏰ Running cleanup task for ALL patient queue records...');
      try {
        // Get all queue records with their visit and appointment info
        const allQueueRecords = await prisma.patientQueue.findMany({
          select: {
            id: true,
            patientVisitId: true,
            queueFor: true,
            status: true,
            patientVisit: {
              select: {
                id: true,
                appointmentId: true,
                status: true
              }
            }
          }
        });

        if (allQueueRecords.length === 0) {
          console.log('✅ No queue records found to delete');
          return;
        }

        // Separate records by queue type
        const ophthalmologistRecords = allQueueRecords.filter(record => record.queueFor === 'OPHTHALMOLOGIST');
        const optometristRecords = allQueueRecords.filter(record => record.queueFor === 'OPTOMETRIST');

        let ophthalmologistCount = 0, optometristCount = 0;

        // Process OPHTHALMOLOGIST queues - Update to PARTIALLY_COMPLETED
        if (ophthalmologistRecords.length > 0) {
          const ophVisitIds = ophthalmologistRecords.map(r => r.patientVisitId);
          
          await prisma.patientVisit.updateMany({
            where: { id: { in: ophVisitIds } },
            data: { status: 'PARTIALLY_COMPLETED' }
          });

          const ophAppointmentIds = await prisma.patientVisit.findMany({
            where: { id: { in: ophVisitIds } },
            select: { appointmentId: true }
          });
          
          const appointmentIdsToUpdate = ophAppointmentIds.map(v => v.appointmentId);
          
          await prisma.appointment.updateMany({
            where: { id: { in: appointmentIdsToUpdate } },
            data: { status: 'PARTIALLY_COMPLETED', isActive: false }
          });

          ophthalmologistCount = ophthalmologistRecords.length;
        }

        // Process OPTOMETRIST queues - Update to PARTIALLY_COMPLETED (patient started visit but didn't complete)
        if (optometristRecords.length > 0) {
          const optVisitIds = optometristRecords.map(r => r.patientVisitId);
          
          await prisma.patientVisit.updateMany({
            where: { id: { in: optVisitIds } },
            data: { status: 'PARTIALLY_COMPLETED' }
          });

          const optAppointmentIds = await prisma.patientVisit.findMany({
            where: { id: { in: optVisitIds } },
            select: { appointmentId: true }
          });
          
          const appointmentIdsToUpdate = optAppointmentIds.map(v => v.appointmentId);
          
          await prisma.appointment.updateMany({
            where: { id: { in: appointmentIdsToUpdate } },
            data: { status: 'PARTIALLY_COMPLETED', isActive: false }
          });

          optometristCount = optometristRecords.length;
        }

        // Delete ALL queue records
        const result = await prisma.patientQueue.deleteMany({});

        console.log(`✅ Cleanup completed: ${result.count} queue records deleted (${ophthalmologistCount} OPHTHALMOLOGIST → PARTIALLY_COMPLETED, ${optometristCount} OPTOMETRIST → PARTIALLY_COMPLETED)`);
      } catch (error) {
        console.error('❌ Error in cleanup queue task:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata" // Adjust to your timezone
    });

    this.tasks.push({ name: 'Cleanup ALL Queue Records', task: cleanupCompletedQueue });

    // Mark old incomplete queue records as DISCONTINUED/PARTIALLY_COMPLETED and cleanup - runs daily at 12:02 AM
    const discontinueOldQueueRecords = cron.schedule('2 0 * * *', async () => {
      console.log('⏰ Running daily cleanup task for ALL queue records...');
      try {
        // Get all queue records with their visit and appointment info
        const allQueueRecords = await prisma.patientQueue.findMany({
          select: {
            id: true,
            patientVisitId: true,
            queueFor: true,
            status: true,
            patientVisit: {
              select: {
                id: true,
                appointmentId: true,
                status: true
              }
            }
          }
        });

        console.log(`📋 Found ${allQueueRecords.length} total queue records to process`);

        if (allQueueRecords.length === 0) {
          console.log('✅ No queue records found. Daily cleanup task completed.');
          return;
        }

        // Separate records by queue type
        const ophthalmologistRecords = allQueueRecords.filter(record => record.queueFor === 'OPHTHALMOLOGIST');
        const optometristRecords = allQueueRecords.filter(record => record.queueFor === 'OPTOMETRIST');

        let partiallyCompleted = 0, discontinued = 0;

        console.log(`📊 Processing: ${ophthalmologistRecords.length} OPHTHALMOLOGIST, ${optometristRecords.length} OPTOMETRIST records`);

        // Process OPHTHALMOLOGIST queues - Update to PARTIALLY_COMPLETED
        if (ophthalmologistRecords.length > 0) {
          const ophVisitIds = ophthalmologistRecords.map(r => r.patientVisitId);
          
          // Update PatientVisits to PARTIALLY_COMPLETED
          const visitUpdateResult = await prisma.patientVisit.updateMany({
            where: { id: { in: ophVisitIds } },
            data: { status: 'PARTIALLY_COMPLETED' }
          });
          console.log(`✅ Marked ${visitUpdateResult.count} OPHTHALMOLOGIST visits as PARTIALLY_COMPLETED`);

          // Update Appointment status to PARTIALLY_COMPLETED
          const ophAppointmentIds = await prisma.patientVisit.findMany({
            where: { id: { in: ophVisitIds } },
            select: { appointmentId: true }
          });
          const appointmentIdsToUpdate = ophAppointmentIds.map(v => v.appointmentId);

          const appointmentUpdateResult = await prisma.appointment.updateMany({
            where: { id: { in: appointmentIdsToUpdate } },
            data: { status: 'PARTIALLY_COMPLETED', isActive: false }
          });
          console.log(`✅ Marked ${appointmentUpdateResult.count} OPHTHALMOLOGIST appointments as PARTIALLY_COMPLETED (isActive: false, can resume or rebook)`);

          partiallyCompleted = ophthalmologistRecords.length;
        }

        // Process OPTOMETRIST queues - Update to PARTIALLY_COMPLETED (patient started visit but didn't complete)
        if (optometristRecords.length > 0) {
          const optVisitIds = optometristRecords.map(r => r.patientVisitId);
          
          // Update PatientVisits to PARTIALLY_COMPLETED
          const visitUpdateResult = await prisma.patientVisit.updateMany({
            where: { id: { in: optVisitIds } },
            data: { status: 'PARTIALLY_COMPLETED' }
          });
          console.log(`✅ Marked ${visitUpdateResult.count} OPTOMETRIST visits as PARTIALLY_COMPLETED`);

          // Update Appointment status to PARTIALLY_COMPLETED
          const optAppointmentIds = await prisma.patientVisit.findMany({
            where: { id: { in: optVisitIds } },
            select: { appointmentId: true }
          });
          const appointmentIdsToUpdate = optAppointmentIds.map(v => v.appointmentId);

          const appointmentUpdateResult = await prisma.appointment.updateMany({
            where: { id: { in: appointmentIdsToUpdate } },
            data: { status: 'PARTIALLY_COMPLETED', isActive: false }
          });
          console.log(`✅ Marked ${appointmentUpdateResult.count} OPTOMETRIST appointments as PARTIALLY_COMPLETED`);

          discontinued = optometristRecords.length;
        }

        // Delete ALL queue records
        const deleteResult = await prisma.patientQueue.deleteMany({});

        console.log(`🎉 Daily cleanup completed successfully:
          - ${partiallyCompleted} OPHTHALMOLOGIST patients marked as PARTIALLY_COMPLETED (removed from queue)
          - ${discontinued} OPTOMETRIST patients marked as PARTIALLY_COMPLETED (removed from queue)
          - ${deleteResult.count} total queue records deleted`);

      } catch (error) {
        console.error('❌ Error in daily discontinue queue records task:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.tasks.push({ name: 'Daily Cleanup ALL Queue Records', task: discontinueOldQueueRecords });

    // ─── Appointment Lifecycle Correction (Hourly) ───
    // Step 1: SCHEDULED (past date, never checked in) → NO_SHOW, isActive: false
    // Step 2: CHECKED_IN (past date, no consult) → PARTIALLY_COMPLETED, isActive: false
    // Step 3: PARTIALLY_COMPLETED (7+ days old) → DISCONTINUED, isActive: false
    // Step 4: Orphan PARTIALLY_COMPLETED (patient has newer appointment) → DISCONTINUED
    // Step 5: SCHEDULED (today/future) with isActive: false → isActive: true
    // All date comparisons use IST calendar date, NOT 24-hour windows
    const appointmentLifecycleCorrection = cron.schedule('0 * * * *', async () => {
      console.log('⏰ Running appointment lifecycle correction task...');
      try {
        await this._runAppointmentLifecycleCorrection();
      } catch (error) {
        console.error('❌ Error in appointment lifecycle correction task:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.tasks.push({ name: 'Appointment Lifecycle Correction (Hourly)', task: appointmentLifecycleCorrection });

    // ==========================================
    // APPOINTMENT-VISIT STATUS SYNC (Every 6 hours at minute 15)
    // ==========================================
    // Purpose: Fix data integrity issues where Appointment.status is out of sync with PatientVisit.status
    // Schedule: Every 6 hours (00:15, 06:15, 12:15, 18:15 IST)
    const appointmentVisitStatusSync = cron.schedule('15 */6 * * *', async () => {
      try {
        await this._runAppointmentVisitStatusSync();
      } catch (error) {
        console.error('❌ Error in appointment-visit status sync task:', error);
      }
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    this.tasks.push({ name: 'Appointment-Visit Status Sync (Every 6 hours)', task: appointmentVisitStatusSync });

    // REMOVED: Twice daily sync (redundant with middleware)
    // If you want to disable the backup sync entirely, comment out the above cron job

  }

  // Stop all scheduled tasks synxhronously
  stopAllTasks() {
    console.log('🛑 Stopping all scheduled tasks...');
    this.tasks.forEach(({ name, task }) => {
      task.stop();
      console.log(`✅ Stopped: ${name}`);
    });
  }

  // Get status of all tasks
  getTasksStatus() {
    return this.tasks.map(({ name, task }) => ({
      name,
      running: task.running || false
    }));
  }

  // Manual trigger for testing
  async triggerDailySync() {
    console.log('🔧 Manually triggering daily stock sync...');
    try {
      const result = await equipmentService.syncAllMedicinesToRegisters();
      return result;
    } catch (error) {
      console.error('❌ Error in manual sync trigger:', error);
      throw error;
    }
  }

  // Manual trigger for cleanup - DELETE ALL QUEUE RECORDS
  async triggerCleanupCompletedQueue() {
    console.log('🔧 Manually triggering cleanup of ALL patient queue records...');
    try {
      // Step 1: Get all queue records with their visit and appointment info
      const allQueueRecords = await prisma.patientQueue.findMany({
        select: {
          id: true,
          patientVisitId: true,
          queueFor: true,
          status: true,
          patientVisit: {
            select: {
              id: true,
              appointmentId: true,
              status: true
            }
          }
        }
      });

      console.log(`📋 Found ${allQueueRecords.length} total queue records to process`);

      if (allQueueRecords.length === 0) {
        return {
          success: true,
          deletedCount: 0,
          ophthalmologistUpdated: 0,
          optometristUpdated: 0,
          message: 'No queue records found to delete'
        };
      }

      // Step 2: Separate records by queue type
      const ophthalmologistRecords = allQueueRecords.filter(record => record.queueFor === 'OPHTHALMOLOGIST');
      const optometristRecords = allQueueRecords.filter(record => record.queueFor === 'OPTOMETRIST');

      let ophthalmologistCount = 0, optometristCount = 0;

      // Step 3: Process OPHTHALMOLOGIST queues - Update to PARTIALLY_COMPLETED
      if (ophthalmologistRecords.length > 0) {
        const ophVisitIds = ophthalmologistRecords.map(r => r.patientVisitId);
        
        // Update PatientVisits to PARTIALLY_COMPLETED
        await prisma.patientVisit.updateMany({
          where: { id: { in: ophVisitIds } },
          data: { status: 'PARTIALLY_COMPLETED' }
        });

        // Get appointment IDs and update them
        const ophAppointmentIds = await prisma.patientVisit.findMany({
          where: { id: { in: ophVisitIds } },
          select: { appointmentId: true }
        });
        
        const appointmentIdsToUpdate = ophAppointmentIds.map(v => v.appointmentId);
        
        await prisma.appointment.updateMany({
          where: { id: { in: appointmentIdsToUpdate } },
          data: { status: 'PARTIALLY_COMPLETED', isActive: false }
        });

        ophthalmologistCount = ophthalmologistRecords.length;
        console.log(`✅ Updated ${ophthalmologistCount} OPHTHALMOLOGIST visits to PARTIALLY_COMPLETED (isActive: false, can resume or rebook)`);
      }

      // Step 4: Process OPTOMETRIST queues - Update to PARTIALLY_COMPLETED (patient started visit but didn't complete)
      if (optometristRecords.length > 0) {
        const optVisitIds = optometristRecords.map(r => r.patientVisitId);
        
        // Update PatientVisits to PARTIALLY_COMPLETED
        await prisma.patientVisit.updateMany({
          where: { id: { in: optVisitIds } },
          data: { status: 'PARTIALLY_COMPLETED' }
        });

        // Get appointment IDs and update them
        const optAppointmentIds = await prisma.patientVisit.findMany({
          where: { id: { in: optVisitIds } },
          select: { appointmentId: true }
        });
        
        const appointmentIdsToUpdate = optAppointmentIds.map(v => v.appointmentId);
        
        await prisma.appointment.updateMany({
          where: { id: { in: appointmentIdsToUpdate } },
          data: { status: 'PARTIALLY_COMPLETED', isActive: false }
        });

        optometristCount = optometristRecords.length;
        console.log(`✅ Updated ${optometristCount} OPTOMETRIST visits to PARTIALLY_COMPLETED (isActive: false, can resume or rebook)`);
      }

      // Step 5: Delete ALL queue records
      const deleteResult = await prisma.patientQueue.deleteMany({});

      console.log(`🎉 Cleanup completed successfully:
        - ${ophthalmologistCount} OPHTHALMOLOGIST queue records → visits marked as PARTIALLY_COMPLETED
        - ${optometristCount} OPTOMETRIST queue records → visits marked as PARTIALLY_COMPLETED  
        - ${deleteResult.count} total queue records deleted`);

      return {
        success: true,
        deletedCount: deleteResult.count,
        ophthalmologistUpdated: ophthalmologistCount,
        optometristUpdated: optometristCount,
        message: `Successfully deleted ${deleteResult.count} queue records and updated corresponding visits/appointments`
      };
    } catch (error) {
      console.error('❌ Error in manual cleanup trigger:', error);
      throw error;
    }
  }

  // Manual trigger for discontinuing ALL queue records (updated to match cleanup logic)
  async triggerDiscontinueOldQueueRecords() {
    console.log('🔧 Manually triggering discontinue ALL queue records task...');
    try {
      // Step 1: Get all queue records with their visit and appointment info
      const allQueueRecords = await prisma.patientQueue.findMany({
        select: {
          id: true,
          patientVisitId: true,
          queueFor: true,
          status: true,
          patientVisit: {
            select: {
              id: true,
              appointmentId: true,
              status: true
            }
          }
        }
      });

      console.log(`📋 Found ${allQueueRecords.length} total queue records to process`);

      if (allQueueRecords.length === 0) {
        return {
          success: true,
          partiallyCompletedCount: 0,
          discontinuedCount: 0,
          recordsDeleted: 0,
          message: 'No queue records found'
        };
      }

      // Step 2: Separate records by queue type
      const ophthalmologistRecords = allQueueRecords.filter(record => record.queueFor === 'OPHTHALMOLOGIST');
      const optometristRecords = allQueueRecords.filter(record => record.queueFor === 'OPTOMETRIST');

      let partialCount = 0, discontinuedCount = 0;

      // Step 3: Process OPHTHALMOLOGIST queues - Update to PARTIALLY_COMPLETED
      if (ophthalmologistRecords.length > 0) {
        const ophVisitIds = ophthalmologistRecords.map(r => r.patientVisitId);
        
        // Update PatientVisits to PARTIALLY_COMPLETED
        await prisma.patientVisit.updateMany({
          where: { id: { in: ophVisitIds } },
          data: { status: 'PARTIALLY_COMPLETED' }
        });

        // Get appointment IDs and update them
        const ophAppointmentIds = await prisma.patientVisit.findMany({
          where: { id: { in: ophVisitIds } },
          select: { appointmentId: true }
        });
        
        const appointmentIdsToUpdate = ophAppointmentIds.map(v => v.appointmentId);
        
        await prisma.appointment.updateMany({
          where: { id: { in: appointmentIdsToUpdate } },
          data: { status: 'PARTIALLY_COMPLETED', isActive: false }
        });

        partialCount = ophthalmologistRecords.length;
      }

      // Step 4: Process OPTOMETRIST queues - Update to PARTIALLY_COMPLETED (patient started visit but didn't complete)
      if (optometristRecords.length > 0) {
        const optVisitIds = optometristRecords.map(r => r.patientVisitId);
        
        // Update PatientVisits to PARTIALLY_COMPLETED
        await prisma.patientVisit.updateMany({
          where: { id: { in: optVisitIds } },
          data: { status: 'PARTIALLY_COMPLETED' }
        });

        // Get appointment IDs and update them
        const optAppointmentIds = await prisma.patientVisit.findMany({
          where: { id: { in: optVisitIds } },
          select: { appointmentId: true }
        });
        
        const appointmentIdsToUpdate = optAppointmentIds.map(v => v.appointmentId);
        
        await prisma.appointment.updateMany({
          where: { id: { in: appointmentIdsToUpdate } },
          data: { status: 'PARTIALLY_COMPLETED', isActive: false }
        });

        discontinuedCount = optometristRecords.length;
      }

      // Step 5: Delete ALL queue records
      const deleteResult = await prisma.patientQueue.deleteMany({});

      console.log(`✅ Manual discontinue cleanup completed:
        - ${partialCount} OPHTHALMOLOGIST patients marked as PARTIALLY_COMPLETED and removed from queue
        - ${discontinuedCount} OPTOMETRIST patients marked as PARTIALLY_COMPLETED and removed from queue
        - ${deleteResult.count} total queue records deleted`);

      return {
        success: true,
        partiallyCompletedCount: partialCount,
        discontinuedCount: discontinuedCount,
        recordsDeleted: deleteResult.count,
        message: `Successfully processed ${allQueueRecords.length} queue records`
      };
    } catch (error) {
      console.error('❌ Error in manual discontinue all queue records trigger:', error);
      throw error;
    }
  }

  // ─── IST Timezone Helper ───
  // Returns current time in IST as a Date object (epoch ms adjusted is NOT needed —
  // we compare UTC epoch ms directly since _getISTNow and _toIST both return
  // real UTC Date objects that represent the IST wall-clock moment).
  // Instead we work with UTC epoch and compute offsets in ms.

  /**
   * Get the current instant as a JS Date (UTC-based).
   * All comparisons are done in UTC epoch ms — the IST constraint is enforced
   * by logging IST-formatted strings for audit clarity.
   */
  _nowUTC() {
    return new Date();
  }

  /**
   * Format a Date to a human-readable IST string for logging.
   */
  _formatIST(date) {
    return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' });
  }

  /**
   * Get the start of "today" in IST as a UTC Date object.
   * E.g. if IST is 2026-02-18 01:30, returns the UTC equivalent of 2026-02-18 00:00:00 IST
   * which is 2026-02-17 18:30:00 UTC.
   */
  _startOfTodayIST() {
    const now = new Date();
    // Format today's date in IST as YYYY-MM-DD
    const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // en-CA gives YYYY-MM-DD
    // Parse as IST midnight → convert to UTC
    // IST is UTC+5:30, so midnight IST = previous day 18:30 UTC
    const [year, month, day] = istDateStr.split('-').map(Number);
    const istMidnightUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - (5 * 60 + 30) * 60 * 1000);
    return istMidnightUTC;
  }

  /**
   * Get a date N days before the start of today in IST.
   */
  _daysBeforeTodayIST(days) {
    const startOfToday = this._startOfTodayIST();
    return new Date(startOfToday.getTime() - days * 24 * 60 * 60 * 1000);
  }

  /**
   * Core appointment lifecycle correction logic — IST calendar-date based.
   *
   * Step 1: SCHEDULED appointments from past dates (never checked in) → NO_SHOW, isActive: false
   * Step 2: CHECKED_IN appointments from past dates (no consultation progress) → PARTIALLY_COMPLETED, isActive: false
   * Step 3: PARTIALLY_COMPLETED appointments 7+ days old → DISCONTINUED, isActive: false
   * Step 4: Orphan PARTIALLY_COMPLETED (patient has a newer appointment) → DISCONTINUED, isActive: false
   * Step 5: SCHEDULED (today/future) with isActive: false → isActive: true (reactivation)
   *
   * All date comparisons use IST calendar date boundaries, NOT 24-hour rolling windows.
   */
  async _runAppointmentLifecycleCorrection() {
    const now = this._nowUTC();
    const nowIST = this._formatIST(now);
    const startOfTodayIST = this._startOfTodayIST();
    const sevenDaysBeforeToday = this._daysBeforeTodayIST(7);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 APPOINTMENT LIFECYCLE CORRECTION (IST Date-Based)');
    console.log(`⏰ Current IST: ${nowIST}`);
    console.log(`📅 Start of today (IST): ${this._formatIST(startOfTodayIST)}`);
    console.log(`📅 7-day cutoff (IST): ${this._formatIST(sevenDaysBeforeToday)}`);
    console.log('═══════════════════════════════════════════════════════════');

    // ── Step 1: SCHEDULED (past date, never checked in) → NO_SHOW ──
    // If appointmentDate < startOfTodayIST AND status is still SCHEDULED → patient never showed up
    const noShowAppointments = await prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED',
        appointmentDate: {
          lt: startOfTodayIST  // Appointment date is before today in IST
        }
      },
      select: {
        id: true,
        patientId: true,
        appointmentDate: true,
        tokenNumber: true
      }
    });

    let noShowCount = 0;

    if (noShowAppointments.length > 0) {
      console.log(`📋 Step 1: Found ${noShowAppointments.length} SCHEDULED appointment(s) from past dates → NO_SHOW`);

      const appointmentIds = noShowAppointments.map(a => a.id);

      await prisma.$transaction(async (tx) => {
        const result = await tx.appointment.updateMany({
          where: { id: { in: appointmentIds } },
          data: {
            status: 'NO_SHOW',
            isActive: false
          }
        });
        noShowCount = result.count;
      });

      // Audit log
      noShowAppointments.forEach(a => {
        console.log(`  ✅ Appointment ${a.id} (Patient ${a.patientId}) | Token ${a.tokenNumber} | ${this._formatIST(a.appointmentDate)} → NO_SHOW`);
      });
      console.log(`📊 Step 1 complete: ${noShowCount} appointment(s) → NO_SHOW, isActive: false`);
    } else {
      console.log('✅ Step 1: No past-date SCHEDULED appointments found');
    }

    // ── Step 2: CHECKED_IN (past date, no consultation) → PARTIALLY_COMPLETED ──
    // If appointmentDate < startOfTodayIST AND status is in-progress AND no optometrist/doctor seen
    const stalledCheckedIn = await prisma.patientVisit.findMany({
      where: {
        status: {
          in: ['CHECKED_IN', 'WITH_OPTOMETRIST', 'AWAITING_DOCTOR', 'WITH_DOCTOR', 'DIAGNOSTICS_PENDING']
        },
        // Include ALL past-date in-progress visits regardless of whether optometrist/doctor saw them.
        // Previously this filter required optometristSeenAt=null AND doctorSeenAt=null, which caused
        // visits where the patient saw the optometrist (but not the doctor) to be silently skipped,
        // leaving appointments stuck in CHECKED_IN status indefinitely.
        appointment: {
          appointmentDate: {
            lt: startOfTodayIST
          }
        }
      },
      select: {
        id: true,
        appointmentId: true,
        checkedInAt: true,
        patientId: true,
        appointment: {
          select: { appointmentDate: true }
        }
      }
    });

    let partiallyCompletedCount = 0;

    if (stalledCheckedIn.length > 0) {
      console.log(`📋 Step 2: Found ${stalledCheckedIn.length} stalled CHECKED_IN visit(s) from past dates → PARTIALLY_COMPLETED`);

      const visitIds = stalledCheckedIn.map(v => v.id);
      const appointmentIds = stalledCheckedIn.map(v => v.appointmentId).filter(Boolean);

      await prisma.$transaction(async (tx) => {
        // Update PatientVisit → PARTIALLY_COMPLETED
        const visitResult = await tx.patientVisit.updateMany({
          where: { id: { in: visitIds } },
          data: {
            status: 'PARTIALLY_COMPLETED',
            completedAt: now
          }
        });

        // Update Appointment → PARTIALLY_COMPLETED, isActive: false (patient not in hospital anymore)
        if (appointmentIds.length > 0) {
          await tx.appointment.updateMany({
            where: { id: { in: appointmentIds } },
            data: { status: 'PARTIALLY_COMPLETED', isActive: false }
          });
        }

        // Mark any lingering queue entries as DISCONTINUED
        await tx.patientQueue.updateMany({
          where: {
            patientVisitId: { in: visitIds },
            status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS', 'ON_HOLD'] }
          },
          data: {
            status: 'DISCONTINUED',
            completedAt: now,
            notes: 'Auto-discontinued: visit from past date without consultation progress'
          }
        });

        partiallyCompletedCount = visitResult.count;
      });

      // Audit log
      stalledCheckedIn.forEach(v => {
        console.log(`  ✅ Visit ${v.id} (Patient ${v.patientId}) | appointmentDate: ${this._formatIST(v.appointment.appointmentDate)} → PARTIALLY_COMPLETED (isActive: false)`);
      });
      console.log(`📊 Step 2 complete: ${partiallyCompletedCount} visit(s) → PARTIALLY_COMPLETED, isActive: false (can resume or book new)`);
    } else {
      console.log('✅ Step 2: No stalled CHECKED_IN visits from past dates found');
    }

    // ── Step 3: PARTIALLY_COMPLETED (7+ days old) → DISCONTINUED ──
    // If appointmentDate < (today - 7 days in IST) AND status is PARTIALLY_COMPLETED
    const stalledPartial = await prisma.patientVisit.findMany({
      where: {
        status: 'PARTIALLY_COMPLETED',
        appointment: {
          appointmentDate: {
            lt: sevenDaysBeforeToday  // Appointment date is 7+ days before today in IST
          }
        }
      },
      select: {
        id: true,
        appointmentId: true,
        patientId: true,
        appointment: {
          select: { appointmentDate: true }
        }
      }
    });

    let discontinuedCount = 0;

    if (stalledPartial.length > 0) {
      console.log(`📋 Step 3: Found ${stalledPartial.length} PARTIALLY_COMPLETED visit(s) older than 7 days → DISCONTINUED`);

      const visitIds = stalledPartial.map(v => v.id);
      const appointmentIds = stalledPartial.map(v => v.appointmentId).filter(Boolean);

      await prisma.$transaction(async (tx) => {
        // Update PatientVisit → DISCONTINUED
        const visitResult = await tx.patientVisit.updateMany({
          where: { id: { in: visitIds } },
          data: {
            status: 'DISCONTINUED',
            completedAt: now
          }
        });

        // Update Appointment → DISCONTINUED, isActive: false (no longer resumable)
        if (appointmentIds.length > 0) {
          await tx.appointment.updateMany({
            where: { id: { in: appointmentIds } },
            data: { status: 'DISCONTINUED', isActive: false }
          });
        }

        // Mark any remaining queue entries
        await tx.patientQueue.updateMany({
          where: {
            patientVisitId: { in: visitIds },
            status: { notIn: ['COMPLETED', 'DISCONTINUED'] }
          },
          data: {
            status: 'DISCONTINUED',
            completedAt: now,
            notes: 'Auto-discontinued: visit stalled for 7+ days after partial completion'
          }
        });

        discontinuedCount = visitResult.count;
      });

      // Audit log
      stalledPartial.forEach(v => {
        console.log(`  ✅ Visit ${v.id} (Patient ${v.patientId}) | appointmentDate: ${this._formatIST(v.appointment.appointmentDate)} → DISCONTINUED (isActive: false)`);
      });
      console.log(`📊 Step 3 complete: ${discontinuedCount} visit(s) → DISCONTINUED, isActive: false`);
    } else {
      console.log('✅ Step 3: No stalled PARTIALLY_COMPLETED visits older than 7 days found');
    }

    // ── Step 4: Orphan PARTIALLY_COMPLETED cleanup ──
    // If a patient has a PARTIALLY_COMPLETED appointment but ALSO has a NEWER appointment
    // with a non-terminal status (excluding CANCELLED/NO_SHOW), the older one should be
    // set to DISCONTINUED. This catches cases that slipped through (e.g., server restart,
    // race condition, or a continuation appointment was created via the resume flow).
    // Note: When a continuation visit is created, rescheduledFrom links the new appointment
    // to the old one, and originalVisitId links the new visit to the old one. The historical
    // data is fully preserved regardless of whether the old status is PARTIALLY_COMPLETED or
    // DISCONTINUED — the old visit's examinations, timestamps, and clinical data remain intact.
    const allPartiallyCompleted = await prisma.appointment.findMany({
      where: {
        status: 'PARTIALLY_COMPLETED'
      },
      select: {
        id: true,
        patientId: true,
        createdAt: true,
        appointmentDate: true,
        tokenNumber: true,
        patientVisit: { select: { id: true, status: true } }
      }
    });

    let orphanDiscontinuedCount = 0;

    if (allPartiallyCompleted.length > 0) {
      // For each PARTIALLY_COMPLETED appointment, check if the patient has a newer
      // non-cancelled appointment (continuation, new booking, etc.)
      const orphanIds = [];
      const orphanVisitIds = [];

      for (const pc of allPartiallyCompleted) {
        const newerAppointment = await prisma.appointment.findFirst({
          where: {
            patientId: pc.patientId,
            id: { not: pc.id },
            createdAt: { gt: pc.createdAt },
            // Only count real appointments — not cancelled or no-show
            status: { notIn: ['CANCELLED', 'NO_SHOW'] }
          },
          select: { id: true, appointmentType: true }
        });

        if (newerAppointment) {
          orphanIds.push(pc.id);
          if (pc.patientVisit?.id) {
            orphanVisitIds.push(pc.patientVisit.id);
          }
        }
      }

      if (orphanIds.length > 0) {
        console.log(`📋 Step 4: Found ${orphanIds.length} orphan PARTIALLY_COMPLETED appointment(s) with newer bookings → DISCONTINUED`);

        await prisma.$transaction(async (tx) => {
          await tx.appointment.updateMany({
            where: { id: { in: orphanIds } },
            data: { status: 'DISCONTINUED', isActive: false }
          });

          if (orphanVisitIds.length > 0) {
            await tx.patientVisit.updateMany({
              where: { id: { in: orphanVisitIds } },
              data: { status: 'DISCONTINUED', completedAt: now }
            });
          }
        });

        orphanDiscontinuedCount = orphanIds.length;
        console.log(`📊 Step 4 complete: ${orphanDiscontinuedCount} orphan PARTIALLY_COMPLETED appointment(s) → DISCONTINUED`);
      } else {
        console.log('✅ Step 4: All PARTIALLY_COMPLETED appointments are current (no newer bookings exist)');
      }
    } else {
      console.log('✅ Step 4: No PARTIALLY_COMPLETED appointments found');
    }

    // ── Step 5: Catch orphan SCHEDULED appointments with isActive mismatch ──
    // SCHEDULED appointments from TODAY should be isActive: true
    // (This covers the edge case where a scheduled appointment exists for today but isActive was somehow false)
    const todayScheduledNeedingActivation = await prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED',
        isActive: false,
        appointmentDate: {
          gte: startOfTodayIST  // Today or future
        }
      },
      select: {
        id: true,
        patientId: true,
        appointmentDate: true,
        tokenNumber: true
      }
    });

    let reactivatedCount = 0;

    if (todayScheduledNeedingActivation.length > 0) {
      console.log(`📋 Step 5: Found ${todayScheduledNeedingActivation.length} SCHEDULED appointment(s) needing isActive=true`);

      const ids = todayScheduledNeedingActivation.map(a => a.id);
      const result = await prisma.appointment.updateMany({
        where: { id: { in: ids } },
        data: { isActive: true }
      });
      reactivatedCount = result.count;

      todayScheduledNeedingActivation.forEach(a => {
        console.log(`  ✅ Appointment ${a.id} (Patient ${a.patientId}) | Token ${a.tokenNumber} | ${this._formatIST(a.appointmentDate)} → isActive: true`);
      });
      console.log(`📊 Step 5 complete: ${reactivatedCount} appointment(s) reactivated`);
    } else {
      console.log('✅ Step 5: No SCHEDULED appointments need reactivation');
    }

    console.log('');
    console.log(`🎉 Appointment lifecycle correction finished at IST: ${this._formatIST(new Date())}`);
    console.log(`   Summary: ${noShowCount} → NO_SHOW, ${partiallyCompletedCount} → PARTIALLY_COMPLETED, ${discontinuedCount} → DISCONTINUED (7d stale), ${orphanDiscontinuedCount} → DISCONTINUED (orphan), ${reactivatedCount} reactivated`);
    console.log('═══════════════════════════════════════════════════════════');

    return {
      success: true,
      noShowCount,
      partiallyCompletedCount,
      discontinuedCount,
      orphanDiscontinuedCount,
      reactivatedCount,
      executedAtIST: nowIST
    };
  }

  // ──────────────────────────────────────────────────────────────
  // APPOINTMENT-VISIT STATUS SYNCHRONIZATION
  // ──────────────────────────────────────────────────────────────
  // Purpose: Fix data integrity issues where Appointment.status is stale/out-of-sync with PatientVisit.status
  // This happens when visit status updates but appointment status doesn't follow
  async _runAppointmentVisitStatusSync() {
    const now = this._nowUTC();
    const nowIST = this._formatIST(now);

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 APPOINTMENT-VISIT STATUS SYNC');
    console.log(`⏰ Started at IST: ${nowIST}`);
    console.log('═══════════════════════════════════════════════════════════');

    // Find all appointments that have a visit record
    const appointmentsWithVisits = await prisma.appointment.findMany({
      where: {
        patientVisit: {
          isNot: null // Must have a visit record
        }
      },
      select: {
        id: true,
        patientId: true,
        status: true,
        isActive: true,
        appointmentDate: true,
        patientVisit: {
          select: {
            id: true,
            status: true,
            checkedInAt: true,
            optometristSeenAt: true,
            doctorSeenAt: true
          }
        }
      }
    });

    // Filter to find mis-matched statuses
    const outOfSyncAppointments = appointmentsWithVisits.filter(
      apt => apt.status !== apt.patientVisit.status
    );

    if (outOfSyncAppointments.length === 0) {
      console.log('✅ All appointments are synchronized with their visit statuses');
      console.log(`🎉 Status sync finished at IST: ${this._formatIST(new Date())}`);
      return {
        success: true,
        syncedCount: 0,
        executedAtIST: nowIST
      };
    }

    console.log(`📋 Found ${outOfSyncAppointments.length} appointment(s) with mis-matched status`);

    // Helper function to map VisitStatus to AppointmentStatus
    const mapVisitToAppointmentStatus = (visitStatus) => {
      switch (visitStatus) {
        case 'COMPLETED':
        case 'DISCHARGED':
          return 'COMPLETED';
        case 'DISCONTINUED':
          return 'DISCONTINUED';
        case 'PARTIALLY_COMPLETED':
          return 'PARTIALLY_COMPLETED';
        case 'CHECKED_IN':
        case 'WITH_OPTOMETRIST':
        case 'AWAITING_DOCTOR':
        case 'WITH_DOCTOR':
        case 'DIAGNOSTICS_PENDING':
        case 'SURGERY_SCHEDULED':
        case 'BILLING':
        case 'PHARMACY':
          return 'CHECKED_IN'; // All in-progress states map to CHECKED_IN
        default:
          return null; // Unknown status, skip
      }
    };

    // Helper: Derive isActive from mapped appointment status
    // isActive = true ONLY for same-day in-hospital workflow (CHECKED_IN)
    // PARTIALLY_COMPLETED = patient not currently in hospital (isActive: false, can resume OR book new)
    const deriveIsActive = (mappedStatus) => {
      return mappedStatus === 'CHECKED_IN';
    };

    let syncedCount = 0;

    // Sync each appointment to match its visit status
    await prisma.$transaction(async (tx) => {
      for (const appointment of outOfSyncAppointments) {
        const visitStatus = appointment.patientVisit.status;
        const mappedStatus = mapVisitToAppointmentStatus(visitStatus);

        if (!mappedStatus) {
          console.log(`  ⚠️  Skipping Appointment ${appointment.id}: Unknown visit status '${visitStatus}'`);
          continue;
        }

        const newIsActive = deriveIsActive(mappedStatus);

        // Update if the mapped status or isActive is different
        if (appointment.status !== mappedStatus || appointment.isActive !== newIsActive) {
          await tx.appointment.update({
            where: { id: appointment.id },
            data: { status: mappedStatus, isActive: newIsActive }
          });

          console.log(`  ✅ Appointment ${appointment.id} (Patient ${appointment.patientId})`);
          console.log(`     ${appointment.status} → ${mappedStatus} | isActive: ${appointment.isActive} → ${newIsActive} (visit: ${visitStatus})`);
          console.log(`     Visit checked in: ${appointment.patientVisit.checkedInAt ? this._formatIST(appointment.patientVisit.checkedInAt) : 'N/A'}`);

          syncedCount++;
        }
      }
    });

    console.log(`📊 Sync complete: ${syncedCount} appointment(s) updated to match visit status`);
    console.log(`🎉 Status sync finished at IST: ${this._formatIST(new Date())}`);

    return {
      success: true,
      syncedCount,
      executedAtIST: nowIST
    };
  }

  // Manual trigger for appointment lifecycle correction
  async triggerStalledVisitLifecycleCorrection() {
    console.log('🔧 Manually triggering appointment lifecycle correction...');
    try {
      const result = await this._runAppointmentLifecycleCorrection();
      return result;
    } catch (error) {
      console.error('❌ Error in manual appointment lifecycle correction trigger:', error);
      throw error;
    }
  }

  // Manual trigger for appointment-visit status sync
  async triggerAppointmentVisitStatusSync() {
    console.log('🔧 Manually triggering appointment-visit status sync...');
    try {
      const result = await this._runAppointmentVisitStatusSync();
      return result;
    } catch (error) {
      console.error('❌ Error in manual appointment-visit status sync trigger:', error);
      throw error;
    }
  }
}

module.exports = new ScheduledTasksService();
