const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, requireStaff, requireAdminOrStaff } = require('../middleware/auth');

// Staff attendance routes
router.post('/checkin', authenticateToken, requireStaff, attendanceController.checkIn);
router.post('/checkout', authenticateToken, requireStaff, attendanceController.checkOut);
router.get('/status', authenticateToken, requireStaff, attendanceController.getCurrentStatus);
router.get('/today', authenticateToken, requireStaff, attendanceController.getTodayAttendance);
router.get('/today-status', authenticateToken, requireStaff, attendanceController.getTodayAttendanceStatus);

// Admin attendance routes
router.get('/daily', authenticateToken, requireAdminOrStaff, attendanceController.getDailyAttendanceReport);
router.get('/monthly', authenticateToken, requireAdminOrStaff, attendanceController.getMonthlyAttendanceReport);
router.get('/date-range', authenticateToken, requireAdminOrStaff, attendanceController.getDateRangeAttendanceReport);
router.get('/staff/:staffId', authenticateToken, requireAdminOrStaff, attendanceController.getStaffAttendanceHistory);
router.get('/total-staff', authenticateToken, requireAdminOrStaff, attendanceController.getTotalStaffCount);

// Daily QR code for attendance
router.get('/daily-qr', authenticateToken, requireAdminOrStaff, attendanceController.getDailyQR);

// Location-based attendance marking
router.post('/mark-location', authenticateToken, requireStaff, attendanceController.markLocationAttendance);

// Admin: Mark attendance for staff
router.post('/mark', authenticateToken, requireAdminOrStaff, attendanceController.markAttendance);
router.post('/mark-all-present', authenticateToken, requireAdminOrStaff, attendanceController.markAllPresent);
router.post('/mark-all-leave', authenticateToken, requireAdminOrStaff, attendanceController.markAllLeave);
router.post('/mark-all-holiday', authenticateToken, requireAdminOrStaff, attendanceController.markAllHoliday);
router.post('/update-missing-attendance', authenticateToken, requireAdminOrStaff, attendanceController.updateMissingAttendance);

module.exports = router;