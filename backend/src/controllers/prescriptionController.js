const prescriptionService = require('../services/prescriptionService');

/**
 * Create a new prescription
 */
const createPrescription = async (req, res) => {
    try {
        const { patientVisitId, examinationId, items, generalInstructions, followUpInstructions } = req.body;
        const doctorId = req.user.id;

        if (!patientVisitId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Patient visit ID and prescription items are required'
            });
        }

        // Validate items
        for (const item of items) {
            if (!item.medicineName || !item.dosage || !item.frequency || !item.duration) {
                return res.status(400).json({
                    success: false,
                    message: 'Each prescription item must have medicine name, dosage, frequency, and duration'
                });
            }
        }

        const prescription = await prescriptionService.createPrescription(
            patientVisitId,
            examinationId,
            doctorId,
            items,
            generalInstructions,
            followUpInstructions
        );

        res.status(201).json({
            success: true,
            message: 'Prescription created successfully',
            data: prescription
        });

    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create prescription'
        });
    }
};

/**
 * Get prescription by examination ID
 */
const getPrescriptionByExamination = async (req, res) => {
    try {
        const { examinationId } = req.params;

        if (!examinationId) {
            return res.status(400).json({
                success: false,
                message: 'Examination ID is required'
            });
        }

        const prescription = await prescriptionService.getPrescriptionByExamination(examinationId);

        res.json({
            success: true,
            data: prescription
        });

    } catch (error) {
        console.error('Error fetching prescription:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch prescription'
        });
    }
};

/**
 * Get prescription by visit ID
 */
const getPrescriptionByVisit = async (req, res) => {
    try {
        const { visitId } = req.params;

        if (!visitId) {
            return res.status(400).json({
                success: false,
                message: 'Visit ID is required'
            });
        }

        const prescription = await prescriptionService.getPrescriptionByVisit(visitId);

        res.json({
            success: true,
            data: prescription
        });

    } catch (error) {
        console.error('Error fetching prescription:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch prescription'
        });
    }
};

/**
 * Update prescription
 */
const updatePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        const { items, generalInstructions, followUpInstructions } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Prescription items are required'
            });
        }

        // Validate items
        for (const item of items) {
            if (!item.medicineName || !item.dosage || !item.frequency || !item.duration) {
                return res.status(400).json({
                    success: false,
                    message: 'Each prescription item must have medicine name, dosage, frequency, and duration'
                });
            }
        }

        const prescription = await prescriptionService.updatePrescription(
            id,
            items,
            generalInstructions,
            followUpInstructions
        );

        res.json({
            success: true,
            message: 'Prescription updated successfully',
            data: prescription
        });

    } catch (error) {
        console.error('Error updating prescription:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update prescription'
        });
    }
};

/**
 * Delete prescription item
 */
const deletePrescriptionItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        if (!itemId) {
            return res.status(400).json({
                success: false,
                message: 'Item ID is required'
            });
        }

        await prescriptionService.deletePrescriptionItem(itemId);

        res.json({
            success: true,
            message: 'Prescription item deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting prescription item:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete prescription item'
        });
    }
};

/**
 * Get prescription by ID
 */
const getPrescriptionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Prescription ID is required'
            });
        }

        const prescription = await prescriptionService.getPrescriptionById(id);

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        res.json({
            success: true,
            data: prescription
        });

    } catch (error) {
        console.error('Error fetching prescription:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch prescription'
        });
    }
};

module.exports = {
    createPrescription,
    getPrescriptionByExamination,
    getPrescriptionByVisit,
    updatePrescription,
    deletePrescriptionItem,
    getPrescriptionById
};
