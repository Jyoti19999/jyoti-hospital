import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye } from "lucide-react";

const OptometristFields = ({ formData, handleRoleSpecificChange, handleArrayChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-indigo-800 flex items-center">
        <Eye className="h-4 w-4 mr-2" />
        Optometrist Information
      </h4>

      {/* Required Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Optometry License Number *</Label>
          <Input
            value={formData.roleSpecificData.optometryLicenseNumber || ""}
            onChange={(e) => handleRoleSpecificChange("optometryLicenseNumber", e.target.value)}
            placeholder="e.g., OD789123456"
            required
          />
        </div>
        <div>
          <Label>Optometry Degree *</Label>
          <Input
            value={formData.roleSpecificData.optometryDegree || ""}
            onChange={(e) => handleRoleSpecificChange("optometryDegree", e.target.value)}
            placeholder="e.g., Doctor of Optometry"
            required
          />
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
            placeholder="e.g., 6"
          />
        </div>
        <div>
          <Label>Consultation Fee (₹) <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.consultationFee || ""}
            onChange={(e) => handleRoleSpecificChange("consultationFee", parseFloat(e.target.value) || 0)}
            min="0"
            placeholder="e.g., 150"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Follow-up Fee (₹) <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.followUpFee || ""}
            onChange={(e) => handleRoleSpecificChange("followUpFee", parseFloat(e.target.value) || 0)}
            min="0"
            placeholder="e.g., 75"
          />
        </div>
        <div>
          <Label>Max Patients Per Day <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.maxPatientsPerDay || ""}
            onChange={(e) => handleRoleSpecificChange("maxPatientsPerDay", parseInt(e.target.value) || 0)}
            min="1"
            placeholder="e.g., 15"
          />
        </div>
      </div>

      <div>
        <Label>Consultation Hours <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <Input
          value={formData.roleSpecificData.consultationHours || ""}
          onChange={(e) => handleRoleSpecificChange("consultationHours", e.target.value)}
          placeholder="e.g., 8:00 AM - 4:00 PM"
        />
      </div>

      <div>
        <Label>Specializations <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Pediatric Optometry", "Contact Lens Fitting", "Low Vision Rehabilitation", "Binocular Vision", "Vision Therapy", "Dry Eye Management", "Myopia Control"].map((specialty) => (
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

      <div>
        <Label>Operating Days <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
            <div key={day} className="flex items-center space-x-2">
              <Checkbox
                id={day}
                checked={(formData.roleSpecificData.operatingDays || []).includes(day)}
                onCheckedChange={(checked) => handleArrayChange("operatingDays", day, checked)}
              />
              <Label htmlFor={day} className="text-sm">{day}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Equipment Certified <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Phoropter", "Slit Lamp", "Tonometer", "Retinoscope", "Autorefractor", "Keratometer", "Fundus Camera", "OCT"].map((equipment) => (
            <div key={equipment} className="flex items-center space-x-2">
              <Checkbox
                id={equipment}
                checked={(formData.roleSpecificData.equipmentCertified || []).includes(equipment)}
                onCheckedChange={(checked) => handleArrayChange("equipmentCertified", equipment, checked)}
              />
              <Label htmlFor={equipment} className="text-sm">{equipment}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Can Prescribe Medication <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <Select
          value={formData.roleSpecificData.canPrescribeMedication?.toString() || ""}
          onValueChange={(value) => handleRoleSpecificChange("canPrescribeMedication", value === "true")}
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
  );
};

export default OptometristFields;