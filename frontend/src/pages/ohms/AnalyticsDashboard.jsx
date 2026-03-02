import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Clock, DollarSign } from 'lucide-react';

const AnalyticsDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Analytics Dashboard</h1>
                <p className="text-sm text-slate-600">Hospital Performance & Business Intelligence</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="flow" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-lg shadow-sm border">
            <TabsTrigger value="flow" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Patient Flow
            </TabsTrigger>
            <TabsTrigger value="efficiency" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Clock className="h-4 w-4 mr-2" />
              Efficiency Metrics
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <DollarSign className="h-4 w-4 mr-2" />
              Revenue Analytics
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Business Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flow" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>Patient Flow Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Patient flow analytics interface will be implemented</p>
                  <p className="text-sm">Features: Flow patterns, bottleneck identification, capacity utilization</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>Efficiency Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Efficiency metrics interface will be implemented</p>
                  <p className="text-sm">Features: Wait time analysis, staff productivity, resource optimization</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <span>Revenue Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Revenue analytics interface will be implemented</p>
                  <p className="text-sm">Features: Revenue trends, service profitability, payment analysis</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Business Intelligence</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Business intelligence interface will be implemented</p>
                  <p className="text-sm">Features: Predictive analytics, trend forecasting, strategic insights</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;