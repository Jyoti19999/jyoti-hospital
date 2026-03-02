import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Download, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RegisterManager = ({
  title,
  apiEndpoint,
  fields,
  columns,
  exportFilename,
  useEquipmentTable = false,
  registerType = null
}) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [otRooms, setOtRooms] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    // Initialize form data with default values
    const initialData = {};
    fields.forEach(field => {
      if (field.type === 'date') {
        initialData[field.key] = new Date().toISOString().split('T')[0];
      } else {
        initialData[field.key] = '';
      }
    });
    setFormData(initialData);
    fetchEntries();

    // Fetch OT rooms if needed
    const hasOTRoomField = fields.some(f => f.type === 'otroom-select');
    if (hasOTRoomField) {
      fetchOTRooms();
    }
  }, []);

  const fetchOTRooms = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
      const response = await fetch(`${API_BASE_URL}/ot-rooms`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setOtRooms(data.data || []);
      }
    } catch (error) {
    }
  };

  const fetchEntries = async () => {

    setLoading(true);
    try {
      let url, data;

      if (useEquipmentTable && registerType) {
        // Fetch from Equipment table filtered by register type
        url = `/api/v1/equipment?category=Medicine&limit=1000`;

        const response = await fetch(url, {
          credentials: 'include'
        });

        data = await response.json();

        if (data.success) {
          // Filter by register type and map to register format
          const allMedicines = data.data || [];

          const filtered = allMedicines.filter(item => {
            return item.register === registerType;
          });

          setEntries(filtered.map((item, index) => ({
            ...item,
            srNo: index + 1
          })));
        } else {
          toast.error(data.message || 'Failed to fetch data');
        }
      } else {
        // Use original register API
        url = `/api/v1/registers/${apiEndpoint}`;

        const response = await fetch(url, {
          credentials: 'include'
        });

        data = await response.json();

        if (data.success) {
          setEntries(data.data);
        } else {
          toast.error(data.message || 'Failed to fetch data');
        }
      }
    } catch (error) {
      toast.error(`Failed to fetch ${title} entries: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let url, method, body;

      if (useEquipmentTable && registerType) {
        // Use Equipment API
        url = editingId ? `/api/v1/equipment/${editingId}` : `/api/v1/equipment`;
        method = editingId ? 'PUT' : 'POST';

        // Map register fields to equipment fields
        body = {
          name: formData.name || formData.nameOfInjection,
          category: 'Medicine',
          register: registerType,
          currentStock: parseInt(formData.currentStock || formData.expectedStock || 0),
          reorderLevel: parseInt(formData.reorderLevel || 5),
          manufacturer: formData.manufacturer || formData.brandName,
          batchNumber: formData.batchNumber || formData.batchNo,
          marginDate: formData.marginDate || undefined,
          expiryDate: formData.expiryDate || undefined,
          unitCost: parseFloat(formData.unitCost) || undefined
        };
      } else {
        // Use original register API
        url = editingId
          ? `/api/v1/registers/${apiEndpoint}/${editingId}`
          : `/api/v1/registers/${apiEndpoint}`;
        method = editingId ? 'PUT' : 'POST';
        body = formData;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingId ? 'Entry updated successfully' : 'Entry created successfully');
        fetchEntries();
        resetForm();
      } else {
        // Show detailed validation errors
        if (data.errors && Array.isArray(data.errors)) {
          // Multiple validation errors
          const errorMessages = data.errors.map(err => err.msg || err.message).join(', ');
          toast.error(`Validation Error: ${errorMessages}`);
        } else if (data.message) {
          // Single error message
          toast.error(data.message);
        } else {
          toast.error('Operation failed');
        }
      }
    } catch (error) {

      // Handle network or parsing errors
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map(err => err.msg || err.message).join(', ');
          toast.error(`Validation Error: ${errorMessages}`);
        } else if (errorData.message) {
          toast.error(errorData.message);
        } else {
          toast.error('Operation failed');
        }
      } else {
        toast.error(error.message || 'Operation failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    const editData = {};
    fields.forEach(field => {
      if (field.type === 'date' && entry[field.key]) {
        editData[field.key] = entry[field.key].split('T')[0];
      } else {
        editData[field.key] = entry[field.key] || '';
      }
    });
    setFormData(editData);
    setEditingId(entry.id);
    setShowForm(true);
  };
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    setLoading(true);
    try {
      const url = useEquipmentTable && registerType
        ? `/api/v1/equipment/${id}`
        : `/api/v1/registers/${apiEndpoint}/${id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Entry deleted successfully');
        fetchEntries();
      } else {
        toast.error(data.message || 'Delete failed');
      }
    } catch (error) {
      toast.error('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const initialData = {};
    fields.forEach(field => {
      if (field.type === 'date') {
        initialData[field.key] = new Date().toISOString().split('T')[0];
      } else {
        initialData[field.key] = '';
      }
    });
    setFormData(initialData);
    setEditingId(null);
    setShowForm(false);
  };

  const handleExport = async () => {
    try {
      // Add month/year params for all registers
      const params = new URLSearchParams();
      params.append('month', selectedMonth);
      params.append('year', selectedYear);
      
      if (useEquipmentTable && registerType) {
        params.append('registerType', registerType);
      }

      const queryString = params.toString();
      const url = `/api/v1/registers/${apiEndpoint}/export${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportFilename}_${selectedMonth}_${selectedYear}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Export completed successfully');
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleYearlyExport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('year', selectedYear);
      params.append('exportType', 'yearly');
      if (useEquipmentTable && registerType) {
        params.append('registerType', registerType);
      }

      const queryString = params.toString();
      const url = `/api/v1/registers/${apiEndpoint}/export${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportFilename}_${selectedYear}_Yearly.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Yearly export completed successfully');
      } else {
        toast.error('Yearly export failed');
      }
    } catch (error) {
      toast.error('Yearly export failed');
    }
  };

  const renderFormField = (field) => {
    const { key, label, type, options, required, dependsOn } = field;

    // Check if field should be required based on dependency
    let isRequired = required;
    if (dependsOn) {
      const { field: dependentField, value: dependentValue } = dependsOn;
      isRequired = formData[dependentField] === dependentValue;
    }

    switch (type) {
      case 'otroom-select':
        return (
          <div key={key}>
            <Label htmlFor={key}>
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={formData[key]}
              onValueChange={(value) => setFormData({ ...formData, [key]: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select OT Room" />
              </SelectTrigger>
              <SelectContent>
                {otRooms.map(room => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.roomName} ({room.roomNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'select':
        return (
          <div key={key}>
            <Label htmlFor={key}>
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={formData[key]}
              onValueChange={(value) => setFormData({ ...formData, [key]: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${label}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'number':
        return (
          <div key={key}>
            <Label htmlFor={key}>
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={key}
              type="number"
              step={field.step || "1"}
              min={field.min !== undefined ? field.min : undefined}
              max={field.max !== undefined ? field.max : undefined}
              value={formData[key]}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              required={isRequired}
            />
          </div>
        );

      case 'date':
        const today = new Date().toISOString().split('T')[0];
        return (
          <div key={key}>
            <Label htmlFor={key}>
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={key}
              type="date"
              value={formData[key]}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              required={isRequired}
              min={field.todayOnly ? today : undefined}
              max={field.todayOnly ? today : undefined}
              readOnly={field.todayOnly && editingId}
            />
          </div>
        );

      case 'time':
        return (
          <div key={key}>
            <Label htmlFor={key}>
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={key}
              type="time"
              value={formData[key]}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              required={isRequired}
            />
          </div>
        );

      default:
        // Special handling for batch number fields
        const isBatchField = key.toLowerCase().includes('batch');
        // Special handling for name fields (nameOfItem, patientName)
        const isNameField = key === 'nameOfItem' || key === 'patientName';

        return (
          <div key={key}>
            <Label htmlFor={key}>
              {label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={key}
              type="text"
              value={formData[key]}
              onChange={(e) => {
                if (isBatchField) {
                  // Only allow uppercase letters and numbers for batch fields
                  const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                  setFormData({ ...formData, [key]: value });
                } else if (isNameField) {
                  // Only allow letters, numbers, and spaces for name fields
                  const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
                  setFormData({ ...formData, [key]: value });
                } else {
                  setFormData({ ...formData, [key]: e.target.value });
                }
              }}
              placeholder={isBatchField ? "A-Z, 0-9 only" : isNameField ? "Letters, numbers, and spaces only" : undefined}
              required={isRequired}
            />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Dedicated title section - fixed */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-gray-50/30">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-gray-500">Month:</Label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-gray-500">Year:</Label>
            <Input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              min={2020}
              max={new Date().getFullYear()}
              className="w-20 h-8 text-sm"
            />
          </div>
          <Button onClick={() => setShowForm(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" />
            Add Entry
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export Month
          </Button>
          <Button onClick={handleYearlyExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export Year
          </Button>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Entry' : 'Add New Entry'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(85vh-120px)]">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
              {fields.map(field => renderFormField(field))}
            </form>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={resetForm}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading} onClick={handleSubmit}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content rendered directly below title - scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center py-8 text-gray-500">
                  No entries found. {useEquipmentTable ? 'Add medicines in Equipment Management with this register type.' : 'Click "Add" to create a new record.'}
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  {columns.map(column => (
                    <TableCell key={column.key}>
                      {column.type === 'date' && entry[column.key]
                        ? new Date(entry[column.key]).toLocaleDateString()
                        : entry[column.key] || '-'
                      }
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(entry)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RegisterManager;