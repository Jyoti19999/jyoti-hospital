import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Download, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const EquipmentStockRegister = ({ registerType = 'EquipmentStockRegister', title = 'Equipment Stock Register' }) => {
  const [medicines, setMedicines] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAddingMedicine, setIsAddingMedicine] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    currentStock: '',
    manufacturer: '',
    batchNumber: '',
    marginDate: '',
    expiryDate: '',
    reorderLevel: '1',
    unitCost: ''
  });
  const [editingCell, setEditingCell] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const workingDays = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    workingDays.push(day);
  }

  useEffect(() => {
    fetchMedicines();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    // Auto-scroll to current date on mount
    const today = new Date();
    if (selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear()) {
      setTimeout(() => {
        const currentDayCell = document.querySelector(`th:nth-child(${today.getDate() + 2})`);
        if (currentDayCell) {
          currentDayCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 100);
    }
  }, [medicines, selectedMonth, selectedYear]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      
      // Fetch medicines from Equipment table filtered by register type
      const equipmentResponse = await axios.get(`${API_URL}/equipment`, {
        params: { 
          category: 'Medicine', 
          limit: 1000,
          isActive: 'true' // Only fetch active medicines
        },
        withCredentials: true
      });
      
      const allMedicines = equipmentResponse.data.data?.equipment || equipmentResponse.data.data || [];
      
      // Double filter: by register type AND isActive (in case API doesn't filter properly)
      const filteredMedicines = allMedicines.filter(med => {
        const isCorrectRegister = med.register === registerType;
        const isActiveMedicine = med.isActive === true; // ONLY true, not undefined
        const shouldInclude = isCorrectRegister && isActiveMedicine;
        
        
        return shouldInclude;
      });
      
      
      // Fetch register tracking data for current month
      const registerResponse = await axios.get(`${API_URL}/registers/equipment-stock`, {
        params: { 
          month: selectedMonth, 
          year: selectedYear,
          registerType: registerType // Filter by register type
        },
        withCredentials: true
      });
      
      const registerData = registerResponse.data.data || [];
      
      // Merge equipment data with register tracking data
      const mergedData = filteredMedicines.map((medicine, index) => {
        const tracking = registerData.find(r => r.equipmentId === medicine.id);
        
        // Initialize dailyStock with current stock for all days if no tracking exists
        let dailyStock = tracking?.dailyStock || {};
        
        // If no tracking data exists, populate with current stock from equipment
        if (!tracking && medicine.currentStock !== undefined) {
          const today = new Date().getDate();
          dailyStock = { [today]: medicine.currentStock };
        }
        
        return {
          id: tracking?.id || medicine.id,
          srNo: index + 1,
          medicineName: medicine.name,
          equipmentId: medicine.id,
          currentStock: medicine.currentStock, // Keep current stock for reference
          dailyStock: dailyStock,
          month: selectedMonth,
          year: selectedYear
        };
      });
      
      setMedicines(mergedData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.name || !newMedicine.currentStock) {
      toast.error('Please fill in medicine name and current stock');
      return;
    }

    if (!newMedicine.unitCost) {
      toast.error('Please fill in unit cost');
      return;
    }

    try {
      const medicineData = {
        name: newMedicine.name,
        category: 'Medicine',
        register: registerType,
        currentStock: parseInt(newMedicine.currentStock),
        reorderLevel: parseInt(newMedicine.reorderLevel) || 5,
        manufacturer: newMedicine.manufacturer || undefined,
        batchNumber: newMedicine.batchNumber || undefined,
        marginDate: newMedicine.marginDate || undefined,
        expiryDate: newMedicine.expiryDate || undefined,
        unitCost: newMedicine.unitCost ? parseFloat(newMedicine.unitCost) : undefined
      };

      if (editingId) {
        // Update existing medicine
        await axios.put(`${API_URL}/equipment/${editingId}`, medicineData, { 
          withCredentials: true 
        });
        toast.success('Medicine updated successfully!');
      } else {
        // Add new medicine
        await axios.post(`${API_URL}/equipment`, medicineData, { 
          withCredentials: true 
        });
        toast.success('Medicine added successfully!');
      }
      
      setNewMedicine({
        name: '',
        currentStock: '',
        manufacturer: '',
        batchNumber: '',
        marginDate: '',
        expiryDate: '',
        reorderLevel: '1',
        unitCost: ''
      });
      setEditingId(null);
      setIsAddingMedicine(false);
      fetchMedicines();
    } catch (error) {
      
      // Show detailed validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Multiple validation errors
        const errorMessages = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        toast.error(`Validation Error: ${errorMessages}`);
      } else if (error.response?.data?.message) {
        // Single error message
        toast.error(error.response.data.message);
      } else {
        // Generic error
        toast.error('Failed to save medicine');
      }
    }
  };

  const handleUpdateStock = async (medicineId, day, value) => {
    try {
      const medicine = medicines.find(m => m.id === medicineId);
      const updatedDailyStock = { ...medicine.dailyStock, [day]: value };

      await axios.put(`${API_URL}/registers/equipment-stock/${medicineId}`, {
        dailyStock: updatedDailyStock
      }, { withCredentials: true });

      fetchMedicines();
      setEditingCell(null);
      toast.success('Stock updated successfully');
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const handleEditMedicine = async (medicine) => {
    // Fetch full equipment details
    try {
      const response = await axios.get(`${API_URL}/equipment/${medicine.equipmentId}`, {
        withCredentials: true
      });
      
      const equipment = response.data.data;
      
      setNewMedicine({
        name: equipment.name,
        currentStock: equipment.currentStock.toString(),
        manufacturer: equipment.manufacturer || '',
        batchNumber: equipment.batchNumber || '',
        marginDate: equipment.marginDate ? equipment.marginDate.split('T')[0] : '',
        expiryDate: equipment.expiryDate ? equipment.expiryDate.split('T')[0] : '',
        reorderLevel: equipment.reorderLevel?.toString() || '5',
        unitCost: equipment.unitCost?.toString() || ''
      });
      setEditingId(medicine.equipmentId);
      setIsAddingMedicine(true);
    } catch (error) {
      toast.error('Failed to load medicine details');
    }
  };

  const handleDeleteMedicine = async (equipmentId) => {
    if (!confirm('Are you sure you want to delete this medicine? This will remove it from Equipment Management.')) return;

    try {
      
      // Delete from Equipment table (soft delete - sets isActive: false)
      const response = await axios.delete(`${API_URL}/equipment/${equipmentId}`, {
        withCredentials: true
      });
      
      
      // Also delete the register entry for this month
      const registerEntry = medicines.find(m => m.equipmentId === equipmentId);
      if (registerEntry && registerEntry.id !== equipmentId) {
        try {
          await axios.delete(`${API_URL}/registers/equipment-stock/${registerEntry.id}`, {
            withCredentials: true
          });
        } catch (regError) {
        }
      }
      
      // Refresh the list
      await fetchMedicines();
      toast.success('Medicine deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete medicine');
    }
  };

  const handleExport = async () => {
    try {
      // Determine the correct export endpoint based on register type
      let exportEndpoint = 'equipment-stock';
      let filename = 'Equipment_Stock_Register';
      
      if (registerType === 'FridgeStockMedicinesRegister') {
        exportEndpoint = 'fridge-stock-medicines';
        filename = 'Fridge_Stock_Medicines_Register';
      } else if (registerType === 'OtEmergencyStockRegister') {
        exportEndpoint = 'ot-emergency-stock';
        filename = 'OT_Emergency_Stock_Register';
      }

      const response = await axios.get(`${API_URL}/registers/${exportEndpoint}/export`, {
        params: { 
          month: selectedMonth, 
          year: selectedYear,
          registerType: registerType // Pass register type to filter data
        },
        responseType: 'blob',
        withCredentials: true
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}_${selectedMonth}_${selectedYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export completed successfully');
    } catch (error) {
      toast.error('Failed to export register');
    }
  };

  const handleYearlyExport = async () => {
    try {
      // Determine the correct export endpoint based on register type
      let exportEndpoint = 'equipment-stock';
      let filename = 'Equipment_Stock_Register';
      
      if (registerType === 'FridgeStockMedicinesRegister') {
        exportEndpoint = 'fridge-stock-medicines';
        filename = 'Fridge_Stock_Medicines_Register';
      } else if (registerType === 'OtEmergencyStockRegister') {
        exportEndpoint = 'ot-emergency-stock';
        filename = 'OT_Emergency_Stock_Register';
      }

      const response = await axios.get(`${API_URL}/registers/${exportEndpoint}/export`, {
        params: { 
          year: selectedYear,
          exportType: 'yearly',
          registerType: registerType
        },
        responseType: 'blob',
        withCredentials: true
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}_${selectedYear}_Yearly.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Yearly export completed successfully');
    } catch (error) {
      toast.error('Failed to export yearly register');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Dedicated title section - fixed */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-gray-50/30">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-gray-500">Month:</Label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-gray-500">Year:</Label>
            <Input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              min={2020}
              max={new Date().getFullYear()}
              className="w-20 h-8 text-sm"
            />
          </div>
          <Button onClick={() => setIsAddingMedicine(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Medicine
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export Month
          </Button>
          <Button onClick={handleYearlyExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export Year
          </Button>
        </div>
      </div>

      <Dialog open={isAddingMedicine} onOpenChange={setIsAddingMedicine}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Medicine' : 'Add New Medicine'}</DialogTitle>
          </DialogHeader>
            <ScrollArea className="max-h-[calc(85vh-120px)] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Medicine Name *</Label>
                  <Input
                    value={newMedicine.name}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
                      setNewMedicine({ ...newMedicine, name: value });
                    }}
                    placeholder="Enter medicine name"
                  />
                </div>
                <div>
                  <Label>Current Stock *</Label>
                  <Input
                    type="number"
                    value={newMedicine.currentStock}
                    onChange={(e) => setNewMedicine({ ...newMedicine, currentStock: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Brand Name</Label>
                  <Input
                    value={newMedicine.manufacturer}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
                      setNewMedicine({ ...newMedicine, manufacturer: value });
                    }}
                    placeholder="Brand name"
                  />
                </div>
                <div>
                  <Label>Batch Number</Label>
                  <Input
                    value={newMedicine.batchNumber}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                      setNewMedicine({ ...newMedicine, batchNumber: value });
                    }}
                    placeholder="Batch no (A-Z, 0-9 only)"
                  />
                </div>
                <div>
                  <Label>Margin Date</Label>
                  <Input
                    type="date"
                    value={newMedicine.marginDate}
                    onChange={(e) => setNewMedicine({ ...newMedicine, marginDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={newMedicine.expiryDate}
                    onChange={(e) => setNewMedicine({ ...newMedicine, expiryDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    value={newMedicine.reorderLevel}
                    onChange={(e) => setNewMedicine({ ...newMedicine, reorderLevel: e.target.value })}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label>Unit Cost (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newMedicine.unitCost}
                    onChange={(e) => setNewMedicine({ ...newMedicine, unitCost: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button onClick={() => {
                setIsAddingMedicine(false);
                setEditingId(null);
                setNewMedicine({
                  name: '',
                  currentStock: '',
                  manufacturer: '',
                  batchNumber: '',
                  marginDate: '',
                  expiryDate: '',
                  reorderLevel: '1',
                  unitCost: ''
                });
              }} variant="outline" size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleAddMedicine} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Update Medicine' : 'Save Medicine'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Content rendered directly below title - scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-r-0 border p-2 sticky left-0 bg-gray-100 z-20 w-16">SR No</th>
                <th className="border-l-0 border p-2 sticky left-16 bg-gray-100 z-20 w-[180px]">Medicine Name</th>
                {workingDays.map(day => {
                  const today = new Date();
                  const currentDay = today.getDate();
                  const currentMonth = today.getMonth() + 1;
                  const currentYear = today.getFullYear();
                  const isToday = day === currentDay && selectedMonth === currentMonth && selectedYear === currentYear;
                  
                  return (
                    <th key={day} className={`border p-2 min-w-[80px] ${isToday ? 'bg-blue-500 text-white font-bold' : ''}`}>
                      {day}
                    </th>
                  );
                })}
                <th className="border p-2 sticky right-0 bg-gray-100 z-20 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={workingDays.length + 3} className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) : medicines.length === 0 ? (
                <tr>
                  <td colSpan={workingDays.length + 3} className="text-center p-4 text-gray-500">
                    No medicines added yet. Click "Add Medicine" to start.
                  </td>
                </tr>
              ) : (
                medicines.map((medicine) => (
                  <tr key={medicine.id} className="hover:bg-gray-50">
                    <td className="border-r-0 border p-2 text-center sticky left-0 bg-white z-10 w-16">{medicine.srNo}</td>
                    <td className="border-l-0 border p-2 sticky left-16 bg-white font-medium z-10 w-[180px]">{medicine.medicineName}</td>
                    {workingDays.map(day => {
                      const today = new Date();
                      const currentDay = today.getDate();
                      const currentMonth = today.getMonth() + 1;
                      const currentYear = today.getFullYear();
                      const isToday = day === currentDay && selectedMonth === currentMonth && selectedYear === currentYear;
                      
                      // Check if this day is in the future
                      const isFutureDate = (selectedYear > currentYear) || 
                                           (selectedYear === currentYear && selectedMonth > currentMonth) ||
                                           (selectedYear === currentYear && selectedMonth === currentMonth && day > currentDay);
                      
                      // Get value for this day, or carry forward from last known day (only for past/present dates)
                      let value = medicine.dailyStock?.[day];
                      if (value === undefined || value === null || value === '') {
                        if (!isFutureDate) {
                          // Find last known value from previous days (only for past/present dates)
                          for (let prevDay = day - 1; prevDay >= 1; prevDay--) {
                            if (medicine.dailyStock?.[prevDay] !== undefined && medicine.dailyStock?.[prevDay] !== null && medicine.dailyStock?.[prevDay] !== '') {
                              value = medicine.dailyStock[prevDay];
                              break;
                            }
                          }
                        }
                      }
                      
                      // Show blank for future dates, 0 for past dates with no value
                      const displayValue = isFutureDate ? '' : (value !== undefined && value !== null && value !== '' ? value : 0);
                      const isCarriedForward = medicine.dailyStock?.[day] === undefined && value !== undefined && value !== null && value !== '';

                      return (
                        <td
                          key={day}
                          className={`border p-1 text-center ${isCarriedForward ? 'bg-gray-50 text-gray-500' : 'bg-white'} ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                          title={isCarriedForward ? 'Carried forward from previous day' : isToday ? 'Today' : ''}
                        >
                          <span className={`block py-1 ${isCarriedForward ? 'italic' : ''}`}>
                            {displayValue}
                          </span>
                        </td>
                      );
                    })}
                    <td className="border p-2 text-center sticky right-0 bg-white z-10">
                      <div className="flex justify-center space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditMedicine(medicine)}
                          title="Edit Medicine"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteMedicine(medicine.equipmentId)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Medicine"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default EquipmentStockRegister;
