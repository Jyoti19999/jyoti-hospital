/**
 * Delete Specific Patient Script
 * 
 * This script deletes a patient and all their related records from the database.
 * Use with CAUTION - this action is IRREVERSIBLE!
 * 
 * Usage: node scripts/deleteSpecificPatient.js
 */

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');
const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify question function
function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function deletePatient(identifier) {
  try {
    console.log(`${colors.cyan}🔍 Searching for patient with MRN/Patient Number: ${identifier}${colors.reset}\n`);

    // Find patient by MRN or Patient Number
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { mrn: identifier },
          { patientNumber: parseInt(identifier) || undefined }
        ]
      },
      include: {
        appointments: true,
        patientVisits: true,
        patientQueue: true,
        ipdAdmissions: true,
        bills: true,
        payments: true,
        insuranceClaims: true,
        beds: true
      }
    });

    if (!patient) {
      console.log(`${colors.red}❌ Patient not found with identifier: ${identifier}${colors.reset}`);
      return;
    }

    // Display patient information
    console.log(`${colors.green}✅ Patient found:${colors.reset}`);
    console.log(`   ID: ${patient.id}`);
    console.log(`   Name: ${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`);
    console.log(`   MRN: ${patient.mrn || 'N/A'}`);
    console.log(`   Patient Number: ${patient.patientNumber || 'N/A'}`);
    console.log(`   Phone: ${patient.phone || 'N/A'}`);
    console.log(`   Email: ${patient.email || 'N/A'}`);
    console.log(`   Date of Birth: ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}`);
    console.log(`   Status: ${patient.patientStatus}`);
    
    // Display related records count
    console.log(`\n${colors.yellow}📊 Related Records:${colors.reset}`);
    console.log(`   Appointments: ${patient.appointments.length}`);
    console.log(`   Patient Visits: ${patient.patientVisits.length}`);
    console.log(`   Queue Entries: ${patient.patientQueue.length}`);
    console.log(`   IPD Admissions: ${patient.ipdAdmissions.length}`);
    console.log(`   Bills: ${patient.bills.length}`);
    console.log(`   Payments: ${patient.payments.length}`);
    console.log(`   Insurance Claims: ${patient.insuranceClaims.length}`);
    console.log(`   Beds: ${patient.beds.length}`);

    // Confirmation prompt
    console.log(`\n${colors.red}⚠️  WARNING: This will permanently delete the patient and ALL related records!${colors.reset}`);
    console.log(`${colors.red}⚠️  This action cannot be undone!${colors.reset}\n`);

    const confirmation = await question(`${colors.yellow}Are you sure you want to delete this patient? Type 'YES' to confirm: ${colors.reset}`);
    
    if (confirmation.trim() !== 'YES') {
      console.log(`\n${colors.yellow}❌ Deletion cancelled. Patient was NOT deleted.${colors.reset}\n`);
      rl.close();
      return;
    }

    console.log(`${colors.magenta}🗑️  Starting deletion process...${colors.reset}\n`);

    // Delete patient and all related records in a transaction
    await prisma.$transaction(async (tx) => {
      let deletedCount = 0;

      // 1. Delete fitness reports and pre-op assessments (if they exist)
      const fitnessDeleted = await tx.fitnessReport.deleteMany({
        where: { 
          ipdAdmission: { patientId: patient.id }
        }
      });
      console.log(`   ${colors.blue}Deleted ${fitnessDeleted.count} fitness reports${colors.reset}`);
      deletedCount += fitnessDeleted.count;

      const preOpDeleted = await tx.preOpAssessment.deleteMany({
        where: { 
          ipdAdmission: { patientId: patient.id }
        }
      });
      console.log(`   ${colors.blue}Deleted ${preOpDeleted.count} pre-op assessments${colors.reset}`);
      deletedCount += preOpDeleted.count;

      const surgeryMetricsDeleted = await tx.surgeryMetrics.deleteMany({
        where: { 
          ipdAdmission: { patientId: patient.id }
        }
      });
      console.log(`   ${colors.blue}Deleted ${surgeryMetricsDeleted.count} surgery metrics${colors.reset}`);
      deletedCount += surgeryMetricsDeleted.count;

      // 2. Delete patient queue entries
      const queueDeleted = await tx.patientQueue.deleteMany({
        where: { patientId: patient.id }
      });
      console.log(`   ${colors.blue}Deleted ${queueDeleted.count} queue entries${colors.reset}`);
      deletedCount += queueDeleted.count;

      // 3. Delete payments (must be before patient visits due to foreign key)
      const paymentsDeleted = await tx.payment.deleteMany({
        where: { patientId: patient.id }
      });
      console.log(`   ${colors.blue}Deleted ${paymentsDeleted.count} payments${colors.reset}`);
      deletedCount += paymentsDeleted.count;

      // 4. Delete patient visits (includes optometrist and ophthalmologist examinations)
      const visitsDeleted = await tx.patientVisit.deleteMany({
        where: { patientId: patient.id }
      });
      console.log(`   ${colors.blue}Deleted ${visitsDeleted.count} patient visits${colors.reset}`);
      deletedCount += visitsDeleted.count;

      // 5. Delete IPD admissions
      const ipdDeleted = await tx.ipdAdmission.deleteMany({
        where: { patientId: patient.id }
      });
      console.log(`   ${colors.blue}Deleted ${ipdDeleted.count} IPD admissions${colors.reset}`);
      deletedCount += ipdDeleted.count;

      // 6. Delete bills
      const billsDeleted = await tx.bill.deleteMany({
        where: { patientId: patient.id }
      });
      console.log(`   ${colors.blue}Deleted ${billsDeleted.count} bills${colors.reset}`);
      deletedCount += billsDeleted.count;

      // 7. Delete insurance claims
      const claimsDeleted = await tx.insuranceClaim.deleteMany({
        where: { patientId: patient.id }
      });
      console.log(`   ${colors.blue}Deleted ${claimsDeleted.count} insurance claims${colors.reset}`);
      deletedCount += claimsDeleted.count;

      // 8. Update beds to remove patient assignment
      const bedsUpdated = await tx.bed.updateMany({
        where: { patientId: patient.id },
        data: { patientId: null, status: 'AVAILABLE' }
      });
      console.log(`   ${colors.blue}Updated ${bedsUpdated.count} beds (set to available)${colors.reset}`);

      // 9. Delete appointments
      const appointmentsDeleted = await tx.appointment.deleteMany({
        where: { patientId: patient.id }
      });
      console.log(`   ${colors.blue}Deleted ${appointmentsDeleted.count} appointments${colors.reset}`);
      deletedCount += appointmentsDeleted.count;

      // 10. Handle referred patients (update their referredBy to null)
      const referredPatientsUpdated = await tx.patient.updateMany({
        where: { referredBy: patient.id },
        data: { referredBy: null }
      });
      if (referredPatientsUpdated.count > 0) {
        console.log(`   ${colors.blue}Updated ${referredPatientsUpdated.count} referred patients (removed referral link)${colors.reset}`);
      }

      // 11. Finally, delete the patient
      await tx.patient.delete({
        where: { id: patient.id }
      });
      console.log(`   ${colors.green}✅ Deleted patient record${colors.reset}`);

      console.log(`\n${colors.green}✅ Patient deletion completed successfully!${colors.reset}`);
      console.log(`${colors.green}   Total related records deleted/updated: ${deletedCount + bedsUpdated.count + referredPatientsUpdated.count}${colors.reset}\n`);
    });

  } catch (error) {
    console.error(`\n${colors.red}❌ Error deleting patient:${colors.reset}`, error.message);
    console.error(error);
    rl.close();
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║           DELETE PATIENT - CAUTION REQUIRED!              ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  const identifier = await question(`${colors.cyan}Enter patient MRN or Patient Number: ${colors.reset}`);

  if (!identifier || identifier.trim() === '') {
    console.log(`\n${colors.red}❌ Error: MRN or Patient Number cannot be empty${colors.reset}\n`);
    rl.close();
    process.exit(1);
  }

  await deletePatient(identifier.trim());
}

main();
