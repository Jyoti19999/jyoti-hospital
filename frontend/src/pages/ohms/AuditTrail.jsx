import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileText, Users, Activity } from 'lucide-react';

const AuditTrail = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Audit Trail</h1>
                <p className="text-sm text-slate-600">Comprehensive System Auditing & Compliance</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="financial" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-lg shadow-sm border">
            <TabsTrigger value="financial" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              Financial Audit
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              Security Audit
            </TabsTrigger>
            <TabsTrigger value="clinical" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Clinical Audit
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              System Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-red-600" />
                  <span>Financial Audit Logs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Financial audit interface will be implemented</p>
                  <p className="text-sm">Features: Transaction logs, billing accuracy, payment processing audit</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span>Security Audit Logs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Security audit interface will be implemented</p>
                  <p className="text-sm">Features: Access controls, authentication logs, data protection compliance</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clinical" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-red-600" />
                  <span>Clinical Audit Logs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Clinical audit interface will be implemented</p>
                  <p className="text-sm">Features: Patient handoffs, diagnostic steps, equipment usage logs</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-red-600" />
                  <span>System Activity Logs</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>System activity interface will be implemented</p>
                  <p className="text-sm">Features: Queue changes, staff actions, system modifications, error logs</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AuditTrail;