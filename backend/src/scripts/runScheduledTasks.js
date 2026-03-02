// src/scripts/runScheduledTasks.js
const scheduledTasks = require('../services/scheduledTasks');

async function run() {
  console.log('🚀 Running scheduled tasks manually...\n');
//Run:  node src/scripts/runScheduledTasks.js
  // Choose what you want to run
  await scheduledTasks.triggerDailySync();
  await scheduledTasks.triggerCleanupCompletedQueue();
  await scheduledTasks.triggerDiscontinueOldQueueRecords();
  await scheduledTasks.triggerStalledVisitLifecycleCorrection();
  await scheduledTasks.triggerAppointmentVisitStatusSync();

  console.log('\n✅ Manual execution completed');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Manual execution failed:', err);
  process.exit(1);
});
