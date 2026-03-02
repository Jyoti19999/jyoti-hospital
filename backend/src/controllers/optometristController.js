// src/controllers/optometristController.js
const optometristService = require('../services/optometristService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all patients in the optometrist queue
 */
const getOptometristQueue = async (req, res) => {
  try {
    console.log('🔍 Optometrist requesting queue data:', {
      optometristId: req.user.id,
      staffType: req.user.staffType,
      requestTime: new Date().toISOString()
    });

    const queueData = await optometristService.getOptometristQueue();

    res.status(200).json({
      success: true,
      message: 'Optometrist queue retrieved successfully',
      data: queueData
    });

  } catch (error) {
    console.error('❌ Error getting optometrist queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get optometrist queue'
    });
  }
};

/**
 * Call next patient in the optometrist queue
 */
const callNextPatient = async (req, res) => {
  try {
    const optometristId = req.user.id;

    console.log('📞 Optometrist calling next patient:', {
      optometristId,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    const result = await optometristService.callNextPatient(optometristId);

    res.status(200).json({
      success: true,
      message: 'Next patient called successfully',
      data: {
        ...result,
        calledBy: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error calling next patient:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to call next patient'
    });
  }
};

/**
 * Record examination start time - called when Start Examination button is clicked
 */
const recordExaminationStartTime = async (req, res) => {
  try {
    const { queueEntryId } = req.params;
    const optometristId = req.user.id;

    console.log('🕐 Recording examination start time:', {
      queueEntryId,
      optometristId,
      timestamp: new Date().toISOString()
    });

    // Get the queue entry to find the patientVisitId
    const queueEntry = await prisma.patientQueue.findUnique({
      where: { id: queueEntryId },
      select: { patientVisitId: true, status: true }
    });

    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found'
      });
    }

    if (queueEntry.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Examination must be in progress'
      });
    }

    // Update ONLY the optometristCalledAt timestamp in patientVisit
    const updatedVisit = await prisma.patientVisit.update({
      where: { id: queueEntry.patientVisitId },
      data: {
        optometristCalledAt: new Date()
      }
    });

    console.log(`✅ Recorded examination start time for visit: ${updatedVisit.id}`);
    console.log(`⏰ optometristCalledAt: ${updatedVisit.optometristCalledAt.toISOString()}`);

    res.status(200).json({
      success: true,
      message: 'Examination start time recorded successfully',
      data: {
        patientVisitId: updatedVisit.id,
        optometristCalledAt: updatedVisit.optometristCalledAt
      }
    });

  } catch (error) {
    console.error('❌ Error recording examination start time:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record examination start time'
    });
  }
};

/**
 * Start examination - update queue status for a patient
 */
const startExamination = async (req, res) => {
  try {
    const { queueEntryId } = req.params;
    const optometristId = req.user.id;

    if (!queueEntryId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID is required'
      });
    }

    const result = await optometristService.startExamination(queueEntryId, optometristId);

    res.status(200).json({
      success: true,
      message: 'Examination started successfully',
      data: {
        queueEntry: result,
        examiner: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error starting examination:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to start examination'
    });
  }
};

/**
 * Complete examination for a patient (Updated with auto-transfer option)
 */
const completeExamination = async (req, res) => {
  try {
    const { queueEntryId } = req.params;
    const { transferTo, priorityLabel, examinationDurationMinutes } = req.body;
    const optometristId = req.user.id;

    console.log('******************************************');
    console.log('*** EXAMINATION COMPLETION - DURATION CHECK ***');
    console.log('*** Duration received from frontend:', examinationDurationMinutes, 'minutes ***');
    console.log('*** Type:', typeof examinationDurationMinutes, '***');
    console.log('*** Queue Entry ID:', queueEntryId, '***');
    console.log('*** Transfer To:', transferTo || 'No transfer', '***');
    console.log('*** Priority Label:', priorityLabel || 'ROUTINE', '***');
    console.log('******************************************');

    if (!queueEntryId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID is required'
      });
    }

    const result = await optometristService.completeExamination(
      queueEntryId, 
      optometristId, 
      transferTo,
      priorityLabel,
      examinationDurationMinutes
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        queueEntry: result.data,
        transferred: result.transferred || false,
        targetQueue: result.targetQueue || null,
        newQueueNumber: result.newQueueNumber || null,
        adjustedPatientsCount: result.adjustedPatientsCount || 0,
        completedBy: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error completing examination:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to complete examination'
    });
  }
};

/**
 * Get current patient being examined by the optometrist
 */
const getCurrentPatient = async (req, res) => {
  try {
    const optometristId = req.user.id;

    const currentPatient = await optometristService.getCurrentPatient(optometristId);

    if (!currentPatient) {
      return res.status(200).json({
        success: true,
        message: 'No patient currently being examined',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      message: 'Current patient retrieved successfully',
      data: {
        queueEntry: currentPatient,
        examiner: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting current patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current patient'
    });
  }
};

/**
 * Transfer patient to another queue
 */
const transferPatient = async (req, res) => {
  try {
    const { queueEntryId } = req.params;
    const { targetQueue, reason } = req.body;

    console.log('🔄 Transferring patient:', {
      queueEntryId,
      targetQueue,
      reason,
      optometristId: req.user.id
    });

    // Validate required fields
    if (!targetQueue || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Target queue and reason are required'
      });
    }

    // Validate target queue
    const validTargetQueues = [
      'OPHTHALMOLOGIST', 'DIAGNOSTICS', 'SURGERY', 'BILLING', 'PHARMACY'
    ];

    if (!validTargetQueues.includes(targetQueue)) {
      return res.status(400).json({
        success: false,
        message: `Invalid target queue. Must be one of: ${validTargetQueues.join(', ')}`
      });
    }

    const result = await optometristService.transferPatient(queueEntryId, targetQueue, reason);

    res.status(200).json({
      success: true,
      message: `Patient transferred to ${targetQueue} queue successfully`,
      data: {
        ...result,
        transferredBy: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error transferring patient:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to transfer patient'
    });
  }
};

/**
 * Save optometrist examination data
 */
const saveExaminationData = async (req, res) => {
  try {
    const optometristId = req.user.id;
    const { patientVisitId, examinationData } = req.body;

    console.log('💾 Saving examination data:', {
      optometristId,
      patientVisitId,
      staffName: `${req.user.firstName} ${req.user.lastName}`,
      hasExaminationData: !!examinationData
    });

    // Validate required fields
    if (!patientVisitId || !examinationData) {
      return res.status(400).json({
        success: false,
        message: 'Patient visit ID and examination data are required'
      });
    }

    const result = await optometristService.saveExaminationData(
      patientVisitId,
      optometristId,
      examinationData
    );

    res.status(201).json({
      success: true,
      message: 'Examination data saved successfully',
      data: {
        ...result.data,
        savedBy: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error saving examination data:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to save examination data'
    });
  }
};

/**
 * Get optometrist dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const optometristId = req.user.id;

    // Get today's queue data
    const queueData = await optometristService.getOptometristQueue();
    
    // Get current patient
    const currentPatient = await optometristService.getCurrentPatient(optometristId);

    // Get start and end of today for time calculations
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get completed examinations for today
    const completedExamsResult = await optometristService.getTodaysCompletedExaminations(optometristId);
    const completedExamsFromService = completedExamsResult.data || [];

    let averageConsultationTime = 0;
    let averageWaitTime = 0;
    
    // Calculate average consultation time from completed exams
    if (completedExamsFromService.length > 0) {
      // Get the visitIds from completed examinations
      const completedExamVisitIds = completedExamsFromService.map(exam => exam.visitId).filter(id => id);
      
      if (completedExamVisitIds.length > 0) {
        // Fetch patient visits with optometristCalledAt timestamp
        const patientVisits = await prisma.patientVisit.findMany({
          where: {
            id: { in: completedExamVisitIds },
            optometristCalledAt: { not: null }
          },
          select: {
            id: true,
            optometristCalledAt: true
          }
        });

        // Fetch optometrist examinations with completedAt timestamp
        const examinationsWithTiming = await prisma.optometristExamination.findMany({
          where: {
            patientVisitId: { in: completedExamVisitIds },
            completedAt: { not: null }
          },
          select: {
            id: true,
            patientVisitId: true,
            completedAt: true
          }
        });

        // Create map for quick lookup
        const visitMap = new Map();
        patientVisits.forEach(visit => {
          visitMap.set(visit.id, visit.optometristCalledAt);
        });

        // Calculate consultation time
        let totalConsultationTime = 0;
        let consultationCount = 0;

        examinationsWithTiming.forEach(exam => {
          const optometristCalledAt = visitMap.get(exam.patientVisitId);
          
          // Consultation time: from optometristCalledAt to completedAt
          if (exam.completedAt && optometristCalledAt) {
            const startTime = new Date(optometristCalledAt);
            const endTime = new Date(exam.completedAt);
            const durationMs = endTime - startTime;
            const durationMinutes = durationMs / (1000 * 60);
            
            if (durationMinutes > 0) {
              totalConsultationTime += durationMinutes;
              consultationCount++;
            }
          }
        });

        // Calculate average consultation time
        if (consultationCount > 0) {
          averageConsultationTime = Math.ceil(totalConsultationTime / consultationCount);
        }
      }
    }

    // Calculate average wait time for currently WAITING patients in OPTOMETRIST queue
    const waitingPatientsInQueue = queueData.queueEntries.filter(q => q.status === 'WAITING');
    
    if (waitingPatientsInQueue.length > 0) {
      let totalWaitTime = 0;
      const currentTime = new Date();
      
      waitingPatientsInQueue.forEach(patient => {
        if (patient.joinedAt) {
          const joinedTime = new Date(patient.joinedAt);
          const waitMs = currentTime - joinedTime;
          const waitMinutes = waitMs / (1000 * 60);
          
          if (waitMinutes > 0) {
            totalWaitTime += waitMinutes;
          }
        }
      });
      
      // Calculate average wait time in minutes
      if (totalWaitTime > 0) {
        averageWaitTime = Math.ceil(totalWaitTime / waitingPatientsInQueue.length);
      }
    }

    // Calculate performance metrics
    const todayStats = {
      totalPatients: queueData.statistics.totalPatients,
      waitingPatients: queueData.statistics.waitingPatients,
      completedToday: queueData.statistics.completedPatients,
      currentlyExamining: currentPatient ? 1 : 0,
      averageConsultationTime: averageConsultationTime,
      averageWaitTime: averageWaitTime,
      nextPatientNumber: queueData.queueEntries.find(q => q.status === 'WAITING')?.queueNumber || null
    };

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        optometrist: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        },
        todayStats,
        currentPatient: currentPatient ? {
          queueNumber: currentPatient.queueNumber,
          patientName: currentPatient.patient 
            ? `${currentPatient.patient.firstName} ${currentPatient.patient.lastName}`
            : currentPatient.patientVisit?.patient 
              ? `${currentPatient.patientVisit.patient.firstName} ${currentPatient.patientVisit.patient.lastName}`
              : 'Unknown Patient',
          tokenNumber: currentPatient.patientVisit?.appointment?.tokenNumber || 'N/A',
          startedAt: currentPatient.inProgressAt
        } : null,
        upcomingPatients: queueData.queueEntries
          .filter(q => q.status === 'WAITING')
          .slice(0, 5)
          .map(q => ({
            queueNumber: q.queueNumber,
            patientName: q.patient.fullName,
            tokenNumber: q.appointment.tokenNumber,
            priorityLabel: q.priorityLabel,
            waitingTime: Math.floor((new Date() - new Date(q.joinedAt)) / (1000 * 60)) // minutes
          }))
      }
    });

  } catch (error) {
    console.error('❌ Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics'
    });
  }
};

/**
 * Get today's completed examinations
 */
const getTodaysCompletedExaminations = async (req, res) => {
  try {
    const optometristId = req.user.id;

    const serviceResponse = await optometristService.getTodaysCompletedExaminations(optometristId);

    res.status(200).json({
      success: true,
      message: 'Today\'s completed examinations retrieved successfully',
      data: {
        examinations: serviceResponse.data,
        totalCompleted: serviceResponse.totalCompleted,
        date: serviceResponse.date
      }
    });

  } catch (error) {
    console.error('❌ Error getting today\'s completed examinations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed examinations'
    });
  }
};

/**
 * Reorder optometrist queue
 */
const reorderQueue = async (req, res) => {
  try {
    const { reorderedQueueEntries, reason } = req.body;
    const optometristId = req.user.id;

    console.log('🔄 Queue reorder request:', {
      optometristId,
      staffName: `${req.user.firstName} ${req.user.lastName}`,
      entriesCount: reorderedQueueEntries?.length || 0,
      reason: reason || 'Direct reorder',
      timestamp: new Date().toISOString()
    });

    // Validate input
    if (!reorderedQueueEntries || !Array.isArray(reorderedQueueEntries) || reorderedQueueEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reorder data. Expected array of queue entries.'
      });
    }

    // Validate each entry has required fields
    const invalidEntries = reorderedQueueEntries.filter(entry => !entry.queueEntryId || typeof entry.newQueueNumber !== 'number');
    if (invalidEntries.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid queue entry data. Each entry must have queueEntryId and newQueueNumber.'
      });
    }

    console.log('📋 Reordering queue entries:', reorderedQueueEntries.map(e => ({
      queueEntryId: e.queueEntryId,
      currentPosition: e.currentQueueNumber,
      newPosition: e.newQueueNumber
    })));

    const result = await optometristService.reorderQueue(optometristId, reorderedQueueEntries, reason);

    console.log('✅ Queue reordered successfully:', {
      updatedEntries: result.updatedEntries,
      reason: result.reason
    });

    res.status(200).json({
      success: true,
      message: 'Queue reordered successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error reordering queue:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reorder queue'
    });
  }
};

// src/controllers/optometristController.js
const updatePatientVisitType = async (req, res) => {
  try {
    const { queueEntryId } = req.params;
    const { visitType } = req.body;

    console.log('🏷️ Updating patient priority label:', {
      queueEntryId,
      visitType,
      staffId: req.user?.id,
      userExists: !!req.user,
      userKeys: req.user ? Object.keys(req.user) : 'no user'
    });

    // Validate required fields
    if (!visitType) {
      return res.status(400).json({
        success: false,
        message: 'Priority label is required'
      });
    }

    // Validate priority label values (case insensitive)
    const validPriorityLabels = [
      'priority', 'emergency', 'children', 'seniors', 'longwait', 
      'referral', 'followup', 'routine', 'prepostop'
    ];

    if (!validPriorityLabels.includes(visitType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority label. Must be one of: ${validPriorityLabels.join(', ')}`
      });
    }

    const result = await optometristService.updatePatientVisitType(queueEntryId, visitType);

    res.status(200).json({
      success: true,
      message: 'Patient priority label updated successfully',
      data: {
        ...result,
        updatedBy: {
          id: req.user?.id,
          name: `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim(),
          staffType: req.user?.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error updating patient priority label:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update patient priority label'
    });
  }
};

/**
 * Assign doctor to patient in queue
 */
const assignDoctorToPatient = async (req, res) => {
  try {
    const { queueEntryId } = req.params;
    const { doctorId } = req.body;

    console.log('👨‍⚕️ Assigning doctor to patient:', {
      queueEntryId,
      doctorId,
      assignedBy: req.user.id
    });

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    const result = await optometristService.assignDoctorToPatient(queueEntryId, doctorId);

    res.status(200).json({
      success: true,
      message: 'Doctor assigned successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error assigning doctor to patient:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign doctor to patient'
    });
  }
};

/**
 * Revert examination status - change patient queue status back to WAITING from IN_PROGRESS
 */
const revertExaminationStatus = async (req, res) => {
  try {
    const { queueEntryId } = req.params;
    const optometristId = req.user.id;

    console.log('🔄 Reverting examination status:', {
      queueEntryId,
      optometristId,
      staffName: `${req.user.firstName} ${req.user.lastName}`,
      reason: 'Examination modal closed without completion'
    });

    if (!queueEntryId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID is required'
      });
    }

    const result = await optometristService.revertExaminationStatus(queueEntryId, optometristId);

    res.status(200).json({
      success: true,
      message: 'Examination status reverted to WAITING successfully',
      data: {
        queueEntry: result,
        revertedBy: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error reverting examination status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to revert examination status'
    });
  }
};

/**
 * Apply First-Come-First-Served ordering to queue from position 4 onwards
 * Keeps Next in Line patients (positions 1-3) untouched
 */
/**
 * Discontinue an ongoing examination at the optometry stage
 */
const discontinueExamination = async (req, res) => {
  try {
    const { queueEntryId } = req.params;
    const { reason } = req.body;
    const optometristId = req.user.id;

    console.log('🚫 Discontinuing examination:', {
      queueEntryId,
      optometristId,
      reason: reason || 'No reason provided',
      timestamp: new Date().toISOString()
    });

    if (!queueEntryId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID is required'
      });
    }

    const result = await optometristService.discontinueExamination(
      queueEntryId,
      optometristId,
      reason
    );

    // Audit log
    console.log('📋 AUDIT — EXAMINATION_DISCONTINUED:', {
      action: 'EXAMINATION_DISCONTINUED',
      performedBy: optometristId,
      performedByName: `${req.user.firstName} ${req.user.lastName}`,
      queueEntryId,
      patientVisitId: result.visit.id,
      reason: reason || null,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Examination discontinued successfully',
      data: {
        queueEntry: result.queueEntry,
        visit: result.visit,
        appointment: result.appointment,
        discontinuedBy: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error discontinuing examination:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to discontinue examination'
    });
  }
};

const applyFCFS = async (req, res) => {
  try {
    const optometristId = req.user.id;

    console.log('📋 Applying FCFS ordering to optometrist queue:', {
      optometristId,
      staffName: `${req.user.firstName} ${req.user.lastName}`,
      timestamp: new Date().toISOString()
    });

    const result = await optometristService.applyFCFS(optometristId);

    res.status(200).json({
      success: true,
      message: 'FCFS ordering applied successfully to queue from position 4 onwards',
      data: {
        ...result,
        appliedBy: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error applying FCFS ordering:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply FCFS ordering'
    });
  }
};

module.exports = {
  getOptometristQueue,
  callNextPatient,
  startExamination,
  recordExaminationStartTime,
  completeExamination,
  getCurrentPatient,
  transferPatient,
  saveExaminationData,
  getDashboardStats,
  getTodaysCompletedExaminations,
  reorderQueue,
  updatePatientVisitType,
  assignDoctorToPatient,
  revertExaminationStatus,
  applyFCFS,
  discontinueExamination
};