import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { optometristQueueService } from '@/services/optometristQueueService';

/**
 * Hook for doctor queue real-time updates
 * Automatically joins doctor's room and updates TanStack Query cache
 */
export const useDoctorQueueSocket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    
    // Ensure socket is connected
    if (!socket.connected) {
      console.log('🔌 Socket not connected, attempting to connect...');
      socket.connect();
    }

    // Function to join rooms
    const joinRooms = () => {
      socket.emit('queue:join-doctor', user.id);
      socket.emit('queue:join-ophthalmologist'); // Join ophthalmologist room too
      console.log('🔌 Joined doctor queue room:', user.id);
    };

    // Join doctor's personal queue room on mount
    joinRooms();

    // Rejoin rooms on reconnection
    const handleReconnect = () => {
      console.log('🔄 Socket reconnected, rejoining doctor queue rooms...');
      joinRooms();
      // Refetch data after reconnection
      queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
      queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
      queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
    };

    socket.on('reconnect', handleReconnect);

    // Listen for patient on hold (removed from my queue)
    const handlePatientRemoved = (data) => {
      queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
      queryClient.invalidateQueries(['doctor-on-hold-patients', user.id]);
      queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
      queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
    };

    // Listen for patient available (back in my queue after eye drops)
    const handlePatientAvailable = (data) => {
      queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
      queryClient.invalidateQueries(['doctor-on-hold-patients', user.id]);
      queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
      queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
    };

    // Listen for patient processed
    const handlePatientProcessed = (data) => {
      queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
      queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
      queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
    };

    // Listen for patient assigned
    const handlePatientAssigned = (data) => {
      queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
      queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
      queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
    };

    // Listen for general queue updates
    const handleQueueUpdate = (data) => {
      console.log('📡 Doctor received queue:updated event:', data);
      queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
      queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
      queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
    };

    // Listen for queue reordered
    const handleQueueReordered = (data) => {
      console.log('📡 Doctor received queue:reordered event:', data);
      queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
      queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
      queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
    };

    // Verify socket connection
    socket.on('queue:joined', (data) => {
    });

    socket.on('queue:patient-removed', handlePatientRemoved);
    socket.on('queue:patient-available', handlePatientAvailable);
    socket.on('queue:patient-processed', handlePatientProcessed);
    socket.on('queue:patient-assigned', handlePatientAssigned);
    socket.on('queue:updated', handleQueueUpdate);
    socket.on('queue:reordered', handleQueueReordered);
    

    return () => {
      socket.off('queue:joined');
      socket.off('queue:patient-removed', handlePatientRemoved);
      socket.off('queue:patient-available', handlePatientAvailable);
      socket.off('queue:patient-processed', handlePatientProcessed);
      socket.off('queue:patient-assigned', handlePatientAssigned);
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('queue:reordered', handleQueueReordered);
      socket.off('reconnect', handleReconnect);
    };
  }, [user?.id, queryClient]);
};

/**
 * Hook to track socket connection status
 * Returns connection state for UI indicators
 */
export const useSocketConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const handleConnect = () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
    };
    
    const handleDisconnect = () => {
      console.log('⚠️ Socket disconnected');
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    // Set initial state
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  return isConnected;
};

/**
 * Hook for receptionist2 eye drop queue real-time updates
 */
export const useReceptionist2QueueSocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Ensure socket is connected
    if (!socket.connected) {
      console.log('🔌 Socket not connected, attempting to connect...');
      socket.connect();
    }

    // Function to join rooms
    const joinRooms = () => {
      socket.emit('queue:join-receptionist2');
      socket.emit('queue:join-ophthalmologist');
      socket.emit('queue:join-optometrist');
      console.log('🔌 Joined receptionist2, ophthalmologist, and optometrist queue rooms');
    };

    // Join rooms on mount
    joinRooms();

    // Rejoin rooms on reconnection
    const handleReconnect = () => {
      console.log('🔄 Socket reconnected, rejoining receptionist2 rooms...');
      joinRooms();
      // Refetch data after reconnection
      queryClient.invalidateQueries(['eyeDropQueue']);
      queryClient.invalidateQueries(['on-hold-stats']);
      queryClient.invalidateQueries(['ophthalmology-queue']);
      queryClient.invalidateQueries(['receptionist2-optometrist-queue']);
    };

    socket.on('reconnect', handleReconnect);

    // Listen for new patient on hold (added to eye drop queue)
    const handlePatientOnHold = (data) => {
      queryClient.invalidateQueries(['eyeDropQueue']);
    };

    // Listen for patient removed (eye drops applied)
    const handlePatientRemoved = (data) => {
      queryClient.invalidateQueries(['eyeDropQueue']);
    };

    // Listen for queue reordered (doctor reordering queue)
    const handleQueueReordered = (data) => {
      console.log('📡 Receptionist2 received queue:reordered event:', data);
      // Invalidate ophthalmologist queue with all filters
      queryClient.invalidateQueries(['ophthalmology-queue']);
      queryClient.invalidateQueries(['ophthalmologist-queue']);
      queryClient.invalidateQueries(['receptionist2-dashboard-stats']);
      queryClient.invalidateQueries(['receptionist-doctor-queue']);
      if (data.doctorId) {
        queryClient.invalidateQueries(['doctor-specific-queue', data.doctorId]);
        queryClient.invalidateQueries(['doctor-assigned-queue', data.doctorId]);
        queryClient.invalidateQueries(['receptionist-doctor-queue', data.doctorId]);
      }
    };

    // Listen for general queue updates
    const handleQueueUpdate = (data) => {
      console.log('📡 Receptionist2 received queue:updated event:', data);
      queryClient.invalidateQueries(['ophthalmology-queue']);
      queryClient.invalidateQueries(['ophthalmologist-queue']);
      queryClient.invalidateQueries(['receptionist2-dashboard-stats']);
      queryClient.invalidateQueries(['receptionist2-optometrist-queue']);
      queryClient.invalidateQueries(['receptionist-doctor-queue']);
      queryClient.invalidateQueries(['ophthalmologists']);
    };

    socket.on('queue:patient-on-hold', handlePatientOnHold);
    socket.on('queue:patient-removed', handlePatientRemoved);
    socket.on('queue:reordered', handleQueueReordered);
    socket.on('queue:updated', handleQueueUpdate);

    return () => {
      socket.off('queue:patient-on-hold', handlePatientOnHold);
      socket.off('queue:patient-removed', handlePatientRemoved);
      socket.off('queue:reordered', handleQueueReordered);
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('reconnect', handleReconnect);
    };
  }, [queryClient]);
};

/**
 * Hook for optometrist queue real-time updates
 */
export const useOptometristQueueSocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Ensure socket is connected
    if (!socket.connected) {
      console.log('🔌 Socket not connected, attempting to connect...');
      socket.connect();
      
      // Wait for connection before proceeding
      const handleConnect = () => {
        console.log('✅ Socket connected successfully for optometrist queue');
        socket.off('connect', handleConnect);
      };
      socket.on('connect', handleConnect);
    }

    // Function to join rooms
    const joinRooms = () => {
      socket.emit('queue:join-optometrist');
      console.log('🔌 Joined optometrist queue socket room');
    };

    // Join optometrist queue room on mount
    joinRooms();

    // Rejoin rooms on reconnection
    const handleReconnect = () => {
      console.log('🔄 Socket reconnected, rejoining optometrist queue room...');
      joinRooms();
      // Force refetch data after reconnection
      setTimeout(() => {
        queryClient.invalidateQueries(['optometrist-queue']);
        queryClient.refetchQueries(['optometrist-queue']);
      }, 500);
    };

    socket.on('reconnect', handleReconnect);

    // Listen for queue updates
    const handleQueueUpdate = async (data) => {
      console.log('📡 Received queue:updated event:', data);
      
      try {
        // Fetch fresh data from API
        const freshData = await optometristQueueService.getOptometristQueue();
        
        // Directly set the data in cache - bypasses all caching logic
        queryClient.setQueryData(['optometrist-queue'], freshData);
        
        // Also invalidate to trigger re-render
        queryClient.invalidateQueries(['optometrist-queue']);
        
        console.log('✅ Queue data updated immediately in cache', freshData);
      } catch (error) {
        console.error('❌ Failed to fetch queue data after socket event:', error);
      }
    };

    const handleQueueReordered = async (data) => {
      console.log('📡 Received queue:reordered event:', data);
      
      try {
        // Fetch fresh data from API
        const freshData = await optometristQueueService.getOptometristQueue();
        
        // Directly set the data in cache - bypasses all caching logic
        queryClient.setQueryData(['optometrist-queue'], freshData);
        
        // Also invalidate to trigger re-render
        queryClient.invalidateQueries(['optometrist-queue']);
        
        console.log('✅ Queue data updated immediately after reorder', freshData);
      } catch (error) {
        console.error('❌ Failed to fetch queue data after reorder:', error);
      }
    };

    socket.on('queue:updated', handleQueueUpdate);
    socket.on('queue:reordered', handleQueueReordered);

    return () => {
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('queue:reordered', handleQueueReordered);
      socket.off('reconnect', handleReconnect);
      console.log('🔌 Left optometrist queue socket room');
    };
  }, [queryClient]);
};

/**
 * Hook for general ophthalmologist queue real-time updates
 */
export const useOphthalmologistQueueSocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Ensure socket is connected
    if (!socket.connected) {
      console.log('🔌 Socket not connected, attempting to connect...');
      socket.connect();
    }

    // Function to join rooms
    const joinRooms = () => {
      socket.emit('queue:join-ophthalmologist');
      console.log('🔌 Joined general ophthalmologist queue room');
    };

    // Join general ophthalmologist queue room on mount
    joinRooms();

    // Rejoin rooms on reconnection
    const handleReconnect = () => {
      console.log('🔄 Socket reconnected, rejoining ophthalmologist queue room...');
      joinRooms();
      // Refetch data after reconnection
      queryClient.invalidateQueries(['ophthalmologist-queue']);
    };

    socket.on('reconnect', handleReconnect);

    // Listen for queue updates
    const handleQueueUpdate = (data) => {
      queryClient.invalidateQueries(['ophthalmologist-queue']);
    };

    const handleQueueReordered = (data) => {
      queryClient.invalidateQueries(['ophthalmologist-queue']);
    };

    socket.on('queue:updated', handleQueueUpdate);
    socket.on('queue:reordered', handleQueueReordered);

    return () => {
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('queue:reordered', handleQueueReordered);
      socket.off('reconnect', handleReconnect);
    };
  }, [queryClient]);
};

/**
 * Hook for IPD/Surgery real-time updates
 * Listens for surgery status changes, completion, etc.
 */
export const useSurgerySocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket.connected) return;

    // Join surgery updates room
    socket.emit('surgery:join');

    // Listen for surgery started
    const handleSurgeryStarted = (data) => {
      queryClient.invalidateQueries(['todays-surgeries']);
      queryClient.invalidateQueries(['surgeon-surgeries']);
      queryClient.invalidateQueries(['ipd-admissions']);
    };

    // Listen for surgery completed
    const handleSurgeryCompleted = (data) => {
      queryClient.invalidateQueries(['todays-surgeries']);
      queryClient.invalidateQueries(['surgeon-surgeries']);
      queryClient.invalidateQueries(['completed-surgeries']);
      queryClient.invalidateQueries(['ipd-admissions']);
    };

    // Listen for surgery status updated
    const handleSurgeryUpdated = (data) => {
      queryClient.invalidateQueries(['todays-surgeries']);
      queryClient.invalidateQueries(['surgeon-surgeries']);
      queryClient.invalidateQueries(['ipd-admissions']);
    };

    // Listen for anesthesia given
    const handleAnesthesiaGiven = (data) => {
      queryClient.invalidateQueries(['todays-surgeries']);
      queryClient.invalidateQueries(['surgeon-surgeries']);
      queryClient.invalidateQueries(['ipd-admissions']);
    };

    // Listen for pre-op completed
    const handlePreOpCompleted = (data) => {
      queryClient.invalidateQueries(['todays-surgeries']);
      queryClient.invalidateQueries(['surgeon-surgeries']);
      queryClient.invalidateQueries(['ipd-admissions']);
    };

    socket.on('surgery:started', handleSurgeryStarted);
    socket.on('surgery:completed', handleSurgeryCompleted);
    socket.on('surgery:updated', handleSurgeryUpdated);
    socket.on('surgery:anesthesia-given', handleAnesthesiaGiven);
    socket.on('surgery:preop-completed', handlePreOpCompleted);

    return () => {
      socket.off('surgery:started', handleSurgeryStarted);
      socket.off('surgery:completed', handleSurgeryCompleted);
      socket.off('surgery:updated', handleSurgeryUpdated);
      socket.off('surgery:anesthesia-given', handleAnesthesiaGiven);
      socket.off('surgery:preop-completed', handlePreOpCompleted);
    };
  }, [queryClient]);
};
