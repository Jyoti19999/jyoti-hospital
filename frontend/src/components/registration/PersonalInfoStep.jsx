
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Camera, Upload, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// PersonalInfoData: { title, firstName, lastName, dateOfBirth, gender, bloodGroup, nationality, preferredLanguage, photo }
// Props: { data, onUpdate, onNext }

const PersonalInfoStep = ({ data, onUpdate, onNext }) => {
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [age, setAge] = useState(null);

  const titles = ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];
  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const languages = ['English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi'];

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

  const handleDateOfBirthChange = (value) => {
    onUpdate({ dateOfBirth: value });
    if (value) {
      const calculatedAge = calculateAge(value);
      setAge(calculatedAge);
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpdate({ photo: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Camera capture implementation would go here
      // For now, we'll just trigger file input
      fileInputRef.current?.click();
    } catch (error) {
      fileInputRef.current?.click();
    }
  };

  const isValid = () => {
    return (
      data.title &&
      data.firstName &&
      data.lastName &&
      data.dateOfBirth &&
      data.gender &&
      data.bloodGroup &&
      data.nationality &&
      data.preferredLanguage
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
        <p className="text-gray-600">Please provide your basic personal details</p>
      </div>

      {/* Photo Upload Section */}
      <Card className="p-6 bg-gray-50 border-2 border-dashed border-gray-300">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-gray-400" />
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCameraCapture}
              className="flex items-center space-x-2"
            >
              <Camera className="w-4 h-4" />
              <span>Camera</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          
          <p className="text-sm text-gray-500 text-center">
            Upload a clear photo for identification purposes
          </p>
        </div>
      </Card>

      {/* Name Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Select value={data.title} onValueChange={(value) => onUpdate({ title: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select title" />
            </SelectTrigger>
            <SelectContent>
              {titles.map((title) => (
                <SelectItem key={title} value={title}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={data.firstName}
            onChange={(e) => onUpdate({ firstName: e.target.value })}
            placeholder="Enter first name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={data.lastName}
            onChange={(e) => onUpdate({ lastName: e.target.value })}
            placeholder="Enter last name"
            required
          />
        </div>
      </div>

      {/* Date of Birth and Age */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={data.dateOfBirth}
            onChange={(e) => handleDateOfBirthChange(e.target.value)}
            required
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="space-y-2">
          <Label>Age</Label>
          <div className="h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 flex items-center">
            {age !== null ? (
              <Badge variant="secondary" className="text-lg font-semibold">
                {age} years
              </Badge>
            ) : (
              <span className="text-gray-500">Calculated automatically</span>
            )}
          </div>
        </div>
      </div>

      {/* Gender and Blood Group */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="gender">Gender *</Label>
          <Select value={data.gender} onValueChange={(value) => onUpdate({ gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {genders.map((gender) => (
                <SelectItem key={gender} value={gender}>
                  {gender}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bloodGroup">Blood Group *</Label>
          <Select value={data.bloodGroup} onValueChange={(value) => onUpdate({ bloodGroup: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              {bloodGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Nationality and Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality *</Label>
          <Input
            id="nationality"
            value={data.nationality}
            onChange={(e) => onUpdate({ nationality: e.target.value })}
            placeholder="Enter nationality"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredLanguage">Preferred Language *</Label>
          <Select value={data.preferredLanguage} onValueChange={(value) => onUpdate({ preferredLanguage: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select preferred language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language} value={language}>
                  {language}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          onClick={onNext}
          disabled={!isValid()}
          className="px-8"
        >
          Next: Contact & Address
        </Button>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
