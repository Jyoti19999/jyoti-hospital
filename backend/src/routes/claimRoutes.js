const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const { uploadClaimDocuments, handleClaimUploadError } = require('../middleware/claimUpload');
const { authenticateToken, requireStaff } = require('../middleware/auth');

/**
 * Get all pending claims
 * GET /api/v1/claims/pending
 */
router.get(
  '/pending',
  authenticateToken,
  requireStaff,
  claimController.getPendingClaims
);

/**
 * Get TPA analytics stats
 * GET /api/v1/claims/analytics
 */
router.get(
  '/analytics',
  authenticateToken,
  requireStaff,
  claimController.getClaimAnalytics
);

/**
 * Get recent claims (max 4) for overview
 * GET /api/v1/claims/recent
 */
router.get(
  '/recent',
  authenticateToken,
  requireStaff,
  claimController.getRecentClaims
);

/**
 * Get all approved claims with optional filters
 * GET /api/v1/claims/approved?search=&startDate=&endDate=
 */
router.get(
  '/approved',
  authenticateToken,
  requireStaff,
  claimController.getApprovedClaims
);

/**
 * Get all rejected claims with optional filters
 * GET /api/v1/claims/rejected?search=&startDate=&endDate=
 */
router.get(
  '/rejected',
  authenticateToken,
  requireStaff,
  claimController.getRejectedClaims
);

/**
 * Calculate claim amount based on surgery details
 * GET /api/claims/ipd/:ipdId/claim/calculate
 */
router.get(
  '/ipd/:ipdId/claim/calculate',
  authenticateToken,
  requireStaff,
  claimController.calculateClaimAmount
);

/**
 * Upload claim documents and initiate claim
 * POST /api/claims/ipd/:ipdId/claim/upload
 */
router.post(
  '/ipd/:ipdId/claim/upload',
  authenticateToken,
  requireStaff,
  uploadClaimDocuments,
  handleClaimUploadError,
  claimController.uploadClaimDocuments
);

/**
 * Get claim details
 * GET /api/claims/ipd/:ipdId/claim
 */
router.get(
  '/ipd/:ipdId/claim',
  authenticateToken,
  requireStaff,
  claimController.getClaimDetails
);

/**
 * Update claim amount (editable field)
 * PATCH /api/claims/ipd/:ipdId/claim/amount
 */
router.patch(
  '/ipd/:ipdId/claim/amount',
  authenticateToken,
  requireStaff,
  claimController.updateClaimAmount
);

/**
 * Update claim status
 * PATCH /api/claims/ipd/:ipdId/claim/status
 */
router.patch(
  '/ipd/:ipdId/claim/status',
  authenticateToken,
  requireStaff,
  claimController.updateClaimStatus
);

/**
 * Update IPD admission with final surgery amount and payment mode
 * PATCH /api/claims/ipd/:ipdId/update-admission
 */
router.patch(
  '/ipd/:ipdId/update-admission',
  authenticateToken,
  requireStaff,
  claimController.updateIpdAdmissionAmount
);

module.exports = router;
