import React, { useState, useRef } from 'react';
let staffLoginClickCount = 0;
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { getStaffDashboardPath } from '@/config/staffRoutes';

const StaffAuthPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const { toast } = useToast();
    const navigate = useNavigate();
    const { login } = useAuth();

    // Secret: click logo 3 times rapidly to go to superadmin login
    const logoClickCount = useRef(0);
    const logoClickTimer = useRef(null);
    const handleLogoClick = () => {
        logoClickCount.current += 1;
        clearTimeout(logoClickTimer.current);
        if (logoClickCount.current >= 3) {
            logoClickCount.current = 0;
            navigate('/superadmin-login');
            return;
        }
        logoClickTimer.current = setTimeout(() => {
            logoClickCount.current = 0;
        }, 2000);
    };



    // TanStack Query mutation for staff login
    const loginMutation = useMutation({
        mutationFn: authService.staffLogin,
        onSuccess: (response) => {

            if (response.data && response.data.user) {
                const userData = response.data.user;

                // Store user data in auth context
                login(userData);

                // Show success message
                toast({
                    title: "Login Successful",
                    description: `Welcome back, ${userData.firstName}!`,
                    variant: "default",
                });

                // Get the appropriate dashboard route based on staff type
                const dashboardRoute = getStaffDashboardPath(userData.staffType);


                // Navigate to staff-specific dashboard
                navigate(dashboardRoute);
            } else {
                throw new Error('Invalid response structure');
            }
        },
        onError: (error) => {

            let errorMessage = 'Login failed. Please try again.';

            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast({
                title: "Login Failed",
                description: errorMessage,
                variant: "destructive",
            });
        },
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.email || !formData.password) {
            toast({
                title: "Validation Error",
                description: "Please fill in all fields.",
                variant: "destructive",
            });
            return;
        }

        // Trigger the login mutation
        loginMutation.mutate(formData);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-6 px-4 flex items-center justify-center">
            <div className="max-w-md w-full mx-auto">
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <div
                            className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg cursor-default"
                            onClick={handleLogoClick}
                        >
                            <Eye className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Portal</h1>
                    <p className="text-gray-600">Welcome back! Please sign in to continue</p>
                </div>

                <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 select-none" onClick={() => { staffLoginClickCount++; if (staffLoginClickCount >= 3) { staffLoginClickCount = 0; window.location.href = '/digital-display'; } }}>Staff Login</h2>
                        </div>

                        {loginMutation.error && (
                            <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md">
                                {loginMutation.error.response?.data?.error ||
                                    loginMutation.error.response?.data?.message ||
                                    loginMutation.error.message ||
                                    'Login failed. Please check your credentials.'}
                            </div>
                        )}

                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="Enter your email"
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Enter your password"
                                        className="pl-10 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                        Remember me
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    className="text-sm text-blue-600 hover:text-blue-500"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                disabled={loginMutation.isPending}
                            >
                                {loginMutation.isPending ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Signing in...
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        {/* Quick Login Credentials */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-3 text-center">Quick Login (Development)</p>
                            <div className="overflow-x-hidden pb-2">
                                <div className="flex flex-col gap-2  pb-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap hover:bg-blue-50"
                                        onClick={() => setFormData({
                                            email: 'snehapawar@gmail.com',
                                            password: 'Test@123'
                                        })}
                                    >
                                        <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                        Optometrist
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap hover:bg-green-50"
                                        onClick={() => setFormData({
                                            email: 'artisinha@yogineerstech.in',
                                            password: 'Test@123'
                                        })}
                                    >
                                        <Mail className="h-4 w-4 mr-2 text-green-600" />
                                        Receptionist
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap hover:bg-purple-50"
                                        onClick={() => setFormData({
                                            email: 'kirtisawant@gmail.com',
                                            password: 'Test@123'
                                        })}
                                    >
                                        <Lock className="h-4 w-4 mr-2 text-purple-600" />
                                        Receptionist2
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap hover:bg-red-50"
                                        onClick={() => setFormData({
                                            email: 'abhijeetAgre@gmail.com',
                                            password: 'Test@123'
                                        })}
                                    >
                                        <Eye className="h-4 w-4 mr-2 text-red-600" />
                                        Doctor
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap hover:bg-blue-50"
                                        onClick={() => setFormData({
                                            email: 'azammujawar@gmail.com',
                                            password: 'Test@123'
                                        })}
                                    >
                                        <Lock className="h-4 w-4 mr-2 text-blue-600" />
                                        OT-Admin
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap hover:bg-purple-50"
                                        onClick={() => setFormData({
                                            email: 'aditidige@gmail.com',
                                            password: 'Test@123'
                                        })}
                                    >
                                        <Eye className="h-4 w-4 mr-2 text-purple-600" />
                                        Anesthesiologist
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap hover:bg-indigo-50"
                                        onClick={() => setFormData({
                                            email: 'kailashsawant@gmail.com',
                                            password: 'Test@123'
                                        })}
                                    >
                                        <Lock className="h-4 w-4 mr-2 text-indigo-600" />
                                        Surgeon
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap hover:bg-pink-50"
                                        onClick={() => setFormData({
                                            email: 'arundatisinha@gmail.com',
                                            password: 'Test@123'
                                        })}
                                    >
                                        <Mail className="h-4 w-4 mr-2 text-pink-600" />
                                        Sister
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap hover:bg-orange-50"
                                        onClick={() => setFormData({
                                            email: 'archanachaudhary@gmail.com',
                                            password: 'Test@123'
                                        })}
                                    >
                                        <Lock className="h-4 w-4 mr-2 text-orange-600" />
                                        TPA
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap hover:bg-yellow-50"
                                        onClick={() => setFormData({
                                            email: 'shivamdubeg@gmail.com',
                                            password: 'Test@123'
                                        })}
                                    >
                                        <Lock className="h-4 w-4 mr-2 text-yellow-600" />
                                        Safety Officer
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap hover:bg-teal-50"
                                        onClick={() => setFormData({
                                            email: 'kavyabhave@gmail.com',
                                            password: 'Test@123'
                                        })}
                                    >
                                        <Eye className="h-4 w-4 mr-2 text-teal-600" />
                                        Technician
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="whitespace-nowrap hover:bg-cyan-50"
                                        onClick={() => setFormData({
                                            email: 'adityadige@gmail.com',
                                            password: 'Test@123'
                                        })}
                                    >
                                        <Mail className="h-4 w-4 mr-2 text-cyan-600" />
                                        Quality Coordinator
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-6">
                            <p className="text-xs text-gray-500">
                                Secure staff access portal. All login attempts are monitored.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StaffAuthPage;