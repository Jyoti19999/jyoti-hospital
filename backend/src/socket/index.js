const { Server } = require('socket.io');
const queueChannel = require('./channels/queueChannel');
const attendanceChannel = require('./channels/attendanceChannel');
const notificationChannel = require('./channels/notificationChannel');


let io;

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) {
          return callback(null, true);
        }

        // Check if origin is allowed
        if (
          origin === 'http://45.119.47.81' ||
          origin.startsWith('http://192.168.0.') ||
          origin.startsWith('https://192.168.0.') ||
          origin.startsWith('http://localhost') ||
          origin.startsWith('https://localhost')
        ) {
          callback(null, true);
        } else {
          console.warn('🚫 Socket.IO CORS blocked origin:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 120000, // Increased to 120 seconds (2 minutes)
    pingInterval: 25000,
    connectTimeout: 45000 // Connection timeout
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Initialize all channels
    queueChannel(io, socket);
    attendanceChannel(io, socket);
    notificationChannel(io, socket);


    socket.on('disconnect', (reason) => {
      console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
    });

    socket.on('error', (error) => {
      console.error('🔴 Socket error:', error);
    });
  });

  console.log('🔌 Socket.IO server initialized');
  return io;
};

/**
 * Get Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};

/**
 * Emit event to specific room
 */
const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
    console.log(`📡 Emitted '${event}' to room '${room}'`);
  }
};

/**
 * Emit event to all connected clients
 */
const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
    console.log(`📡 Emitted '${event}' to all clients`);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToRoom,
  emitToAll
};
