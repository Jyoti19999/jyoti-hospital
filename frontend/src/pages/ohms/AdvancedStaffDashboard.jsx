import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, Bell, BarChart3 } from 'lucide-react';

const AdvancedStaffDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Advanced Staff Dashboard</h1>
                <p className="text-sm text-slate-600">Comprehensive Staff Management & Controls</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="queue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-lg shadow-sm border">
            <TabsTrigger value="queue" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Queue Management
            </TabsTrigger>
            <TabsTrigger value="overrides" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" />
              Priority Overrides
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Staff Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <span>Advanced Queue Controls</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Advanced queue management interface will be implemented</p>
                  <p className="text-sm">Features: Multi-department queues, staff assignments, workflow optimization</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overrides" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-indigo-600" />
                  <span>Priority Override Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Priority override interface will be implemented</p>
                  <p className="text-sm">Features: Manual priority adjustments, emergency escalation, audit trails</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-indigo-600" />
                  <span>Staff Notification Center</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Staff notification interface will be implemented</p>
                  <p className="text-sm">Features: Priority alerts, system reminders, workflow notifications</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <span>Staff Performance Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Staff analytics interface will be implemented</p>
                  <p className="text-sm">Features: Workload distribution, efficiency metrics, performance tracking</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvancedStaffDashboard;