const express = require('express');
const router = express.Router();
const staffTypeController = require('../controllers/staffTypeController');

// Only keep GET routes for fetching staff types (no create/update/delete)
router.get('/', staffTypeController.getAllStaffTypes);
router.get('/active', staffTypeController.getActiveStaffTypes);

module.exports = router;
