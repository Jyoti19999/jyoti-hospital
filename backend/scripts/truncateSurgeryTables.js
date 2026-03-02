// Script to truncate surgery-related tables and clear all data
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function truncateSurgeryTables() {
  console.log('🗑️ Starting surgery tables truncation...');
  
  try {
    // Start a transaction to ensure all operations complete or fail together
    await prisma.$transaction(async (tx) => {
      
      console.log('📋 Step 1: Getting current data counts...');
      
      // Get current counts
      const counts = {
        lensPackages: await tx.lensPackage.count(),
        surgeryPackages: await tx.surgeryPackage.count(),
        lenses: await tx.lens.count(),
        surgeryTypes: await tx.surgeryType.count(),
        fitnessInvestigations: await tx.fitnessInvestigation.count(),
        fitnessResults: await tx.fitnessInvestigationResult.count(),
        fitnessRequirements: await tx.surgeryFitnessRequirement.count()
      };
      
      console.log('📊 Current data counts:');
      Object.entries(counts).forEach(([table, count]) => {
        console.log(`  - ${table}: ${count} records`);
      });
      
      if (Object.values(counts).every(count => count === 0)) {
        console.log('ℹ️ All tables are already empty.');
        return;
      }
      
      console.log('\n🔄 Step 2: Deleting all surgery-related data...');
      
      // Delete in correct order to avoid foreign key constraints
      
      // 1. Delete LensPackage (references both Lens and SurgeryPackage)
      console.log('🗑️ Deleting LensPackage records...');
      const deletedLensPackages = await tx.lensPackage.deleteMany();
      console.log(`   ✅ Deleted ${deletedLensPackages.count} LensPackage records`);
      
      // 2. Delete FitnessInvestigationResult (references IPD admissions)
      console.log('🗑️ Deleting FitnessInvestigationResult records...');
      const deletedFitnessResults = await tx.fitnessInvestigationResult.deleteMany();
      console.log(`   ✅ Deleted ${deletedFitnessResults.count} FitnessInvestigationResult records`);
      
      // 3. Delete SurgeryPackage (references SurgeryType and Lens)
      console.log('🗑️ Deleting SurgeryPackage records...');
      const deletedSurgeryPackages = await tx.surgeryPackage.deleteMany();
      console.log(`   ✅ Deleted ${deletedSurgeryPackages.count} SurgeryPackage records`);
      
      // 4. Delete Lens (referenced by SurgeryPackage and SurgeryMetrics)
      console.log('🗑️ Deleting Lens records...');
      const deletedLenses = await tx.lens.deleteMany();
      console.log(`   ✅ Deleted ${deletedLenses.count} Lens records`);
      
      // 5. Delete FitnessInvestigation (no longer has junction table dependencies)
      console.log('🗑️ Deleting FitnessInvestigation records...');
      const deletedFitnessInvestigations = await tx.fitnessInvestigation.deleteMany();
      console.log(`   ✅ Deleted ${deletedFitnessInvestigations.count} FitnessInvestigation records`);
      
      // 6. Update IPD admissions to remove surgery type references
      console.log('🗑️ Clearing SurgeryType references from IPD admissions...');
      const clearedIpdAdmissions = await tx.ipdAdmission.updateMany({
        where: { surgeryTypeId: { not: null } },
        data: { surgeryTypeId: null }
      });
      console.log(`   ✅ Cleared surgery type from ${clearedIpdAdmissions.count} IPD admission records`);
      
      // 7. Delete SurgeryFitnessRequirement (deprecated table with FK to SurgeryType)
      console.log('🗑️ Deleting SurgeryFitnessRequirement records...');
      const deletedFitnessRequirements = await tx.surgeryFitnessRequirement.deleteMany();
      console.log(`   ✅ Deleted ${deletedFitnessRequirements.count} SurgeryFitnessRequirement records`);
      
      // 8. Update ophthalmologist examinations to remove surgery type references  
      console.log('🗑️ Clearing SurgeryType references from ophthalmologist examinations...');
      const clearedExaminations = await tx.ophthalmologistExamination.updateMany({
        where: { surgeryTypeId: { not: null } },
        data: { surgeryTypeId: null }
      });
      console.log(`   ✅ Cleared surgery type from ${clearedExaminations.count} examination records`);
      
      // 9. Delete SurgeryType (main table)
      console.log('🗑️ Deleting SurgeryType records...');
      const deletedSurgeryTypes = await tx.surgeryType.deleteMany();
      console.log(`   ✅ Deleted ${deletedSurgeryTypes.count} SurgeryType records`);
      
      console.log('\n📊 Step 3: Verifying truncation...');
      
      // Verify all tables are empty
      const finalCounts = {
        lensPackages: await tx.lensPackage.count(),
        surgeryPackages: await tx.surgeryPackage.count(), 
        lenses: await tx.lens.count(),
        surgeryTypes: await tx.surgeryType.count(),
        fitnessInvestigations: await tx.fitnessInvestigation.count(),
        fitnessResults: await tx.fitnessInvestigationResult.count(),
        fitnessRequirements: await tx.surgeryFitnessRequirement.count()
      };
      
      console.log('📋 Final counts after truncation:');
      Object.entries(finalCounts).forEach(([table, count]) => {
        const status = count === 0 ? '✅' : '❌';
        console.log(`  ${status} ${table}: ${count} records`);
      });
      
      const allEmpty = Object.values(finalCounts).every(count => count === 0);
      
      if (allEmpty) {
        console.log('\n🎉 All surgery-related tables successfully truncated!');
      } else {
        throw new Error('Some tables still contain data after truncation attempt');
      }
    });
    
    console.log('\n✅ Surgery tables truncation completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - All SurgeryType records deleted');
    console.log('   - All SurgeryPackage records deleted');
    console.log('   - All Lens records deleted');
    console.log('   - All LensPackage records deleted');
    console.log('   - All FitnessInvestigation records deleted');
    console.log('   - All FitnessInvestigationResult records deleted');
    console.log('   - IPD admission references cleared');
    console.log('   - Ophthalmologist examination references cleared');
    console.log('\n🚀 Ready for fresh data seeding!');
    
  } catch (error) {
    console.error('❌ Error truncating surgery tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Add safety confirmation in production
async function confirmTruncation() {
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ WARNING: This will delete ALL surgery-related data!');
    console.log('⚠️ This operation cannot be undone!');
    console.log('⚠️ Make sure you have a backup if needed.');
    
    // In production, you might want to add manual confirmation
    // For now, we'll proceed but log the warning
  }
  
  return truncateSurgeryTables();
}

// Run the truncation
if (require.main === module) {
  confirmTruncation()
    .then(() => {
      console.log('\n🎯 Truncation process completed successfully!');
      console.log('💡 You can now run your data seeding script.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Truncation process failed:', error.message);
      console.error('\n🔍 Details:', error);
      process.exit(1);
    });
}

module.exports = { truncateSurgeryTables, confirmTruncation };