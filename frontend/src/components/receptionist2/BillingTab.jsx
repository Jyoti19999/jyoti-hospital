// BillingTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import {
  DollarSign,
  CreditCard,
  Banknote,
  Search,
  Calendar,
  CalendarIcon,
  User,
  Eye,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  IndianRupee,
  Printer,
  X,
  ChevronRight
} from "lucide-react";
import axios from 'axios';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import LetterheadSelector from '@/components/LetterheadSelector';
import { printWithLetterhead, generatePDFWithLetterhead } from '@/utils/letterheadRenderer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// Receipt Print Component
const PaymentReceipt = ({ visit, payment }) => {
  const [showLetterheadSelector, setShowLetterheadSelector] = useState(false);

  const getPaymentModeName = (mode) => {
    switch (mode) {
      case 'FULL_CASH': return 'Full Cash';
      case 'FULL_ONLINE': return 'Full Online';
      case 'HYBRID': return 'Hybrid (Cash + Online)';
      default: return mode;
    }
  };

  // Generate receipt HTML
  const generateReceiptHTML = () => {
    return `
      <div style="padding: 15px; font-size: 11px; line-height: 1.4;">
        <h2 style="text-align: center; margin: 10px 0 15px 0; font-size: 16px; font-weight: bold;">PAYMENT RECEIPT</h2>
        
        <table style="width: 100%; margin-bottom: 12px; border-collapse: collapse;">
          <tr>
            <td style="padding: 3px 0;"><strong>Receipt No:</strong></td>
            <td style="padding: 3px 0; text-align: right;">${payment?.paymentNumber || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;"><strong>Payment Date:</strong></td>
            <td style="padding: 3px 0; text-align: right;">${payment?.paymentDate ? new Date(payment.paymentDate).toLocaleString() : new Date().toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;"><strong>Visit Date:</strong></td>
            <td style="padding: 3px 0; text-align: right;">${new Date(visit.visitDate).toLocaleDateString()}</td>
          </tr>
        </table>

        <div style="margin-bottom: 12px; border-top: 1px solid #ddd; padding-top: 8px;">
          <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 12px;">Patient Information</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 2px 0; width: 35%;"><strong>Name:</strong></td>
              <td style="padding: 2px 0;">${visit.patient?.firstName} ${visit.patient?.middleName || ''} ${visit.patient?.lastName}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;"><strong>Patient No:</strong></td>
              <td style="padding: 2px 0;">${visit.patient?.patientNumber}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;"><strong>Contact:</strong></td>
              <td style="padding: 2px 0;">${visit.patient?.phone || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 12px; border-top: 1px solid #ddd; padding-top: 8px;">
          <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 12px;">Doctor Information</p>
          <p style="margin: 0;"><strong>Doctor:</strong> Dr. ${visit.doctor?.firstName} ${visit.doctor?.lastName}</p>
        </div>

        <div style="margin-bottom: 12px; border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 10px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 3px 0; font-size: 12px;"><strong>Consultation Amount:</strong></td>
              <td style="padding: 3px 0; text-align: right; font-size: 12px;"><strong>₹${visit.totalActualCost?.toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-size: 14px; border-top: 1px solid #333;"><strong>Total Paid:</strong></td>
              <td style="padding: 5px 0; text-align: right; font-size: 14px; border-top: 1px solid #333;"><strong>₹${payment?.totalPaidAmount?.toFixed(2) || visit.totalActualCost?.toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 12px;">Payment Details</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 2px 0; width: 40%;"><strong>Payment Mode:</strong></td>
              <td style="padding: 2px 0;">${getPaymentModeName(payment?.paymentMode || 'N/A')}</td>
            </tr>
            ${payment?.cashAmount > 0 ? `
            <tr>
              <td style="padding: 2px 0;"><strong>Cash Amount:</strong></td>
              <td style="padding: 2px 0;">₹${payment.cashAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${payment?.onlineAmount > 0 ? `
            <tr>
              <td style="padding: 2px 0;"><strong>Online Amount:</strong></td>
              <td style="padding: 2px 0;">₹${payment.onlineAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${payment?.onlinePaymentDetails ? `
            <tr>
              <td style="padding: 2px 0;"><strong>Payment Method:</strong></td>
              <td style="padding: 2px 0;">${payment.onlinePaymentDetails.method}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0;"><strong>Transaction ID:</strong></td>
              <td style="padding: 2px 0;">${payment.onlinePaymentDetails.transactionId}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="margin-top: 20px; text-align: center; border-top: 1px solid #333; padding-top: 10px;">
          <p style="margin: 0; font-weight: bold; font-size: 11px;">Thank you for your payment!</p>
          <p style="margin: 3px 0 0 0; font-size: 9px; color: #666;">This is a computer-generated receipt.</p>
        </div>
      </div>
    `;
  };

  const handlePrint = async (templateId) => {
    const receiptHTML = generateReceiptHTML();
    const hospitalData = {}; // You can fetch this from context or API if needed
    await printWithLetterhead(receiptHTML, templateId, hospitalData);
  };

  const handleDownloadPDF = async (templateId) => {
    const receiptHTML = generateReceiptHTML();
    const hospitalData = {}; // You can fetch this from context or API if needed
    await generatePDFWithLetterhead(
      receiptHTML, 
      templateId, 
      hospitalData, 
      `receipt-${payment?.paymentNumber || 'payment'}.pdf`
    );
  };

  return (
    <>
      <Button onClick={() => setShowLetterheadSelector(true)} size="sm" variant="outline" className="h-8">
        <Printer className="h-3.5 w-3.5 mr-1" />
        Print
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

// Payment Modal Component
const PaymentModal = ({ visit, isOpen, onClose, onPaymentSuccess }) => {
  const [paymentMode, setPaymentMode] = useState('FULL_CASH');
  const [cashAmount, setCashAmount] = useState('');
  const [onlineAmount, setOnlineAmount] = useState('');
  const [onlinePaymentMethod, setOnlinePaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const billedAmount = visit?.totalActualCost || 0;

  // Auto-calculate online amount when cash changes in hybrid mode
  const handleCashChange = (value) => {
    setCashAmount(value);
    if (paymentMode === 'HYBRID' && value) {
      const cash = parseFloat(value) || 0;
      const calculatedOnline = Math.max(0, billedAmount - cash);
      setOnlineAmount(calculatedOnline > 0 ? calculatedOnline.toFixed(2) : '');
    }
  };

  // Auto-calculate cash amount when online changes in hybrid mode
  const handleOnlineChange = (value) => {
    setOnlineAmount(value);
    if (paymentMode === 'HYBRID' && value) {
      const online = parseFloat(value) || 0;
      const calculatedCash = Math.max(0, billedAmount - online);
      setCashAmount(calculatedCash > 0 ? calculatedCash.toFixed(2) : '');
    }
  };

  // Calculate remaining amount for hybrid mode
  const calculateRemaining = () => {
    const cash = parseFloat(cashAmount) || 0;
    const online = parseFloat(onlineAmount) || 0;
    const total = cash + online;
    return billedAmount - total;
  };

  const remaining = paymentMode === 'HYBRID' ? calculateRemaining() : 0;

  // Reset form and auto-fill amounts when modal opens or payment mode changes
  useEffect(() => {
    if (isOpen && visit) {
      // Reset transaction details
      setOnlinePaymentMethod('');
      setTransactionId('');
      
      // Auto-fill amounts based on payment mode
      if (paymentMode === 'FULL_CASH') {
        setCashAmount(billedAmount.toFixed(2));
        setOnlineAmount('');
      } else if (paymentMode === 'FULL_ONLINE') {
        setCashAmount('');
        setOnlineAmount(billedAmount.toFixed(2));
      } else if (paymentMode === 'HYBRID') {
        // Reset for hybrid - user will enter manually
        setCashAmount('');
        setOnlineAmount('');
      }
    }
  }, [isOpen, visit?.visitId, paymentMode, billedAmount]);

  const handlePaymentSubmit = async () => {
    // Enhanced Validation
    if (paymentMode === 'FULL_CASH') {
      const cash = parseFloat(cashAmount);
      if (!cashAmount || isNaN(cash) || cash <= 0) {
        toast.error('Please enter a valid cash amount');
        return;
      }
      const diff = Math.abs(cash - billedAmount);
      if (diff > 0.01) {
        if (cash > billedAmount) {
          toast.error(`Cash amount exceeds by ₹${(cash - billedAmount).toFixed(2)}`);
        } else {
          toast.error(`Cash amount is short by ₹${(billedAmount - cash).toFixed(2)}`);
        }
        return;
      }
    } else if (paymentMode === 'FULL_ONLINE') {
      const online = parseFloat(onlineAmount);
      if (!onlineAmount || isNaN(online) || online <= 0) {
        toast.error('Please enter a valid online amount');
        return;
      }
      const diff = Math.abs(online - billedAmount);
      if (diff > 0.01) {
        if (online > billedAmount) {
          toast.error(`Online amount exceeds by ₹${(online - billedAmount).toFixed(2)}`);
        } else {
          toast.error(`Online amount is short by ₹${(billedAmount - online).toFixed(2)}`);
        }
        return;
      }
      if (!onlinePaymentMethod) {
        toast.error('Please select online payment method');
        return;
      }
      if (!transactionId || transactionId.trim() === '') {
        toast.error('Please enter transaction ID');
        return;
      }
    } else if (paymentMode === 'HYBRID') {
      const cash = parseFloat(cashAmount) || 0;
      const online = parseFloat(onlineAmount) || 0;
      
      if (cash < 0 || online < 0) {
        toast.error('Amounts cannot be negative');
        return;
      }
      
      if (cash === 0 && online === 0) {
        toast.error('Please enter payment amounts');
        return;
      }
      
      if (cash === 0 || online === 0) {
        toast.error('For hybrid mode, both cash and online amounts must be greater than zero');
        return;
      }
      
      const total = cash + online;
      const diff = Math.abs(total - billedAmount);
      if (diff > 0.01) {
        if (total > billedAmount) {
          toast.error(`Total exceeds by ₹${(total - billedAmount).toFixed(2)}. Please adjust amounts.`);
        } else {
          toast.error(`Total is short by ₹${(billedAmount - total).toFixed(2)}. Please adjust amounts.`);
        }
        return;
      }
      
      if (!onlinePaymentMethod) {
        toast.error('Please select online payment method');
        return;
      }
      if (!transactionId || transactionId.trim() === '') {
        toast.error('Please enter transaction ID for online payment');
        return;
      }
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        paymentMode,
        cashAmount: paymentMode === 'FULL_ONLINE' ? 0 : parseFloat(cashAmount) || 0,
        onlineAmount: paymentMode === 'FULL_CASH' ? 0 : parseFloat(onlineAmount) || 0,
        onlinePaymentDetails: (paymentMode === 'FULL_ONLINE' || paymentMode === 'HYBRID') ? {
          method: onlinePaymentMethod,
          transactionId: transactionId
        } : null
      };

      const response = await axios.post(
        `${API_BASE_URL}/billing/record-payment/${visit.visitId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Payment recorded successfully');
      onPaymentSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visit) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <IndianRupee className="h-5 w-5 text-green-600" />
            Record Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-3">
          {/* Patient & Visit Info - Compact */}
          <div className="grid grid-cols-4 gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div>
              <p className="text-xs text-gray-600">Patient</p>
              <p className="font-semibold text-sm">{visit.patient?.firstName} {visit.patient?.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Patient #</p>
              <p className="font-semibold text-sm">{visit.patient?.patientNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Visit Date</p>
              <p className="font-semibold text-sm">{new Date(visit.visitDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Doctor</p>
              <p className="font-semibold text-sm">{visit.doctor?.firstName} {visit.doctor?.lastName}</p>
            </div>
          </div>

          {/* Billing Amount - Prominent */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
            <span className="text-base font-semibold text-gray-700">Billed Amount:</span>
            <span className="text-3xl font-bold text-green-600">₹{billedAmount.toFixed(2)}</span>
          </div>

          <Separator className="my-2" />

          {/* Payment Mode Selection - Compact */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Payment Mode *</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_CASH">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Full Cash
                  </div>
                </SelectItem>
                <SelectItem value="FULL_ONLINE">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Full Online
                  </div>
                </SelectItem>
                <SelectItem value="HYBRID">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Hybrid (Cash + Online)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Fields Based on Mode */}
          {paymentMode === 'FULL_CASH' && (
            <div className="space-y-1.5">
              <Label htmlFor="cashAmount" className="text-sm font-semibold">Cash Amount *</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="cashAmount"
                  type="number"
                  placeholder={billedAmount.toFixed(2)}
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="pl-9 h-10"
                  step="0.01"
                />
              </div>
              <p className="text-xs text-gray-500">Enter exactly ₹{billedAmount.toFixed(2)}</p>
            </div>
          )}

          {paymentMode === 'FULL_ONLINE' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="onlineAmount" className="text-sm font-semibold">Online Amount *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="onlineAmount"
                    type="number"
                    placeholder={billedAmount.toFixed(2)}
                    value={onlineAmount}
                    onChange={(e) => setOnlineAmount(e.target.value)}
                    className="pl-9 h-10"
                    step="0.01"
                  />
                </div>
                <p className="text-xs text-gray-500">Enter exactly ₹{billedAmount.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Payment Method *</Label>
                  <Select value={onlinePaymentMethod} onValueChange={setOnlinePaymentMethod}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Net Banking">Net Banking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="transactionId" className="text-sm font-semibold">Transaction ID *</Label>
                  <Input
                    id="transactionId"
                    type="text"
                    placeholder="TXN ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMode === 'HYBRID' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cashAmountHybrid" className="text-sm font-semibold">Cash Amount *</Label>
                  <div className="relative">
                    <Banknote className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="cashAmountHybrid"
                      type="number"
                      placeholder="0.00"
                      value={cashAmount}
                      onChange={(e) => handleCashChange(e.target.value)}
                      className="pl-9 h-10"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="onlineAmountHybrid" className="text-sm font-semibold">Online Amount *</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="onlineAmountHybrid"
                      type="number"
                      placeholder="0.00"
                      value={onlineAmount}
                      onChange={(e) => handleOnlineChange(e.target.value)}
                      className="pl-9 h-10"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">Enter cash amount - online will be auto-calculated</p>

              {/* Real-time remaining amount display - Compact */}
              <div className={`p-3 rounded-lg border-2 transition-all ${Math.abs(remaining) < 0.01 ? 'border-green-500 bg-green-50' : remaining > 0 ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Remaining:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${Math.abs(remaining) < 0.01 ? 'text-green-600' : remaining > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                      ₹{Math.abs(remaining).toFixed(2)}
                    </span>
                    {Math.abs(remaining) < 0.01 && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                </div>
                <p className={`text-xs mt-1 ${Math.abs(remaining) < 0.01 ? 'text-green-700' : remaining > 0 ? 'text-yellow-700' : 'text-red-700'}`}>
                  {remaining > 0.01 && `Still ₹${remaining.toFixed(2)} left to pay`}
                  {remaining < -0.01 && `Exceeds by ₹${Math.abs(remaining).toFixed(2)}`}
                  {Math.abs(remaining) < 0.01 && 'Perfect match! Ready to submit'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Payment Method *</Label>
                  <Select value={onlinePaymentMethod} onValueChange={setOnlinePaymentMethod}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Net Banking">Net Banking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="transactionIdHybrid" className="text-sm font-semibold">Transaction ID *</Label>
                  <Input
                    id="transactionIdHybrid"
                    type="text"
                    placeholder="TXN ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Compact */}
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={onClose} disabled={submitting} className="h-9">
              Cancel
            </Button>
            <Button 
              onClick={handlePaymentSubmit} 
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700 h-9"
            >
              {submitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Record Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main Billing Tab Component
const BillingTab = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today

  // Fetch completed visits with date filter
  const { data: completedVisits, isLoading, refetch } = useQuery({
    queryKey: ['completedVisitsForBilling', selectedDate],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      
      let params = {};
      
      // Only add date params if a date is selected
      if (selectedDate) {
        // Format date for API (start of day)
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        
        // End of day
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
        
        params = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        };
      }
      
      const response = await axios.get(`${API_BASE_URL}/billing/completed-visits`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      return response.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Filter visits based on search - includes firstName, middleName, lastName, patientNumber, phone
  const filteredVisits = completedVisits?.filter(visit => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase().trim();
    
    // Build searchable fields safely
    const firstName = visit.patient?.firstName?.toLowerCase() || '';
    const middleName = visit.patient?.middleName?.toLowerCase() || '';
    const lastName = visit.patient?.lastName?.toLowerCase() || '';
    const fullName = `${firstName} ${middleName} ${lastName}`.trim();
    const patientNumber = visit.patient?.patientNumber?.toString() || '';
    const phone = visit.patient?.phone?.toLowerCase() || '';
    
    // Search in any of these fields
    return fullName.includes(search) || 
           firstName.includes(search) ||
           middleName.includes(search) ||
           lastName.includes(search) ||
           patientNumber.includes(search) ||
           phone.includes(search);
  }) || [];

  // Calculate summary statistics
  const totalVisits = completedVisits?.length || 0;
  const paidCount = completedVisits?.filter(v => v.payments && v.payments.length > 0).length || 0;
  const pendingCount = completedVisits?.filter(v => !v.payments || v.payments.length === 0).length || 0;
  const totalBilled = completedVisits?.reduce((sum, v) => sum + (v.totalActualCost || 0), 0) || 0;
  const totalCollected = completedVisits?.filter(v => v.payments && v.payments.length > 0)
    .reduce((sum, v) => sum + (v.totalActualCost || 0), 0) || 0;
  const pendingAmount = totalBilled - totalCollected;

  const handleRecordPayment = (visit) => {
    setSelectedVisit(visit);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    refetch();
    queryClient.invalidateQueries(['completedVisitsForBilling']);
  };

  const getPaymentStatusBadge = (visit) => {
    if (visit.payments && visit.payments.length > 0) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading billing data...</span>
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
      {/* Header with Gradient Background and Summary Badges */}
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isLoading ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`}></div>
            <IndianRupee className="h-5 w-5 mr-2 text-green-600" />
            Billing & Payments
            {isLoading && (
              <span className="text-sm text-green-500 ml-2 font-normal flex items-center">
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                Loading...
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Summary Statistics Badges */}
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              {totalVisits} Total Visits
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
              ₹{totalBilled.toFixed(2)} Billed
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              {paidCount} Paid
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
              ₹{totalCollected.toFixed(2)} Collected
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
              {pendingCount} Pending
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
              ₹{pendingAmount.toFixed(2)} Due
            </Badge>
            <Badge variant="outline">
              {filteredVisits.length} Result{filteredVisits.length !== 1 ? 's' : ''}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isLoading}
              className="h-9"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Integrated Date Picker & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal h-10 whitespace-nowrap",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date || new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {/* Quick Date Buttons */}
            <Button 
              onClick={() => setSelectedDate(new Date())} 
              variant="outline" 
              size="sm" 
              className="h-10"
            >
              Today
            </Button>
            <Button 
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setSelectedDate(yesterday);
              }} 
              variant="outline" 
              size="sm" 
              className="h-10"
            >
              Yesterday
            </Button>
            
            {/* Clear Date Filter (show all) */}
            {selectedDate && (
              <Button 
                onClick={() => setSelectedDate(null)} 
                variant="ghost" 
                size="sm" 
                className="h-10"
                title="Show all dates"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by patient name, patient #, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>
      </CardHeader>

      {/* Visits Table with Scrollbar */}
      <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto tab-content-container pr-2">
        {filteredVisits.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="h-16 w-16 text-gray-300 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              {completedVisits?.length === 0 ? 'No Completed Visits' : 'No Results Found'}
            </h3>
            <p className="text-gray-400 text-sm">
              {completedVisits?.length === 0
                ? selectedDate ? `No completed visits on ${format(selectedDate, "PPP")}` : 'No completed visits found'
                : 'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Patient</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Patient #</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Visit Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Doctor</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVisits.map((visit) => (
                  <tr key={visit.visitId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium text-sm">
                          {visit.patient?.firstName} {visit.patient?.middleName ? visit.patient.middleName + ' ' : ''}{visit.patient?.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">{visit.patient?.patientNumber}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(visit.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {visit.doctor?.firstName} {visit.doctor?.lastName}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-bold text-green-600 text-sm">
                        ₹{visit.totalActualCost?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="px-3 py-2">{getPaymentStatusBadge(visit)}</td>
                    <td className="px-3 py-2">
                      {(!visit.payments || visit.payments.length === 0) ? (
                        <Button
                          size="sm"
                          onClick={() => handleRecordPayment(visit)}
                          className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                        >
                          <IndianRupee className="h-3.5 w-3.5 mr-1" />
                          Record
                        </Button>
                      ) : (
                        <PaymentReceipt visit={visit} payment={visit.payments[0]} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Payment Modal */}
      <PaymentModal
        visit={selectedVisit}
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedVisit(null);
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </Card>
  );
};

export default BillingTab;
