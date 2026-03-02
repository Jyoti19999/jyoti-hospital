// src/services/doctorQueueService.js
const prisma = require('../utils/prisma');

class DoctorQueueService {
    /**
     * Reorder doctor's specific queue with doctor-scoped positions
     * @param {string} doctorId - Doctor's staff ID
     * @param {Array} reorderedPatients - Array of {queueEntryId, doctorQueuePosition}
     * @returns {Promise<Object>} Reorder result
     */
    async reorderDoctorQueue(doctorId, reorderedPatients) {
        try {
            console.log('🔄 Reordering doctor queue:', { doctorId, count: reorderedPatients.length });

            const result = await prisma.$transaction(async (tx) => {
                // Get ALL patients assigned to this doctor (including CALLED and IN_PROGRESS)
                const allPatients = await tx.patientQueue.findMany({
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
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    orderBy: {
                        doctorQueuePosition: 'asc'
                    }
                });

                console.log(`📋 Found ${allPatients.length} total patients for doctor`);

                // Separate into locked (CALLED/IN_PROGRESS) and waiting patients
                const lockedPatients = allPatients.filter(p => 
                    p.status === 'CALLED' || p.status === 'IN_PROGRESS'
                );
                const waitingPatients = allPatients.filter(p => p.status === 'WAITING');

                console.log(`🔒 Locked patients (CALLED/IN_PROGRESS): ${lockedPatients.length}`);
                console.log(`⏳ Waiting patients: ${waitingPatients.length}`);

                lockedPatients.forEach(p => {
                    console.log(`🔴 Locked: ${p.patient.firstName} ${p.patient.lastName} - Position ${p.doctorQueuePosition} - Status ${p.status}`);
                });

                // Find the maximum position occupied by locked patients
                const maxLockedPosition = lockedPatients.length > 0
                    ? Math.max(...lockedPatients.map(p => p.doctorQueuePosition || 0))
                    : 0;

                console.log(`🔒 Max locked position: ${maxLockedPosition}`);

                // The minimum position we can assign to waiting patients is maxLockedPosition + 1
                const minAllowedPosition = maxLockedPosition + 1;
                console.log(`📍 Minimum allowed position for waiting patients: ${minAllowedPosition}`);

                // Build a map of desired new positions from the request
                const reorderMap = new Map();
                reorderedPatients.forEach(entry => {
                    reorderMap.set(entry.queueEntryId, entry.doctorQueuePosition);
                });

                console.log('🗺️ Reorder map (requested positions):', Array.from(reorderMap.entries()).map(([id, pos]) => ({
                    id,
                    requestedPos: pos,
                    name: waitingPatients.find(p => p.id === id)?.patient?.firstName
                })));

                // Assign desired positions to ALL waiting patients
                const patientPositions = waitingPatients.map(patient => ({
                    queueEntryId: patient.id,
                    currentPosition: patient.doctorQueuePosition,
                    requestedPosition: reorderMap.has(patient.id) 
                        ? reorderMap.get(patient.id) 
                        : patient.doctorQueuePosition,
                    patientName: `${patient.patient.firstName} ${patient.patient.lastName}`
                }));

                console.log('📊 All waiting patients with requested positions:', patientPositions.map(p => ({
                    name: p.patientName,
                    current: p.currentPosition,
                    requested: p.requestedPosition
                })));

                // Sort ALL waiting patients by requested position
                patientPositions.sort((a, b) => a.requestedPosition - b.requestedPosition);

                console.log('📊 Sorted order by requested position:', patientPositions.map((p, idx) => ({
                    sortIndex: idx + 1,
                    name: p.patientName,
                    requestedPos: p.requestedPosition
                })));

                // Phase 1: Set ALL waiting patients to negative temporary values
                console.log('🔄 Phase 1: Setting temporary negative positions for ALL waiting patients...');
                for (let i = 0; i < patientPositions.length; i++) {
                    await tx.patientQueue.update({
                        where: { id: patientPositions[i].queueEntryId },
                        data: { doctorQueuePosition: -1000 - i }
                    });
                    console.log(`  ⏳ ${patientPositions[i].patientName}: ${patientPositions[i].currentPosition} → -${1000 + i} (temp)`);
                }

                // Phase 2: Set final sequential positions for ALL waiting patients
                // Start from minAllowedPosition (which is maxLockedPosition + 1)
                console.log(`🔄 Phase 2: Setting final sequential positions starting from ${minAllowedPosition}...`);
                const updates = [];
                let currentPosition = minAllowedPosition;

                for (let i = 0; i < patientPositions.length; i++) {
                    await tx.patientQueue.update({
                        where: { id: patientPositions[i].queueEntryId },
                        data: { 
                            doctorQueuePosition: currentPosition,
                            updatedAt: new Date()
                        }
                    });

                    updates.push({
                        queueEntryId: patientPositions[i].queueEntryId,
                        patientName: patientPositions[i].patientName,
                        oldPosition: patientPositions[i].currentPosition,
                        newPosition: currentPosition
                    });

                    console.log(`  ✅ ${patientPositions[i].patientName}: -${1000 + i} → ${currentPosition} (final)`);
                    currentPosition++;
                }

                console.log('✅ All waiting patients updated with sequential positions');

                // Final validation: Check for any duplicate positions or gaps
                const finalCheck = await tx.patientQueue.findMany({
                    where: {
                        queueFor: 'OPHTHALMOLOGIST',
                        assignedStaffId: doctorId,
                        status: {
                            in: ['WAITING', 'CALLED', 'IN_PROGRESS']
                        }
                    },
                    select: {
                        id: true,
                        doctorQueuePosition: true,
                        status: true,
                        patient: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    orderBy: {
                        doctorQueuePosition: 'asc'
                    }
                });

                console.log('🔍 Final position validation:');
                const positionCounts = new Map();
                finalCheck.forEach(p => {
                    const pos = p.doctorQueuePosition;
                    positionCounts.set(pos, (positionCounts.get(pos) || 0) + 1);
                    console.log(`  ${p.status === 'WAITING' ? '⏳' : '🔴'} ${p.patient.firstName} ${p.patient.lastName}: Position ${pos} (${p.status})`);
                });

                // Check for duplicates
                const duplicates = Array.from(positionCounts.entries()).filter(([pos, count]) => count > 1);
                if (duplicates.length > 0) {
                    console.error('❌ DUPLICATE POSITIONS FOUND:', duplicates);
                    throw new Error(`Duplicate positions detected: ${duplicates.map(([pos, count]) => `Position ${pos} has ${count} patients`).join(', ')}`);
                }

                console.log('✅ No duplicate positions found');

                return {
                    reorderedCount: updates.length,
                    updates,
                    minAllowedPosition,
                    maxLockedPosition,
                    lockedPatientsCount: lockedPatients.length,
                    finalPositionCheck: finalCheck.map(p => ({
                        name: `${p.patient.firstName} ${p.patient.lastName}`,
                        position: p.doctorQueuePosition,
                        status: p.status
                    }))
                };
            }, {
                timeout: 20000,
                maxWait: 25000
            });

            console.log('✅ Doctor queue reordered successfully');
            return result;

        } catch (error) {
            console.error('❌ Error reordering doctor queue:', error);
            throw new Error(`Failed to reorder doctor queue: ${error.message}`);
        }
    }

    /**
     * Get doctor's queue with positions (1,2,3...)
     * @param {string} doctorId - Doctor's staff ID
     * @returns {Promise<Object>} Doctor's queue data
     */
    async getDoctorQueue(doctorId) {
        try {
            console.log('🔍 Fetching doctor-specific queue:', doctorId);

            const queueEntries = await prisma.patientQueue.findMany({
                where: {
                    queueFor: 'OPHTHALMOLOGIST',
                    assignedStaffId: doctorId,
                    status: {
                        in: ['WAITING', 'CALLED', 'IN_PROGRESS']
                    }
                },
                select: {
                    id: true,
                    patientId: true,
                    patientVisitId: true,
                    queueFor: true,
                    priority: true,
                    priorityLabel: true,
                    status: true,
                    joinedAt: true,
                    calledAt: true,
                    inProgressAt: true, // Added for timer
                    completedAt: true,
                    assignedStaffId: true,
                    doctorQueuePosition: true,
                    receptionist2Reviewed: true,
                    receptionist2ReviewedAt: true,
                    receptionist2ReviewedBy: true,
                    receptionist2Notes: true,
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
                                    notes: true
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
                    { doctorQueuePosition: 'asc' },
                    { priority: 'asc' },
                    { joinedAt: 'asc' }
                ]
            });

            console.log(`✅ Retrieved ${queueEntries.length} patients in doctor's queue`);
            return { queueEntries, total: queueEntries.length };

        } catch (error) {
            console.error('❌ Error fetching doctor queue:', error);
            throw new Error(`Failed to fetch doctor queue: ${error.message}`);
        }
    }

    /**
     * Reorder doctor's Next-in-Line panel only (positions 1-3) using doctorQueuePosition
     * Similar to optometrist's implementation but for doctorQueuePosition field
     * @param {string} doctorId - Doctor's staff ID
     * @param {Array} reorderedQueueEntries - Array of {queueEntryId, newPosition}
     * @returns {Promise<Object>} Reorder result
     */
    async reorderDoctorNextInLine(doctorId, reorderedQueueEntries) {
        try {
            console.log('🔄 Reordering doctor Next-in-Line panel:', { 
                doctorId, 
                count: reorderedQueueEntries.length 
            });

            const result = await prisma.$transaction(async (tx) => {
                // Get ALL patients assigned to this doctor (including CALLED and IN_PROGRESS)
                const allPatients = await tx.patientQueue.findMany({
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
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    orderBy: {
                        doctorQueuePosition: 'asc'
                    }
                });

                console.log(`📋 Found ${allPatients.length} total patients for doctor`);

                // Separate into locked (CALLED/IN_PROGRESS) and waiting patients
                const lockedPatients = allPatients.filter(p => 
                    p.status === 'CALLED' || p.status === 'IN_PROGRESS'
                );
                const waitingPatients = allPatients.filter(p => p.status === 'WAITING');

                console.log(`🔒 Locked patients (CALLED/IN_PROGRESS): ${lockedPatients.length}`);
                console.log(`⏳ Waiting patients: ${waitingPatients.length}`);

                lockedPatients.forEach(p => {
                    console.log(`🔴 Locked: ${p.patient.firstName} ${p.patient.lastName} - Position ${p.doctorQueuePosition} - Status ${p.status}`);
                });

                // Find the maximum position occupied by locked patients
                const maxLockedPosition = lockedPatients.length > 0
                    ? Math.max(...lockedPatients.map(p => p.doctorQueuePosition || 0))
                    : 0;

                console.log(`🔒 Max locked position: ${maxLockedPosition}`);

                // The minimum position we can assign to waiting patients is maxLockedPosition + 1
                // This ensures waiting patients start AFTER all locked patients
                const minAllowedPosition = maxLockedPosition + 1;
                console.log(`📍 Minimum allowed position for waiting patients: ${minAllowedPosition}`);

                // Build a map of desired new positions from the request
                const reorderMap = new Map();
                reorderedQueueEntries.forEach(entry => {
                    reorderMap.set(entry.queueEntryId, entry.newPosition);
                });

                console.log('🗺️ Reorder map (requested positions):', Array.from(reorderMap.entries()).map(([id, pos]) => ({
                    id,
                    requestedPos: pos,
                    name: waitingPatients.find(p => p.id === id)?.patient?.firstName
                })));

                // Assign desired positions to ALL waiting patients
                // If a patient is in the reorder request, use the specified position
                // Otherwise, keep their current position
                const patientPositions = waitingPatients.map(patient => ({
                    queueEntryId: patient.id,
                    currentPosition: patient.doctorQueuePosition,
                    requestedPosition: reorderMap.has(patient.id) 
                        ? reorderMap.get(patient.id) 
                        : patient.doctorQueuePosition,
                    patientName: `${patient.patient.firstName} ${patient.patient.lastName}`
                }));

                console.log('📊 All waiting patients with requested positions:', patientPositions.map(p => ({
                    name: p.patientName,
                    current: p.currentPosition,
                    requested: p.requestedPosition
                })));

                // Sort ALL waiting patients by requested position
                patientPositions.sort((a, b) => a.requestedPosition - b.requestedPosition);

                console.log('📊 Sorted order by requested position:', patientPositions.map((p, idx) => ({
                    sortIndex: idx + 1,
                    name: p.patientName,
                    requestedPos: p.requestedPosition
                })));

                // Phase 1: Set ALL waiting patients to negative temporary values
                console.log('🔄 Phase 1: Setting temporary negative positions for ALL waiting patients...');
                for (let i = 0; i < patientPositions.length; i++) {
                    await tx.patientQueue.update({
                        where: { id: patientPositions[i].queueEntryId },
                        data: { doctorQueuePosition: -1000 - i }
                    });
                    console.log(`  ⏳ ${patientPositions[i].patientName}: ${patientPositions[i].currentPosition} → -${1000 + i} (temp)`);
                }

                // Phase 2: Set final sequential positions for ALL waiting patients
                // Start from minAllowedPosition (which is maxLockedPosition + 1)
                console.log(`🔄 Phase 2: Setting final sequential positions starting from ${minAllowedPosition}...`);
                const updates = [];
                let currentPosition = minAllowedPosition;

                for (let i = 0; i < patientPositions.length; i++) {
                    await tx.patientQueue.update({
                        where: { id: patientPositions[i].queueEntryId },
                        data: { 
                            doctorQueuePosition: currentPosition,
                            updatedAt: new Date()
                        }
                    });

                    updates.push({
                        queueEntryId: patientPositions[i].queueEntryId,
                        patientName: patientPositions[i].patientName,
                        oldPosition: patientPositions[i].currentPosition,
                        newPosition: currentPosition,
                        wasMovedToNextInLine: reorderMap.has(patientPositions[i].queueEntryId)
                    });

                    console.log(`  ✅ ${patientPositions[i].patientName}: -${1000 + i} → ${currentPosition} (final)${reorderMap.has(patientPositions[i].queueEntryId) ? ' 🎯 MOVED TO NEXT-IN-LINE' : ''}`);
                    currentPosition++;
                }

                console.log('✅ All waiting patients updated with sequential positions');

                // Final validation: Check for any duplicate positions or gaps
                const finalCheck = await tx.patientQueue.findMany({
                    where: {
                        queueFor: 'OPHTHALMOLOGIST',
                        assignedStaffId: doctorId,
                        status: {
                            in: ['WAITING', 'CALLED', 'IN_PROGRESS']
                        }
                    },
                    select: {
                        id: true,
                        doctorQueuePosition: true,
                        status: true,
                        patient: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    },
                    orderBy: {
                        doctorQueuePosition: 'asc'
                    }
                });

                console.log('🔍 Final position validation:');
                const positionCounts = new Map();
                finalCheck.forEach(p => {
                    const pos = p.doctorQueuePosition;
                    positionCounts.set(pos, (positionCounts.get(pos) || 0) + 1);
                    console.log(`  ${p.status === 'WAITING' ? '⏳' : '🔴'} ${p.patient.firstName} ${p.patient.lastName}: Position ${pos} (${p.status})`);
                });

                // Check for duplicates
                const duplicates = Array.from(positionCounts.entries()).filter(([pos, count]) => count > 1);
                if (duplicates.length > 0) {
                    console.error('❌ DUPLICATE POSITIONS FOUND:', duplicates);
                    throw new Error(`Duplicate positions detected: ${duplicates.map(([pos, count]) => `Position ${pos} has ${count} patients`).join(', ')}`);
                }

                console.log('✅ No duplicate positions found');

                return {
                    success: true,
                    message: 'Doctor Next-in-Line panel reordered successfully',
                    updatedCount: updates.length,
                    updates,
                    minAllowedPosition,
                    maxLockedPosition,
                    lockedPatientsCount: lockedPatients.length,
                    finalPositionCheck: finalCheck.map(p => ({
                        name: `${p.patient.firstName} ${p.patient.lastName}`,
                        position: p.doctorQueuePosition,
                        status: p.status
                    }))
                };
            }, {
                timeout: 20000,
                maxWait: 25000
            });

            console.log(`✅ Doctor Next-in-Line reordering completed: ${result.updatedCount} patients updated`);
            return result;

        } catch (error) {
            console.error('❌ Error reordering doctor Next-in-Line:', error);
            throw new Error(`Failed to reorder doctor Next-in-Line: ${error.message}`);
        }
    }

    /**
     * Transfer patient to another doctor (goes to end of their queue)
     * @param {string} queueEntryId - Queue entry ID
     * @param {string} targetDoctorId - Target doctor's ID
     * @param {string} currentDoctorId - Current doctor's ID
     * @returns {Promise<Object>} Transfer result
     */
    async transferPatientToDoctor(queueEntryId, targetDoctorId, currentDoctorId) {
        try {
            console.log('↔️ Transferring patient:', { queueEntryId, fromDoctor: currentDoctorId, toDoctor: targetDoctorId });

            // Get the highest doctorQueuePosition for the target doctor
            const maxPosition = await prisma.patientQueue.aggregate({
                where: {
                    assignedStaffId: targetDoctorId,
                    queueFor: 'OPHTHALMOLOGIST',
                    status: {
                        in: ['WAITING', 'CALLED', 'IN_PROGRESS']
                    }
                },
                _max: {
                    doctorQueuePosition: true
                }
            });

            const newPosition = (maxPosition._max.doctorQueuePosition || 0) + 1;

            // Update the patient's assignment and position
            const updatedEntry = await prisma.patientQueue.update({
                where: { 
                    id: queueEntryId,
                    assignedStaffId: currentDoctorId // Ensure current doctor owns the patient
                },
                data: {
                    assignedStaffId: targetDoctorId,
                    doctorQueuePosition: newPosition,
                    transferReason: `Transferred from doctor ${currentDoctorId} to ${targetDoctorId}`,
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

            console.log('✅ Patient transferred successfully');
            return { 
                updatedEntry, 
                newPosition,
                message: `Patient transferred to end of target doctor's queue (position ${newPosition})`
            };

        } catch (error) {
            console.error('❌ Error transferring patient:', error);
            throw new Error(`Failed to transfer patient: ${error.message}`);
        }
    }
}

module.exports = new DoctorQueueService();