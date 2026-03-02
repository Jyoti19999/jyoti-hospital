const express = require('express');
const medicineMasterController = require('../controllers/medicineMasterController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Search endpoint - accessible to all authenticated users
router.get('/search', authenticateToken, medicineMasterController.searchMedicines);

// All other routes require super admin authentication
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Medicine Type routes
router.post('/types', medicineMasterController.createMedicineType);
router.get('/types', medicineMasterController.getMedicineTypes);

// Generic Medicine routes
router.post('/generic-medicines', medicineMasterController.createGenericMedicine);
router.get('/generic-medicines', medicineMasterController.getGenericMedicines);

// Drug Group routes
router.post('/drug-groups', medicineMasterController.createDrugGroup);
router.get('/drug-groups', medicineMasterController.getDrugGroups);

// Dosage Schedule routes
router.post('/dosage-schedules', medicineMasterController.createDosageSchedule);
router.get('/dosage-schedules', medicineMasterController.getDosageSchedules);

// Medicine routes
router.post('/medicines', medicineMasterController.createMedicine);
router.get('/medicines', medicineMasterController.getMedicines);
router.put('/medicines/:id', medicineMasterController.updateMedicine);
router.delete('/medicines/:id', medicineMasterController.deleteMedicine);

module.exports = router;
