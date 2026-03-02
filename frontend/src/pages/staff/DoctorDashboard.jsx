import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from '@tanstack/react-query';

import Loader from "@/components/loader/Loader";
import ProfileTab from "@/components/ProfileTab";
import StaffSalaryLeave from "@/components/StaffSalaryLeave";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { isQueueManagementNote } from '@/utils/queueUtils';
import DashboardHeader from '@/components/reuseable-components/DashboardHeader';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import ophthalmologistQueueService from '@/services/ophthalmologistQueueService';
import DoctorPriorityQueuePanel from '@/components/doctor/DoctorPriorityQueuePanel';
import NextInLineOphthalmologist from '@/components/doctor/NextInLineOphthalmologist';
import PatientsUnderObservation from '@/components/doctor/PatientsUnderObservation';
import OphthalmologistCompletedExaminations from '@/components/doctor/OphthalmologistCompletedExaminations';
import PatientExaminationModal from '@/components/doctor/PatientExaminationModal';
import { useDoctorQueueSocket, useSocketConnectionStatus } from '@/hooks/useQueueSocket';
import '../../styles/DoctorDashboard.css';
import {
    Calendar,
    Clock,
    Users,
    Eye,
    User,
    Activity,
    FileText,
    AlertTriangle,
    CheckCircle,
    Stethoscope,
    Clipboard,
    PillBottle,
    Brain,
    TrendingUp,
    Monitor,
    UserCheck,
    CalendarCheck,
    BarChart3,
    ClipboardList,
    MessageSquare,
    Camera,
    TestTube,
    Microscope,
    Target,
    Timer,
    ChevronRight
} from "lucide-react";

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

// Chart Data for Ophthalmologist
const weeklyPatientsData = [
    { day: 'Mon', consultations: 18, surgeries: 3, followUps: 5, emergencies: 2 },
    { day: 'Tue', consultations: 22, surgeries: 4, followUps: 7, emergencies: 1 },
    { day: 'Wed', consultations: 15, surgeries: 2, followUps: 4, emergencies: 3 },
    { day: 'Thu', consultations: 25, surgeries: 5, followUps: 8, emergencies: 2 },
    { day: 'Fri', consultations: 20, surgeries: 3, followUps: 6, emergencies: 1 },
    { day: 'Sat', consultations: 12, surgeries: 1, followUps: 3, emergencies: 1 },
];

const conditionDistribution = [
    { name: 'Cataract', value: 35, color: '#3B82F6' },
    { name: 'Glaucoma', value: 25, color: '#10B981' },
    { name: 'Diabetic Retinopathy', value: 20, color: '#F59E0B' },
    { name: 'Macular Degeneration', value: 12, color: '#EF4444' },
    { name: 'Other Conditions', value: 8, color: '#8B5CF6' },
];

const surgerySuccessData = [
    { month: 'Jan', success: 98, complications: 2 },
    { month: 'Feb', success: 97, complications: 3 },
    { month: 'Mar', success: 99, complications: 1 },
    { month: 'Apr', success: 98, complications: 2 },
    { month: 'May', success: 96, complications: 4 },
    { month: 'Jun', success: 99, complications: 1 },
];

// Patient Queue & Appointments Component
const PatientQueue = ({ user }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [queueFilter, setQueueFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('patient-queue'); // ✅ Track active tab
    const [examinationModalOpen, setExaminationModalOpen] = useState(false);
    const [selectedQueueEntryId, setSelectedQueueEntryId] = useState(null);

    // 🔌 WebSocket real-time updates
    useDoctorQueueSocket();
    const isSocketConnected = useSocketConnectionStatus();

    // Function to open examination modal
    const openExaminationModal = (queueEntryId) => {
        setSelectedQueueEntryId(queueEntryId);
        setExaminationModalOpen(true);
    };

    // Function to close examination modal
    const closeExaminationModal = () => {
        setExaminationModalOpen(false);
        setSelectedQueueEntryId(null);
        // Refresh the queue after closing
        queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
        queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
        queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
    };

    // ✅ Refetch on-hold patients when switching to "Under Observation" tab
    useEffect(() => {
        if (activeTab === 'under-observation') {
            queryClient.invalidateQueries(['doctor-on-hold-patients', user.id]);
        }
    }, [activeTab, queryClient, user.id]);

    // ✅ Use React Query for general queue data - socket invalidations will trigger automatic refetch!
    const { data: queueData, isLoading: loading } = useQuery({
        queryKey: ['ophthalmologist-queue', user.id],
        queryFn: () => ophthalmologistQueueService.getOphthalmologistQueue(),
        refetchInterval: 15000, // Auto-refresh every 15 seconds
        refetchOnWindowFocus: true,
        staleTime: 0, // Always fetch fresh data
        cacheTime: 0, // Don't cache
    });

    // ✅ Use React Query for doctor-specific queue data (for Call Next functionality)
    const { data: doctorQueueData } = useQuery({
        queryKey: ['doctor-assigned-queue', user.id],
        queryFn: () => ophthalmologistQueueService.getDoctorQueue(),
        refetchInterval: 15000, // Auto-refresh every 15 seconds
        refetchOnWindowFocus: true,
        staleTime: 0, // Always fetch fresh data
        cacheTime: 0, // Don't cache
    });

    // ✅ Use React Query for dashboard stats - socket invalidations will trigger refetch!
    const { data: dashboardStats } = useQuery({
        queryKey: ['doctor-dashboard-stats', user.id],
        queryFn: () => ophthalmologistQueueService.getDashboardStats(),
        refetchInterval: 30000, // Auto-refresh every 30 seconds
        refetchOnWindowFocus: true,
        staleTime: 0, // Always fetch fresh data
        cacheTime: 0, // Don't cache
    });

    // Clear selected patient when queue data changes (e.g., patient put on hold)
    useEffect(() => {
        if (queueData && selectedPatient) {
            // Check if selected patient still exists in the queue
            const patientExists = queueData.queueEntries?.some(
                entry => entry.id === selectedPatient.id || entry.queueEntryId === selectedPatient.id
            );
            if (!patientExists) {
                setSelectedPatient(null);
            }
        }
    }, [queueData, selectedPatient]);

    const handleCallNextPatient = async () => {
        try {
            setActionLoading(true);

            // Check if there are already 3 patients in consultation (CALLED or IN_PROGRESS status)
            const activeConsultationPatients = myPatients.filter(p => p.status === 'CALLED' || p.status === 'IN_PROGRESS');
            if (activeConsultationPatients.length >= 3) {
                toast.error('Maximum 3 patients can be in consultation at the same time. Please complete current consultations first.');
                return;
            }

            // Use the doctor queue data from React Query
            if (!doctorQueueData?.queueEntries) {
                toast.error('No queue data available. Please wait for data to load.');
                return;
            }

            // Filter for assigned waiting patients and sort by doctorQueuePosition (lowest first)
            const myAssignedWaitingPatients = doctorQueueData.queueEntries
                .filter(entry => {
                    const isAssignedToMe = entry.assignedStaff?.id === user.id;
                    const isWaiting = entry.status === 'WAITING';
                    return isAssignedToMe && isWaiting;
                })
                .sort((a, b) => (a.doctorQueuePosition || 999) - (b.doctorQueuePosition || 999));

            if (myAssignedWaitingPatients.length === 0) {
                toast.error('No assigned patients waiting to be called in your priority queue');
                return;
            }

            // Get the first patient according to doctorQueuePosition (position 1 is highest priority)
            const nextPatient = myAssignedWaitingPatients[0];

            // Get patient name from the correct structure
            const patientName = nextPatient.fullName || 
                               `${nextPatient.patient?.firstName || ''} ${nextPatient.patient?.lastName || ''}`.trim() ||
                               'Patient';


            // Call the assigned patient (WAITING → CALLED)
            await ophthalmologistQueueService.callAssignedPatient(nextPatient.queueEntryId || nextPatient.id);

            // ✅ Invalidate React Query cache - socket will handle the rest!
            queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
            queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
            queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);

            toast.success(`Called patient: ${patientName} (Queue Position: ${nextPatient.doctorQueuePosition || 'unset'}). Click "Start" to begin consultation.`);
        } catch (error) {
            toast.error(error.message || 'Failed to call next patient');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAssignPatient = async (queueEntryId, patientName) => {
        try {
            setActionLoading(true);
            await ophthalmologistQueueService.assignPatient(queueEntryId);
            toast.success(`Patient ${patientName} assigned to you`);
            // ✅ Invalidate React Query cache
            queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
            queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
            queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
        } catch (error) {
            toast.error(error.message || 'Failed to assign patient');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResumeFromHold = async (queueEntryId) => {
        try {
            setActionLoading(true);
            await ophthalmologistQueueService.resumePatientFromHold(queueEntryId);
            toast.success('Patient examination resumed');
            // ✅ Invalidate React Query cache
            queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
            queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
            queryClient.invalidateQueries(['doctor-on-hold-patients', user.id]);
            queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
        } catch (error) {
            toast.error(error.message || 'Failed to resume patient from hold');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStartConsultation = async (queueEntryId) => {
        try {
            setActionLoading(true);
            await ophthalmologistQueueService.startConsultation(queueEntryId);
            toast.success('Consultation started');
            // ✅ Invalidate React Query cache
            queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
            queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
            queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
        } catch (error) {
            toast.error(error.message || 'Failed to start consultation');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompleteConsultation = async (queueEntryId) => {
        try {
            setActionLoading(true);
            await ophthalmologistQueueService.completeConsultation(queueEntryId);
            toast.success('Consultation completed');
            // ✅ Invalidate React Query cache
            queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
            queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
            queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
        } catch (error) {
            toast.error(error.message || 'Failed to complete consultation');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && !queueData) {
        return <Loader />;
    }

    // Filter patients based on selected filter - show ALL patients in queue
    const getFilteredPatients = () => {
        if (!queueData?.queueEntries) return [];

        let filtered = queueData.queueEntries; // Show ALL patients in the queue

        if (queueFilter !== 'all') {
            filtered = filtered.filter(patient => {
                switch (queueFilter) {
                    case 'emergency':
                        return patient.priority === 'EMERGENCY';
                    case 'urgent':
                        return patient.priority === 'URGENT' || patient.priority === 'PRIORITY';
                    case 'normal':
                        return patient.priority === 'NORMAL';
                    default:
                        return true;
                }
            });
        }

        return filtered;
    };

    const waitingPatients = getFilteredPatients();
    const myPatients = queueData?.queueEntries?.filter(p => p.assignedStaff?.id === user.id) || [];
    const todaysAppointments = myPatients.filter(p => p.status === 'CALLED' || p.status === 'IN_PROGRESS');
    const activeConsultationPatients = myPatients.filter(p => p.status === 'CALLED' || p.status === 'IN_PROGRESS');
    const activeConsultationCount = activeConsultationPatients.length;

    // Count of patients waiting in doctor's priority queue
    const myWaitingPatients = myPatients.filter(p => p.status === 'WAITING');

    return (
        <div className="space-y-6">
            {/* Top Section - Two column grid with separate Cards (matching Optometry layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Queue Panels Card */}
                <Card className="bg-white shadow-sm border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                                Queue Panels
                            </CardTitle>
                            <div className="flex items-center space-x-3">
                                <Select value={queueFilter} onValueChange={setQueueFilter}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="emergency">Emergency</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {waitingPatients.length} Waiting
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2 pb-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-3 bg-white p-1 h-auto rounded-lg shadow-sm border">
                                <TabsTrigger value="patient-queue" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
                                    Patient Queue
                                </TabsTrigger>
                                <TabsTrigger value="next-in-line" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
                                    Next in Line
                                </TabsTrigger>
                                <TabsTrigger value="under-observation" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs sm:text-sm">
                                    Under Observation
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="patient-queue" className="mt-4">
                                <div className="h-[23rem] border border-gray-200 rounded-lg bg-white">
                                    <div className="flex flex-col h-full p-3">
                                        <div className="flex-1 min-h-0 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                            {waitingPatients.length === 0 ? (
                                                <div className="text-center py-12 px-4">
                                                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-gray-500 font-medium">No patients in queue</p>
                                                    <p className="text-gray-400 text-sm">New patients will appear here</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {waitingPatients.map((patient) => (
                                                    <Card key={patient.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                                                        <CardContent className="p-4">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900">{patient.fullName}</h4>
                                                                    <p className="text-sm text-gray-600">{patient.visitType} • Age {patient.age}</p>
                                                                    <p className="text-xs text-gray-500">Wait: {patient.waitTime} • Token: {patient.token}</p>
                                                                </div>
                                                                <div className="flex flex-col space-y-1">
                                                                    <Badge className={`text-xs ${patient.priorityLabel === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                                                                        patient.priorityLabel === 'PRIORITY' ? 'bg-orange-100 text-orange-800' :
                                                                            patient.priorityLabel === 'CHILDREN' ? 'bg-purple-100 text-purple-800' :
                                                                                patient.priorityLabel === 'SENIORS' ? 'bg-amber-100 text-amber-800' :
                                                                                    patient.priorityLabel === 'LONGWAIT' ? 'bg-yellow-100 text-yellow-800' :
                                                                                        patient.priorityLabel === 'REFERRAL' ? 'bg-indigo-100 text-indigo-800' :
                                                                                            patient.priorityLabel === 'FOLLOWUP' ? 'bg-green-100 text-green-800' :
                                                                                                patient.priorityLabel === 'PREPOSTOP' ? 'bg-cyan-100 text-cyan-800' :
                                                                                                    'bg-blue-100 text-blue-800'
                                                                        }`}>
                                                                        {patient.priorityLabel || 'ROUTINE'}
                                                                    </Badge>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {patient.status}
                                                                    </Badge>
                                                                    {patient.assignedStaff && (
                                                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                                            Dr. {patient.assignedStaff.name}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {/* Patient Presence Confirmation Badge */}
                                                            {patient.receptionist2Review && (
                                                                <div className="mt-2 mb-2">
                                                                    <Badge 
                                                                        variant="outline" 
                                                                        className={`text-xs ${
                                                                            patient.receptionist2Review.reviewed 
                                                                                ? 'bg-green-50 text-green-700 border-green-200' 
                                                                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                                        }`}
                                                                    >
                                                                        {patient.receptionist2Review.reviewed ? '✓ Present at Premises' : '⏳ Presence Not Confirmed'}
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                            {(!patient.assignedStaff || patient.assignedStaff.id !== user.id) && patient.status === 'WAITING' && (
                                                                <Button
                                                                    onClick={() => handleAssignPatient(patient.queueEntryId, patient.fullName)}
                                                                    disabled={loading}
                                                                    size="sm"
                                                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                                                >
                                                                    <UserCheck className="h-4 w-4 mr-2" />
                                                                    Assign to Me
                                                                </Button>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                        </div>
                                    )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="next-in-line" className="mt-4">
                                <div className="h-[23rem] border border-gray-200 rounded-lg bg-white">
                                    <NextInLineOphthalmologist focusViewMode={true} />
                                </div>
                            </TabsContent>
                            <TabsContent value="under-observation" className="mt-4">
                                <div className="h-[23rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 border border-gray-200 rounded-lg bg-white">
                                    <PatientsUnderObservation user={user} focusViewMode={true} />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Right: Patient Consultation Card */}
                <Card className="bg-white shadow-sm border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                                <UserCheck className="h-5 w-5 text-purple-600" />
                                Patient Consultation ({activeConsultationCount}/3)
                            </CardTitle>
                            <div className="flex items-center space-x-1 flex-shrink-0">
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs px-1.5 py-0.5 whitespace-nowrap">
                                    {todaysAppointments.length} Active
                                </Badge>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-1.5 py-0.5 whitespace-nowrap">
                                    {myWaitingPatients.length} Waiting
                                </Badge>
                                <Button
                                    onClick={handleCallNextPatient}
                                    disabled={loading || myWaitingPatients.length === 0}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                                    title={myWaitingPatients.length === 0 ? 'No patients in your priority queue to call' : `Call next patient from your priority queue (${myWaitingPatients.length} waiting)`}
                                >
                                    Call Next
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2 pb-4">
                        <div className="border border-gray-200 rounded-lg bg-white">
                            {todaysAppointments.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-500 font-medium">No patients called for examination</p>
                                    <p className="text-gray-400 text-sm">Click "Call Next" to start examining patients from your priority queue</p>
                                </div>
                            ) : (
                                <div className="h-[28rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    <div className="space-y-3 p-4">
                                        {todaysAppointments.map((appointment) => (
                                            <Card key={appointment.id} className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{appointment.fullName}</h4>
                                                            <p className="text-sm text-gray-600">{appointment.visitType} • Age {appointment.age}</p>
                                                            <p className="text-xs text-gray-500">Wait: {appointment.waitTime} • Token: {appointment.token}</p>
                                                        </div>
                                                        <div className="flex flex-col space-y-1">
                                                            <Badge className={`text-xs ${appointment.priorityLabel === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                                                                appointment.priorityLabel === 'PRIORITY' ? 'bg-orange-100 text-orange-800' :
                                                                    appointment.priorityLabel === 'CHILDREN' ? 'bg-purple-100 text-purple-800' :
                                                                        appointment.priorityLabel === 'SENIORS' ? 'bg-amber-100 text-amber-800' :
                                                                            appointment.priorityLabel === 'LONGWAIT' ? 'bg-yellow-100 text-yellow-800' :
                                                                                appointment.priorityLabel === 'REFERRAL' ? 'bg-indigo-100 text-indigo-800' :
                                                                                    appointment.priorityLabel === 'FOLLOWUP' ? 'bg-green-100 text-green-800' :
                                                                                        appointment.priorityLabel === 'PREPOSTOP' ? 'bg-cyan-100 text-cyan-800' :
                                                                                            'bg-blue-100 text-blue-800'
                                                                }`}>
                                                                {appointment.priorityLabel || 'ROUTINE'}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs">
                                                                {appointment.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {/* Patient Presence Confirmation Badge */}
                                                    {appointment.receptionist2Review && (
                                                        <div className="mt-2 mb-2">
                                                            <Badge 
                                                                variant="outline" 
                                                                className={`text-xs ${
                                                                    appointment.receptionist2Review.reviewed 
                                                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                                                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                                }`}
                                                            >
                                                                {appointment.receptionist2Review.reviewed ? '✓ Present at Premises' : '⏳ Presence Not Confirmed'}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                    {appointment.status === 'CALLED' && (
                                                        <Button
                                                            onClick={() => openExaminationModal(appointment.queueEntryId)}
                                                            size="sm"
                                                            className="w-full bg-green-600 hover:bg-green-700"
                                                        >
                                                            <Stethoscope className="h-4 w-4 mr-2" />
                                                            Start Examination
                                                        </Button>
                                                    )}
                                                    {appointment.status === 'IN_PROGRESS' && (
                                                        <Button
                                                            onClick={() => openExaminationModal(appointment.queueEntryId)}
                                                            size="sm"
                                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            <Activity className="h-4 w-4 mr-2" />
                                                            Continue Examination
                                                        </Button>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Patient Examination Modal */}
            <PatientExaminationModal
                isOpen={examinationModalOpen}
                onClose={closeExaminationModal}
                queueEntryId={selectedQueueEntryId}
            />
        </div>
    );
};



// Clinical Management Component
const ClinicalManagement = () => {
    const [selectedCase, setSelectedCase] = useState('');
    const [consultationNotes, setConsultationNotes] = useState('');

    const activeConsultations = [
        { id: 'C001', patient: 'Rajesh Sharma', condition: 'Cataract Assessment', stage: 'Examination', startTime: '9:15 AM', duration: '45 min' },
        { id: 'C002', patient: 'Priya Joshi', condition: 'Glaucoma Treatment', stage: 'Treatment Planning', startTime: '10:30 AM', duration: '30 min' },
        { id: 'C003', patient: 'Arun Deshpande', condition: 'Diabetic Retinopathy', stage: 'Diagnosis', startTime: '11:45 AM', duration: '25 min' },
    ];

    const surgicalCases = [
        { id: 'S001', patient: 'Meera Patel', surgery: 'Cataract Surgery', date: '2024-01-20', status: 'Scheduled', type: 'Phacoemulsification' },
        { id: 'S002', patient: 'Ramesh Kumar', surgery: 'Glaucoma Surgery', date: '2024-01-22', status: 'Pre-Op', type: 'Trabeculectomy' },
        { id: 'S003', patient: 'Anita Deshmukh', surgery: 'Retinal Surgery', date: '2024-01-18', status: 'Post-Op Day 3', type: 'Vitrectomy' },
    ];

    const emergencyCases = [
        { id: 'E001', patient: 'Vikram Singh', condition: 'Acute Glaucoma', severity: 'Critical', arrivalTime: '8:45 AM', action: 'Immediate Treatment' },
        { id: 'E002', patient: 'Sunita Pawar', condition: 'Retinal Detachment', severity: 'Urgent', arrivalTime: '10:20 AM', action: 'Surgery Required' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Consultations</p>
                                <p className="text-2xl font-bold text-blue-600">3</p>
                            </div>
                            <Stethoscope className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Surgeries Planned</p>
                                <p className="text-2xl font-bold text-purple-600">5</p>
                            </div>
                            <Target className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Emergency Cases</p>
                                <p className="text-2xl font-bold text-red-600">2</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Reports Pending</p>
                                <p className="text-2xl font-bold text-orange-600">7</p>
                            </div>
                            <FileText className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Stethoscope className="h-5 w-5 text-blue-600" />
                            <span>Active Consultations</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {activeConsultations.map((consultation) => (
                                <div key={consultation.id} className="p-3 border rounded-lg">
                                    <p className="font-medium">{consultation.patient}</p>
                                    <p className="text-sm text-gray-500">{consultation.condition}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-400">Stage: {consultation.stage}</span>
                                        <span className="text-xs text-blue-600">{consultation.duration}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Target className="h-5 w-5 text-purple-600" />
                            <span>Surgical Cases</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {surgicalCases.map((surgery) => (
                                <div key={surgery.id} className="p-3 border rounded-lg">
                                    <p className="font-medium">{surgery.patient}</p>
                                    <p className="text-sm text-gray-500">{surgery.surgery} ({surgery.type})</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-400">{surgery.date}</span>
                                        <Badge className={`text-xs ${surgery.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                            surgery.status === 'Pre-Op' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {surgery.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <span>Emergency Cases</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {emergencyCases.map((emergency) => (
                                <div key={emergency.id} className="p-3 border-2 border-red-200 rounded-lg bg-red-50">
                                    <p className="font-medium text-red-800">{emergency.patient}</p>
                                    <p className="text-sm text-red-600">{emergency.condition}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-red-500">Arrived: {emergency.arrivalTime}</span>
                                        <Badge className="bg-red-100 text-red-800 text-xs">
                                            {emergency.severity}
                                        </Badge>
                                    </div>
                                    <Button size="sm" className="w-full mt-2 bg-red-600 hover:bg-red-700">
                                        {emergency.action}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// Medical Records & Diagnostics Component
const MedicalRecords = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [diagnosticRecords, setDiagnosticRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0
    });

    // Fetch diagnostic records
    const fetchDiagnosticRecords = async (page = 1) => {
        try {
            setLoading(true);
            const { default: medicalReportsService } = await import('@/services/medicalReportsService');

            const result = await medicalReportsService.getDiagnosticRecords({
                dateFilter,
                statusFilter,
                searchTerm,
                page,
                limit: 50
            });

            setDiagnosticRecords(result.examinations || []);
            setPagination(result.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalCount: 0
            });
        } catch (error) {
            toast.error(error.message || 'Failed to fetch diagnostic records');
            setDiagnosticRecords([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle download medical report
    const handleDownloadReport = async (examinationId) => {
        try {
            const { default: medicalReportsService } = await import('@/services/medicalReportsService');
            await medicalReportsService.downloadMedicalReport(examinationId);
            toast.success('Medical report downloaded successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to download medical report');
        }
    };

    // Handle export records
    const handleExportRecords = async () => {
        try {
            const { default: medicalReportsService } = await import('@/services/medicalReportsService');
            await medicalReportsService.exportDiagnosticRecords({
                dateFilter,
                statusFilter,
                searchTerm
            });
            toast.success('Diagnostic records exported successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to export diagnostic records');
        }
    };

    // Fetch records when filters change
    useEffect(() => {
        fetchDiagnosticRecords();
    }, [dateFilter, statusFilter, searchTerm]);

    const filteredDiagnostics = diagnosticRecords;

    return (
        <div className="space-y-6">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Input
                    placeholder="Search by patient name, test, result, or token..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                />
                <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="under review">Under Review</SelectItem>
                        <SelectItem value="action required">Action Required</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    Showing {filteredDiagnostics.length} diagnostic records
                    {dateFilter !== 'all' && ` for ${dateFilter}`}
                </p>
                <Button
                    onClick={handleExportRecords}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                >
                    <FileText className="h-4 w-4 mr-2" />
                    Export Records
                </Button>
            </div>

            {/* Single Column Layout for Recent Diagnostics */}
            <Card className="bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <TestTube className="h-5 w-5 text-green-600" />
                        <span>Patient Diagnostics</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-gray-500">Loading diagnostic records...</p>
                            </div>
                        ) : filteredDiagnostics.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <TestTube className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p>No diagnostic records found</p>
                                <p className="text-sm">Try adjusting your search or filter criteria</p>
                            </div>
                        ) : (
                            filteredDiagnostics.map((diagnostic) => (
                                <div key={diagnostic.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <p className="font-semibold text-gray-800">{diagnostic.patient}</p>
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                    {diagnostic.token}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    Age {diagnostic.age}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-blue-600 mb-1">{diagnostic.test}</p>
                                            <p className="text-sm text-gray-700 mb-2">{diagnostic.result}</p>
                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <span className="flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {diagnostic.date}
                                                </span>
                                                <span className="flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {diagnostic.time}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge className={`text-xs ${diagnostic.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                            diagnostic.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {diagnostic.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <Button size="sm" variant="outline" className="text-xs">
                                            <Eye className="h-3 w-3 mr-1" />
                                            View Details
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs"
                                            onClick={() => handleDownloadReport(diagnostic.id)}
                                            disabled={loading}
                                        >
                                            <FileText className="h-3 w-3 mr-1" />
                                            Download Report
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Analytics & Performance Component
const AnalyticsPerformance = () => {
    const performanceMetrics = [
        { metric: 'Patient Satisfaction', value: '4.8/5', trend: 'up', change: '+0.2' },
        { metric: 'Surgery Success Rate', value: '98.5%', trend: 'up', change: '+1.2%' },
        { metric: 'Average Consultation Time', value: '22 min', trend: 'down', change: '-2 min' },
        { metric: 'Monthly Revenue', value: '₹2.8L', trend: 'up', change: '+15%' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {performanceMetrics.map((metric, index) => (
                    <Card key={index} className="bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{metric.metric}</p>
                                    <p className="text-2xl font-bold">{metric.value}</p>
                                    <div className="flex items-center mt-1">
                                        <TrendingUp className={`h-4 w-4 ${metric.trend === 'up' ? 'text-green-500' :
                                            metric.trend === 'down' ? 'text-red-500' :
                                                'text-gray-500'
                                            }`} />
                                        <span className={`text-sm ml-1 ${metric.trend === 'up' ? 'text-green-600' :
                                            metric.trend === 'down' ? 'text-red-600' :
                                                'text-gray-600'
                                            }`}>
                                            {metric.change}
                                        </span>
                                    </div>
                                </div>
                                <BarChart3 className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Weekly Patient Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklyPatientsData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="consultations" fill="#3B82F6" name="Consultations" />
                                <Bar dataKey="surgeries" fill="#10B981" name="Surgeries" />
                                <Bar dataKey="followUps" fill="#F59E0B" name="Follow-ups" />
                                <Bar dataKey="emergencies" fill="#EF4444" name="Emergencies" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Condition Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={conditionDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ name, value }) => `${name}: ${value}%`}
                                >
                                    {conditionDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white">
                <CardHeader>
                    <CardTitle>Surgery Success Rate Trends</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={surgerySuccessData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis domain={[90, 100]} />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="success" stackId="1" stroke="#10B981" fill="#10B981" name="Success Rate %" />
                            <Area type="monotone" dataKey="complications" stackId="2" stroke="#EF4444" fill="#EF4444" name="Complications %" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

const DoctorDashboard = () => {
    const { user, logout, fetchStaffProfile } = useAuth();
    const navigate = useNavigate();
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileFetched, setProfileFetched] = useState(false);
    const [showStatsCards, setShowStatsCards] = useState(true);
    const isSocketConnected = useSocketConnectionStatus();

    // Fetch dashboard statistics with safe background refreshing
    const { data: dashboardStats, isLoading: statsLoading } = useQuery({
        queryKey: ['doctor-dashboard-stats', user?.id],
        queryFn: () => ophthalmologistQueueService.getDashboardStats(),
        enabled: !!user?.id,
        refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
        refetchIntervalInBackground: true, // Continue refetching in background
        refetchOnWindowFocus: true,
        staleTime: 5000, // Consider fresh for 5 seconds
        cacheTime: 30000 // Keep in cache for 30 seconds
    });

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

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

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
                        name: `Dr. ${user?.firstName} ${user?.lastName}`,
                        role: 'Ophthalmologist - Eye Care Specialist'
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
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white relative overflow-hidden">
                            <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-xs sm:text-sm">Patients in Queue</p>
                                        {statsLoading ? (
                                            <div className="animate-pulse h-9 w-12 bg-blue-400 rounded mt-1"></div>
                                        ) : (
                                            <>
                                                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{dashboardStats?.patientsInQueue || 0}</p>
                                                <p className="text-xs sm:text-sm text-blue-200 mt-1">
                                                    Ophthalmologist Queue
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <Users className="h-12 w-12 sm:h-14 w-14 text-blue-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white relative overflow-hidden">
                            <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-xs sm:text-sm">Total Patients in Hospital</p>
                                        {statsLoading ? (
                                            <div className="animate-pulse h-9 w-12 bg-green-400 rounded mt-1"></div>
                                        ) : (
                                            <>
                                                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{dashboardStats?.totalPatientsInHospital || 0}</p>
                                                <p className="text-xs sm:text-sm text-green-200 mt-1">
                                                    All departments today
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <Activity className="h-12 w-12 sm:h-14 w-14 text-green-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white relative overflow-hidden">
                            <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-xs sm:text-sm">Today's Appointments</p>
                                        {statsLoading ? (
                                            <div className="animate-pulse h-9 w-12 bg-purple-400 rounded mt-1"></div>
                                        ) : (
                                            <>
                                                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{dashboardStats?.todayAppointments || 0}</p>
                                                <p className="text-xs sm:text-sm text-purple-200 mt-1">
                                                    {dashboardStats?.completedAppointments || 0} completed
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <CalendarCheck className="h-12 w-12 sm:h-14 w-14 text-purple-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white relative overflow-hidden">
                            <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-orange-100 text-xs sm:text-sm">Avg. Examination Time</p>
                                        {statsLoading ? (
                                            <div className="animate-pulse h-9 w-20 bg-orange-400 rounded mt-1"></div>
                                        ) : (
                                            <>
                                                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{dashboardStats?.averageConsultationTime || '0 min'}</p>
                                                <p className="text-xs sm:text-sm text-orange-200 mt-1">
                                                    Based on last 50 exams
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <Timer className="h-12 w-12 sm:h-14 w-14 text-orange-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white relative overflow-hidden">
                            <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-cyan-100 text-xs sm:text-sm">Avg. Wait Time</p>
                                        {statsLoading ? (
                                            <div className="animate-pulse h-9 w-20 bg-cyan-400 rounded mt-1"></div>
                                        ) : (
                                            <>
                                                <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{dashboardStats?.averageWaitTime || '0 min'}</p>
                                                <p className="text-xs sm:text-sm text-cyan-200 mt-1">
                                                    For waiting patients
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <Timer className="h-12 w-12 sm:h-14 w-14 text-cyan-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    )}

                    <Tabs defaultValue="dashboard" className="flex-1 flex flex-col min-h-0">
                        <div className="relative flex-shrink-0">
                            {/* Scrollable container for mobile */}
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                                <TabsList className="inline-flex sm:grid w-auto sm:w-full sm:grid-cols-5 bg-white p-1 h-auto rounded-lg shadow-sm border min-w-max">
                                    <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                                        <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                        <span className="hidden xs:inline">Patient Queue</span>
                                        <span className="xs:hidden">Queue</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                        <span className="hidden xs:inline">Completed Examinations</span>
                                        <span className="xs:hidden">Completed</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="clinical" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                                        <Stethoscope className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                        <span className="hidden xs:inline">Clinical Management</span>
                                        <span className="xs:hidden">Clinical</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="salary-leave" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                                        Salary & Leave
                                    </TabsTrigger>
                                    <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
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

                        <TabsContent value="dashboard" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                            <div className="h-full overflow-y-auto tab-content-container pr-2">
                                {/* Patient Queue & Assignments - Full Width */}
                                <div className="mb-6">
                                    <PatientQueue user={user} />
                                </div>

                                {/* Doctor Priority Queue Panel */}
                                <div>
                                    <DoctorPriorityQueuePanel />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="completed" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                            <div className="h-full flex flex-col">
                                <OphthalmologistCompletedExaminations />
                            </div>
                        </TabsContent>

                        <TabsContent value="clinical" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                            <div className="h-full overflow-y-auto tab-content-container pr-2">
                                <ClinicalManagement />
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

export default DoctorDashboard;