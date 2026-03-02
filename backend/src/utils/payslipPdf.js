const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Font paths
const FONT_DIR = path.join(__dirname, 'fonts');
const FONT_REGULAR = path.join(FONT_DIR, 'NotoSans-Regular.ttf');
const FONT_BOLD = path.join(FONT_DIR, 'NotoSans-Bold.ttf');

/**
 * Generate a payslip PDF and save it to the uploads directory.
 * Returns the relative URL path for the PDF.
 */
const generatePayslipPDF = async (payslip, staff, calculationDetails) => {
  const { month, year } = payslip;
  const monthName = MONTHS[month];
  const staffName = `${staff.firstName} ${staff.lastName}`;

  // Create directory structure: uploads/{staffId}/payslips/
  const staffDir = path.join(__dirname, '../../uploads', staff.employeeId || staff.id, 'payslips');
  if (!fs.existsSync(staffDir)) {
    fs.mkdirSync(staffDir, { recursive: true });
  }

  const fileName = `payslip_${year}_${String(month).padStart(2, '0')}.pdf`;
  const filePath = path.join(staffDir, fileName);
  const pdfUrl = `/uploads/${staff.employeeId || staff.id}/payslips/${fileName}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Register Unicode fonts
    doc.registerFont('NotoSans', FONT_REGULAR);
    doc.registerFont('NotoSans-Bold', FONT_BOLD);

    const pageWidth = doc.page.width - 80; // 40 margin each side

    // ===== PAGE 1: HEADER + EMPLOYEE INFO + SUMMARY + SALARY =====

    // Header
    doc.rect(40, 40, pageWidth, 60).fill('#1e40af');
    doc.fillColor('#ffffff').fontSize(16).font('NotoSans-Bold')
      .text('Insight Institute of Ophthalmology Insight Laser Centre', 50, 52, { width: pageWidth - 20 });
    doc.fontSize(11).font('NotoSans')
      .text(`Salary Slip — ${monthName} ${year}`, 50, 78, { width: pageWidth - 20 });

    // Employee Info
    let y = 115;
    doc.fillColor('#1e3a5f').fontSize(12).font('NotoSans-Bold').text('Employee Details', 40, y);
    y += 18;
    doc.fillColor('#333333').fontSize(10).font('NotoSans');

    const infoLeft = [
      ['Name', staffName],
      ['Employee ID', staff.employeeId || '—'],
      ['Department', staff.department || '—'],
    ];
    const infoRight = [
      ['Role', staff.staffType || '—'],
      ['Pay Period', `${monthName} ${year}`],
      ['Status', payslip.status],
    ];

    infoLeft.forEach(([label, value], i) => {
      doc.font('NotoSans-Bold').text(`${label}:`, 50, y + i * 15, { continued: true });
      doc.font('NotoSans').text(`  ${value}`);
    });
    infoRight.forEach(([label, value], i) => {
      doc.font('NotoSans-Bold').text(`${label}:`, 320, y + i * 15, { continued: true });
      doc.font('NotoSans').text(`  ${value}`);
    });

    // Attendance Summary
    y += 60;
    doc.fillColor('#1e3a5f').fontSize(12).font('NotoSans-Bold').text('Attendance Summary', 40, y);
    y += 20;

    const attendanceData = [
      { label: 'Total Working Days', value: payslip.totalWorkingDays, color: '#333333' },
      { label: 'Days Present', value: payslip.daysPresent, color: '#16a34a' },
      { label: 'Days Absent', value: payslip.daysAbsent, color: '#dc2626' },
      { label: 'Days on Leave', value: payslip.daysOnLeave, color: '#d97706' },
      { label: 'Days Late', value: payslip.daysLate, color: '#ea580c' },
      { label: 'Holidays', value: payslip.daysHoliday, color: '#2563eb' },
    ];

    const colWidth = pageWidth / 3;
    attendanceData.forEach((item, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 50 + col * colWidth;
      const yPos = y + row * 38;

      doc.rect(x - 5, yPos - 5, colWidth - 10, 33).lineWidth(0.5).stroke('#e5e7eb');
      doc.fillColor('#6b7280').fontSize(8).font('NotoSans-Bold').text(item.label, x, yPos);
      doc.fillColor(item.color).fontSize(13).font('NotoSans-Bold').text(String(item.value), x, yPos + 12);
    });

    // Salary Breakdown
    y += 94;
    doc.fillColor('#1e3a5f').fontSize(12).font('NotoSans-Bold').text('Salary Breakdown', 40, y);
    y += 20;

    // Table header
    doc.rect(40, y, pageWidth, 22).fill('#f3f4f6');
    doc.fillColor('#374151').fontSize(9).font('NotoSans-Bold');
    doc.text('Description', 50, y + 6);
    doc.text('Amount (₹)', 430, y + 6, { width: 80, align: 'right' });
    y += 25;

    const unpaidLeaveDays = payslip.daysOnLeave - (payslip.daysOnPaidLeave || 0);
    const salaryRows = [
      { label: 'Base Monthly Salary', amount: payslip.baseSalary, type: 'base' },
      { label: `Leave Deduction (${unpaidLeaveDays} unpaid leave days)`, amount: payslip.leaveDeduction, type: 'deduction' },
      { label: `Absent Deduction (${payslip.daysAbsent} days)`, amount: payslip.absentDeduction, type: 'deduction' },
      { label: `Late Penalty (${payslip.daysLate} late days)`, amount: payslip.lateDeduction, type: 'deduction' },
      { label: `Extra Hours Pay (${payslip.extraHoursWorked}h)`, amount: payslip.extraHoursPay, type: 'addition' },
    ];

    doc.fontSize(9.5);
    salaryRows.forEach((row) => {
      const prefix = row.type === 'deduction' ? '- ' : row.type === 'addition' ? '+ ' : '';
      const color = row.type === 'deduction' ? '#dc2626' : row.type === 'addition' ? '#16a34a' : '#333333';

      doc.fillColor('#333333').font('NotoSans').text(row.label, 50, y);
      doc.fillColor(color).font('NotoSans-Bold').text(`${prefix}${row.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 430, y, { width: 80, align: 'right' });
      y += 17;
    });

    // Total line
    y += 4;
    doc.lineWidth(1.5).strokeColor('#1e40af').moveTo(40, y).lineTo(40 + pageWidth, y).stroke();
    y += 8;
    doc.fillColor('#1e40af').fontSize(13).font('NotoSans-Bold').text('Net Salary', 50, y);
    doc.text(`₹ ${payslip.netSalary?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 400, y, { width: 110, align: 'right' });

    // Rates
    y += 30;
    if (calculationDetails?.rates) {
      const rates = calculationDetails.rates;
      doc.fillColor('#6b7280').fontSize(8).font('NotoSans');
      doc.text(`Per Day: ₹${rates.perDayRate?.toLocaleString('en-IN')}  |  Per Hour: ₹${rates.perHourRate?.toLocaleString('en-IN')}  |  Per Minute: ₹${rates.perMinuteRate?.toLocaleString('en-IN')}`, 40, y);
    }

    // Page 1 footer — positioned well within page to prevent overflow
    const footer1Y = doc.page.height - 80;
    doc.lineWidth(0.5).strokeColor('#d1d5db').moveTo(40, footer1Y - 5).lineTo(40 + pageWidth, footer1Y - 5).stroke();
    doc.fillColor('#9ca3af').fontSize(7).font('NotoSans');
    doc.text('This is a system-generated payslip. For any discrepancies, please contact HR.', 40, footer1Y, {
      width: pageWidth, align: 'center', lineBreak: false
    });
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 40, footer1Y + 12, {
      width: pageWidth, align: 'center', lineBreak: false
    });

    // ===== PAGE 2: DAY-BY-DAY CALENDAR + LEGEND =====
    if (calculationDetails?.dayDetails && calculationDetails.dayDetails.length > 0) {
      doc.addPage();
      y = 50;

      doc.fillColor('#1e3a5f').fontSize(14).font('NotoSans-Bold').text('Day-by-Day Attendance', 40, y);
      doc.fillColor('#6b7280').fontSize(9).font('NotoSans').text(`${monthName} ${year}`, 40, y + 18);
      y += 40;

      // Calendar grid
      const cellW = pageWidth / 7;
      const cellH = 52;

      // Day names header row
      doc.rect(40, y, pageWidth, 18).fill('#1e40af');
      DAY_NAMES.forEach((dayName, i) => {
        doc.fillColor('#ffffff').fontSize(8).font('NotoSans-Bold')
          .text(dayName, 40 + i * cellW, y + 4, { width: cellW, align: 'center' });
      });
      y += 20;

      const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
      const daysInMonth = new Date(year, month, 0).getDate();

      const dayMap = {};
      calculationDetails.dayDetails.forEach(d => { dayMap[d.day] = d; });

      const typeColors = {
        'PRESENT': { bg: '#f0fdf4', text: '#16a34a', label: 'P' },
        'LATE': { bg: '#fff7ed', text: '#ea580c', label: 'L' },
        'ABSENT': { bg: '#fef2f2', text: '#dc2626', label: 'A' },
        'LEAVE': { bg: '#fffbeb', text: '#d97706', label: 'LV' },
        'PAID_LEAVE': { bg: '#f0fdf4', text: '#059669', label: 'PL' },
        'HALF_DAY': { bg: '#fefce8', text: '#ca8a04', label: 'HD' },
        'SUNDAY': { bg: '#eff6ff', text: '#2563eb', label: 'S' },
        'HOLIDAY': { bg: '#eff6ff', text: '#2563eb', label: 'H' },
        'SPECIAL_HOLIDAY': { bg: '#f5f3ff', text: '#7c3aed', label: 'SH' },
        'FUTURE': { bg: '#f9fafb', text: '#9ca3af', label: '—' },
      };

      for (let week = 0; week < 6; week++) {
        let hasAnyDay = false;

        for (let col = 0; col < 7; col++) {
          const x = 40 + col * cellW;
          const dayNum = week * 7 + col - firstDayOfWeek + 1;

          if (dayNum >= 1 && dayNum <= daysInMonth) {
            hasAnyDay = true;
            const dayInfo = dayMap[dayNum] || { type: 'FUTURE' };
            const colors = typeColors[dayInfo.type] || typeColors['FUTURE'];

            doc.rect(x, y, cellW, cellH).lineWidth(0.3).fillAndStroke(colors.bg, '#d1d5db');
            doc.fillColor('#333333').fontSize(9).font('NotoSans-Bold')
              .text(String(dayNum), x + 3, y + 3);
            doc.fillColor(colors.text).fontSize(7).font('NotoSans-Bold')
              .text(colors.label, x + cellW - 18, y + 3);

            // Show deduction if any
            if (dayInfo.deduction && dayInfo.deduction > 0) {
              doc.fillColor('#dc2626').fontSize(6).font('NotoSans')
                .text(`-₹${Math.round(dayInfo.deduction)}`, x + 3, y + 18);
            }
            // Show late minutes
            if (dayInfo.lateMinutes) {
              const lm = dayInfo.lateMinutes;
              const timeStr = lm >= 60 ? `${Math.floor(lm / 60)}h${lm % 60}m` : `${lm}m`;
              doc.fillColor('#ea580c').fontSize(6).font('NotoSans')
                .text(`Late: ${timeStr}`, x + 3, y + 28);
              if (dayInfo.lateApproved) {
                doc.fillColor('#16a34a').fontSize(5).text('Approved', x + 3, y + 37);
              }
            }
            // Show extra minutes
            if (dayInfo.extraMinutes) {
              const em = dayInfo.extraMinutes;
              const timeStr = em >= 60 ? `${Math.floor(em / 60)}h${em % 60}m` : `${em}m`;
              doc.fillColor('#16a34a').fontSize(6).font('NotoSans')
                .text(`+${timeStr}`, x + 3, y + 38);
            }
          } else {
            doc.rect(x, y, cellW, cellH).lineWidth(0.3).fillAndStroke('#f9fafb', '#e5e7eb');
          }
        }

        if (!hasAnyDay) break;
        y += cellH;
      }

      // ===== LEGEND TABLE — below calendar =====
      y += 30;

      const legendItems = [
        { code: 'P', label: 'Present', bg: '#f0fdf4', color: '#16a34a' },
        { code: 'L', label: 'Late', bg: '#fff7ed', color: '#ea580c' },
        { code: 'A', label: 'Absent', bg: '#fef2f2', color: '#dc2626' },
        { code: 'LV', label: 'Leave (Unpaid)', bg: '#fffbeb', color: '#d97706' },
        { code: 'PL', label: 'Paid Leave', bg: '#f0fdf4', color: '#059669' },
        { code: 'HD', label: 'Half Day', bg: '#fefce8', color: '#ca8a04' },
        { code: 'S', label: 'Sunday', bg: '#eff6ff', color: '#2563eb' },
        { code: 'H', label: 'Holiday', bg: '#eff6ff', color: '#2563eb' },
        { code: 'SH', label: 'Special Holiday', bg: '#f5f3ff', color: '#7c3aed' },
      ];

      const cols = 3;
      const rows = Math.ceil(legendItems.length / cols);
      const tblColW = pageWidth / cols;
      const tblRowH = 18;

      // Table header
      doc.rect(40, y, pageWidth, tblRowH).fill('#1e40af');
      for (let c = 0; c < cols; c++) {
        const hx = 40 + c * tblColW;
        doc.fillColor('#ffffff').fontSize(7.5).font('NotoSans-Bold');
        doc.text('Code', hx + 5, y + 4, { width: 28 });
        doc.text('Meaning', hx + 35, y + 4, { width: tblColW - 40 });
      }
      y += tblRowH;

      // Table rows
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (idx >= legendItems.length) break;
          const item = legendItems[idx];
          const cx = 40 + c * tblColW;

          doc.rect(cx, y, tblColW, tblRowH).lineWidth(0.3).fillAndStroke(item.bg, '#d1d5db');
          doc.fillColor(item.color).fontSize(8).font('NotoSans-Bold')
            .text(item.code, cx + 5, y + 4, { width: 28 });
          doc.fillColor('#374151').fontSize(7.5).font('NotoSans')
            .text(item.label, cx + 35, y + 4, { width: tblColW - 40 });
        }
        y += tblRowH;
      }

      // Page 2 footer
      const footer2Y = doc.page.height - 50;
      doc.fillColor('#9ca3af').fontSize(7).font('NotoSans');
      doc.text(`${staffName} — ${monthName} ${year} Payslip`, 40, footer2Y, {
        width: pageWidth, align: 'center'
      });
    }

    doc.end();

    stream.on('finish', () => resolve(pdfUrl));
    stream.on('error', reject);
  });
};

module.exports = { generatePayslipPDF };
