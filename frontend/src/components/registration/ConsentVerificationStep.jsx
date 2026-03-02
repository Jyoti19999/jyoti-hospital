
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle, FileText, Shield, Camera, Upload, Download, 
  Eye, EyeOff, Clock, AlertCircle, Phone, Mail, MessageSquare,
  Smartphone, Bell, Heart, Gift, Users, Signature, QrCode
} from 'lucide-react';
import { toast } from 'sonner';

// ConsentVerificationData: { medicalConsent, privacyPolicy, marketingConsent, appointmentReminders, healthNewsletters, promotionalOffers, researchParticipation, photoVideoConsent, abhaId, abhaIdVerified, otpVerified, digitalSignature, documentsUploaded }
// Props: { data, onUpdate, onPrevious, onComplete }

const ConsentVerificationStep = ({ 
  data, onUpdate, onPrevious, onComplete 
}) => {
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [showMedicalConsent, setShowMedicalConsent] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureMethod, setSignatureMethod] = useState('draw');
  const [typedSignature, setTypedSignature] = useState('');
  
  const canvasRef = useRef(null);
  const govIdRef = useRef(null);
  const addressProofRef = useRef(null);
  const medicalRecordsRef = useRef(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendOTP = () => {
    setOtpSent(true);
    setCountdown(300); // 5 minutes
    toast.success('OTP sent to your phone and email');
  };

  const verifyOTP = () => {
    if (otpCode.length === 6) {
      onUpdate({ otpVerified: true });
      toast.success('OTP verified successfully');
    } else {
      toast.error('Please enter a valid 6-digit OTP');
    }
  };

  const verifyABHA = () => {
    if (data.abhaId && data.abhaId.length === 17) {
      onUpdate({ abhaIdVerified: true });
      toast.success('ABHA ID verified successfully');
    } else {
      toast.error('Please enter a valid ABHA ID');
    }
  };

  // Digital signature canvas functions
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signatureData = canvas.toDataURL();
    onUpdate({ digitalSignature: signatureData });
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onUpdate({ digitalSignature: undefined });
  };

  const handleDocumentUpload = (file, type) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and PDF files are allowed');
      return;
    }

    const currentDocs = data.documentsUploaded || {};
    if (type === 'medicalRecords') {
      const currentRecords = currentDocs.medicalRecords || [];
      onUpdate({
        documentsUploaded: {
          ...currentDocs,
          medicalRecords: [...currentRecords, file]
        }
      });
    } else {
      onUpdate({
        documentsUploaded: {
          ...currentDocs,
          [type]: file
        }
      });
    }

    toast.success(`${type.replace(/([A-Z])/g, ' $1').toLowerCase()} uploaded successfully`);
  };

  const generateConsentPDF = () => {
    // Simulate PDF generation
    toast.success('Consent document generated and downloaded');
  };

  const requiredConsents = [
    data.medicalConsent,
    data.privacyPolicy,
    data.otpVerified
  ];

  const isFormValid = requiredConsents.every(Boolean) && 
    (data.digitalSignature || typedSignature);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Consent & Verification</h2>
        <p className="text-gray-600">Please review and provide your consent for registration completion</p>
      </div>

      {/* Medical Consent Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-600" />
            <span>Medical Treatment Consent</span>
            {data.medicalConsent && <CheckCircle className="h-5 w-5 text-green-600" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Collapsible open={showMedicalConsent} onOpenChange={setShowMedicalConsent}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="mb-4">
                {showMedicalConsent ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showMedicalConsent ? 'Hide' : 'View'} Medical Consent Details
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-blue-900">Medical Treatment Authorization</h4>
                <div className="text-sm space-y-2">
                  <p>• I consent to examination, diagnostic procedures, and medical treatment by qualified healthcare providers</p>
                  <p>• I understand the risks and benefits of proposed treatments</p>
                  <p>• I authorize emergency medical treatment when unable to provide consent</p>
                  <p>• I consent to anesthesia administration when necessary for procedures</p>
                  <p>• I understand that no guarantee of treatment outcome has been made</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="medicalConsent"
              checked={data.medicalConsent}
              onCheckedChange={(checked) => onUpdate({ medicalConsent: checked })}
            />
            <Label htmlFor="medicalConsent" className="text-sm">
              I have read and agree to the medical treatment consent terms *
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Policy & Data Protection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span>Privacy Policy & Data Protection</span>
            {data.privacyPolicy && <CheckCircle className="h-5 w-5 text-green-600" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Collapsible open={showPrivacyDetails} onOpenChange={setShowPrivacyDetails}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="mb-4">
                {showPrivacyDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showPrivacyDetails ? 'Hide' : 'View'} Privacy Policy Details
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-green-900">Data Protection Rights (DPDP Act 2023 Compliance)</h4>
                <div className="text-sm space-y-2">
                  <p><strong>Your Rights:</strong></p>
                  <p>• Right to access your personal data</p>
                  <p>• Right to correct inaccurate information</p>
                  <p>• Right to data portability</p>
                  <p>• Right to withdraw consent at any time</p>
                  <p>• Right to grievance redressal</p>
                  
                  <p className="mt-3"><strong>Data Retention:</strong></p>
                  <p>• Medical records: 7 years as per Medical Council guidelines</p>
                  <p>• Billing information: 7 years for tax compliance</p>
                  <p>• Marketing preferences: Until withdrawn</p>
                  <p>• System logs: 2 years for security purposes</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="privacyPolicy"
              checked={data.privacyPolicy}
              onCheckedChange={(checked) => onUpdate({ privacyPolicy: checked })}
            />
            <Label htmlFor="privacyPolicy" className="text-sm">
              I acknowledge that I have read and understood the Privacy Policy and consent to data processing *
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-purple-600" />
            <span>Communication Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Appointment Reminders */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Appointment Reminders</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="smsReminders"
                  checked={data.appointmentReminders.sms}
                  onCheckedChange={(checked) => 
                    onUpdate({
                      appointmentReminders: {
                        ...data.appointmentReminders,
                        sms: checked
                      }
                    })
                  }
                />
                <MessageSquare className="h-4 w-4 text-green-600" />
                <Label htmlFor="smsReminders" className="text-sm">SMS Reminders</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailReminders"
                  checked={data.appointmentReminders.email}
                  onCheckedChange={(checked) => 
                    onUpdate({
                      appointmentReminders: {
                        ...data.appointmentReminders,
                        email: checked
                      }
                    })
                  }
                />
                <Mail className="h-4 w-4 text-blue-600" />
                <Label htmlFor="emailReminders" className="text-sm">Email Reminders</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whatsappReminders"
                  checked={data.appointmentReminders.whatsapp}
                  onCheckedChange={(checked) => 
                    onUpdate({
                      appointmentReminders: {
                        ...data.appointmentReminders,
                        whatsapp: checked
                      }
                    })
                  }
                />
                <Smartphone className="h-4 w-4 text-green-600" />
                <Label htmlFor="whatsappReminders" className="text-sm">WhatsApp Reminders</Label>
              </div>
            </div>
          </div>

          {/* Health Newsletters */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Health Newsletters & Tips</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dailyTips"
                  checked={data.healthNewsletters.daily}
                  onCheckedChange={(checked) => 
                    onUpdate({
                      healthNewsletters: {
                        ...data.healthNewsletters,
                        daily: checked
                      }
                    })
                  }
                />
                <Label htmlFor="dailyTips" className="text-sm">Daily Health Tips</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="weeklyNewsletter"
                  checked={data.healthNewsletters.weekly}
                  onCheckedChange={(checked) => 
                    onUpdate({
                      healthNewsletters: {
                        ...data.healthNewsletters,
                        weekly: checked
                      }
                    })
                  }
                />
                <Label htmlFor="weeklyNewsletter" className="text-sm">Weekly Newsletter</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="monthlyReport"
                  checked={data.healthNewsletters.monthly}
                  onCheckedChange={(checked) => 
                    onUpdate({
                      healthNewsletters: {
                        ...data.healthNewsletters,
                        monthly: checked
                      }
                    })
                  }
                />
                <Label htmlFor="monthlyReport" className="text-sm">Monthly Health Report</Label>
              </div>
            </div>
          </div>

          {/* Additional Preferences */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="promotionalOffers"
                checked={data.promotionalOffers}
                onCheckedChange={(checked) => onUpdate({ promotionalOffers: checked })}
              />
              <Gift className="h-4 w-4 text-orange-600" />
              <Label htmlFor="promotionalOffers" className="text-sm">Promotional offers and discounts</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="researchParticipation"
                checked={data.researchParticipation}
                onCheckedChange={(checked) => onUpdate({ researchParticipation: checked })}
              />
              <Users className="h-4 w-4 text-indigo-600" />
              <Label htmlFor="researchParticipation" className="text-sm">Medical research participation (optional)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="photoVideoConsent"
                checked={data.photoVideoConsent}
                onCheckedChange={(checked) => onUpdate({ photoVideoConsent: checked })}
              />
              <Camera className="h-4 w-4 text-pink-600" />
              <Label htmlFor="photoVideoConsent" className="text-sm">Photo/video documentation for treatment purposes</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ABHA ID Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="h-5 w-5 text-green-600" />
            <span>ABHA ID Integration</span>
            {data.abhaIdVerified && <CheckCircle className="h-5 w-5 text-green-600" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Benefits of ABHA ID</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Seamless health record portability across healthcare providers</li>
              <li>• Integration with National Digital Health Mission (NDHM)</li>
              <li>• Simplified insurance claim processes</li>
              <li>• Secure digital health identity</li>
            </ul>
          </div>

          <div>
            <Label htmlFor="abhaId">ABHA ID (14 digits)</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="abhaId"
                value={data.abhaId || ''}
                onChange={(e) => onUpdate({ abhaId: e.target.value })}
                placeholder="XX-XXXX-XXXX-XXXX"
                maxLength={17}
              />
              <Button onClick={verifyABHA} disabled={!data.abhaId}>
                Verify
              </Button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Optional: Link your existing ABHA ID or create new during registration
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Factor Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-blue-600" />
            <span>Identity Verification</span>
            {data.otpVerified && <CheckCircle className="h-5 w-5 text-green-600" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!otpSent ? (
            <div className="text-center py-4">
              <Button onClick={sendOTP} className="w-full md:w-auto">
                Send OTP to Phone & Email
              </Button>
              <p className="text-xs text-gray-600 mt-2">
                We'll send a 6-digit verification code to your registered phone and email
              </p>
            </div>
          ) : (
            <div>
              <Label htmlFor="otpCode">Enter 6-digit OTP</Label>
              <div className="flex space-x-2">
                <Input
                  id="otpCode"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                />
                <Button onClick={verifyOTP} disabled={otpCode.length !== 6}>
                  Verify
                </Button>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-600">
                  {countdown > 0 ? `Resend in ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` : 'OTP expired'}
                </p>
                {countdown === 0 && (
                  <Button variant="link" size="sm" onClick={sendOTP}>
                    Resend OTP
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Digital Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Signature className="h-5 w-5 text-purple-600" />
            <span>Digital Signature</span>
            {(data.digitalSignature || typedSignature) && <CheckCircle className="h-5 w-5 text-green-600" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4 mb-4">
            <Button
              variant={signatureMethod === 'draw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSignatureMethod('draw')}
            >
              Draw Signature
            </Button>
            <Button
              variant={signatureMethod === 'type' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSignatureMethod('type')}
            >
              Type Name
            </Button>
          </div>

          {signatureMethod === 'draw' ? (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="w-full border rounded cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-600">Draw your signature above</p>
                  <Button size="sm" variant="outline" onClick={clearSignature}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="typedSignature">Type your full name</Label>
              <Input
                id="typedSignature"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Enter your full name"
                className="font-serif text-lg"
              />
              <p className="text-xs text-gray-600 mt-1">
                By typing your name, you agree that this constitutes your digital signature
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-indigo-600" />
            <span>Document Upload</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Government ID */}
            <div>
              <Label>Government ID Proof</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {data.documentsUploaded?.governmentId ? (
                  <div>
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-600">ID uploaded</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Aadhaar, PAN, Passport, or DL</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => govIdRef.current?.click()}
                    >
                      Upload ID
                    </Button>
                  </>
                )}
                <input
                  ref={govIdRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleDocumentUpload(e.target.files[0], 'governmentId')}
                />
              </div>
            </div>

            {/* Address Proof */}
            <div>
              <Label>Address Proof (if different from ID)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {data.documentsUploaded?.addressProof ? (
                  <div>
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-600">Address proof uploaded</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Utility bill, bank statement</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addressProofRef.current?.click()}
                    >
                      Upload Proof
                    </Button>
                  </>
                )}
                <input
                  ref={addressProofRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleDocumentUpload(e.target.files[0], 'addressProof')}
                />
              </div>
            </div>
          </div>

          {/* Medical Records */}
          <div>
            <Label>Previous Medical Records (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {data.documentsUploaded?.medicalRecords?.length ? (
                <div>
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-600">
                    {data.documentsUploaded.medicalRecords.length} medical records uploaded
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload previous medical reports, prescriptions</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => medicalRecordsRef.current?.click()}
                  >
                    Upload Records
                  </Button>
                </>
              )}
              <input
                ref={medicalRecordsRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  Array.from(e.target.files || []).forEach(file => 
                    handleDocumentUpload(file, 'medicalRecords')
                  );
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Summary */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <Shield className="h-5 w-5" />
            <span>Registration Compliance Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-green-900 mb-2">Required Consents</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {data.medicalConsent ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                  <span>Medical Treatment Consent</span>
                </div>
                <div className="flex items-center space-x-2">
                  {data.privacyPolicy ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                  <span>Privacy Policy Agreement</span>
                </div>
                <div className="flex items-center space-x-2">
                  {data.otpVerified ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                  <span>Identity Verification</span>
                </div>
                <div className="flex items-center space-x-2">
                  {(data.digitalSignature || typedSignature) ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                  <span>Digital Signature</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-900 mb-2">Legal Compliance</h4>
              <div className="space-y-1 text-green-800">
                <p>✓ DPDP Act 2023 compliant</p>
                <p>✓ Healthcare data protection</p>
                <p>✓ Consent management system</p>
                <p>✓ Audit trail maintained</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex space-x-2">
            <Button variant="outline" size="sm" onClick={generateConsentPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download Consent Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button 
          onClick={onComplete}
          disabled={!isFormValid}
          className="bg-green-600 hover:bg-green-700"
        >
          Complete Registration
        </Button>
      </div>

      {!isFormValid && (
        <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-yellow-800 text-sm">
            Please complete all required consents and verification steps to proceed.
          </p>
        </div>
      )}
    </div>
  );
};

export default ConsentVerificationStep;
