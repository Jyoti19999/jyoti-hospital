import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, Search, Download } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const SERVER_BASE_URL = import.meta.env.VITE_API_IMG_URL || 'http://localhost:8080';

const DigitalRegisterManager = () => {
  const [registers, setRegisters] = useState([]);
  const [selectedRegister, setSelectedRegister] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRegisters();
  }, []);

  const fetchRegisters = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/digital-registers/definitions`, {
        withCredentials: true
      });
      setRegisters(response.data.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (showCreateForm) {
    return <CreateRegisterForm onBack={() => { setShowCreateForm(false); fetchRegisters(); }} />;
  }

  if (selectedRegister) {
    return <RegisterRecordManager register={selectedRegister} onBack={() => setSelectedRegister(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Digital Registers</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Register
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : registers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No registers created yet. Click "Create New Register" to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {registers.map((register) => (
            <Card key={register.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{register.name}</CardTitle>
                {register.description && (
                  <p className="text-sm text-gray-500">{register.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Columns:</span>
                    <span className="font-medium">{register.columns.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Records:</span>
                    <span className="font-medium">{register._count.records}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedRegister(register)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export const CreateRegisterForm = ({ onBack }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState([{ columnName: '', columnType: 'TEXT', isRequired: false }]);
  const [saving, setSaving] = useState(false);

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

  // Debug: Log column types to verify code is loaded

  const addColumn = () => {
    setColumns([...columns, {
      columnName: '',
      columnType: 'TEXT',
      isRequired: false,
      minLength: null,
      maxLength: null,
      minValue: null,
      maxValue: null,
      pattern: null,
      options: [] // For DROPDOWN and MULTI_SELECT
    }]);
  };

  const removeColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index));
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
      await axios.post(
        `${API_BASE_URL}/digital-registers/definitions`,
        { name, description, columns },
        { withCredentials: true }
      );
      alert('Register created successfully!');
      onBack();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create register');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <h2 className="text-2xl font-bold">Create New Register</h2>
      </div>

      <Card>
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
              <div className="flex justify-between items-center mb-4">
                <Label>Columns *</Label>
                <Button type="button" size="sm" onClick={addColumn}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Column
                </Button>
              </div>

              <div className="space-y-3">
                {columns.map((col, index) => (
                  <div key={index} className="p-3 border rounded space-y-2">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          placeholder="Column Name"
                          value={col.columnName}
                          onChange={(e) => updateColumn(index, 'columnName', e.target.value)}
                          required
                        />
                      </div>
                      <div className="w-48">
                        <select
                          value={col.columnType}
                          onChange={(e) => updateColumn(index, 'columnType', e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer hover:border-blue-500"
                          style={{ minHeight: '38px' }}
                        >
                          {columnTypes.map((type) => (
                            <option key={type} value={type} className="py-1">
                              {type}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {columnTypes.length} types available (including DROPDOWN & MULTI_SELECT)
                        </p>
                      </div>
                      <label className="flex items-center gap-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={col.isRequired}
                          onChange={(e) => updateColumn(index, 'isRequired', e.target.checked)}
                        />
                        Required
                      </label>
                      {columns.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removeColumn(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Options for DROPDOWN and MULTI_SELECT */}
                    {(col.columnType === 'DROPDOWN' || col.columnType === 'MULTI_SELECT') && (
                      <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded space-y-2">
                        <Label className="text-sm font-semibold text-blue-900">
                          📝 Options (one per line)
                        </Label>
                        <div className="p-2 bg-white border border-blue-300 rounded text-xs text-blue-800">
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
                        <div className="p-2 bg-white border border-blue-200 rounded">
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

                    {/* Validation Rules */}
                    <div className="flex gap-2 text-xs">
                      {(col.columnType === 'TEXT' || col.columnType === 'NUMBER' || col.columnType === 'LONG_NUMBER') && (
                        <>
                          <Input
                            type="number"
                            placeholder={col.columnType === 'TEXT' ? 'Min Length' : 'Min Value'}
                            value={col.columnType === 'TEXT' ? (col.minLength || '') : (col.minValue || '')}
                            onChange={(e) => updateColumn(index, col.columnType === 'TEXT' ? 'minLength' : 'minValue', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            placeholder={col.columnType === 'TEXT' ? 'Max Length' : 'Max Value'}
                            value={col.columnType === 'TEXT' ? (col.maxLength || '') : (col.maxValue || '')}
                            onChange={(e) => updateColumn(index, col.columnType === 'TEXT' ? 'maxLength' : 'maxValue', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-24"
                          />
                        </>
                      )}
                      {col.columnType === 'TEXT' && (
                        <Input
                          placeholder="Pattern (e.g., ^[0-9]{10}$ for 10 digits)"
                          value={col.pattern || ''}
                          onChange={(e) => updateColumn(index, 'pattern', e.target.value)}
                          className="flex-1"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating...' : 'Create Register'}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export const RegisterRecordManager = ({ register, onBack }) => {
  const [records, setRecords] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/digital-registers/definitions/${register.id}/records`,
        { withCredentials: true }
      );
      setRecords(response.data.data.records);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (recordId) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/digital-registers/records/${recordId}`,
        { withCredentials: true }
      );
      fetchRecords();
    } catch (error) {
      alert('Failed to delete record');
    }
  };

  const exportToExcel = () => {
    // Prepare data for Excel
    const excelData = records.map(record => {
      const row = {};
      register.columns.forEach(col => {
        const value = record.values.find(v => v.columnId === col.id);
        if (value) {
          if (col.columnType === 'DATE' || col.columnType === 'DATETIME') {
            row[col.columnName] = value.dateValue ? new Date(value.dateValue).toLocaleDateString() : '';
          } else if (col.columnType === 'NUMBER' || col.columnType === 'LONG_NUMBER') {
            row[col.columnName] = value.numberValue || '';
          } else if (col.columnType === 'IMAGE') {
            row[col.columnName] = value.imageValue ? 'Image attached' : '';
          } else if (col.columnType === 'PDF_DOCUMENT') {
            row[col.columnName] = value.textValue ? 'PDF attached' : '';
          } else if (col.columnType === 'MULTI_SELECT') {
            // Parse array and join with commas
            try {
              const values = JSON.parse(value.textValue || '[]');
              row[col.columnName] = Array.isArray(values) ? values.join(', ') : '';
            } catch {
              row[col.columnName] = value.textValue || '';
            }
          } else {
            row[col.columnName] = value.textValue || '';
          }
        } else {
          row[col.columnName] = '';
        }
      });
      return row;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, register.name.substring(0, 31)); // Excel sheet name limit

    // Download
    XLSX.writeFile(wb, `${register.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (showAddForm || editingRecord) {
    return (
      <AddRecordForm
        register={register}
        editingRecord={editingRecord}
        onBack={() => {
          setShowAddForm(false);
          setEditingRecord(null);
          fetchRecords();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Dedicated title section - fixed */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-gray-50/30">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-semibold text-gray-900">{register.name}</h2>
          {register.description && <span className="text-sm text-gray-500">{register.description}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel} disabled={records.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            Export to Excel
          </Button>
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Record
          </Button>
        </div>
      </div>

      {/* Content rendered directly below title - scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center py-8">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No records yet. Click "Add Record" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  {register.columns.map((col) => (
                    <th key={col.id} className="text-left p-2 font-medium">
                      {col.columnName}
                      {col.isRequired && <span className="text-red-500">*</span>}
                    </th>
                  ))}
                  <th className="text-left p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      {register.columns.map((col) => {
                        const value = record.values.find((v) => v.columnId === col.id);
                        return (
                          <td key={col.id} className="p-2">
                            {value ? (
                              col.columnType === 'DATE' || col.columnType === 'DATETIME' ? (
                                new Date(value.dateValue).toLocaleDateString()
                              ) : col.columnType === 'NUMBER' || col.columnType === 'LONG_NUMBER' ? (
                                value.numberValue
                              ) : col.columnType === 'EMAIL' || col.columnType === 'MOBILE' || col.columnType === 'URL' ? (
                                value.textValue
                              ) : col.columnType === 'IMAGE' ? (
                                value.imageValue ? (
                                  <img
                                    src={`${SERVER_BASE_URL}${value.imageValue}`}
                                    alt="Record image"
                                    className="h-12 w-12 object-cover rounded cursor-pointer"
                                    onClick={() => window.open(`${SERVER_BASE_URL}${value.imageValue}`, '_blank')}
                                  />
                                ) : '-'
                              ) : col.columnType === 'PDF_DOCUMENT' ? (
                                value.textValue ? (
                                  <button
                                    onClick={() => {
                                      const pdfUrl = `${SERVER_BASE_URL}${value.textValue}`;
                                      setPdfViewerUrl(pdfUrl);
                                    }}
                                    className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm rounded hover:bg-red-200 transition-colors"
                                  >
                                    📄 View PDF
                                  </button>
                                ) : '-'
                              ) : col.columnType === 'DROPDOWN' ? (
                                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                                  {value.textValue}
                                </span>
                              ) : col.columnType === 'MULTI_SELECT' ? (
                                <div className="flex flex-wrap gap-1">
                                  {(value.textValue ? JSON.parse(value.textValue) : []).map((val, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                      {val}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                value.textValue
                              )
                            ) : (
                              '-'
                            )}
                          </td>
                        );
                      })}
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRecord(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteRecord(record.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Floating PDF Viewer Modal */}
      {pdfViewerUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setPdfViewerUrl(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-11/12 h-5/6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-2xl">📄</span>
                PDF Document Viewer
              </h3>
              <div className="flex gap-2">
                <a
                  href={pdfViewerUrl}
                  download
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium transition-colors"
                >
                  ⬇️ Download
                </a>
                <button
                  onClick={() => setPdfViewerUrl(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm font-medium transition-colors"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-900">
              {/* PDF Viewer with multiple fallbacks for browser compatibility */}
              <object
                data={pdfViewerUrl}
                type="application/pdf"
                className="w-full h-full"
                style={{ minHeight: '600px' }}
              >
                <iframe
                  src={pdfViewerUrl}
                  className="w-full h-full"
                  style={{ minHeight: '600px', border: 'none' }}
                  title="PDF Viewer"
                >
                  <div className="p-8 text-center text-white">
                    <p className="mb-4">Your browser cannot display PDF files.</p>
                    <a
                      href={pdfViewerUrl}
                      download
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
                    >
                      Download PDF Instead
                    </a>
                  </div>
                </iframe>
              </object>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AddRecordForm = ({ register, editingRecord, onBack }) => {
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const [multiSelectValues, setMultiSelectValues] = useState({}); // For multi-select

  // Debug: Log register columns to check if options are loaded
  register.columns.forEach(col => {
    if (col.columnType === 'DROPDOWN' || col.columnType === 'MULTI_SELECT') {
    }
  });

  // Load existing values if editing
  useEffect(() => {
    if (editingRecord) {
      const existingValues = {};
      editingRecord.values.forEach(val => {
        if (val.column.columnType === 'DATE' || val.column.columnType === 'DATETIME') {
          existingValues[val.columnId] = val.dateValue ? new Date(val.dateValue).toISOString().split('T')[0] : '';
        } else if (val.column.columnType === 'NUMBER' || val.column.columnType === 'LONG_NUMBER') {
          existingValues[val.columnId] = val.numberValue;
        } else if (val.column.columnType === 'IMAGE') {
          existingValues[val.columnId] = val.imageValue;
          if (val.imageValue) {
            setImagePreviews(prev => ({ ...prev, [val.columnId]: `${SERVER_BASE_URL}${val.imageValue}` }));
          }
        } else if (val.column.columnType === 'PDF_DOCUMENT') {
          existingValues[val.columnId] = val.textValue;
          if (val.textValue) {
            // Extract filename from path
            const fileName = val.textValue.split('/').pop();
            setImagePreviews(prev => ({ ...prev, [val.columnId]: fileName }));
          }
        } else if (val.column.columnType === 'MULTI_SELECT') {
          // Parse JSON array for multi-select
          try {
            existingValues[val.columnId] = JSON.parse(val.textValue || '[]');
          } catch {
            existingValues[val.columnId] = [];
          }
        } else {
          existingValues[val.columnId] = val.textValue;
        }
      });
      setValues(existingValues);
    }
  }, [editingRecord]);

  const handleImageChange = (columnId, file) => {
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only JPG, JPEG, and PNG images are allowed!');
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('Image size must be less than 5MB!');
        return;
      }

      setImageFiles({ ...imageFiles, [columnId]: file });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews({ ...imagePreviews, [columnId]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfChange = (columnId, file) => {
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PDF files are allowed!');
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('PDF size must be less than 5MB!');
        return;
      }

      setImageFiles({ ...imageFiles, [columnId]: file });

      // Store file name for preview
      setImagePreviews({ ...imagePreviews, [columnId]: file.name });
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axios.post(
      `${API_BASE_URL}/digital-registers/upload-image`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data.filePath;
  };

  const uploadPdf = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await axios.post(
      `${API_BASE_URL}/digital-registers/upload-pdf`,
      formData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data.filePath;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Validate required fields
      const errors = [];
      register.columns.forEach(col => {
        if (col.isRequired && !values[col.id] && values[col.id] !== 0) {
          errors.push(`${col.columnName} is required`);
        }
      });

      // Validate data types and rules
      register.columns.forEach(col => {
        const value = values[col.id];
        if (!value && value !== 0) return; // Skip empty optional fields

        switch (col.columnType) {
          case 'TEXT':
            const strValue = String(value);
            if (col.minLength && strValue.length < col.minLength) {
              errors.push(`${col.columnName} must be at least ${col.minLength} characters`);
            }
            if (col.maxLength && strValue.length > col.maxLength) {
              errors.push(`${col.columnName} must be at most ${col.maxLength} characters`);
            }
            if (col.pattern) {
              try {
                const regex = new RegExp(col.pattern);
                if (!regex.test(strValue)) {
                  errors.push(`${col.columnName} format is invalid (must match pattern)`);
                }
              } catch (e) {
              }
            }
            break;
          case 'EMAIL':
            const emailValue = String(value);
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(emailValue)) {
              errors.push(`${col.columnName} must be a valid email address`);
            }
            break;
          case 'MOBILE':
            const mobileValue = String(value);
            const mobileRegex = /^[0-9]{10}$/;
            if (!mobileRegex.test(mobileValue)) {
              errors.push(`${col.columnName} must be a valid 10-digit mobile number`);
            }
            break;
          case 'URL':
            const urlValue = String(value);
            try {
              new URL(urlValue);
            } catch (e) {
              errors.push(`${col.columnName} must be a valid URL`);
            }
            break;
          case 'NUMBER':
          case 'LONG_NUMBER':
            if (isNaN(value)) {
              errors.push(`${col.columnName} must be a valid number`);
            } else {
              const numValue = parseFloat(value);
              if (col.minValue !== null && col.minValue !== undefined && numValue < col.minValue) {
                errors.push(`${col.columnName} must be at least ${col.minValue}`);
              }
              if (col.maxValue !== null && col.maxValue !== undefined && numValue > col.maxValue) {
                errors.push(`${col.columnName} must be at most ${col.maxValue}`);
              }
            }
            break;
          case 'DATE':
            if (isNaN(Date.parse(value))) {
              errors.push(`${col.columnName} must be a valid date`);
            }
            break;
          case 'DATETIME':
            if (isNaN(Date.parse(value))) {
              errors.push(`${col.columnName} must be a valid date and time`);
            }
            break;
          case 'TIME':
            if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
              errors.push(`${col.columnName} must be a valid time (HH:MM)`);
            }
            break;
        }
      });

      if (errors.length > 0) {
        alert('Validation errors:\n' + errors.join('\n'));
        setSaving(false);
        return;
      }

      // Upload images and PDFs first and get their paths
      const finalValues = { ...values };
      for (const [columnId, file] of Object.entries(imageFiles)) {
        if (file) {
          const column = register.columns.find(col => col.id === columnId);
          let filePath;
          if (column?.columnType === 'PDF_DOCUMENT') {
            filePath = await uploadPdf(file);
          } else {
            filePath = await uploadImage(file);
          }
          finalValues[columnId] = filePath;
        }
      }

      // Convert MULTI_SELECT arrays to JSON strings
      register.columns.forEach(col => {
        if (col.columnType === 'MULTI_SELECT' && Array.isArray(finalValues[col.id])) {
          finalValues[col.id] = JSON.stringify(finalValues[col.id]);
        }
      });

      // Debug: Log what we're sending

      if (editingRecord) {
        // Update existing record
        await axios.put(
          `${API_BASE_URL}/digital-registers/records/${editingRecord.id}`,
          { values: finalValues },
          { withCredentials: true }
        );
        alert('Record updated successfully!');
      } else {
        // Create new record
        await axios.post(
          `${API_BASE_URL}/digital-registers/definitions/${register.id}/records`,
          { values: finalValues },
          { withCredentials: true }
        );
        alert('Record added successfully!');
      }
      onBack();
    } catch (error) {
      const errorMsg = error.response?.data?.errors
        ? error.response.data.errors.join('\n')
        : error.response?.data?.message || 'Failed to save record';
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>← Back</Button>
        <h2 className="text-2xl font-bold">
          {editingRecord ? 'Edit Record' : 'Add Record'} - {register.name}
        </h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {register.columns.map((col) => (
              <div key={col.id}>
                <Label htmlFor={col.id}>
                  {col.columnName}
                  {col.isRequired && <span className="text-red-500"> *</span>}
                </Label>
                {col.columnType === 'TEXT' ? (
                  <Input
                    id={col.id}
                    value={values[col.id] || ''}
                    onChange={(e) => setValues({ ...values, [col.id]: e.target.value })}
                    required={col.isRequired}
                  />
                ) : col.columnType === 'NUMBER' || col.columnType === 'LONG_NUMBER' ? (
                  <Input
                    id={col.id}
                    type="number"
                    value={values[col.id] || ''}
                    onChange={(e) => setValues({ ...values, [col.id]: e.target.value })}
                    required={col.isRequired}
                  />
                ) : col.columnType === 'DATE' ? (
                  <Input
                    id={col.id}
                    type="date"
                    value={values[col.id] || ''}
                    onChange={(e) => setValues({ ...values, [col.id]: e.target.value })}
                    required={col.isRequired}
                  />
                ) : col.columnType === 'TIME' ? (
                  <Input
                    id={col.id}
                    type="time"
                    value={values[col.id] || ''}
                    onChange={(e) => setValues({ ...values, [col.id]: e.target.value })}
                    required={col.isRequired}
                  />
                ) : col.columnType === 'DATETIME' ? (
                  <Input
                    id={col.id}
                    type="datetime-local"
                    value={values[col.id] || ''}
                    onChange={(e) => setValues({ ...values, [col.id]: e.target.value })}
                    required={col.isRequired}
                  />
                ) : col.columnType === 'IMAGE' ? (
                  <div>
                    <Input
                      id={col.id}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e) => handleImageChange(col.id, e.target.files[0])}
                      required={col.isRequired}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Allowed: JPG, JPEG, PNG only (Max 5MB)
                    </p>
                    {imagePreviews[col.id] && (
                      <div className="mt-2">
                        <img
                          src={imagePreviews[col.id]}
                          alt="Preview"
                          className="max-w-xs max-h-48 rounded border"
                        />
                      </div>
                    )}
                  </div>
                ) : col.columnType === 'PDF_DOCUMENT' ? (
                  <div>
                    <Input
                      id={col.id}
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handlePdfChange(col.id, e.target.files[0])}
                      required={col.isRequired}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Allowed: PDF only (Max 5MB)
                    </p>
                    {imagePreviews[col.id] && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">📄 Selected: {imagePreviews[col.id]}</p>
                      </div>
                    )}
                    {values[col.id] && !imageFiles[col.id] && (
                      <div className="mt-2">
                        <a
                          href={`${SERVER_BASE_URL}${values[col.id]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          📄 View Current PDF
                        </a>
                      </div>
                    )}
                  </div>
                ) : col.columnType === 'DROPDOWN' ? (
                  <select
                    value={values[col.id] || ''}
                    onChange={(e) => setValues({ ...values, [col.id]: e.target.value })}
                    required={col.isRequired}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select {col.columnName}</option>
                    {(col.options || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : col.columnType === 'MULTI_SELECT' ? (
                  <div className="space-y-2">
                    <div className="border rounded p-3 space-y-2 max-h-[200px] overflow-y-auto">
                      {(col.options || []).map((option) => {
                        const currentValues = values[col.id] ?
                          (Array.isArray(values[col.id]) ? values[col.id] : [values[col.id]]) : [];
                        const isChecked = currentValues.includes(option);

                        return (
                          <label key={option} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                let newValues = [...currentValues];
                                if (e.target.checked) {
                                  newValues.push(option);
                                } else {
                                  newValues = newValues.filter(v => v !== option);
                                }
                                setValues({ ...values, [col.id]: newValues });
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{option}</span>
                          </label>
                        );
                      })}
                    </div>
                    {values[col.id] && Array.isArray(values[col.id]) && values[col.id].length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {values[col.id].map((val) => (
                          <span key={val} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {val}
                            <button
                              type="button"
                              onClick={() => {
                                const newValues = values[col.id].filter(v => v !== val);
                                setValues({ ...values, [col.id]: newValues });
                              }}
                              className="hover:text-blue-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Select multiple options by checking the boxes
                    </p>
                  </div>
                ) : (
                  <Input
                    id={col.id}
                    value={values[col.id] || ''}
                    onChange={(e) => setValues({ ...values, [col.id]: e.target.value })}
                    required={col.isRequired}
                  />
                )}
              </div>
            ))}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : (editingRecord ? 'Update Record' : 'Save Record')}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DigitalRegisterManager;
