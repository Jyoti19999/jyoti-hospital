import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wrench,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Activity,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import otEquipmentService from '@/services/otEquipmentService';
import { otAdminService } from '@/services/otAdminService';
import { Progress } from '@/components/ui/progress';

const EquipmentManagement = () => {
  const [equipment, setEquipment] = useState([]);
  const [otRooms, setOtRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    equipmentName: '',
    equipmentCode: '',
    category: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    status: 'OPERATIONAL',
    otRoomId: '',
    currentLocation: '',
    maintenanceInterval: '',
    maxHours: '',
    notes: '',
  });

  const categories = [
    { value: 'SURGICAL_MICROSCOPE', label: 'Surgical Microscope' },
    { value: 'PHACOEMULSIFICATION', label: 'Phacoemulsification Machine' },
    { value: 'VITRECTOMY', label: 'Vitrectomy System' },
    { value: 'LASER', label: 'Laser Equipment' },
    { value: 'ANESTHESIA', label: 'Anesthesia Machine' },
    { value: 'MONITORING', label: 'Monitoring Equipment' },
    { value: 'STERILIZATION', label: 'Sterilization Equipment' },
    { value: 'DIAGNOSTIC', label: 'Diagnostic Equipment' },
    { value: 'GENERAL', label: 'General Equipment' },
  ];

  const statuses = [
    { value: 'OPERATIONAL', label: 'Operational' },
    { value: 'IN_USE', label: 'In Use' },
    { value: 'MAINTENANCE_REQUIRED', label: 'Maintenance Required' },
    { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
    { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
    { value: 'CALIBRATION_DUE', label: 'Calibration Due' },
  ];

  useEffect(() => {
    fetchEquipment();
    fetchOTRooms();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const response = await otEquipmentService.getAllEquipment();
      if (response.success) {
        setEquipment(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch equipment');
    } finally {
      setLoading(false);
    }
  };

  const fetchOTRooms = async () => {
    try {
      const response = await otAdminService.getAllOTRooms();
      if (response.success) {
        setOtRooms(response.data || []);
      }
    } catch (error) {
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.equipmentName || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        maintenanceInterval: formData.maintenanceInterval ? parseInt(formData.maintenanceInterval) : null,
        maxHours: formData.maxHours ? parseInt(formData.maxHours) : null,
        otRoomId: formData.otRoomId || null,
      };

      if (editingEquipment) {
        await otEquipmentService.updateEquipment(editingEquipment.id, submitData);
        toast.success('Equipment updated successfully');
      } else {
        await otEquipmentService.createEquipment(submitData);
        toast.success('Equipment created successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchEquipment();
    } catch (error) {
      toast.error(error.message || 'Failed to save equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (equip) => {
    setEditingEquipment(equip);
    setFormData({
      equipmentName: equip.equipmentName || '',
      equipmentCode: equip.equipmentCode || '',
      category: equip.category || '',
      manufacturer: equip.manufacturer || '',
      model: equip.model || '',
      serialNumber: equip.serialNumber || '',
      status: equip.status || 'OPERATIONAL',
      otRoomId: equip.otRoomId || '',
      currentLocation: equip.currentLocation || '',
      maintenanceInterval: equip.maintenanceInterval || '',
      maxHours: equip.maxHours || '',
      notes: equip.notes || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!equipmentToDelete) return;

    setLoading(true);
    try {
      await otEquipmentService.deleteEquipment(equipmentToDelete.id);
      toast.success('Equipment deleted successfully');
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
      fetchEquipment();
    } catch (error) {
      toast.error(error.message || 'Failed to delete equipment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      equipmentName: '',
      equipmentCode: '',
      category: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      status: 'OPERATIONAL',
      otRoomId: '',
      currentLocation: '',
      maintenanceInterval: '',
      maxHours: '',
      notes: '',
    });
    setEditingEquipment(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPERATIONAL':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_USE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'MAINTENANCE_REQUIRED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'UNDER_MAINTENANCE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'OUT_OF_SERVICE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'CALIBRATION_DUE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPERATIONAL':
        return <CheckCircle className="h-4 w-4" />;
      case 'IN_USE':
        return <Activity className="h-4 w-4" />;
      case 'MAINTENANCE_REQUIRED':
      case 'UNDER_MAINTENANCE':
        return <Wrench className="h-4 w-4" />;
      case 'OUT_OF_SERVICE':
      case 'CALIBRATION_DUE':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // Filter equipment based on search, category, and status
  const getFilteredEquipment = () => {
    let filtered = equipment;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(equip =>
        equip.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equip.equipmentCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equip.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equip.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(equip => equip.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(equip => equip.status === statusFilter);
    }

    return filtered;
  };

  const filteredEquipment = getFilteredEquipment();
  const totalEquipment = equipment.length;
  const operationalCount = equipment.filter(e => e.status === 'OPERATIONAL').length;
  const maintenanceCount = equipment.filter(e => e.status === 'MAINTENANCE_REQUIRED' || e.status === 'UNDER_MAINTENANCE').length;
  const outOfServiceCount = equipment.filter(e => e.status === 'OUT_OF_SERVICE').length;

  return (
    <div className="h-full flex flex-col">
      {/* Equipment Management Card with Integrated Filters */}
      <Card className="flex flex-col flex-1 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <CardTitle>Equipment Management</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {totalEquipment} Total
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                {operationalCount} Operational
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                {maintenanceCount} Maintenance
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                {outOfServiceCount} Out of Service
              </Badge>
              <Badge variant="outline">
                {filteredEquipment.length} Result{filteredEquipment.length !== 1 ? 's' : ''}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchEquipment}
                className="h-9"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Equipment
              </Button>
            </div>
          </div>
          
          {/* Integrated Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, code, manufacturer, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-56 h-10">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto tab-content-container">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Activity className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading equipment...</span>
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-2 opacity-50" />
              <p className="font-medium">
                {equipment.length === 0 ? 'No Equipment Found' : 'No Results Found'}
              </p>
              <p className="text-sm mt-1">
                {equipment.length === 0 
                  ? 'Click "Add Equipment" to get started.' 
                  : 'Try adjusting your search criteria.'}
              </p>
              {equipment.length === 0 && (
                <Button
                  onClick={() => {
                    resetForm();
                    setDialogOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 mt-4"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equipment
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.map((equip) => (
          <Card key={equip.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <span>{equip.equipmentName}</span>
                  </CardTitle>
                  <p className="text-sm text-gray-500 mt-1">{equip.model || 'No model'}</p>
                </div>
                <Badge className={`${getStatusColor(equip.status)} border flex items-center gap-1`}>
                  {getStatusIcon(equip.status)}
                  <span className="capitalize">{equip.status.replace(/_/g, ' ')}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Category:</span> {equip.category.replace(/_/g, ' ')}
                  </p>
                  {equip.manufacturer && (
                    <p className="text-gray-600">
                      <span className="font-medium">Manufacturer:</span> {equip.manufacturer}
                    </p>
                  )}
                  {equip.otRoom && (
                    <p className="text-gray-600">
                      <span className="font-medium">Location:</span> {equip.otRoom.roomName} ({equip.otRoom.roomNumber})
                    </p>
                  )}
                </div>

                {equip.hoursUsed !== null && equip.maxHours && (
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      {/* <span className="text-gray-500">Usage:</span>
                      <span className="font-medium">{equip.hoursUsed}/{equip.maxHours}h</span> */}
                    </div>
                    {/* <Progress value={(equip.hoursUsed / equip.maxHours) * 100} className="h-2" /> */}
                  </div>
                )}

                {equip.efficiency !== null && (
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">Efficiency:</span>
                      <span className="font-medium">{equip.efficiency}%</span>
                    </div>
                    <Progress value={equip.efficiency} className="h-2" />
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(equip)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEquipmentToDelete(equip);
                      setDeleteDialogOpen(true);
                    }}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
            </DialogTitle>
            <DialogDescription>
              {editingEquipment
                ? 'Update the equipment details below'
                : 'Fill in the details to add new equipment'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipmentName">Equipment Name *</Label>
                <Input
                  id="equipmentName"
                  value={formData.equipmentName}
                  onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
                  placeholder="Phaco Machine #1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="equipmentCode">Equipment Code</Label>
                <Input
                  id="equipmentCode"
                  value={formData.equipmentCode}
                  onChange={(e) => setFormData({ ...formData, equipmentCode: e.target.value })}
                  placeholder="EQ-001"
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="Alcon"
                />
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Centurion Vision System"
                />
              </div>

              <div>
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="SN123456"
                />
              </div>

              <div>
                <Label htmlFor="otRoomId">Assign to OT Room</Label>
                <Select
                  value={formData.otRoomId || "unassigned"}
                  onValueChange={(value) => setFormData({ ...formData, otRoomId: value === "unassigned" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select OT room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">None (Unassigned)</SelectItem>
                    {otRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.roomName} ({room.roomNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="maintenanceInterval">Maintenance Interval (days)</Label>
                <Input
                  id="maintenanceInterval"
                  type="number"
                  value={formData.maintenanceInterval}
                  onChange={(e) => setFormData({ ...formData, maintenanceInterval: e.target.value })}
                  placeholder="90"
                />
              </div>

              <div>
                <Label htmlFor="maxHours">Max Hours</Label>
                <Input
                  id="maxHours"
                  type="number"
                  value={formData.maxHours}
                  onChange={(e) => setFormData({ ...formData, maxHours: e.target.value })}
                  placeholder="8000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the equipment"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? 'Saving...' : editingEquipment ? 'Update Equipment' : 'Create Equipment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Equipment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {equipmentToDelete?.equipmentName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EquipmentManagement;
