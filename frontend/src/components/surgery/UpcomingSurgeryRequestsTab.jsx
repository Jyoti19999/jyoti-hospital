import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import Loader from "@/components/loader/Loader";
import { useToast } from "@/hooks/use-toast";
import {
  Stethoscope,
  Calendar,
  User,
  Clock,
  FileText,
  AlertTriangle,
  Eye,
  Package,
  DollarSign,
  ChevronRight,
  RefreshCw,
  Building,
  UserCheck,
  MapPin,
  CheckCircle
} from "lucide-react";

// OT Room options
const OT_ROOMS = [
  { value: 'ot1', label: 'OT Room 1', status: 'available' },
  { value: 'ot2', label: 'OT Room 2', status: 'available' },
  { value: 'ot3', label: 'OT Room 3', status: 'occupied' },
  { value: 'ot4', label: 'OT Room 4', status: 'maintenance' }
];

// Mock surgeons data
const SURGEONS = [
  { id: 'dr1', name: 'Dr. Raghunathan', specialization: 'Cataract', available: true },
  { id: 'dr2', name: 'Dr. Priya Sharma', specialization: 'Glaucoma', available: true },
  { id: 'dr3', name: 'Dr. Amit Kumar', specialization: 'Retinal', available: false },
  { id: 'dr4', name: 'Dr. Sunita Patel', specialization: 'Corneal', available: true }
];

/*
========================================
🏥 UPCOMING SURGERY REQUESTS TAB FOR OT ADMIN
========================================

Displays surgery requests that have been partially filled by Receptionist2.
Allows OT Admin to assign surgeon, OT room, and finalize surgery details.
*/

// Mock API functions (replace with actual API calls)
const useUpcomingSurgeryRequests = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState([
    {
      id: 1,
      patient: {
        id: 'p001',
        firstName: 'John',
        lastName: 'Doe',
        patientNumber: 'P001',
        phone: '9876543210',
        age: 65
      },
      ipdAdmission: {
        id: 'ipd_1',
        admissionNumber: 'IPD-001',
        surgeryType: 'CATARACT',
        surgeryDate: '2024-11-15',
        tentativeTime: '09:00',
        surgeryPackage: 'standard',
        iolType: 'monofocal',
        expectedDuration: 60,
        priorityLevel: 'routine'
      },
      receptionist2Details: {
        completedAt: '2024-11-09',
        completedBy: 'Receptionist Sarah',
        preOpInstructions: 'NPO 8 hours before surgery',
        specialInstructions: 'Patient has mild hypertension'
      },
      otAdminStatus: 'pending', // pending, assigned, scheduled
      assignedSurgeon: null,
      assignedOtRoom: null
    },
    {
      id: 2,
      patient: {
        id: 'p002',
        firstName: 'Jane',
        lastName: 'Smith',
        patientNumber: 'P002',
        phone: '8765432109',
        age: 58
      },
      ipdAdmission: {
        id: 'ipd_2',
        admissionNumber: 'IPD-002',
        surgeryType: 'GLAUCOMA',
        surgeryDate: '2024-11-16',
        tentativeTime: '14:00',
        surgeryPackage: 'premium',
        iolType: 'multifocal',
        expectedDuration: 90,
        priorityLevel: 'urgent'
      },
      receptionist2Details: {
        completedAt: '2024-11-08',
        completedBy: 'Receptionist Mike',
        preOpInstructions: 'Stop blood thinners 3 days before',
        specialInstructions: 'Diabetic patient - monitor glucose levels'
      },
      otAdminStatus: 'assigned',
      assignedSurgeon: 'dr2',
      assignedOtRoom: 'ot1'
    }
  ]);

  return { data: requests, isLoading, refetch: () => {} };
};

const useAssignSurgeryDetails = () => {
  const { toast } = useToast();
  
  return {
    mutateAsync: async (data) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Surgery details assigned successfully",
      });
      
      return data;
    },
    isPending: false
  };
};

const RequestCard = ({ request, onAssignDetails }) => {
  const getSurgeryTypeColor = (type) => {
    const colors = {
      CATARACT: 'bg-blue-100 text-blue-800',
      GLAUCOMA: 'bg-green-100 text-green-800',
      RETINAL: 'bg-purple-100 text-purple-800',
      CORNEAL: 'bg-orange-100 text-orange-800',
      OTHER: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.OTHER;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      routine: 'bg-green-100 text-green-800',
      urgent: 'bg-yellow-100 text-yellow-800',
      emergency: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.routine;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-green-100 text-green-800'
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const assignedSurgeon = SURGEONS.find(s => s.id === request.assignedSurgeon);
  const assignedRoom = OT_ROOMS.find(r => r.value === request.assignedOtRoom);

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with patient info and priority */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {request.patient.firstName} {request.patient.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  #{request.patient.patientNumber} • Age {request.patient.age} • {request.patient.phone}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getPriorityColor(request.ipdAdmission.priorityLevel)}>
                {request.ipdAdmission.priorityLevel.toUpperCase()}
              </Badge>
              <Badge className={getStatusColor(request.otAdminStatus)}>
                {request.otAdminStatus === 'pending' ? 'Awaiting Assignment' : 
                 request.otAdminStatus === 'assigned' ? 'Assigned' : 'Scheduled'}
              </Badge>
            </div>
          </div>

          {/* Surgery details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">Surgery Type</Label>
              <Badge className={getSurgeryTypeColor(request.ipdAdmission.surgeryType)} variant="outline">
                <Stethoscope className="h-3 w-3 mr-1" />
                {request.ipdAdmission.surgeryType}
              </Badge>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Scheduled Date</Label>
              <p className="font-semibold flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(request.ipdAdmission.surgeryDate)}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Time</Label>
              <p className="font-semibold flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {request.ipdAdmission.tentativeTime}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Duration</Label>
              <p className="font-semibold">{request.ipdAdmission.expectedDuration} mins</p>
            </div>
          </div>

          {/* Assignment status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <Label className="text-xs text-muted-foreground">Assigned Surgeon</Label>
              {assignedSurgeon ? (
                <div className="flex items-center mt-1">
                  <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                  <span className="font-medium">{assignedSurgeon.name}</span>
                </div>
              ) : (
                <div className="flex items-center mt-1 text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>Not assigned</span>
                </div>
              )}
            </div>
            <div className="p-3 border rounded-lg">
              <Label className="text-xs text-muted-foreground">OT Room</Label>
              {assignedRoom ? (
                <div className="flex items-center mt-1">
                  <Building className="h-4 w-4 mr-2 text-green-600" />
                  <span className="font-medium">{assignedRoom.label}</span>
                </div>
              ) : (
                <div className="flex items-center mt-1 text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>Not assigned</span>
                </div>
              )}
            </div>
          </div>

          {/* Receptionist details */}
          <div className="text-xs text-muted-foreground">
            Processed by {request.receptionist2Details.completedBy} on {formatDate(request.receptionist2Details.completedAt)}
          </div>

          {/* Action button */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              IPD #{request.ipdAdmission.admissionNumber}
            </div>
            <Button
              onClick={() => onAssignDetails(request)}
              variant={request.otAdminStatus === 'pending' ? "default" : "outline"}
              size="sm"
            >
              {request.otAdminStatus === 'pending' ? (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assign Details
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  View/Edit Assignment
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AssignmentDialog = ({ request, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    surgeonId: request?.assignedSurgeon || '',
    otRoom: request?.assignedOtRoom || '',
    finalSurgeryDate: request?.ipdAdmission?.surgeryDate ? new Date(request.ipdAdmission.surgeryDate) : null,
    finalTime: request?.ipdAdmission?.tentativeTime || '',
    anesthesiaType: '',
    assistantStaff: '',
    equipmentNeeds: '',
    otAdminNotes: ''
  });

  const updateMutation = useAssignSurgeryDetails();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.surgeonId || !formData.otRoom) {
      return;
    }

    const submitData = {
      requestId: request.id,
      ipdAdmissionId: request.ipdAdmission.id,
      ...formData,
      finalSurgeryDate: formData.finalSurgeryDate?.toISOString()
    };

    try {
      await updateMutation.mutateAsync(submitData);
      onClose();
    } catch (error) {
    }
  };

  const availableSurgeons = SURGEONS.filter(s => s.available);
  const availableRooms = OT_ROOMS.filter(r => r.status === 'available');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Assign Surgery Details - {request?.patient?.firstName} {request?.patient?.lastName}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Summary */}
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Patient</Label>
                  <p className="font-semibold">{request?.patient?.firstName} {request?.patient?.lastName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Surgery Type</Label>
                  <p className="font-semibold">{request?.ipdAdmission?.surgeryType}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Package</Label>
                  <p className="font-semibold capitalize">{request?.ipdAdmission?.surgeryPackage}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">IOL Type</Label>
                  <p className="font-semibold capitalize">{request?.ipdAdmission?.iolType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surgeonId">Assign Surgeon *</Label>
              <Select 
                value={formData.surgeonId} 
                onValueChange={(value) => handleInputChange('surgeonId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select surgeon" />
                </SelectTrigger>
                <SelectContent>
                  {availableSurgeons.map((surgeon) => (
                    <SelectItem key={surgeon.id} value={surgeon.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{surgeon.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {surgeon.specialization}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otRoom">Assign OT Room *</Label>
              <Select 
                value={formData.otRoom} 
                onValueChange={(value) => handleInputChange('otRoom', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select OT room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.value} value={room.value}>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        {room.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Final Surgery Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="finalSurgeryDate">Final Surgery Date</Label>
              <DatePicker
                selected={formData.finalSurgeryDate}
                onSelect={(date) => handleInputChange('finalSurgeryDate', date)}
                placeholderText="Confirm surgery date"
                className="w-full"
                minDate={new Date()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalTime">Final Time</Label>
              <Input
                id="finalTime"
                type="time"
                value={formData.finalTime}
                onChange={(e) => handleInputChange('finalTime', e.target.value)}
              />
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="anesthesiaType">Anesthesia Type</Label>
              <Select 
                value={formData.anesthesiaType} 
                onValueChange={(value) => handleInputChange('anesthesiaType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select anesthesia type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Local Anesthesia</SelectItem>
                  <SelectItem value="topical">Topical Anesthesia</SelectItem>
                  <SelectItem value="general">General Anesthesia</SelectItem>
                  <SelectItem value="sedation">Conscious Sedation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assistantStaff">Assistant Staff</Label>
              <Input
                id="assistantStaff"
                value={formData.assistantStaff}
                onChange={(e) => handleInputChange('assistantStaff', e.target.value)}
                placeholder="Assistant nurse/technician"
              />
            </div>
          </div>

          {/* Equipment & Notes */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipmentNeeds">Special Equipment Needs</Label>
              <Textarea
                id="equipmentNeeds"
                value={formData.equipmentNeeds}
                onChange={(e) => handleInputChange('equipmentNeeds', e.target.value)}
                placeholder="List any special equipment needed..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otAdminNotes">OT Admin Notes</Label>
              <Textarea
                id="otAdminNotes"
                value={formData.otAdminNotes}
                onChange={(e) => handleInputChange('otAdminNotes', e.target.value)}
                placeholder="Internal notes for surgery preparation..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Assign & Schedule
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UpcomingSurgeryRequestsTab = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: requests, isLoading, refetch } = useUpcomingSurgeryRequests();

  const handleAssignDetails = (request) => {
    setSelectedRequest(request);
    setShowAssignmentDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setShowAssignmentDialog(false);
    refetch();
  };

  const filteredRequests = requests?.filter(request => {
    if (statusFilter === 'all') return true;
    return request.otAdminStatus === statusFilter;
  }) || [];

  const pendingCount = requests?.filter(r => r.otAdminStatus === 'pending').length || 0;
  const assignedCount = requests?.filter(r => r.otAdminStatus === 'assigned').length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upcoming Surgery Requests</h2>
          <p className="text-muted-foreground">
            Surgery requests from Receptionist2 awaiting OT assignment
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-yellow-50">
            {pendingCount} pending
          </Badge>
          <Badge variant="outline" className="bg-blue-50">
            {assignedCount} assigned
          </Badge>
          <Button variant="outline" onClick={refetch} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <Label>Filter by status:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending Assignment</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      {!filteredRequests || filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Surgery Requests</h3>
            <p className="text-muted-foreground">
              {statusFilter === 'all' 
                ? 'No surgery requests from Receptionist2 yet'
                : `No ${statusFilter} surgery requests`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onAssignDetails={handleAssignDetails}
            />
          ))}
        </div>
      )}

      {/* Assignment Dialog */}
      <AssignmentDialog
        request={selectedRequest}
        isOpen={showAssignmentDialog}
        onClose={handleCloseDialog}
        onSave={() => {}}
      />
    </div>
  );
};

export default UpcomingSurgeryRequestsTab;