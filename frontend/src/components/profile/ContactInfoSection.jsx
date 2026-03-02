
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Phone, Mail, MapPin, CheckCircle, UserCheck, Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import patientService from '@/services/patientService';

// ContactInfo: { phone, email, address, emergencyContacts }
// Props: { data, onUpdate? } - onUpdate is now optional

export const ContactInfoSection = ({ data, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { fetchPatientProfile } = useAuth();
  
  const [editData, setEditData] = useState({
    phone: data?.phone || '',
    email: data?.email || '',
    address: data?.address || '',
    emergencyContacts: data?.emergencyContacts || []
  });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSave = async () => {
    // Only validate address and emergency contacts since phone/email are read-only
    if (editData.emergencyContacts && Array.isArray(editData.emergencyContacts)) {
      for (const contact of editData.emergencyContacts) {
        if (contact.phone && !validatePhone(contact.phone)) {
          toast({
            title: "Validation Error",
            description: "Please enter valid phone numbers for emergency contacts",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      // Only send address and emergency contacts for update
      const updateData = {
        address: editData.address,
        emergencyContacts: editData.emergencyContacts
      };
      
      // Call the API to update contact information
      const response = await patientService.updateContactInfo(updateData);
      
      // Refresh user data in auth context to reflect changes immediately
      await fetchPatientProfile();
      
      toast({
        title: "Success",
        description: "Contact information updated successfully",
        variant: "default",
      });
      
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      phone: data?.phone || '',
      email: data?.email || '',
      address: data?.address || '',
      emergencyContacts: data?.emergencyContacts || []
    });
    setIsEditing(false);
  };

  const addEmergencyContact = () => {
    setEditData({
      ...editData,
      emergencyContacts: [
        ...editData.emergencyContacts,
        { name: '', phone: '', relation: '' }
      ]
    });
  };

  const removeEmergencyContact = (index) => {
    const newContacts = editData.emergencyContacts.filter((_, i) => i !== index);
    setEditData({
      ...editData,
      emergencyContacts: newContacts
    });
  };

  const updateEmergencyContact = (index, field, value) => {
    const newContacts = [...editData.emergencyContacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setEditData({
      ...editData,
      emergencyContacts: newContacts
    });
  };

  if (isEditing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contact Information
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{isLoading ? 'Saving...' : 'Save'}</span>
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={isLoading}>
              <X className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Phone Number - Read Only */}
          <div>
            <Label>Phone Number</Label>
            <Input
              value={editData.phone}
              disabled
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Phone number cannot be changed</p>
          </div>

          {/* Email - Read Only */}
          <div>
            <Label>Email Address</Label>
            <Input
              type="email"
              value={editData.email}
              disabled
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
          </div>

          {/* Address */}
          <div>
            <Label>Address</Label>
            <Input
              value={editData.address}
              onChange={(e) => setEditData({...editData, address: e.target.value})}
              placeholder="Enter your complete address"
            />
          </div>

          {/* Emergency Contacts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold">Emergency Contacts</Label>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={addEmergencyContact}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
            
            {editData.emergencyContacts.map((contact, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Emergency Contact {index + 1}</h4>
                  {editData.emergencyContacts.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeEmergencyContact(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Full Name"
                    value={contact.name || ''}
                    onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="Phone Number"
                    value={contact.phone || ''}
                    onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                  />
                  <Input
                    placeholder="Relation (e.g., Father, Mother)"
                    value={contact.relation || ''}
                    onChange={(e) => updateEmergencyContact(index, 'relation', e.target.value)}
                  />
                </div>
              </div>
            ))}
            
            {editData.emergencyContacts.length === 0 && (
              <div className="p-4 border border-dashed rounded-lg text-center text-gray-500">
                No emergency contacts added. Click "Add Contact" to add one.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Contact Information
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
          <Edit3 className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phone Number */}
        <div>
          <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number
          </Label>
          <div className="flex items-center gap-2">
            <p className="text-sm sm:text-base break-all">{data?.phone || 'Not provided'}</p>
            {data?.phone && (
              <Badge variant="outline" className="text-green-600 shrink-0">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address
          </Label>
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm sm:text-base break-all min-w-0">{data?.email || 'Not provided'}</p>
            {data?.email && (
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <Label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4" />
            Address
          </Label>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p>{data?.address || 'No address provided'}</p>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div>
          <Label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-3">
            <UserCheck className="w-4 h-4" />
            Emergency Contacts
          </Label>
          
          {data?.emergencyContacts && Array.isArray(data.emergencyContacts) && data.emergencyContacts.length > 0 ? (
            <div className="space-y-3">
              {data.emergencyContacts.map((contact, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-medium text-lg">{contact.name || 'Unnamed Contact'}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {contact.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.relation && (
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            <span>{contact.relation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      Contact {index + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
              <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No emergency contacts added</p>
              <p className="text-sm">Click "Edit" to add emergency contacts</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
