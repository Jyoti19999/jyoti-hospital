import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  UserPlus, 
  AlertTriangle, 
  Baby, 
  Users,
  Stethoscope,
  Eye,
  Repeat
} from 'lucide-react';
import useOptometristStore from '@/stores/optometrist';
import { PRIORITY_LEVELS, PRIORITY_DESCRIPTIONS } from '@/lib/tokenService';

const QuickAddPatient = () => {
  const { addPatient } = useOptometristStore();
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    visitType: 'routine',
    isEmergency: false,
    isFollowUp: false,
    hasReferral: false,
    appointmentType: 'routine'
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.age) {
      return;
    }

    // Add patient to queue
    addPatient({
      ...formData,
      age: parseInt(formData.age)
    });

    // Reset form
    setFormData({
      name: '',
      age: '',
      gender: '',
      visitType: 'routine',
      isEmergency: false,
      isFollowUp: false,
      hasReferral: false,
      appointmentType: 'routine'
    });

    // Collapse form after adding
    setIsExpanded(false);
  };

  const getPreviewPriority = () => {
    const tempPatient = {
      ...formData,
      age: parseInt(formData.age) || 25
    };
    
    if (tempPatient.isEmergency) return PRIORITY_LEVELS.EMERGENCY;
    if (tempPatient.visitType === 'post-op') return PRIORITY_LEVELS.POST_OP;
    if (tempPatient.visitType === 'pre-op') return PRIORITY_LEVELS.PRE_OP;
    if (tempPatient.age < 5) return PRIORITY_LEVELS.CHILD_UNDER_5;
    if (tempPatient.age >= 60) return PRIORITY_LEVELS.SENIOR_60_PLUS;
    if (tempPatient.hasReferral) return PRIORITY_LEVELS.REFERRAL;
    if (tempPatient.appointmentType === 'review') return PRIORITY_LEVELS.REVIEW;
    if (tempPatient.appointmentType === 'follow-up') return PRIORITY_LEVELS.FOLLOW_UP;
    if (tempPatient.appointmentType === 'new-patient') return PRIORITY_LEVELS.NEW_PATIENT;
    
    return PRIORITY_LEVELS.ROUTINE;
  };

  const getPriorityColor = (priority) => {
    if (priority <= 3) return 'bg-red-100 text-red-800 border-red-200';
    if (priority <= 8) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getPriorityIcon = (priority) => {
    if (priority <= 3) return <AlertTriangle className="h-3 w-3" />;
    if (priority === 4) return <Baby className="h-3 w-3" />;
    if (priority === 5) return <Users className="h-3 w-3" />;
    return <Eye className="h-3 w-3" />;
  };

  const currentPriority = getPreviewPriority();

  if (!isExpanded) {
    return (
      <Card className="border-dashed border-2 border-primary/30 hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <Button 
            onClick={() => setIsExpanded(true)}
            variant="ghost" 
            className="w-full h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5"
          >
            <UserPlus className="h-8 w-8 text-primary" />
            <span className="font-medium">Add Patient to Queue</span>
            <span className="text-sm text-muted-foreground">
              Click to open quick add form
            </span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5" />
            Add Patient to Queue
          </CardTitle>
          <Button 
            onClick={() => setIsExpanded(false)}
            variant="ghost" 
            size="sm"
          >
            Cancel
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Patient Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter patient name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="Enter age"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => handleInputChange('gender', value)}
              >
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

            <div className="space-y-2">
              <Label>Visit Type</Label>
              <Select 
                value={formData.visitType} 
                onValueChange={(value) => handleInputChange('visitType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="pre-op">Pre-operative</SelectItem>
                  <SelectItem value="post-op">Post-operative</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visit Characteristics */}
          <div className="space-y-3">
            <Label>Visit Characteristics</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="emergency"
                  checked={formData.isEmergency}
                  onCheckedChange={(checked) => handleInputChange('isEmergency', checked)}
                />
                <Label htmlFor="emergency" className="flex items-center gap-1 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Emergency
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="followup"
                  checked={formData.isFollowUp}
                  onCheckedChange={(checked) => handleInputChange('isFollowUp', checked)}
                />
                <Label htmlFor="followup" className="flex items-center gap-1 text-sm">
                  <Repeat className="h-4 w-4 text-blue-500" />
                  Follow-up Visit
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="referral"
                  checked={formData.hasReferral}
                  onCheckedChange={(checked) => handleInputChange('hasReferral', checked)}
                />
                <Label htmlFor="referral" className="flex items-center gap-1 text-sm">
                  <Stethoscope className="h-4 w-4 text-green-500" />
                  Has Referral
                </Label>
              </div>
            </div>
          </div>

          {/* Priority Preview */}
          {(formData.name || formData.age) && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calculated Priority:</span>
                <Badge className={`${getPriorityColor(currentPriority)} flex items-center gap-1`}>
                  {getPriorityIcon(currentPriority)}
                  Priority {currentPriority}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {PRIORITY_DESCRIPTIONS[currentPriority]}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-2 pt-2">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!formData.name.trim() || !formData.age}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Queue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuickAddPatient;