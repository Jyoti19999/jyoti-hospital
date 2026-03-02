import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PriorityQueuePanel from '@/components/optometrist/PriorityQueuePanel';
import PriorityDistributionChart from '@/components/optometrist/PriorityDistributionChart';
import CompletedExamsPanel from '@/components/optometrist/CompletedExamsPanel';
import ExaminationModal from '@/components/optometrist/ExaminationModal';
import { optometristQueueService } from '@/services/optometristQueueService';
import ProfileTab from "@/components/ProfileTab";
import StaffSalaryLeave from "@/components/StaffSalaryLeave";
import Loader from "@/components/loader/Loader";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import useOptometristStore from '@/stores/optometrist';
import DashboardHeader from '@/components/reuseable-components/DashboardHeader';
import { Eye, Activity, Users, Calendar, Clock, Bell, BarChart3, UserCheck, CheckCircle, User, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Helper function to format wait time
const formatWaitTime = (minutes) => {
  if (!minutes || minutes === 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};


// Custom Avatar Component
const Avatar = ({ src, alt, size = 'md', className = '' }) => {
    const [imageError, setImageError] = useState(false);
    
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-20 h-20'
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const getImageUrl = (profilePhoto) => {
        if (!profilePhoto) return null;
        const baseUrl = import.meta.env.VITE_API_IMG_URL || 'http://localhost:8080';
        return `${baseUrl}${profilePhoto}`;
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}>
            {src && !imageError ? (
                <img
                    src={getImageUrl(src)}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                />
            ) : (
                <User className={`${size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : size === 'lg' ? 'h-8 w-8' : 'h-10 w-10'} text-gray-400`} />
            )}
        </div>
    );
};

const OptometristDashboard = () => {
  
  const { user, logout, fetchStaffProfile } = useAuth();
  const navigate = useNavigate();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFetched, setProfileFetched] = useState(false);
  const { totalPatientsInQueue, patientsWaiting, completedPatients, averageConsultationTime, averageWaitTime, getPatientStatistics, patientStatistics } = useOptometristStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showStatsCards, setShowStatsCards] = useState(true);

  // TanStack Query for dashboard stats with safe background refreshing
  const { data: dashboardStatsData } = useQuery({
    queryKey: ['optometrist-dashboard-stats'],
    queryFn: async () => {
      // Call the store method but return the result for query management
      const store = useOptometristStore.getState();
      await store.fetchDashboardStats();
      return {
        totalPatientsInQueue: store.totalPatientsInQueue,
        patientsWaiting: store.patientsWaiting,
        completedPatients: store.completedPatients
      };
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    cacheTime: 30000
  });

  // Clock update - updates every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getPatientStatistics();
  }, [getPatientStatistics]);

    // Fetch today's completed examinations from API
  const { 
    data: completedExamsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['optometrist-completed-exams-today'],
    queryFn: optometristQueueService.getTodaysCompletedExaminations,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true
  });

  const totalCompleted = completedExamsData?.data?.totalCompleted || completedPatients.length;

  // Helper function to check if we have complete profile data
  const hasCompleteProfile = (user) => {
    return user && (
      user.dateOfBirth || 
      user.address || 
      user.emergencyContact ||
      user.qualifications ||
      user.certifications
    );
  };

  // Fetch complete profile data on first render if needed
  useEffect(() => {
    const loadCompleteProfile = async () => {
      // Only fetch once and if user exists but doesn't have complete profile data
      if (user && user.employeeId && !hasCompleteProfile(user) && !profileFetched) {
        
        setProfileLoading(true);
        setProfileFetched(true);
        
        try {
          await fetchStaffProfile();
        } catch (error) {
        } finally {
          setProfileLoading(false);
        }
      }
    };

    // Only run if user exists
    if (user) {
      loadCompleteProfile();
    }
  }, [user?.id, fetchStaffProfile]); // Depend on user ID and fetchStaffProfile

  const handleCheckInToggle = () => setIsCheckedIn(!isCheckedIn);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/staff-auth');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const stats = [
    {
      title: "Total Patients",
      value: patientStatistics?.active ?? 0,
      icon: Users,
      color: "bg-[#3B82F6]",
      description: "Currently in hospital"
    },
    {
      title: "Patients in Queue",
      value: patientsWaiting,
      icon: Calendar,
      color: "bg-[#22C55E]",
      description: "Waiting for examination"
    },
    {
      title: "Exams Done",
      value: totalCompleted,
      icon: CheckCircle,
      color: "bg-[#F97316]",
      description: "Completed today"
    },
    {
      title: "Avg Consultation Time",
      value: `${averageConsultationTime || 0} min`,
      icon: Clock,
      color: "bg-[#A855F7]",
      description: "Per patient today"
    },
    {
      title: "Avg Wait Time",
      value: formatWaitTime(averageWaitTime || 0),
      icon: Activity,
      color: "bg-[#06B6D4]",
      description: "Patient waiting time"
    }
  ];

  // Show loading state if profile is being fetched
  if (profileLoading) {
    return <Loader color="#3B82F6" />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-50/50">
      <style>{`
        /* Hide page-level scrollbars */
        html, body {
          overflow: hidden !important;
          height: 100vh !important;
        }
        
        /* Consistent tab content container */
        .tab-content-container {
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .tab-content-container::-webkit-scrollbar {
          width: 6px;
        }
        .tab-content-container::-webkit-scrollbar-track {
          background-color: #f1f5f9;
          border-radius: 3px;
        }
        .tab-content-container::-webkit-scrollbar-thumb {
          background-color: #cbd5e0;
          border-radius: 3px;
        }
        .tab-content-container::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
        
        /* Firefox scrollbar styling */
        .tab-content-container {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f1f5f9;
        }
      `}</style>

      {/* Fixed Header - flex-shrink-0 prevents it from shrinking */}
      <div className="flex-shrink-0">
        <DashboardHeader
          currentTime={currentTime}
          isCheckedIn={isCheckedIn}
          onCheckInToggle={handleCheckInToggle}
          onLogout={handleLogout}
          staffInfo={{
            name: `${user?.firstName} ${user?.lastName}`,
            role: 'Optometrist - Eye Care Specialist'
          }}
          showNotifications={true}
        />
      </div>

      {/* Main Content Area - flex-1 takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:max-w-[100%] lg:mx-auto lg:px-8 py-4 h-full flex flex-col">
          {/* Enhanced Stats Cards - Responsive Grid */}
          {showStatsCards && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-4 flex-shrink-0">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.title}
                    className={`${stat.color} text-white relative overflow-hidden hover:shadow-lg transition-shadow`}
                  >
                    <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                      <div>
                        <p className="text-white/80 text-xs sm:text-sm">{stat.title}</p>
                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stat.value}</p>
                        <p className="text-xs sm:text-sm text-white/70 mt-1">
                          {stat.description}
                        </p>
                      </div>
                    </CardContent>
                    <Icon className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 h-16 sm:h-20 w-16 sm:w-20 text-white/10" />
                  </Card>
                );
              })}
            </div>
          )}

          <Tabs defaultValue="distribution" className="flex-1 flex flex-col min-h-0">
            <div className="relative flex-shrink-0">
              {/* Scrollable container for mobile */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex sm:grid w-auto sm:w-full sm:grid-cols-5 bg-white p-1 h-auto rounded-lg shadow-sm border min-w-max">
                  <TabsTrigger 
                    value="distribution" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Priority Distribution</span>
                    <span className="xs:hidden">Distribution</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="queue" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Optometrist Queue</span>
                    <span className="xs:hidden">Queue</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="completed" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Completed Exams</span>
                    <span className="xs:hidden">Completed</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="salary-leave" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    Salary & Leave
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profile" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Profile
                  </TabsTrigger>
                </TabsList>
              </div>
              {/* Toggleable button - always visible */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowStatsCards(!showStatsCards)}
                className="absolute top-0 right-0 h-6 w-6 bg-blue-600 text-white hover:bg-blue-700 hover:text-white rounded-full shadow-md z-10"
                title={showStatsCards ? "Hide Stats" : "Show Stats"}
              >
                <ChevronRight className={`h-3 w-3 transition-transform ${showStatsCards ? 'rotate-90' : ''}`} />
              </Button>
            </div>

            <TabsContent value="distribution" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <PriorityDistributionChart />
              </div>
            </TabsContent>

            <TabsContent value="queue" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <PriorityQueuePanel />
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full flex flex-col">
                <CompletedExamsPanel />
              </div>
            </TabsContent>

            <TabsContent value="salary-leave" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <StaffSalaryLeave staffType={user?.staffType} />
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <ProfileTab staffType={user?.staffType} />
              </div>
            </TabsContent>
          </Tabs>

          {/* Modals */}
          <ExaminationModal />
        </div>
      </div>
    </div>
  );
};

export default OptometristDashboard;
