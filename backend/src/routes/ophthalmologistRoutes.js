// src/routes/ophthalmologistRoutes.js
const express = require('express');
const router = express.Router();
const ophthalmologistController = require('../controllers/ophthalmologistController');
const { authenticateToken, requireStaff, requireAdminOrStaff, requireOphthalmologist, requireOphthalmologistOrReceptionist2 } = require('../middleware/auth');

// Middleware to ensure user is an ophthalmologist or admin (local override)
const requireOphthalmologistLocal = (req, res, next) => {
  // Allow super_admin userType
  if (req.userType === 'super_admin') {
    return next();
  }

  const allowedRoles = ['ophthalmologist', 'doctor', 'admin'];
  if (!allowedRoles.includes(req.user.staffType)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Ophthalmologist, Doctor, Admin, or Super Admin role required.',
      currentRole: req.user.staffType || req.userType,
      allowedRoles: [...allowedRoles, 'super_admin']
    });
  }
  next();
};

// Middleware for roles that can view the queue (ophthalmologist, admin, receptionist)
const requireQueueAccess = (req, res, next) => {
  // Allow super_admin userType
  if (req.userType === 'super_admin') {
    return next();
  }

  const allowedRoles = ['ophthalmologist', 'doctor', 'admin', 'receptionist', 'receptionist2'];
  if (!allowedRoles.includes(req.user.staffType)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Queue access not permitted for your role.',
      currentRole: req.user.staffType || req.userType,
      allowedRoles: [...allowedRoles, 'super_admin']
    });
  }
  next();
};

/**
 * @route   GET /api/ophthalmologist/queue
 * @desc    Get the current ophthalmologist queue with all patients
 * @access  Private (Ophthalmologist, Admin, Receptionist, Super Admin)
 */
router.get('/queue',
  authenticateToken,
  requireAdminOrStaff,
  requireQueueAccess,
  ophthalmologistController.getOphthalmologistQueue
);

/**
 * @route   POST /api/ophthalmologist/queue/call-next
 * @desc    Call the next patient in the ophthalmologist queue
 * @access  Private (Ophthalmologist, Admin)
 */
router.post('/queue/call-next',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.callNextPatient
);

/**
 * @route   POST /api/ophthalmologist/queue/start-consultation
 * @desc    Start consultation for a patient
 * @access  Private (Ophthalmologist, Admin)
 */
router.post('/queue/start-consultation',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.startConsultation
);

/**
 * @route   POST /api/ophthalmologist/queue/complete-consultation
 * @desc    Complete consultation for a patient
 * @access  Private (Ophthalmologist, Admin)
 */
router.post('/queue/complete-consultation',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.completeConsultation
);

/**
 * @route   POST /api/ophthalmologist/queue/reorder
 * @desc    Reorder patients in the ophthalmologist queue (drag and drop)
 * @access  Private (Ophthalmologist, Admin, Receptionist)
 */
router.post('/queue/reorder',
  authenticateToken,
  requireAdminOrStaff,
  requireQueueAccess,
  ophthalmologistController.reorderQueue
);

/**
 * @route   POST /api/ophthalmologist/queue/reorder-comprehensive
 * @desc    Comprehensive queue reordering with intelligent shifting
 * @access  Private (Ophthalmologist, Admin, Receptionist)
 */
router.post('/queue/reorder-comprehensive',
  authenticateToken,
  requireAdminOrStaff,
  requireQueueAccess,
  ophthalmologistController.reorderQueueComprehensive
);

/**
 * @route   POST /api/ophthalmologist/queue/assign-doctor
 * @desc    Assign a doctor to a patient in the queue
 * @access  Private (Ophthalmologist, Admin, Receptionist)
 */
router.post('/queue/assign-doctor',
  authenticateToken,
  requireAdminOrStaff,
  requireQueueAccess,
  ophthalmologistController.assignDoctorToPatient
);

/**
 * @route   GET /api/ophthalmologist/current-patient
 * @desc    Get current patient being consulted by ophthalmologist
 * @access  Private (Ophthalmologist, Admin)
 */
router.get('/current-patient',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.getCurrentPatient
);

/**
 * @route   GET /api/ophthalmologist/dashboard/stats
 * @desc    Get dashboard statistics for ophthalmologist
 * @access  Private (Ophthalmologist, Admin)
 */
router.get('/dashboard/stats',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.getDashboardStats
);

/**
 * @route   POST /api/ophthalmologist/queue/:queueEntryId/assign
 * @desc    Assign a patient to an ophthalmologist
 * @access  Private (Ophthalmologist, Admin)
 */
router.post('/queue/:queueEntryId/assign',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.assignPatient
);

/**
 * @route   POST /api/ophthalmologist/queue/call-assigned
 * @desc    Call a specific assigned patient
 * @access  Private (Ophthalmologist, Admin)
 */
router.post('/queue/call-assigned',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.callAssignedPatient
);

/**
 * @route   POST /api/ophthalmologist/queue/put-on-hold
 * @desc    Put patient on hold for eye drops/dilation
 * @access  Private (Ophthalmologist, Admin)
 */
router.post('/queue/put-on-hold',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.putPatientOnHold
);

/**
 * @route   POST /api/ophthalmologist/queue/confirm-drops-applied
 * @desc    Confirm eye drops applied by receptionist2/sister (starts timer)
 * @access  Private (Receptionist2, Sister, Admin)
 */
router.post('/queue/confirm-drops-applied',
  authenticateToken,
  requireAdminOrStaff,
  // Allow receptionist2, sister and admin to confirm drops
  (req, res, next) => {
    const allowedRoles = ['receptionist2', 'sister', 'admin'];
    if (!allowedRoles.includes(req.user.staffType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Receptionist2, Sister or Admin role required.',
        currentRole: req.user.staffType,
        allowedRoles: allowedRoles
      });
    }
    next();
  },
  ophthalmologistController.confirmEyeDropsApplied
);

/**
 * @route   POST /api/ophthalmologist/queue/repeat-dilation
 * @desc    Repeat dilation (add another 10-minute round)
 * @access  Private (Receptionist2, Sister, Admin)
 */
router.post('/queue/repeat-dilation',
  authenticateToken,
  requireAdminOrStaff,
  (req, res, next) => {
    const allowedRoles = ['receptionist2', 'sister', 'admin'];
    if (!allowedRoles.includes(req.user.staffType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Receptionist2, Sister or Admin role required.'
      });
    }
    next();
  },
  ophthalmologistController.repeatDilation
);

/**
 * @route   POST /api/ophthalmologist/queue/mark-ready
 * @desc    Mark patient as ready to resume (manual override)
 * @access  Private (Receptionist2, Sister, Admin)
 */
router.post('/queue/mark-ready',
  authenticateToken,
  requireAdminOrStaff,
  (req, res, next) => {
    const allowedRoles = ['receptionist2', 'sister', 'admin'];
    if (!allowedRoles.includes(req.user.staffType)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Receptionist2, Sister or Admin role required.'
      });
    }
    next();
  },
  ophthalmologistController.markReadyToResume
);

/**
 * @route   POST /api/ophthalmologist/queue/resume-from-hold
 * @desc    Resume patient from hold status
 * @access  Private (Ophthalmologist, Admin)
 */
router.post('/queue/resume-from-hold',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.resumePatientFromHold
);

/**
 * @route   PUT /api/ophthalmologist/queue/:queueEntryId/notes
 * @desc    Update notes for a queue entry
 * @access  Private (Ophthalmologist, Admin)
 */
router.put('/queue/:queueEntryId/notes',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.updateQueueNotes
);

/**
 * @route   GET /api/ophthalmologist/queue/waiting
 * @desc    Get only waiting patients in the ophthalmologist queue
 * @access  Private (Ophthalmologist, Admin, Receptionist)
 */
router.get('/queue/waiting',
  authenticateToken,
  requireAdminOrStaff,
  requireQueueAccess,
  ophthalmologistController.getWaitingPatients
);

/**
 * @route   GET /api/ophthalmologist/my-patients
 * @desc    Get patients assigned to the current ophthalmologist
 * @access  Private (Ophthalmologist, Admin)
 */
router.get('/my-patients',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.getMyAssignedPatients
);

/**
 * @route   GET /api/ophthalmologist/my-on-hold-patients
 * @desc    Get doctor's ON_HOLD patients
 * @access  Private (Ophthalmologist, Admin)
 */
router.get('/my-on-hold-patients',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.getMyOnHoldPatients
);

/**
 * @route   POST /api/ophthalmologist/detailed-examination/:queueEntryId/save
 * @desc    Save detailed ophthalmologist examination data
 * @access  Private (Ophthalmologist, Admin)
 */
router.post('/detailed-examination/:queueEntryId/save',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.saveDetailedOphthalmologistExamination
);

/**
 * @route   GET /api/ophthalmologist/detailed-examination/:queueEntryId
 * @desc    Get detailed ophthalmologist examination data
 * @access  Private (Ophthalmologist, Admin)
 */
router.get('/detailed-examination/:queueEntryId',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.getDetailedOphthalmologistExamination
);

/**
 * @route   GET /api/ophthalmologist/optometrist-examination/:examinationId
 * @desc    Get optometrist examination data for ophthalmologist review
 * @access  Private (Ophthalmologist, Admin)
 */
router.get('/optometrist-examination/:examinationId',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.getOptometristExaminationData
);

/**
 * @route   POST /api/ophthalmologist/my-queue/reorder
 * @desc    Reorder doctor's specific queue with doctor-scoped positions
 * @access  Private (Ophthalmologist, Receptionist2, Admin)
 */
router.post('/my-queue/reorder',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistOrReceptionist2,
  ophthalmologistController.reorderDoctorQueue
);

/**
 * @route   POST /api/ophthalmologist/my-queue/reorder-next-in-line
 * @desc    Reorder doctor's Next-in-Line panel only (positions 1-3) using doctorQueuePosition
 * @access  Private (Ophthalmologist, Admin)
 */
router.post('/my-queue/reorder-next-in-line',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.reorderDoctorNextInLine
);

/**
 * @route   GET /api/ophthalmologist/my-queue
 * @desc    Get doctor's queue with positions (1,2,3...)
 * @access  Private (Ophthalmologist, Admin)
 */
router.get('/my-queue',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.getDoctorQueue
);

/**
 * @route   POST /api/ophthalmologist/transfer-patient
 * @desc    Transfer patient to another doctor (goes to end of their queue)
 * @access  Private (Ophthalmologist, Admin)
 */
router.post('/transfer-patient',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.transferPatientToDoctor
);

/**
 * @route   GET /api/ophthalmologist/debug/user-info
 * @desc    Debug endpoint to check current user information
 * @access  Private (Staff only)
 */
router.get('/debug/user-info',
  authenticateToken,
  requireAdminOrStaff,
  (req, res) => {
    res.json({
      success: true,
      message: 'User information retrieved',
      data: {
        user: req.user,
        userType: req.userType,
        staffType: req.user?.staffType,
        isStaff: req.userType === 'staff',
        allowedForQueue: ['ophthalmologist', 'doctor', 'admin', 'receptionist', 'receptionist2'].includes(req.user?.staffType),
        allowedForOphthalmologist: ['ophthalmologist', 'doctor', 'admin'].includes(req.user?.staffType)
      }
    });
  }
);

/**
 * @route   GET /api/ophthalmologist/completed-examinations
 * @desc    Get completed examinations for logged-in ophthalmologist
 * @access  Private (Ophthalmologist, Doctor, Admin)
 */
router.get('/completed-examinations',
  authenticateToken,
  requireAdminOrStaff,
  requireOphthalmologistLocal,
  ophthalmologistController.getCompletedExaminations
);

/**
 * @route   POST /api/ophthalmologist/queue/apply-doctor-fcfs
 * @desc    Apply FCFS ordering to a doctor's queue based on optometrist examination completion time
 * @access  Private (Ophthalmologist, Doctor, Admin, Receptionist2)
 */
router.post('/queue/apply-doctor-fcfs',
  authenticateToken,
  requireAdminOrStaff,
  requireQueueAccess,
  ophthalmologistController.applyDoctorFCFS
);

module.exports = router;
