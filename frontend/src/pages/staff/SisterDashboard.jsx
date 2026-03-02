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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  HeartHandshake,
  Calendar,
  Clock,
  FileText,
  User,
  CheckCircle,
  AlertTriangle,
  Activity,
  Users,
  Shield,
  Bell,
  Stethoscope,
  Thermometer,
  Eye,
  Edit,
  Plus,
  Download,
  Target,
  Heart,
  Monitor,
  ClipboardList,
  BarChart3,
  PieChart as PieChartIcon,
  UserCheck,
  Syringe,
  Timer,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Settings,
  LogOut,
  Loader,
  Clipboard,
  Pill,
  Bandage,
  UserPlus,
  MapPin,
  Zap,
  MessageSquare,
  Wrench,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileTab from '@/components/ProfileTab';
import StaffSalaryLeave from '@/components/StaffSalaryLeave';
import NotificationCenter from '@/components/NotificationCenter';
import profileService from '@/services/profileService';
import DashboardHeader from '@/components/reuseable-components/DashboardHeader';
import { surgeryService } from '@/services/surgeryService';
import { otAdminService } from '@/services/otAdminService';
import RealTimeOTStatus from '@/components/RealTimeOTStatus';
import OTRoomsManagement from '@/components/ot-admin/OTRoomsManagement';
import EquipmentManagement from '@/components/ot-admin/EquipmentManagement';
import EyeDropsQueue from '@/components/shared/EyeDropsQueue';
import { toast } from 'sonner';
import { useReceptionist2QueueSocket } from '@/hooks/useQueueSocket';

// Avatar Component - Same logic as ProfileTab
const Avatar = ({ src, alt, fallback, className = '', size = 'md' }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`rounded-full overflow-hidden bg-pink-100 flex items-center justify-center ${className}`}>
      {src && !imageError ? (
        <img
          src={profileService.getImageUrl(src)}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-pink-600 font-medium">
          {fallback}
        </div>
      )}
    </div>
  );
};

// CountdownTimer Component for Eye Drop Queue
const CountdownTimer = ({ estimatedResumeTime, patientId }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasPlayedAlarm, setHasPlayedAlarm] = useState(false);

  useEffect(() => {
    if (!estimatedResumeTime) {
      setTimeRemaining(0);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date();
      const resumeTime = new Date(estimatedResumeTime);
      const diff = Math.max(0, Math.floor((resumeTime - now) / 1000));
      return diff;
    };

    // Initial calculation
    const initialTime = calculateTimeRemaining();
    setTimeRemaining(initialTime);

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Play alarm sound when timer hits 0
      if (remaining === 0 && !hasPlayedAlarm) {
        setHasPlayedAlarm(true);

        // Play alarm sound
        const audio = new Audio('/alarm.mp3');
        audio.play().catch(err => { });

        // Show toast notification
        toast.success('Eye drop timer expired! Patient ready for examination.', {
          duration: 5000,
          position: 'top-center'
        });

        // Trigger a small delay then force re-render by updating a timestamp
        setTimeout(() => {
          setTimeRemaining(-1);
        }, 100);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [estimatedResumeTime, patientId, hasPlayedAlarm]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render anything if timer expired - show buttons instead
  if (timeRemaining === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Badge className="bg-blue-100 text-blue-800">
        <Timer className="h-3 w-3 mr-1" />
        {formatTime(timeRemaining)}
      </Badge>
    </div>
  );
};

const SisterDashboard = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // 🔌 WebSocket real-time updates for eye drop queue
  useReceptionist2QueueSocket();

  const [activeTab, setActiveTab] = useState('overview');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStatsCards, setShowStatsCards] = useState(true);

  // Eye Drop Queue States (for custom timer dialog)
  const [showPatientTimerDialog, setShowPatientTimerDialog] = useState(false);
  const [selectedPatientForTimer, setSelectedPatientForTimer] = useState(null);
  const [patientTimerDuration, setPatientTimerDuration] = useState(10);
  const [timerActionType, setTimerActionType] = useState('apply'); // 'apply' or 'repeat'
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [defaultTimerDuration, setDefaultTimerDuration] = useState(() => {
    const saved = localStorage.getItem('eyeDropTimerDuration');
    return saved ? parseInt(saved) : 10;
  });

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
    queryKey: ['sister-dashboard-stats'],
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

  // Eye Drop Queue Service Function
  const fetchEyeDropQueue = async ({ selectedDate }) => {

    const params = new URLSearchParams();
    if (selectedDate) params.append('date', selectedDate);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/patients/on-hold-queue?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch eye drop queue');
    }

    const data = await response.json();

    return {
      patients: data.data?.patients || [],
      statistics: data.data?.statistics || {}
    };
  };

  // TanStack Query for Eye Drop Queue with auto-refresh
  const {
    data: eyeDropQueueData,
    isLoading: eyeDropQueueLoading,
    error: eyeDropQueueError,
    refetch: refetchEyeDropQueue,
    isFetching: eyeDropQueueFetching
  } = useQuery({
    queryKey: ['eyeDropQueue', selectedDate],
    queryFn: () => {
      return fetchEyeDropQueue({ selectedDate });
    },
    // ❌ NO POLLING - WebSocket handles real-time updates!
    refetchOnWindowFocus: true, // ✅ KEEP - Refetch when window becomes focused
    refetchOnMount: true, // ✅ KEEP - Always refetch on component mount
    staleTime: 5000, // Consider data stale after 5 seconds
    cacheTime: 30000, // Keep in cache for 30 seconds
    retry: 2, // Retry failed requests 2 times
    retryDelay: 1000, // Wait 1 second between retries
    onError: (error) => {
      if (!error.message.includes('No patients')) {
        toast.error('Failed to load eye drop queue: ' + error.message);
      }
    },
    onSuccess: (data) => {
    }
  });

  // Extract eye drop queue data with fallbacks
  const allOnHoldPatients = eyeDropQueueData?.patients || [];
  const onHoldPatients = allOnHoldPatients;
  const onHoldStats = eyeDropQueueData?.statistics || {};

  // defaultTimerDuration is now a useState (declared above)

  // Apply Eye Drops Mutation
  const applyEyeDropsMutation = useMutation({
    mutationFn: async ({ queueEntryId, customWaitMinutes }) => {

      const response = await fetch(`${import.meta.env.VITE_API_URL}/ophthalmologist/queue/confirm-drops-applied`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          queueEntryId,
          customWaitMinutes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to apply eye drops');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success(`Eye drops applied successfully! ${variables.customWaitMinutes}-minute timer started.`);

      queryClient.invalidateQueries(['eyeDropQueue']);
      refetchEyeDropQueue();
      setShowPatientTimerDialog(false);
    },
    onError: (error) => {
      toast.error('Failed to apply eye drops: ' + error.message);
    }
  });

  const [todaysSurgeries, setTodaysSurgeries] = useState([]);
  const [surgeriesLoading, setSurgeriesLoading] = useState(false);
  const [otRooms, setOtRooms] = useState([]);

  // Eye Drop Queue Handler Functions
  const handleApplyEyeDrops = (patient, useCustomTime = false) => {
    if (useCustomTime) {
      setSelectedPatientForTimer(patient);
      setPatientTimerDuration(patient.customWaitMinutes || defaultTimerDuration);
      setShowPatientTimerDialog(true);
    } else {
      applyEyeDropsMutation.mutate({
        queueEntryId: patient.queueEntryId,
        customWaitMinutes: defaultTimerDuration
      });
    }
  };

  const confirmApplyEyeDrops = () => {
    if (!selectedPatientForTimer) return;

    if (timerActionType === 'repeat') {
      repeatDilationMutation.mutate({
        queueEntryId: selectedPatientForTimer.queueEntryId,
        customWaitMinutes: patientTimerDuration
      });
    } else {
      applyEyeDropsMutation.mutate({
        queueEntryId: selectedPatientForTimer.queueEntryId,
        customWaitMinutes: patientTimerDuration
      });
    }
  };

  const handleRepeatDilation = (patient, useCustomTime = false) => {
    if (useCustomTime) {
      setSelectedPatientForTimer(patient);
      setPatientTimerDuration(patient.customWaitMinutes || defaultTimerDuration);
      setShowPatientTimerDialog(true);
      // We need to know if we are repeating or applying for the first time
      // Let's add a state for that
      setTimerActionType('repeat');
    } else {
      repeatDilationMutation.mutate({
        queueEntryId: patient.queueEntryId,
        customWaitMinutes: defaultTimerDuration
      });
    }
  };

  const repeatDilationMutation = useMutation({
    mutationFn: async ({ queueEntryId, customWaitMinutes }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ophthalmologist/queue/repeat-dilation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          queueEntryId,
          customWaitMinutes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to repeat dilation');
      }
      return { data, customWaitMinutes };
    },
    onSuccess: ({ data, customWaitMinutes }) => {
      toast.success(`Dilation repeated - Round ${data.data.round}/3 started (${customWaitMinutes} min timer)`);
      queryClient.invalidateQueries(['eyeDropQueue']);
      refetchEyeDropQueue();
      setShowPatientTimerDialog(false);
      setTimerActionType('apply'); // Reset
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to repeat dilation');
    }
  });

  const handleMarkReady = async (queueEntryId) => {
    try {

      const response = await fetch(`${import.meta.env.VITE_API_URL}/ophthalmologist/queue/mark-ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ queueEntryId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark patient ready');
      }

      toast.success('Patient marked as ready to resume examination');

      queryClient.invalidateQueries(['eyeDropQueue']);
      refetchEyeDropQueue();

    } catch (error) {
      toast.error(error.message || 'Failed to mark patient ready');
    }
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

  // Fetch all hospital surgeries and OT rooms for overview
  useEffect(() => {
    const fetchAllSurgeries = async () => {
      setSurgeriesLoading(true);
      try {
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

  // Mock data for demonstration
  const todayStats = {
    totalPatients: 12,
    patientsAssisted: 8,
    ongoingCare: 2,
    preOpPrep: 2,
    postOpCare: 3,
    teamMembers: 6,
    medicationsDue: 5,
    vitalsUpdated: 10,
    emergencyAlerts: 0,
    utilization: 87,
    successRate: 98.5,
    avgTurnoverTime: 25,
    waitingPatients: 8
  };

  // Helper function to format surgery data from API
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

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'emergency': case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
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
      case 'emergency': return <AlertTriangle className="h-4 w-4 text-red-500" />;
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

  // Comprehensive Patient Care Data
  const patientCare = [
    {
      id: 1,
      patientName: 'John Doe',
      patientNumber: 'P001234',
      age: 65,
      gender: 'Male',
      procedure: 'Cataract Surgery (Right Eye)',
      surgeon: 'Dr. Smith',
      anesthesiologist: 'Dr. Anderson',
      otRoom: 'OT-1',
      time: '09:00 AM',
      status: 'POST_OP',
      careStage: 'Recovery',
      priority: 'Routine',
      vitals: {
        bp: { sys: 120, dia: 80 },
        hr: 72,
        temp: 98.6,
        spo2: 98,
        respiratoryRate: 16,
        painScore: 2
      },
      medications: [
        { name: 'Prednisolone drops', dose: '1 drop QID', time: '10:00 AM', status: 'Given' },
        { name: 'Paracetamol', dose: '500mg', time: '02:00 PM', status: 'Due' }
      ],
      nursingNotes: ['Patient stable post-surgery', 'Eye patch in place', 'No complaints of pain'],
      allergies: 'NKDA',
      lastVitalsCheck: '11:45 AM',
      nextMedication: '02:00 PM',
      dischargeTime: '03:00 PM'
    },
    {
      id: 2,
      patientName: 'Jane Wilson',
      patientNumber: 'P001235',
      age: 58,
      gender: 'Female',
      procedure: 'Pars Plana Vitrectomy (Left Eye)',
      surgeon: 'Dr. Johnson',
      anesthesiologist: 'Dr. Brown',
      otRoom: 'OT-2',
      time: '11:30 AM',
      status: 'INTRA_OP',
      careStage: 'Intra-Operative',
      priority: 'Complex',
      vitals: {
        bp: { sys: 118, dia: 78 },
        hr: 68,
        temp: 98.4,
        spo2: 99,
        respiratoryRate: 14,
        painScore: 0
      },
      surgicalProgress: 65,
      currentStep: 'Membrane peeling',
      estimatedCompletion: '01:30 PM',
      complications: 'None observed',
      allergies: 'Penicillin',
      specialInstructions: ['Position patient prone post-op', 'Monitor for increased IOP']
    },
    {
      id: 3,
      patientName: 'Mike Brown',
      patientNumber: 'P001236',
      age: 72,
      gender: 'Male',
      procedure: 'Trabeculectomy with MMC',
      surgeon: 'Dr. Davis',
      anesthesiologist: 'Dr. Thompson',
      otRoom: 'OT-3',
      time: '02:00 PM',
      status: 'PRE_OP',
      careStage: 'Pre-Operative',
      priority: 'Urgent',
      vitals: {
        bp: { sys: 145, dia: 88 },
        hr: 80,
        temp: 99.1,
        spo2: 97,
        respiratoryRate: 18,
        painScore: 1
      },
      preOpTasks: [
        { task: 'Consent signed', status: 'Complete' },
        { task: 'IV access established', status: 'Complete' },
        { task: 'Pre-medication given', status: 'Pending' },
        { task: 'Site marking', status: 'Pending' }
      ],
      medications: [
        { name: 'Atropine drops', dose: '1 drop', time: '01:30 PM', status: 'Given' },
        { name: 'Midazolam', dose: '2mg IV', time: '01:45 PM', status: 'Due' }
      ],
      allergies: 'Latex',
      riskFactors: ['Diabetes', 'Hypertension', 'Previous failed surgery'],
      specialNeeds: 'Hearing impaired - use visual communication'
    },
    {
      id: 4,
      patientName: 'Sarah Davis',
      patientNumber: 'P001237',
      age: 45,
      gender: 'Female',
      procedure: 'Emergency Retinal Detachment Repair',
      surgeon: 'Dr. Miller',
      anesthesiologist: 'Dr. Anderson',
      otRoom: 'OT-1',
      time: '04:30 PM',
      status: 'EMERGENCY',
      careStage: 'Emergency Prep',
      priority: 'Emergency',
      vitals: {
        bp: { sys: 110, dia: 70 },
        hr: 95,
        temp: 98.2,
        spo2: 100,
        respiratoryRate: 20,
        painScore: 7
      },
      condition: 'Acute vision loss - macula-off RD',
      timeOfOnset: '2 hours ago',
      emergencyTasks: [
        { task: 'IV access', status: 'Complete' },
        { task: 'Blood work sent', status: 'Complete' },
        { task: 'Consent obtained', status: 'Complete' },
        { task: 'NPO confirmed', status: 'Complete' }
      ],
      medications: [
        { name: 'Morphine', dose: '5mg IV', time: '04:00 PM', status: 'Given' },
        { name: 'Ondansetron', dose: '4mg IV', time: '04:15 PM', status: 'Given' }
      ],
      allergies: 'Sulfa drugs'
    }
  ];

  // Nursing Team Data
  const nursingTeam = [
    {
      id: 1,
      name: 'Sister Mary Johnson',
      role: 'Senior OT Nurse',
      shift: 'Day (7AM-7PM)',
      assignment: 'OT-1, OT-2',
      experience: '8 years',
      specialization: 'Retinal Surgery',
      status: 'Active',
      currentTask: 'Assisting Dr. Johnson - Vitrectomy'
    },
    {
      id: 2,
      name: 'Sister Sarah Wilson',
      role: 'OT Nurse',
      shift: 'Day (7AM-7PM)',
      assignment: 'OT-3, OT-4',
      experience: '5 years',
      specialization: 'Cataract Surgery',
      status: 'Active',
      currentTask: 'Pre-op preparation - Mike Brown'
    },
    {
      id: 3,
      name: 'Sister Emily Davis',
      role: 'Recovery Nurse',
      shift: 'Day (7AM-7PM)',
      assignment: 'Recovery Unit',
      experience: '6 years',
      specialization: 'Post-operative care',
      status: 'Active',
      currentTask: 'Monitoring post-op patients'
    },
    {
      id: 4,
      name: 'Sister Lisa Brown',
      role: 'Float Nurse',
      shift: 'Day (7AM-7PM)',
      assignment: 'Available',
      experience: '3 years',
      specialization: 'General OT',
      status: 'Available',
      currentTask: 'Standby for emergency cases'
    }
  ];

  // Equipment and Supplies
  const equipmentStatus = [
    { name: 'Phaco Machine OT-1', status: 'Operational', lastMaintenance: '2024-01-15', nextDue: '2024-04-15' },
    { name: 'Vitrectomy System OT-2', status: 'In Use', lastMaintenance: '2024-01-20', nextDue: '2024-04-20' },
    { name: 'Surgical Microscope OT-3', status: 'Operational', lastMaintenance: '2024-01-10', nextDue: '2024-04-10' },
    { name: 'Autoclave Unit A', status: 'Maintenance', lastMaintenance: '2024-01-25', nextDue: '2024-02-25' }
  ];

  // Performance Data
  const weeklyWorkload = [
    { day: 'Mon', patients: 15, procedures: 12, medications: 45, vitals: 60 },
    { day: 'Tue', patients: 18, procedures: 14, medications: 52, vitals: 72 },
    { day: 'Wed', patients: 12, procedures: 10, medications: 38, vitals: 48 },
    { day: 'Thu', patients: 16, procedures: 13, medications: 48, vitals: 64 },
    { day: 'Fri', patients: 20, procedures: 16, medications: 58, vitals: 80 },
    { day: 'Sat', patients: 8, procedures: 6, medications: 24, vitals: 32 }
  ];

  const careDistribution = [
    { name: 'Pre-operative Care', value: 30, color: '#F59E0B' },
    { name: 'Surgical Assistance', value: 35, color: '#3B82F6' },
    { name: 'Post-operative Care', value: 25, color: '#10B981' },
    { name: 'Emergency Response', value: 10, color: '#EF4444' }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Post-Op Care': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'Surgical Assistance': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Activity },
      'Pre-Op Preparation': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'Emergency': { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle }
    };

    const config = statusConfig[status] || statusConfig['Pre-Op Preparation'];
    const Icon = config.icon;

    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getCareStageColor = (stage) => {
    const stageColors = {
      'Pre-Operative': 'text-yellow-600',
      'Intra-Operative': 'text-blue-600',
      'Recovery': 'text-green-600'
    };
    return stageColors[stage] || 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Sister Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
              name: `${user?.firstName} ${user?.lastName}` || user?.name || 'Sister',
              role: "Nursing Staff - Patient Care Specialist",
              employeeId: user?.employeeId || 'NSG001',
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-4 flex-shrink-0">
                <Card className="bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700 text-white overflow-hidden relative">
                  <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                    <div>
                      <p className="text-pink-100 text-xs sm:text-sm font-medium">Total Surgeries</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">
                        {statsLoading ? <Loader className="h-6 w-6 animate-spin" /> : dashboardStats.totalSurgeries}
                      </p>
                      <p className="text-xs sm:text-sm text-pink-200 mt-1">Today</p>
                    </div>
                    <Users className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 h-16 sm:h-20 w-16 sm:w-20 text-white/10" />
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
                      className="data-[state=active]:bg-pink-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                    >
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="patients"
                      className="data-[state=active]:bg-pink-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                    >
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="hidden xs:inline">OT Rooms</span>
                      <span className="xs:hidden">Rooms</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="eye-drops"
                      className="data-[state=active]:bg-pink-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="hidden xs:inline">Eye Drops Queue</span>
                      <span className="xs:hidden">Eye Drops</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="medications"
                      className="data-[state=active]:bg-pink-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                    >
                      <Wrench className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      Resources
                    </TabsTrigger>
                    <TabsTrigger
                      value="analytics"
                      className="data-[state=active]:bg-pink-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                    >
                      <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger
                      value="salary-leave"
                      className="data-[state=active]:bg-pink-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                    >
                      Salary & Leave
                    </TabsTrigger>
                    <TabsTrigger
                      value="profile"
                      className="data-[state=active]:bg-pink-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
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
                  className="absolute top-0 right-0 h-6 w-6 bg-pink-600 text-white hover:bg-pink-700 hover:text-white rounded-full shadow-md z-10"
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

              <TabsContent value="patients" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                <div className="h-full overflow-y-auto tab-content-container pr-2">
                  <OTRoomsManagement />
                </div>
              </TabsContent>

              <TabsContent value="eye-drops" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                <div className="h-full overflow-y-auto tab-content-container pr-2">
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${eyeDropQueueFetching ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></div>
                          <span>Eye Drops Queue - ON HOLD Patients</span>
                          {eyeDropQueueFetching && (
                            <div className="flex items-center ml-2">
                              <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
                              <span className="text-sm text-orange-500 ml-1">Updating...</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-orange-100 text-orange-800">
                            {onHoldStats?.totalOnHold || 0} Total
                          </Badge>
                          <Badge className="bg-red-100 text-red-800">
                            {onHoldStats?.needingDrops || 0} Need Drops
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800">
                            {onHoldStats?.waitingForDilation || 0} Waiting
                          </Badge>
                          <Badge className="bg-green-100 text-green-800">
                            {onHoldStats?.readyToResume || 0} Ready
                          </Badge>
                          <Dialog open={showTimerSettings} onOpenChange={setShowTimerSettings}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="ml-2"
                                title="Default Timer Settings"
                              >
                                <Timer className="h-4 w-4 mr-1" />
                                Default: {defaultTimerDuration}m
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center space-x-2">
                                  <Timer className="h-5 w-5 text-orange-600" />
                                  <span>Default Timer Settings</span>
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="timer-duration">Default Timer Duration (minutes)</Label>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      id="timer-duration"
                                      type="number"
                                      min="1"
                                      max="60"
                                      value={defaultTimerDuration}
                                      onChange={(e) => {
                                        const value = parseInt(e.target.value) || 10;
                                        setDefaultTimerDuration(value);
                                        localStorage.setItem('eyeDropTimerDuration', value.toString());
                                      }}
                                      className="flex-1"
                                    />
                                    <span className="text-sm text-gray-500">minutes</span>
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    Set the default wait time after applying eye drops. You can customize it for each patient.
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <p className="text-sm text-blue-800">
                                    An alarm will sound when the timer expires to alert you.
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <Label>Quick Presets</Label>
                                  <div className="grid grid-cols-4 gap-2">
                                    {[5, 10, 15, 20].map((preset) => (
                                      <Button
                                        key={preset}
                                        size="sm"
                                        variant={defaultTimerDuration === preset ? "default" : "outline"}
                                        onClick={() => {
                                          setDefaultTimerDuration(preset);
                                          localStorage.setItem('eyeDropTimerDuration', preset.toString());
                                        }}
                                      >
                                        {preset}m
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button onClick={() => setShowTimerSettings(false)}>
                                  Done
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => refetchEyeDropQueue()}
                            disabled={eyeDropQueueFetching}
                            className="ml-2"
                          >
                            <RefreshCw className={`h-4 w-4 ${eyeDropQueueFetching ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {eyeDropQueueLoading && !eyeDropQueueData ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                          <span className="ml-3">Loading eye drop queue...</span>
                        </div>
                      ) : eyeDropQueueError && !eyeDropQueueData ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load eye drop queue</h3>
                          <p className="text-gray-500 mb-4">{eyeDropQueueError.message}</p>
                          <Button onClick={() => refetchEyeDropQueue()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          {eyeDropQueueFetching && (
                            <div className="absolute top-0 left-0 right-0 bottom-0 bg-white bg-opacity-50 z-10 flex items-center justify-center">
                              <div className="flex items-center bg-white rounded-lg shadow-md px-4 py-2">
                                <RefreshCw className="h-4 w-4 animate-spin text-orange-500 mr-2" />
                                <span className="text-sm text-orange-500">Refreshing queue...</span>
                              </div>
                            </div>
                          )}
                          {onHoldPatients.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Eye className="h-8 w-8 text-orange-600" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients on hold</h3>
                              <p className="text-gray-500">Patients requiring eye drops will appear here</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {onHoldPatients.map((patient, index) => (
                                <div key={patient.queueEntryId} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center justify-between gap-4">
                                    {/* Left Section: Patient Info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm text-orange-600 font-semibold">
                                          {index + 1}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-medium text-gray-900 truncate">
                                            {patient.patient.fullName}
                                          </h4>
                                          <span className="text-xs text-gray-500 flex-shrink-0">
                                            {patient.patient.age}y • {patient.patient.gender?.charAt(0)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                                            Token: {patient.visit.tokenNumber}
                                          </Badge>
                                          <span className="text-xs text-gray-500">
                                            Round {Math.max(patient.timing.dilationRound || 0, 1)}/3
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            • {patient.timing.waitingSinceMinutes}m
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 truncate" title={patient.holdReason || 'N/A'}>
                                          Reason: {patient.holdReason || 'N/A'}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Right Section: Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {/* Initial: Show Process Patient and Custom buttons */}
                                      {patient.timing.needsDrops && (
                                        <>
                                          <Button
                                            size="sm"
                                            className="bg-orange-600 hover:bg-orange-700 text-white h-8"
                                            onClick={() => handleApplyEyeDrops(patient, false)}
                                            disabled={applyEyeDropsMutation.isPending}
                                          >
                                            {applyEyeDropsMutation.isPending ? (
                                              <>
                                                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                                Applying...
                                              </>
                                            ) : (
                                              <>
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Process ({defaultTimerDuration}m)
                                              </>
                                            )}
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 border-orange-600 text-orange-600 hover:bg-orange-50"
                                            onClick={() => handleApplyEyeDrops(patient, true)}
                                            disabled={applyEyeDropsMutation.isPending}
                                          >
                                            <Timer className="h-3 w-3 mr-1" />
                                            Custom
                                          </Button>
                                        </>
                                      )}

                                      {/* Timer Running or Expired: Show countdown or buttons */}
                                      {patient.timing.dropsApplied && !patient.timing.markedReady && (() => {
                                        const estimatedTime = patient.estimatedResumeTime || patient.timing.estimatedResumeTime;
                                        const isExpired = estimatedTime && new Date(estimatedTime) <= new Date();

                                        if (isExpired) {
                                          // Timer expired - show buttons
                                          return (
                                            <div className="flex gap-2">
                                              {/* Show Repeat button if not at round 3 */}
                                              {Math.max(patient.timing.dilationRound || 0, 1) < 3 && (
                                                <>
                                                  <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                                                    onClick={() => handleRepeatDilation(patient, false)}
                                                    disabled={repeatDilationMutation.isPending}
                                                  >
                                                    {repeatDilationMutation.isPending ? (
                                                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                                    ) : (
                                                      <RefreshCw className="h-3 w-3 mr-1" />
                                                    )}
                                                    Repeat ({defaultTimerDuration}m)
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 border-blue-600 text-blue-600 hover:bg-blue-50"
                                                    onClick={() => handleRepeatDilation(patient, true)}
                                                    disabled={repeatDilationMutation.isPending}
                                                  >
                                                    <Timer className="h-3 w-3 mr-1" />
                                                    Custom
                                                  </Button>
                                                </>
                                              )}
                                              <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white h-8"
                                                onClick={() => handleMarkReady(patient.queueEntryId)}
                                              >
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Ready
                                              </Button>
                                            </div>
                                          );
                                        } else {
                                          // Timer still running - show countdown
                                          return (
                                            <div className="text-center">
                                              <CountdownTimer
                                                estimatedResumeTime={estimatedTime}
                                                patientId={patient.queueEntryId}
                                              />
                                            </div>
                                          );
                                        }
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="medications" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                <div className="h-full overflow-y-auto tab-content-container pr-2">
                  <EquipmentManagement />
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                <div className="h-full overflow-y-auto tab-content-container pr-2">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            <span>Weekly Workload</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklyWorkload}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="day" />
                              <YAxis />
                              <ChartTooltip />
                              <Legend />
                              <Bar dataKey="patients" fill="#EC4899" name="Patients" />
                              <Bar dataKey="medications" fill="#3B82F6" name="Medications" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <PieChartIcon className="h-5 w-5 text-green-600" />
                            <span>Care Distribution</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={careDistribution}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label
                              >
                                {careDistribution.map((entry, index) => (
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
                              <p className="text-3xl font-bold text-green-600">98.5%</p>
                              <p className="text-sm text-gray-600">Medication Accuracy</p>
                            </div>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-blue-600">95%</p>
                              <p className="text-sm text-gray-600">Patient Satisfaction</p>
                            </div>
                            <div className="text-center">
                              <p className="text-3xl font-bold text-pink-600">12min</p>
                              <p className="text-sm text-gray-600">Avg Response Time</p>
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
                              <span>Patients Cared For:</span>
                              <span className="font-bold">247</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Medications Given:</span>
                              <span className="font-bold">1,250</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Vitals Recorded:</span>
                              <span className="font-bold">1,890</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Emergency Responses:</span>
                              <span className="font-bold text-red-600">8</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Team Reports</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <Button variant="outline" className="w-full justify-start">
                              <FileText className="h-4 w-4 mr-2" />
                              Daily Care Report
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <Users className="h-4 w-4 mr-2" />
                              Staff Performance
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                              <Pill className="h-4 w-4 mr-2" />
                              Medication Log
                            </Button>
                            <Button className="w-full bg-pink-600 hover:bg-pink-700">
                              <Download className="h-4 w-4 mr-2" />
                              Export All Data
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
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

      {/* Patient Timer Dialog */}
      <Dialog open={showPatientTimerDialog} onOpenChange={setShowPatientTimerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Timer className="h-5 w-5 text-orange-600" />
              <span>Set Timer for Patient</span>
            </DialogTitle>
          </DialogHeader>
          {selectedPatientForTimer && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patient-timer-duration">Wait Time (minutes)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="patient-timer-duration"
                    type="number"
                    min="1"
                    max="60"
                    value={patientTimerDuration}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || defaultTimerDuration;
                      setPatientTimerDuration(value);
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">minutes</span>
                </div>
                <p className="text-sm text-gray-500">
                  Set how long to wait after applying eye drops for this patient.
                </p>
              </div>

              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  An alarm will sound when the timer expires.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Quick Presets</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((preset) => (
                    <Button
                      key={preset}
                      size="sm"
                      variant={patientTimerDuration === preset ? "default" : "outline"}
                      onClick={() => setPatientTimerDuration(preset)}
                    >
                      {preset}m
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPatientTimerDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApplyEyeDrops}
              disabled={applyEyeDropsMutation.isPending || repeatDilationMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {(applyEyeDropsMutation.isPending || repeatDilationMutation.isPending) ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  {timerActionType === 'repeat' ? 'Repeating...' : 'Applying...'}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {timerActionType === 'repeat' ? 'Repeat Dilation & Start Timer' : 'Apply Drops & Start Timer'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SisterDashboard;