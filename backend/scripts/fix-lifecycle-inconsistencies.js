const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fix Data Inconsistencies Script
 * 
 * 1. Fix appointments wrongly set to DISCONTINUED that should be PARTIALLY_COMPLETED
 *    (appointments from recent dates where patient checked in but didn't complete)
 * 2. Ensure only the MOST RECENT incomplete appointment per patient remains PARTIALLY_COMPLETED
 *    (older ones should be DISCONTINUED)
 */

async function fixDataInconsistencies() {
  console.log('🔧 Fixing Appointment Data Inconsistencies...\n');

  const now = new Date();

  // IST Date Helpers
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
    // ── STEP 1: Fix CHECKED_IN from past dates → PARTIALLY_COMPLETED ──
    console.log('━━━ STEP 1: Fix Past CHECKED_IN → PARTIALLY_COMPLETED ━━━\n');

    const pastCheckedIn = await prisma.appointment.findMany({
      where: {
        status: 'CHECKED_IN',
        appointmentDate: { lt: startOfTodayIST }
      },
      include: {
        patient: { select: { firstName: true, lastName: true, patientNumber: true } },
        patientVisit: { select: { id: true, status: true } }
      }
    });

    if (pastCheckedIn.length > 0) {
      console.log(`📋 Found ${pastCheckedIn.length} CHECKED_IN appointments from past dates\n`);

      for (const appt of pastCheckedIn) {
        const patientName = `${appt.patient.firstName} ${appt.patient.lastName}`;
        console.log(`  📌 ${patientName} (${appt.patient.patientNumber}) | ${formatIST(appt.appointmentDate)} | Token: ${appt.tokenNumber}`);

        await prisma.appointment.update({
          where: { id: appt.id },
          data: { status: 'PARTIALLY_COMPLETED', isActive: false }
        });

        if (appt.patientVisit) {
          await prisma.patientVisit.update({
            where: { id: appt.patientVisit.id },
            data: { status: 'PARTIALLY_COMPLETED', completedAt: now }
          });
        }

        totalFixed++;
      }

      console.log(`\n✅ Step 1: Fixed ${pastCheckedIn.length} past CHECKED_IN → PARTIALLY_COMPLETED\n`);
    } else {
      console.log('✅ No past CHECKED_IN appointments found\n');
    }

    // ── STEP 2: Fix wrongly DISCONTINUED appointments (recent, within 7 days) ──
    // These are appointments that were wrongly set to DISCONTINUED by the old queue cleanup
    // when they should have been PARTIALLY_COMPLETED
    console.log('━━━ STEP 2: Fix Wrongly DISCONTINUED (Recent, Within 7 Days) ━━━\n');

    const wronglyDiscontinued = await prisma.appointment.findMany({
      where: {
        status: 'DISCONTINUED',
        appointmentDate: {
          gte: sevenDaysBeforeToday,
          lt: startOfTodayIST
        },
        // Must have a visit (means patient checked in)
        patientVisit: {
          isNot: null
        }
      },
      include: {
        patient: { select: { firstName: true, lastName: true, patientNumber: true } },
        patientVisit: {
          select: {
            id: true,
            status: true,
            optometristSeenAt: true,
            doctorSeenAt: true,
            completedAt: true
          }
        }
      },
      orderBy: { appointmentDate: 'desc' }
    });

    if (wronglyDiscontinued.length > 0) {
      console.log(`📋 Found ${wronglyDiscontinued.length} DISCONTINUED appointments within 7 days that had visits\n`);

      // Only revert to PARTIALLY_COMPLETED if the visit was never actually completed
      let revertCount = 0;
      for (const appt of wronglyDiscontinued) {
        const visit = appt.patientVisit;
        
        // Only revert if visit was not actually completed by doctor
        if (visit && visit.status !== 'COMPLETED' && visit.status !== 'DISCHARGED') {
          const patientName = `${appt.patient.firstName} ${appt.patient.lastName}`;
          console.log(`  📌 ${patientName} (${appt.patient.patientNumber}) | ${formatIST(appt.appointmentDate)} | Token: ${appt.tokenNumber} | Visit: ${visit.status}`);

          await prisma.appointment.update({
            where: { id: appt.id },
            data: { status: 'PARTIALLY_COMPLETED', isActive: false }
          });

          if (visit.id) {
            await prisma.patientVisit.update({
              where: { id: visit.id },
              data: { status: 'PARTIALLY_COMPLETED' }
            });
          }

          revertCount++;
          totalFixed++;
        }
      }

      console.log(`\n✅ Step 2: Reverted ${revertCount} wrongly DISCONTINUED → PARTIALLY_COMPLETED\n`);
    } else {
      console.log('✅ No wrongly DISCONTINUED appointments found within 7 days\n');
    }

    // ── STEP 3: Ensure only MOST RECENT incomplete appointment per patient is PARTIALLY_COMPLETED ──
    // Older ones should be DISCONTINUED
    console.log('━━━ STEP 3: Enforce Single PARTIALLY_COMPLETED Per Patient ━━━\n');

    // Find patients with multiple PARTIALLY_COMPLETED appointments
    const patientsWithMultiplePartial = await prisma.$queryRaw`
      SELECT "patientId", COUNT(*) as count
      FROM "appointments"
      WHERE "status" = 'PARTIALLY_COMPLETED'
      GROUP BY "patientId"
      HAVING COUNT(*) > 1
    `;

    if (patientsWithMultiplePartial.length > 0) {
      console.log(`📋 Found ${patientsWithMultiplePartial.length} patients with multiple PARTIALLY_COMPLETED appointments\n`);

      let multiFixCount = 0;

      for (const row of patientsWithMultiplePartial) {
        const patientId = row.patientId;

        // Get all PARTIALLY_COMPLETED appointments for this patient, newest first
        const partialAppts = await prisma.appointment.findMany({
          where: {
            patientId,
            status: 'PARTIALLY_COMPLETED'
          },
          include: {
            patient: { select: { firstName: true, lastName: true, patientNumber: true } },
            patientVisit: { select: { id: true } }
          },
          orderBy: { appointmentDate: 'desc' }
        });

        const patientName = `${partialAppts[0].patient.firstName} ${partialAppts[0].patient.lastName}`;
        console.log(`  👤 ${patientName} (${partialAppts[0].patient.patientNumber}) has ${partialAppts.length} PARTIALLY_COMPLETED appointments`);

        // Keep the newest one as PARTIALLY_COMPLETED, discontinue all older ones
        const newestAppt = partialAppts[0];
        const olderAppts = partialAppts.slice(1);

        console.log(`     ✅ Keeping newest: Token ${newestAppt.tokenNumber} | ${formatIST(newestAppt.appointmentDate)}`);

        for (const oldAppt of olderAppts) {
          console.log(`     🔄 Discontinuing: Token ${oldAppt.tokenNumber} | ${formatIST(oldAppt.appointmentDate)}`);

          await prisma.appointment.update({
            where: { id: oldAppt.id },
            data: { status: 'DISCONTINUED', isActive: false }
          });

          if (oldAppt.patientVisit?.id) {
            await prisma.patientVisit.update({
              where: { id: oldAppt.patientVisit.id },
              data: { status: 'DISCONTINUED', completedAt: now }
            });
          }

          multiFixCount++;
          totalFixed++;
        }
      }

      console.log(`\n✅ Step 3: Discontinued ${multiFixCount} older PARTIALLY_COMPLETED appointments\n`);
    } else {
      console.log('✅ No patients with multiple PARTIALLY_COMPLETED appointments\n');
    }

    // ── STEP 4: Discontinue PARTIALLY_COMPLETED where patient already has a newer appointment ──
    console.log('━━━ STEP 4: Discontinue PARTIALLY_COMPLETED Where Patient Has Newer Appointment ━━━\n');

    const allPartiallyCompleted = await prisma.appointment.findMany({
      where: { status: 'PARTIALLY_COMPLETED' },
      include: {
        patient: { select: { firstName: true, lastName: true, patientNumber: true } },
        patientVisit: { select: { id: true } }
      },
      orderBy: { appointmentDate: 'desc' }
    });

    let newerBookingFixCount = 0;

    for (const partialAppt of allPartiallyCompleted) {
      // Check if this patient has any NEWER appointment (any status except CANCELLED)
      const newerAppointment = await prisma.appointment.findFirst({
        where: {
          patientId: partialAppt.patientId,
          appointmentDate: { gt: partialAppt.appointmentDate },
          status: { notIn: ['CANCELLED'] },
          id: { not: partialAppt.id }
        },
        select: { id: true, tokenNumber: true, appointmentDate: true, status: true }
      });

      if (newerAppointment) {
        const patientName = `${partialAppt.patient.firstName} ${partialAppt.patient.lastName}`;
        console.log(`  📌 ${patientName} (${partialAppt.patient.patientNumber}) | Old: Token ${partialAppt.tokenNumber} (${formatIST(partialAppt.appointmentDate)}) → DISCONTINUED (newer appt Token ${newerAppointment.tokenNumber} exists)`);

        await prisma.appointment.update({
          where: { id: partialAppt.id },
          data: { status: 'DISCONTINUED', isActive: false }
        });

        if (partialAppt.patientVisit?.id) {
          await prisma.patientVisit.update({
            where: { id: partialAppt.patientVisit.id },
            data: { status: 'DISCONTINUED', completedAt: now }
          });
        }

        newerBookingFixCount++;
        totalFixed++;
      }
    }

    if (newerBookingFixCount > 0) {
      console.log(`\n✅ Step 4: Discontinued ${newerBookingFixCount} PARTIALLY_COMPLETED appointments where patient had newer bookings\n`);
    } else {
      console.log('✅ No PARTIALLY_COMPLETED appointments with newer bookings found\n');
    }

    // ── STEP 5: Ensure all terminal statuses have isActive: false ──
    console.log('━━━ STEP 5: Ensure Terminal Statuses Have isActive: false ━━━\n');

    const TERMINAL_STATUSES = ['PARTIALLY_COMPLETED', 'DISCONTINUED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'DISCHARGED'];

    const terminalWithActiveTrue = await prisma.appointment.updateMany({
      where: {
        status: { in: TERMINAL_STATUSES },
        isActive: true
      },
      data: { isActive: false }
    });

    if (terminalWithActiveTrue.count > 0) {
      console.log(`✅ Fixed ${terminalWithActiveTrue.count} terminal appointments with incorrect isActive: true\n`);
      totalFixed += terminalWithActiveTrue.count;
    } else {
      console.log('✅ All terminal statuses already have isActive: false\n');
    }

    // ── STEP 6: Final Verification ──
    console.log('━━━ FINAL VERIFICATION ━━━\n');

    const finalStats = await prisma.appointment.groupBy({
      by: ['status', 'isActive'],
      _count: true,
      orderBy: { status: 'asc' }
    });

    console.log('📊 Final Database State:');
    finalStats.forEach(group => {
      console.log(`   ${group.status} | isActive: ${group.isActive} | count: ${group._count}`);
    });

    const totalActive = await prisma.appointment.count({ where: { isActive: true } });
    console.log(`\n👥 Total patients currently blocked from rebooking: ${totalActive}`);

    // Check for patients with multiple PARTIALLY_COMPLETED
    const multiPartialCheck = await prisma.$queryRaw`
      SELECT "patientId", COUNT(*) as count
      FROM "appointments"
      WHERE "status" = 'PARTIALLY_COMPLETED'
      GROUP BY "patientId"
      HAVING COUNT(*) > 1
    `;

    if (multiPartialCheck.length > 0) {
      console.log(`\n⚠️  WARNING: ${multiPartialCheck.length} patients still have multiple PARTIALLY_COMPLETED appointments`);
    } else {
      console.log('✅ Each patient has at most one PARTIALLY_COMPLETED appointment');
    }

    console.log(`\n🎉 Data Fix Complete! Total records fixed: ${totalFixed}\n`);

  } catch (error) {
    console.error('❌ Error during fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixDataInconsistencies()
  .then(() => { console.log('✅ Script finished'); process.exit(0); })
  .catch((error) => { console.error('❌ Script failed:', error); process.exit(1); });
