const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSurgeryData() {
  try {
    console.log('🔍 Checking surgery-related data in database...\n');
    
    // Check surgery types
    const surgeryTypes = await prisma.surgeryType.findMany();
    console.log(`📊 Surgery Types: ${surgeryTypes.length} records found`);
    if (surgeryTypes.length > 0) {
      console.log('First few surgery types:');
      surgeryTypes.slice(0, 3).forEach(type => {
        console.log(`  - ${type.name} (${type.category})`);
      });
    }
    
    // Check surgery packages
    const surgeryPackages = await prisma.surgeryPackage.findMany();
    console.log(`\n📦 Surgery Packages: ${surgeryPackages.length} records found`);
    if (surgeryPackages.length > 0) {
      console.log('First few packages:');
      surgeryPackages.slice(0, 3).forEach(pkg => {
        console.log(`  - ${pkg.packageName} (₹${pkg.packageCost})`);
      });
    }
    
    // Check fitness investigations  
    const investigations = await prisma.fitnessInvestigation.findMany();
    console.log(`\n🔬 Fitness Investigations: ${investigations.length} records found`);
    if (investigations.length > 0) {
      console.log('First few investigations:');
      investigations.slice(0, 3).forEach(inv => {
        console.log(`  - ${inv.name} (₹${inv.cost})`);
      });
    }
    
    // Check lenses
    const lenses = await prisma.lens.findMany();
    console.log(`\n👁️ Lenses: ${lenses.length} records found`);
    if (lenses.length > 0) {
      console.log('First few lenses:');
      lenses.slice(0, 3).forEach(lens => {
        console.log(`  - ${lens.lensName} (₹${lens.lensoCost})`);
      });
    }
    
    console.log('\n✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSurgeryData();