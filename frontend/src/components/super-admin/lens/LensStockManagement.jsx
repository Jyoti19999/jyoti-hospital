// src/components/super-admin/lens/LensStockManagement.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Search, 
  TrendingUp,
  TrendingDown,
  Zap,
  Calendar,
  User,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import lensStockService from '@/services/lensStockService';

const LensStockManagement = () => {
  const [selectedLens, setSelectedLens] = useState(null);
  const [lenses, setLenses] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [stockOperation, setStockOperation] = useState('add');

  const [stockForm, setStockForm] = useState({
    quantity: '',
    reason: '',
    expiryDate: '',
    batchNumber: ''
  });

  useEffect(() => {
    fetchLenses();
  }, []);

  // Trigger search when searchTerm changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLenses();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    if (selectedLens) {
      fetchTransactions();
    }
  }, [selectedLens]);

  const fetchLenses = async () => {
    try {
      setLoading(true);
      const response = await lensStockService.getAllLensStock({
        limit: 100,
        isActive: true,
        search: searchTerm
      });

      if (response.success) {
        setLenses(response.data.lenses || []);
      }
    } catch (error) {
      toast.error('Failed to load lens list');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!selectedLens) return;

    try {
      const response = await lensStockService.getStockTransactions(selectedLens.id, {
        limit: 20
      });

      if (response.success) {
        setTransactions(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load transaction history');
    }
  };

  const handleStockOperation = async () => {
    if (!selectedLens || !stockForm.quantity || !stockForm.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const stockData = {
        quantity: parseInt(stockForm.quantity),
        reason: stockForm.reason,
        expiryDate: stockForm.expiryDate || undefined,
        batchNumber: stockForm.batchNumber || undefined
      };

      let response;
      switch (stockOperation) {
        case 'add':
          response = await lensStockService.addStock(selectedLens.id, stockData);
          break;
        case 'remove':
          response = await lensStockService.removeStock(selectedLens.id, stockData);
          break;
        case 'adjust':
          response = await lensStockService.adjustStock(selectedLens.id, {
            newQuantity: parseInt(stockForm.quantity),
            reason: stockForm.reason
          });
          break;
        default:
          throw new Error('Invalid stock operation');
      }

      if (response.success) {
        toast.success(`Stock ${stockOperation}ed successfully`);
        setShowStockDialog(false);
        setStockForm({
          quantity: '',
          reason: '',
          expiryDate: '',
          batchNumber: ''
        });
        
        // Refresh data
        fetchLenses();
        fetchTransactions();
        
        // Update selected lens data
        const updatedLens = response.data;
        setSelectedLens(updatedLens);
        setLenses(prev => 
          prev.map(item => 
            item.id === updatedLens.id ? updatedLens : item
          )
        );
      }
    } catch (error) {
      toast.error(error.message || `Failed to ${stockOperation} stock`);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stockQuantity, reorderLevel) => {
    if (stockQuantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive', icon: AlertTriangle };
    } else if (stockQuantity <= reorderLevel) {
      return { label: 'Low Stock', variant: 'warning', icon: TrendingDown };
    }
    return { label: 'In Stock', variant: 'success', icon: Zap };
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'OUT':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'ADJUSTMENT':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      default:
        return <Zap className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Lens Stock Management
          </CardTitle>
          <CardDescription>
            Manage lens inventory levels, add/remove stock, and track lens movements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lens Selection */}
            <div className="space-y-4">
              <div>
                <Label>Search Lenses</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search lenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto border rounded-lg p-2">
                {lenses.map((lens) => {
                  const stockStatus = getStockStatus(lens.stockQuantity, lens.reorderLevel);
                  const StatusIcon = stockStatus.icon;
                  
                  return (
                    <div
                      key={lens.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedLens?.id === lens.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedLens(lens)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{lens.lensName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {lens.lensType?.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {lens.lensCategory}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusIcon className="h-3 w-3" />
                            <span className="text-xs">{lens.stockQuantity} units</span>
                          </div>
                        </div>
                        <Badge variant={stockStatus.variant} className="text-xs">
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                
                {lenses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No lenses found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Lens Details & Actions */}
            <div className="lg:col-span-2 space-y-6">
              {selectedLens ? (
                <>
                  {/* Lens Info Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{selectedLens.lensName}</CardTitle>
                      <CardDescription>
                        {selectedLens.lensCode && `${selectedLens.lensCode} • `}
                        {selectedLens.lensType?.replace('_', ' ')} • {selectedLens.lensCategory}
                        {selectedLens.manufacturer && ` • ${selectedLens.manufacturer}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedLens.stockQuantity}
                          </div>
                          <div className="text-xs text-muted-foreground">Current Stock</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-orange-600">
                            {selectedLens.reorderLevel}
                          </div>
                          <div className="text-xs text-muted-foreground">Reorder Level</div>
                        </div>
                        <div className="text-center">
                          <Badge variant={getStockStatus(selectedLens.stockQuantity, selectedLens.reorderLevel).variant}>
                            {getStockStatus(selectedLens.stockQuantity, selectedLens.reorderLevel).label}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">Status</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">
                            {formatCurrency(selectedLens.lensoCost)}
                          </div>
                          <div className="text-xs text-muted-foreground">Lenso Cost</div>
                        </div>
                      </div>

                      {/* Additional Details */}
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Patient Cost:</span>
                          <div className="font-medium">{formatCurrency(selectedLens.patientCost)}</div>
                        </div>
                        {selectedLens.insuranceCoverage > 0 && (
                          <div>
                            <span className="text-muted-foreground">Insurance:</span>
                            <div className="font-medium text-green-600">
                              {formatCurrency(selectedLens.insuranceCoverage)}
                            </div>
                          </div>
                        )}
                        {selectedLens.power && (
                          <div>
                            <span className="text-muted-foreground">Power:</span>
                            <div className="font-medium">{selectedLens.power}</div>
                          </div>
                        )}
                        {selectedLens.diameter && (
                          <div>
                            <span className="text-muted-foreground">Diameter:</span>
                            <div className="font-medium">{selectedLens.diameter}</div>
                          </div>
                        )}
                      </div>

                      {/* Stock Operations */}
                      <div className="flex gap-2 mt-4">
                        <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
                          <DialogTrigger asChild>
                            <Button 
                              onClick={() => setStockOperation('add')}
                              className="flex-1"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Stock
                            </Button>
                          </DialogTrigger>
                          
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              onClick={() => setStockOperation('remove')}
                              className="flex-1"
                            >
                              <Minus className="h-4 w-4 mr-2" />
                              Remove Stock
                            </Button>
                          </DialogTrigger>
                          
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              onClick={() => setStockOperation('adjust')}
                              className="flex-1"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Adjust Stock
                            </Button>
                          </DialogTrigger>

                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {stockOperation === 'add' && 'Add Lens Stock'}
                                {stockOperation === 'remove' && 'Remove Lens Stock'}
                                {stockOperation === 'adjust' && 'Adjust Lens Stock'}
                              </DialogTitle>
                              <DialogDescription>
                                {stockOperation === 'add' && 'Add new lens stock to increase inventory levels'}
                                {stockOperation === 'remove' && 'Remove lens stock for implantation or disposal'}
                                {stockOperation === 'adjust' && 'Manually adjust lens stock to correct inventory'}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div>
                                <Label>
                                  {stockOperation === 'adjust' ? 'New Total Quantity' : 'Quantity'} *
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={stockForm.quantity}
                                  onChange={(e) => setStockForm(prev => ({
                                    ...prev,
                                    quantity: e.target.value
                                  }))}
                                  placeholder="Enter quantity"
                                />
                              </div>

                              <div>
                                <Label>Reason *</Label>
                                <Textarea
                                  value={stockForm.reason}
                                  onChange={(e) => setStockForm(prev => ({
                                    ...prev,
                                    reason: e.target.value
                                  }))}
                                  placeholder="Enter reason for stock operation"
                                  rows={3}
                                />
                              </div>

                              {stockOperation === 'add' && (
                                <>
                                  <div>
                                    <Label>Expiry Date (Optional)</Label>
                                    <Input
                                      type="date"
                                      value={stockForm.expiryDate}
                                      onChange={(e) => setStockForm(prev => ({
                                        ...prev,
                                        expiryDate: e.target.value
                                      }))}
                                    />
                                  </div>

                                  <div>
                                    <Label>Batch Number (Optional)</Label>
                                    <Input
                                      value={stockForm.batchNumber}
                                      onChange={(e) => setStockForm(prev => ({
                                        ...prev,
                                        batchNumber: e.target.value
                                      }))}
                                      placeholder="Enter batch number"
                                    />
                                  </div>
                                </>
                              )}

                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setShowStockDialog(false)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={handleStockOperation}
                                  disabled={loading}
                                >
                                  {loading ? 'Processing...' : 'Confirm'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transaction History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recent Transactions</CardTitle>
                      <CardDescription>
                        Stock movement history for this lens
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-48 overflow-y-auto">
                        {transactions.length > 0 ? (
                          transactions.map((transaction) => (
                            <div 
                              key={transaction.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {getTransactionIcon(transaction.transactionType)}
                                <div>
                                  <p className="font-medium text-sm">
                                    {transaction.transactionType === 'IN' && 'Stock Added'}
                                    {transaction.transactionType === 'OUT' && 'Stock Removed'}
                                    {transaction.transactionType === 'ADJUSTMENT' && 'Stock Adjusted'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {transaction.reason}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(transaction.transactionDate)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-semibold ${
                                  transaction.transactionType === 'IN' ? 'text-green-600' :
                                  transaction.transactionType === 'OUT' ? 'text-red-600' :
                                  'text-blue-600'
                                }`}>
                                  {transaction.transactionType === 'IN' ? '+' : 
                                   transaction.transactionType === 'OUT' ? '-' : ''}
                                  {transaction.quantity}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {transaction.performedByName || 'Unknown Staff'}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No transactions found</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Select Lens</h3>
                    <p className="text-muted-foreground">
                      Choose a lens from the left to manage its stock
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LensStockManagement;