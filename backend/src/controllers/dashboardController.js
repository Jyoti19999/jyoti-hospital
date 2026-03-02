const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get today's scheduled surgeries
const getTodaysSurgeries = async (req, res) => {
  try {
    console.log('📋 Fetching today\'s surgeries...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);



    const surgeries = await prisma.ipdAdmission.findMany({
      where: {
        status: 'SURGERY_SCHEDULED',
        surgeryDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mrn: true,
            patientNumber: true
          }
        },
        surgeon: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffType: true
          }
        },
        anesthesiologist: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        sister: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        surgeryTypeDetail: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true
          }
        },
        otRoom: {
          select: {
            id: true,
            roomNumber: true,
            roomName: true,
            status: true
          }
        }
      },
      orderBy: {
        surgeryDate: 'asc'
      }
    });

    console.log(`✅ Found ${surgeries.length} surgeries`);

    res.status(200).json({
      success: true,
      message: 'Today\'s surgeries retrieved successfully',
      data: surgeries
    });

  } catch (error) {
    console.error('Get today\'s surgeries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today\'s surgeries',
      error: error.message
    });
  }
};

// Get today's appointments
const getTodaysAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: today,
          lt: tomorrow
        },
        status: {
          in: ['SCHEDULED', 'CHECKED_IN']
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mrn: true,
            patientNumber: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffType: true
          }
        },
        patientVisit: {
          select: {
            id: true,
            patientQueue: {
              select: {
                assignedStaff: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    staffType: true
                  }
                }
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        }
      },
      orderBy: {
        appointmentDate: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Today\'s appointments retrieved successfully',
      data: appointments
    });

  } catch (error) {
    console.error('Get today\'s appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today\'s appointments',
      error: error.message
    });
  }
};

// Get queue status
const getQueueStatus = async (req, res) => {
  try {
    console.log('🔍 Fetching queue status...');
    const { queueFor } = req.query; // OPTOMETRIST or OPHTHALMOLOGIST

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereClause = {
      status: {
        in: ['WAITING', 'CALLED', 'IN_PROGRESS']
      },
      joinedAt: {
        gte: today,
        lt: tomorrow
      }
    };

    if (queueFor) {
      whereClause.queueFor = queueFor;
    }

    console.log('📋 Queue where clause:', JSON.stringify(whereClause, null, 2));

    const queueData = await prisma.patientQueue.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            mrn: true,
            patientNumber: true
          }
        },
        assignedStaff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffType: true
          }
        },
        patientVisit: {
          select: {
            id: true,
            visitNumber: true,
            status: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { joinedAt: 'asc' }
      ]
    });

    console.log(`✅ Found ${queueData.length} total queue records`);

    // Group by queue type
    const grouped = {
      OPTOMETRIST: queueData.filter(q => q.queueFor === 'OPTOMETRIST'),
      OPHTHALMOLOGIST: queueData.filter(q => q.queueFor === 'OPHTHALMOLOGIST')
    };

    console.log(`📊 Grouped: OPTOMETRIST=${grouped.OPTOMETRIST.length}, OPHTHALMOLOGIST=${grouped.OPHTHALMOLOGIST.length}`);

    res.status(200).json({
      success: true,
      message: 'Queue status retrieved successfully',
      data: queueFor ? queueData : grouped
    });

  } catch (error) {
    console.error('Get queue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue status',
      error: error.message
    });
  }
};

// Get recent patient registrations
const getRecentRegistrations = async (req, res) => {
  try {
    console.log('👥 Fetching recent patient registrations...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // First, try to get today's registrations
    const todaysPatients = await prisma.patient.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        mrn: true,
        patientNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        createdAt: true
      }
    });

    console.log(`📋 Found ${todaysPatients.length} patients registered today`);

    // If we have today's patients, return them
    if (todaysPatients.length > 0) {
      return res.status(200).json({
        success: true,
        message: `${todaysPatients.length} patients registered today`,
        data: todaysPatients,
        isToday: true
      });
    }

    // Otherwise, get the latest 5 patients
    console.log('📋 No patients today, fetching latest 5...');
    const latestPatients = await prisma.patient.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        mrn: true,
        patientNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        createdAt: true
      }
    });

    console.log(`✅ Returning ${latestPatients.length} latest patients`);

    res.status(200).json({
      success: true,
      message: 'Latest patient registrations retrieved',
      data: latestPatients,
      isToday: false
    });

  } catch (error) {
    console.error('Get recent registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent registrations',
      error: error.message
    });
  }
};

module.exports = {
  getTodaysSurgeries,
  getTodaysAppointments,
  getQueueStatus,
  getRecentRegistrations
};
