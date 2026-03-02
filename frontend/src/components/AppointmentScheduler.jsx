
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Eye, Phone, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// Appointment: { id, patientName, patientPhone, doctorName, department, date, time, type, status, estimatedDuration, waitTime? }
// AppointmentSchedulerProps: { isEmbedded? }

const AppointmentScheduler = ({ isEmbedded = false }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch today's appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/dashboard/todays-appointments`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch appointments');

      const result = await response.json();
      if (result.success) {
        // Transform API data to match component format
        const transformedAppointments = result.data.map(apt => {
          // Try to get doctor from appointment.doctor first, then from patientVisit queue assignment
          let assignedDoctor = apt.doctor;
          
          if (!assignedDoctor && apt.patientVisit?.patientQueue?.[0]?.assignedStaff) {
            assignedDoctor = apt.patientVisit.patientQueue[0].assignedStaff;
          }
          
          
          return {
            id: apt.id,
            patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
            patientPhone: apt.patient.phone || apt.patient.phoneNumber || '',
            doctorName: assignedDoctor ? `Dr. ${assignedDoctor.firstName} ${assignedDoctor.lastName}` : 'Not assigned',
            doctorSpecialty: assignedDoctor ? assignedDoctor.staffType || assignedDoctor.specialization || '' : '',
            department: apt.appointmentType || apt.purpose || 'General',
            date: format(new Date(apt.appointmentDate), 'yyyy-MM-dd'),
            time: format(new Date(apt.appointmentDate), 'HH:mm'),
            type: 'offline',
            status: apt.status.toLowerCase().replace('_', '-'),
            estimatedDuration: 30
          };
        });
        setAppointments(transformedAppointments);
      }
    } catch (error) {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Refresh every 2 minutes
    const interval = setInterval(fetchAppointments, 120000);
    return () => clearInterval(interval);
  }, []);

  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    doctorName: "",
    department: "",
    date: "",
    time: "",
    type: "offline",
    estimatedDuration: 15
  });

  const doctors = [
    { name: "Dr. Abhijeet Agre (Ophthalmologist)", department: "General Eye Care", floor: "Ground Floor" },
    { name: "Dr. Siddharth Deshmukh (Senior Ophthalmologist)", department: "Retina", floor: "First Floor" },
    { name: "Dr. Vikram Jadhav (Retina Specialist)", department: "Cataract", floor: "First Floor" },
    { name: "Dr. Aniket Patil (Cornea Specialist)", department: "Glaucoma", floor: "Second Floor" },
    { name: "Dr. Pravin Shinde (Pediatric Ophthalmologist)", department: "Cornea", floor: "Second Floor" }
  ];

  const departments = ["General Eye Care", "Cornea", "Glaucoma", "Cataract", "Retina", "Oculoplasty", "Strabismus"];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newAppointment = {
      id: Date.now().toString(),
      patientName: formData.patientName,
      patientPhone: formData.patientPhone,
      doctorName: formData.doctorName,
      department: formData.department,
      date: formData.date,
      time: formData.time,
      type: formData.type,
      status: "scheduled",
      estimatedDuration: formData.estimatedDuration
    };

    setAppointments([...appointments, newAppointment]);
    
    // Reset form
    setFormData({
      patientName: "",
      patientPhone: "",
      doctorName: "",
      department: "",
      date: "",
      time: "",
      type: "offline",
      estimatedDuration: 15
    });

    toast.success(`Appointment scheduled for ${newAppointment.patientName} on ${newAppointment.date} at ${newAppointment.time}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type) => {
    return type === "online" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800";
  };

  if (isEmbedded) {
    return (
      <div className="space-y-4">
        {appointments.slice(0, 3).map((appointment) => (
          <div key={appointment.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{appointment.patientName}</h4>
                <p className="text-sm text-gray-600">{appointment.doctorName}</p>
              </div>
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{appointment.time}</span>
              </div>
              <Badge variant="outline" className={getTypeColor(appointment.type)}>
                {appointment.type}
              </Badge>
            </div>
            {appointment.waitTime && (
              <div className="flex items-center space-x-2 text-sm text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span>Delayed by {appointment.waitTime} minutes</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Form */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Schedule Appointment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="patientPhone">Patient Phone</Label>
                <Input
                  id="patientPhone"
                  type="tel"
                  value={formData.patientPhone}
                  onChange={(e) => setFormData({...formData, patientPhone: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="doctorName">Doctor</Label>
                <Select value={formData.doctorName} onValueChange={(value) => setFormData({...formData, doctorName: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors
                      .filter(doctor => !formData.department || doctor.department === formData.department)
                      .map((doctor) => (
                        <SelectItem key={doctor.name} value={doctor.name}>
                          {doctor.name} - {doctor.floor}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Booking Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData({...formData, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offline">Offline (Reception)</SelectItem>
                      <SelectItem value="online">Online (Website)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select 
                    value={formData.estimatedDuration.toString()} 
                    onValueChange={(value) => setFormData({...formData, estimatedDuration: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>Today's Appointments</span>
              <Badge variant="outline">{appointments.length}</Badge>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchAppointments}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No appointments scheduled for today</div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <div className="space-y-3 pr-2">
                  {appointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-gray-900">{appointment.patientName}</h3>
                        <p className="text-xs text-gray-600">
                          {appointment.doctorName}
                          {appointment.doctorSpecialty && ` (${appointment.doctorSpecialty})`}
                        </p>
                        <p className="text-xs text-gray-500">{appointment.department}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge className={`${getStatusColor(appointment.status)} text-xs py-0 px-2`}>
                          {appointment.status}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {appointment.estimatedDuration} min
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{new Date(appointment.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span>{appointment.time}</span>
                        </div>
                        {appointment.patientPhone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{appointment.patientPhone}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className={`${getTypeColor(appointment.type)} text-xs py-0 px-2`}>
                        {appointment.type}
                      </Badge>
                    </div>

                    {appointment.waitTime && (
                      <div className="flex items-center space-x-2 text-xs text-orange-600 bg-orange-50 p-1.5 rounded">
                        <AlertCircle className="h-3 w-3" />
                        <span>Patient delayed by {appointment.waitTime} minutes beyond scheduled time</span>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
