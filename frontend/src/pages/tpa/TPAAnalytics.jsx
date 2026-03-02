import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  DollarSign,
  FileText,
  Building2,
  Users
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useTpaStore from '@/stores/tpa/tpaStore';

const TPAAnalytics = () => {
  const navigate = useNavigate();
  
  const {
    isAuthenticated,
    analytics,
    claims
  } = useTpaStore();
  
  if (!isAuthenticated) {
    navigate('/tpa-login');
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link to="/tpa-dashboard">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Analytics & Reports</h1>
                <p className="text-sm text-muted-foreground">Performance metrics and insights</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { title: 'Total Claims', value: analytics.totalClaims, icon: FileText, color: 'text-primary' },
                { title: 'Approval Rate', value: `${analytics.approvalRate}%`, icon: CheckCircle, color: 'text-traffic-low' },
                { title: 'Avg Processing Time', value: `${analytics.averageProcessingTime} days`, icon: Clock, color: 'text-primary' },
                { title: 'Pending Claims', value: analytics.pendingClaims, icon: XCircle, color: 'text-traffic-moderate' },
              ].map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Claims by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { status: 'Approved', count: analytics.approvedClaims, color: 'bg-traffic-low' },
                      { status: 'Pending', count: analytics.pendingClaims, color: 'bg-secondary' },
                      { status: 'Rejected', count: analytics.rejectedClaims, color: 'bg-destructive' },
                      { status: 'Settled', count: analytics.settledClaims, color: 'bg-muted' },
                    ].map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                          <span className="text-foreground">{item.status}</span>
                        </div>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Processing Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Average Processing Time</span>
                        <span className="text-sm text-muted-foreground">{analytics.averageProcessingTime} days</span>
                      </div>
                      <Progress value={75} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Approval Rate</span>
                        <span className="text-sm text-muted-foreground">{analytics.approvalRate}%</span>
                      </div>
                      <Progress value={analytics.approvalRate} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-traffic-low" />
                        <span>Efficiency Score</span>
                      </div>
                      <span className="text-2xl font-bold text-traffic-low">95%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <span>Response Time</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">2.1h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-traffic-low" />
                        <span>Accuracy Rate</span>
                      </div>
                      <span className="text-2xl font-bold text-traffic-low">98%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-primary" />
                        <span>Satisfaction Score</span>
                      </div>
                      <span className="text-2xl font-bold text-primary">4.8/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Detailed trend analysis coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TPAAnalytics;