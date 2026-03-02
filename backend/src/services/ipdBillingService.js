const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calculate simplified IPD bill for a completed surgery
 * @param {string} admissionId - IPD Admission ID
 * @returns {Promise<Object>} Simplified billing breakdown based on surgery package only
 */
const calculateIpdBill = async (admissionId) => {
  try {
    const admission = await prisma.ipdAdmission.findUnique({
      where: { id: admissionId },
      include: {
        surgeryPackageDetail: true,
        lens: {
          select: {
            lensName: true,
            lensType: true,
            manufacturer: true
          }
        },
        insuranceProvider: true,
        patient: {
          select: {
            patientNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            gender: true
          }
        },
        surgeon: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!admission) {
      throw new Error('IPD Admission not found');
    }

    // Use finalSurgeryAmount from database (already calculated with additional charges and insurance adjustments)
    const finalAmount = parseFloat(admission.finalSurgeryAmount) || 0;
    const surgeryPackageCost = parseFloat(admission.surgeryPackageDetail?.packageCost) || 0;
    
    // Get billing breakdown for detailed tracking
    const billingBreakdown = admission.billingBreakdown || {};
    
    // Extract additional charges info if applied
    let additionalChargesInfo = null;
    if (admission.appliedAdditionalCharges && admission.appliedAdditionalCharges.length > 0) {
      const totalAdditionalCharges = admission.appliedAdditionalCharges.reduce((sum, charge) => {
        return sum + (parseFloat(charge.price) || parseFloat(charge.totalAmount) || parseFloat(charge.chargePrice) || 0);
      }, 0);
      
      additionalChargesInfo = {
        charges: admission.appliedAdditionalCharges,
        total: totalAdditionalCharges,
        applied: true
      };
    }

    // Insurance coverage and patient payable calculation (using database finalSurgeryAmount)
    let insuranceCoverage = 0;
    let insuranceDetails = null;
    let patientPayable = finalAmount; // Use calculated finalSurgeryAmount from database
    let billingDisplayType = 'NO_INSURANCE';

    if (admission.insuranceApplicable) {
      billingDisplayType = admission.isCashless ? 'INSURANCE_CASHLESS' : 
                          admission.isReimbursement ? 'INSURANCE_REIMBURSEMENT' : 'INSURANCE_CASHLESS';

      insuranceDetails = {
        providerName: admission.insuranceProvider?.providerName || 'Unknown',
        claimNumber: admission.claimNumber,
        claimAmountRequested: parseFloat(admission.claimAmountRequested) || 0,
        claimAmountSanctioned: parseFloat(admission.claimAmountSanctioned) || 0,
        claimStatus: admission.claimStatus,
        isCashless: admission.isCashless || false,
        isReimbursement: admission.isReimbursement || false,
        claimApprovedAt: admission.claimApprovedAt,
        billingBreakdown: billingBreakdown.tpaApproval || billingBreakdown.tpaRejection || null
      };

      // Patient payable amount is already calculated in finalSurgeryAmount from TPA approval/rejection
      if (admission.claimStatus === 'APPROVED') {
        insuranceCoverage = parseFloat(admission.claimAmountSanctioned) || 0;
        
        if (admission.isCashless) {
          // For cashless, finalSurgeryAmount already contains patient payable after insurance
          patientPayable = finalAmount;
          insuranceDetails.note = `Cashless approved - ₹${insuranceCoverage} covered by insurance, ₹${patientPayable} payable by patient`;
        } else if (admission.isReimbursement) {
          // For reimbursement, patient pays full amount, gets reimbursed later
          patientPayable = finalAmount;
          insuranceDetails.note = `Reimbursement approved - ₹${insuranceCoverage} will be reimbursed after payment`;
        }
        
      } else if (admission.claimStatus === 'PARTIALLY_APPROVED') {
        insuranceCoverage = parseFloat(admission.claimAmountSanctioned) || 0;
        patientPayable = finalAmount; // Already adjusted in database
        insuranceDetails.note = admission.isCashless 
          ? 'Cashless claim partially approved' 
          : 'Reimbursement claim partially approved';
        
      } else if (admission.claimStatus === 'REJECTED') {
        patientPayable = finalAmount; // Full amount when rejected
        insuranceDetails.note = 'Insurance claim rejected - full payment required';
        
      } else {
        patientPayable = finalAmount;
        insuranceDetails.note = admission.claimStatus 
          ? `Claim status: ${admission.claimStatus} - payment required`
          : 'No insurance claim submitted - full payment required';
      }
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findFirst({
      where: { ipdAdmissionId: admissionId }
    });

    const paymentStatus = existingPayment ? {
      paid: existingPayment.totalPaidAmount,
      remaining: existingPayment.remainingAmount,
      paymentDate: existingPayment.paymentDate,
      paymentMode: existingPayment.paymentMode
    } : null;

    // Create detailed breakdown structure with billing breakdown info
    const createDetailedBreakdown = () => {
      const breakdown = [];
      
      // Always include surgery package
      breakdown.push({
        item: 'Surgery Package',
        amount: surgeryPackageCost,
        details: {
          name: admission.surgeryPackageDetail?.packageName || 'Standard Surgery Package',
          description: 'Complete surgical procedures, IOL lens, equipment, consumables, and hospital charges',
          inclusions: [
            'Complete surgical procedures and consultation',
            `Intraocular Lens (IOL) - ${admission.lens?.lensName || 'Standard IOL'}`,
            'All surgical equipment and instruments',
            'Medical consumables and medicines',
            'Hospital charges and administrative fees',
            'Operation theater and nursing care charges'
          ]
        }
      });
      
      // Add additional charges if applied
      if (additionalChargesInfo && additionalChargesInfo.applied) {
        breakdown.push({
          item: 'Additional Charges',
          amount: additionalChargesInfo.total,
          details: {
            description: 'Additional medical charges applied during treatment',
            charges: additionalChargesInfo.charges.map(charge => ({
              name: charge.name || charge.chargeName,
              amount: parseFloat(charge.price) || parseFloat(charge.totalAmount) || parseFloat(charge.chargePrice) || 0,
              description: charge.description
            }))
          }
        });
      }
      
      const computedTotal = surgeryPackageCost + (additionalChargesInfo ? additionalChargesInfo.total : 0);
      return {
        detailedBreakdown: breakdown,
        billingBreakdown: billingBreakdown,
        totalBreakdown: `₹${surgeryPackageCost} (Surgery Package)${additionalChargesInfo ? ` + ₹${additionalChargesInfo.total} (Additional Charges)` : ''} = ₹${computedTotal}`
      };
    };
    // Return comprehensive billing breakdown with detailed tracking
    return {
      billingDisplayType: billingDisplayType,
      admissionDetails: {
        admissionId: admission.id,
        admissionNumber: admission.admissionNumber,
        admissionDate: admission.admissionDate,
        surgeryDate: admission.surgeryDate,
        surgeryCompletedAt: admission.surgeryCompletedAt,
        status: admission.status
      },
      patientDetails: {
        patientNumber: admission.patient.patientNumber,
        name: `${admission.patient.firstName} ${admission.patient.middleName || ''} ${admission.patient.lastName}`.trim(),
        phone: admission.patient.phone,
        dateOfBirth: admission.patient.dateOfBirth,
        gender: admission.patient.gender
      },
      surgeonDetails: admission.surgeon ? {
        employeeId: admission.surgeon.employeeId,
        name: `${admission.surgeon.firstName} ${admission.surgeon.lastName}`
      } : null,
      
      // DETAILED COST BREAKDOWN - Surgery package + additional charges (if any)
      costBreakdown: createDetailedBreakdown(),
      
      // BILLING INFORMATION - Using database finalSurgeryAmount (includes all adjustments)
      billing: {
        surgeryPackageCost: surgeryPackageCost,
        packageBreakdown: admission.surgeryPackageDetail?.packageBreakdown || null,
        additionalCharges: additionalChargesInfo ? additionalChargesInfo.total : 0,
        subtotal: surgeryPackageCost + (additionalChargesInfo ? additionalChargesInfo.total : 0),
        finalSurgeryAmount: finalAmount, // From database (includes additional charges, insurance adjustments)
        insuranceCoverage: insuranceCoverage,
        patientPayable: patientPayable,
        billingModel: additionalChargesInfo ? 'package-plus-additional' : 'package-only',
        appliedChargesInfo: additionalChargesInfo
      },
      
      insuranceDetails: insuranceDetails,
      paymentStatus: paymentStatus,
      calculatedAt: new Date()
    };
  } catch (error) {
    console.error('Error calculating simplified IPD bill:', error);
    throw error;
  }
};

/**
 * Get all admissions ready for billing
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of admissions ready for billing
 */
const getAdmissionsReadyForBilling = async (filters = {}) => {
  try {
    const {
      insuranceApplicable,
      startDate,
      endDate
    } = filters;

    const whereClause = {
      OR: [
        { status: 'SURGERY_SCHEDULED' },
        { status: 'SURGERY_COMPLETED' },
        { status: 'BILLING_READY' },
        { status: 'PAYMENT_RECORDED' }
      ]
    };

    // Filter by insurance applicability
    if (insuranceApplicable !== undefined) {
      whereClause.insuranceApplicable = insuranceApplicable === 'true' || insuranceApplicable === true;
    }

    // Filter by date range
    if (startDate || endDate) {
      whereClause.admissionDate = {};
      if (startDate) {
        whereClause.admissionDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.admissionDate.lte = new Date(endDate);
      }
    }

    console.log('Fetching IPD admissions with whereClause:', JSON.stringify(whereClause, null, 2));

    const admissions = await prisma.ipdAdmission.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            patientNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            phone: true
          }
        },
        surgeryPackageDetail: {
          select: {
            packageName: true,
            packageCost: true
          }
        },
        lens: {
          select: {
            lensName: true,
            patientCost: true
          }
        },
        insuranceProvider: {
          select: {
            providerName: true
          }
        },
        payment: {
          select: {
            id: true,
            totalPaidAmount: true,
            remainingAmount: true,
            paymentDate: true
          }
        }
      },
      orderBy: {
        admissionDate: 'desc'
      }
    });

    console.log(`Found ${admissions.length} admissions for billing page`);

    return { admissions };
  } catch (error) {
    console.error('Error fetching admissions ready for billing:', error);
    throw error;
  }
};

/**
 * Generate bill summary for display or printing
 * @param {string} admissionId - IPD Admission ID
 * @returns {Promise<Object>} Bill summary
 */
const generateBillSummary = async (admissionId) => {
  try {
    const billDetails = await calculateIpdBill(admissionId);
    
    // Format for invoice/receipt generation
    return {
      invoiceNumber: `IPD-INV-${billDetails.admissionDetails.admissionNumber}`,
      invoiceDate: new Date(),
      ...billDetails
    };
  } catch (error) {
    console.error('Error generating bill summary:', error);
    throw error;
  }
};

/**
 * Update admission status to BILLING_READY after surgery completion
 * @param {string} admissionId - IPD Admission ID
 * @returns {Promise<Object>} Updated admission
 */
const markReadyForBilling = async (admissionId) => {
  try {
    const admission = await prisma.ipdAdmission.findUnique({
      where: { id: admissionId }
    });

    if (!admission) {
      throw new Error('IPD Admission not found');
    }

    if (admission.status !== 'SURGERY_COMPLETED') {
      throw new Error('Surgery must be completed before marking ready for billing');
    }

    // Check if insurance claim needs to be processed first
    if (admission.insuranceApplicable && 
        (!admission.claimStatus || admission.claimStatus === 'NOT_APPLIED' || admission.claimStatus === 'APPLIED')) {
      return {
        success: false,
        message: 'Insurance claim must be processed before billing',
        requiresClaimProcessing: true,
        admission
      };
    }

    // Update status to BILLING_READY
    const updatedAdmission = await prisma.ipdAdmission.update({
      where: { id: admissionId },
      data: {
        status: 'BILLING_READY'
      }
    });

    return {
      success: true,
      message: 'Admission marked ready for billing',
      admission: updatedAdmission
    };
  } catch (error) {
    console.error('Error marking admission ready for billing:', error);
    throw error;
  }
};

module.exports = {
  calculateIpdBill,
  getAdmissionsReadyForBilling,
  generateBillSummary,
  markReadyForBilling
};
