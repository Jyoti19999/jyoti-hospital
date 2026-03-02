import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Receipt, Shield, TrendingUp } from 'lucide-react';

const BillingIntegration = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Billing Integration</h1>
                <p className="text-sm text-slate-600">Comprehensive Billing & Payment Management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="billing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-lg shadow-sm border">
            <TabsTrigger value="billing" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <Receipt className="h-4 w-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="payment" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Processing
            </TabsTrigger>
            <TabsTrigger value="insurance" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              Insurance Claims
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Financial Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="billing" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                  <span>Dynamic Billing Calculator</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Dynamic billing interface will be implemented</p>
                  <p className="text-sm">Features: Consultation fees, surgery costs, treatment charges, tax calculation</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  <span>Payment Processing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Payment processing interface will be implemented</p>
                  <p className="text-sm">Features: Multiple payment methods, installments, receipts, refunds</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insurance" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  <span>Insurance Claims Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Insurance claims interface will be implemented</p>
                  <p className="text-sm">Features: Eligibility check, claim generation, status tracking, reimbursements</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span>Financial Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Financial analytics interface will be implemented</p>
                  <p className="text-sm">Features: Revenue tracking, payment trends, outstanding amounts, profitability</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BillingIntegration;