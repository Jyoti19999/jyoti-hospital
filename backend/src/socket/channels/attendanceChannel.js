/**
 * Attendance Channel - Handles staff attendance real-time events
 * 
 * Rooms:
 * - 'attendance' - All users watching attendance status
 * - 'attendance:{staffId}' - Specific staff member's attendance
 */

module.exports = (io, socket) => {
  // Join general attendance room
  socket.on('attendance:join', (staffId) => {
    socket.join('attendance');
    if (staffId) {
      socket.join(`attendance:${staffId}`);
      console.log(`👤 Staff ${staffId} joined attendance room`);
    } else {
      console.log('👥 Joined general attendance room');
    }
    socket.emit('attendance:joined', { room: 'attendance' });
  });

  // Leave rooms on disconnect
  socket.on('disconnect', () => {
    console.log('🔌 Client left attendance rooms');
  });
};

/**
 * Helper functions to emit attendance events from backend routes
 */

// Emit when staff checks in
const emitStaffCheckIn = (staffData) => {
  try {
    const { getIO } = require('../index');
    const io = getIO();
    
    // Notify all watching attendance
    io.to('attendance').emit('attendance:check-in', staffData);
    
    // Notify specific staff member
    if (staffData.staffId) {
      io.to(`attendance:${staffData.staffId}`).emit('attendance:status-changed', {
        status: 'checked-in',
        ...staffData
      });
    }
    
    console.log('📡 Emitted staff-check-in event:', staffData.staffId);
  } catch (error) {
    console.error('❌ Error emitting staff-check-in:', error.message);
  }
};

// Emit when staff checks out
const emitStaffCheckOut = (staffData) => {
  try {
    const { getIO } = require('../index');
    const io = getIO();
    
    // Notify all watching attendance
    io.to('attendance').emit('attendance:check-out', staffData);
    
    // Notify specific staff member
    if (staffData.staffId) {
      io.to(`attendance:${staffData.staffId}`).emit('attendance:status-changed', {
        status: 'checked-out',
        ...staffData
      });
    }
    
    console.log('📡 Emitted staff-check-out event:', staffData.staffId);
  } catch (error) {
    console.error('❌ Error emitting staff-check-out:', error.message);
  }
};

// Emit general attendance update
const emitAttendanceUpdate = (data) => {
  try {
    const { getIO } = require('../index');
    const io = getIO();
    io.to('attendance').emit('attendance:updated', data);
    console.log('📡 Emitted attendance-updated');
  } catch (error) {
    console.error('❌ Error emitting attendance-update:', error.message);
  }
};

module.exports.emitStaffCheckIn = emitStaffCheckIn;
module.exports.emitStaffCheckOut = emitStaffCheckOut;
module.exports.emitAttendanceUpdate = emitAttendanceUpdate;
