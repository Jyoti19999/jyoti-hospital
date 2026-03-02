// src/routes/otEquipmentRoutes.js
const express = require('express');
const router = express.Router();
const otEquipmentController = require('../controllers/otEquipmentController');
const { authenticateToken, requireStaff, requireAdminOrStaff } = require('../middleware/auth');

// Get all equipment (All staff can view)
router.get('/', authenticateToken, requireStaff, otEquipmentController.getAllEquipment);

// Get equipment statistics
router.get('/stats', authenticateToken, requireStaff, otEquipmentController.getEquipmentStats);

// Get equipment by ID
router.get('/:id', authenticateToken, requireStaff, otEquipmentController.getEquipmentById);

// Create equipment (Admin or Staff)
router.post('/', authenticateToken, requireAdminOrStaff, otEquipmentController.createEquipment);

// Update equipment (Admin or Staff)
router.put('/:id', authenticateToken, requireAdminOrStaff, otEquipmentController.updateEquipment);

// Delete equipment (Admin or Staff)
router.delete('/:id', authenticateToken, requireAdminOrStaff, otEquipmentController.deleteEquipment);

// Add maintenance log
router.post('/:equipmentId/maintenance', authenticateToken, requireAdminOrStaff, otEquipmentController.addMaintenanceLog);

module.exports = router;
