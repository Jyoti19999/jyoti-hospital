import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import Loader from "@/components/loader/Loader";
import DashboardHeader from '@/components/reuseable-components/DashboardHeader';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Calendar,
  Clock,
  Eye,
  Activity,
  FileText,
  CheckCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Stethoscope,
  ClipboardList,
  Timer,
  UserPlus,
  RefreshCw,
  ChevronRight,
  Info
} from "lucide-react";

// Import IPD hooks
import {
  useIpdAdmissions,
  useCreateIpdAdmission,
  useUpdateIpdAdmission,
  useDeleteIpdAdmission,
  useIpdAdmission
} from '@/hooks/useIpdQueries';

// Import patient search hook (assuming it exists)
import { usePatientSearch } from '@/hooks/usePatientQueries';

/*
========================================
🏥 IPD ADMISSION MANAGEMENT COMPONENT
========================================

Complete IPD admission management interface with:
- List view with pagination and search
- Create new admission form
- Edit existing admissions
- View admission details
- Delete admissions
- Patient search and selection
*/

// Surgery type options
const SURGERY_TYPES = [
  { value: 'CATARACT', label: 'Cataract Surgery' },
  { value: 'GLAUCOMA', label: 'Glaucoma Surgery' },
  { value: 'RETINAL', label: 'Retinal Surgery' },
  { value: 'CORNEAL', label: 'Corneal Surgery' },
  { value: 'REFRACTIVE', label: 'Refractive Surgery' },
  { value: 'OTHER', label: 'Other' }
];

// Status options
const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'POSTPONED', label: 'Postponed' }
];

// Patient Search Component
const PatientSearchDialog = ({ isOpen, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: searchResults, isLoading: searchLoading } = usePatientSearch(searchTerm, {
    enabled: searchTerm.length >= 2
  });

  const patients = searchResults?.data?.patients || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Patient</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Search by name, phone, or patient number</Label>
            <Input
              id="search"
              placeholder="Enter patient details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          {searchLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader />
            </div>
          )}

          {searchTerm.length >= 2 && !searchLoading && (
            <div className="space-y-2">
              {patients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No patients found for "{searchTerm}"
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {patients.map((patient) => (
                    <Card 
                      key={patient.id} 
                      className="cursor-pointer hover:shadow-sm border transition-all"
                      onClick={() => {
                        onSelect(patient);
                        onClose();
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {patient.firstName} {patient.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              #{patient.patientNumber} • {patient.phone}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Admission Form Component
const AdmissionForm = ({ admission = null, onSubmit, onCancel, isLoading }) => {
  const [selectedPatient, setSelectedPatient] = useState(admission?.patient || null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [formData, setFormData] = useState({
    patientId: admission?.patientId || '',
    surgeryType: admission?.surgeryType || '',
    surgeryDate: admission?.surgeryDate ? new Date(admission.surgeryDate) : null,
    notes: admission?.notes || '',
    preOpInstructions: admission?.preOpInstructions || '',
    expectedDuration: admission?.expectedDuration || ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast({
        title: "Patient Required",
        description: "Please select a patient for this admission",
        variant: "destructive",
      });
      return;
    }

    if (!formData.surgeryType || !formData.surgeryDate) {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      patientId: selectedPatient.id,
      surgeryDate: formData.surgeryDate.toISOString(),
      expectedDuration: parseInt(formData.expectedDuration) || undefined
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Patient Selection */}
      <div className="space-y-2">
        <Label>Patient *</Label>
        {selectedPatient ? (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    #{selectedPatient.patientNumber} • {selectedPatient.phone}
                  </p>
                </div>
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPatientSearch(true)}
                >
                  Change Patient
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button 
            type="button"
            variant="outline" 
            className="w-full justify-center py-8 border-2 border-dashed"
            onClick={() => setShowPatientSearch(true)}
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Select Patient
          </Button>
        )}
      </div>

      {/* Surgery Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="surgeryType">Surgery Type *</Label>
          <Select 
            value={formData.surgeryType} 
            onValueChange={(value) => handleInputChange('surgeryType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select surgery type" />
            </SelectTrigger>
            <SelectContent>
              {SURGERY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="surgeryDate">Surgery Date *</Label>
          <DatePicker
            selected={formData.surgeryDate}
            onSelect={(date) => handleInputChange('surgeryDate', date)}
            placeholder="Select surgery date"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedDuration">Expected Duration (minutes)</Label>
        <Input
          id="expectedDuration"
          type="number"
          placeholder="e.g., 120"
          value={formData.expectedDuration}
          onChange={(e) => handleInputChange('expectedDuration', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preOpInstructions">Pre-Operative Instructions</Label>
        <Textarea
          id="preOpInstructions"
          placeholder="Enter pre-operative instructions for the patient..."
          value={formData.preOpInstructions}
          onChange={(e) => handleInputChange('preOpInstructions', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          placeholder="Enter any additional notes..."
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={3}
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              {admission ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              {admission ? 'Update Admission' : 'Create Admission'}
            </>
          )}
        </Button>
      </div>

      {/* Patient Search Dialog */}
      <PatientSearchDialog
        isOpen={showPatientSearch}
        onClose={() => setShowPatientSearch(false)}
        onSelect={setSelectedPatient}
      />
    </form>
  );
};

// Admission Card Component
const AdmissionCard = ({ admission, onEdit, onDelete, onView }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const getSurgeryTypeColor = (type) => {
    const colors = {
      CATARACT: 'bg-blue-100 text-blue-800',
      GLAUCOMA: 'bg-green-100 text-green-800',
      RETINAL: 'bg-purple-100 text-purple-800',
      CORNEAL: 'bg-orange-100 text-orange-800',
      REFRACTIVE: 'bg-pink-100 text-pink-800',
      OTHER: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.OTHER;
  };

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      POSTPONED: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || colors.SCHEDULED;
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h3 className="text-lg font-semibold">
                {admission.patient?.firstName} {admission.patient?.lastName}
              </h3>
              <Badge className={getSurgeryTypeColor(admission.surgeryType)}>
                {admission.surgeryType}
              </Badge>
              <Badge className={getStatusColor(admission.status)}>
                {admission.status || 'SCHEDULED'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>#{admission.admissionNumber}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(admission.surgeryDate)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatTime(admission.surgeryDate)}</span>
              </div>
              {admission.expectedDuration && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>{admission.expectedDuration} min</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Created {formatDate(admission.createdAt)}</span>
              </div>
            </div>

            {admission.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {admission.notes}
              </p>
            )}
          </div>

          <div className="ml-4 space-y-2">
            <Button variant="outline" size="sm" onClick={() => onView(admission)}>
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(admission)}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(admission)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main IPD Admissions Component
const IpdAdmissions = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [surgeryTypeFilter, setSurgeryTypeFilter] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState(null);
  const [viewingAdmission, setViewingAdmission] = useState(null);

  const { toast } = useToast();

  // Query parameters
  const queryParams = {
    page: currentPage,
    limit: 10,
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter && { status: statusFilter }),
    ...(surgeryTypeFilter && { surgeryType: surgeryTypeFilter })
  };

  // Fetch admissions
  const {
    data: admissionsData,
    isLoading,
    error,
    refetch
  } = useIpdAdmissions(queryParams);

  // Mutations
  const createMutation = useCreateIpdAdmission();
  const updateMutation = useUpdateIpdAdmission();
  const deleteMutation = useDeleteIpdAdmission();

  const admissions = admissionsData?.data || [];
  const pagination = admissionsData?.pagination || {};

  const handleCreate = async (formData) => {
    try {
      await createMutation.mutateAsync(formData);
      setShowCreateForm(false);
    } catch (error) {
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingAdmission) return;
    
    try {
      await updateMutation.mutateAsync({
        admissionId: editingAdmission.id,
        updateData: formData
      });
      setEditingAdmission(null);
    } catch (error) {
    }
  };

  const handleDelete = async (admission) => {
    if (window.confirm(`Are you sure you want to delete admission #${admission.admissionNumber}?`)) {
      try {
        await deleteMutation.mutateAsync(admission.id);
      } catch (error) {
      }
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (type, value) => {
    if (type === 'status') {
      setStatusFilter(value);
    } else if (type === 'surgeryType') {
      setSurgeryTypeFilter(value);
    }
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="IPD Admissions"
        subtitle="Manage In-Patient Department Admissions"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Action Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Admission
            </Button>
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admissions..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={surgeryTypeFilter} onValueChange={(value) => handleFilterChange('surgeryType', value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Surgery Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {SURGERY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Admissions</h3>
              <p className="text-muted-foreground mb-4">
                {error.message || 'An error occurred while loading admissions'}
              </p>
              <Button onClick={refetch}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : admissions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Admissions Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter || surgeryTypeFilter 
                  ? 'No admissions match your current filters' 
                  : 'Get started by creating your first IPD admission'
                }
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Admission
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Results Summary */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.total || 0)} of {pagination.total || 0} admissions
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-1 text-sm bg-gray-100 rounded">
                      {currentPage} of {pagination.pages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= (pagination.pages || 1)}
                      onClick={() => setCurrentPage(prev => Math.min(pagination.pages || 1, prev + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admissions List */}
            <div className="space-y-4">
              {admissions.map((admission) => (
                <AdmissionCard
                  key={admission.id}
                  admission={admission}
                  onView={setViewingAdmission}
                  onEdit={setEditingAdmission}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}

        {/* Create Admission Dialog */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create New IPD Admission</span>
              </DialogTitle>
            </DialogHeader>
            <AdmissionForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Admission Dialog */}
        <Dialog open={!!editingAdmission} onOpenChange={() => setEditingAdmission(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Edit className="h-5 w-5" />
                <span>Edit IPD Admission</span>
              </DialogTitle>
            </DialogHeader>
            {editingAdmission && (
              <AdmissionForm
                admission={editingAdmission}
                onSubmit={handleUpdate}
                onCancel={() => setEditingAdmission(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* View Admission Dialog */}
        <Dialog open={!!viewingAdmission} onOpenChange={() => setViewingAdmission(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>Admission Details - #{viewingAdmission?.admissionNumber}</span>
              </DialogTitle>
            </DialogHeader>
            {viewingAdmission && (
              <div className="space-y-6">
                {/* Patient Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Patient Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                        <p className="text-lg font-semibold">
                          {viewingAdmission.patient?.firstName} {viewingAdmission.patient?.lastName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Patient Number</Label>
                        <p className="text-lg font-semibold text-blue-600">
                          #{viewingAdmission.patient?.patientNumber}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                        <p>{viewingAdmission.patient?.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p>{viewingAdmission.patient?.email || 'Not provided'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Surgery Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Stethoscope className="h-4 w-4" />
                      <span>Surgery Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Admission Number</Label>
                        <p className="text-lg font-semibold text-blue-600">#{viewingAdmission.admissionNumber}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Surgery Type</Label>
                        <Badge className={getSurgeryTypeColor(viewingAdmission.surgeryType)}>
                          {viewingAdmission.surgeryType}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Surgery Date</Label>
                        <p>{formatDate(viewingAdmission.surgeryDate)} at {formatTime(viewingAdmission.surgeryDate)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Expected Duration</Label>
                        <p>{viewingAdmission.expectedDuration ? `${viewingAdmission.expectedDuration} minutes` : 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                        <Badge className={getStatusColor(viewingAdmission.status)}>
                          {viewingAdmission.status || 'SCHEDULED'}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                        <p>{formatDate(viewingAdmission.createdAt)}</p>
                      </div>
                    </div>

                    {viewingAdmission.preOpInstructions && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium text-muted-foreground">Pre-Operative Instructions</Label>
                        <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm">{viewingAdmission.preOpInstructions}</p>
                        </div>
                      </div>
                    )}

                    {viewingAdmission.notes && (
                      <div className="mt-4">
                        <Label className="text-sm font-medium text-muted-foreground">Additional Notes</Label>
                        <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md">
                          <p className="text-sm">{viewingAdmission.notes}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default IpdAdmissions;