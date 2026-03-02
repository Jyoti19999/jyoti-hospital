const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generatePayslipPDF } = require('../utils/payslipPdf');

// ============ HELPER FUNCTIONS ============

const getDateOnly = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Get the active/default shift config, or return defaults
const getActiveShiftConfig = async () => {
  const config = await prisma.shiftConfig.findFirst({
    where: { isDefault: true, isActive: true },
    orderBy: { updatedAt: 'desc' }
  });
  if (config) return config;
  // Fallback defaults
  return {
    shiftStartTime: '09:00',
    shiftEndTime: '18:00',
    graceMinutes: 15,
    latePenaltyMultiplier: 2.0
  };
};

// Parse "HH:mm" string into { hours, minutes }
const parseTimeString = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

// Get shift start as a Date object for a given date
const getShiftStartDate = (date, shiftStartTime) => {
  const { hours, minutes } = parseTimeString(shiftStartTime);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// Get shift end as a Date object for a given date
const getShiftEndDate = (date, shiftEndTime) => {
  const { hours, minutes } = parseTimeString(shiftEndTime);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// Count Sundays in a month
const countSundays = (month, year) => {
  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    if (new Date(year, month - 1, day).getDay() === 0) count++;
  }
  return count;
};

// Get total days in a month
const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

// ============ SHIFT CONFIG ============

const getShiftConfig = async (req, res) => {
  try {
    let config = await prisma.shiftConfig.findFirst({
      where: { isDefault: true, isActive: true },
      orderBy: { updatedAt: 'desc' }
    });

    if (!config) {
      config = {
        id: null,
        name: 'Default Shift',
        shiftStartTime: '09:00',
        shiftEndTime: '18:00',
        graceMinutes: 15,
        latePenaltyMultiplier: 2.0,
        isDefault: true,
        isActive: true
      };
    }

    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Get shift config error:', error);
    res.status(500).json({ success: false, message: 'Failed to get shift config', error: error.message });
  }
};

const updateShiftConfig = async (req, res) => {
  try {
    const { shiftStartTime, shiftEndTime, graceMinutes, latePenaltyMultiplier, name } = req.body;

    if (!shiftStartTime || !shiftEndTime) {
      return res.status(400).json({ success: false, message: 'Shift start and end times are required' });
    }

    const startParsed = parseTimeString(shiftStartTime);
    const endParsed = parseTimeString(shiftEndTime);
    const startMins = startParsed.hours * 60 + startParsed.minutes;
    const endMins = endParsed.hours * 60 + endParsed.minutes;

    if (endMins <= startMins) {
      return res.status(400).json({ success: false, message: 'Shift end time must be after start time' });
    }
    if (graceMinutes !== undefined && (graceMinutes < 0 || graceMinutes > 120)) {
      return res.status(400).json({ success: false, message: 'Grace minutes must be between 0 and 120' });
    }
    if (latePenaltyMultiplier !== undefined && latePenaltyMultiplier < 1) {
      return res.status(400).json({ success: false, message: 'Late penalty multiplier must be at least 1' });
    }

    // Find existing default config
    const existing = await prisma.shiftConfig.findFirst({
      where: { isDefault: true, isActive: true }
    });

    let config;
    const data = {
      name: name || 'Default Shift',
      shiftStartTime,
      shiftEndTime,
      graceMinutes: graceMinutes !== undefined ? parseInt(graceMinutes) : 15,
      latePenaltyMultiplier: latePenaltyMultiplier !== undefined ? parseFloat(latePenaltyMultiplier) : 2.0,
      isDefault: true,
      isActive: true
    };

    if (existing) {
      config = await prisma.shiftConfig.update({
        where: { id: existing.id },
        data
      });
    } else {
      config = await prisma.shiftConfig.create({ data });
    }

    res.json({ success: true, message: 'Shift config updated', data: config });
  } catch (error) {
    console.error('Update shift config error:', error);
    res.status(500).json({ success: false, message: 'Failed to update shift config', error: error.message });
  }
};

// ============ STAFF SALARY MANAGEMENT ============

const updateStaffSalary = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { monthlySalary, effectiveFrom, reason } = req.body;

    if (monthlySalary === undefined || monthlySalary === null) {
      return res.status(400).json({ success: false, message: 'Monthly salary is required' });
    }
    if (parseFloat(monthlySalary) < 0) {
      return res.status(400).json({ success: false, message: 'Salary cannot be negative' });
    }

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const previousSalary = staff.monthlySalary;
    const newSalary = parseFloat(monthlySalary);
    const effectiveDate = effectiveFrom ? new Date(effectiveFrom) : new Date();

    // Update staff salary and create history record in a transaction
    const [updatedStaff, salaryRecord] = await prisma.$transaction([
      prisma.staff.update({
        where: { id: staffId },
        data: {
          monthlySalary: newSalary,
          salaryEffectiveFrom: effectiveDate
        },
        select: {
          id: true, employeeId: true, firstName: true, lastName: true,
          staffType: true, department: true, monthlySalary: true, salaryEffectiveFrom: true
        }
      }),
      prisma.salaryHistory.create({
        data: {
          staffId,
          previousSalary,
          newSalary,
          effectiveFrom: effectiveDate,
          changedBy: req.user.id,
          reason: reason || null
        }
      })
    ]);

    res.json({ success: true, message: 'Salary updated successfully', data: { staff: updatedStaff, salaryHistory: salaryRecord } });
  } catch (error) {
    console.error('Update staff salary error:', error);
    res.status(500).json({ success: false, message: 'Failed to update salary', error: error.message });
  }
};

const getStaffSalaryHistory = async (req, res) => {
  try {
    const { staffId } = req.params;

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { id: true, firstName: true, lastName: true, employeeId: true, monthlySalary: true, salaryEffectiveFrom: true }
    });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const history = await prisma.salaryHistory.findMany({
      where: { staffId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: { staff, history } });
  } catch (error) {
    console.error('Get salary history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get salary history', error: error.message });
  }
};

const getAllStaffSalaries = async (req, res) => {
  try {
    const { department, staffType } = req.query;

    const where = { isActive: true };
    if (department) where.department = department;
    if (staffType) where.staffType = staffType;

    const staff = await prisma.staff.findMany({
      where,
      select: {
        id: true, employeeId: true, firstName: true, lastName: true,
        staffType: true, department: true, monthlySalary: true,
        salaryEffectiveFrom: true, joiningDate: true
      },
      orderBy: { firstName: 'asc' }
    });

    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Get all staff salaries error:', error);
    res.status(500).json({ success: false, message: 'Failed to get staff salaries', error: error.message });
  }
};

// ============ ADMIN EDIT ATTENDANCE TIME ============

const adminEditAttendanceTime = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { date, checkInTime, checkOutTime, reason } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for edit is required' });
    }
    if (!checkInTime && !checkOutTime) {
      return res.status(400).json({ success: false, message: 'At least one of checkInTime or checkOutTime is required' });
    }

    const targetDate = getDateOnly(new Date(date));
    const attendance = await prisma.staffAttendance.findUnique({
      where: { staffId_date: { staffId, date: targetDate } }
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No attendance record found for this date' });
    }

    const shiftConfig = await getActiveShiftConfig();
    const updateData = {
      editedBy: req.user.id,
      editReason: reason,
      updatedAt: new Date()
    };

    const newCheckIn = checkInTime ? new Date(checkInTime) : attendance.checkInTime;
    const newCheckOut = checkOutTime ? new Date(checkOutTime) : attendance.checkOutTime;

    if (checkInTime) {
      updateData.checkInTime = newCheckIn;
      updateData.adminEditedCheckIn = newCheckIn;

      // Recalculate late minutes
      const shiftStart = getShiftStartDate(targetDate, shiftConfig.shiftStartTime);
      const diffMs = newCheckIn - shiftStart;
      const diffMinutes = Math.floor(diffMs / 60000);

      if (diffMinutes > shiftConfig.graceMinutes) {
        updateData.lateMinutes = diffMinutes;
        updateData.status = 'LATE';
      } else {
        updateData.lateMinutes = null;
        if (attendance.status === 'LATE') {
          updateData.status = 'PRESENT';
        }
      }
    }

    if (checkOutTime) {
      updateData.checkOutTime = newCheckOut;
      updateData.adminEditedCheckOut = newCheckOut;

      // Recalculate extra minutes
      const shiftEnd = getShiftEndDate(targetDate, shiftConfig.shiftEndTime);
      const extraDiffMs = newCheckOut - shiftEnd;
      const extraDiffMinutes = Math.floor(extraDiffMs / 60000);
      updateData.extraMinutes = extraDiffMinutes > 0 ? extraDiffMinutes : null;
    }

    // Recalculate working hours
    if (newCheckIn && newCheckOut) {
      const diffMs = new Date(newCheckOut) - new Date(newCheckIn);
      updateData.workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    }

    updateData.isPresent = true;

    const updated = await prisma.staffAttendance.update({
      where: { id: attendance.id },
      data: updateData,
      include: {
        staff: { select: { firstName: true, lastName: true, employeeId: true, staffType: true } }
      }
    });

    res.json({ success: true, message: 'Attendance time updated', data: updated });
  } catch (error) {
    console.error('Admin edit attendance time error:', error);
    res.status(500).json({ success: false, message: 'Failed to edit attendance time', error: error.message });
  }
};

// ============ SPECIAL HOLIDAY QUOTA ============

const createSpecialHolidayQuota = async (req, res) => {
  try {
    const { name, description, month, year, allowedDays } = req.body;

    if (!name || !month || !year || !allowedDays) {
      return res.status(400).json({ success: false, message: 'Name, month, year, and allowedDays are required' });
    }
    if (month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Month must be between 1 and 12' });
    }
    if (allowedDays < 1) {
      return res.status(400).json({ success: false, message: 'Allowed days must be at least 1' });
    }

    const quota = await prisma.specialHolidayQuota.create({
      data: {
        name,
        description: description || null,
        month: parseInt(month),
        year: parseInt(year),
        allowedDays: parseInt(allowedDays)
      }
    });

    res.status(201).json({ success: true, message: 'Holiday quota created', data: quota });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'A quota with this name already exists for this month/year' });
    }
    console.error('Create holiday quota error:', error);
    res.status(500).json({ success: false, message: 'Failed to create holiday quota', error: error.message });
  }
};

const getSpecialHolidayQuotas = async (req, res) => {
  try {
    const { year, month } = req.query;
    const where = { isActive: true };
    if (year) where.year = parseInt(year);
    if (month) where.month = parseInt(month);

    const quotas = await prisma.specialHolidayQuota.findMany({
      where,
      include: {
        allocations: {
          include: {
            staff: { select: { id: true, firstName: true, lastName: true, employeeId: true, staffType: true } }
          }
        }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    res.json({ success: true, data: quotas });
  } catch (error) {
    console.error('Get holiday quotas error:', error);
    res.status(500).json({ success: false, message: 'Failed to get holiday quotas', error: error.message });
  }
};

const updateSpecialHolidayQuota = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, allowedDays } = req.body;

    const existing = await prisma.specialHolidayQuota.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Holiday quota not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (allowedDays !== undefined) updateData.allowedDays = parseInt(allowedDays);

    const updated = await prisma.specialHolidayQuota.update({
      where: { id },
      data: updateData
    });

    res.json({ success: true, message: 'Holiday quota updated', data: updated });
  } catch (error) {
    console.error('Update holiday quota error:', error);
    res.status(500).json({ success: false, message: 'Failed to update holiday quota', error: error.message });
  }
};

const deleteSpecialHolidayQuota = async (req, res) => {
  try {
    const { id } = req.params;

    // Check for allocations
    const allocCount = await prisma.staffSpecialHoliday.count({ where: { quotaId: id } });
    if (allocCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete: ${allocCount} staff allocations exist. Remove allocations first.` });
    }

    await prisma.specialHolidayQuota.delete({ where: { id } });
    res.json({ success: true, message: 'Holiday quota deleted' });
  } catch (error) {
    console.error('Delete holiday quota error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete holiday quota', error: error.message });
  }
};

const allocateSpecialHoliday = async (req, res) => {
  try {
    const { quotaId } = req.params;
    const { staffId, holidayDates } = req.body;

    if (!staffId || !holidayDates || !Array.isArray(holidayDates) || holidayDates.length === 0) {
      return res.status(400).json({ success: false, message: 'staffId and holidayDates array are required' });
    }

    const quota = await prisma.specialHolidayQuota.findUnique({
      where: { id: quotaId },
      include: { allocations: { where: { staffId } } }
    });

    if (!quota) {
      return res.status(404).json({ success: false, message: 'Holiday quota not found' });
    }

    // Check quota limit
    const existingCount = quota.allocations.length;
    if (existingCount + holidayDates.length > quota.allowedDays) {
      return res.status(400).json({
        success: false,
        message: `Exceeds quota. Allowed: ${quota.allowedDays}, Already allocated: ${existingCount}, Requesting: ${holidayDates.length}`
      });
    }

    // Validate dates are in the correct month/year
    for (const dateStr of holidayDates) {
      const d = new Date(dateStr);
      if (d.getMonth() + 1 !== quota.month || d.getFullYear() !== quota.year) {
        return res.status(400).json({ success: false, message: `Date ${dateStr} is not in ${quota.month}/${quota.year}` });
      }
      if (d.getDay() === 0) {
        return res.status(400).json({ success: false, message: `Date ${dateStr} is a Sunday (already a holiday)` });
      }
    }

    // Create allocations and upsert attendance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const allocations = [];
      for (const dateStr of holidayDates) {
        const holidayDate = getDateOnly(new Date(dateStr));

        const allocation = await tx.staffSpecialHoliday.create({
          data: { staffId, quotaId, holidayDate }
        });
        allocations.push(allocation);

        // Upsert attendance as HOLIDAY
        await tx.staffAttendance.upsert({
          where: { staffId_date: { staffId, date: holidayDate } },
          update: { status: 'HOLIDAY', isPresent: false },
          create: { staffId, date: holidayDate, status: 'HOLIDAY', isPresent: false }
        });
      }
      return allocations;
    });

    res.status(201).json({ success: true, message: `${result.length} holiday(s) allocated`, data: result });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'One or more holiday dates are already allocated for this staff' });
    }
    console.error('Allocate special holiday error:', error);
    res.status(500).json({ success: false, message: 'Failed to allocate holiday', error: error.message });
  }
};

const getQuotaAllocations = async (req, res) => {
  try {
    const { quotaId } = req.params;

    const quota = await prisma.specialHolidayQuota.findUnique({
      where: { id: quotaId },
      include: {
        allocations: {
          include: {
            staff: { select: { id: true, firstName: true, lastName: true, employeeId: true, staffType: true, department: true } }
          },
          orderBy: { holidayDate: 'asc' }
        }
      }
    });

    if (!quota) {
      return res.status(404).json({ success: false, message: 'Holiday quota not found' });
    }

    res.json({ success: true, data: quota });
  } catch (error) {
    console.error('Get quota allocations error:', error);
    res.status(500).json({ success: false, message: 'Failed to get allocations', error: error.message });
  }
};

const removeSpecialHolidayAllocation = async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await prisma.staffSpecialHoliday.findUnique({ where: { id } });
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    await prisma.$transaction([
      prisma.staffSpecialHoliday.delete({ where: { id } }),
      // Revert attendance to ABSENT (admin can change later if needed)
      prisma.staffAttendance.updateMany({
        where: { staffId: allocation.staffId, date: allocation.holidayDate, status: 'HOLIDAY' },
        data: { status: 'ABSENT', isPresent: false }
      })
    ]);

    res.json({ success: true, message: 'Holiday allocation removed' });
  } catch (error) {
    console.error('Remove holiday allocation error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove allocation', error: error.message });
  }
};

// ============ SALARY CALCULATION ENGINE ============

const calculateMonthlySalary = async (staffId, month, year) => {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { id: true, employeeId: true, firstName: true, lastName: true, staffType: true, department: true, monthlySalary: true }
  });

  if (!staff) throw new Error('Staff not found');
  if (!staff.monthlySalary) throw new Error(`Salary not set for ${staff.firstName} ${staff.lastName}`);

  const shiftConfig = await getActiveShiftConfig();
  const daysInMonth = getDaysInMonth(month, year);
  const sundays = countSundays(month, year);

  // Fetch special holiday allocations for this staff in this month
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const specialHolidays = await prisma.staffSpecialHoliday.findMany({
    where: {
      staffId,
      holidayDate: { gte: startOfMonth, lte: endOfMonth }
    }
  });
  const specialHolidayDates = new Set(specialHolidays.map(h => getDateOnly(h.holidayDate).getTime()));

  // Fetch approved late approvals for the month
  const approvedLateApprovals = await prisma.lateApproval.findMany({
    where: {
      staffId,
      status: 'APPROVED',
      date: { gte: startOfMonth, lte: endOfMonth }
    }
  });
  const approvedLateDates = new Set(approvedLateApprovals.map(l => getDateOnly(l.date).getTime()));

  // Fetch all attendance records for the month
  const attendanceRecords = await prisma.staffAttendance.findMany({
    where: {
      staffId,
      date: { gte: startOfMonth, lte: endOfMonth }
    },
    orderBy: { date: 'asc' }
  });
  const attendanceMap = new Map(attendanceRecords.map(r => [getDateOnly(r.date).getTime(), r]));

  // Fetch approved paid leave requests for the month
  const paidLeaveRequests = await prisma.leaveRequest.findMany({
    where: {
      staffId,
      status: 'APPROVED',
      isPaidLeave: true,
      OR: [
        { startDate: { lte: endOfMonth }, endDate: { gte: startOfMonth } },
        { leaveDate: { gte: startOfMonth, lte: endOfMonth } }
      ]
    }
  });
  // Build a set of dates that are paid leave
  const paidLeaveDates = new Set();
  for (const lr of paidLeaveRequests) {
    const start = new Date(lr.startDate || lr.leaveDate);
    const end = new Date(lr.endDate || lr.leaveDate);
    const cur = new Date(start);
    while (cur <= end) {
      paidLeaveDates.add(getDateOnly(cur).getTime());
      cur.setDate(cur.getDate() + 1);
    }
  }

  // Calculate rates
  const totalWorkingDays = daysInMonth - sundays - specialHolidayDates.size;
  const baseSalary = staff.monthlySalary;
  const perDayRate = totalWorkingDays > 0 ? baseSalary / totalWorkingDays : 0;

  const shiftStart = parseTimeString(shiftConfig.shiftStartTime);
  const shiftEnd = parseTimeString(shiftConfig.shiftEndTime);
  const shiftDurationHours = (shiftEnd.hours * 60 + shiftEnd.minutes - shiftStart.hours * 60 - shiftStart.minutes) / 60;
  const perHourRate = shiftDurationHours > 0 ? perDayRate / shiftDurationHours : 0;
  const perMinuteRate = perHourRate / 60;

  // Process each day
  let daysPresent = 0, daysAbsent = 0, daysOnLeave = 0, daysOnPaidLeave = 0, daysHoliday = 0, daysLate = 0;
  let leaveDeduction = 0, lateDeduction = 0, absentDeduction = 0;
  let totalExtraMinutes = 0;
  const dayDetails = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day);
    const dateKey = getDateOnly(currentDate).getTime();
    const dayOfWeek = currentDate.getDay();
    const record = attendanceMap.get(dateKey);

    const detail = { date: currentDate.toISOString().split('T')[0], day, dayOfWeek };

    // Sunday
    if (dayOfWeek === 0) {
      daysHoliday++;
      detail.type = 'SUNDAY';
      detail.deduction = 0;
      dayDetails.push(detail);
      continue;
    }

    // Special holiday
    if (specialHolidayDates.has(dateKey)) {
      daysHoliday++;
      detail.type = 'SPECIAL_HOLIDAY';
      detail.deduction = 0;
      dayDetails.push(detail);
      continue;
    }

    if (!record) {
      // No attendance record - check if date is in the future
      if (currentDate > new Date()) {
        detail.type = 'FUTURE';
        detail.deduction = 0;
      } else {
        daysAbsent++;
        absentDeduction += perDayRate;
        detail.type = 'ABSENT';
        detail.deduction = perDayRate;
      }
      dayDetails.push(detail);
      continue;
    }

    // Has attendance record
    switch (record.status) {
      case 'HOLIDAY':
        daysHoliday++;
        detail.type = 'HOLIDAY';
        detail.deduction = 0;
        break;

      case 'LEAVE':
        daysOnLeave++;
        if (paidLeaveDates.has(dateKey)) {
          daysOnPaidLeave++;
          detail.type = 'PAID_LEAVE';
          detail.deduction = 0;
        } else {
          leaveDeduction += perDayRate;
          detail.type = 'LEAVE';
          detail.deduction = perDayRate;
        }
        break;

      case 'ABSENT':
        daysAbsent++;
        absentDeduction += perDayRate;
        detail.type = 'ABSENT';
        detail.deduction = perDayRate;
        break;

      case 'HALF_DAY':
        daysPresent++;
        const halfDayDeduction = perDayRate / 2;
        absentDeduction += halfDayDeduction;
        detail.type = 'HALF_DAY';
        detail.deduction = halfDayDeduction;
        break;

      case 'PRESENT':
      case 'LATE':
        daysPresent++;
        detail.type = record.status;
        detail.deduction = 0;

        // Late penalty
        if (record.status === 'LATE' && record.lateMinutes && record.lateMinutes > 0) {
          daysLate++;

          // Check if late was approved
          const isApproved = record.isLateApproved === true || approvedLateDates.has(dateKey);

          if (!isApproved) {
            const penaltyMinutes = record.lateMinutes * shiftConfig.latePenaltyMultiplier;
            const penalty = penaltyMinutes * perMinuteRate;
            lateDeduction += penalty;
            detail.lateMinutes = record.lateMinutes;
            detail.penaltyMinutes = penaltyMinutes;
            detail.deduction = penalty;
            detail.lateApproved = false;
          } else {
            detail.lateMinutes = record.lateMinutes;
            detail.lateApproved = true;
            detail.deduction = 0;
          }
        }

        // Extra hours
        if (record.extraMinutes && record.extraMinutes > 0) {
          totalExtraMinutes += record.extraMinutes;
          detail.extraMinutes = record.extraMinutes;
        }
        break;

      default:
        detail.type = record.status;
        detail.deduction = 0;
    }

    dayDetails.push(detail);
  }

  const totalDeductions = leaveDeduction + lateDeduction + absentDeduction;
  const extraHoursWorked = Math.round((totalExtraMinutes / 60) * 100) / 100;
  const extraHoursPay = totalExtraMinutes * perMinuteRate;
  const totalAdditions = extraHoursPay;
  const netSalary = baseSalary - totalDeductions + totalAdditions;

  return {
    staff: { id: staff.id, employeeId: staff.employeeId, firstName: staff.firstName, lastName: staff.lastName, staffType: staff.staffType, department: staff.department },
    month,
    year,
    baseSalary,
    totalWorkingDays,
    daysPresent,
    daysAbsent,
    daysOnLeave,
    daysOnPaidLeave,
    daysHoliday,
    daysLate,
    leaveDeduction: Math.round(leaveDeduction * 100) / 100,
    lateDeduction: Math.round(lateDeduction * 100) / 100,
    absentDeduction: Math.round(absentDeduction * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    extraHoursWorked,
    extraHoursPay: Math.round(extraHoursPay * 100) / 100,
    totalAdditions: Math.round(totalAdditions * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100,
    rates: { perDayRate: Math.round(perDayRate * 100) / 100, perHourRate: Math.round(perHourRate * 100) / 100, perMinuteRate: Math.round(perMinuteRate * 100) / 100 },
    dayDetails
  };
};

// ============ PAYSLIP GENERATION ============

const generatePayslip = async (req, res) => {
  try {
    const { staffId, month, year } = req.body;

    if (!staffId || !month || !year) {
      return res.status(400).json({ success: false, message: 'staffId, month, and year are required' });
    }

    const calculation = await calculateMonthlySalary(staffId, parseInt(month), parseInt(year));

    const payslip = await prisma.payslip.upsert({
      where: { staffId_month_year: { staffId, month: parseInt(month), year: parseInt(year) } },
      update: {
        baseSalary: calculation.baseSalary,
        totalWorkingDays: calculation.totalWorkingDays,
        daysPresent: calculation.daysPresent,
        daysAbsent: calculation.daysAbsent,
        daysOnLeave: calculation.daysOnLeave,
        daysHoliday: calculation.daysHoliday,
        daysLate: calculation.daysLate,
        leaveDeduction: calculation.leaveDeduction,
        lateDeduction: calculation.lateDeduction,
        absentDeduction: calculation.absentDeduction,
        totalDeductions: calculation.totalDeductions,
        extraHoursWorked: calculation.extraHoursWorked,
        extraHoursPay: calculation.extraHoursPay,
        totalAdditions: calculation.totalAdditions,
        netSalary: calculation.netSalary,
        generatedBy: req.user.id,
        calculationDetails: { rates: calculation.rates, dayDetails: calculation.dayDetails },
        status: 'DRAFT'
      },
      create: {
        staffId,
        month: parseInt(month),
        year: parseInt(year),
        baseSalary: calculation.baseSalary,
        totalWorkingDays: calculation.totalWorkingDays,
        daysPresent: calculation.daysPresent,
        daysAbsent: calculation.daysAbsent,
        daysOnLeave: calculation.daysOnLeave,
        daysHoliday: calculation.daysHoliday,
        daysLate: calculation.daysLate,
        leaveDeduction: calculation.leaveDeduction,
        lateDeduction: calculation.lateDeduction,
        absentDeduction: calculation.absentDeduction,
        totalDeductions: calculation.totalDeductions,
        extraHoursWorked: calculation.extraHoursWorked,
        extraHoursPay: calculation.extraHoursPay,
        totalAdditions: calculation.totalAdditions,
        netSalary: calculation.netSalary,
        generatedBy: req.user.id,
        calculationDetails: { rates: calculation.rates, dayDetails: calculation.dayDetails },
        status: 'DRAFT'
      }
    });

    res.status(201).json({ success: true, message: 'Payslip generated', data: { payslip, calculation } });
  } catch (error) {
    console.error('Generate payslip error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate payslip' });
  }
};

const generateBulkPayslips = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'month and year are required' });
    }

    const activeStaff = await prisma.staff.findMany({
      where: { isActive: true, monthlySalary: { not: null } },
      select: { id: true, firstName: true, lastName: true, employeeId: true }
    });

    const results = { success: [], failed: [] };

    for (const staff of activeStaff) {
      try {
        const calculation = await calculateMonthlySalary(staff.id, parseInt(month), parseInt(year));

        await prisma.payslip.upsert({
          where: { staffId_month_year: { staffId: staff.id, month: parseInt(month), year: parseInt(year) } },
          update: {
            baseSalary: calculation.baseSalary,
            totalWorkingDays: calculation.totalWorkingDays,
            daysPresent: calculation.daysPresent,
            daysAbsent: calculation.daysAbsent,
            daysOnLeave: calculation.daysOnLeave,
            daysHoliday: calculation.daysHoliday,
            daysLate: calculation.daysLate,
            leaveDeduction: calculation.leaveDeduction,
            lateDeduction: calculation.lateDeduction,
            absentDeduction: calculation.absentDeduction,
            totalDeductions: calculation.totalDeductions,
            extraHoursWorked: calculation.extraHoursWorked,
            extraHoursPay: calculation.extraHoursPay,
            totalAdditions: calculation.totalAdditions,
            netSalary: calculation.netSalary,
            generatedBy: req.user.id,
            calculationDetails: { rates: calculation.rates, dayDetails: calculation.dayDetails },
            status: 'DRAFT'
          },
          create: {
            staffId: staff.id,
            month: parseInt(month),
            year: parseInt(year),
            baseSalary: calculation.baseSalary,
            totalWorkingDays: calculation.totalWorkingDays,
            daysPresent: calculation.daysPresent,
            daysAbsent: calculation.daysAbsent,
            daysOnLeave: calculation.daysOnLeave,
            daysHoliday: calculation.daysHoliday,
            daysLate: calculation.daysLate,
            leaveDeduction: calculation.leaveDeduction,
            lateDeduction: calculation.lateDeduction,
            absentDeduction: calculation.absentDeduction,
            totalDeductions: calculation.totalDeductions,
            extraHoursWorked: calculation.extraHoursWorked,
            extraHoursPay: calculation.extraHoursPay,
            totalAdditions: calculation.totalAdditions,
            netSalary: calculation.netSalary,
            generatedBy: req.user.id,
            calculationDetails: { rates: calculation.rates, dayDetails: calculation.dayDetails },
            status: 'DRAFT'
          }
        });

        results.success.push({ staffId: staff.id, name: `${staff.firstName} ${staff.lastName}`, netSalary: calculation.netSalary });
      } catch (err) {
        results.failed.push({ staffId: staff.id, name: `${staff.firstName} ${staff.lastName}`, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Generated ${results.success.length} payslips, ${results.failed.length} failed`,
      data: results
    });
  } catch (error) {
    console.error('Bulk generate payslip error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate bulk payslips', error: error.message });
  }
};

const finalizePayslip = async (req, res) => {
  try {
    const { id } = req.params;

    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        staff: { select: { id: true, employeeId: true, firstName: true, lastName: true, staffType: true, department: true } }
      }
    });
    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }
    if (payslip.status === 'FINALIZED') {
      return res.status(400).json({ success: false, message: 'Payslip is already finalized' });
    }

    // Generate PDF
    let pdfUrl = null;
    try {
      pdfUrl = await generatePayslipPDF(payslip, payslip.staff, payslip.calculationDetails);
    } catch (pdfErr) {
      console.error('PDF generation error (non-blocking):', pdfErr.message);
    }

    const updated = await prisma.payslip.update({
      where: { id },
      data: { status: 'FINALIZED', pdfUrl },
      include: {
        staff: { select: { id: true, employeeId: true, firstName: true, lastName: true, staffType: true, department: true } }
      }
    });

    res.json({ success: true, message: 'Payslip finalized & PDF generated', data: updated });
  } catch (error) {
    console.error('Finalize payslip error:', error);
    res.status(500).json({ success: false, message: 'Failed to finalize payslip', error: error.message });
  }
};

const getPayslip = async (req, res) => {
  try {
    const { id } = req.params;

    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: {
        staff: { select: { id: true, employeeId: true, firstName: true, lastName: true, staffType: true, department: true } }
      }
    });

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    res.json({ success: true, data: payslip });
  } catch (error) {
    console.error('Get payslip error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payslip', error: error.message });
  }
};

const getStaffPayslips = async (req, res) => {
  try {
    const { staffId } = req.params;

    const payslips = await prisma.payslip.findMany({
      where: { staffId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: {
        staff: { select: { id: true, employeeId: true, firstName: true, lastName: true, staffType: true, department: true } }
      }
    });

    res.json({ success: true, data: payslips });
  } catch (error) {
    console.error('Get staff payslips error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payslips', error: error.message });
  }
};

const getMonthlyPayslips = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'month and year query params are required' });
    }

    const payslips = await prisma.payslip.findMany({
      where: { month: parseInt(month), year: parseInt(year) },
      include: {
        staff: { select: { id: true, employeeId: true, firstName: true, lastName: true, staffType: true, department: true } }
      },
      orderBy: { netSalary: 'desc' }
    });

    const summary = {
      totalStaff: payslips.length,
      totalBaseSalary: payslips.reduce((sum, p) => sum + p.baseSalary, 0),
      totalDeductions: payslips.reduce((sum, p) => sum + p.totalDeductions, 0),
      totalAdditions: payslips.reduce((sum, p) => sum + p.totalAdditions, 0),
      totalNetSalary: payslips.reduce((sum, p) => sum + p.netSalary, 0),
      draftCount: payslips.filter(p => p.status === 'DRAFT').length,
      finalizedCount: payslips.filter(p => p.status === 'FINALIZED').length
    };

    res.json({ success: true, data: { payslips, summary } });
  } catch (error) {
    console.error('Get monthly payslips error:', error);
    res.status(500).json({ success: false, message: 'Failed to get monthly payslips', error: error.message });
  }
};

// ============ STAFF SELF-SERVICE ============

const getMyPayslips = async (req, res) => {
  try {
    const staffId = req.user.id;

    const payslips = await prisma.payslip.findMany({
      where: { staffId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    res.json({ success: true, data: payslips });
  } catch (error) {
    console.error('Get my payslips error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payslips', error: error.message });
  }
};

const getMyPayslipDetail = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { id } = req.params;

    const payslip = await prisma.payslip.findFirst({
      where: { id, staffId }
    });

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    res.json({ success: true, data: payslip });
  } catch (error) {
    console.error('Get my payslip detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payslip', error: error.message });
  }
};

const getMySalarySummary = async (req, res) => {
  try {
    const staffId = req.user.id;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { monthlySalary: true, firstName: true, lastName: true }
    });

    if (!staff || !staff.monthlySalary) {
      return res.json({
        success: true,
        data: {
          monthlySalary: null,
          message: 'Salary not configured yet'
        }
      });
    }

    const calculation = await calculateMonthlySalary(staffId, month, year);

    res.json({ success: true, data: calculation });
  } catch (error) {
    console.error('Get my salary summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to get salary summary', error: error.message });
  }
};

// ============ STAFF CALENDAR ATTENDANCE ============

const getMyCalendarAttendance = async (req, res) => {
  try {
    const staffId = req.user.id;
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const [attendance, leaveRequests, lateApprovals, specialHolidays, shiftConfig] = await Promise.all([
      prisma.staffAttendance.findMany({
        where: { staffId, date: { gte: startOfMonth, lte: endOfMonth } },
        orderBy: { date: 'asc' }
      }),
      prisma.leaveRequest.findMany({
        where: {
          staffId,
          OR: [
            { startDate: { lte: endOfMonth }, endDate: { gte: startOfMonth } },
            { leaveDate: { gte: startOfMonth, lte: endOfMonth } }
          ]
        }
      }),
      prisma.lateApproval.findMany({
        where: {
          staffId,
          date: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      prisma.staffSpecialHoliday.findMany({
        where: {
          staffId,
          holidayDate: { gte: startOfMonth, lte: endOfMonth }
        },
        include: { quota: { select: { name: true } } }
      }),
      getActiveShiftConfig()
    ]);

    // Build day-by-day map
    const daysInMonth = new Date(year, month, 0).getDate();
    const attendanceMap = new Map(attendance.map(r => [new Date(r.date).getDate(), r]));
    const holidayMap = new Map(specialHolidays.map(h => [new Date(h.holidayDate).getDate(), h]));
    const lateApprovalMap = new Map(lateApprovals.map(l => [new Date(l.date).getDate(), l]));

    // Build paid leave date set
    const paidLeaveDateKeys = new Set();
    for (const lr of leaveRequests) {
      if (lr.status === 'APPROVED' && lr.isPaidLeave) {
        const start = new Date(lr.startDate || lr.leaveDate);
        const end = new Date(lr.endDate || lr.leaveDate);
        const cur = new Date(start);
        while (cur <= end) {
          paidLeaveDateKeys.add(cur.getDate());
          cur.setDate(cur.getDate() + 1);
        }
      }
    }

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const record = attendanceMap.get(day);
      const holiday = holidayMap.get(day);
      const lateApproval = lateApprovalMap.get(day);

      const dayData = {
        day,
        date: date.toISOString().split('T')[0],
        dayOfWeek,
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
      };

      if (dayOfWeek === 0) {
        dayData.type = 'SUNDAY';
      } else if (holiday) {
        dayData.type = 'SPECIAL_HOLIDAY';
        dayData.holidayName = holiday.quota?.name || 'Holiday';
      } else if (record) {
        dayData.type = record.status === 'LEAVE' && paidLeaveDateKeys.has(day) ? 'PAID_LEAVE' : record.status;
        dayData.checkIn = record.checkInTime;
        dayData.checkOut = record.checkOutTime;
        dayData.workingHours = record.workingHours;
        dayData.lateMinutes = record.lateMinutes;
        dayData.extraMinutes = record.extraMinutes;
        dayData.isLateApproved = record.isLateApproved;
        if (record.adminEditedCheckIn || record.adminEditedCheckOut) {
          dayData.adminEdited = true;
        }
      } else if (date <= new Date()) {
        dayData.type = 'ABSENT';
      } else {
        dayData.type = 'FUTURE';
      }

      if (lateApproval) {
        dayData.lateApprovalStatus = lateApproval.status;
        dayData.lateApprovalReason = lateApproval.reason;
      }

      days.push(dayData);
    }

    // Related leave requests for the month
    const leaveRequestsSorted = leaveRequests.map(lr => ({
      id: lr.id,
      startDate: lr.startDate || lr.leaveDate,
      endDate: lr.endDate || lr.leaveDate,
      totalDays: lr.totalDays || 1,
      reason: lr.reason,
      status: lr.status,
      isPaidLeave: lr.isPaidLeave || false,
      reviewNote: lr.reviewNote
    }));

    res.json({
      success: true,
      data: {
        month, year,
        shiftConfig: {
          shiftStartTime: shiftConfig.shiftStartTime,
          shiftEndTime: shiftConfig.shiftEndTime,
          graceMinutes: shiftConfig.graceMinutes,
        },
        days,
        leaveRequests: leaveRequestsSorted,
        summary: {
          present: days.filter(d => d.type === 'PRESENT').length,
          late: days.filter(d => d.type === 'LATE').length,
          absent: days.filter(d => d.type === 'ABSENT').length,
          leave: days.filter(d => d.type === 'LEAVE').length,
          paidLeave: days.filter(d => d.type === 'PAID_LEAVE').length,
          holiday: days.filter(d => ['SUNDAY', 'HOLIDAY', 'SPECIAL_HOLIDAY'].includes(d.type)).length,
          halfDay: days.filter(d => d.type === 'HALF_DAY').length,
        }
      }
    });
  } catch (error) {
    console.error('Get calendar attendance error:', error);
    res.status(500).json({ success: false, message: 'Failed to get calendar attendance', error: error.message });
  }
};

// ============ DOWNLOAD PAYSLIP PDF ============

const downloadPayslipPdf = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { id } = req.params;

    const payslip = await prisma.payslip.findFirst({
      where: { id, staffId },
      include: {
        staff: { select: { id: true, employeeId: true, firstName: true, lastName: true, staffType: true, department: true } }
      }
    });

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }
    if (!payslip.pdfUrl) {
      return res.status(404).json({ success: false, message: 'PDF not available. Payslip may not be finalized yet.' });
    }

    res.json({ success: true, data: { pdfUrl: payslip.pdfUrl } });
  } catch (error) {
    console.error('Download payslip PDF error:', error);
    res.status(500).json({ success: false, message: 'Failed to get payslip PDF', error: error.message });
  }
};

// Export helper for use in attendanceController
module.exports = {
  getActiveShiftConfig,
  getShiftStartDate,
  getShiftEndDate,
  parseTimeString,
  // Shift config
  getShiftConfig,
  updateShiftConfig,
  // Staff salary
  updateStaffSalary,
  getStaffSalaryHistory,
  getAllStaffSalaries,
  // Admin edit attendance
  adminEditAttendanceTime,
  // Holiday quota
  createSpecialHolidayQuota,
  getSpecialHolidayQuotas,
  updateSpecialHolidayQuota,
  deleteSpecialHolidayQuota,
  allocateSpecialHoliday,
  getQuotaAllocations,
  removeSpecialHolidayAllocation,
  // Salary calculation
  calculateMonthlySalary,
  // Payslip
  generatePayslip,
  generateBulkPayslips,
  finalizePayslip,
  getPayslip,
  getStaffPayslips,
  getMonthlyPayslips,
  // Staff self-service
  getMyPayslips,
  getMyPayslipDetail,
  getMySalarySummary,
  getMyCalendarAttendance,
  downloadPayslipPdf
};
