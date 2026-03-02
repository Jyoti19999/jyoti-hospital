import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, EyeOff, Building2, Users, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import useTpaStore from '@/stores/tpa/tpaStore';

const TPALogin = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useTpaStore();
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = login(credentials);
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.user.name}!`,
        });
        navigate('/tpa-dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const demoAccounts = [
    {
      email: 'admin@tpa.com',
      role: 'TPA Administrator',
      description: 'Full system access and user management',
      approvalLimit: '₹10,00,000',
      color: 'bg-destructive text-destructive-foreground',
    },
    {
      email: 'senior@tpa.com',
      role: 'Senior TPA Officer',
      description: 'High-value claim approval authority',
      approvalLimit: '₹5,00,000',
      color: 'bg-primary text-primary-foreground',
    },
    {
      email: 'junior@tpa.com',
      role: 'Junior TPA Officer',
      description: 'Standard claim processing',
      approvalLimit: '₹1,00,000',
      color: 'bg-secondary text-secondary-foreground',
    },
    {
      email: 'reviewer@tpa.com',
      role: 'TPA Reviewer',
      description: 'Document verification specialist',
      approvalLimit: '₹50,000',
      color: 'bg-accent text-accent-foreground',
    },
  ];
  
  const handleDemoLogin = (email) => {
    setCredentials({ email, password: 'tpa123' });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Login Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">TPA Portal</CardTitle>
              <p className="text-muted-foreground">
                Third Party Administrator Login
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={credentials.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                    className="h-12 bg-background border-input"
                  />
                </div>
                
                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      required
                      className="h-12 bg-background border-input pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
              
              {/* Security Notice */}
              <div className="mt-6 p-3 bg-muted rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Security Notice:</p>
                    <p>This portal handles sensitive insurance claim data. All activities are monitored and logged for compliance purposes.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Demo Accounts & Information */}
        <div className="space-y-6">
          {/* Demo Accounts */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Demo Accounts</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Click any account below to auto-fill credentials (Password: tpa123)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {demoAccounts.map((account, index) => (
                <div
                  key={index}
                  className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleDemoLogin(account.email)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-foreground">{account.role}</h4>
                      <p className="text-sm text-muted-foreground">{account.email}</p>
                    </div>
                    <Badge className={account.color}>
                      {account.approvalLimit}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{account.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {/* System Information */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>System Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">24/7</p>
                  <p className="text-xs text-muted-foreground">System Availability</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">500+</p>
                  <p className="text-xs text-muted-foreground">Hospitals Connected</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">10K+</p>
                  <p className="text-xs text-muted-foreground">Claims Processed</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-primary">95%</p>
                  <p className="text-xs text-muted-foreground">Approval Rate</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium text-foreground mb-2">Key Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time claim processing and approval</li>
                  <li>• Automated policy verification system</li>
                  <li>• Integrated communication hub</li>
                  <li>• Comprehensive audit trail</li>
                  <li>• Advanced analytics and reporting</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TPALogin;