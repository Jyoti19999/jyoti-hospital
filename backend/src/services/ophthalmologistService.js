// src/services/ophthalmologistService.js
const prisma = require('../utils/prisma');

class OphthalmologistService {

    /**
     * Get the complete ophthalmologist queue with all patient information
     * @returns {Promise<Object>} Queue data with statistics and patient entries
     */
    async getOphthalmologistQueue() {
        try {
            console.log('🔍 Fetching ophthalmologist queue...');

            const queueEntries = await prisma.patientQueue.findMany({
                where: {
                    queueFor: 'OPHTHALMOLOGIST',
                    status: {
                        in: ['WAITING', 'CALLED', 'IN_PROGRESS']
                    }
                },
                include: {
                    patient: {
                        select: {
                            id: true,
                            patientNumber: true,
                            firstName: true,
                            middleName: true,
                            lastName: true,
                            dateOfBirth: true,
                            gender: true,
                            phone: true,
                            email: true
                        }
                    },
                    patientVisit: {
                        include: {
                            appointment: {
                                select: {
                                    id: true,
                                    tokenNumber: true,
                                    appointmentTime: true,
                                    appointmentType: true,
                                    purpose: true
                                }
                            },
                            // Include optometrist examination for review status
                            optometristExamination: {
                                select: {
                                    id: true,
                                    completedAt: true,
                                    assignedDoctor: true,
                                    receptionist2Reviewed: true,
                                    receptionist2ReviewedAt: true,
                                    receptionist2ReviewedBy: true,
                                    receptionist2Notes: true
                                }
                            }
                        }
                    },
                    assignedStaff: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            staffType: true
                        }
                    }
                },
                orderBy: [
                    { queueNumber: 'asc' }
                ]
            });

            const queueData = queueEntries.map(entry => {
                const patient = entry.patient || entry.patientVisit?.patient;
                const patientVisit = entry.patientVisit;

                return {
                    id: entry.id,
                    queueEntryId: entry.id,
                    queueNumber: entry.queueNumber,
                    status: entry.status,
                    priorityLabel: entry.priorityLabel,
                    queueFor: entry.queueFor,
                    token: `OPH-${entry.queueNumber}`,
                    waitTime: this.calculateWaitTime(entry.createdAt),
                    joinedAt: entry.createdAt,
                    calledAt: entry.calledAt,
                    inProgressAt: entry.inProgressAt, // Added for timer
                    completedAt: entry.completedAt,
                    name: `${patient.firstName} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName}`,
                    fullName: `${patient.firstName} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName}`,
                    firstName: patient.firstName,
                    middleName: patient.middleName,
                    lastName: patient.lastName,
                    age: this.calculateAge(patient.dateOfBirth),
                    gender: patient.gender,
                    patientNumber: patient.patientNumber,
                    phone: patient.phone,
                    email: patient.email,
                    visitType: patientVisit?.visitType || 'consultation',
                    visitDate: patientVisit?.visitDate,
                    priority: patientVisit?.priorityLevel || 'NORMAL',
                    notes: entry.notes || patientVisit?.receptionist2Notes,
                    visitData: patientVisit,
                    assignedStaff: entry.assignedStaff ? {
                        id: entry.assignedStaff.id,
                        name: `${entry.assignedStaff.firstName} ${entry.assignedStaff.lastName}`,
                        firstName: entry.assignedStaff.firstName,
                        lastName: entry.assignedStaff.lastName,
                        staffType: entry.assignedStaff.staffType
                    } : null,

                    // Patient information
                    patient: {
                        id: patient.id,
                        patientNumber: patient.patientNumber,
                        fullName: `${patient.firstName} ${patient.middleName ? patient.middleName + ' ' : ''}${patient.lastName}`,
                        firstName: patient.firstName,
                        middleName: patient.middleName,
                        lastName: patient.lastName,
                        dateOfBirth: patient.dateOfBirth,
                        gender: patient.gender,
                        phone: patient.phone,
                        email: patient.email
                    },

                    // Appointment information
                    appointment: patientVisit?.appointment ? {
                        id: patientVisit.appointment.id,
                        tokenNumber: patientVisit.appointment.tokenNumber,
                        appointmentTime: patientVisit.appointment.appointmentTime,
                        appointmentType: patientVisit.appointment.appointmentType,
                        purpose: patientVisit.appointment.purpose
                    } : null,

                    // Visit information
                    visit: {
                        id: patientVisit?.id,
                        visitType: patientVisit?.visitType,
                        status: patientVisit?.status,
                        checkedInAt: patientVisit?.checkedInAt
                    },

                    // Examination information
                    examinationId: patientVisit?.optometristExamination?.id || null,
                    examinationType: patientVisit?.optometristExamination?.id ? 'optometrist' : null,

                    // Source information (came from optometrist or direct emergency)
                    sourceInfo: {
                        cameFromOptometrist: !!patientVisit?.optometristExamination?.id,
                        isEmergencyDirect: !patientVisit?.optometristExamination?.id,
                        optometristCompletedAt: patientVisit?.optometristExamination?.completedAt,
                        assignedDoctor: patientVisit?.optometristExamination?.assignedDoctor
                    },

                    // Receptionist2 review information - use dedicated PatientQueue fields as primary source
                    receptionist2Review: {
                        reviewed: entry.receptionist2Reviewed || false,
                        reviewedAt: entry.receptionist2ReviewedAt,
                        reviewedBy: entry.receptionist2ReviewedBy,
                        notes: entry.receptionist2Notes
                    }
                };
            });

            const statistics = {
                totalPatients: queueData.length,
                waitingPatients: queueData.filter(p => p.status === 'WAITING').length,
                calledPatients: queueData.filter(p => p.status === 'CALLED').length,
                inProgressPatients: queueData.filter(p => p.status === 'IN_PROGRESS').length,
                averageWaitTime: this.calculateAverageWaitTime(queueData),
                emergencyPatients: queueData.filter(p => p.priority === 'EMERGENCY').length,
                priorityPatients: queueData.filter(p => p.priority === 'PRIORITY').length
            };

            console.log(`✅ Retrieved ${queueData.length} patients from ophthalmologist queue`);

            return {
                queueEntries: queueData,
                statistics,
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error fetching ophthalmologist queue:', error);
            throw new Error(`Failed to fetch ophthalmologist queue: ${error.message}`);
        }
    }

    /**
     * Assign a patient to an ophthalmologist (without starting consultation)
     * @param {string} queueEntryId - The queue entry ID
     * @param {string} ophthalmologistId - The ophthalmologist staff ID
     * @returns {Promise<Object>} Assignment result
     */
    async assignPatientToDoctor(queueEntryId, ophthalmologistId) {
        try {
            console.log(`🔍 Attempting to assign patient. QueueEntryId: ${queueEntryId}, DoctorId: ${ophthalmologistId}`);

            return await prisma.$transaction(async (tx) => {
                // First check if the patient exists
                const queueEntry = await tx.patientQueue.findUnique({
                    where: { id: queueEntryId },
                    include: {
                        patient: {
                            select: {
                                patientNumber: true,
                                firstName: true,
                                lastName: true
                            }
                        },
                        assignedStaff: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                });

                console.log(`🔍 Queue entry found:`, queueEntry ? {
                    id: queueEntry.id,
                    queueFor: queueEntry.queueFor,
                    status: queueEntry.status,
                    assignedStaffId: queueEntry.assignedStaffId,
                    doctorQueuePosition: queueEntry.doctorQueuePosition,
                    patientName: queueEntry.patient ? `${queueEntry.patient.firstName} ${queueEntry.patient.lastName}` : 'No patient'
                } : 'NULL');

                if (!queueEntry) {
                    throw new Error(`Queue entry not found with ID: ${queueEntryId}`);
                }

                if (queueEntry.queueFor !== 'OPHTHALMOLOGIST') {
                    throw new Error(`Patient is not in ophthalmologist queue. Current queue: ${queueEntry.queueFor}`);
                }

                if (queueEntry.status !== 'WAITING') {
                    throw new Error(`Cannot assign patient with status ${queueEntry.status}. Patient must be WAITING.`);
                }

                // Check if reassigning from another doctor
                const previousDoctorId = queueEntry.assignedStaffId;
                const previousPosition = queueEntry.doctorQueuePosition;

                if (previousDoctorId && previousDoctorId !== ophthalmologistId) {
                    console.log(`🔄 Reassigning patient from Dr. ${queueEntry.assignedStaff?.firstName || 'Unknown'} to new doctor`);
                    
                    // Shift down all patients in the previous doctor's queue who were after this patient
                    if (previousPosition) {
                        await tx.patientQueue.updateMany({
                            where: {
                                assignedStaffId: previousDoctorId,
                                doctorQueuePosition: { gt: previousPosition }
                            },
                            data: {
                                doctorQueuePosition: { decrement: 1 }
                            }
                        });
                        console.log(`✅ Shifted down patients in previous doctor's queue after position ${previousPosition}`);
                    }
                }

                console.log(`✅ Validation passed. Calculating queue position for new doctor...`);

                // Calculate the next queue position for the new doctor
                const existingQueueEntries = await tx.patientQueue.findMany({
                    where: {
                        assignedStaffId: ophthalmologistId,
                        doctorQueuePosition: { not: null }
                    },
                    select: {
                        doctorQueuePosition: true
                    }
                });

                // Find the maximum queue position and add 1
                const maxPosition = existingQueueEntries.reduce((max, entry) => {
                    return entry.doctorQueuePosition > max ? entry.doctorQueuePosition : max;
                }, 0);

                const nextQueuePosition = maxPosition + 1;

                console.log(`📍 Calculated queue position for doctor ${ophthalmologistId}: ${nextQueuePosition} (max was ${maxPosition})`);

                // Assign the doctor with queue position, keep status as WAITING
                const updatedPatient = await tx.patientQueue.update({
                    where: { id: queueEntryId },
                    data: {
                        assignedStaffId: ophthalmologistId,
                        doctorQueuePosition: nextQueuePosition,
                        updatedAt: new Date()
                    },
                    include: {
                        patient: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                });

                console.log(`👨‍⚕️ Successfully assigned patient ${queueEntry.patient.firstName} ${queueEntry.patient.lastName} to doctor ${ophthalmologistId}`);

                return {
                    queueEntryId: updatedPatient.id,
                    patientId: queueEntry.patient.id,
                    name: `${queueEntry.patient.firstName} ${queueEntry.patient.lastName}`,
                    patientNumber: queueEntry.patient.patientNumber,
                    queueNumber: queueEntry.queueNumber,
                    token: `OPH-${queueEntry.queueNumber}`,
                    assignedAt: updatedPatient.updatedAt,
                    status: updatedPatient.status
                };
            });

        } catch (error) {
            console.error('❌ Error assigning patient to doctor:', error);
            console.error('❌ Full error details:', {
                message: error.message,
                code: error.code,
                meta: error.meta,
                queueEntryId,
                ophthalmologistId
            });
            throw new Error(`Failed to assign patient: ${error.message}`);
        }
    }

    /**
     * Call a specific assigned patient
     * @param {string} queueEntryId - The queue entry ID
     * @param {string} ophthalmologistId - The ophthalmologist staff ID
     * @returns {Promise<Object>} Called patient information
     */
    async callAssignedPatient(queueEntryId, ophthalmologistId) {
        try {
            // First check if the patient exists and is assigned to this doctor
            const queueEntry = await prisma.patientQueue.findUnique({
                where: { id: queueEntryId },
                include: {
                    patient: {
                        select: {
                            patientNumber: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            if (!queueEntry) {
                throw new Error('Queue entry not found');
            }

            if (queueEntry.queueFor !== 'OPHTHALMOLOGIST') {
                throw new Error('Patient is not in ophthalmologist queue');
            }

            if (queueEntry.status !== 'WAITING') {
                throw new Error(`Patient status is ${queueEntry.status}, expected WAITING`);
            }

            // Update patient status to CALLED and assign to doctor
            const updatedPatient = await prisma.patientQueue.update({
                where: { id: queueEntryId },
                data: {
                    status: 'CALLED',
                    calledAt: new Date(),
                    assignedStaffId: ophthalmologistId
                }
            });

            console.log(`📞 Called assigned patient: ${queueEntry.patient.firstName} ${queueEntry.patient.lastName}`);

            return {
                queueEntryId: updatedPatient.id,
                patientId: queueEntry.patient.id,
                name: `${queueEntry.patient.firstName} ${queueEntry.patient.lastName}`,
                patientNumber: queueEntry.patient.patientNumber,
                queueNumber: queueEntry.queueNumber,
                token: `OPH-${queueEntry.queueNumber}`,
                calledAt: updatedPatient.calledAt
            };

        } catch (error) {
            console.error('❌ Error calling assigned patient:', error);
            throw new Error(`Failed to call assigned patient: ${error.message}`);
        }
    }

    /**
     * Call next patient in the ophthalmologist queue
     * @param {string} ophthalmologistId - The ophthalmologist staff ID
     * @returns {Promise<Object>} Called patient information
     */
    async callNextPatient(ophthalmologistId) {
        try {
            const nextPatient = await prisma.patientQueue.findFirst({
                where: {
                    queueFor: 'OPHTHALMOLOGIST',
                    status: 'WAITING'
                },
                include: {
                    patient: {
                        select: {
                            patientNumber: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                },
                orderBy: [
                    { queueNumber: 'asc' }
                ]
            });

            if (!nextPatient) {
                throw new Error('No patients waiting in the ophthalmologist queue');
            }

            const updatedPatient = await prisma.patientQueue.update({
                where: { id: nextPatient.id },
                data: {
                    status: 'CALLED',
                    calledAt: new Date(),
                    assignedStaffId: ophthalmologistId
                }
            });

            console.log(`📞 Called next patient: ${nextPatient.patient.firstName} ${nextPatient.patient.lastName}`);

            return {
                queueEntryId: updatedPatient.id,
                patientId: nextPatient.patient.id,
                name: `${nextPatient.patient.firstName} ${nextPatient.patient.lastName}`,
                patientNumber: nextPatient.patient.patientNumber,
                queueNumber: nextPatient.queueNumber,
                token: `OPH-${nextPatient.queueNumber}`,
                calledAt: updatedPatient.calledAt
            };

        } catch (error) {
            console.error('❌ Error calling next patient:', error);
            throw new Error(`Failed to call next patient: ${error.message}`);
        }
    }

    /**
     * Start consultation for a patient
     * @param {string} queueEntryId - The queue entry ID
     * @param {string} ophthalmologistId - The ophthalmologist staff ID
     * @returns {Promise<Object>} Updated queue entry
     */
    async startConsultation(queueEntryId, ophthalmologistId) {
        try {
            // First check if the record exists and get its current status
            const existingEntry = await prisma.patientQueue.findUnique({
                where: { id: queueEntryId },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            if (!existingEntry) {
                throw new Error('Patient queue entry not found. The patient may have been removed from the queue.');
            }

            if (existingEntry.status === 'COMPLETED') {
                throw new Error('This consultation has already been completed.');
            }

            if (existingEntry.status === 'IN_PROGRESS') {
                console.log(`⚠️ Consultation already in progress for: ${existingEntry.patient.firstName}`);
                return existingEntry; // Return existing record instead of failing
            }

            const updatedQueueEntry = await prisma.patientQueue.update({
                where: {
                    id: queueEntryId,
                    queueFor: 'OPHTHALMOLOGIST',
                    status: 'CALLED'
                },
                data: {
                    status: 'IN_PROGRESS',
                    inProgressAt: new Date(),
                    assignedStaffId: ophthalmologistId
                },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            console.log(`✅ Started consultation for patient: ${updatedQueueEntry.patient.firstName} ${updatedQueueEntry.patient.lastName}`);

            return updatedQueueEntry;

        } catch (error) {
            console.error('❌ Error starting consultation:', error);
            throw new Error(`Failed to start consultation: ${error.message}`);
        }
    }

    /**
     * Put patient on hold (request eye drops from receptionist2)
     * @param {string} queueEntryId - The queue entry ID
     * @param {string} ophthalmologistId - The ophthalmologist staff ID
     * @returns {Promise<Object>} Updated queue entry
     */
    async putPatientOnHold(queueEntryId, ophthalmologistId, reasons = []) {
        try {
            console.log(`⏸️ Doctor requesting eye drops for patient: ${queueEntryId}`, { reasons });

            // First check if the patient exists and is in progress
            const queueEntry = await prisma.patientQueue.findUnique({
                where: { id: queueEntryId },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            if (!queueEntry) {
                throw new Error('Queue entry not found');
            }

            if (queueEntry.queueFor !== 'OPHTHALMOLOGIST') {
                throw new Error('Patient is not in ophthalmologist queue');
            }

            if (queueEntry.status !== 'IN_PROGRESS') {
                throw new Error(`Cannot put patient on hold. Current status: ${queueEntry.status}. Expected: IN_PROGRESS`);
            }

            if (queueEntry.assignedStaffId !== ophthalmologistId) {
                throw new Error('Patient is not assigned to this doctor');
            }

            // Reasons are already in readable format (from frontend)
            const reasonText = reasons.length > 0
                ? reasons.join(', ')
                : 'Eye drop application requested';

            // Update patient status to ON_HOLD (waiting for receptionist2 to apply drops)
            // Reset all previous dilation data for fresh start
            console.log(`🔄 Resetting dilation data for patient ${queueEntry.patient.firstName}`);

            const updatedQueueEntry = await prisma.patientQueue.update({
                where: { id: queueEntryId },
                data: {
                    status: 'ON_HOLD',
                    onHoldAt: new Date(), // When doctor requested drops
                    holdReason: reasonText, // Store the reasons
                    // Reset all dilation-related fields for fresh start
                    dilationRound: 0,
                    estimatedResumeTime: null,
                    estimatedWaitTime: null,
                    lastDilationCheckAt: null,
                    markedReadyForResume: false, // Reset the ready flag
                    updatedAt: new Date()
                },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            console.log(`⏸️ Patient ${queueEntry.patient.firstName} ${queueEntry.patient.lastName} put on hold - waiting for eye drops. Reasons: ${reasonText}`);

            return {
                queueEntryId: updatedQueueEntry.id,
                patientId: updatedQueueEntry.patientId,
                status: updatedQueueEntry.status,
                onHoldAt: updatedQueueEntry.onHoldAt,
                holdReason: reasonText,
                patientName: `${queueEntry.patient.firstName} ${queueEntry.patient.lastName}`,
                firstName: queueEntry.patient.firstName,
                lastName: queueEntry.patient.lastName,
                message: 'Patient on hold - Receptionist2 will be notified to apply eye drops'
            };

        } catch (error) {
            console.error('❌ Error putting patient on hold:', error);
            throw new Error(`Failed to put patient on hold: ${error.message}`);
        }
    }

    /**
     * Confirm eye drops applied by receptionist2 (starts 30-minute timer)
     * @param {string} queueEntryId - The queue entry ID
     * @param {string} receptionist2Id - The receptionist2 staff ID
     * @returns {Promise<Object>} Updated queue entry with timer started
     */
    async confirmEyeDropsApplied(queueEntryId, receptionist2Id, customWaitMinutes = 10) {
        try {
            console.log(`💧 Receptionist2 confirming eye drops applied: ${queueEntryId}, wait time: ${customWaitMinutes} minutes`);

            // First check if the patient exists and is on hold
            const queueEntry = await prisma.patientQueue.findUnique({
                where: { id: queueEntryId },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            if (!queueEntry) {
                throw new Error('Queue entry not found');
            }

            if (queueEntry.status !== 'ON_HOLD') {
                throw new Error(`Cannot confirm drops. Current status: ${queueEntry.status}. Expected: ON_HOLD`);
            }

            // Start Round 1 with custom wait time
            const dropsAppliedAt = new Date();
            const waitMinutes = customWaitMinutes || 10;
            const firstCheckTime = new Date(dropsAppliedAt.getTime() + (waitMinutes * 60 * 1000));

            // Update with drops applied info and start Round 1 timer
            const updatedQueueEntry = await prisma.patientQueue.update({
                where: { id: queueEntryId },
                data: {
                    // Keep status as ON_HOLD but add timer info
                    estimatedResumeTime: firstCheckTime,
                    estimatedWaitTime: waitMinutes,
                    customWaitMinutes: waitMinutes, // Store custom wait time for repeat dilations
                    dilationRound: 1, // Start Round 1
                    lastDilationCheckAt: dropsAppliedAt,
                    // Reset alarm state for new timer
                    alarmPlayed: false,
                    alarmPlayedAt: null,
                    // Don't overwrite holdReason - keep the doctor's original reason
                    updatedAt: new Date()
                },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            console.log(`✅ Eye drops applied for ${queueEntry.patient.firstName} ${queueEntry.patient.lastName} - ${waitMinutes} minute timer started (Round 1)`);

            return {
                queueEntryId: updatedQueueEntry.id,
                status: updatedQueueEntry.status,
                dropsAppliedAt,
                estimatedResumeTime: firstCheckTime,
                estimatedWaitMinutes: waitMinutes,
                customWaitMinutes: waitMinutes,
                dilationRound: 1,
                patientName: `${queueEntry.patient.firstName} ${queueEntry.patient.lastName}`,
                message: `Eye drops applied - ${waitMinutes} minute dilation timer started (Round 1/3)`
            };

        } catch (error) {
            console.error('❌ Error confirming eye drops applied:', error);
            throw new Error(`Failed to confirm eye drops applied: ${error.message}`);
        }
    }

    /**
     * Repeat dilation (add another 10-minute round)
     * @param {string} queueEntryId - The queue entry ID
     * @param {string} receptionist2Id - The receptionist2 staff ID
     * @returns {Promise<Object>} Updated queue entry with new timer
     */
    async repeatDilation(queueEntryId, receptionist2Id, customWaitMinutes = null) {
        try {
            console.log(`🔄 Receptionist2 repeating dilation: ${queueEntryId}`);

            const queueEntry = await prisma.patientQueue.findUnique({
                where: { id: queueEntryId },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            if (!queueEntry) {
                throw new Error('Queue entry not found');
            }

            if (queueEntry.status !== 'ON_HOLD') {
                throw new Error(`Cannot repeat dilation. Current status: ${queueEntry.status}`);
            }

            const currentRound = queueEntry.dilationRound || 1;
            const nextRound = currentRound + 1;

            if (nextRound > 3) {
                throw new Error('Maximum 3 dilation rounds reached');
            }

            // Use the stored customWaitMinutes or the provided one, default to 10
            const waitMinutes = customWaitMinutes || queueEntry.customWaitMinutes || 10;
            const now = new Date();
            const nextCheckTime = new Date(now.getTime() + (waitMinutes * 60 * 1000));

            const updatedQueueEntry = await prisma.patientQueue.update({
                where: { id: queueEntryId },
                data: {
                    estimatedResumeTime: nextCheckTime,
                    estimatedWaitTime: waitMinutes,
                    dilationRound: nextRound,
                    lastDilationCheckAt: now,
                    // Keep the customWaitMinutes for consistency
                    customWaitMinutes: waitMinutes,
                    // Reset alarm state for new timer
                    alarmPlayed: false,
                    alarmPlayedAt: null,
                    // Don't overwrite holdReason - keep the doctor's original reason
                    updatedAt: new Date()
                },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            console.log(`✅ Dilation repeated for ${queueEntry.patient.firstName} - Round ${nextRound}/3 (${waitMinutes} min)`);

            return {
                queueEntryId: updatedQueueEntry.id,
                round: nextRound,
                nextCheckTime,
                waitMinutes,
                message: `Dilation Round ${nextRound}/3 started - ${waitMinutes} minute timer`
            };

        } catch (error) {
            console.error('❌ Error repeating dilation:', error);
            throw new Error(`Failed to repeat dilation: ${error.message}`);
        }
    }

    /**
     * Mark patient as ready to resume (manual override)
     * @param {string} queueEntryId - The queue entry ID
     * @param {string} receptionist2Id - The receptionist2 staff ID
     * @returns {Promise<Object>} Updated queue entry marked as ready
     */
    async markReadyToResume(queueEntryId, receptionist2Id) {
        try {
            console.log(`✅ Receptionist2 marking patient ready: ${queueEntryId}`);

            const queueEntry = await prisma.patientQueue.findUnique({
                where: { id: queueEntryId },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            if (!queueEntry) {
                throw new Error('Queue entry not found');
            }

            if (queueEntry.status !== 'ON_HOLD') {
                throw new Error(`Cannot mark ready. Current status: ${queueEntry.status}`);
            }

            // Set resume time to past (ready immediately)
            const now = new Date();
            const pastTime = new Date(now.getTime() - (1 * 60 * 1000)); // 1 minute in the past

            const updatedQueueEntry = await prisma.patientQueue.update({
                where: { id: queueEntryId },
                data: {
                    estimatedResumeTime: pastTime, // Set to past so timeRemaining is negative
                    estimatedWaitTime: 0,
                    markedReadyForResume: true, // ✅ Mark as ready to resume
                    // Don't overwrite holdReason - keep the original doctor's reason
                    updatedAt: new Date()
                },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            console.log(`✅ Patient ${queueEntry.patient.firstName} marked as ready to resume`);

            return {
                queueEntryId: updatedQueueEntry.id,
                patientId: queueEntry.patientId,
                patientName: `${queueEntry.patient.firstName} ${queueEntry.patient.lastName}`,
                firstName: queueEntry.patient.firstName,
                lastName: queueEntry.patient.lastName,
                status: 'ready',
                message: 'Patient marked as ready to resume examination'
            };

        } catch (error) {
            console.error('❌ Error marking patient ready:', error);
            throw new Error(`Failed to mark patient ready: ${error.message}`);
        }
    }

    /**
     * Resume patient from hold status
     * @param {string} queueEntryId - The queue entry ID
     * @param {string} ophthalmologistId - The ophthalmologist staff ID
     * @returns {Promise<Object>} Updated queue entry
     */
    async resumePatientFromHold(queueEntryId, ophthalmologistId) {
        try {
            console.log(`▶️ Resuming patient from hold: ${queueEntryId}`);

            // First check if the patient exists and is on hold
            const queueEntry = await prisma.patientQueue.findUnique({
                where: { id: queueEntryId },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            if (!queueEntry) {
                throw new Error('Queue entry not found');
            }

            if (queueEntry.status !== 'ON_HOLD') {
                throw new Error(`Cannot resume patient. Current status: ${queueEntry.status}. Expected: ON_HOLD`);
            }

            if (queueEntry.assignedStaffId !== ophthalmologistId) {
                throw new Error('Patient is not assigned to this doctor');
            }

            // ✅ Doctor can now resume at ANY time - no markedReadyForResume restriction
            // This allows doctors to resume patients even during dilation timer

            // Calculate actual hold duration
            const holdDuration = queueEntry.onHoldAt ?
                Math.floor((new Date() - new Date(queueEntry.onHoldAt)) / (1000 * 60)) : 0;

            // Update patient status back to IN_PROGRESS
            const updatedQueueEntry = await prisma.patientQueue.update({
                where: { id: queueEntryId },
                data: {
                    status: 'IN_PROGRESS',
                    resumedAt: new Date(),
                    actualHoldDuration: holdDuration,
                    updatedAt: new Date()
                },
                include: {
                    patient: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            });

            console.log(`▶️ Patient ${queueEntry.patient.firstName} ${queueEntry.patient.lastName} resumed after ${holdDuration} minutes`);

            // ✅ Emit WebSocket event for real-time updates
            const { emitPatientResumed } = require('../socket/channels/queueChannel');
            emitPatientResumed({
                queueEntryId: updatedQueueEntry.id,
                patientId: updatedQueueEntry.patientId,
                doctorId: updatedQueueEntry.assignedStaffId,
                patientName: `${queueEntry.patient.firstName} ${queueEntry.patient.lastName}`,
                firstName: queueEntry.patient.firstName,
                lastName: queueEntry.patient.lastName,
                status: updatedQueueEntry.status,
                resumedAt: updatedQueueEntry.resumedAt,
                actualHoldDuration: holdDuration,
                reasons: updatedQueueEntry.eyeDropReasons || []
            });

            return {
                queueEntryId: updatedQueueEntry.id,
                status: updatedQueueEntry.status,
                actualHoldDuration: holdDuration,
                resumedAt: updatedQueueEntry.resumedAt,
                patientName: `${queueEntry.patient.firstName} ${queueEntry.patient.lastName}`
            };

        } catch (error) {
            console.error('❌ Error resuming patient from hold:', error);
            throw new Error(`Failed to resume patient from hold: ${error.message}`);
        }
    }

    /**
     * Complete consultation for a patient
     * @param {string} queueEntryId - The queue entry ID
     * @param {string} ophthalmologistId - The ophthalmologist staff ID
     * @returns {Promise<Object>} Completed consultation result
     */
    async completeConsultation(queueEntryId, ophthalmologistId) {
        try {
            const result = await prisma.$transaction(async (tx) => {
                // Get current queue entry
                const queueEntry = await tx.patientQueue.findUnique({
                    where: { id: queueEntryId },
                    include: {
                        patient: {
                            select: {
                                patientNumber: true,
                                firstName: true,
                                lastName: true
                            }
                        },
                        patientVisit: {
                            include: {
                                ophthalmologistExaminations: {
                                    include: {
                                        doctor: {
                                            select: {
                                                id: true,
                                                firstName: true,
                                                lastName: true,
                                                doctorProfile: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                });

                if (!queueEntry) {
                    throw new Error('Queue entry not found');
                }

                console.log(`🔍 Attempting to complete consultation - Current status: ${queueEntry.status}, Patient: ${queueEntry.patient?.firstName}`);
                
                if (queueEntry.status !== 'IN_PROGRESS') {
                    throw new Error(`Can only complete consultations that are in progress. Current status: ${queueEntry.status}`);
                }

                const currentQueueFor = queueEntry.queueFor;
                const currentQueueNumber = queueEntry.queueNumber;
                const currentDoctorQueuePosition = queueEntry.doctorQueuePosition;
                const assignedDoctorId = queueEntry.assignedStaffId;

                // Complete the consultation - Set positions to -1
                const completedEntry = await tx.patientQueue.update({
                    where: { id: queueEntryId },
                    data: {
                        status: 'COMPLETED',
                        completedAt: new Date(),
                        queueNumber: -1,  // Set to -1 for completed patients
                        doctorQueuePosition: -1  // Set to -1 for completed patients
                    }
                });

                // Calculate billing amounts
                let totalActualCost = 0;
                let totalEstimatedCost = 0;

                if (queueEntry.patientVisit) {
                    const patientVisit = queueEntry.patientVisit;
                    
                    // Get the doctor who performed the examination
                    const examination = patientVisit.ophthalmologistExaminations?.[0];
                    
                    if (examination && examination.doctor) {
                        const doctorProfile = examination.doctor.doctorProfile;
                        
                        if (doctorProfile) {
                            // Check if this is a follow-up visit
                            const isFollowUp = patientVisit.isFollowUp || patientVisit.visitType === 'FOLLOWUP';
                            
                            if (isFollowUp && doctorProfile.followUpFee) {
                                totalActualCost = parseFloat(doctorProfile.followUpFee);
                                totalEstimatedCost = parseFloat(doctorProfile.followUpFee);
                                console.log(`💰 Follow-up consultation fee: ₹${totalActualCost}`);
                            } else if (doctorProfile.consultationFee) {
                                totalActualCost = parseFloat(doctorProfile.consultationFee);
                                totalEstimatedCost = parseFloat(doctorProfile.consultationFee);
                                console.log(`💰 Regular consultation fee: ₹${totalActualCost}`);
                            }
                        }
                    }
                }

                // Adjust remaining queue numbers (general queue)
                const adjustedCount = await this.adjustQueueNumbers(tx, currentQueueFor, currentQueueNumber);

                // Adjust doctor-specific queue positions
                let adjustedDoctorQueueCount = 0;
                if (assignedDoctorId && currentDoctorQueuePosition) {
                    const doctorQueueAdjusted = await tx.patientQueue.updateMany({
                        where: {
                            assignedStaffId: assignedDoctorId,
                            doctorQueuePosition: {
                                gt: currentDoctorQueuePosition
                            },
                            status: {
                                in: ['WAITING', 'CALLED', 'IN_PROGRESS']
                            }
                        },
                        data: {
                            doctorQueuePosition: {
                                decrement: 1
                            }
                        }
                    });
                    adjustedDoctorQueueCount = doctorQueueAdjusted.count;
                    console.log(`📊 Adjusted ${adjustedDoctorQueueCount} patients' doctorQueuePosition for doctor ${assignedDoctorId}`);
                }

                // Update patient visit status with billing amounts
                if (queueEntry.patientVisitId) {
                    const updatedVisit = await tx.patientVisit.update({
                        where: { id: queueEntry.patientVisitId },
                        data: {
                            status: 'COMPLETED',
                            doctorSeenAt: new Date(),
                            completedAt: new Date(),
                            totalActualCost: totalActualCost,
                            totalEstimatedCost: totalEstimatedCost,
                            billingInitiatedAt: new Date()
                        },
                        select: {
                            appointmentId: true
                        }
                    });

                    // Update appointment status to COMPLETED and deactivate
                    if (updatedVisit.appointmentId) {
                        await tx.appointment.update({
                            where: { id: updatedVisit.appointmentId },
                            data: {
                                status: 'COMPLETED',
                                isActive: false
                            }
                        });
                        console.log(`📅 Appointment ${updatedVisit.appointmentId} marked as COMPLETED (isActive: false)`);
                    }

                    console.log(`💳 Billing amounts set for visit ${queueEntry.patientVisitId}: Actual=₹${totalActualCost}, Estimated=₹${totalEstimatedCost}`);
                }

                return {
                    success: true,
                    message: 'Consultation completed successfully',
                    data: completedEntry,
                    adjustedPatientsCount: adjustedCount,
                    adjustedDoctorQueueCount: adjustedDoctorQueueCount,
                    patient: queueEntry.patient || queueEntry.patientVisit?.patient,
                    billing: {
                        totalActualCost,
                        totalEstimatedCost
                    }
                };
            });

            console.log(`✅ Completed consultation for patient: ${result.patient?.firstName || 'Unknown'} ${result.patient?.lastName || 'Patient'}`);

            return result;

        } catch (error) {
            console.error('❌ Error completing consultation:', error);
            throw new Error(`Failed to complete consultation: ${error.message}`);
        }
    }

    /**
     * Reorder patients in the ophthalmologist queue
     * @param {Array} reorderedQueueEntries - Array of queue entries with new positions
     * @param {string} reason - Reason for reordering
     * @returns {Promise<Object>} Reorder result
     */
    async reorderQueue(draggedPatientId, targetPosition, reason = 'Queue reordered via drag and drop') {
        try {
            console.log(`🔄 Comprehensive queue reordering: Moving patient ${draggedPatientId} to position ${targetPosition}`);

            const result = await prisma.$transaction(async (tx) => {
                // Get all patients in the ophthalmologist queue, ordered by current queue number
                const allPatients = await tx.patientQueue.findMany({
                    where: {
                        queueFor: 'OPHTHALMOLOGIST',
                        status: {
                            in: ['WAITING', 'CALLED', 'IN_PROGRESS', 'ON_HOLD']
                        }
                    },
                    include: {
                        patientVisit: {
                            include: {
                                patient: {
                                    select: {
                                        id: true,
                                        patientNumber: true,
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        },
                        assignedStaff: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    orderBy: {
                        queueNumber: 'asc'
                    }
                });

                // Find the dragged patient
                const draggedPatient = allPatients.find(p => p.id === draggedPatientId);
                if (!draggedPatient) {
                    throw new Error('Dragged patient not found in queue');
                }

                // Can only move WAITING patients
                if (draggedPatient.status !== 'WAITING') {
                    throw new Error('Only waiting patients can be reordered');
                }

                // Validate target position  
                console.log(`📊 Position validation: targetPosition=${targetPosition}, totalPatients=${allPatients.length}`);
                if (targetPosition < 1 || targetPosition > allPatients.length) {
                    console.error(`❌ Invalid target position: ${targetPosition}. Must be between 1 and ${allPatients.length}`);
                    throw new Error(`Invalid target position: ${targetPosition}. Must be between 1 and ${allPatients.length}`);
                }

                // Create new queue order
                const newQueue = [...allPatients];

                // Remove dragged patient from current position
                const draggedIndex = newQueue.findIndex(p => p.id === draggedPatientId);
                const [movedPatient] = newQueue.splice(draggedIndex, 1);

                // Insert at target position (convert to 0-based index)
                const targetIndex = targetPosition - 1;
                newQueue.splice(targetIndex, 0, movedPatient);

                // Handle shifting logic for patients that need to move
                const updates = [];
                const shiftedPatients = [];

                // Process each patient in the new order
                for (let i = 0; i < newQueue.length; i++) {
                    const patient = newQueue[i];
                    const newQueueNumber = i + 1;
                    const oldQueueNumber = patient.queueNumber;

                    // Only update if queue number changed
                    if (newQueueNumber !== oldQueueNumber) {
                        // For non-waiting patients, we need special handling
                        if (patient.status !== 'WAITING') {
                            // If IN_PROGRESS/ON_HOLD patient needs to shift, 
                            // we need to find an alternative position
                            if (patient.id !== draggedPatientId) {
                                // Find next available position for this active patient
                                let alternativePosition = newQueueNumber;
                                while (alternativePosition <= newQueue.length) {
                                    const conflictPatient = newQueue.find(p =>
                                        p.queueNumber === alternativePosition &&
                                        p.id !== patient.id &&
                                        p.status === 'WAITING'
                                    );
                                    if (!conflictPatient) break;
                                    alternativePosition++;
                                }

                                // Update the active patient's position
                                const updatedPatient = await tx.patientQueue.update({
                                    where: { id: patient.id },
                                    data: {
                                        queueNumber: alternativePosition,
                                        notes: `${reason} - Active patient repositioned from ${oldQueueNumber} to ${alternativePosition}`,
                                        updatedAt: new Date()
                                    }
                                });

                                updates.push({
                                    queueEntryId: patient.id,
                                    oldQueueNumber,
                                    newQueueNumber: alternativePosition,
                                    patientName: `${patient.patientVisit.patient.firstName} ${patient.patientVisit.patient.lastName}`,
                                    patientNumber: patient.patientVisit.patient.patientNumber,
                                    status: patient.status,
                                    action: 'repositioned_active'
                                });

                                continue;
                            }
                        }

                        // Update patient position
                        const updatedPatient = await tx.patientQueue.update({
                            where: { id: patient.id },
                            data: {
                                queueNumber: newQueueNumber,
                                notes: patient.id === draggedPatientId
                                    ? `${reason} - Moved to position ${newQueueNumber}`
                                    : `${reason} - Shifted from ${oldQueueNumber} to ${newQueueNumber}`,
                                updatedAt: new Date()
                            }
                        });

                        updates.push({
                            queueEntryId: patient.id,
                            oldQueueNumber,
                            newQueueNumber,
                            patientName: `${patient.patientVisit.patient.firstName} ${patient.patientVisit.patient.lastName}`,
                            patientNumber: patient.patientVisit.patient.patientNumber,
                            status: patient.status,
                            action: patient.id === draggedPatientId ? 'moved' : 'shifted',
                            assignedStaff: patient.assignedStaff ?
                                `${patient.assignedStaff.firstName} ${patient.assignedStaff.lastName}` : null
                        });

                        if (patient.id !== draggedPatientId) {
                            shiftedPatients.push({
                                id: patient.id,
                                name: `${patient.patientVisit.patient.firstName} ${patient.patientVisit.patient.lastName}`,
                                from: oldQueueNumber,
                                to: newQueueNumber
                            });
                        }
                    }
                }

                // After all updates, ensure no gaps in queue numbers
                await this.normalizeQueueNumbers(tx);

                return {
                    draggedPatient: {
                        id: draggedPatient.id,
                        name: `${draggedPatient.patientVisit.patient.firstName} ${draggedPatient.patientVisit.patient.lastName}`,
                        fromPosition: draggedPatient.queueNumber,
                        toPosition: targetPosition
                    },
                    shiftedPatients,
                    totalUpdates: updates.length,
                    updates,
                    reason
                };
            });

            console.log(`✅ Comprehensive queue reordering completed: ${result.totalUpdates} patients updated`);
            return result;

        } catch (error) {
            console.error('❌ Error in comprehensive queue reordering:', error);
            throw new Error(`Failed to reorder queue: ${error.message}`);
        }
    }

    /**
     * Normalize queue numbers to ensure no gaps
     * @param {Object} tx - Prisma transaction object
     */
    async normalizeQueueNumbers(tx) {
        const allPatients = await tx.patientQueue.findMany({
            where: {
                queueFor: 'OPHTHALMOLOGIST',
                status: {
                    in: ['WAITING', 'CALLED', 'IN_PROGRESS', 'ON_HOLD']
                }
            },
            orderBy: {
                queueNumber: 'asc'
            }
        });

        // Renumber sequentially
        for (let i = 0; i < allPatients.length; i++) {
            const patient = allPatients[i];
            const correctQueueNumber = i + 1;

            if (patient.queueNumber !== correctQueueNumber) {
                await tx.patientQueue.update({
                    where: { id: patient.id },
                    data: { queueNumber: correctQueueNumber }
                });
            }
        }
    }

    /**
     * Legacy reorder method - kept for backward compatibility
     * @param {Array} reorderedQueueEntries - Array of queue entries with new positions
     * @param {string} reason - Reason for reordering
     * @returns {Promise<Object>} Reorder result
     */
    async legacyReorderQueue(reorderedQueueEntries, reason = 'Direct queue reorder via drag and drop') {
        try {
            console.log(`🔄 Legacy reordering ophthalmologist queue with ${reorderedQueueEntries.length} entries`);

            const updatedEntries = await prisma.$transaction(async (tx) => {
                const updates = [];

                for (const entry of reorderedQueueEntries) {
                    const { queueEntryId, newQueueNumber, currentQueueNumber } = entry;

                    console.log(`🔄 Updating queue entry ${queueEntryId}: ${currentQueueNumber} → ${newQueueNumber}`);

                    // Update the queue entry with new position
                    const updatedEntry = await tx.patientQueue.update({
                        where: {
                            id: queueEntryId,
                            queueFor: 'OPHTHALMOLOGIST',
                            status: 'WAITING' // Only allow reordering of waiting patients
                        },
                        data: {
                            queueNumber: newQueueNumber,
                            notes: reason ? `${reason} - Position changed from ${currentQueueNumber} to ${newQueueNumber}` : null,
                            updatedAt: new Date()
                        },
                        include: {
                            patientVisit: {
                                include: {
                                    patient: {
                                        select: {
                                            id: true,
                                            patientNumber: true,
                                            firstName: true,
                                            lastName: true
                                        }
                                    }
                                }
                            }
                        }
                    });

                    updates.push({
                        queueEntryId,
                        newQueueNumber,
                        oldQueueNumber: currentQueueNumber,
                        patientName: `${updatedEntry.patientVisit.patient.firstName} ${updatedEntry.patientVisit.patient.lastName}`,
                        patientNumber: updatedEntry.patientVisit.patient.patientNumber
                    });
                }

                return updates;
            });

            console.log(`✅ Successfully reordered ${updatedEntries.length} patients in ophthalmologist queue`);

            return {
                message: 'Queue reordered successfully',
                updatedEntries,
                reason,
                reorderedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error reordering ophthalmologist queue:', error);
            throw new Error(`Failed to reorder queue: ${error.message}`);
        }
    }

    /**
     * Get current patient being consulted by ophthalmologist
     * @param {string} ophthalmologistId - Ophthalmologist staff ID
     * @returns {Promise<Object|null>} Current patient or null
     */
    async getCurrentPatient(ophthalmologistId) {
        try {
            const currentPatient = await prisma.patientQueue.findFirst({
                where: {
                    queueFor: 'OPHTHALMOLOGIST',
                    assignedStaffId: ophthalmologistId,
                    status: 'IN_PROGRESS'
                },
                include: {
                    patientVisit: {
                        include: {
                            patient: true,
                            appointment: true
                        }
                    }
                }
            });

            return currentPatient;

        } catch (error) {
            console.error('❌ Error getting current patient:', error);
            throw new Error(`Failed to get current patient: ${error.message}`);
        }
    }

    /**
     * Get dashboard statistics for ophthalmologist
     * @param {string} ophthalmologistId - Ophthalmologist staff ID
     * @returns {Promise<Object>} Dashboard statistics
     */
    async getDashboardStats(ophthalmologistId) {
        try {
            console.log('📊 Fetching dashboard stats for doctor:', ophthalmologistId);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

     

            const [
                patientsInQueue,
                totalPatientsInHospital,
                todayAppointments,
                completedAppointments,
                todayPatients,
                yesterdayPatients,
                todayCompletedConsultations,
                currentQueueLength,
                averageConsultationTime,
                todaySurgeriesScheduled,
                todayEmergencies,
                waitingPatients
            ] = await Promise.all([
                // Patients currently in Ophthalmologist Queue (WAITING or CALLED)
                prisma.patientQueue.count({
                    where: {
                        queueFor: 'OPHTHALMOLOGIST',
                        status: {
                            in: ['WAITING', 'CALLED', 'IN_PROGRESS']
                        }
                    }
                }),
                // Total patients in the hospital today (all queues)
                prisma.patientQueue.count({
                    where: {
                        joinedAt: {
                            gte: today,
                            lt: tomorrow
                        }
                    }
                }),
                // Today's total appointments - Count all appointments scheduled for today
                prisma.appointment.count({
                    where: {
                        appointmentDate: {
                            gte: today,
                            lt: tomorrow
                        }
                    }
                }),
                // Today's completed appointments - Count all completed appointments for today
                prisma.appointment.count({
                    where: {
                        appointmentDate: {
                            gte: today,
                            lt: tomorrow
                        },
                        status: 'COMPLETED'
                    }
                }),
                // Today's total patients assigned to this doctor
                prisma.patientQueue.count({
                    where: {
                        queueFor: 'OPHTHALMOLOGIST',
                        assignedStaffId: ophthalmologistId,
                        joinedAt: {
                            gte: today,
                            lt: tomorrow
                        }
                    }
                }),
                // Yesterday's patients for comparison
                prisma.patientQueue.count({
                    where: {
                        queueFor: 'OPHTHALMOLOGIST',
                        assignedStaffId: ophthalmologistId,
                        joinedAt: {
                            gte: yesterday,
                            lt: today
                        }
                    }
                }),
                // Today's completed consultations
                prisma.patientQueue.count({
                    where: {
                        queueFor: 'OPHTHALMOLOGIST',
                        assignedStaffId: ophthalmologistId,
                        status: 'COMPLETED',
                        completedAt: {
                            gte: today,
                            lt: tomorrow
                        }
                    }
                }),
                // Current queue waiting
                prisma.patientQueue.count({
                    where: {
                        queueFor: 'OPHTHALMOLOGIST',
                        assignedStaffId: ophthalmologistId,
                        status: {
                            in: ['WAITING', 'CALLED']
                        }
                    }
                }),
                this.getAverageConsultationTime(ophthalmologistId),
                // Today's surgeries SCHEDULED (not completed) for this doctor
                prisma.ipdAdmission.count({
                    where: {
                        surgeonId: ophthalmologistId,
                        surgeryDate: {
                            gte: today,
                            lt: tomorrow
                        }
                    }
                }),
                // Today's emergency cases
                prisma.patientQueue.count({
                    where: {
                        queueFor: 'OPHTHALMOLOGIST',
                        assignedStaffId: ophthalmologistId,
                        priorityLabel: 'EMERGENCY',
                        joinedAt: {
                            gte: today,
                            lt: tomorrow
                        }
                    }
                }),
                // Get waiting patients for average wait time calculation
                prisma.patientQueue.findMany({
                    where: {
                        queueFor: 'OPHTHALMOLOGIST',
                        assignedStaffId: ophthalmologistId,
                        status: 'WAITING'
                    },
                    select: {
                        joinedAt: true
                    }
                })
            ]);

            const patientsDifference = todayPatients - yesterdayPatients;

            // Calculate average wait time for waiting patients
            let averageWaitTime = '0 min';
            if (waitingPatients.length > 0) {
                const now = new Date();
                const totalWaitMinutes = waitingPatients.reduce((sum, patient) => {
                    const waitMs = now - new Date(patient.joinedAt);
                    const waitMins = Math.floor(waitMs / (1000 * 60));
                    return sum + waitMins;
                }, 0);
                const avgWaitMins = Math.round(totalWaitMinutes / waitingPatients.length);
                averageWaitTime = this.formatMinutesToHumanReadable(avgWaitMins);
            }

            const stats = {
                // New primary stats for dashboard cards
                patientsInQueue,
                totalPatientsInHospital,
                todayAppointments,
                completedAppointments,
                averageWaitTime,
                // Existing stats
                todayPatients,
                patientsDifference,
                todayCompletedConsultations,
                currentQueueLength,
                averageConsultationTime,
                todaySurgeriesScheduled,
                todayEmergencies,
                efficiency: todayPatients > 0 
                    ? Math.round((todayCompletedConsultations / todayPatients) * 100) 
                    : 0
            };

            console.log('✅ Dashboard stats retrieved:', stats);

            return stats;

        } catch (error) {
            console.error('❌ Error getting dashboard stats:', error);
            throw new Error(`Failed to get dashboard statistics: ${error.message}`);
        }
    }

    // Helper methods
    formatMinutesToHumanReadable(minutes) {
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) {
            return `${hours} hr`;
        }
        return `${hours} hr ${mins} min`;
    }

    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return 0;

        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    calculateWaitTime(joinedAt) {
        const now = new Date();
        const joined = new Date(joinedAt);
        const diffMs = now - joined;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return this.formatMinutesToHumanReadable(diffMins);
    }

    calculateAverageWaitTime(queueData) {
        if (queueData.length === 0) return '0 min';

        const totalWaitMins = queueData.reduce((sum, patient) => {
            const waitMins = parseInt(patient.waitTime.replace(/ min| hr/g, '').split(' ').reduce((a, b) => a + parseInt(b) || 0, 0));
            return sum + waitMins;
        }, 0);

        const avgMins = Math.round(totalWaitMins / queueData.length);
        return this.formatMinutesToHumanReadable(avgMins);
    }

    async getAverageConsultationTime(ophthalmologistId) {
        const completedConsultations = await prisma.patientQueue.findMany({
            where: {
                queueFor: 'OPHTHALMOLOGIST',
                assignedStaffId: ophthalmologistId,
                status: 'COMPLETED',
                inProgressAt: { not: null },
                completedAt: { not: null }
            },
            select: {
                inProgressAt: true,
                completedAt: true
            },
            take: 50 // Last 50 consultations
        });

        if (completedConsultations.length === 0) return '0 min';

        const totalMinutes = completedConsultations.reduce((sum, consultation) => {
            const duration = new Date(consultation.completedAt) - new Date(consultation.inProgressAt);
            return sum + Math.floor(duration / (1000 * 60));
        }, 0);

        const avgMinutes = Math.round(totalMinutes / completedConsultations.length);
        return this.formatMinutesToHumanReadable(avgMinutes);
    }

    /**
     * Get doctor's ON_HOLD patients
     * @param {string} ophthalmologistId - Ophthalmologist staff ID
     * @returns {Promise<Object>} ON_HOLD patients data
     */
    async getMyOnHoldPatients(ophthalmologistId) {
        try {
            console.log('⏸️ Fetching ON_HOLD patients for ophthalmologist:', ophthalmologistId);

            // Get today's date range (start and end of day)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const onHoldPatients = await prisma.patientQueue.findMany({
                where: {
                    queueFor: 'OPHTHALMOLOGIST',
                    assignedStaffId: ophthalmologistId,
                    status: 'ON_HOLD',
                    // Only show patients put on hold today
                    onHoldAt: {
                        gte: today,
                        lt: tomorrow
                    }
                },
                include: {
                    patient: {
                        select: {
                            id: true,
                            patientNumber: true,
                            firstName: true,
                            lastName: true,
                            dateOfBirth: true,
                            gender: true,
                            phone: true,
                            email: true
                        }
                    },
                    patientVisit: {
                        select: {
                            id: true,
                            visitType: true,
                            visitDate: true,
                            priorityLevel: true,
                            receptionist2Notes: true,
                            patient: {
                                select: {
                                    id: true,
                                    patientNumber: true,
                                    firstName: true,
                                    lastName: true,
                                    dateOfBirth: true,
                                    gender: true
                                }
                            }
                        }
                    },
                    assignedStaff: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            staffType: true
                        }
                    }
                },
                orderBy: [
                    { onHoldAt: 'asc' } // Oldest first
                ]
            });

            const patientsData = onHoldPatients.map(entry => {
                const patient = entry.patient || entry.patientVisit?.patient;
                const patientVisit = entry.patientVisit;

                // Calculate timing information
                const onHoldSince = entry.onHoldAt ?
                    Math.floor((new Date() - new Date(entry.onHoldAt)) / (1000 * 60)) : 0;

                const hasTimer = !!entry.estimatedResumeTime;
                const now = new Date();
                const estimatedResume = entry.estimatedResumeTime ? new Date(entry.estimatedResumeTime) : null;
                
                // Calculate remaining time in seconds for accurate countdown
                const timeRemainingMs = hasTimer ? Math.max(0, estimatedResume - now) : null;
                const timeRemainingSeconds = timeRemainingMs ? Math.floor(timeRemainingMs / 1000) : null;
                const timeRemainingMinutes = timeRemainingMs ? Math.floor(timeRemainingMs / (1000 * 60)) : null;

                const isTimerExpired = hasTimer && timeRemainingMs <= 0;
                const isReadyToResume = hasTimer && timeRemainingMs <= 0;

                return {
                    id: entry.id,
                    queueEntryId: entry.id,
                    queueNumber: entry.queueNumber,
                    status: entry.status,
                    priorityLabel: entry.priorityLabel,
                    queueFor: entry.queueFor,
                    token: `OPH-${entry.queueNumber}`,
                    onHoldAt: entry.onHoldAt,
                    inProgressAt: entry.inProgressAt, // Added for timer
                    estimatedResumeTime: entry.estimatedResumeTime,
                    holdReason: entry.holdReason,

                    // Patient details
                    name: `${patient.firstName} ${patient.lastName}`,
                    fullName: `${patient.firstName} ${patient.lastName}`,
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    age: this.calculateAge(patient.dateOfBirth),
                    gender: patient.gender,
                    patientNumber: patient.patientNumber,
                    phone: patient.phone,
                    email: patient.email,
                    visitType: patientVisit?.visitType || 'consultation',
                    visitDate: patientVisit?.visitDate,
                    priority: patientVisit?.priorityLevel || 'NORMAL',
                    notes: entry.notes || patientVisit?.receptionist2Notes,
                    visitData: patientVisit,

                    // Timing and status information
                    timing: {
                        onHoldSinceMinutes: onHoldSince,
                        hasTimer,
                        timeRemainingMinutes: timeRemainingMinutes,
                        timeRemainingSeconds: timeRemainingSeconds, // ✅ For real-time countdown
                        isTimerExpired: isTimerExpired, // ✅ Explicit flag for expired timer
                        isReadyToResume,
                        dropsApplied: hasTimer,
                        needsDrops: !hasTimer,
                        waitTime: `${onHoldSince} min on hold`,
                        dilationDuration: entry.estimatedWaitTime || 10, // Duration in minutes
                        dilationRound: entry.dilationRound || 0, // Current round (0 = not started, 1-3 = rounds)
                        roundDisplay: `${Math.max(entry.dilationRound || 0, 1)}/3`, // ✅ Display format: "1/3", "2/3", "3/3"
                        canRepeat: (entry.dilationRound || 0) < 3, // Can repeat if less than 3 rounds
                        showActions: hasTimer && isTimerExpired, // Show Repeat/Ready buttons when timer expires
                        markedReady: entry.markedReadyForResume || false // ✅ Flag to indicate manually marked ready
                    },
                    estimatedResumeTime: entry.estimatedResumeTime, // ✅ Send at root level too
                    customWaitMinutes: entry.customWaitMinutes, // ✅ Custom timer duration

                    assignedStaff: entry.assignedStaff ? {
                        id: entry.assignedStaff.id,
                        name: `${entry.assignedStaff.firstName} ${entry.assignedStaff.lastName}`,
                        firstName: entry.assignedStaff.firstName,
                        lastName: entry.assignedStaff.lastName,
                        staffType: entry.assignedStaff.staffType
                    } : null
                };
            });

            const statistics = {
                totalOnHold: patientsData.length,
                needingDrops: patientsData.filter(p => p.timing.needsDrops).length,
                waitingForDilation: patientsData.filter(p => p.timing.dropsApplied && !p.timing.isReadyToResume).length,
                readyToResume: patientsData.filter(p => p.timing.isReadyToResume).length
            };

            console.log(`✅ Retrieved ${patientsData.length} ON_HOLD patients for ophthalmologist`);
            console.log(`📊 Breakdown: ${statistics.needingDrops} need drops, ${statistics.waitingForDilation} waiting, ${statistics.readyToResume} ready`);

            return {
                queueEntries: patientsData,
                statistics,
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error fetching ON_HOLD patients:', error);
            throw new Error(`Failed to fetch ON_HOLD patients: ${error.message}`);
        }
    }

    /**
     * Get patients assigned to a specific ophthalmologist
     * @param {string} ophthalmologistId - Ophthalmologist staff ID
     * @returns {Promise<Object>} Assigned patients data
     */
    async getMyAssignedPatients(ophthalmologistId) {
        try {
            console.log('🔍 Fetching assigned patients for ophthalmologist:', ophthalmologistId);

            const assignedPatients = await prisma.patientQueue.findMany({
                where: {
                    queueFor: 'OPHTHALMOLOGIST',
                    assignedStaffId: ophthalmologistId,
                    status: {
                        in: ['WAITING', 'CALLED', 'IN_PROGRESS']
                    }
                },
                include: {
                    patient: {
                        select: {
                            id: true,
                            patientNumber: true,
                            firstName: true,
                            lastName: true,
                            dateOfBirth: true,
                            gender: true,
                            phone: true,
                            email: true
                        }
                    },
                    patientVisit: {
                        select: {
                            id: true,
                            visitType: true,
                            visitDate: true,
                            priorityLevel: true,
                            receptionist2Notes: true,
                            patient: {
                                select: {
                                    id: true,
                                    patientNumber: true,
                                    firstName: true,
                                    lastName: true,
                                    dateOfBirth: true,
                                    gender: true
                                }
                            }
                        }
                    },
                    assignedStaff: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            staffType: true
                        }
                    }
                },
                orderBy: [
                    { queueNumber: 'asc' }
                ]
            });

            const patientsData = assignedPatients.map(entry => {
                const patient = entry.patient || entry.patientVisit?.patient;
                const patientVisit = entry.patientVisit;

                return {
                    id: entry.id,
                    queueEntryId: entry.id,
                    queueNumber: entry.queueNumber,
                    status: entry.status,
                    priorityLabel: entry.priorityLabel,
                    queueFor: entry.queueFor,
                    token: `OPH-${entry.queueNumber}`,
                    waitTime: this.calculateWaitTime(entry.createdAt),
                    joinedAt: entry.createdAt,
                    calledAt: entry.calledAt,
                    name: `${patient.firstName} ${patient.lastName}`,
                    fullName: `${patient.firstName} ${patient.lastName}`,
                    firstName: patient.firstName,
                    lastName: patient.lastName,
                    age: this.calculateAge(patient.dateOfBirth),
                    gender: patient.gender,
                    patientNumber: patient.patientNumber,
                    phone: patient.phone,
                    email: patient.email,
                    visitType: patientVisit?.visitType || 'consultation',
                    visitDate: patientVisit?.visitDate,
                    priority: patientVisit?.priorityLevel || 'NORMAL',
                    notes: entry.notes || patientVisit?.receptionist2Notes,
                    visitData: patientVisit,
                    assignedStaff: entry.assignedStaff ? {
                        id: entry.assignedStaff.id,
                        name: `${entry.assignedStaff.firstName} ${entry.assignedStaff.lastName}`,
                        firstName: entry.assignedStaff.firstName,
                        lastName: entry.assignedStaff.lastName,
                        staffType: entry.assignedStaff.staffType
                    } : null
                };
            });

            const statistics = {
                totalAssigned: patientsData.length,
                waitingPatients: patientsData.filter(p => p.status === 'WAITING').length,
                calledPatients: patientsData.filter(p => p.status === 'CALLED').length,
                inProgressPatients: patientsData.filter(p => p.status === 'IN_PROGRESS').length,
                averageWaitTime: this.calculateAverageWaitTime(patientsData)
            };

            console.log(`✅ Retrieved ${patientsData.length} assigned patients for ophthalmologist`);

            return {
                queueEntries: patientsData,
                statistics,
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error fetching assigned patients:', error);
            throw new Error(`Failed to fetch assigned patients: ${error.message}`);
        }
    }

    async adjustQueueNumbers(tx, queueFor, removedQueueNumber) {
        const result = await tx.patientQueue.updateMany({
            where: {
                queueFor,
                queueNumber: {
                    gt: removedQueueNumber
                },
                status: {
                    in: ['WAITING', 'CALLED']
                }
            },
            data: {
                queueNumber: {
                    decrement: 1
                }
            }
        });

        return result.count;
    }

    /**
     * Assign a doctor to a patient in the queue
     * @param {string} queueEntryId - Queue entry ID
     * @param {string} doctorId - Doctor's staff ID
     * @returns {Promise<Object>} Assignment result
     */
    async assignDoctorToPatient(queueEntryId, doctorId) {
        try {
            console.log(`👨‍⚕️ Assigning doctor ${doctorId} to queue entry ${queueEntryId}`);

            const result = await prisma.$transaction(async (tx) => {
                // First, verify the queue entry exists
                const queueEntry = await tx.patientQueue.findUnique({
                    where: { id: queueEntryId },
                    include: {
                        patientVisit: {
                            include: {
                                patient: {
                                    select: {
                                        id: true,
                                        patientNumber: true,
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        },
                        assignedStaff: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                });

                if (!queueEntry) {
                    throw new Error('Queue entry not found');
                }

                // Verify the doctor exists and is active (try multiple variations)
                let doctor = await tx.staff.findFirst({
                    where: {
                        id: doctorId,
                        staffType: 'DOCTOR',
                        isActive: true
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: true,
                        staffType: true,
                        isActive: true
                    }
                });

                // If not found with uppercase, try lowercase
                if (!doctor) {
                    doctor = await tx.staff.findFirst({
                        where: {
                            id: doctorId,
                            staffType: 'doctor',
                            isActive: true
                        },
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            department: true,
                            staffType: true,
                            isActive: true
                        }
                    });
                }

                // If still not found, try without isActive requirement
                if (!doctor) {
                    doctor = await tx.staff.findFirst({
                        where: {
                            id: doctorId,
                            OR: [
                                { staffType: 'DOCTOR' },
                                { staffType: 'doctor' }
                            ]
                        },
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            department: true,
                            staffType: true,
                            isActive: true
                        }
                    });
                }

                console.log(`🔍 Doctor lookup result for ID ${doctorId}:`, doctor);

                if (!doctor) {
                    // Get all staff to debug
                    const allStaff = await tx.staff.findMany({
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            staffType: true,
                            isActive: true
                        },
                        take: 5
                    });
                    console.log(`🔍 Sample staff records for debugging:`, allStaff);
                    throw new Error(`Doctor not found. ID: ${doctorId}`);
                }

                // Check if reassigning from another doctor
                const previousDoctorId = queueEntry.assignedStaffId;
                const previousPosition = queueEntry.doctorQueuePosition;

                if (previousDoctorId && previousDoctorId !== doctorId) {
                    console.log(`🔄 Reassigning patient from Dr. ${queueEntry.assignedStaff?.firstName || 'Unknown'} to new doctor`);
                    
                    // Shift down all patients in the previous doctor's queue who were after this patient
                    if (previousPosition) {
                        await tx.patientQueue.updateMany({
                            where: {
                                assignedStaffId: previousDoctorId,
                                doctorQueuePosition: { gt: previousPosition }
                            },
                            data: {
                                doctorQueuePosition: { decrement: 1 }
                            }
                        });
                        console.log(`✅ Shifted down patients in previous doctor's queue after position ${previousPosition}`);
                    }
                }

                // Calculate the next queue position for this doctor
                const existingQueueEntries = await tx.patientQueue.findMany({
                    where: {
                        assignedStaffId: doctorId,
                        doctorQueuePosition: { not: null }
                    },
                    select: {
                        doctorQueuePosition: true
                    }
                });

                // Find the maximum queue position and add 1
                const maxPosition = existingQueueEntries.reduce((max, entry) => {
                    return entry.doctorQueuePosition > max ? entry.doctorQueuePosition : max;
                }, 0);

                const nextQueuePosition = maxPosition + 1;

                console.log(`📍 Calculated queue position for doctor ${doctorId}: ${nextQueuePosition} (max was ${maxPosition})`);

                // Update the queue entry with the assigned doctor and queue position
                const updatedQueueEntry = await tx.patientQueue.update({
                    where: { id: queueEntryId },
                    data: {
                        assignedStaffId: doctorId,
                        doctorQueuePosition: nextQueuePosition,
                        updatedAt: new Date()
                    },
                    include: {
                        patientVisit: {
                            include: {
                                patient: {
                                    select: {
                                        id: true,
                                        patientNumber: true,
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        },
                        assignedStaff: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                department: true
                            }
                        }
                    }
                });

                console.log(`✅ Doctor ${doctor.firstName} ${doctor.lastName} assigned to patient ${queueEntry.patientVisit?.patient?.firstName} ${queueEntry.patientVisit?.patient?.lastName}`);

                return {
                    queueEntry: updatedQueueEntry,
                    assignedDoctor: doctor,
                    patient: queueEntry.patientVisit?.patient,
                    message: `Dr. ${doctor.firstName} ${doctor.lastName} assigned successfully`
                };
            });

            return result;

        } catch (error) {
            console.error('❌ Error assigning doctor to patient:', error);
            throw error;
        }
    }

    /**
     * Save detailed ophthalmologist examination data
     * @param {string} patientVisitId - Patient visit ID
     * @param {string} doctorId - Doctor's staff ID
     * @param {Object} examinationData - Detailed examination data
     * @returns {Promise<Object>} Saved examination data
     */
    async saveDetailedOphthalmologistExamination(patientVisitId, doctorId, examinationData) {
        try {
            console.log('💾 Saving detailed ophthalmologist examination:', {
                patientVisitId,
                doctorId,
                hasData: !!examinationData
            });

            const {
                // Visual Acuity fields
                visualAcuity,
                ucvaOD,
                ucvaOS,
                bcvaOD,
                bcvaOS,

                // Refraction fields
                refraction,
                refractionSphereOD,
                refractionCylinderOD,
                refractionAxisOD,
                refractionSphereOS,
                refractionCylinderOS,
                refractionAxisOS,

                // Tonometry fields
                tonometry,
                iopOD,
                iopOS,
                iopMethod,

                // Additional Tests fields
                additionalTests,
                colorVision,
                pupilReaction,
                eyeAlignment,
                anteriorSegment,

                // Clinical Details
                clinicalDetails,

                // Extra pressure tests
                extraPressureTests,

                // Existing fields
                clinicalNotes,
                diagnosis,
                slitLampFindings,
                fundoscopyFindings,
                visualFieldResults,
                octFindings,
                followUpRequired,
                followUpDate,
                urgencyLevel,
                surgeryRecommended,
                surgeryTypeId  // Changed from surgeryType to surgeryTypeId
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
                // Visual Acuity
                visualAcuity: visualAcuity ? JSON.stringify(visualAcuity) : null,
                ucvaOD: ucvaOD || null,
                ucvaOS: ucvaOS || null,
                bcvaOD: bcvaOD || null,
                bcvaOS: bcvaOS || null,

                // Refraction
                refraction: refraction ? JSON.stringify(refraction) : null,
                refractionSphereOD: refractionSphereOD || null,
                refractionCylinderOD: refractionCylinderOD || null,
                refractionAxisOD: refractionAxisOD || null,
                refractionSphereOS: refractionSphereOS || null,
                refractionCylinderOS: refractionCylinderOS || null,
                refractionAxisOS: refractionAxisOS || null,

                // Tonometry
                tonometry: tonometry ? JSON.stringify(tonometry) : null,
                iopOD: iopOD || null,
                iopOS: iopOS || null,
                iopMethod: iopMethod || null,

                // Additional Tests
                additionalTests: additionalTests ? JSON.stringify(additionalTests) : null,
                colorVision: colorVision || null,
                pupilReaction: pupilReaction || null,
                eyeAlignment: eyeAlignment || null,
                anteriorSegment: anteriorSegment ? JSON.stringify(anteriorSegment) : null,

                // Clinical Details
                clinicalDetails: clinicalDetails ? JSON.stringify(clinicalDetails) : null,

                // Extra pressure tests
                extraPressureTests: extraPressureTests ? JSON.stringify(extraPressureTests) : null,

                // Existing fields
                clinicalImpressions: clinicalNotes || null,
                assessment: diagnosis ? JSON.stringify({ diagnosis }) : null,
                slitLampFindings: slitLampFindings ? JSON.stringify(slitLampFindings) : null,
                fundoscopyFindings: fundoscopyFindings ? JSON.stringify(fundoscopyFindings) : null,
                visualFieldResults: visualFieldResults ? JSON.stringify(visualFieldResults) : null,
                octFindings: octFindings ? JSON.stringify(octFindings) : null,
                surgeryRecommended: surgeryRecommended || false,
                surgeryTypeId: surgeryTypeId || null,  // Changed from surgeryType to surgeryTypeId
                urgencyLevel: urgencyLevel || 'ROUTINE',
                followUpRequired: followUpRequired || false,
                followUpDate: followUpDate ? new Date(followUpDate) : null,
                updatedAt: new Date()
            };

            if (existingExamination) {
                // Update existing examination
                examination = await prisma.ophthalmologistExamination.update({
                    where: { id: existingExamination.id },
                    data: examinationDataToSave,
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

                console.log('✅ Updated existing detailed ophthalmologist examination');
            } else {
                // Create new examination
                examination = await prisma.ophthalmologistExamination.create({
                    data: {
                        patientVisitId,
                        doctorId,
                        ...examinationDataToSave,
                        createdAt: new Date()
                    },
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

                console.log('✅ Created new detailed ophthalmologist examination');
            }

            // 🏥 AUTO-CREATE IPD ADMISSION IF SURGERY IS RECOMMENDED
            console.log('🔍 Checking surgery recommendation:', {
                surgeryRecommended,
                surgeryType,
                condition: !!surgeryRecommended
            });

            if (surgeryRecommended) {
                console.log('🔄 Surgery recommended - auto-creating IPD admission...');

                try {
                    // Check if patient already has active IPD admission
                    const patientId = examination.patientVisit.patient.id;
                    const existingAdmission = await prisma.ipdAdmission.findFirst({
                        where: {
                            patientId,
                            status: {
                                in: ['ADMITTED', 'SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT', 'SURGERY_DAY', 'POST_OP', 'RECOVERY']
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
                                admittedBy: doctorId,
                                admissionDate: new Date(),
                                surgeryType: surgeryType ? surgeryType.toUpperCase() : 'CATARACT',
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
                        console.log(`ℹ️  Patient already has active IPD admission: ${existingAdmission.admissionNumber}`);
                    }
                } catch (error) {
                    console.error('❌ Failed to auto-create IPD admission:', error);
                    // Don't throw error - just log it and continue with examination save
                }
            }

            // Parse JSON fields safely for response
            const parseJsonField = (field) => {
                try {
                    return field ? JSON.parse(field) : null;
                } catch (e) {
                    return null;
                }
            };

            return {
                id: examination.id,
                patientVisitId: examination.patientVisitId,
                patientName: `${examination.patientVisit.patient.firstName} ${examination.patientVisit.patient.lastName}`,
                patientNumber: examination.patientVisit.patient.patientNumber,

                // Visual Acuity
                visualAcuity: parseJsonField(examination.visualAcuity),
                ucvaOD: examination.ucvaOD,
                ucvaOS: examination.ucvaOS,
                bcvaOD: examination.bcvaOD,
                bcvaOS: examination.bcvaOS,

                // Refraction
                refraction: parseJsonField(examination.refraction),
                refractionSphereOD: examination.refractionSphereOD,
                refractionCylinderOD: examination.refractionCylinderOD,
                refractionAxisOD: examination.refractionAxisOD,
                refractionSphereOS: examination.refractionSphereOS,
                refractionCylinderOS: examination.refractionCylinderOS,
                refractionAxisOS: examination.refractionAxisOS,

                // Tonometry
                tonometry: parseJsonField(examination.tonometry),
                iopOD: examination.iopOD,
                iopOS: examination.iopOS,
                iopMethod: examination.iopMethod,

                // Additional Tests
                additionalTests: parseJsonField(examination.additionalTests),
                colorVision: examination.colorVision,
                pupilReaction: examination.pupilReaction,
                eyeAlignment: examination.eyeAlignment,
                anteriorSegment: parseJsonField(examination.anteriorSegment),

                // Clinical Details
                clinicalDetails: parseJsonField(examination.clinicalDetails),

                // Extra pressure tests
                extraPressureTests: parseJsonField(examination.extraPressureTests),

                // Existing fields
                clinicalNotes: examination.clinicalImpressions,
                diagnosis: parseJsonField(examination.assessment)?.diagnosis,
                slitLampFindings: parseJsonField(examination.slitLampFindings),
                fundoscopyFindings: parseJsonField(examination.fundoscopyFindings),
                visualFieldResults: parseJsonField(examination.visualFieldResults),
                octFindings: parseJsonField(examination.octFindings),
                followUpRequired: examination.followUpRequired,
                followUpDate: examination.followUpDate,
                surgeryRecommended: examination.surgeryRecommended,
                surgeryType: examination.surgeryType,
                urgencyLevel: examination.urgencyLevel,
                createdAt: examination.createdAt,
                updatedAt: examination.updatedAt
            };

        } catch (error) {
            console.error('❌ Error saving detailed ophthalmologist examination:', error);
            throw new Error(`Failed to save detailed examination: ${error.message}`);
        }
    }

    /**
     * Get detailed ophthalmologist examination data
     * @param {string} patientVisitId - Patient visit ID
     * @param {string} doctorId - Doctor's staff ID
     * @returns {Promise<Object|null>} Detailed examination data or null
     */
    async getDetailedOphthalmologistExamination(patientVisitId, doctorId) {
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
                    patientVisit: {
                        include: {
                            patient: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    patientNumber: true,
                                    dateOfBirth: true
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
                    }
                }
            });

            if (!examination) {
                console.log('📋 No detailed examination found for this patient visit');
                return null;
            }

            // Parse JSON fields safely
            const parseJsonField = (field) => {
                try {
                    return field ? JSON.parse(field) : null;
                } catch (e) {
                    console.warn('Failed to parse JSON field:', field);
                    return null;
                }
            };

            const result = {
                id: examination.id,
                patientVisitId: examination.patientVisitId,
                patientName: `${examination.patientVisit.patient.firstName} ${examination.patientVisit.patient.lastName}`,
                patientNumber: examination.patientVisit.patient.patientNumber,
                patientAge: this.calculateAge(examination.patientVisit.patient.dateOfBirth),
                token: examination.patientVisit.appointment?.tokenNumber,

                // Visual Acuity
                visualAcuity: parseJsonField(examination.visualAcuity) || {},
                ucvaOD: examination.ucvaOD || '',
                ucvaOS: examination.ucvaOS || '',
                bcvaOD: examination.bcvaOD || '',
                bcvaOS: examination.bcvaOS || '',

                // Refraction
                refraction: parseJsonField(examination.refraction) || {},
                refractionSphereOD: examination.refractionSphereOD || null,
                refractionCylinderOD: examination.refractionCylinderOD || null,
                refractionAxisOD: examination.refractionAxisOD || null,
                refractionSphereOS: examination.refractionSphereOS || null,
                refractionCylinderOS: examination.refractionCylinderOS || null,
                refractionAxisOS: examination.refractionAxisOS || null,

                // Tonometry
                tonometry: parseJsonField(examination.tonometry) || {},
                iopOD: examination.iopOD || null,
                iopOS: examination.iopOS || null,
                iopMethod: examination.iopMethod || '',

                // Additional Tests
                additionalTests: parseJsonField(examination.additionalTests) || {},
                colorVision: examination.colorVision || '',
                pupilReaction: examination.pupilReaction || '',
                eyeAlignment: examination.eyeAlignment || '',
                anteriorSegment: parseJsonField(examination.anteriorSegment) || {},

                // Clinical Details
                clinicalDetails: parseJsonField(examination.clinicalDetails) || {},

                // Extra pressure tests
                extraPressureTests: parseJsonField(examination.extraPressureTests) || {},

                // Existing fields
                clinicalNotes: examination.clinicalImpressions || '',
                diagnosis: parseJsonField(examination.assessment)?.diagnosis || '',
                slitLampFindings: parseJsonField(examination.slitLampFindings),
                fundoscopyFindings: parseJsonField(examination.fundoscopyFindings),
                visualFieldResults: parseJsonField(examination.visualFieldResults),
                octFindings: parseJsonField(examination.octFindings),
                followUpRequired: examination.followUpRequired || false,
                followUpDate: examination.followUpDate,
                followUpInstructions: parseJsonField(examination.followUpInstructions),
                surgeryRecommended: examination.surgeryRecommended || false,
                surgeryType: examination.surgeryType,
                urgencyLevel: examination.urgencyLevel || 'ROUTINE',
                diagnoses: examination.diagnoses.map(d => ({
                    id: d.id,
                    disease: d.disease?.diseaseName || 'General diagnosis',
                    severity: d.severity,
                    eyeAffected: d.eyeAffected,
                    notes: d.notes
                })),
                createdAt: examination.createdAt,
                updatedAt: examination.updatedAt
            };

            console.log('✅ Retrieved detailed ophthalmologist examination data');
            return result;

        } catch (error) {
            console.error('❌ Error fetching detailed ophthalmologist examination:', error);
            throw new Error(`Failed to fetch detailed examination: ${error.message}`);
        }
    }
}

// Export singleton instance
const ophthalmologistService = new OphthalmologistService();

// Import the new examination service functions
const examinationService = require('./ophthalmologistExaminationService');

// Import the doctor queue service functions
const doctorQueueService = require('./doctorQueueService');

// Add the new functions to the service
ophthalmologistService.saveDetailedOphthalmologistExamination = examinationService.saveDetailedOphthalmologistExamination;
ophthalmologistService.getDetailedOphthalmologistExamination = examinationService.getDetailedOphthalmologistExamination;
ophthalmologistService.getPatientVisitIdFromQueueEntry = examinationService.getPatientVisitIdFromQueueEntry;

// Add doctor queue management functions
ophthalmologistService.reorderDoctorQueue = doctorQueueService.reorderDoctorQueue;
ophthalmologistService.reorderDoctorNextInLine = doctorQueueService.reorderDoctorNextInLine;
ophthalmologistService.getDoctorQueue = doctorQueueService.getDoctorQueue;
ophthalmologistService.transferPatientToDoctor = doctorQueueService.transferPatientToDoctor;

// Add completed examinations function
ophthalmologistService.getCompletedExaminations = async function(doctorId) {
  try {
    console.log('🔍 Fetching completed examinations for doctor:', doctorId);

    const completedQueue = await prisma.patientQueue.findMany({
      where: {
        queueFor: 'OPHTHALMOLOGIST',
        assignedStaffId: doctorId,
        status: 'COMPLETED'
      },
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            phone: true,
            email: true
          }
        },
        patientVisit: {
          include: {
            appointment: {
              select: {
                tokenNumber: true,
                appointmentDate: true,
                appointmentType: true
              }
            },
            ophthalmologistExaminations: {
              where: {
                doctorId: doctorId
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1,
              select: {
                id: true,
                completedAt: true,
                preliminaryDiagnosis: true,
                assessment: true,
                clinicalImpressions: true,
                treatmentPlan: true,
                followUpPeriod: true,
                followUpDays: true,
                followUpInstructions: true,
                examinationNotes: true,
                additionalNotes: true,
                diagnoses: {
                  select: {
                    id: true,
                    diagnosisType: true,
                    severity: true,
                    eyeAffected: true,
                    notes: true,
                    disease: {
                      select: {
                        id: true,
                        diseaseName: true,
                        ophthalmologyCategory: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        assignedStaff: {
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
      }
    });

    const formattedData = completedQueue.map(entry => {
      const patient = entry.patient;
      const visit = entry.patientVisit;
      const examination = visit?.ophthalmologistExaminations?.[0];

      return {
        queueId: entry.id,
        queueNumber: entry.queueNumber,
        completedAt: entry.completedAt,
        inProgressAt: entry.inProgressAt, // Added for duration calculation
        visitId: visit?.id,
        patient: {
          id: patient.id,
          patientNumber: patient.patientNumber,
          fullName: `${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`.trim(),
          firstName: patient.firstName,
          middleName: patient.middleName,
          lastName: patient.lastName,
          age: patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : null,
          gender: patient.gender,
          phone: patient.phone,
          email: patient.email
        },
        appointment: {
          tokenNumber: visit?.appointment?.tokenNumber,
          appointmentDate: visit?.appointment?.appointmentDate,
          appointmentType: visit?.appointment?.appointmentType
        },
        examination: examination ? {
          id: examination.id,
          completedAt: examination.completedAt,
          preliminaryDiagnosis: examination.preliminaryDiagnosis,
          assessment: examination.assessment,
          clinicalImpressions: examination.clinicalImpressions,
          treatmentPlan: examination.treatmentPlan,
          followUpPeriod: examination.followUpPeriod,
          followUpDays: examination.followUpDays,
          followUpInstructions: examination.followUpInstructions,
          examinationNotes: examination.examinationNotes,
          additionalNotes: examination.additionalNotes,
          finalDiagnoses: examination.diagnoses || []
        } : null,
        visitType: visit?.visitType,
        visitDate: visit?.visitDate
      };
    });

    console.log(`✅ Found ${formattedData.length} completed examinations for doctor ${doctorId}`);
    
    return formattedData;

  } catch (error) {
    console.error('❌ Error fetching completed examinations:', error);
    throw error;
  }
};

// Add FCFS function for doctor-specific queues
ophthalmologistService.applyDoctorFCFS = async function(doctorId) {
  try {
    console.log(`📋 Applying FCFS ordering for doctor: ${doctorId}`);

    // Get all queue entries for this doctor sorted by current doctorQueuePosition
    const queueEntries = await prisma.patientQueue.findMany({
      where: {
        queueFor: 'OPHTHALMOLOGIST',
        assignedStaffId: doctorId,
        status: {
          in: ['WAITING', 'CALLED', 'IN_PROGRESS']
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            firstName: true,
            lastName: true
          }
        },
        patientVisit: {
          include: {
            optometristExamination: {
              select: {
                id: true,
                completedAt: true
              }
            }
          }
        }
      },
      orderBy: {
        doctorQueuePosition: 'asc'
      }
    });

    console.log(`📊 Found ${queueEntries.length} queue entries for doctor ${doctorId}`);

    if (queueEntries.length === 0) {
      throw new Error('No patients in queue for this doctor');
    }

    // Separate patients by status
    const activePatients = queueEntries.filter(e => e.status === 'CALLED' || e.status === 'IN_PROGRESS');
    const waitingPatients = queueEntries.filter(e => e.status === 'WAITING');

    console.log(`👥 Active patients (CALLED/IN_PROGRESS): ${activePatients.length}`);
    console.log(`⏳ Waiting patients: ${waitingPatients.length}`);

    // Find the "Next in Line" - first 3 WAITING patients after active patients
    const nextInLineCount = 3;
    const nextInLinePatients = waitingPatients.slice(0, nextInLineCount);
    const reorderablePatients = waitingPatients.slice(nextInLineCount);

    console.log(`🔒 Next in Line patients (locked): ${nextInLinePatients.length}`);
    console.log(`🔄 Patients to reorder (from position ${nextInLineCount + 1}): ${reorderablePatients.length}`);

    if (reorderablePatients.length === 0) {
      throw new Error('No patients to reorder. All patients are either active or in Next in Line.');
    }

    // Sort reorderable patients by optometristExamination.completedAt timestamp (earliest first)
    const sortedReorderablePatients = reorderablePatients.sort((a, b) => {
      const aCompletedAt = a.patientVisit?.optometristExamination?.completedAt;
      const bCompletedAt = b.patientVisit?.optometristExamination?.completedAt;

      // If either patient doesn't have a completedAt, put them at the end
      if (!aCompletedAt && !bCompletedAt) return 0;
      if (!aCompletedAt) return 1;
      if (!bCompletedAt) return -1;

      return new Date(aCompletedAt) - new Date(bCompletedAt);
    });

    console.log('📊 Reordered patients by optometrist examination completedAt:');
    sortedReorderablePatients.forEach((patient, index) => {
      const completedAt = patient.patientVisit?.optometristExamination?.completedAt;
      console.log(`  ${index + 1}. ${patient.patient.firstName} ${patient.patient.lastName} - Completed: ${completedAt || 'N/A'}`);
    });

    // Build the final queue order
    const updatedEntries = [];
    let currentPosition = 1;

    // Add active patients first
    for (const activePatient of activePatients) {
      updatedEntries.push({
        id: activePatient.id,
        newDoctorQueuePosition: currentPosition++,
        status: activePatient.status
      });
    }

    // Add next in line patients
    for (const nextInLinePatient of nextInLinePatients) {
      updatedEntries.push({
        id: nextInLinePatient.id,
        newDoctorQueuePosition: currentPosition++,
        status: nextInLinePatient.status
      });
    }

    // Add sorted reorderable patients
    for (const patient of sortedReorderablePatients) {
      updatedEntries.push({
        id: patient.id,
        newDoctorQueuePosition: currentPosition++,
        status: patient.status
      });
    }

    console.log('🔄 Final queue order:');
    updatedEntries.forEach((entry, index) => {
      console.log(`  Position ${entry.newDoctorQueuePosition}: ${entry.id} (${entry.status})`);
    });

    // Update doctorQueuePosition in database using transaction
    await prisma.$transaction(
      updatedEntries.map(entry =>
        prisma.patientQueue.update({
          where: { id: entry.id },
          data: { doctorQueuePosition: entry.newDoctorQueuePosition }
        })
      )
    );

    console.log('✅ Doctor FCFS ordering applied successfully');

    // Emit socket event to update all connected clients
    try {
      const { emitQueueUpdate } = require('../socket/channels/queueChannel');
      emitQueueUpdate('ophthalmologist-queue', {
        action: 'doctor-fcfs-applied',
        doctorId: doctorId,
        reorderedCount: sortedReorderablePatients.length,
        timestamp: new Date()
      });
      console.log('📡 Emitted doctor-fcfs-applied event to ophthalmologist-queue');
    } catch (socketError) {
      console.warn('⚠️ Failed to emit socket event (non-critical):', socketError.message);
    }

    return {
      updatedEntries: updatedEntries.length,
      reorderedPatients: sortedReorderablePatients.length,
      nextInLinePatients: nextInLinePatients.length,
      message: `Successfully applied FCFS ordering to ${sortedReorderablePatients.length} patients from position ${nextInLineCount + 1} onwards for doctor ${doctorId}`
    };

  } catch (error) {
    console.error('❌ Error applying doctor FCFS ordering:', error);
    throw new Error(`Failed to apply doctor FCFS ordering: ${error.message}`);
  }
};

module.exports = ophthalmologistService;

