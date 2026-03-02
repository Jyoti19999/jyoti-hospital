import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, User, Clock, Globe } from 'lucide-react';
import useOphthalmologistStore from '@/stores/ophthalmologist';

const DebugPanel = () => {
  const {
    queueEntries,
    statistics,
    doctorId,
    currentPatient,
    completedConsultations,
    dashboardStats,
    isLoading,
    error,
    lastQueueUpdate,
    fetchQueue,
    fetchCurrentPatient,
    fetchCompletedConsultations,
    fetchDashboardStats
  } = useOphthalmologistStore();

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        fetchQueue(),
        fetchCurrentPatient(),
        fetchCompletedConsultations(),
        fetchDashboardStats()
      ]);
    } catch (error) {
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Debug Panel - Data Status</span>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh All
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current URL and Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              Current URL
            </h4>
            <div className="bg-blue-50 p-2 rounded text-xs font-mono">
              {window.location.pathname}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Status</h4>
            <div className="space-y-2">
              <Badge variant={isLoading ? "default" : "secondary"}>
                {isLoading ? "Loading..." : "Ready"}
              </Badge>
              {error && (
                <Badge variant="destructive">
                  Error: {error}
                </Badge>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Last Update</h4>
            <div className="text-sm text-gray-600">
              {lastQueueUpdate ? new Date(lastQueueUpdate).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>

        {/* Doctor Information */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
            <User className="h-4 w-4 mr-1" />
            Doctor Information
          </h4>
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm">
              <strong>Doctor ID:</strong> {doctorId || 'Not set'}
            </div>
          </div>
        </div>

        {/* Queue Statistics */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">Queue Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="bg-blue-50 p-2 rounded text-center">
              <div className="text-lg font-bold text-blue-600">{statistics.totalPatients || 0}</div>
              <div className="text-xs text-blue-700">Total</div>
            </div>
            <div className="bg-orange-50 p-2 rounded text-center">
              <div className="text-lg font-bold text-orange-600">{statistics.waitingPatients || 0}</div>
              <div className="text-xs text-orange-700">Waiting</div>
            </div>
            <div className="bg-yellow-50 p-2 rounded text-center">
              <div className="text-lg font-bold text-yellow-600">{statistics.inProgressPatients || 0}</div>
              <div className="text-xs text-yellow-700">In Progress</div>
            </div>
            <div className="bg-green-50 p-2 rounded text-center">
              <div className="text-lg font-bold text-green-600">{statistics.completedPatients || 0}</div>
              <div className="text-xs text-green-700">Completed</div>
            </div>
            <div className="bg-gray-50 p-2 rounded text-center">
              <div className="text-lg font-bold text-gray-600">{statistics.onHoldPatients || 0}</div>
              <div className="text-xs text-gray-700">On Hold</div>
            </div>
          </div>
        </div>

        {/* Dashboard Statistics */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">Dashboard Statistics</h4>
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Total Patients Today:</strong> {dashboardStats.totalPatientsToday || 0}
              </div>
              <div>
                <strong>Completed Consultations:</strong> {dashboardStats.completedConsultations || 0}
              </div>
              <div>
                <strong>Urgent Cases:</strong> {dashboardStats.urgentCases || 0}
              </div>
              <div>
                <strong>Waiting Patients:</strong> {dashboardStats.waitingPatients || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Queue Entries */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">Queue Entries ({queueEntries.length})</h4>
          {queueEntries.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
              <p className="text-yellow-800 text-sm">
                No patients assigned to this doctor. This could mean:
              </p>
              <ul className="text-yellow-700 text-xs mt-2 ml-4 list-disc">
                <li>No patients have been assigned by optometrists</li>
                <li>No patients in OPHTHALMOLOGIST queue today</li>
                <li>Doctor ID doesn't match any assignments</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {queueEntries.map((entry, index) => (
                <div key={entry.queueEntryId} className="bg-gray-50 p-2 rounded text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{entry.patient.fullName}</span>
                    <Badge variant={
                      entry.status === 'WAITING' ? 'secondary' :
                      entry.status === 'CALLED' ? 'default' :
                      entry.status === 'IN_PROGRESS' ? 'destructive' : 'outline'
                    }>
                      {entry.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Queue #{entry.queueNumber} | Token: {entry.appointment.tokenNumber}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Patient */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">Current Patient</h4>
          {currentPatient ? (
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="text-sm">
                <strong>Patient:</strong> {currentPatient.patientVisit?.patient?.firstName} {currentPatient.patientVisit?.patient?.lastName}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Token: {currentPatient.patientVisit?.appointment?.tokenNumber}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
              No current patient in consultation
            </div>
          )}
        </div>

        {/* Completed Consultations */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">
            Completed Consultations Today ({completedConsultations.length})
          </h4>
          {completedConsultations.length === 0 ? (
            <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
              No completed consultations today
            </div>
          ) : (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {completedConsultations.slice(0, 3).map((consultation, index) => (
                <div key={consultation.id} className="bg-green-50 p-2 rounded text-xs">
                  <div className="font-medium">{consultation.patientName}</div>
                  <div className="text-gray-600">
                    Completed: {new Date(consultation.completedAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {completedConsultations.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  ... and {completedConsultations.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* API Endpoints Status */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">API Endpoints</h4>
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-xs space-y-1">
              <div>GET /api/v1/ophthalmologist/queue</div>
              <div>GET /api/v1/ophthalmologist/current-patient</div>
              <div>GET /api/v1/ophthalmologist/completed-consultations/today</div>
              <div>GET /api/v1/ophthalmologist/dashboard/stats</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;