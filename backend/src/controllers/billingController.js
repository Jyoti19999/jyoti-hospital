const prisma = require('../utils/prisma');

/**
 * Get all completed patient visits awaiting payment
 */
const getCompletedVisitsForBilling = async (req, res) => {
  try {
    const { status, startDate, endDate, searchTerm } = req.query;

    console.log('📋 Fetching completed visits for billing:', {
      status,
      startDate,
      endDate,
      searchTerm
    });

    // Build where clause
    const whereClause = {
      status: 'COMPLETED',
      totalActualCost: {
        gt: 0 // Only visits with billing amount
      }
    };

    // Add date filter if provided
    if (startDate || endDate) {
      whereClause.completedAt = {};
      if (startDate) whereClause.completedAt.gte = new Date(startDate);
      if (endDate) whereClause.completedAt.lte = new Date(endDate);
    }

    // Add search filter if provided
    if (searchTerm) {
      whereClause.OR = [
        {
          patient: {
            firstName: { contains: searchTerm, mode: 'insensitive' }
          }
        },
        {
          patient: {
            lastName: { contains: searchTerm, mode: 'insensitive' }
          }
        },
        {
          patient: {
            patientNumber: { contains: searchTerm, mode: 'insensitive' }
          }
        }
      ];
    }

    const completedVisits = await prisma.patientVisit.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            gender: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            doctorProfile: true
          }
        },
        payment: {
          select: {
            id: true,
            paymentNumber: true,
            totalBilledAmount: true,
            totalPaidAmount: true,
            remainingAmount: true,
            paymentMode: true,
            cashAmount: true,
            onlineAmount: true,
            paymentDate: true,
            claimApplied: true,
            claimStatus: true
          }
        },
        ophthalmologistExaminations: {
          select: {
            id: true,
            doctor: {
              select: {
                firstName: true,
                lastName: true,
                doctorProfile: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    // Calculate age and format data
    const formattedVisits = completedVisits.map(visit => {
      const age = visit.patient?.dateOfBirth
        ? Math.floor((new Date() - new Date(visit.patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      // Get doctor from either doctor relation or ophthalmologist examination
      const doctorInfo = visit.doctor || visit.ophthalmologistExaminations?.[0]?.doctor;

      return {
        visitId: visit.id,
        id: visit.id,
        visitDate: visit.visitDate,
        completedAt: visit.completedAt,
        visitType: visit.visitType,
        isFollowUp: visit.isFollowUp,
        totalActualCost: visit.totalActualCost,
        totalEstimatedCost: visit.totalEstimatedCost,
        billingInitiatedAt: visit.billingInitiatedAt,
        patient: {
          ...visit.patient,
          age,
          fullName: `${visit.patient.firstName} ${visit.patient.middleName || ''} ${visit.patient.lastName}`.trim()
        },
        doctor: doctorInfo,
        ophthalmologistExaminations: visit.ophthalmologistExaminations,
        payments: visit.payment ? [visit.payment] : [],
        payment: visit.payment,
        isPaid: !!visit.payment
      };
    });

    res.status(200).json({
      success: true,
      data: formattedVisits,
      count: formattedVisits.length
    });

  } catch (error) {
    console.error('❌ Error fetching completed visits for billing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch completed visits',
      error: error.message
    });
  }
};

/**
 * Get single visit billing details
 */
const getVisitBillingDetails = async (req, res) => {
  try {
    const { visitId } = req.params;

    const visit = await prisma.patientVisit.findUnique({
      where: { id: visitId },
      include: {
        patient: true,
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            doctorProfile: true
          }
        },
        payment: true,
        ophthalmologistExaminations: {
          include: {
            doctor: {
              select: {
                firstName: true,
                lastName: true,
                doctorProfile: true
              }
            }
          }
        },
        appointment: {
          select: {
            appointmentDate: true,
            tokenNumber: true
          }
        }
      }
    });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    res.status(200).json({
      success: true,
      data: visit
    });

  } catch (error) {
    console.error('❌ Error fetching visit billing details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visit billing details',
      error: error.message
    });
  }
};

/**
 * Record payment for a visit
 */
const recordPayment = async (req, res) => {
  try {
    const { visitId } = req.params;
    const {
      paymentMode,
      cashAmount,
      onlineAmount,
      onlinePaymentDetails,
      notes
    } = req.body;

    const staffId = req.user.id;

    console.log('💰 Recording payment for visit:', {
      visitId,
      paymentMode,
      cashAmount,
      onlineAmount,
      staffId
    });

    const result = await prisma.$transaction(async (tx) => {
      // Get the visit
      const visit = await tx.patientVisit.findUnique({
        where: { id: visitId },
        include: {
          patient: true
        }
      });

      if (!visit) {
        throw new Error('Visit not found');
      }

      if (visit.status !== 'COMPLETED') {
        throw new Error('Can only record payment for completed visits');
      }

      // Check if payment already exists
      const existingPayment = await tx.payment.findUnique({
        where: { patientVisitId: visitId }
      });

      if (existingPayment) {
        throw new Error('Payment already recorded for this visit');
      }

      // Calculate amounts
      const totalBilledAmount = visit.totalActualCost || 0;
      const totalPaidAmount = (parseFloat(cashAmount) || 0) + (parseFloat(onlineAmount) || 0);
      const remainingAmount = totalBilledAmount - totalPaidAmount;

      // Validate payment
      if (totalPaidAmount > totalBilledAmount) {
        throw new Error('Payment amount cannot exceed billed amount');
      }

      if (paymentMode === 'HYBRID' && (!cashAmount || !onlineAmount)) {
        throw new Error('Both cash and online amounts required for hybrid payment');
      }

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          patientId: visit.patientId,
          patientVisitId: visitId,
          paymentType: 'OPD',
          totalBilledAmount,
          totalPaidAmount,
          remainingAmount,
          paymentMode,
          cashAmount: parseFloat(cashAmount) || 0,
          onlineAmount: parseFloat(onlineAmount) || 0,
          onlinePaymentDetails: onlinePaymentDetails || null,
          notes,
          createdBy: staffId,
          paymentDate: new Date()
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true
            }
          }
        }
      });

      // Update PatientVisit with payment status
      await tx.patientVisit.update({
        where: { id: visitId },
        data: {
          paymentDone: true,
          paymentId: payment.id
        }
      });

      return payment;
    });

    console.log(`✅ Payment recorded successfully: ${result.paymentNumber}`);

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Error recording payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record payment'
    });
  }
};

module.exports = {
  getCompletedVisitsForBilling,
  getVisitBillingDetails,
  recordPayment
};
