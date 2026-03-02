import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, FileText, Calendar, Home } from 'lucide-react';

const PostOpMonitoring = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Post-Op Monitoring</h1>
                <p className="text-sm text-slate-600">Post-Operative Care & Recovery</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="recovery" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-lg shadow-sm border">
            <TabsTrigger value="recovery" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Heart className="h-4 w-4 mr-2" />
              Recovery Status
            </TabsTrigger>
            <TabsTrigger value="discharge" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              Discharge Planning
            </TabsTrigger>
            <TabsTrigger value="followup" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Calendar className="h-4 w-4 mr-2" />
              Follow-up
            </TabsTrigger>
            <TabsTrigger value="homecare" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
              <Home className="h-4 w-4 mr-2" />
              Home Care
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recovery" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-green-600" />
                  <span>Recovery Status Monitoring</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Recovery monitoring interface will be implemented</p>
                  <p className="text-sm">Features: Vital signs tracking, pain assessment, complications monitoring</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discharge" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span>Discharge Planning</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Discharge planning interface will be implemented</p>
                  <p className="text-sm">Features: Medical summary, IOL card, instructions, final billing</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="followup" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span>Follow-up Scheduling</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Follow-up scheduling interface will be implemented</p>
                  <p className="text-sm">Features: Appointment booking, reminder system, progress tracking</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="homecare" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Home className="h-5 w-5 text-green-600" />
                  <span>Home Care Instructions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Home care instructions interface will be implemented</p>
                  <p className="text-sm">Features: Care guidelines, medication reminders, emergency contacts</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PostOpMonitoring;