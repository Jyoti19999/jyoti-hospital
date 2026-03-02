// Reusable Appointment QR Card Component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  QrCode, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Timer, 
  DollarSign,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AppointmentQRCard = ({ 
  appointment, 
  size = 'medium', 
  showFullDetails = true,
  className = '' 
}) => {
  const { toast } = useToast();

  // Debug logging

  if (!appointment || !appointment.isQRGenerated) {
    return (
      <Card className={`border-dashed border-2 border-gray-300 ${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <QrCode className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Appointment</h3>
          <p className="text-gray-600 text-sm">
            Book an appointment to generate your QR code
          </p>
        </CardContent>
      </Card>
    );
  }

  const { patient, doctor, appointment: aptDetails, qrCode, status, createdAt } = appointment;

  const handleDownload = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `appointment-qr-${aptDetails.token}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Code Downloaded",
        description: "Your appointment QR code has been saved to your device.",
      });
    }
  };

  const handleCopy = async () => {
    if (qrCode) {
      try {
        // Convert data URL to blob
        const response = await fetch(qrCode);
        const blob = await response.blob();
        
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        
        toast({
          title: "QR Code Copied",
          description: "QR code has been copied to your clipboard.",
        });
      } catch (error) {
        // Fallback for copying text
        const appointmentInfo = `Appointment Details:\nPatient: ${patient.name}\nPhone: ${patient.phone}\nDoctor: ${doctor.name}\nDate: ${aptDetails.date}\nTime: ${aptDetails.time}\nToken: ${aptDetails.token}`;
        
        try {
          await navigator.clipboard.writeText(appointmentInfo);
          toast({
            title: "Appointment Info Copied",
            description: "Appointment details have been copied to your clipboard.",
          });
        } catch (textError) {
          toast({
            title: "Copy Failed",
            description: "Unable to copy to clipboard.",
            variant: "destructive"
          });
        }
      }
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Timer className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const qrSize = size === 'small' ? 'w-24 h-24' : size === 'large' ? 'w-48 h-48' : 'w-32 h-32';

  return (
    <Card className={`border-l-4 border-l-blue-500 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            <span>Appointment QR Code</span>
          </div>
          <Badge className={`flex items-center space-x-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="capitalize">{status}</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Horizontal QR Code Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* QR Code Display - Left Side */}
          <div className="flex flex-col items-center lg:items-start lg:w-1/3">
            <div className="bg-white p-4 border-2 border-gray-200 rounded-lg shadow-sm">
              {qrCode ? (
                <img 
                  src={qrCode} 
                  alt="Appointment QR Code"
                  className={`${qrSize} object-contain`}
                />
              ) : (
                <div className={`${qrSize} bg-gray-100 flex items-center justify-center rounded`}>
                  <QrCode className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="mt-3 text-center lg:text-left">
              <p className="text-sm font-medium text-gray-900">
                Token: {aptDetails.token}
              </p>
              <p className="text-xs text-gray-600">
                Contains: {patient.phone}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                className="flex items-center space-x-1"
              >
                <Download className="h-3 w-3" />
                <span>Download</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopy}
                className="flex items-center space-x-1"
              >
                <Copy className="h-3 w-3" />
                <span>Copy</span>
              </Button>
            </div>
          </div>

          {/* Appointment Details - Right Side */}
          <div className="lg:w-2/3 space-y-4">
            {showFullDetails && (
              <>
                {/* Patient Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-800 flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>Patient Information</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-medium">{patient.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-medium">{patient.phone}</p>
                    </div>
                    {patient.email && (
                      <div className="col-span-2">
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium">{patient.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-800 flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>Doctor Information</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600">Doctor</p>
                      <p className="font-medium">{doctor.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Specialization</p>
                      <p className="font-medium">{doctor.specialization}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Department</p>
                      <p className="font-medium capitalize">{doctor.department}</p>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-800 flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Appointment Details</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Date</span>
                      </p>
                      <p className="font-medium">{new Date(aptDetails.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Time</span>
                      </p>
                      <p className="font-medium">{aptDetails.time}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>Location</span>
                      </p>
                      <p className="font-medium">{aptDetails.location || 'Main Clinic'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 flex items-center space-x-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Fee</span>
                      </p>
                      <p className="font-medium">₹{aptDetails.fee}</p>
                    </div>
                    {aptDetails.waitTime && (
                      <div className="col-span-2">
                        <p className="text-gray-600 flex items-center space-x-1">
                          <Timer className="h-3 w-3" />
                          <span>Expected Wait</span>
                        </p>
                        <p className="font-medium">{aptDetails.waitTime}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {showFullDetails && (
          <>
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 text-sm">Check-in Instructions:</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Arrive 15 minutes before your appointment time</li>
                <li>• Show this QR code at the reception desk</li>
                <li>• Bring a valid government ID and insurance card</li>
                <li>• The QR code contains your phone number for verification</li>
              </ul>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-gray-500 border-t pt-3">
              Generated on: {new Date(createdAt).toLocaleString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentQRCard;
