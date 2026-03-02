// src/components/staff/CurrentQueue.jsx
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Loader2, Clock, User, Phone, Calendar, Tag, RefreshCw, Users, 
  AlertTriangle, AlertCircle, Baby, UserCheck, Timer, Activity, 
  CalendarCheck, Scissors, CalendarDays 
} from 'lucide-react';
import { toast } from 'sonner';
import optometristQueueService from '@/services/optometristQueueService';
import { useOptometristQueueSocket } from '@/hooks/useQueueSocket';
import { socket } from '@/lib/socket';

const CurrentQueue = ({ 
  queryKey = ['optometrist-queue'],
  queryFn = () => optometristQueueService.getOptometristQueue(),
  enablePriorityUpdate = true,
  hideHeader = false
} = {}) => {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPriorityLabel, setSelectedPriorityLabel] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Connect to websocket for real-time updates (default hook for staff dashboard)
  // For receptionist2, the parent component handles socket connection
  useOptometristQueueSocket();

  // Priority label options with display names and colors
  const priorityOptions = [
    { value: 'routine', label: 'Routine', color: 'bg-gray-100 text-gray-800' },
    { value: 'priority', label: 'Priority', color: 'bg-blue-100 text-blue-800' },
    { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-800' },
    { value: 'referral', label: 'Referral', color: 'bg-cyan-100 text-cyan-800' },
    { value: 'followup', label: 'Follow-up', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'prepostop', label: 'Pre/Post-Op', color: 'bg-pink-100 text-pink-800' }
  ];

  // Track socket connection status for fallback polling
  const [isSocketConnected, setIsSocketConnected] = useState(true);

  useEffect(() => {
    const handleConnect = () => {
      console.log('✅ Socket connected - disabling fallback polling');
      setIsSocketConnected(true);
    };
    
    const handleDisconnect = () => {
      console.log('⚠️ Socket disconnected - enabling fallback polling');
      setIsSocketConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    setIsSocketConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  // Get queue data with intelligent fallback
  const { data: queueData, isLoading, error, refetch } = useQuery({
    queryKey: queryKey,
    queryFn: queryFn,
    // Enable polling only when socket is disconnected (fallback safety net)
    refetchInterval: isSocketConnected ? false : 15000, // Poll every 15s if socket down
    staleTime: 0, // No caching
    gcTime: 0, // No garbage collection time
    refetchOnWindowFocus: !isSocketConnected, // Only refocus when socket down
    refetchOnMount: true
  });

  // Update priority label mutation
  const updatePriorityMutation = useMutation({
    mutationFn: ({ queueEntryId, visitType }) => 
      optometristQueueService.updatePatientVisitType(queueEntryId, visitType),
    onSuccess: (response) => {
      toast.success('Priority label updated successfully');
      queryClient.invalidateQueries(queryKey);
      handleModalClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update priority label');
    },
    enabled: enablePriorityUpdate
  });

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSelectedPriorityLabel(patient.priorityLabel?.toLowerCase() || 'routine');
    setIsPriorityModalOpen(true);
  };

  const handlePriorityUpdate = () => {
    if (!selectedPatient || !selectedPriorityLabel) {
      toast.error('Please select a patient and priority label');
      return;
    }

    updatePriorityMutation.mutate({
      queueEntryId: selectedPatient.queueEntryId,
      visitType: selectedPriorityLabel
    });
  };

  const handleModalClose = () => {
    setIsPriorityModalOpen(false);
    setSelectedPatient(null);
    setSelectedPriorityLabel('');
  };

  const getPriorityConfig = (priorityLabel) => {
    const label = priorityLabel?.toLowerCase() || 'routine';
    return priorityOptions.find(option => option.value === label) || priorityOptions[0];
  };

  const formatWaitTime = (joinedAt) => {
    if (!joinedAt) return 'N/A';
    const joined = new Date(joinedAt);
    const now = new Date();
    const waitMinutes = Math.floor((now - joined) / (1000 * 60));
    
    if (waitMinutes < 60) {
      return `${waitMinutes}m`;
    }
    
    const hours = Math.floor(waitMinutes / 60);
    const minutes = waitMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Calculate wait time in minutes
  const calculateWaitTime = (joinedAt) => {
    if (!joinedAt) return 0;
    const joined = new Date(joinedAt);
    const now = new Date();
    return Math.floor((now - joined) / (1000 * 60));
  };

  // Filter patients by tab/category
  const filterPatientsByTab = (patients, tab) => {
    switch (tab) {
      case 'all':
        return patients;
      case 'priority':
        return patients.filter(p =>
          p.priorityLabel?.toUpperCase() === 'PRIORITY'
        );
      case 'emergency':
        return patients.filter(p =>
          p.priorityLabel?.toUpperCase() === 'EMERGENCY'
        );
      case 'children':
        return patients.filter(p => {
          const age = calculateAge(p.patient?.dateOfBirth);
          return age !== null && age < 12;
        });
      case 'seniors':
        return patients.filter(p => {
          const age = calculateAge(p.patient?.dateOfBirth);
          return age !== null && age >= 60;
        });
      case 'longwait':
        return patients.filter(p => {
          const waitTime = calculateWaitTime(p.joinedAt);
          return waitTime > 120; // More than 2 hours
        });
      case 'referral':
        return patients.filter(p =>
          p.priorityLabel?.toUpperCase() === 'REFERRAL'
        );
      case 'followup':
        return patients.filter(p =>
          p.priorityLabel?.toUpperCase() === 'FOLLOWUP'
        );
      case 'routine':
        return patients.filter(p =>
          p.priorityLabel?.toUpperCase() === 'ROUTINE'
        );
      case 'scheduled':
        return patients.filter(p => {
          const notes = p.appointment?.notes || '';
          return notes.toLowerCase().includes('scheduled appointment');
        });
      case 'prepostop':
        return patients.filter(p =>
          p.priorityLabel?.toUpperCase() === 'PREPOSTOP'
        );
      default:
        return patients;
    }
  };

  // Update filtered patients when tab changes or data updates
  useEffect(() => {
    const patients = queueData?.data?.queueEntries || [];
    const safePatients = patients.filter(patient => patient && patient.patient);
    
    // Get patients that are in Next in Line (first 3 WAITING) or In Progress (CALLED/IN_PROGRESS)
    const nextInLinePatients = safePatients
      .filter(p => p.status === 'WAITING')
      .sort((a, b) => {
        const queueA = a.queueNumber || 999;
        const queueB = b.queueNumber || 999;
        return queueA - queueB;
      })
      .slice(0, 3);
    
    const inProgressPatients = safePatients
      .filter(p => p.status === 'CALLED' || p.status === 'IN_PROGRESS');
    
    // Get IDs of patients already shown in monitoring panels
    const monitoringPanelIds = new Set([
      ...nextInLinePatients.map(p => p.queueEntryId),
      ...inProgressPatients.map(p => p.queueEntryId)
    ]);
    
    // Filter out patients that are already in monitoring panels
    const remainingPatients = safePatients.filter(p => !monitoringPanelIds.has(p.queueEntryId));
    
    const filtered = filterPatientsByTab(remainingPatients, activeTab);
    setFilteredPatients(filtered);
  }, [queueData, activeTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading queue...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-600">Error loading queue: {error.message}</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  const patients = queueData?.data?.queueEntries || [];

  // Add safety check for patient data
  const safePatients = patients.filter(patient => 
    patient && patient.patient
  );

  // Use filtered patients based on active tab
  const displayPatients = filteredPatients.length > 0 || activeTab !== 'all' ? filteredPatients : safePatients;

  return (
    <div className="h-full flex flex-col">
      {/* Category Tabs */}
      <Card className="flex-1 flex flex-col min-h-0">
        {!hideHeader && (
          <CardHeader className="flex-shrink-0 py-3">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                <span>Current Queue</span>
                {isSocketConnected && (
                  <div className="relative w-2 h-2 ml-1">
                    <div className="absolute w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                    <div className="absolute w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                )}
                <Badge variant="outline" className="ml-2">
                  {safePatients.length} total
                </Badge>
              </div>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription className="text-sm">
              View patients by category - Select to update priority labels in "All" tab
            </CardDescription>
          </CardHeader>
        )}
        <CardContent className={`${hideHeader ? "pt-6" : ""} flex-1 flex flex-col min-h-0`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="flex w-full gap-1 mb-3 p-1 bg-gray-50 rounded-lg h-auto shadow-inner flex-shrink-0">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
              >
                <Users className="h-4 w-4" />
                <span>All</span>
                <span className="text-xs">({filterPatientsByTab(safePatients, 'all').length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="priority"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Priority</span>
                <span className="text-xs">({filterPatientsByTab(safePatients, 'priority').length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="emergency"
                className="data-[state=active]:bg-red-700 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Emergency</span>
                <span className="text-xs">({filterPatientsByTab(safePatients, 'emergency').length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="children"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
              >
                <Baby className="h-4 w-4" />
                <span>Children</span>
                <span className="text-xs">({filterPatientsByTab(safePatients, 'children').length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="seniors"
                className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
              >
                <UserCheck className="h-4 w-4" />
                <span>Seniors</span>
                <span className="text-xs">({filterPatientsByTab(safePatients, 'seniors').length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="longwait"
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
              >
                <Timer className="h-4 w-4" />
                <span>Long Wait</span>
                <span className="text-xs">({filterPatientsByTab(safePatients, 'longwait').length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="referral"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
              >
                <Activity className="h-4 w-4" />
                <span>Referral</span>
                <span className="text-xs">({filterPatientsByTab(safePatients, 'referral').length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="followup"
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
              >
                <CalendarCheck className="h-4 w-4" />
                <span>Follow-Up</span>
                <span className="text-xs">({filterPatientsByTab(safePatients, 'followup').length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="routine"
                className="data-[state=active]:bg-teal-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
              >
                <Clock className="h-4 w-4" />
                <span>Routine</span>
                <span className="text-xs">({filterPatientsByTab(safePatients, 'routine').length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="scheduled"
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
              >
                <CalendarDays className="h-4 w-4" />
                <span>Scheduled</span>
                <span className="text-xs">({filterPatientsByTab(safePatients, 'scheduled').length})</span>
              </TabsTrigger>

              <TabsTrigger
                value="prepostop"
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white text-xs px-2 py-2 flex flex-col items-center gap-1 min-h-[60px] flex-1"
              >
                <Scissors className="h-4 w-4" />
                <span>Pre/Post-Op</span>
                <span className="text-xs">({filterPatientsByTab(safePatients, 'prepostop').length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content for All Categories */}
            {['all', 'priority', 'emergency', 'children', 'seniors', 'longwait', 'referral', 'followup', 'routine', 'scheduled', 'prepostop'].map(tabValue => (
              <TabsContent key={tabValue} value={tabValue} className="flex-1 min-h-0 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full min-h-0">
                  {/* Patient List */}
                  <div className="lg:col-span-2 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto pr-2 pl-1 scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-200 hover:scrollbar-thumb-blue-600 space-y-2">
                      {displayPatients.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="font-medium">No patients in this category</p>
                          <p className="text-sm mt-2">Patients will appear here when they match the filter criteria</p>
                        </div>
                      ) : (
                        displayPatients.map((patient) => {
                          const priorityConfig = getPriorityConfig(patient.priorityLabel);
                          const isSelected = selectedPatient?.queueEntryId === patient.queueEntryId;
                          
                          return (
                            <Card 
                              key={patient.queueEntryId} 
                              className={`transition-colors ${
                                activeTab === 'all' 
                                  ? 'cursor-pointer hover:bg-gray-50 hover:shadow-md' 
                                  : ''
                              } ${
                                isSelected && activeTab === 'all' 
                                  ? 'ring-2 ring-blue-500 bg-blue-50 border-l-4 border-l-blue-500' 
                                  : ''
                              }`}
                              onClick={() => {
                                if (activeTab === 'all') {
                                  handlePatientSelect(patient);
                                }
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  {/* Avatar with Queue Number */}
                                  <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                      {patient.queueNumber}
                                    </div>
                                  </div>
                                  
                                  {/* Patient Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="font-medium text-base truncate">
                                        {patient.patient?.firstName || 'N/A'}{' '}
                                        {patient.patient?.middleName ? patient.patient.middleName + ' ' : ''}
                                        {patient.patient?.lastName || 'N/A'}
                                      </p>
                                      <Badge className={`${priorityConfig.color} text-xs ml-2`}>
                                        {priorityConfig.label}
                                      </Badge>
                                    </div>
                                    
                                    <p className="text-xs text-gray-600 mb-2">
                                      MRN: {patient.patient?.patientNumber || 'N/A'} • {patient.patient?.phone || 'N/A'}
                                    </p>
                                    
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatWaitTime(patient.joinedAt)}
                                      </div>
                                      {calculateAge(patient.patient?.dateOfBirth) && (
                                        <div className="flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          {calculateAge(patient.patient?.dateOfBirth)}y
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {patient.appointment?.appointmentTime || 'Walk-in'}
                                      </div>
                                      <Badge 
                                        variant={patient.status === 'WAITING' ? 'secondary' : 'default'}
                                        className="text-xs"
                                      >
                                        {patient.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Next-in-Line Panel - Shown in all tabs */}
                  <div className="lg:col-span-1 flex flex-col min-h-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <div className="space-y-4">
                    <Card className="w-full bg-white shadow-sm border flex-shrink-0">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <Users className="h-5 w-5 text-blue-600" />
                            Next in Line
                          </CardTitle>
                          <CardDescription className="text-xs">
                            View-only: Next 3 patients waiting for examination
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const nextInLinePatients = safePatients
                              .filter(p => p.status === 'WAITING')
                              .sort((a, b) => {
                                const queueA = a.queueNumber || 999;
                                const queueB = b.queueNumber || 999;
                                return queueA - queueB;
                              })
                              .slice(0, 3);

                            if (nextInLinePatients.length === 0) {
                              return (
                                <div className="text-center py-12 text-gray-500">
                                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                  <p className="font-medium">No patients in next 3 positions</p>
                                  <p className="text-sm mt-2">Patients will appear here when waiting in queue</p>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-3">
                                {nextInLinePatients.map((patient, index) => {
                                  const priorityConfig = getPriorityConfig(patient.priorityLabel);
                                  return (
                                    <Card 
                                      key={patient.queueEntryId} 
                                      className={`transition-all ${
                                        index === 0 
                                          ? 'ring-2 ring-blue-500 bg-blue-50/50' 
                                          : 'bg-white'
                                      }`}
                                    >
                                      <CardContent className="p-3">
                                        <div className="flex items-center gap-3">
                                          <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                              index === 0 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-100 text-gray-700'
                                            }`}>
                                              {patient.queueNumber}
                                            </div>
                                            {index === 0 && (
                                              <Badge variant="default" className="text-xs mt-1">
                                                NEXT
                                              </Badge>
                                            )}
                                          </div>
                                          
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h4 className="font-semibold text-sm truncate">
                                                {patient.patient?.firstName || 'N/A'}{' '}
                                                {patient.patient?.lastName || ''}
                                              </h4>
                                              <Badge className={`${priorityConfig.color} text-xs`}>
                                                {priorityConfig.label}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                              <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatWaitTime(patient.joinedAt)}
                                              </span>
                                              {calculateAge(patient.patient?.dateOfBirth) && (
                                                <>
                                                  <span>•</span>
                                                  <span>{calculateAge(patient.patient?.dateOfBirth)}y</span>
                                                </>
                                              )}
                                              <span>•</span>
                                              <Badge 
                                                variant={patient.status === 'WAITING' ? 'secondary' : 'default'}
                                                className="text-[10px] px-1 py-0"
                                              >
                                                {patient.status}
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                                {/* <div className="text-center pt-2 border-t">
                                  <p className="text-xs text-gray-500">
                                    View-only: Next patients in queue
                                  </p>
                                </div> */}
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>

                      {/* In Progress Panel - Below Next in Line */}
                      <Card className="w-full bg-white shadow-sm border flex-shrink-0">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                            <Activity className="h-5 w-5 text-green-600" />
                            In Progress
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Patients currently under examination
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const inProgressPatients = safePatients
                              .filter(p => p.status === 'CALLED' || p.status === 'IN_PROGRESS')
                              .sort((a, b) => {
                                const timeA = new Date(a.inProgressAt || a.joinedAt).getTime();
                                const timeB = new Date(b.inProgressAt || b.joinedAt).getTime();
                                return timeA - timeB;
                              });

                            if (inProgressPatients.length === 0) {
                              return (
                                <div className="text-center py-8 text-gray-500">
                                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                  <p className="font-medium text-sm">No examinations in progress</p>
                                  <p className="text-xs mt-1">Active examinations will appear here</p>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-3">
                                {inProgressPatients.map((patient) => {
                                  const priorityConfig = getPriorityConfig(patient.priorityLabel);
                                  return (
                                    <Card 
                                      key={patient.queueEntryId} 
                                      className="bg-green-50/50 border-green-200"
                                    >
                                      <CardContent className="p-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                                            {patient.queueNumber}
                                          </div>
                                          
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h4 className="font-semibold text-sm truncate">
                                                {patient.patient?.firstName || 'N/A'}{' '}
                                                {patient.patient?.lastName || ''}
                                              </h4>
                                              <Badge className={`${priorityConfig.color} text-xs`}>
                                                {priorityConfig.label}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                              <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatWaitTime(patient.inProgressAt || patient.joinedAt)}
                                              </span>
                                              {calculateAge(patient.patient?.dateOfBirth) && (
                                                <>
                                                  <span>•</span>
                                                  <span>{calculateAge(patient.patient?.dateOfBirth)}y</span>
                                                </>
                                              )}
                                              <span>•</span>
                                              <Badge 
                                                variant={patient.status === 'IN_PROGRESS' ? 'default' : 'secondary'}
                                                className={`text-[10px] px-1 py-0 ${
                                                  patient.status === 'IN_PROGRESS' 
                                                    ? 'bg-green-600 hover:bg-green-700' 
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                              >
                                                {patient.status}
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                                <div className="text-center pt-2 border-t">
                                  <p className="text-xs text-gray-500">
                                    {inProgressPatients.length} patient{inProgressPatients.length !== 1 ? 's' : ''} under examination
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Priority Label Update Modal */}
      <Dialog open={isPriorityModalOpen} onOpenChange={setIsPriorityModalOpen}>
        <DialogContent className="sm:max-w-md" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" />
              Update Priority Label
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-4 py-4">
              {/* Selected Patient Info */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-medium mb-2 text-sm text-gray-700">Selected Patient</h4>
                <p className="text-sm font-semibold">
                  #{selectedPatient.queueNumber} - {' '}
                  {selectedPatient.patient?.firstName || 'N/A'}{' '}
                  {selectedPatient.patient?.middleName ? selectedPatient.patient.middleName + ' ' : ''}
                  {selectedPatient.patient?.lastName || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  MRN: {selectedPatient.patient?.patientNumber || 'N/A'}
                </p>
              </div>

              {/* Priority Label Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority Label</label>
                <Select
                  value={selectedPriorityLabel}
                  onValueChange={setSelectedPriorityLabel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority label" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span 
                            className={`inline-block w-2 h-2 rounded-full ${option.color.split(' ')[0]}`}
                          />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1" 
                  onClick={handlePriorityUpdate}
                  disabled={updatePriorityMutation.isPending}
                >
                  {updatePriorityMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Priority Label'
                  )}
                </Button>

                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleModalClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CurrentQueue;