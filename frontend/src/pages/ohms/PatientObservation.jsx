import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Clock, TestTube, AlertCircle } from 'lucide-react';

const PatientObservation = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Patient Observation</h1>
                <p className="text-sm text-slate-600">Monitor Under-Observation Patients</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dilation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-lg shadow-sm border">
            <TabsTrigger value="dilation" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Clock className="h-4 w-4 mr-2" />
              Dilation Queue
            </TabsTrigger>
            <TabsTrigger value="tests" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <TestTube className="h-4 w-4 mr-2" />
              Test Results
            </TabsTrigger>
            <TabsTrigger value="ready" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <AlertCircle className="h-4 w-4 mr-2" />
              Ready for Review
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Eye className="h-4 w-4 mr-2" />
              Active Monitoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dilation" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span>Patients Under Dilation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Dilation observation interface will be implemented</p>
                  <p className="text-sm">Features: Timer tracking, pupil dilation status, ready alerts</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TestTube className="h-5 w-5 text-orange-600" />
                  <span>Awaiting Test Results</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <TestTube className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Test results monitoring interface will be implemented</p>
                  <p className="text-sm">Features: Lab results integration, status tracking, alerts</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ready" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <span>Ready for Doctor Review</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Ready patients interface will be implemented</p>
                  <p className="text-sm">Features: Priority alerts, completion status, call-in system</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-orange-600" />
                  <span>Active Monitoring Dashboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Real-time monitoring interface will be implemented</p>
                  <p className="text-sm">Features: Live status updates, automated reminders, workflow tracking</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientObservation;