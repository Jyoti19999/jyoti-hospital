import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Eye, Clock, User, Users, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';

const TodaysSurgeriesCard = () => {
  // Use TanStack Query for real-time surgery updates
  const { data: surgeries = [], isLoading, refetch } = useQuery({
    queryKey: ['dashboard-todays-surgeries'],
    queryFn: dashboardService.getTodaysSurgeries,
    refetchInterval: 15000, // Refetch every 15 seconds
    refetchOnWindowFocus: true,
    staleTime: 10000,
    cacheTime: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            <span>Today's Scheduled Surgeries</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading surgeries...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Stethoscope className="h-5 w-5 text-blue-600" />
          <span>Today's Scheduled Surgeries</span>
          <Badge variant="outline">{surgeries.length}</Badge>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <Eye className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {surgeries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No surgeries scheduled for today</div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-2 pr-2">
              {surgeries.map((surgery) => (
                <div key={surgery.id} className="p-3 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-gray-900">
                        {surgery.patient.firstName} {surgery.patient.lastName}
                      </span>
                      <Badge variant="outline" className="text-xs py-0 px-1.5">
                        {surgery.patient.patientNumber || surgery.patient.mrn}
                      </Badge>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs py-0 px-2">
                      {surgery.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {surgery.surgeryTypeDetail && (
                    <p className="font-medium text-sm text-gray-900 mb-1.5">
                      {surgery.surgeryTypeDetail.name}
                      {surgery.surgeryTypeDetail.code && (
                        <span className="text-xs text-gray-500 ml-1.5">
                          ({surgery.surgeryTypeDetail.code})
                        </span>
                      )}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-600 mb-1">
                    {surgery.surgeon && (
                      <div className="flex items-center">
                        <Stethoscope className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">Dr. {surgery.surgeon.lastName}</span>
                      </div>
                    )}
                    {surgery.anesthesiologist && (
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">Dr. {surgery.anesthesiologist.lastName}</span>
                      </div>
                    )}
                    {surgery.sister && (
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{surgery.sister.firstName} {surgery.sister.lastName}</span>
                      </div>
                    )}
                    {surgery.surgeryDate && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>
                          {format(new Date(surgery.surgeryDate), 'hh:mm a')}
                          {surgery.tentativeTime && ` (${surgery.tentativeTime})`}
                        </span>
                      </div>
                    )}
                  </div>

                  {surgery.expectedDuration && (
                    <div className="text-xs text-gray-500">
                      Duration: {surgery.expectedDuration} min
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodaysSurgeriesCard;
