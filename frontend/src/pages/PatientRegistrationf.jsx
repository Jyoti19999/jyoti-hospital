import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MinimalInfoStep from '@/components/registration/MinimalInfoStep';
import EmailOTPVerification from '@/components/registration/EmailOTPVerification';

const PatientRegistrationf = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState('info');
  const [registrationData, setRegistrationData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    mobileNumber: '',
    age: null
  });

  const steps = [
    { key: 'info', title: 'Basic Info', progress: 50 },
    { key: 'verification', title: 'Email Verification', progress: 100 }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  const handleNext = () => {
    if (currentStep === 'info') {
      setCurrentStep('verification');
    }
  };

  const handlePrevious = () => {
    if (currentStep === 'verification') {
      setCurrentStep('info');
    }
  };

  const handleStepData = (data) => {
    setRegistrationData(prev => ({
      ...prev,
      ...data
    }));
  };

  const handleRegistrationComplete = (patientData) => {
    
    // Update AuthContext with the authenticated patient data
    const userProfile = {
      ...patientData,
      role: 'patient' // Ensure role is set for authentication
    };
    
    login(userProfile);
    
    // Navigate to appointment booking
    navigate('/appointment-booking');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'info':
        return (
          <MinimalInfoStep
            data={registrationData}
            onUpdate={handleStepData}
            onNext={handleNext}
          />
        );
      case 'verification':
        return (
          <EmailOTPVerification
            email={registrationData.email}
            mobileNumber={registrationData.mobileNumber}
            registrationData={registrationData}
            onVerified={handleRegistrationComplete}
            onBack={handlePrevious}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Eye className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quick Registration</h1>
          <p className="text-gray-600">Complete your basic registration in just 2 steps</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            {steps.map((step, index) => {
              const isActiveStep = step.key === currentStep;
              const isCompletedStep = index < currentStepIndex;

              return (
                <div
                  key={step.key}
                  className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isCompletedStep || isActiveStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      isCompletedStep || isActiveStep
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
                          index < currentStepIndex ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={steps[currentStepIndex]?.progress || 0} className="h-2" />
        </div>

        {/* Registration Form */}
        <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          {renderCurrentStep()}
        </Card>
      </div>
    </div>
  );
};

export default PatientRegistrationf;
