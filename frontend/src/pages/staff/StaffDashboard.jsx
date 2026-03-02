// src/pages/staff/StaffDashboard.jsx -- the entire file
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CustomCalendar } from '@/components/ui/customcal';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import ProfileTab from "@/components/ProfileTab";
import StaffSalaryLeave from "@/components/StaffSalaryLeave";
import Loader from "@/components/loader/Loader";
import { useAuth } from '@/contexts/AuthContext';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '@/components/reuseable-components/DashboardHeader';
import QuickAppointmentBooking from '@/components/staff/QuickAppointmentBooking';
import CurrentQueue from '@/components/staff/CurrentQueue';
import ScheduledAppointments from '@/components/staff/ScheduledAppointments';
import { Eye, AlertCircle, X, EyeOff, ChevronRight, ChevronUp } from "lucide-react";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import {
    UserPlus,
    Clock,
    Users,
    CalendarDays,
    Timer,
    QrCode,
    Video,
    Stethoscope,
    Briefcase,
    User,
    FileText,
    ClipboardList,
    CheckCircle,
    MessageSquare,
    Phone,
    Mail,
    Activity
} from "lucide-react";
import PatientRegistration from "@/components/PatientRegistration";
import RecentRegistrationsCard from "@/components/dashboard/RecentRegistrationsCard";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogPortal,
    DialogOverlay,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";



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

// --- Receptionist-specific Components ---
const Info = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
    </div>
);

const InfoGrid = ({ children }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {children}
    </div>
);

const Section = ({ title, children }) => (
    <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-800 border-b pb-1">
            {title}
        </h3>
        <div className="text-sm text-gray-700">{children}</div>
    </div>
);


const AppointmentManagement = () => {
    const queryClient = useQueryClient();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isAppointmentsModalOpen, setIsAppointmentsModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [patientLoading, setPatientLoading] = useState(false);

    // Use TanStack Query for auto-refreshing appointments
    const { data: appointments = [], isLoading, refetch } = useQuery({
        queryKey: ['todayAppointments'],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/daily-appointments`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch daily appointments');
            }

            const data = await response.json();
            return data.data || [];
        },
        refetchInterval: 30000, // Auto-refresh every 30 seconds
        refetchOnWindowFocus: true, // Refresh when window regains focus
        staleTime: 10000, // Data is fresh for 10 seconds
    });

    const fetchPatientDetails = async (patientId) => {
        setPatientLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/staff/patient/${patientId}`,
                { credentials: 'include' }
            );

            if (!response.ok) throw new Error('Failed to fetch patient');

            const result = await response.json();
            setSelectedPatient(result.data);
            setIsPatientModalOpen(true);
        } catch (error) {
            toast.error('Failed to load patient details');
        } finally {
            setPatientLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);

        if (isNaN(date.getTime())) return 'N/A';

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };


    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';

        try {
            // Check if the time already contains AM/PM
            if (/AM|PM/i.test(timeString)) {
                // Time already has AM/PM, just clean it up
                return timeString.trim().replace(/\s+/g, ' ');
            }

            // Time is in 24-hour format "HH:mm", convert to 12-hour format
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch (error) {
            return timeString;
        }
    };

    const renderList = (value, emptyText = 'None reported') => {
        if (!value) return emptyText;
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return JSON.stringify(value);
        return value;
    };


    return (
        <Card className="bg-white h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 flex-shrink-0">
                <CardTitle className="flex items-center space-x-2">
                    <CalendarDays className="h-5 w-5 text-blue-600" />
                    <span>Today's Appointments</span>
                    {!isLoading && (
                        <Badge variant="secondary" className="ml-2">
                            {appointments.length}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <span className="text-gray-600">Loading appointments...</span>
                        </div>
                    </div>
                ) : appointments.length > 0 ? (
                    <>
                        <div
                            className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2"
                        >
                            {appointments
                                .sort((a, b) => {
                                    // Sort by status: SCHEDULED appointments first, then others 
                                    const statusA = (a.status || 'SCHEDULED').toUpperCase();
                                    const statusB = (b.status || 'SCHEDULED').toUpperCase();

                                    if (statusA === 'SCHEDULED' && statusB !== 'SCHEDULED') {
                                        return -1; // a comes first
                                    }
                                    if (statusA !== 'SCHEDULED' && statusB === 'SCHEDULED') {
                                        return 1; // b comes first
                                    }

                                    // If both have same status priority, sort by appointment time
                                    const timeA = a.appointmentTime || '';
                                    const timeB = b.appointmentTime || '';
                                    return timeA.localeCompare(timeB);
                                })
                                .map((appointment) => (
                                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => fetchPatientDetails(appointment.patientId)}>
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="font-bold text-blue-800">{appointment.tokenNumber}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{appointment.firstName} {appointment.middleName ? appointment.middleName + ' ' : ''}{appointment.lastName}</p>
                                                <p className="text-sm text-gray-600">#{appointment.patientNumber} • {appointment.phone}</p>
                                                <p className="text-xs text-gray-500">{appointment.purpose || 'General Consultation'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end space-y-1">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatTime(appointment.appointmentTime)}
                                            </div>
                                            <Badge className={getStatusColor(appointment.status)}>
                                                {appointment.status || 'Scheduled'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                        </div>

                        <div className="mt-4 flex space-x-2 flex-shrink-0">
                            <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => setIsDrawerOpen(true)}
                            >
                                <UserPlus className="h-4 w-4 mr-2" />
                                New Appointment
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsAppointmentsModalOpen(true)}
                            >
                                <ClipboardList className="h-4 w-4 mr-2" />
                                View All
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No appointments scheduled</p>
                            <p className="text-sm">No appointments found for today</p>
                        </div>
                    </div>
                )}

                {/* New Appointment Drawer */}
                <NewAppointmentDrawer
                    isOpen={isDrawerOpen}
                    onOpenChange={setIsDrawerOpen}
                    onSuccess={() => {
                        refetch(); // Use refetch from useQuery
                    }}
                />
                {/* Appointments Modal */}
                <Dialog
                    open={isAppointmentsModalOpen}
                    onOpenChange={setIsAppointmentsModalOpen}
                >
                    <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-blue-600" />
                                All Appointments ({appointments.length})
                            </DialogTitle>
                        </DialogHeader>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {appointments.length > 0 ? (
                                appointments
                                    .sort((a, b) => {
                                        const statusA = (a.status || 'SCHEDULED').toUpperCase();
                                        const statusB = (b.status || 'SCHEDULED').toUpperCase();

                                        if (statusA === 'SCHEDULED' && statusB !== 'SCHEDULED') return -1;
                                        if (statusA !== 'SCHEDULED' && statusB === 'SCHEDULED') return 1;

                                        return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
                                    })
                                    .map((appointment) => (
                                        <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => fetchPatientDetails(appointment.patientId)}>
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="font-bold text-blue-800">
                                                        {appointment.tokenNumber}
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="font-medium">
                                                        {appointment.firstName} {appointment.middleName ? appointment.middleName + ' ' : ''}{appointment.lastName}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        #{appointment.patientNumber} • {appointment.phone}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {appointment.purpose || 'General Consultation'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end space-y-1">
                                                <div className="text-sm font-medium">
                                                    {formatTime(appointment.appointmentTime)}
                                                </div>
                                                <Badge className={getStatusColor(appointment.status)}>
                                                    {appointment.status || 'Scheduled'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium">No appointments found</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
                {/* Patient Information Modal */}
                <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                        {/* Header */}
                        <DialogHeader className="border-b p-6">
                            <DialogTitle className="flex items-center space-x-2">
                                <User className="h-5 w-5 text-blue-600" />
                                <span>{selectedPatient?.firstName} {selectedPatient?.lastName}</span>
                            </DialogTitle>
                            <DialogDescription className="text-sm text-gray-500 mt-1">
                                Patient #{selectedPatient?.patientNumber} • MRN {selectedPatient?.mrn}
                            </DialogDescription>
                        </DialogHeader>

                        {patientLoading ? (
                            <div className="flex-1 flex items-center justify-center py-12">
                                <div className="animate-spin h-8 w-8 border-b-2 border-blue-600" />
                            </div>
                        ) : selectedPatient ? (
                            <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                                {/* Tabs */}
                                <TabsList className="grid grid-cols-3 mx-6 mt-4">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="appointment">Appointment</TabsTrigger>
                                    <TabsTrigger value="visit">Visit</TabsTrigger>
                                </TabsList>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    {/* Overview Tab */}
                                    <TabsContent value="overview">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center space-x-2 text-base">
                                                    <User className="h-4 w-4 text-blue-600" />
                                                    <span>Personal Information</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-600">Gender</Label>
                                                        <p className="capitalize">{selectedPatient?.gender || 'Not specified'}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                                                        <p>{formatDate(selectedPatient?.dateOfBirth)}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                                                        <p className="flex items-center space-x-2">
                                                            <Phone className="h-4 w-4 text-green-600" />
                                                            <span>{selectedPatient?.phone || 'Not provided'}</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-600">Email</Label>
                                                        <p className="flex items-center space-x-2">
                                                            <Mail className="h-4 w-4 text-blue-600" />
                                                            <span>{selectedPatient?.email || 'Not provided'}</span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-600">Blood Group</Label>
                                                        <p>{selectedPatient?.bloodGroup || 'Not specified'}</p>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                                                        <Badge className="bg-green-100 text-green-800">
                                                            {selectedPatient?.patientStatus || 'active'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {selectedPatient?.address && (
                                                    <div className="mt-4">
                                                        <Label className="text-sm font-medium text-gray-600">Address</Label>
                                                        <p className="text-sm text-gray-700 mt-1">{selectedPatient.address}</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* Appointment Tab */}
                                    <TabsContent value="appointment">
                                        {selectedPatient?.appointments && selectedPatient.appointments.length > 0 ? (
                                            <Card>
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="flex items-center space-x-2 text-lg">
                                                        <CalendarDays className="h-5 w-5 text-green-600" />
                                                        <span>Appointment Information</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <Label className="text-sm font-medium text-gray-600">Token Number</Label>
                                                            <p className="text-2xl font-bold text-green-600 mt-1">{selectedPatient.appointments[0]?.tokenNumber || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-gray-600">Appointment Time</Label>
                                                            <p className="text-base mt-1">{selectedPatient.appointments[0]?.appointmentTime || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-gray-600">Appointment Date</Label>
                                                            <p className="text-base mt-1">{formatDate(selectedPatient.appointments[0]?.appointmentDate)}</p>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-gray-600">Purpose</Label>
                                                            <p className="text-base mt-1">{selectedPatient.appointments[0]?.purpose || 'General consultation'}</p>
                                                        </div>
                                                    </div>
                                                    {selectedPatient.appointments[0]?.doctor && (
                                                        <div className="mt-6 p-3 bg-green-50 rounded-lg border border-green-100">
                                                            <Label className="text-sm font-medium text-green-700">Assigned Doctor</Label>
                                                            <p className="font-medium text-gray-900 mt-1">
                                                                {selectedPatient.appointments[0].doctor?.name ||
                                                                    selectedPatient.appointments[0].doctor?.firstName + ' ' + selectedPatient.appointments[0].doctor?.lastName ||
                                                                    'Not assigned'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <Card>
                                                <CardContent className="flex items-center justify-center py-12">
                                                    <div className="text-center">
                                                        <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                                        <p className="text-gray-500">No appointment information available</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </TabsContent>

                                    {/* Visit Tab */}
                                    <TabsContent value="visit">
                                        {selectedPatient?.patientVisits && selectedPatient.patientVisits.length > 0 ? (
                                            <Card>
                                                <CardHeader className="pb-3">
                                                    <CardTitle className="flex items-center space-x-2 text-lg">
                                                        <Activity className="h-5 w-5 text-orange-600" />
                                                        <span>Visit Information</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <Label className="text-sm font-medium text-gray-600">Visit Number</Label>
                                                            <p className="text-base font-semibold mt-1">#{selectedPatient.patientVisits[0]?.visitNumber || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-gray-600">Visit Type</Label>
                                                            <p className="text-base font-semibold uppercase mt-1">{selectedPatient.patientVisits[0]?.visitType || 'OPD'}</p>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-gray-600">Current Status</Label>
                                                            <Badge className={`mt-1 ${selectedPatient.patientVisits[0]?.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800' :
                                                                    selectedPatient.patientVisits[0]?.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800' :
                                                                        selectedPatient.patientVisits[0]?.status === 'WITH_OPTOMETRIST' ? 'bg-green-100 text-green-800' :
                                                                            selectedPatient.patientVisits[0]?.status === 'AWAITING_DOCTOR' ? 'bg-yellow-100 text-yellow-800' :
                                                                                selectedPatient.patientVisits[0]?.status === 'WITH_DOCTOR' ? 'bg-purple-100 text-purple-800' :
                                                                                    selectedPatient.patientVisits[0]?.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                                                                                        'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {selectedPatient.patientVisits[0]?.status?.replace('_', ' ') || 'WAITING'}
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium text-gray-600">Check-in Time</Label>
                                                            <p className="text-base mt-1">
                                                                {selectedPatient.patientVisits[0]?.checkedInAt ? new Date(selectedPatient.patientVisits[0].checkedInAt).toLocaleString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                }) : 'Not checked in'}
                                                            </p>
                                                        </div>
                                                        {selectedPatient.patientVisits[0]?.priorityLevel && (
                                                            <div>
                                                                <Label className="text-sm font-medium text-gray-600">Priority Level</Label>
                                                                <Badge className={`mt-1 ${selectedPatient.patientVisits[0]?.priorityLevel === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                                                                        selectedPatient.patientVisits[0]?.priorityLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                                                            'bg-blue-100 text-blue-800'
                                                                    }`}>
                                                                    {selectedPatient.patientVisits[0]?.priorityLevel}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <Card>
                                                <CardContent className="flex items-center justify-center py-12">
                                                    <div className="text-center">
                                                        <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                                        <p className="text-gray-500">No visit information available</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </TabsContent>
                                </div>
                            </Tabs>
                        ) : null}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};



// Dynamic Patient Arrivals Chart Component
const PatientArrivalsChart = () => {
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchWeeklyData();
    }, []);

    const fetchWeeklyData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/weekly-patient-arrivals`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch weekly patient arrivals');
            }

            const data = await response.json();
            setChartData(data.data || []);
        } catch (error) {
            setError(error.message);
            toast.error('Failed to load weekly patient data');
            // Fallback to empty data
            setChartData([]);
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <Card className="bg-white h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
                    <CardTitle>Patient Appointments (This Week)</CardTitle>
                    <Button
                        onClick={fetchWeeklyData}
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                    >
                        Retry
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
                        <p className="text-lg font-medium">Failed to load chart data</p>
                        <p className="text-sm">Click retry to try again</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 flex-shrink-0">
                <CardTitle className="flex items-center space-x-2">
                    <span>Patient Apointments (This Week)</span>
                    {!isLoading && chartData.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                            {chartData.reduce((sum, day) => sum + day.patients, 0)} total
                        </Badge>
                    )}
                </CardTitle>
                <Button
                    onClick={fetchWeeklyData}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    ) : (
                        'Refresh'
                    )}
                </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <span className="text-gray-600">Loading weekly data...</span>
                        </div>
                    </div>
                ) : chartData.length > 0 ? (
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Patient Count', angle: -90, position: 'insideLeft' }}
                                />
                                <ChartTooltip
                                    formatter={(value, name) => [value, 'Patients']}
                                    labelFormatter={(label) => `${label}`}
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px'
                                    }}
                                />
                                <Legend />
                                <Bar
                                    dataKey="patients"
                                    fill="#3B82F6"
                                    name="Patient Appointments"
                                    radius={[2, 2, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No data available</p>
                            <p className="text-sm">No patient arrivals recorded this week</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// New Appointment Drawer Component
const NewAppointmentDrawer = ({ isOpen, onOpenChange, onSuccess }) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    const queryClient = useQueryClient();

    const [step, setStep] = useState(1); // 1: Patient Info, 2: Date & Time Selection
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        phone: "",
        email: "",
        dateOfBirth: "",
        gender: "",
        address: "",
        emergencyContact: "",
        emergencyPhone: "",
        allergies: ""
    });
    const [appointmentTime, setAppointmentTime] = useState("");
    const [appointmentDate, setAppointmentDate] = useState("");
    const [validationErrors, setValidationErrors] = useState({});

    // Phone checking and referral state
    const [checkingPhone, setCheckingPhone] = useState(false);
    const [existingPatients, setExistingPatients] = useState([]);
    const [showExistingPatientsDialog, setShowExistingPatientsDialog] = useState(false);
    const [selectedReferringPatient, setSelectedReferringPatient] = useState(null);

    // Slot-wise appointment bookings state
    const [slotBookings, setSlotBookings] = useState({});
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Fetch appointments when date changes
    useEffect(() => {
        if (appointmentDate) {
            fetchAppointmentsByDate(appointmentDate);
        }
    }, [appointmentDate]);

    const fetchAppointmentsByDate = async (date) => {
        setLoadingSlots(true);
        try {
            const response = await fetch(`${API_BASE_URL}/staff/appointments-by-date?date=${date}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                // Convert timeSlots array to a map for easy lookup
                const bookingsMap = {};
                data.data.timeSlots.forEach(slot => {
                    bookingsMap[slot.time] = slot.appointmentCount;
                });
                setSlotBookings(bookingsMap);
            } else {
                setSlotBookings({});
            }
        } catch (error) {
            setSlotBookings({});
        } finally {
            setLoadingSlots(false);
        }
    };

    // Validation functions
    const validateNameField = (value, fieldName) => {
        const nameRegex = /^[a-zA-Z\s]*$/;
        if (!value.trim()) {
            return `${fieldName} is required`;
        }
        if (!nameRegex.test(value)) {
            return `${fieldName} can only contain letters and spaces`;
        }
        return null;
    };

    const validatePhoneField = (value, fieldName) => {
        const phoneRegex = /^[0-9]*$/;
        if (!value.trim()) {
            return `${fieldName} is required`;
        }
        if (!phoneRegex.test(value)) {
            return `${fieldName} can only contain numbers`;
        }
        if (value.length !== 10) {
            return `${fieldName} must be exactly 10 digits`;
        }
        return null;
    };

    const validateAllergyName = (value) => {
        const allergyRegex = /^[a-zA-Z\s-]*$/;
        if (!allergyRegex.test(value)) {
            return "Allergy name can only contain letters, spaces, and hyphens";
        }
        return null;
    };

    const validateAddressField = (value) => {
        // Allow letters, numbers, spaces, and these characters: - / ( ) . , : '
        const addressRegex = /^[a-zA-Z0-9\s,.:\/()\-']*$/;
        if (value.trim() && !addressRegex.test(value)) {
            return "Address can only contain letters, numbers, spaces, and these characters: - / ( ) . , : '";
        }
        return null;
    };

    // Check for existing patients by phone number
    const checkForExistingPatients = async (phone) => {
        if (phone.length !== 10) return;

        setCheckingPhone(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/staff/check-existing-patients-by-phone?phone=${phone}`,
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = await response.json();

            // Check if patients exist in the response
            if (response.ok && data.data && data.data.patients && data.data.patients.length > 0) {
                setExistingPatients(data.data.patients);
                setShowExistingPatientsDialog(true);
            } else {
                setExistingPatients([]);
            }
        } catch (error) {
            toast.error('Failed to check phone number');
        } finally {
            setCheckingPhone(false);
        }
    };

    const handleBlur = (fieldName) => {
        let error = null;
        const value = formData[fieldName];

        if (fieldName === 'firstName') {
            error = validateNameField(value, 'First name');
        } else if (fieldName === 'middleName') {
            error = validateNameField(value, 'Middle name');
        } else if (fieldName === 'lastName') {
            error = validateNameField(value, 'Last name');
        } else if (fieldName === 'phone') {
            error = validatePhoneField(value, 'Phone number');
        } else if (fieldName === 'emergencyPhone' && value.trim()) {
            error = validatePhoneField(value, 'Emergency phone');
        } else if (fieldName === 'emergencyContact' && value.trim()) {
            error = validateNameField(value, 'Emergency contact name');
        } else if (fieldName === 'address' && value.trim()) {
            error = validateAddressField(value);
        } else if (fieldName === 'allergies' && value.trim()) {
            error = validateAllergyField(value);
        }

        setValidationErrors(prev => ({
            ...prev,
            [fieldName]: error
        }));
    };

    const resetForm = () => {
        setStep(1);
        setFormData({
            firstName: "",
            middleName: "",
            lastName: "",
            phone: "",
            email: "",
            dateOfBirth: "",
            gender: "",
            address: "",
            emergencyContact: "",
            emergencyPhone: "",
            allergies: ""
        });
        setAppointmentTime("");
        setAppointmentDate("");
        setSlotBookings({});
        setValidationErrors({});
        setIsLoading(false);
        setExistingPatients([]);
        setSelectedReferringPatient(null);
        setCheckingPhone(false);
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;

        // Enforce max length for phone fields
        if ((id === 'phone' || id === 'emergencyPhone') && value.length > 10) {
            return;
        }

        setFormData(prev => ({ ...prev, [id]: value }));

        // Clear validation error when user starts typing
        if (validationErrors[id]) {
            setValidationErrors(prev => ({ ...prev, [id]: null }));
        }

        // Check for existing patients when phone number is complete
        if (id === 'phone' && value.length === 10) {
            checkForExistingPatients(value);
        }
    };

    const handleSelectChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const validateAllergyField = (value) => {
        const allergyRegex = /^[a-zA-Z\s,-]*$/;
        if (value.trim() && !allergyRegex.test(value)) {
            return "Allergies can only contain letters, spaces, commas, and hyphens";
        }
        return null;
    };

    const validateStep1 = () => {
        const hasRequiredFields = formData.firstName.trim() &&
            formData.middleName.trim() &&
            formData.lastName.trim() &&
            formData.phone.trim() &&
            formData.dateOfBirth &&
            formData.gender;

        const hasNoErrors = !Object.values(validationErrors).some(error => error !== null);

        return hasRequiredFields && hasNoErrors;
    };

    const handleNext = () => {
        if (validateStep1()) {
            setStep(2);
        } else {
            toast.error("Please fill in all required fields");
        }
    };

    const handleSubmit = async () => {
        if (!appointmentDate || !appointmentTime) {
            toast.error("Please select both appointment date and time");
            return;
        }

        const selectedDateTime = new Date(
            `${appointmentDate}T${appointmentTime}`
        );

        if (selectedDateTime <= new Date()) {
            toast.error("Appointment time must be in the future");
            return;
        }

        setIsLoading(true);
        try {
            const registrationData = {
                firstName: formData.firstName.trim(),
                middleName: formData.middleName.trim(),
                lastName: formData.lastName.trim(),
                phone: formData.phone.trim(),
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                appointmentTime: appointmentTime,
                appointmentDate: appointmentDate,
                purpose: "General Consultation"
            };

            // Add referral data if patient is linked to another patient
            if (selectedReferringPatient) {
                registrationData.isReferred = true;
                registrationData.referredBy = selectedReferringPatient.id;
            }

            // Add optional fields only if they have values
            if (formData.email && formData.email.trim()) {
                registrationData.email = formData.email.trim();
            }
            if (formData.address && formData.address.trim()) {
                registrationData.address = formData.address.trim();
            }
            if (formData.emergencyContact && formData.emergencyContact.trim()) {
                registrationData.emergencyContact = formData.emergencyContact.trim();
            }
            if (formData.emergencyPhone && formData.emergencyPhone.trim()) {
                registrationData.emergencyPhone = formData.emergencyPhone.trim();
            }
            if (formData.allergies && formData.allergies.trim()) {
                // Convert allergies string to array
                registrationData.allergies = formData.allergies
                    .split(',')
                    .map(allergy => allergy.trim())
                    .filter(allergy => allergy.length > 0);
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/register-with-appointment-time`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(registrationData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Success
            const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const formattedTime = new Date(`2000-01-01T${appointmentTime}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            let successMessage = `Patient ${data.data.patient.patientNumber} registered successfully!`;
            if (data.data.appointment) {
                successMessage += ` Appointment scheduled for ${formattedDate} at ${formattedTime} with token ${data.data.appointment.tokenNumber}.`;
            }
            if (data.data.emailSent) {
                successMessage += ` Login credentials sent via email.`;
            }

            toast.success(successMessage);

            // Invalidate queries to refresh dashboard stats and appointments
            queryClient.invalidateQueries({ queryKey: ['dashboardStatistics'] });
            queryClient.invalidateQueries({ queryKey: ['todayAppointments'] });

            // Reset form and close drawer
            resetForm();
            onOpenChange(false);

            // Call success callback to refresh appointments
            if (onSuccess) {
                onSuccess();
            }

        } catch (error) {
            toast.error(error.message || 'Failed to register patient. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const generateTimeOptions = () => {
        const times = [];
        const now = new Date();

        const selectedDateIsToday =
            appointmentDate === new Date().toISOString().split('T')[0];

        for (let hour = 8; hour <= 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute
                    .toString()
                    .padStart(2, '0')}`;

                const optionDateTime = new Date(
                    `${appointmentDate || '2000-01-01'}T${timeString}`
                );

                const isPastTime =
                    selectedDateIsToday && optionDateTime <= now;

                const displayTime = new Date(
                    `2000-01-01T${timeString}`
                ).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });

                times.push({
                    value: timeString,
                    label: displayTime,
                    disabled: isPastTime
                });
            }
        }

        return times;
    };


    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => {
                if (!open) {
                    resetForm();
                }
                onOpenChange(open);
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2 text-lg">
                            <UserPlus className="h-5 w-5 text-blue-600" />
                            <span>New Appointment</span>
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            {step === 1 ? "Enter patient information" : "Select appointment date and time"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {step === 1 ? (
                            // Step 1: Patient Information Form
                            <div className="mx-auto max-w-2xl space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <Label htmlFor="firstName" className="text-sm font-medium">First Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            onBlur={() => handleBlur('firstName')}
                                            required
                                            className={`h-9 text-sm ${validationErrors.firstName ? 'border-red-500' : ''}`}
                                        />
                                        {validationErrors.firstName && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.firstName}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="middleName" className="text-sm font-medium">Middle Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="middleName"
                                            value={formData.middleName}
                                            onChange={handleInputChange}
                                            onBlur={() => handleBlur('middleName')}
                                            required
                                            className={`h-9 text-sm ${validationErrors.middleName ? 'border-red-500' : ''}`}
                                        />
                                        {validationErrors.middleName && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.middleName}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName" className="text-sm font-medium">Last Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            onBlur={() => handleBlur('lastName')}
                                            required
                                            className={`h-9 text-sm ${validationErrors.lastName ? 'border-red-500' : ''}`}
                                        />
                                        {validationErrors.lastName && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.lastName}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="phone" className="text-sm font-medium">Phone Number <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            onBlur={() => handleBlur('phone')}
                                            maxLength={10}
                                            required
                                            className={`h-9 text-sm ${validationErrors.phone ? 'border-red-500' : ''}`}
                                        />
                                        {validationErrors.phone && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
                                        )}
                                        {checkingPhone && (
                                            <p className="text-xs text-blue-500 mt-1">Checking phone number...</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                        <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="h-9 text-sm" />
                                    </div>
                                </div>

                                {/* Referrer Display Card */}
                                {selectedReferringPatient && (
                                    <div className="col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-blue-900">
                                                    Linked to: {selectedReferringPatient.fullName}
                                                </p>
                                                <p className="text-xs text-blue-700">
                                                    Patient #{selectedReferringPatient.patientNumber} • Phone: {selectedReferringPatient.phone}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth <span className="text-red-500">*</span></Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full h-9 text-sm justify-start text-left font-normal",
                                                        !formData.dateOfBirth && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formData.dateOfBirth ? format(new Date(formData.dateOfBirth), "PPP") : "Pick a date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <CustomCalendar
                                                    mode="single"
                                                    selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            handleSelectChange('dateOfBirth', format(date, "yyyy-MM-dd"));
                                                        }
                                                    }}
                                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                    initialFocus
                                                    captionLayout="dropdown"
                                                    fromYear={1900}
                                                    toYear={new Date().getFullYear()}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div>
                                        <Label htmlFor="gender" className="text-sm font-medium">Gender <span className="text-red-500">*</span></Label>
                                        <Select onValueChange={(value) => handleSelectChange('gender', value)} required>
                                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select gender" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male" className="text-sm">Male</SelectItem>
                                                <SelectItem value="female" className="text-sm">Female</SelectItem>
                                                <SelectItem value="other" className="text-sm">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="address" className="text-sm font-medium">Address (Optional)</Label>
                                    <Textarea
                                        id="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        onBlur={() => handleBlur('address')}
                                        rows={1}
                                        className={`text-sm ${validationErrors.address ? 'border-red-500' : ''}`}
                                    />
                                    {validationErrors.address && (
                                        <p className="text-xs text-red-500 mt-1">{validationErrors.address}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <Label htmlFor="emergencyContact" className="text-sm font-medium">Emergency Contact Name (Optional)</Label>
                                        <Input
                                            id="emergencyContact"
                                            value={formData.emergencyContact}
                                            onChange={handleInputChange}
                                            onBlur={() => handleBlur('emergencyContact')}
                                            className={`h-9 text-sm ${validationErrors.emergencyContact ? 'border-red-500' : ''}`}
                                        />
                                        {validationErrors.emergencyContact && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.emergencyContact}</p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="emergencyPhone" className="text-sm font-medium">Emergency Contact Phone (Optional)</Label>
                                        <Input
                                            id="emergencyPhone"
                                            type="tel"
                                            value={formData.emergencyPhone}
                                            onChange={handleInputChange}
                                            onBlur={() => handleBlur('emergencyPhone')}
                                            maxLength={10}
                                            className={`h-9 text-sm ${validationErrors.emergencyPhone ? 'border-red-500' : ''}`}
                                        />
                                        {validationErrors.emergencyPhone && (
                                            <p className="text-xs text-red-500 mt-1">{validationErrors.emergencyPhone}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Known Allergies (Optional)</Label>
                                    <Textarea
                                        id="allergies"
                                        value={formData.allergies}
                                        onChange={handleInputChange}
                                        onBlur={() => handleBlur('allergies')}
                                        placeholder="List allergies separated by commas (e.g., Penicillin, Peanuts, Latex)"
                                        rows={2}
                                        className={`h-auto text-sm ${validationErrors.allergies ? 'border-red-500' : ''}`}
                                    />
                                    {validationErrors.allergies && (
                                        <p className="text-xs text-red-500 mt-1">{validationErrors.allergies}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">Separate multiple allergies with commas</p>
                                </div>
                            </div>
                        ) : (
                            // Step 2: Date & Time Selection
                            <div className="mx-auto max-w-5xl space-y-6">
                                <div className="text-center">
                                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                                        <h3 className="font-medium text-gray-900 mb-1 text-sm">
                                            {formData.firstName} {formData.lastName}
                                        </h3>
                                        <p className="text-xs text-gray-600">{formData.phone}</p>
                                        <p className="text-xs text-gray-500">Select appointment date and time</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">Appointment Date <span className="text-red-500">*</span></Label>
                                        <p className="text-xs text-gray-600 mb-1">Choose your preferred date</p>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full h-9 text-sm justify-start text-left font-normal",
                                                        !appointmentDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {appointmentDate ? format(new Date(appointmentDate), "PPP") : "Select appointment date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={appointmentDate ? new Date(appointmentDate) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            if (date < today) {
                                                                toast.error("Cannot book appointments for past dates");
                                                                return;
                                                            }
                                                            setAppointmentDate(format(date, "yyyy-MM-dd"));
                                                        }
                                                    }}
                                                    disabled={(date) => {
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        return date < today;
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-3 lg:col-span-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-sm font-medium">Available Time Slots <span className="text-red-500">*</span></Label>
                                                <p className="text-xs text-gray-600 mt-1">Choose your preferred time slot (8:00 AM - 6:00 PM)</p>
                                            </div>
                                            {appointmentDate && (
                                                <div className="flex items-center gap-3 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                        <span className="text-gray-600">Low Traffic</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                        <span className="text-gray-600">Medium Traffic</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                        <span className="text-gray-600">High Traffic</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {!appointmentDate ? (
                                            <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                <CalendarIcon className="h-12 w-12 text-gray-400 mb-3" />
                                                <p className="text-sm font-medium text-gray-600 mb-1">Please select a date first</p>
                                                <p className="text-xs text-gray-500">Choose an appointment date to see available time slots</p>
                                            </div>
                                        ) : loadingSlots ? (
                                            <div className="flex items-center justify-center py-16">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                                                <p className="text-sm text-blue-600">Loading available slots...</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                                {/* Morning Slots */}
                                                <div>
                                                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Morning (8 AM - 12 PM)
                                                    </h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                        {generateTimeOptions()
                                                            .filter(time => {
                                                                const hour = parseInt(time.value.split(':')[0]);
                                                                return hour >= 8 && hour < 12;
                                                            })
                                                            .map((time) => {
                                                                const bookingCount = slotBookings[time.value] || 0;
                                                                const isSelected = appointmentTime === time.value;
                                                                const trafficLevel = bookingCount >= 6 ? 'high' : bookingCount >= 3 ? 'medium' : 'low';

                                                                return (
                                                                    <button
                                                                        key={time.value}
                                                                        type="button"
                                                                        disabled={time.disabled}
                                                                        onClick={() => !time.disabled && setAppointmentTime(time.value)}
                                                                        className={`
                                                                        relative p-3 rounded-lg border-2 text-left transition-all
                                                                        ${time.disabled
                                                                                ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                                                                                : isSelected
                                                                                    ? 'bg-blue-50 border-blue-500 shadow-md'
                                                                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
                                                                            }
                                                                    `}
                                                                    >
                                                                        <div className="flex items-start justify-between mb-1">
                                                                            <span className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                                                                {time.label}
                                                                            </span>
                                                                            {!time.disabled && (
                                                                                <div className={`w-2 h-2 rounded-full ${trafficLevel === 'high' ? 'bg-red-500' :
                                                                                        trafficLevel === 'medium' ? 'bg-yellow-500' :
                                                                                            'bg-green-500'
                                                                                    }`}></div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Users className="h-3 w-3 text-gray-400" />
                                                                            <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' :
                                                                                    trafficLevel === 'high' ? 'text-red-600' :
                                                                                        trafficLevel === 'medium' ? 'text-yellow-600' :
                                                                                            'text-green-600'
                                                                                }`}>
                                                                                {bookingCount}
                                                                            </span>
                                                                            <Users className="h-3 w-3 text-gray-400" />
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 mt-1">20-40 minutes</p>
                                                                        {time.disabled && (
                                                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 rounded-lg">
                                                                                <span className="text-xs text-gray-500 font-medium">Past</span>
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                </div>

                                                {/* Afternoon Slots */}
                                                <div>
                                                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Afternoon (12 PM - 5 PM)
                                                    </h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                        {generateTimeOptions()
                                                            .filter(time => {
                                                                const hour = parseInt(time.value.split(':')[0]);
                                                                return hour >= 12 && hour < 17;
                                                            })
                                                            .map((time) => {
                                                                const bookingCount = slotBookings[time.value] || 0;
                                                                const isSelected = appointmentTime === time.value;
                                                                const trafficLevel = bookingCount >= 6 ? 'high' : bookingCount >= 3 ? 'medium' : 'low';

                                                                return (
                                                                    <button
                                                                        key={time.value}
                                                                        type="button"
                                                                        disabled={time.disabled}
                                                                        onClick={() => !time.disabled && setAppointmentTime(time.value)}
                                                                        className={`
                                                                        relative p-3 rounded-lg border-2 text-left transition-all
                                                                        ${time.disabled
                                                                                ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                                                                                : isSelected
                                                                                    ? 'bg-blue-50 border-blue-500 shadow-md'
                                                                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
                                                                            }
                                                                    `}
                                                                    >
                                                                        <div className="flex items-start justify-between mb-1">
                                                                            <span className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                                                                {time.label}
                                                                            </span>
                                                                            {!time.disabled && (
                                                                                <div className={`w-2 h-2 rounded-full ${trafficLevel === 'high' ? 'bg-red-500' :
                                                                                        trafficLevel === 'medium' ? 'bg-yellow-500' :
                                                                                            'bg-green-500'
                                                                                    }`}></div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Users className="h-3 w-3 text-gray-400" />
                                                                            <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' :
                                                                                    trafficLevel === 'high' ? 'text-red-600' :
                                                                                        trafficLevel === 'medium' ? 'text-yellow-600' :
                                                                                            'text-green-600'
                                                                                }`}>
                                                                                {bookingCount}
                                                                            </span>
                                                                            <Users className="h-3 w-3 text-gray-400" />
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 mt-1">20-40 minutes</p>
                                                                        {time.disabled && (
                                                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 rounded-lg">
                                                                                <span className="text-xs text-gray-500 font-medium">Past</span>
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                </div>

                                                {/* Evening Slots */}
                                                <div>
                                                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Evening (5 PM - 8 PM)
                                                    </h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                        {generateTimeOptions()
                                                            .filter(time => {
                                                                const hour = parseInt(time.value.split(':')[0]);
                                                                return hour >= 17;
                                                            })
                                                            .map((time) => {
                                                                const bookingCount = slotBookings[time.value] || 0;
                                                                const isSelected = appointmentTime === time.value;
                                                                const trafficLevel = bookingCount >= 6 ? 'high' : bookingCount >= 3 ? 'medium' : 'low';

                                                                return (
                                                                    <button
                                                                        key={time.value}
                                                                        type="button"
                                                                        disabled={time.disabled}
                                                                        onClick={() => !time.disabled && setAppointmentTime(time.value)}
                                                                        className={`
                                                                        relative p-3 rounded-lg border-2 text-left transition-all
                                                                        ${time.disabled
                                                                                ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                                                                                : isSelected
                                                                                    ? 'bg-blue-50 border-blue-500 shadow-md'
                                                                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
                                                                            }
                                                                    `}
                                                                    >
                                                                        <div className="flex items-start justify-between mb-1">
                                                                            <span className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                                                                {time.label}
                                                                            </span>
                                                                            {!time.disabled && (
                                                                                <div className={`w-2 h-2 rounded-full ${trafficLevel === 'high' ? 'bg-red-500' :
                                                                                        trafficLevel === 'medium' ? 'bg-yellow-500' :
                                                                                            'bg-green-500'
                                                                                    }`}></div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Users className="h-3 w-3 text-gray-400" />
                                                                            <span className={`text-xs font-medium ${isSelected ? 'text-blue-600' :
                                                                                    trafficLevel === 'high' ? 'text-red-600' :
                                                                                        trafficLevel === 'medium' ? 'text-yellow-600' :
                                                                                            'text-green-600'
                                                                                }`}>
                                                                                {bookingCount}
                                                                            </span>
                                                                            <Users className="h-3 w-3 text-gray-400" />
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 mt-1">20-40 minutes</p>
                                                                        {time.disabled && (
                                                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 rounded-lg">
                                                                                <span className="text-xs text-gray-500 font-medium">Past</span>
                                                                            </div>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {appointmentTime && appointmentDate && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                        <div className="flex items-center space-x-2 text-green-800 mb-2">
                                            <CheckCircle className="h-4 w-4" />
                                            <span className="font-medium text-sm">Appointment Summary</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-green-700">
                                            <div>
                                                <strong>Date:</strong> {new Date(appointmentDate).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                            <div>
                                                <strong>Time:</strong> {new Date(`2000-01-01T${appointmentTime}`).toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex justify-center gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => {
                                resetForm();
                                onOpenChange(false);
                            }}
                            className="flex-1 max-w-[200px]"
                        >
                            Cancel
                        </Button>

                        {step === 1 ? (
                            <Button
                                onClick={handleNext}
                                className="flex-1 max-w-[200px] bg-blue-600 hover:bg-blue-700"
                                disabled={!validateStep1()}
                            >
                                Next: Select Date & Time
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                    className="flex-1 max-w-[200px]"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!appointmentTime || !appointmentDate || isLoading}
                                    className="flex-1 max-w-[200px] bg-green-600 hover:bg-green-700"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                            Booking...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-3 w-3 mr-2" />
                                            Book Appointment
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Existing Patients Dialog - Rendered outside Drawer with high z-index */}
            <Dialog open={showExistingPatientsDialog} onOpenChange={(open) => {
                // Only allow closing via Cancel button or patient selection, not by clicking outside
                if (!open) {
                }
            }}>
                <DialogContent
                    className="max-w-2xl z-[100]"
                    style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
                    onPointerDownOutside={(e) => {
                        e.preventDefault();
                    }}
                    onInteractOutside={(e) => {
                        e.preventDefault();
                    }}
                    onEscapeKeyDown={(e) => {
                        e.preventDefault();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-orange-600">
                            ⚠️ Phone Number Already Registered
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            This phone number is already associated with the following patient(s).
                            If you're registering a family member, select the referring patient:
                        </p>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {existingPatients.map((patient) => (
                                <div
                                    key={patient.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedReferringPatient?.id === patient.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedReferringPatient(patient);
                                        toast.success(`Selected: ${patient.fullName}`);
                                        setTimeout(() => {
                                            setShowExistingPatientsDialog(false);
                                        }, 300);
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">{patient.fullName}</h4>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                                <span>Patient #{patient.patientNumber}</span>
                                                <span>•</span>
                                                <span>{patient.phone}</span>
                                                {patient._count?.patientVisits > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-green-600">
                                                            {patient._count.patientVisits} visit{patient._count.patientVisits !== 1 ? 's' : ''}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {selectedReferringPatient?.id === patient.id && (
                                            <div className="ml-3">
                                                <Badge className="bg-blue-600">Selected</Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowExistingPatientsDialog(false);
                                    setSelectedReferringPatient(null);
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};



const appointmentTypeData = [
    { name: 'New Consultation', value: 400 },
    { name: 'Follow-up', value: 300 },
    { name: 'Post-Op Checkup', value: 200 },
    { name: 'Emergency', value: 100 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];


// --- Placeholder and New Components ---

const StaffSchedule = () => {
    const schedule = {
        Monday: [
            { time: '09:00 AM', type: 'Consultation', patient: 'Priya Joshi', icon: Stethoscope },
            { time: '10:30 AM', type: 'Surgery', patient: 'Arun Deshpande', icon: Briefcase },
            { time: '02:00 PM', type: 'Follow-up', patient: 'Sunita Pawar', icon: Stethoscope },
        ],
        Tuesday: [
            { time: '10:00 AM', type: 'Consultation', patient: 'Rohan Kulkarni', icon: Stethoscope },
            { time: '11:00 AM', type: 'Teleconsultation', patient: 'Anjali Patil', icon: Video },
        ],
        Wednesday: [
            { time: '09:30 AM', type: 'Surgery', patient: 'Suresh Gaikwad', icon: Briefcase },
            { time: '01:00 PM', type: 'Department Meeting', patient: 'All Staff', icon: Users },
        ],
        Thursday: [],
        Friday: [
            { time: '10:00 AM', type: 'Consultation', patient: 'Sachin More', icon: Stethoscope },
        ]
    };

    return (
        <Card className="bg-white">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>This Week's Schedule</span>
                    <Select defaultValue="week">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="View" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                    </Select>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(schedule).map(([day, events]) => (
                        <div key={day} className="border rounded-lg p-3 bg-gray-50/50">
                            <h3 className="font-semibold text-center mb-3">{day}</h3>
                            <div className="space-y-2">
                                {events.length > 0 ? events.map((event, index) => (
                                    <div key={index} className="text-xs p-2 rounded-md bg-white border border-gray-200">
                                        <p className="font-bold">{event.time}</p>
                                        <div className="flex items-center text-gray-600 mt-1">
                                            <event.icon className="h-4 w-4 mr-2 text-blue-500" />
                                            <div>
                                                <p>{event.type}</p>
                                                <p className="text-gray-500">{event.patient}</p>
                                            </div>
                                        </div>
                                    </div>
                                )) : <p className="text-xs text-center text-gray-400 py-4">No events scheduled.</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
};

const PatientCheckIn = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [tokenNumber, setTokenNumber] = useState('');
    const [patientsWithAppointments, setPatientsWithAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckinLoading, setIsCheckinLoading] = useState(false);
    const [filteredPatients, setFilteredPatients] = useState([]);

    // Fetch patients with today's appointments
    const fetchTodayPatients = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/today-appointments`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch today\'s appointments');
            }

            const data = await response.json();
            setPatientsWithAppointments(data.data || []);
            setFilteredPatients(data.data || []);
        } catch (error) {
            toast.error('Failed to load today\'s appointments');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return null;

        const dob = new Date(dateOfBirth);
        const today = new Date();

        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        return age;
    };


    // Search functionality
    useEffect(() => {
        if (!searchTerm) {
            setFilteredPatients(patientsWithAppointments);
        } else {
            const filtered = patientsWithAppointments.filter(patient =>
                patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (patient.middleName && patient.middleName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.phone.includes(searchTerm) ||
                patient.patientNumber.toString().includes(searchTerm) ||
                patient.appointments?.[0]?.tokenNumber.includes(searchTerm)
            );
            setFilteredPatients(filtered);
        }
    }, [searchTerm, patientsWithAppointments]);

    // Load data on component mount
    useEffect(() => {
        fetchTodayPatients();
    }, []);

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        setTokenNumber(''); // Receptionist will manually enter the token
    };

    // Token validation function
    const validateToken = (token) => {
        return token && token.length === 4 && /^\d{4}$/.test(token);
    };

    const resolvePriorityLabel = (patient, appointment) => {
        const age = calculateAge(patient?.dateOfBirth);

        // ✅ AGE BASED (highest priority)
        if (age !== null) {
            if (age < 14) return 'CHILDREN';
            if (age > 60) return 'SENIORS';
        }

        // ✅ APPOINTMENT TYPE BASED
        const type = appointment?.purpose?.toLowerCase() || '';

        if (type.includes('emergency')) return 'EMERGENCY';
        if (type.includes('follow')) return 'FOLLOWUP';
        if (type.includes('post-op') || type.includes('pre-op')) return 'PREPOSTOP';

        return 'ROUTINE';
    };

    const handleCheckIn = async () => {
        if (!selectedPatient || !validateToken(tokenNumber)) {
            toast.error('Please select a patient and enter a valid 4-digit token number');
            return;
        }

        const appointment = selectedPatient?.appointments?.[0];

        const priorityLabel = resolvePriorityLabel(
            selectedPatient,
            appointment
        );

        setIsCheckinLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/staff/patient/checkin`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        tokenNumber,
                        priorityLabel
                    })
                }
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to check in patient');
            }

            const patientInfo = data.data.appointment?.patient;
            const queueInfo = data.data.queueInfo;

            toast.success(
                `Patient ${patientInfo.firstName} ${patientInfo.middleName ? patientInfo.middleName + ' ' : ''}${patientInfo.lastName} checked in successfully! ` +
                `Token: ${data.data.appointment.tokenNumber}, Queue Position: ${queueInfo.queueNumber}`
            );

            setSelectedPatient(null);
            setTokenNumber('');
            await fetchTodayPatients();

        } catch (error) {
            toast.error(error.message || 'Failed to check in patient');
        } finally {
            setIsCheckinLoading(false);
        }
    };


    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
                {/* Search and Patient List */}
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <Card className="bg-white flex-1 flex flex-col min-h-0">
                        <CardHeader className="flex-shrink-0 py-3">
                            <CardTitle className="flex items-center space-x-2 text-base">
                                <Users className="h-5 w-5 text-blue-600" />
                                <span>Today's Appointments</span>
                                <Badge variant="secondary" className="ml-2">{filteredPatients.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex-1 flex flex-col min-h-0">
                            {/* Search Bar */}
                            <div className="relative mb-3 flex-shrink-0">
                                <Input
                                    type="text"
                                    placeholder="Search by name, phone, patient number, or token..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Users className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>

                            {/* Patient List */}
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8 flex-1">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                                    <span className="ml-2 text-gray-600">Loading appointments...</span>
                                </div>
                            ) : filteredPatients.length > 0 ? (
                                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 space-y-2 pr-1">
                                    {filteredPatients.map((patient) => {
                                        const appointment = patient.appointments?.[0];
                                        return (
                                            <div
                                                key={patient.id}
                                                className={`p-3 border rounded-lg cursor-pointer transition-all ${selectedPatient?.id === patient.id
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                onClick={() => handlePatientSelect(patient)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <span className="font-bold text-sm text-blue-800">{appointment?.tokenNumber}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-gray-900 truncate text-sm">
                                                                {patient.firstName} {patient.middleName ? patient.middleName + ' ' : ''}{patient.lastName}
                                                            </h4>
                                                            <p className="text-xs text-gray-600 truncate">
                                                                #{patient.patientNumber} • {patient.phone}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end justify-center ml-3 flex-shrink-0">
                                                        <Badge className="bg-green-100 text-green-800 text-xs font-medium">
                                                            {appointment?.appointmentTime}
                                                        </Badge>
                                                        <p className="text-xs text-gray-500 text-right mt-1">
                                                            {appointment?.purpose || 'General Consultation'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 flex-1">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No appointments found for today</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Check-in Panel */}
                <div className="flex flex-col min-h-0">
                    <Card className="bg-white flex-1 flex flex-col">
                        <CardHeader className="flex-shrink-0 py-3">
                            <CardTitle className="flex items-center space-x-2 text-base">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                                <span>Check-in Details</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex-1 flex flex-col justify-center">
                            {selectedPatient ? (
                                <div className="space-y-4">
                                    {/* Patient Info */}
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                                            {selectedPatient.firstName} {selectedPatient.middleName ? selectedPatient.middleName + ' ' : ''}{selectedPatient.lastName}
                                        </h4>
                                        <div className="space-y-1 text-xs text-gray-600">
                                            <p>Patient #: {selectedPatient.patientNumber}</p>
                                            <p>Phone: {selectedPatient.phone}</p>
                                            <p>Time: {selectedPatient.appointments?.[0]?.appointmentTime}</p>
                                        </div>
                                    </div>

                                    {/* Token Input */}
                                    <div className="space-y-2">
                                        <div className="text-center">
                                            <Label className="text-sm font-medium">Enter 4-Digit Token</Label>
                                            <p className="text-xs text-gray-600 mt-1">Patient's appointment token number</p>
                                        </div>
                                        <div className="flex justify-center">
                                            <InputOTP
                                                maxLength={4}
                                                value={tokenNumber}
                                                onChange={(value) => setTokenNumber(value)}
                                            >
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={0} />
                                                    <InputOTPSlot index={1} />
                                                    <InputOTPSlot index={2} />
                                                    <InputOTPSlot index={3} />
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </div>
                                    </div>

                                    {/* Check-in Button */}
                                    <Button
                                        onClick={handleCheckIn}
                                        disabled={!selectedPatient || !validateToken(tokenNumber) || isCheckinLoading}
                                        className="w-full"
                                    >
                                        {isCheckinLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Checking in...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Check-in Patient
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-500">
                                    <CheckCircle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm">Select a patient to check-in</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const StaffDashboard = () => {
    const { user, logout, fetchStaffProfile } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileFetched, setProfileFetched] = useState(false);

    // Get staff type from user context, default to receptionist
    const staffType = user?.staffType || 'receptionist';
    const staffMember = {
        name: user ? `${user.firstName} ${user.lastName}` : 'Staff Member',
        role: user?.staffType === 'receptionist' ? 'Front Desk Coordinator' : 'Staff Member'
    };

    // Use TanStack Query for auto-refreshing dashboard statistics with safe background refetching
    const { data: dashboardStats = { registrationsToday: 0, appointmentsBooked: 0, averageWaitTime: 0, averageConsultationTime: 0, isLoading: false }, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboardStatistics'],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/dashboard-statistics`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard statistics');
            }

            const result = await response.json();
            return {
                registrationsToday: result.data.registrationsToday,
                appointmentsBooked: result.data.appointmentsBooked,
                averageWaitTime: result.data.averageWaitTime,
                averageConsultationTime: result.data.averageConsultationTime,
                isLoading: false
            };
        },
        refetchInterval: 10000, // Auto-refresh every 10 seconds for real-time updates
        refetchIntervalInBackground: true, // Continue refetching in background
        refetchOnWindowFocus: true, // Refresh when window regains focus
        staleTime: 5000, // Data is fresh for 5 seconds
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

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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

    // State for collapsible stats cards
    const [showStatsCards, setShowStatsCards] = useState(true);

    // Helper function to format wait time in hours and minutes
    const formatWaitTime = (minutes) => {
        if (minutes === 0) return '0 min';
        if (minutes < 60) return `${minutes} min`;

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}min`;
    };

    const stats = [
        {
            title: "Today's Registrations",
            value: statsLoading || dashboardStats.isLoading ? "..." : dashboardStats.registrationsToday,
            icon: UserPlus
        },
        {
            title: "Appointments Booked",
            value: statsLoading || dashboardStats.isLoading ? "..." : dashboardStats.appointmentsBooked,
            icon: CalendarDays
        },
        {
            title: "Avg. Wait Time",
            value: statsLoading || dashboardStats.isLoading ? "..." : formatWaitTime(dashboardStats.averageWaitTime),
            icon: Timer
        },
        {
            title: "Avg. Consultation Time",
            value: statsLoading || dashboardStats.isLoading ? "..." : `${dashboardStats.averageConsultationTime || 0} min`,
            icon: Clock
        },
    ];

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
                
                .appointments-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .appointments-scroll::-webkit-scrollbar-track {
                    background-color: #f7fafc;
                    border-radius: 3px;
                }
                .appointments-scroll::-webkit-scrollbar-thumb {
                    background-color: #cbd5e0;
                    border-radius: 3px;
                }
                .appointments-scroll::-webkit-scrollbar-thumb:hover {
                    background-color: #a0aec0;
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
                        name: staffMember.name,
                        role: staffMember.role
                    }}
                    showNotifications={true}
                />
            </div>
            
            {/* Main Content Area - flex-1 takes remaining space */}
            <div className="flex-1 overflow-hidden">
                <div className="w-full px-4 sm:px-6 lg:max-w-[100%] lg:mx-auto lg:px-8 py-4 h-full flex flex-col">

                    {/* Dashboard Statistics Cards - Above Tabs */}
                    {showStatsCards && (
                        <div className="mb-4 flex-shrink-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                {stats.map((stat, index) => {
                                    const cardColors = [
                                        {
                                            bg: "bg-gradient-to-br from-blue-500 to-blue-600",
                                            icon: "text-blue-100",
                                            title: "text-blue-100",
                                            value: "text-white"
                                        },
                                        {
                                            bg: "bg-gradient-to-br from-green-500 to-green-600",
                                            icon: "text-green-100",
                                            title: "text-green-100",
                                            value: "text-white"
                                        },
                                        {
                                            bg: "bg-gradient-to-br from-purple-500 to-purple-600",
                                            icon: "text-purple-100",
                                            title: "text-purple-100",
                                            value: "text-white"
                                        },
                                        {
                                            bg: "bg-gradient-to-br from-orange-500 to-orange-600",
                                            icon: "text-orange-100",
                                            title: "text-orange-100",
                                            value: "text-white"
                                        }
                                    ];
                                    const colors = cardColors[index] || cardColors[0];

                                    return (
                                        <Card key={index} className={`${colors.bg} hover:shadow-lg transition-all duration-200 border-0 relative overflow-hidden`}>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                                <CardTitle className={`text-sm font-medium ${colors.title}`}>{stat.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent className="relative z-10">
                                                <div className={`text-3xl font-bold ${colors.value}`}>{stat.value}</div>
                                            </CardContent>
                                            <stat.icon className="absolute right-4 top-1/2 -translate-y-1/2 h-20 w-20 text-white/10" />
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <Tabs defaultValue="dashboard" className="flex-1 flex flex-col min-h-0">
                        <div className="relative flex-shrink-0">
                            {/* Scrollable tabs on mobile/tablet, grid on desktop */}
                            <TabsList className="w-full bg-white p-1 h-auto rounded-lg shadow-sm border overflow-x-auto flex md:grid md:grid-cols-9 gap-1">
                                <TabsTrigger 
                                    value="dashboard" 
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap flex-shrink-0 md:flex-shrink"
                                >
                                    Today's Appointments
                                </TabsTrigger>
                                <TabsTrigger
                                    value="registerAndBook"
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap flex-shrink-0 md:flex-shrink"
                                >
                                    <span className="hidden lg:inline">Patient Registration</span>
                                    <span className="lg:hidden">Register</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="checkin" 
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap flex-shrink-0 md:flex-shrink"
                                >
                                    Check-in
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="scheduled" 
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap flex-shrink-0 md:flex-shrink"
                                >
                                    <span className="hidden lg:inline">Appointments</span>
                                    <span className="lg:hidden">Scheduled</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="appointments" 
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap flex-shrink-0 md:flex-shrink"
                                >
                                    <span className="hidden lg:inline">Registered Patients</span>
                                    <span className="lg:hidden">Patients</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="currentqueue" 
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap flex-shrink-0 md:flex-shrink"
                                >
                                    <span className="hidden lg:inline">Current Queue</span>
                                    <span className="lg:hidden">Queue</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="arrivals" 
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap flex-shrink-0 md:flex-shrink"
                                >
                                    <span className="hidden lg:inline">Weekly Analytics</span>
                                    <span className="lg:hidden">Analytics</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="salary-leave" 
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap flex-shrink-0 md:flex-shrink"
                                >
                                    Salary & Leave
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="profile" 
                                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm px-1 sm:px-2 md:px-3 py-2 whitespace-nowrap flex-shrink-0 md:flex-shrink"
                                >
                                    Profile
                                </TabsTrigger>
                            </TabsList>
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
                                <AppointmentManagement />
                            </div>
                        </TabsContent>

                        <TabsContent value="registerAndBook" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                            <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Patient Registration Form - Left */}
                                <div className="h-full overflow-y-auto tab-content-container pr-1">
                                    <PatientRegistration />
                                </div>

                                {/* Recent Registrations - Right */}
                                <div className="h-full overflow-y-auto tab-content-container pr-1">
                                    <RecentRegistrationsCard />
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="checkin" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                            <div className="h-full overflow-y-auto tab-content-container pr-2">
                                <PatientCheckIn />
                            </div>
                        </TabsContent>
                        <TabsContent value="scheduled" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                            <div className="h-full overflow-y-auto tab-content-container pr-2">
                                <ScheduledAppointments />
                            </div>
                        </TabsContent>
                        <TabsContent value="appointments" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                            <QuickAppointmentBooking />
                        </TabsContent>
                        <TabsContent value="currentqueue" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                            <div className="h-full overflow-y-auto tab-content-container pr-2">
                                <CurrentQueue />
                            </div>
                        </TabsContent>
                        <TabsContent value="arrivals" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                            <div className="h-full overflow-y-auto tab-content-container pr-2">
                                <PatientArrivalsChart />
                            </div>
                        </TabsContent>
                        <TabsContent value="salary-leave" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                            <div className="h-full overflow-y-auto tab-content-container pr-2">
                                <StaffSalaryLeave staffType={user?.staffType} />
                            </div>
                        </TabsContent>

                        <TabsContent value="profile" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
                            <div className="h-full overflow-y-auto tab-content-container pr-2">
                                <ProfileTab staffType={staffType} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;