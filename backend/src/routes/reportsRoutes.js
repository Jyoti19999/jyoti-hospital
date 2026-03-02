const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken, requireAdminOrStaff } = require('../middleware/auth');

// All routes require authentication and admin/staff role
router.get('/optometrist-examinations', authenticateToken, requireAdminOrStaff, reportsController.getOptometristExaminations);
router.get('/appointments', authenticateToken, requireAdminOrStaff, reportsController.getAppointmentsReport);
router.get('/billing', authenticateToken, requireAdminOrStaff, reportsController.getBillingReport);
router.get('/consultation-payment', authenticateToken, requireAdminOrStaff, reportsController.getConsultationPayments);
router.get('/surgery-payment', authenticateToken, requireAdminOrStaff, reportsController.getSurgeryPayments);
router.get('/doctor-examinations', authenticateToken, requireAdminOrStaff, reportsController.getDoctorExaminations);
router.get('/completed-surgeries', authenticateToken, requireAdminOrStaff, reportsController.getCompletedSurgeries);
router.get('/scheduled-surgeries', authenticateToken, requireAdminOrStaff, reportsController.getScheduledSurgeries);
router.get('/anesthesia-cases', authenticateToken, requireAdminOrStaff, reportsController.getAnesthesiaCases);
router.get('/claim-pending', authenticateToken, requireAdminOrStaff, reportsController.getPendingClaims);
router.get('/claim-completed', authenticateToken, requireAdminOrStaff, reportsController.getCompletedClaims);
router.get('/doctors-list', authenticateToken, requireAdminOrStaff, reportsController.getDoctorsList);

module.exports = router;
