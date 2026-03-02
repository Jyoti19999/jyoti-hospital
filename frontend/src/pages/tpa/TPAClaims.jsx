import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Building2,
  User,
  Calendar,
  DollarSign,
  ArrowUpDown,
  MoreVertical,
  Download,
  RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useTpaStore from '@/stores/tpa/tpaStore';

const TPAClaims = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('lastUpdated');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedClaims, setSelectedClaims] = useState([]);
  
  const navigate = useNavigate();
  
  const {
    isAuthenticated,
    currentUser,
    claims,
    setClaimsFilter,
    claimsFilter,
    getFilteredClaims,
    selectClaim
  } = useTpaStore();
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/tpa-login');
    return null;
  }
  
  const filteredClaims = getFilteredClaims();
  
  // Filter claims based on search term
  const searchFilteredClaims = filteredClaims.filter(claim =>
    claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    claim.treatmentType.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort claims
  const sortedClaims = [...searchFilteredClaims].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'claimAmount') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    } else if (sortBy === 'lastUpdated' || sortBy === 'submittedDate') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
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
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-traffic-high text-white';
      case 'standard':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'under-review':
        return <AlertTriangle className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'settled':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  const handleClaimClick = (claim) => {
    selectClaim(claim.id);
    navigate(`/tpa-review/${claim.id}`);
  };
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  const claimCounts = {
    all: claims.length,
    pending: claims.filter(c => c.status === 'pending').length,
    'under-review': claims.filter(c => c.status === 'under-review').length,
    approved: claims.filter(c => c.status === 'approved').length,
    rejected: claims.filter(c => c.status === 'rejected').length,
    settled: claims.filter(c => c.status === 'settled').length,
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link to="/tpa-dashboard">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Claims Management</h1>
                <p className="text-sm text-muted-foreground">Process and review insurance claims</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by patient name, hospital, claim ID, or treatment type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSort('lastUpdated')}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claims Tabs */}
        <Tabs value={claimsFilter} onValueChange={setClaimsFilter} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">
              All ({claimCounts.all})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({claimCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="under-review">
              Under Review ({claimCounts['under-review']})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({claimCounts.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({claimCounts.rejected})
            </TabsTrigger>
            <TabsTrigger value="settled">
              Settled ({claimCounts.settled})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={claimsFilter}>
            {sortedClaims.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Claims Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? "No claims match your search criteria." 
                      : `No ${claimsFilter === 'all' ? '' : claimsFilter} claims available.`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sortedClaims.map((claim) => (
                  <Card 
                    key={claim.id} 
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary"
                    onClick={() => handleClaimClick(claim)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
                          {/* Patient & Claim Info */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{claim.patientName}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>ID: {claim.id}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>Policy: {claim.policyNumber}</span>
                            </div>
                          </div>

                          {/* Hospital & Treatment */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{claim.hospitalName}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {claim.treatmentType}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {claim.insuranceCompany}
                            </div>
                          </div>

                          {/* Dates & Status */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Submitted: {claim.submittedDate}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Updated: {claim.lastUpdated}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(claim.status)}>
                                {getStatusIcon(claim.status)}
                                <span className="ml-1">{claim.status}</span>
                              </Badge>
                              <Badge className={getPriorityColor(claim.priority)} variant="outline">
                                {claim.priority}
                              </Badge>
                            </div>
                          </div>

                          {/* Amount & Actions */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-bold text-foreground">₹{claim.claimAmount.toLocaleString()}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Est: ₹{claim.estimatedAmount.toLocaleString()}
                            </div>
                            {claim.assignedTo && (
                              <div className="text-sm text-muted-foreground">
                                Assigned: {claim.assignedTo}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Link to={`/tpa-review/${claim.id}`}>
                            <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Indicator */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>Documents: {claim.documents.filter(d => d.status === 'verified').length}/{claim.documents.length} verified</span>
                          <span>Timeline: {claim.timeline.length} updates</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TPAClaims;