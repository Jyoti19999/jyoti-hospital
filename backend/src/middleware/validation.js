// middleware/validation.js
const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Common validation rules
const nameValidation = (fieldName) => 
  body(fieldName)
    .trim()
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isLength({ min: 2, max: 50 })
    .withMessage(`${fieldName} must be between 2 and 50 characters`)
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage(`${fieldName} must contain only letters and spaces`);

const emailValidation = () =>
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters');

const phoneValidation = () =>
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number')
    .isLength({ min: 10, max: 17 })
    .withMessage('Phone number must be between 10 and 17 characters');

const passwordValidation = (fieldName = 'password') =>
  body(fieldName)
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number');

// Validation for creating super admin
const validateSuperAdminCreate = [
  nameValidation('firstName'),
  nameValidation('lastName'),
  emailValidation(),
  passwordValidation(),
  phoneValidation(),
  
  // Additional custom validations
  body('firstName')
    .custom((value, { req }) => {
      if (value && value.toLowerCase() === req.body.lastName?.toLowerCase()) {
        throw new Error('First name and last name cannot be the same');
      }
      return true;
    }),
    
  body('email')
    .custom((value) => {
      // Block common test/dummy emails
      const blockedDomains = ['test.com', 'example.com', 'dummy.com'];
      const domain = value.split('@')[1];
      if (blockedDomains.includes(domain)) {
        throw new Error('Please use a valid business email address');
      }
      return true;
    })
];

// Validation for updating super admin
const validateSuperAdminUpdate = [
  nameValidation('firstName').optional(),
  nameValidation('lastName').optional(),
  emailValidation().optional(),
  phoneValidation(),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  body('photo')
    .optional()
    .isString()
    .withMessage('Photo must be a string (base64)'),
    
  // Ensure at least one field is provided for update
  body()
    .custom((value, { req }) => {
      const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'isActive', 'photo'];
      const providedFields = Object.keys(req.body).filter(key => allowedFields.includes(key));
      
      if (providedFields.length === 0) {
        throw new Error('At least one field must be provided for update');
      }
      return true;
    }),
    
  body('firstName')
    .optional()
    .custom((value, { req }) => {
      if (value && req.body.lastName && value.toLowerCase() === req.body.lastName.toLowerCase()) {
        throw new Error('First name and last name cannot be the same');
      }
      return true;
    })
];

// Validation for login
const validateLogin = [
  emailValidation(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1, max: 128 })
    .withMessage('Password must not exceed 128 characters'),
    
  // Rate limiting validation (basic check)
  body()
    .custom((value, { req }) => {
      // This is a placeholder for rate limiting logic
      // In production, you'd implement proper rate limiting middleware
      return true;
    })
];

// Validation for profile update (excludes email change)
const validateProfileUpdate = [
  nameValidation('firstName').optional(),
  nameValidation('lastName').optional(),
  phoneValidation(),
  
  // Ensure at least one field is provided for update
  body()
    .custom((value, { req }) => {
      const allowedFields = ['firstName', 'lastName', 'phone'];
      const providedFields = Object.keys(req.body).filter(key => allowedFields.includes(key));
      
      if (providedFields.length === 0) {
        throw new Error('At least one field must be provided for update');
      }
      return true;
    }),
    
  body('firstName')
    .optional()
    .custom((value, { req }) => {
      if (value && req.body.lastName && value.toLowerCase() === req.body.lastName.toLowerCase()) {
        throw new Error('First name and last name cannot be the same');
      }
      return true;
    })
];

// Validation for password change
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required')
    .isLength({ min: 1, max: 128 })
    .withMessage('Current password must not exceed 128 characters'),
    
  passwordValidation('newPassword'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
    
  // Ensure new password is different from current password
  body('newPassword')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];

// Validation for ID parameters
const validateIdParam = [
  body()
    .custom((value, { req }) => {
      const id = req.params.id;
      if (!id) {
        throw new Error('ID parameter is required');
      }
      
      // Check if it's a valid UUID format (assuming you're using UUIDs)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error('Invalid ID format');
      }
      
      return true;
    })
];

// Validation for query parameters
const validateQueryParams = [
  body()
    .custom((value, { req }) => {
      const { page, limit, isActive } = req.query;
      
      if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
        throw new Error('Page must be a positive integer');
      }
      
      if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
        throw new Error('Limit must be a positive integer between 1 and 100');
      }
      
      if (isActive && !['true', 'false'].includes(isActive)) {
        throw new Error('isActive must be either true or false');
      }
      
      return true;
    })
];

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any null bytes and trim whitespace
  for (const key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].replace(/\0/g, '').trim();
    }
  }
  next();
};

// Validation for forgot password request
const validateForgotPassword = [
  emailValidation(),
  
  // Additional security check
  body('email')
    .custom((value) => {
      // Basic security check for suspicious emails
      const suspiciousPatterns = [
        /temp/i,
        /disposable/i,
        /throwaway/i
      ];
      
      if (suspiciousPatterns.some(pattern => pattern.test(value))) {
        console.log(`⚠️ Suspicious email pattern detected: ${value}`);
        // Don't block but log for monitoring
      }
      return true;
    })
];

// Validation for OTP verification
const validateOTPVerification = [
  emailValidation(),
  
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
    .custom((value) => {
      // Check for obvious patterns
      const obviousPatterns = [
        /^(.)\1{5}$/, // All same digits (111111)
        /^123456$/, /^654321$/, // Sequential
        /^000000$/, /^999999$/ // Common patterns
      ];
      
      if (obviousPatterns.some(pattern => pattern.test(value))) {
        throw new Error('Invalid OTP format');
      }
      return true;
    })
];

// Validation for password reset
const validatePasswordReset = [
  emailValidation(),
  
  body('resetToken')
    .notEmpty()
    .withMessage('Reset token is required')
    .isString()
    .withMessage('Reset token must be a string'),
    
  passwordValidation('newPassword'),
  
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
    
  // Ensure this is not a common password
  body('newPassword')
    .custom((value) => {
      const commonPasswords = [
        'password', 'password123', '123456', 'admin123', 
        'welcome123', 'hospital123', 'admin@123'
      ];
      
      if (commonPasswords.includes(value.toLowerCase())) {
        throw new Error('Password is too common. Please choose a more secure password.');
      }
      return true;
    })
];

// Additional security validations
const validateSecurityHeaders = (req, res, next) => {
  // Check for suspicious patterns in request
  const userAgent = req.get('User-Agent');
  const suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /burp/i,
    /nessus/i
  ];
  
  if (userAgent && suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return res.status(403).json({ error: 'Request blocked for security reasons' });
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  validateSuperAdminCreate,
  validateSuperAdminUpdate,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateForgotPassword,
  validateOTPVerification,
  validatePasswordReset,
  validateIdParam,
  validateQueryParams,
  sanitizeInput,
  validateSecurityHeaders,
  
  // Export individual validation functions for reuse
  nameValidation,
  emailValidation,
  phoneValidation,
  passwordValidation
};