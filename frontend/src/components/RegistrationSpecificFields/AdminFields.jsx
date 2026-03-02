import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield } from "lucide-react";

const AdminFields = ({ formData, handleRoleSpecificChange, handleArrayChange }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-md font-semibold text-orange-800 flex items-center">
        <Shield className="h-4 w-4 mr-2" />
        Administrator Information
      </h4>

      {/* Optional Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Access Level <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Select
            value={formData.roleSpecificData.accessLevel || ""}
            onValueChange={(value) => handleRoleSpecificChange("accessLevel", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Access Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="department">Department Level</SelectItem>
              <SelectItem value="hospital">Hospital Level</SelectItem>
              <SelectItem value="system">System Level</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Years of Experience <span className="text-gray-500 text-sm">(Optional)</span></Label>
          <Input
            type="number"
            value={formData.roleSpecificData.yearsOfExperience || ""}
            onChange={(e) => handleRoleSpecificChange("yearsOfExperience", parseInt(e.target.value) || 0)}
            min="0"
            placeholder="e.g., 4"
          />
        </div>
      </div>

      <div>
        <Label>System Permissions <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["user_management", "report_access", "billing_access", "system_admin", "audit_access", "data_export", "configuration_access"].map((permission) => (
            <div key={permission} className="flex items-center space-x-2">
              <Checkbox
                id={permission}
                checked={(formData.roleSpecificData.systemPermissions || []).includes(permission)}
                onCheckedChange={(checked) => handleArrayChange("systemPermissions", permission, checked)}
              />
              <Label htmlFor={permission} className="text-sm">{permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Department Access <span className="text-gray-500 text-sm">(Optional)</span></Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {["administration", "finance", "hr", "operations", "quality_assurance", "it_support", "medical_records"].map((dept) => (
            <div key={dept} className="flex items-center space-x-2">
              <Checkbox
                id={dept}
                checked={(formData.roleSpecificData.departmentAccess || []).includes(dept)}
                onCheckedChange={(checked) => handleArrayChange("departmentAccess", dept, checked)}
              />
              <Label htmlFor={dept} className="text-sm">{dept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminFields;