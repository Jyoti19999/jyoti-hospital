import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

const AccountantFields = ({ formData, setFormData }) => {
  const handleArrayChange = (field, value) => {
    if (!formData.roleSpecificData[field].includes(value)) {
      setFormData(prev => ({
        ...prev,
        roleSpecificData: {
          ...prev.roleSpecificData,
          [field]: [...prev.roleSpecificData[field], value]
        }
      }));
    }
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      roleSpecificData: {
        ...prev.roleSpecificData,
        [field]: prev.roleSpecificData[field].filter((_, i) => i !== index)
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
      {/* Accounting Certifications */}
      <div className="space-y-2">
        <Label htmlFor="accountingCertifications">Accounting Certifications</Label>
        <div className="space-y-2">
          <Select onValueChange={(value) => handleArrayChange('accountingCertifications', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select certifications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CPA">Certified Public Accountant (CPA)</SelectItem>
              <SelectItem value="CMA">Certified Management Accountant (CMA)</SelectItem>
              <SelectItem value="CA">Chartered Accountant (CA)</SelectItem>
              <SelectItem value="ACCA">Association of Chartered Certified Accountants (ACCA)</SelectItem>
              <SelectItem value="CFA">Chartered Financial Analyst (CFA)</SelectItem>
              <SelectItem value="CIA">Certified Internal Auditor (CIA)</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {formData.roleSpecificData.accountingCertifications?.map((cert, index) => (
              <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {cert}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-blue-600"
                  onClick={() => removeArrayItem('accountingCertifications', index)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Software Proficiency */}
      <div className="space-y-2">
        <Label htmlFor="softwareProficiency">Software Proficiency</Label>
        <div className="space-y-2">
          <Select onValueChange={(value) => handleArrayChange('softwareProficiency', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select software skills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tally">Tally ERP</SelectItem>
              <SelectItem value="QuickBooks">QuickBooks</SelectItem>
              <SelectItem value="SAP">SAP</SelectItem>
              <SelectItem value="Excel">Microsoft Excel</SelectItem>
              <SelectItem value="Zoho Books">Zoho Books</SelectItem>
              <SelectItem value="Busy">Busy Accounting</SelectItem>
              <SelectItem value="Oracle">Oracle Financials</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {formData.roleSpecificData.softwareProficiency?.map((software, index) => (
              <div key={index} className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                {software}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-green-600"
                  onClick={() => removeArrayItem('softwareProficiency', index)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Specialization */}
      <div className="space-y-2">
        <Label htmlFor="specialization">Area of Specialization</Label>
        <Select onValueChange={(value) => handleFieldChange('specialization', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select specialization area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="General Accounting">General Accounting</SelectItem>
            <SelectItem value="Tax">Tax Management</SelectItem>
            <SelectItem value="Payroll">Payroll Management</SelectItem>
            <SelectItem value="Audit">Auditing</SelectItem>
            <SelectItem value="Budgeting">Budgeting & Planning</SelectItem>
            <SelectItem value="Cost Accounting">Cost Accounting</SelectItem>
            <SelectItem value="Financial Analysis">Financial Analysis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Years of Experience */}
      <div className="space-y-2">
        <Label htmlFor="yearsOfExperience">Years of Accounting Experience</Label>
        <Input
          type="number"
          min="0"
          max="50"
          value={formData.roleSpecificData.yearsOfExperience || ''}
          onChange={(e) => handleFieldChange('yearsOfExperience', parseInt(e.target.value) || 0)}
          placeholder="Enter years of experience"
        />
      </div>
    </div>
  );
};

export default AccountantFields;