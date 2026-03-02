const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticateToken, requireSuperAdmin, requireStaff } = require('../middleware/auth');

// ============ STAFF SELF-SERVICE ============
router.post('/request', authenticateToken, requireStaff, leaveController.submitLeaveRequest);
router.get('/my-requests', authenticateToken, requireStaff, leaveController.getMyLeaveRequests);
router.delete('/request/:id', authenticateToken, requireStaff, leaveController.cancelLeaveRequest);

// Late approval
router.post('/late-approval', authenticateToken, requireStaff, leaveController.submitLateApproval);
router.get('/my-late-approvals', authenticateToken, requireStaff, leaveController.getMyLateApprovals);

// ============ ADMIN MANAGEMENT ============
router.get('/requests', authenticateToken, requireSuperAdmin, leaveController.getAllLeaveRequests);
router.put('/request/:id/review', authenticateToken, requireSuperAdmin, leaveController.reviewLeaveRequest);

router.get('/late-approvals', authenticateToken, requireSuperAdmin, leaveController.getAllLateApprovals);
router.put('/late-approval/:id/review', authenticateToken, requireSuperAdmin, leaveController.reviewLateApproval);

// Pending counts
router.get('/pending-count', authenticateToken, requireSuperAdmin, leaveController.getPendingCount);

module.exports = router;
