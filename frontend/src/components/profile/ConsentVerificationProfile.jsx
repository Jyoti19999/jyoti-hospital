
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FileText, ChevronDown, ChevronRight, Edit, CheckCircle, XCircle, Bell, Mail, MessageSquare, Shield, Eye, Save, X } from 'lucide-react';
import ConsentVerificationStep from '@/components/registration/ConsentVerificationStep';

// ConsentVerificationData: { medicalConsent, privacyPolicy, marketingConsent, appointmentReminders, healthNewsletters, promotionalOffers, researchParticipation, photoVideoConsent, abhaId, abhaIdVerified, otpVerified, digitalSignature, documentsUploaded }
// Props: { data, onUpdate, onSave }

const ConsentVerificationProfile = ({ data, onUpdate, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const calculateCompletionScore = () => {
    let completed = 0;
    let total = 8;
    
    if (data.medicalConsent) completed++;
    if (data.privacyPolicy) completed++;
    if (data.abhaIdVerified) completed++;
    if (data.otpVerified) completed++;
    if (data.digitalSignature) completed++;
    if (data.documentsUploaded.governmentId) completed++;
    if (data.documentsUploaded.addressProof) completed++;
    if (data.appointmentReminders.sms || data.appointmentReminders.email || data.appointmentReminders.whatsapp) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const handleSave = () => {
    onSave();
    setIsEditing(false);
  };

  const renderConsentItem = (
    label,
    value,
    icon,
    description
  ) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        {icon}
        <div>
          <div className="font-medium text-sm">{label}</div>
          {description && <div className="text-xs text-gray-500">{description}</div>}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {value ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-gray-400" />
        )}
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {value ? "Enabled" : "Disabled"}
        </Badge>
      </div>
    </div>
  );

  const renderSummaryView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-purple-500" />
          <span className="font-medium">Consent & Verification</span>
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
        <div className="grid grid-cols-1 gap-4">
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>Essential Consents</span>
            </h4>
            <div className="space-y-2">
              {renderConsentItem(
                "Medical Treatment Consent",
                data.medicalConsent,
                <FileText className="h-4 w-4 text-blue-500" />,
                "Consent for medical treatment and procedures"
              )}
              {renderConsentItem(
                "Privacy Policy Agreement",
                data.privacyPolicy,
                <Shield className="h-4 w-4 text-green-500" />,
                "Agreement to privacy policy and data handling"
              )}
              {renderConsentItem(
                "Photo/Video Consent",
                data.photoVideoConsent,
                <Eye className="h-4 w-4 text-purple-500" />,
                "Consent for photos/videos during treatment"
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <Bell className="h-4 w-4 text-orange-500" />
              <span>Communication Preferences</span>
            </h4>
            <div className="space-y-2">
              {renderConsentItem(
                "SMS Appointment Reminders",
                data.appointmentReminders.sms,
                <MessageSquare className="h-4 w-4 text-blue-500" />
              )}
              {renderConsentItem(
                "Email Appointment Reminders",
                data.appointmentReminders.email,
                <Mail className="h-4 w-4 text-green-500" />
              )}
              {renderConsentItem(
                "WhatsApp Notifications",
                data.appointmentReminders.whatsapp,
                <MessageSquare className="h-4 w-4 text-green-600" />
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <Mail className="h-4 w-4 text-indigo-500" />
              <span>Optional Preferences</span>
            </h4>
            <div className="space-y-2">
              {renderConsentItem(
                "Marketing Communications",
                data.marketingConsent,
                <Bell className="h-4 w-4 text-purple-500" />
              )}
              {renderConsentItem(
                "Health Newsletters",
                data.healthNewsletters.weekly || data.healthNewsletters.monthly,
                <Mail className="h-4 w-4 text-blue-500" />
              )}
              {renderConsentItem(
                "Promotional Offers",
                data.promotionalOffers,
                <Bell className="h-4 w-4 text-orange-500" />
              )}
              {renderConsentItem(
                "Research Participation",
                data.researchParticipation,
                <FileText className="h-4 w-4 text-green-500" />
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Verification Status</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">ABHA ID Verified</span>
                <Badge variant={data.abhaIdVerified ? "default" : "secondary"}>
                  {data.abhaIdVerified ? "Verified" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">OTP Verified</span>
                <Badge variant={data.otpVerified ? "default" : "secondary"}>
                  {data.otpVerified ? "Verified" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Digital Signature</span>
                <Badge variant={data.digitalSignature ? "default" : "secondary"}>
                  {data.digitalSignature ? "Completed" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Documents Uploaded</span>
                <Badge variant={data.documentsUploaded.governmentId ? "default" : "secondary"}>
                  {data.documentsUploaded.governmentId ? "Complete" : "Pending"}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

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
            Edit Preferences
          </Button>
        </div>
      </CollapsibleContent>
    </div>
  );

  if (isEditing) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-lg font-semibold">Edit Consent & Verification Settings</h3>
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
        
        <ConsentVerificationStep
          data={data}
          onUpdate={onUpdate}
          onPrevious={() => {}}
          onComplete={() => {}}
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

export default ConsentVerificationProfile;
