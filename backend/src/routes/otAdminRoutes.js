// src/routes/otAdminRoutes.js
const express = require('express');
const router = express.Router();
const otAdminController = require('../controllers/otAdminController');
const { authenticateToken, requireStaff } = require('../middleware/auth');

// Middleware to check OT Admin permissions
const requireOTAdminAccess = (req, res, next) => {
  const allowedStaffTypes = [
    'ot_admin',
    'ot-admin',
    'otadmin'
  ];
  
  if (!allowedStaffTypes.includes(req.user.staffType)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. OT Admin access required.',
      requiredRoles: allowedStaffTypes,
      userRole: req.user.staffType
    });
  }
  
  next();
};

// Test route for OT Admin authentication
router.get('/test-auth', authenticateToken, requireStaff, requireOTAdminAccess, (req, res) => {
  res.json({
    success: true,
    message: 'OT Admin authentication successful',
    user: {
      id: req.user.id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      staffType: req.user.staffType,
      otAdminAccess: true
    }
  });
});

// =================
// COMPLETED SURGERIES MANAGEMENT
// =================

// Get completed surgeries for OT Admin equipment management
router.get('/completed-surgeries', authenticateToken, requireStaff, requireOTAdminAccess, otAdminController.getCompletedSurgeries);

// Get surgery details with equipment information
router.get('/surgery/:admissionId/details', authenticateToken, requireStaff, requireOTAdminAccess, otAdminController.getSurgeryDetails);

// Get equipment master data for adjustments
router.get('/equipment-master-data', authenticateToken, requireStaff, requireOTAdminAccess, otAdminController.getEquipmentMasterData);

// Finalize equipment stock adjustments after surgery
router.post('/finalize-equipment/:admissionId', authenticateToken, requireStaff, requireOTAdminAccess, otAdminController.finalizeEquipmentStock);

module.exports = router;