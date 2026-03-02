const express = require('express');
const router = express.Router();
const patientService = require('../services/patientService');

/**
 * POST /api/v1/self-checkin
 * Public route - no authentication required
 * Allows patients to self check-in using their 4-digit token number
 */
router.post('/', async (req, res) => {
  try {
    const { tokenNumber } = req.body;

    // Validate required fields
    if (!tokenNumber) {
      return res.status(400).json({
        success: false,
        message: 'Token number is required'
      });
    }

    // Validate token format (4 digits)
    if (!/^\d{4}$/.test(tokenNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format. Token must be 4 digits.'
      });
    }

    // Self check-in always uses ROUTINE priority
    const priorityLabel = 'ROUTINE';

    // Process check-in using the same service
    const result = await patientService.checkInPatientByToken(tokenNumber, priorityLabel);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        appointment: {
          id: result.appointment.id,
          tokenNumber: result.appointment.tokenNumber,
          appointmentDate: result.appointment.appointmentDate,
          appointmentTime: result.appointment.appointmentTime,
          status: result.appointment.status,
          patient: {
            firstName: result.appointment.patient.firstName,
            lastName: result.appointment.patient.lastName,
          }
        },
        queueInfo: result.queueInfo,
        alreadyCheckedIn: result.alreadyCheckedIn
      }
    });

  } catch (error) {
    console.error('❌ Error during self check-in:', error);

    let statusCode = 400;
    if (error.message.includes('not found') || error.message.includes('Invalid token')) {
      statusCode = 404;
    } else if (error.message.includes('already checked in') || error.message.includes('already exists')) {
      statusCode = 409;
    } else if (error.message.includes('not scheduled for today')) {
      statusCode = 400;
    } else if (error.message.includes('contact support')) {
      statusCode = 500;
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Check-in failed'
    });
  }
});

module.exports = router;
