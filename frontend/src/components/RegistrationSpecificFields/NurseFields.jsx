import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart } from "lucide-react";

const NurseFields = ({ formData, handleRoleSpecificChange, handleArrayChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-green-800 flex items-center">
        <Heart className="h-4 w-4 mr-2" />
        Nurse Specific Information
      </h4>

      {/* Required Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nursing License Number *</Label>
          <Input
            value={formData.roleSpecificData.nursingLicenseNumber || ""}
            onChange={(e) => handleRoleSpecificChange("nursingLicenseNumber", e.target.value)}
            placeholder="e.g., RN987654321"
            required
          />
        </div>
        <div>
          <Label>Nursing Degree *</Label>
          <Select
            value={formData.roleSpecificData.nursingDegree || ""}
            onValueChange={(value) => handleRoleSpecificChange("nursingDegree", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Nursing Degree" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bachelor of Science in Nursing">Bachelor of Science in Nursing</SelectItem>
              <SelectItem value="Associate Degree in Nursing">Associate Degree in Nursing</SelectItem>
              <SelectItem value="Diploma in Nursing">Diploma in Nursing</SelectItem>
              <SelectItem value="Master of Science in Nursing">Master of Science in Nursing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Shift Type *</Label>
        <Select
          value={formData.roleSpecificData.shiftType || ""}
          onValueChange={(value) => handleRoleSpecificChange("shiftType", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Shift Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day Shift</SelectItem>
            <SelectItem value="night">Night Shift</SelectItem>
            <SelectItem value="rotating">Rotating Shift</SelectItem>
          </SelectContent>
        </Select>
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
            placeholder="e.g., 5"
          />
        </div>
        <div>
          <Label>Ward Assignment <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            value={formData.roleSpecificData.wardAssignment || ""}
            onChange={(e) => handleRoleSpecificChange("wardAssignment", e.target.value)}
            placeholder="e.g., Eye Surgery Ward"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Certification Expiry <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="date"
            value={formData.roleSpecificData.certificationExpiry || ""}
            onChange={(e) => handleRoleSpecificChange("certificationExpiry", e.target.value)}
          />
        </div>
        <div>
          <Label>Nursing Council <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            value={formData.roleSpecificData.nursingCouncil || ""}
            onChange={(e) => handleRoleSpecificChange("nursingCouncil", e.target.value)}
            placeholder="e.g., State Nursing Board"
          />
        </div>
      </div>

      <div>
        <Label>Specializations <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Pre-operative Care", "Post-operative Care", "Critical Care", "Pediatric Care", "Surgical Assistance", "Patient Education", "Wound Care", "Medication Administration"].map((specialty) => (
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
          <Label>Can Administer Medication <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.canAdministerMedication?.toString() || ""}
            onValueChange={(value) => handleRoleSpecificChange("canAdministerMedication", value === "true")}
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
    </div>
  );
};

export default NurseFields;