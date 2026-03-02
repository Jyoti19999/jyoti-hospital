import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import ProfileTab from "@/components/ProfileTab";
import StaffSalaryLeave from "@/components/StaffSalaryLeave";
import Loader from "@/components/loader/Loader";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import DashboardHeader from '@/components/reuseable-components/DashboardHeader';
import { Wrench, CheckCircle, Clock, Activity, User, ChevronRight, ClipboardList } from 'lucide-react';

const TechnicianDashboard = () => {
  const { user, logout, fetchStaffProfile } = useAuth();
  const navigate = useNavigate();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileFetched, setProfileFetched] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showStatsCards, setShowStatsCards] = useState(true);

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hasCompleteProfile = (user) => {
    return user && (
      user.dateOfBirth || 
      user.address || 
      user.emergencyContact ||
      user.qualifications ||
      user.certifications
    );
  };

  useEffect(() => {
    const loadCompleteProfile = async () => {
      if (user && user.employeeId && !hasCompleteProfile(user) && !profileFetched) {
        setProfileLoading(true);
        setProfileFetched(true);
        try {
          await fetchStaffProfile();
        } catch (error) {
          console.error('Profile fetch error:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    if (user) {
      loadCompleteProfile();
    }
  }, [user?.id, fetchStaffProfile]);

  const handleCheckInToggle = () => setIsCheckedIn(!isCheckedIn);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/staff-auth');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const stats = [
    {
      title: "Equipment Maintained",
      value: 0,
      icon: Wrench,
      color: "bg-[#3B82F6]",
      description: "This month"
    },
    {
      title: "Pending Tasks",
      value: 0,
      icon: ClipboardList,
      color: "bg-[#F97316]",
      description: "Awaiting completion"
    },
    {
      title: "Completed Today",
      value: 0,
      icon: CheckCircle,
      color: "bg-[#22C55E]",
      description: "Tasks finished"
    },
    {
      title: "Avg Response Time",
      value: "0 min",
      icon: Clock,
      color: "bg-[#A855F7]",
      description: "Per task"
    }
  ];

  if (profileLoading) {
    return <Loader color="#3B82F6" />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gray-50/50">
      <style>{`
        html, body {
          overflow: hidden !important;
          height: 100vh !important;
        }
        .tab-content-container {
          overflow-y: auto;
          overflow-x: hidden;
        }
        .tab-content-container::-webkit-scrollbar {
          width: 6px;
        }
        .tab-content-container::-webkit-scrollbar-track {
          background-color: #f1f5f9;
          border-radius: 3px;
        }
        .tab-content-container::-webkit-scrollbar-thumb {
          background-color: #cbd5e0;
          border-radius: 3px;
        }
        .tab-content-container::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
        .tab-content-container {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f1f5f9;
        }
      `}</style>

      <div className="flex-shrink-0">
        <DashboardHeader
          currentTime={currentTime}
          isCheckedIn={isCheckedIn}
          onCheckInToggle={handleCheckInToggle}
          onLogout={handleLogout}
          staffInfo={{
            name: `${user?.firstName} ${user?.lastName}`,
            role: 'Technician - Equipment & Maintenance'
          }}
          showNotifications={true}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:max-w-[100%] lg:mx-auto lg:px-8 py-4 h-full flex flex-col">
          {showStatsCards && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 flex-shrink-0">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.title}
                    className={`${stat.color} text-white relative overflow-hidden hover:shadow-lg transition-shadow`}
                  >
                    <CardContent className="p-4 sm:p-5 lg:p-6 relative z-10">
                      <div>
                        <p className="text-white/80 text-xs sm:text-sm">{stat.title}</p>
                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stat.value}</p>
                        <p className="text-xs sm:text-sm text-white/70 mt-1">
                          {stat.description}
                        </p>
                      </div>
                    </CardContent>
                    <Icon className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 h-16 sm:h-20 w-16 sm:w-20 text-white/10" />
                  </Card>
                );
              })}
            </div>
          )}

          <Tabs defaultValue="tasks" className="flex-1 flex flex-col min-h-0">
            <div className="relative flex-shrink-0">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex sm:grid w-auto sm:w-full sm:grid-cols-3 bg-white p-1 h-auto rounded-lg shadow-sm border min-w-max">
                  <TabsTrigger 
                    value="tasks" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    My Tasks
                  </TabsTrigger>
                  <TabsTrigger 
                    value="salary-leave" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    Salary & Leave
                  </TabsTrigger>
                  <TabsTrigger 
                    value="profile" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1 sm:gap-2 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap"
                  >
                    <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Profile
                  </TabsTrigger>
                </TabsList>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowStatsCards(!showStatsCards)}
                className="absolute top-0 right-0 h-6 w-6 bg-blue-600 text-white hover:bg-blue-700 hover:text-white rounded-full shadow-md z-10"
                title={showStatsCards ? "Hide Stats" : "Show Stats"}
              >
                <ChevronRight className={`h-3 w-3 transition-transform ${showStatsCards ? 'rotate-90' : ''}`} />
              </Button>
            </div>

            <TabsContent value="tasks" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-500 text-center">Task management coming soon...</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="salary-leave" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <StaffSalaryLeave staffType={user?.staffType} />
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-3 flex-1 min-h-0 data-[state=inactive]:hidden">
              <div className="h-full overflow-y-auto tab-content-container pr-2">
                <ProfileTab staffType={user?.staffType} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
