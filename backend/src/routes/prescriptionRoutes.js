const express = require('express');
const prescriptionController = require('../controllers/prescriptionController');
const { authenticateToken, requireStaff } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
router.use(requireStaff);

// Create prescription
router.post('/', prescriptionController.createPrescription);

// Get prescription by examination ID
router.get('/examination/:examinationId', prescriptionController.getPrescriptionByExamination);

// Get prescription by visit ID
router.get('/visit/:visitId', prescriptionController.getPrescriptionByVisit);

// Get prescription by ID
router.get('/:id', prescriptionController.getPrescriptionById);

// Update prescription
router.put('/:id', prescriptionController.updatePrescription);

// Delete prescription item
router.delete('/items/:itemId', prescriptionController.deletePrescriptionItem);

module.exports = router;
