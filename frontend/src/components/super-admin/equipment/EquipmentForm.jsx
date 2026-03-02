// src/components/super-admin/equipment/EquipmentForm.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Package,
  ArrowLeft,
  Save,
  AlertTriangle,
  Calendar,
  DollarSign,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import equipmentService from '@/services/equipmentService';

const EquipmentForm = ({ equipment = null, onSuccess, onCancel, isModal = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    manufacturer: '',
    currentStock: '',
    reorderLevel: '',
    unitCost: '',
    expiryDate: '',
    batchNumber: '',
    register: '',
    marginDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const isEditing = !!equipment;

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || '',
        code: equipment.code || '',
        category: equipment.category || '',
        manufacturer: equipment.manufacturer || '',
        currentStock: equipment.currentStock?.toString() || '',
        reorderLevel: equipment.reorderLevel?.toString() || '',
        unitCost: equipment.unitCost?.toString() || '',
        expiryDate: equipment.expiryDate ? new Date(equipment.expiryDate).toISOString().split('T')[0] : '',
        batchNumber: equipment.batchNumber || '',
        register: equipment.register || '',
        marginDate: equipment.marginDate ? new Date(equipment.marginDate).toISOString().split('T')[0] : ''
      });
    }
  }, [equipment]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Equipment name is required';
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }

    // Medicine category specific validations
    const isMedicine = formData.category === 'Medicine';

    if (isMedicine) {
      if (!formData.register.trim()) {
        errors.register = 'Register is required for Medicine category';
      }

      // Only OtEmergencyStockRegister requires all fields to be mandatory
      const isOtEmergency = formData.register === 'OtEmergencyStockRegister';

      if (isOtEmergency) {
        if (!formData.manufacturer.trim()) {
          errors.manufacturer = 'Manufacturer/Brand name is required for OT Emergency Stock';
        }

        if (!formData.batchNumber.trim()) {
          errors.batchNumber = 'Batch number is required for OT Emergency Stock';
        }

        if (!formData.marginDate) {
          errors.marginDate = 'Margin date is required for OT Emergency Stock';
        }

        if (!formData.expiryDate) {
          errors.expiryDate = 'Expiry date is required for OT Emergency Stock';
        }

        if (!formData.unitCost || !formData.unitCost.trim()) {
          errors.unitCost = 'Unit cost is required for OT Emergency Stock';
        }
      }
    }

    if (!formData.currentStock.trim()) {
      errors.currentStock = 'Current stock is required';
    } else if (isNaN(formData.currentStock) || parseInt(formData.currentStock) < 0) {
      errors.currentStock = 'Current stock must be a valid number';
    }

    if (!formData.reorderLevel.trim()) {
      errors.reorderLevel = 'Reorder level is required';
    } else if (isNaN(formData.reorderLevel) || parseInt(formData.reorderLevel) < 0) {
      errors.reorderLevel = 'Reorder level must be a valid number';
    }

    // Unit cost is mandatory for Medicine category
    if (isMedicineCategory) {
      if (!formData.unitCost || !formData.unitCost.trim()) {
        errors.unitCost = 'Unit cost is required for Medicine category';
      } else if (isNaN(formData.unitCost) || parseFloat(formData.unitCost) < 0) {
        errors.unitCost = 'Unit cost must be a valid number';
      }
    } else {
      // Optional validation for other categories
      if (formData.unitCost && (isNaN(formData.unitCost) || parseFloat(formData.unitCost) < 0)) {
        errors.unitCost = 'Unit cost must be a valid number';
      }
    }

    if (formData.expiryDate) {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      if (expiryDate <= today) {
        errors.expiryDate = 'Expiry date must be in the future';
      }
    }

    if (formData.marginDate) {
      const marginDate = new Date(formData.marginDate);
      const today = new Date();
      if (marginDate > today) {
        errors.marginDate = 'Margin date must be in the past';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Don't show toast - validation errors are already highlighted in the form
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
        category: formData.category,
        manufacturer: formData.manufacturer.trim() || undefined,
        currentStock: parseInt(formData.currentStock),
        reorderLevel: parseInt(formData.reorderLevel),
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : undefined,
        expiryDate: formData.expiryDate || undefined,
        batchNumber: formData.batchNumber.trim() || undefined,
        register: formData.register || undefined,
        marginDate: formData.marginDate || undefined
      };

      let response;
      if (isEditing) {
        response = await equipmentService.updateEquipment(equipment.id, submitData);
      } else {
        response = await equipmentService.createEquipment(submitData);
      }

      if (response.success) {
        toast.success(isEditing ? 'Equipment updated successfully' : 'Equipment created successfully');
        onSuccess();
      }

    } catch (error) {
      setError(error.message || 'Failed to save equipment');
      toast.error('Failed to save equipment');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Surgical Instruments',
    'Consumables',
    'Devices',
    'Diagnostic Equipment',
    'Safety Equipment',
    'Monitoring Equipment',
    'Medicine'
  ];

  const registers = [
    'FridgeStockMedicinesRegister',
    'EquipmentStockRegister',
    'OtEmergencyStockRegister'
  ];

  const isMedicineCategory = formData.category === 'Medicine';

  return (
    <div className="space-y-6">
      <Card>
        {!isModal && (
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={onCancel}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {isEditing ? 'Edit Equipment' : 'Add New Equipment'}
                </CardTitle>
                <CardDescription>
                  {isEditing
                    ? 'Update equipment details and inventory information'
                    : 'Add new equipment to the hospital inventory'
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className={isModal ? "pt-4" : ""}>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Equipment Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Equipment Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    // Only allow letters, numbers, and spaces
                    const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
                    handleInputChange('name', value);
                  }}
                  placeholder="Enter equipment name"
                  maxLength={100}
                  className={validationErrors.name ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Only letters, numbers, and spaces allowed (max 100 chars)
                </p>
                {validationErrors.name && (
                  <p className="text-sm text-destructive">{validationErrors.name}</p>
                )}
              </div>

              {/* Equipment Code */}
              <div className="space-y-2">
                <Label htmlFor="code">Equipment Code</Label>
                <div className="relative">
                  <Hash className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => {
                      // Only allow uppercase letters, numbers, hyphens, and underscores
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9\-_]/g, "");
                      handleInputChange("code", value);
                    }}
                    placeholder="e.g., MED-001, LENS_IOL"
                    maxLength={20}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-generated if empty. Only A-Z, 0-9, -, _ allowed
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger className={validationErrors.category ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.category && (
                  <p className="text-sm text-destructive">{validationErrors.category}</p>
                )}
              </div>

              {/* Register - Only for Medicine category */}
              {isMedicineCategory && (
                <div className="space-y-2">
                  <Label htmlFor="register">Register *</Label>
                  <Select
                    value={formData.register}
                    onValueChange={(value) => handleInputChange('register', value)}
                  >
                    <SelectTrigger className={validationErrors.register ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select register" />
                    </SelectTrigger>
                    <SelectContent>
                      {registers.map(register => (
                        <SelectItem key={register} value={register}>
                          {register.replace(/([A-Z])/g, ' $1').trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.register && (
                    <p className="text-sm text-destructive">{validationErrors.register}</p>
                  )}
                </div>
              )}

              {/* Manufacturer/Brand Name */}
              <div className="space-y-2">
                <Label htmlFor="manufacturer">
                  Manufacturer/Brand Name {isMedicineCategory && formData.register === 'OtEmergencyStockRegister' && '*'}
                </Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => {
                    // Only allow letters, numbers, and spaces
                    const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
                    handleInputChange('manufacturer', value);
                  }}
                  placeholder={isMedicineCategory ? "e.g., Johnson and Johnson, Alcon India" : "Enter manufacturer name"}
                  maxLength={100}
                  className={validationErrors.manufacturer ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Only letters, numbers, and spaces allowed (max 100 chars)
                </p>
                {validationErrors.manufacturer && (
                  <p className="text-sm text-destructive">{validationErrors.manufacturer}</p>
                )}
              </div>

              {/* Current Stock */}
              <div className="space-y-2">
                <Label htmlFor="currentStock">Current Stock *</Label>
                <Input
                  id="currentStock"
                  type="number"
                  min="0"
                  value={formData.currentStock}
                  onChange={(e) => handleInputChange('currentStock', e.target.value)}
                  placeholder="Enter current stock quantity"
                  className={validationErrors.currentStock ? 'border-destructive' : ''}
                />
                {validationErrors.currentStock && (
                  <p className="text-sm text-destructive">{validationErrors.currentStock}</p>
                )}
              </div>

              {/* Reorder Level */}
              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Reorder Level *</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={(e) => handleInputChange('reorderLevel', e.target.value)}
                  placeholder="Minimum stock level"
                  className={validationErrors.reorderLevel ? 'border-destructive' : ''}
                />
                {validationErrors.reorderLevel && (
                  <p className="text-sm text-destructive">{validationErrors.reorderLevel}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  You'll get alerts when stock falls below this level
                </p>
              </div>

              {/* Unit Cost */}
              <div className="space-y-2">
                <Label htmlFor="unitCost">
                  Unit Cost (₹) {isMedicineCategory && '*'}
                </Label>
                <div className="relative">
                  {/* <DollarSign className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" /> */}
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitCost}
                    onChange={(e) => handleInputChange('unitCost', e.target.value)}
                    placeholder="0.00"
                    className={`pl-9 ${validationErrors.unitCost ? 'border-destructive' : ''}`}
                    required={isMedicineCategory}
                  />
                </div>
                {validationErrors.unitCost && (
                  <p className="text-sm text-destructive">{validationErrors.unitCost}</p>
                )}
              </div>

              {/* Margin Date - Only for Medicine category */}
              {isMedicineCategory && (
                <div className="space-y-2">
                  <Label htmlFor="marginDate">
                    Margin Date {formData.register === 'OtEmergencyStockRegister' && '*'}
                  </Label>
                  <div className="relative">
                    <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="marginDate"
                      type="date"
                      value={formData.marginDate}
                      onChange={(e) => handleInputChange('marginDate', e.target.value)}
                      className={`pl-9 ${validationErrors.marginDate ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {validationErrors.marginDate && (
                    <p className="text-sm text-destructive">{validationErrors.marginDate}</p>
                  )}
                </div>
              )}

              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="expiryDate">
                  Expiry Date {isMedicineCategory && formData.register === 'OtEmergencyStockRegister' && '*'}
                </Label>
                <div className="relative">
                  <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className={`pl-9 ${validationErrors.expiryDate ? 'border-destructive' : ''}`}
                  />
                </div>
                {validationErrors.expiryDate && (
                  <p className="text-sm text-destructive">{validationErrors.expiryDate}</p>
                )}
                {!isMedicineCategory && (
                  <p className="text-xs text-muted-foreground">
                    Leave empty for equipment without expiry
                  </p>
                )}
              </div>

              {/* Batch Number */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="batchNumber">
                  Batch Number {isMedicineCategory && formData.register === 'OtEmergencyStockRegister' && '*'}
                </Label>
                <Input
                  id="batchNumber"
                  value={formData.batchNumber}
                  onChange={(e) => {
                    // Only allow letters, numbers, forward slash, and hyphen
                    const value = e.target.value.replace(/[^a-zA-Z0-9\/-]/g, "");
                    handleInputChange('batchNumber', value);
                  }}
                  placeholder="e.g., BATCH-2024/001, LOT-12345"
                  maxLength={50}
                  className={validationErrors.batchNumber ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Only letters, numbers, / and - allowed (max 50 chars)
                </p>
                {validationErrors.batchNumber && (
                  <p className="text-sm text-destructive">{validationErrors.batchNumber}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Equipment' : 'Create Equipment'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentForm;