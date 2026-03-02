// src/pages/AppointmentBooking.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import useAppointmentStore from '@/stores/appointment';
import useQRAppointmentStore from '@/stores/qrAppointment';
import QRCodeDisplay from '@/components/appointments/QRCodeDisplay';
import TokenBadge from '@/components/appointments/TokenBadge';
import { generatePatientQRCode } from '@/lib/qrCodeGenerator';
import { patientService, usePatientMutations } from '@/services/patientService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { generateAppointmentPDF } from '@/utils/pdfGenerator';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Languages, 
  Eye, 
  Heart, 
  Brain, 
  Bone,
  Stethoscope,
  Activity,
  User,
  Video,
  Home,
  Building,
  LayoutDashboard,
  CheckCircle,
  Calendar as CalendarIcon,
  Users,
  Timer,
  Info,
  Download,
  Printer,
  Menu,
  LogOut,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const AppointmentBooking = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState('in-person');
  const [slotBookings, setSlotBookings] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [patientInfo, setPatientInfo] = useState({
    name: 'John Doe',
    age: 35,
    phone: '+1-234-567-8900',
    email: 'john.doe@example.com'
  });
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  
  const { toast } = useToast();
  const { createAppointment, resetBooking } = useAppointmentStore();
  const qrStore = useQRAppointmentStore();
  const { setCurrentAppointment, currentAppointment, appointmentDetails } = qrStore;
  const storePatientInfo = qrStore.patientInfo;
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  // TanStack Query for doctors list
  const {
    data: doctorsData,
    isLoading: isLoadingDoctors,
    error: doctorsError,
    refetch: refetchDoctors
  } = useQuery({
    queryKey: ['doctors', selectedDepartment],
    queryFn: () => patientService.getDoctorsList({ department: selectedDepartment }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // TanStack Query mutation for booking appointment
  const bookAppointmentMutation = useMutation({
    mutationFn: patientService.bookAppointment,
    onSuccess: async (data) => {
      
      try {
        // Set appointment data for QR code with server-generated token
        const appointmentData = {
          ...data.data.appointment,
          doctorName: selectedDoctor?.name,
          doctorSpecialization: selectedDoctor?.specialization,
          department: selectedDoctor?.department,
          date: selectedDate.toISOString(),
          time: selectedSlot?.label,
          location: selectedDoctor?.locations?.[0] || 'Main Clinic',
          fee: selectedDoctor?.consultationFee,
          type: consultationType,
          trafficLevel: (slotBookings[selectedSlot?.value] || 0) >= 6 ? 'high' : (slotBookings[selectedSlot?.value] || 0) >= 3 ? 'medium' : 'low',
          waitTime: null,
          token: data.data.appointment.tokenNumber, // Use server-generated token
          patientName: `${user.firstName} ${user.lastName}`,
          patientPhone: user.phone,
          uid: data.data.appointment.id
        };


        // Generate QR code with complete appointment data including server token
        const qrCodeURL = await generatePatientQRCode(patientInfo.phone, appointmentData);
        setQrCodeDataURL(qrCodeURL);

        // Save QR code to backend (with slight delay to ensure appointment is fully created)
        try {
          
          // Small delay to ensure appointment is fully created
          await new Promise(resolve => setTimeout(resolve, 500));
          
          await patientService.updateAppointmentQR(data.data.appointment.id, qrCodeURL);
        } catch (qrSaveError) {
          
          // Show error toast for debugging
          toast({
            title: 'QR Code Save Failed',
            description: `Error: ${qrSaveError.message}`,
            variant: 'destructive'
          });
        }

        // Save to stores
        const appointment = createAppointment(patientInfo, appointmentData);
        setCurrentAppointment(appointmentData, patientInfo, qrCodeURL);

        // Show success toast
        toast({
          title: 'Appointment Booked Successfully!',
          description: `Your appointment is confirmed for ${selectedDate.toLocaleDateString()} at ${selectedSlot?.label}. Token: ${data.data.appointment.tokenNumber}`,
        });

        // Show success dialog
        setShowBookingDialog(true);

      } catch (qrError) {
        toast({
          title: 'QR Code Generation Failed',
          description: 'Appointment booked successfully, but QR code could not be generated.',
          variant: 'destructive'
        });
        
        // Still show booking dialog even if QR fails
        setShowBookingDialog(true);
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries(['appointments']);
    },
    onError: (error) => {
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to book appointment. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const doctors = doctorsData?.data || [];

  // Auto-fill patient information from auth context
  useEffect(() => {
    if (user && user.role === 'patient') {
      const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return '';
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          return age - 1;
        }
        return age;
      };

      setPatientInfo({
        name: `${user.firstName} ${user.lastName}`,
        age: calculateAge(user.dateOfBirth),
        phone: user.phone || '',
        email: user.email || ''
      });

    }
  }, [user]);

  const departments = [
    { id: 'ophthalmology', name: 'Ophthalmology', icon: Eye, color: 'bg-blue-500', available: true },
    { id: 'cardiology', name: 'Cardiology', icon: Heart, color: 'bg-red-500', available: false },
    { id: 'neurology', name: 'Neurology', icon: Brain, color: 'bg-purple-500', available: false },
    { id: 'orthopedics', name: 'Orthopedics', icon: Bone, color: 'bg-green-500', available: false },
    { id: 'general', name: 'General Medicine', icon: Stethoscope, color: 'bg-orange-500', available: false },
    { id: 'emergency', name: 'Emergency', icon: Activity, color: 'bg-red-600', available: false }
  ];

  // Generate time options for slots (8 AM to 6 PM, 30-min intervals)
  const generateTimeOptions = () => {
    const times = [];
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const selDate = selectedDate ? new Date(selectedDate) : null;
    const dateStr = selDate ? `${selDate.getFullYear()}-${String(selDate.getMonth() + 1).padStart(2, '0')}-${String(selDate.getDate()).padStart(2, '0')}` : '';
    const selectedDateIsToday = dateStr === todayStr;

    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute === 30) continue;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isPastTime = selectedDateIsToday && (hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes()));
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        times.push({ value: timeString, label: displayTime, disabled: isPastTime });
      }
    }
    return times;
  };

  // Fetch real appointment slot data when date changes
  const fetchAppointmentsByDate = async (dateStr) => {
    if (!dateStr) return;
    try {
      setLoadingSlots(true);
      const data = await patientService.getAppointmentSlotsByDate(dateStr);
      const bookingsMap = {};
      const timeSlots = data.data?.timeSlots || [];
      timeSlots.forEach(slot => {
        bookingsMap[slot.time] = slot.appointmentCount;
      });
      setSlotBookings(bookingsMap);
    } catch (error) {
      console.error('Error fetching appointment slots:', error);
      setSlotBookings({});
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch slots when date changes
  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      fetchAppointmentsByDate(dateStr);
      setSelectedSlot(null);
    }
  }, [selectedDate]);

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !selectedDepartment || selectedDepartment === 'all' || doctor.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleBookAppointment = async () => {
    // Enhanced validation
    const validationErrors = [];

    if (!selectedDoctor) {
      validationErrors.push('Please select a doctor');
    } else if (!selectedDoctor.id) {
      validationErrors.push('Selected doctor is invalid');
    }

    if (!selectedSlot) {
      validationErrors.push('Please select a time slot');
    } else if (!selectedSlot.label) {
      validationErrors.push('Selected time slot is invalid');
    }

    if (!patientInfo.name || patientInfo.name.trim().length < 2) {
      validationErrors.push('Please enter a valid name (at least 2 characters)');
    }

    if (!patientInfo.phone || patientInfo.phone.trim().length < 10) {
      validationErrors.push('Please enter a valid phone number (at least 10 digits)');
    }

    if (!selectedDate) {
      validationErrors.push('Please select an appointment date');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(0, 0, 0, 0);

      if (appointmentDate < today) {
        validationErrors.push('Appointment date cannot be in the past');
      }

      const maxFutureDate = new Date();
      maxFutureDate.setDate(maxFutureDate.getDate() + 90);
      if (appointmentDate > maxFutureDate) {
        validationErrors.push('Appointment date cannot be more than 90 days in the future');
      }
    }

    // Validate user authentication
    if (!user || user.role !== 'patient') {
      validationErrors.push('Please log in as a patient to book appointments');
    }

    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: validationErrors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    // Prepare appointment data for backend
    const appointmentData = {
      doctorId: selectedDoctor.id,
      appointmentDate: selectedDate.toISOString(),
      appointmentTime: selectedSlot.label,
      appointmentType: 'routine',
      purpose: 'General Consultation',
      notes: `Appointment booked by patient ${user.firstName} ${user.lastName}. Doctor: ${selectedDoctor.name}, Department: ${selectedDoctor.department}`,
      estimatedDuration: 30
    };



    try {
      // Use TanStack Query mutation to book appointment
      await bookAppointmentMutation.mutateAsync(appointmentData);
    } catch (error) {
      // Error handling is already done in the mutation onError callback
    }
  };

  const handleCloseBookingDialog = () => {
    setShowBookingDialog(false);
    setQrCodeDataURL(null);
    resetBooking();
    // Reset form
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setConsultationType('in-person');
  };

  const handleDownloadPDF = async () => {
    if (!currentAppointment || !appointmentDetails) return;
    
    setDownloadingPDF(true);
    try {
      const pdfData = {
        token: appointmentDetails.token || currentAppointment.token,
        patientName: storePatientInfo.name || patientInfo.name,
        patientPhone: storePatientInfo.phone || patientInfo.phone,
        doctorName: appointmentDetails.doctorName || selectedDoctor?.name,
        department: appointmentDetails.department || selectedDoctor?.department || selectedDoctor?.specialization,
        date: appointmentDetails.date || selectedDate,
        time: appointmentDetails.time || selectedSlot?.label
      };

      await generateAppointmentPDF(pdfData, qrCodeDataURL);
      
      toast({
        title: 'PDF Downloaded Successfully',
        description: 'Your appointment confirmation has been saved as PDF.',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Unable to generate PDF. Please try printing instead.',
        variant: 'destructive'
      });
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Render slot grid for a time period
  const renderSlotSection = (title, filterFn) => {
    const slots = generateTimeOptions().filter(filterFn);
    if (slots.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {title}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {slots.map((slot) => {
            const bookingCount = slotBookings[slot.value] || 0;
            const trafficLevel = bookingCount >= 6 ? 'high' : bookingCount >= 3 ? 'medium' : 'low';

            return (
              <button
                key={slot.value}
                onClick={() => !slot.disabled && setSelectedSlot(slot)}
                disabled={slot.disabled}
                className={`relative p-3 border-2 rounded-lg transition-all duration-200 hover:shadow-md ${
                  selectedSlot?.value === slot.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md scale-105'
                    : 'border-gray-200 hover:border-gray-300 bg-white dark:bg-gray-900'
                } ${slot.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex flex-col items-start w-full">
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-sm">{slot.label}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      trafficLevel === 'high' ? 'bg-red-500' :
                      trafficLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Users className="h-3 w-3" />
                    <span>{bookingCount} booked</span>
                  </div>
                </div>
                {selectedSlot?.value === slot.value && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-slate-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm sm:text-xl font-bold text-slate-800 dark:text-slate-200">Book Appointment</h1>
                <p className="hidden sm:block text-sm text-slate-600 dark:text-slate-400">Find and book with the best doctors</p>
              </div>
            </div>
            
            {/* Navigation Items */}
            <div className="flex items-center gap-2">
              {/* Desktop */}
              <div className="hidden md:flex items-center gap-2">
                <Link to="/patient-profile">
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline ml-1">Profile</span>
                  </Button>
                </Link>
                <Link to="/patient-dashboard">
                  <Button variant="outline" size="sm">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden lg:inline ml-1">Dashboard</span>
                  </Button>
                </Link>
              </div>
              {/* Mobile hamburger */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden px-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/patient-profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/patient-dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" />Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                    onClick={async () => { try { await logout(); window.location.href = '/patient-login'; } catch(e) {} }}
                  >
                    <LogOut className="w-4 h-4" />Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Search and Filters */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Search Doctors</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search by name or specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id} disabled={!dept.available}>
                        {dept.name} {!dept.available && '(Unavailable)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Departments */}
            <Card>
              <CardHeader>
                <CardTitle>Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {departments.map((dept) => (
                    <TooltipProvider key={dept.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => dept.available && setSelectedDepartment(dept.id)}
                            disabled={!dept.available}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              dept.available
                                ? `hover:shadow-md ${
                                    selectedDepartment === dept.id
                                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`
                                : 'border-gray-200 opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800'
                            }`}
                          >
                            <div className={`w-8 h-8 ${dept.available ? dept.color : 'bg-gray-400'} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                              <dept.icon className="h-4 w-4 text-white" />
                            </div>
                            <p className={`text-sm font-medium text-center ${dept.available ? '' : 'text-gray-500'}`}>
                              {dept.name}
                            </p>
                          </button>
                        </TooltipTrigger>
                        {!dept.available && (
                          <TooltipContent>
                            <p>This department is currently unavailable. Please check back later.</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Doctors List and Booking */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedDoctor ? (
              <>
                {/* Results Header */}
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Available Doctors ({filteredDoctors.length})
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select defaultValue="rating">
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">Highest Rating</SelectItem>
                        <SelectItem value="experience">Most Experienced</SelectItem>
                        <SelectItem value="fee-low">Lowest Fee</SelectItem>
                        <SelectItem value="availability">Earliest Available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Doctors List */}
                <div className="space-y-4">
                  {isLoadingDoctors ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading doctors...</p>
                      </div>
                    </div>
                  ) : doctorsError ? (
                    <div className="text-center py-12">
                      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Failed to Load Doctors</h3>
                        <p className="text-red-600 dark:text-red-400 mb-4">
                          {doctorsError.message || 'Unable to load doctors list. Please try again.'}
                        </p>
                        <Button 
                          onClick={() => refetchDoctors()}
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <div className="text-center py-12">
                      <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Doctors Found</h3>
                      <p className="text-gray-500">
                        {searchQuery || selectedDepartment 
                          ? 'Try adjusting your search or filter criteria'
                          : 'No doctors are currently available for appointments'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <Card key={doctor.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-3 sm:p-6">
                        <div className="flex space-x-3 sm:space-x-4">
                          {/* Doctor Photo - hidden on mobile */}
                          <div className="hidden sm:flex w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg items-center justify-center flex-shrink-0">
                            {doctor.photo ? (
                              <img src={doctor.photo} alt={doctor.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <User className="h-10 w-10 text-gray-400" />
                            )}
                          </div>

                          {/* Doctor Info */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div className="min-w-0 flex-1 mr-2">
                                <h3 className="font-semibold text-sm sm:text-lg truncate">{doctor.name}</h3>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{doctor.specialization}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">{doctor.experience} yrs exp</p>
                              </div>
                              
                              <div className="text-right flex-shrink-0">
                                <div className="flex items-center space-x-1 mb-1">
                                  <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium text-xs sm:text-sm">{doctor.rating}</span>
                                  <span className="hidden sm:inline text-gray-500 text-xs">({doctor.reviews})</span>
                                </div>
                                <Badge variant="secondary" className="text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900 text-[10px] sm:text-xs">
                                  {doctor.nextAvailable}
                                </Badge>
                              </div>
                            </div>

                            {/* Doctor Details */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                                <span className="text-xs sm:text-sm">₹{doctor.consultationFee}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <Languages className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                                <span className="text-xs sm:text-sm truncate">{doctor.languages.slice(0, 2).join(', ')}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                                <span className="text-xs sm:text-sm truncate">{doctor.locations[0]}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                                <span className="text-xs sm:text-sm">{doctor.availableSlots.length} slots</span>
                              </div>
                            </div>

                            {/* Consultation Types - Only In-Person */}
                            <div className="flex items-center space-x-2 mb-4">
                              <Badge variant="outline" className="flex items-center space-x-1">
                                <Building className="h-3 w-3" />
                                <span>In-Person</span>
                              </Badge>
                            </div>

                            {/* Action Button */}
                            <Button 
                              onClick={() => setSelectedDoctor(doctor)}
                              className="w-full"
                            >
                              Book Appointment
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ))
                  )}
                </div>
              </>
            ) : (
              /* Booking Interface */
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm sm:text-lg leading-tight">Book Appointment with {selectedDoctor.name}</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setSelectedDoctor(null)} className="shrink-0 text-xs sm:text-sm">
                      <span className="hidden sm:inline">Back to Doctors</span>
                      <span className="sm:hidden">Back</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Consultation Type Selection - Only In-Person */}
                  <div>
                    <h3 className="font-medium mb-3">Consultation Type</h3>
                    <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                      <div className="flex items-center space-x-2">
                        <Building className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-700 dark:text-blue-300">In-Person Consultation</span>
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        Visit the clinic for your appointment
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Time Slots Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Available Time Slots</h3>
                      <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="hidden sm:inline">Low (0-2)</span>
                          <span className="sm:hidden">Low</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span className="hidden sm:inline">Medium (3-5)</span>
                          <span className="sm:hidden">Med</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="hidden sm:inline">High (6+)</span>
                          <span className="sm:hidden">High</span>
                        </div>
                      </div>
                    </div>

                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {renderSlotSection('Morning (8:00 AM - 12:00 PM)', (slot) => {
                          const hour = parseInt(slot.value.split(':')[0]);
                          return hour >= 8 && hour < 12;
                        })}
                        {renderSlotSection('Afternoon (12:00 PM - 5:00 PM)', (slot) => {
                          const hour = parseInt(slot.value.split(':')[0]);
                          return hour >= 12 && hour < 17;
                        })}
                        {renderSlotSection('Evening (5:00 PM onwards)', (slot) => {
                          const hour = parseInt(slot.value.split(':')[0]);
                          return hour >= 17;
                        })}
                      </div>
                    )}
                    
                    {selectedSlot && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Selected Time Slot
                        </h4>
                        <div className="text-sm">
                          <p><strong>Time:</strong> {selectedSlot.label}</p>
                          <p><strong>Booked:</strong> {slotBookings[selectedSlot.value] || 0} appointments</p>
                        </div>
                      </div>
                    )}
                  </div>


                  {/* Patient Information */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Patient Information</h3>
                      {user && user.role === 'patient' && (
                        <Badge variant="secondary" className="text-xs">
                          Auto-filled from profile
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Name *</label>
                        <Input 
                          value={patientInfo.name}
                          readOnly={user && user.role === 'patient'}
                          onChange={(e) => !user?.role === 'patient' && setPatientInfo({...patientInfo, name: e.target.value})}
                          placeholder="Enter patient name"
                          className={`text-xs sm:text-sm ${user && user.role === 'patient' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                          required
                        />
                        {user && user.role === 'patient' && (
                          <p className="text-[10px] sm:text-xs text-blue-600 mt-1">
                            {user.firstName} {user.lastName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Age</label>
                        <Input 
                          type="number"
                          value={patientInfo.age}
                          readOnly={user && user.role === 'patient'}
                          onChange={(e) => !user?.role === 'patient' && setPatientInfo({...patientInfo, age: parseInt(e.target.value)})}
                          placeholder="Enter age"
                          className={`text-xs sm:text-sm ${user && user.role === 'patient' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        />
                        {user && user.role === 'patient' && user.dateOfBirth && (
                          <p className="text-[10px] sm:text-xs text-blue-600 mt-1">
                            DOB: {new Date(user.dateOfBirth).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Phone *</label>
                        <Input 
                          value={patientInfo.phone}
                          readOnly={user && user.role === 'patient'}
                          onChange={(e) => !user?.role === 'patient' && setPatientInfo({...patientInfo, phone: e.target.value})}
                          placeholder="Enter phone number"
                          className={`text-xs sm:text-sm ${user && user.role === 'patient' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                          required
                        />
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          {user && user.role === 'patient' ? 'From profile' : 'Required for QR'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium">Email</label>
                        <Input 
                          type="email"
                          value={patientInfo.email}
                          readOnly={user && user.role === 'patient'}
                          onChange={(e) => !user?.role === 'patient' && setPatientInfo({...patientInfo, email: e.target.value})}
                          placeholder="Enter email"
                          className={`text-xs sm:text-sm ${user && user.role === 'patient' ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        />
                        {user && user.role === 'patient' && (
                          <p className="text-[10px] sm:text-xs text-blue-600 mt-1">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Appointment Summary */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-medium mb-3">Appointment Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Doctor:</span>
                        <span className="font-medium">{selectedDoctor.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium">{selectedDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="font-medium">{selectedSlot?.label || 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-medium">In-Person</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fee:</span>
                        <span className="font-medium">₹{selectedDoctor.consultationFee}</span>
                      </div>
                      {selectedSlot && (
                        <div className="flex justify-between">
                          <span>Booked in Slot:</span>
                          <span className="font-medium">{slotBookings[selectedSlot.value] || 0} appointments</span>
                        </div>
                      )}
                      {patientInfo.phone && (
                        <div className="flex justify-between">
                          <span>QR Code:</span>
                          <span className="font-medium text-green-600">Will be generated</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Book Button */}
                  <Button 
                    onClick={handleBookAppointment}
                    disabled={!selectedSlot || !patientInfo.name || !patientInfo.phone || bookAppointmentMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {bookAppointmentMutation.isPending ? 'Booking Appointment...' : 'Confirm Booking'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Booking Success Dialog - Professional Print-Ready */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent 
          id="appointment-confirmation"
          className="max-w-lg max-h-[90vh] overflow-y-auto print:max-w-full print:shadow-none"
        >
          <DialogHeader className="print:text-center">
            <DialogTitle className="flex items-center justify-center gap-2 text-xl text-blue-700 print:text-black">
              <CheckCircle className="h-6 w-6 text-blue-600" />
              Appointment Confirmed
            </DialogTitle>
          </DialogHeader>
          
          <div id="printable-appointment" className="space-y-6 print:space-y-4">
            {/* Hospital Header */}
            <div className="text-center border-b border-blue-200 pb-4 print:border-black">
              <h2 className="text-lg font-bold text-blue-800 print:text-black">OHMS - Eye Care Hospital</h2>
              <p className="text-sm text-blue-600 print:text-gray-600">Appointment Confirmation</p>
            </div>

            {/* Token Number - Highlighted */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 text-center print:bg-blue-100 print:text-black print:border print:border-blue-300">
              <h3 className="text-sm font-medium mb-2 print:text-black">Your Token Number</h3>
              <div className="text-4xl font-bold tracking-wider print:text-blue-800">
                {bookAppointmentMutation.isSuccess && bookAppointmentMutation.data?.data?.appointment?.tokenNumber || 'XXXX'}
              </div>
              <p className="text-sm opacity-90 mt-2 print:text-gray-600">Present this at reception</p>
            </div>

            {/* Appointment Details */}
            <div className="bg-blue-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300">
              <h3 className="font-semibold mb-3 text-blue-800 print:text-black">Appointment Details</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Patient:</span>
                  <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="font-medium">{user?.phone}</p>
                </div>
                <div>
                  <span className="text-gray-600">Doctor:</span>
                  <p className="font-medium">{selectedDoctor?.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Department:</span>
                  <p className="font-medium">{selectedDoctor?.department}</p>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>
                  <p className="font-medium">{selectedDate.toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
                <div>
                  <span className="text-gray-600">Time:</span>
                  <p className="font-medium">{selectedSlot?.label}</p>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            {qrCodeDataURL && (
              <div className="text-center">
                <h4 className="font-medium text-blue-800 mb-3 print:text-black">Quick Check-in QR Code</h4>
                <div className="inline-block p-4 bg-white border-2 border-blue-200 rounded-lg shadow-sm print:border-gray-400">
                  <img 
                    src={qrCodeDataURL} 
                    alt="Appointment QR Code"
                    className="w-24 h-24 mx-auto print:w-20 print:h-20"
                  />
                </div>
                <p className="text-xs text-blue-600 mt-2 print:text-gray-600">
                  Scan for instant check-in
                </p>
              </div>
            )}

            {/* Important Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 print:bg-gray-50 print:border-gray-400">
              <h4 className="font-semibold text-blue-800 mb-2 print:text-black">Important Instructions:</h4>
              <ul className="text-sm text-blue-700 space-y-1 print:text-black">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Arrive 15 minutes before your appointment time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Present your token number or scan QR code at reception</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Bring valid photo ID and insurance documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Contact us at +91-XXXX-XXXX for any changes</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons - Hidden in print */}
            <div className="flex gap-2 pt-4 print:hidden">
              <Button 
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloadingPDF ? 'Generating PDF...' : 'Download PDF'}
              </Button>
              <Button 
                onClick={() => window.print()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button 
                onClick={handleCloseBookingDialog}
                variant="outline" 
                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                size="lg"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentBooking;