// src/services/receptionist2PatientService.js
const prisma = require('../utils/prisma');
const { generatePatientIdentifiers } = require('../utils/patientGenerator');
const patientService = require('./patientService');

class Receptionist2PatientService {
  /**
   * Register a new patient with emergency assessment and optional optometrist data
   * @param {Object} patientData - Patient registration data
   * @param {Object} emergencyAssessment - Emergency assessment data
   * @param {string} receptionist2Id - Receptionist2 staff ID
   * @param {Object} optometristData - Optional optometrist examination data
   * @returns {Promise<Object>} Registration result
   */
  async registerPatient(patientData, emergencyAssessment, receptionist2Id, optometristData = null) {
    try {
      console.log('🏥 Receptionist2: Starting patient registration');
      console.log('👤 Patient:', patientData.firstName, patientData.lastName);
      console.log('🚨 Emergency Assessment:', emergencyAssessment);

      // Enhanced validation like regular receptionist
      if (!patientData.firstName || !patientData.middleName || !patientData.lastName || !patientData.phone || !patientData.dateOfBirth || !patientData.gender) {
        throw new Error('Required fields missing: firstName, middleName, lastName, phone, dateOfBirth, and gender are required');
      }

      // Validate phone format
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(patientData.phone)) {
        throw new Error('Invalid phone number format');
      }

      // Validate email format if provided
      if (patientData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(patientData.email)) {
          throw new Error('Invalid email format');
        }
      }

      // Enhanced duplicate checking like regular receptionist
      console.log('🔍 Checking for existing patient with email:', patientData.email, 'phone:', patientData.phone);
      
      // Check by phone
      const existingPatientByPhone = await patientService.findPatientByPhone(patientData.phone);
      if (existingPatientByPhone) {
        throw new Error('Patient with this phone number already exists');
      }

      // Check by email if provided
      if (patientData.email) {
        const existingPatientByEmail = await patientService.findPatientByEmail(patientData.email);
        if (existingPatientByEmail) {
          throw new Error('Patient with this email already exists');
        }
      }

      // Generate temporary password like regular receptionist
      const bcrypt = require('bcrypt');
      
      // Generate random password function
      const generateRandomPassword = () => {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
        let password = '';
        for (let i = 0; i < 8; i++) {
          password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
      };
      
      const defaultPassword = generateRandomPassword();
      const passwordHash = await bcrypt.hash(defaultPassword, 12);

      // Prepare enhanced patient data
      const enhancedPatientData = {
        firstName: patientData.firstName.trim(),
        middleName: patientData.middleName.trim(),
        lastName: patientData.lastName.trim(),
        phone: patientData.phone.trim(),
        email: patientData.email ? patientData.email.toLowerCase().trim() : null,
        dateOfBirth: patientData.dateOfBirth,
        gender: patientData.gender.toLowerCase(),
        passwordHash,
        temporaryPassword: defaultPassword,
        // Optional fields
        ...(patientData.address && { address: patientData.address.trim() }),
        ...(patientData.emergencyContact && { emergencyContact: patientData.emergencyContact.trim() }),
        ...(patientData.emergencyPhone && { emergencyPhone: patientData.emergencyPhone.trim() }),
        ...(patientData.allergies && Array.isArray(patientData.allergies) && patientData.allergies.length > 0 && { allergies: patientData.allergies })
      };

      console.log('👤 Creating new patient with enhanced data');
      // Create new patient using existing patient service (includes appointment and email)
      const patientResult = await patientService.createPatientByStaff(enhancedPatientData);
      const patient = patientResult.patient;
      const appointment = patientResult.appointment;
      const temporaryPassword = defaultPassword;
      const emailSent = patientResult.emailSent;
      
      console.log('✅ New patient created:', patient.patientNumber);
      if (appointment) {
        console.log('📅 Appointment created with token:', appointment.tokenNumber);
      }

      // Determine queue routing based on emergency assessment
      const queueRouting = this.determineQueueRouting(emergencyAssessment);
      console.log('🎯 Queue routing decision:', queueRouting);

      // Appointment is already created by patientService.createPatientByStaff
      if (!appointment) {
        throw new Error('Failed to create appointment');
      }

      let patientVisit;
      let queueEntry;

      // Handle different routing based on emergency assessment
      if (queueRouting.isEmergency) {
        console.log('🚨 Processing as EMERGENCY - routing to OPHTHALMOLOGIST queue');
        
        // Generate visit number
        const visitNumber = await patientService.generateNextVisitNumber(patient.id);

        // Create receptionist2 notes
        const receptionist2Notes = this.createReceptionist2Notes(emergencyAssessment, queueRouting, receptionist2Id);

        // Create patient visit for emergency case
        patientVisit = await prisma.patientVisit.create({
          data: {
            patientId: patient.id,
            appointmentId: appointment.id,
            doctorId: appointment.doctorId,
            visitNumber,
            visitType: 'EMERGENCY',
            visitDate: new Date(),
            status: 'CHECKED_IN',
            priorityLevel: 'emergency',
            checkedInAt: new Date(),
            chiefComplaint: emergencyAssessment.notes || 'Emergency eye examination',
            receptionist2Notes: receptionist2Notes
          }
        });

        // Update appointment status to CHECKED_IN and mark as ACTIVE (since patient is now checked in)
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: 'CHECKED_IN',
            isActive: true,
            updatedAt: new Date()
          }
        });

        console.log(`✅ Appointment status updated to CHECKED_IN for emergency case`);

        // Add patient to OPHTHALMOLOGIST queue
        queueEntry = await this.addPatientToQueue(
          patient.id,
          patientVisit.id,
          'OPHTHALMOLOGIST',
          'EMERGENCY'
        );

        console.log(`🚨 Emergency patient added to OPHTHALMOLOGIST queue at position ${queueEntry.queueNumber}`);
      } else {
        console.log('📋 Processing as ROUTINE - auto check-in to OPTOMETRIST queue');
        
        // For non-emergency, use the regular check-in process
        try {
          const checkInResult = await patientService.checkInPatientByToken(appointment.tokenNumber, 'ROUTINE');
          patientVisit = checkInResult.patientVisit;
          
          // Get the queue entry that was created by check-in
          queueEntry = await prisma.patientQueue.findFirst({
            where: {
              patientVisitId: patientVisit.id,
              queueFor: 'OPTOMETRIST'
            }
          });

          console.log(`📋 Routine patient auto-checked-in to OPTOMETRIST queue at position ${queueEntry.queueNumber}`);
        } catch (checkInError) {
          console.error('❌ Auto check-in failed:', checkInError);
          throw new Error(`Auto check-in failed: ${checkInError.message}`);
        }
      }

      // Create OptometristExamination record if optometrist data is provided
      let optometristExamination = null;
      if (optometristData && patientVisit) {
        try {
          console.log('👁️ Creating optometrist examination record with provided data');
          optometristExamination = await this.createOptometristExamination(patientVisit.id, optometristData, receptionist2Id);
          console.log('✅ Optometrist examination record created:', optometristExamination.id);
        } catch (examError) {
          console.error('❌ Failed to create optometrist examination:', examError);
          // Don't fail the entire registration, just log the error
        }
      }

      console.log(`✅ Patient registered and processed: ${queueRouting.queue} queue at position ${queueEntry.queueNumber}`);

      return {
        success: true,
        message: `Patient registered successfully and ${queueRouting.isEmergency ? 'sent directly to doctor' : 'added to optometrist queue'}`,
        data: {
          patient: {
            id: patient.id,
            patientNumber: patient.patientNumber,
            mrn: patient.mrn,
            firstName: patient.firstName,
            lastName: patient.lastName,
            phone: patient.phone,
            email: patient.email,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            patientStatus: patient.patientStatus,
            createdAt: patient.createdAt
          },
          appointment: appointment ? {
            id: appointment.id,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            tokenNumber: appointment.tokenNumber,
            status: appointment.status,
            purpose: appointment.purpose,
            estimatedDuration: appointment.estimatedDuration
          } : null,
          temporaryPassword: temporaryPassword,
          emailSent: emailSent,
          patientVisit,
          queueEntry: {
            queueNumber: queueEntry.queueNumber,
            queueFor: queueEntry.queueFor,
            priorityLabel: queueEntry.priorityLabel,
            status: queueEntry.status
          },
          queueRouting,
          isNewPatient: true,
          registeredBy: receptionist2Id
        }
      };

    } catch (error) {
      console.error('❌ Error in receptionist2 patient registration:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Determine queue routing based on simplified emergency assessment
   * @param {Object} emergencyAssessment - Emergency assessment data
   * @returns {Object} Queue routing decision
   */
  determineQueueRouting(emergencyAssessment) {
    const { isEmergency, notes } = emergencyAssessment;

    if (isEmergency) {
      return {
        queue: 'OPHTHALMOLOGIST',
        priority: 'EMERGENCY',
        isEmergency: true,
        reason: 'Emergency case - Direct to ophthalmologist',
        skipOptometrist: true
      };
    }

    // Default to routine optometrist queue
    return {
      queue: 'OPTOMETRIST',
      priority: 'ROUTINE',
      isEmergency: false,
      reason: 'Routine examination - Standard optometrist queue',
      skipOptometrist: false
    };
  }

  /**
   * Create receptionist2 notes for the visit
   * @param {Object} emergencyAssessment - Emergency assessment data
   * @param {Object} queueRouting - Queue routing decision
   * @param {string} receptionist2Id - Receptionist2 staff ID
   * @returns {string} Formatted notes
   */
  createReceptionist2Notes(emergencyAssessment, queueRouting, receptionist2Id) {
    const timestamp = new Date().toISOString();
    
    let notes = `[RECEPTIONIST2 REGISTRATION - ${timestamp}]\n`;
    notes += `Registered by: ${receptionist2Id}\n`;
    notes += `Queue Decision: ${queueRouting.reason}\n`;
    notes += `Priority Level: ${queueRouting.priority}\n`;
    notes += `Target Queue: ${queueRouting.queue}\n`;
    notes += `Emergency Case: ${queueRouting.isEmergency ? 'YES' : 'NO'}\n\n`;

    if (emergencyAssessment.notes) {
      notes += `Receptionist Notes: ${emergencyAssessment.notes}\n`;
    }

    if (queueRouting.isEmergency) {
      notes += `\n⚠️ EMERGENCY CASE - Bypassing optometrist, direct to ophthalmologist\n`;
    }

    return notes;
  }

  /**
   * Add patient to appropriate queue
   * @param {string} patientId - Patient ID
   * @param {string} patientVisitId - Patient visit ID
   * @param {string} queueFor - Queue type
   * @param {string} priority - Priority level
   * @returns {Promise<Object>} Queue entry
   */
  async addPatientToQueue(patientId, patientVisitId, queueFor, priority) {
    try {
      // Get next queue number for the target queue
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const lastQueueEntry = await prisma.patientQueue.findFirst({
        where: {
          queueFor: queueFor,
          joinedAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        orderBy: { queueNumber: 'desc' }
      });

      const nextQueueNumber = lastQueueEntry ? lastQueueEntry.queueNumber + 1 : 1;

      // Create queue entry
      const queueEntry = await prisma.patientQueue.create({
        data: {
          patientId: patientId,
          patientVisitId: patientVisitId,
          queueFor: queueFor,
          queueNumber: nextQueueNumber,
          priority: priority === 'EMERGENCY' ? 1 : priority === 'PRIORITY' ? 2 : 3,
          priorityLabel: priority,
          status: 'WAITING',
          joinedAt: new Date(),
          notes: `Added by Receptionist2 - ${priority} priority`
        }
      });

      console.log(`✅ Added to ${queueFor} queue at position ${nextQueueNumber} with ${priority} priority`);
      return queueEntry;

    } catch (error) {
      console.error('❌ Error adding patient to queue:', error);
      throw new Error(`Failed to add patient to queue: ${error.message}`);
    }
  }

  /**
   * Get today's registrations by receptionist2
   * @param {string} receptionist2Id - Receptionist2 staff ID (optional)
   * @returns {Promise<Object>} Today's registrations
   */
  async getTodayRegistrations(receptionist2Id = null) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const whereClause = {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        receptionist2Notes: {
          not: null
        }
      };

      // Filter by specific receptionist2 if provided
      if (receptionist2Id) {
        whereClause.receptionist2Notes = {
          contains: receptionist2Id
        };
      }

      const registrations = await prisma.patientVisit.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true
            }
          },
          appointment: {
            select: {
              tokenNumber: true,
              appointmentTime: true
            }
          },
          patientQueue: {
            select: {
              queueFor: true,
              queueNumber: true,
              priorityLabel: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate statistics
      const totalRegistrations = registrations.length;
      const emergencyCount = registrations.filter(r => 
        r.receptionist2Notes?.includes('OPHTHALMOLOGIST')
      ).length;
      const routineCount = registrations.filter(r => 
        r.receptionist2Notes?.includes('OPTOMETRIST')
      ).length;

      return {
        success: true,
        data: {
          registrations: registrations.map(reg => ({
            id: reg.id,
            patient: {
              id: reg.patient.id,
              patientNumber: reg.patient.patientNumber,
              fullName: `${reg.patient.firstName} ${reg.patient.lastName}`,
              phone: reg.patient.phone,
              email: reg.patient.email
            },
            appointment: {
              tokenNumber: reg.appointment.tokenNumber,
              appointmentTime: reg.appointment.appointmentTime
            },
            visitType: reg.visitType,
            status: reg.status,
            priorityLevel: reg.priorityLevel,
            registeredAt: reg.createdAt,
            receptionist2Notes: reg.receptionist2Notes,
            currentQueue: reg.patientQueue[0] || null
          })),
          statistics: {
            total: totalRegistrations,
            emergency: emergencyCount,
            routine: routineCount,
            date: today.toISOString().split('T')[0]
          }
        }
      };

    } catch (error) {
      console.error('❌ Error getting today\'s registrations:', error);
      throw new Error(`Failed to get registrations: ${error.message}`);
    }
  }

  /**
   * Get registration statistics for dashboard
   * @param {string} receptionist2Id - Receptionist2 staff ID (optional)
   * @returns {Promise<Object>} Registration statistics
   */
  async getRegistrationStatistics(receptionist2Id = null) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Base query for receptionist2 registrations
      const baseWhere = {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        receptionist2Notes: {
          not: null
        }
      };

      // Get total registrations
      const totalRegistrations = await prisma.patientVisit.count({
        where: baseWhere
      });

      // Get emergency registrations (sent to ophthalmologist)
      const emergencyRegistrations = await prisma.patientVisit.count({
        where: {
          ...baseWhere,
          receptionist2Notes: {
            contains: 'OPHTHALMOLOGIST'
          }
        }
      });

      // Get routine registrations (sent to optometrist)
      const routineRegistrations = await prisma.patientVisit.count({
        where: {
          ...baseWhere,
          receptionist2Notes: {
            contains: 'OPTOMETRIST'
          }
        }
      });

      // Get current queue status for registered patients
      const queueStatus = await prisma.patientQueue.findMany({
        where: {
          joinedAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          patientVisit: {
            receptionist2Notes: {
              not: null
            }
          }
        },
        select: {
          queueFor: true,
          status: true,
          priorityLabel: true
        }
      });

      // Calculate queue statistics
      const queueStats = queueStatus.reduce((acc, queue) => {
        if (!acc[queue.queueFor]) {
          acc[queue.queueFor] = { total: 0, waiting: 0, inProgress: 0, completed: 0 };
        }
        acc[queue.queueFor].total++;
        if (queue.status === 'WAITING') acc[queue.queueFor].waiting++;
        if (queue.status === 'IN_PROGRESS') acc[queue.queueFor].inProgress++;
        if (queue.status === 'COMPLETED') acc[queue.queueFor].completed++;
        return acc;
      }, {});

      return {
        success: true,
        data: {
          todayRegistrations: {
            total: totalRegistrations,
            emergency: emergencyRegistrations,
            routine: routineRegistrations,
            emergencyPercentage: totalRegistrations > 0 ? Math.round((emergencyRegistrations / totalRegistrations) * 100) : 0
          },
          queueDistribution: queueStats,
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Error getting registration statistics:', error);
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
  /**
   * Handle emergency routing for already registered patients
   * @param {string} patientId - Patient ID
   * @param {string} appointmentId - Appointment ID
   * @param {Object} emergencyAssessment - Emergency assessment data
   * @param {string} receptionist2Id - Receptionist2 staff ID
   * @returns {Promise<Object>} Routing result
   */
  async handleEmergencyRouting(patientId, appointmentId, emergencyAssessment, receptionist2Id) {
    try {
      console.log('🚨 Receptionist2: Processing emergency routing');

      // Determine queue routing based on emergency assessment
      const queueRouting = this.determineQueueRouting(emergencyAssessment);
      console.log('🎯 Queue routing decision:', queueRouting);

      // Get patient and appointment details
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      });

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });

      if (!patient || !appointment) {
        throw new Error('Patient or appointment not found');
      }

      // Generate visit number
      const visitNumber = await patientService.generateNextVisitNumber(patientId);

      // Create receptionist2 notes
      const receptionist2Notes = this.createReceptionist2Notes(emergencyAssessment, queueRouting, receptionist2Id);

      // Create patient visit with receptionist2 notes
      const patientVisit = await prisma.patientVisit.create({
        data: {
          patientId: patientId,
          appointmentId: appointmentId,
          doctorId: appointment.doctorId,
          visitNumber,
          visitType: queueRouting.isEmergency ? 'EMERGENCY' : 'OPD',
          visitDate: new Date(),
          status: 'CHECKED_IN',
          priorityLevel: queueRouting.priority.toLowerCase(),
          checkedInAt: new Date(),
          chiefComplaint: emergencyAssessment.notes || 'General eye examination',
          receptionist2Notes: receptionist2Notes
        }
      });

      // Add patient to appropriate queue
      const queueEntry = await this.addPatientToQueue(
        patientId,
        patientVisit.id,
        queueRouting.queue,
        queueRouting.priority
      );

      console.log(`✅ Emergency routing completed: ${queueRouting.queue} queue at position ${queueEntry.queueNumber}`);

      return {
        success: true,
        message: `Patient ${queueRouting.isEmergency ? 'sent directly to doctor' : 'added to optometrist queue'}`,
        data: {
          queueRouting,
          queueEntry,
          patientVisit,
          routedBy: receptionist2Id
        }
      };

    } catch (error) {
      console.error('❌ Error in emergency routing:', error);
      throw new Error(`Emergency routing failed: ${error.message}`);
    }
  }

  /**
   * Create OptometristExamination record with provided data
   * @param {string} patientVisitId - Patient visit ID
   * @param {Object} optometristData - Optometrist examination data
   * @param {string} receptionist2Id - Receptionist2 staff ID (acting as optometrist)
   * @returns {Promise<Object>} Created examination record
   */
  async createOptometristExamination(patientVisitId, optometristData, receptionist2Id) {
    try {
      console.log('👁️ Creating OptometristExamination record for visit:', patientVisitId);

      // Create the examination record
      const examination = await prisma.optometristExamination.create({
        data: {
          patientVisitId: patientVisitId,
          optometristId: receptionist2Id, // Receptionist2 acting as optometrist
          
          // Visual Acuity
          ucvaOD: optometristData.ucvaOD || null,
          ucvaOS: optometristData.ucvaOS || null,
          bcvaOD: optometristData.bcvaOD || null,
          bcvaOS: optometristData.bcvaOS || null,
          visualAcuity: optometristData.visualAcuity || null,
          
          // Refraction
          refractionSphereOD: optometristData.refractionSphereOD || null,
          refractionCylinderOD: optometristData.refractionCylinderOD || null,
          refractionAxisOD: optometristData.refractionAxisOD || null,
          refractionSphereOS: optometristData.refractionSphereOS || null,
          refractionCylinderOS: optometristData.refractionCylinderOS || null,
          refractionAxisOS: optometristData.refractionAxisOS || null,
          refraction: optometristData.refraction || null,
          
          // Tonometry (IOP)
          iopOD: optometristData.iopOD || null,
          iopOS: optometristData.iopOS || null,
          iopMethod: optometristData.iopMethod || null,
          tonometry: optometristData.tonometry || null,
          
          // Additional Tests
          colorVision: optometristData.colorVision || null,
          pupilReaction: optometristData.pupilReaction || null,
          eyeAlignment: optometristData.eyeAlignment || null,
          anteriorSegment: optometristData.anteriorSegment || null,
          additionalTests: optometristData.additionalTests || null,
          
          // Clinical Details
          clinicalDetails: optometristData.clinicalDetails || null,
          clinicalNotes: optometristData.clinicalNotes || null,
          preliminaryDiagnosis: optometristData.preliminaryDiagnosis || null,
          additionalNotes: optometristData.additionalNotes || null,
          
          // Workflow
          proceedToDoctor: optometristData.proceedToDoctor !== false, // Default true
          requiresDilation: optometristData.requiresDilation || false,
          urgencyLevel: optometristData.urgencyLevel || null,
          assignedDoctor: optometristData.assignedDoctor || null,
          additionalOrders: optometristData.additionalOrders || null,
          knownAllergies: optometristData.knownAllergies || null,
          
          // Status
          examinationStatus: 'completed',
          completedAt: new Date(),
          
          // Review status (not reviewed yet)
          receptionist2Reviewed: false
        }
      });

      console.log('✅ OptometristExamination created successfully:', examination.id);
      return examination;

    } catch (error) {
      console.error('❌ Error creating OptometristExamination:', error);
      throw new Error(`Failed to create optometrist examination: ${error.message}`);
    }
  }
}

module.exports = new Receptionist2PatientService();