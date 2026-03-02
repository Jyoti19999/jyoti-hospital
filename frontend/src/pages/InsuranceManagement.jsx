// src\pages\InsuranceManagement.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Shield, FileText, Download, Search, MapPin, Phone, CheckCircle, Clock, AlertTriangle, CreditCard, Calendar, Users, Building } from 'lucide-react';
import { format } from 'date-fns';


const InsuranceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState('1');

  // Mock data
  const policies = [
    {
      id: '1',
      provider: 'Star Health Insurance',
      policyNumber: 'SH-2024-789456',
      policyType: 'Individual Health Insurance',
      effectiveDate: '2024-01-01',
      expirationDate: '2024-12-31',
      premium: 15000,
      deductible: 5000,
      deductibleUsed: 1200,
      coverageLimit: 500000,
      status: 'active'
    }
  ];

  const claims = [
    {
      id: '1',
      claimNumber: 'CLM-2024-001234',
      serviceDate: '2024-01-15',
      provider: 'Apollo Hospitals',
      description: 'Eye examination and consultation',
      billedAmount: 2500,
      insurancePayment: 2000,
      patientResponsibility: 500,
      status: 'paid',
      submittedDate: '2024-01-16'
    },
    {
      id: '2',
      claimNumber: 'CLM-2024-001235',
      serviceDate: '2024-01-10',
      provider: 'Narayana Health',
      description: 'Diagnostic blood tests',
      billedAmount: 1200,
      insurancePayment: 960,
      patientResponsibility: 240,
      status: 'processing',
      submittedDate: '2024-01-11'
    }
  ];

  const providers = [
    {
      id: '1',
      name: 'Apollo Hospitals',
      specialty: 'Multi-specialty',
      address: 'Bannerghatta Road, Bangalore',
      phone: '+91-80-26304050',
      distance: 2.5,
      networkStatus: 'in-network',
      rating: 4.8
    },
    {
      id: '2',
      name: 'Narayana Health',
      specialty: 'Multi-specialty',
      address: 'Bommasandra, Bangalore',
      phone: '+91-80-71222222',
      distance: 8.2,
      networkStatus: 'in-network',
      rating: 4.6
    },
    {
      id: '3',
      name: 'Fortis Hospital',
      specialty: 'Multi-specialty',
      address: 'Cunningham Road, Bangalore',
      phone: '+91-80-66214444',
      distance: 5.1,
      networkStatus: 'in-network',
      rating: 4.5
    }
  ];

  const benefits = [
    {
      category: 'Outpatient Services',
      description: 'Doctor visits, consultations',
      coverage: 80,
      copay: 500,
      used: 2500,
      limit: 50000
    },
    {
      category: 'Inpatient Care',
      description: 'Hospital admissions',
      coverage: 100,
      copay: 0,
      used: 0,
      limit: 500000
    },
    {
      category: 'Prescription Drugs',
      description: 'Medications and pharmacy',
      coverage: 70,
      copay: 100,
      used: 800,
      limit: 25000
    },
    {
      category: 'Diagnostic Tests',
      description: 'Lab tests, imaging',
      coverage: 80,
      copay: 200,
      used: 1200,
      limit: 15000
    },
    {
      category: 'Emergency Services',
      description: '24/7 emergency care',
      coverage: 100,
      copay: 0,
      used: 0,
      limit: 100000
    }
  ];

  const currentPolicy = policies.find(p => p.id === selectedPolicy);
  const deductibleProgress = currentPolicy ? (currentPolicy.deductibleUsed / currentPolicy.deductible) * 100 : 0;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': case 'approved': case 'paid': return 'bg-green-100 text-green-800';
      case 'processing': case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'denied': case 'expired': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNetworkColor = (status) => {
    return status === 'in-network' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Insurance Management</h1>
                <p className="text-sm text-slate-600">Manage your health insurance and claims</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <CreditCard className="h-4 w-4 mr-2" />
                Digital Card
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Policy Overview */}
        {currentPolicy && (
          <Card className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-6 w-6 mr-2" />
                  {currentPolicy.provider}
                </div>
                <Badge className="bg-white text-blue-600">
                  {currentPolicy.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <p className="text-blue-100 text-sm">Policy Number</p>
                  <p className="font-semibold">{currentPolicy.policyNumber}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Coverage Limit</p>
                  <p className="font-semibold">₹{currentPolicy.coverageLimit.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Annual Premium</p>
                  <p className="font-semibold">₹{currentPolicy.premium.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Valid Until</p>
                  <p className="font-semibold">{format(new Date(currentPolicy.expirationDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-blue-100 text-sm">Deductible Progress</span>
                  <span className="text-sm">₹{currentPolicy.deductibleUsed} / ₹{currentPolicy.deductible}</span>
                </div>
                <div className="w-full bg-blue-500 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${deductibleProgress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="coverage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="coverage">Coverage</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="coverage" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Policy Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Policy Type</span>
                    <span className="font-medium">{currentPolicy?.policyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Effective Date</span>
                    <span className="font-medium">
                      {currentPolicy && format(new Date(currentPolicy.effectiveDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Renewal Date</span>
                    <span className="font-medium">
                      {currentPolicy && format(new Date(currentPolicy.expirationDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Premium Frequency</span>
                    <span className="font-medium">Annual</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Coverage Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sum Insured</span>
                    <span className="font-medium">₹{currentPolicy?.coverageLimit.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deductible</span>
                    <span className="font-medium">₹{currentPolicy?.deductible.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Co-insurance</span>
                    <span className="font-medium">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Out-of-pocket Max</span>
                    <span className="font-medium">₹50,000</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Benefits Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => {
                    const usagePercentage = (benefit.used / benefit.limit) * 100;
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">{benefit.category}</h3>
                          <span className="text-sm text-gray-600">
                            ₹{benefit.used.toLocaleString()} / ₹{benefit.limit.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={usagePercentage} className="h-2 mb-2" />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{benefit.coverage}% coverage</span>
                          <span>₹{benefit.copay} copay</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Claims History</h2>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Submit New Claim
              </Button>
            </div>

            <div className="space-y-4">
              {claims.map((claim) => (
                <Card key={claim.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{claim.description}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>Claim #{claim.claimNumber}</span>
                          <span>{format(new Date(claim.serviceDate), 'MMM dd, yyyy')}</span>
                          <span>{claim.provider}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(claim.status)}>
                        {claim.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Billed Amount</h4>
                        <p className="text-sm text-gray-600">₹{claim.billedAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Insurance Payment</h4>
                        <p className="text-sm text-green-600">₹{claim.insurancePayment.toLocaleString()}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Your Responsibility</h4>
                        <p className="text-sm text-gray-600">₹{claim.patientResponsibility.toLocaleString()}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Submitted</h4>
                        <p className="text-sm text-gray-600">{format(new Date(claim.submittedDate), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View EOB
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="providers" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search providers by name or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Find Nearby
              </Button>
            </div>

            <div className="space-y-4">
              {providers.map((provider) => (
                <Card key={provider.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{provider.name}</h3>
                          <p className="text-gray-600 mb-1">{provider.specialty}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {provider.distance} km away
                            </span>
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {provider.phone}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{provider.address}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getNetworkColor(provider.networkStatus)}>
                          {provider.networkStatus}
                        </Badge>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-gray-600">★ {provider.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button variant="outline" size="sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        Directions
                      </Button>
                      <Button variant="outline" size="sm">
                        Book Appointment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="benefits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Benefits Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{benefit.category}</h3>
                          <p className="text-sm text-gray-600">{benefit.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{benefit.coverage}% Coverage</p>
                          <p className="text-sm text-gray-600">₹{benefit.copay} Copay</p>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between text-sm">
                          <span>Used: ₹{benefit.used.toLocaleString()}</span>
                          <span>Limit: ₹{benefit.limit.toLocaleString()}</span>
                        </div>
                        <Progress value={(benefit.used / benefit.limit) * 100} className="h-2 mt-1" />
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Remaining: ₹{(benefit.limit - benefit.used).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Insurance Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-medium">Policy Certificate</h3>
                        <p className="text-sm text-gray-600">Complete policy terms and conditions</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="font-medium">Digital Insurance Card</h3>
                        <p className="text-sm text-gray-600">QR code enabled for quick access</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-purple-600" />
                      <div>
                        <h3 className="font-medium">Claims Summary</h3>
                        <p className="text-sm text-gray-600">Annual claims and utilization report</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InsuranceManagement;
