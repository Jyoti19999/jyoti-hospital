const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all active insurance providers
 */
const getAllInsuranceProviders = async (req, res) => {
  try {
    console.log('📋 Fetching all active insurance providers');

    const providers = await prisma.insuranceProvider.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { preferredProvider: 'desc' },
        { providerName: 'asc' }
      ],
      select: {
        id: true,
        providerName: true,
        providerCode: true,
        phoneNumber: true,
        email: true,
        cashlessSupported: true,
        reimbursementSupported: true,
        networkHospital: true,
        preferredProvider: true,
        averageSettlementDays: true
      }
    });

    console.log(`✅ Found ${providers.length} active insurance providers`);

    return res.json({
      success: true,
      count: providers.length,
      data: providers
    });
  } catch (error) {
    console.error('❌ Error fetching insurance providers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance providers',
      error: error.message
    });
  }
};

/**
 * Get insurance provider by ID
 */
const getInsuranceProviderById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📋 Fetching insurance provider:', id);

    const provider = await prisma.insuranceProvider.findUnique({
      where: { id },
      include: {
        _count: {
          select: { ipdAdmissions: true }
        }
      }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Insurance provider not found'
      });
    }

    console.log('✅ Insurance provider fetched successfully');

    return res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    console.error('❌ Error fetching insurance provider:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch insurance provider',
      error: error.message
    });
  }
};

/**
 * Create new insurance provider
 */
const createInsuranceProvider = async (req, res) => {
  try {
    const staffId = req.user?.id;
    const providerData = req.body;

    console.log('➕ Creating new insurance provider:', providerData.providerName);

    // Check if provider with same name already exists
    const existingProvider = await prisma.insuranceProvider.findUnique({
      where: { providerName: providerData.providerName }
    });

    if (existingProvider) {
      return res.status(400).json({
        success: false,
        message: 'Insurance provider with this name already exists'
      });
    }

    const newProvider = await prisma.insuranceProvider.create({
      data: {
        ...providerData,
        createdBy: staffId || null
      }
    });

    console.log('✅ Insurance provider created successfully:', newProvider.id);

    return res.status(201).json({
      success: true,
      message: 'Insurance provider created successfully',
      data: newProvider
    });
  } catch (error) {
    console.error('❌ Error creating insurance provider:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create insurance provider',
      error: error.message
    });
  }
};

/**
 * Update insurance provider
 */
const updateInsuranceProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log('🔄 Updating insurance provider:', id);

    const provider = await prisma.insuranceProvider.findUnique({
      where: { id }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Insurance provider not found'
      });
    }

    const updatedProvider = await prisma.insuranceProvider.update({
      where: { id },
      data: updateData
    });

    console.log('✅ Insurance provider updated successfully');

    return res.json({
      success: true,
      message: 'Insurance provider updated successfully',
      data: updatedProvider
    });
  } catch (error) {
    console.error('❌ Error updating insurance provider:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update insurance provider',
      error: error.message
    });
  }
};

/**
 * Delete (deactivate) insurance provider
 */
const deleteInsuranceProvider = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deactivating insurance provider:', id);

    const provider = await prisma.insuranceProvider.findUnique({
      where: { id }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Insurance provider not found'
      });
    }

    // Soft delete by setting isActive to false
    const deactivatedProvider = await prisma.insuranceProvider.update({
      where: { id },
      data: { isActive: false }
    });

    console.log('✅ Insurance provider deactivated successfully');

    return res.json({
      success: true,
      message: 'Insurance provider deactivated successfully',
      data: deactivatedProvider
    });
  } catch (error) {
    console.error('❌ Error deleting insurance provider:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete insurance provider',
      error: error.message
    });
  }
};

module.exports = {
  getAllInsuranceProviders,
  getInsuranceProviderById,
  createInsuranceProvider,
  updateInsuranceProvider,
  deleteInsuranceProvider
};
