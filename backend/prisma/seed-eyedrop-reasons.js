const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedEyeDropReasons() {
  try {
    console.log('🌱 Starting Eye Drop Reasons seeding...');

    // Delete existing eye drop reasons
    console.log('🗑️  Deleting existing eye drop reasons...');
    await prisma.eyeDropReason.deleteMany({});
    console.log('✅ Existing eye drop reasons deleted');

    // Eye drop reasons to seed
    const reasons = [
      'Dilated Fundus Examination',
      'Retinal Assessment',
      'Optic Nerve Evaluation',
      'Macular Examination',
      'Peripheral Retina Check',
      'Diabetic Retinopathy Screening',
      'Glaucoma Assessment',
      'Visual Field Test',
      'Blood Pressure Check',
      'Contact Lens Fitting',
      'Photography of Eye',
      'Other'
    ];

    // Create eye drop reasons
    console.log('📝 Creating eye drop reasons...');
    for (const reason of reasons) {
      await prisma.eyeDropReason.create({
        data: { reason }
      });
      console.log(`   ✓ Created: ${reason}`);
    }

    console.log('\n✅ Eye Drop Reasons seeding completed successfully!');
    console.log(`\n📋 Created ${reasons.length} eye drop reasons:`);
    reasons.forEach((reason, index) => {
      console.log(`   ${index + 1}. ${reason}`);
    });
    console.log('\n🚀 Eye drop reasons are now available in the system!');

  } catch (error) {
    console.error('❌ Error seeding eye drop reasons:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedEyeDropReasons()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
