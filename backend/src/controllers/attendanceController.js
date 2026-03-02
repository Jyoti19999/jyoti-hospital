const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { emitStaffCheckIn, emitStaffCheckOut } = require('../socket/channels/attendanceChannel');
const otpService = require('../services/otpService');
const GeofencingService = require('../utils/geofencing');
const QRGenerator = require('../utils/qrGenerator');
const { getActiveShiftConfig, getShiftStartDate, getShiftEndDate } = require('./salaryController');

// Helper function to get date without time
const getDateOnly = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Helper function to check if a date is within the editable period
const isDateEditable = (targetDate) => {
  const today = getDateOnly(new Date());
  const target = getDateOnly(targetDate);

  // Cannot edit future dates
  if (target > today) {
    return { editable: false, reason: 'Cannot mark attendance for future dates' };
  }

  // Get cutoff days from environment variable (default to 2 if not set)
  const cutoffDays = parseInt(process.env.ATTENDANCE_EDIT_CUTOFF_DAYS || '2', 10);

  // Calculate the cutoff date
  // If today is in month M, we can edit dates from month M-1 until day cutoffDays of month M
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

  const targetMonth = target.getMonth();
  const targetYear = target.getFullYear();

  // If target is in current month or future, it's editable (unless it's future date, already checked above)
  if (targetYear > currentYear || (targetYear === currentYear && targetMonth >= currentMonth)) {
    return { editable: true };
  }

  // If target is in previous month
  if (targetYear === currentYear && targetMonth === currentMonth - 1) {
    // Can edit if we're still within cutoff days of current month
    if (currentDay <= cutoffDays) {
      return { editable: true };
    } else {
      return { editable: false, reason: `Attendance for previous month can only be edited until day ${cutoffDays} of current month` };
    }
  }

  // If target is from year before and it's January now
  if (targetYear === currentYear - 1 && currentMonth === 0 && targetMonth === 11) {
    // December of last year, can edit if we're within cutoff days of January
    if (currentDay <= cutoffDays) {
      return { editable: true };
    } else {
      return { editable: false, reason: `Attendance for previous month can only be edited until day ${cutoffDays} of current month` };
    }
  }

  // All other past dates are not editable
  return { editable: false, reason: 'Attendance for this date is locked and cannot be edited' };
};

// Helper function to calculate working hours
const calculateWorkingHours = (checkInTime, checkOutTime) => {
  if (!checkInTime || !checkOutTime) return 0;
  const diffMs = new Date(checkOutTime) - new Date(checkInTime);
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
};

// Staff check-in
const checkIn = async (req, res) => {
  try {
    const { id: staffId, staffType } = req.user;
    const today = getDateOnly();
    const checkInTime = new Date();

    // Check if already checked in today (and not checked out)
    const existingRecord = await prisma.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId,
          date: today
        }
      }
    });

    // Only prevent check-in if user is currently checked in (has checkInTime but no checkOutTime)
    if (existingRecord && existingRecord.checkInTime && !existingRecord.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today',
        data: {
          checkInTime: existingRecord.checkInTime,
          isCurrentlyCheckedIn: true
        }
      });
    }

    // Create or update attendance record
    let attendanceRecord;

    // Calculate late detection
    const shiftConfig = await getActiveShiftConfig();
    const shiftStart = getShiftStartDate(today, shiftConfig.shiftStartTime);
    const diffMs = checkInTime - shiftStart;
    const diffMinutes = Math.floor(diffMs / 60000);
    const isLate = diffMinutes > shiftConfig.graceMinutes;
    const lateMinutes = isLate ? diffMinutes : null;
    const attendanceStatus = isLate ? 'LATE' : 'PRESENT';

    if (existingRecord && existingRecord.checkOutTime) {
      // User was checked out, create a new check-in (multiple check-ins per day allowed)
      // We'll update the existing record to track the latest session
      attendanceRecord = await prisma.staffAttendance.update({
        where: {
          id: existingRecord.id
        },
        data: {
          checkInTime, // Update with new check-in time
          checkOutTime: null, // Clear previous check-out time
          status: attendanceStatus,
          isPresent: true,
          lateMinutes,
          workingHours: null, // Reset working hours for new session
          updatedAt: new Date()
        },
        include: {
          staff: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          }
        }
      });
    } else {
      // No existing record for today, create new one
      attendanceRecord = await prisma.staffAttendance.upsert({
        where: {
          staffId_date: {
            staffId,
            date: today
          }
        },
        update: {
          checkInTime,
          status: attendanceStatus,
          isPresent: true,
          lateMinutes,
          updatedAt: new Date()
        },
        create: {
          staffId,
          date: today,
          checkInTime,
          status: attendanceStatus,
          isPresent: true,
          lateMinutes
        },
        include: {
          staff: {
            select: {
              firstName: true,
              lastName: true,
              staffType: true
            }
          }
        }
      });
    }

    // 🔌 Emit WebSocket event - Staff checked in
    emitStaffCheckIn({
      staffId,
      checkInTime: attendanceRecord.checkInTime,
      staffName: `${attendanceRecord.staff.firstName} ${attendanceRecord.staff.lastName}`,
      staffType: attendanceRecord.staff.staffType
    });

    res.status(200).json({
      success: true,
      message: isLate ? `Checked in - Late by ${lateMinutes} minutes` : 'Successfully checked in',
      data: {
        id: attendanceRecord.id,
        checkInTime: attendanceRecord.checkInTime,
        status: attendanceRecord.status,
        lateMinutes: attendanceRecord.lateMinutes,
        staff: attendanceRecord.staff
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in',
      error: error.message
    });
  }
};

// Staff check-out
const checkOut = async (req, res) => {
  try {
    const { id: staffId } = req.user;
    const today = getDateOnly();
    const checkOutTime = new Date();

    // Find today's attendance record
    const attendanceRecord = await prisma.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId,
          date: today
        }
      },
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true,
            staffType: true
          }
        }
      }
    });

    if (!attendanceRecord) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today'
      });
    }

    if (!attendanceRecord.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check out without checking in first'
      });
    }

    if (attendanceRecord.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today',
        data: {
          checkOutTime: attendanceRecord.checkOutTime,
          workingHours: attendanceRecord.workingHours
        }
      });
    }

    // Calculate working hours
    const workingHours = calculateWorkingHours(attendanceRecord.checkInTime, checkOutTime);

    // Calculate extra minutes beyond shift end
    const shiftConfig = await getActiveShiftConfig();
    const shiftEnd = getShiftEndDate(today, shiftConfig.shiftEndTime);
    const extraDiffMs = checkOutTime - shiftEnd;
    const extraDiffMinutes = Math.floor(extraDiffMs / 60000);
    const extraMinutes = extraDiffMinutes > 0 ? extraDiffMinutes : null;

    // Update attendance record
    const updatedRecord = await prisma.staffAttendance.update({
      where: {
        id: attendanceRecord.id
      },
      data: {
        checkOutTime,
        workingHours,
        extraMinutes,
        updatedAt: new Date()
      },
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true,
            staffType: true
          }
        }
      }
    });

    // 🔌 Emit WebSocket event - Staff checked out
    emitStaffCheckOut({
      staffId,
      checkOutTime: updatedRecord.checkOutTime,
      workingHours: updatedRecord.workingHours,
      staffName: `${updatedRecord.staff.firstName} ${updatedRecord.staff.lastName}`,
      staffType: updatedRecord.staff.staffType
    });

    res.status(200).json({
      success: true,
      message: extraMinutes ? `Checked out - ${extraMinutes} extra minutes worked` : 'Successfully checked out',
      data: {
        id: updatedRecord.id,
        checkInTime: updatedRecord.checkInTime,
        checkOutTime: updatedRecord.checkOutTime,
        workingHours: updatedRecord.workingHours,
        extraMinutes: updatedRecord.extraMinutes,
        status: updatedRecord.status,
        staff: updatedRecord.staff
      }
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check out',
      error: error.message
    });
  }
};

// Get current attendance status
const getCurrentStatus = async (req, res) => {
  try {
    const { id: staffId } = req.user;
    const today = getDateOnly();

    const attendanceRecord = await prisma.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId,
          date: today
        }
      },
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true,
            staffType: true
          }
        }
      }
    });

    if (!attendanceRecord) {
      return res.status(200).json({
        success: true,
        message: 'No attendance record for today',
        data: {
          isCheckedIn: false,
          status: 'NOT_CHECKED_IN',
          checkInTime: null,
          checkOutTime: null,
          workingHours: 0
        }
      });
    }

    const isCheckedIn = attendanceRecord.checkInTime && !attendanceRecord.checkOutTime;
    const currentWorkingHours = isCheckedIn
      ? calculateWorkingHours(attendanceRecord.checkInTime, new Date())
      : attendanceRecord.workingHours || 0;

    res.status(200).json({
      success: true,
      message: 'Current attendance status retrieved',
      data: {
        id: attendanceRecord.id,
        isCheckedIn,
        status: attendanceRecord.status,
        checkInTime: attendanceRecord.checkInTime,
        checkOutTime: attendanceRecord.checkOutTime,
        workingHours: attendanceRecord.workingHours || 0,
        currentWorkingHours,
        staff: attendanceRecord.staff
      }
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance status',
      error: error.message
    });
  }
};

// Get today's attendance for staff
const getTodayAttendance = async (req, res) => {
  try {
    const { id: staffId } = req.user;
    const today = getDateOnly();

    const attendanceRecord = await prisma.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId,
          date: today
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Today\'s attendance retrieved',
      data: attendanceRecord || {
        date: today,
        checkInTime: null,
        checkOutTime: null,
        workingHours: 0,
        status: 'ABSENT',
        isPresent: false
      }
    });

  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today\'s attendance',
      error: error.message
    });
  }
};

// Auto check-out on logout
const autoCheckOut = async (staffId) => {
  try {
    const today = getDateOnly();
    const checkOutTime = new Date();

    const attendanceRecord = await prisma.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId,
          date: today
        }
      }
    });

    if (attendanceRecord && attendanceRecord.checkInTime && !attendanceRecord.checkOutTime) {
      const workingHours = calculateWorkingHours(attendanceRecord.checkInTime, checkOutTime);

      await prisma.staffAttendance.update({
        where: {
          id: attendanceRecord.id
        },
        data: {
          checkOutTime,
          workingHours,
          updatedAt: new Date()
        }
      });

      return { success: true, workingHours };
    }

    return { success: false, message: 'No active check-in found' };
  } catch (error) {
    console.error('Auto check-out error:', error);
    return { success: false, error: error.message };
  }
};

// Admin: Get daily attendance report
const getDailyAttendanceReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? getDateOnly(new Date(date)) : getDateOnly();

    // Get all staff
    const allStaff = await prisma.staff.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        staffType: true,
        department: true
      }
    });

    // Get attendance for the date
    const attendanceRecords = await prisma.staffAttendance.findMany({
      where: {
        date: targetDate
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffType: true,
            department: true
          }
        }
      }
    });

    // Create attendance map
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.staffId] = record;
    });

    // Merge staff with attendance data
    const attendanceReport = allStaff.map(staff => {
      const attendance = attendanceMap[staff.id];
      return {
        staffId: staff.id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        staffType: staff.staffType,
        department: staff.department,
        checkInTime: attendance?.checkInTime || null,
        checkOutTime: attendance?.checkOutTime || null,
        workingHours: attendance?.workingHours || 0,
        status: attendance?.status || null, // Return null if no attendance record
        isPresent: attendance?.isPresent || false
      };
    });

    // Calculate summary stats
    const totalStaff = allStaff.length;
    const presentStaff = attendanceReport.filter(a => a.isPresent).length;
    const absentStaff = attendanceReport.filter(a => a.status === 'ABSENT').length; // Only count actual ABSENT records

    res.status(200).json({
      success: true,
      message: 'Daily attendance report retrieved',
      data: {
        date: targetDate,
        summary: {
          totalStaff,
          presentStaff,
          absentStaff,
          attendancePercentage: totalStaff > 0 ? Math.round((presentStaff / totalStaff) * 100) : 0
        },
        attendance: attendanceReport
      }
    });

  } catch (error) {
    console.error('Get daily attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily attendance report',
      error: error.message
    });
  }
};

// Admin: Get monthly attendance report
const getMonthlyAttendanceReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Use getDateOnly to match how dates are stored in the database (local time)
    const startDate = getDateOnly(new Date(targetYear, targetMonth - 1, 1));

    // Get last day of the target month
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = getDateOnly(new Date(targetYear, targetMonth - 1, lastDay));
    endDate.setHours(23, 59, 59, 999);

    console.log(`📅 Monthly report: ${targetYear}-${targetMonth}, Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Get all active staff
    const allStaff = await prisma.staff.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        staffType: true,
        department: true
      }
    });

    // Get actual attendance records for the month (only return what exists in DB)
    const attendanceRecords = await prisma.staffAttendance.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            staffType: true,
            department: true
          }
        }
      }
    });

    // Sort by date and then by staff name
    attendanceRecords.sort((a, b) => {
      const dateCompare = a.date - b.date;
      if (dateCompare !== 0) return dateCompare;
      return a.staff.firstName.localeCompare(b.staff.firstName);
    });

    res.status(200).json({
      success: true,
      message: 'Monthly attendance report retrieved',
      data: {
        month: targetMonth,
        year: targetYear,
        attendance: attendanceRecords
      }
    });

  } catch (error) {
    console.error('Get monthly attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly attendance report',
      error: error.message
    });
  }
};

// Admin: Get individual staff attendance history
const getStaffAttendanceHistory = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;

    let whereClause = { staffId };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    const attendanceHistory = await prisma.staffAttendance.findMany({
      where: whereClause,
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true,
            staffType: true,
            department: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: parseInt(limit)
    });

    // Calculate summary stats
    const totalDays = attendanceHistory.length;
    const presentDays = attendanceHistory.filter(a => a.isPresent).length;
    const totalWorkingHours = attendanceHistory.reduce((sum, a) => sum + (a.workingHours || 0), 0);

    res.status(200).json({
      success: true,
      message: 'Staff attendance history retrieved',
      data: {
        staff: attendanceHistory[0]?.staff || null,
        summary: {
          totalDays,
          presentDays,
          absentDays: totalDays - presentDays,
          totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
          averageHoursPerDay: totalDays > 0 ? Math.round((totalWorkingHours / totalDays) * 100) / 100 : 0
        },
        attendance: attendanceHistory
      }
    });

  } catch (error) {
    console.error('Get staff attendance history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff attendance history',
      error: error.message
    });
  }
};

// Get attendance report for date range (for export)
const getDateRangeAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    console.log('📊 Date range report request received');
    console.log('📊 Query params:', req.query);
    console.log('📊 startDate:', startDate, 'type:', typeof startDate);
    console.log('📊 endDate:', endDate, 'type:', typeof endDate);

    if (!startDate || !endDate) {
      console.error('❌ Missing required parameters:', { startDate, endDate });
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
        received: { startDate, endDate }
      });
    }

    console.log('📊 Getting date range attendance report from', startDate, 'to', endDate);

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Set time bounds
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }

    // Get attendance data for the date range
    const attendanceRecords = await prisma.staffAttendance.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true,
            staffType: true,
            department: true,
            email: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { staff: { firstName: 'asc' } }
      ]
    });

    console.log('📋 Found', attendanceRecords.length, 'attendance records for date range');

    // Group records by date
    const groupedData = [];
    const dateMap = new Map();

    attendanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          attendance: []
        });
        groupedData.push(dateMap.get(dateKey));
      }

      dateMap.get(dateKey).attendance.push({
        staffId: record.staffId,
        firstName: record.staff.firstName,
        lastName: record.staff.lastName,
        staffType: record.staff.staffType,
        department: record.staff.department,
        email: record.staff.email,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        workingHours: record.workingHours,
        isPresent: record.isPresent
      });
    });

    // Sort grouped data by date
    groupedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log('📈 Processed', groupedData.length, 'unique dates');

    res.json({
      success: true,
      data: groupedData,
      summary: {
        totalDays: groupedData.length,
        totalRecords: attendanceRecords.length,
        dateRange: {
          start: startDate,
          end: endDate
        }
      }
    });

  } catch (error) {
    console.error('Get date range attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get date range attendance report',
      error: error.message
    });
  }
};

// Get total staff count
const getTotalStaffCount = async (req, res) => {
  try {
    console.log('🔢 Getting total staff count...');

    // Count all active staff members
    const totalStaff = await prisma.staff.count({
      where: {
        // Optionally filter by active status if you have such a field
        // isActive: true
      }
    });

    console.log('📊 Total staff count:', totalStaff);

    res.json({
      success: true,
      data: {
        totalStaff,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get total staff count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get total staff count',
      error: error.message
    });
  }
};

// Admin: Mark attendance for a staff member
const markAttendance = async (req, res) => {
  try {
    const { staffId, date, status, checkInTime } = req.body;

    if (!staffId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID, date, and status are required'
      });
    }

    const targetDate = getDateOnly(new Date(date));
    const now = new Date();

    // Check if date is editable
    const editCheck = isDateEditable(targetDate);
    if (!editCheck.editable) {
      return res.status(400).json({
        success: false,
        message: editCheck.reason
      });
    }

    // Check if attendance already exists
    const existingAttendance = await prisma.staffAttendance.findFirst({
      where: {
        staffId,
        date: targetDate
      }
    });

    let attendance;
    if (existingAttendance) {
      // Update existing attendance
      attendance = await prisma.staffAttendance.update({
        where: { id: existingAttendance.id },
        data: {
          status,
          isPresent: status === 'PRESENT',
          checkInTime: status === 'PRESENT' ? (checkInTime ? new Date(checkInTime) : now) : null,
          updatedAt: now
        }
      });
    } else {
      // Create new attendance record
      attendance = await prisma.staffAttendance.create({
        data: {
          staffId,
          date: targetDate,
          status,
          isPresent: status === 'PRESENT',
          checkInTime: status === 'PRESENT' ? (checkInTime ? new Date(checkInTime) : now) : null
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
};

// Admin: Mark all staff as present (only those not already checked in)
const markAllPresent = async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? getDateOnly(new Date(date)) : getDateOnly();
    const now = new Date();

    // Check if date is editable
    const editCheck = isDateEditable(targetDate);
    if (!editCheck.editable) {
      return res.status(400).json({
        success: false,
        message: editCheck.reason
      });
    }

    // Get all active staff
    const allStaff = await prisma.staff.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    // Mark ALL staff as present, overwriting any existing status
    const attendancePromises = allStaff.map(staff =>
      prisma.staffAttendance.upsert({
        where: {
          staffId_date: {
            staffId: staff.id,
            date: targetDate
          }
        },
        update: {
          status: 'PRESENT',
          isPresent: true,
          checkInTime: now,
          updatedAt: now
        },
        create: {
          staffId: staff.id,
          date: targetDate,
          status: 'PRESENT',
          isPresent: true,
          checkInTime: now
        }
      })
    );

    await Promise.all(attendancePromises);

    res.status(200).json({
      success: true,
      message: `Marked ${allStaff.length} staff members as present`,
      data: {
        count: allStaff.length,
        markedCount: allStaff.length,
        totalStaff: allStaff.length,
        date: targetDate
      }
    });

  } catch (error) {
    console.error('Mark all present error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as present',
      error: error.message
    });
  }
};

// Admin: Mark all staff as on leave
const markAllLeave = async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? getDateOnly(new Date(date)) : getDateOnly();
    const now = new Date();

    // Check if date is editable
    const editCheck = isDateEditable(targetDate);
    if (!editCheck.editable) {
      return res.status(400).json({
        success: false,
        message: editCheck.reason
      });
    }

    // Get all active staff
    const allStaff = await prisma.staff.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    // Mark ALL staff as leave, overwriting any existing status
    const attendancePromises = allStaff.map(staff =>
      prisma.staffAttendance.upsert({
        where: {
          staffId_date: {
            staffId: staff.id,
            date: targetDate
          }
        },
        update: {
          status: 'LEAVE',
          isPresent: false,
          checkInTime: null,
          checkOutTime: null,
          workingHours: null,
          updatedAt: now
        },
        create: {
          staffId: staff.id,
          date: targetDate,
          status: 'LEAVE',
          isPresent: false
        }
      })
    );

    await Promise.all(attendancePromises);

    res.status(200).json({
      success: true,
      message: `Marked ${allStaff.length} staff members as on leave`,
      data: {
        count: allStaff.length,
        markedCount: allStaff.length,
        totalStaff: allStaff.length,
        date: targetDate
      }
    });

  } catch (error) {
    console.error('Mark all leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as on leave',
      error: error.message
    });
  }
};

// Admin: Mark all staff as holiday
const markAllHoliday = async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = date ? getDateOnly(new Date(date)) : getDateOnly();
    const now = new Date();

    // Check if date is editable
    const editCheck = isDateEditable(targetDate);
    if (!editCheck.editable) {
      return res.status(400).json({
        success: false,
        message: editCheck.reason
      });
    }

    // Get all active staff
    const allStaff = await prisma.staff.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    // Mark ALL staff as holiday, overwriting any existing status
    const attendancePromises = allStaff.map(staff =>
      prisma.staffAttendance.upsert({
        where: {
          staffId_date: {
            staffId: staff.id,
            date: targetDate
          }
        },
        update: {
          status: 'HOLIDAY',
          isPresent: false,
          checkInTime: null,
          checkOutTime: null,
          workingHours: null,
          updatedAt: now
        },
        create: {
          staffId: staff.id,
          date: targetDate,
          status: 'HOLIDAY',
          isPresent: false
        }
      })
    );

    await Promise.all(attendancePromises);

    res.status(200).json({
      success: true,
      message: `Marked ${allStaff.length} staff members as holiday`,
      data: {
        count: allStaff.length,
        markedCount: allStaff.length,
        totalStaff: allStaff.length,
        date: targetDate
      }
    });

  } catch (error) {
    console.error('Mark all holiday error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as holiday',
      error: error.message
    });
  }
};

// Get daily QR code for attendance
const getDailyQR = async (req, res) => {
  try {
    // Generate daily attendance OTP
    const otpData = await otpService.generateDailyAttendanceOTP();

    // Generate QR code for the OTP
    const qrCodeDataURL = await QRGenerator.generateAttendanceQR(otpData.otp, otpData.date);

    // Get current date info
    const today = new Date();
    const dateFormatted = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    res.status(200).json({
      success: true,
      message: 'Daily attendance QR code generated successfully',
      data: {
        otp: otpData.otp,
        qrCode: qrCodeDataURL,
        date: otpData.date,
        dateFormatted: dateFormatted,
        expiresAt: otpData.expiresAt,
        isNew: otpData.isNew,
        instructions: {
          forStaff: 'Scan this QR code or enter the 6-digit OTP manually in your mobile app to mark attendance',
          validity: 'Valid until end of today',
          location: 'Must be within 100 meters of hospital premises'
        }
      }
    });

  } catch (error) {
    console.error('Daily QR generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily QR code',
      error: error.message
    });
  }
};

// Location-based attendance marking with OTP verification
const markLocationAttendance = async (req, res) => {
  try {
    const { id: staffId, firstName, lastName, staffType } = req.user;
    const { otp, latitude, longitude } = req.body;

    // Validate required fields
    if (!otp || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'OTP, latitude, and longitude are required'
      });
    }

    // Validate OTP format (6-digit number)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format. Must be 6 digits.'
      });
    }

    // Validate coordinates
    if (!GeofencingService.isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GPS coordinates provided'
      });
    }

    // 1. Verify daily attendance OTP
    const today = new Date().toISOString().split('T')[0];
    try {
      await otpService.verifyOTP(today, otp, 'daily_attendance');
      console.log(`✅ Daily attendance OTP verified successfully for ${firstName} ${lastName}`);
    } catch (otpError) {
      console.error(`❌ OTP verification failed:`, otpError.message);
      return res.status(400).json({
        success: false,
        message: `OTP verification failed: ${otpError.message}`,
        error: 'INVALID_OTP'
      });
    }

    // 2. Check if attendance already marked for today
    const todayDate = getDateOnly();
    const existingAttendance = await prisma.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId,
          date: todayDate
        }
      }
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for today',
        data: {
          checkInTime: existingAttendance.checkInTime,
          status: existingAttendance.status
        }
      });
    }

    // 3. Validate geofence (location within hospital premises)
    const geofenceResult = GeofencingService.checkGeofence(latitude, longitude);
    if (!geofenceResult.isWithinGeofence) {
      return res.status(400).json({
        success: false,
        message: `You are not within hospital premises. You are ${geofenceResult.distance}m away from the hospital. Please move within ${geofenceResult.allowedRadius}m of the hospital to mark attendance.`,
        error: 'OUTSIDE_GEOFENCE',
        data: {
          distance: geofenceResult.distance,
          allowedRadius: geofenceResult.allowedRadius,
          userLocation: geofenceResult.userCoordinates,
          hospitalLocation: geofenceResult.hospitalCoordinates,
          requirement: `Must be within ${geofenceResult.allowedRadius}m of hospital premises`
        }
      });
    }

    // 4. Mark attendance with location data
    const checkInTime = new Date();
    const attendanceRecord = await prisma.staffAttendance.upsert({
      where: {
        staffId_date: {
          staffId,
          date: todayDate
        }
      },
      update: {
        checkInTime,
        isPresent: true,
        status: 'PRESENT',
        attendanceMethod: 'location_based',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        locationDistance: geofenceResult.distance,
        locationData: {
          timestamp: checkInTime.toISOString(),
          accuracy: geofenceResult.accuracy || null,
          geofenceRadius: geofenceResult.allowedRadius,
          hospitalCoordinates: geofenceResult.hospitalCoordinates
        },
        updatedAt: new Date()
      },
      create: {
        staffId,
        date: todayDate,
        checkInTime,
        isPresent: true,
        status: 'PRESENT',
        attendanceMethod: 'location_based',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        locationDistance: geofenceResult.distance,
        locationData: {
          timestamp: checkInTime.toISOString(),
          accuracy: geofenceResult.accuracy || null,
          geofenceRadius: geofenceResult.allowedRadius,
          hospitalCoordinates: geofenceResult.hospitalCoordinates
        }
      },
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true,
            staffType: true,
            department: true
          }
        }
      }
    });

    // Store location data separately (since schema fields aren't added yet)
    // This would normally be part of the attendance record
    console.log(`Location-based attendance marked for ${firstName} ${lastName} at location: ${latitude}, ${longitude} (Distance: ${geofenceResult.distance}m)`);

    // 5. Emit WebSocket event for real-time updates
    emitStaffCheckIn({
      staffId,
      checkInTime: attendanceRecord.checkInTime,
      staffName: `${firstName} ${lastName}`,
      staffType: staffType,
      attendanceMethod: 'location_based',
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        distance: geofenceResult.distance
      }
    });

    res.status(200).json({
      success: true,
      message: 'Location-based attendance marked successfully',
      data: {
        id: attendanceRecord.id,
        checkInTime: attendanceRecord.checkInTime,
        status: attendanceRecord.status,
        attendanceMethod: 'location_based',
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          distance: geofenceResult.distance,
          withinGeofence: true
        },
        staff: attendanceRecord.staff,
        geofenceInfo: {
          allowedRadius: geofenceResult.allowedRadius,
          hospitalLocation: geofenceResult.hospitalCoordinates
        }
      }
    });

  } catch (error) {
    console.error('Location-based attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark location-based attendance',
      error: error.message
    });
  }
};

// Check today's attendance status for current user
const getTodayAttendanceStatus = async (req, res) => {
  try {
    const { id: staffId, firstName, lastName, staffType } = req.user;
    const today = getDateOnly();

    // Find today's attendance record
    const attendanceRecord = await prisma.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId,
          date: today
        }
      },
      include: {
        staff: {
          select: {
            firstName: true,
            lastName: true,
            staffType: true,
            department: true
          }
        }
      }
    });

    if (!attendanceRecord || !attendanceRecord.checkInTime) {
      // No attendance marked for today
      return res.status(200).json({
        success: true,
        message: 'No attendance marked for today',
        data: {
          hasAttendance: false,
          date: today,
          staff: {
            firstName,
            lastName,
            staffType
          }
        }
      });
    }

    // Attendance already marked
    const responseData = {
      hasAttendance: true,
      id: attendanceRecord.id,
      date: today,
      checkInTime: attendanceRecord.checkInTime,
      status: attendanceRecord.status,
      attendanceMethod: attendanceRecord.attendanceMethod || 'unknown',
      staff: attendanceRecord.staff
    };

    // Add location data if it's a location-based attendance
    if (attendanceRecord.latitude && attendanceRecord.longitude) {
      responseData.location = {
        latitude: attendanceRecord.latitude,
        longitude: attendanceRecord.longitude,
        distance: attendanceRecord.locationDistance,
        withinGeofence: true
      };
    }

    // Add working hours if checked out
    if (attendanceRecord.checkOutTime) {
      responseData.checkOutTime = attendanceRecord.checkOutTime;
      responseData.workingHours = attendanceRecord.workingHours;
    }

    res.status(200).json({
      success: true,
      message: 'Attendance already marked for today',
      data: responseData
    });

  } catch (error) {
    console.error('Error checking today\'s attendance status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check attendance status',
      error: error.message
    });
  }
};

// Admin: Update missing attendance (mark absent for staff with no status)
const updateMissingAttendance = async (req, res) => {
  try {
    const today = getDateOnly(new Date());
    const cutoffDays = parseInt(process.env.ATTENDANCE_EDIT_CUTOFF_DAYS || '2', 10);
    const currentDay = today.getDate();

    let startDate;
    let includePreviousMonth = false;

    // If we're within cutoff days of current month, include ENTIRE previous month
    if (currentDay <= cutoffDays) {
      includePreviousMonth = true;
      // Start from 1st of previous month
      const previousMonth = today.getMonth() - 1;
      const previousYear = previousMonth < 0 ? today.getFullYear() - 1 : today.getFullYear();
      const adjustedMonth = previousMonth < 0 ? 11 : previousMonth;
      startDate = new Date(previousYear, adjustedMonth, 1);
    } else {
      // Start from 1st of current month only
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    startDate = getDateOnly(startDate);

    // Get all active staff
    const allStaff = await prisma.staff.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    let totalMarked = 0;
    let totalHolidays = 0;
    const datePromises = [];

    // Loop through each day from startDate to today
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const currentDate = getDateOnly(d);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      // Get existing attendance for this date
      const existingAttendance = await prisma.staffAttendance.findMany({
        where: {
          date: currentDate,
          staffId: { in: allStaff.map(s => s.id) }
        },
        select: { staffId: true }
      });

      const markedStaffIds = new Set(existingAttendance.map(a => a.staffId));

      // Find staff with no attendance record for this date
      const staffWithoutAttendance = allStaff.filter(staff => !markedStaffIds.has(staff.id));

      // Skip if all staff already have attendance for this date
      if (staffWithoutAttendance.length === 0) {
        continue;
      }

      // Check if it's Sunday (0 = Sunday)
      if (dayOfWeek === 0) {
        // Mark all staff without attendance as HOLIDAY on Sundays
        const holidayPromises = staffWithoutAttendance.map(staff =>
          prisma.staffAttendance.create({
            data: {
              staffId: staff.id,
              date: currentDate,
              status: 'HOLIDAY',
              isPresent: false
            }
          }).catch(err => {
            // Ignore duplicate key errors (record already exists)
            if (!err.code || err.code !== 'P2002') {
              throw err;
            }
          })
        );
        totalHolidays += staffWithoutAttendance.length;
        datePromises.push(...holidayPromises);
      } else {
        // Mark them as absent on other days
        const absentPromises = staffWithoutAttendance.map(staff =>
          prisma.staffAttendance.create({
            data: {
              staffId: staff.id,
              date: currentDate,
              status: 'ABSENT',
              isPresent: false
            }
          }).catch(err => {
            // Ignore duplicate key errors (record already exists)
            if (!err.code || err.code !== 'P2002') {
              throw err;
            }
          })
        );
        totalMarked += staffWithoutAttendance.length;
        datePromises.push(...absentPromises);
      }
    }

    await Promise.all(datePromises);

    const message = includePreviousMonth
      ? `Updated attendance: ${totalMarked} marked absent, ${totalHolidays} marked holiday (Sundays). Range: Previous month + Current month up to today`
      : `Updated attendance: ${totalMarked} marked absent, ${totalHolidays} marked holiday (Sundays). Range: Current month up to today`;

    res.status(200).json({
      success: true,
      message,
      data: {
        totalMarked,
        totalHolidays,
        startDate,
        endDate: today,
        includedPreviousMonth: includePreviousMonth
      }
    });

  } catch (error) {
    console.error('Update missing attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update missing attendance',
      error: error.message
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getCurrentStatus,
  getTodayAttendance,
  autoCheckOut,
  getDailyAttendanceReport,
  getMonthlyAttendanceReport,
  getStaffAttendanceHistory,
  getDateRangeAttendanceReport,
  getTotalStaffCount,
  markAttendance,
  markAllPresent,
  markAllLeave,
  markAllHoliday,
  getDailyQR,
  markLocationAttendance,
  getTodayAttendanceStatus,
  updateMissingAttendance
};