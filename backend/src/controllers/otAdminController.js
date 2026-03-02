// src/controllers/otAdminController.js
const prisma = require('../utils/prisma');

class OTAdminController {
  // =================
  // COMPLETED SURGERIES MANAGEMENT
  // =================

  /**
   * Get completed surgeries for OT Admin equipment management
   */
  async getCompletedSurgeries(req, res) {
    try {
      const completedSurgeries = await prisma.ipdAdmission.findMany({
        where: {
          status: 'SURGERY_COMPLETED'
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              patientNumber: true,
              phone: true,
              email: true,
              address: true
            }
          },
          surgeryTypeDetail: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          lens: {
            select: {
              id: true,
              lensName: true,
              lensType: true,
              lensCategory: true,
              manufacturer: true
            }
          },
          surgeon: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffType: true,
              employeeId: true
            }
          }
        },
        orderBy: {
          surgeryEndTime: 'desc'
        }
      });

      res.json({
        success: true,
        message: 'Completed surgeries fetched successfully',
        data: completedSurgeries
      });

    } catch (error) {
      console.error('❌ Error fetching completed surgeries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch completed surgeries',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get surgery details with equipment information
   */
  async getSurgeryDetails(req, res) {
    try {
      const { admissionId } = req.params;

      if (!admissionId) {
        return res.status(400).json({
          success: false,
          message: 'Admission ID is required'
        });
      }

      const surgeryDetails = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              patientNumber: true,
              phone: true,
              email: true,
              address: true
            }
          },
          surgeryTypeDetail: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          lens: {
            select: {
              id: true,
              lensName: true,
              lensType: true,
              lensCategory: true,
              manufacturer: true
            }
          },
          surgeon: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              staffType: true,
              employeeId: true
            }
          }
        }
      });

      if (!surgeryDetails) {
        return res.status(404).json({
          success: false,
          message: 'Surgery not found'
        });
      }

      res.json({
        success: true,
        message: 'Surgery details fetched successfully',
        data: surgeryDetails
      });

    } catch (error) {
      console.error('❌ Error fetching surgery details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch surgery details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get equipment master data for adjustments
   */
  async getEquipmentMasterData(req, res) {
    try {
      const [equipment, lenses] = await Promise.all([
        prisma.equipment.findMany({
          select: {
            id: true,
            name: true,
            category: true,
            currentStock: true,
            manufacturer: true,
            code: true
          },
          orderBy: [
            { category: 'asc' },
            { name: 'asc' }
          ]
        }),
        prisma.lens.findMany({
          select: {
            id: true,
            lensName: true,
            lensType: true,
            lensCategory: true,
            manufacturer: true,
            stockQuantity: true,
            patientCost: true
          },
          orderBy: [
            { lensCategory: 'asc' },
            { lensName: 'asc' }
          ]
        })
      ]);

      res.json({
        success: true,
        message: 'Equipment master data fetched successfully',
        data: {
          equipment,
          lenses
        }
      });

    } catch (error) {
      console.error('❌ Error fetching equipment master data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch equipment master data',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Finalize equipment stock adjustments after surgery
   */
  async finalizeEquipmentStock(req, res) {
    try {
      const { admissionId } = req.params;
      const { unusedEquipment, extraEquipment, unusedLenses, extraLenses, notes } = req.body;

      if (!admissionId) {
        return res.status(400).json({
          success: false,
          message: 'Admission ID is required'
        });
      }

      // Check if admission exists and is completed
      const admission = await prisma.ipdAdmission.findUnique({
        where: { id: admissionId },
        include: { patient: true }
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'IPD Admission not found'
        });
      }

      if (admission.status !== 'SURGERY_COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Surgery is not completed for this patient'
        });
      }

      console.log('Processing stock adjustments for admission:', admissionId);
      console.log('Payload received:', { unusedEquipment, extraEquipment, unusedLenses });

      // Process stock adjustments
      const stockTransactions = [];
      const stockUpdates = [];

      // Process unused equipment (return to stock)
      for (const item of unusedEquipment || []) {
        if (item.equipmentId && item.quantity > 0) {
          stockTransactions.push({
            equipmentId: item.equipmentId,
            transactionType: 'IN',
            quantity: item.quantity,
            reason: `Surgery completion - unused equipment returned: ${item.reason}`,
            performedBy: req.user?.id || 'system',
            transactionDate: new Date(),
            ipdAdmissionId: admission.id
          });

          stockUpdates.push({
            table: 'equipment',
            id: item.equipmentId,
            increment: item.quantity
          });
        }
      }

      // Process extra equipment used (deduct from stock)
      for (const item of extraEquipment || []) {
        if (item.equipmentId && item.quantity > 0) {
          stockTransactions.push({
            equipmentId: item.equipmentId,
            transactionType: 'OUT',
            quantity: item.quantity,
            reason: `Surgery completion - extra equipment used: ${item.reason}`,
            performedBy: req.user?.id || 'system',
            transactionDate: new Date(),
            ipdAdmissionId: admission.id
          });

          stockUpdates.push({
            table: 'equipment',
            id: item.equipmentId,
            increment: -item.quantity
          });
        }
      }

      // Process unused lenses (return to stock)
      for (const item of unusedLenses || []) {
        if (item.lensId && item.quantity > 0) {
          stockTransactions.push({
            lensId: item.lensId,
            transactionType: 'IN',
            quantity: item.quantity,
            reason: `Surgery completion - unused lens returned: ${item.reason}`,
            performedBy: req.user?.id || 'system',
            transactionDate: new Date(),
            ipdAdmissionId: admission.id
          });

          stockUpdates.push({
            table: 'lens',
            id: item.lensId, // Keep as string for CUID
            increment: item.quantity
          });
        }
      }

      // Process extra lenses used (deduct from stock)
      for (const item of extraLenses || []) {
        if (item.lensId && item.quantity > 0) {
          stockTransactions.push({
            lensId: item.lensId,
            transactionType: 'OUT',
            quantity: item.quantity,
            reason: `Surgery completion - extra lens used: ${item.reason}`,
            performedBy: req.user?.id || 'system',
            transactionDate: new Date(),
            ipdAdmissionId: admission.id
          });

          stockUpdates.push({
            table: 'lens',
            id: item.lensId,
            increment: -item.quantity
          });
        }
      }

      // Execute all operations in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create stock transactions
        for (const transaction of stockTransactions) {
          await tx.stockTransaction.create({
            data: transaction
          });
        }

        // Update stock levels
        for (const update of stockUpdates) {
          if (update.table === 'equipment') {
            await tx.equipment.update({
              where: { id: update.id },
              data: {
                currentStock: {
                  increment: update.increment
                }
              }
            });
          } else if (update.table === 'lens') {
            await tx.lens.update({
              where: { id: update.id },
              data: {
                stockQuantity: {
                  increment: update.increment
                }
              }
            });
          }
        }

        // Update admission with finalization data and JSON field updates
        const finalizationData = {
          finalizedAt: new Date().toISOString(),
          finalizedBy: req.user?.id || 'system',
          notes: notes || '',
          adjustments: {
            unusedEquipment: unusedEquipment || [],
            extraEquipment: extraEquipment || [],
            unusedLenses: unusedLenses || [],
            extraLenses: extraLenses || []
          }
        };

        // Prepare updated JSON fields
        const currentRequiredEquipments = admission.requiredEquipments || {};
        const currentRequiredLenses = admission.requiredLenses || {};

        // Add extra equipment to requiredEquipments JSON
        const updatedRequiredEquipments = { ...currentRequiredEquipments };
        for (const item of extraEquipment || []) {
          if (item.equipmentId && item.quantity > 0) {
            // Get equipment details for proper format
            const equipment = await tx.equipment.findUnique({
              where: { id: item.equipmentId },
              select: {
                id: true,
                name: true,
                category: true,
                manufacturer: true
              }
            });

            if (equipment) {
              updatedRequiredEquipments[item.equipmentId] = {
                equipmentId: item.equipmentId,
                name: equipment.name,
                category: equipment.category,
                manufacturer: equipment.manufacturer || null,
                quantity: item.quantity,
                reason: item.reason || 'Extra equipment used during surgery',
                addedAt: new Date().toISOString()
              };
            }
          }
        }

        // Remove unused lenses from requiredLenses JSON
        const updatedRequiredLenses = { ...currentRequiredLenses };
        for (const item of unusedLenses || []) {
          if (item.lensId && updatedRequiredLenses[item.lensId]) {
            delete updatedRequiredLenses[item.lensId];
          }
        }

        const updatedAdmission = await tx.ipdAdmission.update({
          where: { id: admissionId },
          data: {
            remainingEquipments: finalizationData,
            requiredEquipments: updatedRequiredEquipments,
            requiredLenses: updatedRequiredLenses
          }
        });

        return updatedAdmission;
      });

      res.json({
        success: true,
        message: 'Equipment stock finalized successfully',
        data: {
          admissionId: result.id,
          transactionsCreated: stockTransactions.length,
          stockUpdates: stockUpdates.length
        }
      });

    } catch (error) {
      console.error('❌ Error finalizing equipment stock:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to finalize equipment stock',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new OTAdminController();