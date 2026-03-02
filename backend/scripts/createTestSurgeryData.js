const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestSurgeryData() {
  try {
    console.log('🏥 Creating test surgery data...');

    // First, get some existing patients and staff
    const patients = await prisma.patient.findMany({
      take: 3,
      include: {
        patientVisits: true
      }
    });

    const staff = await prisma.staff.findMany({
      where: {
        staffType: {
          in: ['doctor', 'surgeon', 'nurse', 'anesthesiologist']
        },
        isActive: true
      }
    });

    // Get surgery types
    const surgeryTypes = await prisma.surgeryType.findMany({
      take: 3
    });

    if (patients.length === 0 || staff.length === 0) {
      console.log('❌ No patients or staff found. Please create some first.');
      return;
    }

    console.log(`Found ${patients.length} patients and ${staff.length} staff members`);

    // Create IPD admissions with SURGERY_SUGGESTED status
    const admissions = [];

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const surgeryType = surgeryTypes[i % surgeryTypes.length];
      const admittingStaff = staff.find(s => s.staffType === 'doctor') || staff[0];

      // Create a patient visit first
      const visit = await prisma.patientVisit.create({
        data: {
          patientId: patient.id,
          visitNumber: `V${Date.now()}-${i}`,
          visitDate: new Date(),
          visitType: 'IPD',
          chiefComplaint: 'Scheduled for surgical intervention',
          vitalSigns: {
            bloodPressure: '120/80',
            heartRate: '72',
            temperature: '98.6',
            weight: '65'
          },
          status: 'COMPLETED'
        }
      });

      const admission = await prisma.ipdAdmission.create({
        data: {
          patientId: patient.id,
          patientVisitId: visit.id,
          admittedBy: admittingStaff.id,
          admissionDate: new Date(),
          expectedDischarge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: 'SURGERY_SUGGESTED',
          surgeryTypeId: surgeryType?.id || null,
          currentStage: 'Surgery Suggested',
          priorityLevel: ['ROUTINE', 'HIGH', 'URGENT'][i % 3],
          journeyNotes: {
            notes: 'Patient evaluated and suggested for surgical intervention',
            createdAt: new Date(),
            createdBy: admittingStaff.id
          },
          nextAction: 'Schedule Surgery',
          fitnessAssessmentStarted: false,
          investigationsSuggested: false,
          fitnessCleared: false,
          preOpCompleted: false,
          surgeryCompleted: false,
          postOpCompleted: false,
          discharged: false
        }
      });

      admissions.push(admission);
      console.log(`✅ Created IPD admission for patient: ${patient.firstName} ${patient.lastName}`);
    }

    console.log(`🎉 Successfully created ${admissions.length} test IPD admissions with SURGERY_SUGGESTED status`);

    // Display the test data
    console.log('\n📋 Test Data Summary:');
    for (const admission of admissions) {
      const patient = patients.find(p => p.id === admission.patientId);
      const surgeryType = surgeryTypes.find(st => st.id === admission.surgeryTypeId);
      
      console.log(`- Patient: ${patient.firstName} ${patient.lastName} (${patient.patientNumber})`);
      console.log(`  Surgery Type: ${surgeryType?.name || 'None'}`);
      console.log(`  Priority: ${admission.priorityLevel}`);
      console.log(`  Status: ${admission.status}`);
      console.log(`  Admission Date: ${admission.admissionDate.toLocaleDateString()}\n`);
    }

    console.log('✅ Test data creation completed!');
    console.log('Now you should be able to see patients in the Surgery Scheduler tab.');

  } catch (error) {
    console.error('❌ Error creating test surgery data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createTestSurgeryData();
}

module.exports = { createTestSurgeryData };