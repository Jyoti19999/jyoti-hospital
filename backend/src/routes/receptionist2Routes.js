// src/routes/receptionist2Routes.js
const express = require('express');
const router = express.Router();
const receptionist2Controller = require('../controllers/receptionist2Controller');
const { authenticateToken, requireStaff, requireReceptionist2, requireReceptionist2OrSister, requireAdminOrStaff } = require('../middleware/auth');

// Middleware to allow receptionist2 or admin access
const requireReceptionist2OrAdmin = (req, res, next) => {
  // Allow super_admin userType or admin staffType
  const isSuperAdmin = req.userType === 'super_admin';
  const isAdmin = req.user.staffType === 'admin';
  const isReceptionist2 = req.user.staffType === 'receptionist2';
  
  if (isSuperAdmin || isAdmin || isReceptionist2) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    message: 'Access denied. Receptionist2, Admin, or Super Admin role required.',
    currentRole: req.user.staffType || req.userType,
    allowedRoles: ['receptionist2', 'admin', 'super_admin']
  });
};

// Test route for debugging authentication
router.get('/test-auth', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication successful',
    user: {
      id: req.user.id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      staffType: req.user.staffType,
      userType: req.userType
    }
  });
});

// Dashboard Routes
router.get('/dashboard', authenticateToken, requireStaff, requireReceptionist2, receptionist2Controller.getDashboard);
router.get('/dashboard/stats', authenticateToken, requireStaff, requireReceptionist2, receptionist2Controller.getDashboardStatistics);

// Patient Management Routes - View optometrist checked patients
router.get('/patients/optometrist-checked', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.getOptometristCheckedPatients);
router.get('/patients/examination/:examinationId', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.getPatientExaminationDetails);
router.get('/patients/search', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.searchPatients);

// Queue Management Routes - View current queue status
router.get('/queue/status', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.getCurrentQueueStatus);
router.get('/queue/optometrist', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.getOptometristQueue);

// Patient Review Management Routes
router.post('/patients/examination/:examinationId/mark-reviewed', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.markPatientAsReviewed);
router.post('/patients/examination/:examinationId/unmark-reviewed', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.unmarkPatientAsReviewed);

// Patient Registration Routes
router.post('/patients/register', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.registerPatient);
router.post('/patients/emergency-routing', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.handleEmergencyRouting);
router.get('/patients/ophthalmology-queue', authenticateToken, requireAdminOrStaff, receptionist2Controller.getOphthalmologyQueue);
router.get('/patients/ophthalmology-queue/doctor-specific', authenticateToken, requireStaff, receptionist2Controller.getDoctorSpecificQueues);
router.get('/patients/ophthalmology-details/:visitId', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.getOphthalmologyPatientDetails);
router.post('/patients/ophthalmology-queue/:queueEntryId/mark-reviewed', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.markOphthalmologyPatientAsReviewed);
router.post('/patients/ophthalmology-queue/:queueEntryId/unmark-reviewed', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.unmarkOphthalmologyPatientAsReviewed);
router.post('/patients/ophthalmology-queue/:queueEntryId/toggle-review', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.toggleOphthalmologyPatientReview);
router.get('/patients/registered-today', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.getTodayRegistrations);
router.get('/dashboard/registration-stats', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.getRegistrationStatistics);

// Ophthalmologist Assignment Routes
router.post('/patients/ophthalmology-queue/:queueEntryId/assign-doctor', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.assignPatientToOphthalmologist);
router.get('/ophthalmologists/available', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.getAvailableOphthalmologists);

// ON_HOLD Queue Routes - Eye drops management (accessible by receptionist2 and sister)
router.get('/patients/on-hold-queue', authenticateToken, requireStaff, requireReceptionist2OrSister, receptionist2Controller.getOnHoldPatients);

// Alarm Status Routes - Track if timer alarm has been played
router.get('/queue/alarm-status/:queueEntryId', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.getAlarmStatus);
router.post('/queue/mark-alarm-played/:queueEntryId', authenticateToken, requireAdminOrStaff, requireReceptionist2OrAdmin, receptionist2Controller.markAlarmAsPlayed);

// =================
// IPD MANAGEMENT ROUTES FOR RECEPTIONIST2
// =================

// Today's surgeries management
router.get('/ipd/surgeries/today', authenticateToken, requireStaff, requireReceptionist2, receptionist2Controller.getTodaysSurgeries);

// Upcoming surgeries
router.get('/ipd/surgeries/upcoming', authenticateToken, requireStaff, requireReceptionist2, receptionist2Controller.getUpcomingSurgeries);

// Fitness reports management
router.get('/ipd/fitness-reports', authenticateToken, requireStaff, requireReceptionist2, receptionist2Controller.getFitnessReportsForReview);

// IPD dashboard statistics
router.get('/ipd/dashboard/stats', authenticateToken, requireStaff, requireReceptionist2, receptionist2Controller.getIpdDashboardStats);

// Surgery day visit management
router.post('/ipd/admissions/:admissionId/create-surgery-visit', authenticateToken, requireStaff, requireReceptionist2, receptionist2Controller.createSurgeryDayVisit);

// Surgery recommendation workflow
router.get('/surgery/recommended-patients', authenticateToken, requireStaff, requireReceptionist2, receptionist2Controller.getSurgeryRecommendedPatients);
router.post('/surgery/patients/:patientId/update-details', authenticateToken, requireStaff, requireReceptionist2, receptionist2Controller.updateSurgeryDetails);

module.exports = router;