const prisma = require('../utils/prisma');

class EyeDropReasonService {
  /**
   * Get all eye drop reasons
   */
  async getAllReasons() {
    try {
      const reasons = await prisma.eyeDropReason.findMany({
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      return reasons;
    } catch (error) {
      console.error('Error fetching eye drop reasons:', error);
      throw new Error('Failed to fetch eye drop reasons');
    }
  }

  /**
   * Create a new eye drop reason
   */
  async createReason(reason) {
    try {
      // Check if reason already exists
      const existing = await prisma.eyeDropReason.findUnique({
        where: { reason }
      });
      
      if (existing) {
        throw new Error('This reason already exists');
      }
      
      const newReason = await prisma.eyeDropReason.create({
        data: { reason }
      });
      
      console.log('✅ Eye drop reason created:', newReason);
      return newReason;
    } catch (error) {
      console.error('Error creating eye drop reason:', error);
      throw error;
    }
  }

  /**
   * Update an eye drop reason
   */
  async updateReason(id, reason) {
    try {
      // Check if reason exists
      const existing = await prisma.eyeDropReason.findUnique({
        where: { id }
      });
      
      if (!existing) {
        throw new Error('Eye drop reason not found');
      }
      
      // Check if new reason text already exists (for another record)
      const duplicate = await prisma.eyeDropReason.findFirst({
        where: {
          reason,
          id: { not: id }
        }
      });
      
      if (duplicate) {
        throw new Error('This reason already exists');
      }
      
      const updatedReason = await prisma.eyeDropReason.update({
        where: { id },
        data: { reason }
      });
      
      console.log('✅ Eye drop reason updated:', updatedReason);
      return updatedReason;
    } catch (error) {
      console.error('Error updating eye drop reason:', error);
      throw error;
    }
  }

  /**
   * Delete an eye drop reason
   */
  async deleteReason(id) {
    try {
      // Check if reason exists
      const existing = await prisma.eyeDropReason.findUnique({
        where: { id }
      });
      
      if (!existing) {
        throw new Error('Eye drop reason not found');
      }
      
      await prisma.eyeDropReason.delete({
        where: { id }
      });
      
      console.log('✅ Eye drop reason deleted:', id);
      return true;
    } catch (error) {
      console.error('Error deleting eye drop reason:', error);
      throw error;
    }
  }
}

module.exports = new EyeDropReasonService();
