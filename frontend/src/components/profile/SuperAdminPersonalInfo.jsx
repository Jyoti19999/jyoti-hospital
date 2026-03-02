// src/components/profile/SuperAdminPersonalInfo.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Edit2, Save, X, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const SuperAdminPersonalInfo = ({ data, onUpdate, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);

  const handleEdit = () => {
    setEditData(data);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  const handleSave = () => {
    onUpdate(editData);
    onSave();
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>Personal Information</span>
          </CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Account Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.status === 'Active' ? 'bg-green-100' : 'bg-red-100'}`}>
                {data.status === 'Active' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold">Account Status</h3>
                <p className="text-sm text-gray-600">Toggle account activation</p>
              </div>
            </div>
            {isEditing ? (
              <Switch
                checked={editData.status === 'Active'}
                onCheckedChange={(checked) => handleChange('status', checked ? 'Active' : 'Inactive')}
              />
            ) : (
              <Badge variant={data.status === 'Active' ? 'default' : 'destructive'}>
                {data.status}
              </Badge>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                {isEditing ? (
                  <Input
                    id="firstName"
                    value={editData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                  />
                ) : (
                  <p className="text-sm font-medium py-2 px-3 bg-gray-50 rounded-md">{data.firstName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="lastName"
                    value={editData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                  />
                ) : (
                  <p className="text-sm font-medium py-2 px-3 bg-gray-50 rounded-md">{data.lastName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                ) : (
                  <p className="text-sm font-medium py-2 px-3 bg-gray-50 rounded-md">{data.email}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                ) : (
                  <p className="text-sm font-medium py-2 px-3 bg-gray-50 rounded-md">{data.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                {isEditing ? (
                  <Select value={editData.designation} onValueChange={(value) => handleChange('designation', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Super Administrator">Super Administrator</SelectItem>
                      <SelectItem value="System Administrator">System Administrator</SelectItem>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium py-2 px-3 bg-gray-50 rounded-md">{data.designation}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Account Status</Label>
                {isEditing ? (
                  <Select value={editData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium py-2 px-3 bg-gray-50 rounded-md">{data.status}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SuperAdminPersonalInfo;
