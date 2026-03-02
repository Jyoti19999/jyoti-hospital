import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, FileText, Users, Database } from 'lucide-react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import EyeDropReasonManager from '@/components/admin/EyeDropReasonManager';

const AdditionalSettings = () => {
  const [activeTab, setActiveTab] = useState('eyeDropReasons');

  return (
    <SuperAdminLayout pageTitle="Additional Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Additional Settings</h1>
            <p className="text-gray-600 mt-1">Manage system configurations and settings</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-lg shadow-md border mb-6">
            <TabsTrigger value="eyeDropReasons" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Eye className="w-4 h-4" />
              Eye Drop Reasons
            </TabsTrigger>
            <TabsTrigger value="systemConfig" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Database className="w-4 h-4" />
              System Config
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <FileText className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="userSettings" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Users className="w-4 h-4" />
              User Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="eyeDropReasons">
            <EyeDropReasonManager />
          </TabsContent>

          <TabsContent value="systemConfig">
            <Card className="shadow-sm border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-gray-900">System Configuration</CardTitle>
                <CardDescription className="text-gray-600">Configure system-wide settings and parameters</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600">System configuration settings will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card className="shadow-sm border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-gray-900">Templates Management</CardTitle>
                <CardDescription className="text-gray-600">Manage document and notification templates</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600">Template management will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="userSettings">
            <Card className="shadow-sm border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-gray-900">User Settings</CardTitle>
                <CardDescription className="text-gray-600">Manage user preferences and configurations</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600">User settings management will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
};

export default AdditionalSettings;
