import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileText, Upload, X, AlertCircle, DollarSign, Calculator, CheckCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { claimService } from '@/services/claimService';
import { surgerySchedulerService } from '@/services/surgerySchedulerService';
import insuranceProviderService from '@/services/insuranceProviderService';
import Loader from '../loader/Loader';

const ClaimUploadModal = ({ isOpen, onClose, surgery, onSuccess }) => {
  const { toast } = useToast();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingAdditionalCharges, setLoadingAdditionalCharges] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [claimAmount, setClaimAmount] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  
  // Additional charges states
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [selectedAdditionalCharges, setSelectedAdditionalCharges] = useState([]);
  const [additionalChargesSearch, setAdditionalChargesSearch] = useState('');
  
  // Payment mode states
  const [paymentMode, setPaymentMode] = useState(''); // 'cashless' or 'reimbursement'
  
  // Surgery package cost
  const [packageCost, setPackageCost] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  // Fetch insurance providers and additional charges when modal opens
  useEffect(() => {
    if (isOpen && surgery) {
      fetchInsuranceProviders();
      fetchAdditionalCharges();
      initializeFormData();
    }
  }, [isOpen, surgery]);
  
  // Calculate final amount when package cost or selected charges change
  useEffect(() => {
    calculateFinalAmount();
  }, [packageCost, selectedAdditionalCharges]);

  const initializeFormData = () => {
    // Reset form when modal opens
    setSelectedFiles([]);
    setInsuranceProvider(surgery.insuranceProviderId || '');
    setClaimNotes('');
    setSelectedAdditionalCharges([]);
    setPaymentMode('');
    
    // Get package cost from surgery
    const cost = surgery?.surgeryPackageDetail?.packageCost || 0;
    setPackageCost(cost);
    setClaimAmount(cost.toString());
  };
  
  const calculateFinalAmount = () => {
    let total = packageCost;
    
    // Add selected additional charges
    selectedAdditionalCharges.forEach(chargeId => {
      const charge = additionalCharges.find(c => c.id === chargeId);
      if (charge) {
        total += charge.chargePrice;
      }
    });
    
    setFinalAmount(total);
    setClaimAmount(total.toString());
  };

  const fetchInsuranceProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await insuranceProviderService.getAllProviders();

      if (response.success) {
        setInsuranceProviders(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load insurance providers',
        variant: 'destructive',
      });
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchAdditionalCharges = async () => {
    try {
      setLoadingAdditionalCharges(true);
      const response = await surgerySchedulerService.getAdditionalCharges();

      if (response.success) {
        setAdditionalCharges(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load additional charges',
        variant: 'destructive',
      });
    } finally {
      setLoadingAdditionalCharges(false);
    }
  };
  
  const handleAdditionalChargeToggle = (chargeId) => {
    setSelectedAdditionalCharges(prev => {
      if (prev.includes(chargeId)) {
        return prev.filter(id => id !== chargeId);
      } else {
        return [...prev, chargeId];
      }
    });
  };
  
  const getSelectedChargesTotal = () => {
    return selectedAdditionalCharges.reduce((total, chargeId) => {
      const charge = additionalCharges.find(c => c.id === chargeId);
      return total + (charge ? charge.chargePrice : 0);
    }, 0);
  };
  
  // Filter additional charges based on search
  const filteredAdditionalCharges = additionalCharges.filter(charge => 
    charge.chargeName?.toLowerCase().includes(additionalChargesSearch.toLowerCase()) ||
    charge.chargeDesc?.toLowerCase().includes(additionalChargesSearch.toLowerCase())
  );

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file count
    if (files.length + selectedFiles.length > 10) {
      toast({
        title: 'Too Many Files',
        description: 'Maximum 10 files allowed',
        variant: 'destructive',
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isValidType) {
        toast({
          title: 'Invalid File Type',
          description: `${file.name} is not a valid file type. Only PDF and images allowed.`,
          variant: 'destructive',
        });
      }

      if (!isValidSize) {
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds 10MB limit`,
          variant: 'destructive',
        });
      }

      return isValidType && isValidSize;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!insuranceProvider) {
      toast({
        title: 'Missing Information',
        description: 'Please select an insurance provider',
        variant: 'destructive',
      });
      return;
    }

    if (!paymentMode) {
      toast({
        title: 'Missing Information',
        description: 'Please select payment mode (Cashless or Reimbursement)',
        variant: 'destructive',
      });
      return;
    }

    if (!claimAmount || isNaN(claimAmount) || parseFloat(claimAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid claim amount',
        variant: 'destructive',
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: 'Missing Documents',
        description: 'Please upload at least one claim document',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare form data for claim upload
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('claimDocuments', file);
      });
      formData.append('insuranceProviderId', insuranceProvider);
      formData.append('claimAmountRequested', finalAmount);
      formData.append('claimNotes', claimNotes || '');
      
      // Add selected additional charges info
      const selectedChargesInfo = selectedAdditionalCharges.map(chargeId => {
        const charge = additionalCharges.find(c => c.id === chargeId);
        return {
          id: charge.id,
          name: charge.chargeName,
          price: charge.chargePrice
        };
      });
      formData.append('selectedAdditionalCharges', JSON.stringify(selectedChargesInfo));
      formData.append('isCashless', paymentMode === 'cashless');
      formData.append('isReimbursement', paymentMode === 'reimbursement');

      // Submit claim
      const claimResponse = await claimService.uploadClaimDocuments(surgery.id, formData);

      if (claimResponse.success) {
        toast({
          title: 'Success',
          description: 'Claim submitted successfully with payment mode and additional charges',
          variant: 'default',
        });
        
        onSuccess();
        onClose();
      } else {
        toast({
          title: 'Submission Failed',
          description: claimResponse.message || 'Failed to submit claim. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: error.response?.data?.message || 'Failed to submit claim. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Submit Insurance Claim
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Upload claim documents and submit for processing
          </p>
        </DialogHeader>

        {surgery && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">Patient Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-700">Name:</span>
                <span className="ml-2 font-medium">
                  {surgery.patient?.firstName} {surgery.patient?.lastName}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Patient #:</span>
                <span className="ml-2 font-medium">{surgery.patient?.patientNumber}</span>
              </div>
              <div>
                <span className="text-blue-700">Admission #:</span>
                <span className="ml-2 font-medium">{surgery.admissionNumber}</span>
              </div>
              <div>
                <span className="text-blue-700">Surgery:</span>
                <span className="ml-2 font-medium">{surgery.surgeryTypeDetail?.name}</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Package Cost Breakdown */}
          <Alert className="bg-blue-50 border-blue-200">
            <Calculator className="h-4 w-4 text-blue-600" />
            <AlertDescription className="ml-2">
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-blue-900">Claim Breakdown:</div>
                <div className="space-y-1 text-blue-800">
                  <div className="flex justify-between">
                    <span>Surgery Package Cost:</span>
                    <span className="font-medium">₹{packageCost?.toLocaleString()}</span>
                  </div>
                  
                  {/* Lens Information */}
                  <div className="flex justify-between text-sm">
                    <span>Package Includes:</span>
                    <span className="font-medium text-blue-700">
                      {surgery?.surgeryPackageDetail?.defaultLensName 
                        ? `${surgery.surgeryPackageDetail.defaultLensName} lens`
                        : 'No lens required in this package'
                      }
                    </span>
                  </div>
                  
                  {/* Selected Additional Charges */}
                  {selectedAdditionalCharges.length > 0 && (
                    <div className="border-t border-blue-300 pt-2 mt-2">
                      <div className="font-medium text-blue-900 mb-1">Additional Charges:</div>
                      {selectedAdditionalCharges.map(chargeId => {
                        const charge = additionalCharges.find(c => c.id === chargeId);
                        return charge ? (
                          <div key={chargeId} className="flex justify-between text-sm">
                            <span>• {charge.chargeName}</span>
                            <span>₹{charge.chargePrice?.toLocaleString()}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-base border-t border-blue-300 pt-2 mt-2">
                    <span>Total Amount:</span>
                    <span>₹{finalAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Insurance Provider Selection */}
          <div>
            <Label htmlFor="insuranceProvider" className="required">
              Insurance Provider <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={insuranceProvider} 
              onValueChange={setInsuranceProvider}
              disabled={loadingProviders}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProviders ? "Loading providers..." : "Select insurance provider"} />
              </SelectTrigger>
              <SelectContent>
                {loadingProviders ? (
                  <SelectItem value="loading" disabled>
                    Loading providers...
                  </SelectItem>
                ) : insuranceProviders.length > 0 ? (
                  insuranceProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{provider.providerName}</span>
                        {provider.providerCode && (
                          <span className="text-xs text-gray-500">Code: {provider.providerCode}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No insurance providers available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {insuranceProviders.length} provider(s) available
            </p>
          </div>

          {/* Additional Charges Selection */}
          <div>
            <Label className="mb-3">Additional Charges (Optional)</Label>
            {loadingAdditionalCharges ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Loader size="sm" />
                <span className="text-sm text-gray-500">Loading additional charges...</span>
              </div>
            ) : additionalCharges.length > 0 ? (
              <div className="border rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-3">Select any additional charges to include:</div>
                
                {/* Search Bar */}
                <div className="relative mb-3">
                  <Input
                    type="text"
                    placeholder="Search additional charges..."
                    value={additionalChargesSearch}
                    onChange={(e) => setAdditionalChargesSearch(e.target.value)}
                    className="text-sm"
                  />
                  {additionalChargesSearch && (
                    <button
                      type="button"
                      onClick={() => setAdditionalChargesSearch('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                {/* Scrollable Charges List */}
                <div className={`space-y-2 ${
                  filteredAdditionalCharges.length > 5 ? 'max-h-60 overflow-y-auto pr-2' : ''
                }`}>
                  {filteredAdditionalCharges.length > 0 ? (
                    filteredAdditionalCharges.map((charge) => (
                      <div key={charge.id} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50">
                        <input
                          type="checkbox"
                          id={`charge-${charge.id}`}
                          checked={selectedAdditionalCharges.includes(charge.id)}
                          onChange={() => handleAdditionalChargeToggle(charge.id)}
                          className="rounded"
                        />
                        <label htmlFor={`charge-${charge.id}`} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-gray-900">{charge.chargeName}</span>
                              {charge.chargeDesc && (
                                <p className="text-xs text-gray-500">{charge.chargeDesc}</p>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-blue-600">
                              ₹{charge.chargePrice?.toLocaleString()}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 p-2 text-center">
                      {additionalChargesSearch ? (
                        <>No charges found matching "{additionalChargesSearch}"</>
                      ) : (
                        'No additional charges available'
                      )}
                    </div>
                  )}
                </div>
                
                {/* Summary */}
                {selectedAdditionalCharges.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Additional Charges Total ({selectedAdditionalCharges.length} selected):</span>
                      <span className="text-blue-600">₹{getSelectedChargesTotal().toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 p-3 border rounded-lg">
                No additional charges available
              </div>
            )}
          </div>

          {/* Payment Mode Selection */}
          <div>
            <Label className="mb-3">Payment Mode <span className="text-red-500">*</span></Label>
            <RadioGroup value={paymentMode} onValueChange={setPaymentMode}>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="cashless" id="cashless" />
                  <label htmlFor="cashless" className="cursor-pointer flex-1">
                    <div className="font-medium">Cashless</div>
                    <div className="text-xs text-gray-500">Direct settlement with hospital</div>
                  </label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="reimbursement" id="reimbursement" />
                  <label htmlFor="reimbursement" className="cursor-pointer flex-1">
                    <div className="font-medium">Reimbursement</div>
                    <div className="text-xs text-gray-500">Patient pays, later reimbursed</div>
                  </label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Claim Amount */}
          <div>
            <Label htmlFor="claimAmount">
              Claim Amount (₹) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="claimAmount"
                type="number"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                placeholder="Enter claim amount"
                className="pl-10"
                step="0.01"
                min="0"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Amount can be adjusted based on insurance coverage policy
            </p>
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="claimDocuments">
              Claim Documents <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                id="claimDocuments"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="claimDocuments"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, JPG, PNG, GIF, BMP, WebP (Max 10MB per file, 10 files max)
                </span>
              </label>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium">{selectedFiles.length} file(s) selected:</p>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        ({(file.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="claimNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="claimNotes"
              value={claimNotes}
              onChange={(e) => setClaimNotes(e.target.value)}
              placeholder="Enter any additional notes for the claim (e.g., special conditions, pre-authorization details, etc.)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Claim
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimUploadModal;
