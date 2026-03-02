import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone } from "lucide-react";

const ReceptionistFields = ({ formData, handleRoleSpecificChange, handleArrayChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-cyan-800 flex items-center">
        <Phone className="h-4 w-4 mr-2" />
        Receptionist Information
      </h4>

      {/* Required Fields */}
      <div>
        <Label>Shift Timing *</Label>
        <Select
          value={formData.roleSpecificData.shiftTiming || ""}
          onValueChange={(value) => handleRoleSpecificChange("shiftTiming", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Shift Timing" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">Morning</SelectItem>
            <SelectItem value="evening">Evening</SelectItem>
            <SelectItem value="night">Night</SelectItem>
            <SelectItem value="rotating">Rotating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Department Assignment <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.departmentAssignment || ""}
            onValueChange={(value) => handleRoleSpecificChange("departmentAssignment", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main_reception">Main Reception</SelectItem>
              <SelectItem value="specialty_clinic_reception">Specialty Clinic Reception</SelectItem>
              <SelectItem value="emergency_reception">Emergency Reception</SelectItem>
              <SelectItem value="billing_reception">Billing Reception</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Customer Service Experience (Years) <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.customerServiceExperience || ""}
            onChange={(e) => handleRoleSpecificChange("customerServiceExperience", parseInt(e.target.value) || 0)}
            min="0"
            placeholder="e.g., 2"
          />
        </div>
      </div>

      <div>
        <Label>Language Support <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["English", "Spanish", "French", "Mandarin", "Hindi", "Arabic", "Portuguese", "German"].map((language) => (
            <div key={language} className="flex items-center space-x-2">
              <Checkbox
                id={language}
                checked={(formData.roleSpecificData.languageSupport || []).includes(language)}
                onCheckedChange={(checked) => handleArrayChange("languageSupport", language, checked)}
              />
              <Label htmlFor={language} className="text-sm">{language}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Computer Skills <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Microsoft Office", "Hospital Management System", "Appointment Scheduling", "Insurance Verification", "Data Entry", "Customer Service Software"].map((skill) => (
            <div key={skill} className="flex items-center space-x-2">
              <Checkbox
                id={skill}
                checked={(formData.roleSpecificData.computerSkills || []).includes(skill)}
                onCheckedChange={(checked) => handleArrayChange("computerSkills", skill, checked)}
              />
              <Label htmlFor={skill} className="text-sm">{skill}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReceptionistFields;