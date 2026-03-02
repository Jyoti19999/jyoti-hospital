const prisma = require('../utils/prisma');

class EquipmentService {
  // Equipment CRUD operations
  async getAllEquipment(filters = {}, pagination = {}, sort = {}) {
    const {
      search,
      category,
      manufacturer,
      isActive,
      lowStock,
      nearExpiry
    } = filters;

    const {
      page = 1,
      limit = 10
    } = pagination;

    const {
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = sort;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      AND: []
    };

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { manufacturer: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    if (category) {
      where.AND.push({ category });
    }

    if (manufacturer) {
      where.AND.push({ manufacturer });
    }

    // Always filter by isActive unless explicitly set to false
    if (typeof isActive === 'boolean') {
      console.log(`✅ Adding isActive filter: ${isActive}`);
      where.AND.push({ isActive });
    } else {
      // Default to active only if not specified
      console.log(`⚠️ isActive not specified, defaulting to true`);
      where.AND.push({ isActive: true });
    }

    if (lowStock) {
      // For low stock, we need to use a raw query since Prisma doesn't support field references
      // This will be handled in the final query construction
    }

    if (nearExpiry) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      where.AND.push({
        expiryDate: {
          lte: thirtyDaysFromNow,
          gte: new Date()
        }
      });
    }

    // If no AND conditions, remove the AND wrapper
    const finalWhere = where.AND.length > 0 ? where : {};

    // Build orderBy
    const orderBy = {
      [sortBy]: sortOrder
    };

    try {
      const [equipment, total] = await Promise.all([
        prisma.equipment.findMany({
          where: finalWhere,
          orderBy,
          skip,
          take: limit,
          include: {
            stockTransactions: {
              orderBy: { transactionDate: 'desc' },
              take: 3 // Get last 3 transactions for each equipment
            },
            _count: {
              select: {
                stockTransactions: true
              }
            }
          }
        }),
        prisma.equipment.count({ where: finalWhere })
      ]);

      const totalPages = Math.ceil(total / limit);

      // Add computed fields and filter for low stock in memory if needed
      let equipmentWithStatus = equipment.map(item => ({
        ...item,
        stockStatus: this.getStockStatus(item.currentStock, item.reorderLevel),
        expiryStatus: this.getExpiryStatus(item.expiryDate),
        lastTransaction: item.stockTransactions?.[0] || null
      }));

      // Apply low stock filter in memory if needed
      if (lowStock) {
        equipmentWithStatus = equipmentWithStatus.filter(item => 
          item.currentStock <= item.reorderLevel
        );
      }

      return {
        equipment: equipmentWithStatus,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.error('Error in getAllEquipment service:', error);
      throw new Error('Failed to fetch equipment');
    }
  }

  async getEquipmentById(id) {
    try {
      const equipment = await prisma.equipment.findUnique({
        where: { id },
        include: {
          stockTransactions: {
            orderBy: { transactionDate: 'desc' },
            take: 10
          },
          _count: {
            select: {
              stockTransactions: true
            }
          }
        }
      });

      if (!equipment) {
        return null;
      }

      return {
        ...equipment,
        stockStatus: this.getStockStatus(equipment.currentStock, equipment.reorderLevel),
        expiryStatus: this.getExpiryStatus(equipment.expiryDate)
      };
    } catch (error) {
      console.error('Error in getEquipmentById service:', error);
      throw new Error('Failed to fetch equipment');
    }
  }

  async createEquipment(equipmentData, createdBy) {
    const {
      name,
      code,
      category,
      manufacturer,
      currentStock,
      reorderLevel,
      unitCost,
      expiryDate,
      batchNumber,
      register,
      marginDate
    } = equipmentData;

    try {
      // Generate code if not provided
      const equipmentCode = code || await this.generateEquipmentCode(category);

      const equipment = await prisma.$transaction(async (tx) => {
        // Create equipment
        const newEquipment = await tx.equipment.create({
          data: {
            name,
            code: equipmentCode,
            category,
            manufacturer,
            currentStock: currentStock || 0,
            reorderLevel: reorderLevel || 5,
            unitCost,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            batchNumber,
            register,
            marginDate: marginDate ? new Date(marginDate) : null,
            lastStockUpdate: new Date()
          }
        });

        // Create initial stock transaction if currentStock > 0
        if (currentStock > 0) {
          await tx.stockTransaction.create({
            data: {
              transactionType: 'IN',
              quantity: currentStock,
              reason: 'Initial stock entry',
              performedBy: createdBy,
              equipmentId: newEquipment.id
            }
          });
        }

        return newEquipment;
      });

      // Sync to register if it's a medicine with register type
      if (category === 'Medicine' && register) {
        await this.syncStockToRegister(equipment.id, equipment.name, equipment.currentStock, register);
      }

      return {
        ...equipment,
        stockStatus: this.getStockStatus(equipment.currentStock, equipment.reorderLevel),
        expiryStatus: this.getExpiryStatus(equipment.expiryDate)
      };
    } catch (error) {
      console.error('Error in createEquipment service:', error);
      if (error.code === 'P2002') {
        throw new Error('Equipment code must be unique');
      }
      throw new Error('Failed to create equipment');
    }
  }

  // Sync equipment stock to register daily tracking (AUTOMATIC)
  async syncStockToRegister(equipmentId, medicineName, currentStock, registerType) {
    try {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();

      console.log('🔄 [SYNC] Starting sync to register...', {
        equipmentId,
        medicineName,
        currentStock,
        registerType,
        date: `${year}-${month}-${day} (Day ${day})`
      });

      // ALL register types use EquipmentStockRegister for daily tracking
      if (registerType === 'EquipmentStockRegister' || registerType === 'FridgeStockMedicinesRegister' || registerType === 'OtEmergencyStockRegister') {
        console.log('✅ [SYNC] Register type is valid, looking up entry...');
        
        // Find or create register entry for this medicine for current month
        let registerEntry = await prisma.equipmentStockRegister.findFirst({
          where: {
            equipmentId,
            month,
            year
          }
        });

        console.log('🔍 [SYNC] Register entry lookup result:', {
          found: !!registerEntry,
          entryId: registerEntry?.id,
          existingDailyStock: registerEntry?.dailyStock
        });

        if (!registerEntry) {
          console.log('➕ [SYNC] No entry found, creating new register entry...');
          
          // Create new entry
          const srNo = await this.getNextSrNo('equipmentStockRegister', month, year);
          console.log('📝 [SYNC] Generated srNo:', srNo);
          
          registerEntry = await prisma.equipmentStockRegister.create({
            data: {
              srNo,
              medicineName,
              equipmentId,
              month,
              year,
              dailyStock: { [day]: currentStock }
            }
          });
          console.log('✅ [SYNC] Created new register entry:', {
            id: registerEntry.id,
            srNo: registerEntry.srNo,
            dailyStock: registerEntry.dailyStock
          });
        } else {
          console.log('🔄 [SYNC] Entry exists, updating daily stock...');
          
          // Update existing entry - always update today's stock
          const dailyStock = registerEntry.dailyStock || {};
          const oldValue = dailyStock[day];
          dailyStock[day] = currentStock;
          
          console.log('📝 [SYNC] Daily stock update:', {
            day,
            oldValue: oldValue || 'not set',
            newValue: currentStock,
            totalDays: Object.keys(dailyStock).length
          });
          
          await prisma.equipmentStockRegister.update({
            where: { id: registerEntry.id },
            data: { 
              dailyStock,
              updatedAt: new Date()
            }
          });
          console.log(`✅ [SYNC] Updated register entry for ${medicineName} - Day ${day}: ${currentStock}`);
        }
      } else {
        console.log('⚠️ [SYNC] Unknown register type, skipping sync:', registerType);
      }
      
      // Also update the specific register tables for backward compatibility
      if (registerType === 'FridgeStockMedicinesRegister') {
        // Update or create fridge stock entry
        const existing = await prisma.fridgeStockMedicinesRegister.findFirst({
          where: { equipmentId }
        });

        if (existing) {
          await prisma.fridgeStockMedicinesRegister.update({
            where: { id: existing.id },
            data: { 
              expectedStock: currentStock,
              updatedAt: new Date()
            }
          });
        } else {
          const srNo = await this.getNextSrNo('fridgeStockMedicinesRegister');
          await prisma.fridgeStockMedicinesRegister.create({
            data: {
              srNo,
              nameOfInjection: medicineName,
              expectedStock: currentStock,
              equipmentId
            }
          });
        }
      } else if (registerType === 'OtEmergencyStockRegister') {
        // Update or create OT emergency stock entry
        const existing = await prisma.otEmergencyStockRegister.findFirst({
          where: { equipmentId }
        });

        if (existing) {
          await prisma.otEmergencyStockRegister.update({
            where: { id: existing.id },
            data: { 
              expectedStock: currentStock,
              updatedAt: new Date()
            }
          });
        } else {
          const srNo = await this.getNextSrNo('otEmergencyStockRegister');
          await prisma.otEmergencyStockRegister.create({
            data: {
              srNo,
              nameOfInjection: medicineName,
              expectedStock: currentStock,
              equipmentId
            }
          });
        }
      }

      console.log(`✅ [SYNC] Stock auto-synced to ${registerType} successfully`);
    } catch (error) {
      console.error('❌ [SYNC] Error syncing stock to register:', error);
      console.error('❌ [SYNC] Error details:', {
        message: error.message,
        stack: error.stack,
        equipmentId,
        medicineName,
        registerType
      });
      // Don't throw - sync failure shouldn't break equipment operations
    }
  }

  // Sync all medicines to registers (for daily scheduled task)
  async syncAllMedicinesToRegisters() {
    try {
      console.log('🔄 Starting daily sync of all medicines to registers...');
      
      const medicines = await prisma.equipment.findMany({
        where: {
          category: 'Medicine',
          isActive: true,
          register: { not: null }
        }
      });

      console.log(`📦 Found ${medicines.length} medicines to sync`);

      for (const medicine of medicines) {
        await this.syncStockToRegister(
          medicine.id,
          medicine.name,
          medicine.currentStock,
          medicine.register
        );
      }

      console.log('✅ Daily sync completed successfully');
      return { success: true, synced: medicines.length };
    } catch (error) {
      console.error('❌ Error in daily sync:', error);
      return { success: false, error: error.message };
    }
  }

  // Get next serial number for register
  async getNextSrNo(registerTable, month = null, year = null) {
    let whereClause = {};
    if (month && year) {
      whereClause = { month, year };
    }

    const lastEntry = await prisma[registerTable].findFirst({
      where: whereClause,
      orderBy: { srNo: 'desc' }
    });

    return lastEntry ? lastEntry.srNo + 1 : 1;
  }

  async updateEquipment(id, updates, updatedBy) {
    try {
      // Check if equipment exists
      const existingEquipment = await prisma.equipment.findUnique({
        where: { id }
      });

      if (!existingEquipment) {
        throw new Error('Equipment not found');
      }

      // Validate code uniqueness if code is being updated
      if (updates.code && updates.code !== existingEquipment.code) {
        const codeExists = await prisma.equipment.findFirst({
          where: {
            code: updates.code,
            id: { not: id }
          }
        });

        if (codeExists) {
          throw new Error('Equipment code must be unique');
        }
      }

      // Prepare update data
      const updateData = {
        ...updates,
        expiryDate: updates.expiryDate ? new Date(updates.expiryDate) : undefined,
        marginDate: updates.marginDate ? new Date(updates.marginDate) : undefined,
        updatedAt: new Date()
      };

      // If currentStock is being updated, also update lastStockUpdate
      if (updates.currentStock !== undefined) {
        updateData.lastStockUpdate = new Date();
        console.log(`📊 Updating currentStock from ${existingEquipment.currentStock} to ${updates.currentStock}`);
      }

      const equipment = await prisma.equipment.update({
        where: { id },
        data: updateData,
        include: {
          stockTransactions: {
            orderBy: { transactionDate: 'desc' },
            take: 5
          }
        }
      });

      console.log(`✅ Equipment updated. New currentStock: ${equipment.currentStock}`);

      // If currentStock was updated and this is a medicine with a register, sync to register
      if (updates.currentStock !== undefined && equipment.category === 'Medicine' && equipment.register) {
        console.log(`📊 Stock updated via edit form, syncing to register...`);
        await this.syncStockToRegister(
          equipment.id,
          equipment.name,
          equipment.currentStock,
          equipment.register
        );
      }

      return {
        ...equipment,
        stockStatus: this.getStockStatus(equipment.currentStock, equipment.reorderLevel),
        expiryStatus: this.getExpiryStatus(equipment.expiryDate)
      };
    } catch (error) {
      console.error('Error in updateEquipment service:', error);
      if (error.message === 'Equipment not found' || error.message === 'Equipment code must be unique') {
        throw error;
      }
      throw new Error('Failed to update equipment');
    }
  }

  async deleteEquipment(id, deletedBy) {
    try {
      // Check if equipment exists
      const existingEquipment = await prisma.equipment.findUnique({
        where: { id }
      });

      if (!existingEquipment) {
        throw new Error('Equipment not found');
      }

      // Check if equipment is currently allocated to any surgery
      // Use a more direct approach - get all active IPD admissions and check in JavaScript
      const activeAdmissions = await prisma.ipdAdmission.findMany({
        where: {
          status: { not: 'DISCHARGED' },
          requiredEquipments: { not: null }
        },
        select: {
          id: true,
          requiredEquipments: true
        }
      });

      // Check if any admission has this equipment in their requiredEquipments array
      const allocatedEquipment = activeAdmissions.some(admission => {
        if (!admission.requiredEquipments) return false;
        
        try {
          const equipments = Array.isArray(admission.requiredEquipments) 
            ? admission.requiredEquipments 
            : [];
          
          return equipments.some(eq => 
            eq && (eq.equipmentId === id || eq.id === id)
          );
        } catch (error) {
          console.warn('Error parsing requiredEquipments JSON:', error);
          return false;
        }
      });

      if (allocatedEquipment) {
        throw new Error('Cannot delete equipment that is currently allocated to active surgeries');
      }

      // Soft delete by setting isActive to false
      const equipment = await prisma.equipment.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      return equipment;
    } catch (error) {
      console.error('Error in deleteEquipment service:', error);
      if (error.message === 'Equipment not found' || error.message.includes('currently allocated')) {
        throw error;
      }
      throw new Error('Failed to delete equipment');
    }
  }

  async getEquipmentCategories() {
    try {
      const categories = await prisma.equipment.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category']
      });

      return categories.map(item => item.category).filter(Boolean).sort();
    } catch (error) {
      console.error('Error in getEquipmentCategories service:', error);
      throw new Error('Failed to fetch equipment categories');
    }
  }

  async getLowStockItems() {
    try {
      // Get all active equipment and filter in JavaScript
      const equipment = await prisma.equipment.findMany({
        where: { isActive: true },
        include: {
          stockTransactions: {
            orderBy: { transactionDate: 'desc' },
            take: 1
          }
        }
      });

      // Filter equipment where currentStock <= reorderLevel
      const lowStockEquipment = equipment.filter(item => 
        item.currentStock <= (item.reorderLevel || 5)
      );

      // Sort by stock level (lowest first)
      lowStockEquipment.sort((a, b) => a.currentStock - b.currentStock);

      return lowStockEquipment.map(item => ({
        ...item,
        stockStatus: this.getStockStatus(item.currentStock, item.reorderLevel),
        lastTransaction: item.stockTransactions[0] || null
      }));
    } catch (error) {
      console.error('Error in getLowStockItems service:', error);
      throw new Error('Failed to fetch low stock items');
    }
  }

  async getNearExpiryItems(days = 30) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const equipment = await prisma.equipment.findMany({
        where: {
          isActive: true,
          expiryDate: {
            lte: futureDate,
            gte: new Date()
          }
        },
        orderBy: { expiryDate: 'asc' },
        include: {
          stockTransactions: {
            orderBy: { transactionDate: 'desc' },
            take: 1
          }
        }
      });

      return equipment.map(item => ({
        ...item,
        expiryStatus: this.getExpiryStatus(item.expiryDate),
        daysUntilExpiry: Math.ceil((item.expiryDate - new Date()) / (1000 * 60 * 60 * 24)),
        lastTransaction: item.stockTransactions[0] || null
      }));
    } catch (error) {
      console.error('Error in getNearExpiryItems service:', error);
      throw new Error('Failed to fetch near expiry items');
    }
  }

  // Stock management operations
  async addStock(equipmentId, quantity, reason, expiryDate, batchNumber, performedBy) {
    try {
      console.log('📦 [ADD STOCK] Starting...', { equipmentId, quantity, reason });
      
      const equipment = await this.validateEquipmentExists(equipmentId);
      console.log('✅ [ADD STOCK] Equipment found:', { 
        id: equipment.id, 
        name: equipment.name, 
        category: equipment.category,
        register: equipment.register,
        currentStock: equipment.currentStock 
      });

      const result = await prisma.$transaction(async (tx) => {
        // Create stock transaction
        const transaction = await tx.stockTransaction.create({
          data: {
            transactionType: 'IN',
            quantity,
            reason: reason || 'Stock addition',
            performedBy,
            equipmentId
          }
        });
        console.log('✅ [ADD STOCK] Transaction created:', transaction.id);

        // Update equipment stock
        const updatedEquipment = await tx.equipment.update({
          where: { id: equipmentId },
          data: {
            currentStock: { increment: quantity },
            lastStockUpdate: new Date(),
            expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            batchNumber: batchNumber || undefined
          }
        });
        console.log('✅ [ADD STOCK] Equipment updated:', { 
          oldStock: equipment.currentStock,
          newStock: updatedEquipment.currentStock,
          added: quantity
        });

        return { transaction, equipment: updatedEquipment };
      });

      // Sync to register if it's a medicine
      if (result.equipment.category === 'Medicine' && result.equipment.register) {
        console.log('🔄 [ADD STOCK] Syncing to register...');
        await this.syncStockToRegister(
          result.equipment.id,
          result.equipment.name,
          result.equipment.currentStock,
          result.equipment.register
        );
        console.log('✅ [ADD STOCK] Sync completed successfully');
      }

      return {
        ...result.equipment,
        stockStatus: this.getStockStatus(result.equipment.currentStock, result.equipment.reorderLevel),
        transaction: result.transaction
      };
    } catch (error) {
      console.error('❌ [ADD STOCK] Error:', error);
      if (error.message === 'Equipment not found') {
        throw error;
      }
      throw new Error('Failed to add stock');
    }
  }

  async removeStock(equipmentId, quantity, reason, performedBy) {
    try {
      console.log('➖ [REMOVE STOCK] Starting...', { equipmentId, quantity, reason });
      
      const equipment = await this.validateEquipmentExists(equipmentId);

      console.log('✅ [REMOVE STOCK] Equipment found:', { 
        id: equipment.id, 
        name: equipment.name, 
        category: equipment.category,
        register: equipment.register,
        currentStock: equipment.currentStock
      });

      // Check if sufficient stock is available
      if (equipment.currentStock < quantity) {
        console.log('❌ [REMOVE STOCK] Insufficient stock:', {
          available: equipment.currentStock,
          requested: quantity
        });
        throw new Error(`Insufficient stock. Available: ${equipment.currentStock}, Requested: ${quantity}`);
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create stock transaction
        const transaction = await tx.stockTransaction.create({
          data: {
            transactionType: 'OUT',
            quantity,
            reason: reason || 'Stock removal',
            performedBy,
            equipmentId
          }
        });
        console.log('✅ [REMOVE STOCK] Transaction created:', transaction.id);

        // Update equipment stock
        const updatedEquipment = await tx.equipment.update({
          where: { id: equipmentId },
          data: {
            currentStock: { decrement: quantity },
            lastStockUpdate: new Date()
          }
        });
        console.log('✅ [REMOVE STOCK] Equipment updated:', { 
          oldStock: equipment.currentStock,
          newStock: updatedEquipment.currentStock,
          removed: quantity
        });

        return { transaction, equipment: updatedEquipment };
      });

      // Sync to register if it's a medicine
      if (result.equipment.category === 'Medicine' && result.equipment.register) {
        console.log('🔄 [REMOVE STOCK] Syncing to register...');
        await this.syncStockToRegister(
          result.equipment.id,
          result.equipment.name,
          result.equipment.currentStock,
          result.equipment.register
        );
        console.log('✅ [REMOVE STOCK] Sync completed successfully');
      }

      return {
        ...result.equipment,
        stockStatus: this.getStockStatus(result.equipment.currentStock, result.equipment.reorderLevel),
        transaction: result.transaction
      };
    } catch (error) {
      console.error('❌ [REMOVE STOCK] Error:', error);
      if (error.message === 'Equipment not found' || error.message.includes('Insufficient stock')) {
        throw error;
      }
      throw new Error('Failed to remove stock');
    }
  }

  async adjustStock(equipmentId, newQuantity, reason, performedBy) {
    try {
      console.log('🔧 [ADJUST STOCK] Starting...', { equipmentId, newQuantity, reason });
      
      const equipment = await this.validateEquipmentExists(equipmentId);
      const difference = newQuantity - equipment.currentStock;

      console.log('✅ [ADJUST STOCK] Equipment found:', { 
        id: equipment.id, 
        name: equipment.name, 
        category: equipment.category,
        register: equipment.register,
        currentStock: equipment.currentStock,
        newQuantity,
        difference
      });

      if (difference === 0) {
        console.log('⚠️ [ADJUST STOCK] No change in stock, skipping adjustment');
        return {
          ...equipment,
          stockStatus: this.getStockStatus(equipment.currentStock, equipment.reorderLevel)
        };
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create stock transaction
        const transaction = await tx.stockTransaction.create({
          data: {
            transactionType: 'ADJUSTMENT',
            quantity: Math.abs(difference),
            reason: reason || `Stock adjustment: ${difference > 0 ? 'increase' : 'decrease'}`,
            performedBy,
            equipmentId
          }
        });
        console.log('✅ [ADJUST STOCK] Transaction created:', transaction.id);

        // Update equipment stock
        const updatedEquipment = await tx.equipment.update({
          where: { id: equipmentId },
          data: {
            currentStock: newQuantity,
            lastStockUpdate: new Date()
          }
        });
        console.log('✅ [ADJUST STOCK] Equipment updated:', { 
          oldStock: equipment.currentStock,
          newStock: updatedEquipment.currentStock,
          difference
        });

        return { transaction, equipment: updatedEquipment };
      });

      // Sync to register if it's a medicine
      if (result.equipment.category === 'Medicine' && result.equipment.register) {
        console.log('🔄 [ADJUST STOCK] Syncing to register...');
        await this.syncStockToRegister(
          result.equipment.id,
          result.equipment.name,
          result.equipment.currentStock,
          result.equipment.register
        );
        console.log('✅ [ADJUST STOCK] Sync completed successfully');
      }

      return {
        ...result.equipment,
        stockStatus: this.getStockStatus(result.equipment.currentStock, result.equipment.reorderLevel),
        transaction: result.transaction
      };
    } catch (error) {
      console.error('❌ [ADJUST STOCK] Error:', error);
      if (error.message === 'Equipment not found') {
        throw error;
      }
      throw new Error('Failed to adjust stock');
    }
  }

  async getStockTransactions(equipmentId, filters = {}, pagination = {}) {
    const { transactionType, startDate, endDate } = filters;
    const { page = 1, limit = 10 } = pagination;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      equipmentId
    };

    if (transactionType) {
      where.transactionType = transactionType;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = startDate;
      if (endDate) where.transactionDate.lte = endDate;
    }

    try {
      const [rawTransactions, total] = await Promise.all([
        prisma.stockTransaction.findMany({
          where,
          orderBy: { transactionDate: 'desc' },
          skip,
          take: limit,
          include: {
            equipment: {
              select: { name: true, code: true }
            }
          }
        }),
        prisma.stockTransaction.count({ where })
      ]);

      // Fetch staff details for each transaction
      const transactions = await Promise.all(
        rawTransactions.map(async (transaction) => {
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

      const totalPages = Math.ceil(total / limit);

      return {
        transactions,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.error('Error in getStockTransactions service:', error);
      throw new Error('Failed to fetch stock transactions');
    }
  }

  // Analytics and reporting
  async getDashboardStats() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalEquipment,
        activeEquipment,
        lowStockCount,
        nearExpiryCount,
        totalStockValue,
        recentTransactions,
        categoryDistribution,
        topUsedEquipment
      ] = await Promise.all([
        prisma.equipment.count(),
        prisma.equipment.count({ where: { isActive: true } }),
        
        // Low stock count - get all equipment and filter in JavaScript
        prisma.equipment.findMany({
          where: { isActive: true },
          select: { currentStock: true, reorderLevel: true }
        }).then(equipment => 
          equipment.filter(item => item.currentStock <= (item.reorderLevel || 5)).length
        ),

        // Near expiry count
        prisma.equipment.count({
          where: {
            isActive: true,
            expiryDate: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              gte: new Date()
            }
          }
        }),

        // Total stock value - calculate properly
        prisma.equipment.findMany({
          where: { isActive: true },
          select: { currentStock: true, unitCost: true }
        }).then(equipment => 
          equipment.reduce((total, item) => 
            total + (item.currentStock * (item.unitCost || 0)), 0
          )
        ),

        // Recent stock transactions
        prisma.stockTransaction.findMany({
          where: {
            transactionDate: { gte: thirtyDaysAgo },
            equipmentId: { not: null }
          },
          orderBy: { transactionDate: 'desc' },
          take: 10,
          include: {
            equipment: {
              select: { name: true, code: true }
            }
          }
        }),

        // Category distribution
        prisma.equipment.groupBy({
          by: ['category'],
          where: { isActive: true },
          _count: { id: true },
          _sum: { currentStock: true }
        }),

        // Top used equipment (simplified approach)
        prisma.stockTransaction.groupBy({
          by: ['equipmentId'],
          where: {
            transactionDate: { gte: thirtyDaysAgo },
            equipmentId: { not: null },
            transactionType: 'OUT'
          },
          _count: { id: true },
          _sum: { quantity: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10
        }).then(async (results) => {
          // Get equipment details for top used items
          const equipmentIds = results.map(r => r.equipmentId).filter(id => id);
          const equipmentDetails = await prisma.equipment.findMany({
            where: { id: { in: equipmentIds } },
            select: { id: true, name: true, code: true }
          });
          
          return results.map(result => {
            const equipment = equipmentDetails.find(e => e.id === result.equipmentId);
            return {
              id: result.equipmentId,
              name: equipment?.name || 'Unknown',
              code: equipment?.code || 'N/A',
              usageCount: result._count.id,
              totalUsed: result._sum.quantity || 0
            };
          });
        })
      ]);

      return {
        overview: {
          totalEquipment,
          activeEquipment,
          lowStockCount,
          nearExpiryCount,
          totalStockValue
        },
        recentActivity: recentTransactions,
        categoryDistribution: categoryDistribution.map(cat => ({
          category: cat.category,
          count: cat._count.id,
          totalStock: cat._sum.currentStock || 0
        })),
        topUsedEquipment
      };
    } catch (error) {
      console.error('Error in getDashboardStats service:', error);
      throw new Error('Failed to fetch dashboard stats');
    }
  }

  async getUsageAnalytics(dateRange) {
    const { startDate, endDate } = dateRange;

    try {
      // For now, return simple analytics without raw queries to avoid parameter issues
      const [
        totalTransactions,
        dailyUsage,
        categoryUsage
      ] = await Promise.all([
        // Total transactions in date range
        prisma.stockTransaction.count({
          where: {
            transactionDate: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            },
            equipmentId: { not: null }
          }
        }),

        // Daily usage grouped by date
        prisma.stockTransaction.groupBy({
          by: ['transactionDate'],
          where: {
            transactionDate: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            },
            equipmentId: { not: null },
            transactionType: 'OUT'
          },
          _count: { id: true },
          _sum: { quantity: true }
        }),

        // Usage by equipment category
        prisma.stockTransaction.findMany({
          where: {
            transactionDate: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            },
            equipmentId: { not: null },
            transactionType: 'OUT'
          },
          include: {
            equipment: {
              select: { category: true }
            }
          }
        })
      ]);

      // Process category usage
      const categoryUsageMap = {};
      categoryUsage.forEach(transaction => {
        const category = transaction.equipment?.category || 'Unknown';
        if (!categoryUsageMap[category]) {
          categoryUsageMap[category] = { count: 0, quantity: 0 };
        }
        categoryUsageMap[category].count += 1;
        categoryUsageMap[category].quantity += transaction.quantity;
      });

      return {
        totalTransactions,
        dailyUsage: dailyUsage.map(item => ({
          date: item.transactionDate,
          transactionCount: item._count.id,
          totalQuantity: item._sum.quantity || 0
        })),
        categoryUsage: Object.entries(categoryUsageMap).map(([category, data]) => ({
          category,
          usageCount: data.count,
          totalQuantity: data.quantity
        }))
      };
    } catch (error) {
      console.error('Error in getUsageAnalytics service:', error);
      throw new Error('Failed to fetch usage analytics');
    }
  }

  async searchEquipmentWithStock(filters) {
    const { query, category, surgeryTypeId, limit = 20 } = filters;

    const where = {
      isActive: true,
      AND: [
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
            { manufacturer: { contains: query, mode: 'insensitive' } }
          ]
        }
      ]
    };

    if (category) {
      where.AND.push({ category });
    }

    try {
      const equipment = await prisma.equipment.findMany({
        where,
        take: limit,
        orderBy: [
          { currentStock: 'desc' },
          { name: 'asc' }
        ]
      });

      return equipment.map(item => ({
        ...item,
        stockStatus: this.getStockStatus(item.currentStock, item.reorderLevel),
        expiryStatus: this.getExpiryStatus(item.expiryDate)
      }));
    } catch (error) {
      console.error('Error in searchEquipmentWithStock service:', error);
      throw new Error('Failed to search equipment');
    }
  }

  // Validation helpers
  async validateEquipmentExists(id) {
    const equipment = await prisma.equipment.findUnique({
      where: { id }
    });

    if (!equipment) {
      throw new Error('Equipment not found');
    }

    return equipment;
  }

  async checkStockAvailability(equipmentId, requiredQuantity) {
    const equipment = await this.validateEquipmentExists(equipmentId);
    return equipment.currentStock >= requiredQuantity;
  }

  async validateUniqueCode(code, excludeId = null) {
    const where = { code };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await prisma.equipment.findFirst({ where });
    return !existing;
  }

  // Utility methods
  getStockStatus(currentStock, reorderLevel) {
    if (currentStock <= 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'red' };
    } else if (currentStock <= reorderLevel) {
      return { status: 'low-stock', label: 'Low Stock', color: 'yellow' };
    } else {
      return { status: 'in-stock', label: 'In Stock', color: 'green' };
    }
  }

  getExpiryStatus(expiryDate) {
    if (!expiryDate) {
      return { status: 'no-expiry', label: 'No Expiry', color: 'gray' };
    }

    const now = new Date();
    const daysDiff = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
      return { status: 'expired', label: 'Expired', color: 'red' };
    } else if (daysDiff <= 30) {
      return { status: 'near-expiry', label: 'Near Expiry', color: 'orange' };
    } else {
      return { status: 'fresh', label: 'Fresh', color: 'green' };
    }
  }

  async generateEquipmentCode(category) {
    const prefix = category.substring(0, 3).toUpperCase();
    const count = await prisma.equipment.count({
      where: { category }
    });
    
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  // Get all medicines (no pagination)
  async getAllMedicines() {
    try {
      const medicines = await prisma.equipment.findMany({
        where: {
          category: 'Medicine',
          isActive: true
        }
      });
      return medicines;
    } catch (error) {
      console.error('Error fetching all medicines:', error);
      throw new Error('Failed to fetch medicines');
    }
  }
}

module.exports = new EquipmentService();
