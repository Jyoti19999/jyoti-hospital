// src/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken, requireAdminOrStaff } = require('../middleware/auth');

// Resume partially completed consultation
router.post('/resume-partial-consultation', authenticateToken, requireAdminOrStaff, appointmentController.resumePartialConsultation);

// Delete appointment
router.delete('/:id', authenticateToken, requireAdminOrStaff, appointmentController.deleteAppointment);

module.exports = router;
