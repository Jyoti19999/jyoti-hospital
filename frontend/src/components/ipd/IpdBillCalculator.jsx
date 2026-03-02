import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  IndianRupee, 
  Package, 
  Eye, 
  Wrench, 
  Plus,
  Shield,
  Calculator,
  FileText,
  Search,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Separator } from '../ui/separator';
import { useToast } from '../../hooks/use-toast';
import surgerySchedulerService from '../../services/surgerySchedulerService';
import ipdBillingService from '../../services/ipdBillingService';

const IpdBillCalculator = ({ billDetails, onPaymentClick, admissionId, onBillUpdate }) => {
  if (!billDetails) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No billing data available</p>
        </CardContent>
      </Card>
    );
  }

  const { costBreakdown, billing, insuranceDetails, paymentStatus, patientDetails, admissionDetails, billingDisplayType } = billDetails;

  const { toast } = useToast();
  const [showAddCharges, setShowAddCharges] = useState(false);
  const [availableCharges, setAvailableCharges] = useState([]);
  const [selectedCharges, setSelectedCharges] = useState([]);
  const [chargeSearch, setChargeSearch] = useState('');
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [submittingCharges, setSubmittingCharges] = useState(false);

  // Fetch available additional charges when panel opens
  useEffect(() => {
    if (showAddCharges && availableCharges.length === 0) {
      fetchAdditionalCharges();
    }
  }, [showAddCharges]);

  const fetchAdditionalCharges = async () => {
    setLoadingCharges(true);
    try {
      const response = await surgerySchedulerService.getAdditionalCharges();
      const charges = response.data?.data || response.data || [];
      // Filter out already applied charges
      const appliedIds = (costBreakdown?.billingBreakdown?.appliedAdditionalCharges || 
                          costBreakdown?.detailedBreakdown?.find(b => b.item?.includes('Additional'))?.details?.charges || [])
                          .map(c => c.id);
      const filtered = charges.filter(c => c.isActive && !appliedIds.includes(c.id));
      setAvailableCharges(filtered);
    } catch (error) {
      console.error('Error fetching additional charges:', error);
      toast({ title: 'Error', description: 'Failed to load additional charges', variant: 'destructive' });
    } finally {
      setLoadingCharges(false);
    }
  };

  const handleChargeToggle = (charge) => {
    setSelectedCharges(prev => {
      const exists = prev.find(c => c.id === charge.id);
      if (exists) return prev.filter(c => c.id !== charge.id);
      return [...prev, charge];
    });
  };

  const getSelectedTotal = () => {
    return selectedCharges.reduce((sum, c) => sum + (c.chargePrice || 0), 0);
  };

  const handleSubmitCharges = async () => {
    if (selectedCharges.length === 0) return;
    setSubmittingCharges(true);
    try {
      const charges = selectedCharges.map(c => ({
        id: c.id,
        name: c.chargeName,
        price: c.chargePrice
      }));
      await ipdBillingService.addAdditionalCharges(admissionId, charges);
      toast({ title: 'Success', description: `${charges.length} charge(s) added successfully` });
      setShowAddCharges(false);
      setSelectedCharges([]);
      setAvailableCharges([]);
      if (onBillUpdate) onBillUpdate();
    } catch (error) {
      console.error('Error adding charges:', error);
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to add charges', variant: 'destructive' });
    } finally {
      setSubmittingCharges(false);
    }
  };

  const filteredCharges = availableCharges.filter(c =>
    c.chargeName?.toLowerCase().includes(chargeSearch.toLowerCase()) ||
    c.chargeDesc?.toLowerCase().includes(chargeSearch.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getClaimStatusVariant = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'PENDING':
      case 'APPLIED':
        return 'secondary';
      case 'PARTIALLY_APPROVED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const renderCostBreakdown = () => {
    // Display detailed breakdown with surgery package + additional charges (if any)
    const breakdown = costBreakdown?.detailedBreakdown || [];
    
    return (
      <>
        {breakdown.map((item, index) => (
          <div key={index} className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {item.item.includes('Surgery Package') && <Package className="h-6 w-6 text-blue-600" />}
                {item.item.includes('Additional') && <Plus className="h-6 w-6 text-orange-600" />}
                <div>
                  <p className="font-semibold">{item.item}</p>
                  {item.details?.name && (
                    <p className="text-sm text-muted-foreground">{item.details.name}</p>
                  )}
                </div>
              </div>
              <p className="font-bold text-lg">{formatCurrency(item.amount)}</p>
            </div>
            
            {/* Package Inclusions for Surgery Package */}
            {item.item.includes('Surgery Package') && item.details?.inclusions && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="font-medium text-sm mb-2 text-green-700">Package Includes:</p>
                <div className="grid grid-cols-1 gap-1 text-xs text-green-600">
                  {item.details.inclusions.map((inclusion, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-green-600 rounded-full flex-shrink-0"></div>
                      <span>{inclusion}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 rounded text-xs text-green-800 dark:text-green-200">
                  ✅ {item.details.description}
                </div>
              </div>
            )}
            
            {/* Additional Charges Details */}
            {item.item.includes('Additional') && item.details?.charges && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="font-medium text-sm mb-2 text-orange-700">Applied Charges:</p>
                <div className="space-y-2">
                  {item.details.charges.map((charge, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{charge.name}</p>
                        {charge.description && (
                          <p className="text-xs text-muted-foreground">{charge.description}</p>
                        )}
                      </div>
                      <p className="font-semibold text-orange-600">{formatCurrency(charge.amount)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-950 rounded text-xs text-orange-800 dark:text-orange-200">
                  ℹ️ {item.details.description}
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Billing Breakdown Summary */}
        {costBreakdown?.totalBreakdown && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
              <Calculator className="h-4 w-4" />
              <p className="font-medium text-sm">Billing Summary</p>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
              {costBreakdown.totalBreakdown}
            </p>
          </div>
        )}

        {/* Show billing breakdown history if available */}
        {costBreakdown?.billingBreakdown?.tpaApproval && (
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 mb-2">
              <Shield className="h-4 w-4" />
              <p className="font-medium text-sm">TPA Approval Details</p>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 space-y-1">
              <p>✅ Approved Amount: {formatCurrency(costBreakdown.billingBreakdown.tpaApproval.sanctionedAmount)}</p>
              <p>📅 Approved Date: {new Date(costBreakdown.billingBreakdown.tpaApproval.approvedAt).toLocaleDateString()}</p>
              {costBreakdown.billingBreakdown.tpaApproval.isCashless && (
                <p>💳 Patient Payable: {formatCurrency(costBreakdown.billingBreakdown.tpaApproval.patientPayableAfterInsurance || 0)}</p>
              )}
              {costBreakdown.billingBreakdown.tpaApproval.isReimbursement && (
                <p>💰 Reimbursable Amount: {formatCurrency(costBreakdown.billingBreakdown.tpaApproval.reimbursableAmount || 0)}</p>
              )}
            </div>
          </div>
        )}
        
        {costBreakdown?.billingBreakdown?.tpaRejection && (
          <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
              <Shield className="h-4 w-4" />
              <p className="font-medium text-sm">TPA Rejection Details</p>
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
              <p>❌ Claim Rejected: {formatCurrency(costBreakdown.billingBreakdown.tpaRejection.originalClaimAmount)}</p>
              <p>📅 Rejected Date: {new Date(costBreakdown.billingBreakdown.tpaRejection.rejectedAt).toLocaleDateString()}</p>
              <p>💳 Patient Pays Full Amount: {formatCurrency(costBreakdown.billingBreakdown.tpaRejection.patientPaysFullAmount)}</p>
              <p>📝 Reason: {costBreakdown.billingBreakdown.tpaRejection.reason}</p>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-4">
      {/* Patient & Admission Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Patient & Admission Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Patient Number</p>
            <p className="font-medium">{patientDetails?.patientNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Patient Name</p>
            <p className="font-medium">{patientDetails?.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Admission Number</p>
            <p className="font-medium">{admissionDetails?.admissionNumber}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Surgery Date</p>
            <p className="font-medium">{formatDate(admissionDetails?.surgeryDate)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {admissionDetails?.status?.replace(/_/g, ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Case-specific cost breakdown */}
          {renderCostBreakdown()}

          {/* Add Additional Charges Button & Panel */}
          {!paymentStatus && admissionId && (
            <div className="space-y-3">
              {!showAddCharges ? (
                <button
                  onClick={() => setShowAddCharges(true)}
                  className="w-full py-2.5 border-2 border-dashed border-orange-300 text-orange-600 rounded-lg font-medium hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Additional Charges
                </button>
              ) : (
                <div className="border border-orange-200 rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950 border-b border-orange-200">
                    <p className="font-semibold text-sm text-orange-700 dark:text-orange-300">Select Additional Charges</p>
                    <button onClick={() => { setShowAddCharges(false); setSelectedCharges([]); setChargeSearch(''); }} className="text-gray-500 hover:text-gray-700">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="p-2 border-b border-orange-100">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search charges..."
                        value={chargeSearch}
                        onChange={(e) => setChargeSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-md bg-background"
                      />
                    </div>
                  </div>

                  {/* Charges list */}
                  <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                    {loadingCharges ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredCharges.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {availableCharges.length === 0 ? 'No additional charges available' : 'No matching charges'}
                      </p>
                    ) : (
                      filteredCharges.map((charge) => {
                        const isSelected = selectedCharges.some(c => c.id === charge.id);
                        return (
                          <label
                            key={charge.id}
                            className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-colors ${
                              isSelected ? 'bg-orange-100 dark:bg-orange-900 border border-orange-300' : 'hover:bg-muted/50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleChargeToggle(charge)}
                                className="rounded border-gray-300"
                              />
                              <div>
                                <p className="text-sm font-medium">{charge.chargeName}</p>
                                {charge.chargeDesc && (
                                  <p className="text-xs text-muted-foreground">{charge.chargeDesc}</p>
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-orange-600 whitespace-nowrap ml-2">
                              {formatCurrency(charge.chargePrice)}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>

                  {/* Footer with total and submit */}
                  {selectedCharges.length > 0 && (
                    <div className="p-3 border-t border-orange-200 bg-orange-50 dark:bg-orange-950 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{selectedCharges.length} charge(s) selected</span>
                        <span className="font-bold text-orange-700">+ {formatCurrency(getSelectedTotal())}</span>
                      </div>
                      <button
                        onClick={handleSubmitCharges}
                        disabled={submittingCharges}
                        className="w-full py-2 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submittingCharges ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        {submittingCharges ? 'Adding...' : 'Add Selected Charges'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Final Amount Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-lg font-semibold">
              <div className="flex items-center gap-2">
                <span>Final Surgery Amount</span>
                {billing?.billingModel && (
                  <Badge variant="outline" className="text-xs">
                    {billing.billingModel === 'package-plus-additional' ? 'Package + Charges' : 'Package Only'}
                  </Badge>
                )}
              </div>
              <span>{formatCurrency(billing?.finalSurgeryAmount || billing?.totalAmount)}</span>
            </div>
            
            {/* Show breakdown summary */}
            {billing?.billingModel === 'package-plus-additional' && (
              <div className="text-sm text-muted-foreground">
                <p>₹{billing?.surgeryPackageCost?.toLocaleString()} (Surgery Package) + ₹{billing?.additionalCharges?.toLocaleString()} (Additional Charges)</p>
              </div>
            )}
            
            {/* Show insurance deduction for cashless approved claims */}
            {insuranceDetails?.isCashless && insuranceDetails?.claimStatus === 'APPROVED' && (
              <div className="flex justify-between items-center text-sm text-green-600">
                <span>Insurance Coverage (-)</span>
                <span>- {formatCurrency(insuranceDetails.claimAmountSanctioned)}</span>
              </div>
            )}
          </div>

          {/* Insurance Coverage */}
          {insuranceDetails && (
            <>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Shield className="h-5 w-5" />
                  <p className="font-semibold">Insurance Details</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provider:</span>
                      <span className="font-medium">{insuranceDetails.providerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Mode:</span>
                      <Badge variant="outline" className="text-xs">
                        {insuranceDetails.isCashless ? 'Cashless' : 
                         insuranceDetails.isReimbursement ? 'Reimbursement' : 'Insurance'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Claim Number:</span>
                      <span className="font-medium font-mono text-xs">{insuranceDetails.claimNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getClaimStatusVariant(insuranceDetails.claimStatus)} className="text-xs">
                        {insuranceDetails.claimStatus || 'NOT_APPLIED'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Claim Amount Requested:</span>
                    <span>{formatCurrency(insuranceDetails.claimAmountRequested)}</span>
                  </div>
                  
                  {insuranceDetails.claimAmountSanctioned > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Sanctioned:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(insuranceDetails.claimAmountSanctioned)}
                      </span>
                    </div>
                  )}
                  
                  {/* Show coverage details for cashless */}
                  {insuranceDetails.isCashless && insuranceDetails.claimStatus === 'APPROVED' && (
                    <div className="p-2 bg-green-100 rounded border border-green-200">
                      <div className="flex justify-between font-medium text-green-800">
                        <span>Insurance Covers:</span>
                        <span>- {formatCurrency(insuranceDetails.claimAmountSanctioned)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Show reimbursement note */}
                  {insuranceDetails.isReimbursement && insuranceDetails.claimStatus === 'APPROVED' && (
                    <div className="p-2 bg-purple-100 rounded border border-purple-200">
                      <div className="text-purple-800 text-xs">
                        <p className="font-medium">Reimbursement Information:</p>
                        <p>You will be reimbursed {formatCurrency(insuranceDetails.claimAmountSanctioned)} after payment</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {insuranceDetails.note && (
                  <p className="text-xs text-muted-foreground pt-2 italic border-t">
                    {insuranceDetails.note}
                  </p>
                )}
              </div>
              
              <Separator />
            </>
          )}

          {/* Patient Payable Amount */}
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {insuranceDetails?.isReimbursement ? 'Total Amount to Pay' : 'Patient Payable Amount'}
                </p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <IndianRupee className="h-5 w-5" />
                  {formatCurrency(billing?.patientPayable).replace('₹', '')}
                </p>
                
                {/* Additional info for different scenarios */}
                {insuranceDetails?.isCashless && insuranceDetails?.claimStatus === 'APPROVED' && (
                  <p className="text-xs text-green-600 mt-1">
                    Insurance covers: {formatCurrency(insuranceDetails.claimAmountSanctioned)} of {formatCurrency(billing?.finalSurgeryAmount || billing?.totalAmount)}
                  </p>
                )}
                
                {insuranceDetails?.isReimbursement && insuranceDetails?.claimStatus === 'APPROVED' && (
                  <p className="text-xs text-purple-600 mt-1">
                    Reimbursable: {formatCurrency(insuranceDetails.claimAmountSanctioned)}
                  </p>
                )}

                {!insuranceDetails && billing?.amountSource === 'database' && (
                  <p className="text-xs text-blue-600 mt-1">
                    Pre-calculated final amount
                  </p>
                )}
              </div>
              
              {paymentStatus && (
                <Badge variant="success" className="text-sm">
                  Paid: {formatCurrency(paymentStatus.paid)}
                </Badge>
              )}
            </div>
            
            {paymentStatus && paymentStatus.remaining > 0 && (
              <p className="text-sm text-orange-600 mt-2">
                Remaining: {formatCurrency(paymentStatus.remaining)}
              </p>
            )}
          </div>

          {/* Payment Status */}
          {paymentStatus && (
            <div className={`p-3 rounded-lg text-sm ${paymentStatus.remaining > 0 ? 'bg-orange-50 dark:bg-orange-950' : 'bg-green-50 dark:bg-green-950'}`}>
              <p className={`font-medium ${paymentStatus.remaining > 0 ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'}`}>
                {paymentStatus.remaining > 0 ? 'Partial Payment Recorded' : 'Payment Recorded (Fully Paid)'}
              </p>
              <p className="text-muted-foreground">
                Paid: {formatCurrency(paymentStatus.paid)} on {formatDate(paymentStatus.paymentDate)} via {paymentStatus.paymentMode}
              </p>
              {paymentStatus.remaining > 0 && (
                <p className="text-orange-600 font-medium mt-1">
                  Remaining: {formatCurrency(paymentStatus.remaining)}
                </p>
              )}
            </div>
          )}

          {/* Payment Button — show if no payment OR if partial payment still has remaining */}
          {((!paymentStatus || paymentStatus.remaining > 0) && onPaymentClick) && (
            <button
              onClick={onPaymentClick}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <IndianRupee className="h-5 w-5" />
              {paymentStatus?.remaining > 0 ? 'Record Remaining Payment' : 'Record Payment'}
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IpdBillCalculator;
