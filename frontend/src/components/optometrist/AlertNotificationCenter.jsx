import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  X, 
  AlertCircle,
  Timer,
  Baby,
  Users
} from 'lucide-react';
import useOptometristStore from '@/stores/optometrist';

const AlertNotificationCenter = () => {
  const { 
    alertPatients, 
    activePatients,
    clearAlert, 
    clearAllAlerts,
    getPatientStatistics 
  } = useOptometristStore();

  const stats = getPatientStatistics();

  const getAlertIcon = (type) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="h-4 w-4" />;
      case 'extended_wait':
        return <Timer className="h-4 w-4" />;
      case 'child':
        return <Baby className="h-4 w-4" />;
      case 'senior':
        return <Users className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type) => {
    switch (type) {
      case 'emergency':
        return 'destructive';
      case 'extended_wait':
        return 'default';
      default:
        return 'default';
    }
  };

  // Generate real-time alerts for current conditions
  const generateCurrentAlerts = () => {
    const currentAlerts = [];

    // Emergency patients alert
    if (stats.emergency > 0) {
      currentAlerts.push({
        id: 'emergency_patients',
        type: 'emergency',
        title: 'Emergency Patients Waiting',
        message: `${stats.emergency} emergency patients in queue requiring immediate attention`,
        timestamp: new Date().toISOString(),
        persistent: true
      });
    }

    // Long wait time alert
    if (stats.longestWait > 45) {
      currentAlerts.push({
        id: 'long_wait',
        type: 'extended_wait',
        title: 'Extended Wait Times',
        message: `Longest wait time: ${stats.longestWait} minutes. Consider expediting care.`,
        timestamp: new Date().toISOString(),
        persistent: true
      });
    }

    // High queue volume alert
    if (stats.total > 10) {
      currentAlerts.push({
        id: 'high_volume',
        type: 'warning',
        title: 'High Queue Volume',
        message: `${stats.total} patients waiting. Consider calling additional staff.`,
        timestamp: new Date().toISOString(),
        persistent: true
      });
    }

    return currentAlerts;
  };

  const currentAlerts = generateCurrentAlerts();
  const allAlerts = [...alertPatients, ...currentAlerts];

  if (allAlerts.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-700">
            <Bell className="h-5 w-5" />
            <span className="font-medium">All Clear</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            No urgent alerts at this time
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Bell className="h-5 w-5" />
            Alerts & Notifications ({allAlerts.length})
          </CardTitle>
          {alertPatients.length > 0 && (
            <Button 
              onClick={clearAllAlerts}
              size="sm" 
              variant="outline"
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {allAlerts.map((alert) => (
          <Alert 
            key={alert.id} 
            variant={getAlertVariant(alert.type)}
            className="relative"
          >
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <AlertDescription className="font-medium">
                    {alert.title || alert.message}
                  </AlertDescription>
                  {!alert.persistent && (
                    <Button 
                      onClick={() => clearAlert(alert.id)}
                      size="sm"
                      variant="ghost"
                      className="h-auto p-1 hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {alert.title && alert.message && (
                  <AlertDescription className="mt-1 text-sm opacity-90">
                    {alert.message}
                  </AlertDescription>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">
                    {new Date(alert.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {alert.type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};

export default AlertNotificationCenter;