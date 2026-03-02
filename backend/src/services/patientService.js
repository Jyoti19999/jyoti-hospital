// src/services/patientService.js
const prisma = require('../utils/prisma');
const { generatePatientIdentifiers } = require('../utils/patientGenerator');
const emailService = require('./emailService');

class PatientService {
  /**
   * Generate a unique 4-digit token number for appointments
   * @returns {Promise<string>} Unique 4-digit token
   */
  async generateAppointmentToken() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      let attempts = 0;
      const maxAttempts = 50;

      while (attempts < maxAttempts) {
        // Generate random 4-digit token
        const token = Math.floor(1000 + Math.random() * 9000).toString();

        // Check if token already exists for today
        const existingAppointment = await prisma.appointment.findFirst({
          where: {
            tokenNumber: token,
            appointmentDate: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        });

        if (!existingAppointment) {
          console.log(`✅ Generated unique appointment token: ${token}`);
          return token;
        }

        attempts++;
      }

      // Fallback: use timestamp-based token if random generation fails
      const fallbackToken = Date.now().toString().slice(-4);
      console.warn(`⚠️ Using fallback token after ${maxAttempts} attempts: ${fallbackToken}`);
      return fallbackToken;
    } catch (error) {
      console.error('Error generating appointment token:', error);
      // Emergency fallback
      return Math.floor(1000 + Math.random() * 9000).toString();
    }
  }

  /**
   * Create an appointment for a patient
   * @param {string} patientId - Patient ID
   * @param {Object} appointmentData - Appointment details
   * @returns {Promise<Object>} Created appointment
   */
  async createAppointmentForPatient(patientId, appointmentData = {}) {
    try {
      const appointmentDate = appointmentData.appointmentDate || new Date();
      const tokenNumber = await this.generateAppointmentToken();

      // Auto-discontinue any incomplete appointments for this patient
      // (patient chose to book new instead of resuming)
      //
      // Targets:
      //   1. ALL PARTIALLY_COMPLETED appointments (any date, any isActive)
      //   2. Stale past-date CHECKED_IN appointments (isActive: false)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const oldIncomplete = await prisma.appointment.findMany({
        where: {
          patientId,
          OR: [
            { status: 'PARTIALLY_COMPLETED' },
            {
              status: 'CHECKED_IN',
              isActive: false,
              appointmentDate: { lt: startOfToday }
            }
          ]
        },
        select: {
          id: true,
          status: true,
          patientVisit: { select: { id: true } }
        }
      });

      if (oldIncomplete.length > 0) {
        const oldApptIds = oldIncomplete.map(a => a.id);
        const oldVisitIds = oldIncomplete.map(a => a.patientVisit?.id).filter(Boolean);

        await prisma.appointment.updateMany({
          where: { id: { in: oldApptIds } },
          data: { status: 'DISCONTINUED', isActive: false }
        });

        if (oldVisitIds.length > 0) {
          await prisma.patientVisit.updateMany({
            where: { id: { in: oldVisitIds } },
            data: { status: 'DISCONTINUED', completedAt: new Date() }
          });
        }

        console.log(`🔄 Auto-discontinued ${oldIncomplete.length} incomplete appointment(s) for patient ${patientId} (statuses: ${[...new Set(oldIncomplete.map(a => a.status))].join(', ')}) — new appointment being booked`);
      }
      
      const appointment = await prisma.appointment.create({
        data: {
          patientId,
          doctorId: appointmentData.doctorId || null, // Include doctorId
          appointmentDate,
          appointmentTime: appointmentData.appointmentTime || new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          tokenNumber,
          qrCode: appointmentData.qrCode || null, // Save QR code if provided
          status: 'SCHEDULED',
          isActive: true,
          appointmentType: appointmentData.appointmentType || 'routine',
          purpose: appointmentData.purpose || 'Initial Consultation',
          notes: appointmentData.notes || 'Appointment booked during patient registration',
          estimatedDuration: appointmentData.estimatedDuration || 30
        },
        select: {
          id: true,
          doctorId: true,
          appointmentDate: true,
          appointmentTime: true,
          tokenNumber: true,
          status: true,
          appointmentType: true,
          purpose: true,
          estimatedDuration: true,
          createdAt: true,
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              department: true,
              doctorProfile: true
            }
          }
        }
      });

      console.log(`✅ Appointment created for patient ${patientId} with token ${tokenNumber}`);
      return appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw new Error('Failed to create appointment');
    }
  }

  /**
   * Create a new patient with generated identifiers
   * @param {Object} patientData - Patient registration data
   * @returns {Promise<Object>} Created patient
   */
  async createPatient(patientData) {
    try {
      // Generate unique patient number and MRN
      const { patientNumber, mrn } = await generatePatientIdentifiers();

      // Create patient with generated identifiers
      const patient = await prisma.patient.create({
        data: {
          patientNumber,
          mrn,
          firstName: patientData.firstName,
          middleName: patientData.middleName,
          lastName: patientData.lastName,
          dateOfBirth: patientData.dateOfBirth ? new Date(patientData.dateOfBirth) : null,
          gender: patientData.gender,
          phone: patientData.mobileNumber || patientData.phone,
          email: patientData.email,
          passwordHash: patientData.passwordHash,
          patientStatus: 'active'
        },
        select: {
          id: true,
          patientNumber: true,
          mrn: true,
          firstName: true,
          middleName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          patientStatus: true,
          createdAt: true
        }
      });

      console.log(`Patient created successfully: ${patient.patientNumber}`);
      return patient;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw new Error('Failed to create patient');
    }
  }

  /**
   * Create a new patient by staff with optional fields
   * @param {Object} patientData - Patient registration data with optional fields
   * @returns {Promise<Object>} Created patient
   */
  async createPatientByStaff(patientData) {
    try {
      // Generate unique patient number and MRN
      const { patientNumber, mrn } = await generatePatientIdentifiers();

      // Build create data with only non-null fields
      // Convert dateOfBirth to proper Date object for Prisma
      let convertedDate = null;
      if (patientData.dateOfBirth) {
        if (patientData.dateOfBirth instanceof Date) {
          convertedDate = patientData.dateOfBirth;
        } else if (typeof patientData.dateOfBirth === 'string') {
          convertedDate = new Date(patientData.dateOfBirth + 'T00:00:00.000Z'); // Add time to make it a full ISO string
        }
      }
      
      const createData = {
        patientNumber,
        mrn,
        firstName: patientData.firstName,
        middleName: patientData.middleName,
        lastName: patientData.lastName,
        dateOfBirth: convertedDate,
        gender: patientData.gender,
        phone: patientData.phone,
        patientStatus: 'active'
      };

      // Only add passwordHash if it exists
      if (patientData.passwordHash) {
        createData.passwordHash = patientData.passwordHash;
      }

      // Add referral fields if they exist
      if (patientData.isReferred === true) {
        createData.isReferred = true;
      }
      
      if (patientData.referredBy) {
        createData.referredBy = patientData.referredBy;
      }

      // Add optional fields only if they exist and are not empty
      if (patientData.email && patientData.email.trim()) {
        createData.email = patientData.email;
      }
      
      if (patientData.address && patientData.address.trim()) {
        createData.address = patientData.address;
      }
      
      // Handle emergency contacts as JSON format
      if ((patientData.emergencyContact && patientData.emergencyContact.trim()) || 
          (patientData.emergencyPhone && patientData.emergencyPhone.trim())) {
        const emergencyContacts = [];
        if (patientData.emergencyContact && patientData.emergencyContact.trim()) {
          emergencyContacts.push({
            name: patientData.emergencyContact,
            phone: patientData.emergencyPhone || '',
            relation: 'Emergency Contact'
          });
        }
        if (emergencyContacts.length > 0) {
          createData.emergencyContacts = emergencyContacts;
        }
      }
      
      if (patientData.allergies && Array.isArray(patientData.allergies) && patientData.allergies.length > 0) {
        createData.allergies = patientData.allergies; // Already an array format
      }

      // Create patient with optional fields
      const patient = await prisma.patient.create({
        data: createData,
        select: {
          id: true,
          patientNumber: true,
          mrn: true,
          firstName: true,
          middleName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          address: true,
          emergencyContacts: true,
          allergies: true,
          patientStatus: true,
          createdAt: true
        }
      });

      console.log(`Patient created by staff successfully: ${patient.patientNumber}`);
      
      // Send welcome email with login credentials if email is provided
      let emailSent = false;
      let emailError = null;
      
      if (patient.email && patientData.temporaryPassword) {
        try {
          await emailService.sendPatientWelcomeEmail(
            patient.email,
            patient.firstName,
            patient.lastName,
            patient.patientNumber,
            patientData.temporaryPassword,
            patient.mrn
          );
          emailSent = true;
          console.log(`✅ Welcome email sent to ${patient.email}`);
        } catch (error) {
          console.error('❌ Failed to send welcome email:', error);
          emailError = error.message;
          // Don't throw error - patient creation should succeed even if email fails
        }
      }
      
      // Create initial appointment
      let appointment = null;
      let appointmentError = null;
      
      try {
        appointment = await this.createAppointmentForPatient(patient.id, {
          appointmentDate: new Date(),
          purpose: 'Initial Consultation - New Patient Registration',
          notes: `Patient registered by staff. ${patient.email ? 'Login credentials sent via email.' : 'No email provided - manual credential sharing required.'}`
        });
        console.log(`✅ Initial appointment created with token ${appointment.tokenNumber}`);
      } catch (error) {
        console.error('❌ Failed to create initial appointment:', error);
        appointmentError = error.message;
        // Don't throw error - patient creation should succeed even if appointment fails
      }
      
      return {
        patient,
        appointment,
        emailSent,
        emailError,
        appointmentError
      };
    } catch (error) {
      console.error('Error creating patient by staff:', error);
      throw new Error('Failed to create patient by staff');
    }
  }

  /**
   * Create a new patient with custom appointment time
   * @param {Object} patientData - Patient registration data with custom appointment info
   * @returns {Promise<Object>} Created patient with appointment
   */
  async createPatientWithCustomAppointment(patientData) {
    try {
      // Generate unique patient number and MRN
      const { patientNumber, mrn } = await generatePatientIdentifiers();

      // Build create data with only non-null fields
      let convertedDate = null;
      if (patientData.dateOfBirth) {
        if (patientData.dateOfBirth instanceof Date) {
          convertedDate = patientData.dateOfBirth;
        } else if (typeof patientData.dateOfBirth === 'string') {
          convertedDate = new Date(patientData.dateOfBirth + 'T00:00:00.000Z');
        }
      }
      
      const createData = {
        patientNumber,
        mrn,
        firstName: patientData.firstName,
        middleName: patientData.middleName,
        lastName: patientData.lastName,
        dateOfBirth: convertedDate,
        gender: patientData.gender,
        phone: patientData.phone,
        patientStatus: 'active'
      };

      // Only add passwordHash if it exists
      if (patientData.passwordHash) {
        createData.passwordHash = patientData.passwordHash;
      }

      // Add optional fields only if they exist and are not empty
      if (patientData.email && patientData.email.trim()) {
        createData.email = patientData.email;
      }
      
      if (patientData.address && patientData.address.trim()) {
        createData.address = patientData.address;
      }
      
      // Handle emergency contacts as JSON format
      if ((patientData.emergencyContact && patientData.emergencyContact.trim()) || 
          (patientData.emergencyPhone && patientData.emergencyPhone.trim())) {
        const emergencyContacts = [];
        if (patientData.emergencyContact && patientData.emergencyContact.trim()) {
          emergencyContacts.push({
            name: patientData.emergencyContact,
            phone: patientData.emergencyPhone || '',
            relation: 'Emergency Contact'
          });
        }
        if (emergencyContacts.length > 0) {
          createData.emergencyContacts = emergencyContacts;
        }
      }
      
      if (patientData.allergies && Array.isArray(patientData.allergies) && patientData.allergies.length > 0) {
        createData.allergies = patientData.allergies;
      }

      // Add referral fields if provided
      if (patientData.isReferred) {
        createData.isReferred = true;
      }
      
      if (patientData.referredBy) {
        createData.referredBy = patientData.referredBy;
      }

      // Create patient
      const patient = await prisma.patient.create({
        data: createData,
        select: {
          id: true,
          patientNumber: true,
          mrn: true,
          firstName: true,
          middleName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          address: true,
          emergencyContacts: true,
          allergies: true,
          patientStatus: true,
          createdAt: true
        }
      });

      console.log(`Patient created by staff with custom appointment: ${patient.patientNumber}`);
      
      // Send welcome email with login credentials if email is provided
      let emailSent = false;
      let emailError = null;
      
      if (patient.email && patientData.temporaryPassword) {
        try {
          await emailService.sendPatientWelcomeEmail(
            patient.email,
            patient.firstName,
            patient.lastName,
            patient.patientNumber,
            patientData.temporaryPassword,
            patient.mrn
          );
          emailSent = true;
          console.log(`✅ Welcome email sent to ${patient.email}`);
        } catch (error) {
          console.error('❌ Failed to send welcome email:', error);
          emailError = error.message;
        }
      }
      
      // Create appointment with custom time
      let appointment = null;
      let appointmentError = null;
      
      try {
        const customAppointment = patientData.customAppointment;
        appointment = await this.createAppointmentForPatient(patient.id, {
          appointmentDate: customAppointment.appointmentDate,
          appointmentTime: customAppointment.appointmentTime,
          purpose: customAppointment.purpose || 'General Consultation',
          notes: `Patient registered by staff with scheduled appointment time. ${patient.email ? 'Login credentials sent via email.' : 'No email provided - manual credential sharing required.'}`
        });
        console.log(`✅ Custom appointment created with token ${appointment.tokenNumber} for time ${customAppointment.appointmentTime}`);
      } catch (error) {
        console.error('❌ Failed to create custom appointment:', error);
        appointmentError = error.message;
      }
      
      return {
        patient,
        appointment,
        emailSent,
        emailError,
        appointmentError
      };
    } catch (error) {
      console.error('Error creating patient with custom appointment:', error);
      throw new Error('Failed to create patient with custom appointment');
    }
  }

  /**
   * Create a new patient by another patient (referral system) - bypasses email/phone uniqueness checks
   * @param {Object} patientData - Patient registration data
   * @param {string} referringPatientId - ID of the patient who is registering this new patient
   * @returns {Promise<Object>} Created patient with referral information
   */
  async createPatientWithReferral(patientData, referringPatientId) {
    try {
      console.log(`🔄 Creating patient with referral - referred by patient ID: ${referringPatientId}`);

      // Generate unique patient number and MRN
      const { patientNumber, mrn } = await generatePatientIdentifiers();

      // Build create data for referred patient
      const createData = {
        patientNumber,
        mrn,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        dateOfBirth: patientData.dateOfBirth ? new Date(patientData.dateOfBirth) : null,
        gender: patientData.gender,
        phone: patientData.phone,
        passwordHash: patientData.passwordHash,
        patientStatus: 'active',
        // Referral fields
        isReferred: true,
        referredBy: referringPatientId
      };

      // Add optional fields if provided
      if (patientData.email && patientData.email.trim()) {
        createData.email = patientData.email;
      }
      
      if (patientData.address && patientData.address.trim()) {
        createData.address = patientData.address;
      }

      // Handle emergency contacts
      if (patientData.emergencyContact && patientData.emergencyContact.trim()) {
        createData.emergencyContacts = [{
          name: patientData.emergencyContact,
          phone: patientData.emergencyPhone || '',
          relation: patientData.emergencyRelation || 'Emergency Contact'
        }];
      }

      // Handle allergies if provided
      if (patientData.allergies && Array.isArray(patientData.allergies) && patientData.allergies.length > 0) {
        createData.allergies = patientData.allergies;
      }

      // Create the referred patient (no uniqueness checks for email/phone)
      const patient = await prisma.patient.create({
        data: createData,
        select: {
          id: true,
          patientNumber: true,
          mrn: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          address: true,
          emergencyContacts: true,
          allergies: true,
          patientStatus: true,
          isReferred: true,
          referredBy: true,
          createdAt: true,
          // Include referring patient information using correct field name
          referrer: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true
            }
          }
        }
      });

      console.log(`✅ Referred patient created successfully: ${patient.patientNumber} (referred by patient ${referringPatientId})`);
      
      // Send welcome email if email is provided
      let emailSent = false;
      let emailError = null;
      
      if (patient.email && patientData.temporaryPassword) {
        try {
          await emailService.sendPatientWelcomeEmail(
            patient.email,
            patient.firstName,
            patient.lastName,
            patient.patientNumber,
            patientData.temporaryPassword,
            patient.mrn
          );
          emailSent = true;
          console.log(`✅ Welcome email sent to referred patient: ${patient.email}`);
        } catch (error) {
          console.error('❌ Failed to send welcome email to referred patient:', error);
          emailError = error.message;
        }
      }
      
      // Return patient data without automatic appointment creation
      return {
        patient,
        referralInfo: {
          isReferred: true,
          referredBy: referringPatientId,
          referralDate: patient.createdAt
        },
        emailSent,
        emailError
      };
      
    } catch (error) {
      console.error('❌ Error creating patient with referral:', error);
      throw new Error('Failed to create patient with referral');
    }
  }

  /**
   * Find patient by email
   * @param {string} email - Patient email
   * @returns {Promise<Object|null>} Patient or null
   */
  async findPatientByEmail(email) {
    try {
      const patient = await prisma.patient.findFirst({
        where: {
          email: email.toLowerCase(),
          patientStatus: 'active'
        },
        select: {
          id: true,
          patientNumber: true,
          mrn: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          passwordHash: true, // Include for authentication
          patientStatus: true,
          createdAt: true
        }
      });

      return patient;
    } catch (error) {
      console.error('Error finding patient by email:', error);
      throw new Error('Failed to find patient');
    }
  }

  /**
   * Find patient by phone number
   * @param {string} phone - Patient phone number
   * @returns {Promise<Object|null>} Patient or null
   */
  async findPatientByPhone(phone) {
    try {
      const patient = await prisma.patient.findFirst({
        where: {
          phone: phone,
          patientStatus: 'active'
        },
        select: {
          id: true,
          patientNumber: true,
          mrn: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          patientStatus: true,
          passwordHash: true,
          createdAt: true
        }
      });

      return patient;
    } catch (error) {
      console.error('Error finding patient by phone:', error);
      throw new Error('Failed to find patient');
    }
  }

  /**
   * Find patient by patient number
   * @param {number} patientNumber - Patient number
   * @returns {Promise<Object|null>} Patient or null
   */
  async findPatientByNumber(patientNumber) {
    try {
      const patient = await prisma.patient.findUnique({
        where: {
          patientNumber: patientNumber
        },
        select: {
          id: true,
          patientNumber: true,
          mrn: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          patientStatus: true,
          createdAt: true
        }
      });

      return patient;
    } catch (error) {
      console.error('Error finding patient by number:', error);
      throw new Error('Failed to find patient');
    }
  }

  /**
   * Check if patient already exists by email or phone
   * @param {string} email - Patient email
   * @param {string} phone - Patient phone
   * @returns {Promise<Object|null>} Existing patient or null
   */
  async findExistingPatient(email, phone) {
    try {
      const patient = await prisma.patient.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { phone: phone }
          ],
          patientStatus: 'active'
        },
        select: {
          id: true,
          patientNumber: true,
          mrn: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          patientStatus: true,
          createdAt: true
        }
      });

      return patient;
    } catch (error) {
      console.error('Error finding existing patient:', error);
      throw new Error('Failed to check existing patient');
    }
  }

  /**
   * Update patient information
   * @param {string} patientId - Patient ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated patient
   */
  async updatePatient(patientId, updateData) {
    try {
      const patient = await prisma.patient.update({
        where: { id: patientId },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        select: {
          id: true,
          patientNumber: true,
          mrn: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          patientStatus: true,
          createdAt: true,
          updatedAt: true
        }
      });

      console.log(`Patient updated successfully: ${patient.patientNumber}`);
      return patient;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw new Error('Failed to update patient');
    }
  }

  /**
   * Get patient statistics
   * @returns {Promise<Object>} Patient statistics
   */
  // src/services/patientService.js
  async getPatientStatistics() {
    try {
      console.log('📊 Fetching patient statistics...');
      const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

      const [
        totalPatients,
        activePatients,
        todayRegistrations,
        priorityCountsRaw
      ] = await Promise.all([
        prisma.patient.count(),
        prisma.patientVisit.count({
          where: { createdAt: { gte: startOfToday } }
        }),
        prisma.patient.count({
          where: {
            createdAt: {
              gte: startOfToday
            }
          }
        }),
        // Group by priorityLabel from PatientQueue instead of priorityLevel from PatientVisit
        prisma.patientQueue.groupBy({
          by: ['priorityLabel'],
          where: {
            queueFor: 'OPTOMETRIST',
            joinedAt: {
              gte: startOfToday
            }
          },
          _count: {
            priorityLabel: true
          }
        })
      ]);

      console.log(`📊 Raw priority counts:`, priorityCountsRaw);

      // Convert groupBy result into a clean object
      const priorityCounts = priorityCountsRaw.reduce((acc, item) => {
        // Skip null or undefined priority labels
        if (!item.priorityLabel) {
          console.warn('⚠️  Skipping record with null/undefined priorityLabel:', item);
          return acc;
        }
        // Convert priorityLabel to lowercase for consistency
        const label = item.priorityLabel.toLowerCase();
        acc[label] = item._count.priorityLabel;
        return acc;
      }, {});

      const result = {
        total: totalPatients,
        active: activePatients,
        todayRegistrations,
        priorityCounts,
        timestamp: new Date()
      };

      console.log('✅ Patient statistics fetched successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error getting patient statistics:', error);
      console.error('Error stack:', error.stack);
      throw new Error('Failed to get patient statistics');
    }
  }


  /**
   * Update patient last login time
   * @param {string} patientId - Patient ID
   * @returns {Promise<void>}
   */
  async updatePatientLogin(patientId) {
    try {
      await prisma.patient.update({
        where: { id: patientId },
        data: { 
          lastLogin: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated login time for patient: ${patientId}`);
    } catch (error) {
      console.error('Error updating patient login:', error);
      throw new Error('Failed to update patient login time');
    }
  }

  /**
   * Find patient by ID
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object|null>} Patient or null
   */
  async findPatientById(patientId) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          // Basic Information
          id: true,
          patientNumber: true,
          mrn: true,
          
          // Personal Information
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          address: true,
          emergencyContacts: true,
          
          // Medical Information
          bloodGroup: true,
          allergies: true,
          chronicConditions: true,
          previousSurgeries: true,
          familyHistory: true,
          lifestyle: true,
          
          // Eye Care Specific
          eyeHistory: true,
          visionHistory: true,
          currentMedications: true,
          riskFactors: true,
          
          // Insurance and Financial
          insuranceDetails: true,
          defaultInsuranceId: true,
          
          // Profile
          profilePhoto: true,
          
          // Authentication (excluding passwordHash for security)
          lastLogin: true,
          
          // Referral System
          isReferred: true,
          referredBy: true,
          
          // Status and Timestamps
          patientStatus: true,
          createdAt: true,
          updatedAt: true,
          
          // Related data
          defaultInsurance: {
            select: {
              id: true,
              insuranceName: true,
              insuranceType: true,
              policyNumber: true,
              coverageAmount: true,
              deductibleAmount: true,
              copayPercentage: true,
              validFrom: true,
              validTo: true,
              contactNumber: true,
              email: true,
              address: true,
              isActive: true
            }
          },
          referrer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientNumber: true,
              email: true,
              phone: true
            }
          },
          // Appointments
          appointments: {
            select: {
              id: true,
              appointmentDate: true,
              appointmentTime: true,
              tokenNumber: true,
              appointmentType: true,
              status: true,
              purpose: true,
              notes: true,
              doctorId: true,
              doctor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  staffType: true
                }
              }
            },
            orderBy: {
              appointmentDate: 'desc'
            },
            take: 5
          },
          // Visits
          patientVisits: {
            select: {
              id: true,
              visitNumber: true,
              visitDate: true,
              visitType: true,
              status: true,
              checkedInAt: true,
              priorityLevel: true
            },
            orderBy: {
              visitDate: 'desc'
            },
            take: 5
          }
          // Note: passwordHash excluded for security
        }
      });

      return patient;
    } catch (error) {
      console.error('Error finding patient by ID:', error);
      throw new Error('Failed to find patient');
    }
  }

  /**
   * Update patient contact information
   * @param {string} patientId - ID of the patient to update
   * @param {Object} updateData - Contact data to update
   * @returns {Promise<Object>} Updated patient data
   */
  /**
   * Update patient personal information
   * @param {string} patientId - Patient ID
   * @param {object} updateData - Personal information data to update
   * @returns {Promise<object>} Updated patient personal information
   */
  async updatePatientPersonalInfo(patientId, updateData) {
    try {
      console.log(`🔄 Updating personal info for patient: ${patientId}`);
      console.log('Update data:', updateData);

      const updatedPatient = await prisma.patient.update({
        where: { id: patientId },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          bloodGroup: true,
          updatedAt: true
        }
      });

      console.log('✅ Patient personal info updated successfully');
      return updatedPatient;
    } catch (error) {
      console.error('Error updating patient personal info:', error);
      throw new Error('Failed to update patient personal information');
    }
  }

  /**
   * Update patient contact information
   * @param {string} patientId - Patient ID
   * @param {object} updateData - Contact information data to update
   * @returns {Promise<object>} Updated patient contact information
   */
  async updatePatientContactInfo(patientId, updateData) {
    try {
      console.log(`🔄 Updating contact info for patient: ${patientId}`);
      console.log('Update data:', updateData);

      const updatedPatient = await prisma.patient.update({
        where: { id: patientId },
        data: updateData,
        select: {
          id: true,
          phone: true,
          email: true,
          address: true,
          emergencyContacts: true,
          updatedAt: true
        }
      });

      console.log('✅ Patient contact info updated successfully');
      return updatedPatient;
    } catch (error) {
      console.error('Error updating patient contact info:', error);
      throw new Error('Failed to update patient contact information');
    }
  }

  /**
   * Update patient medical history information
   * @param {string} patientId - Patient ID
   * @param {object} updateData - Medical history data to update
   * @returns {Promise<object>} Updated patient medical information
   */
  async updatePatientMedicalHistory(patientId, updateData) {
    try {
      console.log(`🔄 Updating medical history for patient: ${patientId}`);
      console.log('Update data:', JSON.stringify(updateData, null, 2));

      const updatedPatient = await prisma.patient.update({
        where: { id: patientId },
        data: updateData,
        select: {
          id: true,
          allergies: true,
          chronicConditions: true,
          currentMedications: true,
          previousSurgeries: true,
          familyHistory: true,
          lifestyle: true,
          bloodGroup: true,
          eyeHistory: true,
          visionHistory: true,
          riskFactors: true,
          updatedAt: true
        }
      });

      console.log('✅ Patient medical history updated successfully');
      return updatedPatient;
    } catch (error) {
      console.error('Error updating patient medical history:', error);
      throw new Error('Failed to update patient medical history');
    }
  }

  /**
   * Update patient profile photo
   * @param {string} patientId - Patient ID
   * @param {string} profilePhoto - Base64 encoded profile photo
   * @returns {Promise<object>} Updated patient profile photo information
   */
  async updatePatientProfilePhoto(patientId, profilePhoto) {
    try {
      console.log(`🔄 Updating profile photo for patient: ${patientId}`);
      console.log('Profile photo size:', profilePhoto ? `${Math.round(profilePhoto.length / 1024)}KB` : 'null');

      const updatedPatient = await prisma.patient.update({
        where: { id: patientId },
        data: { profilePhoto },
        select: {
          id: true,
          profilePhoto: true,
          updatedAt: true
        }
      });

      console.log('✅ Patient profile photo updated successfully');
      return updatedPatient;
    } catch (error) {
      console.error('Error updating patient profile photo:', error);
      throw new Error('Failed to update patient profile photo');
    }
  }

  /**
   * Get all family members referred by a specific patient
   * @param {string} referringPatientId - ID of the patient who referred family members
   * @returns {Promise<Array>} Array of referred family members
   */
  async getFamilyMembersReferredBy(referringPatientId) {
    try {
      console.log(`🔍 Getting family members referred by patient: ${referringPatientId}`);

      const familyMembers = await prisma.patient.findMany({
        where: {
          referredBy: referringPatientId,
          isReferred: true,
          patientStatus: 'active'
        },
        select: {
          id: true,
          patientNumber: true,
          mrn: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          patientStatus: true,
          isReferred: true,
          referredBy: true,
          createdAt: true,
          lastLogin: true,
          // Include referring patient info
          referrer: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      });

      console.log(`✅ Found ${familyMembers.length} family members referred by patient ${referringPatientId}`);
      
      // Add calculated fields for display
      return familyMembers.map(member => ({
        ...member,
        fullName: `${member.firstName} ${member.lastName}`,
        registrationDate: member.createdAt,
        daysSinceRegistration: Math.floor((new Date() - new Date(member.createdAt)) / (1000 * 60 * 60 * 24)),
        hasLoggedIn: !!member.lastLogin
      }));

    } catch (error) {
      console.error('❌ Error getting referred family members:', error);
      throw new Error('Failed to get referred family members');
    }
  }

  /**
   * Switch to family member account (authenticate as referred patient from referring patient session)
   * @param {string} referringPatientId - ID of the patient who referred the family member
   * @param {string} familyMemberPatientId - ID of the family member to switch to
   * @returns {Promise<Object>} Family member patient data with login token
   */
  async switchToFamilyMemberAccount(referringPatientId, familyMemberPatientId) {
    try {
      console.log(`🔄 Switching from patient ${referringPatientId} to family member ${familyMemberPatientId}`);

      // First, get the current patient to understand their family structure
      const currentPatient = await prisma.patient.findUnique({
        where: { id: referringPatientId },
        select: {
          id: true,
          patientNumber: true,
          referredBy: true,
          isReferred: true
        }
      });

      if (!currentPatient) {
        throw new Error('Current patient not found');
      }

      // Determine the family root (main account)
      let familyRootId;
      if (currentPatient.isReferred && currentPatient.referredBy) {
        // Current patient is a family member, so use their referrer as family root
        familyRootId = currentPatient.referredBy;
      } else {
        // Current patient is the main account
        familyRootId = currentPatient.id;
      }

      console.log(`🏠 Family root ID: ${familyRootId}`);

      // Now find the target family member - they can be either:
      // 1. The main account (family root)
      // 2. Any family member referred by the family root
      let familyMember;

      if (familyMemberPatientId === familyRootId) {
        // Switching to the main account
        familyMember = await prisma.patient.findUnique({
          where: {
            id: familyMemberPatientId,
            patientStatus: 'active'
          },
          select: {
            id: true,
            patientNumber: true,
            mrn: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            phone: true,
            email: true,
            patientStatus: true,
            isReferred: true,
            referredBy: true,
            createdAt: true,
            lastLogin: true,
            address: true,
            emergencyContacts: true,
            allergies: true
          }
        });
      } else {
        // Switching to another family member
        familyMember = await prisma.patient.findFirst({
          where: {
            id: familyMemberPatientId,
            referredBy: familyRootId,
            isReferred: true,
            patientStatus: 'active'
          },
          select: {
            id: true,
            patientNumber: true,
            mrn: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            phone: true,
            email: true,
            patientStatus: true,
            isReferred: true,
            referredBy: true,
            createdAt: true,
            lastLogin: true,
            address: true,
            emergencyContacts: true,
            allergies: true,
            referrer: {
              select: {
                id: true,
                patientNumber: true,
                firstName: true,
                lastName: true
              }
            }
          }
        });
      }

      if (!familyMember) {
        throw new Error('Family member not found or not part of the same family group');
      }

      // Update last login time for family member
      await this.updatePatientLogin(familyMemberPatientId);

      console.log(`✅ Successfully switched to family member account: ${familyMember.firstName} ${familyMember.lastName} (${familyMember.patientNumber})`);

      return {
        ...familyMember,
        fullName: `${familyMember.firstName} ${familyMember.lastName}`,
        switchedFrom: {
          patientId: referringPatientId,
          switchedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Error switching to family member account:', error);
      throw new Error('Failed to switch to family member account');
    }
  }

  /**
   * Get list of doctors available for appointments
   * @param {string} department - Filter by department (optional)
   * @param {string} specialization - Filter by specialization (optional)
   * @returns {Promise<Array>} List of doctors
   */
  async getDoctorsList(department = null, specialization = null) {
    try {
      console.log('🔍 Getting doctors list with filters:', { department, specialization });
      
      // Build where clause for filtering
      const whereClause = {
        staffType: 'doctor',
        isActive: true,
        employmentStatus: 'active'
      };

      if (department) {
        whereClause.department = department;
      }

      const doctors = await prisma.staff.findMany({
        where: whereClause,
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          department: true,
          qualifications: true,
          languagesSpoken: true,
          doctorProfile: true,
          profilePhoto: true,
          joiningDate: true,
          createdAt: true
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      });

      console.log(`🔍 Raw doctors from database: ${doctors.length} found`);
      if (doctors.length > 0) {
        console.log('🔍 Sample doctor IDs:', doctors.slice(0, 3).map(d => ({
          id: d.id,
          employeeId: d.employeeId,
          name: `${d.firstName} ${d.lastName}`
        })));
      } else {
        console.log('⚠️ No doctors found in database! Check if you have doctors with:');
        console.log('   - staffType: "doctor"');
        console.log('   - isActive: true');
        console.log('   - employmentStatus: "active"');
      }

      // Transform doctors data to match frontend expectations
      const transformedDoctors = doctors.map(doctor => {
        // Get doctor profile (already parsed by Prisma since it's a JSON field)
        const doctorProfile = doctor.doctorProfile || {};

        // Calculate experience (assuming joiningDate represents start of medical career)
        const experienceYears = doctor.joiningDate 
          ? Math.floor((new Date() - new Date(doctor.joiningDate)) / (365.25 * 24 * 60 * 60 * 1000))
          : 0;

        return {
          id: doctor.id, // Use the actual database ID (Staff table primary key)
          employeeId: doctor.employeeId, // Keep employee ID separate for display
          name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
          specialization: doctorProfile.specialization || `${doctor.department} Specialist`,
          department: doctor.department || 'ophthalmology',
          experience: Math.max(experienceYears, doctorProfile.experienceYears || 0),
          rating: doctorProfile.rating || 4.5, // Default rating
          reviews: doctorProfile.reviewCount || Math.floor(Math.random() * 500) + 100,
          consultationFee: doctorProfile.consultationFee || 1500,
          languages: doctor.languagesSpoken && doctor.languagesSpoken.length > 0 
            ? doctor.languagesSpoken 
            : ['English', 'Hindi'],
          locations: doctorProfile.consultationLocations || [
            `${doctor.firstName} ${doctor.lastName} Clinic`
          ],
          availableSlots: doctorProfile.defaultSlots || ['09:00', '10:30', '14:00', '15:30'],
          nextAvailable: 'Today', // This would be calculated based on actual availability
          consultationTypes: doctorProfile.consultationTypes || ['in-person'],
          photo: doctor.profilePhoto || null,
          qualifications: doctor.qualifications || []
        };
      });

      // Filter by specialization if provided
      if (specialization) {
        return transformedDoctors.filter(doctor => 
          doctor.specialization.toLowerCase().includes(specialization.toLowerCase())
        );
      }

      console.log(`✅ Retrieved ${transformedDoctors.length} doctors`);
      
      return transformedDoctors;

    } catch (error) {
      console.error('Error getting doctors list:', error);
      throw new Error('Failed to retrieve doctors list');
    }
  }

  /**
   * Find staff member by ID
   * @param {string} staffId - Staff ID
   * @returns {Promise<Object|null>} Staff member or null
   */
  async findStaffById(staffId) {
    try {
      console.log('🔍 PatientService: Searching for staff with ID:', staffId);
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          staffType: true,
          isActive: true,
          employmentStatus: true,
          department: true,
          doctorProfile: true
        }
      });

      console.log('🔍 PatientService: Staff lookup result:', staff ? 'Found' : 'Not found');
      if (staff) {
        console.log('🔍 PatientService: Staff details:', {
          id: staff.id,
          name: `${staff.firstName} ${staff.lastName}`,
          staffType: staff.staffType
        });
      }

      return staff;
    } catch (error) {
      console.error('❌ PatientService: Error finding staff by ID:', error);
      throw new Error('Failed to find staff member');
    }
  }

  /**
   * Check for existing appointment
   * @param {string} patientId - Patient ID
   * @param {string} doctorId - Doctor ID
   * @param {Date} appointmentDate - Appointment date
   * @returns {Promise<Object|null>} Existing appointment or null
   */
  async findExistingAppointment(patientId, doctorId, appointmentDate) {
    try {
      const startOfDay = new Date(appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          patientId,
          doctorId,
          appointmentDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
          }
        },
        select: {
          id: true,
          appointmentDate: true,
          appointmentTime: true,
          status: true
        }
      });

      return existingAppointment;
    } catch (error) {
      console.error('Error checking existing appointment:', error);
      throw new Error('Failed to check existing appointment');
    }
  }

  /**
   * Update appointment with QR code
   * @param {string} appointmentId - Appointment ID
   * @param {string} qrCodeBase64 - Base64 QR code string
   * @returns {Promise<Object>} Updated appointment
   */
  async updateAppointmentQRCode(appointmentId, qrCodeBase64) {
    try {
      console.log('🔍 Updating appointment QR code for ID:', appointmentId);
      
      const updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: { qrCode: qrCodeBase64 },
        select: {
          id: true,
          qrCode: true,
          tokenNumber: true,
          appointmentDate: true,
          appointmentTime: true
        }
      });

      console.log('✅ QR code updated for appointment:', appointmentId);
      return updatedAppointment;
    } catch (error) {
      console.error('❌ Error updating appointment QR code:', error);
      throw new Error('Failed to update appointment QR code');
    }
  }

  /**
   * Generate next visit number for a patient
   * @param {string} patientId - Patient ID
   * @returns {Promise<number>} Next visit number
   */
  async generateNextVisitNumber(patientId) {
    try {
      // Get the highest visit number for this patient
      const lastVisit = await prisma.patientVisit.findFirst({
        where: { patientId },
        orderBy: { visitNumber: 'desc' },
        select: { visitNumber: true }
      });

      const nextVisitNumber = lastVisit?.visitNumber ? lastVisit.visitNumber + 1 : 1;
      console.log(`✅ Generated visit number ${nextVisitNumber} for patient ${patientId}`);
      return nextVisitNumber;
    } catch (error) {
      console.error('❌ Error generating visit number:', error);
      throw new Error('Failed to generate visit number');
    }
  }

  /**
   * Check in patient by token number
   * @param {string} tokenNumber - Appointment token number
   * @param {string} priorityLabel - Priority label for queue
   * @returns {Promise<Object>} Check-in result with appointment, visit, and queue info
   */
  async checkInPatientByToken(tokenNumber, priorityLabel = 'ROUTINE') {
    try {
      console.log(`🎯 Starting check-in process for token: ${tokenNumber}`);

      // Normalize priorityLabel - ensure it's never null or empty and matches enum values
      if (!priorityLabel || typeof priorityLabel !== 'string') {
        priorityLabel = 'ROUTINE';
      } else {
        // Convert to uppercase to match PriorityLabel enum values
        priorityLabel = priorityLabel.toUpperCase();
        
        // Valid enum values: PRIORITY, EMERGENCY, CHILDREN, SENIORS, LONGWAIT, REFERRAL, FOLLOWUP, ROUTINE, PREPOSTOP
        const validPriorityLabels = ['PRIORITY', 'EMERGENCY', 'CHILDREN', 'SENIORS', 'LONGWAIT', 'REFERRAL', 'FOLLOWUP', 'ROUTINE', 'PREPOSTOP'];
        
        if (!validPriorityLabels.includes(priorityLabel)) {
          priorityLabel = 'ROUTINE'; // Default fallback
        }
      }

      // Find appointment by token number
      const appointment = await prisma.appointment.findUnique({
        where: { tokenNumber },
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              phone: true,
              email: true
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
      });

      if (!appointment) {
        throw new Error('Invalid token number. Appointment not found.');
      }

      // Check if appointment is for today
      const today = new Date();
      const appointmentDate = new Date(appointment.appointmentDate);
      const isToday = appointmentDate.toDateString() === today.toDateString();

      if (!isToday) {
        throw new Error('Appointment is not scheduled for today. Please check the appointment date.');
      }

      // First, check if a visit already exists for this appointment (regardless of status)
      const existingVisit = await prisma.patientVisit.findUnique({
        where: { appointmentId: appointment.id }
      });

      if (existingVisit) {
        console.log(`⚠️ Patient visit already exists for appointment ${appointment.id}`);
        
        // Find the queue entry for this visit - only if it's still active (WAITING status)
        const existingQueue = await prisma.patientQueue.findFirst({
          where: { 
            patientVisitId: existingVisit.id,
            status: 'WAITING' // Only return early if actively waiting in queue
          }
        });

        // If there's an active queue entry, patient is already checked in
        if (existingQueue) {
          return {
            success: true,
            message: 'Patient already checked in and waiting in queue',
            alreadyCheckedIn: true,
            appointment,
            patientVisit: existingVisit,
            queueInfo: {
              queueFor: existingQueue.queueFor,
              queueNumber: existingQueue.queueNumber,
              priorityLabel: existingQueue.priorityLabel,
              status: existingQueue.status,
              estimatedWaitTime: await this.calculateEstimatedWaitTime(existingQueue.queueFor, existingQueue.queueNumber)
            }
          };
        }
        
        // If visit exists but no active queue, this is stale data - throw error
        console.log(`⚠️ Visit exists but no active queue entry. Visit status: ${existingVisit.status}`);
        throw new Error('Patient visit record exists but is not in active queue. Cannot check in again. Please contact support.');
      }

      // Check if appointment is already checked in (status inconsistency check)
      if (appointment.status === 'CHECKED_IN') {
        throw new Error('Appointment is marked as checked in but no visit record found. Please contact support.');
      }

      // Check if appointment can be checked in
      if (appointment.status !== 'SCHEDULED') {
        throw new Error(`Cannot check in. Appointment status is: ${appointment.status}`);
      }

      // Generate next visit number for this patient
      const visitNumber = await this.generateNextVisitNumber(appointment.patientId);

      // Start transaction for check-in process
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update appointment status to CHECKED_IN and mark as ACTIVE
        const updatedAppointment = await tx.appointment.update({
          where: { id: appointment.id },
          data: { 
            status: 'CHECKED_IN',
            isActive: true,
            updatedAt: new Date()
          }
        });

        // 2. Create PatientVisit record
        // Map appointment type to valid VisitType enum values
        const getVisitType = (appointmentType) => {
          const typeMapping = {
            'routine': 'OPD',
            'consultation': 'OPD',
            'checkup': 'OPD', 
            'followup': 'FOLLOWUP',
            'follow-up': 'FOLLOWUP',
            'follow_up': 'FOLLOWUP',
            'emergency': 'EMERGENCY',
            'ipd': 'IPD',
            'opd': 'OPD',
            'surgery': 'IPD',  // Surgery appointments are typically IPD
            'admission': 'IPD',
            'inpatient': 'IPD',
            'outpatient': 'OPD'
          };
          
          const normalizedType = appointmentType?.toLowerCase?.() || 'routine';
          return typeMapping[normalizedType] || 'OPD'; // Default to OPD
        };

        const patientVisit = await tx.patientVisit.create({
          data: {
            patientId: appointment.patientId,
            appointmentId: appointment.id,
            doctorId: appointment.doctorId,
            visitNumber,
            visitType: getVisitType(appointment.appointmentType),
            visitDate: new Date(),
            status: 'CHECKED_IN',
            priorityLevel: priorityLabel, // Already normalized to lowercase
            checkedInAt: new Date()
          }
        });

        // 3. Get next queue number for optometrist queue
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const lastQueueEntry = await tx.patientQueue.findFirst({
          where: {
            queueFor: 'OPTOMETRIST',
            joinedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          orderBy: { queueNumber: 'desc' }
        });

        const nextQueueNumber = lastQueueEntry ? lastQueueEntry.queueNumber + 1 : 1;

        // 4. Add patient to optometrist queue
        const queueEntry = await tx.patientQueue.create({
          data: {
            patientId: appointment.patientId, // Direct patient reference
            patientVisitId: patientVisit.id,
            queueFor: 'OPTOMETRIST',
            queueNumber: nextQueueNumber,
            priority: 0, // Not used for ordering, just default
            priorityLabel: priorityLabel || 'ROUTINE',
            status: 'WAITING',
            joinedAt: new Date()
          }
        });

        return {
          updatedAppointment,
          patientVisit,
          queueEntry
        };
      });

      console.log(`✅ Patient checked in successfully: Token ${tokenNumber}, Visit ${visitNumber}, Queue ${result.queueEntry.queueNumber}`);

      // Emit WebSocket event for queue update
      try {
        const { emitQueueUpdate } = require('../socket/channels/queueChannel');
        emitQueueUpdate('optometrist-queue', {
          action: 'patient-checked-in',
          queueEntryId: result.queueEntry.id,
          queueNumber: result.queueEntry.queueNumber,
          priority: result.queueEntry.priorityLabel,
          patientInfo: {
            patientId: appointment.patient.id,
            patientNumber: appointment.patient.patientNumber,
            name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            tokenNumber: appointment.tokenNumber
          },
          timestamp: new Date()
        });
        console.log('📡 Emitted patient-checked-in event to optometrist-queue');
      } catch (socketError) {
        console.error('⚠️ Failed to emit WebSocket event:', socketError.message);
        // Don't fail check-in if WebSocket fails
      }

      return {
        success: true,
        message: 'Patient checked in successfully',
        alreadyCheckedIn: false,
        appointment: {
          ...appointment,
          status: 'CHECKED_IN'
        },
        patientVisit: result.patientVisit,
        queueInfo: {
          queueFor: 'OPTOMETRIST',
          queueNumber: result.queueEntry.queueNumber,
          priorityLabel: result.queueEntry.priorityLabel,
          estimatedWaitTime: await this.calculateEstimatedWaitTime('OPTOMETRIST', result.queueEntry.queueNumber)
        }
      };

    } catch (error) {
      console.error('❌ Error during patient check-in:', error);
      
      // Re-throw the error without wrapping if it's already a clear error message
      if (error.message.includes('Invalid token') || 
          error.message.includes('not found') || 
          error.message.includes('not scheduled for today') ||
          error.message.includes('already checked in') ||
          error.message.includes('contact support') ||
          error.message.includes('Cannot check in')) {
        throw error; // Re-throw as-is for client-friendly errors
      }
      
      // For unexpected errors, wrap with generic message
      throw new Error(`Check-in failed: ${error.message}`);
    }
  }

  /**
   * Get priority value for queue ordering
   * @param {string} priorityLabel - Priority label
   * @returns {number} Priority value (lower number = higher priority)
   */
  getPriorityValue(priorityLabel) {
    const priorityMap = {
      'EMERGENCY': 1,
      'PRIORITY': 2,
      'CHILDREN': 3,
      'SENIORS': 4,
      'PREPOSTOP': 5,
      'REFERRAL': 6,
      'FOLLOWUP': 7,
      'LONGWAIT': 8,
      'ROUTINE': 9
    };
    return priorityMap[priorityLabel] || 9;
  }

  /**
   * Calculate estimated wait time based on queue position
   * @param {string} queueFor - Queue type
   * @param {number} queueNumber - Current queue number
   * @returns {Promise<number>} Estimated wait time in minutes
   */
  async calculateEstimatedWaitTime(queueFor, queueNumber) {
    try {
      // Get current serving queue number
      const currentlyServing = await prisma.patientQueue.findFirst({
        where: {
          queueFor,
          status: 'IN_PROGRESS'
        },
        orderBy: { queueNumber: 'asc' }
      });

      const currentNumber = currentlyServing?.queueNumber || 1;
      const patientsAhead = Math.max(0, queueNumber - currentNumber);

      // Estimate 15 minutes per patient for optometrist
      const avgTimePerPatient = queueFor === 'OPTOMETRIST' ? 15 : 20;
      return patientsAhead * avgTimePerPatient;

    } catch (error) {
      console.error('❌ Error calculating wait time:', error);
      return 30; // Default 30 minutes
    }
  }

  /**
   * Get queue status for a specific queue type
   * @param {string} queueFor - Queue type (OPTOMETRIST, OPHTHALMOLOGIST, etc.)
   * @returns {Promise<Object>} Queue status information
   */
  async getQueueStatus(queueFor) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // Get current queue entries (FCFS order only)
        const queueEntries = await prisma.patientQueue.findMany({
          where: {
            queueFor,
            joinedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          },
          include: {
            patient: {
              select: {
                patientNumber: true,
                firstName: true,
                lastName: true
              }
            },
            patientVisit: {
              include: {
                appointment: {
                  select: {
                    tokenNumber: true,
                    appointmentTime: true
                  }
                }
              }
            }
          },
          orderBy: [
            { queueNumber: 'asc' }
          ]
        });      // Calculate statistics
      const totalPatients = queueEntries.length;
      const waitingPatients = queueEntries.filter(q => q.status === 'WAITING').length;
      const inProgressPatients = queueEntries.filter(q => q.status === 'IN_PROGRESS').length;
      const completedPatients = queueEntries.filter(q => q.status === 'COMPLETED').length;

      return {
        queueFor,
        totalPatients,
        waitingPatients,
        inProgressPatients,
        completedPatients,
        queueEntries: queueEntries.map(entry => ({
          id: entry.id,
          queueNumber: entry.queueNumber,
          priorityLabel: entry.priorityLabel,
          status: entry.status,
          estimatedWaitTime: entry.estimatedWaitTime,
          joinedAt: entry.joinedAt,
          patient: {
            patientNumber: entry.patient.patientNumber, // Direct access
            name: `${entry.patient.firstName} ${entry.patient.lastName}`, // Direct access
            tokenNumber: entry.patientVisit.appointment.tokenNumber,
            appointmentTime: entry.patientVisit.appointment.appointmentTime
          }
        }))
      };

    } catch (error) {
      console.error('❌ Error getting queue status:', error);
      throw new Error('Failed to get queue status');
    }
  }

  /**
   * Find appointment by token number
   * @param {string} tokenNumber - Token number
   * @returns {Promise<Object|null>} Appointment or null
   */
  async findAppointmentByToken(tokenNumber) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { tokenNumber },
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
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffType: true
            }
          },
          patientVisit: {
            include: {
              patientQueue: true
            }
          }
        }
      });

      return appointment;
    } catch (error) {
      console.error('❌ Error finding appointment by token:', error);
      throw new Error('Failed to find appointment');
    }
  }

  /**
   * Get all appointments for a patient (previous and upcoming)
   * @param {string} patientId - Patient ID
   * @returns {Promise<Object>} Categorized appointments
   */
  async getPatientAppointments(patientId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      console.log(`🔍 Getting appointments for patient: ${patientId}`);

      // Get all appointments for the patient
      const appointments = await prisma.appointment.findMany({
        where: {
          patientId: patientId
        },
        include: {
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffType: true,
              department: true
            }
          },
          patientVisit: {
            select: {
              id: true,
              visitNumber: true,
              visitType: true,
              status: true,
              checkedInAt: true,
              completedAt: true
            }
          }
        },
        orderBy: [
          { appointmentDate: 'desc' },
          { appointmentTime: 'desc' }
        ]
      });

      // Categorize appointments
      const previousAppointments = [];
      const upcomingAppointments = [];
      const todayAppointments = [];

      appointments.forEach(appointment => {
        const appointmentDate = new Date(appointment.appointmentDate);
        appointmentDate.setHours(0, 0, 0, 0);

        // Add formatted data
        const formattedAppointment = {
          id: appointment.id,
          tokenNumber: appointment.tokenNumber,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          status: appointment.status,
          appointmentType: appointment.appointmentType,
          purpose: appointment.purpose,
          notes: appointment.notes,
          estimatedDuration: appointment.estimatedDuration,
          createdAt: appointment.createdAt,
          formattedDate: appointmentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          formattedTime: appointment.appointmentTime,
          doctorName: appointment.doctor ? 
            `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}` : 
            'Doctor not assigned',
          doctor: appointment.doctor,
          visit: appointment.patientVisit ? {
            id: appointment.patientVisit.id,
            visitNumber: appointment.patientVisit.visitNumber,
            visitType: appointment.patientVisit.visitType,
            status: appointment.patientVisit.status,
            checkedInAt: appointment.patientVisit.checkedInAt,
            completedAt: appointment.patientVisit.completedAt
          } : null
        };

        if (appointmentDate.getTime() === today.getTime()) {
          // Today's appointments
          todayAppointments.push(formattedAppointment);
        } else if (appointmentDate < today) {
          // Previous appointments
          previousAppointments.push(formattedAppointment);
        } else {
          // Upcoming appointments
          upcomingAppointments.push(formattedAppointment);
        }
      });

      // Sort arrays appropriately
      previousAppointments.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
      upcomingAppointments.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
      todayAppointments.sort((a, b) => {
        // Sort today's appointments by time
        const timeA = a.appointmentTime || '';
        const timeB = b.appointmentTime || '';
        return timeA.localeCompare(timeB);
      });

      const totalAppointments = appointments.length;
      console.log(`✅ Retrieved ${totalAppointments} appointments for patient ${patientId}`);

      return {
        totalAppointments,
        todayAppointments: {
          count: todayAppointments.length,
          appointments: todayAppointments
        },
        upcomingAppointments: {
          count: upcomingAppointments.length,
          appointments: upcomingAppointments
        },
        previousAppointments: {
          count: previousAppointments.length,
          appointments: previousAppointments
        },
        retrievedAt: new Date(),
        referenceDate: today
      };

    } catch (error) {
      console.error('❌ Error getting patient appointments:', error);
      throw new Error('Failed to get patient appointments');
    }
  }

  /**
   * Get medical records - all appointments with examination data
   */
  async getPatientMedicalRecords(patientId) {
    try {
      const appointments = await prisma.appointment.findMany({
        where: { patientId },
        include: {
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffType: true,
              department: true
            }
          },
          patientVisit: {
            include: {
              optometristExamination: {
                include: {
                  optometrist: {
                    select: { firstName: true, lastName: true }
                  }
                }
              },
              ophthalmologistExaminations: {
                include: {
                  doctor: {
                    select: { firstName: true, lastName: true }
                  },
                  diagnoses: {
                    include: {
                      disease: {
                        include: { icd11Code: true }
                      }
                    }
                  }
                },
                orderBy: { createdAt: 'desc' }
              },
              prescriptions: {
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        },
        orderBy: [
          { appointmentDate: 'desc' },
          { appointmentTime: 'desc' }
        ]
      });

      return appointments.map(apt => ({
        id: apt.id,
        tokenNumber: apt.tokenNumber,
        appointmentDate: apt.appointmentDate,
        appointmentTime: apt.appointmentTime,
        status: apt.status,
        appointmentType: apt.appointmentType,
        purpose: apt.purpose,
        notes: apt.notes,
        createdAt: apt.createdAt,
        doctorName: apt.doctor
          ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`
          : 'Doctor not assigned',
        doctor: apt.doctor,
        visit: apt.patientVisit ? {
          id: apt.patientVisit.id,
          status: apt.patientVisit.status,
          completedAt: apt.patientVisit.completedAt,
          optometristExamination: apt.patientVisit.optometristExamination,
          ophthalmologistExaminations: apt.patientVisit.ophthalmologistExaminations,
          prescriptions: apt.patientVisit.prescriptions
        } : null,
        hasExamination: !!(
          apt.patientVisit?.optometristExamination ||
          (apt.patientVisit?.ophthalmologistExaminations?.length > 0)
        )
      }));
    } catch (error) {
      console.error('❌ Error getting patient medical records:', error);
      throw new Error('Failed to get medical records');
    }
  }

  /**
   * Get all prescriptions for a patient
   */
  async getPatientPrescriptions(patientId) {
    try {
      const prescriptions = await prisma.prescription.findMany({
        where: {
          patientVisit: {
            patientId
          }
        },
        include: {
          prescriptionItems: {
            include: {
              medicine: {
                select: {
                  name: true,
                  information: true,
                  type: { select: { name: true } },
                  genericMedicine: { select: { name: true } },
                  drugGroup: { select: { name: true } }
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffType: true,
              department: true
            }
          },
          patientVisit: {
            select: {
              id: true,
              visitNumber: true,
              visitDate: true,
              status: true,
              completedAt: true,
              chiefComplaint: true,
              appointment: {
                select: {
                  appointmentDate: true,
                  purpose: true,
                  tokenNumber: true
                }
              }
            }
          }
        },
        orderBy: { prescriptionDate: 'desc' }
      });

      return prescriptions.map(p => ({
        id: p.id,
        prescriptionNumber: p.prescriptionNumber,
        prescriptionDate: p.prescriptionDate,
        validTill: p.validTill,
        generalInstructions: p.generalInstructions,
        followUpInstructions: p.followUpInstructions,
        status: p.status,
        doctorName: p.doctor ? `Dr. ${p.doctor.firstName} ${p.doctor.lastName}` : 'Unknown Doctor',
        doctor: p.doctor,
        visitId: p.patientVisitId,
        visitNumber: p.patientVisit?.visitNumber,
        visitDate: p.patientVisit?.visitDate,
        chiefComplaint: p.patientVisit?.chiefComplaint,
        appointmentDate: p.patientVisit?.appointment?.appointmentDate,
        appointmentPurpose: p.patientVisit?.appointment?.purpose,
        tokenNumber: p.patientVisit?.appointment?.tokenNumber,
        items: p.prescriptionItems.map(item => ({
          id: item.id,
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          quantity: item.quantity,
          genericName: item.medicine?.genericMedicine?.name || null,
          medicineType: item.medicine?.type?.name || null,
          drugGroup: item.medicine?.drugGroup?.name || null,
          medicineInfo: item.medicine?.information || null
        }))
      }));
    } catch (error) {
      console.error('❌ Error getting patient prescriptions:', error);
      throw new Error('Failed to get prescriptions');
    }
  }
}

// Export singleton instance
const patientService = new PatientService();
module.exports = patientService;