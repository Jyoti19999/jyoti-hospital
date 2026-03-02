import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader, ChevronRight, ChevronLeft, Package, ClipboardCheck, Search, Plus, Minus, Eye, ShoppingCart, FileSignature } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import ipdService from '../../services/ipdService';
import equipmentService from '../../services/equipmentService';
import consentFormService from '../../services/consentFormService';
import PDFSignatureModal from './PDFSignatureModal';

const CheckinModal = ({ 
  surgery, 
  isOpen, 
  onClose, 
  getInvestigationName,
  onUploadComplete,
  onDeleteDocument,
  onSuccess // Add callback for refreshing parent UI
}) => {
  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Document upload
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Step 2: Equipment and Lens selection
  const [checkinResources, setCheckinResources] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const [selectedLens, setSelectedLens] = useState(null);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [lensSearch, setLensSearch] = useState('');
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Step 3: Surgery preparations
  const [preparationsComplete, setPreparationsComplete] = useState(false);
  const [requiresAnesthesia, setRequiresAnesthesia] = useState(true);
  const [preparationNotes, setPreparationNotes] = useState('');
  
  // Step 4: Consent Forms
  const [consentFormsData, setConsentFormsData] = useState(null);
  const [loadingConsentForms, setLoadingConsentForms] = useState(false);
  const [generatedForms, setGeneratedForms] = useState(null);
  const [consentFormsCompleted, setConsentFormsCompleted] = useState(false);
  
  // PDF Signature Modal
  const [pdfSignatureModalOpen, setPdfSignatureModalOpen] = useState(false);
  const [currentSigningPdf, setCurrentSigningPdf] = useState(null);
  const [signedForms, setSignedForms] = useState({
    ophsureng: null,
    ansconeng: null
  });
  
  // Completion animation state
  // const [showSuccessAnimation, setShowSuccessAnimation] = useState(false); // Moved to parent
  
  // Skip document confirmation
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [documentsSkipped, setDocumentsSkipped] = useState(false);
  
  const { toast } = useToast();

  // Load existing documents when modal opens or surgery changes
  // Load existing documents when modal opens
  useEffect(() => {
    if (isOpen && surgery && surgery.investigationDocumentPath) {
      
      // Convert existing document paths to uploadedFiles format
      const existingFiles = surgery.investigationDocumentPath.map((path, index) => {
        const fileName = path.split('/').pop() || `Document ${index + 1}.pdf`;
        return {
          fileName: fileName,
          uploadTime: new Date(), // We don't have the actual upload time
          size: 0, // We don't have the actual size
          documentPath: path
        };
      });
      
      setUploadedFiles(existingFiles);
      setDocumentsSkipped(false);
      
    } else if (isOpen) {
      // Reset state when opening modal without existing documents
      setUploadedFiles([]);
      setCurrentStep(1);
      setDocumentsSkipped(false);
      setCheckinResources(null);
      setSelectedEquipments([]);
      setSelectedLens(null);
      setGeneratedForms(null);
      setConsentFormsData(null);
      setConsentFormsCompleted(false);
    }
  }, [isOpen, surgery]);

  // Load checkin resources when reaching step 2
  useEffect(() => {
    if (isOpen && surgery && currentStep === 2 && !checkinResources) {
      loadCheckinResources();
    }
  }, [isOpen, surgery, currentStep]);

  // Load and generate consent forms when reaching step 4
  useEffect(() => {
    if (isOpen && surgery && currentStep === 4 && !generatedForms) {
      loadAndGenerateConsentForms();
    }
  }, [isOpen, surgery, currentStep, generatedForms]);

  // Real-time equipment search with debouncing
  useEffect(() => {
    const searchEquipment = async () => {
      if (equipmentSearch.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setSearching(true);
      try {
        const response = await equipmentService.searchEquipment(equipmentSearch);
        if (response.success) {
          // Filter out already selected equipment
          const alreadySelectedIds = selectedEquipments.map(eq => eq.equipmentId);
          const filteredResults = response.data.filter(equipment => 
            !alreadySelectedIds.includes(equipment.id)
          );
          setSearchResults(filteredResults);
          setShowSearchResults(true);
        }
      } catch (error) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchEquipment, 300); // 300ms debounce
    return () => clearTimeout(timeoutId);
  }, [equipmentSearch, selectedEquipments]);

  // Hide search results when clicking outside or equipment search is empty
  useEffect(() => {
    if (equipmentSearch.length === 0) {
      setShowSearchResults(false);
    }
  }, [equipmentSearch]);

  // Real-time equipment search with debouncing
  useEffect(() => {
    const searchEquipment = async () => {
      if (equipmentSearch.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setSearching(true);
      try {
        const response = await equipmentService.searchEquipment(equipmentSearch);
        if (response.success) {
          // Filter out already selected equipment
          const alreadySelectedIds = selectedEquipments.map(eq => eq.equipmentId);
          const filteredResults = response.data.filter(equipment => 
            !alreadySelectedIds.includes(equipment.id)
          );
          setSearchResults(filteredResults);
          setShowSearchResults(true);
        }
      } catch (error) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchEquipment, 300); // 300ms debounce
    return () => clearTimeout(timeoutId);
  }, [equipmentSearch, selectedEquipments]);

  // Hide search results when clicking outside or equipment search is empty
  useEffect(() => {
    if (equipmentSearch.length === 0) {
      setShowSearchResults(false);
    }
  }, [equipmentSearch]);

  const loadCheckinResources = async () => {
    if (!surgery || !surgery.id) return;
    
    setLoadingResources(true);
    try {
      const data = await ipdService.getCheckinResources(surgery.id);
      
      if (data.success) {
        setCheckinResources(data.data);
        
        // Pre-select recommended equipment and lens
        if (data.data.recommendedEquipment && data.data.recommendedEquipment.length > 0) {
          const preSelected = data.data.recommendedEquipment.map(eq => ({
            equipmentId: eq.id,
            name: eq.name,
            code: eq.code,
            category: eq.category,
            currentStock: eq.currentStock,
            quantity: 1,
            isRecommended: true,
            packageName: eq.packageName
          }));
          setSelectedEquipments(preSelected);
        }
        
        if (data.data.recommendedLens) {
          setSelectedLens({
            lensId: data.data.recommendedLens.id,
            lensName: data.data.recommendedLens.lensName,
            lensCode: data.data.recommendedLens.lensCode,
            lensType: data.data.recommendedLens.lensType,
            lensCategory: data.data.recommendedLens.lensCategory,
            patientCost: data.data.recommendedLens.patientCost,
            stockQuantity: data.data.recommendedLens.stockQuantity,
            isRecommended: true
          });
        }
        
      } else {
        throw new Error(data.message || 'Failed to load checkin resources');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load equipment and lens data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingResources(false);
    }
  };

  const loadAndGenerateConsentForms = async () => {
    if (!surgery || !surgery.id) return;
    
    setLoadingConsentForms(true);
    try {
      
      // Generate pre-filled consent forms
      const result = await consentFormService.generateConsentForms(surgery.id);
      
      
      if (result.success) {
        setGeneratedForms(result.files);
        setConsentFormsData(result.data);
        
        
        toast({
          title: "Success",
          description: "Consent forms generated successfully. Please review and proceed to sign.",
        });
      } else {
        throw new Error(result.message || 'Failed to generate consent forms');
      }
    } catch (error) {
      
      // Extract error message from response
      let errorMessage = 'Failed to generate consent forms. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && error.message !== 'Failed to generate consent forms') {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoadingConsentForms(false);
    }
  };

  const handleSignPdf = (formType, pdfUrl) => {
    setCurrentSigningPdf({ formType, url: pdfUrl });
    setPdfSignatureModalOpen(true);
  };

  const handleSaveSignedPdf = async (signedBlob, formType) => {
    try {
      
      // Save signed form (service will create FormData)
      const result = await consentFormService.saveSignedConsentForm(
        surgery.id,
        formType,
        signedBlob
      );
      
      if (result.success) {
        // Update signed forms state
        setSignedForms(prev => ({
          ...prev,
          [formType]: result.file.filename
        }));
        
        // Update generatedForms with signed PDF URL
        const signedPdfUrl = consentFormService.getSignedPdfUrl(
          surgery.id,
          formType,
          result.file.filename
        );
        
        setGeneratedForms(prev => ({
          ...prev,
          [formType]: {
            ...prev[formType],
            url: signedPdfUrl,
            signed: true
          }
        }));
        
        
        toast({
          title: "Success",
          description: `${formType === 'ophsureng' ? 'Ophthalmic Surgery' : 'Anesthesia'} consent form signed and saved successfully.`,
        });
        
        // Check if both forms are signed
        const allSigned = formType === 'ophsureng' 
          ? signedForms.ansconeng !== null
          : signedForms.ophsureng !== null;
        
        if (allSigned) {
          setConsentFormsCompleted(true);
          toast({
            title: "All Forms Signed",
            description: "Both consent forms have been signed. You can now proceed.",
          });
        }
      } else {
        throw new Error(result.message || 'Failed to save signed form');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save signed PDF",
        variant: "destructive"
      });
    }
  };

  // Filter lenses for search
  const getFilteredLenses = () => {
    if (!checkinResources) return [];
    
    return checkinResources.allLenses
      .filter(lens => 
        lens.id !== selectedLens?.lensId &&
        (lens.lensName.toLowerCase().includes(lensSearch.toLowerCase()) ||
         (lens.lensCode && lens.lensCode.toLowerCase().includes(lensSearch.toLowerCase())))
      )
      .slice(0, 8);
  };

  const handleEquipmentAdd = (equipment) => {
    if (equipment.currentStock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${equipment.name} is currently out of stock.`,
        variant: "destructive"
      });
      return;
    }

    const newEquipment = {
      equipmentId: equipment.id,
      name: equipment.name,
      code: equipment.code,
      category: equipment.category,
      manufacturer: equipment.manufacturer,
      currentStock: equipment.currentStock,
      reorderLevel: equipment.reorderLevel,
      unitCost: equipment.unitCost,
      batchNumber: equipment.batchNumber,
      expiryDate: equipment.expiryDate,
      quantity: 1,
      isRecommended: equipment.isRecommended || false,
      packageName: equipment.packageName || null
    };
    
    setSelectedEquipments(prev => [...prev, newEquipment]);
    setEquipmentSearch('');
    setShowSearchResults(false);
  };

  const handleEquipmentRemove = (equipmentId) => {
    setSelectedEquipments(prev => prev.filter(eq => eq.equipmentId !== equipmentId));
  };

  const handleEquipmentQuantityChange = (equipmentId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setSelectedEquipments(prev => 
      prev.map(eq => 
        eq.equipmentId === equipmentId 
          ? { ...eq, quantity: Math.min(newQuantity, eq.currentStock) }
          : eq
      )
    );
  };

  const handleLensSelect = (lens) => {
    setSelectedLens({
      lensId: lens.id,
      lensName: lens.lensName,
      lensCode: lens.lensCode,
      lensType: lens.lensType,
      lensCategory: lens.lensCategory,
      patientCost: lens.patientCost,
      stockQuantity: lens.stockQuantity,
      isRecommended: false
    });
    setLensSearch('');
  };

  // Utility function to get stock status styling and text
  const getStockStatus = (currentStock, reorderLevel = 5) => {
    if (currentStock === 0) {
      return { color: 'text-red-600', bgColor: 'bg-red-100', text: 'Out of Stock', icon: '❌' };
    } else if (currentStock <= reorderLevel) {
      return { color: 'text-orange-600', bgColor: 'bg-orange-100', text: 'Low Stock', icon: '⚠️' };
    } else {
      return { color: 'text-green-600', bgColor: 'bg-green-100', text: 'In Stock', icon: '✅' };
    }
  };

  const handleLensRemove = () => {
    setSelectedLens(null);
  };

  const steps = [
    { id: 1, name: 'Upload Documents', icon: FileText },
    { id: 2, name: 'Select Equipment', icon: Package },
    { id: 3, name: 'Surgery Preparations', icon: ClipboardCheck },
    { id: 4, name: 'Consent Forms', icon: FileSignature }
  ];

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    // Calculate how many more files we can upload
    const remainingSlots = 10 - uploadedFiles.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Error",
        description: "Maximum 10 documents allowed. Remove some files to upload new ones.",
        variant: "destructive"
      });
      return;
    }

    // Allow up to 10 PDF files total, take only what we can fit
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
      toast({
        title: "Warning",
        description: `Only uploading ${remainingSlots} file(s). Maximum 10 documents allowed.`,
        variant: "default"
      });
    }
    
    // Validate files
    for (const file of filesToUpload) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Error",
          description: "Only PDF files are allowed",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        toast({
          title: "Error",
          description: "File size must be less than 20MB",
          variant: "destructive"
        });
        return;
      }
    }

    setUploadingFile(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 80) return prev + 10;
          return prev;
        });
      }, 200);


      // Call the upload API if available - upload files one by one since backend expects single file
      if (onUploadComplete && typeof onUploadComplete === 'function') {
        try {
          const uploadedFileData = [];
          
          // Upload files sequentially (backend expects single file per request)
          for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            const formData = new FormData();
            formData.append('document', file); // Backend expects 'document' field name
            
            
            const response = await onUploadComplete(surgery.id, formData);
            
            if (response && response.success) {
              uploadedFileData.push({
                fileName: file.name,
                uploadTime: new Date(),
                size: file.size,
                documentPath: response.data?.documentPath || response.data?.filePath
              });
              
              // Update progress for each file
              const fileProgress = ((i + 1) / filesToUpload.length) * 100;
              setUploadProgress(Math.min(fileProgress, 95));
            } else {
              throw new Error(response?.message || `Upload failed for ${file.name}`);
            }
          }
          
          clearInterval(progressInterval);
          
          // Add new files to existing uploaded files
          setUploadedFiles(prevFiles => [...prevFiles, ...uploadedFileData]);
          setUploadProgress(100);
          setDocumentsSkipped(false); // Reset skipped state when documents are uploaded

          toast({
            title: "Success",
            description: `${filesToUpload.length} investigation document(s) uploaded successfully. Total: ${uploadedFiles.length + filesToUpload.length} file(s).`,
          });
          
        } catch (uploadError) {
          clearInterval(progressInterval);
          
          // Show more specific error message based on error type
          let errorMessage = uploadError.message || 'Failed to upload documents';
          if (uploadError.status === 403) {
            errorMessage = 'Access denied. You may not have permission to upload investigation documents. Please contact your administrator.';
          } else if (uploadError.status === 400) {
            errorMessage = `Upload failed: ${uploadError.message}. Please ensure you are uploading valid PDF files.`;
          } else if (uploadError.status === 401) {
            errorMessage = 'Authentication required. Please log in again.';
          }
          
          throw new Error(errorMessage);
        }
      } else {
        // If no upload function provided, simulate successful upload
        clearInterval(progressInterval);
        const uploadedFileData = filesToUpload.map(file => ({
          fileName: file.name,
          uploadTime: new Date(),
          size: file.size
        }));
        
        // Add new files to existing uploaded files
        setUploadedFiles(prevFiles => [...prevFiles, ...uploadedFileData]);
        setUploadProgress(100);
        setDocumentsSkipped(false); // Reset skipped state when documents are uploaded

        toast({
          title: "Success",
          description: `${filesToUpload.length} investigation document(s) prepared for upload. Total: ${uploadedFiles.length + filesToUpload.length} file(s).`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload documents",
        variant: "destructive"
      });
      
      setUploadProgress(0);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileRemove = async (indexToRemove) => {
    const fileToRemove = uploadedFiles[indexToRemove];
    
    
    try {
      // If file has documentPath (was uploaded to server) and delete function is provided
      if (fileToRemove.documentPath && onDeleteDocument) {
        await onDeleteDocument(surgery.id, fileToRemove.documentPath);
      }
      
      // Remove from local state
      setUploadedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
      
      toast({
        title: "File Removed",
        description: `${fileToRemove.fileName} removed successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove document",
        variant: "destructive"
      });
    }
  };

  const handleFileInputChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // Reset input value
    event.target.value = '';
  };

  const handleStepNext = () => {
    // If on step 1 and no documents uploaded, show confirmation
    if (currentStep === 1 && uploadedFiles.length === 0) {
      setShowSkipConfirmation(true);
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleSkipDocuments = () => {
    setShowSkipConfirmation(false);
    setDocumentsSkipped(true);
    setCurrentStep(2);
  };
  
  const handleCancelSkip = () => {
    setShowSkipConfirmation(false);
  };

  const handleStepPrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedFromStep1 = true; // Always allow proceeding from step 1 (documents optional)
  const canProceedFromStep2 = selectedEquipments.length > 0; // Must have at least one equipment
  const canProceedFromStep3 = preparationsComplete;
  const canCompleteStep4 = consentFormsCompleted;

  const handleComplete = async () => {
    try {
      // First update checkin selections
      const selectionsData = {
        selectedEquipments: selectedEquipments.map(eq => ({
          equipmentId: eq.equipmentId,
          quantity: eq.quantity,
          notes: eq.notes || null
        })),
        selectedLens: selectedLens ? {
          lensId: selectedLens.lensId,
          notes: selectedLens.notes || null
        } : null
      };


      const selectionsResponse = await ipdService.updateCheckinSelections(surgery.id, selectionsData);

      if (!selectionsResponse.success) {
        throw new Error(selectionsResponse.message || 'Failed to update selections');
      }

      // Then process the complete checkin with stock adjustments
      const checkinData = await ipdService.processSurgeryCheckin(surgery.id, {
        finalizeStock: true,
        preparationNotes: preparationNotes.trim() || null,
        requiresAnesthesia: requiresAnesthesia
      });

      if (!checkinData.success) {
        throw new Error(checkinData.message || 'Failed to process checkin');
      }

      
      // Show success toast immediately
      toast({
        title: "Success",
        description: "Surgery preparation completed successfully! Stock has been adjusted and patient is ready to proceed.",
      });
      
      // Close modal immediately
      onClose();
      
      // Call success callback which will handle UI refresh and animation
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete surgery preparation. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!surgery) return null;

  return (
    <React.Fragment>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>

        {/* Main Content */}
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Check-in & Surgery Preparation
          </DialogTitle>
          <div className="text-sm text-gray-600">
            Patient: <span className="font-medium">{surgery.patient?.firstName} {surgery.patient?.lastName}</span>
            <span className="mx-2">•</span>
            Surgery: <span className="font-medium">{surgery.surgeryTypeDetail?.name}</span>
          </div>
        </DialogHeader>

        {/* Stepper Navigation */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isAccessible = step.id === 1 || 
                (step.id === 2 && canProceedFromStep1) || 
                (step.id === 3 && canProceedFromStep1 && canProceedFromStep2) ||
                (step.id === 4 && canProceedFromStep1 && canProceedFromStep2 && canProceedFromStep3);

              // Special handling for step 1 to show different states
              const getStepContent = () => {
                if (step.id === 1 && isCompleted) {
                  if (uploadedFiles.length > 0) {
                    // Documents uploaded - show green check
                    return {
                      icon: CheckCircle,
                      bgColor: 'bg-green-600 border-green-600 text-white',
                      textColor: 'text-green-600'
                    };
                  } else if (documentsSkipped) {
                    // Documents skipped - show amber skip icon
                    return {
                      icon: AlertCircle,
                      bgColor: 'bg-amber-500 border-amber-500 text-white',
                      textColor: 'text-amber-600'
                    };
                  }
                }
                
                // Default states for other steps or incomplete step 1
                if (isCompleted) {
                  return {
                    icon: CheckCircle,
                    bgColor: 'bg-green-600 border-green-600 text-white',
                    textColor: 'text-green-600'
                  };
                } else if (isActive) {
                  return {
                    icon: StepIcon,
                    bgColor: 'bg-blue-600 border-blue-600 text-white',
                    textColor: 'text-blue-600'
                  };
                } else if (isAccessible) {
                  return {
                    icon: StepIcon,
                    bgColor: 'border-gray-300 text-gray-600 hover:border-blue-400 cursor-pointer',
                    textColor: 'text-gray-600'
                  };
                } else {
                  return {
                    icon: StepIcon,
                    bgColor: 'border-gray-200 text-gray-400',
                    textColor: 'text-gray-600'
                  };
                }
              };

              const stepContent = getStepContent();
              const DisplayIcon = stepContent.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2
                      ${stepContent.bgColor}
                    `}
                    onClick={() => {
                      if (isAccessible && step.id <= Math.max(currentStep, 
                        canProceedFromStep1 ? (canProceedFromStep2 ? (canProceedFromStep3 ? 4 : 3) : 2) : 1)) {
                        setCurrentStep(step.id);
                      }
                    }}
                    >
                      <DisplayIcon className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-blue-600' : stepContent.textColor
                      }`}>
                        {step.name}
                        {step.id === 1 && isCompleted && documentsSkipped && uploadedFiles.length === 0 && (
                          <span className="text-xs block text-amber-600">(Skipped)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-5 w-5 text-gray-400 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Step 1: Document Upload */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Investigation Documents</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload the required investigation documents (up to 10 PDF files, max 20MB each)
                </p>
              </div>

              {/* Patient Information Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Patient Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Patient Number:</span>
                    <span className="ml-2 font-mono">{surgery.patient?.patientNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Admission Number:</span>
                    <span className="ml-2 font-mono">{surgery.admissionNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Surgery Date:</span>
                    <span className="ml-2">{surgery.surgeryDate ? new Date(surgery.surgeryDate).toLocaleDateString() : 'Not scheduled'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Surgery Time:</span>
                    <span className="ml-2">{surgery.tentativeTime || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* File Upload Area */}
              <div className="space-y-4">
                {!uploadingFile && uploadedFiles.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
                    <div className="text-center">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <div className="space-y-2 mb-4">
                        <p className="text-lg font-medium text-gray-700">
                          Upload Investigation Documents
                        </p>
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF files only, max 20MB each, up to 10 files
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={handleFileInputChange}
                        className="hidden"
                        id="document-upload"
                      />
                      <Button
                        onClick={() => document.getElementById('document-upload').click()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Select PDF Files
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* Upload Progress */}
                {uploadingFile && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Loader className="h-5 w-5 text-blue-600 animate-spin" />
                      <span className="text-sm text-gray-700">Uploading documents...</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-gray-600">Upload progress: {uploadProgress}%</p>
                  </div>
                )}

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Uploaded Documents ({uploadedFiles.length}/10)</h4>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-800">{file.fileName}</p>
                              <p className="text-xs text-green-600">
                                Uploaded at {file.uploadTime.toLocaleTimeString()} • {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              ✓ Uploaded
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFileRemove(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {uploadedFiles.length < 10 && (
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('document-upload').click()}
                        className="w-full border-dashed border-gray-300"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Additional Document ({uploadedFiles.length}/10)
                      </Button>
                    )}
                    
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="document-upload"
                    />
                  </div>
                )}
              </div>
              
              {/* Skip Documents Confirmation */}
              {showSkipConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertCircle className="h-6 w-6 text-amber-600" />
                      <h4 className="font-semibold text-gray-900">Skip Document Upload?</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                      You haven't uploaded any investigation documents. Are you sure you want to proceed without uploading documents? You can upload them later if needed.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={handleCancelSkip}>
                        Cancel
                      </Button>
                      <Button onClick={handleSkipDocuments} className="bg-amber-600 hover:bg-amber-700">
                        Yes, Skip Documents
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Equipment & Lens Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Surgery Equipment & Lens</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select equipment and lens needed for the surgery with real-time stock information
                </p>
              </div>

              {loadingResources ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">Loading surgery resources...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Equipment Selection */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        Equipment Selection
                      </h4>
                      <div className="flex items-center gap-4">
                        <Label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={showRecommendedOnly}
                            onCheckedChange={setShowRecommendedOnly}
                          />
                          Show recommended only
                        </Label>
                      </div>
                    </div>

                    {/* Equipment Search */}
                    <div className="space-y-4">
                      <div className="relative">
                        <Input
                          placeholder={showRecommendedOnly ? "Search recommended equipment..." : "Search all equipment... (type at least 2 characters)"}
                          value={equipmentSearch}
                          onChange={(e) => setEquipmentSearch(e.target.value)}
                          className="pr-10"
                        />
                        {searching ? (
                          <Loader className="h-4 w-4 text-blue-600 animate-spin absolute right-3 top-1/2 transform -translate-y-1/2" />
                        ) : (
                          <Search className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                        )}
                      </div>

                      {/* Real-time Equipment Search Results */}
                      {showSearchResults && searchResults.length > 0 && (
                        <Card className="max-h-64 overflow-y-auto border-blue-200">
                          <CardHeader className="py-2 px-3 bg-blue-50">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Search className="h-4 w-4" />
                              Search Results ({searchResults.length})
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            {searchResults.map((equipment) => {
                              const stockStatus = getStockStatus(equipment.currentStock, equipment.reorderLevel);
                              return (
                                <div
                                  key={equipment.id}
                                  className="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => handleEquipmentAdd(equipment)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-sm">{equipment.name}</span>
                                        <Badge 
                                          className={`text-xs ${stockStatus.bgColor} ${stockStatus.color} border-0`}
                                        >
                                          {stockStatus.icon} {stockStatus.text}
                                        </Badge>
                                      </div>
                                      <div className="text-xs text-gray-600 space-y-1">
                                        <div className="flex items-center gap-4">
                                          {equipment.code && (
                                            <span><strong>Code:</strong> {equipment.code}</span>
                                          )}
                                          <span><strong>Category:</strong> {equipment.category}</span>
                                          {equipment.manufacturer && (
                                            <span><strong>Manufacturer:</strong> {equipment.manufacturer}</span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <span className={`font-semibold ${stockStatus.color}`}>
                                            <strong>Available Stock:</strong> {equipment.currentStock} units
                                          </span>
                                          {equipment.reorderLevel && (
                                            <span><strong>Reorder Level:</strong> {equipment.reorderLevel}</span>
                                          )}
                                          {equipment.unitCost && (
                                            <span><strong>Unit Cost:</strong> ₹{equipment.unitCost}</span>
                                          )}
                                        </div>
                                        {equipment.batchNumber && (
                                          <div className="flex items-center gap-4">
                                            <span><strong>Batch:</strong> {equipment.batchNumber}</span>
                                            {equipment.expiryDate && (
                                              <span><strong>Expiry:</strong> {new Date(equipment.expiryDate).toLocaleDateString()}</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className={equipment.currentStock > 0 ? "text-blue-600 hover:text-blue-700" : "text-gray-400"}
                                      disabled={equipment.currentStock <= 0}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      {equipment.currentStock > 0 ? 'Add' : 'Out of Stock'}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      )}

                      {/* No search results message */}
                      {showSearchResults && searchResults.length === 0 && equipmentSearch.length >= 2 && !searching && (
                        <Card className="border-orange-200">
                          <CardContent className="p-4 text-center">
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                              <Package className="h-8 w-8 text-gray-300" />
                              <p className="text-sm">No equipment found for "{equipmentSearch}"</p>
                              <p className="text-xs">Try different search terms or check spelling</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Recommended Equipment (when not searching) */}
                      {!showSearchResults && showRecommendedOnly && checkinResources?.recommendedEquipment && (
                        <Card className="max-h-60 overflow-y-auto">
                          <CardHeader className="py-2 px-3 bg-green-50">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Recommended Equipment
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            {checkinResources.recommendedEquipment
                              .filter(equipment => !selectedEquipments.some(selected => selected.equipmentId === equipment.id))
                              .map((equipment) => {
                                const stockStatus = getStockStatus(equipment.currentStock, equipment.reorderLevel);
                                return (
                                  <div
                                    key={equipment.id}
                                    className="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => handleEquipmentAdd(equipment)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="font-medium text-sm">{equipment.name}</span>
                                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                            Recommended
                                          </Badge>
                                          <Badge 
                                            className={`text-xs ${stockStatus.bgColor} ${stockStatus.color} border-0`}
                                          >
                                            {stockStatus.icon} {stockStatus.text}
                                          </Badge>
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                          <div className="flex items-center gap-4">
                                            {equipment.code && <span><strong>Code:</strong> {equipment.code}</span>}
                                            <span><strong>Available Stock:</strong> {equipment.currentStock} units</span>
                                            {equipment.packageName && <span><strong>From Package:</strong> {equipment.packageName}</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700">
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Selected Equipment */}
                    <div className="space-y-4">
                      <h5 className="font-medium text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Selected Equipment ({selectedEquipments.length})
                      </h5>
                      {selectedEquipments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                          <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No equipment selected yet</p>
                          <p className="text-xs text-gray-400">Search and add equipment above</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                          {selectedEquipments.map((equipment) => {
                            const stockStatus = getStockStatus(equipment.currentStock, equipment.reorderLevel);
                            const remainingAfterUse = equipment.currentStock - equipment.quantity;
                            return (
                              <Card key={equipment.equipmentId} className="border-blue-200 bg-blue-50">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 space-y-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Package className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-blue-800">{equipment.name}</span>
                                        {equipment.isRecommended && (
                                          <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                                            Recommended
                                          </Badge>
                                        )}
                                        <Badge 
                                          className={`text-xs ${stockStatus.bgColor} ${stockStatus.color} border-0`}
                                        >
                                          {stockStatus.icon} {equipment.currentStock} units
                                        </Badge>
                                      </div>
                                      
                                      <div className="text-xs text-blue-600 space-y-1">
                                        <div className="flex items-center gap-4 flex-wrap">
                                          {equipment.code && <span><strong>Code:</strong> {equipment.code}</span>}
                                          <span><strong>Category:</strong> {equipment.category}</span>
                                          {equipment.manufacturer && <span><strong>Manufacturer:</strong> {equipment.manufacturer}</span>}
                                        </div>
                                        
                                        <div className="flex items-center gap-4 flex-wrap">
                                          <span className={stockStatus.color}>
                                            <strong>Current Stock:</strong> {equipment.currentStock} units
                                          </span>
                                          <span>
                                            <strong>After Use:</strong> 
                                            <span className={remainingAfterUse <= (equipment.reorderLevel || 5) ? 'text-orange-600 font-semibold' : 'text-green-600'}>
                                              {remainingAfterUse} units
                                            </span>
                                          </span>
                                          {equipment.unitCost && (
                                            <span><strong>Unit Cost:</strong> ₹{equipment.unitCost}</span>
                                          )}
                                        </div>
                                        
                                        {(equipment.batchNumber || equipment.packageName) && (
                                          <div className="flex items-center gap-4 flex-wrap">
                                            {equipment.batchNumber && (
                                              <span><strong>Batch:</strong> {equipment.batchNumber}</span>
                                            )}
                                            {equipment.packageName && (
                                              <span><strong>From Package:</strong> {equipment.packageName}</span>
                                            )}
                                            {equipment.expiryDate && (
                                              <span><strong>Expiry:</strong> {new Date(equipment.expiryDate).toLocaleDateString()}</span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="flex flex-col items-center gap-2">
                                        <Label className="text-xs text-gray-600">Quantity</Label>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEquipmentQuantityChange(equipment.equipmentId, equipment.quantity - 1)}
                                            disabled={equipment.quantity <= 1}
                                          >
                                            <Minus className="h-3 w-3" />
                                          </Button>
                                          <span className="min-w-[2rem] text-center text-sm font-medium">{equipment.quantity}</span>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEquipmentQuantityChange(equipment.equipmentId, equipment.quantity + 1)}
                                            disabled={equipment.quantity >= equipment.currentStock}
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          Max: {equipment.currentStock}
                                        </span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEquipmentRemove(equipment.equipmentId)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lens Selection */}
                  <div className="space-y-6 border-t pt-6">
                    <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-green-600" />
                      Lens Selection
                      {checkinResources?.admission?.currentLensId && (
                        <Badge variant="outline" className="text-xs">
                          Doctor Recommended
                        </Badge>
                      )}
                    </h4>

                    {/* Current Selected Lens */}
                    {selectedLens ? (
                      <Card className="border-green-200 bg-green-50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Eye className="h-4 w-4 text-green-600" />
                              Selected Lens
                              {selectedLens.isRecommended && (
                                <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                                  Doctor Recommended
                                </Badge>
                              )}
                            </CardTitle>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleLensRemove}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            <div className="font-medium text-green-800">{selectedLens.lensName}</div>
                            <div className="text-sm text-green-600 space-x-2">
                              {selectedLens.lensCode && <span>Code: {selectedLens.lensCode}</span>}
                              <span>•</span>
                              <span>Type: {selectedLens.lensType}</span>
                              <span>•</span>
                              <span>Category: {selectedLens.lensCategory}</span>
                              <span>•</span>
                              <span>Stock: {selectedLens.stockQuantity}</span>
                              <span>•</span>
                              <span>Cost: ₹{selectedLens.patientCost}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        <Eye className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No lens selected</p>
                        <p className="text-xs text-gray-400">
                          {checkinResources?.admission?.currentLensId 
                            ? "Doctor recommendation will be selected automatically if available" 
                            : "Search and select a lens below"}
                        </p>
                      </div>
                    )}

                    {/* Lens Search */}
                    {!selectedLens && (
                      <div className="space-y-4">
                        <div className="relative">
                          <Input
                            placeholder="Search for lens..."
                            value={lensSearch}
                            onChange={(e) => setLensSearch(e.target.value)}
                            className="pr-10"
                          />
                          <Search className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                        </div>

                        {/* Lens Suggestions */}
                        {lensSearch && getFilteredLenses().length > 0 && (
                          <Card className="max-h-60 overflow-y-auto">
                            <CardContent className="p-0">
                              {getFilteredLenses().map((lens) => (
                                <div
                                  key={lens.id}
                                  className="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                                  onClick={() => handleLensSelect(lens)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm mb-1">{lens.lensName}</div>
                                      <div className="text-xs text-gray-500 space-x-2">
                                        {lens.lensCode && <span>Code: {lens.lensCode}</span>}
                                        <span>•</span>
                                        <span>Type: {lens.lensType}</span>
                                        <span>•</span>
                                        <span>Stock: {lens.stockQuantity}</span>
                                        <span>•</span>
                                        <span>Cost: ₹{lens.patientCost}</span>
                                      </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700">
                                      <Plus className="h-4 w-4 mr-1" />
                                      Select
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Surgery Preparations */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Surgery Preparations</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Complete the final preparations checklist
                </p>
              </div>

              {/* Preparation Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Preparation Summary</h4>
                
                {/* Summary Table */}
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Documents
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) uploaded` : 'Skipped'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {uploadedFiles.length > 0 ? (
                            uploadedFiles.slice(0, 2).map((file, idx) => (
                              <div key={idx} className="text-xs">{file.name}</div>
                            ))
                          ) : (
                            <span className="text-xs">No documents uploaded</span>
                          )}
                          {uploadedFiles.length > 2 && (
                            <div className="text-xs text-gray-400">+{uploadedFiles.length - 2} more</div>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Equipment
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {selectedEquipments.length} item(s) selected
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {selectedEquipments.length > 0 ? (
                            <div className="space-y-1">
                              {selectedEquipments.map(eq => (
                                <div key={eq.equipmentId} className="text-xs">
                                  {eq.name} (Qty: {eq.quantity})
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs">No equipment selected</span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Lens
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {selectedLens ? selectedLens.lensName : 'None selected'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {selectedLens ? (
                            <div className="space-y-1">
                              <div className="text-xs">
                                Type: {selectedLens.lensType} | Category: {selectedLens.lensCategory}
                              </div>
                              <div className="text-xs">
                                Stock: {selectedLens.stockQuantity} | Cost: ₹{selectedLens.patientCost}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs">No lens selected</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Preparation Checklist */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <Checkbox
                      id="preparations-complete"
                      checked={preparationsComplete}
                      onCheckedChange={setPreparationsComplete}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor="preparations-complete" className="text-sm font-medium text-gray-900 cursor-pointer">
                        All surgery preparations are complete
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        Confirm that all necessary preparations have been completed for the surgery
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <Checkbox
                      id="requires-anesthesia"
                      checked={requiresAnesthesia}
                      onCheckedChange={setRequiresAnesthesia}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor="requires-anesthesia" className="text-sm font-medium text-gray-900 cursor-pointer">
                        Requires Anesthesia
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        Check if anesthesia is required for this surgery
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preparation Notes */}
                <div className="space-y-2">
                  <label htmlFor="preparation-notes" className="text-sm font-medium text-gray-900">
                    Preparation Notes (Optional)
                  </label>
                  <Textarea
                    id="preparation-notes"
                    placeholder="Add any additional notes or observations..."
                    value={preparationNotes}
                    onChange={(e) => setPreparationNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Consent Forms */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Consent Forms</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Review and sign the pre-filled consent forms before proceeding to surgery
                </p>
              </div>

              {loadingConsentForms ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">Generating consent forms...</p>
                    <p className="text-xs text-gray-500 mt-2">Fetching patient data and filling forms</p>
                  </div>
                </div>
              ) : generatedForms ? (
                <div className="space-y-6">
                  {/* Patient Information */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Patient Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Patient Name:</span>
                        <span className="ml-2 font-medium">{consentFormsData?.patientName}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Patient Number:</span>
                        <span className="ml-2 font-mono">{consentFormsData?.patientNumber}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Age:</span>
                        <span className="ml-2">{consentFormsData?.age} years</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Gender:</span>
                        <span className="ml-2">{consentFormsData?.gender}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Surgery Type:</span>
                        <span className="ml-2 font-medium">{consentFormsData?.surgeryType}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Admission Number:</span>
                        <span className="ml-2 font-mono">{consentFormsData?.admissionNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Consent Forms */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Pre-filled Consent Forms</h4>
                    
                    {/* Ophthalmic Surgery Consent */}
                    <Card className={`border-2 ${signedForms.ophsureng ? 'border-green-300 bg-green-50' : 'border-green-200'}`}>
                      <CardHeader className="bg-green-50">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileSignature className="h-4 w-4 text-green-600" />
                          Ophthalmic Surgery Consent Form
                          {signedForms.ophsureng && (
                            <Badge variant="success" className="ml-auto bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Signed
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">
                            This form contains pre-filled information about the surgery procedure, risks, and patient consent.
                          </p>
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(generatedForms.ophsureng.url, '_blank')}
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {signedForms.ophsureng ? 'Preview Signed' : 'Preview'}
                            </Button>
                            {!signedForms.ophsureng ? (
                              <Button
                                size="sm"
                                onClick={() => handleSignPdf('ophsureng', generatedForms.ophsureng.url)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <FileSignature className="h-4 w-4 mr-2" />
                                Sign Form
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 cursor-not-allowed"
                                disabled
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Signed
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Anesthesia Consent */}
                    <Card className={`border-2 ${signedForms.ansconeng ? 'border-purple-300 bg-purple-50' : 'border-purple-200'}`}>
                      <CardHeader className="bg-purple-50">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileSignature className="h-4 w-4 text-purple-600" />
                          Anesthesia Consent Form
                          {signedForms.ansconeng && (
                            <Badge variant="success" className="ml-auto bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Signed
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">
                            This form contains information about anesthesia procedures, risks, and patient consent.
                          </p>
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(generatedForms.ansconeng.url, '_blank')}
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {signedForms.ansconeng ? 'Preview Signed' : 'Preview'}
                            </Button>
                            {!signedForms.ansconeng ? (
                              <Button
                                size="sm"
                                onClick={() => handleSignPdf('ansconeng', generatedForms.ansconeng.url)}
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                              >
                                <FileSignature className="h-4 w-4 mr-2" />
                                Sign Form
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 cursor-not-allowed"
                                disabled
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Signed
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Instructions */}
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Signing Instructions
                    </h4>
                    <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                      <li>Preview the forms to verify all information is correct</li>
                      <li>Click "Sign Form" to open the in-browser PDF editor</li>
                      <li>Use your mouse, stylus, or touchscreen to sign directly on the PDF</li>
                      <li>Both forms must be signed before completing the check-in process</li>
                    </ul>
                  </div>

                  {/* Confirmation */}
                  <div className="flex items-start gap-3 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                    <Checkbox
                      id="consent-forms-complete"
                      checked={consentFormsCompleted}
                      onCheckedChange={setConsentFormsCompleted}
                      className="mt-1"
                      disabled={!signedForms.ophsureng || !signedForms.ansconeng}
                    />
                    <div className="flex-1">
                      <label htmlFor="consent-forms-complete" className="text-sm font-medium text-blue-900 cursor-pointer">
                        Both consent forms have been reviewed and signed
                      </label>
                      <p className="text-xs text-blue-700 mt-1">
                        {signedForms.ophsureng && signedForms.ansconeng 
                          ? 'All forms are signed. Check this box to proceed.'
                          : 'Please sign both consent forms above to proceed.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileSignature className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No consent forms generated yet</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t mt-8">
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleStepPrev}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              {currentStep < 4 ? (
                <Button 
                  onClick={handleStepNext}
                  disabled={
                    (currentStep === 2 && !canProceedFromStep2) ||
                    (currentStep === 3 && !canProceedFromStep3)
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {currentStep === 1 && uploadedFiles.length === 0 ? 'Skip & Continue' : 'Next Step'}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleComplete}
                  disabled={!canCompleteStep4}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Check-in
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* PDF Signature Modal */}
      {currentSigningPdf && (
        <PDFSignatureModal
          isOpen={pdfSignatureModalOpen}
          onClose={() => {
            setPdfSignatureModalOpen(false);
            setCurrentSigningPdf(null);
          }}
          pdfUrl={currentSigningPdf.url}
          formType={currentSigningPdf.formType}
          admissionId={surgery?.id}
          onSave={handleSaveSignedPdf}
        />
      )}
    </Dialog>
    </React.Fragment>
  );
}

export default CheckinModal;