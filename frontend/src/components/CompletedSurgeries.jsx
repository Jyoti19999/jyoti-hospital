import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Eye,
  Activity,
  FileText,
  Clock,
  User,
  Phone,
  Mail,
  Calendar,
  Package,
  Target,
  Stethoscope,
  Loader,
  AlertCircle,
  CheckCircle,
  Award,
  Search,
  Filter,
  Download,
  Star,
  TrendingUp,
  BarChart3,
  Scissors,
  RefreshCw
} from 'lucide-react';
import { surgeryService } from '@/services/surgeryService';
import { toast } from 'react-hot-toast';

const CompletedSurgeries = () => {
  // API Base URL - Use Vite environment variable or fallback
  const API_BASE_URL = import.meta.env.VITE_API_IMG_URL || 'http://localhost:8080';
  
  const [completedSurgeries, setCompletedSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [filteredSurgeries, setFilteredSurgeries] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  // Modals state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  // Calculate age from dateOfBirth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Format surgery duration
  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Get surgery outcome badge
  const getSurgeryOutcome = (surgery) => {
    if (surgery.complications && surgery.complications.length > 0) {
      return { status: 'With Complications', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
    }
    return { status: 'Successful', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  useEffect(() => {
    fetchCompletedSurgeries();
  }, []);

  useEffect(() => {
    filterSurgeries();
  }, [completedSurgeries, searchTerm, selectedDate, outcomeFilter]);

  const fetchCompletedSurgeries = async () => {
    try {
      setLoading(true);
      const response = await surgeryService.getCompletedSurgeries();
      setCompletedSurgeries(response.data || []);
    } catch (error) {
      setCompletedSurgeries([]);
      toast.error('Failed to fetch completed surgeries');
    } finally {
      setLoading(false);
    }
  };

  const filterSurgeries = () => {
    let filtered = completedSurgeries;

    // Search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(surgery => 
        `${surgery.patient?.firstName} ${surgery.patient?.lastName}`.toLowerCase().includes(query) ||
        surgery.patient?.patientNumber?.toLowerCase().includes(query) ||
        surgery.surgeryTypeDetail?.name?.toLowerCase().includes(query) ||
        surgery.surgeryPackage?.toLowerCase().includes(query)
      );
    }

    // Date filter - filter by selected date
    if (selectedDate) {
      filtered = filtered.filter(surgery => {
        const surgeryDate = new Date(surgery.surgeryEndTime || surgery.updatedAt).toISOString().split('T')[0];
        return surgeryDate === selectedDate;
      });
    }

    // Outcome filter
    if (outcomeFilter !== 'all') {
      if (outcomeFilter === 'successful') {
        filtered = filtered.filter(s => !s.complications || s.complications.length === 0);
      } else if (outcomeFilter === 'complications') {
        filtered = filtered.filter(s => s.complications && s.complications.length > 0);
      }
    }

    setFilteredSurgeries(filtered);
  };

  const handleViewDetails = (surgery) => {
    setSelectedSurgery(surgery);
    setShowDetailsModal(true);
  };

  const handleViewDocuments = (surgery) => {
    setSelectedSurgery(surgery);
    setSelectedDocuments(surgery.investigationDocumentPath || []);
    setShowDocumentsModal(true);
  };

  // Calculate summary statistics
  const totalCompleted = completedSurgeries.length;
  const successfulCount = completedSurgeries.filter(s => !s.complications || s.complications.length === 0).length;
  const complicationsCount = completedSurgeries.filter(s => s.complications && s.complications.length > 0).length;
  const avgDuration = completedSurgeries.length > 0 
    ? Math.round(completedSurgeries
        .filter(s => s.surgeryStartTime && s.surgeryEndTime)
        .reduce((acc, s) => acc + ((new Date(s.surgeryEndTime) - new Date(s.surgeryStartTime)) / 60000), 0) 
        / completedSurgeries.filter(s => s.surgeryStartTime && s.surgeryEndTime).length
      ) || 0
    : 0;
  const thisMonthCount = completedSurgeries.filter(s => {
    const surgeryDate = new Date(s.surgeryEndTime || s.updatedAt);
    const now = new Date();
    return surgeryDate.getMonth() === now.getMonth() && surgeryDate.getFullYear() === now.getFullYear();
  }).length;
  const successRate = completedSurgeries.length > 0 
    ? Math.round((successfulCount / completedSurgeries.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-gray-600">Loading completed surgeries...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Completed Surgeries Card with Integrated Filters */}
      <Card className="flex flex-col flex-1 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Completed Surgeries
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {totalCompleted} Total
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                {successfulCount} Successful
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                {complicationsCount} With Complications
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                {avgDuration}m Avg Duration
              </Badge>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                {thisMonthCount} This Month
              </Badge>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                {successRate}% Success Rate
              </Badge>
              <Badge variant="outline">
                {filteredSurgeries.length} Result{filteredSurgeries.length !== 1 ? 's' : ''}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCompletedSurgeries}
                className="h-9"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Integrated Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name, ID, surgery type, or package..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                placeholder="Filter by date"
                className="w-48 h-10"
              />
            </div>
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue placeholder="Filter by outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="successful">Successful</SelectItem>
                <SelectItem value="complications">With Complications</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-10">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto tab-content-container pr-2">
          {filteredSurgeries.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                {completedSurgeries.length === 0 ? 'No Completed Surgeries' : 'No Results Found'}
              </h3>
              <p className="text-gray-400 text-sm">
                {completedSurgeries.length === 0 
                  ? 'Complete your first surgery to see it here.' 
                  : 'Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSurgeries.map((surgery) => {
                const outcome = getSurgeryOutcome(surgery);
                const OutcomeIcon = outcome.icon;
                const duration = formatDuration(surgery.surgeryStartTime, surgery.surgeryEndTime);
                
                return (
                  <div key={surgery.id} className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {surgery.patient?.firstName} {surgery.patient?.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {calculateAge(surgery.patient?.dateOfBirth)}Y, {surgery.patient?.gender} | 
                            Patient ID: {surgery.patient?.patientNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={outcome.color}>
                          <OutcomeIcon className="h-3 w-3 mr-1" />
                          {outcome.status}
                        </Badge>
                        {surgery.surgeryStartTime && surgery.surgeryEndTime && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(surgery.surgeryStartTime, surgery.surgeryEndTime)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                      <div>
                        <Label className="text-xs text-gray-500">SURGERY DETAILS</Label>
                        <p className="font-medium">{surgery.surgeryTypeDetail?.name || 'Not specified'}</p>
                        <p className="text-sm text-gray-600">{surgery.surgeryPackage || 'Standard Package'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">COMPLETION DATE</Label>
                        <p className="font-medium">
                          {surgery.surgeryEndTime 
                            ? new Date(surgery.surgeryEndTime).toLocaleDateString()
                            : new Date(surgery.updatedAt).toLocaleDateString()
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {surgery.surgeryEndTime 
                            ? new Date(surgery.surgeryEndTime).toLocaleTimeString()
                            : new Date(surgery.updatedAt).toLocaleTimeString()
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">DURATION</Label>
                        <p className="font-medium text-blue-600">{duration}</p>
                        <p className="text-sm text-gray-600">
                          {surgery.surgeryStartTime ? new Date(surgery.surgeryStartTime).toLocaleTimeString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">LENS USED</Label>
                        <p className="font-medium">{surgery.lens?.lensName || 'Standard IOL'}</p>
                        <p className="text-sm text-gray-600">{surgery.lens?.lensType || ''}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">OUTCOME</Label>
                        <p className="font-medium text-green-600">Surgery Completed</p>
                        <p className="text-sm text-gray-600">
                          {surgery.finalNotes ? 'With notes' : 'No complications noted'}
                        </p>
                      </div>
                    </div>

                    {surgery.finalNotes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <Label className="text-xs text-gray-500">FINAL SURGICAL NOTES</Label>
                        <p className="text-sm text-gray-700 mt-1">{surgery.finalNotes}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(surgery)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDocuments(surgery)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Documents
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export Report
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Rate Outcome
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Surgery Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Completed Surgery Details</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedSurgery && (
            <div className="space-y-6">
              {/* Patient Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Patient Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                        <p className="text-lg font-semibold">
                          {selectedSurgery.patient?.firstName} {selectedSurgery.patient?.lastName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Age & Gender</Label>
                        <p>{calculateAge(selectedSurgery.patient?.dateOfBirth)} years, {selectedSurgery.patient?.gender}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Patient Number</Label>
                        <p className="font-mono">{selectedSurgery.patient?.patientNumber}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Phone</Label>
                        <p className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          {selectedSurgery.patient?.phone || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <p className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          {selectedSurgery.patient?.email || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Address</Label>
                        <p>{selectedSurgery.patient?.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Surgery Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Surgery Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Procedure</Label>
                        <p className="font-medium">{selectedSurgery.surgeryTypeDetail?.name || 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Package</Label>
                        <p className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-blue-500" />
                          {selectedSurgery.surgeryPackage || 'Standard Package'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Start Time</Label>
                        <p>
                          {selectedSurgery.surgeryStartTime 
                            ? new Date(selectedSurgery.surgeryStartTime).toLocaleString()
                            : 'Not recorded'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Completion Time</Label>
                        <p>
                          {selectedSurgery.surgeryEndTime 
                            ? new Date(selectedSurgery.surgeryEndTime).toLocaleString()
                            : new Date(selectedSurgery.updatedAt).toLocaleString()
                          }
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Duration</Label>
                        <p className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          {formatDuration(selectedSurgery.surgeryStartTime, selectedSurgery.surgeryEndTime)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Outcome</Label>
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const outcome = getSurgeryOutcome(selectedSurgery);
                            const OutcomeIcon = outcome.icon;
                            return (
                              <Badge className={outcome.color}>
                                <OutcomeIcon className="h-3 w-3 mr-1" />
                                {outcome.status}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Final Notes */}
                  {selectedSurgery.finalNotes && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium text-gray-700">Final Surgical Notes</Label>
                      <p className="text-gray-900 mt-2">{selectedSurgery.finalNotes}</p>
                    </div>
                  )}

                  {/* Lens Information */}
                  {selectedSurgery.lens && (
                    <div className="mt-6">
                      <Label className="text-sm font-medium text-gray-700">Implanted Lens</Label>
                      <div className="mt-2 p-4 bg-blue-50 rounded-lg">
                        <p className="font-medium">{selectedSurgery.lens.lensName}</p>
                        <p className="text-sm text-gray-600">{selectedSurgery.lens.lensType}</p>
                        {selectedSurgery.lens.lensCategory && (
                          <p className="text-sm text-gray-500">Category: {selectedSurgery.lens.lensCategory}</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Documents Modal */}
      <Dialog open={showDocumentsModal} onOpenChange={setShowDocumentsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span>Surgery Documents & Reports</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedSurgery && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Patient: {selectedSurgery.patient?.firstName} {selectedSurgery.patient?.lastName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDocuments.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-gray-600 mb-4">Total Documents: {selectedDocuments.length}</p>
                      <div className="grid grid-cols-1 gap-4">
                        {selectedDocuments.map((documentPath, index) => {
                          const fileName = documentPath.split('/').pop();
                          const displayName = fileName.split('_').slice(1).join('_') || fileName;
                          
                          return (
                            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <FileText className="h-8 w-8 text-blue-600" />
                                  <div>
                                    <h4 className="font-medium text-gray-900">{displayName}</h4>
                                    <p className="text-sm text-gray-600">Document {index + 1}</p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(`${API_BASE_URL}/${documentPath}`, '_blank')}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = `${API_BASE_URL}/${documentPath}`;
                                      link.download = displayName;
                                      link.click();
                                    }}
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Document preview iframe */}
                              <div className="mt-4">
                                <div className="border rounded bg-gray-50 p-2">
                                  <iframe 
                                    src={`${API_BASE_URL}/${documentPath}`}
                                    className="w-full h-64 border rounded"
                                    title={`Document ${index + 1}`}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
                      <p className="text-gray-600">No documents were uploaded for this completed surgery.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompletedSurgeries;