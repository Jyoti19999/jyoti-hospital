const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const { authenticateToken, requireSuperAdmin, requireAdminOrStaff, requireStaff } = require('../middleware/auth');

// ============ SHIFT CONFIG (SuperAdmin) ============
router.get('/shift-config', authenticateToken, requireSuperAdmin, salaryController.getShiftConfig);
router.put('/shift-config', authenticateToken, requireSuperAdmin, salaryController.updateShiftConfig);

// ============ STAFF SALARY MANAGEMENT (SuperAdmin) ============
router.get('/staff-salaries', authenticateToken, requireSuperAdmin, salaryController.getAllStaffSalaries);
router.put('/staff/:staffId/salary', authenticateToken, requireSuperAdmin, salaryController.updateStaffSalary);
router.get('/staff/:staffId/salary-history', authenticateToken, requireSuperAdmin, salaryController.getStaffSalaryHistory);

// ============ ADMIN EDIT ATTENDANCE TIME (SuperAdmin) ============
router.put('/attendance/:staffId/edit-time', authenticateToken, requireSuperAdmin, salaryController.adminEditAttendanceTime);

// ============ SPECIAL HOLIDAY QUOTA (SuperAdmin) ============
router.post('/holiday-quota', authenticateToken, requireSuperAdmin, salaryController.createSpecialHolidayQuota);
router.get('/holiday-quotas', authenticateToken, requireSuperAdmin, salaryController.getSpecialHolidayQuotas);
router.put('/holiday-quota/:id', authenticateToken, requireSuperAdmin, salaryController.updateSpecialHolidayQuota);
router.delete('/holiday-quota/:id', authenticateToken, requireSuperAdmin, salaryController.deleteSpecialHolidayQuota);
router.post('/holiday-quota/:quotaId/allocate', authenticateToken, requireSuperAdmin, salaryController.allocateSpecialHoliday);
router.get('/holiday-quota/:quotaId/allocations', authenticateToken, requireSuperAdmin, salaryController.getQuotaAllocations);
router.delete('/holiday-allocation/:id', authenticateToken, requireSuperAdmin, salaryController.removeSpecialHolidayAllocation);

// ============ PAYSLIP MANAGEMENT (SuperAdmin) ============
router.post('/payslip/generate', authenticateToken, requireSuperAdmin, salaryController.generatePayslip);
router.post('/payslip/generate-bulk', authenticateToken, requireSuperAdmin, salaryController.generateBulkPayslips);
router.put('/payslip/:id/finalize', authenticateToken, requireSuperAdmin, salaryController.finalizePayslip);
router.get('/payslip/:id', authenticateToken, requireSuperAdmin, salaryController.getPayslip);
router.get('/payslips/staff/:staffId', authenticateToken, requireSuperAdmin, salaryController.getStaffPayslips);
router.get('/payslips/monthly', authenticateToken, requireSuperAdmin, salaryController.getMonthlyPayslips);

// ============ STAFF SELF-SERVICE ============
router.get('/my/payslips', authenticateToken, requireStaff, salaryController.getMyPayslips);
router.get('/my/payslip/:id', authenticateToken, requireStaff, salaryController.getMyPayslipDetail);
router.get('/my/payslip/:id/pdf', authenticateToken, requireStaff, salaryController.downloadPayslipPdf);
router.get('/my/salary-summary', authenticateToken, requireStaff, salaryController.getMySalarySummary);
router.get('/my/calendar-attendance', authenticateToken, requireStaff, salaryController.getMyCalendarAttendance);

module.exports = router;
