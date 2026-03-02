// src/controllers/lensController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/*
========================================
🔍 LENS CONTROLLER
========================================

Controller for managing lens operations:
- Get all available lenses for surgery scheduling
- Search and filter lenses by type, category, manufacturer
- Lens catalog management for TPA and surgical staff
*/

const lensController = {

  // ==========================================
  // GET ALL AVAILABLE LENSES FOR SURGERY
  // ==========================================
  async getAvailableLenses(req, res) {
    try {
      const { 
        search, 
        lensType, 
        lensCategory, 
        manufacturer, 
        minPrice, 
        maxPrice,
        page = 1, 
        limit = 50 
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause for filtering
      const whereClause = {
        isActive: true,
        isAvailable: true,
        AND: []
      };

      // Add search filter
      if (search) {
        whereClause.AND.push({
          OR: [
            { lensName: { contains: search, mode: 'insensitive' } },
            { manufacturer: { contains: search, mode: 'insensitive' } },
            { model: { contains: search, mode: 'insensitive' } },
            { lensCode: { contains: search, mode: 'insensitive' } }
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
        whereClause.AND.push({ patientCost: priceFilter });
      }

      // Remove empty AND array
      if (whereClause.AND.length === 0) {
        delete whereClause.AND;
      }

      // Get lenses with pagination
      const [lenses, totalCount] = await Promise.all([
        prisma.lens.findMany({
          where: whereClause,
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
            diameter: true,
            features: true,
            benefits: true,
            suitableFor: true,
            contraindications: true,
            lensoCost: true,
            patientCost: true,
            insuranceCoverage: true,
            stockQuantity: true,
            fdaApproved: true,
            ceMarked: true,
            successRate: true,
            complicationRate: true,
            totalImplants: true
          },
          orderBy: [
            { manufacturer: 'asc' },
            { lensName: 'asc' }
          ],
          skip: skip,
          take: parseInt(limit)
        }),
        prisma.lens.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: lenses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        },
        filters: {
          search,
          lensType,
          lensCategory,
          manufacturer,
          minPrice,
          maxPrice
        }
      });

    } catch (error) {
      console.error('Get available lenses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available lenses',
        error: error.message
      });
    }
  },

  // ==========================================
  // GET ALL LENSES (COMPREHENSIVE LIST)
  // ==========================================
  async getAllLenses(req, res) {
    try {
      const { 
        search, 
        lensType, 
        lensCategory, 
        manufacturer,
        isActive,
        isAvailable,
        page = 1, 
        limit = 100 
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const whereClause = {};

      if (search) {
        whereClause.OR = [
          { lensName: { contains: search, mode: 'insensitive' } },
          { manufacturer: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { lensCode: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (lensType) whereClause.lensType = lensType;
      if (lensCategory) whereClause.lensCategory = lensCategory;
      if (manufacturer) {
        whereClause.manufacturer = { contains: manufacturer, mode: 'insensitive' };
      }
      if (isActive !== undefined) whereClause.isActive = isActive === 'true';
      if (isAvailable !== undefined) whereClause.isAvailable = isAvailable === 'true';

      const [lenses, totalCount] = await Promise.all([
        prisma.lens.findMany({
          where: whereClause,
          orderBy: [
            { manufacturer: 'asc' },
            { lensName: 'asc' }
          ],
          skip: skip,
          take: parseInt(limit)
        }),
        prisma.lens.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: lenses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get all lenses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lenses',
        error: error.message
      });
    }
  },

  // ==========================================
  // GET LENS BY ID
  // ==========================================
  async getLensById(req, res) {
    try {
      const { lensId } = req.params;

      const lens = await prisma.lens.findUnique({
        where: { id: lensId },
        include: {
          packages: {
            include: {
              package: {
                select: {
                  id: true,
                  packageName: true,
                  packageCode: true,
                  packageCost: true,
                  description: true
                }
              }
            }
          },
          ipdAdmissions: {
            where: { lensRequired: true },
            select: {
              id: true,
              admissionNumber: true,
              surgeryDate: true,
              status: true,
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

      if (!lens) {
        return res.status(404).json({
          success: false,
          message: 'Lens not found'
        });
      }

      res.json({
        success: true,
        data: lens
      });

    } catch (error) {
      console.error('Get lens by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lens details',
        error: error.message
      });
    }
  },

  // ==========================================
  // GET LENSES BY TYPE
  // ==========================================
  async getLensesByType(req, res) {
    try {
      const { lensType } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [lenses, totalCount] = await Promise.all([
        prisma.lens.findMany({
          where: {
            lensType: lensType,
            isActive: true,
            isAvailable: true
          },
          select: {
            id: true,
            lensName: true,
            lensCode: true,
            manufacturer: true,
            model: true,
            lensCategory: true,
            patientCost: true,
            stockQuantity: true,
            features: true,
            benefits: true
          },
          orderBy: [
            { manufacturer: 'asc' },
            { patientCost: 'asc' }
          ],
          skip: skip,
          take: parseInt(limit)
        }),
        prisma.lens.count({
          where: {
            lensType: lensType,
            isActive: true,
            isAvailable: true
          }
        })
      ]);

      res.json({
        success: true,
        data: lenses,
        lensType: lensType,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get lenses by type error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lenses by type',
        error: error.message
      });
    }
  },

  // ==========================================
  // GET LENSES BY CATEGORY
  // ==========================================
  async getLensesByCategory(req, res) {
    try {
      const { lensCategory } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [lenses, totalCount] = await Promise.all([
        prisma.lens.findMany({
          where: {
            lensCategory: lensCategory,
            isActive: true,
            isAvailable: true
          },
          select: {
            id: true,
            lensName: true,
            lensCode: true,
            manufacturer: true,
            model: true,
            lensType: true,
            patientCost: true,
            stockQuantity: true,
            features: true,
            benefits: true
          },
          orderBy: [
            { manufacturer: 'asc' },
            { patientCost: 'asc' }
          ],
          skip: skip,
          take: parseInt(limit)
        }),
        prisma.lens.count({
          where: {
            lensCategory: lensCategory,
            isActive: true,
            isAvailable: true
          }
        })
      ]);

      res.json({
        success: true,
        data: lenses,
        lensCategory: lensCategory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get lenses by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lenses by category',
        error: error.message
      });
    }
  },

  // ==========================================
  // GET LENSES BY MANUFACTURER
  // ==========================================
  async getLensesByManufacturer(req, res) {
    try {
      const { manufacturer } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [lenses, totalCount] = await Promise.all([
        prisma.lens.findMany({
          where: {
            manufacturer: { contains: manufacturer, mode: 'insensitive' },
            isActive: true,
            isAvailable: true
          },
          select: {
            id: true,
            lensName: true,
            lensCode: true,
            model: true,
            lensType: true,
            lensCategory: true,
            patientCost: true,
            stockQuantity: true,
            features: true,
            benefits: true
          },
          orderBy: [
            { lensCategory: 'asc' },
            { patientCost: 'asc' }
          ],
          skip: skip,
          take: parseInt(limit)
        }),
        prisma.lens.count({
          where: {
            manufacturer: { contains: manufacturer, mode: 'insensitive' },
            isActive: true,
            isAvailable: true
          }
        })
      ]);

      res.json({
        success: true,
        data: lenses,
        manufacturer: manufacturer,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Get lenses by manufacturer error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch lenses by manufacturer',
        error: error.message
      });
    }
  },

  // ==========================================
  // SEARCH LENSES
  // ==========================================
  async searchLenses(req, res) {
    try {
      const { searchTerm } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [lenses, totalCount] = await Promise.all([
        prisma.lens.findMany({
          where: {
            AND: [
              { isActive: true },
              { isAvailable: true },
              {
                OR: [
                  { lensName: { contains: searchTerm, mode: 'insensitive' } },
                  { manufacturer: { contains: searchTerm, mode: 'insensitive' } },
                  { model: { contains: searchTerm, mode: 'insensitive' } },
                  { lensCode: { contains: searchTerm, mode: 'insensitive' } }
                ]
              }
            ]
          },
          select: {
            id: true,
            lensName: true,
            lensCode: true,
            manufacturer: true,
            model: true,
            lensType: true,
            lensCategory: true,
            patientCost: true,
            stockQuantity: true,
            features: true,
            benefits: true
          },
          orderBy: [
            { manufacturer: 'asc' },
            { lensName: 'asc' }
          ],
          skip: skip,
          take: parseInt(limit)
        }),
        prisma.lens.count({
          where: {
            AND: [
              { isActive: true },
              { isAvailable: true },
              {
                OR: [
                  { lensName: { contains: searchTerm, mode: 'insensitive' } },
                  { manufacturer: { contains: searchTerm, mode: 'insensitive' } },
                  { model: { contains: searchTerm, mode: 'insensitive' } },
                  { lensCode: { contains: searchTerm, mode: 'insensitive' } }
                ]
              }
            ]
          }
        })
      ]);

      res.json({
        success: true,
        data: lenses,
        searchTerm: searchTerm,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Search lenses error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search lenses',
        error: error.message
      });
    }
  }

};

module.exports = lensController;