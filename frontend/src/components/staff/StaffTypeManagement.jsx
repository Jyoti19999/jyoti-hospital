import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

const StaffTypeManagement = () => {
  const [staffTypes, setStaffTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    typeName: '',
    typeCode: '',
    description: '',
    department: '',
    isActive: true
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

  useEffect(() => {
    fetchStaffTypes();
  }, []);

  const fetchStaffTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/staff-types`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStaffTypes(data);
      }
    } catch (error) {
      toast.error('Failed to load staff types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.typeName || !formData.typeCode) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const url = editingId 
        ? `${API_BASE_URL}/staff-types/${editingId}`
        : `${API_BASE_URL}/staff-types`;
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingId ? 'Staff type updated successfully' : 'Staff type created successfully');
        fetchStaffTypes();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save staff type');
      }
    } catch (error) {
      toast.error('Failed to save staff type');
    }
  };

  const handleEdit = (staffType) => {
    setFormData({
      typeName: staffType.typeName,
      typeCode: staffType.typeCode,
      description: staffType.description || '',
      department: staffType.department || '',
      isActive: staffType.isActive
    });
    setEditingId(staffType.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this staff type?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/staff-types/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Staff type deleted successfully');
        fetchStaffTypes();
      } else {
    
      const error = await response.json();
        toast.error(error.error || 'Failed to delete staff type');
      }
    } catch (error) {
      toast.error('Failed to delete staff type');
    }
  };

  const resetForm = () => {
    setFormData({
      typeName: '',
      typeCode: '',
      description: '',
      department: '',
      isActive: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Staff Type Management</h3>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showForm ? 'Cancel' : 'Add Staff Type'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Staff Type' : 'Add New Staff Type'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="typeName">Type Name *</Label>
                  <Input
                    id="typeName"
                    value={formData.typeName}
                    onChange={(e) => setFormData({ ...formData, typeName: e.target.value })}
                    placeholder="e.g., Nurse, Technician"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="typeCode">Type Code *</Label>
                  <Input
                    id="typeCode"
                    value={formData.typeCode}
                    onChange={(e) => setFormData({ ...formData, typeCode: e.target.value.toUpperCase() })}
                    placeholder="e.g., NUR, TECH"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Clinical Support, Administration"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this staff type"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" onClick={resetForm} variant="outline">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Staff Types List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : staffTypes.length === 0 ? (
            <p className="text-center text-gray-500">No staff types found. Add one to get started.</p>
          ) : (
            <div className="space-y-3">
              {staffTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-lg">{type.typeName}</h4>
                      <Badge variant="outline" className="text-xs">{type.typeCode}</Badge>
                      <Badge className={`text-xs ${type.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {type.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {type.department && (
                      <p className="text-sm text-gray-600 mt-1">Department: {type.department}</p>
                    )}
                    {type.description && (
                      <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(type.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEdit(type)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDelete(type.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffTypeManagement;
