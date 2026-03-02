// controllers/staffController.js - Staff Self-Service Operations
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs').promises;
const prisma = require('../utils/prisma');
const { JWT_SECRET } = require('../middleware/auth');
const { moveFilesToEmployeeFolder, cleanupTempFiles } = require('../middleware/upload');
const patientService = require('../services/patientService');

// ==========================================
// SHARED CONSTANTS
// ==========================================
// Active appointment statuses (patient cannot rebook)
// These represent appointments that are ongoing, scheduled, or resumable
const ACTIVE_APPOINTMENT_STATUSES = [
  'SCHEDULED',              // Appointment booked (same day = active, past day → NO_SHOW by cron)
  'CHECKED_IN',             // Patient has arrived and treatment is in progress
  'RESCHEDULED'             // Appointment has been moved to a different time
];

// Inactive statuses (patient can rebook)
const INACTIVE_APPOINTMENT_STATUSES = [
  'COMPLETED',            // Treatment finished successfully
  'CANCELLED',            // Appointment cancelled by patient/staff
  'NO_SHOW',              // Patient didn't show up (auto-set by cron after date change)
  'PARTIALLY_COMPLETED',  // Treatment started but not finished (can resume OR book new)
  'DISCONTINUED'          // Treatment discontinued (7+ days stalled or manually)
];
// Generate JWT token for staff
const generateToken = (staff) => {
  return jwt.sign(
    {
      id: staff.id,
      email: staff.email,
      userType: 'staff',
      staffType: staff.staffType
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Generate random password for patient registration by staff
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

// Staff login
const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find staff member
    const staff = await prisma.staff.findUnique({
      where: { email },
      // 🎯 Select only the fields we need for authentication and basic info
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profilePhoto: true,
        staffType: true,
        department: true,
        isActive: true,
        employmentStatus: true,
        passwordHash: true, // Need this for password verification
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!staff || !staff.isActive || staff.employmentStatus !== 'active') {
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }

    // Check if passwordHash is valid
    if (!staff.passwordHash || typeof staff.passwordHash !== 'string') {
      console.log('❌ Invalid password hash for staff:', staff.email, 'Hash type:', typeof staff.passwordHash, 'Hash value:', staff.passwordHash);
      return res.status(401).json({ error: 'Account configuration error. Please contact administrator.' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, staff.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(staff);

    // Update last login
    await prisma.staff.update({
      where: { id: staff.id },
      data: {
        lastLogin: new Date(),
        updatedAt: new Date()
      }
    });

    // 🔥 Create clean response object with only essential fields
    const staffResponse = {
      id: staff.id,
      employeeId: staff.employeeId,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phone: staff.phone,
      profilePhoto: staff.profilePhoto,
      staffType: staff.staffType,
      department: staff.department,
      isActive: staff.isActive,
      employmentStatus: staff.employmentStatus,
      lastLogin: new Date().toISOString(), // Updated login time
      createdAt: staff.createdAt,
      updatedAt: new Date().toISOString()
    };

    // 🍪 Set httpOnly cookie (secure approach)
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: isProduction && req.secure, // Ensures secure cookies only over HTTPS in production
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    res.json({
      message: 'Login successful',
      data: {
        user: staffResponse
        // 🚫 Don't send token in response body for security
      }
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get staff profile (own profile only)
const getStaffProfile = async (req, res) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        profilePhoto: true,
        emergencyContact: true,
        staffType: true,
        department: true,
        employmentStatus: true,
        joiningDate: true,
        qualifications: true,
        certifications: true,
        languagesSpoken: true,
        doctorProfile: true,
        nurseProfile: true,
        technicianProfile: true,
        adminProfile: true,
        receptionistProfile: true,
        receptionist2Profile: true,
        optometristProfile: true,
        accountantProfile: true,
        qualityCoordinatorProfile: true,
        patientSafetyOfficerProfile: true,
        // New OT staff profiles
        otAdminProfile: true,
        anesthesiologistProfile: true,
        surgeonProfile: true,
        sisterProfile: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    res.json({
      success: true,
      data: { staff }
    });
  } catch (error) {
    console.error('Get staff profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update staff profile (own profile only)
const updateStaffProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      qualifications,
      certifications,
      languagesSpoken,
      roleSpecificData
    } = req.body;

    // Get current staff to determine staffType
    const currentStaff = await prisma.staff.findUnique({
      where: { id: req.user.id },
      select: { staffType: true }
    });

    if (!currentStaff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Prepare update data (only allow certain fields to be updated by staff themselves)
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender) updateData.gender = gender;
    if (address) updateData.address = address;
    if (emergencyContact) updateData.emergencyContact = emergencyContact;
    if (qualifications) updateData.qualifications = qualifications;
    if (certifications) updateData.certifications = certifications;
    if (languagesSpoken) updateData.languagesSpoken = languagesSpoken;

    updateData.updatedAt = new Date();

    // Handle role-specific data based on staff type
    if (roleSpecificData && typeof roleSpecificData === 'object') {
      const staffType = currentStaff.staffType.toLowerCase();

      // Map staff types to their corresponding profile fields
      const profileFieldMap = {
        'doctor': 'doctorProfile',
        'nurse': 'nurseProfile',
        'technician': 'technicianProfile',
        'admin': 'adminProfile',
        'receptionist': 'receptionistProfile',
        'receptionist2': 'receptionist2Profile',
        'optometrist': 'optometristProfile',
        'accountant': 'accountantProfile',
        'quality-coordinator': 'qualityCoordinatorProfile',
        'patient-safety-officer': 'patientSafetyOfficerProfile',
        // New OT staff types
        'ot-admin': 'otAdminProfile',
        'ot_admin': 'otAdminProfile',
        'anesthesiologist': 'anesthesiologistProfile',
        'surgeon': 'surgeonProfile',
        'sister': 'sisterProfile'
      };

      const profileField = profileFieldMap[staffType];

      if (profileField) {
        // For role-specific updates, we need to handle the nested profile object
        // First, get the current profile data
        const currentProfile = await prisma.staff.findUnique({
          where: { id: req.user.id },
          select: { [profileField]: true }
        });

        // Merge existing profile data with new data
        const existingProfileData = currentProfile[profileField] || {};
        const updatedProfileData = {
          ...existingProfileData,
          ...roleSpecificData,
          updatedAt: new Date()
        };

        updateData[profileField] = updatedProfileData;
      }
    }

    const updatedStaff = await prisma.staff.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        emergencyContact: true,
        qualifications: true,
        certifications: true,
        languagesSpoken: true,
        staffType: true,
        doctorProfile: true,
        nurseProfile: true,
        technicianProfile: true,
        adminProfile: true,
        receptionistProfile: true,
        receptionist2Profile: true,
        optometristProfile: true,
        accountantProfile: true,
        qualityCoordinatorProfile: true,
        patientSafetyOfficerProfile: true,
        // New OT staff profiles
        otAdminProfile: true,
        anesthesiologistProfile: true,
        surgeonProfile: true,
        sisterProfile: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { staff: updatedStaff }
    });
  } catch (error) {
    console.error('Update staff profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Change password for staff (own password only)
const changeStaffPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current staff with password hash
    const staff = await prisma.staff.findUnique({
      where: { id: req.user.id }
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, staff.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, staff.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // Hash new password
    const saltRounds = 3;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.staff.update({
      where: { id: req.user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Staff logout - clears httpOnly cookie and auto check-out
const logoutStaff = async (req, res) => {
  try {
    let staffId = null;

    // Try to get staff ID from token if user is authenticated
    if (req.user && req.user.id) {
      staffId = req.user.id;

      // Auto check-out if logged in
      const { autoCheckOut } = require('./attendanceController');
      const checkoutResult = await autoCheckOut(staffId);

      if (checkoutResult.success) { 
        console.log(`Auto check-out successful for staff ${staffId}, worked ${checkoutResult.workingHours} hours`);
      }
    }

    // Clear the httpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: isProduction && req.secure,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/'
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Staff logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload profile photo for staff
const uploadProfilePhoto = async (req, res) => {
  try {
    const staffId = req.user.id;
    const employeeId = req.user.employeeId;

    console.log('📸 Upload profile photo request:', {
      staffId,
      employeeId,
      files: req.files ? Object.keys(req.files) : 'No files',
      hasProfilePhoto: req.files?.profilePhoto ? 'Yes' : 'No'
    });

    // Check if file was uploaded
    if (!req.files || !req.files.profilePhoto || req.files.profilePhoto.length === 0) {
      return res.status(400).json({
        error: 'No profile photo provided',
        message: 'Please select a profile photo to upload'
      });
    }

    const profilePhotoFile = req.files.profilePhoto[0];
    console.log('📁 Profile photo file details:', {
      originalname: profilePhotoFile.originalname,
      mimetype: profilePhotoFile.mimetype,
      size: profilePhotoFile.size,
      filename: profilePhotoFile.filename,
      path: profilePhotoFile.path
    });

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedImageTypes.includes(profilePhotoFile.mimetype)) {
      await cleanupTempFiles(req.files);
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only JPEG, PNG, GIF, and WebP images are allowed for profile photos'
      });
    }

    // Validate file size (5MB limit for profile photos)
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (profilePhotoFile.size > maxFileSize) {
      await cleanupTempFiles(req.files);
      return res.status(400).json({
        error: 'File too large',
        message: 'Profile photo must be less than 5MB'
      });
    }

    // Get current staff to check for existing profile photo
    const currentStaff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { profilePhoto: true }
    });

    if (!currentStaff) {
      await cleanupTempFiles(req.files);
      return res.status(404).json({ error: 'Staff member not found' });
    }

    console.log('👤 Current staff profile photo:', currentStaff.profilePhoto);

    // Use existing employee upload directory (uploads/employeeId/)
    const employeeUploadDir = path.join(__dirname, '../../uploads', employeeId);

    // Check if employee directory exists (it should already exist)
    try {
      await fs.access(employeeUploadDir);
      console.log('📁 Employee upload directory exists:', employeeUploadDir);
    } catch (error) {
      console.log('📁 Employee directory not found, creating:', employeeUploadDir);
      await fs.mkdir(employeeUploadDir, { recursive: true });
    }

    // Generate new filename with timestamp
    const fileExtension = path.extname(profilePhotoFile.originalname);
    const newFileName = `profile-${Date.now()}${fileExtension}`;
    const newFilePath = path.join(employeeUploadDir, newFileName);
    const relativePath = `/uploads/${employeeId}/${newFileName}`;

    console.log('🎯 New file paths:', { newFilePath, relativePath });

    // Move file from temp location to staff directory
    try {
      await fs.rename(profilePhotoFile.path, newFilePath);
      console.log('✅ File moved successfully from temp to:', newFilePath);
    } catch (moveError) {
      console.error('❌ Error moving file:', moveError);
      await cleanupTempFiles(req.files);
      return res.status(500).json({
        error: 'File move failed',
        message: 'Failed to save uploaded file'
      });
    }

    // Update staff record with new profile photo path FIRST
    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        profilePhoto: relativePath,
        updatedAt: new Date()
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        staffType: true,
        department: true,
        profilePhoto: true,
        updatedAt: true
      }
    });

    console.log('💾 Database updated with new profile photo path:', relativePath);

    // Delete old profile photo AFTER successful database update
    if (currentStaff.profilePhoto && currentStaff.profilePhoto !== relativePath) {
      try {
        const oldPhotoPath = path.join(__dirname, '../../', currentStaff.profilePhoto);
        await fs.unlink(oldPhotoPath);
        console.log(`🗑️ Deleted old profile photo: ${currentStaff.profilePhoto}`);
      } catch (deleteError) {
        console.error('⚠️ Error deleting old profile photo (but upload succeeded):', deleteError);
        // Continue - new photo is already uploaded and database is updated
      }
    }

    console.log(`✅ Profile photo uploaded successfully for staff: ${employeeId}`);

    // Generate full URL for the uploaded image
    const baseUrl = process.env.APPLICATION_BASE_URL || 'http://localhost:8080/';
    const fullImageUrl = `${baseUrl.replace(/\/$/, '')}${relativePath}`;

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        staff: updatedStaff,
        profilePhoto: relativePath,
        profilePhotoUrl: fullImageUrl
      }
    });

  } catch (error) {
    console.error('❌ Profile photo upload error:', error);

    // Clean up any uploaded files in case of error
    if (req.files) {
      await cleanupTempFiles(req.files);
    }

    if (error.message.includes('Failed to create upload directories') ||
      error.message.includes('Failed to organize uploaded files')) {
      return res.status(500).json({
        error: 'File system error',
        message: 'Failed to save the uploaded file. Please try again.'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to upload profile photo. Please try again.'
    });
  }
};


//Patient-registration by another patient (referral system)
const registerPatientByPatient = async (req, res) => {
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
      allergies,
      relation
    } = req.body;

    const referrerPatientId = req.user.id; // The logged-in patient who is registering

    console.log('👥 Patient registering another patient:', {
      referrerPatientId,
      firstName,
      lastName,
      phone,
      relation
    });

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

    // For referred patients, we DON'T check phone/email uniqueness
    // This allows family members to share contact details

    // Generate a default password for patient-registered patients
    const defaultPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    // Prepare patient data with referral information
    const patientData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email ? email.toLowerCase().trim() : null,
      dateOfBirth: new Date(dateOfBirth),
      gender: gender.toLowerCase(),
      passwordHash,
      temporaryPassword: defaultPassword,
      // Optional fields
      ...(address && { address: address.trim() }),
      ...(emergencyContact && { emergencyContact: emergencyContact.trim() }),
      ...(emergencyPhone && { emergencyPhone: emergencyPhone.trim() }),
      ...(allergies && Array.isArray(allergies) && allergies.length > 0 && { allergies }),
      ...(relation && {
        emergencyContacts: {
          primary: {
            name: emergencyContact || `${req.user.firstName} ${req.user.lastName}`,
            phone: emergencyPhone || req.user.phone,
            relation: relation
          }
        }
      })
    };

    // Create patient with referral flag (bypasses uniqueness checks)
    const result = await patientService.createPatientWithReferral(patientData, referrerPatientId);

    // Get referrer info for logging
    const referrerInfo = req.user;
    console.log(`Patient ${result.patient.patientNumber} registered by patient ${referrerInfo.patientNumber} (${referrerInfo.firstName} ${referrerInfo.lastName}) as ${relation || 'family member'}`);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Patient registered successfully through referral',
      data: {
        patient: {
          id: result.patient.id,
          patientNumber: result.patient.patientNumber,
          mrn: result.patient.mrn,
          firstName: result.patient.firstName,
          lastName: result.patient.lastName,
          phone: result.patient.phone,
          email: result.patient.email,
          dateOfBirth: result.patient.dateOfBirth,
          gender: result.patient.gender,
          isReferred: result.patient.isReferred,
          patientStatus: result.patient.patientStatus,
          createdAt: result.patient.createdAt
        },
        referralInfo: result.referralInfo,
        temporaryPassword: defaultPassword,
        emailSent: result.emailSent,
        emailError: result.emailError,
        referredBy: {
          patientNumber: referrerInfo.patientNumber,
          name: `${referrerInfo.firstName} ${referrerInfo.lastName}`,
          relation: relation
        },
        credentials: {
          patientNumber: result.patient.patientNumber,
          password: defaultPassword,
          message: result.emailSent ?
            'Login credentials have been sent to the provided email address.' :
            'Please share the login credentials manually with the registered family member.'
        }
      }
    });

  } catch (error) {
    console.error('Error registering patient by patient:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

//Patient-registration by staff 
const registerPatientByStaff = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      phone,
      email,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      emergencyPhone,
      allergies,
      referredBy,
      isReferred
    } = req.body;

    // Validate required fields
    if (!firstName || !middleName || !lastName || !phone || !dateOfBirth || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: firstName, middleName, lastName, phone, dateOfBirth, and gender are required'
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

    // Check if patient already exists by phone
    const existingPatientByPhone = await patientService.findPatientByPhone(phone);
    
    // If patient exists with same phone and NO referral is provided, reject
    if (existingPatientByPhone && !referredBy) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this phone number already exists'
      });
    }

    // If referredBy is provided, validate the referrer exists
    if (referredBy) {
      const referrerExists = await prisma.patient.findUnique({
        where: { id: referredBy }
      });
      
      if (!referrerExists) {
        return res.status(400).json({
          success: false,
          message: 'Referrer patient not found'
        });
      }
      
      console.log(`📋 New patient being registered with referral from: ${referrerExists.firstName} ${referrerExists.lastName} (${referrerExists.patientNumber})`);
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
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email ? email.toLowerCase().trim() : null,
      dateOfBirth: new Date(dateOfBirth),
      gender: gender.toLowerCase(),
      passwordHash,
      temporaryPassword: defaultPassword, // Pass temporary password for email
      // Referral fields
      ...(isReferred && { isReferred: true }),
      ...(referredBy && { referredBy }),
      // Optional fields - only include if provided
      ...(address && { address: address.trim() }),
      ...(emergencyContact && { emergencyContact: emergencyContact.trim() }),
      ...(emergencyPhone && { emergencyPhone: emergencyPhone.trim() }),
      ...(allergies && Array.isArray(allergies) && allergies.length > 0 && { allergies })
    };

    // Create patient with email and appointment
    const result = await patientService.createPatientByStaff(patientData);

    // Get staff info for logging
    const staffInfo = req.user;
    console.log(`✅ Patient ${result.patient.patientNumber} registered by staff member ${staffInfo.employeeId} (${staffInfo.firstName} ${staffInfo.lastName})`);
    
    if (referredBy) {
      console.log(`🔗 Patient registered as referral (isReferred: true, referredBy: ${referredBy})`);
    }

    // Return success response with patient details, appointment, and email status
    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        patient: {
          id: result.patient.id,
          patientNumber: result.patient.patientNumber,
          mrn: result.patient.mrn,
          firstName: result.patient.firstName,
          lastName: result.patient.lastName,
          phone: result.patient.phone,
          email: result.patient.email,
          dateOfBirth: result.patient.dateOfBirth,
          gender: result.patient.gender,
          patientStatus: result.patient.patientStatus,
          createdAt: result.patient.createdAt
        },
        appointment: result.appointment ? {
          id: result.appointment.id,
          appointmentDate: result.appointment.appointmentDate,
          appointmentTime: result.appointment.appointmentTime,
          tokenNumber: result.appointment.tokenNumber,
          status: result.appointment.status,
          purpose: result.appointment.purpose,
          estimatedDuration: result.appointment.estimatedDuration
        } : null,
        temporaryPassword: defaultPassword,
        emailSent: result.emailSent,
        emailError: result.emailError,
        appointmentError: result.appointmentError,
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
 * Register a new patient with custom appointment time
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerPatientWithAppointmentTime = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      phone,
      email,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      emergencyPhone,
      allergies,
      appointmentTime,
      appointmentDate,
      purpose,
      isReferred,
      referredBy
    } = req.body;

    // Validate required fields
    if (!firstName || !middleName || !lastName || !phone || !dateOfBirth || !gender || !appointmentTime || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: firstName, middleName, lastName, phone, dateOfBirth, gender, appointmentTime, and appointmentDate are required'
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

    // Validate appointment time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(appointmentTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment time format. Use HH:MM (24-hour format)'
      });
    }

    // Validate appointment date (must be today or future)
    const selectedDate = appointmentDate ? new Date(appointmentDate) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for comparison
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date cannot be in the past'
      });
    }

    // Check if patient already exists (by phone or email)
    const existingPatientByPhone = await patientService.findPatientByPhone(phone);
    
    // If phone exists and no referral provided, reject registration
    if (existingPatientByPhone && !referredBy) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this phone number already exists. If registering a family member, please select the referring patient.'
      });
    }

    // If referral is provided, validate the referring patient exists
    if (referredBy) {
      const referringPatient = await prisma.patient.findUnique({
        where: { id: referredBy },
        select: { id: true, patientNumber: true, firstName: true, lastName: true }
      });

      if (!referringPatient) {
        return res.status(400).json({
          success: false,
          message: 'Referring patient not found'
        });
      }

      console.log(`✅ Referral validated: ${referringPatient.firstName} ${referringPatient.lastName} (${referringPatient.patientNumber})`);
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

    // Prepare appointment date - use provided date (required now)
    const appointmentDateObj = new Date(appointmentDate);

    // Prepare patient data with optional fields
    const patientData = {
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email ? email.toLowerCase().trim() : null,
      dateOfBirth: new Date(dateOfBirth),
      gender: gender.toLowerCase(),
      passwordHash,
      temporaryPassword: defaultPassword, // Pass temporary password for email
      // Optional fields - only include if provided
      ...(address && { address: address.trim() }),
      ...(emergencyContact && { emergencyContact: emergencyContact.trim() }),
      ...(emergencyPhone && { emergencyPhone: emergencyPhone.trim() }),
      ...(allergies && Array.isArray(allergies) && allergies.length > 0 && { allergies }),
      // Referral fields
      ...(isReferred && { isReferred: true }),
      ...(referredBy && { referredBy }),
      // Custom appointment data
      customAppointment: {
        appointmentDate: appointmentDateObj,
        appointmentTime: appointmentTime,
        purpose: purpose || 'General Consultation'
      }
    };

    // Create patient with custom appointment time
    const result = await patientService.createPatientWithCustomAppointment(patientData);

    // Get staff info for logging
    const staffInfo = req.user;
    
    if (referredBy) {
      console.log(`🔗 Patient ${result.patient.patientNumber} registered as referral (isReferred: true, referredBy: ${referredBy}) with appointment time ${appointmentTime} by staff member ${staffInfo.employeeId}`);
    } else {
      console.log(`Patient ${result.patient.patientNumber} registered with appointment time ${appointmentTime} by staff member ${staffInfo.employeeId} (${staffInfo.firstName} ${staffInfo.lastName})`);
    }

    // Return success response with patient details, appointment, and email status
    res.status(201).json({
      success: true,
      message: 'Patient registered successfully with appointment',
      data: {
        patient: {
          id: result.patient.id,
          patientNumber: result.patient.patientNumber,
          mrn: result.patient.mrn,
          firstName: result.patient.firstName,
          lastName: result.patient.lastName,
          phone: result.patient.phone,
          email: result.patient.email,
          dateOfBirth: result.patient.dateOfBirth,
          gender: result.patient.gender,
          patientStatus: result.patient.patientStatus,
          createdAt: result.patient.createdAt
        },
        appointment: result.appointment ? {
          id: result.appointment.id,
          appointmentDate: result.appointment.appointmentDate,
          appointmentTime: result.appointment.appointmentTime,
          tokenNumber: result.appointment.tokenNumber,
          status: result.appointment.status,
          purpose: result.appointment.purpose,
          estimatedDuration: result.appointment.estimatedDuration
        } : null,
        temporaryPassword: defaultPassword,
        emailSent: result.emailSent,
        emailError: result.emailError,
        appointmentError: result.appointmentError,
        registeredBy: {
          employeeId: staffInfo.employeeId,
          name: `${staffInfo.firstName} ${staffInfo.lastName}`,
          staffType: staffInfo.staffType
        }
      }
    });

  } catch (error) {
    console.error('Error registering patient with appointment time:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get today's appointments for patient check-in
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTodayAppointments = async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Fetch appointments for today with patient details
    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'SCHEDULED' // Only get scheduled appointments that can be checked in
      },
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            mrn: true,
            firstName: true,
            middleName: true,
            lastName: true,
            phone: true,
            email: true,
            gender: true,
            dateOfBirth: true
          }
        }
      },
      orderBy: [
        { appointmentTime: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Group appointments by patient (in case a patient has multiple appointments)
    const patientsMap = new Map();

    appointments.forEach(appointment => {
      const patientId = appointment.patient.id;
      if (!patientsMap.has(patientId)) {
        patientsMap.set(patientId, {
          ...appointment.patient,
          appointments: []
        });
      }

      patientsMap.get(patientId).appointments.push({
        id: appointment.id,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        tokenNumber: appointment.tokenNumber,
        status: appointment.status,
        purpose: appointment.purpose,
        appointmentType: appointment.appointmentType
      });
    });

    const patientsWithAppointments = Array.from(patientsMap.values());

    console.log(`✅ Found ${patientsWithAppointments.length} patients with ${appointments.length} appointments for today`);

    res.status(200).json({
      success: true,
      message: `Found ${patientsWithAppointments.length} patients with appointments for today`,
      data: patientsWithAppointments,
      meta: {
        totalPatients: patientsWithAppointments.length,
        totalAppointments: appointments.length,
        date: today.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get daily appointments - New endpoint accessible by all staff
 */
const getDailyAppointments = async (req, res) => {
  try {
    console.log('📅 Fetching daily appointments for staff dashboard...');

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    console.log(`🔍 Searching for appointments between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);

    // Fetch all appointments for today (not just scheduled ones)
    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        }
        // Include all statuses for complete visibility
      },
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            mrn: true,
            firstName: true,
            middleName: true,
            lastName: true,
            phone: true,
            email: true,
            gender: true,
            dateOfBirth: true
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
      },
      orderBy: [
        { appointmentTime: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    console.log(`📋 Found ${appointments.length} appointments for today`);

    // Format appointments for frontend display
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      tokenNumber: appointment.tokenNumber,
      status: appointment.status,
      purpose: appointment.purpose,
      appointmentType: appointment.appointmentType,
      estimatedDuration: appointment.estimatedDuration,
      notes: appointment.notes,
      // Patient information
      patientId: appointment.patient.id,
      patientNumber: appointment.patient.patientNumber,
      mrn: appointment.patient.mrn,
      firstName: appointment.patient.firstName,
      middleName: appointment.patient.middleName,
      lastName: appointment.patient.lastName,
      phone: appointment.patient.phone,
      email: appointment.patient.email,
      gender: appointment.patient.gender,
      dateOfBirth: appointment.patient.dateOfBirth,
      // Doctor information
      doctorId: appointment.doctor?.id,
      doctorName: appointment.doctor ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}` : null,
      doctorType: appointment.doctor?.staffType,
      // Calculated fields
      age: appointment.patient.dateOfBirth ?
        Math.floor((today - new Date(appointment.patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null
    }));

    // Group by status for summary
    const statusSummary = formattedAppointments.reduce((acc, appointment) => {
      const status = appointment.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log(`✅ Formatted ${formattedAppointments.length} appointments with status summary:`, statusSummary);

    res.status(200).json({
      success: true,
      message: `Found ${formattedAppointments.length} appointments for today`,
      data: formattedAppointments,
      meta: {
        totalAppointments: formattedAppointments.length,
        date: today.toISOString().split('T')[0],
        statusSummary,
        dateRange: {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching daily appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily appointments',
      error: error.message
    });
  }
};

// Get all future appointments (including today and beyond)
const getAllFutureAppointments = async (req, res) => {
  try {
    console.log('📅 Fetching all appointments...');

    // Don't filter by date - get all appointments to allow viewing past appointments
    console.log(`🔍 Searching for all appointments`);

    // Fetch all appointments (past and future)
    const appointments = await prisma.appointment.findMany({
      where: {
        // No date filter - get all appointments
      },
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            mrn: true,
            firstName: true,
            middleName: true,
            lastName: true,
            phone: true,
            email: true,
            gender: true,
            dateOfBirth: true
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
      },
      orderBy: [
        { appointmentDate: 'desc' }, // Most recent first
        { appointmentTime: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log(`📋 Found ${appointments.length} appointments (past and future)`);

    // Format appointments for frontend display
    const formattedAppointments = appointments.map(appointment => ({
      id: appointment.id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      tokenNumber: appointment.tokenNumber,
      status: appointment.status,
      purpose: appointment.purpose,
      appointmentType: appointment.appointmentType,
      estimatedDuration: appointment.estimatedDuration,
      notes: appointment.notes,
      // Patient information
      patientId: appointment.patient.id,
      patientNumber: appointment.patient.patientNumber,
      mrn: appointment.patient.mrn,
      firstName: appointment.patient.firstName,
      middleName: appointment.patient.middleName,
      lastName: appointment.patient.lastName,
      phone: appointment.patient.phone,
      email: appointment.patient.email,
      gender: appointment.patient.gender,
      dateOfBirth: appointment.patient.dateOfBirth,
      // Doctor information
      doctorId: appointment.doctor?.id,
      doctorName: appointment.doctor ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}` : null,
      doctorType: appointment.doctor?.staffType,
      // Calculated fields
      age: appointment.patient.dateOfBirth ?
        Math.floor((new Date() - new Date(appointment.patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null
    }));

    // Group by status for summary
    const statusSummary = formattedAppointments.reduce((acc, appointment) => {
      const status = appointment.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log(`✅ Formatted ${formattedAppointments.length} future appointments with status summary:`, statusSummary);

    res.status(200).json({
      success: true,
      message: `Found ${formattedAppointments.length} appointments`,
      data: formattedAppointments,
      meta: {
        totalAppointments: formattedAppointments.length,
        statusSummary
      }
    });
  } catch (error) {
    console.error('❌ Error fetching future appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch future appointments',
      error: error.message
    });
  }
};



const getPatientById = async (req, res) => {
  try {
    const patient = await patientService.findPatientById(req.params.patientId);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch patient details' });
  }
};

/**
 * Get weekly patient arrivals for dashboard chart
 */
const getWeeklyPatientArrivals = async (req, res) => {
  try {
    console.log('📊 Fetching weekly patient arrivals data...');

    // Get date range for this week (Monday to Sunday)
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate Monday of current week
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    monday.setHours(0, 0, 0, 0);

    // Calculate Sunday of current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    console.log(`📅 Week range: ${monday.toISOString()} to ${sunday.toISOString()}`);

    // Days of the week
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayAbbreviations = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Get all appointments for this week
    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: monday,
          lte: sunday
        }
      },
      select: {
        id: true,
        appointmentDate: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        appointmentDate: 'asc'
      }
    });

    console.log(`📋 Found ${appointments.length} appointments this week`);

    // Also get patient visits (check-ins) for this week
    const patientVisits = await prisma.patientVisit.findMany({
      where: {
        visitDate: {
          gte: monday,
          lte: sunday
        }
      },
      select: {
        id: true,
        visitDate: true,
        status: true,
        checkedInAt: true
      },
      orderBy: {
        visitDate: 'asc'
      }
    });

    console.log(`👥 Found ${patientVisits.length} patient visits this week`);

    // Initialize week data
    const weekData = dayAbbreviations.map((day, index) => ({
      day,
      fullDay: daysOfWeek[index],
      date: new Date(monday.getTime() + (index * 24 * 60 * 60 * 1000)),
      appointments: 0,
      checkins: 0,
      patients: 0 // This will be the combined count
    }));

    // Count appointments by day
    appointments.forEach(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const dayIndex = appointmentDate.getDay();
      const weekDayIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert Sunday=0 to index 6

      if (weekDayIndex >= 0 && weekDayIndex < 7) {
        weekData[weekDayIndex].appointments++;
      }
    });

    // Count patient visits (check-ins) by day
    patientVisits.forEach(visit => {
      const visitDate = new Date(visit.visitDate);
      const dayIndex = visitDate.getDay();
      const weekDayIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert Sunday=0 to index 6

      if (weekDayIndex >= 0 && weekDayIndex < 7) {
        weekData[weekDayIndex].checkins++;
      }
    });

    // Calculate total patients (unique appointments + visits)
    weekData.forEach(day => {
      day.patients = Math.max(day.appointments, day.checkins); // Use the higher count as primary metric
    });

    // Format response for chart
    const chartData = weekData.map(day => ({
      day: day.day,
      patients: day.patients,
      appointments: day.appointments,
      checkins: day.checkins,
      date: day.date.toISOString().split('T')[0]
    }));

    // Calculate summary stats
    const totalPatients = chartData.reduce((sum, day) => sum + day.patients, 0);
    const totalAppointments = chartData.reduce((sum, day) => sum + day.appointments, 0);
    const totalCheckins = chartData.reduce((sum, day) => sum + day.checkins, 0);
    const averagePerDay = Math.round(totalPatients / 7);

    console.log(`✅ Weekly summary: ${totalPatients} total patients, ${averagePerDay} avg per day`);

    res.status(200).json({
      success: true,
      message: 'Weekly patient arrivals data retrieved successfully',
      data: chartData,
      meta: {
        weekRange: {
          start: monday.toISOString().split('T')[0],
          end: sunday.toISOString().split('T')[0]
        },
        summary: {
          totalPatients,
          totalAppointments,
          totalCheckins,
          averagePerDay,
          peakDay: chartData.reduce((peak, day) =>
            day.patients > peak.patients ? day : peak, chartData[0]
          )
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching weekly patient arrivals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly patient arrivals data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all patients for appointment booking
 */
const getAllPatients = async (req, res) => {
  try {
    console.log('🔍 Fetching all patients for appointment booking...');

    // Start of today (midnight) — used to filter genuinely blocking appointments
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        patientNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        emergencyContacts: true,
        createdAt: true,
        // Include active appointment info for booking restriction.
        // Only flag patients as blocked when they have a GENUINELY active appointment:
        //   1) SCHEDULED / RESCHEDULED for today or a future date
        //   2) CHECKED_IN (patient physically in the hospital — any date)
        // Past-date SCHEDULED appointments (stale, cron not yet run) must NOT block rebooking.
        appointments: {
          where: {
            OR: [
              {
                isActive: true,
                status: { in: ['SCHEDULED', 'RESCHEDULED'] },
                appointmentDate: { gte: todayStart }
              },
              {
                status: 'CHECKED_IN'
              }
            ]
          },
          select: {
            id: true,
            status: true,
            appointmentDate: true,
            appointmentTime: true,
            tokenNumber: true,
            isActive: true
          },
          orderBy: {
            appointmentDate: 'desc'
          },
          take: 1 // Only get the latest active appointment
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    // Transform the response to include hasActiveAppointment flag
    const patientsWithActiveStatus = patients.map(patient => {
      const activeAppointment = patient.appointments?.[0];
      return {
        id: patient.id,
        patientNumber: patient.patientNumber,
        firstName: patient.firstName,
        middleName: patient.middleName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        emergencyContacts: patient.emergencyContacts,
        createdAt: patient.createdAt,
        // Active appointment metadata for booking restriction
        hasActiveAppointment: !!activeAppointment,
        activeAppointment: activeAppointment ? {
          id: activeAppointment.id,
          status: activeAppointment.status,
          date: activeAppointment.appointmentDate,
          time: activeAppointment.appointmentTime,
          tokenNumber: activeAppointment.tokenNumber
        } : null
      };
    });

    console.log(`✅ Found ${patients.length} patients in database`);
    
    const patientsWithActive = patientsWithActiveStatus.filter(p => p.hasActiveAppointment).length;
    console.log(`🚫 ${patientsWithActive} patients currently blocked (have active appointments)`);

    res.status(200).json({
      success: true,
      message: `Found ${patients.length} patients`,
      data: patientsWithActiveStatus,
      meta: {
        totalPatients: patients.length,
        patientsWithActiveAppointments: patientsWithActive,
        blockedPatientIds: patientsWithActiveStatus
          .filter(p => p.hasActiveAppointment)
          .map(p => p.id)
      }
    });

  } catch (error) {
    console.error('Error fetching all patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Book instant appointment by staff
 */
// src/controllers/appointmentController.js
// src/controllers/appointmentController.js
const bookInstantAppointmentByStaff = async (req, res) => {
  try {
    const {
      patientId,
      appointmentType,
      purpose,
      notes,
      appointmentDate, // optional (YYYY-MM-DD)
      appointmentTime  // optional (HH:mm)
    } = req.body;

    const staffId = req.user.id;

    /* -------------------- VALIDATION -------------------- */
    if (!patientId || !appointmentType) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and appointment type are required'
      });
    }

    const isInstant = !appointmentDate && !appointmentTime;

    if (!isInstant && (!appointmentDate || !appointmentTime)) {
      return res.status(400).json({
        success: false,
        message: 'Both appointment date and time are required for scheduled bookings'
      });
    }

    /* -------------------- VERIFY PATIENT -------------------- */
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        patientNumber: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    /* -------------------- DETERMINE DATE & TIME -------------------- */
    let finalAppointmentDate;
    let finalAppointmentTime;

    if (isInstant) {
      const now = new Date();
      finalAppointmentDate = now;
      finalAppointmentTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } else {
      finalAppointmentDate = new Date(appointmentDate);
      finalAppointmentTime = appointmentTime;

      // Prevent booking in the past
      const scheduledDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
      if (scheduledDateTime < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book an appointment in the past'
        });
      }
    }

    /* -------------------- AUTO-DISCONTINUE PARTIALLY_COMPLETED APPOINTMENTS -------------------- */
    // MUST run BEFORE the duplicate/active checks so that PARTIALLY_COMPLETED appointments
    // (even with isActive: true) are cleaned up instead of blocking the new booking.
    //
    // Rule: When a patient books a NEW appointment, ALL their PARTIALLY_COMPLETED appointments
    // are immediately set to DISCONTINUED. There should never be a stale PARTIALLY_COMPLETED
    // appointment lingering after a new booking.
    //
    // Also catches stale past-date CHECKED_IN appointments (isActive: false) that the cron
    // may not have transitioned yet.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const incompleteAppointments = await prisma.appointment.findMany({
      where: {
        patientId,
        OR: [
          // Case 1: ANY PARTIALLY_COMPLETED appointment (regardless of date or isActive)
          { status: 'PARTIALLY_COMPLETED' },
          // Case 2: Stale past-date CHECKED_IN appointments (isActive: false)
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
        isActive: true,
        patientVisit: { select: { id: true, status: true } }
      }
    });

    if (incompleteAppointments.length > 0) {
      const oldApptIds = incompleteAppointments.map(a => a.id);
      const oldVisitIds = incompleteAppointments.map(a => a.patientVisit?.id).filter(Boolean);

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

      console.log(`🔄 Auto-discontinued ${incompleteAppointments.length} incomplete appointment(s) for patient ${patientId} (statuses: ${[...new Set(incompleteAppointments.map(a => a.status))].join(', ')})`);
    }

    /* -------------------- DUPLICATE CHECK (SAME DAY) -------------------- */
    const startOfDay = new Date(finalAppointmentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // PRIMARY CHECK: Does this patient have ANY active appointment (regardless of date)?
    // This prevents booking when a resumed appointment from a previous day is still active.
    // Note: PARTIALLY_COMPLETED appointments were already auto-discontinued above,
    // so they will NOT block here anymore.
    const activeAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        isActive: true
      },
      select: {
        id: true,
        status: true,
        tokenNumber: true,
        appointmentTime: true,
        appointmentDate: true
      }
    });

    if (activeAppointment) {
      const activeDate = new Date(activeAppointment.appointmentDate).toLocaleDateString('en-IN', { dateStyle: 'medium' });
      return res.status(400).json({
        success: false,
        message: `Patient already has an active appointment in progress (Token: ${activeAppointment.tokenNumber}, Date: ${activeDate}). Please complete or discontinue the existing appointment before booking a new one.`,
        existingAppointment: {
          id: activeAppointment.id,
          status: activeAppointment.status,
          tokenNumber: activeAppointment.tokenNumber,
          appointmentTime: activeAppointment.appointmentTime,
          appointmentDate: activeAppointment.appointmentDate,
          isActive: true
        }
      });
    }

    // SECONDARY CHECK: Prevent duplicate same-day appointments (even inactive ones like SCHEDULED)
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        appointmentDate: {
          gte: startOfDay,
          lt: endOfDay
        },
        status: {
          in: ACTIVE_APPOINTMENT_STATUSES
        }
      },
      select: {
        id: true,
        status: true,
        tokenNumber: true,
        appointmentTime: true
      }
    });

    if (existingAppointment) {
      let errorMessage = 'Patient already has an appointment on this date';
      
      if (existingAppointment.status === 'SCHEDULED') {
        errorMessage = `Patient already has a scheduled appointment at ${existingAppointment.appointmentTime} (Token: ${existingAppointment.tokenNumber}). Please cancel the existing appointment before booking a new one.`;
      } else if (existingAppointment.status === 'RESCHEDULED') {
        errorMessage = `Patient has a rescheduled appointment (Token: ${existingAppointment.tokenNumber}). Please cancel it before booking a new one.`;
      }

      return res.status(400).json({
        success: false,
        message: errorMessage,
        existingAppointment: {
          id: existingAppointment.id,
          status: existingAppointment.status,
          tokenNumber: existingAppointment.tokenNumber,
          appointmentTime: existingAppointment.appointmentTime
        }
      });
    }

    /* -------------------- STAFF INFO -------------------- */
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        staffType: true
      }
    });

    /* -------------------- TOKEN GENERATION -------------------- */
    const tokenNumber = Math.floor(1000 + Math.random() * 9000).toString();

    /* -------------------- CREATE APPOINTMENT -------------------- */
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        appointmentDate: finalAppointmentDate,
        appointmentTime: finalAppointmentTime,
        tokenNumber,
        status: 'SCHEDULED',
        isActive: true,
        appointmentType,
        purpose: purpose || appointmentType,
        notes:
          notes ||
          (isInstant
            ? `Instant appointment booked by ${staff.firstName} ${staff.lastName}`
            : `Scheduled appointment booked by ${staff.firstName} ${staff.lastName}`),
        estimatedDuration: 30
      },
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
        }
      }
    });

    /* -------------------- RESPONSE -------------------- */
    return res.status(201).json({
      success: true,
      message: isInstant
        ? 'Instant appointment booked successfully'
        : 'Appointment scheduled successfully',
      data: {
        appointment: {
          id: appointment.id,
          patientId: appointment.patientId,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          tokenNumber: appointment.tokenNumber,
          status: appointment.status,
          appointmentType: appointment.appointmentType,
          purpose: appointment.purpose,
          notes: appointment.notes,
          patient: appointment.patient
        },
        bookedBy: {
          staffId: staff.id,
          staffName: `${staff.firstName} ${staff.lastName}`,
          staffType: staff.staffType
        },
        bookingMode: isInstant ? 'INSTANT' : 'SCHEDULED'
      }
    });

  } catch (error) {
    console.error('❌ Error booking appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



/**
 * Add patient to optometrist queue by token number (Staff function)
 */
const addPatientToQueue = async (req, res) => {
  try {
    const { tokenNumber, priorityLabel } = req.body;

    console.log('🎯 Staff adding patient to queue:', {
      tokenNumber,
      priorityLabel,
      staffId: req.user.id,
      staffType: req.user.staffType
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

    // Use the patient service to check in the patient
    const result = await patientService.checkInPatientByToken(tokenNumber, priorityLabel || 'ROUTINE');

    console.log(`✅ Patient added to queue by staff: Token ${tokenNumber}`);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        ...result,
        addedBy: {
          staffId: req.user.id,
          staffName: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error adding patient to queue:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add patient to queue'
    });
  }
};

/**
 * Get all checked-in patients (appointment status = CHECKED_IN)
 */
const getCheckedInPatients = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get all appointments with CHECKED_IN status for today
    const checkedInAppointments = await prisma.appointment.findMany({
      where: {
        status: 'CHECKED_IN',
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
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
            patientQueue: {
              orderBy: {
                queueNumber: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        appointmentTime: 'asc'
      }
    });

    const checkedInPatients = checkedInAppointments.map(appointment => ({
      appointmentId: appointment.id,
      tokenNumber: appointment.tokenNumber,
      appointmentTime: appointment.appointmentTime,
      patient: appointment.patient,
      doctor: appointment.doctor,
      visit: appointment.patientVisit ? {
        id: appointment.patientVisit.id,
        visitNumber: appointment.patientVisit.visitNumber,
        status: appointment.patientVisit.status,
        checkedInAt: appointment.patientVisit.checkedInAt
      } : null,
      queueInfo: appointment.patientVisit?.patientQueue?.[0] ? {
        id: appointment.patientVisit.patientQueue[0].id,
        queueFor: appointment.patientVisit.patientQueue[0].queueFor,
        queueNumber: appointment.patientVisit.patientQueue[0].queueNumber,
        priorityLabel: appointment.patientVisit.patientQueue[0].priorityLabel,
        status: appointment.patientVisit.patientQueue[0].status
      } : null
    }));

    console.log(`✅ Retrieved ${checkedInPatients.length} checked-in patients`);

    res.status(200).json({
      success: true,
      message: `Found ${checkedInPatients.length} checked-in patients`,
      data: {
        totalCount: checkedInPatients.length,
        patients: checkedInPatients
      }
    });

  } catch (error) {
    console.error('❌ Error getting checked-in patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get checked-in patients'
    });
  }
};

/**
 * Update priority label for a patient in queue
 */
const updateQueuePriority = async (req, res) => {
  try {
    const { queueEntryId } = req.params;
    const { priorityLabel } = req.body;

    console.log('🎯 Staff updating queue priority:', {
      queueEntryId,
      priorityLabel,
      staffId: req.user.id
    });

    // Validate required fields
    if (!priorityLabel) {
      return res.status(400).json({
        success: false,
        message: 'Priority label is required'
      });
    }

    // Validate priority label
    const validPriorityLabels = [
      'PRIORITY', 'EMERGENCY', 'CHILDREN', 'SENIORS',
      'LONGWAIT', 'REFERRAL', 'FOLLOWUP', 'ROUTINE', 'PREPOSTOP'
    ];

    if (!validPriorityLabels.includes(priorityLabel)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority label. Must be one of: ${validPriorityLabels.join(', ')}`
      });
    }

    // Find and update the queue entry
    const queueEntry = await prisma.patientQueue.findUnique({
      where: { id: queueEntryId },
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
                tokenNumber: true
              }
            }
          }
        }
      }
    });

    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found'
      });
    }

    if (!queueEntry.patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient information not found for this queue entry'
      });
    }

    // Update priority label
    const updatedQueueEntry = await prisma.patientQueue.update({
      where: { id: queueEntryId },
      data: {
        priorityLabel,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Priority updated for queue entry ${queueEntryId}: ${priorityLabel}`);

    res.status(200).json({
      success: true,
      message: 'Priority label updated successfully',
      data: {
        queueEntry: {
          id: updatedQueueEntry.id,
          queueNumber: updatedQueueEntry.queueNumber,
          priorityLabel: updatedQueueEntry.priorityLabel,
          queueFor: updatedQueueEntry.queueFor,
          status: updatedQueueEntry.status
        },
        patient: {
          patientNumber: queueEntry.patient?.patientNumber,
          name: `${queueEntry.patient?.firstName || ''} ${queueEntry.patient?.lastName || ''}`.trim(),
          tokenNumber: queueEntry.patientVisit?.appointment?.tokenNumber
        },
        updatedBy: {
          staffId: req.user.id,
          staffName: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error updating queue priority:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update priority label'
    });
  }
};

/**
 * Get dashboard statistics for today's registrations and appointments
 */
const getDashboardStatistics = async (req, res) => {
  try {


    // Get today's date range (start of day to end of day)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);



    // Get today's patient registrations count
    const todayRegistrations = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Get today's appointments booked count
    const todayAppointments = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Calculate average wait time for patients in OPTOMETRIST queue
    const waitingPatients = await prisma.patientQueue.findMany({
      where: {
        queueFor: 'OPTOMETRIST',
        status: 'WAITING',
        joinedAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: {
        joinedAt: true
      }
    });

    let averageWaitTime = 0;
    if (waitingPatients.length > 0) {
      const currentTime = new Date();
      const totalWaitTime = waitingPatients.reduce((sum, patient) => {
        const waitTime = Math.floor((currentTime - new Date(patient.joinedAt)) / (1000 * 60)); // in minutes
        return sum + waitTime;
      }, 0);
      averageWaitTime = Math.round(totalWaitTime / waitingPatients.length);
    }

    // Calculate average consultation time for OPTOMETRIST queue
    // Using the same logic as optometrist dashboard - based on actual examination records
    const completedExaminations = await prisma.optometristExamination.findMany({
      where: {
        completedAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        patientVisit: {
          select: {
            id: true,
            optometristCalledAt: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 50 // Last 50 examinations for accuracy
    });

    console.log(`📊 Found ${completedExaminations.length} completed examinations for today`);

    let averageConsultationTime = 0;
    if (completedExaminations.length > 0) {
      let totalConsultationTime = 0;
      let consultationCount = 0;

      completedExaminations.forEach(exam => {
        const optometristCalledAt = exam.patientVisit?.optometristCalledAt;
        
        // Consultation time: from optometristCalledAt to completedAt
        if (exam.completedAt && optometristCalledAt) {
          const startTime = new Date(optometristCalledAt);
          const endTime = new Date(exam.completedAt);
          const durationMs = endTime - startTime;
          const durationMinutes = Math.abs(durationMs) / (1000 * 60);
          
          if (durationMinutes > 0 && durationMinutes < 300) { // Exclude outliers > 5 hours
            totalConsultationTime += durationMinutes;
            consultationCount++;
          }
        }
      });

      // Calculate average consultation time
      if (consultationCount > 0) {
        averageConsultationTime = Math.ceil(totalConsultationTime / consultationCount);
        console.log(`✅ Average consultation time: ${averageConsultationTime} minutes (from ${consultationCount} valid consultations)`);
      } else {
        console.log(`⚠️ No valid consultations found with both optometristCalledAt and completedAt timestamps`);
      }
    } else {
      console.log(`⚠️ No completed examinations found for today`);
    }


    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        registrationsToday: todayRegistrations,
        appointmentsBooked: todayAppointments,
        averageWaitTime: averageWaitTime,
        averageConsultationTime: averageConsultationTime,
        date: today.toISOString().split('T')[0] // Return date for reference
      }
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Get patient IDs who have appointments today and future appointments
const getTodayAppointmentPatients = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfTomorrow = new Date(today);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    startOfTomorrow.setHours(0, 0, 0, 0);

    // Fetch ALL appointments for today (no status filter)
    // Let frontend determine if appointment is active or finished
    const todayAppointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        }
        // No status filter - return all appointments regardless of status
      },
      select: {
        id: true,
        patientId: true,
        status: true,
        isActive: true,
        appointmentTime: true,
        tokenNumber: true,
        appointmentDate: true
      }
    });

    // Also fetch any active appointments from previous days (CHECKED_IN only).
    // A stale past-date SCHEDULED appointment with isActive=true (cron not yet run) must NOT
    // be treated as a resumed consultation — only genuinely in-progress (CHECKED_IN) visits qualify.
    const activeFromPreviousDays = await prisma.appointment.findMany({
      where: {
        isActive: true,
        status: { in: ['CHECKED_IN'] }, // Only truly in-progress, not stale SCHEDULED
        appointmentDate: {
          lt: startOfDay // Before today
        }
      },
      select: {
        id: true,
        patientId: true,
        status: true,
        isActive: true,
        appointmentTime: true,
        tokenNumber: true,
        appointmentDate: true
      }
    });

    // Fetch future appointments (tomorrow onwards)
    const futureAppointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startOfTomorrow
        },
        status: {
          in: ['SCHEDULED']
        }
      },
      select: {
        patientId: true,
        appointmentDate: true,
        appointmentTime: true,
        appointmentType: true
      },
      orderBy: {
        appointmentDate: 'asc'
      }
    });

    // Map today's appointments with isActive flag from schema for frontend
    const todayAppointmentsWithStatus = todayAppointments.map(apt => ({
      id: apt.id,
      patientId: apt.patientId,
      status: apt.status,
      isActive: apt.isActive  // Use schema-level isActive (single source of truth)
    }));

    // Map active appointments from previous days (resumed partial consultations)
    const resumedAppointmentsWithStatus = activeFromPreviousDays.map(apt => ({
      id: apt.id,
      patientId: apt.patientId,
      status: apt.status,
      isActive: apt.isActive,
      appointmentDate: apt.appointmentDate,
      isResumed: true  // Flag to indicate this is a resumed appointment from a previous day
    }));

    // Combine today's appointments and active previous-day appointments
    const allActiveAppointments = [...todayAppointmentsWithStatus, ...resumedAppointmentsWithStatus];

    // Legacy support: Get unique patient IDs who have appointments today
    const todayPatientIds = [...new Set(todayAppointments.map(apt => apt.patientId))];

    // Patient IDs that are blocked from booking.
    // Block only when the patient has a GENUINELY active appointment:
    //   • CHECKED_IN: patient is physically in the hospital (any date)
    //   • SCHEDULED / RESCHEDULED: appointment is for TODAY or a future date
    // Stale past-date SCHEDULED appointments (cron not yet run) must NOT block rebooking.
    const blockedPatientIds = [...new Set(
      allActiveAppointments
        .filter(apt => {
          if (!apt.isActive) return false;
          const status = apt.status?.toUpperCase();
          if (status === 'CHECKED_IN') return true; // Always block if physically in hospital
          const aptDate = new Date(apt.appointmentDate);
          aptDate.setHours(0, 0, 0, 0);
          return (status === 'SCHEDULED' || status === 'RESCHEDULED') && aptDate >= startOfDay;
        })
        .map(apt => apt.patientId)
    )];

    // Group future appointments by patient (get the nearest future appointment for each patient)
    const futureAppointmentsMap = {};
    futureAppointments.forEach(apt => {
      if (!futureAppointmentsMap[apt.patientId]) {
        futureAppointmentsMap[apt.patientId] = {
          appointmentDate: apt.appointmentDate,
          appointmentTime: apt.appointmentTime,
          appointmentType: apt.appointmentType
        };
      }
    });

    res.status(200).json({
      success: true,
      data: {
        // New structure with full appointment details  
        todayAppointments: todayAppointmentsWithStatus,
        // Active appointments resumed from previous days
        activeResumedAppointments: resumedAppointmentsWithStatus,
        // Patient IDs blocked from booking (have isActive=true anywhere)
        blockedPatientIds,
        // Legacy field for backward compatibility
        todayPatientIds,
        futureAppointments: futureAppointmentsMap,
        count: todayPatientIds.length
      }
    });
  } catch (error) {
    console.error('Error fetching appointment patients:', error);
    res.status(500).json({
      error: 'Failed to fetch appointments',
      details: error.message
    });
  }
};

/**
 * Get patients by phone number - for checking existing patients during registration
 * GET /api/v1/staff/check-existing-patients-by-phone?phone=1234567890
 */
const getPatientsByPhone = async (req, res) => {
  try {
    const { phone } = req.query;

    // Validate phone parameter
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
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

    console.log(`🔍 Searching for patients with phone number: ${phone}`);

    // Search for all patients with this phone number
    const patients = await prisma.patient.findMany({
      where: {
        phone: phone.trim()
      },
      select: {
        id: true,
        patientNumber: true,
        mrn: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        createdAt: true,
        // Include visit count
        _count: {
          select: {
            patientVisits: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Compute fullName for each patient
    const patientsWithFullName = patients.map(patient => ({
      ...patient,
      fullName: `${patient.firstName} ${patient.middleName} ${patient.lastName}`.trim()
    }));

    console.log(`✅ Found ${patients.length} patient(s) with phone number: ${phone}`);

    res.status(200).json({
      success: true,
      message: patients.length > 0 
        ? `Found ${patients.length} existing patient(s) with this phone number` 
        : 'No existing patients found with this phone number',
      data: {
        patients: patientsWithFullName,
        count: patients.length,
        hasExistingPatients: patients.length > 0
      }
    });

  } catch (error) {
    console.error('❌ Error checking for existing patients by phone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check for existing patients',
      error: error.message
    });
  }
};

/**
 * Get appointments by date with slot-wise booking counts
 */
const getAppointmentsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    console.log(`📅 Fetching appointments for date: ${date}`);

    // Parse the date and create date range
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    // Fetch all appointments for the selected date
    const appointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        }
        // Include all appointments regardless of status for counting
      },
      select: {
        id: true,
        appointmentTime: true,
        status: true,
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        appointmentTime: 'asc'
      }
    });

    console.log(`📋 Found ${appointments.length} total appointments for ${date}`);
    console.log('Appointment times:', appointments.map(a => ({ time: a.appointmentTime, status: a.status })));

    // Helper function to convert time to 24-hour format and round to nearest 30-minute slot
    const roundToSlot = (timeString) => {
      let hours, minutes;
      
      // Check if time includes AM/PM
      if (timeString.includes('AM') || timeString.includes('PM')) {
        // Parse 12-hour format (e.g., "04:23 PM")
        const isPM = timeString.includes('PM');
        const timeOnly = timeString.replace(/\s?(AM|PM)/gi, '').trim();
        const [hoursStr, minutesStr] = timeOnly.split(':');
        
        hours = parseInt(hoursStr, 10);
        minutes = parseInt(minutesStr, 10);
        
        // Convert to 24-hour format
        if (isPM && hours !== 12) {
          hours += 12;
        } else if (!isPM && hours === 12) {
          hours = 0;
        }
      } else {
        // Parse 24-hour format (e.g., "16:30")
        const [hoursStr, minutesStr] = timeString.split(':');
        hours = parseInt(hoursStr, 10);
        minutes = parseInt(minutesStr, 10);
      }
      
      // Round minutes to nearest 30-minute slot
      const slotMinutes = Math.floor(minutes / 30) * 30;
      return `${hours.toString().padStart(2, '0')}:${slotMinutes.toString().padStart(2, '0')}`;
    };

    // Generate time slots from 8:00 AM to 6:00 PM with 30-minute intervals
    const timeSlots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip the 6:30 PM slot (we only want up to 6:00 PM)
        if (hour === 18 && minute === 30) continue;

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Count appointments in this slot by rounding their times to nearest slot
        const slotAppointments = appointments.filter(apt => {
          const appointmentSlot = roundToSlot(apt.appointmentTime);
          return appointmentSlot === timeString;
        });
        
        timeSlots.push({
          time: timeString,
          displayTime: new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          appointmentCount: slotAppointments.length,
          appointments: slotAppointments.map(apt => ({
            id: apt.id,
            patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
            status: apt.status
          }))
        });
      }
    }

    // Calculate summary statistics
    const totalBooked = appointments.length;
    const totalSlots = timeSlots.length;
    const availableSlots = timeSlots.filter(slot => slot.appointmentCount === 0).length;
    const partiallyBookedSlots = timeSlots.filter(slot => slot.appointmentCount > 0 && slot.appointmentCount < 5).length;
    const fullyBookedSlots = timeSlots.filter(slot => slot.appointmentCount >= 5).length;

    res.status(200).json({
      success: true,
      message: `Found ${totalBooked} appointments for ${date}`,
      data: {
        date,
        timeSlots,
        summary: {
          totalBooked,
          totalSlots,
          availableSlots,
          partiallyBookedSlots,
          fullyBookedSlots
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching appointments by date:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments for the selected date',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get patient appointments by patient ID (for staff to view appointment history)
 */
const getPatientAppointmentsByStaff = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    console.log('🔍 Staff requesting patient appointments:', {
      staffId: req.user.id,
      staffName: `${req.user.firstName} ${req.user.lastName}`,
      patientId,
      requestTime: new Date().toISOString()
    });

    // Get patient details
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        patientNumber: true,
        mrn: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        bloodGroup: true,
        patientStatus: true
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get all appointments for this patient (past and future)
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientId
      },
      orderBy: [
        { appointmentDate: 'desc' },
        { appointmentTime: 'desc' }
      ],
      include: {
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
            visitDate: true,
            visitType: true,
            chiefComplaint: true,
            status: true,
            followUpDate: true,
            visitOutcome: true,
            presentingSymptoms: true,
            checkedInAt: true,
            diagnoses: {
              select: {
                id: true,
                diagnosisType: true,
                severity: true,
                eyeAffected: true,
                notes: true,
                disease: {
                  select: {
                    id: true,
                    diseaseName: true,
                    ophthalmologyCategory: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Separate past and future appointments
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    todayStart.setHours(0, 0, 0, 0);
    
    const pastAppointments = [];
    const futureAppointments = [];
    
    appointments.forEach(apt => {
      const aptDate = new Date(apt.appointmentDate);
      aptDate.setHours(0, 0, 0, 0);
      
      // If appointment date is before today, it's past
      // If appointment date is today or future, it's upcoming
      if (aptDate < todayStart) {
        pastAppointments.push(apt);
      } else {
        futureAppointments.push(apt);
      }
    });

    console.log(`✅ Found ${appointments.length} appointments for patient ${patient.patientNumber} (${pastAppointments.length} past, ${futureAppointments.length} future)`);

    res.status(200).json({
      success: true,
      message: 'Patient appointments retrieved successfully',
      data: {
        patient: {
          ...patient,
          fullName: `${patient.firstName} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName}`
        },
        appointments: {
          all: appointments,
          past: pastAppointments,
          future: futureAppointments
        },
        counts: {
          total: appointments.length,
          past: pastAppointments.length,
          future: futureAppointments.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching patient appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reschedule appointment
const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId, newDate, newTime } = req.body;

    console.log('🔄 Rescheduling appointment:', { appointmentId, newDate, newTime });

    // Validate input
    if (!appointmentId || !newDate || !newTime) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID, new date, and new time are required'
      });
    }

    // Get the existing appointment
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment is in SCHEDULED status
    if (existingAppointment.status?.toLowerCase() !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled appointments can be rescheduled'
      });
    }

    // Parse dates for comparison
    const oldDate = new Date(existingAppointment.appointmentDate);
    const newDateObj = new Date(newDate);

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        appointmentDate: newDateObj,
        appointmentTime: newTime,
        rescheduledFrom: existingAppointment.appointmentDate.toISOString(),
        rescheduledTo: newDateObj.toISOString(),
        updatedAt: new Date()
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
            email: true
          }
        }
      }
    });

    console.log('✅ Appointment rescheduled successfully');

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: {
        appointment: updatedAppointment,
        oldDate: oldDate.toISOString().split('T')[0],
        oldTime: existingAppointment.appointmentTime,
        newDate: newDate,
        newTime: newTime
      }
    });
  } catch (error) {
    console.error('❌ Error rescheduling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule appointment',
      error: error.message
    });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId, cancelReason } = req.body;

    console.log('❌ Cancelling appointment:', { appointmentId, cancelReason });

    // Validate input
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    // Get the existing appointment
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Only SCHEDULED appointments can be cancelled
    if (existingAppointment.status?.toLowerCase() !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled appointments can be cancelled'
      });
    }

    // Update the appointment status to CANCELLED
    const cancelledAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'CANCELLED',
        isActive: false,
        cancelReason: cancelReason || null,
        updatedAt: new Date()
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
            email: true
          }
        }
      }
    });

    console.log('✅ Appointment cancelled successfully');

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        appointment: cancelledAppointment
      }
    });
  } catch (error) {
    console.error('❌ Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
};

module.exports = {
  loginStaff,
  logoutStaff,
  getStaffProfile,
  updateStaffProfile,
  changeStaffPassword,
  registerPatientByStaff,
  registerPatientWithAppointmentTime,
  registerPatientByPatient,
  getTodayAppointments,
  getTodayAppointmentPatients,
  getDailyAppointments,
  getAllFutureAppointments,
  getPatientById,
  getWeeklyPatientArrivals,
  getDashboardStatistics,
  getAllPatients,
  bookInstantAppointmentByStaff,
  uploadProfilePhoto,
  generateToken,
  addPatientToQueue,
  getCheckedInPatients,
  updateQueuePriority,
  getPatientsByPhone,
  getAppointmentsByDate,
  getPatientAppointmentsByStaff,
  rescheduleAppointment,
  cancelAppointment
};