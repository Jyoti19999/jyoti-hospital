import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  CalendarOff, Clock, CheckCircle, XCircle, Loader2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import leaveService from "@/services/leaveService";

const statusColors = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

// ==================== LEAVE REQUESTS TAB ====================
const LeaveRequestsTab = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("PENDING");
  const [reviewDialog, setReviewDialog] = useState({ open: false, request: null });
  const [reviewNote, setReviewNote] = useState("");

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["adminLeaveRequests", filter],
    queryFn: () => leaveService.getAllLeaveRequests({ status: filter !== "ALL" ? filter : undefined }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }) => leaveService.reviewLeaveRequest(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminLeaveRequests"] });
      queryClient.invalidateQueries({ queryKey: ["pendingCount"] });
      toast.success(data.message || "Leave request reviewed");
      setReviewDialog({ open: false, request: null });
    },
    onError: (err) => toast.error(err.message),
  });

  const requests = requestsData?.data || [];

  const handleReview = (status, isPaidLeave = false) => {
    reviewMutation.mutate({
      id: reviewDialog.request.id,
      data: { status, reviewNote: reviewNote || undefined, isPaidLeave },
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Leave Requests</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Review and approve/reject staff leave requests</p>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : requests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No {filter !== "ALL" ? filter.toLowerCase() : ""} leave requests</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead className="text-center">Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.staff?.firstName} {req.staff?.lastName}</TableCell>
                    <TableCell className="font-mono text-sm">{req.staff?.employeeId}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center font-semibold">{req.totalDays}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{req.reason}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge className={statusColors[req.status]}>{req.status}</Badge>
                        {req.status === "APPROVED" && (
                          <Badge className={req.isPaidLeave ? "bg-green-50 text-green-700 text-[10px]" : "bg-amber-50 text-amber-700 text-[10px]"}>
                            {req.isPaidLeave ? "Paid" : "Unpaid"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {req.status === "PENDING" ? (
                        <Button size="sm" variant="outline" onClick={() => { setReviewNote(""); setReviewDialog({ open: true, request: req }); }}>
                          Review
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => !open && setReviewDialog({ open: false, request: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
          </DialogHeader>
          {reviewDialog.request && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><span className="font-medium">Staff:</span> {reviewDialog.request.staff?.firstName} {reviewDialog.request.staff?.lastName} ({reviewDialog.request.staff?.employeeId})</p>
                <p><span className="font-medium">Dates:</span> {new Date(reviewDialog.request.startDate).toLocaleDateString()} — {new Date(reviewDialog.request.endDate).toLocaleDateString()}</p>
                <p><span className="font-medium">Days:</span> {reviewDialog.request.totalDays}</p>
                <p><span className="font-medium">Reason:</span> {reviewDialog.request.reason}</p>
              </div>
              <div>
                <Label>Note (optional)</Label>
                <Textarea placeholder="Add a note..." value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
              </div>
              <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Choose <strong>Paid Leave</strong> (no salary cut) or <strong>Unpaid Leave</strong> (salary deducted for leave days).
              </p>
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setReviewDialog({ open: false, request: null })}>Cancel</Button>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={() => handleReview("REJECTED")} disabled={reviewMutation.isPending}>
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
              <Button variant="outline" size="sm" className="border-amber-400 text-amber-700 hover:bg-amber-50" onClick={() => handleReview("APPROVED", false)} disabled={reviewMutation.isPending}>
                {reviewMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                Unpaid Leave
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleReview("APPROVED", true)} disabled={reviewMutation.isPending}>
                {reviewMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                Paid Leave
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ==================== LATE APPROVALS TAB ====================
const LateApprovalsTab = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("PENDING");
  const [reviewDialog, setReviewDialog] = useState({ open: false, approval: null });
  const [reviewNote, setReviewNote] = useState("");

  const { data: approvalsData, isLoading } = useQuery({
    queryKey: ["adminLateApprovals", filter],
    queryFn: () => leaveService.getAllLateApprovals({ status: filter !== "ALL" ? filter : undefined }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, data }) => leaveService.reviewLateApproval(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminLateApprovals"] });
      queryClient.invalidateQueries({ queryKey: ["pendingCount"] });
      toast.success(data.message || "Late approval reviewed");
      setReviewDialog({ open: false, approval: null });
    },
    onError: (err) => toast.error(err.message),
  });

  const approvals = approvalsData?.data || [];

  const handleReview = (status) => {
    reviewMutation.mutate({
      id: reviewDialog.approval.id,
      data: { status, reviewNote: reviewNote || undefined },
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Late Approval Requests</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Staff requesting forgiveness for late arrivals — approving waives the penalty</p>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : approvals.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No {filter !== "ALL" ? filter.toLowerCase() : ""} late approval requests</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Late By</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.staff?.firstName} {a.staff?.lastName}</TableCell>
                    <TableCell className="font-mono text-sm">{a.staff?.employeeId}</TableCell>
                    <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-orange-600">{a.lateMinutes >= 60 ? `${Math.floor(a.lateMinutes / 60)}h ${a.lateMinutes % 60}m` : `${a.lateMinutes} min`}</Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{a.reason}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={statusColors[a.status]}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {a.status === "PENDING" ? (
                        <Button size="sm" variant="outline" onClick={() => { setReviewNote(""); setReviewDialog({ open: true, approval: a }); }}>
                          Review
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {a.reviewedAt ? new Date(a.reviewedAt).toLocaleDateString() : "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => !open && setReviewDialog({ open: false, approval: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Late Approval</DialogTitle>
          </DialogHeader>
          {reviewDialog.approval && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><span className="font-medium">Staff:</span> {reviewDialog.approval.staff?.firstName} {reviewDialog.approval.staff?.lastName}</p>
                <p><span className="font-medium">Date:</span> {new Date(reviewDialog.approval.date).toLocaleDateString()}</p>
                <p><span className="font-medium">Late by:</span> {reviewDialog.approval.lateMinutes >= 60 ? `${Math.floor(reviewDialog.approval.lateMinutes / 60)}h ${reviewDialog.approval.lateMinutes % 60}m` : `${reviewDialog.approval.lateMinutes} min`}</p>
                <p><span className="font-medium">Reason:</span> {reviewDialog.approval.reason}</p>
              </div>
              <div>
                <Label>Note (optional)</Label>
                <Textarea placeholder="Add a note..." value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
              </div>
              <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                Approving will waive the late penalty for this day's salary calculation.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog({ open: false, approval: null })}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleReview("REJECTED")} disabled={reviewMutation.isPending}>
              <XCircle className="h-4 w-4 mr-1" /> Reject
            </Button>
            <Button onClick={() => handleReview("APPROVED")} disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ==================== MAIN COMPONENT ====================
const LeaveManagement = () => {
  const { data: pendingData } = useQuery({
    queryKey: ["pendingCount"],
    queryFn: () => leaveService.getPendingCount(),
    refetchInterval: 30000,
  });
  const pending = pendingData?.data;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Leave & Late Management</h1>
        <p className="text-gray-600 mt-1">Manage staff leave requests and late approval requests</p>
      </div>

      {/* Pending counts summary */}
      {pending && pending.total > 0 && (
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            <CalendarOff className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">{pending.pendingLeaves} pending leave request(s)</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">{pending.pendingLateApprovals} pending late approval(s)</span>
          </div>
        </div>
      )}

      <Tabs defaultValue="leave-requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white p-1 rounded-lg shadow-md border mb-6">
          <TabsTrigger value="leave-requests" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <CalendarOff className="w-4 h-4" /> Leave Requests
            {pending?.pendingLeaves > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{pending.pendingLeaves}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="late-approvals" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <Clock className="w-4 h-4" /> Late Approvals
            {pending?.pendingLateApprovals > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{pending.pendingLateApprovals}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leave-requests"><LeaveRequestsTab /></TabsContent>
        <TabsContent value="late-approvals"><LateApprovalsTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default LeaveManagement;
