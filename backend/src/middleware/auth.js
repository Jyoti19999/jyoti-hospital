// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { notEqual } = require('assert');
const JWT_SECRET = process.env.JWT_SECRET;

// Generic authentication middleware for all roles
const authenticateToken = async (req, res, next) => {
  try {
    // DEBUG: Log incoming authentication info
    console.log('🔐 Authentication check for:', req.method, req.originalUrl);
    console.log('🍪 Cookies received:', JSON.stringify(req.cookies || {}));
    console.log('📋 Auth header:', req.headers['authorization'] ? 'Present' : 'Missing');

    // Check for token in cookies first (secure method), then fallback to headers
    let token = req.cookies?.authToken || req.cookies?.token;
    // Fallback to authorization header for API clients
    if (!token) {

      const authHeader = req.headers['authorization'] || req.headers['Authorization'];

      if (authHeader) {
        // Extract token from Bearer format
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7); // Remove 'Bearer ' prefix
        } else if (authHeader.startsWith('bearer ')) {
          token = authHeader.substring(7); // Handle lowercase 'bearer'
        } else {
          // If no Bearer prefix, treat the entire header as token
          token = authHeader;
        }
      }
    }

    if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Authentication token is missing or invalid'
      });
    }

    // Verify JWT token
    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'JWT secret not configured'
      });
    }

    // Validate token format before verification
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return res.status(401).json({
        error: 'Invalid token format',
        message: 'Authentication token is malformed'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    let user = null;
    let userType = null;

    // Check based on user type in token
    switch (decoded.userType) {
      case 'super_admin':
        user = await prisma.superAdmin.findUnique({
          where: { id: decoded.id },
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
        userType = 'super_admin';
        break;

      case 'staff':
        user = await prisma.staff.findUnique({
          where: { id: decoded.id },
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
            employmentStatus: true,
            createdAt: true,
            updatedAt: true
          }
        });
        userType = 'staff';
        break;

      case 'patient':
        user = await prisma.patient.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            patientNumber: true,
            mrn: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            patientStatus: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true
          }
        });
        userType = 'patient';
        break;

      default:
        console.log('❌ Invalid user type in token:', decoded.userType);
        return res.status(403).json({
          error: 'Invalid user type',
          message: `User type '${decoded.userType}' is not recognized`
        });
    }

    if (!user) {
      console.log('❌ User not found in database:', { id: decoded.id, userType: decoded.userType });
      return res.status(403).json({
        error: 'User not found',
        message: 'User account does not exist'
      });
    }

    // Check account status based on user type
    if (userType === 'patient') {
      if (!user.patientStatus || user.patientStatus !== 'active') {
        console.log('❌ Patient account is inactive:', { id: user.id, email: user.email, status: user.patientStatus });
        return res.status(403).json({
          error: 'Account inactive',
          message: 'Patient account has been deactivated'
        });
      }
    } else {
      // For super_admin and staff, check isActive
      if (!user.isActive) {
        console.log('❌ User account is inactive:', { id: user.id, email: user.email });
        return res.status(403).json({
          error: 'Account inactive',
          message: 'User account has been deactivated'
        });
      }
    }

    // For staff, check employment status
    if (userType === 'staff' && user.employmentStatus !== 'active') {
      console.log('❌ Staff employment status is not active:', {
        id: user.id,
        employmentStatus: user.employmentStatus
      });
      return res.status(403).json({
        error: 'Employment inactive',
        message: 'Staff employment status is not active'
      });
    }

    // For patients, check patient status
    if (userType === 'patient' && user.patientStatus !== 'active') {
      console.log('❌ Patient status is not active:', {
        id: user.id,
        patientStatus: user.patientStatus
      });
      return res.status(403).json({
        error: 'Patient account inactive',
        message: 'Patient account status is not active'
      });
    }

    // Add user info and type to request
    req.user = user;
    req.userType = userType;

    // For staff, ensure staffType is available
    if (userType === 'staff' && user.staffType) {
      req.user.staffType = user.staffType;
    }

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is malformed or invalid'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again'
      });
    } else if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        error: 'Token not active',
        message: 'Token is not yet valid'
      });
    } else {
      return res.status(500).json({
        error: 'Authentication failed',
        message: 'Internal server error during authentication'
      });
    }
  }
};

// Authorization middleware for specific user types
const requireUserType = (userTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Authentication required' });
    }

    if (!userTypes.includes(req.userType)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: userTypes,
        current: req.userType
      });
    }

    next();
  };
};

// Authorization middleware for specific staff types
const requireStaffType = (staffTypes) => {
  return (req, res, next) => {
    if (!req.user || req.userType !== 'staff') {
      return res.status(403).json({ error: 'Staff access required' });
    }

    if (!staffTypes.includes(req.user.staffType)) {
      return res.status(403).json({
        error: 'Insufficient staff permissions',
        required: staffTypes,
        current: req.user.staffType
      });
    }

    next();
  };
};

// Specific user type middlewares for convenience
const requireSuperAdmin = requireUserType(['super_admin']);
const requireStaff = requireUserType(['staff']);
const requirePatient = requireUserType(['patient']);
const requireAdminOrStaff = requireUserType(['super_admin', 'staff']);
const requireStaffOrPatient = requireUserType(['staff', 'patient']);
const requireAnyUser = requireUserType(['super_admin', 'staff', 'patient']);

// Specific staff type middlewares
const requireDoctor = requireStaffType(['doctor']);
const requireNurse = requireStaffType(['nurse']);
const requireTechnician = requireStaffType(['technician']);
const requireAdminStaff = requireStaffType(['admin']);
const requireReceptionist = requireStaffType(['receptionist']);
const requireReceptionist2 = requireStaffType(['receptionist2']);
const requireReceptionist2OrSister = requireStaffType(['receptionist2', 'sister']);
const requireOphthalmologist = requireStaffType(['ophthalmologist', 'doctor']);
const requireOphthalmologistOrReceptionist2 = requireStaffType(['ophthalmologist', 'doctor', 'receptionist2']);
const requireClinicalStaff = requireStaffType(['doctor', 'nurse', 'technician', 'ophthalmologist']);
const requireNonClinicalStaff = requireStaffType(['admin', 'receptionist', 'receptionist2']);
const requirefrontdesk = requireStaffType(['requirefrontdesk']);
// Optional authentication
const optionalAuth = async (req, res, next) => {
  try {
    // Check for token in cookies first, then fallback to headers
    let token = req.cookies?.authToken || req.cookies?.token;

    if (!token) {
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];

      if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        } else if (authHeader.startsWith('bearer ')) {
          token = authHeader.substring(7);
        } else {
          token = authHeader;
        }
      }
    }

    if (!token || token.trim() === '' || !JWT_SECRET) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    let user = null;
    let userType = null;

    switch (decoded.userType) {
      case 'super_admin':
        user = await prisma.superAdmin.findUnique({
          where: { id: decoded.id },
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
        userType = 'super_admin';
        break;

      case 'staff':
        user = await prisma.staff.findUnique({
          where: { id: decoded.id },
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
            employmentStatus: true,
            createdAt: true,
            updatedAt: true
          }
        });
        userType = 'staff';
        break;

      case 'patient':
        user = await prisma.patient.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            patientNumber: true,
            mrn: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            patientStatus: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true
          }
        });
        userType = 'patient';
        break;

      default:
        return next();
    }

    if (user && (userType === 'super_admin' ? user.isActive : true) &&
      (userType === 'staff' ? (user.isActive && user.employmentStatus === 'active') : true) &&
      (userType === 'patient' ? user.patientStatus === 'active' : true)) {
      req.user = user;
      req.userType = userType;

      if (userType === 'staff' && user.staffType) {
        req.user.staffType = user.staffType;
      }
    }

    next();
  } catch (error) {
    // Silently continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  requireUserType,
  requireStaffType,
  requireSuperAdmin,
  requireStaff,
  requirePatient,
  requireAdminOrStaff,
  requireStaffOrPatient,
  requireAnyUser,
  requireDoctor,
  requireNurse,
  requireTechnician,
  requireAdminStaff,
  requireReceptionist,
  requireReceptionist2,
  requireReceptionist2OrSister,
  requireOphthalmologist,
  requireOphthalmologistOrReceptionist2,
  requireClinicalStaff,
  requireNonClinicalStaff,
  optionalAuth,
  JWT_SECRET
};