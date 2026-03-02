// src/hooks/useIpdQueries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import ipdService from '@/services/ipdService';

/*
========================================
🏥 IPD TANSTACK QUERY HOOKS
========================================

Custom hooks using TanStack Query for IPD operations.
Provides automatic caching, background updates, and optimistic updates.
*/

// Query Keys
export const ipdQueryKeys = {
  all: ['ipd'],
  admissions: () => [...ipdQueryKeys.all, 'admissions'],
  admission: (id) => [...ipdQueryKeys.admissions(), id],
  fitnessReports: (admissionId) => [...ipdQueryKeys.admission(admissionId), 'fitness-reports'],
  preOpAssessments: (admissionId) => [...ipdQueryKeys.admission(admissionId), 'pre-op-assessments'],
  surgeryMetrics: (admissionId) => [...ipdQueryKeys.admission(admissionId), 'surgery-metrics'],
  todaysSurgeries: () => [...ipdQueryKeys.all, 'todays-surgeries'],
  upcomingSurgeries: (days) => [...ipdQueryKeys.all, 'upcoming-surgeries', days],
  dashboard: () => [...ipdQueryKeys.all, 'dashboard'],
  receptionist2: {
    all: () => [...ipdQueryKeys.all, 'receptionist2'],
    todaysSurgeries: () => [...ipdQueryKeys.receptionist2.all(), 'todays-surgeries'],
    upcomingSurgeries: (days) => [...ipdQueryKeys.receptionist2.all(), 'upcoming-surgeries', days],
    fitnessReports: (params) => [...ipdQueryKeys.receptionist2.all(), 'fitness-reports', params],
    dashboard: () => [...ipdQueryKeys.receptionist2.all(), 'dashboard']
  }
};

// ==========================================
// IPD ADMISSIONS HOOKS
// ==========================================

/**
 * Get all IPD admissions with pagination
 * @param {Object} params - Query parameters
 * @param {Object} options - React Query options
 */
export const useIpdAdmissions = (params = {}, options = {}) => {
  return useQuery({
    queryKey: [...ipdQueryKeys.admissions(), params],
    queryFn: () => ipdService.getAdmissions(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

/**
 * Get single IPD admission by ID
 * @param {string} admissionId - Admission ID
 * @param {Object} options - React Query options
 */
export const useIpdAdmission = (admissionId, options = {}) => {
  return useQuery({
    queryKey: ipdQueryKeys.admission(admissionId),
    queryFn: () => ipdService.getAdmission(admissionId),
    enabled: !!admissionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options
  });
};

/**
 * Create new IPD admission
 */
export const useCreateIpdAdmission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ipdService.createAdmission,
    onSuccess: (data) => {
      // Invalidate and refetch admissions
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.admissions() });
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.dashboard() });
      
      toast({
        title: "Success",
        description: `IPD admission created successfully. Admission Number: ${data.data.admissionNumber}`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create IPD admission",
        variant: "destructive",
      });
    }
  });
};

/**
 * Update IPD admission
 */
export const useUpdateIpdAdmission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ admissionId, updateData }) => ipdService.updateAdmission(admissionId, updateData),
    onSuccess: (data, { admissionId }) => {
      // Update the specific admission in cache
      queryClient.setQueryData(ipdQueryKeys.admission(admissionId), data);
      // Invalidate the admissions list
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.admissions() });
      
      toast({
        title: "Success",
        description: "IPD admission updated successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update IPD admission",
        variant: "destructive",
      });
    }
  });
};

/**
 * Delete IPD admission
 */
export const useDeleteIpdAdmission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ipdService.deleteAdmission,
    onSuccess: (data, admissionId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ipdQueryKeys.admission(admissionId) });
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.admissions() });
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.dashboard() });
      
      toast({
        title: "Success",
        description: "IPD admission deleted successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete IPD admission",
        variant: "destructive",
      });
    }
  });
};

// ==========================================
// FITNESS REPORTS HOOKS
// ==========================================

/**
 * Get fitness reports for admission
 */
export const useFitnessReports = (admissionId, options = {}) => {
  return useQuery({
    queryKey: ipdQueryKeys.fitnessReports(admissionId),
    queryFn: () => ipdService.getFitnessReports(admissionId),
    enabled: !!admissionId,
    staleTime: 2 * 60 * 1000,
    ...options
  });
};

/**
 * Create fitness report
 */
export const useCreateFitnessReport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ admissionId, fitnessData }) => ipdService.createFitnessReport(admissionId, fitnessData),
    onSuccess: (data, { admissionId }) => {
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.fitnessReports(admissionId) });
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.admission(admissionId) });
      
      toast({
        title: "Success",
        description: "Fitness report created successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create fitness report",
        variant: "destructive",
      });
    }
  });
};

/**
 * Update fitness status
 */
export const useUpdateFitnessStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ fitnessReportId, statusData }) => ipdService.updateFitnessStatus(fitnessReportId, statusData),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.all });
      
      toast({
        title: "Success",
        description: "Fitness status updated successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update fitness status",
        variant: "destructive",
      });
    }
  });
};

// ==========================================
// PRE-OP ASSESSMENTS HOOKS
// ==========================================

/**
 * Get pre-op assessments for admission
 */
export const usePreOpAssessments = (admissionId, options = {}) => {
  return useQuery({
    queryKey: ipdQueryKeys.preOpAssessments(admissionId),
    queryFn: () => ipdService.getPreOpAssessments(admissionId),
    enabled: !!admissionId,
    staleTime: 5 * 60 * 1000,
    ...options
  });
};

/**
 * Create pre-op assessment
 */
export const useCreatePreOpAssessment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ admissionId, assessmentData }) => ipdService.createPreOpAssessment(admissionId, assessmentData),
    onSuccess: (data, { admissionId }) => {
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.preOpAssessments(admissionId) });
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.admission(admissionId) });
      
      toast({
        title: "Success",
        description: "Pre-op assessment created successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create pre-op assessment",
        variant: "destructive",
      });
    }
  });
};

// ==========================================
// SURGERY METRICS HOOKS
// ==========================================

/**
 * Get surgery metrics for admission
 */
export const useSurgeryMetrics = (admissionId, options = {}) => {
  return useQuery({
    queryKey: ipdQueryKeys.surgeryMetrics(admissionId),
    queryFn: () => ipdService.getSurgeryMetrics(admissionId),
    enabled: !!admissionId,
    staleTime: 5 * 60 * 1000,
    ...options
  });
};

/**
 * Create surgery metrics
 */
export const useCreateSurgeryMetrics = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ admissionId, metricsData }) => ipdService.createSurgeryMetrics(admissionId, metricsData),
    onSuccess: (data, { admissionId }) => {
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.surgeryMetrics(admissionId) });
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.admission(admissionId) });
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.todaysSurgeries() });
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.dashboard() });
      
      toast({
        title: "Success",
        description: "Surgery metrics recorded successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record surgery metrics",
        variant: "destructive",
      });
    }
  });
};

// ==========================================
// SURGERY SCHEDULING HOOKS
// ==========================================

/**
 * Get today's surgeries
 */
export const useTodaysSurgeries = (options = {}) => {
  return useQuery({
    queryKey: ipdQueryKeys.todaysSurgeries(),
    queryFn: ipdService.getTodaysSurgeries,
    staleTime: 30 * 1000, // 30 seconds (more frequent updates for current day)
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    ...options
  });
};

/**
 * Get upcoming surgeries
 */
export const useUpcomingSurgeries = (days = 7, options = {}) => {
  return useQuery({
    queryKey: ipdQueryKeys.upcomingSurgeries(days),
    queryFn: () => ipdService.getUpcomingSurgeries(days),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options
  });
};

/**
 * Get IPD dashboard statistics
 */
export const useIpdDashboard = (options = {}) => {
  return useQuery({
    queryKey: ipdQueryKeys.dashboard(),
    queryFn: ipdService.getDashboardStats,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    ...options
  });
};

// ==========================================
// RECEPTIONIST2 IPD HOOKS
// ==========================================

/**
 * Receptionist2: Get today's surgeries
 */
export const useReceptionist2TodaysSurgeries = (options = {}) => {
  return useQuery({
    queryKey: ipdQueryKeys.receptionist2.todaysSurgeries(),
    queryFn: ipdService.receptionist2.getTodaysSurgeries,
    staleTime: 30 * 1000,
    refetchInterval: 5 * 60 * 1000,
    ...options
  });
};

/**
 * Receptionist2: Get upcoming surgeries
 */
export const useReceptionist2UpcomingSurgeries = (days = 7, options = {}) => {
  return useQuery({
    queryKey: ipdQueryKeys.receptionist2.upcomingSurgeries(days),
    queryFn: () => ipdService.receptionist2.getUpcomingSurgeries(days),
    staleTime: 2 * 60 * 1000,
    ...options
  });
};

/**
 * Receptionist2: Get fitness reports
 */
export const useReceptionist2FitnessReports = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ipdQueryKeys.receptionist2.fitnessReports(params),
    queryFn: () => ipdService.receptionist2.getFitnessReports(params),
    staleTime: 2 * 60 * 1000,
    ...options
  });
};

/**
 * Receptionist2: Get dashboard statistics
 */
export const useReceptionist2Dashboard = (options = {}) => {
  return useQuery({
    queryKey: ipdQueryKeys.receptionist2.dashboard(),
    queryFn: ipdService.receptionist2.getDashboardStats,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    ...options
  });
};

/**
 * Receptionist2: Create surgery day visit
 */
export const useCreateSurgeryDayVisit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ipdService.receptionist2.createSurgeryDayVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.receptionist2.all() });
      queryClient.invalidateQueries({ queryKey: ipdQueryKeys.todaysSurgeries() });
      
      toast({
        title: "Success",
        description: "Surgery day visit recorded successfully",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record surgery day visit",
        variant: "destructive",
      });
    }
  });
};