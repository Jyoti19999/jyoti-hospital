import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import QRCodeDisplay from '@/components/appointments/QRCodeDisplay';
import TokenBadge from '@/components/appointments/TokenBadge';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  QrCode,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import useAppointmentStore from '@/stores/appointment';

const AppointmentHistoryProfile = ({ uid }) => {
  const { 
    getUpcomingAppointments, 
    getAppointmentHistory,
    getActiveAppointment 
  } = useAppointmentStore();
  
  const upcomingAppointments = getUpcomingAppointments();
  const appointmentHistory = getAppointmentHistory();
  const activeAppointment = getActiveAppointment();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'booked':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'checked-in':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'booked':
        return 'secondary';
      case 'checked-in':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2024-01-01 ${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Patient UID Display */}
      {uid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              <span>Patient Identification</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">Patient UID</p>
                <p className="text-lg font-mono font-bold text-gray-900">{uid}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(uid)}>
                Copy UID
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current/Active Appointment with QR Code */}
      {activeAppointment && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <span>Current Appointment</span>
              <TokenBadge 
                token={activeAppointment.token} 
                size="sm" 
                showStage={true}
                showPriority={true}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Appointment Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{activeAppointment.appointmentData.doctor}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{formatDate(activeAppointment.appointmentData.date)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{formatTime(activeAppointment.appointmentData.time)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{activeAppointment.appointmentData.department}</span>
                </div>
                <Badge variant={getStatusVariant(activeAppointment.status)} className="flex items-center space-x-1 w-fit">
                  {getStatusIcon(activeAppointment.status)}
                  <span className="capitalize">{activeAppointment.status}</span>
                </Badge>
              </div>

              {/* QR Code Display */}
              <div>
                <QRCodeDisplay
                  qrCode={activeAppointment.qrCode}
                  barcode={activeAppointment.barcode}
                  token={activeAppointment.token}
                  uid={activeAppointment.uid}
                  size="medium"
                  showDownload={true}
                  showCopy={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <span>Upcoming Appointments</span>
              <Badge variant="secondary">{upcomingAppointments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment, index) => (
                <div key={appointment.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{appointment.appointmentData.doctor}</span>
                        </div>
                        <TokenBadge 
                          token={appointment.token} 
                          size="xs" 
                          showStage={true}
                        />
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>{formatDate(appointment.appointmentData.date)}</span>
                        <span>{formatTime(appointment.appointmentData.time)}</span>
                        <span>{appointment.appointmentData.department}</span>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(appointment.status)} className="flex items-center space-x-1">
                      {getStatusIcon(appointment.status)}
                      <span className="capitalize">{appointment.status}</span>
                    </Badge>
                  </div>
                  {index < upcomingAppointments.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment History */}
      {appointmentHistory.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5 text-gray-600" />
              <span>Appointment History</span>
              <Badge variant="outline">{appointmentHistory.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointmentHistory.map((appointment, index) => (
                <div key={appointment.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{appointment.appointmentData.doctor}</span>
                        </div>
                        <TokenBadge 
                          token={appointment.token} 
                          size="xs" 
                        />
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>{formatDate(appointment.appointmentData.date)}</span>
                        <span>{formatTime(appointment.appointmentData.time)}</span>
                        <span>{appointment.appointmentData.department}</span>
                      </div>
                      {appointment.completedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Completed on {formatDate(appointment.completedAt)}
                        </p>
                      )}
                    </div>
                    <Badge variant={getStatusVariant(appointment.status)} className="flex items-center space-x-1">
                      {getStatusIcon(appointment.status)}
                      <span className="capitalize">{appointment.status}</span>
                    </Badge>
                  </div>
                  {index < appointmentHistory.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        !activeAppointment && upcomingAppointments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Yet</h3>
              <p className="text-gray-600 mb-4">
                You haven't booked any appointments yet. Get started by booking your first appointment.
              </p>
              <Button className="inline-flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Book Appointment</span>
              </Button>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default AppointmentHistoryProfile;