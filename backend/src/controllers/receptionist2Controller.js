// src/controllers/receptionist2Controller.js
const { PrismaClient } = require('@prisma/client');
const receptionist2Service = require('../services/receptionist2Service');

const prisma = new PrismaClient();

class Receptionist2Controller {
  /**
   * Get patients that have been checked by optometrists
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getOptometristCheckedPatients(req, res) {
    try {
      console.log('🔍 Receptionist2: Getting optometrist checked patients');
      console.log('📋 Query filters:', req.query);

      const filters = {
        date: req.query.date,
        status: req.query.status,
        patientName: req.query.patientName,
        tokenNumber: req.query.tokenNumber
      };

      const result = await receptionist2Service.getOptometristCheckedPatients(filters);

      console.log(`✅ Retrieved ${result.data.patients.length} optometrist checked patients`);

      res.json({
        success: true,
        message: 'Optometrist checked patients retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error getting optometrist checked patients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get optometrist checked patients',
        error: error.message
      });
    }
  }

  /**
   * Mark ophthalmology queue patient as reviewed
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async markOphthalmologyPatientAsReviewed(req, res) {
    try {
      const { queueEntryId } = req.params;
      const { notes } = req.body;
      const receptionist2Id = req.user.id;

      const result = await receptionist2Service.markOphthalmologyPatientAsReviewed(queueEntryId, receptionist2Id, notes);

    

      res.json({
        success: true,
        message: 'Patient marked as present successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error in marking ophthalmology patient as present:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark patient as present',
        error: error.message
      });
    }
  }

  /**
   * Toggle review status for ophthalmology queue patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async toggleOphthalmologyPatientReview(req, res) {
    try {
      const { queueEntryId } = req.params;
      const { notes } = req.body;
      const receptionist2Id = req.user.id;

      console.log('🔄 Receptionist2: Toggling ophthalmology patient review status:', queueEntryId);

      const result = await receptionist2Service.toggleOphthalmologyPatientReview(queueEntryId, receptionist2Id, notes);

      console.log('✅ Ophthalmology patient review status toggled successfully');

      res.json({
        success: true,
        message: 'Patient review status toggled successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error toggling ophthalmology patient review status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle patient review status',
        error: error.message
      });
    }
  }

  /**
   * Unmark ophthalmology queue patient as reviewed
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async unmarkOphthalmologyPatientAsReviewed(req, res) {
    try {
      const { queueEntryId } = req.params;



      const result = await receptionist2Service.unmarkOphthalmologyPatientAsReviewed(queueEntryId);

      

      res.json({
        success: true,
        message: 'Patient marked as present successfully',
        data: result.data
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to mark patient as absent',
        error: error.message
      });
    }
  }

  /**
   * Get detailed patient information for ophthalmology queue patients
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getOphthalmologyPatientDetails(req, res) {
    try {
      const { visitId } = req.params;
      
      console.log('🔍 Receptionist2: Getting ophthalmology patient details for visit:', visitId);

      const result = await receptionist2Service.getOphthalmologyPatientDetails(visitId);

      console.log('✅ Retrieved ophthalmology patient details successfully');

      res.json({
        success: true,
        message: 'Patient details retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error getting ophthalmology patient details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get patient details',
        error: error.message
      });
    }
  }

  /**
   * Get detailed examination data for a specific patient
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPatientExaminationDetails(req, res) {
    try {
      const { examinationId } = req.params;

      console.log(`🔍 Receptionist2: Getting examination details for ID: ${examinationId}`);

      if (!examinationId) {
        return res.status(400).json({
          success: false,
          message: 'Examination ID is required'
        });
      }

      const result = await receptionist2Service.getPatientExaminationDetails(examinationId);

      console.log(`✅ Retrieved examination details for examination ID: ${examinationId}`);

      res.json({
        success: true,
        message: 'Examination details retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error getting examination details:', error);

      if (error.message === 'Examination not found') {
        return res.status(404).json({
          success: false,
          message: 'Examination not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get examination details',
        error: error.message
      });
    }
  }

  /**
   * Get current queue status across all queues
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCurrentQueueStatus(req, res) {
    try {
      console.log('🔍 Receptionist2: Getting current queue status');

      const result = await receptionist2Service.getCurrentQueueStatus();

      console.log(`✅ Retrieved queue status for ${Object.keys(result.data.queuesByType).length} queue types`);

      res.json({
        success: true,
        message: 'Current queue status retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error getting current queue status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get current queue status',
        error: error.message
      });
    }
  }

  /**
   * Get receptionist2 dashboard statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDashboardStatistics(req, res) {
    try {
      console.log('🔍 Receptionist2: Getting dashboard statistics');

      const result = await receptionist2Service.getDashboardStatistics();

      console.log('✅ Retrieved receptionist2 dashboard statistics');

      res.json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error getting dashboard statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard statistics',
        error: error.message
      });
    }
  }

  /**
   * Search patients by various criteria
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchPatients(req, res) {
    try {
      const { query, searchType } = req.query;

      console.log(`🔍 Receptionist2: Searching patients - Type: ${searchType}, Query: ${query}`);

      if (!query || !searchType) {
        return res.status(400).json({
          success: false,
          message: 'Search query and search type are required'
        });
      }

      // Build filters based on search type
      let filters = {};

      switch (searchType) {
        case 'name':
          filters.patientName = query;
          break;
        case 'token':
          filters.tokenNumber = query;
          break;
        case 'phone':
          // For phone search, we'll need to modify the service to support this
          filters.phone = query;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid search type. Use: name, token, or phone'
          });
      }

      const result = await receptionist2Service.getOptometristCheckedPatients(filters);

      console.log(`✅ Search completed - Found ${result.data.patients.length} patients`);

      res.json({
        success: true,
        message: `Search completed for ${searchType}: ${query}`,
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error searching patients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search patients',
        error: error.message
      });
    }
  }

  /**
   * Get receptionist2 dashboard (main dashboard view)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDashboard(req, res) {
    try {
      console.log('🔍 Receptionist2: Accessing dashboard');
      console.log('👤 User:', req.user.firstName, req.user.lastName);

      // Get dashboard data
      const dashboardResult = await receptionist2Service.getDashboardStatistics();

      res.json({
        success: true,
        message: 'Receptionist2 dashboard accessed successfully',
        data: {
          user: {
            id: req.user.id,
            name: `${req.user.firstName} ${req.user.lastName}`,
            staffType: req.user.staffType,
            employeeId: req.user.employeeId
          },
          dashboard: dashboardResult.data,
          accessTime: new Date()
        }
      });

    } catch (error) {
      console.error('❌ Error accessing receptionist2 dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to access dashboard',
        error: error.message
      });
    }
  }

  /**
   * Get current optometrist queue
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getOptometristQueue(req, res) {
    try {
      console.log('🔍 Receptionist2: Getting optometrist queue');

      const result = await receptionist2Service.getOptometristQueue();

      console.log(`✅ Retrieved optometrist queue with ${result.data.queueEntries.length} patients`);

      res.json({
        success: true,
        message: 'Optometrist queue retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error getting optometrist queue:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get optometrist queue',
        error: error.message
      });
    }
  }

  /**
   * Mark patient as reviewed by receptionist2
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async markPatientAsReviewed(req, res) {
    try {
      const { examinationId } = req.params;
      const { notes } = req.body;
      const receptionist2Id = req.user.id;

  

      if (!examinationId) {
        return res.status(400).json({
          success: false,
          message: 'Examination ID is required'
        });
      }

      const result = await receptionist2Service.markPatientAsReviewed(examinationId, receptionist2Id, notes);

    

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error marking patient as present:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Examination not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to mark patient as present',
        error: error.message
      });
    }
  }

  /**
   * Unmark patient as reviewed by receptionist2
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async unmarkPatientAsReviewed(req, res) {
    try {
      const { examinationId } = req.params;

      if (!examinationId) {
        return res.status(400).json({
          success: false,
          message: 'Examination ID is required'
        });
      }

      const result = await receptionist2Service.unmarkPatientAsReviewed(examinationId);

      

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Examination not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to mark patient as absent',
        error: error.message
      });
    }
  }

  /**
   * Register a new patient with emergency assessment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async registerPatient(req, res) {
    try {
      const { patientData, emergencyAssessment, optometristData } = req.body;
      const receptionist2Id = req.user.id;

      console.log('🏥 Receptionist2: Patient registration request');
      console.log('👤 Patient:', patientData?.firstName, patientData?.lastName);
      console.log('👁️ Optometrist data provided:', !!optometristData);

      // Validate required data
      if (!patientData || !emergencyAssessment) {
        return res.status(400).json({
          success: false,
          message: 'Patient data and emergency assessment are required'
        });
      }

      // Validate required patient fields
      const requiredFields = ['firstName', 'middleName', 'lastName', 'phone'];
      const missingFields = requiredFields.filter(field => !patientData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      const receptionist2PatientService = require('../services/receptionist2PatientService');
      const result = await receptionist2PatientService.registerPatient(
        patientData, 
        emergencyAssessment, 
        receptionist2Id,
        optometristData // Pass optometrist data if provided
      );

      console.log(`✅ Patient registered successfully by receptionist2`);

      res.status(201).json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error registering patient:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: 'Patient already exists with this email or phone number'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to register patient',
        error: error.message
      });
    }
  }

  /**
   * Get today's registrations by receptionist2
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTodayRegistrations(req, res) {
    try {
      const receptionist2Id = req.user.id;

      console.log(`📋 Receptionist2: Getting today's registrations for ${receptionist2Id}`);

      const receptionist2PatientService = require('../services/receptionist2PatientService');
      const result = await receptionist2PatientService.getTodayRegistrations(receptionist2Id);

      console.log(`✅ Retrieved ${result.data.registrations.length} registrations for today`);

      res.json({
        success: true,
        message: 'Today\'s registrations retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error getting today\'s registrations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get today\'s registrations',
        error: error.message
      });
    }
  }

  /**
   * Get registration statistics for dashboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getRegistrationStatistics(req, res) {
    try {
      const receptionist2Id = req.user.id;

      console.log(`📊 Receptionist2: Getting registration statistics`);

      const receptionist2PatientService = require('../services/receptionist2PatientService');
      const result = await receptionist2PatientService.getRegistrationStatistics(receptionist2Id);

      console.log(`✅ Retrieved registration statistics`);

      res.json({
        success: true,
        message: 'Registration statistics retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error getting registration statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get registration statistics',
        error: error.message
      });
    }
  }
  /**
   * Handle emergency routing for already registered patients
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handleEmergencyRouting(req, res) {
    try {
      const { patientId, appointmentId, emergencyAssessment } = req.body;
      const receptionist2Id = req.user.id;

      console.log('🚨 Receptionist2: Handling emergency routing for patient:', patientId);

      // Validate required data
      if (!patientId || !appointmentId || !emergencyAssessment) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID, appointment ID, and emergency assessment are required'
        });
      }

      const receptionist2PatientService = require('../services/receptionist2PatientService');
      const result = await receptionist2PatientService.handleEmergencyRouting(
        patientId,
        appointmentId,
        emergencyAssessment,
        receptionist2Id
      );

      console.log(`✅ Emergency routing completed for patient ${patientId}`);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error in emergency routing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to handle emergency routing',
        error: error.message
      });
    }
  }

  /**
   * Get ophthalmology queue patients
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getOphthalmologyQueue(req, res) {
    try {
      const { date, status, patientName } = req.query;

      console.log('🔍 Receptionist2: Getting ophthalmology queue', {
        date,
        status,
        patientName
      });

      const receptionist2Service = require('../services/receptionist2Service');
      const result = await receptionist2Service.getOphthalmologyQueue({
        date,
        status,
        patientName
      });

      console.log(`✅ Retrieved ${result.data.patients.length} patients from ophthalmology queue`);

      res.json({
        success: true,
        message: 'Ophthalmology queue retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error getting ophthalmology queue:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get ophthalmology queue',
        error: error.message
      });
    }
  }

  /**
   * Get doctor-specific ophthalmology queues
   * Groups patients by their assigned doctor
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDoctorSpecificQueues(req, res) {
    try {
      const { date } = req.query;

      console.log('🔍 Receptionist2: Getting doctor-specific queues', { date });

      const receptionist2Service = require('../services/receptionist2Service');
      const result = await receptionist2Service.getDoctorSpecificQueues({ date });

      console.log(`✅ Retrieved ${result.data.totalDoctors} doctor queues with assigned patients`);

      res.json({
        success: true,
        message: 'Doctor-specific queues retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error getting doctor-specific queues:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get doctor-specific queues',
        error: error.message
      });
    }
  }

  /**
   * Assign a patient to an ophthalmologist
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async assignPatientToOphthalmologist(req, res) {
    try {
      const { queueEntryId } = req.params;
      const { ophthalmologistId } = req.body;
      const receptionist2Id = req.user.id;

      console.log('👨‍⚕️ Receptionist2: Assigning patient to ophthalmologist:', {
        queueEntryId,
        ophthalmologistId,
        receptionist2Id
      });

      if (!ophthalmologistId) {
        return res.status(400).json({
          success: false,
          message: 'Ophthalmologist ID is required'
        });
      }

      const receptionist2Service = require('../services/receptionist2Service');
      const result = await receptionist2Service.assignPatientToOphthalmologist(
        queueEntryId,
        ophthalmologistId,
        receptionist2Id
      );

      // Emit WebSocket event for real-time updates
      const { emitPatientAssigned } = require('../socket/channels/queueChannel');
      console.log('📡 [REC2-ASSIGN] Emitting patient-assigned event:', { 
        doctorId: ophthalmologistId, 
        queueEntryId,
        receptionist2Id 
      });
      
      emitPatientAssigned({
        queueEntryId,
        doctorId: ophthalmologistId,
        patientId: result.data?.patientId,
        patientName: result.data?.patientName || result.data?.patient?.firstName
          ? `${result.data?.patient?.firstName || ''} ${result.data?.patient?.lastName || ''}`.trim()
          : undefined,
        assignedBy: 'receptionist2',
        timestamp: new Date()
      });

      console.log('📡 [REC2-ASSIGN] WebSocket events emitted successfully');
      console.log('✅ Patient assigned to ophthalmologist successfully');

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error assigning patient to ophthalmologist:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign patient to ophthalmologist',
        error: error.message
      });
    }
  }

  /**
   * Get patients on hold waiting for eye drops
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getOnHoldPatients(req, res) {
    try {
      const { date } = req.query;

      console.log('⏸️ Receptionist2: Getting ON_HOLD patients', { date });

      const receptionist2Service = require('../services/receptionist2Service');
      const result = await receptionist2Service.getOnHoldPatients({ date });

      console.log(`✅ Retrieved ${result.data.patients.length} ON_HOLD patients`);

      res.json({
        success: true,
        message: 'ON_HOLD patients retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error getting ON_HOLD patients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get ON_HOLD patients',
        error: error.message
      });
    }
  }

  /**
   * Get available ophthalmologists for assignment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAvailableOphthalmologists(req, res) {
    try {
      console.log('👨‍⚕️ Receptionist2: Getting available ophthalmologists');

      const receptionist2Service = require('../services/receptionist2Service');
      const result = await receptionist2Service.getAvailableOphthalmologists();

      console.log(`✅ Retrieved ${result.data.count} available ophthalmologists`);

      res.json({
        success: true,
        message: 'Available ophthalmologists retrieved successfully',
        data: result.data
      });

    } catch (error) {
      console.error('❌ Error getting available ophthalmologists:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available ophthalmologists',
        error: error.message
      });
    }
  }

  // =================
  // IPD INTEGRATION METHODS FOR RECEPTIONIST2
  // =================

  /**
   * Get today's surgeries for receptionist2 dashboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTodaysSurgeries(req, res) {
    try {
      console.log('🏥 Receptionist2: Getting today\'s surgeries');

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const surgeries = await prisma.ipdAdmission.findMany({
        where: {
          surgeryDate: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true,
              phone: true,
              gender: true,
              dateOfBirth: true
            }
          },
          surgeon: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true,
              staffType: true
            }
          },
          fitnessReports: {
            select: {
              id: true,
              fitnessStatus: true,
              assessmentDate: true,
              fitnessNotes: true
            },
            orderBy: { assessmentDate: 'desc' },
            take: 1
          },
          preOpAssessments: {
            select: {
              id: true,
              assessmentDate: true,
              surgicalPlan: true
            },
            orderBy: { assessmentDate: 'desc' },
            take: 1
          },
          surgeryMetrics: {
            select: {
              id: true,
              surgeryStartTime: true,
              surgeryEndTime: true,
              surgeryDuration: true
            },
            orderBy: { surgeryStartTime: 'desc' },
            take: 1
          },
          surgeryDayVisit: {
            select: {
              id: true,
              status: true,
              visitDate: true
            }
          }
        },
        orderBy: { surgeryDate: 'asc' }
      });

      // Add workflow status for each surgery
      const surgeriesWithStatus = surgeries.map(surgery => {
        const latestFitness = surgery.fitnessReports[0];
        const latestPreOp = surgery.preOpAssessments[0];
        const latestMetrics = surgery.surgeryMetrics[0];

        return {
          ...surgery,
          workflowStatus: {
            // Fitness Assessment Status
            hasFitnessReport: surgery.fitnessReports.length > 0,
            fitnessStatus: latestFitness?.fitnessStatus || 'PENDING',
            fitnessCompleted: latestFitness?.fitnessStatus !== 'PENDING',
            
            // Pre-Op Assessment Status
            hasPreOpAssessment: surgery.preOpAssessments.length > 0,
            preOpCompleted: surgery.preOpAssessments.length > 0,
            
            // Surgery Status
            surgeryStarted: latestMetrics?.surgeryStartTime ? true : false,
            surgeryCompleted: latestMetrics?.surgeryEndTime ? true : false,
            surgeryInProgress: latestMetrics?.surgeryStartTime && !latestMetrics?.surgeryEndTime,
            
            // Surgery Day Visit Status
            hasSurgeryDayVisit: surgery.surgeryDayVisitId ? true : false,
            
            // Overall Workflow Progress
            readyForSurgery: latestFitness?.fitnessStatus === 'FIT_FOR_SURGERY' && surgery.preOpAssessments.length > 0,
            
            // Status Color for UI
            statusColor: this.getWorkflowStatusColor(surgery, latestFitness, latestPreOp, latestMetrics)
          }
        };
      });

      await prisma.$disconnect();

      console.log(`✅ Retrieved ${surgeriesWithStatus.length} today's surgeries`);

      res.json({
        success: true,
        message: 'Today\'s surgeries retrieved successfully',
        data: {
          surgeries: surgeriesWithStatus,
          count: surgeriesWithStatus.length,
          date: today.toISOString().split('T')[0]
        }
      });

    } catch (error) {
      console.error('❌ Error getting today\'s surgeries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get today\'s surgeries',
        error: error.message
      });
    }
  }

  /**
   * Get upcoming surgeries for receptionist2 dashboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUpcomingSurgeries(req, res) {
    try {
      console.log('📅 Receptionist2: Getting upcoming surgeries');

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { limit = 10 } = req.query;

      const surgeries = await prisma.ipdAdmission.findMany({
        where: {
          surgeryDate: { gte: tomorrow },
          status: {
            in: ['ADMITTED', 'SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT']
          }
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true,
              phone: true
            }
          },
          surgeon: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true
            }
          },
          fitnessReports: {
            select: {
              fitnessStatus: true,
              assessmentDate: true
            },
            orderBy: { assessmentDate: 'desc' },
            take: 1
          }
        },
        orderBy: { surgeryDate: 'asc' },
        take: parseInt(limit)
      });

      await prisma.$disconnect();

      console.log(`✅ Retrieved ${surgeries.length} upcoming surgeries`);

      res.json({
        success: true,
        message: 'Upcoming surgeries retrieved successfully',
        data: {
          surgeries,
          count: surgeries.length
        }
      });

    } catch (error) {
      console.error('❌ Error getting upcoming surgeries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get upcoming surgeries',
        error: error.message
      });
    }
  }

  /**
   * Get fitness reports requiring attention for receptionist2
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFitnessReportsForReview(req, res) {
    try {
      console.log('🩺 Receptionist2: Getting fitness reports for review');

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const { status = 'PENDING' } = req.query;

      const reports = await prisma.fitnessReport.findMany({
        where: { 
          fitnessStatus: status === 'all' ? undefined : status 
        },
        include: {
          ipdAdmission: {
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                  patientNumber: true,
                  phone: true,
                  dateOfBirth: true
                }
              }
            }
          },
          assessor: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true,
              employeeId: true
            }
          }
        },
        orderBy: { assessmentDate: 'asc' }
      });

      await prisma.$disconnect();

      console.log(`✅ Retrieved ${reports.length} fitness reports for review`);

      res.json({
        success: true,
        message: 'Fitness reports retrieved successfully',
        data: {
          reports,
          count: reports.length,
          filterStatus: status
        }
      });

    } catch (error) {
      console.error('❌ Error getting fitness reports:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get fitness reports',
        error: error.message
      });
    }
  }

  /**
   * Get IPD dashboard statistics for receptionist2
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getIpdDashboardStats(req, res) {
    try {
      console.log('📊 Receptionist2: Getting IPD dashboard statistics');

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const [
        totalActiveAdmissions,
        todaysSurgeriesCount,
        pendingFitnessCount,
        completedSurgeriesCount,
        upcomingSurgeriesCount
      ] = await Promise.all([
        // Active IPD admissions
        prisma.ipdAdmission.count({
          where: {
            status: {
              in: ['ADMITTED', 'SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT', 'SURGERY_DAY', 'POST_OP', 'RECOVERY']
            }
          }
        }),

        // Today's surgeries
        prisma.ipdAdmission.count({
          where: {
            surgeryDate: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }),

        // Pending fitness reports
        prisma.fitnessReport.count({
          where: { fitnessStatus: 'PENDING' }
        }),

        // Completed surgeries (with end time)
        prisma.surgeryMetrics.count({
          where: {
            surgeryEndTime: { not: null },
            surgeryStartTime: {
              gte: startOfDay,
              lt: endOfDay
            }
          }
        }),

        // Upcoming surgeries (next 7 days)
        prisma.ipdAdmission.count({
          where: {
            surgeryDate: {
              gte: endOfDay,
              lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            },
            status: {
              in: ['ADMITTED', 'SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT']
            }
          }
        })
      ]);

      await prisma.$disconnect();

      const stats = {
        activeAdmissions: totalActiveAdmissions,
        todaysSurgeries: todaysSurgeriesCount,
        pendingFitness: pendingFitnessCount,
        completedToday: completedSurgeriesCount,
        upcomingWeek: upcomingSurgeriesCount,
        date: today.toISOString().split('T')[0]
      };

      console.log('✅ Retrieved IPD dashboard statistics:', stats);

      res.json({
        success: true,
        message: 'IPD dashboard statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('❌ Error getting IPD dashboard statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get IPD dashboard statistics',
        error: error.message
      });
    }
  }

  /**
   * Create surgery day visit from receptionist2
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createSurgeryDayVisit(req, res) {
    try {
      console.log('🏥 Receptionist2: Creating surgery day visit');

      const { admissionId } = req.params;
      const { chiefComplaint, notes } = req.body;

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Get admission details
      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId },
        include: { patient: true }
      });

      if (!admission) {
        await prisma.$disconnect();
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      // Check if surgery day visit already exists
      if (admission.surgeryDayVisitId) {
        await prisma.$disconnect();
        return res.status(409).json({
          success: false,
          message: 'Surgery day visit already exists',
          existingVisitId: admission.surgeryDayVisitId
        });
      }

      // Create appointment first
      const appointment = await prisma.appointment.create({
        data: {
          patientId: admission.patientId,
          doctorId: admission.surgeonId,
          appointmentDate: admission.surgeryDate || new Date(),
          appointmentTime: '09:00',
          tokenNumber: `SURG-${Date.now()}`,
          status: 'CHECKED_IN',
          isActive: true,
          appointmentType: 'SURGERY',
          purpose: `Surgery: ${admission.surgeryType}`,
          notes: notes || 'Surgery day appointment - created by receptionist2'
        }
      });

      // Create patient visit
      const visit = await prisma.patientVisit.create({
        data: {
          patientId: admission.patientId,
          appointmentId: appointment.id,
          doctorId: admission.surgeonId,
          visitType: 'IPD',
          visitDate: new Date(),
          chiefComplaint: chiefComplaint || `${admission.surgeryType} surgery`,
          status: 'WITH_DOCTOR',
          checkedInAt: new Date()
        }
      });

      // Update admission
      const updatedAdmission = await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: {
          surgeryDayVisitId: visit.id,
          status: 'SURGERY_DAY'
        }
      });

      await prisma.$disconnect();

      console.log(`✅ Surgery day visit created for admission ${admission.admissionNumber}`);

      res.status(201).json({
        success: true,
        message: 'Surgery day visit created successfully',
        data: {
          admission: updatedAdmission,
          visit: visit,
          appointment: appointment
        }
      });

    } catch (error) {
      console.error('❌ Error creating surgery day visit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create surgery day visit',
        error: error.message
      });
    }
  }

  /**
   * Helper method to determine workflow status color
   */
  getWorkflowStatusColor(surgery, latestFitness, latestPreOp, latestMetrics) {
    if (latestMetrics?.surgeryEndTime) return 'green'; // Completed
    if (latestMetrics?.surgeryStartTime) return 'blue'; // In progress
    if (latestFitness?.fitnessStatus === 'FIT_FOR_SURGERY' && latestPreOp) return 'green'; // Ready
    if (latestFitness?.fitnessStatus === 'NOT_FIT') return 'red'; // Not fit
    if (latestFitness?.fitnessStatus === 'PENDING') return 'orange'; // Pending fitness
    return 'gray'; // Default
  }

  // =================
  // SURGERY RECOMMENDATION METHODS
  // =================

  /**
   * Get patients with SURGERY_SUGGESTED status in IPD admissions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSurgeryRecommendedPatients(req, res) {
    try {
      console.log('📋 Receptionist2: Getting surgery suggested patients from IPD admissions');
      console.log('🔍 Request details:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        user: req.user ? { id: req.user.id, role: req.user.role } : 'No user'
      });

      // Get all IPD admissions with SURGERY_SUGGESTED status
      const surgeryAdmissions = await prisma.ipdAdmission.findMany({
        where: {
          status: 'SURGERY_SUGGESTED'
        },
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              middleName: true,
              lastName: true,
              phone: true,
              email: true,
              dateOfBirth: true
            }
          },
          surgeryTypeDetail: {
            select: {
              id: true,
              name: true,
              category: true,
              description: true
            }
          },
          admittingStaff: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log('🔍 Database query results:');
      console.log('📊 Raw surgeryAdmissions count:', surgeryAdmissions.length);
      console.log('📊 Raw surgeryAdmissions data:', JSON.stringify(surgeryAdmissions, null, 2));

      // Format the response
      const surgeryRecommendations = surgeryAdmissions.map(admission => {
        const patient = admission.patient;
        const admittingStaff = admission.admittingStaff;

        // Check if surgery details have been filled by receptionist2
        const hasDetailsFromReceptionist = admission && (
          admission.surgeryDate || 
          admission.surgeryPackage || 
          admission.iolType
        );

        return {
          id: admission.id,
          patient: {
            id: patient.id,
            patientNumber: patient.patientNumber,
            firstName: patient.firstName,
            middleName: patient.middleName,
            lastName: patient.lastName,
            phone: patient.phone,
            email: patient.email,
            age: patient.dateOfBirth ? 
              Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
              null
          },
          surgeryRecommended: true,
          surgeryType: admission.surgeryTypeDetail?.name || 'Not specified',
          surgeryTypeId: admission.surgeryTypeId,
          surgeryCategory: admission.surgeryTypeDetail?.category || 'UNKNOWN',
          urgencyLevel: 'ROUTINE', // Default since we don't have examination data
          recommendedBy: `${admittingStaff.firstName} ${admittingStaff.lastName}`,
          recommendedDate: admission.createdAt,
          followUpRequired: false, // Default since we don't have examination data
          followUpDate: null,
          ipdAdmission: {
            id: admission.id,
            admissionNumber: admission.admissionNumber,
            status: admission.status,
            hasDetails: hasDetailsFromReceptionist,
            surgeryDate: admission.surgeryDate,
            tentativeTime: admission.tentativeTime,
            surgeryPackage: admission.surgeryPackage,
            iolType: admission.iolType,
            expectedDuration: admission.expectedDuration,
            priorityLevel: admission.priorityLevel,
            surgeryType: admission.surgeryTypeDetail?.name || 'Not specified',
            surgeryTypeId: admission.surgeryTypeId,
            surgeryCategory: admission.surgeryTypeDetail?.category || 'UNKNOWN',
            surgeonId: admission.surgeonId,
            createdAt: admission.createdAt
          }
        };
      });

      console.log('📤 Final response data:');
      console.log('📊 surgeryRecommendations count:', surgeryRecommendations.length);
      console.log('📊 First patient example:', surgeryRecommendations[0] ? JSON.stringify(surgeryRecommendations[0], null, 2) : 'No patients');

      res.json({
        success: true,
        message: 'Surgery suggested patients retrieved successfully from IPD admissions',
        data: surgeryRecommendations,
        count: surgeryRecommendations.length
      });

    } catch (error) {
      console.error('❌ Error getting surgery suggested patients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get surgery suggested patients',
        error: error.message
      });
    }
  }

  /**
   * Update surgery details for IPD admission (Receptionist2 workflow)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateSurgeryDetails(req, res) {
    try {
      console.log('📝 Receptionist2: Updating surgery details');

      const { patientId } = req.params;
      const {
        surgeryDate,
        tentativeTime,
        surgeryPackage,
        iolType,
        specialInstructions,
        preOpInstructions,
        expectedDuration,
        priorityLevel
      } = req.body;

      // Find or create IPD admission for this patient
      let admission = await prisma.ipdAdmission.findFirst({
        where: {
          patientId,
          status: {
            in: ['ADMITTED', 'SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT']
          }
        }
      });

      if (!admission) {
        // Get patient and surgery type from ophthalmologist examination
        const examination = await prisma.ophthalmologistExamination.findFirst({
          where: {
            patientVisit: {
              patientId
            },
            surgeryRecommended: true,
            surgeryType: { not: null }
          },
          orderBy: { updatedAt: 'desc' },
          include: {
            patientVisit: {
              include: {
                patient: true
              }
            }
          }
        });

        if (!examination) {
          return res.status(404).json({
            success: false,
            message: 'No surgery recommendation found for this patient'
          });
        }

        // Create new IPD admission
        const admissionNumber = `IPD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        
        admission = await prisma.ipdAdmission.create({
          data: {
            admissionNumber,
            patientId,
            admittedBy: req.user.id,
            admissionDate: new Date(),
            surgeryType: examination.surgeryType.toUpperCase(),
            status: 'ADMITTED'
          }
        });
      }

      // Update admission with surgery details from receptionist2
      const updatedAdmission = await prisma.ipdAdmission.update({
        where: { id: admission.id },
        data: {
          surgeryDate: surgeryDate ? new Date(surgeryDate) : admission.surgeryDate,
          tentativeTime: tentativeTime || admission.tentativeTime,
          surgeryPackage: surgeryPackage || admission.surgeryPackage,
          iolType: iolType || admission.iolType,
          preOpInstructions: preOpInstructions || admission.preOpInstructions,
          specialInstructions: specialInstructions || admission.specialInstructions,
          expectedDuration: expectedDuration ? parseInt(expectedDuration) : admission.expectedDuration,
          priorityLevel: priorityLevel || admission.priorityLevel || 'ROUTINE',
          status: 'SURGERY_SCHEDULED',
          updatedAt: new Date()
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Surgery details updated successfully',
        data: updatedAdmission
      });

    } catch (error) {
      console.error('❌ Error updating surgery details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update surgery details',
        error: error.message
      });
    }
  }

  /**
   * Get alarm status for a queue entry
   * Check if the timer alarm has already been played
   */
  async getAlarmStatus(req, res) {
    try {
      const { queueEntryId } = req.params;

      const queueEntry = await prisma.patientQueue.findUnique({
        where: { id: queueEntryId },
        select: {
          id: true,
          alarmPlayed: true,
          estimatedResumeTime: true
        }
      });

      if (!queueEntry) {
        return res.status(404).json({
          success: false,
          message: 'Queue entry not found'
        });
      }

      res.json({
        success: true,
        alarmPlayed: queueEntry.alarmPlayed || false,
        estimatedResumeTime: queueEntry.estimatedResumeTime
      });

    } catch (error) {
      console.error('❌ Error getting alarm status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get alarm status',
        error: error.message
      });
    }
  }

  /**
   * Mark alarm as played for a queue entry
   * Prevents alarm from playing again after page refresh
   */
  async markAlarmAsPlayed(req, res) {
    try {
      const { queueEntryId } = req.params;

      const updatedEntry = await prisma.patientQueue.update({
        where: { id: queueEntryId },
        data: {
          alarmPlayed: true,
          alarmPlayedAt: new Date()
        },
        select: {
          id: true,
          alarmPlayed: true,
          alarmPlayedAt: true
        }
      });

      res.json({
        success: true,
        message: 'Alarm marked as played',
        data: updatedEntry
      });

    } catch (error) {
      console.error('❌ Error marking alarm as played:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark alarm as played',
        error: error.message
      });
    }
  }
}

module.exports = new Receptionist2Controller();