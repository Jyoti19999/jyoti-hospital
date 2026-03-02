const prisma = require('../utils/prisma');

// Get all lens stock with filtering and pagination
const getAllLensStock = async (filters = {}, pagination = { page: 1, limit: 10 }, sort = { sortBy: 'id', sortOrder: 'desc' }) => {
  try {
    const {
      search,
      lensType,
      lensCategory,
      manufacturer,
      isActive,
      lowStock = false,
      nearExpiry = false
    } = filters;

    const { page, limit } = pagination;
    const { sortBy, sortOrder } = sort;

    // Start with a simple where clause
    let where = {
      isActive: true  // Default to active lenses
    };

    // Only override isActive if explicitly provided
    if (isActive !== undefined && typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { lensName: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (lensType) {
      where.lensType = lensType;
    }

    if (lensCategory) {
      where.lensCategory = lensCategory;
    }

    if (manufacturer) {
      where.manufacturer = { contains: manufacturer, mode: 'insensitive' };
    }

    if (nearExpiry) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.expiryDate = {
        lte: thirtyDaysFromNow,
        not: null
      };
    }

    // Count total records
    const total = await prisma.lens.count({ where });

    // Get paginated results
    let lenses = [];
    
    try {
      lenses = await prisma.lens.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      });
    } catch (orderError) {
      console.log('Error with orderBy, trying without it:', orderError.message);
      // If sorting fails, try without sorting
      lenses = await prisma.lens.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit
      });
    }

    // Filter for low stock if needed (since we need to compare stockQuantity with reorderLevel)
    if (lowStock) {
      lenses = lenses.filter(lens => lens.stockQuantity <= (lens.reorderLevel || 0));
    }

    return {
      lenses,
      total: lowStock ? lenses.length : total,
      page,
      limit,
      totalPages: Math.ceil((lowStock ? lenses.length : total) / limit)
    };
  } catch (error) {
    console.error('Error in getAllLensStock service:', error);
    throw new Error(`Failed to get lens stock: ${error.message}`);
  }
};

// Get single lens stock by ID
const getLensStockById = async (id) => {
  try {
    const lens = await prisma.lens.findUnique({
      where: { id }
    });

    if (!lens) {
      throw new Error('Lens not found');
    }

    return lens;
  } catch (error) {
    console.error('Error in getLensStockById service:', error);
    throw new Error(`Failed to get lens: ${error.message}`);
  }
};

// Create new lens stock entry
const createLensStock = async (lensData, createdBy) => {
  try {
    // Convert expiryDate string to Date object if provided
    const processedData = {
      ...lensData,
      ...(lensData.expiryDate && { expiryDate: new Date(lensData.expiryDate) })
    };

    const lens = await prisma.lens.create({
      data: processedData
    });

    // Create initial stock transaction if stockQuantity > 0
    if (lensData.stockQuantity > 0) {
      await createStockTransaction(lens.id, 'IN', lensData.stockQuantity, 'Initial stock', createdBy);
    }

    return lens;
  } catch (error) {
    console.error('Error in createLensStock service:', error);
    throw new Error(`Failed to create lens: ${error.message}`);
  }
};

// Update lens stock
const updateLensStock = async (id, updates, updatedBy) => {
  try {
    const existingLens = await prisma.lens.findUnique({ where: { id } });
    if (!existingLens) {
      throw new Error('Lens not found');
    }

    // Process updates to handle date conversion
    const processedUpdates = {
      ...updates,
      ...(updates.expiryDate && { expiryDate: new Date(updates.expiryDate) }),
      updatedAt: new Date()
    };

    const lens = await prisma.lens.update({
      where: { id },
      data: processedUpdates
    });

    return lens;
  } catch (error) {
    console.error('Error in updateLensStock service:', error);
    throw new Error(`Failed to update lens: ${error.message}`);
  }
};

// Delete lens stock (soft delete)
const deleteLensStock = async (id, deletedBy) => {
  try {
    await prisma.lens.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return { message: 'Lens deleted successfully' };
  } catch (error) {
    console.error('Error in deleteLensStock service:', error);
    throw new Error(`Failed to delete lens: ${error.message}`);
  }
};

// Get lens categories
const getLensCategories = async () => {
  try {
    const categories = await prisma.lens.findMany({
      where: { isActive: true },
      select: { lensCategory: true },
      distinct: ['lensCategory']
    });

    return categories.map(item => item.lensCategory).filter(Boolean);
  } catch (error) {
    console.error('Error in getLensCategories service:', error);
    throw new Error(`Failed to get lens categories: ${error.message}`);
  }
};

// Get lens types
const getLensTypes = async () => {
  try {
    const types = await prisma.lens.findMany({
      where: { isActive: true },
      select: { lensType: true },
      distinct: ['lensType']
    });

    return types.map(item => item.lensType).filter(Boolean);
  } catch (error) {
    console.error('Error in getLensTypes service:', error);
    throw new Error(`Failed to get lens types: ${error.message}`);
  }
};

// Get low stock lenses
const getLowStockLenses = async () => {
  try {
    const lenses = await prisma.lens.findMany({
      where: { isActive: true }
    });

    // Filter lenses where stockQuantity <= reorderLevel
    const lowStockLenses = lenses.filter(lens => 
      lens.stockQuantity <= (lens.reorderLevel || 0)
    );

    return lowStockLenses;
  } catch (error) {
    console.error('Error in getLowStockLenses service:', error);
    throw new Error(`Failed to get low stock lenses: ${error.message}`);
  }
};

// Get near expiry lenses
const getNearExpiryLenses = async (days = 30) => {
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const lenses = await prisma.lens.findMany({
      where: {
        isActive: true,
        expiryDate: {
          lte: futureDate,
          not: null
        }
      },
      orderBy: { expiryDate: 'asc' }
    });

    return lenses;
  } catch (error) {
    console.error('Error in getNearExpiryLenses service:', error);
    throw new Error(`Failed to get near expiry lenses: ${error.message}`);
  }
};

// Helper function to create stock transaction
const createStockTransaction = async (lensId, transactionType, quantity, reason, performedBy, batchNumber = null) => {
  try {
    const transaction = await prisma.stockTransaction.create({
      data: {
        lensId: lensId,
        transactionType,
        quantity: parseInt(quantity),
        reason,
        performedBy,
        transactionDate: new Date()
      }
    });

    return transaction;
  } catch (error) {
    console.error('Error creating stock transaction:', error);
    throw new Error(`Failed to create stock transaction: ${error.message}`);
  }
};

// Add stock
const addStock = async (id, quantity, reason, expiryDate = null, batchNumber = null, performedBy) => {
  try {
    const lens = await prisma.lens.findUnique({ where: { id } });
    if (!lens) {
      throw new Error('Lens not found');
    }

    const newQuantity = lens.stockQuantity + parseInt(quantity);
    
    // Process update data with proper date handling
    const updateData = {
      stockQuantity: newQuantity,
      ...(batchNumber && { batchNumber }),
      updatedAt: new Date()
    };

    // Only add expiryDate if it's provided
    if (expiryDate) {
      updateData.expiryDate = new Date(expiryDate);
    }
    
    // Update stock quantity
    const updatedLens = await prisma.lens.update({
      where: { id },
      data: updateData
    });

    // Create stock transaction
    await createStockTransaction(id, 'IN', quantity, reason, performedBy, batchNumber);

    return updatedLens;
  } catch (error) {
    console.error('Error in addStock service:', error);
    throw new Error(`Failed to add stock: ${error.message}`);
  }
};

// Remove stock
const removeStock = async (id, quantity, reason, performedBy) => {
  try {
    const lens = await prisma.lens.findUnique({ where: { id } });
    if (!lens) {
      throw new Error('Lens not found');
    }

    const requestedQuantity = parseInt(quantity);
    if (lens.stockQuantity < requestedQuantity) {
      throw new Error('Insufficient stock quantity');
    }

    const newQuantity = lens.stockQuantity - requestedQuantity;
    
    // Update stock quantity
    const updatedLens = await prisma.lens.update({
      where: { id },
      data: {
        stockQuantity: newQuantity,
        updatedAt: new Date()
      }
    });

    // Create stock transaction
    await createStockTransaction(id, 'OUT', quantity, reason, performedBy);

    return updatedLens;
  } catch (error) {
    console.error('Error in removeStock service:', error);
    throw new Error(`Failed to remove stock: ${error.message}`);
  }
};

// Adjust stock
const adjustStock = async (id, newQuantity, reason, performedBy) => {
  try {
    const lens = await prisma.lens.findUnique({ where: { id } });
    if (!lens) {
      throw new Error('Lens not found');
    }

    const currentQuantity = lens.stockQuantity;
    const adjustmentQuantity = parseInt(newQuantity) - currentQuantity;
    const transactionType = adjustmentQuantity >= 0 ? 'IN' : 'OUT';
    
    // Update stock quantity
    const updatedLens = await prisma.lens.update({
      where: { id },
      data: {
        stockQuantity: parseInt(newQuantity),
        updatedAt: new Date()
      }
    });

    // Create stock transaction
    await createStockTransaction(id, 'ADJUSTMENT', Math.abs(adjustmentQuantity), reason, performedBy);

    return updatedLens;
  } catch (error) {
    console.error('Error in adjustStock service:', error);
    throw new Error(`Failed to adjust stock: ${error.message}`);
  }
};

// Get stock transactions
const getStockTransactions = async (lensId, filters = {}, pagination = {}) => {
  try {
    const {
      transactionType,
      startDate,
      endDate
    } = filters;

    const {
      page = 1,
      limit = 10
    } = pagination;

    const where = {
      lensId: lensId,
      ...(transactionType && { transactionType }),
      ...(startDate && endDate && {
        transactionDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const total = await prisma.stockTransaction.count({ where });

    const transactions = await prisma.stockTransaction.findMany({
      where,
      include: { lens: true },
      orderBy: { transactionDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Fetch staff details for each transaction
    const transformedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        let performedByName = 'Unknown Staff';
        if (transaction.performedBy) {
          try {
            // First try to find in Staff table
            let user = await prisma.staff.findUnique({
              where: { id: transaction.performedBy },
              select: { firstName: true, lastName: true }
            });
            
            if (user) {
              performedByName = `${user.firstName} ${user.lastName}`;
            } else {
              // If not found in Staff, try SuperAdmin table
              user = await prisma.superAdmin.findUnique({
                where: { id: transaction.performedBy },
                select: { firstName: true, lastName: true }
              });
              
              if (user) {
                performedByName = `${user.firstName} ${user.lastName}`;
              }
            }
          } catch (error) {
            console.warn(`Could not find user with ID: ${transaction.performedBy}`);
          }
        }
        
        return {
          ...transaction,
          performedByName
        };
      })
    );

    return {
      transactions: transformedTransactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error in getStockTransactions service:', error);
    throw new Error(`Failed to get stock transactions: ${error.message}`);
  }
};

// Get dashboard stats
const getDashboardStats = async () => {
  try {
    const activeLenses = await prisma.lens.findMany({
      where: { isActive: true },
      select: {
        id: true,
        stockQuantity: true,
        reorderLevel: true,
        lensoCost: true,
        patientCost: true,
        expiryDate: true
      }
    });

    const totalLenses = activeLenses.length;
    const totalStockQuantity = activeLenses.reduce((sum, lens) => sum + (lens.stockQuantity || 0), 0);
    const totalStockValue = activeLenses.reduce((sum, lens) => sum + ((lens.stockQuantity || 0) * (lens.lensoCost || 0)), 0);
    
    const lowStockItems = activeLenses.filter(lens => 
      (lens.stockQuantity || 0) <= (lens.reorderLevel || 0)
    ).length;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const nearExpiryItems = activeLenses.filter(lens => 
      lens.expiryDate && new Date(lens.expiryDate) <= thirtyDaysFromNow
    ).length;

    const outOfStockItems = activeLenses.filter(lens => (lens.stockQuantity || 0) === 0).length;

    return {
      totalLenses,
      totalStockQuantity,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      lowStockItems,
      nearExpiryItems,
      outOfStockItems,
      averageStockValue: totalLenses > 0 ? Math.round((totalStockValue / totalLenses) * 100) / 100 : 0
    };
  } catch (error) {
    console.error('Error in getDashboardStats service:', error);
    throw new Error(`Failed to get dashboard stats: ${error.message}`);
  }
};

// Get usage analytics
const getUsageAnalytics = async (dateRange = {}) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date()
    } = dateRange;

    const transactions = await prisma.stockTransaction.findMany({
      where: {
        lensId: { not: null },
        transactionDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    });

    const analytics = {
      totalTransactions: transactions.length,
      stockIn: transactions.filter(t => t.transactionType === 'IN').length,
      stockOut: transactions.filter(t => t.transactionType === 'OUT').length,
      adjustments: transactions.filter(t => t.transactionType === 'ADJUSTMENT').length,
      quantityIn: transactions.filter(t => t.transactionType === 'IN').reduce((sum, t) => sum + t.quantity, 0),
      quantityOut: transactions.filter(t => t.transactionType === 'OUT').reduce((sum, t) => sum + t.quantity, 0)
    };

    return analytics;
  } catch (error) {
    console.error('Error in getUsageAnalytics service:', error);
    throw new Error(`Failed to get usage analytics: ${error.message}`);
  }
};

// Search lenses with stock status
const searchLensesWithStock = async (filters = {}) => {
  try {
    const {
      query = '',
      lensType,
      lensCategory,
      limit = 20
    } = filters;

    const where = {
      isActive: true,
      ...(query && {
        OR: [
          { lensName: { contains: query, mode: 'insensitive' } },
          { manufacturer: { contains: query, mode: 'insensitive' } },
          { model: { contains: query, mode: 'insensitive' } }
        ]
      }),
      ...(lensType && { lensType: lensType }),
      ...(lensCategory && { lensCategory: lensCategory })
    };

    const lenses = await prisma.lens.findMany({
      where,
      take: limit,
      orderBy: { lensName: 'asc' }
    });

    return lenses.map(lens => ({
      ...lens,
      stockStatus: getStockStatus(lens.stockQuantity, lens.reorderLevel),
      expiryStatus: getExpiryStatus(lens.expiryDate)
    }));
  } catch (error) {
    console.error('Error in searchLensesWithStock service:', error);
    throw new Error(`Failed to search lenses: ${error.message}`);
  }
};

// Helper functions
const getStockStatus = (stockQuantity, reorderLevel) => {
  if (stockQuantity === 0) return 'OUT_OF_STOCK';
  if (stockQuantity <= (reorderLevel || 0)) return 'LOW_STOCK';
  return 'IN_STOCK';
};

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return 'NO_EXPIRY';
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) return 'EXPIRED';
  if (daysUntilExpiry <= 30) return 'NEAR_EXPIRY';
  return 'VALID';
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
  getDashboardStats,
  getUsageAnalytics,
  searchLensesWithStock,
  getStockStatus,
  getExpiryStatus
};