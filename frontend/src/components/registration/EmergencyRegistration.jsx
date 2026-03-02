
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  AlertTriangle, Phone, User, Clock, Heart, 
  Activity, CheckCircle, Save, Mic, MicOff 
} from 'lucide-react';
import { toast } from 'sonner';

// EmergencyRegistrationData: { patientName, phoneticSpelling, age, gender, primaryPhone, emergencyContactName, emergencyContactPhone, emergencyContactRelation, chiefComplaint, painLevel, urgencyLevel, hasInsurance, insuranceProvider, policyNumber, triageNotes }
// Props: { onComplete, onSwitchToFull }

const commonSymptoms = [
  'Eye pain/discomfort', 'Vision loss/blurred vision', 'Eye injury/trauma',
  'Sudden vision changes', 'Eye infection', 'Foreign object in eye',
  'Flashing lights', 'Eye swelling', 'Double vision', 'Other'
];

const painLevels = [
  { value: '0', label: '0 - No pain', color: 'bg-green-100 text-green-800' },
  { value: '1-3', label: '1-3 - Mild pain', color: 'bg-yellow-100 text-yellow-800' },
  { value: '4-6', label: '4-6 - Moderate pain', color: 'bg-orange-100 text-orange-800' },
  { value: '7-8', label: '7-8 - Severe pain', color: 'bg-red-100 text-red-800' },
  { value: '9-10', label: '9-10 - Worst pain', color: 'bg-red-200 text-red-900' }
];

const urgencyLevels = [
  { value: 'critical', label: 'Critical - Life threatening', color: 'bg-red-600 text-white', icon: '🚨' },
  { value: 'urgent', label: 'Urgent - Immediate attention', color: 'bg-orange-600 text-white', icon: '⚠️' },
  { value: 'semi-urgent', label: 'Semi-urgent - Within 1 hour', color: 'bg-yellow-600 text-white', icon: '⏰' },
  { value: 'non-urgent', label: 'Non-urgent - Routine care', color: 'bg-green-600 text-white', icon: '✅' }
];

const EmergencyRegistration = ({ 
  onComplete, onSwitchToFull 
}) => {
  const [data, setData] = useState({
    patientName: '',
    age: '',
    gender: '',
    primaryPhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    chiefComplaint: '',
    painLevel: '',
    urgencyLevel: 'semi-urgent',
    hasInsurance: false
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');
  const [isListening, setIsListening] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Auto-save functionality
  useEffect(() => {
    const timer = setInterval(() => {
      if (data.patientName || data.primaryPhone) {
        setAutoSaveStatus('saving');
        localStorage.setItem('emergencyRegistrationData', JSON.stringify(data));
        setTimeout(() => setAutoSaveStatus('saved'), 500);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(timer);
  }, [data]);

  // Timer for registration time
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Voice input for chief complaint (if supported)
  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setData(prev => ({ ...prev, chiefComplaint: transcript }));
        toast.success('Voice input captured');
      };
      
      recognition.onerror = () => {
        toast.error('Voice input failed');
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      toast.error('Voice input not supported in this browser');
    }
  };

  const updateData = (updates) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const testEmergencyContact = async () => {
    if (!data.emergencyContactPhone) {
      toast.error('Please enter emergency contact phone number');
      return;
    }

    toast.loading('Testing emergency contact...');
    
    // Simulate contact test
    setTimeout(() => {
      toast.success('Emergency contact verified');
    }, 1000);
  };

  const handleSubmit = () => {
    // Validate required fields
    const requiredFields = [
      'patientName', 'age', 'gender', 'primaryPhone', 
      'emergencyContactName', 'emergencyContactPhone', 'chiefComplaint'
    ];
    
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Generate emergency patient ID
    const emergencyId = `EMR${Date.now()}`;
    toast.success(`Emergency registration complete. ID: ${emergencyId}`);
    
    onComplete({
      ...data,
      triageNotes: `Emergency registration completed in ${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}`
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isFormValid = data.patientName && data.age && data.gender && 
    data.primaryPhone && data.emergencyContactName && 
    data.emergencyContactPhone && data.chiefComplaint;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Emergency Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl flex items-center justify-center animate-pulse">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-red-900 mb-2">Emergency Registration</h1>
          <p className="text-red-700">Quick registration for immediate medical attention</p>
          
          <div className="flex justify-center items-center space-x-4 mt-4">
            <Badge variant="outline" className="text-red-600 border-red-200">
              <Clock className="h-3 w-3 mr-1" />
              Time: {formatTime(timeElapsed)}
            </Badge>
            {autoSaveStatus === 'saved' && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Save className="h-3 w-3 mr-1" />
                Auto-saved
              </Badge>
            )}
          </div>
        </div>

        {/* Emergency Form */}
        <Card className="shadow-2xl border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center justify-between text-red-900">
              <span className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Patient Information</span>
              </span>
              <Button variant="outline" size="sm" onClick={onSwitchToFull}>
                Switch to Full Registration
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Patient Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Label htmlFor="patientName" className="text-lg font-semibold text-red-900">
                  Patient Name *
                </Label>
                <Input
                  id="patientName"
                  value={data.patientName}
                  onChange={(e) => updateData({ patientName: e.target.value })}
                  placeholder="Enter full name"
                  className="h-12 text-lg"
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="phoneticSpelling" className="text-sm text-gray-600">
                  Phonetic Spelling (for pronunciation)
                </Label>
                <Input
                  id="phoneticSpelling"
                  value={data.phoneticSpelling || ''}
                  onChange={(e) => updateData({ phoneticSpelling: e.target.value })}
                  placeholder="e.g., JOHN-son"
                  className="h-12"
                />
              </div>

              <div>
                <Label htmlFor="age" className="text-lg font-semibold text-red-900">Age *</Label>
                <Input
                  id="age"
                  value={data.age}
                  onChange={(e) => updateData({ age: e.target.value })}
                  placeholder="Age or approx."
                  className="h-12 text-lg"
                />
              </div>

              <div>
                <Label htmlFor="gender" className="text-lg font-semibold text-red-900">Gender *</Label>
                <Select value={data.gender} onValueChange={(value) => updateData({ gender: value })}>
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="primaryPhone" className="text-lg font-semibold text-red-900">
                  Phone Number *
                </Label>
                <Input
                  id="primaryPhone"
                  value={data.primaryPhone}
                  onChange={(e) => updateData({ primaryPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="h-12 text-lg"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-900">
                  <Phone className="h-5 w-5" />
                  <span>Emergency Contact</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName" className="font-semibold text-orange-900">
                      Contact Name *
                    </Label>
                    <Input
                      id="emergencyContactName"
                      value={data.emergencyContactName}
                      onChange={(e) => updateData({ emergencyContactName: e.target.value })}
                      placeholder="Full name"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emergencyContactPhone" className="font-semibold text-orange-900">
                      Contact Phone *
                    </Label>
                    <div className="flex space-x-2">
                      <Input
                        id="emergencyContactPhone"
                        value={data.emergencyContactPhone}
                        onChange={(e) => updateData({ emergencyContactPhone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="h-11"
                      />
                      <Button onClick={testEmergencyContact} size="sm" variant="outline">
                        Test
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="emergencyContactRelation" className="font-semibold text-orange-900">
                      Relationship *
                    </Label>
                    <Select 
                      value={data.emergencyContactRelation} 
                      onValueChange={(value) => updateData({ emergencyContactRelation: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="friend">Friend</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chief Complaint */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-900">
                  <Activity className="h-5 w-5" />
                  <span>Chief Complaint & Symptoms</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="chiefComplaint" className="font-semibold text-blue-900">
                    Primary Concern *
                  </Label>
                  <div className="flex space-x-2">
                    <Textarea
                      id="chiefComplaint"
                      value={data.chiefComplaint}
                      onChange={(e) => updateData({ chiefComplaint: e.target.value })}
                      placeholder="Describe the primary reason for this emergency visit..."
                      className="min-h-[80px]"
                    />
                    <Button
                      onClick={startVoiceInput}
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      disabled={isListening}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold text-blue-900 mb-3 block">Common Eye Emergency Symptoms</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {commonSymptoms.map((symptom) => (
                      <Button
                        key={symptom}
                        variant="outline"
                        size="sm"
                        onClick={() => updateData({ 
                          chiefComplaint: data.chiefComplaint ? `${data.chiefComplaint}, ${symptom}` : symptom 
                        })}
                        className="text-left justify-start"
                      >
                        {symptom}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="font-semibold text-blue-900 mb-3 block">Pain Level (0-10)</Label>
                    <RadioGroup 
                      value={data.painLevel} 
                      onValueChange={(value) => updateData({ painLevel: value })}
                      className="space-y-2"
                    >
                      {painLevels.map((level) => (
                        <div key={level.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={level.value} id={level.value} />
                          <Label htmlFor={level.value} className="flex-1">
                            <Badge className={level.color} variant="outline">
                              {level.label}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="font-semibold text-blue-900 mb-3 block">Urgency Level</Label>
                    <RadioGroup 
                      value={data.urgencyLevel} 
                      onValueChange={(value) => updateData({ urgencyLevel: value })}
                      className="space-y-2"
                    >
                      {urgencyLevels.map((level) => (
                        <div key={level.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={level.value} id={level.value} />
                          <Label htmlFor={level.value} className="flex-1">
                            <Badge className={level.color}>
                              {level.icon} {level.label}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Insurance Info */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-900">
                  <Heart className="h-5 w-5" />
                  <span>Insurance Information (Optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <RadioGroup 
                    value={data.hasInsurance ? 'yes' : 'no'} 
                    onValueChange={(value) => updateData({ hasInsurance: value === 'yes' })}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="hasInsurance" />
                      <Label htmlFor="hasInsurance">Has Insurance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="noInsurance" />
                      <Label htmlFor="noInsurance">Cash Payment</Label>
                    </div>
                  </RadioGroup>
                </div>

                {data.hasInsurance && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                      <Input
                        id="insuranceProvider"
                        value={data.insuranceProvider || ''}
                        onChange={(e) => updateData({ insuranceProvider: e.target.value })}
                        placeholder="Insurance company name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="policyNumber">Policy Number</Label>
                      <Input
                        id="policyNumber"
                        value={data.policyNumber || ''}
                        onChange={(e) => updateData({ policyNumber: e.target.value })}
                        placeholder="Policy number"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 pt-6 border-t">
              <div className="text-sm text-gray-600">
                <p>Registration time: {formatTime(timeElapsed)}</p>
                <p>All required fields marked with *</p>
              </div>
              
              <div className="flex space-x-4">
                <Button variant="outline" onClick={onSwitchToFull}>
                  Complete Full Registration Later
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className="bg-red-600 hover:bg-red-700 text-white px-8"
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Complete Emergency Registration
                </Button>
              </div>
            </div>

            {!isFormValid && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-yellow-800 text-sm">
                  Please complete all required fields to proceed with emergency registration.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmergencyRegistration;
