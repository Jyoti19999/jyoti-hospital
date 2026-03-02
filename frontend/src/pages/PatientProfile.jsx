// src\pages\PatientProfile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import QRCodeDisplay from '@/components/appointments/QRCodeDisplay';
import { Eye, User, Phone, Heart, Shield, Bell, FileText, Download, Settings, AlertCircle, LayoutDashboard, Calendar, QrCode, CheckCircle, Clock, MapPin, DollarSign, LogOut, Camera, Loader2, Menu } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PhotoUpload } from '@/components/profile/PhotoUpload';
import { PersonalInfoSection } from '@/components/profile/PersonalInfoSection';
import { ContactInfoSection } from '@/components/profile/ContactInfoSection';
import MedicalHistoryProfile from '@/components/profile/MedicalHistoryProfile';
import InsuranceEmergencyProfile from '@/components/profile/InsuranceEmergencyProfile';
import ConsentVerificationProfile from '@/components/profile/ConsentVerificationProfile';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import useAppointmentStore from '@/stores/appointment';
import useQRAppointmentStore from '@/stores/qrAppointment';
import AppointmentQRCard from '@/components/appointments/AppointmentQRCard';
import patientService from '@/services/patientService';

const PatientProfile = () => {
  const { toast } = useToast();
  const { user, isLoading, logout, fetchPatientProfile } = useAuth();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  
  // Get appointment data from store
  const { 
    getActiveAppointment,
    patientUID 
  } = useAppointmentStore();
  
  const { 
    getFormattedAppointment, 
    isAppointmentValid, 
    patientInfo, 
    appointmentDetails, 
    qrCodeData,
    currentAppointment 
  } = useQRAppointmentStore();
  
  const activeAppointment = getActiveAppointment();
  const formattedAppointment = getFormattedAppointment();
  const hasValidQRAppointment = isAppointmentValid();

  // Function to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  };

  // Function to calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Handle profile photo upload
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid image file (JPEG, PNG, GIF, or WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64String = e.target.result;
          
          // Call API to update profile photo
          const response = await patientService.updateProfilePhoto(base64String);
          
          if (response.success) {
            toast({
              title: "Success",
              description: "Profile photo updated successfully",
            });

            // Refresh patient profile to get updated data
            await fetchPatientProfile();
          } else {
            throw new Error(response.message || 'Failed to update profile photo');
          }
        } catch (error) {
          toast({
            title: "Upload Failed",
            description: error.message || "Failed to upload profile photo. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsUploadingPhoto(false);
        }
      };

      reader.onerror = () => {
        toast({
          title: "Upload Failed",
          description: "Failed to read the image file. Please try again.",
          variant: "destructive",
        });
        setIsUploadingPhoto(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
      setIsUploadingPhoto(false);
    }
  };

  const triggerPhotoUpload = () => {
    if (!isUploadingPhoto) {
      fileInputRef.current?.click();
    }
  };

  // Initialize patient data from auth context
  const [patientData, setPatientData] = useState({
    personalInfo: {
      title: user?.gender === 'male' ? 'Mr.' : user?.gender === 'female' ? 'Ms.' : 'Not Specified',
      firstName: user?.firstName || 'Not Available',
      lastName: user?.lastName || 'Not Available',
      dateOfBirth: formatDateForDisplay(user?.dateOfBirth) || 'Not Available',
      gender: user?.gender || 'Not Specified',
      bloodGroup: user?.bloodGroup || 'Not Updated', // Use user data if available
      nationality: 'Not Updated', // Not available in auth data
      preferredLanguage: 'Not Updated' // Not available in auth data
    },
    contactInfo: {
      primaryPhone: user?.phone || 'Not Available',
      secondaryPhone: 'Not Updated', // Not available in auth data
      email: user?.email || 'Not Available',
      currentAddress: {
        street: 'Not Updated',
        city: '',
        state: '',
        pincode: '',
        country: ''
      },
      permanentAddress: {
        street: 'Not Updated',
        city: '',
        state: '',
        pincode: '',
        country: ''
      },
      sameAsCurrent: false
    },
    medicalHistory: {
      allergies: [], // Empty - will show "Not Updated" in component
      chronicConditions: [], // Empty - will show "Not Updated" in component
      currentMedications: [], // Empty - will show "Not Updated" in component
      previousSurgeries: [], // Empty - will show "Not Updated" in component
      familyHistory: [], // Empty - will show "Not Updated" in component
      lifestyle: {
        smoking: 'Not Updated',
        drinking: 'Not Updated',
        exercise: 'Not Updated',
        screenTime: 'Not Updated',
        eyeStrain: 'Not Updated'
      }
    },
    insuranceEmergency: {
      hasInsurance: false, // Default to false since not in auth data
      paymentMethod: 'Not Updated',
      provider: 'Not Updated',
      policyNumber: 'Not Updated',
      policyType: 'Not Updated',
      policyHolderName: user ? `${user.firstName} ${user.lastName}` : 'Not Available',
      policyHolderRelation: 'Self',
      validityDate: 'Not Updated',
      coverageAmount: 'Not Updated',
      coPaymentPercentage: 'Not Updated',
      tpaName: 'Not Updated',
      emergencyContacts: [] // Empty - will show "Not Updated" in component
    },
    consentVerification: {
      medicalConsent: false, // Default to false since not in auth data
      privacyPolicy: false, // Default to false since not in auth data
      marketingConsent: false,
      appointmentReminders: {
        sms: false,
        email: false,
        whatsapp: false
      },
      healthNewsletters: {
        daily: false,
        weekly: false,
        monthly: false
      },
      promotionalOffers: false,
      researchParticipation: false,
      photoVideoConsent: false,
      abhaId: 'Not Updated',
      abhaIdVerified: false,
      otpVerified: true, // Keep true since they logged in
      digitalSignature: 'Not Updated',
      documentsUploaded: {
        governmentId: undefined,
        addressProof: undefined,
        insuranceCard: undefined,
        medicalRecords: []
      }
    },
    profilePhoto: null, // Add profilePhoto field
    photo: null
  });

  // Update patient data when user data changes
  useEffect(() => {
    if (user) {
      setPatientData(prev => ({
        ...prev,
        profilePhoto: user.profilePhoto || null, // Add profile photo mapping
        personalInfo: {
          ...prev.personalInfo,
          title: user.gender === 'male' ? 'Mr.' : user.gender === 'female' ? 'Ms.' : 'Not Specified',
          firstName: user.firstName || 'Not Available',
          lastName: user.lastName || 'Not Available',
          dateOfBirth: formatDateForDisplay(user.dateOfBirth) || 'Not Available',
          gender: user.gender ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) : 'Not Specified',
          bloodGroup: user.bloodGroup || 'Not Updated', // Add blood group mapping
        },
        contactInfo: {
          ...prev.contactInfo,
          primaryPhone: user.phone || 'Not Available',
          email: user.email || 'Not Available',
          currentAddress: {
            ...prev.contactInfo.currentAddress,
            street: 'Not Updated',
            city: '',
            state: '',
            pincode: '',
            country: ''
          },
          permanentAddress: {
            ...prev.contactInfo.permanentAddress,
            street: 'Not Updated',
            city: '',
            state: '',
            pincode: '',
            country: ''
          }
        },
        medicalHistory: {
          allergies: user.allergies || [],
          chronicConditions: user.chronicConditions || [],
          currentMedications: user.currentMedications || [],
          previousSurgeries: user.previousSurgeries || [],
          familyHistory: user.familyHistory || [],
          lifestyle: user.lifestyle || {
            smoking: 'Never',
            drinking: 'Never', 
            exercise: 'None',
            screenTime: 'Less than 2 hours',
            eyeStrain: 'No'
          },
          bloodGroup: user.bloodGroup || '',
          eyeHistory: user.eyeHistory || {},
          visionHistory: user.visionHistory || {},
          riskFactors: user.riskFactors || {}
        },
        insuranceEmergency: {
          ...prev.insuranceEmergency,
          policyHolderName: `${user.firstName || 'Not Available'} ${user.lastName || ''}`,
        }
      }));
    }
  }, [user]);

  const handlePersonalInfoUpdate = (info) => {
    setPatientData(prev => ({
      ...prev,
      personalInfo: info
    }));
  };

  const handleContactInfoUpdate = (info) => {
    // Since we're using user data directly for ContactInfoSection,
    // we might not need to update patientData.contactInfo anymore
    // But keeping this for compatibility with other parts of the UI
    setPatientData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        // Map the new structure to old structure for compatibility
        primaryPhone: info.phone || prev.contactInfo.primaryPhone,
        email: info.email || prev.contactInfo.email,
        currentAddress: {
          ...prev.contactInfo.currentAddress,
          street: info.address || prev.contactInfo.currentAddress.street
        }
      }
    }));
  };

  const handleMedicalHistoryUpdate = (data) => {
    setPatientData(prev => ({
      ...prev,
      medicalHistory: { ...prev.medicalHistory, ...data }
    }));
  };

  const handleInsuranceEmergencyUpdate = (data) => {
    setPatientData(prev => ({
      ...prev,
      insuranceEmergency: { ...prev.insuranceEmergency, ...data }
    }));
  };

  const handleConsentVerificationUpdate = (data) => {
    setPatientData(prev => ({
      ...prev,
      consentVerification: { ...prev.consentVerification, ...data }
    }));
  };

  const handlePhotoUpdate = (photo) => {
    setPatientData(prev => ({
      ...prev,
      photo
    }));
  };

  const handleSave = (section) => {
    toast({
      title: "Profile Updated",
      description: `Your ${section} has been successfully updated.`,
    });
  };

  const calculateOverallCompletion = () => {
    let totalScore = 0;
    
    // Basic info completion (25%)
    const basicInfoFields = [
      patientData.personalInfo.firstName !== 'Not Available',
      patientData.personalInfo.lastName !== 'Not Available',
      patientData.personalInfo.dateOfBirth !== 'Not Available',
      patientData.personalInfo.gender !== 'Not Specified',
      user?.phone && user.phone !== '',
      user?.email && user.email !== ''
    ];
    const basicInfoScore = (basicInfoFields.filter(Boolean).length / basicInfoFields.length) * 25;
    totalScore += basicInfoScore;
    
    // Contact/Address completion (15%)
    const addressComplete = user?.address && user.address !== '' && user.address !== 'Not Updated';
    const contactScore = addressComplete ? 15 : 0;
    totalScore += contactScore;
    
    // Medical history completion (25%)
    const medicalComplete = patientData.medicalHistory.allergies.length > 0 ||
                           patientData.medicalHistory.chronicConditions.length > 0 ||
                           patientData.medicalHistory.currentMedications.length > 0;
    const medicalScore = medicalComplete ? 25 : 0;
    totalScore += medicalScore;
    
    // Insurance completion (20%)
    const insuranceComplete = patientData.insuranceEmergency.hasInsurance &&
                             patientData.insuranceEmergency.provider !== 'Not Updated';
    const insuranceScore = insuranceComplete ? 20 : 0;
    totalScore += insuranceScore;
    
    // Consent completion (15%)
    const consentComplete = patientData.consentVerification.medicalConsent &&
                           patientData.consentVerification.privacyPolicy;
    const consentScore = consentComplete ? 15 : 0;
    totalScore += consentScore;
    
    return Math.round(totalScore);
  };

  const hasUrgentItems = () => {
    const missingBasicInfo = patientData.personalInfo.firstName === 'Not Available' ||
                            patientData.personalInfo.lastName === 'Not Available' ||
                            !user?.phone || user.phone === '' ||
                            !user?.email || user.email === '';
    
    const missingAddress = !user?.address || user.address === '' || user.address === 'Not Updated';
    
    const missingEssentialConsents = !patientData.consentVerification.medicalConsent ||
                                   !patientData.consentVerification.privacyPolicy;
    
    const insuranceExpiring = patientData.insuranceEmergency.validityDate !== 'Not Updated' &&
      new Date(patientData.insuranceEmergency.validityDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    return missingBasicInfo || missingAddress || missingEssentialConsents || insuranceExpiring;
  };

  // Show loading state while user data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-x-hidden">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 overflow-hidden">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold text-slate-800 leading-tight">
                  <span className="hidden sm:inline">Patient Profile</span>
                  <span className="sm:hidden">Profile</span>
                </h1>
                <p className="text-xs text-slate-500 truncate">
                  Welcome, {user?.firstName}
                  <span className="hidden sm:inline"> {user?.lastName}{user?.patientNumber && ` (#${user.patientNumber})`}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Progress — hidden on mobile, shown inside hamburger */}
              <div className="hidden sm:flex items-center space-x-2">
                <Progress value={calculateOverallCompletion()} className="w-24 h-2" />
                <span className="text-sm text-gray-600">{calculateOverallCompletion()}%</span>
              </div>
              {hasUrgentItems() && (
                <Badge variant="destructive" className="hidden sm:flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span className="hidden md:inline">Needs Attention</span>
                  <span className="md:inline">!</span>
                </Badge>
              )}

              {/* Desktop buttons */}
              <div className="hidden md:flex items-center gap-2">
                <Link to="/patient-dashboard">
                  <Button variant="outline" size="sm" className="flex items-center space-x-1">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden lg:inline">Dashboard</span>
                  </Button>
                </Link>
                <Link to="/appointment-booking">
                  <Button variant="outline" size="sm" className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span className="hidden lg:inline">Book</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <Settings className="w-4 h-4" />
                  <span className="hidden lg:inline">Edit Profile</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={async () => {
                    try {
                      await logout();
                      window.location.href = '/patient-login';
                    } catch (error) {
                      toast({
                        title: "Logout Error",
                        description: "Failed to logout. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Logout</span>
                </Button>
              </div>

              {/* Mobile hamburger */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden px-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Progress summary — mobile only */}
                  <div className="px-3 py-2 border-b">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500 font-medium">Profile Progress</span>
                      <span className="text-xs font-semibold">{calculateOverallCompletion()}%</span>
                    </div>
                    <Progress value={calculateOverallCompletion()} className="h-1.5" />
                    {hasUrgentItems() && (
                      <div className="flex items-center gap-1 mt-1.5 text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span className="text-xs">Needs attention</span>
                      </div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/patient-dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/appointment-booking" className="flex items-center gap-2 cursor-pointer">
                      <Calendar className="w-4 h-4" />
                      Book Appointment
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                    onClick={async () => {
                      try {
                        await logout();
                        window.location.href = '/patient-login';
                      } catch (error) {
                        toast({
                          title: "Logout Error",
                          description: "Failed to logout. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Sidebar - Photo and Quick Actions */}
          <div className="order-2 lg:order-1 lg:col-span-1 space-y-3">
            {/* Profile Photo */}
            <Card className="p-3">
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  {/* Circular Avatar */}
                  <div className="w-16 h-16 rounded-full border-2 border-white shadow-lg overflow-hidden bg-gray-100 relative">
                    {patientData.profilePhoto ? (
                      <img
                        src={patientData.profilePhoto}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600">
                        <span className="text-lg font-semibold text-white">
                          {patientData.personalInfo?.firstName?.charAt(0)?.toUpperCase() || ''}
                          {patientData.personalInfo?.lastName?.charAt(0)?.toUpperCase() || ''}
                        </span>
                      </div>
                    )}
                    
                    {/* Upload overlay when uploading */}
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  
                  {/* Edit Button */}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full p-0 hover:bg-blue-50 hover:border-blue-300"
                    onClick={triggerPhotoUpload}
                    disabled={isUploadingPhoto}
                    title="Change profile photo"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-sm">{patientData.personalInfo.firstName} {patientData.personalInfo.lastName}</h3>
                  <p className="text-xs text-gray-600">Patient #{user?.patientNumber || 'N/A'}</p>
                </div>
              </div>
            </Card>
            
            <Card className="hidden lg:block p-3">
              <h3 className="font-semibold mb-2 text-sm">Profile Progress</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Completion</span>
                  <span className="text-xs font-medium">{calculateOverallCompletion()}%</span>
                </div>
                <Progress value={calculateOverallCompletion()} className="h-1.5" />
                <div className="text-xs text-gray-600">
                  {calculateOverallCompletion() < 50 ? (
                    <div className="text-orange-600 font-medium">Update profile sections</div>
                  ) : calculateOverallCompletion() < 80 ? (
                    <div className="text-blue-600 font-medium">Good progress!</div>
                  ) : (
                    <div className="text-green-600 font-medium">Profile complete!</div>
                  )}
                </div>
              </div>
            </Card>

            {/* Appointment Status Hint */}
            {hasValidQRAppointment && formattedAppointment ? (
              <Card className="p-3 border-l-4 border-l-green-500">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <QrCode className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-800 text-sm">Appointment Ready!</h3>
                    <p className="text-xs text-green-600">QR code available</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-green-200">
                  <p className="text-xs text-gray-500 mb-1">{formattedAppointment.doctor?.name}</p>
                  <p className="text-xs text-gray-500">
                    {formattedAppointment.appointment?.date ? new Date(formattedAppointment.appointment.date).toLocaleDateString() : 'Date'} • {formattedAppointment.appointment?.time}
                  </p>
                  <Button variant="outline" size="sm" className="w-full mt-2 h-7 text-xs" asChild>
                    <Link to="/patient-profile?tab=appointments">View QR</Link>
                  </Button>
                </div>
              </Card>
            ) : activeAppointment ? (
              <Card className="p-3 border-l-4 border-l-blue-500">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <QrCode className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-800 text-sm">Appointment Active</h3>
                    <p className="text-xs text-blue-600">QR code ready</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <p className="text-xs text-gray-500 mb-1">{activeAppointment.appointmentData?.doctor || 'Doctor'}</p>
                  <p className="text-xs text-gray-500">
                    {activeAppointment.appointmentData?.date} • {activeAppointment.appointmentData?.time}
                  </p>
                  <Button variant="outline" size="sm" className="w-full mt-2 h-7 text-xs" asChild>
                    <Link to="/patient-profile?tab=appointments">View Details</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-3 border-l-4 border-l-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm">No Appointments</h3>
                    <p className="text-xs text-gray-600">Book your first one</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2 h-7 text-xs" asChild>
                  <Link to="/appointment-booking">Book Now</Link>
                </Button>
              </Card>
            )}

            <Card className="hidden lg:block p-3">
              <h3 className="font-semibold mb-2 text-sm">Quick Actions</h3>
              <div className="space-y-1">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                  <Bell className="w-3 h-3 mr-2" />
                  Notifications
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                  <Shield className="w-3 h-3 mr-2" />
                  Privacy
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                  <FileText className="w-3 h-3 mr-2" />
                  Records
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="order-1 lg:order-2 lg:col-span-3 [&_h3]:text-base sm:[&_h3]:text-2xl">
            <Tabs defaultValue="personal" className="space-y-4">
              <TabsList className="flex flex-wrap sm:flex-nowrap sm:overflow-x-auto w-full h-auto gap-0">
                <TabsTrigger value="personal" className="basis-1/4 sm:basis-auto flex-shrink-0 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-auto min-h-[44px] sm:min-h-0 sm:h-9 py-1 px-1 sm:px-3 rounded-md">
                  <User className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                  <span>Personal</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="basis-1/4 sm:basis-auto flex-shrink-0 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-auto min-h-[44px] sm:min-h-0 sm:h-9 py-1 px-1 sm:px-3 rounded-md">
                  <Phone className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                  <span>Contact</span>
                </TabsTrigger>
                <TabsTrigger value="medical" className="basis-1/4 sm:basis-auto flex-shrink-0 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-auto min-h-[44px] sm:min-h-0 sm:h-9 py-1 px-1 sm:px-3 rounded-md">
                  <Heart className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                  <span>Medical</span>
                </TabsTrigger>
                <TabsTrigger value="insurance" className="basis-1/4 sm:basis-auto flex-shrink-0 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-auto min-h-[44px] sm:min-h-0 sm:h-9 py-1 px-1 sm:px-3 rounded-md">
                  <Shield className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                  <span>Insurance</span>
                </TabsTrigger>
                <TabsTrigger value="consent" className="basis-1/4 sm:basis-auto flex-shrink-0 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-auto min-h-[44px] sm:min-h-0 sm:h-9 py-1 px-1 sm:px-3 rounded-md">
                  <FileText className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                  <span>Consent</span>
                </TabsTrigger>
                <TabsTrigger value="appointments" className="basis-1/4 sm:basis-auto flex-shrink-0 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-auto min-h-[44px] sm:min-h-0 sm:h-9 py-1 px-1 sm:px-3 rounded-md">
                  <Calendar className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                  <span>Appts</span>
                </TabsTrigger>
                <TabsTrigger value="qr-code" className="basis-1/4 sm:basis-auto flex-shrink-0 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-auto min-h-[44px] sm:min-h-0 sm:h-9 py-1 px-1 sm:px-3 rounded-md">
                  <QrCode className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                  <span>QR</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <PersonalInfoSection
                  data={patientData.personalInfo}
                  onUpdate={handlePersonalInfoUpdate}
                />
              </TabsContent>

              <TabsContent value="contact">
                <ContactInfoSection
                  data={{
                    phone: user?.phone,
                    email: user?.email,
                    address: user?.address,
                    emergencyContacts: user?.emergencyContacts
                  }}
                />
              </TabsContent>

              <TabsContent value="medical">
                <MedicalHistoryProfile
                  data={patientData.medicalHistory}
                  onUpdate={handleMedicalHistoryUpdate}
                  onSave={() => handleSave('medical history')}
                />
              </TabsContent>

              <TabsContent value="insurance">
                <InsuranceEmergencyProfile
                  data={patientData.insuranceEmergency}
                  onUpdate={handleInsuranceEmergencyUpdate}
                  onSave={() => handleSave('insurance and emergency information')}
                />
              </TabsContent>

              <TabsContent value="consent">
                <ConsentVerificationProfile
                  data={patientData.consentVerification}
                  onUpdate={handleConsentVerificationUpdate}
                  onSave={() => handleSave('consent and verification settings')}
                />
              </TabsContent>

              <TabsContent value="appointments">
                <div className="space-y-6">
                  {/* Current/Upcoming Appointments with QR Code */}
                  {currentAppointment && qrCodeData ? (
                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center space-x-2">
                            <QrCode className="h-5 w-5 text-blue-600" />
                            <span>Your Appointment</span>
                            {appointmentDetails?.token && (
                              <Badge className="bg-blue-100 text-blue-700">
                                Token: {appointmentDetails.token}
                              </Badge>
                            )}
                          </span>
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmed
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Appointment Details */}
                          <div className="lg:col-span-2">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Eye className="h-8 w-8 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{appointmentDetails?.doctorName || 'Doctor Name'}</h3>
                                <p className="text-gray-600">{appointmentDetails?.doctorSpecialization || appointmentDetails?.department || 'Specialization'}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">
                                      {appointmentDetails?.date ? new Date(appointmentDetails.date).toLocaleDateString() : 'Date'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">{appointmentDetails?.time || 'Time'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 mt-1">
                                  <MapPin className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">{appointmentDetails?.location || 'Main Clinic'}</span>
                                </div>
                                <div className="flex items-center space-x-1 mt-1">
                                  <DollarSign className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">₹{appointmentDetails?.fee || 'Fee'}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Patient Info */}
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-sm mb-2">Patient Information</h4>
                              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                                <div className="min-w-0">
                                  <span className="text-gray-600">Name: </span>
                                  <span className="font-medium break-words">
                                    {user ? `${user.firstName} ${user.lastName}` : patientInfo?.name || 'Patient Name'}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <span className="text-gray-600">Phone: </span>
                                  <span className="font-medium break-all">{user?.phone || patientInfo?.phone || 'Phone'}</span>
                                </div>
                                <div className="min-w-0">
                                  <span className="text-gray-600">Age: </span>
                                  <span className="font-medium">
                                    {user?.dateOfBirth ? calculateAge(user.dateOfBirth) : patientInfo?.age || 'Age'}
                                  </span>
                                </div>
                                <div className="min-w-0 col-span-2 sm:col-span-1">
                                  <span className="text-gray-600">Email: </span>
                                  <span className="font-medium break-all text-xs">{user?.email || patientInfo?.email || 'Email'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : hasValidQRAppointment && formattedAppointment ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <QrCode className="h-5 w-5 text-blue-600" />
                          <span>Current Appointment with QR Code</span>
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          Your upcoming appointment with check-in QR code
                        </p>
                      </CardHeader>
                      <CardContent>
                        <AppointmentQRCard 
                          appointment={formattedAppointment}
                          size="large"
                          showFullDetails={true}
                          className="shadow-lg"
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    /* Dummy Upcoming Appointment for Demo */
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <span>Upcoming Appointments</span>
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          Your scheduled appointments and their details
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Dummy appointment data - First Appointment */}
                          <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Eye className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold">Dr. Abhijeet Agre</h3>
                                  <p className="text-sm text-gray-600">Comprehensive Ophthalmology</p>
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-700">Confirmed</Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-gray-600">Date:</span>
                                <p className="font-medium">Tomorrow, 8/26/2025</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Time:</span>
                                <p className="font-medium">02:00 PM</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Location:</span>
                                <p className="font-medium">Main Clinic</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Token:</span>
                                <p className="font-medium">A123</p>
                              </div>
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Book a new appointment to generate your QR code for check-in.
                              </p>
                            </div>
                          </div>

                          {/* Dummy appointment data - Second Appointment */}
                          <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                  <Eye className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold">Dr. Siddharth Deshmukh</h3>
                                  <p className="text-sm text-gray-600">Retinal Diseases & Surgery</p>
                                </div>
                              </div>
                              <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-gray-600">Date:</span>
                                <p className="font-medium">Aug 28, 2025</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Time:</span>
                                <p className="font-medium">10:30 AM</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Location:</span>
                                <p className="font-medium">Eye Specialist Wing</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Token:</span>
                                <p className="font-medium">R45</p>
                              </div>
                            </div>
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                <strong>Status:</strong> Waiting for confirmation. You'll receive QR code once confirmed.
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-center py-6">
                            <Link to="/appointment-booking">
                              <Button className="inline-flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>Book New Appointment</span>
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="qr-code">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <QrCode className="h-5 w-5 text-blue-600" />
                        <span>Appointment QR Code</span>
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Your appointment QR code for quick check-in at the clinic
                      </p>
                    </CardHeader>
                    <CardContent>
                      {currentAppointment && qrCodeData ? (
                        <div className="border border-gray-200 rounded-lg p-6">
                          <div className="text-center space-y-4">
                            <h4 className="font-medium text-lg">Your QR Code</h4>
                            <div className="bg-white p-4 border-2 border-gray-200 rounded-lg shadow-sm inline-block">
                              <img 
                                src={qrCodeData} 
                                alt="Appointment QR Code"
                                className="w-48 h-48 object-contain mx-auto"
                              />
                            </div>
                            <div>
                              <p className="text-lg font-medium text-gray-900">
                                Token: {appointmentDetails?.token || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Doctor: {appointmentDetails?.doctorName || 'Doctor Name'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {appointmentDetails?.date ? new Date(appointmentDetails.date).toLocaleDateString() : 'Date'} at {appointmentDetails?.time || 'Time'}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                Contains: {user?.phone || patientInfo?.phone || 'Phone Number'}
                              </p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex justify-center space-x-4">
                              <Button 
                                size="lg" 
                                variant="outline"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = qrCodeData;
                                  link.download = `appointment-qr-${appointmentDetails?.token || 'code'}.png`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download QR Code
                              </Button>
                              <Button 
                                size="lg" 
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(qrCodeData);
                                    const blob = await response.blob();
                                    await navigator.clipboard.write([
                                      new ClipboardItem({ 'image/png': blob })
                                    ]);
                                    toast({
                                      title: "QR Code Copied",
                                      description: "QR code copied to clipboard!",
                                    });
                                  } catch (error) {
                                  }
                                }}
                              >
                                Copy QR Code
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No Active Appointment QR Code
                          </h3>
                          <p className="text-gray-600 mb-6">
                            Book an appointment to generate your QR code for easy check-in
                          </p>
                          <Link to="/appointment-booking">
                            <Button className="inline-flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Book New Appointment</span>
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* QR Code Instructions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">How to Use Your QR Code</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-blue-600">1</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Arrive at the Clinic</h4>
                            <p className="text-sm text-gray-600">
                              Arrive 15 minutes before your scheduled appointment time
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-blue-600">2</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Show QR Code</h4>
                            <p className="text-sm text-gray-600">
                              Present your QR code at the reception desk for quick check-in
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-blue-600">3</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Verification</h4>
                            <p className="text-sm text-gray-600">
                              Staff will scan the code to verify your appointment and identity using your phone number
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-blue-600">4</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Get Your Token</h4>
                            <p className="text-sm text-gray-600">
                              Receive your appointment token and wait for your turn
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• Ensure your phone has sufficient battery to display the QR code</li>
                          <li>• Bring a valid government ID for additional verification</li>
                          <li>• Have your insurance information ready if applicable</li>
                          <li>• The QR code is unique to your appointment and contains your phone number</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
