const lensStockService = require('../services/lensStockService');

// Get all lens stock with filtering and pagination
const getAllLensStock = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      lensType: req.query.lensType,
      lensCategory: req.query.lensCategory,
      manufacturer: req.query.manufacturer,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      lowStock: req.query.lowStock === 'true',
      nearExpiry: req.query.nearExpiry === 'true'
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const sort = {
      sortBy: req.query.sortBy || 'id',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await lensStockService.getAllLensStock(filters, pagination, sort);

    res.status(200).json({
      success: true,
      data: result.lenses,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Error in getAllLensStock controller:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get lens stock by ID
const getLensStockById = async (req, res) => {
  try {
    const { id } = req.params;
    const lens = await lensStockService.getLensStockById(id);

    if (!lens) {
      return res.status(404).json({
        success: false,
        message: 'Lens not found'
      });
    }

    res.status(200).json({
      success: true,
      data: lens
    });
  } catch (error) {
    console.error('Error in getLensStockById controller:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new lens stock entry
const createLensStock = async (req, res) => {
  try {
    const lensData = req.body;
    const createdBy = req.user?.id || 'system';

    const lens = await lensStockService.createLensStock(lensData, createdBy);

    res.status(201).json({
      success: true,
      message: 'Lens stock created successfully',
      data: lens
    });
  } catch (error) {
    console.error('Error in createLensStock controller:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update lens stock
const updateLensStock = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedBy = req.user?.id || 'system';

    const lens = await lensStockService.updateLensStock(id, updates, updatedBy);

    res.status(200).json({
      success: true,
      message: 'Lens stock updated successfully',
      data: lens
    });
  } catch (error) {
    console.error('Error in updateLensStock controller:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete lens stock (soft delete)
const deleteLensStock = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBy = req.user?.id || 'system';

    await lensStockService.deleteLensStock(id, deletedBy);

    res.status(200).json({
      success: true,
      message: 'Lens stock deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteLensStock controller:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get lens categories
const getLensCategories = async (req, res) => {
  try {
    const categories = await lensStockService.getLensCategories();

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error in getLensCategories controller:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get lens types
const getLensTypes = async (req, res) => {
  try {
    const types = await lensStockService.getLensTypes();

    res.status(200).json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Error in getLensTypes controller:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get low stock lenses
const getLowStockLenses = async (req, res) => {
  try {
    const lenses = await lensStockService.getLowStockLenses();

    res.status(200).json({
      success: true,
      data: lenses
    });
  } catch (error) {
    console.error('Error in getLowStockLenses controller:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get near expiry lenses
const getNearExpiryLenses = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const lenses = await lensStockService.getNearExpiryLenses(days);

    res.status(200).json({
      success: true,
      data: lenses
    });
  } catch (error) {
    console.error('Error in getNearExpiryLenses controller:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add stock
const addStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason, expiryDate, batchNumber } = req.body;
    const performedBy = req.user?.id || 'system';

    const result = await lensStockService.addStock(id, quantity, reason, expiryDate, batchNumber, performedBy);

    res.status(200).json({
      success: true,
      message: 'Lens stock added successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in addStock controller:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Remove stock
const removeStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;
    const performedBy = req.user?.id || 'system';

    const result = await lensStockService.removeStock(id, quantity, reason, performedBy);

    res.status(200).json({
      success: true,
      message: 'Lens stock removed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in removeStock controller:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Adjust stock
const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { newQuantity, reason } = req.body;
    const performedBy = req.user?.id || 'system';

    const result = await lensStockService.adjustStock(id, newQuantity, reason, performedBy);

    res.status(200).json({
      success: true,
      message: 'Lens stock adjusted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in adjustStock controller:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get stock transactions
const getStockTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const filters = {
      transactionType: req.query.transactionType,
      startDate: req.query.startDate ? new Date(req.query.startDate) : null,
      endDate: req.query.endDate ? new Date(req.query.endDate) : null
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const result = await lensStockService.getStockTransactions(id, filters, pagination);

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
    console.error('Error in getStockTransactions controller:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get lens dashboard stats
const getLensDashboardStats = async (req, res) => {
  try {
    const stats = await lensStockService.getDashboardStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getLensDashboardStats controller:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get lens usage analytics
const getLensUsageStats = async (req, res) => {
  try {
    const dateRange = {
      startDate: req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: req.query.endDate || new Date().toISOString()
    };

    const analytics = await lensStockService.getUsageAnalytics(dateRange);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error in getLensUsageStats controller:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search lenses with stock status
const searchLensesWithStock = async (req, res) => {
  try {
    const filters = {
      query: req.query.q || '',
      lensType: req.query.lensType,
      lensCategory: req.query.lensCategory,
      surgeryTypeId: req.query.surgeryTypeId,
      limit: parseInt(req.query.limit) || 20
    };

    const lenses = await lensStockService.searchLensesWithStock(filters);

    res.status(200).json({
      success: true,
      data: lenses
    });
  } catch (error) {
    console.error('Error in searchLensesWithStock controller:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllLensStock,
  getLensStockById,
  createLensStock,
  updateLensStock,
  deleteLensStock,
  getLensCategories,
  getLensTypes,
  getLowStockLenses,
  getNearExpiryLenses,
  addStock,
  removeStock,
  adjustStock,
  getStockTransactions,
  getLensDashboardStats,
  getLensUsageStats,
  searchLensesWithStock
};