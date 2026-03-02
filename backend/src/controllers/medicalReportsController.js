// src/controllers/medicalReportsController.js
const medicalReportsService = require('../services/medicalReportsService');

/**
 * Get diagnostic records with filtering and pagination
 */
const getDiagnosticRecords = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { 
            dateFilter = 'today', 
            statusFilter = 'all', 
            searchTerm = '', 
            page = 1, 
            limit = 50 
        } = req.query;

        console.log('🔍 Fetching diagnostic records:', {
            doctorId,
            dateFilter,
            statusFilter,
            searchTerm,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        const result = await medicalReportsService.getDiagnosticRecords(doctorId, {
            dateFilter,
            statusFilter,
            searchTerm,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.status(200).json({
            success: true,
            message: 'Diagnostic records retrieved successfully',
            data: result
        });

    } catch (error) {
        console.error('❌ Error fetching diagnostic records:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch diagnostic records'
        });
    }
};

/**
 * Download prescription as PDF
 */
const downloadPrescription = async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        const doctorId = req.user.id;

        console.log('📄 Generating prescription PDF:', {
            prescriptionId,
            doctorId,
            requestedBy: `${req.user.firstName} ${req.user.lastName}`
        });

        const pdfBuffer = await medicalReportsService.generatePrescriptionPDF(prescriptionId, doctorId);

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescriptionId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

    } catch (error) {
        console.error('❌ Error downloading prescription:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to download prescription'
        });
    }
};

/**
 * Download medical report as PDF
 */
const downloadMedicalReport = async (req, res) => {
    try {
        const { examinationId } = req.params;
        const doctorId = req.user.id;

        console.log('📋 Generating medical report PDF:', {
            examinationId,
            doctorId,
            requestedBy: `${req.user.firstName} ${req.user.lastName}`
        });

        const pdfBuffer = await medicalReportsService.generateMedicalReportPDF(examinationId, doctorId);

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="medical-report-${examinationId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

    } catch (error) {
        console.error('❌ Error downloading medical report:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to download medical report'
        });
    }
};

/**
 * Export diagnostic records as CSV
 */
const exportDiagnosticRecords = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { 
            dateFilter = 'today', 
            statusFilter = 'all', 
            searchTerm = '' 
        } = req.query;

        console.log('📊 Exporting diagnostic records to CSV:', {
            doctorId,
            dateFilter,
            statusFilter,
            searchTerm,
            requestedBy: `${req.user.firstName} ${req.user.lastName}`
        });

        const csvContent = await medicalReportsService.exportDiagnosticRecordsCSV(doctorId, {
            dateFilter,
            statusFilter,
            searchTerm
        });

        // Set headers for CSV download
        const filename = `diagnostic-records-${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.send(csvContent);

    } catch (error) {
        console.error('❌ Error exporting diagnostic records:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to export diagnostic records'
        });
    }
};

/**
 * Get prescription details (for preview before download)
 */
const getPrescriptionDetails = async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        const doctorId = req.user.id;

        console.log('🔍 Fetching prescription details:', {
            prescriptionId,
            doctorId
        });

        const prescription = await medicalReportsService.getPrescriptionDetails(prescriptionId, doctorId);

        res.status(200).json({
            success: true,
            message: 'Prescription details retrieved successfully',
            data: prescription
        });

    } catch (error) {
        console.error('❌ Error fetching prescription details:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch prescription details'
        });
    }
};

/**
 * Get examination details (for preview before download)
 */
const getExaminationDetails = async (req, res) => {
    try {
        const { examinationId } = req.params;
        const doctorId = req.user.id;

        console.log('🔍 Fetching examination details:', {
            examinationId,
            doctorId
        });

        const examination = await medicalReportsService.getExaminationDetails(examinationId, doctorId);

        res.status(200).json({
            success: true,
            message: 'Examination details retrieved successfully',
            data: examination
        });

    } catch (error) {
        console.error('❌ Error fetching examination details:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch examination details'
        });
    }
};

/**
 * Get patient's complete medical history
 */
const getPatientMedicalHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const doctorId = req.user.id;

        console.log('📋 Fetching patient medical history:', {
            patientId,
            doctorId
        });

        // This would be implemented to get complete patient history
        // For now, returning a placeholder response
        res.status(200).json({
            success: true,
            message: 'Patient medical history retrieved successfully',
            data: {
                patientId,
                message: 'Complete medical history feature coming soon'
            }
        });

    } catch (error) {
        console.error('❌ Error fetching patient medical history:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch patient medical history'
        });
    }
};

module.exports = {
    getDiagnosticRecords,
    downloadPrescription,
    downloadMedicalReport,
    exportDiagnosticRecords,
    getPrescriptionDetails,
    getExaminationDetails,
    getPatientMedicalHistory
};