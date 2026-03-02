import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import Loader from "@/components/loader/Loader";
import ProfileTab from "@/components/ProfileTab";
import StaffSalaryLeave from "@/components/StaffSalaryLeave";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Import the OphthalmologistQueueManagement component with error handling
import OphthalmologistQueueManagement from "@/components/doctor/OphthalmologistQueueManagement";
import Receptionist2DoctorQueue from '@/components/receptionist2/Receptionist2DoctorQueue';
import IpdManagementTab from '@/components/ipd/IpdManagementTab';
import SurgerySuggestedTab from '@/components/surgery/SurgerySuggestedTab';
import BillingTab from '@/components/receptionist2/BillingTab';
import IpdBillingPage from './IpdBillingPage';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { isQueueManagementNote } from '@/utils/queueUtils';
import DashboardHeader from '@/components/reuseable-components/DashboardHeader';
import CurrentQueue from '@/components/staff/CurrentQueue';
import EyeDropsQueue from '@/components/shared/EyeDropsQueue';
import {
  Users,
  Calendar,
  Clock,
  Eye,
  User,
  Activity,
  FileText,

  CheckCircle,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  Stethoscope,
  ClipboardList,
  Phone,
  Mail,
  MapPin,
  LogOut,
  LogIn,
  Timer,
  CalendarDays,
  UserPlus,
  IndianRupee,
  X,
  Calendar as CalendarIcon,
  Flag,
  FlagOff,
  CheckCircle2,
  Plus,
  Key,
  Printer,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import Receptionist2PatientRegistration from "@/components/Receptionist2PatientRegistration";
import { useReceptionist2QueueSocket, useSocketConnectionStatus } from '@/hooks/useQueueSocket';

// Local Avatar Component for patient lists (different from header avatar)
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
  if (!patient) return null;

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
              <span>Patient Details - {safeRender(patient.patient?.fullName, 'Unknown Patient')}</span>
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
                    <p className="text-lg font-bold text-blue-600">#{patient.patient?.patientNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                    <p className="text-lg font-semibold">{patient.patient?.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                    <p>{formatDate(patient.patient?.dateOfBirth)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Gender</Label>
                    <p className="capitalize">{patient.patient?.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                    <p className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span>{patient.patient?.phone || 'Not provided'}</span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span>{patient.patient?.email || 'Not provided'}</span>
                    </p>
                  </div>
                </div>

                {patient.patient?.address && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-600">Address</Label>
                    <p className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-red-600 mt-1" />
                      <span>
                        {typeof patient.patient.address === 'string'
                          ? patient.patient.address
                          : typeof patient.patient.address === 'object'
                            ? Object.values(patient.patient.address).filter(Boolean).join(', ')
                            : 'Address information available'
                        }
                      </span>
                    </p>
                  </div>
                )}

                {patient.patient?.emergencyContacts && patient.patient.emergencyContacts.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-600">Emergency Contacts</Label>
                    <div className="space-y-2 mt-2">
                      {patient.patient.emergencyContacts.map((contact, index) => (
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

                {patient.patient?.allergies && patient.patient.allergies.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-600">Known Allergies</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {patient.patient.allergies.map((allergy, index) => (
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
                  <CalendarIcon className="h-4 w-4 text-green-600" />
                  <span>Appointment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Token Number</Label>
                    <p className="text-lg font-bold text-green-600">{patient.appointment?.tokenNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Appointment Time</Label>
                    <p>{patient.appointment?.appointmentTime}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Appointment Date</Label>
                    <p>{formatDate(patient.appointment?.appointmentDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Purpose</Label>
                    <p>{patient.appointment?.purpose || 'General consultation'}</p>
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
                  <Activity className="h-4 w-4 text-orange-600" />
                  <span>Visit Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Visit Number</Label>
                    <p className="font-medium">#{patient.visit?.visitNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Visit Type</Label>
                    <p className="capitalize">{patient.visit?.visitType || 'OPD'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Current Status</Label>
                    <Badge className={
                      patient.visit?.status === 'AWAITING_DOCTOR' ? 'bg-yellow-100 text-yellow-800' :
                        patient.visit?.status === 'WITH_DOCTOR' ? 'bg-blue-100 text-blue-800' :
                          patient.visit?.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                    }>
                      {patient.visit?.status?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Check-in Time</Label>
                    <p>{formatDateTime(patient.visit?.checkedInAt)}</p>
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

// Queue Patient Details Modal Component (for patients in optometrist queue)
const QueuePatientDetailsModal = ({ queuePatient, isOpen, onClose }) => {
  if (!queuePatient) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <span>Queue Patient Details - {queuePatient.patient?.fullName}</span>
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
                  <p className="text-lg font-bold text-blue-600">#{queuePatient.patient?.patientNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                  <p className="text-lg font-semibold">{queuePatient.patient?.fullName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                  <p>{formatDate(queuePatient.patient?.dateOfBirth)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Gender</Label>
                  <p className="capitalize">{queuePatient.patient?.gender || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                  <p className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span>{queuePatient.patient?.phone || 'Not provided'}</span>
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span>{queuePatient.patient?.email || 'Not provided'}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Queue Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ClipboardList className="h-4 w-4 text-purple-600" />
                <span>Queue Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Queue Position</Label>
                  <p className="text-lg font-bold text-purple-600">#{queuePatient.queueNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Queue Status</Label>
                  <Badge className={
                    queuePatient.status === 'WAITING' ? 'bg-yellow-100 text-yellow-800' :
                      queuePatient.status === 'CALLED' ? 'bg-blue-100 text-blue-800' :
                        queuePatient.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' :
                          queuePatient.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                  }>
                    {queuePatient.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Priority</Label>
                  <Badge className={
                    queuePatient.priorityLabel === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                      queuePatient.priorityLabel === 'PRIORITY' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                  }>
                    {queuePatient.priorityLabel}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Joined Queue</Label>
                  <p>{formatDateTime(queuePatient.joinedAt)}</p>
                </div>
                {queuePatient.calledAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Called At</Label>
                    <p>{formatDateTime(queuePatient.calledAt)}</p>
                  </div>
                )}
                {queuePatient.inProgressAt && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Started At</Label>
                    <p>{formatDateTime(queuePatient.inProgressAt)}</p>
                  </div>
                )}
                {queuePatient.estimatedWaitTime && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Estimated Wait</Label>
                    <p>{queuePatient.estimatedWaitTime} minutes</p>
                  </div>
                )}
              </div>

              {queuePatient.assignedStaff && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <Label className="text-sm font-medium text-blue-600">Assigned Staff</Label>
                  <p className="font-medium">{queuePatient.assignedStaff?.name || 'Not assigned'}</p>
                  <p className="text-sm text-blue-600 capitalize">{queuePatient.assignedStaff?.staffType || 'N/A'}</p>
                </div>
              )}

              {queuePatient.notes && !isQueueManagementNote(queuePatient.notes) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                  <Label className="text-sm font-medium text-gray-600">Notes</Label>
                  <p className="text-sm text-gray-600 mt-1">{queuePatient.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-green-600" />
                <span>Appointment Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Token Number</Label>
                  <p className="text-lg font-bold text-green-600">{queuePatient.appointment?.tokenNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Appointment Time</Label>
                  <p>{queuePatient.appointment?.appointmentTime}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Appointment Type</Label>
                  <p className="capitalize">{queuePatient.appointment?.appointmentType || 'Standard'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Purpose</Label>
                  <p>{queuePatient.appointment?.purpose || 'General consultation'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visit Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-orange-600" />
                <span>Visit Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Visit Number</Label>
                  <p className="font-medium">#{queuePatient.visit?.visitNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Visit Type</Label>
                  <p className="capitalize">{queuePatient.visit?.visitType || 'OPD'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Visit Status</Label>
                  <Badge className={
                    queuePatient.visit?.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800' :
                      queuePatient.visit?.status === 'WITH_OPTOMETRIST' ? 'bg-green-100 text-green-800' :
                        queuePatient.visit?.status === 'AWAITING_DOCTOR' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                  }>
                    {queuePatient.visit?.status?.replace('_', ' ') || 'Unknown'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Check-in Time</Label>
                  <p>{formatDateTime(queuePatient.visit?.checkedInAt)}</p>
                </div>
              </div>

              {queuePatient.doctor && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <Label className="text-sm font-medium text-green-600">Assigned Doctor</Label>
                  <p className="font-medium">{queuePatient.doctor?.name || 'Not assigned'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Receptionist2Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 🔌 WebSocket real-time updates for eye drop queue
  useReceptionist2QueueSocket();
  const isSocketConnected = useSocketConnectionStatus();

  // Fetch dashboard stats with safe background refreshing
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['receptionist2-dashboard-stats'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/dashboard/stats`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      const data = await response.json();
      return data.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    refetchIntervalInBackground: true, // Continue refetching even when window is not focused
    refetchOnWindowFocus: true,
    staleTime: 5000, // Consider data stale after 5 seconds
    cacheTime: 30000 // Keep in cache for 30 seconds
  });
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // TanStack Query for Ophthalmology Queue with safe background refreshing
  const { data: ophthalmologyQueueData, isLoading: ophthalmologyQueueLoading, refetch: refetchOphthalmologyQueue } = useQuery({
    queryKey: ['ophthalmology-queue', selectedDate, statusFilter, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('patientName', searchTerm);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/patients/ophthalmology-queue?${params}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch ophthalmology queue');
      }

      const data = await response.json();

      if (data.data?.patients && data.data.patients.length > 0) {
        data.data.patients.forEach((patient) => {
        });
      }

      return data.data?.patients || [];
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    cacheTime: 30000,
    initialData: [], // Provide initial empty array
    onError: (error) => {
      toast.error('Failed to load ophthalmology queue: ' + error.message);
    }
  });

  // Ensure checkedPatients is always an array
  const checkedPatients = Array.isArray(ophthalmologyQueueData) ? ophthalmologyQueueData : [];

  // TanStack Query for Queue Status with safe background refreshing
  const { data: queueStatusData, refetch: refetchQueueStatus } = useQuery({
    queryKey: ['queue-status'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/queue/status`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to fetch queue status');
      const data = await response.json();
      return data.data;
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    cacheTime: 30000,
    onError: (error) => {
      toast.error('Failed to load queue status');
    }
  });

  const queueStatus = queueStatusData || {};

  // TanStack Query for Optometrist Queue with safe background refreshing
  const { data: optometristQueueData, refetch: refetchOptometristQueue } = useQuery({
    queryKey: ['optometrist-queue'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/queue/optometrist`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to fetch optometrist queue');
      const data = await response.json();
      return data.data.queueEntries || [];
    },
    refetchInterval: 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 5000,
    cacheTime: 30000,
    initialData: [], // Provide initial empty array to prevent undefined
    onError: (error) => {
      toast.error('Failed to load optometrist queue');
    }
  });

  // Ensure optometristQueue is always an array
  const optometristQueue = Array.isArray(optometristQueueData) ? optometristQueueData : [];
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetailsOpen, setPatientDetailsOpen] = useState(false);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [todayRegistrations, setTodayRegistrations] = useState([]);
  const [registrationStats, setRegistrationStats] = useState(null);
  const [queuePatientDetailsOpen, setQueuePatientDetailsOpen] = useState(false);
  const [selectedQueuePatient, setSelectedQueuePatient] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all'); // all, reviewed, unreviewed
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const [showStatsCards, setShowStatsCards] = useState(true);

  // Timer settings - default 10 minutes, stored in localStorage
  const defaultTimerDuration = (() => {
    const saved = localStorage.getItem('eyeDropTimerDuration');
    return saved ? parseInt(saved) : 10;
  })();

  // Per-patient timer dialog (for custom timer)
  const [showPatientTimerDialog, setShowPatientTimerDialog] = useState(false);
  const [selectedPatientForTimer, setSelectedPatientForTimer] = useState(null);
  const [patientTimerDuration, setPatientTimerDuration] = useState(10);

  // Get staff type from user context, default to receptionist2
  const staffType = user?.staffType || 'receptionist2';

  // Eye Drop Queue Service Function
  const fetchEyeDropQueue = async ({ selectedDate }) => {

    const params = new URLSearchParams();
    if (selectedDate) params.append('date', selectedDate);

    const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/patients/on-hold-queue?${params}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch eye drop queue');
    }

    const data = await response.json();

    // Return data with proper structure, ensuring patients array exists
    return {
      patients: data.data?.patients || [],
      statistics: data.data?.statistics || {}
    };
  };

  // TanStack Query for Eye Drop Queue with auto-refresh
  const {
    data: eyeDropQueueData,
    isLoading: eyeDropQueueLoading,
    error: eyeDropQueueError,
    refetch: refetchEyeDropQueue,
    isFetching: eyeDropQueueFetching
  } = useQuery({
    queryKey: ['eyeDropQueue', selectedDate],
    queryFn: () => {
      return fetchEyeDropQueue({ selectedDate });
    },
    // ❌ REMOVED POLLING - WebSocket handles updates now!
    // refetchInterval: 10000,
    // refetchIntervalInBackground: true,
    refetchOnWindowFocus: true, // ✅ KEEP - Refetch when window becomes focused
    refetchOnMount: true, // ✅ KEEP - Always refetch on component mount
    staleTime: 5000, // Consider data stale after 5 seconds
    cacheTime: 30000, // Keep in cache for 30 seconds
    retry: 2, // Retry failed requests 2 times
    retryDelay: 1000, // Wait 1 second between retries
    onError: (error) => {
      // Only show toast for actual errors, not for empty results
      if (!error.message.includes('No patients')) {
        toast.error('Failed to load eye drop queue: ' + error.message);
      }
    },
    onSuccess: (data) => {
    }
  });

  // Extract eye drop queue data with fallbacks
  const onHoldPatients = eyeDropQueueData?.patients || [];
  const onHoldStats = eyeDropQueueData?.statistics || {};

  // Apply Eye Drops Mutation
  const applyEyeDropsMutation = useMutation({
    mutationFn: async ({ queueEntryId, customWaitMinutes }) => {

      const response = await fetch(`${import.meta.env.VITE_API_URL}/ophthalmologist/queue/confirm-drops-applied`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          queueEntryId,
          customWaitMinutes // Send custom timer duration to backend
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to apply eye drops');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast.success(`Eye drops applied successfully! ${variables.customWaitMinutes}-minute timer started.`);

      // Invalidate and refetch the eye drop queue to get updated data
      queryClient.invalidateQueries(['eyeDropQueue']);

      // Also refetch immediately for instant feedback
      refetchEyeDropQueue();

      // Close the dialog
      setShowPatientTimerDialog(false);
    },
    onError: (error) => {
      toast.error('Failed to apply eye drops: ' + error.message);
    }
  });

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch non-query data (today registrations and registration stats)
  useEffect(() => {
    fetchDashboardData();
    fetchTodayRegistrations();
    fetchRegistrationStats();
    setLoading(false);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/dashboard/stats`, {
        method: 'GET',
        credentials: 'include', // Use cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      toast.error('Failed to load dashboard data: ' + error.message);
    }
  };

  // Fetch functions replaced by TanStack Query above

  const handleSearch = () => {
    refetchOphthalmologyQueue();
  };

  const handleViewQueuePatient = async (queuePatient) => {

    // If patient has examinationId, fetch full examination details
    if (queuePatient.examinationId || queuePatient.optometristExaminationId) {
      const examId = queuePatient.examinationId || queuePatient.optometristExaminationId;
      await fetchPatientDetails(examId);
    } else {
      // Otherwise, just show queue patient details
      setSelectedQueuePatient(queuePatient);
      setQueuePatientDetailsOpen(true);
    }
  };

  const markPatientAsReviewed = async (patient, notes = '') => {
    try {
      let apiUrl;
      let identifier;

      // Determine which API endpoint to use based on patient type
      if (patient.sourceInfo?.cameFromOptometrist && patient.examinationId) {
        // Patient came from optometrist - use examination endpoint
        apiUrl = `${import.meta.env.VITE_API_URL}/receptionist2/patients/examination/${patient.examinationId}/mark-reviewed`;
        identifier = patient.examinationId;

      } else if (patient.queueEntryId) {
        // Emergency direct patient or queue-based patient - use ophthalmology queue endpoint
        apiUrl = `${import.meta.env.VITE_API_URL}/receptionist2/patients/ophthalmology-queue/${patient.queueEntryId}/mark-reviewed`;
        identifier = patient.queueEntryId;
      } else {
        toast.error('Unable to mark patient as present- missing required identifiers');
        return;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Marked as present successfully');

        // Refresh the patient list to show updated status
        queryClient.invalidateQueries(['ophthalmology-queue']);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark as present');
      }
    } catch (error) {
      toast.error('Failed to mark as present: ' + error.message);
    }
  };

  const unmarkPatientAsReviewed = async (patient) => {
    try {
      let apiUrl;
      let identifier;

      // Determine which API endpoint to use based on patient type
      if (patient.sourceInfo?.cameFromOptometrist && patient.examinationId) {
        // Patient came from optometrist - use examination endpoint
        apiUrl = `${import.meta.env.VITE_API_URL}/receptionist2/patients/examination/${patient.examinationId}/unmark-reviewed`;
        identifier = patient.examinationId;
      } else if (patient.queueEntryId) {
        // Emergency direct patient or queue-based patient - use ophthalmology queue endpoint
        apiUrl = `${import.meta.env.VITE_API_URL}/receptionist2/patients/ophthalmology-queue/${patient.queueEntryId}/unmark-reviewed`;
        identifier = patient.queueEntryId;
      } else {
        toast.error('Unable to mark as absent - missing required identifiers');
        return;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Marked as absent successfully');

        // Refresh the patient list to show updated status
        queryClient.invalidateQueries(['ophthalmology-queue']);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark as absent');
      }
    } catch (error) {
      toast.error('Failed to mark as absent: ' + error.message);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchDashboardData();
    refetchOphthalmologyQueue();
    refetchQueueStatus();
    refetchOptometristQueue();

    // Refresh the eye drop queue using TanStack Query
    refetchEyeDropQueue();

    // Also invalidate dashboard stats
    queryClient.invalidateQueries(['receptionist2-dashboard-stats']);
    setLoading(false);
  };

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

  const handleApplyEyeDrops = (patient, useCustomTime = false) => {
    if (useCustomTime) {
      // Open dialog to set custom timer duration
      setSelectedPatientForTimer(patient);
      setPatientTimerDuration(patient.customWaitMinutes || defaultTimerDuration);
      setShowPatientTimerDialog(true);
    } else {
      // Apply drops directly with default time
      applyEyeDropsMutation.mutate({
        queueEntryId: patient.queueEntryId,
        customWaitMinutes: defaultTimerDuration
      });
    }
  };

  const confirmApplyEyeDrops = () => {
    if (!selectedPatientForTimer) return;

    // Use the TanStack Query mutation for applying eye drops with custom duration
    applyEyeDropsMutation.mutate({
      queueEntryId: selectedPatientForTimer.queueEntryId,
      customWaitMinutes: patientTimerDuration
    });
  };

  const handleRepeatDilation = async (patient) => {
    try {

      // Use the same custom wait time that was set for this patient
      const customWaitMinutes = patient.customWaitMinutes || defaultTimerDuration;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/ophthalmologist/queue/repeat-dilation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          queueEntryId: patient.queueEntryId,
          customWaitMinutes // Keep the same timer duration
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to repeat dilation');
      }

      toast.success(`Dilation repeated - Round ${data.data.round}/3 started (${customWaitMinutes} min timer)`);

      // Refresh the eye drop queue
      queryClient.invalidateQueries(['eyeDropQueue']);
      refetchEyeDropQueue();

    } catch (error) {
      toast.error(error.message || 'Failed to repeat dilation');
    }
  };

  const handleMarkReady = async (queueEntryId) => {
    try {

      const response = await fetch(`${import.meta.env.VITE_API_URL}/ophthalmologist/queue/mark-ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ queueEntryId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark patient ready');
      }

      toast.success('Patient marked as ready to resume examination');

      // Refresh the eye drop queue
      queryClient.invalidateQueries(['eyeDropQueue']);
      refetchEyeDropQueue();

    } catch (error) {
      toast.error(error.message || 'Failed to mark patient ready');
    }
  };

  // Fetch today's registrations by receptionist2
  const fetchTodayRegistrations = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/patients/registered-today`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setTodayRegistrations(result.data.registrations);
      } else {
        toast.error('Failed to fetch today\'s registrations');
      }
    } catch (error) {
      toast.error('Error fetching today\'s registrations');
    }
  };

  // Fetch registration statistics
  const fetchRegistrationStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/dashboard/registration-stats`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setRegistrationStats(result.data);
      } else {
      }
    } catch (error) {
    }
  };

  const handleEmergencyPatientDetails = (patient) => {
    // For emergency patients without examination data, create a mock patient object
    const mockPatientData = {
      patient: {
        id: patient.patient.id,
        patientNumber: patient.patient.patientNumber,
        fullName: patient.patient.fullName,
        firstName: patient.patient.firstName,
        lastName: patient.patient.lastName,
        dateOfBirth: patient.patient.dateOfBirth,
        gender: patient.patient.gender,
        phone: patient.patient.phone,
        email: patient.patient.email,
        address: null,
        allergies: null,
        emergencyContacts: null
      },
      appointment: patient.appointment,
      visit: patient.visit,
      optometristExamination: null, // No optometrist examination for emergency patients
      ophthalmologistExamination: null // Will be created when examined
    };

    setSelectedPatient(mockPatientData);
    setPatientDetailsOpen(true);
  };

  const fetchPatientDetails = async (examinationId) => {
    try {
      setLoadingPatientDetails(true);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/patients/examination/${examinationId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedPatient(data.data);
        setPatientDetailsOpen(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch patient details');
      }
    } catch (error) {
      toast.error('Failed to load patient details: ' + error.message);
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'WAITING': { color: 'bg-yellow-100 text-yellow-800', label: 'Waiting' },
      'AWAITING_DOCTOR': { color: 'bg-yellow-100 text-yellow-800', label: 'Awaiting Doctor' },
      'WITH_DOCTOR': { color: 'bg-blue-100 text-blue-800', label: 'With Doctor' },
      'COMPLETED': { color: 'bg-green-100 text-green-800', label: 'Completed' },
      'CHECKED_IN': { color: 'bg-gray-100 text-gray-800', label: 'Checked In' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'EMERGENCY': { color: 'bg-red-100 text-red-800', label: 'Emergency' },
      'PRIORITY': { color: 'bg-orange-100 text-orange-800', label: 'Priority' },
      'ROUTINE': { color: 'bg-blue-100 text-blue-800', label: 'Routine' }
    };

    const normalizedPriority = priority ? String(priority).toUpperCase() : 'ROUTINE';
    const config = priorityConfig[normalizedPriority] || { color: 'bg-blue-100 text-blue-800', label: 'Routine' };

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Show loading state
  if (loading) {
    return <Loader color="#3B82F6" />;
  }

  const staffInfo = {
    name: user ? `${user.firstName} ${user.lastName}` : 'Receptionist2',
    role: 'Post-Optometrist Care Coordinator',
    patientsChecked: dashboardData?.todayStats?.totalOptometristChecked || 0,
    awaitingDoctor: dashboardData?.todayStats?.awaitingDoctor || 0,
    completedToday: dashboardData?.todayStats?.completedToday || 0
  };

  const reviewedCount = checkedPatients.filter(p => p.receptionist2Review?.reviewed).length;
  const unreviewed = checkedPatients.length - reviewedCount;

  const stats = [
    { title: "From Optometrist", value: checkedPatients.filter(p => p.sourceInfo?.cameFromOptometrist).length, icon: Stethoscope },
    { title: "Emergency Direct", value: checkedPatients.filter(p => p.sourceInfo?.isEmergencyDirect).length, icon: AlertTriangle },
    { title: "Total in Queue", value: checkedPatients.length, icon: Users },
    { title: "Registered Today", value: registrationStats?.todayRegistrations?.total || 0, icon: UserPlus },
    { title: "Emergency Cases", value: registrationStats?.todayRegistrations?.emergency || 0, icon: AlertTriangle },
    { title: "Completed Today", value: staffInfo.completedToday, icon: CheckCircle },
  ];

  // Show registration success page if registration was completed
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 print:bg-white print:p-0">
        <div className="max-w-4xl mx-auto print:max-w-full">
          <div className="text-center mb-8 print:mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 print:hidden">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-2 print:text-black print:text-xl">Patient Registration Complete!</h3>
            <div className="text-3xl font-bold text-blue-600 mb-2 print:text-black print:text-2xl">
              Patient #{registrationSuccess.patient.patientNumber}
            </div>
            <p className="text-gray-600 print:text-black">{registrationSuccess.patient.firstName} {registrationSuccess.patient.middleName ? registrationSuccess.patient.middleName + ' ' : ''}{registrationSuccess.patient.lastName}</p>
          </div>

          {/* Process Stepper - Same as regular receptionist */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              {/* Step 1: Registration */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-green-600">Registration</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
              </div>

              <div className="flex-1 h-1 bg-green-500 mx-4"></div>

              {/* Step 2: Auto Check-in / Queue Assignment */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-green-600">
                    {registrationSuccess.queueRouting?.isEmergency ? 'Emergency Queue' : 'Auto Check-in'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {registrationSuccess.queueRouting?.isEmergency ? 'Direct to Doctor' : 'Optometrist Queue'}
                  </div>
                </div>
              </div>

              <div className="flex-1 h-1 bg-gray-300 mx-4"></div>

              {/* Step 3: Consultation */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                  <Stethoscope className="h-6 w-6 text-gray-500" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-500">
                    {registrationSuccess.queueRouting?.isEmergency ? 'Doctor Consultation' : 'Optometrist Examination'}
                  </div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Information - Exact same format as regular receptionist */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 print:bg-white print:border-black print:border-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center print:grid-cols-3">
              <div>
                <div className="text-2xl font-bold text-blue-600 print:text-black">
                  {registrationSuccess.appointment?.tokenNumber || 'N/A'}
                </div>
                <p className="text-sm text-blue-700 font-medium print:text-black">Appointment Token</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 print:text-black">
                  {registrationSuccess.patient.patientNumber}
                </div>
                <p className="text-sm text-blue-700 font-medium print:text-black">Login ID</p>
              </div>
              <div>
                <div className="text-lg font-mono text-blue-600 bg-blue-100 px-3 py-1 rounded print:text-black print:bg-gray-100 print:border print:border-black">
                  {registrationSuccess.temporaryPassword || 'N/A'}
                </div>
                <p className="text-sm text-blue-700 font-medium print:text-black">Temp Password</p>
              </div>
            </div>
          </div>

          {/* Email Status */}
          {registrationSuccess.emailSent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-sm text-green-700">
                  Login credentials have been sent to {registrationSuccess.patient.email}
                </p>
              </div>
            </div>
          )}

          {/* Status Alert */}
          <div className={`border rounded-lg p-4 mb-8 ${registrationSuccess.queueRouting?.isEmergency
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
            }`}>
            <div className="flex items-center">
              {registrationSuccess.queueRouting?.isEmergency ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-700">
                    <strong>Emergency Case:</strong> Patient has been added to the Ophthalmology queue for immediate attention.
                  </p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-700">
                    <strong>Auto Check-in Complete:</strong> Patient has been automatically checked in to the Optometrist queue.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Queue Information */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h4 className="text-lg font-semibold mb-4">Queue Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Queue Position</p>
                <p className="font-semibold">#{registrationSuccess.queueEntry?.queueNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Queue Type</p>
                <p className="font-semibold">
                  {registrationSuccess.queueRouting?.isEmergency ? 'Ophthalmology (Emergency)' : 'Optometrist (Auto Check-in)'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <p className="font-semibold">{registrationSuccess.queueRouting?.priority || 'ROUTINE'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-semibold">
                  {registrationSuccess.queueRouting?.isEmergency ? 'Emergency - Waiting for Doctor' : 'Checked In - Waiting for Optometrist'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4 print:hidden">
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Details
            </Button>
            <Button
              onClick={() => setRegistrationSuccess(null)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Register Another Patient
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRegistrationSuccess(null);
                // Switch to queue tab to see the patient
                // You might need to add tab switching logic here
              }}
            >
              View Queue
            </Button>
          </div>
        </div>
      </div>
    );
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
          // overflow-y: auto;
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
            name: staffInfo.name,
            role: staffInfo.role
          }}
          showNotifications={true}
        />
      </div>

      {/* Main Content Area - flex-1 takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:max-w-[100%] lg:mx-auto lg:px-8 py-4 h-full flex flex-col">
          {/* Dashboard Stats Cards - Responsive Grid */}
          {showStatsCards && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-4 flex-shrink-0">
              <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="z-10">
                      <p className="text-blue-100 text-sm font-medium">Optometrist Queue</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-9 w-12 bg-blue-400 rounded mt-1"></div>
                      ) : (
                        <>
                          <p className="text-3xl font-bold">{dashboardStats?.queueStats?.optometrist?.total || 0}</p>
                          <p className="text-blue-200 text-xs">{dashboardStats?.queueStats?.optometrist?.waiting || 0} waiting</p>
                        </>
                      )}
                    </div>
                    <Stethoscope className="h-12 w-12 text-blue-300 opacity-80" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-800/20"></div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="z-10">
                      <p className="text-purple-100 text-sm font-medium">Ophthalmologist Queue</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-9 w-12 bg-purple-400 rounded mt-1"></div>
                      ) : (
                        <>
                          <p className="text-3xl font-bold">{dashboardStats?.queueStats?.ophthalmologist?.total || 0}</p>
                          <p className="text-purple-200 text-xs">{dashboardStats?.queueStats?.ophthalmologist?.waiting || 0} waiting</p>
                        </>
                      )}
                    </div>
                    <Eye className="h-12 w-12 text-purple-300 opacity-80" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-800/20"></div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="z-10">
                      <p className="text-green-100 text-sm font-medium">Completed Today</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-9 w-12 bg-green-400 rounded mt-1"></div>
                      ) : (
                        <>
                          <p className="text-3xl font-bold">{dashboardStats?.queueStats?.totalCompleted || 0}</p>
                          <p className="text-green-200 text-xs">Successfully processed</p>
                        </>
                      )}
                    </div>
                    <CheckCircle className="h-12 w-12 text-green-300 opacity-80" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-green-800/20"></div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="z-10">
                      <p className="text-orange-100 text-sm font-medium">Today's Appointments</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-9 w-12 bg-orange-400 rounded mt-1"></div>
                      ) : (
                        <>
                          <p className="text-3xl font-bold">{dashboardStats?.appointmentStats?.total || 0}</p>
                          <p className="text-orange-200 text-xs">{dashboardStats?.appointmentStats?.completed || 0} completed</p>
                        </>
                      )}
                    </div>
                    <Calendar className="h-12 w-12 text-orange-300 opacity-80" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-orange-800/20"></div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white overflow-hidden relative">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="z-10">
                      <p className="text-red-100 text-sm font-medium">Total In Queue</p>
                      {statsLoading ? (
                        <div className="animate-pulse h-9 w-12 bg-red-400 rounded mt-1"></div>
                      ) : (
                        <>
                          <p className="text-3xl font-bold">{dashboardStats?.queueStats?.totalInQueue || 0}</p>
                          <p className="text-red-200 text-xs">Active patients</p>
                        </>
                      )}
                    </div>
                    <Users className="h-12 w-12 text-red-300 opacity-80" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-red-800/20"></div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="register" className="flex-1 flex flex-col min-h-0">
            <div className="relative flex-shrink-0">
              {/* Scrollable container for mobile */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex sm:grid w-auto sm:w-full sm:grid-cols-10 bg-white p-1 h-auto rounded-lg shadow-sm border min-w-max">
                  {/* <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Dashboard</TabsTrigger> */}
                  <TabsTrigger value="register" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                    Register Patient
                  </TabsTrigger>
                  <TabsTrigger value="patients" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">Ophthalmology Queue</TabsTrigger>
                  <TabsTrigger value="doctor-queue" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">Doctor Queue</TabsTrigger>
                  <TabsTrigger value="on-hold" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                    Eye Drops Queue
                  </TabsTrigger>
                  <TabsTrigger value="optometrist-queue" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">Optometrist Queue</TabsTrigger>
                  <TabsTrigger value="surgery-suggested" className="data-[state=active]:bg-red-600 data-[state=active]:text-white px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                    Surgery Suggested
                  </TabsTrigger>
                  <TabsTrigger value="billing" className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                    <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Billing
                  </TabsTrigger>
                  <TabsTrigger value="surgery-billing" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                    <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Surgery Billing
                  </TabsTrigger>
                  <TabsTrigger value="salary-leave" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">Salary & Leave</TabsTrigger>
                  <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap">Profile</TabsTrigger>
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

            {/* Dashboard Tab - Hidden from navigation but kept in code */}
            {false && (
              <TabsContent value="dashboard" className="mt-6 space-y-6">
                {/* Quick Actions */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="bg-white border-b border-gray-200">
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-[#2563EB]" />
                      <span className="text-[#2563EB] font-semibold">Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button
                        className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-100 text-[#2563EB] hover:bg-blue-200 border border-blue-200 shadow-sm transition-all duration-200"
                        onClick={() => refetchOphthalmologyQueue()}
                      >
                        <UserCheck className="h-6 w-6 text-[#2563EB]" />
                        <span className="text-sm font-medium">Refresh Patients</span>
                      </Button>
                      <Button
                        className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-100 text-[#2563EB] hover:bg-blue-200 border border-blue-200 shadow-sm transition-all duration-200"
                        onClick={() => refetchOptometristQueue()}
                      >
                        <ClipboardList className="h-6 w-6 text-[#2563EB]" />
                        <span className="text-sm font-medium">Check Queue</span>
                      </Button>
                      <Button
                        className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-100 text-[#2563EB] hover:bg-blue-200 border border-blue-200 shadow-sm transition-all duration-200"
                        onClick={() => refetchQueueStatus()}
                      >
                        <Activity className="h-6 w-6 text-[#2563EB]" />
                        <span className="text-sm font-medium">Queue Status</span>
                      </Button>
                      <Button
                        className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-100 text-[#2563EB] hover:bg-blue-200 border border-blue-200 shadow-sm transition-all duration-200"
                        onClick={() => setSearchTerm('')}
                      >
                        <Search className="h-6 w-6 text-[#2563EB]" />
                        <span className="text-sm font-medium">Search Patients</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            {/* END Dashboard Tab */}

            {/* Patient Registration Tab */}
            <TabsContent value="register" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <Receptionist2PatientRegistration
                  onRegistrationComplete={(registrationData) => {

                    // Set registration success data to show success page
                    setRegistrationSuccess(registrationData);

                    // Refresh dashboard data
                    fetchDashboardData();
                    queryClient.invalidateQueries(['optometrist-queue']);
                    queryClient.invalidateQueries(['queue-status']);
                    queryClient.invalidateQueries(['receptionist2-dashboard-stats']);
                  }}
                  onCancel={() => {
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="patients" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full flex flex-col">
                <React.Suspense fallback={
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading enhanced queue management...</span>
                  </div>
                }>
                  <OphthalmologistQueueManagement />
                </React.Suspense>
              </div>
            </TabsContent>

            <TabsContent value="doctor-queue" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full flex flex-col">
                <React.Suspense fallback={
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-2">Loading doctor queue...</span>
                  </div>
                }>
                  <Receptionist2DoctorQueue />
                </React.Suspense>
              </div>
            </TabsContent>

            <TabsContent value="on-hold" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full flex flex-col">
                <EyeDropsQueue
                  patients={onHoldPatients}
                  statistics={onHoldStats}
                  loading={eyeDropQueueLoading}
                  fetching={eyeDropQueueFetching}
                  error={eyeDropQueueError}
                  onRefresh={refetchEyeDropQueue}
                  onApplyEyeDrops={handleApplyEyeDrops}
                  onRepeatDilation={handleRepeatDilation}
                  onMarkReady={handleMarkReady}
                  applyEyeDropsMutation={applyEyeDropsMutation}
                  themeColor="orange"
                  gradientFrom="from-orange-50"
                  gradientTo="to-yellow-50"
                />
              </div>
            </TabsContent>

            <TabsContent value="optometrist-queue" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <CurrentQueue
                  queryKey={['receptionist2-optometrist-queue']}
                  queryFn={async () => {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/queue/optometrist`, {
                      method: 'GET',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' }
                    });
                    if (!response.ok) throw new Error('Failed to fetch optometrist queue');
                    const data = await response.json();
                    console.log('Receptionist2 optometrist queue data:', data);
                    // Return the same structure as optometristQueueService.getOptometristQueue()
                    return data;
                  }}
                  enablePriorityUpdate={true}
                />
              </div>
            </TabsContent>
            <TabsContent value="ipd" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <IpdManagementTab />
              </div>
            </TabsContent>
            <TabsContent value="surgery-suggested" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <SurgerySuggestedTab />
              </div>
            </TabsContent>
            <TabsContent value="billing" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <BillingTab />
              </div>
            </TabsContent>
            <TabsContent value="surgery-billing" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full flex flex-col">
                <IpdBillingPage />
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

      {/* Patient Details Modal */}
      <PatientDetailsModal
        patient={selectedPatient}
        isOpen={patientDetailsOpen}
        onClose={() => {
          setPatientDetailsOpen(false);
          setSelectedPatient(null);
        }}
      />

      {/* Queue Patient Details Modal */}
      <QueuePatientDetailsModal
        queuePatient={selectedQueuePatient}
        isOpen={queuePatientDetailsOpen}
        onClose={() => {
          setQueuePatientDetailsOpen(false);
          setSelectedQueuePatient(null);
        }}
      />

      {/* Patient Timer Dialog */}
      <Dialog open={showPatientTimerDialog} onOpenChange={setShowPatientTimerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Timer className="h-5 w-5 text-orange-600" />
              <span>Set Timer for Patient</span>
            </DialogTitle>
          </DialogHeader>
          {selectedPatientForTimer && (
            <div className="space-y-4 py-4">
              {/* <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{selectedPatientForTimer.patient?.fullName}</p>
                <p className="text-sm text-gray-500">Token: {selectedPatientForTimer.visit?.tokenNumber}</p>
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="patient-timer-duration">Wait Time (minutes)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="patient-timer-duration"
                    type="number"
                    min="1"
                    max="60"
                    value={patientTimerDuration}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || defaultTimerDuration;
                      setPatientTimerDuration(value);
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">minutes</span>
                </div>
                <p className="text-sm text-gray-500">
                  Set how long to wait after applying eye drops for this patient.
                </p>
              </div>

              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  An alarm will sound when the timer expires.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Quick Presets</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((preset) => (
                    <Button
                      key={preset}
                      size="sm"
                      variant={patientTimerDuration === preset ? "default" : "outline"}
                      onClick={() => setPatientTimerDuration(preset)}
                    >
                      {preset}m
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPatientTimerDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmApplyEyeDrops}
              disabled={applyEyeDropsMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {applyEyeDropsMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Applying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply Drops & Start Timer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Receptionist2Dashboard;