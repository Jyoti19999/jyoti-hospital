const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to format time
const format = (date, formatStr) => {
  const d = new Date(date);
  if (formatStr === 'HH:mm') {
    return d.toTimeString().slice(0, 5);
  }
  return d.toISOString();
};

// Helper function to get date only
const getDateOnly = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper function to build date filter
const buildDateFilter = (fromDate, toDate) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (fromDate && toDate) {
    // Both dates provided
    const from = getDateOnly(new Date(fromDate));
    const to = getDateOnly(new Date(toDate));
    
    if (fromDate === toDate) {
      // Same date - specific date
      return {
        gte: from,
        lt: new Date(from.getTime() + 24 * 60 * 60 * 1000)
      };
    } else {
      // Date range
      return {
        gte: from,
        lte: new Date(to.getTime() + 24 * 60 * 60 * 1000)
      };
    }
  } else if (fromDate) {
    // Only from date - from that date to today
    return {
      gte: getDateOnly(new Date(fromDate)),
      lte: today
    };
  } else if (toDate) {
    // Only to date - all data up to that date
    return {
      lte: new Date(getDateOnly(new Date(toDate)).getTime() + 24 * 60 * 60 * 1000)
    };
  }
  
  // No dates - return all
  return undefined;
};

// Get Optometrist Completed Examinations
const getOptometristExaminations = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    console.log('📊 Optometrist Examinations Query:', { fromDate, toDate });
    
    let whereClause = {
      examinationStatus: 'completed'
    };

    // Apply date filters using the helper function
    const dateFilter = buildDateFilter(fromDate, toDate);
    if (dateFilter) {
      whereClause.completedAt = dateFilter;
      console.log('📅 Date filter:', dateFilter);
    }

    console.log('🔍 Where clause:', JSON.stringify(whereClause, null, 2));

    const examinations = await prisma.optometristExamination.findMany({
      where: whereClause,
      include: {
        patientVisit: {
          include: {
            patient: true
          }
        },
        optometrist: {
          select: {
            firstName: true,
            lastName: true,
            staffType: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    console.log(`✅ Found ${examinations.length} optometrist examinations`);

    res.json({
      success: true,
      data: examinations,
      count: examinations.length
    });
  } catch (error) {
    console.error('Get optometrist examinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch optometrist examinations',
      error: error.message
    });
  }
};

// Get Appointments Data
const getAppointmentsReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    console.log('📊 Appointments Query:', { fromDate, toDate });
    
    let whereClause = {};

    const dateFilter = buildDateFilter(fromDate, toDate);
    if (dateFilter) {
      whereClause.appointmentDate = dateFilter;
      console.log('📅 Appointment date filter:', dateFilter);
    }

    console.log('🔍 Where clause:', JSON.stringify(whereClause, null, 2));

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: true,
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            staffType: true
          }
        }
      },
      orderBy: {
        appointmentDate: 'desc'
      }
    });

    console.log(`✅ Found ${appointments.length} appointments`);

    res.json({
      success: true,
      data: appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('Get appointments report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

// Get Billing Report
const getBillingReport = async (req, res) => {
  try {
    const { fromDate, toDate, paymentType, paymentMode, claimStatus } = req.query;
    
    let whereClause = {};

    // Add payment type filter
    if (paymentType && paymentType !== 'all') {
      whereClause.paymentType = paymentType;
    }

    // Add payment mode filter
    if (paymentMode && paymentMode !== 'all') {
      whereClause.paymentMode = paymentMode;
    }

    // Add claim status filter
    if (claimStatus && claimStatus !== 'all') {
      whereClause.claimStatus = claimStatus;
    }

    const dateFilter = buildDateFilter(fromDate, toDate);
    if (dateFilter) {
      whereClause.createdAt = dateFilter;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        patientVisit: {
          include: {
            patient: true
          }
        },
        ipdAdmission: {
          include: {
            patient: true
          }
        },
        insuranceProvider: true,
        recordedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (error) {
    console.error('Get billing report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing data',
      error: error.message
    });
  }
};

// Get Consultation Payments
const getConsultationPayments = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let whereClause = {
      paymentType: 'OPD'
    };

    const dateFilter = buildDateFilter(fromDate, toDate);
    if (dateFilter) {
      whereClause.createdAt = dateFilter;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        patientVisit: {
          include: {
            patient: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (error) {
    console.error('Get consultation payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultation payments',
      error: error.message
    });
  }
};

// Get Surgery Payments
const getSurgeryPayments = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let whereClause = {
      paymentType: 'IPD'
    };

    const dateFilter = buildDateFilter(fromDate, toDate);
    if (dateFilter) {
      whereClause.createdAt = dateFilter;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        patientVisit: {
          include: {
            patient: true
          }
        },
        ipdAdmission: {
          include: {
            patient: true
          }
        },
        insuranceProvider: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (error) {
    console.error('Get surgery payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch surgery payments',
      error: error.message
    });
  }
};

// Get Doctor Examinations
const getDoctorExaminations = async (req, res) => {
  try {
    const { fromDate, toDate, doctorId } = req.query;
    
    let whereClause = {
      examinationStatus: 'completed'
    };

    if (doctorId && doctorId !== 'all') {
      whereClause.doctorId = doctorId;
    }

    const dateFilter = buildDateFilter(fromDate, toDate);
    if (dateFilter) {
      whereClause.completedAt = dateFilter;
    }

    const examinations = await prisma.ophthalmologistExamination.findMany({
      where: whereClause,
      include: {
        patientVisit: {
          include: {
            patient: true
          }
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            staffType: true,
            department: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: examinations,
      count: examinations.length
    });
  } catch (error) {
    console.error('Get doctor examinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor examinations',
      error: error.message
    });
  }
};

// Get Completed Surgeries
const getCompletedSurgeries = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let whereClause = {
      surgeryCompleted: true
    };

    const dateFilter = buildDateFilter(fromDate, toDate);
    if (dateFilter) {
      whereClause.surgeryDate = dateFilter;
    }

    const surgeries = await prisma.ipdAdmission.findMany({
      where: whereClause,
      include: {
        patient: true,
        surgeryTypeDetail: true,
        surgeon: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        sister: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        anesthesiologist: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        otRoom: true,
        lens: true,
        surgeryPackageDetail: true,
        insuranceProvider: true,
        admittingStaff: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        claimSubmitter: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        claimApprover: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        surgeryDate: 'desc'
      }
    });

    // Fetch staff details for discharge and fitness fields
    const staffIds = new Set();
    surgeries.forEach(surgery => {
      if (surgery.dischargedBy) staffIds.add(surgery.dischargedBy);
      if (surgery.fitnessAssessmentBy) staffIds.add(surgery.fitnessAssessmentBy);
      if (surgery.fitnessClearedBy) staffIds.add(surgery.fitnessClearedBy);
    });

    const staffMap = {};
    if (staffIds.size > 0) {
      const staffList = await prisma.staff.findMany({
        where: { id: { in: Array.from(staffIds) } },
        select: { id: true, firstName: true, lastName: true }
      });
      staffList.forEach(staff => {
        staffMap[staff.id] = `${staff.firstName} ${staff.lastName}`;
      });
    }

    // Add staff names to surgeries
    const enrichedSurgeries = surgeries.map(surgery => ({
      ...surgery,
      dischargedByStaff: surgery.dischargedBy ? staffMap[surgery.dischargedBy] : null,
      fitnessAssessmentByStaff: surgery.fitnessAssessmentBy ? staffMap[surgery.fitnessAssessmentBy] : null,
      fitnessClearedByStaff: surgery.fitnessClearedBy ? staffMap[surgery.fitnessClearedBy] : null
    }));

    res.json({
      success: true,
      data: enrichedSurgeries,
      count: enrichedSurgeries.length
    });
  } catch (error) {
    console.error('Get completed surgeries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completed surgeries',
      error: error.message
    });
  }
};

// Get Scheduled Surgeries
const getScheduledSurgeries = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let whereClause = {
      surgeryCompleted: false,
      surgeryDate: {
        not: null
      }
    };

    const dateFilter = buildDateFilter(fromDate, toDate);
    if (dateFilter) {
      whereClause.surgeryDate = dateFilter;
    }

    const surgeries = await prisma.ipdAdmission.findMany({
      where: whereClause,
      include: {
        patient: true,
        surgeryTypeDetail: true,
        surgeon: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        sister: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        anesthesiologist: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        otRoom: true,
        lens: true,
        surgeryPackageDetail: true,
        insuranceProvider: true,
        admittingStaff: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        claimSubmitter: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        claimApprover: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        surgeryDate: 'asc'
      }
    });

    res.json({
      success: true,
      data: surgeries,
      count: surgeries.length
    });
  } catch (error) {
    console.error('Get scheduled surgeries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled surgeries',
      error: error.message
    });
  }
};

// Get Anesthesia Cases
const getAnesthesiaCases = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let whereClause = {
      anesthesiologistId: { not: null }
    };

    const dateFilter = buildDateFilter(fromDate, toDate);
    if (dateFilter) {
      whereClause.surgeryDate = dateFilter;
    }

    const cases = await prisma.ipdAdmission.findMany({
      where: whereClause,
      include: {
        patient: true,
        surgeryTypeDetail: true,
        anesthesiologist: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        otRoom: true
      },
      orderBy: {
        surgeryDate: 'desc'
      }
    });

    res.json({
      success: true,
      data: cases,
      count: cases.length
    });
  } catch (error) {
    console.error('Get anesthesia cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch anesthesia cases',
      error: error.message
    });
  }
};

// Get Pending Claims
const getPendingClaims = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let whereClause = {
      claimStatus: 'PENDING'
    };

    const dateFilter = buildDateFilter(fromDate, toDate);
    if (dateFilter) {
      whereClause.createdAt = dateFilter;
    }

    const claims = await prisma.payment.findMany({
      where: whereClause,
      include: {
        patientVisit: {
          include: {
            patient: true
          }
        },
        insuranceProvider: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: claims,
      count: claims.length
    });
  } catch (error) {
    console.error('Get pending claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending claims',
      error: error.message
    });
  }
};

// Get Completed Claims
const getCompletedClaims = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let whereClause = {
      claimStatus: 'COMPLETED'
    };

    const dateFilter = buildDateFilter(fromDate, toDate);
    if (dateFilter) {
      whereClause.updatedAt = dateFilter;
    }

    const claims = await prisma.payment.findMany({
      where: whereClause,
      include: {
        patientVisit: {
          include: {
            patient: true
          }
        },
        insuranceProvider: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: claims,
      count: claims.length
    });
  } catch (error) {
    console.error('Get completed claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completed claims',
      error: error.message
    });
  }
};

// Get all doctors for filter
const getDoctorsList = async (req, res) => {
  try {
    const doctors = await prisma.staff.findMany({
      where: {
        staffType: 'doctor',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: true
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    console.error('Get doctors list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors list',
      error: error.message
    });
  }
};

module.exports = {
  getOptometristExaminations,
  getAppointmentsReport,
  getBillingReport,
  getConsultationPayments,
  getSurgeryPayments,
  getDoctorExaminations,
  getCompletedSurgeries,
  getScheduledSurgeries,
  getAnesthesiaCases,
  getPendingClaims,
  getCompletedClaims,
  getDoctorsList
};
