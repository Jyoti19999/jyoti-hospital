
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreCriticalData() {
  try {
    console.log('🔄 Starting critical data restoration...');
    
    // Read backup data
    const backupPath = path.join(__dirname, 'critical-data-backup.json');
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    console.log('📋 Backup timestamp:', backupData.timestamp);
    
    // Clear existing data (CAUTION!)
    console.log('⚠️  WARNING: This will clear existing data!');
    console.log('⚠️  Make sure you have a separate backup before proceeding!');
    
    // Import data in correct order due to foreign key constraints
    console.log('👥 Restoring staff records...');
    for (const staff of backupData.staff) {
      await prisma.staff.upsert({
        where: { id: staff.id },
        update: staff,
        create: staff
      });
    }
    console.log(`✅ Restored ${backupData.staff.length} staff records`);
    
    console.log('👤 Restoring patient records...');
    for (const patient of backupData.patients) {
      await prisma.patient.upsert({
        where: { id: patient.id },
        update: patient,
        create: patient
      });
    }
    console.log(`✅ Restored ${backupData.patients.length} patient records`);
    
    console.log('📅 Restoring appointments...');
    for (const appointment of backupData.appointments) {
      await prisma.appointment.upsert({
        where: { id: appointment.id },
        update: appointment,
        create: appointment
      });
    }
    console.log(`✅ Restored ${backupData.appointments.length} appointments`);
    
    console.log('🏥 Restoring patient visits...');
    for (const visit of backupData.patientVisits) {
      await prisma.patientVisit.upsert({
        where: { id: visit.id },
        update: visit,
        create: visit
      });
    }
    console.log(`✅ Restored ${backupData.patientVisits.length} patient visits`);
    
    console.log('👀 Restoring optometrist examinations...');
    for (const exam of backupData.optometristExaminations) {
      await prisma.optometristExamination.upsert({
        where: { id: exam.id },
        update: exam,
        create: exam
      });
    }
    console.log(`✅ Restored ${backupData.optometristExaminations.length} optometrist examinations`);
    
    console.log('👨‍⚕️ Restoring ophthalmologist examinations...');
    for (const exam of backupData.ophthalmologistExaminations) {
      await prisma.ophthalmologistExamination.upsert({
        where: { id: exam.id },
        update: exam,
        create: exam
      });
    }
    console.log(`✅ Restored ${backupData.ophthalmologistExaminations.length} ophthalmologist examinations`);
    
    console.log('💊 Restoring medicines...');
    for (const medicine of backupData.medicines) {
      await prisma.medicine.upsert({
        where: { id: medicine.id },
        update: medicine,
        create: medicine
      });
    }
    console.log(`✅ Restored ${backupData.medicines.length} medicines`);
    
    console.log('📋 Restoring prescriptions...');
    for (const prescription of backupData.prescriptions) {
      await prisma.prescription.upsert({
        where: { id: prescription.id },
        update: prescription,
        create: prescription
      });
    }
    console.log(`✅ Restored ${backupData.prescriptions.length} prescriptions`);
    
    console.log('💰 Restoring bills...');
    for (const bill of backupData.bills) {
      await prisma.bill.upsert({
        where: { id: bill.id },
        update: bill,
        create: bill
      });
    }
    console.log(`✅ Restored ${backupData.bills.length} bills`);
    
    console.log('📋 Restoring patient queue...');
    for (const queueItem of backupData.patientQueue) {
      await prisma.patientQueue.upsert({
        where: { id: queueItem.id },
        update: queueItem,
        create: queueItem
      });
    }
    console.log(`✅ Restored ${backupData.patientQueue.length} queue items`);
    
    console.log('🎉 Critical data restoration completed successfully!');
    console.log('🔧 Please verify the restoration and run application tests');
    
  } catch (error) {
    console.error('❌ Restoration failed:', error);
    console.error('💡 Please check the error and try manual restoration if needed');
  } finally {
    await prisma.$disconnect();
  }
}

// Run restoration (uncomment to execute)
// restoreCriticalData();

console.log('Critical Data Restore Script');
console.log('Uncomment the last line and run: node restore-critical-data.js');
console.log('⚠️  WARNING: This will overwrite existing data!');

module.exports = { restoreCriticalData };
    