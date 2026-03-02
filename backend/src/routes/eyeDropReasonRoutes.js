const express = require('express');
const router = express.Router();
const eyeDropReasonController = require('../controllers/eyeDropReasonController');
const { authenticateToken, requireStaff, requireAdminStaff, requireSuperAdmin } = require('../middleware/auth');

/**
 * @route   GET /api/eye-drop-reasons
 * @desc    Get all eye drop reasons (for doctors to select)
 * @access  Private (All authenticated users - staff and superadmin)
 */
router.get('/',
  authenticateToken,
  eyeDropReasonController.getAllReasons
);

/**
 * @route   POST /api/eye-drop-reasons
 * @desc    Create a new eye drop reason
 * @access  Private (Admin or SuperAdmin)
 */
router.post('/',
  authenticateToken,
  eyeDropReasonController.createReason
);

/**
 * @route   PUT /api/eye-drop-reasons/:id
 * @desc    Update an eye drop reason
 * @access  Private (Admin or SuperAdmin)
 */
router.put('/:id',
  authenticateToken,
  eyeDropReasonController.updateReason
);

/**
 * @route   DELETE /api/eye-drop-reasons/:id
 * @desc    Delete an eye drop reason
 * @access  Private (Admin or SuperAdmin)
 */
router.delete('/:id',
  authenticateToken,
  eyeDropReasonController.deleteReason
);

module.exports = router;
