
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { MapPin, Phone, Mail } from 'lucide-react';

// ContactAddressData: { primaryPhone, secondaryPhone, whatsappPhone, email, currentAddress, permanentAddress, sameAsCurrent }
// Props: { data, onUpdate, onNext, onPrevious, onContactStepComplete }

const ContactAddressStep = ({ 
  data, 
  onUpdate, 
  onNext, 
  onPrevious, 
  onContactStepComplete 
}) => {
  const handleCurrentAddressChange = (field, value) => {
    onUpdate({
      currentAddress: {
        ...data.currentAddress,
        [field]: value
      }
    });
    
    if (data.sameAsCurrent) {
      onUpdate({
        permanentAddress: {
          ...data.currentAddress,
          [field]: value
        }
      });
    }
  };

  const handleSameAsCurrentChange = (checked) => {
    onUpdate({ sameAsCurrent: checked });
    if (checked) {
      onUpdate({ permanentAddress: { ...data.currentAddress } });
    }
  };

  const isValid = () => {
    return (
      data.primaryPhone &&
      data.email &&
      data.currentAddress.street &&
      data.currentAddress.city &&
      data.currentAddress.state &&
      data.currentAddress.pinCode &&
      data.currentAddress.country
    );
  };

  const handleNextClick = () => {
    if (onContactStepComplete) {
      onContactStepComplete();
    } else {
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact & Address Information</h2>
        <p className="text-gray-600">Please provide your contact details and address</p>
      </div>

      {/* Contact Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Phone className="h-5 w-5 text-blue-600" />
          <span>Contact Information</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="primaryPhone">Primary Phone Number *</Label>
            <Input
              id="primaryPhone"
              type="tel"
              value={data.primaryPhone}
              onChange={(e) => onUpdate({ primaryPhone: e.target.value })}
              placeholder="+91 98765 43210"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryPhone">Secondary Phone (Optional)</Label>
            <Input
              id="secondaryPhone"
              type="tel"
              value={data.secondaryPhone || ''}
              onChange={(e) => onUpdate({ secondaryPhone: e.target.value })}
              placeholder="+91 87654 32109"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappPhone">WhatsApp Number (Optional)</Label>
            <Input
              id="whatsappPhone"
              type="tel"
              value={data.whatsappPhone || ''}
              onChange={(e) => onUpdate({ whatsappPhone: e.target.value })}
              placeholder="+91 98765 43210"
            />
          </div>
        </div>
      </Card>

      {/* Current Address */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-green-600" />
          <span>Current Address</span>
        </h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentStreet">Street Address *</Label>
            <Input
              id="currentStreet"
              value={data.currentAddress.street}
              onChange={(e) => handleCurrentAddressChange('street', e.target.value)}
              placeholder="House/Flat No., Street Name, Area"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="currentPinCode">PIN Code *</Label>
              <Input
                id="currentPinCode"
                value={data.currentAddress.pinCode}
                onChange={(e) => handleCurrentAddressChange('pinCode', e.target.value)}
                placeholder="400001"
                maxLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentCity">City *</Label>
              <Input
                id="currentCity"
                value={data.currentAddress.city}
                onChange={(e) => handleCurrentAddressChange('city', e.target.value)}
                placeholder="Mumbai"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentState">State *</Label>
              <Input
                id="currentState"
                value={data.currentAddress.state}
                onChange={(e) => handleCurrentAddressChange('state', e.target.value)}
                placeholder="Maharashtra"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentCountry">Country *</Label>
              <Input
                id="currentCountry"
                value={data.currentAddress.country}
                onChange={(e) => handleCurrentAddressChange('country', e.target.value)}
                placeholder="India"
                required
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Permanent Address */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-purple-600" />
            <span>Permanent Address</span>
          </h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sameAsCurrent"
              checked={data.sameAsCurrent}
              onCheckedChange={handleSameAsCurrentChange}
            />
            <Label htmlFor="sameAsCurrent" className="cursor-pointer">
              Same as current address
            </Label>
          </div>
        </div>

        {!data.sameAsCurrent && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="permanentStreet">Street Address</Label>
              <Input
                id="permanentStreet"
                value={data.permanentAddress.street}
                onChange={(e) => onUpdate({
                  permanentAddress: { ...data.permanentAddress, street: e.target.value }
                })}
                placeholder="House/Flat No., Street Name, Area"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="permanentPinCode">PIN Code</Label>
                <Input
                  id="permanentPinCode"
                  value={data.permanentAddress.pinCode}
                  onChange={(e) => onUpdate({
                    permanentAddress: { ...data.permanentAddress, pinCode: e.target.value }
                  })}
                  placeholder="400001"
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="permanentCity">City</Label>
                <Input
                  id="permanentCity"
                  value={data.permanentAddress.city}
                  onChange={(e) => onUpdate({
                    permanentAddress: { ...data.permanentAddress, city: e.target.value }
                  })}
                  placeholder="Mumbai"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="permanentState">State</Label>
                <Input
                  id="permanentState"
                  value={data.permanentAddress.state}
                  onChange={(e) => onUpdate({
                    permanentAddress: { ...data.permanentAddress, state: e.target.value }
                  })}
                  placeholder="Maharashtra"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="permanentCountry">Country</Label>
                <Input
                  id="permanentCountry"
                  value={data.permanentAddress.country}
                  onChange={(e) => onUpdate({
                    permanentAddress: { ...data.permanentAddress, country: e.target.value }
                  })}
                  placeholder="India"
                />
              </div>
            </div>
          </div>
        )}

        {data.sameAsCurrent && (
          <p className="text-gray-500 italic">Permanent address will be same as current address</p>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={handleNextClick} disabled={!isValid()}>
          Next: Medical History
        </Button>
      </div>
    </div>
  );
};

export default ContactAddressStep;
