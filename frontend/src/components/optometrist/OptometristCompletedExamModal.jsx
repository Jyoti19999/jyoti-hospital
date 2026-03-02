import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  Eye,
  Save,
  X,
  User,
  Target,
  Gauge,
  Grid,
  ClipboardPlus,
  FileText,
  ChevronDown,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { optometristQueueService } from '@/services/optometristQueueService';
import { useQueryClient } from '@tanstack/react-query';

// ─── Default Exam Data Structure ────────────────────────────────────
const DEFAULT_EXAM_DATA = {
  visualAcuity: {
    distance: { rightEye: '', leftEye: '', binocular: '' },
    near: { rightEye: '', leftEye: '', binocular: '' },
  },
  refraction: {
    sphere: { rightEye: '', leftEye: '' },
    cylinder: { rightEye: '', leftEye: '' },
    axis: { rightEye: '', leftEye: '' },
    add: { rightEye: '', leftEye: '' },
    pd: '',
  },
  tonometry: {
    iop: { rightEye: '', leftEye: '' },
    method: 'goldmann',
    time: '',
  },
  additionalTests: {
    pupilReaction: 'normal',
    colorVision: 'normal',
    eyeAlignment: 'normal',
    anteriorSegment: 'normal',
    extraocularMovements: 'full',
    coverTest: 'orthophoric',
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
    },
  },
  clinicalNotes: '',
  preliminaryDiagnosis: '',
  additionalNotes: '',
};

// ─── Select Option Constants ─────────────────────────────────────────
const DISTANCE_OPTIONS = [
  { value: '6/6', label: '6/6' },
  { value: '6/9', label: '6/9' },
  { value: '6/12', label: '6/12' },
  { value: '6/18', label: '6/18' },
  { value: '6/24', label: '6/24' },
  { value: '6/36', label: '6/36' },
  { value: '6/60', label: '6/60' },
  { value: 'CF', label: 'Counting Fingers' },
  { value: 'HM', label: 'Hand Movements' },
  { value: 'LP', label: 'Light Perception' },
  { value: 'NLP', label: 'No Light Perception' },
];

const NEAR_OPTIONS = [
  { value: 'N6', label: 'N6' },
  { value: 'N8', label: 'N8' },
  { value: 'N10', label: 'N10' },
  { value: 'N12', label: 'N12' },
  { value: 'N14', label: 'N14' },
  { value: 'N18', label: 'N18' },
  { value: 'N24', label: 'N24' },
  { value: 'N36', label: 'N36' },
];

const TONOMETRY_METHODS = [
  { value: 'goldmann', label: 'Goldmann Applanation' },
  { value: 'nctonometry', label: 'Non-contact Tonometry' },
  { value: 'perkins', label: 'Perkins Handheld' },
  { value: 'tono-pen', label: 'Tono-Pen' },
];

const PUPIL_OPTIONS = [
  { value: 'normal', label: 'Normal (PERRL)' },
  { value: 'sluggish', label: 'Sluggish' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'rapd', label: 'RAPD Present' },
];

const EOM_OPTIONS = [
  { value: 'full', label: 'Full in all directions' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'paralysis', label: 'Paralysis present' },
];

const COVER_TEST_OPTIONS = [
  { value: 'orthophoric', label: 'Orthophoric' },
  { value: 'esotropia', label: 'Esotropia' },
  { value: 'exotropia', label: 'Exotropia' },
  { value: 'hypertropia', label: 'Hypertropia' },
  { value: 'phoria', label: 'Phoria' },
];

const COLOR_VISION_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'red-green-deficiency', label: 'Red-Green Deficiency' },
  { value: 'blue-yellow-deficiency', label: 'Blue-Yellow Deficiency' },
  { value: 'total-color-blindness', label: 'Total Color Blindness' },
];

const ANTERIOR_SEGMENT_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'cataract', label: 'Cataract' },
  { value: 'corneal-opacity', label: 'Corneal Opacity' },
  { value: 'conjunctivitis', label: 'Conjunctivitis' },
  { value: 'pterygium', label: 'Pterygium' },
  { value: 'dry-eye', label: 'Dry Eye' },
];

const PRELIMINARY_DIAGNOSIS_OPTIONS = [
  { value: 'refractive-error', label: 'Refractive Error' },
  { value: 'cataract-suspect', label: 'Cataract Suspect' },
  { value: 'glaucoma-suspect', label: 'Glaucoma Suspect' },
  { value: 'diabetic-retinopathy', label: 'Diabetic Retinopathy Suspect' },
  { value: 'dry-eye', label: 'Dry Eye Syndrome' },
  { value: 'conjunctivitis', label: 'Conjunctivitis' },
  { value: 'normal', label: 'Normal Examination' },
  { value: 'other', label: 'Other - See notes' },
];

const SLIT_LAMP_OPTIONS = {
  eyelids: [
    { value: 'normal', label: 'Normal' },
    { value: 'abnormal', label: 'Abnormal' },
  ],
  conjunctiva: [
    { value: 'normal', label: 'Normal' },
    { value: 'sch', label: 'SCH' },
    { value: 'congestion', label: 'Congestion' },
    { value: 'mass', label: 'Mass' },
  ],
  cornea: [
    { value: 'clear', label: 'Clear' },
    { value: 'hazy', label: 'Hazy' },
  ],
  lens: [
    { value: 'normal', label: 'Normal' },
    { value: 'abnormal', label: 'Abnormal' },
  ],
};

// ─── Helper: deep merge exam data ────────────────────────────────────
const deepMerge = (defaults, source) => {
  if (!source) return { ...defaults };
  const result = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (source[key] !== undefined) {
      if (
        typeof defaults[key] === 'object' &&
        defaults[key] !== null &&
        !Array.isArray(defaults[key])
      ) {
        result[key] = deepMerge(defaults[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
};

// ─── Helper: extract exam data from raw API response ─────────────────
const extractExamData = (rawExam) => {
  if (!rawExam) return { ...DEFAULT_EXAM_DATA };

  // Try nested paths first, then direct fields
  const examData =
    rawExam.examinationData?.examData ||
    rawExam.examinationData ||
    rawExam.examData ||
    rawExam;

  const merged = deepMerge(DEFAULT_EXAM_DATA, examData);

  // Explicitly resolve text-based fields from ALL possible storage paths.
  // The backend may store these at different nesting levels depending on
  // which save flow was used (new format vs old format).
  const pickFirst = (...candidates) => candidates.find((v) => v !== undefined && v !== null && v !== '') ?? '';

  const clinicalNotes = pickFirst(
    rawExam.examinationData?.examData?.clinicalNotes,
    rawExam.examinationData?.clinicalNotes,
    rawExam.examData?.clinicalNotes,
    rawExam.clinicalNotes,
    merged.clinicalNotes,
  );

  const additionalNotes = pickFirst(
    rawExam.examinationData?.examData?.additionalNotes,
    rawExam.examinationData?.additionalNotes,
    rawExam.examData?.additionalNotes,
    rawExam.additionalNotes,
    merged.additionalNotes,
  );

  const preliminaryDiagnosis = pickFirst(
    rawExam.examinationData?.examData?.preliminaryDiagnosis,
    rawExam.examinationData?.preliminaryDiagnosis,
    rawExam.examData?.preliminaryDiagnosis,
    rawExam.preliminaryDiagnosis,
    merged.preliminaryDiagnosis,
  );

  return { ...merged, clinicalNotes, additionalNotes, preliminaryDiagnosis };
};

// ─── Helper: extract patient info from raw exam ──────────────────────
const extractPatientInfo = (rawExam) => {
  if (!rawExam) return {};

  // New format (flat)
  if (rawExam.patientName) {
    const age = rawExam.dateOfBirth
      ? new Date().getFullYear() - new Date(rawExam.dateOfBirth).getFullYear()
      : 'N/A';
    return {
      name: rawExam.patientName,
      mrn: rawExam.patientNumber,
      age,
      gender: rawExam.gender || 'N/A',
      completedAt: rawExam.completedAt,
      durationMinutes: rawExam.durationMinutes || 0,
      assignedDoctor: rawExam.assignedDoctor?.fullName ||
        (rawExam.assignedDoctor?.firstName && rawExam.assignedDoctor?.lastName
          ? `${rawExam.assignedDoctor.firstName} ${rawExam.assignedDoctor.lastName}`
          : ''),
      priorityLabel: rawExam.priorityLabel || 'ROUTINE',
    };
  }

  // Old format (nested patientVisit)
  if (rawExam.patientVisit) {
    const patient = rawExam.patientVisit.patient || {};
    const age = patient.dateOfBirth
      ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
      : 'N/A';
    return {
      name: `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
      mrn: patient.patientNumber,
      age,
      gender: patient.gender || 'N/A',
      completedAt: rawExam.createdAt || rawExam.completedAt,
      durationMinutes: rawExam.durationMinutes || 0,
      assignedDoctor: rawExam.assignedDoctor?.fullName ||
        (rawExam.assignedDoctor?.firstName && rawExam.assignedDoctor?.lastName
          ? `${rawExam.assignedDoctor.firstName} ${rawExam.assignedDoctor.lastName}`
          : ''),
      priorityLabel: rawExam.priorityLabel || 'ROUTINE',
    };
  }

  // Store format (already formatted)
  return {
    name: rawExam.name || 'Unknown',
    mrn: rawExam.mrn || 'N/A',
    age: rawExam.age || 'N/A',
    gender: rawExam.gender || 'N/A',
    completedAt: rawExam.completedAt,
    durationMinutes: rawExam.durationMinutes || 0,
    assignedDoctor: rawExam.assignedDoctor || '',
    priorityLabel: rawExam.priorityLabel || 'ROUTINE',
  };
};

// ─── Component ───────────────────────────────────────────────────────
const OptometristCompletedExamModal = ({
  isOpen,
  onClose,
  exam,
  mode = 'view',
  onSave,
}) => {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isPreOpOpen, setIsPreOpOpen] = useState(false);
  const queryClient = useQueryClient();

  const isViewMode = mode === 'view';

  // ─── Form State ────────────────────────────────────────────────────
  const [examFormData, setExamFormData] = useState({ ...DEFAULT_EXAM_DATA });

  // ─── Initialize from raw exam data ─────────────────────────────────
  useEffect(() => {
    if (isOpen && exam) {
      const parsed = extractExamData(exam);
      setExamFormData(parsed);
      setActiveTab('overview');
      setIsPreOpOpen(false);
    }
  }, [isOpen, exam]);

  // ─── Change Handlers ──────────────────────────────────────────────
  const handleChange = (section, field, value) => {
    setExamFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleNestedChange = (section, subsection, field, value) => {
    setExamFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section][subsection],
          [field]: value,
        },
      },
    }));
  };

  const handleClinicalChange = (section, field, eye, value) => {
    setExamFormData((prev) => ({
      ...prev,
      clinicalDetails: {
        ...prev.clinicalDetails,
        [section]: {
          ...prev.clinicalDetails[section],
          [field]: {
            ...prev.clinicalDetails[section][field],
            [eye]: value,
          },
        },
      },
    }));
  };

  const handleTopLevelChange = (field, value) => {
    setExamFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Save Handler ─────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      const patientVisitId =
        exam.patientVisitId ||
        exam.visitId ||
        exam.patientVisit?.id ||
        exam.id;

      if (!patientVisitId) {
        toast.error('Unable to identify examination for saving');
        return;
      }

      await optometristQueueService.saveExaminationData(patientVisitId, {
        examData: examFormData,
        status: 'completed',
        completedAt: exam.completedAt || new Date().toISOString(),
      });

      toast.success('Examination updated successfully');
      queryClient.invalidateQueries(['optometrist-completed-exams-today']);
      onSave?.();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save examination');
    } finally {
      setSaving(false);
    }
  };

  // ─── Computed Patient Info ─────────────────────────────────────────
  const patientInfo = extractPatientInfo(exam);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Render Helpers ────────────────────────────────────────────────
  const renderSelectField = (label, value, onValueChange, options, placeholder = 'Select') => (
    <div>
      <Label>{label}</Label>
      <Select value={value || ''} onValueChange={onValueChange} disabled={isViewMode}>
        <SelectTrigger className={isViewMode ? 'bg-gray-50' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderInputField = (label, value, onChange, props = {}) => (
    <div>
      <Label>{label}</Label>
      <Input
        value={value || ''}
        onChange={onChange}
        disabled={isViewMode}
        className={isViewMode ? 'bg-gray-50' : ''}
        {...props}
      />
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
      >
        {/* ─── Header ──────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-b bg-white px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-teal-600" />
                <div>
                  <span className="text-xl">
                    {isViewMode ? 'View' : 'Edit'} Optometrist Examination
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {patientInfo.name} • MRN: {patientInfo.mrn} •{' '}
                      {patientInfo.age}y • {patientInfo.gender}
                    </span>
                  </div>
                </div>
              </DialogTitle>
              <Badge variant={isViewMode ? 'secondary' : 'default'}>
                {isViewMode ? 'Read Only' : 'Edit Mode'}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* ─── Tab Navigation ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-4">
              <TabsTrigger value="overview" className="text-xs px-1.5">
                <User className="h-3.5 w-3.5 mr-1" />
                <span className="hidden lg:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="acuity" className="text-xs px-1.5">
                <Target className="h-3.5 w-3.5 mr-1" />
                <span className="hidden lg:inline">Acuity</span>
              </TabsTrigger>
              <TabsTrigger value="refraction" className="text-xs px-1.5">
                <Eye className="h-3.5 w-3.5 mr-1" />
                <span className="hidden lg:inline">Refraction</span>
              </TabsTrigger>
              <TabsTrigger value="tonometry" className="text-xs px-1.5">
                <Gauge className="h-3.5 w-3.5 mr-1" />
                <span className="hidden lg:inline">Tonometry</span>
              </TabsTrigger>
              <TabsTrigger value="tests" className="text-xs px-1.5">
                <Grid className="h-3.5 w-3.5 mr-1" />
                <span className="hidden lg:inline">Tests</span>
              </TabsTrigger>
              <TabsTrigger value="clinical" className="text-xs px-1.5">
                <ClipboardPlus className="h-3.5 w-3.5 mr-1" />
                <span className="hidden lg:inline">Clinical</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-xs px-1.5">
                <FileText className="h-3.5 w-3.5 mr-1" />
                <span className="hidden lg:inline">Notes</span>
              </TabsTrigger>
            </TabsList>

            {/* ─── Overview Tab ─────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Patient Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Name</Label>
                        <p className="font-medium">{patientInfo.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">MRN</Label>
                        <p className="font-medium font-mono">{patientInfo.mrn}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Age</Label>
                        <p className="font-medium">{patientInfo.age} years</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Gender</Label>
                        <p className="font-medium">{patientInfo.gender}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Examination Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Completed At</Label>
                        <p className="font-medium flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {formatDateTime(patientInfo.completedAt)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Duration</Label>
                        <p className="font-medium">
                          {patientInfo.durationMinutes > 0
                            ? `${patientInfo.durationMinutes} min`
                            : '< 1 min'}
                        </p>
                      </div>
                      {patientInfo.assignedDoctor && (
                        <div>
                          <Label className="text-muted-foreground">Assigned Doctor</Label>
                          <p className="font-medium flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                            {patientInfo.assignedDoctor}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-muted-foreground">Priority</Label>
                        <Badge variant="outline" className="mt-0.5">
                          {patientInfo.priorityLabel}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Quick Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {examFormData.visualAcuity?.distance?.rightEye && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">VA OD (Distance)</p>
                        <p className="font-semibold text-lg">{examFormData.visualAcuity.distance.rightEye}</p>
                      </div>
                    )}
                    {examFormData.visualAcuity?.distance?.leftEye && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">VA OS (Distance)</p>
                        <p className="font-semibold text-lg">{examFormData.visualAcuity.distance.leftEye}</p>
                      </div>
                    )}
                    {examFormData.tonometry?.iop?.rightEye && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">IOP OD</p>
                        <p className="font-semibold text-lg">
                          {examFormData.tonometry.iop.rightEye}
                          <span className="text-xs text-muted-foreground ml-0.5">mmHg</span>
                        </p>
                      </div>
                    )}
                    {examFormData.tonometry?.iop?.leftEye && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">IOP OS</p>
                        <p className="font-semibold text-lg">
                          {examFormData.tonometry.iop.leftEye}
                          <span className="text-xs text-muted-foreground ml-0.5">mmHg</span>
                        </p>
                      </div>
                    )}
                  </div>
                  {examFormData.preliminaryDiagnosis && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-blue-700">Preliminary Diagnosis</p>
                      <p className="text-sm text-blue-900 capitalize mt-0.5">
                        {examFormData.preliminaryDiagnosis.replace(/-/g, ' ')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Visual Acuity Tab ────────────────────────────── */}
            <TabsContent value="acuity" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Visual Acuity Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Distance Vision */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        Distance Vision
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {renderSelectField(
                          'Right Eye (OD)',
                          examFormData.visualAcuity.distance.rightEye,
                          (v) => handleNestedChange('visualAcuity', 'distance', 'rightEye', v),
                          DISTANCE_OPTIONS
                        )}
                        {renderSelectField(
                          'Left Eye (OS)',
                          examFormData.visualAcuity.distance.leftEye,
                          (v) => handleNestedChange('visualAcuity', 'distance', 'leftEye', v),
                          DISTANCE_OPTIONS
                        )}
                        {renderSelectField(
                          'Binocular',
                          examFormData.visualAcuity.distance.binocular,
                          (v) => handleNestedChange('visualAcuity', 'distance', 'binocular', v),
                          DISTANCE_OPTIONS
                        )}
                      </div>
                    </div>

                    {/* Near Vision */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        Near Vision
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        {renderSelectField(
                          'Right Eye (OD)',
                          examFormData.visualAcuity.near.rightEye,
                          (v) => handleNestedChange('visualAcuity', 'near', 'rightEye', v),
                          NEAR_OPTIONS
                        )}
                        {renderSelectField(
                          'Left Eye (OS)',
                          examFormData.visualAcuity.near.leftEye,
                          (v) => handleNestedChange('visualAcuity', 'near', 'leftEye', v),
                          NEAR_OPTIONS
                        )}
                        {renderSelectField(
                          'Binocular',
                          examFormData.visualAcuity.near.binocular,
                          (v) => handleNestedChange('visualAcuity', 'near', 'binocular', v),
                          NEAR_OPTIONS
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Refraction Tab ───────────────────────────────── */}
            <TabsContent value="refraction" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Refraction Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Right Eye */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Right Eye (OD)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {renderInputField(
                          'Sphere (D)',
                          examFormData.refraction.sphere.rightEye,
                          (e) => handleNestedChange('refraction', 'sphere', 'rightEye', e.target.value),
                          { type: 'number', step: '0.25', min: '-20', max: '20', placeholder: '0.00' }
                        )}
                        {renderInputField(
                          'Cylinder (D)',
                          examFormData.refraction.cylinder.rightEye,
                          (e) => handleNestedChange('refraction', 'cylinder', 'rightEye', e.target.value),
                          { type: 'number', step: '0.25', min: '-6', max: '6', placeholder: '0.00' }
                        )}
                        {renderInputField(
                          'Axis (°)',
                          examFormData.refraction.axis.rightEye,
                          (e) => handleNestedChange('refraction', 'axis', 'rightEye', e.target.value),
                          { type: 'number', min: '0', max: '180', placeholder: '0' }
                        )}
                        {renderInputField(
                          'Add (D)',
                          examFormData.refraction.add.rightEye,
                          (e) => handleNestedChange('refraction', 'add', 'rightEye', e.target.value),
                          { type: 'number', step: '0.25', min: '0', max: '4', placeholder: '0.00' }
                        )}
                      </div>
                    </div>

                    {/* Left Eye */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Left Eye (OS)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {renderInputField(
                          'Sphere (D)',
                          examFormData.refraction.sphere.leftEye,
                          (e) => handleNestedChange('refraction', 'sphere', 'leftEye', e.target.value),
                          { type: 'number', step: '0.25', min: '-20', max: '20', placeholder: '0.00' }
                        )}
                        {renderInputField(
                          'Cylinder (D)',
                          examFormData.refraction.cylinder.leftEye,
                          (e) => handleNestedChange('refraction', 'cylinder', 'leftEye', e.target.value),
                          { type: 'number', step: '0.25', min: '-6', max: '6', placeholder: '0.00' }
                        )}
                        {renderInputField(
                          'Axis (°)',
                          examFormData.refraction.axis.leftEye,
                          (e) => handleNestedChange('refraction', 'axis', 'leftEye', e.target.value),
                          { type: 'number', min: '0', max: '180', placeholder: '0' }
                        )}
                        {renderInputField(
                          'Add (D)',
                          examFormData.refraction.add.leftEye,
                          (e) => handleNestedChange('refraction', 'add', 'leftEye', e.target.value),
                          { type: 'number', step: '0.25', min: '0', max: '4', placeholder: '0.00' }
                        )}
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInputField(
                      'Pupillary Distance (PD)',
                      examFormData.refraction.pd,
                      (e) => handleChange('refraction', 'pd', e.target.value),
                      { type: 'number', min: '50', max: '80', placeholder: '65' }
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tonometry Tab ────────────────────────────────── */}
            <TabsContent value="tonometry" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Intraocular Pressure (IOP)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Right Eye IOP (mmHg)</Label>
                      <Input
                        type="number"
                        min="5"
                        max="50"
                        value={examFormData.tonometry.iop.rightEye || ''}
                        onChange={(e) =>
                          handleNestedChange('tonometry', 'iop', 'rightEye', e.target.value)
                        }
                        placeholder="15"
                        disabled={isViewMode}
                        className={isViewMode ? 'bg-gray-50' : ''}
                      />
                      {examFormData.tonometry.iop.rightEye && (
                        <p
                          className={`text-xs mt-1 ${
                            examFormData.tonometry.iop.rightEye > 21 ||
                            examFormData.tonometry.iop.rightEye < 10
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {examFormData.tonometry.iop.rightEye > 21
                            ? 'High IOP'
                            : examFormData.tonometry.iop.rightEye < 10
                              ? 'Low IOP'
                              : 'Normal range'}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Left Eye IOP (mmHg)</Label>
                      <Input
                        type="number"
                        min="5"
                        max="50"
                        value={examFormData.tonometry.iop.leftEye || ''}
                        onChange={(e) =>
                          handleNestedChange('tonometry', 'iop', 'leftEye', e.target.value)
                        }
                        placeholder="15"
                        disabled={isViewMode}
                        className={isViewMode ? 'bg-gray-50' : ''}
                      />
                      {examFormData.tonometry.iop.leftEye && (
                        <p
                          className={`text-xs mt-1 ${
                            examFormData.tonometry.iop.leftEye > 21 ||
                            examFormData.tonometry.iop.leftEye < 10
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {examFormData.tonometry.iop.leftEye > 21
                            ? 'High IOP'
                            : examFormData.tonometry.iop.leftEye < 10
                              ? 'Low IOP'
                              : 'Normal range'}
                        </p>
                      )}
                    </div>
                    {renderSelectField(
                      'Method',
                      examFormData.tonometry.method,
                      (v) => handleChange('tonometry', 'method', v),
                      TONOMETRY_METHODS
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Additional Tests Tab ─────────────────────────── */}
            <TabsContent value="tests" className="space-y-4 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Pupil & Motility</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderSelectField(
                      'Pupil Reaction',
                      examFormData.additionalTests.pupilReaction,
                      (v) => handleChange('additionalTests', 'pupilReaction', v),
                      PUPIL_OPTIONS
                    )}
                    {renderSelectField(
                      'Extraocular Movements',
                      examFormData.additionalTests.extraocularMovements,
                      (v) => handleChange('additionalTests', 'extraocularMovements', v),
                      EOM_OPTIONS
                    )}
                    {renderSelectField(
                      'Cover Test',
                      examFormData.additionalTests.coverTest,
                      (v) => handleChange('additionalTests', 'coverTest', v),
                      COVER_TEST_OPTIONS
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vision & Anterior Segment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderSelectField(
                      'Color Vision',
                      examFormData.additionalTests.colorVision,
                      (v) => handleChange('additionalTests', 'colorVision', v),
                      COLOR_VISION_OPTIONS
                    )}
                    {renderSelectField(
                      'Anterior Segment',
                      examFormData.additionalTests.anteriorSegment,
                      (v) => handleChange('additionalTests', 'anteriorSegment', v),
                      ANTERIOR_SEGMENT_OPTIONS
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ─── Clinical Details Tab ─────────────────────────── */}
            <TabsContent value="clinical" className="space-y-4 mt-0">
              {/* Pre-Operative Parameters (Collapsible) */}
              <Collapsible open={isPreOpOpen} onOpenChange={setIsPreOpOpen}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle>Pre-Operative Parameters</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            Optional
                          </Badge>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 transition-transform duration-200 ${
                            isPreOpOpen ? 'transform rotate-180' : ''
                          }`}
                        />
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
                      {Object.entries(examFormData.clinicalDetails.preOpParams).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="grid grid-cols-3 gap-x-4 items-center py-1.5"
                          >
                            <Label className="capitalize font-normal text-sm">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </Label>
                            {key === 'anyOtherDetails' ? (
                              <>
                                <Textarea
                                  rows={1}
                                  value={value.rightEye || ''}
                                  onChange={(e) =>
                                    handleClinicalChange(
                                      'preOpParams',
                                      key,
                                      'rightEye',
                                      e.target.value
                                    )
                                  }
                                  disabled={isViewMode}
                                  className={isViewMode ? 'bg-gray-50' : ''}
                                />
                                <Textarea
                                  rows={1}
                                  value={value.leftEye || ''}
                                  onChange={(e) =>
                                    handleClinicalChange(
                                      'preOpParams',
                                      key,
                                      'leftEye',
                                      e.target.value
                                    )
                                  }
                                  disabled={isViewMode}
                                  className={isViewMode ? 'bg-gray-50' : ''}
                                />
                              </>
                            ) : (
                              <>
                                <Input
                                  value={value.rightEye || ''}
                                  onChange={(e) =>
                                    handleClinicalChange(
                                      'preOpParams',
                                      key,
                                      'rightEye',
                                      e.target.value
                                    )
                                  }
                                  disabled={isViewMode}
                                  className={isViewMode ? 'bg-gray-50' : ''}
                                />
                                <Input
                                  value={value.leftEye || ''}
                                  onChange={(e) =>
                                    handleClinicalChange(
                                      'preOpParams',
                                      key,
                                      'leftEye',
                                      e.target.value
                                    )
                                  }
                                  disabled={isViewMode}
                                  className={isViewMode ? 'bg-gray-50' : ''}
                                />
                              </>
                            )}
                          </div>
                        )
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Slit Lamp Examination */}
              <Card>
                <CardHeader>
                  <CardTitle>Slit Lamp Examination</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(examFormData.clinicalDetails.slitLampFindings).map(
                    ([key, value]) => (
                      <div key={key} className="space-y-2">
                        <Label className="capitalize font-semibold">{key}</Label>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-muted-foreground">Right Eye (OD)</span>
                            <Select
                              value={value.rightEye || ''}
                              onValueChange={(val) =>
                                handleClinicalChange('slitLampFindings', key, 'rightEye', val)
                              }
                              disabled={isViewMode}
                            >
                              <SelectTrigger className={isViewMode ? 'bg-gray-50' : ''}>
                                <SelectValue placeholder="Right Eye (OD)" />
                              </SelectTrigger>
                              <SelectContent>
                                {(SLIT_LAMP_OPTIONS[key] || []).map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Left Eye (OS)</span>
                            <Select
                              value={value.leftEye || ''}
                              onValueChange={(val) =>
                                handleClinicalChange('slitLampFindings', key, 'leftEye', val)
                              }
                              disabled={isViewMode}
                            >
                              <SelectTrigger className={isViewMode ? 'bg-gray-50' : ''}>
                                <SelectValue placeholder="Left Eye (OS)" />
                              </SelectTrigger>
                              <SelectContent>
                                {(SLIT_LAMP_OPTIONS[key] || []).map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Notes & Decision Tab ─────────────────────────── */}
            <TabsContent value="notes" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Clinical Notes & Findings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Clinical Notes */}
                  <div>
                    <Label>Clinical Notes</Label>
                    {isViewMode ? (
                      examFormData.clinicalNotes ? (
                        <div className="bg-blue-50 p-4 rounded-lg mt-1">
                          <p className="text-sm text-gray-700">"{examFormData.clinicalNotes}"</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic mt-1">No clinical notes recorded</p>
                      )
                    ) : (
                      <Textarea
                        value={examFormData.clinicalNotes || ''}
                        onChange={(e) => handleTopLevelChange('clinicalNotes', e.target.value)}
                        placeholder="Clinical observations, patient symptoms, examination findings..."
                        rows={4}
                        className="mt-1"
                      />
                    )}
                  </div>

                  {/* Preliminary Diagnosis */}
                  <div>
                    <Label>Preliminary Diagnosis</Label>
                    {isViewMode ? (
                      examFormData.preliminaryDiagnosis ? (
                        <div className="mt-1">
                          <Badge className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1">
                            {PRELIMINARY_DIAGNOSIS_OPTIONS.find(
                              (o) => o.value === examFormData.preliminaryDiagnosis
                            )?.label || examFormData.preliminaryDiagnosis}
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic mt-1">No diagnosis recorded</p>
                      )
                    ) : (
                      <Select
                        value={examFormData.preliminaryDiagnosis || ''}
                        onValueChange={(v) => handleTopLevelChange('preliminaryDiagnosis', v)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select preliminary diagnosis" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRELIMINARY_DIAGNOSIS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Additional Notes */}
                  {isViewMode ? (
                    examFormData.additionalNotes ? (
                      <div>
                        <Label>Additional Notes</Label>
                        <div className="bg-gray-50 p-4 rounded-lg mt-1">
                          <p className="text-sm text-gray-700">{examFormData.additionalNotes}</p>
                        </div>
                      </div>
                    ) : null
                  ) : (
                    <div>
                      <Label>Additional Notes</Label>
                      <Textarea
                        value={examFormData.additionalNotes || ''}
                        onChange={(e) => handleTopLevelChange('additionalNotes', e.target.value)}
                        placeholder="Any additional observations or comments..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Examination Info (read-only summary) */}
              {patientInfo.assignedDoctor && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Assigned to: <strong>{patientInfo.assignedDoctor}</strong>
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          Priority: {patientInfo.priorityLabel}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* ─── Footer ──────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t bg-white px-6 py-4">
          <div className="flex items-center justify-end space-x-3">
            <Button onClick={onClose} variant="outline" disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              {isViewMode ? 'Close' : 'Cancel'}
            </Button>
            {!isViewMode && (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OptometristCompletedExamModal;
