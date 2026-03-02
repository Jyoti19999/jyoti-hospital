import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, UserCheck, Clock, RefreshCw, AlertCircle, Search, Eye, Edit } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { optometristQueueService } from '@/services/optometristQueueService';
import useOptometristStore from '@/stores/optometrist';
import OptometristCompletedExamModal from './OptometristCompletedExamModal';

const CompletedExamsPanel = () => {
  const { completedPatients } = useOptometristStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [notesFilter, setNotesFilter] = useState('all');
  const [selectedExam, setSelectedExam] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch today's completed examinations from API
  const { 
    data: completedExamsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['optometrist-completed-exams-today'],
    queryFn: optometristQueueService.getTodaysCompletedExaminations,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true
  });

  // Use API data if available, fallback to store data
  const completedExams = completedExamsData?.data?.examinations || completedPatients;
  const totalCompleted = completedExamsData?.data?.totalCompleted || completedPatients.length;

  // Format examination data for display
  const formatExaminationData = (exam) => {
    if (exam.patientName && exam.patientNumber) {
      // API data structure (new format)
      return {
        id: exam.id,
        name: exam.patientName,
        age: exam.dateOfBirth ? 
              new Date().getFullYear() - new Date(exam.dateOfBirth).getFullYear() : 'N/A',
        gender: exam.gender || 'N/A',
        mrn: exam.patientNumber,
        completedAt: exam.completedAt,
        durationMinutes: exam.durationMinutes || 0,
        assignedDoctor: exam.assignedDoctor,
        preliminaryDiagnosis: exam.preliminaryDiagnosis || 'N/A',
        visualAcuity: exam.visualAcuity,
        tonometry: exam.tonometry,
        additionalNotes: exam.additionalNotes
      };
    } else if (exam.patientVisit) {
      // Old API data structure (fallback)
      return {
        id: exam.id,
        name: `${exam.patientVisit.patient.firstName} ${exam.patientVisit.patient.lastName}`,
        age: exam.patientVisit.patient.dateOfBirth ? 
              new Date().getFullYear() - new Date(exam.patientVisit.patient.dateOfBirth).getFullYear() : 'N/A',
        gender: exam.patientVisit.patient.gender,
        mrn: exam.patientVisit.patient.patientNumber,
        completedAt: exam.createdAt,
        durationMinutes: 0,
        assignedDoctor: exam.assignedDoctor,
        preliminaryDiagnosis: exam.examinationData?.examData?.preliminaryDiagnosis || 'N/A',
        visualAcuity: exam.visualAcuity,
        tonometry: exam.tonometry,
        additionalNotes: exam.additionalNotes
      };
    } else {
      // Store data structure (fallback)
      return exam;
    }
  };

  // Filter completed exams based on search and filters
  const getFilteredExams = () => {
    let filtered = completedExams;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(exam => {
        const formatted = formatExaminationData(exam);
        const nameMatch = formatted.name?.toLowerCase().includes(searchLower);
        const mrnMatch = formatted.mrn?.toString().toLowerCase().includes(searchLower);
        const doctorMatch = formatted.assignedDoctor?.fullName?.toLowerCase().includes(searchLower) ||
                           formatted.assignedDoctor?.firstName?.toLowerCase().includes(searchLower) ||
                           formatted.assignedDoctor?.lastName?.toLowerCase().includes(searchLower);
        return nameMatch || mrnMatch || doctorMatch;
      });
    }

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(exam => {
        const formatted = formatExaminationData(exam);
        const completedAt = new Date(formatted.completedAt);
        const hoursDiff = (now - completedAt) / (1000 * 60 * 60);
        
        if (timeFilter === 'last-hour') return hoursDiff <= 1;
        if (timeFilter === 'last-3-hours') return hoursDiff <= 3;
        if (timeFilter === 'last-6-hours') return hoursDiff <= 6;
        return true;
      });
    }

    // Apply duration filter
    if (durationFilter !== 'all') {
      filtered = filtered.filter(exam => {
        const formatted = formatExaminationData(exam);
        const duration = formatted.durationMinutes || 0;
        
        if (durationFilter === 'short') return duration > 0 && duration <= 15;
        if (durationFilter === 'medium') return duration > 15 && duration <= 30;
        if (durationFilter === 'long') return duration > 30;
        return true;
      });
    }

    // Apply notes filter
    if (notesFilter !== 'all') {
      filtered = filtered.filter(exam => {
        const formatted = formatExaminationData(exam);
        const hasNotes = formatted.additionalNotes && formatted.additionalNotes.trim().length > 0;
        
        if (notesFilter === 'with-notes') return hasNotes;
        if (notesFilter === 'without-notes') return !hasNotes;
        return true;
      });
    }

    return filtered;
  };

  const filteredExams = getFilteredExams();

  const renderLoadingState = () => (
    <div className="text-center text-muted-foreground py-6">
      <RefreshCw className="h-6 w-6 mx-auto mb-2 opacity-50 animate-spin" />
      <p className="text-sm font-medium">Loading completed examinations...</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="text-center text-red-500 py-6">
      <AlertCircle className="h-6 w-6 mx-auto mb-2" />
      <p className="text-sm font-medium">Failed to load examinations</p>
      <p className="text-xs text-muted-foreground">Using cached data if available</p>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center text-muted-foreground py-8">
      <UserCheck className="h-8 w-8 mx-auto mb-3 opacity-50" />
      <p className="font-medium">No completed exams today</p>
      <p className="text-sm opacity-75">Completed examinations will appear here</p>
    </div>
  );

  return (
    <>
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Today's Completed Exams
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              {totalCompleted} Total Completed
            </Badge>
            <Badge variant="outline">
              {filteredExams.length} Result{filteredExams.length !== 1 ? 's' : ''}
            </Badge>
            {error && (
              <Badge variant="destructive" className="text-xs">
                API Error
              </Badge>
            )}
          </div>
        </div>
        
        {/* Search and Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by patient name, MRN, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10">
              <SelectValue placeholder="Time filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="last-hour">Last Hour</SelectItem>
              <SelectItem value="last-3-hours">Last 3 Hours</SelectItem>
              <SelectItem value="last-6-hours">Last 6 Hours</SelectItem>
            </SelectContent>
          </Select>
          <Select value={durationFilter} onValueChange={setDurationFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Durations</SelectItem>
              <SelectItem value="short">Short (≤15 min)</SelectItem>
              <SelectItem value="medium">Medium (16-30 min)</SelectItem>
              <SelectItem value="long">Long (&gt;30 min)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={notesFilter} onValueChange={setNotesFilter}>
            <SelectTrigger className="w-full sm:w-40 h-10">
              <SelectValue placeholder="Notes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              <SelectItem value="with-notes">With Notes</SelectItem>
              <SelectItem value="without-notes">Without Notes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto tab-content-container pr-2">
        <div className="space-y-2">
          {isLoading ? renderLoadingState() : 
           error && filteredExams.length === 0 ? renderErrorState() :
           filteredExams.length === 0 ? (
            completedExams.length === 0 ? renderEmptyState() : (
              <div className="text-center text-muted-foreground py-8">
                <UserCheck className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No exams match your filters</p>
                <p className="text-sm opacity-75">Try adjusting your search or filter criteria</p>
              </div>
            )
           ) : (
            filteredExams.map((exam) => {
              const formattedExam = formatExaminationData(exam);
              return (
                <Card key={formattedExam.id} className="p-3 bg-muted/30 border-l-4 border-l-green-500">
                  <div className="space-y-2">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-sm">{formattedExam.name}</h4>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-2 py-0.5">
                            Completed
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            <span className="font-medium">MRN:</span> {formattedExam.mrn}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Age: {formattedExam.age}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(formattedExam.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          {formattedExam.durationMinutes !== undefined && (
                            <Badge variant="outline" className="text-xs px-2 py-0 bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formattedExam.durationMinutes > 0 ? `${formattedExam.durationMinutes} min` : '< 1 min'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          onClick={() => {
                            setSelectedExam(exam);
                            setModalMode('view');
                            setIsModalOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="View examination"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedExam(exam);
                            setModalMode('edit');
                            setIsModalOpen(true);
                          }}
                          variant="default"
                          size="sm"
                          className="h-7 w-7 p-0 bg-teal-600 hover:bg-teal-700"
                          title="Edit examination"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Test Results Row - Compact Display */}
                    {(formattedExam.visualAcuity || formattedExam.tonometry) && (
                      <div className="bg-background/50 rounded px-2 py-1.5 border">
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          {formattedExam.visualAcuity?.distance?.rightEye && (
                            <div className="text-center">
                              <span className="font-medium text-gray-600">VA OD</span>
                              <div className="font-semibold">{formattedExam.visualAcuity.distance.rightEye}</div>
                            </div>
                          )}
                          {formattedExam.visualAcuity?.distance?.leftEye && (
                            <div className="text-center">
                              <span className="font-medium text-gray-600">VA OS</span>
                              <div className="font-semibold">{formattedExam.visualAcuity.distance.leftEye}</div>
                            </div>
                          )}
                          {formattedExam.tonometry?.iop?.rightEye && (
                            <div className="text-center">
                              <span className="font-medium text-gray-600">IOP OD</span>
                              <div className="font-semibold">{formattedExam.tonometry.iop.rightEye}<span className="text-xs text-muted-foreground">mmHg</span></div>
                            </div>
                          )}
                          {formattedExam.tonometry?.iop?.leftEye && (
                            <div className="text-center">
                              <span className="font-medium text-gray-600">IOP OS</span>
                              <div className="font-semibold">{formattedExam.tonometry.iop.leftEye}<span className="text-xs text-muted-foreground">mmHg</span></div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Clinical Findings - Compact Row */}
                    {formattedExam.clinicalDetails?.slitLampFindings && (
                      <div className="bg-blue-50/50 rounded px-2 py-1.5 border border-blue-200/50">
                        <div className="grid grid-cols-4 gap-1 text-xs">
                          {Object.entries(formattedExam.clinicalDetails.slitLampFindings).map(([key, value]) => {
                            const hasAbnormal = value.leftEye !== 'normal' || value.rightEye !== 'normal';
                            return hasAbnormal ? (
                              <div key={key} className="text-center">
                                <span className="font-medium text-blue-700 capitalize">{key}</span>
                                <div className="text-xs">
                                  {value.rightEye !== 'normal' && <span className="text-orange-600 font-medium">OD: {value.rightEye}</span>}
                                  {value.leftEye !== 'normal' && <span className="text-orange-600 font-medium ml-1">OS: {value.leftEye}</span>}
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Additional Notes - Only if present */}
                    {formattedExam.additionalNotes && (
                      <div className="bg-amber-50/50 rounded px-2 py-1.5 border border-amber-200/50">
                        <p className="text-xs">
                          <span className="font-semibold text-amber-800">Notes:</span> 
                          <span className="ml-1 text-amber-700">{formattedExam.additionalNotes}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>

    {/* Completed Examination Modal */}
    {selectedExam && (
      <OptometristCompletedExamModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExam(null);
        }}
        exam={selectedExam}
        mode={modalMode}
        onSave={() => {
          queryClient.invalidateQueries(['optometrist-completed-exams-today']);
        }}
      />
    )}
    </>
  );
};

export default CompletedExamsPanel;