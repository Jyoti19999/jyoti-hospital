import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck, Calendar, Mail, Phone, Users } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { usePatientMutations, validatePatientData } from '@/services/patientService';
import { useToast } from '@/components/ui/use-toast';

const MinimalInfoStep = ({ data, onUpdate, onNext }) => {
  const [age, setAge] = useState(data.age);
  const [validationErrors, setValidationErrors] = useState({});
  const { toast } = useToast();

  // Validation functions
  const validateNameField = (value) => {
    if (!value) return '';
    const nameRegex = /^[a-zA-Z\s]*$/;
    if (!nameRegex.test(value)) {
      return 'Only letters and spaces allowed';
    }
    return '';
  };

  const validatePhoneField = (value) => {
    if (!value) return '';
    const phoneRegex = /^[0-9]*$/;
    if (!phoneRegex.test(value)) {
      return 'Only numbers allowed';
    }
    if (value.length !== 10 && value.length > 0) {
      return 'Phone must be exactly 10 digits';
    }
    return '';
  };

  // Handle blur validation
  const handleBlur = (field) => {
    let error = '';
    const value = data[field];

    if (field === 'firstName' || field === 'middleName' || field === 'lastName') {
      error = validateNameField(value);
    } else if (field === 'mobileNumber') {
      error = validatePhoneField(value);
    }

    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  // Handle data change with length enforcement
  const handleDataChange = (field, value) => {
    // Enforce length limits
    if (field === 'mobileNumber' && value.length > 10) return;

    onUpdate({ [field]: value });
  };

  // Get mutation configurations
  const mutations = usePatientMutations();
  
  // Setup send OTP mutation
  const sendOTPMutation = useMutation({
    ...mutations.sendOTP,
    onSuccess: (response) => {
      toast({
        title: "OTP Sent Successfully",
        description: "Please check your email and mobile for the verification code.",
        duration: 5000,
      });
      onNext(); // Proceed to OTP verification step
    },
    onError: (error) => {
      toast({
        title: "Failed to Send OTP",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleDateOfBirthChange = (value) => {
    onUpdate({ dateOfBirth: value });
    if (value) {
      const calculatedAge = calculateAge(value);
      setAge(calculatedAge);
      onUpdate({ age: calculatedAge });
    }
  };

  const isValid = () => {
    const validation = {
      firstName: validatePatientData.name(data.firstName),
      middleName: validatePatientData.name(data.middleName),
      lastName: validatePatientData.name(data.lastName),
      dateOfBirth: validatePatientData.dateOfBirth(data.dateOfBirth),
      gender: validatePatientData.gender(data.gender),
      email: validatePatientData.email(data.email),
      mobileNumber: validatePatientData.mobileNumber(data.mobileNumber)
    };
    
    
    return Object.values(validation).every(v => v === true);
  };

  const handleNext = () => {
    if (!isValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    // Send OTP with all patient information including personal details
    sendOTPMutation.mutate({
      firstName: data.firstName.trim(),
      middleName: data.middleName.trim(),
      lastName: data.lastName.trim(),
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      email: data.email.trim(),
      mobileNumber: data.mobileNumber.trim()
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Basic Information</h2>
        <p className="text-gray-600 text-sm">Please provide your essential details for quick registration</p>
      </div>

      {/* Personal Details Section */}
      <div className="space-y-4">
        {/* Name Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="firstName" className="flex items-center gap-2 text-sm">
              <UserCheck className="h-3 w-3 text-blue-600" />
              First Name *
            </Label>
            <Input
              id="firstName"
              value={data.firstName}
              onChange={(e) => handleDataChange('firstName', e.target.value)}
              onBlur={() => handleBlur('firstName')}
              placeholder="Enter your first name"
              className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9 ${validationErrors.firstName ? 'border-red-500' : ''}`}
              required
            />
            {validationErrors.firstName && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.firstName}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="middleName" className="flex items-center gap-2 text-sm">
              <UserCheck className="h-3 w-3 text-blue-600" />
              Middle Name *
            </Label>
            <Input
              id="middleName"
              value={data.middleName}
              onChange={(e) => handleDataChange('middleName', e.target.value)}
              onBlur={() => handleBlur('middleName')}
              placeholder="Enter your middle name"
              className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9 ${validationErrors.middleName ? 'border-red-500' : ''}`}
              required
            />
            {validationErrors.middleName && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.middleName}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="lastName" className="flex items-center gap-2 text-sm">
              <UserCheck className="h-3 w-3 text-blue-600" />
              Last Name *
            </Label>
            <Input
              id="lastName"
              value={data.lastName}
              onChange={(e) => handleDataChange('lastName', e.target.value)}
              onBlur={() => handleBlur('lastName')}
              placeholder="Enter your last name"
              className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9 ${validationErrors.lastName ? 'border-red-500' : ''}`}
              required
            />
            {validationErrors.lastName && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.lastName}</p>
            )}
          </div>
        </div>

        {/* Date of Birth, Age and Gender - Compact Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="dateOfBirth" className="flex items-center gap-2 text-sm">
              <Calendar className="h-3 w-3 text-blue-600" />
              Date of Birth *
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => handleDateOfBirthChange(e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9"
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-1">
            <Label className="flex items-center gap-2 text-sm">
              <Calendar className="h-3 w-3 text-blue-600" />
              Age
            </Label>
            <div className="h-9 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center">
              {age !== null && age !== undefined ? (
                <Badge variant="secondary" className="text-sm font-semibold bg-blue-100 text-blue-800">
                  {age} years old
                </Badge>
              ) : (
                <span className="text-gray-500 text-sm">Auto-calculated</span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="gender" className="flex items-center gap-2 text-sm">
              <Users className="h-3 w-3 text-blue-600" />
              Gender *
            </Label>
            <Select value={data.gender} onValueChange={(value) => onUpdate({ gender: value })}>
              <SelectTrigger className="h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
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

        {/* Email and Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm">
              <Mail className="h-3 w-3 text-blue-600" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              placeholder="Enter your email address"
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="mobileNumber" className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-blue-600" />
              Mobile Number *
            </Label>
            <Input
              id="mobileNumber"
              type="tel"
              value={data.mobileNumber}
              onChange={(e) => handleDataChange('mobileNumber', e.target.value)}
              onBlur={() => handleBlur('mobileNumber')}
              placeholder="10 digit phone number"
              className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9 ${validationErrors.mobileNumber ? 'border-red-500' : ''}`}
              required
              maxLength={10}
            />
            {validationErrors.mobileNumber && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.mobileNumber}</p>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          We'll send a verification code to both your email and mobile number
        </p>
        
        {/* Debug Section - Remove in production */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs">
            <strong>Debug Info:</strong>
            <br />
            Form Valid: {isValid() ? '✅ Yes' : '❌ No'}
            <br />
            Mutation Pending: {sendOTPMutation.isPending ? '🔄 Yes' : '✅ No'}
            <br />
            Button Disabled: {(!isValid() || sendOTPMutation.isPending) ? '🔒 Yes' : '🔓 No'}
            <br />
            <br />
            <strong>Field Validation:</strong>
            <br />
            First Name: {validatePatientData.name(data.firstName) ? '✅' : '❌'} ({data.firstName || 'empty'})
            <br />
            Last Name: {validatePatientData.name(data.lastName) ? '✅' : '❌'} ({data.lastName || 'empty'})
            <br />
            Date of Birth: {validatePatientData.dateOfBirth(data.dateOfBirth) ? '✅' : '❌'} ({data.dateOfBirth || 'empty'})
            <br />
            Gender: {validatePatientData.gender(data.gender) ? '✅' : '❌'} ({data.gender || 'empty'})
            <br />
            Email: {validatePatientData.email(data.email) ? '✅' : '❌'} ({data.email || 'empty'})
            <br />
            Mobile: {validatePatientData.mobileNumber(data.mobileNumber) ? '✅' : '❌'} ({data.mobileNumber || 'empty'})
          </div>
        )} */}
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleNext}
          disabled={!isValid() || sendOTPMutation.isPending}
          className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {sendOTPMutation.isPending ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending OTP...</span>
            </div>
          ) : (
            'Next: Verify Details'
          )}
        </Button>
      </div>
    </div>
  );
};

export default MinimalInfoStep;