import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Activity,
  Clock,
  Stethoscope,
  Building
} from "lucide-react";

const HospitalAnalytics = () => {
  const [analyticsData] = useState({
    revenue: {
      thisMonth: 125000,
      lastMonth: 110000,
      change: 13.6
    },
    patients: {
      total: 1250,
      newThisMonth: 185,
      change: 8.2
    },
    appointments: {
      thisMonth: 850,
      lastMonth: 780,
      change: 9.0
    },
    occupancy: {
      current: 85,
      capacity: 100,
      change: 5.2
    }
  });

  const departmentStats = [
    { name: "Ophthalmology", patients: 320, revenue: 45000, satisfaction: 4.8 },
    { name: "Surgery", patients: 150, revenue: 65000, satisfaction: 4.7 },
    { name: "Emergency", patients: 280, revenue: 25000, satisfaction: 4.5 },
    { name: "Radiology", patients: 200, revenue: 18000, satisfaction: 4.6 },
    { name: "Pharmacy", patients: 450, revenue: 12000, satisfaction: 4.4 }
  ];

  const recentActivities = [
    { time: "10 minutes ago", activity: "New patient registration completed", type: "success" },
    { time: "25 minutes ago", activity: "Surgery scheduled for tomorrow", type: "info" },
    { time: "1 hour ago", activity: "Emergency department at capacity", type: "warning" },
    { time: "2 hours ago", activity: "Monthly revenue target achieved", type: "success" },
    { time: "3 hours ago", activity: "Equipment maintenance completed", type: "info" }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case "success": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "warning": return <TrendingDown className="h-4 w-4 text-yellow-600" />;
      case "info": return <Activity className="h-4 w-4 text-blue-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type) => {
    const variants = {
      "success": "bg-green-100 text-green-800 border-green-200",
      "warning": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "info": "bg-blue-100 text-blue-800 border-blue-200"
    };

    return variants[type] || variants["info"];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hospital Analytics</h2>
          <p className="text-gray-600">Comprehensive analytics and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <BarChart3 className="h-3 w-3 mr-1" />
            Real-time Data
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${analyticsData.revenue.thisMonth.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{analyticsData.revenue.change}%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.patients.total.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{analyticsData.patients.change}%</span>
                  <span className="text-sm text-gray-500 ml-1">this month</span>
                </div>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Appointments</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.appointments.thisMonth}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{analyticsData.appointments.change}%</span>
                  <span className="text-sm text-gray-500 ml-1">this month</span>
                </div>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bed Occupancy</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.occupancy.current}%</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{analyticsData.occupancy.change}%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last week</span>
                </div>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="departments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-lg shadow-sm border">
          <TabsTrigger value="departments" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <Stethoscope className="h-4 w-4 mr-2" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="activities" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <Activity className="h-4 w-4 mr-2" />
            Recent Activities
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                <span>Department Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentStats.map((dept, index) => (
                  <div key={index} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold">
                          {dept.name.substring(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                          <p className="text-sm text-gray-600">{dept.patients} patients this month</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-600">Revenue</p>
                          <p className="text-lg font-bold text-green-600">${dept.revenue.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                          <p className="text-lg font-bold text-blue-600">{dept.satisfaction}/5.0</p>
                        </div>
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${i < Math.floor(dept.satisfaction) ? 'bg-yellow-400' : 'bg-gray-200'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span>Recent Hospital Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.activity}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <Badge className={getActivityBadge(activity.type)}>
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Patient Satisfaction</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "92%" }}></div>
                      </div>
                      <span className="text-sm font-bold">92%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Average Wait Time</span>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-bold">15 mins</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Staff Efficiency</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "88%" }}></div>
                      </div>
                      <span className="text-sm font-bold">88%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Monthly Report
                  </Button>
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Detailed Analytics
                  </Button>
                  <Button variant="outline" className="w-full">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Financial Summary
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Staff Performance Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HospitalAnalytics;
