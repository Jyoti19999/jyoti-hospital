import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Users, 
  Calendar, 
  FileText, 
  Activity, 
  RefreshCw, 
  Download, 
  Search,
  Filter,
  ArrowLeft,
  Eye,
  Trash2,
  Edit
} from 'lucide-react';

const DatabaseViewer = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState('patients');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPatient, setEditingPatient] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [viewingAppointment, setViewingAppointment] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');
  
  // Database statistics
  const [dbStats, setDbStats] = useState({
    patients: { count: 0, lastUpdated: '-' },
    appointments: { count: 0, lastUpdated: '-' },
    staff: { count: 0, lastUpdated: '-' },
    records: { count: 0, lastUpdated: '-' }
  });

  // Table data
  const [tableData, setTableData] = useState({
    patients: [],
    appointments: [],
    staff: [],
    records: []
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchPatients(),
      fetchAppointments(),
      fetchStaff(),
      fetchRecords()
    ]);
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      console.log('Fetching patients from:', `${API_URL}/database-viewer/patients`);
      
      const response = await fetch(`${API_URL}/database-viewer/patients?limit=100`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Patients response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Patients data:', data);
        const patients = data.data || [];
        setTableData(prev => ({ ...prev, patients }));
        setDbStats(prev => ({
          ...prev,
          patients: {
            count: data.pagination?.total || patients.length,
            lastUpdated: new Date().toLocaleString()
          }
        }));
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch patients:', errorData);
        toast({
          title: "Error",
          description: errorData.message || 'Failed to fetch patients',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: 'Failed to connect to server',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${API_URL}/database-viewer/appointments?limit=100`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const appointments = data.data || [];
        setTableData(prev => ({ ...prev, appointments }));
        setDbStats(prev => ({
          ...prev,
          appointments: {
            count: appointments.length,
            lastUpdated: new Date().toLocaleString()
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch(`${API_URL}/database-viewer/staff?limit=100`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const staff = data.data || [];
        setTableData(prev => ({ ...prev, staff }));
        setDbStats(prev => ({
          ...prev,
          staff: {
            count: staff.length,
            lastUpdated: new Date().toLocaleString()
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/database-viewer/medical-records?limit=100`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        const records = data.data || [];
        setTableData(prev => ({ ...prev, records }));
        setDbStats(prev => ({
          ...prev,
          records: {
            count: records.length,
            lastUpdated: new Date().toLocaleString()
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchAllData();
    setLoading(false);
    toast({
      title: "Database Refreshed",
      description: "Latest data has been loaded successfully.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: `Exporting ${selectedTable} data...`,
    });
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setShowEditDialog(true);
  };

  const handleDeletePatient = async (patientId) => {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/database-viewer/patients/${patientId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message || "Patient deleted successfully",
        });
        fetchPatients();
      } else {
        // Show the detailed error message from backend
        toast({
          title: "Cannot Delete Patient",
          description: data.message || 'Failed to delete patient',
          variant: "destructive",
          duration: 6000 // Show for longer since message is detailed
        });
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast({
        title: "Error",
        description: 'Failed to connect to server',
        variant: "destructive"
      });
    }
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/database-viewer/patients/${editingPatient.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingPatient)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Patient updated successfully",
        });
        setShowEditDialog(false);
        setEditingPatient(null);
        fetchPatients();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || 'Failed to update patient',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: "Error",
        description: 'Failed to update patient',
        variant: "destructive"
      });
    }
  };

  const handleViewAppointment = (appointment) => {
    setViewingAppointment(appointment);
    setShowViewDialog(true);
  };

  const handleDeleteAppointmentClick = (appointment) => {
    setDeletingAppointment(appointment);
    setDeleteSuccess(false);
    setDeleteError(false);
    setDeleteErrorMessage('');
    setShowDeleteDialog(true);
  };

  const handleDeleteAppointmentConfirm = async () => {
    if (!deletingAppointment) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`${API_URL}/appointments/${deletingAppointment.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteSuccess(true);
        setDeleteLoading(false);
        fetchAppointments();
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          setShowDeleteDialog(false);
          setDeletingAppointment(null);
          setDeleteSuccess(false);
        }, 2000);
      } else {
        setDeleteLoading(false);
        setDeleteError(true);
        setDeleteErrorMessage(data.message || 'Failed to delete appointment. Please try again.');
      }
    } catch (error) {
      setDeleteLoading(false);
      setDeleteError(true);
      setDeleteErrorMessage('Failed to connect to server. Please check your connection and try again.');
      console.error('Error deleting appointment:', error);
    }
  };

  const getTableColumns = (table) => {
    switch (table) {
      case 'patients':
        return ['ID', 'Name', 'Email', 'Phone', 'Status', 'Actions'];
      case 'appointments':
        return ['ID', 'Patient', 'Date', 'Time', 'Status', 'Actions'];
      case 'staff':
        return ['ID', 'Name', 'Role', 'Department', 'Status', 'Actions'];
      case 'records':
        return ['ID', 'Patient', 'Type', 'Date', 'Doctor', 'Actions'];
      default:
        return [];
    }
  };

  const renderTableRow = (item, table) => {
    const getStatusBadge = (status) => (
      <Badge variant={status === 'Active' || status === 'SCHEDULED' || status === 'COMPLETED' ? 'default' : 'secondary'} 
             className={status === 'Active' || status === 'SCHEDULED' || status === 'COMPLETED' ? 'bg-green-100 text-green-700' : ''}>
        {status}
      </Badge>
    );

    switch (table) {
      case 'patients':
        return (
          <tr key={item.id} className="border-b hover:bg-slate-50">
            <td className="px-4 py-3 text-slate-700">{item.id}</td>
            <td className="px-4 py-3 font-medium text-slate-800">{item.firstName} {item.lastName}</td>
            <td className="px-4 py-3 text-slate-700">{item.email || '-'}</td>
            <td className="px-4 py-3 text-slate-700">{item.phone || '-'}</td>
            <td className="px-4 py-3">{getStatusBadge('Active')}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-slate-300 hover:bg-slate-50" onClick={() => handleEditPatient(item)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </td>
          </tr>
        );
      case 'appointments':
        return (
          <tr key={item.id} className="border-b hover:bg-slate-50">
            <td className="px-4 py-3 text-slate-700">{item.id}</td>
            <td className="px-4 py-3 font-medium text-slate-800">
              {item.patient ? `${item.patient.firstName} ${item.patient.lastName}` : '-'}
            </td>
            <td className="px-4 py-3 text-slate-700">
              {item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString() : '-'}
            </td>
            <td className="px-4 py-3 text-slate-700">
              {item.appointmentTime || '-'}
            </td>
            <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-slate-300 hover:bg-slate-50" onClick={() => handleViewAppointment(item)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-slate-300 hover:bg-red-50 text-red-600" onClick={() => handleDeleteAppointmentClick(item)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </td>
          </tr>
        );
      case 'staff':
        return (
          <tr key={item.id} className="border-b hover:bg-slate-50">
            <td className="px-4 py-3 text-slate-700">{item.id}</td>
            <td className="px-4 py-3 font-medium text-slate-800">{item.firstName} {item.lastName}</td>
            <td className="px-4 py-3 text-slate-700">{item.staffType || '-'}</td>
            <td className="px-4 py-3 text-slate-700">{item.department || '-'}</td>
            <td className="px-4 py-3">{getStatusBadge(item.isActive ? 'Active' : 'Inactive')}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-slate-300 hover:bg-slate-50"><Eye className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" className="border-slate-300 hover:bg-slate-50"><Edit className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" className="border-slate-300 hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </td>
          </tr>
        );
      case 'records':
        return (
          <tr key={item.id} className="border-b hover:bg-slate-50">
            <td className="px-4 py-3 text-slate-700">{item.id}</td>
            <td className="px-4 py-3 font-medium text-slate-800">
              {item.patient ? `${item.patient.firstName} ${item.patient.lastName}` : '-'}
            </td>
            <td className="px-4 py-3 text-slate-700">{item.recordType || item.type || '-'}</td>
            <td className="px-4 py-3 text-slate-700">
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
            </td>
            <td className="px-4 py-3 text-slate-700">
              {item.doctor ? `${item.doctor.firstName} ${item.doctor.lastName}` : '-'}
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-slate-300 hover:bg-slate-50"><Eye className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" className="border-slate-300 hover:bg-slate-50"><Edit className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" className="border-slate-300 hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </td>
          </tr>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Database Viewer</h1>
            <p className="text-gray-600 mt-1">View and manage system data</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 border-blue-300 hover:bg-blue-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button 
              size="sm" 
              onClick={handleExport}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Database Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Patients</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{dbStats.patients.count.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {dbStats.patients.lastUpdated}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Appointments</CardTitle>
              <Calendar className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{dbStats.appointments.count.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {dbStats.appointments.lastUpdated}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Records</CardTitle>
              <FileText className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{dbStats.records.count.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {dbStats.records.lastUpdated}
              </p>
            </CardContent>
          </Card>
        </div>

      {/* Data Tables */}
      <Card className="shadow-sm border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Database className="h-5 w-5 text-blue-600" />
              Database Tables
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button variant="outline" size="sm" className="border-blue-300 hover:bg-blue-50">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={selectedTable} onValueChange={setSelectedTable}>
            <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-lg shadow-sm border">
              <TabsTrigger value="patients" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Patients</TabsTrigger>
              <TabsTrigger value="appointments" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Appointments</TabsTrigger>
              <TabsTrigger value="records" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Records</TabsTrigger>
            </TabsList>

              {Object.keys(tableData).map((table) => (
                <TabsContent key={table} value={table} className="mt-6">
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          {getTableColumns(table).map((column) => (
                            <th key={column} className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData[table]
                          .filter((item) => 
                            !searchTerm || 
                            Object.values(item).some(value => 
                              value.toString().toLowerCase().includes(searchTerm.toLowerCase())
                            )
                          )
                          .sort((a, b) => {
                            // Sort patients in descending order by ID
                            if (table === 'patients') {
                              return b.id.localeCompare(a.id);
                            }
                            return 0;
                          })
                          .map((item) => renderTableRow(item, table))
                        }
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

      {/* Edit Patient Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Patient
            </DialogTitle>
          </DialogHeader>
          {editingPatient && (
            <form onSubmit={handleUpdatePatient} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">First Name *</Label>
                  <Input
                    value={editingPatient.firstName || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, firstName: e.target.value })}
                    className="border-slate-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Last Name *</Label>
                  <Input
                    value={editingPatient.lastName || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, lastName: e.target.value })}
                    className="border-slate-300"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Email</Label>
                  <Input
                    type="email"
                    value={editingPatient.email || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Phone</Label>
                  <Input
                    value={editingPatient.phone || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Address</Label>
                <Input
                  value={editingPatient.address || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, address: e.target.value })}
                  className="border-slate-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} className="border-slate-300 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Update Patient
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Appointment Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Eye className="h-5 w-5 text-blue-600" />
              Appointment Details
            </DialogTitle>
          </DialogHeader>
          {viewingAppointment && (
            <div className="space-y-6 pt-4">
              {/* Patient Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-600 text-sm">Patient Name</Label>
                    <p className="text-slate-800 font-medium">
                      {viewingAppointment.patient ? `${viewingAppointment.patient.firstName} ${viewingAppointment.patient.lastName}` : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm">Patient ID</Label>
                    <p className="text-slate-800 font-medium">{viewingAppointment.patient?.id || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm">Email</Label>
                    <p className="text-slate-800">{viewingAppointment.patient?.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm">Phone</Label>
                    <p className="text-slate-800">{viewingAppointment.patient?.phone || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Appointment Information */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Appointment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-600 text-sm">Appointment ID</Label>
                    <p className="text-slate-800 font-medium">{viewingAppointment.id}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm">Status</Label>
                    <div className="mt-1">
                      <Badge variant={viewingAppointment.status === 'SCHEDULED' || viewingAppointment.status === 'COMPLETED' ? 'default' : 'secondary'} 
                             className={viewingAppointment.status === 'SCHEDULED' || viewingAppointment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : ''}>
                        {viewingAppointment.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm">Date</Label>
                    <p className="text-slate-800">
                      {viewingAppointment.appointmentDate ? new Date(viewingAppointment.appointmentDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm">Time</Label>
                    <p className="text-slate-800">{viewingAppointment.appointmentTime || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm">Token Number</Label>
                    <p className="text-slate-800 font-medium">{viewingAppointment.tokenNumber || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm">Appointment Type</Label>
                    <p className="text-slate-800">{viewingAppointment.appointmentType || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Doctor Information */}
              {viewingAppointment.doctor && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Doctor Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-600 text-sm">Doctor Name</Label>
                      <p className="text-slate-800 font-medium">
                        {`${viewingAppointment.doctor.firstName} ${viewingAppointment.doctor.lastName}`}
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-600 text-sm">Department</Label>
                      <p className="text-slate-800">{viewingAppointment.doctor.department || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Additional Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-600 text-sm">Created At</Label>
                    <p className="text-slate-800">
                      {viewingAppointment.createdAt ? new Date(viewingAppointment.createdAt).toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-600 text-sm">Updated At</Label>
                    <p className="text-slate-800">
                      {viewingAppointment.updatedAt ? new Date(viewingAppointment.updatedAt).toLocaleString() : '-'}
                    </p>
                  </div>
                </div>
                {viewingAppointment.notes && (
                  <div>
                    <Label className="text-slate-600 text-sm">Notes</Label>
                    <p className="text-slate-800 mt-1 p-3 bg-slate-50 rounded-md">{viewingAppointment.notes}</p>
                  </div>
                )}
                {viewingAppointment.reason && (
                  <div>
                    <Label className="text-slate-600 text-sm">Reason for Visit</Label>
                    <p className="text-slate-800 mt-1 p-3 bg-slate-50 rounded-md">{viewingAppointment.reason}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowViewDialog(false)} className="border-slate-300 hover:bg-slate-50">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Appointment Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteAppointmentConfirm}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeletingAppointment(null);
          setDeleteSuccess(false);
          setDeleteError(false);
          setDeleteErrorMessage('');
        }}
        title="Delete Appointment"
        description="Are you sure you want to delete this appointment? This action cannot be undone and will remove all associated records."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
        loadingText="Deleting..."
        showData={false}
        success={deleteSuccess}
        successTitle="Deleted Successfully"
        successMessage="The appointment has been deleted successfully along with all associated records."
        successButtonText="Close"
        error={deleteError}
        errorTitle="Deletion Failed"
        errorMessage={deleteErrorMessage}
        errorButtonText="Close"
      />
      </div>
    </div>
  );
};

export default DatabaseViewer;