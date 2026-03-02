const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all staff types
const getAllStaffTypes = async (req, res) => {
  try {
    const staffTypes = await prisma.staffType.findMany({
      orderBy: { type: 'asc' }
    });

    // Return array directly to match frontend expectation
    res.json(staffTypes);
  } catch (error) {
    console.error('Get staff types error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff types'
    });
  }
};

// Get only active staff types (same as all since there's no isActive field)
const getActiveStaffTypes = async (req, res) => {
  try {
    const staffTypes = await prisma.staffType.findMany({
      orderBy: { type: 'asc' }
    });

    // Return array directly to match frontend expectation
    res.json(staffTypes);
  } catch (error) {
    console.error('Get active staff types error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active staff types'
    });
  }
};

module.exports = {
  getAllStaffTypes,
  getActiveStaffTypes
};
