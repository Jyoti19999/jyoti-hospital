import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";

const TechnicianFields = ({ formData, handleRoleSpecificChange, handleArrayChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-purple-800 flex items-center">
        <Settings className="h-4 w-4 mr-2" />
        Technician Specific Information
      </h4>

      {/* Required Fields */}
      <div>
        <Label>Specialization * <span className="text-red-500 text-sm">(Required)</span></Label>
        <Input
          value={formData.roleSpecificData.specialization || ""}
          onChange={(e) => handleRoleSpecificChange("specialization", e.target.value)}
          placeholder="e.g., Ophthalmic Technician, Lab Technician"
          required
        />
      </div>

      <div>
        <Label>Technician Certification <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <Input
          value={formData.roleSpecificData.technicianCertification || ""}
          onChange={(e) => handleRoleSpecificChange("technicianCertification", e.target.value)}
          placeholder="e.g., COT12345"
        />
      </div>

      <div>
        <Label>Diagnostic Equipment <span className="text-gray-500 text-sm">(Optional - Select if applicable)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["OCT Machine", "Visual Field Analyzer", "Fundus Camera", "Autorefractor", "NCT", "Keratometer", "Biometer", "A-Scan", "Corneal Topographer", "Optical Biometry"].map((equipment) => (
            <div key={equipment} className="flex items-center space-x-2">
              <Checkbox
                id={equipment}
                checked={(formData.roleSpecificData.diagnosticEquipment || []).includes(equipment)}
                onCheckedChange={(checked) => handleArrayChange("diagnosticEquipment", equipment, checked)}
              />
              <Label htmlFor={equipment} className="text-sm">{equipment}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Years of Experience <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.yearsOfExperience || ""}
            onChange={(e) => handleRoleSpecificChange("yearsOfExperience", parseInt(e.target.value) || 0)}
            min="0"
            placeholder="e.g., 3"
          />
        </div>
        <div>
          <Label>Certification Expiry <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="date"
            value={formData.roleSpecificData.certificationExpiry || ""}
            onChange={(e) => handleRoleSpecificChange("certificationExpiry", e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Specializations <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Optical Coherence Tomography", "Visual Field Testing", "Corneal Imaging", "Retinal Photography", "Biometry", "Contact Lens Fitting", "Low Vision Assessment"].map((specialty) => (
            <div key={specialty} className="flex items-center space-x-2">
              <Checkbox
                id={specialty}
                checked={(formData.roleSpecificData.specializations || []).includes(specialty)}
                onCheckedChange={(checked) => handleArrayChange("specializations", specialty, checked)}
              />
              <Label htmlFor={specialty} className="text-sm">{specialty}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Can Operate Equipment <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.canOperateEquipment?.toString() || ""}
            onValueChange={(value) => handleRoleSpecificChange("canOperateEquipment", value === "true")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Maintenance Skills <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Basic Equipment Maintenance", "Calibration", "Advanced Troubleshooting", "Preventive Maintenance", "Software Updates", "Quality Control"].map((skill) => (
            <div key={skill} className="flex items-center space-x-2">
              <Checkbox
                id={skill}
                checked={(formData.roleSpecificData.maintenanceSkills || []).includes(skill)}
                onCheckedChange={(checked) => handleArrayChange("maintenanceSkills", skill, checked)}
              />
              <Label htmlFor={skill} className="text-sm">{skill}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechnicianFields;