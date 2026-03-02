// src/components/super-admin/lens/LensForm.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  Save,
  AlertTriangle,
  Calendar,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import lensStockService from '@/services/lensStockService';

const LensForm = ({ lens = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    lensName: '',
    manufacturer: '',
    lensType: '',
    lensCategory: '',
    power: '',
    lensoCost: '',
    patientCost: '',
    stockQuantity: '',
    reorderLevel: '',
    expiryDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const isEditing = !!lens;

  useEffect(() => {
    if (lens) {
      setFormData({
        lensName: lens.lensName || '',
        manufacturer: lens.manufacturer || '',
        lensType: lens.lensType || '',
        lensCategory: lens.lensCategory || '',
        power: lens.power || '',
        lensoCost: lens.lensoCost?.toString() || '',
        patientCost: lens.patientCost?.toString() || '',
        stockQuantity: lens.stockQuantity?.toString() || '',
        reorderLevel: lens.reorderLevel?.toString() || '',
        expiryDate: lens.expiryDate ? new Date(lens.expiryDate).toISOString().split('T')[0] : ''
      });
    }
  }, [lens]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.lensName.trim()) {
      errors.lensName = 'Lens name is required';
    }

    if (!formData.lensType) {
      errors.lensType = 'Lens type is required';
    }

    if (!formData.lensCategory) {
      errors.lensCategory = 'Lens category is required';
    }

    if (!formData.lensoCost.trim()) {
      errors.lensoCost = 'Lenso cost is required';
    } else if (isNaN(formData.lensoCost) || parseFloat(formData.lensoCost) < 0) {
      errors.lensoCost = 'Lenso cost must be a valid number';
    }

    if (!formData.patientCost.trim()) {
      errors.patientCost = 'Patient cost is required';
    } else if (isNaN(formData.patientCost) || parseFloat(formData.patientCost) < 0) {
      errors.patientCost = 'Patient cost must be a valid number';
    }

    if (!formData.stockQuantity.trim()) {
      errors.stockQuantity = 'Stock quantity is required';
    } else if (isNaN(formData.stockQuantity) || parseInt(formData.stockQuantity) < 0) {
      errors.stockQuantity = 'Stock quantity must be a valid number';
    }

    if (!formData.reorderLevel.trim()) {
      errors.reorderLevel = 'Reorder level is required';
    } else if (isNaN(formData.reorderLevel) || parseInt(formData.reorderLevel) < 0) {
      errors.reorderLevel = 'Reorder level must be a valid number';
    }

    if (formData.expiryDate) {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      if (expiryDate <= today) {
        errors.expiryDate = 'Expiry date must be in the future';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitData = {
        lensName: formData.lensName.trim(),
        manufacturer: formData.manufacturer.trim() || undefined,
        lensType: formData.lensType,
        lensCategory: formData.lensCategory,
        power: formData.power.trim() || undefined,
        lensoCost: parseFloat(formData.lensoCost),
        patientCost: parseFloat(formData.patientCost),
        stockQuantity: parseInt(formData.stockQuantity),
        reorderLevel: parseInt(formData.reorderLevel),
        expiryDate: formData.expiryDate || undefined
      };

      let response;
      if (isEditing) {
        response = await lensStockService.updateLensStock(lens.id, submitData);
      } else {
        response = await lensStockService.createLensStock(submitData);
      }

      if (response.success) {
        toast.success(isEditing ? 'Lens updated successfully' : 'Lens created successfully');
        onSuccess();
      }

    } catch (error) {
      setError(error.message || 'Failed to save lens');
      toast.error('Failed to save lens');
    } finally {
      setLoading(false);
    }
  };

  const lensTypes = [
    { value: 'IOL', label: 'IOL' },
    { value: 'TORIC_IOL', label: 'Toric IOL' },
    { value: 'MULTIFOCAL_IOL', label: 'Multifocal IOL' }
  ];

  const lensCategories = [
    { value: 'MONOFOCAL', label: 'Monofocal' },
    { value: 'MULTIFOCAL', label: 'Multifocal' },
    { value: 'TORIC', label: 'Toric' },
    { value: 'EXTENDED_DEPTH_FOCUS', label: 'Extended Depth Focus' }
  ];

  return (
    <div className="space-y-6" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {isEditing ? 'Edit Lens' : 'Add New Lens'}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Update lens details and inventory information'
                : 'Add new lens to the hospital inventory'
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lens Name */}
                <div className="space-y-2">
                  <Label htmlFor="lensName">Lens Name *</Label>
                  <Input
                    id="lensName"
                    value={formData.lensName}
                    onChange={(e) => handleInputChange('lensName', e.target.value)}
                    placeholder="Enter lens name"
                    className={validationErrors.lensName ? 'border-destructive' : ''}
                  />
                  {validationErrors.lensName && (
                    <p className="text-sm text-destructive">{validationErrors.lensName}</p>
                  )}
                </div>



                {/* Manufacturer */}
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    placeholder="Enter manufacturer name"
                  />
                </div>

                {/* Lens Type */}
                <div className="space-y-2">
                  <Label htmlFor="lensType">Lens Type *</Label>
                  <Select 
                    value={formData.lensType} 
                    onValueChange={(value) => handleInputChange('lensType', value)}
                  >
                    <SelectTrigger className={validationErrors.lensType ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select lens type" />
                    </SelectTrigger>
                    <SelectContent>
                      {lensTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.lensType && (
                    <p className="text-sm text-destructive">{validationErrors.lensType}</p>
                  )}
                </div>

                {/* Lens Category */}
                <div className="space-y-2">
                  <Label htmlFor="lensCategory">Lens Category *</Label>
                  <Select 
                    value={formData.lensCategory} 
                    onValueChange={(value) => handleInputChange('lensCategory', value)}
                  >
                    <SelectTrigger className={validationErrors.lensCategory ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select lens category" />
                    </SelectTrigger>
                    <SelectContent>
                      {lensCategories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.lensCategory && (
                    <p className="text-sm text-destructive">{validationErrors.lensCategory}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Technical Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="power">Power</Label>
                  <Input
                    id="power"
                    value={formData.power}
                    onChange={(e) => handleInputChange('power', e.target.value)}
                    placeholder="Lens power"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="lensoCost">Lenso Cost (₹) *</Label>
                  <div className="relative">
                    <DollarSign className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="lensoCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.lensoCost}
                      onChange={(e) => handleInputChange('lensoCost', e.target.value)}
                      placeholder="0.00"
                      className={`pl-9 ${validationErrors.lensoCost ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {validationErrors.lensoCost && (
                    <p className="text-sm text-destructive">{validationErrors.lensoCost}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patientCost">Patient Cost (₹) *</Label>
                  <div className="relative">
                    <DollarSign className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="patientCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.patientCost}
                      onChange={(e) => handleInputChange('patientCost', e.target.value)}
                      placeholder="0.00"
                      className={`pl-9 ${validationErrors.patientCost ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {validationErrors.patientCost && (
                    <p className="text-sm text-destructive">{validationErrors.patientCost}</p>
                  )}
                </div>


              </div>
            </div>

            {/* Stock Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Stock Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => handleInputChange('stockQuantity', e.target.value)}
                    placeholder="Enter current stock"
                    className={validationErrors.stockQuantity ? 'border-destructive' : ''}
                  />
                  {validationErrors.stockQuantity && (
                    <p className="text-sm text-destructive">{validationErrors.stockQuantity}</p>
                  )}
                </div>

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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
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
                </div>
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
                    {isEditing ? 'Update Lens' : 'Create Lens'}
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

export default LensForm;