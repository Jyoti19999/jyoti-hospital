import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { claimService } from '@/services/claimService';
import Loader from '../loader/Loader';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Calendar,
  Building,
  Stethoscope,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

const PendingClaims = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [sanctionedAmount, setSanctionedAmount] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingClaims();
  }, []);

  const fetchPendingClaims = async () => {
    try {
      setLoading(true);
      const response = await claimService.getPendingClaims();
      
      if (response.success) {
        setClaims(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load pending claims',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (claim, type) => {
    setSelectedClaim(claim);
    setActionType(type);
    setSanctionedAmount(claim.claimAmountRequested?.toString() || '');
    setRejectionReason('');
    setActionModalOpen(true);
  };

  const handleProcessAction = async () => {
    if (actionType === 'approve' && (!sanctionedAmount || parseFloat(sanctionedAmount) <= 0)) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid sanctioned amount',
        variant: 'destructive',
      });
      return;
    }

    if (actionType === 'reject' && !rejectionReason.trim()) {
      toast({
        title: 'Missing Reason',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingAction(true);

      let statusData = {};

      if (actionType === 'under_review') {
        statusData = {
          claimStatus: 'UNDER_REVIEW',
        };
      } else if (actionType === 'approve') {
        statusData = {
          claimStatus: 'APPROVED',
          claimAmountSanctioned: parseFloat(sanctionedAmount),
        };
      } else if (actionType === 'reject') {
        statusData = {
          claimStatus: 'REJECTED',
          claimRejectionReason: rejectionReason,
        };
      }

      const response = await claimService.updateClaimStatus(selectedClaim.id, statusData);

      if (response.success) {
        toast({
          title: 'Success',
          description: `Claim ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'moved to under review'} successfully`,
        });
        setActionModalOpen(false);
        fetchPendingClaims(); // Refresh the list
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${actionType} claim`,
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDownloadDocument = (docPath) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');
    const downloadUrl = `${baseUrl}/${docPath}`;
    window.open(downloadUrl, '_blank');
  };

  const handleViewDocument = (docPath) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '');
    const viewUrl = `${baseUrl}/${docPath}`;
    setSelectedDocument(viewUrl);
    setDocumentViewerOpen(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      APPLIED: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      UNDER_REVIEW: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  // Filter claims based on search and status filter
  const getFilteredClaims = () => {
    return claims.filter(claim => {
      // Status filter
      if (statusFilter !== 'all' && claim.claimStatus !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const patientName = `${claim.patient?.firstName || ''} ${claim.patient?.lastName || ''}`.toLowerCase();
        const patientNumber = (claim.patient?.patientNumber || '').toLowerCase();
        const claimNumber = (claim.claimNumber || '').toLowerCase();
        const providerName = (claim.insuranceProvider?.providerName || '').toLowerCase();

        return (
          patientName.includes(search) ||
          patientNumber.includes(search) ||
          claimNumber.includes(search) ||
          providerName.includes(search)
        );
      }

      return true;
    });
  };

  const filteredClaims = getFilteredClaims();

  const appliedCount = filteredClaims.filter(c => c.claimStatus === 'APPLIED').length;
  const underReviewCount = filteredClaims.filter(c => c.claimStatus === 'UNDER_REVIEW').length;

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <Loader />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="h-full flex flex-col overflow-hidden" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Pending Claims
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              {appliedCount} Applied
            </Badge>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              {underReviewCount} Under Review
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
              {filteredClaims.length} Total
            </Badge>
            <Button 
              onClick={fetchPendingClaims} 
              disabled={loading} 
              variant="outline" 
              size="sm" 
              className="h-9"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search and Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by patient, claim number, or provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-10">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="APPLIED">Applied</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 min-h-0 overflow-y-auto tab-content-container pr-2">
        {filteredClaims.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3 opacity-50" />
            <p className="text-gray-500 font-medium">No Pending Claims</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'No claims match your current search or filters.'
                : 'There are no pending claims at the moment'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
          {filteredClaims.map((claim) => (
            <Card key={claim.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
              <CardContent className="py-3 px-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-semibold mb-0.5">
                      {claim.patient?.firstName} {claim.patient?.lastName}
                    </h3>
                    <p className="text-xs text-gray-500">Claim #: {claim.claimNumber}</p>
                  </div>
                <div className="flex items-center gap-1.5">
                  {claim.isCashless && (
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0">Cashless</Badge>
                  )}
                  {claim.isReimbursement && (
                    <Badge className="bg-orange-100 text-orange-800 text-[10px] px-1.5 py-0">Reimbursement</Badge>
                  )}
                  {getStatusBadge(claim.claimStatus)}
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm mb-2">
                  {/* Patient Info */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{claim.patient?.patientNumber}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{claim.patient?.phone}</span>
                    </div>
                  </div>

                  {/* Surgery & Date */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs">
                      <Stethoscope className="w-3 h-3 text-gray-400" />
                      <span className="font-medium text-gray-800">{claim.surgeryTypeDetail?.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{new Date(claim.claimSubmittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Insurance Info */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-xs">
                      <Building className="w-3 h-3 text-gray-400" />
                      <span className="font-medium text-gray-800">{claim.insuranceProvider?.providerName}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Code: {claim.insuranceProvider?.providerCode}
                    </div>
                  </div>

                  {/* Amount Info */}
                  <div className="space-y-0.5">
                    <div>
                      <p className="text-xs text-gray-600">Requested</p>
                      <p className="text-sm font-bold text-green-600">
                        ₹{claim.claimAmountRequested?.toLocaleString()}
                      </p>
                    </div>
                    {claim.claimCalculatedAmount && (
                      <p className="text-xs text-gray-500">
                        Calc: ₹{claim.claimCalculatedAmount?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Documents Section */}
                {claim.claimDocumentsPaths && claim.claimDocumentsPaths.length > 0 && (
                  <div className="border-t pt-1.5 mb-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-gray-700">
                        Documents ({claim.claimDocumentsPaths.length})
                      </p>
                      <div className="flex flex-wrap gap-0.5">
                        {claim.claimDocumentsPaths.map((docPath, index) => (
                          <div key={index} className="flex gap-0.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDocument(docPath)}
                              className="text-xs h-6 px-1.5"
                            >
                              <Eye className="w-3 h-3 mr-0.5" />
                              #{index + 1}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadDocument(docPath)}
                              className="text-xs h-6 px-1.5"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Claim Notes */}
                {claim.claimNotes && (
                  <div className="border-t pt-1.5 mb-1.5">
                    <p className="text-xs font-semibold text-gray-700 mb-0.5">Notes:</p>
                    <p className="text-xs text-gray-600">{claim.claimNotes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-1 border-t pt-1.5">
                  <Button
                    onClick={() => handleActionClick(claim, 'under_review')}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-7"
                  >
                    <Clock className="w-3 h-3 mr-0.5" />
                    Review
                  </Button>
                  <Button
                    onClick={() => handleActionClick(claim, 'approve')}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-7"
                  >
                    <CheckCircle className="w-3 h-3 mr-0.5" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleActionClick(claim, 'reject')}
                    variant="destructive"
                    size="sm"
                    className="flex-1 text-xs h-7"
                  >
                    <XCircle className="w-3 h-3 mr-0.5" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}
      </CardContent>
    </Card>

    {/* Action Modal (Approve/Reject/Under Review) */}
    <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Claim' : actionType === 'reject' ? 'Reject Claim' : 'Move to Under Review'}
            </DialogTitle>
          </DialogHeader>

          {selectedClaim && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Claim Number</p>
                <p className="font-semibold">{selectedClaim.claimNumber}</p>
              </div>

              {actionType === 'approve' ? (
                <div>
                  <Label htmlFor="sanctionedAmount">
                    Approved/Sanctioned Amount <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sanctionedAmount"
                    type="number"
                    placeholder="Enter sanctioned amount"
                    value={sanctionedAmount}
                    onChange={(e) => setSanctionedAmount(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Requested: ₹{selectedClaim.claimAmountRequested?.toLocaleString()}
                  </p>
                </div>
              ) : actionType === 'reject' ? (
                <div>
                  <Label htmlFor="rejectionReason">
                    Rejection Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Enter reason for rejection"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                  />
                </div>
              ) : (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    This claim will be moved to <strong>Under Review</strong> status. 
                    You can review the documents and details before making a final decision.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionModalOpen(false)}
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessAction}
              disabled={processingAction}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {processingAction ? <Loader size="sm" /> : null}
              {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Move to Under Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <Dialog open={documentViewerOpen} onOpenChange={setDocumentViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle>Document Viewer</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[70vh] bg-gray-100 rounded overflow-hidden">
            {selectedDocument && (
              selectedDocument.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={selectedDocument}
                  className="w-full h-full"
                  title="Document Viewer"
                />
              ) : (
                <img
                  src={selectedDocument}
                  alt="Document"
                  className="w-full h-full object-contain"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PendingClaims;
