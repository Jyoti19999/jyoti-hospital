import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import SurgeryTab from '@/components/ot-admin/SurgeryTab';
import CompletedSurgeries from '@/components/ot-admin/CompletedSurgeries';
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
  Settings,
  Calendar,
  Users,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Stethoscope,
  Wrench,
  TrendingUp,
  Bell,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  BarChart3,
  PieChart as PieChartIcon,
  AlertTriangle,
  Shield,
  MapPin,
  Phone,
  Mail,
  Timer,
  Zap,
  Target,
  Award,
  BookOpen,
  ClipboardList,
  Thermometer,
  Heart,
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
  Monitor,
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
  GridIcon,
  ListIcon,
  SortAsc,
  SortDesc,
  Syringe
} from 'lucide-react';
import { User } from 'lucide-react';
import ProfileTab from '@/components/ProfileTab';
import StaffSalaryLeave from '@/components/StaffSalaryLeave';
import { useAuth } from '@/contexts/AuthContext';
import Loader from '@/components/loader/Loader';
import DashboardHeader from '@/components/reuseable-components/DashboardHeader';
import RegistersTab from '@/components/registers/RegistersTab';
import { otAdminService } from '@/services/otAdminService';
import { useSurgerySocket } from '@/hooks/useQueueSocket';
import OTRoomsManagement from '@/components/ot-admin/OTRoomsManagement';
import RealTimeOTStatus from '@/components/RealTimeOTStatus';
import EquipmentManagement from '@/components/ot-admin/EquipmentManagement';

// Small Avatar component (copied pattern from NurseDashboard for consistent UI)
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

const OTAdminDashboard = () => {
  const { user, logout, fetchStaffProfile } = useAuth();
  const queryClient = useQueryClient();
  
  // Enable real-time surgery updates via WebSocket
  useSurgerySocket();
  
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showStatsCards, setShowStatsCards] = useState(true);

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
    refetchInterval: 2000, // Aggressive refetch every 2 seconds for real-time updates
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale for instant updates
  });

  // Fetch completed surgeries count
  const { data: completedSurgeriesCount = 0 } = useQuery({
    queryKey: ['completed-surgeries'],
    queryFn: async () => {
      const response = await otAdminService.getCompletedSurgeries();
      if (response.success) {
        return response.data?.length || 0;
      }
      return 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch OT rooms
  const { data: otRooms = [], isLoading: otRoomsLoading } = useQuery({
    queryKey: ['ot-rooms'],
    queryFn: async () => {
      const response = await otAdminService.getAllOTRooms();
      if (response.success) {
        return response.data || [];
      }
      return [];
    },
    staleTime: 60000, // OT rooms don't change often
  });

  // Clock update used in header
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch full profile if needed (follow pattern from NurseDashboard)
  useEffect(() => {
    const hasCompleteProfile = (u) => {
      return u && (u.dateOfBirth || u.address || u.emergencyContact || u.qualifications || u.certifications);
    };

    const loadCompleteProfile = async () => {
      if (user && user.employeeId && !hasCompleteProfile(user)) {
        setProfileLoading(true);
        try {
          await fetchStaffProfile();
        } catch (err) {
        } finally {
          setProfileLoading(false);
        }
      }
    };

    if (user) loadCompleteProfile();
  }, [user?.id]);

  // Helper function to format surgery data from API
  const formatSurgeryData = (admission) => {
    const patient = admission.patient || {};
    const surgeon = admission.surgeon || {};

    // Calculate age from date of birth
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

  // Enhanced mock data aligned with Prisma schema
  const todayStats = {
    totalSurgeries: 18,
    completedSurgeries: 12,
    ongoingSurgeries: 4,
    scheduledSurgeries: 2,
    otRoomsActive: 4,
    staffOnDuty: 22,
    emergencyScheduled: 3,
    utilization: 87,
    avgDuration: '68 min',
    successRate: 98.5,
    waitingPatients: 8,
    criticalAlerts: 2,
    equipmentIssues: 1,
    totalRevenue: 450000,
    avgTurnoverTime: 25
  };

  // Surgery schedule based on Appointment and PatientVisit models
  const surgerySchedule = [
    {
      id: 'apt_001',
      patientId: 'pat_001',
      visitId: 'visit_001',
      patientName: 'John Smith',
      patientNumber: 10001,
      mrn: 'MRN001',
      age: 65,
      gender: 'Male',
      surgery: 'Phacoemulsification with IOL',
      surgeryType: 'Cataract Surgery',
      surgeon: 'Dr. Williams',
      surgeonId: 'staff_001',
      anesthesiologist: 'Dr. Anderson',
      anesthesiologistId: 'staff_002',
      otRoom: 'OT-1',
      roomId: 'room_001',
      appointmentDate: new Date().toISOString().split('T')[0],
      scheduledTime: '08:00',
      estimatedDuration: 45,
      actualStartTime: '08:15',
      status: 'COMPLETED',
      priority: 'ROUTINE',
      urgencyLevel: 'Low',
      notes: 'Left eye cataract',
      preOpCompleted: true,
      postOpRequired: true,
      complications: null,
      estimatedCost: 25000,
      insuranceCoverage: 80,
      createdAt: new Date('2024-10-31T06:00:00'),
      completedAt: new Date('2024-10-31T09:00:00')
    },
    {
      id: 'apt_002',
      patientId: 'pat_002',
      visitId: 'visit_002',
      patientName: 'Sarah Johnson',
      patientNumber: 10002,
      mrn: 'MRN002',
      age: 58,
      gender: 'Female',
      surgery: 'Pars Plana Vitrectomy',
      surgeryType: 'Retinal Surgery',
      surgeon: 'Dr. Davis',
      surgeonId: 'staff_003',
      anesthesiologist: 'Dr. Thompson',
      anesthesiologistId: 'staff_004',
      otRoom: 'OT-2',
      roomId: 'room_002',
      appointmentDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:30',
      estimatedDuration: 120,
      actualStartTime: '09:45',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      urgencyLevel: 'High',
      notes: 'Macular hole repair',
      preOpCompleted: true,
      postOpRequired: true,
      complications: null,
      estimatedCost: 75000,
      insuranceCoverage: 70,
      createdAt: new Date('2024-10-31T07:30:00'),
      startedAt: new Date('2024-10-31T09:45:00')
    },
    {
      id: 'apt_003',
      patientId: 'pat_003',
      visitId: 'visit_003',
      patientName: 'Michael Brown',
      patientNumber: 10003,
      mrn: 'MRN003',
      age: 72,
      gender: 'Male',
      surgery: 'Trabeculectomy',
      surgeryType: 'Glaucoma Surgery',
      surgeon: 'Dr. Wilson',
      surgeonId: 'staff_005',
      anesthesiologist: 'Dr. Anderson',
      anesthesiologistId: 'staff_002',
      otRoom: 'OT-3',
      roomId: 'room_003',
      appointmentDate: new Date().toISOString().split('T')[0],
      scheduledTime: '11:00',
      estimatedDuration: 90,
      actualStartTime: null,
      status: 'PREPARING',
      priority: 'HIGH',
      urgencyLevel: 'High',
      notes: 'Advanced glaucoma',
      preOpCompleted: true,
      postOpRequired: true,
      complications: null,
      estimatedCost: 45000,
      insuranceCoverage: 75,
      createdAt: new Date('2024-10-31T08:00:00')
    },
    {
      id: 'apt_004',
      patientId: 'pat_004',
      visitId: 'visit_004',
      patientName: 'Emma Davis',
      patientNumber: 10004,
      mrn: 'MRN004',
      age: 45,
      gender: 'Female',
      surgery: 'Emergency Retinal Detachment Repair',
      surgeryType: 'Emergency Surgery',
      surgeon: 'Dr. Martinez',
      surgeonId: 'staff_006',
      anesthesiologist: 'Dr. Thompson',
      anesthesiologistId: 'staff_004',
      otRoom: 'OT-4',
      roomId: 'room_004',
      appointmentDate: new Date().toISOString().split('T')[0],
      scheduledTime: '14:00',
      estimatedDuration: 150,
      actualStartTime: null,
      status: 'EMERGENCY',
      priority: 'EMERGENCY',
      urgencyLevel: 'Critical',
      notes: 'Rhegmatogenous RD',
      preOpCompleted: false,
      postOpRequired: true,
      complications: null,
      estimatedCost: 85000,
      insuranceCoverage: 60,
      createdAt: new Date('2024-10-31T12:30:00')
    }
  ];

  // Staff data based on Staff model
  const staffSchedule = [
    {
      id: 'staff_001',
      employeeId: 'OTA001',
      firstName: 'Dr. Robert',
      lastName: 'Williams',
      staffType: 'surgeon',
      department: 'Ophthalmology',
      phone: '+91-9876543210',
      email: 'dr.williams@hospital.com',
      status: 'available',
      currentLocation: 'OT-1',
      currentActivity: 'Post-op documentation',
      shift: {
        start: '08:00',
        end: '16:00',
        type: 'Day Shift'
      },
      specialization: 'Cataract & Anterior Segment',
      qualifications: ['MS Ophthalmology', 'Fellowship in Cataract Surgery'],
      surgeonProfile: {
        totalSurgeries: 2500,
        successRate: 99.2,
        specialties: ['Cataract', 'Corneal Transplant'],
        yearsExperience: 15
      },
      todaySchedule: [
        { time: '08:00', surgery: 'Cataract Surgery', status: 'completed' },
        { time: '14:30', surgery: 'Corneal Transplant', status: 'scheduled' }
      ],
      availability: 'Available until 16:00',
      performanceRating: 4.9,
      emergencyContact: '+91-9876543211'
    },
    {
      id: 'staff_002',
      employeeId: 'ANE001',
      firstName: 'Dr. Lisa',
      lastName: 'Anderson',
      staffType: 'anesthesiologist',
      department: 'Anesthesiology',
      phone: '+91-9876543220',
      email: 'dr.anderson@hospital.com',
      status: 'on_duty',
      currentLocation: 'OT-1',
      currentActivity: 'Monitoring patient',
      shift: {
        start: '07:00',
        end: '15:00',
        type: 'Day Shift'
      },
      specialization: 'Ophthalmic Anesthesia',
      qualifications: ['MD Anesthesiology', 'Fellowship in Regional Anesthesia'],
      anesthesiologistProfile: {
        totalCases: 3200,
        complications: 0.1,
        specialties: ['Regional', 'General', 'Monitored Care'],
        yearsExperience: 12
      },
      todaySchedule: [
        { time: '08:00', patient: 'John Smith', status: 'completed' },
        { time: '11:00', patient: 'Michael Brown', status: 'scheduled' }
      ],
      availability: 'Available for emergency',
      performanceRating: 4.8,
      emergencyContact: '+91-9876543221'
    },
    {
      id: 'staff_007',
      employeeId: 'SIS001',
      firstName: 'Sister Mary',
      lastName: 'Johnson',
      staffType: 'sister',
      department: 'OT Nursing',
      phone: '+91-9876543230',
      email: 'mary.johnson@hospital.com',
      status: 'on_duty',
      currentLocation: 'OT-1',
      currentActivity: 'Room preparation',
      shift: {
        start: '07:00',
        end: '15:00',
        type: 'Day Shift'
      },
      specialization: 'OT Management',
      qualifications: ['BSc Nursing', 'OT Specialist Certificate'],
      sisterProfile: {
        totalAssists: 5000,
        teamSize: 8,
        specialties: ['Cataract', 'Vitreoretinal', 'Glaucoma'],
        yearsExperience: 18
      },
      todaySchedule: [
        { time: '07:00', activity: 'Room setup', status: 'completed' },
        { time: '14:30', activity: 'Assist surgery', status: 'scheduled' }
      ],
      availability: 'Leading team of 8',
      performanceRating: 4.9,
      emergencyContact: '+91-9876543231'
    }
  ];

  // Equipment data
  const equipmentStatus = [
    {
      id: 'eq_001',
      name: 'Phacoemulsification Machine #1',
      model: 'Centurion Vision System',
      location: 'OT-1',
      status: 'operational',
      batteryLevel: 85,
      temperature: 24,
      lastMaintenance: '2024-10-25',
      nextMaintenance: '2024-11-25',
      hoursUsed: 2456,
      maxHours: 8000,
      efficiency: 94,
      alerts: []
    },
    {
      id: 'eq_002',
      name: 'Vitrectomy System #1',
      model: 'Constellation Vision System',
      location: 'OT-2',
      status: 'in_use',
      batteryLevel: 72,
      temperature: 26,
      lastMaintenance: '2024-10-20',
      nextMaintenance: '2024-11-20',
      hoursUsed: 1890,
      maxHours: 8000,
      efficiency: 98,
      alerts: ['Temperature slightly high']
    },
    {
      id: 'eq_003',
      name: 'Operating Microscope #3',
      model: 'OPMI Lumera 700',
      location: 'OT-3',
      status: 'maintenance_required',
      batteryLevel: 0,
      temperature: 22,
      lastMaintenance: '2024-10-10',
      nextMaintenance: '2024-11-10',
      hoursUsed: 4200,
      maxHours: 8000,
      efficiency: 78,
      alerts: ['Calibration overdue', 'Service required']
    },
    {
      id: 'eq_004',
      name: 'Anesthesia Machine #2',
      model: 'Aisys CS2',
      location: 'OT-4',
      status: 'offline',
      batteryLevel: 0,
      temperature: 20,
      lastMaintenance: '2024-10-30',
      nextMaintenance: '2024-11-30',
      hoursUsed: 3100,
      maxHours: 8000,
      efficiency: 0,
      alerts: ['System offline', 'Emergency replacement needed']
    }
  ];

  // Analytics data for charts
  const weeklyData = [
    { day: 'Mon', surgeries: 15, revenue: 375000, utilization: 85 },
    { day: 'Tue', surgeries: 18, revenue: 450000, utilization: 92 },
    { day: 'Wed', surgeries: 12, revenue: 300000, utilization: 75 },
    { day: 'Thu', surgeries: 20, revenue: 500000, utilization: 95 },
    { day: 'Fri', surgeries: 16, revenue: 400000, utilization: 88 },
    { day: 'Sat', surgeries: 14, revenue: 350000, utilization: 70 },
    { day: 'Sun', surgeries: 10, revenue: 250000, utilization: 60 }
  ];

  const surgeryTypes = [
    { name: 'Cataract', value: 45, color: '#3B82F6' },
    { name: 'Retinal', value: 25, color: '#10B981' },
    { name: 'Glaucoma', value: 20, color: '#F59E0B' },
    { name: 'Emergency', value: 10, color: '#EF4444' }
  ];

  const hourlyUtilization = [
    { hour: '08:00', utilization: 25 },
    { hour: '09:00', utilization: 75 },
    { hour: '10:00', utilization: 100 },
    { hour: '11:00', utilization: 100 },
    { hour: '12:00', utilization: 50 },
    { hour: '13:00', utilization: 75 },
    { hour: '14:00', utilization: 100 },
    { hour: '15:00', utilization: 90 },
    { hour: '16:00', utilization: 75 },
    { hour: '17:00', utilization: 25 }
  ];

  // Utility functions
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': case 'in_use': case 'occupied': case 'on_duty': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled': case 'available': case 'operational': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'emergency': case 'critical': case 'offline': return 'bg-red-100 text-red-800 border-red-200';
      case 'preparing': case 'maintenance_required': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'emergency_ready': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'emergency': return <Siren className="h-4 w-4 text-red-500" />;
      case 'preparing': return <Settings className="h-4 w-4 text-orange-500" />;
      case 'available': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'occupied': return <Users className="h-4 w-4 text-blue-500" />;
      case 'maintenance_required': return <Wrench className="h-4 w-4 text-yellow-500" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTime = (time) => {
    if (!time) return '--:--';
    if (typeof time === 'string') return time;
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    return (
      <Badge className={`${getStatusColor(status)} border flex items-center space-x-1`}>
        {getStatusIcon(status)}
        <span className="capitalize">{status?.replace('_', ' ')}</span>
      </Badge>
    );
  };

  if (profileLoading) return <Loader color="#3B82F6" />;

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
            role: "OT Administrator ⭐ NEW VERSION",
            employeeId: user?.employeeId,
            profilePhoto: user?.profilePhoto
          }}
          isCheckedIn={isCheckedIn}
          onCheckInToggle={() => setIsCheckedIn(!isCheckedIn)}
          onLogout={async () => { try { await logout(); } catch (e) { } }}
        />
      </div>

      {/* Main Content Area - flex-1 takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:max-w-[100%] lg:mx-auto lg:px-8 py-4 h-full flex flex-col">

          {/* Enhanced Stats Cards - Responsive Grid */}
          {showStatsCards && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 flex-shrink-0">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white relative overflow-hidden">
              <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs sm:text-sm">Total Surgeries Today</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{todaysSurgeries.length}</p>
                    <p className="text-xs sm:text-sm text-blue-200 mt-1">Scheduled for today</p>
                  </div>
                  <Calendar className="h-12 w-12 sm:h-14 w-14 text-blue-200 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white relative overflow-hidden">
              <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs sm:text-sm">Completed Surgeries</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{completedSurgeriesCount}</p>
                    <p className="text-xs sm:text-sm text-green-200 mt-1">Total completed</p>
                  </div>
                  <CheckCircle className="h-12 w-12 sm:h-14 w-14 text-green-200 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white relative overflow-hidden">
              <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-xs sm:text-sm">OT Rooms</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{otRooms.length}</p>
                    <p className="text-xs sm:text-sm text-yellow-200 mt-1">
                      {todaysSurgeries.length} surgeries today
                    </p>
                  </div>
                  <MapPin className="h-12 w-12 sm:h-14 w-14 text-yellow-200 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white relative overflow-hidden">
              <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs sm:text-sm">Staff On Duty</p>
                    <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{todayStats.staffOnDuty}</p>
                    <p className="text-xs sm:text-sm text-purple-200 mt-1">All departments</p>
                  </div>
                  <Users className="h-12 w-12 sm:h-14 w-14 text-purple-200 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>
          )}
          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="relative flex-shrink-0">
              {/* Scrollable container for mobile */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex sm:grid w-auto sm:w-full sm:grid-cols-5 lg:grid-cols-10 bg-white p-1 rounded-lg shadow-sm border min-w-max">
                <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Overview</span>
                  <span className="xs:hidden">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="surgery-requests" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                  <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  Surgery
                </TabsTrigger>
                <TabsTrigger value="schedule" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Completed Surgeries</span>
                  <span className="xs:hidden">Completed</span>
                </TabsTrigger>
                <TabsTrigger value="rooms" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">OT Rooms</span>
                  <span className="xs:hidden">Rooms</span>
                </TabsTrigger>
                <TabsTrigger value="resources" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                  <Wrench className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  Resources
                </TabsTrigger>
                <TabsTrigger value="registers" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                  <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  Registers
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="emergency" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                  <Siren className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  Emergency
                </TabsTrigger>
                <TabsTrigger value="salary-leave" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                  Salary & Leave
                </TabsTrigger>
                <TabsTrigger value="profile" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
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

            <TabsContent value="surgery-requests" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <SurgeryTab />
              </div>
            </TabsContent>

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

            <TabsContent value="schedule" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <CompletedSurgeries />
              </div>
            </TabsContent>

            <TabsContent value="rooms" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <OTRoomsManagement />
              </div>
            </TabsContent>

            {/* <TabsContent value="staff" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Staff Management & Coordination</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search staff..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Staff
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {staffSchedule.map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {staff.firstName[0]}{staff.lastName[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-bold text-gray-900">{staff.firstName} {staff.lastName}</h3>
                              <Badge variant="outline" className="text-xs">{staff.employeeId}</Badge>
                              {getStatusBadge(staff.status)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <Label className="text-xs text-gray-500">ROLE & SPECIALIZATION</Label>
                                <p className="font-medium capitalize">{staff.staffType.replace('_', ' ')}</p>
                                <p className="text-gray-600">{staff.specialization}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">CURRENT LOCATION</Label>
                                <p className="flex items-center font-medium">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {staff.currentLocation}
                                </p>
                                <p className="text-gray-600">{staff.currentActivity}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">SHIFT & AVAILABILITY</Label>
                                <p className="flex items-center font-medium">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {staff.shift.start} - {staff.shift.end}
                                </p>
                                <p className="text-gray-600">{staff.availability}</p>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">PERFORMANCE</Label>
                                <div className="flex items-center space-x-2">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  <span className="font-medium">{staff.performanceRating}</span>
                                </div>
                                <p className="text-gray-600">
                                  {staff.surgeonProfile?.totalSurgeries ||
                                    staff.anesthesiologistProfile?.totalCases ||
                                    staff.sisterProfile?.totalAssists || 0} procedures
                                </p>
                              </div>
                            </div>

                            {staff.todaySchedule && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <Label className="text-xs text-gray-500 mb-2 block">TODAY'S SCHEDULE</Label>
                                <div className="flex items-center space-x-4">
                                  {staff.todaySchedule.map((item, idx) => (
                                    <div key={idx} className="flex items-center space-x-2 text-xs">
                                      <span className="font-medium">{item.time}</span>
                                      <span className="text-gray-600">{item.surgery || item.patient || item.activity}</span>
                                      {getStatusBadge(item.status)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent> */}

            <TabsContent value="resources" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <EquipmentManagement />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span>Weekly Surgery Trends</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Line type="monotone" dataKey="surgeries" stroke="#3B82F6" strokeWidth={2} />
                        <Line type="monotone" dataKey="utilization" stroke="#10B981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChartIcon className="h-5 w-5 text-green-600" />
                      <span>Surgery Type Distribution</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={surgeryTypes}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label
                        >
                          {surgeryTypes.map((entry, index) => (
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

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <span>Hourly OT Utilization</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={hourlyUtilization}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <ChartTooltip />
                      <Area type="monotone" dataKey="utilization" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span>Key Metrics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">{todayStats.avgDuration}</p>
                        <p className="text-sm text-gray-600">Avg Surgery Duration</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{todayStats.successRate}%</p>
                        <p className="text-sm text-gray-600">Success Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-purple-600">{todayStats.avgTurnoverTime}min</p>
                        <p className="text-sm text-gray-600">Avg Turnover</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span>Revenue Analysis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <ChartTooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                        <Bar dataKey="revenue" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
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
                        Daily Operations Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Weekly Performance Summary
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Staff Utilization Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Financial Summary
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
            </TabsContent>

            <TabsContent value="emergency" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-600">
                      <Siren className="h-5 w-5" />
                      <span>Emergency Management Protocol</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-3 mb-3">
                          <AlertCircle className="h-5 w-5 text-red-500" />
                          <h3 className="font-semibold text-red-800">Active Emergency Protocols</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm font-medium">Emergency OT Ready</span>
                            <Badge className="bg-red-100 text-red-800">OT-4 Standby</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm font-medium">Emergency Staff On Call</span>
                            <Badge className="bg-green-100 text-green-800">3 Available</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Button className="h-16 flex-col bg-red-600 hover:bg-red-700 space-y-1">
                          <Siren className="h-6 w-6" />
                          <span className="text-sm">Activate Emergency Protocol</span>
                        </Button>
                        <Button variant="outline" className="h-16 flex-col space-y-1 border-orange-300 text-orange-600 hover:bg-orange-50">
                          <AlertTriangle className="h-6 w-6" />
                          <span className="text-sm">Priority Surgery Alert</span>
                        </Button>
                        <Button variant="outline" className="h-16 flex-col space-y-1 border-blue-300 text-blue-600 hover:bg-blue-50">
                          <Phone className="h-6 w-6" />
                          <span className="text-sm">Emergency Contacts</span>
                        </Button>
                        <Button variant="outline" className="h-16 flex-col space-y-1 border-purple-300 text-purple-600 hover:bg-purple-50">
                          <Users className="h-6 w-6" />
                          <span className="text-sm">Staff Mobilization</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span>Emergency Resources</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Emergency Equipment</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Emergency OT Ready</span>
                            <Badge className="bg-green-100 text-green-800">Available</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Backup Generator</span>
                            <Badge className="bg-green-100 text-green-800">Operational</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Emergency Supplies</span>
                            <Badge className="bg-green-100 text-green-800">Stocked</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 border rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">On-Call Staff</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Emergency Surgeon</span>
                            <Badge className="bg-green-100 text-green-800">Dr. Martinez</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Anesthesiologist</span>
                            <Badge className="bg-green-100 text-green-800">Dr. Thompson</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>OR Nurse</span>
                            <Badge className="bg-green-100 text-green-800">Sister Mary</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 border rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Response Times</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Avg Response</span>
                            <span className="font-medium">8 minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Setup Time</span>
                            <span className="font-medium">12 minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Readiness</span>
                            <span className="font-medium">20 minutes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contacts & Protocols</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Emergency Contacts</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-blue-500" />
                          <span>Emergency Line: <strong>911</strong></span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-blue-500" />
                          <span>Hospital Admin: <strong>+91-9999999999</strong></span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-blue-500" />
                          <span>OT Supervisor: <strong>+91-8888888888</strong></span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Emergency Procedures</h4>
                      <div className="space-y-2 text-sm">
                        <p>• Activate emergency protocol</p>
                        <p>• Notify on-call team immediately</p>
                        <p>• Prepare emergency OT within 15 min</p>
                        <p>• Coordinate with ambulance services</p>
                        <p>• Document all emergency activities</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Priority Levels</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm">Critical - Immediate response</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">High - Within 30 minutes</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm">Medium - Within 1 hour</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </TabsContent>
            <TabsContent value="registers" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <RegistersTab />
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
        </div>
      </div>
    </div>
  );
};

export default OTAdminDashboard;