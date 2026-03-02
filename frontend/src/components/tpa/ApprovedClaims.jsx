import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { claimService } from '@/services/claimService';
import Loader from '../loader/Loader';
import {
  FileText,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Calendar,
  Building,
  Stethoscope,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

const ProcessedClaims = () => {
  const [activeTab, setActiveTab] = useState('approved');
  const [approvedClaims, setApprovedClaims] = useState([]);
  const [rejectedClaims, setRejectedClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchAllClaims();
  }, []);

  const fetchAllClaims = async (filters = {}) => {
    try {
      setLoading(true);
      const [approvedResponse, rejectedResponse] = await Promise.all([
        claimService.getApprovedClaims(filters),
        claimService.getRejectedClaims(filters)
      ]);
      
      if (approvedResponse.success) {
        setApprovedClaims(approvedResponse.data);
      }
      if (rejectedResponse.success) {
        setRejectedClaims(rejectedResponse.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load processed claims',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchAllClaims({
      search: searchTerm,
      startDate: startDate,
      endDate: endDate
    });
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

  const renderClaim = (claim, isApproved) => (
    <Card key={claim.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="py-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-base font-semibold mb-1">
              {claim.patient?.firstName} {claim.patient?.lastName}
            </h3>
            <p className="text-xs text-gray-500">Claim #: {claim.claimNumber}</p>
          </div>
          <Badge className={isApproved ? "bg-green-100 text-green-800 flex items-center gap-1" : "bg-red-100 text-red-800 flex items-center gap-1"}>
            {isApproved ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {isApproved ? 'APPROVED' : 'REJECTED'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm mb-3">
          {/* Patient Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-600">{claim.patient?.patientNumber}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-600">{claim.patient?.phone}</span>
            </div>
          </div>

          {/* Surgery Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs">
              <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-medium text-gray-800">{claim.surgeryTypeDetail?.name}</span>
            </div>
          </div>

          {/* Insurance Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs">
              <Building className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-medium text-gray-800">{claim.insuranceProvider?.providerName}</span>
            </div>
            <div className="text-xs text-gray-500">
              Code: {claim.insuranceProvider?.providerCode}
            </div>
          </div>

          {/* Amount Info */}
          <div className="space-y-1">
            <div>
              <p className="text-xs text-gray-600">Requested</p>
              <p className="text-sm font-semibold text-gray-700">
                ₹{claim.claimAmountRequested?.toLocaleString()}
              </p>
            </div>
            {isApproved && claim.claimAmountSanctioned && (
              <div>
                <p className="text-xs text-gray-600">Sanctioned</p>
                <p className="text-sm font-bold text-green-600">
                  ₹{claim.claimAmountSanctioned?.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Dates and Details */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <div>
                <p className="text-gray-600">{isApproved ? 'Approved' : 'Rejected'}</p>
                <p className="font-medium">
                  {new Date(isApproved ? claim.claimApprovedAt : claim.claimSubmittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {isApproved && claim.claimApprover && (
              <p className="text-xs text-gray-500">
                By: {claim.claimApprover.firstName} {claim.claimApprover.lastName}
              </p>
            )}
            {!isApproved && claim.claimRejectionReason && (
              <p className="text-xs text-red-600 mt-1">
                Reason: {claim.claimRejectionReason}
              </p>
            )}
          </div>
        </div>

        {/* Documents Section */}
        {claim.claimDocumentsPaths && claim.claimDocumentsPaths.length > 0 && (
          <div className="border-t pt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700">
                Documents ({claim.claimDocumentsPaths.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {claim.claimDocumentsPaths.map((docPath, index) => (
                  <div key={index} className="flex gap-0.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDocument(docPath)}
                      className="text-xs h-7 px-2"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      #{index + 1}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDocument(docPath)}
                      className="text-xs h-7 px-2"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  const currentClaims = activeTab === 'approved' ? approvedClaims : rejectedClaims;

  return (
    <>
    <Card className="h-full flex flex-col overflow-hidden" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex-shrink-0">
        {/* Row 1: Title + Summary Badges + Refresh */}
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Processed Claims
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              {approvedClaims.length} Approved
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
              <XCircle className="w-3 h-3 mr-1" />
              {rejectedClaims.length} Rejected
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              {approvedClaims.length + rejectedClaims.length} Total
            </Badge>
            <Button
              onClick={() => fetchAllClaims()}
              variant="outline"
              size="sm"
              className="h-9"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Row 2: Search + Date Filters + Apply */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by patient name, claim #, or provider..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
              className="pl-10 h-10"
            />
          </div>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-40 h-10"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-40 h-10"
          />
          <Button onClick={handleApplyFilters} size="sm" className="h-10 bg-blue-600 hover:bg-blue-700">
            <Filter className="w-4 h-4 mr-1" />
            Apply
          </Button>
        </div>

        {/* Row 3: Approved / Rejected Toggle */}
        <div className="flex items-center gap-1 bg-white/60 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex items-center h-8 px-4 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'approved'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/80'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            Approved ({approvedClaims.length})
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center h-8 px-4 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'rejected'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/80'
            }`}
          >
            <XCircle className="w-3.5 h-3.5 mr-1.5" />
            Rejected ({rejectedClaims.length})
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 min-h-0 overflow-y-auto tab-content-container pr-2">
        {currentClaims.length === 0 ? (
          <div className="text-center py-12 px-4">
            {activeTab === 'approved' ? (
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3 opacity-50" />
            ) : (
              <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-3 opacity-50" />
            )}
            <p className="text-gray-500 font-medium">
              No {activeTab} claims found
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {activeTab === 'approved' ? 'Approved claims will appear here' : 'Rejected claims will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentClaims.map((claim) => renderClaim(claim, activeTab === 'approved'))}
          </div>
        )}
      </CardContent>
    </Card>

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

export default ProcessedClaims;
