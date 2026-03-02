// src/routes/surgeryTypeRoutes.js
const express = require('express');
const surgeryTypeController = require('../controllers/surgeryTypeController');
const { authenticateToken, requireStaff, requireSuperAdmin,requireAdminOrStaff } = require('../middleware/auth');

const router = express.Router();

// Middleware for staff who can access surgery types (doctors, admin) and super admins
const requireSurgeryAccess = (req, res, next) => {
  // Allow super admin access
  if (req.userType === 'super_admin') {
    return next();
  }
  
  // Allow specific staff types (including both camelCase and underscore variations)
  const allowedRoles = ['ophthalmologist', 'doctor', 'admin', 'receptionist2', 'surgeon', 'sister', 'otAdmin', 'ot_admin', 'tpa', 'anesthesiologist'];
  if (!allowedRoles.includes(req.user.staffType)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Surgery type access not permitted for your role.',
      currentRole: req.user.staffType,
      userType: req.userType,
      allowedRoles: allowedRoles
    });
  }
  next();
};

// Middleware for super admin access (use existing middleware)
// Remove the custom requireSuperAdminAccess since we have requireSuperAdmin

// ===== ADMIN SURGERY MANAGEMENT ROUTES =====
// Surgery Types Admin Management
router.get('/admin/types', authenticateToken, requireSuperAdmin, surgeryTypeController.getAdminSurgeryTypes);
router.get('/admin/types-with-investigations', authenticateToken, requireSuperAdmin, surgeryTypeController.getSurgeryTypesWithInvestigations);
router.post('/admin/types', authenticateToken, requireSuperAdmin, surgeryTypeController.createSurgeryType);
router.put('/admin/types/:id', authenticateToken, requireSuperAdmin, surgeryTypeController.updateSurgeryType);
router.delete('/admin/types/:id', authenticateToken, requireSuperAdmin, surgeryTypeController.deleteSurgeryType);
router.get('/admin/types/:surgeryTypeId', authenticateToken, requireSuperAdmin, surgeryTypeController.getSurgeryTypeDetails);

// Surgery Packages Admin Management
router.get('/admin/packages', authenticateToken, requireAdminOrStaff, surgeryTypeController.getAllSurgeryPackages);
router.post('/admin/packages', authenticateToken, requireAdminOrStaff, surgeryTypeController.createSurgeryPackage);
router.put('/admin/packages/:id', authenticateToken, requireAdminOrStaff, surgeryTypeController.updateSurgeryPackage);
router.delete('/admin/packages/:id', authenticateToken, requireAdminOrStaff, surgeryTypeController.deleteSurgeryPackage);

// Fitness Investigations Admin Management
router.get('/admin/investigations', authenticateToken, requireAdminOrStaff, surgeryTypeController.getFitnessInvestigations);
router.post('/admin/investigations', authenticateToken, requireAdminOrStaff, surgeryTypeController.createFitnessInvestigation);
router.put('/admin/investigations/:id', authenticateToken, requireAdminOrStaff, surgeryTypeController.updateFitnessInvestigation);
router.delete('/admin/investigations/:id', authenticateToken, requireAdminOrStaff, surgeryTypeController.deleteFitnessInvestigation);

// Surgery Investigation Management Routes (Super Admin only)
router.post('/admin/types/:id/investigations/assign', authenticateToken, requireAdminOrStaff, surgeryTypeController.assignInvestigationsToSurgeryType);
router.post('/admin/types/:id/investigations/remove', authenticateToken, requireAdminOrStaff, surgeryTypeController.removeInvestigationsFromSurgeryType);

// ===== REGULAR SURGERY ROUTES =====
// Surgery Types - Apply authentication and access control
router.get('/types', authenticateToken, requireAdminOrStaff, requireSurgeryAccess, surgeryTypeController.getSurgeryTypes);
router.get('/types/dropdown', surgeryTypeController.getSurgeryTypeDropdown); // Temporarily remove auth for testing
router.get('/types/:surgeryTypeId', authenticateToken, requireAdminOrStaff, requireSurgeryAccess, surgeryTypeController.getSurgeryTypeDetails);
router.post('/types', authenticateToken, requireSuperAdmin, surgeryTypeController.createSurgeryType);

// Surgery Packages
router.get('/types/:surgeryTypeId/packages', authenticateToken, requireAdminOrStaff, requireSurgeryAccess, surgeryTypeController.getSurgeryTypePackages);
router.post('/packages', authenticateToken, requireSuperAdmin, surgeryTypeController.createSurgeryPackage);

// Surgery Fitness Requirements
router.get('/types/:surgeryTypeId/fitness-requirements', authenticateToken, requireAdminOrStaff, requireSurgeryAccess, surgeryTypeController.getSurgeryFitnessRequirements);

// Surgery Type Investigations - Get investigations for a specific surgery type
router.get('/types/:surgeryTypeId/investigations', authenticateToken, requireAdminOrStaff, requireSurgeryAccess, surgeryTypeController.getSurgeryTypeInvestigations);

// TPA accessible investigations list
router.get('/investigations', authenticateToken, requireAdminOrStaff, requireSurgeryAccess, surgeryTypeController.getFitnessInvestigations);

// Lenses - Allow admin and staff access as well as superadmin
router.get('/lenses', authenticateToken, requireAdminOrStaff, surgeryTypeController.getLenses);
router.post('/lenses', authenticateToken, requireAdminOrStaff, surgeryTypeController.createLens);

// Additional Charges - Allow admin and staff access
router.get('/additional-charges', authenticateToken, requireAdminOrStaff, surgeryTypeController.getAdditionalCharges);

module.exports = router;