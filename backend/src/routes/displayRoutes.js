const express = require('express');
const router = express.Router();
const optometristService = require('../services/optometristService');
const ophthalmologistService = require('../services/ophthalmologistService');

/**
 * GET /api/v1/display/queue/optometrist
 * Public route - no authentication required
 * Returns optometrist queue for digital display
 */
router.get('/queue/optometrist', async (req, res) => {
  try {
    const queueData = await optometristService.getOptometristQueue();

    res.status(200).json({
      success: true,
      message: 'Optometrist queue retrieved successfully',
      data: queueData
    });
  } catch (error) {
    console.error('❌ Error getting optometrist queue for display:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get optometrist queue'
    });
  }
});

/**
 * GET /api/v1/display/queue/ophthalmologist
 * Public route - no authentication required
 * Returns ophthalmologist queue for digital display
 */
router.get('/queue/ophthalmologist', async (req, res) => {
  try {
    const queueData = await ophthalmologistService.getOphthalmologistQueue();

    res.status(200).json({
      success: true,
      message: 'Ophthalmologist queue retrieved successfully',
      data: queueData
    });
  } catch (error) {
    console.error('❌ Error getting ophthalmologist queue for display:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ophthalmologist queue'
    });
  }
});

module.exports = router;
