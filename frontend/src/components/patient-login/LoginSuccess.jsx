
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// LoginSuccessProps: { patientName }

const LoginSuccess = ({ patientName }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      navigate('/patient-dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Welcome Back!</h2>
        <p className="text-gray-600">
          Hello <span className="font-medium text-gray-900">{patientName}</span>, 
          you have successfully logged in.
        </p>
      </div>

      <div className="space-y-4">
        <Button
          onClick={handleContinue}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          Continue to Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        <p className="text-sm text-gray-500">
          Redirecting automatically in 3 seconds...
        </p>
      </div>
    </div>
  );
};

export default LoginSuccess;
