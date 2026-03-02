// src/routes/fitnessInvestigationRoutes.js
const express = require('express');
const router = express.Router();
const { requireSuperAdmin } = require('../middleware/auth');
const fitnessInvestigationController = require('../controllers/fitnessInvestigationController');

// Routes for fitness investigations
router.get('/', requireSuperAdmin, fitnessInvestigationController.getAllFitnessInvestigations);
router.post('/', requireSuperAdmin, fitnessInvestigationController.createFitnessInvestigation);
router.put('/:id', requireSuperAdmin, fitnessInvestigationController.updateFitnessInvestigation);
router.delete('/:id', requireSuperAdmin, fitnessInvestigationController.deleteFitnessInvestigation);

module.exports = router;