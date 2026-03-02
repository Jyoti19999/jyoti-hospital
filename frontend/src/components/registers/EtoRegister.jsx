import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Download, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EtoRegister = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    nameOfItem: '',
    batch: '',
    loadNo: '',
    chargeInTime: '',
    switchOff: '',
    otInHrs: '',
    indicatorSlnp: '',
    biSeparate: '',
    yesNo: '',
    passedFailed: '',
    integratedStnp: '',
    signCssd: '',
    signIdd: ''
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/registers/eto', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setEntries(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch ETO register entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingId
        ? `/api/v1/registers/eto/${editingId}`
        : '/api/v1/registers/eto';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success(editingId ? 'Entry updated successfully' : 'Entry created successfully');
        fetchEntries();
        resetForm();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry) => {
    setFormData({
      date: entry.date.split('T')[0],
      nameOfItem: entry.nameOfItem || '',
      batch: entry.batch || '',
      loadNo: entry.loadNo || '',
      chargeInTime: entry.chargeInTime || '',
      switchOff: entry.switchOff || '',
      otInHrs: entry.otInHrs || '',
      indicatorSlnp: entry.indicatorSlnp || '',
      biSeparate: entry.biSeparate || '',
      yesNo: entry.yesNo || '',
      passedFailed: entry.passedFailed || '',
      integratedStnp: entry.integratedStnp || '',
      signCssd: entry.signCssd || '',
      signIdd: entry.signIdd || ''
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/registers/eto/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Entry deleted successfully');
        fetchEntries();
      } else {
        toast.error(data.message || 'Delete failed');
      }
    } catch (error) {
      toast.error('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      nameOfItem: '', batch: '', loadNo: '', chargeInTime: '', switchOff: '',
      otInHrs: '', indicatorSlnp: '', biSeparate: '', yesNo: '', passedFailed: '',
      integratedStnp: '', signCssd: '', signIdd: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/v1/registers/eto/export', {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ETO_Register.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Export completed successfully');
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleYearlyExport = async () => {
    try {
      const response = await fetch(`/api/v1/registers/eto/export?year=${selectedYear}&exportType=yearly`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ETO_Register_${selectedYear}_Yearly.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Yearly export completed successfully');
      } else {
        toast.error('Yearly export failed');
      }
    } catch (error) {
      toast.error('Yearly export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ETO Register</h2>
        <div className="flex space-x-2 items-center">
          <div className="flex items-center space-x-2">
            <Label>Year:</Label>
            <Input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              min={2020}
              max={new Date().getFullYear()}
              className="w-24"
            />
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleYearlyExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Year
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Entry' : 'Add New Entry'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nameOfItem">
                  Name of Item <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nameOfItem"
                  value={formData.nameOfItem}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
                    setFormData({ ...formData, nameOfItem: value });
                  }}
                  placeholder="Letters, numbers, and spaces only"
                  required
                />
              </div>
              <div>
                <Label htmlFor="batch">Batch</Label>
                <Input
                  id="batch"
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="loadNo">Load No</Label>
                <Input
                  id="loadNo"
                  value={formData.loadNo}
                  onChange={(e) => setFormData({ ...formData, loadNo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="chargeInTime">Charge In Time</Label>
                <Input
                  id="chargeInTime"
                  value={formData.chargeInTime}
                  onChange={(e) => setFormData({ ...formData, chargeInTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="switchOff">Switch Off</Label>
                <Input
                  id="switchOff"
                  value={formData.switchOff}
                  onChange={(e) => setFormData({ ...formData, switchOff: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="otInHrs">OT in Hrs</Label>
                <Input
                  id="otInHrs"
                  type="number"
                  step="0.1"
                  value={formData.otInHrs}
                  onChange={(e) => setFormData({ ...formData, otInHrs: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="yesNo">Y/N</Label>
                <Select value={formData.yesNo} onValueChange={(value) => setFormData({ ...formData, yesNo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Y/N" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="passedFailed">P/F</Label>
                <Select value={formData.passedFailed} onValueChange={(value) => setFormData({ ...formData, passedFailed: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select P/F" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Passed">Passed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name of Item</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Load No</TableHead>
                <TableHead>OT Hrs</TableHead>
                <TableHead>Y/N</TableHead>
                <TableHead>P/F</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.nameOfItem}</TableCell>
                  <TableCell>{entry.batch}</TableCell>
                  <TableCell>{entry.loadNo}</TableCell>
                  <TableCell>{entry.otInHrs}</TableCell>
                  <TableCell>{entry.yesNo}</TableCell>
                  <TableCell>{entry.passedFailed}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(entry)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EtoRegister;