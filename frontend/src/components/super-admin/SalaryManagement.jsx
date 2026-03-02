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
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Clock, DollarSign, Calendar, FileText, Edit, Trash2, Plus,
  Users, Download, CheckCircle, AlertCircle, Loader2, RefreshCw,
  IndianRupee, X, CalendarDays
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import salaryService from "@/services/salaryService";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8080';

const months = [
  { value: 1, label: "January" }, { value: 2, label: "February" },
  { value: 3, label: "March" }, { value: 4, label: "April" },
  { value: 5, label: "May" }, { value: 6, label: "June" },
  { value: 7, label: "July" }, { value: 8, label: "August" },
  { value: 9, label: "September" }, { value: 10, label: "October" },
  { value: 11, label: "November" }, { value: 12, label: "December" },
];

// ==================== SHIFT CONFIG TAB ====================
const ShiftConfigTab = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const { data: configData, isLoading } = useQuery({
    queryKey: ["shiftConfig"],
    queryFn: () => salaryService.getShiftConfig(),
  });
  const config = configData?.data;

  const mutation = useMutation({
    mutationFn: (data) => salaryService.updateShiftConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftConfig"] });
      toast.success("Shift config updated");
      setEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleEdit = () => {
    setForm({
      shiftStartTime: config?.shiftStartTime || "09:00",
      shiftEndTime: config?.shiftEndTime || "18:00",
      graceMinutes: config?.graceMinutes ?? 15,
      latePenaltyMultiplier: config?.latePenaltyMultiplier ?? 2.0,
    });
    setEditing(true);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Shift & Timing Configuration</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Configure shift timings, grace period, and late penalty</p>
          </div>
          {!editing && <Button onClick={handleEdit} size="sm"><Edit className="h-4 w-4 mr-1" /> Edit</Button>}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {!editing ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Shift Start</p>
              <p className="text-2xl font-bold text-blue-700">{config?.shiftStartTime || "09:00"}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Shift End</p>
              <p className="text-2xl font-bold text-green-700">{config?.shiftEndTime || "18:00"}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Grace Period</p>
              <p className="text-2xl font-bold text-amber-700">{config?.graceMinutes ?? 15} min</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <DollarSign className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Late Penalty</p>
              <p className="text-2xl font-bold text-red-700">{config?.latePenaltyMultiplier ?? 2}x</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Shift Start Time</Label>
                <Input type="time" value={form.shiftStartTime} onChange={(e) => setForm({ ...form, shiftStartTime: e.target.value })} />
              </div>
              <div>
                <Label>Shift End Time</Label>
                <Input type="time" value={form.shiftEndTime} onChange={(e) => setForm({ ...form, shiftEndTime: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Grace Period (minutes)</Label>
                <Input type="number" value={form.graceMinutes} onChange={(e) => setForm({ ...form, graceMinutes: parseInt(e.target.value) })} />
              </div>
              <div>
                <Label>Late Penalty Multiplier</Label>
                <Input type="number" step="0.5" value={form.latePenaltyMultiplier} onChange={(e) => setForm({ ...form, latePenaltyMultiplier: parseFloat(e.target.value) })} />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Example: If late by 30 min with 2x multiplier, deduction = 30 × 2 = 60 minutes of salary
            </p>
            <div className="flex gap-2">
              <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />} Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== STAFF SALARIES TAB ====================
const StaffSalariesTab = () => {
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState({ open: false, staff: null });
  const [salaryForm, setSalaryForm] = useState({ monthlySalary: "", reason: "" });
  const [historyDialog, setHistoryDialog] = useState({ open: false, staffId: null });
  const [search, setSearch] = useState("");

  const { data: staffData, isLoading } = useQuery({
    queryKey: ["staffSalaries"],
    queryFn: () => salaryService.getAllStaffSalaries(),
  });

  const { data: historyData } = useQuery({
    queryKey: ["salaryHistory", historyDialog.staffId],
    queryFn: () => salaryService.getStaffSalaryHistory(historyDialog.staffId),
    enabled: !!historyDialog.staffId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ staffId, data }) => salaryService.updateStaffSalary(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffSalaries"] });
      toast.success("Salary updated");
      setEditDialog({ open: false, staff: null });
    },
    onError: (err) => toast.error(err.message),
  });

  const staffList = (staffData?.data || []).filter(
    (s) => !search || `${s.firstName} ${s.lastName} ${s.employeeId}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Staff Salaries</CardTitle>
              <p className="text-sm text-gray-500 mt-1">View and manage monthly salaries for all staff</p>
            </div>
            <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Monthly Salary</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No staff found</TableCell></TableRow>
                ) : (
                  staffList.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-mono text-sm">{staff.employeeId}</TableCell>
                      <TableCell className="font-medium">{staff.firstName} {staff.lastName}</TableCell>
                      <TableCell><Badge variant="outline">{staff.staffType}</Badge></TableCell>
                      <TableCell>{staff.department || "—"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {staff.monthlySalary ? `₹${staff.monthlySalary.toLocaleString("en-IN")}` : <span className="text-gray-400">Not set</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="outline" onClick={() => { setEditDialog({ open: true, staff }); setSalaryForm({ monthlySalary: staff.monthlySalary || "", reason: "" }); }}>
                            <Edit className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setHistoryDialog({ open: true, staffId: staff.id })}>
                            <FileText className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Salary Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, staff: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Salary — {editDialog.staff?.firstName} {editDialog.staff?.lastName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Monthly Salary (₹)</Label>
              <Input type="number" placeholder="Enter monthly salary" value={salaryForm.monthlySalary}
                onChange={(e) => setSalaryForm({ ...salaryForm, monthlySalary: e.target.value })} />
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea placeholder="Reason for salary change..." value={salaryForm.reason}
                onChange={(e) => setSalaryForm({ ...salaryForm, reason: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, staff: null })}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ staffId: editDialog.staff.id, data: salaryForm })} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null} Update Salary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary History Dialog */}
      <Dialog open={historyDialog.open} onOpenChange={(open) => !open && setHistoryDialog({ open: false, staffId: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Salary History — {historyData?.data?.staff?.firstName} {historyData?.data?.staff?.lastName}</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {historyData?.data?.history?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Previous</TableHead>
                    <TableHead>New</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.data.history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="text-sm">{new Date(h.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{h.previousSalary ? `₹${h.previousSalary.toLocaleString("en-IN")}` : "—"}</TableCell>
                      <TableCell className="font-semibold">₹{h.newSalary?.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-sm text-gray-500">{h.reason || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-4">No salary history found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ==================== HOLIDAY QUOTA TAB ====================
const HolidayQuotaTab = () => {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [createDialog, setCreateDialog] = useState(false);
  const [allocateDialog, setAllocateDialog] = useState({ open: false, quota: null });
  const [quotaForm, setQuotaForm] = useState({ name: "", description: "", month: 1, year: currentYear, allowedDays: 1 });
  const [allocateForm, setAllocateForm] = useState({ staffId: "", selectedDates: [] });

  const { data: quotasData, isLoading } = useQuery({
    queryKey: ["holidayQuotas", year],
    queryFn: () => salaryService.getSpecialHolidayQuotas({ year }),
  });

  const { data: staffData } = useQuery({
    queryKey: ["staffSalaries"],
    queryFn: () => salaryService.getAllStaffSalaries(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => salaryService.createSpecialHolidayQuota(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidayQuotas"] });
      toast.success("Holiday quota created");
      setCreateDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => salaryService.deleteSpecialHolidayQuota(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidayQuotas"] });
      toast.success("Holiday quota deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const allocateMutation = useMutation({
    mutationFn: ({ quotaId, data }) => salaryService.allocateSpecialHoliday(quotaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidayQuotas"] });
      toast.success("Holiday allocated");
      setAllocateDialog({ open: false, quota: null });
    },
    onError: (err) => toast.error(err.message),
  });

  const removeAllocMutation = useMutation({
    mutationFn: (id) => salaryService.removeHolidayAllocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidayQuotas"] });
      toast.success("Allocation removed");
    },
    onError: (err) => toast.error(err.message),
  });

  const quotas = quotasData?.data || [];

  return (
    <>
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Special Holiday Quotas</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Create holiday quotas (e.g., Diwali 2 days) and allocate to staff</p>
            </div>
            <div className="flex gap-2">
              <Select value={String(year)} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => { setQuotaForm({ name: "", description: "", month: new Date().getMonth() + 1, year, allowedDays: 1 }); setCreateDialog(true); }}>
                <Plus className="h-4 w-4 mr-1" /> New Quota
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : quotas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No holiday quotas for {year}</p>
          ) : (
            <div className="space-y-4">
              {quotas.map((quota) => (
                <Card key={quota.id} className="border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{quota.name}</CardTitle>
                        <p className="text-sm text-gray-500">{months.find((m) => m.value === quota.month)?.label} {quota.year} — {quota.allowedDays} day(s) allowed</p>
                        {quota.description && <p className="text-sm text-gray-400 mt-1">{quota.description}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => { setAllocateForm({ staffId: "", selectedDates: [] }); setAllocateDialog({ open: true, quota }); }}>
                          <Plus className="h-3 w-3 mr-1" /> Allocate
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { if (window.confirm("Delete this quota?")) deleteMutation.mutate(quota.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {quota.allocations?.length > 0 && (
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Staff</TableHead>
                            <TableHead>Employee ID</TableHead>
                            <TableHead>Dates ({quota.allowedDays} day quota)</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.values(
                            quota.allocations.reduce((grouped, alloc) => {
                              const sid = alloc.staff?.id || alloc.staffId;
                              if (!grouped[sid]) grouped[sid] = { staff: alloc.staff, entries: [] };
                              grouped[sid].entries.push(alloc);
                              return grouped;
                            }, {})
                          ).map((group) => (
                            <TableRow key={group.staff?.id}>
                              <TableCell className="font-medium">{group.staff?.firstName} {group.staff?.lastName}</TableCell>
                              <TableCell className="font-mono text-sm">{group.staff?.employeeId}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {group.entries
                                    .sort((a, b) => new Date(a.holidayDate) - new Date(b.holidayDate))
                                    .map((alloc) => (
                                      <Badge key={alloc.id} variant="secondary" className="gap-1 pr-1 text-xs">
                                        {new Date(alloc.holidayDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        <button type="button" className="ml-0.5 rounded-full hover:bg-gray-300 p-0.5" onClick={() => removeAllocMutation.mutate(alloc.id)}>
                                          <X className="h-3 w-3" />
                                        </button>
                                      </Badge>
                                    ))}
                                </div>
                                <span className="text-xs text-gray-400 mt-0.5 block">{group.entries.length} / {quota.allowedDays} days used</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button size="sm" variant="ghost" className="text-red-500 h-7" onClick={() => {
                                  if (window.confirm(`Remove all ${group.entries.length} allocation(s) for ${group.staff?.firstName}?`)) {
                                    group.entries.forEach((alloc) => removeAllocMutation.mutate(alloc.id));
                                  }
                                }}>
                                  <Trash2 className="h-3 w-3 mr-1" /> Remove All
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Quota Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Holiday Quota</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Holiday Name</Label>
              <Input placeholder="e.g., Diwali" value={quotaForm.name} onChange={(e) => setQuotaForm({ ...quotaForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input placeholder="Description" value={quotaForm.description} onChange={(e) => setQuotaForm({ ...quotaForm, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Month</Label>
                <Select value={String(quotaForm.month)} onValueChange={(v) => setQuotaForm({ ...quotaForm, month: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{months.map((m) => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year</Label>
                <Input type="number" value={quotaForm.year} onChange={(e) => setQuotaForm({ ...quotaForm, year: parseInt(e.target.value) })} />
              </div>
              <div>
                <Label>Allowed Days</Label>
                <Input type="number" min={1} value={quotaForm.allowedDays} onChange={(e) => setQuotaForm({ ...quotaForm, allowedDays: parseInt(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(quotaForm)} disabled={createMutation.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocate Holiday Dialog */}
      <Dialog open={allocateDialog.open} onOpenChange={(open) => !open && setAllocateDialog({ open: false, quota: null })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Allocate Holiday — {allocateDialog.quota?.name}</DialogTitle></DialogHeader>
          {(() => {
            const quota = allocateDialog.quota;
            const allAllocations = quota?.allocations || [];
            const allStaff = staffData?.data || [];

            // Calculate remaining days per staff
            const usedByStaff = {};
            allAllocations.forEach(a => {
              const sid = a.staff?.id || a.staffId;
              usedByStaff[sid] = (usedByStaff[sid] || 0) + 1;
            });

            // Staff with remaining days
            const maxDays = quota?.allowedDays || 0;
            const availableStaff = allStaff.filter(s => (usedByStaff[s.id] || 0) < maxDays);

            // Remaining for selected staff
            const selectedUsed = usedByStaff[allocateForm.staffId] || 0;
            const remainingForSelected = maxDays - selectedUsed;

            return (
              <div className="space-y-4">
                <div>
                  <Label>Select Staff</Label>
                  {availableStaff.length === 0 ? (
                    <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" /> All staff have been fully allocated for this quota.
                    </p>
                  ) : (
                    <Select value={allocateForm.staffId} onValueChange={(v) => setAllocateForm({ ...allocateForm, staffId: v, selectedDates: [] })}>
                      <SelectTrigger><SelectValue placeholder="Choose staff member" /></SelectTrigger>
                      <SelectContent>
                        {availableStaff.map((s) => {
                          const used = usedByStaff[s.id] || 0;
                          const left = maxDays - used;
                          return (
                            <SelectItem key={s.id} value={s.id}>
                              {s.firstName} {s.lastName} ({s.employeeId}) — {left} day{left !== 1 ? 's' : ''} left
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {allocateForm.staffId && remainingForSelected > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Select Holiday Dates</Label>
                      <span className={`text-xs font-medium ${
                        allocateForm.selectedDates.length > remainingForSelected
                          ? 'text-red-500' : allocateForm.selectedDates.length === remainingForSelected
                          ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {allocateForm.selectedDates.length} / {remainingForSelected} remaining
                      </span>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal h-auto min-h-10">
                          <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
                          {allocateForm.selectedDates.length > 0
                            ? <span className="truncate">{allocateForm.selectedDates.length} date(s) selected</span>
                            : <span className="text-muted-foreground">Pick dates from calendar</span>
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarPicker
                          mode="multiple"
                          selected={allocateForm.selectedDates}
                          onSelect={(dates) => {
                            if (!dates) return setAllocateForm({ ...allocateForm, selectedDates: [] });
                            const nonSunday = dates.filter(d => d.getDay() !== 0);
                            if (nonSunday.length > remainingForSelected) {
                              toast.error(`This staff has only ${remainingForSelected} day(s) remaining`);
                              return;
                            }
                            setAllocateForm({ ...allocateForm, selectedDates: nonSunday });
                          }}
                          defaultMonth={quota ? new Date(quota.year, quota.month - 1) : undefined}
                          disabled={(date) => date.getDay() === 0}
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Selected dates chips */}
                    {allocateForm.selectedDates.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {allocateForm.selectedDates
                          .sort((a, b) => a - b)
                          .map((date, idx) => (
                            <Badge key={idx} variant="secondary" className="gap-1 pr-1">
                              {format(date, "dd MMM yyyy")}
                              <button
                                type="button"
                                className="ml-0.5 rounded-full hover:bg-gray-300 p-0.5"
                                onClick={() => setAllocateForm({
                                  ...allocateForm,
                                  selectedDates: allocateForm.selectedDates.filter((_, i) => i !== idx)
                                })}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-1">Sundays are disabled. Already used: {selectedUsed} / {maxDays} days.</p>
                  </div>
                )}
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllocateDialog({ open: false, quota: null })}>Cancel</Button>
            {(() => {
              const quota = allocateDialog.quota;
              const used = (quota?.allocations || []).filter(a => (a.staff?.id || a.staffId) === allocateForm.staffId).length;
              const remaining = (quota?.allowedDays || 0) - used;
              return (
                <Button
                  onClick={() => {
                    if (allocateForm.selectedDates.length === 0) return toast.error("Please select at least one date");
                    if (!allocateForm.staffId) return toast.error("Please select a staff member");
                    if (allocateForm.selectedDates.length > remaining) return toast.error(`Only ${remaining} day(s) remaining for this staff`);
                    const dates = allocateForm.selectedDates.map(d => format(d, "yyyy-MM-dd"));
                    allocateMutation.mutate({ quotaId: quota.id, data: { staffId: allocateForm.staffId, holidayDates: dates } });
                  }}
                  disabled={allocateMutation.isPending || allocateForm.selectedDates.length === 0 || allocateForm.selectedDates.length > remaining}
                >
                  Allocate {allocateForm.selectedDates.length > 0 ? `(${allocateForm.selectedDates.length} days)` : ''}
                </Button>
              );
            })()}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ==================== PAYSLIPS TAB ====================
const PayslipsTab = () => {
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [detailDialog, setDetailDialog] = useState({ open: false, payslip: null });

  const { data: payslipsData, isLoading, refetch } = useQuery({
    queryKey: ["monthlyPayslips", month, year],
    queryFn: () => salaryService.getMonthlyPayslips(month, year),
  });

  const generateBulkMutation = useMutation({
    mutationFn: () => salaryService.generateBulkPayslips({ month, year }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["monthlyPayslips"] });
      toast.success(data.message || "Payslips generated");
    },
    onError: (err) => toast.error(err.message),
  });

  const finalizeMutation = useMutation({
    mutationFn: (id) => salaryService.finalizePayslip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthlyPayslips"] });
      toast.success("Payslip finalized");
    },
    onError: (err) => toast.error(err.message),
  });

  const payslips = payslipsData?.data?.payslips || [];
  const summary = payslipsData?.data?.summary;

  return (
    <>
      <div className="space-y-4">
        {/* Controls */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-lg">Monthly Payslips</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Generate, review, and finalize staff payslips</p>
              </div>
              <div className="flex gap-2 items-center">
                <Select value={String(month)} onValueChange={(v) => setMonth(parseInt(v))}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>{months.map((m) => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" className="w-24" value={year} onChange={(e) => setYear(parseInt(e.target.value))} />
                <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
                <Button onClick={() => generateBulkMutation.mutate()} disabled={generateBulkMutation.isPending}>
                  {generateBulkMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
                  Generate All
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-500">Total Staff</p>
              <p className="text-xl font-bold">{summary.totalStaff}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-500">Total Base</p>
              <p className="text-lg font-bold text-blue-600">₹{summary.totalBaseSalary?.toLocaleString("en-IN")}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-500">Deductions</p>
              <p className="text-lg font-bold text-red-600">-₹{summary.totalDeductions?.toLocaleString("en-IN")}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-500">Additions</p>
              <p className="text-lg font-bold text-green-600">+₹{summary.totalAdditions?.toLocaleString("en-IN")}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-500">Net Payout</p>
              <p className="text-lg font-bold text-purple-600">₹{summary.totalNetSalary?.toLocaleString("en-IN")}</p>
            </Card>
          </div>
        )}

        {/* Payslips Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : payslips.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No payslips generated for {months.find((m) => m.value === month)?.label} {year}. Click "Generate All" to create them.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Deductions</TableHead>
                    <TableHead className="text-right">Additions</TableHead>
                    <TableHead className="text-right">Net Salary</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.staff?.firstName} {p.staff?.lastName}</p>
                          <p className="text-xs text-gray-400">{p.staff?.employeeId}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{p.staff?.staffType}</Badge></TableCell>
                      <TableCell className="text-right">₹{p.baseSalary?.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right text-red-600">-₹{p.totalDeductions?.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right text-green-600">+₹{p.totalAdditions?.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right font-bold">₹{p.netSalary?.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={p.status === "FINALIZED" ? "default" : "secondary"}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="ghost" onClick={() => setDetailDialog({ open: true, payslip: p })}>
                            <FileText className="h-3 w-3" />
                          </Button>
                          {p.status === "DRAFT" && (
                            <Button size="sm" variant="outline" onClick={() => finalizeMutation.mutate(p.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Finalize
                            </Button>
                          )}
                          {p.status === "FINALIZED" && p.pdfUrl && (
                            <Button size="sm" variant="ghost" onClick={() => window.open(`${API_BASE}${p.pdfUrl}`, '_blank')}>
                              <Download className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payslip Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => !open && setDetailDialog({ open: false, payslip: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Payslip Detail — {detailDialog.payslip?.staff?.firstName} {detailDialog.payslip?.staff?.lastName}</span>
              {detailDialog.payslip?.status === "FINALIZED" && detailDialog.payslip?.pdfUrl && (
                <Button size="sm" variant="outline" onClick={() => window.open(`${API_BASE}${detailDialog.payslip.pdfUrl}`, '_blank')}>
                  <Download className="h-4 w-4 mr-1" /> PDF
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailDialog.payslip && (
            <div className="space-y-4">
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
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Base Salary</TableCell>
                    <TableCell className="text-right">₹{detailDialog.payslip.baseSalary?.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-red-600">Leave Deduction ({detailDialog.payslip.daysOnLeave - (detailDialog.payslip.daysOnPaidLeave || 0)} unpaid days)</TableCell>
                    <TableCell className="text-right text-red-600">-₹{detailDialog.payslip.leaveDeduction?.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-red-600">Absent Deduction ({detailDialog.payslip.daysAbsent} days)</TableCell>
                    <TableCell className="text-right text-red-600">-₹{detailDialog.payslip.absentDeduction?.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-red-600">Late Penalty ({detailDialog.payslip.daysLate} days)</TableCell>
                    <TableCell className="text-right text-red-600">-₹{detailDialog.payslip.lateDeduction?.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-green-600">Extra Hours Pay ({detailDialog.payslip.extraHoursWorked}h)</TableCell>
                    <TableCell className="text-right text-green-600">+₹{detailDialog.payslip.extraHoursPay?.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                  <TableRow className="border-t-2">
                    <TableCell className="font-bold text-lg">Net Salary</TableCell>
                    <TableCell className="text-right font-bold text-lg text-purple-700">₹{detailDialog.payslip.netSalary?.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Day-by-day breakdown */}
              {detailDialog.payslip.calculationDetails?.dayDetails && (
                <div>
                  <p className="text-sm font-semibold mb-2">Day-by-Day Breakdown</p>
                  <div className="max-h-64 overflow-y-auto rounded border">
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
                          const typeLabels = { PRESENT: 'P', LATE: 'L', ABSENT: 'A', LEAVE: 'LV', PAID_LEAVE: 'PL', HALF_DAY: 'HD', SUNDAY: 'S', HOLIDAY: 'H', SPECIAL_HOLIDAY: 'SH', FUTURE: '—' };
                          const typeColors = { PRESENT: 'bg-green-500', LATE: 'bg-orange-500', ABSENT: 'bg-red-500', LEAVE: 'bg-amber-500', PAID_LEAVE: 'bg-emerald-500', HALF_DAY: 'bg-yellow-500', SUNDAY: 'bg-blue-400', HOLIDAY: 'bg-blue-500', SPECIAL_HOLIDAY: 'bg-purple-500', FUTURE: 'bg-gray-300' };
                          const fmtMin = (m) => m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`;
                          return (
                            <TableRow key={d.day} className="text-xs">
                              <TableCell className="py-1">{d.day}</TableCell>
                              <TableCell className="py-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold text-white ${typeColors[d.type] || 'bg-gray-300'}`}>{typeLabels[d.type] || d.type}</span>
                              </TableCell>
                              <TableCell className="py-1 text-right text-orange-600">{d.lateMinutes ? fmtMin(d.lateMinutes) : ""}{d.lateApproved ? " ✓" : ""}</TableCell>
                              <TableCell className="py-1 text-right text-green-600">{d.extraMinutes ? `+${fmtMin(d.extraMinutes)}` : ""}</TableCell>
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

// ==================== MAIN COMPONENT ====================
const SalaryManagement = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Salary Management</h1>
        <p className="text-gray-600 mt-1">Configure shifts, manage salaries, holiday quotas, and generate payslips</p>
      </div>

      <Tabs defaultValue="shift-config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white p-1 rounded-lg shadow-md border mb-6">
          <TabsTrigger value="shift-config" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <Clock className="w-4 h-4" /> Shift Config
          </TabsTrigger>
          <TabsTrigger value="staff-salaries" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <IndianRupee className="w-4 h-4" /> Staff Salaries
          </TabsTrigger>
          <TabsTrigger value="holiday-quotas" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <Calendar className="w-4 h-4" /> Holiday Quotas
          </TabsTrigger>
          <TabsTrigger value="payslips" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <FileText className="w-4 h-4" /> Payslips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shift-config"><ShiftConfigTab /></TabsContent>
        <TabsContent value="staff-salaries"><StaffSalariesTab /></TabsContent>
        <TabsContent value="holiday-quotas"><HolidayQuotaTab /></TabsContent>
        <TabsContent value="payslips"><PayslipsTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default SalaryManagement;
