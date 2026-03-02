import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Thermometer,
  Droplets,
  Gauge,
  AlertCircle,
  CheckCircle,
  Wrench,
  Activity,
  Clock,
  User,
  Stethoscope,
  UserCheck,
  Timer,
  Play,
  Syringe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { otAdminService } from '@/services/otAdminService';
import surgeryTypeService from '@/services/surgeryTypeService';
import ElapsedTimer from '@/components/ElapsedTimer';

const OTRoomsManagement = () => {
  const [otRooms, setOtRooms] = useState([]);
  const [surgeryTypes, setSurgeryTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [expandedCompletedRooms, setExpandedCompletedRooms] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Real-time auto-refresh for today's surgeries (every 30 seconds)
  const { data: todaysSurgeries = [] } = useQuery({
    queryKey: ['todaysSurgeries'],
    queryFn: async () => {
      const response = await otAdminService.getTodaysSurgeries();
      return response.success ? (response.data || []) : [];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const [formData, setFormData] = useState({
    roomNumber: '',
    roomName: '',
    capacity: '',
    status: 'available',
    dailyRate: '',
    hourlyRate: '',
    surgeryTypeIds: [],
  });

  useEffect(() => {
    fetchOTRooms();
    fetchSurgeryTypes();
  }, []);

  const fetchOTRooms = async () => {
    setLoading(true);
    try {
      const response = await otAdminService.getAllOTRooms();
      if (response.success) {
        setOtRooms(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch OT rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchSurgeryTypes = async () => {
    try {
      const response = await surgeryTypeService.getSurgeryTypes();
      if (response.success) {
        setSurgeryTypes(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch surgery types');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingRoom) {
        await otAdminService.updateOTRoom(editingRoom.id, formData);
        toast.success('OT Room updated successfully');
      } else {
        await otAdminService.createOTRoom(formData);
        toast.success('OT Room created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchOTRooms();
    } catch (error) {
      toast.error(error.message || 'Failed to save OT room');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber || '',
      roomName: room.roomName || '',
      capacity: room.capacity || '',
      status: room.status || 'available',
      dailyRate: room.dailyRate || '',
      hourlyRate: room.hourlyRate || '',
      surgeryTypeIds: room.surgeryTypeIds || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!roomToDelete) return;

    setLoading(true);
    try {
      await otAdminService.deleteOTRoom(roomToDelete.id);
      toast.success('OT Room deleted successfully');
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
      fetchOTRooms();
    } catch (error) {
      toast.error(error.message || 'Failed to delete OT room');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      roomName: '',
      capacity: '',
      status: 'available',
      dailyRate: '',
      hourlyRate: '',
      surgeryTypeIds: [],
    });
    setEditingRoom(null);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoomSurgeryCount = (room) => {
    return todaysSurgeries.filter(
      (surgery) => surgery.otRoom === room.roomNumber || surgery.otRoomId === room.id
    ).length;
  };

  const getOngoingSurgery = (room) => {
    return todaysSurgeries.find(
      (surgery) => 
        (surgery.otRoom === room.roomNumber || surgery.otRoomId === room.id) &&
        surgery.status === 'SURGERY_STARTED'
    );
  };

  const getNextUpcomingSurgery = (room) => {
    const upcomingSurgeries = todaysSurgeries.filter(
      (surgery) => 
        (surgery.otRoom === room.roomNumber || surgery.otRoomId === room.id) &&
        (surgery.status === 'SURGERY_SCHEDULED' || surgery.status === 'READY_FOR_SURGERY' || surgery.status === 'PRE_OP_ASSESSMENT')
    );
    
    // Sort by surgery date/time and return the first one
    return upcomingSurgeries.sort((a, b) => {
      const dateA = new Date(a.surgeryDate);
      const dateB = new Date(b.surgeryDate);
      return dateA - dateB;
    })[0];
  };

  const getCompletedSurgeries = (room) => {
    const completed = todaysSurgeries.filter(
      (surgery) => {
        const matchesRoom = surgery.otRoom === room.roomNumber || surgery.otRoomId === room.id;
        const isCompleted = surgery.surgeryCompleted === true;
        return matchesRoom && isCompleted;
      }
    ).sort((a, b) => {
      const dateA = new Date(a.surgeryEndTime || a.surgeryCompletedAt || a.updatedAt);
      const dateB = new Date(b.surgeryEndTime || b.surgeryCompletedAt || b.updatedAt);
      return dateB - dateA; // Most recent first
    });
    return completed;
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const toggleCompletedSurgeries = (roomId) => {
    setExpandedCompletedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  const getRoomStatus = (room) => {
    // First check the room's actual status from database
    // If it's maintenance or preparing, use that status (handle both uppercase and lowercase)
    const roomStatus = room.status?.toLowerCase();
    if (roomStatus === 'maintenance' || roomStatus === 'preparing') {
      return roomStatus;
    }
    
    // Then check if there's an ongoing surgery
    const ongoingSurgery = getOngoingSurgery(room);
    if (ongoingSurgery) {
      return 'occupied';
    }
    
    // If no ongoing surgery and room status is available, return available
    return roomStatus || 'available';
  };

  // Helper function to format time
  const formatTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'emergency':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Helper function to format surgery data
  const formatSurgeryData = (admission) => {
    if (!admission) return null;
    
    return {
      id: admission.id,
      patientName: `${admission.patient?.firstName || ''} ${admission.patient?.lastName || ''}`.trim() || 'N/A',
      patientNumber: admission.patient?.patientNumber || 'N/A',
      age: admission.patient?.age || 'N/A',
      gender: admission.patient?.gender || 'N/A',
      surgery: admission.surgeryTypeDetail?.name || 'Surgery',
      surgeon: admission.surgeon ? `Dr. ${admission.surgeon.firstName} ${admission.surgeon.lastName}` : 'Not assigned',
      otRoom: admission.otRoom?.roomNumber || admission.otRoom || 'Not assigned',
      status: admission.status || 'SCHEDULED',
      priority: admission.priorityLevel || 'MEDIUM',
    };
  };

  // Filter rooms based on search and status
  const getFilteredRooms = () => {
    let filtered = otRooms;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(room =>
        room.roomName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(room => {
        const dynamicStatus = getRoomStatus(room);
        return dynamicStatus === statusFilter;
      });
    }

    return filtered;
  };

  const filteredRooms = getFilteredRooms();
  const totalRooms = otRooms.length;
  const availableRooms = otRooms.filter(room => getRoomStatus(room) === 'available').length;
  const occupiedRooms = otRooms.filter(room => getRoomStatus(room) === 'occupied').length;
  const maintenanceRooms = otRooms.filter(room => getRoomStatus(room) === 'maintenance').length;

  return (
    <div className="h-full flex flex-col">
      {/* OT Rooms Management Card with Integrated Filters */}
      <Card className="flex flex-col flex-1 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <CardTitle>OT Rooms Management</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {totalRooms} Total
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                {availableRooms} Available
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                {occupiedRooms} Occupied
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                {maintenanceRooms} Maintenance
              </Badge>
              <Badge variant="outline">
                {filteredRooms.length} Result{filteredRooms.length !== 1 ? 's' : ''}
              </Badge>
              <Button
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Room
              </Button>
            </div>
          </div>
          
          {/* Integrated Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by room name or number..."
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
                <SelectItem value="all">All Rooms</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto tab-content-container pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Activity className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading OT rooms...</span>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="font-medium">
                {otRooms.length === 0 ? 'No OT Rooms' : 'No Results Found'}
              </p>
              <p className="text-sm mt-1">
                {otRooms.length === 0 
                  ? 'Click "Add Room" to create your first OT room.' 
                  : 'Try adjusting your search criteria.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredRooms.map((room) => {
          const surgeryCount = getRoomSurgeryCount(room);
          const dynamicStatus = getRoomStatus(room);
          const ongoingSurgery = getOngoingSurgery(room);
          const nextSurgery = getNextUpcomingSurgery(room);
          const completedSurgeries = getCompletedSurgeries(room);
          const scheduledCount = surgeryCount - completedSurgeries.length;
          
          return (
          <Card key={room.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span>{room.roomName || room.roomNumber}</span>
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{room.roomNumber}</p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <Badge className={`${getStatusColor(dynamicStatus)} border`}>
                    {dynamicStatus}
                  </Badge>
                  {surgeryCount > 0 && (
                    <div className="flex flex-col items-end gap-1">
                      {scheduledCount > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {scheduledCount} scheduled
                        </Badge>
                      )}
                      {completedSurgeries.length > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {completedSurgeries.length} completed
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Room Details - Capacity and Rates */}
                <div className="space-y-2 text-sm border-b pb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{room.capacity} persons</span>
                  </div>
                  {room.dailyRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily Rate:</span>
                      <span className="font-medium">₹{room.dailyRate}</span>
                    </div>
                  )}
                  {room.hourlyRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hourly Rate:</span>
                      <span className="font-medium">₹{room.hourlyRate}</span>
                    </div>
                  )}
                </div>

                {/* Latest Environmental Data */}
                {room.latestEnvironmentalData && (
                  <div className="grid grid-cols-3 gap-3 p-2 bg-gray-50 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-xs text-gray-500">Temp</p>
                        <p className="text-sm font-semibold">{room.latestEnvironmentalData.temperature}°C</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">Humidity</p>
                        <p className="text-sm font-semibold">{room.latestEnvironmentalData.humidity}%</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Gauge className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-xs text-gray-500">Pressure</p>
                        <p className="text-sm font-semibold">{room.latestEnvironmentalData.pressure}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Indicator */}
                <div className="flex items-center gap-2 text-xs text-gray-600 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="font-medium">Live Status</span>
                  </div>
                </div>

                {/* Ongoing Surgery */}
                {ongoingSurgery && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">Ongoing Surgery</span>
                      </div>
                      <Badge className="bg-green-600 text-white border-0 text-xs font-semibold">
                        In Progress
                      </Badge>
                    </div>
                    
                    {/* Patient Info */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">
                          {ongoingSurgery.patient?.firstName} {ongoingSurgery.patient?.lastName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {ongoingSurgery.patient?.patientNumber}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        {ongoingSurgery.patient?.age}Y, {ongoingSurgery.patient?.gender}
                      </p>
                    </div>

                    {/* Surgery Details */}
                    <div className="mb-3 p-2 bg-white rounded border border-green-200">
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {ongoingSurgery.surgeryTypeDetail?.name || 'Surgery'}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <span className="flex items-center">
                          <Stethoscope className="h-3 w-3 mr-1" />
                          {ongoingSurgery.surgeon ? `Dr. ${ongoingSurgery.surgeon.firstName} ${ongoingSurgery.surgeon.lastName}` : 'Not assigned'}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {ongoingSurgery.surgeryTimeSlot || 'Time not set'}
                        </span>
                      </div>
                    </div>

                    {/* Real-time Status Timeline */}
                    <div className="space-y-2 mb-3">
                      {/* Pre-Op Status */}
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-xs text-green-700 font-medium">
                          Pre-Op Preparation Complete
                        </span>
                        {ongoingSurgery.preOpCompletedAt && (
                          <span className="text-xs text-gray-400 ml-auto">
                            {formatTime(ongoingSurgery.preOpCompletedAt)}
                          </span>
                        )}
                      </div>

                      {/* Patient in OT - Shows when anesthesia is given */}
                      {ongoingSurgery.anesthesiaGiven && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-xs text-green-700 font-medium">
                            Patient Present in OT
                          </span>
                        </div>
                      )}

                      {/* Anesthesia Status */}
                      {ongoingSurgery.requiresAnesthesia && (
                        <div className="flex items-center gap-2">
                          {ongoingSurgery.anesthesiaGiven ? (
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          ) : (
                            <Timer className="h-4 w-4 text-orange-500 flex-shrink-0 animate-pulse" />
                          )}
                          <span className={`text-xs ${ongoingSurgery.anesthesiaGiven ? 'text-green-700 font-medium' : 'text-orange-600 font-medium'}`}>
                            Anesthesia {ongoingSurgery.anesthesiaGiven ? 'Applied' : 'Pending'}
                          </span>
                        </div>
                      )}

                      {/* Surgery In Progress */}
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-600 flex-shrink-0 animate-pulse" />
                        <span className="text-xs text-green-700 font-medium">
                          Surgery In Progress
                        </span>
                        {ongoingSurgery.surgeryStartTime && (
                          <span className="text-xs text-gray-400 ml-auto">
                            Started: {formatTime(ongoingSurgery.surgeryStartTime)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Elapsed Time */}
                    {ongoingSurgery.surgeryStartTime && (
                      <div className="flex items-center justify-between pt-2 border-t border-green-200">
                        <span className="text-xs text-gray-600">Time Elapsed:</span>
                        <ElapsedTimer 
                          startTime={ongoingSurgery.surgeryStartTime} 
                          surgeryId={ongoingSurgery.id} 
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Next Upcoming Surgery */}
                {nextSurgery && (
                  <div className={`p-4 border-l-4 rounded-lg shadow-sm ${
                    nextSurgery.status === 'READY_FOR_SURGERY'
                      ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-500'
                      : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${
                          nextSurgery.status === 'READY_FOR_SURGERY' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                        <span className={`text-xs font-semibold uppercase tracking-wide ${
                          nextSurgery.status === 'READY_FOR_SURGERY' ? 'text-green-800' : 'text-blue-800'
                        }`}>Next Scheduled</span>
                      </div>
                      <Badge className={`text-white border-0 text-xs font-semibold ${
                        nextSurgery.status === 'READY_FOR_SURGERY' ? 'bg-green-600' : 'bg-blue-600'
                      }`}>
                        {nextSurgery.status === 'READY_FOR_SURGERY' ? 'Ready' : 'Upcoming'}
                      </Badge>
                    </div>
                    
                    {/* Patient Info */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900">
                          {nextSurgery.patient?.firstName} {nextSurgery.patient?.lastName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {nextSurgery.patient?.patientNumber}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        {nextSurgery.patient?.age}Y, {nextSurgery.patient?.gender}
                      </p>
                    </div>

                    {/* Surgery Details */}
                    <div className={`mb-3 p-2 bg-white rounded border ${
                      nextSurgery.status === 'READY_FOR_SURGERY' ? 'border-green-200' : 'border-blue-200'
                    }`}>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {nextSurgery.surgeryTypeDetail?.name || 'Surgery'}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <span className="flex items-center">
                          <Stethoscope className="h-3 w-3 mr-1" />
                          {nextSurgery.surgeon ? `Dr. ${nextSurgery.surgeon.firstName} ${nextSurgery.surgeon.lastName}` : 'Not assigned'}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-blue-600" />
                          <span className="font-semibold text-blue-700">
                            {nextSurgery.surgeryTimeSlot || 'Time not set'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Status Checklist */}
                    <div className="space-y-2">
                      {/* Pre-Op Status */}
                      <div className="flex items-center gap-2">
                        {(nextSurgery.preOpCompleted || nextSurgery.status === 'READY_FOR_SURGERY') ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        )}
                        <span className={`text-xs ${(nextSurgery.preOpCompleted || nextSurgery.status === 'READY_FOR_SURGERY') ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                          Pre-Op Preparation {(nextSurgery.preOpCompleted || nextSurgery.status === 'READY_FOR_SURGERY') ? 'Complete' : 'Pending'}
                        </span>
                      </div>

                      {/* Patient Present in OT - Shows when anesthesia is given */}
                      {nextSurgery.anesthesiaGiven && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-xs text-green-700 font-medium">
                            Patient Present in OT
                          </span>
                        </div>
                      )}

                      {/* Ready Status */}
                      {nextSurgery.status === 'READY_FOR_SURGERY' && (
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-xs text-green-700 font-medium">
                            Patient Ready for Surgery
                          </span>
                        </div>
                      )}

                      {/* Anesthesia Required */}
                      {nextSurgery.requiresAnesthesia && (
                        <div className="flex items-center gap-2">
                          <Syringe className={`h-4 w-4 flex-shrink-0 ${nextSurgery.anesthesiaGiven ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className="text-xs text-gray-600">
                            Anesthesia Required
                            {nextSurgery.anesthesiaGiven && <span className="text-green-600 font-medium ml-1">(Given)</span>}
                          </span>
                        </div>
                      )}

                      {/* Expected Duration */}
                      {nextSurgery.expectedDuration && (
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-600">
                            Expected Duration: {nextSurgery.expectedDuration} min
                          </span>
                        </div>
                      )}

                      {/* Priority Level */}
                      {nextSurgery.priorityLevel && (
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(nextSurgery.priorityLevel)}
                          <span className="text-xs text-gray-600">
                            Priority: {nextSurgery.priorityLevel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* No Surgery Message */}
                {!ongoingSurgery && !nextSurgery && surgeryCount === 0 && (
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <p className="text-xs text-gray-500">No surgeries scheduled today</p>
                  </div>
                )}

                {/* Completed Surgeries - Collapsible */}
                {(() => {
                  const completedSurgeries = getCompletedSurgeries(room);
                  if (completedSurgeries.length > 0) {
                    return (
                      <div className="border-t pt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCompletedSurgeries(room.id)}
                          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-semibold text-gray-700">
                              Completed Surgeries Today ({completedSurgeries.length})
                            </span>
                          </div>
                          {expandedCompletedRooms[room.id] ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                        
                        {expandedCompletedRooms[room.id] && (
                          <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                            {completedSurgeries.map((surgery) => (
                              <div
                                key={surgery.id}
                                className="p-3 bg-green-50 border border-green-200 rounded-lg"
                              >
                                {/* Patient Info */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3 text-green-700" />
                                    <span className="text-sm font-semibold text-gray-900">
                                      {surgery.patient?.firstName} {surgery.patient?.lastName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {surgery.remainingEquipments && Object.keys(surgery.remainingEquipments).length > 0 ? (
                                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Equipment Finalized
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Equipment Pending
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                                      Completed
                                    </Badge>
                                  </div>
                                </div>

                                {/* Surgery Type */}
                                <p className="text-xs text-gray-700 mb-2 font-medium">
                                  {surgery.surgeryTypeDetail?.name || 'Surgery'}
                                </p>

                                {/* Surgeon */}
                                {surgery.surgeon && (
                                  <div className="flex items-center gap-1 mb-2">
                                    <Stethoscope className="h-3 w-3 text-gray-500" />
                                    <span className="text-xs text-gray-600">
                                      Dr. {surgery.surgeon.firstName} {surgery.surgeon.lastName}
                                    </span>
                                  </div>
                                )}

                                {/* Time Details */}
                                <div className="space-y-1 text-xs bg-white p-2 rounded border border-green-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Start Time:</span>
                                    <span className="font-medium text-gray-900">
                                      {formatTime(surgery.surgeryStartTime)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">End Time:</span>
                                    <span className="font-medium text-gray-900">
                                      {formatTime(surgery.surgeryEndTime)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between pt-1 border-t border-green-200">
                                    <span className="text-gray-600 flex items-center gap-1">
                                      <Timer className="h-3 w-3" />
                                      Duration:
                                    </span>
                                    <span className="font-semibold text-green-700">
                                      {calculateDuration(surgery.surgeryStartTime, surgery.surgeryEndTime)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Equipment Installed */}
                {room.equipment && room.equipment.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                      <Wrench className="h-3 w-3" />
                      Equipment Installed ({room.equipment.length})
                    </p>
                    <div className="space-y-2">
                      {room.equipment.map((equip) => (
                        <div key={equip.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900">{equip.equipmentName}</p>
                            {equip.model && (
                              <p className="text-xs text-gray-500">{equip.model}</p>
                            )}
                          </div>
                          <Badge className={`text-xs ${
                            equip.status === 'OPERATIONAL' ? 'bg-green-100 text-green-800 border-green-200' :
                            equip.status === 'IN_USE' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            equip.status === 'MAINTENANCE_REQUIRED' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            equip.status === 'UNDER_MAINTENANCE' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                            equip.status === 'OUT_OF_SERVICE' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-purple-100 text-purple-800 border-purple-200'
                          } border`}>
                            {equip.status === 'OPERATIONAL' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {equip.status === 'IN_USE' && <Activity className="h-3 w-3 mr-1" />}
                            {(equip.status === 'MAINTENANCE_REQUIRED' || equip.status === 'UNDER_MAINTENANCE') && <Wrench className="h-3 w-3 mr-1" />}
                            {(equip.status === 'OUT_OF_SERVICE' || equip.status === 'CALIBRATION_DUE') && <AlertCircle className="h-3 w-3 mr-1" />}
                            <span className="capitalize">{equip.status.replace(/_/g, ' ')}</span>
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Surgery Types */}
                {room.surgeryTypes && room.surgeryTypes.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 mb-2">Assigned Surgery Types:</p>
                    <div className="flex flex-wrap gap-1">
                      {room.surgeryTypes.map((type) => (
                        <Badge key={type.id} variant="outline" className="text-xs">
                          {type.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(room)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRoomToDelete(room);
                      setDeleteDialogOpen(true);
                    }}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
              );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? 'Edit OT Room' : 'Add New OT Room'}
            </DialogTitle>
            <DialogDescription>
              {editingRoom
                ? 'Update the OT room details below'
                : 'Fill in the details to create a new OT room'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roomNumber">Room Number *</Label>
                <Input
                  id="roomNumber"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="OT-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="roomName">Room Name *</Label>
                <Input
                  id="roomName"
                  value={formData.roomName}
                  onChange={(e) => setFormData({ ...formData, roomName: e.target.value })}
                  placeholder="Operation Theatre 1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="10"
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dailyRate">Daily Rate (₹)</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  value={formData.dailyRate}
                  onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                  placeholder="15000"
                />
              </div>

              <div>
                <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  placeholder="2500"
                />
              </div>
            </div>

            <div>
              <Label>Surgery Types (Multiple Selection)</Label>
              <p className="text-xs text-gray-500 mb-2">
                Select all surgery types that can be performed in this OT
              </p>
              {/* TODO: Implement multi-select for surgery types */}
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                {surgeryTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`surgery-${type.id}`}
                      checked={formData.surgeryTypeIds.includes(type.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            surgeryTypeIds: [...formData.surgeryTypeIds, type.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            surgeryTypeIds: formData.surgeryTypeIds.filter((id) => id !== type.id),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={`surgery-${type.id}`} className="text-sm cursor-pointer">
                      {type.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? 'Saving...' : editingRoom ? 'Update Room' : 'Create Room'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete OT Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {roomToDelete?.roomName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OTRoomsManagement;