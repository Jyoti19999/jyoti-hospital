// src/controllers/surgeryController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Surgery Controller
 * Handles surgery-related operations across different staff types
 */
class SurgeryController {

  /**
   * Get patients recommended for surgery by ophthalmologist (for Receptionist2)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSurgeryRecommendedPatients(req, res) {
    try {
      console.log('📋 Getting surgery recommended patients');

      // Get patients who have been recommended for surgery
      const patientsWithSurgery = await prisma.ophthalmologistExamination.findMany({
        where: {
          surgeryRecommended: true
        },
        include: {
          patientVisit: {
            include: {
              patient: {
                select: {
                  id: true,
                  patientNumber: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                  dateOfBirth: true
                }
              },
              doctor: {
                select: {
                  firstName: true,
                  lastName: true,
                  staffType: true
                }
              }
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      // Get existing IPD admissions for these patients
      const patientIds = patientsWithSurgery.map(exam => exam.patientVisit.patient.id);
      
      const existingAdmissions = await prisma.ipdAdmission.findMany({
        where: {
          patientId: { in: patientIds },
          status: {
            in: ['ADMITTED', 'SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT', 'SURGERY_DAY']
          }
        },
        select: {
          id: true,
          admissionNumber: true,
          patientId: true,
          status: true,
          surgeryDate: true,
          surgeryPackage: true,
          iolType: true,
          tentativeTime: true,
          expectedDuration: true,
          priorityLevel: true,
          surgeryType: true,
          surgeonId: true,
          createdAt: true
        }
      });

      // Map admissions by patient ID for easy lookup
      const admissionsMap = new Map();
      existingAdmissions.forEach(admission => {
        admissionsMap.set(admission.patientId, admission);
      });

      // Format the response
      const surgeryRecommendations = patientsWithSurgery.map(exam => {
        const patient = exam.patientVisit.patient;
        const doctor = exam.patientVisit.doctor;
        const admission = admissionsMap.get(patient.id);

        // Check if surgery details have been filled by receptionist2
        const hasDetailsFromReceptionist = admission && (
          admission.surgeryDate || 
          admission.surgeryPackage || 
          admission.iolType
        );

        return {
          id: exam.id,
          patient: {
            id: patient.id,
            patientNumber: patient.patientNumber,
            firstName: patient.firstName,
            middleName: patient.middleName,
            lastName: patient.lastName,
            phone: patient.phone,
            email: patient.email,
            age: patient.dateOfBirth ? 
              Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
              null
          },
          surgeryRecommended: exam.surgeryRecommended,
          surgeryType: exam.surgeryType,
          urgencyLevel: exam.urgencyLevel,
          recommendedBy: `${doctor.firstName} ${doctor.lastName}`,
          recommendedDate: exam.updatedAt,
          followUpRequired: exam.followUpRequired,
          followUpDate: exam.followUpDate,
          ipdAdmission: admission ? {
            id: admission.id,
            admissionNumber: admission.admissionNumber,
            status: admission.status,
            hasDetails: hasDetailsFromReceptionist,
            surgeryDate: admission.surgeryDate,
            tentativeTime: admission.tentativeTime,
            surgeryPackage: admission.surgeryPackage,
            iolType: admission.iolType,
            expectedDuration: admission.expectedDuration,
            priorityLevel: admission.priorityLevel,
            surgeryType: admission.surgeryType,
            surgeonId: admission.surgeonId,
            createdAt: admission.createdAt
          } : null
        };
      });

      res.json({
        success: true,
        message: 'Surgery recommended patients retrieved successfully',
        data: surgeryRecommendations,
        count: surgeryRecommendations.length
      });

    } catch (error) {
      console.error('❌ Error getting surgery recommended patients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get surgery recommended patients',
        error: error.message
      });
    }
  }

  /**
   * Update surgery details for IPD admission (Receptionist2 workflow)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateSurgeryDetails(req, res) {
    try {
      console.log('📝 Updating surgery details');

      const { patientId } = req.params;
      const {
        surgeryDate,
        tentativeTime,
        surgeryPackage,
        iolType,
        specialInstructions,
        preOpInstructions,
        expectedDuration,
        priorityLevel
      } = req.body;

      // Find or create IPD admission for this patient
      let admission = await prisma.ipdAdmission.findFirst({
        where: {
          patientId,
          status: {
            in: ['ADMITTED', 'SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT']
          }
        }
      });

      if (!admission) {
        // Get patient and surgery type from ophthalmologist examination
        const examination = await prisma.ophthalmologistExamination.findFirst({
          where: {
            patientVisit: {
              patientId
            },
            surgeryRecommended: true
          },
          orderBy: { updatedAt: 'desc' },
          include: {
            patientVisit: {
              include: {
                patient: true
              }
            }
          }
        });

        if (!examination) {
          return res.status(404).json({
            success: false,
            message: 'No surgery recommendation found for this patient'
          });
        }

        // Create new IPD admission
        const admissionNumber = `IPD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        
        admission = await prisma.ipdAdmission.create({
          data: {
            admissionNumber,
            patientId,
            admittedBy: req.user.id,
            admissionDate: new Date(),
            surgeryType: examination.surgeryType ? examination.surgeryType.toUpperCase() : 'CATARACT',
            status: 'SURGERY_SUGGESTED'  // Updated: Use new enum for surgery recommendations
          }
        });
      }

      // Update admission with surgery details from receptionist2
      const updatedAdmission = await prisma.ipdAdmission.update({
        where: { id: admission.id },
        data: {
          surgeryDate: surgeryDate ? new Date(surgeryDate) : admission.surgeryDate,
          tentativeTime: tentativeTime || admission.tentativeTime,
          surgeryPackage: surgeryPackage || admission.surgeryPackage,
          iolType: iolType || admission.iolType,
          preOpInstructions: preOpInstructions || admission.preOpInstructions,
          specialInstructions: specialInstructions || admission.specialInstructions,
          expectedDuration: expectedDuration ? parseInt(expectedDuration) : admission.expectedDuration,
          priorityLevel: priorityLevel || admission.priorityLevel || 'ROUTINE',
          status: 'RECEPTIONIST2_CONSULTED',  // Updated: Progress to next stage
          updatedAt: new Date()
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

      res.json({
        success: true,
        message: 'Surgery details updated successfully',
        data: updatedAdmission
      });

    } catch (error) {
      console.error('❌ Error updating surgery details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update surgery details',
        error: error.message
      });
    }
  }

  /**
   * Get upcoming surgery requests for OT Admin
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUpcomingSurgeryRequests(req, res) {
    try {
      console.log('📋 OT Admin: Getting upcoming surgery requests');

      // Get IPD admissions that have surgery details filled by receptionist2
      const surgeryRequests = await prisma.ipdAdmission.findMany({
        where: {
          status: 'SURGERY_SCHEDULED',
          surgeryDate: { not: null },
          OR: [
            { surgeonId: null },
            { otRoom: null }
          ]
        },
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true,
              phone: true,
              dateOfBirth: true
            }
          },
          admittingStaff: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          },
          surgeon: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffType: true
            }
          }
        },
        orderBy: {
          surgeryDate: 'asc'
        }
      });

      // Format response
      const formattedRequests = surgeryRequests.map(admission => ({
        id: admission.id,
        patient: {
          id: admission.patient.id,
          patientNumber: admission.patient.patientNumber,
          firstName: admission.patient.firstName,
          lastName: admission.patient.lastName,
          phone: admission.patient.phone,
          age: admission.patient.dateOfBirth ? 
            Math.floor((new Date() - new Date(admission.patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
            null
        },
        ipdAdmission: {
          id: admission.id,
          admissionNumber: admission.admissionNumber,
          surgeryType: admission.surgeryType,
          surgeryDate: admission.surgeryDate,
          tentativeTime: admission.tentativeTime,
          surgeryPackage: admission.surgeryPackage,
          iolType: admission.iolType,
          expectedDuration: admission.expectedDuration,
          priorityLevel: admission.priorityLevel || 'routine'
        },
        receptionist2Details: {
          completedAt: admission.updatedAt,
          completedBy: `${admission.admittingStaff.firstName} ${admission.admittingStaff.lastName}`,
          preOpInstructions: admission.preOpInstructions,
          specialInstructions: admission.specialInstructions
        },
        otAdminStatus: admission.surgeonId && admission.otRoom ? 'assigned' : 'pending',
        assignedSurgeon: admission.surgeonId,
        assignedOtRoom: admission.otRoom
      }));

      res.json({
        success: true,
        message: 'Upcoming surgery requests retrieved successfully',
        data: formattedRequests,
        count: formattedRequests.length
      });

    } catch (error) {
      console.error('❌ Error getting upcoming surgery requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get upcoming surgery requests',
        error: error.message
      });
    }
  }

  /**
   * Assign surgeon and OT room to surgery (OT Admin workflow)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async assignSurgeryDetails(req, res) {
    try {
      console.log('📝 OT Admin: Assigning surgery details');

      const { admissionId } = req.params;
      const {
        surgeonId,
        otRoom,
        finalSurgeryDate,
        finalTime,
        anesthesiaType,
        assistantStaff,
        equipmentNeeds,
        otAdminNotes
      } = req.body;

      // Update IPD admission with OT admin assignments
      const updatedAdmission = await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: {
          surgeonId: surgeonId || null,
          otRoom: otRoom || null,
          surgeryDate: finalSurgeryDate ? new Date(finalSurgeryDate) : undefined,
          tentativeTime: finalTime || undefined,
          anesthesiaType: anesthesiaType || null,
          assistantStaff: assistantStaff || null,
          equipmentNeeds: equipmentNeeds || null,
          notes: otAdminNotes || null,
          status: surgeonId && otRoom ? 'PRE_OP_ASSESSMENT' : 'SURGERY_SCHEDULED',
          updatedAt: new Date()
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true
            }
          },
          surgeon: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Surgery details assigned successfully',
        data: updatedAdmission
      });

    } catch (error) {
      console.error('❌ Error assigning surgery details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign surgery details',
        error: error.message
      });
    }
  }
}

module.exports = new SurgeryController();