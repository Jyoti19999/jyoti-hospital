import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Users, 
  Clock, 
  CheckCircle, 
  User,
  Phone,
  Calendar,
  MapPin,
  Eye,
  UserCheck,
  QrCode
} from 'lucide-react';
import useCheckInStore from '@/stores/ohms/checkInStore';
import useQueueStore from '@/stores/ohms/queueStore';
import { useToast } from '@/hooks/use-toast';

const StaffCheckIn = () => {
  const [activeTab, setActiveTab] = useState('search-patient');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState('ready');

  const { toast } = useToast();
  const { 
    staffCheckIn, 
    getTodaysCheckIns,
    getCheckInStatistics
  } = useCheckInStore();
  
  const { 
    addToOptometristQueue,
    getQueueStatistics
  } = useQueueStore();

  // Mock patient search - in real app would query backend
  const searchPatients = (query) => {
    if (!query.trim()) return [];
    
    // Mock patient data for demonstration
    const mockPatients = [
      {
        patientId: 'PAT-001',
        token: 'A1-1234',
        patientInfo: {
          name: 'John Doe',
          phone: '+91 9876543210',
          email: 'john.doe@email.com',
          age: 35
        },
        appointmentDetails: {
          department: 'optometry',
          doctorName: 'Dr. Smith',
          date: new Date().toISOString().split('T')[0],
          time: '10:00 AM',
          appointmentType: 'routine'
        }
      },
      {
        patientId: 'PAT-002',
        token: 'A2-5678',
        patientInfo: {
          name: 'Jane Smith',
          phone: '+91 9876543211',
          email: 'jane.smith@email.com',
          age: 28
        },
        appointmentDetails: {
          department: 'optometry',
          doctorName: 'Dr. Johnson',
          date: new Date().toISOString().split('T')[0],
          time: '11:00 AM',
          appointmentType: 'follow-up'
        }
      },
      {
        patientId: 'PAT-003',
        token: 'A1-9999',
        patientInfo: {
          name: 'Robert Wilson',
          phone: '+91 9876543212',
          email: 'robert.wilson@email.com',
          age: 65
        },
        appointmentDetails: {
          department: 'optometry',
          doctorName: 'Dr. Smith',
          date: new Date().toISOString().split('T')[0],
          time: '09:30 AM',
          appointmentType: 'review'
        }
      }
    ];
    
    return mockPatients.filter(patient => 
      patient.patientInfo.name.toLowerCase().includes(query.toLowerCase()) ||
      patient.patientInfo.phone.includes(query) ||
      patient.token.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handlePatientCheckIn = async (patient) => {
    setCheckInStatus('processing');
    
    try {
      // Staff check-in
      const checkInRecord = staffCheckIn(patient, 'STAFF-001', 'optometry');
      
      // Add to optometrist queue
      const queueEntry = addToOptometristQueue({
        patientId: patient.patientId,
        token: patient.token,
        patientInfo: patient.patientInfo,
        appointmentDetails: patient.appointmentDetails
      });
      
      setCheckInStatus('success');
      setSelectedPatient(null);
      setSearchQuery('');
      
      toast({
        title: "Patient Checked In",
        description: `${patient.patientInfo.name} has been successfully checked in and added to the queue.`,
      });
      
      setTimeout(() => {
        setCheckInStatus('ready');
      }, 3000);
      
    } catch (error) {
      setCheckInStatus('error');
      toast({
        title: "Check-in Failed",
        description: "Unable to check in patient. Please try again.",
        variant: "destructive",
      });
      
      setTimeout(() => {
        setCheckInStatus('ready');
      }, 3000);
    }
  };

  const searchResults = searchPatients(searchQuery);
  const todaysCheckIns = getTodaysCheckIns('optometry');
  const checkInStats = getCheckInStatistics('optometry');
  const queueStats = getQueueStatistics('optometry');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Staff Check-in Interface</h1>
                <p className="text-sm text-slate-600">Manual Patient Check-in and Queue Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                <Clock className="h-3 w-3 mr-1" />
                {new Date().toLocaleTimeString()}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Today's Check-ins</p>
                  <p className="text-2xl font-bold text-green-600">{checkInStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Queue Length</p>
                  <p className="text-2xl font-bold text-blue-600">{queueStats.waiting}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Avg Wait Time</p>
                  <p className="text-2xl font-bold text-orange-600">{Math.round(queueStats.averageWaitTime)}m</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">In Consultation</p>
                  <p className="text-2xl font-bold text-purple-600">{queueStats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-lg shadow-sm border">
            <TabsTrigger 
              value="search-patient" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Search className="h-4 w-4 mr-2" />
              Search Patient
            </TabsTrigger>
            <TabsTrigger 
              value="view-queue" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="h-4 w-4 mr-2" />
              View Queue
            </TabsTrigger>
            <TabsTrigger 
              value="todays-checkins" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Today's Check-ins
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="search-patient" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  <span>Patient Search & Check-in</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Search by Name, Phone, or Token
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter patient name, phone number, or appointment token..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-lg py-3"
                    />
                  </div>
                  
                  {/* Search Results */}
                  {searchQuery && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-700">Search Results</h4>
                      {searchResults.length > 0 ? (
                        <div className="space-y-3">
                          {searchResults.map((patient) => (
                            <Card key={patient.patientId} className="border-l-4 border-l-blue-500">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-4">
                                      <div>
                                        <h4 className="font-semibold text-lg">{patient.patientInfo.name}</h4>
                                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                          <span className="flex items-center">
                                            <Phone className="h-3 w-3 mr-1" />
                                            {patient.patientInfo.phone}
                                          </span>
                                          <span className="flex items-center">
                                            <QrCode className="h-3 w-3 mr-1" />
                                            {patient.token}
                                          </span>
                                          <span className="flex items-center">
                                            <User className="h-3 w-3 mr-1" />
                                            Age {patient.patientInfo.age}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                      <div className="flex items-center">
                                        <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                        <span>{patient.appointmentDetails.date} at {patient.appointmentDetails.time}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <User className="h-3 w-3 mr-1 text-gray-400" />
                                        <span>{patient.appointmentDetails.doctorName}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                        <span className="capitalize">{patient.appointmentDetails.department}</span>
                                      </div>
                                      <div>
                                        <Badge variant="secondary" className="text-xs">
                                          {patient.appointmentDetails.appointmentType}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Button 
                                    onClick={() => handlePatientCheckIn(patient)}
                                    disabled={checkInStatus === 'processing'}
                                    className="ml-4"
                                  >
                                    {checkInStatus === 'processing' ? (
                                      <>
                                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        Check In
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No patients found matching your search</p>
                          <p className="text-sm">Try searching by name, phone number, or appointment token</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {checkInStatus === 'success' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Patient has been successfully checked in and added to the optometry queue.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="view-queue" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Current Optometry Queue</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Queue view will be implemented with real-time updates</p>
                  <p className="text-sm">This will show current queue status and patient positions</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="todays-checkins" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>Today's Check-ins ({checkInStats.total})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaysCheckIns.length > 0 ? (
                  <div className="space-y-3">
                    {todaysCheckIns.map((checkIn) => (
                      <Card key={checkIn.id} className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{checkIn.patientInfo.name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span>{checkIn.token}</span>
                                <span>{new Date(checkIn.checkInTime).toLocaleTimeString()}</span>
                                <span className="capitalize">{checkIn.method.replace('-', ' ')}</span>
                              </div>
                            </div>
                            <Badge 
                              variant={checkIn.status === 'checked-in' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {checkIn.status.replace('-', ' ')}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No check-ins recorded today</p>
                    <p className="text-sm">Check-ins will appear here as patients arrive</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffCheckIn;