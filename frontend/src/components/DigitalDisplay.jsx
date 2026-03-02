
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, Monitor, User, Clock, ArrowRight, Eye, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import useOptometristStore from "@/stores/optometrist";

// DisplayMessage: { id, type, patientName?, queueNumber?, doctorName?, roomNumber?, message?, timestamp, displayDuration, isActive, floor }

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const DigitalDisplay = () => {
  const [displayMessages, setDisplayMessages] = useState([
    {
      id: "1",
      type: "patient_call",
      patientName: "Snehal Deshmukh",
      queueNumber: 3,
      doctorName: "Dr. Abhijeet Agre",
      roomNumber: "101",
      timestamp: "2024-01-15T10:45:00",
      displayDuration: 30,
      isActive: true,
      floor: "First Floor"
    },
    {
      id: "2",
      type: "announcement",
      message: "Please maintain silence in the waiting area. Thank you for your cooperation.",
      timestamp: "2024-01-15T10:40:00",
      displayDuration: 45,
      isActive: true,
      floor: "All Floors"
    },
    {
      id: "3",
      type: "queue_update",
      message: "Current waiting time: 15-20 minutes for new patients",
      timestamp: "2024-01-15T10:30:00",
      displayDuration: 60,
      isActive: true,
      floor: "Ground Floor"
    }
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const { nextInLinePatients } = useOptometristStore();

  // Queue statistics
  const [queueStats, setQueueStats] = useState({
    waiting: 0,
    inProgress: 0,
    avgWaitTime: 0
  });

  // Fetch queue statistics
  useEffect(() => {
    const fetchQueueStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/queue-status?queueFor=OPHTHALMOLOGIST`, {
          credentials: 'include'
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const queueData = result.data;
            
            // Calculate statistics
            const waiting = queueData.filter(q => q.status === 'WAITING').length;
            const inProgress = queueData.filter(q => q.status === 'IN_PROGRESS' || q.status === 'CALLED').length;
            
            // Calculate average wait time (in minutes)
            const waitingPatients = queueData.filter(q => q.status === 'WAITING');
            let avgWaitTime = 0;
            if (waitingPatients.length > 0) {
              const totalWaitTime = waitingPatients.reduce((sum, patient) => {
                const waitTime = Math.floor((new Date() - new Date(patient.joinedAt)) / 60000);
                return sum + waitTime;
              }, 0);
              avgWaitTime = Math.round(totalWaitTime / waitingPatients.length);
            }

            setQueueStats({
              waiting,
              inProgress,
              avgWaitTime
            });
          }
        }
      } catch (error) {
      }
    };

    fetchQueueStats();
    
    // Refresh queue stats every 30 seconds
    const interval = setInterval(fetchQueueStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const addPatientCall = (patientName, queueNumber, doctorName, roomNumber, floor) => {
    const newMessage = {
      id: Date.now().toString(),
      type: "patient_call",
      patientName,
      queueNumber,
      doctorName,
      roomNumber,
      timestamp: new Date().toISOString(),
      displayDuration: 30,
      isActive: true,
      floor
    };

    setDisplayMessages(prev => [newMessage, ...prev]);
    
    if (audioEnabled) {
      // Simulate audio announcement
      toast.success(`Audio: "${patientName}, Queue Number ${queueNumber}, please proceed to ${doctorName} in Room ${roomNumber}"`);
    }
  };

  const addAnnouncement = (message, floor = "All Floors", duration = 45) => {
    const newMessage = {
      id: Date.now().toString(),
      type: "announcement",
      message,
      timestamp: new Date().toISOString(),
      displayDuration: duration,
      isActive: true,
      floor
    };

    setDisplayMessages(prev => [newMessage, ...prev]);
    toast.success("Announcement added to display boards");
  };

  const dismissMessage = (messageId) => {
    setDisplayMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, isActive: false } : msg
      )
    );
  };

  const getMessageTypeColor = (type) => {
    switch (type) {
      case "patient_call": return "bg-blue-100 text-blue-800 border-blue-200";
      case "announcement": return "bg-green-100 text-green-800 border-green-200";
      case "emergency": return "bg-red-100 text-red-800 border-red-200";
      case "queue_update": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case "patient_call": return <User className="h-5 w-5" />;
      case "announcement": return <Volume2 className="h-5 w-5" />;
      case "emergency": return <Eye className="h-5 w-5" />;
      case "queue_update": return <Clock className="h-5 w-5" />;
      default: return <Monitor className="h-5 w-5" />;
    }
  };

  const activeMessages = displayMessages.filter(msg => msg.isActive);

  return (
    <div className="space-y-6">
      {/* Digital Display Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Display Board */}
        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="h-6 w-6" />
                <span>Main Display Board</span>
              </div>
              <div className="text-sm font-normal opacity-90">
                {currentTime.toLocaleTimeString()}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Dr. Abhijeet Agre Eye Institute</h2>
              <p className="text-blue-200">Agre Vision Care Centre, Pune</p>
            </div>

            {/* Current Patient Calls */}
            <div className="space-y-3">
              {activeMessages
                .filter(msg => msg.type === "patient_call")
                .slice(0, 3)
                .map((msg) => (
                  <div key={msg.id} className="bg-white/10 backdrop-blur rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-400 text-blue-900 rounded-full flex items-center justify-center font-bold">
                          {msg.queueNumber}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{msg.patientName}</p>
                          <p className="text-blue-200 text-sm">{msg.doctorName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-400">Room {msg.roomNumber}</p>
                        <p className="text-blue-200 text-sm">{msg.floor}</p>
                      </div>
                    </div>
                    <div className="flex items-center mt-2 text-yellow-400">
                      <ArrowRight className="h-4 w-4 mr-1" />
                      <span className="text-sm">Please proceed to consultation room</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Current Announcements */}
            {activeMessages
              .filter(msg => msg.type === "announcement" || msg.type === "queue_update")
              .slice(0, 2)
              .map((msg) => (
                <div key={msg.id} className="bg-green-500/20 backdrop-blur rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Volume2 className="h-4 w-4 text-green-300 mt-1" />
                    <p className="text-green-100 text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}

            {activeMessages.filter(msg => msg.type === "patient_call").length === 0 && (
              <div className="text-center py-8 text-blue-200">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active patient calls</p>
                <p className="text-sm">Patient calls will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department-Specific Display */}
        <Card className="bg-gradient-to-br from-green-700 to-green-600 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Stethoscope className="h-6 w-6" />
                <span>Department Display</span>
              </div>
              <Badge variant="outline" className="text-green-100 border-green-300">
                First Floor
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-1">Ophthalmology Department</h3>
              <p className="text-green-200">Dr. Abhijeet Agre | Dr. Siddharth Deshmukh | Dr. Vikram Jadhav</p>
            </div>

            {/* Queue Status */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{queueStats.waiting}</p>
                <p className="text-green-200 text-sm">Waiting</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{queueStats.inProgress}</p>
                <p className="text-green-200 text-sm">In Progress</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{queueStats.avgWaitTime}m</p>
                <p className="text-green-200 text-sm">Avg Wait</p>
              </div>
            </div>

            {/* Department-specific calls */}
            <div className="space-y-2">
              {activeMessages
                .filter(msg => msg.type === "patient_call" && msg.floor === "First Floor")
                .map((msg) => (
                  <div key={msg.id} className="bg-white/10 backdrop-blur rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{msg.patientName}</p>
                        <p className="text-green-200 text-sm">{msg.doctorName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-300">#{msg.queueNumber}</p>
                        <p className="text-green-200 text-sm">Room {msg.roomNumber}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="bg-yellow-500/20 backdrop-blur rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-yellow-300" />
                <p className="text-yellow-100 text-sm">
                  Patients with dilation: Please wait for callback after 20-30 minutes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Display Control Panel */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              <span>Display Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={audioEnabled ? "bg-green-50 text-green-700" : ""}
              >
                <Volume2 className="h-4 w-4 mr-1" />
                Audio {audioEnabled ? "On" : "Off"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => addPatientCall("Aniket Patil", 5, "Dr. Abhijeet Agre", "101", "First Floor")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <User className="h-4 w-4 mr-2" />
              Test Patient Call
            </Button>
            
            <Button
              onClick={() => addAnnouncement("Please maintain social distancing in all waiting areas")}
              className="bg-green-600 hover:bg-green-700"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Add Announcement
            </Button>
            
            <Button
              onClick={() => addAnnouncement("Current waiting time updated: 25-30 minutes", "Ground Floor")}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Clock className="h-4 w-4 mr-2" />
              Update Wait Time
            </Button>
          </div>

          {/* Next-in-Line Display for Optometry Waiting Area */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 mb-3">Optometry Waiting Area - Next in Line</h3>
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Next in Line for Optometry Check-up
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nextInLinePatients.length === 0 ? (
                  <div className="text-center py-6 text-blue-600">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No patients currently in queue</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {nextInLinePatients.map((patient, index) => (
                      <div key={patient.id} className={`p-4 rounded-lg border ${
                        index === 0 
                          ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-400' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                              index === 0 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg">{patient.name}</h4>
                              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                <Badge className="bg-blue-600 text-white">
                                  {patient.token}
                                </Badge>
                                <span>Age {patient.age}</span>
                                <span className="capitalize">{patient.visitType.replace('_', ' ')}</span>
                              </div>
                            </div>
                          </div>
                          {index === 0 && (
                            <div className="flex flex-col items-center">
                              <Badge className="bg-green-600 text-white mb-1 px-3 py-1">
                                NEXT
                              </Badge>
                              <p className="text-xs text-blue-600 text-center">
                                Please be ready
                              </p>
                            </div>
                          )}
                        </div>
                        {index === 0 && patient.priority <= 3 && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-xs text-red-700 font-medium">
                              ⚠️ Priority Case: Please proceed immediately when called
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 text-center">
                  <p className="text-xs text-blue-600">
                    Display updates automatically • Current time: {currentTime.toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Messages Management */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Active Display Messages</h3>
            <div className="space-y-3">
              {activeMessages.map((message) => (
                <div key={message.id} className={`border rounded-lg p-4 ${getMessageTypeColor(message.type)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getMessageIcon(message.type)}
                      <div className="flex-1">
                        {message.type === "patient_call" ? (
                          <div>
                            <p className="font-semibold">
                              {message.patientName} (Queue #{message.queueNumber})
                            </p>
                            <p className="text-sm opacity-75">
                              {message.doctorName} - Room {message.roomNumber} ({message.floor})
                            </p>
                          </div>
                        ) : (
                          <p className="font-medium">{message.message}</p>
                        )}
                        <div className="flex items-center space-x-3 text-xs opacity-75 mt-1">
                          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                          <span>Duration: {message.displayDuration}s</span>
                          <span>{message.floor}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissMessage(message.id)}
                      className="opacity-75 hover:opacity-100"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DigitalDisplay;
