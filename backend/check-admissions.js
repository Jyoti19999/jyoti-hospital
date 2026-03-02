// check-admissions.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllAdmissions() {
  try {
    const admissions = await prisma.ipdAdmission.findMany({
      take: 10,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('All IPD admissions (latest 10):');
    console.log('===============================');
    if (admissions.length === 0) {
      console.log('No IPD admissions found');
      // Create a test admission if none exist
      console.log('Creating a test admission...');
      
      const patients = await prisma.patient.findMany({
        take: 1,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          patientNumber: true
        }
      });
      
      if (patients.length > 0) {
        const testAdmission = await prisma.ipdAdmission.create({
          data: {
            patientId: patients[0].id,
            status: 'ADMITTED',
            admissionDate: new Date(),
            expectedDischarge: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            finalSurgeryAmount: 0,
            tentativeCharges: 5000,
            totalPaidAmount: 0,
            notes: 'Test admission for surgery scheduling'
          }
        });
        
        console.log(`Created test admission: ${testAdmission.id} for patient ${patients[0].firstName} ${patients[0].lastName}`);
      } else {
        console.log('No patients found to create test admission');
      }
    } else {
      admissions.forEach(admission => {
        console.log(`ID: ${admission.id}`);
        console.log(`Patient: ${admission.patient.firstName} ${admission.patient.lastName} (${admission.patient.patientNumber})`);
        console.log(`Status: ${admission.status}`);
        console.log(`finalSurgeryAmount: ${admission.finalSurgeryAmount}`);
        console.log(`surgeryPackageId: ${admission.surgeryPackageId || 'null'}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllAdmissions();