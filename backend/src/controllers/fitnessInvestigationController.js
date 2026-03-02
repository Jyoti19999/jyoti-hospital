// src/controllers/fitnessInvestigationController.js
const prisma = require('../utils/prisma');

class FitnessInvestigationController {
  
  /**
   * Create a new fitness investigation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createFitnessInvestigation(req, res) {
    try {
      console.log('➕ Creating new fitness investigation');

      const {
        investigationName,
        investigationCode,
        category,
        description,
        cost,
        validityDays,
        processingTime,
        fastingRequired
      } = req.body;

      // Validate required fields
      if (!investigationName || !cost) {
        return res.status(400).json({
          success: false,
          message: 'Investigation name and cost are required'
        });
      }

      // Check if investigation already exists
      const existingInvestigation = await prisma.fitnessInvestigation.findFirst({
        where: { 
          investigationName: { equals: investigationName, mode: 'insensitive' }
        }
      });

      if (existingInvestigation) {
        return res.status(409).json({
          success: false,
          message: 'Investigation with this name already exists'
        });
      }

      const investigation = await prisma.fitnessInvestigation.create({
        data: {
          investigationName: investigationName.trim(),
          investigationCode: investigationCode?.trim() || null,
          category: category?.trim() || 'General',
          description: description?.trim() || null,
          cost: parseFloat(cost),
          validityDays: validityDays ? parseInt(validityDays) : null,
          processingTime: processingTime?.trim() || null,
          fastingRequired: fastingRequired || false,
          isActive: true
        }
      });

      console.log('✅ Fitness investigation created successfully:', investigation.investigationName);

      res.status(201).json({
        success: true,
        message: 'Fitness investigation created successfully',
        data: investigation
      });

    } catch (error) {
      console.error('❌ Error creating fitness investigation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create fitness investigation',
        error: error.message
      });
    }
  }

  /**
   * Get all fitness investigations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllFitnessInvestigations(req, res) {
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

      res.json({
        success: true,
        message: 'Fitness investigations retrieved successfully',
        data: investigations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
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
   * Update fitness investigation
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

      // Check if investigation exists
      const existingInvestigation = await prisma.fitnessInvestigation.findUnique({
        where: { id }
      });

      if (!existingInvestigation) {
        return res.status(404).json({
          success: false,
          message: 'Fitness investigation not found'
        });
      }

      const updatedInvestigation = await prisma.fitnessInvestigation.update({
        where: { id },
        data: {
          investigationName: investigationName?.trim() || existingInvestigation.investigationName,
          investigationCode: investigationCode?.trim() || existingInvestigation.investigationCode,
          category: category?.trim() || existingInvestigation.category,
          description: description?.trim() || existingInvestigation.description,
          cost: cost ? parseFloat(cost) : existingInvestigation.cost,
          validityDays: validityDays ? parseInt(validityDays) : existingInvestigation.validityDays,
          processingTime: processingTime?.trim() || existingInvestigation.processingTime,
          fastingRequired: fastingRequired !== undefined ? fastingRequired : existingInvestigation.fastingRequired,
          isActive: isActive !== undefined ? isActive : existingInvestigation.isActive,
          updatedAt: new Date()
        }
      });

      console.log('✅ Fitness investigation updated successfully');

      res.json({
        success: true,
        message: 'Fitness investigation updated successfully',
        data: updatedInvestigation
      });

    } catch (error) {
      console.error('❌ Error updating fitness investigation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update fitness investigation',
        error: error.message
      });
    }
  }

  /**
   * Delete fitness investigation
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteFitnessInvestigation(req, res) {
    try {
      const { id } = req.params;
      console.log(`🗑️ Deleting fitness investigation: ${id}`);

      // Check if investigation exists
      const existingInvestigation = await prisma.fitnessInvestigation.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              fitnessResults: true
            }
          }
        }
      });

      if (!existingInvestigation) {
        return res.status(404).json({
          success: false,
          message: 'Fitness investigation not found'
        });
      }

      // Check if investigation is being used
      if (existingInvestigation._count.fitnessResults > 0) {
        // Soft delete by marking as inactive
        await prisma.fitnessInvestigation.update({
          where: { id },
          data: { isActive: false }
        });

        console.log('✅ Fitness investigation deactivated (has dependencies)');

        res.json({
          success: true,
          message: 'Fitness investigation deactivated successfully (has existing dependencies)',
          data: { id, deactivated: true }
        });
      } else {
        // Hard delete if no dependencies
        await prisma.fitnessInvestigation.delete({
          where: { id }
        });

        console.log('✅ Fitness investigation deleted successfully');

        res.json({
          success: true,
          message: 'Fitness investigation deleted successfully',
          data: { id, deleted: true }
        });
      }

    } catch (error) {
      console.error('❌ Error deleting fitness investigation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete fitness investigation',
        error: error.message
      });
    }
  }
}

module.exports = new FitnessInvestigationController();