// src/services/optometristService.js
const prisma = require('../utils/prisma');

class OptometristService {
  /**
   * Get all patients in the optometrist queue
   * @returns {Promise<Object>} Queue data with patients
   */
  async getOptometristQueue() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Get all patients in OPTOMETRIST queue for today
      const queueEntries = await prisma.patientQueue.findMany({
        where: {
          queueFor: 'OPTOMETRIST',
          joinedAt: {
            gte: startOfDay,
            lte: endOfDay
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
              email: true,
              allergies: true
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
                  purpose: true,
                  notes: true
                }
              },
              doctor: {
                select: {
                  id: true,
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
              staffType: true
            }
          }
        },
        orderBy: [
          { queueNumber: 'asc' }
        ]
      });

      // Calculate statistics
      const totalPatients = queueEntries.length;
      const waitingPatients = queueEntries.filter(q => q.status === 'WAITING').length;
      const calledPatients = queueEntries.filter(q => q.status === 'CALLED').length;
      const inProgressPatients = queueEntries.filter(q => q.status === 'IN_PROGRESS').length;
      const completedPatients = queueEntries.filter(q => q.status === 'COMPLETED').length;
      const onHoldPatients = queueEntries.filter(q => q.status === 'ON_HOLD').length;

      // Transform queue entries for frontend
      const transformedQueue = queueEntries.map(entry => ({
        queueEntryId: entry.id,
        queueNumber: entry.queueNumber,
        priorityLabel: entry.priorityLabel,
        status: entry.status,
        estimatedWaitTime: entry.estimatedWaitTime,
        joinedAt: entry.joinedAt,
        calledAt: entry.calledAt,
        inProgressAt: entry.inProgressAt,
        completedAt: entry.completedAt,
        notes: entry.notes,
        patient: {
          id: entry.patient.id,
          patientNumber: entry.patient.patientNumber,
          fullName: `${entry.patient.firstName} ${entry.patient.middleName ? entry.patient.middleName + ' ' : ''}${entry.patient.lastName}`,
          firstName: entry.patient.firstName,
          middleName: entry.patient.middleName,
          lastName: entry.patient.lastName,
          dateOfBirth: entry.patient.dateOfBirth,
          gender: entry.patient.gender,
          phone: entry.patient.phone,
          email: entry.patient.email,
          allergies: entry.patient.allergies || []
        },
        appointment: {
          id: entry.patientVisit.appointment.id,
          tokenNumber: entry.patientVisit.appointment.tokenNumber,
          appointmentTime: entry.patientVisit.appointment.appointmentTime,
          appointmentType: entry.patientVisit.appointment.appointmentType,
          purpose: entry.patientVisit.appointment.purpose,
          notes: entry.patientVisit.appointment.notes
        },
        visit: {
          id: entry.patientVisit.id,
          visitNumber: entry.patientVisit.visitNumber,
          visitType: entry.patientVisit.visitType,
          status: entry.patientVisit.status,
          checkedInAt: entry.patientVisit.checkedInAt
        },
        doctor: entry.patientVisit.doctor ? {
          id: entry.patientVisit.doctor.id,
          name: `Dr. ${entry.patientVisit.doctor.firstName} ${entry.patientVisit.doctor.lastName}`,
          firstName: entry.patientVisit.doctor.firstName,
          lastName: entry.patientVisit.doctor.lastName
        } : null,
        assignedStaff: entry.assignedStaff ? {
          id: entry.assignedStaff.id,
          name: `${entry.assignedStaff.firstName} ${entry.assignedStaff.lastName}`,
          staffType: entry.assignedStaff.staffType
        } : null
      }));

      return {
        queueFor: 'OPTOMETRIST',
        statistics: {
          totalPatients,
          waitingPatients,
          calledPatients,
          inProgressPatients,
          completedPatients,
          onHoldPatients
        },
        queueEntries: transformedQueue,
        retrievedAt: new Date()
      };

    } catch (error) {
      console.error('❌ Error getting optometrist queue:', error);
      throw new Error('Failed to get optometrist queue');
    }
  }

  /**
   * Call next patient in the optometrist queue
   * @param {string} optometristId - Optometrist staff ID
   * @returns {Promise<Object>} Called patient information
   */
  async callNextPatient(optometristId) {
    try {
      // Find the next waiting patient in queue
      const nextPatient = await prisma.patientQueue.findFirst({
        where: {
          queueFor: 'OPTOMETRIST',
          status: 'WAITING'
        },
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
              appointment: {
                select: {
                  tokenNumber: true
                }
              }
            }
          }
        },
        orderBy: [
          { queueNumber: 'asc' }
        ]
      });

      if (!nextPatient) {
        throw new Error('No patients waiting in the optometrist queue');
      }

      // Update queue entry status and assign optometrist
      const updatedQueueEntry = await prisma.patientQueue.update({
        where: { id: nextPatient.id },
        data: {
          status: 'CALLED',
          assignedStaffId: optometristId,
          calledAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Called patient: Queue ${nextPatient.queueNumber}, Token ${nextPatient.patientVisit.appointment.tokenNumber}`);

      // Emit socket event to update all connected clients
      try {
        const { emitQueueUpdate } = require('../socket/channels/queueChannel');
        emitQueueUpdate('optometrist-queue', {
          action: 'patient-called',
          queueEntryId: nextPatient.id,
          queueNumber: nextPatient.queueNumber,
          status: 'CALLED',
          patientInfo: {
            patientNumber: nextPatient.patient.patientNumber,
            name: `${nextPatient.patient.firstName} ${nextPatient.patient.lastName}`,
            tokenNumber: nextPatient.patientVisit.appointment.tokenNumber
          },
          timestamp: new Date()
        });
        console.log('📡 Emitted patient-called event to optometrist-queue');
      } catch (socketError) {
        console.warn('⚠️ Failed to emit socket event (non-critical):', socketError.message);
      }

      return {
        queueEntry: updatedQueueEntry,
        patient: {
          patientNumber: nextPatient.patient.patientNumber,
          name: `${nextPatient.patient.firstName} ${nextPatient.patient.lastName}`,
          tokenNumber: nextPatient.patientVisit.appointment.tokenNumber
        }
      };

    } catch (error) {
      console.error('❌ Error calling next patient:', error);
      throw new Error(error.message || 'Failed to call next patient');
    }
  }

  /**
   * Start examination for a patient
   * @param {string} queueEntryId - Queue entry ID
   * @param {string} optometristId - Optometrist staff ID
   * @returns {Promise<Object>} Updated queue entry
   */
  async startExamination(queueEntryId, optometristId) {
    try {
      // Update queue entry to IN_PROGRESS
      const updatedQueueEntry = await prisma.patientQueue.update({
        where: { id: queueEntryId },
        data: {
          status: 'IN_PROGRESS',
          assignedStaffId: optometristId,
          inProgressAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          patient: {
            select: {
              patientNumber: true,
              firstName: true,
              lastName: true
            }
          },
          patientVisit: true
        }
      });

      // Update patient visit status (timestamp will be set on completion based on frontend timer)
      await prisma.patientVisit.update({
        where: { id: updatedQueueEntry.patientVisitId },
        data: {
          status: 'WITH_OPTOMETRIST',
          updatedAt: new Date()
        }
      });

      console.log(`✅ Started examination for patient: ${updatedQueueEntry.patient.firstName} ${updatedQueueEntry.patient.lastName}`);

      // Emit socket event to update all connected clients
      try {
        const { emitQueueUpdate } = require('../socket/channels/queueChannel');
        emitQueueUpdate('optometrist-queue', {
          action: 'examination-started',
          queueEntryId: updatedQueueEntry.id,
          status: 'IN_PROGRESS',
          patientInfo: {
            patientNumber: updatedQueueEntry.patient.patientNumber,
            name: `${updatedQueueEntry.patient.firstName} ${updatedQueueEntry.patient.lastName}`
          },
          timestamp: new Date()
        });
        console.log('📡 Emitted examination-started event to optometrist-queue');
      } catch (socketError) {
        console.warn('⚠️ Failed to emit socket event (non-critical):', socketError.message);
      }

      return updatedQueueEntry;

    } catch (error) {
      console.error('❌ Error starting examination:', error);
      throw new Error('Failed to start examination');
    }
  }

  /**
   * Complete examination for a patient (Updated with auto-transfer option)
   * @param {string} queueEntryId - Queue entry ID
   * @param {string} optometristId - Optometrist ID
   * @param {string} transferTo - Optional: Auto-transfer to queue (OPHTHALMOLOGIST, etc.)
   * @param {string} priorityLabel - Optional: Priority label for the patient
   * @param {number} examinationDurationMinutes - Duration of examination in minutes (from frontend timer)
   * @returns {Promise<Object>} Updated queue entry
   */
  async completeExamination(queueEntryId, optometristId, transferTo = null, priorityLabel = null, examinationDurationMinutes = 0) {
    try {
      console.log('******************************************');
      console.log('*** SERVICE - TIMESTAMP CALCULATION ***');
      console.log('*** Duration received:', examinationDurationMinutes, 'minutes ***');
      
      // Calculate timestamps based on examination duration
      const now = new Date();
      const optometristCalledAt = examinationDurationMinutes > 0
        ? new Date(now.getTime() - (examinationDurationMinutes * 60 * 1000))
        : now;

      console.log('*** Now (completedAt):', now.toISOString(), '***');
      console.log('*** Calculated optometristCalledAt:', optometristCalledAt.toISOString(), '***');
      console.log('*** Time difference:', (now.getTime() - optometristCalledAt.getTime()) / 1000, 'seconds ***');
      console.log('******************************************');

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
            patientVisit: true
          }
        });

        if (!queueEntry) {
          throw new Error('Queue entry not found');
        }

        if (queueEntry.status !== 'IN_PROGRESS') {
          throw new Error('Can only complete examinations that are in progress');
        }

        const currentQueueFor = queueEntry.queueFor;
        const currentQueueNumber = queueEntry.queueNumber;

        // If transferTo is specified, transfer to that queue
        if (transferTo) {
          // Validate target queue
          const validQueues = ['OPHTHALMOLOGIST', 'DIAGNOSTICS', 'SURGERY', 'BILLING', 'PHARMACY'];
          if (!validQueues.includes(transferTo)) {
            throw new Error(`Invalid transfer target: ${transferTo}`);
          }

          // Get next queue number for target queue efficiently
          const lastQueueEntry = await tx.patientQueue.findFirst({
            where: {
              queueFor: transferTo,
              status: {
                in: ['WAITING', 'CALLED', 'IN_PROGRESS']
              }
            },
            orderBy: { queueNumber: 'desc' },
            select: { queueNumber: true }
          });

          const newQueueNumber = lastQueueEntry ? lastQueueEntry.queueNumber + 1 : 1;

          // Update optometrist examination with completedAt timestamp
          await tx.optometristExamination.updateMany({
            where: {
              patientVisitId: queueEntry.patientVisitId
            },
            data: {
              completedAt: new Date(),
              updatedAt: new Date()
            }
          });

          // Prepare update data
          const updateData = {
            queueFor: transferTo,
            queueNumber: newQueueNumber,
            status: 'WAITING',
            // Preserve assignedStaffId - do not reset to null
            // assignedStaffId: null, // REMOVED - keep the assigned doctor
            completedAt: new Date(),
            // Reset timing fields for new queue
            calledAt: null,
            inProgressAt: null,
            updatedAt: new Date()
          };

          // Add priority label (use ROUTINE as default if not provided)
          const finalPriorityLabel = priorityLabel || 'ROUTINE';
          updateData.priorityLabel = finalPriorityLabel;

          // Update same record - transfer to new queue
          const updatedEntry = await tx.patientQueue.update({
            where: { id: queueEntryId },
            data: updateData
          });

          // Adjust queue numbers in the source queue
          const adjustedCount = await this.adjustQueueNumbers(tx, currentQueueFor, currentQueueNumber);

          // Update patient visit status and set timestamps
          console.log('*** Updating patientVisit for TRANSFER case ***');
          console.log('*** Patient Visit ID:', queueEntry.patientVisitId, '***');
          console.log('*** optometristCalledAt:', optometristCalledAt.toISOString(), '***');
          console.log('*** optometristSeenAt:', now.toISOString(), '***');
          
          if (transferTo === 'OPHTHALMOLOGIST') {
            await tx.patientVisit.update({
              where: { id: queueEntry.patientVisitId },
              data: {
                status: 'AWAITING_DOCTOR',
                optometristCalledAt: optometristCalledAt,
                optometristSeenAt: now
              }
            });
          } else {
            // Update timestamps even if not transferring
            await tx.patientVisit.update({
              where: { id: queueEntry.patientVisitId },
              data: {
                optometristCalledAt: optometristCalledAt,
                optometristSeenAt: now
              }
            });
          }
          
          console.log('*** patientVisit updated successfully ***');

          return {
            success: true,
            message: `Examination completed and patient transferred to ${transferTo}`,
            data: updatedEntry,
            transferred: true,
            targetQueue: transferTo,
            newQueueNumber,
            adjustedPatientsCount: adjustedCount,
            patient: queueEntry.patient || queueEntry.patientVisit?.patient
          };

        } else {
          // Just complete without transfer - mark as COMPLETED and adjust queue
          
          // Update optometrist examination with completedAt timestamp
          await tx.optometristExamination.updateMany({
            where: {
              patientVisitId: queueEntry.patientVisitId
            },
            data: {
              completedAt: new Date(),
              updatedAt: new Date()
            }
          });

          // Adjust remaining queue numbers
          const adjustedCount = await this.adjustQueueNumbers(tx, currentQueueFor, currentQueueNumber);

          const completedEntry = await tx.patientQueue.update({
            where: { id: queueEntryId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date()
            }
          });

          // Update patient visit status and set timestamps
          console.log('*** Updating patientVisit for COMPLETION (no transfer) case ***');
          console.log('*** Patient Visit ID:', queueEntry.patientVisitId, '***');
          console.log('*** optometristCalledAt:', optometristCalledAt.toISOString(), '***');
          console.log('*** optometristSeenAt:', now.toISOString(), '***');
          
          await tx.patientVisit.update({
            where: { id: queueEntry.patientVisitId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              optometristCalledAt: optometristCalledAt,
              optometristSeenAt: now
            }
          });
          
          console.log('*** patientVisit updated successfully ***');

          return {
            success: true,
            message: 'Examination completed successfully',
            data: completedEntry,
            transferred: false,
            adjustedPatientsCount: adjustedCount,
            patient: queueEntry.patient || queueEntry.patientVisit?.patient
          };
        }
      }, {
        timeout: 15000
      });

      // Emit socket event to update all connected clients
      try {
        const { emitQueueUpdate } = require('../socket/channels/queueChannel');
        emitQueueUpdate('optometrist-queue', {
          action: 'examination-completed',
          queueEntryId,
          transferred: result.transferred,
          transferTo: transferTo,
          status: result.transferred ? 'WAITING' : 'COMPLETED',
          patientInfo: {
            patientNumber: result.patient?.patientNumber,
            name: result.patient ? `${result.patient.firstName || ''} ${result.patient.lastName || ''}`.trim() : 'Unknown Patient'
          },
          timestamp: new Date()
        });
        console.log('📡 Emitted examination-completed event to optometrist-queue');
      } catch (socketError) {
        console.warn('⚠️ Failed to emit socket event (non-critical):', socketError.message);
      }

      return result;

    } catch (error) {
      console.error('❌ Error completing examination:', error);
      throw new Error(`Failed to complete examination: ${error.message}`);
    }
  }

  /**
   * Discontinue an ongoing examination at the optometry stage.
   * Marks the queue entry, patient visit, and appointment as DISCONTINUED.
   * Adjusts remaining queue numbers and emits real-time updates.
   *
   * @param {string} queueEntryId - The PatientQueue entry ID
   * @param {string} optometristId - The optometrist performing the action
   * @param {string|null} reason - Optional reason for discontinuation
   * @returns {Promise<Object>} Updated queue entry, visit, and appointment
   */
  async discontinueExamination(queueEntryId, optometristId, reason = null) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Step 1: Fetch queue entry with related visit and appointment
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
                appointment: true
              }
            }
          }
        });

        if (!queueEntry) {
          const err = new Error('Queue entry not found');
          err.statusCode = 404;
          throw err;
        }

        // Step 2: Validate queue belongs to OPTOMETRIST
        if (queueEntry.queueFor !== 'OPTOMETRIST') {
          const err = new Error('Queue entry does not belong to the OPTOMETRIST queue');
          err.statusCode = 403;
          throw err;
        }

        // Step 3: Validate current status allows discontinuation
        if (['COMPLETED', 'DISCONTINUED'].includes(queueEntry.status)) {
          const err = new Error(
            `Examination cannot be discontinued — queue entry is already ${queueEntry.status}`
          );
          err.statusCode = 409;
          throw err;
        }

        if (!['CALLED', 'IN_PROGRESS'].includes(queueEntry.status)) {
          const err = new Error(
            `Examination cannot be discontinued in current state: ${queueEntry.status}`
          );
          err.statusCode = 409;
          throw err;
        }

        const now = new Date();
        const currentQueueFor = queueEntry.queueFor;
        const currentQueueNumber = queueEntry.queueNumber;

        // Step 4: Update PatientQueue → DISCONTINUED
        const updatedQueueEntry = await tx.patientQueue.update({
          where: { id: queueEntryId },
          data: {
            status: 'DISCONTINUED',
            completedAt: now,
            notes: reason || 'Discontinued at optometry stage'
          }
        });

        // Step 5: Update PatientVisit → DISCONTINUED
        const updatedVisit = await tx.patientVisit.update({
          where: { id: queueEntry.patientVisitId },
          data: {
            status: 'DISCONTINUED',
            completedAt: now
          }
        });

        // Step 6: Update Appointment → DISCONTINUED and deactivate
        let updatedAppointment = null;
        if (queueEntry.patientVisit?.appointmentId) {
          updatedAppointment = await tx.appointment.update({
            where: { id: queueEntry.patientVisit.appointmentId },
            data: {
              status: 'DISCONTINUED',
              isActive: false
            }
          });
        }

        // Step 7: Adjust queue numbers for remaining patients
        const adjustedCount = await this.adjustQueueNumbers(tx, currentQueueFor, currentQueueNumber);

        console.log(`✅ Examination discontinued for queue entry ${queueEntryId}`);
        console.log(`   Reason: ${reason || 'No reason provided'}`);
        console.log(`   Queue adjusted: ${adjustedCount} patients renumbered`);

        return {
          queueEntry: updatedQueueEntry,
          visit: updatedVisit,
          appointment: updatedAppointment,
          adjustedPatientsCount: adjustedCount,
          patient: queueEntry.patient
        };
      }, {
        timeout: 15000
      });

      // Step 8: Emit WebSocket event (non-blocking, outside transaction)
      try {
        const { emitQueueUpdate } = require('../socket/channels/queueChannel');
        emitQueueUpdate('optometrist-queue', {
          action: 'EXAMINATION_DISCONTINUED',
          queueEntryId,
          patientVisitId: result.visit.id,
          patientInfo: {
            patientNumber: result.patient?.patientNumber,
            name: result.patient
              ? `${result.patient.firstName || ''} ${result.patient.lastName || ''}`.trim()
              : 'Unknown Patient'
          },
          timestamp: new Date()
        });
        console.log('📡 Emitted EXAMINATION_DISCONTINUED event to optometrist-queue');
      } catch (socketError) {
        console.warn('⚠️ Failed to emit socket event (non-critical):', socketError.message);
      }

      return result;

    } catch (error) {
      // Re-throw with original statusCode if present
      if (error.statusCode) throw error;
      console.error('❌ Error discontinuing examination:', error);
      throw new Error(`Failed to discontinue examination: ${error.message}`);
    }
  }

  /**
   * Get current patient being examined by optometrist
   * @param {string} optometristId - Optometrist staff ID
   * @returns {Promise<Object|null>} Current patient or null
   */
  async getCurrentPatient(optometristId) {
    try {
      const currentPatient = await prisma.patientQueue.findFirst({
        where: {
          queueFor: 'OPTOMETRIST',
          assignedStaffId: optometristId,
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
      throw new Error('Failed to get current patient');
    }
  }

  /**
   * Adjust queue numbers after patient leaves queue
   * @param {Object} tx - Prisma transaction
   * @param {string} queueFor - Queue type
   * @param {number} removedQueueNumber - Queue number that was removed
   * @returns {Promise<number>} Number of patients adjusted
   */
  async adjustQueueNumbers(tx, queueFor, removedQueueNumber) {
    try {
      // Get all patients that need adjustment first
      const patientsToAdjust = await tx.patientQueue.findMany({
        where: {
          queueFor: queueFor,
          queueNumber: {
            gt: removedQueueNumber
          },
          status: {
            in: ['WAITING', 'CALLED', 'IN_PROGRESS']
          }
        },
        select: { id: true, queueNumber: true },
        orderBy: { queueNumber: 'asc' }
      });

      // Use parallel updates for better performance
      const updatePromises = patientsToAdjust.map(patient =>
        tx.patientQueue.update({
          where: { id: patient.id },
          data: { queueNumber: patient.queueNumber - 1 }
        })
      );

      await Promise.all(updatePromises);

      console.log(`✅ Adjusted ${patientsToAdjust.length} patients in ${queueFor} queue`);
      return patientsToAdjust.length;

    } catch (error) {
      console.error('❌ Error adjusting queue numbers:', error);
      throw error;
    }
  }

  /**
   * Save optometrist examination data
   * @param {string} patientVisitId - Patient visit ID
   * @param {string} optometristId - Optometrist staff ID
   * @param {Object} examinationData - Complete examination data from the frontend
   * @returns {Promise<Object>} Saved examination record
   */
  async saveExaminationData(patientVisitId, optometristId, examinationData) {
    try {
      // Extract structured data from examination payload.
      // Support two payload shapes:
      //   1. Wrapped: { examData: {...}, assignedDoctor, allergies, status }  (normal save flow)
      //   2. Flat:    { visualAcuity, refraction, ..., assignedDoctor, ... }  (edit flow from modal)
      const {
        examData: _examData,
        assignedDoctor,
        patientInfo,
        allergies,
        completedAt,
        status
      } = examinationData;

      // If examData is missing (flat payload), treat the whole examinationData object as examData
      const examData = _examData || examinationData;

      // Normalize visualAcuity: mirror `distance` to `unaided` when unaided has no values.
      // Clinically, Unaided Vision = UCVA = Distance Vision (measured without correction).
      // The optometrist form has no separate unaided input, so we derive it from distance.
      const rawVA = examData.visualAcuity || {};
      const unaidedEmpty =
        !rawVA.unaided?.rightEye && !rawVA.unaided?.leftEye && !rawVA.unaided?.binocular;
      const normalizedVA = {
        ...rawVA,
        unaided: unaidedEmpty ? (rawVA.distance || {}) : rawVA.unaided,
      };

      // Build the shared data payload (used for both create and update)
      const examinationPayload = {
        optometristId: optometristId,

        // Complete examination data as JSON
        visualAcuity: normalizedVA,
        refraction: examData.refraction,
        tonometry: examData.tonometry,
        additionalTests: examData.additionalTests,
        clinicalDetails: examData.clinicalDetails,

        // Clinical assessment
        clinicalNotes: examData.clinicalNotes,
        preliminaryDiagnosis: examData.preliminaryDiagnosis,
        assignedDoctor: assignedDoctor,

        // Additional data
        additionalOrders: examData.additionalOrders || [],
        knownAllergies: allergies,

        // Status and completion
        examinationStatus: status || 'completed',

        // Legacy fields for backward compatibility (extract key values)
        ucvaOD: examData.visualAcuity?.distance?.rightEye,
        ucvaOS: examData.visualAcuity?.distance?.leftEye,
        bcvaOD: examData.visualAcuity?.aided?.rightEye,
        bcvaOS: examData.visualAcuity?.aided?.leftEye,

        refractionSphereOD: examData.refraction?.sphere?.rightEye ? parseFloat(examData.refraction.sphere.rightEye) : null,
        refractionCylinderOD: examData.refraction?.cylinder?.rightEye ? parseFloat(examData.refraction.cylinder.rightEye) : null,
        refractionAxisOD: examData.refraction?.axis?.rightEye ? parseInt(examData.refraction.axis.rightEye) : null,
        refractionSphereOS: examData.refraction?.sphere?.leftEye ? parseFloat(examData.refraction.sphere.leftEye) : null,
        refractionCylinderOS: examData.refraction?.cylinder?.leftEye ? parseFloat(examData.refraction.cylinder.leftEye) : null,
        refractionAxisOS: examData.refraction?.axis?.leftEye ? parseInt(examData.refraction.axis.leftEye) : null,

        iopOD: examData.tonometry?.iop?.rightEye ? parseFloat(examData.tonometry.iop.rightEye) : null,
        iopOS: examData.tonometry?.iop?.leftEye ? parseFloat(examData.tonometry.iop.leftEye) : null,
        iopMethod: examData.tonometry?.method,

        colorVision: examData.additionalTests?.colorVision,
        pupilReaction: examData.additionalTests?.pupilReaction,
        eyeAlignment: examData.additionalTests?.eyeAlignment,
        anteriorSegment: examData.additionalTests?.anteriorSegment ? { findings: examData.additionalTests.anteriorSegment } : null,
        additionalNotes: examData.additionalNotes || examData.clinicalNotes || null,

        proceedToDoctor: true,
        requiresDilation: false
      };

      // Use upsert so that editing an existing examination updates it rather than
      // trying to create a duplicate (which would violate the @unique patientVisitId constraint).
      const savedExamination = await prisma.optometristExamination.upsert({
        where: {
          patientVisitId: patientVisitId,
        },
        create: {
          patientVisitId: patientVisitId,
          completedAt: null, // Set on first creation; preserved on subsequent updates
          ...examinationPayload,
        },
        update: examinationPayload,
      });

      console.log(`✅ Saved examination data for patient visit: ${patientVisitId}`);
      console.log(`📊 Examination ID: ${savedExamination.id}`);
      console.log(`👨‍⚕️ Assigned Doctor: ${assignedDoctor}`);

      return {
        success: true,
        message: 'Examination data saved successfully',
        data: {
          examinationId: savedExamination.id,
          patientVisitId: savedExamination.patientVisitId,
          optometristId: savedExamination.optometristId,
          assignedDoctor: savedExamination.assignedDoctor,
          preliminaryDiagnosis: savedExamination.preliminaryDiagnosis,
          completedAt: savedExamination.completedAt,
          examinationStatus: savedExamination.examinationStatus
        }
      };

    } catch (error) {
      console.error('❌ Error saving examination data:', error);
      throw new Error(`Failed to save examination data: ${error.message}`);
    }
  }

  /**
   * Transfer patient to another queue (Updated - single record approach)
   * @param {string} queueEntryId - Queue entry ID
   * @param {string} targetQueue - Target queue (OPHTHALMOLOGIST, DIAGNOSTICS, etc.)
   * @param {string} reason - Transfer reason
   * @returns {Promise<Object>} Transfer result
   */
  async transferPatient(queueEntryId, targetQueue, reason) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Get current queue entry
        const currentEntry = await tx.patientQueue.findUnique({
          where: { id: queueEntryId },
          include: {
            patientVisit: {
              include: {
                patient: true,
                appointment: true
              }
            }
          }
        });

        if (!currentEntry) {
          throw new Error('Queue entry not found');
        }

        // Allow transfer from both IN_PROGRESS and COMPLETED status
        if (!['IN_PROGRESS', 'COMPLETED'].includes(currentEntry.status)) {
          throw new Error('Can only transfer patients currently in progress or completed');
        }

        const sourceQueue = currentEntry.queueFor;
        const sourceQueueNumber = currentEntry.queueNumber;

        // Get next queue number for target queue efficiently
        const lastQueueEntry = await tx.patientQueue.findFirst({
          where: {
            queueFor: targetQueue,
            status: {
              in: ['WAITING', 'CALLED', 'IN_PROGRESS']
            }
          },
          orderBy: { queueNumber: 'desc' },
          select: { queueNumber: true }
        });

        const newQueueNumber = lastQueueEntry ? lastQueueEntry.queueNumber + 1 : 1;

        console.log(`🔄 Transferring patient from ${sourceQueue} position ${sourceQueueNumber} to ${targetQueue} position ${newQueueNumber}`);

        // Update the same record - don't create new one
        const updatedEntry = await tx.patientQueue.update({
          where: { id: queueEntryId },
          data: {
            queueFor: targetQueue,
            queueNumber: newQueueNumber,
            status: 'WAITING',
            assignedStaffId: null,
            transferReason: reason,
            // Reset timing fields for new queue
            calledAt: null,
            inProgressAt: null,
            completedAt: null,
            // Keep joinedAt as original time
            notes: `Transferred from ${sourceQueue}: ${reason}`,
            updatedAt: new Date()
          }
        });

        // Adjust queue numbers for remaining patients in source queue
        const adjustedCount = await this.adjustQueueNumbers(tx, sourceQueue, sourceQueueNumber);
        console.log(`✅ Adjusted ${adjustedCount} patients in ${sourceQueue} queue after transfer`);

        // Update patient visit status
        let newVisitStatus = 'CHECKED_IN';
        if (targetQueue === 'OPHTHALMOLOGIST') {
          newVisitStatus = 'AWAITING_DOCTOR';
        } else if (targetQueue === 'DIAGNOSTICS') {
          newVisitStatus = 'DIAGNOSTICS_PENDING';
        }

        await tx.patientVisit.update({
          where: { id: currentEntry.patientVisitId },
          data: {
            status: newVisitStatus
          }
        });

        return {
          updatedEntry,
          sourceQueue,
          sourceQueueNumber,
          targetQueue,
          newQueueNumber,
          adjustedPatientsCount: adjustedCount,
          patient: currentEntry.patientVisit.patient
        };
      }, {
        timeout: 15000 // 15 second timeout instead of default 5 seconds
      });

      console.log(`✅ Patient ${result.patient.firstName} ${result.patient.lastName} transferred from ${result.sourceQueue} (pos ${result.sourceQueueNumber}) to ${result.targetQueue} (pos ${result.newQueueNumber})`);

      // Emit socket event to update all connected clients
      try {
        const { emitQueueUpdate } = require('../socket/channels/queueChannel');
        emitQueueUpdate('optometrist-queue', {
          action: 'patient-transferred',
          queueEntryId,
          sourceQueue: result.sourceQueue,
          targetQueue: result.targetQueue,
          newQueueNumber: result.newQueueNumber,
          patientInfo: {
            patientNumber: result.patient.patientNumber,
            name: `${result.patient.firstName} ${result.patient.lastName}`
          },
          timestamp: new Date()
        });
        console.log('📡 Emitted patient-transferred event to optometrist-queue');
      } catch (socketError) {
        console.warn('⚠️ Failed to emit socket event (non-critical):', socketError.message);
      }

      return {
        success: true,
        message: `Patient transferred from ${result.sourceQueue} to ${result.targetQueue} queue`,
        data: result
      };

    } catch (error) {
      console.error('❌ Error transferring patient:', error);
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }

  // Get today's completed examinations for optometrist
  async getTodaysCompletedExaminations(optometristId) {
    try {
      // Get start and end of today
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Query completed examinations for today
      const completedExaminations = await prisma.optometristExamination.findMany({
        where: {
          optometristId: optometristId,
          completedAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        include: {
          patientVisit: {
            select: {
              optometristCalledAt: true,
              patient: {
                select: {
                  id: true,
                  patientNumber: true,
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true,
                  phone: true
                }
              }
            }
          }
        },
        orderBy: {
          completedAt: 'desc'
        }
      });

      // Format the data for frontend consumption
      const formattedExaminations = completedExaminations.map(exam => {
        // Calculate examination duration
        let durationMinutes = 0;
        if (exam.completedAt && exam.patientVisit.optometristCalledAt) {
          const startTime = new Date(exam.patientVisit.optometristCalledAt);
          const endTime = new Date(exam.completedAt);
          const durationMs = endTime - startTime;
          durationMinutes = Math.round(Math.abs(durationMs) / (1000 * 60));
        }

        return {
          id: exam.id,
          patientId: exam.patientVisit.patient.id,
          patientNumber: exam.patientVisit.patient.patientNumber,
          patientName: `${exam.patientVisit.patient.firstName} ${exam.patientVisit.patient.lastName}`,
          dateOfBirth: exam.patientVisit.patient.dateOfBirth,
          phone: exam.patientVisit.patient.phone,
          completedAt: exam.completedAt,
          optometristCalledAt: exam.patientVisit.optometristCalledAt,
          durationMinutes: durationMinutes,
          visualAcuity: exam.visualAcuity,
          refraction: exam.refraction,
          tonometry: exam.tonometry,
          clinicalDetails: exam.clinicalDetails,
          clinicalNotes: exam.clinicalNotes,
          preliminaryDiagnosis: exam.preliminaryDiagnosis,
          additionalNotes: exam.additionalNotes,
          visitId: exam.patientVisitId,
        };
      });

      return {
        success: true,
        data: formattedExaminations,
        totalCompleted: completedExaminations.length,
        date: today.toISOString().split('T')[0]
      };

    } catch (error) {
      console.error('❌ Error getting today\'s completed examinations:', error);
      throw new Error(`Failed to get completed examinations: ${error.message}`);
    }
  }

  // Reorder Next-in-Line Panel - Smart positioning that respects CALLED/IN_PROGRESS patients
  async reorderNextInLinePanel(optometristId, reorderedQueueEntries, reason = 'Queue reordered') {
    try {
      console.log(`🔄 Reordering Next-in-Line Panel for optometrist ID: ${optometristId}`);
      console.log(`📝 Reason: ${reason}`);
      console.log(`📊 Entries to reorder:`, reorderedQueueEntries.length);

      const result = await prisma.$transaction(async (tx) => {
        const updatedEntries = [];

        // Step 1: Get ALL current queue entries to check for CALLED/IN_PROGRESS patients
        const allQueueEntries = await tx.patientQueue.findMany({
          where: {
            queueFor: 'OPTOMETRIST',
            status: {
              in: ['WAITING', 'CALLED', 'IN_PROGRESS']
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
            }
          },
          orderBy: {
            queueNumber: 'asc'
          }
        });

        console.log('📋 Current queue state from DB:');
        allQueueEntries.forEach(entry => {
          const statusEmoji = entry.status === 'WAITING' ? '⏳' : entry.status === 'CALLED' ? '📞' : '🔄';
          console.log(`  ${statusEmoji} Position ${entry.queueNumber}: ${entry.patientVisit.patient.firstName} ${entry.patientVisit.patient.lastName} (${entry.status})`);
        });

        // Find active (CALLED/IN_PROGRESS) patients
        const activePatients = allQueueEntries.filter(e => e.status === 'CALLED' || e.status === 'IN_PROGRESS');
        console.log(`🔴 Active patients (CALLED/IN_PROGRESS): ${activePatients.length}`);
        activePatients.forEach(p => {
          console.log(`  - Position ${p.queueNumber}: ${p.patientVisit.patient.firstName} ${p.patientVisit.patient.lastName} (${p.status})`);
        });

        // Recalculate optimal positions based on DB state
        // Find the last active patient position
        let optimalInsertPosition = 1;
        if (activePatients.length > 0) {
          const maxActivePosition = Math.max(...activePatients.map(p => p.queueNumber));
          optimalInsertPosition = maxActivePosition + 1;
          console.log(`✅ Found active patients up to position ${maxActivePosition}, optimal insert position: ${optimalInsertPosition}`);
        } else {
          console.log(`✅ No active patients, optimal insert position: 1`);
        }

        // Step 2: Verify all queue entries in request exist and are WAITING
        const queueEntryIds = reorderedQueueEntries.map(e => e.queueEntryId);
        const existingEntries = await tx.patientQueue.findMany({
          where: {
            id: { in: queueEntryIds },
            queueFor: 'OPTOMETRIST',
            status: 'WAITING' // Only allow reordering of waiting patients
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

        if (existingEntries.length !== reorderedQueueEntries.length) {
          throw new Error(`Some queue entries are not found or not eligible for reordering. Expected ${reorderedQueueEntries.length}, found ${existingEntries.length}`);
        }

        // Step 3: Recalculate positions based on DB state, not frontend data
        console.log('📐 Recalculating positions based on actual DB state...');
        
        // Adjust positions: if frontend sent positions that conflict with active patients, fix them
        const adjustedReorderEntries = reorderedQueueEntries.map(entry => {
          const existingEntry = existingEntries.find(e => e.id === entry.queueEntryId);
          let newPosition = entry.newQueueNumber;
          
          // If the new position conflicts with an active patient, adjust it
          const conflictsWithActive = activePatients.some(ap => ap.queueNumber === newPosition);
          if (conflictsWithActive) {
            // Find next available position
            while (activePatients.some(ap => ap.queueNumber === newPosition)) {
              console.log(`  ⚠️ Position ${newPosition} conflicts with active patient, adjusting...`);
              newPosition++;
            }
          }
          
          return {
            ...entry,
            newQueueNumber: newPosition,
            patientName: `${existingEntry.patientVisit.patient.firstName} ${existingEntry.patientVisit.patient.lastName}`
          };
        });

        console.log('📋 Adjusted reorder entries:');
        adjustedReorderEntries.forEach(entry => {
          console.log(`  ${entry.patientName}: ${entry.currentQueueNumber} → ${entry.newQueueNumber}`);
        });

        // Step 4: Temporarily set all affected entries to negative queue numbers to avoid conflicts
        console.log('🔄 Step 1: Setting temporary negative queue numbers to avoid conflicts');
        for (let i = 0; i < adjustedReorderEntries.length; i++) {
          const entry = adjustedReorderEntries[i];
          await tx.patientQueue.update({
            where: { id: entry.queueEntryId },
            data: { queueNumber: -1000 - i } // Use negative numbers temporarily
          });
        }

        // Step 5: Update each entry to its final position
        console.log('🔄 Step 2: Updating to final queue positions');
        for (const entry of adjustedReorderEntries) {
          const { queueEntryId, newQueueNumber, currentQueueNumber } = entry;

          // Update the queue entry with new position
          const updatedEntry = await tx.patientQueue.update({
            where: {
              id: queueEntryId
            },
            data: {
              queueNumber: newQueueNumber,
              notes: reason ? `${reason} - Position changed from ${currentQueueNumber} to ${newQueueNumber}` : null,
              updatedAt: new Date()
            }
          });

          updatedEntries.push({
            queueEntryId: updatedEntry.id,
            patientName: entry.patientName,
            oldPosition: currentQueueNumber,
            newPosition: newQueueNumber,
            updatedAt: updatedEntry.updatedAt
          });
          
          console.log(`  ✅ ${entry.patientName}: ${currentQueueNumber} → ${newQueueNumber}`);
        }

        console.log(`✅ Successfully reordered ${updatedEntries.length} queue entries`);

        // Step 6: Emit WebSocket event for real-time updates
        const queueChannel = require('../socket/channels/queueChannel');
        if (queueChannel && queueChannel.emitQueueReordered) {
          queueChannel.emitQueueReordered('OPTOMETRIST', {
            reorderedEntries: updatedEntries,
            reason,
            optometristId,
            timestamp: new Date()
          });
        }

        return {
          updatedEntries,
          reorderTimestamp: new Date(),
          reason,
          optometristId,
          optimalInsertPosition
        };

      }, {
        timeout: 20000, // 20 second timeout for safety
        maxWait: 25000
      });

      console.log(`✅ Next-in-Line Panel reordering completed for optometrist ${optometristId}`);

      return {
        success: true,
        message: 'Next-in-Line Panel reordered successfully',
        data: result,
        updatedEntries: result.updatedEntries,
        reason: result.reason
      };

    } catch (error) {
      console.error('❌ Error reordering Next-in-Line Panel:', error);

      // Provide specific error messages
      if (error.code === 'P2025') {
        throw new Error('One or more queue entries not found or not eligible for reordering');
      } else if (error.code === 'P2002') {
        throw new Error('Queue number conflict - another patient may already be at that position');
      } else {
        throw new Error(`Failed to reorder Next-in-Line Panel: ${error.message}`);
      }
    }
  }

  // Reorder optometrist queue - Robust version that respects CALLED/IN_PROGRESS patients
  async reorderQueue(optometristId, reorderedQueueEntries, reason = 'Queue reordered') {
    try {
      console.log(`🔄 Reordering queue for optometrist ID: ${optometristId}`);
      console.log(`📝 Reason: ${reason}`);
      console.log(`📊 Entries to reorder:`, reorderedQueueEntries.length);

      const result = await prisma.$transaction(async (tx) => {
        const updatedEntries = [];

        // Step 1: Get ALL current queue entries to check for CALLED/IN_PROGRESS patients (locked patients)
        const allQueueEntries = await tx.patientQueue.findMany({
          where: {
            queueFor: 'OPTOMETRIST',
            status: {
              in: ['WAITING', 'CALLED', 'IN_PROGRESS']
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
            }
          },
          orderBy: {
            queueNumber: 'asc'
          }
        });

        console.log('📋 Current queue state from DB:');
        allQueueEntries.forEach(entry => {
          const statusEmoji = entry.status === 'WAITING' ? '⏳' : entry.status === 'CALLED' ? '📞' : '🔄';
          console.log(`  ${statusEmoji} Position ${entry.queueNumber}: ${entry.patientVisit.patient.firstName} ${entry.patientVisit.patient.lastName} (${entry.status})`);
        });

        // Step 2: Find locked patients (CALLED/IN_PROGRESS) - these cannot be reordered
        const lockedPatients = allQueueEntries.filter(e => e.status === 'CALLED' || e.status === 'IN_PROGRESS');
        console.log(`🔴 Locked patients (CALLED/IN_PROGRESS): ${lockedPatients.length}`);
        lockedPatients.forEach(p => {
          console.log(`  - Position ${p.queueNumber}: ${p.patientVisit.patient.firstName} ${p.patientVisit.patient.lastName} (${p.status})`);
        });

        // Find the minimum position for reordering (first position after locked patients)
        let minReorderPosition = 1;
        if (lockedPatients.length > 0) {
          const maxLockedPosition = Math.max(...lockedPatients.map(p => p.queueNumber));
          minReorderPosition = maxLockedPosition + 1;
          console.log(`✅ Locked patients occupy up to position ${maxLockedPosition}, reordering starts from position ${minReorderPosition}`);
        } else {
          console.log(`✅ No locked patients, reordering can start from position 1`);
        }

        // Step 3: Get ALL WAITING patients (both those being reordered and those not in the reorder request)
        const allWaitingPatients = allQueueEntries.filter(e => e.status === 'WAITING');
        console.log(`⏳ Total WAITING patients: ${allWaitingPatients.length}`);

        // Step 4: Build the new order map from reorderedQueueEntries
        // Create a map of queueEntryId -> newPosition for patients being reordered
        const reorderMap = new Map();
        reorderedQueueEntries.forEach(entry => {
          reorderMap.set(entry.queueEntryId, entry.newQueueNumber);
        });

        // Step 5: Sort all waiting patients based on their new positions
        const sortedWaitingPatients = allWaitingPatients.map(patient => {
          const newPosition = reorderMap.get(patient.id);
          return {
            id: patient.id,
            patientName: `${patient.patientVisit.patient.firstName} ${patient.patientVisit.patient.lastName}`,
            oldPosition: patient.queueNumber,
            newPosition: newPosition !== undefined ? newPosition : patient.queueNumber,
            isBeingReordered: newPosition !== undefined
          };
        }).sort((a, b) => a.newPosition - b.newPosition);

        console.log('📋 Sorted waiting patients order:');
        sortedWaitingPatients.forEach((p, idx) => {
          const marker = p.isBeingReordered ? '🔄' : '  ';
          console.log(`  ${marker} ${p.patientName}: old=${p.oldPosition} → new=${p.newPosition} → final=${minReorderPosition + idx}`);
        });

        // Step 6: Temporarily set all waiting patients to negative queue numbers to avoid conflicts
        console.log('🔄 Step 1: Setting temporary negative queue numbers');
        for (let i = 0; i < sortedWaitingPatients.length; i++) {
          const patient = sortedWaitingPatients[i];
          await tx.patientQueue.update({
            where: { id: patient.id },
            data: { queueNumber: -1000 - i }
          });
        }

        // Step 7: Assign final sequential positions starting from minReorderPosition
        console.log('🔄 Step 2: Assigning final sequential positions');
        for (let i = 0; i < sortedWaitingPatients.length; i++) {
          const patient = sortedWaitingPatients[i];
          const finalPosition = minReorderPosition + i;

          await tx.patientQueue.update({
            where: { id: patient.id },
            data: {
              queueNumber: finalPosition,
              notes: reason ? `${reason} - Position changed from ${patient.oldPosition} to ${finalPosition}` : null,
              updatedAt: new Date()
            }
          });

          updatedEntries.push({
            queueEntryId: patient.id,
            patientName: patient.patientName,
            oldPosition: patient.oldPosition,
            newPosition: finalPosition,
            updatedAt: new Date()
          });

          console.log(`  ✅ ${patient.patientName}: ${patient.oldPosition} → ${finalPosition}`);
        }

        console.log(`✅ Successfully reordered ${updatedEntries.length} queue entries`);

        // Step 8: Emit WebSocket event for real-time updates
        const queueChannel = require('../socket/channels/queueChannel');
        if (queueChannel && queueChannel.emitQueueReordered) {
          queueChannel.emitQueueReordered('optometrist', {
            reorderedEntries: updatedEntries,
            reason,
            optometristId,
            timestamp: new Date()
          });
        }

        return {
          updatedEntries,
          reorderTimestamp: new Date(),
          reason,
          optometristId,
          minReorderPosition
        };

      }, {
        timeout: 20000, // 20 second timeout for safety
        maxWait: 25000
      });

      console.log(`✅ Queue reordering completed for optometrist ${optometristId}`);

      return {
        success: true,
        message: 'Queue reordered successfully',
        data: result,
        updatedEntries: result.updatedEntries,
        reason: result.reason
      };

    } catch (error) {
      console.error('❌ Error reordering queue:', error);

      // Provide specific error messages
      if (error.code === 'P2025') {
        throw new Error('One or more queue entries not found or not eligible for reordering');
      } else if (error.code === 'P2002') {
        throw new Error('Queue number conflict - another patient may already be at that position');
      } else {
        throw new Error(`Failed to reorder queue: ${error.message}`);
      }
    }
  }

  // Assign doctor to patient in queue
  async assignDoctorToPatient(queueEntryId, doctorId) {
    try {
      console.log(`👨‍⚕️ Assigning doctor ${doctorId} to queue entry ${queueEntryId}`);

      return await prisma.$transaction(async (tx) => {
        // Validate that the doctor exists and is active
        const doctor = await tx.staff.findUnique({
          where: {
            id: doctorId
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffType: true,
            isActive: true,
            employmentStatus: true
          }
        });

        if (!doctor) {
          throw new Error('Doctor not found');
        }

        if (doctor.staffType !== 'doctor') {
          throw new Error('Selected staff member is not a doctor');
        }

        if (!doctor.isActive || doctor.employmentStatus !== 'active') {
          throw new Error('Doctor is not active');
        }

        // Check if queue entry exists
        const queueEntry = await tx.patientQueue.findUnique({
          where: {
            id: queueEntryId
          },
          include: {
            patient: {
              select: {
                patientNumber: true,
                firstName: true,
                lastName: true
              }
            },
            patientVisit: {
              select: {
                id: true,
                patient: {
                  select: {
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

        // Update the queue entry with assigned staff and queue position
        const updatedQueueEntry = await tx.patientQueue.update({
          where: {
            id: queueEntryId
          },
          data: {
            assignedStaffId: doctorId,
            doctorQueuePosition: nextQueuePosition,
            updatedAt: new Date()
          },
          include: {
            assignedStaff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                staffType: true
              }
            },
            patient: {
              select: {
                patientNumber: true,
                firstName: true,
                lastName: true
              }
            },
            patientVisit: {
              select: {
                id: true,
                patient: {
                  select: {
                    patientNumber: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        });

        const patientInfo = updatedQueueEntry.patient || updatedQueueEntry.patientVisit?.patient;

        console.log(`✅ Doctor assigned successfully to patient ${patientInfo?.patientNumber}`);

        return {
          queueEntryId,
          doctorId,
          doctorInfo: {
            id: doctor.id,
            name: `${doctor.firstName} ${doctor.lastName}`,
            staffType: doctor.staffType
          },
          patientInfo: {
            patientNumber: patientInfo?.patientNumber,
            name: `${patientInfo?.firstName} ${patientInfo?.lastName}`
          },
          assignedAt: updatedQueueEntry.updatedAt
        };
      });

    } catch (error) {
      console.error('❌ Error assigning doctor to patient:', error);

      if (error.code === 'P2025') {
        throw new Error('Queue entry not found');
      } else {
        throw new Error(`Failed to assign doctor: ${error.message}`);
      }
    }
  }

  // Update patient priority label in queue
  // src/services/optometristService.js
  async updatePatientVisitType(queueEntryId, visitType) {
    try {
      console.log(`🏷️ Updating priority label for queue entry ${queueEntryId} to: ${visitType}`);

      // Convert the visitType to uppercase to match enum values
      const priorityLabel = visitType.toUpperCase();

      // First, get the queue entry to validate it exists
      const queueEntry = await prisma.patientQueue.findUnique({
        where: {
          id: queueEntryId
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true
            }
          },
          patientVisit: {
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                  patientNumber: true
                }
              }
            }
          }
        }
      });

      if (!queueEntry) {
        throw new Error('Queue entry not found');
      }

      if (!queueEntry.patient) {
        throw new Error('Patient information not found for this queue entry');
      }

      if (queueEntry.status === 'COMPLETED') {
        throw new Error('Cannot update priority label for completed examinations');
      }

      const patientName = queueEntry.patient ? `${queueEntry.patient.firstName} ${queueEntry.patient.lastName}` : 'Unknown Patient';
      const patientNum = queueEntry.patient?.patientNumber || 'N/A';
      console.log(`📋 Updating priority label for patient: ${patientName} (${patientNum})`);

      // Update the priorityLabel in PatientQueue
      const updatedQueueEntry = await prisma.patientQueue.update({
        where: {
          id: queueEntryId
        },
        data: {
          priorityLabel: priorityLabel,
          updatedAt: new Date()
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true
            }
          },
          patientVisit: {
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                  patientNumber: true
                }
              }
            }
          }
        }
      });

      // Use the direct patient relation as primary, fallback to patientVisit.patient
      const patientInfo = updatedQueueEntry.patient || updatedQueueEntry.patientVisit?.patient;
      
      console.log(`✅ Priority label updated successfully for patient ${patientInfo?.patientNumber}`);

      // Emit socket event to update all connected clients (receptionist & optometrist)
      try {
        const { emitQueueUpdate } = require('../socket/channels/queueChannel');
        emitQueueUpdate('optometrist-queue', {
          action: 'priority-label-updated',
          queueEntryId,
          oldPriorityLabel: queueEntry.priorityLabel,
          newPriorityLabel: priorityLabel,
          patientInfo: {
            patientNumber: patientInfo?.patientNumber,
            name: patientInfo ? `${patientInfo.firstName || ''} ${patientInfo.lastName || ''}`.trim() : 'Unknown Patient'
          },
          timestamp: new Date()
        });
        console.log('📡 Emitted priority label update to optometrist-queue');
      } catch (socketError) {
        console.warn('⚠️ Failed to emit socket event (non-critical):', socketError.message);
      }

      return {
        queueEntryId,
        patientVisitId: updatedQueueEntry.patientVisitId,
        patientInfo: {
          patientNumber: patientInfo?.patientNumber,
          name: patientInfo ? `${patientInfo.firstName || ''} ${patientInfo.lastName || ''}`.trim() : 'Unknown Patient'
        },
        oldPriorityLabel: queueEntry.priorityLabel,
        newPriorityLabel: priorityLabel,
        updatedAt: updatedQueueEntry.updatedAt
      };

    } catch (error) {
      console.error('❌ Error updating patient priority label:', error);

      if (error.code === 'P2025') {
        throw new Error('Queue entry not found');
      } else {
        throw new Error(`Failed to update priority label: ${error.message}`);
      }
    }
  }

  /**
   * Revert examination status - change patient queue status back to WAITING from IN_PROGRESS
   * @param {string} queueEntryId - Queue entry ID
   * @param {string} optometristId - Optometrist ID
   * @returns {Promise<Object>} Updated queue entry
   */
  async revertExaminationStatus(queueEntryId, optometristId) {
    try {
      console.log('🔄 Reverting examination status for queue entry:', queueEntryId);

      // First check if the queue entry exists and is in the correct state
      const queueEntry = await prisma.patientQueue.findUnique({
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
            select: {
              id: true,
              status: true
            }
          }
        }
      });

      if (!queueEntry) {
        throw new Error('Queue entry not found');
      }

      if (queueEntry.status !== 'IN_PROGRESS') {
        console.log(`⚠️ Queue entry status is ${queueEntry.status}, not IN_PROGRESS. Reverting anyway.`);
      }

      // Update queue entry back to WAITING status
      const updatedQueueEntry = await prisma.patientQueue.update({
        where: { id: queueEntryId },
        data: {
          status: 'WAITING',
          assignedStaffId: null, // Remove staff assignment
          inProgressAt: null,    // Clear in-progress timestamp
          updatedAt: new Date()
        },
        include: {
          patient: {
            select: {
              patientNumber: true,
              firstName: true,
              lastName: true
            }
          },
          patientVisit: true
        }
      });

      // Update patient visit status back to checked-in
      if (queueEntry.patientVisit) {
        await prisma.patientVisit.update({
          where: { id: queueEntry.patientVisit.id },
          data: {
            status: 'CHECKED_IN', // Revert to checked-in status
            optometristSeenAt: null, // Clear optometrist timestamp
            updatedAt: new Date()
          }
        });
      }

      console.log(`✅ Reverted examination status for patient: ${updatedQueueEntry.patient.firstName} ${updatedQueueEntry.patient.lastName} - Status changed back to WAITING`);

      // Emit socket event to update all connected clients
      try {
        const { emitQueueUpdate } = require('../socket/channels/queueChannel');
        emitQueueUpdate('optometrist-queue', {
          action: 'examination-reverted',
          queueEntryId,
          status: 'WAITING',
          patientInfo: {
            patientNumber: updatedQueueEntry.patient.patientNumber,
            name: `${updatedQueueEntry.patient.firstName} ${updatedQueueEntry.patient.lastName}`
          },
          timestamp: new Date()
        });
        console.log('📡 Emitted examination-reverted event to optometrist-queue');
      } catch (socketError) {
        console.warn('⚠️ Failed to emit socket event (non-critical):', socketError.message);
      }

      return updatedQueueEntry;

    } catch (error) {
      console.error('❌ Error reverting examination status:', error);
      
      if (error.code === 'P2025') {
        throw new Error('Queue entry not found');
      } else {
        throw new Error(`Failed to revert examination status: ${error.message}`);
      }
    }
  }

  /**
   * Apply First-Come-First-Served ordering to queue from position 4 onwards
   * Keeps Next in Line patients (positions 1-3) untouched
   * @param {string} optometristId - ID of the optometrist
   * @returns {Promise<Object>} Updated queue entries
   */
  async applyFCFS(optometristId) {
    try {
      console.log(`📋 Applying FCFS ordering for optometrist: ${optometristId}`);

      // Get all queue entries for optometrist sorted by current queue number
      const queueEntries = await prisma.patientQueue.findMany({
        where: {
          queueFor: 'OPTOMETRIST',
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
          }
        },
        orderBy: {
          queueNumber: 'asc'
        }
      });

      console.log(`📊 Found ${queueEntries.length} queue entries for FCFS application`);

      if (queueEntries.length === 0) {
        throw new Error('No patients in queue to reorder');
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

      // Sort reorderable patients by joinedAt timestamp (earliest first)
      const sortedReorderablePatients = reorderablePatients.sort((a, b) => {
        return new Date(a.joinedAt) - new Date(b.joinedAt);
      });

      console.log('📊 Reordered patients by joinedAt:');
      sortedReorderablePatients.forEach((patient, index) => {
        console.log(`  ${index + 1}. ${patient.patient.firstName} ${patient.patient.lastName} - Joined: ${patient.joinedAt}`);
      });

      // Build the final queue order
      // 1. Active patients keep their positions
      // 2. Next in Line patients keep their positions
      // 3. Reorderable patients get new positions based on joinedAt

      const updatedEntries = [];
      let currentPosition = 1;

      // Add active patients first
      for (const activePatient of activePatients) {
        updatedEntries.push({
          id: activePatient.id,
          newQueueNumber: currentPosition++,
          status: activePatient.status
        });
      }

      // Add next in line patients
      for (const nextInLinePatient of nextInLinePatients) {
        updatedEntries.push({
          id: nextInLinePatient.id,
          newQueueNumber: currentPosition++,
          status: nextInLinePatient.status
        });
      }

      // Add sorted reorderable patients
      for (const patient of sortedReorderablePatients) {
        updatedEntries.push({
          id: patient.id,
          newQueueNumber: currentPosition++,
          status: patient.status
        });
      }

      console.log('🔄 Final queue order:');
      updatedEntries.forEach((entry, index) => {
        console.log(`  Position ${entry.newQueueNumber}: ${entry.id} (${entry.status})`);
      });

      // Update queue numbers in database using transaction
      await prisma.$transaction(
        updatedEntries.map(entry =>
          prisma.patientQueue.update({
            where: { id: entry.id },
            data: { queueNumber: entry.newQueueNumber }
          })
        )
      );

      console.log('✅ FCFS ordering applied successfully');

      // Emit socket event to update all connected clients
      try {
        const { emitQueueUpdate } = require('../socket/channels/queueChannel');
        emitQueueUpdate('optometrist-queue', {
          action: 'fcfs-applied',
          reorderedCount: sortedReorderablePatients.length,
          timestamp: new Date()
        });
        console.log('📡 Emitted fcfs-applied event to optometrist-queue');
      } catch (socketError) {
        console.warn('⚠️ Failed to emit socket event (non-critical):', socketError.message);
      }

      return {
        updatedEntries: updatedEntries.length,
        reorderedPatients: sortedReorderablePatients.length,
        nextInLinePatients: nextInLinePatients.length,
        message: `Successfully applied FCFS ordering to ${sortedReorderablePatients.length} patients from position ${nextInLineCount + 1} onwards`
      };

    } catch (error) {
      console.error('❌ Error applying FCFS ordering:', error);
      throw new Error(`Failed to apply FCFS ordering: ${error.message}`);
    }
  }
}

// Export singleton instance
const optometristService = new OptometristService();
module.exports = optometristService;