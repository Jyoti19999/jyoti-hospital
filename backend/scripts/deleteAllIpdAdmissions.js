const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script to safely delete all IPD admission records and their related data
 * This script deletes records in the correct order to avoid foreign key constraint violations
 */

async function deleteAllIpdAdmissions() {
  console.log('🗑️ Starting IPD Admissions cleanup process...\n');

  try {
    // First, let's check what we have
    const admissionCount = await prisma.ipdAdmission.count();
    console.log(`📊 Found ${admissionCount} IPD admission records to delete\n`);

    if (admissionCount === 0) {
      console.log('✅ No IPD admissions found. Nothing to delete.');
      return;
    }

    // Ask for confirmation
    console.log('⚠️ WARNING: This will permanently delete ALL IPD admission data!');
    console.log('📋 This includes:');
    console.log('   - All IPD admissions');
    console.log('   - All fitness reports');
    console.log('   - All pre-op assessments');
    console.log('   - All surgery metrics');
    console.log('   - All fitness investigation results');
    console.log('   - All stock transactions related to surgeries');
    console.log('   - All payments related to IPD admissions\n');

    console.log('🔥 Starting deletion process...\n');

    // Start transaction to ensure all-or-nothing deletion
    await prisma.$transaction(async (tx) => {
      // Step 1: Delete FitnessReport records
      console.log('1️⃣ Deleting fitness reports...');
      const fitnessReportsCount = await tx.fitnessReport.count();
      if (fitnessReportsCount > 0) {
        const deletedFitness = await tx.fitnessReport.deleteMany({});
        console.log(`   ✅ Deleted ${deletedFitness.count} fitness reports`);
      } else {
        console.log('   ✅ No fitness reports to delete');
      }

      // Step 2: Delete PreOpAssessment records
      console.log('2️⃣ Deleting pre-op assessments...');
      const preOpCount = await tx.preOpAssessment.count();
      if (preOpCount > 0) {
        const deletedPreOp = await tx.preOpAssessment.deleteMany({});
        console.log(`   ✅ Deleted ${deletedPreOp.count} pre-op assessments`);
      } else {
        console.log('   ✅ No pre-op assessments to delete');
      }

      // Step 3: Delete SurgeryMetrics records
      console.log('3️⃣ Deleting surgery metrics...');
      const surgeryMetricsCount = await tx.surgeryMetrics.count();
      if (surgeryMetricsCount > 0) {
        const deletedMetrics = await tx.surgeryMetrics.deleteMany({});
        console.log(`   ✅ Deleted ${deletedMetrics.count} surgery metrics`);
      } else {
        console.log('   ✅ No surgery metrics to delete');
      }

      // Step 4: Delete FitnessInvestigationResult records
      console.log('4️⃣ Deleting fitness investigation results...');
      const investigationCount = await tx.fitnessInvestigationResult.count();
      if (investigationCount > 0) {
        const deletedInvestigation = await tx.fitnessInvestigationResult.deleteMany({});
        console.log(`   ✅ Deleted ${deletedInvestigation.count} fitness investigation results`);
      } else {
        console.log('   ✅ No fitness investigation results to delete');
      }

      // Step 5: Delete StockTransaction records related to IPD admissions
      console.log('5️⃣ Deleting stock transactions...');
      const stockTransactionCount = await tx.stockTransaction.count({
        where: {
          ipdAdmissionId: { not: null }
        }
      });
      if (stockTransactionCount > 0) {
        const deletedStock = await tx.stockTransaction.deleteMany({
          where: {
            ipdAdmissionId: { not: null }
          }
        });
        console.log(`   ✅ Deleted ${deletedStock.count} stock transactions`);
      } else {
        console.log('   ✅ No stock transactions to delete');
      }

      // Step 6: Delete Payment records related to IPD admissions
      console.log('6️⃣ Deleting payments...');
      const paymentCount = await tx.payment.count({
        where: {
          ipdAdmissionId: { not: null }
        }
      });
      if (paymentCount > 0) {
        const deletedPayments = await tx.payment.deleteMany({
          where: {
            ipdAdmissionId: { not: null }
          }
        });
        console.log(`   ✅ Deleted ${deletedPayments.count} payments`);
      } else {
        console.log('   ✅ No payments to delete');
      }

      // Step 7: Finally, delete IPD admissions
      console.log('7️⃣ Deleting IPD admissions...');
      const deletedAdmissions = await tx.ipdAdmission.deleteMany({});
      console.log(`   ✅ Deleted ${deletedAdmissions.count} IPD admissions`);

      console.log('\n🎉 All IPD admission data deleted successfully!');
    });

    // Final verification
    const remainingCount = await prisma.ipdAdmission.count();
    console.log(`\n📊 Verification: ${remainingCount} IPD admissions remaining (should be 0)`);

    if (remainingCount === 0) {
      console.log('✅ Cleanup completed successfully!');
    } else {
      console.log('⚠️ Warning: Some records may still exist');
    }

  } catch (error) {
    console.error('❌ Error during IPD admissions cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function showRelatedCounts() {
  console.log('📊 Current IPD-related record counts:');
  
  try {
    const counts = await prisma.$transaction(async (tx) => {
      return {
        ipdAdmissions: await tx.ipdAdmission.count(),
        fitnessReports: await tx.fitnessReport.count(),
        preOpAssessments: await tx.preOpAssessment.count(), 
        surgeryMetrics: await tx.surgeryMetrics.count(),
        fitnessInvestigationResults: await tx.fitnessInvestigationResult.count(),
        stockTransactions: await tx.stockTransaction.count({
          where: { ipdAdmissionId: { not: null } }
        }),
        payments: await tx.payment.count({
          where: { ipdAdmissionId: { not: null } }
        })
      };
    });

    console.log(`   IPD Admissions: ${counts.ipdAdmissions}`);
    console.log(`   Fitness Reports: ${counts.fitnessReports}`);
    console.log(`   Pre-Op Assessments: ${counts.preOpAssessments}`);
    console.log(`   Surgery Metrics: ${counts.surgeryMetrics}`);
    console.log(`   Fitness Investigation Results: ${counts.fitnessInvestigationResults}`);
    console.log(`   Stock Transactions (IPD): ${counts.stockTransactions}`);
    console.log(`   Payments (IPD): ${counts.payments}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error getting counts:', error);
  }
}

// Main execution
async function main() {
  if (process.argv.includes('--show-counts')) {
    await showRelatedCounts();
    return;
  }

  await showRelatedCounts();
  await deleteAllIpdAdmissions();
}

// Run the script
main()
  .catch(console.error)
  .finally(() => process.exit(0));