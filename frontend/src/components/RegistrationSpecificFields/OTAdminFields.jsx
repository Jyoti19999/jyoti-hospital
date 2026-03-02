import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";

const OTAdminFields = ({ formData, handleRoleSpecificChange, handleArrayChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-blue-800 flex items-center">
        <Settings className="h-4 w-4 mr-2" />
        OT Administrator Specific Information
      </h4>

      {/* Required Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>OT Management License Number *</Label>
          <Input
            value={formData.roleSpecificData.otLicenseNumber || ""}
            onChange={(e) => handleRoleSpecificChange("otLicenseNumber", e.target.value)}
            placeholder="e.g., OT123456789"
            required
          />
        </div>
        <div>
          <Label>Hospital Administration Certification *</Label>
          <Select
            value={formData.roleSpecificData.adminCertification || ""}
            onValueChange={(value) => handleRoleSpecificChange("adminCertification", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Certification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Healthcare Administration">Healthcare Administration</SelectItem>
              <SelectItem value="Hospital Management">Hospital Management</SelectItem>
              <SelectItem value="Operation Theatre Management">Operation Theatre Management</SelectItem>
              <SelectItem value="Medical Services Administration">Medical Services Administration</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>OT Rooms Managed *</Label>
          <Input
            type="number"
            value={formData.roleSpecificData.otRoomsManaged || ""}
            onChange={(e) => handleRoleSpecificChange("otRoomsManaged", parseInt(e.target.value) || 0)}
            min="1"
            placeholder="e.g., 3"
            required
          />
        </div>
        <div>
          <Label>Shift Schedule *</Label>
          <Select
            value={formData.roleSpecificData.shiftSchedule || ""}
            onValueChange={(value) => handleRoleSpecificChange("shiftSchedule", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Shift" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning (6 AM - 2 PM)</SelectItem>
              <SelectItem value="evening">Evening (2 PM - 10 PM)</SelectItem>
              <SelectItem value="night">Night (10 PM - 6 AM)</SelectItem>
              <SelectItem value="rotating">Rotating Shifts</SelectItem>
              <SelectItem value="full-time">Full Time (24/7 On-Call)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Years of OT Management Experience <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.yearsOfExperience || ""}
            onChange={(e) => handleRoleSpecificChange("yearsOfExperience", parseInt(e.target.value) || 0)}
            min="0"
            placeholder="e.g., 5"
          />
        </div>
        <div>
          <Label>Emergency Contact Availability <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.emergencyAvailability?.toString() || ""}
            onValueChange={(value) => handleRoleSpecificChange("emergencyAvailability", value === "true")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Available for Emergency Calls</SelectItem>
              <SelectItem value="false">Not Available for Emergency Calls</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>OT Management Specializations <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Surgery Scheduling", "Equipment Management", "Staff Coordination", "Inventory Control", "Quality Assurance", "Emergency Protocols", "Resource Planning", "Cost Management"].map((specialty) => (
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
        <Label>OT Equipment Expertise <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Surgical Lights", "Anesthesia Machines", "Monitoring Equipment", "Sterilization Systems", "Ventilators", "Electrocautery Units", "Microscopes", "Endoscopy Equipment"].map((equipment) => (
            <div key={equipment} className="flex items-center space-x-2">
              <Checkbox
                id={equipment}
                checked={(formData.roleSpecificData.equipmentExpertise || []).includes(equipment)}
                onCheckedChange={(checked) => handleArrayChange("equipmentExpertise", equipment, checked)}
              />
              <Label htmlFor={equipment} className="text-sm">{equipment}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Management Responsibilities <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Pre-op Preparation", "Surgery Coordination", "Post-op Management", "Staff Scheduling", "Inventory Management", "Quality Control", "Emergency Response", "Documentation"].map((responsibility) => (
            <div key={responsibility} className="flex items-center space-x-2">
              <Checkbox
                id={responsibility}
                checked={(formData.roleSpecificData.responsibilities || []).includes(responsibility)}
                onCheckedChange={(checked) => handleArrayChange("responsibilities", responsibility, checked)}
              />
              <Label htmlFor={responsibility} className="text-sm">{responsibility}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Can Authorize Emergency Surgeries <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.canAuthorizeEmergency?.toString() || ""}
            onValueChange={(value) => handleRoleSpecificChange("canAuthorizeEmergency", value === "true")}
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
          <Label>Maximum Daily Surgeries Manageable <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.maxDailySurgeries || ""}
            onChange={(e) => handleRoleSpecificChange("maxDailySurgeries", parseInt(e.target.value) || 0)}
            min="1"
            placeholder="e.g., 15"
          />
        </div>
      </div>
    </div>
  );
};

export default OTAdminFields;