// src/pages/SuperAdminProfile.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, Settings, Lock, Eye, LayoutDashboard, AlertCircle, UserCheck, Users, Download, LogOut, Bell } from 'lucide-react';
import { PhotoUpload } from '@/components/profile/PhotoUpload';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import SuperAdminPersonalInfo from '@/components/profile/SuperAdminPersonalInfo';
import SuperAdminSecuritySettings from '@/components/profile/SuperAdminSecuritySettings';
import AuthContext from '@/contexts/AuthContext';

const SuperAdminProfile = () => {
  const { toast } = useToast();
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [adminData, setAdminData] = useState({
    personalInfo: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'superadmin@ophthalmovision.com',
      phone: '+91 98765 43210',
      designation: 'Super Administrator',
      status: 'Active'
    },
    securitySettings: {
      lastPasswordChange: new Date().toISOString(),
      status: 'Active'
    },
    photo: null
  });

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/super-admin/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const profileData = result.data;

        setAdminData({
          personalInfo: {
            firstName: profileData.firstName || 'Admin',
            lastName: profileData.lastName || 'User',
            email: profileData.email || 'superadmin@ophthalmovision.com',
            phone: profileData.phone || '+91 98765 43210',
            designation: 'Super Administrator',
            status: profileData.isActive ? 'Active' : 'Inactive'
          },
          securitySettings: {
            lastPasswordChange: profileData.lastPasswordChange || new Date().toISOString(),
            status: profileData.isActive ? 'Active' : 'Inactive'
          },
          photo: profileData.photo || null
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoUpdate = (info) => {
    setAdminData(prev => ({
      ...prev,
      personalInfo: info
    }));
  };

  const handleSecurityUpdate = (data) => {
    setAdminData(prev => ({
      ...prev,
      securitySettings: { ...prev.securitySettings, ...data }
    }));
  };

  const handlePhotoUpdate = (photo) => {
    setAdminData(prev => ({
      ...prev,
      photo
    }));
  };

  const handleSave = (section) => {
    toast({
      title: "Profile Updated",
      description: `Your ${section} has been successfully updated.`,
    });
  };

  const calculateOverallCompletion = () => {
    // Simple completion based on required fields
    const requiredFields = [
      adminData.personalInfo.firstName,
      adminData.personalInfo.lastName,
      adminData.personalInfo.email,
      adminData.personalInfo.phone,
      adminData.personalInfo.status
    ];

    const filledFields = requiredFields.filter(field => field && field.toString().trim()).length;
    return Math.round((filledFields / requiredFields.length) * 100);
  };

  const hasUrgentItems = () => {
    const passwordOld = adminData.securitySettings.lastPasswordChange &&
      new Date(adminData.securitySettings.lastPasswordChange) <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const isInactive = adminData.personalInfo.status === 'Inactive';

    return passwordOld || isInactive;
  };

  const handleSignOut = () => {
    logout();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
    navigate('/superadmin-login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Profile</h1>
            <p className="text-gray-600 mt-1">Manage your settings and preferences</p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Shield className="h-3 w-3 mr-1" />
            Super Administrator
          </Badge>
        </div>

        {/* Status Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Account Status */}
          <Card className={`shadow-sm border-0 border-l-4 ${adminData.personalInfo.status === 'Active' ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${adminData.personalInfo.status === 'Active' ? 'bg-green-100' : 'bg-red-100'}`}>
                  <UserCheck className={`h-6 w-6 ${adminData.personalInfo.status === 'Active' ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${adminData.personalInfo.status === 'Active' ? 'text-green-800' : 'text-red-800'}`}>
                    Account {adminData.personalInfo.status}
                  </h3>
                  <p className={`text-sm ${adminData.personalInfo.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                    {adminData.personalInfo.status === 'Active' ? 'Full system access' : 'Access restricted'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card className="shadow-sm border-0 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100">
                  <Lock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-blue-800">Password Status</h3>
                  <p className="text-sm text-blue-600">
                    Last changed: {new Date(adminData.securitySettings.lastPasswordChange).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Photo and Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <PhotoUpload
              currentPhoto={adminData.photo}
              patientName={`${adminData.personalInfo.firstName} ${adminData.personalInfo.lastName}`}
              onPhotoUpdate={handlePhotoUpdate}
            />

            <Card className="shadow-sm border-0">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 text-gray-900">Profile Completion</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="text-sm font-medium text-blue-600">{calculateOverallCompletion()}%</span>
                  </div>
                  <Progress value={calculateOverallCompletion()} className="h-2" />
                  <div className="text-xs text--600">
                    Complete all sections for optimal system administration
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="personal" className="space-y-6" id="profile-tabs">
              <div className="sticky top-0 z-50 bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-4 -mx-6 px-6 pt-2">
                <TabsList className="grid w-full grid-cols-2 bg-white shadow-md border">
                  <TabsTrigger value="personal" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                    <User className="w-4 h-4" />
                    Personal Info
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                    <Lock className="w-4 h-4" />
                    Security
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="personal">
                <SuperAdminPersonalInfo
                  data={adminData.personalInfo}
                  onUpdate={handlePersonalInfoUpdate}
                  onSave={() => handleSave('personal information')}
                />
              </TabsContent>

              <TabsContent value="security">
                <SuperAdminSecuritySettings
                  data={adminData.securitySettings}
                  onUpdate={handleSecurityUpdate}
                  onSave={() => handleSave('security settings')}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminProfile;
