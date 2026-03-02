import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ConfirmationDialog from "@/components/ui/confirmation-dialog";
import {
  Clock,
  Calendar as CalendarIcon,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ExcelJS from 'exceljs';

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const StaffAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [attendanceStats, setAttendanceStats] = useState({
    totalStaff: 0,
    present: 0,
    absent: 0,
    late: 0
  });

  // QR code state
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);

  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successTitle, setSuccessTitle] = useState('Success');

  // Error dialog state
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorTitle, setErrorTitle] = useState('Error');

  // Confirmation dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Get unique departments and roles for filters
  const departments = ['all', ...new Set(attendanceData.map(d => d.department).filter(Boolean))];
  const roles = ['all', ...new Set(attendanceData.map(d => d.role).filter(Boolean))];

  // Fetch attendance data
  const fetchAttendanceData = async (date) => {
    setLoading(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const response = await fetch(`${API_BASE_URL}/attendance/daily?date=${formattedDate}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch attendance');

      const result = await response.json();

      if (result.success) {
        // Transform the data to match component expectations
        const transformedData = result.data.attendance.map(record => ({
          id: record.staffId,
          name: `${record.firstName} ${record.lastName}`,
          role: record.staffType,
          department: record.department || 'N/A',
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          workingHours: record.workingHours,
          status: record.status,
          isPresent: record.isPresent
        }));

        setAttendanceData(transformedData);
        setFilteredData(transformedData);
        setAttendanceStats({
          totalStaff: result.data.summary.totalStaff,
          present: result.data.summary.presentStaff,
          absent: result.data.summary.absentStaff,
          late: 0 // Not provided by API
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Fetch daily QR code for attendance
  const fetchDailyQR = async () => {
    setQrLoading(true);
    setQrError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/daily-qr`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch daily QR code');

      const result = await response.json();

      if (result.success) {
        setQrData(result.data);
      }
    } catch (error) {
      setQrError(error.message);
      console.error('Error fetching daily QR:', error);
    } finally {
      setQrLoading(false);
    }
  };

  // Refresh QR code
  const handleRefreshQR = () => {
    fetchDailyQR();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Always fetch data whenever selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceData(selectedDate);
    }
  }, [selectedDate]);

  // Fetch daily QR code on component mount
  useEffect(() => {
    fetchDailyQR();
  }, []);

  // Handle date selection
  const handleDateSelect = (date) => {
    if (date) {
      // Force re-fetch even if the same date is selected
      if (date.getTime() === selectedDate.getTime()) {
        fetchAttendanceData(date); // fetch again
      } else {
        setSelectedDate(date); // triggers useEffect
      }
    }
  };

  // Apply all filters
  useEffect(() => {
    let filtered = [...attendanceData];

    // Search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(record =>
        record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(record => record.department === filterDepartment);
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(record => record.role === filterRole);
    }

    // Status filter
    if (filterStatus !== 'all') {
      const statusMap = {
        'present': 'PRESENT',
        'absent': 'ABSENT',
        'late': 'LATE',
        'half_day': 'HALF_DAY',
        'leave': 'LEAVE',
        'holiday': 'HOLIDAY'
      };
      filtered = filtered.filter(record => record.status === statusMap[filterStatus]);
    }

    setFilteredData(filtered);
  }, [searchQuery, attendanceData, filterDepartment, filterRole, filterStatus]);

  // Mark individual attendance
  const handleMarkAttendance = async (staffId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          staffId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          status,
          checkInTime: status === 'PRESENT' ? new Date() : null
        })
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        // Show error dialog with the backend message
        setErrorTitle('Cannot Mark Attendance');
        setErrorMessage(result.message || 'This date is locked and cannot be edited');
        setShowErrorDialog(true);
        return;
      }

      if (result.success) {
        // Refresh data
        fetchAttendanceData(selectedDate);
      }
    } catch (error) {
      setErrorTitle('Error');
      setErrorMessage('Failed to mark attendance. Please try again.');
      setShowErrorDialog(true);
    }
  };

  // Mark all staff as on leave
  const handleMarkAllLeave = async () => {
    setConfirmMessage('Mark all staff as on leave for this date?');
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/attendance/mark-all-leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            date: format(selectedDate, 'yyyy-MM-dd')
          })
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
          setShowConfirmDialog(false);
          setErrorTitle('Cannot Mark Attendance');
          setErrorMessage(result.message || 'Failed to mark all staff as on leave');
          setShowErrorDialog(true);
          return;
        }

        if (result.success) {
          fetchAttendanceData(selectedDate);
          setShowConfirmDialog(false);
          setSuccessMessage('All staff marked as on leave successfully!');
          setShowSuccessDialog(true);
        }
      } catch (error) {
        setShowConfirmDialog(false);
        setErrorTitle('Error');
        setErrorMessage('Failed to mark all staff as on leave');
        setShowErrorDialog(true);
      } finally {
        setConfirmLoading(false);
      }
    });
    setShowConfirmDialog(true);
  };

  // Mark all staff as holiday
  const handleMarkAllHoliday = async () => {
    setConfirmMessage('Mark all staff as holiday for this date?');
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/attendance/mark-all-holiday`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            date: format(selectedDate, 'yyyy-MM-dd')
          })
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
          setShowConfirmDialog(false);
          setErrorTitle('Cannot Mark Attendance');
          setErrorMessage(result.message || 'Failed to mark all staff as holiday');
          setShowErrorDialog(true);
          return;
        }

        if (result.success) {
          fetchAttendanceData(selectedDate);
          setShowConfirmDialog(false);
          setSuccessMessage('All staff marked as holiday successfully!');
          setShowSuccessDialog(true);
        }
      } catch (error) {
        setShowConfirmDialog(false);
        setErrorTitle('Error');
        setErrorMessage('Failed to mark all staff as holiday');
        setShowErrorDialog(true);
      } finally {
        setConfirmLoading(false);
      }
    });
    setShowConfirmDialog(true);
  };

  // Mark all staff as present
  const handleMarkAllPresent = async () => {
    setConfirmMessage('Mark all staff as present for this date?');
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/attendance/mark-all-present`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            date: format(selectedDate, 'yyyy-MM-dd')
          })
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
          setShowConfirmDialog(false);
          setErrorTitle('Cannot Mark Attendance');
          setErrorMessage(result.message || 'Failed to mark all staff as present');
          setShowErrorDialog(true);
          return;
        }

        if (result.success) {
          fetchAttendanceData(selectedDate);
          setShowConfirmDialog(false);
          setSuccessMessage('All staff marked as present successfully!');
          setShowSuccessDialog(true);
        }
      } catch (error) {
        setShowConfirmDialog(false);
        setErrorTitle('Error');
        setErrorMessage('Failed to mark all staff as present');
        setShowErrorDialog(true);
      } finally {
        setConfirmLoading(false);
      }
    });
    setShowConfirmDialog(true);
  };

  // Update missing attendance (mark absent for staff with no status)
  const handleUpdateMissingAttendance = async () => {
    setConfirmMessage('This will mark all staff without attendance records as absent for the current month (and previous month if within cutoff period). Continue?');
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/attendance/update-missing-attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to update missing attendance');

        const result = await response.json();
        if (result.success) {
          fetchAttendanceData(selectedDate);
          setShowConfirmDialog(false);
          setSuccessMessage(`Updated ${result.data.totalMarked} missing attendance records as absent`);
          setShowSuccessDialog(true);
        }
      } catch (error) {
        setShowConfirmDialog(false);
        setErrorTitle('Error');
        setErrorMessage('Failed to update missing attendance');
        setShowErrorDialog(true);
      } finally {
        setConfirmLoading(false);
      }
    });
    setShowConfirmDialog(true);
  };

  // Helper function to get status initial
  const getStatusInitial = (status, checkInTime) => {
    // If no status (null/undefined), return empty string
    if (!status) {
      return '';
    }
    
    const statusMap = {
      'PRESENT': 'P',
      'ABSENT': 'A',
    'HALF_DAY': 'H-D',
    'HOLIDAY': 'H',
    'LEAVE': 'L',
    'LATE': 'P'
  };
  return statusMap[status] || '';
};

// Export filtered daily attendance as styled Excel
const handleExport = async () => {
  try {
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const displayDate = format(selectedDate, 'MMMM dd, yyyy');

    // Determine which data to export
    let dataToExport = filteredData;

    // If no filters are applied, use the full attendanceData (which includes all active staff)
    if (searchQuery.trim() === '' && filterDepartment === 'all' && filterRole === 'all' && filterStatus === 'all') {
      dataToExport = attendanceData;
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Daily Attendance');

    // Add title row with merged cells
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Daily Attendance Report - ${displayDate}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF21616A' } // Lighter Blue
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    worksheet.getRow(1).height = 30;

    // Add header row manually
    const headerRow = worksheet.getRow(2);
    headerRow.height = 19;
    headerRow.getCell(1).value = 'Name';
    headerRow.getCell(2).value = 'Role';
    headerRow.getCell(3).value = 'Department';
    headerRow.getCell(4).value = 'Check In';
    headerRow.getCell(5).value = 'Check Out';
    headerRow.getCell(6).value = 'Working Hours';
    headerRow.getCell(7).value = displayDate;

    // Set column widths
    worksheet.getColumn(1).width = 25;
    worksheet.getColumn(2).width = 20;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 25;

    // Style header row
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3A8C97' } // Medium Gray
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Add data rows
    dataToExport.forEach((row, index) => {
      const dataRow = worksheet.getRow(3 + index);
      dataRow.getCell(1).value = row.name;
      dataRow.getCell(2).value = row.role;
      dataRow.getCell(3).value = row.department || 'N/A';
      dataRow.getCell(4).value = row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--';
      dataRow.getCell(5).value = row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--';
      dataRow.getCell(6).value = row.workingHours ? `${row.workingHours}h` : '0h';
      dataRow.getCell(7).value = getStatusInitial(row.status, row.checkInTime);

      const newRow = dataRow;

      // Set row height
      newRow.height = 19;

      // Alternate row colors
      if (index % 2 === 0) {
        newRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF3FBE9' } // rows color 
          };
        });
      }

      // Add borders and center alignment
      newRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-daily-${formattedDate}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert('Failed to export attendance report');
  }
};

// Export monthly report with filters
const handleMonthlyExport = async () => {
  try {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const monthName = format(selectedDate, 'MMMM yyyy');

    // Fetch monthly attendance data
    const response = await fetch(`${API_BASE_URL}/attendance/monthly?year=${year}&month=${month}`, {
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to export monthly report');

    const result = await response.json();

    if (result.success) {
      // Transform monthly data and filter to only include dates in the target month
      const monthlyData = result.data.attendance
        .filter(record => {
          const recordDate = new Date(record.date);
          return recordDate.getMonth() + 1 === month && recordDate.getFullYear() === year;
        })
        .map(record => ({
          staffId: record.staffId,
          name: `${record.staff.firstName} ${record.staff.lastName}`,
          role: record.staff.staffType,
          department: record.staff.department || 'N/A',
          date: new Date(record.date),
          checkInTime: record.checkInTime,
          workingHours: record.workingHours || 0,
          status: record.status
        }));

      // Get unique staff from attendance data
      const staffMap = new Map();
      monthlyData.forEach(record => {
        if (!staffMap.has(record.staffId)) {
          staffMap.set(record.staffId, {
            id: record.staffId,
            name: record.name,
            role: record.role,
            department: record.department
          });
        }
      });
      let uniqueStaff = Array.from(staffMap.values());

      // Apply filters to staff list
      if (filterDepartment !== 'all') {
        uniqueStaff = uniqueStaff.filter(staff => staff.department === filterDepartment);
      }
      if (filterRole !== 'all') {
        uniqueStaff = uniqueStaff.filter(staff => staff.role === filterRole);
      }
      if (searchQuery.trim() !== '') {
        uniqueStaff = uniqueStaff.filter(staff =>
          staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          staff.department.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Filter dates to only include up to today (using local time to match database)
      const today = new Date();
      
      // Get the actual number of days in the target month
      const daysInMonth = new Date(year, month, 0).getDate();
      const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
      const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;
      
      console.log(`📊 Export dates: year=${year}, month=${month}, daysInMonth=${daysInMonth}, currentDay=${currentDay}, today=${today.toISOString()}`);
      
      // Generate dates array for the month (1 to currentDay) in local time
      const dates = [];
      for (let i = 1; i <= currentDay; i++) {
        // Create date in local time, then convert to YYYY-MM-DD format
        const d = new Date(year, month - 1, i);
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        dates.push(dateStr);
      }
      
      console.log(`📅 Generated dates:`, dates.slice(0, 5), '...', dates.slice(-3));

      // Create attendance matrix
      const attendanceMatrix = {};
      monthlyData.forEach(record => {
        // Use local date format to avoid timezone issues
        const d = new Date(record.date);
        const recordDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const key = `${record.staffId}_${recordDate}`;
        attendanceMatrix[key] = {
          status: getStatusInitial(record.status, record.checkInTime),
          workingHours: record.workingHours
        };
      });
      
      console.log(`📋 Attendance records count: ${monthlyData.length}`);

      // Create workbook
      const workbook = new ExcelJS.Workbook();

      // ===== SHEET 1: Attendance Details =====
      const worksheet = workbook.addWorksheet('Attendance');

      // Title row
      const titleColSpan = 4 + dates.length;
      worksheet.mergeCells(1, 1, 1, titleColSpan);
      const titleCell = worksheet.getCell(1, 1);
      titleCell.value = `Monthly Attendance Report - ${monthName}`;
      titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34D399' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      worksheet.getRow(1).height = 30;

      // Header row
      const headerRow = worksheet.getRow(2);
      headerRow.height = 23;
      headerRow.getCell(1).value = 'Name';
      headerRow.getCell(2).value = 'Role';
      headerRow.getCell(3).value = 'Department';
      headerRow.getCell(4).value = 'Avg Hrs';

      // Add date headers
      dates.forEach((date, index) => {
        const day = new Date(date).getDate();
        headerRow.getCell(5 + index).value = day;
      });

      // Style header row
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B7280' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      // Set column widths
      worksheet.getColumn(1).width = 25;
      worksheet.getColumn(2).width = 20;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 10;
      dates.forEach((_, index) => {
        worksheet.getColumn(5 + index).width = 5;
      });

      // Add data rows
      uniqueStaff.forEach((staff, staffIndex) => {
        const row = worksheet.getRow(3 + staffIndex);
        row.height = 19;
        row.getCell(1).value = staff.name;
        row.getCell(2).value = staff.role;
        row.getCell(3).value = staff.department;

        // Calculate average working hours
        let totalHours = 0;
        let workingDays = 0;
        dates.forEach((date, dateIndex) => {
          const key = `${staff.id}_${date}`;
          const attendance = attendanceMatrix[key];
          if (attendance && attendance.status) {
            row.getCell(5 + dateIndex).value = attendance.status;
            if (attendance.status === 'P' && attendance.workingHours > 0) {
              totalHours += attendance.workingHours;
              workingDays++;
            }
          } else {
            // Leave blank if no attendance record
            row.getCell(5 + dateIndex).value = '';
          }
        });

        const avgHours = workingDays > 0 ? (totalHours / workingDays).toFixed(1) : '0';
        row.getCell(4).value = avgHours;

        // Alternate row colors
        if (staffIndex % 2 === 0) {
          row.eachCell((cell) => {
            if (!cell.fill || !cell.fill.fgColor) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
            }
          });
        }

        // Style cells
        row.eachCell((cell) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      });

      // ===== SHEET 2: Summary =====
      const summarySheet = workbook.addWorksheet('Summary');

      // Title
      summarySheet.mergeCells('A1:G1');
      const summaryTitle = summarySheet.getCell('A1');
      summaryTitle.value = `Attendance Summary - ${monthName}`;
      summaryTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      summaryTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34D399' } };
      summaryTitle.alignment = { vertical: 'middle', horizontal: 'center' };
      summaryTitle.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      summarySheet.getRow(1).height = 30;

      // Set column widths
      summarySheet.getColumn(1).width = 25;
      summarySheet.getColumn(2).width = 20;
      summarySheet.getColumn(3).width = 15;
      summarySheet.getColumn(4).width = 15;
      summarySheet.getColumn(5).width = 15;
      summarySheet.getColumn(6).width = 15;
      summarySheet.getColumn(7).width = 15;

      // Add header row manually
      const summaryHeaderRow = summarySheet.getRow(2);
      summaryHeaderRow.height = 19;
      summaryHeaderRow.getCell(1).value = 'Employee Name';
      summaryHeaderRow.getCell(2).value = 'Department';
      summaryHeaderRow.getCell(3).value = 'Present Days';
      summaryHeaderRow.getCell(4).value = 'Half Days';
      summaryHeaderRow.getCell(5).value = 'Leaves';
      summaryHeaderRow.getCell(6).value = 'Holidays';
      summaryHeaderRow.getCell(7).value = 'Total Absent';

      // Style header row
      summaryHeaderRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000068' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      // Calculate summary for each staff
      uniqueStaff.forEach((staff, index) => {
        let present = 0, halfDays = 0, leaves = 0, holidays = 0, absent = 0;

        dates.forEach(date => {
          const key = `${staff.id}_${date}`;
          const attendance = attendanceMatrix[key];
          const status = attendance ? attendance.status : 'A';

          if (status === 'P') present++;
          else if (status === 'H-D') halfDays++;
          else if (status === 'L') leaves++;
          else if (status === 'H') holidays++;
          else if (status === 'A') absent++;
        });

        const summaryRow = summarySheet.getRow(3 + index);
        summaryRow.getCell(1).value = staff.name;
        summaryRow.getCell(2).value = staff.department;
        summaryRow.getCell(3).value = present;
        summaryRow.getCell(4).value = halfDays;
        summaryRow.getCell(5).value = leaves;
        summaryRow.getCell(6).value = holidays;
        summaryRow.getCell(7).value = absent;

        // Set row height
        summaryRow.height = 19;

        // Alternate row colors
        if (index % 2 === 0) {
          summaryRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
          });
        }

        // Style cells
        summaryRow.eachCell((cell) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      });

      // Generate filename
      let filename = `attendance-monthly-${year}-${String(month).padStart(2, '0')}`;
      if (filterDepartment !== 'all') filename += `-${filterDepartment}`;
      if (filterRole !== 'all') filename += `-${filterRole}`;
      filename += '.xlsx';

      // Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    alert('Failed to export monthly report');
  }
};

const getStatusBadge = (status, checkInTime) => {
  // If no status (null/undefined), show "No Entry"
  if (!status) {
    return (
      <Badge className="bg-gray-50 text-gray-400 border-gray-200">
        <span className="text-xs">No Entry</span>
      </Badge>
    );
  }
  
  const statusMap = {
    'PRESENT': 'Present',
    'ABSENT': 'Absent',
    'LATE': 'Late',
    'HALF_DAY': 'Half Day',
    'LEAVE': 'Leave',
    'HOLIDAY': 'Holiday'
  };

  const displayStatus = statusMap[status] || status;

  const variants = {
    "Present": { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", icon: CheckCircle },
    "Absent": { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", icon: XCircle },
    "Late": { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", icon: AlertCircle },
    "Half Day": { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", icon: Clock },
    "Leave": { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", icon: AlertCircle },
    "Holiday": { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", icon: Clock }
  };

  const variant = variants[displayStatus] || variants["Absent"];
  const IconComponent = variant.icon;

  return (
    <Badge className={`${variant.bg} ${variant.text} ${variant.border}`}>
      <IconComponent className="h-3 w-3 mr-1" />
      {displayStatus}
    </Badge>
  );
};

return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Staff Attendance</h2>
          <p className="text-gray-600 mt-1">Track and manage staff attendance records</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-3xl font-bold text-gray-900">{attendanceStats.totalStaff}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg shadow-sm">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-3xl font-bold text-green-600">{attendanceStats.present}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg shadow-sm">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-3xl font-bold text-red-600">{attendanceStats.absent}</p>
              </div>
              <div className="bg-red-500 p-3 rounded-lg shadow-sm">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Late</p>
                <p className="text-3xl font-bold text-yellow-600">{attendanceStats.late}</p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg shadow-sm">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily QR Code Section */}
      <Card className="shadow-sm border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-gray-900">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Daily Attendance QR Code</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshQR}
              disabled={qrLoading}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{qrLoading ? 'Generating...' : 'Refresh QR'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {qrLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Generating QR code...</span>
            </div>
          ) : qrError ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-600 mb-3">Failed to generate QR code</p>
                <Button onClick={handleRefreshQR} size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          ) : qrData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Code Display */}
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                  <img
                    src={qrData.qrCode}
                    alt="Daily Attendance QR Code"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold text-blue-600">{qrData.otp}</p>
                  <p className="text-sm text-gray-600">6-digit OTP for manual entry</p>
                </div>
              </div>

              {/* QR Instructions */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    For Staff Members
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <p className="text-sm text-blue-800">Open your mobile attendance app</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <p className="text-sm text-blue-800">Scan this QR code or enter the 6-digit OTP: <strong>{qrData.otp}</strong></p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <p className="text-sm text-blue-800">Make sure you're within 100 meters of hospital premises</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                        <p className="text-sm text-blue-800">Your attendance will be marked automatically</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Valid Today</span>
                    </div>
                    <p className="text-green-700 mt-1">{qrData.dateFormatted}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-orange-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Expires</span>
                    </div>
                    <p className="text-orange-700 mt-1">End of today</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium text-sm">Important Notes</span>
                  </div>
                  <ul className="text-yellow-700 text-xs space-y-1">
                    <li>• QR code is the same for all staff members</li>
                    <li>• Location verification is mandatory</li>
                    <li>• One attendance entry per staff per day</li>
                    <li>• Works only during valid hospital hours</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Button onClick={handleRefreshQR}>
                Generate Daily QR Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              {/* <span>Attendance - {format(selectedDate, "MMMM dd, yyyy")}</span> */}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[280px] justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-10 w-64"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="border rounded px-3 py-2 text-sm"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>

              <select
                className="border rounded px-3 py-2 text-sm"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role === 'all' ? 'All Roles' : role}
                  </option>
                ))}
              </select>

              <select
                className="border rounded px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="leave">Leave</option>
                <option value="holiday">Holiday</option>
              </select>

              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export Daily
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-4 p-4 bg-gray-50 rounded-lg font-semibold text-sm text-gray-700">
              <div>Staff Member</div>
              <div>Department</div>
              <div>Check In</div>
              <div>Check Out</div>
              <div>Working Hours</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading attendance data...</div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No attendance records found</div>
            ) : (
              <>
                {filteredData
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((record) => (
                    <div key={record.id} className="grid grid-cols-7 gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {record.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-gray-900">{record.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">{record.department}</div>
                      <div className="text-sm">
                        {record.checkInTime ? (
                          <span className="text-green-600 font-medium">
                            {new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-gray-400">--:--</span>
                        )}
                      </div>
                      <div className="text-sm">
                        {record.checkOutTime ? (
                          <span className="text-blue-600 font-medium">
                            {new Date(record.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-gray-400">--:--</span>
                        )}
                      </div>
                      <div className="text-sm font-medium">{record.workingHours ? `${record.workingHours}h` : '0h'}</div>
                      <div>{getStatusBadge(record.status, record.checkInTime)}</div>
                      <div>
                        {(!record.status || (!record.isPresent && record.status === 'ABSENT')) ? (
                          <select
                            className="border rounded px-2 py-1 text-xs w-full"
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleMarkAttendance(record.id, e.target.value);
                                e.target.value = ''; // Reset dropdown
                              }
                            }}
                          >
                            <option value="" disabled>Mark as...</option>
                            <option value="PRESENT">✓ Present</option>
                            <option value="HALF_DAY">🕐 Half Day</option>
                            <option value="LEAVE">📋 Leave</option>
                            <option value="HOLIDAY">🎉 Holiday</option>
                          </select>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">✓ Marked</span>
                        )}
                      </div>
                    </div>
                  ))}

                {/* Pagination */}
                {filteredData.length > itemsPerPage && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} staff members
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.ceil(filteredData.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredData.length / itemsPerPage), prev + 1))}
                        disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Button
              className="bg-green-600 hover:bg-green-700 h-12"
              onClick={handleMarkAllPresent}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All Present
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 h-12"
              onClick={handleMarkAllLeave}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Mark All Leave
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 h-12"
              onClick={handleMarkAllHoliday}
            >
              <Clock className="h-4 w-4 mr-2" />
              Mark All Holiday
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 h-12"
              onClick={handleUpdateMissingAttendance}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Update Attendance
            </Button>
            <Button
              variant="outline"
              className="h-12"
              onClick={handleMonthlyExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Monthly Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Confirmation Dialog */}
    <ConfirmationDialog
      open={showConfirmDialog}
      onOpenChange={setShowConfirmDialog}
      onConfirm={confirmAction}
      onCancel={() => setShowConfirmDialog(false)}
      title="Confirm Action"
      description={confirmMessage}
      confirmText="Confirm"
      cancelText="Cancel"
      variant="info"
      loading={confirmLoading}
      loadingText="Processing..."
    />

    {/* Success Dialog */}
    <ConfirmationDialog
      open={showSuccessDialog}
      onOpenChange={setShowSuccessDialog}
      onConfirm={() => setShowSuccessDialog(false)}
      title={successTitle}
      description={successMessage}
      confirmText="OK"
      variant="success"
      success={true}
      successTitle={successTitle}
      successMessage={successMessage}
      successButtonText="OK"
    />

    {/* Error Dialog */}
    <ConfirmationDialog
      open={showErrorDialog}
      onOpenChange={setShowErrorDialog}
      onConfirm={() => setShowErrorDialog(false)}
      title={errorTitle}
      description={errorMessage}
      confirmText="OK"
      variant="danger"
      error={true}
      errorTitle={errorTitle}
      errorMessage={errorMessage}
      errorButtonText="OK"
    />
    </div>
  );
};

export default StaffAttendance;