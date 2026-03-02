import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors } from "lucide-react";

const SurgeonFields = ({ formData, handleRoleSpecificChange, handleArrayChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-red-800 flex items-center">
        <Scissors className="h-4 w-4 mr-2" />
        Surgeon Specific Information
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
          <Label>Surgical Board Certification *</Label>
          <Select
            value={formData.roleSpecificData.surgicalCertification || ""}
            onValueChange={(value) => handleRoleSpecificChange("surgicalCertification", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Certification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MS Ophthalmology">MS Ophthalmology</SelectItem>
              <SelectItem value="FRCS Ophthalmology">FRCS Ophthalmology</SelectItem>
              <SelectItem value="DNB Ophthalmology">DNB Ophthalmology</SelectItem>
              <SelectItem value="Fellowship in Vitreoretinal Surgery">Fellowship in Vitreoretinal Surgery</SelectItem>
              <SelectItem value="Fellowship in Oculoplasty">Fellowship in Oculoplasty</SelectItem>
              <SelectItem value="Fellowship in Corneal Surgery">Fellowship in Corneal Surgery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Medical Council Registration *</Label>
          <Select
            value={formData.roleSpecificData.medicalCouncil || ""}
            onValueChange={(value) => handleRoleSpecificChange("medicalCouncil", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Medical Council" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Medical Council of India">Medical Council of India</SelectItem>
              <SelectItem value="State Medical Board">State Medical Board</SelectItem>
              <SelectItem value="Maharashtra Medical Council">Maharashtra Medical Council</SelectItem>
              <SelectItem value="Karnataka Medical Council">Karnataka Medical Council</SelectItem>
              <SelectItem value="Gujarat Medical Council">Gujarat Medical Council</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Surgery Fee (₹) *</Label>
          <Input
            type="number"
            value={formData.roleSpecificData.surgeryFee || ""}
            onChange={(e) => handleRoleSpecificChange("surgeryFee", parseFloat(e.target.value) || 0)}
            min="1"
            placeholder="e.g., 25000"
            required
          />
        </div>
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Years of Surgical Experience <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.yearsOfExperience || ""}
            onChange={(e) => handleRoleSpecificChange("yearsOfExperience", parseInt(e.target.value) || 0)}
            min="0"
            placeholder="e.g., 12"
          />
        </div>
        <div>
          <Label>Maximum Surgeries Per Day <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.maxSurgeriesPerDay || ""}
            onChange={(e) => handleRoleSpecificChange("maxSurgeriesPerDay", parseInt(e.target.value) || 0)}
            min="1"
            placeholder="e.g., 6"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Surgery Hours <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            value={formData.roleSpecificData.surgeryHours || ""}
            onChange={(e) => handleRoleSpecificChange("surgeryHours", e.target.value)}
            placeholder="e.g., 8:00 AM - 6:00 PM"
          />
        </div>
        <div>
          <Label>Emergency Surgery Availability <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.emergencyAvailable?.toString() || ""}
            onValueChange={(value) => handleRoleSpecificChange("emergencyAvailable", value === "true")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Available for Emergency Surgery</SelectItem>
              <SelectItem value="false">Not Available for Emergency Surgery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Surgical Specializations <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Cataract Surgery", "Retinal Surgery", "Glaucoma Surgery", "Corneal Transplant", "Vitrectomy", "LASIK/Refractive Surgery", "Oculoplastic Surgery", "Pterygium Surgery"].map((specialty) => (
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
        <Label>Advanced Surgical Techniques <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Phacoemulsification", "Femtosecond Laser", "Micro-incision Surgery", "Endoscopic Surgery", "Robotic Surgery", "Laser Surgery", "Microsurgery", "Minimally Invasive Techniques"].map((technique) => (
            <div key={technique} className="flex items-center space-x-2">
              <Checkbox
                id={technique}
                checked={(formData.roleSpecificData.advancedTechniques || []).includes(technique)}
                onCheckedChange={(checked) => handleArrayChange("advancedTechniques", technique, checked)}
              />
              <Label htmlFor={technique} className="text-sm">{technique}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Surgical Equipment Expertise <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Operating Microscope", "Phacoemulsification Machine", "Vitrectomy Machine", "Excimer Laser", "Femtosecond Laser", "Surgical Cautery", "Cryotherapy Unit", "Ultrasound Equipment"].map((equipment) => (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Can Perform Complex Retinal Surgery <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.complexRetinalCapable?.toString() || ""}
            onValueChange={(value) => handleRoleSpecificChange("complexRetinalCapable", value === "true")}
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
          <Label>Teaching Experience <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.hasTeachingExperience?.toString() || ""}
            onValueChange={(value) => handleRoleSpecificChange("hasTeachingExperience", value === "true")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Has Teaching Experience</SelectItem>
              <SelectItem value="false">No Teaching Experience</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default SurgeonFields;