import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  Database,
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';

const DiagnosisMaster = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [statistics, setStatistics] = useState(null);
  const [diagnosisData, setDiagnosisData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetchedDiseases, setFetchedDiseases] = useState([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [newDisease, setNewDisease] = useState({
    code: '',
    title: '',
    category: '',
    description: '',
    symptoms: '',
    urgency: 'Routine',
    requiresSurgery: false
  });
  const [editDisease, setEditDisease] = useState({
    code: '',
    title: '',
    category: '',
    description: '',
    symptoms: '',
    urgency: 'Routine',
    requiresSurgery: false
  });

  const { toast } = useToast();

  // Fetch statistics on component mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Fetch diagnosis data when filters change
  useEffect(() => {
    fetchDiagnosisData();
  }, [searchTerm, selectedCategory, currentPage]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/diagnosis-master/statistics`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data.data);
      }
    } catch (error) {
    }
  };

  const fetchDiagnosisData = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm || '',
        category: selectedCategory === 'all' ? '' : selectedCategory
      });


      const response = await fetch(`${import.meta.env.VITE_API_URL}/diagnosis-master/diagnosis-master?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();

        setDiagnosisData(data.data.icdCodes || []);
        setCategories(data.data.categories || []);
        setTotalPages(data.data.pagination?.pages || 1);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch diagnosis data",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch diagnosis data",
        variant: "destructive"
      });
    }
  };

  const seedCommonDiseases = async () => {
    setLoading(true);
    setImportProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 20, 90));
      }, 100);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/diagnosis-master/seed-common-diseases`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Imported ${data.data.imported} common eye diseases`,
        });

        // Refresh data
        fetchStatistics();
        fetchDiagnosisData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to seed diseases');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to seed common diseases",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setImportProgress(0);
    }
  };

  const fetchEyeDiseases = async () => {
    toast({
      title: "Note",
      description: "ICD-11 sync takes several minutes. Use 'Seed Common Diseases' for quick setup.",
    });
  };

  const handleEdit = (icd) => {
    // Get the associated disease
    const disease = icd.diseases?.[0];

    setSelectedDisease(icd);
    setEditDisease({
      code: icd.code || '',
      title: typeof icd.title === 'object' ? icd.title['@value'] : icd.title || '',
      category: icd.ophthalmologyCategory || '',
      description: typeof icd.definition === 'object' ? icd.definition['@value'] : icd.definition || '',
      symptoms: disease?.symptoms ? (typeof disease.symptoms === 'object' ? disease.symptoms['@value'] : disease.symptoms) : '',
      urgency: disease?.urgencyLevel || 'Routine',
      requiresSurgery: disease?.requiresSurgery || false
    });
    setShowEditDialog(true);
  };

  const handleDelete = (icd) => {
    setSelectedDisease(icd);
    setShowDeleteDialog(true);
  };

  const updateDisease = async () => {
    if (!selectedDisease || !selectedDisease.diseases?.[0]) {
      toast({
        title: "Error",
        description: "No disease found to update",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const diseaseId = selectedDisease.diseases[0].id;

      const updateData = {
        diseaseName: { '@value': editDisease.title },
        ophthalmologyCategory: editDisease.category,
        symptoms: { '@value': editDisease.symptoms },
        urgencyLevel: editDisease.urgency,
        requiresSurgery: editDisease.requiresSurgery
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/diagnosis-master/diseases/${diseaseId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Disease updated successfully",
        });

        setShowEditDialog(false);
        setSelectedDisease(null);
        fetchDiagnosisData();
        fetchStatistics();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update disease');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update disease",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDisease = async () => {
    if (!selectedDisease || !selectedDisease.diseases?.[0]) {
      toast({
        title: "Error",
        description: "No disease found to delete",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const diseaseId = selectedDisease.diseases[0].id;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/diagnosis-master/diseases/${diseaseId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Disease deleted successfully",
        });

        setShowDeleteDialog(false);
        setSelectedDisease(null);
        fetchDiagnosisData();
        fetchStatistics();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete disease');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete disease",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addManualDisease = async () => {
    if (!newDisease.code || !newDisease.title || !newDisease.category) {
      toast({
        title: "Validation Error",
        description: "Code, Title, and Category are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const diseaseData = {
        foundationId: `http://id.who.int/icd/entity/manual/${newDisease.code}`,
        code: newDisease.code,
        title: { '@value': newDisease.title },
        definition: { '@value': newDisease.description },
        chapter: '09',
        isEyeRelated: true,
        ophthalmologyCategory: newDisease.category,
        inclusionTerms: null,
        exclusionTerms: null,
        isActive: true
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/diagnosis-master/import-diseases`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ diseases: [diseaseData] })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Disease added successfully",
        });

        setShowAddDialog(false);
        setNewDisease({
          code: '',
          title: '',
          category: '',
          description: '',
          symptoms: '',
          urgency: 'Routine',
          requiresSurgery: false
        });

        fetchStatistics();
        fetchDiagnosisData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add disease');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add disease",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const importDiseases = async () => {
    if (fetchedDiseases.length === 0) return;

    setLoading(true);
    setImportProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/v1/diagnosis-master/import-diseases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ diseases: fetchedDiseases })
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Import Successful",
          description: `Imported: ${data.data.imported}, Updated: ${data.data.updated}`,
        });

        // Refresh data
        fetchStatistics();
        fetchDiagnosisData();
        setShowImportDialog(false);
        setFetchedDiseases([]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import diseases');
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import diseases to database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setImportProgress(0);
    }
  };

  const StatCard = ({ title, value, icon: Icon, description, color = "blue" }) => (
    <Card className="bg-white shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-5 w-5 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total ICD Codes"
          value={statistics?.totalIcdCodes || 0}
          icon={Database}
          description="Eye-related ICD-11 codes"
          color="blue"
        />
        <StatCard
          title="Total Diseases"
          value={statistics?.totalDiseases || 0}
          icon={Eye}
          description="Configured diseases"
          color="green"
        />
        <StatCard
          title="Categories"
          value={statistics?.categoryCounts?.length || 0}
          icon={BarChart3}
          description="Ophthalmology categories"
          color="purple"
        />
        <StatCard
          title="Recent Imports"
          value={statistics?.recentImports?.length || 0}
          icon={Clock}
          description="Last 5 imports"
          color="orange"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 flex-wrap">
        <Button
          onClick={seedCommonDiseases}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          Seed Common Diseases (Quick)
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 border-slate-300 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          Add Disease Manually
        </Button>
        <Button
          variant="outline"
          onClick={fetchDiagnosisData}
          className="flex items-center gap-2 border-slate-300 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Progress Bar for Import */}
      {importProgress > 0 && (
        <Card className="shadow-sm border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-700">
                <span className="font-medium">Importing diseases...</span>
                <span className="font-semibold text-blue-600">{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Distribution */}
      {statistics?.categoryCounts && (
        <Card className="shadow-sm border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-gray-900">Category Distribution</CardTitle>
            <CardDescription className="text-gray-600">Number of diseases by ophthalmology category</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {statistics.categoryCounts.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 transition-colors border border-gray-100">
                  <span className="text-sm font-medium text-gray-700">{category.ophthalmologyCategory || 'Uncategorized'}</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-0">{category._count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Imports */}
      {statistics?.recentImports && statistics.recentImports.length > 0 && (
        <Card className="shadow-sm border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-gray-900">Recent Imports</CardTitle>
            <CardDescription className="text-gray-600">Latest imported ICD-11 codes</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {statistics.recentImports.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 transition-colors">
                  <div>
                    <div className="font-medium text-gray-900">{item.code}</div>
                    <div className="text-sm text-gray-600">
                      {typeof item.title === 'object' ? item.title['@value'] || 'No title' : item.title}
                    </div>
                  </div>
                  <Badge variant="outline" className="border-blue-200 text-blue-700">{item.ophthalmologyCategory}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderDiagnosisManagement = () => (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by code or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Diagnosis Table */}
      <Card className="shadow-sm border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="text-gray-900">Diagnosis Master Data</CardTitle>
          <CardDescription className="text-gray-600">
            Manage ICD-11 codes and associated disease information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ICD Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Diseases</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diagnosisData && diagnosisData.length > 0 ? (
                diagnosisData.map((icd) => (
                  <TableRow key={icd.id}>
                    <TableCell className="font-mono">{icd.code}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {typeof icd.title === 'object' ? icd.title['@value'] || 'No title' : icd.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{icd.ophthalmologyCategory}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{icd.diseases?.length || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={icd.isActive ? "default" : "secondary"}>
                        {icd.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(icd)}
                          title="Edit disease"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(icd)}
                          title="Delete disease"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No diseases found</p>
                      <p className="text-sm text-muted-foreground">
                        Click "Seed Common Diseases" in the Overview tab to get started
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {diagnosisData && diagnosisData.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages || 1}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Diagnosis Master</h1>
            <p className="text-gray-600 mt-1">
              Manage ICD-11 eye disease codes and diagnosis database
            </p>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Database className="h-3 w-3 mr-1" />
            {statistics?.totalIcdCodes || 0} ICD Codes
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white p-1 rounded-lg shadow-md border mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="management" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Diagnosis Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="management" className="space-y-4">
            {renderDiagnosisManagement()}
          </TabsContent>
        </Tabs>

        {/* Add Disease Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-2 text-slate-800">
                <Plus className="h-5 w-5 text-blue-600" />
                Add Disease Manually
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Add a custom eye disease to the diagnosis master
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">ICD Code *</label>
                  <Input
                    placeholder="e.g., 9A00"
                    value={newDisease.code}
                    onChange={(e) => setNewDisease({ ...newDisease, code: e.target.value })}
                    className="border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Category *</label>
                  <Select
                    value={newDisease.category}
                    onValueChange={(value) => setNewDisease({ ...newDisease, category: value })}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retinal Disorders">Retinal Disorders</SelectItem>
                      <SelectItem value="Glaucoma">Glaucoma</SelectItem>
                      <SelectItem value="Lens Disorders">Lens Disorders</SelectItem>
                      <SelectItem value="Corneal Disorders">Corneal Disorders</SelectItem>
                      <SelectItem value="Conjunctival Disorders">Conjunctival Disorders</SelectItem>
                      <SelectItem value="Refractive Errors">Refractive Errors</SelectItem>
                      <SelectItem value="Optic Nerve Disorders">Optic Nerve Disorders</SelectItem>
                      <SelectItem value="Orbital and Eyelid Disorders">Orbital and Eyelid Disorders</SelectItem>
                      <SelectItem value="Motility Disorders">Motility Disorders</SelectItem>
                      <SelectItem value="Other Eye Disorders">Other Eye Disorders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Disease Title *</label>
                <Input
                  placeholder="e.g., Diabetic Retinopathy"
                  value={newDisease.title}
                  onChange={(e) => setNewDisease({ ...newDisease, title: e.target.value })}
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <Input
                  placeholder="Brief description of the disease"
                  value={newDisease.description}
                  onChange={(e) => setNewDisease({ ...newDisease, description: e.target.value })}
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Symptoms (comma-separated)</label>
                <Input
                  placeholder="e.g., Blurred vision, Eye pain, Redness"
                  value={newDisease.symptoms}
                  onChange={(e) => setNewDisease({ ...newDisease, symptoms: e.target.value })}
                  className="border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Urgency Level</label>
                  <Select
                    value={newDisease.urgency}
                    onValueChange={(value) => setNewDisease({ ...newDisease, urgency: value })}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Routine">Routine</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Requires Surgery</label>
                  <Select
                    value={newDisease.requiresSurgery ? "yes" : "no"}
                    onValueChange={(value) => setNewDisease({ ...newDisease, requiresSurgery: value === "yes" })}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-slate-300 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button onClick={addManualDisease} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Disease
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Disease Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-2 text-slate-800">
                <Edit className="h-5 w-5 text-blue-600" />
                Edit Disease
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Update disease information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">ICD Code</label>
                  <Input
                    value={editDisease.code}
                    disabled
                    className="bg-slate-100 border-slate-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Category *</label>
                  <Select
                    value={editDisease.category}
                    onValueChange={(value) => setEditDisease({ ...editDisease, category: value })}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retinal Disorders">Retinal Disorders</SelectItem>
                      <SelectItem value="Glaucoma">Glaucoma</SelectItem>
                      <SelectItem value="Lens Disorders">Lens Disorders</SelectItem>
                      <SelectItem value="Corneal Disorders">Corneal Disorders</SelectItem>
                      <SelectItem value="Conjunctival Disorders">Conjunctival Disorders</SelectItem>
                      <SelectItem value="Refractive Errors">Refractive Errors</SelectItem>
                      <SelectItem value="Optic Nerve Disorders">Optic Nerve Disorders</SelectItem>
                      <SelectItem value="Orbital and Eyelid Disorders">Orbital and Eyelid Disorders</SelectItem>
                      <SelectItem value="Motility Disorders">Motility Disorders</SelectItem>
                      <SelectItem value="Other Eye Disorders">Other Eye Disorders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Disease Title *</label>
                <Input
                  value={editDisease.title}
                  onChange={(e) => setEditDisease({ ...editDisease, title: e.target.value })}
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <Input
                  value={editDisease.description}
                  onChange={(e) => setEditDisease({ ...editDisease, description: e.target.value })}
                  className="border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Symptoms (comma-separated)</label>
                <Input
                  value={editDisease.symptoms}
                  onChange={(e) => setEditDisease({ ...editDisease, symptoms: e.target.value })}
                  className="border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Urgency Level</label>
                  <Select
                    value={editDisease.urgency}
                    onValueChange={(value) => setEditDisease({ ...editDisease, urgency: value })}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Routine">Routine</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Requires Surgery</label>
                  <Select
                    value={editDisease.requiresSurgery ? "yes" : "no"}
                    onValueChange={(value) => setEditDisease({ ...editDisease, requiresSurgery: value === "yes" })}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-slate-300 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button onClick={updateDisease} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Disease
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-2 text-slate-800">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Delete Disease
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Are you sure you want to delete this disease? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {selectedDisease && (
              <div className="space-y-3 py-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Code:</span>
                  <span className="font-mono text-slate-900">{selectedDisease.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Title:</span>
                  <span className="text-slate-900">{typeof selectedDisease.title === 'object' ? selectedDisease.title['@value'] : selectedDisease.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Category:</span>
                  <Badge variant="outline" className="border-blue-200 text-blue-700">{selectedDisease.ophthalmologyCategory}</Badge>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="border-slate-300 hover:bg-slate-50">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteDisease}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-2 text-slate-800">
                <Upload className="h-5 w-5 text-blue-600" />
                Import Eye Diseases
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Review and import {fetchedDiseases.length} eye diseases from ICD-11
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {importProgress > 0 && (
                <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between text-sm text-slate-700">
                    <span className="font-medium">Import Progress</span>
                    <span className="font-semibold text-blue-600">{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </div>
              )}

              <div className="max-h-64 overflow-y-auto border rounded-lg p-4 bg-slate-50">
                <div className="space-y-2">
                  {fetchedDiseases.slice(0, 10).map((disease, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-medium text-slate-800">{disease.code}</div>
                        <div className="text-sm text-slate-600">
                          {typeof disease.title === 'object' ? disease.title['@value'] || 'No title' : disease.title}
                        </div>
                      </div>
                      <Badge variant="outline" className="border-blue-200 text-blue-700">{disease.ophthalmologyCategory}</Badge>
                    </div>
                  ))}
                  {fetchedDiseases.length > 10 && (
                    <div className="text-center text-sm text-slate-600 py-2">
                      ... and {fetchedDiseases.length - 10} more diseases
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowImportDialog(false)} className="border-slate-300 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button onClick={importDiseases} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DiagnosisMaster;