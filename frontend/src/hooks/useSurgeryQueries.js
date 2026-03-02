// src/hooks/useSurgeryQueries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { surgeryService } from '@/services/surgeryService';

/*
========================================
🏥 SURGERY REACT QUERY HOOKS
========================================

React Query hooks for surgery recommendation workflow.
Provides data fetching, caching, and state management.
*/

export const surgeryQueryKeys = {
  all: ['surgery'],
  recommendedPatients: () => [...surgeryQueryKeys.all, 'recommended-patients'],
  surgeryRequests: () => [...surgeryQueryKeys.all, 'surgery-requests'],
  assignments: () => [...surgeryQueryKeys.all, 'assignments']
};

// ==========================================
// RECEPTIONIST2 SURGERY HOOKS
// ==========================================

/**
 * Get patients recommended for surgery by ophthalmologist
 */
export const useSurgeryRecommendedPatients = (options = {}) => {
  return useQuery({
    queryKey: surgeryQueryKeys.recommendedPatients(),
    queryFn: surgeryService.getSurgeryRecommendedPatients,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

/**
 * Update surgery details for a patient (Receptionist2)
 */
export const useUpdateSurgeryDetails = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ patientId, surgeryDetails }) => surgeryService.updateSurgeryDetails(patientId, surgeryDetails),
    onSuccess: (data, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: surgeryQueryKeys.recommendedPatients() });
      queryClient.invalidateQueries({ queryKey: surgeryQueryKeys.surgeryRequests() });
      
      toast({
        title: "Success",
        description: `Surgery details updated successfully for patient`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update surgery details",
        variant: "destructive",
      });
    }
  });
};

// ==========================================
// OT ADMIN SURGERY HOOKS
// ==========================================

/**
 * Get upcoming surgery requests awaiting OT assignment
 */
export const useUpcomingSurgeryRequests = (options = {}) => {
  return useQuery({
    queryKey: surgeryQueryKeys.surgeryRequests(),
    queryFn: surgeryService.getUpcomingSurgeryRequests,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000, // 3 minutes
    ...options
  });
};

/**
 * Assign surgeon and OT room to surgery request (OT Admin)
 */
export const useAssignSurgeryDetails = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ requestId, assignmentDetails }) => surgeryService.assignSurgeryDetails(requestId, assignmentDetails),
    onSuccess: (data, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: surgeryQueryKeys.surgeryRequests() });
      queryClient.invalidateQueries({ queryKey: surgeryQueryKeys.assignments() });
      
      toast({
        title: "Success",
        description: "Surgery details assigned successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign surgery details",
        variant: "destructive",
      });
    }
  });
};