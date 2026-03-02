// src\pages\PaymentHistory.jsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CreditCard, DollarSign, TrendingUp, TrendingDown, Calendar, FileText, Download, Filter, Search, Plus, AlertCircle, CheckCircle, Clock, PiggyBank } from 'lucide-react';
import { format, subMonths } from 'date-fns';


const PaymentHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('last12months');

  // Mock data
  const payments = [
    {
      id: '1',
      date: '2024-01-15',
      provider: 'Apollo Hospitals',
      description: 'Eye examination and consultation',
      originalAmount: 2500,
      insurancePayment: 2000,
      patientPayment: 500,
      paymentMethod: 'Credit Card (**** 4532)',
      status: 'paid',
      transactionId: 'TXN-2024-001234'
    },
    {
      id: '2',
      date: '2024-01-10',
      provider: 'Narayana Health',
      description: 'Diagnostic blood tests',
      originalAmount: 1200,
      insurancePayment: 960,
      patientPayment: 240,
      paymentMethod: 'UPI (Google Pay)',
      status: 'paid',
      transactionId: 'TXN-2024-001233'
    },
    {
      id: '3',
      date: '2024-01-05',
      provider: 'MedPlus Pharmacy',
      description: 'Prescription medications',
      originalAmount: 850,
      insurancePayment: 425,
      patientPayment: 425,
      paymentMethod: 'Debit Card (**** 7890)',
      status: 'paid',
      transactionId: 'TXN-2024-001232'
    }
  ];

  const bills = [
    {
      id: '1',
      provider: 'Fortis Hospital',
      description: 'Upcoming eye surgery consultation',
      amount: 5000,
      dueDate: '2024-02-15',
      status: 'outstanding'
    },
    {
      id: '2',
      provider: 'Apollo Pharmacy',
      description: 'Monthly medication refill',
      amount: 1200,
      dueDate: '2024-02-10',
      status: 'outstanding',
      minimumPayment: 600
    }
  ];

  const paymentMethods = [
    {
      id: '1',
      type: 'credit-card',
      name: 'HDFC Credit Card',
      last4: '4532',
      expiryDate: '12/2026',
      isDefault: true
    },
    {
      id: '2',
      type: 'debit-card',
      name: 'SBI Debit Card',
      last4: '7890',
      expiryDate: '08/2025',
      isDefault: false
    },
    {
      id: '3',
      type: 'upi',
      name: 'Google Pay',
      last4: '9876',
      isDefault: false
    }
  ];

  const financialAssistance = [
    {
      id: '1',
      program: 'Hospital Financial Assistance',
      status: 'eligible',
      amount: 10000,
      description: 'Qualify for up to 50% discount on hospital services'
    },
    {
      id: '2',
      program: 'Government Healthcare Scheme',
      status: 'applied',
      amount: 25000,
      description: 'State government healthcare assistance program'
    }
  ];

  // Calculate financial summary
  const totalSpending = payments.reduce((sum, payment) => sum + payment.patientPayment, 0);
  const insurancePayments = payments.reduce((sum, payment) => sum + payment.insurancePayment, 0);
  const outstandingBills = bills.reduce((sum, bill) => bill.status === 'outstanding' ? sum + bill.amount : sum, 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': case 'applied': return 'bg-yellow-100 text-yellow-800';
      case 'failed': case 'overdue': case 'denied': return 'bg-red-100 text-red-800';
      case 'outstanding': case 'eligible': return 'bg-blue-100 text-blue-800';
      case 'payment-plan': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (type) => {
    switch (type) {
      case 'credit-card': case 'debit-card': return <CreditCard className="h-4 w-4" />;
      case 'upi': return <DollarSign className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Payment History</h1>
                <p className="text-sm text-slate-600">Track your healthcare expenses and payments</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Financial Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Spending (YTD)</p>
                  <p className="text-2xl font-bold">₹{totalSpending.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Insurance Covered</p>
                  <p className="text-2xl font-bold">₹{insurancePayments.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Outstanding Bills</p>
                  <p className="text-2xl font-bold">₹{outstandingBills.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Savings Rate</p>
                  <p className="text-2xl font-bold">
                    {((insurancePayments / (totalSpending + insurancePayments)) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PiggyBank className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Outstanding Bills Alert */}
        {bills.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <AlertCircle className="h-5 w-5 mr-2" />
                Outstanding Bills ({bills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium">{bill.provider}</p>
                      <p className="text-sm text-gray-600">{bill.description}</p>
                      <p className="text-sm text-orange-600">
                        Due: {format(new Date(bill.dueDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{bill.amount.toLocaleString()}</p>
                      <Button size="sm" className="mt-1">
                        Pay Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search payments, providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last30">Last 30 Days</SelectItem>
              <SelectItem value="last90">Last 3 Months</SelectItem>
              <SelectItem value="last12months">Last 12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="bills">Outstanding Bills</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="assistance">Financial Aid</TabsTrigger>
            <TabsTrigger value="tax">Tax Planning</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{payment.provider}</h3>
                          <p className="text-gray-600 mb-1">{payment.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{format(new Date(payment.date), 'MMM dd, yyyy')}</span>
                            <span>{payment.paymentMethod}</span>
                            <span>ID: {payment.transactionId}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            Total: ₹{payment.originalAmount.toLocaleString()}
                          </p>
                          <p className="text-sm text-green-600">
                            Insurance: ₹{payment.insurancePayment.toLocaleString()}
                          </p>
                          <p className="text-sm font-medium">
                            Paid: ₹{payment.patientPayment.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Receipt
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

          <TabsContent value="bills" className="space-y-4">
            <div className="space-y-4">
              {bills.map((bill) => (
                <Card key={bill.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{bill.provider}</h3>
                        <p className="text-gray-600 mb-2">{bill.description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center text-orange-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Due: {format(new Date(bill.dueDate), 'MMM dd, yyyy')}
                          </span>
                          {bill.minimumPayment && (
                            <span className="text-gray-600">
                              Min: ₹{bill.minimumPayment.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(bill.status)}>
                          {bill.status}
                        </Badge>
                        <p className="text-xl font-bold mt-2">₹{bill.amount.toLocaleString()}</p>
                        <div className="mt-2 space-x-2">
                          <Button size="sm">Pay Full</Button>
                          {bill.minimumPayment && (
                            <Button variant="outline" size="sm">Pay Min</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="methods" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Payment Methods</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>

            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getPaymentMethodIcon(method.type)}
                        </div>
                        <div>
                          <h3 className="font-medium">{method.name}</h3>
                          <p className="text-gray-600">**** **** **** {method.last4}</p>
                          {method.expiryDate && (
                            <p className="text-sm text-gray-500">Expires {method.expiryDate}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {method.isDefault && (
                          <Badge className="bg-green-100 text-green-800">Default</Badge>
                        )}
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assistance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Assistance Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {financialAssistance.map((program) => (
                    <div key={program.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{program.program}</h3>
                          <p className="text-gray-600 mb-2">{program.description}</p>
                          <p className="text-sm text-green-600 font-medium">
                            Potential savings: ₹{program.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(program.status)}>
                            {program.status}
                          </Badge>
                          <Button variant="outline" size="sm" className="mt-2">
                            {program.status === 'eligible' ? 'Apply Now' : 'View Status'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tax Year 2024 Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Medical Expenses</span>
                      <span className="font-medium">₹{totalSpending.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insurance Premiums Paid</span>
                      <span className="font-medium">₹15,000</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Potential Tax Deduction</span>
                      <span className="font-medium text-green-600">₹{(totalSpending + 15000).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-4">
                    <Download className="h-4 w-4 mr-2" />
                    Download Tax Summary
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Health Savings Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800">Preventive Care</h4>
                      <p className="text-sm text-blue-600">Use your free annual check-ups to save on future costs</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800">Generic Medications</h4>
                      <p className="text-sm text-green-600">Switch to generics to save up to 50% on prescriptions</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-800">HSA Contributions</h4>
                      <p className="text-sm text-purple-600">Maximize tax-free health savings account contributions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PaymentHistory;
