// src/services/ophthalmologistExaminationService.js
const prisma = require('../utils/prisma');

/**
 * Map surgery type string to valid SurgeryType enum
 * @param {string} surgeryType - Surgery type string from examination
 * @returns {string} Valid SurgeryType enum value
 */
function mapSurgeryTypeToEnum(surgeryType) {
    if (!surgeryType) return 'CATARACT'; // Default

    const typeMapping = {
        'cataract surgery': 'CATARACT',
        'cataract': 'CATARACT',
        'glaucoma surgery': 'GLAUCOMA',
        'glaucoma': 'GLAUCOMA',
        'retinal surgery': 'RETINAL',
        'retinal': 'RETINAL',
        'corneal surgery': 'CORNEAL',
        'corneal': 'CORNEAL',
        'oculoplastic surgery': 'OCULOPLASTIC',
        'oculoplastic': 'OCULOPLASTIC',
        'emergency surgery': 'EMERGENCY',
        'emergency': 'EMERGENCY'
    };

    const normalizedType = surgeryType.toLowerCase().trim();
    return typeMapping[normalizedType] || 'CATARACT'; // Default to CATARACT
}

/**
 * Save detailed ophthalmologist examination data
 * @param {string} patientVisitId - Patient visit ID
 * @param {string} doctorId - Doctor ID
 * @param {Object} examinationData - Examination data
 * @returns {Promise<Object>} Saved examination data
 */
async function saveDetailedOphthalmologistExamination(patientVisitId, doctorId, examinationData) {
    try {
        console.log('💾 Saving detailed ophthalmologist examination:', {
            patientVisitId,
            doctorId,
            hasData: !!examinationData
        });

        console.log('📋 My Examination data received:', {
            examinationNotes: examinationData.examinationNotes?.substring(0, 50),
            diagnosisText: examinationData.diagnosisText?.substring(0, 50),
            additionalTestsOrdered: examinationData.additionalTestsOrdered,
            followUpRequired: examinationData.followUpRequired,
            followUpPeriod: examinationData.followUpPeriod,
            followUpDays: examinationData.followUpDays,
            followUpDate: examinationData.followUpDate,
            surgeryRecommended: examinationData.surgeryRecommended
        });

        const {
            // Visual Acuity - Distance Vision
            distanceOD,
            distanceOS,
            distanceBinocular,

            // Visual Acuity - Near Vision
            nearOD,
            nearOS,
            nearBinocular,

            // Refraction fields
            refractionSphereOD,
            refractionCylinderOD,
            refractionAxisOD,
            refractionAddOD,
            refractionSphereOS,
            refractionCylinderOS,
            refractionAxisOS,
            refractionAddOS,
            refractionPD,

            // Tonometry fields
            iopOD,
            iopOS,
            iopMethod,

            // Additional Tests fields
            pupilReaction,
            colorVision,
            eyeAlignment,
            anteriorSegment,
            extraocularMovements,
            coverTest,

            // Pre-Op Parameters (flat structure)
            k1OD,
            k1OS,
            k2OD,
            k2OS,
            flatAxisOD,
            flatAxisOS,
            acdOD,
            acdOS,
            axlOD,
            axlOS,
            iolPowerPlannedOD,
            iolPowerPlannedOS,
            iolImplantedOD,
            iolImplantedOS,
            anyOtherDetailsOD,
            anyOtherDetailsOS,

            // Slit Lamp Findings (flat structure)
            eyelidsOD,
            eyelidsOS,
            conjunctivaOD,
            conjunctivaOS,
            corneaOD,
            corneaOS,
            lensOD,
            lensOS,

            // Clinical Notes
            clinicalNotes,
            preliminaryDiagnosis,
            urgencyLevel,

            // My Examination Tab fields
            examinationNotes,
            diagnosisText,  // Will be saved to Diagnosis table
            selectedDiagnoses,  // Array of diagnosis objects with IDs
            additionalTestsOrdered,
            followUpRequired,
            followUpPeriod,
            followUpDays,
            followUpDate,
            surgeryRecommended,  // Surgery recommendation field
            treatmentPlan
        } = examinationData;

        // Check if examination already exists
        const existingExamination = await prisma.ophthalmologistExamination.findFirst({
            where: {
                patientVisitId,
                doctorId
            }
        });

        let examination;

        const examinationDataToSave = {
            // Visual Acuity - Distance Vision
            distanceOD: distanceOD || null,
            distanceOS: distanceOS || null,
            distanceBinocular: distanceBinocular || null,

            // Visual Acuity - Near Vision  
            nearOD: nearOD || null,
            nearOS: nearOS || null,
            nearBinocular: nearBinocular || null,

            // Additional visual acuity fields to match optometrist structure
            ucvaOD: distanceOD || null, // Map distanceOD to ucvaOD for compatibility
            ucvaOS: distanceOS || null, // Map distanceOS to ucvaOS for compatibility
            bcvaOD: nearOD || null,     // Map nearOD to bcvaOD for compatibility  
            bcvaOS: nearOS || null,     // Map nearOS to bcvaOS for compatibility

            // Refraction
            refractionSphereOD: refractionSphereOD || null,
            refractionCylinderOD: refractionCylinderOD || null,
            refractionAxisOD: refractionAxisOD || null,
            refractionAddOD: refractionAddOD || null,
            refractionSphereOS: refractionSphereOS || null,
            refractionCylinderOS: refractionCylinderOS || null,
            refractionAxisOS: refractionAxisOS || null,
            refractionAddOS: refractionAddOS || null,
            refractionPD: refractionPD || null,

            // Tonometry
            iopOD: iopOD || null,
            iopOS: iopOS || null,
            iopMethod: iopMethod || null,

            // Additional Tests
            pupilReaction: pupilReaction || null,
            colorVision: colorVision || null,
            eyeAlignment: eyeAlignment || null,
            anteriorSegment: anteriorSegment || null,
            extraocularMovements: extraocularMovements || null,
            coverTest: coverTest || null,

            // Pre-Op Parameters (now flat structure)
            k1OD: k1OD || null,
            k1OS: k1OS || null,
            k2OD: k2OD || null,
            k2OS: k2OS || null,
            flatAxisOD: flatAxisOD || null,
            flatAxisOS: flatAxisOS || null,
            acdOD: acdOD || null,
            acdOS: acdOS || null,
            axlOD: axlOD || null,
            axlOS: axlOS || null,
            iolPowerPlannedOD: iolPowerPlannedOD || null,
            iolPowerPlannedOS: iolPowerPlannedOS || null,
            iolImplantedOD: iolImplantedOD || null,
            iolImplantedOS: iolImplantedOS || null,
            anyOtherDetailsOD: anyOtherDetailsOD || null,
            anyOtherDetailsOS: anyOtherDetailsOS || null,

            // Slit Lamp Findings (now flat structure)
            eyelidsOD: eyelidsOD || null,
            eyelidsOS: eyelidsOS || null,
            conjunctivaOD: conjunctivaOD || null,
            conjunctivaOS: conjunctivaOS || null,
            corneaOD: corneaOD || null,
            corneaOS: corneaOS || null,
            lensOD: lensOD || null,
            lensOS: lensOS || null,

            // Clinical Notes
            clinicalNotes: clinicalNotes || null,
            preliminaryDiagnosis: preliminaryDiagnosis || null,

            // Additional fields to match optometrist structure
            assignedDoctor: doctorId || null,
            urgencyLevel: urgencyLevel || null,
            additionalOrders: additionalTestsOrdered ? JSON.stringify(additionalTestsOrdered) : null,
            knownAllergies: null, // Can be added later if needed
            additionalNotes: examinationNotes || null,
            proceedToDoctor: true,
            requiresDilation: false,
            additionalTestsLegacy: null,
            examinationStatus: 'completed',
            completedAt: new Date(),
            receptionist2Reviewed: false,
            receptionist2ReviewedAt: null,
            receptionist2ReviewedBy: null,
            receptionist2Notes: null,

            // My Examination Tab
            examinationNotes: examinationNotes || null,
            additionalTestsOrdered: additionalTestsOrdered ? JSON.stringify(additionalTestsOrdered) : null,
            followUpRequired: followUpRequired || false,
            followUpPeriod: followUpPeriod || null,
            followUpDays: followUpDays || null,
            followUpDate: followUpDate ? new Date(followUpDate) : null,
            surgeryRecommended: surgeryRecommended || false,
            treatmentPlan: treatmentPlan || null,

            // JSON fields for optometrist compatibility  
            visualAcuity: JSON.stringify({
                distance: {
                    rightEye: distanceOD,
                    leftEye: distanceOS,
                    binocular: distanceBinocular
                },
                near: {
                    rightEye: nearOD,
                    leftEye: nearOS,
                    binocular: nearBinocular
                }
            }),
            refraction: JSON.stringify({
                sphere: {
                    rightEye: refractionSphereOD,
                    leftEye: refractionSphereOS
                },
                cylinder: {
                    rightEye: refractionCylinderOD,
                    leftEye: refractionCylinderOS
                },
                axis: {
                    rightEye: refractionAxisOD,
                    leftEye: refractionAxisOS
                },
                add: {
                    rightEye: refractionAddOD,
                    leftEye: refractionAddOS
                },
                pd: refractionPD
            }),
            tonometry: JSON.stringify({
                iop: {
                    rightEye: iopOD,
                    leftEye: iopOS
                },
                method: iopMethod
            }),
            additionalTests: JSON.stringify({
                pupilReaction,
                colorVision,
                eyeAlignment,
                extraocularMovements,
                coverTest
            }),
            clinicalDetails: JSON.stringify({
                notes: clinicalNotes,
                diagnosis: preliminaryDiagnosis,
                urgency: urgencyLevel
            }),
            // Store slit lamp data in the dedicated slitLampFindings JSON column
            // (anteriorSegment is already set above as a plain string — do NOT duplicate it here)
            slitLampFindings: JSON.stringify({
                eyelids: {
                    rightEye: eyelidsOD,
                    leftEye: eyelidsOS
                },
                conjunctiva: {
                    rightEye: conjunctivaOD,
                    leftEye: conjunctivaOS
                },
                cornea: {
                    rightEye: corneaOD,
                    leftEye: corneaOS
                },
                lens: {
                    rightEye: lensOD,
                    leftEye: lensOS
                }
            })
        };

        if (existingExamination) {
            // Update existing examination
            examination = await prisma.ophthalmologistExamination.update({
                where: { id: existingExamination.id },
                data: examinationDataToSave
            });

            console.log('✅ Updated existing ophthalmologist examination:', examination.id);
            console.log('📝 My Examination fields saved:', {
                examinationNotes: examination.examinationNotes ? 'Saved' : 'Empty',
                diagnosisText: examination.diagnosisText ? 'Saved' : 'Empty',
                additionalTestsOrdered: examination.additionalTestsOrdered ? 'Saved' : 'Empty',
                followUpRequired: examination.followUpRequired,
                followUpPeriod: examination.followUpPeriod,
                followUpDate: examination.followUpDate,
                surgeryRecommended: examination.surgeryRecommended
            });
        } else {
            // Create new examination
            examination = await prisma.ophthalmologistExamination.create({
                data: {
                    patientVisitId,
                    doctorId,
                    ...examinationDataToSave
                }
            });

            console.log('✅ Created new ophthalmologist examination:', examination.id);

        }

        // Save diagnoses to Diagnosis table if provided
        if (selectedDiagnoses && Array.isArray(selectedDiagnoses) && selectedDiagnoses.length > 0) {
            console.log('💊 Saving diagnoses to Diagnosis table...');
            console.log('📋 Selected diagnoses:', selectedDiagnoses);

            // Delete existing diagnoses for this examination
            await prisma.diagnosis.deleteMany({
                where: {
                    ophthalmologistExaminationId: examination.id
                }
            });
            console.log('🗑️ Deleted existing diagnoses for this examination');

            // Create new diagnosis records for each selected diagnosis
            for (let i = 0; i < selectedDiagnoses.length; i++) {
                const diagnosisItem = selectedDiagnoses[i];
                const title = diagnosisItem.title || diagnosisItem.diseaseName || diagnosisItem.name || '';

                // Check if a Disease record exists for this ICD11 code
                let disease = await prisma.disease.findFirst({
                    where: {
                        icd11CodeId: diagnosisItem.id
                    }
                });

                // If no Disease record exists, create one
                if (!disease) {
                    console.log(`📝 Creating Disease record for ICD11 code: ${diagnosisItem.code}`);
                    disease = await prisma.disease.create({
                        data: {
                            icd11CodeId: diagnosisItem.id,
                            diseaseName: diagnosisItem.title,
                            ophthalmologyCategory: diagnosisItem.category || diagnosisItem.ophthalmologyCategory,
                            affectsVision: true,
                            isChronic: false,
                            requiresSurgery: false
                        }
                    });
                    console.log(`✅ Created Disease record: ${disease.id}`);
                }

                // Create diagnosis record linked to the Disease
                await prisma.diagnosis.create({
                    data: {
                        visitId: patientVisitId,
                        doctorId: doctorId,
                        ophthalmologistExaminationId: examination.id,
                        diseaseId: disease.id, // Link to Disease table
                        notes: typeof title === 'object' ? title['@value'] || JSON.stringify(title) : title,
                        diagnosisType: 'CLINICAL',
                        diagnosisDate: new Date(),
                        isPrimary: i === 0, // First diagnosis is primary
                        billable: true
                    }
                });
                console.log(`✅ Created diagnosis record for: ${typeof title === 'object' ? title['@value'] : title}`);
            }

            console.log(`✅ Successfully saved ${selectedDiagnoses.length} diagnosis record(s)`);
        } else if (diagnosisText && diagnosisText.trim()) {
            // Fallback: Save as text-only diagnosis if no structured data
            console.log('💊 Saving diagnosis text (no disease reference)...');

            await prisma.diagnosis.deleteMany({
                where: {
                    ophthalmologistExaminationId: examination.id
                }
            });

            await prisma.diagnosis.create({
                data: {
                    visitId: patientVisitId,
                    doctorId: doctorId,
                    ophthalmologistExaminationId: examination.id,
                    notes: diagnosisText,
                    diagnosisType: 'CLINICAL',
                    diagnosisDate: new Date(),
                    isPrimary: true,
                    billable: true
                }
            });
            console.log('✅ Created text-only diagnosis record');
        }

        // 🏥 AUTO-CREATE IPD ADMISSION IF SURGERY IS RECOMMENDED
        console.log('🔍 Checking surgery recommendation:', {
            surgeryRecommended: examinationData.surgeryRecommended,
            condition: !!examinationData.surgeryRecommended
        });

        if (examinationData.surgeryRecommended) {
            console.log('🔄 Surgery recommended - auto-creating IPD admission...');

            try {
                // Get patient information from examination
                const examinationWithPatient = await prisma.ophthalmologistExamination.findFirst({
                    where: { id: examination.id },
                    include: {
                        patientVisit: {
                            include: {
                                patient: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        patientNumber: true
                                    }
                                }
                            }
                        }
                    }
                });

                if (!examinationWithPatient) {
                    console.log('❌ Could not find examination with patient data');
                } else {
                    const patientId = examinationWithPatient.patientVisit.patient.id;

                    // Check if IPD admission already exists for this specific visit
                    const existingAdmission = await prisma.ipdAdmission.findFirst({
                        where: {
                            patientId,
                            patientVisitId: patientVisitId,  // Check for this specific visit
                            status: {
                                in: ['SURGERY_SUGGESTED', 'ADMITTED', 'SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT', 'SURGERY_DAY', 'POST_OP', 'RECOVERY']
                            }
                        }
                    });

                    if (!existingAdmission) {
                        // Generate unique admission number
                        const admissionNumber = `IPD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

                        // Create IPD admission
                        const ipdAdmission = await prisma.ipdAdmission.create({
                            data: {
                                admissionNumber,
                                patientId,
                                patientVisitId: patientVisitId,  // Link to the visit where surgery was recommended
                                admittedBy: doctorId,
                                admissionDate: new Date(),
                                surgeryTypeId: examinationData.surgeryTypeId || null,
                                status: 'SURGERY_SUGGESTED'  // Updated: Use new enum for surgery recommendations
                            },
                            include: {
                                patient: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        patientNumber: true
                                    }
                                }
                            }
                        });

                        console.log(`✅ Auto-created IPD admission ${ipdAdmission.admissionNumber} for patient ${ipdAdmission.patient.firstName} ${ipdAdmission.patient.lastName}`);
                    } else {
                        // Update existing IPD admission with new surgery type if needed
                        if (examinationData.surgeryTypeId && existingAdmission.surgeryTypeId !== examinationData.surgeryTypeId) {
                            const updatedAdmission = await prisma.ipdAdmission.update({
                                where: { id: existingAdmission.id },
                                data: {
                                    surgeryTypeId: examinationData.surgeryTypeId,
                                    patientVisitId: patientVisitId,  // Ensure visit link is updated
                                    updatedAt: new Date()
                                },
                                include: {
                                    patient: {
                                        select: {
                                            firstName: true,
                                            lastName: true,
                                            patientNumber: true
                                        }
                                    }
                                }
                            });
                            console.log(`✅ Updated existing IPD admission ${updatedAdmission.admissionNumber} with new surgery type for patient ${updatedAdmission.patient.firstName} ${updatedAdmission.patient.lastName}`);
                        } else {
                            console.log(`ℹ️  Patient already has IPD admission: ${existingAdmission.admissionNumber} - no update needed`);
                        }
                    }
                }
            } catch (error) {
                console.error('❌ Failed to auto-create IPD admission:', error);
                // Don't throw error - just log it and continue
            }
        }

        return examination;

    } catch (error) {
        console.error('❌ Error saving detailed ophthalmologist examination:', error);
        throw new Error(`Failed to save detailed examination: ${error.message}`);
    }
}

/**
 * Get detailed ophthalmologist examination data
 * @param {string} patientVisitId - Patient visit ID
 * @param {string} doctorId - Doctor ID
 * @returns {Promise<Object|null>} Detailed examination data or null
 */
async function getDetailedOphthalmologistExamination(patientVisitId, doctorId) {
    try {
        console.log('🔍 Fetching detailed ophthalmologist examination:', {
            patientVisitId,
            doctorId
        });

        const examination = await prisma.ophthalmologistExamination.findFirst({
            where: {
                patientVisitId,
                doctorId
            },
            include: {
                diagnoses: {
                    include: {
                        disease: {
                            include: {
                                icd11Code: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                patientVisit: {
                    include: {
                        ipdAdmission: {
                            select: {
                                surgeryTypeId: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!examination) {
            console.log('ℹ️ No examination found for this patient visit');
            return null;
        }

        console.log('📊 Examination data retrieved:', {
            id: examination.id,
            diagnosesCount: examination.diagnoses?.length || 0,
            hasDiagnoses: !!examination.diagnoses,
            firstDiagnosis: examination.diagnoses?.[0] ? {
                id: examination.diagnoses[0].id,
                hasDisease: !!examination.diagnoses[0].disease,
                diseaseId: examination.diagnoses[0].diseaseId
            } : null
        });

        // Transform the data to match frontend structure
        const transformedData = {
            // Visual Acuity - Distance Vision
            distanceOD: examination.distanceOD,
            distanceOS: examination.distanceOS,
            distanceBinocular: examination.distanceBinocular,

            // Visual Acuity - Near Vision
            nearOD: examination.nearOD,
            nearOS: examination.nearOS,
            nearBinocular: examination.nearBinocular,

            // Refraction
            refractionSphereOD: examination.refractionSphereOD,
            refractionCylinderOD: examination.refractionCylinderOD,
            refractionAxisOD: examination.refractionAxisOD,
            refractionAddOD: examination.refractionAddOD,
            refractionSphereOS: examination.refractionSphereOS,
            refractionCylinderOS: examination.refractionCylinderOS,
            refractionAxisOS: examination.refractionAxisOS,
            refractionAddOS: examination.refractionAddOS,
            refractionPD: examination.refractionPD,

            // Tonometry
            iopOD: examination.iopOD,
            iopOS: examination.iopOS,
            iopMethod: examination.iopMethod,

            // Additional Tests
            pupilReaction: examination.pupilReaction,
            colorVision: examination.colorVision,
            eyeAlignment: examination.eyeAlignment,
            anteriorSegment: examination.anteriorSegment,
            extraocularMovements: examination.extraocularMovements,
            coverTest: examination.coverTest,

            // Pre-Op Parameters
            preOpParams: {
                k1OD: examination.k1OD,
                k1OS: examination.k1OS,
                k2OD: examination.k2OD,
                k2OS: examination.k2OS,
                flatAxisOD: examination.flatAxisOD,
                flatAxisOS: examination.flatAxisOS,
                acdOD: examination.acdOD,
                acdOS: examination.acdOS,
                axlOD: examination.axlOD,
                axlOS: examination.axlOS,
                iolPowerPlannedOD: examination.iolPowerPlannedOD,
                iolPowerPlannedOS: examination.iolPowerPlannedOS,
                iolImplantedOD: examination.iolImplantedOD,
                iolImplantedOS: examination.iolImplantedOS,
                anyOtherDetailsOD: examination.anyOtherDetailsOD,
                anyOtherDetailsOS: examination.anyOtherDetailsOS
            },

            // Slit Lamp Findings
            slitLampFindings: {
                eyelidsOD: examination.eyelidsOD,
                eyelidsOS: examination.eyelidsOS,
                conjunctivaOD: examination.conjunctivaOD,
                conjunctivaOS: examination.conjunctivaOS,
                corneaOD: examination.corneaOD,
                corneaOS: examination.corneaOS,
                lensOD: examination.lensOD,
                lensOS: examination.lensOS
            },

            // Clinical Notes
            clinicalNotes: examination.clinicalNotes,
            preliminaryDiagnosis: examination.preliminaryDiagnosis,

            // My Examination Tab
            examinationNotes: examination.examinationNotes,
            diagnosisText: examination.diagnoses?.[0]?.notes || '',  // Load from Diagnosis table
            selectedDiagnoses: examination.diagnoses && Array.isArray(examination.diagnoses) 
                ? examination.diagnoses
                    .map(diag => {
                        // Safely extract diagnosis data
                        if (!diag || !diag.disease) return null;
                        
                        const icd11Code = diag.disease.icd11Code;
                        const icd11CodeId = diag.disease.icd11CodeId;
                        
                        // Handle title which might be an object with @value or a string
                        let title = '';
                        if (icd11Code?.title) {
                            if (typeof icd11Code.title === 'object' && icd11Code.title['@value']) {
                                title = icd11Code.title['@value'];
                            } else if (typeof icd11Code.title === 'string') {
                                title = icd11Code.title;
                            } else {
                                title = JSON.stringify(icd11Code.title);
                            }
                        } else {
                            title = diag.disease.diseaseName || diag.notes || '';
                        }
                        
                        return {
                            id: icd11Code?.id || icd11CodeId,
                            code: icd11Code?.code || '',
                            title: title,
                            diseaseName: diag.disease.diseaseName || '',
                            category: diag.disease.ophthalmologyCategory || '',
                            diseaseId: diag.diseaseId
                        };
                    })
                    .filter(d => d && d.id) // Filter out null entries and those without ICD11 code
                : [],
            additionalTestsOrdered: examination.additionalTestsOrdered ?
                (typeof examination.additionalTestsOrdered === 'string' ?
                    JSON.parse(examination.additionalTestsOrdered) :
                    examination.additionalTestsOrdered) :
                null,
            followUpRequired: examination.followUpRequired || false,
            followUpPeriod: examination.followUpPeriod,
            followUpDays: examination.followUpDays,
            followUpDate: examination.followUpDate,
            surgeryRecommended: examination.surgeryRecommended || false,
            surgeryTypeId: examination.patientVisit?.ipdAdmission?.surgeryTypeId || null,  // Get from IPD admission
            treatmentPlan: examination.treatmentPlan || '',

            // Metadata
            createdAt: examination.createdAt,
            updatedAt: examination.updatedAt
        };

        return transformedData;

    } catch (error) {
        console.error('❌ Error fetching detailed ophthalmologist examination:', error);
        throw new Error(`Failed to fetch detailed examination: ${error.message}`);
    }
}

/**
 * Get patient visit ID from queue entry
 * @param {string} queueEntryId - Queue entry ID
 * @returns {Promise<string|null>} Patient visit ID or null
 */
async function getPatientVisitIdFromQueueEntry(queueEntryId) {
    try {
        const queueEntry = await prisma.patientQueue.findUnique({
            where: { id: queueEntryId },
            select: { patientVisitId: true }
        });

        return queueEntry?.patientVisitId || null;
    } catch (error) {
        console.error('❌ Error getting patient visit ID:', error);
        return null;
    }
}

module.exports = {
    saveDetailedOphthalmologistExamination,
    getDetailedOphthalmologistExamination,
    getPatientVisitIdFromQueueEntry
};
