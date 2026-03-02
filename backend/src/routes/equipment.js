const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { authenticateToken } = require('../middleware/auth');
const { validateCreateEquipment, validateUpdateEquipment, validateStockOperation, validateStockAdjustment } = require('../validation/equipmentValidation');

// Public routes (for equipment selection in surgeries)
router.get('/search', equipmentController.searchEquipment);
router.get('/categories', equipmentController.getEquipmentCategories);

// Protected routes (require authentication)
router.use(authenticateToken);

// Equipment CRUD
router.get('/', equipmentController.getAllEquipment);
router.get('/stats/dashboard', equipmentController.getEquipmentDashboardStats);
router.get('/stats/usage', equipmentController.getEquipmentUsageStats);
router.get('/low-stock', equipmentController.getLowStockEquipment);
router.get('/near-expiry', equipmentController.getNearExpiryEquipment);
router.get('/:id', equipmentController.getEquipmentById);
router.post('/', validateCreateEquipment, equipmentController.createEquipment);
router.put('/:id', validateUpdateEquipment, equipmentController.updateEquipment);
router.delete('/:id', equipmentController.deleteEquipment);

// Stock management
router.post('/:id/stock/add', validateStockOperation, equipmentController.addStock);
router.post('/:id/stock/remove', validateStockOperation, equipmentController.removeStock);
router.post('/:id/stock/adjust', validateStockAdjustment, equipmentController.adjustStock);
router.get('/:id/stock/transactions', equipmentController.getStockTransactions);

// Sync all medicines to registers
router.post('/sync-registers', equipmentController.syncAllMedicinesToRegisters);

module.exports = router;