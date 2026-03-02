/**
 * Script to delete ALL patient records and their related data
 * WARNING: This will permanently delete ALL patients and their associated records
 * 
 * Usage: node scripts/delete-all-patients.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAllPatients() {
  console.log('🚨 WARNING: This will delete ALL patient records and related data');
  console.log('Starting deletion process in 5 seconds...');
  
  // Wait 5 seconds to allow cancellation
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n📊 Starting Patient Data Deletion...\n');

  try {
    const startTime = Date.now();

    // Get count of patients before deletion
    const patientCount = await prisma.patient.count();
    console.log(`Found ${patientCount} patients to delete\n`);

    if (patientCount === 0) {
      console.log('✅ No patients found. Nothing to delete.');
      return;
    }

    // Use a transaction to ensure all deletes happen atomically
    await prisma.$transaction(async (tx) => {
      
      // First, get all patient IDs to use in queries
      const allPatients = await tx.patient.findMany({
        select: { id: true }
      });
      const patientIds = allPatients.map(p => p.id);
      
      console.log(`Processing ${patientIds.length} patients...\n`);

      // 1. Delete Stock Transactions related to IPD Admissions
      console.log('🗑️  Deleting stock transactions...');
      const stockTrans = await tx.stockTransaction.deleteMany({
        where: {
          ipdAdmissionId: { not: null }
        }
      });
      console.log(`   ✓ Deleted ${stockTrans.count} stock transaction records`);

      // 2. Delete Surgery Metrics (related to IPD Admissions)
      console.log('🗑️  Deleting surgery metrics...');
      const surgeryMetrics = await tx.surgeryMetrics.deleteMany({});
      console.log(`   ✓ Deleted ${surgeryMetrics.count} surgery metrics records`);

      // 3. Delete Pre-Op Assessments (related to IPD Admissions)
      console.log('🗑️  Deleting pre-op assessments...');
      const preOpAssessments = await tx.preOpAssessment.deleteMany({});
      console.log(`   ✓ Deleted ${preOpAssessments.count} pre-op assessment records`);

      // 4. Delete Fitness Reports (related to IPD Admissions)
      console.log('🗑️  Deleting fitness reports...');
      const fitnessReports = await tx.fitnessReport.deleteMany({});
      console.log(`   ✓ Deleted ${fitnessReports.count} fitness report records`);

      // 5. Delete Fitness Investigation Results (related to IPD Admissions)
      console.log('🗑️  Deleting fitness investigation results...');
      const fitnessResults = await tx.fitnessInvestigationResult.deleteMany({});
      console.log(`   ✓ Deleted ${fitnessResults.count} fitness investigation result records`);

      // 6. Delete IPD Admissions
      console.log('🗑️  Deleting IPD admissions...');
      const ipdAdmissions = await tx.ipdAdmission.deleteMany({});
      console.log(`   ✓ Deleted ${ipdAdmissions.count} IPD admission records`);

      // 7. Delete Prescription Items (through Prescriptions)
      console.log('🗑️  Deleting prescription items...');
      const prescriptionItems = await tx.prescriptionItem.deleteMany({});
      console.log(`   ✓ Deleted ${prescriptionItems.count} prescription item records`);

      // 8. Delete Prescriptions
      console.log('🗑️  Deleting prescriptions...');
      const prescriptions = await tx.prescription.deleteMany({});
      console.log(`   ✓ Deleted ${prescriptions.count} prescription records`);

      // 9. Delete Diagnoses
      console.log('🗑️  Deleting diagnoses...');
      const diagnoses = await tx.diagnosis.deleteMany({});
      console.log(`   ✓ Deleted ${diagnoses.count} diagnosis records`);

      // 10. Delete Examinations
      console.log('🗑️  Deleting examinations...');
      const examinations = await tx.examination.deleteMany({});
      console.log(`   ✓ Deleted ${examinations.count} examination records`);

      // 11. Delete Ophthalmologist Examinations
      console.log('🗑️  Deleting ophthalmologist examinations...');
      const ophthalmologistExams = await tx.ophthalmologistExamination.deleteMany({});
      console.log(`   ✓ Deleted ${ophthalmologistExams.count} ophthalmologist examination records`);

      // 12. Delete Optometrist Examinations
      console.log('🗑️  Deleting optometrist examinations...');
      const optometristExams = await tx.optometristExamination.deleteMany({});
      console.log(`   ✓ Deleted ${optometristExams.count} optometrist examination records`);

      // 13. Delete Patient Queue entries
      console.log('🗑️  Deleting patient queue entries...');
      const patientQueue = await tx.patientQueue.deleteMany({});
      console.log(`   ✓ Deleted ${patientQueue.count} patient queue records`);

      // 14. Delete Patient Visits
      console.log('🗑️  Deleting patient visits...');
      const patientVisits = await tx.patientVisit.deleteMany({});
      console.log(`   ✓ Deleted ${patientVisits.count} patient visit records`);

      // 15. Delete Bill Items
      console.log('🗑️  Deleting bill items...');
      const billItems = await tx.billItem.deleteMany({});
      console.log(`   ✓ Deleted ${billItems.count} bill item records`);

      // 16. Delete Payments
      console.log('🗑️  Deleting payments...');
      const payments = await tx.payment.deleteMany({});
      console.log(`   ✓ Deleted ${payments.count} payment records`);

      // 17. Delete Bills
      console.log('🗑️  Deleting bills...');
      const bills = await tx.bill.deleteMany({});
      console.log(`   ✓ Deleted ${bills.count} bill records`);

      // 18. Delete Insurance Claims
      console.log('🗑️  Deleting insurance claims...');
      const insuranceClaims = await tx.insuranceClaim.deleteMany({});
      console.log(`   ✓ Deleted ${insuranceClaims.count} insurance claim records`);

      // 19. Delete Appointments
      console.log('🗑️  Deleting appointments...');
      const appointments = await tx.appointment.deleteMany({});
      console.log(`   ✓ Deleted ${appointments.count} appointment records`);

      // 20. Clear Bed assignments
      console.log('🗑️  Clearing bed assignments...');
      const beds = await tx.bed.updateMany({
        where: {
          patientId: { not: null }
        },
        data: {
          patientId: null,
          admissionDate: null,
          expectedDischargeDate: null,
          status: 'available'
        }
      });
      console.log(`   ✓ Cleared ${beds.count} bed assignments`);

      // 21. Finally, delete all Patient records (including self-referrals)
      console.log('🗑️  Deleting patient records...');
      // First, clear all referredBy fields to avoid foreign key constraint
      await tx.patient.updateMany({
        where: {
          referredBy: { not: null }
        },
        data: {
          referredBy: null
        }
      });
      
      // Now delete all patients
      const patients = await tx.patient.deleteMany({});
      console.log(`   ✓ Deleted ${patients.count} patient records`);

    }, {
      timeout: 300000, // 5 minutes timeout for large datasets
      maxWait: 300000
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n✅ Patient data deletion completed successfully!');
    console.log(`⏱️  Total time taken: ${duration} seconds`);
    console.log(`🗑️  Total patients deleted: ${patientCount}`);
    console.log('\n📊 Database is now clean of all patient data.');

  } catch (error) {
    console.error('\n❌ Error during deletion:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deletion
deleteAllPatients()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
