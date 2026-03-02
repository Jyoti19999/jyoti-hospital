const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTPAStaffType() {
  try {
    console.log('🌱 Adding TPA staff type...');

    // Check if TPA staff type already exists
    const existingTPA = await prisma.staffType.findFirst({
      where: {
        type: 'tpa'
      }
    });

    if (existingTPA) {
      console.log('ℹ️  TPA staff type already exists');
      console.log('✅ TPA Staff Type ID:', existingTPA.id);
      return;
    }

    // Create TPA staff type
    const tpaStaffType = await prisma.staffType.create({
      data: {
        type: 'tpa'
      }
    });

    console.log('✅ TPA staff type created successfully!');
    console.log('📋 Created Staff Type:');
    console.log(`   ID: ${tpaStaffType.id}`);
    console.log(`   Type: ${tpaStaffType.type}`);

    // Show all staff types for verification
    const allStaffTypes = await prisma.staffType.findMany({
      orderBy: { type: 'asc' }
    });

    console.log('\n📜 All Staff Types in Database:');
    allStaffTypes.forEach((staffType, index) => {
      console.log(`${index + 1}. ${staffType.type} (ID: ${staffType.id})`);
    });

  } catch (error) {
    console.error('❌ Error adding TPA staff type:', error);
    
    if (error.code === 'P2002') {
      console.error('🔄 TPA staff type already exists (unique constraint violation)');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addTPAStaffType()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });