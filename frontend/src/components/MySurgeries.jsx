import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Eye,
  Activity,
  FileText,
  Clock,
  User,
  Phone,
  Mail,
  Calendar,
  Package,
  Target,
  Stethoscope,
  Loader,
  AlertCircle,
  CheckCircle,
  Play,
  Save,
  Settings,
  Scissors,
  Timer,
  RefreshCw,
  Search,
  Plus
} from 'lucide-react';
import { surgeryService } from '@/services/surgeryService';
import { toast } from 'react-hot-toast';

const MySurgeries = () => {
  const queryClient = useQueryClient();
  
  // API Base URL - Use Vite environment variable or fallback
  const API_BASE_URL = import.meta.env.VITE_API_IMG_URL || 'http://localhost:8080';

  const [surgeryPatients, setSurgeryPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientMetrics, setPatientMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [surgeryNotes, setSurgeryNotes] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [availableEquipment, setAvailableEquipment] = useState([]);
  const [startingSurgery, setStartingSurgery] = useState(false);
  const [completingSurgery, setCompletingSurgery] = useState(false);
  const [activeSurgeryPatient, setActiveSurgeryPatient] = useState(null);
  const [surgeryElapsedTime, setSurgeryElapsedTime] = useState('00:00:00');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anesthesiaFilter, setAnesthesiaFilter] = useState('all');

  // Modals state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showSurgeryModal, setShowSurgeryModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  // Calculate age from dateOfBirth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    fetchReadyForSurgeryPatients();
  }, []);

  // Timer effect for surgery elapsed time
  useEffect(() => {
    let interval;
    if (showSurgeryModal && selectedPatient?.surgeryStartTime) {
      interval = setInterval(() => {
        const startTime = new Date(selectedPatient.surgeryStartTime);
        const now = new Date();
        const diff = Math.floor((now - startTime) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setSurgeryElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showSurgeryModal, selectedPatient?.surgeryStartTime]);

  const fetchReadyForSurgeryPatients = async () => {
    try {
      setLoading(true);
      // Fetch patients with both READY_FOR_SURGERY and SURGERY_STARTED statuses
      const [readyResponse, startedResponse] = await Promise.all([
        surgeryService.getReadyForSurgeryPatients(),
        surgeryService.getSurgeryStartedPatients()
      ]);

      const allPatients = [
        ...(readyResponse.data || []),
        ...(startedResponse.data || [])
      ];

      setSurgeryPatients(allPatients);
    } catch (error) {
      setSurgeryPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientMetrics = async (patientId) => {
    try {
      setMetricsLoading(true);
      const response = await surgeryService.getPatientRecentExamination(patientId);
      setPatientMetrics(response.data || null);
    } catch (error) {
      setPatientMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchAvailableEquipment = async () => {
    try {
      const response = await surgeryService.getAvailableEquipment();
      setAvailableEquipment(response.data || []);
    } catch (error) {
    }
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const handleViewMetrics = async (patient) => {
    setSelectedPatient(patient);
    await fetchPatientMetrics(patient.patient.id);
    setShowMetricsModal(true);
  };

  const handleViewDocuments = (patient) => {
    setSelectedPatient(patient);
    setSelectedDocuments(patient.investigationDocumentPath || []);
    setShowDocumentsModal(true);
  };

  const handleStartSurgery = async (patient) => {
    try {
      // If surgery is already started, just open the modal to resume
      if (patient.status === 'SURGERY_STARTED') {
        setSelectedPatient(patient);
        setActiveSurgeryPatient(patient);
        setShowSurgeryModal(true);
        return;
      }

      // If surgery is not started, start it first
      setStartingSurgery(true);
      const response = await surgeryService.startSurgery({
        ipdAdmissionId: patient.id,
        surgicalNotes: 'Surgery started',
        equipmentUsed: patient.requiredEquipments || []
      });

      if (response.success) {
        // Update patient status locally
        setSurgeryPatients(prev =>
          prev.map(p =>
            p.id === patient.id
              ? { ...p, status: 'SURGERY_STARTED' }
              : p
          )
        );

        setSelectedPatient({ ...patient, status: 'SURGERY_STARTED' });
        setActiveSurgeryPatient({ ...patient, status: 'SURGERY_STARTED' });
        setShowSurgeryModal(true);
        toast.success('Surgery started successfully');
      }
    } catch (error) {
      toast.error('Failed to start surgery');
    } finally {
      setStartingSurgery(false);
    }
  };

  const handleSurgeryStart = async () => {
    if (!selectedPatient || !surgeryNotes.trim()) {
      alert('Please enter surgical notes before starting surgery');
      return;
    }

    try {
      setStartingSurgery(true);
      await surgeryService.startSurgery({
        ipdAdmissionId: selectedPatient.id,
        surgicalNotes,
        equipmentUsed: selectedEquipment
      });

      // Update patient status locally
      setSurgeryPatients(prev =>
        prev.map(p =>
          p.id === selectedPatient.id
            ? { ...p, status: 'SURGERY_STARTED' }
            : p
        )
      );

      setShowSurgeryModal(false);
      setSurgeryNotes('');
      setSelectedEquipment([]);
    } catch (error) {
      alert('Error starting surgery. Please try again.');
    } finally {
      setStartingSurgery(false);
    }
  };

  const handleCompleteSurgery = async () => {
    if (!surgeryNotes.trim()) {
      toast.error('Please enter surgical notes before completing surgery');
      return;
    }

    completeSurgeryMutation.mutate({
      ipdAdmissionId: selectedPatient.id,
      finalNotes: surgeryNotes
    });
  };

  // Mutation for completing surgery with instant feedback
  const completeSurgeryMutation = useMutation({
    mutationFn: async (data) => {
      const response = await surgeryService.completeSurgery(data);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate queries immediately for real-time update
      queryClient.invalidateQueries(['todays-surgeries']);
      queryClient.invalidateQueries(['surgeon-surgeries']);
      queryClient.invalidateQueries(['completed-surgeries']);
      
      // Remove patient from local state
      setSurgeryPatients(prev =>
        prev.filter(p => p.id !== variables.ipdAdmissionId)
      );
      
      setShowSurgeryModal(false);
      setSurgeryNotes('');
      setActiveSurgeryPatient(null);
      
      toast.success('Surgery completed successfully');
    },
    onError: (error) => {
      toast.error('Failed to complete surgery');
    }
  });

  const addEquipmentToSelection = (equipment) => {
    const existing = selectedEquipment.find(e => e.id === equipment.id);
    if (existing) {
      setSelectedEquipment(prev =>
        prev.map(e =>
          e.id === equipment.id
            ? { ...e, quantity: e.quantity + 1 }
            : e
        )
      );
    } else {
      setSelectedEquipment(prev => [...prev, { ...equipment, quantity: 1 }]);
    }
  };

  const updateEquipmentQuantity = (equipmentId, quantity) => {
    if (quantity <= 0) {
      setSelectedEquipment(prev => prev.filter(e => e.id !== equipmentId));
    } else {
      setSelectedEquipment(prev =>
        prev.map(e =>
          e.id === equipmentId
            ? { ...e, quantity: Math.min(quantity, e.availableStock) }
            : e
        )
      );
    }
  };

  // Filter patients based on search, status, and anesthesia status
  const getFilteredPatients = () => {
    let filtered = surgeryPatients;

    // Apply search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
        `${patient.patient?.firstName} ${patient.patient?.lastName}`.toLowerCase().includes(query) ||
        patient.patient?.patientNumber?.toLowerCase().includes(query) ||
        patient.surgeryTypeDetail?.name?.toLowerCase().includes(query) ||
        patient.surgeryPackage?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Apply anesthesia filter
    if (anesthesiaFilter !== 'all') {
      if (anesthesiaFilter === 'given') {
        filtered = filtered.filter(p => p.requiresAnesthesia && p.anesthesiaGiven);
      } else if (anesthesiaFilter === 'pending') {
        filtered = filtered.filter(p => p.requiresAnesthesia && !p.anesthesiaGiven);
      } else if (anesthesiaFilter === 'not_required') {
        filtered = filtered.filter(p => !p.requiresAnesthesia);
      }
    }

    return filtered;
  };

  const filteredPatients = getFilteredPatients();
  const totalPatients = surgeryPatients.length;
  const readyForSurgeryCount = surgeryPatients.filter(p => p.status === 'READY_FOR_SURGERY').length;
  const surgeryStartedCount = surgeryPatients.filter(p => p.status === 'SURGERY_STARTED').length;
  const anesthesiaGivenCount = surgeryPatients.filter(p => p.requiresAnesthesia && p.anesthesiaGiven).length;
  const anesthesiaPendingCount = surgeryPatients.filter(p => p.requiresAnesthesia && !p.anesthesiaGiven).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-red-600" />
        <span className="ml-2 text-gray-600">Loading surgery patients...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* My Surgeries Card with Integrated Filters */}
      <Card className="flex flex-col flex-1 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="flex items-center">
              <Scissors className="h-5 w-5 mr-2 text-red-600" />
              My Surgeries
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {totalPatients} Total
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                {readyForSurgeryCount} Ready
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                {surgeryStartedCount} Started
              </Badge>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                {anesthesiaGivenCount} Anesthesia Given
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                {anesthesiaPendingCount} Anesthesia Pending
              </Badge>
              <Badge variant="outline">
                {filteredPatients.length} Result{filteredPatients.length !== 1 ? 's' : ''}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReadyForSurgeryPatients}
                className="h-9"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Integrated Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name, number, surgery type, or package..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="READY_FOR_SURGERY">Ready for Surgery</SelectItem>
                <SelectItem value="SURGERY_STARTED">Surgery Started</SelectItem>
              </SelectContent>
            </Select>
            <Select value={anesthesiaFilter} onValueChange={setAnesthesiaFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue placeholder="Filter by anesthesia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                <SelectItem value="given">Anesthesia Given</SelectItem>
                <SelectItem value="pending">Anesthesia Pending</SelectItem>
                <SelectItem value="not_required">Not Required</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto tab-content-container pr-2">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Scissors className="h-16 w-16 text-gray-300 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                {surgeryPatients.length === 0 ? 'No Patients Ready for Surgery' : 'No Results Found'}
              </h3>
              <p className="text-gray-400 text-sm">
                {surgeryPatients.length === 0 
                  ? 'All patients are either in surgery or completed their procedures.' 
                  : 'Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((admission) => (
                <div key={admission.id} className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {admission.patient.firstName} {admission.patient.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {calculateAge(admission.patient.dateOfBirth)}Y, {admission.patient.gender} | Patient ID: {admission.patient.patientNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ready for Surgery
                      </Badge>
                      {admission.requiresAnesthesia && (
                        <Badge className={admission.anesthesiaGiven 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-red-100 text-red-800 border-red-200"
                        }>
                          {admission.anesthesiaGiven ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Anesthesia Given
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Anesthesia Not Given
                            </>
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <Label className="text-xs text-gray-500">SURGERY DETAILS</Label>
                      <p className="font-medium">{admission.surgeryTypeDetail?.name || 'Not specified'}</p>
                      <p className="text-sm text-gray-600">{admission.surgeryPackage || 'Standard Package'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">ADMISSION DATE</Label>
                      <p className="font-medium">
                        {new Date(admission.admissionDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(admission.admissionDate).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">LENS RECOMMENDATION</Label>
                      <p className="font-medium">{admission.lens?.lensName || 'To be determined'}</p>
                      <p className="text-sm text-gray-600">{admission.lens?.lensType || ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(admission)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewMetrics(admission)}
                    >
                      <Activity className="h-4 w-4 mr-1" />
                      View Metrics
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocuments(admission)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View Reports/Fitness Documents
                    </Button>
                    <Button
                      className={admission.status === 'SURGERY_STARTED'
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-red-600 hover:bg-red-700"
                      }
                      size="sm"
                      onClick={() => handleStartSurgery(admission)}
                    >
                      <Scissors className="h-4 w-4 mr-1" />
                      {admission.status === 'SURGERY_STARTED' ? 'Resume Surgery' : 'Start Surgery'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Patient Details</span>
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-6">
              {/* Patient Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Patient Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                        <p className="text-lg font-semibold">
                          {selectedPatient.patient.firstName} {selectedPatient.patient.lastName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Age & Gender</Label>
                        <p>{calculateAge(selectedPatient.patient.dateOfBirth)} years, {selectedPatient.patient.gender}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Patient Number</Label>
                        <p className="font-mono">{selectedPatient.patient.patientNumber}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Phone</Label>
                        <p className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          {selectedPatient.patient.phone || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <p className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          {selectedPatient.patient.email || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Address</Label>
                        <p>{selectedPatient.patient.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Surgery Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Surgery Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Surgery Type</Label>
                        <p className="font-medium">{selectedPatient.surgeryTypeDetail?.name || 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Package Selected</Label>
                        <p className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-blue-500" />
                          {selectedPatient.surgeryPackage || 'Standard Package'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Admission Date</Label>
                        <p className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {new Date(selectedPatient.admissionDate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Recommended Lens</Label>
                        <p className="flex items-center">
                          <Target className="h-4 w-4 mr-2 text-green-500" />
                          {selectedPatient.lens?.lensName || 'To be determined'}
                        </p>
                        {selectedPatient.lens?.lensType && (
                          <p className="text-sm text-gray-600 ml-6">{selectedPatient.lens.lensType}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Current Status</Label>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {selectedPatient.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Details */}
              {selectedPatient.journeyNotes && Object.keys(selectedPatient.journeyNotes).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Journey Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm">
                        {JSON.stringify(selectedPatient.journeyNotes, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Patient Metrics Modal */}
      <Dialog open={showMetricsModal} onOpenChange={setShowMetricsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Most Recent Examination Values</span>
            </DialogTitle>
          </DialogHeader>

          {metricsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading examination data...</span>
            </div>
          ) : patientMetrics ? (
            <div className="space-y-6">
              {/* Optometrist Examination */}
              {patientMetrics.optometristExamination && (() => {
                const data = patientMetrics.optometristExamination;

                // Separate clinical details and addition test for separate tables
                const clinicalDetails = data.clinicalDetails;
                const additionTest = data.additionTest;

                // Regular fields (excluding clinical details and addition test)
                const regularFields = Object.entries(data)
                  .filter(([key, value]) => {
                    if (['id', 'patientVisitId', 'optometristId', 'createdAt', 'updatedAt', 'receptionist2ReviewedBy', 'clinicalDetails', 'additionTest'].includes(key)) return false;
                    if (value === null || value === undefined || value === '' || value === 'N/A') return false;
                    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
                    return true;
                  });

                // Format time fields
                const formatValue = (key, val) => {
                  if (key === 'receptionist2ReviewedAt' && val) {
                    return new Date(val).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    });
                  }

                  // Handle objects with better formatting
                  if (typeof val === 'object' && val !== null) {
                    // Special formatting for pre-op params and slit lamp findings
                    if (key === 'preOpParams' || key === 'slitLampFindings') {
                      const formatted = Object.entries(val)
                        .filter(([k, v]) => v && v !== 'N/A')
                        .map(([k, v]) => {
                          if (typeof v === 'object') {
                            const eyeData = Object.entries(v)
                              .filter(([eye, value]) => value && value !== 'N/A')
                              .map(([eye, value]) => `${eye === 'leftEye' ? 'LE' : eye === 'rightEye' ? 'RE' : eye}: ${value}`)
                              .join(', ');
                            return eyeData ? `${k.replace(/([A-Z])/g, ' $1').trim()}: ${eyeData}` : null;
                          }
                          return `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`;
                        })
                        .filter(Boolean)
                        .join('; ');
                      return formatted || 'N/A';
                    }

                    // Handle other objects (like refraction, tonometry, etc.)
                    if (Object.keys(val).includes('leftEye') || Object.keys(val).includes('rightEye')) {
                      const formatted = Object.entries(val)
                        .filter(([eye, value]) => value && value !== 'N/A' && value !== '')
                        .map(([eye, value]) => {
                          const eyeLabel = eye === 'leftEye' ? 'LE' : eye === 'rightEye' ? 'RE' : eye;
                          if (typeof value === 'object') {
                            const subValues = Object.entries(value)
                              .filter(([k, v]) => v && v !== 'N/A' && v !== '')
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(', ');
                            return subValues ? `${eyeLabel}: (${subValues})` : null;
                          }
                          return `${eyeLabel}: ${value}`;
                        })
                        .filter(Boolean)
                        .join('; ');
                      return formatted || 'N/A';
                    }

                    // For other complex objects, create readable format
                    const formatted = Object.entries(val)
                      .filter(([k, v]) => v && v !== 'N/A' && v !== '')
                      .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`)
                      .join(', ');
                    return formatted || 'N/A';
                  }

                  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
                  return val ? val.toString() : 'N/A';
                };

                const formatFieldName = (fieldName) => {
                  return fieldName
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim();
                };

                // Split regular fields evenly between columns
                const leftFields = regularFields.slice(0, Math.ceil(regularFields.length / 2));
                const rightFields = regularFields.slice(Math.ceil(regularFields.length / 2));

                return (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <Stethoscope className="h-5 w-5 mr-2 text-blue-600" />
                          Optometrist Examination - Basic Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left Column */}
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300 h-full text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border border-gray-300 px-3 py-1.5 text-left font-medium text-xs">Parameter</th>
                                  <th className="border border-gray-300 px-3 py-1.5 text-left font-medium text-xs">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {leftFields.map(([key, value]) => (
                                  <tr key={key} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-3 py-1.5 font-medium text-gray-700 text-xs">
                                      {formatFieldName(key)}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-1.5 text-gray-900 text-xs">
                                      {formatValue(key, value)}
                                    </td>
                                  </tr>
                                ))}
                                {/* Fill empty rows if needed */}
                                {Array.from({ length: Math.max(0, rightFields.length - leftFields.length) }).map((_, index) => (
                                  <tr key={`empty-left-${index}`}>
                                    <td className="border border-gray-300 px-3 py-1.5">&nbsp;</td>
                                    <td className="border border-gray-300 px-3 py-1.5">&nbsp;</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Right Column */}
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300 h-full text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border border-gray-300 px-3 py-1.5 text-left font-medium text-xs">Parameter</th>
                                  <th className="border border-gray-300 px-3 py-1.5 text-left font-medium text-xs">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rightFields.map(([key, value]) => (
                                  <tr key={key} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-3 py-1.5 font-medium text-gray-700 text-xs">
                                      {formatFieldName(key)}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-1.5 text-gray-900 text-xs">
                                      {formatValue(key, value)}
                                    </td>
                                  </tr>
                                ))}
                                {/* Fill empty rows if needed */}
                                {Array.from({ length: Math.max(0, leftFields.length - rightFields.length) }).map((_, index) => (
                                  <tr key={`empty-right-${index}`}>
                                    <td className="border border-gray-300 px-3 py-1.5">&nbsp;</td>
                                    <td className="border border-gray-300 px-3 py-1.5">&nbsp;</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Clinical Details Table */}
                    {clinicalDetails && Object.keys(clinicalDetails).length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <Stethoscope className="h-5 w-5 mr-2 text-purple-600" />
                            Clinical Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {Object.entries(clinicalDetails).map(([category, details]) => (
                              <div key={category} className="overflow-x-auto">
                                <h4 className="font-medium mb-2 text-gray-800 capitalize text-sm">{category.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                <table className="w-full border-collapse border border-gray-300 text-sm">
                                  <thead>
                                    <tr className="bg-gray-50">
                                      <th className="border border-gray-300 px-3 py-1.5 text-left font-medium text-xs">Eye</th>
                                      <th className="border border-gray-300 px-3 py-1.5 text-left font-medium text-xs">Value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {typeof details === 'object' && details !== null && Object.entries(details).map(([eye, value]) => (
                                      <tr key={eye} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-3 py-1.5 font-medium text-gray-700 capitalize text-xs">
                                          {eye === 'leftEye' ? 'Left Eye' : eye === 'rightEye' ? 'Right Eye' : eye}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-1.5 text-gray-900 text-xs">
                                          {typeof value === 'object' && value !== null
                                            ? Object.entries(value)
                                              .filter(([k, v]) => v && v !== 'N/A' && v !== '')
                                              .map(([k, v]) => `${k}: ${v}`)
                                              .join(', ') || 'N/A'
                                            : (value?.toString() || 'N/A')
                                          }
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Addition Test Table */}
                    {additionTest && Object.keys(additionTest).length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center">
                            <Eye className="h-5 w-5 mr-2 text-orange-600" />
                            Addition Test Results
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {Object.entries(additionTest).map(([category, details]) => (
                              <div key={category} className="overflow-x-auto">
                                <h4 className="font-medium mb-2 text-gray-800 capitalize text-sm">{category.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                <table className="w-full border-collapse border border-gray-300 text-sm">
                                  <thead>
                                    <tr className="bg-gray-50">
                                      <th className="border border-gray-300 px-3 py-1.5 text-left font-medium text-xs">Eye</th>
                                      <th className="border border-gray-300 px-3 py-1.5 text-left font-medium text-xs">Value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {typeof details === 'object' && details !== null && Object.entries(details).map(([eye, value]) => (
                                      <tr key={eye} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-3 py-1.5 font-medium text-gray-700 capitalize text-xs">
                                          {eye === 'leftEye' ? 'Left Eye' : eye === 'rightEye' ? 'Right Eye' : eye}
                                        </td>
                                        <td className="border border-gray-300 px-3 py-1.5 text-gray-900 text-xs">
                                          {typeof value === 'object' && value !== null
                                            ? Object.entries(value)
                                              .filter(([k, v]) => v && v !== 'N/A' && v !== '')
                                              .map(([k, v]) => `${k}: ${v}`)
                                              .join(', ') || 'N/A'
                                            : (value?.toString() || 'N/A')
                                          }
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}

              {/* General Examinations */}
              {patientMetrics.examinations && patientMetrics.examinations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-green-600" />
                      Additional Examinations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {patientMetrics.examinations.map((examination, index) => {
                        const validEntries = Object.entries(examination)
                          .filter(([key, value]) => {
                            if (['id', 'patientVisitId', 'doctorId', 'createdAt', 'updatedAt'].includes(key)) return false;
                            if (value === null || value === undefined || value === '' || value === 'N/A') return false;
                            if (typeof value === 'object' && Object.keys(value).length === 0) return false;
                            return true;
                          });

                        if (validEntries.length === 0) return null;

                        return (
                          <div key={index} className="border rounded-lg p-4">
                            <h4 className="font-medium mb-4 text-gray-800">Examination {index + 1}</h4>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Left Column */}
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                  <thead>
                                    <tr className="bg-gray-50">
                                      <th className="border border-gray-300 px-4 py-2 text-left font-medium">Parameter</th>
                                      <th className="border border-gray-300 px-4 py-2 text-left font-medium">Value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {validEntries
                                      .slice(0, Math.ceil(validEntries.length / 2))
                                      .map(([key, value]) => {
                                        const formatFieldName = (fieldName) => {
                                          return fieldName
                                            .replace(/([A-Z])/g, ' $1')
                                            .replace(/^./, str => str.toUpperCase())
                                            .trim();
                                        };

                                        const formatValue = (val) => {
                                          if (typeof val === 'object') {
                                            try {
                                              return JSON.stringify(val, null, 2);
                                            } catch {
                                              return 'Complex Data';
                                            }
                                          }
                                          if (typeof val === 'boolean') return val ? 'Yes' : 'No';
                                          return val.toString();
                                        };

                                        return (
                                          <tr key={key} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">
                                              {formatFieldName(key)}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 text-gray-900">
                                              {formatValue(value)}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                  </tbody>
                                </table>
                              </div>

                              {/* Right Column */}
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                  <thead>
                                    <tr className="bg-gray-50">
                                      <th className="border border-gray-300 px-4 py-2 text-left font-medium">Parameter</th>
                                      <th className="border border-gray-300 px-4 py-2 text-left font-medium">Value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {validEntries
                                      .slice(Math.ceil(validEntries.length / 2))
                                      .map(([key, value]) => {
                                        const formatFieldName = (fieldName) => {
                                          return fieldName
                                            .replace(/([A-Z])/g, ' $1')
                                            .replace(/^./, str => str.toUpperCase())
                                            .trim();
                                        };

                                        const formatValue = (val) => {
                                          if (typeof val === 'object') {
                                            try {
                                              return JSON.stringify(val, null, 2);
                                            } catch {
                                              return 'Complex Data';
                                            }
                                          }
                                          if (typeof val === 'boolean') return val ? 'Yes' : 'No';
                                          return val.toString();
                                        };

                                        return (
                                          <tr key={key} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-4 py-2 font-medium text-gray-700">
                                              {formatFieldName(key)}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 text-gray-900">
                                              {formatValue(value)}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Visit Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Visit Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-1.5 text-left font-medium text-xs">Detail</th>
                          <th className="border border-gray-300 px-3 py-1.5 text-left font-medium text-xs">Information</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-1.5 font-medium text-gray-700 text-xs">Visit Date</td>
                          <td className="border border-gray-300 px-3 py-1.5 text-gray-900 text-xs">
                            {new Date(patientMetrics.visitDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} at {new Date(patientMetrics.visitDate).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-1.5 font-medium text-gray-700 text-xs">Visit Type</td>
                          <td className="border border-gray-300 px-3 py-1.5 text-gray-900 text-xs">
                            {patientMetrics.visitType || 'Regular Checkup'}
                          </td>
                        </tr>
                        {patientMetrics.chiefComplaint && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-1.5 font-medium text-gray-700 text-xs">Chief Complaint</td>
                            <td className="border border-gray-300 px-3 py-1.5 text-gray-900 text-xs">
                              {patientMetrics.chiefComplaint}
                            </td>
                          </tr>
                        )}
                        {patientMetrics.priorityLevel && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-3 py-1.5 font-medium text-gray-700 text-xs">Priority Level</td>
                            <td className="border border-gray-300 px-3 py-1.5 text-gray-900 text-xs">
                              {patientMetrics.priorityLevel}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Examination Data Found</h3>
              <p className="text-gray-600">No recent examination records available for this patient.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Investigation Documents Modal */}
      <Dialog open={showDocumentsModal} onOpenChange={setShowDocumentsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span>Investigation Documents & Reports</span>
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Patient: {selectedPatient.patient.firstName} {selectedPatient.patient.lastName}</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDocuments.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-gray-600 mb-4">Total Documents: {selectedDocuments.length}</p>
                      <div className="grid grid-cols-1 gap-4">
                        {selectedDocuments.map((documentPath, index) => {
                          const fileName = documentPath.split('/').pop();
                          const displayName = fileName.split('_').slice(1).join('_') || fileName;

                          return (
                            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <FileText className="h-8 w-8 text-blue-600" />
                                  <div>
                                    <h4 className="font-medium text-gray-900">{displayName}</h4>
                                    <p className="text-sm text-gray-600">Document {index + 1}</p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(`${API_BASE_URL}/${documentPath}`, '_blank')}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </div>

                              {/* Document preview iframe */}
                              <div className="mt-4">
                                <div className="border rounded bg-gray-50 p-2">
                                  <iframe
                                    src={`${API_BASE_URL}/${documentPath}`}
                                    className="w-full h-64 border rounded"
                                    title={`Document ${index + 1}`}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
                      <p className="text-gray-600">No investigation documents or reports have been uploaded for this patient.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Start Surgery Modal */}
      <Dialog open={showSurgeryModal} onOpenChange={setShowSurgeryModal}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between space-x-2 text-base">
              <div className="flex items-center space-x-2">
                <Scissors className="h-4 w-4 text-red-600" />
                <span>Surgery Management</span>
              </div>
              {selectedPatient?.surgeryStartTime && (
                <div className="flex items-center gap-2 bg-blue-100 px-3 py-1.5 rounded-lg">
                  <Timer className="h-4 w-4 text-blue-600" />
                  <span className="font-mono font-semibold text-blue-800">{surgeryElapsedTime}</span>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-3">
              {/* Patient Summary - Compact */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-sm">
                    {selectedPatient.patient.firstName} {selectedPatient.patient.lastName}
                  </h3>
                  <p className="text-gray-600 text-xs">{selectedPatient.surgeryTypeDetail?.name || 'Surgery'}</p>
                </div>
                <Badge className={
                  activeSurgeryPatient?.status === 'SURGERY_STARTED'
                    ? "bg-blue-100 text-blue-800 text-xs"
                    : "bg-green-100 text-green-800 text-xs"
                }>
                  {activeSurgeryPatient?.status === 'SURGERY_STARTED' ? 'Surgery In Progress' : 'Ready for Surgery'}
                </Badge>
              </div>

              {/* Surgery Equipment & Notes Display - Compact */}
              <div className="space-y-3">
                {/* Show required equipment and lenses from OT Admin */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center space-x-2 text-sm">
                      <Settings className="h-4 w-4 text-blue-600" />
                      <span>Pre-Selected Surgery Equipment & Lenses</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Required Equipment - Left Column */}
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">Required Equipment</Label>
                        {selectedPatient?.requiredEquipments && Object.keys(selectedPatient.requiredEquipments).length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300 text-xs">
                              <thead>
                                <tr className="bg-blue-50">
                                  <th className="border border-gray-300 px-2 py-1 text-left font-medium text-xs">Equipment Name</th>
                                  <th className="border border-gray-300 px-2 py-1 text-left font-medium text-xs">Qty</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.values(selectedPatient.requiredEquipments).map((equipment, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-2 py-1 text-xs">
                                      <div>
                                        <div className="font-medium">{equipment.name || 'Equipment'}</div>
                                        <div className="text-gray-600">{equipment.category || 'General'}</div>
                                      </div>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1 text-center text-xs">
                                      <Badge className="bg-blue-100 text-blue-800 text-xs">{equipment.quantity || 1}</Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-xs p-2 border rounded bg-gray-50">No equipment pre-selected</p>
                        )}
                      </div>

                      {/* Required Lenses - Right Column */}
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">Required Lenses</Label>
                        {selectedPatient?.requiredLenses && Object.keys(selectedPatient.requiredLenses).length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300 text-xs">
                              <thead>
                                <tr className="bg-green-50">
                                  <th className="border border-gray-300 px-2 py-1 text-left font-medium text-xs">Lens Details</th>
                                  <th className="border border-gray-300 px-2 py-1 text-left font-medium text-xs">Qty</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.values(selectedPatient.requiredLenses).map((lens, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-2 py-1 text-xs">
                                      <div>
                                        <div className="font-medium">{lens.lensName || 'IOL Lens'}</div>
                                        <div className="text-gray-600">{lens.lensType || 'Standard'}</div>
                                        {lens.lensCategory && <div className="text-gray-500">{lens.lensCategory}</div>}
                                      </div>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1 text-center text-xs">
                                      <Badge className="bg-green-100 text-green-800 text-xs">1</Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-xs p-2 border rounded bg-gray-50">No lenses pre-selected</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Surgical Notes - Compact */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center space-x-2 text-sm">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span>Surgical Notes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Textarea
                      value={surgeryNotes}
                      onChange={(e) => setSurgeryNotes(e.target.value)}
                      placeholder="Enter surgical notes, observations, and any important details about the procedure..."
                      className="min-h-[120px] text-sm"
                    />
                    <div className="mt-3 flex justify-end">
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-sm"
                        onClick={handleCompleteSurgery}
                        disabled={completingSurgery || !surgeryNotes.trim()}
                      >
                        {completingSurgery ? (
                          <>
                            <Loader className="h-3 w-3 mr-2 animate-spin" />
                            Completing Surgery...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-2" />
                            Complete Surgery
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MySurgeries;