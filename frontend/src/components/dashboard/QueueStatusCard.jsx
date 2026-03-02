import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, AlertCircle, Activity, RefreshCw, Eye } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { socket } from '@/lib/socket';
import { useEffect } from 'react';

const QueueStatusCard = ({ onViewQueue }) => {
  const queryClient = useQueryClient();

  // Use TanStack Query for queue updates
  const { data: queueData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['dashboard-queue-status'],
    queryFn: dashboardService.getQueueStatus,
    staleTime: 30000, // Data stays fresh for 30 seconds
    // No polling - using WebSocket for real-time updates
  });

  // WebSocket real-time updates
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
      return;
    }


    // Join both queue rooms to monitor all queues
    socket.emit('queue:join-ophthalmologist');
    socket.emit('queue:join-optometrist');

    // Listen for queue updates
    const handleQueueUpdate = (data) => {
      queryClient.invalidateQueries(['dashboard-queue-status']);
      queryClient.invalidateQueries(['dashboard-combined']);
      refetch();
    };

    // Listen for queue reordered events
    const handleQueueReordered = (data) => {
      queryClient.invalidateQueries(['dashboard-queue-status']);
      queryClient.invalidateQueries(['dashboard-combined']);
      refetch();
    };

    // Listen for patient assigned
    const handlePatientAssigned = (data) => {
      queryClient.invalidateQueries(['dashboard-queue-status']);
      queryClient.invalidateQueries(['dashboard-combined']);
      refetch();
    };

    socket.on('queue:updated', handleQueueUpdate);
    socket.on('queue:reordered', handleQueueReordered);
    socket.on('queue:patient-assigned', handlePatientAssigned);


    return () => {
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('queue:reordered', handleQueueReordered);
      socket.off('queue:patient-assigned', handlePatientAssigned);
    };
  }, [socket.connected, queryClient, refetch]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'WAITING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CALLED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'WAITING': return <Clock className="h-3 w-3" />;
      case 'CALLED': return <AlertCircle className="h-3 w-3" />;
      case 'IN_PROGRESS': return <Activity className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const calculateWaitTime = (joinedAt) => {
    if (!joinedAt) return 'N/A';
    const now = new Date();
    const waitStart = new Date(joinedAt);
    const waitMinutes = Math.floor((now - waitStart) / (1000 * 60));
    
    if (waitMinutes < 60) return `${waitMinutes}m`;
    const hours = Math.floor(waitMinutes / 60);
    const minutes = waitMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const renderQueueList = (queue) => {
    if (isLoading && !queueData) {
      return (
        <div className="text-center py-8 text-gray-500 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading queue...
        </div>
      );
    }

    if (!queue || queue.length === 0) {
      return <div className="text-center py-8 text-gray-500">No patients in queue</div>;
    }

    // Sort queue by queueNumber to maintain order
    const sortedQueue = [...queue].sort((a, b) => a.queueNumber - b.queueNumber);

    return (
      <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="space-y-3">
          {sortedQueue.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant="outline" className="text-xs font-bold">
                    #{item.queueNumber}
                  </Badge>
                  <span className="font-semibold text-gray-900">
                    {item.patient.firstName} {item.patient.lastName}
                  </span>
                  
                  {item.priority > 0 && (
                    <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                      Priority
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  <span className="font-medium">MRN: {item.patient.mrn || item.patient.patientNumber || 'N/A'}</span>
                  
                  {/* Display Token Number */}
                  {item.appointment?.tokenNumber && (
                    <span className="flex items-center text-blue-600 font-medium">
                      <Badge variant="outline" className="text-xs">
                        Token: {item.appointment.tokenNumber}
                      </Badge>
                    </span>
                  )}
                  
                  {/* Display Waiting Time */}
                  <span className="flex items-center text-orange-600 font-medium">
                    <Clock className="h-3 w-3 mr-1" />
                    Wait: {calculateWaitTime(item.joinedAt)}
                  </span>
                  
                  {item.assignedStaff && (
                    <span>
                      Assigned: {item.assignedStaff.firstName} {item.assignedStaff.lastName}
                    </span>
                  )}
                  
                  {item.estimatedWaitTime && (
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      ETA: {item.estimatedWaitTime} min
                    </span>
                  )}
                </div>
              </div>
              <Badge className={`${getStatusColor(item.status)} border flex items-center space-x-1`}>
                {getStatusIcon(item.status)}
                <span>{item.status.replace('_', ' ')}</span>
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ophthalmologist Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Ophthalmologist Queue</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-lg">
                {queueData?.OPHTHALMOLOGIST?.length || 0}
              </Badge>
              <Button 
                size="sm" 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => onViewQueue?.('ophthalmologist')}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderQueueList(queueData?.OPHTHALMOLOGIST)}
        </CardContent>
      </Card>

      {/* Optometrist Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <span>Optometrist Queue</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-lg">
                {queueData?.OPTOMETRIST?.length || 0}
              </Badge>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => onViewQueue?.('optometrist')}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderQueueList(queueData?.OPTOMETRIST)}
        </CardContent>
      </Card>
    </div>
  );
};

export default QueueStatusCard;
