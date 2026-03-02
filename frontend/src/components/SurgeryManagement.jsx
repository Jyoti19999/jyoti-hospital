import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Search, Scissors, Eye, Package, FileText, AlertTriangle, X, IndianRupee, Save, Loader2 } from "lucide-react";
import { surgeryService } from '@/services/surgeryService';
import fitnessInvestigationService from '@/services/fitnessInvestigationService';

const SurgeryManagement = () => {

    // State for surgery types
    const [surgeryTypes, setSurgeryTypes] = useState([]);
    const [surgeryPackages, setSurgeryPackages] = useState([]);
    const [fitnessInvestigations, setFitnessInvestigations] = useState([]);
    const [lenses, setLenses] = useState([]);
    
    // State for surgery types with investigations
    const [surgeryTypesWithInvestigations, setSurgeryTypesWithInvestigations] = useState([]);
    const [selectedSurgeryTypeForEdit, setSelectedSurgeryTypeForEdit] = useState(null);
    const [editInvestigationsDialog, setEditInvestigationsDialog] = useState(false);

    // State for loading and search
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSurgeryType, setSelectedSurgeryType] = useState(null);

    // State for pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // State for package pagination
    const [packagePagination, setPackagePagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // State for lens pagination
    const [lensPagination, setLensPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // State for search
    const [packageSearch, setPackageSearch] = useState('');
    const [lensSearch, setLensSearch] = useState('');

    // State for package analytics
    const [packageStats, setPackageStats] = useState({
        total: 0,
        active: 0,
        avgCost: 0,
        totalValue: 0
    });

    // State for forms
    const [surgeryTypeForm, setSurgeryTypeForm] = useState({
        name: '',
        description: '',
        category: '',
        isActive: true
    });

    const [surgeryPackageForm, setSurgeryPackageForm] = useState({
        surgeryTypeId: '',
        name: '',
        description: '',
        cost: '',
        lensId: ''
    });

    const [lensForm, setLensForm] = useState({
        name: '',
        description: '',
        cost: '',
        category: ''
    });

    // State for editing
    const [editingType, setEditingType] = useState(null);
    const [editingPackage, setEditingPackage] = useState(null);
    const [showTypeDialog, setShowTypeDialog] = useState(false);
    const [showPackageDialog, setShowPackageDialog] = useState(false);
    const [showLensDialog, setShowLensDialog] = useState(false);
    const [showInvestigationDialog, setShowInvestigationDialog] = useState(false);
    const [showAddInvestigationDialog, setShowAddInvestigationDialog] = useState(false);
    const [selectedSurgeryTypeForInvestigation, setSelectedSurgeryTypeForInvestigation] = useState(null);
    const [availableInvestigations, setAvailableInvestigations] = useState([]);
    const [selectedInvestigations, setSelectedInvestigations] = useState([]);

    // State for dropdown values to reset after selection
    const [dropdownValues, setDropdownValues] = useState({});

    // State for package breakdown
    const [showBreakdownDialog, setShowBreakdownDialog] = useState(false);
    const [breakdownPackage, setBreakdownPackage] = useState(null);
    const [breakdownItems, setBreakdownItems] = useState([]);
    const [savingBreakdown, setSavingBreakdown] = useState(false);

    // State for investigation form
    const [investigationForm, setInvestigationForm] = useState({
        investigationName: '',
        investigationCode: '',
        category: '',
        description: '',
        cost: '',
        validityDays: '',
        processingTime: '',
        fastingRequired: false
    });

    useEffect(() => {
        fetchAllData();
    }, [pagination.page, searchTerm]);

    useEffect(() => {
        fetchSurgeryPackages();
    }, [packagePagination.page]);

    useEffect(() => {
        fetchLenses();
    }, [lensPagination.page]);

    // Debounced search effect for packages
    useEffect(() => {
        const timer = setTimeout(() => {
            setPackagePagination(prev => ({ ...prev, page: 1 }));
            fetchSurgeryPackages();
        }, 300);

        return () => clearTimeout(timer);
    }, [packageSearch]);

    // Debounced search effect for lenses
    useEffect(() => {
        const timer = setTimeout(() => {
            setLensPagination(prev => ({ ...prev, page: 1 }));
            fetchLenses();
        }, 300);

        return () => clearTimeout(timer);
    }, [lensSearch]);

    const fetchAllData = async () => {
        await Promise.all([
            fetchSurgeryTypes(),
            fetchSurgeryPackages(),
            fetchFitnessInvestigations(),
            fetchSurgeryTypesWithInvestigations(),
            fetchLenses(),
            fetchAllLensesForDropdown()
        ]);
    };

    const fetchSurgeryTypes = async () => {
        try {
            setLoading(true);
            const data = await surgeryService.getSurgeryTypes(pagination.page, pagination.limit, searchTerm);
            setSurgeryTypes(Array.isArray(data.data) ? data.data : []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 0
            }));
        } catch (error) {
            setSurgeryTypes([]); // Ensure it's always an array
            toast.error(error.message || 'Error fetching surgery types');
        } finally {
            setLoading(false);
        }
    };

    const fetchSurgeryPackages = async () => {
        try {
            setLoading(true);
            const data = await surgeryService.getSurgeryPackages(
                packagePagination.page, 
                packagePagination.limit,
                packageSearch
            );
            setSurgeryPackages(Array.isArray(data.data) ? data.data : []);
            setPackagePagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                totalPages: data.pagination?.totalPages || 0
            }));
            
            // Set analytics data
            if (data.statistics) {
                const stats = data.statistics.packageStats;
                setPackageStats({
                    total: stats._count?.id || 0,
                    active: stats._count?.id || 0, // All returned packages are active due to filter
                    avgCost: Math.round(stats._avg?.packageCost || 0),
                    totalValue: Math.round((stats._avg?.packageCost || 0) * (stats._count?.id || 0))
                });
            }
        } catch (error) {
            setSurgeryPackages([]); // Ensure it's always an array
            toast.error(error.message || 'Error fetching surgery packages');
        } finally {
            setLoading(false);
        }
    };

    const fetchFitnessInvestigations = async () => {
        try {
            const response = await surgeryService.getFitnessInvestigations();
            if (response.success && Array.isArray(response.data)) {
                setFitnessInvestigations(response.data);
                setAvailableInvestigations(response.data);
            } else {
                setFitnessInvestigations([]);
                setAvailableInvestigations([]);
            }
        } catch (error) {
            setFitnessInvestigations([]);
            setAvailableInvestigations([]);
            toast.error(error.message || 'Error fetching fitness investigations');
        }
    };

    const fetchSurgeryTypesWithInvestigations = async () => {
        try {
            // Use the regular surgery types instead of limited ones
            const response = await surgeryService.getSurgeryTypes(1, 100); // Get all surgery types
            if (response.success && Array.isArray(response.data)) {
                setSurgeryTypesWithInvestigations(response.data);
            } else {
                setSurgeryTypesWithInvestigations([]);
            }
        } catch (error) {
            setSurgeryTypesWithInvestigations([]);
            toast.error(error.message || 'Error fetching surgery types with investigations');
        }
    };

    // const fetchSurgeryTypesWithInvestigations = async () => {
    //     try {
    //         const response = await surgeryService.getSurgeryTypesWithInvestigations({ limit: 100 });
    //         if (response.success && Array.isArray(response.data)) {
    //             setSurgeryTypesWithInvestigations(response.data);
    //         } else {
    //             setSurgeryTypesWithInvestigations([]);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching surgery types with investigations:', error);
    //         setSurgeryTypesWithInvestigations([]);
    //         toast.error(error.message || 'Error fetching surgery types with investigations');
    //     }
    // };

    const fetchLenses = async () => {
        try {
            console.log('🔍 Fetching lenses with pagination...', {
                page: lensPagination.page,
                limit: lensPagination.limit,
                search: lensSearch
            });
            setLoading(true);
            
            const data = await surgeryService.getLenses(
                lensPagination.page,
                lensPagination.limit,
                lensSearch
            );
            console.log('📋 Lens API response:', data);
            
            if (data.success && Array.isArray(data.data)) {
                setLenses(data.data);
                setLensPagination(prev => ({
                    ...prev,
                    total: data.pagination?.total || 0,
                    totalPages: data.pagination?.totalPages || 0
                }));
                console.log(`✅ Loaded ${data.data.length} lenses successfully (Page ${lensPagination.page})`);
            } else {
                console.warn('⚠️ Invalid lens data format:', data);
                setLenses([]);
                toast.warning('No lenses found or invalid data format');
            }
        } catch (error) {
            console.error('❌ Error fetching lenses:', error);
            setLenses([]);
            toast.error(error.message || 'Error fetching lenses');
        } finally {
            setLoading(false);
        }
    };

    // Separate state and function for lens dropdown in surgery package creation
    const [allLensesForDropdown, setAllLensesForDropdown] = useState([]);
    
    const fetchAllLensesForDropdown = async () => {
        try {
            console.log('🔍 Fetching all lenses for dropdown...');
            const data = await surgeryService.getAllLenses();
            console.log('📋 Dropdown lens API response:', data);
            
            if (data.success && Array.isArray(data.data)) {
                setAllLensesForDropdown(data.data);
                console.log(`✅ Loaded ${data.data.length} lenses for dropdown`);
            } else {
                console.warn('⚠️ Invalid dropdown lens data format:', data);
                setAllLensesForDropdown([]);
                toast.warning('No lenses found for dropdown');
            }
        } catch (error) {
            console.error('❌ Error fetching dropdown lenses:', error);
            setAllLensesForDropdown([]);
            toast.error(error.message || 'Error fetching lenses for dropdown');
        }
    };

    const handleCreateSurgeryType = async () => {
        try {
            await surgeryService.createSurgeryType(surgeryTypeForm);
            toast.success('Surgery type created successfully');
            setSurgeryTypeForm({ name: '', description: '', category: '', isActive: true });
            setShowTypeDialog(false);
            fetchSurgeryTypes();
        } catch (error) {
            toast.error(error.message || 'Error creating surgery type');
        }
    };

    const handleUpdateSurgeryType = async () => {
        try {
            await surgeryService.updateSurgeryType(editingType.id, surgeryTypeForm);
            toast.success('Surgery type updated successfully');
            setSurgeryTypeForm({ name: '', description: '', category: '', isActive: true });
            setEditingType(null);
            setShowTypeDialog(false);
            fetchSurgeryTypes();
        } catch (error) {
            toast.error(error.message || 'Error updating surgery type');
        }
    };

    const handleDeleteSurgeryType = async (id) => {
        if (!window.confirm('Are you sure you want to delete this surgery type?')) return;

        try {
            await surgeryService.deleteSurgeryType(id);
            toast.success('Surgery type deleted successfully');
            fetchSurgeryTypes();
        } catch (error) {
            toast.error(error.message || 'Error deleting surgery type');
        }
    };

    const handleSurgeryTypeTagging = async (packageId, surgeryTypeId) => {
        try {
            await surgeryService.updateSurgeryPackage(packageId, {
                surgeryTypeId: surgeryTypeId === 'untagged' ? null : surgeryTypeId
            });
            toast.success('Surgery type assignment updated successfully');
            fetchSurgeryPackages();
        } catch (error) {
            toast.error(error.message || 'Error updating surgery type assignment');
        }
    };

    const handleDeleteSurgeryPackage = async (packageId) => {
        if (!window.confirm('Are you sure you want to delete this surgery package? This action cannot be undone.')) {
            return;
        }

        try {
            await surgeryService.deleteSurgeryPackage(packageId);
            toast.success('Surgery package deleted successfully');
            fetchSurgeryPackages();
        } catch (error) {
            toast.error(error.message || 'Error deleting surgery package');
        }
    };

    const handleDeleteInvestigation = async (investigationId) => {
        if (!window.confirm('Are you sure you want to delete this fitness investigation? This action cannot be undone.')) {
            return;
        }

        try {
            await fitnessInvestigationService.deleteInvestigation(investigationId);
            toast.success('Fitness investigation deleted successfully');
            fetchFitnessInvestigations();
        } catch (error) {
            toast.error(error.message || 'Error deleting fitness investigation');
        }
    };

    // Helper function to get investigation name by ID
    const getInvestigationNameById = (investigationId) => {
        const investigation = fitnessInvestigations.find(inv => inv.id === investigationId);
        return investigation ? investigation.investigationName : 'Unknown Investigation';
    };

    // Handle adding investigation to surgery type
    const handleAddInvestigationToSurgeryType = async (surgeryTypeId, investigationId) => {
        try {
            
            const surgeryType = surgeryTypesWithInvestigations.find(st => st.id === surgeryTypeId);
            if (!surgeryType) {
                return;
            }

            const currentIds = surgeryType.investigationIds || [];
            
            if (currentIds.includes(investigationId)) {
                toast.error('Investigation already added to this surgery type');
                return;
            }

            const updatedIds = [...currentIds, investigationId];
            
            const response = await surgeryService.updateSurgeryType(surgeryTypeId, {
                investigationIds: updatedIds
            });
            
            toast.success('Investigation added successfully');
            
            // Reset dropdown value
            setDropdownValues(prev => ({ ...prev, [surgeryTypeId]: '' }));
            
            fetchSurgeryTypesWithInvestigations();
        } catch (error) {
            toast.error(error.message || 'Error adding investigation');
        }
    };

    // Handle removing investigation from surgery type
    const handleRemoveInvestigationFromSurgeryType = async (surgeryTypeId, investigationId) => {
        try {
            
            const surgeryType = surgeryTypesWithInvestigations.find(st => st.id === surgeryTypeId);
            if (!surgeryType) {
                return;
            }

            const currentIds = surgeryType.investigationIds || [];
            
            const updatedIds = currentIds.filter(id => id !== investigationId);
            
            const response = await surgeryService.updateSurgeryType(surgeryTypeId, {
                investigationIds: updatedIds
            });
            
            toast.success('Investigation removed successfully');
            fetchSurgeryTypesWithInvestigations();
        } catch (error) {
            toast.error(error.message || 'Error removing investigation');
        }
    };

    const handleCreateSurgeryPackage = async () => {
        try {
            // Validate form
            if (!surgeryPackageForm.name || !surgeryPackageForm.cost) {
                toast.error('Package name and cost are required');
                return;
            }

            if (isNaN(parseFloat(surgeryPackageForm.cost))) {
                toast.error('Please enter a valid cost');
                return;
            }

            await surgeryService.createSurgeryPackage({
                surgeryTypeId: surgeryPackageForm.surgeryTypeId,
                packageName: surgeryPackageForm.name,
                description: surgeryPackageForm.description,
                packageCost: parseFloat(surgeryPackageForm.cost) || 0,
                defaultLensId: surgeryPackageForm.lensId || null
            });
            toast.success('Surgery package created successfully');
            setSurgeryPackageForm({ surgeryTypeId: '', name: '', description: '', cost: '', lensId: '' });
            setShowPackageDialog(false);
            fetchSurgeryPackages();
        } catch (error) {
            toast.error(error.message || 'Error creating surgery package');
        }
    };

    const handleCreateLens = async () => {
        try {
            await surgeryService.createLens({
                ...lensForm,
                cost: parseFloat(lensForm.cost)
            });
            toast.success('Lens created successfully');
            setLensForm({ name: '', description: '', cost: '', category: '' });
            setShowLensDialog(false);
            fetchLenses();
        } catch (error) {
            toast.error(error.message || 'Error creating lens');
        }
    };

    const handleCreateInvestigation = async () => {
        try {
            const investigationData = {
                ...investigationForm,
                cost: parseFloat(investigationForm.cost),
                validityDays: investigationForm.validityDays ? parseInt(investigationForm.validityDays) : null
            };

            let response;
            if (investigationForm.id) {
                // Update existing investigation
                response = await fitnessInvestigationService.updateInvestigation(investigationForm.id, investigationData);
                toast.success('Investigation updated successfully');
            } else {
                // Create new investigation
                response = await fitnessInvestigationService.createInvestigation(investigationData);
                toast.success('Investigation created successfully');
            }
            
            if (response.success) {
                setInvestigationForm({
                    investigationName: '',
                    investigationCode: '',
                    category: '',
                    description: '',
                    cost: '',
                    validityDays: '',
                    processingTime: '',
                    fastingRequired: false
                });
                setShowInvestigationDialog(false);
                await fetchFitnessInvestigations();
            } else {
                toast.error(response.message || 'Failed to save investigation');
            }
        } catch (error) {
            toast.error(error.message || 'Error saving investigation');
        }
    };

    const handleAddInvestigationsToSurgeryType = async () => {
        try {
            if (selectedInvestigations.length === 0) {
                toast.error('Please select at least one investigation');
                return;
            }

            const response = await surgeryService.assignInvestigationsToSurgeryType(
                selectedSurgeryTypeForInvestigation.id,
                selectedInvestigations
            );

            if (response.success) {
                toast.success('Investigations added to surgery type successfully');
                setShowAddInvestigationDialog(false);
                setSelectedInvestigations([]);
                setSelectedSurgeryTypeForInvestigation(null);
                await fetchSurgeryTypes();
            } else {
                toast.error(response.message || 'Failed to add investigations');
            }
        } catch (error) {
            toast.error(error.message || 'Error adding investigations');
        }
    };

    const openAddInvestigationsDialog = async (surgeryType) => {
        setSelectedSurgeryTypeForInvestigation(surgeryType);
        
        // For now, we'll use all available investigations
        // In the future, we could filter out already assigned ones
        try {
            const response = await fitnessInvestigationService.getAllInvestigations({ limit: 100 });
            if (response.success && Array.isArray(response.data)) {
                setAvailableInvestigations(response.data);
                setShowAddInvestigationDialog(true);
            } else {
                toast.error('Failed to fetch available investigations');
            }
        } catch (error) {
            toast.error('Error fetching available investigations');
        }
    };

    // Surgery Type Investigations Management Functions
    const openEditInvestigationsDialog = async (surgeryType) => {
        setSelectedSurgeryTypeForEdit(surgeryType);
        
        // Get current investigations for this surgery type
        const currentInvestigationIds = surgeryType.fitnessInvestigations?.map(req => req.investigationId) || [];
        setSelectedInvestigations(currentInvestigationIds);
        
        // Get all available investigations
        try {
            const response = await fitnessInvestigationService.getAllInvestigations({ limit: 100 });
            if (response.success && Array.isArray(response.data)) {
                setAvailableInvestigations(response.data);
                setEditInvestigationsDialog(true);
            } else {
                toast.error('Failed to fetch available investigations');
            }
        } catch (error) {
            toast.error('Error fetching available investigations');
        }
    };

    const handleUpdateSurgeryTypeInvestigations = async () => {
        try {
            if (!selectedSurgeryTypeForEdit) return;

            const response = await surgeryService.assignInvestigationsToSurgeryType(
                selectedSurgeryTypeForEdit.id,
                selectedInvestigations
            );

            if (response.success) {
                toast.success('Surgery type investigations updated successfully');
                setEditInvestigationsDialog(false);
                setSelectedInvestigations([]);
                setSelectedSurgeryTypeForEdit(null);
                await fetchSurgeryTypesWithInvestigations();
            } else {
                toast.error(response.message || 'Failed to update investigations');
            }
        } catch (error) {
            toast.error(error.message || 'Error updating investigations');
        }
    };

    // ===== Package Breakdown Handlers =====
    const openBreakdownDialog = (pkg) => {
        setBreakdownPackage(pkg);
        const existing = Array.isArray(pkg.packageBreakdown) ? pkg.packageBreakdown : [];
        setBreakdownItems(existing.map((item, idx) => ({ ...item, _key: idx })));
        setShowBreakdownDialog(true);
    };

    const addBreakdownItem = () => {
        setBreakdownItems(prev => [...prev, { _key: Date.now(), name: '', rate: 0, unit: 1, amount: 0 }]);
    };

    const updateBreakdownItem = (key, field, value) => {
        setBreakdownItems(prev => prev.map(item => {
            if (item._key !== key) return item;
            const updated = { ...item, [field]: value };
            if (field === 'rate' || field === 'unit') {
                updated.amount = (parseFloat(updated.rate) || 0) * (parseInt(updated.unit) || 1);
            }
            return updated;
        }));
    };

    const deleteBreakdownItem = (key) => {
        setBreakdownItems(prev => prev.filter(item => item._key !== key));
    };

    const saveBreakdown = async () => {
        if (!breakdownPackage) return;
        setSavingBreakdown(true);
        try {
            const cleanItems = breakdownItems.map(({ _key, ...rest }) => ({
                name: rest.name,
                rate: parseFloat(rest.rate) || 0,
                unit: parseInt(rest.unit) || 1,
                amount: parseFloat(rest.amount) || 0
            }));
            await surgeryService.updatePackageBreakdown(breakdownPackage.id, cleanItems);
            toast.success('Package breakdown saved successfully');
            setShowBreakdownDialog(false);
            fetchSurgeryPackages();
        } catch (error) {
            toast.error(error.message || 'Failed to save breakdown');
        } finally {
            setSavingBreakdown(false);
        }
    };

    const openEditSurgeryType = (surgeryType) => {
        setEditingType(surgeryType);
        setSurgeryTypeForm({
            name: surgeryType.name,
            description: surgeryType.description || '',
            category: surgeryType.category,
            isActive: surgeryType.isActive
        });
        setShowTypeDialog(true);
    };

    const openCreateSurgeryType = () => {
        setEditingType(null);
        setSurgeryTypeForm({ name: '', description: '', category: '', isActive: true });
        setShowTypeDialog(true);
    };

    const openCreateSurgeryPackage = () => {
        setSurgeryPackageForm({ surgeryTypeId: '', name: '', description: '', cost: '', lensId: '' });
        setShowPackageDialog(true);
    };

    const openCreateLens = () => {
        setLensForm({ name: '', description: '', cost: '', category: '' });
        setShowLensDialog(true);
    };

    const openCreateInvestigation = () => {
        setInvestigationForm({
            investigationName: '',
            investigationCode: '',
            category: '',
            description: '',
            cost: '',
            validityDays: '',
            processingTime: '',
            fastingRequired: false
        });
        setShowInvestigationDialog(true);
    };

    const openEditInvestigation = (investigation) => {
        setInvestigationForm({
            id: investigation.id,
            investigationName: investigation.investigationName || '',
            investigationCode: investigation.investigationCode || '',
            category: investigation.category || '',
            description: investigation.description || '',
            cost: investigation.cost ? investigation.cost.toString() : '',
            validityDays: investigation.validityDays ? investigation.validityDays.toString() : '',
            processingTime: investigation.processingTime || '',
            fastingRequired: investigation.fastingRequired || false
        });
        setShowInvestigationDialog(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Surgery Management</h1>
                        <p className="text-gray-600 mt-1">Manage surgery types, packages, and fitness investigations</p>
                    </div>
                </div>

                <Tabs defaultValue="surgery-types" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-lg shadow-md border mb-6">
                        <TabsTrigger value="surgery-types" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                            <Scissors className="h-4 w-4" />
                            <span>Surgery Types</span>
                        </TabsTrigger>
                        <TabsTrigger value="surgery-packages" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                            <Package className="h-4 w-4" />
                            <span>Surgery Packages</span>
                        </TabsTrigger>
                        <TabsTrigger value="fitness-investigations" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                            <FileText className="h-4 w-4" />
                            <span>Fitness Investigations</span>
                        </TabsTrigger>
                        <TabsTrigger value="lenses" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                            <Eye className="h-4 w-4" />
                            <span>Lenses</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Surgery Types Tab */}
                    <TabsContent value="surgery-types" className="space-y-6">
                        <Card className="shadow-sm border-0">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                        <Scissors className="h-5 w-5 text-blue-600" />
                                        <span>Surgery Types Management</span>
                                    </CardTitle>
                                    <Button onClick={openCreateSurgeryType} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                                        <Plus className="h-4 w-4" />
                                        <span>Add Surgery Type</span>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search surgery types..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 border-gray-300"
                                        />
                                    </div>
                            </div>

                            <div className="rounded-md border border-slate-200">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-slate-700">Name</TableHead>
                                            <TableHead className="text-slate-700">Category</TableHead>
                                            <TableHead className="text-slate-700">Status</TableHead>
                                            <TableHead className="text-right text-slate-700">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-6 text-slate-600">
                                                    Loading surgery types...
                                                </TableCell>
                                            </TableRow>
                                        ) : surgeryTypes.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-6 text-slate-500">
                                                    No surgery types found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            surgeryTypes.map((surgeryType) => (
                                                <TableRow key={surgeryType.id} className="hover:bg-slate-50">
                                                    <TableCell className="font-medium text-slate-800">{surgeryType.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="border-blue-200 text-blue-700">{surgeryType.category}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={surgeryType.isActive ? "default" : "secondary"} className={surgeryType.isActive ? "bg-green-100 text-green-700" : ""}>
                                                            {surgeryType.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openEditSurgeryType(surgeryType)}
                                                                title="Edit Surgery Type"
                                                                className="border-slate-300 hover:bg-slate-50"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDeleteSurgeryType(surgeryType.id)}
                                                                className="text-red-600 hover:text-red-700 border-slate-300 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-sm text-slate-700">
                                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                            disabled={pagination.page === 1}
                                            className="border-slate-300 hover:bg-slate-50"
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm text-slate-700">
                                            Page {pagination.page} of {pagination.totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                            disabled={pagination.page === pagination.totalPages}
                                            className="border-slate-300 hover:bg-slate-50"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Surgery Packages Tab */}
                <TabsContent value="surgery-packages" className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-slate-800">
                                    <Package className="h-5 w-5 text-blue-600" />
                                    <span>Surgery Packages</span>
                                </CardTitle>
                                <Button onClick={openCreateSurgeryPackage} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4" />
                                    <span>Add Surgery Package</span>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <>
                                {/* Analytics Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-600">Total Packages</p>
                                            <p className="text-2xl font-bold text-blue-900">{packageStats.total}</p>
                                        </div>
                                        <Package className="h-8 w-8 text-blue-500" />
                                    </div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-green-600">Active Packages</p>
                                            <p className="text-2xl font-bold text-green-900">{packageStats.active}</p>
                                        </div>
                                        <Eye className="h-8 w-8 text-green-500" />
                                    </div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-purple-600">Avg. Cost</p>
                                            <p className="text-2xl font-bold text-purple-900">₹{packageStats.avgCost?.toLocaleString()}</p>
                                        </div>
                                        <FileText className="h-8 w-8 text-purple-500" />
                                    </div>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-orange-600">Total Value</p>
                                            <p className="text-2xl font-bold text-orange-900">₹{packageStats.totalValue?.toLocaleString()}</p>
                                        </div>
                                        <Scissors className="h-8 w-8 text-orange-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Search Bar */}
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search packages by name, cost, or surgery type..."
                                        value={packageSearch}
                                        onChange={(e) => setPackageSearch(e.target.value)}
                                        className="pl-8 pr-8"
                                    />
                                    {packageSearch && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-1 top-1 h-6 w-6 p-0"
                                            onClick={() => setPackageSearch('')}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Package Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Cost</TableHead>
                                            <TableHead>Surgery Type</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-6">
                                                    Loading surgery packages...
                                                </TableCell>
                                            </TableRow>
                                        ) : (!Array.isArray(surgeryPackages) || surgeryPackages.length === 0) ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                                                    No surgery packages found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            surgeryPackages.map((pkg) => (
                                                <TableRow key={pkg.id}>
                                                    <TableCell className="font-medium">{pkg.packageName || pkg.name}</TableCell>
                                                    <TableCell>
                                                        {pkg.surgeryCategory ? (
                                                            <Badge variant="outline" className="text-xs">
                                                                {pkg.surgeryCategory}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-gray-400 text-sm">No Category</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>₹{pkg.packageCost?.toLocaleString() || pkg.cost?.toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        {Array.isArray(surgeryTypes) && surgeryTypes.length > 0 ? (
                                                            <Select 
                                                                value={pkg.surgeryTypeId || 'untagged'} 
                                                                onValueChange={(value) => handleSurgeryTypeTagging(pkg.id, value)}
                                                            >
                                                                <SelectTrigger className="w-48">
                                                                    <SelectValue placeholder={pkg.surgeryType?.name || "Not Tagged"} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="untagged">Not Tagged</SelectItem>
                                                                    {Array.isArray(surgeryTypes) && surgeryTypes.map((type) => (
                                                                        <SelectItem key={type.id} value={type.id}>
                                                                            {type.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <span className="text-gray-500">
                                                                {pkg.surgeryType?.name || "Not Tagged"}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openBreakdownDialog(pkg)}
                                                                className="text-blue-600 hover:text-blue-700"
                                                                title="Manage Breakdown"
                                                            >
                                                                <IndianRupee className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteSurgeryPackage(pkg.id)}
                                                                className="text-red-600 hover:text-red-700"
                                                                title="Delete Package"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {packagePagination.totalPages > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Showing {((packagePagination.page - 1) * packagePagination.limit) + 1} to {Math.min(packagePagination.page * packagePagination.limit, packagePagination.total)} of {packagePagination.total} results
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPackagePagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                            disabled={packagePagination.page === 1}
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm text-gray-700">
                                            Page {packagePagination.page} of {packagePagination.totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPackagePagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                            disabled={packagePagination.page === packagePagination.totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                            </>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Fitness Investigations Tab */}
                <TabsContent value="fitness-investigations" className="space-y-6">
                    <Tabs defaultValue="investigations" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="investigations">Investigations</TabsTrigger>
                            <TabsTrigger value="surgery-investigations">Surgery Type Investigations</TabsTrigger>
                        </TabsList>

                        {/* Investigations Sub-tab */}
                        <TabsContent value="investigations">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center space-x-2">
                                            <FileText className="h-5 w-5" />
                                            <span>Fitness Investigations</span>
                                        </CardTitle>
                                        <Button
                                            onClick={openCreateInvestigation}
                                            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>Add Investigation</span>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Investigation Name</TableHead>
                                                    <TableHead>Category</TableHead>
                                                    <TableHead>Cost</TableHead>
                                                    <TableHead>Required For Surgeries</TableHead>
                                                    <TableHead className="w-24">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(!Array.isArray(fitnessInvestigations) || fitnessInvestigations.length === 0) ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                                                            No fitness investigations found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    fitnessInvestigations.map((investigation) => (
                                                        <TableRow key={investigation.id}>
                                                            <TableCell className="font-medium">{investigation.investigationName}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">{investigation.category || 'General'}</Badge>
                                                            </TableCell>
                                                            <TableCell>₹{investigation.cost?.toLocaleString()}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline">
                                                                    {investigation._count?.surgeryTypes || 0} surgeries
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center space-x-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => openEditInvestigation(investigation)}
                                                                        className="flex items-center space-x-1"
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                        <span>Edit</span>
                                                                    </Button>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteInvestigation(investigation.id)}
                                                                        className="flex items-center space-x-1"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                        <span>Delete</span>
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Surgery Type Investigations Sub-tab */}
                        <TabsContent value="surgery-investigations">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Scissors className="h-5 w-5" />
                                        <span>Surgery Type Investigations</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12">Sr No</TableHead>
                                                    <TableHead>Surgery Name</TableHead>
                                                    <TableHead>Required Investigations</TableHead>
                                                    <TableHead className="w-24">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(!Array.isArray(surgeryTypesWithInvestigations) || surgeryTypesWithInvestigations.length === 0) ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                                                            No surgery types found
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    surgeryTypesWithInvestigations.map((surgeryType, index) => (
                                                        <TableRow key={surgeryType.id}>
                                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                                            <TableCell className="font-medium">{surgeryType.name}</TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {(surgeryType.investigationIds && surgeryType.investigationIds.length > 0) ? (
                                                                        surgeryType.investigationIds.map((investigationId) => (
                                                                            <div key={investigationId} className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-md px-2 py-1 mr-1 mb-1">
                                                                                <Badge variant="secondary" className="text-xs bg-transparent border-0 p-0 mr-2">
                                                                                    {getInvestigationNameById(investigationId)}
                                                                                </Badge>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="h-4 w-4 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full"
                                                                                    onClick={() => handleRemoveInvestigationFromSurgeryType(surgeryType.id, investigationId)}
                                                                                    title="Remove Investigation"
                                                                                >
                                                                                    <X className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-gray-500 text-sm">No investigations assigned</span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center space-x-2">
                                                                    {(() => {
                                                                        const availableInvestigations = fitnessInvestigations.filter(investigation => !(surgeryType.investigationIds || []).includes(investigation.id));
                                                                        return (
                                                                            <Select 
                                                                                value={dropdownValues[surgeryType.id] || ""}
                                                                                onValueChange={(investigationId) => {
                                                                                    setDropdownValues(prev => ({ ...prev, [surgeryType.id]: investigationId }));
                                                                                    handleAddInvestigationToSurgeryType(surgeryType.id, investigationId);
                                                                                }}
                                                                                disabled={availableInvestigations.length === 0}
                                                                            >
                                                                                <SelectTrigger className={`w-40 ${availableInvestigations.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                                                                                    <SelectValue placeholder={availableInvestigations.length === 0 ? "All Added" : "Add Investigation"} />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {availableInvestigations.map((investigation) => (
                                                                                        <SelectItem key={investigation.id} value={investigation.id}>
                                                                                            {investigation.investigationName}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        );
                                                                    })()}
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => openEditInvestigationsDialog(surgeryType)}
                                                                        className="flex items-center space-x-1"
                                                                    >
                                                                        <Edit className="h-3 w-3" />
                                                                        <span>Edit</span>
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* Lenses Tab */}
                <TabsContent value="lenses" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center space-x-2">
                                    <Eye className="h-5 w-5" />
                                    <span>Lens Management</span>
                                </CardTitle>
                                <Button
                                    onClick={openCreateLens}
                                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Add Lens</span>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Search and Filters */}
                            <div className="mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search lenses by name, manufacturer, or code..."
                                        value={lensSearch}
                                        onChange={(e) => setLensSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                {lensSearch && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setLensSearch('')}
                                        className="flex items-center gap-1"
                                    >
                                        <X className="h-3 w-3" />
                                        Clear
                                    </Button>
                                )}
                            </div>

                            {/* Loading State */}
                            {loading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <span className="ml-2 text-gray-600">Loading lenses...</span>
                                </div>
                            ) : (
                            <>
                                {/* Lenses Table */}
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Lens Name</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Manufacturer</TableHead>
                                                <TableHead>Cost</TableHead>
                                                <TableHead>Used in Packages</TableHead>
                                                <TableHead>Stock</TableHead>
                                                <TableHead className="text-center">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(!Array.isArray(lenses) || lenses.length === 0) ? (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                                                        {lensSearch ? 'No lenses found matching your search' : 'No lenses found'}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                lenses.map((lens) => (
                                                    <TableRow key={lens.id}>
                                                        <TableCell className="font-medium">
                                                            <div>
                                                                <div className="font-semibold">{lens.lensName}</div>
                                                                {lens.lensCode && (
                                                                    <div className="text-xs text-gray-500">{lens.lensCode}</div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="capitalize">
                                                                {lens.lensCategory?.toLowerCase()}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="capitalize">
                                                                {lens.lensType?.toLowerCase()}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{lens.manufacturer || '-'}</TableCell>
                                                        <TableCell className="font-medium">
                                                            ₹{lens.lensoCost?.toLocaleString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {lens._count?.defaultForPackages || 0} packages
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <span className={`inline-block w-2 h-2 rounded-full ${
                                                                    (lens.stockQuantity || 0) > 0 ? 'bg-green-500' : 'bg-red-500'
                                                                }`}></span>
                                                                <span className="text-sm">
                                                                    {lens.stockQuantity || 0}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border-slate-300 hover:bg-slate-50"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-red-600 hover:text-red-700 border-slate-300 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {lensPagination.totalPages > 1 && (
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="text-sm text-slate-700">
                                            Showing {((lensPagination.page - 1) * lensPagination.limit) + 1} to {Math.min(lensPagination.page * lensPagination.limit, lensPagination.total)} of {lensPagination.total} results
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setLensPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                                disabled={lensPagination.page === 1}
                                                className="border-slate-300 hover:bg-slate-50"
                                            >
                                                Previous
                                            </Button>
                                            <span className="text-sm text-slate-700">
                                                Page {lensPagination.page} of {lensPagination.totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setLensPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                                disabled={lensPagination.page === lensPagination.totalPages}
                                                className="border-slate-300 hover:bg-slate-50"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Surgery Type Dialog */}
            <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingType ? 'Edit Surgery Type' : 'Create New Surgery Type'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Surgery Type Name*</Label>
                            <Input
                                id="name"
                                value={surgeryTypeForm.name}
                                onChange={(e) => setSurgeryTypeForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter surgery type name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category*</Label>
                            <Select
                                value={surgeryTypeForm.category}
                                onValueChange={(value) => setSurgeryTypeForm(prev => ({ ...prev, category: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CATARACT">Cataract</SelectItem>
                                    <SelectItem value="RETINAL">Retinal</SelectItem>
                                    <SelectItem value="GLAUCOMA">Glaucoma</SelectItem>
                                    <SelectItem value="CORNEAL">Corneal</SelectItem>
                                    <SelectItem value="OCULOPLASTIC">Oculoplastic</SelectItem>
                                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={surgeryTypeForm.description}
                                onChange={(e) => setSurgeryTypeForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter surgery type description"
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={surgeryTypeForm.isActive}
                                onChange={(e) => setSurgeryTypeForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                className="rounded"
                            />
                            <Label htmlFor="isActive">Active</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTypeDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={editingType ? handleUpdateSurgeryType : handleCreateSurgeryType}>
                            {editingType ? 'Update' : 'Create'} Surgery Type
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Surgery Package Dialog */}
            <Dialog open={showPackageDialog} onOpenChange={setShowPackageDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create New Surgery Package</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="surgeryTypeId">Surgery Type*</Label>
                            <Select
                                value={surgeryPackageForm.surgeryTypeId}
                                onValueChange={(value) => setSurgeryPackageForm(prev => ({ ...prev, surgeryTypeId: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select surgery type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.isArray(surgeryTypes) && surgeryTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="packageName">Package Name*</Label>
                            <Input
                                id="packageName"
                                value={surgeryPackageForm.name}
                                onChange={(e) => setSurgeryPackageForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter package name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cost">Cost*</Label>
                            <Input
                                id="cost"
                                type="number"
                                value={surgeryPackageForm.cost}
                                onChange={(e) => setSurgeryPackageForm(prev => ({ ...prev, cost: e.target.value }))}
                                placeholder="Enter cost"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lensId">Lens (Optional)</Label>
                            <Select
                                value={surgeryPackageForm.lensId}
                                onValueChange={(value) => setSurgeryPackageForm(prev => ({ ...prev, lensId: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={`Select lens (${allLensesForDropdown.length} available)`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.isArray(allLensesForDropdown) && allLensesForDropdown.length > 0 ? (
                                        allLensesForDropdown.map((lens) => (
                                            <SelectItem key={lens.id} value={lens.id}>
                                                {lens.lensName} ({lens.manufacturer}) - ₹{lens.lensoCost?.toLocaleString()}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no-lenses" disabled>
                                            No lenses available. Please add lenses first.
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            {allLensesForDropdown.length === 0 && (
                                <p className="text-sm text-orange-600">
                                    ⚠️ No lenses loaded. Please refresh the page or contact administrator.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="packageDescription">Description</Label>
                            <Textarea
                                id="packageDescription"
                                value={surgeryPackageForm.description}
                                onChange={(e) => setSurgeryPackageForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter package description"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPackageDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateSurgeryPackage}>
                            Create Surgery Package
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lens Dialog */}
            <Dialog open={showLensDialog} onOpenChange={setShowLensDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Create New Lens</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="lensName">Lens Name*</Label>
                            <Input
                                id="lensName"
                                value={lensForm.name}
                                onChange={(e) => setLensForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter lens name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lensCategory">Category*</Label>
                            <Select
                                value={lensForm.category}
                                onValueChange={(value) => setLensForm(prev => ({ ...prev, category: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select lens category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MONOFOCAL">Monofocal</SelectItem>
                                    <SelectItem value="MULTIFOCAL">Multifocal</SelectItem>
                                    <SelectItem value="TORIC">Toric</SelectItem>
                                    <SelectItem value="EXTENDED_DEPTH_FOCUS">Extended Depth of Focus</SelectItem>
                                    <SelectItem value="ACCOMMODATING">Accommodating</SelectItem>
                                    <SelectItem value="LIGHT_ADJUSTABLE">Light Adjustable</SelectItem>
                                    <SelectItem value="CUSTOM">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lensCost">Cost*</Label>
                            <Input
                                id="lensCost"
                                type="number"
                                value={lensForm.cost}
                                onChange={(e) => setLensForm(prev => ({ ...prev, cost: e.target.value }))}
                                placeholder="Enter lens cost"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lensDescription">Description</Label>
                            <Textarea
                                id="lensDescription"
                                value={lensForm.description}
                                onChange={(e) => setLensForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter lens description"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowLensDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateLens}>
                            Create Lens
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Investigation Dialog */}
            <Dialog open={showInvestigationDialog} onOpenChange={setShowInvestigationDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {investigationForm.id ? 'Edit Investigation' : 'Create New Investigation'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="investigationName">Investigation Name*</Label>
                                <Input
                                    id="investigationName"
                                    value={investigationForm.investigationName}
                                    onChange={(e) => setInvestigationForm(prev => ({ ...prev, investigationName: e.target.value }))}
                                    placeholder="e.g., Complete Blood Count"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="investigationCode">Investigation Code</Label>
                                <Input
                                    id="investigationCode"
                                    value={investigationForm.investigationCode}
                                    onChange={(e) => setInvestigationForm(prev => ({ ...prev, investigationCode: e.target.value }))}
                                    placeholder="e.g., CBC001"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="investigationCategory">Category</Label>
                                <Select
                                    value={investigationForm.category}
                                    onValueChange={(value) => setInvestigationForm(prev => ({ ...prev, category: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Blood Test">Blood Test</SelectItem>
                                        <SelectItem value="Imaging">Imaging</SelectItem>
                                        <SelectItem value="Cardiac">Cardiac</SelectItem>
                                        <SelectItem value="Respiratory">Respiratory</SelectItem>
                                        <SelectItem value="Renal">Renal</SelectItem>
                                        <SelectItem value="Hepatic">Hepatic</SelectItem>
                                        <SelectItem value="Endocrine">Endocrine</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="investigationCost">Cost*</Label>
                                <Input
                                    id="investigationCost"
                                    type="number"
                                    value={investigationForm.cost}
                                    onChange={(e) => setInvestigationForm(prev => ({ ...prev, cost: e.target.value }))}
                                    placeholder="Enter cost"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="validityDays">Validity (Days)</Label>
                                <Input
                                    id="validityDays"
                                    type="number"
                                    value={investigationForm.validityDays}
                                    onChange={(e) => setInvestigationForm(prev => ({ ...prev, validityDays: e.target.value }))}
                                    placeholder="e.g., 7 for CBC, 90 for HIV"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="processingTime">Processing Time</Label>
                                <Input
                                    id="processingTime"
                                    value={investigationForm.processingTime}
                                    onChange={(e) => setInvestigationForm(prev => ({ ...prev, processingTime: e.target.value }))}
                                    placeholder="e.g., 2-4 hours, Same day"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="investigationDescription">Description</Label>
                            <Textarea
                                id="investigationDescription"
                                value={investigationForm.description}
                                onChange={(e) => setInvestigationForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Enter investigation description"
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="fastingRequired"
                                checked={investigationForm.fastingRequired}
                                onChange={(e) => setInvestigationForm(prev => ({ ...prev, fastingRequired: e.target.checked }))}
                                className="rounded"
                            />
                            <Label htmlFor="fastingRequired">Fasting Required</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowInvestigationDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateInvestigation}>
                            {investigationForm.id ? 'Update Investigation' : 'Create Investigation'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Investigations to Surgery Type Dialog */}
            <Dialog open={showAddInvestigationDialog} onOpenChange={setShowAddInvestigationDialog}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            Add Investigations to {selectedSurgeryTypeForInvestigation?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Investigations to Add:</Label>
                            <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                                {availableInvestigations.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No investigations available to add</p>
                                ) : (
                                    availableInvestigations.map((investigation) => (
                                        <div key={investigation.id} className="flex items-center space-x-2 py-2">
                                            <input
                                                type="checkbox"
                                                id={`investigation-${investigation.id}`}
                                                checked={selectedInvestigations.includes(investigation.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedInvestigations(prev => [...prev, investigation.id]);
                                                    } else {
                                                        setSelectedInvestigations(prev => prev.filter(id => id !== investigation.id));
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <Label htmlFor={`investigation-${investigation.id}`} className="flex-1 cursor-pointer">
                                                <div>
                                                    <span className="font-medium">{investigation.investigationName}</span>
                                                    <span className="text-sm text-gray-500 ml-2">
                                                        ({investigation.category}) - ₹{investigation.cost}
                                                    </span>
                                                </div>
                                            </Label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddInvestigationDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddInvestigationsToSurgeryType} disabled={selectedInvestigations.length === 0}>
                            Add Selected Investigations
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Surgery Type Investigations Dialog */}
            <Dialog open={editInvestigationsDialog} onOpenChange={setEditInvestigationsDialog}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Manage Investigations for {selectedSurgeryTypeForEdit?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="text-sm text-gray-600">
                            Select the investigations required for this surgery type:
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                            {availableInvestigations.map((investigation) => (
                                <div key={investigation.id} className="flex items-start space-x-3 p-2 border rounded-lg hover:bg-gray-50">
                                    <Checkbox
                                        id={`investigation-${investigation.id}`}
                                        checked={selectedInvestigations.includes(investigation.id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedInvestigations([...selectedInvestigations, investigation.id]);
                                            } else {
                                                setSelectedInvestigations(selectedInvestigations.filter(id => id !== investigation.id));
                                            }
                                        }}
                                    />
                                    <div className="flex-1">
                                        <label
                                            htmlFor={`investigation-${investigation.id}`}
                                            className="text-sm font-medium cursor-pointer"
                                        >
                                            {investigation.investigationName}
                                        </label>
                                        {investigation.investigationCode && (
                                            <p className="text-xs text-gray-500">Code: {investigation.investigationCode}</p>
                                        )}
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                {investigation.category || 'General'}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                                                ₹{investigation.cost?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Selected Investigations ({selectedInvestigations.length}):</h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedInvestigations.length === 0 ? (
                                    <span className="text-gray-500 text-sm">No investigations selected</span>
                                ) : (
                                    availableInvestigations
                                        .filter(inv => selectedInvestigations.includes(inv.id))
                                        .map(investigation => (
                                            <Badge key={investigation.id} variant="secondary">
                                                {investigation.investigationName}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditInvestigationsDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateSurgeryTypeInvestigations}>
                            Update Investigations
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Package Breakdown Dialog */}
            <Dialog open={showBreakdownDialog} onOpenChange={setShowBreakdownDialog}>
                <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <IndianRupee className="h-5 w-5" />
                            Billing Breakdown — {breakdownPackage?.packageName}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                {breakdownItems.length} item{breakdownItems.length !== 1 ? 's' : ''} · Total: ₹{breakdownItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-muted-foreground">
                                Package Cost: ₹{breakdownPackage?.packageCost?.toLocaleString('en-IN')}
                            </span>
                        </div>

                        {/* Items Table */}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40%]">Name</TableHead>
                                        <TableHead className="w-[18%]">Rate (₹)</TableHead>
                                        <TableHead className="w-[12%]">Unit</TableHead>
                                        <TableHead className="w-[18%]">Amount (₹)</TableHead>
                                        <TableHead className="w-[12%] text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {breakdownItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                                                No breakdown items yet. Click "Add Item" to start.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        breakdownItems.map((item) => (
                                            <TableRow key={item._key}>
                                                <TableCell>
                                                    <Input
                                                        value={item.name}
                                                        onChange={(e) => updateBreakdownItem(item._key, 'name', e.target.value)}
                                                        placeholder="Charge name"
                                                        className="h-8 text-sm"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={item.rate}
                                                        onChange={(e) => updateBreakdownItem(item._key, 'rate', e.target.value)}
                                                        className="h-8 text-sm"
                                                        min="0"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={item.unit}
                                                        onChange={(e) => updateBreakdownItem(item._key, 'unit', e.target.value)}
                                                        className="h-8 text-sm"
                                                        min="1"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm font-medium">₹{(parseFloat(item.amount) || 0).toLocaleString('en-IN')}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteBreakdownItem(item._key)}
                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addBreakdownItem}
                            className="w-full border-dashed"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Item
                        </Button>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowBreakdownDialog(false)}>Cancel</Button>
                        <Button onClick={saveBreakdown} disabled={savingBreakdown}>
                            {savingBreakdown ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                            {savingBreakdown ? 'Saving...' : 'Save Breakdown'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            </div>
        </div>
    );
};

export { SurgeryManagement };
export default SurgeryManagement;