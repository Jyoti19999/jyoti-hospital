
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Clock, CheckCircle, User, Stethoscope, UserCheck, 
  Calendar, Phone, Mail, MapPin, Shield, Activity 
} from "lucide-react";

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const StaffDashboard = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch staff from database
  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/super-admin/staff`, {
        credentials: 'include'
      });
      
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch staff');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Transform database staff to component format
        const staffData = result.data.staff || result.data || [];
        const transformedStaff = staffData.map(s => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          role: s.staffType,
          department: s.department || 'N/A',
          floor: 'N/A', // Can be added to database if needed
          status: s.isActive ? 'online' : 'offline',
          shift: '09:00 - 17:00', // Can be added to database if needed
          checkInTime: null, // Will be populated from attendance
          email: s.email || 'N/A',
          phone: s.phone || 'N/A',
          specialization: getSpecialization(s),
          patientsToday: 0, // Can be calculated from visits
          experience: 'N/A' // Can be calculated from joiningDate
        }));
        
        setStaff(transformedStaff);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const getSpecialization = (staffMember) => {
    // Extract specialization from profile based on staff type
    if (staffMember.doctorProfile) {
      return staffMember.doctorProfile.specialization || 'General Practice';
    }
    if (staffMember.optometristProfile) {
      return 'Eye Examination & Refraction';
    }
    if (staffMember.nurseProfile) {
      return 'Patient Care & Support';
    }
    return staffMember.staffType;
  };



  const getStatusColor = (status) => {
    switch (status) {
      case "online": return "bg-green-100 text-green-800";
      case "busy": return "bg-yellow-100 text-yellow-800";
      case "offline": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "online": return <CheckCircle className="h-4 w-4" />;
      case "busy": return <Clock className="h-4 w-4" />;
      case "offline": return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleIcon = (role) => {
    switch (role.toLowerCase()) {
      case "ophthalmologist":
      case "optometrist":
        return <Stethoscope className="h-5 w-5 text-blue-600" />;
      case "nurse":
        return <UserCheck className="h-5 w-5 text-green-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  // Doctor types include all medical professionals (matching database values)
  const doctorTypes = [
    'doctor', 
    'ophthalmologist', 
    'optometrist', 
    'surgeon', 
    'anesthesiologist'
  ];
  
  const doctors = staff.filter(s => 
    doctorTypes.some(type => s.role.toLowerCase().includes(type))
  );
  
  const supportStaff = staff.filter(s => 
    !doctorTypes.some(type => s.role.toLowerCase().includes(type))
  );

  const totalStaff = staff.length;
  const onlineStaff = staff.filter(s => s.status === "online").length;
  const busyStaff = staff.filter(s => s.status === "busy").length;
  const totalPatientsToday = staff.reduce((sum, s) => sum + s.patientsToday, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Staff Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-3xl font-bold text-gray-900">{totalStaff}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online</p>
                <p className="text-3xl font-bold text-green-600">{onlineStaff}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Busy</p>
                <p className="text-3xl font-bold text-yellow-600">{busyStaff}</p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Patients Today</p>
                <p className="text-3xl font-bold text-purple-600">{totalPatientsToday}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="doctors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
  value="doctors"
  className="data-[state=active]:bg-[rgb(61,119,245)] data-[state=active]:text-white"
>
  Doctors
</TabsTrigger>

<TabsTrigger
  value="support"
  className="data-[state=active]:bg-[rgb(61,119,245)] data-[state=active]:text-white"
>
  Support Staff
</TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" className="space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                <span>Medical Staff</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={`/placeholder-avatar-${doctor.id}.jpg`} />
                          <AvatarFallback>
                            {doctor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                          <p className="text-sm text-gray-600">{doctor.role}</p>
                          <p className="text-sm text-gray-500">{doctor.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(doctor.status)}>
                          {getStatusIcon(doctor.status)}
                          <span className="ml-1">{doctor.status}</span>
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{doctor.floor}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{doctor.shift}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{doctor.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{doctor.email}</span>
                      </div>
                    </div>

                    {doctor.specialization && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Specialization:</p>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-sm">
                        <span className="font-medium">Experience: </span>
                        <span className="text-gray-600">{doctor.experience}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Patients Today: </span>
                        <span className="text-blue-600 font-semibold">{doctor.patientsToday}</span>
                      </div>
                    </div>

                    {doctor.checkInTime && (
                      <div className="text-sm text-green-600">
                        <span className="font-medium">Checked in: </span>
                        {doctor.checkInTime}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span>Support Staff</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {supportStaff.map((member) => (
                  <div key={member.id} className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={`/placeholder-avatar-${member.id}.jpg`} />
                          <AvatarFallback>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">{member.name}</h3>
                          <p className="text-sm text-gray-600">{member.role}</p>
                          <p className="text-sm text-gray-500">{member.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(member.status)}>
                          {getStatusIcon(member.status)}
                          <span className="ml-1">{member.status}</span>
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{member.floor}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{member.shift}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{member.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    </div>

                    {member.specialization && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Responsibilities:</p>
                        <p className="text-sm text-gray-600">{member.specialization}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-sm">
                        <span className="font-medium">Experience: </span>
                        <span className="text-gray-600">{member.experience}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">
                          {member.role === "Receptionist" ? "Registrations" : "Transactions"} Today: 
                        </span>
                        <span className="text-green-600 font-semibold ml-1">{member.patientsToday}</span>
                      </div>
                    </div>

                    {member.checkInTime && (
                      <div className="text-sm text-green-600">
                        <span className="font-medium">Checked in: </span>
                        {member.checkInTime}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  );
};

export default StaffDashboard;
