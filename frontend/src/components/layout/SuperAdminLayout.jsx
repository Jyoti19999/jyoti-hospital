import React, { useEffect, useState } from 'react';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import SuperAdminSidebar from './SuperAdminSidebar';
import NotificationCenter from '@/components/NotificationCenter';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Eye } from 'lucide-react';

const SuperAdminLayout = ({ children, pageTitle = "Dashboard" }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <SidebarProvider>
        <div className="flex w-full min-h-screen">
          <SuperAdminSidebar />
          <SidebarInset className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <header className="sticky top-0 bg-white shadow-lg border-b border-slate-200 z-50 w-full flex-shrink-0">
              <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center space-x-3">
                    <SidebarTrigger className="-ml-1" />
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-slate-800">OptiCare Hospital</h1>
                      <p className="text-sm text-slate-600">Institute of Ophthalmology & Laser Center</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Breadcrumb>
                      <BreadcrumbList>
                        <BreadcrumbItem>
                          <BreadcrumbLink href="#" className="text-muted-foreground">
                            Hospital Admin
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage className="font-semibold text-slate-800">
                            {pageTitle}
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-medium text-slate-800">
                        {currentTime.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {currentTime.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                    </div>
                    <NotificationCenter />
                  </div>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-auto bg-gradient-to-br from-blue-50 via-white to-indigo-50">
              <div className="p-8">
                {children}
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default SuperAdminLayout;
