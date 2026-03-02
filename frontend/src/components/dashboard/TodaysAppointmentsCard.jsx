import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, Clock, User, Phone } from 'lucide-react';
import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const TodaysAppointmentsCard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/todays-appointments`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch appointments');

      const result = await response.json();
      if (result.success) {
        setAppointments(result.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Refresh every minute
    const interval = setInterval(fetchAppointments, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CHECKED_IN': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      case 'RESCHEDULED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <span>Today's Appointments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading appointments...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-green-600" />
          <span>Today's Appointments</span>
          <Badge variant="outline">{appointments.length}</Badge>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchAppointments}>
          <Eye className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No appointments scheduled for today</div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {appointment.patient.patientNumber || appointment.patient.mrn}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(appointment.appointmentDate), 'hh:mm a')}
                    </span>
                    {appointment.doctor && (
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
                      </span>
                    )}
                    {appointment.patient.phone && (
                      <span className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {appointment.patient.phone}
                      </span>
                    )}
                  </div>
                  {appointment.appointmentType && (
                    <div className="text-xs text-gray-500 mt-1">
                      Type: {appointment.appointmentType}
                    </div>
                  )}
                </div>
                <Badge className={`${getStatusColor(appointment.status)} border`}>
                  {appointment.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodaysAppointmentsCard;
