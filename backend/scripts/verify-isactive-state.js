const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Verification Script: Check isActive Field Consistency
 * 
 * Purpose: Identify appointments with incorrect isActive values
 * 
 * Rules:
 * - isActive: true  → Only for: SCHEDULED (today/future), CHECKED_IN, RESCHEDULED
 * - isActive: false → For all terminal states: PARTIALLY_COMPLETED, DISCONTINUED, 
 *                     COMPLETED, CANCELLED, NO_SHOW, DISCHARGED
 */

async function verifyIsActiveState() {
  console.log('🔍 Verifying isActive Field Consistency...\n');

  try {
    // Terminal statuses that MUST have isActive: false
    const TERMINAL_STATUSES = [
      'PARTIALLY_COMPLETED',
      'DISCONTINUED',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
      'DISCHARGED'
    ];

    // Active statuses that can have isActive: true
    const ACTIVE_STATUSES = [
      'SCHEDULED',
      'CHECKED_IN',
      'RESCHEDULED'
    ];

    console.log('━━━ TERMINAL STATUSES (Should be isActive: false) ━━━');
    console.log(TERMINAL_STATUSES.join(', '));
    console.log('\n━━━ ACTIVE STATUSES (Can be isActive: true) ━━━');
    console.log(ACTIVE_STATUSES.join(', '));
    console.log('\n');

    // Check 1: Terminal statuses with isActive: true (INCORRECT)
    const terminalWithActiveTrue = await prisma.appointment.findMany({
      where: {
        status: { in: TERMINAL_STATUSES },
        isActive: true
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

    console.log('❌ ISSUE 1: Terminal Statuses with isActive: true (INCORRECT)');
    console.log(`   Found: ${terminalWithActiveTrue.length} appointments\n`);

    if (terminalWithActiveTrue.length > 0) {
      console.log('   Breakdown by status:');
      const breakdown = {};
      terminalWithActiveTrue.forEach(appt => {
        breakdown[appt.status] = (breakdown[appt.status] || 0) + 1;
      });
      Object.entries(breakdown).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count} appointments`);
      });

      console.log('\n   Sample records:');
      terminalWithActiveTrue.slice(0, 10).forEach(appt => {
        const patientName = `${appt.patient.firstName} ${appt.patient.middleName || ''} ${appt.patient.lastName}`.trim();
        const dateStr = new Date(appt.appointmentDate).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        console.log(`   - ${patientName} (${appt.patient.patientNumber}) | ${appt.status} | ${dateStr} | Token: ${appt.tokenNumber}`);
      });

      if (terminalWithActiveTrue.length > 10) {
        console.log(`   ... and ${terminalWithActiveTrue.length - 10} more records`);
      }
    } else {
      console.log('   ✅ No issues found!\n');
    }

    // Check 2: Active statuses with isActive: false (might be intentional for past dates)
    const now = new Date();
    const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const [year, month, day] = istDateStr.split('-').map(Number);
    const startOfTodayIST = new Date(Date.UTC(year, month - 1, day) - (5 * 60 + 30) * 60 * 1000);

    const activeStatusesWithActiveFalse = await prisma.appointment.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        isActive: false,
        appointmentDate: {
          gte: startOfTodayIST  // Today or future
        }
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

    console.log('\n⚠️  ISSUE 2: Active Statuses (today/future) with isActive: false');
    console.log(`   Found: ${activeStatusesWithActiveFalse.length} appointments\n`);

    if (activeStatusesWithActiveFalse.length > 0) {
      console.log('   Breakdown by status:');
      const breakdown = {};
      activeStatusesWithActiveFalse.forEach(appt => {
        breakdown[appt.status] = (breakdown[appt.status] || 0) + 1;
      });
      Object.entries(breakdown).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count} appointments`);
      });

      console.log('\n   Sample records:');
      activeStatusesWithActiveFalse.slice(0, 10).forEach(appt => {
        const patientName = `${appt.patient.firstName} ${appt.patient.lastName}`;
        const dateStr = new Date(appt.appointmentDate).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        console.log(`   - ${patientName} (${appt.patient.patientNumber}) | ${appt.status} | ${dateStr} | Token: ${appt.tokenNumber}`);
      });

      if (activeStatusesWithActiveFalse.length > 10) {
        console.log(`   ... and ${activeStatusesWithActiveFalse.length - 10} more records`);
      }
    } else {
      console.log('   ✅ No issues found!\n');
    }

    // Summary
    console.log('\n━━━ SUMMARY ━━━');
    
    const totalIssues = terminalWithActiveTrue.length;
    
    if (totalIssues > 0) {
      console.log(`❌ Found ${totalIssues} appointments with incorrect isActive values`);
      console.log(`\n📝 Action Required: Run fix-isactive-consistency.js to correct these records`);
    } else {
      console.log('✅ All appointments have correct isActive values!');
    }

    // Overall statistics
    console.log('\n━━━ DATABASE STATISTICS ━━━');
    
    const allAppointments = await prisma.appointment.groupBy({
      by: ['status', 'isActive'],
      _count: true,
      orderBy: {
        status: 'asc'
      }
    });

    console.log('\nCurrent state of all appointments:');
    allAppointments.forEach(group => {
      console.log(`${group.status} | isActive: ${group.isActive} | count: ${group._count}`);
    });

    const totalActive = await prisma.appointment.count({
      where: { isActive: true }
    });

    console.log(`\n👥 Total patients currently blocked from rebooking: ${totalActive}`);

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyIsActiveState()
  .then(() => {
    console.log('\n✅ Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
