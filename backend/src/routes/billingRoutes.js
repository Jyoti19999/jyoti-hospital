const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticateToken, requireStaff, requireStaffType } = require('../middleware/auth');

// Middleware to allow Receptionist2, Admin, and Accountant access
const requireBillingAccess = requireStaffType(['receptionist2', 'admin', 'accountant']);

/**
 * @route   GET /api/billing/completed-visits
 * @desc    Get all completed patient visits awaiting payment
 * @access  Private - Staff (Receptionist2, Admin, Accountant)
 */
router.get(
  '/completed-visits',
  authenticateToken,
  requireStaff,
  requireBillingAccess,
  billingController.getCompletedVisitsForBilling
);

/**
 * @route   GET /api/billing/visit/:visitId
 * @desc    Get single visit billing details
 * @access  Private - Staff
 */
router.get(
  '/visit/:visitId',
  authenticateToken,
  requireStaff,
  requireBillingAccess,
  billingController.getVisitBillingDetails
);

/**
 * @route   POST /api/billing/record-payment/:visitId
 * @desc    Record payment for a completed visit
 * @access  Private - Staff (Receptionist2, Admin, Accountant)
 */
router.post(
  '/record-payment/:visitId',
  authenticateToken,
  requireStaff,
  requireBillingAccess,
  billingController.recordPayment
);

module.exports = router;
