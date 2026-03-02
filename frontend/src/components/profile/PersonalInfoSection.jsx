
import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Calendar, Camera, Upload, Loader2, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import patientService from '@/services/patientService';

// PersonalInfo: { firstName, lastName, dateOfBirth, gender, bloodGroup }
// Props: { data, onUpdate }

export const PersonalInfoSection = ({ data, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();
  const { user, fetchPatientProfile } = useAuth();

  const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a valid image file (JPEG, PNG, GIF, or WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64String = e.target.result;
          
          // Call API to update profile photo
          const response = await patientService.updateProfilePhoto(base64String);
          
          if (response.success) {
            toast({
              title: "Success",
              description: "Profile photo updated successfully",
            });

            // Refresh patient profile to get updated data
            await fetchPatientProfile();
          } else {
            throw new Error(response.message || 'Failed to update profile photo');
          }
        } catch (error) {
          toast({
            title: "Upload Failed",
            description: error.message || "Failed to upload profile photo. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsUploadingPhoto(false);
        }
      };

      reader.onerror = () => {
        toast({
          title: "Upload Failed",
          description: "Failed to read the image file. Please try again.",
          variant: "destructive",
        });
        setIsUploadingPhoto(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
      setIsUploadingPhoto(false);
    }
  };

  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Call API to update personal information
      const response = await patientService.updatePersonalInfo(editData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Personal information updated successfully",
        });

        // Update local state and refresh patient profile
        onUpdate(editData);
        await fetchPatientProfile();
        setIsEditing(false);
      } else {
        throw new Error(response.message || 'Failed to update personal information');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update personal information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Personal Information
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input
                value={editData.firstName}
                onChange={(e) => setEditData({...editData, firstName: e.target.value})}
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={editData.lastName}
                onChange={(e) => setEditData({...editData, lastName: e.target.value})}
              />
            </div>
          </div>

          {/* Date of Birth and Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={editData.dateOfBirth}
                onChange={(e) => setEditData({...editData, dateOfBirth: e.target.value})}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select 
                value={editData.gender} 
                onValueChange={(value) => setEditData({...editData, gender: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {genders.map(gender => (
                    <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Blood Group */}
          <div>
            <Label>Blood Group</Label>
            <Select 
              value={editData.bloodGroup} 
              onValueChange={(value) => setEditData({...editData, bloodGroup: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bloodGroups.map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Personal Information
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
          <Edit3 className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium text-gray-500">Full Name</Label>
            <p className="text-lg font-semibold">
              {data.firstName} {data.lastName}
            </p>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-500">Age</Label>
            <div className="flex items-center gap-2">
              <p className="text-lg">{calculateAge(data.dateOfBirth)} years old</p>
              <Badge variant="secondary">
                Born {new Date(data.dateOfBirth).toLocaleDateString()}
              </Badge>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-500">Gender</Label>
            <p className="text-lg">{data.gender}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-500">Blood Group</Label>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {data.bloodGroup}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
