import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Clock, 
  Eye, 
  TrendingUp,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  Timer,
  User
} from 'lucide-react';
import useQueueStore from '@/stores/ohms/queueStore';
import useOphthalmologistStore from '@/stores/ohms/ophthalmologistStore';

const QueueStatus = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { 
    optometristQueue,
    ophthalmologistQueue,
    nextInLineOptometrist,
    nextInLineOphthalmologist,
    getQueueStatistics,
    lastQueueUpdate
  } = useQueueStore();
  
  const { 
    getConsultationStatistics 
  } = useOphthalmologistStore();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const optometryStats = getQueueStatistics('optometrist');
  const ophthalmologyStats = getQueueStatistics('ophthalmologist');
  const consultationStats = getConsultationStatistics();

  const getPriorityColor = (priority) => {
    if (priority <= 3) return 'bg-red-500';
    if (priority <= 6) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getPriorityLabel = (priority) => {
    if (priority <= 3) return 'High';
    if (priority <= 6) return 'Medium';
    return 'Normal';
  };

  const formatWaitTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getWaitingTime = (addedTime) => {
    const waitingMinutes = Math.floor((Date.now() - addedTime) / (1000 * 60));
    return formatWaitTime(waitingMinutes);
  };

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
                <h1 className="text-xl font-bold text-slate-800">Live Queue Status</h1>
                <p className="text-sm text-slate-600">Real-time Patient Queue Information</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                <Clock className="h-3 w-3 mr-1" />
                {currentTime.toLocaleTimeString()}
              </Badge>
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Optometry Queue</p>
                  <p className="text-3xl font-bold">{optometryStats.waiting}</p>
                  <p className="text-sm text-blue-100">Waiting</p>
                </div>
                <Eye className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Ophthalmology Queue</p>
                  <p className="text-3xl font-bold">{ophthalmologyStats.waiting}</p>
                  <p className="text-sm text-purple-100">Waiting</p>
                </div>
                <Users className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Active Consultations</p>
                  <p className="text-3xl font-bold">{consultationStats.active}</p>
                  <p className="text-sm text-green-100">In Progress</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Avg Wait Time</p>
                  <p className="text-3xl font-bold">{Math.round((optometryStats.averageWaitTime + ophthalmologyStats.averageWaitTime) / 2)}m</p>
                  <p className="text-sm text-orange-100">Minutes</p>
                </div>
                <Timer className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Tabs */}
        <Tabs defaultValue="optometry" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-lg shadow-sm border">
            <TabsTrigger 
              value="optometry" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Eye className="h-4 w-4 mr-2" />
              Optometry ({optometryStats.waiting})
            </TabsTrigger>
            <TabsTrigger 
              value="ophthalmology" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="h-4 w-4 mr-2" />
              Ophthalmology ({ophthalmologyStats.waiting})
            </TabsTrigger>
            <TabsTrigger 
              value="next-in-line" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Next in Line
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="optometry" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Queue Overview */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <span>Queue Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Patients</span>
                      <span className="font-semibold">{optometryStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Waiting</span>
                      <span className="font-semibold text-blue-600">{optometryStats.waiting}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">In Progress</span>
                      <span className="font-semibold text-green-600">{optometryStats.inProgress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg Wait</span>
                      <span className="font-semibold text-orange-600">{Math.round(optometryStats.averageWaitTime)}m</span>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Queue Progress</span>
                      <span>{optometryStats.total > 0 ? Math.round((optometryStats.inProgress / optometryStats.total) * 100) : 0}%</span>
                    </div>
                    <Progress 
                      value={optometryStats.total > 0 ? (optometryStats.inProgress / optometryStats.total) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Patient List */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>Current Queue</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {optometristQueue.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {optometristQueue.map((patient, index) => (
                        <Card key={patient.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-semibold">{patient.patientInfo.name}</h4>
                                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                                    <span>{patient.token}</span>
                                    <span>•</span>
                                    <span>Waiting: {getWaitingTime(patient.addedTime)}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${getPriorityColor(patient.priority)}`}></div>
                                <Badge variant="secondary" className="text-xs">
                                  {getPriorityLabel(patient.priority)}
                                </Badge>
                                <Badge 
                                  variant={patient.status === 'waiting' ? 'outline' : 'default'}
                                  className="text-xs capitalize"
                                >
                                  {patient.status}
                                </Badge>
                              </div>
                            </div>
                            
                            {patient.priorityDescription && (
                              <div className="mt-2 text-xs text-gray-500">
                                {patient.priorityDescription}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No patients in optometry queue</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="ophthalmology" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Queue Overview */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <span>Queue Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Patients</span>
                      <span className="font-semibold">{ophthalmologyStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Waiting</span>
                      <span className="font-semibold text-purple-600">{ophthalmologyStats.waiting}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">In Progress</span>
                      <span className="font-semibold text-green-600">{ophthalmologyStats.inProgress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Under Observation</span>
                      <span className="font-semibold text-orange-600">{consultationStats.underObservation}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Patient List */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Current Queue</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ophthalmologistQueue.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {ophthalmologistQueue.map((patient, index) => (
                        <Card key={patient.id} className="border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full text-purple-600 font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-semibold">{patient.patientInfo.name}</h4>
                                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                                    <span>{patient.token}</span>
                                    <span>•</span>
                                    <span>Waiting: {getWaitingTime(patient.addedTime)}</span>
                                    {patient.fromOptometrist && (
                                      <>
                                        <span>•</span>
                                        <span className="text-blue-600">From Optometry</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${getPriorityColor(patient.priority)}`}></div>
                                <Badge variant="secondary" className="text-xs">
                                  {getPriorityLabel(patient.priority)}
                                </Badge>
                                <Badge 
                                  variant={patient.status === 'waiting' ? 'outline' : 'default'}
                                  className="text-xs capitalize"
                                >
                                  {patient.status}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No patients in ophthalmology queue</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="next-in-line" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Optometry Next */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <span>Next in Line - Optometry</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {nextInLineOptometrist.length > 0 ? (
                    <div className="space-y-3">
                      {nextInLineOptometrist.map((patient, index) => (
                        <Card key={patient.id} className={`border-2 ${index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              <div className={`flex items-center justify-center w-8 h-8 ${index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'} rounded-full font-semibold text-sm`}>
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{patient.patientInfo.name}</h4>
                                <div className="flex items-center space-x-3 text-sm text-gray-600">
                                  <span>{patient.token}</span>
                                  <span>•</span>
                                  <span>Est. wait: {formatWaitTime(patient.estimatedWaitTime)}</span>
                                </div>
                              </div>
                              {index === 0 && (
                                <Badge className="bg-blue-500 text-white">
                                  Next
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No patients next in line</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Ophthalmology Next */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Next in Line - Ophthalmology</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {nextInLineOphthalmologist.length > 0 ? (
                    <div className="space-y-3">
                      {nextInLineOphthalmologist.map((patient, index) => (
                        <Card key={patient.id} className={`border-2 ${index === 0 ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              <div className={`flex items-center justify-center w-8 h-8 ${index === 0 ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'} rounded-full font-semibold text-sm`}>
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold">{patient.patientInfo.name}</h4>
                                <div className="flex items-center space-x-3 text-sm text-gray-600">
                                  <span>{patient.token}</span>
                                  <span>•</span>
                                  <span>Est. wait: {formatWaitTime(patient.estimatedWaitTime)}</span>
                                </div>
                              </div>
                              {index === 0 && (
                                <Badge className="bg-purple-500 text-white">
                                  Next
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No patients next in line</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500 mt-8">
          Last updated: {new Date(lastQueueUpdate).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default QueueStatus;