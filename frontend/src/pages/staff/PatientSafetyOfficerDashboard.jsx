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
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
    Shield,
    AlertTriangle,
    CheckCircle,
    TrendingDown,
    Calendar,
    User,
    FileText,
    Activity
} from "lucide-react";

const incidentData = [
    { month: 'Jan', reported: 8, resolved: 7 },
    { month: 'Feb', reported: 6, resolved: 6 },
    { month: 'Mar', reported: 10, resolved: 8 },
    { month: 'Apr', reported: 5, resolved: 5 },
    { month: 'May', reported: 7, resolved: 6 },
    { month: 'Jun', reported: 4, resolved: 4 },
];

const incidentList = [
    { id: 'INC001', type: 'Medication Error', severity: 'Low', status: 'Resolved', date: '2024-02-20', department: 'Pharmacy' },
    { id: 'INC002', type: 'Patient Fall', severity: 'Medium', status: 'Investigating', date: '2024-02-22', department: 'Ward 3' },
    { id: 'INC003', type: 'Equipment Malfunction', severity: 'High', status: 'Pending', date: '2024-02-25', department: 'OT' },
];

const PatientSafetyOfficerDashboard = () => {
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

            <div className="flex-shrink-0">
                <DashboardHeader
                    currentTime={currentTime}
                    staffInfo={{
                        name: `${user?.firstName} ${user?.lastName}`,
                        role: "Patient Safety Officer",
                        employeeId: user?.employeeId,
                        profilePhoto: user?.profilePhoto
                    }}
                    isCheckedIn={isCheckedIn}
                    onCheckInToggle={() => setIsCheckedIn(!isCheckedIn)}
                    onLogout={async () => { try { await logout(); } catch (e) { } }}
                />
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="w-full px-4 sm:px-6 lg:max-w-[100%] lg:mx-auto lg:px-8 py-4 h-full flex flex-col">

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 flex-shrink-0">
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                            <CardContent className="p-4 sm:p-5 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-xs sm:text-sm">Incidents Reported</p>
                                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">15</p>
                                        <p className="text-xs sm:text-sm text-blue-200 mt-1">This month</p>
                                    </div>
                                    <AlertTriangle className="h-12 w-12 sm:h-14 w-14 text-blue-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                            <CardContent className="p-4 sm:p-5 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-xs sm:text-sm">Incidents Resolved</p>
                                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">12</p>
                                        <p className="text-xs sm:text-sm text-green-200 mt-1">80% resolution rate</p>
                                    </div>
                                    <CheckCircle className="h-12 w-12 sm:h-14 w-14 text-green-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                            <CardContent className="p-4 sm:p-5 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-yellow-100 text-xs sm:text-sm">Pending Investigations</p>
                                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">3</p>
                                        <p className="text-xs sm:text-sm text-yellow-200 mt-1">Requires attention</p>
                                    </div>
                                    <Activity className="h-12 w-12 sm:h-14 w-14 text-yellow-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                            <CardContent className="p-4 sm:p-5 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-xs sm:text-sm">Safety Score</p>
                                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">95%</p>
                                        <p className="text-xs sm:text-sm text-purple-200 mt-1">Hospital-wide</p>
                                    </div>
                                    <Shield className="h-12 w-12 sm:h-14 w-14 text-purple-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                        <div className="relative flex-shrink-0">
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                                <TabsList className="inline-flex sm:grid w-auto sm:w-full sm:grid-cols-4 bg-white p-1 rounded-lg shadow-sm border min-w-max">
                                    <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-2">
                                        <TrendingDown className="h-4 w-4" />
                                        Overview
                                    </TabsTrigger>
                                    <TabsTrigger value="incidents" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Incidents
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

                        <TabsContent value="overview" className="flex-1 tab-content-container mt-4">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-semibold mb-4">Monthly Incident Trends</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={incidentData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="reported" fill="#EF4444" name="Reported" />
                                                    <Bar dataKey="resolved" fill="#10B981" name="Resolved" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-semibold mb-4">Resolution Trend</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={incidentData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} name="Resolved Incidents" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="incidents" className="flex-1 tab-content-container mt-4">
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Recent Incidents
                                    </h3>
                                    <div className="space-y-3">
                                        {incidentList.map((incident) => (
                                            <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                                <div className="flex-1">
                                                    <p className="font-medium">{incident.type}</p>
                                                    <p className="text-sm text-gray-500">{incident.department} • {incident.date}</p>
                                                    <p className="text-xs text-gray-400">Severity: {incident.severity}</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Badge 
                                                        className={`text-xs ${
                                                            incident.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                                                            incident.status === 'Investigating' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                    >
                                                        {incident.status}
                                                    </Badge>
                                                    <Button size="sm" variant="outline">
                                                        <FileText className="h-4 w-4 mr-1" />
                                                        View
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="salary-leave" className="flex-1 tab-content-container mt-4">
                            <StaffSalaryLeave />
                        </TabsContent>

                        <TabsContent value="profile" className="flex-1 tab-content-container mt-4">
                            <ProfileTab />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default PatientSafetyOfficerDashboard;
