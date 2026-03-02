import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  ArrowLeft,
  User,
  Building2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  Download,
  MessageSquare,
  History,
  AlertCircle,
  Paperclip
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import useTpaStore from '@/stores/tpa/tpaStore';

const TPAReview = () => {
  const { claimId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reviewNote, setReviewNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const {
    isAuthenticated,
    currentUser,
    claims,
    selectedClaim,
    selectClaim,
    updateClaimStatus,
    addCommunication,
    hasPermission
  } = useTpaStore();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/tpa-login');
      return;
    }
    
    if (claimId && (!selectedClaim || selectedClaim.id !== claimId)) {
      const claim = claims.find(c => c.id === claimId);
      if (claim) {
        selectClaim(claimId);
      } else {
        navigate('/tpa-claims');
      }
    }
  }, [claimId, selectedClaim, claims, selectClaim, isAuthenticated, navigate]);
  
  if (!isAuthenticated || !selectedClaim) {
    return null;
  }
  
  const claim = selectedClaim;
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-secondary text-secondary-foreground';
      case 'under-review':
        return 'bg-primary text-primary-foreground';
      case 'approved':
        return 'bg-traffic-low text-white';
      case 'rejected':
        return 'bg-destructive text-destructive-foreground';
      case 'settled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };
  
  const getDocumentStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-traffic-low text-white';
      case 'pending':
        return 'bg-secondary text-secondary-foreground';
      case 'rejected':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };
  
  const handleStatusUpdate = async (newStatus) => {
    if (!hasPermission('approve-claim', claim.claimAmount) && newStatus === 'approved') {
      toast({
        title: "Insufficient Permissions",
        description: `You cannot approve claims above ₹${currentUser.approvalLimit.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateClaimStatus(claim.id, newStatus, reviewNote);
      
      toast({
        title: "Status Updated",
        description: `Claim ${claim.id} has been ${newStatus}`,
      });
      
      setReviewNote('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update claim status",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCommunication = (recipient) => {
    if (reviewNote.trim()) {
      addCommunication(claim.id, reviewNote, recipient);
      toast({
        title: "Message Sent",
        description: `Communication sent to ${recipient}`,
      });
      setReviewNote('');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link to="/tpa-claims">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Claims
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Claim Review: {claim.id}</h1>
                <p className="text-sm text-muted-foreground">{claim.patientName} - {claim.treatmentType}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(claim.status)}>
                {claim.status}
              </Badge>
              <Badge variant="outline" className={
                claim.priority === 'emergency' ? 'border-destructive text-destructive' :
                claim.priority === 'high' ? 'border-traffic-high text-traffic-high' :
                'border-primary text-primary'
              }>
                {claim.priority} priority
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="policy">Policy Details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-6">
                  {/* Patient Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Patient Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                            <p className="text-foreground">{claim.patientName}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Patient ID</p>
                            <p className="text-foreground">{claim.patientId}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Age</p>
                            <p className="text-foreground">{claim.patientDetails.age} years</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Gender</p>
                            <p className="text-foreground">{claim.patientDetails.gender}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{claim.patientDetails.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{claim.patientDetails.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{claim.patientDetails.address}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Hospital & Treatment Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Building2 className="h-5 w-5" />
                        <span>Hospital & Treatment Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Hospital Name</p>
                            <p className="text-foreground">{claim.hospitalName}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Hospital ID</p>
                            <p className="text-foreground">{claim.hospitalId}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Treatment Type</p>
                            <p className="text-foreground">{claim.treatmentType}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Claim Amount</p>
                              <p className="text-lg font-bold text-foreground">₹{claim.claimAmount.toLocaleString()}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Estimated Amount</p>
                            <p className="text-foreground">₹{claim.estimatedAmount.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Date Submitted</p>
                              <p className="text-foreground">{claim.submittedDate}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Submitted Documents</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {claim.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-muted rounded-lg">
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{doc.name}</p>
                              <p className="text-sm text-muted-foreground">Type: {doc.type.toUpperCase()}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={getDocumentStatusColor(doc.status)}>
                              {doc.status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {doc.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {doc.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                              {doc.status}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="policy">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Policy Verification</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Policy Number</p>
                            <p className="text-foreground font-mono">{claim.policyNumber}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Insurance Company</p>
                            <p className="text-foreground">{claim.insuranceCompany}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Policy Type</p>
                            <p className="text-foreground">{claim.policyDetails.policyType}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Coverage Amount</p>
                            <p className="text-foreground">₹{claim.policyDetails.coverageAmount.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Deductible</p>
                            <p className="text-foreground">₹{claim.policyDetails.deductible.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Waiting Period</p>
                            <Badge className="bg-traffic-low text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {claim.policyDetails.waitingPeriod}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Policy Start Date</p>
                            <p className="text-foreground">{claim.policyDetails.policyStartDate}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Policy End Date</p>
                            <p className="text-foreground">{claim.policyDetails.policyEndDate}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-traffic-low/10 border border-traffic-low/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-traffic-low" />
                          <span className="font-medium text-traffic-low">Policy Verification Status</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Policy is active and valid. Treatment is covered under the current policy terms.
                          No waiting period restrictions apply.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timeline">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <History className="h-5 w-5" />
                      <span>Processing Timeline</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {claim.timeline.map((event, index) => (
                        <div key={index} className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-3 h-3 bg-primary rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="text-foreground">{event.action}</p>
                            <div className="flex items-center text-sm text-muted-foreground mt-1 space-x-2">
                              <span>{event.user}</span>
                              <span>•</span>
                              <span>{event.date}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Action Panel */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Review Notes</label>
                  <Textarea
                    placeholder="Add your review notes here..."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="bg-traffic-low hover:bg-traffic-low/90 text-white"
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={isProcessing || !hasPermission('approve-claim', claim.claimAmount)}
                  >
                    {isProcessing ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={isProcessing || !hasPermission('reject-claim')}
                  >
                    {isProcessing ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                    Reject
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCommunication(claim.hospitalName)}
                    disabled={!reviewNote.trim()}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send to Hospital
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleCommunication(claim.insuranceCompany)}
                    disabled={!reviewNote.trim()}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send to Insurer
                  </Button>
                </div>
                
                {!hasPermission('approve-claim', claim.claimAmount) && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-destructive">
                        <p className="font-medium">Approval Limit Exceeded</p>
                        <p>This claim exceeds your approval limit of ₹{currentUser.approvalLimit?.toLocaleString()}. Senior approval required.</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Claim Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Claim Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Claim Amount</span>
                  <span className="font-medium">₹{claim.claimAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Estimated</span>
                  <span className="text-muted-foreground">₹{claim.estimatedAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Deductible</span>
                  <span className="text-muted-foreground">₹{claim.policyDetails.deductible.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Net Payable</span>
                  <span>₹{(claim.claimAmount - claim.policyDetails.deductible).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Info */}
            {claim.assignedTo && (
              <Card>
                <CardHeader>
                  <CardTitle>Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Assigned to: {claim.assignedTo}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TPAReview;