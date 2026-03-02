const express = require('express');
const router = express.Router();
const digitalRegisterController = require('../controllers/digitalRegisterController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Register definition routes
router.post('/definitions', digitalRegisterController.createRegisterDefinition);
router.get('/definitions', digitalRegisterController.getRegisterDefinitions);
router.get('/definitions/:id', digitalRegisterController.getRegisterDefinitionById);
router.put('/definitions/:id', digitalRegisterController.updateRegisterDefinition);
router.delete('/definitions/:id', digitalRegisterController.deleteRegisterDefinition);

// Register record routes
router.post('/definitions/:id/records', digitalRegisterController.createRegisterRecord);
router.get('/definitions/:id/records', digitalRegisterController.getRegisterRecords);
router.put('/records/:recordId', digitalRegisterController.updateRegisterRecord);
router.delete('/records/:recordId', digitalRegisterController.deleteRegisterRecord);

// Image upload route
router.post('/upload-image', digitalRegisterController.uploadImage);

// PDF upload route
router.post('/upload-pdf', digitalRegisterController.uploadPdf);

module.exports = router;
