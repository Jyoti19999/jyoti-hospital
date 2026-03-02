import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader/Loader";
import ProfileTab from "@/components/ProfileTab";
import StaffSalaryLeave from "@/components/StaffSalaryLeave";
import DashboardHeader from "@/components/reuseable-components/DashboardHeader";
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
    Monitor,
    Camera,
    Activity,
    CheckCircle,
    Settings,
    Wrench,
    Microscope,
    Calendar,
    Clock,
    AlertTriangle,
    FileText,
    User
} from "lucide-react";

// Chart Data
const dailyTestsData = [
    { day: 'Mon', oct: 15, retinal: 8, visual: 12, tonometry: 6 },
    { day: 'Tue', oct: 18, retinal: 10, visual: 15, tonometry: 8 },
    { day: 'Wed', oct: 12, retinal: 6, visual: 10, tonometry: 5 },
    { day: 'Thu', oct: 22, retinal: 12, visual: 18, tonometry: 10 },
    { day: 'Fri', oct: 20, retinal: 11, visual: 16, tonometry: 9 },
    { day: 'Sat', oct: 14, retinal: 7, visual: 11, tonometry: 6 },
];

const testTypeDistribution = [
    { name: 'OCT Scans', value: 35, color: '#3B82F6' },
    { name: 'Retinal Photography', value: 25, color: '#10B981' },
    { name: 'Visual Field Tests', value: 20, color: '#F59E0B' },
    { name: 'Tonometry', value: 20, color: '#EF4444' },
];

const equipmentList = [
    { id: 'OCT001', name: 'OCT Scanner - Room 1', status: 'Operational', lastMaintenance: '2024-01-10' },
    { id: 'FC002', name: 'Fundus Camera - Room 2', status: 'Operational', lastMaintenance: '2024-01-12' },
    { id: 'AR003', name: 'Auto Refractor - Room 3', status: 'Maintenance Required', lastMaintenance: '2023-12-15' },
    { id: 'TON004', name: 'Tonometer - Room 1', status: 'Operational', lastMaintenance: '2024-01-08' },
];

const TechnicianDashboard = () => {
    const { user, logout, fetchStaffProfile } = useAuth();
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const hasCompleteProfile = (u) => {
            return u && (u.dateOfBirth || u.address || u.emergencyContact || u.qualifications || u.certifications);
        };

        const loadCompleteProfile = async () => {
            if (user && user.employeeId && !hasCompleteProfile(user)) {
                setProfileLoading(true);
                try {
                    await fetchStaffProfile();
                } catch (err) {
                } finally {
                    setProfileLoading(false);
                }
            }
        };

        if (user) loadCompleteProfile();
    }, [user?.id]);

    if (profileLoading) return <Loader color="#3B82F6" />;

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
            `}</style>

            {/* Fixed Header */}
            <div className="flex-shrink-0">
                <DashboardHeader
                    currentTime={currentTime}
                    staffInfo={{
                        name: `${user?.firstName} ${user?.lastName}`,
                        role: "Technician",
                        employeeId: user?.employeeId,
                        profilePhoto: user?.profilePhoto
                    }}
                    isCheckedIn={isCheckedIn}
                    onCheckInToggle={() => setIsCheckedIn(!isCheckedIn)}
                    onLogout={async () => { try { await logout(); } catch (e) { } }}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                <div className="w-full px-4 sm:px-6 lg:max-w-[100%] lg:mx-auto lg:px-8 py-4 h-full flex flex-col">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 flex-shrink-0">
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            <CardContent className="p-4 sm:p-5 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-xs sm:text-sm">Tests Completed Today</p>
                                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">18</p>
                                        <p className="text-xs sm:text-sm text-blue-200 mt-1">24 scheduled</p>
                                    </div>
                                    <CheckCircle className="h-12 w-12 sm:h-14 w-14 text-blue-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                            <CardContent className="p-4 sm:p-5 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-xs sm:text-sm">Equipment Maintained</p>
                                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">12</p>
                                        <p className="text-xs sm:text-sm text-green-200 mt-1">This month</p>
                                    </div>
                                    <Wrench className="h-12 w-12 sm:h-14 w-14 text-green-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                            <CardContent className="p-4 sm:p-5 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-yellow-100 text-xs sm:text-sm">Pending Calibrations</p>
                                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">3</p>
                                        <p className="text-xs sm:text-sm text-yellow-200 mt-1">Requires attention</p>
                                    </div>
                                    <AlertTriangle className="h-12 w-12 sm:h-14 w-14 text-yellow-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                            <CardContent className="p-4 sm:p-5 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-xs sm:text-sm">Equipment Status</p>
                                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">85%</p>
                                        <p className="text-xs sm:text-sm text-purple-200 mt-1">Operational</p>
                                    </div>
                                    <Monitor className="h-12 w-12 sm:h-14 w-14 text-purple-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                        <div className="relative flex-shrink-0">
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                                <TabsList className="inline-flex sm:grid w-auto sm:w-full sm:grid-cols-4 bg-white p-1 rounded-lg shadow-sm border min-w-max">
                                    <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        Overview
                                    </TabsTrigger>
                                    <TabsTrigger value="equipment" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        Equipment
                                    </TabsTrigger>
                                    <TabsTrigger value="salary-leave" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Salary & Leave
                                    </TabsTrigger>
                                    <TabsTrigger value="profile" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Profile
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </div>

                        {/* Overview Tab */}
                        <TabsContent value="overview" className="flex-1 tab-content-container mt-4">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-semibold mb-4">Daily Test Performance</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={dailyTestsData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="day" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="oct" fill="#3B82F6" name="OCT Scans" />
                                                    <Bar dataKey="retinal" fill="#10B981" name="Retinal" />
                                                    <Bar dataKey="visual" fill="#F59E0B" name="Visual Field" />
                                                    <Bar dataKey="tonometry" fill="#EF4444" name="Tonometry" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-semibold mb-4">Test Type Distribution</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie 
                                                        data={testTypeDistribution} 
                                                        dataKey="value" 
                                                        nameKey="name" 
                                                        cx="50%" 
                                                        cy="50%" 
                                                        outerRadius={80} 
                                                        label={({name, value}) => `${name}: ${value}%`}
                                                    >
                                                        {testTypeDistribution.map((entry, index) => (
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
                        </TabsContent>

                        {/* Equipment Tab */}
                        <TabsContent value="equipment" className="flex-1 tab-content-container mt-4">
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-blue-600" />
                                        Equipment Status
                                    </h3>
                                    <div className="space-y-3">
                                        {equipmentList.map((equipment) => (
                                            <div key={equipment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                                <div className="flex-1">
                                                    <p className="font-medium">{equipment.name}</p>
                                                    <p className="text-sm text-gray-500">Last maintenance: {equipment.lastMaintenance}</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Badge 
                                                        className={`text-xs ${
                                                            equipment.status === 'Operational' ? 'bg-green-100 text-green-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {equipment.status}
                                                    </Badge>
                                                    <Button size="sm" variant="outline">
                                                        <Wrench className="h-4 w-4 mr-1" />
                                                        Service
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Salary & Leave Tab */}
                        <TabsContent value="salary-leave" className="flex-1 tab-content-container mt-4">
                            <StaffSalaryLeave />
                        </TabsContent>

                        {/* Profile Tab */}
                        <TabsContent value="profile" className="flex-1 tab-content-container mt-4">
                            <ProfileTab />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default TechnicianDashboard;
