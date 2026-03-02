// src/components/staff/ScheduledAppointments.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, User, Search, Phone, Clock, Calendar, X, Edit, CalendarIcon, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import patientService from '@/services/patientService';

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

const ScheduledAppointments = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today
    const [showPartiallyCompleted, setShowPartiallyCompleted] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [patientLoading, setPatientLoading] = useState(false);
    
    // Reschedule modal states
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [rescheduleDate, setRescheduleDate] = useState(null);
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [slotBookings, setSlotBookings] = useState({});
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [rescheduling, setRescheduling] = useState(false);

    // Resume Patient modal states
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [selectedResumeAppointment, setSelectedResumeAppointment] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [tokenNumber, setTokenNumber] = useState('');
    const [resuming, setResuming] = useState(false);

    // Cancel appointment modal states
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedCancelAppointment, setSelectedCancelAppointment] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    // Fetch appointments using TanStack Query
    const { data: appointments = [], isLoading, refetch } = useQuery({
        queryKey: ['scheduledAppointments'],
        queryFn: async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/all-appointments`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch scheduled appointments');
            }

            const data = await response.json();
            return data.data || [];
        },
        refetchInterval: 30000, // Auto-refresh every 30 seconds
        refetchOnWindowFocus: true,
        staleTime: 10000,
    });

    // Fetch ophthalmologists for resume modal
    const { data: doctorsData, isLoading: doctorsLoading, isError: doctorsError } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => {
            const result = await patientService.getDoctorsList();
            console.log('📋 Full API response:', result);
            console.log('📋 result.data:', result.data);
            console.log('📋 Is result.data array?', Array.isArray(result.data));
            
            // The API returns { success: true, data: [...] }
            // patientService.getDoctorsList() returns response.data which is this whole object
            // So we need to access result.data to get the array
            const doctors = result.data || [];
            console.log('📋 Final doctors array:', doctors);
            console.log('📋 Doctors count:', doctors.length);
            
            return doctors;
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        retry: 1,
        onError: (error) => {
            console.error('❌ Failed to fetch doctors:', error);
        }
    });
    
    // Ensure ophthalmologists is always an array
    const ophthalmologists = Array.isArray(doctorsData) ? doctorsData : [];
    console.log('👨‍⚕️ Final ophthalmologists for dropdown:', ophthalmologists);

    // Filter appointments: Show all appointments (scheduled, partially completed, etc.)
    // Removed incorrect notes-based filtering - we want to show all appointments regardless of notes
    const scheduledAppointments = appointments.filter(appointment => {
        // Show appointments that are:
        // 1. SCHEDULED or RESCHEDULED status (actual scheduled appointments)
        // 2. PARTIALLY_COMPLETED (need to resume)
        // 3. Any other active appointment status
        const status = (appointment.status || '').toUpperCase();
        const visitStatus = (appointment.patientVisit?.status || '').toUpperCase();
        
        const isScheduled = status === 'SCHEDULED' || status === 'RESCHEDULED' || status === 'CHECKED_IN';
        const isPartiallyCompleted = visitStatus === 'PARTIALLY_COMPLETED' || status === 'PARTIALLY_COMPLETED';
        
        return isScheduled || isPartiallyCompleted;
    });

    // Filter appointments based on search query and date
    const filteredAppointments = scheduledAppointments.filter(appointment => {
        // 1. Check Partially Completed filter (if active)
        if (showPartiallyCompleted) {
            const isPartiallyCompleted = appointment.patientVisit?.status === 'PARTIALLY_COMPLETED' || 
                                          appointment.status === 'PARTIALLY_COMPLETED';
            if (!isPartiallyCompleted) return false;
        }

        // 2. Check search filter (if provided)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const fullName = `${appointment.firstName} ${appointment.middleName || ''} ${appointment.lastName}`.toLowerCase();
            const patientNumber = String(appointment.patientNumber || '').toLowerCase();
            const phone = String(appointment.phone || '').toLowerCase();
            const mrn = String(appointment.mrn || '').toLowerCase();
            
            const matchesSearch = fullName.includes(query) || 
                   patientNumber.includes(query) || 
                   phone.includes(query) ||
                   mrn.includes(query);
            
            if (!matchesSearch) return false;
        }

        // 3. Check date filter (if provided)
        if (selectedDate) {
            // Normalize both dates to local timezone at midnight to avoid timezone issues
            const appointmentDate = new Date(appointment.appointmentDate);
            const normalizedAppointmentDate = new Date(
                appointmentDate.getFullYear(),
                appointmentDate.getMonth(),
                appointmentDate.getDate()
            );
            
            const filterDate = new Date(selectedDate);
            const normalizedFilterDate = new Date(
                filterDate.getFullYear(),
                filterDate.getMonth(),
                filterDate.getDate()
            );
            
            // Compare timestamps of normalized dates
            if (normalizedAppointmentDate.getTime() !== normalizedFilterDate.getTime()) {
                return false;
            }
        }

        // All filters passed
        return true;
    });

    // Fetch slot bookings for a specific date
    const fetchAppointmentsByDate = async (date) => {
        setLoadingSlots(true);
        try {
            const formattedDate = format(new Date(date), 'yyyy-MM-dd');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/staff/appointments-by-date?date=${formattedDate}`,
                { credentials: 'include' }
            );

            if (response.ok) {
                const data = await response.json();
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

    // Generate time slot options
    const generateTimeOptions = () => {
        const options = [];
        const now = new Date();
        const rescheduleDateTime = rescheduleDate ? new Date(rescheduleDate) : null;
        const selectedDateIsToday =
            rescheduleDateTime &&
            rescheduleDateTime.toDateString() === now.toDateString();

        for (let hour = 8; hour < 18; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                const optionDateTime = new Date(rescheduleDateTime || now);
                optionDateTime.setHours(hour, minute, 0, 0);

                const isPast =
                    selectedDateIsToday && optionDateTime <= now;

                options.push({
                    value: timeString,
                    label: `${hour % 12 || 12}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`,
                    disabled: isPast,
                });
            }
        }
        return options;
    };

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

    // Handle opening reschedule modal
    const handleRescheduleClick = (e, appointment) => {
        e.stopPropagation(); // Prevent triggering the parent click event
        setSelectedAppointment(appointment);
        setRescheduleDate(null);
        setRescheduleTime('');
        setSlotBookings({});
        setIsRescheduleModalOpen(true);
    };

    // Handle date selection in reschedule modal
    React.useEffect(() => {
        if (rescheduleDate) {
            fetchAppointmentsByDate(rescheduleDate);
        }
    }, [rescheduleDate]);

    // Handle reschedule submission
    const handleRescheduleSubmit = async () => {
        if (!rescheduleDate || !rescheduleTime) {
            toast.error('Please select both date and time slot');
            return;
        }

        setRescheduling(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/staff/reschedule-appointment`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        appointmentId: selectedAppointment.id,
                        newDate: format(new Date(rescheduleDate), 'yyyy-MM-dd'),
                        newTime: rescheduleTime,
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to reschedule appointment');
            }

            toast.success('Appointment rescheduled successfully');
            setIsRescheduleModalOpen(false);
            refetch(); // Refresh appointments list
        } catch (error) {
            toast.error(error.message || 'Failed to reschedule appointment');
        } finally {
            setRescheduling(false);
        }
    };

    // Handle cancel appointment click
    const handleCancelClick = (e, appointment) => {
        e.stopPropagation();
        setSelectedCancelAppointment(appointment);
        setCancelReason('');
        setIsCancelModalOpen(true);
    };

    // Handle cancel appointment submission
    const handleCancelSubmit = async () => {
        setCancelling(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/staff/cancel-appointment`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        appointmentId: selectedCancelAppointment.id,
                        cancelReason: cancelReason.trim() || undefined,
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to cancel appointment');
            }

            toast.success('Appointment cancelled successfully');
            setIsCancelModalOpen(false);
            refetch();
        } catch (error) {
            toast.error(error.message || 'Failed to cancel appointment');
        } finally {
            setCancelling(false);
        }
    };

    // Handle resume patient click
    const handleResumeClick = (e, appointment) => {
        e.stopPropagation();
        setSelectedResumeAppointment(appointment);
        setSelectedDoctor('');
        setTokenNumber(''); // User must enter token number
        setIsResumeModalOpen(true);
    };

    // Handle resume patient submission — Continuation-Visit Workflow
    // Creates a NEW Appointment + NEW PatientVisit linked to the old one
    const handleResumeSubmit = async () => {
        if (!tokenNumber || !tokenNumber.trim()) {
            toast.error('Please enter a token number');
            return;
        }
        
        // Validate token number matches the appointment's actual token
        if (tokenNumber.trim() !== selectedResumeAppointment.tokenNumber) {
            toast.error(
                `Invalid token number. Expected: ${selectedResumeAppointment.tokenNumber}`,
                { duration: 4000 }
            );
            return;
        }
        
        if (!selectedDoctor) {
            toast.error('Please select a doctor');
            return;
        }

        setResuming(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/appointments/resume-partial-consultation`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        appointmentId: selectedResumeAppointment.id,
                        tokenNumber: tokenNumber.trim(),
                        assignedDoctorId: selectedDoctor,
                        priorityLabel: 'FOLLOWUP',
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create continuation visit');
            }

            const result = await response.json();

            // Show success with NEW token number from continuation visit
            const newToken = result.data?.newTokenNumber;
            const queuePos = result.data?.queueNumber;
            toast.success(
                newToken
                    ? `Continuation visit created! New Token: ${newToken}, Queue Position: ${queuePos}`
                    : result.message || 'Patient added to queue successfully',
                { duration: 5000 }
            );
            setIsResumeModalOpen(false);
            refetch(); // Refresh appointments list
        } catch (error) {
            toast.error(error.message || 'Failed to create continuation visit');
        } finally {
            setResuming(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'partially_completed': return 'bg-orange-100 text-orange-800';
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
            if (/AM|PM/i.test(timeString)) {
                return timeString.trim().replace(/\s+/g, ' ');
            }
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

    const Info = ({ label, value }) => (
        <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-gray-900">{value || '—'}</p>
        </div>
    );

    const InfoGrid = ({ children }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
        </div>
    );

    const Section = ({ title, children }) => (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b-2 border-blue-500 pb-2 inline-block">
                {title}
            </h3>
            <div className="text-sm text-gray-700">{children}</div>
        </div>
    );

    return (
        <>
            <style>{`
                .appointments-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .appointments-scroll::-webkit-scrollbar-track {
                    background: #f3f4f6;
                    border-radius: 3px;
                }
                .appointments-scroll::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 3px;
                }
                .appointments-scroll::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
                .appointments-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: #d1d5db #f3f4f6;
                }
                .modal-scroll::-webkit-scrollbar {
                    width: 4px;
                }
                .modal-scroll::-webkit-scrollbar-track {
                    background: #f3f4f6;
                    border-radius: 2px;
                }
                .modal-scroll::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 2px;
                }
                .modal-scroll::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
                .modal-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: #d1d5db #f3f4f6;
                }
            `}</style>
            <Card className="bg-white h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 flex-shrink-0">
                    <CardTitle className="flex items-center space-x-2 text-base">
                        <CalendarDays className="h-5 w-5 text-blue-600" />
                        <span>Scheduled Appointments</span>
                        {!isLoading && (
                            <Badge variant="secondary" className="ml-2">
                                {filteredAppointments.length}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0">
                    {/* Search and Filter Bar */}
                    <div className="mb-3 flex flex-col sm:flex-row gap-2 flex-shrink-0">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by name, patient number, phone, or MRN..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        
                        {/* Partially Completed Filter Button */}
                        <Button
                            variant={showPartiallyCompleted ? "default" : "outline"}
                            onClick={() => setShowPartiallyCompleted(!showPartiallyCompleted)}
                            className={cn(
                                "whitespace-nowrap",
                                showPartiallyCompleted && "bg-orange-600 hover:bg-orange-700"
                            )}
                        >
                            <Clock className="mr-2 h-4 w-4" />
                            Partially Completed
                        </Button>
                        
                        {/* Date Filter */}
                        <div className="flex gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full sm:w-[240px] justify-start text-left font-normal",
                                            !selectedDate && "text-muted-foreground"
                                        )}
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {selectedDate ? format(selectedDate, "PPP") : "Filter by date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <CalendarComponent
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            
                            {selectedDate && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedDate(null)}
                                    title="Clear date filter"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 flex-1">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                            <span className="text-gray-600">Loading scheduled appointments...</span>
                        </div>
                    ) : filteredAppointments.length > 0 ? (
                        <div className="flex-1 min-h-0 overflow-y-auto appointments-scroll space-y-2 pr-2">
                            {filteredAppointments
                                .sort((a, b) => {
                                    // Sort by date first
                                    const dateA = new Date(a.appointmentDate);
                                    const dateB = new Date(b.appointmentDate);
                                    if (dateA.getTime() !== dateB.getTime()) {
                                        return dateA - dateB;
                                    }
                                    // Then sort by time
                                    const timeA = a.appointmentTime || '';
                                    const timeB = b.appointmentTime || '';
                                    return timeA.localeCompare(timeB);
                                })
                                .map((appointment) => (
                                    <div 
                                        key={appointment.id} 
                                        className="flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" 
                                        onClick={() => fetchPatientDetails(appointment.patientId)}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="font-bold text-xs text-blue-800">{appointment.tokenNumber}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {appointment.firstName} {appointment.middleName ? appointment.middleName + ' ' : ''}{appointment.lastName}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    #{appointment.patientNumber} • {appointment.phone}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                                                        {appointment.purpose || 'General Consultation'}
                                                    </span>
                                                    <span className="text-xs text-blue-600 font-medium">
                                                        {formatDate(appointment.appointmentDate)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {/* Resume button - only show for PARTIALLY_COMPLETED appointments */}
                                            {(appointment.patientVisit?.status === 'PARTIALLY_COMPLETED' || 
                                              appointment.status === 'PARTIALLY_COMPLETED') && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => handleResumeClick(e, appointment)}
                                                    className="h-8 px-3 text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
                                                >
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Resume Patient
                                                </Button>
                                            )}
                                            {/* Reschedule + Cancel buttons - only show for SCHEDULED appointments */}
                                            {appointment.status?.toLowerCase() === 'scheduled' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => handleRescheduleClick(e, appointment)}
                                                        className="h-8 px-3 text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                                                    >
                                                        <Edit className="h-3 w-3 mr-1" />
                                                        Reschedule
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => handleCancelClick(e, appointment)}
                                                        className="h-8 px-3 text-xs border-red-300 text-red-600 hover:bg-red-50"
                                                    >
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        Cancel
                                                    </Button>
                                                </>
                                            )}
                                            <div className="flex flex-col items-end space-y-1">
                                                <div className="flex items-center text-xs font-medium text-gray-900">
                                                    <Clock className="h-3 w-3 mr-1 text-blue-600" />
                                                    {formatTime(appointment.appointmentTime)}
                                                </div>
                                                <Badge className={`${getStatusColor(appointment.patientVisit?.status || appointment.status)} text-xs`}>
                                                    {(appointment.patientVisit?.status === 'PARTIALLY_COMPLETED' || 
                                                      appointment.status === 'PARTIALLY_COMPLETED')
                                                        ? 'Partially Completed' 
                                                        : appointment.status || 'Scheduled'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="font-medium">
                                {searchQuery || selectedDate ? 'No matching scheduled appointments found' : 'No scheduled appointments found'}
                            </p>
                            {(searchQuery || selectedDate) && (
                                <p className="text-sm mt-2">Try adjusting your search or date filter</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Patient Details Modal */}
            <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                    <DialogHeader className="border-b pb-4">
                        <DialogTitle className="text-2xl font-bold text-gray-900">Patient Details</DialogTitle>
                    </DialogHeader>

                    {patientLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mr-3"></div>
                            <span className="text-gray-600 text-lg">Loading patient details...</span>
                        </div>
                    ) : selectedPatient ? (
                        <div className="space-y-6 pt-2">
                            {/* Header with Avatar */}
                            <div className="flex items-center space-x-5 pb-5 border-b">
                                <Avatar src={selectedPatient.profilePhoto} alt={selectedPatient.firstName} size="xl" />
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {selectedPatient.firstName} {selectedPatient.middleName ? selectedPatient.middleName + ' ' : ''}{selectedPatient.lastName}
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPatient.mrn && <Badge variant="outline">MRN: {selectedPatient.mrn}</Badge>}
                                        {selectedPatient.patientNumber && <Badge variant="outline">Patient #: {selectedPatient.patientNumber}</Badge>}
                                        {selectedPatient.gender && <Badge variant="secondary">{selectedPatient.gender}</Badge>}
                                    </div>
                                </div>
                            </div>

                            {/* Personal Information */}
                            {(selectedPatient.dateOfBirth || selectedPatient.bloodGroup || selectedPatient.maritalStatus || selectedPatient.occupation) && (
                                <Section title="Personal Information">
                                    <InfoGrid>
                                        {selectedPatient.dateOfBirth && <Info label="Date of Birth" value={formatDate(selectedPatient.dateOfBirth)} />}
                                        {selectedPatient.dateOfBirth && (
                                            <Info label="Age" value={`${Math.floor((new Date() - new Date(selectedPatient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))} years`} />
                                        )}
                                        {selectedPatient.bloodGroup && <Info label="Blood Group" value={selectedPatient.bloodGroup} />}
                                        {selectedPatient.maritalStatus && <Info label="Marital Status" value={selectedPatient.maritalStatus} />}
                                        {selectedPatient.occupation && <Info label="Occupation" value={selectedPatient.occupation} />}
                                    </InfoGrid>
                                </Section>
                            )}

                            {/* Contact Information */}
                            {(selectedPatient.phone || selectedPatient.email || selectedPatient.address || selectedPatient.city || selectedPatient.state || selectedPatient.pinCode) && (
                                <Section title="Contact Information">
                                    <InfoGrid>
                                        {selectedPatient.phone && <Info label="Phone" value={selectedPatient.phone} />}
                                        {selectedPatient.email && <Info label="Email" value={selectedPatient.email} />}
                                        {selectedPatient.address && <Info label="Address" value={selectedPatient.address} />}
                                        {selectedPatient.city && <Info label="City" value={selectedPatient.city} />}
                                        {selectedPatient.state && <Info label="State" value={selectedPatient.state} />}
                                        {selectedPatient.pinCode && <Info label="PIN Code" value={selectedPatient.pinCode} />}
                                    </InfoGrid>
                                </Section>
                            )}

                            {/* Emergency Contact */}
                            {(selectedPatient.emergencyContactName || selectedPatient.emergencyContactPhone || selectedPatient.emergencyContactRelation) && (
                                <Section title="Emergency Contact">
                                    <InfoGrid>
                                        {selectedPatient.emergencyContactName && <Info label="Name" value={selectedPatient.emergencyContactName} />}
                                        {selectedPatient.emergencyContactRelation && <Info label="Relationship" value={selectedPatient.emergencyContactRelation} />}
                                        {selectedPatient.emergencyContactPhone && <Info label="Phone" value={selectedPatient.emergencyContactPhone} />}
                                    </InfoGrid>
                                </Section>
                            )}

                            {/* Medical Information */}
                            {(selectedPatient.allergies || selectedPatient.currentMedications || selectedPatient.medicalHistory) && (
                                <Section title="Medical Information">
                                    <div className="space-y-3">
                                        {selectedPatient.allergies && renderList(selectedPatient.allergies) !== 'None reported' && (
                                            <Info label="Allergies" value={renderList(selectedPatient.allergies)} />
                                        )}
                                        {selectedPatient.currentMedications && renderList(selectedPatient.currentMedications) !== 'None reported' && (
                                            <Info label="Current Medications" value={renderList(selectedPatient.currentMedications)} />
                                        )}
                                        {selectedPatient.medicalHistory && renderList(selectedPatient.medicalHistory) !== 'None reported' && (
                                            <Info label="Medical History" value={renderList(selectedPatient.medicalHistory)} />
                                        )}
                                    </div>
                                </Section>
                            )}

                            {/* Appointments */}
                            {selectedPatient.appointments && selectedPatient.appointments.length > 0 && (
                                <Section title="Appointments">
                                    <div className="space-y-3">
                                        {selectedPatient.appointments.map((apt, index) => (
                                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-gray-900 mb-1">Token: {apt.tokenNumber}</p>
                                                        <p className="text-sm text-gray-700 mb-1">
                                                            {formatDate(apt.appointmentDate)} at {formatTime(apt.appointmentTime)}
                                                        </p>
                                                        {apt.purpose && <p className="text-sm text-gray-600">{apt.purpose}</p>}
                                                    </div>
                                                    <Badge className={getStatusColor(apt.status)}>
                                                        {apt.status || 'Scheduled'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* Reschedule Modal */}
            <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto modal-scroll" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                    <DialogHeader>
                        <DialogTitle>Reschedule Appointment</DialogTitle>
                    </DialogHeader>

                    {selectedAppointment && (
                        <div className="space-y-6">
                            {/* Current Appointment Details */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h3 className="font-semibold text-blue-900 mb-2">Current Appointment</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-600">Patient:</p>
                                        <p className="font-medium">{selectedAppointment.firstName} {selectedAppointment.lastName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Date:</p>
                                        <p className="font-medium">{formatDate(selectedAppointment.appointmentDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Time:</p>
                                        <p className="font-medium">{formatTime(selectedAppointment.appointmentTime)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Token:</p>
                                        <p className="font-medium">{selectedAppointment.tokenNumber}</p>
                                    </div>
                                </div>
                            </div>

                            {/* New Date Selection */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Select New Date <span className="text-red-500">*</span></Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !rescheduleDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {rescheduleDate ? format(new Date(rescheduleDate), "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarComponent
                                            mode="single"
                                            selected={rescheduleDate}
                                            onSelect={setRescheduleDate}
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

                            {/* Time Slots Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-medium">Available Time Slots <span className="text-red-500">*</span></Label>
                                        <p className="text-xs text-gray-600 mt-1">Choose your preferred time slot (8:00 AM - 6:00 PM)</p>
                                    </div>
                                    {rescheduleDate && (
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

                                {!rescheduleDate ? (
                                    <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                        <CalendarIcon className="h-12 w-12 text-gray-400 mb-3" />
                                        <p className="text-sm font-medium text-gray-600 mb-1">Please select a date first</p>
                                        <p className="text-xs text-gray-500">Choose a date to see available time slots</p>
                                    </div>
                                ) : loadingSlots ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                                        <p className="text-sm text-blue-600">Loading available slots...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[300px] overflow-y-auto modal-scroll pr-2">
                                        {/* Morning Slots */}
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Morning (8 AM - 12 PM)
                                            </h4>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                {generateTimeOptions()
                                                    .filter(time => {
                                                        const hour = parseInt(time.value.split(':')[0]);
                                                        return hour >= 8 && hour < 12;
                                                    })
                                                    .map((time) => {
                                                        const bookingCount = slotBookings[time.value] || 0;
                                                        const isSelected = rescheduleTime === time.value;
                                                        const trafficLevel = bookingCount >= 6 ? 'high' : bookingCount >= 3 ? 'medium' : 'low';

                                                        return (
                                                            <button
                                                                key={time.value}
                                                                type="button"
                                                                disabled={time.disabled}
                                                                onClick={() => !time.disabled && setRescheduleTime(time.value)}
                                                                className={`
                                                                    relative p-2 rounded-lg border-2 text-left transition-all text-xs
                                                                    ${time.disabled
                                                                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                                                                        : isSelected
                                                                            ? 'bg-blue-50 border-blue-500 shadow-md'
                                                                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
                                                                    }
                                                                `}
                                                            >
                                                                {!time.disabled && (
                                                                    <div
                                                                        className={`absolute top-1 right-1 w-2 h-2 rounded-full ${trafficLevel === 'high' ? 'bg-red-500' :
                                                                            trafficLevel === 'medium' ? 'bg-yellow-500' :
                                                                                'bg-green-500'
                                                                            }`}
                                                                    />
                                                                )}
                                                                <div className="font-medium">{time.label}</div>
                                                                {!time.disabled && (
                                                                    <div className="text-[10px] text-gray-500 mt-0.5">
                                                                        {bookingCount} booked
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
                                                Afternoon (12 PM - 6 PM)
                                            </h4>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                {generateTimeOptions()
                                                    .filter(time => {
                                                        const hour = parseInt(time.value.split(':')[0]);
                                                        return hour >= 12 && hour < 18;
                                                    })
                                                    .map((time) => {
                                                        const bookingCount = slotBookings[time.value] || 0;
                                                        const isSelected = rescheduleTime === time.value;
                                                        const trafficLevel = bookingCount >= 6 ? 'high' : bookingCount >= 3 ? 'medium' : 'low';

                                                        return (
                                                            <button
                                                                key={time.value}
                                                                type="button"
                                                                disabled={time.disabled}
                                                                onClick={() => !time.disabled && setRescheduleTime(time.value)}
                                                                className={`
                                                                    relative p-2 rounded-lg border-2 text-left transition-all text-xs
                                                                    ${time.disabled
                                                                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-50'
                                                                        : isSelected
                                                                            ? 'bg-blue-50 border-blue-500 shadow-md'
                                                                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
                                                                    }
                                                                `}
                                                            >
                                                                {!time.disabled && (
                                                                    <div
                                                                        className={`absolute top-1 right-1 w-2 h-2 rounded-full ${trafficLevel === 'high' ? 'bg-red-500' :
                                                                            trafficLevel === 'medium' ? 'bg-yellow-500' :
                                                                                'bg-green-500'
                                                                            }`}
                                                                    />
                                                                )}
                                                                <div className="font-medium">{time.label}</div>
                                                                {!time.disabled && (
                                                                    <div className="text-[10px] text-gray-500 mt-0.5">
                                                                        {bookingCount} booked
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

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsRescheduleModalOpen(false)}
                                    disabled={rescheduling}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleRescheduleSubmit}
                                    disabled={!rescheduleDate || !rescheduleTime || rescheduling}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {rescheduling ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Rescheduling...
                                        </>
                                    ) : (
                                        'Confirm Reschedule'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Continuation Visit Modal */}
            <Dialog open={isResumeModalOpen} onOpenChange={setIsResumeModalOpen}>
                <DialogContent className="max-w-2xl" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                    <DialogHeader>
                        <DialogTitle>Resume Patient — Continuation Visit</DialogTitle>
                    </DialogHeader>

                    {selectedResumeAppointment && (
                        <div className="space-y-6">
                            {/* Current Appointment Details */}
                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <h3 className="font-semibold text-orange-900 mb-2">Patient Information</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-600">Patient:</p>
                                        <p className="font-medium">{selectedResumeAppointment.firstName} {selectedResumeAppointment.lastName}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Patient Number:</p>
                                        <p className="font-medium">#{selectedResumeAppointment.patientNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Phone:</p>
                                        <p className="font-medium">{selectedResumeAppointment.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Original Date:</p>
                                        <p className="font-medium">{formatDate(selectedResumeAppointment.appointmentDate)}</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-orange-200">
                                    <p className="text-xs text-orange-700">
                                        🔄 A new appointment and visit will be created, linked to the original visit.
                                        The patient will be placed directly in the ophthalmologist queue (optometrist skipped).
                                    </p>
                                </div>
                            </div>

                            {/* Token Number - User Input Required */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Token Number <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        value={tokenNumber}
                                        onChange={(e) => setTokenNumber(e.target.value)}
                                        placeholder="Enter token number for verification"
                                        className={`pr-10 ${
                                            tokenNumber.trim() && tokenNumber.trim() === selectedResumeAppointment.tokenNumber
                                                ? 'border-green-500 focus:ring-green-500'
                                                : tokenNumber.trim() && tokenNumber.trim() !== selectedResumeAppointment.tokenNumber
                                                ? 'border-red-500 focus:ring-red-500'
                                                : ''
                                        }`}
                                    />
                                    {tokenNumber.trim() && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {tokenNumber.trim() === selectedResumeAppointment.tokenNumber ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <X className="h-5 w-5 text-red-500" />
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-600 flex items-center gap-1">
                                        <span className="font-medium">Expected Token:</span>
                                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                                            {selectedResumeAppointment.tokenNumber}
                                        </span>
                                    </p>
                                    {tokenNumber.trim() && tokenNumber.trim() !== selectedResumeAppointment.tokenNumber && (
                                        <p className="text-xs text-red-600 font-medium">
                                            Token doesn't match!
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Doctor Selection */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Assign to Doctor <span className="text-red-500">*</span>
                                </Label>
                                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select an ophthalmologist" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ophthalmologists.map((doctor) => (
                                            <SelectItem key={doctor.id} value={doctor.id}>
                                                {doctor.name}
                                                {doctor.specialization && ` - ${doctor.specialization}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsResumeModalOpen(false)}
                                    disabled={resuming}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleResumeSubmit}
                                    disabled={
                                        !tokenNumber || 
                                        !selectedDoctor || 
                                        tokenNumber.trim() !== selectedResumeAppointment.tokenNumber || 
                                        resuming
                                    }
                                    className="bg-orange-600 hover:bg-orange-700"
                                >
                                    {resuming ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Adding to Queue...
                                        </>
                                    ) : (
                                        'Add to Queue'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {/* Cancel Appointment Modal */}
            <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                <DialogContent className="max-w-md" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-700">
                            <XCircle className="h-5 w-5" />
                            Cancel Appointment
                        </DialogTitle>
                    </DialogHeader>

                    {selectedCancelAppointment && (
                        <div className="space-y-5">
                            {/* Patient info summary */}
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <h3 className="font-semibold text-red-900 mb-2">Appointment to Cancel</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-600">Patient:</p>
                                        <p className="font-medium">
                                            {selectedCancelAppointment.firstName}{' '}
                                            {selectedCancelAppointment.middleName
                                                ? selectedCancelAppointment.middleName + ' '
                                                : ''}
                                            {selectedCancelAppointment.lastName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Patient #:</p>
                                        <p className="font-medium">#{selectedCancelAppointment.patientNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Date:</p>
                                        <p className="font-medium">{formatDate(selectedCancelAppointment.appointmentDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Time:</p>
                                        <p className="font-medium">{formatTime(selectedCancelAppointment.appointmentTime)}</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-red-200">
                                    <p className="text-xs text-red-700">
                                        ⚠️ This action cannot be undone. The appointment will be marked as cancelled.
                                    </p>
                                </div>
                            </div>

                            {/* Cancel reason */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Reason for Cancellation <span className="text-gray-400">(optional)</span>
                                </Label>
                                <textarea
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Enter reason for cancellation..."
                                    rows={3}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                                />
                            </div>

                            {/* Action buttons */}
                            <div className="flex justify-end gap-3 pt-2 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCancelModalOpen(false)}
                                    disabled={cancelling}
                                >
                                    Go Back
                                </Button>
                                <Button
                                    onClick={handleCancelSubmit}
                                    disabled={cancelling}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {cancelling ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Cancelling...
                                        </>
                                    ) : (
                                        'Confirm Cancellation'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ScheduledAppointments;
