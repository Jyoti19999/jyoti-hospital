const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');

/**
 * Calculate claim amount based on surgery package, lens cost, and additional charges
 */
const calculateClaimAmount = async (req, res) => {
  try {
    const { ipdId } = req.params;

    console.log('🧮 Calculating claim amount for IPD:', ipdId);

    // Fetch IPD admission with related data
    const admission = await prisma.ipdAdmission.findUnique({
      where: { id: ipdId },
      include: {
        surgeryPackageDetail: true,
        lens: true,
        patient: true
      }
    });

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'IPD admission not found'
      });
    }

    // Calculate base amount
    let calculatedAmount = 0;
    const breakdown = {
      surgeryPackageCost: 0,
      lensCost: 0,
      additionalCharges: 0,
      additionalChargesPercentage: 10
    };

    // Add surgery package cost
    if (admission.surgeryPackageDetail?.packageCost) {
      breakdown.surgeryPackageCost = admission.surgeryPackageDetail.packageCost;
      calculatedAmount += breakdown.surgeryPackageCost;
    }

    // Add lens cost
    if (admission.lens?.patientCost) {
      breakdown.lensCost = admission.lens.patientCost;
      calculatedAmount += breakdown.lensCost;
    }

    // Add additional charges (10% of base for hospital charges, consumables, etc.)
    breakdown.additionalCharges = calculatedAmount * 0.10;
    calculatedAmount += breakdown.additionalCharges;

    // Round to 2 decimal places
    calculatedAmount = Math.round(calculatedAmount * 100) / 100;

    console.log('✅ Claim amount calculated:', calculatedAmount);

    return res.json({
      success: true,
      data: {
        ...breakdown,
        calculatedAmount: calculatedAmount,
        patientName: `${admission.patient.firstName} ${admission.patient.lastName}`,
        patientNumber: admission.patient.patientNumber,
        admissionNumber: admission.admissionNumber,
        surgeryPackageName: admission.surgeryPackageDetail?.packageName || 'Not selected',
        lensName: admission.lens?.lensName || 'Not required'
      }
    });
  } catch (error) {
    console.error('❌ Error calculating claim amount:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate claim amount',
      error: error.message
    });
  }
};

/**
 * Upload claim documents and initiate claim process
 */
const uploadClaimDocuments = async (req, res) => {
  try {
    const { ipdId } = req.params;
    const {
      insuranceProviderId,
      claimAmountRequested,
      claimNotes,
      selectedAdditionalCharges,
      isCashless,
      isReimbursement
    } = req.body;
    const staffId = req.user?.id; // From auth middleware

    console.log('📤 Uploading claim documents for IPD:', ipdId);
    console.log('📋 Claim data:', { insuranceProviderId, claimAmountRequested, filesCount: req.files?.length, additionalCharges: selectedAdditionalCharges });

    // Validate required fields
    if (!insuranceProviderId || !claimAmountRequested) {
      return res.status(400).json({
        success: false,
        message: 'Insurance provider and claim amount are required'
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one claim document must be uploaded'
      });
    }

    // Get IPD admission
    const admission = await prisma.ipdAdmission.findUnique({
      where: { id: ipdId },
      include: { 
        patient: true,
        surgeryPackageDetail: true,
        lens: true
      }
    });

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'IPD admission not found'
      });
    }

    // Generate unique claim number
    const timestamp = Date.now();
    const claimNumber = `CLM-${admission.admissionNumber}-${timestamp}`;

    // Build file paths array (store relative paths from uploads directory)
    const documentPaths = req.files.map(file => {
      // Get path relative to uploads directory
      const uploadsIndex = file.path.indexOf('uploads');
      if (uploadsIndex !== -1) {
        const relativePath = file.path.substring(uploadsIndex);
        return relativePath.replace(/\\/g, '/');
      }
      return file.path.replace(/\\/g, '/');
    });

    console.log('📁 Document paths:', documentPaths);

    // Parse additional charges and calculate total
    let parsedAdditionalCharges = [];
    let additionalChargesTotal = 0;
    
    if (selectedAdditionalCharges) {
      try {
        parsedAdditionalCharges = typeof selectedAdditionalCharges === 'string' 
          ? JSON.parse(selectedAdditionalCharges) 
          : selectedAdditionalCharges;
        
        // Frontend sends { id, name, price } per charge
        additionalChargesTotal = parsedAdditionalCharges.reduce((total, charge) => {
          return total + (parseFloat(charge.price) || parseFloat(charge.totalAmount) || parseFloat(charge.chargePrice) || 0);
        }, 0);
      } catch (error) {
        console.error('❌ Error parsing additional charges:', error);
        parsedAdditionalCharges = [];
      }
    }

    // Use existing finalSurgeryAmount (set during surgery scheduling from package cost) and add additional charges on top
    const existingFinalAmount = parseFloat(admission.finalSurgeryAmount) || 0;
    const surgeryPackageCost = admission.surgeryPackageDetail?.packageCost || 0;
    
    // Base amount: use existing finalSurgeryAmount if set, otherwise fall back to package cost
    const baseAmount = existingFinalAmount > 0 ? existingFinalAmount : surgeryPackageCost;
    
    // Final amount = base + additional charges
    let calculatedAmount = baseAmount + additionalChargesTotal;
    calculatedAmount = Math.round(calculatedAmount * 100) / 100;

    console.log('💰 Claim amount calculation:', {
      existingFinalAmount,
      surgeryPackageCost,
      baseAmount,
      additionalChargesTotal,
      calculatedAmount
    });

    // Create billing breakdown for tracking with action history
    const existingBreakdown = admission.billingBreakdown || {};
    const currentBillingBreakdown = {
      ...existingBreakdown,
      initialData: {
        surgeryPackageId: admission.surgeryPackageId,
        surgeryPackageName: admission.surgeryPackageDetail?.packageName,
        surgeryPackageCost: surgeryPackageCost,
        lensId: admission.lensId,
        lensName: admission.lens?.lensName,
        lensCost: admission.lens?.patientCost || 0,
        finalSurgeryAmountBeforeClaim: existingFinalAmount
      },
      claimSubmission: {
        submittedAt: new Date(),
        submittedBy: staffId || null,
        additionalCharges: parsedAdditionalCharges,
        additionalChargesTotal: additionalChargesTotal,
        baseAmountUsed: baseAmount,
        totalAfterAdditionalCharges: calculatedAmount,
        claimAmountRequested: parseFloat(claimAmountRequested),
        isCashless: isCashless === 'true' || isCashless === true,
        isReimbursement: isReimbursement === 'true' || isReimbursement === true
      },
      currentStatus: {
        status: 'APPLIED',
        finalSurgeryAmount: calculatedAmount,
        lastUpdated: new Date()
      },
      actions: [
        ...(existingBreakdown.actions || []),
        {
          action: 'CLAIM_SUBMITTED',
          timestamp: new Date(),
          performedBy: staffId || null,
          details: {
            previousFinalAmount: existingFinalAmount,
            additionalChargesAdded: parsedAdditionalCharges.map(c => ({ name: c.name, price: parseFloat(c.price) || parseFloat(c.totalAmount) || parseFloat(c.chargePrice) || 0 })),
            additionalChargesTotal: additionalChargesTotal,
            newFinalAmount: calculatedAmount
          }
        }
      ]
    };

    // Update admission with claim data
    const updatedAdmission = await prisma.ipdAdmission.update({
      where: { id: ipdId },
      data: {
        insuranceApplicable: true, // Set to true when claim is submitted
        claimInitiated: true,
        claimStatus: 'APPLIED',
        claimNumber: claimNumber,
        claimSubmittedAt: new Date(),
        claimSubmittedBy: staffId || null,
        insuranceProviderId: insuranceProviderId,
        claimAmountRequested: parseFloat(claimAmountRequested),
        claimCalculatedAmount: calculatedAmount,
        finalSurgeryAmount: calculatedAmount, // Updated to include additional charges
        appliedAdditionalCharges: parsedAdditionalCharges.length > 0 ? parsedAdditionalCharges : null,
        billingBreakdown: currentBillingBreakdown, // Track billing history
        isCashless: isCashless === 'true' || isCashless === true,
        isReimbursement: isReimbursement === 'true' || isReimbursement === true,
        claimDocumentsPaths: documentPaths,
        claimNotes: claimNotes || null
      },
      include: {
        patient: true,
        insuranceProvider: true,
        claimSubmitter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    });

    console.log('✅ Claim submitted successfully:', claimNumber);

    return res.status(200).json({
      success: true,
      message: 'Claim documents uploaded and claim initiated successfully',
      data: {
        claimNumber: updatedAdmission.claimNumber,
        claimStatus: updatedAdmission.claimStatus,
        documentCount: documentPaths.length,
        claimAmountRequested: updatedAdmission.claimAmountRequested,
        claimCalculatedAmount: updatedAdmission.claimCalculatedAmount,
        submittedAt: updatedAdmission.claimSubmittedAt
      }
    });
  } catch (error) {
    console.error('❌ Error uploading claim documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload claim documents',
      error: error.message
    });
  }
};

/**
 * Update claim status
 */
const updateClaimStatus = async (req, res) => {
  try {
    const { ipdId } = req.params;
    const {
      claimStatus,
      claimAmountSanctioned,
      claimRejectionReason
    } = req.body;
    const staffId = req.user?.id;

    console.log('🔄 Updating claim status for IPD:', ipdId, 'to:', claimStatus);

    // Get current admission data for billing breakdown calculations
    const currentAdmission = await prisma.ipdAdmission.findUnique({
      where: { id: ipdId },
      include: {
        surgeryPackageDetail: true,
        lens: true
      }
    });

    if (!currentAdmission) {
      return res.status(404).json({
        success: false,
        message: 'IPD admission not found'
      });
    }

    // Validate status
    const validStatuses = [
      'APPLIED', 'UNDER_REVIEW', 'APPROVED',
      'PARTIALLY_APPROVED', 'REJECTED', 'SETTLED'
    ];

    if (!validStatuses.includes(claimStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid claim status'
      });
    }

    const updateData = {
      claimStatus: claimStatus
    };

    // Calculate updated finalSurgeryAmount and billing breakdown
    let updatedFinalAmount = currentAdmission.finalSurgeryAmount;
    let updatedBillingBreakdown = currentAdmission.billingBreakdown || {};

    // Add sanctioned amount if approved
    if (claimStatus === 'APPROVED' || claimStatus === 'PARTIALLY_APPROVED') {
      if (!claimAmountSanctioned) {
        return res.status(400).json({
          success: false,
          message: 'Sanctioned amount is required for approval'
        });
      }
      
      const sanctionedAmount = parseFloat(claimAmountSanctioned);
      
      // Update final surgery amount (patient payable after insurance coverage)
      if (currentAdmission.isCashless) {
        // For cashless, patient pays only the remaining amount
        updatedFinalAmount = Math.max(0, currentAdmission.finalSurgeryAmount - sanctionedAmount);
      } else {
        // For reimbursement, patient initially pays full amount 
        // finalSurgeryAmount stays same for payment, but we track reimbursable amount
        updatedFinalAmount = currentAdmission.finalSurgeryAmount;
      }
      
      // Update billing breakdown with approval details
      updatedBillingBreakdown = {
        ...updatedBillingBreakdown,
        tpaApproval: {
          approvedAt: new Date(),
          approvedBy: staffId || null,
          status: claimStatus,
          totalClaimedAmount: currentAdmission.claimAmountRequested,
          sanctionedAmount: sanctionedAmount,
          isCashless: currentAdmission.isCashless,
          isReimbursement: currentAdmission.isReimbursement,
          ...(currentAdmission.isCashless && {
            patientPayableAfterInsurance: updatedFinalAmount
          }),
          ...(currentAdmission.isReimbursement && {
            patientPaysFullAmount: updatedFinalAmount,
            reimbursableAmount: sanctionedAmount
          })
        },
        currentStatus: {
          status: claimStatus,
          finalSurgeryAmount: updatedFinalAmount,
          lastUpdated: new Date()
        }
      };
      
      updateData.claimAmountSanctioned = sanctionedAmount;
      updateData.claimApprovedBy = staffId || null;
      updateData.claimApprovedAt = new Date();
      updateData.finalSurgeryAmount = updatedFinalAmount;
      updateData.billingBreakdown = updatedBillingBreakdown;
    }

    // Handle rejection case
    if (claimStatus === 'REJECTED') {
      // Patient pays full amount on rejection
      updatedFinalAmount = currentAdmission.finalSurgeryAmount;
      
      updatedBillingBreakdown = {
        ...updatedBillingBreakdown,
        tpaRejection: {
          rejectedAt: new Date(),
          rejectedBy: staffId || null,
          reason: claimRejectionReason || 'No reason provided',
          originalClaimAmount: currentAdmission.claimAmountRequested,
          patientPaysFullAmount: updatedFinalAmount
        },
        currentStatus: {
          status: claimStatus,
          finalSurgeryAmount: updatedFinalAmount,
          lastUpdated: new Date()
        }
      };
      
      updateData.claimRejectionReason = claimRejectionReason;
      updateData.billingBreakdown = updatedBillingBreakdown;
    }

    const updatedAdmission = await prisma.ipdAdmission.update({
      where: { id: ipdId },
      data: updateData,
      include: {
        patient: true,
        insuranceProvider: true,
        claimApprover: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        }
      }
    });

    console.log('✅ Claim status updated successfully');

    return res.json({
      success: true,
      message: 'Claim status updated successfully',
      data: {
        claimNumber: updatedAdmission.claimNumber,
        claimStatus: updatedAdmission.claimStatus,
        claimAmountSanctioned: updatedAdmission.claimAmountSanctioned,
        claimApprovedAt: updatedAdmission.claimApprovedAt
      }
    });
  } catch (error) {
    console.error('❌ Error updating claim status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update claim status',
      error: error.message
    });
  }
};

/**
 * Get claim details
 */
const getClaimDetails = async (req, res) => {
  try {
    const { ipdId } = req.params;

    console.log('📋 Fetching claim details for IPD:', ipdId);

    const admission = await prisma.ipdAdmission.findUnique({
      where: { id: ipdId },
      include: {
        patient: true,
        insuranceProvider: true,
        claimSubmitter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            phone: true,
            email: true
          }
        },
        claimApprover: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            phone: true,
            email: true
          }
        },
        surgeryPackageDetail: true,
        lens: true,
        surgeryTypeDetail: true
      }
    });

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'IPD admission not found'
      });
    }

    console.log('✅ Claim details fetched successfully');

    return res.json({
      success: true,
      data: admission
    });
  } catch (error) {
    console.error('❌ Error fetching claim details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch claim details',
      error: error.message
    });
  }
};

/**
 * Update claim amount (editable field)
 */
const updateClaimAmount = async (req, res) => {
  try {
    const { ipdId } = req.params;
    const { claimAmountRequested } = req.body;

    console.log('💰 Updating claim amount for IPD:', ipdId, 'to:', claimAmountRequested);

    if (!claimAmountRequested || isNaN(claimAmountRequested)) {
      return res.status(400).json({
        success: false,
        message: 'Valid claim amount is required'
      });
    }

    const updatedAdmission = await prisma.ipdAdmission.update({
      where: { id: ipdId },
      data: {
        claimAmountRequested: parseFloat(claimAmountRequested)
      },
      select: {
        id: true,
        claimNumber: true,
        claimAmountRequested: true,
        claimStatus: true
      }
    });

    console.log('✅ Claim amount updated successfully');

    return res.json({
      success: true,
      message: 'Claim amount updated successfully',
      data: updatedAdmission
    });
  } catch (error) {
    console.error('❌ Error updating claim amount:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update claim amount',
      error: error.message
    });
  }
};

/**
 * Get all pending claims (APPLIED, UNDER_REVIEW statuses)
 */
const getPendingClaims = async (req, res) => {
  try {
    console.log('📋 Fetching pending claims');

    const pendingClaims = await prisma.ipdAdmission.findMany({
      where: {
        claimInitiated: true,
        claimStatus: {
          in: ['APPLIED', 'UNDER_REVIEW']
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            phone: true
          }
        },
        insuranceProvider: {
          select: {
            id: true,
            providerName: true,
            providerCode: true,
            phoneNumber: true,
            email: true
          }
        },
        claimSubmitter: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        surgeryTypeDetail: {
          select: {
            name: true
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
        }
      },
      orderBy: {
        claimSubmittedAt: 'desc'
      }
    });

    console.log(`✅ Found ${pendingClaims.length} pending claims`);

    return res.json({
      success: true,
      count: pendingClaims.length,
      data: pendingClaims
    });
  } catch (error) {
    console.error('❌ Error fetching pending claims:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending claims',
      error: error.message
    });
  }
};

/**
 * Get all approved claims with optional filters
 */
const getApprovedClaims = async (req, res) => {
  try {
    const { search, startDate, endDate } = req.query;
    console.log('📋 Fetching approved claims with filters:', { search, startDate, endDate });

    // Build where clause
    const whereClause = {
      claimInitiated: true,
      claimStatus: 'APPROVED'
    };

    // Add date filter
    if (startDate || endDate) {
      whereClause.claimApprovedAt = {};
      if (startDate) {
        whereClause.claimApprovedAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the end date
        const endDatePlusOne = new Date(endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        whereClause.claimApprovedAt.lt = endDatePlusOne;
      }
    }

    // Fetch approved claims
    let approvedClaims = await prisma.ipdAdmission.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            phone: true
          }
        },
        insuranceProvider: {
          select: {
            id: true,
            providerName: true,
            providerCode: true,
            phoneNumber: true,
            email: true
          }
        },
        claimSubmitter: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        claimApprover: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        surgeryTypeDetail: {
          select: {
            name: true
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
        }
      },
      orderBy: {
        claimApprovedAt: 'desc'
      }
    });

    // Apply search filter in JavaScript (case-insensitive)
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      approvedClaims = approvedClaims.filter(claim => {
        const patientName = `${claim.patient.firstName} ${claim.patient.lastName}`.toLowerCase();
        const patientNumber = claim.patient.patientNumber.toLowerCase();
        const claimNumber = claim.claimNumber.toLowerCase();
        const providerName = claim.insuranceProvider?.providerName?.toLowerCase() || '';
        
        return patientName.includes(searchLower) ||
               patientNumber.includes(searchLower) ||
               claimNumber.includes(searchLower) ||
               providerName.includes(searchLower);
      });
    }

    console.log(`✅ Found ${approvedClaims.length} approved claims`);

    return res.json({
      success: true,
      count: approvedClaims.length,
      data: approvedClaims
    });
  } catch (error) {
    console.error('❌ Error fetching approved claims:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch approved claims',
      error: error.message
    });
  }
};

/**
 * Get all rejected claims with optional filters
 */
const getRejectedClaims = async (req, res) => {
  try {
    const { search, startDate, endDate } = req.query;
    console.log('📋 Fetching rejected claims with filters:', { search, startDate, endDate });

    // Build where clause
    const whereClause = {
      claimInitiated: true,
      claimStatus: 'REJECTED'
    };

    // Add date filter - use claimSubmittedAt for rejected claims
    if (startDate || endDate) {
      whereClause.claimSubmittedAt = {};
      if (startDate) {
        whereClause.claimSubmittedAt.gte = new Date(startDate);
      }
      if (endDate) {
        const endDatePlusOne = new Date(endDate);
        endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
        whereClause.claimSubmittedAt.lt = endDatePlusOne;
      }
    }

    // Fetch rejected claims
    let rejectedClaims = await prisma.ipdAdmission.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            phone: true
          }
        },
        insuranceProvider: {
          select: {
            id: true,
            providerName: true,
            providerCode: true,
            phoneNumber: true,
            email: true
          }
        },
        claimSubmitter: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true
          }
        },
        surgeryTypeDetail: {
          select: {
            name: true
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
        }
      },
      orderBy: {
        claimSubmittedAt: 'desc'
      }
    });

    // Apply search filter
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      rejectedClaims = rejectedClaims.filter(claim => {
        const patientName = `${claim.patient.firstName} ${claim.patient.lastName}`.toLowerCase();
        const patientNumber = claim.patient.patientNumber.toLowerCase();
        const claimNumber = claim.claimNumber.toLowerCase();
        const providerName = claim.insuranceProvider?.providerName?.toLowerCase() || '';
        
        return patientName.includes(searchLower) ||
               patientNumber.includes(searchLower) ||
               claimNumber.includes(searchLower) ||
               providerName.includes(searchLower);
      });
    }

    console.log(`✅ Found ${rejectedClaims.length} rejected claims`);

    return res.json({
      success: true,
      count: rejectedClaims.length,
      data: rejectedClaims
    });
  } catch (error) {
    console.error('❌ Error fetching rejected claims:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch rejected claims',
      error: error.message
    });
  }
};

/**
 * Get TPA Dashboard Analytics Stats
 */
const getClaimAnalytics = async (req, res) => {
  try {
    console.log('📊 Fetching TPA analytics stats');

    // Get total claims count
    const totalClaims = await prisma.ipdAdmission.count({
      where: {
        claimStatus: {
          not: 'NOT_APPLIED'
        }
      }
    });

    // Get approved claims count
    const approvedClaims = await prisma.ipdAdmission.count({
      where: {
        claimStatus: 'APPROVED'
      }
    });

    // Get under process claims count (APPLIED + UNDER_REVIEW)
    const underProcessClaims = await prisma.ipdAdmission.count({
      where: {
        claimStatus: {
          in: ['APPLIED', 'UNDER_REVIEW']
        }
      }
    });

    // Calculate approval rate
    const approvalRate = totalClaims > 0 
      ? Math.round((approvedClaims / totalClaims) * 100) 
      : 0;

    const analytics = {
      totalClaims,
      approvedClaims,
      underProcessClaims,
      approvalRate
    };

    console.log('✅ Analytics stats:', analytics);

    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

/**
 * Get Recent Claims (Max 4) for Overview
 */
const getRecentClaims = async (req, res) => {
  try {
    console.log('📋 Fetching recent claims');

    const recentClaims = await prisma.ipdAdmission.findMany({
      where: {
        claimStatus: {
          not: 'NOT_APPLIED'
        }
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientNumber: true,
            phone: true
          }
        },
        insuranceProvider: {
          select: {
            providerName: true,
            providerCode: true
          }
        },
        surgeryTypeDetail: {
          select: {
            name: true
          }
        },
        claimApprover: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        claimSubmittedAt: 'desc'
      },
      take: 4
    });

    console.log(`✅ Found ${recentClaims.length} recent claims`);

    return res.json({
      success: true,
      count: recentClaims.length,
      data: recentClaims
    });
  } catch (error) {
    console.error('❌ Error fetching recent claims:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent claims',
      error: error.message
    });
  }
};

/**
 * Update IPD admission with final surgery amount and payment mode
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateIpdAdmissionAmount = async (req, res) => {
  try {
    const { ipdId } = req.params;
    const { finalSurgeryAmount, isCashless, isReimbursement } = req.body;

    console.log('🔄 Updating IPD admission:', {
      ipdId,
      finalSurgeryAmount,
      isCashless,
      isReimbursement
    });

    // Validate input
    if (!finalSurgeryAmount || finalSurgeryAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Final surgery amount is required and must be greater than 0'
      });
    }

    // Ensure only one of isCashless or isReimbursement is true
    const updateData = {
      finalSurgeryAmount: parseFloat(finalSurgeryAmount),
      isCashless: Boolean(isCashless),
      isReimbursement: Boolean(isReimbursement)
    };

    // Ensure mutually exclusive flags
    if (updateData.isCashless && updateData.isReimbursement) {
      updateData.isReimbursement = false; // If both specified, prioritize cashless
    }

    // Update the IPD admission
    const updatedAdmission = await prisma.ipdAdmission.update({
      where: {
        id: ipdId
      },
      data: updateData,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            patientNumber: true
          }
        },
        surgeryPackageDetail: {
          select: {
            packageName: true,
            packageCost: true
          }
        }
      }
    });

    console.log('✅ Successfully updated IPD admission amount:', {
      ipdId,
      finalSurgeryAmount: updatedAdmission.finalSurgeryAmount,
      isCashless: updatedAdmission.isCashless,
      isReimbursement: updatedAdmission.isReimbursement
    });

    return res.json({
      success: true,
      message: 'IPD admission updated successfully',
      data: updatedAdmission
    });

  } catch (error) {
    console.error('❌ Error updating IPD admission amount:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update IPD admission',
      error: error.message
    });
  }
};

module.exports = {
  calculateClaimAmount,
  uploadClaimDocuments,
  updateClaimStatus,
  getClaimDetails,
  updateClaimAmount,
  getPendingClaims,
  getApprovedClaims,
  getRejectedClaims,
  getClaimAnalytics,
  getRecentClaims,
  updateIpdAdmissionAmount
};
