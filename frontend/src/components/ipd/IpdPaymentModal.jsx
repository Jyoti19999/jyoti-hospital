import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Card } from '../ui/card';
import { IndianRupee, CreditCard, Wallet, Split, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import ipdBillingService from '../../services/ipdBillingService';

const IpdPaymentModal = ({ open, onOpenChange, admissionId, billDetails, onPaymentSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState('FULL_CASH');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [onlineAmount, setOnlineAmount] = useState('');
  // Track which hybrid field was last edited
  const [lastHybridEdit, setLastHybridEdit] = useState('cash');
  const [notes, setNotes] = useState('');
  const [onlinePaymentDetails, setOnlinePaymentDetails] = useState({
    transactionId: '',
    paymentMethod: '', // UPI, Card, Net Banking
    upiId: '',
    cardLast4: '',
    bankName: ''
  });

  const patientPayable = billDetails?.billing?.patientPayable || 0;
  const previouslyPaid = billDetails?.paymentStatus?.paid || 0;
  const remainingPayable = previouslyPaid > 0 
    ? (billDetails?.paymentStatus?.remaining ?? Math.max(0, patientPayable - previouslyPaid))
    : patientPayable;

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (open) {
      setPaymentMode('FULL_CASH');
      setIsPartialPayment(false);
      setCashAmount(remainingPayable.toString());
      setOnlineAmount('0');
      setNotes('');
      setOnlinePaymentDetails({
        transactionId: '',
        paymentMethod: '',
        upiId: '',
        cardLast4: '',
        bankName: ''
      });
    }
  }, [open, remainingPayable]);

  // Auto-adjust amounts based on payment mode (only for full payment)
  React.useEffect(() => {
    if (isPartialPayment) return; // Don't auto-fill for partial
    if (paymentMode === 'FULL_CASH') {
      setCashAmount(remainingPayable.toString());
      setOnlineAmount('0');
    } else if (paymentMode === 'FULL_ONLINE') {
      setCashAmount('0');
      setOnlineAmount(remainingPayable.toString());
    } else if (paymentMode === 'HYBRID') {
      setCashAmount((remainingPayable / 2).toFixed(2));
      setOnlineAmount((remainingPayable / 2).toFixed(2));
    }
  }, [paymentMode, remainingPayable, isPartialPayment]);

  // When toggling partial payment, reset amounts
  React.useEffect(() => {
    if (isPartialPayment) {
      // Clear amounts so user can enter custom
      if (paymentMode === 'FULL_CASH') {
        setCashAmount('');
        setOnlineAmount('0');
      } else if (paymentMode === 'FULL_ONLINE') {
        setCashAmount('0');
        setOnlineAmount('');
      } else {
        setCashAmount('');
        setOnlineAmount('');
      }
    } else {
      // Reset to full amounts
      if (paymentMode === 'FULL_CASH') {
        setCashAmount(remainingPayable.toString());
        setOnlineAmount('0');
      } else if (paymentMode === 'FULL_ONLINE') {
        setCashAmount('0');
        setOnlineAmount(remainingPayable.toString());
      } else {
        setCashAmount((remainingPayable / 2).toFixed(2));
        setOnlineAmount((remainingPayable / 2).toFixed(2));
      }
    }
  }, [isPartialPayment]);

  // Hybrid mode: auto-adjust the other field so sum always matches remainingPayable (only for full payment)
  React.useEffect(() => {
    if (paymentMode !== 'HYBRID' || isPartialPayment) return;
    const cash = parseFloat(cashAmount) || 0;
    const online = parseFloat(onlineAmount) || 0;
    if (lastHybridEdit === 'cash') {
      const newOnline = Math.max(0, (remainingPayable - cash)).toFixed(2);
      if (Math.abs(online - newOnline) > 0.009) setOnlineAmount(newOnline);
    } else if (lastHybridEdit === 'online') {
      const newCash = Math.max(0, (remainingPayable - online)).toFixed(2);
      if (Math.abs(cash - newCash) > 0.009) setCashAmount(newCash);
    }
  }, [cashAmount, onlineAmount, lastHybridEdit, paymentMode, remainingPayable, isPartialPayment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cash = parseFloat(cashAmount) || 0;
      const online = parseFloat(onlineAmount) || 0;
      const total = cash + online;

      // Validation
      if (total <= 0) {
        toast({
          title: 'Invalid Amount',
          description: 'Payment amount must be greater than zero',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      if (total > remainingPayable) {
        toast({
          title: 'Amount Exceeded',
          description: `Payment amount (₹${total}) exceeds remaining payable (₹${remainingPayable})`,
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      if (paymentMode === 'FULL_CASH' && online > 0) {
        toast({
          title: 'Invalid Payment Mode',
          description: 'FULL_CASH mode cannot include online amount',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      if (paymentMode === 'FULL_ONLINE' && cash > 0) {
        toast({
          title: 'Invalid Payment Mode',
          description: 'FULL_ONLINE mode cannot include cash amount',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      if (paymentMode === 'HYBRID' && (cash <= 0 || online <= 0)) {
        toast({
          title: 'Invalid Payment Mode',
          description: 'HYBRID mode requires both cash and online amounts',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Validate online payment details if online amount > 0
      if (online > 0 && !onlinePaymentDetails.transactionId) {
        toast({
          title: 'Missing Details',
          description: 'Transaction ID is required for online payments',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      const paymentData = {
        paymentMode,
        cashAmount: cash,
        onlineAmount: online,
        notes: notes.trim(),
        onlinePaymentDetails: online > 0 ? onlinePaymentDetails : null
      };

      const response = await ipdBillingService.recordPayment(admissionId, paymentData);

      toast({
        title: 'Payment Recorded',
        description: response.fullyPaid 
          ? 'Payment recorded successfully - Fully paid' 
          : `Partial payment recorded. Remaining: ₹${response.remainingAmount}`,
        variant: 'default'
      });

      onPaymentSuccess && onPaymentSuccess(response);
      onOpenChange(false);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Payment Failed',
        description: error.response?.data?.message || 'Failed to record payment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record payment for IPD admission {billDetails?.admissionDetails?.admissionNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Payable Summary */}
          <Card className="p-4 bg-muted/50">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Bill Amount:</span>
                <span className="font-medium">{formatCurrency(billDetails?.billing?.totalAmount)}</span>
              </div>
              {billDetails?.billing?.insuranceCoverage > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Insurance Coverage:</span>
                  <span className="font-medium text-green-600">
                    - {formatCurrency(billDetails?.billing?.insuranceCoverage)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Patient Payable:</span>
                <span className="font-medium">{formatCurrency(patientPayable)}</span>
              </div>
              {previouslyPaid > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Previously Paid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(previouslyPaid)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>{previouslyPaid > 0 ? 'Remaining Payable:' : 'Patient Payable:'}</span>
                <span className="text-primary">{formatCurrency(remainingPayable)}</span>
              </div>
            </div>
          </Card>

          {/* Partial Payment Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Partial Payment</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPartialPayment}
                onChange={(e) => setIsPartialPayment(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Payment Mode Selection */}
          <div className="space-y-3">
            <Label>Payment Mode *</Label>
            <RadioGroup value={paymentMode} onValueChange={setPaymentMode}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="FULL_CASH" id="cash" />
                <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Wallet className="h-4 w-4" />
                  <span>Full Cash Payment</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="FULL_ONLINE" id="online" />
                <Label htmlFor="online" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-4 w-4" />
                  <span>Full Online Payment (UPI/Card/Net Banking)</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="HYBRID" id="hybrid" />
                <Label htmlFor="hybrid" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Split className="h-4 w-4" />
                  <span>Hybrid (Cash + Online)</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Amounts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cashAmount">
                Cash Amount
                {paymentMode === 'FULL_CASH' && <span className="text-red-500"> *</span>}
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="cashAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => {
                    setCashAmount(e.target.value);
                    if (paymentMode === 'HYBRID') setLastHybridEdit('cash');
                  }}
                  disabled={paymentMode === 'FULL_ONLINE'}
                  className="pl-9"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="onlineAmount">
                Online Amount
                {paymentMode === 'FULL_ONLINE' && <span className="text-red-500"> *</span>}
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="onlineAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={onlineAmount}
                  onChange={(e) => {
                    setOnlineAmount(e.target.value);
                    if (paymentMode === 'HYBRID') setLastHybridEdit('online');
                  }}
                  disabled={paymentMode === 'FULL_CASH'}
                  className="pl-9"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Total Payment Display */}
          <Card className="p-3 bg-primary/10">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Payment Amount:</span>
              <span className="text-xl font-bold">
                {formatCurrency((parseFloat(cashAmount) || 0) + (parseFloat(onlineAmount) || 0))}
              </span>
            </div>
            {isPartialPayment && (
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-primary/20 text-sm">
                <span className="text-muted-foreground">Remaining after this payment:</span>
                <span className="font-semibold text-orange-600">
                  {formatCurrency(Math.max(0, remainingPayable - ((parseFloat(cashAmount) || 0) + (parseFloat(onlineAmount) || 0))))}
                </span>
              </div>
            )}
          </Card>

          {/* Online Payment Details (if applicable) */}
          {(paymentMode === 'FULL_ONLINE' || paymentMode === 'HYBRID') && parseFloat(onlineAmount) > 0 && (
            <Card className="p-4 space-y-3 border-2 border-primary/20">
              <h4 className="font-semibold text-sm">Online Payment Details</h4>
              
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID *</Label>
                <Input
                  id="transactionId"
                  value={onlinePaymentDetails.transactionId}
                  onChange={(e) => setOnlinePaymentDetails({
                    ...onlinePaymentDetails,
                    transactionId: e.target.value
                  })}
                  placeholder="Enter transaction/reference ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <select
                  id="paymentMethod"
                  value={onlinePaymentDetails.paymentMethod}
                  onChange={(e) => setOnlinePaymentDetails({
                    ...onlinePaymentDetails,
                    paymentMethod: e.target.value
                  })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select method</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              {onlinePaymentDetails.paymentMethod === 'UPI' && (
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    value={onlinePaymentDetails.upiId}
                    onChange={(e) => setOnlinePaymentDetails({
                      ...onlinePaymentDetails,
                      upiId: e.target.value
                    })}
                    placeholder="example@upi"
                  />
                </div>
              )}

              {(onlinePaymentDetails.paymentMethod === 'Credit Card' || 
                onlinePaymentDetails.paymentMethod === 'Debit Card') && (
                <div className="space-y-2">
                  <Label htmlFor="cardLast4">Card Last 4 Digits</Label>
                  <Input
                    id="cardLast4"
                    value={onlinePaymentDetails.cardLast4}
                    onChange={(e) => setOnlinePaymentDetails({
                      ...onlinePaymentDetails,
                      cardLast4: e.target.value
                    })}
                    placeholder="XXXX"
                    maxLength={4}
                  />
                </div>
              )}

              {onlinePaymentDetails.paymentMethod === 'Net Banking' && (
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={onlinePaymentDetails.bankName}
                    onChange={(e) => setOnlinePaymentDetails({
                      ...onlinePaymentDetails,
                      bankName: e.target.value
                    })}
                    placeholder="Enter bank name"
                  />
                </div>
              )}
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this payment..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Recording Payment...' : isPartialPayment ? 'Record Partial Payment' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IpdPaymentModal;
