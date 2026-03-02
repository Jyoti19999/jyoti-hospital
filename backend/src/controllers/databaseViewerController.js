// src/controllers/databaseViewerController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all patients with pagination
exports.getAllPatients = async (req, res) => {
  try {
    console.log('📊 Database Viewer: Fetching patients');
    const { page = 1, limit = 100, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { patientNumber: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          patientNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          gender: true,
          address: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.patient.count({ where })
    ]);

    console.log(`✅ Found ${patients.length} patients`);

    res.json({
      success: true,
      data: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: error.message
    });
  }
};

// Get all appointments with pagination
exports.getAllAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 100, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search ? {
      OR: [
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientNumber: { contains: search, mode: 'insensitive' } } },
        { tokenNumber: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true,
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
          }
        }
      }),
      prisma.appointment.count({ where })
    ]);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

// Get all staff with pagination
exports.getAllStaff = async (req, res) => {
  try {
    const { page = 1, limit = 100, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { staffType: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          staffType: true,
          department: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.staff.count({ where })
    ]);

    res.json({
      success: true,
      data: staff,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff',
      error: error.message
    });
  }
};

// Get all medical records with pagination
exports.getAllMedicalRecords = async (req, res) => {
  try {
    const { page = 1, limit = 100, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search ? {
      OR: [
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { patient: { patientNumber: { contains: search, mode: 'insensitive' } } }
      ]
    } : {};

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true
            }
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffType: true
            }
          }
        }
      }),
      prisma.medicalRecord.count({ where })
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medical records',
      error: error.message
    });
  }
};

// Get database statistics
exports.getDatabaseStatistics = async (req, res) => {
  try {
    const [
      patientsCount,
      appointmentsCount,
      staffCount,
      recordsCount
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.staff.count(),
      prisma.medicalRecord.count()
    ]);

    res.json({
      success: true,
      data: {
        patients: {
          count: patientsCount,
          lastUpdated: new Date().toISOString()
        },
        appointments: {
          count: appointmentsCount,
          lastUpdated: new Date().toISOString()
        },
        staff: {
          count: staffCount,
          lastUpdated: new Date().toISOString()
        },
        records: {
          count: recordsCount,
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching database statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch database statistics',
      error: error.message
    });
  }
};

// Delete patient
exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting patient:', id);

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: id },
      include: {
        _count: {
          select: {
            appointments: true,
            bills: true,
            ipdAdmissions: true,
            patientQueue: true,
            patientVisits: true,
            insuranceClaims: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    console.log('📊 Patient has related records:', patient._count);

    // Use transaction to delete patient and all related records
    await prisma.$transaction(async (tx) => {
      // Delete related records in order (child records first)
      
      // Delete patient queue entries
      await tx.patientQueue.deleteMany({
        where: { patientId: id }
      });

      // Delete patient visits
      await tx.patientVisit.deleteMany({
        where: { patientId: id }
      });

      // Delete insurance claims
      await tx.insuranceClaim.deleteMany({
        where: { patientId: id }
      });

      // Delete bills
      await tx.bill.deleteMany({
        where: { patientId: id }
      });

      // Delete IPD admissions
      await tx.ipdAdmission.deleteMany({
        where: { patientId: id }
      });

      // Delete appointments
      await tx.appointment.deleteMany({
        where: { patientId: id }
      });

      // Delete medical records
      await tx.medicalRecord.deleteMany({
        where: { patientId: id }
      });

      // Finally, delete the patient
      await tx.patient.delete({
        where: { id: id }
      });
    });

    console.log('✅ Patient and all related records deleted successfully');

    res.json({
      success: true,
      message: 'Patient and all related records deleted successfully',
      deletedCounts: patient._count
    });
  } catch (error) {
    console.error('❌ Error deleting patient:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient',
      error: error.message
    });
  }
};

// Update patient
exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log('✏️ Updating patient:', id);

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: id }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Update patient
    const updatedPatient = await prisma.patient.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        patientNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('✅ Patient updated successfully');

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: updatedPatient
    });
  } catch (error) {
    console.error('❌ Error updating patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient',
      error: error.message
    });
  }
};
