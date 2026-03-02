// src/pages/staff/PatientExamination.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ArrowLeft, Eye, Stethoscope, FileText, Activity, Microscope, Timer } from "lucide-react";
import ophthalmologistQueueService from '@/services/ophthalmologistQueueService';
import surgeryTypeService from '@/services/surgeryTypeService';

const PatientExamination = () => {
    const { queueEntryId } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
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
    const [additionalOrders, setAdditionalOrders] = useState(null); // Store the raw DB object
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

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchPatientData();
        loadDetailedExaminationData();
        loadSurgeryTypes();
    }, [queueEntryId]);

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

    // Utility functions
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
                setAdditionalOrders(tests); // Store the raw object for prescription preview
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
                
                // Log loaded surgery data
                if (data.surgeryRecommended) {
                }
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
            toast.success('Detailed examination data saved successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to save detailed examination data');
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
                // Patient might be on hold - check on-hold queue before showing error
                try {
                    const onHoldData = await ophthalmologistQueueService.getMyOnHoldPatients();
                    const onHoldPatient = onHoldData.queueEntries?.find(p => p.queueEntryId === queueEntryId);
                    
                    if (onHoldPatient) {
                        // Patient is on hold - silently navigate back without error
                        navigate('/doctor-dashboard');
                        return;
                    }
                } catch (error) {
                }
                
                // Patient truly not found
                toast.error('Patient not found');
                navigate('/doctor-dashboard');
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
            navigate('/doctor-dashboard');
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

    // Prescription Functions
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
                // Update prescription items with the saved data to ensure sync
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

            // Try fetching by visit ID first (more reliable)
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
            } else {
            }
        } catch (error) {
        }
    };

    const handleCompleteExamination = async () => {
        try {
            setLoading(true);
            await ophthalmologistQueueService.completeConsultation(queueEntryId);
            toast.success('Examination completed successfully');
            navigate('/doctor-dashboard');
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
            
            // ✅ Invalidate all relevant queries BEFORE navigating back
            queryClient.invalidateQueries(['ophthalmologist-queue', user.id]);
            queryClient.invalidateQueries(['doctor-assigned-queue', user.id]);
            queryClient.invalidateQueries(['doctor-on-hold-patients', user.id]);
            queryClient.invalidateQueries(['doctor-dashboard-stats', user.id]);
            
            // Navigate back to dashboard immediately (patient is now on hold)
            navigate('/doctor-dashboard');
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

    const handleBackToDashboard = () => navigate('/doctor-dashboard');

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully');
            navigate('/staff-auth');
        } catch (error) {
            toast.error('Logout failed');
        }
    };

    if (loading) return <Loader />;

    if (!patientData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Patient Not Found</h2>
                    <p className="text-gray-600 mb-4">The requested patient could not be found.</p>
                    <Button onClick={handleBackToDashboard}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <PatientExaminationHeader
                user={user}
                currentTime={currentTime}
                onLogout={handleLogout}
                inProgressAt={patientData?.inProgressAt}
            />

            <div className="bg-gray-50/50 min-h-screen">
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" onClick={handleBackToDashboard} className="flex items-center">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Patient Examination</h1>
                                <p className="text-gray-600">
                                    {patientData.fullName} • Token: {patientData.token}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Live Timer Badge */}
                            {patientData.inProgressAt && (
                                <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1 px-3 py-1.5">
                                    <Timer className="h-3 w-3" />
                                    <span className="font-mono font-semibold">
                                        {(() => {
                                            const startTime = new Date(patientData.inProgressAt);
                                            const now = currentTime;
                                            const diff = Math.floor((now - startTime) / 1000);
                                            const hours = Math.floor(diff / 3600);
                                            const minutes = Math.floor((diff % 3600) / 60);
                                            const seconds = diff % 60;
                                            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                                        })()}
                                    </span>
                                </Badge>
                            )}
                            <Badge className={`${patientData.priority === 'EMERGENCY' ? 'bg-red-100 text-red-800' :
                                patientData.priority === 'URGENT' ? 'bg-orange-100 text-orange-800' :
                                    'bg-green-100 text-green-800'
                                }`}>
                                {patientData.priority}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800">
                                {patientData.status}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Patient Information Sidebar */}
                        <div className="lg:col-span-1">
                            <PatientSidebar
                                patientData={patientData}
                                loading={loading}
                                onPutOnHold={handlePutOnHold}
                                onCompleteExamination={handleCompleteExamination}
                                onResumeFromHold={handleResumeFromHold}
                            />
                        </div>

                        {/* Examination Content */}
                        <div className="lg:col-span-2">
                            <Card className="bg-white shadow-lg">
                                <Tabs defaultValue="optometrist" className="w-full">
                                    <TabsList className="w-full grid grid-cols-3 lg:grid-cols-6 gap-1 h-auto p-1 bg-gray-100">
                                        <TabsTrigger value="optometrist" className="flex items-center justify-center text-xs px-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                            <Eye className="h-4 w-4 mr-1.5" />
                                            <span>Optometrist</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="detailed" className="flex items-center justify-center text-xs px-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                            <Microscope className="h-4 w-4 mr-1.5" />
                                            <span>Detailed</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="examination" className="flex items-center justify-center text-xs px-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                            <Stethoscope className="h-4 w-4 mr-1.5" />
                                            <span>Examination</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="treatment" className="flex items-center justify-center text-xs px-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                            <FileText className="h-4 w-4 mr-1.5" />
                                            <span>Treatment</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="history" className="flex items-center justify-center text-xs px-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                            <Activity className="h-4 w-4 mr-1.5" />
                                            <span>History</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="prescription-preview" className="flex items-center justify-center text-xs px-2 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                            <FileText className="h-4 w-4 mr-1.5" />
                                            <span>Preview</span>
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="p-4 max-h-[calc(100vh-280px)] overflow-y-auto">
                                        {/* Optometrist Findings Tab */}
                                        <TabsContent value="optometrist" className="mt-0 space-y-0">
                                            <OptometristFindingsTab
                                                optometristExamData={optometristExamData}
                                                loadingOptometristData={loadingOptometristData}
                                            />
                                                </TabsContent>

                                        {/* Detailed Examination Tab */}
                                        <TabsContent value="detailed" className="mt-0 space-y-0">
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
            </div>
        </>
    );
};

export default PatientExamination;
