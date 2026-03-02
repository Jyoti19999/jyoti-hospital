// src/routes/lensRoutes.js
const express = require('express');
const router = express.Router();
const lensController = require('../controllers/lensController');
const { authenticateToken, requireStaff } = require('../middleware/auth');

// Middleware to check lens access permissions
const requireLensAccess = (req, res, next) => {
  const allowedStaffTypes = [
    'doctor',
    'surgeon', 
    'nurse',
    'sister',
    'receptionist2',
    'ot_admin',
    'anesthesiologist',
    'tpa',
    'admin'
  ];
  
  if (!allowedStaffTypes.includes(req.user.staffType)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Lens access required.',
      requiredRoles: allowedStaffTypes
    });
  }
  
  next();
};

// =================
// LENS ROUTES
// =================

// Get all available lenses (for surgery scheduling)
router.get('/available', authenticateToken, requireStaff, requireLensAccess, lensController.getAvailableLenses);

// Get all lenses with filters and search
router.get('/', authenticateToken, requireStaff, requireLensAccess, lensController.getAllLenses);

// Get lens by ID
router.get('/:lensId', authenticateToken, requireStaff, requireLensAccess, lensController.getLensById);

// Get lenses by type (IOL, TORIC_IOL, etc.)
router.get('/type/:lensType', authenticateToken, requireStaff, requireLensAccess, lensController.getLensesByType);

// Get lenses by category (MONOFOCAL, MULTIFOCAL, etc.)
router.get('/category/:lensCategory', authenticateToken, requireStaff, requireLensAccess, lensController.getLensesByCategory);

// Get lenses by manufacturer
router.get('/manufacturer/:manufacturer', authenticateToken, requireStaff, requireLensAccess, lensController.getLensesByManufacturer);

// Search lenses
router.get('/search/:searchTerm', authenticateToken, requireStaff, requireLensAccess, lensController.searchLenses);

module.exports = router;