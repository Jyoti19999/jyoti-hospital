// src/components/super-admin/lens/LensManagement.jsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, TrendingUp, History } from 'lucide-react';
import LensList from './LensList';
import LensStockManagement from './LensStockManagement';
import LensAnalytics from './LensAnalytics';

const LensManagement = () => {
  const [activeTab, setActiveTab] = useState('analytics');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lens Management</h1>
            <p className="text-gray-600 mt-1">Manage lens inventory, track stock levels, and monitor usage patterns</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="sticky top-0 z-50 bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-4 -mx-6 px-6 pt-2">
            <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-lg shadow-md border">
              <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <History className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="lenses" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Zap className="w-4 h-4" />
                Lens Inventory
              </TabsTrigger>
              <TabsTrigger value="stock" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <TrendingUp className="w-4 h-4" />
                Stock Management
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="analytics" className="space-y-6">
            <LensAnalytics />
          </TabsContent>

          <TabsContent value="lenses" className="space-y-6">
            <LensList />
          </TabsContent>

          <TabsContent value="stock" className="space-y-6">
            <LensStockManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LensManagement;