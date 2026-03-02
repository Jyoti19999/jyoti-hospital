// src/components/super-admin/lens/LensDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  Activity,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import lensStockService from '@/services/lensStockService';

const LensDashboard = ({ showAnalytics = false }) => {
  const [stats, setStats] = useState({
    totalLenses: 0,
    totalStockValue: 0,
    lowStockCount: 0,
    nearExpiryCount: 0,
    totalCategories: 0,
    averageCost: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [nearExpiryItems, setNearExpiryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // Remove error state to prevent blank pages

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [statsResponse, lowStockResponse, nearExpiryResponse] = await Promise.all([
        lensStockService.getDashboardStats(),
        lensStockService.getLowStockItems(),
        lensStockService.getNearExpiryItems()
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats({
          totalLenses: statsResponse.data.totalLenses || 0,
          totalStockValue: statsResponse.data.totalStockValue || 0,
          lowStockCount: statsResponse.data.lowStockCount || 0,
          nearExpiryCount: statsResponse.data.nearExpiryCount || 0,
          totalCategories: statsResponse.data.totalCategories || 0,
          averageCost: statsResponse.data.averageCost || 0
        });
      }

      if (lowStockResponse.success) {
        const items = lowStockResponse.data?.lenses || lowStockResponse.data || [];
        setLowStockItems(Array.isArray(items) ? items : []);
      }

      if (nearExpiryResponse.success) {
        const items = nearExpiryResponse.data?.lenses || nearExpiryResponse.data || [];
        setNearExpiryItems(Array.isArray(items) ? items : []);
      }

    } catch (error) {
      // Don't set error state, just use default values
      setStats({
        totalLenses: 0,
        totalStockValue: 0,
        lowStockCount: 0,
        nearExpiryCount: 0,
        totalCategories: 0,
        averageCost: 0
      });
      setLowStockItems([]);
      setNearExpiryItems([]);
      toast.error('Failed to load lens dashboard data - using default values');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lenses</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLenses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active lens types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStockQuantity || 0}</div>
            <p className="text-xs text-muted-foreground">
              Lenses in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalStockValue)}</div>
            <p className="text-xs text-muted-foreground">
              Total inventory value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.lowStockItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Lenses below reorder level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Near Expiry</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {stats?.nearExpiryItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Expiring within 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <Zap className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.outOfStockItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Lenses with zero stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.averageStockValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per lens type
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>
              Lenses that need restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.length > 0 ? (
                lowStockItems.slice(0, 5).map((lens) => (
                  <div key={lens.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex flex-col">
                      <span className="font-medium">{lens.lensName}</span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {lens.lensType}
                        </Badge>
                        <span>{lens.lensCategory}</span>
                      </div>
                      {lens.manufacturer && (
                        <span className="text-xs text-muted-foreground">{lens.manufacturer}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">
                        {lens.stockQuantity}/{lens.reorderLevel}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Current/Min</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No low stock lenses found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Near Expiry Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-warning" />
              Near Expiry Alert
            </CardTitle>
            <CardDescription>
              Lenses expiring within 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nearExpiryItems.length > 0 ? (
                nearExpiryItems.slice(0, 5).map((lens) => (
                  <div key={lens.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex flex-col">
                      <span className="font-medium">{lens.lensName}</span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {lens.lensType}
                        </Badge>
                        <span>{lens.lensCategory}</span>
                      </div>
                      {lens.batchNumber && (
                        <span className="text-xs text-muted-foreground">Batch: {lens.batchNumber}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant="warning">
                        {new Date(lens.expiryDate).toLocaleDateString()}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Expiry Date</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No lenses expiring soon
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Analytics
            </CardTitle>
            <CardDescription>
              Lens usage trends and implantation patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Analytics charts will be implemented here</p>
              <p className="text-sm">Showing implantation trends, lens preferences, and usage patterns</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LensDashboard;