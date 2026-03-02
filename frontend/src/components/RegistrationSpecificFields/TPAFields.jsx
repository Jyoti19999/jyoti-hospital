import React from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { X, Plus, Shield, Building } from "lucide-react";
import { Button } from "../ui/button";

const TPAFields = ({ formData, handleRoleSpecificChange, handleArrayChange }) => {

  const addCertification = () => {
    const currentCerts = formData.roleSpecificData?.certifications || [];
    const updatedCerts = [...currentCerts, ''];
    handleRoleSpecificChange('certifications', updatedCerts);
  };

  const updateCertification = (index, value) => {
    const currentCerts = formData.roleSpecificData?.certifications || [];
    const updatedCerts = [...currentCerts];
    updatedCerts[index] = value;
    handleRoleSpecificChange('certifications', updatedCerts);
  };

  const removeCertification = (index) => {
    const currentCerts = formData.roleSpecificData?.certifications || [];
    const updatedCerts = currentCerts.filter((_, i) => i !== index);
    handleRoleSpecificChange('certifications', updatedCerts);
  };

  const addInsuranceCompany = () => {
    const currentCompanies = formData.roleSpecificData?.insuranceCompanies || [];
    const updatedCompanies = [...currentCompanies, ''];
    handleRoleSpecificChange('insuranceCompanies', updatedCompanies);
  };

  const updateInsuranceCompany = (index, value) => {
    const currentCompanies = formData.roleSpecificData?.insuranceCompanies || [];
    const updatedCompanies = [...currentCompanies];
    updatedCompanies[index] = value;
    handleRoleSpecificChange('insuranceCompanies', updatedCompanies);
  };

  const removeInsuranceCompany = (index) => {
    const currentCompanies = formData.roleSpecificData?.insuranceCompanies || [];
    const updatedCompanies = currentCompanies.filter((_, i) => i !== index);
    handleRoleSpecificChange('insuranceCompanies', updatedCompanies);
  };

  return (
    <div className="space-y-6">
      {/* TPA Professional Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            TPA Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TPA License Number */}
            <div>
              <Label htmlFor="tpaLicenseNumber">
                TPA License Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tpaLicenseNumber"
                value={formData.roleSpecificData?.tpaLicenseNumber || ''}
                onChange={(e) => handleRoleSpecificChange('tpaLicenseNumber', e.target.value)}
                placeholder="Enter TPA license number"
              />
            </div>

            {/* Insurance Experience */}
            <div>
              <Label htmlFor="insuranceExperience">
                Insurance Experience <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.roleSpecificData?.insuranceExperience || ''} 
                onValueChange={(value) => handleRoleSpecificChange('insuranceExperience', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2 years">1-2 years</SelectItem>
                  <SelectItem value="3-5 years">3-5 years</SelectItem>
                  <SelectItem value="5-10 years">5-10 years</SelectItem>
                  <SelectItem value="10+ years">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company Affiliation */}
            <div>
              <Label htmlFor="companyAffiliation">
                Company Affiliation <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyAffiliation"
                value={formData.roleSpecificData?.companyAffiliation || ''}
                onChange={(e) => handleRoleSpecificChange('companyAffiliation', e.target.value)}
                placeholder="Enter TPA company name"
              />
            </div>

            {/* License Expiry Date */}
            <div>
              <Label htmlFor="licenseExpiry">License Expiry Date</Label>
              <Input
                id="licenseExpiry"
                type="date"
                value={formData.roleSpecificData?.licenseExpiry || ''}
                onChange={(e) => handleRoleSpecificChange('licenseExpiry', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TPA Certifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            TPA Certifications <span className="text-red-500">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(formData.roleSpecificData?.certifications || []).map((cert, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={cert}
                  onChange={(e) => updateCertification(index, e.target.value)}
                  placeholder="Enter certification name"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeCertification(index)}
                  className="text-red-500 hover:text-red-700 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addCertification}
            className="w-full mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </CardContent>
      </Card>

      {/* Work Preferences & Experience */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building className="h-5 w-5" />
            Work Preferences & Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shift Preference */}
            <div>
              <Label htmlFor="shiftPreference">Shift Preference</Label>
              <Select 
                value={formData.roleSpecificData?.shiftPreference || ''} 
                onValueChange={(value) => handleRoleSpecificChange('shiftPreference', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day Shift (9 AM - 5 PM)</SelectItem>
                  <SelectItem value="evening">Evening Shift (2 PM - 10 PM)</SelectItem>
                  <SelectItem value="night">Night Shift (10 PM - 6 AM)</SelectItem>
                  <SelectItem value="flexible">Flexible Hours</SelectItem>
                  <SelectItem value="rotational">Rotational Shifts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Claim Processing Specialty */}
            <div>
              <Label htmlFor="claimSpecialty">Claim Processing Specialty</Label>
              <Select 
                value={formData.roleSpecificData?.claimSpecialty || ''} 
                onValueChange={(value) => handleRoleSpecificChange('claimSpecialty', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre-authorization">Pre-Authorization</SelectItem>
                  <SelectItem value="claim-processing">Claim Processing</SelectItem>
                  <SelectItem value="investigation">Claim Investigation</SelectItem>
                  <SelectItem value="customer-service">Customer Service</SelectItem>
                  <SelectItem value="provider-network">Provider Network Management</SelectItem>
                  <SelectItem value="quality-assurance">Quality Assurance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes - Full width */}
            <div className="md:col-span-2">
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                value={formData.roleSpecificData?.additionalNotes || ''}
                onChange={(e) => handleRoleSpecificChange('additionalNotes', e.target.value)}
                placeholder="Any additional information or special requirements..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insurance Companies Experience (Optional) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building className="h-5 w-5" />
            Insurance Companies Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(formData.roleSpecificData?.insuranceCompanies || []).map((company, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={company}
                  onChange={(e) => updateInsuranceCompany(index, e.target.value)}
                  placeholder="Enter insurance company name"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeInsuranceCompany(index)}
                  className="text-red-500 hover:text-red-700 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addInsuranceCompany}
            className="w-full mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Insurance Company
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TPAFields;