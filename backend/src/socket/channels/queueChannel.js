/**
 * Queue Channel - Handles all queue-related real-time events
 * 
 * Rooms:
 * - 'doctor-queue' - All doctors watching their queues
 * - 'doctor-queue:{doctorId}' - Specific doctor's queue
 * - 'receptionist2-queue' - Receptionist2 watching eye drop queue
 * - 'optometrist-queue' - Optometrists watching their queue
 * - 'ophthalmologist-queue' - General ophthalmologist queue
 */

const pushService = require('../../services/pushNotificationService');

module.exports = (io, socket) => {
  // Join doctor's personal queue room
  socket.on('queue:join-doctor', (doctorId) => {
    const room = `doctor-queue:${doctorId}`;
    socket.join(room);
    socket.join('doctor-queue'); // Also join general doctor room
    console.log(`👨‍⚕️ Doctor ${doctorId} joined room: ${room}`);
    socket.emit('queue:joined', { room, type: 'doctor' });
  });

  // Join receptionist2 eye drop queue room
  socket.on('queue:join-receptionist2', () => {
    socket.join('receptionist2-queue');
    console.log('👩‍💼 Receptionist2 joined eye drop queue room');
    socket.emit('queue:joined', { room: 'receptionist2-queue', type: 'receptionist2' });
  });

  // Join optometrist queue room
  socket.on('queue:join-optometrist', () => {
    socket.join('optometrist-queue');
    console.log('👓 Optometrist joined queue room');
    socket.emit('queue:joined', { room: 'optometrist-queue', type: 'optometrist' });
  });

  // Join general ophthalmologist queue room
  socket.on('queue:join-ophthalmologist', () => {
    socket.join('ophthalmologist-queue');
    console.log('👁️ Joined general ophthalmologist queue room');
    socket.emit('queue:joined', { room: 'ophthalmologist-queue', type: 'ophthalmologist' });
  });

  // Leave rooms on disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Client left all queue rooms');
  });
};

/**
 * Helper functions to emit queue events from backend routes
 * Import these in your route files
 */

// Emit when patient is put on hold (doctor → receptionist2)
const emitPatientOnHold = (patientData) => {
  try {
    const { getIO } = require('../index');
    const io = getIO();
    
    // Notify receptionist2 - new patient in eye drop queue
    io.to('receptionist2-queue').emit('queue:patient-on-hold', patientData);
    
    // Notify the specific doctor - patient removed from their queue
    if (patientData.doctorId) {
      io.to(`doctor-queue:${patientData.doctorId}`).emit('queue:patient-removed', patientData);
    }
    
    // Notify all doctors - general queue updated
    io.to('doctor-queue').emit('queue:updated', { action: 'patient-on-hold' });
    
    // 📱 Push notification to receptionist2 staff
    const patientName = patientData.patientName || 'A patient';
    pushService.sendToStaffType('receptionist2', {
      title: '💧 Eye Drops Required',
      body: `${patientName} needs eye drops applied`,
      data: { type: 'patient-on-hold', ...patientData },
    });

    console.log('📡 Emitted patient-on-hold event:', patientData.patientId);
  } catch (error) {
    console.error('❌ Error emitting patient-on-hold:', error.message);
  }
};

// Emit when eye drops are applied (receptionist2 → doctor)
const emitEyeDropsApplied = (patientData) => {
  try {
    const { getIO } = require('../index');
    const io = getIO();
    
    // Notify receptionist2 - patient removed from eye drop queue
    io.to('receptionist2-queue').emit('queue:patient-removed', patientData);
    
    // Notify the specific doctor - patient back in their queue
    if (patientData.doctorId) {
      io.to(`doctor-queue:${patientData.doctorId}`).emit('queue:patient-available', patientData);
    }
    
    // 📱 Push notification to the specific doctor
    if (patientData.doctorId) {
      const patientName = patientData.patientName || 'A patient';
      pushService.sendToStaff([patientData.doctorId], {
        title: '✅ Eye Drops Applied',
        body: `${patientName} is ready - eye drops have been applied`,
        data: { type: 'eye-drops-applied', ...patientData },
      });
    }

    console.log('📡 Emitted eye-drops-applied event:', patientData.patientId);
  } catch (error) {
    console.error('❌ Error emitting eye-drops-applied:', error.message);
  }
};

// Emit when doctor processes patient
const emitPatientProcessed = (patientData) => {
  try {
    const { getIO } = require('../index');
    const io = getIO();
    
    // Notify the specific doctor
    if (patientData.doctorId) {
      io.to(`doctor-queue:${patientData.doctorId}`).emit('queue:patient-processed', patientData);
    }
    
    // Notify all doctors
    io.to('doctor-queue').emit('queue:updated', { action: 'patient-processed' });
    
    console.log('📡 Emitted patient-processed event:', patientData.patientId);
  } catch (error) {
    console.error('❌ Error emitting patient-processed:', error.message);
  }
};

// Emit when queue is reordered
const emitQueueReordered = (queueType, data) => {
  try {
    const { getIO } = require('../index');
    const io = getIO();
    
    if (queueType === 'doctor' && data.doctorId) {
      // Emit to specific doctor's room
      io.to(`doctor-queue:${data.doctorId}`).emit('queue:reordered', data);
      // ALSO emit to general ophthalmologist queue (for receptionist2)
      io.to('ophthalmologist-queue').emit('queue:reordered', data);
      console.log('📡 Emitted queue-reordered to doctor room and ophthalmologist queue');
    } else if (queueType === 'optometrist') {
      io.to('optometrist-queue').emit('queue:reordered', data);
    } else if (queueType === 'ophthalmologist') {
      io.to('ophthalmologist-queue').emit('queue:reordered', data);
    }
    
    console.log('📡 Emitted queue-reordered event:', queueType);
  } catch (error) {
    console.error('❌ Error emitting queue-reordered:', error.message);
  }
};

// Emit when patient is assigned to doctor
const emitPatientAssigned = (patientData) => {
  try {
    const { getIO } = require('../index');
    const io = getIO();
    
    // Emit to specific doctor's room
    if (patientData.doctorId) {
      io.to(`doctor-queue:${patientData.doctorId}`).emit('queue:patient-assigned', patientData);
      console.log('📡 Emitted patient-assigned to doctor room:', patientData.doctorId);
    }
    
    // ALSO emit to ophthalmologist-queue for receptionist2 and admin
    io.to('ophthalmologist-queue').emit('queue:patient-assigned', patientData);
    io.to('ophthalmologist-queue').emit('queue:updated', { action: 'patient-assigned', ...patientData });
    console.log('📡 Emitted patient-assigned to ophthalmologist-queue');
    
    // 📱 Push notification to the assigned doctor
    if (patientData.doctorId) {
      const patientName = patientData.patientName || 'A patient';
      pushService.sendToStaff([patientData.doctorId], {
        title: '👤 New Patient Assigned',
        body: `${patientName} has been assigned to your queue`,
        data: { type: 'patient-assigned', ...patientData },
      });
    }

    console.log('📡 Emitted patient-assigned event:', patientData.patientId);
  } catch (error) {
    console.error('❌ Error emitting patient-assigned:', error.message);
  }
};

// Emit general queue update
const emitQueueUpdate = (room, data) => {
  try {
    const { getIO } = require('../index');
    const io = getIO();
    io.to(room).emit('queue:updated', data);
    console.log('📡 Emitted queue-updated to room:', room);
  } catch (error) {
    console.error('❌ Error emitting queue-update:', error.message);
  }
};

// Emit when patient is resumed from observation (doctor → receptionist2)
const emitPatientResumed = (patientData) => {
  try {
    const { getIO } = require('../index');
    const io = getIO();
    
    // Notify receptionist2 - patient resumed and added back to eye drop queue
    io.to('receptionist2-queue').emit('queue:patient-resumed', patientData);
    
    // General queue update for receptionist2
    io.to('receptionist2-queue').emit('queue:updated', { action: 'patient-resumed' });
    
    // Notify the specific doctor - patient no longer in observation
    if (patientData.doctorId) {
      io.to(`doctor-queue:${patientData.doctorId}`).emit('queue:patient-resumed', patientData);
    }
    
    // Notify all doctors - general queue updated
    io.to('doctor-queue').emit('queue:updated', { action: 'patient-resumed' });
    
    // 📱 Push notification to receptionist2
    const patientName = patientData.patientName || 'A patient';
    pushService.sendToStaffType('receptionist2', {
      title: '🔄 Patient Resumed',
      body: `${patientName} resumed from observation - needs eye drops`,
      data: { type: 'patient-resumed', ...patientData },
    });

    console.log('📡 Emitted patient-resumed event:', patientData.patientId || patientData.queueEntryId);
  } catch (error) {
    console.error('❌ Error emitting patient-resumed:', error.message);
  }
};

// Emit when patient is marked ready by receptionist2
const emitPatientReady = (patientData) => {
  try {
    const { getIO } = require('../index');
    const io = getIO();
    
    // Notify receptionist2 - patient marked ready in queue
    io.to('receptionist2-queue').emit('queue:patient-ready', patientData);
    
    // General queue update for receptionist2
    io.to('receptionist2-queue').emit('queue:updated', { action: 'patient-ready' });
    
    // 📱 Push notification to the assigned doctor
    if (patientData.doctorId) {
      const patientName = patientData.patientName || 'A patient';
      pushService.sendToStaff([patientData.doctorId], {
        title: '🟢 Patient Ready',
        body: `${patientName} is ready for examination`,
        data: { type: 'patient-ready', ...patientData },
      });
    }

    console.log('📡 Emitted patient-ready event:', patientData.patientId || patientData.queueEntryId);
  } catch (error) {
    console.error('❌ Error emitting patient-ready:', error.message);
  }
};

module.exports.emitPatientOnHold = emitPatientOnHold;
module.exports.emitEyeDropsApplied = emitEyeDropsApplied;
module.exports.emitPatientProcessed = emitPatientProcessed;
module.exports.emitQueueReordered = emitQueueReordered;
module.exports.emitPatientAssigned = emitPatientAssigned;
module.exports.emitQueueUpdate = emitQueueUpdate;
module.exports.emitPatientResumed = emitPatientResumed;
module.exports.emitPatientReady = emitPatientReady;
