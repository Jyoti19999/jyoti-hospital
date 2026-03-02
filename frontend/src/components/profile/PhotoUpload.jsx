
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, Edit3, RotateCw, Crop, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

// PhotoUploadProps: { currentPhoto?, patientName, onPhotoUpdate }

export const PhotoUpload = ({
  currentPhoto, 
  patientName, 
  onPhotoUpdate 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentPhoto);
  const [selectedFile, setSelectedFile] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  // Update preview when currentPhoto prop changes
  useEffect(() => {
    setPreviewUrl(currentPhoto);
  }, [currentPhoto]);
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelection(imageFile);
    }
  };

  const handleFileSelection = (file) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result);
      setSelectedFile(file);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) {
      toast.error('No photo selected');
      return;
    }

    setUploading(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Photo = e.target.result;
          
          const response = await fetch(`${import.meta.env.VITE_API_URL}/super-admin/profile`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              photo: base64Photo
            })
          });

          const result = await response.json();

          if (response.ok) {
            toast.success('Profile photo updated successfully');
            // Keep the preview URL and clear the selected file
            setPreviewUrl(base64Photo);
            setSelectedFile(null);
            setRotation(0);
            // Notify parent component
            onPhotoUpdate(base64Photo);
          } else {
            toast.error(result.error || 'Failed to upload photo');
          }
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast.error('Failed to upload photo');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read file');
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(currentPhoto);
    setSelectedFile(null);
    setRotation(0);
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  return (
    <Card className="p-6">
      <div className="text-center space-y-4">
        <div className="relative inline-block">
          <Avatar className="w-32 h-32 border-4 border-white shadow-lg" style={{ transform: `rotate(${rotation}deg)` }}>
            <AvatarImage src={previewUrl} alt={patientName} />
            <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {getInitials(patientName)}
            </AvatarFallback>
          </Avatar>
          
          <Button
            size="sm"
            className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-2">
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Camera functionality would be implemented here
                  fileInputRef.current?.click();
                }}
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Drag and drop or click to upload. Max 5MB.
            </p>
            <p className="text-xs text-gray-400">
              Supports JPEG, PNG, WebP formats
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          className="hidden"
        />

        {selectedFile && (
          <div className="space-y-2">
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="w-4 h-4 mr-2" />
                Rotate
              </Button>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSavePhoto} disabled={uploading}>
                <Save className="w-4 h-4 mr-2" />
                {uploading ? 'Saving...' : 'Save Photo'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
