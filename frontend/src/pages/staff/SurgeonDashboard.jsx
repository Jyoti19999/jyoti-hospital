import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from '@tanstack/react-query';
import {
  Scissors,
  Calendar,
  Clock,
  FileText,
  User,
  CheckCircle,
  AlertTriangle,
  Activity,
  Users,
  TrendingUp,
  Bell,
  Award,
  Eye,
  Edit,
  Plus,
  ChevronRight,
  Download,
  Target,
  Heart,
  Monitor,
  ClipboardList,
  BarChart3,
  PieChart as PieChartIcon,
  UserCheck,
  Stethoscope,
  Syringe,
  Timer,
  AlertCircle,
  ChevronDown,
  Search,
  Settings,
  LogOut,
  Loader,
  MapPin,
  DollarSign,
  Siren,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileTab from '@/components/ProfileTab';
import StaffSalaryLeave from '@/components/StaffSalaryLeave';
import NotificationCenter from '@/components/NotificationCenter';
import profileService from '@/services/profileService';
import DashboardHeader from '@/components/reuseable-components/DashboardHeader';
import MySurgeries from '@/components/MySurgeries';
import CompletedSurgeries from '@/components/CompletedSurgeries';
import { surgeryService } from '@/services/surgeryService';
import { otAdminService } from '@/services/otAdminService';
import RealTimeOTStatus from '@/components/RealTimeOTStatus';
import OTRoomsManagement from '@/components/ot-admin/OTRoomsManagement';

// Avatar Component - matches ProfileTab implementation
const Avatar = ({ src, alt, fallback, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  // Process image URL using profileService like ProfileTab does
  const imageUrl = src ? profileService.getImageUrl(src) : null;
  
  // Debug logging for image source
  useEffect(() => {
    if (src) {
    }
  }, [src, imageUrl]);
  
  if (imageUrl && !imageError) {
    return (
      <img 
        src={imageUrl} 
        alt={alt} 
        className={`rounded-full object-cover border-2 border-gray-200 ${className}`}
        onError={(e) => {
          setImageError(true);
        }}
        onLoad={() => {
          setImageError(false);
        }}
      />
    );
  }
  return (
    <div className={`rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium border-2 border-blue-200 ${className}`}>
      {fallback}
    </div>
  );
};

const SurgeonDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStatsCards, setShowStatsCards] = useState(true);

  // TanStack Query for dashboard stats with safe background refreshing
  const { data: dashboardStats = {
    totalSurgeries: 0,
    completedSurgeries: 0,
    ongoingSurgery: 0,
    upcomingSurgeries: 0,
    avgSurgeryDuration: 0,
    successRate: 0,
    complicationRate: 0
  }, isLoading: statsLoading } = useQuery({
    queryKey: ['surgeon-dashboard-stats'],
    queryFn: async () => {
      const response = await surgeryService.getSurgeonDashboardStats();
      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to fetch dashboard stats');
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    cacheTime: 30000
  });

  const [todaysSurgeries, setTodaysSurgeries] = useState([]);
  const [surgeriesLoading, setSurgeriesLoading] = useState(false);
  const [otRooms, setOtRooms] = useState([]);  
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    monthlyPerformance: [],
    surgeryDistribution: [],
    performanceMetrics: {
      successRate: 100,
      avgSurgeryDuration: 0,
      complicationRate: 0
    },
    monthlyStatistics: {
      totalSurgeries: 0,
      emergencyCases: 0,
      complications: 0,
      perfectOutcomes: 0
    }
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);  const todayStats = {
    utilization: 87,
    successRate: 98.5,
    avgTurnoverTime: 25,
    waitingPatients: 8
  };

  // Real-time updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch all hospital surgeries for overview (surgeon can now access these endpoints)
  useEffect(() => {
    const fetchAllSurgeries = async () => {
      setSurgeriesLoading(true);
      try {
        // Fetch all today's surgeries from hospital (surgeons now have access)
        const [surgeriesResponse, roomsResponse] = await Promise.all([
          otAdminService.getTodaysSurgeries(),
          otAdminService.getAllOTRooms()
        ]);
        
        if (surgeriesResponse.success) {
          setTodaysSurgeries(surgeriesResponse.data || []);
        }
        
        if (roomsResponse.success) {
          setOtRooms(roomsResponse.data || []);
        }
        
      } catch (error) {
      } finally {
        setSurgeriesLoading(false);
      }
    };

    fetchAllSurgeries();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAllSurgeries, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch analytics data when analytics tab is active
  useEffect(() => {
    if (activeTab === 'analytics') {
      const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
          const response = await surgeryService.getSurgeonAnalytics();
          if (response.success) {
            setAnalyticsData(response.data);
          }
        } catch (error) {
        } finally {
          setAnalyticsLoading(false);
        }
      };
      fetchAnalytics();
    }
  }, [activeTab]);

  // Debug user data
  useEffect(() => {
    if (user) {
    }
  }, [user]);

  // Comprehensive Surgery Data
  const surgeries = [
    {
      id: 1,
      patientName: 'John Doe',
      patientNumber: 'P001234',
      age: 65,
      gender: 'Male',
      procedure: 'Cataract Surgery (Right Eye)',
      procedureCode: 'CPT-66984',
      time: '09:00 AM',
      duration: '45 min',
      actualDuration: '42 min',
      otRoom: 'OT-1',
      status: 'COMPLETED',
      anesthesiologist: 'Dr. Anderson',
      assistantSurgeon: 'Dr. Miller',
      complexity: 'Routine',
      priority: 'Elective',
      diagnosis: 'Age-related cataract',
      complications: 'None',
      bloodLoss: '< 5ml',
      implant: 'IOL Acrysoft IQ',
      visualAcuity: { preOp: '20/80', postOp: '20/25' },
      iop: { preOp: 16, postOp: 14 },
      surgicalNotes: 'Uneventful phacoemulsification. Clear corneal incision.',
      postOpInstructions: 'Prednisolone drops QID x 4 weeks'
    },
    {
      id: 2,
      patientName: 'Jane Wilson',
      patientNumber: 'P001235',
      age: 58,
      gender: 'Female',
      procedure: 'Pars Plana Vitrectomy (Left Eye)',
      procedureCode: 'CPT-67036',
      time: '11:30 AM',
      duration: '120 min',
      actualDuration: '105 min',
      otRoom: 'OT-2',
      status: 'IN_PROGRESS',
      anesthesiologist: 'Dr. Brown',
      assistantSurgeon: 'Dr. Parker',
      complexity: 'Complex',
      priority: 'Urgent',
      diagnosis: 'Proliferative diabetic retinopathy',
      complications: 'Intraoperative bleeding',
      bloodLoss: '15ml',
      findings: 'Severe fibrovascular proliferation, tractional RD',
      currentStep: 'Membrane peeling',
      progress: 65,
      vitals: { hr: 72, bp: '130/85', spo2: 98 }
    },
    {
      id: 3,
      patientName: 'Mike Brown',
      patientNumber: 'P001236',
      age: 72,
      gender: 'Male',
      procedure: 'Trabeculectomy with MMC',
      procedureCode: 'CPT-66170',
      time: '02:00 PM',
      duration: '90 min',
      otRoom: 'OT-3',
      status: 'SCHEDULED',
      anesthesiologist: 'Dr. Davis',
      assistantSurgeon: 'Dr. Thompson',
      complexity: 'Intermediate',
      priority: 'Elective',
      diagnosis: 'Primary open-angle glaucoma',
      preOpIOP: 28,
      targetIOP: '< 15',
      allergies: 'Penicillin',
      medications: ['Timolol', 'Latanoprost', 'Acetazolamide'],
      riskFactors: ['Previous failed trabeculectomy', 'Thin conjunctiva']
    },
    {
      id: 4,
      patientName: 'Sarah Davis',
      patientNumber: 'P001237',
      age: 45,
      gender: 'Female',
      procedure: 'Retinal Detachment Repair',
      procedureCode: 'CPT-67107',
      time: '04:30 PM',
      duration: '150 min',
      otRoom: 'OT-1',
      status: 'SCHEDULED',
      anesthesiologist: 'Dr. Anderson',
      assistantSurgeon: 'Dr. Miller',
      complexity: 'Complex',
      priority: 'Emergency',
      diagnosis: 'Rhegmatogenous retinal detachment',
      detachmentType: 'Macula-off RD',
      tears: ['Superior temporal', '12 o\'clock'],
      approach: 'Scleral buckle + vitrectomy',
      tamponade: 'C3F8 gas'
    }
  ];

  // Performance Analytics Data
  const monthlyStats = [
    { month: 'Jan', surgeries: 45, complications: 2, avgDuration: 65 },
    { month: 'Feb', surgeries: 52, complications: 1, avgDuration: 62 },
    { month: 'Mar', surgeries: 48, complications: 3, avgDuration: 68 },
    { month: 'Apr', surgeries: 55, complications: 1, avgDuration: 60 },
    { month: 'May', surgeries: 50, complications: 2, avgDuration: 64 },
    { month: 'Jun', surgeries: 58, complications: 0, avgDuration: 58 }
  ];

  const surgeryTypes = [
    { name: 'Cataract Surgery', value: 45, color: '#3B82F6' },
    { name: 'Vitrectomy', value: 25, color: '#EF4444' },
    { name: 'Glaucoma Surgery', value: 15, color: '#10B981' },
    { name: 'Retinal Surgery', value: 10, color: '#F59E0B' },
    { name: 'Corneal Surgery', value: 5, color: '#8B5CF6' }
  ];

  const weeklyPerformance = [
    { day: 'Mon', surgeries: 8, avgDuration: 62, successRate: 100 },
    { day: 'Tue', surgeries: 10, avgDuration: 58, successRate: 95 },
    { day: 'Wed', surgeries: 7, avgDuration: 65, successRate: 100 },
    { day: 'Thu', surgeries: 9, avgDuration: 60, successRate: 98 },
    { day: 'Fri', surgeries: 11, avgDuration: 63, successRate: 100 },
    { day: 'Sat', surgeries: 6, avgDuration: 70, successRate: 100 }
  ];

  // Helper functions for overview tab
  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'emergency': case 'critical': return <Siren className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'routine': case 'low': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'surgery_completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'surgery_started': case 'in_progress': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'surgery_scheduled': case 'scheduled': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'emergency': return <Siren className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatSurgeryData = (admission) => {
    const patient = admission.patient || {};
    const surgeon = admission.surgeon || {};

    const calculateAge = (dob) => {
      if (!dob) return 'N/A';
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    return {
      id: admission.id,
      patientName: `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown',
      patientNumber: patient.patientNumber || 'N/A',
      age: calculateAge(patient.dateOfBirth),
      gender: patient.gender || 'N/A',
      surgery: admission.surgeryTypeDetail?.name || 'Surgery',
      surgeon: `${surgeon.firstName || ''} ${surgeon.lastName || ''}`.trim() || 'Not Assigned',
      surgeonId: surgeon.id,
      otRoom: typeof admission.otRoom === 'string' ? admission.otRoom : (admission.otRoom?.roomNumber || 'Not Assigned'),
      surgeryDate: admission.surgeryDate,
      scheduledTime: admission.surgeryDate ? new Date(admission.surgeryDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A',
      status: admission.status || 'SCHEDULED',
      priority: admission.priority || 'ROUTINE',
      notes: admission.notes || '',
      estimatedCost: admission.estimatedCost || 0,
      admissionNumber: admission.admissionNumber
    };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Completed': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'SURGERY_COMPLETED': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'In Progress': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Activity },
      'SURGERY_STARTED': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Activity },
      'Scheduled': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'SURGERY_SCHEDULED': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'Emergency': { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle },
      'EMERGENCY': { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle }
    };
    
    const config = statusConfig[status] || statusConfig['Scheduled'];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {status?.replace('SURGERY_', '').replace('_', ' ')}
      </Badge>
    );
  };

  const getComplexityBadge = (complexity) => {
    const complexityConfig = {
      'Routine': { bg: 'bg-green-100', text: 'text-green-800' },
      'Intermediate': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'Complex': { bg: 'bg-red-100', text: 'text-red-800' }
    };
    
    const config = complexityConfig[complexity] || complexityConfig['Routine'];
    
    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {complexity}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Surgeon Dashboard...</p>
        </div>
      </div>
    );
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
          staffInfo={{
            name: `${user?.firstName} ${user?.lastName}` || user?.name || 'Dr. Surgeon',
            role: "Chief Surgeon",
            employeeId: user?.employeeId || 'SRG001',
            profilePhoto: user?.profilePhoto
          }}
          isCheckedIn={isCheckedIn}
          onCheckInToggle={() => setIsCheckedIn(!isCheckedIn)}
          onLogout={async () => { try { await logout(); } catch (e) {} }}
        />
      </div>

      {/* Main Content Area - flex-1 takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:max-w-[100%] lg:mx-auto lg:px-8 py-4 h-full flex flex-col">

          {/* Enhanced Stats Cards - Responsive Grid */}
          {showStatsCards && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-4 flex-shrink-0">
            <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white overflow-hidden relative">
              <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Surgeries</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
                    {statsLoading ? <Loader className="h-6 w-6 animate-spin" /> : dashboardStats.totalSurgeries}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-200 mt-1">Today</p>
                </div>
                <Scissors className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 h-16 sm:h-20 w-16 sm:w-20 text-white/10" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white overflow-hidden relative">
              <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                <div>
                  <p className="text-green-100 text-xs sm:text-sm font-medium">Completed</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
                    {statsLoading ? <Loader className="h-6 w-6 animate-spin" /> : dashboardStats.completedSurgeries}
                  </p>
                  <p className="text-xs sm:text-sm text-green-200 mt-1">Success: {dashboardStats.successRate}%</p>
                </div>
                <CheckCircle className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 h-16 sm:h-20 w-16 sm:w-20 text-white/10" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white overflow-hidden relative">
              <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">In Progress</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
                    {statsLoading ? <Loader className="h-6 w-6 animate-spin" /> : dashboardStats.ongoingSurgery}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-200 mt-1">Active OTs</p>
                </div>
                <Activity className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 h-16 sm:h-20 w-16 sm:w-20 text-white/10" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white overflow-hidden relative">
              <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                <div>
                  <p className="text-purple-100 text-xs sm:text-sm font-medium">Avg Duration</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
                    {statsLoading ? <Loader className="h-6 w-6 animate-spin" /> : `${dashboardStats.avgSurgeryDuration} min`}
                  </p>
                  <p className="text-xs sm:text-sm text-purple-200 mt-1">Efficiency: 95%</p>
                </div>
                <Clock className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 h-16 sm:h-20 w-16 sm:w-20 text-white/10" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white overflow-hidden relative">
              <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                <div>
                  <p className="text-orange-100 text-xs sm:text-sm font-medium">Complications</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
                    {statsLoading ? <Loader className="h-6 w-6 animate-spin" /> : `${dashboardStats.complicationRate}%`}
                  </p>
                  <p className="text-xs sm:text-sm text-orange-200 mt-1">This Month</p>
                </div>
                <AlertTriangle className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 h-16 sm:h-20 w-16 sm:w-20 text-white/10" />
              </CardContent>
            </Card>
          </div>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="relative flex-shrink-0">
              {/* Scrollable container for mobile */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex sm:grid w-auto sm:w-full sm:grid-cols-7 bg-white p-1 h-auto rounded-lg shadow-sm border min-w-max">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="surgeries" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <Scissors className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">My Surgeries</span>
                    <span className="xs:hidden">Surgeries</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="completed" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Completed
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ot-rooms" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">OT Rooms</span>
                    <span className="xs:hidden">Rooms</span>
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

            <TabsContent value="overview" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <RealTimeOTStatus 
                  todaysSurgeries={todaysSurgeries}
                  otRooms={otRooms}
                  surgeriesLoading={surgeriesLoading}
                  todayStats={todayStats}
                  formatSurgeryData={formatSurgeryData}
                  getStatusBadge={getStatusBadge}
                  getPriorityIcon={getPriorityIcon}
                  getStatusIcon={getStatusIcon}
                  formatCurrency={formatCurrency}
                />
              </div>
            </TabsContent>

            <TabsContent value="surgeries" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <MySurgeries />
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <CompletedSurgeries />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            <span>Monthly Performance</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analyticsData.monthlyPerformance}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <ChartTooltip />
                              <Legend />
                              <Bar dataKey="surgeries" fill="#EF4444" name="Surgeries" />
                              <Bar dataKey="avgDuration" fill="#3B82F6" name="Avg Duration (min)" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <PieChartIcon className="h-5 w-5 text-green-600" />
                            <span>Surgery Distribution</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={analyticsData.surgeryDistribution}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label
                              >
                                {analyticsData.surgeryDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <ChartTooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Target className="h-5 w-5 text-green-600" />
                            <span>Performance Metrics</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="text-center">
                              <p className="text-3xl font-bold text-green-600">
                                {analyticsData.performanceMetrics.successRate}%
                              </p>
                              <p className="text-sm text-gray-600">Success Rate</p>
                            </div>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-blue-600">
                                {analyticsData.performanceMetrics.avgSurgeryDuration} min
                              </p>
                              <p className="text-sm text-gray-600">Avg Surgery Duration</p>
                            </div>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-red-600">
                                {analyticsData.performanceMetrics.complicationRate}%
                              </p>
                              <p className="text-sm text-gray-600">Complication Rate</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Monthly Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span>Total Surgeries:</span>
                              <span className="font-bold">{analyticsData.monthlyStatistics.totalSurgeries}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Emergency Cases:</span>
                              <span className="font-bold">{analyticsData.monthlyStatistics.emergencyCases}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Complications:</span>
                              <span className="font-bold text-red-600">{analyticsData.monthlyStatistics.complications}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Perfect Outcomes:</span>
                              <span className="font-bold text-green-600">{analyticsData.monthlyStatistics.perfectOutcomes}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Generate Reports</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <Button variant="outline" className="w-full justify-start">
                              <FileText className="h-4 w-4 mr-2" />
                              Daily Surgery Report
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <Calendar className="h-4 w-4 mr-2" />
                              Monthly Summary
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Performance Analysis
                            </Button>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                              <Download className="h-4 w-4 mr-2" />
                              Export All Data
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ot-rooms" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <OTRoomsManagement />
              </div>
            </TabsContent>

            <TabsContent value="salary-leave" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <StaffSalaryLeave staffType={user?.staffType} />
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <ProfileTab staffType={user?.staffType || user?.role || 'surgeon'} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SurgeonDashboard;