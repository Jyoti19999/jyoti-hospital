import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  Baby,
  Users,
  Clock,
  Eye,
  Stethoscope,
  AlertCircle,
  Timer,
  UserCheck,
  RefreshCw,
  CalendarCheck,
  Activity,
  Scissors,
  FastForward,
  CalendarDays,
  ArrowUpDown
} from 'lucide-react';
import ophthalmologistQueueService from '@/services/ophthalmologistQueueService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useReceptionist2QueueSocket, useSocketConnectionStatus } from '@/hooks/useQueueSocket';

const Receptionist2DoctorQueue = ({ doctorId = null }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 🔌 WebSocket real-time updates
  useReceptionist2QueueSocket();
  const isSocketConnected = useSocketConnectionStatus();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState(doctorId);

  // Fetch all ophthalmologists/doctors and their queues
  const { data: queueData, isLoading: queueLoading, refetch } = useQuery({
    queryKey: ['receptionist-doctor-queue'],
    queryFn: async () => {
      // Use the receptionist2-specific endpoint that includes doctorQueuePosition
      const response = await fetch('http://localhost:8080/api/v1/receptionist2/patients/ophthalmology-queue/doctor-specific', {
        credentials: 'include'
      });
      const data = await response.json();
      return data.data || data;
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Get unique doctors from queue data
  const doctors = useMemo(() => {
    if (!queueData?.doctorQueues) return [];
    return queueData.doctorQueues.map(dq => dq.doctor);
  }, [queueData]);
  
  // Set doctor from prop or first doctor as default
  useEffect(() => {
    if (doctorId) {
      setSelectedDoctor(doctorId);
    } else if (doctors.length > 0 && !selectedDoctor) {
      setSelectedDoctor(doctors[0].id);
    }
  }, [doctors, selectedDoctor, doctorId]);

  // Listen for WebSocket updates
  useEffect(() => {
    const handleQueueUpdate = () => {
      refetch();
      queryClient.invalidateQueries(['receptionist-doctor-queue']);
      queryClient.invalidateQueries(['ophthalmologists']);
    };

    if (typeof window !== 'undefined' && window.socket) {
      window.socket.on('doctor-queue-updated', handleQueueUpdate);
      window.socket.on('patient-assigned', handleQueueUpdate);
      window.socket.on('patient-called', handleQueueUpdate);
      window.socket.on('patient-status-changed', handleQueueUpdate);
      
      return () => {
        window.socket?.off('doctor-queue-updated', handleQueueUpdate);
        window.socket?.off('patient-assigned', handleQueueUpdate);
        window.socket?.off('patient-called', handleQueueUpdate);
        window.socket?.off('patient-status-changed', handleQueueUpdate);
      };
    }
  }, [refetch, queryClient]);

  // Get assigned patients for selected doctor
  const getAssignedPatients = () => {
    if (!queueData?.doctorQueues) return [];
    const doctorQueue = queueData.doctorQueues.find(dq => dq.doctor.id === selectedDoctor);
    if (!doctorQueue) return [];
    return doctorQueue.patients || [];
  };

  // Filter patients by category tab
  const filterPatientsByTab = (patients, tab) => {
    switch (tab) {
      case 'all':
        return patients;
      case 'priority':
        return patients.filter(p => p.priorityLabel === 'PRIORITY');
      case 'emergency':
        return patients.filter(p => p.priorityLabel === 'EMERGENCY');
      case 'children':
        return patients.filter(p => p.priorityLabel === 'CHILDREN');
      case 'seniors':
        return patients.filter(p => p.priorityLabel === 'SENIORS');
      case 'longwait':
        return patients.filter(p => p.priorityLabel === 'LONGWAIT');
      case 'referral':
        return patients.filter(p => p.priorityLabel === 'REFERRAL');
      case 'followup':
        return patients.filter(p => p.priorityLabel === 'FOLLOWUP');
      case 'routine':
        return patients.filter(p => p.priorityLabel === 'ROUTINE');
      case 'scheduled':
        return patients.filter(p => p.priorityLabel === 'SCHEDULED');
      case 'prepostop':
        return patients.filter(p => p.priorityLabel === 'PREPOSTOP');
      default:
        return patients;
    }
  };

  // Get Next in Line patients (next 3 WAITING patients)
  const getNextInLinePatients = () => {
    const assigned = getAssignedPatients();
    return assigned
      .filter(p => p.status === 'WAITING')
      .sort((a, b) => (a.doctorQueuePosition || 999) - (b.doctorQueuePosition || 999))
      .slice(0, 3);
  };

  // Get In Progress patients (CALLED and IN_PROGRESS status)
  const getInProgressPatients = () => {
    const assigned = getAssignedPatients();
    return assigned.filter(p => p.status === 'CALLED' || p.status === 'IN_PROGRESS');
  };

  // Get waiting patients (WAITING status, position > 3 - remaining after next 3)
  const getWaitingPatients = () => {
    const assigned = getAssignedPatients();
    const waiting = assigned
      .filter(p => p.status === 'WAITING')
      .sort((a, b) => (a.doctorQueuePosition || 999) - (b.doctorQueuePosition || 999));
    // Return patients after first 3 (which are shown in Next in Line)
    return waiting.slice(3);
  };

  // Filter patients by search term
  const filterBySearch = (patients) => {
    if (!searchTerm) return patients;
    return patients.filter(p =>
      p.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patient?.patientNumber?.toString().includes(searchTerm) ||
      p.visit?.tokenNumber?.toString().includes(searchTerm)
    );
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'all': return <Users className="h-4 w-4" />;
      case 'priority': return <AlertTriangle className="h-4 w-4" />;
      case 'emergency': return <AlertCircle className="h-4 w-4" />;
      case 'children': return <Baby className="h-4 w-4" />;
      case 'seniors': return <Users className="h-4 w-4" />;
      case 'longwait': return <Clock className="h-4 w-4" />;
      case 'referral': return <Stethoscope className="h-4 w-4" />;
      case 'followup': return <RefreshCw className="h-4 w-4" />;
      case 'routine': return <CalendarCheck className="h-4 w-4" />;
      case 'scheduled': return <CalendarDays className="h-4 w-4" />;
      case 'prepostop': return <Scissors className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'all': return 'purple';
      case 'priority': return 'red';
      case 'emergency': return 'red';
      case 'children': return 'purple';
      case 'seniors': return 'amber';
      case 'longwait': return 'yellow';
      case 'referral': return 'indigo';
      case 'followup': return 'green';
      case 'routine': return 'blue';
      case 'scheduled': return 'teal';
      case 'prepostop': return 'cyan';
      default: return 'gray';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'EMERGENCY': return 'bg-red-100 text-red-800';
      case 'PRIORITY': return 'bg-orange-100 text-orange-800';
      case 'CHILDREN': return 'bg-purple-100 text-purple-800';
      case 'SENIORS': return 'bg-amber-100 text-amber-800';
      case 'LONGWAIT': return 'bg-yellow-100 text-yellow-800';
      case 'REFERRAL': return 'bg-indigo-100 text-indigo-800';
      case 'FOLLOWUP': return 'bg-green-100 text-green-800';
      case 'PREPOSTOP': return 'bg-cyan-100 text-cyan-800';
      case 'SCHEDULED': return 'bg-teal-100 text-teal-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'WAITING': return 'bg-blue-100 text-blue-800';
      case 'CALLED': return 'bg-purple-100 text-purple-800';
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format wait time
  const formatWaitTime = (createdAt) => {
    if (!createdAt) return 'N/A';
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    }
    return `${diffMins}m`;
  };

  const allPatients = getAssignedPatients();
  const filteredPatients = filterBySearch(filterPatientsByTab(getWaitingPatients(), activeTab));
  const nextInLinePatients = getNextInLinePatients();
  const inProgressPatients = getInProgressPatients();

  const selectedDoctorData = doctors.find(d => d.id === selectedDoctor);

  return ( 
    <Card className="bg-white shadow-lg h-full overflow-y-auto tab-content-container">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Eye className="h-6 w-6 text-blue-600" />
            Ophthalmologist Queue - Dr. {selectedDoctorData?.firstName} {selectedDoctorData?.lastName}
            {isSocketConnected && (
              <div className="relative w-2 h-2 ml-1">
                <div className="absolute w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                <div className="absolute w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            )}
            <Badge variant="outline" className="ml-2">
              {allPatients.length} total
            </Badge>
          </CardTitle>
          {/* Doctor Selection - Integrated in header */}
          {!doctorId && doctors.length > 1 && (
            <div className="mt-3 pt-3">
              <div className="flex items-center gap-2 flex-wrap">
                {doctors.map((doctor) => (
                  <Button
                    key={doctor.id}
                    size="sm"
                    variant={selectedDoctor === doctor.id ? 'default' : 'outline'}
                    onClick={() => setSelectedDoctor(doctor.id)}
                    className={selectedDoctor === doctor.id ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Dr. {doctor.firstName} {doctor.lastName}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              disabled={queueLoading}
            >
              <RefreshCw className={`h-4 w-4 ${queueLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          View patients by category - Monitor next in line and in progress patients
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Main Layout: Categories Full Width at Top, Then Patient List on Left, Monitoring Panels on Right */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Category Tabs - Full Width */}
          <TabsList className="flex w-full gap-1 mb-6 p-1 bg-gray-50 h-auto shadow-inner">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
                >
                  <Users className="h-4 w-4" />
                  <span>All</span>
                  <span className="text-xs">({filterPatientsByTab(getWaitingPatients(), 'all').length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="priority"
                  className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Priority</span>
                  <span className="text-xs">({filterPatientsByTab(getWaitingPatients(), 'priority').length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="emergency"
                  className="data-[state=active]:bg-red-700 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Emergency</span>
                  <span className="text-xs">({filterPatientsByTab(getWaitingPatients(), 'emergency').length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="children"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
                >
                  <Baby className="h-4 w-4" />
                  <span>Children</span>
                  <span className="text-xs">({filterPatientsByTab(getWaitingPatients(), 'children').length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="seniors"
                  className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Seniors</span>
                  <span className="text-xs">({filterPatientsByTab(getWaitingPatients(), 'seniors').length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="longwait"
                  className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
                >
                  <Timer className="h-4 w-4" />
                  <span>Long Wait</span>
                  <span className="text-xs">({filterPatientsByTab(getWaitingPatients(), 'longwait').length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="referral"
                  className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
                >
                  <Activity className="h-4 w-4" />
                  <span>Referral</span>
                  <span className="text-xs">({filterPatientsByTab(getWaitingPatients(), 'referral').length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="followup"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span>Follow-Up</span>
                  <span className="text-xs">({filterPatientsByTab(getWaitingPatients(), 'followup').length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="routine"
                  className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
                >
                  <Clock className="h-4 w-4" />
                  <span>Routine</span>
                  <span className="text-xs">({filterPatientsByTab(getWaitingPatients(), 'routine').length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="scheduled"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>Scheduled</span>
                  <span className="text-xs">({filterPatientsByTab(getWaitingPatients(), 'scheduled').length})</span>
                </TabsTrigger>

                <TabsTrigger
                  value="prepostop"
                  className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
                >
                  <Scissors className="h-4 w-4" />
                  <span>Pre/Post-Op</span>
                  <span className="text-xs">({filterPatientsByTab(getWaitingPatients(), 'prepostop').length})</span>
                </TabsTrigger>
              </TabsList>

              {/* Content Area: Patient List on Left (2/3), Monitoring Panels on Right (1/3) */}
              <TabsContent value={activeTab}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Side: Patient List (2/3 width) */}
                  <div className="lg:col-span-2">
                    <div className="space-y-3 max-h-[655px] overflow-y-auto pr-2 pl-1 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 hover:scrollbar-thumb-blue-600">
                  {filteredPatients.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No patients in this category</p>
                      <p className="text-sm mt-2">Patients will appear here when they match the filter criteria</p>
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <Card 
                        key={patient.id} 
                        className="transition-colors hover:bg-gray-50"
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar with Queue Number */}
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                {patient.doctorQueuePosition}
                              </div>
                            </div>
                            
                            {/* Patient Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-base truncate">
                                  {patient.patient?.fullName}
                                </p>
                                <Badge className={`${getPriorityColor(patient.priorityLabel)} text-xs ml-2`}>
                                  {patient.priorityLabel || 'ROUTINE'}
                                </Badge>
                              </div>
                              
                              <p className="text-xs text-gray-600 mb-2">
                                MRN: {patient.patient?.patientNumber || 'N/A'} • {patient.patient?.phone || 'N/A'}
                              </p>
                              
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatWaitTime(patient.createdAt)}
                                </div>
                                {patient.patient?.age && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {patient.patient.age}y
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <CalendarCheck className="h-3 w-3" />
                                  {patient.visit?.tokenNumber || 'N/A'}
                                </div>
                                <Badge 
                                  className={`text-xs ${getStatusColor(patient.status)}`}
                                >
                                  {patient.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                  </div>

                  {/* Right Side: Next in Line + In Progress - Constant (1/3 width) */}
                  <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Next in Line */}
            <Card className="w-full bg-white shadow-sm border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Users className="h-4 w-4 text-blue-600" />
                  Next in Line
                </CardTitle>
                <CardDescription className="text-[10px]">
                  View-only: First 3 patients waiting for examination
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nextInLinePatients.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No patients in next 3 positions</p>
                    <p className="text-sm mt-2">Patients will appear here when in queue</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {nextInLinePatients.map((patient, index) => (
                      <Card 
                        key={patient.id} 
                        className={`transition-all ${
                          index === 0 
                            ? 'ring-2 ring-blue-500 bg-blue-50/50' 
                            : 'bg-white'
                        }`}
                      >
                        <CardContent className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-center">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {patient.doctorQueuePosition}
                              </div>
                              {index === 0 && (
                                <Badge variant="default" className="text-[9px] mt-0.5 px-1 py-0">
                                  NEXT
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-0.5">
                                <h4 className="font-semibold text-xs truncate">
                                  {patient.patient?.fullName}
                                </h4>
                                <Badge className={`${getPriorityColor(patient.priorityLabel)} text-[9px] px-1 py-0`}>
                                  {patient.priorityLabel || 'ROUTINE'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-0.5">
                                <span>#{patient.patient?.patientNumber}</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatWaitTime(patient.createdAt)}
                                </span>
                                {patient.patient?.age && (
                                  <>
                                    <span>•</span>
                                    <span>{patient.patient.age}y</span>
                                  </>
                                )}
                              </div>
                              <Badge className={`text-[9px] w-fit px-1 py-0 ${getStatusColor(patient.status)}`}>
                                {patient.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {/* <div className="text-center pt-1 border-t">
                      <p className="text-[10px] text-gray-500">
                        View-only: Next patients in queue
                      </p>
                    </div> */}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* In Progress */}
            <Card className="w-full bg-white shadow-sm border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Activity className="h-4 w-4 text-green-600" />
                  In Progress
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Patients currently under examination
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inProgressPatients.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No examinations in progress</p>
                    <p className="text-sm mt-2">Active examinations will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inProgressPatients.map((patient) => (
                      <Card 
                        key={patient.id} 
                        className="bg-white"
                      >
                        <CardContent className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                {patient.doctorQueuePosition || '•'}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-0.5">
                                <h4 className="font-semibold text-xs truncate">
                                  {patient.patient?.fullName}
                                </h4>
                                <Badge className={`${getPriorityColor(patient.priorityLabel)} text-[9px] px-1 py-0`}>
                                  {patient.priorityLabel || 'ROUTINE'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-gray-600 mb-0.5">
                                <span>#{patient.patient?.patientNumber}</span>
                                <span>•</span>
                                {patient.inProgressAt && (
                                  <>
                                    <span className="flex items-center gap-0.5">
                                      <Timer className="h-2.5 w-2.5" />
                                      {formatWaitTime(patient.inProgressAt)}
                                    </span>
                                    <span>•</span>
                                  </>
                                )}
                                {patient.patient?.age && (
                                  <>
                                    <span>{patient.patient.age}y</span>
                                  </>
                                )}
                              </div>
                              <Badge className={`text-[9px] w-fit px-1 py-0 ${getStatusColor(patient.status)}`}>
                                {patient.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {/* <div className="text-center pt-1 border-t">
                      <p className="text-[10px] text-gray-500">
                        View-only: Active examinations
                      </p>
                    </div> */}
                  </div>
                )}
              </CardContent>
            </Card>
                  </div>
                </div>
              </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Receptionist2DoctorQueue;
