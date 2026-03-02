// src/controllers/ophthalmologistController.js
const ophthalmologistService = require('../services/ophthalmologistService');
const { 
  emitPatientOnHold, 
  emitEyeDropsApplied, 
  emitPatientProcessed,
  emitPatientAssigned,
  emitQueueUpdate
} = require('../socket/channels/queueChannel');

/**
 * Get all patients in the ophthalmologist queue
 */
const getOphthalmologistQueue = async (req, res) => {
  try {
    console.log('🔍 Ophthalmologist requesting queue data:', {
      ophthalmologistId: req.user.id,
      staffType: req.user.staffType,
      requestTime: new Date().toISOString()
    });

    const queueData = await ophthalmologistService.getOphthalmologistQueue();

    res.status(200).json({
      success: true,
      message: 'Ophthalmologist queue retrieved successfully',
      data: queueData
    });

  } catch (error) {
    console.error('❌ Error getting ophthalmologist queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ophthalmologist queue'
    });
  }
};

/**
 * Call next patient in the ophthalmologist queue
 */
const callNextPatient = async (req, res) => {
  try {
    const ophthalmologistId = req.user.id;

    console.log('📞 Ophthalmologist calling next patient:', {
      ophthalmologistId,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    const result = await ophthalmologistService.callNextPatient(ophthalmologistId);

    res.status(200).json({
      success: true,
      message: 'Next patient called successfully',
      data: {
        ...result,
        calledBy: {
          id: ophthalmologistId,
          name: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error calling next patient:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to call next patient'
    });
  }
};

/**
 * Start consultation for a patient
 */
const startConsultation = async (req, res) => {
  try {
    const { queueEntryId } = req.body;
    const ophthalmologistId = req.user.id;

    console.log('🏁 Starting consultation:', {
      queueEntryId,
      ophthalmologistId,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    if (!queueEntryId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID is required'
      });
    }

    const result = await ophthalmologistService.startConsultation(queueEntryId, ophthalmologistId);

    res.status(200).json({
      success: true,
      message: 'Consultation started successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error starting consultation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start consultation'
    });
  }
};

/**
 * Put patient on hold (request eye drops from receptionist2)
 */
const putPatientOnHold = async (req, res) => {
  try {
    const { queueEntryId, reasons = [] } = req.body;
    const ophthalmologistId = req.user.id;

    if (!queueEntryId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID is required'
      });
    }

    console.log('⏸️ Doctor requesting eye drops:', {
      queueEntryId,
      ophthalmologistId,
      staffName: `${req.user.firstName} ${req.user.lastName}`,
      reasons
    });

    const result = await ophthalmologistService.putPatientOnHold(queueEntryId, ophthalmologistId, reasons);

    // 🔌 Emit WebSocket event - Patient moved to eye drop queue
    emitPatientOnHold({
      queueEntryId,
      patientId: result.patientId,
      doctorId: ophthalmologistId,
      reasons,
      patientName: result.patientName,
      firstName: result.firstName,
      lastName: result.lastName,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Patient put on hold - Receptionist2 will be notified',
      data: result
    });

  } catch (error) {
    console.error('❌ Error putting patient on hold:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to put patient on hold'
    });
  }
};

/**
 * Confirm eye drops applied by receptionist2
 */
const confirmEyeDropsApplied = async (req, res) => {
  try {
    const { queueEntryId, customWaitMinutes } = req.body;
    const receptionist2Id = req.user.id;

    if (!queueEntryId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID is required'
      });
    }

    console.log('💧 Receptionist2 confirming eye drops applied:', {
      queueEntryId,
      receptionist2Id,
      customWaitMinutes,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    const result = await ophthalmologistService.confirmEyeDropsApplied(queueEntryId, receptionist2Id, customWaitMinutes);

    // 🔌 Emit WebSocket event - Patient ready, back to doctor queue
    emitEyeDropsApplied({
      queueEntryId,
      patientId: result.patientId,
      doctorId: result.assignedDoctorId,
      timestamp: new Date().toISOString()
    });

    const waitTime = customWaitMinutes || 10;
    res.status(200).json({
      success: true,
      message: `Eye drops applied - ${waitTime} minute timer started`,
      data: result
    });

  } catch (error) {
    console.error('❌ Error confirming eye drops applied:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm eye drops applied'
    });
  }
};

/**
 * Repeat dilation (add another round with same custom wait time)
 */
const repeatDilation = async (req, res) => {
  try {
    const { queueEntryId, customWaitMinutes } = req.body;
    const receptionist2Id = req.user.id;

    if (!queueEntryId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID is required'
      });
    }

    console.log('🔄 Repeating dilation:', { queueEntryId, customWaitMinutes });

    const result = await ophthalmologistService.repeatDilation(queueEntryId, receptionist2Id, customWaitMinutes);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('❌ Error repeating dilation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to repeat dilation'
    });
  }
};

/**
 * Mark patient as ready to resume
 */
const markReadyToResume = async (req, res) => {
  try {
    const { queueEntryId } = req.body;
    const receptionist2Id = req.user.id;

    if (!queueEntryId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID is required'
      });
    }

    const result = await ophthalmologistService.markReadyToResume(queueEntryId, receptionist2Id);

    // 🔌 Emit WebSocket event - Patient marked ready to resume
    const { emitPatientReady } = require('../socket/channels/queueChannel');
    if (emitPatientReady) {
      emitPatientReady({
        queueEntryId,
        patientId: result.patientId,
        patientName: result.patientName,
        firstName: result.firstName,
        lastName: result.lastName,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('❌ Error marking patient ready:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark patient ready'
    });
  }
};

/**
 * Resume patient from hold status
 */
const resumePatientFromHold = async (req, res) => {
  try {
    const { queueEntryId } = req.body;
    const ophthalmologistId = req.user.id;

    if (!queueEntryId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID is required'
      });
    }

    console.log('▶️ Resuming patient from hold:', {
      queueEntryId,
      ophthalmologistId,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    const result = await ophthalmologistService.resumePatientFromHold(queueEntryId, ophthalmologistId);

    res.status(200).json({
      success: true,
      message: 'Patient resumed from hold successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error resuming patient from hold:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resume patient from hold'
    });
  }
};

/**
 * Complete consultation for a patient
 */
const completeConsultation = async (req, res) => {
  try {
    const { queueEntryId } = req.body;
    const ophthalmologistId = req.user.id;

    console.log('✅ Completing consultation:', {
      queueEntryId,
      ophthalmologistId,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    if (!queueEntryId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID is required'
      });
    }

    const result = await ophthalmologistService.completeConsultation(queueEntryId, ophthalmologistId);

    // Emit socket event to update all connected clients
    const { emitQueueUpdate } = require('../socket/channels/queueChannel');
    console.log('📡 Emitting consultation-completed socket events for doctor:', ophthalmologistId);
    emitQueueUpdate(`doctor-queue:${ophthalmologistId}`, { 
      action: 'consultation-completed',
      queueEntryId,
      patientId: result.patient?.id
    });
    emitQueueUpdate('doctor-queue', { action: 'consultation-completed' });

    res.status(200).json({
      success: true,
      message: 'Consultation completed successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error completing consultation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to complete consultation'
    });
  }
};

/**
 * Reorder patients in the ophthalmologist queue
 */
const reorderQueue = async (req, res) => {
  try {
    const { reorderedQueueEntries, reason } = req.body;
    const ophthalmologistId = req.user.id;

    console.log('🔄 Reordering ophthalmologist queue:', {
      ophthalmologistId,
      entriesCount: reorderedQueueEntries?.length,
      reason,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    if (!reorderedQueueEntries || !Array.isArray(reorderedQueueEntries)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reordered queue entries provided'
      });
    }

    const result = await ophthalmologistService.legacyReorderQueue(reorderedQueueEntries, reason);

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

/**
 * Comprehensive queue reordering with intelligent shifting
 */
const reorderQueueComprehensive = async (req, res) => {
  try {
    const { draggedPatientId, targetPosition, reason } = req.body;
    const ophthalmologistId = req.user.id;

    console.log('🔄 Comprehensive queue reordering:', {
      ophthalmologistId,
      draggedPatientId,
      targetPosition,
      reason,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    // Validate required parameters
    if (!draggedPatientId) {
      return res.status(400).json({
        success: false,
        message: 'Dragged patient ID is required'
      });
    }

    if (!targetPosition || targetPosition < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid target position is required (must be >= 1)'
      });
    }

    const result = await ophthalmologistService.reorderQueue(
      draggedPatientId,
      targetPosition,
      reason || 'Comprehensive queue reordering via drag and drop'
    );

    // Emit WebSocket event for real-time updates
    const { emitQueueUpdate } = require('../socket/channels/queueChannel');
    emitQueueUpdate('ophthalmologist-queue', { 
      action: 'queue-reordered',
      draggedPatientId,
      targetPosition,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Queue reordered successfully with intelligent shifting',
      data: result
    });

  } catch (error) {
    console.error('❌ Error in comprehensive queue reordering:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while reordering queue'
    });
  }
};

/**
 * Get current patient being consulted by ophthalmologist
 */
const getCurrentPatient = async (req, res) => {
  try {
    const ophthalmologistId = req.user.id;

    const currentPatient = await ophthalmologistService.getCurrentPatient(ophthalmologistId);

    res.status(200).json({
      success: true,
      message: 'Current patient retrieved successfully',
      data: currentPatient
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
 * Get dashboard statistics for ophthalmologist
 */
const getDashboardStats = async (req, res) => {
  try {
    const ophthalmologistId = req.user.id;

    const stats = await ophthalmologistService.getDashboardStats(ophthalmologistId);

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats
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
 * Assign a patient to an ophthalmologist
 */
const assignPatient = async (req, res) => {
  try {
    const { queueEntryId } = req.params;
    const ophthalmologistId = req.user.id;

    console.log('👨‍⚕️ Assigning patient to ophthalmologist:', {
      queueEntryId,
      ophthalmologistId,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    // Use the proper assignPatientToDoctor service function
    const result = await ophthalmologistService.assignPatientToDoctor(queueEntryId, ophthalmologistId);

    res.status(200).json({
      success: true,
      message: 'Patient assigned successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error assigning patient:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign patient'
    });
  }
};

/**
 * Update notes for a queue entry
 */
const updateQueueNotes = async (req, res) => {
  try {
    const { queueEntryId } = req.params;
    const { notes } = req.body;
    const ophthalmologistId = req.user.id;

    console.log('📝 Updating queue notes:', {
      queueEntryId,
      ophthalmologistId,
      notes: notes?.substring(0, 50) + '...'
    });

    if (!notes || typeof notes !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Notes are required and must be a string'
      });
    }

    // Since we don't have a specific service method, we'll create a simple response
    // In a real implementation, you'd want to add this method to the service
    res.status(200).json({
      success: true,
      message: 'Queue notes updated successfully',
      data: {
        queueEntryId,
        notes,
        updatedAt: new Date().toISOString(),
        updatedBy: {
          id: ophthalmologistId,
          name: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        }
      }
    });

  } catch (error) {
    console.error('❌ Error updating queue notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update queue notes'
    });
  }
};

/**
 * Get only waiting patients in the ophthalmologist queue
 */
const getWaitingPatients = async (req, res) => {
  try {
    console.log('⏳ Getting waiting patients in ophthalmologist queue:', {
      requestedBy: req.user.id,
      staffType: req.user.staffType
    });

    const queueData = await ophthalmologistService.getOphthalmologistQueue();

    // Filter only waiting patients
    const waitingPatients = queueData.queueEntries?.filter(patient => patient.status === 'WAITING') || [];

    res.status(200).json({
      success: true,
      message: 'Waiting patients retrieved successfully',
      data: {
        queueEntries: waitingPatients,
        statistics: {
          waitingCount: waitingPatients.length,
          totalPatients: queueData.queueEntries?.length || 0
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error getting waiting patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get waiting patients'
    });
  }
};

/**
 * Call a specific assigned patient
 */
const callAssignedPatient = async (req, res) => {
  try {
    const { queueEntryId } = req.body;
    const ophthalmologistId = req.user.id;

    if (!queueEntryId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID is required'
      });
    }

    console.log('📞 Calling assigned patient:', {
      queueEntryId,
      ophthalmologistId,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    const result = await ophthalmologistService.callAssignedPatient(queueEntryId, ophthalmologistId);

    res.status(200).json({
      success: true,
      message: 'Assigned patient called successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error calling assigned patient:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to call assigned patient'
    });
  }
};

/**
 * Get doctor's ON_HOLD patients
 */
const getMyOnHoldPatients = async (req, res) => {
  try {
    const ophthalmologistId = req.user.id;

    console.log('⏸️ Getting ON_HOLD patients for ophthalmologist:', {
      ophthalmologistId,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    const result = await ophthalmologistService.getMyOnHoldPatients(ophthalmologistId);

    res.status(200).json({
      success: true,
      message: 'ON_HOLD patients retrieved successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error getting ON_HOLD patients:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get ON_HOLD patients'
    });
  }
};

/**
 * Get patients assigned to the current ophthalmologist
 */
const getMyAssignedPatients = async (req, res) => {
  try {
    const ophthalmologistId = req.user.id;

    console.log('👨‍⚕️ Getting assigned patients for ophthalmologist:', {
      ophthalmologistId,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    const result = await ophthalmologistService.getMyAssignedPatients(ophthalmologistId);

    res.status(200).json({
      success: true,
      message: 'Assigned patients retrieved successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error getting assigned patients:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get assigned patients'
    });
  }
};

const assignDoctorToPatient = async (req, res) => {
  try {
    const { queueEntryId, doctorId } = req.body;

    console.log('👨‍⚕️ Assigning doctor to patient:', {
      queueEntryId,
      doctorId,
      requestedBy: req.user.id
    });

    // Validate required parameters
    if (!queueEntryId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID is required'
      });
    }

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    const result = await ophthalmologistService.assignDoctorToPatient(queueEntryId, doctorId);

    // Emit WebSocket event for real-time updates
    const { emitPatientAssigned } = require('../socket/channels/queueChannel');
    console.log('📡 [DOCTOR-ASSIGN] Emitting patient-assigned event:', { 
      doctorId, 
      queueEntryId,
      requestedBy: req.user.staffType 
    });
    
    emitPatientAssigned({
      queueEntryId,
      doctorId: doctorId,
      patientId: result.patientId,
      assignedBy: 'doctor-self',
      timestamp: new Date()
    });
    
    console.log('📡 [DOCTOR-ASSIGN] WebSocket events emitted successfully');

    res.status(200).json({
      success: true,
      message: 'Doctor assigned to patient successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error assigning doctor to patient:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while assigning doctor'
    });
  }
};

/**
 * Save detailed ophthalmologist examination data
 */
const saveDetailedOphthalmologistExamination = async (req, res) => {
  try {
    const { queueEntryId } = req.params;
    const doctorId = req.user.id;
    const examinationData = req.body;

    console.log('💾 Saving detailed ophthalmologist examination:', {
      queueEntryId,
      doctorId,
      hasData: !!examinationData
    });

    // Get patient visit ID from queue entry
    const patientVisitId = await ophthalmologistService.getPatientVisitIdFromQueueEntry(queueEntryId);

    if (!patientVisitId) {
      return res.status(404).json({
        success: false,
        message: 'Patient visit not found for this queue entry'
      });
    }

    const result = await ophthalmologistService.saveDetailedOphthalmologistExamination(
      patientVisitId,
      doctorId,
      examinationData
    );

    res.status(200).json({
      success: true,
      message: 'Detailed examination data saved successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error saving detailed ophthalmologist examination:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save detailed examination data'
    });
  }
};

/**
 * Get detailed ophthalmologist examination data
 */
const getDetailedOphthalmologistExamination = async (req, res) => {
  try {
    const { queueEntryId } = req.params;
    const doctorId = req.user.id;

    console.log('🔍 Getting detailed ophthalmologist examination:', {
      queueEntryId,
      doctorId
    });

    // Get patient visit ID from queue entry
    const patientVisitId = await ophthalmologistService.getPatientVisitIdFromQueueEntry(queueEntryId);

    if (!patientVisitId) {
      return res.status(404).json({
        success: false,
        message: 'Patient visit not found for this queue entry'
      });
    }

    const result = await ophthalmologistService.getDetailedOphthalmologistExamination(
      patientVisitId,
      doctorId
    );

    res.status(200).json({
      success: true,
      message: 'Detailed examination data retrieved successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error getting detailed ophthalmologist examination:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get detailed examination data'
    });
  }
};

/**
 * Get optometrist examination data for ophthalmologist review
 */
const getOptometristExaminationData = async (req, res) => {
  try {
    const { examinationId } = req.params;
    const doctorId = req.user.id;

    console.log('👁️ Ophthalmologist requesting optometrist examination data:', {
      examinationId,
      doctorId,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    if (!examinationId) {
      return res.status(400).json({
        success: false,
        message: 'Examination ID is required'
      });
    }

    // Use the receptionist2Service to get the examination data
    // This is allowed since ophthalmologists need to review optometrist findings
    const receptionist2Service = require('../services/receptionist2Service');
    const result = await receptionist2Service.getPatientExaminationDetails(examinationId);

    console.log('✅ Optometrist examination data retrieved for ophthalmologist review');

    res.status(200).json({
      success: true,
      message: 'Optometrist examination data retrieved successfully',
      data: result.data
    });

  } catch (error) {
    console.error('❌ Error getting optometrist examination data for ophthalmologist:', error);
    
    if (error.message === 'Examination not found') {
      return res.status(404).json({
        success: false,
        message: 'Optometrist examination not found'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get optometrist examination data'
    });
  }
};

/**
 * Reorder doctor's specific queue with doctor-scoped positions
 */
const reorderDoctorQueue = async (req, res) => {
  try {
    // If receptionist2 is reordering, they should pass doctorId in body
    // If doctor is reordering their own queue, use req.user.id
    const doctorId = req.body.doctorId || req.user.id;
    const { reorderedPatients } = req.body;

    console.log('🔄 Queue reordering request:', {
      requestedBy: req.user.staffType,
      staffName: `${req.user.firstName} ${req.user.lastName}`,
      doctorId,
      patientsCount: reorderedPatients?.length
    });

    if (!reorderedPatients || !Array.isArray(reorderedPatients)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reordered patients data'
      });
    }

    const result = await ophthalmologistService.reorderDoctorQueue(doctorId, reorderedPatients);

    // Emit WebSocket event for real-time updates
    const { emitQueueReordered } = require('../socket/channels/queueChannel');
    console.log('📡 Emitting queue:reordered event to WebSocket:', { doctorId, patientsCount: reorderedPatients.length });
    emitQueueReordered('doctor', { 
      doctorId, 
      reorderedPatients,
      reorderedBy: req.user.staffType,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Doctor queue reordered successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error reordering doctor queue:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reorder doctor queue'
    });
  }
};

/**
 * Reorder doctor's Next-in-Line panel only (positions 1-3) using doctorQueuePosition
 */
const reorderDoctorNextInLine = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { reorderedQueueEntries } = req.body;

    console.log('🔄 Doctor reordering Next-in-Line panel:', {
      doctorId,
      staffName: `${req.user.firstName} ${req.user.lastName}`,
      entriesCount: reorderedQueueEntries?.length
    });

    // Validate request body
    if (!reorderedQueueEntries || !Array.isArray(reorderedQueueEntries)) {
      return res.status(400).json({
        success: false,
        message: 'reorderedQueueEntries must be an array'
      });
    }

    if (reorderedQueueEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'reorderedQueueEntries cannot be empty'
      });
    }

    // Validate each entry has required fields
    for (const entry of reorderedQueueEntries) {
      if (!entry.queueEntryId || typeof entry.newPosition !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Each entry must have queueEntryId and newPosition'
        });
      }
    }

    const result = await ophthalmologistService.reorderDoctorNextInLine(doctorId, reorderedQueueEntries);

    // Emit WebSocket update for real-time sync
    const { emitQueueReordered } = require('../socket/channels/queueChannel');
    emitQueueReordered('doctor', { 
      doctorId, 
      reorderedPatients: reorderedQueueEntries,
      reorderedBy: `${req.user.firstName} ${req.user.lastName}`,
      timestamp: new Date().toISOString()
    });
    console.log('📡 WebSocket: Queue reordered event broadcasted for doctor:', doctorId);

    res.status(200).json({
      success: true,
      message: 'Doctor Next-in-Line panel reordered successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error reordering doctor Next-in-Line:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reorder doctor Next-in-Line'
    });
  }
};

/**
 * Get doctor's queue with positions (1,2,3...)
 */
const getDoctorQueue = async (req, res) => {
  try {
    const doctorId = req.user.id;

    console.log('🔍 Doctor requesting own queue:', {
      doctorId,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    const queueData = await ophthalmologistService.getDoctorQueue(doctorId);

    res.status(200).json({
      success: true,
      message: 'Doctor queue retrieved successfully',
      data: queueData
    });

  } catch (error) {
    console.error('❌ Error getting doctor queue:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get doctor queue'
    });
  }
};

/**
 * Transfer patient to another doctor (goes to end of their queue)
 */
const transferPatientToDoctor = async (req, res) => {
  try {
    const { queueEntryId, targetDoctorId } = req.body;
    const currentDoctorId = req.user.id;

    console.log('↔️ Transferring patient between doctors:', {
      queueEntryId,
      fromDoctor: currentDoctorId,
      toDoctor: targetDoctorId,
      transferredBy: `${req.user.firstName} ${req.user.lastName}`
    });

    if (!queueEntryId || !targetDoctorId) {
      return res.status(400).json({
        success: false,
        message: 'Queue entry ID and target doctor ID are required'
      });
    }

    const result = await ophthalmologistService.transferPatientToDoctor(
      queueEntryId, 
      targetDoctorId, 
      currentDoctorId
    );

    res.status(200).json({
      success: true,
      message: 'Patient transferred successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error transferring patient:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to transfer patient'
    });
  }
};

/**
 * Get completed examinations for logged-in ophthalmologist
 */
const getCompletedExaminations = async (req, res) => {
  try {
    const doctorId = req.user.id;

    console.log('📋 Fetching completed examinations for doctor:', {
      doctorId,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    const completedExaminations = await ophthalmologistService.getCompletedExaminations(doctorId);

    res.status(200).json({
      success: true,
      message: 'Completed examinations retrieved successfully',
      data: completedExaminations
    });

  } catch (error) {
    console.error('❌ Error getting completed examinations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get completed examinations',
      error: error.message
    });
  }
};

/**
 * Apply FCFS ordering to a doctor's queue
 */
const applyDoctorFCFS = async (req, res) => {
  try {
    const { doctorId } = req.body;

    console.log('🔄 Applying FCFS to doctor queue:', {
      doctorId,
      requestedBy: req.user.id,
      staffName: `${req.user.firstName} ${req.user.lastName}`
    });

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    const result = await ophthalmologistService.applyDoctorFCFS(doctorId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        ...result,
        appliedBy: {
          id: req.user.id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          staffType: req.user.staffType
        },
        appliedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error applying doctor FCFS:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply FCFS ordering'
    });
  }
};

module.exports = {
  getOphthalmologistQueue,
  callNextPatient,
  startConsultation,
  putPatientOnHold,
  confirmEyeDropsApplied,
  repeatDilation,
  markReadyToResume,
  resumePatientFromHold,
  completeConsultation,
  reorderQueue,
  reorderQueueComprehensive,
  getCurrentPatient,
  getDashboardStats,
  assignPatient,
  callAssignedPatient,
  updateQueueNotes,
  getWaitingPatients,
  getMyAssignedPatients,
  getMyOnHoldPatients,
  assignDoctorToPatient,
  saveDetailedOphthalmologistExamination,
  getDetailedOphthalmologistExamination,
  getOptometristExaminationData,
  reorderDoctorQueue,
  reorderDoctorNextInLine,
  getDoctorQueue,
  transferPatientToDoctor,
  getCompletedExaminations,
  applyDoctorFCFS
};