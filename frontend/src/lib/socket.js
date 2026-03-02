import { io } from 'socket.io-client';

// Extract base URL without /api/v1 path
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const SOCKET_URL = API_URL.replace('/api/v1', ''); // Remove API path if present


// Create socket instance with auto-reconnection
export const socket = io(SOCKET_URL, {
  autoConnect: false, // Don't connect immediately, wait for user login
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000, // Increased from 5s to 10s
  reconnectionAttempts: Infinity, // Never give up reconnecting
  withCredentials: true,
  transports: ['websocket', 'polling'],
  timeout: 20000 // Connection timeout
});

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket disconnected:', reason);
  if (reason === 'io server disconnect') {
    // Server disconnected, manually reconnect
    socket.connect();
  }
});

socket.on('connect_error', (error) => {
  console.error('🔴 Socket connection error:', error.message);
});

socket.on('reconnect', (attemptNumber) => {
});

socket.on('reconnect_attempt', (attemptNumber) => {
});

socket.on('reconnect_error', (error) => {
});

socket.on('reconnect_failed', () => {
});

// Helper to connect socket (call after user login)
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

// Helper to disconnect socket (call on logout)
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
