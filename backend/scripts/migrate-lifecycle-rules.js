/**
 * MIGRATION SCRIPT: Apply IST date-based lifecycle rules to existing appointments
 * 
 * This script applies the correct isActive + status transitions:
 * 
 * 1. SCHEDULED + appointmentDate < today (IST) → NO_SHOW, isActive: false
 * 2. SCHEDULED + appointmentDate >= today (IST) → SCHEDULED, isActive: true
 * 3. CHECKED_IN → isActive: true (always, lifecycle cron handles transitions)
 * 4. PARTIALLY_COMPLETED + appointmentDate < (today - 7 days) → DISCONTINUED, isActive: false
 * 5. PARTIALLY_COMPLETED + appointmentDate >= (today - 7 days) → isActive: true (resumable)
 * 6. COMPLETED, DISCONTINUED, CANCELLED, NO_SHOW → isActive: false
 * 7. RESCHEDULED → isActive: true
 * 
 * Run this ONCE after deploying the IST date-based lifecycle changes.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getStartOfTodayIST() {
  const now = new Date();
  const istDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const [year, month, day] = istDateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - (5 * 60 + 30) * 60 * 1000);
}

function getSevenDaysBeforeTodayIST() {
  const startOfToday = getStartOfTodayIST();
  return new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
}

function formatIST(date) {
  return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
}

async function migrateLifecycleRules() {
  const startOfTodayIST = getStartOfTodayIST();
  const sevenDaysCutoff = getSevenDaysBeforeTodayIST();

  console.log('🚀 Starting IST date-based lifecycle migration...\n');
  console.log(`📅 Start of today (IST): ${formatIST(startOfTodayIST)}`);
  console.log(`📅 7-day cutoff (IST): ${formatIST(sevenDaysCutoff)}\n`);

  try {
    // Step 0: Show current state
    const totalAppointments = await prisma.appointment.count();
    console.log(`📊 Total appointments: ${totalAppointments}\n`);

    const stateCounts = await prisma.$queryRaw`
      SELECT status, "isActive", COUNT(*)::int as count 
      FROM "appointments" 
      GROUP BY status, "isActive" 
      ORDER BY status, "isActive"
    `;
    console.log('📋 Current state (status + isActive):');
    stateCounts.forEach(r => {
      console.log(`   ${r.status} | isActive: ${r.isActive} | count: ${r.count}`);
    });
    console.log('');

    // ═══════════════════════════════════════════════════════════
    // Step 1: SCHEDULED + past date → NO_SHOW, isActive: false
    // ═══════════════════════════════════════════════════════════
    const pastScheduled = await prisma.appointment.findMany({
      where: {
        status: 'SCHEDULED',
        appointmentDate: { lt: startOfTodayIST }
      },
      select: {
        id: true, patientId: true, appointmentDate: true, tokenNumber: true,
        patient: { select: { patientNumber: true, firstName: true, lastName: true } }
      }
    });

    if (pastScheduled.length > 0) {
      console.log(`🔄 Step 1: ${pastScheduled.length} SCHEDULED appointments from past dates → NO_SHOW`);
      pastScheduled.forEach(a => {
        console.log(`   Token ${a.tokenNumber} | ${a.patient.patientNumber} ${a.patient.firstName} ${a.patient.lastName} | ${formatIST(a.appointmentDate)}`);
      });

      const result = await prisma.appointment.updateMany({
        where: { id: { in: pastScheduled.map(a => a.id) } },
        data: { status: 'NO_SHOW', isActive: false }
      });
      console.log(`   ✅ Updated: ${result.count} → NO_SHOW, isActive: false\n`);
    } else {
      console.log('✅ Step 1: No past-date SCHEDULED appointments found\n');
    }

    // ═══════════════════════════════════════════════════════════
    // Step 2: SCHEDULED + today/future → isActive: true
    // ═══════════════════════════════════════════════════════════
    const futureScheduled = await prisma.appointment.updateMany({
      where: {
        status: 'SCHEDULED',
        appointmentDate: { gte: startOfTodayIST },
        isActive: false
      },
      data: { isActive: true }
    });
    console.log(`✅ Step 2: ${futureScheduled.count} SCHEDULED (today/future) → isActive: true\n`);

    // ═══════════════════════════════════════════════════════════
    // Step 3: CHECKED_IN → isActive: true
    // ═══════════════════════════════════════════════════════════
    const checkedInActivated = await prisma.appointment.updateMany({
      where: { status: 'CHECKED_IN', isActive: false },
      data: { isActive: true }
    });
    console.log(`✅ Step 3: ${checkedInActivated.count} CHECKED_IN → isActive: true\n`);

    // ═══════════════════════════════════════════════════════════
    // Step 4: RESCHEDULED → isActive: true
    // ═══════════════════════════════════════════════════════════
    const rescheduledActivated = await prisma.appointment.updateMany({
      where: { status: 'RESCHEDULED', isActive: false },
      data: { isActive: true }
    });
    console.log(`✅ Step 4: ${rescheduledActivated.count} RESCHEDULED → isActive: true\n`);

    // ═══════════════════════════════════════════════════════════
    // Step 5: PARTIALLY_COMPLETED + older than 7 days → DISCONTINUED, isActive: false
    // ═══════════════════════════════════════════════════════════
    const oldPartial = await prisma.appointment.findMany({
      where: {
        status: 'PARTIALLY_COMPLETED',
        appointmentDate: { lt: sevenDaysCutoff }
      },
      select: {
        id: true, patientId: true, appointmentDate: true, tokenNumber: true,
        patient: { select: { patientNumber: true, firstName: true, lastName: true } }
      }
    });

    if (oldPartial.length > 0) {
      console.log(`🔄 Step 5: ${oldPartial.length} PARTIALLY_COMPLETED (7+ days old) → DISCONTINUED`);
      oldPartial.forEach(a => {
        console.log(`   Token ${a.tokenNumber} | ${a.patient.patientNumber} ${a.patient.firstName} ${a.patient.lastName} | ${formatIST(a.appointmentDate)}`);
      });

      // Also update corresponding visits
      const aptIds = oldPartial.map(a => a.id);
      
      await prisma.$transaction(async (tx) => {
        await tx.appointment.updateMany({
          where: { id: { in: aptIds } },
          data: { status: 'DISCONTINUED', isActive: false }
        });

        // Update corresponding PatientVisit records too
        await tx.patientVisit.updateMany({
          where: {
            appointmentId: { in: aptIds },
            status: 'PARTIALLY_COMPLETED'
          },
          data: { status: 'DISCONTINUED', completedAt: new Date() }
        });
      });

      console.log(`   ✅ Updated: ${oldPartial.length} → DISCONTINUED, isActive: false\n`);
    } else {
      console.log('✅ Step 5: No old PARTIALLY_COMPLETED appointments found\n');
    }

    // ═══════════════════════════════════════════════════════════
    // Step 6: PARTIALLY_COMPLETED + within 7 days → isActive: true (resumable)
    // ═══════════════════════════════════════════════════════════
    const recentPartial = await prisma.appointment.updateMany({
      where: {
        status: 'PARTIALLY_COMPLETED',
        appointmentDate: { gte: sevenDaysCutoff },
        isActive: false
      },
      data: { isActive: true }
    });
    console.log(`✅ Step 6: ${recentPartial.count} PARTIALLY_COMPLETED (within 7 days) → isActive: true (resumable)\n`);

    // ═══════════════════════════════════════════════════════════
    // Step 7: Terminal statuses → isActive: false
    // ═══════════════════════════════════════════════════════════
    const terminalDeactivated = await prisma.appointment.updateMany({
      where: {
        status: { in: ['COMPLETED', 'DISCONTINUED', 'CANCELLED', 'NO_SHOW'] },
        isActive: true
      },
      data: { isActive: false }
    });
    console.log(`✅ Step 7: ${terminalDeactivated.count} terminal-status appointments → isActive: false\n`);

    // ═══════════════════════════════════════════════════════════
    // Final summary
    // ═══════════════════════════════════════════════════════════
    const finalCounts = await prisma.$queryRaw`
      SELECT status, "isActive", COUNT(*)::int as count 
      FROM "appointments" 
      GROUP BY status, "isActive" 
      ORDER BY status, "isActive"
    `;
    console.log('📊 Final state (status + isActive):');
    finalCounts.forEach(r => {
      console.log(`   ${r.status} | isActive: ${r.isActive} | count: ${r.count}`);
    });
    console.log('');

    // Show currently blocked patients
    const blockedPatients = await prisma.appointment.findMany({
      where: { isActive: true },
      select: {
        status: true,
        appointmentDate: true,
        tokenNumber: true,
        patient: {
          select: { patientNumber: true, firstName: true, lastName: true }
        }
      },
      orderBy: { appointmentDate: 'desc' }
    });

    console.log(`👥 Patients currently blocked from rebooking (${blockedPatients.length}):`);
    blockedPatients.forEach(a => {
      console.log(`   ${a.patient.patientNumber} - ${a.patient.firstName} ${a.patient.lastName} | ${a.status} | Token ${a.tokenNumber} | ${formatIST(a.appointmentDate)}`);
    });

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateLifecycleRules()
  .then(() => {
    console.log('✅ Script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
