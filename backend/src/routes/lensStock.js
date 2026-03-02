const express = require('express');
const router = express.Router();
const lensStockController = require('../controllers/lensStockController');
const auth = require('../middleware/auth');
const {
  validateCreateLensStock,
  validateUpdateLensStock,
  validateAddStock,
  validateRemoveStock,
  validateAdjustStock,
  validateQueryFilters
} = require('../validation/lensStockValidation');

// Apply authentication middleware to all routes
router.use(auth.authenticateToken);

// Lens stock CRUD operations (with query validation)
router.get('/', validateQueryFilters, lensStockController.getAllLensStock);
router.get('/low-stock', lensStockController.getLowStockLenses);
router.get('/near-expiry', validateQueryFilters, lensStockController.getNearExpiryLenses);
router.get('/dashboard-stats', lensStockController.getLensDashboardStats);
router.get('/usage-analytics', validateQueryFilters, lensStockController.getLensUsageStats);
router.get('/categories', lensStockController.getLensCategories);
router.get('/types', lensStockController.getLensTypes);
router.get('/search', validateQueryFilters, lensStockController.searchLensesWithStock);
router.get('/:id', lensStockController.getLensStockById);
router.get('/:id/transactions', validateQueryFilters, lensStockController.getStockTransactions);

// Admin/Staff only operations (require appropriate role)
router.post('/', validateCreateLensStock, lensStockController.createLensStock);
router.put('/:id', validateUpdateLensStock, lensStockController.updateLensStock);
router.delete('/:id', lensStockController.deleteLensStock);

// Stock movement operations
router.post('/:id/add-stock', validateAddStock, lensStockController.addStock);
router.post('/:id/remove-stock', validateRemoveStock, lensStockController.removeStock);
router.post('/:id/adjust-stock', validateAdjustStock, lensStockController.adjustStock);

module.exports = router;