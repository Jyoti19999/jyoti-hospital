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
    ClipboardCheck,
    Target,
    Award,
    TrendingUp,
    Calendar,
    User,
    FileText,
    CheckCircle,
    AlertCircle
} from "lucide-react";

const auditData = [
    { month: 'Jan', audits: 12, compliance: 95 },
    { month: 'Feb', audits: 15, compliance: 97 },
    { month: 'Mar', audits: 10, compliance: 94 },
    { month: 'Apr', audits: 18, compliance: 98 },
    { month: 'May', audits: 14, compliance: 96 },
    { month: 'Jun', audits: 16, compliance: 99 },
];

const auditList = [
    { id: 'AUD001', department: 'OT Department', type: 'Safety Audit', status: 'Completed', score: 98, date: '2024-02-20' },
    { id: 'AUD002', department: 'Pharmacy', type: 'Quality Audit', status: 'In Progress', score: null, date: '2024-02-25' },
    { id: 'AUD003', department: 'Lab', type: 'Compliance Audit', status: 'Scheduled', score: null, date: '2024-03-01' },
];

const QualityCoordinatorDashboard = () => {
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
                        role: "Quality Coordinator",
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
                                        <p className="text-blue-100 text-xs sm:text-sm">Audits Completed</p>
                                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">24</p>
                                        <p className="text-xs sm:text-sm text-blue-200 mt-1">This month</p>
                                    </div>
                                    <ClipboardCheck className="h-12 w-12 sm:h-14 w-14 text-blue-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                            <CardContent className="p-4 sm:p-5 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-xs sm:text-sm">Quality Metrics</p>
                                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">98%</p>
                                        <p className="text-xs sm:text-sm text-green-200 mt-1">Average score</p>
                                    </div>
                                    <Target className="h-12 w-12 sm:h-14 w-14 text-green-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                            <CardContent className="p-4 sm:p-5 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-yellow-100 text-xs sm:text-sm">Pending Reviews</p>
                                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">5</p>
                                        <p className="text-xs sm:text-sm text-yellow-200 mt-1">Requires action</p>
                                    </div>
                                    <AlertCircle className="h-12 w-12 sm:h-14 w-14 text-yellow-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                            <CardContent className="p-4 sm:p-5 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-xs sm:text-sm">Compliance Score</p>
                                        <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">97%</p>
                                        <p className="text-xs sm:text-sm text-purple-200 mt-1">Hospital-wide</p>
                                    </div>
                                    <Award className="h-12 w-12 sm:h-14 w-14 text-purple-200 opacity-80" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                        <div className="relative flex-shrink-0">
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                                <TabsList className="inline-flex sm:grid w-auto sm:w-full sm:grid-cols-4 bg-white p-1 rounded-lg shadow-sm border min-w-max">
                                    <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Overview
                                    </TabsTrigger>
                                    <TabsTrigger value="audits" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-2">
                                        <ClipboardCheck className="h-4 w-4" />
                                        Audits
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
                                            <h3 className="text-lg font-semibold mb-4">Monthly Audit Performance</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={auditData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="audits" fill="#3B82F6" name="Audits Completed" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-semibold mb-4">Compliance Trend</h3>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={auditData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" />
                                                    <YAxis domain={[90, 100]} />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line type="monotone" dataKey="compliance" stroke="#10B981" strokeWidth={2} name="Compliance %" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="audits" className="flex-1 tab-content-container mt-4">
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Recent Audits
                                    </h3>
                                    <div className="space-y-3">
                                        {auditList.map((audit) => (
                                            <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                                <div className="flex-1">
                                                    <p className="font-medium">{audit.department}</p>
                                                    <p className="text-sm text-gray-500">{audit.type} • {audit.date}</p>
                                                    {audit.score && <p className="text-xs text-gray-400">Score: {audit.score}%</p>}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Badge 
                                                        className={`text-xs ${
                                                            audit.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                            audit.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}
                                                    >
                                                        {audit.status}
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

export default QualityCoordinatorDashboard;
