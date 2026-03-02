// src/controllers/ipdController.js
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const prisma = new PrismaClient();

class IpdController {
  // =================
  // IPD ADMISSION METHODS
  // =================

  async createIpdAdmission(req, res) {
    try {
      const {
        patientId,
        surgeryType,
        surgeryDate,
        surgeonId,
        expectedDischarge,
        notes
      } = req.body;

      // Validate required fields
      if (!patientId || !surgeryType) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID and surgery type are required',
          required: ['patientId', 'surgeryType']
        });
      }

      // Check if patient exists
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Check if patient already has active IPD admission
      const existingAdmission = await prisma.ipdAdmission.findFirst({
        where: {
          patientId,
          status: {
            in: ['ADMITTED', 'SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT', 'SURGERY_DAY', 'POST_OP', 'RECOVERY']
          }
        }
      });

      if (existingAdmission) {
        return res.status(409).json({
          success: false,
          message: 'Patient already has an active IPD admission',
          existingAdmission: existingAdmission.admissionNumber
        });
      }

      // Generate unique admission number
      const admissionNumber = `IPD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Create IPD admission
      const admission = await prisma.ipdAdmission.create({
        data: {
          admissionNumber,
          patientId,
          admittedBy: req.user.id,
          admissionDate: new Date(),
          surgeryType,
          surgeryDate: surgeryDate ? new Date(surgeryDate) : null,
          surgeonId: surgeonId || null,
          expectedDischarge: expectedDischarge ? new Date(expectedDischarge) : null,
          status: 'ADMITTED'
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true,
              phone: true,
              email: true
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
              firstName: true,
              lastName: true,
              staffType: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'IPD admission created successfully',
        data: admission
      });

    } catch (error) {
      console.error('Create IPD admission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create IPD admission',
        error: error.message
      });
    }
  }

  async getIpdAdmissions(req, res) {
    try {
      const {
        status,
        surgeryType,
        surgeonId,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 20,
        offset = 0
      } = req.query;

      console.log('🔍 IPD Admissions Query Parameters:', {
        status,
        surgeryType,
        surgeonId,
        search,
        page,
        limit
      });

      const where = {};

      // Apply filters
      if (status) {
        where.status = status;
      }
      if (surgeryType) {
        where.surgeryType = surgeryType;
      }
      if (surgeonId) {
        where.surgeonId = surgeonId;
      }
      if (startDate || endDate) {
        where.admissionDate = {};
        if (startDate) where.admissionDate.gte = new Date(startDate);
        if (endDate) where.admissionDate.lte = new Date(endDate);
      }

      // Add search functionality for patient name/MRN
      if (search) {
        where.OR = [
          {
            patient: {
              firstName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          },
          {
            patient: {
              lastName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          },
          {
            patient: {
              patientNumber: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        ];
      }

      // Calculate offset from page if provided
      const actualOffset = page && page > 1 ? (parseInt(page) - 1) * parseInt(limit) : parseInt(offset);

      console.log('🗂️ Database Query WHERE clause:', JSON.stringify(where, null, 2));
      console.log('📄 Pagination:', { actualOffset, limit: parseInt(limit) });

      const [admissions, totalCount] = await Promise.all([
        prisma.ipdAdmission.findMany({
          where,
          skip: actualOffset,
          take: parseInt(limit),
          orderBy: { admissionDate: 'desc' },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                patientNumber: true,
                phone: true,
                dateOfBirth: true,
                gender: true
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
                employeeId: true,
                staffType: true
              }
            },
            sister: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                staffType: true
              }
            },
            anesthesiologist: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                staffType: true
              }
            },
            surgeryTypeDetail: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                investigationIds: true
              }
            },
            lens: {
              select: {
                id: true,
                lensName: true,
                lensCode: true,
                manufacturer: true,
                model: true,
                lensType: true,
                lensCategory: true,
                material: true,
                power: true,
                patientCost: true,
                lensoCost: true,
                features: true,
                benefits: true,
                stockQuantity: true,
                isAvailable: true
              }
            },
            fitnessReports: {
              select: {
                id: true,
                fitnessStatus: true,
                assessmentDate: true
              },
              orderBy: { assessmentDate: 'desc' },
              take: 1
            },
            preOpAssessments: {
              select: {
                id: true,
                assessmentDate: true
              },
              orderBy: { assessmentDate: 'desc' },
              take: 1
            },
            surgeryMetrics: {
              select: {
                id: true,
                surgeryStartTime: true,
                surgeryEndTime: true
              },
              orderBy: { surgeryStartTime: 'desc' },
              take: 1
            }
          }
        }),
        prisma.ipdAdmission.count({ where })
      ]);

      console.log('📊 Query Results:', {
        admissionsCount: admissions.length,
        totalCount,
        sampleAdmission: admissions[0] ? {
          id: admissions[0].id,
          status: admissions[0].status,
          patientName: `${admissions[0].patient?.firstName} ${admissions[0].patient?.lastName}`,
          surgeryType: admissions[0].surgeryTypeDetail?.name,
          lensId: admissions[0].lensId,
          surgeryPackageId: admissions[0].surgeryPackageId
        } : null
      });

      // Fetch surgery package details for admissions that have surgeryPackageId
      const surgeryPackageIds = admissions
        .filter(admission => admission.surgeryPackageId)
        .map(admission => admission.surgeryPackageId);

      let surgeryPackagesMap = new Map();
      if (surgeryPackageIds.length > 0) {
        console.log('🔍 Fetching surgery packages for IDs:', surgeryPackageIds);
        try {
          const surgeryPackages = await prisma.surgeryPackage.findMany({
            where: {
              id: { in: surgeryPackageIds }
            },
            select: {
              id: true,
              packageName: true,
              description: true,
              packageCost: true,
              surgeryTypeId: true,
              isActive: true,
              surgeryCategory: true
            }
          });

          surgeryPackages.forEach(pkg => {
            surgeryPackagesMap.set(pkg.id, pkg);
          });
          console.log('📦 Surgery packages fetched:', surgeryPackages.length);
        } catch (error) {
          console.warn('⚠️ Could not fetch surgery packages:', error);
        }
      }

      // Transform the data to match frontend expectations
      const transformedAdmissions = admissions.map(admission => {
        // Calculate age from date of birth
        const calculateAge = (dateOfBirth) => {
          if (!dateOfBirth) return null;
          const today = new Date();
          const birthDate = new Date(dateOfBirth);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age;
        };

        // Get surgery package details if surgeryPackageId exists
        const surgeryPackageDetail = admission.surgeryPackageId ?
          surgeryPackagesMap.get(admission.surgeryPackageId) : null;

        return {
          ...admission,
          patient: {
            ...admission.patient,
            name: `${admission.patient.firstName} ${admission.patient.lastName}`.trim(),
            age: calculateAge(admission.patient.dateOfBirth)
          },
          surgeryType: admission.surgeryTypeDetail,
          surgeryPackageDetail: surgeryPackageDetail || null,
          // Keep original surgeryPackage field for compatibility
          surgeryPackage: surgeryPackageDetail ? surgeryPackageDetail.packageName : admission.surgeryPackage
        };
      });

      res.json({
        success: true,
        data: transformedAdmissions,
        totalCount,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: actualOffset,
          page: page ? parseInt(page) : Math.floor(actualOffset / parseInt(limit)) + 1,
          hasMore: actualOffset + parseInt(limit) < totalCount
        }
      });

    } catch (error) {
      console.error('Get IPD admissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get IPD admissions',
        error: error.message
      });
    }
  }

  async getIpdAdmissionById(req, res) {
    try {
      const { admissionId } = req.params;

      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId },
        include: {
          patient: true,
          admittingStaff: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true,
              employeeId: true
            }
          },
          surgeon: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true,
              employeeId: true
            }
          },
          surgeryDayVisit: {
            include: {
              optometristExamination: true,
              ophthalmologistExaminations: true
            }
          },
          fitnessReports: {
            include: {
              assessor: {
                select: {
                  firstName: true,
                  lastName: true,
                  staffType: true
                }
              }
            },
            orderBy: { assessmentDate: 'desc' }
          },
          preOpAssessments: {
            include: {
              assessor: {
                select: {
                  firstName: true,
                  lastName: true,
                  staffType: true
                }
              }
            },
            orderBy: { assessmentDate: 'desc' }
          },
          surgeryMetrics: {
            include: {
              surgeon: {
                select: {
                  firstName: true,
                  lastName: true,
                  staffType: true
                }
              }
            },
            orderBy: { surgeryStartTime: 'desc' }
          }
        }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      res.json({
        success: true,
        data: admission
      });

    } catch (error) {
      console.error('Get IPD admission by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get IPD admission',
        error: error.message
      });
    }
  }

  async updateIpdAdmission(req, res) {
    try {
      const { admissionId } = req.params;
      const updates = req.body;

      // 🚨 COMPREHENSIVE BACKEND LOGGING 🚨
      console.log('═══════════════════════════════════════════');
      console.log('🔥 BACKEND: IPD UPDATE REQUEST RECEIVED');
      console.log('═══════════════════════════════════════════');
      console.log('📍 Admission ID:', admissionId);
      console.log('📥 Raw Request Body:', JSON.stringify(updates, null, 2));
      console.log('🔍 Surgery Package ID in Request:', updates.surgeryPackageId);
      console.log('🔍 Surgery Package ID Type:', typeof updates.surgeryPackageId);
      console.log('🔍 Surgery Package ID Truthy?:', !!updates.surgeryPackageId);
      console.log('═══════════════════════════════════════════');

      // Remove fields that shouldn't be updated directly
      const originalSurgeryPackageId = updates.surgeryPackageId;
      delete updates.id;
      delete updates.admissionNumber;
      delete updates.patientId;
      delete updates.admittedBy;
      delete updates.createdAt;

      console.log('🔄 After field cleanup:');
      console.log('   Original surgeryPackageId:', originalSurgeryPackageId);
      console.log('   Updates surgeryPackageId after cleanup:', updates.surgeryPackageId);
      console.log('   Complete updates after cleanup:', JSON.stringify(updates, null, 2));

      // Convert date fields if present
      if (updates.surgeryDate) {
        updates.surgeryDate = new Date(updates.surgeryDate);
      }
      if (updates.expectedDischarge) {
        updates.expectedDischarge = new Date(updates.expectedDischarge);
      }
      if (updates.actualDischarge) {
        updates.actualDischarge = new Date(updates.actualDischarge);
      }

      // Handle lens fields
      if (updates.hasOwnProperty('lensRequired')) {
        updates.lensRequired = Boolean(updates.lensRequired);
        console.log('Processing lensRequired:', updates.lensRequired);
      }

      if (updates.hasOwnProperty('lensId')) {
        // If lensId is provided, ensure lensRequired is true
        if (updates.lensId) {
          updates.lensRequired = true;
          console.log('Processing lensId:', updates.lensId);
        } else if (updates.lensId === null || updates.lensId === '') {
          // If lensId is null/empty, set it to null and optionally set lensRequired to false
          updates.lensId = null;
          console.log('Setting lensId to null');
        }
      }

      const admission = await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: {
          ...updates,
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
          },
          lens: {
            select: {
              id: true,
              lensName: true,
              lensCode: true,
              manufacturer: true,
              model: true,
              lensType: true,
              lensCategory: true,
              patientCost: true
            }
          },
          surgeryTypeDetail: {
            select: {
              id: true,
              name: true,
              category: true,
              baseCost: true
            }
          }
        }
      });

      // If a surgeryPackageId was updated, fetch the surgery package details and update finalSurgeryAmount
      let surgeryPackageDetail = null;
      const updatedSurgeryPackageId = updates.surgeryPackageId || admission.surgeryPackageId;
      
      console.log('� SURGERY PACKAGE PROCESSING:');
      console.log('══════════════════════════════');
      console.log('🔍 updates.surgeryPackageId:', updates.surgeryPackageId);
      console.log('🔍 admission.surgeryPackageId (from DB):', admission.surgeryPackageId);
      console.log('🔍 updatedSurgeryPackageId (final):', updatedSurgeryPackageId);
      console.log('🔍 Will process surgery package?', !!updatedSurgeryPackageId);
      console.log('🔍 Current admission finalSurgeryAmount:', admission.finalSurgeryAmount);
      
      // SIMPLE: Update finalSurgeryAmount if surgeryPackageId is provided  
      if (updates.surgeryPackageId) {
        console.log('🔥 SIMPLE UPDATE: surgeryPackageId =', updates.surgeryPackageId);
        
        const pkg = await prisma.surgeryPackage.findUnique({
          where: { id: updates.surgeryPackageId }
        });
        
        if (pkg?.packageCost) {
          console.log(`💰 Setting finalSurgeryAmount to ₹${pkg.packageCost}`);
          
          await prisma.ipdAdmission.update({
            where: { id: admissionId },
            data: { finalSurgeryAmount: pkg.packageCost }
          });
          
          console.log(`🎉 SUCCESS! Updated to ₹${pkg.packageCost}`);
        } else {
          console.log('❌ Package or cost not found');
        }
      }

      // Final verification - get the updated admission
      const finalAdmission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId },
        select: { 
          id: true, 
          finalSurgeryAmount: true, 
          surgeryPackageId: true,
          status: true 
        }
      });

      console.log('🎯 FINAL VERIFICATION:');
      console.log('══════════════════════');
      console.log('   Final admission finalSurgeryAmount:', finalAdmission.finalSurgeryAmount);
      console.log('   Final admission surgeryPackageId:', finalAdmission.surgeryPackageId);
      console.log('   Final admission status:', finalAdmission.status);
      console.log('══════════════════════');

      const responseData = {
        success: true,
        message: 'IPD admission updated successfully',
        data: {
          ...admission,
          finalSurgeryAmount: finalAdmission.finalSurgeryAmount // Ensure we return the updated value
        }
      };

      console.log('📤 RESPONSE TO FRONTEND:');
      console.log('   finalSurgeryAmount in response:', responseData.data.finalSurgeryAmount);

      res.json(responseData);

    } catch (error) {
      console.error('Update IPD admission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update IPD admission',
        error: error.message
      });
    }
  }

  async getCurrentAdmissions(req, res) {
    try {
      const activeStatuses = ['ADMITTED', 'SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT', 'SURGERY_DAY', 'POST_OP', 'RECOVERY'];

      const admissions = await prisma.ipdAdmission.findMany({
        where: {
          status: { in: activeStatuses }
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true,
              phone: true,
              gender: true,
              dateOfBirth: true
            }
          },
          surgeon: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          },
          fitnessReports: {
            select: {
              fitnessStatus: true,
              assessmentDate: true
            },
            orderBy: { assessmentDate: 'desc' },
            take: 1
          }
        },
        orderBy: { admissionDate: 'asc' }
      });

      res.json({
        success: true,
        data: admissions,
        count: admissions.length
      });

    } catch (error) {
      console.error('Get current admissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get current admissions',
        error: error.message
      });
    }
  }

  async getTodaySurgeries(req, res) {
    console.log('🔥 getTodaySurgeries endpoint HIT!');
    console.log('👤 User:', req.user?.staffType, req.user?.firstName, req.user?.lastName);
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      console.log('📅 Fetching today\'s surgeries...');
      console.log('🕐 Server current time:', today.toISOString());
      console.log('📆 Server date:', today.toLocaleDateString());
      console.log('🌅 Start of day:', startOfDay.toISOString());
      console.log('🌆 End of day:', endOfDay.toISOString());
      console.log('Date range:', { startOfDay, endOfDay });

      const surgeries = await prisma.ipdAdmission.findMany({
        where: {
          surgeryDate: {
            gte: startOfDay,
            lt: endOfDay
          },
          status: {
            in: ['SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT', 'READY_FOR_SURGERY', 'SURGERY_DAY', 'SURGERY_STARTED', 'SURGERY_COMPLETED']
          }
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true,
              phone: true,
              gender: true,
              dateOfBirth: true
            }
          },
          surgeon: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true,
              employeeId: true
            }
          },
          surgeryTypeDetail: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          otRoom: {
            select: {
              id: true,
              roomNumber: true,
              roomName: true,
              status: true
            }
          },
          fitnessReports: {
            select: {
              id: true,
              fitnessStatus: true,
              assessmentDate: true
            },
            orderBy: { assessmentDate: 'desc' },
            take: 1
          },
          preOpAssessments: {
            select: {
              id: true,
              assessmentDate: true
            },
            orderBy: { assessmentDate: 'desc' },
            take: 1
          },
          surgeryMetrics: {
            select: {
              id: true,
              surgeryStartTime: true,
              surgeryEndTime: true
            },
            orderBy: { surgeryStartTime: 'desc' },
            take: 1
          }
        },
        orderBy: { surgeryDate: 'asc' }
      });

      console.log(`✅ Found ${surgeries.length} surgeries scheduled for today`);
      
      if (surgeries.length > 0) {
        console.log('📋 Sample surgery dates:', surgeries.slice(0, 3).map(s => ({
          id: s.id,
          surgeryDate: s.surgeryDate,
          status: s.status,
          patient: `${s.patient?.firstName} ${s.patient?.lastName}`
        })));
      }

      res.json({
        success: true,
        data: surgeries,
        count: surgeries.length,
        date: today.toISOString().split('T')[0]
      });

    } catch (error) {
      console.error('❌ Get today surgeries error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get today\'s surgeries',
        error: error.message
      });
    }
  }

  async createSurgeryDayVisit(req, res) {
    try {
      const { admissionId } = req.params;
      const { visitType = 'IPD', chiefComplaint, presentingSymptoms } = req.body;

      // Get admission details
      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId },
        include: { patient: true }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      // Check if surgery day visit already exists
      if (admission.surgeryDayVisitId) {
        return res.status(409).json({
          success: false,
          message: 'Surgery day visit already exists for this admission',
          existingVisitId: admission.surgeryDayVisitId
        });
      }

      // Create appointment first
      const appointment = await prisma.appointment.create({
        data: {
          patientId: admission.patientId,
          doctorId: admission.surgeonId,
          appointmentDate: admission.surgeryDate || new Date(),
          appointmentTime: '09:00',
          tokenNumber: `SURG-${Date.now()}`,
          status: 'CHECKED_IN',
          isActive: true,
          appointmentType: 'SURGERY',
          purpose: `Surgery: ${admission.surgeryType}`,
          notes: 'Surgery day appointment - created automatically'
        }
      });

      // Create patient visit
      const visit = await prisma.patientVisit.create({
        data: {
          patientId: admission.patientId,
          appointmentId: appointment.id,
          doctorId: admission.surgeonId,
          visitType: 'IPD',
          visitDate: new Date(),
          chiefComplaint: chiefComplaint || `${admission.surgeryType} surgery`,
          presentingSymptoms,
          status: 'WITH_DOCTOR',
          checkedInAt: new Date()
        }
      });

      // Update admission with surgery day visit
      const updatedAdmission = await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: {
          surgeryDayVisitId: visit.id,
          status: 'SURGERY_DAY'
        },
        include: {
          surgeryDayVisit: true,
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Surgery day visit created successfully',
        data: {
          admission: updatedAdmission,
          visit: visit,
          appointment: appointment
        }
      });

    } catch (error) {
      console.error('Create surgery day visit error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create surgery day visit',
        error: error.message
      });
    }
  }

  // =================
  // FITNESS REPORT METHODS
  // =================

  async createFitnessReport(req, res) {
    try {
      const { admissionId } = req.params;
      const {
        bloodPressure,
        heartRate,
        temperature,
        oxygenSaturation,
        ecgReport,
        chestXrayReport,
        bloodTestReports,
        fitnessNotes,
        contraindications,
        specialInstructions,
        fitnessStatus = 'PENDING'
      } = req.body;

      // Verify admission exists
      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      const fitnessReport = await prisma.fitnessReport.create({
        data: {
          ipdAdmissionId: admissionId,
          assessedBy: req.user.id,
          fitnessStatus,
          bloodPressure,
          heartRate,
          temperature,
          oxygenSaturation,
          ecgReport,
          chestXrayReport,
          bloodTestReports: bloodTestReports || {},
          fitnessNotes,
          contraindications,
          specialInstructions
        },
        include: {
          assessor: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true,
              employeeId: true
            }
          },
          ipdAdmission: {
            select: {
              admissionNumber: true,
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

      res.status(201).json({
        success: true,
        message: 'Fitness report created successfully',
        data: fitnessReport
      });

    } catch (error) {
      console.error('Create fitness report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create fitness report',
        error: error.message
      });
    }
  }

  async getFitnessReports(req, res) {
    try {
      const { admissionId } = req.params;

      const reports = await prisma.fitnessReport.findMany({
        where: { ipdAdmissionId: admissionId },
        include: {
          assessor: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true,
              employeeId: true
            }
          }
        },
        orderBy: { assessmentDate: 'desc' }
      });

      res.json({
        success: true,
        data: reports,
        count: reports.length
      });

    } catch (error) {
      console.error('Get fitness reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get fitness reports',
        error: error.message
      });
    }
  }

  async updateFitnessStatus(req, res) {
    try {
      const { reportId } = req.params;
      const { fitnessStatus, fitnessNotes, contraindications, specialInstructions } = req.body;

      if (!fitnessStatus) {
        return res.status(400).json({
          success: false,
          message: 'Fitness status is required'
        });
      }

      const report = await prisma.fitnessReport.update({
        where: { id: reportId },
        data: {
          fitnessStatus,
          fitnessNotes,
          contraindications,
          specialInstructions,
          updatedAt: new Date()
        },
        include: {
          assessor: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          },
          ipdAdmission: {
            select: {
              admissionNumber: true,
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

      res.json({
        success: true,
        message: 'Fitness status updated successfully',
        data: report
      });

    } catch (error) {
      console.error('Update fitness status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update fitness status',
        error: error.message
      });
    }
  }

  // =================
  // DASHBOARD METHODS
  // =================

  async getIpdDashboard(req, res) {
    try {
      // Get current statistics
      const [
        totalAdmissions,
        activeAdmissions,
        todaySurgeries,
        pendingFitness,
        pendingPreOp,
        completedSurgeries
      ] = await Promise.all([
        prisma.ipdAdmission.count(),
        prisma.ipdAdmission.count({
          where: {
            status: {
              in: ['ADMITTED', 'SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT', 'SURGERY_DAY', 'POST_OP', 'RECOVERY']
            }
          }
        }),
        prisma.ipdAdmission.count({
          where: {
            surgeryDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(24, 0, 0, 0))
            }
          }
        }),
        prisma.fitnessReport.count({
          where: { fitnessStatus: 'PENDING' }
        }),
        prisma.preOpAssessment.count({
          where: {
            ipdAdmission: {
              status: {
                in: ['SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT']
              }
            }
          }
        }),
        prisma.surgeryMetrics.count({
          where: {
            surgeryEndTime: { not: null }
          }
        })
      ]);

      // Get recent activities
      const recentAdmissions = await prisma.ipdAdmission.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
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
        data: {
          statistics: {
            totalAdmissions,
            activeAdmissions,
            todaySurgeries,
            pendingFitness,
            pendingPreOp,
            completedSurgeries
          },
          recentAdmissions
        }
      });

    } catch (error) {
      console.error('Get IPD dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get IPD dashboard data',
        error: error.message
      });
    }
  }

  // =================
  // PRE-OP ASSESSMENT METHODS
  // =================

  async createPreOpAssessment(req, res) {
    try {
      const { admissionId } = req.params;
      const {
        visualAcuity,
        refraction,
        iop,
        slitLampFindings,
        fundusFindings,
        surgicalPlan,
        iolPower,
        anesthesiaType,
        specialConsiderations,
        riskAssessment
      } = req.body;

      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      const preOpAssessment = await prisma.preOpAssessment.create({
        data: {
          ipdAdmissionId: admissionId,
          assessedBy: req.user.id,
          visualAcuity: visualAcuity || {},
          refraction: refraction || {},
          iop: iop || {},
          slitLampFindings: slitLampFindings || {},
          fundusFindings: fundusFindings || {},
          surgicalPlan,
          iolPower: iolPower || {},
          anesthesiaType,
          specialConsiderations,
          riskAssessment
        },
        include: {
          assessor: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true,
              employeeId: true
            }
          },
          ipdAdmission: {
            select: {
              admissionNumber: true,
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

      res.status(201).json({
        success: true,
        message: 'Pre-operative assessment created successfully',
        data: preOpAssessment
      });

    } catch (error) {
      console.error('Create pre-op assessment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create pre-operative assessment',
        error: error.message
      });
    }
  }

  async getPreOpAssessments(req, res) {
    try {
      const { admissionId } = req.params;

      const assessments = await prisma.preOpAssessment.findMany({
        where: { ipdAdmissionId: admissionId },
        include: {
          assessor: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true,
              employeeId: true
            }
          }
        },
        orderBy: { assessmentDate: 'desc' }
      });

      res.json({
        success: true,
        data: assessments,
        count: assessments.length
      });

    } catch (error) {
      console.error('Get pre-op assessments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pre-operative assessments',
        error: error.message
      });
    }
  }

  // =================
  // SURGERY METRICS METHODS
  // =================

  async createSurgeryMetrics(req, res) {
    try {
      const { admissionId } = req.params;
      const {
        surgeonId,
        anesthesiaType,
        surgicalNotes,
        intraOperativeFindings
      } = req.body;

      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      const surgeryMetrics = await prisma.surgeryMetrics.create({
        data: {
          ipdAdmissionId: admissionId,
          surgeonId: surgeonId || req.user.id,
          surgeryStartTime: new Date(),
          anesthesiaType,
          surgicalNotes,
          intraOperativeFindings: intraOperativeFindings || {}
        },
        include: {
          surgeon: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true,
              employeeId: true
            }
          },
          ipdAdmission: {
            select: {
              admissionNumber: true,
              surgeryType: true,
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

      // Update admission status to SURGERY_DAY
      await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: { status: 'SURGERY_DAY' }
      });

      res.status(201).json({
        success: true,
        message: 'Surgery started and metrics created successfully',
        data: surgeryMetrics
      });

    } catch (error) {
      console.error('Create surgery metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create surgery metrics',
        error: error.message
      });
    }
  }

  async completeSurgery(req, res) {
    try {
      const { metricsId } = req.params;
      const {
        complications,
        iolImplanted,
        immediateComplications,
        postOpInstructions,
        followUpSchedule,
        visualOutcome,
        bloodLoss,
        patientTolerance,
        surgicalComplexity,
        equipmentUsed
      } = req.body;

      const metrics = await prisma.surgeryMetrics.update({
        where: { id: metricsId },
        data: {
          surgeryEndTime: new Date(),
          complications,
          iolImplanted,
          immediateComplications,
          postOpInstructions,
          followUpSchedule,
          visualOutcome: visualOutcome || {},
          bloodLoss,
          patientTolerance,
          surgicalComplexity,
          equipmentUsed: equipmentUsed || {},
          updatedAt: new Date()
        },
        include: {
          surgeon: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          },
          ipdAdmission: {
            select: {
              id: true,
              admissionNumber: true,
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

      // Calculate surgery duration
      if (metrics.surgeryStartTime) {
        const duration = Math.round((metrics.surgeryEndTime - metrics.surgeryStartTime) / (1000 * 60));
        await prisma.surgeryMetrics.update({
          where: { id: metricsId },
          data: { surgeryDuration: duration }
        });
      }

      // Update admission status to POST_OP
      await prisma.ipdAdmission.update({
        where: { id: metrics.ipdAdmission.id },
        data: { status: 'POST_OP' }
      });

      res.json({
        success: true,
        message: 'Surgery completed successfully',
        data: {
          ...metrics,
          duration: metrics.surgeryDuration
        }
      });

    } catch (error) {
      console.error('Complete surgery error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete surgery',
        error: error.message
      });
    }
  }

  // =================
  // RECEPTIONIST2 INTEGRATION METHODS
  // =================

  async getTodaySurgeriesForReceptionist(req, res) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const surgeries = await prisma.ipdAdmission.findMany({
        where: {
          surgeryDate: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true,
              phone: true,
              gender: true,
              dateOfBirth: true
            }
          },
          surgeon: {
            select: {
              firstName: true,
              lastName: true,
              employeeId: true
            }
          },
          fitnessReports: {
            where: {
              fitnessStatus: { not: 'PENDING' }
            },
            select: {
              fitnessStatus: true,
              assessmentDate: true
            },
            orderBy: { assessmentDate: 'desc' },
            take: 1
          },
          surgeryMetrics: {
            select: {
              id: true,
              surgeryStartTime: true,
              surgeryEndTime: true
            },
            orderBy: { surgeryStartTime: 'desc' },
            take: 1
          }
        },
        orderBy: { surgeryDate: 'asc' }
      });

      // Add status indicators for receptionist dashboard
      const surgeriesWithStatus = surgeries.map(surgery => ({
        ...surgery,
        workflowStatus: {
          hasFitnessReport: surgery.fitnessReports.length > 0,
          fitnessStatus: surgery.fitnessReports[0]?.fitnessStatus || 'PENDING',
          surgeryStarted: surgery.surgeryMetrics.length > 0 && surgery.surgeryMetrics[0].surgeryStartTime,
          surgeryCompleted: surgery.surgeryMetrics.length > 0 && surgery.surgeryMetrics[0].surgeryEndTime
        }
      }));

      res.json({
        success: true,
        data: surgeriesWithStatus,
        count: surgeriesWithStatus.length,
        date: today.toISOString().split('T')[0]
      });

    } catch (error) {
      console.error('Get today surgeries for receptionist error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get today\'s surgeries for receptionist',
        error: error.message
      });
    }
  }

  async getPendingFitnessForReceptionist(req, res) {
    try {
      const pendingReports = await prisma.fitnessReport.findMany({
        where: { fitnessStatus: 'PENDING' },
        include: {
          ipdAdmission: {
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                  patientNumber: true,
                  phone: true
                }
              }
            }
          },
          assessor: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          }
        },
        orderBy: { assessmentDate: 'asc' }
      });

      res.json({
        success: true,
        data: pendingReports,
        count: pendingReports.length
      });

    } catch (error) {
      console.error('Get pending fitness for receptionist error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pending fitness reports',
        error: error.message
      });
    }
  }

  // =================
  // UTILITY METHODS
  // =================

  async getPatientAdmissions(req, res) {
    try {
      const { patientId } = req.params;

      const admissions = await prisma.ipdAdmission.findMany({
        where: { patientId },
        include: {
          admittingStaff: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          },
          surgeon: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          },
          fitnessReports: {
            select: {
              fitnessStatus: true,
              assessmentDate: true
            },
            orderBy: { assessmentDate: 'desc' },
            take: 1
          }
        },
        orderBy: { admissionDate: 'desc' }
      });

      res.json({
        success: true,
        data: admissions,
        count: admissions.length
      });

    } catch (error) {
      console.error('Get patient admissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get patient admissions',
        error: error.message
      });
    }
  }

  async updateAdmissionStatus(req, res) {
    try {
      const { admissionId } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const updatedAdmission = await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: {
          status,
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
        message: 'Admission status updated successfully',
        data: updatedAdmission
      });

    } catch (error) {
      console.error('Update admission status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update admission status',
        error: error.message
      });
    }
  }

  // =================
  // MISSING METHODS TO COMPLETE API
  // =================

  async getFitnessReportById(req, res) {
    try {
      const { reportId } = req.params;

      const report = await prisma.fitnessReport.findUnique({
        where: { id: reportId },
        include: {
          assessor: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true,
              employeeId: true
            }
          },
          ipdAdmission: {
            include: {
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

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Fitness report not found'
        });
      }

      res.json({
        success: true,
        data: report
      });

    } catch (error) {
      console.error('Get fitness report by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get fitness report',
        error: error.message
      });
    }
  }

  async updateFitnessReport(req, res) {
    try {
      const { reportId } = req.params;
      const updates = req.body;

      delete updates.id;
      delete updates.assessedBy;
      delete updates.createdAt;

      const report = await prisma.fitnessReport.update({
        where: { id: reportId },
        data: {
          ...updates,
          updatedAt: new Date()
        },
        include: {
          assessor: {
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
        message: 'Fitness report updated successfully',
        data: report
      });

    } catch (error) {
      console.error('Update fitness report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update fitness report',
        error: error.message
      });
    }
  }

  async getUpcomingSurgeries(req, res) {
    try {
      const { showAll } = req.query;

      let dateFilter = {};

      // If showAll is true (for OT Admin), don't filter by date
      // Otherwise, show surgeries from tomorrow onwards
      if (!showAll || showAll !== 'true') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateFilter = { surgeryDate: { gte: tomorrow } };
      }

      const surgeries = await prisma.ipdAdmission.findMany({
        where: {
          ...dateFilter,
          status: {
            in: ['ADMITTED', 'SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT', 'SURGERY_SUGGESTED']
          }
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientNumber: true,
              phone: true,
              email: true,
              dateOfBirth: true,
              gender: true
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
              employeeId: true,
              staffType: true
            }
          },
          sister: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              staffType: true
            }
          },
          anesthesiologist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              staffType: true
            }
          },
          surgeryTypeDetail: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              investigationIds: true
            }
          },
          lens: {
            select: {
              id: true,
              lensName: true,
              lensCode: true,
              manufacturer: true,
              model: true,
              lensType: true,
              lensCategory: true,
              material: true,
              power: true,
              patientCost: true,
              hospitalCost: true,
              features: true,
              benefits: true,
              stockQuantity: true,
              isAvailable: true
            }
          },
          fitnessReports: {
            select: {
              id: true,
              fitnessStatus: true,
              assessmentDate: true
            },
            orderBy: { assessmentDate: 'desc' },
            take: 1
          },
          preOpAssessments: {
            select: {
              id: true,
              assessmentDate: true
            },
            orderBy: { assessmentDate: 'desc' },
            take: 1
          },
          surgeryMetrics: {
            select: {
              id: true,
              surgeryStartTime: true,
              surgeryEndTime: true
            },
            orderBy: { surgeryStartTime: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { surgeryDate: 'asc' },
          { admissionDate: 'asc' }
        ]
      });

      // Fetch surgery package details for admissions that have surgeryPackageId
      const surgeryPackageIds = surgeries
        .filter(admission => admission.surgeryPackageId)
        .map(admission => admission.surgeryPackageId);

      let surgeryPackagesMap = new Map();
      if (surgeryPackageIds.length > 0) {
        console.log('🔍 Fetching surgery packages for upcoming surgeries:', surgeryPackageIds);
        try {
          const surgeryPackages = await prisma.surgeryPackage.findMany({
            where: {
              id: { in: surgeryPackageIds }
            },
            select: {
              id: true,
              packageName: true,
              description: true,
              packageCost: true,
              surgeryTypeId: true,
              isActive: true,
              surgeryCategory: true
            }
          });

          surgeryPackages.forEach(pkg => {
            surgeryPackagesMap.set(pkg.id, pkg);
          });
          console.log('📦 Surgery packages fetched for upcoming surgeries:', surgeryPackages.length);
        } catch (error) {
          console.warn('⚠️ Could not fetch surgery packages for upcoming surgeries:', error);
        }
      }

      // Transform the data to include surgery package details
      const transformedSurgeries = surgeries.map(surgery => {
        let surgeryPackageDetail = null;
        if (surgery.surgeryPackageId && surgeryPackagesMap.has(surgery.surgeryPackageId)) {
          surgeryPackageDetail = surgeryPackagesMap.get(surgery.surgeryPackageId);
        }

        return {
          ...surgery,
          surgeryPackageDetail
        };
      });

      res.json({
        success: true,
        data: transformedSurgeries,
        count: transformedSurgeries.length
      });

    } catch (error) {
      console.error('Get upcoming surgeries error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get upcoming surgeries',
        error: error.message
      });
    }
  }

  async scheduleSurgery(req, res) {
    try {
      const { admissionId } = req.params;
      const { surgeryDate, surgeonId, surgeryTimeSlot, notes } = req.body;

      if (!surgeryDate) {
        return res.status(400).json({
          success: false,
          message: 'Surgery date is required'
        });
      }

      if (!surgeryTimeSlot) {
        return res.status(400).json({
          success: false,
          message: 'Surgery time slot is required'
        });
      }

      // Get the admission to check OT room
      const existingAdmission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId },
        select: { otRoomId: true }
      });

      if (!existingAdmission || !existingAdmission.otRoomId) {
        return res.status(400).json({
          success: false,
          message: 'OT room must be assigned before scheduling'
        });
      }

      // Check if the slot is already booked for this OT room on this date
      const startOfDay = new Date(surgeryDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(surgeryDate);
      endOfDay.setHours(23, 59, 59, 999);

      const conflictingSurgery = await prisma.ipdAdmission.findFirst({
        where: {
          surgeryDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          otRoomId: existingAdmission.otRoomId,
          surgeryTimeSlot: surgeryTimeSlot,
          id: { not: admissionId }, // Exclude current admission
          status: {
            in: ['SURGERY_SCHEDULED', 'SURGERY_STARTED', 'SURGERY_COMPLETED']
          }
        }
      });

      if (conflictingSurgery) {
        return res.status(400).json({
          success: false,
          message: `This time slot (${surgeryTimeSlot}) is already booked for the selected OT room on this date`
        });
      }

      const admission = await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: {
          surgeryDate: new Date(surgeryDate),
          surgeryTimeSlot: surgeryTimeSlot,
          surgeonId: surgeonId || null,
          status: 'SURGERY_SCHEDULED',
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
        message: 'Surgery scheduled successfully',
        data: admission
      });

    } catch (error) {
      console.error('Schedule surgery error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule surgery',
        error: error.message
      });
    }
  }

  async getAvailableTimeSlots(req, res) {
    try {
      const { date, otRoomId } = req.query;

      console.log('🔍 getAvailableTimeSlots called with:', { date, otRoomId });

      if (!date || !otRoomId) {
        console.log('⚠️ Missing required parameters');
        return res.status(400).json({
          success: false,
          message: 'Date and OT room ID are required'
        });
      }

      // Define all available time slots (9 AM to 6 PM, 1-hour slots)
      const allSlots = [
        '09:00-10:00',
        '10:00-11:00',
        '11:00-12:00',
        '12:00-13:00',
        '13:00-14:00',
        '14:00-15:00',
        '15:00-16:00',
        '16:00-17:00',
        '17:00-18:00'
      ];

      console.log('📋 All available slots:', allSlots);

      // Get booked slots for this date and OT room
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

  

      const bookedSurgeries = await prisma.ipdAdmission.findMany({
        where: {
          surgeryDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          otRoomId: otRoomId,
          surgeryTimeSlot: { not: null },
          status: {
            in: ['SURGERY_SCHEDULED', 'SURGERY_STARTED', 'SURGERY_COMPLETED']
          }
        },
        select: {
          surgeryTimeSlot: true,
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      console.log('🏥 Booked surgeries found:', bookedSurgeries.length);
      console.log('📦 Booked surgeries details:', JSON.stringify(bookedSurgeries, null, 2));

      const bookedSlots = bookedSurgeries.map(s => s.surgeryTimeSlot);
      console.log('🚫 Booked slots:', bookedSlots);

      // Map slots with availability status
      const slotsWithAvailability = allSlots.map(slot => ({
        slot,
        available: !bookedSlots.includes(slot),
        bookedBy: bookedSlots.includes(slot) 
          ? bookedSurgeries.find(s => s.surgeryTimeSlot === slot)?.patient 
          : null
      }));

      console.log('✅ Slots with availability:', JSON.stringify(slotsWithAvailability, null, 2));

      res.json({
        success: true,
        data: slotsWithAvailability
      });

    } catch (error) {
      console.error('❌ Get available time slots error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available time slots',
        error: error.message
      });
    }
  }

  // Complete remaining placeholder methods
  async getPreOpAssessmentById(req, res) {
    try {
      const { assessmentId } = req.params;

      const assessment = await prisma.preOpAssessment.findUnique({
        where: { id: assessmentId },
        include: {
          assessor: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          },
          ipdAdmission: {
            include: {
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

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Pre-operative assessment not found'
        });
      }

      res.json({
        success: true,
        data: assessment
      });

    } catch (error) {
      console.error('Get pre-op assessment by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pre-operative assessment',
        error: error.message
      });
    }
  }

  async updatePreOpAssessment(req, res) {
    try {
      const { assessmentId } = req.params;
      const updates = req.body;

      delete updates.id;
      delete updates.assessedBy;
      delete updates.createdAt;

      const assessment = await prisma.preOpAssessment.update({
        where: { id: assessmentId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Pre-operative assessment updated successfully',
        data: assessment
      });

    } catch (error) {
      console.error('Update pre-op assessment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update pre-operative assessment',
        error: error.message
      });
    }
  }

  async getSurgeryMetrics(req, res) {
    try {
      const { admissionId } = req.params;

      const metrics = await prisma.surgeryMetrics.findMany({
        where: { ipdAdmissionId: admissionId },
        include: {
          surgeon: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          }
        },
        orderBy: { surgeryStartTime: 'desc' }
      });

      res.json({
        success: true,
        data: metrics,
        count: metrics.length
      });

    } catch (error) {
      console.error('Get surgery metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get surgery metrics',
        error: error.message
      });
    }
  }

  async getSurgeryMetricsById(req, res) {
    try {
      const { metricsId } = req.params;

      const metrics = await prisma.surgeryMetrics.findUnique({
        where: { id: metricsId },
        include: {
          surgeon: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          },
          ipdAdmission: {
            include: {
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

      if (!metrics) {
        return res.status(404).json({
          success: false,
          message: 'Surgery metrics not found'
        });
      }

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      console.error('Get surgery metrics by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get surgery metrics',
        error: error.message
      });
    }
  }

  async updateSurgeryMetrics(req, res) {
    try {
      const { metricsId } = req.params;
      const updates = req.body;

      delete updates.id;
      delete updates.createdAt;

      const metrics = await prisma.surgeryMetrics.update({
        where: { id: metricsId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Surgery metrics updated successfully',
        data: metrics
      });

    } catch (error) {
      console.error('Update surgery metrics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update surgery metrics',
        error: error.message
      });
    }
  }

  // Additional placeholder methods for completeness
  async getPendingFitnessReports(req, res) { await this.getPendingFitnessForReceptionist(req, res); }
  async getPendingPreOpAssessments(req, res) {
    try {
      const assessments = await prisma.preOpAssessment.findMany({
        where: {
          ipdAdmission: {
            status: { in: ['SURGERY_SCHEDULED', 'PRE_OP_ASSESSMENT'] }
          }
        },
        include: {
          ipdAdmission: {
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                  patientNumber: true
                }
              }
            }
          }
        },
        orderBy: { assessmentDate: 'asc' }
      });

      res.json({ success: true, data: assessments, count: assessments.length });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get pending pre-op assessments' });
    }
  }

  async getIpdStatistics(req, res) { await this.getIpdDashboard(req, res); }
  async getSurgeryScheduleDashboard(req, res) { await this.getTodaySurgeries(req, res); }
  async getSurgeryStatistics(req, res) {
    try {
      const stats = await prisma.surgeryMetrics.aggregate({
        _count: { id: true },
        _avg: { surgeryDuration: true }
      });
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get surgery statistics' });
    }
  }

  async getWorkflowStatus(req, res) {
    try {
      const { admissionId } = req.params;
      const admission = await this.getIpdAdmissionById({ params: { admissionId } }, res);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get workflow status' });
    }
  }

  async getPreOpStatusForReceptionist(req, res) { await this.getPendingPreOpAssessments(req, res); }

  async uploadFitnessDocuments(req, res) {
    res.status(501).json({ success: false, message: 'Document upload not implemented yet' });
  }

  async uploadInvestigationDocuments(req, res) {
    try {
      const { admissionId } = req.params;

      // Check if admission exists
      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId },
        include: {
          patient: {
            select: {
              patientNumber: true
            }
          }
        }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      // Handle file upload
      const upload = multer({
        storage: multer.diskStorage({
          destination: async (req, file, cb) => {
            try {
              const uploadPath = path.join(__dirname, '../../uploads',
                admission.patient.patientNumber.toString(),
                admission.admissionNumber
              );
              await fs.mkdir(uploadPath, { recursive: true });
              cb(null, uploadPath);
            } catch (error) {
              cb(error);
            }
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileExtension = path.extname(file.originalname);
            const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
            cb(null, `investigation_${uniqueSuffix}_${sanitizedName}`);
          }
        }),
        fileFilter: (req, file, cb) => {
          const allowedTypes = ['application/pdf'];
          if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
          } else {
            cb(new Error('Only PDF files are allowed'), false);
          }
        },
        limits: {
          fileSize: 20 * 1024 * 1024 // 20MB limit per file
        }
      }).single('document');

      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: 'File upload failed',
            error: err.message
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
        }

        try {
          // Generate the relative path to store in database
          const relativePath = `uploads/${admission.patient.patientNumber}/${admission.admissionNumber}/${req.file.filename}`;

          // Get current document paths and add new one
          const currentPaths = admission.investigationDocumentPath || [];
          const updatedPaths = [...currentPaths, relativePath];

          // Update the admission with the new document path added to array
          const updatedAdmission = await prisma.ipdAdmission.update({
            where: { id: admissionId },
            data: {
              investigationDocumentPath: updatedPaths,
              updatedAt: new Date()
            }
          });

          res.json({
            success: true,
            message: 'Investigation document uploaded successfully',
            data: {
              documentPath: relativePath,
              fileName: req.file.originalname,
              fileSize: req.file.size,
              totalDocuments: updatedPaths.length
            }
          });

        } catch (error) {
          console.error('❌ Error updating admission with document path:', error);

          // Clean up uploaded file if database update fails
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error cleaning up file:', unlinkError);
          }

          res.status(500).json({
            success: false,
            message: 'Failed to save document path',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
      });

    } catch (error) {
      console.error('❌ Error in investigation document upload:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload investigation document',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async deleteInvestigationDocument(req, res) {
    try {
      const { admissionId } = req.params;
      console.log('📋 Delete request received:', {
        admissionId,
        body: req.body,
        method: req.method,
        contentType: req.headers['content-type']
      });

      const { documentPath } = req.body || {};

      if (!documentPath) {
        console.log('❌ Missing documentPath in request body:', req.body);
        return res.status(400).json({
          success: false,
          message: 'Document path is required in request body'
        });
      }

      // Check if admission exists
      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      // Get current document paths and remove the specified one
      const currentPaths = admission.investigationDocumentPath || [];
      const updatedPaths = currentPaths.filter(path => path !== documentPath);

      // Update the admission with the updated document paths array
      await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: {
          investigationDocumentPath: updatedPaths,
          updatedAt: new Date()
        }
      });

      // Try to delete the physical file
      try {
        const fullPath = path.join(__dirname, '../../', documentPath);
        await fs.unlink(fullPath);
      } catch (fileError) {
        console.warn('Warning: Could not delete physical file:', fileError.message);
        // Continue even if file deletion fails - database is already updated
      }

      res.json({
        success: true,
        message: 'Investigation document deleted successfully',
        data: {
          deletedDocument: documentPath,
          remainingDocuments: updatedPaths.length
        }
      });

    } catch (error) {
      console.error('❌ Error deleting investigation document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete investigation document',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async updateIpdAdmission(req, res) {
    try {
      const { admissionId } = req.params;
      const updateData = req.body;

      console.log('🔄 Updating IPD admission:', { admissionId, updateData });

      // Check if admission exists
      const existingAdmission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId }
      });

      if (!existingAdmission) {
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      // Process the update data to handle date conversion and validation
      const processedData = { ...updateData };

      // Handle surgeryDate - convert to proper DateTime if provided
      if (processedData.surgeryDate) {
        // If it's just a date string (YYYY-MM-DD), convert to DateTime
        if (typeof processedData.surgeryDate === 'string' && processedData.surgeryDate.length === 10) {
          processedData.surgeryDate = new Date(processedData.surgeryDate + 'T00:00:00.000Z');
        } else if (typeof processedData.surgeryDate === 'string') {
          processedData.surgeryDate = new Date(processedData.surgeryDate);
        }
      }

      // Handle expectedDuration - convert to integer if provided
      if (processedData.expectedDuration) {
        processedData.expectedDuration = parseInt(processedData.expectedDuration) || null;
      }

      // Remove fields that don't exist in the schema
      delete processedData.notes; // This field doesn't exist in IpdAdmission schema

      // Remove empty strings for optional fields and convert to null
      Object.keys(processedData).forEach(key => {
        if (processedData[key] === '') {
          processedData[key] = null;
        }
      });

      // Update the admission
      const updatedAdmission = await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: {
          ...processedData,
          updatedAt: new Date()
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientNumber: true,
              dateOfBirth: true,
              phone: true,
              email: true
            }
          },
          surgeon: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              staffType: true
            }
          },
          sister: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              staffType: true
            }
          },
          anesthesiologist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              staffType: true
            }
          },
          surgeryTypeDetail: {
            select: {
              id: true,
              name: true,
              category: true,
              description: true,
              averageDuration: true
            }
          }
        }
      });

      // If surgeryPackageId was provided, update finalSurgeryAmount with the package cost
      if (processedData.surgeryPackageId) {
        const pkg = await prisma.surgeryPackage.findUnique({
          where: { id: processedData.surgeryPackageId }
        });

        if (pkg?.packageCost) {
          await prisma.ipdAdmission.update({
            where: { id: admissionId },
            data: { finalSurgeryAmount: pkg.packageCost }
          });
          updatedAdmission.finalSurgeryAmount = pkg.packageCost;
          console.log(`💰 Updated finalSurgeryAmount to ₹${pkg.packageCost} from package: ${pkg.packageName}`);
        }
      }

      console.log('✅ IPD admission updated successfully');

      res.json({
        success: true,
        message: 'IPD admission updated successfully',
        data: updatedAdmission
      });

    } catch (error) {
      console.error('❌ Error updating IPD admission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update IPD admission',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async advanceWorkflowFromReceptionist(req, res) {
    res.status(501).json({ success: false, message: 'Workflow advancement not implemented yet' });
  }

  // =================
  // SURGERY CHECKIN METHODS
  // =================

  async getCheckinResources(req, res) {
    try {
      const { admissionId } = req.params;

      // Get IPD admission with surgery package and lens information
      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientNumber: true
            }
          },
          surgeryTypeDetail: {
            select: {
              id: true,
              name: true,
              category: true,
              description: true
            }
          },
          lens: {
            select: {
              id: true,
              lensName: true,
              lensCode: true,
              manufacturer: true,
              lensType: true,
              lensCategory: true,
              patientCost: true,
              stockQuantity: true,
              isAvailable: true
            }
          }
        }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      // Get surgery packages based on surgery type
      let surgeryPackages = [];
      if (admission.surgeryTypeDetail) {
        surgeryPackages = await prisma.surgeryPackage.findMany({
          where: {
            OR: [
              { surgeryTypeId: admission.surgeryTypeDetail.id },
              { surgeryCategory: admission.surgeryTypeDetail.category }
            ],
            isActive: true
          },
          include: {
            equipments: {
              select: {
                id: true,
                name: true,
                code: true,
                category: true,
                manufacturer: true,
                currentStock: true,
                unitCost: true,
                isActive: true
              }
            },
            defaultLens: {
              select: {
                id: true,
                lensName: true,
                lensCode: true,
                manufacturer: true,
                lensType: true,
                lensCategory: true,
                patientCost: true,
                stockQuantity: true,
                isAvailable: true
              }
            },
            alternativeLenses: {
              include: {
                lens: {
                  select: {
                    id: true,
                    lensName: true,
                    lensCode: true,
                    manufacturer: true,
                    lensType: true,
                    lensCategory: true,
                    patientCost: true,
                    stockQuantity: true,
                    isAvailable: true
                  }
                }
              }
            }
          },
          orderBy: [
            { isRecommended: 'desc' },
            { priority: 'asc' }
          ]
        });
      }

      // Get all available equipment for search
      const allEquipment = await prisma.equipment.findMany({
        where: {
          isActive: true,
          currentStock: { gt: 0 }
        },
        select: {
          id: true,
          name: true,
          code: true,
          category: true,
          manufacturer: true,
          currentStock: true,
          unitCost: true,
          reorderLevel: true
        },
        orderBy: { name: 'asc' }
      });

      // Get all available lenses for search
      const allLenses = await prisma.lens.findMany({
        where: {
          isActive: true,
          stockQuantity: { gt: 0 }
        },
        select: {
          id: true,
          lensName: true,
          lensCode: true,
          manufacturer: true,
          lensType: true,
          lensCategory: true,
          patientCost: true,
          stockQuantity: true,
          features: true,
          benefits: true
        },
        orderBy: { lensName: 'asc' }
      });

      // Determine recommended equipment from surgery packages
      const recommendedEquipment = [];
      surgeryPackages.forEach(pkg => {
        if (pkg.equipments && pkg.equipments.length > 0) {
          recommendedEquipment.push(...pkg.equipments.map(eq => ({
            ...eq,
            packageName: pkg.packageName,
            isRecommended: true
          })));
        }
      });

      // Remove duplicates
      const uniqueRecommendedEquipment = recommendedEquipment.filter((eq, index, self) =>
        index === self.findIndex(e => e.id === eq.id)
      );

      // Determine recommended lens
      let recommendedLens = null;
      if (admission.lensId) {
        recommendedLens = admission.lens;
      } else {
        // Get default lens from first recommended surgery package
        const recommendedPackage = surgeryPackages.find(pkg => pkg.isRecommended);
        if (recommendedPackage && recommendedPackage.defaultLens) {
          recommendedLens = recommendedPackage.defaultLens;
        }
      }

      res.json({
        success: true,
        data: {
          admission: {
            id: admission.id,
            admissionNumber: admission.admissionNumber,
            surgeryDate: admission.surgeryDate,
            tentativeTime: admission.tentativeTime,
            patient: admission.patient,
            surgeryType: admission.surgeryTypeDetail,
            currentLensId: admission.lensId,
            requiredEquipments: admission.requiredEquipments,
            requiredLenses: admission.requiredLenses
          },
          surgeryPackages,
          recommendedEquipment: uniqueRecommendedEquipment,
          recommendedLens,
          allEquipment,
          allLenses
        }
      });

    } catch (error) {
      console.error('❌ Error getting checkin resources:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get checkin resources',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async updateCheckinSelections(req, res) {
    try {
      const { admissionId } = req.params;
      const { selectedEquipments, selectedLens } = req.body;

      // Validate input
      if (!selectedEquipments || !Array.isArray(selectedEquipments)) {
        return res.status(400).json({
          success: false,
          message: 'selectedEquipments must be an array'
        });
      }

      // Validate equipment selections
      for (const eq of selectedEquipments) {
        if (!eq.equipmentId || !eq.quantity || eq.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Each equipment must have equipmentId and positive quantity'
          });
        }
      }

      // Check if admission exists
      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      // Prepare required equipments JSON
      const requiredEquipments = {};
      for (const eq of selectedEquipments) {
        // Get equipment details
        const equipment = await prisma.equipment.findUnique({
          where: { id: eq.equipmentId },
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
            currentStock: true
          }
        });

        if (!equipment) {
          return res.status(400).json({
            success: false,
            message: `Equipment with ID ${eq.equipmentId} not found`
          });
        }

        if (equipment.currentStock < eq.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${equipment.name}. Available: ${equipment.currentStock}, Required: ${eq.quantity}`
          });
        }

        requiredEquipments[eq.equipmentId] = {
          equipmentId: eq.equipmentId,
          name: equipment.name,
          code: equipment.code,
          category: equipment.category,
          quantity: eq.quantity,
          notes: eq.notes || null
        };
      }

      // Prepare required lens JSON
      let requiredLenses = {};
      let updateData = {
        requiredEquipments
      };

      if (selectedLens && selectedLens.lensId) {
        // Get lens details
        const lens = await prisma.lens.findUnique({
          where: { id: selectedLens.lensId },
          select: {
            id: true,
            lensName: true,
            lensCode: true,
            lensType: true,
            lensCategory: true,
            stockQuantity: true,
            patientCost: true
          }
        });

        if (!lens) {
          return res.status(400).json({
            success: false,
            message: `Lens with ID ${selectedLens.lensId} not found`
          });
        }

        if (lens.stockQuantity < 1) {
          return res.status(400).json({
            success: false,
            message: `Lens ${lens.lensName} is out of stock`
          });
        }

        requiredLenses[selectedLens.lensId] = {
          lensId: selectedLens.lensId,
          lensName: lens.lensName,
          lensCode: lens.lensCode,
          lensType: lens.lensType,
          lensCategory: lens.lensCategory,
          patientCost: lens.patientCost,
          notes: selectedLens.notes || null
        };

        updateData.requiredLenses = requiredLenses;
        updateData.lensId = selectedLens.lensId;
      }

      // Update admission
      const updatedAdmission = await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: updateData,
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
        message: 'Checkin selections updated successfully',
        data: {
          admissionId: updatedAdmission.id,
          admissionNumber: updatedAdmission.admissionNumber,
          requiredEquipments: updatedAdmission.requiredEquipments,
          requiredLenses: updatedAdmission.requiredLenses,
          selectedLensId: updatedAdmission.lensId
        }
      });

    } catch (error) {
      console.error('❌ Error updating checkin selections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update checkin selections',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async processSurgeryCheckin(req, res) {
    try {
      const { admissionId } = req.params;
      const { finalizeStock = true, preparationNotes, requiresAnesthesia } = req.body;
      const performedBy = req.user.id;

      // Get admission with required equipments and lens
      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true
            }
          },
          surgeryTypeDetail: {
            select: {
              name: true
            }
          }
        }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      if (!admission.requiredEquipments) {
        return res.status(400).json({
          success: false,
          message: 'No equipment selections found. Please complete equipment selection first.'
        });
      }

      const stockTransactions = [];
      const stockUpdates = [];

      if (finalizeStock) {
        // Process equipment stock adjustments
        for (const [equipmentId, equipmentData] of Object.entries(admission.requiredEquipments)) {
          const equipment = await prisma.equipment.findUnique({
            where: { id: equipmentId },
            select: { id: true, name: true, currentStock: true }
          });

          if (!equipment) {
            return res.status(400).json({
              success: false,
              message: `Equipment ${equipmentData.name} not found`
            });
          }

          if (equipment.currentStock < equipmentData.quantity) {
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for ${equipment.name}. Available: ${equipment.currentStock}, Required: ${equipmentData.quantity}`
            });
          }

          // Create stock transaction
          stockTransactions.push({
            transactionType: 'OUT',
            quantity: -equipmentData.quantity,
            reason: `Surgery checkin - ${admission.surgeryTypeDetail?.name || 'Surgery'} for patient ${admission.patient.firstName} ${admission.patient.lastName}`,
            performedBy,
            equipmentId,
            ipdAdmissionId: admissionId
          });

          // Update equipment stock
          stockUpdates.push(
            prisma.equipment.update({
              where: { id: equipmentId },
              data: {
                currentStock: equipment.currentStock - equipmentData.quantity,
                lastStockUpdate: new Date()
              }
            })
          );
        }

        // Process lens stock adjustment if lens is selected
        if (admission.lensId && admission.requiredLenses) {
          const lensData = admission.requiredLenses[admission.lensId];
          if (lensData) {
            const lens = await prisma.lens.findUnique({
              where: { id: admission.lensId },
              select: { id: true, lensName: true, stockQuantity: true }
            });

            if (!lens) {
              return res.status(400).json({
                success: false,
                message: `Selected lens not found`
              });
            }

            if (lens.stockQuantity < 1) {
              return res.status(400).json({
                success: false,
                message: `Insufficient stock for lens ${lens.lensName}. Available: ${lens.stockQuantity}`
              });
            }

            // Create lens stock transaction
            stockTransactions.push({
              transactionType: 'OUT',
              quantity: -1,
              reason: `Surgery checkin - Lens for ${admission.surgeryTypeDetail?.name || 'Surgery'} for patient ${admission.patient.firstName} ${admission.patient.lastName}`,
              performedBy,
              lensId: admission.lensId,
              ipdAdmissionId: admissionId
            });

            // Update lens stock
            stockUpdates.push(
              prisma.lens.update({
                where: { id: admission.lensId },
                data: {
                  stockQuantity: lens.stockQuantity - 1,
                  lastStockUpdate: new Date()
                }
              })
            );
          }
        }

        // Execute all stock transactions in a transaction
        await prisma.$transaction([
          ...stockUpdates,
          prisma.stockTransaction.createMany({
            data: stockTransactions
          })
        ]);
      }

      // Update admission status and add processing timestamp
      const updateData = {
        status: 'READY_FOR_SURGERY', // Move to ready for surgery stage
        updatedAt: new Date()
      };

      // Set requiresAnesthesia if provided
      if (typeof requiresAnesthesia === 'boolean') {
        updateData.requiresAnesthesia = requiresAnesthesia;
      }

      // Add preparation notes to journeyNotes if provided
      if (preparationNotes) {
        const currentJourneyNotes = admission.journeyNotes || {};
        updateData.journeyNotes = {
          ...currentJourneyNotes,
          surgeryPreparation: {
            notes: preparationNotes,
            timestamp: new Date().toISOString(),
            performedBy,
            equipmentUsed: admission.requiredEquipments ? Object.keys(admission.requiredEquipments).length : 0,
            lensUsed: admission.requiredLenses ? Object.keys(admission.requiredLenses).length : 0
          }
        };
      }

      const updatedAdmission = await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: updateData,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true
            }
          },
          surgeryTypeDetail: {
            select: {
              name: true,
              category: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: `Surgery checkin completed successfully${finalizeStock ? ' with stock adjustments' : ''}`,
        data: {
          admissionId: updatedAdmission.id,
          admissionNumber: updatedAdmission.admissionNumber,
          status: updatedAdmission.status,
          patient: updatedAdmission.patient,
          surgeryType: updatedAdmission.surgeryTypeDetail,
          stockAdjustments: finalizeStock ? {
            equipmentTransactions: stockTransactions.filter(t => t.equipmentId).length,
            lensTransactions: stockTransactions.filter(t => t.lensId).length
          } : null
        }
      });

    } catch (error) {
      console.error('❌ Error processing surgery checkin:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process surgery checkin',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // =================
  // SURGEON DASHBOARD SURGERY METHODS
  // =================

  /**
   * Get surgeon dashboard statistics
   * GET /api/ipd/surgeon/dashboard-stats
   */
  async getSurgeonDashboardStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's surgeries count by status
      const [totalToday, completed, inProgress, readyForSurgery] = await Promise.all([
        // Total surgeries today (all statuses)
        prisma.ipdAdmission.count({
          where: {
            surgeryDate: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        // Completed surgeries today
        prisma.ipdAdmission.count({
          where: {
            status: 'SURGERY_COMPLETED',
            surgeryCompletedAt: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        // In progress surgeries
        prisma.ipdAdmission.count({
          where: {
            status: 'SURGERY_STARTED'
          }
        }),
        // Ready for surgery
        prisma.ipdAdmission.count({
          where: {
            status: 'READY_FOR_SURGERY'
          }
        })
      ]);

      // Get average surgery duration for completed surgeries today
      const completedSurgeriesToday = await prisma.ipdAdmission.findMany({
        where: {
          status: 'SURGERY_COMPLETED',
          surgeryCompletedAt: {
            gte: today,
            lt: tomorrow
          },
          surgeryStartTime: { not: null },
          surgeryEndTime: { not: null }
        },
        select: {
          surgeryStartTime: true,
          surgeryEndTime: true
        }
      });

      let avgDuration = 0;
      if (completedSurgeriesToday.length > 0) {
        const totalDuration = completedSurgeriesToday.reduce((sum, surgery) => {
          const start = new Date(surgery.surgeryStartTime);
          const end = new Date(surgery.surgeryEndTime);
          return sum + (end - start) / (1000 * 60); // Convert to minutes
        }, 0);
        avgDuration = Math.round(totalDuration / completedSurgeriesToday.length);
      }

      // Get this month's stats for complications and success rate
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const completedThisMonth = await prisma.ipdAdmission.count({
        where: {
          status: 'SURGERY_COMPLETED',
          surgeryCompletedAt: {
            gte: firstDayOfMonth
          }
        }
      });

      // Get surgery metrics for complications (if any recorded)
      const surgeryMetrics = await prisma.surgeryMetrics.findMany({
        where: {
          ipdAdmission: {
            surgeryCompletedAt: {
              gte: firstDayOfMonth
            }
          }
        },
        select: {
          complications: true
        }
      });

      const surgeriesWithComplications = surgeryMetrics.filter(
        metric => metric.complications && metric.complications.trim() !== '' && metric.complications.toLowerCase() !== 'none'
      ).length;

      const complicationRate = completedThisMonth > 0 
        ? ((surgeriesWithComplications / completedThisMonth) * 100).toFixed(1)
        : 0;

      const successRate = completedThisMonth > 0
        ? (((completedThisMonth - surgeriesWithComplications) / completedThisMonth) * 100).toFixed(1)
        : 100;

      res.json({
        success: true,
        message: 'Surgeon dashboard statistics fetched successfully',
        data: {
          totalSurgeries: totalToday,
          completedSurgeries: completed,
          ongoingSurgery: inProgress,
          upcomingSurgeries: readyForSurgery,
          avgSurgeryDuration: avgDuration,
          successRate: parseFloat(successRate),
          complicationRate: parseFloat(complicationRate),
          period: {
            today: today.toISOString(),
            month: firstDayOfMonth.toISOString()
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching surgeon dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get anesthesiologist dashboard statistics
   * GET /api/ipd/anesthesiologist/dashboard-stats
   */
  async getAnesthesiologistDashboardStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's surgeries requiring anesthesia
      const [totalToday, completed, inProgress, readyForSurgery] = await Promise.all([
        // Total surgeries today requiring anesthesia
        prisma.ipdAdmission.count({
          where: {
            surgeryDate: {
              gte: today,
              lt: tomorrow
            },
            requiresAnesthesia: true
          }
        }),
        // Completed surgeries today
        prisma.ipdAdmission.count({
          where: {
            status: 'SURGERY_COMPLETED',
            requiresAnesthesia: true,
            surgeryCompletedAt: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        // In progress surgeries
        prisma.ipdAdmission.count({
          where: {
            status: 'SURGERY_STARTED',
            requiresAnesthesia: true
          }
        }),
        // Ready for surgery
        prisma.ipdAdmission.count({
          where: {
            status: 'READY_FOR_SURGERY',
            requiresAnesthesia: true
          }
        })
      ]);

      // Get average surgery duration for completed surgeries today
      const completedSurgeriesToday = await prisma.ipdAdmission.findMany({
        where: {
          status: 'SURGERY_COMPLETED',
          requiresAnesthesia: true,
          surgeryCompletedAt: {
            gte: today,
            lt: tomorrow
          },
          surgeryStartTime: { not: null },
          surgeryEndTime: { not: null }
        },
        select: {
          surgeryStartTime: true,
          surgeryEndTime: true
        }
      });

      let avgDuration = 0;
      if (completedSurgeriesToday.length > 0) {
        const totalDuration = completedSurgeriesToday.reduce((sum, surgery) => {
          const start = new Date(surgery.surgeryStartTime);
          const end = new Date(surgery.surgeryEndTime);
          return sum + (end - start) / (1000 * 60); // Convert to minutes
        }, 0);
        avgDuration = Math.round(totalDuration / completedSurgeriesToday.length);
      }

      // Get this month's stats for complications and success rate
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const completedThisMonth = await prisma.ipdAdmission.count({
        where: {
          status: 'SURGERY_COMPLETED',
          requiresAnesthesia: true,
          surgeryCompletedAt: {
            gte: firstDayOfMonth
          }
        }
      });

      // Get surgery metrics for complications (if any recorded)
      const surgeryMetrics = await prisma.surgeryMetrics.findMany({
        where: {
          ipdAdmission: {
            requiresAnesthesia: true,
            surgeryCompletedAt: {
              gte: firstDayOfMonth
            }
          }
        },
        select: {
          complications: true
        }
      });

      const surgeriesWithComplications = surgeryMetrics.filter(
        metric => metric.complications && metric.complications.trim() !== '' && metric.complications.toLowerCase() !== 'none'
      ).length;

      const complicationRate = completedThisMonth > 0 
        ? ((surgeriesWithComplications / completedThisMonth) * 100).toFixed(1)
        : 0;

      const successRate = completedThisMonth > 0
        ? (((completedThisMonth - surgeriesWithComplications) / completedThisMonth) * 100).toFixed(1)
        : 100;

      res.json({
        success: true,
        message: 'Anesthesiologist dashboard statistics fetched successfully',
        data: {
          totalSurgeries: totalToday,
          completedSurgeries: completed,
          ongoingSurgery: inProgress,
          upcomingSurgeries: readyForSurgery,
          avgSurgeryDuration: avgDuration,
          successRate: parseFloat(successRate),
          complicationRate: parseFloat(complicationRate),
          period: {
            today: today.toISOString(),
            month: firstDayOfMonth.toISOString()
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching anesthesiologist dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch anesthesiologist dashboard statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getReadyForSurgeryPatients(req, res) {
    try {
      const readyPatients = await prisma.ipdAdmission.findMany({
        where: {
          status: 'READY_FOR_SURGERY'
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              patientNumber: true,
              mrn: true,
              phone: true,
              email: true,
              address: true
            }
          },
          surgeryTypeDetail: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          surgeon: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true
            }
          },
          otRoom: {
            select: {
              id: true,
              roomNumber: true,
              roomName: true
            }
          },
          lens: {
            select: {
              id: true,
              lensName: true,
              lensType: true,
              manufacturer: true
            }
          }
        },
        orderBy: {
          admissionDate: 'asc'
        }
      });

      res.json({
        success: true,
        message: 'Ready for surgery patients fetched successfully',
        data: readyPatients
      });

    } catch (error) {
      console.error('❌ Error fetching ready for surgery patients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch ready for surgery patients',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get patients with surgery already started
   */
  async getSurgeryStartedPatients(req, res) {
    try {
      const startedPatients = await prisma.ipdAdmission.findMany({
        where: {
          status: 'SURGERY_STARTED'
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              patientNumber: true,
              mrn: true,
              phone: true,
              email: true,
              address: true
            }
          },
          surgeryTypeDetail: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          surgeon: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true
            }
          },
          otRoom: {
            select: {
              id: true,
              roomNumber: true,
              roomName: true
            }
          },
          lens: {
            select: {
              id: true,
              lensName: true,
              lensType: true,
              manufacturer: true
            }
          }
        },
        orderBy: {
          surgeryStartTime: 'asc'
        }
      });

      res.json({
        success: true,
        message: 'Surgery started patients fetched successfully',
        data: startedPatients
      });

    } catch (error) {
      console.error('❌ Error fetching surgery started patients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch surgery started patients',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getPatientRecentExamination(req, res) {
    try {
      const { patientId } = req.params;

      console.log('🔍 getPatientRecentExamination - patientId:', patientId);

      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required'
        });
      }

      // Get the most recent patient visit with examinations
      const recentVisit = await prisma.patientVisit.findFirst({
        where: {
          patientId: patientId
        },
        include: {
          optometristExamination: true,
          examinations: true
        },
        orderBy: {
          visitDate: 'desc'
        }
      });

      console.log('📋 Recent visit found:', recentVisit ? 'Yes' : 'No');

      if (!recentVisit) {
        return res.status(404).json({
          success: false,
          message: 'No examination records found for this patient'
        });
      }

      res.json({
        success: true,
        message: 'Recent examination data fetched successfully',
        data: recentVisit
      });

    } catch (error) {
      console.error('❌ Error fetching patient examination:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch patient examination data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getAvailableEquipment(req, res) {
    try {
      const availableEquipment = await prisma.equipment.findMany({
        where: {
          currentStock: {
            gt: 0
          }
        },
        select: {
          id: true,
          name: true,
          category: true,
          currentStock: true,
          unit: true,
          brand: true
        },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });

      // Transform data to match frontend expectations
      const formattedEquipment = availableEquipment.map(equipment => ({
        ...equipment,
        availableStock: equipment.currentStock
      }));

      res.json({
        success: true,
        message: 'Available equipment fetched successfully',
        data: formattedEquipment
      });

    } catch (error) {
      console.error('❌ Error fetching available equipment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available equipment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async startSurgery(req, res) {
    try {
      const { ipdAdmissionId, surgicalNotes, equipmentUsed } = req.body;

      if (!ipdAdmissionId || !surgicalNotes) {
        return res.status(400).json({
          success: false,
          message: 'IPD Admission ID and surgical notes are required'
        });
      }

      // Check if admission exists and is ready for surgery
      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: ipdAdmissionId },
        include: { patient: true }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD Admission not found'
        });
      }

      if (admission.status !== 'READY_FOR_SURGERY') {
        return res.status(400).json({
          success: false,
          message: 'Patient is not ready for surgery'
        });
      }

      // Prepare journey notes update
      const existingNotes = admission.journeyNotes || {};
      const surgeryStartNotes = {
        ...existingNotes,
        surgeryStarted: {
          timestamp: new Date().toISOString(),
          surgicalNotes,
          equipmentUsed: equipmentUsed || [],
          startedBy: req.user?.id || 'system'
        }
      };

      // Update admission status and add surgical notes
      const updatedAdmission = await prisma.ipdAdmission.update({
        where: { id: ipdAdmissionId },
        data: {
          status: 'SURGERY_STARTED',
          journeyNotes: surgeryStartNotes,
          surgeryStartTime: new Date()
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientNumber: true
            }
          }
        }
      });

      // Emit WebSocket event for real-time updates
      if (req.io) {
        req.io.emit('surgery:started', {
          admissionId: updatedAdmission.id,
          status: updatedAdmission.status,
          patientId: updatedAdmission.patient?.id,
          patientName: `${updatedAdmission.patient?.firstName} ${updatedAdmission.patient?.lastName}`,
          surgeryStartTime: updatedAdmission.surgeryStartTime
        });
        console.log('📡 Surgery started event emitted:', updatedAdmission.id);
      }

      res.json({
        success: true,
        message: 'Surgery started successfully',
        data: {
          admissionId: updatedAdmission.id,
          status: updatedAdmission.status,
          patient: updatedAdmission.patient,
          surgeryStartTime: updatedAdmission.surgeryStartTime
        }
      });

    } catch (error) {
      console.error('❌ Error starting surgery:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start surgery',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async completeSurgery(req, res) {
    try {
      const { ipdAdmissionId, finalNotes } = req.body;

      if (!ipdAdmissionId) {
        return res.status(400).json({
          success: false,
          message: 'IPD Admission ID is required'
        });
      }

      // Check if admission exists and surgery is started
      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: ipdAdmissionId },
        include: { patient: true }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD Admission not found'
        });
      }

      if (admission.status !== 'SURGERY_STARTED') {
        return res.status(400).json({
          success: false,
          message: 'Surgery has not been started for this patient'
        });
      }

      // Calculate surgery duration
      const surgeryDuration = admission.surgeryStartTime
        ? Math.floor((new Date() - new Date(admission.surgeryStartTime)) / 1000 / 60) // in minutes
        : null;

      // Prepare journey notes update
      const existingNotes = admission.journeyNotes || {};
      const surgeryCompletedNotes = {
        ...existingNotes,
        surgeryCompleted: {
          timestamp: new Date().toISOString(),
          finalNotes: finalNotes || '',
          surgeryDuration: surgeryDuration,
          completedBy: req.user?.id || 'system'
        }
      };

      // Update admission status to completed
      const updatedAdmission = await prisma.ipdAdmission.update({
        where: { id: ipdAdmissionId },
        data: {
          status: 'SURGERY_COMPLETED',
          journeyNotes: surgeryCompletedNotes,
          surgeryEndTime: new Date(),
          surgeryCompleted: true,
          surgeryCompletedAt: new Date()
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientNumber: true
            }
          }
        }
      });

      // Emit WebSocket event for real-time updates
      if (req.io) {
        req.io.emit('surgery:completed', {
          admissionId: updatedAdmission.id,
          status: updatedAdmission.status,
          patientId: updatedAdmission.patient?.id,
          patientName: `${updatedAdmission.patient?.firstName} ${updatedAdmission.patient?.lastName}`,
          surgeryEndTime: updatedAdmission.surgeryEndTime,
          surgeryDuration: surgeryDuration
        });
        console.log('📡 Surgery completed event emitted:', updatedAdmission.id);
      }

      res.json({
        success: true,
        message: 'Surgery completed successfully',
        data: {
          admissionId: updatedAdmission.id,
          status: updatedAdmission.status,
          patient: updatedAdmission.patient,
          surgeryEndTime: updatedAdmission.surgeryEndTime,
          surgeryDuration: surgeryDuration
        }
      });

    } catch (error) {
      console.error('❌ Error completing surgery:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete surgery',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get completed surgeries for surgeon dashboard
   */
  async getCompletedSurgeries(req, res) {
    try {
      const completedSurgeries = await prisma.ipdAdmission.findMany({
        where: {
          status: 'SURGERY_COMPLETED'
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              patientNumber: true,
              phone: true,
              email: true,
              address: true
            }
          },
          surgeryTypeDetail: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          lens: {
            select: {
              id: true,
              lensName: true,
              lensType: true,
              lensCategory: true,
              manufacturer: true
            }
          }
        },
        orderBy: {
          surgeryEndTime: 'desc'
        }
      });

      res.json({
        success: true,
        message: 'Completed surgeries fetched successfully',
        data: completedSurgeries
      });

    } catch (error) {
      console.error('❌ Error fetching completed surgeries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch completed surgeries',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Give anesthesia to patient
   * POST /api/ipd/admissions/:admissionId/give-anesthesia
   */
  async giveAnesthesia(req, res) {
    try {
      const { admissionId } = req.params;
      const performedBy = req.user.id;

      // Get admission
      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId },
        select: {
          id: true,
          requiresAnesthesia: true,
          anesthesiaGiven: true,
          patient: {
            select: {
              firstName: true,
              lastName: true,
              mrn: true
            }
          },
          surgeryTypeDetail: {
            select: {
              name: true
            }
          }
        }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      if (!admission.requiresAnesthesia) {
        return res.status(400).json({
          success: false,
          message: 'This patient does not require anesthesia'
        });
      }

      if (admission.anesthesiaGiven) {
        return res.status(400).json({
          success: false,
          message: 'Anesthesia has already been given to this patient'
        });
      }

      // Update admission to mark anesthesia as given
      const updatedAdmission = await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: {
          anesthesiaGiven: true,
          updatedAt: new Date()
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              mrn: true,
              patientNumber: true
            }
          },
          surgeryTypeDetail: {
            select: {
              name: true
            }
          }
        }
      });

      console.log(`✅ Anesthesia marked as given for patient ${admission.patient.firstName} ${admission.patient.lastName} by staff ${performedBy}`);

      // Emit WebSocket event for real-time updates
      if (req.io) {
        req.io.emit('surgery:anesthesia-given', {
          admissionId: updatedAdmission.id,
          patientId: updatedAdmission.patient?.id,
          patientName: `${updatedAdmission.patient?.firstName} ${updatedAdmission.patient?.lastName}`,
          anesthesiaGiven: true
        });
        console.log('📡 Anesthesia given event emitted:', updatedAdmission.id);
      }

      res.json({
        success: true,
        message: 'Anesthesia marked as given successfully',
        data: updatedAdmission
      });

    } catch (error) {
      console.error('❌ Error giving anesthesia:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark anesthesia as given',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Toggle insurance applicable status for an IPD admission
   */
  async toggleInsuranceApplicable(req, res) {
    try {
      const { admissionId } = req.params;
      const { insuranceApplicable } = req.body;

      console.log('🔄 Toggling insurance applicable for admission:', admissionId, 'to:', insuranceApplicable);

      // Validate admission exists
      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD admission not found'
        });
      }

      // Toggle or set the insurance applicable status
      const newStatus = insuranceApplicable !== undefined 
        ? insuranceApplicable 
        : !admission.insuranceApplicable;

      const updatedAdmission = await prisma.ipdAdmission.update({
        where: { id: admissionId },
        data: {
          insuranceApplicable: newStatus
        },
        select: {
          id: true,
          admissionNumber: true,
          insuranceApplicable: true,
          claimInitiated: true,
          claimStatus: true,
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true
            }
          }
        }
      });

      console.log(`✅ Insurance applicable ${newStatus ? 'enabled' : 'disabled'} for admission ${admissionId}`);

      res.json({
        success: true,
        message: `Insurance applicable ${newStatus ? 'enabled' : 'disabled'} successfully`,
        data: updatedAdmission
      });

    } catch (error) {
      console.error('❌ Error toggling insurance applicable:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle insurance applicable status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

}

module.exports = new IpdController();