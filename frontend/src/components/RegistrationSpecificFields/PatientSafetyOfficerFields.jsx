import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

const PatientSafetyOfficerFields = ({ formData, setFormData }) => {
  // Initialize roleSpecificData fields if they don't exist
  React.useEffect(() => {
    if (!formData.roleSpecificData.safetyCertifications) {
      setFormData(prev => ({
        ...prev,
        roleSpecificData: {
          ...prev.roleSpecificData,
          safetyCertifications: [],
          riskAreas: [],
          investigationExperience: false,
          yearsInSafety: 0
        }
      }));
    }
  }, []);

  const handleArrayChange = (field, value) => {
    const currentArray = formData.roleSpecificData[field] || [];
    if (!currentArray.includes(value)) {
      setFormData(prev => ({
        ...prev,
        roleSpecificData: {
          ...prev.roleSpecificData,
          [field]: [...currentArray, value]
        }
      }));
    }
  };

  const removeArrayItem = (field, index) => {
    const currentArray = formData.roleSpecificData[field] || [];
    setFormData(prev => ({
      ...prev,
      roleSpecificData: {
        ...prev.roleSpecificData,
        [field]: currentArray.filter((_, i) => i !== index)
      }
    }));
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      roleSpecificData: {
        ...prev.roleSpecificData,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Safety Certifications */}
      <div className="space-y-2">
        <Label htmlFor="safetyCertifications">Patient Safety Certifications * <span className="text-red-500 text-sm">(Required - Select at least one)</span></Label>
        <div className="space-y-2">
          <Select onValueChange={(value) => handleArrayChange('safetyCertifications', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select safety certifications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CPPS">Certified Professional in Patient Safety (CPPS)</SelectItem>
              <SelectItem value="Patient Safety Certificate">Patient Safety Certificate</SelectItem>
              <SelectItem value="BLS">Basic Life Support (BLS)</SelectItem>
              <SelectItem value="ACLS">Advanced Cardiac Life Support (ACLS)</SelectItem>
              <SelectItem value="PALS">Pediatric Advanced Life Support (PALS)</SelectItem>
              <SelectItem value="Risk Management">Risk Management Certification</SelectItem>
              <SelectItem value="Emergency Management">Emergency Management</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {(formData.roleSpecificData.safetyCertifications || []).map((cert, index) => (
              <div key={index} className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                {cert}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-600"
                  onClick={() => removeArrayItem('safetyCertifications', index)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Areas */}
      <div className="space-y-2">
        <Label htmlFor="riskAreas">Risk Management Areas of Expertise * <span className="text-red-500 text-sm">(Required - Select at least one)</span></Label>
        <div className="space-y-2">
          <Select onValueChange={(value) => handleArrayChange('riskAreas', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select risk management areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Clinical Risk">Clinical Risk Management</SelectItem>
              <SelectItem value="Medication Safety">Medication Safety</SelectItem>
              <SelectItem value="Infection Control">Infection Control & Prevention</SelectItem>
              <SelectItem value="Fall Prevention">Fall Prevention</SelectItem>
              <SelectItem value="Surgical Safety">Surgical Safety</SelectItem>
              <SelectItem value="Emergency Preparedness">Emergency Preparedness</SelectItem>
              <SelectItem value="Patient Identification">Patient Identification</SelectItem>
              <SelectItem value="Communication Safety">Healthcare Communication</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {(formData.roleSpecificData.riskAreas || []).map((area, index) => (
              <div key={index} className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                {area}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-yellow-600"
                  onClick={() => removeArrayItem('riskAreas', index)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investigation Experience */}
      <div className="space-y-2">
        <Label htmlFor="investigationExperience">Incident Investigation Experience <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="investigationExperience"
            checked={formData.roleSpecificData.investigationExperience || false}
            onCheckedChange={(checked) => handleFieldChange('investigationExperience', checked)}
          />
          <Label htmlFor="investigationExperience" className="text-sm font-normal">
            I have experience in conducting incident investigations and root cause analysis
          </Label>
        </div>
      </div>

      {/* Years in Safety */}
      <div className="space-y-2">
        <Label htmlFor="yearsInSafety">Years of Patient Safety Experience <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <Input
          type="number"
          min="0"
          max="50"
          value={formData.roleSpecificData.yearsInSafety || ''}
          onChange={(e) => handleFieldChange('yearsInSafety', parseInt(e.target.value) || 0)}
          placeholder="Enter years of patient safety experience"
        />
      </div>
    </div>
  );
};

export default PatientSafetyOfficerFields;