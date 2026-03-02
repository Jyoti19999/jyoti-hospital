// src\pages\AppointmentHistory.jsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { patientService } from '@/services/patientService';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { 
  Eye, 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  Clock,
  User,
  MapPin,
  BarChart3,
  Download,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Activity,
  PieChart,
  CheckCircle2,
  Stethoscope,
  CalendarClock,
  Menu,
  LogOut,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AppointmentCard } from '@/components/appointments/AppointmentCard';
import {
  format,
  subMonths,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns';

// Custom Appointment Card Component
const DynamicAppointmentCard = ({ appointment }) => {
  if (!appointment) {
    return null;
  }
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'routine': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'follow-up': return 'bg-green-50 text-green-700 border-green-200';
      case 'emergency': return 'bg-red-50 text-red-700 border-red-200';
      case 'consultation': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-3 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:border-blue-200 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Stethoscope className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{appointment.provider?.name || 'Unknown Doctor'}</p>
            <p className="text-xs text-gray-500">{appointment.provider?.specialty || 'General'}</p>
            {appointment.reason && (
              <p className="text-xs text-blue-600 mt-0.5 truncate">{appointment.reason}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
          <Badge className={`${getStatusColor(appointment.status || 'unknown')} text-xs px-1.5 py-0`}>
            {appointment.status || 'Unknown'}
          </Badge>
          {appointment.tokenNumber && (
            <Badge className="text-xs bg-indigo-100 text-indigo-800 border-0 px-1.5 py-0">
              Token: {appointment.tokenNumber}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap ml-10">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {appointment.date ? new Date(appointment.date).toLocaleDateString() : 'No date'}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {appointment.time || 'No time set'}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {appointment.location?.name || 'Hospital'}
        </span>
        <Badge className={`${getTypeColor(appointment.type)} text-[10px] px-1.5 py-0`} variant="outline">
          {appointment.type}
        </Badge>
      </div>

      {appointment.notes && (
        <p className="mt-1.5 ml-10 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 line-clamp-1">
          <strong>Notes:</strong> {appointment.notes}
        </p>
      )}

      {appointment.visit && (
        <div className="mt-1 ml-10 flex items-center gap-2 text-[11px] text-gray-400">
          <span>Visit #{appointment.visit.visitNumber}</span>
          {appointment.visit.visitType && <span>• {appointment.visit.visitType}</span>}
        </div>
      )}
    </div>
  );
};

const AppointmentHistory = () => {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // Fetch patient appointments using React Query
  const { 
    data: appointmentsData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['patient', 'appointments', 'history', user?.id],
    queryFn: patientService.getAppointments,
    enabled: !!user && user.role === 'patient' && !authLoading,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000
  });


  // Transform API data into component format
  const transformedAppointments = useMemo(() => {
    if (!appointmentsData?.data?.appointments) return [];
    
    const { todayAppointments, upcomingAppointments, previousAppointments } = appointmentsData.data.appointments;
    
    // Combine all appointments
    const allAppointments = [
      ...(todayAppointments?.appointments || []),
      ...(upcomingAppointments?.appointments || []),
      ...(previousAppointments?.appointments || [])
    ];
    
    return allAppointments.map(apt => ({
      id: apt.id,
      date: new Date(apt.appointmentDate).toISOString().split('T')[0],
      time: apt.appointmentTime || apt.formattedTime || 'Time not set',
      provider: {
        name: apt.doctorName || 'Doctor not assigned',
        specialty: apt.doctor?.department || apt.doctor?.staffType || 'General',
        rating: 4.8 // Default rating - could be added to backend later
      },
      department: apt.doctor?.department || 'General',
      location: {
        name: 'OHMS Hospital',
        address: 'Main Hospital Building'
      },
      type: apt.appointmentType?.toLowerCase() || 'routine',
      status: apt.status?.toLowerCase() === 'completed' ? 'completed' : 
              apt.status?.toLowerCase() === 'scheduled' ? 'upcoming' :
              apt.status?.toLowerCase() === 'cancelled' ? 'cancelled' :
              new Date(apt.appointmentDate) < new Date() ? 'completed' : 'upcoming',
      reason: apt.purpose || 'General consultation',
      notes: apt.notes || '',
      tokenNumber: apt.tokenNumber,
      appointmentDate: apt.appointmentDate,
      formattedDate: apt.formattedDate,
      visit: apt.visit,
      estimatedDuration: apt.estimatedDuration,
      createdAt: apt.createdAt
    }));
  }, [appointmentsData]);

  const filteredAppointments = useMemo(() => {
    if (!transformedAppointments || transformedAppointments.length === 0) {
      return [];
    }
    return transformedAppointments.filter(appointment => {
      const matchesSearch = appointment.provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           appointment.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           appointment.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProvider = filterProvider === 'all' || appointment.provider.name === filterProvider;
      const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
      const matchesType = filterType === 'all' || appointment.type === filterType;
      
      // Date range filtering
      let matchesDateRange = true;
      if (dateRange !== 'all') {
        const appointmentDate = new Date(appointment.date);
        const now = new Date();
        
        switch (dateRange) {
          case 'last-month':
            matchesDateRange = appointmentDate >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            break;
          case 'last-3-months':
            matchesDateRange = appointmentDate >= new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            break;
          case 'last-year':
            matchesDateRange = appointmentDate >= new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
          default:
            matchesDateRange = true;
        }
      }
      
      return matchesSearch && matchesProvider && matchesStatus && matchesType && matchesDateRange;
    });
  }, [transformedAppointments, searchTerm, filterProvider, filterStatus, filterType, dateRange]);

  // Analytics data based on real appointments
  const analytics = useMemo(() => {
    if (!transformedAppointments || transformedAppointments.length === 0) {
      return {
        totalVisits: 0,
        completedVisits: 0,
        upcomingVisits: 0,
        cancelledVisits: 0,
        totalCost: 0,
        favoriteProvider: 'No appointments yet',
        mostVisitedDepartment: 'No visits yet',
        averageMonthlyVisits: '0',
        monthlyVisits: [],
        maxMonthly: 1,
        dayOfWeekData: [],
        maxDayCount: 1,
        providerBreakdown: [],
        departmentBreakdown: [],
        typeBreakdown: []
      };
    }
    
    const totalVisits = transformedAppointments.length;
    const completedVisits = transformedAppointments.filter(a => a.status === 'completed').length;
    const upcomingVisits = transformedAppointments.filter(a => a.status === 'upcoming').length;
    const cancelledVisits = transformedAppointments.filter(a => a.status === 'cancelled').length;
    
    // Calculate estimated total cost (since cost isn't in backend data yet)
    const estimatedCostPerVisit = 1500; // Average consultation fee
    const totalCost = completedVisits * estimatedCostPerVisit;
    
    // Provider breakdown
    const providerCounts = {};
    transformedAppointments.forEach(apt => {
      const providerName = apt.provider?.name || 'Unknown Provider';
      providerCounts[providerName] = (providerCounts[providerName] || 0) + 1;
    });
    const providerBreakdown = Object.entries(providerCounts)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / totalVisits) * 100) }))
      .sort((a, b) => b.count - a.count);
    const favoriteProvider = providerBreakdown.length > 0 ? providerBreakdown[0].name : 'No appointments yet';

    // Department breakdown
    const departmentCounts = {};
    transformedAppointments.forEach(apt => {
      const department = apt.department || 'General';
      departmentCounts[department] = (departmentCounts[department] || 0) + 1;
    });
    const departmentBreakdown = Object.entries(departmentCounts)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / totalVisits) * 100) }))
      .sort((a, b) => b.count - a.count);
    const mostVisitedDepartment = departmentBreakdown.length > 0 ? departmentBreakdown[0].name : 'No visits yet';

    // Monthly visits (last 6 months)
    const monthlyVisits = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(now, i);
      const label = format(m, 'MMM yyyy');
      const month = m.getMonth();
      const year = m.getFullYear();
      const count = transformedAppointments.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === month && d.getFullYear() === year;
      }).length;
      monthlyVisits.push({ label, shortLabel: format(m, 'MMM'), count });
    }
    const maxMonthly = Math.max(...monthlyVisits.map(m => m.count), 1);

    // Day of week distribution
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
    transformedAppointments.forEach(a => {
      const d = new Date(a.date);
      dayOfWeekCounts[d.getDay()]++;
    });
    const maxDayCount = Math.max(...dayOfWeekCounts, 1);
    const dayOfWeekData = dayNames.map((name, i) => ({ name, count: dayOfWeekCounts[i] }));

    // Type breakdown
    const typeCounts = {};
    transformedAppointments.forEach(apt => {
      const t = apt.type || 'routine';
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    const typeBreakdown = Object.entries(typeCounts)
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count, pct: Math.round((count / totalVisits) * 100) }))
      .sort((a, b) => b.count - a.count);

    // Actual month span for average calculation
    const dates = transformedAppointments.map(a => new Date(a.date).getTime());
    const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : now;
    const monthSpan = Math.max(1, Math.ceil((now.getTime() - minDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)));

    return {
      totalVisits,
      completedVisits,
      upcomingVisits,
      cancelledVisits,
      totalCost,
      favoriteProvider,
      mostVisitedDepartment,
      averageMonthlyVisits: totalVisits > 0 ? (totalVisits / monthSpan).toFixed(1) : '0',
      providerBreakdown,
      departmentBreakdown,
      monthlyVisits,
      maxMonthly,
      dayOfWeekData,
      maxDayCount,
      typeBreakdown
    };
  }, [transformedAppointments]);

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarMonth]);

  const appointmentsByDate = useMemo(() => {
    const map = {};
    transformedAppointments.forEach(apt => {
      const key = apt.date; // YYYY-MM-DD
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    });
    return map;
  }, [transformedAppointments]);

  const selectedDateAppointments = useMemo(() => {
    if (!selectedCalendarDate) return [];
    const key = format(selectedCalendarDate, 'yyyy-MM-dd');
    return appointmentsByDate[key] || [];
  }, [selectedCalendarDate, appointmentsByDate]);

  const handleExport = () => {
    if (!transformedAppointments || transformedAppointments.length === 0) {
      toast({ title: "Nothing to Export", description: "No appointment data available to export.", variant: "destructive" });
      return;
    }
    try {
      const dataStr = JSON.stringify(transformedAppointments, null, 2);
      const dataBlob = new Blob([dataStr], {type:'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `appointment-history-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export Complete", description: "Your appointment history has been exported." });
    } catch (err) {
      toast({ title: "Export Failed", description: "Failed to export appointment history. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-x-hidden">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm sm:text-xl font-bold text-slate-800">Appointment History</h1>
                <p className="hidden sm:block text-sm text-slate-600">View and manage your healthcare journey</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-2">
                <Link to="/patient-profile">
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline ml-1">Profile</span>
                  </Button>
                </Link>
                <Link to="/patient-dashboard">
                  <Button variant="outline" size="sm">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden lg:inline ml-1">Dashboard</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="w-4 h-4" />
                  <span className="hidden lg:inline ml-1">Export</span>
                </Button>
                <Link to="/appointment-booking">
                  <Button size="sm">
                    <Calendar className="w-4 h-4" />
                    <span className="hidden lg:inline ml-1">Book</span>
                  </Button>
                </Link>
              </div>
              {/* Mobile hamburger */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden px-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/patient-profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/patient-dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" />Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/appointment-booking" className="flex items-center gap-2 cursor-pointer">
                      <Calendar className="w-4 h-4" />Book Appointment
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={handleExport}>
                    <Download className="w-4 h-4" />Export History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                    onClick={async () => { try { await logout(); window.location.href = '/patient-login'; } catch(e) {} }}
                  >
                    <LogOut className="w-4 h-4" />Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        <div className="space-y-8">
          {/* Analytics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 p-3 sm:p-5 text-white shadow-lg">
              <div className="absolute -right-3 -bottom-3 opacity-10">
                <CalendarClock className="h-16 w-16 sm:h-24 sm:w-24" />
              </div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-violet-100 mb-1">Total Visits</p>
              <p className="text-2xl sm:text-4xl font-extrabold leading-none">{analytics?.totalVisits || 0}</p>
              <p className="hidden sm:block text-sm text-violet-200 mt-1">All time</p>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 p-3 sm:p-5 text-white shadow-lg">
              <div className="absolute -right-3 -bottom-3 opacity-10">
                <CheckCircle2 className="h-16 w-16 sm:h-24 sm:w-24" />
              </div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-100 mb-1">Completed</p>
              <p className="text-2xl sm:text-4xl font-extrabold leading-none">{analytics?.completedVisits || 0}</p>
              <p className="hidden sm:block text-sm text-emerald-100 mt-1">Past visits</p>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 p-3 sm:p-5 text-white shadow-lg">
              <div className="absolute -right-3 -bottom-3 opacity-10">
                <Calendar className="h-16 w-16 sm:h-24 sm:w-24" />
              </div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sky-100 mb-1">Upcoming</p>
              <p className="text-2xl sm:text-4xl font-extrabold leading-none">{analytics?.upcomingVisits || 0}</p>
              <p className="hidden sm:block text-sm text-sky-200 mt-1">Scheduled visits</p>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-3 sm:p-5 text-white shadow-lg">
              <div className="absolute -right-3 -bottom-3 opacity-10">
                <TrendingUp className="h-16 w-16 sm:h-24 sm:w-24" />
              </div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-100 mb-1">Est. Total Cost</p>
              <p className="text-2xl sm:text-4xl font-extrabold leading-none">₹{((analytics?.totalCost || 0) / 1000).toFixed(0)}k</p>
              <p className="hidden sm:block text-sm text-amber-100 mt-1">Consultations</p>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="timeline" className="space-y-6">
            <TabsList className="flex flex-wrap sm:flex-nowrap w-full h-auto">
              <TabsTrigger value="timeline" className="flex-1 text-[11px] sm:text-sm py-1.5 sm:py-2">Timeline</TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 text-[11px] sm:text-sm py-1.5 sm:py-2">Analytics</TabsTrigger>
              <TabsTrigger value="calendar" className="flex-1 text-[11px] sm:text-sm py-1.5 sm:py-2">Calendar</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-6">
              {/* Search and Filters */}
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search appointments, providers, or conditions..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {transformedAppointments && Array.from(new Set(transformedAppointments.map(apt => apt.type))).map(type => (
                          <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Date Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="last-month">Last Month</SelectItem>
                        <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                        <SelectItem value="last-year">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Appointments List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Your Appointments ({isLoading ? '...' : filteredAppointments.length})
                    {isLoading && (
                      <div className="inline-block ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                  </h2>
                  <div className="flex items-center space-x-2">
                    {error && (
                      <Button variant="outline" size="sm" onClick={() => refetch()}>
                        Retry
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      More Filters
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  // Loading state
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-6">
                        <div className="animate-pulse">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-48"></div>
                              <div className="h-3 bg-gray-200 rounded w-32"></div>
                            </div>
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : error ? (
                  // Error state
                  <Card className="p-8">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-4 text-red-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-red-600">Failed to load appointments</h3>
                      <p className="text-gray-600 mb-4">
                        {error?.message || 'Something went wrong while loading your appointments.'}
                      </p>
                      <Button onClick={() => refetch()} variant="outline">
                        Try Again
                      </Button>
                    </div>
                  </Card>
                ) : filteredAppointments.length === 0 ? (
                  // Empty state
                  <Card className="p-8">
                    <div className="text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">
                        {transformedAppointments.length === 0 ? 'No appointments yet' : 'No appointments found'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {transformedAppointments.length === 0 
                          ? 'Book your first appointment to start your healthcare journey.'
                          : 'Try adjusting your search criteria or filters.'}
                      </p>
                      {transformedAppointments.length === 0 && (
                        <Link to="/appointment-booking">
                          <Button>
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Your First Appointment
                          </Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                ) : (
                  // Appointments list
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {filteredAppointments.map((appointment) => (
                      <DynamicAppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-6">
                {/* Monthly Visits Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Monthly Visits (Last 6 Months)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-3 h-40">
                      {analytics.monthlyVisits.map((m, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-semibold text-gray-700">{m.count}</span>
                          <div
                            className="w-full bg-blue-500 rounded-t-md transition-all duration-500 min-h-[4px]"
                            style={{ height: `${Math.max((m.count / analytics.maxMonthly) * 100, 3)}%` }}
                          />
                          <span className="text-[10px] text-gray-500 mt-1">{m.shortLabel}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Status Distribution */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <PieChart className="w-5 h-5 text-indigo-600" />
                        Status Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { label: 'Completed', count: analytics.completedVisits, color: 'bg-green-500', textColor: 'text-green-700' },
                          { label: 'Upcoming', count: analytics.upcomingVisits, color: 'bg-blue-500', textColor: 'text-blue-700' },
                          { label: 'Cancelled', count: analytics.cancelledVisits, color: 'bg-red-500', textColor: 'text-red-700' }
                        ].map((s) => (
                          <div key={s.label} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className={`font-medium ${s.textColor}`}>{s.label}</span>
                              <span className="text-gray-600">{s.count} ({analytics.totalVisits > 0 ? Math.round((s.count / analytics.totalVisits) * 100) : 0}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${s.color} rounded-full transition-all duration-500`}
                                style={{ width: `${analytics.totalVisits > 0 ? (s.count / analytics.totalVisits) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Completion Rate</span>
                          <span className="font-semibold">
                            {analytics.totalVisits > 0 ? Math.round((analytics.completedVisits / analytics.totalVisits) * 100) : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Avg Monthly Visits</span>
                          <span className="font-semibold">{analytics.averageMonthlyVisits}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Healthcare Engagement</span>
                          <Badge className={analytics.totalVisits > 5 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {analytics.totalVisits > 10 ? 'High' : analytics.totalVisits > 5 ? 'Medium' : 'Low'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Day of Week Distribution */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Activity className="w-5 h-5 text-teal-600" />
                        Busiest Days
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-2 h-32">
                        {analytics.dayOfWeekData.map((d, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-semibold text-gray-600">{d.count}</span>
                            <div
                              className="w-full bg-teal-500 rounded-t-md transition-all duration-500 min-h-[4px]"
                              style={{ height: `${Math.max((d.count / analytics.maxDayCount) * 100, 3)}%` }}
                            />
                            <span className="text-[10px] text-gray-500 mt-1">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Provider Breakdown */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="w-5 h-5 text-orange-600" />
                        Top Providers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {analytics.providerBreakdown.map((p, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="truncate mr-2 font-medium">{p.name}</span>
                              <span className="text-gray-500 flex-shrink-0">{p.count} ({p.pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-400 rounded-full" style={{ width: `${p.pct}%` }} />
                            </div>
                          </div>
                        ))}
                        {analytics.providerBreakdown.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">No data</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Department Breakdown */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        Departments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {analytics.departmentBreakdown.map((d, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="truncate mr-2 font-medium">{d.name}</span>
                              <span className="text-gray-500 flex-shrink-0">{d.count} ({d.pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-400 rounded-full" style={{ width: `${d.pct}%` }} />
                            </div>
                          </div>
                        ))}
                        {analytics.departmentBreakdown.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">No data</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Type Breakdown */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        Visit Types
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {analytics.typeBreakdown.map((t, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="truncate mr-2 font-medium">{t.name}</span>
                              <span className="text-gray-500 flex-shrink-0">{t.count} ({t.pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${t.pct}%` }} />
                            </div>
                          </div>
                        ))}
                        {analytics.typeBreakdown.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">No data</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calendar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        {format(calendarMonth, 'MMMM yyyy')}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setCalendarMonth(prev => addMonths(prev, -1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => { setCalendarMonth(new Date()); setSelectedCalendarDate(new Date()); }}
                        >
                          Today
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setCalendarMonth(prev => addMonths(prev, 1))}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 mb-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
                      ))}
                    </div>
                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
                      {calendarDays.map((day, i) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayAppointments = appointmentsByDate[dateKey] || [];
                        const inMonth = isSameMonth(day, calendarMonth);
                        const isSelected = selectedCalendarDate && isSameDay(day, selectedCalendarDate);
                        const todayFlag = isToday(day);

                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedCalendarDate(day)}
                            className={`relative bg-white p-1.5 min-h-[56px] text-left transition-colors hover:bg-blue-50
                              ${!inMonth ? 'opacity-40' : ''}
                              ${isSelected ? 'ring-2 ring-blue-500 ring-inset bg-blue-50' : ''}
                              ${todayFlag && !isSelected ? 'bg-amber-50' : ''}
                            `}
                          >
                            <span className={`text-xs font-medium block
                              ${todayFlag ? 'text-blue-600 font-bold' : 'text-gray-700'}
                              ${!inMonth ? 'text-gray-400' : ''}
                            `}>
                              {format(day, 'd')}
                            </span>
                            {dayAppointments.length > 0 && (
                              <div className="flex gap-0.5 mt-0.5 flex-wrap">
                                {dayAppointments.slice(0, 3).map((apt, j) => (
                                  <div
                                    key={j}
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      apt.status === 'completed' ? 'bg-green-500' :
                                      apt.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                                    }`}
                                  />
                                ))}
                                {dayAppointments.length > 3 && (
                                  <span className="text-[8px] text-gray-400">+{dayAppointments.length - 3}</span>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Upcoming</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Completed</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Cancelled</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Date Detail */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {selectedCalendarDate
                        ? format(selectedCalendarDate, 'EEEE, MMM d, yyyy')
                        : 'Select a date'
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!selectedCalendarDate ? (
                      <div className="text-center py-8 text-gray-400">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Click on a date to view appointments</p>
                      </div>
                    ) : selectedDateAppointments.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No appointments on this date</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {selectedDateAppointments.map((apt) => (
                          <div key={apt.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold truncate">{apt.provider?.name}</span>
                              <Badge className={`text-[10px] px-1.5 py-0 ${
                                apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                                apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>{apt.status}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {apt.time}
                              </span>
                              {apt.tokenNumber && (
                                <span>Token: {apt.tokenNumber}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{apt.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AppointmentHistory;
