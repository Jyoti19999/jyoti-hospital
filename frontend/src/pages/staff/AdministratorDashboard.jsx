import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import NotificationCenter from "@/components/NotificationCenter";
import Loader from "@/components/loader/Loader";
import ProfileTab from "@/components/ProfileTab";
import StaffSalaryLeave from "@/components/StaffSalaryLeave";
import AdminRegisterManagement from "@/components/registers/AdminRegisterManagement";
import StaffTypeManagement from "@/components/staff/StaffTypeManagement";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import {
    LogIn,
    LogOut,
    Users,
    Calendar,
    Clock,
    Eye,
    User,
    Activity,
    FileText,
    AlertTriangle,
    CheckCircle,
    Settings,
    Shield,
    TrendingUp,
    DollarSign,
    BarChart3,
    UserCheck,
    Building,
    Clipboard,
    Database,
    Lock,
    Monitor,
    FileSpreadsheet,
    MessageSquare,
    Bell,
    Zap,
    Target,
    Briefcase,
    Phone,
    Mail
} from "lucide-react";

// Custom Avatar Component
const Avatar = ({ src, alt, size = 'md', className = '' }) => {
    const [imageError, setImageError] = useState(false);
    
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-20 h-20'
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const getImageUrl = (profilePhoto) => {
        if (!profilePhoto) return null;
        const baseUrl = import.meta.env.VITE_API_IMG_URL || 'http://localhost:8080';
        return `${baseUrl}${profilePhoto}`;
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}>
            {src && !imageError ? (
                <img
                    src={getImageUrl(src)}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                />
            ) : (
                <User className={`${size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : size === 'lg' ? 'h-8 w-8' : 'h-10 w-10'} text-gray-400`} />
            )}
        </div>
    );
};

// Chart Data for Administrator
const hospitalStatsData = [
    { month: 'Jan', patients: 1250, revenue: 450000, staff: 156, occupancy: 85 },
    { month: 'Feb', patients: 1180, revenue: 420000, staff: 158, occupancy: 78 },
    { month: 'Mar', patients: 1350, revenue: 480000, staff: 160, occupancy: 88 },
    { month: 'Apr', patients: 1420, revenue: 510000, staff: 162, occupancy: 92 },
    { month: 'May', patients: 1380, revenue: 495000, staff: 165, occupancy: 89 },
    { month: 'Jun', patients: 1450, revenue: 525000, staff: 168, occupancy: 94 },
];

const departmentBudgetData = [
    { department: 'Ophthalmology', allocated: 500000, spent: 460000, remaining: 40000 },
    { department: 'Surgery', allocated: 800000, spent: 720000, remaining: 80000 },
    { department: 'Administration', allocated: 200000, spent: 185000, remaining: 15000 },
    { department: 'Technology', allocated: 300000, spent: 275000, remaining: 25000 },
    { department: 'Equipment', allocated: 600000, spent: 550000, remaining: 50000 },
];

const staffDistributionData = [
    { role: 'Doctors', count: 45, color: '#3B82F6' },
    { role: 'Nurses', count: 62, color: '#10B981' },
    { role: 'Technicians', count: 28, color: '#F59E0B' },
    { role: 'Administration', count: 18, color: '#EF4444' },
    { role: 'Support Staff', count: 25, color: '#8B5CF6' },
];

// Staff Management Component
const StaffManagement = () => {
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const staffList = [
        { id: 'DOC001', name: 'Dr. Abhijeet Agre', role: 'Doctor', department: 'Ophthalmology', status: 'Active', joiningDate: '2020-01-15', salary: '₹85,000' },
        { id: 'NUR001', name: 'Shilpa Gaikwad', role: 'Nurse', department: 'Clinical Support', status: 'Active', joiningDate: '2021-03-20', salary: '₹35,000' },
        { id: 'TEC001', name: 'Rohit Bhosale', role: 'Technician', department: 'Diagnostics', status: 'Active', joiningDate: '2022-05-10', salary: '₹28,000' },
        { id: 'REC001', name: 'Snehal Deshmukh', role: 'Receptionist', department: 'Administration', status: 'Active', joiningDate: '2021-11-05', salary: '₹22,000' },
        { id: 'DOC002', name: 'Dr. Siddharth Deshmukh', role: 'Doctor', department: 'Retinal Care', status: 'Active', joiningDate: '2019-08-12', salary: '₹95,000' },
    ];

    const recentActions = [
        { action: 'New staff registered', staff: 'Dr. Priya Sharma', time: '2 hours ago', type: 'success' },
        { action: 'Salary updated', staff: 'Rohit Bhosale', time: '5 hours ago', type: 'info' },
        { action: 'Staff deactivated', staff: 'Amit Patil', time: '1 day ago', type: 'warning' },
        { action: 'Department transfer', staff: 'Sunita Pawar', time: '2 days ago', type: 'info' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Staff</p>
                                <p className="text-2xl font-bold text-blue-600">178</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Staff</p>
                                <p className="text-2xl font-bold text-green-600">165</p>
                            </div>
                            <UserCheck className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">New Hires (Month)</p>
                                <p className="text-2xl font-bold text-purple-600">8</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Departments</p>
                                <p className="text-2xl font-bold text-orange-600">12</p>
                            </div>
                            <Building className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Staff Directory</span>
                            <div className="flex space-x-2">
                                <Input 
                                    placeholder="Search staff..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-48"
                                />
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        <SelectItem value="ophthalmology">Ophthalmology</SelectItem>
                                        <SelectItem value="administration">Administration</SelectItem>
                                        <SelectItem value="support">Support</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {staffList.map((staff) => (
                                <div key={staff.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center space-x-3">
                                        <Avatar size="sm" />
                                        <div>
                                            <p className="font-medium">{staff.name}</p>
                                            <p className="text-sm text-gray-500">{staff.role} • {staff.department}</p>
                                            <p className="text-xs text-gray-400">ID: {staff.id} • Joined: {staff.joiningDate}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge className={`text-xs ${
                                            staff.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {staff.status}
                                        </Badge>
                                        <Button size="sm" variant="outline">
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                            <Users className="h-4 w-4 mr-2" />
                            Add New Staff Member
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Recent Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {recentActions.map((action, index) => (
                                <div key={index} className="p-3 border rounded-lg">
                                    <p className="text-sm font-medium">{action.action}</p>
                                    <p className="text-xs text-gray-500">{action.staff}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-xs text-gray-400">{action.time}</span>
                                        <Badge className={`text-xs ${
                                            action.type === 'success' ? 'bg-green-100 text-green-800' :
                                            action.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {action.type}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// Financial Management Component
const FinancialManagement = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('monthly');

    const financialSummary = [
        { metric: 'Total Revenue', value: '₹52.5L', change: '+12.5%', trend: 'up' },
        { metric: 'Operating Expenses', value: '₹38.2L', change: '+5.2%', trend: 'up' },
        { metric: 'Net Profit', value: '₹14.3L', change: '+18.7%', trend: 'up' },
        { metric: 'Budget Utilization', value: '87.3%', change: '+3.1%', trend: 'up' },
    ];

    const expenseCategories = [
        { category: 'Staff Salaries', amount: 1850000, percentage: 48.5 },
        { category: 'Medical Equipment', amount: 680000, percentage: 17.8 },
        { category: 'Maintenance', amount: 420000, percentage: 11.0 },
        { category: 'Utilities', amount: 320000, percentage: 8.4 },
        { category: 'Others', amount: 530000, percentage: 13.9 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Financial Overview</h3>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {financialSummary.map((item, index) => (
                    <Card key={index} className="bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{item.metric}</p>
                                    <p className="text-2xl font-bold">{item.value}</p>
                                    <div className="flex items-center mt-1">
                                        <TrendingUp className={`h-4 w-4 ${
                                            item.trend === 'up' ? 'text-green-500' : 'text-red-500'
                                        }`} />
                                        <span className={`text-sm ml-1 ${
                                            item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {item.change}
                                        </span>
                                    </div>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-500" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Department Budget Allocation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={departmentBudgetData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="department" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="allocated" fill="#3B82F6" name="Allocated" />
                                <Bar dataKey="spent" fill="#10B981" name="Spent" />
                                <Bar dataKey="remaining" fill="#F59E0B" name="Remaining" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Expense Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {expenseCategories.map((expense, index) => (
                                <div key={index} className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium">{expense.category}</span>
                                            <span className="text-sm text-gray-500">₹{(expense.amount/100000).toFixed(1)}L</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full" 
                                                style={{ width: `${expense.percentage}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-gray-400">{expense.percentage}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// System Administration Component
const SystemAdministration = () => {
    const [selectedSystem, setSelectedSystem] = useState('');

    const systemStatus = [
        { system: 'Patient Management System', status: 'Online', uptime: '99.8%', lastUpdate: '2024-01-14' },
        { system: 'Electronic Health Records', status: 'Online', uptime: '99.5%', lastUpdate: '2024-01-12' },
        { system: 'Billing System', status: 'Online', uptime: '99.9%', lastUpdate: '2024-01-10' },
        { system: 'Inventory Management', status: 'Maintenance', uptime: '98.2%', lastUpdate: '2024-01-08' },
        { system: 'Laboratory Information System', status: 'Online', uptime: '99.6%', lastUpdate: '2024-01-15' },
    ];

    const securityLogs = [
        { time: '10:30 AM', event: 'User login successful', user: 'admin@hospital.com', severity: 'Info' },
        { time: '10:15 AM', event: 'Failed login attempt', user: 'unknown@email.com', severity: 'Warning' },
        { time: '09:45 AM', event: 'Database backup completed', user: 'System', severity: 'Info' },
        { time: '09:30 AM', event: 'Permission change', user: 'admin@hospital.com', severity: 'High' },
    ];

    const backupStatus = [
        { type: 'Patient Data', lastBackup: '2024-01-15 03:00 AM', status: 'Success', size: '2.3 GB' },
        { type: 'Financial Records', lastBackup: '2024-01-15 03:15 AM', status: 'Success', size: '850 MB' },
        { type: 'System Logs', lastBackup: '2024-01-15 03:30 AM', status: 'Success', size: '120 MB' },
        { type: 'User Profiles', lastBackup: '2024-01-15 03:45 AM', status: 'Success', size: '45 MB' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">System Uptime</p>
                                <p className="text-2xl font-bold text-green-600">99.7%</p>
                            </div>
                            <Monitor className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Active Users</p>
                                <p className="text-2xl font-bold text-blue-600">147</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Security Alerts</p>
                                <p className="text-2xl font-bold text-red-600">3</p>
                            </div>
                            <Shield className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Data Backups</p>
                                <p className="text-2xl font-bold text-purple-600">Daily</p>
                            </div>
                            <Database className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Monitor className="h-5 w-5 text-blue-600" />
                            <span>System Status</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {systemStatus.map((system, index) => (
                                <div key={index} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-medium text-sm">{system.system}</p>
                                        <Badge className={`text-xs ${
                                            system.status === 'Online' ? 'bg-green-100 text-green-800' :
                                            system.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {system.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Uptime: {system.uptime}</span>
                                        <span>Updated: {system.lastUpdate}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Shield className="h-5 w-5 text-red-600" />
                            <span>Security Logs</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {securityLogs.map((log, index) => (
                                <div key={index} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-sm font-medium">{log.event}</p>
                                        <Badge className={`text-xs ${
                                            log.severity === 'Info' ? 'bg-blue-100 text-blue-800' :
                                            log.severity === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {log.severity}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500">{log.user}</p>
                                    <p className="text-xs text-gray-400">{log.time}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Database className="h-5 w-5 text-purple-600" />
                            <span>Backup Status</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {backupStatus.map((backup, index) => (
                                <div key={index} className="p-3 border rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-medium text-sm">{backup.type}</p>
                                        <Badge className="bg-green-100 text-green-800 text-xs">
                                            {backup.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>{backup.lastBackup}</span>
                                        <span>{backup.size}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                            <Database className="h-4 w-4 mr-2" />
                            Backup Now
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// Reports & Analytics Component
const ReportsAnalytics = () => {
    const [reportType, setReportType] = useState('operational');
    const [dateRange, setDateRange] = useState('thisMonth');

    const hospitalMetrics = [
        { metric: 'Patient Satisfaction', value: '4.8/5', change: '+0.2', trend: 'up' },
        { metric: 'Average Wait Time', value: '12 min', change: '-3 min', trend: 'down' },
        { metric: 'Staff Efficiency', value: '94.5%', change: '+2.1%', trend: 'up' },
        { metric: 'Equipment Utilization', value: '87.3%', change: '+5.4%', trend: 'up' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
                <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Report Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="operational">Operational Reports</SelectItem>
                        <SelectItem value="financial">Financial Reports</SelectItem>
                        <SelectItem value="staff">Staff Reports</SelectItem>
                        <SelectItem value="patient">Patient Reports</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="thisQuarter">This Quarter</SelectItem>
                        <SelectItem value="thisYear">This Year</SelectItem>
                    </SelectContent>
                </Select>

                <Button className="bg-blue-600 hover:bg-blue-700">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Generate Report
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {hospitalMetrics.map((metric, index) => (
                    <Card key={index} className="bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">{metric.metric}</p>
                                    <p className="text-2xl font-bold">{metric.value}</p>
                                    <div className="flex items-center mt-1">
                                        <TrendingUp className={`h-4 w-4 ${
                                            metric.trend === 'up' ? 'text-green-500' :
                                            metric.trend === 'down' ? 'text-red-500' :
                                            'text-gray-500'
                                        }`} />
                                        <span className={`text-sm ml-1 ${
                                            metric.trend === 'up' ? 'text-green-600' :
                                            metric.trend === 'down' ? 'text-red-600' :
                                            'text-gray-600'
                                        }`}>
                                            {metric.change}
                                        </span>
                                    </div>
                                </div>
                                <BarChart3 className="h-8 w-8 text-blue-500" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Hospital Performance Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={hospitalStatsData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="patients" stroke="#3B82F6" name="Patients" />
                                <Line type="monotone" dataKey="occupancy" stroke="#10B981" name="Occupancy %" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Staff Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                    data={staffDistributionData} 
                                    dataKey="count" 
                                    nameKey="role" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={80} 
                                    label={({role, count}) => `${role}: ${count}`}
                                >
                                    {staffDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const AdministratorDashboard = () => {
    const { user, logout, fetchStaffProfile } = useAuth();
    const navigate = useNavigate();
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [profileLoading, setProfileLoading] = useState(false);

    // Helper function to check if we have complete profile data
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
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Fetch complete profile data on first render if needed
    useEffect(() => {
        const loadCompleteProfile = async () => {
            // Only fetch if user exists but doesn't have complete profile data
            if (user && user.employeeId && !hasCompleteProfile(user)) {
                
                setProfileLoading(true);
                
                try {
                    const completeProfile = await fetchStaffProfile();
                    if (completeProfile) {
                       
                    } else {
                        toast.error('Failed to load complete profile');
                    }
                } catch (error) {
                    toast.error('Failed to load complete profile');
                } finally {
                    setProfileLoading(false);
                }
            } else if (user && hasCompleteProfile(user)) {
            }
        };

        // Only run if user exists
        if (user) {
            loadCompleteProfile();
        }
    }, [user?.id, fetchStaffProfile]); // Depend on user ID and fetchStaffProfile

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

    const todayStats = [
        { title: "Staff Members", value: "178", icon: Users, color: "text-blue-600" },
        { title: "Active Systems", value: "12", icon: Monitor, color: "text-green-600" },
        { title: "Pending Reports", value: "8", icon: FileText, color: "text-orange-600" },
        { title: "Budget Utilization", value: "87%", icon: DollarSign, color: "text-purple-600" },
    ];

    // Show loading state if profile is being fetched
    if (profileLoading) {
        return <Loader color="#3B82F6" />;
    }

    return (
        <>
            <header className="bg-white shadow-lg border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                            <div className="flex items-center space-x-2">
                                <Avatar 
                                    src={user?.profilePhoto} 
                                    alt={`${user?.firstName} ${user?.lastName}`}
                                    size="md"
                                    className="border border-gray-200"
                                />
                                <Button 
                                    onClick={handleLogout}
                                    variant="outline" 
                                    size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="max-w-[75%] mx-auto p-4 sm:p-6 lg:p-8">
                    <Card className="mb-8 shadow-sm border-0">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Avatar 
                                    src={user?.profilePhoto} 
                                    alt={`${user?.firstName} ${user?.lastName}`}
                                    size="xl"
                                    className="border-2 border-blue-200"
                                />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Welcome, {user?.firstName} {user?.lastName}</h2>
                                    <p className="text-gray-600">Hospital Administrator - Operations Management</p>
                                    <div className="mt-1 flex items-center space-x-2">
                                        <Shield className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm text-gray-500">Employee ID: {user?.employeeId}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Badge variant={isCheckedIn ? "default" : "outline"} className={isCheckedIn ? "bg-green-100 text-green-800 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                                    <div className={`w-2 h-2 rounded-full mr-2 ${isCheckedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    {isCheckedIn ? 'Checked-In' : 'Checked-Out'}
                                </Badge>
                                <Button onClick={handleCheckInToggle} className={`w-32 ${isCheckedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                                    {isCheckedIn ? <LogOut className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                                    {isCheckedIn ? 'Check-Out' : 'Check-In'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="dashboard">
                        <div className="sticky top-0 z-50 bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-4 -mx-8 px-8 pt-2">
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 bg-white p-1 h-auto rounded-lg shadow-md border">
                                <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Staff Management</TabsTrigger>
                                <TabsTrigger value="staffTypes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Staff Types</TabsTrigger>
                                <TabsTrigger value="financial" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Financial</TabsTrigger>
                                <TabsTrigger value="registers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Registers</TabsTrigger>
                                <TabsTrigger value="system" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">System Admin</TabsTrigger>
                                <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Reports</TabsTrigger>
                                <TabsTrigger value="salary-leave" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Salary & Leave</TabsTrigger>
                                <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Profile</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="dashboard" className="mt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {todayStats.map((stat, index) => (
                                    <Card key={index} className="shadow-sm border-0 hover:shadow-md transition-shadow">
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                        </CardHeader>
                                        <CardContent>
                                            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                            <StaffManagement />
                        </TabsContent>

                        <TabsContent value="staffTypes" className="mt-6">
                            <StaffTypeManagement />
                        </TabsContent>

                        <TabsContent value="financial" className="mt-6">
                            <FinancialManagement />
                        </TabsContent>

                        <TabsContent value="registers" className="mt-6">
                            <AdminRegisterManagement />
                        </TabsContent>

                        <TabsContent value="system" className="mt-6">
                            <SystemAdministration />
                        </TabsContent>

                        <TabsContent value="reports" className="mt-6">
                            <ReportsAnalytics />
                        </TabsContent>

                        <TabsContent value="salary-leave" className="mt-6">
                            <StaffSalaryLeave staffType={user?.staffType} />
                        </TabsContent>
                        <TabsContent value="profile" className="mt-6">
                            <ProfileTab staffType={user?.staffType} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
};

export default AdministratorDashboard;