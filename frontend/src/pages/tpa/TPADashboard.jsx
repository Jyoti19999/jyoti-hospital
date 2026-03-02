import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  Users,
  Building2,
  Bell,
  Search,
  Filter,
  MoreVertical,
  ArrowRight,
  Activity,
  DollarSign,
  Calendar,
  CalendarDays,
  Eye,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DashboardHeader from '@/components/reuseable-components/DashboardHeaderWithAttendance';
import ProfileTab from '@/components/ProfileTab';
import StaffSalaryLeave from '@/components/StaffSalaryLeave';
import SurgeryScheduler from '@/components/tpa/SurgeryScheduler';
import UpcomingSurgeries from '@/components/tpa/UpcomingSurgeries';
import PendingClaims from '@/components/tpa/PendingClaims';
import ProcessedClaims from '@/components/tpa/ApprovedClaims';
import Overview from '@/components/tpa/Overview';
import { claimService } from '@/services/claimService';
import Loader from '@/components/loader/Loader';

const TPADashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showStatsCards, setShowStatsCards] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, logout } = useAuth();
  
  // Check authentication using main auth context
  useEffect(() => {
    if (!isAuthenticated() || user?.staffType !== 'tpa') {
      navigate('/staff-auth');
    }
  }, [isAuthenticated, user, navigate]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // TanStack Query for analytics with safe background refreshing
  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['tpa-claim-analytics'],
    queryFn: async () => {
      const response = await claimService.getClaimAnalytics();
      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to fetch analytics');
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    cacheTime: 30000,
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
    }
  });
  
  if (!isAuthenticated() || !user || user?.staffType !== 'tpa') {
    return null;
  }
  
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/staff-auth');
  };
  
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
        {/* Reusable Header with Check-in/Checkout */}
        <DashboardHeader
          hospitalName="TPA Claims Management"
          instituteName="Third Party Administrator Portal"
          currentTime={currentTime}
          onLogout={handleLogout}
          staffInfo={{
            name: `${user.firstName} ${user.lastName}`,
            role: 'TPA Staff'
          }}
          showNotifications={true}
        />
      </div>

      {/* Main Content Area - flex-1 takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:max-w-[100%] lg:mx-auto lg:px-8 py-4 h-full flex flex-col">

          {/* Enhanced Stats Cards - Responsive Grid */}
          {loadingAnalytics ? (
            <div className="flex justify-center items-center h-32 mb-4 flex-shrink-0">
              <Loader />
            </div>
          ) : showStatsCards && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 flex-shrink-0">
              <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="z-10">
                      <p className="text-blue-100 text-sm font-medium">Total Claims</p>
                      <p className="text-3xl font-bold">{analytics?.totalClaims || 0}</p>
                      <p className="text-blue-200 text-xs">This Month</p>
                    </div>
                    <FileText className="h-12 w-12 text-blue-300 opacity-80" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-800/20"></div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="z-10">
                      <p className="text-green-100 text-sm font-medium">Approved</p>
                      <p className="text-3xl font-bold">{analytics?.approvedClaims || 0}</p>
                      <p className="text-green-200 text-xs">Success Rate</p>
                    </div>
                    <CheckCircle className="h-12 w-12 text-green-300 opacity-80" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-green-800/20"></div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="z-10">
                      <p className="text-yellow-100 text-sm font-medium">Pending Review</p>
                      <p className="text-3xl font-bold">{analytics?.underProcessClaims || 0}</p>
                      <p className="text-yellow-200 text-xs">Awaiting Action</p>
                    </div>
                    <Clock className="h-12 w-12 text-yellow-300 opacity-80" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-yellow-800/20"></div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="z-10">
                      <p className="text-purple-100 text-sm font-medium">Approval Rate</p>
                      <p className="text-3xl font-bold">{analytics?.approvalRate || 0}%</p>
                      <p className="text-purple-200 text-xs">Performance</p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-purple-300 opacity-80" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-800/20"></div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <div className="relative flex-shrink-0">
              {/* Scrollable container for mobile */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex sm:grid w-auto sm:w-full sm:grid-cols-7 bg-white p-1 h-auto rounded-lg shadow-sm border min-w-max">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pending" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <span className="hidden xs:inline">Pending Claims</span>
                    <span className="xs:hidden">Pending</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="processed" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <span className="hidden xs:inline">Processed Claims</span>
                    <span className="xs:hidden">Processed</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="surgery" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <span className="hidden xs:inline">Surgery Scheduler</span>
                    <span className="xs:hidden">Scheduler</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upcoming-surgeries" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <span className="hidden xs:inline">Upcoming Surgeries</span>
                    <span className="xs:hidden">Upcoming</span>
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

            <TabsContent value="overview" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <Overview />
              </div>
            </TabsContent>

            <TabsContent value="pending" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full flex flex-col">
                <PendingClaims />
              </div>
            </TabsContent>

            <TabsContent value="processed" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full flex flex-col">
                <ProcessedClaims />
              </div>
            </TabsContent>

            <TabsContent value="surgery" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full flex flex-col">
                <SurgeryScheduler />
              </div>
            </TabsContent>

            <TabsContent value="upcoming-surgeries" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full flex flex-col">
                <UpcomingSurgeries />
              </div>
            </TabsContent>

            <TabsContent value="salary-leave" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <StaffSalaryLeave staffType={user?.staffType} />
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <ProfileTab />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TPADashboard;