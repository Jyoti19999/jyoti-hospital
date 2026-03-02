// src/services/medicalReportsService.js
const prisma = require('../utils/prisma');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Get diagnostic records for a doctor with filtering
 */
const getDiagnosticRecords = async (doctorId, filters = {}) => {
    try {
        const { dateFilter, statusFilter, searchTerm, page = 1, limit = 50 } = filters;

        console.log('🔍 getDiagnosticRecords called with:', {
            doctorId,
            dateFilter,
            statusFilter,
            searchTerm,
            page,
            limit
        });

        // First, let's check what data exists for this doctor
        const totalQueueEntries = await prisma.patientQueue.count({
            where: {
                assignedStaffId: doctorId,
                status: 'COMPLETED'
            }
        });

        const totalPatientVisits = await prisma.patientVisit.count({
            where: {
                doctorId,
                status: 'COMPLETED'
            }
        });

        console.log(`📊 Total completed queue entries for doctor ${doctorId}: ${totalQueueEntries}`);
        console.log(`📊 Total completed patient visits for doctor ${doctorId}: ${totalPatientVisits}`);

        // Build date filter
        let dateCondition = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (dateFilter) {
            case 'today':
                dateCondition = {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                };
                break;
            case 'yesterday':
                const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
                dateCondition = {
                    gte: yesterday,
                    lt: today
                };
                break;
            case 'week':
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateCondition = {
                    gte: weekAgo
                };
                break;
            case 'all':
                // No date filter
                break;
            default:
                // Default to all time
                break;
        }

        // Build where condition for completed patient visits
        let whereCondition = {
            doctorId,
            status: 'COMPLETED'
        };

        // Add date condition if specified
        if (Object.keys(dateCondition).length > 0) {
            whereCondition.completedAt = dateCondition;
        }

        // Add search condition if specified
        if (searchTerm && searchTerm.trim()) {
            whereCondition.OR = [
                {
                    patient: {
                        OR: [
                            { firstName: { contains: searchTerm.trim(), mode: 'insensitive' } },
                            { lastName: { contains: searchTerm.trim(), mode: 'insensitive' } }
                        ]
                    }
                },
                {
                    appointment: {
                        tokenNumber: { contains: searchTerm.trim(), mode: 'insensitive' }
                    }
                },
                {
                    visitType: { contains: searchTerm.trim(), mode: 'insensitive' }
                },
                {
                    visitOutcome: { contains: searchTerm.trim(), mode: 'insensitive' }
                }
            ];
        }

        console.log('🔍 Final where condition:', JSON.stringify(whereCondition, null, 2));

        // Get total count first
        const totalCount = await prisma.patientVisit.count({
            where: whereCondition
        });

        console.log(`📊 Completed patient visits count: ${totalCount}`);

        // Get completed patient visits (these are our "diagnostic records")
        const patientVisits = await prisma.patientVisit.findMany({
            where: whereCondition,
            include: {
                patient: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        dateOfBirth: true,
                        phone: true,
                        patientNumber: true
                    }
                },
                appointment: {
                    select: {
                        tokenNumber: true,
                        appointmentDate: true
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
                // Include any examinations if they exist
                examinations: {
                    include: {
                        diagnoses: {
                            include: {
                                disease: true
                            }
                        }
                    }
                },
                ophthalmologistExaminations: {
                    include: {
                        diagnoses: {
                            include: {
                                disease: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                completedAt: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit
        });

        console.log(`📋 Retrieved ${patientVisits.length} completed patient visits`);



        // Transform patient visits to diagnostic records
        const transformedExaminations = patientVisits.map(visit => {
            console.log('🔄 Transforming patient visit:', visit.id);

            const patient = visit.patient;
            const appointment = visit.appointment;

            // Collect all diagnoses from examinations
            const allDiagnoses = [];
            if (visit.examinations) {
                visit.examinations.forEach(exam => {
                    if (exam.diagnoses) {
                        allDiagnoses.push(...exam.diagnoses);
                    }
                });
            }
            if (visit.ophthalmologistExaminations) {
                visit.ophthalmologistExaminations.forEach(exam => {
                    if (exam.diagnoses) {
                        allDiagnoses.push(...exam.diagnoses);
                    }
                });
            }

            // Get examination details if available
            const hasExaminations = visit.examinations?.length > 0 || visit.ophthalmologistExaminations?.length > 0;
            const examinationType = visit.ophthalmologistExaminations?.length > 0 ? 'ophthalmologist' : 'general';

            return {
                id: visit.id,
                patient: `${patient.firstName} ${patient.lastName}`,
                patientId: patient.id,
                patientNumber: patient.patientNumber,
                age: patient.dateOfBirth ?
                    Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) :
                    'N/A',
                token: appointment?.tokenNumber || 'N/A',
                test: visit.visitType || 'Consultation',
                result: visit.visitOutcome || visit.chiefComplaint || 'Visit completed',
                date: visit.completedAt ? visit.completedAt.toISOString().split('T')[0] : visit.createdAt.toISOString().split('T')[0],
                time: visit.completedAt ? visit.completedAt.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }) : visit.createdAt.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }),
                status: 'Completed',
                visitId: visit.id,
                diagnoses: allDiagnoses.map(d => ({
                    id: d.id,
                    disease: d.disease?.diseaseName || 'General diagnosis',
                    severity: d.severity,
                    eyeAffected: d.eyeAffected
                })),
                // Include examination data if available
                visualAcuity: visit.examinations?.[0]?.visualAcuity || null,
                refraction: visit.examinations?.[0]?.refraction || null,
                intraocularPressure: visit.examinations?.[0]?.intraocularPressure || null,
                slitLampFindings: visit.ophthalmologistExaminations?.[0]?.slitLampFindings || visit.examinations?.[0]?.slitLampFindings || null,
                fundoscopyFindings: visit.ophthalmologistExaminations?.[0]?.fundoscopyFindings || visit.examinations?.[0]?.fundoscopyFindings || null,
                examinationType: examinationType,
                hasExaminations: hasExaminations,
                visitData: {
                    chiefComplaint: visit.chiefComplaint,
                    presentingSymptoms: visit.presentingSymptoms,
                    visionComplaints: visit.visionComplaints,
                    eyeSymptoms: visit.eyeSymptoms,
                    followUpRequired: visit.followUpRequired,
                    followUpDate: visit.followUpDate
                }
            };
        });

        // If no data found with current filters, try without date filter
        if (transformedExaminations.length === 0 && totalCount === 0 && dateFilter !== 'all') {
            console.log('⚠️ No data found with current filters, trying without date filter...');

            const broadWhereCondition = {
                doctorId,
                status: 'COMPLETED'
            };

            // Add search condition if specified
            if (searchTerm && searchTerm.trim()) {
                broadWhereCondition.OR = [
                    {
                        patient: {
                            OR: [
                                { firstName: { contains: searchTerm.trim(), mode: 'insensitive' } },
                                { lastName: { contains: searchTerm.trim(), mode: 'insensitive' } }
                            ]
                        }
                    },
                    {
                        appointment: {
                            tokenNumber: { contains: searchTerm.trim(), mode: 'insensitive' }
                        }
                    }
                ];
            }

            const broadPatientVisits = await prisma.patientVisit.findMany({
                where: broadWhereCondition,
                include: {
                    patient: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            dateOfBirth: true,
                            phone: true,
                            patientNumber: true
                        }
                    },
                    appointment: {
                        select: {
                            tokenNumber: true,
                            appointmentDate: true
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
                    completedAt: 'desc'
                },
                take: limit
            });

            if (broadPatientVisits.length > 0) {
                console.log(`📋 Found ${broadPatientVisits.length} completed visits (all time)`);
                const broadTransformed = broadPatientVisits.map(visit => ({
                    id: visit.id,
                    patient: `${visit.patient.firstName} ${visit.patient.lastName}`,
                    patientId: visit.patient.id,
                    patientNumber: visit.patient.patientNumber,
                    age: visit.patient.dateOfBirth ?
                        Math.floor((new Date() - new Date(visit.patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) :
                        'N/A',
                    token: visit.appointment?.tokenNumber || 'N/A',
                    test: visit.visitType || 'Consultation',
                    result: visit.visitOutcome || visit.chiefComplaint || 'Visit completed',
                    date: visit.completedAt ? visit.completedAt.toISOString().split('T')[0] : visit.createdAt.toISOString().split('T')[0],
                    time: visit.completedAt ? visit.completedAt.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }) : visit.createdAt.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }),
                    status: 'Completed',
                    visitId: visit.id,
                    diagnoses: [],
                    examinationType: 'visit'
                }));

                return {
                    examinations: broadTransformed,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(broadTransformed.length / limit),
                        totalCount: broadTransformed.length,
                        hasNext: page < Math.ceil(broadTransformed.length / limit),
                        hasPrev: page > 1
                    },
                    message: 'Showing all available completed visits.'
                };
            }
        }

        return {
            examinations: transformedExaminations,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                hasNext: page < Math.ceil(totalCount / limit),
                hasPrev: page > 1
            }
        };

    } catch (error) {
        console.error('Error fetching diagnostic records:', error);
        throw new Error('Failed to fetch diagnostic records');
    }
};

/**
 * Get prescription details for download
 */
const getPrescriptionDetails = async (prescriptionId, doctorId) => {
    try {
        const prescription = await prisma.prescription.findFirst({
            where: {
                id: prescriptionId,
                doctorId // Ensure doctor can only access their own prescriptions
            },
            include: {
                prescriptionItems: true,
                patientVisit: {
                    include: {
                        patient: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                dateOfBirth: true,
                                phone: true,
                                patientNumber: true,
                                address: true,
                                allergies: true
                            }
                        },
                        appointment: {
                            select: {
                                tokenNumber: true,
                                appointmentDate: true
                            }
                        }
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        staffType: true,
                        qualifications: true,
                        phone: true
                    }
                }
            }
        });

        if (!prescription) {
            throw new Error('Prescription not found or access denied');
        }

        return prescription;
    } catch (error) {
        console.error('Error fetching prescription details:', error);
        throw error;
    }
};

/**
 * Get examination details for medical report
 */
const getExaminationDetails = async (examinationId, doctorId) => {
    try {
        const examination = await prisma.examination.findFirst({
            where: {
                id: examinationId,
                doctorId // Ensure doctor can only access their own examinations
            },
            include: {
                visit: {
                    include: {
                        patient: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                dateOfBirth: true,
                                phone: true,
                                patientNumber: true,
                                address: true,
                                allergies: true,
                                chronicConditions: true,
                                eyeHistory: true,
                                visionHistory: true
                            }
                        },
                        appointment: {
                            select: {
                                tokenNumber: true,
                                appointmentDate: true
                            }
                        }
                    }
                },
                diagnoses: {
                    include: {
                        disease: true
                    }
                },
                doctor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        staffType: true,
                        qualifications: true,
                        phone: true
                    }
                }
            }
        });

        if (!examination) {
            throw new Error('Examination not found or access denied');
        }

        return examination;
    } catch (error) {
        console.error('Error fetching examination details:', error);
        throw error;
    }
};

/**
 * Generate prescription PDF
 */
const generatePrescriptionPDF = async (prescriptionId, doctorId) => {
    try {
        const prescription = await getPrescriptionDetails(prescriptionId, doctorId);

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).text('PRESCRIPTION', { align: 'center' });
            doc.moveDown();

            // Hospital/Clinic Info
            doc.fontSize(14).text('OptiCare Hospital', { align: 'center' });
            doc.fontSize(10).text('Institute of Ophthalmology & Laser Center', { align: 'center' });
            doc.moveDown();

            // Doctor Info
            doc.fontSize(12).text(`Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`);
            doc.fontSize(10).text(`${prescription.doctor.staffType} | ${prescription.doctor.phone || ''}`);
            if (prescription.doctor.qualifications) {
                doc.text(`Qualifications: ${JSON.stringify(prescription.doctor.qualifications)}`);
            }
            doc.moveDown();

            // Patient Info
            const patient = prescription.patientVisit.patient;
            const age = patient.dateOfBirth ?
                Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) :
                'N/A';

            doc.text(`Patient: ${patient.firstName} ${patient.lastName}`);
            doc.text(`Patient ID: ${patient.patientNumber || patient.id}`);
            doc.text(`Age: ${age} | Phone: ${patient.phone || 'N/A'}`);
            doc.text(`Token: ${prescription.patientVisit.appointment?.tokenNumber || 'N/A'}`);
            doc.text(`Date: ${prescription.prescriptionDate.toLocaleDateString()}`);

            if (patient.allergies) {
                doc.text(`Allergies: ${JSON.stringify(patient.allergies)}`);
            }
            doc.moveDown();

            // Prescription Items
            doc.fontSize(14).text('MEDICATIONS:', { underline: true });
            doc.moveDown(0.5);

            prescription.prescriptionItems.forEach((item, index) => {
                doc.fontSize(12).text(`${index + 1}. ${item.medicineName}`);
                doc.fontSize(10).text(`   Dosage: ${item.dosage}`);
                doc.text(`   Frequency: ${item.frequency}`);
                doc.text(`   Duration: ${item.duration}`);
                if (item.quantity) {
                    doc.text(`   Quantity: ${item.quantity}`);
                }
                if (item.instructions) {
                    doc.text(`   Instructions: ${item.instructions}`);
                }
                doc.moveDown(0.5);
            });

            // General Instructions
            if (prescription.generalInstructions) {
                doc.fontSize(12).text('GENERAL INSTRUCTIONS:', { underline: true });
                doc.fontSize(10).text(prescription.generalInstructions);
                doc.moveDown();
            }

            // Follow-up Instructions
            if (prescription.followUpInstructions) {
                doc.fontSize(12).text('FOLLOW-UP INSTRUCTIONS:', { underline: true });
                doc.fontSize(10).text(prescription.followUpInstructions);
                doc.moveDown();
            }

            // Valid Till
            if (prescription.validTill) {
                doc.fontSize(10).text(`Valid Till: ${prescription.validTill.toLocaleDateString()}`);
            }

            // Footer
            doc.moveDown();
            doc.fontSize(8).text('This is a computer-generated prescription.', { align: 'center' });
            doc.text(`Prescription No: ${prescription.prescriptionNumber}`, { align: 'center' });

            doc.end();
        });
    } catch (error) {
        console.error('Error generating prescription PDF:', error);
        throw error;
    }
};

/**
 * Generate medical report PDF
 */
const generateMedicalReportPDF = async (examinationId, doctorId) => {
    try {
        const examination = await getExaminationDetails(examinationId, doctorId);

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).text('MEDICAL EXAMINATION REPORT', { align: 'center' });
            doc.moveDown();

            // Hospital/Clinic Info
            doc.fontSize(14).text('OptiCare Hospital', { align: 'center' });
            doc.fontSize(10).text('Institute of Ophthalmology & Laser Center', { align: 'center' });
            doc.moveDown();

            // Doctor Info
            doc.fontSize(12).text(`Examined by: Dr. ${examination.doctor.firstName} ${examination.doctor.lastName}`);
            doc.fontSize(10).text(`${examination.doctor.staffType} | ${examination.doctor.phone || ''}`);
            doc.moveDown();

            // Patient Info
            const patient = examination.visit.patient;
            const age = patient.dateOfBirth ?
                Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) :
                'N/A';

            doc.text(`Patient: ${patient.firstName} ${patient.lastName}`);
            doc.text(`Patient ID: ${patient.patientNumber || patient.id}`);
            doc.text(`Age: ${age} | Phone: ${patient.phone || 'N/A'}`);
            doc.text(`Token: ${examination.visit.appointment?.tokenNumber || 'N/A'}`);
            doc.text(`Examination Date: ${examination.examinationDate.toLocaleDateString()}`);
            doc.moveDown();

            // Examination Type
            if (examination.examinationType) {
                doc.fontSize(12).text(`Examination Type: ${examination.examinationType}`);
                doc.moveDown();
            }

            // Visual Acuity
            if (examination.visualAcuity) {
                doc.fontSize(14).text('VISUAL ACUITY:', { underline: true });
                doc.fontSize(10).text(JSON.stringify(examination.visualAcuity, null, 2));
                doc.moveDown();
            }

            // Refraction
            if (examination.refraction) {
                doc.fontSize(14).text('REFRACTION:', { underline: true });
                doc.fontSize(10).text(JSON.stringify(examination.refraction, null, 2));
                doc.moveDown();
            }

            // Intraocular Pressure
            if (examination.intraocularPressure) {
                doc.fontSize(14).text('INTRAOCULAR PRESSURE:', { underline: true });
                doc.fontSize(10).text(JSON.stringify(examination.intraocularPressure, null, 2));
                doc.moveDown();
            }

            // Slit Lamp Findings
            if (examination.slitLampFindings) {
                doc.fontSize(14).text('SLIT LAMP FINDINGS:', { underline: true });
                doc.fontSize(10).text(JSON.stringify(examination.slitLampFindings, null, 2));
                doc.moveDown();
            }

            // Fundoscopy Findings
            if (examination.fundoscopyFindings) {
                doc.fontSize(14).text('FUNDOSCOPY FINDINGS:', { underline: true });
                doc.fontSize(10).text(JSON.stringify(examination.fundoscopyFindings, null, 2));
                doc.moveDown();
            }

            // Clinical Impressions
            if (examination.clinicalImpressions) {
                doc.fontSize(14).text('CLINICAL IMPRESSIONS:', { underline: true });
                doc.fontSize(10).text(examination.clinicalImpressions);
                doc.moveDown();
            }

            // Diagnoses
            if (examination.diagnoses && examination.diagnoses.length > 0) {
                doc.fontSize(14).text('DIAGNOSES:', { underline: true });
                examination.diagnoses.forEach((diagnosis, index) => {
                    doc.fontSize(10).text(`${index + 1}. ${diagnosis.disease?.diseaseName || 'General diagnosis'}`);
                    if (diagnosis.severity) doc.text(`   Severity: ${diagnosis.severity}`);
                    if (diagnosis.eyeAffected) doc.text(`   Eye Affected: ${diagnosis.eyeAffected}`);
                    if (diagnosis.notes) doc.text(`   Notes: ${diagnosis.notes}`);
                });
                doc.moveDown();
            }

            // Treatment Plan
            if (examination.treatmentPlan) {
                doc.fontSize(14).text('TREATMENT PLAN:', { underline: true });
                doc.fontSize(10).text(JSON.stringify(examination.treatmentPlan, null, 2));
                doc.moveDown();
            }

            // Follow-up
            if (examination.followUpRequired) {
                doc.fontSize(12).text('FOLLOW-UP REQUIRED:', { underline: true });
                if (examination.followUpDate) {
                    doc.fontSize(10).text(`Follow-up Date: ${examination.followUpDate.toLocaleDateString()}`);
                }
                doc.moveDown();
            }

            // Footer
            doc.fontSize(8).text('This is a computer-generated medical report.', { align: 'center' });
            doc.text(`Report ID: ${examination.id}`, { align: 'center' });

            doc.end();
        });
    } catch (error) {
        console.error('Error generating medical report PDF:', error);
        throw error;
    }
};

/**
 * Export diagnostic records to CSV
 */
const exportDiagnosticRecordsCSV = async (doctorId, filters = {}) => {
    try {
        const { examinations } = await getDiagnosticRecords(doctorId, { ...filters, limit: 1000 });

        const csvHeaders = [
            'Date',
            'Time',
            'Patient Name',
            'Patient ID',
            'Age',
            'Token',
            'Test Type',
            'Clinical Impressions',
            'Status'
        ];

        const csvRows = examinations.map(exam => [
            exam.date,
            exam.time,
            exam.patient,
            exam.patientNumber || exam.patientId,
            exam.age,
            exam.token,
            exam.test,
            exam.result,
            exam.status
        ]);

        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
        ].join('\n');

        return csvContent;
    } catch (error) {
        console.error('Error exporting diagnostic records to CSV:', error);
        throw error;
    }
};

module.exports = {
    getDiagnosticRecords,
    getPrescriptionDetails,
    getExaminationDetails,
    generatePrescriptionPDF,
    generateMedicalReportPDF,
    exportDiagnosticRecordsCSV
};