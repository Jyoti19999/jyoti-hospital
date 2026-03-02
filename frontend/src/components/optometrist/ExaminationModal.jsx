import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { 
  Eye, 
  Save, 
  CheckCircle, 
  User, 
  Clock, 
  FileText,
  Target,
  Gauge,
  Grid,
  AlertTriangle,
  ClipboardPlus,
  UserCheck,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle
} from 'lucide-react';
import useOptometristStore from '@/stores/optometrist';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { optometristQueueService } from '@/services/optometristQueueService';
import { patientService } from '@/services/patientService';
import { toast } from 'sonner';

// ─── Step Configuration ──────────────────────────────────────────────
const STEPS = [
  { key: 'overview',        label: 'Overview',         shortLabel: 'Overview',  icon: User,          required: false },
  { key: 'acuity',          label: 'Visual Acuity',    shortLabel: 'Acuity',    icon: Target,        required: true  },
  { key: 'refraction',      label: 'Refraction',       shortLabel: 'Refraction',icon: Eye,           required: true  },
  { key: 'tonometry',       label: 'Tonometry',        shortLabel: 'Tonometry', icon: Gauge,         required: true  },
  { key: 'tests',           label: 'Additional Tests', shortLabel: 'Tests',     icon: Grid,          required: true  },
  { key: 'clinicalDetails', label: 'Clinical Details', shortLabel: 'Clinical',  icon: ClipboardPlus, required: false },
  { key: 'notes',           label: 'Notes & Decision', shortLabel: 'Decision',  icon: FileText,      required: true  },
];

const ExaminationModal = () => {
  const { selectedPatient, isModalOpen, closeModal, completeExam, saveDraftExam } = useOptometristStore();
  const queryClient = useQueryClient();
  const [isPreOpOpen, setIsPreOpOpen] = useState(false);
  const [modalOpenTime, setModalOpenTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Save examination data mutation
  const saveExaminationMutation = useMutation({
    mutationFn: ({ patientVisitId, examinationData }) => 
      optometristQueueService.saveExaminationData(patientVisitId, examinationData),
    onSuccess: () => {
    },
    onError: (error) => {
    }
  });

  // Complete examination mutation (only handles queue completion and transfer)
  const completeExaminationMutation = useMutation({
    mutationFn: ({ queueEntryId }) => 
      optometristQueueService.completeExamination(queueEntryId, {}), // Empty examData since it's saved separately
    onSuccess: (data) => {
      // Success handling is now done in handleCompleteExam function
      // Just refresh the queue
      queryClient.invalidateQueries(['optometrist-queue']);
    },
    onSuccessOld: (data) => {
      
      // Show success toast with doctor assignment info
      const successMessage = assignedDoctor 
        ? `Patient ${selectedPatient?.name} has been assigned to ${assignedDoctor} and transferred successfully`
        : `Patient ${selectedPatient?.name} has been transferred to the ophthalmologist`;
        
      toast.success('Examination completed successfully!', {
        description: successMessage,
        duration: 5000,
      });
      
      // Reset store state to empty values
      useOptometristStore.getState().resetExamData();
      useOptometristStore.getState().clearSelectedPatient();
      
      // Reset local form state
      setExamData({
        visualAcuity: {
          distance: { rightEye: '', leftEye: '', binocular: '' },
          near: { rightEye: '', leftEye: '', binocular: '' },
          aided: { rightEye: '', leftEye: '', binocular: '' },
          unaided: { rightEye: '', leftEye: '', binocular: '' }
        },
        refraction: {
          sphere: { rightEye: '', leftEye: '' },
          cylinder: { rightEye: '', leftEye: '' },
          axis: { rightEye: '', leftEye: '' },
          add: { rightEye: '', leftEye: '' },
          pd: ''
        },
        tonometry: {
          iop: { rightEye: '', leftEye: '' },
          method: 'goldmann',
          time: ''
        },
        additionalTests: {
          pupilReaction: 'normal',
          colorVision: 'normal',
          eyeAlignment: 'normal',
          anteriorSegment: 'normal',
          extraocularMovements: 'full',
          coverTest: 'orthophoric'
        },
        clinicalDetails: {
          preOpParams: {
            k1: { rightEye: '', leftEye: '' },
            k2: { rightEye: '', leftEye: '' },
            flatAxis: { rightEye: '', leftEye: '' },
            acd: { rightEye: '', leftEye: '' },
            axl: { rightEye: '', leftEye: '' },
            iolPowerPlanned: { rightEye: '', leftEye: '' },
            iolImplanted: { rightEye: '', leftEye: '' },
            anyOtherDetails: { rightEye: '', leftEye: '' },
          },
          slitLampFindings: {
            eyelids: { rightEye: 'normal', leftEye: 'normal' },
            conjunctiva: { rightEye: 'normal', leftEye: 'normal' },
            cornea: { rightEye: 'clear', leftEye: 'clear' },
            lens: { rightEye: 'normal', leftEye: 'normal' },
          }
        },
        clinicalNotes: '',
        preliminaryDiagnosis: '',
        additionalOrders: []
      });
      setAssignedDoctor('');
      setAssignedDoctorId('');
      setAllergies([]);
      setActiveTab('overview');
      
      // Close the modal
      closeModal();
      
      // Refresh the queue after completing examination
      queryClient.invalidateQueries(['optometrist-queue']);
      
    },
    onError: (error) => {
      
      // Show error toast
      toast.error('Failed to complete examination', {
        description: error.response?.data?.message || error.message || 'An unexpected error occurred',
        duration: 5000,
      });
      
      // Reset completion state
      setCurrentCompletionStep('');
    }
  });

  // Fetch doctors list mutation
  const fetchDoctorsMutation = useMutation({
    mutationFn: () => patientService.getDoctorsList(),
    onSuccess: (data) => {
      if (data && data.success && data.data) {
        const doctors = data.data.map(doctor => ({
          id: doctor.id,
          name: doctor.name, // Backend already provides formatted name like "Dr. John Doe"
          department: doctor.department,
          specialization: doctor.specialization,
          qualifications: doctor.qualifications || doctor.specialization
        }));
        setAvailableDoctors(doctors);
      }
    },
    onError: (error) => {
      toast.error('Failed to load doctors list');
    }
  });

  // Assign doctor mutation
  const assignDoctorMutation = useMutation({
    mutationFn: ({ queueEntryId, doctorId }) => 
      optometristQueueService.assignDoctorToPatient(queueEntryId, doctorId),
    onSuccess: (data) => {
      toast.success('Doctor assigned successfully!');
      // Refresh the queue to show updated assignment
      queryClient.invalidateQueries(['optometrist-queue']);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to assign doctor');
    }
  });
  
  const [examData, setExamData] = useState({
    visualAcuity: {
      distance: { rightEye: '', leftEye: '', binocular: '' },
      near: { rightEye: '', leftEye: '', binocular: '' },
      aided: { rightEye: '', leftEye: '', binocular: '' },
      unaided: { rightEye: '', leftEye: '', binocular: '' }
    },
    refraction: {
      sphere: { rightEye: '', leftEye: '' },
      cylinder: { rightEye: '', leftEye: '' },
      axis: { rightEye: '', leftEye: '' },
      add: { rightEye: '', leftEye: '' },
      pd: ''
    },
    tonometry: {
      iop: { rightEye: '', leftEye: '' },
      method: 'goldmann',
      time: ''
    },
    additionalTests: {
      pupilReaction: 'normal',
      colorVision: 'normal',
      eyeAlignment: 'normal',
      anteriorSegment: 'normal',
      extraocularMovements: 'full',
      coverTest: 'orthophoric'
    },
    clinicalDetails: {
        preOpParams: {
            k1: { rightEye: '', leftEye: '' },
            k2: { rightEye: '', leftEye: '' },
            flatAxis: { rightEye: '', leftEye: '' },
            acd: { rightEye: '', leftEye: '' },
            axl: { rightEye: '', leftEye: '' },
            iolPowerPlanned: { rightEye: '', leftEye: '' },
            iolImplanted: { rightEye: '', leftEye: '' },
            anyOtherDetails: { rightEye: '', leftEye: '' },
        },
        slitLampFindings: {
            eyelids: { rightEye: 'normal', leftEye: 'normal' },
            conjunctiva: { rightEye: 'normal', leftEye: 'normal' },
            cornea: { rightEye: 'clear', leftEye: 'clear' },
            lens: { rightEye: 'normal', leftEye: 'normal' },
        }
    },
    clinicalNotes: '',
    preliminaryDiagnosis: '',
    additionalOrders: []
  });

  // New state for allergies, assigned doctor, and priority label
  const [priorityLabel, setPriorityLabel] = useState('ROUTINE');
  const [allergies, setAllergies] = useState([]);
  const [allergiesLoading, setAllergiesLoading] = useState(false);
  const [assignedDoctor, setAssignedDoctor] = useState('');
  const [assignedDoctorId, setAssignedDoctorId] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [isDraft, setIsDraft] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [currentCompletionStep, setCurrentCompletionStep] = useState('');
  const [attemptedComplete, setAttemptedComplete] = useState(false);

  // Dynamic doctors list from backend
  const [availableDoctors, setAvailableDoctors] = useState([]);

  // ─── Per-step Validation Functions ─────────────────────────────────
  const stepValidation = useMemo(() => {
    const isOverviewComplete = () => {
      // Overview is informational (read-only patient data), always considered "reviewed"
      return true;
    };

    const isAcuityComplete = () => {
      const d = examData.visualAcuity.distance;
      const n = examData.visualAcuity.near;
      // Require at minimum: distance right + left, near right + left
      return !!(d.rightEye && d.leftEye && n.rightEye && n.leftEye);
    };

    const isRefractionComplete = () => {
      const s = examData.refraction.sphere;
      const c = examData.refraction.cylinder;
      const a = examData.refraction.axis;
      // Require sphere, cylinder, axis for both eyes
      return !!(s.rightEye && s.leftEye && c.rightEye && c.leftEye && a.rightEye && a.leftEye);
    };

    const isTonometryComplete = () => {
      const iop = examData.tonometry.iop;
      return !!(iop.rightEye && iop.leftEye && examData.tonometry.method);
    };

    const isTestsComplete = () => {
      const t = examData.additionalTests;
      // All have defaults so they're always "filled", but verify they have values
      return !!(t.pupilReaction && t.colorVision && t.anteriorSegment && t.extraocularMovements && t.coverTest);
    };

    const isClinicalDetailsComplete = () => {
      // Clinical details (pre-op params) are optional, slit lamp has defaults
      // Consider complete as long as slit lamp findings exist (they have defaults)
      return true;
    };

    const isNotesComplete = () => {
      return !!(examData.preliminaryDiagnosis && assignedDoctorId && priorityLabel);
    };

    return {
      overview: isOverviewComplete,
      acuity: isAcuityComplete,
      refraction: isRefractionComplete,
      tonometry: isTonometryComplete,
      tests: isTestsComplete,
      clinicalDetails: isClinicalDetailsComplete,
      notes: isNotesComplete,
    };
  }, [examData, assignedDoctorId, priorityLabel]);

  // Compute completion status for each step
  const stepStatus = useMemo(() => {
    const status = {};
    STEPS.forEach(step => {
      status[step.key] = stepValidation[step.key]();
    });
    return status;
  }, [stepValidation]);

  // Overall progress percentage
  const overallProgress = useMemo(() => {
    const requiredSteps = STEPS.filter(s => s.required);
    const completedRequired = requiredSteps.filter(s => stepStatus[s.key]).length;
    return Math.round((completedRequired / requiredSteps.length) * 100);
  }, [stepStatus]);

  // Get incomplete required steps (for error messaging)
  const getIncompleteSteps = useCallback(() => {
    return STEPS.filter(s => s.required && !stepStatus[s.key]);
  }, [stepStatus]);

  // Fetch patient allergies from patient data
  const fetchPatientAllergies = async (patientId) => {
    setAllergiesLoading(true);
    try {
      // Get allergies from selectedPatient data (already loaded from backend)
      // Allergies can be at selectedPatient.allergies OR selectedPatient.patientData.allergies
      const patientAllergies = selectedPatient?.patientData?.allergies || 
                               selectedPatient?.allergies || [];
      
      // Just use the allergy names as strings
      setAllergies(patientAllergies);
    } catch (error) {
      setAllergies([]);
    } finally {
      setAllergiesLoading(false);
    }
  };

  // Load existing exam data if available (including draft data)
  useEffect(() => {
    if (selectedPatient && selectedPatient.examData) {
      console.log('📂 Loading saved examination data for:', selectedPatient.name);
      
      // Restore examination form data
      setExamData(prev => ({
        ...prev,
        ...selectedPatient.examData
      }));
      
      // Restore assigned doctor if saved in draft
      if (selectedPatient.examData.assignedDoctor) {
        setAssignedDoctor(selectedPatient.examData.assignedDoctor);
        console.log('👨‍⚕️ Restored assigned doctor:', selectedPatient.examData.assignedDoctor);
      }
      
      if (selectedPatient.examData.assignedDoctorId) {
        setAssignedDoctorId(selectedPatient.examData.assignedDoctorId);
      }
      
      // Restore priority label from draft
      if (selectedPatient.examData.priorityLabel) {
        setPriorityLabel(selectedPatient.examData.priorityLabel);
      }
      
      // Restore the tab they were working on
      if (selectedPatient.examData.activeTab) {
        setActiveTab(selectedPatient.examData.activeTab);
        console.log('📑 Restored active tab:', selectedPatient.examData.activeTab);
      }
      
      // Show toast if this is a draft being resumed
      if (selectedPatient.examData.isDraft && selectedPatient.examData.lastSavedAt) {
        const savedTime = new Date(selectedPatient.examData.lastSavedAt).toLocaleTimeString();
        toast.info('Draft examination loaded', {
          description: `Continuing examination for ${selectedPatient.name}. Last saved at ${savedTime}.`,
          duration: 3000,
        });
      }
      
      console.log('✅ Examination state fully restored');
    }
    
    // Set priority label from patient's queue data if no draft exists
    if (selectedPatient && selectedPatient.priorityLabel && !selectedPatient.examData?.priorityLabel) {
      setPriorityLabel(selectedPatient.priorityLabel);
    } else if (!selectedPatient?.examData?.priorityLabel) {
      setPriorityLabel('ROUTINE'); // Default fallback
    }
    
    // Fetch allergies when patient is selected
    if (selectedPatient) {
      fetchPatientAllergies(selectedPatient.id);
    }
  }, [selectedPatient]);

  // Auto-save as draft every 30 seconds
  useEffect(() => {
    if (!selectedPatient || !isModalOpen) return;

    const autoSaveInterval = setInterval(() => {
      if (Object.values(examData).some(section => 
        typeof section === 'object' ? Object.values(section).some(val => val !== '') : section !== ''
      )) {
        saveDraftExam(selectedPatient.id, { ...examData, assignedDoctor });
        setIsDraft(true);
        setTimeout(() => setIsDraft(false), 2000);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [examData, selectedPatient, isModalOpen, saveDraftExam, assignedDoctor]);

  // Fetch doctors when modal opens
  useEffect(() => {
    if (isModalOpen && availableDoctors.length === 0) {
      fetchDoctorsMutation.mutate();
    }
  }, [isModalOpen]);

  // Track examination start time when modal opens
  useEffect(() => {
    if (isModalOpen && selectedPatient) {
      setModalOpenTime(new Date());
      setElapsedTime(0);
      setAttemptedComplete(false);
      console.log('⏱️ Examination timer started');
    } else {
      setModalOpenTime(null);
      setElapsedTime(0);
    }
  }, [isModalOpen, selectedPatient]);

  // Update elapsed time every second
  useEffect(() => {
    if (!modalOpenTime) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((new Date() - modalOpenTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [modalOpenTime]);

  const handleExamDataChange = (section, field, value) => {
    setExamData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle doctor selection
  const handleDoctorSelection = (doctorId) => {
    const selectedDoc = availableDoctors.find(doc => doc.id === doctorId);
    if (selectedDoc) {
      setAssignedDoctorId(doctorId);
      setAssignedDoctor(selectedDoc.name);
    }
  };

  const handleNestedExamDataChange = (section, subsection, field, value) => {
    setExamData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value
        }
      }
    }));
  };

  const handleClinicalDetailsChange = (section, field, eye, value) => {
    setExamData(prev => ({
        ...prev,
        clinicalDetails: {
            ...prev.clinicalDetails,
            [section]: {
                ...prev.clinicalDetails[section],
                [field]: {
                    ...prev.clinicalDetails[section][field],
                    [eye]: value
                }
            }
        }
    }));
  };

  const handleSaveDraft = () => {
    if (selectedPatient) {
      saveDraftExam(selectedPatient.id, { ...examData, assignedDoctor });
      setIsDraft(true);
      setTimeout(() => setIsDraft(false), 2000);
    }
  };

  // Handle close attempts with warning
  const handleCloseAttempt = () => {
    setShowWarningDialog(true);
  };

  // Close modal and preserve examination state - Patient remains IN_PROGRESS
  const forceCloseModal = async () => {
    console.log('🔒 Closing examination modal - preserving state');
    
    try {
      // Save current examination data as draft to preserve state
      if (selectedPatient && (examData.clinicalNotes || examData.preliminaryDiagnosis || assignedDoctorId)) {
        console.log('💾 Saving draft before closing...');
        
        // Create examination data package with all current form values
        const draftExamData = {
          ...examData,
          assignedDoctor,
          assignedDoctorId,
          priorityLabel,
          allergies,
          activeTab,
          lastSavedAt: new Date().toISOString(),
          isDraft: true
        };
        
        // Save to store for persistence
        saveDraftExam(selectedPatient.id, draftExamData);
        
        // Also attempt to save to backend if patient visit ID is available
        if (selectedPatient.visitId || selectedPatient.patientVisitId) {
          try {
            await saveExaminationMutation.mutateAsync({
              patientVisitId: selectedPatient.visitId || selectedPatient.patientVisitId,
              examinationData: draftExamData
            });
            console.log('✅ Draft saved to backend successfully');
          } catch (saveError) {
            console.warn('⚠️ Could not save draft to backend:', saveError);
            // Continue anyway - store data is saved
          }
        }
        
        toast.success('Examination paused', {
          description: `Draft saved for ${selectedPatient.name}. Click "Continue Examination" to resume.`,
          duration: 4000,
        });
      } else {
        toast.info('Examination closed', {
          description: `Patient ${selectedPatient?.name || 'Unknown'} remains in examination queue.`,
          duration: 3000,
        });
      }
      
      // IMPORTANT: Do NOT revert status - patient remains IN_PROGRESS
      // IMPORTANT: Do NOT clear examination data - it's preserved in store
      // This ensures the patient stays in "Patients Under Examination" panel
      
    } catch (error) {
      console.error('❌ Error while closing examination:', error);
      toast.error('Error saving draft', {
        description: 'Examination closed but draft may not be saved',
        duration: 3000,
      });
    }

    // Reset local UI state only (data is preserved in store)
    setAttemptedComplete(false);
    setShowWarningDialog(false);
    
    // Close the modal - patient remains IN_PROGRESS and visible in examination panel
    closeModal();
    
    console.log('✅ Modal closed - patient remains IN_PROGRESS and can continue examination later');
  };

  const handleCompleteExam = async () => {
    setAttemptedComplete(true);

    // Check all required steps
    const incompleteSteps = getIncompleteSteps();
    if (incompleteSteps.length > 0) {
      const names = incompleteSteps.map(s => s.label).join(', ');
      toast.error('Incomplete Sections', {
        description: `Please complete the following sections before submitting: ${names}`,
        duration: 5000,
      });
      // Navigate to first incomplete step
      setActiveTab(incompleteSteps[0].key);
      return;
    }

    if (!assignedDoctorId) {
      toast.error('Doctor Assignment Required', {
        description: 'Please select a doctor to assign to this patient before completing the examination',
        duration: 4000,
      });
      setActiveTab('notes');
      return;
    }

    if (selectedPatient && assignedDoctorId) {
       
      // Prepare examination data for backend (without assignedDoctor since we handle that separately)
      const completionData = {
        examData,
        completedAt: new Date().toISOString(),
        status: 'completed',
        patientInfo: {
          name: selectedPatient.name,
          age: selectedPatient.age,
          gender: selectedPatient.gender,
          mrn: selectedPatient.mrn,
          token: selectedPatient.token,
          visitId: selectedPatient.visitData?.id || selectedPatient.patientVisitId || selectedPatient.queueEntryId
        },
        allergies: allergies,
        priorityLabel: priorityLabel
      };

      try {
        setCurrentCompletionStep('Processing examination...');

        // Calculate examination duration in minutes
        const examinationDurationMinutes = modalOpenTime 
          ? Math.floor((new Date() - modalOpenTime) / (1000 * 60))
          : 0;
        
        console.log('⏱️ Examination duration:', examinationDurationMinutes, 'minutes');

        // Step 1: Start examination (set status to IN_PROGRESS)
        await optometristQueueService.startExamination(
          selectedPatient.queueEntryId || selectedPatient.id
        );

        // Step 2: Assign doctor (if selected)
        if (assignedDoctorId) {
          await optometristQueueService.assignDoctorToPatient(
            selectedPatient.queueEntryId || selectedPatient.id,
            assignedDoctorId
          );
        }

        // Step 3: Complete examination with duration
        await optometristQueueService.completeExamination(
          selectedPatient.queueEntryId || selectedPatient.id, 
          {
            ...completionData,
            examinationDurationMinutes
          }
        );

        // Step 4: Refresh queue data to show updated positions
        queryClient.invalidateQueries(['optometrist-queue']);
        queryClient.invalidateQueries(['next-in-line']);
        queryClient.invalidateQueries(['optometrist-completed-exams-today']);

        // Step 5: Update UI and close modal
        setCurrentCompletionStep('');
        
        // Show success toast
        toast.success('Examination completed successfully!', {
          description: `Patient ${selectedPatient?.name} examination completed${assignedDoctor ? ` and assigned to ${assignedDoctor}` : ''}`,
          duration: 4000,
        });

        // Update store
        completeExam(selectedPatient.id, examData, { assignedDoctor: assignedDoctor });
        
        // Reset form and close modal
        setAssignedDoctorId('');
        setAssignedDoctor('');
        setAttemptedComplete(false);
        
        // Close modal after a short delay to let the user see the success message
        setTimeout(() => {
          closeModal();
        }, 500);

        
      } catch (error) {
        setCurrentCompletionStep('');
        
        // Show error toast
        toast.error('Examination completion failed', {
          description: error.response?.data?.message || error.message || 'An error occurred during the examination completion process',
          duration: 5000,
        });
      }
    }
  };

  const validateForm = () => {
    const incompleteSteps = getIncompleteSteps();
    return incompleteSteps.length === 0;
  };

  // ─── Step Navigation ───────────────────────────────────────────────
  const currentStepIndex = STEPS.findIndex(s => s.key === activeTab);

  const goToNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setActiveTab(STEPS[currentStepIndex + 1].key);
    }
  };

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setActiveTab(STEPS[currentStepIndex - 1].key);
    }
  };

  // ─── Computed Values (must be before early return) ─────────────────
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const isFormComplete = useMemo(() => {
    const incompleteSteps = getIncompleteSteps();
    return (
      incompleteSteps.length === 0 &&
      !!assignedDoctorId &&
      !!examData.preliminaryDiagnosis
    );
  }, [getIncompleteSteps, assignedDoctorId, examData.preliminaryDiagnosis]);

  // ─── Early Return (must be after all hooks) ────────────────────────
  if (!selectedPatient || !isModalOpen) return null;

  // ─── Helper Functions ───────────────────────────────────────────────
  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatWaitTime = (startTime) => {
    const waitMinutes = Math.round((new Date() - new Date(startTime)) / (1000 * 60));
    return waitMinutes < 60 ? `${waitMinutes}m` : `${Math.floor(waitMinutes / 60)}h ${waitMinutes % 60}m`;
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) {
          handleCloseAttempt();
        }
      }}>
        <DialogContent 
          className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
          style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            handleCloseAttempt();
          }}
          onPointerDownOutside={(e) => {
            e.preventDefault();
            handleCloseAttempt();
          }}
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
        {/* ─── Fixed Header ─────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-b bg-white px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                <Eye className="h-6 w-6" />
                <div>
                  <span className="text-xl">Eye Examination</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={selectedPatient.priorityColor}>
                      {selectedPatient.token}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedPatient.name} • {selectedPatient.age}y • {selectedPatient.gender}
                    </span>
                  </div>
                </div>
              </DialogTitle>
              <div className="flex items-center gap-2">
                {/* Examination Timer */}
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-base px-3 py-1">
                  <Clock className="h-4 w-4 mr-2" />
                  {formatElapsedTime(elapsedTime)}
                </Badge>
                {isDraft && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Save className="h-3 w-3 mr-1" />
                    Saved
                  </Badge>
                )}
                <Button onClick={handleSaveDraft} variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* ─── Progress Bar ─────────────────────────────────────── */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Examination Progress</span>
              <span className="font-medium">{overallProgress}% Complete</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* ─── Step Indicator Bar ───────────────────────────────── */}
          <div className="mt-4">
            <div className="flex items-center gap-1">
              {STEPS.map((step, index) => {
                const isActive = activeTab === step.key;
                const isComplete = stepStatus[step.key];
                const isRequired = step.required;
                const showError = attemptedComplete && isRequired && !isComplete;
                const StepIcon = step.icon;

                return (
                  <React.Fragment key={step.key}>
                    {/* Step Button */}
                    <button
                      onClick={() => setActiveTab(step.key)}
                      className={`
                        relative flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex-1 justify-center
                        ${isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : isComplete
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                            : showError
                              ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }
                      `}
                    >
                      {/* Completion Indicator */}
                      <span className="flex-shrink-0">
                        {isComplete && !isActive ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        ) : showError ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <StepIcon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : ''}`} />
                        )}
                      </span>
                      {/* Label */}
                      <span className="hidden lg:inline truncate">{step.label}</span>
                      <span className="lg:hidden truncate">{step.shortLabel}</span>
                      {/* Required dot */}
                      {isRequired && !isComplete && !isActive && (
                        <span className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${showError ? 'bg-red-500' : 'bg-orange-400'}`} />
                      )}
                    </button>
                    {/* Connector Line */}
                    {index < STEPS.length - 1 && (
                      <div className={`h-px w-2 flex-shrink-0 ${
                        stepStatus[STEPS[index].key] && stepStatus[STEPS[index + 1].key]
                          ? 'bg-green-300'
                          : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Scrollable Content Area ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Hidden TabsList - navigation is via our custom stepper above */}
            <TabsList className="hidden">
              {STEPS.map(step => (
                <TabsTrigger key={step.key} value={step.key}>{step.label}</TabsTrigger>
              ))}
            </TabsList>

            {/* Updated Overview Tab with Allergies Section */}
            <TabsContent value="overview" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><Label className="text-muted-foreground">Name</Label><p className="font-medium">{selectedPatient.name}</p></div>
                      <div><Label className="text-muted-foreground">Age</Label><p className="font-medium">{selectedPatient.age} years</p></div>
                      <div><Label className="text-muted-foreground">Gender</Label><p className="font-medium">{selectedPatient.gender}</p></div>
                      <div><Label className="text-muted-foreground">MRN</Label><p className="font-medium font-mono text-xs">{selectedPatient.mrn}</p></div>
                      <div><Label className="text-muted-foreground">Visit Type</Label><Badge variant="secondary">{selectedPatient.visitType}</Badge></div>
                      <div><Label className="text-muted-foreground">Wait Time</Label><p className="font-medium flex items-center gap-1"><Clock className="h-4 w-4" />{formatWaitTime(selectedPatient.waitStartTime)}</p></div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Priority & Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground">Priority Level</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={selectedPatient.priorityColor}>Priority {selectedPatient.priority}</Badge>
                        <span className="text-sm text-muted-foreground">{selectedPatient.priorityDescription}</span>
                      </div>
                    </div>
                    {selectedPatient.isEmergency && (<div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg"><AlertTriangle className="h-4 w-4 text-red-600" /><span className="text-sm font-medium text-red-800">Emergency Case</span></div>)}
                    <div>
                      <Label className="text-muted-foreground">Examination Started</Label>
                      <p className="text-sm">{selectedPatient.examStartTime ? new Date(selectedPatient.examStartTime).toLocaleTimeString() : 'Just now'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Allergies Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Known Allergies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allergiesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      Loading allergy information...
                    </div>
                  ) : allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline" className="px-3 py-1 text-sm bg-red-50 text-red-700 border-red-200">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">No known allergies recorded</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedPatient.previousVisits?.length > 0 && (<Card><CardHeader className="pb-3"><CardTitle className="text-lg">Previous Visit History</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Previous visit data would be displayed here from EMR integration</p></CardContent></Card>)}
            </TabsContent>

            {/* Visual Acuity Tab */}
            <TabsContent value="acuity" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Visual Acuity Assessment</CardTitle>
                    {attemptedComplete && !stepStatus.acuity && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Incomplete — fill all required fields
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        Distance Vision
                        <Badge variant="outline" className="text-xs font-normal">Required</Badge>
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className={attemptedComplete && !examData.visualAcuity.distance.rightEye ? 'text-red-600' : ''}>Right Eye (OD) *</Label>
                          <Select value={examData.visualAcuity.distance.rightEye} onValueChange={(value) => handleNestedExamDataChange('visualAcuity', 'distance', 'rightEye', value)}>
                            <SelectTrigger className={attemptedComplete && !examData.visualAcuity.distance.rightEye ? 'border-red-300 ring-red-200' : ''}><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent><SelectItem value="6/6">6/6</SelectItem><SelectItem value="6/9">6/9</SelectItem><SelectItem value="6/12">6/12</SelectItem><SelectItem value="6/18">6/18</SelectItem><SelectItem value="6/24">6/24</SelectItem><SelectItem value="6/36">6/36</SelectItem><SelectItem value="6/60">6/60</SelectItem><SelectItem value="CF">Counting Fingers</SelectItem><SelectItem value="HM">Hand Movements</SelectItem><SelectItem value="LP">Light Perception</SelectItem><SelectItem value="NLP">No Light Perception</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className={attemptedComplete && !examData.visualAcuity.distance.leftEye ? 'text-red-600' : ''}>Left Eye (OS) *</Label>
                          <Select value={examData.visualAcuity.distance.leftEye} onValueChange={(value) => handleNestedExamDataChange('visualAcuity', 'distance', 'leftEye', value)}>
                            <SelectTrigger className={attemptedComplete && !examData.visualAcuity.distance.leftEye ? 'border-red-300 ring-red-200' : ''}><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent><SelectItem value="6/6">6/6</SelectItem><SelectItem value="6/9">6/9</SelectItem><SelectItem value="6/12">6/12</SelectItem><SelectItem value="6/18">6/18</SelectItem><SelectItem value="6/24">6/24</SelectItem><SelectItem value="6/36">6/36</SelectItem><SelectItem value="6/60">6/60</SelectItem><SelectItem value="CF">Counting Fingers</SelectItem><SelectItem value="HM">Hand Movements</SelectItem><SelectItem value="LP">Light Perception</SelectItem><SelectItem value="NLP">No Light Perception</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Binocular</Label>
                          <Select value={examData.visualAcuity.distance.binocular} onValueChange={(value) => handleNestedExamDataChange('visualAcuity', 'distance', 'binocular', value)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent><SelectItem value="6/6">6/6</SelectItem><SelectItem value="6/9">6/9</SelectItem><SelectItem value="6/12">6/12</SelectItem><SelectItem value="6/18">6/18</SelectItem><SelectItem value="6/24">6/24</SelectItem><SelectItem value="6/36">6/36</SelectItem><SelectItem value="6/60">6/60</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        Near Vision
                        <Badge variant="outline" className="text-xs font-normal">Required</Badge>
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className={attemptedComplete && !examData.visualAcuity.near.rightEye ? 'text-red-600' : ''}>Right Eye (OD) *</Label>
                          <Select value={examData.visualAcuity.near.rightEye} onValueChange={(value) => handleNestedExamDataChange('visualAcuity', 'near', 'rightEye', value)}>
                            <SelectTrigger className={attemptedComplete && !examData.visualAcuity.near.rightEye ? 'border-red-300 ring-red-200' : ''}><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent><SelectItem value="N6">N6</SelectItem><SelectItem value="N8">N8</SelectItem><SelectItem value="N10">N10</SelectItem><SelectItem value="N12">N12</SelectItem><SelectItem value="N14">N14</SelectItem><SelectItem value="N18">N18</SelectItem><SelectItem value="N24">N24</SelectItem><SelectItem value="N36">N36</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className={attemptedComplete && !examData.visualAcuity.near.leftEye ? 'text-red-600' : ''}>Left Eye (OS) *</Label>
                          <Select value={examData.visualAcuity.near.leftEye} onValueChange={(value) => handleNestedExamDataChange('visualAcuity', 'near', 'leftEye', value)}>
                            <SelectTrigger className={attemptedComplete && !examData.visualAcuity.near.leftEye ? 'border-red-300 ring-red-200' : ''}><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent><SelectItem value="N6">N6</SelectItem><SelectItem value="N8">N8</SelectItem><SelectItem value="N10">N10</SelectItem><SelectItem value="N12">N12</SelectItem><SelectItem value="N14">N14</SelectItem><SelectItem value="N18">N18</SelectItem><SelectItem value="N24">N24</SelectItem><SelectItem value="N36">N36</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Binocular</Label>
                          <Select value={examData.visualAcuity.near.binocular} onValueChange={(value) => handleNestedExamDataChange('visualAcuity', 'near', 'binocular', value)}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent><SelectItem value="N6">N6</SelectItem><SelectItem value="N8">N8</SelectItem><SelectItem value="N10">N10</SelectItem><SelectItem value="N12">N12</SelectItem><SelectItem value="N14">N14</SelectItem><SelectItem value="N18">N18</SelectItem><SelectItem value="N24">N24</SelectItem><SelectItem value="N36">N36</SelectItem></SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Best Corrected Visual Acuity (BCVA) */}
                  <div className="space-y-4">
                    <h4 className="font-medium">
                      Best Corrected Visual Acuity (BCVA)
                      <span className="ml-2 text-xs font-normal text-muted-foreground">— Vision with best correction (glasses/contact lenses)</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Right Eye (OD)</Label>
                        <Select value={examData.visualAcuity.aided.rightEye} onValueChange={(value) => handleNestedExamDataChange('visualAcuity', 'aided', 'rightEye', value)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="6/6">6/6</SelectItem><SelectItem value="6/9">6/9</SelectItem><SelectItem value="6/12">6/12</SelectItem><SelectItem value="6/18">6/18</SelectItem><SelectItem value="6/24">6/24</SelectItem><SelectItem value="6/36">6/36</SelectItem><SelectItem value="6/60">6/60</SelectItem><SelectItem value="CF">Counting Fingers</SelectItem><SelectItem value="HM">Hand Movements</SelectItem><SelectItem value="LP">Light Perception</SelectItem><SelectItem value="NLP">No Light Perception</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Left Eye (OS)</Label>
                        <Select value={examData.visualAcuity.aided.leftEye} onValueChange={(value) => handleNestedExamDataChange('visualAcuity', 'aided', 'leftEye', value)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="6/6">6/6</SelectItem><SelectItem value="6/9">6/9</SelectItem><SelectItem value="6/12">6/12</SelectItem><SelectItem value="6/18">6/18</SelectItem><SelectItem value="6/24">6/24</SelectItem><SelectItem value="6/36">6/36</SelectItem><SelectItem value="6/60">6/60</SelectItem><SelectItem value="CF">Counting Fingers</SelectItem><SelectItem value="HM">Hand Movements</SelectItem><SelectItem value="LP">Light Perception</SelectItem><SelectItem value="NLP">No Light Perception</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Binocular</Label>
                        <Select value={examData.visualAcuity.aided.binocular} onValueChange={(value) => handleNestedExamDataChange('visualAcuity', 'aided', 'binocular', value)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent><SelectItem value="6/6">6/6</SelectItem><SelectItem value="6/9">6/9</SelectItem><SelectItem value="6/12">6/12</SelectItem><SelectItem value="6/18">6/18</SelectItem><SelectItem value="6/24">6/24</SelectItem><SelectItem value="6/36">6/36</SelectItem><SelectItem value="6/60">6/60</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Refraction Tab */}
            <TabsContent value="refraction" className="space-y-4 mt-0">
               <Card>
                 <CardHeader>
                   <div className="flex items-center justify-between">
                     <CardTitle>Refraction Details</CardTitle>
                     {attemptedComplete && !stepStatus.refraction && (
                       <Badge variant="destructive" className="text-xs">
                         <AlertTriangle className="h-3 w-3 mr-1" />
                         Incomplete — fill all required fields
                       </Badge>
                     )}
                   </div>
                 </CardHeader>
                 <CardContent className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-4">
                       <h4 className="font-medium">Right Eye (OD)</h4>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <Label className={attemptedComplete && !examData.refraction.sphere.rightEye ? 'text-red-600' : ''}>Sphere (D) *</Label>
                           <Input type="number" step="0.25" min="-20" max="20" value={examData.refraction.sphere.rightEye} onChange={(e) => handleNestedExamDataChange('refraction', 'sphere', 'rightEye', e.target.value)} placeholder="0.00" className={attemptedComplete && !examData.refraction.sphere.rightEye ? 'border-red-300' : ''} />
                         </div>
                         <div>
                           <Label className={attemptedComplete && !examData.refraction.cylinder.rightEye ? 'text-red-600' : ''}>Cylinder (D) *</Label>
                           <Input type="number" step="0.25" min="-6" max="6" value={examData.refraction.cylinder.rightEye} onChange={(e) => handleNestedExamDataChange('refraction', 'cylinder', 'rightEye', e.target.value)} placeholder="0.00" className={attemptedComplete && !examData.refraction.cylinder.rightEye ? 'border-red-300' : ''} />
                         </div>
                         <div>
                           <Label className={attemptedComplete && !examData.refraction.axis.rightEye ? 'text-red-600' : ''}>Axis (°) *</Label>
                           <Input type="number" min="0" max="180" value={examData.refraction.axis.rightEye} onChange={(e) => handleNestedExamDataChange('refraction', 'axis', 'rightEye', e.target.value)} placeholder="0" className={attemptedComplete && !examData.refraction.axis.rightEye ? 'border-red-300' : ''} />
                         </div>
                         <div><Label>Add (D)</Label><Input type="number" step="0.25" min="0" max="4" value={examData.refraction.add.rightEye} onChange={(e) => handleNestedExamDataChange('refraction', 'add', 'rightEye', e.target.value)} placeholder="0.00"/></div>
                       </div>
                     </div>
                     <div className="space-y-4">
                       <h4 className="font-medium">Left Eye (OS)</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className={attemptedComplete && !examData.refraction.sphere.leftEye ? 'text-red-600' : ''}>Sphere (D) *</Label>
                            <Input type="number" step="0.25" min="-20" max="20" value={examData.refraction.sphere.leftEye} onChange={(e) => handleNestedExamDataChange('refraction', 'sphere', 'leftEye', e.target.value)} placeholder="0.00" className={attemptedComplete && !examData.refraction.sphere.leftEye ? 'border-red-300' : ''} />
                          </div>
                          <div>
                            <Label className={attemptedComplete && !examData.refraction.cylinder.leftEye ? 'text-red-600' : ''}>Cylinder (D) *</Label>
                            <Input type="number" step="0.25" min="-6" max="6" value={examData.refraction.cylinder.leftEye} onChange={(e) => handleNestedExamDataChange('refraction', 'cylinder', 'leftEye', e.target.value)} placeholder="0.00" className={attemptedComplete && !examData.refraction.cylinder.leftEye ? 'border-red-300' : ''} />
                          </div>
                          <div>
                            <Label className={attemptedComplete && !examData.refraction.axis.leftEye ? 'text-red-600' : ''}>Axis (°) *</Label>
                            <Input type="number" min="0" max="180" value={examData.refraction.axis.leftEye} onChange={(e) => handleNestedExamDataChange('refraction', 'axis', 'leftEye', e.target.value)} placeholder="0" className={attemptedComplete && !examData.refraction.axis.leftEye ? 'border-red-300' : ''} />
                          </div>
                          <div><Label>Add (D)</Label><Input type="number" step="0.25" min="0" max="4" value={examData.refraction.add.leftEye} onChange={(e) => handleNestedExamDataChange('refraction', 'add', 'leftEye', e.target.value)} placeholder="0.00"/></div>
                       </div>
                     </div>
                   </div>
                   <Separator />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div><Label>Pupillary Distance (PD)</Label><Input type="number" min="50" max="80" value={examData.refraction.pd} onChange={(e) => handleExamDataChange('refraction', 'pd', e.target.value)} placeholder="65"/></div>
                   </div>
                 </CardContent>
               </Card>
            </TabsContent>

            {/* Tonometry Tab */}
            <TabsContent value="tonometry" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Intraocular Pressure (IOP)</CardTitle>
                    {attemptedComplete && !stepStatus.tonometry && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Incomplete — fill all required fields
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className={attemptedComplete && !examData.tonometry.iop.rightEye ? 'text-red-600' : ''}>Right Eye IOP (mmHg) *</Label>
                      <Input type="number" min="5" max="50" value={examData.tonometry.iop.rightEye} onChange={(e) => handleNestedExamDataChange('tonometry', 'iop', 'rightEye', e.target.value)} placeholder="15" className={attemptedComplete && !examData.tonometry.iop.rightEye ? 'border-red-300' : ''} />
                      {examData.tonometry.iop.rightEye && (<p className={`text-xs mt-1 ${examData.tonometry.iop.rightEye > 21 || examData.tonometry.iop.rightEye < 10 ? 'text-red-600' : 'text-green-600'}`}>{examData.tonometry.iop.rightEye > 21 ? 'High IOP' : examData.tonometry.iop.rightEye < 10 ? 'Low IOP' : 'Normal range'}</p>)}
                    </div>
                    <div>
                      <Label className={attemptedComplete && !examData.tonometry.iop.leftEye ? 'text-red-600' : ''}>Left Eye IOP (mmHg) *</Label>
                      <Input type="number" min="5" max="50" value={examData.tonometry.iop.leftEye} onChange={(e) => handleNestedExamDataChange('tonometry', 'iop', 'leftEye', e.target.value)} placeholder="15" className={attemptedComplete && !examData.tonometry.iop.leftEye ? 'border-red-300' : ''} />
                      {examData.tonometry.iop.leftEye && (<p className={`text-xs mt-1 ${examData.tonometry.iop.leftEye > 21 || examData.tonometry.iop.leftEye < 10 ? 'text-red-600' : 'text-green-600'}`}>{examData.tonometry.iop.leftEye > 21 ? 'High IOP' : examData.tonometry.iop.leftEye < 10 ? 'Low IOP' : 'Normal range'}</p>)}
                    </div>
                    <div>
                      <Label>Method *</Label>
                      <Select value={examData.tonometry.method} onValueChange={(value) => handleExamDataChange('tonometry', 'method', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="goldmann">Goldmann Applanation</SelectItem><SelectItem value="nctonometry">Non-contact Tonometry</SelectItem><SelectItem value="perkins">Perkins Handheld</SelectItem><SelectItem value="tono-pen">Tono-Pen</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Additional Tests Tab */}
            <TabsContent value="tests" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Pupil & Motility</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div><Label>Pupil Reaction *</Label><Select value={examData.additionalTests.pupilReaction} onValueChange={(value) => handleExamDataChange('additionalTests', 'pupilReaction', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal">Normal (PERRL)</SelectItem><SelectItem value="sluggish">Sluggish</SelectItem><SelectItem value="fixed">Fixed</SelectItem><SelectItem value="rapd">RAPD Present</SelectItem></SelectContent></Select></div>
                    <div><Label>Extraocular Movements *</Label><Select value={examData.additionalTests.extraocularMovements} onValueChange={(value) => handleExamDataChange('additionalTests', 'extraocularMovements', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="full">Full in all directions</SelectItem><SelectItem value="restricted">Restricted</SelectItem><SelectItem value="paralysis">Paralysis present</SelectItem></SelectContent></Select></div>
                    <div><Label>Cover Test *</Label><Select value={examData.additionalTests.coverTest} onValueChange={(value) => handleExamDataChange('additionalTests', 'coverTest', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="orthophoric">Orthophoric</SelectItem><SelectItem value="esotropia">Esotropia</SelectItem><SelectItem value="exotropia">Exotropia</SelectItem><SelectItem value="hypertropia">Hypertropia</SelectItem><SelectItem value="phoria">Phoria</SelectItem></SelectContent></Select></div>
                    <div>
                      <Label>Eye Alignment</Label>
                      <Select value={examData.additionalTests.eyeAlignment} onValueChange={(value) => handleExamDataChange('additionalTests', 'eyeAlignment', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal (Orthophoric)</SelectItem>
                          <SelectItem value="esotropia">Esotropia</SelectItem>
                          <SelectItem value="exotropia">Exotropia</SelectItem>
                          <SelectItem value="hypertropia">Hypertropia</SelectItem>
                          <SelectItem value="phoria">Phoria</SelectItem>
                          <SelectItem value="strabismus">Strabismus (Other)</SelectItem>
                          <SelectItem value="nystagmus">Nystagmus</SelectItem>
                          <SelectItem value="pseudostrabismus">Pseudostrabismus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-lg">Vision & Anterior Segment</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div><Label>Color Vision *</Label><Select value={examData.additionalTests.colorVision} onValueChange={(value) => handleExamDataChange('additionalTests', 'colorVision', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="red-green-deficiency">Red-Green Deficiency</SelectItem><SelectItem value="blue-yellow-deficiency">Blue-Yellow Deficiency</SelectItem><SelectItem value="total-color-blindness">Total Color Blindness</SelectItem></SelectContent></Select></div>
                    <div><Label>Anterior Segment *</Label><Select value={examData.additionalTests.anteriorSegment} onValueChange={(value) => handleExamDataChange('additionalTests', 'anteriorSegment', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="cataract">Cataract</SelectItem><SelectItem value="corneal-opacity">Corneal Opacity</SelectItem><SelectItem value="conjunctivitis">Conjunctivitis</SelectItem><SelectItem value="pterygium">Pterygium</SelectItem><SelectItem value="dry-eye">Dry Eye</SelectItem></SelectContent></Select></div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Clinical Details Tab */}
            <TabsContent value="clinicalDetails" className="space-y-4 pt-4 mt-0">
              <Collapsible open={isPreOpOpen} onOpenChange={setIsPreOpOpen}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle>Pre-Operative Parameters</CardTitle>
                          <Badge variant="outline" className="text-xs">Optional</Badge>
                        </div>
                        <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${
                          isPreOpOpen ? 'transform rotate-180' : ''
                        }`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 font-semibold border-b pb-2 mb-4">
                            <Label>Parameter</Label>
                            <Label>Right Eye (OD)</Label>
                            <Label>Left Eye (OS)</Label>
                        </div>
                        {Object.entries(examData.clinicalDetails.preOpParams).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-x-4 items-center py-1.5">
                                <Label className="capitalize font-normal text-sm">{key.replace(/([A-Z])/g, ' $1')}</Label>
                                {key === 'anyOtherDetails' ? (
                                    <>
                                        <Textarea rows={1} value={value.rightEye} onChange={(e) => handleClinicalDetailsChange('preOpParams', key, 'rightEye', e.target.value)} />
                                        <Textarea rows={1} value={value.leftEye} onChange={(e) => handleClinicalDetailsChange('preOpParams', key, 'leftEye', e.target.value)} />
                                    </>
                                ) : (
                                    <>
                                        <Input value={value.rightEye} onChange={(e) => handleClinicalDetailsChange('preOpParams', key, 'rightEye', e.target.value)} />
                                        <Input value={value.leftEye} onChange={(e) => handleClinicalDetailsChange('preOpParams', key, 'leftEye', e.target.value)} />
                                    </>
                                )}
                            </div>
                        ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
              <Card>
                  <CardHeader><CardTitle>Slit Lamp Examination</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {Object.entries(examData.clinicalDetails.slitLampFindings).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                              <Label className="capitalize font-semibold">{key}</Label>
                              <div className="space-y-2">
                                  <Select onValueChange={(val) => handleClinicalDetailsChange('slitLampFindings', key, 'rightEye', val)} value={value.rightEye}>
                                      <SelectTrigger><SelectValue placeholder="Right Eye (OD)" /></SelectTrigger>
                                      <SelectContent>
                                          {key === 'eyelids' || key === 'lens' ? <><SelectItem value="normal">Normal</SelectItem><SelectItem value="abnormal">Abnormal</SelectItem></> : null}
                                          {key === 'conjunctiva' ? <><SelectItem value="normal">Normal</SelectItem><SelectItem value="sch">SCH</SelectItem><SelectItem value="congestion">Congestion</SelectItem><SelectItem value="mass">Mass</SelectItem></> : null}
                                          {key === 'cornea' ? <><SelectItem value="clear">Clear</SelectItem><SelectItem value="hazy">Hazy</SelectItem></> : null}
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>
                      ))}
                  </CardContent>
              </Card>
            </TabsContent>

            {/* Notes & Decision Tab */}
            <TabsContent value="notes" className="space-y-4 mt-0">
               <div className="grid grid-cols-1 gap-4">
                 <Card>
                   <CardHeader>
                     <div className="flex items-center justify-between">
                       <CardTitle>Clinical Notes & Findings</CardTitle>
                       {attemptedComplete && !stepStatus.notes && (
                         <Badge variant="destructive" className="text-xs">
                           <AlertTriangle className="h-3 w-3 mr-1" />
                           Incomplete — fill all required fields
                         </Badge>
                       )}
                     </div>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div><Label>Clinical Notes</Label><Textarea value={examData.clinicalNotes} onChange={(e) => setExamData(prev => ({ ...prev, clinicalNotes: e.target.value }))} placeholder="Enter detailed clinical observations, patient symptoms, examination findings..." rows={4}/></div>
                     <div>
                       <Label className={attemptedComplete && !examData.preliminaryDiagnosis ? 'text-red-600' : ''}>Preliminary Diagnosis *</Label>
                       <Select value={examData.preliminaryDiagnosis} onValueChange={(value) => setExamData(prev => ({ ...prev, preliminaryDiagnosis: value }))}>
                         <SelectTrigger className={attemptedComplete && !examData.preliminaryDiagnosis ? 'border-red-300' : ''}><SelectValue placeholder="Select preliminary diagnosis" /></SelectTrigger>
                         <SelectContent><SelectItem value="refractive-error">Refractive Error</SelectItem><SelectItem value="cataract-suspect">Cataract Suspect</SelectItem><SelectItem value="glaucoma-suspect">Glaucoma Suspect</SelectItem><SelectItem value="diabetic-retinopathy">Diabetic Retinopathy Suspect</SelectItem><SelectItem value="dry-eye">Dry Eye Syndrome</SelectItem><SelectItem value="conjunctivitis">Conjunctivitis</SelectItem><SelectItem value="normal">Normal Examination</SelectItem><SelectItem value="other">Other - See notes</SelectItem></SelectContent>
                       </Select>
                     </div>
                   </CardContent>
                 </Card>
                 
                 {/* Priority Label Section */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <AlertTriangle className="h-5 w-5" />
                       Priority Label
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div>
                       <Label>Assign Priority Label *</Label>
                       <Select value={priorityLabel} onValueChange={setPriorityLabel}>
                         <SelectTrigger>
                           <SelectValue placeholder="Select priority label" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="EMERGENCY">EMERGENCY</SelectItem>
                           <SelectItem value="PRIORITY">PRIORITY</SelectItem>
                           <SelectItem value="REFERRAL">REFERRAL</SelectItem>
                           <SelectItem value="FOLLOWUP">FOLLOW UP</SelectItem>
                           <SelectItem value="ROUTINE">ROUTINE</SelectItem>
                           <SelectItem value="PREPOSTOP">PRE/POST OP</SelectItem>
                         </SelectContent>
                       </Select>
                       <p className="text-xs text-muted-foreground mt-1">
                         This priority label will be assigned to the patient in the doctor's queue.
                       </p>
                     </div>
                     {priorityLabel && (
                       <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                         <AlertTriangle className="h-4 w-4 text-orange-600" />
                         <span className="text-sm text-orange-800">
                           Patient will be marked as <strong>{priorityLabel}</strong>
                         </span>
                       </div>
                     )}
                   </CardContent>
                 </Card>

                 {/* Doctor Assignment Section */}
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <UserCheck className="h-5 w-5" />
                       Doctor Assignment
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div>
                       <Label className={attemptedComplete && !assignedDoctorId ? 'text-red-600' : ''}>Assign Doctor *</Label>
                       <Select value={assignedDoctorId} onValueChange={handleDoctorSelection} disabled={fetchDoctorsMutation.isPending}>
                         <SelectTrigger className={attemptedComplete && !assignedDoctorId ? 'border-red-300' : ''}>
                           <SelectValue placeholder={fetchDoctorsMutation.isPending ? "Loading doctors..." : "Select doctor to assign to this patient"} />
                         </SelectTrigger>
                         <SelectContent>
                           {availableDoctors.map((doctor) => (
                             <SelectItem key={doctor.id} value={doctor.id}>
                               <div className="flex flex-col">
                                 <span className="font-medium">{doctor.name}</span>
                                 {(doctor.department || doctor.specialization) && (
                                   <span className="text-xs text-muted-foreground">
                                     {doctor.specialization || doctor.department}
                                   </span>
                                 )}
                               </div>
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       <p className="text-xs text-muted-foreground mt-1">
                         This patient will be assigned to the selected doctor for further consultation and treatment.
                       </p>
                     </div>
                     {assignedDoctor && (
                       <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                         <UserCheck className="h-4 w-4 text-blue-600" />
                         <span className="text-sm text-blue-800">
                           Patient will be assigned to <strong>{assignedDoctor}</strong>
                         </span>
                       </div>
                     )}
                   </CardContent>
                 </Card>

                 {/* Completion Summary - only visible on last step */}
                 {overallProgress < 100 && (
                   <Card className="border-orange-200 bg-orange-50/50">
                     <CardContent className="pt-4">
                       <div className="flex items-start gap-3">
                         <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                         <div>
                           <p className="text-sm font-medium text-orange-800">Sections Remaining</p>
                           <div className="flex flex-wrap gap-1.5 mt-2">
                             {getIncompleteSteps().map(step => (
                               <button
                                 key={step.key}
                                 onClick={() => setActiveTab(step.key)}
                                 className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors cursor-pointer border border-orange-200"
                               >
                                 <Circle className="h-2 w-2 fill-current" />
                                 {step.label}
                               </button>
                             ))}
                           </div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 )}

                 {overallProgress === 100 && (
                   <Card className="border-green-200 bg-green-50/50">
                     <CardContent className="pt-4">
                       <div className="flex items-center gap-3">
                         <CheckCircle className="h-5 w-5 text-green-600" />
                         <p className="text-sm font-medium text-green-800">
                           All required sections are complete. You can now submit the examination.
                         </p>
                       </div>
                     </CardContent>
                   </Card>
                 )}
               </div>
            </TabsContent>

          </Tabs>
        </div>

        {/* ─── Fixed Footer ─────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Cancel & Save Draft */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleCloseAttempt}
                disabled={saveExaminationMutation.isPending || completeExaminationMutation.isPending || !!currentCompletionStep}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={saveExaminationMutation.isPending || completeExaminationMutation.isPending || !!currentCompletionStep}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            </div>

            {/* Center: Step Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevStep}
                disabled={isFirstStep}
                className="gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground px-2 tabular-nums">
                Step {currentStepIndex + 1} of {STEPS.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextStep}
                disabled={isLastStep}
                className="gap-1.5"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Right: Complete */}
            <Button
              onClick={handleCompleteExam}
              disabled={
                saveExaminationMutation.isPending ||
                completeExaminationMutation.isPending ||
                !!currentCompletionStep ||
                !isFormComplete
              }
              className={`
                transition-all duration-200
                ${
                  isFormComplete
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300"
                }
              `}
            >
              {(saveExaminationMutation.isPending ||
                completeExaminationMutation.isPending ||
                currentCompletionStep) ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {currentCompletionStep ||
                    (saveExaminationMutation.isPending
                      ? "Saving Data..."
                      : "Completing Examination...")}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Examination
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Warning Dialog - Updated to reflect state preservation behavior */}
    <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-500" />
            Pause Examination?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              You are currently examining <strong>{selectedPatient?.name}</strong>.
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 font-medium mb-2">What happens when you close:</p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Your current progress will be <strong>saved as draft</strong></li>
                <li>Patient remains in "Patients Under Examination" panel</li>
                <li>You can click <strong>"Continue Examination"</strong> anytime to resume</li>
                <li>All entered data will be restored when you continue</li>
              </ul>
            </div>
            <div className="text-amber-700 text-sm font-medium flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>The examination will remain incomplete until you explicitly complete it.</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowWarningDialog(false)}>
            Continue Examination
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={forceCloseModal}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Pause & Save Draft
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default ExaminationModal;
