
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Heart, ChevronDown, ChevronRight, Edit, Plus, AlertTriangle, Pill, Activity, Users, Cigarette, Loader2, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import patientService from '@/services/patientService';
import MedicalHistoryStep from '@/components/registration/MedicalHistoryStep';

// MedicalHistoryData: { allergies, chronicConditions, currentMedications, previousSurgeries, familyHistory, lifestyle }
// Props: { data, onUpdate } - onUpdate is now optional

const MedicalHistoryProfile = ({ data, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { fetchPatientProfile } = useAuth();

  // Initialize edit data with current data or defaults
  const [editData, setEditData] = useState({
    allergies: data?.allergies || [],
    chronicConditions: data?.chronicConditions || [],
    currentMedications: data?.currentMedications || [],
    previousSurgeries: data?.previousSurgeries || [], // Added missing field
    familyHistory: data?.familyHistory || [],
    lifestyle: {
      smoking: data?.lifestyle?.smoking || 'Never',
      drinking: data?.lifestyle?.drinking || 'Never',
      exercise: data?.lifestyle?.exercise || 'None',
      screenTime: data?.lifestyle?.screenTime || 'Less than 2 hours',
      eyeStrain: data?.lifestyle?.eyeStrain || 'No'
    },
    bloodGroup: data?.bloodGroup || '',
    eyeHistory: data?.eyeHistory || {},
    visionHistory: data?.visionHistory || {},
    riskFactors: data?.riskFactors || {}
  });

  const calculateCompletionScore = () => {
    let completed = 0;
    let total = 6; // Updated to include lifestyle
    
    if (data?.allergies && data.allergies.length > 0) completed++;
    if (data?.chronicConditions && data.chronicConditions.length > 0) completed++;
    if (data?.currentMedications && data.currentMedications.length > 0) completed++;
    if (data?.familyHistory && data.familyHistory.length > 0) completed++;
    if (data?.lifestyle && Object.keys(data.lifestyle).length > 0) completed++;
    if (data?.bloodGroup) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'severe': return 'bg-orange-100 text-orange-800';
      case 'life-threatening': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateEditData = (updates) => {
    setEditData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Validate required data
      if (!editData.allergies || !editData.chronicConditions || !editData.currentMedications || 
          !editData.previousSurgeries || !editData.familyHistory || !editData.lifestyle) {
        toast({
          title: "Validation Error",
          description: "Please ensure all medical history sections are properly filled",
          variant: "destructive",
        });
        return;
      }

      // Call the API to update medical history
      const response = await patientService.updateMedicalHistory(editData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Medical history updated successfully",
        });

        // Refresh the patient profile to get updated data
        await fetchPatientProfile();
        
        setIsEditing(false);
      } else {
        throw new Error(response.message || 'Failed to update medical history');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update medical history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset edit data to original data
    setEditData({
      allergies: data?.allergies || [],
      chronicConditions: data?.chronicConditions || [],
      currentMedications: data?.currentMedications || [],
      previousSurgeries: data?.previousSurgeries || [], // Added missing field
      familyHistory: data?.familyHistory || [],
      lifestyle: {
        smoking: data?.lifestyle?.smoking || 'Never',
        drinking: data?.lifestyle?.drinking || 'Never',
        exercise: data?.lifestyle?.exercise || 'None',
        screenTime: data?.lifestyle?.screenTime || 'Less than 2 hours',
        eyeStrain: data?.lifestyle?.eyeStrain || 'No'
      },
      bloodGroup: data?.bloodGroup || '',
      eyeHistory: data?.eyeHistory || {},
      visionHistory: data?.visionHistory || {},
      riskFactors: data?.riskFactors || {}
    });
    setIsEditing(false);
  };

  const renderSummaryView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-red-500" />
          <span className="text-sm sm:text-base font-medium">Medical History</span>
          <Badge variant="outline" className="text-xs">
            {calculateCompletionScore()}% Complete
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Progress value={calculateCompletionScore()} className="hidden sm:block w-20 h-2" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Allergies</span>
            </div>
            {data?.allergies && data.allergies.length > 0 ? (
              <div className="space-y-2">
                {data.allergies.slice(0, 3).map((allergy, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm">{allergy.name}</span>
                    <Badge className={`text-xs ${getSeverityColor(allergy.severity)}`}>
                      {allergy.severity}
                    </Badge>
                  </div>
                ))}
                {data.allergies.length > 3 && (
                  <span className="text-sm text-gray-500">+{data.allergies.length - 3} more</span>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500">No allergies recorded</span>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Pill className="h-4 w-4 text-green-500" />
              <span className="font-medium">Current Medications</span>
            </div>
            {data?.currentMedications && data.currentMedications.length > 0 ? (
              <div className="space-y-1">
                {data.currentMedications.slice(0, 3).map((medication, index) => (
                  <div key={index} className="text-sm">
                    {medication.name} - {medication.frequency}
                  </div>
                ))}
                {data.currentMedications.length > 3 && (
                  <span className="text-sm text-gray-500">+{data.currentMedications.length - 3} more</span>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500">No medications recorded</span>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Chronic Conditions</span>
            </div>
            {data?.chronicConditions && data.chronicConditions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {data.chronicConditions.slice(0, 4).map((condition, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {condition}
                  </Badge>
                ))}
                {data.chronicConditions.length > 4 && (
                  <span className="text-sm text-gray-500">+{data.chronicConditions.length - 4} more</span>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500">No conditions recorded</span>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Cigarette className="h-4 w-4 text-red-500" />
              <span className="font-medium">Lifestyle</span>
            </div>
            {data?.lifestyle ? (
              <div className="space-y-1 text-sm">
                <div>Smoking: {data.lifestyle.smoking || 'Not specified'}</div>
                <div>Exercise: {data.lifestyle.exercise || 'Not specified'}</div>
                <div>Screen Time: {data.lifestyle.screenTime || 'Not specified'}</div>
              </div>
            ) : (
              <span className="text-sm text-gray-500">No lifestyle info recorded</span>
            )}
          </Card>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            Collapse
          </Button>
          <Button
            size="sm"
            onClick={() => setIsEditing(true)}
            disabled={isLoading}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit Details
          </Button>
        </div>
      </CollapsibleContent>
    </div>
  );

  if (isEditing) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Medical History</h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              size="sm"
            >
              <X className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 sm:mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 sm:mr-1" />
              )}
              <span className="hidden sm:inline">{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        </div>
        
        <MedicalHistoryStep
          data={editData}
          onUpdate={handleUpdateEditData}
          onNext={() => {}}
          onPrevious={() => {}}
        />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {renderSummaryView()}
      </Collapsible>
    </Card>
  );
};

export default MedicalHistoryProfile;
