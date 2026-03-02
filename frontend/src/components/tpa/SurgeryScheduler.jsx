import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  HeartHandshake,
  Activity,
  CalendarIcon,
  Search,
  Filter,
  CalendarDays,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  ArrowRight,
  UserCircle,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import surgerySchedulerService from '@/services/surgerySchedulerService';
import { otAdminService } from '@/services/otAdminService';
import { ClipLoader } from 'react-spinners';
import Loader from '@/components/loader/Loader';

/*
========================================
🏥 SURGERY SCHEDULER - TPA COMPONENT
========================================

Features:
- List patients with "SURGERY_SUGGESTED" status
- Display patient details, surgery type, and investigations
- Show surgery packages for cost estimation
- Staff assignment (surgeon, sister, anesthesiologist)
- Surgery date and time scheduling
- Status update to "SURGERY_SCHEDULED"
*/

const SurgeryScheduler = () => {
  const { toast } = useToast();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [surgeons, setSurgeons] = useState([]);
  const [sisters, setSisters] = useState([]);
  const [anesthesiologists, setAnesthesiologists] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [surgeryPackages, setSurgeryPackages] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [otRooms, setOtRooms] = useState([]);
  const [otRoomAvailability, setOtRoomAvailability] = useState({});
  const [todaysSurgeriesCount, setTodaysSurgeriesCount] = useState(0);

  // Lens selection states
  const [availableLenses, setAvailableLenses] = useState([]);
  const [lensSearchTerm, setLensSearchTerm] = useState('');
  const [isLensPopoverOpen, setIsLensPopoverOpen] = useState(false);
  const [selectedLens, setSelectedLens] = useState(null);

  // Surgery Package selection states
  const [recommendedPackages, setRecommendedPackages] = useState([]);
  const [otherPackages, setOtherPackages] = useState([]);
  const [packageSearchTerm, setPackageSearchTerm] = useState('');
  const [isPackagePopoverOpen, setIsPackagePopoverOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Scheduled surgeries tracking for selected date
  const [scheduledSurgeriesOnDate, setScheduledSurgeriesOnDate] = useState([]);
  const [selectedDateSurgeriesCount, setSelectedDateSurgeriesCount] = useState(0);
  const [loadingScheduledSurgeries, setLoadingScheduledSurgeries] = useState(false);

  // Surgery scheduling form data
  const [scheduleForm, setScheduleForm] = useState({
    surgeryDate: '',
    surgeryTimeSlot: '',
    tentativeTime: '',
    surgeryPackageId: '',
    surgeonId: '',
    sisterId: '',
    anesthesiologistId: '',
    otRoomId: '',
    notes: '',
    lensRequired: false,
    lensId: null
  });

  // Time slot states
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // ==========================================
  // SCHEDULED SURGERIES TRACKING
  // ==========================================

  const fetchScheduledSurgeriesForDate = async (surgeryDate) => {
    if (!surgeryDate) {
      setScheduledSurgeriesOnDate([]);
      setSelectedDateSurgeriesCount(0);
      return;
    }

    try {
      setLoadingScheduledSurgeries(true);

      // Format the date for API call
      const selectedDate = new Date(surgeryDate);
      const dateStr = selectedDate.toISOString().split('T')[0];


      // Get scheduled surgeries with filters
      const response = await surgerySchedulerService.getScheduledSurgeries({
        limit: 1000, // Get all surgeries for the date
        dateFilter: dateStr // This should be supported by your backend
      });

      if (response.success) {
        // Filter surgeries for the selected date and exclude completed/cancelled
        const surgeriesOnDate = (response.data || []).filter(surgery => {
          if (!surgery.surgeryDate) return false;
          
          const surgeryDateStr = new Date(surgery.surgeryDate).toISOString().split('T')[0];
          const isDateMatch = surgeryDateStr === dateStr;
          
          // Only count surgeries that are actually scheduled (not completed or cancelled)
          const activeStatuses = ['SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT', 'READY_FOR_SURGERY', 'SURGERY_DAY'];
          const isActive = activeStatuses.includes(surgery.status);
          
          return isDateMatch && isActive;
        });

        setScheduledSurgeriesOnDate(surgeriesOnDate);
        setSelectedDateSurgeriesCount(surgeriesOnDate.length);


        // Calculate OT room availability - wait for OT rooms to be loaded
        if (otRooms.length > 0) {
          const otAvailability = {};
          otRooms.forEach(room => {
            const roomSurgeries = surgeriesOnDate.filter(s => {
              // Check both otRoom (string) and otRoomId (relation)
              const matchesRoomNumber = s.otRoom === room.roomNumber;
              const matchesRoomId = s.otRoomId === room.id;
              return matchesRoomNumber || matchesRoomId;
            });
            otAvailability[room.id] = {
              count: roomSurgeries.length,
              surgeries: roomSurgeries
            };
          });
          setOtRoomAvailability(otAvailability);
        } else {
          setOtRoomAvailability({});
        }
      } else {
        setScheduledSurgeriesOnDate([]);
        setSelectedDateSurgeriesCount(0);
        setOtRoomAvailability({});
      }
    } catch (error) {
      setScheduledSurgeriesOnDate([]);
      setSelectedDateSurgeriesCount(0);
      setOtRoomAvailability({});
    } finally {
      setLoadingScheduledSurgeries(false);
    }
  };

  // ==========================================
  // DATA FETCHING
  // ==========================================

  useEffect(() => {
    fetchSuggestedPatients();
    fetchStaffData();
    fetchOTRooms();
    fetchTodaysSurgeriesCount();
  }, [currentPage, searchTerm]);

  // Recalculate OT room availability when OT rooms are loaded
  useEffect(() => {
    if (otRooms.length > 0 && scheduleForm.surgeryDate) {
      fetchScheduledSurgeriesForDate(scheduleForm.surgeryDate);
    }
  }, [otRooms.length]);

  const fetchSuggestedPatients = async () => {
    try {
      setLoading(true);
      const response = await surgerySchedulerService.getSurgerySuggestedPatients({
        page: currentPage,
        limit: 10,
        search: searchTerm
      });

      if (response.success) {
        setPatients(response.data || []);
        setTotalPages(Math.ceil((response.totalCount || 0) / 10));
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to fetch suggested patients",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch patients suggested for surgery",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffData = async () => {
    try {
      const response = await surgerySchedulerService.getAllSurgeryStaff();

      if (response.success) {
        
        setSurgeons(response.data.surgeons || []);
        setSisters(response.data.sisters || []);
        setAnesthesiologists(response.data.anesthesiologists || []);
      } else {
        throw new Error(response.message || 'Failed to fetch staff data');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Staff data could not be loaded. Please refresh to try again.",
        variant: "destructive"
      });
    }
  };

  const fetchOTRooms = async () => {
    try {
      const response = await otAdminService.getAllOTRooms();
      if (response.success) {
        setOtRooms(response.data || []);
      } else {
      }
    } catch (error) {
      toast({
        title: "Warning",
        description: "Could not load OT rooms. Please refresh the page.",
        variant: "destructive"
      });
    }
  };

  const fetchTodaysSurgeriesCount = async () => {
    try {
      const response = await otAdminService.getTodaysSurgeries();
      
      
      if (response.success) {
        const count = response.data?.length || 0;
        setTodaysSurgeriesCount(count);
      } else {
      }
    } catch (error) {
      // Don't show error toast, just log it
    }
  };

  const fetchAvailableLenses = async (searchTerm = '') => {
    try {
      const response = await surgerySchedulerService.getAvailableLenses({
        search: searchTerm,
        limit: 50
      });

      if (response.success) {
        setAvailableLenses(response.data || []);
      } else {
      }
    } catch (error) {
    }
  };

  const fetchSurgeryDetails = async (patient) => {
    try {
      const surgeryTypeId = patient.surgeryType?.id;
      if (!surgeryTypeId) {
        toast({
          title: "Error",
          description: "No surgery type found for this patient",
          variant: "destructive"
        });
        return;
      }

      const [packagesRes, investigationsRes, lensesRes] = await Promise.all([
        surgerySchedulerService.getPackagesWithRecommendations(surgeryTypeId),
        surgerySchedulerService.getSurgeryTypeInvestigations(surgeryTypeId),
        surgerySchedulerService.getAvailableLenses()
      ]);

      if (packagesRes.success) {
        setSurgeryPackages(packagesRes.data?.all || []);
        setRecommendedPackages(packagesRes.data?.recommended || []);
        setOtherPackages(packagesRes.data?.other || []);
      }
      if (investigationsRes.success) setInvestigations(investigationsRes.data || []);
      if (lensesRes.success) setAvailableLenses(lensesRes.data || []);

      setSelectedPatient(patient);
      setIsScheduleModalOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch surgery details",
        variant: "destructive"
      });
    }
  };

  // ==========================================
  // FORM HANDLING
  // ==========================================

  const fetchAvailableTimeSlots = async (date, otRoomId) => {
    
    if (!date || !otRoomId) {
      setAvailableTimeSlots([]);
      return;
    }

    try {
      setLoadingTimeSlots(true);
      
      const response = await fetch(
        `/api/v1/ipd/available-time-slots?date=${date}&otRoomId=${otRoomId}`,
        {
          credentials: 'include'
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setAvailableTimeSlots(data.data || []);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch available time slots",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch available time slots",
        variant: "destructive"
      });
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const handleScheduleFormChange = (field, value) => {
    // Enhanced logging for surgeryPackageId changes
    if (field === 'surgeryPackageId') {
      console.log('📦 Surgery Package ID Update:');
      console.log('   Previous value:', scheduleForm.surgeryPackageId);
      console.log('   New value:', value);
      console.log('   selectedPackage:', selectedPackage);
    }
    
    setScheduleForm(prev => ({
      ...prev,
      [field]: value
    }));

    // If surgery date is changed, fetch scheduled surgeries for that date
    if (field === 'surgeryDate') {
      fetchScheduledSurgeriesForDate(value);
      // Also fetch time slots if OT room is already selected
      if (scheduleForm.otRoomId) {
        fetchAvailableTimeSlots(value, scheduleForm.otRoomId);
      }
    }

    // If OT room is changed, fetch time slots if date is already selected
    if (field === 'otRoomId') {
      if (scheduleForm.surgeryDate) {
        fetchAvailableTimeSlots(scheduleForm.surgeryDate, value);
      }
    }
  };

  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    
    // Preserve the current surgery package selection when switching patients
    const currentSurgeryPackageId = scheduleForm.surgeryPackageId;
    
    // If we have a surgeryPackageId but no selectedPackage, or they don't match, clear both to avoid confusion
    if (currentSurgeryPackageId && (!selectedPackage || selectedPackage.id !== currentSurgeryPackageId)) {
      console.log('🔄 Patient Select: Clearing package selection due to mismatch');
      setSelectedPackage(null);
      setScheduleForm({
        surgeryDate: '',
        surgeryTimeSlot: '',
        tentativeTime: '',
        surgeryPackageId: '', // Clear mismatched package
        surgeonId: '',
        sisterId: '',
        anesthesiologistId: '',
        notes: '',
        lensRequired: false,
        lensId: null
      });
    } else {
      console.log('🔄 Patient Select: Preserving surgery package selection');
      setScheduleForm({
        surgeryDate: '',
        surgeryTimeSlot: '',
        tentativeTime: '',
        surgeryPackageId: currentSurgeryPackageId, // Preserve selected package
        surgeonId: '',
        sisterId: '',
        anesthesiologistId: '',
        notes: '',
        lensRequired: false,
        lensId: null
      });
    }

    // Reset lens selection states
    setSelectedLens(null);
    setLensSearchTerm('');

    // Fetch surgery details and lenses for this patient
    await fetchSurgeryDetails(patient);
    await fetchAvailableLenses();
  };

  const handleScheduleSurgery = async () => {
    try {
      if (!selectedPatient || !scheduleForm.surgeryDate || !scheduleForm.surgeryTimeSlot || !scheduleForm.surgeonId || !scheduleForm.otRoomId) {
        toast({
          title: "Validation Error",
          description: "Please fill in required fields (Surgery Date, Time Slot, Surgeon, OT Room)",
          variant: "destructive"
        });
        return;
      }

      if (scheduleForm.lensRequired && !scheduleForm.lensId) {
        toast({
          title: "Validation Error",
          description: "Please select a lens when lens is required",
          variant: "destructive"
        });
        return;
      }

      // Defensive check: Ensure surgeryPackageId is set from selectedPackage if missing
      let finalScheduleForm = { ...scheduleForm };
      if (selectedPackage && !finalScheduleForm.surgeryPackageId) {
        console.log('🔧 Defensive Fix: Setting surgeryPackageId from selectedPackage');
        finalScheduleForm.surgeryPackageId = selectedPackage.id;
      }

      setLoading(true);

      console.log('🏥 Surgery Scheduling Data:');
      console.log('   selectedPatient.id:', selectedPatient.id);
      console.log('   scheduleForm:', finalScheduleForm);
      console.log('   surgeryPackageId:', finalScheduleForm.surgeryPackageId);
      console.log('   selectedPackage:', selectedPackage);
      
      // 🚨 COMPLETE REQUEST PAYLOAD LOGGING 🚨
      console.log('═══════════════════════════════════════════');
      console.log('📤 COMPLETE API REQUEST PAYLOAD:');
      console.log('═══════════════════════════════════════════');
      console.log('🔍 Patient ID:', selectedPatient.id);
      console.log('🔍 Complete Schedule Form:');
      console.log(JSON.stringify(finalScheduleForm, null, 4));
      console.log('🔍 Raw Schedule Form (for copy-paste):');
      console.log(JSON.stringify(finalScheduleForm));
      console.log('═══════════════════════════════════════════');

      const response = await surgerySchedulerService.scheduleSurgery(
        selectedPatient.id,
        finalScheduleForm
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Surgery scheduled successfully",
        });

        // Reset form and close modal
        setScheduleForm({
          surgeryDate: '',
          surgeryTimeSlot: '',
          tentativeTime: '',
          surgeryPackageId: '',
          surgeonId: '',
          sisterId: '',
          anesthesiologistId: '',
          otRoomId: '',
          notes: '',
          lensRequired: false,
          lensId: null
        });
        setSelectedLens(null);
        setSelectedPackage(null);
        setLensSearchTerm('');
        setPackageSearchTerm('');
        setIsScheduleModalOpen(false);
        setSelectedPatient(null);

        // Refresh patients list
        fetchSuggestedPatients();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to schedule surgery",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule surgery",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'secondary';
      case 'ROUTINE': return 'outline';
      default: return 'outline';
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleLensSelect = (lens) => {
    setSelectedLens(lens);
    setScheduleForm(prev => ({
      ...prev,
      lensId: lens.id
    }));
    setIsLensPopoverOpen(false);
  };

  const handleLensRequiredChange = (checked) => {
    setScheduleForm(prev => ({
      ...prev,
      lensRequired: checked,
      lensId: checked ? prev.lensId : null
    }));

    if (!checked) {
      setSelectedLens(null);
      setLensSearchTerm('');
    }
  };

  const handleLensSearch = async (searchTerm) => {
    setLensSearchTerm(searchTerm);
    if (searchTerm.trim()) {
      await fetchAvailableLenses(searchTerm);
    } else {
      await fetchAvailableLenses();
    }
  };

  // ==========================================
  // RENDER COMPONENT
  // ==========================================

  return (
    <>
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex-shrink-0">
        {/* Row 1: Title + Stats Badges */}
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
            Surgery Scheduler
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              <User className="w-3 h-3 mr-1" />
              {patients.length} Pending
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <Stethoscope className="w-3 h-3 mr-1" />
              {surgeons.length} Surgeons
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
              <HeartHandshake className="w-3 h-3 mr-1" />
              {sisters.length + anesthesiologists.length} Support Staff
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
              <Activity className="w-3 h-3 mr-1" />
              {todaysSurgeriesCount} Today
            </Badge>
          </div>
        </div>

        {/* Row 2: Search */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patients by name, MRN, or surgery type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 min-h-0 overflow-y-auto tab-content-container pr-2">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader color="#3B82F6" />
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12 px-4">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3 opacity-50" />
            <p className="text-gray-500 font-medium">No Patients Found</p>
            <p className="text-gray-400 text-sm mt-1">
              No patients are currently suggested for surgery
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {patients.map((patient) => (
              <Card
                key={patient.id}
                className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500"
              >
                <CardContent className="p-4">
                  {/* Patient header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {patient.patient?.name || 'Unknown Patient'}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {patient.patient?.patientNumber || 'N/A'}
                        </Badge>
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          SURGERY SUGGESTED
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-3.5 w-3.5 text-gray-400" />
                          <span>
                            <strong>Surgery:</strong> {patient.surgeryType?.name || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span>
                            <strong>Admission:</strong> {formatDate(patient.admissionDate)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <UserCircle className="h-3.5 w-3.5 text-gray-400" />
                          <span>
                            <strong>Age/Gender:</strong> {patient.patient?.age || 'N/A'}Y / {patient.patient?.gender || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {patient.surgeryType?.description && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          <strong>Description:</strong> {patient.surgeryType.description}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePatientSelect(patient)}
                        disabled={loading}
                        className="h-8"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => handlePatientSelect(patient)}
                        disabled={loading}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 h-8"
                      >
                        <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Surgery Scheduling Modal */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <CalendarDays className="h-6 w-6 text-blue-600" />
              Schedule Surgery
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-6">
              {/* Patient Information - Collapsible */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
                      <UserCircle className="h-5 w-5" />
                      Patient Information
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const detailsEl = document.getElementById('patient-details');
                        if (detailsEl) {
                          detailsEl.style.display = detailsEl.style.display === 'none' ? 'grid' : 'none';
                        }
                      }}
                      className="h-8 px-2"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      <span className="text-xs">View Details</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div id="patient-details" className="grid grid-cols-3 gap-4 text-sm" style={{ display: 'none' }}>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Patient Name</p>
                      <p className="font-medium">{selectedPatient.patient?.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">MRN</p>
                      <p className="font-medium">{selectedPatient.patient?.patientNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Age / Gender</p>
                      <p className="font-medium">{selectedPatient.patient?.age}Y / {selectedPatient.patient?.gender}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Surgery Type</p>
                      <p className="font-medium text-blue-700">{selectedPatient.surgeryType?.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Admission Date</p>
                      <p className="font-medium">{formatDate(selectedPatient.admissionDate)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Contact</p>
                      <p className="font-medium">{selectedPatient.patient?.phone || 'N/A'}</p>
                    </div>
                  </div>
                  {/* Always visible summary */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-900">{selectedPatient.patient?.name}</span>
                      <Badge variant="outline" className="text-xs">{selectedPatient.patient?.patientNumber}</Badge>
                    </div>
                    <div className="text-gray-600">•</div>
                    <div className="text-gray-700">{selectedPatient.surgeryType?.name}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Investigations */}
              {investigations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Required Investigations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {investigations.map((investigation, index) => (
                        <div key={investigation.id || index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div>
                              <span className="text-sm font-medium">{investigation.investigationName}</span>
                              {investigation.investigationCode && (
                                <span className="text-xs text-muted-foreground ml-1">({investigation.investigationCode})</span>
                              )}
                              {investigation.description && (
                                <p className="text-xs text-muted-foreground mt-1">{investigation.description}</p>
                              )}
                            </div>
                          </div>
                          {investigation.cost && (
                            <span className="text-sm font-medium text-green-600">₹{investigation.cost}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Surgery Package Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Surgery Package Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Surgery Package</Label>
                    <Popover open={isPackagePopoverOpen} onOpenChange={setIsPackagePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isPackagePopoverOpen}
                          className="w-full justify-between"
                        >
                          {selectedPackage ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{selectedPackage.packageName}</span>
                              {selectedPackage.defaultLensName ? (
                                <span className="text-xs text-blue-600">Includes {selectedPackage.defaultLensName} lens</span>
                              ) : (
                                <span className="text-xs text-gray-500">This package does not include a lens</span>
                              )}
                            </div>
                          ) : "Select surgery package..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                        <Command>
                          <CommandInput
                            placeholder="Search packages by name, lens, or description..."
                            value={packageSearchTerm}
                            onValueChange={setPackageSearchTerm}
                          />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty>No surgery package found.</CommandEmpty>

                            {/* Recommended Packages */}
                            {recommendedPackages.length > 0 && (
                              <CommandGroup heading="🌟 Recommended for this Surgery">
                                {recommendedPackages
                                  .filter(pkg => {
                                    const searchLower = packageSearchTerm.toLowerCase();
                                    return (
                                      pkg.packageName?.toLowerCase().includes(searchLower) ||
                                      pkg.description?.toLowerCase().includes(searchLower) ||
                                      pkg.defaultLensName?.toLowerCase().includes(searchLower) ||
                                      pkg.defaultLens?.lensName?.toLowerCase().includes(searchLower) ||
                                      pkg.defaultLens?.manufacturer?.toLowerCase().includes(searchLower)
                                    );
                                  })
                                  .map((pkg) => (
                                    <CommandItem
                                      key={pkg.id}
                                      value={pkg.packageName}
                                      onSelect={() => {
                                        setSelectedPackage(pkg);
                                        handleScheduleFormChange('surgeryPackageId', pkg.id);
                                        setPackageSearchTerm('');
                                        setIsPackagePopoverOpen(false);
                                      }}
                                      className="border-l-4 border-l-blue-400"
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${selectedPackage?.id === pkg.id ? "opacity-100" : "opacity-0"
                                          }`}
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-medium text-blue-700">{pkg.packageName}</span>
                                          <span className="text-sm font-semibold text-green-600">
                                            ₹{pkg.packageCost?.toLocaleString() || 'Contact for price'}
                                          </span>
                                        </div>
                                        {pkg.defaultLensName ? (
                                          <div className="flex items-center gap-1 mt-1">
                                            <span className="text-xs text-blue-600 font-medium">This package includes:</span>
                                            <span className="text-xs text-blue-600">{pkg.defaultLensName} lens</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 mt-1">
                                            <span className="text-xs text-gray-500 font-medium">This package does not include a lens</span>
                                          </div>
                                        )}
                                        {pkg.description && (
                                          <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
                                        )}
                                        <Badge variant="secondary" className="text-xs mt-1">⭐ Recommended</Badge>
                                      </div>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            )}

                            {/* Other Packages */}
                            {otherPackages.length > 0 && (
                              <CommandGroup heading="Other Available Packages">
                                {otherPackages
                                  .filter(pkg => {
                                    const searchLower = packageSearchTerm.toLowerCase();
                                    return (
                                      pkg.packageName?.toLowerCase().includes(searchLower) ||
                                      pkg.description?.toLowerCase().includes(searchLower) ||
                                      pkg.defaultLensName?.toLowerCase().includes(searchLower) ||
                                      pkg.defaultLens?.lensName?.toLowerCase().includes(searchLower) ||
                                      pkg.defaultLens?.manufacturer?.toLowerCase().includes(searchLower)
                                    );
                                  })
                                  .map((pkg) => (
                                    <CommandItem
                                      key={pkg.id}
                                      value={pkg.packageName}
                                      onSelect={() => {
                                        setSelectedPackage(pkg);
                                        handleScheduleFormChange('surgeryPackageId', pkg.id);
                                        setPackageSearchTerm('');
                                        setIsPackagePopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${selectedPackage?.id === pkg.id ? "opacity-100" : "opacity-0"
                                          }`}
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <span>{pkg.packageName}</span>
                                          <span className="text-sm font-medium text-green-600">
                                            ₹{pkg.packageCost?.toLocaleString() || 'Contact for price'}
                                          </span>
                                        </div>
                                        {pkg.defaultLensName ? (
                                          <div className="flex items-center gap-1 mt-1">
                                            <span className="text-xs text-gray-600 font-medium">This package includes:</span>
                                            <span className="text-xs text-gray-600">{pkg.defaultLensName} lens</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1 mt-1">
                                            <span className="text-xs text-gray-500 font-medium">This package does not include a lens</span>
                                          </div>
                                        )}
                                        {pkg.description && (
                                          <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Selected Package Details */}
                  {selectedPackage && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">{selectedPackage.packageName}</h4>
                      {selectedPackage.description && (
                        <p className="text-sm text-blue-700 mb-2">{selectedPackage.description}</p>
                      )}
                      {selectedPackage.defaultLensName ? (
                        <p className="text-sm text-blue-600 mb-2 font-medium">
                          This package includes: {selectedPackage.defaultLensName} lens
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 mb-2 font-medium">
                          This package does not include a lens
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-700">
                          ₹{selectedPackage.packageCost?.toLocaleString() || 'Contact for price'}
                        </span>
                        {recommendedPackages.some(rec => rec.id === selectedPackage.id) && (
                          <Badge variant="secondary">⭐ Recommended</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Surgery Scheduling Form */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                    <Calendar className="h-5 w-5" />
                    Surgery Scheduling Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Row 1: Surgery Date and Lens Required */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Surgery Date */}
                    <div className="space-y-2">
                      <Label htmlFor="surgeryDate" className="text-sm font-semibold flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        Surgery Date *
                      </Label>
                      <Input
                        id="surgeryDate"
                        type="date"
                        min={getMinDate()}
                        value={scheduleForm.surgeryDate}
                        onChange={(e) => handleScheduleFormChange('surgeryDate', e.target.value)}
                        required
                        className="h-11"
                      />

                      {/* Scheduled Surgeries Indicator */}
                      {scheduleForm.surgeryDate && (
                        <div className="mt-2">
                          {loadingScheduledSurgeries ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div className="w-4 h-4">
                                <ClipLoader size={12} color="#454DE6" />
                              </div>
                              <span>Checking scheduled surgeries...</span>
                            </div>
                          ) : (
                            <div className={`flex items-center gap-2 p-2 rounded-md text-sm ${selectedDateSurgeriesCount === 0
                              ? 'bg-green-50 border border-green-200 text-green-800'
                              : selectedDateSurgeriesCount <= 3
                                ? 'bg-blue-50 border border-blue-200 text-blue-800'
                                : selectedDateSurgeriesCount <= 5
                                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                                  : 'bg-red-50 border border-red-200 text-red-800'
                              }`}>
                              {selectedDateSurgeriesCount === 0 ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="font-medium">No surgeries scheduled</span>
                                </>
                              ) : (
                                <>
                                  <Calendar className="h-4 w-4" />
                                  <span className="font-medium">
                                    {selectedDateSurgeriesCount} surgery{selectedDateSurgeriesCount !== 1 ? 'ies' : ''} scheduled
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Lens Required */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Lens Requirement</Label>
                      <div className="flex items-center space-x-3 h-11 px-4 border rounded-md bg-gray-50">
                        <Checkbox
                          id="lensRequired"
                          checked={scheduleForm.lensRequired}
                          onCheckedChange={handleLensRequiredChange}
                        />
                        <Label htmlFor="lensRequired" className="text-sm font-medium cursor-pointer">
                          Lens Required for Surgery
                        </Label>
                      </div>

                      {scheduleForm.lensRequired && (
                        <div className="mt-2">
                          <Popover open={isLensPopoverOpen} onOpenChange={setIsLensPopoverOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isLensPopoverOpen}
                                className="w-full justify-between h-11"
                              >
                                {selectedLens ? (
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium text-sm">{selectedLens.lensName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ₹{selectedLens.patientCost?.toLocaleString()}
                                    </span>
                                  </div>
                                ) : (
                                  "Select lens..."
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
                              <Command>
                                <CommandInput
                                  placeholder="Search lenses..."
                                  value={lensSearchTerm}
                                  onValueChange={handleLensSearch}
                                />
                                <CommandEmpty>No lenses found.</CommandEmpty>
                                <CommandList>
                                  <CommandGroup>
                                    {availableLenses.map((lens) => (
                                      <CommandItem
                                        key={lens.id}
                                        value={lens.id}
                                        onSelect={() => handleLensSelect(lens)}
                                        className="flex flex-col items-start py-3"
                                      >
                                        <div className="flex items-center w-full">
                                          <Check
                                            className={`mr-2 h-4 w-4 ${selectedLens?.id === lens.id ? "opacity-100" : "opacity-0"
                                              }`}
                                          />
                                          <div className="flex-1">
                                            <div className="font-medium">{lens.lensName}</div>
                                            <div className="text-xs text-muted-foreground">
                                              {lens.manufacturer} • ₹{lens.patientCost?.toLocaleString()}
                                            </div>
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Row 2: Staff Assignment */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Medical Team Assignment</Label>
                    {/* Debug info */}
                    <div className="text-xs text-gray-500 mb-2">
                 
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Surgeon */}
                      <div className="space-y-2">
                        <Label htmlFor="surgeonId" className="text-xs text-gray-600">Surgeon *</Label>
                        <Select
                          value={scheduleForm.surgeonId}
                          onValueChange={(value) => handleScheduleFormChange('surgeonId', value)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select surgeon" />
                          </SelectTrigger>
                          <SelectContent>
                            {surgeons.length === 0 ? (
                              <div className="p-2 text-sm text-gray-500">No surgeons available</div>
                            ) : (
                              surgeons.map((surgeon) => (
                                <SelectItem key={surgeon.id} value={surgeon.id}>
                                  Dr. {surgeon.firstName} {surgeon.lastName}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sister */}
                      <div className="space-y-2">
                        <Label htmlFor="sisterId" className="text-xs text-gray-600">Sister</Label>
                        <Select
                          value={scheduleForm.sisterId}
                          onValueChange={(value) => handleScheduleFormChange('sisterId', value)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select sister" />
                          </SelectTrigger>
                          <SelectContent>
                            {sisters.length === 0 ? (
                              <div className="p-2 text-sm text-gray-500">No sisters available</div>
                            ) : (
                              sisters.map((sister) => (
                                <SelectItem key={sister.id} value={sister.id}>
                                  {sister.firstName} {sister.lastName}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Anesthesiologist */}
                      <div className="space-y-2">
                        <Label htmlFor="anesthesiologistId" className="text-xs text-gray-600">Anesthesiologist</Label>
                        <Select
                          value={scheduleForm.anesthesiologistId}
                          onValueChange={(value) => handleScheduleFormChange('anesthesiologistId', value)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select anesthesiologist" />
                          </SelectTrigger>
                          <SelectContent>
                            {anesthesiologists.length === 0 ? (
                              <div className="p-2 text-sm text-gray-500">No anesthesiologists available</div>
                            ) : (
                              anesthesiologists.map((anes) => (
                                <SelectItem key={anes.id} value={anes.id}>
                                  Dr. {anes.firstName} {anes.lastName}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: OT Room and Time Slot */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* OT Room */}
                    <div className="space-y-2">
                      <Label htmlFor="otRoomId" className="text-sm font-semibold flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        OT Room *
                      </Label>
                      <Select
                        value={scheduleForm.otRoomId}
                        onValueChange={(value) => {
                          handleScheduleFormChange('otRoomId', value);
                        }}
                        disabled={!scheduleForm.surgeryDate}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={scheduleForm.surgeryDate ? "Select OT room" : "Select surgery date first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {otRooms.filter(room => room.status?.toLowerCase() === 'available').length === 0 ? (
                            <div className="p-2 text-sm text-gray-500 text-center">
                              No available OT rooms
                            </div>
                          ) : (
                            otRooms
                              .filter(room => room.status?.toLowerCase() === 'available')
                              .map((room) => (
                                <SelectItem key={room.id} value={room.id}>
                                  {room.roomName} ({room.roomNumber})
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                      
                      {/* OT Room booking info */}
                      {scheduleForm.otRoomId && scheduleForm.surgeryDate && otRoomAvailability[scheduleForm.otRoomId] && (
                        <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
                          <Activity className="h-3 w-3 inline mr-1" />
                          {otRoomAvailability[scheduleForm.otRoomId].count} surgery(ies) already booked
                        </div>
                      )}
                    </div>

                    {/* Surgery Time Slot */}
                    <div className="space-y-2">
                      <Label htmlFor="surgeryTimeSlot" className="text-sm font-semibold flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Surgery Time Slot *
                      </Label>
                      <Select
                        value={scheduleForm.surgeryTimeSlot}
                        onValueChange={(value) => {
                          handleScheduleFormChange('surgeryTimeSlot', value);
                        }}
                        disabled={!scheduleForm.surgeryDate || !scheduleForm.otRoomId || loadingTimeSlots}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={
                            !scheduleForm.surgeryDate ? "Select date first" :
                            !scheduleForm.otRoomId ? "Select OT room first" :
                            loadingTimeSlots ? "Loading..." :
                            "Select time slot"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimeSlots.length === 0 && !loadingTimeSlots && (
                            <div className="p-2 text-sm text-gray-500">
                              {scheduleForm.surgeryDate && scheduleForm.otRoomId 
                                ? "No slots available" 
                                : "Select date and OT room first"}
                            </div>
                          )}
                          {availableTimeSlots.map((slotInfo) => (
                            <SelectItem 
                              key={slotInfo.slot} 
                              value={slotInfo.slot}
                              disabled={!slotInfo.available}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{slotInfo.slot}</span>
                                {!slotInfo.available && (
                                  <Badge variant="destructive" className="ml-2 text-xs">Booked</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {scheduleForm.surgeryDate && scheduleForm.otRoomId && (
                        <div className="text-xs text-gray-600">
                          {loadingTimeSlots ? (
                            <span>Loading slots...</span>
                          ) : availableTimeSlots.length > 0 ? (
                            <span className="text-green-700">
                              ✓ {availableTimeSlots.filter(s => s.available).length} of {availableTimeSlots.length} slots available
                            </span>
                          ) : (
                            <span className="text-red-600">No slots available</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-semibold">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special instructions or notes for the surgery..."
                      rows={3}
                      value={scheduleForm.notes}
                      onChange={(e) => handleScheduleFormChange('notes', e.target.value)}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsScheduleModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleSurgery}
              disabled={loading || !scheduleForm.surgeryDate || !scheduleForm.surgeryTimeSlot || !scheduleForm.surgeonId || !scheduleForm.otRoomId || (scheduleForm.lensRequired && !scheduleForm.lensId)}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <ClipLoader size={16} color="#ffffff" className="mr-2" />
                  Scheduling...
                </>
              ) : (
                <>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule Surgery
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SurgeryScheduler;