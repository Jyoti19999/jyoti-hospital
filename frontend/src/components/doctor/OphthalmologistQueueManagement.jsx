// src/components/doctor/OphthalmologistQueueManagement.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocketConnectionStatus } from '@/hooks/useQueueSocket';
import Receptionist2DoctorQueue from '@/components/receptionist2/Receptionist2DoctorQueue';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Clock,
  Users,
  ArrowUpDown,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  CheckCircle,
  Play,
  GripVertical,
  UserPlus,
  Eye,
  Flag,
  FlagOff,
  Stethoscope,
  AlertTriangle,
  User,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCw,
  Mail,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isQueueManagementNote } from '@/utils/queueUtils';
import { socket } from '@/lib/socket';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ophthalmologistQueueService from '../../services/ophthalmologistQueueService';
import staffService from '../../services/staffService';
import patientService from '../../services/patientService';

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

// Patient Details Modal Component
const PatientDetailsModal = ({ patient, isOpen, onClose }) => {
  if (!patient || !isOpen) {
    return null;
  }


  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const safeRender = (value, fallback = 'Not available') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  try {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Patient Details - {safeRender(
                patient.patient?.fullName ||
                (patient.patient?.firstName && patient.patient?.lastName ? `${patient.patient.firstName} ${patient.patient.lastName}` :
                  patient.firstName && patient.lastName ? `${patient.firstName} ${patient.lastName}` :
                    patient.fullName),
                'Unknown Patient'
              )}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span>Patient Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Patient Number</Label>
                    <p className="text-lg font-bold text-blue-600">#{patient.patient?.patientNumber || patient.patientNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                    <p className="text-lg font-semibold">
                      {patient.patient?.fullName ||
                        (patient.patient?.firstName && patient.patient?.lastName ? `${patient.patient.firstName} ${patient.patient.lastName}` :
                          patient.firstName && patient.lastName ? `${patient.firstName} ${patient.lastName}` :
                            patient.fullName || 'Not provided')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                    <p>{formatDate(patient.patient?.dateOfBirth || patient.dateOfBirth) || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Gender</Label>
                    <p className="capitalize">{patient.patient?.gender || patient.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                    <p className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span>{patient.patient?.phone || patient.phone || 'Not provided'}</span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span>{patient.patient?.email || patient.email || 'Not provided'}</span>
                    </p>
                  </div>
                </div>

                {(patient.patient?.address || patient.address) && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-600">Address</Label>
                    <p className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-red-600 mt-1" />
                      <span>
                        {typeof (patient.patient?.address || patient.address) === 'string'
                          ? (patient.patient?.address || patient.address)
                          : typeof (patient.patient?.address || patient.address) === 'object'
                            ? Object.values(patient.patient?.address || patient.address).filter(Boolean).join(', ')
                            : 'Address information available'
                        }
                      </span>
                    </p>
                  </div>
                )}

                {(patient.patient?.emergencyContacts || patient.emergencyContacts) &&
                  (patient.patient?.emergencyContacts || patient.emergencyContacts).length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-600">Emergency Contacts</Label>
                      <div className="space-y-2 mt-2">
                        {(patient.patient?.emergencyContacts || patient.emergencyContacts).map((contact, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded">
                            <p className="font-medium">{contact?.name || 'Name not provided'}</p>
                            <p className="text-sm text-gray-600">
                              {contact?.phone || 'No phone'} - {contact?.relation || contact?.relationship || 'Unknown relation'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {(patient.patient?.allergies || patient.allergies) &&
                  (patient.patient?.allergies || patient.allergies).length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium text-gray-600">Known Allergies</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(patient.patient?.allergies || patient.allergies).map((allergy, index) => (
                          <Badge key={index} variant="destructive" className="bg-red-100 text-red-800">
                            {typeof allergy === 'object' ? (allergy.name || allergy.allergen || JSON.stringify(allergy)) : allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Appointment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span>Appointment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Token Number</Label>
                    <p className="text-lg font-bold text-green-600">
                      {patient.appointment?.tokenNumber || patient.visitData?.appointment?.tokenNumber || patient.token || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Appointment Time</Label>
                    <p>{patient.appointment?.appointmentTime || patient.visitData?.appointment?.appointmentTime || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Appointment Date</Label>
                    <p>
                      {patient.appointment?.appointmentDate
                        ? formatDate(patient.appointment.appointmentDate)
                        : patient.visitData?.appointment?.appointmentDate
                          ? formatDate(patient.visitData.appointment.appointmentDate)
                          : patient.visitDate
                            ? formatDate(patient.visitDate)
                            : 'Not provided'
                      }
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Purpose</Label>
                    <p>{patient.appointment?.purpose || patient.visitData?.appointment?.purpose || patient.visitType || 'General consultation'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Examination Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Stethoscope className="h-4 w-4 text-purple-600" />
                  <span>Optometrist Examination</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patient.examinationData || patient.optometrist ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Examined By</Label>
                          <p className="font-medium">{patient.optometrist?.name || 'Not available'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Examination Date</Label>
                          <p>{formatDateTime(patient.completedAt)}</p>
                        </div>
                      </div>

                      {patient.examinationData?.visualAcuity && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Visual Acuity</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="p-3 bg-blue-50 rounded">
                              <p className="text-sm font-medium">Right Eye (OD)</p>
                              <p>
                                {typeof patient.examinationData?.visualAcuity === 'object'
                                  ? (patient.examinationData.visualAcuity.rightEye || patient.examinationData.visualAcuity.distance?.rightEye || 'Not recorded')
                                  : (patient.examinationData?.visualAcuity || 'Not recorded')
                                }
                              </p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded">
                              <p className="text-sm font-medium">Left Eye (OS)</p>
                              <p>
                                {typeof patient.examinationData?.visualAcuity === 'object'
                                  ? (patient.examinationData.visualAcuity.leftEye || patient.examinationData.visualAcuity.distance?.leftEye || 'Not recorded')
                                  : (patient.examinationData?.visualAcuity || 'Not recorded')
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {patient.examinationData?.refraction && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Refraction</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="p-3 bg-green-50 rounded">
                              <p className="text-sm font-medium">Right Eye (OD)</p>
                              <p>Sphere: {patient.examinationData?.refraction?.sphere?.rightEye || 'N/A'}</p>
                              <p>Cylinder: {patient.examinationData?.refraction?.cylinder?.rightEye || 'N/A'}</p>
                              <p>Axis: {patient.examinationData?.refraction?.axis?.rightEye || 'N/A'}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded">
                              <p className="text-sm font-medium">Left Eye (OS)</p>
                              <p>Sphere: {patient.examinationData?.refraction?.sphere?.leftEye || 'N/A'}</p>
                              <p>Cylinder: {patient.examinationData?.refraction?.cylinder?.leftEye || 'N/A'}</p>
                              <p>Axis: {patient.examinationData?.refraction?.axis?.leftEye || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {patient.examinationData?.tonometry && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Intraocular Pressure (IOP)</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="p-3 bg-yellow-50 rounded">
                              <p className="text-sm font-medium">Right Eye (OD)</p>
                              <p>{patient.examinationData?.tonometry?.iop?.rightEye || 'N/A'} mmHg</p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded">
                              <p className="text-sm font-medium">Left Eye (OS)</p>
                              <p>{patient.examinationData?.tonometry?.iop?.leftEye || 'N/A'} mmHg</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {patient.preliminaryDiagnosis && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Preliminary Diagnosis</Label>
                          <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-400">
                            <p className="font-medium text-purple-800">{patient.preliminaryDiagnosis || 'Not recorded'}</p>
                          </div>
                        </div>
                      )}

                      {patient.clinicalNotes && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Clinical Notes</Label>
                          <div className="p-3 bg-gray-50 rounded">
                            <p>{patient.clinicalNotes || 'No notes recorded'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No Optometrist Examination</p>
                      <p className="text-sm text-gray-500 mt-2">
                        This patient was directly routed to ophthalmology (emergency case / paratially completed patients)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Visit Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span>Visit Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Visit Number</Label>
                    <p className="font-medium">#{patient.visit?.id || patient.visitData?.visitNumber || patient.visitData?.id || 'Not assigned'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Visit Type</Label>
                    <p className="capitalize">{patient.visit?.visitType || patient.visitType || patient.visitData?.visitType || 'OPD'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Current Status</Label>
                    <Badge className={
                      (patient.status || patient.visit?.status) === 'WAITING' ? 'bg-yellow-100 text-yellow-800' :
                        (patient.status || patient.visit?.status) === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          (patient.status || patient.visit?.status) === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                    }>
                      {(patient.status || patient.visit?.status)?.replace('_', ' ') || patient.visitData?.status?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Check-in Time</Label>
                    <p>{formatDateTime(patient.visit?.checkedInAt) || formatDateTime(patient.visitData?.checkedInAt) || formatDateTime(patient.visitDate) || 'Not available'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Priority Level</Label>
                    <Badge className={
                      (patient.priorityLabel || patient.priority) === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                        (patient.priorityLabel || patient.priority) === 'PRIORITY' ? 'bg-orange-100 text-orange-800' :
                          (patient.priorityLabel || patient.priority) === 'ROUTINE' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                    }>
                      {patient.priorityLabel || patient.priority || patient.visitData?.priorityLevel || 'Routine'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  } catch (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error Loading Patient Details</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-red-600">There was an error displaying the patient details. Please try again.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
};

// Doctor Assignment Select Component
const DoctorAssignmentSelect = ({ patient, doctors, onAssignDoctor, isLoading, doctorsLoading }) => {
  const currentDoctorId = patient.assignedStaff?.id;

  const handleValueChange = (doctorId) => {
    if (doctorId === currentDoctorId) return; // No change
    if (doctorId === "unassigned") return; // Don't assign if "unassigned" is selected
    onAssignDoctor(patient.queueEntryId, doctorId);
  };

  // Helper function to get doctor display name
  const getDoctorDisplayName = (doctor) => {
    if (doctor.firstName && doctor.lastName) {
      return `${doctor.firstName} ${doctor.lastName}`;
    }
    if (doctor.fullName) {
      return doctor.fullName;
    }
    if (doctor.name) {
      return doctor.name;
    }
    return doctor.id || 'Unknown Doctor';
  };

  const getCurrentDoctorName = () => {
    if (!currentDoctorId || !doctors) return null;
    const doctor = doctors.find(doc => doc.id === currentDoctorId);
    return doctor ? getDoctorDisplayName(doctor) : 'Unknown Doctor';
  };

  // Clean display name (remove Dr. prefix if it exists)
  const cleanDisplayName = (name) => {
    if (!name) return '';
    return name.replace(/^Dr\.?\s*/i, '').trim();
  };

  if (doctorsLoading) {
    return (
      <div className="flex items-center justify-center p-1 text-xs text-gray-500 bg-gray-50 rounded border h-7">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-1"></div>
        Loading...
      </div>
    );
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div className="flex items-center justify-center p-1 text-xs text-gray-500 bg-gray-50 rounded border h-7">
        <UserPlus className="w-3 h-3 mr-1" />
        No doctors
      </div>
    );
  }

  return (
    <Select
      value={currentDoctorId || "unassigned"}
      onValueChange={handleValueChange}
      disabled={isLoading}
    >
      <SelectTrigger className="w-full h-7 text-xs px-2" disabled={isLoading}>
        <SelectValue placeholder="Select">
          {isLoading ? (
            <span className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
              Assigning...
            </span>
          ) : currentDoctorId ? (
            <span className="flex items-center">
              <UserPlus className="w-3 h-3 mr-1 text-green-600" />
              <span className="truncate">
                Dr. {cleanDisplayName(getCurrentDoctorName())?.split(' ').pop() || 'Unknown'}
              </span>
            </span>
          ) : (
            <span className="flex items-center text-gray-500">
              <UserPlus className="w-3 h-3 mr-1" />
              <span className="truncate">Select</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {!currentDoctorId && (
          <SelectItem value="unassigned">
            <span className="flex items-center text-gray-500">
              <UserPlus className="w-3 h-3 mr-2" />
              No Doctor Assigned
            </span>
          </SelectItem>
        )}
        {doctors.map((doctor) => (
          <SelectItem key={doctor.id} value={doctor.id}>
            <div className="flex items-center">
              <UserPlus className="w-3 h-3 mr-2" />
              <div className="flex flex-col">
                <span className="font-medium">
                  Dr. {cleanDisplayName(getDoctorDisplayName(doctor))}
                </span>
                {(doctor.department || doctor.specialization) && (
                  <span className="text-xs text-gray-500">
                    {doctor.specialization || doctor.department}
                  </span>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Doctor Queue Sortable Item Component (for doctor-specific tabs)
const DoctorQueueSortableItem = ({ patient, index, onViewDetails, onToggleReview, isDraggable = true }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: patient.queueEntryId,
    disabled: !isDraggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isNextInLine = !isDraggable && patient.status === 'WAITING';
  
  // Check if patient is reviewed (marked as present)
  const isReviewed = patient.receptionist2Review?.reviewed || false;
  const isFromOptometrist = patient.sourceInfo?.cameFromOptometrist || false;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`transition-all duration-200 ${isDragging ? 'scale-105 z-50' : ''}`}
    >
      <Card
        className={`relative transition-all duration-200 hover:shadow-md ${
          isDragging ? 'shadow-lg scale-105 z-50 border-blue-400' : 
          isReviewed ? 'bg-blue-50 border-blue-200' :
          isNextInLine ? 'bg-blue-50 border-blue-200' : 
          'bg-white border hover:bg-blue-25'
        }`}
      >
        <CardContent className="p-3">
          {/* Next in Line Badge - Top Right Corner */}
          {isNextInLine && !isReviewed && (
            <div className="absolute -top-2 right-2 z-10">
              <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-2 py-1 text-xs shadow-md">
                <AlertCircle className="h-3 w-3 mr-1 inline" />
                Next in Line
              </Badge>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Drag Handle - only for draggable items */}
              {isDraggable && (
                <div 
                  {...attributes} 
                  {...listeners}
                  className="flex flex-col items-center cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500">Drag</span>
                </div>
              )}
              
              {/* Queue Position */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-700">
                    {patient.doctorQueuePosition}
                  </span>
                </div>
                <span className="text-xs text-gray-500">My #{patient.doctorQueuePosition}</span>
              </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-bold text-gray-900 text-lg truncate">
                  {patient.patient.fullName}
                </h4>
                <Badge variant="outline" className="text-xs font-semibold border-gray-300">
                  #{patient.patient.patientNumber}
                </Badge>
                {patient.priorityLabel && (
                  <Badge className={
                    patient.priorityLabel === 'EMERGENCY' ? 'bg-red-500 text-white shadow-md' :
                    patient.priorityLabel === 'PRIORITY' ? 'bg-orange-500 text-white shadow-md' :
                    patient.priorityLabel === 'REFERRAL' ? 'bg-purple-500 text-white shadow-md' :
                    'bg-blue-500 text-white shadow-md'
                  }>
                    {patient.priorityLabel}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                {patient.appointment && (
                  <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                    <Calendar className="w-4 h-4 mr-1 text-blue-600" />
                    <span className="font-medium text-blue-700">Token: {patient.appointment.tokenNumber}</span>
                  </div>
                )}
                <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                  <Phone className="w-4 h-4 mr-1 text-gray-600" />
                  <span className="font-medium">{patient.patient.phone}</span>
                </div>
                
                {/* Present Status Inline Badge */}
                {isReviewed && (
                  <div className="flex items-center bg-green-100 px-2 py-1 rounded-md border border-green-300">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                    <span className="font-semibold text-green-700 text-xs">
                      Present {patient.receptionist2Review?.reviewedAt && 
                        `at ${new Date(patient.receptionist2Review.reviewedAt).toLocaleTimeString()}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Badge and Actions */}
          <div className="flex items-center space-x-3">
            <Badge className={`px-3 py-1.5 font-semibold shadow-sm ${
              patient.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
              patient.status === 'CALLED' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
              patient.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800 border border-green-300' :
              'bg-gray-100 text-gray-800 border border-gray-300'
            }`}>
              {patient.status.replace('_', ' ')}
            </Badge>
            
            {/* Compact Mark Present/Absent Button with Text */}
            {((isFromOptometrist && patient.examinationId) || patient.queueEntryId) && onToggleReview && (
              <Button
                size="sm"
                variant="outline"
                className={`h-8 font-medium ${
                  isReviewed
                    ? "bg-red-50 hover:bg-red-100 border-red-300 text-red-600"
                    : "bg-green-50 hover:bg-green-100 border-green-300 text-green-600"
                }`}
                onClick={() => onToggleReview(patient)}
              >
                {isReviewed ? (
                  <>
                    <FlagOff className="h-3.5 w-3.5 mr-1.5" />
                    Mark Absent
                  </>
                ) : (
                  <>
                    <Flag className="h-3.5 w-3.5 mr-1.5" />
                    Mark Present
                  </>
                )}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onViewDetails(patient)}
              className="shadow-sm hover:shadow-md transition-shadow border-2"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

// Sortable Queue Item Component
const SortableQueueItem = ({ patient, index, onViewDetails, onToggleReview, loadingPatientDetails, isDraggable = true, doctors, onAssignDoctor, isAssigningDoctor, doctorsLoading }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: patient.queueEntryId,
    disabled: !isDraggable // Disable dragging for non-draggable items
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'WAITING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'CALLED':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'AWAITING_DOCTOR':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'WITH_DOCTOR':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'WAITING':
      case 'AWAITING_DOCTOR':
        return <Clock className="w-4 h-4" />;
      case 'CALLED':
        return <Phone className="w-4 h-4" />;
      case 'IN_PROGRESS':
      case 'WITH_DOCTOR':
        return <Play className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'EMERGENCY':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'URGENT':
      case 'PRIORITY':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'HIGH':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'AWAITING_DOCTOR': { color: 'bg-yellow-100 text-yellow-800', label: 'Awaiting Doctor' },
      'WITH_DOCTOR': { color: 'bg-blue-100 text-blue-800', label: 'With Doctor' },
      'COMPLETED': { color: 'bg-green-100 text-green-800', label: 'Completed' },
      'CHECKED_IN': { color: 'bg-gray-100 text-gray-800', label: 'Checked In' },
      'WAITING': { color: 'bg-yellow-100 text-yellow-800', label: 'Waiting' },
      'CALLED': { color: 'bg-blue-100 text-blue-800', label: 'Called' },
      'IN_PROGRESS': { color: 'bg-green-100 text-green-800', label: 'In Progress' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'EMERGENCY': { color: 'bg-red-100 text-red-800', label: 'Emergency' },
      'PRIORITY': { color: 'bg-orange-100 text-orange-800', label: 'Priority' },
      'ROUTINE': { color: 'bg-blue-100 text-blue-800', label: 'Routine' },
      'URGENT': { color: 'bg-orange-100 text-orange-800', label: 'Urgent' },
      'HIGH': { color: 'bg-yellow-100 text-yellow-800', label: 'High' },
      'REFERRAL': { color: 'bg-purple-100 text-purple-800', label: 'Referral' }
    };

    // Normalize to uppercase and trim
    const normalizedPriority = priority ? String(priority).toUpperCase().trim() : 'ROUTINE';
    const config = priorityConfig[normalizedPriority] || { color: 'bg-blue-100 text-blue-800', label: 'Routine' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Calculate age if dateOfBirth is available
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

  const isReviewed = patient.receptionist2Review?.reviewed;
  const isFromOptometrist = patient.sourceInfo?.cameFromOptometrist;
  const isEmergencyDirect = patient.sourceInfo?.isEmergencyDirect;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-all duration-200 ${isDragging ? 'scale-105' : ''}`}
    >
      <Card className={`${isReviewed ? 'border-green-300 bg-green-50/50' : 'border-gray-200'
        } ${isDragging ? 'ring-2 ring-blue-400 shadow-xl' : 'shadow-md hover:shadow-lg'} transition-all`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* Drag Handle - only show for draggable waiting patients */}
              {isDraggable && patient.status === 'WAITING' && (
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
              )}

              {/* Avatar with review indicator */}
              <div className="relative">
                <Avatar size="md" />
                {isReviewed && (
                  <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 shadow-md">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              {/* Patient Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{patient.patient?.fullName || patient.fullName || patient.name}</h3>
                  {isReviewed && (
                    <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                      <Flag className="h-3 w-3 mr-1" />
                      Present
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-600 mt-1">
                  Patient #{patient.patient?.patientNumber || patient.patientNumber} • Token: {patient.appointment?.tokenNumber || patient.token || 'N/A'}
                </p>

                <div className="flex items-center space-x-2 text-xs mt-2">
                  {isFromOptometrist ? (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Stethoscope className="h-3 w-3 mr-1" />
                      From Optometrist
                    </Badge>
                  ) : isEmergencyDirect ? (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Emergency Direct
                    </Badge>
                  ) : null}
                  <span className="text-gray-500">
                    • Queue #{patient.queueNumber}
                  </span>
                  <span className="text-gray-500">
                    • {calculateAge(patient.patient?.dateOfBirth)}Y • {patient.patient?.gender || patient.gender}
                  </span>
                </div>

                {isReviewed && patient.receptionist2Review?.reviewedAt && (
                  <p className="text-xs text-green-600 mt-2 font-medium">
                    Present: {new Date(patient.receptionist2Review.reviewedAt).toLocaleString()}
                  </p>
                )}

                {patient.notes && !isQueueManagementNote(patient.notes) && (
                  <p className="text-xs text-gray-600 mt-2 italic bg-gray-50 p-2 rounded">{patient.notes}</p>
                )}
              </div>
            </div>

            {/* Status, Priority and Actions */}
            <div className="flex items-center space-x-3">{getStatusBadge(patient.status || patient.visit?.status)}

              {patient.priorityLabel && (
                getPriorityBadge(patient.priorityLabel)
              )}

              {/* Review Toggle Button */}
              {((isFromOptometrist && patient.examinationId) || patient.queueEntryId) ? (
                <Button
                  size="sm"
                  variant="outline"
                  className={isReviewed
                    ? "hover:bg-red-50 border-red-300 text-red-600 font-medium"
                    : "hover:bg-green-50 border-green-300 text-green-600 font-medium"
                  }
                  onClick={() => onToggleReview(patient)}
                >
                  {isReviewed ? (
                    <>
                      <FlagOff className="h-4 w-4 mr-1" />
                      Mark Absent
                    </>
                  ) : (
                    <>
                      <Flag className="h-4 w-4 mr-1" />
                      Mark Present
                    </>
                  )}
                </Button>
              ) : (
                <Badge variant="outline" className="text-xs text-gray-500">
                  No Review Available
                </Badge>
              )}

              {/* View Details Button */}
              <Button
                size="sm"
                variant="outline"
                className="hover:bg-blue-50 border-blue-200"
                onClick={() => onViewDetails(patient)}
                disabled={loadingPatientDetails}
              >
                {loadingPatientDetails ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1"></div>
                ) : (
                  <Eye className="h-4 w-4 mr-1" />
                )}
                View Details
              </Button>

              {/* Doctor Assignment Dropdown - Only for waiting patients */}
              {patient.status === 'WAITING' && doctors && onAssignDoctor && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600 whitespace-nowrap font-medium">
                    {isAssigningDoctor ? 'Assigning:' : 'Assign:'}
                  </span>
                  <div className="w-32">
                    <DoctorAssignmentSelect
                      patient={patient}
                      doctors={doctors}
                      onAssignDoctor={onAssignDoctor}
                      isLoading={isAssigningDoctor}
                      doctorsLoading={doctorsLoading}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      {patient.examinationSummary?.preliminaryDiagnosis && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="text-sm text-blue-800">
            <strong>Diagnosis:</strong> {patient.examinationSummary.preliminaryDiagnosis}
          </p>
        </div>
      )}

      {patient.receptionist2Review?.notes && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
          <p className="text-sm text-green-800">
            <strong>Receptionist2 Notes:</strong> {patient.receptionist2Review.notes}
          </p>
        </div>
      )}

      {patient.assignedStaff && (
        <div className="mt-3 p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">
            Assigned to: <span className="font-medium">{patient.assignedStaff.name}</span>
          </p>
        </div>
      )}
    </div>
  );
};

// Main Ophthalmologist Queue Management Component
const OphthalmologistQueueManagement = ({ hideHeader = false }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [searchInput, setSearchInput] = useState(''); // Client-side search only
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetailsOpen, setPatientDetailsOpen] = useState(false);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
  const [fcfsDialogOpen, setFcfsDialogOpen] = useState(false);
  const [selectedDoctorForFcfs, setSelectedDoctorForFcfs] = useState(null);
  const [showStatsCards, setShowStatsCards] = useState(true);
  const queryClient = useQueryClient();
  const isSocketConnected = useSocketConnectionStatus();

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { user } = useAuth();

  // Fetch ophthalmologist queue with filters
  const {
    data: queueData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['ophthalmologistQueue', selectedDate],
    queryFn: () => ophthalmologistQueueService.getOphthalmologistQueue({
      date: selectedDate
    }),
    staleTime: 30000, // Data stays fresh for 30 seconds
    // No polling - using WebSocket for real-time updates
  });

  // Fetch doctor-specific queues
  const {
    data: doctorQueuesData,
    isLoading: doctorQueuesLoading,
    error: doctorQueuesError,
    refetch: refetchDoctorQueues
  } = useQuery({
    queryKey: ['doctorSpecificQueues', selectedDate],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/patients/ophthalmology-queue/doctor-specific?date=${selectedDate}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch doctor-specific queues');
      }
      const result = await response.json();
      return result.data;
    },
    staleTime: 30000, // Data stays fresh for 30 seconds
    // No polling - using WebSocket for real-time updates
  });

  // WebSocket real-time updates
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
      return;
    }


    // Join ophthalmologist queue room for general updates (ALL users)
    socket.emit('queue:join-ophthalmologist');

    // If user is a doctor, also join their personal room
    if (user?.id && (user?.staffType === 'doctor' || user?.staffType === 'ophthalmologist')) {
      socket.emit('queue:join-doctor', user.id);
    }

    // Confirm connection
    socket.on('queue:joined', (data) => {
    });

    // Listen for queue updates
    const handleQueueUpdate = (data) => {
      queryClient.invalidateQueries({ queryKey: ['ophthalmologistQueue'] });
      queryClient.invalidateQueries({ queryKey: ['doctorSpecificQueues'] });
      queryClient.refetchQueries({ queryKey: ['doctorSpecificQueues'] });
      refetch();
      refetchDoctorQueues();
    };

    // Listen for queue reordered events
    const handleQueueReordered = (data) => {
      toast.info('Queue updated in real-time');
      queryClient.invalidateQueries({ queryKey: ['ophthalmologistQueue'] });
      queryClient.invalidateQueries({ queryKey: ['doctorSpecificQueues'] });
      queryClient.refetchQueries({ queryKey: ['doctorSpecificQueues'] });
      refetch();
      refetchDoctorQueues();
    };

    // Listen for patient assigned
    const handlePatientAssigned = (data) => {
      toast.success('Patient assignment updated!');
      queryClient.invalidateQueries({ queryKey: ['ophthalmologistQueue'] });
      queryClient.invalidateQueries({ queryKey: ['doctorSpecificQueues'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-assigned-queue'] });
      queryClient.refetchQueries({ queryKey: ['doctorSpecificQueues'] });
      queryClient.refetchQueries({ queryKey: ['doctor-assigned-queue'] });
      refetch();
      refetchDoctorQueues();
    };

    socket.on('queue:updated', handleQueueUpdate);
    socket.on('queue:reordered', handleQueueReordered);
    socket.on('queue:patient-assigned', handlePatientAssigned);


    return () => {
      socket.off('queue:joined');
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('queue:reordered', handleQueueReordered);
      socket.off('queue:patient-assigned', handlePatientAssigned);
    };
  }, [socket.connected, user?.id, user?.staffType, queryClient, refetch, refetchDoctorQueues]);

  // Comprehensive reorder queue mutation
  const comprehensiveReorderMutation = useMutation({
    mutationFn: ({ draggedPatientId, targetPosition, reason }) =>
      ophthalmologistQueueService.reorderQueueComprehensive(draggedPatientId, targetPosition, reason),
    onSuccess: (data) => {
      toast.success(`Queue reordered successfully! ${data.totalUpdates} patients updated.`);
      queryClient.invalidateQueries(['ophthalmologistQueue']);
      queryClient.invalidateQueries(['doctorSpecificQueues']);

      // Show detailed feedback about what happened
      if (data.shiftedPatients && data.shiftedPatients.length > 0) {
        setTimeout(() => {
          toast.info(`${data.shiftedPatients.length} patients were automatically shifted to maintain proper queue order.`);
        }, 1000);
      }
    },
    onError: (error) => {
      toast.error(`Failed to reorder queue: ${error.message}`);
      // Refetch to restore original order
      refetch();
    },
  });

  // Doctor-specific queue reorder mutation
  const doctorQueueReorderMutation = useMutation({
    mutationFn: ({ doctorId, reorderedPatients }) => {
      return ophthalmologistQueueService.reorderDoctorQueue(reorderedPatients, doctorId);
    },
    onSuccess: (data) => {
      toast.success(`Doctor queue reordered successfully!`);
      queryClient.invalidateQueries(['doctorSpecificQueues']);
      queryClient.invalidateQueries(['ophthalmologistQueue']);
    },
    onError: (error) => {
      toast.error(`Failed to reorder doctor queue: ${error.message}`);
      queryClient.invalidateQueries(['doctorSpecificQueues']);
    },
  });

  // Toggle patient review status mutation
  const toggleReviewMutation = useMutation({
    mutationFn: ({ patient, notes = '' }) => {

      if (patient.queueEntryId) {
        return fetch(`${import.meta.env.VITE_API_URL}/receptionist2/patients/ophthalmology-queue/${patient.queueEntryId}/toggle-review`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes })
        }).then(res => {
          if (!res.ok) {
            return res.text().then(text => {
              throw new Error(`HTTP ${res.status}: ${text}`);
            });
          }
          return res.json();
        });
      }
      return Promise.reject(new Error('Invalid patient data - missing queueEntryId'));
    },
    onMutate: async ({ patient }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(['doctorSpecificQueues']);
      
      // Snapshot the previous value
      const previousQueues = queryClient.getQueryData(['doctorSpecificQueues']);
      
      // Determine what the new status will be (toggle current status)
      const currentReviewed = patient.receptionist2Review?.reviewed || false;
      const willBeMarked = !currentReviewed;
      
      // Optimistically update to the new value
      queryClient.setQueryData(['doctorSpecificQueues'], (old) => {
        if (!old?.data?.doctorQueues) return old;
        
        return {
          ...old,
          data: {
            ...old.data,
            doctorQueues: old.data.doctorQueues.map(queue => ({
              ...queue,
              patients: queue.patients.map(p => 
                p.queueEntryId === patient.queueEntryId
                  ? {
                      ...p,
                      receptionist2Review: {
                        ...p.receptionist2Review,
                        reviewed: willBeMarked,
                        reviewedAt: willBeMarked ? new Date().toISOString() : null
                      }
                    }
                  : p
              )
            }))
          }
        };
      });
      
      // Return context with the snapshot and what the new status will be
      return { previousQueues, willBeMarked };
    },
    onSuccess: (data, variables, context) => {
      // Show appropriate success message based on the action taken
      const isNowMarked = context?.willBeMarked;

      if (isNowMarked) {
        toast.success('Marked as present successfully');
      } else {
        toast.success('Marked as absent successfully');
      }
      
      // Refetch to ensure data is in sync with server
      queryClient.invalidateQueries(['doctorSpecificQueues']);
      queryClient.refetchQueries(['doctorSpecificQueues']);
    },
    onError: (error, variables, context) => {
      // Rollback to previous value on error
      if (context?.previousQueues) {
        queryClient.setQueryData(['doctorSpecificQueues'], context.previousQueues);
      }
      toast.error(`Failed to toggle review status: ${error.message}`);
    }
  });

  // Fetch all doctors for assignment dropdown
  const {
    data: doctorsData,
    isLoading: doctorsLoading,
    error: doctorsError
  } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      try {
        const result = await patientService.getDoctorsList();
        return result;
      } catch (error) {
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Debug doctors data
  React.useEffect(() => {
    if (doctorsData) {
    }
    if (doctorsError) {
    }
  }, [doctorsData, doctorsError]);

  // Assign doctor to patient mutation
  const assignDoctorMutation = useMutation({
    mutationFn: ({ queueEntryId, doctorId }) =>
      ophthalmologistQueueService.assignDoctorToPatient(queueEntryId, doctorId),
    onSuccess: (data, variables) => {
      const doctor = doctorsData?.data?.find(doc => doc.id === variables.doctorId);
      const doctorName = doctor ?
        `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() ||
        doctor.fullName ||
        doctor.name ||
        'Doctor' : 'Doctor';

      // Clean the name to avoid "Dr. Dr." 
      const cleanName = doctorName.replace(/^Dr\.?\s*/i, '').trim();

      toast.success(`Dr. ${cleanName} assigned successfully!`);
      queryClient.invalidateQueries(['ophthalmologistQueue']);
      queryClient.invalidateQueries(['doctorSpecificQueues']);
    },
    onError: (error) => {
      toast.error(`Failed to assign doctor: ${error.message}`);
    }
  });

  // Apply FCFS to doctor-specific queue mutation
  const applyDoctorFCFSMutation = useMutation({
    mutationFn: ({ doctorId }) => {
      return ophthalmologistQueueService.applyDoctorFCFS(doctorId);
    },
    onSuccess: (data) => {
      toast.success('FCFS applied successfully to doctor queue!');
      queryClient.invalidateQueries(['doctorSpecificQueues']);
      queryClient.invalidateQueries(['ophthalmologistQueue']);
      setFcfsDialogOpen(false);
      setSelectedDoctorForFcfs(null);
    },
    onError: (error) => {
      toast.error(`Failed to apply FCFS: ${error.message}`);
      setFcfsDialogOpen(false);
      setSelectedDoctorForFcfs(null);
    }
  });

  // Handle doctor assignment
  const handleDoctorAssignment = (queueEntryId, doctorId) => {
    if (!doctorId) {
      toast.error('Please select a doctor');
      return;
    }

    assignDoctorMutation.mutate({ queueEntryId, doctorId });
  };



  // Handle patient details
  const handleViewDetails = async (patient) => {
    try {
      setLoadingPatientDetails(true);

      if (patient.sourceInfo?.cameFromOptometrist && patient.examinationId) {
        // Fetch detailed patient data from examination endpoint
        const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/patients/examination/${patient.examinationId}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setSelectedPatient(data.data);
            setPatientDetailsOpen(true);
          } else {
            throw new Error('No patient data received');
          }
        } else {
          const errorData = await response.json();
          throw new Error('Failed to fetch patient details');
        }
      } else {
        // For regular queue patients, use the patient data directly
        if (patient) {
          setSelectedPatient(patient);
          setPatientDetailsOpen(true);
        } else {
          throw new Error('No patient data available');
        }
      }
    } catch (error) {
      toast.error('Failed to load patient details');
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  // Keep the old handleViewDetails logic as backup but unused
  const handleViewDetailsOld = async (patient) => {
    try {
      setLoadingPatientDetails(true);

      if (patient.sourceInfo?.cameFromOptometrist && patient.examinationId) {
        // Fetch detailed patient data from examination endpoint
        const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/patients/examination/${patient.examinationId}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          setSelectedPatient(data.data);
          setPatientDetailsOpen(true);
        } else {
          throw new Error('Failed to fetch patient details');
        }
      } else {
        // For regular queue patients from old logic, create mock data
        const mockPatientData = {
          patient: {
            id: patient.id,
            patientNumber: patient.patientNumber,
            fullName: `${patient.firstName} ${patient.lastName}`,
            firstName: patient.firstName,
            lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            phone: patient.phone,
            email: patient.email,
          },
          appointment: patient.appointment,
          visit: patient.visit,
        };
        setSelectedPatient(mockPatientData);
        setPatientDetailsOpen(true);
      }
    } catch (error) {
      toast.error('Failed to load patient details: ' + error.message);
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  // Handle toggling review status
  const handleToggleReview = (patient, notes = '') => {
    toggleReviewMutation.mutate({ patient, notes });
  };

  // Handle applying FCFS to doctor-specific queue
  const handleApplyDoctorFCFS = (doctorId, doctorName) => {
    setSelectedDoctorForFcfs({ id: doctorId, name: doctorName });
    setFcfsDialogOpen(true);
  };

  // Confirm and apply FCFS
  const confirmApplyDoctorFCFS = () => {
    if (selectedDoctorForFcfs) {
      applyDoctorFCFSMutation.mutate({ doctorId: selectedDoctorForFcfs.id });
    }
  };

  // Client-side filtering only
  const filterPatientsBySearch = (patients) => {
    if (!searchInput.trim()) return patients;
    
    const searchLower = searchInput.toLowerCase().trim();
    return patients.filter(patient => {
      const fullName = patient.patient?.fullName?.toLowerCase() || '';
      const firstName = patient.patient?.firstName?.toLowerCase() || '';
      const lastName = patient.patient?.lastName?.toLowerCase() || '';
      const patientNumber = String(patient.patient?.patientNumber || '').toLowerCase();
      const phone = String(patient.patient?.phone || '').toLowerCase();
      const tokenNumber = String(patient.appointment?.tokenNumber || '').toLowerCase();
      
      return fullName.includes(searchLower) ||
             firstName.includes(searchLower) ||
             lastName.includes(searchLower) ||
             patientNumber.includes(searchLower) ||
             phone.includes(searchLower) ||
             tokenNumber.includes(searchLower);
    });
  };

  // Handle drag end with comprehensive reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;

    setDraggedItem(null);

    if (!over || active.id === over.id) {
      return;
    }

    const queueEntries = queueData?.queueEntries || [];

    // Filter and sort all patients by queue number for position calculation
    const validPatients = queueEntries.filter(p => p.queueNumber && p.queueNumber > 0);
    const allPatientsSorted = [...validPatients].sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));

    // Get only waiting patients for drag validation (since only waiting patients can be dragged)
    const waitingPatientsOnly = allPatientsSorted.filter(p => p.status === 'WAITING');

    if (waitingPatientsOnly.length === 0) {
      return;
    }

    // Find the dragged patient (should be in waiting patients)
    const draggedPatient = waitingPatientsOnly.find(p => p.queueEntryId === active.id);
    if (!draggedPatient) {
      return;
    }

    // Find the target patient (could be any patient in the queue for positioning)
    const targetPatient = allPatientsSorted.find(p => p.queueEntryId === over.id);
    if (!targetPatient) {
      return;
    }

    // Determine the target position in the global queue
    // We want to place the dragged patient at the target patient's current position
    let targetPosition = targetPatient.queueNumber;
    const draggedIndex = allPatientsSorted.findIndex(p => p.queueEntryId === active.id);
    const targetIndex = allPatientsSorted.findIndex(p => p.queueEntryId === over.id);

    // Ensure target position is valid (between 1 and total number of patients)
    const maxPosition = allPatientsSorted.length;
    if (targetPosition < 1) targetPosition = 1;
    if (targetPosition > maxPosition) targetPosition = maxPosition;


    // Safety check before API call
    if (targetPosition < 1 || targetPosition > allPatientsSorted.length) {
      toast.error(`Invalid position calculated: ${targetPosition}. Please try again.`);
      return;
    }

    // Create optimistic update
    const optimisticData = {
      ...queueData,
      queueEntries: allPatientsSorted // Keep current order for optimistic update
    };
    queryClient.setQueryData(['ophthalmologistQueue'], optimisticData);

    // Perform the comprehensive reordering
    comprehensiveReorderMutation.mutate({
      draggedPatientId: draggedPatient.queueEntryId,
      targetPosition: targetPosition,
      reason: `Queue reordered`
    });
  };

  const handleDragStart = (event) => {
    setDraggedItem(event.active.id);
  };

  // Handle drag end for doctor-specific queues
  const handleDoctorQueueDragEnd = (event, doctorId, doctorPatients) => {
    const { active, over } = event;

    setDraggedItem(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Sort patients by doctorQueuePosition
    const sortedPatients = [...doctorPatients].sort((a, b) => 
      (a.doctorQueuePosition || 0) - (b.doctorQueuePosition || 0)
    );

    // Filter: First 3 waiting patients are not draggable
    const waitingPatients = sortedPatients.filter(p => p.status === 'WAITING');
    const firstThreeWaiting = waitingPatients.slice(0, 3);
    const draggablePatients = sortedPatients.filter(p => 
      !firstThreeWaiting.some(fp => fp.queueEntryId === p.queueEntryId)
    );

    // Find dragged and target patients in ALL patients
    const draggedPatient = draggablePatients.find(p => p.queueEntryId === active.id);
    const targetPatient = sortedPatients.find(p => p.queueEntryId === over.id);

    if (!draggedPatient || !targetPatient) {
      return;
    }

    // Create new array with reordered positions
    const draggedIndex = sortedPatients.findIndex(p => p.queueEntryId === active.id);
    const targetIndex = sortedPatients.findIndex(p => p.queueEntryId === over.id);

    // Create a copy and perform the move
    const reordered = [...sortedPatients];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Map to API format with new doctorQueuePosition
    const reorderedPatients = reordered.map((patient, index) => ({
      queueEntryId: patient.queueEntryId,
      doctorQueuePosition: index + 1
    }));


    // Call API with reordered array and doctorId
    doctorQueueReorderMutation.mutate({
      doctorId: doctorId,
      reorderedPatients: reorderedPatients
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Queue</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const queueEntries = queueData?.queueEntries || [];
  const statistics = queueData?.statistics || {};

  // Apply client-side search filtering for real-time feedback
  const filteredPatients = filterPatientsBySearch(queueEntries);

  const waitingPatients = filteredPatients
    .filter(patient => patient.status === 'WAITING')
    .sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0)); // Sort by queue number
  const activePatients = filteredPatients
    .filter(patient => patient.status !== 'WAITING')
    .sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0)); // Sort active patients by queue number too

  // Get doctor queues data
  const doctorQueues = doctorQueuesData?.doctorQueues || [];

  return (
    <Card className="h-full flex flex-col overflow-hidden" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
      {/* Fixed Header with Compact Badges */}
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <Eye className="h-5 w-5 mr-2 text-blue-600" />
            Ophthalmologist Queue
            {isSocketConnected && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {showStatsCards && doctorQueuesData?.overallStatistics && (
              <>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  {doctorQueuesData.overallStatistics.totalPatients} Total
                </Badge>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                  {doctorQueuesData.overallStatistics.waitingPatients} Waiting
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  {doctorQueuesData.overallStatistics.inProgressPatients} In Progress
                </Badge>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                  {doctorQueuesData.overallStatistics.onHoldPatients} On Hold
                </Badge>
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300">
                  {doctorQueuesData.overallStatistics.presentPatients} Present
                </Badge>
                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                  {doctorQueuesData.overallStatistics.completedPatients} Completed
                </Badge>
              </>
            )}
            <Badge variant="outline">
              {filteredPatients.length} Result{filteredPatients.length !== 1 ? 's' : ''}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowStatsCards(!showStatsCards)}
              className="h-8 w-8 bg-blue-600 text-white hover:bg-blue-700 hover:text-white rounded-full shadow-md"
              title={showStatsCards ? "Hide Stats" : "Show Stats"}
            >
              <ChevronRight className={`h-4 w-4 transition-transform ${showStatsCards ? 'rotate-90' : ''}`} />
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3 flex items-center">
          <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
          Drag & drop to reorder • Auto-shifting • Doctor assignments • Updated: {new Date().toLocaleTimeString()}
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by patient name, token, or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </CardHeader>

      {/* Tabs Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="h-full overflow-y-auto p-6 tab-content-container pr-2">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No patients found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={[...activePatients, ...waitingPatients].map(
                    (p) => p.queueEntryId
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  {/* Active Patients (Non-draggable but droppable) */}
                  {activePatients.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Active Consultations ({activePatients.length})
                      </h3>
                      <div className="space-y-3">
                        {activePatients.map((patient) => (
                          <div
                            key={patient.queueEntryId}
                            className="opacity-75"
                          >
                            <SortableQueueItem
                              patient={patient}
                              onViewDetails={handleViewDetails}
                              onToggleReview={handleToggleReview}
                              loadingPatientDetails={loadingPatientDetails}
                              isDraggable={false}
                              doctors={[]}
                              onAssignDoctor={null}
                              isAssigningDoctor={false}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Waiting Patients (Draggable) */}
                  {waitingPatients.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Waiting Queue ({waitingPatients.length})
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          • Drag to reorder • Queue numbers continue after
                          active patients
                        </span>
                      </h3>
                      <div className="space-y-3">
                        {waitingPatients.map((patient) => (
                          <SortableQueueItem
                            key={patient.queueEntryId}
                            patient={patient}
                            onViewDetails={handleViewDetails}
                            onToggleReview={handleToggleReview}
                            loadingPatientDetails={loadingPatientDetails}
                            isDraggable={true}
                            doctors={doctorsData?.data || []}
                            onAssignDoctor={handleDoctorAssignment}
                            isAssigningDoctor={
                              assignDoctorMutation.isPending
                            }
                            doctorsLoading={doctorsLoading}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </div>


        {/* Doctor-Specific Queue Tabs
        {doctorQueues.map((doctorQueue) => (
          <TabsContent key={doctorQueue.doctor.id} value={`doctor-${doctorQueue.doctor.id}`} className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
            <div className="h-full overflow-y-auto tab-content-container p-1">
              <Receptionist2DoctorQueue doctorId={doctorQueue.doctor.id} />
            </div>
          </TabsContent>
        ))} */}
      {/* </Tabs> */}

      {/* Patient Details Modal */}
      <PatientDetailsModal
        patient={selectedPatient}
        isOpen={patientDetailsOpen}
        onClose={() => {
          setPatientDetailsOpen(false);
          setSelectedPatient(null);
        }}
      />

      {/* FCFS Confirmation Dialog */}
      <Dialog open={fcfsDialogOpen} onOpenChange={setFcfsDialogOpen}>
        <DialogContent className="sm:max-w-md" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Apply First-Come-First-Served</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              This will reorder waiting patients in {selectedDoctorForFcfs?.name}'s queue based on when they completed their optometrist examination.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setFcfsDialogOpen(false)}
              disabled={applyDoctorFCFSMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApplyDoctorFCFS}
              disabled={applyDoctorFCFSMutation.isPending}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              {applyDoctorFCFSMutation.isPending ? 'Applying...' : 'Apply FCFS'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OphthalmologistQueueManagement;