// src/components/dashboard/RecentRegistrationsCard.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Phone, Mail, Calendar, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const RecentRegistrationsCard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isToday, setIsToday] = useState(false);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/dashboard/recent-registrations`, {
        credentials: 'include'
      });


      if (!response.ok) {
        const errorText = await response.text();
        throw new Error('Failed to fetch registrations');
      }

      const result = await response.json();

      if (result.success) {
        setPatients(result.data || []);
        setIsToday(result.isToday || false);
      }
    } catch (error) {
      // Don't throw - just set empty array
      setPatients([]);
      setIsToday(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    // Refresh every 2 minutes
    const interval = setInterval(fetchRegistrations, 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span>Recent Registrations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading registrations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-purple-600" />
          <span>Recent Registrations</span>
          <Badge variant={isToday ? "default" : "outline"} className={isToday ? "bg-green-100 text-green-800" : ""}>
            {isToday ? `${patients.length} Today` : 'Latest 5'}
          </Badge>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRegistrations}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {patients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No patient registrations found
          </div>
        ) : (
          <div className="h-full overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="p-3 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {patient.firstName?.[0]}{patient.middleName?.[0] || ''}{patient.lastName?.[0]}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {patient.firstName} {patient.middleName ? patient.middleName + ' ' : ''}{patient.lastName}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {patient.mrn && <span>MRN: {patient.mrn}</span>}
                        {patient.patientNumber && <span>#{patient.patientNumber}</span>}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {patient.gender || 'N/A'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  {patient.phone && (
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      <span>{patient.phone}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                  {patient.dateOfBirth && (
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>DOB: {format(new Date(patient.dateOfBirth), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      Reg: {format(new Date(patient.createdAt), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentRegistrationsCard;
