import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Database, Edit, Trash2, Eye } from 'lucide-react';
import { RegisterRecordManager } from './DigitalRegisterManager';
import EditRegisterForm from './EditRegisterForm';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const AdminRegisterManagement = () => {
  const [registers, setRegisters] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRegister, setSelectedRegister] = useState(null);
  const [editingRegister, setEditingRegister] = useState(null);
  const [loading, setLoading] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registerToDelete, setRegisterToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  useEffect(() => {
    fetchRegisters();
  }, []);

  const fetchRegisters = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/digital-registers/definitions`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setRegisters(data.data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (register) => {
    setRegisterToDelete(register);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!registerToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/digital-registers/definitions/${registerToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setDeleteSuccess(true);
        fetchRegisters();
      } else {
        setDeleteError(true);
      }
    } catch (error) {
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    if (deleteSuccess || deleteError) {
      setDeleteSuccess(false);
      setDeleteError(false);
    }
    setDeleteDialogOpen(false);
    setRegisterToDelete(null);
  };

  if (showCreateForm || editingRegister) {
    return (
      <EditRegisterForm
        register={editingRegister}
        onBack={() => {
          setShowCreateForm(false);
          setEditingRegister(null);
          fetchRegisters();
        }}
      />
    );
  }

  if (selectedRegister) {
    return (
      <RegisterRecordManager
        register={selectedRegister}
        onBack={() => setSelectedRegister(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Digital Register Management</h2>
            <p className="text-gray-600 mt-1">Create and manage custom registers for the hospital</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create New Register
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : registers.length === 0 ? (
          <Card className="shadow-sm border-0">
            <CardContent className="py-12 text-center">
              <Database className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No registers created yet</h3>
              <p className="text-gray-500 mb-4">
                Create custom registers to track any data you need
              </p>
              <Button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Register
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {registers.map((register) => (
              <Card key={register.id} className="shadow-sm border-0 hover:shadow-md transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <Database className="h-5 w-5 text-blue-600" />
                    {register.name}
                  </CardTitle>
                  {register.description && (
                    <p className="text-sm text-gray-600">{register.description}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                        onClick={() => setSelectedRegister(register)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Records
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-gray-50"
                        onClick={() => setEditingRegister(register)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(register)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="shadow-sm border-0 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">How it works</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Registers created here will be automatically available in the OT Admin Dashboard
                  under the "Registers" tab. OT Admins can then add and manage records in these registers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          title="Delete Register"
          description={`Are you sure you want to delete "${registerToDelete?.name}"? All records in this register will be permanently lost. This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          loading={deleting}
          loadingText="Deleting..."
          success={deleteSuccess}
          successTitle="Register Deleted"
          successMessage="The register and all its records have been successfully deleted."
          successButtonText="Close"
          error={deleteError}
          errorTitle="Delete Failed"
          errorMessage="Failed to delete the register. Please try again."
          errorButtonText="Close"
        />
      </div>
    </div>
  );
};

export default AdminRegisterManagement;

/**
 * ========================================
 * 📋 HOW TO USE THIS COMPONENT IN OTHER DASHBOARDS
 * ========================================
 
 * 
 * Step 1: Import the component
 * ------------------------------
 * import AdminRegisterManagement from '@/components/registers/AdminRegisterManagement';
 * 
 * Step 2: Add to your menu items
 * ------------------------------
 * const menuItems = [
 *   { title: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
 *   { title: "Registers", icon: FileText, key: "registers" }, // NEW
 *   // ... other menu items
 * ];
 * 
 * Step 3: Render in your content area
 * ------------------------------
 * const renderContent = () => {
 *   switch (activeView) {
 *     case "dashboard":
 *       return <DashboardContent />;
 *     case "registers":
 *       return <AdminRegisterManagement />; // NEW
 *     default:
 *       return <DashboardContent />;
 *   }
 * };
 * 
 * ========================================
 * 🎯 FEATURES INCLUDED
 * ========================================
 * 
 * ✅ Create custom registers with dynamic columns
 * ✅ Support for 13 data types (TEXT, NUMBER, DATE, IMAGE, PDF_DOCUMENT, DROPDOWN, MULTI_SELECT, etc.)
 * ✅ Add validation rules (min/max length, required fields, patterns)
 * ✅ Manage records (add, edit, delete)
 * ✅ Export records to Excel
 * ✅ Image upload support
 * ✅ Responsive design
 * ✅ Real-time updates
 * 
 * ========================================
 * 📝 SUPPORTED COLUMN TYPES
 * ========================================
 * 
 * - TEXT           : Short text input
 * - NUMBER         : Numeric values
 * - LONG_NUMBER    : Large numbers
 * - DATE           : Date picker
 * - TIME           : Time picker
 * - DATETIME       : Date and time picker
 * - IMAGE          : Image upload
 * - EMAIL          : Email validation
 * - MOBILE         : Phone number
 * - URL            : Website links
 * - DROPDOWN       : Single selection from options
 * - MULTI_SELECT   : Multiple selections from options
 * 
 * ========================================
 * 📚 RELATED FILES
 * ========================================
 * 
 * - DigitalRegisterManager.jsx  : Core register and record management
 * - EditRegisterForm.jsx        : Form for creating/editing registers
 * - RegistersTab.jsx            : Tab view with static + dynamic registers
 * - RegisterManager.jsx         : Generic register manager
 * - registerConfigs.js          : Configuration for static registers
 * 
 * ========================================
 */
