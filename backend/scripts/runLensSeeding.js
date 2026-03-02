/**
 * Simple runner script for lens data seeding
 * Run with: node scripts/runLensSeeding.js
 */

const { seedLensData } = require('./seedLensData');

async function run() {
  console.log('🚀 Starting lens data seeding...\n');
  
  try {
    await seedLensData();
    console.log('\n✅ Lens seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Lens seeding failed:', error);
    process.exit(1);
  }
}

run();