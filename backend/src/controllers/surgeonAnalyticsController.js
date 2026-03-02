// src/controllers/surgeonAnalyticsController.js
const prisma = require('../utils/prisma');

class SurgeonAnalyticsController {
  /**
   * Get surgeon analytics data
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getSurgeonAnalytics(req, res) {
    try {
      const surgeonId = req.user.id;

      // Get date range for monthly stats (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Fetch all surgeries for the surgeon
      const allSurgeries = await prisma.ipdAdmission.findMany({
        where: {
          surgeonId: surgeonId,
          surgeryDate: {
            gte: sixMonthsAgo
          }
        },
        include: {
          surgeryTypeDetail: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          surgeryDate: 'asc'
        }
      });

      // Calculate monthly performance
      const monthlyPerformance = {};
      const surgeryDistribution = {};
      let totalDuration = 0;
      let completedCount = 0;
      let complicationsCount = 0;
      let emergencyCount = 0;
      let perfectOutcomesCount = 0;

      allSurgeries.forEach(surgery => {
        const date = new Date(surgery.surgeryDate);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        
        // Monthly stats
        if (!monthlyPerformance[monthKey]) {
          monthlyPerformance[monthKey] = {
            month: monthKey,
            surgeries: 0,
            totalDuration: 0
          };
        }
        monthlyPerformance[monthKey].surgeries++;
        
        // Calculate duration if available
        if (surgery.surgeryStartTime && surgery.surgeryEndTime) {
          const duration = Math.round(
            (new Date(surgery.surgeryEndTime) - new Date(surgery.surgeryStartTime)) / (1000 * 60)
          );
          monthlyPerformance[monthKey].totalDuration += duration;
          totalDuration += duration;
        }

        // Surgery type distribution
        const surgeryType = surgery.surgeryTypeDetail?.name || 'Other';
        if (!surgeryDistribution[surgeryType]) {
          surgeryDistribution[surgeryType] = 0;
        }
        surgeryDistribution[surgeryType]++;

        // Count completed surgeries
        if (surgery.status === 'SURGERY_COMPLETED' || surgery.status === 'COMPLETED') {
          completedCount++;
          
          // Count perfect outcomes (completed without complications)
          if (!surgery.complications || surgery.complications === 'None' || surgery.complications === '') {
            perfectOutcomesCount++;
          }
        }

        // Count complications
        if (surgery.complications && surgery.complications !== 'None' && surgery.complications !== '') {
          complicationsCount++;
        }

        // Count emergency cases
        if (surgery.priority === 'EMERGENCY' || surgery.isEmergency) {
          emergencyCount++;
        }
      });

      // Format monthly performance data
      const monthlyStats = Object.values(monthlyPerformance).map(month => ({
        month: month.month,
        surgeries: month.surgeries,
        avgDuration: month.surgeries > 0 ? Math.round(month.totalDuration / month.surgeries) : 0
      }));

      // Format surgery distribution with colors
      const colorPalette = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
      const surgeryTypes = Object.entries(surgeryDistribution).map(([name, value], index) => ({
        name,
        value,
        color: colorPalette[index % colorPalette.length]
      }));

      // Calculate performance metrics
      const avgSurgeryDuration = completedCount > 0 ? Math.round(totalDuration / completedCount) : 0;
      const successRate = completedCount > 0 ? Math.round((perfectOutcomesCount / completedCount) * 100) : 100;
      const complicationRate = completedCount > 0 ? Math.round((complicationsCount / completedCount) * 100) : 0;

      // Get current month surgeries
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthSurgeries = allSurgeries.filter(s => new Date(s.surgeryDate) >= firstDayOfMonth);

      res.json({
        success: true,
        data: {
          monthlyPerformance: monthlyStats,
          surgeryDistribution: surgeryTypes,
          performanceMetrics: {
            successRate,
            avgSurgeryDuration,
            complicationRate
          },
          monthlyStatistics: {
            totalSurgeries: currentMonthSurgeries.length,
            emergencyCases: currentMonthSurgeries.filter(s => s.priority === 'EMERGENCY' || s.isEmergency).length,
            complications: currentMonthSurgeries.filter(s => s.complications && s.complications !== 'None' && s.complications !== '').length,
            perfectOutcomes: currentMonthSurgeries.filter(s => 
              (s.status === 'SURGERY_COMPLETED' || s.status === 'COMPLETED') &&
              (!s.complications || s.complications === 'None' || s.complications === '')
            ).length
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching surgeon analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new SurgeonAnalyticsController();
