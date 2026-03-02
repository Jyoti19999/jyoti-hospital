const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getActiveShiftConfig, getShiftStartDate } = require('./salaryController');

// ============ STAFF LEAVE REQUESTS ============

const submitLeaveRequest = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date must be on or after start date' });
    }

    // Calculate number of days (excluding Sundays)
    let totalDays = 0;
    const current = new Date(start);
    while (current <= end) {
      if (current.getDay() !== 0) totalDays++;
      current.setDate(current.getDate() + 1);
    }

    if (totalDays === 0) {
      return res.status(400).json({ success: false, message: 'Leave request must include at least one working day' });
    }

    // Check for overlapping leave requests
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        staffId,
        status: { not: 'REJECTED' },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } }
        ]
      }
    });

    if (overlap) {
      return res.status(409).json({ success: false, message: 'You already have a leave request overlapping these dates' });
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        staffId,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, message: 'Leave request submitted', data: leaveRequest });
  } catch (error) {
    console.error('Submit leave request error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit leave request', error: error.message });
  }
};

const getMyLeaveRequests = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { status, year } = req.query;

    const where = { staffId };
    if (status) where.status = status;
    if (year) {
      where.startDate = {
        gte: new Date(parseInt(year), 0, 1),
        lte: new Date(parseInt(year), 11, 31, 23, 59, 59)
      };
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get my leave requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to get leave requests', error: error.message });
  }
};

const cancelLeaveRequest = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { id } = req.params;

    const request = await prisma.leaveRequest.findFirst({
      where: { id, staffId }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${request.status.toLowerCase()} leave request` });
    }

    await prisma.leaveRequest.delete({ where: { id } });
    res.json({ success: true, message: 'Leave request cancelled' });
  } catch (error) {
    console.error('Cancel leave request error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel leave request', error: error.message });
  }
};

// ============ STAFF LATE APPROVAL REQUESTS ============

const submitLateApproval = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { date, reason } = req.body;

    if (!date || !reason) {
      return res.status(400).json({ success: false, message: 'Date and reason are required' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Verify the staff has an attendance record with a check-in time on this date
    const attendance = await prisma.staffAttendance.findUnique({
      where: { staffId_date: { staffId, date: targetDate } }
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No attendance record found for this date' });
    }
    if (!attendance.checkInTime) {
      return res.status(400).json({ success: false, message: 'No check-in time recorded for this date' });
    }

    // Calculate lateness from actual check-in time vs shift config
    const shiftConfig = await getActiveShiftConfig();
    const shiftStart = getShiftStartDate(targetDate, shiftConfig.shiftStartTime);
    const diffMs = new Date(attendance.checkInTime) - shiftStart;
    const lateByMinutes = Math.floor(diffMs / 60000);

    if (lateByMinutes <= 0) {
      return res.status(400).json({ success: false, message: 'You were not late on this date — checked in before shift start' });
    }

    // Check for existing request
    const existing = await prisma.lateApproval.findFirst({
      where: { staffId, date: targetDate }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Late approval request already exists for this date' });
    }

    const lateApproval = await prisma.lateApproval.create({
      data: {
        staffId,
        date: targetDate,
        actualCheckIn: attendance.checkInTime,
        lateMinutes: attendance.lateMinutes || lateByMinutes,
        reason,
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, message: 'Late approval request submitted', data: lateApproval });
  } catch (error) {
    console.error('Submit late approval error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit late approval', error: error.message });
  }
};

const getMyLateApprovals = async (req, res) => {
  try {
    const staffId = req.user.id;
    const { status } = req.query;

    const where = { staffId };
    if (status) where.status = status;

    const approvals = await prisma.lateApproval.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: approvals });
  } catch (error) {
    console.error('Get my late approvals error:', error);
    res.status(500).json({ success: false, message: 'Failed to get late approvals', error: error.message });
  }
};

// ============ ADMIN LEAVE MANAGEMENT ============

const getAllLeaveRequests = async (req, res) => {
  try {
    const { status, staffId, month, year } = req.query;

    const where = {};
    if (status) where.status = status;
    if (staffId) where.staffId = staffId;
    if (month && year) {
      where.startDate = {
        gte: new Date(parseInt(year), parseInt(month) - 1, 1),
        lte: new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      };
    } else if (year) {
      where.startDate = {
        gte: new Date(parseInt(year), 0, 1),
        lte: new Date(parseInt(year), 11, 31, 23, 59, 59)
      };
    }

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, employeeId: true, staffType: true, department: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get all leave requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to get leave requests', error: error.message });
  }
};

const reviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote, isPaidLeave } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED' });
    }

    const request = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot review a ${request.status.toLowerCase()} request` });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.leaveRequest.update({
        where: { id },
        data: {
          status,
          isPaidLeave: status === 'APPROVED' ? (isPaidLeave === true) : false,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          reviewNote: reviewNote || null
        },
        include: {
          staff: { select: { firstName: true, lastName: true, employeeId: true } }
        }
      });

      // If approved, mark attendance records as LEAVE for those dates
      if (status === 'APPROVED') {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        const current = new Date(start);

        while (current <= end) {
          if (current.getDay() !== 0) { // Skip Sundays
            const dateOnly = new Date(current);
            dateOnly.setHours(0, 0, 0, 0);

            await tx.staffAttendance.upsert({
              where: { staffId_date: { staffId: request.staffId, date: dateOnly } },
              update: { status: 'LEAVE', isPresent: false },
              create: { staffId: request.staffId, date: dateOnly, status: 'LEAVE', isPresent: false }
            });
          }
          current.setDate(current.getDate() + 1);
        }
      }

      return updated;
    });

    res.json({ success: true, message: `Leave request ${status.toLowerCase()}`, data: result });
  } catch (error) {
    console.error('Review leave request error:', error);
    res.status(500).json({ success: false, message: 'Failed to review leave request', error: error.message });
  }
};

// ============ ADMIN LATE APPROVAL MANAGEMENT ============

const getAllLateApprovals = async (req, res) => {
  try {
    const { status, staffId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (staffId) where.staffId = staffId;

    const approvals = await prisma.lateApproval.findMany({
      where,
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, employeeId: true, staffType: true, department: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: approvals });
  } catch (error) {
    console.error('Get all late approvals error:', error);
    res.status(500).json({ success: false, message: 'Failed to get late approvals', error: error.message });
  }
};

const reviewLateApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED' });
    }

    const approval = await prisma.lateApproval.findUnique({ where: { id } });
    if (!approval) {
      return res.status(404).json({ success: false, message: 'Late approval not found' });
    }
    if (approval.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot review a ${approval.status.toLowerCase()} request` });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.lateApproval.update({
        where: { id },
        data: {
          status,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          reviewNote: reviewNote || null
        },
        include: {
          staff: { select: { firstName: true, lastName: true, employeeId: true } }
        }
      });

      // If approved, mark attendance record's isLateApproved
      if (status === 'APPROVED') {
        await tx.staffAttendance.updateMany({
          where: { staffId: approval.staffId, date: approval.date },
          data: { isLateApproved: true }
        });
      }

      return updated;
    });

    res.json({ success: true, message: `Late approval ${status.toLowerCase()}`, data: result });
  } catch (error) {
    console.error('Review late approval error:', error);
    res.status(500).json({ success: false, message: 'Failed to review late approval', error: error.message });
  }
};

// ============ PENDING COUNTS FOR ADMIN DASHBOARD ============

const getPendingCount = async (req, res) => {
  try {
    const [pendingLeaves, pendingLateApprovals] = await Promise.all([
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.lateApproval.count({ where: { status: 'PENDING' } })
    ]);

    res.json({
      success: true,
      data: { pendingLeaves, pendingLateApprovals, total: pendingLeaves + pendingLateApprovals }
    });
  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get pending counts', error: error.message });
  }
};

module.exports = {
  // Staff leave
  submitLeaveRequest,
  getMyLeaveRequests,
  cancelLeaveRequest,
  // Staff late approval
  submitLateApproval,
  getMyLateApprovals,
  // Admin leave management
  getAllLeaveRequests,
  reviewLeaveRequest,
  // Admin late approval management
  getAllLateApprovals,
  reviewLateApproval,
  // Counts
  getPendingCount
};
