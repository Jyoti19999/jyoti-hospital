import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import attendanceService from '@/services/attendanceService';
import { toast } from 'react-hot-toast';

export const useAttendance = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [workingHours, setWorkingHours] = useState(0);
  const [currentWorkingHours, setCurrentWorkingHours] = useState(0);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  
  const queryClient = useQueryClient();

  // Query for attendance status
  const {
    data: attendanceStatus,
    isLoading,
    error,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['attendance', 'status'],
    queryFn: async () => {
      try {
        const result = await attendanceService.getStatus();
        return result;
      } catch (error) {
        throw error;
      }
    },
    // ❌ REMOVED POLLING - WebSocket handles updates now!
    // refetchInterval: 30000,
    refetchOnWindowFocus: true, // ✅ KEEP - Refetch when window becomes focused
    retry: 3,
    staleTime: 0, // Always consider data stale to ensure fresh data
    cacheTime: 0, // Don't cache the data
  });

  // Process the fetched data
  useEffect(() => {
    if (attendanceStatus?.success && attendanceStatus?.data) {
      const { 
        isCheckedIn: checkedIn, 
        checkInTime: checkIn, 
        checkOutTime: checkOut, 
        workingHours: hours, 
        currentWorkingHours: currentHours 
      } = attendanceStatus.data;
      
      
      setIsCheckedIn(checkedIn);
      setCheckInTime(checkIn);
      setCheckOutTime(checkOut);
      setWorkingHours(hours || 0);
      setCurrentWorkingHours(currentHours || 0);
    } else if (attendanceStatus?.data?.status === 'NOT_CHECKED_IN') {
      setIsCheckedIn(false);
      setCheckInTime(null);
      setCheckOutTime(null);
      setWorkingHours(0);
      setCurrentWorkingHours(0);
    }
  }, [attendanceStatus]);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      try {
        const result = await attendanceService.checkIn();
        return result;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data?.success) {
        toast.success('Successfully checked in!', {
          icon: '✅',
          duration: 3000,
        });
        
        // Immediate state update for UI responsiveness
        setIsCheckedIn(true);
        setCheckInTime(data.data.checkInTime);
        setCheckOutTime(null);
        setCurrentWorkingHours(0);
        
        // Invalidate and refetch attendance status
        queryClient.invalidateQueries(['attendance']);
        refetchStatus();
      }
    },
    onError: (error) => {
      const errorResponse = error?.response?.data;
      let errorMessage = 'Failed to check in. Please try again.';
      
      if (errorResponse?.message) {
        if (errorResponse.message.includes('Already checked in today') && errorResponse.data?.isCurrentlyCheckedIn) {
          // Currently checked in - show different message
          errorMessage = 'You are already checked in for today. Please check out first if you want to start a new session.';
        } else {
          errorMessage = errorResponse.message;
        }
      }
      
      toast.error(errorMessage, {
        icon: '❌',
        duration: 4000,
      });
    }
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      try {
        const result = await attendanceService.checkOut();
        return result;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data?.success) {
        const hours = data.data.workingHours || 0;
        toast.success(`Successfully checked out! Worked ${hours.toFixed(2)} hours today.`, {
          icon: '✅',
          duration: 4000,
        });
        
        // Immediate state update for UI responsiveness
        setIsCheckedIn(false);
        setCheckOutTime(data.data.checkOutTime);
        setWorkingHours(hours);
        setCurrentWorkingHours(hours);
        
        // Invalidate and refetch attendance status
        queryClient.invalidateQueries(['attendance']);
        refetchStatus();
      }
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.message || 
                           error?.message || 
                           'Failed to check out. Please try again.';
      toast.error(errorMessage, {
        icon: '❌',
        duration: 4000,
      });
    }
  });

  // Toggle check-in/check-out
  const handleCheckInToggle = useCallback(() => {
    if (isCheckedIn) {
      checkOutMutation.mutate();
    } else {
      checkInMutation.mutate();
    }
  }, [isCheckedIn, checkInMutation, checkOutMutation]);

  // Force refresh attendance status
  const forceRefresh = useCallback(async () => {
    await refetchStatus();
  }, [refetchStatus]);

  // Format working hours for display
  const formatWorkingHours = useCallback((hours) => {
    if (!hours || hours === 0) return '0h 0m';
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${wholeHours}h`;
    } else {
      return `${wholeHours}h ${minutes}m`;
    }
  }, []);

  // Format time for display
  const formatTime = useCallback((timeString) => {
    if (!timeString) return null;
    
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Debug logging on state changes
  useEffect(() => {
  }, [isCheckedIn, workingHours, currentWorkingHours, checkInTime, checkOutTime, isLoading, error]);

  // Handle page unload (browser close/tab close/navigation away)
  useEffect(() => {
    const handleBeforeUnload = async (event) => {
      if (isCheckedIn) {
        
        // Use sendBeacon for reliable request on page unload
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
          const success = navigator.sendBeacon(
            `${apiUrl}/attendance/checkout`,
            JSON.stringify({})
          );
          
          if (success) {
          } else {
            // Fallback to fetch with keepalive
            fetch(`${apiUrl}/attendance/checkout`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              keepalive: true
            });
          }
        } catch (error) {
        }
      }
    };

    // Only add event listeners for actual browser/tab close, not tab switching
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
    };
  }, [isCheckedIn]);

  return {
    // State
    isCheckedIn,
    workingHours,
    currentWorkingHours,
    checkInTime,
    checkOutTime,
    
    // Loading states
    isLoading,
    isCheckingIn: checkInMutation.isLoading,
    isCheckingOut: checkOutMutation.isLoading,
    
    // Actions
    handleCheckInToggle,
    refetchStatus,
    forceRefresh,
    
    // Utilities
    formatWorkingHours,
    formatTime,
    
    // Raw data
    attendanceStatus: attendanceStatus?.data,
    error
  };
};