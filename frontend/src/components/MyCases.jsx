import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Syringe, Loader, AlertCircle, CheckCircle, User, Calendar, Clock, MapPin, Stethoscope, Eye, RefreshCw, Search, Plus } from 'lucide-react';
import { surgeryService } from '@/services/surgeryService';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const MyCases = () => {
  const [surgeryPatients, setSurgeryPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [givingAnesthesia, setGivingAnesthesia] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anesthesiaFilter, setAnesthesiaFilter] = useState('all');

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

  useEffect(() => {
    fetchReadyForSurgeryPatients();
  }, []);

  const fetchReadyForSurgeryPatients = async () => {
    try {
      setLoading(true);
      // Fetch patients with both READY_FOR_SURGERY and SURGERY_STARTED statuses
      const [readyResponse, startedResponse] = await Promise.all([
        surgeryService.getReadyForSurgeryPatients(),
        surgeryService.getSurgeryStartedPatients()
      ]);

      const allPatients = [
        ...(readyResponse.data || []),
        ...(startedResponse.data || [])
      ];

      // Filter only patients who require anesthesia
      const patientsRequiringAnesthesia = allPatients.filter(patient => patient.requiresAnesthesia);

      setSurgeryPatients(patientsRequiringAnesthesia);
    } catch (error) {
      toast.error('Failed to fetch surgery patients');
      setSurgeryPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGiveAnesthesia = (patient) => {
    setSelectedPatient(patient);
    setShowConfirmDialog(true);
  };

  const confirmGiveAnesthesia = async () => {
    if (!selectedPatient) return;

    try {
      setGivingAnesthesia(true);
      const response = await surgeryService.giveAnesthesia(selectedPatient.id);

      if (response.success) {
        toast.success('Anesthesia administered successfully');
        setShowConfirmDialog(false);
        setSelectedPatient(null);
        // Refresh the patient list
        fetchReadyForSurgeryPatients();
      } else {
        toast.error(response.message || 'Failed to administer anesthesia');
      }
    } catch (error) {
      toast.error('Failed to administer anesthesia');
    } finally {
      setGivingAnesthesia(false);
    }
  };

  const getAnesthesiaStatusBadge = (patient) => {
    if (!patient.requiresAnesthesia) {
      return null;
    }

    if (patient.anesthesiaGiven) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Anesthesia Given
        </Badge>
      );
    }

    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <AlertCircle className="h-3 w-3 mr-1" />
        Anesthesia Pending
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'READY_FOR_SURGERY': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Ready for Surgery' },
      'SURGERY_STARTED': { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Surgery Started' },
      'SURGERY_COMPLETED': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status };

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // Filter patients based on search, status, and anesthesia status
  const getFilteredPatients = () => {
    let filtered = surgeryPatients;

    // Apply search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
        `${patient.patient?.firstName} ${patient.patient?.lastName}`.toLowerCase().includes(query) ||
        patient.patient?.patientNumber?.toLowerCase().includes(query) ||
        patient.surgeryTypeDetail?.name?.toLowerCase().includes(query) ||
        `${patient.surgeon?.firstName} ${patient.surgeon?.lastName}`.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Apply anesthesia filter
    if (anesthesiaFilter !== 'all') {
      if (anesthesiaFilter === 'given') {
        filtered = filtered.filter(p => p.anesthesiaGiven);
      } else if (anesthesiaFilter === 'pending') {
        filtered = filtered.filter(p => !p.anesthesiaGiven);
      }
    }

    return filtered;
  };

  const filteredPatients = getFilteredPatients();
  const totalCases = surgeryPatients.length;
  const anesthesiaGivenCount = surgeryPatients.filter(p => p.anesthesiaGiven).length;
  const anesthesiaPendingCount = surgeryPatients.filter(p => !p.anesthesiaGiven).length;
  const readyForSurgeryCount = surgeryPatients.filter(p => p.status === 'READY_FOR_SURGERY').length;
  const surgeryStartedCount = surgeryPatients.filter(p => p.status === 'SURGERY_STARTED').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* My Anesthesia Cases Card with Integrated Filters */}
      <Card className="flex flex-col flex-1 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="flex items-center">
              <Syringe className="h-5 w-5 mr-2 text-purple-600" />
              My Anesthesia Cases
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                {totalCases} Total
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                {anesthesiaGivenCount} Given
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                {anesthesiaPendingCount} Pending
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {readyForSurgeryCount} Ready
              </Badge>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
                {surgeryStartedCount} Started
              </Badge>
              <Badge variant="outline">
                {filteredPatients.length} Result{filteredPatients.length !== 1 ? 's' : ''}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReadyForSurgeryPatients}
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
                  placeholder="Search by patient name, number, surgery, or surgeon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="READY_FOR_SURGERY">Ready for Surgery</SelectItem>
                <SelectItem value="SURGERY_STARTED">Surgery Started</SelectItem>
                <SelectItem value="SURGERY_COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={anesthesiaFilter} onValueChange={setAnesthesiaFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue placeholder="Filter by anesthesia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                <SelectItem value="given">Anesthesia Given</SelectItem>
                <SelectItem value="pending">Anesthesia Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto tab-content-container">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Syringe className="h-16 w-16 text-gray-300 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">
                {surgeryPatients.length === 0 ? 'No Cases Requiring Anesthesia' : 'No Results Found'}
              </h3>
              <p className="text-gray-400 text-sm">
                {surgeryPatients.length === 0 
                  ? 'All patients requiring anesthesia have been attended to' 
                  : 'Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">{filteredPatients.map((patient) => (
                <div 
                  key={patient.id} 
                  className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Patient Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {patient.patient?.firstName} {patient.patient?.lastName}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          Patient #: {patient.patient?.patientNumber || 'N/A'}
                        </Badge>
                        {getAnesthesiaStatusBadge(patient)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {calculateAge(patient.patient?.dateOfBirth)}Y, {patient.patient?.gender || 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(patient.surgeryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(patient.status)}
                    </div>
                  </div>

                  {/* Surgery Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Surgery Type</p>
                      <p className="font-semibold text-gray-900">{patient.surgeryTypeDetail?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Surgeon</p>
                      <p className="font-semibold text-gray-900 flex items-center">
                        <Stethoscope className="h-3 w-3 mr-1" />
                        {patient.surgeon ? `Dr. ${patient.surgeon.firstName} ${patient.surgeon.lastName}` : 'Not Assigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">OT Room</p>
                      <p className="font-semibold text-gray-900 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {patient.otRoom?.roomName || patient.otRoom?.roomNumber || 'Not Assigned'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    
                    {!patient.anesthesiaGiven && (
                      <Button 
                        size="sm"
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleGiveAnesthesia(patient)}
                      >
                        <Syringe className="h-4 w-4 mr-2" />
                        Give Anesthesia
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-purple-600" />
              Confirm Anesthesia Administration
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to mark anesthesia as given for:
            </p>
            {selectedPatient && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">
                  {selectedPatient.patient?.firstName} {selectedPatient.patient?.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  Surgery: {selectedPatient.surgeryTypeDetail?.name}
                </p>
                <p className="text-sm text-gray-600">
                  Patient #: {selectedPatient.patient?.patientNumber || 'N/A'}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                This action will update the patient's anesthesia status and notify the surgical team.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConfirmDialog(false);
                setSelectedPatient(null);
              }}
              disabled={givingAnesthesia}
            >
              Cancel
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={confirmGiveAnesthesia}
              disabled={givingAnesthesia}
            >
              {givingAnesthesia ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyCases;
