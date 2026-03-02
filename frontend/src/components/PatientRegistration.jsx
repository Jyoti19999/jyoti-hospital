// src/components/PatientRegistration.jsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, QrCode, User, Loader2, Users, Phone, Mail, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const PatientRegistration = () => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [existingPatients, setExistingPatients] = useState([]);
  const [showExistingPatientsDialog, setShowExistingPatientsDialog] = useState(false);
  const [selectedReferringPatient, setSelectedReferringPatient] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    allergies: ""
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Validation functions
  const validateNameField = (value, fieldName) => {
    const nameRegex = /^[a-zA-Z\s]*$/;
    if (!value.trim()) {
      return `${fieldName} is required`;
    }
    if (!nameRegex.test(value)) {
      return `${fieldName} can only contain letters and spaces`;
    }
    return null;
  };

  const validatePhoneField = (value, fieldName) => {
    const phoneRegex = /^[0-9]*$/;
    if (!value.trim()) {
      return `${fieldName} is required`;
    }
    if (!phoneRegex.test(value)) {
      return `${fieldName} can only contain numbers`;
    }
    if (value.length !== 10) {
      return `${fieldName} must be exactly 10 digits`;
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

  const validateAllergyField = (value) => {
    const allergyRegex = /^[a-zA-Z\s,-]*$/;
    if (value.trim() && !allergyRegex.test(value)) {
      return "Allergies can only contain letters, spaces, commas, and hyphens";
    }
    return null;
  };

  const handleBlur = async (fieldName) => {
    let error = null;
    const value = formData[fieldName];

    if (fieldName === 'firstName') {
      error = validateNameField(value, 'First name');
    } else if (fieldName === 'middleName') {
      error = validateNameField(value, 'Middle name');
    } else if (fieldName === 'lastName') {
      error = validateNameField(value, 'Last name');
    } else if (fieldName === 'phone') {
      error = validatePhoneField(value, 'Phone number');
      // Note: existing patients check now happens in handleInputChange when length reaches 10
    } else if (fieldName === 'emergencyPhone' && value.trim()) {
      error = validatePhoneField(value, 'Emergency phone');
    } else if (fieldName === 'emergencyContact' && value.trim()) {
      error = validateNameField(value, 'Emergency contact name');
    } else if (fieldName === 'address' && value.trim()) {
      error = validateAddressField(value);
    } else if (fieldName === 'allergies' && value.trim()) {
      error = validateAllergyField(value);
    }

    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  // Check for existing patients by phone number
  const checkForExistingPatients = async (phone) => {
    try {
      setCheckingPhone(true);

      const response = await fetch(
        `${API_BASE_URL}/staff/check-existing-patients-by-phone?phone=${phone}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      const result = await response.json();
      
      if (response.ok && result.success) {
        if (result.data.hasExistingPatients) {
          setExistingPatients(result.data.patients);
          setShowExistingPatientsDialog(true);
        } else {
          setExistingPatients([]);
        }
      }
    } catch (error) {
      // Don't show error toast, just continue with registration
    } finally {
      setCheckingPhone(false);
    }
  };

  const handleInputChange = (fieldName, value) => {
    // Enforce max length for phone fields
    if ((fieldName === 'phone' || fieldName === 'emergencyPhone') && value.length > 10) {
      return;
    }

    setFormData({ ...formData, [fieldName]: value });

    // Check for existing patients when phone number reaches 10 digits
    if (fieldName === 'phone' && value.length === 10) {
      const phoneError = validatePhoneField(value, 'Phone number');
      if (!phoneError) {
        checkForExistingPatients(value);
      }
    }

    // Clear validation error when user starts typing
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };

  const handleCheckIn = async () => {
    if (!registrationResult?.appointment?.tokenNumber) {
      toast.error('No appointment token available for check-in');
      return;
    }

    setCheckingIn(true);
    try {
      
      const checkInResponse = await fetch(`${API_BASE_URL}/staff/patient/checkin`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenNumber: registrationResult.appointment.tokenNumber,
          priorityLabel: 'ROUTINE'
        })
      });

      const checkInData = await checkInResponse.json();
      
      if (checkInResponse.ok) {
        
        const queueInfo = checkInData.data?.queueInfo;
        toast.success(
          `Patient Checked In Successfully!\n` +
          `Queue Position: ${queueInfo?.queueNumber || 'N/A'}`,
          { duration: 5000 }
        );
        
        setShowSuccessModal(false);
        setRegistrationResult(null);
      } else {
        throw new Error(checkInData.message || 'Check-in failed');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to check in patient');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    const errors = {};
    errors.firstName = validateNameField(formData.firstName, 'First name');
    errors.middleName = validateNameField(formData.middleName, 'Middle name');
    errors.lastName = validateNameField(formData.lastName, 'Last name');
    errors.phone = validatePhoneField(formData.phone, 'Phone number');
    
    // Check optional fields if they have values
    if (formData.emergencyPhone?.trim()) {
      errors.emergencyPhone = validatePhoneField(formData.emergencyPhone, 'Emergency phone');
    }
    if (formData.emergencyContact?.trim()) {
      errors.emergencyContact = validateNameField(formData.emergencyContact, 'Emergency contact name');
    }
    if (formData.address?.trim()) {
      errors.address = validateAddressField(formData.address);
    }
    if (formData.allergies?.trim()) {
      errors.allergies = validateAllergyField(formData.allergies);
    }

    // Filter out null errors
    const hasErrors = Object.values(errors).some(error => error !== null);
    if (hasErrors) {
      setValidationErrors(errors);
      toast.error('Please fix all validation errors before submitting');
      return;
    }
    
    try {
      setLoading(true);

      // Prepare payload - only include non-empty optional fields
      const payload = {
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender
      };

      // Add referral information if a referrer is selected
      if (selectedReferringPatient) {
        payload.referredBy = selectedReferringPatient.id;
        payload.isReferred = true;
      }

      // Add optional fields only if provided
      if (formData.email?.trim()) {
        payload.email = formData.email.trim();
      }
      if (formData.address?.trim()) {
        payload.address = formData.address.trim();
      }
      if (formData.emergencyContact?.trim()) {
        payload.emergencyContact = formData.emergencyContact.trim();
      }
      if (formData.emergencyPhone?.trim()) {
        payload.emergencyPhone = formData.emergencyPhone.trim();
      }
      if (formData.allergies?.trim()) {
        // Convert allergies string to array
        payload.allergies = formData.allergies
          .split(',')
          .map(allergy => allergy.trim())
          .filter(allergy => allergy.length > 0);
      }


      const response = await fetch(`${API_BASE_URL}/staff/register-by-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });


      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to register patient');
      }

      if (result.success) {
        const { patient, appointment, temporaryPassword, emailSent } = result.data;

        // Store registration result and show modal
        setRegistrationResult({
          patient,
          appointment,
          temporaryPassword,
          emailSent
        });
        setShowSuccessModal(true);

        // Reset form after successful registration
        setFormData({
          firstName: "",
          middleName: "",
          lastName: "",
          phone: "",
          email: "",
          dateOfBirth: "",
          gender: "",
          address: "",
          emergencyContact: "",
          emergencyPhone: "",
          allergies: ""
        });
        setValidationErrors({});
        setSelectedReferringPatient(null); // Clear selected referrer
        setExistingPatients([]); // Clear existing patients list

        // Invalidate queries to refresh dashboard stats
        queryClient.invalidateQueries({ queryKey: ['dashboardStatistics'] });
        queryClient.invalidateQueries({ queryKey: ['todayAppointments'] });

        // Log additional info for staff
      }
    } catch (error) {
      toast.error(error.message || 'Failed to register patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5 text-blue-600" />
          <span>Patient Registration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto pr-2 pl-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                onBlur={() => handleBlur('firstName')}
                required
                disabled={loading}
                className={validationErrors.firstName ? 'border-red-500' : ''}
              />
              {validationErrors.firstName && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.firstName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="middleName">Middle Name *</Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => handleInputChange('middleName', e.target.value)}
                onBlur={() => handleBlur('middleName')}
                required
                disabled={loading}
                className={validationErrors.middleName ? 'border-red-500' : ''}
              />
              {validationErrors.middleName && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.middleName}</p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                onBlur={() => handleBlur('lastName')}
                required
                disabled={loading}
                className={validationErrors.lastName ? 'border-red-500' : ''}
              />
              {validationErrors.lastName && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="10 digit phone number"
                maxLength={10}
                required
                disabled={loading}
                className={validationErrors.phone ? 'border-red-500' : ''}
              />
              {validationErrors.phone && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
              )}
              {checkingPhone && (
                <div className="flex items-center gap-2 mt-2 text-xs text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Checking for existing patients...</span>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="patient@example.com"
                disabled={loading}
              />
            </div>
          </div>

          {selectedReferringPatient && (
            <div className="col-span-2 -mt-2">
              <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                <span className="text-sm text-gray-700">
                  Referred to: <span className="font-semibold text-green-700">{selectedReferringPatient.fullName}</span>
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                required
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                disabled={loading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              placeholder="Enter patient's address"
              rows={2}
              disabled={loading}
              className={validationErrors.address ? 'border-red-500' : ''}
            />
            {validationErrors.address && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                onBlur={() => handleBlur('emergencyContact')}
                placeholder="Contact person name"
                disabled={loading}
                className={validationErrors.emergencyContact ? 'border-red-500' : ''}
              />
              {validationErrors.emergencyContact && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.emergencyContact}</p>
              )}
            </div>
            <div>
              <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                onBlur={() => handleBlur('emergencyPhone')}
                placeholder="10 digit phone number"
                maxLength={10}
                disabled={loading}
                className={validationErrors.emergencyPhone ? 'border-red-500' : ''}
              />
              {validationErrors.emergencyPhone && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.emergencyPhone}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="allergies">Known Allergies</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => handleInputChange('allergies', e.target.value)}
              onBlur={() => handleBlur('allergies')}
              placeholder="List allergies separated by commas (e.g., Penicillin, Peanuts, Latex)"
              rows={2}
              disabled={loading}
              className={validationErrors.allergies ? 'border-red-500' : ''}
            />
            {validationErrors.allergies && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.allergies}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Separate multiple allergies with commas</p>
          </div>

          <Button 
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registering Patient...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4 mr-2" />
                Register Patient & Book Appointment
              </>
            )}
          </Button>
          </div>
        </div>
      </CardContent>

      {/* Existing Patients Dialog */}
      <Dialog open={showExistingPatientsDialog} onOpenChange={(open) => {
        if (!open && !selectedReferringPatient) {
          // Prevent closing without selection
          return;
        }
        setShowExistingPatientsDialog(open);
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              Existing Patient(s) Found
            </DialogTitle>
            <DialogDescription className="text-base font-normal">
              We found {existingPatients.length} existing patient{existingPatients.length > 1 ? 's' : ''} with phone number <strong className="font-semibold">{formData.phone}</strong>
            </DialogDescription>
          </DialogHeader>

          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 font-normal">
              Please select an existing patient to link this new registration as a referral. This helps track patient relationships and family connections.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select a patient to link as referrer:
            </h4>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {existingPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => setSelectedReferringPatient(
                    selectedReferringPatient?.id === patient.id ? null : patient
                  )}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedReferringPatient?.id === patient.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-semibold text-lg text-gray-900">
                          {patient.fullName}
                        </h5>
                        <Badge variant="outline" className="text-xs">
                          {patient.patientNumber}
                        </Badge>
                        {patient.mrn && (
                          <Badge variant="secondary" className="text-xs">
                            MRN: {patient.mrn}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{patient.phone}</span>
                        </div>
                        {patient.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{patient.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="capitalize">{patient.gender}</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Visits: {patient._count.patientVisits}</span>
                          <span>Registered: {new Date(patient.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {selectedReferringPatient?.id === patient.id && (
                      <div className="ml-3">
                        <div className="bg-blue-600 text-white rounded-full p-2">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              onClick={() => {
                if (selectedReferringPatient) {
                  toast.success(`Will link to ${selectedReferringPatient.fullName}`);
                  setShowExistingPatientsDialog(false);
                } else {
                  toast.error('Please select a patient to link as referrer');
                }
              }}
              disabled={!selectedReferringPatient}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Continue with Selected Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration Success Modal - Compact Blue Theme */}
      <Dialog open={showSuccessModal} onOpenChange={(open) => {
        if (!open && !checkingIn) {
          setShowSuccessModal(false);
          setRegistrationResult(null);
        }
      }}>
        <DialogContent className="max-w-md bg-gradient-to-br from-blue-50 to-blue-100" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-700 flex items-center gap-2">
              <span className="text-2xl">✅</span> Registration Successful
            </DialogTitle>
          </DialogHeader>

          {registrationResult && (
            <div className="space-y-3 py-2">
              {/* Patient Info - Compact */}
              <div className="bg-white/60 p-3 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-blue-600 text-xs font-medium">Patient Name</p>
                    <p className="font-semibold text-gray-900 truncate">
                      {registrationResult.patient.firstName} {registrationResult.patient.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs font-medium">Patient #</p>
                    <p className="font-semibold text-gray-900">{registrationResult.patient.patientNumber}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs font-medium">Token Number</p>
                    <p className="font-bold text-blue-700 text-lg">{registrationResult.appointment?.tokenNumber}</p>
                  </div>
                  <div>
                    <p className="text-blue-600 text-xs font-medium">Phone</p>
                    <p className="font-semibold text-gray-900">{registrationResult.patient.phone}</p>
                  </div>
                </div>
              </div>

              {/* Login Credentials - Compact */}
              {registrationResult.temporaryPassword && (
                <div className="bg-blue-600 text-white p-3 rounded-lg space-y-2">
                  <p className="text-xs font-semibold opacity-90">Login Credentials</p>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs opacity-80">Username:</span>
                      <span className="font-mono font-bold">{registrationResult.patient.patientNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs opacity-80">Password:</span>
                      <span className="font-mono font-bold">{registrationResult.temporaryPassword}</span>
                    </div>
                  </div>
                  <p className="text-xs opacity-75 mt-2">⚠️ Share these credentials with patient</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessModal(false);
                setRegistrationResult(null);
              }}
              disabled={checkingIn}
              className="flex-1"
            >
              Close
            </Button>
            {registrationResult?.appointment && (
              <Button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {checkingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking In...
                  </>
                ) : (
                  'Check In Now'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PatientRegistration;