// Check what statuses exist in PatientVisit table and find truly stalled visits
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeVisits() {
  console.log('Analyzing PatientVisit statuses...\n');

  // Count visits by status
  const statusCounts = await prisma.patientVisit.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  console.log('Visit status distribution:');
  statusCounts.forEach(s => {
    console.log(`  ${s.status}: ${s._count.id}`);
  });

  // Find truly stalled visits (old CHECKED_IN or in-progress states without completion)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const stalledVisits = await prisma.patientVisit.findMany({
    where: {
      status: {
        in: ['CHECKED_IN', 'WITH_OPTOMETRIST', 'AWAITING_DOCTOR', 'WITH_DOCTOR', 'DIAGNOSTICS_PENDING']
      },
      checkedInAt: {
        lte: twentyFourHoursAgo
      },
      optometristSeenAt: null,
      doctorSeenAt: null
    },
    select: {
      id: true,
      status: true,
      checkedInAt: true,
      appointmentId: true
    }
  });

  console.log(`\nStalled visits (>24h old, in-progress, never seen by staff):`);
  console.log(`Found: ${stalledVisits.length}`);
  
  if (stalledVisits.length > 0) {
    console.log('\nExamples:');
    stalledVisits.slice(0, 5).forEach(v => {
      const ageHours = Math.floor((Date.now() - v.checkedInAt.getTime()) / (1000 * 60 * 60));
      console.log(`  Visit ${v.id} | Status: ${v.status} | Age: ${ageHours}h`);
    });
  }

  await prisma.$disconnect();
}

analyzeVisits();
