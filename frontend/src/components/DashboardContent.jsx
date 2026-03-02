// src/components/DashboardContent.jsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bell, Users, Calendar, Eye, Activity, Clock, QrCode, RefreshCw, X } from "lucide-react";
import AppointmentScheduler from "@/components/AppointmentScheduler";
import QueueManagement from "@/components/QueueManagement";
import StaffDashboard from "@/components/StaffDashboard";
import DigitalDisplay from "@/components/DigitalDisplay";
import QueueStatusCard from "@/components/dashboard/QueueStatusCard";
import TodaysSurgeriesCard from "@/components/dashboard/TodaysSurgeriesCard";
import PatientRegistration from "@/components/PatientRegistration";
import RecentRegistrationsCard from "@/components/dashboard/RecentRegistrationsCard";
import OphthalmologistQueueManagement from "@/components/doctor/OphthalmologistQueueManagement";
import CurrentQueue from "@/components/staff/CurrentQueue";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboardService";

const DashboardContent = () => {
  const [queueDialogOpen, setQueueDialogOpen] = useState(false);
  const [activeQueueType, setActiveQueueType] = useState(null); // 'ophthalmologist' or 'optometrist'
  // Fetch combined dashboard data with TanStack Query
  // Real-time updates via WebSocket (no polling needed)
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-combined'],
    queryFn: dashboardService.getCombinedDashboardData,
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data stale after 30 seconds
    cacheTime: 60000, // Cache for 60 seconds
  });

  const activePatients = dashboardData?.stats?.patients?.activeToday || 0;
  const todayAppointments = dashboardData?.stats?.appointments?.today || 0;
  const queueLength =
    (dashboardData?.queueStatus?.OPTOMETRIST?.length || 0) +
    (dashboardData?.queueStatus?.OPHTHALMOLOGIST?.length || 0);
  const surgeryScheduled = dashboardData?.surgeries?.length || 0;

  const stats = [
    {
      title: "Active Patients",
      value: activePatients,
      icon: Users,
      color: "bg-blue-500",
      description: "Currently in hospital"
    },
    {
      title: "Today's Appointments",
      value: todayAppointments,
      icon: Calendar,
      color: "bg-green-500",
      description: "Scheduled for today"
    },
    {
      title: "Queue Length",
      value: queueLength,
      icon: Clock,
      color: "bg-orange-500",
      description: "Patients waiting"
    },
    {
      title: "Surgeries Scheduled",
      value: surgeryScheduled,
      icon: Eye,
      color: "bg-purple-500",
      description: "Operations today"
    }
  ];

  // Handle queue view navigation
  const handleViewQueue = (queueType) => {
    setActiveQueueType(queueType);
    setQueueDialogOpen(true);
  };

  const handleCloseQueueDialog = () => {
    setQueueDialogOpen(false);
    setActiveQueueType(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden bg-white shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold text-gray-900">
                        {isLoading ? (
                          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        ) : (
                          stat.value
                        )}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg shadow-sm`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white p-1 rounded-lg shadow-md border mb-6">
            <TabsTrigger value="queue" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Real-time Queue
            </TabsTrigger>
            <TabsTrigger value="surgery" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Surgery Schedule
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Patients
            </TabsTrigger>
            <TabsTrigger value="appointments" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Appointments
            </TabsTrigger>
            <TabsTrigger value="staff" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Staff
            </TabsTrigger>
            <TabsTrigger value="display" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Display
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-4">
            {/* Queue Status with Ophthalmologist/Optometrist Tabs */}
            <QueueStatusCard onViewQueue={handleViewQueue} />
          </TabsContent>

          <TabsContent value="surgery" className="space-y-4">
            {/* Today's Scheduled Surgeries */}
            <TodaysSurgeriesCard />
          </TabsContent>

          <TabsContent value="patients">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Registration Form - Left */}
              <PatientRegistration />

              {/* Recent Registrations - Right */}
              <RecentRegistrationsCard />
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentScheduler />
          </TabsContent>

          <TabsContent value="staff">
            <StaffDashboard />
          </TabsContent>

          <TabsContent value="display">
            <DigitalDisplay />
          </TabsContent>
        </Tabs>

        {/* Queue Management Dialog */}
        <Dialog open={queueDialogOpen} onOpenChange={setQueueDialogOpen}>
          <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto" aria-describedby="queue-dialog-description">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center justify-between">
                <span className={activeQueueType === 'ophthalmologist' ? 'text-purple-700' : 'text-blue-700'}>
                  {activeQueueType === 'ophthalmologist' ? 'Ophthalmologist' : 'Optometrist'} Queue Management
                </span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleCloseQueueDialog}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
              <p id="queue-dialog-description" className="text-sm text-gray-600">
                Manage and monitor the {activeQueueType === 'ophthalmologist' ? 'ophthalmologist' : 'optometrist'} queue with full administrative access.
              </p>
            </DialogHeader>

            <div className="mt-4">
              {activeQueueType === 'ophthalmologist' && (
                <OphthalmologistQueueManagement hideHeader={true} />
              )}

              {activeQueueType === 'optometrist' && (
                <CurrentQueue
                  queryKey={['admin-optometrist-queue']}
                  queryFn={async () => {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/optometrist/queue`, {
                      method: 'GET',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' }
                    });
                    if (!response.ok) {
                      const errorData = await response.json().catch(() => ({}));
                      throw new Error(errorData.message || 'Failed to fetch optometrist queue');
                    }
                    const data = await response.json();
                    return data;
                  }}
                  enablePriorityUpdate={true}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>

  );
};

export default DashboardContent;



