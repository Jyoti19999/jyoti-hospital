import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  QrCode, 
  Scan, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Camera,
  Type,
  Eye
} from 'lucide-react';
import useCheckInStore from '@/stores/ohms/checkInStore';
import useQueueStore from '@/stores/ohms/queueStore';
import { useToast } from '@/hooks/use-toast';

const KioskCheckIn = () => {
  const [activeTab, setActiveTab] = useState('qr-scan');
  const [manualToken, setManualToken] = useState('');
  const [checkInStatus, setCheckInStatus] = useState('ready');
  const [lastCheckIn, setLastCheckIn] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);

  const { toast } = useToast();
  const { 
    checkInWithQR, 
    checkInWithToken, 
    scannerStatus, 
    lastScanResult,
    kioskSettings,
    resetScannerStatus,
    startScanning,
    stopScanning
  } = useCheckInStore();
  
  const { addToOptometristQueue } = useQueueStore();

  // Auto-timeout for inactivity
  useEffect(() => {
    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      const newTimeoutId = setTimeout(() => {
        setActiveTab('qr-scan');
        setManualToken('');
        setCheckInStatus('ready');
        setLastCheckIn(null);
        resetScannerStatus();
      }, kioskSettings.autoTimeout);
      
      setTimeoutId(newTimeoutId);
    };

    resetTimeout();
    
    const handleActivity = () => resetTimeout();
    
    document.addEventListener('mousedown', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('touchstart', handleActivity);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
    };
  }, [timeoutId, kioskSettings.autoTimeout, resetScannerStatus]);

  const handleQRScan = async (qrData) => {
    setCheckInStatus('processing');
    
    const result = await checkInWithQR(qrData, 'optometry');
    
    if (result.success) {
      // Add to optometrist queue
      const queueEntry = addToOptometristQueue({
        patientId: result.checkInRecord.patientId,
        token: result.checkInRecord.token,
        patientInfo: result.checkInRecord.patientInfo,
        appointmentDetails: result.checkInRecord.appointmentDetails
      });
      
      setLastCheckIn(result.checkInRecord);
      setCheckInStatus('success');
      
      toast({
        title: "Check-in Successful",
        description: `Welcome ${result.checkInRecord.patientInfo.name}! You're now in the queue.`,
      });
      
      // Auto-reset after showing success
      setTimeout(() => {
        setCheckInStatus('ready');
        setLastCheckIn(null);
        setActiveTab('qr-scan');
      }, 5000);
    } else {
      setCheckInStatus('error');
      toast({
        title: "Check-in Failed",
        description: result.error,
        variant: "destructive",
      });
      
      setTimeout(() => {
        setCheckInStatus('ready');
      }, 3000);
    }
  };

  const handleManualCheckIn = async () => {
    if (!manualToken.trim()) {
      toast({
        title: "Invalid Token",
        description: "Please enter a valid appointment token.",
        variant: "destructive",
      });
      return;
    }
    
    setCheckInStatus('processing');
    
    const result = await checkInWithToken(manualToken.trim(), 'optometry');
    
    if (result.success) {
      // Add to optometrist queue
      const queueEntry = addToOptometristQueue({
        patientId: result.checkInRecord.patientId,
        token: result.checkInRecord.token,
        patientInfo: result.checkInRecord.patientInfo,
        appointmentDetails: result.checkInRecord.appointmentDetails
      });
      
      setLastCheckIn(result.checkInRecord);
      setCheckInStatus('success');
      setManualToken('');
      
      toast({
        title: "Check-in Successful",
        description: `Welcome ${result.checkInRecord.patientInfo.name}! You're now in the queue.`,
      });
      
      // Auto-reset after showing success
      setTimeout(() => {
        setCheckInStatus('ready');
        setLastCheckIn(null);
        setActiveTab('qr-scan');
      }, 5000);
    } else {
      setCheckInStatus('error');
      toast({
        title: "Check-in Failed",
        description: result.error,
        variant: "destructive",
      });
      
      setTimeout(() => {
        setCheckInStatus('ready');
      }, 3000);
    }
  };

  const simulateQRScan = () => {
    // Simulate QR code scanning for demo
    const mockQRData = JSON.stringify({
      patientId: 'PAT-' + Date.now(),
      token: 'TOK-' + Math.random().toString(36).substr(2, 8),
      patientInfo: {
        name: 'John Doe',
        phone: '+91 9876543210',
        age: 35
      },
      appointmentDetails: {
        department: 'optometry',
        doctorName: 'Dr. Smith',
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM'
      }
    });
    
    handleQRScan(mockQRData);
  };

  const getStatusIcon = () => {
    switch (checkInStatus) {
      case 'processing': return <Clock className="h-8 w-8 text-blue-500 animate-spin" />;
      case 'success': return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error': return <AlertCircle className="h-8 w-8 text-red-500" />;
      default: return <QrCode className="h-8 w-8 text-primary" />;
    }
  };

  const getStatusMessage = () => {
    switch (checkInStatus) {
      case 'processing': return 'Processing your check-in...';
      case 'success': return 'Check-in successful! Please proceed to the waiting area.';
      case 'error': return 'Check-in failed. Please try again or contact staff.';
      default: return 'Welcome! Please scan your QR code or enter your token to check in.';
    }
  };

  if (checkInStatus === 'success' && lastCheckIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Screen */}
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-green-700">
                Check-in Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg">
                Welcome, <span className="font-semibold">{lastCheckIn.patientInfo.name}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">Token</p>
                  <p className="font-semibold">{lastCheckIn.token}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">Department</p>
                  <p className="font-semibold capitalize">{lastCheckIn.department}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">Doctor</p>
                  <p className="font-semibold">{lastCheckIn.appointmentDetails.doctorName}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">Check-in Time</p>
                  <p className="font-semibold">{new Date(lastCheckIn.checkInTime).toLocaleTimeString()}</p>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please proceed to the <strong>Optometry Waiting Area</strong> and wait for your name to be called.
                  You can check your queue position on the display screens.
                </AlertDescription>
              </Alert>
              
              <div className="text-sm text-gray-600">
                This screen will reset automatically in a few seconds...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Patient Check-in Kiosk</h1>
                <p className="text-sm text-slate-600">Self-Service Check-in Terminal</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Status Display */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardContent className="text-center py-8">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <h2 className="text-xl font-semibold mb-2">{getStatusMessage()}</h2>
            {checkInStatus === 'ready' && (
              <p className="text-muted-foreground">Choose your preferred check-in method below</p>
            )}
          </CardContent>
        </Card>

        {/* Check-in Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white p-1 rounded-lg shadow-sm border">
            <TabsTrigger 
              value="qr-scan" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              disabled={checkInStatus === 'processing'}
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Code Scan
            </TabsTrigger>
            <TabsTrigger 
              value="manual-entry" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              disabled={checkInStatus === 'processing'}
            >
              <Type className="h-4 w-4 mr-2" />
              Manual Entry
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="qr-scan" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  <span>QR Code Scanner</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="w-64 h-64 mx-auto border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    {scannerStatus === 'scanning' ? (
                      <div className="text-center">
                        <Scan className="h-16 w-16 text-blue-500 mx-auto mb-2 animate-pulse" />
                        <p className="text-sm text-gray-600">Scanning for QR code...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Position QR code here</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Hold your QR code from the appointment confirmation in front of the camera
                  </p>
                  
                  <div className="space-y-2">
                    {scannerStatus === 'ready' && (
                      <Button 
                        onClick={startScanning} 
                        className="w-full"
                        disabled={checkInStatus === 'processing'}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Scanner
                      </Button>
                    )}
                    
                    {scannerStatus === 'scanning' && (
                      <Button 
                        onClick={stopScanning} 
                        variant="outline" 
                        className="w-full"
                      >
                        Stop Scanner
                      </Button>
                    )}
                    
                    {/* Demo button for testing */}
                    <Button 
                      onClick={simulateQRScan} 
                      variant="secondary" 
                      className="w-full"
                      disabled={checkInStatus === 'processing'}
                    >
                      <Scan className="h-4 w-4 mr-2" />
                      Simulate QR Scan (Demo)
                    </Button>
                  </div>
                </div>

                {lastScanResult && !lastScanResult.success && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {lastScanResult.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="manual-entry" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>Manual Token Entry</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Appointment Token
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter your appointment token (e.g., A1-1234)"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value.toUpperCase())}
                      disabled={checkInStatus === 'processing'}
                      className="text-lg py-3"
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Your appointment token can be found in:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Your appointment confirmation email</li>
                      <li>SMS received after booking</li>
                      <li>Your patient dashboard</li>
                    </ul>
                  </div>
                  
                  <Button 
                    onClick={handleManualCheckIn}
                    className="w-full"
                    disabled={!manualToken.trim() || checkInStatus === 'processing'}
                  >
                    {checkInStatus === 'processing' ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check In
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-800 mb-3">Need Help?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <p className="font-medium mb-1">QR Code Issues:</p>
                <p>Ensure your phone screen is bright and hold it steady</p>
              </div>
              <div>
                <p className="font-medium mb-1">Token Problems:</p>
                <p>Check your appointment confirmation for the correct token</p>
              </div>
              <div>
                <p className="font-medium mb-1">First Time Visit:</p>
                <p>Please proceed to the registration desk</p>
              </div>
              <div>
                <p className="font-medium mb-1">Emergency:</p>
                <p>Contact the front desk immediately</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KioskCheckIn;