import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope } from "lucide-react";

const DoctorFields = ({ formData, handleRoleSpecificChange, handleArrayChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-blue-800 flex items-center">
        <Stethoscope className="h-4 w-4 mr-2" />
        Ophthalmology Specific Information
      </h4>

      {/* Required Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Medical License Number *</Label>
          <Input
            value={formData.roleSpecificData.medicalLicenseNumber || ""}
            onChange={(e) => handleRoleSpecificChange("medicalLicenseNumber", e.target.value)}
            placeholder="e.g., MD123456789"
            required
          />
        </div>
        <div>
          <Label>Medical Council *</Label>
          <Select
            value={formData.roleSpecificData.medicalCouncil || ""}
            onValueChange={(value) => handleRoleSpecificChange("medicalCouncil", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Medical Council" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="State Medical Board">State Medical Board</SelectItem>
              <SelectItem value="Medical Council of India">Medical Council of India</SelectItem>
              <SelectItem value="Maharashtra Medical Council">Maharashtra Medical Council</SelectItem>
              <SelectItem value="Karnataka Medical Council">Karnataka Medical Council</SelectItem>
              <SelectItem value="Gujarat Medical Council">Gujarat Medical Council</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Consultation Fee (₹) *</Label>
          <Input
            type="number"
            value={formData.roleSpecificData.consultationFee || ""}
            onChange={(e) => handleRoleSpecificChange("consultationFee", parseFloat(e.target.value) || 0)}
            min="1"
            placeholder="e.g., 200"
            required
          />
        </div>
        <div>
          <Label>Follow-up Fee (₹) <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.followUpFee || ""}
            onChange={(e) => handleRoleSpecificChange("followUpFee", parseFloat(e.target.value) || 0)}
            min="0"
            placeholder="e.g., 100"
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
            placeholder="e.g., 8"
          />
        </div>
        <div>
          <Label>Max Patients Per Day <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.maxPatientsPerDay || ""}
            onChange={(e) => handleRoleSpecificChange("maxPatientsPerDay", parseInt(e.target.value) || 0)}
            min="1"
            placeholder="e.g., 20"
          />
        </div>
      </div>

      <div>
        <Label>Consultation Hours <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <Input
          value={formData.roleSpecificData.consultationHours || ""}
          onChange={(e) => handleRoleSpecificChange("consultationHours", e.target.value)}
          placeholder="e.g., 9:00 AM - 5:00 PM"
        />
      </div>

      <div>
        <Label>Specializations <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Cataract Surgery", "Retinal Disorders", "Glaucoma", "Corneal Diseases", "Pediatric Ophthalmology", "Oculoplasty", "Neuro-Ophthalmology", "Uveitis"].map((specialty) => (
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
        <Label>Surgery Types <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Cataract", "LASIK", "Retinal Detachment", "Vitrectomy", "Glaucoma Surgery", "Corneal Transplant", "Oculoplastic Surgery"].map((surgery) => (
            <div key={surgery} className="flex items-center space-x-2">
              <Checkbox
                id={surgery}
                checked={(formData.roleSpecificData.surgeryTypes || []).includes(surgery)}
                onCheckedChange={(checked) => handleArrayChange("surgeryTypes", surgery, checked)}
              />
              <Label htmlFor={surgery} className="text-sm">{surgery}</Label>
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
    </div>
  );
};

export default DoctorFields;