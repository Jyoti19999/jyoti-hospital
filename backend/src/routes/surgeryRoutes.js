// src/routes/surgeryRoutes.js
const express = require('express');
const router = express.Router();
const surgeryController = require('../controllers/surgeryController');
const surgeonAnalyticsController = require('../controllers/surgeonAnalyticsController');
const { authenticateToken, requireStaff } = require('../middleware/auth');

// ============================================
// SURGEON ANALYTICS ROUTES
// ============================================

// Get surgeon analytics data
router.get('/surgeon-analytics',
  authenticateToken,
  requireStaff,
  surgeonAnalyticsController.getSurgeonAnalytics
);

// ============================================
// SURGERY WORKFLOW ROUTES
// ============================================

// Receptionist2 Surgery Management
router.get('/recommended-patients', 
  authenticateToken, 
  requireStaff, 
  surgeryController.getSurgeryRecommendedPatients
);

router.post('/patients/:patientId/update-details', 
  authenticateToken, 
  requireStaff, 
  surgeryController.updateSurgeryDetails
);

// OT Admin Surgery Management  
router.get('/upcoming-requests', 
  authenticateToken, 
  requireStaff, 
  surgeryController.getUpcomingSurgeryRequests
);

router.post('/admissions/:admissionId/assign-details', 
  authenticateToken, 
  requireStaff, 
  surgeryController.assignSurgeryDetails
);

module.exports = router;