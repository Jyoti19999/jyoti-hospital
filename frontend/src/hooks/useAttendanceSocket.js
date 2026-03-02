import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for attendance real-time updates
 */
export const useAttendanceSocket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket.connected) return;

    // Join attendance room
    socket.emit('attendance:join', user?.id);

    // Listen for check-in events
    const handleCheckIn = (data) => {
      queryClient.invalidateQueries(['attendance-status']);
      queryClient.invalidateQueries(['attendance-list']);
    };

    // Listen for check-out events
    const handleCheckOut = (data) => {
      queryClient.invalidateQueries(['attendance-status']);
      queryClient.invalidateQueries(['attendance-list']);
    };

    // Listen for status changes
    const handleStatusChanged = (data) => {
      queryClient.invalidateQueries(['attendance-status']);
    };

    // Listen for general attendance updates
    const handleAttendanceUpdate = (data) => {
      queryClient.invalidateQueries(['attendance-status']);
      queryClient.invalidateQueries(['attendance-list']);
    };

    socket.on('attendance:check-in', handleCheckIn);
    socket.on('attendance:check-out', handleCheckOut);
    socket.on('attendance:status-changed', handleStatusChanged);
    socket.on('attendance:updated', handleAttendanceUpdate);

    return () => {
      socket.off('attendance:check-in', handleCheckIn);
      socket.off('attendance:check-out', handleCheckOut);
      socket.off('attendance:status-changed', handleStatusChanged);
      socket.off('attendance:updated', handleAttendanceUpdate);
    };
  }, [user?.id, queryClient]);
};
