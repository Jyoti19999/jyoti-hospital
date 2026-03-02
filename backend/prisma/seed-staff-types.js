const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedStaffTypes() {
  try {
    console.log('🌱 Starting Staff Types seeding...');

    // Delete existing staff types
    console.log('🗑️  Deleting existing staff types...');
    await prisma.staffType.deleteMany({});
    console.log('✅ Existing staff types deleted');

    // Staff types to seed
    const staffTypes = [
       'doctor',
      'receptionist',
      'receptionist2',
      'optometrist',
      'ot_admin',
      'anesthesiologist',
       'surgeon',
       'sister', 
       'tpa',
       'ophthalmologist',
      'nurse',
      'technician',
    ];

    for (const type of staffTypes) {
      await prisma.staffType.create({
        data: { type }
      });
      console.log(`   ✓ Created: ${type}`);
    }


  } catch (error) {
    console.error('❌ Error seeding staff types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedStaffTypes()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
