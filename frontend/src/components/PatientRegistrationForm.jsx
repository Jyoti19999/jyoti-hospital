import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from "sonner";
import {
  User,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Eye,
  Clock,
  FileText,
  CheckCircle,
  UserPlus,
  Stethoscope,
  Activity
} from "lucide-react";

const PatientRegistrationForm = ({ onRegistrationComplete, onCancel }) => {
  const [currentTab, setCurrentTab] = useState('demographics');
  const [loading, setLoading] = useState(false);
  
  // Patient demographic data
  const [patientData, setPatientData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    allergies: []
  });

  // Emergency assessment data
  const [emergencyAssessment, setEmergencyAssessment] = useState({
    chiefComplaint: '',
    symptoms: [],
    severity: '',
    urgencyLevel: '',
    onsetDuration: '',
    visionComplaints: [],
    eyeSymptoms: [],
    additionalNotes: ''
  });

  // Queue routing result
  const [queueRouting, setQueueRouting] = useState(null);

  // Emergency symptoms options
  const emergencySymptoms = [
    'Sudden vision loss',
    'Severe eye pain',
    'Flashing lights',
    'Curtain/shadow in vision',
    'Chemical in eye',
    'Eye injury/trauma',
    'Sudden double vision',
    'Severe headache with vision changes'
  ];

  const urgentSymptoms = [
    'Gradual vision loss',
    'Persistent eye pain',
    'Light sensitivity',
    'Discharge with pain',
    'Foreign body sensation',
    'Red eye with pain',
    'Blurred vision',
    'Halos around lights'
  ];

  const routineSymptoms = [
    'Routine eye check',
    'Glasses prescription',
    'Contact lens fitting',
    'Dry eyes',
    'Mild irritation',
    'Reading difficulties',
    'Computer eye strain'
  ];

  // Handle patient data changes
  const handlePatientDataChange = (field, value) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle emergency assessment changes
  const handleEmergencyAssessmentChange = (field, value) => {
    setEmergencyAssessment(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-calculate queue routing when assessment changes
    if (field === 'symptoms' || field === 'severity' || field === 'urgencyLevel' || field === 'chiefComplaint') {
      const updatedAssessment = { ...emergencyAssessment, [field]: value };
      const routing = calculateQueueRouting(updatedAssessment);
      setQueueRouting(routing);
    }
  };

  // Handle symptom selection
  const handleSymptomToggle = (symptom, checked) => {
    const updatedSymptoms = checked 
      ? [...emergencyAssessment.symptoms, symptom]
      : emergencyAssessment.symptoms.filter(s => s !== symptom);
    
    handleEmergencyAssessmentChange('symptoms', updatedSymptoms);
  };

  // Calculate queue routing based on assessment
  const calculateQueueRouting = (assessment) => {
    const { symptoms = [], severity, urgencyLevel, chiefComplaint } = assessment;

    // Check for emergency symptoms
    const hasEmergencySymptoms = symptoms.some(symptom => 
      emergencySymptoms.some(emergency => 
        symptom.toLowerCase().includes(emergency.toLowerCase())
      )
    );

    const emergencyInComplaint = chiefComplaint && emergencySymptoms.some(emergency =>
      chiefComplaint.toLowerCase().includes(emergency.toLowerCase())
    );

    const isEmergency = hasEmergencySymptoms || 
                       emergencyInComplaint || 
                       severity === 'severe' || 
                       urgencyLevel === 'emergency';

    if (isEmergency) {
      return {
        queue: 'OPHTHALMOLOGIST',
        priority: 'EMERGENCY',
        isEmergency: true,
        reason: 'Emergency symptoms detected - Direct to ophthalmologist',
        color: 'bg-red-100 text-red-800',
        icon: AlertTriangle
      };
    }

    // Check for urgent symptoms
    const hasUrgentSymptoms = symptoms.some(symptom => 
      urgentSymptoms.some(urgent => 
        symptom.toLowerCase().includes(urgent.toLowerCase())
      )
    );

    const isUrgent = hasUrgentSymptoms || 
                    severity === 'moderate' || 
                    urgencyLevel === 'urgent';

    if (isUrgent) {
      return {
        queue: 'OPTOMETRIST',
        priority: 'PRIORITY',
        isEmergency: false,
        reason: 'Urgent symptoms - Priority optometrist examination',
        color: 'bg-orange-100 text-orange-800',
        icon: Clock
      };
    }

    return {
      queue: 'OPTOMETRIST',
      priority: 'ROUTINE',
      isEmergency: false,
      reason: 'Routine examination - Standard optometrist queue',
      color: 'bg-blue-100 text-blue-800',
      icon: Eye
    };
  };

  // Validate address field
  const validateAddressField = (value) => {
    // Allow letters, numbers, spaces, and these characters: - / ( ) . , : '
    const addressRegex = /^[a-zA-Z0-9\s,.:\/()\-']*$/;
    if (value.trim() && !addressRegex.test(value)) {
      return "Address can only contain letters, numbers, spaces, and these characters: - / ( ) . , : '";
    }
    return null;
  };

  // Validate form data
  const validateForm = () => {
    const errors = [];

    // Validate patient data
    if (!patientData.firstName.trim()) errors.push('First name is required');
    if (!patientData.lastName.trim()) errors.push('Last name is required');
    if (!patientData.phone.trim()) errors.push('Phone number is required');
    if (!patientData.gender) errors.push('Gender is required');

    // Validate address if provided
    if (patientData.address.trim()) {
      const addressError = validateAddressField(patientData.address);
      if (addressError) errors.push(addressError);
    }

    // Validate emergency assessment
    if (!emergencyAssessment.chiefComplaint.trim()) errors.push('Chief complaint is required');
    if (emergencyAssessment.symptoms.length === 0) errors.push('At least one symptom must be selected');

    return errors;
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate form
      const errors = validateForm();
      if (errors.length > 0) {
        toast.error(`Please fix the following errors:\n${errors.join('\n')}`);
        return;
      }

      // Prepare registration data
      const registrationData = {
        patientData: {
          ...patientData,
          allergies: patientData.allergies.filter(allergy => allergy.trim())
        },
        emergencyAssessment
      };


      // Call API to register patient
      const response = await fetch(`${import.meta.env.VITE_API_URL}/receptionist2/patients/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        
        // Call completion callback with registration result
        if (onRegistrationComplete) {
          onRegistrationComplete(result.data);
        }
      } else {
        toast.error(result.message || 'Registration failed');
      }

    } catch (error) {
      toast.error('Failed to register patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle tab navigation
  const handleTabChange = (tab) => {
    setCurrentTab(tab);
  };

  const canProceedToAssessment = patientData.firstName && patientData.lastName && patientData.phone;
  const canProceedToRouting = emergencyAssessment.chiefComplaint && emergencyAssessment.symptoms.length > 0;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5 text-blue-600" />
          <span>Patient Registration - Receptionist2</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demographics" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Patient Info</span>
            </TabsTrigger>
            <TabsTrigger 
              value="assessment" 
              disabled={!canProceedToAssessment}
              className="flex items-center space-x-2"
            >
              <Stethoscope className="h-4 w-4" />
              <span>Emergency Assessment</span>
            </TabsTrigger>
            <TabsTrigger 
              value="routing" 
              disabled={!canProceedToRouting}
              className="flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Queue Routing</span>
            </TabsTrigger>
          </TabsList>

          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={patientData.firstName}
                  onChange={(e) => handlePatientDataChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={patientData.lastName}
                  onChange={(e) => handlePatientDataChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={patientData.phone}
                  onChange={(e) => handlePatientDataChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={patientData.email}
                  onChange={(e) => handlePatientDataChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={patientData.dateOfBirth}
                  onChange={(e) => handlePatientDataChange('dateOfBirth', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={patientData.gender} onValueChange={(value) => handlePatientDataChange('gender', value)}>
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
                value={patientData.address}
                onChange={(e) => handlePatientDataChange('address', e.target.value)}
                placeholder="Enter complete address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                <Input
                  id="emergencyContact"
                  value={patientData.emergencyContact}
                  onChange={(e) => handlePatientDataChange('emergencyContact', e.target.value)}
                  placeholder="Emergency contact name"
                />
              </div>
              <div>
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  value={patientData.emergencyPhone}
                  onChange={(e) => handlePatientDataChange('emergencyPhone', e.target.value)}
                  placeholder="Emergency contact phone"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => handleTabChange('assessment')}
                disabled={!canProceedToAssessment}
              >
                Next: Emergency Assessment
              </Button>
            </div>
          </TabsContent>

          {/* Emergency Assessment Tab */}
          <TabsContent value="assessment" className="space-y-6">
            <div>
              <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
              <Textarea
                id="chiefComplaint"
                value={emergencyAssessment.chiefComplaint}
                onChange={(e) => handleEmergencyAssessmentChange('chiefComplaint', e.target.value)}
                placeholder="Describe the main reason for the visit"
                rows={3}
              />
            </div>

            <div>
              <Label>Symptoms *</Label>
              <div className="space-y-4">
                {/* Emergency Symptoms */}
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Emergency Symptoms</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {emergencySymptoms.map((symptom) => (
                      <div key={symptom} className="flex items-center space-x-2">
                        <Checkbox
                          id={`emergency-${symptom}`}
                          checked={emergencyAssessment.symptoms.includes(symptom)}
                          onCheckedChange={(checked) => handleSymptomToggle(symptom, checked)}
                        />
                        <Label htmlFor={`emergency-${symptom}`} className="text-sm">
                          {symptom}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Urgent Symptoms */}
                <div>
                  <h4 className="font-medium text-orange-600 mb-2">Urgent Symptoms</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {urgentSymptoms.map((symptom) => (
                      <div key={symptom} className="flex items-center space-x-2">
                        <Checkbox
                          id={`urgent-${symptom}`}
                          checked={emergencyAssessment.symptoms.includes(symptom)}
                          onCheckedChange={(checked) => handleSymptomToggle(symptom, checked)}
                        />
                        <Label htmlFor={`urgent-${symptom}`} className="text-sm">
                          {symptom}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Routine Symptoms */}
                <div>
                  <h4 className="font-medium text-blue-600 mb-2">Routine Symptoms</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {routineSymptoms.map((symptom) => (
                      <div key={symptom} className="flex items-center space-x-2">
                        <Checkbox
                          id={`routine-${symptom}`}
                          checked={emergencyAssessment.symptoms.includes(symptom)}
                          onCheckedChange={(checked) => handleSymptomToggle(symptom, checked)}
                        />
                        <Label htmlFor={`routine-${symptom}`} className="text-sm">
                          {symptom}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Severity Level</Label>
                <RadioGroup 
                  value={emergencyAssessment.severity} 
                  onValueChange={(value) => handleEmergencyAssessmentChange('severity', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mild" id="severity-mild" />
                    <Label htmlFor="severity-mild">Mild</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="severity-moderate" />
                    <Label htmlFor="severity-moderate">Moderate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="severe" id="severity-severe" />
                    <Label htmlFor="severity-severe">Severe</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="onsetDuration">Onset Duration</Label>
                <Select 
                  value={emergencyAssessment.onsetDuration} 
                  onValueChange={(value) => handleEmergencyAssessmentChange('onsetDuration', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sudden">Sudden (minutes)</SelectItem>
                    <SelectItem value="hours">Few hours</SelectItem>
                    <SelectItem value="days">Few days</SelectItem>
                    <SelectItem value="weeks">Few weeks</SelectItem>
                    <SelectItem value="months">Few months</SelectItem>
                    <SelectItem value="chronic">Chronic (years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                value={emergencyAssessment.additionalNotes}
                onChange={(e) => handleEmergencyAssessmentChange('additionalNotes', e.target.value)}
                placeholder="Any additional information or observations"
                rows={3}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => handleTabChange('demographics')}>
                Back: Patient Info
              </Button>
              <Button 
                onClick={() => handleTabChange('routing')}
                disabled={!canProceedToRouting}
              >
                Next: Queue Routing
              </Button>
            </div>
          </TabsContent>

          {/* Queue Routing Tab */}
          <TabsContent value="routing" className="space-y-6">
            {queueRouting && (
              <Card className={`border-2 ${queueRouting.isEmergency ? 'border-red-300' : 'border-blue-300'}`}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <queueRouting.icon className="h-5 w-5" />
                    <span>Queue Routing Decision</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Target Queue</Label>
                      <Badge className={queueRouting.color}>
                        {queueRouting.queue}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Priority Level</Label>
                      <Badge className={queueRouting.color}>
                        {queueRouting.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Reason</Label>
                    <p className="text-sm text-gray-700 mt-1">{queueRouting.reason}</p>
                  </div>

                  {queueRouting.isEmergency && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">Emergency Case</span>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        This patient will bypass the optometrist and go directly to the ophthalmologist.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => handleTabChange('assessment')}>
                Back: Assessment
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Registering...' : 'Register Patient'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PatientRegistrationForm;