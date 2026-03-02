//routes/superAdminRoutes.js
const express = require('express');
const router = express.Router();
const {
  // Staff Management (SuperAdmin only)
  createStaff,
  getAllStaff,
  getStaffByType,
  getSurgeryStaff,
  getStaffById,
  updateStaff,
  deactivateStaff,
  reactivateStaff,
  deleteStaff,
  getStaffStats,

  // SuperAdmin Management
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
  createInitialSuperAdmin,

  // Password reset methods
  forgotPassword,
  verifyPasswordResetOTP,
  resetPassword,
  getOTPStatus
} = require('../controllers/superAdminController');

const {
  authenticateToken,
  requireSuperAdmin
} = require('../middleware/auth');

// TPA Access middleware - allow TPA to access certain staff endpoints
const requireTpaOrSuperAdmin = (req, res, next) => {
  console.log('🔍 Authentication Debug:', {
    userType: req.user?.userType,
    staffType: req.user?.staffType,
    fullUser: JSON.stringify(req.user, null, 2)
  });

  // Allow super admin
  if (req.user.userType === 'super_admin') {
    console.log('✅ Access granted: Super Admin');
    return next();
  }

  // Allow TPA staff type - check for either explicit userType='staff' OR just staffType='tpa'
  if (req.user.staffType === 'tpa') {
    console.log('✅ Access granted: TPA Staff');
    return next();
  }

  console.log('❌ Access denied:', {
    currentRole: req.user.staffType || 'unknown',
    userType: req.user.userType,
    expected: 'super_admin OR staffType=tpa'
  });

  return res.status(403).json({
    success: false,
    message: 'Access denied. Super Admin or TPA access required.',
    currentRole: req.user.staffType || 'unknown',
    userType: req.user.userType,
    debug: {
      received: req.user,
      expected: 'super_admin OR staffType=tpa'
    }
  });
};

const {
  validateSuperAdminCreate,
  validateSuperAdminUpdate,
  validateLogin,
  validatePasswordChange,
  validateForgotPassword,
  validateOTPVerification,
  validatePasswordReset,
  handleValidationErrors,
  sanitizeInput,
  validateSecurityHeaders
} = require('../middleware/validation');

const { uploadStaffFiles, handleUploadError } = require('../middleware/upload');

// Apply security middleware to all routes
router.use(validateSecurityHeaders);
router.use(sanitizeInput);

//create intial super admin if not exists
router.post('/init', createInitialSuperAdmin);

// Public routes (no authentication required)
router.post('/login', validateLogin, handleValidationErrors, loginSuperAdmin);
router.post('/logout', logoutSuperAdmin);

// Password reset routes (public)
router.post('/forgot-password', validateForgotPassword, handleValidationErrors, forgotPassword);
router.post('/verify-reset-otp', validateOTPVerification, handleValidationErrors, verifyPasswordResetOTP);
router.post('/reset-password', validatePasswordReset, handleValidationErrors, resetPassword);

// ==================== TPA ACCESSIBLE STAFF ROUTES ====================
// These routes must be before requireSuperAdmin middleware
// Allow TPA to get staff by type for surgery scheduling
router.get('/staff/by-type/:staffType', authenticateToken, requireTpaOrSuperAdmin, getStaffByType);
router.get('/staff/surgery-staff', authenticateToken, requireTpaOrSuperAdmin, getSurgeryStaff);

// Protected routes (require authentication and super admin role)
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', validateSuperAdminUpdate, handleValidationErrors, updateProfile);
router.put('/change-password', validatePasswordChange, handleValidationErrors, changePassword);

// ==================== STAFF MANAGEMENT ROUTES (SuperAdmin Only) ====================
router.post('/staff', uploadStaffFiles, handleUploadError, createStaff);
router.get('/staff', getAllStaff);
router.get('/staff/stats', getStaffStats);
router.get('/staff/:id', getStaffById);
router.put('/staff/:id', updateStaff);
router.patch('/staff/:id/deactivate', deactivateStaff);
router.patch('/staff/:id/reactivate', reactivateStaff);
router.delete('/staff/:id', deleteStaff);

// ==================== NOTIFICATION MANAGEMENT ROUTES ====================
const {
  createNotification,
  getAllNotifications: getAdminNotifications,
  getStatistics: getNotificationStatistics,
  deleteNotification: deleteAdminNotification,
  broadcastNotification,
  sendToUsers,
  sendEmergencyNotification,
  getStaffTypes,
  getNotificationTypes
} = require('../controllers/superAdminNotificationController');

router.get('/notifications', getAdminNotifications);
router.get('/notifications/statistics', getNotificationStatistics);
router.get('/notifications/staff-types', getStaffTypes);
router.get('/notifications/types', getNotificationTypes);
router.post('/notifications', createNotification);
router.post('/notifications/broadcast', broadcastNotification);
router.post('/notifications/send-to-users', sendToUsers);
router.post('/notifications/emergency', sendEmergencyNotification);
router.delete('/notifications/:id', deleteAdminNotification);

// ==================== SUPERADMIN MANAGEMENT ROUTES ====================
router.post('/', validateSuperAdminCreate, handleValidationErrors, createSuperAdmin);
router.get('/', getAllSuperAdmins);
router.get('/:id', getSuperAdminById);
router.put('/:id', validateSuperAdminUpdate, handleValidationErrors, updateSuperAdmin);
router.delete('/:id', deleteSuperAdmin);
router.put('/:id/reactivate', reactivateSuperAdmin);

// Debug/Monitoring routes (only in development)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/otp-status', getOTPStatus);
}

module.exports = router;