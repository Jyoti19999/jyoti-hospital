/**
 * MIGRATION SCRIPT: Set isActive field for existing appointments
 * 
 * Purpose: After adding the isActive field to the Appointment schema,
 * all existing appointments have isActive = false by default.
 * This script updates existing appointments to set isActive = true
 * for appointments that are currently in an active state.
 * 
 * Active appointments are those with status:
 * - SCHEDULED
 * - CHECKED_IN
 * - RESCHEDULED
 * 
 * Inactive appointments (completed/discontinued):
 * - COMPLETED
 * - DISCONTINUED
 * - PARTIALLY_COMPLETED
 * - CANCELED
 * 
 * Run this once after adding the isActive field to sync existing data.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ACTIVE_STATUSES = ['SCHEDULED', 'CHECKED_IN', 'RESCHEDULED', 'PARTIALLY_COMPLETED'];
const INACTIVE_STATUSES = ['COMPLETED', 'DISCONTINUED', 'CANCELLED', 'NO_SHOW', 'DISCHARGED'];

async function migrateIsActiveField() {
  console.log('🚀 Starting isActive field migration...\n');

  try {
    // Step 1: Count current state
    const totalAppointments = await prisma.appointment.count();
    console.log(`📊 Total appointments in database: ${totalAppointments}`);

    const currentlyActive = await prisma.appointment.count({
      where: { isActive: true }
    });
    console.log(`✅ Appointments already marked active: ${currentlyActive}`);

    const currentlyInactive = await prisma.appointment.count({
      where: { isActive: false }
    });
    console.log(`❌ Appointments currently marked inactive: ${currentlyInactive}\n`);

    // Step 2: Analyze appointments by status
    console.log('📋 Appointments by status:');
    for (const status of [...ACTIVE_STATUSES, ...INACTIVE_STATUSES]) {
      const count = await prisma.appointment.count({
        where: { status }
      });
      if (count > 0) {
        console.log(`   ${status}: ${count}`);
      }
    }
    console.log('');

    // Step 3: Find appointments that should be active but are marked inactive
    const needActivation = await prisma.appointment.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        isActive: false
      },
      select: {
        id: true,
        status: true,
        patientId: true,
        appointmentDate: true,
        tokenNumber: true
      }
    });

    console.log(`🔍 Found ${needActivation.length} appointments that need isActive = true\n`);

    if (needActivation.length > 0) {
      console.log('📝 Appointments to be updated:');
      needActivation.forEach(apt => {
        const date = new Date(apt.appointmentDate).toLocaleDateString('en-IN');
        console.log(`   Token ${apt.tokenNumber} | ${apt.status} | ${date} | Patient: ${apt.patientId.substring(0, 8)}...`);
      });
      console.log('');
    }

    // Step 4: Find appointments that should be inactive but are marked active
    const needDeactivation = await prisma.appointment.findMany({
      where: {
        status: { in: INACTIVE_STATUSES },
        isActive: true
      },
      select: {
        id: true,
        status: true,
        patientId: true,
        appointmentDate: true,
        tokenNumber: true
      }
    });

    console.log(`🔍 Found ${needDeactivation.length} appointments that need isActive = false\n`);

    if (needDeactivation.length > 0) {
      console.log('📝 Appointments to be deactivated:');
      needDeactivation.forEach(apt => {
        const date = new Date(apt.appointmentDate).toLocaleDateString('en-IN');
        console.log(`   Token ${apt.tokenNumber} | ${apt.status} | ${date} | Patient: ${apt.patientId.substring(0, 8)}...`);
      });
      console.log('');
    }

    // Step 5: Perform migration in a transaction
    console.log('🔄 Performing migration...\n');

    const result = await prisma.$transaction(async (tx) => {
      // Activate appointments with active statuses
      const activatedCount = await tx.appointment.updateMany({
        where: {
          status: { in: ACTIVE_STATUSES },
          isActive: false
        },
        data: {
          isActive: true
        }
      });

      // Deactivate appointments with inactive statuses
      const deactivatedCount = await tx.appointment.updateMany({
        where: {
          status: { in: INACTIVE_STATUSES },
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      return {
        activated: activatedCount.count,
        deactivated: deactivatedCount.count
      };
    });

    console.log('✅ Migration completed successfully!\n');
    console.log(`📊 Results:`);
    console.log(`   ✅ Activated: ${result.activated} appointments`);
    console.log(`   ❌ Deactivated: ${result.deactivated} appointments`);
    console.log('');

    // Step 6: Verify final state
    const finalActive = await prisma.appointment.count({
      where: { isActive: true }
    });
    const finalInactive = await prisma.appointment.count({
      where: { isActive: false }
    });

    console.log('📊 Final state:');
    console.log(`   ✅ Active appointments: ${finalActive}`);
    console.log(`   ❌ Inactive appointments: ${finalInactive}`);
    console.log(`   📈 Total: ${finalActive + finalInactive}\n`);

    // Step 7: Show patients with active appointments
    const patientsWithActiveAppointments = await prisma.appointment.findMany({
      where: { isActive: true },
      select: {
        patientId: true,
        status: true,
        appointmentDate: true,
        tokenNumber: true,
        patient: {
          select: {
            patientNumber: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        appointmentDate: 'desc'
      }
    });

    if (patientsWithActiveAppointments.length > 0) {
      console.log('👥 Patients currently blocked from booking (have active appointments):');
      patientsWithActiveAppointments.forEach(apt => {
        const date = new Date(apt.appointmentDate).toLocaleDateString('en-IN');
        console.log(`   ${apt.patient.patientNumber} - ${apt.patient.firstName} ${apt.patient.lastName} | Token ${apt.tokenNumber} | ${apt.status} | ${date}`);
      });
      console.log('');
    }

    console.log('🎉 Migration script completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateIsActiveField()
  .then(() => {
    console.log('✅ Script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
