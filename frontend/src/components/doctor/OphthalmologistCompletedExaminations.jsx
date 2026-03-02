import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Calendar, 
  User, 
  Phone, 
  FileText,
  Search,
  Clock,
  RefreshCw,
  Eye,
  Edit,
  Timer
} from "lucide-react";
import { toast } from "sonner";
import axios from 'axios';
import Loader from "@/components/loader/Loader";
import CompletedExaminationModal from "./CompletedExaminationModal";

const OphthalmologistCompletedExaminations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // 'view' or 'edit'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch completed examinations
  const { data: completedExaminations, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['completedExaminations'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/ophthalmologist/completed-examinations`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.data;
    },
    onError: (error) => {
      toast.error('Failed to load completed examinations');
    }
  });

  const handleRefresh = () => {
    refetch();
    toast.success('Refreshing completed examinations...');
  };

  const handleViewExam = (exam) => {
    setSelectedExam(exam);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEditExam = (exam) => {
    setSelectedExam(exam);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedExam(null);
  };

  const handleSaveSuccess = () => {
    queryClient.invalidateQueries(['completedExaminations']);
  };

  // Filter examinations based on search
  const filteredExaminations = completedExaminations?.filter(exam => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    
    return (
      exam.patient.fullName?.toLowerCase().includes(search) ||
      exam.patient.patientNumber?.toString().includes(search) ||
      exam.patient.phone?.toLowerCase().includes(search) ||
      exam.appointment.tokenNumber?.toLowerCase().includes(search)
    );
  }) || [];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate consultation duration
  const calculateDuration = (inProgressAt, completedAt) => {
    if (!inProgressAt || !completedAt) return null;
    
    const start = new Date(inProgressAt);
    const end = new Date(completedAt);
    const diffInSeconds = Math.floor((end - start) / 1000);
    
    if (diffInSeconds < 0) return null; // Invalid data
    
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Failed to load completed examinations</p>
            <p className="text-sm mt-1">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Completed Examinations
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              {completedExaminations?.length || 0} Total Records
            </Badge>
            <Badge variant="outline">
              {filteredExaminations.length} Result{filteredExaminations.length !== 1 ? 's' : ''}
            </Badge>
            <Button
              onClick={handleRefresh}
              disabled={isFetching}
              variant="outline"
              size="sm"
              className="h-9"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by patient name, MRN, phone, or token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto tab-content-container pr-2">
        <div>
          {filteredExaminations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3 opacity-50" />
              <p className="text-gray-500 font-medium">
                {searchTerm ? 'No examinations found' : 'No completed examinations yet'}
              </p>
              <p className="text-gray-400 text-sm">
                {searchTerm ? 'Try adjusting your search criteria' : 'Completed examinations will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
                {filteredExaminations.map((exam) => (
                  <Card 
                    key={exam.queueId} 
                    className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-3">
                      {/* Header Row */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-base">
                            {exam.patient.fullName}
                          </h4>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-xs text-gray-600">
                              # {exam.patient.patientNumber}
                            </span>
                            {exam.patient.age && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-xs text-gray-600">
                                  {exam.patient.age}y
                                </span>
                              </>
                            )}
                            {exam.patient.gender && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-xs text-gray-600">
                                  {exam.patient.gender}
                                </span>
                              </>
                            )}
                            {exam.patient.phone && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-xs text-gray-600">
                                  {exam.patient.phone}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1">
                          <Badge className="bg-green-100 text-green-800 text-xs py-0 px-2">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                          {exam.appointment.tokenNumber && (
                            <Badge variant="outline" className="text-xs py-0 px-2">
                              {exam.appointment.tokenNumber}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Compact Details with Action Buttons */}
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>{formatDate(exam.visitDate)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span>{formatDateTime(exam.completedAt)}</span>
                          </div>
                          {/* Consultation Duration */}
                          {exam.inProgressAt && exam.completedAt && (
                            <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded">
                              <Timer className="h-3 w-3 text-blue-600" />
                              <span className="text-blue-700 font-medium">
                                {calculateDuration(exam.inProgressAt, exam.completedAt)}
                              </span>
                            </div>
                          )}
                          {exam.visitType && (
                            <Badge variant="outline" className="text-xs py-0 px-2">
                              {exam.visitType}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1.5">
                          <Button
                            onClick={() => handleViewExam(exam)}
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleEditExam(exam)}
                            variant="default"
                            size="sm"
                            className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Examination Details - Compact */}
                      {exam.examination && (
                        <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                          {/* Final Diagnosis (Preferred) or Preliminary Diagnosis (Fallback) */}
                          {exam.examination.finalDiagnoses?.length > 0 ? (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-0.5">Final Diagnosis</p>
                              <div className="flex flex-wrap gap-1">
                                {exam.examination.finalDiagnoses.map((d) => {
                                  // Extract disease name safely - handle both string and object formats
                                  const diseaseName = typeof d.disease?.diseaseName === 'string' 
                                    ? d.disease.diseaseName 
                                    : d.disease?.diseaseName?.['@value'] || 'Unknown';
                                  
                                  return (
                                    <Badge
                                      key={d.id}
                                      variant="outline"
                                      className="bg-green-50 text-green-700 border-green-200 text-xs py-0.5 px-2"
                                    >
                                      {diseaseName}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          ) : exam.examination.preliminaryDiagnosis ? (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-0.5">Preliminary Diagnosis</p>
                              <p className="text-xs text-gray-700 bg-gray-50 p-1.5 rounded">
                                {exam.examination.preliminaryDiagnosis}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic">Diagnosis not finalized</p>
                          )}
                          
                          {exam.examination.assessment && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-0.5">Assessment</p>
                              <p className="text-xs text-gray-700 bg-blue-50 p-1.5 rounded">
                                {exam.examination.assessment}
                              </p>
                            </div>
                          )}

                          {exam.examination.treatmentPlan && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 mb-0.5">Treatment</p>
                              <p className="text-xs text-gray-700 bg-green-50 p-1.5 rounded">
                                {exam.examination.treatmentPlan}
                              </p>
                            </div>
                          )}
                          
                          {(exam.examination.followUpPeriod || exam.examination.followUpDays) && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs py-0 px-2">
                              Follow-up: {exam.examination.followUpPeriod || `${exam.examination.followUpDays} days`}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Completed Examination Modal */}
    {selectedExam && (
      <CompletedExaminationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        queueEntryId={selectedExam.queueId}
        patientVisitId={selectedExam.visitId}
        mode={modalMode}
        onSave={handleSaveSuccess}
      />
    )}
    </>
  );
};

export default OphthalmologistCompletedExaminations;
