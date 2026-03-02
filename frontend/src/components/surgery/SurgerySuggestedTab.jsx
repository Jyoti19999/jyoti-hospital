import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Loader from "@/components/loader/Loader";
import { useToast } from "@/hooks/use-toast";
import {
  Stethoscope,
  Calendar,
  User,
  Clock,
  Eye,
  RefreshCw,
  Bed,
  AlertCircle,
  Search
} from "lucide-react";

// Import hooks
import { useSurgeryRecommendedPatients } from '@/hooks/useSurgeryQueries';

/*
========================================
🏥 SURGERY SUGGESTED TAB FOR RECEPTIONIST2
========================================

Displays patients with SURGERY_SUGGESTED status in IPD admissions.
View-only interface for receptionist2 to see surgery recommendations.
*/

const PatientCard = ({ patient }) => {
  const getSurgeryTypeColor = (type) => {
    const colors = {
      CATARACT: 'bg-blue-100 text-blue-800',
      GLAUCOMA: 'bg-green-100 text-green-800',
      RETINAL: 'bg-purple-100 text-purple-800',
      CORNEAL: 'bg-orange-100 text-orange-800',
      OTHER: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.OTHER;
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            {/* Patient Info - Compact */}
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-blue-100 rounded-full">
                <User className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-base">
                  {patient.patient.firstName} {patient.patient.middleName ? patient.patient.middleName + ' ' : ''}{patient.patient.lastName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  #{patient.patient.patientNumber} • {patient.patient.phone}
                </p>
              </div>
            </div>

            {/* Surgery Info - Compact */}
            <div className="flex items-center space-x-3">
              <Badge className={getSurgeryTypeColor(patient.surgeryCategory)} size="sm">
                <Stethoscope className="h-2 w-2 mr-1" />
                {patient.surgeryType}
              </Badge>
              
              <Badge variant="outline" className="bg-blue-50 text-xs">
                <Bed className="h-2 w-2 mr-1" />
                IPD #{patient.ipdAdmission.admissionNumber}
              </Badge>
              
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                <Clock className="h-2 w-2 mr-1" />
                Surgery Suggested
              </Badge>
            </div>

            {/* Compact IPD Details */}
            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground font-medium">Recommended By</p>
                  <p className="text-blue-800">{patient.recommendedBy}</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground font-medium">Date</p>
                  <p className="text-blue-800">{new Date(patient.recommendedDate).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground font-medium">Status</p>
                  <p className="text-blue-800">{patient.ipdAdmission.status.replace('_', ' ')}</p>
                </div>
                
                <div>
                  <p className="text-muted-foreground font-medium">Surgery Date</p>
                  <p className="text-blue-800 italic">Yet to be scheduled</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SurgerySuggestedTab = () => {
  const { data: patientsData, isLoading, refetch, error } = useSurgeryRecommendedPatients();
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Debug logs
  React.useEffect(() => {
  }, [patientsData, isLoading, error]);
  
  const patients = patientsData?.data || [];

  // Filter patients based on search term and filters
  const getFilteredPatients = () => {
    if (!patients || patients.length === 0) return [];

    return patients.filter(patient => {
      // Search filter - search by patient name, patient number, admission number
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        patient.patient.firstName?.toLowerCase().includes(searchLower) ||
        patient.patient.middleName?.toLowerCase().includes(searchLower) ||
        patient.patient.lastName?.toLowerCase().includes(searchLower) ||
        patient.patient.patientNumber?.toLowerCase().includes(searchLower) ||
        patient.ipdAdmission.admissionNumber?.toLowerCase().includes(searchLower) ||
        patient.surgeryType?.toLowerCase().includes(searchLower);

      // Category filter - filter by surgery category
      const matchesCategory = categoryFilter === 'all' || patient.surgeryCategory === categoryFilter;

      // Status filter - filter by IPD admission status
      const matchesStatus = statusFilter === 'all' || patient.ipdAdmission.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const filteredPatients = getFilteredPatients();

  // Calculate summary statistics
  const totalPatients = patients.length;
  const cataractCount = patients.filter(p => p.surgeryCategory === 'CATARACT').length;
  const glaucomaCount = patients.filter(p => p.surgeryCategory === 'GLAUCOMA').length;
  const retinalCount = patients.filter(p => p.surgeryCategory === 'RETINAL').length;
  const cornealCount = patients.filter(p => p.surgeryCategory === 'CORNEAL').length;
  const otherCount = patients.filter(p => p.surgeryCategory === 'OTHER' || !p.surgeryCategory).length;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Show error state if there's an API error
  if (error) {
    return (
      <Card className="h-full flex flex-col overflow-hidden border-red-200">
        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Surgery Suggested - Error
            </CardTitle>
            <Button variant="outline" onClick={refetch} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-700">Error Loading Surgery Suggestions</h3>
            <p className="text-red-600 mb-4">
              {error?.message || 'Failed to fetch patients with surgery suggestions'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Header with Gradient Background and Summary Badges */}
      <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isLoading ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            <Stethoscope className="h-5 w-5 mr-2 text-red-600" />
            Surgery Suggested - IPD Admissions
            {isLoading && (
              <span className="text-sm text-red-500 ml-2 font-normal flex items-center">
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                Loading...
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Summary Statistics Badges */}
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
              {totalPatients} Total
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              {cataractCount} Cataract
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              {glaucomaCount} Glaucoma
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
              {retinalCount} Retinal
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
              {cornealCount} Corneal
            </Badge>
            {otherCount > 0 && (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                {otherCount} Other
              </Badge>
            )}
            <Badge variant="outline">
              {filteredPatients.length} Result{filteredPatients.length !== 1 ? 's' : ''}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
              className="h-9"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Integrated Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by patient name, patient #, admission #, surgery type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48 h-10">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="CATARACT">Cataract</SelectItem>
              <SelectItem value="GLAUCOMA">Glaucoma</SelectItem>
              <SelectItem value="RETINAL">Retinal</SelectItem>
              <SelectItem value="CORNEAL">Corneal</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-10">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="SURGERY_SUGGESTED">Surgery Suggested</SelectItem>
              <SelectItem value="ADMITTED">Admitted</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      {/* Patients List with Scrollbar */}
      <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto tab-content-container pr-2">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="h-16 w-16 text-gray-300 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              {patients.length === 0 ? 'No Surgery Suggestions Pending' : 'No Results Found'}
            </h3>
            <p className="text-gray-400 text-sm">
              {patients.length === 0
                ? 'No patients with SURGERY_SUGGESTED status found in IPD admissions'
                : 'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SurgerySuggestedTab;