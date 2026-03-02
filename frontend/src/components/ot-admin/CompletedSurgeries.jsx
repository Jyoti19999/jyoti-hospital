import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Settings,
  Search,
  Filter,
  Download,
  Star,
  TrendingUp,
  BarChart3,
  Scissors,
  Plus,
  Minus,
  X,
  Save,
  RefreshCw,
  PackageCheck,
  ShoppingCart,
  Archive
} from 'lucide-react';
import { otAdminService } from '@/services/otAdminService';
import { toast } from 'react-hot-toast';

const CompletedSurgeries = () => {
  const [completedSurgeries, setCompletedSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurgery, setSelectedSurgery] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [filteredSurgeries, setFilteredSurgeries] = useState([]);
  const [equipmentMasterData, setEquipmentMasterData] = useState({ equipment: [], lenses: [] });

  // Modals state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  // Stock adjustment state
  const [stockAdjustments, setStockAdjustments] = useState({
    unusedEquipment: [],
    extraEquipment: [],
    unusedLenses: [],
    extraLenses: [],
    notes: ''
  });
  
  // New stock adjustment state for the improved modal
  const [adjustments, setAdjustments] = useState({
    unusedEquipment: [],
    extraEquipment: [],
    unusedLenses: []
  });
  
  // Equipment search state
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [masterData, setMasterData] = useState({ equipment: [], lenses: [] });
  
  const [finalizingStock, setFinalizingStock] = useState(false);

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

  // Check if equipment is already finalized
  const isEquipmentFinalized = (surgery) => {
    return surgery.remainingEquipments && Object.keys(surgery.remainingEquipments).length > 0;
  };

  useEffect(() => {
    fetchCompletedSurgeries();
    fetchEquipmentMasterData();
  }, []);

  useEffect(() => {
    filterSurgeries();
  }, [completedSurgeries, searchTerm, dateFilter]);

  const fetchCompletedSurgeries = async () => {
    try {
      setLoading(true);
      const response = await otAdminService.getCompletedSurgeries();
      setCompletedSurgeries(response.data || []);
    } catch (error) {
      setCompletedSurgeries([]);
      toast.error('Failed to fetch completed surgeries');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipmentMasterData = async () => {
    try {
      const response = await otAdminService.getEquipmentMasterData();
      setEquipmentMasterData(response.data || { equipment: [], lenses: [] });
      setMasterData(response.data || { equipment: [], lenses: [] });
    } catch (error) {
      toast.error('Failed to fetch equipment data');
    }
  };

  // Equipment search with debouncing
  useEffect(() => {
    const searchEquipment = async () => {
      if (equipmentSearch.length >= 2) {
        setSearching(true);
        try {
          const filtered = masterData.equipment.filter(equipment =>
            equipment.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
            equipment.category.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
            (equipment.manufacturer && equipment.manufacturer.toLowerCase().includes(equipmentSearch.toLowerCase()))
          );
          setSearchResults(filtered);
          setShowSearchResults(true);
        } catch (error) {
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };

    const debounceTimer = setTimeout(searchEquipment, 300);
    return () => clearTimeout(debounceTimer);
  }, [equipmentSearch, masterData.equipment]);

  // Debug useEffect to track adjustments state changes
  useEffect(() => {
  }, [adjustments]);

  // Stock adjustment handlers
  const handleAdjustmentChange = (type, itemId, quantity, name, additionalData = {}) => {
    
    setAdjustments(prev => {
      const newAdjustments = { ...prev };
      const existingIndex = newAdjustments[type].findIndex(adj => 
        (type === 'unusedEquipment' && adj.equipmentId === itemId) ||
        (type === 'unusedLenses' && adj.lensId === itemId)
      );

      if (quantity === 0) {
        // Remove the adjustment if quantity is 0
        if (existingIndex !== -1) {
          newAdjustments[type].splice(existingIndex, 1);
        }
      } else {
        // Update or add the adjustment
        const adjustmentData = {
          [type === 'unusedEquipment' ? 'equipmentId' : 'lensId']: itemId,
          quantity,
          name,
          reason: '',
          ...additionalData // Include any additional data like category, manufacturer, etc.
        };

        if (existingIndex !== -1) {
          newAdjustments[type][existingIndex] = { ...newAdjustments[type][existingIndex], quantity, ...additionalData };
        } else {
          newAdjustments[type].push(adjustmentData);
        }
      }
      
      return newAdjustments;
    });
  };

  const handleExtraEquipmentAdd = (equipment, quantity = 1) => {
    
    // Check if equipment is already added
    const existingIndex = adjustments.extraEquipment.findIndex(item => item.equipmentId === equipment.id);
    
    if (existingIndex !== -1) {
      // Update existing equipment quantity
      setAdjustments(prev => ({
        ...prev,
        extraEquipment: prev.extraEquipment.map((item, index) => 
          index === existingIndex 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }));
    } else {
      // Add new equipment with complete details
      const newEquipment = {
        equipmentId: equipment.id,
        name: equipment.name,
        category: equipment.category,
        manufacturer: equipment.manufacturer || null,
        currentStock: equipment.currentStock || 0,
        quantity,
        reason: ''
      };
      
      
      setAdjustments(prev => {
        const updated = {
          ...prev,
          extraEquipment: [...prev.extraEquipment, newEquipment]
        };
        return updated;
      });
    }
    
    setEquipmentSearch('');
    setShowSearchResults(false);
  };

  const handleRemoveExtraEquipment = (index) => {
    setAdjustments(prev => ({
      ...prev,
      extraEquipment: prev.extraEquipment.filter((_, i) => i !== index)
    }));
  };

  const handleExtraEquipmentQuantityChange = (index, quantity) => {
    setAdjustments(prev => ({
      ...prev,
      extraEquipment: prev.extraEquipment.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    }));
  };

  const handleExtraEquipmentReasonChange = (index, reason) => {
    setAdjustments(prev => ({
      ...prev,
      extraEquipment: prev.extraEquipment.map((item, i) => 
        i === index ? { ...item, reason } : item
      )
    }));
  };

  const handleFinalizeAdjustments = async () => {
    if (!selectedSurgery) return;

    try {
      setFinalizingStock(true);
      
      // Prepare the finalization payload with proper structure matching backend expectations
      const finalizationPayload = {
        // Unused Equipment: Return to stock (reduce stock from surgery, increase available stock)
        unusedEquipment: adjustments.unusedEquipment.map(item => ({
          equipmentId: item.equipmentId,
          quantity: item.quantity,
          reason: item.reason || ''
        })),
        
        // Extra Equipment: Deduct from stock (additional usage beyond original requirement)
        extraEquipment: adjustments.extraEquipment.map(item => ({
          equipmentId: item.equipmentId,
          quantity: item.quantity,
          reason: item.reason || ''
        })),
        
        // Unused Lenses: Return to stock
        unusedLenses: adjustments.unusedLenses.map(item => ({
          lensId: item.lensId,
          quantity: item.quantity || 1, // Each lens is typically quantity 1
          reason: item.reason || ''
        })),
        
        // Extra Lenses: Empty array for now (can be expanded later if needed)
        extraLenses: [],
        
        // Notes from the old state if available
        notes: stockAdjustments.notes || ''
      };


      // API call to finalize equipment stock
      await otAdminService.finalizeEquipmentStock(selectedSurgery.id, finalizationPayload);

      toast.success('Stock adjustments finalized successfully!');
      setShowFinalizeModal(false);
      
      // Reset all adjustments
      setAdjustments({
        unusedEquipment: [],
        extraEquipment: [],
        unusedLenses: []
      });
      
      setStockAdjustments({
        unusedEquipment: [],
        extraEquipment: [],
        unusedLenses: [],
        extraLenses: [],
        notes: ''
      });

      // Refresh the surgeries list to show updated data
      fetchCompletedSurgeries();
    } catch (error) {
      toast.error('Failed to finalize stock adjustments. Please try again.');
    } finally {
      setFinalizingStock(false);
    }
  };

  const filterSurgeries = () => {
    let filtered = completedSurgeries;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(surgery =>
        surgery.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        surgery.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        surgery.patient?.patientNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        surgery.surgeryTypeDetail?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        surgery.surgeon?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        surgery.surgeon?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let dateThreshold;
      
      switch (dateFilter) {
        case 'today':
          dateThreshold = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateThreshold = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        default:
          dateThreshold = null;
      }

      if (dateThreshold) {
        filtered = filtered.filter(surgery => 
          new Date(surgery.surgeryEndTime || surgery.updatedAt) >= dateThreshold
        );
      }
    }

    setFilteredSurgeries(filtered);
  };

  const handleViewDetails = async (surgery) => {
    try {
      const response = await otAdminService.getSurgeryDetails(surgery.id);
      setSelectedSurgery(response.data || surgery);
      setShowDetailsModal(true);
    } catch (error) {
      setSelectedSurgery(surgery);
      setShowDetailsModal(true);
    }
  };

  const handleFinalizeEquipment = (surgery) => {
    setSelectedSurgery(surgery);
    setStockAdjustments({
      unusedEquipment: [],
      extraEquipment: [],
      unusedLenses: [],
      extraLenses: [],
      notes: ''
    });
    setAdjustments({
      unusedEquipment: [],
      extraEquipment: [],
      unusedLenses: []
    });
    setShowFinalizeModal(true);
  };

  const addUnusedEquipment = () => {
    setStockAdjustments(prev => ({
      ...prev,
      unusedEquipment: [...prev.unusedEquipment, { equipmentId: '', quantity: 0, reason: '' }]
    }));
  };

  const addExtraEquipment = () => {
    setStockAdjustments(prev => ({
      ...prev,
      extraEquipment: [...prev.extraEquipment, { equipmentId: '', quantity: 0, reason: '' }]
    }));
  };

  const addUnusedLens = () => {
    setStockAdjustments(prev => ({
      ...prev,
      unusedLenses: [...prev.unusedLenses, { lensId: '', quantity: 0, reason: '' }]
    }));
  };

  const addExtraLens = () => {
    setStockAdjustments(prev => ({
      ...prev,
      extraLenses: [...prev.extraLenses, { lensId: '', quantity: 0, reason: '' }]
    }));
  };

  const updateAdjustment = (type, index, field, value) => {
    setStockAdjustments(prev => ({
      ...prev,
      [type]: prev[type].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeAdjustment = (type, index) => {
    setStockAdjustments(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const totalCompleted = completedSurgeries.length;
  const equipmentFinalized = completedSurgeries.filter(s => isEquipmentFinalized(s)).length;
  const pendingFinalization = completedSurgeries.filter(s => !isEquipmentFinalized(s)).length;
  const thisMonth = completedSurgeries.filter(s => {
    const surgeryDate = new Date(s.surgeryEndTime || s.updatedAt);
    const now = new Date();
    return surgeryDate.getMonth() === now.getMonth() && surgeryDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="h-full flex flex-col">
      {/* Completed Surgeries Card with Integrated Filters */}
      <Card className="flex flex-col flex-1 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <CardTitle>Completed Surgeries - Equipment Management</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                {totalCompleted} Completed
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {equipmentFinalized} Finalized
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                {pendingFinalization} Pending
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                {thisMonth} This Month
              </Badge>
              <Badge variant="outline">
                {filteredSurgeries.length} Result{filteredSurgeries.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
          
          {/* Integrated Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name, ID, procedure, or surgeon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto tab-content-container pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading completed surgeries...</span>
            </div>
          ) : filteredSurgeries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="font-medium">
                {completedSurgeries.length === 0 ? 'No Completed Surgeries' : 'No Results Found'}
              </p>
              <p className="text-sm mt-1">
                {completedSurgeries.length === 0 
                  ? 'Completed surgeries will appear here for equipment management.' 
                  : 'Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSurgeries.map((surgery) => (
                <div key={surgery.id} className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isEquipmentFinalized(surgery) ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        {isEquipmentFinalized(surgery) ? (
                          <PackageCheck className="h-6 w-6 text-green-600" />
                        ) : (
                          <Settings className="h-6 w-6 text-yellow-600" />
                        )}
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
                      <Badge className={isEquipmentFinalized(surgery) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {isEquipmentFinalized(surgery) ? 'Equipment Finalized' : 'Pending Finalization'}
                      </Badge>
                      {surgery.surgeryStartTime && surgery.surgeryEndTime && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(surgery.surgeryStartTime, surgery.surgeryEndTime)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <Label className="text-xs text-gray-500">SURGERY DETAILS</Label>
                      <p className="font-medium">{surgery.surgeryTypeDetail?.name || 'Not specified'}</p>
                      <p className="text-sm text-gray-600">{surgery.surgeryPackage || 'Standard Package'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">SURGEON</Label>
                      <p className="font-medium">
                        Dr. {surgery.surgeon?.firstName || 'N/A'} {surgery.surgeon?.lastName || ''}
                      </p>
                      <p className="text-sm text-gray-600">{surgery.surgeon?.staffType || 'Surgeon'}</p>
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
                      <Label className="text-xs text-gray-500">EQUIPMENT STATUS</Label>
                      <p className={`font-medium ${
                        isEquipmentFinalized(surgery) ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {isEquipmentFinalized(surgery) ? 'Finalized' : 'Pending'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {Object.keys(surgery.requiredEquipments || {}).length} Equipment Items
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(surgery)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {!isEquipmentFinalized(surgery) && (
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                        onClick={() => handleFinalizeEquipment(surgery)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Finalize Equipment
                      </Button>
                    )}
                    {isEquipmentFinalized(surgery) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        disabled
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Equipment Finalized
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Surgery Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <span>Surgery Details & Equipment Information</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedSurgery && (
            <div className="space-y-6">
              {/* Patient & Surgery Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Contact</Label>
                      <p>{selectedSurgery.patient?.phone || 'Not provided'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Surgery Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Procedure</Label>
                      <p className="font-medium">{selectedSurgery.surgeryTypeDetail?.name || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Surgeon</Label>
                      <p className="font-medium">
                        Dr. {selectedSurgery.surgeon?.firstName || 'N/A'} {selectedSurgery.surgeon?.lastName || ''}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Duration</Label>
                      <p>{formatDuration(selectedSurgery.surgeryStartTime, selectedSurgery.surgeryEndTime)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Completion</Label>
                      <p>
                        {selectedSurgery.surgeryEndTime 
                          ? new Date(selectedSurgery.surgeryEndTime).toLocaleString()
                          : 'Not recorded'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Equipment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Equipment & Lens Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Required Equipment */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Required Equipment</Label>
                      {selectedSurgery?.requiredEquipments && Object.keys(selectedSurgery.requiredEquipments).length > 0 ? (
                        <div className="space-y-2">
                          {Object.values(selectedSurgery.requiredEquipments).map((equipment, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{equipment.name || 'Equipment'}</p>
                                <p className="text-sm text-gray-600">{equipment.category || 'General'}</p>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800">
                                Qty: {equipment.quantity || 1}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No equipment data available</p>
                      )}
                    </div>

                    {/* Required Lenses */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">Required Lenses</Label>
                      {selectedSurgery?.requiredLenses && Object.keys(selectedSurgery.requiredLenses).length > 0 ? (
                        <div className="space-y-2">
                          {Object.values(selectedSurgery.requiredLenses).map((lens, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{lens.lensName || 'IOL Lens'}</p>
                                <p className="text-sm text-gray-600">{lens.lensType || 'Standard'}</p>
                              </div>
                              <Badge className="bg-green-100 text-green-800">
                                Qty: 1
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No lens data available</p>
                      )}
                    </div>
                  </div>

                  {/* Equipment Finalization Status */}
                  {isEquipmentFinalized(selectedSurgery) && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Equipment Finalized</h4>
                      <p className="text-green-700 text-sm">
                        Equipment stock adjustments have been completed for this surgery.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Finalize Equipment Modal */}
      <Dialog open={showFinalizeModal} onOpenChange={setShowFinalizeModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <span>Finalize Equipment Stock</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedSurgery && (
            <div className="space-y-6">
              {/* Patient Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900">
                  {selectedSurgery.patient?.firstName} {selectedSurgery.patient?.lastName}
                </h3>
                <p className="text-gray-600">
                  {selectedSurgery.surgeryTypeDetail?.name} - {new Date(selectedSurgery.surgeryEndTime || selectedSurgery.updatedAt).toLocaleDateString()}
                </p>
              </div>

              <Tabs defaultValue="unused-equipment" className="flex-1 overflow-hidden">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="unused-equipment">Unused Equipment</TabsTrigger>
                  <TabsTrigger value="extra-equipment">Extra Equipment</TabsTrigger>
                  <TabsTrigger value="lens">Lens Management</TabsTrigger>
                </TabsList>

                <TabsContent value="unused-equipment" className="flex-1 overflow-y-auto max-h-[60vh] space-y-4">
                  <div className="p-2">
                    <Label className="text-sm font-medium text-gray-700 mb-4 block">
                      Select equipment quantities to return to stock
                    </Label>
                    
                    {selectedSurgery?.requiredEquipments && Object.keys(selectedSurgery.requiredEquipments).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.values(selectedSurgery.requiredEquipments).map((equipment, index) => {
                          const equipmentData = masterData.equipment.find(e => e.id === equipment.equipmentId);
                          const maxQuantity = equipment.quantity || 1;
                          const currentSelection = adjustments.unusedEquipment.find(adj => adj.equipmentId === equipment.equipmentId);
                          
                          return (
                            <Card key={index} className="border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-sm">{equipment.name}</p>
                                      <p className="text-xs text-gray-600">{equipment.category}</p>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-800">
                                      Required: {maxQuantity}
                                    </Badge>
                                  </div>
                                  
                                  {equipmentData && (
                                    <div className="text-xs text-gray-600">
                                      <p>Current Stock: <span className="font-medium">{equipmentData.currentStock}</span></p>
                                      <p>Manufacturer: <span className="font-medium">{equipmentData.manufacturer || 'N/A'}</span></p>
                                    </div>
                                  )}
                                  
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium">Return Quantity</Label>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newQuantity = Math.max(0, (currentSelection?.quantity || 0) - 1);
                                          handleAdjustmentChange('unusedEquipment', equipment.equipmentId, newQuantity, equipment.name, {
                                            category: equipment.category,
                                            manufacturer: equipment.manufacturer,
                                            requiredQuantity: equipment.quantity,
                                            currentStock: equipmentData?.currentStock
                                          });
                                        }}
                                        disabled={!currentSelection || currentSelection.quantity <= 0}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <Input
                                        type="number"
                                        min="0"
                                        max={maxQuantity}
                                        value={currentSelection?.quantity || 0}
                                        onChange={(e) => {
                                          const quantity = Math.min(maxQuantity, Math.max(0, parseInt(e.target.value) || 0));
                                          handleAdjustmentChange('unusedEquipment', equipment.equipmentId, quantity, equipment.name);
                                        }}
                                        className="w-16 text-center"
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newQuantity = Math.min(maxQuantity, (currentSelection?.quantity || 0) + 1);
                                          handleAdjustmentChange('unusedEquipment', equipment.equipmentId, newQuantity, equipment.name, {
                                            category: equipment.category,
                                            manufacturer: equipment.manufacturer,
                                            requiredQuantity: equipment.quantity,
                                            currentStock: equipmentData?.currentStock
                                          });
                                        }}
                                        disabled={currentSelection && currentSelection.quantity >= maxQuantity}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Input
                                      placeholder="Reason for return (optional)"
                                      value={currentSelection?.reason || ''}
                                      onChange={(e) => {
                                        const existingAdj = adjustments.unusedEquipment.find(adj => adj.equipmentId === equipment.equipmentId);
                                        if (existingAdj) {
                                          setAdjustments(prev => ({
                                            ...prev,
                                            unusedEquipment: prev.unusedEquipment.map(adj => 
                                              adj.equipmentId === equipment.equipmentId 
                                                ? { ...adj, reason: e.target.value }
                                                : adj
                                            )
                                          }));
                                        }
                                      }}
                                      className="text-xs"
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No required equipment found for this surgery</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="extra-equipment" className="flex-1 overflow-y-auto max-h-[60vh] space-y-4">
                  <div className="p-2">
                    <Label className="text-sm font-medium text-gray-700 mb-4 block">
                      Add extra equipment used during surgery
                    </Label>
                    
                    {/* Equipment Search */}
                    <div className="space-y-4 mb-6">
                      <div className="relative">
                        <Input
                          placeholder="Search equipment... (type at least 2 characters)"
                          value={equipmentSearch}
                          onChange={(e) => setEquipmentSearch(e.target.value)}
                          className="pr-10"
                        />
                        {searching ? (
                          <Loader className="h-4 w-4 text-blue-600 animate-spin absolute right-3 top-1/2 transform -translate-y-1/2" />
                        ) : (
                          <Search className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                        )}
                      </div>

                      {/* Search Results */}
                      {showSearchResults && searchResults.length > 0 && (
                        <Card className="max-h-64 overflow-y-auto border-blue-200">
                          <CardHeader className="py-2 px-3 bg-blue-50">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Search className="h-4 w-4" />
                              Search Results ({searchResults.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            {searchResults.map((equipment) => (
                              <div
                                key={equipment.id}
                                className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-medium text-sm">{equipment.name}</span>
                                      <Badge className={`text-xs ${equipment.currentStock > 5 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        Stock: {equipment.currentStock}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      <p><strong>Category:</strong> {equipment.category}</p>
                                      {equipment.manufacturer && <p><strong>Manufacturer:</strong> {equipment.manufacturer}</p>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <Label className="text-xs">Qty:</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        defaultValue={1}
                                        className="w-16 h-8 text-xs"
                                        id={`qty-${equipment.id}`}
                                      />
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        const qtyInput = document.getElementById(`qty-${equipment.id}`);
                                        const quantity = parseInt(qtyInput.value) || 1;
                                        handleExtraEquipmentAdd(equipment, quantity);
                                      }}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Selected Extra Equipment */}
                    {adjustments.extraEquipment.length > 0 && (
                      <div className="space-y-4">
                        <Label className="text-sm font-medium text-gray-700">Selected Extra Equipment</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {adjustments.extraEquipment.map((item, index) => (
                            <Card key={index} className="border-l-4 border-l-orange-500">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-sm">{item.name}</p>
                                      <p className="text-xs text-gray-600">{item.category}</p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRemoveExtraEquipment(index)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium">Quantity Used</Label>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newQuantity = Math.max(1, item.quantity - 1);
                                          handleExtraEquipmentQuantityChange(index, newQuantity);
                                        }}
                                        disabled={item.quantity <= 1}
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => {
                                          const quantity = Math.max(1, parseInt(e.target.value) || 1);
                                          handleExtraEquipmentQuantityChange(index, quantity);
                                        }}
                                        className="w-16 text-center"
                                      />
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newQuantity = item.quantity + 1;
                                          handleExtraEquipmentQuantityChange(index, newQuantity);
                                        }}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <Input
                                      placeholder="Reason for extra use (optional)"
                                      value={item.reason || ''}
                                      onChange={(e) => handleExtraEquipmentReasonChange(index, e.target.value)}
                                      className="text-xs"
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="lens" className="flex-1 overflow-y-auto max-h-[60vh] space-y-4">
                  <div className="p-2">
                    <Label className="text-sm font-medium text-gray-700 mb-4 block">
                      Mark unused lenses to return to stock (Default: All lenses are used)
                    </Label>

                    {selectedSurgery?.requiredLenses && Object.keys(selectedSurgery.requiredLenses).length > 0 ? (
                      <div className="space-y-3">
                        {Object.values(selectedSurgery.requiredLenses).map((lensData, index) => {
                          const isUnused = adjustments.unusedLenses.some(adj => adj.lensId === lensData.lensId);
                          
                          return (
                            <Card key={lensData.lensId} className={`border-l-4 ${isUnused ? 'border-l-red-500 bg-red-50' : 'border-l-green-500 bg-green-50'}`}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <Checkbox
                                      id={`lens-${lensData.lensId}`}
                                      checked={!isUnused} // Default checked = lens is used, unchecked = lens is unused
                                      onCheckedChange={(checked) => {
                                        if (!checked) {
                                          // Unchecked means lens is unused - add to unusedLenses
                                          handleAdjustmentChange('unusedLenses', lensData.lensId, 1, lensData.lensName, {
                                            lensCode: lensData.lensCode,
                                            lensType: lensData.lensType,
                                            lensCategory: lensData.lensCategory,
                                            patientCost: lensData.patientCost
                                          });
                                        } else {
                                          // Checked means lens is used - remove from unusedLenses
                                          handleAdjustmentChange('unusedLenses', lensData.lensId, 0, lensData.lensName);
                                        }
                                      }}
                                    />
                                    <div>
                                      <Label 
                                        htmlFor={`lens-${lensData.lensId}`} 
                                        className="font-medium text-sm cursor-pointer"
                                      >
                                        {lensData.lensName}
                                      </Label>
                                      <div className="text-xs text-gray-600 space-y-1">
                                        <p><strong>Code:</strong> {lensData.lensCode}</p>
                                        <p><strong>Type:</strong> {lensData.lensType}</p>
                                        <p><strong>Category:</strong> {lensData.lensCategory}</p>
                                        <p><strong>Cost:</strong> ₹{lensData.patientCost?.toLocaleString()}</p>
                                        {lensData.notes && <p><strong>Notes:</strong> {lensData.notes}</p>}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    {isUnused ? (
                                      <Badge variant="destructive" className="text-xs">
                                        Will Return to Stock
                                      </Badge>
                                    ) : (
                                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                        Used in Surgery
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {isUnused && (
                                  <div className="mt-3 pt-3 border-t">
                                    <Label className="text-xs font-medium">Reason for Return (optional)</Label>
                                    <Input
                                      placeholder="e.g., Surgery cancelled, wrong power, damaged lens..."
                                      value={adjustments.unusedLenses.find(adj => adj.lensId === lensData.lensId)?.reason || ''}
                                      onChange={(e) => {
                                        setAdjustments(prev => ({
                                          ...prev,
                                          unusedLenses: prev.unusedLenses.map(adj => 
                                            adj.lensId === lensData.lensId 
                                              ? { ...adj, reason: e.target.value }
                                              : adj
                                          )
                                        }));
                                      }}
                                      className="text-xs mt-1"
                                    />
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}

                        {adjustments.unusedLenses.length > 0 && (
                          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <Label className="font-medium text-red-800">
                                Warning: {adjustments.unusedLenses.length} lens(es) marked as unused
                              </Label>
                            </div>
                            <div className="text-xs text-red-700">
                              These lenses will be returned to stock and removed from the surgery record.
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-sm">No lenses were required for this surgery</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Additional Notes */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Additional Notes</Label>
                <Textarea
                  placeholder="Add any additional notes about the stock adjustments..."
                  value={stockAdjustments.notes}
                  onChange={(e) => setStockAdjustments(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinalizeModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleFinalizeAdjustments}
              disabled={finalizingStock}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {finalizingStock ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Finalize Stock
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompletedSurgeries;