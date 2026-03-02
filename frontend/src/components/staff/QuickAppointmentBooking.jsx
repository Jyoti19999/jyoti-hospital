// src/components/staff/QuickAppointmentBooking.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Users,
  User,
  Calendar,
  Clock,
  CheckCircle,
  Search,
  UserPlus,
  AlertCircle,
  Phone,
  Mail,
  UserCheck,
  X,
  XCircle,
  QrCode,
  MapPin,
  Activity,
  FileText,
  Stethoscope
} from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import patientService from '@/services/patientService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertOctagon } from "lucide-react";

const QuickAppointmentBooking = () => {
  const queryClient = useQueryClient();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointmentType, setAppointmentType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [todayAppointmentPatientIds, setTodayAppointmentPatientIds] = useState(new Set());
  const [futureAppointments, setFutureAppointments] = useState({});
  const [bookingMode, setBookingMode] = useState('instant'); // instant | scheduled
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const isScheduledBooking = bookingMode === 'scheduled';

  // Slot booking state
  const [slotBookings, setSlotBookings] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Patient detail modal state
  const [showPatientDetailModal, setShowPatientDetailModal] = useState(false);
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState({ past: [], inProgress: [], future: [], all: [] });
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);

  // Partially completed appointments tracking
  const [partiallyCompletedAppointments, setPartiallyCompletedAppointments] = useState({});

  // Active appointments tracking - single source of truth from backend isActive field
  const [activeAppointmentPatientIds, setActiveAppointmentPatientIds] = useState(new Set());

  // Action mode for partially completed patients
  const [actionMode, setActionMode] = useState('new'); // 'new' | 'resume'

  // Resume modal states
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [selectedResumeAppointment, setSelectedResumeAppointment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [tokenNumber, setTokenNumber] = useState('');
  const [resuming, setResuming] = useState(false);


  // Appointment types
  const appointmentTypes = [
    { value: 'Follow-up', label: 'Follow-up Visit', color: 'bg-blue-100 text-blue-800' },
    { value: 'Post-Op Checkup', label: 'Post-Op Checkup', color: 'bg-green-100 text-green-800' },
    { value: 'Emergency', label: 'Emergency Consultation', color: 'bg-red-100 text-red-800' },
    { value: 'Routine', label: 'Routine Checkup', color: 'bg-purple-100 text-purple-800' },
    { value: 'Referral', label: 'Referral', color: 'bg-teal-100 text-teal-800' }
  ];

  // Helper function to check if an appointment is completed/discontinued/cancelled
  const isAppointmentFinished = (appointment) => {
    const status = appointment?.status?.toUpperCase();
    return (
      status === 'COMPLETED' ||
      status === 'DISCONTINUED' ||
      status === 'CANCELLED' ||
      status === 'NO_SHOW'
    );
  };

  // Helper function to check if an appointment is active (ongoing/scheduled)
  const isAppointmentActive = (appointment) => {
    const status = appointment?.status?.toUpperCase();
    return (
      status === 'SCHEDULED' ||
      status === 'CHECKED_IN' ||
      status === 'RESCHEDULED'
    );
  };

  // Helper function to format checkedInAt timestamp
  const formatCheckedInTime = (checkedInAt) => {
    if (!checkedInAt) return null;

    try {
      const date = new Date(checkedInAt);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting checked-in time:', error);
      return null;
    }
  };

  // Helper function to categorize appointments correctly
  const categorizeAppointments = (appointments) => {
    if (!appointments || !Array.isArray(appointments)) {
      return { past: [], inProgress: [], future: [], all: [] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const past = [];
    const inProgress = [];
    const future = [];

    appointments.forEach(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      appointmentDate.setHours(0, 0, 0, 0);
      const status = appointment?.status?.toUpperCase();

      // Appointment goes to History if:
      // 1. It's finished (COMPLETED, DISCONTINUED, CANCELLED, NO_SHOW)
      // 2. OR status is PARTIALLY_COMPLETED (always history — can't "upcoming" a partial)
      // 3. OR the date is in the past and not checked in
      if (isAppointmentFinished(appointment) || status === 'PARTIALLY_COMPLETED' || (appointmentDate < today && status !== 'CHECKED_IN')) {
        past.push(appointment);
      }
      // Appointment goes to In Progress if:
      // 1. Patient is CHECKED_IN (physically present in hospital)
      else if (status === 'CHECKED_IN') {
        inProgress.push(appointment);
      }
      // Appointment goes to Upcoming if:
      // 1. Status is SCHEDULED or RESCHEDULED (not yet checked in)
      // 2. AND status is NOT finished
      else if (!isAppointmentFinished(appointment) && (status === 'SCHEDULED' || status === 'RESCHEDULED')) {
        future.push(appointment);
      }
    });

    // Sort past appointments by date (most recent first)
    past.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

    // Sort in-progress appointments by appointment time
    inProgress.sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''));

    // Sort future appointments by date (earliest first)
    future.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

    return {
      past,
      inProgress,
      future,
      all: appointments
    };
  };

  // Fetch ophthalmologists for resume modal
  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const result = await patientService.getDoctorsList();
      const doctors = result.data || [];
      return doctors;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const ophthalmologists = Array.isArray(doctorsData) ? doctorsData : [];

  // Fetch all patients and today's appointments on component mount
  useEffect(() => {
    fetchAllPatients();
    fetchTodayAppointments();
  }, []);

  // Set default appointment type to 'Routine' when patient is selected
  useEffect(() => {
    if (selectedPatient && !appointmentType) {
      setAppointmentType('Routine');
    }
  }, [selectedPatient]);

  const fetchTodayAppointments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/today-appointment-patients`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch today\'s appointments');
      }

      const data = await response.json();

      // Filter to only include patients with ACTIVE appointments today
      // Active = SCHEDULED, CHECKED_IN, RESCHEDULED
      // Allow rebooking for: COMPLETED, PARTIALLY_COMPLETED, DISCONTINUED, CANCELLED, NO_SHOW
      const todayAppointments = data.data.todayAppointments || [];

      // If backend provides appointment details with status, filter for active ones
      if (todayAppointments.length > 0 && todayAppointments[0].status) {
        const activePatientIds = new Set(
          todayAppointments
            .filter(apt => isAppointmentActive(apt))
            .map(apt => apt.patientId)
        );
        setTodayAppointmentPatientIds(activePatientIds);
      } else {
        // Fallback: if backend only provides patient IDs (old format)
        // This is less ideal but maintains backward compatibility
        const patientIds = new Set(data.data.todayPatientIds || []);
        setTodayAppointmentPatientIds(patientIds);
      }

      setFutureAppointments(data.data.futureAppointments || {});
    } catch (error) {
      // Don't show error toast, just log it
    }
  };

  const fetchAllPatients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/all-patients`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();
      const patientsData = data.data || [];
      setPatients(patientsData);

      // Backend now provides active appointment info directly - no need for individual API calls!
      // Use meta.blockedPatientIds to populate activeAppointmentPatientIds
      const blockedIds = data.meta?.blockedPatientIds || [];
      setActiveAppointmentPatientIds(new Set(blockedIds));

      console.log(`✅ Active appointments tracked: ${blockedIds.length} patients blocked`);

      // Still need to fetch partially completed appointments individually
      // (Backend doesn't provide this in all-patients endpoint yet)
      const partiallyCompleted = {};

      for (const patient of patientsData) {
        try {
          const aptResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/staff/patient/${patient.id}/appointments`,
            {
              method: 'GET',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            }
          );

          if (aptResponse.ok) {
            const aptData = await aptResponse.json();
            const appointments = aptData.data.appointments?.all || aptData.data.appointments || [];

            // Find the most recent partially completed appointment
            const partiallyCompletedApt = appointments
              .filter(apt =>
                apt.status?.toUpperCase() === 'PARTIALLY_COMPLETED' ||
                apt.patientVisit?.status === 'PARTIALLY_COMPLETED'
              )
              .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))[0];

            if (partiallyCompletedApt) {
              partiallyCompleted[patient.id] = partiallyCompletedApt;
            }
          }
        } catch (err) {
          // Silently fail for individual patient appointment fetches
          console.error(`Failed to fetch appointments for patient ${patient.id}:`, err);
        }
      }

      setPartiallyCompletedAppointments(partiallyCompleted);
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => {
    if (!searchTerm.trim()) return true; // Show all patients when search is empty

    const searchLower = searchTerm.toLowerCase().trim();

    // Build full name for comprehensive name matching (supports multi-word queries)
    const fullName = [
      patient.firstName || '',
      patient.middleName || '',
      patient.lastName || ''
    ].filter(Boolean).join(' ').toLowerCase();

    const matches = (
      // Full name search (handles "Jay Shankar", "Jay Ghatge", etc.)
      fullName.includes(searchLower) ||
      // Individual field searches (for backward compatibility)
      (patient.firstName && patient.firstName.toLowerCase().includes(searchLower)) ||
      (patient.middleName && patient.middleName.toLowerCase().includes(searchLower)) ||
      (patient.lastName && patient.lastName.toLowerCase().includes(searchLower)) ||
      (patient.patientNumber && String(patient.patientNumber).toLowerCase().includes(searchLower)) ||
      (patient.phone && String(patient.phone).includes(searchTerm.trim())) ||
      (patient.email && patient.email.toLowerCase().includes(searchLower))
    );

    return matches;
  });

  const handlePatientSelect = (patient) => {
    // Block selection for patients with active appointments (isActive = true)
    // Use backend-provided field first, fall back to Set for safety
    const isBlocked = patient.hasActiveAppointment || activeAppointmentPatientIds.has(patient.id);

    if (isBlocked) {
      toast.warning(
        'Patient already has an active appointment in progress.',
        { duration: 3000 }
      );
      return;
    }

    setSelectedPatient(patient);

    // Reset action mode to 'new' when selecting a patient
    // If patient has partially completed appointment, default to showing options
    setActionMode('new');
  };

  // New function to view patient appointment history
  const handleViewPatientDetails = async (patient, e) => {
    e.stopPropagation(); // Prevent triggering patient selection

    setSelectedPatientForDetails(patient);
    setShowPatientDetailModal(true);
    setLoadingPatientDetails(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/staff/patient/${patient.id}/appointments`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch patient appointments');
      }

      const data = await response.json();

      // Apply client-side categorization to ensure discontinued appointments
      // are properly placed in History and removed from Upcoming
      const categorizedAppointments = categorizeAppointments(data.data.appointments.all || data.data.appointments);
      setPatientAppointments(categorizedAppointments);

      // Update patient details with full info
      setSelectedPatientForDetails(data.data.patient);

    } catch (error) {
      toast.error('Failed to load patient appointment history');
      console.error('Error fetching patient appointments:', error);
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  // Handle resume patient click
  const handleResumeClick = () => {
    if (!selectedPatient || !partiallyCompletedAppointments[selectedPatient.id]) {
      toast.error('No partially completed appointment found for this patient');
      return;
    }

    setSelectedResumeAppointment(partiallyCompletedAppointments[selectedPatient.id]);
    setSelectedDoctor('');
    setTokenNumber('');
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

      // Immediately update active appointment state to disable the patient row in UI
      setActiveAppointmentPatientIds(prev => new Set([...prev, selectedPatient.id]));

      // Also update today's appointment tracking since continuation is active today
      setTodayAppointmentPatientIds(prev => new Set([...prev, selectedPatient.id]));

      // Remove from partially completed since continuation visit was created
      setPartiallyCompletedAppointments(prev => {
        const updated = { ...prev };
        delete updated[selectedPatient.id];
        return updated;
      });

      setIsResumeModalOpen(false);

      // Refresh the patient list to update active appointment state
      fetchAllPatients();

      // Clear selected patient and reset action mode
      setSelectedPatient(null);
      setActionMode('new');

      // Clear resume modal states
      setSelectedResumeAppointment(null);
      setSelectedDoctor('');
      setTokenNumber('');
    } catch (error) {
      toast.error(error.message || 'Failed to create continuation visit');
    } finally {
      setResuming(false);
    }
  };

  // Fetch appointments by date for slot selection
  const fetchAppointmentsByDate = async (date) => {
    if (!date) return;

    try {
      setLoadingSlots(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/staff/appointments-by-date?date=${date}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch appointments' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to fetch appointments');
      }

      const data = await response.json();
      console.log('API Response:', data);

      // Transform timeSlots into slot bookings by time
      const bookingsByTime = {};
      const timeSlots = data.data?.timeSlots || [];

      console.log('Fetched time slots for date:', date, timeSlots);

      timeSlots.forEach(slot => {
        if (slot.appointmentCount > 0) {
          bookingsByTime[slot.time] = slot.appointments;
        }
      });

      console.log('Slot bookings:', bookingsByTime);

      setSlotBookings(bookingsByTime);
    } catch (error) {
      console.error('Error fetching appointments by date:', error);
      toast.error('Failed to load appointment slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch slots when date changes
  useEffect(() => {
    if (bookingMode === 'scheduled' && scheduledDate) {
      fetchAppointmentsByDate(scheduledDate);
    }
  }, [scheduledDate, bookingMode]);

  const handleBookAppointment = async () => {
    if (!selectedPatient || !appointmentType) {
      toast.error('Please select a patient and appointment type');
      return;
    }

    // Validate scheduled appointments
    if (bookingMode === 'scheduled') {
      if (!scheduledDate || !scheduledTime) {
        toast.error('Please select both date and time for scheduled appointment');
        return;
      }

      const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (selectedDateTime <= new Date()) {
        toast.error('Appointment time must be in the future');
        return;
      }
    }

    try {
      setIsBooking(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/staff/book-instant-appointment`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          appointmentType,
          purpose,
          notes,
          appointmentDate: bookingMode === 'scheduled' ? scheduledDate : null,
          appointmentTime: bookingMode === 'scheduled' ? scheduledTime : null
        })
      }
      );

      const data = await response.json();

      if (!response.ok) {
        // Show the specific error message from the backend
        toast.error(data.message || 'Failed to book appointment');

        // If backend rejects due to active appointment, refresh patient list to sync UI
        if (data.message && data.message.includes('active appointment')) {
          fetchAllPatients();
        }

        return;
      }


      toast.success(data.message);

      // Immediately update active appointment state to disable the patient row in UI
      setActiveAppointmentPatientIds(prev => new Set([...prev, selectedPatient.id]));

      // If booking for today, also update today's appointment tracking
      const appointmentDate = bookingMode === 'scheduled' ? scheduledDate : new Date().toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      if (appointmentDate === today) {
        setTodayAppointmentPatientIds(prev => new Set([...prev, selectedPatient.id]));
      }

      // Invalidate queries to refresh dashboard stats and appointments
      queryClient.invalidateQueries({ queryKey: ['dashboardStatistics'] });
      queryClient.invalidateQueries({ queryKey: ['todayAppointments'] });

      // Only show success dialog for INSTANT bookings
      if (!isScheduledBooking) {
        setBookedAppointment({
          ...data.data.appointment,
          patientName: `${selectedPatient.firstName} ${selectedPatient.middleName ? selectedPatient.middleName + ' ' : ''}${selectedPatient.lastName}`,
          patientNumber: selectedPatient.patientNumber
        });
        setShowSuccessDialog(true);
      }

      // Always refresh appointments
      fetchTodayAppointments();

      // Save scheduledDate before resetting to use for slot refresh
      const dateToRefresh = scheduledDate;

      // Reset form first
      setSelectedPatient(null);
      setAppointmentType('');
      setPurpose('');
      setNotes('');
      setScheduledDate('');
      setScheduledTime('');

      // Refresh slot data after resetting form
      // For instant appointments, refresh today's date if it was selected
      // For scheduled appointments, refresh the selected date
      if (dateToRefresh) {
        if (bookingMode === 'instant') {
          const today = new Date().toISOString().split('T')[0];
          // Refresh if the selected date is today (where instant appointment was booked)
          if (dateToRefresh === today) {
            fetchAppointmentsByDate(dateToRefresh);
          }
        } else {
          // Always refresh for scheduled appointments
          fetchAppointmentsByDate(dateToRefresh);
        }
      }



    } catch (error) {
      toast.error(error.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const generateTimeOptions = () => {
    const times = [];
    const now = new Date();

    const selectedDateIsToday =
      scheduledDate === new Date().toISOString().split('T')[0];

    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`;

        const optionDateTime = new Date(
          `${scheduledDate || '2000-01-01'}T${timeString}`
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

  const mapAppointmentTypeToPriority = (appointmentType) => {
    if (!appointmentType) return 'ROUTINE';

    const type = appointmentType.toLowerCase();

    // Emergency
    if (type.includes('emergency')) return 'EMERGENCY';

    // Follow-up
    if (type.includes('follow')) return 'FOLLOWUP';

    // Pre / Post Op
    if (
      type.includes('pre-op') ||
      type.includes('pre op') ||
      type.includes('post-op') ||
      type.includes('post op')
    ) {
      return 'PREPOSTOP';
    }

    // Priority
    if (type.includes('priority')) return 'PRIORITY';

    // Children
    if (type.includes('child')) return 'CHILDREN';

    // Seniors
    if (type.includes('senior')) return 'SENIORS';

    // Long wait
    if (type.includes('long')) return 'LONGWAIT';

    // Referral
    if (type.includes('referral') || type.includes('refer')) return 'REFERRAL';

    // Default
    return 'ROUTINE';
  };



  const handleCheckIn = async () => {
    if (!bookedAppointment || !bookedAppointment.tokenNumber) {
      toast.error('No token number available for check-in');
      return;
    }

    const priorityLabel = mapAppointmentTypeToPriority(
      bookedAppointment.appointmentType
    );


    setIsCheckingIn(true);
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
            tokenNumber: bookedAppointment.tokenNumber,
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

      setShowSuccessDialog(false);
      setBookedAppointment(null);

    } catch (error) {
      toast.error(error.message || 'Failed to check in patient');
    } finally {
      setIsCheckingIn(false);
    }
  };


  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    setBookedAppointment(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Appointment Booking</h1>
        <p className="text-gray-600 text-sm">Book appointments for patients</p>
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
        {/* Patient Selection Panel */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <Card className="bg-white flex-1 flex flex-col min-h-0">
            <CardHeader className="flex-shrink-0 py-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Select Patient</span>
                <Badge variant="secondary" className="ml-2">{filteredPatients.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col min-h-0">
              {/* Search */}
              <div className="relative mb-3 flex-shrink-0">
                <Input
                  type="text"
                  placeholder="Search by name, phone, patient number, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                {searchTerm && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Search Results Info */}
              {searchTerm && (
                <div className="mb-2 text-sm text-gray-600 flex-shrink-0">
                  {filteredPatients.length} of {patients.length} patients found
                </div>
              )}

              {/* Patient List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8 flex-1">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                  <span className="ml-2 text-gray-600">Loading patients...</span>
                </div>
              ) : filteredPatients.length > 0 ? (
                <div className="flex-1 min-h-0">
                  <TooltipProvider>
                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 space-y-2 h-full pr-1">
                      {filteredPatients.map((patient) => {
                        // Active appointment check - use backend-provided field (highest priority)
                        // Backend now includes hasActiveAppointment and activeAppointment details in patient object
                        const hasActiveAppointment = patient.hasActiveAppointment || activeAppointmentPatientIds.has(patient.id);
                        const hasAppointmentToday = todayAppointmentPatientIds.has(patient.id);
                        const futureAppointment = futureAppointments[patient.id];
                        const hasPartiallyCompleted = partiallyCompletedAppointments[patient.id];

                        const patientCard = (
                          <div
                            key={patient.id}
                            className={`p-3 border rounded-lg transition-all ${hasActiveAppointment
                              ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                              : selectedPatient?.id === patient.id
                                ? 'border-blue-500 bg-blue-50 cursor-pointer'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                              }`}
                            onClick={() => !hasActiveAppointment && handlePatientSelect(patient)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 truncate text-sm">
                                    {patient.firstName || 'N/A'} {patient.middleName ? patient.middleName + ' ' : ''}{patient.lastName || ''}
                                  </h4>
                                  <p className="text-sm text-gray-600 truncate">
                                    #{patient.patientNumber || 'N/A'} • {patient.phone || 'No phone'}
                                  </p>
                                  {patient.email && (
                                    <p className="text-xs text-gray-500 truncate">
                                      {patient.email}
                                    </p>
                                  )}
                                  {/* Active appointment badge - distinguish between checked-in vs scheduled */}
                                  {hasActiveAppointment && (
                                    <div className="mt-1">
                                      {patient.activeAppointment?.status === 'CHECKED_IN' ? (
                                        <Badge className="bg-green-100 text-green-800 text-xs border border-green-300">
                                          <Activity className="h-3 w-3 mr-1 inline" />
                                          {(() => {
                                            const checkedInAt =
                                              patient.activeAppointment?.patientVisit?.checkedInAt ||
                                              patient.activeAppointment?.checkedInAt;
                                            const fallbackTime = patient.activeAppointment?.time;
                                            if (checkedInAt) return `In Progress – Checked In at ${formatCheckedInTime(checkedInAt)}`;
                                            if (fallbackTime) return `In Progress – ${fallbackTime}`;
                                            return 'In Progress';
                                          })()}
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-blue-100 text-blue-800 text-xs border border-blue-300">
                                          <Calendar className="h-3 w-3 mr-1 inline" />
                                          Scheduled{patient.activeAppointment?.time && ` – ${patient.activeAppointment.time}`}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  {/* Partially completed badge - only if no active appointment */}
                                  {hasPartiallyCompleted && !hasActiveAppointment && (
                                    <div className="mt-1">
                                      <Badge className="bg-orange-100 text-orange-800 text-xs border border-orange-300">
                                        <Clock className="h-3 w-3 mr-1 inline" />
                                        Incomplete Previous Visit
                                      </Badge>
                                    </div>
                                  )}
                                  {futureAppointment && !hasActiveAppointment && (
                                    <p className="text-xs text-blue-600 truncate mt-1">
                                      📅 Next: {new Date(futureAppointment.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      {futureAppointment.appointmentTime && ` at ${futureAppointment.appointmentTime}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end justify-center ml-4 flex-shrink-0 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => handleViewPatientDetails(patient, e)}
                                  className="text-xs h-7 px-2"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                {/* Badge logic: distinguish between checked-in vs scheduled */}
                                {hasActiveAppointment ? (
                                  // Check if patient is checked in (in progress) or just scheduled
                                  patient.activeAppointment?.status === 'CHECKED_IN' ? (
                                    <Badge className="bg-green-100 text-green-800 text-xs border border-green-300">
                                      <Activity className="h-3 w-3 mr-1 inline" />
                                      {(() => {
                                        const checkedInAt =
                                          patient.activeAppointment?.patientVisit?.checkedInAt ||
                                          patient.activeAppointment?.checkedInAt;
                                        const fallbackTime = patient.activeAppointment?.time;
                                        if (checkedInAt) return `In Progress – ${formatCheckedInTime(checkedInAt)}`;
                                        if (fallbackTime) return `In Progress – ${fallbackTime}`;
                                        return 'In Progress';
                                      })()}
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-blue-100 text-blue-800 text-xs border border-blue-300">
                                      <Calendar className="h-3 w-3 mr-1 inline" />
                                      Scheduled
                                    </Badge>
                                  )
                                ) : hasAppointmentToday ? (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs border border-blue-300">
                                    <Calendar className="h-3 w-3 mr-1 inline" />
                                    Scheduled Today
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800 text-xs">
                                    {patient.gender || 'N/A'}
                                  </Badge>
                                )}
                                <p className="text-xs text-gray-500">
                                  {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'DOB N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );

                        // Wrap with Tooltip if patient has active appointment
                        if (hasActiveAppointment) {
                          const activeApt = patient.activeAppointment;
                          const isCheckedIn = activeApt?.status === 'CHECKED_IN';
                          return (
                            <Tooltip key={patient.id}>
                              <TooltipTrigger asChild>
                                {patientCard}
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-semibold">
                                  {isCheckedIn ? '🚫 Active Appointment in Progress' : '📅 Appointment Scheduled'}
                                </p>
                                {activeApt && (
                                  <div className="text-xs mt-2 space-y-1">
                                    <p><span className="font-medium">Token:</span> {activeApt.tokenNumber}</p>
                                    <p><span className="font-medium">Date:</span> {new Date(activeApt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    <p><span className="font-medium">Time:</span> {activeApt.time}</p>
                                    <p><span className="font-medium">Status:</span> {activeApt.status}</p>
                                  </div>
                                )}
                                <p className="text-xs mt-2 text-gray-400 border-t pt-2">
                                  {isCheckedIn
                                    ? 'Cannot book - Patient currently in treatment'
                                    : 'Cannot book - Patient has scheduled appointment'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        if (hasAppointmentToday) {
                          return (
                            <Tooltip key={patient.id}>
                              <TooltipTrigger asChild>
                                {patientCard}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>This patient has an active appointment today</p>
                                <p className="text-xs mt-1 text-gray-400">Completed appointments allow rebooking</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        if (futureAppointment) {
                          return (
                            <Tooltip key={patient.id}>
                              <TooltipTrigger asChild>
                                {patientCard}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Next appointment: {new Date(futureAppointment.appointmentDate).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}</p>
                                {futureAppointment.appointmentTime && <p className="text-xs">Time: {futureAppointment.appointmentTime}</p>}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        return patientCard;
                      })}
                    </div>
                  </TooltipProvider>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 flex-1 flex flex-col justify-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No patients found</p>
                  {searchTerm && (
                    <p className="text-sm mt-2">Try adjusting your search criteria</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Appointment Booking Panel */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <Card className="bg-white flex-1 flex flex-col min-h-0">
            <CardHeader className="flex-shrink-0 py-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <Calendar className="h-5 w-5 text-green-600" />
                <span>Book Instant Appointment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {selectedPatient ? (
                  <div className="space-y-3">
                    {/* Selected Patient Info */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        {selectedPatient.firstName} {selectedPatient.middleName ? selectedPatient.middleName + ' ' : ''}{selectedPatient.lastName}
                      </h4>
                      <div className="space-y-1 text-sm text-blue-700">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Patient #: {selectedPatient.patientNumber}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{selectedPatient.phone}</span>
                        </div>
                        {selectedPatient.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{selectedPatient.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Active Appointment Blocker - Distinguish between Checked-In vs Scheduled */}
                    {(selectedPatient.hasActiveAppointment || activeAppointmentPatientIds.has(selectedPatient.id)) && (
                      <>
                        {/* Check if patient is checked in (in progress) or just scheduled */}
                        {selectedPatient.activeAppointment?.status === 'CHECKED_IN' ? (
                          // Patient is checked in - show red blocker
                          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg space-y-2">
                            <div className="flex items-center gap-2 text-red-900 font-semibold">
                              <XCircle className="h-5 w-5" />
                              <span>{(() => {
                                const checkedInAt =
                                  selectedPatient.activeAppointment?.patientVisit?.checkedInAt ||
                                  selectedPatient.activeAppointment?.checkedInAt;
                                const fallbackTime = selectedPatient.activeAppointment?.time;
                                if (checkedInAt) return `Active Appointment In Progress – Checked In at ${formatCheckedInTime(checkedInAt)}`;
                                if (fallbackTime) return `Active Appointment In Progress – ${fallbackTime}`;
                                return 'Active Appointment In Progress';
                              })()}</span>
                            </div>
                            {selectedPatient.activeAppointment && (
                              <div className="p-3 bg-white border border-red-200 rounded text-sm space-y-1">
                                <div className="grid grid-cols-2 gap-2">
                                  <p><span className="font-medium text-gray-700">Token:</span> <span className="font-mono">{selectedPatient.activeAppointment.tokenNumber}</span></p>
                                  <p><span className="font-medium text-gray-700">Status:</span> <span className="text-red-600">{selectedPatient.activeAppointment.status}</span></p>
                                  <p><span className="font-medium text-gray-700">Date:</span> {new Date(selectedPatient.activeAppointment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                  <p><span className="font-medium text-gray-700">Time:</span> {selectedPatient.activeAppointment.time}</p>
                                </div>
                              </div>
                            )}
                            <p className="text-sm text-red-700">
                              This patient is currently checked in and undergoing treatment. New booking is not allowed until the current appointment is completed, discontinued, or cancelled.
                            </p>
                            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                              <Activity className="h-4 w-4" />
                              <span className="font-medium">Patient actively in progress</span>
                            </div>
                          </div>
                        ) : (
                          // Patient has scheduled appointment but not checked in - show blue information
                          <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg space-y-2">
                            <div className="flex items-center gap-2 text-blue-900 font-semibold">
                              <Calendar className="h-5 w-5" />
                              <span>Appointment Scheduled{selectedPatient.activeAppointment?.time && ` – ${selectedPatient.activeAppointment.time}`}</span>
                            </div>
                            {selectedPatient.activeAppointment && (
                              <div className="p-3 bg-white border border-blue-200 rounded text-sm space-y-1">
                                <div className="grid grid-cols-2 gap-2">
                                  <p><span className="font-medium text-gray-700">Token:</span> <span className="font-mono">{selectedPatient.activeAppointment.tokenNumber}</span></p>
                                  <p><span className="font-medium text-gray-700">Status:</span> <span className="text-blue-600">{selectedPatient.activeAppointment.status}</span></p>
                                  <p><span className="font-medium text-gray-700">Date:</span> {new Date(selectedPatient.activeAppointment.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                  <p><span className="font-medium text-gray-700">Time:</span> {selectedPatient.activeAppointment.time}</p>
                                </div>
                              </div>
                            )}
                            <p className="text-sm text-blue-700">
                              This patient has a scheduled appointment but has not checked in yet. New booking is not allowed until the scheduled appointment is completed or cancelled.
                            </p>
                            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                              <Calendar className="h-4 w-4" />
                              <span className="font-medium">Appointment scheduled - Patient not yet arrived</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Action Mode Selection - Only show if patient has partially completed appointment */}
                    {partiallyCompletedAppointments[selectedPatient.id] && (
                      <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 text-orange-900 font-semibold">
                          <AlertCircle className="h-5 w-5" />
                          <span>Incomplete Previous Visit Detected</span>
                        </div>
                        <p className="text-sm text-orange-700">
                          This patient has an incomplete appointment from{' '}
                          {new Date(partiallyCompletedAppointments[selectedPatient.id].appointmentDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                          . Choose an action:
                        </p>
                        <RadioGroup value={actionMode} onValueChange={setActionMode} className="space-y-2">
                          <div className="flex items-center space-x-2 p-3 border-2 border-blue-300 bg-blue-50 rounded-lg">
                            <RadioGroupItem value="new" id="new" />
                            <Label htmlFor="new" className="flex-1 cursor-pointer font-medium text-blue-900">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Book New Appointment</span>
                              </div>
                              <p className="text-xs text-blue-600 mt-1 ml-6">
                                Start a fresh appointment workflow
                              </p>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 border-2 border-orange-300 bg-orange-50 rounded-lg">
                            <RadioGroupItem value="resume" id="resume" />
                            <Label htmlFor="resume" className="flex-1 cursor-pointer font-medium text-orange-900">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>Resume Previous Appointment</span>
                              </div>
                              <p className="text-xs text-orange-600 mt-1 ml-6">
                                Continue from where patient left off
                              </p>
                            </Label>
                          </div>
                        </RadioGroup>

                        {actionMode === 'resume' && (
                          <Button
                            onClick={handleResumeClick}
                            className="w-full bg-orange-600 hover:bg-orange-700 mt-2"
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Resume Consultation
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Current Time */}
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 text-green-800">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Appointment Time: {getCurrentTime()}</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Instant appointment will be scheduled for current time
                      </p>
                    </div>

                    {/* Booking Form - Only show when actionMode is 'new' or no partially completed appointment */}
                    {/* Also block if patient has active appointment */}
                    {!(selectedPatient.hasActiveAppointment || activeAppointmentPatientIds.has(selectedPatient.id)) &&
                      (!partiallyCompletedAppointments[selectedPatient.id] || actionMode === 'new') && (
                        <>
                          {/* Booking mode */}
                          <div className="space-y-2">
                            <Label>Booking Mode</Label>
                            <Select value={bookingMode} onValueChange={setBookingMode}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="instant">Instant (Now)</SelectItem>
                                <SelectItem value="scheduled">Schedule for Later</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {bookingMode === 'scheduled' && (
                            <div className="space-y-4">
                              {/* Date Selection */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Select Date *</Label>
                                <Input
                                  type="date"
                                  value={scheduledDate}
                                  onChange={(e) => {
                                    const selectedDate = new Date(e.target.value);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    if (selectedDate < today) {
                                      toast.error('Cannot book appointments for past dates');
                                      return;
                                    }
                                    setScheduledDate(e.target.value);
                                    setScheduledTime(''); // Reset time when date changes
                                  }}
                                  min={new Date().toISOString().split('T')[0]}
                                  required
                                />
                              </div>

                              {/* Slot Selection Grid */}
                              {scheduledDate && (
                                <div className="space-y-3">
                                  <Label className="text-sm font-medium">Select Time Slot *</Label>

                                  {loadingSlots ? (
                                    <div className="flex items-center justify-center py-8">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                    </div>
                                  ) : (
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                      {/* Morning Slots */}
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                          <Clock className="h-4 w-4" />
                                          Morning (8:00 AM - 12:00 PM)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                          {generateTimeOptions()
                                            .filter(slot => {
                                              const hour = parseInt(slot.value.split(':')[0]);
                                              return hour >= 8 && hour < 12;
                                            })
                                            .map((slot) => {
                                              const bookings = slotBookings[slot.value] || [];
                                              const bookingCount = bookings.length;
                                              const trafficLevel = bookingCount >= 6 ? 'high' : bookingCount >= 3 ? 'medium' : 'low';

                                              return (
                                                <Button
                                                  key={slot.value}
                                                  type="button"
                                                  variant={scheduledTime === slot.value ? "default" : "outline"}
                                                  className={`h-auto py-3 px-4 justify-start ${scheduledTime === slot.value
                                                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                                    : 'hover:border-green-500'
                                                    } ${slot.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                  onClick={() => !slot.disabled && setScheduledTime(slot.value)}
                                                  disabled={slot.disabled}
                                                >
                                                  <div className="flex flex-col items-start w-full">
                                                    <div className="flex items-center justify-between w-full mb-1">
                                                      <span className="font-semibold">{slot.label}</span>
                                                      <div className={`w-2 h-2 rounded-full ${trafficLevel === 'high' ? 'bg-red-500' :
                                                        trafficLevel === 'medium' ? 'bg-yellow-500' :
                                                          'bg-green-500'
                                                        }`} />
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs opacity-80">
                                                      <Users className="h-3 w-3" />
                                                      <span>{bookingCount} booked</span>
                                                    </div>
                                                    <span className="text-xs opacity-70 mt-1">45 min duration</span>
                                                  </div>
                                                </Button>
                                              );
                                            })}
                                        </div>
                                      </div>

                                      {/* Afternoon Slots */}
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                          <Clock className="h-4 w-4" />
                                          Afternoon (12:00 PM - 5:00 PM)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                          {generateTimeOptions()
                                            .filter(slot => {
                                              const hour = parseInt(slot.value.split(':')[0]);
                                              return hour >= 12 && hour < 17;
                                            })
                                            .map((slot) => {
                                              const bookings = slotBookings[slot.value] || [];
                                              const bookingCount = bookings.length;
                                              const trafficLevel = bookingCount >= 6 ? 'high' : bookingCount >= 3 ? 'medium' : 'low';

                                              return (
                                                <Button
                                                  key={slot.value}
                                                  type="button"
                                                  variant={scheduledTime === slot.value ? "default" : "outline"}
                                                  className={`h-auto py-3 px-4 justify-start ${scheduledTime === slot.value
                                                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                                    : 'hover:border-green-500'
                                                    } ${slot.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                  onClick={() => !slot.disabled && setScheduledTime(slot.value)}
                                                  disabled={slot.disabled}
                                                >
                                                  <div className="flex flex-col items-start w-full">
                                                    <div className="flex items-center justify-between w-full mb-1">
                                                      <span className="font-semibold">{slot.label}</span>
                                                      <div className={`w-2 h-2 rounded-full ${trafficLevel === 'high' ? 'bg-red-500' :
                                                        trafficLevel === 'medium' ? 'bg-yellow-500' :
                                                          'bg-green-500'
                                                        }`} />
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs opacity-80">
                                                      <Users className="h-3 w-3" />
                                                      <span>{bookingCount} booked</span>
                                                    </div>
                                                    <span className="text-xs opacity-70 mt-1">45 min duration</span>
                                                  </div>
                                                </Button>
                                              );
                                            })}
                                        </div>
                                      </div>

                                      {/* Evening Slots */}
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                          <Clock className="h-4 w-4" />
                                          Evening (5:00 PM onwards)
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                          {generateTimeOptions()
                                            .filter(slot => {
                                              const hour = parseInt(slot.value.split(':')[0]);
                                              return hour >= 17;
                                            })
                                            .map((slot) => {
                                              const bookings = slotBookings[slot.value] || [];
                                              const bookingCount = bookings.length;
                                              const trafficLevel = bookingCount >= 6 ? 'high' : bookingCount >= 3 ? 'medium' : 'low';

                                              return (
                                                <Button
                                                  key={slot.value}
                                                  type="button"
                                                  variant={scheduledTime === slot.value ? "default" : "outline"}
                                                  className={`h-auto py-3 px-4 justify-start ${scheduledTime === slot.value
                                                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                                    : 'hover:border-green-500'
                                                    } ${slot.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                  onClick={() => !slot.disabled && setScheduledTime(slot.value)}
                                                  disabled={slot.disabled}
                                                >
                                                  <div className="flex flex-col items-start w-full">
                                                    <div className="flex items-center justify-between w-full mb-1">
                                                      <span className="font-semibold">{slot.label}</span>
                                                      <div className={`w-2 h-2 rounded-full ${trafficLevel === 'high' ? 'bg-red-500' :
                                                        trafficLevel === 'medium' ? 'bg-yellow-500' :
                                                          'bg-green-500'
                                                        }`} />
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs opacity-80">
                                                      <Users className="h-3 w-3" />
                                                      <span>{bookingCount} booked</span>
                                                    </div>
                                                    <span className="text-xs opacity-70 mt-1">45 min duration</span>
                                                  </div>
                                                </Button>
                                              );
                                            })}
                                        </div>
                                      </div>

                                      {/* Traffic Legend */}
                                      <div className="flex items-center justify-center gap-4 pt-2 pb-1 text-xs text-gray-600 border-t">
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-2 h-2 rounded-full bg-green-500" />
                                          <span>Low (0-2)</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                          <span>Medium (3-5)</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-2 h-2 rounded-full bg-red-500" />
                                          <span>High (6+)</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Appointment Type */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Appointment Type *</Label>
                            <Select value={appointmentType} onValueChange={setAppointmentType}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select appointment type" />
                              </SelectTrigger>
                              <SelectContent>
                                {appointmentTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center space-x-2" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                                      <span className={`px-2 py-1 rounded-full  text-xs ${type.color}`}>
                                        {type.label}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Purpose */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Purpose (Optional)</Label>
                            <Input
                              type="text"
                              placeholder="Brief description of the visit purpose"
                              value={purpose}
                              onChange={(e) => setPurpose(e.target.value)}
                            />
                          </div>

                          {/* Notes */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Additional Notes (Optional)</Label>
                            <Textarea
                              placeholder="Any additional notes for the appointment"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={3}
                            />
                          </div>

                          {/* Book Button */}
                          <Button
                            onClick={handleBookAppointment}
                            disabled={!appointmentType || isBooking}
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="lg"
                          >
                            {isBooking ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Booking Appointment...
                              </>
                            ) : bookingMode === 'scheduled' ? (
                              <>
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Appointment
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Book Instant Appointment
                              </>
                            )}
                          </Button>
                        </>
                      )}

                    {/* Message when resume mode is selected */}
                    {partiallyCompletedAppointments[selectedPatient.id] && actionMode === 'resume' && (
                      <div className="p-4 bg-orange-100 border-2 border-orange-400 rounded-lg text-center">
                        <Clock className="h-12 w-12 mx-auto mb-3 text-orange-600" />
                        <p className="font-semibold text-orange-900 mb-2">Resume Mode Active</p>
                        <p className="text-sm text-orange-700">
                          New appointment booking is disabled. Click "Resume Consultation" above to continue the previous appointment.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <UserPlus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Select a Patient</h3>
                    <p>Choose a patient from the list to book an appointment</p>

                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 text-blue-800 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-semibold">Instant Appointment</span>
                      </div>
                      <p className="text-xs text-blue-600">
                        Book appointments for the current time without scheduling
                      </p>
                    </div>

                    <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 text-blue-800 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-semibold">Schedule for Later</span>
                      </div>
                      <p className="text-xs text-blue-600">
                        Schedule appointments for a specific date and time slot
                      </p>
                    </div>

                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Appointment Booked Successfully!
            </DialogTitle>
          </DialogHeader>

          {bookedAppointment && (
            <div className="space-y-4 py-4">
              {/* Patient Info */}
              <div className="rounded-lg bg-blue-50 p-4">
                <h3 className="font-medium text-blue-900 mb-2">Patient Details</h3>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Name:</span> {bookedAppointment.patientName}
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Patient ID:</span> #{bookedAppointment.patientNumber}
                </p>
              </div>

              {/* Token Number - Highlighted */}
              <div className="rounded-lg bg-blue-100 border-2 border-blue-200 p-4 text-center">
                <h3 className="font-medium text-blue-900 mb-2">Token Number</h3>
                <div className="text-3xl font-bold text-blue-600">
                  {bookedAppointment.tokenNumber}
                </div>
              </div>

              {/* Appointment Details */}
              <div className="rounded-lg bg-blue-50 p-4">
                <h3 className="font-medium text-blue-900 mb-2">Appointment Details</h3>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Type:</span> {bookedAppointment.appointmentType}
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Date:</span> {new Date(bookedAppointment.appointmentDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Time:</span> {bookedAppointment.appointmentTime}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isCheckingIn ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Checking In...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Check In
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCloseSuccessDialog}
                  variant="outline"
                  disabled={isCheckingIn}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Patient Detail Modal with Appointment History */}
      <Dialog open={showPatientDetailModal} onOpenChange={setShowPatientDetailModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center space-x-2 text-xl">
              <User className="h-5 w-5 text-blue-600" />
              <span>{selectedPatientForDetails?.fullName || `${selectedPatientForDetails?.firstName} ${selectedPatientForDetails?.middleName || ''} ${selectedPatientForDetails?.lastName}`.trim()}</span>
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 mt-1">
              Patient #{selectedPatientForDetails?.patientNumber} • MRN {selectedPatientForDetails?.mrn}
            </DialogDescription>
          </DialogHeader>

          {loadingPatientDetails ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : selectedPatientForDetails ? (
            <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-4 mx-6 mt-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="appointment">
                  History ({patientAppointments.past?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="inProgress">
                  In Progress ({patientAppointments.inProgress?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="future">
                  Upcoming ({patientAppointments.future?.length || 0})
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-6">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-4 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="text-base font-semibold text-blue-900 mb-4 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Gender</p>
                        <p className="font-medium capitalize">{selectedPatientForDetails.gender || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date of Birth</p>
                        <p className="font-medium">
                          {selectedPatientForDetails.dateOfBirth
                            ? new Date(selectedPatientForDetails.dateOfBirth).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                            : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone Number</p>
                        <p className="font-medium flex items-center">
                          <Phone className="h-3 w-3 mr-1 text-gray-400" />
                          {selectedPatientForDetails.phone || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium flex items-center">
                          <Mail className="h-3 w-3 mr-1 text-gray-400" />
                          {selectedPatientForDetails.email || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Blood Group</p>
                        <p className="font-medium">{selectedPatientForDetails.bloodGroup || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <Badge className={selectedPatientForDetails.patientStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {selectedPatientForDetails.patientStatus || 'active'}
                        </Badge>
                      </div>
                    </div>
                    {selectedPatientForDetails.address && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="font-medium flex items-start">
                          <MapPin className="h-3 w-3 mr-1 mt-1 text-gray-400 flex-shrink-0" />
                          <span>{selectedPatientForDetails.address}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6">
                    <h3 className="text-base font-semibold text-purple-900 mb-4 flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Appointment Summary
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{patientAppointments.all?.length || 0}</p>
                        <p className="text-sm text-gray-600 mt-1">Total Appointments</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {patientAppointments.past?.filter(apt =>
                            apt.status?.toUpperCase() === 'COMPLETED' ||
                            apt.status?.toUpperCase() === 'PARTIALLY_COMPLETED'
                          ).length || 0}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Completed</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-orange-600">{patientAppointments.future?.length || 0}</p>
                        <p className="text-sm text-gray-600 mt-1">Upcoming</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Appointment History Tab */}
                <TabsContent value="appointment" className="mt-4">
                  {patientAppointments.past && patientAppointments.past.length > 0 ? (
                    <div className="space-y-3">
                      {patientAppointments.past.map((appointment) => {
                        const isDiscontinued = appointment.status?.toUpperCase() === 'DISCONTINUED';

                        return (
                          <div
                            key={appointment.id}
                            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${isDiscontinued
                              ? 'bg-red-50 border-red-300'
                              : 'bg-white border-gray-200'
                              }`}
                          >
                            {isDiscontinued && (
                              <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-md">
                                <p className="text-xs font-semibold text-red-800 flex items-center gap-1">
                                  <XCircle className="h-3 w-3" />
                                  This appointment was discontinued - Patient left without completing examination
                                </p>
                              </div>
                            )}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-blue-100 text-blue-800">
                                    {appointment.appointmentType}
                                  </Badge>
                                  <Badge className="bg-gray-100 text-gray-800">
                                    Token: {appointment.tokenNumber}
                                  </Badge>
                                  {appointment.status && (
                                    <Badge className={
                                      appointment.status.toUpperCase() === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                        appointment.status.toUpperCase() === 'DISCONTINUED' ? 'bg-red-100 text-red-800 border border-red-300' :
                                          appointment.status.toUpperCase() === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                            appointment.status.toUpperCase() === 'NO_SHOW' ? 'bg-gray-100 text-gray-800' :
                                              'bg-yellow-100 text-yellow-800'
                                    }>
                                      {appointment.status.toUpperCase()}
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center text-gray-600">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  <div className="flex items-center text-gray-600">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {appointment.appointmentTime}
                                  </div>
                                </div>
                                {appointment.doctor && (
                                  <div className="mt-2 flex items-center text-sm text-gray-600">
                                    <Stethoscope className="h-3 w-3 mr-1" />
                                    Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                                  </div>
                                )}
                                {appointment.purpose && (
                                  <div className="mt-2 text-sm text-gray-700">
                                    <span className="font-medium">Purpose:</span> {appointment.purpose}
                                  </div>
                                )}
                                {appointment.status?.toUpperCase() === 'CANCELLED' && (
                                  <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                    <p className="text-xs font-medium text-red-800 flex items-center gap-1">
                                      <XCircle className="h-3 w-3 flex-shrink-0" />
                                      Appointment Cancelled
                                    </p>
                                    {appointment.cancelReason ? (
                                      <p className="text-xs text-red-700 mt-1">
                                        <span className="font-medium">Reason:</span> {appointment.cancelReason}
                                      </p>
                                    ) : (
                                      <p className="text-xs text-red-600 mt-1 italic">No reason provided</p>
                                    )}
                                  </div>
                                )}
                                {appointment.patientVisit && (
                                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                    <p className="text-xs font-medium text-green-800">Visit Completed</p>
                                    {appointment.patientVisit.diagnoses && appointment.patientVisit.diagnoses.length > 0 && (
                                      <p className="text-xs text-green-700 mt-1">
                                        <span className="font-medium">Diagnosis:</span> {appointment.patientVisit.diagnoses.map(d => {
                                          // Extract disease name safely - handle both string and object formats
                                          const diseaseName = typeof d.disease?.diseaseName === 'string'
                                            ? d.disease.diseaseName
                                            : d.disease?.diseaseName?.['@value'] || d.diagnosisType || d.notes || 'N/A';
                                          return diseaseName;
                                        }).join(', ')}
                                      </p>
                                    )}
                                    {appointment.patientVisit.visitOutcome && (
                                      <p className="text-xs text-green-700 mt-1">
                                        <span className="font-medium">Outcome:</span> {appointment.patientVisit.visitOutcome}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No past appointments found</p>
                    </div>
                  )}
                </TabsContent>

                {/* Appointment in Progress Tab */}
                <TabsContent value="inProgress" className="mt-4">
                  {patientAppointments.inProgress && patientAppointments.inProgress.length > 0 ? (
                    <div className="space-y-3">
                      {patientAppointments.inProgress.map((appointment) => (
                        <div key={appointment.id} className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 hover:shadow-lg transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-green-100 text-green-800 border border-green-300">
                                  <Activity className="h-3 w-3 mr-1 inline" />
                                  {appointment.appointmentType}
                                </Badge>
                                <Badge className="bg-emerald-100 text-emerald-800 font-semibold">
                                  Token: {appointment.tokenNumber}
                                </Badge>
                                {appointment.status && (
                                  <Badge className="bg-green-600 text-white">
                                    {appointment.status}
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center text-gray-700 font-medium">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                                <div className="flex items-center text-gray-700 font-medium">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {appointment.appointmentTime}
                                </div>
                              </div>
                              {appointment.doctor && (
                                <div className="mt-2 flex items-center text-sm text-gray-600">
                                  <Stethoscope className="h-3 w-3 mr-1" />
                                  Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                                </div>
                              )}
                              {appointment.purpose && (
                                <div className="mt-2 text-sm text-gray-700">
                                  <span className="font-medium">Purpose:</span> {appointment.purpose}
                                </div>
                              )}
                              <div className="mt-3 p-2 bg-green-100 rounded border border-green-200">
                                <p className="text-xs text-green-800 font-medium flex items-center">
                                  <Activity className="h-3 w-3 mr-1" />
                                  {appointment.patientVisit?.checkedInAt
                                    ? `In Progress – Checked In at ${formatCheckedInTime(appointment.patientVisit.checkedInAt)}`
                                    : 'Patient is currently checked in and undergoing treatment'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">No appointments in progress</p>
                      <p className="text-sm mt-2">Checked-in appointments will appear here</p>
                    </div>
                  )}
                </TabsContent>

                {/* Future Appointments Tab */}
                <TabsContent value="future" className="mt-4">
                  {patientAppointments.future && patientAppointments.future.length > 0 ? (
                    <div className="space-y-3">
                      {patientAppointments.future.map((appointment) => (
                        <div key={appointment.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-blue-100 text-blue-800">
                                  {appointment.appointmentType}
                                </Badge>
                                <Badge className="bg-indigo-100 text-indigo-800">
                                  Token: {appointment.tokenNumber}
                                </Badge>
                                {appointment.status && (
                                  <Badge className="bg-blue-600 text-white">
                                    {appointment.status}
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center text-gray-700 font-medium">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                                <div className="flex items-center text-gray-700 font-medium">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {appointment.appointmentTime}
                                </div>
                              </div>
                              {appointment.doctor && (
                                <div className="mt-2 flex items-center text-sm text-gray-600">
                                  <Stethoscope className="h-3 w-3 mr-1" />
                                  Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                                </div>
                              )}
                              {appointment.purpose && (
                                <div className="mt-2 text-sm text-gray-700">
                                  <span className="font-medium">Purpose:</span> {appointment.purpose}
                                </div>
                              )}
                              <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-200">
                                <p className="text-xs text-blue-800 font-medium flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Scheduled appointment - Patient not yet checked in
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">No upcoming appointments</p>
                      <p className="text-sm mt-2">Scheduled appointments will appear here</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Continuation Visit Modal */}
      <Dialog open={isResumeModalOpen} onOpenChange={setIsResumeModalOpen}>
        <DialogContent className="max-w-2xl" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle>Resume Patient — Continuation Visit</DialogTitle>
          </DialogHeader>

          {/* ⚠️ Disclaimer */}
          <Alert className="border-2 border-red-500 bg-red-50 text-red-900 shadow-md">
            <AlertOctagon className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-base font-bold uppercase tracking-wide">
              Critical Check Required
            </AlertTitle>
            <AlertDescription className="mt-1 text-sm leading-relaxed">
              This action must be performed <strong>ONLY IF</strong> the patient has
              <strong className="underline"> fully completed the optometry examination</strong> in their previous visit.
              <br />
              <span className="mt-1 block font-semibold text-red-800">
                A new appointment and visit record will be created, linked to the original visit.
                The patient will be placed directly in the ophthalmologist queue.
              </span>
            </AlertDescription>
          </Alert>

          {selectedResumeAppointment && (
            <div className="space-y-6">
              {/* Current Appointment Details */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">Patient Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Patient:</p>
                    <p className="font-medium">
                      {selectedPatient?.firstName} {selectedPatient?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Patient Number:</p>
                    <p className="font-medium">#{selectedPatient?.patientNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone:</p>
                    <p className="font-medium">{selectedPatient?.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Original Date:</p>
                    <p className="font-medium">
                      {new Date(selectedResumeAppointment.appointmentDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {/* <div className="mt-3 pt-3 border-t border-orange-200">
                  <p className="text-xs text-orange-700">
                    ⚠️ This patient completed optometry consultation but did not reach the ophthalmologist.
                  </p>
                </div> */}
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
                    className={`pr-10 ${tokenNumber.trim() && tokenNumber.trim() === selectedResumeAppointment.tokenNumber
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
    </div>
  );
};

export default QuickAppointmentBooking;