const express = require('express');
const diagnosisMasterController = require('../controllers/diagnosisMasterController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Search endpoint - accessible to all authenticated users (staff and super admin)
router.get('/search', authenticateToken, diagnosisMasterController.searchDiagnoses.bind(diagnosisMasterController));

// All other routes require super admin authentication
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Seed common eye diseases (Quick setup)
router.post('/seed-common-diseases', diagnosisMasterController.seedCommonDiseases.bind(diagnosisMasterController));

// Fetch eye diseases from ICD-11 API (Advanced - takes time)
router.get('/fetch-eye-diseases', diagnosisMasterController.fetchEyeDiseases.bind(diagnosisMasterController));

// Import diseases to database
router.post('/import-diseases', diagnosisMasterController.importDiseases.bind(diagnosisMasterController));

// Get current diagnosis master data
router.get('/diagnosis-master', diagnosisMasterController.getDiagnosisMaster.bind(diagnosisMasterController));

// Update disease details
router.put('/diseases/:id', diagnosisMasterController.updateDisease.bind(diagnosisMasterController));

// Delete disease
router.delete('/diseases/:id', diagnosisMasterController.deleteDisease.bind(diagnosisMasterController));

// Get statistics
router.get('/statistics', diagnosisMasterController.getStatistics.bind(diagnosisMasterController));

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Diagnosis Master API is working',
    timestamp: new Date().toISOString(),
    user: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'Unknown'
  });
});

module.exports = router;