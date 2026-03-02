// src/routes/medicalReportsRoutes.js
const express = require('express');
const router = express.Router();
const medicalReportsController = require('../controllers/medicalReportsController');
const { authenticateToken, requireStaff } = require('../middleware/auth');

// Middleware to ensure user is a doctor or admin
const requireDoctor = (req, res, next) => {
    const allowedRoles = ['ophthalmologist', 'doctor', 'admin'];
    if (!allowedRoles.includes(req.user.staffType)) {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Doctor or Admin role required.',
            currentRole: req.user.staffType,
            allowedRoles: allowedRoles
        });
    }
    next();
};

/**
 * @route   GET /api/medical-reports/diagnostics
 * @desc    Get diagnostic records with filtering and pagination
 * @access  Private (Doctor, Admin)
 */
router.get('/diagnostics', 
    authenticateToken, 
    requireStaff, 
    requireDoctor, 
    medicalReportsController.getDiagnosticRecords
);

/**
 * @route   GET /api/medical-reports/diagnostics/export
 * @desc    Export diagnostic records as CSV
 * @access  Private (Doctor, Admin)
 */
router.get('/diagnostics/export', 
    authenticateToken, 
    requireStaff, 
    requireDoctor, 
    medicalReportsController.exportDiagnosticRecords
);

/**
 * @route   GET /api/medical-reports/prescription/:prescriptionId
 * @desc    Get prescription details
 * @access  Private (Doctor, Admin)
 */
router.get('/prescription/:prescriptionId', 
    authenticateToken, 
    requireStaff, 
    requireDoctor, 
    medicalReportsController.getPrescriptionDetails
);

/**
 * @route   GET /api/medical-reports/prescription/:prescriptionId/download
 * @desc    Download prescription as PDF
 * @access  Private (Doctor, Admin)
 */
router.get('/prescription/:prescriptionId/download', 
    authenticateToken, 
    requireStaff, 
    requireDoctor, 
    medicalReportsController.downloadPrescription
);

/**
 * @route   GET /api/medical-reports/examination/:examinationId
 * @desc    Get examination details
 * @access  Private (Doctor, Admin)
 */
router.get('/examination/:examinationId', 
    authenticateToken, 
    requireStaff, 
    requireDoctor, 
    medicalReportsController.getExaminationDetails
);

/**
 * @route   GET /api/medical-reports/examination/:examinationId/download
 * @desc    Download medical report as PDF
 * @access  Private (Doctor, Admin)
 */
router.get('/examination/:examinationId/download', 
    authenticateToken, 
    requireStaff, 
    requireDoctor, 
    medicalReportsController.downloadMedicalReport
);

/**
 * @route   GET /api/medical-reports/patient/:patientId/history
 * @desc    Get patient's complete medical history
 * @access  Private (Doctor, Admin)
 */
router.get('/patient/:patientId/history', 
    authenticateToken, 
    requireStaff, 
    requireDoctor, 
    medicalReportsController.getPatientMedicalHistory
);

module.exports = router;