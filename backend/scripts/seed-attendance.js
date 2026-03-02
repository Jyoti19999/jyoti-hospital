/**
 * Seed Attendance Script (v2)
 *
 * Deletes ALL existing attendance/salary data and recreates from scratch.
 * Covers November 2025 → February 2026 with:
 *   - Regular present, late, absent, leave (paid & unpaid), half-day
 *   - Special holiday quotas (Diwali, Christmas, Republic Day, etc.)
 *   - Late approval requests (approved / rejected / pending)
 *   - Paid leave requests (isPaidLeave: true) and unpaid leave requests
 *   - Overtime / extra hours
 *
 * Usage: node scripts/seed-attendance.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ===== CONFIG =====
const SHIFT_START = '10:00';
const SHIFT_END = '19:00';
const GRACE_MINUTES = 15;

const MONTHS = [
  { month: 11, year: 2025, name: 'November 2025' },
  { month: 12, year: 2025, name: 'December 2025' },
  { month: 1, year: 2026, name: 'January 2026' },
  { month: 2, year: 2026, name: 'February 2026' },
];

// Holidays by date string
const HOLIDAYS = {
  '2025-11-01': 'Diwali',
  '2025-11-02': 'Diwali (Day 2)',
  '2025-11-05': 'Bhai Dooj',
  '2025-12-25': 'Christmas',
  '2025-12-26': 'Christmas (Day 2)',
  '2026-01-01': 'New Year',
  '2026-01-26': 'Republic Day',
  '2026-02-19': 'Shivaji Jayanti',
};

// Quota definitions
const QUOTA_DEFS = [
  { name: 'Diwali 2025', description: 'Diwali festival holidays', month: 11, year: 2025, allowedDays: 2, dates: ['2025-11-01', '2025-11-02'] },
  { name: 'Bhai Dooj 2025', description: 'Bhai Dooj', month: 11, year: 2025, allowedDays: 1, dates: ['2025-11-05'] },
  { name: 'Christmas 2025', description: 'Christmas holidays', month: 12, year: 2025, allowedDays: 2, dates: ['2025-12-25', '2025-12-26'] },
  { name: 'New Year 2026', description: 'New Year holiday', month: 1, year: 2026, allowedDays: 1, dates: ['2026-01-01'] },
  { name: 'Republic Day 2026', description: 'Republic Day', month: 1, year: 2026, allowedDays: 1, dates: ['2026-01-26'] },
  { name: 'Shivaji Jayanti 2026', description: 'Shivaji Jayanti', month: 2, year: 2026, allowedDays: 1, dates: ['2026-02-19'] },
];

const PATTERNS = ['punctual', 'late-prone', 'overtime', 'mixed', 'irregular'];

// ===== HELPERS =====
function parseTime(s) { const [h, m] = s.split(':').map(Number); return { hours: h, minutes: m }; }
function dateStr(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function dateOnly(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

function createDateTime(ds, hours, minutes, seconds = 0) {
  const d = new Date(ds);
  d.setHours(hours, minutes, seconds, 0);
  return d;
}

function getWorkingDays(month, year) {
  const days = [];
  const count = new Date(year, month, 0).getDate();
  for (let d = 1; d <= count; d++) {
    const dt = new Date(year, month - 1, d);
    if (dt.getDay() !== 0) days.push(dt);
  }
  return days;
}

let seed = 42;
function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }

const LEAVE_REASONS = [
  'Personal work', 'Family function', 'Not feeling well', 'Medical appointment',
  'Family emergency', 'Festival celebration', 'Out of station travel',
  "Child's school event", 'Wedding in family', 'Home renovation work',
];
const LATE_REASONS = [
  'Traffic jam on highway', 'Bus was delayed', 'Doctor appointment in the morning',
  'Family emergency - resolved now', 'Vehicle breakdown on the way',
  'Heavy rain caused flooding', 'Child was unwell, visited pediatrician first',
  'Power outage at home delayed preparation', 'Flat tyre on the way',
];

// ===== DAY GENERATOR =====
function generateDay(dayDate, pattern) {
  const ds = dateStr(dayDate);
  if (HOLIDAYS[ds]) return { type: 'HOLIDAY' };

  const r = rand();
  switch (pattern) {
    case 'punctual':
      if (r < 0.75) return { type: 'PRESENT', ciOff: randInt(-10, GRACE_MINUTES), coOff: randInt(0, 15) };
      if (r < 0.83) return { type: 'LATE', lateBy: randInt(16, 35), coOff: randInt(0, 10) };
      if (r < 0.88) return { type: 'LEAVE' };
      if (r < 0.92) return { type: 'ABSENT' };
      if (r < 0.95) return { type: 'HALF_DAY' };
      return { type: 'PRESENT', ciOff: randInt(-5, 5), coOff: 0, extra: randInt(30, 120) };

    case 'late-prone':
      if (r < 0.35) return { type: 'PRESENT', ciOff: randInt(-5, GRACE_MINUTES), coOff: randInt(0, 10) };
      if (r < 0.70) return { type: 'LATE', lateBy: randInt(16, 180), coOff: randInt(0, 30) };
      if (r < 0.80) return { type: 'LEAVE' };
      if (r < 0.88) return { type: 'ABSENT' };
      if (r < 0.93) return { type: 'HALF_DAY' };
      return { type: 'PRESENT', ciOff: randInt(0, 10), coOff: 0, extra: randInt(20, 60) };

    case 'overtime':
      if (r < 0.65) return { type: 'PRESENT', ciOff: randInt(-15, 5), coOff: 0, extra: randInt(30, 180) };
      if (r < 0.80) return { type: 'PRESENT', ciOff: randInt(-10, GRACE_MINUTES), coOff: randInt(0, 10) };
      if (r < 0.88) return { type: 'LATE', lateBy: randInt(16, 45), coOff: randInt(0, 20) };
      if (r < 0.93) return { type: 'LEAVE' };
      if (r < 0.96) return { type: 'HALF_DAY' };
      return { type: 'ABSENT' };

    case 'mixed':
      if (r < 0.45) return { type: 'PRESENT', ciOff: randInt(-5, GRACE_MINUTES), coOff: randInt(0, 15) };
      if (r < 0.60) return { type: 'LATE', lateBy: randInt(16, 90), coOff: randInt(0, 15) };
      if (r < 0.75) return { type: 'LEAVE' };
      if (r < 0.83) return { type: 'ABSENT' };
      if (r < 0.90) return { type: 'HALF_DAY' };
      return { type: 'PRESENT', ciOff: randInt(-5, 5), coOff: 0, extra: randInt(30, 90) };

    case 'irregular':
      if (r < 0.30) return { type: 'PRESENT', ciOff: randInt(-3, GRACE_MINUTES), coOff: randInt(0, 10) };
      if (r < 0.45) return { type: 'LATE', lateBy: randInt(20, 150), coOff: randInt(0, 15) };
      if (r < 0.60) return { type: 'ABSENT' };
      if (r < 0.80) return { type: 'LEAVE' };
      if (r < 0.90) return { type: 'HALF_DAY' };
      return { type: 'PRESENT', ciOff: randInt(-5, 3), coOff: 0, extra: randInt(20, 60) };

    default:
      return { type: 'PRESENT', ciOff: 0, coOff: 0 };
  }
}

// ===== MAIN =====
async function main() {
  console.log('=== Attendance Seed Script v2 ===\n');

  const allStaff = await prisma.staff.findMany({
    select: { id: true, firstName: true, lastName: true, staffType: true, monthlySalary: true, employeeId: true },
    where: { isActive: true },
  });
  if (allStaff.length === 0) { console.log('No active staff. Exiting.'); return; }
  console.log(`Found ${allStaff.length} active staff.\n`);

  // Delete ALL existing salary-related data
  console.log('Deleting all existing records...');
  const d1 = await prisma.payslip.deleteMany({});
  console.log(`  Payslips: ${d1.count}`);
  const d2 = await prisma.staffSpecialHoliday.deleteMany({});
  console.log(`  Holiday allocations: ${d2.count}`);
  const d3 = await prisma.specialHolidayQuota.deleteMany({});
  console.log(`  Holiday quotas: ${d3.count}`);
  const d4 = await prisma.lateApproval.deleteMany({});
  console.log(`  Late approvals: ${d4.count}`);
  const d5 = await prisma.leaveRequest.deleteMany({});
  console.log(`  Leave requests: ${d5.count}`);
  const d6 = await prisma.staffAttendance.deleteMany({});
  console.log(`  Attendance: ${d6.count}`);
  console.log('  Done.\n');

  // Ensure ShiftConfig
  const existingConfig = await prisma.shiftConfig.findFirst({ where: { isDefault: true, isActive: true } });
  if (!existingConfig) {
    await prisma.shiftConfig.create({
      data: { name: 'Default Shift', shiftStartTime: SHIFT_START, shiftEndTime: SHIFT_END, graceMinutes: GRACE_MINUTES, latePenaltyMultiplier: 2.0, isDefault: true, isActive: true },
    });
    console.log('Created default ShiftConfig.\n');
  } else {
    console.log(`Using existing ShiftConfig: ${existingConfig.shiftStartTime} - ${existingConfig.shiftEndTime}\n`);
  }

  // Create Holiday Quotas
  console.log('Creating holiday quotas...');
  const createdQuotas = [];
  for (const qd of QUOTA_DEFS) {
    const q = await prisma.specialHolidayQuota.upsert({
      where: { name_month_year: { name: qd.name, month: qd.month, year: qd.year } },
      update: {},
      create: { name: qd.name, description: qd.description, month: qd.month, year: qd.year, allowedDays: qd.allowedDays },
    });
    createdQuotas.push({ ...q, dates: qd.dates });
    console.log(`  ${qd.name} (${qd.allowedDays} days)`);
  }
  console.log('');

  // Generate all records
  console.log('Generating attendance data...\n');

  const { hours: startH, minutes: startM } = parseTime(SHIFT_START);
  const { hours: endH, minutes: endM } = parseTime(SHIFT_END);
  const today = new Date(2026, 1, 27);

  const attendanceRecs = [];
  const leaveReqs = [];
  const lateApprovalRecs = [];
  const holidayAllocs = [];
  const holidayAllocKeySet = new Set();

  for (let si = 0; si < allStaff.length; si++) {
    const staff = allStaff[si];
    const pattern = PATTERNS[si % PATTERNS.length];
    seed = 42 + si * 1000;

    console.log(`  ${staff.firstName} ${staff.lastName} (${staff.staffType}) — ${pattern}`);
    let lateCount = 0;
    let leaveStreak = [];

    const flushLeave = () => {
      if (leaveStreak.length === 0) return;
      const sorted = leaveStreak.sort((a, b) => a - b);
      const isPaid = rand() < 0.35;
      const reason = pick(LEAVE_REASONS);

      leaveReqs.push({
        staffId: staff.id,
        leaveDate: sorted[0],
        startDate: sorted[0],
        endDate: sorted[sorted.length - 1],
        totalDays: sorted.length,
        reason,
        status: 'APPROVED',
        isPaidLeave: isPaid,
        reviewedBy: allStaff[0].id,
        reviewedAt: new Date(),
        reviewNote: isPaid ? 'Approved as paid leave' : 'Approved - unpaid leave',
      });
      leaveStreak = [];
    };

    for (const { month, year } of MONTHS) {
      const workDays = getWorkingDays(month, year).filter(d => d <= today);

      for (const dayDate of workDays) {
        const ds = dateStr(dayDate);
        const result = generateDay(dayDate, pattern);

        switch (result.type) {
          case 'HOLIDAY': {
            attendanceRecs.push({ staffId: staff.id, date: dateOnly(dayDate), status: 'HOLIDAY', isPresent: false });
            const matchQ = createdQuotas.find(q => q.dates.includes(ds));
            if (matchQ) {
              const aKey = `${staff.id}-${ds}`;
              if (!holidayAllocKeySet.has(aKey)) {
                holidayAllocKeySet.add(aKey);
                holidayAllocs.push({ staffId: staff.id, quotaId: matchQ.id, holidayDate: dateOnly(dayDate) });
              }
            }
            flushLeave();
            break;
          }

          case 'PRESENT': {
            flushLeave();
            const ci = result.ciOff || 0;
            const co = result.coOff || 0;
            const extra = result.extra || 0;
            const checkIn = createDateTime(ds, startH, startM + ci, randInt(0, 59));
            const checkOut = createDateTime(ds, endH, endM + co + extra, randInt(0, 59));
            const workingHours = Math.round(((checkOut - checkIn) / 3600000) * 100) / 100;
            attendanceRecs.push({
              staffId: staff.id, date: dateOnly(dayDate), checkInTime: checkIn, checkOutTime: checkOut,
              workingHours, isPresent: true, status: 'PRESENT', extraMinutes: extra > 0 ? extra : null,
            });
            break;
          }

          case 'LATE': {
            flushLeave();
            const lateBy = result.lateBy;
            const co = result.coOff || 0;
            const checkIn = createDateTime(ds, startH, startM + lateBy, randInt(0, 59));
            const checkOut = createDateTime(ds, endH, endM + co, randInt(0, 59));
            const workingHours = Math.round(((checkOut - checkIn) / 3600000) * 100) / 100;

            const rec = {
              staffId: staff.id, date: dateOnly(dayDate), checkInTime: checkIn, checkOutTime: checkOut,
              workingHours, isPresent: true, status: 'LATE', lateMinutes: lateBy,
            };

            lateCount++;
            if (lateCount <= 3 || rand() < 0.5) {
              const aStatus = pick(['PENDING', 'APPROVED', 'APPROVED', 'REJECTED']);
              lateApprovalRecs.push({
                staffId: staff.id, date: dateOnly(dayDate), actualCheckIn: checkIn, lateMinutes: lateBy,
                reason: pick(LATE_REASONS), status: aStatus,
                reviewedBy: aStatus !== 'PENDING' ? allStaff[0].id : null,
                reviewedAt: aStatus !== 'PENDING' ? new Date() : null,
                reviewNote: aStatus === 'APPROVED' ? 'Approved - valid reason' : aStatus === 'REJECTED' ? 'Please be punctual' : null,
              });
              if (aStatus === 'APPROVED') rec.isLateApproved = true;
            }
            attendanceRecs.push(rec);
            break;
          }

          case 'LEAVE': {
            attendanceRecs.push({ staffId: staff.id, date: dateOnly(dayDate), status: 'LEAVE', isPresent: false });
            leaveStreak.push(dateOnly(dayDate));
            break;
          }

          case 'HALF_DAY': {
            flushLeave();
            const checkIn = createDateTime(ds, startH, startM + randInt(-5, 10), randInt(0, 59));
            const checkOut = createDateTime(ds, startH + 4, 30 + randInt(0, 30), randInt(0, 59));
            const workingHours = Math.round(((checkOut - checkIn) / 3600000) * 100) / 100;
            attendanceRecs.push({
              staffId: staff.id, date: dateOnly(dayDate), checkInTime: checkIn, checkOutTime: checkOut,
              workingHours, isPresent: true, status: 'HALF_DAY',
            });
            break;
          }

          case 'ABSENT': {
            flushLeave();
            attendanceRecs.push({ staffId: staff.id, date: dateOnly(dayDate), status: 'ABSENT', isPresent: false });
            break;
          }
        }
      }
      flushLeave();
    }
  }

  // Bulk insert
  const BATCH = 100;

  console.log(`\nInserting ${attendanceRecs.length} attendance records...`);
  for (let i = 0; i < attendanceRecs.length; i += BATCH) {
    await prisma.staffAttendance.createMany({ data: attendanceRecs.slice(i, i + BATCH), skipDuplicates: true });
    process.stdout.write(`  ${Math.min(i + BATCH, attendanceRecs.length)}/${attendanceRecs.length}\r`);
  }
  console.log(`  Done.`);

  console.log(`Inserting ${leaveReqs.length} leave requests...`);
  for (let i = 0; i < leaveReqs.length; i += BATCH) {
    await prisma.leaveRequest.createMany({ data: leaveReqs.slice(i, i + BATCH), skipDuplicates: true });
  }
  console.log(`  Done. (Paid: ${leaveReqs.filter(l => l.isPaidLeave).length}, Unpaid: ${leaveReqs.filter(l => !l.isPaidLeave).length})`);

  console.log(`Inserting ${lateApprovalRecs.length} late approvals...`);
  for (let i = 0; i < lateApprovalRecs.length; i += BATCH) {
    await prisma.lateApproval.createMany({ data: lateApprovalRecs.slice(i, i + BATCH), skipDuplicates: true });
  }
  console.log(`  Done.`);

  console.log(`Inserting ${holidayAllocs.length} holiday allocations...`);
  if (holidayAllocs.length > 0) {
    for (let i = 0; i < holidayAllocs.length; i += BATCH) {
      await prisma.staffSpecialHoliday.createMany({ data: holidayAllocs.slice(i, i + BATCH), skipDuplicates: true });
    }
  }
  console.log(`  Done.`);

  // Summary
  console.log('\n=== Summary ===');
  const counts = {};
  for (const r of attendanceRecs) counts[r.status] = (counts[r.status] || 0) + 1;
  console.log('Attendance by status:');
  for (const [s, c] of Object.entries(counts)) console.log(`  ${s}: ${c}`);
  console.log(`Leave requests: ${leaveReqs.length} (paid: ${leaveReqs.filter(l => l.isPaidLeave).length})`);
  console.log(`Late approvals: ${lateApprovalRecs.length}`);
  console.log(`  Approved: ${lateApprovalRecs.filter(l => l.status === 'APPROVED').length}`);
  console.log(`  Rejected: ${lateApprovalRecs.filter(l => l.status === 'REJECTED').length}`);
  console.log(`  Pending:  ${lateApprovalRecs.filter(l => l.status === 'PENDING').length}`);
  console.log(`Holiday allocations: ${holidayAllocs.length}`);
  console.log('\nDone! Run salary calculations and payslip generation to test.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
