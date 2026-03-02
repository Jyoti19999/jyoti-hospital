// src/controllers/surgeryTypeController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Surgery Type Controller
 * Handles surgery type, packages, lens management, and fitness investigations
 */
class SurgeryTypeController {

  /**
   * Get all active surgery types
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSurgeryTypes(req, res) {
    try {
      console.log('📋 Getting all surgery types');

      const surgeryTypes = await prisma.surgeryType.findMany({
        where: { isActive: true },
        include: {
          packages: {
            where: { isActive: true },
            select: {
              id: true,
              packageName: true,
              packageCost: true,
              isRecommended: true,
              priority: true
            }
          },
          _count: {
            select: {
              packages: { where: { isActive: true } },
              ipdAdmissions: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      res.json({
        success: true,
        message: 'Surgery types retrieved successfully',
        data: surgeryTypes
      });

    } catch (error) {
      console.error('❌ Error getting surgery types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get surgery types',
        error: error.message
      });
    }
  }

  /**
   * Get comprehensive surgery types for admin with statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAdminSurgeryTypes(req, res) {
    try {
      console.log('📋 Getting admin surgery types with statistics');
      
      const { page = 1, limit = 10, search, category, sortBy = 'name', sortOrder = 'asc', includeInvestigations } = req.query;
      
      // Build where clause
      const where = {
        isActive: true // Filter for active surgery types only
      };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (category) {
        where.category = category;
      }

      // Get total count
      const totalCount = await prisma.surgeryType.count({ where });
      
      // Build orderBy clause
      const orderBy = {};
      orderBy[sortBy] = sortOrder;
      
      // Build include clause based on includeInvestigations parameter
      const include = {
        packages: {
          select: {
            id: true,
            packageName: true,
            packageCost: true,
            isRecommended: true,
            isActive: true
          }
        },
        _count: {
          select: {
            packages: true,
            ipdAdmissions: true,
            ophthalmologistExams: true
          }
        }
      };

      // For investigations, we'll fetch them separately using the investigationIds array
      // No need to include complex junction table relations
      
      const surgeryTypes = await prisma.surgeryType.findMany({
        where,
        include,
        orderBy,
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });

      // Get category statistics
      const categoryStats = await prisma.surgeryType.groupBy({
        by: ['category'],
        _count: { id: true },
        where: { isActive: true }
      });

      res.json({
        success: true,
        message: 'Admin surgery types retrieved successfully',
        data: surgeryTypes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        categoryStats
      });

    } catch (error) {
      console.error('❌ Error getting admin surgery types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get admin surgery types',
        error: error.message
      });
    }
  }

  /**
   * Update surgery type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateSurgeryType(req, res) {
    try {
      const { id } = req.params;
      console.log(`✏️ Updating surgery type: ${id}`);

      const {
        name,
        code,
        category,
        description,
        averageDuration,
        complexityLevel,
        requiresAnesthesia,
        isOutpatient,
        requiresAdmission,
        requiredEquipment,
        preOpRequirements,
        postOpInstructions,
        followUpSchedule,
        baseCost,
        additionalCharges,
        investigationIds,
        isActive
      } = req.body;

      const updatedSurgeryType = await prisma.surgeryType.update({
        where: { id },
        data: {
          name,
          code,
          category,
          description,
          averageDuration: averageDuration ? parseInt(averageDuration) : null,
          complexityLevel,
          requiresAnesthesia,
          isOutpatient: isOutpatient !== undefined ? isOutpatient : true,
          requiresAdmission: requiresAdmission !== undefined ? requiresAdmission : false,
          requiredEquipment,
          preOpRequirements,
          postOpInstructions,
          followUpSchedule,
          baseCost: baseCost ? parseFloat(baseCost) : null,
          additionalCharges,
          investigationIds: investigationIds || [],
          isActive: isActive !== undefined ? isActive : true,
          updatedAt: new Date()
        },
        include: {
          packages: true
        }
      });

      res.json({
        success: true,
        message: 'Surgery type updated successfully',
        data: updatedSurgeryType
      });

    } catch (error) {
      console.error('❌ Error updating surgery type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update surgery type',
        error: error.message
      });
    }
  }

  /**
   * Delete surgery type (hard delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteSurgeryType(req, res) {
    try {
      const { id } = req.params;
      console.log(`🗑️ Hard deleting surgery type: ${id}`);

      // Check if surgery type has any related records that would prevent deletion
      const [admissionCount, packageCount, examCount] = await Promise.all([
        // Check IPD admissions
        prisma.ipdAdmission.count({
          where: { surgeryTypeId: id }
        }),
        // Check surgery packages
        prisma.surgeryPackage.count({
          where: { surgeryTypeId: id }
        }),
        // Check ophthalmologist examinations
        prisma.ophthalmologistExamination.count({
          where: { surgeryTypeId: id }
        })
      ]);

      if (admissionCount > 0 || packageCount > 0 || examCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete surgery type as it has related records',
          details: {
            admissions: admissionCount,
            packages: packageCount,
            examinations: examCount
          }
        });
      }

      // Hard delete surgery type
      const deletedSurgeryType = await prisma.surgeryType.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Surgery type permanently deleted successfully',
        data: deletedSurgeryType
      });

    } catch (error) {
      console.error('❌ Error deleting surgery type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete surgery type',
        error: error.message
      });
    }
  }

  /**
   * Assign investigations to a surgery type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async assignInvestigationsToSurgeryType(req, res) {
    try {
      const { id } = req.params;
      const { investigationIds } = req.body;
      console.log(`🔗 Assigning investigations to surgery type: ${id}`);

      // Validate required fields
      if (!investigationIds || !Array.isArray(investigationIds)) {
        return res.status(400).json({
          success: false,
          message: 'Investigation IDs array is required'
        });
      }

      // Check if surgery type exists
      const surgeryType = await prisma.surgeryType.findUnique({
        where: { id }
      });

      if (!surgeryType) {
        return res.status(404).json({
          success: false,
          message: 'Surgery type not found'
        });
      }

      // Validate investigations exist and are active
      const investigations = await prisma.fitnessInvestigation.findMany({
        where: {
          id: { in: investigationIds },
          isActive: true
        }
      });

      if (investigations.length !== investigationIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more investigations not found or inactive'
        });
      }

      // Update surgery type with new investigation IDs array
      const updatedSurgeryType = await prisma.surgeryType.update({
        where: { id },
        data: {
          investigationIds,
          updatedAt: new Date()
        }
      });

      // Fetch investigation details for response
      const investigationDetails = await prisma.fitnessInvestigation.findMany({
        where: {
          id: { in: investigationIds },
          isActive: true
        }
      });

      // Add investigations to response
      updatedSurgeryType.investigations = investigationDetails;

      console.log(`✅ ${investigationIds.length} investigations assigned to surgery type successfully`);

      res.json({
        success: true,
        message: 'Investigations assigned to surgery type successfully',
        data: updatedSurgeryType
      });

    } catch (error) {
      console.error('❌ Error assigning investigations to surgery type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign investigations to surgery type',
        error: error.message
      });
    }
  }

  /**
   * Remove investigations from a surgery type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async removeInvestigationsFromSurgeryType(req, res) {
    try {
      const { id } = req.params;
      const { investigationIds } = req.body;
      console.log(`🔗 Removing investigations from surgery type: ${id}`);

      // Validate required fields
      if (!investigationIds || !Array.isArray(investigationIds)) {
        return res.status(400).json({
          success: false,
          message: 'Investigation IDs array is required'
        });
      }

      // Check if surgery type exists
      const surgeryType = await prisma.surgeryType.findUnique({
        where: { id }
      });

      if (!surgeryType) {
        return res.status(404).json({
          success: false,
          message: 'Surgery type not found'
        });
      }

      // Get current surgery type
      const currentSurgeryType = await prisma.surgeryType.findUnique({
        where: { id },
        select: { investigationIds: true }
      });

      // Remove specific investigation IDs from the array
      const newInvestigationIds = currentSurgeryType.investigationIds.filter(
        invId => !investigationIds.includes(invId)
      );

      // Update surgery type with filtered investigation IDs
      const updatedSurgeryType = await prisma.surgeryType.update({
        where: { id },
        data: {
          investigationIds: newInvestigationIds,
          updatedAt: new Date()
        }
      });

      // Fetch remaining investigation details for response
      const remainingInvestigations = await prisma.fitnessInvestigation.findMany({
        where: {
          id: { in: newInvestigationIds },
          isActive: true
        }
      });

      // Add investigations to response
      updatedSurgeryType.investigations = remainingInvestigations;

      console.log(`✅ ${investigationIds.length} investigations removed from surgery type successfully`);

      res.json({
        success: true,
        message: 'Investigations removed from surgery type successfully',
        data: updatedSurgeryType
      });

    } catch (error) {
      console.error('❌ Error removing investigations from surgery type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove investigations from surgery type',
        error: error.message
      });
    }
  }

  /**
   * Get all surgery packages with filtering and pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllSurgeryPackages(req, res) {
    try {
      console.log('📋 Getting all surgery packages');
      
      const { page = 1, limit = 10, search, category, surgeryTypeId, minCost, maxCost, sortBy = 'packageName', sortOrder = 'asc' } = req.query;
      
      // Build where clause
      const where = {};
      if (search) {
        where.OR = [
          { packageName: { contains: search, mode: 'insensitive' } },
          { packageCode: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (category) {
        where.surgeryCategory = category;
      }
      if (surgeryTypeId) {
        where.surgeryTypeId = surgeryTypeId;
      }
      if (minCost || maxCost) {
        where.packageCost = {};
        if (minCost) where.packageCost.gte = parseFloat(minCost);
        if (maxCost) where.packageCost.lte = parseFloat(maxCost);
      }

      // Get total count
      const totalCount = await prisma.surgeryPackage.count({ where });
      
      // Build orderBy clause
      const orderBy = {};
      orderBy[sortBy] = sortOrder;
      
      const packages = await prisma.surgeryPackage.findMany({
        where,
        include: {
          surgeryType: {
            select: {
              id: true,
              name: true,
              category: true,
              code: true
            }
          },
          defaultLens: {
            select: {
              id: true,
              lensName: true,
              lensCode: true,
              manufacturer: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });

      // Get statistics
      const packageStats = await prisma.surgeryPackage.aggregate({
        where: { isActive: true },
        _avg: { packageCost: true },
        _min: { packageCost: true },
        _max: { packageCost: true },
        _count: { id: true }
      });

      const categoryStats = await prisma.surgeryPackage.groupBy({
        by: ['surgeryCategory'],
        _count: { id: true },
        _avg: { packageCost: true },
        where: { isActive: true }
      });

      res.json({
        success: true,
        message: 'Surgery packages retrieved successfully',
        data: packages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        statistics: {
          packageStats,
          categoryStats
        }
      });

    } catch (error) {
      console.error('❌ Error getting surgery packages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get surgery packages',
        error: error.message
      });
    }
  }

  /**
   * Update surgery package
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateSurgeryPackage(req, res) {
    try {
      const { id } = req.params;
      console.log(`✏️ Updating surgery package: ${id}`);
      console.log('📝 Update data received:', req.body);

      const {
        surgeryTypeId,
        packageName,
        packageCode,
        description,
        surgeryCategory,
        includedServices,
        excludedServices,
        defaultLensId,
        packageCost,
        lensUpgradeCost,
        additionalCharges,
        discountEligible,
        warrantyPeriod,
        followUpVisits,
        emergencySupport,
        isActive,
        isRecommended,
        priority
      } = req.body;

      // Prepare update data, only including defined fields
      const updateData = {
        updatedAt: new Date()
      };

      // Only include surgeryTypeId if it's explicitly passed (for tagging functionality)
      if (surgeryTypeId !== undefined) {
        updateData.surgeryTypeId = surgeryTypeId;
      }

      // Handle lens information if defaultLensId is being updated
      if (defaultLensId !== undefined) {
        updateData.defaultLensId = defaultLensId;
        
        if (defaultLensId) {
          try {
            const lens = await prisma.lens.findUnique({
              where: { id: defaultLensId },
              select: { lensName: true }
            });
            updateData.defaultLensName = lens?.lensName || null;
          } catch (error) {
            console.log('⚠️ Could not fetch lens name:', error.message);
            updateData.defaultLensName = null;
          }
        } else {
          updateData.defaultLensName = null;
        }
      }

      // Add other fields only if they are defined
      if (packageName !== undefined) updateData.packageName = packageName;
      if (packageCode !== undefined) updateData.packageCode = packageCode;
      if (description !== undefined) updateData.description = description;
      if (surgeryCategory !== undefined) updateData.surgeryCategory = surgeryCategory;
      if (includedServices !== undefined) updateData.includedServices = includedServices;
      if (excludedServices !== undefined) updateData.excludedServices = excludedServices;
      if (packageCost !== undefined) updateData.packageCost = parseFloat(packageCost);
      if (lensUpgradeCost !== undefined) updateData.lensUpgradeCost = lensUpgradeCost ? parseFloat(lensUpgradeCost) : 0;
      if (additionalCharges !== undefined) updateData.additionalCharges = additionalCharges;
      if (discountEligible !== undefined) updateData.discountEligible = discountEligible;
      if (warrantyPeriod !== undefined) updateData.warrantyPeriod = warrantyPeriod ? parseInt(warrantyPeriod) : null;
      if (followUpVisits !== undefined) updateData.followUpVisits = followUpVisits ? parseInt(followUpVisits) : null;
      if (emergencySupport !== undefined) updateData.emergencySupport = emergencySupport;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isRecommended !== undefined) updateData.isRecommended = isRecommended;
      if (priority !== undefined) updateData.priority = priority ? parseInt(priority) : 0;
      if (req.body.packageBreakdown !== undefined) updateData.packageBreakdown = req.body.packageBreakdown;

      console.log('📝 Final update data:', updateData);

      const updatedPackage = await prisma.surgeryPackage.update({
        where: { id },
        data: updateData,
        include: {
          surgeryType: {
            select: {
              id: true,
              name: true,
              category: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Surgery package updated successfully',
        data: updatedPackage
      });

    } catch (error) {
      console.error('❌ Error updating surgery package:', error);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));
      
      res.status(500).json({
        success: false,
        message: 'Failed to update surgery package',
        error: error.message
      });
    }
  }

  /**
   * Delete surgery package (hard delete with dependency check)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteSurgeryPackage(req, res) {
    try {
      const { id } = req.params;
      console.log(`🗑️ Deleting surgery package: ${id}`);

      // Check for dependencies before hard delete
      const [admissionCount] = await Promise.all([
        prisma.ipdAdmission.count({ where: { surgeryPackageId: id } })
      ]);

      if (admissionCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete surgery package as it is being used in patient admissions',
          details: {
            admissions: admissionCount
          }
        });
      }

      // Hard delete surgery package
      const deletedPackage = await prisma.surgeryPackage.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Surgery package deleted successfully',
        data: deletedPackage
      });

    } catch (error) {
      console.error('❌ Error deleting surgery package:', error);
      
      // Handle specific Prisma errors
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Surgery package not found'
        });
      }
      
      if (error.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete surgery package as it has related records'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete surgery package',
        error: error.message
      });
    }
  }

  /**
   * Get all fitness investigations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFitnessInvestigations(req, res) {
    try {
      console.log('📋 Getting all fitness investigations');
      
      const { page = 1, limit = 10, search, category, sortBy = 'investigationName', sortOrder = 'asc' } = req.query;
      
      // Build where clause
      const where = { isActive: true };
      if (search) {
        where.OR = [
          { investigationName: { contains: search, mode: 'insensitive' } },
          { investigationCode: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (category) {
        where.category = category;
      }

      // Get total count
      const totalCount = await prisma.fitnessInvestigation.count({ where });
      
      // Build orderBy clause
      const orderBy = {};
      orderBy[sortBy] = sortOrder;
      
      const investigations = await prisma.fitnessInvestigation.findMany({
        where,
        include: {
          _count: {
            select: {
              fitnessResults: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });

      // Get category statistics
      const categoryStats = await prisma.fitnessInvestigation.groupBy({
        by: ['category'],
        _count: { id: true },
        _avg: { cost: true },
        where: { isActive: true }
      });

      res.json({
        success: true,
        message: 'Fitness investigations retrieved successfully',
        data: investigations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        categoryStats
      });

    } catch (error) {
      console.error('❌ Error getting fitness investigations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get fitness investigations',
        error: error.message
      });
    }
  }

  /**
   * Create a new fitness investigation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createFitnessInvestigation(req, res) {
    try {
      console.log('➕ Creating fitness investigation');
      
      const {
        investigationName,
        investigationCode,
        category,
        description,
        cost,
        validityDays,
        processingTime,
        fastingRequired,
        isActive = true
      } = req.body;

      // Validate required fields
      if (!investigationName) {
        return res.status(400).json({
          success: false,
          message: 'Investigation name is required'
        });
      }

      const investigation = await prisma.fitnessInvestigation.create({
        data: {
          investigationName: investigationName.trim(),
          investigationCode: investigationCode?.trim(),
          category: category?.trim(),
          description: description?.trim(),
          cost: cost ? parseFloat(cost) : null,
          validityDays: validityDays ? parseInt(validityDays) : null,
          processingTime: processingTime?.trim(),
          fastingRequired: fastingRequired || false,
          isActive
          // Note: createdAt and updatedAt are automatically handled by Prisma
        }
      });

      res.status(201).json({
        success: true,
        message: 'Fitness investigation created successfully',
        data: investigation
      });

    } catch (error) {
      console.error('❌ Error creating fitness investigation:', error);
      
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Investigation with this name or code already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create fitness investigation',
        error: error.message
      });
    }
  }

  /**
   * Update a fitness investigation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateFitnessInvestigation(req, res) {
    try {
      const { id } = req.params;
      console.log(`✏️ Updating fitness investigation: ${id}`);

      const {
        investigationName,
        investigationCode,
        category,
        description,
        cost,
        validityDays,
        processingTime,
        fastingRequired,
        isActive
      } = req.body;

      const updatedInvestigation = await prisma.fitnessInvestigation.update({
        where: { id },
        data: {
          investigationName: investigationName?.trim(),
          investigationCode: investigationCode?.trim(),
          category: category?.trim(),
          description: description?.trim(),
          cost: cost ? parseFloat(cost) : null,
          validityDays: validityDays ? parseInt(validityDays) : null,
          processingTime: processingTime?.trim(),
          fastingRequired: fastingRequired !== undefined ? fastingRequired : undefined,
          isActive: isActive !== undefined ? isActive : undefined,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Fitness investigation updated successfully',
        data: updatedInvestigation
      });

    } catch (error) {
      console.error('❌ Error updating fitness investigation:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Fitness investigation not found'
        });
      }
      
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Investigation with this name or code already exists'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update fitness investigation',
        error: error.message
      });
    }
  }

  /**
   * Delete a fitness investigation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteFitnessInvestigation(req, res) {
    try {
      const { id } = req.params;
      console.log(`🗑️ Deleting fitness investigation: ${id}`);

      // Check if investigation is being used
      const [resultsCount] = await Promise.all([
        prisma.fitnessInvestigationResult.count({ where: { investigationId: id } })
      ]);

      if (resultsCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete investigation as it has related results',
          details: {
            results: resultsCount
          }
        });
      }

      // Hard delete investigation
      const deletedInvestigation = await prisma.fitnessInvestigation.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Fitness investigation deleted successfully',
        data: deletedInvestigation
      });

    } catch (error) {
      console.error('❌ Error deleting fitness investigation:', error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Fitness investigation not found'
        });
      }
      
      if (error.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete investigation as it has related records'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete fitness investigation',
        error: error.message
      });
    }
  }

  /**
   * Get surgery type dropdown options for ophthalmologist examination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSurgeryTypeDropdown(req, res) {
    try {
      console.log('📋 Getting surgery type dropdown options');

      const surgeryTypes = await prisma.surgeryType.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          category: true,
          description: true,
          averageDuration: true,
          complexityLevel: true,
          requiresAnesthesia: true,
          isOutpatient: true,
          requiresAdmission: true
        },
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ]
      });

      // Group by category for better UI organization
      const groupedByCategory = surgeryTypes.reduce((acc, surgeryType) => {
        const category = surgeryType.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(surgeryType);
        return acc;
      }, {});

      res.json({
        success: true,
        message: 'Surgery type dropdown options retrieved successfully',
        data: {
          surgeryTypes,
          groupedByCategory
        }
      });

    } catch (error) {
      console.error('❌ Error getting surgery type dropdown:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get surgery type dropdown',
        error: error.message
      });
    }
  }

  /**
   * Create a new surgery type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createSurgeryType(req, res) {
    try {
      console.log('➕ Creating new surgery type');

      const {
        name,
        code,
        category,
        description,
        averageDuration,
        complexityLevel,
        requiresAnesthesia,
        isOutpatient,
        requiresAdmission,
        requiredEquipment,
        preOpRequirements,
        postOpInstructions,
        followUpSchedule,
        baseCost,
        additionalCharges
      } = req.body;

      const surgeryType = await prisma.surgeryType.create({
        data: {
          name,
          code,
          category,
          description,
          averageDuration: averageDuration ? parseInt(averageDuration) : null,
          complexityLevel,
          requiresAnesthesia,
          isOutpatient: isOutpatient !== undefined ? isOutpatient : true,
          requiresAdmission: requiresAdmission !== undefined ? requiresAdmission : false,
          requiredEquipment,
          preOpRequirements,
          postOpInstructions,
          followUpSchedule,
          baseCost: baseCost ? parseFloat(baseCost) : null,
          additionalCharges,
          createdBy: req.user?.id
        }
      });

      res.status(201).json({
        success: true,
        message: 'Surgery type created successfully',
        data: surgeryType
      });

    } catch (error) {
      console.error('❌ Error creating surgery type:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create surgery type',
        error: error.message
      });
    }
  }

  /**
   * Create a new surgery package
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createSurgeryPackage(req, res) {
    try {
      console.log('➕ Creating new surgery package');
      console.log('📝 Request body:', req.body);

      const {
        surgeryTypeId,
        packageName,
        packageCode,
        description,
        includedServices,
        excludedServices,
        defaultLensId,
        packageCost,
        lensUpgradeCost,
        additionalCharges,
        warrantyPeriod,
        followUpVisits,
        emergencySupport,
        isRecommended,
        priority
      } = req.body;

      // Validate required fields
      if (!packageName || packageName.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Package name is required'
        });
      }

      if (!packageCost || isNaN(parseFloat(packageCost))) {
        return res.status(400).json({
          success: false,
          message: 'Valid package cost is required'
        });
      }

      // Get lens information if defaultLensId is provided
      let defaultLensName = null;
      if (defaultLensId) {
        try {
          const lens = await prisma.lens.findUnique({
            where: { id: defaultLensId },
            select: { lensName: true }
          });
          defaultLensName = lens?.lensName || null;
        } catch (error) {
          console.log('⚠️ Could not fetch lens name:', error.message);
        }
      }

      const surgeryPackage = await prisma.surgeryPackage.create({
        data: {
          surgeryTypeId,
          packageName: packageName.trim(),
          packageCode,
          description,
          includedServices,
          excludedServices,
          defaultLensId,
          defaultLensName,
          packageCost: parseFloat(packageCost),
          lensUpgradeCost: lensUpgradeCost ? parseFloat(lensUpgradeCost) : 0,
          additionalCharges,
          warrantyPeriod: warrantyPeriod ? parseInt(warrantyPeriod) : null,
          followUpVisits: followUpVisits ? parseInt(followUpVisits) : null,
          emergencySupport: emergencySupport !== undefined ? emergencySupport : false,
          isRecommended: isRecommended !== undefined ? isRecommended : false,
          priority: priority ? parseInt(priority) : 0,
          createdBy: req.user?.id
        },
        include: {
          surgeryType: true,
          defaultLens: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Surgery package created successfully',
        data: surgeryPackage
      });

    } catch (error) {
      console.error('❌ Error creating surgery package:', error);
      
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'A package with this name already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create surgery package',
        error: error.message
      });
    }
  }

  /**
   * Get all available lenses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getLenses(req, res) {
    try {
      console.log('📋 Getting all lenses');

      const { category, type, isAvailable } = req.query;
      
      const filters = {
        isActive: true
      };

      if (category) filters.lensCategory = category;
      if (type) filters.lensType = type;
      if (isAvailable !== undefined) filters.isAvailable = isAvailable === 'true';

      const lenses = await prisma.lens.findMany({
        where: filters,
        orderBy: [
          { lensCategory: 'asc' },
          { lensType: 'asc' },
          { lensName: 'asc' }
        ]
      });

      res.json({
        success: true,
        message: 'Lenses retrieved successfully',
        data: lenses
      });

    } catch (error) {
      console.error('❌ Error getting lenses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get lenses',
        error: error.message
      });
    }
  }

  /**
   * Create a new lens
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createLens(req, res) {
    try {
      console.log('➕ Creating new lens');

      const {
        lensName,
        lensCode,
        manufacturer,
        model,
        lensType,
        lensCategory,
        material,
        power,
        diameter,
        features,
        benefits,
        suitableFor,
        contraindications,
        lensoCost,
        patientCost,
        insuranceCoverage,
        stockQuantity,
        reorderLevel,
        fdaApproved,
        ceMarked,
        qualityCertification
      } = req.body;

      const lens = await prisma.lens.create({
        data: {
          lensName,
          lensCode,
          manufacturer,
          model,
          lensType,
          lensCategory,
          material,
          power,
          diameter,
          features,
          benefits,
          suitableFor,
          contraindications,
          lensoCost: parseFloat(lensoCost),
          patientCost: parseFloat(patientCost),
          insuranceCoverage: insuranceCoverage ? parseFloat(insuranceCoverage) : 0,
          stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0,
          reorderLevel: reorderLevel ? parseInt(reorderLevel) : 5,
          fdaApproved: fdaApproved !== undefined ? fdaApproved : false,
          ceMarked: ceMarked !== undefined ? ceMarked : false,
          qualityCertification,
          createdBy: req.user?.id
        }
      });

      res.status(201).json({
        success: true,
        message: 'Lens created successfully',
        data: lens
      });

    } catch (error) {
      console.error('❌ Error creating lens:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create lens',
        error: error.message
      });
    }
  }

  /**
   * Get surgery type details with packages and requirements
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSurgeryTypeDetails(req, res) {
    try {
      const { surgeryTypeId } = req.params;
      console.log(`📋 Getting surgery type details: ${surgeryTypeId}`);

      const surgeryType = await prisma.surgeryType.findUnique({
        where: { id: surgeryTypeId },
        include: {
          packages: {
            where: { isActive: true },
            include: {
              defaultLens: true,
              alternativeLenses: {
                where: { isAvailable: true },
                include: {
                  lens: true
                },
                orderBy: { additionalCost: 'asc' }
              }
            },
            orderBy: [
              { isRecommended: 'desc' },
              { priority: 'asc' },
              { packageCost: 'asc' }
            ]
          },
          fitnessRequirements: true
        }
      });

      if (!surgeryType) {
        return res.status(404).json({
          success: false,
          message: 'Surgery type not found'
        });
      }

      res.json({
        success: true,
        message: 'Surgery type details retrieved successfully',
        data: surgeryType
      });

    } catch (error) {
      console.error('❌ Error getting surgery type details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get surgery type details',
        error: error.message
      });
    }
  }

  // Get Surgery Type Packages
  async getSurgeryTypePackages(req, res) {
    try {
      const { surgeryTypeId } = req.params;
      
      const packages = await prisma.surgeryPackage.findMany({
        where: {
          surgeryTypeId: surgeryTypeId
        },
        include: {
          surgeryType: {
            select: {
              id: true,
              name: true
            }
          },
          defaultLens: {
            select: {
              id: true,
              lensName: true,
              lensCode: true,
              manufacturer: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
        message: 'Surgery packages retrieved successfully',
        data: packages,
        count: packages.length
      });

    } catch (error) {
      console.error('❌ Error getting surgery packages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get surgery packages',
        error: error.message
      });
    }
  }

  // Get Surgery Fitness Requirements
  async getSurgeryFitnessRequirements(req, res) {
    try {
      const { surgeryTypeId } = req.params;
      
      const requirements = await prisma.surgeryInvestigationLink.findMany({
        where: {
          surgeryTypeId: surgeryTypeId
        },
        include: {
          investigation: {
            select: {
              id: true,
              name: true,
              description: true,
              cost: true,
              category: true
            }
          },
          surgeryType: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          investigation: {
            name: 'asc'
          }
        }
      });

      res.json({
        success: true,
        message: 'Surgery fitness requirements retrieved successfully',
        data: requirements,
        count: requirements.length
      });

    } catch (error) {
      console.error('❌ Error getting surgery fitness requirements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get surgery fitness requirements',
        error: error.message
      });
    }
  }

  // Get investigations for a specific surgery type
  async getSurgeryTypeInvestigations(req, res) {
    try {
      const { surgeryTypeId } = req.params;
      console.log(`📋 Getting investigations for surgery type: ${surgeryTypeId}`);

      // First get the surgery type to get investigation IDs
      const surgeryType = await prisma.surgeryType.findUnique({
        where: { id: surgeryTypeId },
        select: { investigationIds: true, name: true }
      });

      if (!surgeryType) {
        return res.status(404).json({
          success: false,
          message: 'Surgery type not found'
        });
      }

      const investigationIds = surgeryType.investigationIds || [];
      
      if (investigationIds.length === 0) {
        return res.json({
          success: true,
          message: 'No investigations found for this surgery type',
          data: [],
          count: 0
        });
      }

      // Get the investigations by IDs
      const investigations = await prisma.fitnessInvestigation.findMany({
        where: {
          id: { in: investigationIds },
          isActive: true
        },
        select: {
          id: true,
          investigationName: true,
          investigationCode: true,
          description: true,
          category: true,
          cost: true,
          normalRanges: true,
          units: true
        },
        orderBy: { investigationName: 'asc' }
      });

      console.log(`✅ Found ${investigations.length} investigations for surgery type: ${surgeryType.name}`);

      res.json({
        success: true,
        message: 'Surgery type investigations retrieved successfully',
        data: investigations,
        count: investigations.length,
        surgeryType: {
          id: surgeryTypeId,
          name: surgeryType.name
        }
      });

    } catch (error) {
      console.error('❌ Error getting surgery type investigations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get surgery type investigations',
        error: error.message
      });
    }
  }

  // Get All Lenses
  async getLenses(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        category = '',
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const orderBy = {};
      // Map the sortBy field to correct schema field
      if (sortBy === 'name') {
        orderBy['lensName'] = sortOrder;
      } else if (sortBy === 'cost') {
        orderBy['lensoCost'] = sortOrder;
      } else if (sortBy === 'category') {
        orderBy['lensCategory'] = sortOrder;
      } else {
        orderBy[sortBy] = sortOrder;
      }

      // Build where clause
      const where = {};
      
      if (search) {
        where.OR = [
          { lensName: { contains: search, mode: 'insensitive' } },
          { manufacturer: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (category) {
        where.lensCategory = category;
      }

      const [lenses, total] = await Promise.all([
        prisma.lens.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy
        }),
        prisma.lens.count({ where })
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        message: 'Lenses retrieved successfully',
        data: lenses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      });

    } catch (error) {
      console.error('❌ Error getting lenses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get lenses',
        error: error.message
      });
    }
  }

  // Create Lens
  async createLens(req, res) {
    try {
      const { name, description, cost, category } = req.body;

      // Validate required fields
      if (!name || !cost || !category) {
        return res.status(400).json({
          success: false,
          message: 'Name, cost, and category are required'
        });
      }

      // Check if lens already exists
      const existingLens = await prisma.lens.findFirst({
        where: { 
          lensName: { equals: name, mode: 'insensitive' }
        }
      });

      if (existingLens) {
        return res.status(409).json({
          success: false,
          message: 'Lens with this name already exists'
        });
      }

      const lens = await prisma.lens.create({
        data: {
          lensName: name.trim(),
          lensoCost: parseFloat(cost),
          patientCost: parseFloat(cost), // Set same as lens cost for now
          lensCategory: category.trim(),
          lensType: 'IOL' // Default type
        }
      });

      res.status(201).json({
        success: true,
        message: 'Lens created successfully',
        data: lens
      });

    } catch (error) {
      console.error('❌ Error creating lens:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create lens',
        error: error.message
      });
    }
  }

  /**
   * Get surgery types with their associated investigations (for Surgery Type Investigations tab)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSurgeryTypesWithInvestigations(req, res) {
    try {
      console.log('📋 Getting surgery types with investigations for admin view');

      const surgeryTypes = await prisma.surgeryType.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          code: true,
          category: true,
          investigationIds: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { name: 'asc' }
      });

      // Fetch all investigations to map with surgery types
      const allInvestigations = await prisma.fitnessInvestigation.findMany({
        where: { isActive: true },
        select: {
          id: true,
          investigationName: true,
          investigationCode: true,
          category: true
        }
      });

      // Create investigation lookup map
      const investigationMap = {};
      allInvestigations.forEach(inv => {
        investigationMap[inv.id] = inv;
      });

      // Enhance surgery types with investigation details
      const enhancedSurgeryTypes = surgeryTypes.map(surgeryType => {
        const investigations = surgeryType.investigationIds.map(invId => 
          investigationMap[invId]
        ).filter(Boolean); // Remove any null values if investigation not found

        return {
          ...surgeryType,
          investigations,
          investigationCount: investigations.length
        };
      });

      res.json({
        success: true,
        message: 'Surgery types with investigations retrieved successfully',
        data: enhancedSurgeryTypes
      });

    } catch (error) {
      console.error('❌ Error getting surgery types with investigations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get surgery types with investigations',
        error: error.message
      });
    }
  }

  /**
   * Get all lenses for dropdown
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getLenses(req, res) {
    try {
      console.log('🔍 Getting lenses with pagination and search');
      console.log('📝 Query parameters:', req.query);

      const {
        page = 1,
        limit = 10,
        search = '',
        lensType,
        lensCategory,
        manufacturer,
        minPrice,
        maxPrice
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause for filtering
      const whereClause = {
        isActive: true,
        isAvailable: true,
        AND: []
      };

      // Add search filter
      if (search && search.trim() !== '') {
        whereClause.AND.push({
          OR: [
            { lensName: { contains: search.trim(), mode: 'insensitive' } },
            { manufacturer: { contains: search.trim(), mode: 'insensitive' } },
            { model: { contains: search.trim(), mode: 'insensitive' } },
            { lensCode: { contains: search.trim(), mode: 'insensitive' } }
          ]
        });
      }

      // Add type filter
      if (lensType) {
        whereClause.AND.push({ lensType: lensType });
      }

      // Add category filter
      if (lensCategory) {
        whereClause.AND.push({ lensCategory: lensCategory });
      }

      // Add manufacturer filter
      if (manufacturer) {
        whereClause.AND.push({ 
          manufacturer: { contains: manufacturer, mode: 'insensitive' } 
        });
      }

      // Add price range filter
      if (minPrice || maxPrice) {
        const priceFilter = {};
        if (minPrice) priceFilter.gte = parseFloat(minPrice);
        if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
        whereClause.AND.push({ lensoCost: priceFilter });
      }

      // Remove empty AND array
      if (whereClause.AND.length === 0) {
        delete whereClause.AND;
      }

      console.log('📋 Filter conditions:', JSON.stringify(whereClause, null, 2));

      // Get total count for pagination
      const total = await prisma.lens.count({ where: whereClause });
      const totalPages = Math.ceil(total / parseInt(limit));

      // Get lenses with pagination
      const lenses = await prisma.lens.findMany({
        where: whereClause,
        select: {
          id: true,
          lensName: true,
          lensCode: true,
          manufacturer: true,
          model: true,
          lensType: true,
          lensCategory: true,
          lensoCost: true,
          patientCost: true,
          material: true,
          features: true,
          stockQuantity: true,
          fdaApproved: true,
          ceMarked: true,
        },
        orderBy: [
          { lensCategory: 'asc' },
          { lensName: 'asc' }
        ],
        skip,
        take: parseInt(limit)
      });

      console.log(`✅ Found ${lenses.length} lenses (Page ${page}/${totalPages})`);

      res.json({
        success: true,
        message: 'Lenses retrieved successfully',
        data: lenses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        statistics: {
          totalLenses: total,
          activeFilters: {
            search: search || null,
            lensType: lensType || null,
            lensCategory: lensCategory || null,
            manufacturer: manufacturer || null
          }
        }
      });

    } catch (error) {
      console.error('❌ Error getting lenses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get lenses',
        error: error.message
      });
    }
  }

  /**
   * Create a new lens
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createLens(req, res) {
    try {
      console.log('➕ Creating new lens');
      console.log('📝 Request body:', req.body);

      const {
        lensName,
        lensCode,
        manufacturer,
        model,
        lensType,
        lensCategory,
        material,
        power,
        diameter,
        features,
        benefits,
        suitableFor,
        contraindications,
        lensoCost,
        patientCost,
        insuranceCoverage,
        stockQuantity,
        reorderLevel,
        fdaApproved,
        ceMarked,
        qualityCertification,
        expiryDate,
        batchNumber
      } = req.body;

      // Validate required fields
      if (!lensName || !lensType || !lensCategory || !lensoCost || !patientCost) {
        return res.status(400).json({
          success: false,
          message: 'Lens name, type, category, lenso cost, and patient cost are required'
        });
      }

      const lens = await prisma.lens.create({
        data: {
          lensName: lensName.trim(),
          lensCode,
          manufacturer,
          model,
          lensType,
          lensCategory,
          material,
          power,
          diameter,
          features,
          benefits,
          suitableFor,
          contraindications,
          lensoCost: parseFloat(lensoCost),
          patientCost: parseFloat(patientCost),
          insuranceCoverage: insuranceCoverage ? parseFloat(insuranceCoverage) : 0,
          stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0,
          reorderLevel: reorderLevel ? parseInt(reorderLevel) : 5,
          fdaApproved: fdaApproved !== undefined ? fdaApproved : false,
          ceMarked: ceMarked !== undefined ? ceMarked : false,
          qualityCertification,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          batchNumber,
          isAvailable: true,
          isActive: true,
          createdBy: req.user?.id
        }
      });

      res.status(201).json({
        success: true,
        message: 'Lens created successfully',
        data: lens
      });

    } catch (error) {
      console.error('❌ Error creating lens:', error);
      
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'A lens with this code already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create lens',
        error: error.message
      });
    }
  }

  /**
   * Get all additional charges
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAdditionalCharges(req, res) {
    try {
      console.log('📋 Getting additional charges');

      const additionalCharges = await prisma.additionalCharges.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          chargeName: 'asc'
        }
      });

      res.json({
        success: true,
        message: 'Additional charges retrieved successfully',
        data: additionalCharges,
        count: additionalCharges.length
      });

    } catch (error) {
      console.error('❌ Error getting additional charges:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get additional charges',
        error: error.message
      });
    }
  }
}

module.exports = new SurgeryTypeController();