const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Comprehensive isActive Cleanup Script
 * 
 * Purpose: Ensure ALL appointments have correct isActive values
 * 
 * Rules (based on India Standard Time):
 * 
 * isActive: true → ONLY for:
 * - SCHEDULED (today or future)
 * - CHECKED_IN (any date - patient is actively in hospital)
 * - RESCHEDULED (today or future)
 * 
 * isActive: false → ALL terminal/closed statuses:
 * - PARTIALLY_COMPLETED (patient not currently in hospital, can resume OR rebook)
 * - DISCONTINUED (treatment discontinued)
 * - COMPLETED (treatment completed successfully)
 * - CANCELLED (appointment cancelled)
 * - NO_SHOW (patient didn't show up)
 * - DISCHARGED (patient discharged)
 * - SCHEDULED (past dates without check-in)
 */

async function fixIsActiveConsistency() {
  console.log('🔧 Starting Comprehensive isActive Cleanup...\n');

  const now = new Date();

  // IST Date Helper
  const getStartOfTodayIST = () => {
    const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const [year, month, day] = istDateStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day) - (5 * 60 + 30) * 60 * 1000);
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

  console.log(`📅 Current IST: ${formatIST(now)}`);
  console.log(`📅 Start of today (IST): ${formatIST(startOfTodayIST)}\n`);

  // Terminal statuses that MUST have isActive: false
  const TERMINAL_STATUSES = [
    'PARTIALLY_COMPLETED',
    'DISCONTINUED',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
    'DISCHARGED'
  ];

  let totalFixed = 0;

  try {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Fix ALL Terminal Statuses → isActive: false
    // ═══════════════════════════════════════════════════════════════
    
    console.log('━━━ STEP 1: Fix Terminal Statuses (Set isActive: false) ━━━\n');

    for (const status of TERMINAL_STATUSES) {
      const appointmentsToFix = await prisma.appointment.findMany({
        where: {
          status: status,
          isActive: true  // These should be false
        },
        include: {
          patient: {
            select: {
              firstName: true,
              middleName: true,
              lastName: true,
              patientNumber: true
            }
          }
        },
        orderBy: {
          appointmentDate: 'desc'
        }
      });

      if (appointmentsToFix.length > 0) {
        console.log(`📋 Status: ${status}`);
        console.log(`   Found ${appointmentsToFix.length} appointments with isActive: true (INCORRECT)\n`);

        // Show sample records
        console.log('   Records being fixed:');
        appointmentsToFix.forEach((appt, index) => {
          const patientName = `${appt.patient.firstName} ${appt.patient.middleName || ''} ${appt.patient.lastName}`.trim();
          const dateStr = new Date(appt.appointmentDate).toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
          console.log(`   ${index + 1}. ${patientName} (${appt.patient.patientNumber}) | ${dateStr} | Token: ${appt.tokenNumber}`);
        });

        // Update all at once
        const updateResult = await prisma.appointment.updateMany({
          where: {
            status: status,
            isActive: true
          },
          data: {
            isActive: false
          }
        });

        console.log(`   ✅ Updated ${updateResult.count} ${status} appointments → isActive: false\n`);
        totalFixed += updateResult.count;
      } else {
        console.log(`✅ Status: ${status} - All appointments already have correct isActive: false\n`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Fix SCHEDULED from Past Dates → isActive: false
    // ═══════════════════════════════════════════════════════════════
    
    console.log('━━━ STEP 2: Fix Past SCHEDULED Appointments ━━━\n');

    const pastScheduled = await prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED',
        appointmentDate: {
          lt: startOfTodayIST  // Past dates
        },
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
      }
    });

    if (pastScheduled.length > 0) {
      console.log(`📋 Found ${pastScheduled.length} SCHEDULED appointments from past dates with isActive: true\n`);
      
      console.log('   Records being fixed:');
      pastScheduled.forEach((appt, index) => {
        const patientName = `${appt.patient.firstName} ${appt.patient.lastName}`;
        const dateStr = formatIST(appt.appointmentDate);
        console.log(`   ${index + 1}. ${patientName} (${appt.patient.patientNumber}) | ${dateStr} | Token: ${appt.tokenNumber}`);
      });

      const updateResult = await prisma.appointment.updateMany({
        where: {
          status: 'SCHEDULED',
          appointmentDate: { lt: startOfTodayIST },
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      console.log(`\n   ✅ Updated ${updateResult.count} past SCHEDULED appointments → isActive: false\n`);
      totalFixed += updateResult.count;
    } else {
      console.log('✅ No past SCHEDULED appointments with incorrect isActive found\n');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Ensure CHECKED_IN and Current SCHEDULED have isActive: true
    // ═══════════════════════════════════════════════════════════════
    
    console.log('━━━ STEP 3: Verify Active Appointments Have Correct isActive ━━━\n');

    // CHECKED_IN should always be active (patient is in hospital)
    const checkedInNeedingActivation = await prisma.appointment.count({
      where: {
        status: 'CHECKED_IN',
        isActive: false
      }
    });

    if (checkedInNeedingActivation > 0) {
      console.log(`📋 Found ${checkedInNeedingActivation} CHECKED_IN appointments with isActive: false\n`);
      
      const updateResult = await prisma.appointment.updateMany({
        where: {
          status: 'CHECKED_IN',
          isActive: false
        },
        data: {
          isActive: true
        }
      });

      console.log(`   ✅ Updated ${updateResult.count} CHECKED_IN appointments → isActive: true\n`);
      totalFixed += updateResult.count;
    } else {
      console.log('✅ All CHECKED_IN appointments have correct isActive: true\n');
    }

    // SCHEDULED for today/future should be active
    const futureScheduledNeedingActivation = await prisma.appointment.count({
      where: {
        status: 'SCHEDULED',
        appointmentDate: { gte: startOfTodayIST },
        isActive: false
      }
    });

    if (futureScheduledNeedingActivation > 0) {
      console.log(`📋 Found ${futureScheduledNeedingActivation} SCHEDULED (today/future) with isActive: false\n`);
      
      const updateResult = await prisma.appointment.updateMany({
        where: {
          status: 'SCHEDULED',
          appointmentDate: { gte: startOfTodayIST },
          isActive: false
        },
        data: {
          isActive: true
        }
      });

      console.log(`   ✅ Updated ${updateResult.count} future SCHEDULED → isActive: true\n`);
      totalFixed += updateResult.count;
    } else {
      console.log('✅ All future SCHEDULED appointments have correct isActive: true\n');
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Final Verification
    // ═══════════════════════════════════════════════════════════════
    
    console.log('━━━ STEP 4: Final Verification ━━━\n');

    // Check for any remaining terminal statuses with isActive: true
    const remainingIssues = await prisma.appointment.count({
      where: {
        status: { in: TERMINAL_STATUSES },
        isActive: true
      }
    });

    if (remainingIssues > 0) {
      console.log(`⚠️  WARNING: ${remainingIssues} terminal appointments still have isActive: true`);
      
      const details = await prisma.appointment.findMany({
        where: {
          status: { in: TERMINAL_STATUSES },
          isActive: true
        },
        select: {
          id: true,
          status: true,
          tokenNumber: true,
          appointmentDate: true
        }
      });
      console.log('   Details:', details);
    } else {
      console.log('✅ All terminal statuses correctly have isActive: false\n');
    }

    // Get final statistics
    const finalStats = await prisma.appointment.groupBy({
      by: ['status', 'isActive'],
      _count: true,
      orderBy: {
        status: 'asc'
      }
    });

    console.log('📊 Final Database State:');
    finalStats.forEach(group => {
      console.log(`   ${group.status} | isActive: ${group.isActive} | count: ${group._count}`);
    });

    const totalActive = await prisma.appointment.count({
      where: { isActive: true }
    });

    console.log(`\n👥 Total patients currently blocked from rebooking: ${totalActive}`);

    // List currently blocked patients
    if (totalActive > 0) {
      const blockedPatients = await prisma.appointment.findMany({
        where: { isActive: true },
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

      console.log('\n   Blocked patients (should only be CHECKED_IN or future SCHEDULED):');
      blockedPatients.forEach(appt => {
        const patientName = `${appt.patient.firstName} ${appt.patient.lastName}`;
        const dateStr = formatIST(appt.appointmentDate);
        console.log(`   - ${patientName} (${appt.patient.patientNumber}) | ${appt.status} | ${dateStr} | Token: ${appt.tokenNumber}`);
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
fixIsActiveConsistency()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
