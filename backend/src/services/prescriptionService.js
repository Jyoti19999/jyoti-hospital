const prisma = require('../utils/prisma');

/**
 * Generate unique prescription number
 * Format: RX-YYYYMMDD-XXXX
 */
async function generatePrescriptionNumber() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get count of prescriptions today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const count = await prisma.prescription.count({
        where: {
            prescriptionDate: {
                gte: startOfDay,
                lte: endOfDay
            }
        }
    });
    
    const sequence = String(count + 1).padStart(4, '0');
    return `RX-${dateStr}-${sequence}`;
}

/**
 * Create a new prescription
 */
async function createPrescription(patientVisitId, examinationId, doctorId, items, generalInstructions, followUpInstructions) {
    try {
        console.log('💊 Creating prescription...', {
            patientVisitId,
            examinationId,
            doctorId,
            itemsCount: items?.length
        });

        const prescriptionNumber = await generatePrescriptionNumber();

        const prescription = await prisma.prescription.create({
            data: {
                prescriptionNumber,
                patientVisitId,
                examinationId,
                doctorId,
                generalInstructions: generalInstructions || null,
                followUpInstructions: followUpInstructions || null,
                prescriptionItems: {
                    create: items.map(item => ({
                        medicineId: item.medicineId || null,
                        medicineName: item.medicineName,
                        dosage: item.dosage,
                        frequency: item.frequency,
                        duration: item.duration,
                        instructions: item.instructions || null,
                        quantity: item.quantity || null
                    }))
                }
            },
            include: {
                prescriptionItems: {
                    include: {
                        medicine: {
                            include: {
                                type: true,
                                genericMedicine: true,
                                drugGroup: true,
                                dosageSchedule: true
                            }
                        }
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        staffType: true
                    }
                }
            }
        });

        console.log('✅ Prescription created:', prescription.prescriptionNumber);
        return prescription;

    } catch (error) {
        console.error('❌ Error creating prescription:', error);
        throw new Error(`Failed to create prescription: ${error.message}`);
    }
}

/**
 * Get prescription by examination ID
 */
async function getPrescriptionByExamination(examinationId) {
    try {
        console.log('🔍 Fetching prescription for examination:', examinationId);

        const prescription = await prisma.prescription.findFirst({
            where: {
                examinationId
            },
            include: {
                prescriptionItems: {
                    include: {
                        medicine: {
                            include: {
                                type: true,
                                genericMedicine: true,
                                drugGroup: true,
                                dosageSchedule: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        staffType: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (prescription) {
            console.log('✅ Prescription found:', prescription.prescriptionNumber);
        } else {
            console.log('ℹ️ No prescription found for this examination');
        }

        return prescription;

    } catch (error) {
        console.error('❌ Error fetching prescription:', error);
        throw new Error(`Failed to fetch prescription: ${error.message}`);
    }
}

/**
 * Get prescription by visit ID
 */
async function getPrescriptionByVisit(patientVisitId) {
    try {
        console.log('🔍 Fetching prescription for visit:', patientVisitId);

        const prescription = await prisma.prescription.findFirst({
            where: {
                patientVisitId
            },
            include: {
                prescriptionItems: {
                    include: {
                        medicine: {
                            include: {
                                type: true,
                                genericMedicine: true,
                                drugGroup: true,
                                dosageSchedule: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        staffType: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (prescription) {
            console.log('✅ Prescription found:', prescription.prescriptionNumber);
        } else {
            console.log('ℹ️ No prescription found for this visit');
        }

        return prescription;

    } catch (error) {
        console.error('❌ Error fetching prescription by visit:', error);
        throw new Error(`Failed to fetch prescription: ${error.message}`);
    }
}

/**
 * Update prescription
 */
async function updatePrescription(prescriptionId, items, generalInstructions, followUpInstructions) {
    try {
        console.log('📝 Updating prescription:', prescriptionId);

        // Delete existing items
        await prisma.prescriptionItem.deleteMany({
            where: {
                prescriptionId
            }
        });

        // Update prescription with new items
        const prescription = await prisma.prescription.update({
            where: {
                id: prescriptionId
            },
            data: {
                generalInstructions: generalInstructions || null,
                followUpInstructions: followUpInstructions || null,
                prescriptionItems: {
                    create: items.map(item => ({
                        medicineId: item.medicineId || null,
                        medicineName: item.medicineName,
                        dosage: item.dosage,
                        frequency: item.frequency,
                        duration: item.duration,
                        instructions: item.instructions || null,
                        quantity: item.quantity || null
                    }))
                }
            },
            include: {
                prescriptionItems: {
                    include: {
                        medicine: {
                            include: {
                                type: true,
                                genericMedicine: true,
                                drugGroup: true,
                                dosageSchedule: true
                            }
                        }
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        staffType: true
                    }
                }
            }
        });

        console.log('✅ Prescription updated:', prescription.prescriptionNumber);
        return prescription;

    } catch (error) {
        console.error('❌ Error updating prescription:', error);
        throw new Error(`Failed to update prescription: ${error.message}`);
    }
}

/**
 * Delete prescription item
 */
async function deletePrescriptionItem(itemId) {
    try {
        console.log('🗑️ Deleting prescription item:', itemId);

        await prisma.prescriptionItem.delete({
            where: {
                id: itemId
            }
        });

        console.log('✅ Prescription item deleted');
        return { success: true };

    } catch (error) {
        console.error('❌ Error deleting prescription item:', error);
        throw new Error(`Failed to delete prescription item: ${error.message}`);
    }
}

/**
 * Get prescription by ID
 */
async function getPrescriptionById(prescriptionId) {
    try {
        const prescription = await prisma.prescription.findUnique({
            where: {
                id: prescriptionId
            },
            include: {
                prescriptionItems: {
                    include: {
                        medicine: {
                            include: {
                                type: true,
                                genericMedicine: true,
                                drugGroup: true,
                                dosageSchedule: true
                            }
                        }
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        staffType: true
                    }
                },
                patientVisit: {
                    include: {
                        patient: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                dateOfBirth: true,
                                gender: true
                            }
                        }
                    }
                }
            }
        });

        return prescription;

    } catch (error) {
        console.error('❌ Error fetching prescription by ID:', error);
        throw new Error(`Failed to fetch prescription: ${error.message}`);
    }
}

module.exports = {
    createPrescription,
    getPrescriptionByExamination,
    getPrescriptionByVisit,
    updatePrescription,
    deletePrescriptionItem,
    getPrescriptionById,
    generatePrescriptionNumber
};
