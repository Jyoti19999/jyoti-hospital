// Simple script to test lens data and API
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLensData() {
  try {
    console.log('🔍 Testing lens data and API...');
    
    // Check how many lenses exist in the database
    const totalLenses = await prisma.lens.count();
    console.log(`📊 Total lenses in database: ${totalLenses}`);
    
    // Check active and available lenses
    const activeLenses = await prisma.lens.count({
      where: {
        isActive: true,
        isAvailable: true
      }
    });
    console.log(`✅ Active & available lenses: ${activeLenses}`);
    
    // Get first 5 lenses
    const lenses = await prisma.lens.findMany({
      where: {
        isActive: true,
        isAvailable: true
      },
      select: {
        id: true,
        lensName: true,
        lensCode: true,
        manufacturer: true,
        lensType: true,
        lensCategory: true,
        lensoCost: true,
        patientCost: true
      },
      take: 5
    });
    
    console.log('\n📋 Sample lenses:');
    lenses.forEach((lens, index) => {
      console.log(`${index + 1}. ${lens.lensName} (${lens.manufacturer}) - ₹${lens.lensoCost}`);
    });
    
    if (activeLenses === 0) {
      console.log('\n⚠️ No active lenses found! You may need to seed lens data.');
      console.log('💡 Run: node scripts/seedLensData.js');
    } else {
      console.log(`\n✅ Lens data looks good! ${activeLenses} lenses available for dropdown.`);
    }
    
  } catch (error) {
    console.error('❌ Error testing lens data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLensData();