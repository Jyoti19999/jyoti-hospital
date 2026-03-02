import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Package,
  AlertTriangle,
  CheckCircle,
  Calendar,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from "lucide-react";
import equipmentService from '../../../services/equipmentService';

// Blue color scheme for the application
const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#1E40AF', 
  accent: '#60A5FA',
  light: '#DBEAFE',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444'
};

const COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.accent, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger];

const EquipmentAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // Last 30 days
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [transactions, setTransactions] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalEquipment: 0,
    totalStock: 0,
    lowStock: 0,
    averageStock: 0,
    totalTransactions: 0,
    stockIn: 0,
    stockOut: 0,
    totalValue: 0,
    mostActiveUsers: [],
    equipmentUsage: [],
    transactionTrends: [],
    stockByCategory: []
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, categoryFilter]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch equipment with correct parameters
      const equipmentResponse = await equipmentService.getAllEquipment({
        page: 1,
        limit: 100,
        isActive: true
      });

      if (equipmentResponse.success && equipmentResponse.data) {
        const equipmentData = equipmentResponse.data || [];
        setEquipment(equipmentData);
        
        // Fetch transactions for selected equipment (limit to first 5 for performance)
        const allTransactions = [];
        const selectedEquipment = equipmentData.slice(0, 5);
        
        for (const equip of selectedEquipment) {
          try {
            const transactionResponse = await equipmentService.getStockTransactions(equip.id, {
              limit: 50
            });
            
            if (transactionResponse.success && transactionResponse.data) {
              const equipTransactions = transactionResponse.data.map(t => ({
                ...t,
                equipmentName: equip.name,
                category: equip.category
              }));
              allTransactions.push(...equipTransactions);
            }
          } catch (error) {
          }
        }
        
        setTransactions(allTransactions);
        processAnalyticsData(allTransactions, equipmentData);
      }
    } catch (error) {
      toast.error('Failed to load analytics data');
      // Set empty data to prevent crashes
      setAnalytics({
        totalEquipment: 0,
        totalStock: 0,
        lowStock: 0,
        averageStock: 0,
        totalTransactions: 0,
        stockIn: 0,
        stockOut: 0,
        totalValue: 0,
        mostActiveUsers: [],
        equipmentUsage: [],
        transactionTrends: [],
        stockByCategory: []
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (transactions, equipmentData) => {
    // Filter transactions by date range
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filteredTransactions = transactions.filter(t => 
      new Date(t.transactionDate) >= cutoffDate &&
      (categoryFilter === 'all' || t.category === categoryFilter)
    );

    // Calculate equipment metrics
    const totalEquipment = equipmentData.length;
    const totalStock = equipmentData.reduce((sum, equip) => sum + (equip.currentStock || 0), 0);
    const lowStock = equipmentData.filter(equip => (equip.currentStock || 0) <= (equip.reorderLevel || 0)).length;
    const averageStock = totalEquipment > 0 ? Math.round(totalStock / totalEquipment) : 0;

    // Calculate transaction metrics
    const totalTransactions = filteredTransactions.length;
    const stockIn = filteredTransactions.filter(t => t.transactionType === 'IN').reduce((sum, t) => sum + (t.quantity || 0), 0);
    const stockOut = filteredTransactions.filter(t => t.transactionType === 'OUT').reduce((sum, t) => sum + (t.quantity || 0), 0);

    // Calculate total value
    const totalValue = equipmentData.reduce((sum, equip) => sum + ((equip.currentStock || 0) * (equip.unitCost || 0)), 0);

    // Most active users
    const userActivity = {};
    filteredTransactions.forEach(t => {
      const user = t.performedByName || 'Unknown Staff';
      userActivity[user] = (userActivity[user] || 0) + 1;
    });
    const mostActiveUsers = Object.entries(userActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Stock by category
    const categoryStock = {};
    equipmentData.forEach(equip => {
      const category = equip.category || 'Other';
      categoryStock[category] = (categoryStock[category] || 0) + (equip.currentStock || 0);
    });
    const stockByCategory = Object.entries(categoryStock).map(([name, value]) => ({ name, value }));

    // Transaction trends (last 7 days)
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTransactions = filteredTransactions.filter(t => {
        const tDate = new Date(t.transactionDate);
        return tDate.toDateString() === date.toDateString();
      });
      
      const dayStockIn = dayTransactions.filter(t => t.transactionType === 'IN').reduce((sum, t) => sum + (t.quantity || 0), 0);
      const dayStockOut = dayTransactions.filter(t => t.transactionType === 'OUT').reduce((sum, t) => sum + (t.quantity || 0), 0);
      
      trendData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        stockIn: dayStockIn,
        stockOut: dayStockOut
      });
    }

    setAnalytics({
      totalEquipment,
      totalStock,
      lowStock,
      averageStock,
      totalTransactions,
      stockIn,
      stockOut,
      totalValue,
      mostActiveUsers,
      equipmentUsage: stockByCategory,
      transactionTrends: trendData,
      stockByCategory
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg font-medium">Loading Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Equipment Analytics</h2>
          <p className="text-slate-600">Comprehensive equipment usage and stock analytics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Surgical Instruments">Surgical Instruments</SelectItem>
              <SelectItem value="Consumables">Consumables</SelectItem>
              <SelectItem value="Devices">Devices</SelectItem>
              <SelectItem value="Diagnostic Equipment">Diagnostic Equipment</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={fetchAnalyticsData} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Equipment</p>
                <p className="text-xl font-bold text-blue-600">{analytics.totalEquipment}</p>
              </div>
              <Package className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Stock</p>
                <p className="text-xl font-bold text-blue-700">{analytics.totalStock}</p>
              </div>
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Low Stock</p>
                <p className="text-xl font-bold text-red-600">{analytics.lowStock}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Stock</p>
                <p className="text-xl font-bold text-green-600">{analytics.averageStock}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Transactions</p>
                <p className="text-xl font-bold text-blue-600">{analytics.totalTransactions}</p>
              </div>
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Stock In</p>
                <p className="text-xl font-bold text-green-600">+{analytics.stockIn}</p>
              </div>
              <ArrowUpRight className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Stock Out</p>
                <p className="text-xl font-bold text-red-600">-{analytics.stockOut}</p>
              </div>
              <ArrowDownRight className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Value</p>
                <p className="text-xl font-bold text-blue-700">₹{(analytics.totalValue / 1000).toFixed(0)}K</p>
              </div>
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transaction Trends */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Transaction Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.transactionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="stockIn" 
                  stroke={CHART_COLORS.success} 
                  strokeWidth={2}
                  name="Stock In"
                />
                <Line 
                  type="monotone" 
                  dataKey="stockOut" 
                  stroke={CHART_COLORS.danger} 
                  strokeWidth={2}
                  name="Stock Out"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stock by Category */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-600" />
              Stock by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.stockByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => percent > 10 ? `${name}` : ''}
                >
                  {analytics.stockByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Active Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Most Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.mostActiveUsers.slice(0, 5).map((user, index) => (
                <div key={user.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      {index + 1}
                    </div>
                    <span className="font-medium text-sm">{user.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{user.count}</Badge>
                </div>
              ))}
              {analytics.mostActiveUsers.length === 0 && (
                <p className="text-sm text-gray-500">No user activity data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {transactions.slice(0, 8).map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {transaction.transactionType === 'IN' ? 
                      <ArrowUpRight className="h-4 w-4 text-green-600" /> :
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    }
                    <div>
                      <p className="font-medium text-xs">
                        {transaction.transactionType === 'IN' ? 'Added' : 'Removed'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.equipmentName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold text-sm ${
                      transaction.transactionType === 'IN' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.transactionType === 'IN' ? '+' : '-'}{transaction.quantity}
                    </div>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-sm text-gray-500">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EquipmentAnalytics;