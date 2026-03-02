// src/routes/databaseViewerRoutes.js
const express = require('express');
const router = express.Router();
const databaseViewerController = require('../controllers/databaseViewerController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// All routes require super admin authentication
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Database viewer routes are working',
    user: req.user
  });
});

// Get all patients with pagination
router.get('/patients', databaseViewerController.getAllPatients);

// Get all appointments with pagination
router.get('/appointments', databaseViewerController.getAllAppointments);

// Get all staff with pagination
router.get('/staff', databaseViewerController.getAllStaff);

// Get all medical records with pagination
router.get('/medical-records', databaseViewerController.getAllMedicalRecords);

// Get database statistics
router.get('/statistics', databaseViewerController.getDatabaseStatistics);

// Delete patient
router.delete('/patients/:id', databaseViewerController.deletePatient);

// Update patient
router.put('/patients/:id', databaseViewerController.updatePatient);

module.exports = router;
