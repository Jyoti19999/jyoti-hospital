// src/components/profile/SuperAdminSecuritySettings.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const SuperAdminSecuritySettings = ({ data, onUpdate, onSave }) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const isPasswordOld = () => {
    const lastChange = new Date(data.lastPasswordChange);
    const daysSince = Math.floor((new Date() - lastChange) / (1000 * 60 * 60 * 24));
    return daysSince > 90; // Consider old if more than 90 days
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/super-admin/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Password changed successfully');
        setShowPasswordDialog(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        // Update last password change date
        onUpdate({ ...data, lastPasswordChange: new Date().toISOString() });
      } else {
        toast.error(result.error || result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-blue-600" />
          <span>Security Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Security Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPasswordOld() ? 'bg-yellow-100' : 'bg-green-100'}`}>
                  <Shield className={`h-5 w-5 ${isPasswordOld() ? 'text-yellow-600' : 'text-green-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold">Password</h3>
                  <p className="text-sm text-gray-600">Last changed</p>
                </div>
              </div>
              <Badge variant={isPasswordOld() ? 'secondary' : 'default'}>
                {isPasswordOld() ? 'Update Required' : 'Recent'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100">
                  <Lock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Account Status</h3>
                  <p className="text-sm text-gray-600">Security status</p>
                </div>
              </div>
              <Badge variant={data.status === 'Active' ? 'default' : 'destructive'}>
                {data.status || 'Active'}
              </Badge>
            </div>
          </div>

          {/* Password Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Password Information</h3>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600">Last Password Change:</span>
                  <span className="text-sm font-medium text-blue-800">
                    {new Date(data.lastPasswordChange).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-600">Days Since Change:</span>
                  <span className={`text-sm font-medium ${isPasswordOld() ? 'text-red-600' : 'text-blue-800'}`}>
                    {Math.floor((new Date() - new Date(data.lastPasswordChange)) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                {isPasswordOld() && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-700">
                      ⚠️ Your password is more than 90 days old. Consider changing it for better security.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start" onClick={() => setShowPasswordDialog(true)}>
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
              
              <Button variant="outline" className="justify-start">
                <Shield className="w-4 h-4 mr-2" />
                Security Audit
              </Button>
            </div>
          </div>
        </div>

        {/* Change Password Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password (min 8 characters)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  Password must be at least 8 characters long and contain a mix of letters, numbers, and special characters.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)} disabled={changingPassword}>
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={changingPassword}>
                {changingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SuperAdminSecuritySettings;
