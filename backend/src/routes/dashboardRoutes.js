const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, requireAdminOrStaff } = require('../middleware/auth');

// Dashboard routes
router.get('/todays-surgeries', authenticateToken, requireAdminOrStaff, dashboardController.getTodaysSurgeries);
router.get('/todays-appointments', authenticateToken, requireAdminOrStaff, dashboardController.getTodaysAppointments);
router.get('/queue-status', authenticateToken, requireAdminOrStaff, dashboardController.getQueueStatus);
router.get('/recent-registrations', authenticateToken, requireAdminOrStaff, dashboardController.getRecentRegistrations);

module.exports = router;
