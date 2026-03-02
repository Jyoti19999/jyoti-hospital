import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, Phone, Plus, Trash2, Upload, Camera, 
  AlertCircle, CheckCircle, Clock, Users, FileText,
  Building2, CreditCard, MapPin, Mail
} from 'lucide-react';
import { toast } from 'sonner';

// Insurance and Emergency Data Structure
// {
//   hasInsurance: boolean,
//   paymentMethod?: 'insurance' | 'cash' | 'corporate',
//   provider?: string,
//   policyNumber?: string,
//   policyType?: string,
//   policyHolderName?: string,
//   policyHolderRelation?: string,
//   validityDate?: string,
//   coverageAmount?: number,
//   coPaymentPercentage?: number,
//   tpaName?: string,
//   cardFrontImage?: File,
//   cardBackImage?: File,
//   requiresPreAuth?: string[],
//   emergencyContacts: Array<{
//     id: string,
//     name: string,
//     relationship: string,
//     primaryPhone: string,
//     secondaryPhone?: string,
//     email?: string,
//     address?: string,
//     preferredContactMethod: 'phone' | 'sms' | 'email',
//     availableHours: string,
//     livesWithPatient: boolean,
//     hasKeys: boolean,
//     priority: number,
//   }>
// }

const majorInsurers = [
  { name: 'ICICI Lombard General Insurance', rating: 4.2, claims: '96.8%' },
  { name: 'Star Health and Allied Insurance', rating: 4.1, claims: '95.2%' },
  { name: 'HDFC ERGO General Insurance', rating: 4.0, claims: '94.5%' },
  { name: 'Care Health Insurance Limited', rating: 3.9, claims: '93.8%' },
  { name: 'Bajaj Allianz General Insurance', rating: 3.8, claims: '92.4%' },
  { name: 'New India Assurance Company', rating: 3.7, claims: '91.2%' },
  { name: 'Oriental Insurance Company', rating: 3.6, claims: '90.8%' },
  { name: 'National Insurance Company', rating: 3.5, claims: '89.9%' },
  { name: 'United India Insurance Company', rating: 3.4, claims: '88.7%' },
  { name: 'IFFCO Tokio General Insurance', rating: 3.8, claims: '92.1%' }
];

const policyTypes = [
  'Individual Health Insurance',
  'Family Floater Policy',
  'Corporate Group Insurance',
  'Government Employee Insurance Scheme (CGHS)',
  'Employee State Insurance (ESI)',
  'Ayushman Bharat - PMJAY',
  'Senior Citizen Health Insurance',
  'Critical Illness Insurance',
  'Maternity Health Insurance'
];

const relationships = [
  'Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter',
  'Brother', 'Sister', 'Father-in-law', 'Mother-in-law', 'Other'
];

const emergencyRelationships = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Friend',
  'Legal Guardian', 'Neighbor', 'Colleague', 'Other'
];

const preAuthProcedures = [
  'Cataract Surgery', 'Retinal Surgery', 'Glaucoma Surgery',
  'LASIK/Refractive Surgery', 'Corneal Transplant', 'Vitreoretinal Surgery',
  'Diagnostic Imaging (MRI/CT)', 'Specialized Consultations'
];

const InsuranceEmergencyStep = ({ 
  data, onUpdate, onNext, onPrevious 
}) => {
  const [selectedInsurer, setSelectedInsurer] = useState('');
  const [insurerSearch, setInsurerSearch] = useState('');
  const [newContact, setNewContact] = useState({
    name: '', relationship: '', primaryPhone: '', email: '',
    preferredContactMethod: 'phone',
    availableHours: '24/7', livesWithPatient: false, hasKeys: false
  });
  const [policyVerificationStatus, setPolicyVerificationStatus] = useState('idle');
  
  const cardFrontRef = useRef(null);
  const cardBackRef = useRef(null);

  const filteredInsurers = majorInsurers.filter(insurer =>
    insurer.name.toLowerCase().includes(insurerSearch.toLowerCase())
  );

  const handlePaymentMethodChange = (method) => {
    onUpdate({
      paymentMethod: method,
      hasInsurance: method === 'insurance'
    });
  };

  const validatePolicyNumber = (policyNumber, provider) => {
    // Basic validation - in real implementation, this would be provider-specific
    const basicPattern = /^[A-Z0-9]{6,20}$/;
    return basicPattern.test(policyNumber);
  };

  const handlePolicyVerification = async () => {
    if (!data.policyNumber || !data.provider) return;
    
    setPolicyVerificationStatus('verifying');
    
    // Simulate API call
    setTimeout(() => {
      if (validatePolicyNumber(data.policyNumber, data.provider)) {
        setPolicyVerificationStatus('verified');
        toast.success('Policy verified successfully');
      } else {
        setPolicyVerificationStatus('failed');
        toast.error('Policy verification failed');
      }
    }, 2000);
  };

  const handleCardUpload = (file, side) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (side === 'front') {
      onUpdate({ cardFrontImage: file });
    } else {
      onUpdate({ cardBackImage: file });
    }

    // Simulate OCR extraction
    setTimeout(() => {
      if (side === 'front') {
        toast.success('Policy details extracted from card');
        // In real implementation, this would extract actual data
      }
    }, 1500);
  };

  const addEmergencyContact = () => {
    if (!newContact.name || !newContact.primaryPhone) {
      toast.error('Name and phone number are required');
      return;
    }

    const contact = {
      ...newContact,
      id: Date.now().toString(),
      priority: data.emergencyContacts.length + 1
    };

    onUpdate({
      emergencyContacts: [...data.emergencyContacts, contact]
    });

    setNewContact({
      name: '', relationship: '', primaryPhone: '', email: '',
      preferredContactMethod: 'phone', availableHours: '24/7',
      livesWithPatient: false, hasKeys: false
    });

    toast.success('Emergency contact added');
  };

  const removeEmergencyContact = (id) => {
    onUpdate({
      emergencyContacts: data.emergencyContacts.filter(c => c.id !== id)
    });
    toast.success('Emergency contact removed');
  };

  const testContact = async (contact, method) => {
    toast.loading(`Testing ${method} contact...`);
    
    // Simulate contact test
    setTimeout(() => {
      toast.success(`${method} contact test successful`);
    }, 1000);
  };

  const estimatedCoverage = data.coverageAmount && data.coPaymentPercentage
    ? (data.coverageAmount * (100 - data.coPaymentPercentage)) / 100
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Insurance & Emergency Information</h2>
        <p className="text-gray-600">Please provide your insurance details and emergency contacts</p>
      </div>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span>Payment Method</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={data.paymentMethod} 
            onValueChange={handlePaymentMethodChange}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="insurance" id="insurance" />
              <Label htmlFor="insurance" className="cursor-pointer flex-1">
                <div className="font-semibold">Insurance Coverage</div>
                <div className="text-sm text-gray-600">I have health insurance</div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="cursor-pointer flex-1">
                <div className="font-semibold">Self Payment</div>
                <div className="text-sm text-gray-600">I will pay cash</div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="corporate" id="corporate" />
              <Label htmlFor="corporate" className="cursor-pointer flex-1">
                <div className="font-semibold">Corporate Coverage</div>
                <div className="text-sm text-gray-600">Company insurance</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Insurance Details Section */}
      {data.hasInsurance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Insurance Details</span>
              {policyVerificationStatus === 'verified' && (
                <Badge className="bg-green-100 text-green-800">Verified</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Insurance Provider */}
            <div>
              <Label htmlFor="insuranceProvider">Insurance Provider *</Label>
              <div className="relative">
                <Input
                  id="insuranceProvider"
                  value={insurerSearch}
                  onChange={(e) => setInsurerSearch(e.target.value)}
                  placeholder="Search insurance providers..."
                  className="mb-2"
                />
                {insurerSearch && (
                  <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredInsurers.map((insurer) => (
                      <div
                        key={insurer.name}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => {
                          onUpdate({ provider: insurer.name });
                          setInsurerSearch(insurer.name);
                        }}
                      >
                        <div className="font-medium">{insurer.name}</div>
                        <div className="text-sm text-gray-600 flex space-x-4">
                          <span>Rating: {insurer.rating}/5</span>
                          <span>Claims: {insurer.claims}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Policy Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="policyNumber">Policy Number *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="policyNumber"
                    value={data.policyNumber || ''}
                    onChange={(e) => onUpdate({ policyNumber: e.target.value })}
                    placeholder="Enter policy number"
                  />
                  <Button
                    onClick={handlePolicyVerification}
                    disabled={!data.policyNumber || policyVerificationStatus === 'verifying'}
                    size="sm"
                  >
                    {policyVerificationStatus === 'verifying' ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : policyVerificationStatus === 'verified' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="policyType">Policy Type *</Label>
                <Select value={data.policyType} onValueChange={(value) => onUpdate({ policyType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy type" />
                  </SelectTrigger>
                  <SelectContent>
                    {policyTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="policyHolderName">Policy Holder Name</Label>
                <Input
                  id="policyHolderName"
                  value={data.policyHolderName || ''}
                  onChange={(e) => onUpdate({ policyHolderName: e.target.value })}
                  placeholder="Same as patient"
                />
              </div>

              <div>
                <Label htmlFor="policyHolderRelation">Relationship to Patient</Label>
                <Select 
                  value={data.policyHolderRelation} 
                  onValueChange={(value) => onUpdate({ policyHolderRelation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationships.map((relation) => (
                      <SelectItem key={relation} value={relation}>{relation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="validityDate">Policy Validity Date</Label>
                <Input
                  id="validityDate"
                  type="date"
                  value={data.validityDate || ''}
                  onChange={(e) => onUpdate({ validityDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="coverageAmount">Coverage Amount (₹)</Label>
                <Input
                  id="coverageAmount"
                  type="number"
                  value={data.coverageAmount || ''}
                  onChange={(e) => onUpdate({ coverageAmount: parseInt(e.target.value) })}
                  placeholder="e.g., 500000"
                />
              </div>

              <div>
                <Label htmlFor="coPayment">Co-payment Percentage (%)</Label>
                <Input
                  id="coPayment"
                  type="number"
                  max="100"
                  value={data.coPaymentPercentage || ''}
                  onChange={(e) => onUpdate({ coPaymentPercentage: parseInt(e.target.value) })}
                  placeholder="e.g., 10"
                />
              </div>

              <div>
                <Label htmlFor="tpaName">TPA Name (if applicable)</Label>
                <Input
                  id="tpaName"
                  value={data.tpaName || ''}
                  onChange={(e) => onUpdate({ tpaName: e.target.value })}
                  placeholder="Third Party Administrator"
                />
              </div>
            </div>

            {/* Coverage Estimate */}
            {estimatedCoverage > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Coverage Estimate</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Coverage:</span>
                    <span className="font-medium ml-2">₹{data.coverageAmount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Estimated Coverage:</span>
                    <span className="font-medium ml-2">₹{estimatedCoverage.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Insurance Card Upload */}
            <div>
              <h4 className="font-semibold mb-4">Insurance Card Upload</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Front Side of Card</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {data.cardFrontImage ? (
                      <div>
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-green-600">Front uploaded</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload front side</p>
                        <div className="flex justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cardFrontRef.current?.click()}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                      </>
                    )}
                    <input
                      ref={cardFrontRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleCardUpload(e.target.files[0], 'front')}
                    />
                  </div>
                </div>

                <div>
                  <Label>Back Side of Card</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {data.cardBackImage ? (
                      <div>
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-green-600">Back uploaded</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload back side</p>
                        <div className="flex justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cardBackRef.current?.click()}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                      </>
                    )}
                    <input
                      ref={cardBackRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleCardUpload(e.target.files[0], 'back')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pre-authorization Requirements */}
            <div>
              <Label>Procedures Requiring Pre-authorization</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {preAuthProcedures.map((procedure) => (
                  <div key={procedure} className="flex items-center space-x-2">
                    <Checkbox
                      id={procedure}
                      checked={data.requiresPreAuth?.includes(procedure)}
                      onCheckedChange={(checked) => {
                        const current = data.requiresPreAuth || [];
                        const updated = checked
                          ? [...current, procedure]
                          : current.filter(p => p !== procedure);
                        onUpdate({ requiresPreAuth: updated });
                      }}
                    />
                    <Label htmlFor={procedure} className="text-sm">{procedure}</Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contacts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-red-600" />
            <span>Emergency Contacts</span>
            <Badge variant="outline">{data.emergencyContacts.length}/5</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Contact Form */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold mb-4">Add Emergency Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Full Name *</Label>
                <Input
                  id="contactName"
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <Label htmlFor="contactRelationship">Relationship *</Label>
                <Select 
                  value={newContact.relationship} 
                  onValueChange={(value) => setNewContact(prev => ({ ...prev, relationship: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {emergencyRelationships.map((relation) => (
                      <SelectItem key={relation} value={relation}>{relation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contactPhone">Primary Phone *</Label>
                <Input
                  id="contactPhone"
                  value={newContact.primaryPhone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, primaryPhone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <Label htmlFor="contactMethod">Preferred Contact Method</Label>
                <Select 
                  value={newContact.preferredContactMethod} 
                  onValueChange={(value) => 
                    setNewContact(prev => ({ ...prev, preferredContactMethod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="sms">SMS Text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contactHours">Available Hours</Label>
                <Select 
                  value={newContact.availableHours} 
                  onValueChange={(value) => setNewContact(prev => ({ ...prev, availableHours: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24/7">24/7 Available</SelectItem>
                    <SelectItem value="Business Hours">Business Hours (9 AM - 6 PM)</SelectItem>
                    <SelectItem value="Evening">Evening (6 PM - 10 PM)</SelectItem>
                    <SelectItem value="Weekends">Weekends Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="livesWithPatient"
                      checked={newContact.livesWithPatient}
                      onCheckedChange={(checked) => 
                        setNewContact(prev => ({ ...prev, livesWithPatient: checked }))
                      }
                    />
                    <Label htmlFor="livesWithPatient">Lives with patient</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasKeys"
                      checked={newContact.hasKeys}
                      onCheckedChange={(checked) => 
                        setNewContact(prev => ({ ...prev, hasKeys: checked }))
                      }
                    />
                    <Label htmlFor="hasKeys">Has keys to residence</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button 
                onClick={addEmergencyContact}
                disabled={data.emergencyContacts.length >= 5}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>

          {/* Existing Contacts List */}
          {data.emergencyContacts.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold">Emergency Contacts ({data.emergencyContacts.length})</h4>
              {data.emergencyContacts.map((contact, index) => (
                <div key={contact.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline">Priority {index + 1}</Badge>
                        <h5 className="font-semibold">{contact.name}</h5>
                        <span className="text-gray-600">({contact.relationship})</span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{contact.primaryPhone}</span>
                        </div>
                        {contact.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{contact.availableHours}</span>
                        </div>
                      </div>

                      <div className="flex space-x-4 mt-2">
                        {contact.livesWithPatient && (
                          <Badge variant="secondary" className="text-xs">Lives with patient</Badge>
                        )}
                        {contact.hasKeys && (
                          <Badge variant="secondary" className="text-xs">Has keys</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testContact(contact, contact.preferredContactMethod)}
                      >
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeEmergencyContact(contact.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.emergencyContacts.length < 2 && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 text-sm">
                At least 2 emergency contacts are required to proceed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button 
          onClick={onNext}
          disabled={data.emergencyContacts.length < 2}
        >
          Next: Consent & Verification
        </Button>
      </div>
    </div>
  );
};

export default InsuranceEmergencyStep;
