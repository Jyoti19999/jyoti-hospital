
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, Eye, ArrowRight, Timer, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// QueueItem: { id, patientName, patientNumber, queueNumber, doctorName, department, estimatedWaitTime, actualWaitTime, status, joinedTime, calledTime?, priorityLevel, queueType }
// QueueManagementProps: { isEmbedded? }

const QueueManagement = ({ isEmbedded = false }) => {
  const [queueItems, setQueueItems] = useState([
    {
      id: "1",
      patientName: "Snehal Deshmukh",
      patientNumber: "OPH2024001",
      queueNumber: 1,
      doctorName: "Dr. Abhijeet Agre (Ophthalmologist)",
      department: "General Eye Care",
      estimatedWaitTime: 5,
      actualWaitTime: 8,
      status: "in-consultation",
      joinedTime: "2024-01-15T09:25:00",
      calledTime: "2024-01-15T09:30:00",
      priorityLevel: 1,
      queueType: "consultation"
    },
    {
      id: "2",
      patientName: "Vikram Jadhav",
      patientNumber: "OPH2024002",
      queueNumber: 2,
      doctorName: "Dr. Siddharth Deshmukh (Senior Ophthalmologist)",
      department: "Retina",
      estimatedWaitTime: 15,
      actualWaitTime: 12,
      status: "dilation-waiting",
      joinedTime: "2024-01-15T10:00:00",
      calledTime: "2024-01-15T10:15:00",
      priorityLevel: 2,
      queueType: "post-dilation"
    },
    {
      id: "3",
      patientName: "Priya Jadhav",
      patientNumber: "OPH2024003",
      queueNumber: 3,
      doctorName: "Dr. Vikram Jadhav (Retina Specialist)",
      department: "Cataract",
      estimatedWaitTime: 20,
      actualWaitTime: 0,
      status: "waiting",
      joinedTime: "2024-01-15T10:30:00",
      priorityLevel: 1,
      queueType: "consultation"
    },
    {
      id: "4",
      patientName: "Aniket Patil",
      patientNumber: "OPH2024004",
      queueNumber: 4,
      doctorName: "Dr. Aniket Patil (Cornea Specialist)",
      department: "Glaucoma",
      estimatedWaitTime: 25,
      actualWaitTime: 0,
      status: "waiting",
      joinedTime: "2024-01-15T10:45:00",
      priorityLevel: 3,
      queueType: "follow-up"
    }
  ]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Update actual wait times
      setQueueItems(prev => prev.map(item => {
        if (item.status === "waiting") {
          const waitMinutes = Math.floor((Date.now() - new Date(item.joinedTime).getTime()) / (1000 * 60));
          return { ...item, actualWaitTime: waitMinutes };
        }
        return item;
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const callNextPatient = (doctorName) => {
    const nextPatient = queueItems
      .filter(item => item.doctorName === doctorName && item.status === "waiting")
      .sort((a, b) => a.queueNumber - b.queueNumber)[0];

    if (nextPatient) {
      setQueueItems(prev => prev.map(item =>
        item.id === nextPatient.id
          ? { ...item, status: "called", calledTime: new Date().toISOString() }
          : item
      ));
      toast.success(`${nextPatient.patientName} (Queue #${nextPatient.queueNumber}) has been called for consultation`);
    }
  };

  const markInConsultation = (patientId) => {
    setQueueItems(prev => prev.map(item =>
      item.id === patientId
        ? { ...item, status: "in-consultation" }
        : item
    ));
  };

  const markDilationWaiting = (patientId) => {
    const patient = queueItems.find(item => item.id === patientId);
    if (patient) {
      setQueueItems(prev => prev.map(item =>
        item.id === patientId
          ? { 
              ...item, 
              status: "dilation-waiting", 
              queueType: "post-dilation",
              joinedTime: new Date().toISOString() // Reset wait time for dilation queue
            }
          : item
      ));
      toast.info(`${patient.patientName} has been moved to dilation waiting queue (20-30 min wait)`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "waiting": return "bg-blue-100 text-blue-800";
      case "called": return "bg-yellow-100 text-yellow-800";
      case "in-consultation": return "bg-green-100 text-green-800";
      case "dilation-waiting": return "bg-purple-100 text-purple-800";
      case "post-dilation": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getQueueTypeColor = (type) => {
    switch (type) {
      case "consultation": return "bg-blue-50 border-blue-200";
      case "post-dilation": return "bg-purple-50 border-purple-200";
      case "follow-up": return "bg-green-50 border-green-200";
      default: return "bg-gray-50 border-gray-200";
    }
  };

  const getPriorityIcon = (level) => {
    if (level >= 3) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (level === 2) return <Timer className="h-4 w-4 text-orange-500" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const doctors = [...new Set(queueItems.map(item => item.doctorName))];

  if (isEmbedded) {
    return (
      <div className="space-y-4">
        {queueItems.slice(0, 4).map((item) => (
          <div key={item.id} className={`border rounded-lg p-3 ${getQueueTypeColor(item.queueType)}`}>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">#{item.queueNumber}</span>
                  <span className="font-medium">{item.patientName}</span>
                  {getPriorityIcon(item.priorityLevel)}
                </div>
                <p className="text-sm text-gray-600">{item.doctorName}</p>
              </div>
              <div className="text-right">
                <Badge className={getStatusColor(item.status)}>
                  {item.status.replace('-', ' ')}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  Wait: {item.actualWaitTime}m
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Controls */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Queue Management Controls</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => {
              const waitingPatients = queueItems.filter(item => 
                item.doctorName === doctor && item.status === "waiting"
              ).length;
              const inConsultation = queueItems.filter(item => 
                item.doctorName === doctor && item.status === "in-consultation"
              ).length;

              return (
                <div key={doctor} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{doctor}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Waiting: {waitingPatients}</span>
                      <span>In consultation: {inConsultation}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => callNextPatient(doctor)}
                    disabled={waitingPatients === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Call Next Patient
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Queue Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Consultation Queue */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <span>Consultation Queue</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {queueItems
                .filter(item => item.queueType === "consultation")
                .sort((a, b) => a.queueNumber - b.queueNumber)
                .map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-lg">#{item.queueNumber}</span>
                          <span className="font-medium">{item.patientName}</span>
                          {getPriorityIcon(item.priorityLevel)}
                        </div>
                        <p className="text-sm text-gray-600">{item.doctorName}</p>
                        <p className="text-xs text-gray-500">{item.department}</p>
                      </div>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Wait Time:</span>
                        <span className={item.actualWaitTime > item.estimatedWaitTime ? "text-red-600" : "text-green-600"}>
                          {item.actualWaitTime}m / {item.estimatedWaitTime}m
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((item.actualWaitTime / item.estimatedWaitTime) * 100, 100)} 
                        className="h-2"
                      />
                    </div>

                    {item.status === "called" && (
                      <div className="space-y-2">
                        <Button
                          onClick={() => markInConsultation(item.id)}
                          className="w-full bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          Mark In Consultation
                        </Button>
                      </div>
                    )}

                    {item.status === "in-consultation" && (
                      <Button
                        onClick={() => markDilationWaiting(item.id)}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        size="sm"
                      >
                        Send to Dilation Queue
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Dilation Queue */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Timer className="h-5 w-5 text-purple-600" />
              <span>Dilation Queue</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {queueItems
                .filter(item => item.queueType === "post-dilation")
                .map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2 bg-purple-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">{item.patientName}</span>
                        <p className="text-sm text-gray-600">{item.doctorName}</p>
                        <p className="text-xs text-gray-500">
                          Dilation time: {item.actualWaitTime}m
                        </p>
                      </div>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className={item.actualWaitTime >= 20 ? "text-green-600 font-medium" : "text-orange-600"}>
                          {item.actualWaitTime >= 20 ? "Ready for re-examination" : `Wait ${20 - item.actualWaitTime}m more`}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((item.actualWaitTime / 20) * 100, 100)} 
                        className="h-2"
                      />
                    </div>

                    {item.actualWaitTime >= 20 && (
                      <Button
                        onClick={() => callNextPatient(item.doctorName)}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        size="sm"
                      >
                        Call for Re-examination
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Follow-up Queue */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span>Follow-up Queue</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {queueItems
                .filter(item => item.queueType === "follow-up")
                .map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2 bg-green-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.patientName}</span>
                          {getPriorityIcon(item.priorityLevel)}
                        </div>
                        <p className="text-sm text-gray-600">{item.doctorName}</p>
                        <p className="text-xs text-gray-500">Follow-up appointment</p>
                      </div>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span>Wait: {item.actualWaitTime}m</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QueueManagement;
