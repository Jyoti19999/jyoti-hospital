// src/components/doctor/PatientExaminationModal.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from '@tanstack/react-query';
import Loader from "@/components/loader/Loader";
import OptometristFindingsTab from "@/components/OptometristFindingsTab";
import PatientVisitHistory from "@/components/PatientVisitHistory";
import PatientExaminationHeader from "@/components/PatientExaminationHeader";
import PatientSidebar from "@/components/PatientSidebar";
import DetailedExaminationTab from "@/components/DetailedExaminationTab";
import MyExaminationTab from "@/components/MyExaminationTab";
import PrescriptionTab from "@/components/PrescriptionTab";
import PrescriptionPreviewTab from "@/components/PrescriptionPreviewTab";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  Stethoscope,
  FileText,
  Activity,
  Microscope,
  Timer,
  X,
  User,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Circle,
  Target,
  ClipboardList,
  Save,
} from "lucide-react";
import ophthalmologistQueueService from '@/services/ophthalmologistQueueService';
import surgeryTypeService from '@/services/surgeryTypeService';

// ─── Step Configuration ──────────────────────────────────────────────
const STEPS = [
  { key: 'personal-info',         label: 'Patient Info',        shortLabel: 'Info',        icon: User,          required: false },
  { key: 'optometrist',           label: 'Optometrist',         shortLabel: 'Optom.',      icon: Eye,           required: false },
  { key: 'detailed',              label: 'Detailed Exam',       shortLabel: 'Detailed',    icon: Microscope,    required: true  },
  { key: 'examination',           label: 'My Examination',      shortLabel: 'Exam',        icon: Stethoscope,   required: true  },
  { key: 'treatment',             label: 'Treatment Plan',      shortLabel: 'Treatment',   icon: ClipboardList, required: true  },
  { key: 'history',               label: 'Visit History',       shortLabel: 'History',     icon: Activity,      required: false },
  { key: 'prescription-preview',  label: 'Preview & Print',     shortLabel: 'Preview',     icon: FileText,      required: false },
];

const PatientExaminationModal = ({ isOpen, onClose, queueEntryId }) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [patientData, setPatientData] = useState(null);

    // My Examination Tab state
    const [examinationNotes, setExaminationNotes] = useState('');
    const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
    const [octChecked, setOctChecked] = useState(false);
    const [visualFieldChecked, setVisualFieldChecked] = useState(false);
    const [fundusPhotographyChecked, setFundusPhotographyChecked] = useState(false);
    const [angiographyChecked, setAngiographyChecked] = useState(false);
    const [otherTestChecked, setOtherTestChecked] = useState(false);
    const [otherTestsText, setOtherTestsText] = useState('');
    const [additionalOrders, setAdditionalOrders] = useState(null);
    const [followUpRequired, setFollowUpRequired] = useState(false);
    const [followUpPeriod, setFollowUpPeriod] = useState('');
    const [followUpDays, setFollowUpDays] = useState('');
    const [followUpDate, setFollowUpDate] = useState(null);
    const [surgerySuggested, setSurgerySuggested] = useState(false);
    const [selectedSurgeryTypeId, setSelectedSurgeryTypeId] = useState(null);
    const [treatmentPlan, setTreatmentPlan] = useState('');

    // Surgery Types State
    const [surgeryTypes, setSurgeryTypes] = useState([]);

    // Prescription State
    const [prescription, setPrescription] = useState(null);
    const [prescriptionItems, setPrescriptionItems] = useState([]);
    const [generalInstructions, setGeneralInstructions] = useState('');
    const [followUpInstructions, setFollowUpInstructions] = useState('');
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [dosage, setDosage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [duration, setDuration] = useState('');
    const [medicineInstructions, setMedicineInstructions] = useState('');
    const [quantity, setQuantity] = useState('');
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [savingPrescription, setSavingPrescription] = useState(false);

    // Detailed examination state
    const [savingDetailed, setSavingDetailed] = useState(false);
    const [optometristExamData, setOptometristExamData] = useState(null);
    const [loadingOptometristData, setLoadingOptometristData] = useState(false);
    const [modifiedFields, setModifiedFields] = useState(new Set());
    const [originalOptometristValues, setOriginalOptometristValues] = useState({});

    // Visual Acuity
    const [distanceOD, setDistanceOD] = useState('');
    const [distanceOS, setDistanceOS] = useState('');
    const [distanceBinocular, setDistanceBinocular] = useState('');
    const [nearOD, setNearOD] = useState('');
    const [nearOS, setNearOS] = useState('');
    const [nearBinocular, setNearBinocular] = useState('');

    // Refraction
    const [refractionSphereOD, setRefractionSphereOD] = useState('');
    const [refractionCylinderOD, setRefractionCylinderOD] = useState('');
    const [refractionAxisOD, setRefractionAxisOD] = useState('');
    const [refractionAddOD, setRefractionAddOD] = useState('');
    const [refractionSphereOS, setRefractionSphereOS] = useState('');
    const [refractionCylinderOS, setRefractionCylinderOS] = useState('');
    const [refractionAxisOS, setRefractionAxisOS] = useState('');
    const [refractionAddOS, setRefractionAddOS] = useState('');
    const [refractionPD, setRefractionPD] = useState('');

    // Tonometry
    const [iopOD, setIopOD] = useState('');
    const [iopOS, setIopOS] = useState('');
    const [iopMethod, setIopMethod] = useState('goldmann');

    // Additional Tests
    const [pupilReaction, setPupilReaction] = useState('normal');
    const [colorVision, setColorVision] = useState('normal');
    const [eyeAlignment, setEyeAlignment] = useState('normal');
    const [anteriorSegment, setAnteriorSegment] = useState('normal');
    const [extraocularMovements, setExtraocularMovements] = useState('full');
    const [coverTest, setCoverTest] = useState('orthophoric');

    // Pre-Op Parameters
    const [k1OD, setK1OD] = useState('');
    const [k1OS, setK1OS] = useState('');
    const [k2OD, setK2OD] = useState('');
    const [k2OS, setK2OS] = useState('');
    const [flatAxisOD, setFlatAxisOD] = useState('');
    const [flatAxisOS, setFlatAxisOS] = useState('');
    const [acdOD, setAcdOD] = useState('');
    const [acdOS, setAcdOS] = useState('');
    const [axlOD, setAxlOD] = useState('');
    const [axlOS, setAxlOS] = useState('');
    const [iolPowerPlannedOD, setIolPowerPlannedOD] = useState('');
    const [iolPowerPlannedOS, setIolPowerPlannedOS] = useState('');
    const [iolImplantedOD, setIolImplantedOD] = useState('');
    const [iolImplantedOS, setIolImplantedOS] = useState('');
    const [anyOtherDetailsOD, setAnyOtherDetailsOD] = useState('');
    const [anyOtherDetailsOS, setAnyOtherDetailsOS] = useState('');

    // Slit Lamp Findings
    const [eyelidsOD, setEyelidsOD] = useState('normal');
    const [eyelidsOS, setEyelidsOS] = useState('normal');
    const [conjunctivaOD, setConjunctivaOD] = useState('normal');
    const [conjunctivaOS, setConjunctivaOS] = useState('normal');
    const [corneaOD, setCorneaOD] = useState('clear');
    const [corneaOS, setCorneaOS] = useState('clear');
    const [lensOD, setLensOD] = useState('normal');
    const [lensOS, setLensOS] = useState('normal');

    // Clinical Notes
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [preliminaryDiagnosis, setPreliminaryDiagnosis] = useState('');

    // ─── Wizard State ────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('personal-info');
    const [attemptedComplete, setAttemptedComplete] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // ─── Per-step Validation Functions ───────────────────────────────
    const stepValidation = useMemo(() => {
        const isPatientInfoComplete = () => true; // Read-only, always complete

        const isOptometristComplete = () => true; // Read-only reference, always complete

        const isDetailedComplete = () => {
            // Require at least visual acuity distance right + left eyes
            return !!(distanceOD && distanceOS);
        };

        const isExaminationComplete = () => {
            // Require at least one diagnosis selected
            return selectedDiagnoses && selectedDiagnoses.length > 0;
        };

        const isTreatmentComplete = () => {
            // Require at least one prescription item added, OR a treatment plan written
            return prescriptionItems.length > 0 || (treatmentPlan && treatmentPlan.trim().length > 0);
        };

        const isHistoryComplete = () => true; // Read-only, always complete

        const isPreviewComplete = () => true; // Read-only, always complete

        return {
            'personal-info': isPatientInfoComplete,
            'optometrist': isOptometristComplete,
            'detailed': isDetailedComplete,
            'examination': isExaminationComplete,
            'treatment': isTreatmentComplete,
            'history': isHistoryComplete,
            'prescription-preview': isPreviewComplete,
        };
    }, [
        distanceOD, distanceOS,
        selectedDiagnoses,
        prescriptionItems, treatmentPlan,
    ]);

    // Compute completion status for each step
    const stepStatus = useMemo(() => {
        const status = {};
        STEPS.forEach(step => {
            status[step.key] = stepValidation[step.key]();
        });
        return status;
    }, [stepValidation]);

    // Overall progress percentage (based on required steps)
    const overallProgress = useMemo(() => {
        const requiredSteps = STEPS.filter(s => s.required);
        const completedRequired = requiredSteps.filter(s => stepStatus[s.key]).length;
        return Math.round((completedRequired / requiredSteps.length) * 100);
    }, [stepStatus]);

    // Get incomplete required steps (for error messaging)
    const getIncompleteSteps = useCallback(() => {
        return STEPS.filter(s => s.required && !stepStatus[s.key]);
    }, [stepStatus]);

    // Validate form — all required steps must be complete
    const validateForm = useCallback(() => {
        return getIncompleteSteps().length === 0;
    }, [getIncompleteSteps]);

    // ─── Step Navigation ─────────────────────────────────────────────
    const currentStepIndex = STEPS.findIndex(s => s.key === activeTab);
    const isLastStep = currentStepIndex === STEPS.length - 1;
    const isFirstStep = currentStepIndex === 0;

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

    // Check if form complete (for button disabled state) — must be before early return
    const isFormComplete = useMemo(() => {
        const incompleteSteps = getIncompleteSteps();
        return incompleteSteps.length === 0;
    }, [getIncompleteSteps]);

    // ─── Effects ─────────────────────────────────────────────────────

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (isOpen && queueEntryId) {
            fetchPatientData();
            loadDetailedExaminationData();
            loadSurgeryTypes();
        }
    }, [isOpen, queueEntryId]);

    useEffect(() => {
        if (patientData?.examinationId) {
            fetchOptometristExaminationData();
            fetchPrescription();
        }
    }, [patientData]);

    useEffect(() => {
        if (optometristExamData && Object.keys(originalOptometristValues).length === 0) {
            preFillFromOptometristData(optometristExamData);
        }
    }, [optometristExamData, originalOptometristValues]);

    // ─── Utility Functions ───────────────────────────────────────────

    const markFieldAsModified = (fieldName, currentValue) => {
        const originalValue = originalOptometristValues[fieldName];
        if (originalValue !== undefined && currentValue !== originalValue) {
            setModifiedFields(prev => new Set(prev.add(fieldName)));
        } else if (originalValue !== undefined && currentValue === originalValue) {
            setModifiedFields(prev => {
                const newSet = new Set(prev);
                newSet.delete(fieldName);
                return newSet;
            });
        }
    };

    const getInputClassName = (fieldName, baseClassName = '') => {
        const isModified = modifiedFields.has(fieldName);
        return `${baseClassName} ${isModified ? 'border-orange-500 bg-orange-50' : ''}`;
    };

    // Pre-fill from optometrist data
    const preFillFromOptometristData = (optomData) => {
        if (!optomData?.examinationData) return;

        const examData = optomData.examinationData;
        const originalValues = {};

        // Helper: return first non-null, non-undefined, non-empty value
        const pick = (...vals) => vals.find(v => v !== null && v !== undefined && v !== '') ?? null;

        // Helper: apply setter and record original value for change-tracking
        const apply = (key, setter, value) => {
            if (value !== null && value !== undefined && value !== '') {
                setter(value);
                originalValues[key] = value;
            }
        };

        // ── Visual Acuity ──────────────────────────────────────────────
        // Primary source: nested visualAcuity JSON (from the optometrist form)
        // Fallback: legacy flat ucvaOD/ucvaOS fields
        const va = examData.visualAcuity || {};
        apply('distanceOD',       setDistanceOD,       pick(va.distance?.rightEye,  examData.ucvaOD));
        apply('distanceOS',       setDistanceOS,       pick(va.distance?.leftEye,   examData.ucvaOS));
        apply('distanceBinocular',setDistanceBinocular,va.distance?.binocular);
        // NOTE: nearOD/OS comes from visualAcuity.near, NOT from bcvaOD/bcvaOS
        // (bcva = Best Corrected VA / aided, which is a different field)
        apply('nearOD',           setNearOD,           va.near?.rightEye);
        apply('nearOS',           setNearOS,           va.near?.leftEye);
        apply('nearBinocular',    setNearBinocular,    va.near?.binocular);

        // ── Refraction ─────────────────────────────────────────────────
        const rx = examData.refraction || {};
        apply('refractionSphereOD',   setRefractionSphereOD,   pick(rx.sphere?.rightEye,   examData.refractionSphereOD?.toString()));
        apply('refractionCylinderOD', setRefractionCylinderOD, pick(rx.cylinder?.rightEye, examData.refractionCylinderOD?.toString()));
        apply('refractionAxisOD',     setRefractionAxisOD,     pick(rx.axis?.rightEye,     examData.refractionAxisOD?.toString()));
        apply('refractionAddOD',      setRefractionAddOD,      rx.add?.rightEye);
        apply('refractionSphereOS',   setRefractionSphereOS,   pick(rx.sphere?.leftEye,    examData.refractionSphereOS?.toString()));
        apply('refractionCylinderOS', setRefractionCylinderOS, pick(rx.cylinder?.leftEye,  examData.refractionCylinderOS?.toString()));
        apply('refractionAxisOS',     setRefractionAxisOS,     pick(rx.axis?.leftEye,      examData.refractionAxisOS?.toString()));
        apply('refractionAddOS',      setRefractionAddOS,      rx.add?.leftEye);
        apply('refractionPD',         setRefractionPD,         rx.pd);

        // ── Tonometry ──────────────────────────────────────────────────
        const tono = examData.tonometry || {};
        apply('iopOD',    setIopOD,    pick(tono.iop?.rightEye, examData.iopOD?.toString()));
        apply('iopOS',    setIopOS,    pick(tono.iop?.leftEye,  examData.iopOS?.toString()));
        apply('iopMethod',setIopMethod,pick(tono.method,        examData.iopMethod));

        // ── Additional Tests ───────────────────────────────────────────
        const addTests = examData.additionalTests || {};
        apply('pupilReaction',       setPupilReaction,       pick(addTests.pupilReaction,       examData.pupilReaction));
        apply('colorVision',         setColorVision,         pick(addTests.colorVision,         examData.colorVision));
        apply('eyeAlignment',        setEyeAlignment,        pick(addTests.eyeAlignment,        examData.eyeAlignment));
        // anteriorSegment is stored as a plain string in additionalTests
        apply('anteriorSegment',     setAnteriorSegment,     addTests.anteriorSegment);
        apply('extraocularMovements',setExtraocularMovements,addTests.extraocularMovements);
        apply('coverTest',           setCoverTest,           addTests.coverTest);

        // ── Slit Lamp Findings ─────────────────────────────────────────
        const slitLamp = examData.clinicalDetails?.slitLampFindings || {};
        apply('eyelidsOD',     setEyelidsOD,     slitLamp.eyelids?.rightEye);
        apply('eyelidsOS',     setEyelidsOS,     slitLamp.eyelids?.leftEye);
        apply('conjunctivaOD', setConjunctivaOD, slitLamp.conjunctiva?.rightEye);
        apply('conjunctivaOS', setConjunctivaOS, slitLamp.conjunctiva?.leftEye);
        apply('corneaOD',      setCorneaOD,      slitLamp.cornea?.rightEye);
        apply('corneaOS',      setCorneaOS,      slitLamp.cornea?.leftEye);
        apply('lensOD',        setLensOD,        slitLamp.lens?.rightEye);
        apply('lensOS',        setLensOS,        slitLamp.lens?.leftEye);

        // ── Pre-Op Parameters ──────────────────────────────────────────
        const preOp = examData.clinicalDetails?.preOpParams || {};
        apply('k1OD',             setK1OD,             preOp.k1?.rightEye);
        apply('k1OS',             setK1OS,             preOp.k1?.leftEye);
        apply('k2OD',             setK2OD,             preOp.k2?.rightEye);
        apply('k2OS',             setK2OS,             preOp.k2?.leftEye);
        apply('flatAxisOD',       setFlatAxisOD,       preOp.flatAxis?.rightEye);
        apply('flatAxisOS',       setFlatAxisOS,       preOp.flatAxis?.leftEye);
        apply('acdOD',            setAcdOD,            preOp.acd?.rightEye);
        apply('acdOS',            setAcdOS,            preOp.acd?.leftEye);
        apply('axlOD',            setAxlOD,            preOp.axl?.rightEye);
        apply('axlOS',            setAxlOS,            preOp.axl?.leftEye);
        apply('iolPowerPlannedOD',setIolPowerPlannedOD,preOp.iolPowerPlanned?.rightEye);
        apply('iolPowerPlannedOS',setIolPowerPlannedOS,preOp.iolPowerPlanned?.leftEye);
        apply('iolImplantedOD',   setIolImplantedOD,   preOp.iolImplanted?.rightEye);
        apply('iolImplantedOS',   setIolImplantedOS,   preOp.iolImplanted?.leftEye);
        apply('anyOtherDetailsOD',setAnyOtherDetailsOD,preOp.anyOtherDetails?.rightEye);
        apply('anyOtherDetailsOS',setAnyOtherDetailsOS,preOp.anyOtherDetails?.leftEye);

        // ── Clinical Assessment ────────────────────────────────────────
        apply('clinicalNotes',       setClinicalNotes,       examData.clinicalNotes);
        apply('preliminaryDiagnosis',setPreliminaryDiagnosis,examData.preliminaryDiagnosis);

        // Keep surgery flag if present
        if (examData.surgeryRecommended !== null && examData.surgeryRecommended !== undefined) {
            setSurgerySuggested(!!examData.surgeryRecommended);
            originalValues.surgeryRecommended = !!examData.surgeryRecommended;
        }

        setOriginalOptometristValues(originalValues);

        const fieldsFilledCount = Object.keys(originalValues).length;
        if (fieldsFilledCount > 0) {
            toast.success(`✅ Pre-filled ${fieldsFilledCount} fields from optometrist examination`, {
                description: "Fields with orange border indicate modified values"
            });
        }
    };

    const loadSurgeryTypes = async () => {
        try {
            const response = await surgeryTypeService.getSurgeryTypeDropdown();
            if (response.success) {
                setSurgeryTypes(response.data.surgeryTypes || []);
            }
        } catch (error) {
        }
    };

    const loadDetailedExaminationData = async () => {
        try {
            const data = await ophthalmologistQueueService.getDetailedOphthalmologistExamination(queueEntryId);
            if (data) {
                setDistanceOD(data.distanceOD || '');
                setDistanceOS(data.distanceOS || '');
                setDistanceBinocular(data.distanceBinocular || '');
                setNearOD(data.nearOD || '');
                setNearOS(data.nearOS || '');
                setNearBinocular(data.nearBinocular || '');
                setRefractionSphereOD(data.refractionSphereOD || '');
                setRefractionCylinderOD(data.refractionCylinderOD || '');
                setRefractionAxisOD(data.refractionAxisOD || '');
                setRefractionAddOD(data.refractionAddOD || '');
                setRefractionSphereOS(data.refractionSphereOS || '');
                setRefractionCylinderOS(data.refractionCylinderOS || '');
                setRefractionAxisOS(data.refractionAxisOS || '');
                setRefractionAddOS(data.refractionAddOS || '');
                setRefractionPD(data.refractionPD || '');
                setIopOD(data.iopOD || '');
                setIopOS(data.iopOS || '');
                setIopMethod(data.iopMethod || 'goldmann');
                setPupilReaction(data.pupilReaction || 'normal');
                setColorVision(data.colorVision || 'normal');
                setEyeAlignment(data.eyeAlignment || 'normal');
                setAnteriorSegment(data.anteriorSegment || 'normal');
                setExtraocularMovements(data.extraocularMovements || 'full');
                setCoverTest(data.coverTest || 'orthophoric');
                setK1OD(data.preOpParams?.k1OD || '');
                setK1OS(data.preOpParams?.k1OS || '');
                setK2OD(data.preOpParams?.k2OD || '');
                setK2OS(data.preOpParams?.k2OS || '');
                setFlatAxisOD(data.preOpParams?.flatAxisOD || '');
                setFlatAxisOS(data.preOpParams?.flatAxisOS || '');
                setAcdOD(data.preOpParams?.acdOD || '');
                setAcdOS(data.preOpParams?.acdOS || '');
                setAxlOD(data.preOpParams?.axlOD || '');
                setAxlOS(data.preOpParams?.axlOS || '');
                setIolPowerPlannedOD(data.preOpParams?.iolPowerPlannedOD || '');
                setIolPowerPlannedOS(data.preOpParams?.iolPowerPlannedOS || '');
                setIolImplantedOD(data.preOpParams?.iolImplantedOD || '');
                setIolImplantedOS(data.preOpParams?.iolImplantedOS || '');
                setAnyOtherDetailsOD(data.preOpParams?.anyOtherDetailsOD || '');
                setAnyOtherDetailsOS(data.preOpParams?.anyOtherDetailsOS || '');
                setEyelidsOD(data.slitLampFindings?.eyelidsOD || 'normal');
                setEyelidsOS(data.slitLampFindings?.eyelidsOS || 'normal');
                setConjunctivaOD(data.slitLampFindings?.conjunctivaOD || 'normal');
                setConjunctivaOS(data.slitLampFindings?.conjunctivaOS || 'normal');
                setCorneaOD(data.slitLampFindings?.corneaOD || 'clear');
                setCorneaOS(data.slitLampFindings?.corneaOS || 'clear');
                setLensOD(data.slitLampFindings?.lensOD || 'normal');
                setLensOS(data.slitLampFindings?.lensOS || 'normal');
                setClinicalNotes(data.clinicalNotes || '');
                setPreliminaryDiagnosis(data.preliminaryDiagnosis || '');
                setExaminationNotes(data.examinationNotes || '');
                setSelectedDiagnoses(data.selectedDiagnoses || []);
                const tests = data.additionalTestsOrdered || {};
                setAdditionalOrders(tests);
                setOctChecked(tests.oct || false);
                setVisualFieldChecked(tests.visualField || false);
                setFundusPhotographyChecked(tests.fundusPhotography || false);
                setAngiographyChecked(tests.angiography || false);
                setOtherTestsText(tests.other || '');
                setOtherTestChecked(!!tests.other);
                setFollowUpRequired(data.followUpRequired || false);
                setFollowUpPeriod(data.followUpPeriod || '');
                setFollowUpDays(data.followUpDays || '');
                setFollowUpDate(data.followUpDate ? new Date(data.followUpDate) : null);
                setSurgerySuggested(data.surgeryRecommended || false);
                setSelectedSurgeryTypeId(data.surgeryTypeId || null);
                setTreatmentPlan(data.treatmentPlan || '');
            }
        } catch (error) {
        }
    };

    const saveDetailedExaminationData = async () => {
        try {
            setSavingDetailed(true);
            const dataToSave = {
                distanceOD, distanceOS, distanceBinocular,
                nearOD, nearOS, nearBinocular,
                refractionSphereOD: refractionSphereOD ? parseFloat(refractionSphereOD) : null,
                refractionCylinderOD: refractionCylinderOD ? parseFloat(refractionCylinderOD) : null,
                refractionAxisOD: refractionAxisOD ? parseInt(refractionAxisOD) : null,
                refractionAddOD: refractionAddOD ? parseFloat(refractionAddOD) : null,
                refractionSphereOS: refractionSphereOS ? parseFloat(refractionSphereOS) : null,
                refractionCylinderOS: refractionCylinderOS ? parseFloat(refractionCylinderOS) : null,
                refractionAxisOS: refractionAxisOS ? parseInt(refractionAxisOS) : null,
                refractionAddOS: refractionAddOS ? parseFloat(refractionAddOS) : null,
                refractionPD: refractionPD ? parseFloat(refractionPD) : null,
                iopOD: iopOD ? parseFloat(iopOD) : null,
                iopOS: iopOS ? parseFloat(iopOS) : null,
                iopMethod, pupilReaction, colorVision, eyeAlignment, anteriorSegment,
                extraocularMovements, coverTest,
                k1OD, k1OS, k2OD, k2OS, flatAxisOD, flatAxisOS,
                acdOD, acdOS, axlOD, axlOS,
                iolPowerPlannedOD, iolPowerPlannedOS,
                iolImplantedOD, iolImplantedOS,
                anyOtherDetailsOD, anyOtherDetailsOS,
                eyelidsOD, eyelidsOS, conjunctivaOD, conjunctivaOS,
                corneaOD, corneaOS, lensOD, lensOS,
                clinicalNotes, preliminaryDiagnosis,
                examinationNotes, selectedDiagnoses,
                diagnosisText: selectedDiagnoses && selectedDiagnoses.length > 0
                    ? selectedDiagnoses.map(d => d.title || d.diseaseName || d.name).join(', ')
                    : '',
                additionalTestsOrdered: {
                    oct: octChecked,
                    visualField: visualFieldChecked,
                    fundusPhotography: fundusPhotographyChecked,
                    angiography: angiographyChecked,
                    other: otherTestChecked ? otherTestsText : ''
                },
                followUpRequired, followUpPeriod,
                followUpDays: followUpDays ? parseInt(followUpDays) : null,
                followUpDate,
                surgeryRecommended: surgerySuggested,
                surgeryTypeId: selectedSurgeryTypeId,
                treatmentPlan
            };

            await ophthalmologistQueueService.saveDetailedOphthalmologistExamination(queueEntryId, dataToSave);
            toast.success('Examination data saved successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to save examination data');
        } finally {
            setSavingDetailed(false);
        }
    };

    const fetchPatientData = async () => {
        try {
            setLoading(true);
            const queueData = await ophthalmologistQueueService.getOphthalmologistQueue();
            const patient = queueData.queueEntries?.find(p => p.queueEntryId === queueEntryId);

            if (!patient) {
                try {
                    const onHoldData = await ophthalmologistQueueService.getMyOnHoldPatients();
                    const onHoldPatient = onHoldData.queueEntries?.find(p => p.queueEntryId === queueEntryId);
                    
                    if (onHoldPatient) {
                        onClose();
                        return;
                    }
                } catch (error) {
                }
                
                toast.error('Patient not found');
                onClose();
                return;
            }

            if (patient.status === 'CALLED') {
                try {
                    await ophthalmologistQueueService.startConsultation(queueEntryId);
                    const updatedQueueData = await ophthalmologistQueueService.getOphthalmologistQueue();
                    const updatedPatient = updatedQueueData.queueEntries?.find(p => p.queueEntryId === queueEntryId);
                    setPatientData(updatedPatient || patient);
                } catch (error) {
                    setPatientData(patient);
                }
            } else {
                setPatientData(patient);
            }
        } catch (error) {
            toast.error('Failed to load patient data');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const fetchOptometristExaminationData = async () => {
        try {
            setLoadingOptometristData(true);
            const examData = await ophthalmologistQueueService.getOptometristExaminationData(patientData.examinationId);
            if (examData) {
                setOptometristExamData(examData);
            } else {
                setOptometristExamData(null);
            }
        } catch (error) {
            setOptometristExamData(null);
        } finally {
            setLoadingOptometristData(false);
        }
    };

    const handleMedicineSelect = (medicine) => {
        setSelectedMedicine(medicine);
        if (medicine.dosageSchedule) {
            setFrequency(medicine.dosageSchedule.name);
        }
    };

    const handleAddMedicine = () => {
        if (!selectedMedicine || !dosage || !frequency || !duration) {
            toast.error('Please fill in all required fields');
            return;
        }

        const newItem = {
            medicineId: selectedMedicine.id,
            medicineName: selectedMedicine.name,
            medicineCode: selectedMedicine.code,
            medicineType: selectedMedicine.type?.name,
            genericName: selectedMedicine.genericMedicine?.name,
            dosage, frequency, duration,
            instructions: medicineInstructions,
            quantity: quantity ? parseInt(quantity) : null
        };

        if (editingItemIndex !== null) {
            const updatedItems = [...prescriptionItems];
            updatedItems[editingItemIndex] = newItem;
            setPrescriptionItems(updatedItems);
            setEditingItemIndex(null);
            toast.success('Medicine updated');
        } else {
            setPrescriptionItems([...prescriptionItems, newItem]);
            toast.success('Medicine added to prescription');
        }

        setSelectedMedicine(null);
        setDosage('');
        setFrequency('');
        setDuration('');
        setMedicineInstructions('');
        setQuantity('');
    };

    const handleEditItem = (index) => {
        const item = prescriptionItems[index];
        setSelectedMedicine({ id: item.medicineId, name: item.medicineName, code: item.medicineCode });
        setDosage(item.dosage);
        setFrequency(item.frequency);
        setDuration(item.duration);
        setMedicineInstructions(item.instructions || '');
        setQuantity(item.quantity || '');
        setEditingItemIndex(index);
    };

    const handleDeleteItem = (index) => {
        const updatedItems = prescriptionItems.filter((_, i) => i !== index);
        setPrescriptionItems(updatedItems);
        toast.success('Medicine removed from prescription');
    };

    const handleCancelEdit = () => {
        setSelectedMedicine(null);
        setDosage('');
        setFrequency('');
        setDuration('');
        setMedicineInstructions('');
        setQuantity('');
        setEditingItemIndex(null);
    };

    const handleSavePrescription = async () => {
        if (prescriptionItems.length === 0) {
            toast.error('Please add at least one medicine to the prescription');
            return;
        }

        try {
            setSavingPrescription(true);
            const visitId = patientData.visit?.id || patientData.visitData?.id;

            if (!visitId) {
                toast.error('Patient visit ID not found. Please refresh the page.');
                return;
            }

            const prescriptionData = {
                patientVisitId: visitId,
                examinationId: null,
                items: prescriptionItems,
                generalInstructions,
                followUpInstructions
            };

            const API_URL = import.meta.env.VITE_API_URL;
            const url = prescription ? `${API_URL}/prescriptions/${prescription.id}` : `${API_URL}/prescriptions`;

            const response = await fetch(url, {
                method: prescription ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(prescriptionData)
            });

            const data = await response.json();

            if (data.success) {
                setPrescription(data.data);
                setPrescriptionItems(data.data.prescriptionItems.map(item => ({
                    medicineId: item.medicineId,
                    medicineName: item.medicineName,
                    medicineCode: item.medicine?.code,
                    medicineType: item.medicine?.type?.name,
                    genericName: item.medicine?.genericMedicine?.name,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    duration: item.duration,
                    instructions: item.instructions,
                    quantity: item.quantity
                })));
                toast.success(prescription ? 'Prescription updated successfully' : 'Prescription created successfully');
            } else {
                toast.error(data.message || 'Failed to save prescription');
            }
        } catch (error) {
            toast.error('Failed to save prescription');
        } finally {
            setSavingPrescription(false);
        }
    };

    const fetchPrescription = async () => {
        try {
            const API_URL = import.meta.env.VITE_API_URL;
            const visitId = patientData?.visit?.id || patientData?.visitData?.id;

            if (!visitId) {
                return;
            }

            const url = `${API_URL}/prescriptions/visit/${visitId}`;
            
            const response = await fetch(url, {
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success && data.data) {
                setPrescription(data.data);
                setPrescriptionItems(data.data.prescriptionItems.map(item => ({
                    medicineId: item.medicineId,
                    medicineName: item.medicineName,
                    medicineCode: item.medicine?.code,
                    medicineType: item.medicine?.type?.name,
                    genericName: item.medicine?.genericMedicine?.name,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    duration: item.duration,
                    instructions: item.instructions,
                    quantity: item.quantity
                })));
                setGeneralInstructions(data.data.generalInstructions || '');
                setFollowUpInstructions(data.data.followUpInstructions || '');
            }
        } catch (error) {
        }
    };

    const handleCompleteExamination = async () => {
        // Validate all required steps first
        setAttemptedComplete(true);
        const incompleteSteps = getIncompleteSteps();

        if (incompleteSteps.length > 0) {
            const stepNames = incompleteSteps.map(s => s.label).join(', ');
            toast.error(`Please complete the following sections: ${stepNames}`, {
                description: 'All required sections must be filled before completing the examination.',
                duration: 6000,
            });
            // Navigate to the first incomplete step
            setActiveTab(incompleteSteps[0].key);
            return;
        }

        // Show confirmation dialog
        setShowConfirmDialog(true);
    };

    const confirmCompleteExamination = async () => {
        setShowConfirmDialog(false);
        try {
            setLoading(true);
            // Auto-save before completing
            await saveDetailedExaminationData();
            await ophthalmologistQueueService.completeConsultation(queueEntryId);
            toast.success('Examination completed successfully');
            queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
            queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
            queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to complete examination');
        } finally {
            setLoading(false);
        }
    };

    const handlePutOnHold = async (reasons) => {
        try {
            setLoading(true);
            await ophthalmologistQueueService.putPatientOnHold(queueEntryId, reasons);
            toast.success('Patient put on hold. Receptionist2 will be notified to apply eye drops.');
            
            queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
            queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
            queryClient.invalidateQueries(['doctor-on-hold-patients', user.id]);
            queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
            
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to put patient on hold');
            setLoading(false);
        }
    };

    const handleResumeFromHold = async () => {
        try {
            setLoading(true);
            await ophthalmologistQueueService.resumePatientFromHold(queueEntryId);
            toast.success('Patient examination resumed');
            await fetchPatientData();
        } catch (error) {
            toast.error(error.message || 'Failed to resume patient from hold');
        } finally {
            setLoading(false);
        }
    };

    // ─── Early Return ─────────────────────────────────────────────────
    if (!isOpen) return null;

    // ─── Helper Functions ─────────────────────────────────────────────
    const formatTimer = () => {
        if (!patientData?.inProgressAt) return null;
        const startTime = new Date(patientData.inProgressAt);
        const now = currentTime;
        const diff = Math.floor((now - startTime) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className="max-w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col"
                style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}
            >
                {/* ─── Fixed Header ──────────────────────────────────────── */}
                <div className="flex-shrink-0 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <DialogHeader className="px-6 pt-4 pb-2">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                                    <Eye className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <span className="text-xl font-bold">Ophthalmologist Examination</span>
                                    {patientData && (
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-sm text-gray-600">
                                                {patientData.fullName} • Token: {patientData.token}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </DialogTitle>
                            <div className="flex items-center gap-2">
                                {formatTimer() && (
                                    <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1 px-3 py-1.5">
                                        <Timer className="h-3 w-3" />
                                        <span className="font-mono font-semibold">{formatTimer()}</span>
                                    </Badge>
                                )}
                                {patientData && (
                                    <>
                                        <Badge className={`${patientData.priority === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                                            patientData.priority === 'URGENT' ? 'bg-orange-100 text-orange-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {patientData.priority}
                                        </Badge>
                                        <Badge className="bg-blue-100 text-blue-800">
                                            {patientData.status}
                                        </Badge>
                                    </>
                                )}
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={onClose}
                                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 ml-2"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                                    Back
                                </Button>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* ─── Progress Bar ─────────────────────────────────── */}
                    {patientData && !loading && (
                        <div className="px-6 pb-2 space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Examination Progress</span>
                                <span className="font-medium">{overallProgress}% Complete</span>
                            </div>
                            <Progress value={overallProgress} className="h-2" />
                        </div>
                    )}

                    {/* ─── Step Indicator Bar ──────────────────────────── */}
                    {patientData && !loading && (
                        <div className="px-6 pb-3">
                            <div className="flex items-center gap-1">
                                {STEPS.map((step, index) => {
                                    const isActive = activeTab === step.key;
                                    const isComplete = stepStatus[step.key];
                                    const isRequired = step.required;
                                    const showError = attemptedComplete && isRequired && !isComplete;
                                    const StepIcon = step.icon;

                                    return (
                                        <React.Fragment key={step.key}>
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
                                                <span className="flex-shrink-0">
                                                    {isComplete && !isActive ? (
                                                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                                    ) : showError ? (
                                                        <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                                                    ) : (
                                                        <StepIcon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : ''}`} />
                                                    )}
                                                </span>
                                                <span className="hidden lg:inline truncate">{step.label}</span>
                                                <span className="lg:hidden truncate">{step.shortLabel}</span>
                                                {isRequired && !isComplete && !isActive && (
                                                    <span className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${showError ? 'bg-red-500' : 'bg-orange-400'}`} />
                                                )}
                                            </button>
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
                    )}
                </div>

                {/* ─── Scrollable Content Area ──────────────────────────── */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader />
                        </div>
                    ) : patientData ? (
                        <div className="p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                {/* Quick Actions - Left Sidebar (Always Visible) */}
                                <div className="lg:col-span-1">
                                    <div className="sticky top-0 space-y-3">
                                        <PatientSidebar
                                            patientData={patientData}
                                            loading={loading}
                                            onPutOnHold={handlePutOnHold}
                                            onCompleteExamination={handleCompleteExamination}
                                            onResumeFromHold={handleResumeFromHold}
                                        />

                                        {/* Completion Status Card */}
                                        <Card className={`${overallProgress === 100 ? 'border-green-200 bg-green-50/50' : 'border-orange-200 bg-orange-50/50'}`}>
                                            <CardContent className="pt-4 pb-3">
                                                <div className="flex items-start gap-2.5">
                                                    {overallProgress === 100 ? (
                                                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                        <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium ${overallProgress === 100 ? 'text-green-800' : 'text-orange-800'}`}>
                                                            {overallProgress === 100 ? 'Ready to Complete' : 'Sections Pending'}
                                                        </p>
                                                        {overallProgress < 100 && (
                                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                                {getIncompleteSteps().map(step => (
                                                                    <button
                                                                        key={step.key}
                                                                        onClick={() => setActiveTab(step.key)}
                                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors cursor-pointer border border-orange-200"
                                                                    >
                                                                        <Circle className="h-1.5 w-1.5 fill-current" />
                                                                        {step.shortLabel}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {overallProgress === 100 && (
                                                            <p className="text-xs text-green-600 mt-1">
                                                                All required sections are complete
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Save Progress Button */}
                                        <Button
                                            onClick={saveDetailedExaminationData}
                                            disabled={savingDetailed}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {savingDetailed ? 'Saving...' : 'Save Progress'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Examination Content - Right Side */}
                                <div className="lg:col-span-3">
                                    <Card className="bg-white shadow-lg">
                                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                            {/* Hidden TabsList — navigation via custom stepper */}
                                            <TabsList className="hidden">
                                                {STEPS.map(step => (
                                                    <TabsTrigger key={step.key} value={step.key}>{step.label}</TabsTrigger>
                                                ))}
                                            </TabsList>

                                            <div className="p-4" style={{ minHeight: '400px' }}>
                                                {/* Personal Information Tab */}
                                                <TabsContent value="personal-info" className="mt-0 space-y-0">
                                                    <Card className="bg-white border-0 shadow-none">
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-lg flex items-center gap-2">
                                                                <User className="h-5 w-5 text-blue-600" />
                                                                Patient Information
                                                                <Badge className="ml-auto bg-green-100 text-green-700 text-xs">Read Only</Badge>
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="space-y-4">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Full Name</Label>
                                                                    <p className="font-semibold text-base mt-1">{patientData.fullName}</p>
                                                                </div>
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Age</Label>
                                                                    <p className="font-semibold text-base mt-1">{patientData.age || 'N/A'} years</p>
                                                                </div>
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Gender</Label>
                                                                    <p className="font-semibold text-base mt-1 capitalize">{patientData.gender || 'N/A'}</p>
                                                                </div>
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Patient No.</Label>
                                                                    <p className="font-semibold text-base mt-1 font-mono">{patientData.patientNumber || patientData.mrn}</p>
                                                                </div>
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Visit Type</Label>
                                                                    <Badge variant="outline" className="mt-1">{patientData.visitType || 'OPD'}</Badge>
                                                                </div>
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Wait Time</Label>
                                                                    <p className="font-semibold text-base mt-1">{patientData.waitTime || 'N/A'}</p>
                                                                </div>
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Phone</Label>
                                                                    <p className="font-semibold text-base mt-1">{patientData.phone || 'N/A'}</p>
                                                                </div>
                                                                <div className="bg-gray-50 rounded-lg p-3">
                                                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Token</Label>
                                                                    <Badge className="mt-1 bg-blue-100 text-blue-800">{patientData.token}</Badge>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </TabsContent>

                                                {/* Optometrist Findings Tab */}
                                                <TabsContent value="optometrist" className="mt-0 space-y-0">
                                                    <OptometristFindingsTab
                                                        optometristExamData={optometristExamData}
                                                        loadingOptometristData={loadingOptometristData}
                                                    />
                                                </TabsContent>

                                                {/* Detailed Examination Tab */}
                                                <TabsContent value="detailed" className="mt-0 space-y-0">
                                                    {attemptedComplete && !stepStatus['detailed'] && (
                                                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                                            <p className="text-sm text-red-700">
                                                                <strong>Required:</strong> Please fill in at least the distance visual acuity (OD and OS) to complete this section.
                                                            </p>
                                                        </div>
                                                    )}
                                                    <DetailedExaminationTab
                                                        distanceOD={distanceOD} setDistanceOD={setDistanceOD}
                                                        distanceOS={distanceOS} setDistanceOS={setDistanceOS}
                                                        distanceBinocular={distanceBinocular} setDistanceBinocular={setDistanceBinocular}
                                                        nearOD={nearOD} setNearOD={setNearOD}
                                                        nearOS={nearOS} setNearOS={setNearOS}
                                                        nearBinocular={nearBinocular} setNearBinocular={setNearBinocular}
                                                        refractionSphereOD={refractionSphereOD} setRefractionSphereOD={setRefractionSphereOD}
                                                        refractionCylinderOD={refractionCylinderOD} setRefractionCylinderOD={setRefractionCylinderOD}
                                                        refractionAxisOD={refractionAxisOD} setRefractionAxisOD={setRefractionAxisOD}
                                                        refractionAddOD={refractionAddOD} setRefractionAddOD={setRefractionAddOD}
                                                        refractionSphereOS={refractionSphereOS} setRefractionSphereOS={setRefractionSphereOS}
                                                        refractionCylinderOS={refractionCylinderOS} setRefractionCylinderOS={setRefractionCylinderOS}
                                                        refractionAxisOS={refractionAxisOS} setRefractionAxisOS={setRefractionAxisOS}
                                                        refractionAddOS={refractionAddOS} setRefractionAddOS={setRefractionAddOS}
                                                        refractionPD={refractionPD} setRefractionPD={setRefractionPD}
                                                        iopOD={iopOD} setIopOD={setIopOD}
                                                        iopOS={iopOS} setIopOS={setIopOS}
                                                        iopMethod={iopMethod} setIopMethod={setIopMethod}
                                                        pupilReaction={pupilReaction} setPupilReaction={setPupilReaction}
                                                        colorVision={colorVision} setColorVision={setColorVision}
                                                        eyeAlignment={eyeAlignment} setEyeAlignment={setEyeAlignment}
                                                        anteriorSegment={anteriorSegment} setAnteriorSegment={setAnteriorSegment}
                                                        extraocularMovements={extraocularMovements} setExtraocularMovements={setExtraocularMovements}
                                                        coverTest={coverTest} setCoverTest={setCoverTest}
                                                        k1OD={k1OD} setK1OD={setK1OD}
                                                        k1OS={k1OS} setK1OS={setK1OS}
                                                        k2OD={k2OD} setK2OD={setK2OD}
                                                        k2OS={k2OS} setK2OS={setK2OS}
                                                        flatAxisOD={flatAxisOD} setFlatAxisOD={setFlatAxisOD}
                                                        flatAxisOS={flatAxisOS} setFlatAxisOS={setFlatAxisOS}
                                                        acdOD={acdOD} setAcdOD={setAcdOD}
                                                        acdOS={acdOS} setAcdOS={setAcdOS}
                                                        axlOD={axlOD} setAxlOD={setAxlOD}
                                                        axlOS={axlOS} setAxlOS={setAxlOS}
                                                        iolPowerPlannedOD={iolPowerPlannedOD} setIolPowerPlannedOD={setIolPowerPlannedOD}
                                                        iolPowerPlannedOS={iolPowerPlannedOS} setIolPowerPlannedOS={setIolPowerPlannedOS}
                                                        iolImplantedOD={iolImplantedOD} setIolImplantedOD={setIolImplantedOD}
                                                        iolImplantedOS={iolImplantedOS} setIolImplantedOS={setIolImplantedOS}
                                                        anyOtherDetailsOD={anyOtherDetailsOD} setAnyOtherDetailsOD={setAnyOtherDetailsOD}
                                                        anyOtherDetailsOS={anyOtherDetailsOS} setAnyOtherDetailsOS={setAnyOtherDetailsOS}
                                                        eyelidsOD={eyelidsOD} setEyelidsOD={setEyelidsOD}
                                                        eyelidsOS={eyelidsOS} setEyelidsOS={setEyelidsOS}
                                                        conjunctivaOD={conjunctivaOD} setConjunctivaOD={setConjunctivaOD}
                                                        conjunctivaOS={conjunctivaOS} setConjunctivaOS={setConjunctivaOS}
                                                        corneaOD={corneaOD} setCorneaOD={setCorneaOD}
                                                        corneaOS={corneaOS} setCorneaOS={setCorneaOS}
                                                        lensOD={lensOD} setLensOD={setLensOD}
                                                        lensOS={lensOS} setLensOS={setLensOS}
                                                        clinicalNotes={clinicalNotes} setClinicalNotes={setClinicalNotes}
                                                        preliminaryDiagnosis={preliminaryDiagnosis} setPreliminaryDiagnosis={setPreliminaryDiagnosis}
                                                        optometristExamData={optometristExamData}
                                                        loadingOptometristData={loadingOptometristData}
                                                        preFillFromOptometristData={preFillFromOptometristData}
                                                        originalOptometristValues={originalOptometristValues}
                                                        getInputClassName={getInputClassName}
                                                        markFieldAsModified={markFieldAsModified}
                                                        savingDetailed={savingDetailed}
                                                        saveDetailedExaminationData={saveDetailedExaminationData}
                                                    />
                                                </TabsContent>

                                                {/* My Examination Tab */}
                                                <TabsContent value="examination" className="mt-0 space-y-0">
                                                    {attemptedComplete && !stepStatus['examination'] && (
                                                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                                            <p className="text-sm text-red-700">
                                                                <strong>Required:</strong> Please add at least one diagnosis to complete this section.
                                                            </p>
                                                        </div>
                                                    )}
                                                    <MyExaminationTab
                                                        examinationNotes={examinationNotes} setExaminationNotes={setExaminationNotes}
                                                        selectedDiagnoses={selectedDiagnoses} setSelectedDiagnoses={setSelectedDiagnoses}
                                                        octChecked={octChecked} setOctChecked={setOctChecked}
                                                        visualFieldChecked={visualFieldChecked} setVisualFieldChecked={setVisualFieldChecked}
                                                        fundusPhotographyChecked={fundusPhotographyChecked} setFundusPhotographyChecked={setFundusPhotographyChecked}
                                                        angiographyChecked={angiographyChecked} setAngiographyChecked={setAngiographyChecked}
                                                        otherTestChecked={otherTestChecked} setOtherTestChecked={setOtherTestChecked}
                                                        otherTestsText={otherTestsText} setOtherTestsText={setOtherTestsText}
                                                        followUpRequired={followUpRequired} setFollowUpRequired={setFollowUpRequired}
                                                        followUpPeriod={followUpPeriod} setFollowUpPeriod={setFollowUpPeriod}
                                                        followUpDays={followUpDays} setFollowUpDays={setFollowUpDays}
                                                        followUpDate={followUpDate} setFollowUpDate={setFollowUpDate}
                                                        surgerySuggested={surgerySuggested} setSurgerySuggested={setSurgerySuggested}
                                                        selectedSurgeryTypeId={selectedSurgeryTypeId} setSelectedSurgeryTypeId={setSelectedSurgeryTypeId}
                                                        savingDetailed={savingDetailed}
                                                        saveDetailedExaminationData={saveDetailedExaminationData}
                                                        getInputClassName={getInputClassName}
                                                        markFieldAsModified={markFieldAsModified}
                                                    />
                                                </TabsContent>

                                                {/* Treatment Plan Tab */}
                                                <TabsContent value="treatment" className="mt-0 space-y-0">
                                                    {attemptedComplete && !stepStatus['treatment'] && (
                                                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                                            <p className="text-sm text-red-700">
                                                                <strong>Required:</strong> Please add at least one medicine or write a treatment plan.
                                                            </p>
                                                        </div>
                                                    )}
                                                    <PrescriptionTab
                                                        treatmentPlan={treatmentPlan} setTreatmentPlan={setTreatmentPlan}
                                                        prescription={prescription}
                                                        prescriptionItems={prescriptionItems}
                                                        selectedMedicine={selectedMedicine} setSelectedMedicine={setSelectedMedicine}
                                                        dosage={dosage} setDosage={setDosage}
                                                        frequency={frequency} setFrequency={setFrequency}
                                                        duration={duration} setDuration={setDuration}
                                                        medicineInstructions={medicineInstructions} setMedicineInstructions={setMedicineInstructions}
                                                        quantity={quantity} setQuantity={setQuantity}
                                                        editingItemIndex={editingItemIndex}
                                                        generalInstructions={generalInstructions} setGeneralInstructions={setGeneralInstructions}
                                                        followUpInstructions={followUpInstructions} setFollowUpInstructions={setFollowUpInstructions}
                                                        savingPrescription={savingPrescription}
                                                        handleMedicineSelect={handleMedicineSelect}
                                                        handleAddMedicine={handleAddMedicine}
                                                        handleEditItem={handleEditItem}
                                                        handleDeleteItem={handleDeleteItem}
                                                        handleCancelEdit={handleCancelEdit}
                                                        handleSavePrescription={handleSavePrescription}
                                                    />
                                                </TabsContent>

                                                {/* Visit History Tab */}
                                                <TabsContent value="history" className="mt-0 space-y-0">
                                                    <PatientVisitHistory patientId={patientData?.patient?.id} />
                                                </TabsContent>

                                                {/* Prescription Preview Tab */}
                                                <TabsContent value="prescription-preview" className="mt-0 space-y-0">
                                                    <PrescriptionPreviewTab
                                                        examinationNotes={examinationNotes}
                                                        selectedDiagnoses={selectedDiagnoses}
                                                        treatmentPlan={treatmentPlan}
                                                        prescriptionItems={prescriptionItems}
                                                        generalInstructions={generalInstructions}
                                                        followUpInstructions={followUpInstructions}
                                                        additionalOrders={additionalOrders}
                                                        optometristExamData={optometristExamData}
                                                        octChecked={octChecked}
                                                        visualFieldChecked={visualFieldChecked}
                                                        fundusPhotographyChecked={fundusPhotographyChecked}
                                                        angiographyChecked={angiographyChecked}
                                                        otherTestChecked={otherTestChecked}
                                                        otherTestsText={otherTestsText}
                                                        followUpRequired={followUpRequired}
                                                        followUpPeriod={followUpPeriod}
                                                        followUpDays={followUpDays}
                                                        followUpDate={followUpDate}
                                                        surgerySuggested={surgerySuggested}
                                                        selectedSurgeryTypeId={selectedSurgeryTypeId}
                                                        surgeryTypes={surgeryTypes}
                                                        detailedExamData={{
                                                            visualAcuity: { distanceOD, distanceOS, distanceBinocular, nearOD, nearOS, nearBinocular },
                                                            refraction: { refractionSphereOD, refractionCylinderOD, refractionAxisOD, refractionAddOD, refractionSphereOS, refractionCylinderOS, refractionAxisOS, refractionAddOS, refractionPD },
                                                            tonometry: { iopOD, iopOS, iopMethod },
                                                            additionalTests: { pupilReaction, colorVision, eyeAlignment, anteriorSegment, extraocularMovements, coverTest },
                                                            preOpParams: { k1OD, k1OS, k2OD, k2OS, flatAxisOD, flatAxisOS, acdOD, acdOS, axlOD, axlOS, iolPowerPlannedOD, iolPowerPlannedOS, iolImplantedOD, iolImplantedOS, anyOtherDetailsOD, anyOtherDetailsOS },
                                                            slitLamp: { eyelidsOD, eyelidsOS, conjunctivaOD, conjunctivaOS, corneaOD, corneaOS, lensOD, lensOS },
                                                            preliminaryDiagnosis
                                                        }}
                                                        patientData={patientData}
                                                        doctorName={user ? `${user.firstName} ${user.lastName}` : ''}
                                                    />
                                                </TabsContent>
                                            </div>
                                        </Tabs>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* ─── Fixed Footer with Navigation ─────────────────────── */}
                {patientData && !loading && (
                    <div className="flex-shrink-0 border-t bg-white px-6 py-3">
                        <div className="flex items-center justify-between">
                            {/* Left: Save button */}
                            <Button
                                onClick={saveDetailedExaminationData}
                                disabled={savingDetailed}
                                variant="outline"
                                size="sm"
                            >
                                <Save className="h-4 w-4 mr-1.5" />
                                {savingDetailed ? 'Saving...' : 'Save Progress'}
                            </Button>

                            {/* Center: Navigation */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={goToPrevStep}
                                    disabled={isFirstStep}
                                    className="gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <span className="text-xs text-muted-foreground px-2 font-medium">
                                    Step {currentStepIndex + 1} of {STEPS.length}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={goToNextStep}
                                    disabled={isLastStep}
                                    className="gap-1"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Right: Complete Examination */}
                            <Button
                                onClick={handleCompleteExamination}
                                disabled={loading || !isFormComplete}
                                className={`gap-1.5 ${isFormComplete
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-green-600/70 text-white/80 cursor-not-allowed'
                                }`}
                                size="sm"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Complete Examination
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>

        {/* ─── Confirmation Dialog ──────────────────────────────────── */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Complete Examination?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This will mark the examination as complete and save all data. 
                        The patient will be moved out of your queue. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={confirmCompleteExamination}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        Complete Examination
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
};

export default PatientExaminationModal;
