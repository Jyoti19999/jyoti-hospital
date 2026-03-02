
import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  UserPlus,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  Eye,
  Pill,
  ChevronUp,
  FileText,
  Database,
  Scissors,
  Package,
  Zap,
  DoorOpen,
  Bell,
  Volume2,
  FileSpreadsheet,
  IndianRupee,
  CalendarOff
} from "lucide-react";
import DashboardContent from "@/components/DashboardContent";
import StaffRegistration from "@/components/StaffRegistration";
import StaffAttendance from "@/components/StaffAttendance";
import HospitalAnalytics from "@/components/HospitalAnalytics";
import NotificationCenter from "@/components/NotificationCenter";
import DiagnosisMaster from "@/components/DiagnosisMaster";
import MedicineMaster from "@/components/MedicineMaster";
import AdminRegisterManagement from "@/components/registers/AdminRegisterManagement";
import SurgeryManagement from "@/components/SurgeryManagement";
import EyeDropReasonManager from "@/components/admin/EyeDropReasonManager";
import NotificationSettings from "@/components/admin/NotificationSettings";
import NotificationManagement from "@/pages/super-admin/NotificationManagement";
import SuperAdminProfile from "@/pages/SuperAdminProfile";
import DatabaseViewer from "@/pages/super-admin/DatabaseViewer";
import EquipmentManagement from "@/components/super-admin/equipment/EquipmentManagement";
import LensManagement from "@/components/super-admin/lens/LensManagement";
import OTRoomsManagement from "@/components/ot-admin/OTRoomsManagement";
import GenerateReports from "@/pages/super-admin/GenerateReports";
import SalaryManagement from "@/components/super-admin/SalaryManagement";
import LeaveManagement from "@/components/super-admin/LeaveManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Users as UsersIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AuthContext from "@/contexts/AuthContext";

// Additional Settings Content Component
const AdditionalSettingsContent = () => {
  const [activeTab, setActiveTab] = useState('eyeDropReasons');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Additional Settings</h1>
          <p className="text-gray-600 mt-1">Manage system configurations and settings</p>
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
            <UsersIcon className="w-4 h-4" />
            User Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="eyeDropReasons">
          <EyeDropReasonManager />
        </TabsContent>

        <TabsContent value="systemConfig">
          <Card className="shadow-sm border-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-6">
              <h3 className="text-lg font-semibold text-gray-900">System Configuration</h3>
              <p className="text-gray-600 text-sm mt-1">Configure system-wide settings and parameters</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600">System configuration settings will be available here.</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card className="shadow-sm border-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-6">
              <h3 className="text-lg font-semibold text-gray-900">Templates Management</h3>
              <p className="text-gray-600 text-sm mt-1">Manage document and notification templates</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600">Template management will be available here.</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="userSettings">
          <Card className="shadow-sm border-0">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-6">
              <h3 className="text-lg font-semibold text-gray-900">User Settings</h3>
              <p className="text-gray-600 text-sm mt-1">Manage user preferences and configurations</p>
            </div>
            <div className="p-6">
              <p className="text-gray-600">User settings management will be available here.</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Read view from navigation state when coming from another route
  useEffect(() => {
    if (location.state?.view) {
      setActiveView(location.state.view);
      // Clear the state so it doesn't persist
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      key: "dashboard"
    },
    {
      title: "Staff Registration",
      icon: UserPlus,
      key: "staff-registration"
    },
    {
      title: "Staff Attendance",
      icon: Clock,
      key: "staff-attendance"
    },
    {
      title: "Equipment Management",
      icon: Package,
      key: "equipment-management"
    },
    {
      title: "Lens Management",
      icon: Zap,
      key: "lens-management"
    },
    {
      title: "Diagnosis Master",
      icon: Eye,
      key: "diagnosis-master"
    },
    {
      title: "Medicine Master",
      icon: Pill,
      key: "medicine-master"
    },
    {
      title: "Surgery Management",
      icon: Scissors,
      key: "surgery-management"
    },
    {
      title: "OT Rooms",
      icon: DoorOpen,
      key: "ot-rooms"
    },
    {
      title: "Letterhead Designer",
      icon: FileText,
      key: "letterhead-designer",
      isRoute: true // Flag to indicate this navigates to a route
    },
    {
      title: "Database Viewer",
      icon: Database,
      key: "database-viewer"
    },
    {
      title: "Hospital Analytics",
      icon: BarChart3,
      key: "analytics"
    },
    {
      title: "Generate Reports",
      icon: FileSpreadsheet,
      key: "generate-reports"
    },
    {
      title: "Create Register",
      icon: FileText,
      key: "create-register"
    },
    {
      title: "Salary Management",
      icon: IndianRupee,
      key: "salary-management"
    },
    {
      title: "Leave Management",
      icon: CalendarOff,
      key: "leave-management"
    },
    {
      title: "Additional Settings",
      icon: Settings,
      key: "additional-settings"
    },
    {
      title: "Notifications",
      icon: Bell,
      key: "notification-management"
    },
    {
      title: "Notification Sounds",
      icon: Volume2,
      key: "notification-settings"
    },
  ];

  const backendMenuItems = [];

  const handleLogout = () => {
    logout();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    navigate('/superadmin-login');
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardContent />;
      case "staff-registration":
        return <StaffRegistration />;
      case "staff-attendance":
        return <StaffAttendance />;
      case "diagnosis-master":
        return <DiagnosisMaster />;
      case "medicine-master":
        return <MedicineMaster />;
      case "surgery-management":
        return <SurgeryManagement />;
      case "ot-rooms":
        return <OTRoomsManagement />;
      case "equipment-management":
        return <EquipmentManagement />;
      case "lens-management":
        return <LensManagement />;
      case "analytics":
        return <HospitalAnalytics />;
      case "generate-reports":
        return <GenerateReports />;
      case "create-register":
        return <AdminRegisterManagement />;
      case "additional-settings":
        return <AdditionalSettingsContent />;
      case "notification-settings":
        return <NotificationSettings />;
      case "notification-management":
        return <NotificationManagement />;
      case "database-viewer":
        return <DatabaseViewer />;
      case "salary-management":
        return <SalaryManagement />;
      case "leave-management":
        return <LeaveManagement />;
      case "profile":
        return <SuperAdminProfile />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100">
      {/* Fixed Header - Always visible at full width */}
      {/* <header className="bg-white shadow-lg border-b border-slate-200 relative z-50 w-full">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">OptiCare Hospital</h1>
                <p className="text-sm text-slate-600">Institute of Ophthalmology & Laser Center</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
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
      </header> */}

      {/* Sidebar Layout */}
      <SidebarProvider>
        <div className="flex w-full h-screen">
          <Sidebar>
            <SidebarHeader>
              <div className="flex items-center space-x-2 p-2">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-sidebar-foreground">OptiCare</span>
                  <span className="text-xs text-sidebar-foreground/70">Hospital Admin</span>
                </div>
              </div>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Hospital Management</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuItems.map((item) => (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          isActive={activeView === item.key}
                          onClick={() => {
                            if (item.isRoute) {
                              navigate(`/${item.key}`);
                            } else {
                              setActiveView(item.key);
                            }
                          }}
                          className="w-full"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>System</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => setActiveView('profile')}>
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">AD</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-medium">Admin User</span>
                        <span className="text-xs text-sidebar-foreground/70">Hospital Admin</span>
                      </div>
                    </div>
                    <ChevronUp className="h-4 w-4 ml-auto" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <SidebarInset className="flex flex-col h-full overflow-hidden">
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
                            {menuItems.find(item => item.key === activeView)?.title || "Dashboard"}
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
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
            <div className="flex-1 overflow-auto">
              <div className="p-4">
                {renderContent()}
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Index;
