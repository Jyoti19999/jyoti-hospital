
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Phone,
  Star,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

// Appointment: { id, date, time, provider: { name, specialty, photo?, rating }, department, location: { name, address }, type, status, reason, servicesProvided?, notes?, cost?, insurance?, documents? }
// AppointmentCardProps: { appointment }

export const AppointmentCard = ({ appointment }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'routine': return 'bg-blue-100 text-blue-800';
      case 'follow-up': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'consultation': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={appointment.provider.photo} />
                <AvatarFallback>
                  {appointment.provider.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold text-lg">{appointment.provider.name}</h3>
                <p className="text-gray-600">{appointment.provider.specialty}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{appointment.provider.rating}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status}
              </Badge>
              <Badge variant="outline" className={getTypeColor(appointment.type)}>
                {appointment.type}
              </Badge>
            </div>
          </div>

          {/* Date and Time */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(appointment.date), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{appointment.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{appointment.department}</span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="font-medium">Reason for Visit:</p>
            <p className="text-gray-700">{appointment.reason}</p>
          </div>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show More Details
              </>
            )}
          </Button>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="pt-4 border-t space-y-4">
              {/* Location Details */}
              <div>
                <h4 className="font-medium mb-2">Location</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{appointment.location.name}</p>
                  <p className="text-gray-600">{appointment.location.address}</p>
                </div>
              </div>

              {/* Services Provided */}
              {appointment.servicesProvided && (
                <div>
                  <h4 className="font-medium mb-2">Services Provided</h4>
                  <div className="flex flex-wrap gap-2">
                    {appointment.servicesProvided.map((service, index) => (
                      <Badge key={index} variant="secondary">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {appointment.notes && (
                <div>
                  <h4 className="font-medium mb-2">Provider Notes</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-gray-700">{appointment.notes}</p>
                  </div>
                </div>
              )}

              {/* Cost and Insurance */}
              {(appointment.cost || appointment.insurance) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointment.cost && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Cost
                      </h4>
                      <p className="text-lg font-semibold">₹{appointment.cost}</p>
                    </div>
                  )}
                  {appointment.insurance && (
                    <div>
                      <h4 className="font-medium mb-2">Insurance</h4>
                      <p>{appointment.insurance}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Documents */}
              {appointment.documents && appointment.documents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Documents</h4>
                  <div className="space-y-2">
                    {appointment.documents.map((doc, index) => (
                      <Button key={index} variant="outline" size="sm" className="mr-2">
                        <FileText className="w-4 h-4 mr-2" />
                        {doc}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Provider
                </Button>
                <Button size="sm" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Follow-up
                </Button>
                <Button size="sm" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
