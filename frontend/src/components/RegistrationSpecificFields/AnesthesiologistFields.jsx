import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity } from "lucide-react";

const AnesthesiologistFields = ({ formData, handleRoleSpecificChange, handleArrayChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-purple-800 flex items-center">
        <Activity className="h-4 w-4 mr-2" />
        Anesthesiologist Specific Information
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
          <Label>Anesthesia Board Certification *</Label>
          <Select
            value={formData.roleSpecificData.anesthesiaCertification || ""}
            onValueChange={(value) => handleRoleSpecificChange("anesthesiaCertification", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Certification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Board Certified Anesthesiologist">Board Certified Anesthesiologist</SelectItem>
              <SelectItem value="Diplomate of National Board">Diplomate of National Board</SelectItem>
              <SelectItem value="MD Anesthesiology">MD Anesthesiology</SelectItem>
              <SelectItem value="DA (Diploma in Anesthesiology)">DA (Diploma in Anesthesiology)</SelectItem>
              <SelectItem value="DNB Anesthesiology">DNB Anesthesiology</SelectItem>
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
          <Label>License Expiry Date *</Label>
          <Input
            type="date"
            value={formData.roleSpecificData.licenseExpiry || ""}
            onChange={(e) => handleRoleSpecificChange("licenseExpiry", e.target.value)}
            required
          />
        </div>
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Years of Anesthesia Experience <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.yearsOfExperience || ""}
            onChange={(e) => handleRoleSpecificChange("yearsOfExperience", parseInt(e.target.value) || 0)}
            min="0"
            placeholder="e.g., 8"
          />
        </div>
        <div>
          <Label>Emergency Call Availability <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.emergencyCallAvailable?.toString() || ""}
            onValueChange={(value) => handleRoleSpecificChange("emergencyCallAvailable", value === "true")}
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
        <Label>Anesthesia Specializations <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["General Anesthesia", "Regional Anesthesia", "Local Anesthesia", "Pediatric Anesthesia", "Cardiac Anesthesia", "Neuroanesthesia", "Ophthalmic Anesthesia", "Pain Management"].map((specialty) => (
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
        <Label>Surgery Types Experience <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Cataract Surgery", "Retinal Surgery", "Glaucoma Surgery", "Corneal Transplant", "Vitrectomy", "LASIK", "Oculoplastic Surgery", "Emergency Eye Surgery"].map((surgery) => (
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
        <Label>Anesthesia Equipment Proficiency <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["Anesthesia Machine", "Ventilator", "Monitoring Equipment", "Defibrillator", "Infusion Pumps", "Airway Management", "Central Line Insertion", "Nerve Blocks"].map((equipment) => (
            <div key={equipment} className="flex items-center space-x-2">
              <Checkbox
                id={equipment}
                checked={(formData.roleSpecificData.equipmentProficiency || []).includes(equipment)}
                onCheckedChange={(checked) => handleArrayChange("equipmentProficiency", equipment, checked)}
              />
              <Label htmlFor={equipment} className="text-sm">{equipment}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>ACLS Certification <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.aclsCertified?.toString() || ""}
            onValueChange={(value) => handleRoleSpecificChange("aclsCertified", value === "true")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">ACLS Certified</SelectItem>
              <SelectItem value="false">Not ACLS Certified</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Maximum Daily Cases <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.maxDailyCases || ""}
            onChange={(e) => handleRoleSpecificChange("maxDailyCases", parseInt(e.target.value) || 0)}
            min="1"
            placeholder="e.g., 8"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Can Handle Pediatric Cases <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.pediatricCapable?.toString() || ""}
            onValueChange={(value) => handleRoleSpecificChange("pediatricCapable", value === "true")}
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
          <Label>Pain Management Experience <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.painManagementExpert?.toString() || ""}
            onValueChange={(value) => handleRoleSpecificChange("painManagementExpert", value === "true")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Pain Management Expert</SelectItem>
              <SelectItem value="false">Basic Pain Management</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default AnesthesiologistFields;