import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

/**
 * Custom hook to handle WebSocket events
 * @param {string} event - Event name to listen for
 * @param {function} handler - Callback function when event is received
 * @param {array} dependencies - Dependencies array for useEffect
 */
export const useSocketEvent = (event, handler, dependencies = []) => {
  useEffect(() => {
    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, dependencies);
};

/**
 * Hook to join a socket room
 * @param {string} joinEvent - Event to emit to join room
 * @param {object} data - Data to send with join event
 */
export const useSocketRoom = (joinEvent, data) => {
  useEffect(() => {
    if (socket.connected) {
      socket.emit(joinEvent, data);
    }

    const handleConnect = () => {
      socket.emit(joinEvent, data);
    };

    socket.on('connect', handleConnect);

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [joinEvent, JSON.stringify(data)]);
};

/**
 * Hook to get socket connection status
 */
export const useSocketConnection = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return isConnected;
};
