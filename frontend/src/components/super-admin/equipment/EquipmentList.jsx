// src/components/super-admin/equipment/EquipmentList.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import equipmentService from '@/services/equipmentService';
import EquipmentForm from './EquipmentForm';

const EquipmentList = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchEquipment();
  }, [pagination.page, searchTerm, categoryFilter, stockFilter]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        lowStock: stockFilter === 'low',
        nearExpiry: stockFilter === 'expiry',
        isActive: true
      };

      const response = await equipmentService.getAllEquipment(params);

      if (response.success) {
        setEquipment(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        }));
      }

    } catch (error) {
      setError('Failed to load equipment list');
      toast.error('Failed to load equipment list');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEquipment = () => {
    setEditingEquipment(null);
    setIsModalOpen(true);
  };

  const handleEditEquipment = (equipmentItem) => {
    setEditingEquipment(equipmentItem);
    setIsModalOpen(true);
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (!confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await equipmentService.deleteEquipment(equipmentId);
      
      if (response.success) {
        toast.success('Equipment deleted successfully');
        fetchEquipment();
      }
    } catch (error) {
      toast.error('Failed to delete equipment');
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setEditingEquipment(null);
    fetchEquipment();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEquipment(null);
  };

  const getStockStatus = (currentStock, reorderLevel) => {
    if (currentStock === 0) {
      return { label: 'Out of Stock', variant: 'destructive' };
    } else if (currentStock <= reorderLevel) {
      return { label: 'Low Stock', variant: 'warning' };
    }
    return { label: 'In Stock', variant: 'success' };
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { label: 'Expired', variant: 'destructive' };
    } else if (daysUntilExpiry <= 30) {
      return { label: 'Near Expiry', variant: 'warning' };
    }
    return { label: 'Valid', variant: 'success' };
  };

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
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Package className="h-5 w-5 text-blue-600" />
                Equipment List
              </CardTitle>
              <CardDescription className="text-slate-600">
                Manage hospital equipment inventory and track stock levels
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchEquipment} variant="outline" size="sm" className="border-slate-300 hover:bg-slate-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleCreateEquipment} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Surgical Instruments">Surgical Instruments</SelectItem>
                <SelectItem value="Consumables">Consumables</SelectItem>
                <SelectItem value="Devices">Devices</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="expiry">Near Expiry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Equipment Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : equipment.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No equipment found</p>
                      <p className="text-sm text-muted-foreground">
                        Add equipment or adjust your search filters
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  equipment.map((item) => {
                    const stockStatus = getStockStatus(item.currentStock, item.reorderLevel);
                    const expiryStatus = getExpiryStatus(item.expiryDate);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.name}</span>
                            {item.code && (
                              <span className="text-sm text-muted-foreground">{item.code}</span>
                            )}
                            {item.manufacturer && (
                              <span className="text-xs text-muted-foreground">{item.manufacturer}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{item.currentStock}</span>
                            <span className="text-xs text-muted-foreground">
                              Min: {item.reorderLevel}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.unitCost ? formatCurrency(item.unitCost) : '-'}
                        </TableCell>
                        <TableCell>
                          {expiryStatus ? (
                            <div className="flex flex-col">
                              <Badge variant={expiryStatus.variant}>
                                {expiryStatus.label}
                              </Badge>
                              {item.expiryDate && (
                                <span className="text-xs text-muted-foreground mt-1">
                                  {new Date(item.expiryDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditEquipment(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteEquipment(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equipment Form Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
            </DialogTitle>
          </DialogHeader>
          <EquipmentForm
            equipment={editingEquipment}
            onSuccess={handleFormSuccess}
            onCancel={handleModalClose}
            isModal={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentList;