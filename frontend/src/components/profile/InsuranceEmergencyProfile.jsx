
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Shield, ChevronDown, ChevronRight, Edit, Phone, AlertCircle, CreditCard, Users, Calendar, Save, X } from 'lucide-react';
import InsuranceEmergencyStep from '@/components/registration/InsuranceEmergencyStep';

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

const InsuranceEmergencyProfile = ({ data, onUpdate, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const calculateCompletionScore = () => {
    let completed = 0;
    let total = 0;
    
    if (data.hasInsurance) {
      total += 4;
      if (data.provider) completed++;
      if (data.policyNumber) completed++;
      if (data.validityDate) completed++;
      if (data.coverageAmount) completed++;
    }
    
    total += 1;
    if (data.emergencyContacts.length > 0) completed++;
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const isInsuranceExpiring = () => {
    if (!data.validityDate) return false;
    const validityDate = new Date(data.validityDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return validityDate <= thirtyDaysFromNow;
  };

  const getInsuranceStatus = () => {
    if (!data.hasInsurance) return { status: 'No Insurance', color: 'bg-gray-100 text-gray-800' };
    if (!data.validityDate) return { status: 'Incomplete', color: 'bg-yellow-100 text-yellow-800' };
    if (isInsuranceExpiring()) return { status: 'Expiring Soon', color: 'bg-orange-100 text-orange-800' };
    return { status: 'Active', color: 'bg-green-100 text-green-800' };
  };

  const handleSave = () => {
    onSave();
    setIsEditing(false);
  };

  const renderSummaryView = () => {
    const insuranceStatus = getInsuranceStatus();
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="text-sm sm:text-base font-medium">Insurance & Emergency</span>
            <Badge variant="outline" className="text-xs">
              {calculateCompletionScore()}% Complete
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Progress value={calculateCompletionScore()} className="hidden sm:block w-20 h-2" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Insurance Status</span>
                </div>
                <Badge className={insuranceStatus.color}>
                  {insuranceStatus.status}
                </Badge>
              </div>
              
              {data.hasInsurance ? (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Provider:</span> {data.provider || 'Not specified'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Policy:</span> {data.policyNumber || 'Not specified'}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Coverage:</span> {data.coverageAmount ? `₹${data.coverageAmount.toLocaleString()}` : 'Not specified'}
                  </div>
                  {data.validityDate && (
                    <div className="text-sm flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Expires: {new Date(data.validityDate).toLocaleDateString()}</span>
                      {isInsuranceExpiring() && (
                        <AlertCircle className="h-3 w-3 text-orange-500" />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No insurance information provided
                </div>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Emergency Contacts</span>
              </div>
              
              {data.emergencyContacts.length > 0 ? (
                <div className="space-y-2">
                  {data.emergencyContacts
                    .sort((a, b) => a.priority - b.priority)
                    .slice(0, 3)
                    .map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{contact.name}</div>
                          <div className="text-xs text-gray-500">{contact.relationship}</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">{contact.primaryPhone}</span>
                        </div>
                      </div>
                    ))}
                  {data.emergencyContacts.length > 3 && (
                    <span className="text-sm text-gray-500">+{data.emergencyContacts.length - 3} more contacts</span>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No emergency contacts added
                </div>
              )}
            </Card>
          </div>

          {isInsuranceExpiring() && (
            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-800">
                  Your insurance policy expires soon. Please renew to avoid interruptions.
                </span>
              </div>
            </Card>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              Collapse
            </Button>
            <Button
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit Details
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    );
  };

  if (isEditing) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-lg font-semibold">Edit Insurance & Emergency Information</h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Save Changes</span>
            </Button>
          </div>
        </div>
        
        <InsuranceEmergencyStep
          data={data}
          onUpdate={onUpdate}
          onNext={() => {}}
          onPrevious={() => {}}
        />
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {renderSummaryView()}
      </Collapsible>
    </Card>
  );
};

export default InsuranceEmergencyProfile;
