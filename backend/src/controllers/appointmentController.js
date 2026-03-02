// src/controllers/appointmentController.js
const prisma = require('../utils/prisma');
const patientService = require('../services/patientService');

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CONTINUATION-VISIT WORKFLOW — Enterprise-Grade Medico-Legal Architecture
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * When a patient's visit is PARTIALLY_COMPLETED (e.g., optometrist done but
 * ophthalmologist consultation was not completed), and the patient returns on
 * a subsequent day to finish treatment, this endpoint creates:
 *
 *   1. A NEW Appointment  (type: CONTINUATION, rescheduledFrom → old appointment)
 *   2. A NEW PatientVisit (originalVisitId → old visit, visitType: CONTINUATION)
 *   3. A NEW Queue Entry  (OPHTHALMOLOGIST queue — skips OPTOMETRIST)
 *
 * The OLD appointment stays PARTIALLY_COMPLETED (isActive: false) as a permanent
 * historical record. This preserves:
 *   - Original checkedInAt timestamps
 *   - Queue analytics and daily footfall accuracy
 *   - Billing date integrity
 *   - Medico-legal audit trail
 *   - Reporting accuracy (incomplete case tracking, return-rate analytics)
 *
 * Relational flow:
 *   Old Appointment → Old Visit (PARTIALLY_COMPLETED) — immutable history
 *   New Appointment → New Visit (CONTINUATION)        — active encounter
 *
 * This mirrors enterprise HIS standards where a return after incomplete treatment
 * is treated as a new encounter linked to the original one.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
const resumePartialConsultation = async (req, res) => {
  try {
    const { appointmentId, tokenNumber, assignedDoctorId, priorityLabel, continuationReason } = req.body;

    // ── Validate required fields ──
    if (!appointmentId || !tokenNumber || !assignedDoctorId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID, token number, and assigned doctor are required'
      });
    }

    // ── Validate priority label ──
    const validPriorityLabels = ['PRIORITY', 'EMERGENCY', 'CHILDREN', 'SENIORS', 'LONGWAIT', 'REFERRAL', 'FOLLOWUP', 'ROUTINE', 'PREPOSTOP'];
    const finalPriorityLabel = priorityLabel && validPriorityLabels.includes(priorityLabel) ? priorityLabel : 'FOLLOWUP';

    // ── Generate a new unique token for the continuation appointment ──
    const newTokenNumber = await patientService.generateAppointmentToken();

    // ── Start transaction — all-or-nothing ──
    const result = await prisma.$transaction(async (tx) => {

      // ──────────────────────────────────────────────────────────────────────
      // 1. Fetch the old appointment + visit + optometrist examination
      // ──────────────────────────────────────────────────────────────────────
      const oldAppointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientNumber: true
            }
          },
          patientVisit: {
            select: {
              id: true,
              status: true,
              visitNumber: true,
              optometristSeenAt: true,
              optometristCalledAt: true,
              doctorSeenAt: true,
              doctorCalledAt: true,
              chiefComplaint: true,
              presentingSymptoms: true,
              visionComplaints: true,
              eyeSymptoms: true,
              onsetDuration: true,
              priorityLevel: true,
              continuationCount: true,
              originalVisitId: true
            }
          }
        }
      });

      if (!oldAppointment) {
        throw new Error('Appointment not found');
      }
      if (!oldAppointment.patientVisit) {
        throw new Error('Patient visit not found for this appointment');
      }

      // ──────────────────────────────────────────────────────────────────────
      // 2. Verify old visit is PARTIALLY_COMPLETED
      // ──────────────────────────────────────────────────────────────────────
      if (oldAppointment.patientVisit.status !== 'PARTIALLY_COMPLETED' &&
          oldAppointment.status !== 'PARTIALLY_COMPLETED') {
        throw new Error(
          `Cannot resume: Visit status is ${oldAppointment.patientVisit.status}, ` +
          `Appointment status is ${oldAppointment.status}. ` +
          `Only PARTIALLY_COMPLETED visits can be resumed.`
        );
      }

      // ──────────────────────────────────────────────────────────────────────
      // 3. Verify token number matches (identity verification)
      // ──────────────────────────────────────────────────────────────────────
      if (oldAppointment.tokenNumber !== tokenNumber) {
        throw new Error('Token number does not match the appointment record');
      }

      // ──────────────────────────────────────────────────────────────────────
      // 4. Check the patient doesn't already have an active appointment
      // ──────────────────────────────────────────────────────────────────────
      const existingActive = await tx.appointment.findFirst({
        where: {
          patientId: oldAppointment.patient.id,
          isActive: true
        },
        select: { id: true, tokenNumber: true, status: true }
      });

      if (existingActive) {
        throw new Error(
          `Patient already has an active appointment (Token: ${existingActive.tokenNumber}, ` +
          `Status: ${existingActive.status}). Cannot create continuation.`
        );
      }

      // ──────────────────────────────────────────────────────────────────────
      // 5. Compute continuation count (follow the chain)
      //    If the old visit itself was a continuation, increment its count.
      //    Otherwise, this is the first continuation = 1.
      // ──────────────────────────────────────────────────────────────────────
      const oldContinuationCount = oldAppointment.patientVisit.continuationCount || 0;
      const newContinuationCount = oldContinuationCount + 1;

      // ── Resolve the root original visit ID (for deep chains) ──
      const rootOriginalVisitId = oldAppointment.patientVisit.originalVisitId || oldAppointment.patientVisit.id;

      // ──────────────────────────────────────────────────────────────────────
      // 6. Generate new visit number
      // ──────────────────────────────────────────────────────────────────────
      const lastVisit = await tx.patientVisit.findFirst({
        where: { patientId: oldAppointment.patient.id },
        orderBy: { visitNumber: 'desc' },
        select: { visitNumber: true }
      });
      const newVisitNumber = (lastVisit?.visitNumber || 0) + 1;

      // ──────────────────────────────────────────────────────────────────────
      // 7. CREATE NEW APPOINTMENT (type: CONTINUATION)
      //    - Links to old appointment via rescheduledFrom
      //    - New token, new date, new time
      //    - isActive: true (active encounter)
      // ──────────────────────────────────────────────────────────────────────
      const now = new Date();
      const newAppointment = await tx.appointment.create({
        data: {
          patientId: oldAppointment.patient.id,
          doctorId: assignedDoctorId,
          appointmentDate: now,
          appointmentTime: now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
          }),
          tokenNumber: newTokenNumber,
          status: 'CHECKED_IN',
          isActive: true,
          appointmentType: 'CONTINUATION',
          purpose: `Resume previous visit (Token: ${oldAppointment.tokenNumber})`,
          notes: continuationReason || `Continuation of partially completed visit from ${oldAppointment.appointmentDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}. Original Token: ${oldAppointment.tokenNumber}`,
          rescheduledFrom: oldAppointment.id,
          estimatedDuration: 30
        }
      });

      // ──────────────────────────────────────────────────────────────────────
      // 8. CREATE NEW PATIENT VISIT (linked to old visit)
      //    - originalVisitId → root original visit (for chain tracing)
      //    - isFollowUp: true
      //    - visitType: CONTINUATION
      //    - checkedInAt: NOW (new physical arrival)
      //    - Carry forward optometrist timestamps from old visit
      //    - Status: AWAITING_DOCTOR (skip optometrist queue)
      // ──────────────────────────────────────────────────────────────────────
      const newVisit = await tx.patientVisit.create({
        data: {
          patientId: oldAppointment.patient.id,
          doctorId: assignedDoctorId,
          appointmentId: newAppointment.id,
          visitDate: now,
          visitNumber: newVisitNumber,
          visitType: 'CONTINUATION',
          status: 'AWAITING_DOCTOR',
          checkedInAt: now,
          isFollowUp: true,
          originalVisitId: rootOriginalVisitId,
          continuationReason: continuationReason || `Resume ophthalmologist consultation from ${oldAppointment.appointmentDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
          continuationCount: newContinuationCount,
          priorityLevel: finalPriorityLabel,
          // Carry forward clinical context from old visit
          chiefComplaint: oldAppointment.patientVisit.chiefComplaint,
          presentingSymptoms: oldAppointment.patientVisit.presentingSymptoms,
          visionComplaints: oldAppointment.patientVisit.visionComplaints,
          eyeSymptoms: oldAppointment.patientVisit.eyeSymptoms,
          onsetDuration: oldAppointment.patientVisit.onsetDuration,
          // Carry forward optometrist timestamps — optometrist exam was already done
          optometristSeenAt: oldAppointment.patientVisit.optometristSeenAt,
          optometristCalledAt: oldAppointment.patientVisit.optometristCalledAt
        }
      });

      // ──────────────────────────────────────────────────────────────────────
      // 9. CREATE OPHTHALMOLOGIST QUEUE ENTRY (skip optometrist)
      //    Patient goes directly to doctor queue since optometrist exam
      //    was already completed in the original visit.
      // ──────────────────────────────────────────────────────────────────────
      const lastQueueEntry = await tx.patientQueue.findFirst({
        where: {
          queueFor: 'OPHTHALMOLOGIST',
          status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS'] }
        },
        orderBy: { queueNumber: 'desc' },
        select: { queueNumber: true }
      });
      const newQueueNumber = (lastQueueEntry?.queueNumber || 0) + 1;

      const lastDoctorQueueEntry = await tx.patientQueue.findFirst({
        where: {
          assignedStaffId: assignedDoctorId,
          queueFor: 'OPHTHALMOLOGIST',
          status: { in: ['WAITING', 'CALLED', 'IN_PROGRESS'] }
        },
        orderBy: { doctorQueuePosition: 'desc' },
        select: { doctorQueuePosition: true }
      });
      const newDoctorQueuePosition = (lastDoctorQueueEntry?.doctorQueuePosition || 0) + 1;

      await tx.patientQueue.create({
        data: {
          patientVisitId: newVisit.id,
          patientId: oldAppointment.patient.id,
          queueFor: 'OPHTHALMOLOGIST',
          queueNumber: newQueueNumber,
          status: 'WAITING',
          assignedStaffId: assignedDoctorId,
          doctorQueuePosition: newDoctorQueuePosition,
          priorityLabel: finalPriorityLabel,
          joinedAt: now,
          resumedAt: now,
          notes: `Continuation visit — resuming from Token: ${oldAppointment.tokenNumber} (${oldAppointment.appointmentDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })})`
        }
      });

      // ──────────────────────────────────────────────────────────────────────
      // 10. OLD APPOINTMENT: Keep as PARTIALLY_COMPLETED, ensure isActive: false
      //     Historical record is never modified. Just ensure flags are correct.
      // ──────────────────────────────────────────────────────────────────────
      if (oldAppointment.isActive) {
        await tx.appointment.update({
          where: { id: oldAppointment.id },
          data: { isActive: false }
        });
      }

      // Cleanup any stale queue entries from the old visit
      await tx.patientQueue.updateMany({
        where: {
          patientVisitId: oldAppointment.patientVisit.id,
          status: { in: ['WAITING', 'CALLED', 'ON_HOLD'] }
        },
        data: {
          status: 'DISCONTINUED',
          completedAt: now,
          notes: 'Auto-discontinued: patient continued via new visit'
        }
      });

      console.log(`✅ Continuation visit created:
        Patient: ${oldAppointment.patient.firstName} ${oldAppointment.patient.lastName} (${oldAppointment.patient.patientNumber})
        Old: Appointment ${oldAppointment.id} (Token: ${oldAppointment.tokenNumber}) → stays PARTIALLY_COMPLETED
        New: Appointment ${newAppointment.id} (Token: ${newTokenNumber}) → CHECKED_IN
        New Visit: ${newVisit.id} (Visit #${newVisitNumber}) → AWAITING_DOCTOR
        Continuation #${newContinuationCount} | Original Visit: ${rootOriginalVisitId}
        Queue: OPHTHALMOLOGIST position ${newQueueNumber} (Doctor position ${newDoctorQueuePosition})`);

      return {
        newAppointment,
        newVisit,
        queueNumber: newQueueNumber,
        doctorQueuePosition: newDoctorQueuePosition,
        patient: oldAppointment.patient,
        oldAppointmentId: oldAppointment.id,
        oldTokenNumber: oldAppointment.tokenNumber,
        continuationCount: newContinuationCount,
        rootOriginalVisitId
      };
    });

    // ── Emit socket event for real-time queue updates ──
    try {
      const { emitQueueUpdate } = require('../socket/channels/queueChannel');
      emitQueueUpdate('ophthalmologist-queue', {
        action: 'patient-resumed',
        queueNumber: result.queueNumber,
        patientInfo: {
          patientNumber: result.patient.patientNumber,
          name: `${result.patient.firstName} ${result.patient.lastName}`
        },
        continuationCount: result.continuationCount,
        timestamp: new Date()
      });
    } catch (socketError) {
      console.warn('⚠️ Failed to emit socket event (non-critical):', socketError.message);
    }

    res.status(201).json({
      success: true,
      message: `Patient resumed via continuation visit. New Token: ${result.newAppointment.tokenNumber}, Queue Position: ${result.queueNumber}`,
      data: {
        // New appointment & visit info
        newAppointmentId: result.newAppointment.id,
        newTokenNumber: result.newAppointment.tokenNumber,
        newVisitId: result.newVisit.id,
        visitNumber: result.newVisit.visitNumber,
        // Queue info
        queueNumber: result.queueNumber,
        doctorQueuePosition: result.doctorQueuePosition,
        // Continuation metadata
        continuationCount: result.continuationCount,
        originalVisitId: result.rootOriginalVisitId,
        // Old appointment reference
        oldAppointmentId: result.oldAppointmentId,
        oldTokenNumber: result.oldTokenNumber,
        // Patient info
        patient: {
          id: result.patient.id,
          patientNumber: result.patient.patientNumber,
          name: `${result.patient.firstName} ${result.patient.lastName}`
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in continuation-visit workflow:', error);
    res.status(error.message.includes('Cannot resume') || error.message.includes('already has') || error.message.includes('Token number') ? 400 : 500).json({
      success: false,
      message: error.message || 'Failed to create continuation visit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete an appointment
 */
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patientVisit: true
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Delete related records in transaction (in correct order due to foreign key constraints)
    await prisma.$transaction(async (tx) => {
      if (appointment.patientVisit) {
        const visitId = appointment.patientVisit.id;
        console.log('🔍 Starting deletion for visitId:', visitId);

        // 1. Delete patient queue entries
        console.log('🔍 Deleting patient queue entries...');
        await tx.patientQueue.deleteMany({
          where: { patientVisitId: visitId }
        });

        // 2. Delete prescriptions and their items
        console.log('🔍 Deleting prescriptions...');
        const prescriptions = await tx.prescription.findMany({
          where: { patientVisitId: visitId },
          select: { id: true }
        });

        for (const prescription of prescriptions) {
          // Delete prescription items first
          await tx.prescriptionItem.deleteMany({
            where: { prescriptionId: prescription.id }
          });
        }

        // Then delete prescriptions
        await tx.prescription.deleteMany({
          where: { patientVisitId: visitId }
        });

        // 3. Delete ophthalmologist examinations (and their related records)
        console.log('🔍 Deleting ophthalmologist examinations...');
        const examinations = await tx.ophthalmologistExamination.findMany({
          where: { patientVisitId: visitId },
          select: { id: true }
        });

        // Delete all diagnoses for this visit (both examination-linked and visit-linked)
        console.log('🔍 Deleting all diagnoses for visit...');
        await tx.diagnosis.deleteMany({
          where: { visitId: visitId }
        });

        // Delete the examinations themselves
        await tx.ophthalmologistExamination.deleteMany({
          where: { patientVisitId: visitId }
        });

        // 4. Delete optometrist examination
        console.log('🔍 Deleting optometrist examination...');
        await tx.optometristExamination.deleteMany({
          where: { patientVisitId: visitId }
        });

        // 5. Delete billing records
        console.log('🔍 Deleting billing records...');
        const bills = await tx.bill.findMany({
          where: { patientVisitId: visitId },
          select: { id: true }
        });

        for (const bill of bills) {
          // Delete bill items first
          await tx.billItem.deleteMany({
            where: { billId: bill.id }
          });
        }

        // Then delete bills
        await tx.bill.deleteMany({
          where: { patientVisitId: visitId }
        });

        // 6. Delete payment records
        console.log('🔍 Deleting payment records...');
        await tx.payment.deleteMany({
          where: { patientVisitId: visitId }
        });

        // 7. Delete IPD admission and all its related records if exists
        console.log('🔍 Deleting IPD admissions...');
        const ipdAdmissions = await tx.ipdAdmission.findMany({
          where: { patientVisitId: visitId },
          select: { id: true }
        });

        for (const admission of ipdAdmissions) {
          console.log('🔍 Deleting IPD admission related records for:', admission.id);
          
          // Delete fitness investigation results
          console.log('🔍 - Deleting fitness investigation results...');
          await tx.fitnessInvestigationResult.deleteMany({
            where: { ipdAdmissionId: admission.id }
          });

          // Delete fitness reports
          console.log('🔍 - Deleting fitness reports...');
          await tx.fitnessReport.deleteMany({
            where: { ipdAdmissionId: admission.id }
          });

          // Delete pre-op assessments
          console.log('🔍 - Deleting pre-op assessments...');
          await tx.preOpAssessment.deleteMany({
            where: { ipdAdmissionId: admission.id }
          });

          // Delete surgery metrics
          console.log('🔍 - Deleting surgery metrics...');
          await tx.surgeryMetrics.deleteMany({
            where: { ipdAdmissionId: admission.id }
          });

          // Delete payments related to IPD
          console.log('🔍 - Deleting IPD payments...');
          await tx.payment.deleteMany({
            where: { ipdAdmissionId: admission.id }
          });
        }

        // Delete IPD admissions
        console.log('🔍 Deleting IPD admission records...');
        await tx.ipdAdmission.deleteMany({
          where: { patientVisitId: visitId }
        });

        // 8. Finally delete patient visit
        console.log('🔍 Deleting patient visit...');
        await tx.patientVisit.delete({
          where: { id: visitId }
        });
      }

      // 9. Delete the appointment
      console.log('🔍 Deleting appointment...');
      await tx.appointment.delete({
        where: { id }
      });
      
      console.log('✅ All deletions completed successfully');
    });

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting appointment:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      errorDetails: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        stack: error.stack
      } : undefined
    });
  }
};

module.exports = {
  resumePartialConsultation,
  deleteAppointment
};
