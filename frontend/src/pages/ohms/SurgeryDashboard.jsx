import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scissors, Calendar, ClipboardList, Activity } from 'lucide-react';

const SurgeryDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                <Scissors className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Surgery Dashboard</h1>
                <p className="text-sm text-slate-600">Surgery Scheduling & Management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-lg shadow-sm border">
            <TabsTrigger value="schedule" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="preop" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <ClipboardList className="h-4 w-4 mr-2" />
              Pre-Op
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Scissors className="h-4 w-4 mr-2" />
              Active Surgeries
            </TabsTrigger>
            <TabsTrigger value="recovery" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              Recovery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span>Surgery Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Surgery scheduling interface will be implemented</p>
                  <p className="text-sm">Features: Calendar view, slot management, patient assignment</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preop" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-purple-600" />
                  <span>Pre-Operative Preparation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Pre-operative checklist interface will be implemented</p>
                  <p className="text-sm">Features: Biometry, lab tests, consent forms, IOL selection</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scissors className="h-5 w-5 text-purple-600" />
                  <span>Active Surgeries</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Scissors className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Active surgery monitoring interface will be implemented</p>
                  <p className="text-sm">Features: Real-time status, procedure tracking, staff assignments</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recovery" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <span>Recovery Monitoring</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Recovery monitoring interface will be implemented</p>
                  <p className="text-sm">Features: Vital signs, discharge readiness, complications tracking</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SurgeryDashboard;