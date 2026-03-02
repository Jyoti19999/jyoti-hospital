// src/controllers/otRoomController.js
const prisma = require('../utils/prisma');

class OTRoomController {
  /**
   * Get all OT rooms with latest environmental data
   */
  async getAllOTRooms(req, res) {
    try {
      console.log('🔍 Prisma object:', prisma ? 'Defined' : 'UNDEFINED');
      console.log('🔍 Prisma.oTRoom:', prisma?.oTRoom ? 'Exists' : 'DOES NOT EXIST');
      
      const otRooms = await prisma.oTRoom.findMany({
        include: {
          otTemperatureRegisters: {
            orderBy: {
              date: 'desc'
            },
            take: 1
          },
          equipment: {
            where: {
              isActive: true
            },
            select: {
              id: true,
              equipmentName: true,
              equipmentCode: true,
              category: true,
              status: true,
              model: true,
              manufacturer: true
            },
            orderBy: {
              equipmentName: 'asc'
            }
          }
        },
        orderBy: {
          roomNumber: 'asc'
        }
      });

      // Format the response with latest environmental data
      const formattedRooms = otRooms.map(room => {
        const latestRegister = room.otTemperatureRegisters[0];
        let latestEnvironmentalData = null;

        if (latestRegister) {
          const now = new Date();
          const currentHour = now.getHours();

          // Determine which time slot to show based on current time
          let temperature, humidity, pressure;

          if (currentHour >= 18 || currentHour < 9) {
            // Show 6 PM data
            temperature = latestRegister.temperature6Pm;
            humidity = latestRegister.humidity6Pm;
            pressure = latestRegister.pressure6Pm;
          } else if (currentHour >= 15) {
            // Show 3 PM data
            temperature = latestRegister.temperature3Pm;
            humidity = latestRegister.humidity3Pm;
            pressure = latestRegister.pressure3Pm;
          } else if (currentHour >= 12) {
            // Show 12 PM data
            temperature = latestRegister.temperature12Pm;
            humidity = latestRegister.humidity12Pm;
            pressure = latestRegister.pressure12Pm;
          } else {
            // Show 9 AM data
            temperature = latestRegister.temperature9Am;
            humidity = latestRegister.humidity9Am;
            pressure = latestRegister.pressure9Am;
          }

          latestEnvironmentalData = {
            temperature: temperature || 'N/A',
            humidity: humidity || 'N/A',
            pressure: pressure || 'N/A',
            recordedAt: latestRegister.date
          };
        }

        return {
          ...room,
          latestEnvironmentalData
          // Keep otTemperatureRegisters for frontend to access all readings
        };
      });

      res.json({
        success: true,
        data: formattedRooms,
        count: formattedRooms.length
      });
    } catch (error) {
      console.error('❌ Error fetching OT rooms:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch OT rooms',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get single OT room by ID
   */
  async getOTRoomById(req, res) {
    try {
      const { id } = req.params;

      const otRoom = await prisma.oTRoom.findUnique({
        where: { id },
        include: {
          otTemperatureRegisters: {
            orderBy: {
              date: 'desc'
            },
            take: 10 // Get last 10 records
          }
        }
      });

      if (!otRoom) {
        return res.status(404).json({
          success: false,
          message: 'OT Room not found'
        });
      }

      res.json({
        success: true,
        data: otRoom
      });
    } catch (error) {
      console.error('❌ Error fetching OT room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch OT room',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Create new OT room
   */
  async createOTRoom(req, res) {
    try {
      const {
        roomNumber,
        roomName,
        capacity,
        status,
        dailyRate,
        hourlyRate,
        surgeryTypeIds,
        equipmentInstalled
      } = req.body;

      // Validate required fields
      if (!roomNumber || !roomName) {
        return res.status(400).json({
          success: false,
          message: 'Room number and room name are required'
        });
      }

      // Check if room number already exists
      const existingRoom = await prisma.oTRoom.findUnique({
        where: { roomNumber }
      });

      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: 'Room number already exists'
        });
      }

      const otRoom = await prisma.oTRoom.create({
        data: {
          roomNumber,
          roomName,
          capacity: capacity ? parseInt(capacity) : null,
          status: status ? status.toUpperCase() : 'AVAILABLE',
          dailyRate: dailyRate ? parseFloat(dailyRate) : null,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          surgeryTypeIds: surgeryTypeIds || [],
          equipmentInstalled: equipmentInstalled || [],
          createdBy: req.user?.id || null
        }
      });

      console.log('✅ OT Room created:', otRoom.roomNumber);

      res.status(201).json({
        success: true,
        message: 'OT Room created successfully',
        data: otRoom
      });
    } catch (error) {
      console.error('❌ Error creating OT room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create OT room',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update OT room
   */
  async updateOTRoom(req, res) {
    try {
      const { id } = req.params;
      const {
        roomNumber,
        roomName,
        capacity,
        status,
        dailyRate,
        hourlyRate,
        surgeryTypeIds,
        equipmentInstalled
      } = req.body;

      // Check if room exists
      const existingRoom = await prisma.oTRoom.findUnique({
        where: { id }
      });

      if (!existingRoom) {
        return res.status(404).json({
          success: false,
          message: 'OT Room not found'
        });
      }

      // If room number is being changed, check if new number already exists
      if (roomNumber && roomNumber !== existingRoom.roomNumber) {
        const duplicateRoom = await prisma.oTRoom.findUnique({
          where: { roomNumber }
        });

        if (duplicateRoom) {
          return res.status(400).json({
            success: false,
            message: 'Room number already exists'
          });
        }
      }

      const updatedRoom = await prisma.oTRoom.update({
        where: { id },
        data: {
          roomNumber: roomNumber || existingRoom.roomNumber,
          roomName: roomName || existingRoom.roomName,
          capacity: capacity !== undefined ? parseInt(capacity) : existingRoom.capacity,
          status: status ? status.toUpperCase() : existingRoom.status,
          dailyRate: dailyRate !== undefined ? parseFloat(dailyRate) : existingRoom.dailyRate,
          hourlyRate: hourlyRate !== undefined ? parseFloat(hourlyRate) : existingRoom.hourlyRate,
          surgeryTypeIds: surgeryTypeIds !== undefined ? surgeryTypeIds : existingRoom.surgeryTypeIds,
          equipmentInstalled: equipmentInstalled !== undefined ? equipmentInstalled : existingRoom.equipmentInstalled
        }
      });

      console.log('✅ OT Room updated:', updatedRoom.roomNumber);

      res.json({
        success: true,
        message: 'OT Room updated successfully',
        data: updatedRoom
      });
    } catch (error) {
      console.error('❌ Error updating OT room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update OT room',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Delete OT room
   */
  async deleteOTRoom(req, res) {
    try {
      const { id } = req.params;

      // Check if room exists
      const existingRoom = await prisma.oTRoom.findUnique({
        where: { id }
      });

      if (!existingRoom) {
        return res.status(404).json({
          success: false,
          message: 'OT Room not found'
        });
      }

      // Delete the OT room (cascade will set otRoomId to null in temperature registers)
      await prisma.oTRoom.delete({
        where: { id }
      });

      console.log('✅ OT Room deleted:', existingRoom.roomNumber);

      res.json({
        success: true,
        message: 'OT Room deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error deleting OT room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete OT room',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new OTRoomController();
