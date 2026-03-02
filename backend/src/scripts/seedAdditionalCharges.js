const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script to seed additional charges into the database
 * - Inserts 10 different additional charges with realistic pricing
 * - Includes anesthesia and other common hospital charges
 */

const additionalChargesData = [
  {
    chargeName: 'General Anesthesia',
    chargeDesc: 'Administration of general anesthesia during surgery including monitoring and recovery',
    chargePrice: 2500.00,
    isActive: true,
    createdBy: 'system'
  },
  {
    chargeName: 'Operation Theater Charges',
    chargeDesc: 'Usage charges for operation theater including equipment and sterilization',
    chargePrice: 1800.00,
    isActive: true,
    createdBy: 'system'
  },
  {
    chargeName: 'Local Anesthesia',
    chargeDesc: 'Administration of local anesthesia for minor procedures',
    chargePrice: 800.00,
    isActive: true,
    createdBy: 'system'
  },
  {
    chargeName: 'Pre-operative Assessment',
    chargeDesc: 'Comprehensive pre-operative evaluation and clearance by anesthesiologist',
    chargePrice: 1200.00,
    isActive: true,
    createdBy: 'system'
  },
  {
    chargeName: 'Post-operative Monitoring',
    chargeDesc: 'Extended post-operative monitoring and care in recovery room',
    chargePrice: 1500.00,
    isActive: true,
    createdBy: 'system'
  },
  {
    chargeName: 'Emergency Surgery Surcharge',
    chargeDesc: 'Additional charges for emergency surgeries performed outside regular hours',
    chargePrice: 3000.00,
    isActive: true,
    createdBy: 'system'
  },
  {
    chargeName: 'Specialized Equipment Usage',
    chargeDesc: 'Usage charges for specialized surgical equipment and instruments',
    chargePrice: 2200.00,
    isActive: true,
    createdBy: 'system'
  },
  {
    chargeName: 'Blood Bank Charges',
    chargeDesc: 'Processing and administration charges for blood products',
    chargePrice: 1600.00,
    isActive: true,
    createdBy: 'system'
  },
  {
    chargeName: 'Infection Control Protocols',
    chargeDesc: 'Additional sterilization and infection control measures for high-risk procedures',
    chargePrice: 900.00,
    isActive: true,
    createdBy: 'system'
  },
  {
    chargeName: 'Surgical Assistance',
    chargeDesc: 'Additional surgical assistant fees for complex procedures',
    chargePrice: 2800.00,
    isActive: true,
    createdBy: 'system'
  }
];

async function seedAdditionalCharges() {
  try {
    console.log('🚀 Starting additional charges seeding...');

    // Check if additional charges already exist
    const existingCharges = await prisma.additionalCharges.findMany();
    
    if (existingCharges.length > 0) {
      console.log(`📋 Found ${existingCharges.length} existing additional charges`);
      console.log('🔄 Clearing existing charges for fresh seed...');
      
      // Delete existing charges
      await prisma.additionalCharges.deleteMany();
      console.log('✅ Cleared existing additional charges');
    }

    console.log(`📥 Inserting ${additionalChargesData.length} additional charges...`);

    // Insert new charges
    const createdCharges = await prisma.additionalCharges.createMany({
      data: additionalChargesData,
      skipDuplicates: true
    });

    console.log(`✅ Successfully created ${createdCharges.count} additional charges!`);

    // Verify and display the created charges
    const allCharges = await prisma.additionalCharges.findMany({
      orderBy: {
        chargePrice: 'desc'
      }
    });

    console.log('\n📊 Additional Charges Summary:');
    console.log('=================================');
    allCharges.forEach((charge, index) => {
      console.log(`${index + 1}. ${charge.chargeName} - ₹${charge.chargePrice.toLocaleString()}`);
      if (charge.chargeDesc) {
        console.log(`   Description: ${charge.chargeDesc}`);
      }
      console.log('');
    });

    console.log('💰 Price Range:');
    const prices = allCharges.map(c => c.chargePrice);
    console.log(`   Minimum: ₹${Math.min(...prices).toLocaleString()}`);
    console.log(`   Maximum: ₹${Math.max(...prices).toLocaleString()}`);
    console.log(`   Average: ₹${(prices.reduce((a, b) => a + b, 0) / prices.length).toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error seeding additional charges:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Function to run the script with options
 */
async function runScript(clearExisting = false) {
  try {
    console.log('🏥 Additional Charges Seeding Script');
    console.log('====================================');
    
    if (clearExisting) {
      console.log('🗑️  Clear existing mode enabled');
    }
    
    await seedAdditionalCharges();
    
    console.log('\n🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('💥 Seeding failed:', error.message);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const clearExisting = args.includes('--clear') || args.includes('-c');

// Run the script
if (require.main === module) {
  runScript(clearExisting);
}

module.exports = {
  seedAdditionalCharges,
  runScript,
  additionalChargesData
};