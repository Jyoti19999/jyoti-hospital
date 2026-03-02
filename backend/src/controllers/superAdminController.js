const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { JWT_SECRET } = require('../middleware/auth');
const emailService = require('../services/emailService');
const otpService = require('../services/otpService');
const { moveFilesToEmployeeFolder, cleanupTempFiles } = require('../middleware/upload');

// Generate JWT token for super admin
const generateToken = (superAdmin) => {
  return jwt.sign(
    {
      id: superAdmin.id,
      email: superAdmin.email,
      userType: 'super_admin'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// ==================== STAFF MANAGEMENT FUNCTIONS (SuperAdmin Only) ====================

// Helper function to generate employee ID
const generateEmployeeId = async (staffType) => {
  // Get department prefix
  const prefixes = {
    doctor: 'DOC',
    nurse: 'NUR',
    technician: 'TEC',
    admin: 'ADM',
    receptionist: 'REC',
    receptionist2: 'RC2',
    optometrist: 'OPT',
    accountant: 'ACC',
    'quality-coordinator': 'QC',
    'quality_coordinator': 'QC',
    'patient-safety-officer': 'PSO',
    'patient_safety_officer': 'PSO',
    'ot-admin': 'OTA',
    'ot_admin': 'OTA',
    anesthesiologist: 'ANE',
    surgeon: 'SUR',
    sister: 'SIS',
    tpa: 'TPA'
  };

  const prefix = prefixes[staffType] || 'STF';

  // Get the latest staff count for this type
  const count = await prisma.staff.count({
    where: { staffType }
  });

  // Generate sequential number with padding
  const sequence = (count + 1).toString().padStart(4, '0');

  return `${prefix}${sequence}`;
};

// Helper function to validate role-specific data
const validateRoleSpecificData = (staffType, roleSpecificData) => {
  const errors = [];

  switch (staffType) {
    case 'doctor':
      if (!roleSpecificData.medicalLicenseNumber) {
        errors.push('Medical license number is required for doctors');
      }
      if (!roleSpecificData.medicalCouncil) {
        errors.push('Medical council is required for doctors');
      }
      if (!roleSpecificData.consultationFee || roleSpecificData.consultationFee <= 0) {
        errors.push('Valid consultation fee is required for doctors');
      }
      break;

    case 'nurse':
      if (!roleSpecificData.nursingLicenseNumber) {
        errors.push('Nursing license number is required for nurses');
      }
      if (!roleSpecificData.nursingDegree) {
        errors.push('Nursing degree is required for nurses');
      }
      if (!roleSpecificData.shiftType) {
        errors.push('Shift type is required for nurses');
      }
      break;

    case 'technician':
      if (!roleSpecificData.technicianCertification) {
        errors.push('Technician certification is required');
      }
      if (!roleSpecificData.diagnosticEquipment || roleSpecificData.diagnosticEquipment.length === 0) {
        errors.push('At least one equipment proficiency is required for technicians');
      }
      break;

    case 'optometrist':
      if (!roleSpecificData.optometryLicenseNumber) {
        errors.push('Optometry license number is required');
      }
      if (!roleSpecificData.optometryDegree) {
        errors.push('Optometry degree is required');
      }
      break;

    case 'accountant':
      if (!roleSpecificData.accountingCertifications || roleSpecificData.accountingCertifications.length === 0) {
        errors.push('At least one accounting certification is required');
      }
      if (!roleSpecificData.specialization) {
        errors.push('Specialization area is required for accountants');
      }
      break;

    case 'quality-coordinator':
    case 'quality_coordinator':
      if (!roleSpecificData.qualityCertifications || roleSpecificData.qualityCertifications.length === 0) {
        errors.push('At least one quality certification is required');
      }
      if (!roleSpecificData.auditExperience) {
        errors.push('Audit experience level is required');
      }
      break;

    case 'patient-safety-officer':
    case 'patient_safety_officer':
      if (!roleSpecificData.safetyCertifications || roleSpecificData.safetyCertifications.length === 0) {
        errors.push('At least one safety certification is required');
      }
      if (!roleSpecificData.riskAreas || roleSpecificData.riskAreas.length === 0) {
        errors.push('At least one risk management area is required');
      }
      break;

    case 'technician':
      // Basic validation for technicians
      if (!roleSpecificData.specialization) {
        errors.push('Specialization is required for technicians');
      }
      break;

    case 'admin':
      // Admin has basic requirements
      break;

    case 'receptionist':
      if (!roleSpecificData.shiftTiming) {
        errors.push('Shift timing is required for receptionists');
      }
      break;

    case 'receptionist2':
      if (!roleSpecificData.shiftTiming) {
        errors.push('Shift timing is required for receptionist2');
      }
      break;

    // New OT staff types
    case 'ot-admin':
    case 'ot_admin':
      if (!roleSpecificData.otLicenseNumber) {
        errors.push('OT license number is required for OT administrators');
      }
      if (!roleSpecificData.adminCertification) {
        errors.push('Hospital administration certification is required for OT administrators');
      }
      if (!roleSpecificData.otRoomsManaged || roleSpecificData.otRoomsManaged <= 0) {
        errors.push('Number of OT rooms managed is required for OT administrators');
      }
      if (!roleSpecificData.shiftSchedule) {
        errors.push('Shift schedule is required for OT administrators');
      }
      break;

    case 'anesthesiologist':
      if (!roleSpecificData.medicalLicenseNumber) {
        errors.push('Medical license number is required for anesthesiologists');
      }
      if (!roleSpecificData.anesthesiaCertification) {
        errors.push('Anesthesia board certification is required');
      }
      if (!roleSpecificData.medicalCouncil) {
        errors.push('Medical council registration is required');
      }
      if (!roleSpecificData.licenseExpiry) {
        errors.push('License expiry date is required');
      }
      break;

    case 'surgeon':
      if (!roleSpecificData.medicalLicenseNumber) {
        errors.push('Medical license number is required for surgeons');
      }
      if (!roleSpecificData.surgicalCertification) {
        errors.push('Surgical board certification is required');
      }
      if (!roleSpecificData.medicalCouncil) {
        errors.push('Medical council registration is required');
      }
      if (!roleSpecificData.surgeryFee || roleSpecificData.surgeryFee <= 0) {
        errors.push('Valid surgery fee is required for surgeons');
      }
      break;

    case 'sister':
      if (!roleSpecificData.nursingRegistrationNumber) {
        errors.push('Nursing registration number is required for sisters/head nurses');
      }
      if (!roleSpecificData.nursingCouncil) {
        errors.push('Nursing council is required for sisters/head nurses');
      }
      if (!roleSpecificData.nursingQualification) {
        errors.push('Nursing qualification is required for sisters/head nurses');
      }
      if (!roleSpecificData.otExperienceLevel) {
        errors.push('OT experience level is required for sisters/head nurses');
      }
      break;

    case 'tpa':
      // TPA (Third Party Administrator) validation
      if (!roleSpecificData.tpaLicenseNumber) {
        errors.push('TPA license number is required for TPA staff');
      }
      if (!roleSpecificData.insuranceExperience) {
        errors.push('Insurance experience level is required for TPA staff');
      }
      if (!roleSpecificData.companyAffiliation) {
        errors.push('Company affiliation is required for TPA staff');
      }
      if (!roleSpecificData.certifications || roleSpecificData.certifications.length === 0) {
        errors.push('At least one TPA certification is required');
      }
      break;

    default:
      errors.push('Invalid staff type');
  }

  return errors;
};

// Helper function to prepare staff data for database
const prepareStaffData = (requestData) => {
  const { roleSpecificData, ...basicData } = requestData;
  const staffType = basicData.staffType;

  // Create the profile field name dynamically
  let profileField;

  switch (staffType) {
    case 'doctor':
      profileField = 'doctorProfile';
      break;
    case 'nurse':
      profileField = 'nurseProfile';
      break;
    case 'technician':
      profileField = 'technicianProfile';
      break;
    case 'admin':
      profileField = 'adminProfile';
      break;
    case 'receptionist':
      profileField = 'receptionistProfile';
      break;
    case 'receptionist2':
      profileField = 'receptionist2Profile';
      break;
    case 'optometrist':
      profileField = 'optometristProfile';
      break;
    case 'accountant':
      profileField = 'accountantProfile';
      break;
    case 'quality-coordinator':
    case 'quality_coordinator':
      profileField = 'qualityCoordinatorProfile';
      break;
    case 'patient-safety-officer':
    case 'patient_safety_officer':
      profileField = 'patientSafetyOfficerProfile';
      break;
    // New OT staff types
    case 'ot-admin':
    case 'ot_admin':
      profileField = 'otAdminProfile';
      break;
    case 'anesthesiologist':
      profileField = 'anesthesiologistProfile';
      break;
    case 'surgeon':
      profileField = 'surgeonProfile';
      break;
    case 'sister':
      profileField = 'sisterProfile';
      break;
    case 'tpa':
      profileField = 'tpaProfile';
      break;
    default:
      profileField = 'adminProfile'; // fallback
  }

  // Prepare the data object
  const staffData = {
    ...basicData,
    [profileField]: roleSpecificData
  };

  // Set other profile fields to null
  const allProfileFields = [
    'doctorProfile', 'nurseProfile', 'technicianProfile', 'adminProfile',
    'receptionistProfile', 'receptionist2Profile', 'optometristProfile', 'accountantProfile',
    'qualityCoordinatorProfile', 'patientSafetyOfficerProfile',
    'otAdminProfile', 'anesthesiologistProfile', 'surgeonProfile', 'sisterProfile', 'tpaProfile'
  ];

  allProfileFields.forEach(field => {
    if (field !== profileField) {
      staffData[field] = null;
    }
  });

  return staffData;
};

// Create new staff member (SuperAdmin only)
const createStaff = async (req, res) => {
  try {
    // Handle both FormData (with files) and JSON (without files) requests
    let parsedData;
    const contentType = req.get('Content-Type') || '';

    console.log('📋 Processing staff registration:', {
      contentType,
      hasStaffDataField: !!req.body.staffData,
      hasFiles: !!(req.files && Object.keys(req.files).length > 0),
      bodyKeys: Object.keys(req.body)
    });

    if (req.body.staffData) {
      // FormData request - parse the JSON string
      try {
        parsedData = JSON.parse(req.body.staffData);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        return res.status(400).json({
          error: 'Invalid data format',
          message: 'Failed to parse staff data from FormData'
        });
      }
    } else {
      // Regular JSON request
      parsedData = req.body;
    }

    const { roleSpecificData, ...basicData } = parsedData;
    const { staffType } = basicData;
    const files = req.files || {};

    console.log('📋 Parsed staff data:', {
      staffType,
      hasRoleSpecificData: !!roleSpecificData,
      fileCount: Object.keys(files).length
    });

    // Validate role-specific data
    const validationErrors = validateRoleSpecificData(staffType, roleSpecificData);
    if (validationErrors.length > 0) {
      // Clean up uploaded files on validation error
      await cleanupTempFiles(files);
      return res.status(400).json({
        error: 'Role-specific validation failed',
        details: validationErrors
      });
    }

    // Check if email already exists
    if (basicData.email) {
      const existingStaff = await prisma.staff.findUnique({
        where: { email: basicData.email }
      });

      if (existingStaff) {
        // Clean up uploaded files on email conflict
        await cleanupTempFiles(files);
        return res.status(409).json({
          error: 'Email already exists',
          message: 'A staff member with this email already exists'
        });
      }
    }

    // Generate employee ID
    const employeeId = await generateEmployeeId(staffType);

    // Generate default password
    const defaultPassword = `${staffType.charAt(0).toUpperCase() + staffType.slice(1)}@123`;
    const saltRounds = 3;
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

    let filePaths = { profilePhoto: null, documents: [] };

    try {
      // Move uploaded files to employee folder
      if (files.profilePhoto || files.documents) {
        filePaths = await moveFilesToEmployeeFolder(employeeId, files);
      }
    } catch (fileError) {
      console.error('File handling error:', fileError);
      // Clean up any partially moved files and temp files
      await cleanupTempFiles(files);
      return res.status(500).json({
        error: 'File upload failed',
        message: 'Failed to process uploaded files'
      });
    }

    // Prepare staff data
    const staffData = prepareStaffData({ ...basicData, roleSpecificData });

    // Add generated fields and file paths
    staffData.employeeId = employeeId;
    staffData.passwordHash = passwordHash;
    staffData.isActive = true;
    staffData.profilePhoto = filePaths.profilePhoto;
    staffData.documents = filePaths.documents;

    // Handle monthlySalary if provided
    if (staffData.monthlySalary !== undefined && staffData.monthlySalary !== null) {
      staffData.monthlySalary = parseFloat(staffData.monthlySalary);
    } else {
      staffData.monthlySalary = null;
    }
    if (staffData.salaryEffectiveFrom) {
      staffData.salaryEffectiveFrom = new Date(staffData.salaryEffectiveFrom);
    }

    // Convert date strings to Date objects
    if (staffData.dateOfBirth) {
      staffData.dateOfBirth = new Date(staffData.dateOfBirth);
    }
    if (staffData.joiningDate) {
      staffData.joiningDate = new Date(staffData.joiningDate);
    } else {
      staffData.joiningDate = new Date();
    }

    // Create staff member
    const newStaff = await prisma.staff.create({
      data: staffData,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        phone: true,
        staffType: true,
        department: true,
        profilePhoto: true,
        documents: true,
        isActive: true,
        createdAt: true,
        // Dynamically select the appropriate profile
        doctorProfile: staffType === 'doctor',
        nurseProfile: staffType === 'nurse',
        technicianProfile: staffType === 'technician',
        adminProfile: staffType === 'admin',
        receptionistProfile: staffType === 'receptionist',
        receptionist2Profile: staffType === 'receptionist2',
        optometristProfile: staffType === 'optometrist',
        accountantProfile: staffType === 'accountant',
        qualityCoordinatorProfile: staffType === 'quality-coordinator' || staffType === 'quality_coordinator',
        patientSafetyOfficerProfile: staffType === 'patient-safety-officer' || staffType === 'patient_safety_officer',
        // New OT staff profiles
        otAdminProfile: staffType === 'ot-admin' || staffType === 'ot_admin',
        anesthesiologistProfile: staffType === 'anesthesiologist',
        surgeonProfile: staffType === 'surgeon',
        sisterProfile: staffType === 'sister',
        tpaProfile: staffType === 'tpa'
      }
    });

    console.log(`✅ New ${staffType} created by SuperAdmin: ${newStaff.firstName} ${newStaff.lastName} (${newStaff.employeeId})`);
    console.log(`📁 Files uploaded: Profile Photo: ${!!filePaths.profilePhoto}, Documents: ${filePaths.documents.length}`);

    // Send welcome email with credentials to the new staff member
    try {
      console.log(`📧 Sending welcome email to ${newStaff.email}...`);
      const emailResult = await emailService.sendStaffWelcomeEmail(
        newStaff.email,
        newStaff.firstName,
        newStaff.lastName,
        staffType,
        employeeId,
        defaultPassword,
        basicData.department
      );

      console.log(`✅ Welcome email sent successfully to ${newStaff.email}`);
      if (emailResult.previewUrl) {
        console.log(`📧 Email preview: ${emailResult.previewUrl}`);
      }
    } catch (emailError) {
      console.error(`❌ Failed to send welcome email to ${newStaff.email}:`, emailError.message);
      // Don't fail the entire registration if email fails - just log the error
    }

    res.status(201).json({
      success: true,
      message: `${staffType.charAt(0).toUpperCase() + staffType.slice(1)} registered successfully`,
      data: {
        staff: newStaff,
        credentials: {
          employeeId: employeeId,
          defaultPassword: defaultPassword,
          message: 'Please share these credentials securely with the staff member'
        },
        files: {
          profilePhoto: !!filePaths.profilePhoto,
          documentsUploaded: filePaths.documents.length
        },
        email: {
          sent: true,
          message: 'Welcome email with credentials sent to staff member'
        }
      }
    });

  } catch (error) {
    console.error('Staff creation error:', error);

    // Clean up uploaded files on any error
    if (req.files) {
      await cleanupTempFiles(req.files);
    }

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'A staff member with this email or employee ID already exists'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create staff member'
    });
  }
};

// Get all staff members with filtering (SuperAdmin only)
const getAllStaff = async (req, res) => {
  try {
    const {
      staffType,
      department,
      isActive,
      page = 1,
      limit = 20,
      search
    } = req.query;

    // Build filter conditions
    const where = {};

    if (staffType) {
      where.staffType = staffType;
    }

    if (department) {
      where.department = department;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Get staff members
    const [staff, totalCount] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
          phone: true,
          staffType: true,
          department: true,
          isActive: true,
          joiningDate: true,
          createdAt: true
        }
      }),
      prisma.staff.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        staff,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: take,
          totalPages: Math.ceil(totalCount / take)
        }
      }
    });

  } catch (error) {
    console.error('Get all staff error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch staff members'
    });
  }
};

// Get staff member by ID (SuperAdmin only)
const getStaffById = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id },
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
        emergencyContact: true,
        department: true,
        staffType: true,
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
      return res.status(404).json({
        error: 'Staff member not found',
        message: 'No staff member found with the provided ID'
      });
    }

    res.json({
      success: true,
      data: { staff }
    });

  } catch (error) {
    console.error('Get staff by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch staff member'
    });
  }
};

// Update staff member (SuperAdmin only)
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleSpecificData, ...basicData } = req.body;

    // Check if staff exists
    const existingStaff = await prisma.staff.findUnique({
      where: { id }
    });

    if (!existingStaff) {
      return res.status(404).json({
        error: 'Staff member not found',
        message: 'No staff member found with the provided ID'
      });
    }

    // If staffType is being changed, validate new role-specific data
    const staffType = basicData.staffType || existingStaff.staffType;
    if (roleSpecificData) {
      const validationErrors = validateRoleSpecificData(staffType, roleSpecificData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: 'Role-specific validation failed',
          details: validationErrors
        });
      }
    }

    // Check email uniqueness if email is being changed
    if (basicData.email && basicData.email !== existingStaff.email) {
      const emailExists = await prisma.staff.findUnique({
        where: { email: basicData.email }
      });

      if (emailExists) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'Another staff member with this email already exists'
        });
      }
    }

    // Prepare update data
    let updateData = { ...basicData };

    // Handle role-specific data
    if (roleSpecificData) {
      // Map staff types to their profile keys
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
        'ot-admin': 'otAdminProfile',
        'ot_admin': 'otAdminProfile',
        'anesthesiologist': 'anesthesiologistProfile',
        'surgeon': 'surgeonProfile',
        'sister': 'sisterProfile',
        'tpa': 'tpaProfile'
      };

      const profileField = profileFieldMap[staffType];
      if (profileField) {
        updateData[profileField] = roleSpecificData;
      }

      // Clear other profile fields if staff type changed
      if (basicData.staffType && basicData.staffType !== existingStaff.staffType) {
        const allProfileFields = ['doctorProfile', 'nurseProfile', 'technicianProfile', 'adminProfile', 'receptionistProfile', 'receptionist2Profile', 'optometristProfile', 'accountantProfile', 'qualityCoordinatorProfile', 'patientSafetyOfficerProfile', 'otAdminProfile', 'anesthesiologistProfile', 'surgeonProfile', 'sisterProfile', 'tpaProfile'];
        allProfileFields.forEach(field => {
          if (field !== profileField) {
            updateData[field] = null;
          }
        });
      }
    }

    // Convert date strings to Date objects
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.joiningDate) {
      updateData.joiningDate = new Date(updateData.joiningDate);
    }

    // Handle monthlySalary if provided
    if (updateData.monthlySalary !== undefined) {
      const newSalary = updateData.monthlySalary !== null ? parseFloat(updateData.monthlySalary) : null;
      const previousSalary = existingStaff.monthlySalary;

      updateData.monthlySalary = newSalary;

      // Create salary history record if salary changed
      if (newSalary !== previousSalary && (newSalary !== null || previousSalary !== null)) {
        await prisma.salaryHistory.create({
          data: {
            staffId: id,
            previousSalary,
            newSalary,
            effectiveFrom: updateData.salaryEffectiveFrom ? new Date(updateData.salaryEffectiveFrom) : new Date(),
            changedBy: req.user.id,
            reason: 'Updated via staff profile edit'
          }
        });
      }
    }
    if (updateData.salaryEffectiveFrom) {
      updateData.salaryEffectiveFrom = new Date(updateData.salaryEffectiveFrom);
    }

    // Update staff member
    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        staffType: true,
        department: true,
        isActive: true,
        updatedAt: true
      }
    });

    console.log(`✅ Staff updated by SuperAdmin: ${updatedStaff.firstName} ${updatedStaff.lastName} (${updatedStaff.employeeId})`);

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: { staff: updatedStaff }
    });

  } catch (error) {
    console.error('Staff update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update staff member'
    });
  }
};

// Deactivate staff member (SuperAdmin only)
const deactivateStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id }
    });

    if (!staff) {
      return res.status(404).json({
        error: 'Staff member not found',
        message: 'No staff member found with the provided ID'
      });
    }

    if (!staff.isActive) {
      return res.status(400).json({
        error: 'Staff already inactive',
        message: 'This staff member is already deactivated'
      });
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        isActive: false,
        employmentStatus: 'inactive'
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    console.log(`⚠️ Staff deactivated by SuperAdmin: ${updatedStaff.firstName} ${updatedStaff.lastName} (${updatedStaff.employeeId})`);

    res.json({
      success: true,
      message: 'Staff member deactivated successfully',
      data: { staff: updatedStaff }
    });

  } catch (error) {
    console.error('Staff deactivation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to deactivate staff member'
    });
  }
};

// Reactivate staff member (SuperAdmin only)
const reactivateStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id }
    });

    if (!staff) {
      return res.status(404).json({
        error: 'Staff member not found',
        message: 'No staff member found with the provided ID'
      });
    }

    if (staff.isActive) {
      return res.status(400).json({
        error: 'Staff already active',
        message: 'This staff member is already active'
      });
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        isActive: true,
        employmentStatus: 'active'
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    console.log(`✅ Staff reactivated by SuperAdmin: ${updatedStaff.firstName} ${updatedStaff.lastName} (${updatedStaff.employeeId})`);

    res.json({
      success: true,
      message: 'Staff member reactivated successfully',
      data: { staff: updatedStaff }
    });

  } catch (error) {
    console.error('Staff reactivation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to reactivate staff member'
    });
  }
};

// Delete staff member permanently (SuperAdmin only)
const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // Optional query param to force delete active staff

    const staff = await prisma.staff.findUnique({
      where: { id },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        staffType: true,
        isActive: true,
        employmentStatus: true
      }
    });

    if (!staff) {
      return res.status(404).json({
        error: 'Staff member not found',
        message: 'No staff member found with the provided ID'
      });
    }

    // Check if staff is active and force delete is not specified
    if (staff.isActive && force !== 'true') {
      return res.status(400).json({
        error: 'Cannot delete active staff',
        message: 'Staff member is currently active. Please deactivate first or use force=true query parameter',
        suggestion: 'Use PATCH /staff/:id/deactivate to deactivate first, or add ?force=true to force delete'
      });
    }

    // Delete all related records in a transaction
    await prisma.$transaction(async (tx) => {
      console.log('🔍 Starting deletion for staff:', id);

      // 1. Delete push tokens
      await tx.pushToken.deleteMany({
        where: { staffId: id }
      });

      // 2. Delete staff attendance records
      await tx.staffAttendance.deleteMany({
        where: { staffId: id }
      });

      // 3. Update appointments (set doctorId to null instead of deleting)
      await tx.appointment.updateMany({
        where: { doctorId: id },
        data: { doctorId: null }
      });

      // 4. Update patient visits (set doctorId to null)
      await tx.patientVisit.updateMany({
        where: { doctorId: id },
        data: { doctorId: null }
      });

      // 5. Delete patient queue entries
      await tx.patientQueue.deleteMany({
        where: { assignedStaffId: id }
      });

      // 6. Delete prescriptions (doctorId is required, can't be null)
      const prescriptions = await tx.prescription.findMany({
        where: { doctorId: id },
        select: { id: true }
      });

      for (const prescription of prescriptions) {
        // Delete prescription items first
        await tx.prescriptionItem.deleteMany({
          where: { prescriptionId: prescription.id }
        });
      }

      // Then delete prescriptions
      await tx.prescription.deleteMany({
        where: { doctorId: id }
      });

      // 7. Delete optometrist examinations
      await tx.optometristExamination.deleteMany({
        where: { optometristId: id }
      });

      // 8. Delete ophthalmologist examinations
      await tx.ophthalmologistExamination.deleteMany({
        where: { doctorId: id }
      });

      // 9. Delete diagnoses (doctorId is required)
      await tx.diagnosis.deleteMany({
        where: { doctorId: id }
      });

      // 10. Update rooms (set assignedStaffId to null)
      await tx.room.updateMany({
        where: { assignedStaffId: id },
        data: { assignedStaffId: null }
      });

      // 11. Delete examinations (doctorId is required)
      await tx.examination.deleteMany({
        where: { doctorId: id }
      });

      // 12. Update IPD admissions (some fields are required, some optional)
      // admittedBy is required, so we need to handle this differently
      // For now, we'll prevent deletion if there are IPD admissions
      const ipdCount = await tx.ipdAdmission.count({
        where: {
          OR: [
            { admittedBy: id },
            { surgeonId: id },
            { sisterId: id },
            { anesthesiologistId: id }
          ]
        }
      });

      if (ipdCount > 0) {
        throw new Error(`Cannot delete staff: ${ipdCount} IPD admission(s) are associated with this staff member. Please reassign them first.`);
      }

      // 13. Delete fitness reports (assessedBy is required)
      await tx.fitnessReport.deleteMany({
        where: { assessedBy: id }
      });

      // 14. Delete pre-op assessments (assessedBy is required)
      await tx.preOpAssessment.deleteMany({
        where: { assessedBy: id }
      });

      // 15. Delete surgery metrics (surgeonId is required)
      await tx.surgeryMetrics.deleteMany({
        where: { surgeonId: id }
      });

      // 16. Delete notification read receipts (uses userId and userType)
      await tx.notificationReadReceipt.deleteMany({
        where: { 
          userId: id,
          userType: 'staff'
        }
      });

      // 17. Delete notification preferences (uses userId and userType)
      await tx.notificationPreference.deleteMany({
        where: { 
          userId: id,
          userType: 'staff'
        }
      });

      // 18. Finally delete the staff member
      await tx.staff.delete({
        where: { id }
      });

      console.log('✅ All deletions completed successfully');
    });

    console.log(`🗑️ Staff permanently deleted by SuperAdmin: ${staff.firstName} ${staff.lastName} (${staff.employeeId})`);

    res.json({
      success: true,
      message: 'Staff member deleted permanently',
      data: {
        deletedStaff: {
          employeeId: staff.employeeId,
          name: `${staff.firstName} ${staff.lastName}`,
          email: staff.email,
          staffType: staff.staffType,
          deletedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Staff deletion error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Cannot delete staff member',
        message: 'Staff member has related records that could not be removed.',
        details: error.message,
        code: error.code
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete staff member',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      errorName: error.name,
      errorCode: error.code
    });
  }
};

// Get staff statistics (SuperAdmin only)
const getStaffStats = async (req, res) => {
  try {
    const [
      totalStaff,
      activeStaff,
      staffByType,
      staffByDepartment,
      recentStaff
    ] = await Promise.all([
      prisma.staff.count(),
      prisma.staff.count({ where: { isActive: true } }),
      prisma.staff.groupBy({
        by: ['staffType'],
        _count: {
          id: true
        }
      }),
      prisma.staff.groupBy({
        by: ['department'],
        _count: {
          id: true
        },
        where: {
          department: { not: null }
        }
      }),
      prisma.staff.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          staffType: true,
          department: true,
          createdAt: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalStaff,
          activeStaff,
          inactiveStaff: totalStaff - activeStaff
        },
        byType: staffByType.reduce((acc, item) => {
          acc[item.staffType] = item._count.id;
          return acc;
        }, {}),
        byDepartment: staffByDepartment.reduce((acc, item) => {
          acc[item.department] = item._count.id;
          return acc;
        }, {}),
        recentStaff
      }
    });

  } catch (error) {
    console.error('Staff stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch staff statistics'
    });
  }
};

// ==================== SUPERADMIN MANAGEMENT FUNCTIONS ====================

// Create initial super admin (for first-time setup)
const createInitialSuperAdmin = async (req, res) => {
  try {
    const existingAdmins = await prisma.superAdmin.count();

    if (existingAdmins === 0) {
      const defaultEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@eyehospital.com';
      const defaultPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123';

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

      const initialAdmin = await prisma.superAdmin.create({
        data: {
          firstName: 'System',
          lastName: 'Administrator',
          email: defaultEmail,
          passwordHash: passwordHash,
          phone: '+911234567890',
          isActive: true
        }
      });

      console.log('Initial super admin created successfully');
      console.log('Email:', defaultEmail);
      console.log('Password:', defaultPassword);
      console.log('Please change the password after first login!');

      return res.status(201).json({
        success: true,
        message: 'Initial super admin created successfully',
        data: {
          email: defaultEmail,
          firstName: initialAdmin.firstName,
          lastName: initialAdmin.lastName
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Super admin already exists'
    });

  } catch (error) {
    console.error('Error creating initial super admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating initial super admin',
      error: error.message
    });
  }
};

// Create new super admin
const createSuperAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if email already exists
    const existingAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create super admin
    const superAdmin = await prisma.superAdmin.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        phone,
        isActive: true
      }
    });

    // Remove password hash from response
    const { passwordHash: _, ...adminWithoutPassword } = superAdmin;

    res.status(201).json({
      message: 'Super admin created successfully',
      data: adminWithoutPassword
    });
  } catch (error) {
    console.error('Create super admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login super admin
const loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find super admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    });

    if (!superAdmin || !superAdmin.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, superAdmin.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(superAdmin);

    // Update last login
    await prisma.superAdmin.update({
      where: { id: superAdmin.id },
      data: { updatedAt: new Date() }
    });

    // Remove password hash from response
    const { passwordHash, ...adminWithoutPassword } = superAdmin;

    // Set httpOnly cookie for secure token storage
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
        user: adminWithoutPassword
        // Note: token is now in httpOnly cookie, not in response body
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout super admin
const logoutSuperAdmin = async (req, res) => {
  try {
    // Clear the httpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: isProduction && req.secure,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/'
    });

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all super admins
const getAllSuperAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const superAdmins = await prisma.superAdmin.findMany({
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
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const total = await prisma.superAdmin.count({ where });

    res.json({
      data: superAdmins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get super admins error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get super admin by ID
const getSuperAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!superAdmin) {
      return res.status(404).json({ error: 'Super admin not found' });
    }

    res.json({ data: superAdmin });
  } catch (error) {
    console.error('Get super admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update super admin
const updateSuperAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, isActive } = req.body;

    // Check if super admin exists
    const existingAdmin = await prisma.superAdmin.findUnique({
      where: { id }
    });

    if (!existingAdmin) {
      return res.status(404).json({ error: 'Super admin not found' });
    }

    // Check if email already exists (excluding current admin)
    if (email && email !== existingAdmin.email) {
      const emailExists = await prisma.superAdmin.findFirst({
        where: {
          email,
          NOT: { id }
        }
      });

      if (emailExists) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }

    const updatedAdmin = await prisma.superAdmin.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Super admin updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Super admin not found' });
    }
    console.error('Update super admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete super admin (soft delete)
const deleteSuperAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id }
    });

    if (!superAdmin) {
      return res.status(404).json({ error: 'Super admin not found' });
    }

    await prisma.superAdmin.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Super admin deactivated successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Super admin not found' });
    }
    console.error('Delete super admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        photo: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ data: superAdmin });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, photo } = req.body;

    const updatedAdmin = await prisma.superAdmin.update({
      where: { id: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(photo && { photo }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        photo: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current user with password hash
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, superAdmin.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.superAdmin.update({
      where: { id: req.user.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reactivate super admin
const reactivateSuperAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id }
    });

    if (!superAdmin) {
      return res.status(404).json({ error: 'Super admin not found' });
    }

    const updatedAdmin = await prisma.superAdmin.update({
      where: { id },
      data: {
        isActive: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Super admin reactivated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Super admin not found' });
    }
    console.error('Reactivate super admin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalSuperAdmins,
      activeSuperAdmins,
      totalStaff,
      activeStaff,
      activePatientsToday,
      todayAppointments
    ] = await Promise.all([
      prisma.superAdmin.count(),
      prisma.superAdmin.count({ where: { isActive: true } }),
      prisma.staff.count(),
      prisma.staff.count({ where: { isActive: true, employmentStatus: 'active' } }),
      // Count patients currently in hospital (checked in today and not completed/discharged)
      prisma.patientVisit.count({
        where: {
          visitDate: {
            gte: todayStart,
            lte: todayEnd
          },
          status: {
            notIn: ['COMPLETED', 'DISCHARGED']
          }
        }
      }),
      // Get today's appointments with patient and doctor details
      prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        include: {
          patient: {
            select: {
              id: true,
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
        },
        orderBy: {
          appointmentDate: 'asc'
        }
        // No limit - show all today's appointments
      })
    ]);

    res.json({
      data: {
        superAdmins: {
          total: totalSuperAdmins,
          active: activeSuperAdmins
        },
        staff: {
          total: totalStaff,
          active: activeStaff
        },
        patients: {
          activeToday: activePatientsToday
        },
        appointments: {
          today: todayAppointments.length,
          list: todayAppointments
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// Forgot password - Send OTP to email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if super admin exists and is active
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists
    let emailSent = false;

    if (superAdmin && superAdmin.isActive) {
      // Check rate limiting
      const rateLimitResult = await otpService.checkRateLimit(email, 'password_reset', 15, 5);

      if (rateLimitResult.isLimited) {
        return res.status(429).json({
          error: rateLimitResult.message,
          resetTime: rateLimitResult.resetTime
        });
      }

      try {
        // Generate and store OTP in database
        const { otp } = await otpService.generateAndStoreOTP(
          email,
          'password_reset',
          10,
          req.ip,
          req.get('User-Agent')
        );

        // Send OTP email
        await emailService.sendPasswordResetOTP(
          email,
          otp,
          superAdmin.firstName,
          10 // expiryMinutes
        );
        emailSent = true;

        console.log(`📧 Password reset OTP sent to ${email}`);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Invalidate OTP if email failed
        await otpService.invalidateExistingOTPs(email, 'password_reset');

        return res.status(500).json({
          error: 'Failed to send reset email. Please try again later.'
        });
      }
    } else {
      console.log(`⚠️ Password reset requested for non-existent or inactive email: ${email}`);
    }

    // Always return success response to prevent email enumeration
    res.json({
      message: 'If the email exists in our system, you will receive a password reset OTP shortly.',
      emailSent: emailSent,
      expiryMinutes: 10
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify password reset OTP
const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Verify OTP
    const verificationResult = await otpService.verifyOTP(email, otp, 'password_reset');

    // Check if super admin still exists and is active
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    });

    if (!superAdmin || !superAdmin.isActive) {
      return res.status(404).json({
        error: 'Account not found or has been deactivated'
      });
    }

    // Generate a temporary token for password reset (valid for 15 minutes)
    const resetToken = jwt.sign(
      {
        email: email,
        purpose: 'password_reset',
        userId: superAdmin.id
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    console.log(`✅ OTP verified for password reset: ${email}`);

    res.json({
      message: 'OTP verified successfully',
      resetToken: resetToken,
      expiresIn: '15 minutes'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset password with verified OTP
const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    // Verify the reset token
    let decodedToken;
    try {
      decodedToken = jwt.verify(resetToken, JWT_SECRET);
    } catch (tokenError) {
      return res.status(401).json({
        error: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      });
    }

    // Verify the token is for password reset and matches the email
    if (decodedToken.purpose !== 'password_reset' || decodedToken.email !== email) {
      return res.status(401).json({
        error: 'Invalid reset token',
        code: 'INVALID_TOKEN'
      });
    }

    // Find super admin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email }
    });

    if (!superAdmin || !superAdmin.isActive) {
      return res.status(404).json({
        error: 'Account not found or has been deactivated'
      });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, superAdmin.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({
        error: 'New password must be different from your current password'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.superAdmin.update({
      where: { id: superAdmin.id },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      }
    });

    // Send password change confirmation email
    try {
      await emailService.sendPasswordChangeConfirmation(email, superAdmin.firstName);
    } catch (emailError) {
      console.error('Failed to send password change confirmation email:', emailError);
      // Don't fail the password reset if email fails
    }

    console.log(`🔒 Password reset successful for: ${email}`);

    res.json({
      message: 'Password reset successful. You can now login with your new password.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get OTP status (for debugging/monitoring - should be protected)
const getOTPStatus = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const status = await otpService.getOTPStatus(email, 'password_reset');
    const rateLimitStatus = await otpService.checkRateLimit(email, 'password_reset', 15, 5);

    res.json({
      otpStatus: status,
      rateLimitStatus: rateLimitStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get OTP status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get staff filtered by type
const getStaffByType = async (req, res) => {
  try {
    const { staffType } = req.params;
    
    if (!staffType) {
      return res.status(400).json({
        success: false,
        message: 'Staff type is required'
      });
    }

    console.log('🔍 Fetching staff by type:', staffType);

    const staff = await prisma.staff.findMany({
      where: {
        staffType: staffType,
        isActive: true,
        employmentStatus: 'active'
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        department: true,
        staffType: true,
        qualifications: true,
        joiningDate: true,
        isActive: true
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    console.log('✅ Found staff:', staff.length, 'for type:', staffType);

    res.json({
      success: true,
      data: staff,
      count: staff.length,
      staffType: staffType
    });

  } catch (error) {
    console.error('❌ Error fetching staff by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch staff by type',
      error: error.message
    });
  }
};

// Get all surgery-related staff in one call
const getAllSurgeryStaff = async (req, res) => {
  try {
    console.log('🔍 Fetching all surgery staff...');
    const staffTypes = ['surgeon', 'anesthesiologist', 'sister'];
    
    const allStaff = await prisma.staff.findMany({
      where: {
        staffType: {
          in: staffTypes
        },
        isActive: true,
        employmentStatus: 'active'
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
        qualifications: true
      },
      orderBy: [
        { staffType: 'asc' },
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Group staff by type
    const groupedStaff = {
      surgeons: allStaff.filter(staff => staff.staffType === 'surgeon'),
      anesthesiologists: allStaff.filter(staff => staff.staffType === 'anesthesiologist'),
      sisters: allStaff.filter(staff => staff.staffType === 'sister')
    };

    console.log('✅ Surgery staff found:', {
      surgeons: groupedStaff.surgeons.length,
      anesthesiologists: groupedStaff.anesthesiologists.length,
      sisters: groupedStaff.sisters.length,
      total: allStaff.length
    });

    res.json({
      success: true,
      data: groupedStaff,
      counts: {
        surgeons: groupedStaff.surgeons.length,
        anesthesiologists: groupedStaff.anesthesiologists.length,
        sisters: groupedStaff.sisters.length,
        total: allStaff.length
      }
    });

  } catch (error) {
    console.error('❌ Get all surgery staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch surgery staff'
    });
  }
};

module.exports = {
  // Staff Management (SuperAdmin only)
  createStaff,
  getAllStaff,
  getStaffByType,
  getSurgeryStaff: getAllSurgeryStaff,
  getStaffById,
  updateStaff,
  deactivateStaff,
  reactivateStaff,
  deleteStaff,
  getStaffStats,

  // SuperAdmin Management
  createInitialSuperAdmin,
  createSuperAdmin,
  loginSuperAdmin,
  logoutSuperAdmin,
  getAllSuperAdmins,
  getSuperAdminById,
  updateSuperAdmin,
  deleteSuperAdmin,
  reactivateSuperAdmin,
  getProfile,
  updateProfile,
  changePassword,
  getDashboardStats,
  generateToken,

  // Password reset methods
  forgotPassword,
  verifyPasswordResetOTP,
  resetPassword,
  getOTPStatus
};
