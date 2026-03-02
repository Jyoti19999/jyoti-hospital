const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  try {
    console.log('🌱 Starting SuperAdmin seeding...');

    // Delete existing superadmin
    console.log('🗑️  Deleting existing superadmin...');
    await prisma.superAdmin.deleteMany({});
    console.log('✅ Existing superadmin deleted');

    // Create SuperAdmin -- default credentials
    const superAdmin = await prisma.superAdmin.create({
      data: {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@yogineerstech.in',
        phone: '+91-9876543210',
        passwordHash: await bcrypt.hash('Admin@123', 10),
        isActive: true
      }
    });

    console.log('✅ SuperAdmin seeding completed successfully!');
    console.log('\n📋 Created SuperAdmin:');
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Password: Admin@123`);
    console.log('\n🚀 You can now login as SuperAdmin!');

  } catch (error) {
    console.error('❌ Error seeding superadmin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedSuperAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
