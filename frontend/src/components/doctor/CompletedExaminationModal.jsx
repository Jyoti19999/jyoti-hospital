import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, Stethoscope, FileText, Activity, Save, X } from "lucide-react";
import axios from 'axios';
import Loader from "@/components/loader/Loader";
import DetailedExaminationTab from "@/components/DetailedExaminationTab";
import MyExaminationTab from "@/components/MyExaminationTab";
import PrescriptionTab from "@/components/PrescriptionTab";
import PrescriptionPreviewTab from "@/components/PrescriptionPreviewTab";
import surgeryTypeService from '@/services/surgeryTypeService';

const CompletedExaminationModal = ({ isOpen, onClose, queueEntryId, patientVisitId, mode = 'view', onSave }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [examinationData, setExaminationData] = useState(null);
  const [activeTab, setActiveTab] = useState('detailed');

  // Detailed Examination State
  const [distanceOD, setDistanceOD] = useState('');
  const [distanceOS, setDistanceOS] = useState('');
  const [distanceBinocular, setDistanceBinocular] = useState('');
  const [nearOD, setNearOD] = useState('');
  const [nearOS, setNearOS] = useState('');
  const [nearBinocular, setNearBinocular] = useState('');
  const [refractionSphereOD, setRefractionSphereOD] = useState('');
  const [refractionCylinderOD, setRefractionCylinderOD] = useState('');
  const [refractionAxisOD, setRefractionAxisOD] = useState('');
  const [refractionAddOD, setRefractionAddOD] = useState('');
  const [refractionSphereOS, setRefractionSphereOS] = useState('');
  const [refractionCylinderOS, setRefractionCylinderOS] = useState('');
  const [refractionAxisOS, setRefractionAxisOS] = useState('');
  const [refractionAddOS, setRefractionAddOS] = useState('');
  const [refractionPD, setRefractionPD] = useState('');
  const [iopOD, setIopOD] = useState('');
  const [iopOS, setIopOS] = useState('');
  const [iopMethod, setIopMethod] = useState('goldmann');
  const [pupilReaction, setPupilReaction] = useState('normal');
  const [colorVision, setColorVision] = useState('normal');
  const [eyeAlignment, setEyeAlignment] = useState('normal');
  const [anteriorSegment, setAnteriorSegment] = useState('');
  const [extraocularMovements, setExtraocularMovements] = useState('normal');
  const [coverTest, setCoverTest] = useState('');
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
  const [eyelidsOD, setEyelidsOD] = useState('');
  const [eyelidsOS, setEyelidsOS] = useState('');
  const [conjunctivaOD, setConjunctivaOD] = useState('');
  const [conjunctivaOS, setConjunctivaOS] = useState('');
  const [corneaOD, setCorneaOD] = useState('');
  const [corneaOS, setCorneaOS] = useState('');
  const [lensOD, setLensOD] = useState('');
  const [lensOS, setLensOS] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [preliminaryDiagnosis, setPreliminaryDiagnosis] = useState('');

  // My Examination State
  const [examinationNotes, setExaminationNotes] = useState('');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [octChecked, setOctChecked] = useState(false);
  const [visualFieldChecked, setVisualFieldChecked] = useState(false);
  const [fundusPhotographyChecked, setFundusPhotographyChecked] = useState(false);
  const [angiographyChecked, setAngiographyChecked] = useState(false);
  const [otherTestChecked, setOtherTestChecked] = useState(false);
  const [otherTestsText, setOtherTestsText] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpPeriod, setFollowUpPeriod] = useState('');
  const [followUpDays, setFollowUpDays] = useState('');
  const [followUpDate, setFollowUpDate] = useState(null);
  const [surgerySuggested, setSurgerySuggested] = useState(false);
  const [selectedSurgeryTypeId, setSelectedSurgeryTypeId] = useState(null);
  const [treatmentPlan, setTreatmentPlan] = useState('');

  // Prescription State
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
  const [surgeryTypes, setSurgeryTypes] = useState([]);

  const [modifiedFields, setModifiedFields] = useState(new Set());

  useEffect(() => {
    if (isOpen && queueEntryId) {
      loadExaminationData();
      loadSurgeryTypes();
      if (patientVisitId) {
        fetchPrescription();
      }
    }
  }, [isOpen, queueEntryId, patientVisitId]);

  const loadSurgeryTypes = async () => {
    try {
      const response = await surgeryTypeService.getSurgeryTypeDropdown();
      if (response.success) {
        setSurgeryTypes(response.data.surgeryTypes || []);
      }
    } catch (error) {
    }
  };

  const fetchPrescription = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL;
      
      if (!patientVisitId) {
        return;
      }

      const url = `${API_URL}/prescriptions/visit/${patientVisitId}`;
      
      const response = await fetch(url, {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && data.data) {
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
        // Load prescription-level fields that sit on the prescription object (not on items)
        setGeneralInstructions(data.data.generalInstructions || '');
        setFollowUpInstructions(data.data.followUpInstructions || '');
      }
    } catch (error) {
    }
  };

  const loadExaminationData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch the complete examination data using queueEntryId
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/ophthalmologist/detailed-examination/${queueEntryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data.data;
      setExaminationData(data);
      

      // Pre-fill all fields - matching PatientExamination.jsx logic
      if (data) {
        // Visual Acuity
        setDistanceOD(data.distanceOD || '');
        setDistanceOS(data.distanceOS || '');
        setDistanceBinocular(data.distanceBinocular || '');
        setNearOD(data.nearOD || '');
        setNearOS(data.nearOS || '');
        setNearBinocular(data.nearBinocular || '');
        
        // Refraction
        setRefractionSphereOD(data.refractionSphereOD || '');
        setRefractionCylinderOD(data.refractionCylinderOD || '');
        setRefractionAxisOD(data.refractionAxisOD || '');
        setRefractionAddOD(data.refractionAddOD || '');
        setRefractionSphereOS(data.refractionSphereOS || '');
        setRefractionCylinderOS(data.refractionCylinderOS || '');
        setRefractionAxisOS(data.refractionAxisOS || '');
        setRefractionAddOS(data.refractionAddOS || '');
        setRefractionPD(data.refractionPD || '');
        
        // IOP
        setIopOD(data.iopOD || '');
        setIopOS(data.iopOS || '');
        setIopMethod(data.iopMethod || 'goldmann');
        
        // Additional Tests
        setPupilReaction(data.pupilReaction || 'normal');
        setColorVision(data.colorVision || 'normal');
        setEyeAlignment(data.eyeAlignment || 'normal');
        // anteriorSegment may be a plain string (new records) or a JSON object (old records
        // that had the slit-lamp JSON blob stored here before the bug was fixed). Coerce safely.
        setAnteriorSegment(typeof data.anteriorSegment === 'string' ? data.anteriorSegment : '');
        setExtraocularMovements(data.extraocularMovements || 'full');
        setCoverTest(data.coverTest || 'orthophoric');
        
        // Pre-op Parameters (nested in preOpParams object)
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
        
        // Slit Lamp Findings (nested in slitLampFindings object)
        setEyelidsOD(data.slitLampFindings?.eyelidsOD || 'normal');
        setEyelidsOS(data.slitLampFindings?.eyelidsOS || 'normal');
        setConjunctivaOD(data.slitLampFindings?.conjunctivaOD || 'normal');
        setConjunctivaOS(data.slitLampFindings?.conjunctivaOS || 'normal');
        setCorneaOD(data.slitLampFindings?.corneaOD || 'clear');
        setCorneaOS(data.slitLampFindings?.corneaOS || 'clear');
        setLensOD(data.slitLampFindings?.lensOD || 'normal');
        setLensOS(data.slitLampFindings?.lensOS || 'normal');
        
        // Clinical Notes
        setClinicalNotes(data.clinicalNotes || '');
        setPreliminaryDiagnosis(data.preliminaryDiagnosis || '');
        
        // My Examination
        setExaminationNotes(data.examinationNotes || '');
        setSelectedDiagnoses(data.selectedDiagnoses || []);
        
        // Additional Tests Ordered
        const tests = data.additionalTestsOrdered || {};
        setOctChecked(tests.oct || false);
        setVisualFieldChecked(tests.visualField || false);
        setFundusPhotographyChecked(tests.fundusPhotography || false);
        setAngiographyChecked(tests.angiography || false);
        setOtherTestsText(tests.other || '');
        setOtherTestChecked(!!tests.other);
        
        // Follow-up
        setFollowUpRequired(data.followUpRequired || false);
        setFollowUpPeriod(data.followUpPeriod || '');
        setFollowUpDays(data.followUpDays || '');
        setFollowUpDate(data.followUpDate ? new Date(data.followUpDate) : null);
        
        // Surgery
        setSurgerySuggested(data.surgeryRecommended || false);
        setSelectedSurgeryTypeId(data.surgeryTypeId || null);
        setTreatmentPlan(data.treatmentPlan || '');
        
      }
    } catch (error) {
      toast.error('Failed to load examination data');
    } finally {
      setLoading(false);
    }
  };

  const markFieldAsModified = (fieldName) => {
    if (mode === 'edit') {
      setModifiedFields(prev => new Set([...prev, fieldName]));
    }
  };

  const getInputClassName = (fieldName) => {
    return mode === 'view' ? 'bg-gray-50 cursor-not-allowed' : 
           (modifiedFields.has(fieldName) ? 'border-blue-500 bg-blue-50' : '');
  };

  // Prescription Handler Functions
  const handleMedicineSelect = (medicine) => {
    if (isViewMode) return;
    setSelectedMedicine(medicine);
    if (medicine.dosageSchedule) {
      setFrequency(medicine.dosageSchedule.name);
    }
  };

  const handleAddMedicine = () => {
    if (isViewMode) return;
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
    if (isViewMode) return;
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
    if (isViewMode) return;
    const updatedItems = prescriptionItems.filter((_, i) => i !== index);
    setPrescriptionItems(updatedItems);
    toast.success('Medicine removed from prescription');
  };

  const handleCancelEdit = () => {
    if (isViewMode) return;
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
      const API_URL = import.meta.env.VITE_API_URL;

      if (!patientVisitId) {
        toast.error('Patient visit ID not found');
        return;
      }

      const prescriptionData = {
        patientVisitId: patientVisitId,
        examinationId: null,
        items: prescriptionItems,
        generalInstructions,
        followUpInstructions
      };


      // Check if there's an existing prescription for this visit
      const fetchResponse = await fetch(`${API_URL}/prescriptions/visit/${patientVisitId}`, {
        credentials: 'include'
      });
      const fetchData = await fetchResponse.json();
      const existingPrescription = fetchData.success ? fetchData.data : null;

      const url = existingPrescription 
        ? `${API_URL}/prescriptions/${existingPrescription.id}` 
        : `${API_URL}/prescriptions`;

      const response = await fetch(url, {
        method: existingPrescription ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(prescriptionData)
      });

      const data = await response.json();

      if (data.success) {
        // Update prescription items with saved data
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
        toast.success(existingPrescription ? 'Prescription updated successfully' : 'Prescription created successfully');
      } else {
        toast.error(data.message || 'Failed to save prescription');
      }
    } catch (error) {
      toast.error('Failed to save prescription');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      // Save detailed examination - matching PatientExamination.jsx structure
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

      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/ophthalmologist/detailed-examination/${queueEntryId}/save`,
        dataToSave,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Also save prescription if there are items
      if (prescriptionItems.length > 0) {
        await handleSavePrescription();
      }

      toast.success('Examination and prescription updated successfully');
      onSave?.();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save examination changes');
    } finally {
      setSaving(false);
    }
  };

  const isViewMode = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              <span>{isViewMode ? 'View' : 'Edit'} Completed Examination</span>
            </div>
            <Badge variant={isViewMode ? "secondary" : "default"}>
              {isViewMode ? 'Read Only' : 'Edit Mode'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader />
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="detailed" className="flex items-center text-xs sm:text-sm px-2 py-2">
                  <Eye className="h-4 w-4 mr-2" />
                  Detailed Exam
                </TabsTrigger>
                <TabsTrigger value="examination" className="flex items-center text-xs sm:text-sm px-2 py-2">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  My Examination
                </TabsTrigger>
                <TabsTrigger value="treatment" className="flex items-center text-xs sm:text-sm px-2 py-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Prescription
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center text-xs sm:text-sm px-2 py-2">
                  <Activity className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
              </TabsList>

              {/* Detailed Examination Tab */}
              <TabsContent value="detailed">
                <fieldset disabled={isViewMode}>
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
                  getInputClassName={getInputClassName}
                  markFieldAsModified={markFieldAsModified}
                  readOnly={isViewMode}
                />
                </fieldset>
              </TabsContent>

              {/* My Examination Tab */}
              <TabsContent value="examination">
                <fieldset disabled={isViewMode}>
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
                  getInputClassName={getInputClassName}
                  markFieldAsModified={markFieldAsModified}
                  readOnly={isViewMode}
                />
                </fieldset>
              </TabsContent>

              {/* Prescription Tab */}
              <TabsContent value="treatment">
                <fieldset disabled={isViewMode}>
                <PrescriptionTab
                  treatmentPlan={treatmentPlan} setTreatmentPlan={setTreatmentPlan}
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
                  handleMedicineSelect={handleMedicineSelect}
                  handleAddMedicine={handleAddMedicine}
                  handleEditItem={handleEditItem}
                  handleDeleteItem={handleDeleteItem}
                  handleCancelEdit={handleCancelEdit}
                  handleSavePrescription={handleSavePrescription}
                  readOnly={isViewMode}
                />
                </fieldset>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview">
                <PrescriptionPreviewTab
                  patientData={examinationData?.patient}
                  detailedExamData={{
                    visualAcuity: { distanceOD, distanceOS, distanceBinocular, nearOD, nearOS, nearBinocular },
                    refraction: { refractionSphereOD, refractionCylinderOD, refractionAxisOD, refractionAddOD, refractionSphereOS, refractionCylinderOS, refractionAxisOS, refractionAddOS, refractionPD },
                    tonometry: { iopOD, iopOS, iopMethod },
                    additionalTests: { pupilReaction, colorVision, eyeAlignment, anteriorSegment, extraocularMovements, coverTest },
                    preOpParams: { k1OD, k1OS, k2OD, k2OS, flatAxisOD, flatAxisOS, acdOD, acdOS, axlOD, axlOS, iolPowerPlannedOD, iolPowerPlannedOS, iolImplantedOD, iolImplantedOS, anyOtherDetailsOD, anyOtherDetailsOS },
                    slitLamp: { eyelidsOD, eyelidsOS, conjunctivaOD, conjunctivaOS, corneaOD, corneaOS, lensOD, lensOS },
                    preliminaryDiagnosis,
                    clinicalNotes
                  }}
                  examinationNotes={examinationNotes}
                  selectedDiagnoses={selectedDiagnoses}
                  treatmentPlan={treatmentPlan}
                  prescriptionItems={prescriptionItems}
                  generalInstructions={generalInstructions}
                  followUpInstructions={followUpInstructions}
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
                />
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button
                onClick={onClose}
                variant="outline"
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                {isViewMode ? 'Close' : 'Cancel'}
              </Button>
              
              {!isViewMode && (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompletedExaminationModal;
