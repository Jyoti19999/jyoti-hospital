import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, UserPlus, Tags, LayoutDashboard } from 'lucide-react';
import RegisterStaff from '@/components/super-admin/RegisterStaff';
import AddStaffType from '@/components/super-admin/AddStaffType';

const StaffManagement = () => {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      <header className="bg-white shadow-lg border-b border-slate-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Staff Management</h1>
                <p className="text-sm text-slate-600">Register staff and manage staff types</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/superadmin-profile">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Back to Profile</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="register" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Register Staff
              </TabsTrigger>
              <TabsTrigger value="types" className="flex items-center gap-2">
                <Tags className="w-4 h-4" />
                Add Staff Type
              </TabsTrigger>
            </TabsList>

            <TabsContent value="register">
              <RegisterStaff />
            </TabsContent>

            <TabsContent value="types">
              <AddStaffType />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
