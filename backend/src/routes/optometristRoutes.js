// src/routes/optometristRoutes.js
const express = require('express');
const router = express.Router();
const optometristController = require('../controllers/optometristController');
const { authenticateToken, requireAdminOrStaff } = require('../middleware/auth');

// Middleware to ensure user is an optometrist or admin
const requireOptometrist = (req, res, next) => {
  console.log('🔍 Checking optometrist permission:', { 
    userId: req.user?.id, 
    staffType: req.user?.staffType,
    userType: req.userType 
  });
  
  // Allow super_admin userType
  if (req.userType === 'super_admin') {
    console.log('✅ Super Admin permission granted');
    return next();
  }
  
  if (!req.user || !req.user.staffType) {
    console.log('❌ No staffType found on user object');
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Staff type not found.' 
    });
  }
  
  // Allow optometrist or admin
  const allowedRoles = ['optometrist', 'admin'];
  if (!allowedRoles.includes(req.user.staffType.toLowerCase())) {
    console.log('❌ Staff type mismatch:', req.user.staffType, 'vs', allowedRoles);
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Optometrist or Admin role required.',
      currentRole: req.user.staffType,
      allowedRoles: allowedRoles
    });
  }
  
  console.log('✅ Optometrist/Admin permission granted');
  next();
};

// Middleware for roles that can view the optometrist queue
const requireOptometristQueueAccess = (req, res, next) => {
  // Allow super_admin userType
  if (req.userType === 'super_admin') {
    return next();
  }
  
  const allowedRoles = ['optometrist', 'admin', 'receptionist', 'receptionist2'];
  if (!allowedRoles.includes(req.user.staffType?.toLowerCase())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Queue access not permitted for your role.',
      currentRole: req.user.staffType || req.userType,
      allowedRoles: allowedRoles
    });
  }
  next();
};

// Optometrist Queue Management Routes
router.get('/queue', authenticateToken, requireAdminOrStaff, requireOptometristQueueAccess, optometristController.getOptometristQueue);
router.post('/queue/call-next', authenticateToken, requireAdminOrStaff, requireOptometrist, optometristController.callNextPatient);
router.patch('/queue/:queueEntryId/start', authenticateToken, requireAdminOrStaff, requireOptometrist, optometristController.startExamination);
router.patch('/queue/:queueEntryId/record-start-time', authenticateToken, requireAdminOrStaff, requireOptometrist, optometristController.recordExaminationStartTime);
router.patch('/queue/:queueEntryId/revert', authenticateToken, requireAdminOrStaff, requireOptometrist, optometristController.revertExaminationStatus);
router.patch('/queue/:queueEntryId/complete', authenticateToken, requireAdminOrStaff, requireOptometrist, optometristController.completeExamination);
router.patch('/queue/:queueEntryId/discontinue', authenticateToken, requireAdminOrStaff, requireOptometrist, optometristController.discontinueExamination);
router.post('/queue/:queueEntryId/transfer', authenticateToken, requireAdminOrStaff, requireOptometrist, optometristController.transferPatient);
router.post('/queue/reorder', authenticateToken, requireAdminOrStaff, requireOptometristQueueAccess, optometristController.reorderQueue);
router.post('/queue/apply-fcfs', authenticateToken, requireAdminOrStaff, requireOptometrist, optometristController.applyFCFS);
router.patch('/queue/:queueEntryId/update-priority-label', authenticateToken, requireAdminOrStaff, requireOptometristQueueAccess, optometristController.updatePatientVisitType);

// Current Patient Routes
router.get('/current-patient', authenticateToken, requireAdminOrStaff, requireOptometrist, optometristController.getCurrentPatient);

// Doctor Assignment Routes
router.patch('/queue/:queueEntryId/assign-doctor', authenticateToken, requireAdminOrStaff, requireOptometrist, optometristController.assignDoctorToPatient);

// Examination Data Routes
router.post('/examination', authenticateToken, requireAdminOrStaff, requireOptometrist, optometristController.saveExaminationData);
router.get('/completed-examinations/today', authenticateToken, requireAdminOrStaff, requireOptometrist, optometristController.getTodaysCompletedExaminations);

// Dashboard Routes
router.get('/dashboard/stats', authenticateToken, requireAdminOrStaff, requireOptometrist, optometristController.getDashboardStats);

module.exports = router;
