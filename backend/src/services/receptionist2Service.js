// src/services/receptionist2Service.js
const prisma = require('../utils/prisma');

class Receptionist2Service {
  /**
   * Get patients that have been checked by optometrists (completed optometrist examinations)
   * @param {Object} filters - Optional filters for date, status, etc.
   * @returns {Promise<Object>} List of patients checked by optometrists
   */
  async getOptometristCheckedPatients(filters = {}) {
    try {
      const { date, status, patientName, tokenNumber } = filters;

      // Set date range - default to today if no date provided
      let startDate, endDate;
      if (date) {
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
      } else {
        const today = new Date();
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
      }

      // Build where clause for optometrist examinations
      const whereClause = {
        completedAt: {
          gte: startDate,
          lte: endDate
        }
      };

      // Add additional filters if provided
      const visitWhereClause = {};
      if (status) {
        visitWhereClause.status = status;
      }

      const patientWhereClause = {};
      if (patientName) {
        patientWhereClause.OR = [
          { firstName: { contains: patientName, mode: 'insensitive' } },
          { lastName: { contains: patientName, mode: 'insensitive' } }
        ];
      }

      // Add phone search support
      if (filters.phone) {
        if (patientWhereClause.OR) {
          patientWhereClause.OR.push({ phone: { contains: filters.phone } });
        } else {
          patientWhereClause.phone = { contains: filters.phone };
        }
      }

      const appointmentWhereClause = {};
      if (tokenNumber) {
        appointmentWhereClause.tokenNumber = tokenNumber;
      }

      // Get completed optometrist examinations with patient details
      const checkedPatients = await prisma.optometristExamination.findMany({
        where: whereClause,
        include: {
          patientVisit: {
            where: Object.keys(visitWhereClause).length > 0 ? visitWhereClause : undefined,
            include: {
              patient: {
                where: Object.keys(patientWhereClause).length > 0 ? patientWhereClause : undefined,
                select: {
                  id: true,
                  patientNumber: true,
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true,
                  gender: true,
                  phone: true,
                  email: true
                }
              },
              appointment: {
                where: Object.keys(appointmentWhereClause).length > 0 ? appointmentWhereClause : undefined,
                select: {
                  id: true,
                  tokenNumber: true,
                  appointmentTime: true,
                  appointmentType: true,
                  purpose: true
                }
              },
              doctor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  staffType: true
                }
              }
            }
          },
          optometrist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true
            }
          }
        },
        orderBy: {
          completedAt: 'desc'
        }
      });

      // Filter out null results from where clauses
      const validCheckedPatients = checkedPatients.filter(exam =>
        exam.patientVisit &&
        exam.patientVisit.patient &&
        exam.patientVisit.appointment
      );

      // Transform data for frontend consumption
      const transformedPatients = validCheckedPatients.map(exam => ({
        examinationId: exam.id,
        patientVisitId: exam.patientVisitId,
        completedAt: exam.completedAt,
        examinationStatus: exam.examinationStatus,

        // Patient information
        patient: {
          id: exam.patientVisit.patient.id,
          patientNumber: exam.patientVisit.patient.patientNumber,
          fullName: `${exam.patientVisit.patient.firstName} ${exam.patientVisit.patient.lastName}`,
          firstName: exam.patientVisit.patient.firstName,
          lastName: exam.patientVisit.patient.lastName,
          dateOfBirth: exam.patientVisit.patient.dateOfBirth,
          gender: exam.patientVisit.patient.gender,
          phone: exam.patientVisit.patient.phone,
          email: exam.patientVisit.patient.email
        },

        // Appointment information
        appointment: {
          id: exam.patientVisit.appointment.id,
          tokenNumber: exam.patientVisit.appointment.tokenNumber,
          appointmentTime: exam.patientVisit.appointment.appointmentTime,
          appointmentType: exam.patientVisit.appointment.appointmentType,
          purpose: exam.patientVisit.appointment.purpose
        },

        // Visit information
        visit: {
          id: exam.patientVisit.id,
          visitNumber: exam.patientVisit.visitNumber,
          visitType: exam.patientVisit.visitType,
          status: exam.patientVisit.status,
          checkedInAt: exam.patientVisit.checkedInAt,
          optometristSeenAt: exam.patientVisit.optometristSeenAt
        },

        // Optometrist information
        optometrist: {
          id: exam.optometrist.id,
          name: `${exam.optometrist.firstName} ${exam.optometrist.lastName}`,
          employeeId: exam.optometrist.employeeId
        },

        // Doctor information (if assigned)
        doctor: exam.patientVisit.doctor ? {
          id: exam.patientVisit.doctor.id,
          name: `Dr. ${exam.patientVisit.doctor.firstName} ${exam.patientVisit.doctor.lastName}`,
          staffType: exam.patientVisit.doctor.staffType
        } : null,

        // Examination summary
        examinationSummary: {
          preliminaryDiagnosis: exam.preliminaryDiagnosis,
          clinicalNotes: exam.clinicalNotes,
          assignedDoctor: exam.assignedDoctor,
          proceedToDoctor: exam.proceedToDoctor,
          requiresDilation: exam.requiresDilation
        },

        // Key examination data (for quick reference)
        keyFindings: {
          visualAcuity: exam.visualAcuity,
          refraction: exam.refraction,
          tonometry: exam.tonometry,
          iopOD: exam.iopOD,
          iopOS: exam.iopOS
        },

        // Receptionist2 Review Status
        receptionist2Review: {
          reviewed: exam.receptionist2Reviewed || false,
          reviewedAt: exam.receptionist2ReviewedAt,
          reviewedBy: exam.receptionist2ReviewedBy,
          notes: exam.receptionist2Notes
        }
      }));

      // Calculate statistics
      const totalPatients = transformedPatients.length;
      const awaitingDoctor = transformedPatients.filter(p => p.visit.status === 'AWAITING_DOCTOR').length;
      const withDoctor = transformedPatients.filter(p => p.visit.status === 'WITH_DOCTOR').length;
      const completed = transformedPatients.filter(p => p.visit.status === 'COMPLETED').length;

      console.log(`✅ Retrieved ${totalPatients} patients checked by optometrists`);
      console.log(`📊 Statistics: awaiting=${awaitingDoctor}, withDoctor=${withDoctor}, completed=${completed}`);
      console.log(`🔍 Filters applied: date=${date || 'today'}, status=${status || 'all'}, patientName=${patientName || 'none'}`);

      if (totalPatients === 0) {
        console.log('⚠️ No optometrist examinations found. This could mean:');
        console.log('   - No patients have been examined by optometrists today');
        console.log('   - Date filter is excluding all results');
        console.log('   - Status filter is excluding all results');
        console.log(`   - Searching for date: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      }

      return {
        success: true,
        data: {
          patients: transformedPatients,
          statistics: {
            totalPatients,
            awaitingDoctor,
            withDoctor,
            completed
          },
          filters: {
            date: date || new Date().toISOString().split('T')[0],
            status,
            patientName,
            tokenNumber
          },
          retrievedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Error getting optometrist checked patients:', error);
      throw new Error(`Failed to get optometrist checked patients: ${error.message}`);
    }
  }

  /**
   * Mark ophthalmology queue patient as reviewed by receptionist2
   * @param {string} queueEntryId - Queue entry ID
   * @param {string} receptionist2Id - Receptionist2 staff ID
   * @param {string} notes - Optional review notes
   * @returns {Promise<Object>} Updated queue entry
   */
  async markOphthalmologyPatientAsReviewed(queueEntryId, receptionist2Id, notes = null) {
    try {


      // Get the queue entry with patient visit and optometrist examination info
      const queueEntry = await prisma.patientQueue.findUnique({
        where: { id: queueEntryId },
        include: {
          patientVisit: {
            include: {
              optometristExamination: {
                select: { id: true }
              }
            }
          },
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!queueEntry) {
        throw new Error('Queue entry not found');
      }

      // Check if this patient came from optometrist examination
      const optometristExaminationId = queueEntry.patientVisit?.optometristExamination?.id;

      // Always update both OptometristExamination (if exists) AND PatientQueue
      if (optometristExaminationId) {
        console.log(`🏥 Patient came from optometrist - updating OptometristExamination: ${optometristExaminationId}`);

        // Update the OptometristExamination table
        await prisma.optometristExamination.update({
          where: { id: optometristExaminationId },
          data: {
            receptionist2Reviewed: true,
            receptionist2ReviewedAt: new Date(),
            receptionist2ReviewedBy: receptionist2Id,
            receptionist2Notes: notes,
            updatedAt: new Date()
          }
        });

        console.log(`✅ OptometristExamination updated with receptionist2 review`);
      }

      // ALWAYS update PatientQueue table as well for consistency and easier querying
      console.log(`� Also updating PatientQueue entry for consistency: ${queueEntryId}`);
      


      // Update PatientQueue with dedicated receptionist2 review fields
      await prisma.patientQueue.update({
        where: { id: queueEntryId },
        data: {
          receptionist2Reviewed: true,
          receptionist2ReviewedAt: new Date(),
          receptionist2ReviewedBy: receptionist2Id,
          receptionist2Notes: notes,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        data: queueEntry
      };

    } catch (error) {
      console.error('❌ Receptionist2Service: Error marking ophthalmology patient as reviewed:', error);
      throw new Error(`Failed to mark patient as reviewed: ${error.message}`);
    }
  }

  /**
   * Toggle review status for ophthalmology queue patient
   * @param {string} queueEntryId - Queue entry ID
   * @param {string} receptionist2Id - Receptionist2 staff ID
   * @param {string} notes - Optional review notes (used only when marking as reviewed)
   * @returns {Promise<Object>} Updated queue entry with review status
   */
  async toggleOphthalmologyPatientReview(queueEntryId, receptionist2Id, notes = null) {
    try {
      console.log(`🔄 Toggling ophthalmology queue patient review status: ${queueEntryId}`);

      // First, get the current queue entry with examination info to check current status
      const queueEntry = await prisma.patientQueue.findUnique({
        where: { id: queueEntryId },
        include: {
          patientVisit: {
            include: {
              optometristExamination: {
                select: { 
                  id: true,
                  receptionist2Reviewed: true,
                  receptionist2ReviewedAt: true,
                  receptionist2ReviewedBy: true
                }
              }
            }
          },
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!queueEntry) {
        throw new Error('Queue entry not found');
      }

      const optometristExamination = queueEntry.patientVisit?.optometristExamination;
      
      // Handle case where patient came directly to ophthalmologist (no optometrist examination)
      if (!optometristExamination) {
        console.log(`⚠️ No optometrist examination found - patient came directly to ophthalmologist. Using PatientQueue status.`);
        
        // Check current review status from PatientQueue table
        const isCurrentlyReviewed = queueEntry.receptionist2Reviewed;
        
        if (isCurrentlyReviewed) {
          // Unmark as reviewed (mark as absent)
          return await this.unmarkOphthalmologyPatientAsReviewed(queueEntryId);
        } else {
          // Mark as reviewed (mark as present)
          return await this.markOphthalmologyPatientAsReviewed(queueEntryId, receptionist2Id, notes);
        }
      }

      // Patient has optometrist examination - check status from there
      const isCurrentlyReviewed = optometristExamination.receptionist2Reviewed;
      
      if (isCurrentlyReviewed) {
       
        return await this.unmarkOphthalmologyPatientAsReviewed(queueEntryId);
      } else {
        // If not reviewed, mark it as reviewed
        return await this.markOphthalmologyPatientAsReviewed(queueEntryId, receptionist2Id, notes);
      }

    } catch (error) {
      console.error('❌ Receptionist2Service: Error toggling ophthalmology patient review:', error);
      throw new Error(`Failed to toggle patient review status: ${error.message}`);
    }
  }

  /**
   * Unmark ophthalmology queue patient as reviewed by receptionist2
   * @param {string} queueEntryId - Queue entry ID
   * @returns {Promise<Object>} Updated queue entry
   */
  async unmarkOphthalmologyPatientAsReviewed(queueEntryId) {
    try {
      
      // Get the queue entry with patient visit and optometrist examination info
      const queueEntry = await prisma.patientQueue.findUnique({
        where: { id: queueEntryId },
        include: {
          patientVisit: {
            include: {
              optometristExamination: {
                select: { id: true }
              }
            }
          },
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!queueEntry) {
        throw new Error('Queue entry not found');
      }

      // Check if this patient came from optometrist examination
      const optometristExaminationId = queueEntry.patientVisit?.optometristExamination?.id;

      // Always update both OptometristExamination (if exists) AND PatientQueue
      if (optometristExaminationId) {
        console.log(`🏥 Patient came from optometrist - updating OptometristExamination: ${optometristExaminationId}`);

        // Update the OptometristExamination table to remove review
        await prisma.optometristExamination.update({
          where: { id: optometristExaminationId },
          data: {
            receptionist2Reviewed: false,
            receptionist2ReviewedAt: null,
            receptionist2ReviewedBy: null,
            receptionist2Notes: null,
            updatedAt: new Date()
          }
        });

        console.log(`✅ OptometristExamination review removed`);
      }

      // ALWAYS update PatientQueue table as well for consistency
      console.log(`� Also updating PatientQueue entry for consistency: ${queueEntryId}`);

      // Update PatientQueue dedicated fields to remove review status
      await prisma.patientQueue.update({
        where: { id: queueEntryId },
        data: {
          receptionist2Reviewed: false,
          receptionist2ReviewedAt: null,
          receptionist2ReviewedBy: null,
          receptionist2Notes: null,
          updatedAt: new Date()
        }
      });

      return {
        success: true,
        data: queueEntry
      };

    } catch (error) {
      console.error('❌ Receptionist2Service: Error unmarking ophthalmology patient as reviewed:', error);
      throw new Error(`Failed to unmark patient as reviewed: ${error.message}`);
    }
  }

  /**
   * Get detailed patient information for ophthalmology queue patients
   * @param {string} patientVisitId - Patient visit ID
   * @returns {Promise<Object>} Detailed patient data
   */
  async getOphthalmologyPatientDetails(patientVisitId) {
    try {
      const patientVisit = await prisma.patientVisit.findUnique({
        where: { id: patientVisitId },
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              phone: true,
              email: true,
              address: true,
              allergies: true,
              emergencyContacts: true
            }
          },
          appointment: {
            select: {
              id: true,
              tokenNumber: true,
              appointmentDate: true,
              appointmentTime: true,
              appointmentType: true,
              purpose: true
            }
          },
          optometristExamination: {
            select: {
              id: true,
              completedAt: true,
              examinationData: true,
              preliminaryDiagnosis: true,
              clinicalNotes: true,
              optometrist: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  employeeId: true
                }
              }
            }
          },
          ophthalmologistExamination: {
            select: {
              id: true,
              clinicalImpressions: true,
              assessment: true,
              treatmentPlan: true,
              createdAt: true,
              updatedAt: true,
              doctor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  employeeId: true
                }
              }
            }
          }
        }
      });

      if (!patientVisit) {
        throw new Error('Patient visit not found');
      }

      // Transform the data
      const detailedData = {
        visitId: patientVisit.id,
        visitType: patientVisit.visitType,
        status: patientVisit.status,
        checkedInAt: patientVisit.checkedInAt,

        // Patient details
        patient: {
          id: patientVisit.patient.id,
          patientNumber: patientVisit.patient.patientNumber,
          fullName: `${patientVisit.patient.firstName} ${patientVisit.patient.lastName}`,
          firstName: patientVisit.patient.firstName,
          lastName: patientVisit.patient.lastName,
          dateOfBirth: patientVisit.patient.dateOfBirth,
          gender: patientVisit.patient.gender,
          phone: patientVisit.patient.phone,
          email: patientVisit.patient.email,
          address: patientVisit.patient.address,
          allergies: patientVisit.patient.allergies,
          emergencyContacts: patientVisit.patient.emergencyContacts
        },

        // Appointment details
        appointment: patientVisit.appointment ? {
          id: patientVisit.appointment.id,
          tokenNumber: patientVisit.appointment.tokenNumber,
          appointmentDate: patientVisit.appointment.appointmentDate,
          appointmentTime: patientVisit.appointment.appointmentTime,
          appointmentType: patientVisit.appointment.appointmentType,
          purpose: patientVisit.appointment.purpose
        } : null,

        // Optometrist examination (if exists)
        optometristExamination: patientVisit.optometristExamination ? {
          id: patientVisit.optometristExamination.id,
          completedAt: patientVisit.optometristExamination.completedAt,
          examinationData: patientVisit.optometristExamination.examinationData,
          preliminaryDiagnosis: patientVisit.optometristExamination.preliminaryDiagnosis,
          clinicalNotes: patientVisit.optometristExamination.clinicalNotes,
          optometrist: patientVisit.optometristExamination.optometrist
        } : null,

        // Ophthalmologist examination (if exists)
        ophthalmologistExamination: patientVisit.ophthalmologistExamination ? {
          id: patientVisit.ophthalmologistExamination.id,
          clinicalImpressions: patientVisit.ophthalmologistExamination.clinicalImpressions,
          assessment: patientVisit.ophthalmologistExamination.assessment,
          treatmentPlan: patientVisit.ophthalmologistExamination.treatmentPlan,
          createdAt: patientVisit.ophthalmologistExamination.createdAt,
          updatedAt: patientVisit.ophthalmologistExamination.updatedAt,
          doctor: patientVisit.ophthalmologistExamination.doctor
        } : null
      };

      return {
        success: true,
        data: detailedData
      };

    } catch (error) {
      console.error('❌ Receptionist2Service: Error getting ophthalmology patient details:', error);
      throw new Error(`Failed to get patient details: ${error.message}`);
    }
  }

  /**
   * Get detailed examination data for a specific patient
   * @param {string} examinationId - Optometrist examination ID
   * @returns {Promise<Object>} Detailed examination data
   */
  async getPatientExaminationDetails(examinationId) {
    try {
      const examination = await prisma.optometristExamination.findUnique({
        where: { id: examinationId },
        include: {
          patientVisit: {
            include: {
              patient: {
                select: {
                  id: true,
                  patientNumber: true,
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true,
                  gender: true,
                  phone: true,
                  email: true,
                  address: true,
                  allergies: true,
                  emergencyContacts: true
                }
              },
              appointment: {
                select: {
                  id: true,
                  tokenNumber: true,
                  appointmentDate: true,
                  appointmentTime: true,
                  appointmentType: true,
                  purpose: true
                }
              },
              doctor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  staffType: true,
                  doctorProfile: true
                }
              }
            }
          },
          optometrist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              optometristProfile: true
            }
          }
        }
      });

      if (!examination) {
        throw new Error('Examination not found');
      }

      // Transform detailed examination data
      const detailedData = {
        examinationId: examination.id,
        completedAt: examination.completedAt,
        examinationStatus: examination.examinationStatus,

        // Patient details
        patient: {
          id: examination.patientVisit.patient.id,
          patientNumber: examination.patientVisit.patient.patientNumber,
          fullName: `${examination.patientVisit.patient.firstName} ${examination.patientVisit.patient.lastName}`,
          firstName: examination.patientVisit.patient.firstName,
          lastName: examination.patientVisit.patient.lastName,
          dateOfBirth: examination.patientVisit.patient.dateOfBirth,
          gender: examination.patientVisit.patient.gender,
          phone: examination.patientVisit.patient.phone,
          email: examination.patientVisit.patient.email,
          address: examination.patientVisit.patient.address,
          allergies: examination.patientVisit.patient.allergies,
          emergencyContacts: examination.patientVisit.patient.emergencyContacts
        },

        // Appointment details
        appointment: examination.patientVisit.appointment,

        // Visit details
        visit: {
          id: examination.patientVisit.id,
          visitNumber: examination.patientVisit.visitNumber,
          visitType: examination.patientVisit.visitType,
          status: examination.patientVisit.status,
          checkedInAt: examination.patientVisit.checkedInAt,
          optometristSeenAt: examination.patientVisit.optometristSeenAt
        },

        // Optometrist details
        optometrist: {
          id: examination.optometrist.id,
          name: `${examination.optometrist.firstName} ${examination.optometrist.lastName}`,
          employeeId: examination.optometrist.employeeId,
          profile: examination.optometrist.optometristProfile
        },

        // Doctor details (if assigned)
        doctor: examination.patientVisit.doctor ? {
          id: examination.patientVisit.doctor.id,
          name: `Dr. ${examination.patientVisit.doctor.firstName} ${examination.patientVisit.doctor.lastName}`,
          staffType: examination.patientVisit.doctor.staffType,
          profile: examination.patientVisit.doctor.doctorProfile
        } : null,

        // Complete examination data
        examinationData: {
          visualAcuity: examination.visualAcuity,
          refraction: examination.refraction,
          tonometry: examination.tonometry,
          additionalTests: examination.additionalTests,
          clinicalDetails: examination.clinicalDetails,
          clinicalNotes: examination.clinicalNotes,
          preliminaryDiagnosis: examination.preliminaryDiagnosis,
          assignedDoctor: examination.assignedDoctor,
          additionalOrders: examination.additionalOrders,
          knownAllergies: examination.knownAllergies,
          proceedToDoctor: examination.proceedToDoctor,
          requiresDilation: examination.requiresDilation,

          // Legacy fields for compatibility
          ucvaOD: examination.ucvaOD,
          ucvaOS: examination.ucvaOS,
          bcvaOD: examination.bcvaOD,
          bcvaOS: examination.bcvaOS,
          refractionSphereOD: examination.refractionSphereOD,
          refractionCylinderOD: examination.refractionCylinderOD,
          refractionAxisOD: examination.refractionAxisOD,
          refractionSphereOS: examination.refractionSphereOS,
          refractionCylinderOS: examination.refractionCylinderOS,
          refractionAxisOS: examination.refractionAxisOS,
          iopOD: examination.iopOD,
          iopOS: examination.iopOS,
          iopMethod: examination.iopMethod,
          colorVision: examination.colorVision,
          pupilReaction: examination.pupilReaction,
          eyeAlignment: examination.eyeAlignment,
          anteriorSegment: examination.anteriorSegment,
          additionalNotes: examination.additionalNotes
        }
      };

      console.log(`✅ Retrieved detailed examination data for examination ID: ${examinationId}`);

      return {
        success: true,
        data: detailedData
      };

    } catch (error) {
      console.error('❌ Error getting examination details:', error);
      throw new Error(`Failed to get examination details: ${error.message}`);
    }
  }

  /**
   * Get patients currently in various queues (for receptionist2 queue management)
   * @returns {Promise<Object>} Current queue status across all queues
   */
  async getCurrentQueueStatus() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      console.log(`🔍 Getting queue status for date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

      // Get all active queue entries for today
      const queueEntries = await prisma.patientQueue.findMany({
        where: {
          joinedAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: {
            in: ['WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED']
          }
        },
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          patientVisit: {
            include: {
              appointment: {
                select: {
                  tokenNumber: true,
                  appointmentTime: true
                }
              }
            }
          },
          assignedStaff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffType: true
            }
          }
        },
        orderBy: [
          { queueFor: 'asc' },
          { queueNumber: 'asc' }
        ]
      });

      // Group by queue type
      const queuesByType = queueEntries.reduce((acc, entry) => {
        if (!acc[entry.queueFor]) {
          acc[entry.queueFor] = [];
        }
        acc[entry.queueFor].push({
          queueEntryId: entry.id,
          queueNumber: entry.queueNumber,
          status: entry.status,
          priorityLabel: entry.priorityLabel,
          joinedAt: entry.joinedAt,
          calledAt: entry.calledAt,
          inProgressAt: entry.inProgressAt,
          patient: {
            id: entry.patient.id,
            patientNumber: entry.patient.patientNumber,
            name: `${entry.patient.firstName} ${entry.patient.lastName}`,
            phone: entry.patient.phone
          },
          appointment: {
            tokenNumber: entry.patientVisit.appointment.tokenNumber,
            appointmentTime: entry.patientVisit.appointment.appointmentTime
          },
          assignedStaff: entry.assignedStaff ? {
            id: entry.assignedStaff.id,
            name: `${entry.assignedStaff.firstName} ${entry.assignedStaff.lastName}`,
            staffType: entry.assignedStaff.staffType
          } : null
        });
        return acc;
      }, {});

      // Calculate statistics for each queue
      const queueStatistics = Object.keys(queuesByType).reduce((acc, queueType) => {
        const entries = queuesByType[queueType];
        acc[queueType] = {
          total: entries.length,
          waiting: entries.filter(e => e.status === 'WAITING').length,
          called: entries.filter(e => e.status === 'CALLED').length,
          inProgress: entries.filter(e => e.status === 'IN_PROGRESS').length
        };
        return acc;
      }, {});

      console.log(`✅ Retrieved current queue status for ${Object.keys(queuesByType).length} queue types`);

      return {
        success: true,
        data: {
          queuesByType,
          statistics: queueStatistics,
          totalActivePatients: queueEntries.length,
          retrievedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Error getting current queue status:', error);
      throw new Error(`Failed to get current queue status: ${error.message}`);
    }
  }

  /**
   * Get receptionist2 dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics for receptionist2
   */
  async getDashboardStatistics() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Get various statistics in parallel
      const [
        optometristQueueWaiting,
        optometristQueueInProgress,
        optometristQueueCompleted,
        ophthalmologistQueueWaiting,
        ophthalmologistQueueInProgress,
        ophthalmologistQueueCompleted,
        todayAppointmentsTotal,
        todayAppointmentsCompleted,
        totalOptometristChecked,
        awaitingDoctor,
        withDoctor,
        completedToday,
        currentQueueStatus
      ] = await Promise.all([
        // Optometrist Queue - WAITING
        prisma.patientQueue.count({
          where: {
            queueFor: 'OPTOMETRIST',
            status: 'WAITING',
            joinedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }),
        // Optometrist Queue - IN_PROGRESS
        prisma.patientQueue.count({
          where: {
            queueFor: 'OPTOMETRIST',
            status: 'IN_PROGRESS',
            joinedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }),
        // Optometrist Queue - COMPLETED
        prisma.patientQueue.count({
          where: {
            queueFor: 'OPTOMETRIST',
            status: 'COMPLETED',
            joinedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }),
        // Ophthalmologist Queue - WAITING
        prisma.patientQueue.count({
          where: {
            queueFor: 'OPHTHALMOLOGIST',
            status: 'WAITING',
            joinedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }),
        // Ophthalmologist Queue - IN_PROGRESS
        prisma.patientQueue.count({
          where: {
            queueFor: 'OPHTHALMOLOGIST',
            status: 'IN_PROGRESS',
            joinedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }),
        // Ophthalmologist Queue - COMPLETED
        prisma.patientQueue.count({
          where: {
            queueFor: 'OPHTHALMOLOGIST',
            status: 'COMPLETED',
            joinedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }),
        // Today's appointments total
        prisma.appointment.count({
          where: {
            appointmentDate: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }),
        // Today's appointments completed
        prisma.appointment.count({
          where: {
            appointmentDate: {
              gte: startOfDay,
              lte: endOfDay
            },
            status: 'COMPLETED'
          }
        }),
        // Total patients checked by optometrist today
        prisma.optometristExamination.count({
          where: {
            completedAt: {
              gte: startOfDay,
              lte: endOfDay
            }
          }
        }),

        // Patients awaiting doctor
        prisma.patientVisit.count({
          where: {
            visitDate: {
              gte: startOfDay,
              lte: endOfDay
            },
            status: 'AWAITING_DOCTOR'
          }
        }),

        // Patients currently with doctor
        prisma.patientVisit.count({
          where: {
            visitDate: {
              gte: startOfDay,
              lte: endOfDay
            },
            status: 'WITH_DOCTOR'
          }
        }),

        // Completed visits today
        prisma.patientVisit.count({
          where: {
            visitDate: {
              gte: startOfDay,
              lte: endOfDay
            },
            status: 'COMPLETED'
          }
        }),

        // Current queue status
        this.getCurrentQueueStatus()
      ]);

      // Calculate totals
      const totalOptometristQueue = optometristQueueWaiting + optometristQueueInProgress + optometristQueueCompleted;
      const totalOphthalmologistQueue = ophthalmologistQueueWaiting + ophthalmologistQueueInProgress + ophthalmologistQueueCompleted;
      const totalInQueue = totalOptometristQueue + totalOphthalmologistQueue;

      const dashboardStats = {
        // New queue stats
        queueStats: {
          optometrist: {
            waiting: optometristQueueWaiting,
            inProgress: optometristQueueInProgress,
            completed: optometristQueueCompleted,
            total: totalOptometristQueue
          },
          ophthalmologist: {
            waiting: ophthalmologistQueueWaiting,
            inProgress: ophthalmologistQueueInProgress,
            completed: ophthalmologistQueueCompleted,
            total: totalOphthalmologistQueue
          },
          totalInQueue: totalInQueue,
          totalCompleted: optometristQueueCompleted + ophthalmologistQueueCompleted
        },
        // Appointment stats
        appointmentStats: {
          total: todayAppointmentsTotal,
          completed: todayAppointmentsCompleted,
          pending: todayAppointmentsTotal - todayAppointmentsCompleted
        },
        // Legacy stats
        todayStats: {
          totalOptometristChecked,
          awaitingDoctor,
          withDoctor,
          completedToday
        },
        currentQueues: currentQueueStatus.data,
        lastUpdated: new Date()
      };

      console.log(`✅ Generated receptionist2 dashboard statistics`);

      return {
        success: true,
        data: dashboardStats
      };

    } catch (error) {
      console.error('❌ Error getting dashboard statistics:', error);
      throw new Error(`Failed to get dashboard statistics: ${error.message}`);
    }
  }

  /**
   * Mark patient as reviewed by receptionist2
   * @param {string} examinationId - Optometrist examination ID
   * @param {string} receptionist2Id - Staff ID of receptionist2
   * @param {string} notes - Optional notes from receptionist2
   * @returns {Promise<Object>} Updated examination record
   */
  async markPatientAsReviewed(examinationId, receptionist2Id, notes = null) {
    try {

      const updatedExamination = await prisma.optometristExamination.update({
        where: { id: examinationId },
        data: {
          receptionist2Reviewed: true,
          receptionist2ReviewedAt: new Date(),
          receptionist2ReviewedBy: receptionist2Id,
          receptionist2Notes: notes,
          updatedAt: new Date()
        },
        include: {
          patientVisit: {
            include: {
              patient: {
                select: {
                  id: true,
                  patientNumber: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      console.log(`✅ Patient marked as present: ${updatedExamination.patientVisit.patient.firstName} ${updatedExamination.patientVisit.patient.lastName}`);

      return {
        success: true,
        data: updatedExamination,
        message: 'Patient marked as present successfully'
      };

    } catch (error) {
      console.error('❌ Error marking patient as present:', error);
      throw new Error(`Failed to mark patient as present: ${error.message}`);
    }
  }

  /**
   * Unmark patient as reviewed by receptionist2 (if needed)
   * @param {string} examinationId - Optometrist examination ID
   * @returns {Promise<Object>} Updated examination record
   */
  async unmarkPatientAsReviewed(examinationId) {
    try {
      console.log(`🏷️ Unmarking patient as present: ${examinationId}`);

      const updatedExamination = await prisma.optometristExamination.update({
        where: { id: examinationId },
        data: {
          receptionist2Reviewed: false,
          receptionist2ReviewedAt: null,
          receptionist2ReviewedBy: null,
          receptionist2Notes: null,
          updatedAt: new Date()
        }
      });

      console.log(`✅ Patient unmarked as present: ${examinationId}`);

      return {
        success: true,
        data: updatedExamination,
        message: 'Patient marked as absent successfully'
      };

    } catch (error) {
      console.error('❌ Error marking patient as absent:', error);
      throw new Error(`Failed to mark patient as absent: ${error.message}`);
    }
  }

  /**
   * Get current optometrist queue specifically for receptionist2 view
   * @returns {Promise<Object>} Current optometrist queue with detailed patient info
   */
  async getOptometristQueue() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      console.log(`🔍 Receptionist2: Getting optometrist queue for today`);

      // Get all patients in OPTOMETRIST queue for today
      const queueEntries = await prisma.patientQueue.findMany({
        where: {
          queueFor: 'OPTOMETRIST',
          joinedAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              middleName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              phone: true,
              email: true
            }
          },
          patientVisit: {
            include: {
              appointment: {
                select: {
                  id: true,
                  tokenNumber: true,
                  appointmentTime: true,
                  appointmentType: true,
                  purpose: true
                }
              },
              doctor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          assignedStaff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffType: true
            }
          }
        },
        orderBy: [
          { queueNumber: 'asc' }
        ]
      });

      // Calculate statistics
      const totalPatients = queueEntries.length;
      const waitingPatients = queueEntries.filter(q => q.status === 'WAITING').length;
      const inProgressPatients = queueEntries.filter(q => q.status === 'IN_PROGRESS').length;
      const completedPatients = queueEntries.filter(q => q.status === 'COMPLETED').length;
      const calledPatients = queueEntries.filter(q => q.status === 'CALLED').length;

      // Transform queue entries for frontend
      const transformedQueue = queueEntries.map(entry => ({
        queueEntryId: entry.id,
        queueNumber: entry.queueNumber,
        priorityLabel: entry.priorityLabel,
        status: entry.status,
        estimatedWaitTime: entry.estimatedWaitTime,
        joinedAt: entry.joinedAt,
        calledAt: entry.calledAt,
        inProgressAt: entry.inProgressAt,
        completedAt: entry.completedAt,
        notes: entry.notes,
        patient: {
          id: entry.patient.id,
          patientNumber: entry.patient.patientNumber,
          fullName: `${entry.patient.firstName} ${entry.patient.middleName ? entry.patient.middleName + ' ' : ''}${entry.patient.lastName}`,
          firstName: entry.patient.firstName,
          middleName: entry.patient.middleName,
          lastName: entry.patient.lastName,
          dateOfBirth: entry.patient.dateOfBirth,
          gender: entry.patient.gender,
          phone: entry.patient.phone,
          email: entry.patient.email
        },
        appointment: {
          id: entry.patientVisit.appointment.id,
          tokenNumber: entry.patientVisit.appointment.tokenNumber,
          appointmentTime: entry.patientVisit.appointment.appointmentTime,
          appointmentType: entry.patientVisit.appointment.appointmentType,
          purpose: entry.patientVisit.appointment.purpose
        },
        visit: {
          id: entry.patientVisit.id,
          visitNumber: entry.patientVisit.visitNumber,
          visitType: entry.patientVisit.visitType,
          status: entry.patientVisit.status,
          checkedInAt: entry.patientVisit.checkedInAt
        },
        doctor: entry.patientVisit.doctor ? {
          id: entry.patientVisit.doctor.id,
          name: `Dr. ${entry.patientVisit.doctor.firstName} ${entry.patientVisit.doctor.lastName}`,
          firstName: entry.patientVisit.doctor.firstName,
          lastName: entry.patientVisit.doctor.lastName
        } : null,
        assignedStaff: entry.assignedStaff ? {
          id: entry.assignedStaff.id,
          name: `${entry.assignedStaff.firstName} ${entry.assignedStaff.lastName}`,
          staffType: entry.assignedStaff.staffType
        } : null
      }));

      console.log(`✅ Receptionist2: Retrieved ${totalPatients} patients from optometrist queue`);

      return {
        success: true,
        data: {
          queueFor: 'OPTOMETRIST',
          statistics: {
            totalPatients,
            waitingPatients,
            calledPatients,
            inProgressPatients,
            completedPatients
          },
          queueEntries: transformedQueue,
          retrievedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Receptionist2: Error getting optometrist queue:', error);
      throw new Error(`Failed to get optometrist queue: ${error.message}`);
    }
  }
  /**
   * Get ophthalmology queue patients
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Ophthalmology queue data
   */
  async getOphthalmologyQueue(filters = {}) {
    try {
      const { date, status, patientName } = filters;

      // Set up date filter
      let dateFilter = {};
      if (date) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        dateFilter = {
          joinedAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        };
      } else {
        // Default to today
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        dateFilter = {
          joinedAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        };
      }

      // Build where clause
      const whereClause = {
        queueFor: 'OPHTHALMOLOGIST',
        ...dateFilter
      };

      if (status && status !== 'all') {
        whereClause.status = status.toUpperCase();
      }

      // Get ophthalmology queue entries
      const queueEntries = await prisma.patientQueue.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              middleName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              phone: true,
              email: true
            }
          },
          patientVisit: {
            include: {
              appointment: {
                select: {
                  id: true,
                  tokenNumber: true,
                  appointmentTime: true,
                  appointmentType: true,
                  purpose: true
                }
              },
              // Check if patient came from optometrist
              optometristExamination: {
                select: {
                  id: true,
                  completedAt: true,
                  assignedDoctor: true,
                  receptionist2Reviewed: true,
                  receptionist2ReviewedAt: true,
                  receptionist2ReviewedBy: true,
                  receptionist2Notes: true
                }
              }
            }
          }
        },
        orderBy: [
          { queueNumber: 'asc' }
        ]
      });

      // Filter by patient name if provided
      let filteredEntries = queueEntries;
      if (patientName) {
        const searchTerm = patientName.toLowerCase();
        filteredEntries = queueEntries.filter(entry => {
          const fullName = `${entry.patient.firstName} ${entry.patient.middleName ? entry.patient.middleName + ' ' : ''}${entry.patient.lastName}`.toLowerCase();
          return fullName.includes(searchTerm) ||
            entry.patient.patientNumber.toString().includes(searchTerm);
        });
      }

      // Transform queue entries for frontend
      const transformedQueue = filteredEntries.map(entry => {
        const transformed = {
          queueEntryId: entry.id,
          queueNumber: entry.queueNumber,
          priorityLabel: entry.priorityLabel, // Read directly from database
          status: entry.status,
          joinedAt: entry.joinedAt,
          calledAt: entry.calledAt,
          inProgressAt: entry.inProgressAt,
          completedAt: entry.completedAt,
          notes: entry.notes,

          // Patient information
          patient: {
            id: entry.patient.id,
            patientNumber: entry.patient.patientNumber,
            fullName: `${entry.patient.firstName} ${entry.patient.middleName ? entry.patient.middleName + ' ' : ''}${entry.patient.lastName}`,
            firstName: entry.patient.firstName,
            middleName: entry.patient.middleName,
            lastName: entry.patient.lastName,
          dateOfBirth: entry.patient.dateOfBirth,
          gender: entry.patient.gender,
          phone: entry.patient.phone,
          email: entry.patient.email
        },

        // Appointment information
        appointment: {
          id: entry.patientVisit.appointment.id,
          tokenNumber: entry.patientVisit.appointment.tokenNumber,
          appointmentTime: entry.patientVisit.appointment.appointmentTime,
          appointmentType: entry.patientVisit.appointment.appointmentType,
          purpose: entry.patientVisit.appointment.purpose
        },

        // Visit information
        visit: {
          id: entry.patientVisit.id,
          visitType: entry.patientVisit.visitType,
          status: entry.patientVisit.status,
          checkedInAt: entry.patientVisit.checkedInAt
        },

        // Examination information
        examinationId: entry.patientVisit.optometristExamination?.id || null,
        examinationType: entry.patientVisit.optometristExamination?.id ? 'optometrist' : null,

        // Source information (came from optometrist or direct emergency)
        sourceInfo: {
          cameFromOptometrist: !!entry.patientVisit.optometristExamination?.id,
          isEmergencyDirect: !entry.patientVisit.optometristExamination?.id,
          optometristCompletedAt: entry.patientVisit.optometristExamination?.completedAt,
          assignedDoctor: entry.patientVisit.optometristExamination?.assignedDoctor
        },

        // Receptionist2 review information - use dedicated PatientQueue fields as primary source
        receptionist2Review: {
          reviewed: entry.receptionist2Reviewed || false,
          reviewedAt: entry.receptionist2ReviewedAt,
          reviewedBy: entry.receptionist2ReviewedBy,
          notes: entry.receptionist2Notes
        }
      };
      
      return transformed;
      });

      // Calculate statistics
      const totalPatients = transformedQueue.length;
      const waitingPatients = transformedQueue.filter(p => p.status === 'WAITING').length;
      const calledPatients = transformedQueue.filter(p => p.status === 'CALLED').length;
      const inProgressPatients = transformedQueue.filter(p => p.status === 'IN_PROGRESS').length;
      const completedPatients = transformedQueue.filter(p => p.status === 'COMPLETED').length;
      const fromOptometrist = transformedQueue.filter(p => p.sourceInfo.cameFromOptometrist).length;
      const emergencyDirect = transformedQueue.filter(p => p.sourceInfo.isEmergencyDirect).length;

      return {
        success: true,
        data: {
          queueFor: 'OPHTHALMOLOGIST',
          statistics: {
            totalPatients,
            waitingPatients,
            calledPatients,
            inProgressPatients,
            completedPatients,
            fromOptometrist,
            emergencyDirect
          },
          patients: transformedQueue,
          retrievedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Receptionist2Service: Error getting ophthalmology queue:', error);
      throw new Error(`Failed to get ophthalmology queue: ${error.message}`);
    }
  }

  /**
   * Get doctor-specific ophthalmology queues
   * Groups patients by their assigned doctor based on assignedStaffId
   * @param {Object} filters - Optional filters for date, etc.
   * @returns {Promise<Object>} List of doctors with their assigned patients
   */
  async getDoctorSpecificQueues(filters = {}) {
    try {
      const { date } = filters;

      // Set up date filter
      let dateFilter = {};
      if (date) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        dateFilter = {
          joinedAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        };
      } else {
        // Default to today
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        dateFilter = {
          joinedAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        };
      }

      // Get ophthalmology queue entries with assigned doctors
      const queueEntries = await prisma.patientQueue.findMany({
        where: {
          queueFor: 'OPHTHALMOLOGIST',
          assignedStaffId: { not: null }, // Only get patients assigned to doctors
          ...dateFilter
        },
        select: {
          id: true,
          queueNumber: true,
          doctorQueuePosition: true,
          priorityLabel: true,
          status: true,
          joinedAt: true,
          calledAt: true,
          inProgressAt: true,
          completedAt: true,
          notes: true,
          assignedStaffId: true,
          receptionist2Reviewed: true,
          receptionist2ReviewedAt: true,
          receptionist2ReviewedBy: true,
          receptionist2Notes: true,
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              middleName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              phone: true,
              email: true
            }
          },
          assignedStaff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffType: true,
              doctorProfile: true
            }
          },
          patientVisit: {
            select: {
              id: true,
              visitType: true,
              status: true,
              checkedInAt: true,
              appointment: {
                select: {
                  id: true,
                  tokenNumber: true,
                  appointmentTime: true,
                  appointmentType: true,
                  purpose: true
                }
              },
              // Include optometrist examination info
              optometristExamination: {
                select: {
                  id: true,
                  completedAt: true,
                  assignedDoctor: true
                }
              }
            }
          }
        },
        orderBy: [
          { doctorQueuePosition: 'asc' }
        ]
      });

      // Group patients by doctor
      const doctorQueues = {};
      
      queueEntries.forEach(entry => {
        const doctorId = entry.assignedStaffId;
        
        if (!doctorQueues[doctorId]) {
          doctorQueues[doctorId] = {
            doctor: {
              id: entry.assignedStaff.id,
              firstName: entry.assignedStaff.firstName,
              lastName: entry.assignedStaff.lastName,
              fullName: `Dr. ${entry.assignedStaff.firstName} ${entry.assignedStaff.lastName}`,
              staffType: entry.assignedStaff.staffType,
              specialization: entry.assignedStaff.doctorProfile?.specialization || null
            },
            patients: [],
            statistics: {
              totalPatients: 0,
              waitingPatients: 0,
              calledPatients: 0,
              inProgressPatients: 0,
              completedPatients: 0
            }
          };
        }

        // Transform patient data
        const patientData = {
          queueEntryId: entry.id,
          queueNumber: entry.queueNumber,
          doctorQueuePosition: entry.doctorQueuePosition,
          priorityLabel: entry.priorityLabel,
          status: entry.status,
          joinedAt: entry.joinedAt,
          calledAt: entry.calledAt,
          inProgressAt: entry.inProgressAt,
          completedAt: entry.completedAt,
          notes: entry.notes,

          // Receptionist2 Review Information
          receptionist2Review: {
            reviewed: entry.receptionist2Reviewed || false,
            reviewedAt: entry.receptionist2ReviewedAt,
            reviewedBy: entry.receptionist2ReviewedBy,
            notes: entry.receptionist2Notes
          },

          // Patient information
          patient: {
            id: entry.patient.id,
            patientNumber: entry.patient.patientNumber,
            fullName: `${entry.patient.firstName} ${entry.patient.middleName ? entry.patient.middleName + ' ' : ''}${entry.patient.lastName}`,
            firstName: entry.patient.firstName,
            middleName: entry.patient.middleName,
            lastName: entry.patient.lastName,
            dateOfBirth: entry.patient.dateOfBirth,
            gender: entry.patient.gender,
            phone: entry.patient.phone,
            email: entry.patient.email
          },

          // Appointment information
          appointment: entry.patientVisit?.appointment ? {
            id: entry.patientVisit.appointment.id,
            tokenNumber: entry.patientVisit.appointment.tokenNumber,
            appointmentTime: entry.patientVisit.appointment.appointmentTime,
            appointmentType: entry.patientVisit.appointment.appointmentType,
            purpose: entry.patientVisit.appointment.purpose
          } : null,

          // Visit information
          visit: entry.patientVisit ? {
            id: entry.patientVisit.id,
            visitType: entry.patientVisit.visitType,
            status: entry.patientVisit.status,
            checkedInAt: entry.patientVisit.checkedInAt
          } : null,

          // Examination information
          examinationId: entry.patientVisit?.optometristExamination?.id || null,
          examinationType: entry.patientVisit?.optometristExamination?.id ? 'optometrist' : null,

          // Source information (came from optometrist or direct emergency)
          sourceInfo: {
            cameFromOptometrist: !!entry.patientVisit?.optometristExamination?.id,
            isEmergencyDirect: !entry.patientVisit?.optometristExamination?.id,
            optometristCompletedAt: entry.patientVisit?.optometristExamination?.completedAt,
            assignedDoctor: entry.patientVisit?.optometristExamination?.assignedDoctor
          }
        };

        doctorQueues[doctorId].patients.push(patientData);
        doctorQueues[doctorId].statistics.totalPatients++;
        
        // Update statistics based on status
        switch (entry.status) {
          case 'WAITING':
            doctorQueues[doctorId].statistics.waitingPatients++;
            break;
          case 'CALLED':
            doctorQueues[doctorId].statistics.calledPatients++;
            break;
          case 'IN_PROGRESS':
            doctorQueues[doctorId].statistics.inProgressPatients++;
            break;
          case 'COMPLETED':
            doctorQueues[doctorId].statistics.completedPatients++;
            break;
        }
      });

      // Convert to array
      const doctorQueuesArray = Object.values(doctorQueues);

      // Calculate overall statistics for all ophthalmologist patients (regardless of doctor assignment)
      const allOphthalmologistPatients = await prisma.patientQueue.findMany({
        where: {
          queueFor: 'OPHTHALMOLOGIST',
          ...dateFilter
        },
        select: {
          status: true,
          receptionist2Reviewed: true
        }
      });

      const overallStatistics = {
        totalPatients: allOphthalmologistPatients.length,
        waitingPatients: allOphthalmologistPatients.filter(p => p.status === 'WAITING').length,
        inProgressPatients: allOphthalmologistPatients.filter(p => p.status === 'IN_PROGRESS').length,
        onHoldPatients: allOphthalmologistPatients.filter(p => p.status === 'ON_HOLD').length,
        presentPatients: allOphthalmologistPatients.filter(p => p.receptionist2Reviewed === true).length,
        completedPatients: allOphthalmologistPatients.filter(p => p.status === 'COMPLETED').length
      };

      return {
        success: true,
        data: {
          queueFor: 'OPHTHALMOLOGIST',
          totalDoctors: doctorQueuesArray.length,
          overallStatistics,
          doctorQueues: doctorQueuesArray,
          retrievedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Receptionist2Service: Error getting doctor-specific queues:', error);
      throw new Error(`Failed to get doctor-specific queues: ${error.message}`);
    }
  }

  /**
   * Assign a patient to an ophthalmologist
   * @param {string} queueEntryId - Queue entry ID
   * @param {string} ophthalmologistId - Ophthalmologist staff ID
   * @param {string} receptionist2Id - Receptionist2 staff ID who is making the assignment
   * @returns {Promise<Object>} Assignment result
   */
  async assignPatientToOphthalmologist(queueEntryId, ophthalmologistId, receptionist2Id) {
    try {
      console.log('👨‍⚕️ Assigning patient to ophthalmologist:', {
        queueEntryId,
        ophthalmologistId,
        receptionist2Id
      });

      return await prisma.$transaction(async (tx) => {
        // Verify the ophthalmologist exists and is active
        const ophthalmologist = await tx.staff.findUnique({
          where: {
            id: ophthalmologistId,
            staffType: 'ophthalmologist',
            isActive: true,
            employmentStatus: 'active'
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffType: true
          }
        });

        if (!ophthalmologist) {
          throw new Error('Ophthalmologist not found or not active');
        }

        // Get current queue entry to check for reassignment
        const currentQueueEntry = await tx.patientQueue.findUnique({
          where: { id: queueEntryId },
          include: {
            assignedStaff: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        });

        if (!currentQueueEntry) {
          throw new Error('Queue entry not found');
        }

        // Check if reassigning from another doctor
        const previousDoctorId = currentQueueEntry.assignedStaffId;
        const previousPosition = currentQueueEntry.doctorQueuePosition;

        if (previousDoctorId && previousDoctorId !== ophthalmologistId) {
          console.log(`🔄 Reassigning patient from Dr. ${currentQueueEntry.assignedStaff?.firstName || 'Unknown'} to new doctor`);
          
          // Shift down all patients in the previous doctor's queue who were after this patient
          if (previousPosition) {
            await tx.patientQueue.updateMany({
              where: {
                assignedStaffId: previousDoctorId,
                doctorQueuePosition: { gt: previousPosition }
              },
              data: {
                doctorQueuePosition: { decrement: 1 }
              }
            });
            console.log(`✅ Shifted down patients in previous doctor's queue after position ${previousPosition}`);
          }
        }

        // Calculate the next queue position for this doctor
        const existingQueueEntries = await tx.patientQueue.findMany({
          where: {
            assignedStaffId: ophthalmologistId,
            doctorQueuePosition: { not: null }
          },
          select: {
            doctorQueuePosition: true
          }
        });

        // Find the maximum queue position and add 1
        const maxPosition = existingQueueEntries.reduce((max, entry) => {
          return entry.doctorQueuePosition > max ? entry.doctorQueuePosition : max;
        }, 0);

        const nextQueuePosition = maxPosition + 1;

        console.log(`📍 Calculated queue position for doctor ${ophthalmologistId}: ${nextQueuePosition} (max was ${maxPosition})`);

        // Update the queue entry to assign the patient with queue position
        const updatedQueueEntry = await tx.patientQueue.update({
          where: {
            id: queueEntryId,
            queueFor: 'OPHTHALMOLOGIST'
          },
          data: {
            assignedStaffId: ophthalmologistId,
            doctorQueuePosition: nextQueuePosition,
            notes: `Assigned to Dr. ${ophthalmologist.firstName} ${ophthalmologist.lastName} by receptionist2`,
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
            patientVisit: {
              select: {
                patient: {
                  select: {
                    firstName: true,
                    lastName: true,
                    patientNumber: true
                  }
                }
              }
            }
          }
        });

        const patient = updatedQueueEntry.patient || updatedQueueEntry.patientVisit?.patient;

        console.log(`✅ Patient ${patient?.firstName} ${patient?.lastName} assigned to Dr. ${ophthalmologist.firstName} ${ophthalmologist.lastName}`);

        return {
          success: true,
          message: `Patient assigned to Dr. ${ophthalmologist.firstName} ${ophthalmologist.lastName} successfully`,
          data: {
            queueEntryId,
            patient: {
              name: `${patient?.firstName} ${patient?.lastName}`,
              patientNumber: patient?.patientNumber
            },
            assignedTo: {
              id: ophthalmologist.id,
              name: `Dr. ${ophthalmologist.firstName} ${ophthalmologist.lastName}`,
              staffType: ophthalmologist.staffType
            },
            assignedBy: receptionist2Id,
            assignedAt: new Date().toISOString()
          }
        };
      });

    } catch (error) {
      console.error('❌ Error assigning patient to ophthalmologist:', error);
      throw new Error(`Failed to assign patient: ${error.message}`);
    }
  }

  /**
   * Get patients on hold waiting for eye drops
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} ON_HOLD patients data
   */
  async getOnHoldPatients(filters = {}) {
    try {
      const { date } = filters;

      console.log('⏸️ Receptionist2Service: Getting ON_HOLD patients');

      // Set up date filter
      let dateFilter = {};
      if (date) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        dateFilter = {
          onHoldAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        };
      } else {
        // Default to today
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        dateFilter = {
          onHoldAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        };
      }

      // Get ON_HOLD patients from ophthalmologist queue (include ALL on hold patients)
      const onHoldPatients = await prisma.patientQueue.findMany({
        where: {
          queueFor: 'OPHTHALMOLOGIST',
          status: 'ON_HOLD',
          ...dateFilter
        },
        include: {
          patient: {
            select: {
              id: true,
              patientNumber: true,
              firstName: true,
              middleName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              phone: true
            }
          },
          assignedStaff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true
            }
          },
          patientVisit: {
            select: {
              id: true,
              visitType: true,
              appointment: {
                select: {
                  tokenNumber: true,
                  appointmentTime: true
                }
              }
            }
          }
        },
        orderBy: [
          { onHoldAt: 'asc' } // Oldest first
        ]
      });

      // Transform data for frontend
      const transformedPatients = onHoldPatients.map(entry => {
        const waitingSince = entry.onHoldAt ? 
          Math.floor((new Date() - new Date(entry.onHoldAt)) / (1000 * 60)) : 0;
        
        const hasTimer = !!entry.estimatedResumeTime;
        const timeRemaining = hasTimer ? 
          Math.max(0, Math.floor((new Date(entry.estimatedResumeTime) - new Date()) / (1000 * 60))) : null;

        return {
          queueEntryId: entry.id,
          queueNumber: entry.queueNumber,
          status: entry.status,
          onHoldAt: entry.onHoldAt,
          estimatedResumeTime: entry.estimatedResumeTime,
          holdReason: entry.holdReason,
          
          // Patient information
          patient: {
            id: entry.patient.id,
            patientNumber: entry.patient.patientNumber,
            fullName: `${entry.patient.firstName} ${entry.patient.middleName ? entry.patient.middleName + ' ' : ''}${entry.patient.lastName}`,
            firstName: entry.patient.firstName,
            middleName: entry.patient.middleName,
            lastName: entry.patient.lastName,
            age: entry.patient.dateOfBirth ? 
              Math.floor((new Date() - new Date(entry.patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
            gender: entry.patient.gender,
            phone: entry.patient.phone
          },

          // Doctor information
          assignedDoctor: entry.assignedStaff ? {
            id: entry.assignedStaff.id,
            name: `Dr. ${entry.assignedStaff.firstName} ${entry.assignedStaff.lastName}`,
            employeeId: entry.assignedStaff.employeeId
          } : null,

          // Visit information
          visit: {
            visitType: entry.patientVisit?.visitType,
            tokenNumber: entry.patientVisit?.appointment?.tokenNumber,
            appointmentTime: entry.patientVisit?.appointment?.appointmentTime
          },

          // Timing information
          timing: {
            waitingSinceMinutes: waitingSince,
            hasTimer,
            timeRemainingMinutes: timeRemaining,
            dropsApplied: hasTimer,
            needsDrops: !hasTimer,
            dilationRound: entry.dilationRound || 0,
            markedReady: entry.markedReadyForResume || false
          }
        };
      });

      // Calculate statistics based on user requirements
      const totalOnHold = transformedPatients.length;
      
      // 1. Ready - Patients marked ready by receptionist2 (markedReadyForResume = true)
      const readyToResume = transformedPatients.filter(p => p.timing.markedReady).length;
      
      // 2. Waiting - Patients sent by doctor but not yet processed (not marked ready and no drops applied)
      const waitingForDilation = transformedPatients.filter(p => 
        !p.timing.markedReady && !p.timing.dropsApplied
      ).length;
      
      // 3. Need Drops - Patients with eye drop related reasons in holdReason
      const needingDrops = transformedPatients.filter(p => {
        const holdReason = p.holdReason?.toLowerCase() || '';
        const hasEyeDropReason = holdReason.includes('eye drop') || 
                                holdReason.includes('dilation') ||
                                holdReason.includes('pupil') ||
                                holdReason.includes('mydriatic') ||
                                holdReason.includes('drop');
        return hasEyeDropReason && !p.timing.markedReady;
      }).length;

      console.log(`✅ Retrieved ${totalOnHold} ON_HOLD patients`);
      console.log(`📊 Breakdown: ${readyToResume} marked ready, ${waitingForDilation} waiting for processing, ${needingDrops} need eye drops`);

      return {
        success: true,
        data: {
          patients: transformedPatients,
          statistics: {
            totalOnHold,
            needingDrops,
            waitingForDilation,
            readyToResume
          },
          retrievedAt: new Date()
        }
      };

    } catch (error) {
      console.error('❌ Receptionist2Service: Error getting ON_HOLD patients:', error);
      throw new Error(`Failed to get ON_HOLD patients: ${error.message}`);
    }
  }

  /**
   * Get list of available ophthalmologists for assignment
   * @returns {Promise<Object>} List of active ophthalmologists
   */
  async getAvailableOphthalmologists() {
    try {
      console.log('👨‍⚕️ Fetching available ophthalmologists...');

      const ophthalmologists = await prisma.staff.findMany({
        where: {
          staffType: 'ophthalmologist',
          isActive: true,
          employmentStatus: 'active'
        },
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          department: true,
          specialization: true
        },
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      });

      console.log(`✅ Found ${ophthalmologists.length} available ophthalmologists`);

      return {
        success: true,
        data: {
          ophthalmologists: ophthalmologists.map(doc => ({
            id: doc.id,
            employeeId: doc.employeeId,
            name: `Dr. ${doc.firstName} ${doc.lastName}`,
            firstName: doc.firstName,
            lastName: doc.lastName,
            email: doc.email,
            phone: doc.phone,
            department: doc.department,
            specialization: doc.specialization
          })),
          count: ophthalmologists.length
        }
      };

    } catch (error) {
      console.error('❌ Error fetching available ophthalmologists:', error);
      throw new Error(`Failed to fetch ophthalmologists: ${error.message}`);
    }
  }
}

module.exports = new Receptionist2Service();