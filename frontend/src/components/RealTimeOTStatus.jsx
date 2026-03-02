import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Stethoscope,
  MapPin,
  Clock,
  Eye,
  User,
  Activity,
  DollarSign,
  Siren,
  AlertCircle,
  Bell,
  Zap,
  Plus,
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  Syringe,
  Thermometer,
  CheckCircle,
  Wrench,
  Settings,
  UserCheck,
  ClipboardCheck,
  Play,
  Timer
} from 'lucide-react';
import Loader from '@/components/loader/Loader';
import ElapsedTimer from '@/components/ElapsedTimer';

const RealTimeOTStatus = ({
  todaysSurgeries = [],
  otRooms = [],
  surgeriesLoading = false,
  todayStats = {},
  formatSurgeryData,
  getStatusBadge,
  getPriorityIcon,
  getStatusIcon,
  formatCurrency
}) => {

  // Helper function to get the latest temperature reading based on current time
  const getLatestTemperature = (tempRegister) => {
    if (!tempRegister || tempRegister.length === 0) return null;

    // Get today's temperature register
    const today = new Date().toISOString().split('T')[0];
    const todayRegister = tempRegister.find(reg => {
      const regDate = new Date(reg.date).toISOString().split('T')[0];
      return regDate === today;
    });

    if (!todayRegister) return null;

    // Get current hour
    const currentHour = new Date().getHours();

    // Return the latest available temperature based on time
    if (currentHour >= 18 && todayRegister.temperature6Pm) {
      return { temp: todayRegister.temperature6Pm, time: '6 PM', humidity: todayRegister.humidity6Pm };
    } else if (currentHour >= 15 && todayRegister.temperature3Pm) {
      return { temp: todayRegister.temperature3Pm, time: '3 PM', humidity: todayRegister.humidity3Pm };
    } else if (currentHour >= 12 && todayRegister.temperature12Pm) {
      return { temp: todayRegister.temperature12Pm, time: '12 PM', humidity: todayRegister.humidity12Pm };
    } else if (todayRegister.temperature9Am) {
      return { temp: todayRegister.temperature9Am, time: '9 AM', humidity: todayRegister.humidity9Am };
    }

    return null;
  };

  // Helper function to get status color for surgery status
  const getSurgeryStatusColor = (status) => {
    switch (status) {
      case 'SURGERY_STARTED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'SURGERY_SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'READY_FOR_SURGERY':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'PRE_OP_ASSESSMENT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'SURGERY_COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'SURGERY_CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Helper function to get OT room status color
  const getOTRoomStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'occupied':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Helper function to get OT room status icon
  const getOTRoomStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return <CheckCircle className="h-3 w-3" />;
      case 'occupied':
        return <Activity className="h-3 w-3" />;
      case 'maintenance':
        return <Wrench className="h-3 w-3" />;
      case 'preparing':
        return <Settings className="h-3 w-3" />;
      default:
        return <MapPin className="h-3 w-3" />;
    }
  };

  // Format time from database
  const formatTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Real-time Surgery Schedule */}
        <div className='h-full tab-content-container pr-1'>
          <Card className="h-full flex flex-col pr-2 pb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                <span>Today's Surgery Schedule</span>
              </CardTitle>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                View All
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {surgeriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader color="#3B82F6" />
                </div>
              ) : todaysSurgeries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Stethoscope className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No surgeries scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysSurgeries
                    .filter(admission => admission.status !== 'SURGERY_COMPLETED')
                    .slice(0, 4)
                    .map((admission) => {
                      const surgery = formatSurgeryData(admission);
                      return (
                        <div key={surgery.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {getPriorityIcon(surgery.priority)}
                                <span className="font-semibold text-gray-900">{surgery.patientName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {surgery.patientNumber}
                                </Badge>
                              </div>
                              <Badge className={`${getSurgeryStatusColor(surgery.status)} border flex items-center gap-1`}>
                                {getStatusIcon(surgery.status)}
                                <span className="capitalize">{surgery.status.replace(/_/g, ' ')}</span>
                              </Badge>
                            </div>
                            <p className="font-medium text-gray-900 mb-1">{surgery.surgery}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <span className="flex items-center">
                                <Stethoscope className="h-3 w-3 mr-1" />
                                {surgery.surgeon}
                              </span>
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {surgery.otRoom}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {admission.surgeryTimeSlot || 'Time not set'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {surgery.age} yrs, {surgery.gender}
                              </span>
                              {/* Show OT Room Name if available */}
                              {admission.otRoom?.roomName && (
                                <span className="flex items-center text-blue-600 font-medium">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {admission.otRoom.roomName}
                                </span>
                              )}
                              {surgery.estimatedCost > 0 && (
                                <span className="flex items-center">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {formatCurrency(surgery.estimatedCost)}
                                </span>
                              )}
                              {surgery.status === 'EMERGENCY' && (
                                <span className="flex items-center text-red-600">
                                  <Siren className="h-3 w-3 mr-1" />
                                  Emergency
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className='h-full tab-content-container pr-1'>
        {/* Real-time OT Room Status */}
          <Card className="h-full flex flex-col pr-2 pb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <span>OT Room Status - Today's Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {surgeriesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader color="#3B82F6" />
                </div>
              ) : (
                <div className="space-y-4">
                  {otRooms.map((room) => {
                    // Filter today's surgeries for this OT room (exclude completed)
                    const roomSurgeries = todaysSurgeries.filter(admission => {
                      const admissionRoomName = typeof admission.otRoom === 'string'
                        ? admission.otRoom
                        : admission.otRoom?.roomNumber || '';

                      // Match by room number OR by otRoomId
                      const matchByName = admissionRoomName === room.roomNumber;
                      const matchById = admission.otRoomId === room.id;

                      return (matchByName || matchById) && admission.status !== 'SURGERY_COMPLETED';
                    });

                    // Get ongoing surgeries (SURGERY_STARTED)
                    const ongoingSurgeries = roomSurgeries.filter(s => s.status === 'SURGERY_STARTED');
                    // Get ready/checked-in patients (READY_FOR_SURGERY, PRE_OP_ASSESSMENT with preOpCompleted)
                    const readySurgeries = roomSurgeries.filter(s => 
                      s.status === 'READY_FOR_SURGERY' || 
                      (s.status === 'PRE_OP_ASSESSMENT' && s.preOpCompleted)
                    );
                    // Get scheduled surgeries (not started, not ready)
                    const scheduledSurgeries = roomSurgeries.filter(s => 
                      s.status === 'SURGERY_SCHEDULED' || 
                      (s.status === 'PRE_OP_ASSESSMENT' && !s.preOpCompleted)
                    );
                    
                    // Sort by surgery time and get only the earliest one for each category
                    const sortBySurgeryTime = (a, b) => {
                      const timeA = a.surgeryTimeSlot || a.scheduledSurgeryTime || '';
                      const timeB = b.surgeryTimeSlot || b.scheduledSurgeryTime || '';
                      return timeA.localeCompare(timeB);
                    };
                    
                    const nextReadyPatient = readySurgeries.sort(sortBySurgeryTime)[0];
                    const nextScheduledPatient = scheduledSurgeries.sort(sortBySurgeryTime)[0];
                    
                    const scheduledCount = scheduledSurgeries.length;
                    const readyCount = readySurgeries.length;
                    const inProgressCount = ongoingSurgeries.length;

                    // Get latest temperature
                    const tempData = getLatestTemperature(room.otTemperatureRegisters);

                    // Determine room status - prioritize database status (handle both uppercase and lowercase)
                    let roomStatus = room.status?.toLowerCase() || 'available';
                    // If room is in maintenance or preparing, keep that status
                    if (roomStatus !== 'maintenance' && roomStatus !== 'preparing') {
                      // Only then check for ongoing surgeries
                      if (inProgressCount > 0) {
                        roomStatus = 'occupied';
                      }
                    }

                    return (
                      <div key={room.id} className="border rounded-lg overflow-hidden">
                        {/* OT Room Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 border-b">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${inProgressCount > 0 ? 'bg-green-500 animate-pulse' :
                                  scheduledCount > 0 ? 'bg-blue-500' :
                                    roomStatus === 'maintenance' ? 'bg-orange-500' :
                                      roomStatus === 'preparing' ? 'bg-yellow-500' :
                                        'bg-gray-400'
                                }`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900">{room.roomNumber}</h4>
                                  {room.roomName && (
                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                      {room.roomName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`${getOTRoomStatusColor(roomStatus)} border flex items-center gap-1`}>
                                {getOTRoomStatusIcon(roomStatus)}
                                <span className="capitalize">{roomStatus}</span>
                              </Badge>
                            </div>
                          </div>

                          {/* Temperature Display */}
                          {tempData && (
                            <div className="flex items-center justify-between mt-2 p-2 bg-white/50 rounded border border-blue-200">
                              <div className="flex items-center space-x-2">
                                <Thermometer className="h-4 w-4 text-blue-600" />
                                <div>
                                  <p className="text-xs font-medium text-gray-700">Temperature</p>
                                  <p className="text-sm font-bold text-blue-600">{tempData.temp}°C</p>
                                </div>
                              </div>
                              {tempData.humidity && (
                                <div className="text-right">
                                  <p className="text-xs text-gray-600">Humidity</p>
                                  <p className="text-sm font-semibold text-gray-700">{tempData.humidity}%</p>
                                </div>
                              )}
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Last reading</p>
                                <p className="text-xs font-medium text-gray-600">{tempData.time}</p>
                              </div>
                            </div>
                          )}

                          {/* Surgery Count */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                              {inProgressCount > 0 ? (
                                <Badge className="bg-green-100 text-green-800 border-green-300">
                                  <Activity className="h-3 w-3 mr-1" />
                                  {inProgressCount} Ongoing
                                </Badge>
                              ) : readyCount > 0 ? (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  {readyCount} Ready
                                </Badge>
                              ) : scheduledCount > 0 ? (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {scheduledCount} Scheduled
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-600 border-gray-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  No Active Surgery
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline" className="bg-white">
                              <Clock className="h-3 w-3 mr-1" />
                              {roomSurgeries.length} Total Today
                            </Badge>
                          </div>
                        </div>

                        {/* Surgery List for this OT */}
                        <div className="p-3 bg-white">
                          {/* Show ongoing surgeries first, if any */}
                          {inProgressCount > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-gray-600 mb-2">Ongoing Surgery:</p>
                              {ongoingSurgeries.map((admission, index) => {
                                const surgery = formatSurgeryData(admission);
                                return (
                                  <div
                                    key={surgery.id}
                                    className="p-4 rounded-lg border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white shadow-sm"
                                  >
                                    {/* Header with Patient Info and Status */}
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="text-sm font-bold text-gray-900">{surgery.patientName}</h4>
                                          <Badge variant="outline" className="text-xs">
                                            {surgery.patientNumber}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-gray-600">
                                          {surgery.age}Y, {surgery.gender}
                                        </p>
                                      </div>
                                      <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
                                        <Play className="h-3 w-3" />
                                        <span>In Progress</span>
                                      </Badge>
                                    </div>

                                    {/* Surgery Details */}
                                    <div className="mb-3 p-2 bg-white rounded border border-green-200">
                                      <p className="text-sm font-semibold text-gray-900 mb-1">{surgery.surgery}</p>
                                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                                        <span className="flex items-center">
                                          <Stethoscope className="h-3 w-3 mr-1" />
                                          {surgery.surgeon}
                                        </span>
                                        <span className="flex items-center">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {admission.surgeryTimeSlot || 'Not set'}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Real-time Status Timeline */}
                                    <div className="space-y-2 mb-3">
                                      {/* Pre-Op Status - Always checked if surgery has started */}
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                        <span className="text-xs text-green-700 font-medium">
                                          Pre-Op Preparation
                                        </span>
                                        {admission.preOpCompletedAt && (
                                          <span className="text-xs text-gray-400 ml-auto">
                                            {formatTime(admission.preOpCompletedAt)}
                                          </span>
                                        )}
                                      </div>

                                      {/* Patient in OT Status - Shows when anesthesia is given */}
                                      {admission.anesthesiaGiven && (
                                        <div className="flex items-center gap-2">
                                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                          <span className="text-xs text-green-700 font-medium">
                                            Patient Present in OT
                                          </span>
                                        </div>
                                      )}

                                      {/* Anesthesia Status */}
                                      {admission.requiresAnesthesia && (
                                        <div className="flex items-center gap-2">
                                          {admission.anesthesiaGiven ? (
                                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                          ) : (
                                            <Timer className="h-4 w-4 text-orange-500 flex-shrink-0 animate-pulse" />
                                          )}
                                          <span className={`text-xs ${admission.anesthesiaGiven ? 'text-green-700 font-medium' : 'text-orange-600 font-medium'}`}>
                                            Anesthesia {admission.anesthesiaGiven ? 'Applied' : 'Pending'}
                                          </span>
                                        </div>
                                      )}

                                      {/* Surgery Started */}
                                      <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-green-600 flex-shrink-0 animate-pulse" />
                                        <span className="text-xs text-green-700 font-medium">
                                          Surgery In Progress
                                        </span>
                                        {admission.surgeryStartTime && (
                                          <span className="text-xs text-gray-400 ml-auto">
                                            Started: {formatTime(admission.surgeryStartTime)}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Elapsed Time Display */}
                                    {admission.surgeryStartTime && (
                                      <div className="flex items-center justify-between pt-2 border-t border-green-200">
                                        <span className="text-xs text-gray-600">Time Elapsed:</span>
                                        <ElapsedTimer 
                                          startTime={admission.surgeryStartTime} 
                                          surgeryId={admission.id} 
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : roomSurgeries.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No surgeries scheduled in this OT today</p>
                            </div>
                          ) : (
                            /* Show ready patients first, then scheduled surgeries with comprehensive patient details */
                            <div className="space-y-3">
                              {/* Show Ready for Surgery patient (earliest time slot) */}
                              {nextReadyPatient && (
                                <div>
                                  <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                                    <UserCheck className="h-4 w-4" />
                                    Ready for Surgery {readyCount > 1 && `(1 of ${readyCount})`}:
                                  </p>
                                  {(() => {
                                    const readyAdmission = nextReadyPatient;
                                    const surgery = formatSurgeryData(readyAdmission);
                                    return (
                                      <div className="p-4 mb-2 rounded-lg bg-gradient-to-r from-green-50 to-white border-l-4 border-l-green-500 shadow-sm">
                                        {/* Header with Patient Info */}
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h4 className="text-sm font-bold text-gray-900">{surgery.patientName}</h4>
                                              <Badge variant="outline" className="text-xs">
                                                {surgery.patientNumber}
                                              </Badge>
                                            </div>
                                            <p className="text-xs text-gray-600">
                                              {surgery.age}Y, {surgery.gender}
                                            </p>
                                          </div>
                                          <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            <span>Ready</span>
                                          </Badge>
                                        </div>

                                        {/* Surgery Details */}
                                        <div className="mb-3 p-2 bg-white rounded border border-green-200">
                                          <p className="text-sm font-semibold text-gray-900 mb-1">{surgery.surgery}</p>
                                          <div className="flex items-center space-x-3 text-xs text-gray-600">
                                            <span className="flex items-center">
                                              <Stethoscope className="h-3 w-3 mr-1" />
                                              {surgery.surgeon}
                                            </span>
                                            <span className="flex items-center">
                                              <Clock className="h-3 w-3 mr-1 text-green-600" />
                                              <span className="font-semibold text-green-700">
                                                {readyAdmission.surgeryTimeSlot || 'Time not set'}
                                              </span>
                                            </span>
                                          </div>
                                        </div>

                                        {/* Status Checklist */}
                                        <div className="space-y-2">
                                          {/* Pre-Op Status */}
                                          <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                            <span className="text-xs text-green-700 font-medium">
                                              Pre-Op Preparation Complete
                                              {readyAdmission.preOpCompletedAt && (
                                                <span className="text-gray-500 ml-1">
                                                  at {formatTime(readyAdmission.preOpCompletedAt)}
                                                </span>
                                              )}
                                            </span>
                                          </div>

                                          {/* Patient Present in OT - Shows when anesthesia is given */}
                                          {readyAdmission.anesthesiaGiven && (
                                            <div className="flex items-center gap-2">
                                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                              <span className="text-xs text-green-700 font-medium">
                                                Patient Present in OT
                                              </span>
                                            </div>
                                          )}

                                          {/* Anesthesia Status */}
                                          {readyAdmission.requiresAnesthesia && (
                                            <div className="flex items-center gap-2">
                                              {readyAdmission.anesthesiaGiven ? (
                                                <>
                                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                  <span className="text-xs text-green-700 font-medium">
                                                    Anesthesia Given
                                                  </span>
                                                </>
                                              ) : (
                                                <>
                                                  <Syringe className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                                                  <span className="text-xs text-yellow-700 font-medium">
                                                    Anesthesia Pending
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          )}

                                          {/* Expected Duration */}
                                          {readyAdmission.expectedDuration && (
                                            <div className="flex items-center gap-2">
                                              <Timer className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                              <span className="text-xs text-gray-600">
                                                Expected Duration: {readyAdmission.expectedDuration} min
                                              </span>
                                            </div>
                                          )}

                                          {/* Priority Level */}
                                          {readyAdmission.priorityLevel && (
                                            <div className="flex items-center gap-2">
                                              {getPriorityIcon(readyAdmission.priorityLevel)}
                                              <span className="text-xs text-gray-600">
                                                Priority: {readyAdmission.priorityLevel}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}

                              {/* Show next scheduled surgery (earliest time slot) */}
                              {nextScheduledPatient && (
                                <div>
                                  <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Next Scheduled {scheduledCount > 1 && `(1 of ${scheduledCount})`}:
                                  </p>
                                  {(() => {
                                    const nextSurgery = nextScheduledPatient;
                                    const surgery = formatSurgeryData(nextSurgery);
                                    return (
                                      <div className="p-4 mb-2 rounded-lg bg-gradient-to-r from-blue-50 to-white border-l-4 border-l-blue-500 shadow-sm">
                                        {/* Header with Patient Info */}
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h4 className="text-sm font-bold text-gray-900">{surgery.patientName}</h4>
                                              <Badge variant="outline" className="text-xs">
                                                {surgery.patientNumber}
                                              </Badge>
                                            </div>
                                            <p className="text-xs text-gray-600">
                                              {surgery.age}Y, {surgery.gender}
                                            </p>
                                          </div>
                                          <Badge className={`${getSurgeryStatusColor(surgery.status)} border flex items-center gap-1`}>
                                            <Clock className="h-3 w-3" />
                                            <span>Scheduled</span>
                                          </Badge>
                                        </div>

                                        {/* Surgery Details */}
                                        <div className="mb-3 p-2 bg-white rounded border border-blue-200">
                                          <p className="text-sm font-semibold text-gray-900 mb-1">{surgery.surgery}</p>
                                          <div className="flex items-center space-x-3 text-xs text-gray-600">
                                            <span className="flex items-center">
                                              <Stethoscope className="h-3 w-3 mr-1" />
                                              {surgery.surgeon}
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
                                            {nextSurgery.preOpCompleted ? (
                                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                            ) : (
                                              <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                            )}
                                            <span className={`text-xs ${nextSurgery.preOpCompleted ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                                              Pre-Op Preparation {nextSurgery.preOpCompleted ? 'Complete' : 'Pending'}
                                            </span>
                                          </div>

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
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 flex-col bg-blue-600 hover:bg-blue-700 space-y-2">
                <Plus className="h-6 w-6" />
                <span className="text-sm">Schedule Surgery</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Staff Assignment</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Siren className="h-6 w-6" />
                <span className="text-sm">Emergency Protocol</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm">Generate Report</span>
              </Button>
            </div>
          </CardContent>
        </Card> */}

        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span>Critical Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Equipment Alert</p>
                  <p className="text-xs text-red-600">Anesthesia Machine #2 offline</p>
                  <p className="text-xs text-red-500 mt-1">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Clock className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Delay Alert</p>
                  <p className="text-xs text-yellow-600">OT-2 running 15 min behind</p>
                  <p className="text-xs text-yellow-500 mt-1">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Bell className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Staff Update</p>
                  <p className="text-xs text-blue-600">Dr. Martinez on standby</p>
                  <p className="text-xs text-blue-500 mt-1">10 minutes ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>


      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <span>Today's Performance Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{todayStats.utilization || 0}%</div>
              <div className="text-sm text-gray-600 mb-2">OT Utilization</div>
              <Progress value={todayStats.utilization || 0} className="h-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{todayStats.successRate || 0}%</div>
              <div className="text-sm text-gray-600 mb-2">Success Rate</div>
              <Progress value={todayStats.successRate || 0} className="h-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{todayStats.avgTurnoverTime || 0}</div>
              <div className="text-sm text-gray-600">Avg Turnover (min)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">{todayStats.waitingPatients || 0}</div>
              <div className="text-sm text-gray-600">Waiting Patients</div>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </>
  );
};

export default RealTimeOTStatus;
