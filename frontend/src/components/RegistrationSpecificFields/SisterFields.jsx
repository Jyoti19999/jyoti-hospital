import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeartHandshake } from "lucide-react";

const SisterFields = ({ formData, handleRoleSpecificChange, handleArrayChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-pink-800 flex items-center">
        <HeartHandshake className="h-4 w-4 mr-2" />
        Sister/Head Nurse Specific Information
      </h4>

      {/* Required Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nursing Registration Number *</Label>
          <Input
            value={formData.roleSpecificData.nursingRegistrationNumber || ""}
            onChange={(e) => handleRoleSpecificChange("nursingRegistrationNumber", e.target.value)}
            placeholder="e.g., RN987654321"
            required
          />
        </div>
        <div>
          <Label>Nursing Council *</Label>
          <Select
            value={formData.roleSpecificData.nursingCouncil || ""}
            onValueChange={(value) => handleRoleSpecificChange("nursingCouncil", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Nursing Council" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Indian Nursing Council">Indian Nursing Council</SelectItem>
              <SelectItem value="State Nursing Board">State Nursing Board</SelectItem>
              <SelectItem value="Maharashtra Nursing Council">Maharashtra Nursing Council</SelectItem>
              <SelectItem value="Karnataka Nursing Council">Karnataka Nursing Council</SelectItem>
              <SelectItem value="Gujarat Nursing Council">Gujarat Nursing Council</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Highest Nursing Qualification *</Label>
          <Select
            value={formData.roleSpecificData.nursingQualification || ""}
            onValueChange={(value) => handleRoleSpecificChange("nursingQualification", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Qualification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="B.Sc Nursing">B.Sc Nursing</SelectItem>
              <SelectItem value="M.Sc Nursing">M.Sc Nursing</SelectItem>
              <SelectItem value="Post Basic B.Sc Nursing">Post Basic B.Sc Nursing</SelectItem>
              <SelectItem value="Diploma in Nursing">Diploma in Nursing</SelectItem>
              <SelectItem value="Auxiliary Nurse Midwife">Auxiliary Nurse Midwife</SelectItem>
              <SelectItem value="General Nursing & Midwifery">General Nursing & Midwifery</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>OT Experience Level *</Label>
          <Select
            value={formData.roleSpecificData.otExperienceLevel || ""}
            onValueChange={(value) => handleRoleSpecificChange("otExperienceLevel", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Experience Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Head Sister">Head Sister</SelectItem>
              <SelectItem value="Senior Sister">Senior Sister</SelectItem>
              <SelectItem value="Staff Nurse">Staff Nurse</SelectItem>
              <SelectItem value="Assistant Nurse">Assistant Nurse</SelectItem>
              <SelectItem value="Scrub Nurse">Scrub Nurse</SelectItem>
              <SelectItem value="Circulating Nurse">Circulating Nurse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Years of OT Experience <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.yearsOfExperience || ""}
            onChange={(e) => handleRoleSpecificChange("yearsOfExperience", parseInt(e.target.value) || 0)}
            min="0"
            placeholder="e.g., 7"
          />
        </div>
        <div>
          <Label>Shift Type <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.shiftType || ""}
            onValueChange={(value) => handleRoleSpecificChange("shiftType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Shift Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning Shift (6 AM - 2 PM)</SelectItem>
              <SelectItem value="evening">Evening Shift (2 PM - 10 PM)</SelectItem>
              <SelectItem value="night">Night Shift (10 PM - 6 AM)</SelectItem>
              <SelectItem value="rotating">Rotating Shifts</SelectItem>
              <SelectItem value="on-call">On-Call Availability</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Team Size Managed <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.teamSizeManaged || ""}
            onChange={(e) => handleRoleSpecificChange("teamSizeManaged", parseInt(e.target.value) || 0)}
            min="0"
            placeholder="e.g., 8"
          />
        </div>
        <div>
          <Label>Emergency Response Trained <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.emergencyTrained?.toString() || ""}
            onValueChange={(value) => handleRoleSpecificChange("emergencyTrained", value === "true")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Emergency Response Trained</SelectItem>
              <SelectItem value="false">Not Emergency Response Trained</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>OT Specializations <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Ophthalmic Surgery", "Cataract Surgery", "Retinal Surgery", "Laser Surgery", "Emergency Surgery", "Pediatric Surgery", "Day Care Surgery", "Complex Surgery"].map((specialty) => (
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
        <Label>OT Responsibilities <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Patient Preparation", "Surgical Assistance", "Equipment Management", "Sterilization Oversight", "Staff Coordination", "Quality Control", "Documentation", "Patient Monitoring"].map((responsibility) => (
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

      <div>
        <Label>Equipment Expertise <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Surgical Instruments", "Anesthesia Equipment", "Monitoring Devices", "Sterilization Equipment", "Surgical Lights", "Suction Units", "Electrocautery", "Emergency Equipment"].map((equipment) => (
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
        <Label>Certifications <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["BLS Certified", "ACLS Certified", "PALS Certified", "Infection Control", "OT Management", "Quality Assurance", "Patient Safety", "Leadership Training"].map((certification) => (
            <div key={certification} className="flex items-center space-x-2">
              <Checkbox
                id={certification}
                checked={(formData.roleSpecificData.certifications || []).includes(certification)}
                onCheckedChange={(checked) => handleArrayChange("certifications", certification, checked)}
              />
              <Label htmlFor={certification} className="text-sm">{certification}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Can Train Junior Staff <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.canTrainStaff?.toString() || ""}
            onValueChange={(value) => handleRoleSpecificChange("canTrainStaff", value === "true")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Can Train Junior Staff</SelectItem>
              <SelectItem value="false">Cannot Train Junior Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Maximum Surgeries Per Day <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.maxSurgeriesPerDay || ""}
            onChange={(e) => handleRoleSpecificChange("maxSurgeriesPerDay", parseInt(e.target.value) || 0)}
            min="1"
            placeholder="e.g., 12"
          />
        </div>
      </div>
    </div>
  );
};

export default SisterFields;