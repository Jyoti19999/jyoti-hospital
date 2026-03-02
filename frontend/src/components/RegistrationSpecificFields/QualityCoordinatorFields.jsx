import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

const QualityCoordinatorFields = ({ formData, setFormData }) => {
  // Initialize roleSpecificData fields if they don't exist
  React.useEffect(() => {
    if (!formData.roleSpecificData.qualityCertifications) {
      setFormData(prev => ({
        ...prev,
        roleSpecificData: {
          ...prev.roleSpecificData,
          qualityCertifications: [],
          qualityTools: [],
          auditExperience: '',
          yearsInQuality: 0
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
      {/* Quality Certifications */}
      <div className="space-y-2">
        <Label htmlFor="qualityCertifications">Quality Management Certifications * <span className="text-red-500 text-sm">(Required - Select at least one)</span></Label>
        <div className="space-y-2">
          <Select onValueChange={(value) => handleArrayChange('qualityCertifications', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select quality certifications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Six Sigma Green Belt">Six Sigma Green Belt</SelectItem>
              <SelectItem value="Six Sigma Black Belt">Six Sigma Black Belt</SelectItem>
              <SelectItem value="ISO 9001">ISO 9001 Quality Management</SelectItem>
              <SelectItem value="NABH">NABH (National Accreditation Board)</SelectItem>
              <SelectItem value="JCI">JCI (Joint Commission International)</SelectItem>
              <SelectItem value="CPHQ">CPHQ (Certified Professional in Healthcare Quality)</SelectItem>
              <SelectItem value="Lean Management">Lean Management</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {(formData.roleSpecificData.qualityCertifications || []).map((cert, index) => (
              <div key={index} className="flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                {cert}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-purple-600"
                  onClick={() => removeArrayItem('qualityCertifications', index)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Experience */}
      <div className="space-y-2">
        <Label htmlFor="auditExperience">Audit Experience Level * <span className="text-red-500 text-sm">(Required)</span></Label>
        <Select 
          value={formData.roleSpecificData.auditExperience || ''}
          onValueChange={(value) => handleFieldChange('auditExperience', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select audit experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Internal Audit">Internal Audit</SelectItem>
            <SelectItem value="External Audit">External Audit</SelectItem>
            <SelectItem value="Both">Both Internal & External</SelectItem>
            <SelectItem value="None">No Audit Experience</SelectItem>
            <SelectItem value="Compliance Audit">Compliance Audit</SelectItem>
            <SelectItem value="Process Audit">Process Audit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quality Tools */}
      <div className="space-y-2">
        <Label htmlFor="qualityTools">Quality Management Tools Expertise <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="space-y-2">
          <Select onValueChange={(value) => handleArrayChange('qualityTools', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select quality tools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Root Cause Analysis">Root Cause Analysis (RCA)</SelectItem>
              <SelectItem value="PDCA">PDCA Cycle</SelectItem>
              <SelectItem value="Statistical Analysis">Statistical Process Control</SelectItem>
              <SelectItem value="FMEA">Failure Mode and Effects Analysis</SelectItem>
              <SelectItem value="5S">5S Methodology</SelectItem>
              <SelectItem value="Kaizen">Kaizen Improvement</SelectItem>
              <SelectItem value="Control Charts">Control Charts</SelectItem>
              <SelectItem value="Fishbone Diagram">Fishbone/Ishikawa Diagram</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {(formData.roleSpecificData.qualityTools || []).map((tool, index) => (
              <div key={index} className="flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                {tool}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-orange-600"
                  onClick={() => removeArrayItem('qualityTools', index)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Years in Quality */}
      <div className="space-y-2">
        <Label htmlFor="yearsInQuality">Years of Quality Management Experience <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <Input
          type="number"
          min="0"
          max="50"
          value={formData.roleSpecificData.yearsInQuality || ''}
          onChange={(e) => handleFieldChange('yearsInQuality', parseInt(e.target.value) || 0)}
          placeholder="Enter years of quality experience"
        />
      </div>
    </div>
  );
};

export default QualityCoordinatorFields;