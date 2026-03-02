import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, AlertCircle, CheckCircle, Edit, Save, X, Activity, FileText, Eye, Shield, RefreshCw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { useToast } from '../../hooks/use-toast';
import { surgerySchedulerService } from '../../services/surgerySchedulerService';
import ipdService from '../../services/ipdService';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import Loader from '../loader/Loader';
import SurgeryDetailsModal from '../shared/SurgeryDetailsModal';
import ClaimUploadModal from './ClaimUploadModal';

const UpcomingSurgeries = () => {
  const [surgeries, setSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [sortBy, setSortBy] = useState('surgeryDate');
  const [editingDate, setEditingDate] = useState(null);
  const [newSurgeryDate, setNewSurgeryDate] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedSurgeryForClaim, setSelectedSurgeryForClaim] = useState(null);
  const [investigationsMap, setInvestigationsMap] = useState(new Map());
  const [togglingInsurance, setTogglingInsurance] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUpcomingSurgeries();
  }, []);

  const fetchUpcomingSurgeries = async () => {
    try {
      setLoading(true);
      const response = await surgerySchedulerService.getScheduledSurgeries();
      
      if (response.success) {
        setSurgeries(response.data);
        
        // Extract all unique investigation IDs and fetch investigation details
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
      const response = await surgerySchedulerService.updateSurgeryDate(surgeryId, newSurgeryDate);
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

  // Modal handlers for surgery details
  const handleShowDetails = (surgery) => {
    setSelectedSurgery(surgery);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedSurgery(null);
  };

  // Modal handlers for claim submission
  const handleOpenClaimModal = (surgery) => {
    setSelectedSurgeryForClaim(surgery);
    setShowClaimModal(true);
  };

  const handleCloseClaimModal = () => {
    setShowClaimModal(false);
    setSelectedSurgeryForClaim(null);
  };

  const handleClaimSuccess = () => {
    // Refresh surgeries list after successful claim submission
    fetchUpcomingSurgeries();
  };

  // Toggle insurance applicable status
  const handleToggleInsurance = async (surgeryId, currentStatus) => {
    try {
      setTogglingInsurance(surgeryId);
      
      const response = await ipdService.toggleInsuranceApplicable(surgeryId, !currentStatus);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: `Insurance ${!currentStatus ? 'enabled' : 'disabled'} successfully`,
          variant: 'default',
        });
        
        // Refresh the surgeries list
        await fetchUpcomingSurgeries();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to toggle insurance status',
        variant: 'destructive',
      });
    } finally {
      setTogglingInsurance(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    );
  }

  return (
    <>
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex-shrink-0">
        {/* Row 1: Title + Summary Badges + Refresh */}
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Upcoming Surgeries
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              {filteredSurgeries.length} Scheduled
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
              {filteredSurgeries.filter(s => isToday(new Date(s.surgeryDate))).length} Today
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              {filteredSurgeries.filter(s => isTomorrow(new Date(s.surgeryDate))).length} Tomorrow
            </Badge>
            <Button
              onClick={fetchUpcomingSurgeries}
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

        {/* Row 2: Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by patient name, number, or admission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-full sm:w-48 h-10">
              <SelectValue placeholder="Filter by date" />
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
            <SelectTrigger className="w-full sm:w-48 h-10">
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

      <CardContent className="p-4 flex-1 min-h-0 overflow-y-auto tab-content-container">
        {filteredSurgeries.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3 opacity-50" />
            <p className="text-gray-500 font-medium">No Scheduled Surgeries</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm || filterDate !== 'all' 
                ? 'No surgeries match your current filters.' 
                : 'There are no upcoming scheduled surgeries at this time.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
          {filteredSurgeries.map((surgery) => (
            <Card key={surgery.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500 bg-white">
              <CardContent className="p-4">
                <div className="grid grid-cols-11 gap-3 items-start">
                  {/* Patient Info - 3 columns */}
                  <div className="col-span-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-gray-900 mb-1 truncate">
                            {surgery.patient?.firstName} {surgery.patient?.lastName}
                          </h3>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Badge variant="outline" className="bg-white text-blue-700 px-1.5 py-0.5 text-xs font-medium border-blue-300">
                                #{surgery.patient?.patientNumber}
                              </Badge>
                              <span className="text-gray-700 font-medium">{calculateAge(surgery.patient?.dateOfBirth)}Y</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-700 capitalize">{surgery.patient?.gender}</span>
                            </div>
                            <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded border">
                              <strong>Admission:</strong> {surgery.admissionNumber}
                            </div>
                            {surgery.patient?.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-700">
                                <Phone className="h-3 w-3 text-gray-500" />
                                <span className="font-medium">{surgery.patient.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Surgery & Package Details */}
                    <div className="mt-2">
                      <div className="bg-gradient-to-r from-purple-50 to-green-50 border border-purple-200 rounded-lg p-2.5">
                        <div className="space-y-1.5">
                          {/* Surgery Type */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <Activity className="h-3 w-3 text-purple-600" />
                              <span className="text-xs font-semibold text-purple-900">Surgery</span>
                            </div>
                            <div className="text-sm font-bold text-purple-800 leading-tight">
                              {surgery.surgeryTypeDetail?.name || (
                                <span className="text-gray-500 italic text-xs">Type not specified</span>
                              )}
                            </div>
                            {surgery.surgeryTypeDetail?.category && (
                              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300 mt-0.5 px-1 py-0">
                                {surgery.surgeryTypeDetail.category}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Package */}
                          <div className="border-t border-gray-200 pt-1.5">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <FileText className="h-3 w-3 text-green-600" />
                              <span className="text-xs font-semibold text-green-900">Package</span>
                            </div>
                            {surgery.surgeryPackageDetail || surgery.surgeryPackage ? (
                              <div>
                                <div className="text-xs font-bold text-green-800 leading-tight">
                                  {surgery.surgeryPackageDetail?.packageName || surgery.surgeryPackage}
                                </div>
                                {surgery.surgeryPackageDetail?.packageCost && (
                                  <div className="text-xs text-green-600 font-semibold">
                                    ₹{surgery.surgeryPackageDetail.packageCost.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 text-amber-500" />
                                <span className="text-xs text-amber-600 font-medium">Not selected</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>



                  {/* Lens Information - 3 columns */}
                  <div className="col-span-3">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-2.5 h-full">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <Eye className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-blue-900">Lens Information</span>
                      </div>
                      <div className="space-y-2">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          surgery.lensRequired 
                            ? 'bg-blue-200 text-blue-800 border border-blue-300' 
                            : 'bg-gray-200 text-gray-700 border border-gray-300'
                        }`}>
                          {surgery.lensRequired ? (
                            <><CheckCircle className="h-3 w-3" /> Required</>
                          ) : (
                            <><X className="h-3 w-3" /> Not Required</>
                          )}
                        </div>
                        {surgery.lensRequired && surgery.lens && (
                          <div className="space-y-1">
                            <div className="font-bold text-blue-800 text-sm truncate" title={surgery.lens.lensName}>
                              {surgery.lens.lensName}
                            </div>
                            <div className="text-blue-600 text-xs font-medium truncate" title={surgery.lens.manufacturer}>
                              {surgery.lens.manufacturer}
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {surgery.lens.lensType && (
                                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300 px-2 py-0.5">
                                  {surgery.lens.lensType}
                                </Badge>
                              )}
                              {surgery.lens.lensCategory && (
                                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300 px-2 py-0.5">
                                  {surgery.lens.lensCategory}
                                </Badge>
                              )}
                            </div>
                            {surgery.lens.patientCost && (
                              <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">
                                Cost: ₹{surgery.lens.patientCost.toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                        {surgery.lensRequired && !surgery.lens && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            <AlertCircle className="h-3 w-3" />
                            <span className="font-medium">Selection pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team & Schedule - 3 columns */}
                  <div className="col-span-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 h-full">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center">
                          <User className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">Assigned Team</span>
                      </div>
                      <div className="space-y-2">
                        {/* Surgeon */}
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-600">Surgeon</div>
                            {surgery.surgeon ? (
                              <div className="text-sm font-semibold text-green-800 truncate">
                                Dr. {surgery.surgeon.firstName} {surgery.surgeon.lastName}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 italic">Not assigned</div>
                            )}
                          </div>
                        </div>
                        
                        {/* Anesthesiologist */}
                        {surgery.anesthesiologist && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-gray-600">Anesthesiologist</div>
                              <div className="text-sm font-semibold text-orange-800 truncate">
                                Dr. {surgery.anesthesiologist.firstName} {surgery.anesthesiologist.lastName}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Sister */}
                        {surgery.sister && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0"></div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-gray-600">Sister</div>
                              <div className="text-sm font-semibold text-pink-800 truncate">
                                {surgery.sister.firstName} {surgery.sister.lastName}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!surgery.surgeon && !surgery.anesthesiologist && !surgery.sister && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs italic">No team assigned</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date & Actions - remaining columns */}
                  <div className="col-span-2 flex flex-col justify-between space-y-2">
                    <div className="text-center">
                      {/* Surgery Date */}
                      <div className="mb-3">
                        {editingDate === surgery.id ? (
                          <div className="space-y-2">
                            <Input
                              type="date"
                              value={newSurgeryDate}
                              onChange={(e) => setNewSurgeryDate(e.target.value)}
                              className="w-full h-8 text-sm"
                            />
                            <div className="flex gap-1 justify-center">
                              <Button 
                                size="sm" 
                                onClick={() => handleDateSave(surgery.id)}
                                disabled={savingDate}
                                className="h-7 w-7 p-0"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={handleDateCancel}
                                className="h-7 w-7 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm ${getStatusColor(surgery.surgeryDate)}`}>
                              {getDateLabel(surgery.surgeryDate)}
                            </div>
                            {surgery.tentativeTime && (
                              <div className="text-xs text-gray-600 flex items-center justify-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                <Clock className="h-3 w-3" />
                                <span className="font-medium">{surgery.tentativeTime}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="space-y-1.5">
                        {/* Claim Status Badge - Show if claim initiated */}
                        {surgery.claimInitiated && (
                          <Badge 
                            className={`w-full justify-center text-xs ${
                              surgery.claimStatus === 'APPROVED' ? 'bg-green-100 text-green-800 border-green-300' :
                              surgery.claimStatus === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              surgery.claimStatus === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-300' :
                              surgery.claimStatus === 'SETTLED' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              'bg-purple-100 text-purple-800 border-purple-300'
                            }`}
                          >
                            {surgery.claimStatus?.replace('_', ' ')}
                          </Badge>
                        )}
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDateEdit(surgery.id, surgery.surgeryDate)}
                          className="w-full h-7 text-xs font-medium"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        
                        {/* Insurance Toggle - Show only if claim not initiated */}
                        {!surgery.claimInitiated && (
                          <div className="flex items-center justify-between w-full p-2 bg-gray-50 rounded border border-gray-200">
                            <div className="flex items-center gap-2">
                              <Shield className={`h-4 w-4 ${surgery.insuranceApplicable ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className="text-xs font-medium">Insurance</span>
                            </div>
                            <Switch
                              checked={surgery.insuranceApplicable || false}
                              onCheckedChange={() => handleToggleInsurance(surgery.id, surgery.insuranceApplicable)}
                              disabled={togglingInsurance === surgery.id}
                              className="h-4 w-7"
                            />
                          </div>
                        )}
                        
                        {/* Claim Submit button - show only if insurance is applicable and claim not initiated */}
                        {!surgery.claimInitiated && surgery.insuranceApplicable && (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleOpenClaimModal(surgery)}
                            className="w-full h-7 text-xs font-medium bg-green-600 hover:bg-green-700"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Submit Claim
                          </Button>
                        )}
                        
                        <Button 
                          size="sm" 
                          className="w-full h-7 text-xs font-medium"
                          onClick={() => handleShowDetails(surgery)}
                        >
                          <Activity className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
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

      {/* Claim Upload Modal */}
      <ClaimUploadModal
        isOpen={showClaimModal}
        onClose={handleCloseClaimModal}
        surgery={selectedSurgeryForClaim}
        onSuccess={handleClaimSuccess}
      />
    </>
  );
};

export default UpcomingSurgeries;