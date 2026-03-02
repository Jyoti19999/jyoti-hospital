import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const EditRegisterForm = ({ register, onBack }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState([]);
  const [allowedStaffTypes, setAllowedStaffTypes] = useState([]);
  const [staffTypes, setStaffTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Column delete confirmation dialog state
  const [deleteColumnDialogOpen, setDeleteColumnDialogOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState(null);

  const columnTypes = [
    'TEXT',
    'NUMBER',
    'LONG_NUMBER',
    'DATE',
    'TIME',
    'DATETIME',
    'IMAGE',
    'PDF_DOCUMENT',
    'EMAIL',
    'MOBILE',
    'URL',
    'DROPDOWN',
    'MULTI_SELECT'
  ];

  useEffect(() => {
    // Fetch staff types
    const fetchStaffTypes = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/staff-types`);
        setStaffTypes(response.data);
      } catch (error) {
      }
    };
    fetchStaffTypes();

    if (register) {
      setName(register.name);
      setDescription(register.description || '');
      setAllowedStaffTypes(register.allowedStaffTypes || []);
      setColumns(register.columns.map(col => ({
        id: col.id,
        columnName: col.columnName,
        columnType: col.columnType,
        isRequired: col.isRequired,
        isExisting: true
      })));
    }
  }, [register]);

  const addColumn = () => {
    setColumns([...columns, { columnName: '', columnType: 'TEXT', isRequired: false, isExisting: false, options: [] }]);
  };

  const removeColumn = (index) => {
    const column = columns[index];

    if (column.isExisting) {
      setColumnToDelete({ index, column });
      setDeleteColumnDialogOpen(true);
    } else {
      setColumns(columns.filter((_, i) => i !== index));
    }
  };

  const confirmColumnDelete = () => {
    if (columnToDelete) {
      setColumns(columns.filter((_, i) => i !== columnToDelete.index));
      setDeleteColumnDialogOpen(false);
      setColumnToDelete(null);
    }
  };

  const cancelColumnDelete = () => {
    setDeleteColumnDialogOpen(false);
    setColumnToDelete(null);
  };

  const updateColumn = (index, field, value) => {
    const updated = [...columns];
    updated[index][field] = value;
    setColumns(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const columnData = columns.map(col => ({
        columnName: col.columnName,
        columnType: col.columnType,
        isRequired: col.isRequired,
        minLength: col.minLength || null,
        maxLength: col.maxLength || null,
        minValue: col.minValue || null,
        maxValue: col.maxValue || null,
        pattern: col.pattern || null,
        options: col.options || null  // Include options for DROPDOWN and MULTI_SELECT
      }));


      if (register) {
        // Update existing register
        await axios.put(
          `${API_BASE_URL}/digital-registers/definitions/${register.id}`,
          { name, description, columns: columnData, allowedStaffTypes },
          { withCredentials: true }
        );
        setSuccessMessage('Register updated successfully!');
        setShowSuccessDialog(true);
      } else {
        // Create new register
        await axios.post(
          `${API_BASE_URL}/digital-registers/definitions`,
          { name, description, columns: columnData, allowedStaffTypes },
          { withCredentials: true }
        );
        setSuccessMessage('Register created successfully!');
        setShowSuccessDialog(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save register');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="border-blue-300 hover:bg-blue-50">← Back</Button>
          <h2 className="text-3xl font-bold text-gray-900">{register ? 'Edit Register' : 'Create New Register'}</h2>
        </div>

        <Card className="shadow-sm border-0">
          <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Register Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Equipment Maintenance Log"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this register"
              />
            </div>

            <div>
              <Label>Allowed Staff Types *</Label>
              <p className="text-sm text-gray-500 mb-2">Select which staff types can access this register</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-lg">
                {staffTypes.map((type) => (
                  <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowedStaffTypes.includes(type.type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAllowedStaffTypes([...allowedStaffTypes, type.type]);
                        } else {
                          setAllowedStaffTypes(allowedStaffTypes.filter(t => t !== type.type));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{type.type}</span>
                  </label>
                ))}
              </div>
              {allowedStaffTypes.length === 0 && (
                <p className="text-sm text-red-500 mt-1">Please select at least one staff type</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Columns *</Label>
                <Button type="button" size="sm" onClick={addColumn} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Column
                </Button>
              </div>

              <div className="space-y-3">
                {columns.map((col, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex gap-2 items-start p-3 border rounded">
                      <div className="flex-1">
                        <Input
                          placeholder="Column Name"
                          value={col.columnName}
                          onChange={(e) => updateColumn(index, 'columnName', e.target.value)}
                          required
                          disabled={col.isExisting}
                        />
                      </div>
                      <div className="w-48">
                        <select
                          value={col.columnType}
                          onChange={(e) => updateColumn(index, 'columnType', e.target.value)}
                          disabled={col.isExisting}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white disabled:bg-gray-100"
                        >
                          {columnTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={col.isRequired}
                          onChange={(e) => updateColumn(index, 'isRequired', e.target.checked)}
                        />
                        Required
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant={col.isExisting ? "destructive" : "outline"}
                        onClick={() => removeColumn(index)}
                        title={col.isExisting ? "Delete column (will lose data!)" : "Remove column"}
                      >
                        {col.isExisting && <AlertTriangle className="h-4 w-4 mr-1" />}
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Options for DROPDOWN and MULTI_SELECT */}
                    {(col.columnType === 'DROPDOWN' || col.columnType === 'MULTI_SELECT') && !col.isExisting && (
                      <div className="ml-3 p-3 bg-blue-50 border-2 border-blue-200 rounded">
                        <Label className="text-sm font-semibold mb-2 block text-blue-900">
                          📝 Options (one per line)
                        </Label>
                        <div className="mb-2 p-2 bg-white border border-blue-300 rounded text-xs text-blue-800">
                          <strong>How to add options:</strong>
                          <ul className="list-disc ml-4 mt-1 space-y-1">
                            <li>Type each option and press <kbd className="px-1 py-0.5 bg-gray-200 rounded">Enter</kbd></li>
                            <li>Each line = one option</li>
                            <li>Example: Type "Male" → Press Enter → Type "Female" → Press Enter</li>
                          </ul>
                        </div>
                        <textarea
                          className="w-full p-3 border-2 border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                          rows="5"
                          placeholder="Type first option and press Enter&#10;Type second option and press Enter&#10;Type third option and press Enter&#10;...and so on"
                          value={(col.options || []).join('\n')}
                          onChange={(e) => {
                            // Don't filter while typing - allow empty lines
                            const options = e.target.value.split('\n');
                            updateColumn(index, 'options', options);
                          }}
                          onBlur={(e) => {
                            // Filter empty lines only when user leaves the textarea
                            const options = e.target.value.split('\n').filter(opt => opt.trim());
                            updateColumn(index, 'options', options);
                          }}
                          onKeyPress={(e) => {
                            // Allow Enter key in textarea (don't submit form)
                            e.stopPropagation();
                          }}
                          
                          onKeyDown={(e) => {
                            // Prevent form submission when pressing Enter
                            if (e.key === 'Enter') {
                              e.stopPropagation();
                            }
                          }}
                        />
                        <div className="mt-2 p-2 bg-white border border-blue-200 rounded">
                          <p className="text-xs font-medium text-blue-900">
                            {col.columnType === 'MULTI_SELECT'
                              ? '✅ MULTI_SELECT: Users can select MULTIPLE values (checkboxes)'
                              : '✅ DROPDOWN: Users can select ONE value (dropdown)'}
                          </p>
                          {(col.options || []).length > 0 && (
                            <p className="text-xs text-green-700 mt-1">
                              ✓ {(col.options || []).length} option(s) added: {(col.options || []).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {register && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Note:</strong> You can add new columns anytime. Existing columns cannot be renamed or changed.
                  Deleting a column will permanently delete all data in that column.
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? 'Saving...' : (register ? 'Update Register' : 'Create Register')}
              </Button>
              <Button type="button" variant="outline" onClick={onBack} className="border-gray-300 hover:bg-gray-50">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Column Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteColumnDialogOpen}
        onOpenChange={setDeleteColumnDialogOpen}
        onConfirm={confirmColumnDelete}
        onCancel={cancelColumnDelete}
        title="Delete Column"
        description={`⚠️ WARNING: Deleting "${columnToDelete?.column?.columnName}" will permanently delete all data in this column! This action cannot be undone.`}
        confirmText="Delete Column"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Success
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">{successMessage}</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                onBack();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default EditRegisterForm;
