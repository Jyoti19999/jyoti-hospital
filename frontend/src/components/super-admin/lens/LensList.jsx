// src/components/super-admin/lens/LensListModal.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Zap, 
  AlertTriangle,
  Calendar,
  RefreshCw,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import lensStockService from '@/services/lensStockService';
import LensForm from './LensForm';

const LensList = () => {
  const [lenses, setLenses] = useState([]);
  const [loading, setLoading] = useState(true);
  // Remove error state to prevent blank pages
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLens, setEditingLens] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Fetch lenses with pagination and filters
  const fetchLenses = async () => {
    try {
      setLoading(true);
      const filters = {};
      
      if (searchTerm) filters.search = searchTerm;
      if (typeFilter !== 'all') filters.lensType = typeFilter;
      if (categoryFilter !== 'all') filters.lensCategory = categoryFilter;
      if (stockFilter !== 'all') filters.lowStock = stockFilter === 'low';

      const response = await lensStockService.getAllLensStock(filters, pagination);
      
      if (response.success) {
        setLenses(response.data?.lenses || response.data?.lensStock || response.data || []);
        
        // Handle pagination data with fallbacks
        const total = response.data?.total || response.pagination?.total || 0;
        const totalPages = response.data?.totalPages || response.pagination?.totalPages || 1;
        
        setPagination(prev => ({
          ...prev,
          total,
          totalPages
        }));
      } else {
        // Instead of showing error state, show empty array
        setLenses([]);
      }
    } catch (error) {
      // Instead of showing error state, show empty array
      setLenses([]);
      toast.error('Failed to fetch lenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLenses();
  }, [pagination.page, pagination.limit, searchTerm, typeFilter, categoryFilter, stockFilter]);

  const handleAddNew = () => {
    setEditingLens(null);
    setIsModalOpen(true);
  };

  const handleEdit = (lens) => {
    setEditingLens(lens);
    setIsModalOpen(true);
  };

  const handleDelete = async (lensId) => {
    if (!confirm('Are you sure you want to delete this lens? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await lensStockService.deleteLensStock(lensId);
      
      if (response.success) {
        toast.success('Lens deleted successfully');
        fetchLenses();
      }
    } catch (error) {
      toast.error('Failed to delete lens');
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setEditingLens(null);
    fetchLenses();
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingLens(null);
  };

  const getStockStatus = (stockQuantity, reorderLevel) => {
    if (stockQuantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive' };
    } else if (stockQuantity <= reorderLevel) {
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
    return null;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const getLensTypeVariant = (type) => {
    const variants = {
      'IOL': 'default',
      'TORIC_IOL': 'secondary',
      'MULTIFOCAL_IOL': 'outline',
      'ACCOMMODATING_IOL': 'destructive',
      'CONTACT_LENS': 'warning',
      'SPECIALTY_LENS': 'success'
    };
    return variants[type] || 'default';
  };

  return (
    <div className="space-y-6">
      {/* Modal for Add/Edit Lens */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLens ? 'Edit Lens' : 'Add New Lens'}
            </DialogTitle>
          </DialogHeader>
          <LensForm
            lens={editingLens}
            onSuccess={handleFormSuccess}
            onCancel={handleModalClose}
          />
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Eye className="h-5 w-5 text-blue-600" />
                Lens Inventory
              </CardTitle>
              <CardDescription className="text-slate-600">
                Manage lens stock, track inventory levels, and monitor lens availability
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchLenses} variant="outline" size="sm" className="border-slate-300 hover:bg-slate-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Lens
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search lenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="IOL">IOL</SelectItem>
                <SelectItem value="TORIC_IOL">Toric IOL</SelectItem>
                <SelectItem value="MULTIFOCAL_IOL">Multifocal IOL</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="MONOFOCAL">Monofocal</SelectItem>
                <SelectItem value="TORIC">Toric</SelectItem>
                <SelectItem value="MULTIFOCAL">Multifocal</SelectItem>
                <SelectItem value="EXTENDED_DEPTH_FOCUS">Extended Depth Focus</SelectItem>
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="normal">Normal Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lenses Table */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : lenses.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No lenses found</p>
              <Button onClick={handleAddNew} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Lens
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lens Details</TableHead>
                    <TableHead>Type & Category</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Stock Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lenses.map((lens) => {
                    const stockStatus = getStockStatus(lens.stockQuantity, lens.reorderLevel);
                    const expiryStatus = getExpiryStatus(lens.expiryDate);
                    
                    return (
                      <TableRow key={lens.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{lens.lensName}</p>
                            {lens.manufacturer && (
                              <p className="text-sm text-muted-foreground">{lens.manufacturer}</p>
                            )}
                            {lens.power && (
                              <p className="text-sm text-muted-foreground">Power: {lens.power}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Badge variant={getLensTypeVariant(lens.lensType)}>
                              {lens.lensType}
                            </Badge>
                            <Badge variant="outline">
                              {lens.lensCategory}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Lenso:</span> {formatCurrency(lens.lensoCost)}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Patient:</span> {formatCurrency(lens.patientCost)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Badge variant={stockStatus.variant}>
                              {stockStatus.label}
                            </Badge>
                            <p className="text-sm text-muted-foreground">
                              {lens.stockQuantity} units
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lens.expiryDate ? (
                            <div className="space-y-1">
                              <p className="text-sm">
                                {new Date(lens.expiryDate).toLocaleDateString()}
                              </p>
                              {expiryStatus && (
                                <Badge variant={expiryStatus.variant}>
                                  {expiryStatus.label}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No expiry</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(lens)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(lens.id)}
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {lenses.length} of {pagination.total} lenses
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
    </div>
  );
};

export default LensList;