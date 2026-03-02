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
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import {
    LogIn,
    LogOut,
    Heart,
    Activity,
    Thermometer,
    Clock,
    Users,
    Calendar,
    Eye,
    AlertTriangle,
    CheckCircle,
    Clipboard,
    Stethoscope,
    User,
    Edit,
    Save,
    X,
    Mail,
    Phone,
    MapPin,
    UserCheck,
    Pill,
    TrendingUp,
    FileText,
    Monitor
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

// Chart Data for Nursing
const vitalSignsData = [
    { day: 'Mon', vitals: 45, medications: 32 },
    { day: 'Tue', vitals: 52, medications: 38 },
    { day: 'Wed', vitals: 38, medications: 28 },
    { day: 'Thu', vitals: 61, medications: 42 },
    { day: 'Fri', vitals: 58, medications: 35 },
    { day: 'Sat', vitals: 35, medications: 25 },
];

const patientCareData = [
    { name: 'ICU Patients', value: 12, color: '#FF6B6B' },
    { name: 'General Ward', value: 25, color: '#4ECDC4' },
    { name: 'Post-Op Care', value: 8, color: '#45B7D1' },
    { name: 'Emergency', value: 5, color: '#FFA07A' },
];

const shiftPerformanceData = [
    { time: '6 AM', patients: 15, medications: 25, vitals: 18 },
    { time: '9 AM', patients: 22, medications: 35, vitals: 28 },
    { time: '12 PM', patients: 18, medications: 28, vitals: 22 },
    { time: '3 PM', patients: 25, medications: 40, vitals: 30 },
    { time: '6 PM', patients: 20, medications: 32, vitals: 25 },
    { time: '9 PM', patients: 12, medications: 18, vitals: 15 },
];

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

// Patient Care Management Component
const PatientCareManagement = () => {
    const [selectedWard, setSelectedWard] = useState('');
    const [careData, setCareData] = useState({
        patientId: '',
        vitalSigns: {},
        medications: [],
        careNotes: ''
    });

    const assignedPatients = [
        { id: 'P001', name: 'Rajesh Sharma', room: 'ICU-1', condition: 'Post-Surgery', priority: 'High', lastVitals: '10:30 AM' },
        { id: 'P002', name: 'Priya Joshi', room: 'Ward-205', condition: 'Recovery', priority: 'Medium', lastVitals: '11:15 AM' },
        { id: 'P003', name: 'Arun Deshpande', room: 'ICU-3', condition: 'Critical', priority: 'High', lastVitals: '9:45 AM' },
        { id: 'P004', name: 'Sunita Pawar', room: 'Ward-112', condition: 'Stable', priority: 'Low', lastVitals: '12:00 PM' },
    ];

    const medicationSchedule = [
        { time: '8:00 AM', patient: 'Rajesh Sharma', medication: 'Antibiotic IV', status: 'Due' },
        { time: '9:30 AM', patient: 'Priya Joshi', medication: 'Pain Relief', status: 'Completed' },
        { time: '10:00 AM', patient: 'Arun Deshpande', medication: 'Heart Medication', status: 'Due' },
        { time: '11:30 AM', patient: 'Sunita Pawar', medication: 'Eye Drops', status: 'Pending' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <span>Assigned Patients</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {assignedPatients.map((patient) => (
                            <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                        <div>
                                            <p className="font-medium">{patient.name}</p>
                                            <p className="text-sm text-gray-500">{patient.room} • {patient.condition}</p>
                                            <p className="text-xs text-gray-400">Last vitals: {patient.lastVitals}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Badge 
                                        className={`text-xs ${
                                            patient.priority === 'High' ? 'bg-red-100 text-red-800' :
                                            patient.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}
                                    >
                                        {patient.priority}
                                    </Badge>
                                    <Button size="sm" variant="outline">
                                        <Activity className="h-4 w-4 mr-1" />
                                        Vitals
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Pill className="h-5 w-5 text-green-600" />
                        <span>Medication Schedule</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {medicationSchedule.map((med, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-medium">{med.medication}</p>
                                    <p className="text-sm text-gray-500">{med.patient} • {med.time}</p>
                                </div>
                                <Badge 
                                    className={`text-xs ${
                                        med.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                        med.status === 'Due' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}
                                >
                                    {med.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                    <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                        <Pill className="h-4 w-4 mr-2" />
                        Administer Medication
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

// Vital Signs Monitoring Component
const VitalSignsMonitoring = () => {
    const [selectedPatient, setSelectedPatient] = useState('');
    const [vitalType, setVitalType] = useState('temperature');

    const recentVitals = [
        { patient: 'Rajesh Sharma', temp: '98.6°F', bp: '120/80', pulse: '72 bpm', time: '10:30 AM', status: 'Normal' },
        { patient: 'Priya Joshi', temp: '99.2°F', bp: '130/85', pulse: '78 bpm', time: '11:15 AM', status: 'Elevated' },
        { patient: 'Arun Deshpande', temp: '101.3°F', bp: '140/90', pulse: '88 bpm', time: '9:45 AM', status: 'High' },
        { patient: 'Sunita Pawar', temp: '98.4°F', bp: '115/75', pulse: '68 bpm', time: '12:00 PM', status: 'Normal' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Vitals Recorded</p>
                                <p className="text-2xl font-bold">127</p>
                            </div>
                            <Activity className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Normal Range</p>
                                <p className="text-2xl font-bold text-green-600">89</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Elevated</p>
                                <p className="text-2xl font-bold text-yellow-600">28</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Critical</p>
                                <p className="text-2xl font-bold text-red-600">10</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Daily Vital Signs & Medications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={vitalSignsData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="vitals" fill="#3B82F6" name="Vital Signs" />
                                <Bar dataKey="medications" fill="#10B981" name="Medications" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Patient Care Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie 
                                    data={patientCareData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={80} 
                                    label={({name, value}) => `${name}: ${value}`}
                                >
                                    {patientCareData.map((entry, index) => (
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

            <Card className="bg-white">
                <CardHeader>
                    <CardTitle>Recent Vital Signs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentVitals.map((vital, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-4">
                                        <div>
                                            <p className="font-medium">{vital.patient}</p>
                                            <p className="text-sm text-gray-500">
                                                Temp: {vital.temp} | BP: {vital.bp} | Pulse: {vital.pulse}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">{vital.time}</p>
                                    </div>
                                    <Badge 
                                        className={`text-xs ${
                                            vital.status === 'Normal' ? 'bg-green-100 text-green-800' :
                                            vital.status === 'Elevated' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {vital.status}
                                    </Badge>
                                    <Button size="sm" variant="outline">
                                        <Edit className="h-4 w-4 mr-1" />
                                        Update
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

// Care Plans & Reports Component
const CarePlansReports = () => {
    const [reportType, setReportType] = useState('daily');
    const [dateRange, setDateRange] = useState('today');

    const carePlans = [
        { id: 'CP001', patient: 'Rajesh Sharma', plan: 'Post-Operative Care', priority: 'High', nextReview: '2024-01-16' },
        { id: 'CP002', patient: 'Priya Joshi', plan: 'Wound Care Management', priority: 'Medium', nextReview: '2024-01-17' },
        { id: 'CP003', patient: 'Arun Deshpande', plan: 'Cardiac Monitoring', priority: 'High', nextReview: '2024-01-15' },
        { id: 'CP004', patient: 'Sunita Pawar', plan: 'Medication Compliance', priority: 'Low', nextReview: '2024-01-18' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center">
                <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Report Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">Daily Reports</SelectItem>
                        <SelectItem value="weekly">Weekly Summary</SelectItem>
                        <SelectItem value="monthly">Monthly Analysis</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
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
                        <CardTitle>Active Care Plans</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {carePlans.map((plan) => (
                                <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-4">
                                            <div>
                                                <p className="font-medium">{plan.patient}</p>
                                                <p className="text-sm text-gray-500">{plan.plan}</p>
                                                <p className="text-xs text-gray-400">Next review: {plan.nextReview}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge 
                                            className={`text-xs ${
                                                plan.priority === 'High' ? 'bg-red-100 text-red-800' :
                                                plan.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}
                                        >
                                            {plan.priority}
                                        </Badge>
                                        <Button size="sm" variant="outline">
                                            <Edit className="h-4 w-4 mr-1" />
                                            Update
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Shift Performance (Today)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={shiftPerformanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="patients" stroke="#3B82F6" strokeWidth={3} name="Patients Seen" />
                                <Line type="monotone" dataKey="medications" stroke="#10B981" strokeWidth={3} name="Medications Given" />
                                <Line type="monotone" dataKey="vitals" stroke="#F59E0B" strokeWidth={3} name="Vitals Recorded" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const NurseDashboard = () => {
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
        { title: "Patients Under Care", value: "23", icon: Users, color: "text-blue-600" },
        { title: "Medications Given", value: "47", icon: Pill, color: "text-green-600" },
        { title: "Vitals Recorded", value: "89", icon: Activity, color: "text-purple-600" },
        { title: "Care Plans Updated", value: "12", icon: Clipboard, color: "text-orange-600" },
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
                                    <p className="text-gray-600">Nurse - Patient Care Specialist</p>
                                    <div className="mt-1 flex items-center space-x-2">
                                        <Heart className="h-4 w-4 text-blue-500" />
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
                            <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Patient Care Overview</TabsTrigger>
                            <TabsTrigger value="patients" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Patient Management</TabsTrigger>
                            <TabsTrigger value="vitals" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Vital Signs</TabsTrigger>
                            <TabsTrigger value="carePlans" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Care Plans</TabsTrigger>
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
                                        <CardTitle>Daily Activity Trends (This Week)</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={vitalSignsData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="day" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="vitals" fill="#3B82F6" name="Vital Signs" />
                                                <Bar dataKey="medications" fill="#10B981" name="Medications" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white">
                                    <CardHeader>
                                        <CardTitle>Patient Care Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie 
                                                    data={patientCareData} 
                                                    dataKey="value" 
                                                    nameKey="name" 
                                                    cx="50%" 
                                                    cy="50%" 
                                                    outerRadius={80} 
                                                    label={({value}) => `${value}`}
                                                >
                                                    {patientCareData.map((entry, index) => (
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
                        </TabsContent>

                        <TabsContent value="patients" className="mt-6">
                            <PatientCareManagement />
                        </TabsContent>

                        <TabsContent value="vitals" className="mt-6">
                            <VitalSignsMonitoring />
                        </TabsContent>

                        <TabsContent value="carePlans" className="mt-6">
                            <CarePlansReports />
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

export default NurseDashboard;