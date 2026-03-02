import React from 'react';
import { X, Heart, Shield, Info } from 'lucide-react';

// Props: { isOpen, onContinueFull, onFinishQuick, onClose }

const RegistrationChoiceDialog = ({
  isOpen,
  onContinueFull,
  onFinishQuick,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleFinishQuick = () => {
    onFinishQuick();
  };

  const handleContinueFull = () => {
    onContinueFull();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

return (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    onClick={handleBackdropClick}
  >
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
      {/* Header */}
      <div className="p-6 pb-4 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Would you like to complete your full registration?
          </h2>
          <p className="text-sm text-gray-600">
            Medical history and insurance information are optional but recommended for better care.
          </p>
        </div>
      </div>

        {/* Content */}
        <div className="px-6 space-y-4">
          {/* Medical History Benefits */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Heart className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900 mb-1">Medical History Benefits</h4>
                <div className="relative group">
                  <button className="text-sm text-red-700 hover:text-red-800 underline cursor-pointer flex items-center">
                    Why is this important?
                    <Info className="h-3 w-3 ml-1" />
                  </button>
                  <div className="absolute bottom-full left-0 mb-2 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <p className="mb-2">Providing medical history helps with:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Improved treatment accuracy</li>
                      <li>Better diagnosis</li>
                      <li>Prevention of adverse drug reactions</li>
                      <li>Personalized care plans</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insurance & Emergency Contact Benefits */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">Insurance & Emergency Contact Benefits</h4>
                <div className="relative group">
                  <button className="text-sm text-blue-700 hover:text-blue-800 underline cursor-pointer flex items-center">
                    Why is this important?
                    <Info className="h-3 w-3 ml-1" />
                  </button>
                  <div className="absolute bottom-full left-0 mb-2 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <p className="mb-2">Providing insurance and emergency contacts helps with:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Faster claim processing</li>
                      <li>Reduced out-of-pocket expenses</li>
                      <li>Quick emergency response</li>
                      <li>Peace of mind for family members</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <button
              onClick={handleFinishQuick}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Finish Registration and Book Appointment
            </button>
            <button
              onClick={handleContinueFull}
              className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continue Full Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationChoiceDialog;