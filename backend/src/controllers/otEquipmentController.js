// src/controllers/otEquipmentController.js
const prisma = require('../utils/prisma');

class OTEquipmentController {
  /**
   * Get all OT equipment
   */
  async getAllEquipment(req, res) {
    try {
      const { status, category, otRoomId } = req.query;

      const where = {
        isActive: true
      };

      if (status) where.status = status;
      if (category) where.category = category;
      if (otRoomId) where.otRoomId = otRoomId;

      const equipment = await prisma.oTEquipment.findMany({
        where,
        include: {
          otRoom: {
            select: {
              id: true,
              roomNumber: true,
              roomName: true
            }
          },
          maintenanceLogs: {
            orderBy: { maintenanceDate: 'desc' },
            take: 1
          }
        },
        orderBy: {
          equipmentName: 'asc'
        }
      });

      res.json({
        success: true,
        data: equipment,
        count: equipment.length
      });
    } catch (error) {
      console.error('❌ Error fetching equipment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch equipment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get equipment by ID
   */
  async getEquipmentById(req, res) {
    try {
      const { id } = req.params;

      const equipment = await prisma.oTEquipment.findUnique({
        where: { id },
        include: {
          otRoom: true,
          maintenanceLogs: {
            orderBy: { maintenanceDate: 'desc' }
          }
        }
      });

      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: 'Equipment not found'
        });
      }

      res.json({
        success: true,
        data: equipment
      });
    } catch (error) {
      console.error('❌ Error fetching equipment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch equipment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Create new equipment
   */
  async createEquipment(req, res) {
    try {
      const {
        equipmentName,
        equipmentCode,
        category,
        manufacturer,
        model,
        serialNumber,
        purchaseDate,
        warrantyExpiry,
        status,
        otRoomId,
        currentLocation,
        maintenanceInterval,
        maxHours,
        specifications,
        notes
      } = req.body;

      if (!equipmentName || !category) {
        return res.status(400).json({
          success: false,
          message: 'Equipment name and category are required'
        });
      }

      const equipment = await prisma.oTEquipment.create({
        data: {
          equipmentName,
          equipmentCode,
          category,
          manufacturer,
          model,
          serialNumber,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
          status: status || 'OPERATIONAL',
          otRoomId,
          currentLocation,
          maintenanceInterval,
          maxHours,
          specifications,
          notes,
          createdBy: req.user?.id
        },
        include: {
          otRoom: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Equipment created successfully',
        data: equipment
      });
    } catch (error) {
      console.error('❌ Error creating equipment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create equipment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update equipment
   */
  async updateEquipment(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Convert date strings to Date objects
      if (updateData.purchaseDate) updateData.purchaseDate = new Date(updateData.purchaseDate);
      if (updateData.warrantyExpiry) updateData.warrantyExpiry = new Date(updateData.warrantyExpiry);
      if (updateData.lastMaintenanceDate) updateData.lastMaintenanceDate = new Date(updateData.lastMaintenanceDate);
      if (updateData.nextMaintenanceDate) updateData.nextMaintenanceDate = new Date(updateData.nextMaintenanceDate);
      if (updateData.calibrationDate) updateData.calibrationDate = new Date(updateData.calibrationDate);
      if (updateData.nextCalibrationDate) updateData.nextCalibrationDate = new Date(updateData.nextCalibrationDate);

      const equipment = await prisma.oTEquipment.update({
        where: { id },
        data: updateData,
        include: {
          otRoom: true
        }
      });

      res.json({
        success: true,
        message: 'Equipment updated successfully',
        data: equipment
      });
    } catch (error) {
      console.error('❌ Error updating equipment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update equipment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Delete equipment (soft delete)
   */
  async deleteEquipment(req, res) {
    try {
      const { id } = req.params;

      await prisma.oTEquipment.update({
        where: { id },
        data: { isActive: false }
      });

      res.json({
        success: true,
        message: 'Equipment deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error deleting equipment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete equipment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Add maintenance log
   */
  async addMaintenanceLog(req, res) {
    try {
      const { equipmentId } = req.params;
      const {
        maintenanceDate,
        maintenanceType,
        performedBy,
        description,
        cost,
        nextDueDate,
        status
      } = req.body;

      const log = await prisma.equipmentMaintenanceLog.create({
        data: {
          equipmentId,
          maintenanceDate: new Date(maintenanceDate),
          maintenanceType,
          performedBy,
          description,
          cost: cost ? parseFloat(cost) : null,
          nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
          status: status || 'Completed'
        }
      });

      // Update equipment last maintenance date
      await prisma.oTEquipment.update({
        where: { id: equipmentId },
        data: {
          lastMaintenanceDate: new Date(maintenanceDate),
          nextMaintenanceDate: nextDueDate ? new Date(nextDueDate) : null
        }
      });

      res.status(201).json({
        success: true,
        message: 'Maintenance log added successfully',
        data: log
      });
    } catch (error) {
      console.error('❌ Error adding maintenance log:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add maintenance log',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get equipment statistics
   */
  async getEquipmentStats(req, res) {
    try {
      const total = await prisma.oTEquipment.count({ where: { isActive: true } });
      const operational = await prisma.oTEquipment.count({ where: { status: 'OPERATIONAL', isActive: true } });
      const inUse = await prisma.oTEquipment.count({ where: { status: 'IN_USE', isActive: true } });
      const maintenanceRequired = await prisma.oTEquipment.count({ where: { status: 'MAINTENANCE_REQUIRED', isActive: true } });
      const underMaintenance = await prisma.oTEquipment.count({ where: { status: 'UNDER_MAINTENANCE', isActive: true } });

      res.json({
        success: true,
        data: {
          total,
          operational,
          inUse,
          maintenanceRequired,
          underMaintenance
        }
      });
    } catch (error) {
      console.error('❌ Error fetching equipment stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch equipment statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new OTEquipmentController();
