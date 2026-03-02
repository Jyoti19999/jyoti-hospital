import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Activity,
  Calendar,
  Clock,
  FileText,
  Heart,
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  Users,
  TrendingUp,
  Bell,
  Monitor,
  User,
  Eye,
  Settings,
  MapPin,
  Phone,
  Timer,
  Zap,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  BarChart3,
  PieChart as PieChartIcon,
  Shield,
  Mail,
  Target,
  Award,
  BookOpen,
  ClipboardList,
  Thermometer,
  BrainCircuit,
  Siren,
  Wifi,
  WifiOff,
  Battery,
  Gauge,
  Lightbulb,
  Microscope,
  CircuitBoard,
  HardDrive,
  Pause,
  Play,
  RotateCcw,
  RefreshCw,
  Navigation,
  Crosshair,
  Layers,
  GitBranch,
  UserCheck,
  UserX,
  UserPlus,
  MessageSquare,
  Send,
  Archive,
  Star,
  TrendingDown,
  DollarSign,
  Percent,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ExternalLink,
  Copy,
  Share2,
  Printer,
  Save,
  MoreHorizontal,
  Droplets,
  Wind,
  Waves,
  Scissors
} from 'lucide-react';
import NotificationCenter from '@/components/NotificationCenter';
import ProfileTab from '@/components/ProfileTab';
import StaffSalaryLeave from '@/components/StaffSalaryLeave';
import MyCases from '@/components/MyCases';
import RealTimeOTStatus from '@/components/RealTimeOTStatus';
import OTRoomsManagement from '@/components/ot-admin/OTRoomsManagement';
import EquipmentManagement from '@/components/ot-admin/EquipmentManagement';
import { useAuth } from '@/contexts/AuthContext';
import Loader from '@/components/loader/Loader';
import DashboardHeader from '@/components/reuseable-components/DashboardHeader';
import { otAdminService } from '@/services/otAdminService';
import { surgeryService } from '@/services/surgeryService';

// Avatar component for consistent UI
const Avatar = ({ src, alt, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const handleImageError = () => setImageError(true);

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

const AnesthesiologistDashboard = () => {
  const { user, logout, fetchStaffProfile } = useAuth();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFetched, setProfileFetched] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showStatsCards, setShowStatsCards] = useState(true);
  
  // States for OT Admin reused components  
  const [anesthesiaCases, setAnesthesiaCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);

  // TanStack Query for dashboard stats with safe background refreshing
  const { data: todayStats = {
    totalCases: 0,
    completedCases: 0,
    ongoingCases: 0,
    avgCaseDuration: 0,
    successRate: 100,
    complicationRate: 0
  }, isLoading: statsLoading } = useQuery({
    queryKey: ['anesthesiologist-dashboard-stats'],
    queryFn: async () => {
      const response = await surgeryService.getAnesthesiologistDashboardStats();
      if (response.success) {
        const data = response.data;
        return {
          totalCases: data.totalSurgeries || 0,
          completedCases: data.completedSurgeries || 0,
          ongoingCases: data.ongoingSurgery || 0,
          avgCaseDuration: data.avgSurgeryDuration || 0,
          successRate: data.successRate || 100,
          complicationRate: data.complicationRate || 0
        };
      }
      throw new Error('Failed to fetch dashboard stats');
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    cacheTime: 30000
  });

  // Real-time updates simulation
  useEffect(() => {
    if (realTimeEnabled) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 3000); // Update every 3 seconds for anesthesia monitoring
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Profile fetching
  useEffect(() => {
    const hasCompleteProfile = (u) => {
      return u && (u.dateOfBirth || u.address || u.emergencyContact || u.qualifications || u.certifications);
    };

    const loadCompleteProfile = async () => {
      if (user && user.employeeId && !hasCompleteProfile(user) && !profileFetched) {
        setProfileLoading(true);
        setProfileFetched(true);
        try {
          await fetchStaffProfile();
        } catch (err) {
        } finally {
          setProfileLoading(false);
        }
      }
    };

    if (user) loadCompleteProfile();
  }, [user?.id, fetchStaffProfile]);

  // Fetch today's surgeries with TanStack Query
  const { data: todaysSurgeries = [], isLoading: surgeriesLoading } = useQuery({
    queryKey: ['todays-surgeries'],
    queryFn: async () => {
      const response = await otAdminService.getTodaysSurgeries();
      if (response.success) {
        return response.data || [];
      }
      return [];
    },
    refetchInterval: 2000, // Aggressive refetch every 2 seconds
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Fetch OT rooms with TanStack Query
  const { data: otRooms = [], isLoading: otRoomsLoading } = useQuery({
    queryKey: ['ot-rooms'],
    queryFn: async () => {
      const response = await otAdminService.getAllOTRooms();
      if (response.success) {
        return response.data || [];
      }
      return [];
    },
    staleTime: 60000 // OT rooms don't change often
  });

  const updateRealTimeData = () => {
    // Simulate real-time updates for anesthesia monitoring
  };

  // Helper functions for RealTimeOTStatus component
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
      surgeryTimeSlot: admission.surgeryTimeSlot,
      scheduledTime: admission.surgeryTimeSlot || 'Time not set',
      status: admission.status || 'SCHEDULED',
      priority: admission.priority || 'ROUTINE',
      notes: admission.notes || '',
      estimatedCost: admission.estimatedCost || 0,
      admissionNumber: admission.admissionNumber
    };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      SCHEDULED: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      IN_PROGRESS: { color: 'bg-green-100 text-green-800', label: 'In Progress' },
      COMPLETED: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      PREPARING: { color: 'bg-yellow-100 text-yellow-800', label: 'Preparing' },
      CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };
    const config = statusConfig[status] || statusConfig.SCHEDULED;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'EMERGENCY': return <Siren className="h-4 w-4 text-red-600" />;
      case 'URGENT': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'HIGH': return <TrendingUp className="h-4 w-4 text-yellow-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'IN_PROGRESS': return <Activity className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'PREPARING': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Analytics data
  const weeklyStats = [
    { day: 'Mon', cases: 10, complications: 0, avgDuration: 65 },
    { day: 'Tue', cases: 12, complications: 1, avgDuration: 70 },
    { day: 'Wed', cases: 8, complications: 0, avgDuration: 60 },
    { day: 'Thu', cases: 14, complications: 0, avgDuration: 68 },
    { day: 'Fri', cases: 11, complications: 0, avgDuration: 72 },
    { day: 'Sat', cases: 9, complications: 0, avgDuration: 58 },
    { day: 'Sun', cases: 7, complications: 0, avgDuration: 55 }
  ];

  const anesthesiaTypes = [
    { name: 'General', value: 45, color: '#8B5CF6' },
    { name: 'Regional', value: 30, color: '#10B981' },
    { name: 'Local + Sedation', value: 20, color: '#3B82F6' },
    { name: 'MAC', value: 5, color: '#F59E0B' }
  ];

  if (profileLoading) return <Loader color="#8B5CF6" />;

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
            name: `${user?.firstName} ${user?.lastName}`,
            role: "Anesthesiologist - Perioperative Care Specialist",
            employeeId: user?.employeeId,
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
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="z-10">
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Surgeries</p>
                    <p className="text-2xl sm:text-3xl font-bold">
                      {surgeriesLoading ? <Loader color="#ffffff" /> : todayStats.totalCases}
                    </p>
                    <p className="text-blue-200 text-xs sm:text-sm">Today</p>
                  </div>
                  <Scissors className="h-12 w-12 sm:h-14 sm:w-14 text-blue-200 opacity-80" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-800/20"></div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white overflow-hidden relative">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="z-10">
                    <p className="text-green-100 text-xs sm:text-sm font-medium">Completed</p>
                    <p className="text-2xl sm:text-3xl font-bold">
                      {surgeriesLoading ? <Loader color="#ffffff" /> : todayStats.completedCases}
                    </p>
                    <p className="text-green-200 text-xs sm:text-sm">Success Rate: {todayStats.successRate}%</p>
                  </div>
                  <CheckCircle className="h-12 w-12 sm:h-14 sm:w-14 text-green-200 opacity-80" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-green-800/20"></div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white overflow-hidden relative">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="z-10">
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">In Progress</p>
                    <p className="text-2xl sm:text-3xl font-bold">
                      {surgeriesLoading ? <Loader color="#ffffff" /> : todayStats.ongoingCases}
                    </p>
                    <p className="text-blue-200 text-xs sm:text-sm">Active OTs</p>
                  </div>
                  <Activity className="h-12 w-12 sm:h-14 sm:w-14 text-blue-200 opacity-80" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-800/20"></div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white overflow-hidden relative">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="z-10">
                    <p className="text-purple-100 text-xs sm:text-sm font-medium">Avg Duration</p>
                    <p className="text-2xl sm:text-3xl font-bold">
                      {surgeriesLoading ? <Loader color="#ffffff" /> : `${todayStats.avgCaseDuration} min`}
                    </p>
                    <p className="text-purple-200 text-xs sm:text-sm">Efficiency: 98%</p>
                  </div>
                  <Clock className="h-12 w-12 sm:h-14 sm:w-14 text-purple-200 opacity-80" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-800/20"></div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white overflow-hidden relative">
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="z-10">
                    <p className="text-orange-100 text-xs sm:text-sm font-medium">Complications</p>
                    <p className="text-2xl sm:text-3xl font-bold">
                      {surgeriesLoading ? <Loader color="#ffffff" /> : `${todayStats.complicationRate || 0}%`}
                    </p>
                    <p className="text-orange-200 text-xs sm:text-sm">This Month</p>
                  </div>
                  <AlertTriangle className="h-12 w-12 sm:h-14 sm:w-14 text-orange-200 opacity-80" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-orange-800/20"></div>
              </CardContent>
            </Card>
          </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="relative flex-shrink-0">
              <TabsList className="grid w-full grid-cols-6 bg-white p-1 h-auto rounded-lg shadow-sm border">
                <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="cases" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  My Cases
                </TabsTrigger>
                <TabsTrigger value="rooms" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  OT-Rooms
                </TabsTrigger>
                <TabsTrigger value="resources" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm">
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  Resources
                </TabsTrigger>
                {/* <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  Analytics
                </TabsTrigger> */}
                <TabsTrigger value="profile" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  Profile
                </TabsTrigger>
              </TabsList>
              {/* Toggle Stats Button */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowStatsCards(!showStatsCards)}
                className="absolute top-0 right-0 h-6 w-6 bg-purple-600 text-white hover:bg-purple-700 hover:text-white rounded-full shadow-md z-10"
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

            <TabsContent value="cases" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <MyCases />
              </div>
            </TabsContent>

            <TabsContent value="rooms" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <OTRoomsManagement />
              </div>
            </TabsContent>

            <TabsContent value="resources" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <EquipmentManagement />
              </div>
            </TabsContent>

            {/* <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span>Weekly Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={weeklyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Bar dataKey="cases" fill="#8B5CF6" name="Cases" />
                        <Bar dataKey="avgDuration" fill="#3B82F6" name="Avg Duration (min)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChartIcon className="h-5 w-5 text-green-600" />
                      <span>Anesthesia Types</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={anesthesiaTypes}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {anesthesiaTypes.map((entry, index) => (
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
                        <p className="text-3xl font-bold text-green-600">{todayStats.successRate}%</p>
                        <p className="text-sm text-gray-600">Success Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">{todayStats.avgCaseDuration}</p>
                        <p className="text-sm text-gray-600">Avg Case Duration</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-purple-600">{todayStats.complicationRate}%</p>
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
                        <span>Total Cases:</span>
                        <span className="font-bold">247</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Emergency Cases:</span>
                        <span className="font-bold">18</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Complications:</span>
                        <span className="font-bold text-red-600">2</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Perfect Records:</span>
                        <span className="font-bold text-green-600">245</span>
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
                        Daily Case Report
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
            </TabsContent> */}

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
        </div>
      </div>
    </div>
  );
};

export default AnesthesiologistDashboard;