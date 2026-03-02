// src/controllers/patientController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const patientService = require('../services/patientService');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');
const { JWT_SECRET } = require('../middleware/auth');

const prisma = new PrismaClient();

// Generate JWT token for patient
const generatePatientToken = (patient) => {
  return jwt.sign(
    { 
      id: patient.id, 
      email: patient.email,
      userType: 'patient',
      patientNumber: patient.patientNumber
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Generate random password for patient
const generateRandomPassword = () => {
  // Generate a secure random password with 8 characters
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%&*'[Math.floor(Math.random() * 7)]; // Special
  
  // Fill the rest randomly
  for (let i = 4; i < 8; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Send OTP for patient registration verification
 */
const sendRegistrationOTP = async (req, res) => {
  try {
    const { firstName, middleName, lastName, dateOfBirth, gender, email, mobileNumber } = req.body;

    // Validate required fields
    if (!firstName || !middleName || !lastName || !dateOfBirth || !gender || !email || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (firstName, middleName, lastName, dateOfBirth, gender, email, mobileNumber)'
      });
    }

    // Validate firstName, middleName and lastName
    if (firstName.trim().length < 2 || middleName.trim().length < 2 || lastName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'First name, middle name and last name must be at least 2 characters long'
      });
    }

    // Validate date of birth
    const birthDate = new Date(dateOfBirth);
    const currentDate = new Date();
    const age = Math.floor((currentDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (isNaN(birthDate.getTime()) || birthDate >= currentDate || age > 120) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date of birth'
      });
    }

    // Validate gender
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(gender.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Gender must be male, female, or other'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate mobile number format (Indian 10-digit starting with 6-9 OR international 10-15 digits)
    const indianMobileRegex = /^[6-9]\d{9}$/;
    const internationalMobileRegex = /^\d{10,15}$/;
    if (!indianMobileRegex.test(mobileNumber) && !internationalMobileRegex.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format. Must be 10-digit Indian number (starting with 6-9) or 10-15 digit international number'
      });
    }

    // Check if patient already exists
    const existingPatient = await patientService.findExistingPatient(email, mobileNumber);
    if (existingPatient) {
      return res.status(409).json({
        success: false,
        message: 'Patient already registered with this email or mobile number',
        patientNumber: existingPatient.patientNumber
      });
    }

    // Check rate limiting
    const rateLimitCheck = await otpService.checkRateLimit(email, 'patient_registration', 15, 3);
    if (rateLimitCheck.isLimited) {
      return res.status(429).json({
        success: false,
        message: rateLimitCheck.message,
        resetTime: rateLimitCheck.resetTime
      });
    }

    // Generate 4-digit OTP for patient registration
    let otpData;
    try {
      otpData = await otpService.generatePatientRegistrationOTP(
        email,
        10, // 10 minutes expiry
        req.ip,
        req.get('User-Agent')
      );
      console.log(`✅ OTP generated successfully for ${email}`);
    } catch (otpError) {
      console.error('❌ Failed to generate OTP:', otpError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate OTP. Please try again.'
      });
    }

    // Send OTP via email with personalized template
    try {
      await emailService.sendOTPEmail(
        email, 
        otpData.otp, 
        'Patient Registration',
        10, // expiry minutes
        firstName // pass first name for personalization
      );
      console.log(`✅ Registration OTP sent to email: ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email:', emailError);
      
      // If email fails, we should invalidate the OTP to prevent inconsistent state
      try {
        await otpService.invalidateExistingOTPs(email, 'patient_registration');
        console.log(`🔄 Invalidated OTP due to email failure for ${email}`);
      } catch (invalidateError) {
        console.error('❌ Failed to invalidate OTP after email failure:', invalidateError);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }

    // TODO: Implement SMS service for mobile OTP
    // For now, we'll just log that mobile OTP would be sent
    console.log(`📱 Mobile OTP (not implemented): ${otpData.otp} to ${mobileNumber}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email and mobile number',
      data: {
        firstName: firstName,
        lastName: lastName,
        dateOfBirth: dateOfBirth,
        gender: gender,
        email: email,
        mobileNumber: mobileNumber,
        expiresAt: otpData.expiresAt,
        otpId: otpData.id
      }
    });

  } catch (error) {
    console.error('Error sending registration OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Verify OTP and complete patient registration
 */
const verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, mobileNumber, otp, firstName, middleName, lastName, dateOfBirth, gender } = req.body;

    // Validate required fields
    if (!email || !mobileNumber || !otp || !firstName || !middleName || !lastName || !gender) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided (email, mobileNumber, otp, firstName, middleName, lastName, dateOfBirth, gender)'
      });
    }

    // Validate OTP format (4 digits)
    if (!/^\d{4}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 4 digits'
      });
    }

    // Verify OTP
    try {
      const verificationResult = await otpService.verifyOTP(email, otp, 'patient_registration');
      
      if (!verificationResult.verified) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }
    } catch (otpError) {
      return res.status(400).json({
        success: false,
        message: otpError.message || 'OTP verification failed'
      });
    }

    // Check again if patient already exists (double-check)
    const existingPatient = await patientService.findExistingPatient(email, mobileNumber);
    if (existingPatient) {
      return res.status(409).json({
        success: false,
        message: 'Patient already registered',
        data: {
          patientNumber: existingPatient.patientNumber,
          firstName: existingPatient.firstName,
          lastName: existingPatient.lastName
        }
      });
    }

    // Generate random password for patient
    const temporaryPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    // Create new patient with password
    const patientData = {
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth || null,
      gender: gender.toLowerCase(),
      email: email.toLowerCase().trim(),
      phone: mobileNumber.trim(),
      passwordHash: passwordHash
    };

    const newPatient = await patientService.createPatient(patientData);

    // Generate JWT token for patient
    const token = generatePatientToken(newPatient);

    // Set HTTP-only cookie for authentication
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction && req.secure, // Ensures secure cookies only over HTTPS in production
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    // Send welcome email with credentials
    try {
      await emailService.sendPatientWelcomeEmail(
        newPatient.email,
        newPatient.firstName,
        newPatient.lastName,
        newPatient.patientNumber,
        temporaryPassword,
        newPatient.mrn
      );
      console.log(`✅ Welcome email sent to patient: ${newPatient.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Continue with registration even if email fails
    }

    // Update last login
    try {
      await patientService.updatePatientLogin(newPatient.id);
    } catch (loginUpdateError) {
      console.error('❌ Failed to update patient login time:', loginUpdateError);
    }

    // Log successful registration
    console.log(`✅ New patient registered: ${newPatient.patientNumber} - ${newPatient.firstName} ${newPatient.lastName}`);

    res.status(201).json({
      success: true,
      message: 'Patient registration completed successfully',
      data: {
        patientNumber: newPatient.patientNumber,
        mrn: newPatient.mrn,
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        email: newPatient.email,
        phone: newPatient.phone,
        createdAt: newPatient.createdAt
      }
    });

  } catch (error) {
    console.error('Error in OTP verification and registration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get patient by patient number
 */
const getPatientByNumber = async (req, res) => {
  try {
    const { patientNumber } = req.params;

    if (!patientNumber) {
      return res.status(400).json({
        success: false,
        message: 'Patient number is required'
      });
    }

    // Convert patientNumber to integer
    const patientNumberInt = parseInt(patientNumber, 10);
    
    // Validate if it's a valid integer
    if (isNaN(patientNumberInt)) {
      return res.status(400).json({
        success: false,
        message: 'Patient number must be a valid integer'
      });
    }

    const patient = await patientService.findPatientByNumber(patientNumberInt);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient found',
      data: patient
    });

  } catch (error) {
    console.error('Error getting patient by number:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get patient statistics
 */
// src/controllers/patientController.js
const getPatientStatistics = async (req, res) => {
  try {
    console.log('🔍 Request for patient statistics from:', {
      userType: req.userType,
      userId: req.user?.id,
      staffType: req.user?.staffType,
      timestamp: new Date().toISOString()
    });

    const statistics = await patientService.getPatientStatistics();

    console.log('✅ Patient statistics retrieved successfully for user:', req.user?.id);

    res.status(200).json({
      success: true,
      message: 'Patient statistics retrieved successfully',
      data: statistics
    });

  } catch (error) {
    console.error('❌ Error getting patient statistics:', {
      error: error.message,
      stack: error.stack,
      user: req.user?.id,
      userType: req.userType
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Resend OTP for patient registration
 */
const resendRegistrationOTP = async (req, res) => {
  try {
    const { email, mobileNumber } = req.body;

    // Validate required fields
    if (!email || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Email and mobile number are required'
      });
    }

    // Check rate limiting (more restrictive for resend)
    const rateLimitCheck = await otpService.checkRateLimit(email, 'patient_registration', 5, 2);
    if (rateLimitCheck.isLimited) {
      return res.status(429).json({
        success: false,
        message: 'Too many resend attempts. Please wait before trying again.',
        resetTime: rateLimitCheck.resetTime
      });
    }

    // Generate new 4-digit OTP for patient registration
    const otpData = await otpService.generatePatientRegistrationOTP(
      email,
      10, // 10 minutes expiry
      req.ip,
      req.get('User-Agent')
    );

    // Send OTP via email with updated template
    try {
      await emailService.sendOTPEmail(
        email, 
        otpData.otp, 
        'Patient Registration - Resend',
        10 // expiry minutes
      );
      console.log(`Registration OTP resent to email: ${email}`);
    } catch (emailError) {
      console.error('Failed to resend OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to resend OTP email. Please try again.'
      });
    }

    // TODO: Implement SMS service for mobile OTP resend
    console.log(`Mobile OTP resend (not implemented): ${otpData.otp} to ${mobileNumber}`);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
      data: {
        email: email,
        mobileNumber: mobileNumber,
        expiresAt: otpData.expiresAt,
        otpId: otpData.id
      }
    });

  } catch (error) {
    console.error('Error resending registration OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get patient profile (authenticated patient only)
 */
const getPatientProfile = async (req, res) => {
  try {
    // Patient info is available from authentication middleware
    const patientId = req.user.id;

    // Get detailed patient information
    const patient = await patientService.findPatientById(patientId);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Return complete patient profile (passwordHash already excluded in service)
    res.status(200).json({
      success: true,
      message: 'Patient profile retrieved successfully',
      data: patient
    });

  } catch (error) {
    console.error('Error getting patient profile:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update patient personal information
 */
const updatePersonalInfo = async (req, res) => {
  try {
    // Patient info is available from authentication middleware
    const patientId = req.user.id;
    const { firstName, lastName, dateOfBirth, gender, bloodGroup } = req.body;

    // Basic validation
    if (!firstName && !lastName && !dateOfBirth && !gender && !bloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    // Validate name fields if provided
    if (firstName && (typeof firstName !== 'string' || firstName.trim().length < 2)) {
      return res.status(400).json({
        success: false,
        message: 'First name must be at least 2 characters long'
      });
    }

    if (lastName && (typeof lastName !== 'string' || lastName.trim().length < 2)) {
      return res.status(400).json({
        success: false,
        message: 'Last name must be at least 2 characters long'
      });
    }

    // Validate date of birth if provided
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const minDate = new Date('1900-01-01');
      
      if (isNaN(birthDate.getTime()) || birthDate > today || birthDate < minDate) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date of birth'
        });
      }
    }

    // Validate gender if provided
    if (gender && !['Male', 'Female', 'Non-binary', 'Prefer not to say'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender value'
      });
    }

    // Validate blood group if provided
    if (bloodGroup && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bloodGroup)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood group'
      });
    }

    // Prepare update data
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender !== undefined) updateData.gender = gender;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;

    // Update patient information using patientService
    const updatedPatient = await patientService.updatePatientPersonalInfo(patientId, updateData);

    if (!updatedPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Personal information updated successfully',
      data: {
        firstName: updatedPatient.firstName,
        lastName: updatedPatient.lastName,
        dateOfBirth: updatedPatient.dateOfBirth,
        gender: updatedPatient.gender,
        bloodGroup: updatedPatient.bloodGroup
      }
    });

  } catch (error) {
    console.error('Error updating personal information:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update patient contact information
 */
const updateContactInfo = async (req, res) => {
  try {
    // Patient info is available from authentication middleware
    const patientId = req.user.id;
    const { phone, email, address, emergencyContacts } = req.body;

    // Basic validation
    if (!phone && !email && !address && !emergencyContacts) {
      return res.status(400).json({
        success: false,
        message: 'At least one field must be provided for update'
      });
    }

    // Note: Phone and email are typically read-only for security reasons
    // If phone or email update is needed, it should go through a separate verification process

    // Validate phone format if provided
    if (phone) {
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }

    // Validate emergency contacts if provided
    if (emergencyContacts && Array.isArray(emergencyContacts)) {
      for (const contact of emergencyContacts) {
        if (contact.phone && !/^[+]?[\d\s\-\(\)]{10,15}$/.test(contact.phone)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid emergency contact phone number format'
          });
        }
      }
    }

    // Prepare update data
    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (emergencyContacts !== undefined) updateData.emergencyContacts = emergencyContacts;

    // Update patient information
    const updatedPatient = await patientService.updatePatientContactInfo(patientId, updateData);

    if (!updatedPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact information updated successfully',
      data: {
        phone: updatedPatient.phone,
        email: updatedPatient.email,
        address: updatedPatient.address,
        emergencyContacts: updatedPatient.emergencyContacts
      }
    });

  } catch (error) {
    console.error('Error updating contact information:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update patient medical history information
 */
const updateMedicalHistory = async (req, res) => {
  try {
    // Patient info is available from authentication middleware
    const patientId = req.user.id;
    const { 
      allergies, 
      chronicConditions, 
      currentMedications,
      previousSurgeries,
      familyHistory, 
      lifestyle,
      bloodGroup,
      eyeHistory,
      visionHistory,
      riskFactors
    } = req.body;

    // Basic validation - at least one field must be provided
    if (!allergies && !chronicConditions && !currentMedications && !previousSurgeries &&
        !familyHistory && !lifestyle && !bloodGroup && !eyeHistory && !visionHistory && !riskFactors) {
      return res.status(400).json({
        success: false,
        message: 'At least one medical history field must be provided for update'
      });
    }

    // Validate allergies format if provided
    if (allergies && Array.isArray(allergies)) {
      for (const allergy of allergies) {
        if (!allergy.name || !allergy.severity) {
          return res.status(400).json({
            success: false,
            message: 'Each allergy must have a name and severity'
          });
        }
        
        const validSeverities = ['mild', 'moderate', 'severe', 'life-threatening'];
        if (!validSeverities.includes(allergy.severity)) {
          return res.status(400).json({
            success: false,
            message: `Invalid allergy severity. Must be one of: ${validSeverities.join(', ')}`
          });
        }
      }
    }

    // Validate chronic conditions format if provided
    if (chronicConditions && !Array.isArray(chronicConditions)) {
      return res.status(400).json({
        success: false,
        message: 'Chronic conditions must be an array'
      });
    }

    // Validate current medications format if provided
    if (currentMedications && Array.isArray(currentMedications)) {
      for (const medication of currentMedications) {
        if (!medication.name || !medication.frequency) {
          return res.status(400).json({
            success: false,
            message: 'Each medication must have a name and frequency'
          });
        }
      }
    }

    // Validate lifestyle format if provided
    if (lifestyle) {
      const validLifestyleFields = ['smoking', 'drinking', 'exercise', 'screenTime', 'eyeStrain'];
      const providedFields = Object.keys(lifestyle);
      
      for (const field of providedFields) {
        if (!validLifestyleFields.includes(field)) {
          return res.status(400).json({
            success: false,
            message: `Invalid lifestyle field: ${field}. Valid fields are: ${validLifestyleFields.join(', ')}`
          });
        }
      }

      // Validate specific lifestyle values
      if (lifestyle.smoking) {
        const validSmokingValues = ['Never', 'Former smoker', 'Occasional', 'Daily'];
        if (!validSmokingValues.includes(lifestyle.smoking)) {
          return res.status(400).json({
            success: false,
            message: `Invalid smoking value. Must be one of: ${validSmokingValues.join(', ')}`
          });
        }
      }

      if (lifestyle.drinking) {
        const validDrinkingValues = ['Never', 'Rarely', 'Socially', 'Moderately', 'Heavily'];
        if (!validDrinkingValues.includes(lifestyle.drinking)) {
          return res.status(400).json({
            success: false,
            message: `Invalid drinking value. Must be one of: ${validDrinkingValues.join(', ')}`
          });
        }
      }

      if (lifestyle.exercise) {
        const validExerciseValues = ['None', 'Light', 'Moderate', 'Heavy'];
        if (!validExerciseValues.includes(lifestyle.exercise)) {
          return res.status(400).json({
            success: false,
            message: `Invalid exercise value. Must be one of: ${validExerciseValues.join(', ')}`
          });
        }
      }

      if (lifestyle.screenTime) {
        const validScreenTimeValues = ['Less than 2 hours', '2-4 hours', '4-6 hours', '6-8 hours', 'More than 8 hours'];
        if (!validScreenTimeValues.includes(lifestyle.screenTime)) {
          return res.status(400).json({
            success: false,
            message: `Invalid screen time value. Must be one of: ${validScreenTimeValues.join(', ')}`
          });
        }
      }
    }

    // Prepare update data
    const updateData = {};
    if (allergies !== undefined) updateData.allergies = allergies;
    if (chronicConditions !== undefined) updateData.chronicConditions = chronicConditions;
    if (currentMedications !== undefined) updateData.currentMedications = currentMedications;
    if (previousSurgeries !== undefined) updateData.previousSurgeries = previousSurgeries;
    if (familyHistory !== undefined) updateData.familyHistory = familyHistory;
    if (lifestyle !== undefined) updateData.lifestyle = lifestyle;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (eyeHistory !== undefined) updateData.eyeHistory = eyeHistory;
    if (visionHistory !== undefined) updateData.visionHistory = visionHistory;
    if (riskFactors !== undefined) updateData.riskFactors = riskFactors;

    // Update patient medical history
    const updatedPatient = await patientService.updatePatientMedicalHistory(patientId, updateData);

    if (!updatedPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medical history updated successfully',
      data: {
        allergies: updatedPatient.allergies,
        chronicConditions: updatedPatient.chronicConditions,
        currentMedications: updatedPatient.currentMedications,
        previousSurgeries: updatedPatient.previousSurgeries,
        familyHistory: updatedPatient.familyHistory,
        lifestyle: updatedPatient.lifestyle,
        bloodGroup: updatedPatient.bloodGroup,
        eyeHistory: updatedPatient.eyeHistory,
        visionHistory: updatedPatient.visionHistory,
        riskFactors: updatedPatient.riskFactors
      }
    });

  } catch (error) {
    console.error('Error updating medical history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update patient profile photo
 */
const updateProfilePhoto = async (req, res) => {
  try {
    // Patient info is available from authentication middleware
    const patientId = req.user.id;
    const { profilePhoto } = req.body;

    // Validate required field
    if (!profilePhoto) {
      return res.status(400).json({
        success: false,
        message: 'Profile photo is required'
      });
    }

    // Validate base64 format
    if (!profilePhoto.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Only base64 encoded images are allowed.'
      });
    }

    // Check file size (limit to 5MB base64 string - roughly 3.75MB actual image)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (profilePhoto.length > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'Image size too large. Maximum size allowed is 5MB.'
      });
    }

    // Validate image type
    const allowedTypes = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/gif', 'data:image/webp'];
    const isValidType = allowedTypes.some(type => profilePhoto.startsWith(type));
    
    if (!isValidType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image type. Allowed types: JPEG, PNG, GIF, WebP'
      });
    }

    // Update patient profile photo
    const updatedPatient = await patientService.updatePatientProfilePhoto(patientId, profilePhoto);

    if (!updatedPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile photo updated successfully',
      data: {
        profilePhoto: updatedPatient.profilePhoto,
        updatedAt: updatedPatient.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating profile photo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Register patient by staff member
 */
const registerPatientByStaff = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      emergencyPhone,
      allergies
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !phone || !dateOfBirth || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: firstName, lastName, phone, dateOfBirth, and gender are required'
      });
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    }

    // Check if patient already exists (by phone or email)
    const existingPatientByPhone = await patientService.findPatientByPhone(phone);
    if (existingPatientByPhone) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this phone number already exists'
      });
    }

    if (email) {
      const existingPatientByEmail = await patientService.findPatientByEmail(email);
      if (existingPatientByEmail) {
        return res.status(400).json({
          success: false,
          message: 'Patient with this email already exists'
        });
      }
    }

    // Generate a default password for staff-registered patients
    const defaultPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    // Prepare patient data with optional fields
    const patientData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email ? email.toLowerCase().trim() : null,
      dateOfBirth: new Date(dateOfBirth),
      gender: gender.toLowerCase(),
      passwordHash,
      // Optional fields - only include if provided
      ...(address && { address: address.trim() }),
      ...(emergencyContact && { emergencyContact: emergencyContact.trim() }),
      ...(emergencyPhone && { emergencyPhone: emergencyPhone.trim() }),
      ...(allergies && { allergies: allergies.trim() })
    };

    // Create patient
    const newPatient = await patientService.createPatientByStaff(patientData);

    // Get staff info for logging
    const staffInfo = req.user;
    console.log(`Patient ${newPatient.patientNumber} registered by staff member ${staffInfo.employeeId} (${staffInfo.firstName} ${staffInfo.lastName})`);

    // Return success response with patient details and temporary password
    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        patient: {
          id: newPatient.id,
          patientNumber: newPatient.patientNumber,
          mrn: newPatient.mrn,
          firstName: newPatient.firstName,
          lastName: newPatient.lastName,
          phone: newPatient.phone,
          email: newPatient.email,
          dateOfBirth: newPatient.dateOfBirth,
          gender: newPatient.gender,
          patientStatus: newPatient.patientStatus,
          createdAt: newPatient.createdAt
        },
        temporaryPassword: defaultPassword,
        registeredBy: {
          employeeId: staffInfo.employeeId,
          name: `${staffInfo.firstName} ${staffInfo.lastName}`,
          staffType: staffInfo.staffType
        }
      }
    });

  } catch (error) {
    console.error('Error registering patient by staff:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Patient login - authenticate with email/phone and password
 */
const loginPatient = async (req, res) => {
  try {
    const { contactMethod, email, phone, password } = req.body;
   // console.log(`Login attempt: ${contactMethod === 'email' ? email : phone}`);
    // Validate required fields
    if (!contactMethod || !password) {
      return res.status(400).json({
        success: false,
        message: 'Contact method and password are required'
      });
    }

    // Validate contact method
    if (!['email', 'phone'].includes(contactMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Contact method must be either email or phone'
      });
    }

    // Validate specific contact information
    if (contactMethod === 'email') {
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required when using email login'
        });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
    } else if (contactMethod === 'phone') {
      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required when using phone login'
        });
      }
      
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }
    }

    // Find patient by contact method
    let patient;
    if (contactMethod === 'email') {
      patient = await patientService.findPatientByEmail(email.toLowerCase().trim());
    } else {
      patient = await patientService.findPatientByPhone(phone.trim());
    }
    
    if (!patient) {
      return res.status(401).json({
        success: false,
        message: `Invalid ${contactMethod} or password`
      });
    }

    // Check if patient is active
    if (patient.patientStatus !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Patient account is not active. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, patient.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: `Invalid ${contactMethod} or password`
      });
    }

    // Generate JWT token for patient
    const token = generatePatientToken(patient);

    // Set HTTP-only cookie for authentication
    res.cookie('authToken', token, {
      httpOnly: true,                    // Prevents XSS attacks
      secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
      sameSite: 'lax',               // CSRF protection
      maxAge: 24 * 60 * 60 * 1000,     // 24 hours
      path: '/'
    });

    // Update last login
    try {
      await patientService.updatePatientLogin(patient.id);
    } catch (loginUpdateError) {
      console.error('❌ Failed to update patient login time:', loginUpdateError);
    }

    // Log successful login
    console.log(`✅ Patient logged in: ${patient.patientNumber} - ${patient.firstName} ${patient.lastName}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        patientNumber: patient.patientNumber,
        mrn: patient.mrn,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        lastLogin: new Date()
      }
    });

  } catch (error) {
    console.error('Error during patient login:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Patient logout - clear authentication cookie
 */
const logoutPatient = async (req, res) => {
  try {
    // Clear the authentication cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: isProduction && req.secure,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/'
    });

    // Log successful logout (if patient info is available from middleware)
    if (req.user && req.user.userType === 'patient') {
      console.log(`✅ Patient logged out: ${req.user.patientNumber || req.user.email}`);
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Error during patient logout:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Send OTP for patient login
 */
const sendLoginOTP = async (req, res) => {
  try {
    const { contactMethod, email, phone } = req.body;

    // Validate required fields
    if (!contactMethod || (contactMethod !== 'email' && contactMethod !== 'phone')) {
      return res.status(400).json({
        success: false,
        message: 'Valid contact method (email or phone) is required'
      });
    }

    if (contactMethod === 'email' && !email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for email-based login'
      });
    }

    if (contactMethod === 'phone' && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for phone-based login'
      });
    }

    // Find patient by contact method
    let patient;
    if (contactMethod === 'email') {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }
      patient = await patientService.findPatientByEmail(email.toLowerCase().trim());
    } else {
      // Validate phone format
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format'
        });
      }
      patient = await patientService.findPatientByPhone(phone.trim());
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'No patient found with this contact information'
      });
    }

    // Check if patient is active
    if (patient.patientStatus !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Patient account is not active. Please contact support.'
      });
    }

    // Generate and send OTP
    const contactValue = contactMethod === 'email' ? patient.email : patient.phone;
    
    try {
      // Generate 4-digit OTP for patient login
      const otpData = await otpService.generateAndStoreOTP(
        contactValue, 
        'patient_login',
        10, // 10 minutes expiry
        req.ip,
        req.get('User-Agent'),
        4 // 4-digit OTP for login
      );
      
      // Send OTP via email (we'll use email for both email and phone for now)
      await emailService.sendOTPEmail(
        patient.email,
        otpData.otp,
        'Patient Login',
        10,
        patient.firstName
      );

      console.log(`✅ Login OTP sent to patient: ${patient.patientNumber} via ${contactMethod}`);

      res.status(200).json({
        success: true,
        message: `OTP sent successfully to your ${contactMethod}`,
        data: {
          contactMethod,
          maskedContact: contactMethod === 'email' 
            ? patient.email.replace(/(.{2}).*@/, '$1***@')
            : patient.phone.replace(/(\d{2}).*(\d{4})/, '$1***$2')
        }
      });

    } catch (otpError) {
      console.error('Error sending login OTP:', otpError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }

  } catch (error) {
    console.error('Error in sendLoginOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Verify OTP and login patient
 */
const verifyLoginOTP = async (req, res) => {
  try {
    const { otp, email, mobileNumber } = req.body;

    // Validate required fields
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    if (!email && !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile number is required'
      });
    }

    // Validate OTP format (4 digits)
    if (!/^\d{4}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 4 digits'
      });
    }

    // Find patient
    let patient;
    let contactValue;
    
    if (email) {
      patient = await patientService.findPatientByEmail(email.toLowerCase().trim());
      contactValue = email.toLowerCase().trim();
    } else {
      patient = await patientService.findPatientByPhone(mobileNumber.trim());
      contactValue = mobileNumber.trim();
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if patient is active
    if (patient.patientStatus !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Patient account is not active. Please contact support.'
      });
    }

    // Verify OTP
    try {
      const verificationResult = await otpService.verifyOTP(contactValue, otp, 'patient_login');
      
      if (!verificationResult.verified) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }
    } catch (otpError) {
      return res.status(400).json({
        success: false,
        message: otpError.message || 'OTP verification failed'
      });
    }

    // Generate JWT token for patient
    const token = generatePatientToken(patient);

    // Set HTTP-only cookie for authentication
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction && req.secure, // Ensures secure cookies only over HTTPS in production
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    // Update last login
    try {
      await patientService.updatePatientLogin(patient.id);
    } catch (loginUpdateError) {
      console.error('❌ Failed to update patient login time:', loginUpdateError);
    }

    // Log successful login
    console.log(`✅ Patient logged in via OTP: ${patient.patientNumber} - ${patient.firstName} ${patient.lastName}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        patientNumber: patient.patientNumber,
        mrn: patient.mrn,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        lastLogin: new Date()
      }
    });

  } catch (error) {
    console.error('Error during login OTP verification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Resend OTP for patient login
 */
const resendLoginOTP = async (req, res) => {
  try {
    const { email, mobileNumber } = req.body;

    // Validate required fields
    if (!email && !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile number is required'
      });
    }

    // Find patient
    let patient;
    let contactValue;
    
    if (email) {
      patient = await patientService.findPatientByEmail(email.toLowerCase().trim());
      contactValue = email.toLowerCase().trim();
    } else {
      patient = await patientService.findPatientByPhone(mobileNumber.trim());
      contactValue = mobileNumber.trim();
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if patient is active
    if (patient.patientStatus !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Patient account is not active. Please contact support.'
      });
    }

    // Generate and send new OTP
    try {
      // Generate 4-digit OTP for patient login
      const otpData = await otpService.generateAndStoreOTP(
        contactValue, 
        'patient_login',
        10, // 10 minutes expiry
        req.ip,
        req.get('User-Agent'),
        4 // 4-digit OTP for login
      );
      
      // Send OTP via email
      await emailService.sendOTPEmail(
        patient.email,
        otpData.otp,
        'Patient Login',
        10,
        patient.firstName
      );

      console.log(`✅ Login OTP resent to patient: ${patient.patientNumber}`);

      res.status(200).json({
        success: true,
        message: 'OTP resent successfully',
        data: {
          maskedContact: email 
            ? patient.email.replace(/(.{2}).*@/, '$1***@')
            : patient.phone.replace(/(\d{2}).*(\d{4})/, '$1***$2')
        }
      });

    } catch (otpError) {
      console.error('Error resending login OTP:', otpError);
      return res.status(500).json({
        success: false,
        message: 'Failed to resend OTP. Please try again.'
      });
    }

  } catch (error) {
    console.error('Error in resendLoginOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get list of doctors available for appointments
 */
const getDoctorsList = async (req, res) => {
  try {
    const { department, specialization } = req.query;

    // Get doctors from patient service
    const doctors = await patientService.getDoctorsList(department, specialization);

    res.status(200).json({
      success: true,
      message: 'Doctors list retrieved successfully',
      data: doctors
    });

  } catch (error) {
    console.error('Error getting doctors list:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Book appointment for patient
 */
const bookAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      appointmentType,
      purpose,
      notes,
      estimatedDuration
    } = req.body;

    console.log('🎯 Received appointment booking request:', {
      doctorId,
      appointmentDate,
      appointmentTime,
      doctorIdType: typeof doctorId,
      doctorIdLength: doctorId?.length
    });

    // Validate required fields
    if (!doctorId || !appointmentDate || !appointmentTime) {
      console.log('❌ Missing required fields:', { doctorId, appointmentDate, appointmentTime });
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, appointment date, and time are required'
      });
    }

    // Validate doctorId format (should be a valid CUID)
    if (typeof doctorId !== 'string' || doctorId.trim().length === 0) {
      console.log('❌ Invalid doctor ID format:', { doctorId, type: typeof doctorId });
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID format'
      });
    }

    // Validate appointment time format (should be like "09:30 AM")
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    if (!timeRegex.test(appointmentTime.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment time format. Use format like "09:30 AM"'
      });
    }

    // Get patient info from authenticated token
    const patientId = req.user.id;
    const patientNumber = req.user.patientNumber;

    // Validate appointment date (cannot be in the past)
    const selectedDate = new Date(appointmentDate);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset to start of day for date comparison

    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date format'
      });
    }

    if (selectedDate < currentDate) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be in the past'
      });
    }

    // Validate appointment date is not too far in the future (e.g., max 90 days)
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + 90);
    if (selectedDate > maxFutureDate) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be more than 90 days in the future'
      });
    }

    // Verify doctor exists and is active
    try {
      console.log('🔍 Looking for doctor with ID:', doctorId);
      const doctor = await patientService.findStaffById(doctorId);
      console.log('🔍 Doctor lookup result:', doctor ? 'Found' : 'Not found');
      
      if (!doctor) {
        console.log('❌ Doctor not found in database with ID:', doctorId);
        return res.status(404).json({
          success: false,
          message: `Doctor not found with ID: ${doctorId}`
        });
      }

      console.log('✅ Doctor found:', {
        id: doctor.id,
        name: `${doctor.firstName} ${doctor.lastName}`,
        staffType: doctor.staffType,
        isActive: doctor.isActive,
        employmentStatus: doctor.employmentStatus
      });

      if (!doctor.isActive || doctor.employmentStatus !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Selected doctor is not available for appointments'
        });
      }

      if (doctor.staffType !== 'doctor') {
        return res.status(400).json({
          success: false,
          message: 'Selected staff member is not a doctor'
        });
      }
    } catch (doctorCheckError) {
      console.error('Error verifying doctor:', doctorCheckError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify doctor availability'
      });
    }

    // Check for duplicate appointments (same patient, same doctor, same date)
    try {
      const existingAppointment = await patientService.findExistingAppointment(
        patientId, 
        doctorId, 
        selectedDate
      );
      
      if (existingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'You already have an appointment with this doctor on the selected date'
        });
      }
    } catch (duplicateCheckError) {
      console.error('Error checking duplicate appointments:', duplicateCheckError);
      // Continue with booking - don't fail for duplicate check error
    }

    // Prepare appointment data
    const appointmentData = {
      appointmentDate: selectedDate,
      appointmentTime,
      appointmentType: appointmentType || 'routine',
      purpose: purpose || 'General Consultation',
      notes: notes || `Appointment booked by patient ${patientNumber}`,
      estimatedDuration: estimatedDuration || 30,
      doctorId // Add doctor ID for future reference
    };

    // Create appointment using existing PatientService method
    const appointment = await patientService.createAppointmentForPatient(patientId, appointmentData);

    // Get patient details for email
    const patient = await patientService.findPatientById(patientId);
    
    // Send confirmation email if patient has email
    if (patient && patient.email) {
      try {
        // You can create a specific appointment confirmation email template
        console.log(`✅ Appointment confirmation email should be sent to ${patient.email}`);
        // await emailService.sendAppointmentConfirmationEmail(patient.email, patient, appointment);
      } catch (emailError) {
        console.error('❌ Failed to send appointment confirmation email:', emailError);
        // Don't fail the appointment creation if email fails
      }
    }

    console.log(`✅ Appointment booked by patient ${patientNumber} with token ${appointment.tokenNumber}`);

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointment: {
          id: appointment.id,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          tokenNumber: appointment.tokenNumber,
          status: appointment.status,
          appointmentType: appointment.appointmentType,
          purpose: appointment.purpose,
          estimatedDuration: appointment.estimatedDuration,
          createdAt: appointment.createdAt
        },
        patient: {
          patientNumber: patient.patientNumber,
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone,
          email: patient.email
        }
      }
    });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while booking appointment'
    });
  }
};

/**
 * Update appointment with QR code
 */
const updateAppointmentQR = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { qrCode } = req.body;

    console.log('🔄 QR Code update request:', {
      appointmentId,
      patientId: req.user?.id,
      patientNumber: req.user?.patientNumber,
      qrCodeLength: qrCode?.length,
      qrCodePrefix: qrCode?.substring(0, 50) + '...'
    });

    // Validate required fields
    if (!appointmentId || !qrCode) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID and QR code are required'
      });
    }

    // Validate QR code is base64
    if (!qrCode.startsWith('data:image/png;base64,')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format. Expected base64 PNG image.'
      });
    }

    // Get patient info from authenticated token
    const patientId = req.user.id;

    // Verify the appointment belongs to the authenticated patient
    let appointment;
    try {
      appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { 
          id: true,
          patientId: true,
          appointmentDate: true,
          appointmentTime: true,
          status: true
        }
      });
      
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }
      
      if (appointment.patientId !== patientId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This appointment does not belong to you.'
        });
      }
    } catch (findError) {
      console.error('Error finding appointment:', findError);
      return res.status(500).json({
        success: false,
        message: 'Error verifying appointment'
      });
    }

    // Update appointment with QR code
    let updatedAppointment;
    try {
      updatedAppointment = await patientService.updateAppointmentQRCode(appointmentId, qrCode);
      console.log(`✅ QR code updated for appointment ${appointmentId} by patient ${req.user.patientNumber}`);
    } catch (updateError) {
      console.error('❌ Error updating QR code:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update appointment with QR code'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment QR code updated successfully',
      data: {
        appointmentId: updatedAppointment.id,
        tokenNumber: updatedAppointment.tokenNumber,
        qrCodeSaved: true
      }
    });

  } catch (error) {
    console.error('Error updating appointment QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating QR code'
    });
  }
};

/**
 * Check in patient by token number
 */
// src/controllers/patientController.js
const checkInPatient = async (req, res) => {
  try {
    const { tokenNumber, priorityLabel } = req.body;

    console.log('🎯 Patient check-in request:', {
      tokenNumber,
      priorityLabel,
      requestTime: new Date().toISOString()
    });

    // Validate required fields
    if (!tokenNumber) {
      return res.status(400).json({
        success: false,
        message: 'Token number is required'
      });
    }

    // Validate token format (4 digits)
    if (!/^\d{4}$/.test(tokenNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format. Token must be 4 digits.'
      });
    }

    // Validate priority label if provided
    const validPriorityLabels = [
      'PRIORITY', 'EMERGENCY', 'CHILDREN', 'SENIORS', 
      'LONGWAIT', 'REFERRAL', 'FOLLOWUP', 'ROUTINE', 'PREPOSTOP'
    ];
    
    // Normalize priorityLabel to uppercase to match enum values
    let priority = priorityLabel || 'ROUTINE';
    if (typeof priority === 'string') {
      priority = priority.toUpperCase();
    }
    
    if (!validPriorityLabels.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority label. Must be one of: ${validPriorityLabels.join(', ')}`
      });
    }

    // Process check-in
    const result = await patientService.checkInPatientByToken(tokenNumber, priority);

    console.log(`✅ Check-in successful for token ${tokenNumber}`);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        appointment: {
          id: result.appointment.id,
          tokenNumber: result.appointment.tokenNumber,
          appointmentDate: result.appointment.appointmentDate,
          appointmentTime: result.appointment.appointmentTime,
          status: result.appointment.status,
          patient: result.appointment.patient
        },
        patientVisit: {
          id: result.patientVisit.id,
          visitNumber: result.patientVisit.visitNumber,
          visitType: result.patientVisit.visitType,
          status: result.patientVisit.status,
          checkedInAt: result.patientVisit.checkedInAt
        },
        queueInfo: result.queueInfo,
        alreadyCheckedIn: result.alreadyCheckedIn
      }
    });

  } catch (error) {
    console.error('❌ Error during patient check-in:', error);
    
    // Determine appropriate status code based on error message
    let statusCode = 400; // Default bad request
    
    if (error.message.includes('not found') || error.message.includes('Invalid token')) {
      statusCode = 404; // Not found
    } else if (error.message.includes('already checked in') || error.message.includes('already exists')) {
      statusCode = 409; // Conflict
    } else if (error.message.includes('not scheduled for today')) {
      statusCode = 400; // Bad request
    } else if (error.message.includes('contact support')) {
      statusCode = 500; // Internal server error
    }
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Check-in failed',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


/**
 * Get queue status for specific queue type
 */
const getQueueStatus = async (req, res) => {
  try {
    const { queueFor } = req.params;

    // Validate queue type
    const validQueueTypes = [
      'OPTOMETRIST', 'OPHTHALMOLOGIST', 'DIAGNOSTICS', 
      'SURGERY', 'BILLING', 'PHARMACY'
    ];

    if (!validQueueTypes.includes(queueFor)) {
      return res.status(400).json({
        success: false,
        message: `Invalid queue type. Must be one of: ${validQueueTypes.join(', ')}`
      });
    }

    const queueStatus = await patientService.getQueueStatus(queueFor);

    res.status(200).json({
      success: true,
      message: 'Queue status retrieved successfully',
      data: queueStatus
    });

  } catch (error) {
    console.error('❌ Error getting queue status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue status'
    });
  }
};

/**
 * Get appointment details by token number
 */
const getAppointmentByToken = async (req, res) => {
  try {
    const { tokenNumber } = req.params;

    // Validate token format
    if (!/^\d{4}$/.test(tokenNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format. Token must be 4 digits.'
      });
    }

    const appointment = await patientService.findAppointmentByToken(tokenNumber);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found with this token number'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment found',
      data: {
        appointment: {
          id: appointment.id,
          tokenNumber: appointment.tokenNumber,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          status: appointment.status,
          appointmentType: appointment.appointmentType,
          purpose: appointment.purpose
        },
        patient: appointment.patient,
        doctor: appointment.doctor,
        visit: appointment.patientVisit ? {
          id: appointment.patientVisit.id,
          visitNumber: appointment.patientVisit.visitNumber,
          status: appointment.patientVisit.status,
          checkedInAt: appointment.patientVisit.checkedInAt
        } : null,
        queueInfo: appointment.patientVisit?.patientQueue?.[0] || null
      }
    });

  } catch (error) {
    console.error('❌ Error getting appointment by token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointment details'
    });
  }
};

/**
 * Get all appointments for authenticated patient
 */
const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;

    console.log('🔍 Patient requesting appointments:', {
      patientId,
      patientNumber: req.user.patientNumber,
      requestTime: new Date().toISOString()
    });

    const appointmentsData = await patientService.getPatientAppointments(patientId);

    res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: {
        patient: {
          id: req.user.id,
          patientNumber: req.user.patientNumber,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        },
        appointments: appointmentsData
      }
    });

  } catch (error) {
    console.error('❌ Error getting patient appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments'
    });
  }
};

/**
 * Get patient medical records with examination data
 */
const getPatientMedicalRecords = async (req, res) => {
  try {
    const patientId = req.user.id;
    const records = await patientService.getPatientMedicalRecords(patientId);

    res.status(200).json({
      success: true,
      message: 'Medical records retrieved successfully',
      data: records
    });
  } catch (error) {
    console.error('❌ Error getting medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get medical records'
    });
  }
};

/**
 * Get all prescriptions for the logged-in patient
 */
const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.user.id;
    const prescriptions = await patientService.getPatientPrescriptions(patientId);

    res.status(200).json({
      success: true,
      message: 'Prescriptions retrieved successfully',
      data: prescriptions
    });
  } catch (error) {
    console.error('❌ Error getting patient prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get prescriptions'
    });
  }
};

/**
 * Get all family members referred by current patient
 */
const getFamilyMembers = async (req, res) => {
  try {
    const referringPatientId = req.user.id;
    console.log(`👥 Getting family members for patient: ${referringPatientId}`);

    const familyMembers = await patientService.getFamilyMembersReferredBy(referringPatientId);

    res.status(200).json({
      success: true,
      message: `Found ${familyMembers.length} family members`,
      data: {
        referringPatient: {
          id: req.user.id,
          patientNumber: req.user.patientNumber,
          name: `${req.user.firstName} ${req.user.lastName}`
        },
        familyMembers: familyMembers,
        totalCount: familyMembers.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting family members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get family members'
    });
  }
};

/**
 * Switch to family member account from referring patient dashboard
 */
const switchToFamilyMember = async (req, res) => {
  try {
    const referringPatientId = req.user.id;
    const { familyMemberPatientId } = req.params;

    console.log(`🔄 Patient ${referringPatientId} switching to family member ${familyMemberPatientId}`);

    // Validate that familyMemberPatientId was provided
    if (!familyMemberPatientId) {
      return res.status(400).json({
        success: false,
        message: 'Family member patient ID is required'
      });
    }

    const familyMemberData = await patientService.switchToFamilyMemberAccount(
      referringPatientId, 
      familyMemberPatientId
    );

    // Generate JWT token for family member
    const token = jwt.sign(
      {
        id: familyMemberData.id,
        patientNumber: familyMemberData.patientNumber,
        email: familyMemberData.email,
        phone: familyMemberData.phone,
        firstName: familyMemberData.firstName,
        lastName: familyMemberData.lastName,
        userType: 'patient',
        switchedFrom: referringPatientId // Track original patient
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set JWT token as httpOnly cookie (matching auth middleware expectation)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction && req.secure, // Ensures secure cookies only over HTTPS in production
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    res.status(200).json({
      success: true,
      message: `Successfully switched to ${familyMemberData.firstName} ${familyMemberData.lastName}'s account`,
      data: {
        patient: {
          id: familyMemberData.id,
          patientNumber: familyMemberData.patientNumber,
          mrn: familyMemberData.mrn,
          firstName: familyMemberData.firstName,
          lastName: familyMemberData.lastName,
          fullName: familyMemberData.fullName,
          phone: familyMemberData.phone,
          email: familyMemberData.email,
          dateOfBirth: familyMemberData.dateOfBirth,
          gender: familyMemberData.gender,
          address: familyMemberData.address,
          emergencyContacts: familyMemberData.emergencyContacts,
          allergies: familyMemberData.allergies,
          patientStatus: familyMemberData.patientStatus,
          isReferred: familyMemberData.isReferred,
          lastLogin: familyMemberData.lastLogin,
          createdAt: familyMemberData.createdAt
        },
        referralInfo: {
          referredBy: familyMemberData.referrer,
          switchedFrom: familyMemberData.switchedFrom
        },
        token: {
          expiresIn: '24h',
          issuedAt: new Date()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error switching to family member account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to switch to family member account'
    });
  }
};

/**
 * Get family members for the currently logged-in patient
 * Logic:
 * - If current patient has referredBy (is a family member): Show all patients in the same family group
 * - If current patient doesn't have referredBy (is main account): Show all patients they referred
 */
const getCurrentPatientFamilyMembers = async (req, res) => {
  try {
    const currentPatientId = req.user.id;
    const currentPatientNumber = req.user.patientNumber;

    console.log(`🔍 Getting family members for current patient: ${currentPatientNumber} (ID: ${currentPatientId})`);

    // Get the current patient's full details to check referredBy
    const currentPatient = await prisma.patient.findUnique({
      where: { id: currentPatientId },
      select: {
        id: true,
        patientNumber: true,
        firstName: true,
        lastName: true,
        referredBy: true,
        isReferred: true
      }
    });

    if (!currentPatient) {
      return res.status(404).json({
        success: false,
        message: 'Current patient not found'
      });
    }

    let familyMembers = [];

    if (currentPatient.referredBy) {
      // Current patient is a family member - get all patients in the same family group
      console.log(`🏠 Current patient is a family member (referredBy: ${currentPatient.referredBy})`);
      
        // Get the main account (who referred this patient)
        const mainAccount = await prisma.patient.findFirst({
          where: { id: currentPatient.referredBy },
          select: {
            id: true,
            patientNumber: true,
            mrn: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            dateOfBirth: true,
            gender: true,
            lastLogin: true,
            createdAt: true
          }
        });

        // Get all other family members (patients referred by the same main account)
        const otherFamilyMembers = await prisma.patient.findMany({
        where: {
          referredBy: currentPatient.referredBy,
          id: { not: currentPatientId } // Exclude current patient
        },
        select: {
          id: true,
          patientNumber: true,
          mrn: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          dateOfBirth: true,
          gender: true,
          lastLogin: true,
          createdAt: true
        }
      });

      // Create current patient object in the same format
      const currentPatientForList = {
        id: currentPatient.id,
        patientNumber: currentPatient.patientNumber,
        mrn: null, // We'd need to fetch this if required
        firstName: currentPatient.firstName,
        lastName: currentPatient.lastName,
        fullName: `${currentPatient.firstName} ${currentPatient.lastName}`,
        phone: null, // We'd need to fetch this if required
        email: null, // We'd need to fetch this if required
        dateOfBirth: null,
        gender: null,
        hasLoggedIn: true, // Assuming they're logged in since they made this request
        lastLogin: new Date(),
        createdAt: null
      };

      // Combine main account, current patient, and other family members
      // Add fullName computed field to all members
      const mainAccountWithFullName = mainAccount ? {
        ...mainAccount,
        fullName: `${mainAccount.firstName} ${mainAccount.lastName}`,
        hasLoggedIn: !!mainAccount.lastLogin
      } : null;

      const otherFamilyMembersWithFullName = otherFamilyMembers.map(member => ({
        ...member,
        fullName: `${member.firstName} ${member.lastName}`,
        hasLoggedIn: !!member.lastLogin
      }));

      familyMembers = [
        ...(mainAccountWithFullName ? [mainAccountWithFullName] : []),
        currentPatientForList,
        ...otherFamilyMembersWithFullName
      ];

      console.log(`✅ Found ${familyMembers.length} family members in the same group (including current patient)`);
    } else {
      // Current patient is the main account - get patients they referred (existing behavior)
      console.log(`👑 Current patient is the main account - getting referred patients`);
      const referredPatients = await patientService.getFamilyMembersReferredBy(currentPatientId);
      
      // Create current patient object in the same format for consistency
      const currentPatientForList = {
        id: currentPatient.id,
        patientNumber: currentPatient.patientNumber,
        mrn: null,
        firstName: currentPatient.firstName,
        lastName: currentPatient.lastName,
        fullName: `${currentPatient.firstName} ${currentPatient.lastName}`,
        phone: null,
        email: null,
        dateOfBirth: null,
        gender: null,
        hasLoggedIn: true,
        lastLogin: new Date(),
        createdAt: null
      };

      // Include current patient in the list
      familyMembers = [currentPatientForList, ...referredPatients];
      console.log(`✅ Found ${familyMembers.length} total family members (including main account)`);
    }

    res.status(200).json({
      success: true,
      message: 'Family members retrieved successfully',
      data: {
        currentPatient: {
          id: currentPatientId,
          patientNumber: currentPatientNumber,
          firstName: currentPatient.firstName,
          lastName: currentPatient.lastName,
          isMainAccount: !currentPatient.referredBy
        },
        familyMembers: familyMembers.map(member => ({
          ...member,
          isCurrentPatient: member.id === currentPatientId // Flag to identify current patient
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error getting current patient family members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get family members for current patient'
    });
  }
};

/**
 * Get patient's medical visit history
 * Returns all completed visits with examinations, diagnoses, and prescriptions
 */
const getPatientVisitHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    console.log('📋 Fetching visit history for patient:', patientId);

    // Helper function to safely parse JSON strings
    const safeJsonParse = (jsonString) => {
      if (!jsonString) return null;
      if (typeof jsonString === 'object') return jsonString;
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        return null;
      }
    };

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        patientNumber: true
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Fetch all completed visits with related data
    const visits = await prisma.patientVisit.findMany({
      where: {
        patientId: patientId,
        status: 'COMPLETED'
      },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffType: true,
            doctorProfile: true
          }
        },
        optometristExamination: {
          include: {
            optometrist: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true
              }
            }
          }
        },
        ophthalmologistExaminations: {
          include: {
            doctor: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true,
                doctorProfile: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        diagnoses: {
          include: {
            disease: {
              select: {
                diseaseName: true,
                ophthalmologyCategory: true,
                affectedStructure: true
              }
            },
            doctor: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        prescriptions: {
          include: {
            prescriptionItems: {
              include: {
                medicine: {
                  select: {
                    name: true,
                    code: true,
                    dosage: true,
                    information: true
                  }
                }
              }
            },
            doctor: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            prescriptionDate: 'desc'
          }
        },
        bills: {
          select: {
            id: true,
            billNumber: true,
            totalAmount: true,
            paidAmount: true,
            status: true,
            billDate: true
          }
        }
      },
      orderBy: {
        visitDate: 'desc'
      }
    });

    // If no visits found
    if (!visits || visits.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No prior medical history found',
        data: {
          patient: {
            id: patient.id,
            name: `${patient.firstName} ${patient.lastName}`,
            patientNumber: patient.patientNumber
          },
          visits: [],
          totalVisits: 0
        }
      });
    }

    // Format the visit history data
    const formattedVisits = visits.map(visit => ({
      visitId: visit.id,
      visitNumber: visit.visitNumber,
      visitDate: visit.visitDate,
      visitType: visit.visitType,
      status: visit.status,
      chiefComplaint: visit.chiefComplaint,
      presentingSymptoms: visit.presentingSymptoms,
      visionComplaints: visit.visionComplaints,
      visitOutcome: visit.visitOutcome,
      completedAt: visit.completedAt,
      
      // Doctor information
      doctor: visit.doctor ? {
        name: `${visit.doctor.firstName} ${visit.doctor.lastName}`,
        staffType: visit.doctor.staffType,
        specialization: visit.doctor.doctorProfile?.specialization || null
      } : null,

      // Optometrist examination - Full details
      optometristExamination: visit.optometristExamination ? {
        id: visit.optometristExamination.id,
        
        // Visual Acuity
        visualAcuity: {
          ucvaOD: visit.optometristExamination.ucvaOD || null,
          ucvaOS: visit.optometristExamination.ucvaOS || null,
          bcvaOD: visit.optometristExamination.bcvaOD || null,
          bcvaOS: visit.optometristExamination.bcvaOS || null,
          ...(visit.optometristExamination.visualAcuity && { additional: safeJsonParse(visit.optometristExamination.visualAcuity) })
        },
        
        // Refraction
        refraction: {
          rightEye: {
            sphere: visit.optometristExamination.refractionSphereOD || null,
            cylinder: visit.optometristExamination.refractionCylinderOD || null,
            axis: visit.optometristExamination.refractionAxisOD || null
          },
          leftEye: {
            sphere: visit.optometristExamination.refractionSphereOS || null,
            cylinder: visit.optometristExamination.refractionCylinderOS || null,
            axis: visit.optometristExamination.refractionAxisOS || null
          },
          ...(visit.optometristExamination.refraction && { additional: safeJsonParse(visit.optometristExamination.refraction) })
        },
        
        // IOP (Intraocular Pressure)
        iop: {
          iopOD: visit.optometristExamination.iopOD || null,
          iopOS: visit.optometristExamination.iopOS || null,
          iopMethod: visit.optometristExamination.iopMethod || null,
          ...(visit.optometristExamination.tonometry && { additional: safeJsonParse(visit.optometristExamination.tonometry) })
        },
        
        // Other Tests
        colorVision: visit.optometristExamination.colorVision || null,
        pupilReaction: visit.optometristExamination.pupilReaction || null,
        eyeAlignment: visit.optometristExamination.eyeAlignment || null,
        anteriorSegment: safeJsonParse(visit.optometristExamination.anteriorSegment),
        
        // Clinical Details
        preliminaryDiagnosis: visit.optometristExamination.preliminaryDiagnosis || null,
        urgencyLevel: visit.optometristExamination.urgencyLevel || null,
        additionalNotes: visit.optometristExamination.additionalNotes || null,
        clinicalNotes: visit.optometristExamination.clinicalNotes || null,
        clinicalDetails: safeJsonParse(visit.optometristExamination.clinicalDetails),
        
        // Additional Tests
        additionalTests: safeJsonParse(visit.optometristExamination.additionalTests),
        additionalOrders: safeJsonParse(visit.optometristExamination.additionalOrders) || [],
        requiresDilation: visit.optometristExamination.requiresDilation || false,
        proceedToDoctor: visit.optometristExamination.proceedToDoctor !== false,
        
        // Known Allergies
        knownAllergies: safeJsonParse(visit.optometristExamination.knownAllergies) || [],
        
        // Timestamps
        completedAt: visit.optometristExamination.completedAt,
        createdAt: visit.optometristExamination.createdAt,
        
        // Optometrist Info
        optometrist: visit.optometristExamination.optometrist ? {
          name: `${visit.optometristExamination.optometrist.firstName} ${visit.optometristExamination.optometrist.lastName}`,
          employeeId: visit.optometristExamination.optometrist.employeeId
        } : null
      } : null,

      // Ophthalmologist examinations - Full details
      ophthalmologistExaminations: visit.ophthalmologistExaminations.map(exam => ({
        id: exam.id,
        examinationSequence: exam.examinationSequence,
        examinationDate: exam.createdAt,
        
        // Visual Acuity
        visualAcuity: {
          ucvaOD: exam.ucvaOD || null,
          ucvaOS: exam.ucvaOS || null,
          bcvaOD: exam.bcvaOD || null,
          bcvaOS: exam.bcvaOS || null,
          distanceOD: exam.distanceOD || null,
          distanceOS: exam.distanceOS || null,
          distanceBinocular: exam.distanceBinocular || null,
          nearOD: exam.nearOD || null,
          nearOS: exam.nearOS || null,
          nearBinocular: exam.nearBinocular || null,
          ...(exam.visualAcuity && { additional: safeJsonParse(exam.visualAcuity) })
        },
        
        // Refraction
        refraction: {
          rightEye: {
            sphere: exam.refractionSphereOD || null,
            cylinder: exam.refractionCylinderOD || null,
            axis: exam.refractionAxisOD || null,
            add: exam.refractionAddOD || null
          },
          leftEye: {
            sphere: exam.refractionSphereOS || null,
            cylinder: exam.refractionCylinderOS || null,
            axis: exam.refractionAxisOS || null,
            add: exam.refractionAddOS || null
          },
          pd: exam.refractionPD || null,
          ...(exam.refraction && { additional: safeJsonParse(exam.refraction) })
        },
        
        // IOP (Intraocular Pressure)
        iop: {
          iopOD: exam.iopOD || null,
          iopOS: exam.iopOS || null,
          iopMethod: exam.iopMethod || null,
          ...(exam.tonometry && { additional: safeJsonParse(exam.tonometry) })
        },
        
        // Keratometry
        keratometry: {
          k1OD: exam.k1OD || null,
          k1OS: exam.k1OS || null,
          k2OD: exam.k2OD || null,
          k2OS: exam.k2OS || null,
          flatAxisOD: exam.flatAxisOD || null,
          flatAxisOS: exam.flatAxisOS || null
        },
        
        // Biometry
        biometry: {
          axlOD: exam.axlOD || null,
          axlOS: exam.axlOS || null,
          acdOD: exam.acdOD || null,
          acdOS: exam.acdOS || null
        },
        
        // IOL Details
        iol: {
          iolPowerPlannedOD: exam.iolPowerPlannedOD || null,
          iolPowerPlannedOS: exam.iolPowerPlannedOS || null,
          iolImplantedOD: exam.iolImplantedOD || null,
          iolImplantedOS: exam.iolImplantedOS || null
        },
        
        // Slit Lamp Examination
        slitLamp: {
          eyelidsOD: exam.eyelidsOD || null,
          eyelidsOS: exam.eyelidsOS || null,
          conjunctivaOD: exam.conjunctivaOD || null,
          conjunctivaOS: exam.conjunctivaOS || null,
          corneaOD: exam.corneaOD || null,
          corneaOS: exam.corneaOS || null,
          lensOD: exam.lensOD || null,
          lensOS: exam.lensOS || null,
          ...(exam.slitLampFindings && { additional: safeJsonParse(exam.slitLampFindings) })
        },
        
        // Anterior Segment
        anteriorSegment: safeJsonParse(exam.anteriorSegment),
        
        // Other Tests
        colorVision: exam.colorVision || null,
        pupilReaction: exam.pupilReaction || null,
        eyeAlignment: exam.eyeAlignment || null,
        extraocularMovements: exam.extraocularMovements || null,
        coverTest: exam.coverTest || null,
        
        // Fundoscopy & Advanced Tests
        fundoscopyFindings: safeJsonParse(exam.fundoscopyFindings),
        visualFieldResults: safeJsonParse(exam.visualFieldResults),
        octFindings: safeJsonParse(exam.octFindings),
        fundusPhotography: safeJsonParse(exam.fundusPhotography),
        angiographyFindings: safeJsonParse(exam.angiographyFindings),
        ultrasonography: safeJsonParse(exam.ultrasonography),
        
        // Clinical Assessment
        clinicalImpressions: exam.clinicalImpressions || null,
        preliminaryDiagnosis: exam.preliminaryDiagnosis || null,
        assessment: safeJsonParse(exam.assessment),
        treatmentPlan: safeJsonParse(exam.treatmentPlan),
        clinicalNotes: exam.clinicalNotes || null,
        examinationNotes: exam.examinationNotes || null,
        clinicalDetails: safeJsonParse(exam.clinicalDetails),
        
        // Additional Details
        additionalTests: safeJsonParse(exam.additionalTests),
        additionalOrders: safeJsonParse(exam.additionalOrders),
        additionalTestsOrdered: safeJsonParse(exam.additionalTestsOrdered),
        urgencyLevel: exam.urgencyLevel || null,
        surgeryRecommended: exam.surgeryRecommended || false,
        
        // Follow-up
        followUpRequired: exam.followUpRequired || false,
        followUpDate: exam.followUpDate || null,
        followUpInstructions: safeJsonParse(exam.followUpInstructions),
        followUpDays: exam.followUpDays || null,
        followUpPeriod: exam.followUpPeriod || null,
        
        // Other Details
        anyOtherDetailsOD: exam.anyOtherDetailsOD || null,
        anyOtherDetailsOS: exam.anyOtherDetailsOS || null,
        knownAllergies: safeJsonParse(exam.knownAllergies) || [],
        requiresDilation: exam.requiresDilation || false,
        
        // Timestamps
        completedAt: exam.completedAt,
        createdAt: exam.createdAt,
        updatedAt: exam.updatedAt,
        
        // Doctor Info
        doctor: exam.doctor ? {
          name: `${exam.doctor.firstName} ${exam.doctor.lastName}`,
          employeeId: exam.doctor.employeeId,
          specialization: exam.doctor.doctorProfile?.specialization || null
        } : null
      })),

      // Diagnoses
      diagnoses: visit.diagnoses.map(diagnosis => ({
        id: diagnosis.id,
        diagnosisType: diagnosis.diagnosisType,
        diagnosisDate: diagnosis.diagnosisDate,
        eyeAffected: diagnosis.eyeAffected,
        severity: diagnosis.severity,
        stage: diagnosis.stage,
        isPrimary: diagnosis.isPrimary,
        notes: diagnosis.notes,
        disease: diagnosis.disease ? {
          name: diagnosis.disease.diseaseName 
            ? (typeof diagnosis.disease.diseaseName === 'string' 
                ? diagnosis.disease.diseaseName 
                : (diagnosis.disease.diseaseName['@value'] || diagnosis.disease.diseaseName.value || JSON.stringify(diagnosis.disease.diseaseName)))
            : null,
          category: diagnosis.disease.ophthalmologyCategory,
          affectedStructure: diagnosis.disease.affectedStructure
        } : null,
        doctor: diagnosis.doctor ? {
          name: `${diagnosis.doctor.firstName} ${diagnosis.doctor.lastName}`
        } : null
      })),

      // Prescriptions
      prescriptions: visit.prescriptions.map(prescription => ({
        id: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber,
        prescriptionDate: prescription.prescriptionDate,
        validTill: prescription.validTill,
        generalInstructions: prescription.generalInstructions,
        followUpInstructions: prescription.followUpInstructions,
        status: prescription.status,
        doctor: prescription.doctor ? {
          name: `${prescription.doctor.firstName} ${prescription.doctor.lastName}`
        } : null,
        medications: prescription.prescriptionItems.map(item => ({
          id: item.id,
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          quantity: item.quantity,
          medicineDetails: item.medicine ? {
            name: item.medicine.name,
            code: item.medicine.code,
            dosage: item.medicine.dosage,
            information: item.medicine.information
          } : null
        }))
      })),

      // Billing information
      bills: visit.bills.map(bill => ({
        billNumber: bill.billNumber,
        totalAmount: bill.totalAmount,
        paidAmount: bill.paidAmount,
        status: bill.status,
        billDate: bill.billDate
      })),

      // Follow-up information
      followUp: {
        required: visit.followUpRequired,
        date: visit.followUpDate,
        instructions: visit.followUpInstructions,
        nextAppointment: visit.nextAppointmentDate
      }
    }));

    console.log(`✅ Found ${formattedVisits.length} completed visits for patient ${patient.patientNumber}`);

    res.status(200).json({
      success: true,
      message: 'Visit history retrieved successfully',
      data: {
        patient: {
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          patientNumber: patient.patientNumber
        },
        visits: formattedVisits,
        totalVisits: formattedVisits.length,
        summary: {
          totalDiagnoses: formattedVisits.reduce((sum, v) => sum + v.diagnoses.length, 0),
          totalPrescriptions: formattedVisits.reduce((sum, v) => sum + v.prescriptions.length, 0),
          lastVisitDate: formattedVisits[0]?.visitDate || null
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching patient visit history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient visit history',
      error: error.message
    });
  }
};

module.exports = {
  sendRegistrationOTP,
  verifyOTPAndRegister,
  loginPatient,
  logoutPatient,
  sendLoginOTP,
  verifyLoginOTP,
  resendLoginOTP,
  getPatientByNumber,
  getPatientStatistics,
  resendRegistrationOTP,
  getPatientProfile,
  updatePersonalInfo,
  updateContactInfo,
  updateMedicalHistory,
  updateProfilePhoto,
  registerPatientByStaff,
  getDoctorsList,
  bookAppointment,
  updateAppointmentQR,
  checkInPatient,
  getQueueStatus,
  getAppointmentByToken,
  getPatientAppointments,
  getPatientMedicalRecords,
  getPatientPrescriptions,
  getFamilyMembers,
  switchToFamilyMember,
  getCurrentPatientFamilyMembers,
  getPatientVisitHistory
};
