const equipmentService = require('../services/equipmentService');
const { validationResult } = require('express-validator');

class EquipmentController {
  // GET /api/v1/equipment - Get all equipment with pagination and filters
  async getAllEquipment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        page = 1,
        limit = 10,
        search,
        category,
        manufacturer,
        isActive,
        lowStock,
        nearExpiry,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        search,
        category,
        manufacturer,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        lowStock: lowStock === 'true',
        nearExpiry: nearExpiry === 'true'
      };

      console.log('🔍 Equipment API filters:', filters);

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const sort = {
        sortBy,
        sortOrder
      };

      const result = await equipmentService.getAllEquipment(filters, pagination, sort);

      res.status(200).json({
        success: true,
        data: result.equipment,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('Error in getAllEquipment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch equipment',
        error: error.message
      });
    }
  }

  // GET /api/v1/equipment/:id - Get single equipment by ID
  async getEquipmentById(req, res) {
    try {
      const { id } = req.params;

      const equipment = await equipmentService.getEquipmentById(id);

      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: 'Equipment not found'
        });
      }

      res.status(200).json({
        success: true,
        data: equipment
      });
    } catch (error) {
      console.error('Error in getEquipmentById:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch equipment',
        error: error.message
      });
    }
  }

  // POST /api/v1/equipment - Create new equipment
  async createEquipment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Equipment validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const equipmentData = req.body;
      const createdBy = req.user?.id || 'system';

      const equipment = await equipmentService.createEquipment(equipmentData, createdBy);

      res.status(201).json({
        success: true,
        message: 'Equipment created successfully',
        data: equipment
      });
    } catch (error) {
      console.error('Error in createEquipment:', error);
      if (error.message.includes('unique constraint')) {
        return res.status(400).json({
          success: false,
          message: 'Equipment with this code already exists'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to create equipment',
        error: error.message
      });
    }
  }

  // PUT /api/v1/equipment/:id - Update equipment
  async updateEquipment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updates = req.body;
      const updatedBy = req.user?.id || 'system';

      // Remove currentStock from updates as it should be managed through stock operations
      delete updates.currentStock;

      const equipment = await equipmentService.updateEquipment(id, updates, updatedBy);

      res.status(200).json({
        success: true,
        message: 'Equipment updated successfully',
        data: equipment
      });
    } catch (error) {
      console.error('Error in updateEquipment:', error);
      if (error.message === 'Equipment not found') {
        return res.status(404).json({
          success: false,
          message: 'Equipment not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to update equipment',
        error: error.message
      });
    }
  }

  // DELETE /api/v1/equipment/:id - Soft delete equipment
  async deleteEquipment(req, res) {
    try {
      const { id } = req.params;
      const deletedBy = req.user?.id || 'system';

      const equipment = await equipmentService.deleteEquipment(id, deletedBy);

      res.status(200).json({
        success: true,
        message: 'Equipment deleted successfully',
        data: equipment
      });
    } catch (error) {
      console.error('Error in deleteEquipment:', error);
      if (error.message === 'Equipment not found') {
        return res.status(404).json({
          success: false,
          message: 'Equipment not found'
        });
      }
      if (error.message.includes('currently allocated')) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete equipment that is currently allocated to surgeries'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to delete equipment',
        error: error.message
      });
    }
  }

  // GET /api/v1/equipment/categories - Get all equipment categories
  async getEquipmentCategories(req, res) {
    try {
      const categories = await equipmentService.getEquipmentCategories();

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error in getEquipmentCategories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch equipment categories',
        error: error.message
      });
    }
  }

  // GET /api/v1/equipment/low-stock - Get equipment below reorder level
  async getLowStockEquipment(req, res) {
    try {
      const equipment = await equipmentService.getLowStockItems();

      res.status(200).json({
        success: true,
        data: equipment
      });
    } catch (error) {
      console.error('Error in getLowStockEquipment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch low stock equipment',
        error: error.message
      });
    }
  }

  // GET /api/v1/equipment/near-expiry - Get equipment expiring within specified days
  async getNearExpiryEquipment(req, res) {
    try {
      const { days = 30 } = req.query;
      const equipment = await equipmentService.getNearExpiryItems(parseInt(days));

      res.status(200).json({
        success: true,
        data: equipment
      });
    } catch (error) {
      console.error('Error in getNearExpiryEquipment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch near expiry equipment',
        error: error.message
      });
    }
  }

  // POST /api/v1/equipment/:id/stock/add - Add stock
  async addStock(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { quantity, reason, expiryDate, batchNumber } = req.body;
      const performedBy = req.user?.id || 'system';

      const result = await equipmentService.addStock(
        id,
        quantity,
        reason,
        expiryDate,
        batchNumber,
        performedBy
      );

      res.status(200).json({
        success: true,
        message: 'Stock added successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in addStock:', error);
      if (error.message === 'Equipment not found') {
        return res.status(404).json({
          success: false,
          message: 'Equipment not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to add stock',
        error: error.message
      });
    }
  }

  // POST /api/v1/equipment/:id/stock/remove - Remove stock
  async removeStock(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { quantity, reason } = req.body;
      const performedBy = req.user?.id || 'system';

      const result = await equipmentService.removeStock(id, quantity, reason, performedBy);

      res.status(200).json({
        success: true,
        message: 'Stock removed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in removeStock:', error);
      if (error.message === 'Equipment not found') {
        return res.status(404).json({
          success: false,
          message: 'Equipment not found'
        });
      }
      if (error.message.includes('insufficient stock')) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock available'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to remove stock',
        error: error.message
      });
    }
  }

  // POST /api/v1/equipment/:id/stock/adjust - Manual stock adjustment
  async adjustStock(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { newQuantity, reason } = req.body;
      const performedBy = req.user?.id || 'system';

      const result = await equipmentService.adjustStock(id, newQuantity, reason, performedBy);

      res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully',
        data: result
      });
    } catch (error) {
      console.error('Error in adjustStock:', error);
      if (error.message === 'Equipment not found') {
        return res.status(404).json({
          success: false,
          message: 'Equipment not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Failed to adjust stock',
        error: error.message
      });
    }
  }

  // GET /api/v1/equipment/:id/stock/transactions - Get stock transaction history
  async getStockTransactions(req, res) {
    try {
      const { id } = req.params;
      const {
        page = 1,
        limit = 10,
        transactionType,
        startDate,
        endDate
      } = req.query;

      const filters = {
        transactionType,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      };

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await equipmentService.getStockTransactions(id, filters, pagination);

      res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('Error in getStockTransactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock transactions',
        error: error.message
      });
    }
  }

  // GET /api/v1/equipment/stats/dashboard - Get equipment dashboard stats
  async getEquipmentDashboardStats(req, res) {
    try {
      const stats = await equipmentService.getDashboardStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getEquipmentDashboardStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard stats',
        error: error.message
      });
    }
  }

  // GET /api/v1/equipment/stats/usage - Get equipment usage analytics
  async getEquipmentUsageStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const dateRange = {
        startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date()
      };

      const stats = await equipmentService.getUsageAnalytics(dateRange);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getEquipmentUsageStats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch usage analytics',
        error: error.message
      });
    }
  }

  // GET /api/v1/equipment/search - Search equipment with stock status
  async searchEquipment(req, res) {
    try {
      const { q: query, category, surgeryTypeId, limit = 20 } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const filters = {
        query: query.trim(),
        category,
        surgeryTypeId,
        limit: parseInt(limit)
      };

      const equipment = await equipmentService.searchEquipmentWithStock(filters);

      res.status(200).json({
        success: true,
        data: equipment
      });
    } catch (error) {
      console.error('Error in searchEquipment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search equipment',
        error: error.message
      });
    }
  }

  // POST /api/v1/equipment/sync-registers - Sync all medicines to their registers
  async syncAllMedicinesToRegisters(req, res) {
    try {
      const medicines = await equipmentService.getAllMedicines();
      let synced = 0;

      for (const medicine of medicines) {
        if (medicine.category === 'Medicine' && medicine.register) {
          await equipmentService.syncStockToRegister(
            medicine.id,
            medicine.name,
            medicine.currentStock,
            medicine.register
          );
          synced++;
        }
      }

      res.status(200).json({
        success: true,
        message: `Synced ${synced} medicines to registers`,
        data: { synced }
      });
    } catch (error) {
      console.error('Error syncing medicines to registers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync medicines to registers',
        error: error.message
      });
    }
  }
}

module.exports = new EquipmentController();