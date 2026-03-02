const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Comprehensive Patient Deletion Script
 * This script deletes a patient and ALL related records from all tables
 * 
 * WARNING: This operation is IRREVERSIBLE!
 * Make sure you have a backup before running this script.
 */

async function getPatientDetails(identifier) {
  try {
    let patient;
    
    // Try to find by patient number first (if it's a number)
    if (!isNaN(identifier)) {
      patient = await prisma.patient.findUnique({
        where: { patientNumber: parseInt(identifier) },
        include: {
          appointments: true,
          patientVisits: true,
          patientQueue: true,
          bills: true,
          payments: true,
          insuranceClaims: true,
          beds: true,
          referredPatients: true
        }
      });
    }
    
    // If not found by patient number, try by ID
    if (!patient) {
      patient = await prisma.patient.findUnique({
        where: { id: identifier },
        include: {
          appointments: true,
          patientVisits: true,
          patientQueue: true,
          bills: true,
          payments: true,
          insuranceClaims: true,
          beds: true,
          referredPatients: true
        }
      });
    }
    
    // If not found by ID, try by email
    if (!patient && identifier.includes('@')) {
      patient = await prisma.patient.findUnique({
        where: { email: identifier },
        include: {
          appointments: true,
          patientVisits: true,
          patientQueue: true,
          bills: true,
          payments: true,
          insuranceClaims: true,
          beds: true,
          referredPatients: true
        }
      });
    }
    
    return patient;
  } catch (error) {
    console.error('Error finding patient:', error);
    return null;
  }
}

async function getRelatedRecordsCounts(patientId, patientVisitIds) {
  try {
    const counts = {
      // Direct patient relations
      appointments: await prisma.appointment.count({ where: { patientId } }),
      patientVisits: await prisma.patientVisit.count({ where: { patientId } }),
      patientQueue: await prisma.patientQueue.count({ where: { patientId } }),
      bills: await prisma.bill.count({ where: { patientId } }),
      payments: await prisma.payment.count({ where: { patientId } }),
      insuranceClaims: await prisma.insuranceClaim.count({ where: { patientId } }),
      beds: await prisma.bed.count({ where: { patientId } }),
      
      // Indirect relations through patient visits
      optometristExaminations: 0,
      ophthalmologistExaminations: 0,
      prescriptions: 0,
      diagnoses: 0,
      billItems: 0,
      prescriptionItems: 0,
      
      // IPD-related records
      ipdAdmissions: 0,
      fitnessReports: 0,
      preOpAssessments: 0,
      surgeryMetrics: 0
    };
    
    if (patientVisitIds.length > 0) {
      counts.optometristExaminations = await prisma.optometristExamination.count({
        where: { patientVisitId: { in: patientVisitIds } }
      });
      
      counts.ophthalmologistExaminations = await prisma.ophthalmologistExamination.count({
        where: { patientVisitId: { in: patientVisitIds } }
      });
      
      counts.prescriptions = await prisma.prescription.count({
        where: { patientVisitId: { in: patientVisitIds } }
      });
      
      counts.diagnoses = await prisma.diagnosis.count({
        where: { visitId: { in: patientVisitIds } }
      });
      
      // Get bill IDs to count bill items
      const billIds = await prisma.bill.findMany({
        where: { patientId },
        select: { id: true }
      });
      
      if (billIds.length > 0) {
        counts.billItems = await prisma.billItem.count({
          where: { billId: { in: billIds.map(b => b.id) } }
        });
      }
      
      // Get prescription IDs to count prescription items
      const prescriptionIds = await prisma.prescription.findMany({
        where: { patientVisitId: { in: patientVisitIds } },
        select: { id: true }
      });
      
      if (prescriptionIds.length > 0) {
        counts.prescriptionItems = await prisma.prescriptionItem.count({
          where: { prescriptionId: { in: prescriptionIds.map(p => p.id) } }
        });
      }
    }
    
    // Count IPD-related records
    counts.ipdAdmissions = await prisma.ipdAdmission.count({ where: { patientId } });
    
    if (counts.ipdAdmissions > 0) {
      // Get IPD admission IDs to count related records
      const ipdAdmissions = await prisma.ipdAdmission.findMany({
        where: { patientId },
        select: { id: true }
      });
      const ipdAdmissionIds = ipdAdmissions.map(ipd => ipd.id);
      
      counts.fitnessReports = await prisma.fitnessReport.count({
        where: { ipdAdmissionId: { in: ipdAdmissionIds } }
      });
      
      counts.preOpAssessments = await prisma.preOpAssessment.count({
        where: { ipdAdmissionId: { in: ipdAdmissionIds } }
      });
      
      counts.surgeryMetrics = await prisma.surgeryMetrics.count({
        where: { ipdAdmissionId: { in: ipdAdmissionIds } }
      });
    }
    
    return counts;
  } catch (error) {
    console.error('Error counting related records:', error);
    return null;
  }
}

async function deletePatientCompletely(patientId) {
  try {
    console.log('\n🗑️  Starting patient deletion process...\n');
    
    // Get all patient visit IDs first
    const patientVisits = await prisma.patientVisit.findMany({
      where: { patientId },
      select: { id: true }
    });
    const patientVisitIds = patientVisits.map(pv => pv.id);
    
    // Get all bill IDs
    const bills = await prisma.bill.findMany({
      where: { patientId },
      select: { id: true }
    });
    const billIds = bills.map(b => b.id);
    
    // Get all prescription IDs
    const prescriptions = await prisma.prescription.findMany({
      where: { patientVisitId: { in: patientVisitIds } },
      select: { id: true }
    });
    const prescriptionIds = prescriptions.map(p => p.id);
    
    // Start transaction for atomic deletion
    await prisma.$transaction(async (tx) => {
      let deletedCount = 0;
      
      // Step 1: Delete prescription items
      if (prescriptionIds.length > 0) {
        const deleted = await tx.prescriptionItem.deleteMany({
          where: { prescriptionId: { in: prescriptionIds } }
        });
        console.log(`✅ Deleted ${deleted.count} prescription items`);
        deletedCount += deleted.count;
      }
      
      // Step 2: Delete bill items
      if (billIds.length > 0) {
        const deleted = await tx.billItem.deleteMany({
          where: { billId: { in: billIds } }
        });
        console.log(`✅ Deleted ${deleted.count} bill items`);
        deletedCount += deleted.count;
      }
      
      // Step 3: Delete diagnoses
      if (patientVisitIds.length > 0) {
        const deleted = await tx.diagnosis.deleteMany({
          where: { visitId: { in: patientVisitIds } }
        });
        console.log(`✅ Deleted ${deleted.count} diagnoses`);
        deletedCount += deleted.count;
      }
      
      // Step 4: Delete prescriptions
      if (patientVisitIds.length > 0) {
        const deleted = await tx.prescription.deleteMany({
          where: { patientVisitId: { in: patientVisitIds } }
        });
        console.log(`✅ Deleted ${deleted.count} prescriptions`);
        deletedCount += deleted.count;
      }
      
      // Step 5: Delete examinations
      if (patientVisitIds.length > 0) {
        const deletedOpto = await tx.optometristExamination.deleteMany({
          where: { patientVisitId: { in: patientVisitIds } }
        });
        console.log(`✅ Deleted ${deletedOpto.count} optometrist examinations`);
        deletedCount += deletedOpto.count;
        
        const deletedOphth = await tx.ophthalmologistExamination.deleteMany({
          where: { patientVisitId: { in: patientVisitIds } }
        });
        console.log(`✅ Deleted ${deletedOphth.count} ophthalmologist examinations`);
        deletedCount += deletedOphth.count;
      }
      
      // Step 6: Delete payments
      const deletedPayments = await tx.payment.deleteMany({
        where: { patientId }
      });
      console.log(`✅ Deleted ${deletedPayments.count} payments`);
      deletedCount += deletedPayments.count;
      
      // Step 7: Delete bills
      const deletedBills = await tx.bill.deleteMany({
        where: { patientId }
      });
      console.log(`✅ Deleted ${deletedBills.count} bills`);
      deletedCount += deletedBills.count;
      
      // Step 8: Delete insurance claims
      const deletedClaims = await tx.insuranceClaim.deleteMany({
        where: { patientId }
      });
      console.log(`✅ Deleted ${deletedClaims.count} insurance claims`);
      deletedCount += deletedClaims.count;
      
      // Step 9: Delete patient queue entries
      const deletedQueue = await tx.patientQueue.deleteMany({
        where: { patientId }
      });
      console.log(`✅ Deleted ${deletedQueue.count} queue entries`);
      deletedCount += deletedQueue.count;
      
      // Step 10: Delete patient visits
      const deletedVisits = await tx.patientVisit.deleteMany({
        where: { patientId }
      });
      console.log(`✅ Deleted ${deletedVisits.count} patient visits`);
      deletedCount += deletedVisits.count;
      
      // Step 11: Delete appointments
      const deletedAppointments = await tx.appointment.deleteMany({
        where: { patientId }
      });
      console.log(`✅ Deleted ${deletedAppointments.count} appointments`);
      deletedCount += deletedAppointments.count;
      
      // Step 12: Update beds (remove patient assignment)
      const updatedBeds = await tx.bed.updateMany({
        where: { patientId },
        data: {
          patientId: null,
          status: 'available',
          admissionDate: null,
          expectedDischargeDate: null
        }
      });
      console.log(`✅ Updated ${updatedBeds.count} beds (removed patient assignment)`);
      
      // Step 13: Delete IPD-related records for this patient (in correct order due to foreign keys)
      // First, get IPD admission IDs for this patient
      const ipdAdmissions = await tx.ipdAdmission.findMany({
        where: { patientId },
        select: { id: true }
      });
      const ipdAdmissionIds = ipdAdmissions.map(ipd => ipd.id);
      
      if (ipdAdmissionIds.length > 0) {
        // Delete dependent IPD records first
        const deletedSurgeryMetrics = await tx.surgeryMetrics.deleteMany({
          where: { ipdAdmissionId: { in: ipdAdmissionIds } }
        });
        console.log(`✅ Deleted ${deletedSurgeryMetrics.count} surgery metrics`);
        
        const deletedPreOpAssessments = await tx.preOpAssessment.deleteMany({
          where: { ipdAdmissionId: { in: ipdAdmissionIds } }
        });
        console.log(`✅ Deleted ${deletedPreOpAssessments.count} pre-op assessments`);
        
        const deletedFitnessReports = await tx.fitnessReport.deleteMany({
          where: { ipdAdmissionId: { in: ipdAdmissionIds } }
        });
        console.log(`✅ Deleted ${deletedFitnessReports.count} fitness reports`);
        
        // Then delete IPD admissions
        const deletedIpdAdmissions = await tx.ipdAdmission.deleteMany({
          where: { patientId }
        });
        console.log(`✅ Deleted ${deletedIpdAdmissions.count} IPD admissions`);
      }
      
      // Step 15: Handle patient referrals (update referred patients)
      const updatedReferrals = await tx.patient.updateMany({
        where: { referredBy: patientId },
        data: { referredBy: null, isReferred: false }
      });
      console.log(`✅ Updated ${updatedReferrals.count} referred patients`);
      
      // Step 16: Finally, delete the patient
      const deletedPatient = await tx.patient.delete({
        where: { id: patientId }
      });
      console.log(`✅ Deleted patient record`);
      deletedCount += 1;
      
      console.log(`\n🎉 Successfully deleted patient and ${deletedCount} related records!`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error during deletion:', error);
    return false;
  }
}

async function getAllPatientsCount() {
  try {
    const count = await prisma.patient.count();
    return count;
  } catch (error) {
    console.error('Error counting patients:', error);
    return 0;
  }
}

async function deleteAllPatients() {
  try {
    console.log('\n🗑️  Starting mass patient deletion process...\n');
    
    // Get total count first
    const totalPatients = await getAllPatientsCount();
    
    if (totalPatients === 0) {
      console.log('✅ No patients found in the database.');
      return true;
    }
    
    console.log(`📊 Found ${totalPatients} patients to delete`);
    
    // Get all patient visit IDs first (for performance)
    const allPatientVisits = await prisma.patientVisit.findMany({
      select: { id: true }
    });
    const allPatientVisitIds = allPatientVisits.map(pv => pv.id);
    
    // Get all bill IDs
    const allBills = await prisma.bill.findMany({
      select: { id: true }
    });
    const allBillIds = allBills.map(b => b.id);
    
    // Get all prescription IDs
    const allPrescriptions = await prisma.prescription.findMany({
      where: { patientVisitId: { in: allPatientVisitIds } },
      select: { id: true }
    });
    const allPrescriptionIds = allPrescriptions.map(p => p.id);
    
    // Start transaction for atomic deletion
    await prisma.$transaction(async (tx) => {
      let deletedCount = 0;
      
      // Step 1: Delete prescription items
      if (allPrescriptionIds.length > 0) {
        const deleted = await tx.prescriptionItem.deleteMany({});
        console.log(`✅ Deleted ${deleted.count} prescription items`);
        deletedCount += deleted.count;
      }
      
      // Step 2: Delete bill items
      if (allBillIds.length > 0) {
        const deleted = await tx.billItem.deleteMany({});
        console.log(`✅ Deleted ${deleted.count} bill items`);
        deletedCount += deleted.count;
      }
      
      // Step 3: Delete diagnoses
      const deletedDiagnoses = await tx.diagnosis.deleteMany({});
      console.log(`✅ Deleted ${deletedDiagnoses.count} diagnoses`);
      deletedCount += deletedDiagnoses.count;
      
      // Step 4: Delete prescriptions
      const deletedPrescriptions = await tx.prescription.deleteMany({});
      console.log(`✅ Deleted ${deletedPrescriptions.count} prescriptions`);
      deletedCount += deletedPrescriptions.count;
      
      // Step 5: Delete examinations
      const deletedOptoExams = await tx.optometristExamination.deleteMany({});
      console.log(`✅ Deleted ${deletedOptoExams.count} optometrist examinations`);
      deletedCount += deletedOptoExams.count;
      
      const deletedOphthExams = await tx.ophthalmologistExamination.deleteMany({});
      console.log(`✅ Deleted ${deletedOphthExams.count} ophthalmologist examinations`);
      deletedCount += deletedOphthExams.count;
      
      // Step 6: Delete payments
      const deletedPayments = await tx.payment.deleteMany({});
      console.log(`✅ Deleted ${deletedPayments.count} payments`);
      deletedCount += deletedPayments.count;
      
      // Step 7: Delete bills
      const deletedBills = await tx.bill.deleteMany({});
      console.log(`✅ Deleted ${deletedBills.count} bills`);
      deletedCount += deletedBills.count;
      
      // Step 8: Delete insurance claims
      const deletedClaims = await tx.insuranceClaim.deleteMany({});
      console.log(`✅ Deleted ${deletedClaims.count} insurance claims`);
      deletedCount += deletedClaims.count;
      
      // Step 9: Delete patient queue entries
      const deletedQueue = await tx.patientQueue.deleteMany({});
      console.log(`✅ Deleted ${deletedQueue.count} queue entries`);
      deletedCount += deletedQueue.count;
      
      // Step 10: Delete patient visits
      const deletedVisits = await tx.patientVisit.deleteMany({});
      console.log(`✅ Deleted ${deletedVisits.count} patient visits`);
      deletedCount += deletedVisits.count;
      
      // Step 11: Delete appointments
      const deletedAppointments = await tx.appointment.deleteMany({});
      console.log(`✅ Deleted ${deletedAppointments.count} appointments`);
      deletedCount += deletedAppointments.count;
      
      // Step 12: Update beds (remove all patient assignments)
      const updatedBeds = await tx.bed.updateMany({
        where: { patientId: { not: null } },
        data: {
          patientId: null,
          status: 'available',
          admissionDate: null,
          expectedDischargeDate: null
        }
      });
      console.log(`✅ Updated ${updatedBeds.count} beds (removed patient assignments)`);
      
      // Step 13: Delete IPD-related records (in correct order due to foreign keys)
      // First delete dependent records
      const deletedSurgeryMetrics = await tx.surgeryMetrics.deleteMany({});
      console.log(`✅ Deleted ${deletedSurgeryMetrics.count} surgery metrics`);
      deletedCount += deletedSurgeryMetrics.count;
      
      const deletedPreOpAssessments = await tx.preOpAssessment.deleteMany({});
      console.log(`✅ Deleted ${deletedPreOpAssessments.count} pre-op assessments`);
      deletedCount += deletedPreOpAssessments.count;
      
      const deletedFitnessReports = await tx.fitnessReport.deleteMany({});
      console.log(`✅ Deleted ${deletedFitnessReports.count} fitness reports`);
      deletedCount += deletedFitnessReports.count;
      
      // Then delete IPD admissions
      const deletedIpdAdmissions = await tx.ipdAdmission.deleteMany({});
      console.log(`✅ Deleted ${deletedIpdAdmissions.count} IPD admissions`);
      deletedCount += deletedIpdAdmissions.count;
      
      // Step 15: Finally, delete all patients
      const deletedPatients = await tx.patient.deleteMany({});
      console.log(`✅ Deleted ${deletedPatients.count} patients`);
      deletedCount += deletedPatients.count;
      
      console.log(`\n🎉 Successfully deleted ALL patients and ${deletedCount} related records!`);
      console.log(`📊 Total patients deleted: ${deletedPatients.count}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error during mass deletion:', error);
    return false;
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('🏥 PATIENT DELETION SCRIPT');
  console.log('='.repeat(60));
  console.log('⚠️  WARNING: This will permanently delete patient data!');
  console.log('📋 Make sure you have a backup before proceeding.\n');
  
  try {
    // Ask user what they want to do
    console.log('Choose an option:');
    console.log('1. Delete a specific patient');
    console.log('2. Delete ALL patients (⚠️  DANGER ZONE)');
    console.log('3. Exit\n');
    
    const choice = await askQuestion('Enter your choice (1, 2, or 3): ');
    
    if (choice === '3') {
      console.log('👋 Exiting...');
      return;
    }
    
    if (choice === '2') {
      // Delete all patients option
      console.log('\n🚨 DANGER ZONE: DELETE ALL PATIENTS 🚨');
      console.log('='.repeat(50));
      console.log('⚠️  This will delete EVERY PATIENT in the database!');
      console.log('⚠️  This action affects ALL patient data!');
      console.log('⚠️  Make sure you have a complete backup!\n');
      
      // Get current patient count
      const totalPatients = await getAllPatientsCount();
      console.log(`📊 Current patients in database: ${totalPatients}`);
      
      if (totalPatients === 0) {
        console.log('✅ No patients found. Nothing to delete.');
        return;
      }
      
      // Simple confirmation for mass deletion
      console.log('\n🔴 FINAL WARNING:');
      console.log('This will permanently delete:');
      console.log(`• ${totalPatients} patient records`);
      console.log('• ALL appointments and visits');
      console.log('• ALL examinations and diagnoses');
      console.log('• ALL prescriptions and medications');
      console.log('• ALL bills and payments');
      console.log('• ALL insurance claims');
      console.log('• ALL queue entries');
      console.log('• ALL related data\n');
      
      const confirm = await askQuestion('Do you want to proceed with deleting ALL patients? (y/N): ');
      
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        console.log('❌ Mass deletion cancelled. All patient data preserved.');
        return;
      }
      
      // Perform mass deletion
      const success = await deleteAllPatients();
      
      if (success) {
        console.log('\n✅ Mass patient deletion completed successfully!');
        console.log('📝 All patient records and related data have been removed.');
      } else {
        console.log('\n❌ Mass patient deletion failed!');
        console.log('📝 Database rolled back. No changes were made.');
      }
      
      return;
    }
    
    if (choice === '1') {
      // Original single patient deletion logic
      const identifier = await askQuestion('Enter Patient Number, ID, or Email: ');
      
      if (!identifier.trim()) {
        console.log('❌ No identifier provided. Exiting...');
        return;
      }
      
      console.log('\n🔍 Searching for patient...');
      
      // Find patient
      const patient = await getPatientDetails(identifier.trim());
      
      if (!patient) {
        console.log('❌ Patient not found with the provided identifier.');
        return;
      }
      
      // Display patient information
      console.log('\n📋 PATIENT FOUND:');
      console.log('='.repeat(40));
      console.log(`👤 Name: ${patient.firstName} ${patient.lastName}`);
      console.log(`🆔 Patient Number: ${patient.patientNumber || 'N/A'}`);
      console.log(`📧 Email: ${patient.email || 'N/A'}`);
      console.log(`📱 Phone: ${patient.phone || 'N/A'}`);
      console.log(`🎂 Date of Birth: ${patient.dateOfBirth ? patient.dateOfBirth.toDateString() : 'N/A'}`);
      console.log(`📅 Created: ${patient.createdAt.toDateString()}`);
      
      // Get and display related records count
      console.log('\n📊 RELATED RECORDS:');
      console.log('='.repeat(40));
      
      const patientVisitIds = patient.patientVisits.map(pv => pv.id);
      const counts = await getRelatedRecordsCounts(patient.id, patientVisitIds);
      
      if (counts) {
        console.log(`📅 Appointments: ${counts.appointments}`);
        console.log(`🏥 Patient Visits: ${counts.patientVisits}`);
        console.log(`⏳ Queue Entries: ${counts.patientQueue}`);
        console.log(`👁️  Optometrist Examinations: ${counts.optometristExaminations}`);
        console.log(`🔬 Ophthalmologist Examinations: ${counts.ophthalmologistExaminations}`);
        console.log(`💊 Prescriptions: ${counts.prescriptions}`);
        console.log(`📋 Prescription Items: ${counts.prescriptionItems}`);
        console.log(`🩺 Diagnoses: ${counts.diagnoses}`);
        console.log(`💰 Bills: ${counts.bills}`);
        console.log(`💳 Bill Items: ${counts.billItems}`);
        console.log(`💸 Payments: ${counts.payments}`);
        console.log(`🏛️  Insurance Claims: ${counts.insuranceClaims}`);
        console.log(`🛏️  Bed Assignments: ${counts.beds}`);
        console.log(`🏥 IPD Admissions: ${counts.ipdAdmissions}`);
        console.log(`💪 Fitness Reports: ${counts.fitnessReports}`);
        console.log(`🔬 Pre-Op Assessments: ${counts.preOpAssessments}`);
        console.log(`📊 Surgery Metrics: ${counts.surgeryMetrics}`);
        
        const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
        console.log(`\n📈 TOTAL RELATED RECORDS: ${totalRecords}`);
      }
      
      // Show referral information
      if (patient.referredPatients.length > 0) {
        console.log(`\n👥 This patient has referred ${patient.referredPatients.length} other patients.`);
        console.log('   These patients will have their referral status updated.');
      }
      
      // Final confirmation for single patient
      console.log('\n⚠️  FINAL WARNING:');
      console.log('='.repeat(40));
      console.log('This action will PERMANENTLY DELETE:');
      console.log('• The patient record');
      console.log('• ALL appointments and visits');
      console.log('• ALL examinations and diagnoses');
      console.log('• ALL prescriptions and medications');
      console.log('• ALL bills and payments');
      console.log('• ALL insurance claims');
      console.log('• ALL queue entries');
      console.log('• ALL related data\n');
      
      const confirm1 = await askQuestion('Type "DELETE" to confirm deletion: ');
      
      if (confirm1 !== 'DELETE') {
        console.log('❌ Deletion cancelled. Patient data preserved.');
        return;
      }
      
      const confirm2 = await askQuestion('Are you absolutely sure? Type "YES" to proceed: ');
      
      if (confirm2 !== 'YES') {
        console.log('❌ Deletion cancelled. Patient data preserved.');
        return;
      }
      
      // Perform single patient deletion
      const success = await deletePatientCompletely(patient.id);
      
      if (success) {
        console.log('\n✅ Patient deletion completed successfully!');
        console.log('📝 All related records have been removed from the database.');
      } else {
        console.log('\n❌ Patient deletion failed!');
        console.log('📝 Database rolled back. No changes were made.');
      }
      
      return;
    }
    
    // Invalid choice
    console.log('❌ Invalid choice. Please run the script again and select 1, 2, or 3.');
    
  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n\n⏹️  Script interrupted. Cleaning up...');
  await prisma.$disconnect();
  rl.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { deletePatientCompletely, deleteAllPatients, getPatientDetails, getRelatedRecordsCounts, getAllPatientsCount };