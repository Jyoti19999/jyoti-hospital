// src/routes/ipdRoutes.js
const express = require('express');
const router = express.Router();
const ipdController = require('../controllers/ipdController');
const ipdBillingController = require('../controllers/ipdBillingController');
const { authenticateToken, requireStaff, requireAdminOrStaff } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Middleware to check IPD permissions (staff members who can access IPD)
const requireIpdAccess = (req, res, next) => {
  // Allow super admin access
  if (req.userType === 'super_admin') {
    return next();
  }
  
  const allowedStaffTypes = [
    'doctor',
    'surgeon', 
    'nurse',
    'sister',
    'receptionist2',
    'ot_admin',
    'anesthesiologist',
    'tpa'
  ];
  
  if (!allowedStaffTypes.includes(req.user.staffType)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. IPD access required.',
      requiredRoles: allowedStaffTypes
    });
  }
  
  next();
};

// Test route for IPD authentication
router.get('/test-auth', authenticateToken, requireStaff, requireIpdAccess, (req, res) => {
  res.json({
    success: true,
    message: 'IPD authentication successful',
    user: {
      id: req.user.id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      staffType: req.user.staffType,
      ipdAccess: true
    }
  });
});

// =================
// IPD ADMISSION ROUTES
// =================

// Create new IPD admission
router.post('/admissions', authenticateToken, requireStaff, requireIpdAccess, ipdController.createIpdAdmission);

// Get all IPD admissions (with filters)
router.get('/admissions', authenticateToken, requireStaff, requireIpdAccess, ipdController.getIpdAdmissions);

// Get specific IPD admission by ID
router.get('/admissions/:admissionId', authenticateToken, requireStaff, requireIpdAccess, ipdController.getIpdAdmissionById);

// Update IPD admission
router.put('/admissions/:admissionId', authenticateToken, requireStaff, requireIpdAccess, ipdController.updateIpdAdmission);

// Get admissions by patient ID
router.get('/patients/:patientId/admissions', authenticateToken, requireStaff, requireIpdAccess, ipdController.getPatientAdmissions);

// Get current IPD admissions (active patients)
router.get('/admissions/status/current', authenticateToken, requireStaff, requireIpdAccess, ipdController.getCurrentAdmissions);

// Get admissions scheduled for surgery today
router.get('/admissions/surgery/today', authenticateToken, requireAdminOrStaff, requireIpdAccess, ipdController.getTodaySurgeries);

// Get admissions scheduled for surgery (upcoming)
router.get('/admissions/surgery/upcoming', authenticateToken, requireStaff, requireIpdAccess, ipdController.getUpcomingSurgeries);

// Update admission status
router.patch('/admissions/:admissionId/status', authenticateToken, requireStaff, requireIpdAccess, ipdController.updateAdmissionStatus);

// Schedule surgery for admission
router.post('/admissions/:admissionId/schedule-surgery', authenticateToken, requireStaff, requireIpdAccess, ipdController.scheduleSurgery);

// Get available time slots for surgery scheduling
router.get('/available-time-slots', authenticateToken, requireStaff, requireIpdAccess, ipdController.getAvailableTimeSlots);

// Create surgery day visit
router.post('/admissions/:admissionId/surgery-day-visit', authenticateToken, requireStaff, requireIpdAccess, ipdController.createSurgeryDayVisit);

// =================
// FITNESS REPORT ROUTES  
// =================

// Create fitness report
router.post('/admissions/:admissionId/fitness-reports', authenticateToken, requireStaff, requireIpdAccess, ipdController.createFitnessReport);

// Get fitness reports for admission
router.get('/admissions/:admissionId/fitness-reports', authenticateToken, requireStaff, requireIpdAccess, ipdController.getFitnessReports);

// Get specific fitness report
router.get('/fitness-reports/:reportId', authenticateToken, requireStaff, requireIpdAccess, ipdController.getFitnessReportById);

// Update fitness report
router.put('/fitness-reports/:reportId', authenticateToken, requireStaff, requireIpdAccess, ipdController.updateFitnessReport);

// Update fitness status
router.patch('/fitness-reports/:reportId/status', authenticateToken, requireStaff, requireIpdAccess, ipdController.updateFitnessStatus);

// Get pending fitness reports
router.get('/fitness-reports/status/pending', authenticateToken, requireStaff, requireIpdAccess, ipdController.getPendingFitnessReports);

// Upload fitness report documents (ECG, X-ray, etc.)
router.post('/fitness-reports/:reportId/documents', authenticateToken, requireStaff, requireIpdAccess, ipdController.uploadFitnessDocuments);

// Upload investigation documents for IPD admission
router.post('/admissions/:admissionId/investigation-documents', authenticateToken, requireStaff, requireIpdAccess, ipdController.uploadInvestigationDocuments);

// Delete investigation document for IPD admission
router.delete('/admissions/:admissionId/investigation-documents', authenticateToken, requireStaff, requireIpdAccess, ipdController.deleteInvestigationDocument);

// =================
// PRE-OP ASSESSMENT ROUTES
// =================

// Create pre-op assessment
router.post('/admissions/:admissionId/preop-assessments', authenticateToken, requireStaff, requireIpdAccess, ipdController.createPreOpAssessment);

// Get pre-op assessments for admission
router.get('/admissions/:admissionId/preop-assessments', authenticateToken, requireStaff, requireIpdAccess, ipdController.getPreOpAssessments);

// Get specific pre-op assessment
router.get('/preop-assessments/:assessmentId', authenticateToken, requireStaff, requireIpdAccess, ipdController.getPreOpAssessmentById);

// Update pre-op assessment
router.put('/preop-assessments/:assessmentId', authenticateToken, requireStaff, requireIpdAccess, ipdController.updatePreOpAssessment);

// Get pending pre-op assessments
router.get('/preop-assessments/status/pending', authenticateToken, requireStaff, requireIpdAccess, ipdController.getPendingPreOpAssessments);

// =================
// SURGERY METRICS ROUTES
// =================

// Create surgery metrics (start surgery)
router.post('/admissions/:admissionId/surgery-metrics', authenticateToken, requireStaff, requireIpdAccess, ipdController.createSurgeryMetrics);

// Get surgery metrics for admission
router.get('/admissions/:admissionId/surgery-metrics', authenticateToken, requireStaff, requireIpdAccess, ipdController.getSurgeryMetrics);

// Get specific surgery metrics
router.get('/surgery-metrics/:metricsId', authenticateToken, requireStaff, requireIpdAccess, ipdController.getSurgeryMetricsById);

// Update surgery metrics (during/after surgery)
router.put('/surgery-metrics/:metricsId', authenticateToken, requireStaff, requireIpdAccess, ipdController.updateSurgeryMetrics);

// End surgery (update end time and post-op details)
router.patch('/surgery-metrics/:metricsId/complete', authenticateToken, requireStaff, requireIpdAccess, ipdController.completeSurgery);

// Get surgery metrics statistics
router.get('/surgery-metrics/stats/overview', authenticateToken, requireStaff, requireIpdAccess, ipdController.getSurgeryStatistics);

// =================
// DASHBOARD & REPORTING ROUTES
// =================

// IPD dashboard data
router.get('/dashboard', authenticateToken, requireStaff, requireIpdAccess, ipdController.getIpdDashboard);

// IPD statistics
router.get('/dashboard/stats', authenticateToken, requireStaff, requireIpdAccess, ipdController.getIpdStatistics);

// Surgery schedule dashboard
router.get('/dashboard/surgery-schedule', authenticateToken, requireStaff, requireIpdAccess, ipdController.getSurgeryScheduleDashboard);

// Patient workflow status
router.get('/workflow/status/:admissionId', authenticateToken, requireStaff, requireIpdAccess, ipdController.getWorkflowStatus);

// =================
// SURGERY CHECKIN ROUTES
// =================

// Get equipment and lens data for surgery checkin
router.get('/admissions/:admissionId/checkin-resources', authenticateToken, requireStaff, requireIpdAccess, ipdController.getCheckinResources);

// Update required equipment and lens selections for checkin
router.post('/admissions/:admissionId/checkin-selections', authenticateToken, requireStaff, requireIpdAccess, ipdController.updateCheckinSelections);

// Process surgery checkin with stock adjustments
router.post('/admissions/:admissionId/process-checkin', authenticateToken, requireStaff, requireIpdAccess, ipdController.processSurgeryCheckin);

// Give anesthesia to patient
router.post('/admissions/:admissionId/give-anesthesia', authenticateToken, requireStaff, requireIpdAccess, ipdController.giveAnesthesia);

// =================
// SURGEON DASHBOARD SURGERY ROUTES
// =================

// Get surgeon dashboard statistics
router.get('/surgeon/dashboard-stats', authenticateToken, requireStaff, requireIpdAccess, ipdController.getSurgeonDashboardStats);

// Get anesthesiologist dashboard statistics
router.get('/anesthesiologist/dashboard-stats', authenticateToken, requireStaff, requireIpdAccess, ipdController.getAnesthesiologistDashboardStats);

// Get patients ready for surgery
router.get('/surgeon/ready-for-surgery', authenticateToken, requireStaff, requireIpdAccess, ipdController.getReadyForSurgeryPatients);

// Get patients with surgery already started
router.get('/surgeon/surgery-started', authenticateToken, requireStaff, requireIpdAccess, ipdController.getSurgeryStartedPatients);

// Get completed surgeries
router.get('/surgeon/completed-surgeries', authenticateToken, requireStaff, requireIpdAccess, ipdController.getCompletedSurgeries);

// Get patient's recent examination data
router.get('/surgeon/patient/:patientId/examination', authenticateToken, requireStaff, requireIpdAccess, ipdController.getPatientRecentExamination);

// Get available equipment for surgery
router.get('/surgeon/available-equipment', authenticateToken, requireStaff, requireIpdAccess, ipdController.getAvailableEquipment);

// Start surgery
router.post('/surgeon/start-surgery', authenticateToken, requireStaff, requireIpdAccess, ipdController.startSurgery);

// Complete surgery
router.post('/surgeon/complete-surgery', authenticateToken, requireStaff, requireIpdAccess, ipdController.completeSurgery);

// =================
// RECEPTIONIST2 INTEGRATION ROUTES
// =================

// Get today's surgeries for receptionist2 dashboard
router.get('/receptionist2/today-surgeries', authenticateToken, requireStaff, requireIpdAccess, ipdController.getTodaySurgeriesForReceptionist);

// Get fitness reports requiring attention
router.get('/receptionist2/fitness-reports/pending', authenticateToken, requireStaff, requireIpdAccess, ipdController.getPendingFitnessForReceptionist);

// Get pre-op assessments status
router.get('/receptionist2/preop-status', authenticateToken, requireStaff, requireIpdAccess, ipdController.getPreOpStatusForReceptionist);

// Update patient workflow from receptionist2
router.post('/receptionist2/workflow/:admissionId/advance', authenticateToken, requireStaff, requireIpdAccess, ipdController.advanceWorkflowFromReceptionist);

// =================
// INSURANCE & CLAIM ROUTES
// =================

// Toggle insurance applicable status
router.patch('/admissions/:admissionId/insurance-applicable', authenticateToken, requireStaff, requireIpdAccess, ipdController.toggleInsuranceApplicable);

// =================
// BILLING ROUTES
// =================

// Get all admissions ready for billing
router.get('/billing/ready', authenticateToken, requireStaff, requireIpdAccess, ipdBillingController.getAdmissionsReadyForBilling);

// Calculate bill for an admission
router.get('/admissions/:admissionId/calculate-bill', authenticateToken, requireStaff, requireIpdAccess, ipdBillingController.calculateBill);

// Generate bill/invoice
router.post('/admissions/:admissionId/generate-bill', authenticateToken, requireStaff, requireIpdAccess, ipdBillingController.generateBill);

// Get billing summary
router.get('/admissions/:admissionId/billing-summary', authenticateToken, requireStaff, requireIpdAccess, ipdBillingController.getBillingSummary);

// Record payment
router.post('/admissions/:admissionId/record-payment', authenticateToken, requireStaff, requireIpdAccess, ipdBillingController.recordPayment);

// Get payment history
router.get('/admissions/:admissionId/payments', authenticateToken, requireStaff, requireIpdAccess, ipdBillingController.getPaymentHistory);

// Mark admission ready for billing
router.post('/admissions/:admissionId/mark-billing-ready', authenticateToken, requireStaff, requireIpdAccess, ipdBillingController.markReadyForBilling);

// Add additional charges from billing tab
router.post('/admissions/:admissionId/add-charges', authenticateToken, requireStaff, requireIpdAccess, ipdBillingController.addAdditionalCharges);

// Save payment receipt PDF
router.post('/admissions/:admissionId/save-receipt', authenticateToken, requireStaff, requireIpdAccess, ipdBillingController.saveReceipt);

module.exports = router;