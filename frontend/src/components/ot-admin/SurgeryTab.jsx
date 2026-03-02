import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, AlertCircle, CheckCircle, Edit, Save, X, Activity, FileText, Eye, Upload, Download, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { surgerySchedulerService } from '../../services/surgerySchedulerService';
import { ipdService } from '../../services/ipdService';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import Loader from '../loader/Loader';
import SurgeryDetailsModal from '../shared/SurgeryDetailsModal';
import CheckinModal from '../shared/CheckinModal';
import SuccessAnimation from '../shared/SuccessAnimation';

const SurgeryTab = () => {
  const { user } = useAuth();
  const [surgeries, setSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [sortBy, setSortBy] = useState('surgeryDate');
  const [editingDate, setEditingDate] = useState(null);
  const [newSurgeryDate, setNewSurgeryDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [investigationsMap, setInvestigationsMap] = useState(new Map());
  const { toast } = useToast();

  useEffect(() => {
    fetchUpcomingSurgeries();
  }, []);

  const fetchUpcomingSurgeries = async () => {
    try {
      setLoading(true);
      
      // Use the same API as TPA dashboard - surgerySchedulerService.getScheduledSurgeries()
      const response = await surgerySchedulerService.getScheduledSurgeries();
      
      if (response.success) {
        setSurgeries(response.data);
        
        // Extract all unique investigation IDs and fetch investigation details like TPA dashboard
        const allInvestigationIds = new Set();
        response.data.forEach(surgery => {
          if (surgery.surgeryTypeDetail?.investigationIds) {
            surgery.surgeryTypeDetail.investigationIds.forEach(id => {
              if (id && String(id).trim()) {
                allInvestigationIds.add(String(id).trim());
              }
            });
          }
        });

        // Fetch investigation details if we have IDs
        if (allInvestigationIds.size > 0) {
          try {
            const investigationsResponse = await surgerySchedulerService.getAllInvestigations();
            
            if (investigationsResponse.success) {
              const investigationsMap = new Map();
              
              investigationsResponse.data.forEach(investigation => {
                
                // Store by multiple key variations to handle different ID formats
                const id = investigation.id;
                investigationsMap.set(id, investigation);
                investigationsMap.set(String(id), investigation);
                
                // Handle UUID vs numeric IDs
                if (typeof id === 'string') {
                  investigationsMap.set(id.toLowerCase(), investigation);
                  investigationsMap.set(id.toUpperCase(), investigation);
                  if (!isNaN(id)) {
                    investigationsMap.set(Number(id), investigation);
                  }
                } else if (typeof id === 'number') {
                  investigationsMap.set(String(id), investigation);
                }
                
              });
              
              setInvestigationsMap(investigationsMap);
            }
          } catch (error) {
            // Continue without investigation details
          }
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch upcoming surgeries",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch upcoming surgeries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSurgeries = () => {
    let filtered = surgeries;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(surgery =>
        surgery.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        surgery.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        surgery.patient?.patientNumber?.toString().includes(searchTerm) ||
        surgery.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date filter
    if (filterDate !== 'all') {
      const today = new Date();
      filtered = filtered.filter(surgery => {
        if (!surgery.surgeryDate) return false;
        const surgeryDate = new Date(surgery.surgeryDate);
        
        switch (filterDate) {
          case 'today':
            return isToday(surgeryDate);
          case 'tomorrow':
            return isTomorrow(surgeryDate);
          case 'week':
            return surgeryDate <= addDays(today, 7) && surgeryDate >= today;
          case 'month':
            return surgeryDate <= addDays(today, 30) && surgeryDate >= today;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'surgeryDate':
          return new Date(a.surgeryDate || 0) - new Date(b.surgeryDate || 0);
        case 'patientName':
          const nameA = `${a.patient?.firstName} ${a.patient?.lastName}`;
          const nameB = `${b.patient?.firstName} ${b.patient?.lastName}`;
          return nameA.localeCompare(nameB);
        case 'admissionDate':
          return new Date(a.admissionDate) - new Date(b.admissionDate);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'routine':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (date) => {
    if (!date) return 'bg-gray-100 text-gray-700';
    const surgeryDate = new Date(date);
    if (isToday(surgeryDate)) return 'bg-red-100 text-red-800 font-medium';
    if (isTomorrow(surgeryDate)) return 'bg-orange-100 text-orange-800 font-medium';
    return 'bg-green-100 text-green-800';
  };

  const getDateLabel = (date) => {
    if (!date) return 'Not scheduled';
    const surgeryDate = new Date(date);
    if (isToday(surgeryDate)) return 'Today';
    if (isTomorrow(surgeryDate)) return 'Tomorrow';
    return format(surgeryDate, 'MMM dd, yyyy');
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    return Math.floor((new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const handleDateEdit = (surgeryId, currentDate) => {
    setEditingDate(surgeryId);
    setNewSurgeryDate(currentDate ? format(new Date(currentDate), 'yyyy-MM-dd') : '');
  };

  const handleDateSave = async (surgeryId) => {
    if (!newSurgeryDate) {
      toast({
        title: "Error",
        description: "Please select a valid date",
        variant: "destructive"
      });
      return;
    }

    setSavingDate(true);
    try {
      const response = await ipdService.updateIpdAdmission(surgeryId, { surgeryDate: newSurgeryDate });
      if (response.success) {
        // Update local state
        setSurgeries(prev => prev.map(surgery => 
          surgery.id === surgeryId 
            ? { ...surgery, surgeryDate: newSurgeryDate }
            : surgery
        ));
        
        toast({
          title: "Success",
          description: "Surgery date updated successfully",
        });
        
        setEditingDate(null);
        setNewSurgeryDate('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update surgery date",
        variant: "destructive"
      });
    } finally {
      setSavingDate(false);
    }
  };

  const handleDateCancel = () => {
    setEditingDate(null);
    setNewSurgeryDate('');
  };

  const handleInvestigationDocumentUpload = async (admissionId, file) => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive"
      });
      return;
    }

    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Only PDF files are allowed",
        variant: "destructive"
      });
      return;
    }

    setUploadingDoc(admissionId);
    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await ipdService.uploadInvestigationDocument(admissionId, formData);
      
      if (response.success) {
        // Update the local state to reflect the uploaded document
        setSurgeries(prev => prev.map(surgery => 
          surgery.id === admissionId 
            ? { ...surgery, investigationDocumentPath: response.data.documentPath }
            : surgery
        ));

        toast({
          title: "Success",
          description: "Investigation document uploaded successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to upload investigation document",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload investigation document",
        variant: "destructive"
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleViewDetails = (surgery) => {
    setSelectedSurgery(surgery);
    setShowDetailsModal(true);
  };

  const handleCheckinStart = (surgery) => {
    setSelectedSurgery(surgery);
    setShowCheckinModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedSurgery(null);
  };

  const handleCloseCheckinModal = () => {
    setShowCheckinModal(false);
    setSelectedSurgery(null);
  };

  const handleInvestigationUploadComplete = async (admissionId, formData) => {
    try {
      
      const response = await ipdService.uploadInvestigationDocument(admissionId, formData);
      
      if (response.success) {
        // Update the local state to reflect the uploaded document
        setSurgeries(prev => prev.map(surgery => 
          surgery.id === admissionId 
            ? { 
                ...surgery, 
                investigationDocumentPath: response.data?.documentPath,
                // You can also track uploaded investigations here if needed
              }
            : surgery
        ));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const handleInvestigationDeleteDocument = async (admissionId, documentPath) => {
    try {
      
      const response = await ipdService.deleteInvestigationDocument(admissionId, documentPath);
      
      
      if (response.success) {
        // Update the local state to remove the deleted document path
        setSurgeries(prev => prev.map(surgery => {
          if (surgery.id === admissionId) {
            const currentPaths = surgery.investigationDocumentPath || [];
            const updatedPaths = currentPaths.filter(path => path !== documentPath);
            return { ...surgery, investigationDocumentPath: updatedPaths };
          }
          return surgery;
        }));
        
        // Also update selectedSurgery if it matches
        setSelectedSurgery(prev => {
          if (prev && prev.id === admissionId) {
            const currentPaths = prev.investigationDocumentPath || [];
            const updatedPaths = currentPaths.filter(path => path !== documentPath);
            return { ...prev, investigationDocumentPath: updatedPaths };
          }
          return prev;
        });
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const getInvestigationName = (investigationId) => {
    // Try to get investigation with original ID
    let investigation = investigationsMap.get(investigationId);
    
    // If not found, try string version
    if (!investigation && typeof investigationId !== 'string') {
      investigation = investigationsMap.get(String(investigationId));
    }
    
    // If not found, try number version
    if (!investigation && typeof investigationId === 'string' && !isNaN(investigationId)) {
      investigation = investigationsMap.get(Number(investigationId));
    }
    
    if (investigation) {
      // Try multiple property names to handle different API structures
      const name = investigation.investigationName || 
                   investigation.name || 
                   investigation.title ||
                   investigation.displayName ||
                   'Unknown Investigation';
      return name;
    } else {
      return `Investigation: ${investigationId}`;
    }
  };

  const filteredSurgeries = getFilteredSurgeries();

  const todayCount = filteredSurgeries.filter(s => s.surgeryDate && isToday(new Date(s.surgeryDate))).length;
  const tomorrowCount = filteredSurgeries.filter(s => s.surgeryDate && isTomorrow(new Date(s.surgeryDate))).length;

  return (
    <div className="h-full flex flex-col">
      {/* Surgery Management Card with Integrated Filters */}
      <Card className="flex flex-col flex-1 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <CardTitle>Surgery Management</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {todayCount} Today
              </Badge>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                {tomorrowCount} Tomorrow
              </Badge>
              <Badge variant="outline">
                {filteredSurgeries.length} Total
              </Badge>
              <Button
                onClick={fetchUpcomingSurgeries}
                variant="outline"
                size="sm"
                className="h-9"
                disabled={loading}
              >
                <Activity className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Integrated Filters & Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Input
                placeholder="Search patient, patient #, admission..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10"
              />
            </div>

            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Filter by Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Surgeries</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="surgeryDate">Surgery Date</SelectItem>
                <SelectItem value="patientName">Patient Name</SelectItem>
                <SelectItem value="admissionDate">Admission Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto tab-content-container pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Activity className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSurgeries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No Scheduled Surgeries</p>
              <p className="text-sm mt-1">
                {searchTerm || filterDate !== 'all' 
                  ? 'No surgeries match your current filters.' 
                  : 'There are no upcoming scheduled surgeries at this time.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
          {filteredSurgeries.map((surgery) => (
            <Card key={surgery.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-purple-500 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Left side - Patient and Surgery Info */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Patient Avatar and Basic Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {surgery.patient?.firstName} {surgery.patient?.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium border-blue-300">
                            #{surgery.patient?.patientNumber}
                          </Badge>
                          <span className="text-gray-400">•</span>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 px-2 py-0.5 text-xs font-medium border-purple-300">
                            {surgery.admissionNumber}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Surgery Type */}
                    <div className="border-l border-gray-200 pl-4">
                      <div className="text-sm font-semibold text-purple-800">
                        {surgery.surgeryTypeDetail?.name || (
                          <span className="text-gray-500 italic">Surgery type not specified</span>
                        )}
                      </div>
                      {surgery.surgeryTypeDetail?.category && (
                        <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300 mt-1">
                          {surgery.surgeryTypeDetail.category}
                        </Badge>
                      )}
                    </div>

                    {/* Surgery Date */}
                    <div className="border-l border-gray-200 pl-4">
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(surgery.surgeryDate)}`}>
                        {getDateLabel(surgery.surgeryDate)}
                      </div>
                      {surgery.tentativeTime && (
                        <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{surgery.tentativeTime}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side - Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(surgery)}
                      className="flex items-center gap-2"
                    >
                      <Info className="h-4 w-4" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCheckinStart(surgery)}
                      disabled={!isToday(new Date(surgery.surgeryDate))}
                      className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!isToday(new Date(surgery.surgeryDate)) ? "Can only start surgeries scheduled for today" : "Start surgery check-in process"}
                    >
                      <Activity className="h-4 w-4" />
                      {isToday(new Date(surgery.surgeryDate)) ? 'Check-in & Start' : 'Check-in & Start'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reusable Surgery Details Modal */}
      <SurgeryDetailsModal
        surgery={selectedSurgery}
        isOpen={showDetailsModal}
        onClose={handleCloseModal}
        getInvestigationName={getInvestigationName}
      />

      {/* Check-in Modal for Investigation Upload */}
      <CheckinModal
        surgery={selectedSurgery}
        isOpen={showCheckinModal}
        onClose={handleCloseCheckinModal}
        getInvestigationName={getInvestigationName}
        onUploadComplete={handleInvestigationUploadComplete}
        onDeleteDocument={handleInvestigationDeleteDocument}
        onSuccess={() => {
          fetchUpcomingSurgeries();
          // Show success animation after a short delay
          setTimeout(() => {
            setShowSuccessAnimation(true);
          }, 300);
        }} // Refresh surgery list after successful completion
      />

      {/* Success Animation */}
      <SuccessAnimation 
        isOpen={showSuccessAnimation}
        onComplete={() => {
          setShowSuccessAnimation(false);
        }}
        title="Surgery Preparation Complete!"
        message="Stock has been adjusted successfully"
      />
    </div>
  );
};

export default SurgeryTab;