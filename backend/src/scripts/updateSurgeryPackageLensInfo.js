const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script to update surgery packages with random lens information
 * - Checks all surgery packages for missing defaultLensId and defaultLensName
 * - Assigns random lens information from available lenses
 */
async function updateSurgeryPackageLensInfo() {
  try {
    console.log('🚀 Starting surgery package lens info update script...');

    // Get all surgery packages
    const surgeryPackages = await prisma.surgeryPackage.findMany({
      select: {
        id: true,
        packageName: true,
        defaultLensId: true,
        defaultLensName: true
      }
    });

    console.log(`📋 Found ${surgeryPackages.length} surgery packages`);

    // Get all available lenses
    const availableLenses = await prisma.lens.findMany({
      where: {
        isActive: true,
        isAvailable: true
      },
      select: {
        id: true,
        lensName: true
      }
    });

    console.log(`👁️ Found ${availableLenses.length} available lenses`);

    if (availableLenses.length === 0) {
      console.log('❌ No available lenses found. Cannot update surgery packages.');
      return;
    }

    // Filter packages that need lens assignment
    const packagesNeedingLensInfo = surgeryPackages.filter(pkg => 
      !pkg.defaultLensId || !pkg.defaultLensName
    );

    console.log(`🔍 Found ${packagesNeedingLensInfo.length} packages needing lens assignment`);

    if (packagesNeedingLensInfo.length === 0) {
      console.log('✅ All surgery packages already have lens information assigned!');
      return;
    }

    // Update packages with random lens assignment
    const updatePromises = packagesNeedingLensInfo.map(async (pkg) => {
      // Get random lens
      const randomIndex = Math.floor(Math.random() * availableLenses.length);
      const selectedLens = availableLenses[randomIndex];

      console.log(`🔄 Updating package "${pkg.packageName}" with lens "${selectedLens.lensName}"`);

      return prisma.surgeryPackage.update({
        where: { id: pkg.id },
        data: {
          defaultLensId: selectedLens.id,
          defaultLensName: selectedLens.lensName
        }
      });
    });

    // Execute all updates
    const results = await Promise.all(updatePromises);

    console.log(`✅ Successfully updated ${results.length} surgery packages with lens information!`);

    // Show summary
    console.log('\n📊 Update Summary:');
    console.log(`   - Total packages checked: ${surgeryPackages.length}`);
    console.log(`   - Packages updated: ${results.length}`);
    console.log(`   - Packages already had lens info: ${surgeryPackages.length - packagesNeedingLensInfo.length}`);
    
    // Verify the updates
    const updatedPackages = await prisma.surgeryPackage.findMany({
      where: {
        id: { in: packagesNeedingLensInfo.map(pkg => pkg.id) }
      },
      select: {
        packageName: true,
        defaultLensName: true
      }
    });

    console.log('\n🔍 Verification - Updated packages:');
    updatedPackages.forEach(pkg => {
      console.log(`   - ${pkg.packageName} → ${pkg.defaultLensName}`);
    });

  } catch (error) {
    console.error('❌ Error updating surgery package lens info:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Function to run the script with dry-run option
 */
async function runScript(dryRun = false) {
  try {
    console.log('🏥 Surgery Package Lens Info Update Script');
    console.log('==========================================');
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
      
      // Show what would be updated without making changes
      const surgeryPackages = await prisma.surgeryPackage.findMany({
        select: {
          id: true,
          packageName: true,
          defaultLensId: true,
          defaultLensName: true
        }
      });

      const packagesNeedingUpdate = surgeryPackages.filter(pkg => 
        !pkg.defaultLensId || !pkg.defaultLensName
      );

      console.log(`📋 Would update ${packagesNeedingUpdate.length} packages:`);
      packagesNeedingUpdate.forEach(pkg => {
        console.log(`   - ${pkg.packageName}`);
      });
    } else {
      await updateSurgeryPackageLensInfo();
    }
    
    console.log('\n🎉 Script completed successfully!');
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');

// Run the script
if (require.main === module) {
  runScript(isDryRun);
}

module.exports = {
  updateSurgeryPackageLensInfo,
  runScript
};