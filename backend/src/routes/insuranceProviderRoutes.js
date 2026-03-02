const express = require('express');
const router = express.Router();
const {
  getAllInsuranceProviders,
  getInsuranceProviderById,
  createInsuranceProvider,
  updateInsuranceProvider,
  deleteInsuranceProvider
} = require('../controllers/insuranceProviderController');
const { authenticateToken, requireStaff } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);
router.use(requireStaff);

// GET /api/v1/insurance-providers - Get all active insurance providers
router.get('/', getAllInsuranceProviders);

// GET /api/v1/insurance-providers/:id - Get insurance provider by ID
router.get('/:id', getInsuranceProviderById);

// POST /api/v1/insurance-providers - Create new insurance provider
router.post('/', createInsuranceProvider);

// PUT /api/v1/insurance-providers/:id - Update insurance provider
router.put('/:id', updateInsuranceProvider);

// DELETE /api/v1/insurance-providers/:id - Delete (deactivate) insurance provider
router.delete('/:id', deleteInsuranceProvider);

module.exports = router;
