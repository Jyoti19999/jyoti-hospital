import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { toast } from "sonner";
import {
  User,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Eye,
  FileText,
  CheckCircle,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Stethoscope,
  Users
} from "lucide-react";
import patientService from '@/services/patientService';
import ophthalmologistQueueService from '@/services/ophthalmologistQueueService';

const Receptionist2PatientRegistration = ({ onRegistrationComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Patient demographic data
  const [patientData, setPatientData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Simplified emergency assessment
  const [emergencyAssessment, setEmergencyAssessment] = useState({
    isEmergency: false,
    notes: '',
    assignedDoctorId: '' // For assigning doctor to emergency patients
  });

  // Fetch doctors list when emergency is selected
  const { 
    data: doctorsData, 
    isLoading: doctorsLoading,
    error: doctorsError
  } = useQuery({
    queryKey: ['doctors-for-registration'],
    queryFn: async () => {
      try {
        const result = await patientService.getDoctorsList();
        return result;
      } catch (error) {
        throw error;
      }
    },
    enabled: emergencyAssessment.isEmergency, // Only fetch when emergency is selected
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Helper function to get doctor's full name from various possible fields
  const getDoctorName = (doctor) => {
    if (!doctor) return 'Unknown Doctor';
    
    // Try different property combinations
    if (doctor.firstName && doctor.lastName) {
      return `${doctor.firstName} ${doctor.lastName}`;
    }
    if (doctor.fullName) {
      return doctor.fullName;
    }
    if (doctor.name) {
      return doctor.name;
    }
    if (doctor.firstName) {
      return doctor.firstName;
    }
    
    return 'Unknown Doctor';
  };

  // Helper function to clean doctor name (remove Dr. prefix if exists)
  const cleanDoctorName = (name) => {
    if (!name) return '';
    return name.replace(/^Dr\.?\s*/i, '').trim();
  };

  // Validation functions
  const validateNameField = (value, fieldName, isRequired = true) => {
    const nameRegex = /^[a-zA-Z\s]*$/;
    if (isRequired && !value.trim()) {
      return `${fieldName} is required`;
    }
    if (value.trim() && !nameRegex.test(value)) {
      return `${fieldName} can only contain letters and spaces`;
    }
    return null;
  };

  const validatePhoneField = (value, fieldName, isRequired = true) => {
    const phoneRegex = /^[0-9]*$/;
    if (isRequired && !value.trim()) {
      return `${fieldName} is required`;
    }
    if (value.trim()) {
      if (!phoneRegex.test(value)) {
        return `${fieldName} can only contain numbers`;
      }
      if (value.length !== 10) {
        return `${fieldName} must be exactly 10 digits`;
      }
    }
    return null;
  };

  const validateAddressField = (value) => {
    const addressRegex = /^[a-zA-Z0-9\s,.:\/()\-']*$/;
    if (value.trim() && !addressRegex.test(value)) {
      return "Address can only contain letters, numbers, spaces, and these characters: - / ( ) . , : '";
    }
    return null;
  };

  const handleBlur = (fieldName) => {
    let error = null;
    const value = patientData[fieldName];

    if (fieldName === 'firstName') {
      error = validateNameField(value, 'First Name', true);
    } else if (fieldName === 'middleName') {
      error = validateNameField(value, 'Middle Name', false); // Optional
    } else if (fieldName === 'lastName') {
      error = validateNameField(value, 'Last Name', true);
    } else if (fieldName === 'phone') {
      error = validatePhoneField(value, 'Phone Number', true);
    } else if (fieldName === 'dateOfBirth') {
      if (!value?.trim()) {
        error = 'Date of Birth is required';
      }
    } else if (fieldName === 'gender') {
      if (!value?.trim()) {
        error = 'Gender is required';
      }
    } else if (fieldName === 'emergencyPhone') {
      error = validatePhoneField(value, 'Emergency Phone', false); // Optional
    } else if (fieldName === 'emergencyContact') {
      error = validateNameField(value, 'Emergency Contact Name', false); // Optional
    } else if (fieldName === 'address') {
      error = validateAddressField(value);
    }

    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  // Handle patient data changes
  const handlePatientDataChange = (field, value) => {
    // Enforce max length for phone fields
    if ((field === 'phone' || field === 'emergencyPhone') && value.length > 10) {
      return;
    }

    setPatientData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle emergency assessment changes
  const handleEmergencyChange = (field, value) => {
    setEmergencyAssessment(prev => ({
      ...prev,
      [field]: value
    }));

    // If emergency is selected, fetch doctors list
    if (field === 'isEmergency' && value && !doctorsData) {
      // Enable the query to fetch doctors
      // We need to refetch it
    }
  };

  // Validate patient data
  const validatePatientData = () => {
    const errors = {};
    const missingRequiredFields = [];

    // Validate required fields
    errors.firstName = validateNameField(patientData.firstName, 'First Name', true);
    if (errors.firstName) missingRequiredFields.push('First Name');

    errors.lastName = validateNameField(patientData.lastName, 'Last Name', true);
    if (errors.lastName) missingRequiredFields.push('Last Name');

    errors.phone = validatePhoneField(patientData.phone, 'Phone Number', true);
    if (errors.phone) missingRequiredFields.push('Phone Number');

    // Check date of birth (required)
    if (!patientData.dateOfBirth?.trim()) {
      errors.dateOfBirth = 'Date of Birth is required';
      missingRequiredFields.push('Date of Birth');
    }

    // Check gender (required)
    if (!patientData.gender?.trim()) {
      errors.gender = 'Gender is required';
      missingRequiredFields.push('Gender');
    }
    
    // Validate middle name only if provided (optional field)
    if (patientData.middleName?.trim()) {
      errors.middleName = validateNameField(patientData.middleName, 'Middle Name', false);
      if (errors.middleName) missingRequiredFields.push('Middle Name');
    }

    // Check optional fields only if they have values
    if (patientData.emergencyPhone?.trim()) {
      errors.emergencyPhone = validatePhoneField(patientData.emergencyPhone, 'Emergency Phone', false);
      if (errors.emergencyPhone) missingRequiredFields.push('Emergency Phone');
    }
    if (patientData.emergencyContact?.trim()) {
      errors.emergencyContact = validateNameField(patientData.emergencyContact, 'Emergency Contact Name', false);
      if (errors.emergencyContact) missingRequiredFields.push('Emergency Contact Name');
    }
    if (patientData.address?.trim()) {
      errors.address = validateAddressField(patientData.address);
      if (errors.address) missingRequiredFields.push('Address');
    }

    // Filter out null errors
    const hasErrors = Object.values(errors).some(error => error !== null);
    if (hasErrors) {
      setValidationErrors(errors);
      
      // Show detailed toast with missing/invalid fields
      if (missingRequiredFields.length > 0) {
        const uniqueMissingFields = [...new Set(missingRequiredFields)];
        const fieldsText = uniqueMissingFields.join(', ');
        toast.error(`Please correct the following fields: ${fieldsText}`);
      }
      return false;
    }

    // Validate email if provided
    if (patientData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(patientData.email)) {
        toast.error('Please enter a valid Email Address');
        return false;
      }
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validatePatientData()) {
      return;
    }

    setLoading(true);

    try {
      const registrationData = {
        patientData,
        emergencyAssessment
      };


      // Call the API
      // Use receptionist2 registration endpoint that handles everything including emergency routing
      const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/patients/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        
        // If a doctor was assigned and patient is emergency, assign patient to doctor
        if (emergencyAssessment.isEmergency && emergencyAssessment.assignedDoctorId) {
          try {
            
            // Get the queue entry ID from the registration result
            // The backend returns patientVisit which contains the queue entry info
            const queueEntryId = result.data?.patientVisit?.id;
            
            if (!queueEntryId) {
              toast.warning('Patient registered successfully, but could not get queue entry ID. Please assign doctor manually.');
            } else {
              // First, fetch the actual queue entry using the visit ID
              const queueResponse = await fetch(
                `${import.meta.env.VITE_API_URL}/receptionist2/patients/ophthalmology-queue`,
                {
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
              
              if (queueResponse.ok) {
                const queueData = await queueResponse.json();
                // Find the queue entry for this patient visit
                const queueEntry = queueData.data?.patients?.find(
                  p => p.visit?.id === queueEntryId
                );
                
                if (queueEntry?.queueEntryId) {
                  
                  await ophthalmologistQueueService.assignDoctorToPatient(
                    queueEntry.queueEntryId,
                    emergencyAssessment.assignedDoctorId
                  );

                  const doctor = Array.isArray(doctorsData?.data) && 
                    doctorsData.data.find(d => d.id === emergencyAssessment.assignedDoctorId);
                  const doctorName = doctor 
                    ? `Dr. ${cleanDoctorName(getDoctorName(doctor))}`
                    : 'Selected Doctor';
                  
                  toast.success(`Patient assigned to ${doctorName}`);
                } else {
                  toast.warning('Patient registered successfully, but could not find queue entry. Please assign doctor manually.');
                }
              } else {
                toast.warning('Patient registered successfully, but could not verify queue entry. Please assign doctor manually.');
              }
            }
          } catch (error) {
            // Don't fail the whole registration, just warn the user
            toast.warning('Patient registered successfully, but doctor assignment had an issue. Please assign doctor manually.');
          }
        }
        
        // Call the completion callback with the result (everything is handled in backend)
        if (onRegistrationComplete) {
          onRegistrationComplete(result.data);
        }
      } else {
        toast.error(result.message || 'Registration failed');
      }

    } catch (error) {
      toast.error('Failed to register patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate between steps
  const nextStep = () => {
    if (currentStep === 1 && !validatePatientData()) {
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-6 w-6 text-blue-600" />
            <span>Patient Registration - Receptionist2</span>
          </CardTitle>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-4 mt-8">
            <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="font-medium">Patient Info</span>
            </div>
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium">Emergency Assessment</span>
            </div>
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="font-medium">Queue Routing</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Step 1: Patient Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Patient Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={patientData.firstName}
                    onChange={(e) => handlePatientDataChange('firstName', e.target.value)}
                    onBlur={() => handleBlur('firstName')}
                    placeholder="Enter first name"
                    className={`mt-1 ${validationErrors.firstName ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.firstName && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={patientData.middleName}
                    onChange={(e) => handlePatientDataChange('middleName', e.target.value)}
                    onBlur={() => handleBlur('middleName')}
                    placeholder="Enter middle name (optional)"
                    className={`mt-1 ${validationErrors.middleName ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.middleName && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.middleName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={patientData.lastName}
                    onChange={(e) => handlePatientDataChange('lastName', e.target.value)}
                    onBlur={() => handleBlur('lastName')}
                    placeholder="Enter last name"
                    className={`mt-1 ${validationErrors.lastName ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.lastName && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={patientData.phone}
                    onChange={(e) => handlePatientDataChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    placeholder="10 digit phone number"
                    maxLength={10}
                    className={`mt-1 ${validationErrors.phone ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={patientData.email}
                    onChange={(e) => handlePatientDataChange('email', e.target.value)}
                    placeholder="patient@example.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={patientData.dateOfBirth}
                    onChange={(e) => handlePatientDataChange('dateOfBirth', e.target.value)}
                    onBlur={() => handleBlur('dateOfBirth')}
                    max={new Date().toISOString().split('T')[0]}
                    className={`mt-1 ${validationErrors.dateOfBirth ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.dateOfBirth && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.dateOfBirth}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={patientData.gender} onValueChange={(value) => {
                    handlePatientDataChange('gender', value);
                    // Clear error when value is selected
                    setValidationErrors(prev => ({ ...prev, gender: null }));
                  }}>
                    <SelectTrigger className={`mt-1 ${validationErrors.gender ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {validationErrors.gender && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.gender}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={patientData.address}
                  onChange={(e) => handlePatientDataChange('address', e.target.value)}
                  onBlur={() => handleBlur('address')}
                  placeholder="Enter complete address"
                  className={`mt-1 ${validationErrors.address ? 'border-red-500' : ''}`}
                  rows={3}
                />
                {validationErrors.address && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.address}</p>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContact"
                    value={patientData.emergencyContact}
                    onChange={(e) => handlePatientDataChange('emergencyContact', e.target.value)}
                    onBlur={() => handleBlur('emergencyContact')}
                    placeholder="Contact person name"
                    className={`mt-1 ${validationErrors.emergencyContact ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.emergencyContact && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.emergencyContact}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={patientData.emergencyPhone}
                    onChange={(e) => handlePatientDataChange('emergencyPhone', e.target.value)}
                    onBlur={() => handleBlur('emergencyPhone')}
                    placeholder="10 digit phone number"
                    maxLength={10}
                    className={`mt-1 ${validationErrors.emergencyPhone ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.emergencyPhone && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.emergencyPhone}</p>
                  )}
                </div>
              </div>
            </div>
            
          )}

          {/* Step 2: Emergency Assessment */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold">Emergency Assessment</h3>
              </div>

              <Card className="border-l-4 border-l-orange-400">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Is this an emergency case?</Label>
                      <p className="text-sm text-gray-600 mb-3">
                        Emergency cases will be sent directly to the ophthalmologist, bypassing the optometrist queue.
                      </p>
                      
                      <RadioGroup
                        value={emergencyAssessment.isEmergency.toString()}
                        onValueChange={(value) => handleEmergencyChange('isEmergency', value === 'true')}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="routine" />
                          <Label htmlFor="routine" className="cursor-pointer">
                            <div className="flex items-center space-x-2">
                              <Eye className="h-4 w-4 text-blue-600" />
                              <span>Routine (Optometrist first)</span>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="true" id="emergency" />
                          <Label htmlFor="emergency" className="cursor-pointer">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span>Emergency (Direct to Doctor)</span>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {emergencyAssessment.isEmergency && (
                      <div className="space-y-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-800">Emergency Case Selected</span>
                          </div>
                          <p className="text-sm text-red-700">
                            This patient will be sent directly to the ophthalmologist queue with emergency priority.
                          </p>
                        </div>

                        {/* Doctor Assignment Section */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <Label htmlFor="assignedDoctor" className="flex items-center space-x-2 font-medium mb-3">
                            <Stethoscope className="h-4 w-4 text-blue-600" />
                            <span>Assign Ophthalmologist (Optional)</span>
                          </Label>
                          <p className="text-sm text-blue-600 mb-3">
                            Select a doctor to assign this patient to immediately. Patient will be added to their queue.
                          </p>
                          
                          {doctorsLoading ? (
                            <div className="flex items-center justify-center py-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              <span className="text-sm text-blue-600">Loading doctors...</span>
                            </div>
                          ) : (
                            <Select 
                              value={emergencyAssessment.assignedDoctorId} 
                              onValueChange={(value) => handleEmergencyChange('assignedDoctorId', value)}
                            >
                              <SelectTrigger className="mt-1" id="assignedDoctor">
                                <SelectValue placeholder="Select a doctor (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray(doctorsData?.data) && doctorsData.data.length > 0 ? (
                                  doctorsData.data.map((doctor) => (
                                    <SelectItem key={doctor.id} value={doctor.id}>
                                      <div className="flex items-center space-x-2">
                                        <span>Dr. {cleanDoctorName(getDoctorName(doctor))}</span>
                                        {doctor.specialization && (
                                          <span className="text-xs text-gray-500">({doctor.specialization})</span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-2 text-sm text-gray-500">No doctors available</div>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                          
                          {emergencyAssessment.assignedDoctorId && (
                            <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                              {doctorsData?.data && (
                                (() => {
                                  const doctor = doctorsData.data.find(d => d.id === emergencyAssessment.assignedDoctorId);
                                  return doctor ? (
                                    <div className="text-sm">
                                      <p className="font-medium text-blue-800">
                                        Selected: Dr. {cleanDoctorName(getDoctorName(doctor))}
                                      </p>
                                      {doctor.specialization && (
                                        <p className="text-xs text-gray-600">{doctor.specialization}</p>
                                      )}
                                    </div>
                                  ) : null;
                                })()
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="notes" className="text-base font-medium">Notes</Label>
                      <p className="text-sm text-gray-600 mb-2">
                        Add any relevant information about the patient's condition, symptoms, or special requirements.
                      </p>
                      <Textarea
                        id="notes"
                        value={emergencyAssessment.notes}
                        onChange={(e) => handleEmergencyChange('notes', e.target.value)}
                        placeholder="Enter any relevant notes about the patient's condition, symptoms, or special requirements..."
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Queue Routing Summary */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Queue Routing Summary</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Patient Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-medium">Name:</span> {patientData.firstName} {patientData.middleName} {patientData.lastName}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {patientData.phone}
                    </div>
                    {patientData.email && (
                      <div>
                        <span className="font-medium">Email:</span> {patientData.email}
                      </div>
                    )}
                    {patientData.dateOfBirth && (
                      <div>
                        <span className="font-medium">DOB:</span> {new Date(patientData.dateOfBirth).toLocaleDateString()}
                      </div>
                    )}
                    {patientData.gender && (
                      <div>
                        <span className="font-medium">Gender:</span> {patientData.gender}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Queue Routing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Queue Routing</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Case Type:</span>
                      <Badge variant={emergencyAssessment.isEmergency ? "destructive" : "default"}>
                        {emergencyAssessment.isEmergency ? "Emergency" : "Routine"}
                      </Badge>
                    </div>
                    
                    <div>
                      <span className="font-medium">Target Queue:</span>
                      <div className="mt-1">
                        {emergencyAssessment.isEmergency ? (
                          <div className="flex items-center space-x-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Ophthalmologist (Emergency Priority)</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-blue-600">
                            <Eye className="h-4 w-4" />
                            <span>Optometrist (Routine)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {emergencyAssessment.notes && (
                      <div>
                        <span className="font-medium">Notes:</span>
                        <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                          {emergencyAssessment.notes}
                        </p>
                      </div>
                    )}

                    {emergencyAssessment.isEmergency && emergencyAssessment.assignedDoctorId && (
                      <div className="pt-2 border-t">
                        <span className="font-medium">Assigned Doctor:</span>
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          {doctorsData?.data && (() => {
                            const doctor = doctorsData.data.find(d => d.id === emergencyAssessment.assignedDoctorId);
                            return doctor ? (
                              <div className="flex items-center space-x-3">
                                <Stethoscope className="h-5 w-5 text-blue-600" />
                                <div>
                                  <p className="font-medium text-blue-800">
                                    Dr. {cleanDoctorName(getDoctorName(doctor))}
                                  </p>
                                  {doctor.specialization && (
                                    <p className="text-xs text-blue-600">{doctor.specialization}</p>
                                  )}
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {emergencyAssessment.isEmergency && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Emergency Case - Important</span>
                  </div>
                  <p className="text-sm text-red-700">
                    This patient will bypass the optometrist queue and be sent directly to the ophthalmologist with emergency priority. 
                    Please ensure the doctor is notified immediately.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <div className="flex space-x-2">
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>

            <div>
              {currentStep < 3 ? (
                <Button onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registering...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Registration
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Receptionist2PatientRegistration;