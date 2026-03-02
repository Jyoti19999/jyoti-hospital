const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Data Cleanup Script: Fix Historical CHECKED_IN Appointments & PARTIALLY_COMPLETED Semantics
 * 
 * Purpose: Clean up appointments that weren't properly transitioned by the lifecycle cron
 * 
 * Issues being fixed:
 * 1. CHECKED_IN appointments from past dates → should be PARTIALLY_COMPLETED
 * 2. PARTIALLY_COMPLETED appointments → should have isActive: false (NOT blocking rebooking)
 * 3. PARTIALLY_COMPLETED 7+ days old → should be DISCONTINUED
 * 
 * New Semantics:
 * - isActive ONLY for same-day in-hospital workflow
 * - PARTIALLY_COMPLETED can resume OR book new (NOT blocking)
 * - Once date changes, patient is no longer "active" in hospital
 */

async function cleanupHistoricalAppointments() {
  console.log('🔧 Starting Historical Appointment Cleanup...\n');

  const now = new Date();

  // ── IST Date Helpers ──
  const getStartOfTodayIST = () => {
    const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const [year, month, day] = istDateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day) - (5 * 60 + 30) * 60 * 1000);
  };

  const getDaysBeforeTodayIST = (days) => {
    const startOfToday = getStartOfTodayIST();
    return new Date(startOfToday - days * 24 * 60 * 60 * 1000);
  };

  const formatIST = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const startOfTodayIST = getStartOfTodayIST();
  const sevenDaysBeforeToday = getDaysBeforeTodayIST(7);

  console.log(`📅 Current IST: ${formatIST(now)}`);
  console.log(`📅 Start of today (IST): ${formatIST(startOfTodayIST)}`);
  console.log(`📅 7 days before today (IST): ${formatIST(sevenDaysBeforeToday)}\n`);

  let totalFixed = 0;

  try {
    // ── STEP 1: Fix CHECKED_IN appointments from past dates ──
    console.log('━━━ STEP 1: Fix Historical CHECKED_IN Appointments ━━━');
    
    // Find CHECKED_IN appointments where appointmentDate < today
    const historicalCheckedIn = await prisma.appointment.findMany({
      where: {
        status: 'CHECKED_IN',
        appointmentDate: {
          lt: startOfTodayIST  // Past dates only
        }
      },
      include: {
        patient: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true
          }
        },
        patientVisit: {
          select: {
            id: true,
            status: true,
            doctorSeenAt: true,
            optometristSeenAt: true
          }
        }
      }
    });

    console.log(`📋 Found ${historicalCheckedIn.length} CHECKED_IN appointments from past dates\n`);

    if (historicalCheckedIn.length > 0) {
      for (const appt of historicalCheckedIn) {
        const patientName = `${appt.patient.firstName} ${appt.patient.middleName || ''} ${appt.patient.lastName}`.trim();
        const apptDateStr = formatIST(appt.appointmentDate);
        
        console.log(`  📌 Patient: ${patientName} | Token: ${appt.tokenNumber} | Date: ${apptDateStr}`);
        console.log(`     Current: CHECKED_IN → Updating to: PARTIALLY_COMPLETED (isActive: false)`);

        // Update appointment
        await prisma.appointment.update({
          where: { id: appt.id },
          data: {
            status: 'PARTIALLY_COMPLETED',
            isActive: false
          }
        });

        // Update corresponding visit if it exists
        if (appt.patientVisit) {
          await prisma.patientVisit.update({
            where: { id: appt.patientVisit.id },
            data: {
              status: 'PARTIALLY_COMPLETED',
              completedAt: now
            }
          });
        }

        totalFixed++;
      }

      console.log(`\n✅ Step 1 Complete: Fixed ${historicalCheckedIn.length} historical CHECKED_IN appointments\n`);
    } else {
      console.log('✅ Step 1: No historical CHECKED_IN appointments found\n');
    }

    // ── STEP 2: Ensure ALL PARTIALLY_COMPLETED have isActive: false ──
    console.log('━━━ STEP 2: Fix PARTIALLY_COMPLETED isActive Flag ━━━');
    
    const partiallyCompletedWithActiveTrue = await prisma.appointment.findMany({
      where: {
        status: 'PARTIALLY_COMPLETED',
        isActive: true  // Should be false
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

    console.log(`📋 Found ${partiallyCompletedWithActiveTrue.length} PARTIALLY_COMPLETED with incorrect isActive: true\n`);

    if (partiallyCompletedWithActiveTrue.length > 0) {
      const appointmentIds = partiallyCompletedWithActiveTrue.map(a => a.id);

      await prisma.appointment.updateMany({
        where: { id: { in: appointmentIds } },
        data: { isActive: false }
      });

      console.log(`✅ Step 2 Complete: Fixed ${partiallyCompletedWithActiveTrue.length} PARTIALLY_COMPLETED appointments (isActive: false)\n`);
      totalFixed += partiallyCompletedWithActiveTrue.length;
    } else {
      console.log('✅ Step 2: All PARTIALLY_COMPLETED appointments have correct isActive: false\n');
    }

    // ── STEP 3: Transition PARTIALLY_COMPLETED 7+ days old → DISCONTINUED ──
    console.log('━━━ STEP 3: Transition Old PARTIALLY_COMPLETED → DISCONTINUED ━━━');
    
    const oldPartiallyCompleted = await prisma.appointment.findMany({
      where: {
        status: 'PARTIALLY_COMPLETED',
        appointmentDate: {
          lt: sevenDaysBeforeToday  // 7+ days old
        }
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        patientVisit: {
          select: {
            id: true
          }
        }
      }
    });

    console.log(`📋 Found ${oldPartiallyCompleted.length} PARTIALLY_COMPLETED appointments older than 7 days\n`);

    if (oldPartiallyCompleted.length > 0) {
      for (const appt of oldPartiallyCompleted) {
        const patientName = `${appt.patient.firstName} ${appt.patient.lastName}`;
        const apptDateStr = formatIST(appt.appointmentDate);
        
        console.log(`  📌 Patient: ${patientName} | Date: ${apptDateStr} → DISCONTINUED`);

        // Update appointment
        await prisma.appointment.update({
          where: { id: appt.id },
          data: {
            status: 'DISCONTINUED',
            isActive: false
          }
        });

        // Update corresponding visit if it exists
        if (appt.patientVisit) {
          await prisma.patientVisit.update({
            where: { id: appt.patientVisit.id },
            data: {
              status: 'DISCONTINUED',
              completedAt: now
            }
          });
        }

        totalFixed++;
      }

      console.log(`\n✅ Step 3 Complete: Transitioned ${oldPartiallyCompleted.length} old appointments to DISCONTINUED\n`);
    } else {
      console.log('✅ Step 3: No old PARTIALLY_COMPLETED appointments found\n');
    }

    // ── STEP 4: Verification Summary ──
    console.log('━━━ STEP 4: Final Verification ━━━');
    
    // Check for any remaining issues
    const remainingIssues = await prisma.appointment.findMany({
      where: {
        OR: [
          // CHECKED_IN from past dates
          {
            status: 'CHECKED_IN',
            appointmentDate: { lt: startOfTodayIST }
          },
          // PARTIALLY_COMPLETED with isActive: true
          {
            status: 'PARTIALLY_COMPLETED',
            isActive: true
          }
        ]
      }
    });

    if (remainingIssues.length > 0) {
      console.log(`⚠️  WARNING: ${remainingIssues.length} appointments still have issues:`, remainingIssues);
    } else {
      console.log('✅ All historical appointment issues resolved!\n');
    }

    // Get current active appointment counts
    const activeAppts = await prisma.appointment.groupBy({
      by: ['status', 'isActive'],
      where: {
        isActive: true
      },
      _count: true
    });

    console.log('📊 Current Active Appointments (isActive: true):');
    activeAppts.forEach(group => {
      console.log(`   ${group.status} | isActive: ${group.isActive} | count: ${group._count}`);
    });

    // Get patients currently blocked
    const blockedPatients = await prisma.appointment.findMany({
      where: {
        isActive: true
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientNumber: true
          }
        }
      },
      orderBy: {
        appointmentDate: 'desc'
      }
    });

    console.log(`\n👥 Total patients currently blocked from rebooking: ${blockedPatients.length}`);
    if (blockedPatients.length > 0) {
      console.log('\nBlocked patients (should only be CHECKED_IN on TODAY or SCHEDULED for future):');
      blockedPatients.forEach(appt => {
        const patientName = `${appt.patient.firstName} ${appt.patient.lastName}`;
        const apptDateStr = formatIST(appt.appointmentDate);
        console.log(`   ${patientName} | ${appt.status} | Token ${appt.tokenNumber} | ${apptDateStr}`);
      });
    }

    console.log(`\n🎉 Cleanup Complete! Total appointments fixed: ${totalFixed}\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupHistoricalAppointments()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
