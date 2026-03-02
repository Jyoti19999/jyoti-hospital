// src/routes/otRoomRoutes.js
const express = require('express');
const router = express.Router();
const otRoomController = require('../controllers/otRoomController');
const { authenticateToken, requireStaff, requireAdminOrStaff } = require('../middleware/auth');

// Middleware to check OT Admin permissions for write operations
const requireOTAdminAccess = (req, res, next) => {
  // Allow super admin access
  if (req.userType === 'super_admin') {
    return next();
  }
  
  const allowedStaffTypes = [
    'ot_admin',
    'ot-admin',
    'otadmin',
    'admin' // Allow admin as well
  ];
  
  if (!allowedStaffTypes.includes(req.user.staffType?.toLowerCase())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. OT Admin access required.',
      requiredRoles: allowedStaffTypes,
      userRole: req.user.staffType
    });
  }
  
  next();
};

// Middleware to check read access (TPA, OT Admin, Surgeon, Anesthesiologist, Sister, Admin can read)
const requireOTRoomReadAccess = (req, res, next) => {
  // Allow super admin access
  if (req.userType === 'super_admin') {
    return next();
  }
  
  const allowedStaffTypes = [
    'ot_admin',
    'ot-admin',
    'otadmin',
    'admin',
    'tpa',
    'surgeon', // Allow surgeons to view OT rooms
    'anesthesiologist', // Allow anesthesiologists to view OT rooms
    'receptionist2', // Also allow receptionist2 who schedules surgeries
    'sister', // Allow nursing staff to view OT rooms
    'nurse' // Also allow nurse as an alias
  ];
  
  if (!allowedStaffTypes.includes(req.user.staffType?.toLowerCase())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to view OT rooms.',
      requiredRoles: allowedStaffTypes,
      userRole: req.user.staffType
    });
  }
  
  next();
};

// Get all OT rooms (Read access - TPA, OT Admin, Admin, SuperAdmin)
router.get('/', authenticateToken, requireAdminOrStaff, requireOTRoomReadAccess, otRoomController.getAllOTRooms);

// Get single OT room by ID (Read access - TPA, OT Admin, Admin, SuperAdmin)
router.get('/:id', authenticateToken, requireAdminOrStaff, requireOTRoomReadAccess, otRoomController.getOTRoomById);

// Create new OT room
router.post('/', authenticateToken, requireAdminOrStaff, requireOTAdminAccess, otRoomController.createOTRoom);

// Update OT room
router.put('/:id', authenticateToken, requireAdminOrStaff, requireOTAdminAccess, otRoomController.updateOTRoom);

// Delete OT room
router.delete('/:id', authenticateToken, requireAdminOrStaff, requireOTAdminAccess, otRoomController.deleteOTRoom);

module.exports = router;
