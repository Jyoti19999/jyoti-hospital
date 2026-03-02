import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Settings,
  Eye,
  LayoutDashboard,
  FileText,
  UserPlus,
  Clock,
  BarChart3,
  Pill,
  Scissors,
  ChevronUp,
  LogOut,
  DoorOpen,
  Package,
  Zap,
  Volume2,
  Bell,
  Database,
  FileSpreadsheet,
  IndianRupee,
  CalendarOff
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SuperAdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/superadmin-login');
  };

  // This sidebar is only used for separate route pages (like Letterhead Designer)
  // For Index.jsx pages, the sidebar is embedded in Index.jsx itself
  const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/', key: 'dashboard' },
    { title: 'Staff Registration', icon: UserPlus, path: '/', key: 'staff-registration' },
    { title: 'Staff Attendance', icon: Clock, path: '/', key: 'staff-attendance' },
    { title: 'Equipment Management', icon: Package, path: '/', key: 'equipment-management' },
    { title: 'Lens Management', icon: Zap, path: '/', key: 'lens-management' },
    { title: 'Diagnosis Master', icon: Eye, path: '/', key: 'diagnosis-master' },
    { title: 'Medicine Master', icon: Pill, path: '/', key: 'medicine-master' },
    { title: 'Surgery Management', icon: Scissors, path: '/', key: 'surgery-management' },
    { title: 'OT Rooms', icon: DoorOpen, path: '/', key: 'ot-rooms' },
    { title: 'Letterhead Designer', icon: FileText, path: '/letterhead-designer', isRoute: true },
    { title: 'Database Viewer', icon: Database, path: '/', key: 'database-viewer' },
    { title: 'Hospital Analytics', icon: BarChart3, path: '/', key: 'analytics' },
    { title: 'Generate Reports', icon: FileSpreadsheet, path: '/', key: 'generate-reports' },
    { title: 'Create Register', icon: FileText, path: '/', key: 'create-register' },
    { title: 'Notifications', icon: Bell, path: '/', key: 'notification-management' },
    { title: 'Notification Sounds', icon: Volume2, path: '/', key: 'notification-settings' },
    { title: 'Salary Management', icon: IndianRupee, path: '/', key: 'salary-management' },
    { title: 'Leave Management', icon: CalendarOff, path: '/', key: 'leave-management' },
    { title: 'Additional Settings', icon: Settings, path: '/', key: 'additional-settings' },
  ];

  const isActive = (item) => {
    if (item.isRoute) {
      return location.pathname === item.path;
    }
    // Check if the current view matches the item key
    return location.pathname === '/' && location.state?.view === item.key;
  };

  return (
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
                <SidebarMenuItem key={item.key || item.path}>
                  <SidebarMenuButton
                    isActive={isActive(item)}
                    onClick={() => {
                      if (item.isRoute) {
                        navigate(item.path);
                      } else {
                        // Navigate to home with state to set the view
                        navigate('/', { state: { view: item.key } });
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
                <SidebarMenuButton onClick={() => navigate('/', { state: { view: 'profile' } })}>
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
              <Avatar className="h-6 w-6">
                <AvatarFallback>SA</AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Super Admin</span>
                <span className="truncate text-xs">admin@yogineerstech.in</span>
              </div>
              <ChevronUp className="ml-auto" />
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
    </Sidebar>
  );
};

export default SuperAdminSidebar;
