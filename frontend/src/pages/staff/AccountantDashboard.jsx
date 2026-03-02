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
import profileService from "@/services/profileService";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileTab from "@/components/ProfileTab";
import StaffSalaryLeave from "@/components/StaffSalaryLeave";
import { toast } from "sonner";
import ProfileManagement from "./ProfileManagement";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import {
    LogIn,
    LogOut,
    DollarSign,
    FileText,
    CreditCard,
    Calculator,
    TrendingUp,
    Clock,
    Users,
    Calendar,
    Eye,
    AlertTriangle,
    CheckCircle,
    Receipt,
    Building,
    PieChart as PieChartIcon,
    User,
    Edit,
    Save,
    X,
    Mail,
    Phone,
    MapPin,
    UserCheck
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

// Chart Data for Accounting
const dailyRevenueData = [
    { day: 'Mon', revenue: 45320, expenses: 12000 },
    { day: 'Tue', revenue: 52480, expenses: 15000 },
    { day: 'Wed', revenue: 38750, expenses: 11000 },
    { day: 'Thu', revenue: 61230, expenses: 18000 },
    { day: 'Fri', revenue: 58900, expenses: 16500 },
    { day: 'Sat', revenue: 35600, expenses: 9000 },
];

const paymentMethodData = [
    { name: 'Cash', value: 35, amount: 156000 },
    { name: 'Card', value: 45, amount: 201000 },
    { name: 'Insurance', value: 15, amount: 67000 },
    { name: 'UPI/Digital', value: 5, amount: 22000 },
];

const monthlyTrendsData = [
    { month: 'Jan', revenue: 1250000, expenses: 450000, profit: 800000 },
    { month: 'Feb', revenue: 1380000, expenses: 480000, profit: 900000 },
    { month: 'Mar', revenue: 1420000, expenses: 520000, profit: 900000 },
    { month: 'Apr', revenue: 1680000, expenses: 580000, profit: 1100000 },
    { month: 'May', revenue: 1550000, expenses: 550000, profit: 1000000 },
    { month: 'Jun', revenue: 1720000, expenses: 610000, profit: 1110000 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Billing and Payments Component
const BillingPayments = () => {
    const [selectedPatient, setSelectedPatient] = useState('');
    const [billingData, setBillingData] = useState({
        patientId: '',
        services: [],
        totalAmount: 0,
        paymentMethod: '',
        insuranceDetails: ''
    });

    const recentBills = [
        { id: 'INV001', patient: 'Rajesh Sharma', amount: 15750, status: 'Paid', date: '2024-01-15', method: 'Card' },
        { id: 'INV002', patient: 'Priya Joshi', amount: 8500, status: 'Pending', date: '2024-01-15', method: 'Insurance' },
        { id: 'INV003', patient: 'Arun Deshpande', amount: 25000, status: 'Paid', date: '2024-01-14', method: 'Cash' },
        { id: 'INV004', patient: 'Sunita Pawar', amount: 12300, status: 'Overdue', date: '2024-01-12', method: 'UPI' },
    ];

    const servicesList = [
        { name: 'General Consultation', price: 500 },
        { name: 'Eye Examination', price: 800 },
        { name: 'Cataract Surgery', price: 25000 },
        { name: 'Retinal Scan', price: 1500 },
        { name: 'Glaucoma Treatment', price: 3000 },
        { name: 'Contact Lens Fitting', price: 1200 },
    ];
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Receipt className="h-5 w-5 text-blue-600" />
                        <span>Generate Bill</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="patientSelect">Select Patient</Label>
                            <Select onValueChange={setSelectedPatient}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose patient" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="p1">Rajesh Sharma (OPH20241001)</SelectItem>
                                    <SelectItem value="p2">Priya Joshi (OPH20241002)</SelectItem>
                                    <SelectItem value="p3">Arun Deshpande (OPH20241003)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Services Provided</Label>
                            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                {servicesList.map((service, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                                        <span className="text-sm">{service.name}</span>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium">₹{service.price}</span>
                                            <input type="checkbox" className="rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="paymentMethod">Payment Method</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                    <SelectItem value="insurance">Insurance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                            <Calculator className="h-4 w-4 mr-2" />
                            Generate Invoice
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white">
                <CardHeader>
                    <CardTitle>Recent Bills</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {recentBills.map((bill) => (
                            <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-medium">{bill.patient}</p>
                                    <p className="text-sm text-gray-500">{bill.id} • {bill.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">₹{bill.amount.toLocaleString()}</p>
                                    <Badge 
                                        variant={bill.status === 'Paid' ? 'default' : bill.status === 'Pending' ? 'secondary' : 'destructive'}
                                        className={`text-xs ${
                                            bill.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                            bill.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {bill.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Financial Reports Component
const FinancialReports = () => {
    const [reportType, setReportType] = useState('daily');
    const [dateRange, setDateRange] = useState('thisWeek');

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
                <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Report Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">Daily Reports</SelectItem>
                        <SelectItem value="monthly">Monthly Summary</SelectItem>
                        <SelectItem value="quarterly">Quarterly Analysis</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="lastMonth">Last Month</SelectItem>
                        <SelectItem value="thisQuarter">This Quarter</SelectItem>
                    </SelectContent>
                </Select>

                <Button className="bg-blue-600 hover:bg-blue-700">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Revenue vs Expenses (This Week)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dailyRevenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                <Legend />
                                <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Payment Methods Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                    data={paymentMethodData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={80} 
                                    label={({name, value}) => `${name}: ${value}%`}
                                >
                                    {paymentMethodData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white">
                <CardHeader>
                    <CardTitle>Monthly Trends (6 Months)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={monthlyTrendsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} name="Revenue" />
                            <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} name="Expenses" />
                            <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} name="Profit" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

// Insurance Management Component
const InsuranceManagement = () => {
    const pendingClaims = [
        { id: 'CL001', patient: 'Rajesh Sharma', provider: 'Star Health', amount: 25000, status: 'Under Review', date: '2024-01-10' },
        { id: 'CL002', patient: 'Priya Joshi', provider: 'HDFC ERGO', amount: 15000, status: 'Approved', date: '2024-01-12' },
        { id: 'CL003', patient: 'Arun Deshpande', provider: 'ICICI Lombard', amount: 35000, status: 'Documents Required', date: '2024-01-08' },
        { id: 'CL004', patient: 'Sunita Pawar', provider: 'Oriental Insurance', amount: 12000, status: 'Rejected', date: '2024-01-05' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Claims</p>
                                <p className="text-2xl font-bold">47</p>
                            </div>
                            <FileText className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Approved</p>
                                <p className="text-2xl font-bold text-green-600">32</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">12</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Rejected</p>
                                <p className="text-2xl font-bold text-red-600">3</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white">
                <CardHeader>
                    <CardTitle>Recent Insurance Claims</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {pendingClaims.map((claim) => (
                            <div key={claim.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-4">
                                        <div>
                                            <p className="font-medium">{claim.patient}</p>
                                            <p className="text-sm text-gray-500">{claim.id} • {claim.provider}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="font-bold">₹{claim.amount.toLocaleString()}</p>
                                        <p className="text-sm text-gray-500">{claim.date}</p>
                                    </div>
                                    <Badge 
                                        variant={
                                            claim.status === 'Approved' ? 'default' : 
                                            claim.status === 'Under Review' ? 'secondary' : 
                                            claim.status === 'Documents Required' ? 'outline' : 'destructive'
                                        }
                                        className={`text-xs ${
                                            claim.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                            claim.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                                            claim.status === 'Documents Required' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {claim.status}
                                    </Badge>
                                    <Button size="sm" variant="outline">
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Profile Management Component


const AccountantDashboard = () => {
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
        { title: "Today's Revenue", value: "₹2,45,320", icon: DollarSign, color: "text-green-600" },
        { title: "Bills Generated", value: "47", icon: FileText, color: "text-blue-600" },
        { title: "Pending Payments", value: "₹85,450", icon: CreditCard, color: "text-orange-600" },
        { title: "Insurance Claims", value: "12", icon: Building, color: "text-purple-600" },
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

            <div className="bg-gray-50/50 min-h-screen">
                <div className="max-w-[75%] mx-auto p-4 sm:p-6 lg:p-8">
                    <Card className="mb-8 bg-white shadow-lg border-0">
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
                                    <p className="text-gray-600">Accountant - Financial Operations</p>
                                    <div className="mt-1 flex items-center space-x-2">
                                        <Calculator className="h-4 w-4 text-blue-500" />
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
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-white p-1 h-auto rounded-lg shadow-sm border">
                            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Financial Overview</TabsTrigger>
                            <TabsTrigger value="billing" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Billing & Payments</TabsTrigger>
                            <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Financial Reports</TabsTrigger>
                            <TabsTrigger value="insurance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Insurance Claims</TabsTrigger>
                            <TabsTrigger value="salary-leave" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Salary & Leave</TabsTrigger>
                            <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Profile</TabsTrigger>
                        </TabsList>

                        <TabsContent value="dashboard" className="mt-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {todayStats.map((stat, index) => (
                                    <Card key={index} className="bg-white hover:shadow-md transition-shadow">
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

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="lg:col-span-2 bg-white">
                                    <CardHeader>
                                        <CardTitle>Daily Revenue Trends (This Week)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={dailyRevenueData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="day" />
                                                <YAxis />
                                                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                                <Legend />
                                                <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white">
                                    <CardHeader>
                                        <CardTitle>Payment Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie 
                                                    data={paymentMethodData} 
                                                    dataKey="value" 
                                                    nameKey="name" 
                                                    cx="50%" 
                                                    cy="50%" 
                                                    outerRadius={80} 
                                                    label={({value}) => `${value}%`}
                                                >
                                                    {paymentMethodData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="billing" className="mt-6">
                            <BillingPayments />
                        </TabsContent>

                        <TabsContent value="reports" className="mt-6">
                            <FinancialReports />
                        </TabsContent>

                        <TabsContent value="insurance" className="mt-6">
                            <InsuranceManagement />
                        </TabsContent>

                        <TabsContent value="salary-leave" className="mt-6">
                            <StaffSalaryLeave staffType={user?.staffType} />
                        </TabsContent>
                        <TabsContent value="profile" className="mt-6">
                            {/* <ProfileManagement staffType="accountant" /> */}
                                 <ProfileTab staffType={user?.staffType} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
};

export default AccountantDashboard;