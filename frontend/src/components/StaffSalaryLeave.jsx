import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  IndianRupee, CalendarOff, Clock, FileText, CheckCircle, XCircle,
  Loader2, AlertTriangle, TrendingUp, TrendingDown, Send, Download,
  CalendarDays, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";
import { toast } from "sonner";
import salaryService from "@/services/salaryService";
import leaveService from "@/services/leaveService";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8080';

const statusColors = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const dayTypeConfig = {
  PRESENT:         { bg: "bg-green-50 border-green-200", text: "text-green-700", badge: "bg-green-500", label: "P", desc: "Present" },
  LATE:            { bg: "bg-orange-50 border-orange-200", text: "text-orange-700", badge: "bg-orange-500", label: "L", desc: "Late" },
  ABSENT:          { bg: "bg-red-50 border-red-200", text: "text-red-700", badge: "bg-red-500", label: "A", desc: "Absent" },
  LEAVE:           { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", badge: "bg-amber-500", label: "LV", desc: "Leave (Unpaid)" },
  PAID_LEAVE:      { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-500", label: "PL", desc: "Paid Leave" },
  HALF_DAY:        { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700", badge: "bg-yellow-500", label: "HD", desc: "Half Day" },
  SUNDAY:          { bg: "bg-blue-50 border-blue-200", text: "text-blue-500", badge: "bg-blue-400", label: "S", desc: "Sunday" },
  HOLIDAY:         { bg: "bg-blue-50 border-blue-200", text: "text-blue-600", badge: "bg-blue-500", label: "H", desc: "Holiday" },
  SPECIAL_HOLIDAY: { bg: "bg-purple-50 border-purple-200", text: "text-purple-600", badge: "bg-purple-500", label: "SH", desc: "Special Holiday" },
  FUTURE:          { bg: "bg-gray-50 border-gray-100", text: "text-gray-400", badge: "bg-gray-300", label: "—", desc: "Upcoming" },
};

const formatTime = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const formatMinutes = (mins) => {
  if (!mins) return null;
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
};

// ==================== CALENDAR ATTENDANCE TAB ====================
const CalendarAttendanceSection = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: calData, isLoading } = useQuery({
    queryKey: ["myCalendarAttendance", month, year],
    queryFn: () => salaryService.getMyCalendarAttendance(month, year),
  });

  const calendar = calData?.data;
  const days = calendar?.days || [];
  const summary = calendar?.summary || {};

  const goToPrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goToNext = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayMap = {};
  days.forEach(d => { dayMap[d.day] = d; });

  const weeks = [];
  let currentWeek = new Array(firstDayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goToPrev}><ChevronLeft className="h-4 w-4" /></Button>
        <h3 className="text-lg font-bold">{months[month - 1]} {year}</h3>
        <Button variant="outline" size="sm" onClick={goToNext}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Shift info */}
      {calendar?.shiftConfig && (
        <div className="flex gap-4 text-xs text-gray-500 justify-center">
          <span>Shift: {calendar.shiftConfig.shiftStartTime} — {calendar.shiftConfig.shiftEndTime}</span>
          <span>Grace: {calendar.shiftConfig.graceMinutes} min</span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
        {[
          { label: "Present", value: summary.present, color: "text-green-600 bg-green-50" },
          { label: "Late", value: summary.late, color: "text-orange-600 bg-orange-50" },
          { label: "Absent", value: summary.absent, color: "text-red-600 bg-red-50" },
          { label: "Leave", value: summary.leave, color: "text-amber-600 bg-amber-50" },
          { label: "Paid Leave", value: summary.paidLeave, color: "text-emerald-600 bg-emerald-50" },
          { label: "Holiday", value: summary.holiday, color: "text-blue-600 bg-blue-50" },
          { label: "Half Day", value: summary.halfDay, color: "text-yellow-600 bg-yellow-50" },
        ].map((s) => (
          <div key={s.label} className={`p-2 rounded text-center ${s.color}`}>
            <p className="text-xs">{s.label}</p>
            <p className="text-lg font-bold">{s.value || 0}</p>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-2 md:p-4">
          <div className="grid grid-cols-7 gap-1">
            {/* Header */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">{d}</div>
            ))}
            {/* Days */}
            {weeks.map((week, wi) => (
              week.map((dayNum, di) => {
                if (dayNum === null) return <div key={`empty-${wi}-${di}`} className="h-16 md:h-20" />;
                const dayInfo = dayMap[dayNum] || { type: "FUTURE" };
                const cfg = dayTypeConfig[dayInfo.type] || dayTypeConfig.FUTURE;
                return (
                  <div
                    key={dayNum}
                    onClick={() => setSelectedDay(dayInfo)}
                    className={`h-16 md:h-20 rounded border p-1 cursor-pointer transition-all hover:shadow-md ${cfg.bg}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold">{dayNum}</span>
                      <span className={`text-[9px] font-bold px-1 rounded text-white ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                    {dayInfo.type === "LATE" && dayInfo.lateMinutes && (
                      <p className="text-[9px] text-orange-600 mt-0.5">{formatMinutes(dayInfo.lateMinutes)} late</p>
                    )}
                    {dayInfo.type === "LATE" && dayInfo.isLateApproved && (
                      <p className="text-[8px] text-green-600">Approved</p>
                    )}
                    {dayInfo.extraMinutes > 0 && (
                      <p className="text-[9px] text-green-600">+{formatMinutes(dayInfo.extraMinutes)}</p>
                    )}
                    {dayInfo.type === "SPECIAL_HOLIDAY" && (
                      <p className="text-[8px] text-purple-600 truncate">{dayInfo.holidayName}</p>
                    )}
                    {dayInfo.checkIn && (
                      <p className="text-[8px] text-gray-500 hidden md:block">{formatTime(dayInfo.checkIn)}</p>
                    )}
                  </div>
                );
              })
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {Object.entries(dayTypeConfig).filter(([k]) => k !== "FUTURE").map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1 text-xs">
                <div className={`w-3 h-3 rounded ${cfg.badge}`} />
                <span className="text-gray-600">{cfg.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leave requests for the month */}
      {calendar?.leaveRequests?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Leave Requests This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {calendar.leaveRequests.map((lr) => (
              <div key={lr.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <div>
                  <span className="font-medium">{new Date(lr.startDate).toLocaleDateString()} — {new Date(lr.endDate).toLocaleDateString()}</span>
                  <span className="text-gray-500 ml-2">({lr.totalDays} day{lr.totalDays > 1 ? "s" : ""})</span>
                  <span className="text-gray-400 ml-2">{lr.reason}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[lr.status]}>{lr.status}</Badge>
                  {lr.status === "APPROVED" && (
                    <Badge className={lr.isPaidLeave ? "bg-emerald-50 text-emerald-700 text-[10px]" : "bg-amber-50 text-amber-700 text-[10px]"}>
                      {lr.isPaidLeave ? "Paid" : "Unpaid"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Day detail dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && `${selectedDay.dayName}, ${months[month - 1]} ${selectedDay.day}, ${year}`}
            </DialogTitle>
          </DialogHeader>
          {selectedDay && (() => {
            const cfg = dayTypeConfig[selectedDay.type] || dayTypeConfig.FUTURE;
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={`${cfg.badge} text-white`}>{cfg.label}</Badge>
                  <span className="font-medium">{cfg.desc}</span>
                </div>
                {selectedDay.checkIn && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-500">Check In</p>
                      <p className="font-semibold">{formatTime(selectedDay.checkIn)}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-xs text-gray-500">Check Out</p>
                      <p className="font-semibold">{formatTime(selectedDay.checkOut)}</p>
                    </div>
                  </div>
                )}
                {selectedDay.workingHours && (
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-xs text-gray-500">Working Hours</p>
                    <p className="font-semibold">{selectedDay.workingHours?.toFixed(1)}h</p>
                  </div>
                )}
                {selectedDay.lateMinutes > 0 && (
                  <div className="bg-orange-50 rounded p-3">
                    <p className="text-xs text-gray-500">Late By</p>
                    <p className="font-semibold text-orange-600">{formatMinutes(selectedDay.lateMinutes)}</p>
                    {selectedDay.isLateApproved && <Badge className="bg-green-100 text-green-800 mt-1 text-xs">Approved - No penalty</Badge>}
                    {selectedDay.lateApprovalStatus === "PENDING" && <Badge className="bg-amber-100 text-amber-800 mt-1 text-xs">Approval Pending</Badge>}
                    {selectedDay.lateApprovalStatus === "REJECTED" && <Badge className="bg-red-100 text-red-800 mt-1 text-xs">Approval Rejected</Badge>}
                  </div>
                )}
                {selectedDay.extraMinutes > 0 && (
                  <div className="bg-green-50 rounded p-3">
                    <p className="text-xs text-gray-500">Extra Time Worked</p>
                    <p className="font-semibold text-green-600">{formatMinutes(selectedDay.extraMinutes)}</p>
                  </div>
                )}
                {selectedDay.holidayName && (
                  <div className="bg-purple-50 rounded p-3">
                    <p className="text-xs text-gray-500">Holiday</p>
                    <p className="font-semibold text-purple-600">{selectedDay.holidayName}</p>
                  </div>
                )}
                {selectedDay.adminEdited && (
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">Time was edited by admin</p>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ==================== SALARY SUMMARY SUB-TAB ====================
const SalarySummarySection = () => {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ["mySalarySummary"],
    queryFn: () => salaryService.getMySalarySummary(),
  });

  const summary = summaryData?.data;

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (!summary || summary.message === "Salary not configured yet") {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
          <IndianRupee className="h-12 w-12 mb-3 text-gray-300" />
          <p className="text-lg font-medium">Salary Not Configured</p>
          <p className="text-sm">Your salary has not been set up yet. Please contact the admin.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Base Salary</p>
          <p className="text-xl font-bold text-blue-600">₹{summary.baseSalary?.toLocaleString("en-IN")}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Deductions</p>
          <p className="text-xl font-bold text-red-600 flex items-center gap-1">
            <TrendingDown className="h-4 w-4" />₹{summary.totalDeductions?.toLocaleString("en-IN")}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Extra Hours Pay</p>
          <p className="text-xl font-bold text-green-600 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />₹{summary.totalAdditions?.toLocaleString("en-IN")}
          </p>
        </Card>
        <Card className="p-4 bg-purple-50">
          <p className="text-xs text-gray-500">Est. Net Salary</p>
          <p className="text-xl font-bold text-purple-700">₹{summary.netSalary?.toLocaleString("en-IN")}</p>
        </Card>
      </div>

      {/* Attendance Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {months[summary.month - 1]} {summary.year} — Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div className="text-center p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Working Days</p>
              <p className="text-lg font-bold">{summary.totalWorkingDays}</p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <p className="text-xs text-gray-500">Present</p>
              <p className="text-lg font-bold text-green-600">{summary.daysPresent}</p>
            </div>
            <div className="text-center p-2 bg-red-50 rounded">
              <p className="text-xs text-gray-500">Absent</p>
              <p className="text-lg font-bold text-red-600">{summary.daysAbsent}</p>
            </div>
            <div className="text-center p-2 bg-amber-50 rounded">
              <p className="text-xs text-gray-500">On Leave</p>
              <p className="text-lg font-bold text-amber-600">{summary.daysOnLeave}</p>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded">
              <p className="text-xs text-gray-500">Late</p>
              <p className="text-lg font-bold text-orange-600">{summary.daysLate}</p>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded">
              <p className="text-xs text-gray-500">Holidays</p>
              <p className="text-lg font-bold text-blue-600">{summary.daysHoliday}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deduction Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Deduction Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Leave Deduction</TableCell>
                <TableCell className="text-right text-red-600">-₹{summary.leaveDeduction?.toLocaleString("en-IN")}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Absent Deduction</TableCell>
                <TableCell className="text-right text-red-600">-₹{summary.absentDeduction?.toLocaleString("en-IN")}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Late Penalty</TableCell>
                <TableCell className="text-right text-red-600">-₹{summary.lateDeduction?.toLocaleString("en-IN")}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-green-600">Extra Hours ({summary.extraHoursWorked}h)</TableCell>
                <TableCell className="text-right text-green-600">+₹{summary.extraHoursPay?.toLocaleString("en-IN")}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-day rates */}
      {summary.rates && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <p className="text-xs text-gray-500">Per Day</p>
            <p className="text-sm font-semibold">₹{summary.rates.perDayRate?.toLocaleString("en-IN")}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-gray-500">Per Hour</p>
            <p className="text-sm font-semibold">₹{summary.rates.perHourRate?.toLocaleString("en-IN")}</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-xs text-gray-500">Per Minute</p>
            <p className="text-sm font-semibold">₹{summary.rates.perMinuteRate?.toLocaleString("en-IN")}</p>
          </Card>
        </div>
      )}
    </div>
  );
};

// ==================== PAYSLIPS SUB-TAB ====================
const PayslipsSection = () => {
  const [detailDialog, setDetailDialog] = useState({ open: false, payslip: null });

  const { data: payslipsData, isLoading } = useQuery({
    queryKey: ["myPayslips"],
    queryFn: () => salaryService.getMyPayslips(),
  });

  const payslips = payslipsData?.data || [];

  const handleDownloadPdf = (e, p) => {
    e.stopPropagation();
    if (p.pdfUrl) {
      window.open(`${API_BASE}${p.pdfUrl}`, '_blank');
    } else {
      toast.error("PDF not available yet. Payslip needs to be finalized by admin.");
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <>
      {payslips.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mb-3 text-gray-300" />
            <p className="text-lg font-medium">No Payslips Yet</p>
            <p className="text-sm">Your payslips will appear here once generated by admin.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payslips.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div className="cursor-pointer flex-1" onClick={() => setDetailDialog({ open: true, payslip: p })}>
                  <p className="font-semibold">{months[p.month - 1]} {p.year}</p>
                  <p className="text-sm text-gray-500">
                    {p.daysPresent} present · {p.daysAbsent} absent · {p.daysOnLeave} leave · {p.daysLate} late
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-700">₹{p.netSalary?.toLocaleString("en-IN")}</p>
                    <Badge variant={p.status === "FINALIZED" ? "default" : "secondary"} className="text-xs">{p.status}</Badge>
                  </div>
                  {p.status === "FINALIZED" && p.pdfUrl && (
                    <Button size="sm" variant="outline" onClick={(e) => handleDownloadPdf(e, p)} title="Download PDF">
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payslip Detail */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => !open && setDetailDialog({ open: false, payslip: null })}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Payslip — {detailDialog.payslip && `${months[detailDialog.payslip.month - 1]} ${detailDialog.payslip.year}`}</span>
              {detailDialog.payslip?.status === "FINALIZED" && detailDialog.payslip?.pdfUrl && (
                <Button size="sm" variant="outline" onClick={(e) => handleDownloadPdf(e, detailDialog.payslip)}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailDialog.payslip && (
            <div className="space-y-4">
              {/* Attendance summary */}
              <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                {[
                  { label: "Working", value: detailDialog.payslip.totalWorkingDays, color: "bg-gray-50" },
                  { label: "Present", value: detailDialog.payslip.daysPresent, color: "bg-green-50 text-green-600" },
                  { label: "Absent", value: detailDialog.payslip.daysAbsent, color: "bg-red-50 text-red-600" },
                  { label: "Leave", value: detailDialog.payslip.daysOnLeave, color: "bg-amber-50 text-amber-600" },
                  { label: "Paid Leave", value: detailDialog.payslip.daysOnPaidLeave || 0, color: "bg-emerald-50 text-emerald-600" },
                  { label: "Late", value: detailDialog.payslip.daysLate, color: "bg-orange-50 text-orange-600" },
                  { label: "Holiday", value: detailDialog.payslip.daysHoliday, color: "bg-blue-50 text-blue-600" },
                ].map((s) => (
                  <div key={s.label} className={`rounded p-2 text-center ${s.color}`}>
                    <p className="text-[10px]">{s.label}</p>
                    <p className="text-sm font-bold">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Salary table */}
              <Table>
                <TableBody>
                  <TableRow><TableCell>Base Salary</TableCell><TableCell className="text-right font-medium">₹{detailDialog.payslip.baseSalary?.toLocaleString("en-IN")}</TableCell></TableRow>
                  <TableRow><TableCell className="text-red-600">Leave Deduction ({detailDialog.payslip.daysOnLeave - (detailDialog.payslip.daysOnPaidLeave || 0)} unpaid days)</TableCell><TableCell className="text-right text-red-600">-₹{detailDialog.payslip.leaveDeduction?.toLocaleString("en-IN")}</TableCell></TableRow>
                  <TableRow><TableCell className="text-red-600">Absent Deduction ({detailDialog.payslip.daysAbsent} days)</TableCell><TableCell className="text-right text-red-600">-₹{detailDialog.payslip.absentDeduction?.toLocaleString("en-IN")}</TableCell></TableRow>
                  <TableRow><TableCell className="text-red-600">Late Penalty ({detailDialog.payslip.daysLate} days)</TableCell><TableCell className="text-right text-red-600">-₹{detailDialog.payslip.lateDeduction?.toLocaleString("en-IN")}</TableCell></TableRow>
                  <TableRow><TableCell className="text-green-600">Extra Hours Pay ({detailDialog.payslip.extraHoursWorked}h)</TableCell><TableCell className="text-right text-green-600">+₹{detailDialog.payslip.extraHoursPay?.toLocaleString("en-IN")}</TableCell></TableRow>
                  <TableRow className="border-t-2">
                    <TableCell className="font-bold text-lg">Net Salary</TableCell>
                    <TableCell className="text-right font-bold text-lg text-purple-700">₹{detailDialog.payslip.netSalary?.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Day-by-day details from calculationDetails */}
              {detailDialog.payslip.calculationDetails?.dayDetails && (
                <div>
                  <p className="text-sm font-semibold mb-2">Day-by-Day Breakdown</p>
                  <div className="max-h-60 overflow-y-auto rounded border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Day</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs text-right">Late</TableHead>
                          <TableHead className="text-xs text-right">Extra</TableHead>
                          <TableHead className="text-xs text-right">Deduction</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailDialog.payslip.calculationDetails.dayDetails.map((d) => {
                          const cfg = dayTypeConfig[d.type] || dayTypeConfig.FUTURE;
                          return (
                            <TableRow key={d.day} className="text-xs">
                              <TableCell className="py-1">{d.day}</TableCell>
                              <TableCell className="py-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold text-white ${cfg.badge}`}>{cfg.label}</span>
                              </TableCell>
                              <TableCell className="py-1 text-right text-orange-600">{d.lateMinutes ? formatMinutes(d.lateMinutes) : ""}{d.lateApproved ? " ✓" : ""}</TableCell>
                              <TableCell className="py-1 text-right text-green-600">{d.extraMinutes ? `+${formatMinutes(d.extraMinutes)}` : ""}</TableCell>
                              <TableCell className="py-1 text-right text-red-600">{d.deduction > 0 ? `-₹${Math.round(d.deduction)}` : ""}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// ==================== LEAVE REQUESTS SUB-TAB ====================
const LeaveRequestsSection = () => {
  const queryClient = useQueryClient();
  const [createDialog, setCreateDialog] = useState(false);
  const [form, setForm] = useState({ startDate: "", endDate: "", reason: "" });

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["myLeaveRequests"],
    queryFn: () => leaveService.getMyLeaveRequests(),
  });

  const submitMutation = useMutation({
    mutationFn: (data) => leaveService.submitLeaveRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLeaveRequests"] });
      toast.success("Leave request submitted");
      setCreateDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => leaveService.cancelLeaveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLeaveRequests"] });
      toast.success("Leave request cancelled");
    },
    onError: (err) => toast.error(err.message),
  });

  const requests = requestsData?.data || [];

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">My Leave Requests</h3>
          <Button size="sm" onClick={() => { setForm({ startDate: "", endDate: "", reason: "" }); setCreateDialog(true); }}>
            <CalendarOff className="h-4 w-4 mr-1" /> Request Leave
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : requests.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-8 text-gray-500">
              <CalendarOff className="h-10 w-10 mb-2 text-gray-300" />
              <p className="text-sm">No leave requests yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">
                      {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">{req.totalDays} day(s) · {req.reason}</p>
                    {req.reviewNote && <p className="text-xs text-gray-400 mt-1">Admin note: {req.reviewNote}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[req.status]}>{req.status}</Badge>
                    {req.status === "APPROVED" && (
                      <Badge className={req.isPaidLeave ? "bg-emerald-50 text-emerald-700 text-[10px]" : "bg-amber-50 text-amber-700 text-[10px]"}>
                        {req.isPaidLeave ? "Paid" : "Unpaid"}
                      </Badge>
                    )}
                    {req.status === "PENDING" && (
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => cancelMutation.mutate(req.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Leave Request Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea placeholder="Why do you need leave?" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Note: Admin will decide whether leave is paid or unpaid when reviewing your request.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={() => submitMutation.mutate(form)} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ==================== LATE APPROVALS SUB-TAB ====================
const LateApprovalsSection = () => {
  const queryClient = useQueryClient();
  const [createDialog, setCreateDialog] = useState(false);
  const [form, setForm] = useState({ date: "", reason: "" });

  const { data: approvalsData, isLoading } = useQuery({
    queryKey: ["myLateApprovals"],
    queryFn: () => leaveService.getMyLateApprovals(),
  });

  const submitMutation = useMutation({
    mutationFn: (data) => leaveService.submitLateApproval(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLateApprovals"] });
      toast.success("Late approval request submitted");
      setCreateDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const approvals = approvalsData?.data || [];

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">My Late Approvals</h3>
          <Button size="sm" onClick={() => { setForm({ date: "", reason: "" }); setCreateDialog(true); }}>
            <Clock className="h-4 w-4 mr-1" /> Request Approval
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : approvals.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Clock className="h-10 w-10 mb-2 text-gray-300" />
              <p className="text-sm">No late approval requests yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {approvals.map((a) => (
              <Card key={a.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{new Date(a.date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">Late by {a.lateMinutes >= 60 ? `${Math.floor(a.lateMinutes / 60)}h ${a.lateMinutes % 60}m` : `${a.lateMinutes} min`} · {a.reason}</p>
                    {a.reviewNote && <p className="text-xs text-gray-400 mt-1">Admin note: {a.reviewNote}</p>}
                  </div>
                  <Badge className={statusColors[a.status]}>{a.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Late Approval Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Late Approval</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date (when you were late)</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea placeholder="Why were you late?" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
              If approved, the late penalty for that day will be waived in salary calculation.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={() => submitMutation.mutate(form)} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ==================== MAIN COMPONENT ====================
const StaffSalaryLeave = ({ staffType }) => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Salary & Leave</h2>
        <p className="text-gray-600 mt-1">View your salary, attendance calendar, payslips, and manage leave requests</p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 bg-white p-1 rounded-lg shadow-sm border">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <CalendarDays className="w-4 h-4 mr-1" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="salary" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <IndianRupee className="w-4 h-4 mr-1" /> Salary
          </TabsTrigger>
          <TabsTrigger value="payslips" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-1" /> Payslips
          </TabsTrigger>
          <TabsTrigger value="leave" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <CalendarOff className="w-4 h-4 mr-1" /> Leave
          </TabsTrigger>
          <TabsTrigger value="late" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-1" /> Late
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar"><CalendarAttendanceSection /></TabsContent>
        <TabsContent value="salary"><SalarySummarySection /></TabsContent>
        <TabsContent value="payslips"><PayslipsSection /></TabsContent>
        <TabsContent value="leave"><LeaveRequestsSection /></TabsContent>
        <TabsContent value="late"><LateApprovalsSection /></TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffSalaryLeave;
