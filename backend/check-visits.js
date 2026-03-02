const prisma = require('./src/utils/prisma');

async function checkVisits() {
  console.log('=== Checking Database State ===\n');
  
  // Check Appointments with CHECKED_IN status and their related PatientVisit records
  console.log('1. Checking CHECKED_IN Appointments...');
  const appointments = await prisma.appointment.findMany({
    where: {
      status: 'CHECKED_IN'
    },
    select: {
      id: true,
      patientId: true,
      appointmentDate: true,
      status: true,
      createdAt: true,
      patientVisit: {
        select: {
          id: true,
          status: true,
          checkedInAt: true,
          optometristSeenAt: true,
          doctorSeenAt: true,
          optometristCalledAt: true,
          doctorCalledAt: true
        }
      }
    },
    take: 20,
    orderBy: {
      appointmentDate: 'asc'
    }
  });

  console.log(`Found ${appointments.length} CHECKED_IN appointments\n`);
  
  if (appointments.length > 0) {
    appointments.forEach((apt, i) => {
      const age = Math.floor((new Date() - new Date(apt.appointmentDate)) / (1000 * 60 * 60 * 24));
      console.log(`${i + 1}. Appointment ID: ${apt.id}`);
      console.log(`   Patient: ${apt.patientId}`);
      console.log(`   Appointment Date: ${apt.appointmentDate}`);
      console.log(`   Age: ${age} days`);
      console.log(`   Appointment Status: ${apt.status}`);
      
      if (apt.patientVisit) {
        console.log(`   Visit ID: ${apt.patientVisit.id}`);
        console.log(`   Visit Status: ${apt.patientVisit.status}`);
        console.log(`   Checked in: ${apt.patientVisit.checkedInAt || 'NULL'}`);
        console.log(`   optometristSeenAt: ${apt.patientVisit.optometristSeenAt || 'NULL'}`);
        console.log(`   doctorSeenAt: ${apt.patientVisit.doctorSeenAt || 'NULL'}`);
        console.log(`   optometristCalledAt: ${apt.patientVisit.optometristCalledAt || 'NULL'}`);
        console.log(`   doctorCalledAt: ${apt.patientVisit.doctorCalledAt || 'NULL'}`);
      } else {
        console.log(`   ⚠️  No PatientVisit found!`);
      }
      console.log('');
    });

    // Analyze eligibility
    const withVisits = appointments.filter(a => a.patientVisit);
    const newCriteria = withVisits.filter(a => 
      a.patientVisit.status === 'CHECKED_IN' &&
      !a.patientVisit.optometristSeenAt && 
      !a.patientVisit.doctorSeenAt
    );

    console.log(`\nEligibility Analysis (for appointments > 24h old):`);
    console.log(`- Total CHECKED_IN appointments: ${appointments.length}`);
    console.log(`- With PatientVisit records: ${withVisits.length}`);
    console.log(`- Eligible for lifecycle correction (new criteria): ${newCriteria.length}`);
  }

  // Also check PatientVisit table directly
  console.log('\n\n2. Checking PatientVisit table directly...');
  const visits = await prisma.patientVisit.findMany({
    where: {
      status: 'CHECKED_IN'
    },
    select: {
      id: true,
      status: true,
      checkedInAt: true,
      optometristSeenAt: true,
      doctorSeenAt: true
    },
    take: 10
  });
  
  console.log(`Found ${visits.length} CHECKED_IN visits in PatientVisit table`);

  await prisma.$disconnect();
}

checkVisits().catch(console.error);
