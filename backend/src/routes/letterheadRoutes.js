const express = require('express');
const router = express.Router();
const letterheadController = require('../controllers/letterheadController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

// Read-only routes - accessible to all authenticated users (for prescription printing)
router.get('/templates', authenticateToken, letterheadController.getAllTemplates);
router.get('/templates/default', authenticateToken, letterheadController.getDefaultTemplate);
router.get('/templates/:id', authenticateToken, letterheadController.getTemplateById);

// Write routes - require super admin authentication
router.post('/templates', authenticateToken, requireSuperAdmin, letterheadController.createTemplate);
router.put('/templates/:id', authenticateToken, requireSuperAdmin, letterheadController.updateTemplate);
router.delete('/templates/:id', authenticateToken, requireSuperAdmin, letterheadController.deleteTemplate);

module.exports = router;
