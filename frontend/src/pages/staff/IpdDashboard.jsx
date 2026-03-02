import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from "@/components/ui/label";
import Loader from "@/components/loader/Loader";
import DashboardHeader from '@/components/reuseable-components/DashboardHeader';
import {
  Users,
  Calendar,
  Clock,
  Eye,
  Activity,
  FileText,
  CheckCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  Timer,
  Stethoscope,
  ClipboardList,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Plus,
  Search,
  Filter,
  ChevronRight
} from "lucide-react";

// Import IPD hooks
import {
  useIpdDashboard,
  useTodaysSurgeries,
  useUpcomingSurgeries,
  useIpdAdmissions
} from '@/hooks/useIpdQueries';

/*
========================================
🏥 IPD DASHBOARD COMPONENT
========================================

Main dashboard for IPD (In-Patient Department) management.
Displays key statistics, today's surgeries, upcoming procedures,
and provides navigation to detailed IPD management features.

Features:
- Real-time statistics
- Today's surgery schedule
- Upcoming surgeries
- Quick actions
- Responsive design with consistent styling
*/

// Statistics Card Component
const StatCard = ({ title, value, icon: Icon, color, change, isLoading }) => {
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                <p className="text-3xl font-bold">{value || 0}</p>
              )}
              {change && (
                <Badge variant={change > 0 ? "default" : "secondary"} className="text-xs">
                  {change > 0 ? '+' : ''}{change}%
                </Badge>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Surgery Card Component
const SurgeryCard = ({ surgery, variant = "default" }) => {
  const formatTime = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getSurgeryTypeColor = (type) => {
    const colors = {
      CATARACT: 'bg-blue-100 text-blue-800',
      GLAUCOMA: 'bg-green-100 text-green-800',
      RETINAL: 'bg-purple-100 text-purple-800',
      CORNEAL: 'bg-orange-100 text-orange-800',
      REFRACTIVE: 'bg-pink-100 text-pink-800',
      OTHER: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.OTHER;
  };

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800', 
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      POSTPONED: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || colors.SCHEDULED;
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-sm border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg">
                {surgery.patient?.firstName} {surgery.patient?.lastName}
              </h3>
              <Badge className={getSurgeryTypeColor(surgery.surgeryType)}>
                {surgery.surgeryType}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Timer className="h-4 w-4" />
                <span>{formatTime(surgery.surgeryDate)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4" />
                <span>{formatDate(surgery.surgeryDate)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Stethoscope className="h-4 w-4" />
                <span>#{surgery.admissionNumber}</span>
              </div>
            </div>
            {surgery.notes && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {surgery.notes}
              </p>
            )}
          </div>
          <div className="ml-4 text-right">
            <Badge className={getStatusColor(surgery.status)}>
              {surgery.status || 'SCHEDULED'}
            </Badge>
            <div className="mt-2">
              <Button variant="outline" size="sm" className="text-xs">
                View Details
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main IPD Dashboard Component
const IpdDashboard = () => {
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Fetch dashboard data using TanStack Query
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useIpdDashboard();

  const {
    data: todaysSurgeriesData,
    isLoading: todaysLoading,
    error: todaysError,
    refetch: refetchTodays
  } = useTodaysSurgeries();

  const {
    data: upcomingSurgeriesData,
    isLoading: upcomingLoading,
    error: upcomingError,
    refetch: refetchUpcoming
  } = useUpcomingSurgeries(7);

  const {
    data: admissionsData,
    isLoading: admissionsLoading,
    refetch: refetchAdmissions
  } = useIpdAdmissions({ page: 1, limit: 5 });

  // Handle loading state
  if (dashboardLoading && todaysLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  // Extract data safely
  const stats = dashboardData?.data?.statistics || {};
  const todaysSurgeries = todaysSurgeriesData?.data || [];
  const upcomingSurgeries = upcomingSurgeriesData?.data || [];
  const recentAdmissions = admissionsData?.data || [];

  // Handle refresh
  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refetchDashboard(),
        refetchTodays(),
        refetchUpcoming(),
        refetchAdmissions()
      ]);
    } catch (error) {
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="IPD Management"
        subtitle="In-Patient Department Dashboard"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Actions Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Admission
            </Button>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search Patients
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={dashboardLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${dashboardLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Admissions"
            value={stats.totalAdmissions}
            icon={Users}
            color="bg-blue-500"
            isLoading={dashboardLoading}
          />
          <StatCard
            title="Today's Surgeries"
            value={stats.todaySurgeries}
            icon={Stethoscope}
            color="bg-green-500"
            isLoading={dashboardLoading}
          />
          <StatCard
            title="Pending Fitness"
            value={stats.pendingFitness}
            icon={ClipboardList}
            color="bg-orange-500"
            isLoading={dashboardLoading}
          />
          <StatCard
            title="Upcoming Surgeries"
            value={stats.upcomingSurgeries}
            icon={Calendar}
            color="bg-purple-500"
            isLoading={dashboardLoading}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="todays">Today's Schedule</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="admissions">Recent Admissions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Surgeries Summary */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">Today's Surgery Schedule</CardTitle>
                  <Stethoscope className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {todaysLoading ? (
                    <Loader />
                  ) : todaysError ? (
                    <div className="text-center py-4">
                      <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Failed to load today's surgeries</p>
                    </div>
                  ) : todaysSurgeries.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No surgeries scheduled for today</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todaysSurgeries.slice(0, 3).map((surgery) => (
                        <SurgeryCard key={surgery.id} surgery={surgery} variant="compact" />
                      ))}
                      {todaysSurgeries.length > 3 && (
                        <Button
                          variant="link"
                          className="w-full"
                          onClick={() => setSelectedTab("todays")}
                        >
                          View all {todaysSurgeries.length} surgeries
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Surgeries Summary */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">Upcoming Procedures</CardTitle>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {upcomingLoading ? (
                    <Loader />
                  ) : upcomingError ? (
                    <div className="text-center py-4">
                      <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Failed to load upcoming surgeries</p>
                    </div>
                  ) : upcomingSurgeries.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No upcoming surgeries scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingSurgeries.slice(0, 3).map((surgery) => (
                        <SurgeryCard key={surgery.id} surgery={surgery} variant="compact" />
                      ))}
                      {upcomingSurgeries.length > 3 && (
                        <Button
                          variant="link"
                          className="w-full"
                          onClick={() => setSelectedTab("upcoming")}
                        >
                          View all {upcomingSurgeries.length} upcoming surgeries
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Quick Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.completedToday || 0}</p>
                    <p className="text-sm text-muted-foreground">Completed Today</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.inProgress || 0}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.pendingFitness || 0}</p>
                    <p className="text-sm text-muted-foreground">Pending Fitness</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Activity className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{stats.thisWeek || 0}</p>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Today's Surgeries Tab */}
          <TabsContent value="todays" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Stethoscope className="h-5 w-5" />
                    <span>Today's Surgery Schedule</span>
                  </span>
                  <Badge variant="outline">
                    {todaysSurgeries.length} surgeries
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaysLoading ? (
                  <Loader />
                ) : todaysError ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
                    <p className="text-muted-foreground mb-4">Unable to fetch today's surgeries</p>
                    <Button onClick={refetchTodays} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : todaysSurgeries.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Surgeries Today</h3>
                    <p className="text-muted-foreground">There are no surgeries scheduled for today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todaysSurgeries.map((surgery) => (
                      <SurgeryCard key={surgery.id} surgery={surgery} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Surgeries Tab */}
          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Upcoming Surgeries (Next 7 Days)</span>
                  </span>
                  <Badge variant="outline">
                    {upcomingSurgeries.length} scheduled
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingLoading ? (
                  <Loader />
                ) : upcomingError ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
                    <p className="text-muted-foreground mb-4">Unable to fetch upcoming surgeries</p>
                    <Button onClick={refetchUpcoming} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : upcomingSurgeries.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Upcoming Surgeries</h3>
                    <p className="text-muted-foreground">No surgeries scheduled for the next 7 days</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSurgeries.map((surgery) => (
                      <SurgeryCard key={surgery.id} surgery={surgery} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Admissions Tab */}
          <TabsContent value="admissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Recent Admissions</span>
                  </span>
                  <Badge variant="outline">
                    {recentAdmissions.length} patients
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {admissionsLoading ? (
                  <Loader />
                ) : recentAdmissions.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Recent Admissions</h3>
                    <p className="text-muted-foreground">No recent IPD admissions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentAdmissions.map((admission) => (
                      <Card key={admission.id} className="transition-all duration-200 hover:shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold">
                                  {admission.patient?.firstName} {admission.patient?.lastName}
                                </h3>
                                <Badge className="bg-blue-100 text-blue-800">
                                  #{admission.admissionNumber}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>Surgery: {admission.surgeryType}</span>
                                <span>Status: {admission.status || 'SCHEDULED'}</span>
                                <span>
                                  Admitted: {new Date(admission.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IpdDashboard;