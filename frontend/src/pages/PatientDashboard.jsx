
import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import QRCodeDisplay from '@/components/appointments/QRCodeDisplay';
import TokenBadge from '@/components/appointments/TokenBadge';
import { useAuth } from '@/contexts/AuthContext';
import { patientService } from '@/services/patientService';
import { 
  Calendar, 
  Clock, 
  FileText, 
  Pill, 
  Activity, 
  Heart, 
  Eye, 
  Bell,
  QrCode,
  Phone,
  Video,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus,
  Droplets,
  Glasses,
  Shield,
  Monitor,
  Sun,
  User,
  DollarSign,
  LogOut,
  Users,
  UserPlus,
  Stethoscope,
  Menu
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAppointmentStore from '@/stores/appointment';
import useQRAppointmentStore from '@/stores/qrAppointment';
import AppointmentQRCard from '@/components/appointments/AppointmentQRCard';
import FamilyRegistrationModal from '@/components/patient/FamilyRegistrationModal';
import FamilyMembersList from '@/components/patient/FamilyMembersList';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const PatientDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [healthScore, setHealthScore] = useState(85);
  const [eyeCareScore, setEyeCareScore] = useState(88);
  const [healthViewMode, setHealthViewMode] = useState('optical');
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);

  const { toast } = useToast();
  const { user, isLoading, fetchPatientProfile, logout } = useAuth();

  // Fetch patient appointments using React Query
  const { 
    data: appointmentsData, 
    isLoading: appointmentsLoading, 
    error: appointmentsError,
    refetch: refetchAppointments 
  } = useQuery({
    queryKey: ['patient', 'appointments', user?.id],
    queryFn: patientService.getAppointments,
    enabled: !!user && user.role === 'patient' && !isLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000
  });

  // Fetch prescriptions for the medications widget
  const {
    data: prescriptionsData,
    isLoading: prescriptionsLoading,
  } = useQuery({
    queryKey: ['patient', 'prescriptions', user?.id],
    queryFn: patientService.getPrescriptions,
    enabled: !!user && user.role === 'patient' && !isLoading,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000
  });

  // Fetch medical records for Health Overview (optical exam data)
  const {
    data: medicalRecordsData,
    isLoading: medicalRecordsLoading,
  } = useQuery({
    queryKey: ['patient', 'medical-records-overview', user?.id],
    queryFn: patientService.getPatientMedicalRecords,
    enabled: !!user && user.role === 'patient' && !isLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  // Fetch complete patient profile on component mount if needed
  useEffect(() => {
    if (user && user.role === 'patient' && !user.lastName && !isLoading) {
      fetchPatientProfile();
    }
  }, [user, isLoading, fetchPatientProfile]);

  // Handler for successful family member registration
  const handleFamilyRegistrationSuccess = (registrationData) => {
    
    // Close the modal
    setIsFamilyModalOpen(false);
    
    // Show success toast
    toast({
      title: "Family Member Registered Successfully",
      description: `${registrationData.patient.firstName} ${registrationData.patient.lastName} has been registered with Patient Number: ${registrationData.patient.patientNumber}`,
    });
    
    // Additional features that could be added:
    // - Auto-refresh family members list (handled by React Query invalidation)
    // - Option to immediately book appointment for new family member
    // - Send welcome message or instructions
  };

  // Get appointment data from store
  const { 
    getUpcomingAppointments, 
    getActiveAppointment,
    patientUID 
  } = useAppointmentStore();
  
  const { 
    getFormattedAppointment, 
    isAppointmentValid, 
    patientInfo, 
    appointmentDetails, 
    qrCodeData,
    currentAppointment 
  } = useQRAppointmentStore();
  
  const upcomingAppointments = getUpcomingAppointments();
  const activeAppointment = getActiveAppointment();
  const formattedAppointment = getFormattedAppointment();
  const hasValidQRAppointment = isAppointmentValid();

  // Debug logging

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Transform appointment data for display - use real data from backend
  const upcomingAppointmentsFromAPI = appointmentsData?.data?.appointments?.upcomingAppointments?.appointments || [];
  const todayAppointmentsFromAPI = appointmentsData?.data?.appointments?.todayAppointments?.appointments || [];
  const previousAppointmentsFromAPI = appointmentsData?.data?.appointments?.previousAppointments?.appointments || [];
  
  // Combine today and upcoming appointments for display
  const allUpcomingAppointments = [...todayAppointmentsFromAPI, ...upcomingAppointmentsFromAPI];
  

  // Transform appointment data for display
  const displayAppointments = allUpcomingAppointments.map(apt => ({
    id: apt.id,
    doctorName: apt.doctorName || 'Unknown Doctor',
    specialization: apt.doctor?.department || apt.doctor?.staffType || 'General',
    date: apt.formattedDate || new Date(apt.appointmentDate).toLocaleDateString(),
    time: apt.appointmentTime || apt.formattedTime || '',
    type: apt.appointmentType === 'ONLINE' ? 'online' : 'in-person',
    status: apt.status,
    location: `${apt.doctor?.department || 'Department'}, Main Building`,
    token: apt.tokenNumber,
    purpose: apt.purpose || 'General consultation',
    appointmentDate: apt.appointmentDate,
    appointmentTime: apt.appointmentTime,
    notes: apt.notes,
    visit: apt.visit
  }));

  // For backward compatibility with existing store-based appointments
  const storeDisplayAppointments = upcomingAppointments.map(apt => ({
    id: apt.id,
    doctorName: apt.appointmentData?.doctor || 'Unknown Doctor',
    specialization: apt.appointmentData?.department || 'General',
    date: apt.appointmentData?.date || '',
    time: apt.appointmentData?.time || '',
    type: 'in-person',
    status: apt.status,
    location: `${apt.appointmentData?.department || 'Department'}, ${apt.appointmentData?.location || 'Main Building'}`,
    token: apt.token,
    qrCode: apt.qrCode,
    barcode: apt.barcode,
    uid: apt.uid
  }));

  // Use API data if available, fall back to store data
  const finalDisplayAppointments = displayAppointments.length > 0 ? displayAppointments : storeDisplayAppointments;

  // ── Derived: latest appointment that has an examination ──────────────
  const latestExamData = useMemo(() => {
    const records = medicalRecordsData?.data || [];
    const withExam = records
      .filter(a => a.hasExamination || a.visit?.optometristExamination || a.visit?.ophthalmologistExaminations?.length > 0)
      .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
    if (withExam.length === 0) return null;
    const latest = withExam[0];
    return {
      optometrist: latest.visit?.optometristExamination || null,
      ophthalmologist: latest.visit?.ophthalmologistExaminations?.[0] || null,
      appointmentDate: latest.appointmentDate,
      doctorName: latest.doctorName,
    };
  }, [medicalRecordsData]);

  // ── Optical metrics derived from latest exam ──────────────────────────
  const opticalMetrics = useMemo(() => {
    const noData = (name, icon) => ({ name, value: '—', unit: '', status: 'unknown', trend: 'stable', lastUpdated: 'No exam yet', icon });
    if (!latestExamData) return [
      noData('Visual Acuity (OD)', Eye), noData('Visual Acuity (OS)', Eye),
      noData('IOP (OD)', Droplets), noData('IOP (OS)', Droplets),
      noData('Prescription (OD)', Glasses), noData('Prescription (OS)', Glasses),
    ];

    const { optometrist: opto, ophthalmologist: opht, appointmentDate } = latestExamData;
    const daysSince = appointmentDate
      ? Math.ceil((new Date() - new Date(appointmentDate)) / 86400000)
      : null;
    const lastUpdated = daysSince === null ? '—'
      : daysSince === 0 ? 'Today'
      : daysSince === 1 ? 'Yesterday'
      : `${daysSince}d ago`;

    const vaStatus = (va) => {
      if (!va) return 'unknown';
      const num = parseInt((va.split('/')[1] || '').replace(/[^0-9]/g, ''));
      if (!num) return 'normal';
      if (num <= 25) return 'normal';
      if (num <= 60) return 'warning';
      return 'critical';
    };
    const iopStatus = (iop) => {
      const v = parseFloat(iop);
      if (isNaN(v)) return 'unknown';
      return v <= 21 ? 'normal' : v <= 24 ? 'warning' : 'critical';
    };

    const ucvaOD    = opto?.ucvaOD    || opht?.distanceOD;
    const ucvaOS    = opto?.ucvaOS    || opht?.distanceOS;
    const iopOD     = opto?.iopOD     || opht?.iopOD;
    const iopOS     = opto?.iopOS     || opht?.iopOS;
    const sphereOD  = opto?.refractionSphereOD || opht?.refractionSphereOD;
    const sphereOS  = opto?.refractionSphereOS || opht?.refractionSphereOS;

    return [
      { name: 'Visual Acuity (OD)', value: ucvaOD || '—', unit: '', status: ucvaOD ? vaStatus(ucvaOD) : 'unknown', trend: 'stable', lastUpdated, icon: Eye },
      { name: 'Visual Acuity (OS)', value: ucvaOS || '—', unit: '', status: ucvaOS ? vaStatus(ucvaOS) : 'unknown', trend: 'stable', lastUpdated, icon: Eye },
      { name: 'IOP (OD)', value: iopOD || '—', unit: iopOD ? 'mmHg' : '', status: iopOD ? iopStatus(iopOD) : 'unknown', trend: 'stable', lastUpdated, icon: Droplets },
      { name: 'IOP (OS)', value: iopOS || '—', unit: iopOS ? 'mmHg' : '', status: iopOS ? iopStatus(iopOS) : 'unknown', trend: 'stable', lastUpdated, icon: Droplets },
      { name: 'Prescription (OD)', value: sphereOD ? `${sphereOD}` : '—', unit: sphereOD ? 'D' : '', status: sphereOD ? 'normal' : 'unknown', trend: 'stable', lastUpdated, icon: Glasses },
      { name: 'Prescription (OS)', value: sphereOS ? `${sphereOS}` : '—', unit: sphereOS ? 'D' : '', status: sphereOS ? 'normal' : 'unknown', trend: 'stable', lastUpdated, icon: Glasses },
    ];
  }, [latestExamData]);

  // ── Eye care score derived from latest exam values ────────────────────
  const eyeCareScoreDynamic = useMemo(() => {
    if (!latestExamData) return null;
    const { optometrist: opto, ophthalmologist: opht } = latestExamData;
    let score = 60;
    const iopODv = parseFloat(opto?.iopOD || opht?.iopOD);
    const iopOSv = parseFloat(opto?.iopOS || opht?.iopOS);
    if (!isNaN(iopODv) && iopODv <= 21) score += 7;
    if (!isNaN(iopOSv) && iopOSv <= 21) score += 7;
    const va = opto?.ucvaOD || opht?.distanceOD;
    if (va) {
      const num = parseInt((va.split('/')[1] || '').replace(/[^0-9]/g, ''));
      if (!isNaN(num)) score += num <= 20 ? 16 : num <= 30 ? 10 : 5;
    }
    if (opto || opht) score += 10;
    return Math.min(score, 100);
  }, [latestExamData]);

  // ── General health metrics from appointment + prescription data ───────
  const healthMetrics = useMemo(() => {
    const allRecords = medicalRecordsData?.data || [];
    const completed = allRecords.filter(a => a.status === 'COMPLETED' || a.visit?.status === 'COMPLETED').length;
    const allMeds = (prescriptionsData?.data || []).flatMap(p => p.items || []);
    const sorted = [...allRecords].sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
    const lastApt = sorted[0];
    const lastVisitStr = lastApt
      ? new Date(lastApt.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';
    return [
      { name: 'Total Appointments', value: allRecords.length.toString(), unit: '', status: 'normal', trend: 'stable', lastUpdated: 'All time' },
      { name: 'Completed Visits',   value: completed.toString(),          unit: '', status: 'normal', trend: completed > 0 ? 'up' : 'stable', lastUpdated: 'All time' },
      { name: 'Active Medications', value: allMeds.length.toString(),     unit: '', status: 'normal', trend: 'stable', lastUpdated: 'From prescriptions' },
      { name: 'Last Visit',         value: lastVisitStr,                  unit: '', status: 'normal', trend: 'stable', lastUpdated: lastApt ? `${lastApt.doctorName || 'Doctor'}` : 'No visits yet' },
    ];
  }, [medicalRecordsData, prescriptionsData]);

  // ── General health score ──────────────────────────────────────────────
  const healthScoreDynamic = useMemo(() => {
    const allRecords = medicalRecordsData?.data || [];
    if (allRecords.length === 0) return null;
    const completed = allRecords.filter(a => a.status === 'COMPLETED' || a.visit?.status === 'COMPLETED').length;
    let score = 55;
    const rate = completed / allRecords.length;
    if (rate >= 0.8) score += 20; else if (rate >= 0.5) score += 10; else score += 5;
    if ((prescriptionsData?.data?.length || 0) > 0) score += 10;
    if (latestExamData) score += 15;
    return Math.min(score, 100);
  }, [medicalRecordsData, prescriptionsData, latestExamData]);

  // ── Dynamic Recent Activity derived from real data ─────────────────────
  const recentActivities = useMemo(() => {
    const items = [];

    const formatRelative = (dateStr) => {
      if (!dateStr) return '';
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days === 1) return 'Yesterday';
      return `${days}d ago`;
    };

    // Appointments (today + upcoming + previous)
    const aptList = [
      ...(appointmentsData?.data?.appointments?.todayAppointments?.appointments || []),
      ...(appointmentsData?.data?.appointments?.upcomingAppointments?.appointments || []),
      ...(appointmentsData?.data?.appointments?.previousAppointments?.appointments || []),
    ];
    aptList.forEach(apt => {
      items.push({
        id: `apt-${apt.id}`,
        type: 'appointment',
        title: apt.status === 'COMPLETED'
          ? `Appointment completed with ${apt.doctorName || 'Doctor'}`
          : `Appointment booked with ${apt.doctorName || 'Doctor'}`,
        time: formatRelative(apt.createdAt || apt.appointmentDate),
        sortDate: new Date(apt.createdAt || apt.appointmentDate).getTime(),
        icon: Calendar,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      });
    });

    // Prescriptions
    (prescriptionsData?.data || []).forEach(rx => {
      items.push({
        id: `rx-${rx.id}`,
        type: 'prescription',
        title: `Prescription issued by ${rx.doctorName || 'Doctor'}`,
        time: formatRelative(rx.createdAt || rx.date),
        sortDate: new Date(rx.createdAt || rx.date || 0).getTime(),
        icon: Pill,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
      });
    });

    // Examinations from medical records
    (medicalRecordsData?.data || []).forEach(apt => {
      if (apt.hasExamination || apt.visit?.optometristExamination || apt.visit?.ophthalmologistExaminations?.length > 0) {
        items.push({
          id: `exam-${apt.id}`,
          type: 'examination',
          title: `Eye examination recorded${apt.doctorName ? ` — ${apt.doctorName}` : ''}`,
          time: formatRelative(apt.visit?.optometristExamination?.completedAt || apt.visit?.ophthalmologistExaminations?.[0]?.completedAt || apt.appointmentDate),
          sortDate: new Date(apt.visit?.optometristExamination?.completedAt || apt.appointmentDate || 0).getTime(),
          icon: Eye,
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
        });
      }
    });

    // Sort newest first and cap at 10
    return items
      .sort((a, b) => b.sortDate - a.sortDate)
      .slice(0, 10);
  }, [appointmentsData, prescriptionsData, medicalRecordsData]);

  const recentActivityLoading = appointmentsLoading || prescriptionsLoading || medicalRecordsLoading;

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const nextAppointment = finalDisplayAppointments[0] || null;
  const timeUntilAppointment = nextAppointment ? 
    Math.ceil((new Date(`${nextAppointment.date} ${nextAppointment.time}`).getTime() - currentTime.getTime()) / (1000 * 60 * 60)) : 0;

  const renderOpticalHealthOverview = () => (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Eye Care Score</span>
          <span className="text-2xl font-bold text-blue-600">
            {medicalRecordsLoading ? '…' : eyeCareScoreDynamic !== null ? `${eyeCareScoreDynamic}/100` : '—'}
          </span>
        </div>
        <Progress value={medicalRecordsLoading ? 0 : (eyeCareScoreDynamic ?? 0)} className="h-3" />
        {medicalRecordsLoading ? (
          <p className="text-sm text-gray-400 mt-2 animate-pulse">Loading examination data…</p>
        ) : latestExamData ? (
          <p className="text-sm text-gray-600 mt-2">
            Based on your exam on {new Date(latestExamData.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {latestExamData.doctorName ? ` · ${latestExamData.doctorName}` : ''}.
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-2">No examination records yet. Book an appointment to see your eye health data here.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medicalRecordsLoading ? (
          <div className="md:col-span-2 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="h-3 bg-gray-200 rounded w-36 mb-3" />
                <div className="h-7 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-2.5 bg-gray-200 rounded w-28" />
              </div>
            ))}
          </div>
        ) : !latestExamData ? (
          <div className="md:col-span-2 flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3">
              <Eye className="h-7 w-7 text-blue-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No eye examination data yet</p>
            <p className="text-xs text-gray-500 max-w-xs">Your visual acuity, IOP, and prescription readings will appear here after your first eye examination.</p>
            <Link to="/appointment-booking" className="mt-4">
              <Button size="sm" variant="outline" className="text-xs">
                <Plus className="h-3 w-3 mr-1" />Book an eye exam
              </Button>
            </Link>
          </div>
        ) : (
          opticalMetrics.map((metric, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <metric.icon className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold">{metric.value}</span>
                <span className="text-sm text-gray-500">{metric.unit}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge className={`text-xs ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </Badge>
                <span className="text-xs text-gray-500">{metric.lastUpdated}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Monitor className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Digital Eye Strain</span>
          </div>
          <p className="text-xs text-blue-600">Take breaks every 20 minutes</p>
        </div>
        
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Sun className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">UV Protection</span>
          </div>
          <p className="text-xs text-green-600">Wear sunglasses outdoors</p>
        </div>
      </div>
    </>
  );

  const renderGeneralHealthOverview = () => (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Health Score</span>
          <span className="text-2xl font-bold text-green-600">
            {medicalRecordsLoading ? '…' : healthScoreDynamic !== null ? `${healthScoreDynamic}/100` : '—'}
          </span>
        </div>
        <Progress value={medicalRecordsLoading ? 0 : (healthScoreDynamic ?? 0)} className="h-3" />
        {medicalRecordsLoading ? (
          <p className="text-sm text-gray-400 mt-2 animate-pulse">Loading health data…</p>
        ) : healthScoreDynamic !== null ? (
          <p className="text-sm text-gray-600 mt-2">
            Based on {medicalRecordsData?.data?.length || 0} appointment{(medicalRecordsData?.data?.length || 0) !== 1 ? 's' : ''} and {(prescriptionsData?.data || []).flatMap(p => p.items || []).length} medication{(prescriptionsData?.data || []).flatMap(p => p.items || []).length !== 1 ? 's' : ''} on record.
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-2">No records yet. Your score will update after your first appointment.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medicalRecordsLoading ? (
          <div className="md:col-span-2 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="h-3 bg-gray-200 rounded w-32 mb-3" />
                <div className="h-7 bg-gray-200 rounded w-16 mb-2" />
                <div className="h-2.5 bg-gray-200 rounded w-24" />
              </div>
            ))}
          </div>
        ) : (medicalRecordsData?.data || []).length === 0 && (prescriptionsData?.data || []).length === 0 ? (
          <div className="md:col-span-2 flex flex-col items-center justify-center py-10 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Activity className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No health data yet</p>
            <p className="text-xs text-gray-500 max-w-xs">Your overview will populate once you have completed appointments and prescriptions on record.</p>
            <Link to="/appointment-booking" className="mt-4">
              <Button size="sm" variant="outline" className="text-xs">
                <Plus className="h-3 w-3 mr-1" />Book your first appointment
              </Button>
            </Link>
          </div>
        ) : (
          healthMetrics.map((metric, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{metric.name}</span>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold">{metric.value}</span>
                <span className="text-sm text-gray-500">{metric.unit}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <Badge className={`text-xs ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </Badge>
                <span className="text-xs text-gray-500">{metric.lastUpdated}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex-shrink-0">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-slate-800 truncate">Patient Dashboard</h1>
                <p className="text-xs sm:text-sm text-slate-600 truncate hidden sm:block">
                  Welcome back, {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Patient' : 'Loading...'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {/* Desktop buttons */}
              <Link to="/patient-profile" className="hidden sm:block">
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Profile</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200 hidden md:flex">
                <Phone className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Emergency</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hidden md:flex"
                onClick={async () => {
                  try {
                    await logout();
                    window.location.href = '/patient-login';
                  } catch (error) {
                    toast({
                      title: "Logout Error",
                      description: "Failed to logout. Please try again.",
                      variant: "destructive"
                    });
                  }
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Logout</span>
              </Button>

              {/* Mobile hamburger menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden px-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/patient-profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4 text-blue-600" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                    <Phone className="h-4 w-4" />
                    <span>Emergency</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-red-600 cursor-pointer"
                    onClick={async () => {
                      try {
                        await logout();
                        window.location.href = '/patient-login';
                      } catch (error) {
                        toast({
                          title: "Logout Error",
                          description: "Failed to logout. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="relative">
                <Bell className="h-6 w-6 text-gray-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-full lg:max-w-[85%] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          {/* <h2 className="text-xl font-semibold mb-4 text-slate-800">Quick Actions</h2> */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            <Link to="/appointment-booking">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-5 text-white shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer">
                <div className="absolute -right-2 -bottom-2 opacity-10">
                  <Plus className="h-16 w-16" />
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold text-sm">Book Appointment</p>
              </div>
            </Link>

            <FamilyRegistrationModal
              onSuccess={handleFamilyRegistrationSuccess}
              trigger={
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer">
                  <div className="absolute -right-2 -bottom-2 opacity-10">
                    <UserPlus className="h-16 w-16" />
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                    <UserPlus className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-semibold text-sm">Add Family Member</p>
                </div>
              }
            />

            <Link to="/prescription-history">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-white shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer">
                <div className="absolute -right-2 -bottom-2 opacity-10">
                  <Pill className="h-16 w-16" />
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <Pill className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold text-sm">Prescriptions</p>
              </div>
            </Link>

            <Link to="/medical-records">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer">
                <div className="absolute -right-2 -bottom-2 opacity-10">
                  <FileText className="h-16 w-16" />
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold text-sm">Medical Records</p>
              </div>
            </Link>

            <Link to="/appointment-history">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 p-5 text-white shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 cursor-pointer">
                <div className="absolute -right-2 -bottom-2 opacity-10">
                  <Calendar className="h-16 w-16" />
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold text-sm">Appointments</p>
              </div>
            </Link>
          </div>
        </div>



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
          {/* Debug Information - Remove in production */}
          {/* <div className="lg:col-span-3 mb-4">
            <Card className="border-dashed border-2 border-gray-300">
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Debug Info (Development Only)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs">
                <div className="grid grid-cols-6 gap-4">
                  <div>
                    <p><strong>Auth User Data:</strong></p>
                    <p>Loading: {isLoading.toString()}</p>
                    <p>User Exists: {user ? 'Yes' : 'No'}</p>
                    <p>Role: {user?.role || 'None'}</p>
                    <p>Patient ID: {user?.id || 'None'}</p>
                    <p>Patient Number: {user?.patientNumber || 'None'}</p>
                    <p>Name: {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'None' : 'None'}</p>
                    <p>Email: {user?.email || 'None'}</p>
                    <p>Phone: {user?.phone || 'None'}</p>
                  </div>
                  <div>
                    <p><strong>QR Store Status:</strong></p>
                    <p>Has Valid QR: {hasValidQRAppointment.toString()}</p>
                    <p>Formatted Appointment: {formattedAppointment ? 'Yes' : 'No'}</p>
                    <p>QR Code Data: {qrCodeData ? 'Available' : 'None'}</p>
                    <p>QR Generated: {currentAppointment?.isQRGenerated?.toString() || 'No'}</p>
                  </div>
                  <div>
                    <p><strong>Patient Info:</strong></p>
                    <p>Name: {patientInfo?.name || 'None'}</p>
                    <p>Phone: {patientInfo?.phone || 'None'}</p>
                    <p>Email: {patientInfo?.email || 'None'}</p>
                    <p>Age: {patientInfo?.age || 'None'}</p>
                  </div>
                  <div>
                    <p><strong>Appointment Details:</strong></p>
                    <p>Doctor: {appointmentDetails?.doctorName || 'None'}</p>
                    <p>Dept: {appointmentDetails?.department || 'None'}</p>
                    <p>Date: {appointmentDetails?.date ? new Date(appointmentDetails.date).toLocaleDateString() : 'None'}</p>
                    <p>Time: {appointmentDetails?.time || 'None'}</p>
                  </div>
                  <div>
                    <p><strong>Booking Info:</strong></p>
                    <p>Token: {appointmentDetails?.token || 'None'}</p>
                    <p>Fee: {appointmentDetails?.fee ? `₹${appointmentDetails.fee}` : 'None'}</p>
                    <p>Location: {appointmentDetails?.location || 'None'}</p>
                    <p>Wait Time: {appointmentDetails?.waitTime || 'None'}</p>
                  </div>
                  <div>
                    <p><strong>Store References:</strong></p>
                    <p>Current Apt: {currentAppointment ? 'Yes' : 'No'}</p>
                    <p>Active Apt: {activeAppointment ? 'Yes' : 'No'}</p>
                    <p>Upcoming: {upcomingAppointments?.length || 0}</p>
                    <p>QR Valid: {qrCodeData ? (qrCodeData.startsWith('data:image') ? 'Valid Base64' : 'Invalid Format') : 'None'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-8">
            {/* Family Members Management */}
            <FamilyMembersList 
              onAddFamilyMember={() => setIsFamilyModalOpen(true)}
            />

            {/* Health Overview with Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {healthViewMode === 'optical' ? (
                    <Eye className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Activity className="h-5 w-5 text-green-600" />
                  )}
                  <span>Health Overview</span>
                </CardTitle>
                <div className="mt-4">
                  <ToggleGroup 
                    type="single" 
                    value={healthViewMode} 
                    onValueChange={(value) => value && setHealthViewMode(value)}
                    className="justify-start flex-wrap"
                  >
                    <ToggleGroupItem value="optical" className="flex items-center space-x-1.5 text-xs sm:text-sm">
                      <Eye className="h-4 w-4 flex-shrink-0" />
                      <span className="hidden xs:inline sm:hidden">Optical</span>
                      <span className="hidden sm:inline">Optical Health</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="general" className="flex items-center space-x-1.5 text-xs sm:text-sm">
                      <Activity className="h-4 w-4 flex-shrink-0" />
                      <span className="hidden xs:inline sm:hidden">Overview</span>
                      <span className="hidden sm:inline">Overview</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardHeader>
              <CardContent>
                {healthViewMode === 'optical' ? renderOpticalHealthOverview() : renderGeneralHealthOverview()}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivityLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-gray-200 rounded w-48" />
                          <div className="h-2.5 bg-gray-200 rounded w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Activity className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">No activity yet</p>
                    <p className="text-xs text-gray-500 max-w-xs">Your appointments, prescriptions, and examinations will show up here as you use the system.</p>
                    <Link to="/appointment-booking" className="mt-3">
                      <Button size="sm" variant="outline" className="text-xs">
                        <Plus className="h-3 w-3 mr-1" />Book an appointment
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(showAllActivities ? recentActivities : recentActivities.slice(0, 4)).map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${activity.iconBg || 'bg-gray-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <activity.icon className={`h-4 w-4 ${activity.iconColor || 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                    {recentActivities.length > 4 && (
                      <button
                        onClick={() => setShowAllActivities(prev => !prev)}
                        className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium pt-1 text-center"
                      >
                        {showAllActivities ? 'Show less' : `Show ${recentActivities.length - 4} more`}
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-5 sm:space-y-6">
            {/* Appointment QR Code Card - Priority: QR Store > Regular Store > Empty State */}
            {hasValidQRAppointment && formattedAppointment ? (
              <AppointmentQRCard 
                appointment={formattedAppointment}
                size="small"
                showFullDetails={false}
                className="border-l-4 border-l-green-500"
              />
            ) : currentAppointment && qrCodeData ? (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <QrCode className="h-5 w-5 text-green-600" />
                    <span>Your Appointment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-3">
                    {/* QR Code Image */}
                    <div className="bg-white p-3 border-2 border-gray-200 rounded-lg shadow-sm inline-block">
                      <img 
                        src={qrCodeData} 
                        alt="Appointment QR Code"
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                    
                    {/* Appointment Info */}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Token: {appointmentDetails?.token || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {appointmentDetails?.doctorName || 'Doctor Name'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {appointmentDetails?.date ? new Date(appointmentDetails.date).toLocaleDateString() : 'Date'} at {appointmentDetails?.time || 'Time'}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 justify-center">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = qrCodeData;
                          link.download = `appointment-qr-${appointmentDetails?.token || 'code'}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        Download
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={async () => {
                          try {
                            const response = await fetch(qrCodeData);
                            const blob = await response.blob();
                            await navigator.clipboard.write([
                              new ClipboardItem({ 'image/png': blob })
                            ]);
                            toast({
                              title: "QR Code Copied",
                              description: "QR code copied to clipboard!",
                            });
                          } catch (error) {
                          }
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : activeAppointment && activeAppointment.qrCode ? (
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <QrCode className="h-5 w-5 text-green-600" />
                    <span>Quick QR Access</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <QRCodeDisplay
                    qrCode={activeAppointment.qrCode}
                    barcode={activeAppointment.barcode}
                    token={activeAppointment.token}
                    uid={activeAppointment.uid}
                    size="small"
                    showDownload={false}
                    showCopy={true}
                  />
                  <div className="mt-3 text-center">
                    <p className="text-sm font-medium text-gray-900">
                      {activeAppointment.appointmentData?.doctor || 'Doctor Name'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {activeAppointment.appointmentData?.date} at {activeAppointment.appointmentData?.time}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Upcoming Appointments */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <span>Upcoming Appointments</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {appointmentsLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    <Link to="/appointment-history">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">View All</Button>
                    </Link>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {appointmentsLoading ? (
                    // Loading state
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-3 border rounded-lg animate-pulse">
                          <div className="flex justify-between items-start mb-2">
                            <div className="space-y-1">
                              <div className="h-4 bg-gray-200 rounded w-32"></div>
                              <div className="h-3 bg-gray-200 rounded w-20"></div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : appointmentsError ? (
                    // Error state
                    <div className="text-center py-6">
                      <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-red-600 mb-2">Failed to load appointments</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetchAppointments()}
                        className="text-xs"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : finalDisplayAppointments.length > 0 ? (
                    // Appointments list
                    finalDisplayAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} className="p-3 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Stethoscope className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{appointment.doctorName}</p>
                              <p className="text-xs text-gray-500 truncate">{appointment.specialization}</p>
                              {appointment.purpose && (
                                <p className="text-xs text-blue-600 mt-0.5 truncate">{appointment.purpose}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1 flex-shrink-0">
                            <Badge variant="outline" className="text-xs">
                              {appointment.type}
                            </Badge>
                            {appointment.token && (
                              <Badge className="text-xs bg-indigo-100 text-indigo-800 border-0">
                                T: {appointment.token}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 ml-10">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{appointment.date}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{appointment.time}</span>
                          </div>
                        </div>
                        {appointment.visit && (
                          <div className="mt-2 ml-10 flex items-center space-x-2">
                            <Badge 
                              variant={appointment.visit.status === 'COMPLETED' ? 'success' : 'secondary'} 
                              className="text-xs"
                            >
                              {appointment.visit.status?.replace('_', ' ')}
                            </Badge>
                            {appointment.visit.visitNumber && (
                              <span className="text-xs text-gray-500">Visit #{appointment.visit.visitNumber}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    // Empty state
                    <div className="text-center py-6">
                      <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">No upcoming appointments</p>
                      <p className="text-xs text-gray-500">Book your next appointment to see it here</p>
                      <Link to="/appointment-booking" className="mt-3 inline-block">
                        <Button variant="outline" size="sm" className="text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Book Appointment
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Medications */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg flex items-center justify-center">
                      <Pill className="h-4 w-4 text-white" />
                    </div>
                    <span>Active Medications</span>
                  </div>
                  <Link to="/prescription-history">
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">View All</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  if (prescriptionsLoading) {
                    return (
                      <div className="space-y-2 animate-pulse">
                        {[1, 2].map(i => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                            <div className="w-8 h-8 rounded-lg bg-gray-200 flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 bg-gray-200 rounded w-28" />
                              <div className="h-2.5 bg-gray-200 rounded w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  const allMeds = (prescriptionsData?.data || [])
                    .flatMap(p => (p.items || []).map(item => ({ ...item, rxStatus: p.status, doctorName: p.doctorName })));
                  const recent = allMeds.slice(0, 3);
                  if (recent.length === 0) {
                    return (
                      <div className="text-center py-5">
                        <Pill className="h-7 w-7 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No medications on record</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {recent.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-green-50/50 transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Pill className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{item.medicineName}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {[item.dosage, item.frequency].filter(Boolean).join(' · ') || 'No details'}
                              </p>
                            </div>
                          </div>
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Health Tips */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Heart className="h-4 w-4 text-white" />
                  </div>
                  <span>Personalized Health Tips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="relative overflow-hidden p-3 bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 rounded-xl">
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-10">
                      <Droplets className="h-10 w-10 text-blue-600" />
                    </div>
                    <p className="text-sm font-semibold text-blue-800">Hydration Reminder</p>
                    <p className="text-xs text-blue-600">Drink at least 8 glasses of water daily</p>
                  </div>
                  
                  <div className="relative overflow-hidden p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl">
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-10">
                      <Activity className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold text-green-800">Exercise Goal</p>
                    <p className="text-xs text-green-600">30 minutes of walking recommended</p>
                  </div>
                  
                  <div className="relative overflow-hidden p-3 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 rounded-xl">
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-10">
                      <Eye className="h-10 w-10 text-purple-600" />
                    </div>
                    <p className="text-sm font-semibold text-purple-800">Eye Care</p>
                    <p className="text-xs text-purple-600">Follow 20-20-20 rule for screen time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Family Registration Modal */}
      {isFamilyModalOpen && (
        <FamilyRegistrationModal
          isOpen={isFamilyModalOpen}
          onClose={() => setIsFamilyModalOpen(false)}
          onSuccess={handleFamilyRegistrationSuccess}
        />
      )}
    </div>
  );
};

export default PatientDashboard;
