import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Search, Pill } from "lucide-react";

const MedicineMaster = () => {
    const API_URL = import.meta.env.VITE_API_URL;

    // State for dropdown options
    const [medicineTypes, setMedicineTypes] = useState([]);
    const [genericMedicines, setGenericMedicines] = useState([]);
    const [drugGroups, setDrugGroups] = useState([]);
    const [dosageSchedules, setDosageSchedules] = useState([]);

    // State for medicines
    const [medicines, setMedicines] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // State for forms
    const [newType, setNewType] = useState('');
    const [newGeneric, setNewGeneric] = useState('');
    const [newDrugGroup, setNewDrugGroup] = useState('');
    const [newDosageSchedule, setNewDosageSchedule] = useState('');

    // State for medicine form
    const [medicineForm, setMedicineForm] = useState({
        code: '',
        name: '',
        typeId: '',
        genericMedicineId: '',
        drugGroupId: '',
        dosageScheduleId: '',
        information: ''
    });

    const [editingMedicine, setEditingMedicine] = useState(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        await Promise.all([
            fetchMedicineTypes(),
            fetchGenericMedicines(),
            fetchDrugGroups(),
            fetchDosageSchedules(),
            fetchMedicines()
        ]);
    };

    // Fetch functions
    const fetchMedicineTypes = async () => {
        try {
            const response = await fetch(`${API_URL}/medicine-master/types`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setMedicineTypes(data.data);
            }
        } catch (error) {
        }
    };

    const fetchGenericMedicines = async () => {
        try {
            const response = await fetch(`${API_URL}/medicine-master/generic-medicines`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setGenericMedicines(data.data);
            }
        } catch (error) {
        }
    };

    const fetchDrugGroups = async () => {
        try {
            const response = await fetch(`${API_URL}/medicine-master/drug-groups`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setDrugGroups(data.data);
            }
        } catch (error) {
        }
    };

    const fetchDosageSchedules = async () => {
        try {
            const response = await fetch(`${API_URL}/medicine-master/dosage-schedules`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setDosageSchedules(data.data);
            }
        } catch (error) {
        }
    };

    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/medicine-master/medicines?search=${searchTerm}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setMedicines(data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch medicines');
        } finally {
            setLoading(false);
        }
    };

    // Create functions
    const handleCreateType = async () => {
        if (!newType.trim()) {
            toast.error('Please enter a medicine type name');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/medicine-master/types`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: newType })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Medicine type created successfully');
                setNewType('');
                fetchMedicineTypes();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to create medicine type');
        }
    };

    const handleCreateGeneric = async () => {
        if (!newGeneric.trim()) {
            toast.error('Please enter a generic medicine name');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/medicine-master/generic-medicines`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: newGeneric })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Generic medicine created successfully');
                setNewGeneric('');
                fetchGenericMedicines();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to create generic medicine');
        }
    };

    const handleCreateDrugGroup = async () => {
        if (!newDrugGroup.trim()) {
            toast.error('Please enter a drug group name');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/medicine-master/drug-groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: newDrugGroup })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Drug group created successfully');
                setNewDrugGroup('');
                fetchDrugGroups();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to create drug group');
        }
    };

    const handleCreateDosageSchedule = async () => {
        if (!newDosageSchedule.trim()) {
            toast.error('Please enter a dosage schedule name');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/medicine-master/dosage-schedules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: newDosageSchedule })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Dosage schedule created successfully');
                setNewDosageSchedule('');
                fetchDosageSchedules();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to create dosage schedule');
        }
    };

    // Medicine CRUD
    const handleCreateMedicine = async () => {
        if (!medicineForm.name.trim()) {
            toast.error('Medicine name is required');
            return;
        }

        try {
            const url = editingMedicine
                ? `${API_URL}/medicine-master/medicines/${editingMedicine.id}`
                : `${API_URL}/medicine-master/medicines`;

            const response = await fetch(url, {
                method: editingMedicine ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(medicineForm)
            });

            const data = await response.json();
            if (data.success) {
                toast.success(editingMedicine ? 'Medicine updated successfully' : 'Medicine created successfully');
                setMedicineForm({
                    code: '',
                    name: '',
                    typeId: '',
                    genericMedicineId: '',
                    drugGroupId: '',
                    dosageScheduleId: '',
                    information: ''
                });
                setEditingMedicine(null);
                fetchMedicines();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to save medicine');
        }
    };

    const handleEditMedicine = (medicine) => {
        setEditingMedicine(medicine);
        setMedicineForm({
            code: medicine.code || '',
            name: medicine.name,
            typeId: medicine.typeId || '',
            genericMedicineId: medicine.genericMedicineId || '',
            drugGroupId: medicine.drugGroupId || '',
            dosageScheduleId: medicine.dosageScheduleId || '',
            information: medicine.information || ''
        });
    };

    const handleDeleteMedicine = async (id) => {
        if (!confirm('Are you sure you want to delete this medicine?')) return;

        try {
            const response = await fetch(`${API_URL}/medicine-master/medicines/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Medicine deleted successfully');
                fetchMedicines();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to delete medicine');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Medicine Master</h1>
                        <p className="text-gray-600 mt-1">Manage medicines and their properties</p>
                    </div>
                </div>

                <Tabs defaultValue="medicines" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5 bg-white p-1 rounded-lg shadow-md border mb-6">
                        <TabsTrigger value="medicines" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Medicines</TabsTrigger>
                        <TabsTrigger value="types" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Medicine Types</TabsTrigger>
                        <TabsTrigger value="generic" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Generic Medicines</TabsTrigger>
                        <TabsTrigger value="drugGroups" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Drug Groups</TabsTrigger>
                        <TabsTrigger value="dosage" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Dosage Schedules</TabsTrigger>
                    </TabsList>

                    {/* Medicines Tab */}
                    <TabsContent value="medicines" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                            {/* Left Side - Form */}
                            <Card className="h-full shadow-sm border-0">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                        <Pill className="h-5 w-5 text-blue-600" />
                                        {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-gray-700">Code (Optional)</Label>
                                            <Input
                                                value={medicineForm.code}
                                                onChange={(e) => setMedicineForm({ ...medicineForm, code: e.target.value })}
                                                placeholder="e.g., MED001"
                                                className="border-gray-300"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-gray-700">Name *</Label>
                                            <Input
                                                value={medicineForm.name}
                                                onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })}
                                                placeholder="Medicine name"
                                                className="border-gray-300"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-gray-700">Type</Label>
                                            <Select
                                                value={medicineForm.typeId}
                                                onValueChange={(value) => setMedicineForm({ ...medicineForm, typeId: value })}
                                            >
                                                <SelectTrigger className="border-gray-300">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                {medicineTypes.map((type) => (
                                                    <SelectItem key={type.id} value={type.id}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-slate-700">Generic Medicine</Label>
                                        <Select
                                            value={medicineForm.genericMedicineId}
                                            onValueChange={(value) => setMedicineForm({ ...medicineForm, genericMedicineId: value })}
                                        >
                                            <SelectTrigger className="border-slate-300">
                                                <SelectValue placeholder="Select generic medicine" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {genericMedicines.map((generic) => (
                                                    <SelectItem key={generic.id} value={generic.id}>
                                                        {generic.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-slate-700">Drug Group</Label>
                                        <Select
                                            value={medicineForm.drugGroupId}
                                            onValueChange={(value) => setMedicineForm({ ...medicineForm, drugGroupId: value })}
                                        >
                                            <SelectTrigger className="border-slate-300">
                                                <SelectValue placeholder="Select drug group" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {drugGroups.map((group) => (
                                                    <SelectItem key={group.id} value={group.id}>
                                                        {group.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-slate-700">Dosage Schedule</Label>
                                        <Select
                                            value={medicineForm.dosageScheduleId}
                                            onValueChange={(value) => setMedicineForm({ ...medicineForm, dosageScheduleId: value })}
                                        >
                                            <SelectTrigger className="border-slate-300">
                                                <SelectValue placeholder="Select dosage schedule" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dosageSchedules.map((schedule) => (
                                                    <SelectItem key={schedule.id} value={schedule.id}>
                                                        {schedule.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-slate-700">Information / Knowledge</Label>
                                    <Textarea
                                        value={medicineForm.information}
                                        onChange={(e) => setMedicineForm({ ...medicineForm, information: e.target.value })}
                                        placeholder="Additional information about the medicine"
                                        rows={3}
                                        className="border-slate-300"
                                    />
                                </div>
                                <div className="flex justify-center gap-2 pt-4 border-t">
                                    <Button onClick={handleCreateMedicine} className="bg-blue-600 hover:bg-blue-700">
                                        <Plus className="h-4 w-4 mr-2" />
                                        {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
                                    </Button>
                                    {editingMedicine && (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setEditingMedicine(null);
                                                setMedicineForm({
                                                    code: '',
                                                    name: '',
                                                    typeId: '',
                                                    genericMedicineId: '',
                                                    drugGroupId: '',
                                                    dosageScheduleId: '',
                                                    information: ''
                                                });
                                            }}
                                            className="border-slate-300 hover:bg-slate-50"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Right Side - Medicine List */}
                        <Card className="h-full flex flex-col shadow-sm">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                <CardTitle className="text-slate-800">Medicine List</CardTitle>
                                <div className="flex gap-2 mt-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search medicines..."
                                            className="pl-10 border-slate-300"
                                        />
                                    </div>
                                    <Button onClick={fetchMedicines} className="bg-blue-600 hover:bg-blue-700">Search</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="overflow-y-auto max-h-[400px] pt-6">
                                {loading ? (
                                    <p className="text-center py-4 text-slate-600">Loading...</p>
                                ) : medicines.length === 0 ? (
                                    <p className="text-center py-4 text-slate-500">No medicines found</p>
                                ) : (
                                    <div className="space-y-2 pr-2">
                                        {medicines.map((medicine) => (
                                            <div
                                                key={medicine.id}
                                                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-slate-800">{medicine.name}</h3>
                                                        {medicine.code && (
                                                            <Badge variant="outline" className="border-blue-200 text-blue-700">{medicine.code}</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-slate-600 mt-1 space-y-1">
                                                        {medicine.type && <p>Type: {medicine.type.name}</p>}
                                                        {medicine.genericMedicine && <p>Generic: {medicine.genericMedicine.name}</p>}
                                                        {medicine.drugGroup && <p>Drug Group: {medicine.drugGroup.name}</p>}
                                                        {medicine.dosageSchedule && <p>Dosage: {medicine.dosageSchedule.name}</p>}
                                                        {medicine.information && <p className="text-xs mt-1 text-slate-500">{medicine.information}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEditMedicine(medicine)}
                                                        className="border-slate-300 hover:bg-slate-50"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDeleteMedicine(medicine.id)}
                                                        className="text-red-600 hover:text-red-700 border-slate-300 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Medicine Types Tab */}
                <TabsContent value="types">
                    <Card className="shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <CardTitle className="text-slate-800">Medicine Types</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex gap-2">
                                <Input
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value)}
                                    placeholder="Enter medicine type name"
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateType()}
                                    className="border-slate-300"
                                />
                                <Button onClick={handleCreateType} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {medicineTypes.map((type) => (
                                    <div key={type.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700">
                                        {type.name}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Generic Medicines Tab */}
                <TabsContent value="generic">
                    <Card className="shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <CardTitle className="text-slate-800">Generic Medicines</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex gap-2">
                                <Input
                                    value={newGeneric}
                                    onChange={(e) => setNewGeneric(e.target.value)}
                                    placeholder="Enter generic medicine name"
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateGeneric()}
                                    className="border-slate-300"
                                />
                                <Button onClick={handleCreateGeneric} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {genericMedicines.map((generic) => (
                                    <div key={generic.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700">
                                        {generic.name}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Drug Groups Tab */}
                <TabsContent value="drugGroups">
                    <Card className="shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <CardTitle className="text-slate-800">Drug Groups</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex gap-2">
                                <Input
                                    value={newDrugGroup}
                                    onChange={(e) => setNewDrugGroup(e.target.value)}
                                    placeholder="Enter drug group name"
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateDrugGroup()}
                                    className="border-slate-300"
                                />
                                <Button onClick={handleCreateDrugGroup} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {drugGroups.map((group) => (
                                    <div key={group.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700">
                                        {group.name}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Dosage Schedules Tab */}
                <TabsContent value="dosage">
                    <Card className="shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <CardTitle className="text-slate-800">Dosage Schedules</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex gap-2">
                                <Input
                                    value={newDosageSchedule}
                                    onChange={(e) => setNewDosageSchedule(e.target.value)}
                                    placeholder="Enter dosage schedule (e.g., Once Daily, Twice Daily)"
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateDosageSchedule()}
                                    className="border-slate-300"
                                />
                                <Button onClick={handleCreateDosageSchedule} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {dosageSchedules.map((schedule) => (
                                    <div key={schedule.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700">
                                        {schedule.name}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            </div>
        </div>
    );
};

export default MedicineMaster;
