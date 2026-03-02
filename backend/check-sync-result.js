// Quick check to see current appointment vs visit status mismatches
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSync() {
  console.log('Checking for appointment-visit status mismatches...\n');

  const appointmentsWithVisits = await prisma.appointment.findMany({
    where: {
      patientVisit: { isNot: null }
    },
    select: {
      id: true,
      status: true,
      patientVisit: {
        select: { status: true }
      }
    }
  });

  const mismatched = appointmentsWithVisits.filter(
    a => a.status !== a.patientVisit.status
  );

  console.log(`Total appointments with visits: ${appointmentsWithVisits.length}`);
  console.log(`Mis-matched statuses: ${mismatched.length}\n`);

  if (mismatched.length > 0) {
    console.log('Examples of mismatches:');
    mismatched.slice(0, 5).forEach(a => {
      console.log(`  Appointment: ${a.status} | Visit: ${a.patientVisit.status}`);
    });
  }

  await prisma.$disconnect();
}

checkSync();
