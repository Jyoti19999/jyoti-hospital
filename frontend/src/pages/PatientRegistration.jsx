
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import PersonalInfoStep from '@/components/registration/PersonalInfoStep';
import ContactAddressStep from '@/components/registration/ContactAddressStep';
import MedicalHistoryStep from '@/components/registration/MedicalHistoryStep';
import InsuranceEmergencyStep from '@/components/registration/InsuranceEmergencyStep';
import ConsentVerificationStep from '@/components/registration/ConsentVerificationStep';
import EmergencyRegistration from '@/components/registration/EmergencyRegistration';
import RegistrationChoiceDialog from '@/components/registration/RegistrationChoiceDialog';
import OTPVerification from '@/components/patient-login/OTPVerification';
import { useNavigate } from 'react-router-dom';

const PatientRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('personal');
  const [isQuickRegistration, setIsQuickRegistration] = useState(false);
  const [showRegistrationChoiceDialog, setShowRegistrationChoiceDialog] = useState(false);
  const [isQuickRegistrationPath, setIsQuickRegistrationPath] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [otpVerificationPhoneNumber, setOtpVerificationPhoneNumber] = useState('');
  const [registrationData, setRegistrationData] = useState({
    personal: {
      title: '',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      nationality: 'Indian',
      preferredLanguage: 'English'
    },
    contact: {
      primaryPhone: '',
      email: '',
      currentAddress: {
        street: '',
        city: '',
        state: '',
        pinCode: '',
        country: 'India'
      },
      permanentAddress: {
        street: '',
        city: '',
        state: '',
        pinCode: '',
        country: 'India'
      },
      sameAsCurrent: true
    },
    medical: {
      allergies: [],
      chronicConditions: [],
      currentMedications: [],
      previousSurgeries: [],
      familyHistory: [],
      lifestyle: {
        smoking: 'Never',
        drinking: 'Never',
        exercise: 'Moderate',
        screenTime: '2-4 hours',
        eyeStrain: 'None'
      }
    },
    insurance: {
      hasInsurance: false,
      emergencyContacts: []
    },
    consent: {
      medicalConsent: false,
      privacyPolicy: false,
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
      abhaIdVerified: false,
      otpVerified: false,
      documentsUploaded: {}
    }
  });

  const steps = [
    { key: 'personal', title: 'Personal Info', progress: 20 },
    { key: 'contact', title: 'Contact & Address', progress: 40 },
    { key: 'medical', title: 'Medical History', progress: 60 },
    { key: 'insurance', title: 'Insurance & Emergency', progress: 80 },
    { key: 'consent', title: 'Consent & Verification', progress: 100 }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  
  // Calculate progress based on registration path
  const getCurrentProgress = () => {
    if (isQuickRegistrationPath) {
      // For quick registration: Personal (20) -> Contact (40) -> Consent (100)
      switch (currentStep) {
        case 'personal': return 20;
        case 'contact': return 40;
        case 'consent': return 100;
        default: return 40;
      }
    }
    return steps[currentStepIndex]?.progress || 0;
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const handleContactStepComplete = () => {
    setShowRegistrationChoiceDialog(true);
  };

  const handleContinueFullRegistration = () => {
    setShowRegistrationChoiceDialog(false);
    setIsQuickRegistrationPath(false);
    setCurrentStep('medical');
  };

  const handleFinishQuickRegistration = () => {
    setShowRegistrationChoiceDialog(false);
    setIsQuickRegistrationPath(true);
    
    // Show OTP verification with the primary phone number
    setOtpVerificationPhoneNumber(registrationData.contact.primaryPhone);
    setShowOTPVerification(true);
  };

  const handleOTPVerified = () => {
    setShowOTPVerification(false);
    navigate('/appointment-booking');
  };

  const handleOTPBack = () => {
    setShowOTPVerification(false);
    setShowRegistrationChoiceDialog(true);
  };

  const handleStepData = (stepKey, data) => {
    setRegistrationData(prev => ({
      ...prev,
      [stepKey]: { ...prev[stepKey], ...data }
    }));
  };

  const handleQuickRegistrationPrevious = () => {
    if (isQuickRegistrationPath && currentStep === 'consent') {
      setCurrentStep('contact');
    } else {
      handlePrevious();
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'personal':
        return (
          <PersonalInfoStep
            data={registrationData.personal}
            onUpdate={(data) => handleStepData('personal', data)}
            onNext={handleNext}
          />
        );
      case 'contact':
        return (
          <ContactAddressStep
            data={registrationData.contact}
            onUpdate={(data) => handleStepData('contact', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onContactStepComplete={handleContactStepComplete}
          />
        );
      case 'medical':
        return (
          <MedicalHistoryStep
            data={registrationData.medical}
            onUpdate={(data) => handleStepData('medical', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 'insurance':
        return (
          <InsuranceEmergencyStep
            data={registrationData.insurance}
            onUpdate={(data) => handleStepData('insurance', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 'consent':
        return (
          <ConsentVerificationStep
            data={registrationData.consent}
            onUpdate={(data) => handleStepData('consent', data)}
            onPrevious={handleQuickRegistrationPrevious}
            onComplete={() => {
            }}
          />
        );
      default:
        return null;
    }
  };

  if (isQuickRegistration) {
    return (
      <EmergencyRegistration
        onComplete={(emergencyData) => {
          // Here you would typically submit the emergency data to your backend
        }}
        onSwitchToFull={() => setIsQuickRegistration(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Eye className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Registration</h1>
          <p className="text-gray-600">Complete your registration to access our services</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => {
              const isActiveStep = step.key === currentStep;
              const isCompletedStep = isQuickRegistrationPath 
                ? (step.key === 'personal' && currentStepIndex >= 0) || 
                  (step.key === 'contact' && currentStepIndex >= 1) || 
                  (step.key === 'consent' && currentStepIndex >= 2)
                : index <= currentStepIndex;
              
              const isSkippedStep = isQuickRegistrationPath && 
                (step.key === 'medical' || step.key === 'insurance');

              return (
                <div
                  key={step.key}
                  className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isSkippedStep
                        ? 'bg-gray-100 text-gray-400'
                        : isCompletedStep || isActiveStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      isSkippedStep
                        ? 'text-gray-400'
                        : isCompletedStep || isActiveStep
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-200 mx-4">
                      <div
                        className={`h-full bg-blue-600 transition-all duration-300 ${
                          isQuickRegistrationPath
                            ? (step.key === 'personal' && currentStepIndex >= 1) ||
                              (step.key === 'contact' && currentStepIndex >= 2)
                              ? 'w-full'
                              : 'w-0'
                            : index < currentStepIndex
                            ? 'w-full'
                            : 'w-0'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={getCurrentProgress()} className="h-2" />
        </div>

        {/* Registration Form */}
        <Card className="p-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          {showOTPVerification ? (
            <OTPVerification
              phoneNumber={otpVerificationPhoneNumber}
              onVerified={handleOTPVerified}
              onBack={handleOTPBack}
            />
          ) : (
            renderCurrentStep()
          )}
        </Card>

        {/* Emergency Registration Option */}
        <div className="text-center mt-6">
          <p className="text-gray-600 mb-2">Need immediate care?</p>
          <Button
            onClick={() => setIsQuickRegistration(true)}
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Emergency Registration
          </Button>
        </div>

        {/* Registration Choice Dialog */}
        <RegistrationChoiceDialog
          isOpen={showRegistrationChoiceDialog}
          onContinueFull={handleContinueFullRegistration}
          onFinishQuick={handleFinishQuickRegistration}
          onClose={() => setShowRegistrationChoiceDialog(false)}
        />
      </div>
    </div>
  );
};

export default PatientRegistration;
