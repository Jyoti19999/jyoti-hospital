import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table';
import {
  IndianRupee,
  Search,
  Eye,
  Calendar,
  Shield,
  User,
  Receipt,
  RefreshCw,
  Printer
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import ipdBillingService from '../../services/ipdBillingService';
import IpdBillCalculator from '../../components/ipd/IpdBillCalculator';
import IpdPaymentModal from '../../components/ipd/IpdPaymentModal';
import LetterheadSelector from '../../components/LetterheadSelector';
import { printWithLetterhead, generatePDFWithLetterhead, applyLetterheadToDocument, getDefaultLetterhead } from '../../utils/letterheadRenderer';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '../../components/ui/sheet';

// Standalone receipt HTML generator (used by both IpdPaymentReceipt and auto-save)
const generateReceiptHTMLFromData = (bill, admission, payment) => {
  if (!bill) return '<p>Bill data not available</p>';

  const numberToWords = (num) => {
    const n = Math.round(Math.abs(num));
    if (n === 0) return 'Zero Only';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const convertBelow1000 = (v) => {
      if (v === 0) return '';
      if (v < 20) return ones[v];
      if (v < 100) return tens[Math.floor(v / 10)] + (v % 10 ? ' ' + ones[v % 10] : '');
      return ones[Math.floor(v / 100)] + ' Hundred' + (v % 100 ? ' ' + convertBelow1000(v % 100) : '');
    };
    let rem = n, result = '';
    if (rem >= 10000000) { result += convertBelow1000(Math.floor(rem / 10000000)) + ' Crore '; rem %= 10000000; }
    if (rem >= 100000) { result += convertBelow1000(Math.floor(rem / 100000)) + ' Lakh '; rem %= 100000; }
    if (rem >= 1000) { result += convertBelow1000(Math.floor(rem / 1000)) + ' Thousand '; rem %= 1000; }
    if (rem > 0) result += convertBelow1000(rem);
    return result.trim() + ' Only';
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + ' Yrs';
  };

  const formatGender = (g) => {
    if (!g) return '';
    const map = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other', male: 'Male', female: 'Female' };
    return map[g] || g;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';

  const totalAmount = bill.billing?.subtotal || bill.billing?.finalSurgeryAmount || 0;
  const insuranceCoverage = bill.billing?.insuranceCoverage || 0;
  const patientPayable = bill.billing?.patientPayable || 0;
  const totalPaid = payment?.totalPaidAmount || 0;
  const amountChargedToPayer = insuranceCoverage;
  const pendingAmount = Math.max(0, patientPayable - totalPaid);
  const isInsurance = admission.insuranceApplicable;
  const hasClaimApplied = isInsurance && admission.claimStatus && admission.claimStatus !== 'NOT_APPLIED';

  const lineItems = [];
  const pkgBreakdown = bill.billing?.packageBreakdown;
  if (hasClaimApplied && pkgBreakdown && Array.isArray(pkgBreakdown) && pkgBreakdown.length > 0) {
    pkgBreakdown.forEach(item => {
      lineItems.push({
        name: (item.name || 'CHARGE').toUpperCase(),
        unit: item.unit || 1,
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || 0
      });
    });
  } else if (bill.billing?.surgeryPackageCost > 0) {
    lineItems.push({
      name: 'SURGERY PACKAGE' + (bill.costBreakdown?.detailedBreakdown?.[0]?.details?.name ? ` (${bill.costBreakdown.detailedBreakdown[0].details.name})` : ''),
      unit: 1,
      rate: bill.billing.surgeryPackageCost,
      amount: bill.billing.surgeryPackageCost
    });
  }
  const additionalCharges = bill.costBreakdown?.detailedBreakdown?.find(b => b.item === 'Additional Charges');
  if (additionalCharges?.details?.charges) {
    additionalCharges.details.charges.forEach(charge => {
      lineItems.push({
        name: (charge.name || 'ADDITIONAL CHARGE').toUpperCase(),
        unit: 1,
        rate: charge.amount || 0,
        amount: charge.amount || 0
      });
    });
  }

  const itemsHTML = lineItems.map(item => `
    <tr>
      <td style="border: 1px solid rgba(0,0,0,0.25); padding: 4px 8px;">${item.name}</td>
      <td style="border: 1px solid rgba(0,0,0,0.25); padding: 4px 8px; text-align: center;">${item.unit}</td>
      <td style="border: 1px solid rgba(0,0,0,0.25); padding: 4px 8px; text-align: right;">${item.rate.toFixed(2)}</td>
      <td style="border: 1px solid rgba(0,0,0,0.25); padding: 4px 8px; text-align: right;">${item.amount.toFixed(2)}</td>
    </tr>
  `).join('');

  const patientName = bill.patientDetails?.name || `${admission.patient?.firstName || ''} ${admission.patient?.middleName || ''} ${admission.patient?.lastName || ''}`.trim();
  const patientNumber = bill.patientDetails?.patientNumber || admission.patient?.patientNumber || '';
  const gender = formatGender(bill.patientDetails?.gender);
  const age = calculateAge(bill.patientDetails?.dateOfBirth);
  const sexAge = [gender, age].filter(Boolean).join(' / ');
  const surgeonName = bill.surgeonDetails?.name || '';
  const admissionDate = formatDate(bill.admissionDetails?.admissionDate || admission.admissionDate);
  const dischargeDate = formatDate(bill.admissionDetails?.surgeryCompletedAt || bill.admissionDetails?.surgeryDate || admission.surgeryDate);
  const billDate = formatDate(payment?.paymentDate || new Date());
  const billNo = payment?.paymentNumber || bill.admissionDetails?.admissionNumber || admission.admissionNumber;
  const ipdNo = bill.admissionDetails?.admissionNumber || admission.admissionNumber;
  const panelName = bill.insuranceDetails?.providerName || admission.insuranceProvider?.providerName || '';

  return `
    <div style="padding: 20px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #000;">
      <h2 style="text-align: center; margin: 5px 0 15px 0; font-size: 18px; font-weight: bold;">FINAL BILL</h2>
      <table style="width: 100%; margin-bottom: 8px; border-collapse: collapse;">
        <tr>
          <td style="padding: 2px 0;"><strong>Bill No.</strong></td>
          <td style="padding: 2px 0;">: ${billNo}</td>
          <td style="padding: 2px 0; text-align: right;"><strong>Bill Date :</strong> ${billDate}</td>
        </tr>
        ${isInsurance ? `
        <tr>
          <td style="padding: 2px 0;"><strong>Panel Name</strong></td>
          <td colspan="2" style="padding: 2px 0;">: ${panelName}</td>
        </tr>
        ` : ''}
        <tr>
          <td></td>
          <td></td>
          <td style="padding: 2px 0; text-align: right;"><strong>IPD No. :</strong> ${ipdNo}</td>
        </tr>
      </table>
      <table style="width: 100%; margin-bottom: 8px; border-collapse: collapse;">
        <tr>
          <td style="padding: 2px 0; width: 130px;"><strong>Case No.</strong></td>
          <td style="padding: 2px 0;">: ${patientNumber}</td>
        </tr>
        <tr>
          <td style="padding: 2px 0;"><strong>Patient Name</strong></td>
          <td style="padding: 2px 0;">: ${patientName}</td>
        </tr>
        <tr>
          <td style="padding: 2px 0;"><strong>Sex/Age</strong></td>
          <td style="padding: 2px 0;">: ${sexAge || 'N/A'}</td>
        </tr>
      </table>
      <table style="width: 100%; margin-bottom: 10px; border: 1px solid rgba(0,0,0,0.25); border-collapse: collapse;">
        <tr>
          <td colspan="2" style="padding: 4px 8px; border-bottom: 1px solid rgba(0,0,0,0.25);">
            <strong>Consultant Incharge</strong>&nbsp;&nbsp;: ${surgeonName || 'N/A'}
          </td>
        </tr>
        <tr>
          <td style="padding: 4px 8px;"><strong>Date of Admission :</strong> ${admissionDate}</td>
          <td style="padding: 4px 8px; text-align: right;"><strong>Date of Discharge :</strong> ${dischargeDate}</td>
        </tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px;">
        <thead>
          <tr>
            <th style="border: 1px solid rgba(0,0,0,0.25); padding: 5px 8px; text-align: left; background: #f5f5f5;">Particular</th>
            <th style="border: 1px solid rgba(0,0,0,0.25); padding: 5px 8px; text-align: center; background: #f5f5f5; width: 60px;">Unit</th>
            <th style="border: 1px solid rgba(0,0,0,0.25); padding: 5px 8px; text-align: right; background: #f5f5f5; width: 100px;">Rate</th>
            <th style="border: 1px solid rgba(0,0,0,0.25); padding: 5px 8px; text-align: right; background: #f5f5f5; width: 100px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
        <tr>
          <td style="padding: 4px 8px; border: 1px solid rgba(0,0,0,0.25);"><strong>Total Amount</strong></td>
          <td style="padding: 4px 8px; border: 1px solid rgba(0,0,0,0.25); text-align: right; width: 120px;"><strong>${totalAmount.toFixed(2)}</strong></td>
        </tr>
        ${isInsurance && hasClaimApplied ? `
        <tr>
          <td style="padding: 4px 8px; border: 1px solid rgba(0,0,0,0.25);"><strong>Amount paid by member</strong></td>
          <td style="padding: 4px 8px; border: 1px solid rgba(0,0,0,0.25); text-align: right;">${totalPaid.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 8px; border: 1px solid rgba(0,0,0,0.25);"><strong>Amount charged to payer</strong></td>
          <td style="padding: 4px 8px; border: 1px solid rgba(0,0,0,0.25); text-align: right;">${amountChargedToPayer.toFixed(2)}</td>
        </tr>
        ${pendingAmount > 0 ? `
        <tr>
          <td style="padding: 4px 8px; border: 1px solid rgba(0,0,0,0.25);"><strong>Pending Amount</strong></td>
          <td style="padding: 4px 8px; border: 1px solid rgba(0,0,0,0.25); text-align: right;">${pendingAmount.toFixed(2)}</td>
        </tr>` : ''}
        ` : `
        ${totalPaid > 0 ? `
        <tr>
          <td style="padding: 4px 8px; border: 1px solid rgba(0,0,0,0.25);"><strong>Total Paid</strong></td>
          <td style="padding: 4px 8px; border: 1px solid rgba(0,0,0,0.25); text-align: right;">${totalPaid.toFixed(2)}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 4px 8px; border: 1px solid rgba(0,0,0,0.25);"><strong>Pending Amount</strong></td>
          <td style="padding: 4px 8px; border: 1px solid rgba(0,0,0,0.25); text-align: right;">${pendingAmount.toFixed(2)}</td>
        </tr>
        `}
      </table>
      <p style="margin: 4px 0; font-size: 11px;">
        Bill Amount in words : (${numberToWords(totalAmount)})
      </p>
      <p style="margin: 4px 0 15px 0; font-size: 11px;">
        Pending Amount : (${numberToWords(pendingAmount)})
      </p>
      <div style="margin-top: 40px; display: flex; justify-content: space-between;">
        <div style="font-size: 11px;">PATIENT SIGNATURE/ATTENDANT'S SIGNATURE</div>
        <div style="font-size: 11px; text-align: right;">AUTHORISED SIGNATORY</div>
      </div>
    </div>
  `;
};

// IPD Payment Receipt Component
const IpdPaymentReceipt = ({ admission, payment }) => {
  const [showLetterheadSelector, setShowLetterheadSelector] = useState(false);
  const [billData, setBillData] = useState(null);
  const [fetchingBill, setFetchingBill] = useState(false);

  // Fetch bill details when user clicks print
  const handlePrintClick = async () => {
    setFetchingBill(true);
    try {
      const response = await ipdBillingService.calculateBill(admission.id);
      const data = response.data?.data || response.data;
      setBillData(data);
      setShowLetterheadSelector(true);
    } catch (error) {
      console.error('Error fetching bill details for receipt:', error);
    } finally {
      setFetchingBill(false);
    }
  };

  const handlePrint = async (templateId) => {
    const receiptHTML = generateReceiptHTMLFromData(billData, admission, payment);
    await printWithLetterhead(receiptHTML, templateId, {});
  };

  const handleDownloadPDF = async (templateId) => {
    const receiptHTML = generateReceiptHTMLFromData(billData, admission, payment);
    await generatePDFWithLetterhead(receiptHTML, templateId, {}, `final-bill-${admission.admissionNumber || 'bill'}.pdf`);
  };

  return (
    <>
      <Button onClick={handlePrintClick} disabled={fetchingBill} size="sm" variant="outline" className="h-8">
        <Printer className="h-3.5 w-3.5 mr-1" />
        {fetchingBill ? 'Loading...' : 'Print'}
      </Button>

      <LetterheadSelector
        open={showLetterheadSelector}
        onClose={() => setShowLetterheadSelector(false)}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
        documentType="receipt"
      />
    </>
  );
};

const IpdBillingPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [allAdmissions, setAllAdmissions] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    insuranceApplicable: '',
    startDate: '',
    endDate: '',
    searchTerm: ''
  });
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [billDetails, setBillDetails] = useState(null);
  const [showBillSheet, setShowBillSheet] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loadingBill, setLoadingBill] = useState(false);

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const response = await ipdBillingService.getAdmissionsReadyForBilling();
      if (response.data) {
        setAllAdmissions(response.data);
      } else if (Array.isArray(response)) {
        setAllAdmissions(response);
      } else {
        setAllAdmissions([]);
      }
    } catch (error) {
      console.error('Error fetching admissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch admissions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // All filtering is done client-side
  const filteredAdmissions = (allAdmissions || []).filter(admission => {
    // Status filter
    if (filters.status) {
      if (filters.status === 'PARTIAL_PAYMENT') {
        if (!(admission.payment && parseFloat(admission.payment.remainingAmount) > 0)) return false;
      } else {
        if (admission.status !== filters.status) return false;
      }
    }

    // Insurance filter
    if (filters.insuranceApplicable === 'true' && !admission.insuranceApplicable) return false;
    if (filters.insuranceApplicable === 'false' && admission.insuranceApplicable) return false;

    // Date filter
    if (filters.startDate) {
      const admDate = new Date(admission.admissionDate || admission.surgeryDate);
      if (admDate < new Date(filters.startDate)) return false;
    }
    if (filters.endDate) {
      const admDate = new Date(admission.admissionDate || admission.surgeryDate);
      if (admDate > new Date(filters.endDate + 'T23:59:59')) return false;
    }

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matches =
        admission.patient?.firstName?.toLowerCase().includes(searchLower) ||
        admission.patient?.lastName?.toLowerCase().includes(searchLower) ||
        String(admission.patient?.patientNumber || '').toLowerCase().includes(searchLower) ||
        String(admission.admissionNumber || '').toLowerCase().includes(searchLower);
      if (!matches) return false;
    }

    return true;
  });

  const handleViewBill = async (admission) => {
    console.log('=== VIEW BILL CLICKED ===');
    console.log('Admission object:', admission);
    console.log('Admission ID:', admission.id);
    console.log('Full admission keys:', Object.keys(admission));

    setSelectedAdmission(admission);
    setLoadingBill(true);
    setShowBillSheet(true);

    try {
      console.log('Calling calculateBill with ID:', admission.id);
      const response = await ipdBillingService.calculateBill(admission.id);
      console.log('Calculate Bill Response:', response);
      console.log('Response structure check:', {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data',
        hasDataData: !!response.data?.data,
        dataDataKeys: response.data?.data ? Object.keys(response.data.data) : 'no data.data'
      });

      // Handle both possible response structures
      const billData = response.data?.data || response.data;
      console.log('Setting bill details to:', billData);
      setBillDetails(billData);
    } catch (error) {
      console.error('Error fetching bill details:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to calculate bill details',
        variant: 'destructive'
      });
      setShowBillSheet(false);
    } finally {
      setLoadingBill(false);
    }
  };

  const handleRecordPayment = () => {
    setShowBillSheet(false); // Close sheet to avoid focus trap conflict with payment dialog
    // Delay opening modal to let Sheet's focus trap fully release (exit animation is 300ms)
    setTimeout(() => setShowPaymentModal(true), 350);
  };

  const handlePaymentModalClose = (open) => {
    setShowPaymentModal(open);
    if (!open) {
      // Re-open the bill sheet when payment modal is closed/cancelled
      setShowBillSheet(true);
    }
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    // Silently auto-save receipt PDF in the background
    if (selectedAdmission) {
      try {
        // Re-fetch updated bill details (with new payment amounts)
        const billResponse = await ipdBillingService.calculateBill(selectedAdmission.id);
        const updatedBill = billResponse.data?.data || billResponse.data;
        
        // Build payment object with updated totals from response
        const paymentData = paymentResponse?.data?.payment || paymentResponse?.payment || {};
        const updatedPayment = {
          totalPaidAmount: paymentData.totalPaidAmount || updatedBill?.paymentStatus?.paid || 0,
          paymentNumber: paymentData.paymentNumber || selectedAdmission.admissionNumber,
          paymentDate: new Date()
        };

        // Generate receipt HTML
        const receiptHTML = generateReceiptHTMLFromData(updatedBill, selectedAdmission, updatedPayment);
        
        // Apply letterhead (use default template)
        const fullDocument = await applyLetterheadToDocument(receiptHTML, null, {});
        
        // Render to PDF using html2canvas + jsPDF
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;
        
        const container = document.createElement('div');
        container.innerHTML = fullDocument;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '210mm';
        document.body.appendChild(container);
        
        try {
          const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgWidth = 210;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          
          // Get base64 data (strip the data URI prefix)
          const pdfBase64 = pdf.output('datauristring').split(',')[1];
          
          // Save to server
          const paymentId = paymentData.id || paymentResponse?.data?.payment?.id;
          await ipdBillingService.saveReceipt(selectedAdmission.id, pdfBase64, paymentId);
          console.log('Receipt PDF auto-saved successfully');
        } finally {
          document.body.removeChild(container);
        }
      } catch (error) {
        console.error('Auto-save receipt failed (non-blocking):', error);
      }
    }

    fetchAdmissions();
    setShowPaymentModal(false);
    setShowBillSheet(false);
    setBillDetails(null);
    setSelectedAdmission(null);
  };

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

  const getStatusBadge = (status) => {
    const statusConfig = {
      SURGERY_SCHEDULED: { variant: 'outline', label: 'Upcoming' },
      SURGERY_COMPLETED: { variant: 'default', label: 'Surgery Completed' },
      BILLING_READY: { variant: 'secondary', label: 'Billing Ready' },
      PAYMENT_RECORDED: { variant: 'success', label: 'Payment Recorded' }
    };

    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Calculate statistics from filtered data
  const withInsuranceCount = filteredAdmissions.filter(a => a.insuranceApplicable).length;
  const withoutInsuranceCount = filteredAdmissions.filter(a => !a.insuranceApplicable).length;
  const totalEstimatedBill = filteredAdmissions.reduce((sum, admission) => {
    return sum + (parseFloat(admission.finalSurgeryAmount) || parseFloat(admission.surgeryPackageDetail?.packageCost) || 0);
  }, 0);

  // Ribbon helper for patient type
  const getRibbonInfo = (admission) => {
    if (admission.isCashless) return { text: 'Cashless', bg: '#16a34a', shadow: '#15803d' };
    if (admission.isReimbursement) return { text: 'Reimburse', bg: '#ea580c', shadow: '#c2410c' };
    return { text: 'Self Pay', bg: '#6b7280', shadow: '#4b5563' };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Admissions Table with Integrated Filters */}
      <Card className="flex flex-col flex-1 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <CardTitle>IPD Billing</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                {filteredAdmissions.length} Total
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <Shield className="h-3 w-3 mr-1" />
                {withInsuranceCount} Insured
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                {withoutInsuranceCount} Self
              </Badge>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                ₹{formatCurrency(totalEstimatedBill).replace('₹', '')} Est.
              </Badge>
              <Button
                onClick={fetchAdmissions}
                variant="outline"
                size="sm"
                className="h-9"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patient, patient #, admission..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="pl-10 h-10"
                />
              </div>
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="h-10 px-3 py-2 border rounded-md text-sm w-full sm:w-52"
            >
              <option value="">All Statuses</option>
              <option value="SURGERY_SCHEDULED">Upcoming Surgeries</option>
              <option value="SURGERY_COMPLETED">Surgery Completed</option>
              <option value="BILLING_READY">Billing Ready</option>
              <option value="PAYMENT_RECORDED">Payment Completed</option>
              <option value="PARTIAL_PAYMENT">Partial Payment</option>
            </select>

            <select
              value={filters.insuranceApplicable}
              onChange={(e) => setFilters({ ...filters, insuranceApplicable: e.target.value })}
              className="h-10 px-3 py-2 border rounded-md text-sm w-full sm:w-48"
            >
              <option value="">All Insurance Types</option>
              <option value="true">With Insurance</option>
              <option value="false">Without Insurance</option>
            </select>

            <div className="relative w-full sm:w-44">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="From Date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="pl-10 h-10"
              />
            </div>

            <div className="relative w-full sm:w-44">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="To Date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="pl-10 h-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAdmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No admissions found</p>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto tab-content-container">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#e5e7eb]">
                    <TableRow>
                      <TableHead>Admission #</TableHead>
                      <TableHead>Patient Details</TableHead>
                      <TableHead>Surgery Package</TableHead>
                      <TableHead>Surgery Date</TableHead>
                      <TableHead>Insurance</TableHead>
                      <TableHead>Total Bill</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmissions.map((admission) => {
                      const estimatedBill = parseFloat(admission.finalSurgeryAmount) || parseFloat(admission.surgeryPackageDetail?.packageCost) || 0;
                      const ribbon = getRibbonInfo(admission);
                      const hasPartialPayment = admission.payment && parseFloat(admission.payment.remainingAmount) > 0;

                      return (
                        <TableRow key={admission.id}>
                          <TableCell className="font-medium">
                            {admission.admissionNumber}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="font-medium">
                                  {admission.patient?.firstName} {admission.patient?.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Patient #: {admission.patient?.patientNumber}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {admission.patient?.phone}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">
                                {admission.surgeryPackageDetail?.packageName || 'N/A'}
                              </p>
                              {admission.lens && (
                                <p className="text-xs text-muted-foreground">
                                  Lens: {admission.lens.lensName}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(admission.surgeryDate)}</TableCell>
                          <TableCell>
                            {admission.insuranceApplicable ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <span>{admission.insuranceProvider?.providerName || 'Yes'}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold">{formatCurrency(estimatedBill)}</p>
                          </TableCell>
                          <TableCell>
                            <p className={`font-medium ${admission.payment?.totalPaidAmount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {admission.payment ? formatCurrency(admission.payment.totalPaidAmount) : '₹0'}
                            </p>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const paid = admission.payment?.totalPaidAmount || 0;
                              const pending = hasPartialPayment ? parseFloat(admission.payment.remainingAmount) : (paid > 0 ? 0 : estimatedBill);
                              return (
                                <p className={`font-medium ${pending > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {formatCurrency(pending)}
                                </p>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const paid = admission.payment?.totalPaidAmount || 0;
                              if (paid <= 0) return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">Not Paid</Badge>;
                              if (hasPartialPayment) return <Badge className="bg-orange-100 text-orange-700 border-orange-300">Partial</Badge>;
                              return <Badge className="bg-green-100 text-green-700 border-green-300">Fully Paid</Badge>;
                            })()}
                          </TableCell>
                          <TableCell>{getStatusBadge(admission.status)}</TableCell>
                          <TableCell className="text-right relative overflow-visible">
                            {/* Corner Ribbon */}
                            <div style={{ position: 'absolute', top: 0, right: 0, width: 56, height: 56, overflow: 'hidden', pointerEvents: 'none', zIndex: 5 }}>
                              <div style={{
                                position: 'absolute',
                                display: 'block',
                                width: 85,
                                padding: '2px 0',
                                backgroundColor: ribbon.bg,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                color: '#fff',
                                fontSize: 8,
                                fontWeight: 700,
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                transform: 'rotate(45deg)',
                                top: 12,
                                right: -22,
                              }}>
                                {ribbon.text}
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewBill(admission)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Bill
                              </Button>
                              <IpdPaymentReceipt admission={admission} payment={admission.payment || null} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bill Details Sheet */}
      <Sheet open={showBillSheet} onOpenChange={setShowBillSheet}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Billing Details
            </SheetTitle>
            <SheetDescription>
              {selectedAdmission && (
                <span>
                  Admission: {selectedAdmission.admissionNumber} | Patient: {selectedAdmission.patient?.firstName} {selectedAdmission.patient?.lastName}
                </span>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">
            {loadingBill ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : billDetails ? (
              <IpdBillCalculator
                billDetails={billDetails}
                onPaymentClick={handleRecordPayment}
                admissionId={selectedAdmission?.id}
                onBillUpdate={() => {
                  if (selectedAdmission) {
                    handleViewBill(selectedAdmission);
                  }
                }}
              />
            ) : (
              <p className="text-center text-muted-foreground py-12">
                Failed to load billing details
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Payment Modal */}
      <IpdPaymentModal
        open={showPaymentModal}
        onOpenChange={handlePaymentModalClose}
        admissionId={selectedAdmission?.id}
        billDetails={billDetails}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default IpdBillingPage;
