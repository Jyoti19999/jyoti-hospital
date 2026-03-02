import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from 'react-router-dom';
import Loader from "@/components/loader/Loader";
import {
  Users,
  Calendar,
  Clock,
  Stethoscope,
  ClipboardList,
  ArrowRight,
  Activity,
  FileText,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

// Import IPD hooks
import {
  useReceptionist2Dashboard,
  useReceptionist2TodaysSurgeries,
  useReceptionist2FitnessReports
} from '@/hooks/useIpdQueries';

/*
========================================
🏥 IPD MANAGEMENT TAB FOR RECEPTIONIST2
========================================

IPD management interface integrated into Receptionist2 dashboard.
Provides quick access to IPD statistics, today's surgeries, and fitness reports.
*/

const StatCard = ({ title, value, icon: Icon, color, onClick, isLoading }) => {
  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mt-2"></div>
            ) : (
              <p className="text-3xl font-bold mt-2">{value || 0}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {onClick && (
          <div className="mt-4 flex items-center text-sm text-blue-600">
            View Details <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const SurgeryCard = ({ surgery }) => {
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

  return (
    <div className="flex items-center justify-between py-3 px-4 border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Stethoscope className="h-4 w-4 text-blue-600" />
          <span className="font-semibold">
            {surgery.patient?.firstName} {surgery.patient?.lastName}
          </span>
        </div>
        <Badge className={getSurgeryTypeColor(surgery.surgeryType)}>
          {surgery.surgeryType}
        </Badge>
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatTime(surgery.surgeryDate)}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">#{surgery.admissionNumber}</p>
      </div>
    </div>
  );
};

const IpdManagementTab = () => {
  const navigate = useNavigate();

  // Fetch IPD data
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError
  } = useReceptionist2Dashboard();

  const {
    data: todaysSurgeriesData,
    isLoading: todaysLoading,
    error: todaysError
  } = useReceptionist2TodaysSurgeries();

  const {
    data: fitnessReportsData,
    isLoading: fitnessLoading
  } = useReceptionist2FitnessReports({ status: 'PENDING' });

  // Extract data safely
  const stats = dashboardData?.data || {};
  const todaysSurgeries = todaysSurgeriesData?.data?.surgeries || [];
  const fitnessReports = fitnessReportsData?.data?.reports || [];

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader />
      </div>
    );
  }

  if (dashboardError) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load IPD Data</h3>
          <p className="text-muted-foreground">Unable to fetch IPD information</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">IPD Management</h2>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => navigate('/ipd-dashboard')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Open IPD Dashboard
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/ipd-admissions')}
          >
            Manage Admissions
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Surgeries"
          value={stats.todaySurgeries}
          icon={Stethoscope}
          color="bg-blue-500"
          isLoading={dashboardLoading}
          onClick={() => navigate('/ipd-dashboard')}
        />
        <StatCard
          title="Upcoming Surgeries"
          value={stats.upcomingSurgeries}
          icon={Calendar}
          color="bg-green-500"
          isLoading={dashboardLoading}
          onClick={() => navigate('/ipd-dashboard')}
        />
        <StatCard
          title="Pending Fitness"
          value={stats.pendingFitness}
          icon={ClipboardList}
          color="bg-orange-500"
          isLoading={dashboardLoading}
          onClick={() => navigate('/ipd-dashboard')}
        />
        <StatCard
          title="Total Admissions"
          value={stats.totalAdmissions}
          icon={Users}
          color="bg-purple-500"
          isLoading={dashboardLoading}
          onClick={() => navigate('/ipd-admissions')}
        />
      </div>

      {/* Today's Surgery Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
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
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No surgeries scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysSurgeries.slice(0, 4).map((surgery) => (
                  <SurgeryCard key={surgery.id} surgery={surgery} />
                ))}
                {todaysSurgeries.length > 4 && (
                  <Button
                    variant="link"
                    className="w-full"
                    onClick={() => navigate('/ipd-dashboard')}
                  >
                    View all {todaysSurgeries.length} surgeries
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Fitness Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Pending Fitness Reports</CardTitle>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {fitnessLoading ? (
              <Loader />
            ) : fitnessReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pending fitness reports</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fitnessReports.slice(0, 4).map((report) => (
                  <div key={report.id} className="flex items-center justify-between py-2 px-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">
                        {report.admission?.patient?.firstName} {report.admission?.patient?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{report.admission?.admissionNumber} • {report.admission?.surgeryType}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      Pending Review
                    </Badge>
                  </div>
                ))}
                {fitnessReports.length > 4 && (
                  <Button
                    variant="link"
                    className="w-full"
                    onClick={() => navigate('/ipd-dashboard')}
                  >
                    View all {fitnessReports.length} reports
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/ipd-dashboard')}
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">View Dashboard</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/ipd-admissions')}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Manage Admissions</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/ipd-dashboard')}
            >
              <Stethoscope className="h-6 w-6" />
              <span className="text-sm">Surgery Schedule</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate('/ipd-dashboard')}
            >
              <ClipboardList className="h-6 w-6" />
              <span className="text-sm">Fitness Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IpdManagementTab;