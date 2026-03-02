const eyeDropReasonService = require('../services/eyeDropReasonService');

/**
 * Get all eye drop reasons
 */
const getAllReasons = async (req, res) => {
  try {
    const reasons = await eyeDropReasonService.getAllReasons();
    
    res.status(200).json({
      success: true,
      data: reasons
    });
  } catch (error) {
    console.error('Error fetching eye drop reasons:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch eye drop reasons'
    });
  }
};

/**
 * Create a new eye drop reason
 */
const createReason = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }
    
    const newReason = await eyeDropReasonService.createReason(reason.trim());
    
    res.status(201).json({
      success: true,
      message: 'Eye drop reason created successfully',
      data: newReason
    });
  } catch (error) {
    console.error('Error creating eye drop reason:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create eye drop reason'
    });
  }
};

/**
 * Update an eye drop reason
 */
const updateReason = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      });
    }
    
    const updatedReason = await eyeDropReasonService.updateReason(id, reason.trim());
    
    res.status(200).json({
      success: true,
      message: 'Eye drop reason updated successfully',
      data: updatedReason
    });
  } catch (error) {
    console.error('Error updating eye drop reason:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update eye drop reason'
    });
  }
};

/**
 * Delete an eye drop reason
 */
const deleteReason = async (req, res) => {
  try {
    const { id } = req.params;
    
    await eyeDropReasonService.deleteReason(id);
    
    res.status(200).json({
      success: true,
      message: 'Eye drop reason deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting eye drop reason:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete eye drop reason'
    });
  }
};

module.exports = {
  getAllReasons,
  createReason,
  updateReason,
  deleteReason
};
