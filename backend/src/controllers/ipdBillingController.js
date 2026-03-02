const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ipdBillingService = require('../services/ipdBillingService');
const path = require('path');
const fs = require('fs').promises;

/**
 * Calculate bill for an IPD admission
 * GET /api/v1/ipd/admissions/:admissionId/calculate-bill
 */
const calculateBill = async (req, res) => {
  try {
    const { admissionId } = req.params;
    
    console.log('🔍 Calculating bill for admission:', admissionId);

    const billDetails = await ipdBillingService.calculateIpdBill(admissionId);
    
    console.log('✅ Bill calculated successfully');
    console.log('Bill details structure:', Object.keys(billDetails));

    res.status(200).json({
      success: true,
      message: 'Bill calculated successfully',
      data: billDetails
    });
  } catch (error) {
    console.error('❌ Error calculating bill:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate bill',
      error: error.message
    });
  }
};

/**
 * Generate bill summary/invoice
 * POST /api/v1/ipd/admissions/:admissionId/generate-bill
 */
const generateBill = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const { includeInsurance = true, additionalNotes } = req.body;

    const billSummary = await ipdBillingService.generateBillSummary(admissionId);

    // Update admission status to BILLING_READY if not already
    const admission = await prisma.ipdAdmission.findUnique({
      where: { id: admissionId }
    });

    if (admission.status === 'SURGERY_COMPLETED') {
      // Check if insurance needs processing
      if (admission.insuranceApplicable && 
          (!admission.claimStatus || 
           admission.claimStatus === 'NOT_APPLIED' || 
           admission.claimStatus === 'APPLIED' ||
           admission.claimStatus === 'UNDER_REVIEW')) {
        return res.status(400).json({
          success: false,
          message: 'Insurance claim must be processed and approved before generating final bill',
          requiresClaimProcessing: true
        });
      }

      // Mark as BILLING_READY
      await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: { status: 'BILLING_READY' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bill generated successfully',
      data: {
        ...billSummary,
        additionalNotes
      }
    });
  } catch (error) {
    console.error('Error generating bill:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate bill',
      error: error.message
    });
  }
};

/**
 * Record payment for IPD admission
 * POST /api/v1/ipd/admissions/:admissionId/record-payment
 */
const recordPayment = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const {
      paymentMode,
      cashAmount = 0,
      onlineAmount = 0,
      onlinePaymentDetails,
      notes
    } = req.body;

    const staffId = req.user.id;

    // Validate payment mode
    const validPaymentModes = ['FULL_CASH', 'FULL_ONLINE', 'HYBRID'];
    if (!validPaymentModes.includes(paymentMode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment mode. Must be FULL_CASH, FULL_ONLINE, or HYBRID'
      });
    }

    // Get bill calculation
    const billDetails = await ipdBillingService.calculateIpdBill(admissionId);
    
    const admission = await prisma.ipdAdmission.findUnique({
      where: { id: admissionId },
      include: { patient: true }
    });

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'IPD Admission not found'
      });
    }

    // Validate payment amounts
    const totalPaidAmount = parseFloat(cashAmount) + parseFloat(onlineAmount);
    const patientPayable = billDetails.billing.patientPayable;

    // Check if there's already a partial payment — validate against remaining
    const existingPaymentCheck = await prisma.payment.findFirst({
      where: { ipdAdmissionId: admissionId }
    });
    const alreadyPaid = existingPaymentCheck ? parseFloat(existingPaymentCheck.totalPaidAmount) : 0;
    const maxPayableNow = patientPayable - alreadyPaid;

    if (totalPaidAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero'
      });
    }

    if (totalPaidAmount > maxPayableNow + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${totalPaidAmount}) exceeds remaining payable amount (${maxPayableNow})`
      });
    }

    // Validate payment mode consistency
    if (paymentMode === 'FULL_CASH' && parseFloat(onlineAmount) > 0) {
      return res.status(400).json({
        success: false,
        message: 'FULL_CASH mode cannot include online amount'
      });
    }

    if (paymentMode === 'FULL_ONLINE' && parseFloat(cashAmount) > 0) {
      return res.status(400).json({
        success: false,
        message: 'FULL_ONLINE mode cannot include cash amount'
      });
    }

    if (paymentMode === 'HYBRID' && (parseFloat(cashAmount) <= 0 || parseFloat(onlineAmount) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'HYBRID mode requires both cash and online amounts'
      });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: { ipdAdmissionId: admissionId }
    });

    let payment;
    let remainingAmount = patientPayable - totalPaidAmount;

    if (existingPayment) {
      // Update existing payment (partial payment scenario)
      const newTotalPaid = parseFloat(existingPayment.totalPaidAmount) + totalPaidAmount;
      remainingAmount = parseFloat(existingPayment.remainingAmount) - totalPaidAmount;

      payment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          totalPaidAmount: newTotalPaid,
          remainingAmount: Math.max(0, remainingAmount),
          cashAmount: parseFloat(existingPayment.cashAmount || 0) + parseFloat(cashAmount),
          onlineAmount: parseFloat(existingPayment.onlineAmount || 0) + parseFloat(onlineAmount),
          notes: notes ? `${existingPayment.notes || ''}\n${notes}` : existingPayment.notes
        }
      });
    } else {
      // Create new payment record
      const paymentNumber = `PAY-IPD-${admission.admissionNumber}-${Date.now()}`;

      payment = await prisma.payment.create({
        data: {
          paymentNumber,
          patientId: admission.patientId,
          ipdAdmissionId: admissionId,
          paymentType: 'IPD',
          totalBilledAmount: billDetails.billing.totalAmount,
          totalPaidAmount: totalPaidAmount,
          remainingAmount: Math.max(0, remainingAmount),
          paymentMode,
          cashAmount: parseFloat(cashAmount),
          onlineAmount: parseFloat(onlineAmount),
          onlinePaymentDetails: onlinePaymentDetails ? JSON.stringify(onlinePaymentDetails) : null,
          claimApplied: admission.insuranceApplicable,
          claimStatus: admission.claimStatus,
          claimNumber: admission.claimNumber,
          claimAmountRequested: admission.claimAmountRequested,
          claimAmountSanctioned: admission.claimAmountSanctioned,
          claimSubmittedAt: admission.claimSubmittedAt,
          notes,
          createdBy: staffId,
          receiptGenerated: false
        }
      });
    }

    // Update admission status
    let newStatus = admission.status;
    if (remainingAmount <= 0) {
      newStatus = 'PAYMENT_RECORDED';
    } else {
      newStatus = 'BILLING_READY'; // Still has pending payment
    }

    await prisma.ipdAdmission.update({
      where: { id: admissionId },
      data: { status: newStatus }
    });

    res.status(200).json({
      success: true,
      message: remainingAmount <= 0 ? 'Payment recorded successfully - Fully paid' : 'Partial payment recorded successfully',
      data: {
        payment,
        remainingAmount: Math.max(0, remainingAmount),
        fullyPaid: remainingAmount <= 0
      }
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record payment',
      error: error.message
    });
  }
};

/**
 * Get billing summary for an admission
 * GET /api/v1/ipd/admissions/:admissionId/billing-summary
 */
const getBillingSummary = async (req, res) => {
  try {
    const { admissionId } = req.params;

    const billSummary = await ipdBillingService.generateBillSummary(admissionId);

    res.status(200).json({
      success: true,
      data: billSummary
    });
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch billing summary',
      error: error.message
    });
  }
};

/**
 * Get all admissions ready for billing
 * GET /api/v1/ipd/billing/ready
 */
const getAdmissionsReadyForBilling = async (req, res) => {
  try {
    const {
      insuranceApplicable,
      startDate,
      endDate
    } = req.query;

    const result = await ipdBillingService.getAdmissionsReadyForBilling({
      insuranceApplicable,
      startDate,
      endDate
    });

    res.status(200).json({
      success: true,
      message: 'Admissions fetched successfully',
      data: result.admissions
    });
  } catch (error) {
    console.error('Error fetching admissions ready for billing:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch admissions ready for billing',
      error: error.message
    });
  }
};

/**
 * Get payment history for an admission
 * GET /api/v1/ipd/admissions/:admissionId/payments
 */
const getPaymentHistory = async (req, res) => {
  try {
    const { admissionId } = req.params;

    const payments = await prisma.payment.findMany({
      where: { ipdAdmissionId: admissionId },
      include: {
        recordedBy: {
          select: {
            staffId: true,
            firstName: true,
            lastName: true,
            staffType: true
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment history',
      error: error.message
    });
  }
};

/**
 * Mark admission ready for billing (after surgery completion)
 * POST /api/v1/ipd/admissions/:admissionId/mark-billing-ready
 */
const markReadyForBilling = async (req, res) => {
  try {
    const { admissionId } = req.params;

    const result = await ipdBillingService.markReadyForBilling(admissionId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
        requiresClaimProcessing: result.requiresClaimProcessing
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.admission
    });
  } catch (error) {
    console.error('Error marking ready for billing:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark ready for billing',
      error: error.message
    });
  }
};

/**
 * Add additional charges to an IPD admission from the billing tab
 * POST /api/v1/ipd/admissions/:admissionId/add-charges
 */
const addAdditionalCharges = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const { charges } = req.body; // [{id, name, price}]
    const staffId = req.user.id;

    if (!charges || !Array.isArray(charges) || charges.length === 0) {
      return res.status(400).json({ success: false, message: 'No charges provided' });
    }

    const admission = await prisma.ipdAdmission.findUnique({
      where: { id: admissionId },
      include: { surgeryPackageDetail: { select: { packageCost: true, packageName: true } } }
    });

    if (!admission) {
      return res.status(404).json({ success: false, message: 'IPD Admission not found' });
    }

    // Calculate charges total
    const chargesTotal = charges.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0);

    // Merge with existing additional charges
    const existingCharges = Array.isArray(admission.appliedAdditionalCharges) ? admission.appliedAdditionalCharges : [];
    const mergedCharges = [...existingCharges, ...charges];

    // Add to existing finalSurgeryAmount
    const currentFinal = parseFloat(admission.finalSurgeryAmount) || 0;
    const newFinalAmount = currentFinal + chargesTotal;

    // Update billingBreakdown with action history
    const existingBreakdown = admission.billingBreakdown || {};
    const actions = existingBreakdown.actions || [];
    actions.push({
      type: 'ADDITIONAL_CHARGES_ADDED_BILLING',
      timestamp: new Date().toISOString(),
      addedBy: staffId,
      chargesAdded: charges,
      chargesTotal,
      previousFinalAmount: currentFinal,
      newFinalAmount
    });

    await prisma.ipdAdmission.update({
      where: { id: admissionId },
      data: {
        appliedAdditionalCharges: mergedCharges,
        finalSurgeryAmount: newFinalAmount,
        billingBreakdown: { ...existingBreakdown, actions }
      }
    });

    res.status(200).json({
      success: true,
      message: `${charges.length} additional charge(s) added successfully`,
      data: {
        chargesAdded: charges,
        chargesTotal,
        newFinalAmount,
        totalAdditionalCharges: mergedCharges.length
      }
    });
  } catch (error) {
    console.error('Error adding additional charges:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to add charges' });
  }
};

/**
 * Save payment receipt PDF to server
 * POST /api/v1/ipd/admissions/:admissionId/save-receipt
 */
const saveReceipt = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const { receiptBase64, paymentId } = req.body;

    if (!receiptBase64) {
      return res.status(400).json({ success: false, message: 'Receipt data is required' });
    }

    // Get admission with patient info
    const admission = await prisma.ipdAdmission.findUnique({
      where: { id: admissionId },
      include: { patient: { select: { patientNumber: true } } }
    });

    if (!admission) {
      return res.status(404).json({ success: false, message: 'IPD Admission not found' });
    }

    const patientNumber = admission.patient.patientNumber;
    const admissionNumber = admission.admissionNumber;

    // Create directory: uploads/{patientNumber}/{admissionNumber}/payment-receipts/
    const receiptDir = path.join(__dirname, '../../uploads', String(patientNumber), admissionNumber, 'payment-receipts');
    await fs.mkdir(receiptDir, { recursive: true });

    // Generate filename with timestamp
    const timestamp = Date.now();
    const fileName = `receipt-${timestamp}.pdf`;
    const filePath = path.join(receiptDir, fileName);

    // Decode base64 and save
    const base64Data = receiptBase64.replace(/^data:application\/pdf;base64,/, '');
    await fs.writeFile(filePath, base64Data, 'base64');

    // Relative path for DB storage
    const relativePath = `uploads/${patientNumber}/${admissionNumber}/payment-receipts/${fileName}`;

    // Update payment record
    const payment = paymentId
      ? await prisma.payment.findUnique({ where: { id: paymentId } })
      : await prisma.payment.findFirst({ where: { ipdAdmissionId: admissionId } });

    if (payment) {
      // Append receipt path (support multiple receipts for partial payments)
      const existingPaths = payment.receiptPath ? payment.receiptPath.split(',') : [];
      existingPaths.push(relativePath);

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          receiptGenerated: true,
          receiptPath: existingPaths.join(',')
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Receipt saved successfully',
      data: { receiptPath: relativePath }
    });
  } catch (error) {
    console.error('Error saving receipt:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save receipt' });
  }
};

module.exports = {
  calculateBill,
  generateBill,
  recordPayment,
  getBillingSummary,
  getAdmissionsReadyForBilling,
  getPaymentHistory,
  markReadyForBilling,
  addAdditionalCharges,
  saveReceipt
};
