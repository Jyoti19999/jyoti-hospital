
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Heart, Activity, Plus, Trash2, AlertTriangle, Pill, Stethoscope, Users, Cigarette } from 'lucide-react';
import { AllergyEntry } from '@/components/forms/AllergyEntry';
import { MedicationTable } from '@/components/forms/MedicationTable';
import { SurgeryEntry } from '@/components/forms/SurgeryEntry';

// MedicalHistoryData: { allergies, chronicConditions, currentMedications, previousSurgeries, familyHistory, lifestyle }
// Props: { data, onUpdate, onNext, onPrevious }

const eyeConditions = [
  'Glaucoma',
  'Cataracts',
  'Diabetic Retinopathy',
  'Macular Degeneration',
  'Myopia (Nearsightedness)',
  'Hyperopia (Farsightedness)',
  'Astigmatism',
  'Dry Eyes'
];

const generalConditions = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Asthma',
  'Thyroid Disorders',
  'Arthritis',
  'Cancer',
  'Kidney Disease'
];

const familyHistoryConditions = [
  'Glaucoma',
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Cancer',
  'Stroke',
  'Eye Diseases',
  'Mental Health Conditions'
];

const MedicalHistoryStep = ({ data, onUpdate, onNext, onPrevious }) => {
  const [newAllergy, setNewAllergy] = useState({ name: '', severity: 'mild' });
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', frequency: '' });
  const [newSurgery, setNewSurgery] = useState({ procedure: '', date: '', hospital: '', complications: '' });

  const addAllergy = () => {
    if (newAllergy.name.trim()) {
      const allergy = {
        ...newAllergy,
        id: Date.now().toString()
      };
      onUpdate({
        allergies: [...data.allergies, allergy]
      });
      setNewAllergy({ name: '', severity: 'mild' });
    }
  };

  const removeAllergy = (id) => {
    onUpdate({
      allergies: data.allergies.filter(a => a.id !== id)
    });
  };

  const addMedication = () => {
    if (newMedication.name.trim()) {
      const medication = {
        ...newMedication,
        id: Date.now().toString()
      };
      onUpdate({
        currentMedications: [...data.currentMedications, medication]
      });
      setNewMedication({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeMedication = (id) => {
    onUpdate({
      currentMedications: data.currentMedications.filter(m => m.id !== id)
    });
  };

  const addSurgery = () => {
    if (newSurgery.procedure.trim()) {
      const surgery = {
        ...newSurgery,
        id: Date.now().toString()
      };
      onUpdate({
        previousSurgeries: [...data.previousSurgeries, surgery]
      });
      setNewSurgery({ procedure: '', date: '', hospital: '', complications: '' });
    }
  };

  const removeSurgery = (id) => {
    onUpdate({
      previousSurgeries: data.previousSurgeries.filter(s => s.id !== id)
    });
  };

  const handleConditionChange = (condition, checked) => {
    const updated = checked
      ? [...data.chronicConditions, condition]
      : data.chronicConditions.filter(c => c !== condition);
    onUpdate({ chronicConditions: updated });
  };

  const handleFamilyHistoryChange = (condition, checked) => {
    const updated = checked
      ? [...data.familyHistory, condition]
      : data.familyHistory.filter(c => c !== condition);
    onUpdate({ familyHistory: updated });
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Medical History</h2>
        <p className="text-gray-600">Please provide your comprehensive medical background information</p>
      </div>

      {/* Allergies Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span>Allergies</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="allergyName">Allergy Name</Label>
              <Input
                id="allergyName"
                value={newAllergy.name}
                onChange={(e) => setNewAllergy(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Penicillin, Dust"
              />
            </div>
            <div>
              <Label htmlFor="allergySeverity">Severity</Label>
              <Select 
                value={newAllergy.severity} 
                onValueChange={(value) => setNewAllergy(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                  <SelectItem value="life-threatening">Life-threatening</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addAllergy} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Allergy
              </Button>
            </div>
          </div>

          {data.allergies.length > 0 && (
            <div className="space-y-2">
              {data.allergies.map((allergy) => (
                <div key={allergy.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{allergy.name}</span>
                    <Badge className={getSeverityColor(allergy.severity)}>
                      {allergy.severity}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeAllergy(allergy.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chronic Conditions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            <span>Chronic Conditions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Eye Conditions</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {eyeConditions.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition}
                    checked={data.chronicConditions.includes(condition)}
                    onCheckedChange={(checked) => handleConditionChange(condition, checked)}
                  />
                  <Label htmlFor={condition} className="text-sm">{condition}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">General Health Conditions</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {generalConditions.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition}
                    checked={data.chronicConditions.includes(condition)}
                    onCheckedChange={(checked) => handleConditionChange(condition, checked)}
                  />
                  <Label htmlFor={condition} className="text-sm">{condition}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Medications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Pill className="h-5 w-5 text-green-600" />
            <span>Current Medications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="medicationName">Medication Name</Label>
              <Input
                id="medicationName"
                value={newMedication.name}
                onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Latanoprost eye drops"
              />
            </div>
            <div>
              <Label htmlFor="medicationDosage">Dosage</Label>
              <Input
                id="medicationDosage"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 0.005% 1 drop"
              />
            </div>
            <div>
              <Label htmlFor="medicationFrequency">Frequency</Label>
              <Select 
                value={newMedication.frequency} 
                onValueChange={(value) => setNewMedication(prev => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Once daily">Once daily</SelectItem>
                  <SelectItem value="Twice daily">Twice daily</SelectItem>
                  <SelectItem value="Three times daily">Three times daily</SelectItem>
                  <SelectItem value="Every hour">Every hour</SelectItem>
                  <SelectItem value="Every 2 hours">Every 2 hours</SelectItem>
                  <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                  <SelectItem value="As needed">As needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addMedication} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Medication
              </Button>
            </div>
          </div>

          {data.currentMedications.length > 0 && (
            <div className="space-y-2">
              {data.currentMedications.map((medication) => (
                <div key={medication.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="grid grid-cols-3 gap-4 flex-1">
                    <span className="font-medium">{medication.name}</span>
                    <span className="text-gray-600">{medication.dosage}</span>
                    <span className="text-gray-600">{medication.frequency}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeMedication(medication.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Surgeries Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-purple-600" />
            <span>Previous Surgeries</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="surgeryProcedure">Procedure</Label>
              <Select 
                value={newSurgery.procedure} 
                onValueChange={(value) => setNewSurgery(prev => ({ ...prev, procedure: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select procedure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LASIK">LASIK</SelectItem>
                  <SelectItem value="Cataract Surgery">Cataract Surgery</SelectItem>
                  <SelectItem value="Retinal Surgery">Retinal Surgery</SelectItem>
                  <SelectItem value="Glaucoma Surgery">Glaucoma Surgery</SelectItem>
                  <SelectItem value="Corneal Transplant">Corneal Transplant</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="surgeryDate">Date</Label>
              <Input
                id="surgeryDate"
                type="date"
                value={newSurgery.date}
                onChange={(e) => setNewSurgery(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="surgeryHospital">Hospital</Label>
              <Input
                id="surgeryHospital"
                value={newSurgery.hospital}
                onChange={(e) => setNewSurgery(prev => ({ ...prev, hospital: e.target.value }))}
                placeholder="Hospital name"
              />
            </div>
            <div>
              <Label htmlFor="surgeryComplications">Complications</Label>
              <Input
                id="surgeryComplications"
                value={newSurgery.complications}
                onChange={(e) => setNewSurgery(prev => ({ ...prev, complications: e.target.value }))}
                placeholder="None / Describe"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addSurgery} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Surgery
              </Button>
            </div>
          </div>

          {data.previousSurgeries.length > 0 && (
            <div className="space-y-2">
              {data.previousSurgeries.map((surgery) => (
                <div key={surgery.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="grid grid-cols-4 gap-4 flex-1">
                    <span className="font-medium">{surgery.procedure}</span>
                    <span className="text-gray-600">{surgery.date}</span>
                    <span className="text-gray-600">{surgery.hospital}</span>
                    <span className="text-gray-600">{surgery.complications || 'None'}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeSurgery(surgery.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Family History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <span>Family History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {familyHistoryConditions.map((condition) => (
              <div key={condition} className="flex items-center space-x-2">
                <Checkbox
                  id={`family-${condition}`}
                  checked={data.familyHistory.includes(condition)}
                  onCheckedChange={(checked) => handleFamilyHistoryChange(condition, checked)}
                />
                <Label htmlFor={`family-${condition}`} className="text-sm">{condition}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lifestyle Assessment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cigarette className="h-5 w-5 text-red-600" />
            <span>Lifestyle Assessment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="smoking">Smoking Habits</Label>
              <Select 
                value={data.lifestyle.smoking} 
                onValueChange={(value) => onUpdate({ 
                  lifestyle: { ...data.lifestyle, smoking: value } 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Never">Never</SelectItem>
                  <SelectItem value="Former smoker">Former smoker</SelectItem>
                  <SelectItem value="Occasional">Occasional (less than daily)</SelectItem>
                  <SelectItem value="Daily">Daily smoker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="drinking">Alcohol Consumption</Label>
              <Select 
                value={data.lifestyle.drinking} 
                onValueChange={(value) => onUpdate({ 
                  lifestyle: { ...data.lifestyle, drinking: value } 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Never">Never</SelectItem>
                  <SelectItem value="Rarely">Rarely</SelectItem>
                  <SelectItem value="Socially">Socially (1-2 drinks/week)</SelectItem>
                  <SelectItem value="Moderately">Moderately (3-7 drinks/week)</SelectItem>
                  <SelectItem value="Heavily">Heavily (8+ drinks/week)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="exercise">Exercise Frequency</Label>
              <Select 
                value={data.lifestyle.exercise} 
                onValueChange={(value) => onUpdate({ 
                  lifestyle: { ...data.lifestyle, exercise: value } 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Light">Light (1-2 times/week)</SelectItem>
                  <SelectItem value="Moderate">Moderate (3-4 times/week)</SelectItem>
                  <SelectItem value="Heavy">Heavy (5+ times/week)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="screenTime">Daily Screen Time</Label>
              <Select 
                value={data.lifestyle.screenTime} 
                onValueChange={(value) => onUpdate({ 
                  lifestyle: { ...data.lifestyle, screenTime: value } 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Less than 2 hours">Less than 2 hours</SelectItem>
                  <SelectItem value="2-4 hours">2-4 hours</SelectItem>
                  <SelectItem value="4-6 hours">4-6 hours</SelectItem>
                  <SelectItem value="6-8 hours">6-8 hours</SelectItem>
                  <SelectItem value="More than 8 hours">More than 8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="eyeStrain">Eye Strain Symptoms</Label>
              <Select 
                value={data.lifestyle.eyeStrain} 
                onValueChange={(value) => onUpdate({ 
                  lifestyle: { ...data.lifestyle, eyeStrain: value } 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Mild">Mild (occasional discomfort)</SelectItem>
                  <SelectItem value="Moderate">Moderate (daily discomfort)</SelectItem>
                  <SelectItem value="Severe">Severe (constant discomfort)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext}>
          Next: Insurance & Emergency
        </Button>
      </div>
    </div>
  );
};

export default MedicalHistoryStep;
