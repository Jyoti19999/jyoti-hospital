import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import {
    Bell, Shield, LayoutDashboard, Send, AlertTriangle, Users,
    BarChart3, Clock, Trash2, Loader2, Volume2, Radio, RefreshCw,
    Megaphone, UserCheck, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
    createNotification,
    getAllNotifications,
    getNotificationStatistics,
    broadcastNotification,
    sendEmergencyNotification,
    deleteNotification,
    getStaffTypes,
    getNotificationTypes
} from '@/services/notificationService';

// Fallback staff types in case API fails
const DEFAULT_STAFF_TYPES = [
    { value: 'doctor', label: 'Doctor' },
    { value: 'ophthalmologist', label: 'Ophthalmologist' },
    { value: 'optometrist', label: 'Optometrist' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'receptionist2', label: 'Receptionist 2' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'sister', label: 'Sister' },
    { value: 'technician', label: 'Technician' },
    { value: 'surgeon', label: 'Surgeon' },
    { value: 'anesthesiologist', label: 'Anesthesiologist' },
    { value: 'ot_admin', label: 'OT Admin' },
    { value: 'tpa', label: 'TPA' },
    { value: 'admin', label: 'Admin' }
];

const NotificationManagement = () => {
    // State for form
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState('normal');
    const [type, setType] = useState('custom');
    const [soundType, setSoundType] = useState('default');
    const [selectedStaffTypes, setSelectedStaffTypes] = useState([]);
    const [sending, setSending] = useState(false);

    // State for data
    const [notifications, setNotifications] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [staffTypes, setStaffTypes] = useState(DEFAULT_STAFF_TYPES);
    const [notificationTypes, setNotificationTypes] = useState({ types: [], priorities: [], soundTypes: [] });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState(false);

    // Ref for intersection observer
    const observerRef = useRef();
    const lastNotificationRef = useCallback(node => {
        if (loadingMore) return;
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMoreNotifications();
            }
        });
        if (node) observerRef.current.observe(node);
    }, [loadingMore, hasMore]);

    // Fetch initial data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [notifRes, statsRes, staffRes, typesRes] = await Promise.all([
                getAllNotifications({ page: 1, limit: 20 }).catch(e => ({ success: false })),
                getNotificationStatistics().catch(e => ({ success: false })),
                getStaffTypes().catch(e => ({ success: false })),
                getNotificationTypes().catch(e => ({ success: false }))
            ]);

            if (notifRes.success) {
                setNotifications(notifRes.notifications);
                setHasMore(notifRes.notifications.length === 20);
                setPage(1);
            }
            if (statsRes.success) setStatistics(statsRes.statistics);
            if (staffRes.success) setStaffTypes(staffRes.staffTypes);
            if (typesRes.success) setNotificationTypes(typesRes);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load notification data');
        } finally {
            setLoading(false);
        }
    };

    // Load more notifications
    const loadMoreNotifications = async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        try {
            const nextPage = page + 1;
            const notifRes = await getAllNotifications({ page: nextPage, limit: 20 });

            if (notifRes.success) {
                setNotifications(prev => [...prev, ...notifRes.notifications]);
                setPage(nextPage);
                setHasMore(notifRes.notifications.length === 20);
            }
        } catch (error) {
            console.error('Failed to load more notifications:', error);
            toast.error('Failed to load more notifications');
        } finally {
            setLoadingMore(false);
        }
    };

    // Handle staff type selection
    const toggleStaffType = (value) => {
        setSelectedStaffTypes(prev =>
            prev.includes(value)
                ? prev.filter(t => t !== value)
                : [...prev, value]
        );
    };

    // Send broadcast notification
    const handleBroadcast = async (e) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            toast.error('Title and message are required');
            return;
        }

        if (selectedStaffTypes.length === 0) {
            toast.error('Select at least one staff type');
            return;
        }

        setSending(true);
        try {
            const response = await broadcastNotification({
                title,
                message,
                targetStaffTypes: selectedStaffTypes,
                priority,
                playSound: true,
                soundType
            });

            if (response.success) {
                toast.success(`Notification broadcast to ${selectedStaffTypes.join(', ')}`);
                resetForm();
                fetchData();
            }
        } catch (error) {
            console.error('Failed to broadcast:', error);
            toast.error('Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    // Send to all users
    const handleSendToAll = async (e) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            toast.error('Title and message are required');
            return;
        }

        setSending(true);
        try {
            const response = await createNotification({
                title,
                message,
                type,
                priority,
                recipientType: 'all',
                playSound: true,
                soundType
            });

            if (response.success) {
                toast.success('Notification sent to all users');
                resetForm();
                fetchData();
            }
        } catch (error) {
            console.error('Failed to send:', error);
            toast.error('Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    // Send emergency notification
    const handleEmergency = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error('Title and message are required');
            return;
        }

        if (!window.confirm('Send EMERGENCY notification to ALL users? This will play urgent sounds on all connected devices.')) {
            return;
        }

        setSending(true);
        try {
            const response = await sendEmergencyNotification(title, message);

            if (response.success) {
                toast.success('Emergency notification sent!', { duration: 5000 });
                resetForm();
                fetchData();
            }
        } catch (error) {
            console.error('Failed to send emergency:', error);
            toast.error('Failed to send emergency notification');
        } finally {
            setSending(false);
        }
    };

    // Delete notification
    const handleDelete = (notif) => {
        setNotificationToDelete(notif);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!notificationToDelete) return;

        setDeleting(true);
        try {
            await deleteNotification(notificationToDelete.id);
            setNotifications(prev => prev.filter(n => n.id !== notificationToDelete.id));
            setDeleteSuccess(true);
        } catch (error) {
            console.error('Failed to delete:', error);
            toast.error('Failed to delete notification');
            setDeleteDialogOpen(false);
            setNotificationToDelete(null);
        } finally {
            setDeleting(false);
        }
    };

    const cancelDelete = () => {
        if (deleteSuccess) {
            setDeleteSuccess(false);
        }
        setDeleteDialogOpen(false);
        setNotificationToDelete(null);
    };

    const resetForm = () => {
        setTitle('');
        setMessage('');
        setPriority('normal');
        setType('custom');
        setSoundType('default');
        setSelectedStaffTypes([]);
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            critical: 'bg-red-500 text-white',
            high: 'bg-orange-500 text-white',
            normal: 'bg-blue-500 text-white',
            low: 'bg-gray-400 text-white'
        };
        return <Badge className={`${colors[priority] || colors.normal} text-xs`}>{priority}</Badge>;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
                        <p className="text-gray-600 mt-1">Send and manage system notifications</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Bell className="h-3 w-3 mr-1" />
                        {statistics?.total || 0} Total Notifications
                    </Badge>
                </div>

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="bg-white shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                                        <p className="text-3xl font-bold text-gray-900">{statistics.total || 0}</p>
                                    </div>
                                    <div className="bg-blue-500 p-3 rounded-lg shadow-sm">
                                        <Bell className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Sent Today</p>
                                        <p className="text-3xl font-bold text-gray-900">{statistics.today || 0}</p>
                                    </div>
                                    <div className="bg-green-500 p-3 rounded-lg shadow-sm">
                                        <Clock className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Read</p>
                                        <p className="text-3xl font-bold text-gray-900">{statistics.totalReadReceipts || 0}</p>
                                    </div>
                                    <div className="bg-purple-500 p-3 rounded-lg shadow-sm">
                                        <UserCheck className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Critical</p>
                                        <p className="text-3xl font-bold text-gray-900">{statistics.byPriority?.critical || 0}</p>
                                    </div>
                                    <div className="bg-orange-500 p-3 rounded-lg shadow-sm">
                                        <AlertCircle className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Tabs defaultValue="broadcast" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-lg shadow-md border mb-6">
                        <TabsTrigger value="broadcast" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                            <Megaphone className="w-4 h-4" />
                            Broadcast
                        </TabsTrigger>
                        <TabsTrigger value="emergency" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                            <AlertTriangle className="w-4 h-4" />
                            Emergency
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                            <Clock className="w-4 h-4" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    {/* Broadcast Tab */}
                    <TabsContent value="broadcast" className="overflow-visible">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Send to Staff Types */}
                            <Card className="shadow-sm">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                        <Users className="h-5 w-5 text-blue-600" />
                                        Broadcast to Staff Types
                                    </CardTitle>
                                    <CardDescription>Send notifications to specific staff types</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <form onSubmit={handleBroadcast} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Input
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Notification title..."
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Message</Label>
                                            <Textarea
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Notification message..."
                                                rows={3}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Priority</Label>
                                                <Select value={priority} onValueChange={setPriority}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="low">Low</SelectItem>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="high">High</SelectItem>
                                                        <SelectItem value="critical">Critical</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Sound</Label>
                                                <Select value={soundType} onValueChange={setSoundType}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="default">Default</SelectItem>
                                                        <SelectItem value="subtle">Subtle</SelectItem>
                                                        <SelectItem value="urgent">Urgent</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Target Staff Types</Label>
                                            <div className="grid grid-cols-3 gap-2 p-3 border rounded-lg bg-gray-50">
                                                {staffTypes.map((staff) => (
                                                    <label key={staff.value} className="flex items-center gap-2 cursor-pointer">
                                                        <Checkbox
                                                            checked={selectedStaffTypes.includes(staff.value)}
                                                            onCheckedChange={() => toggleStaffType(staff.value)}
                                                        />
                                                        <span className="text-sm">{staff.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={sending}>
                                            {sending ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4 mr-2" />
                                            )}
                                            Broadcast to Selected Staff
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Send to All */}
                            <Card className="shadow-sm">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                                    <CardTitle className="flex items-center gap-2 text-gray-900">
                                        <Radio className="h-5 w-5 text-blue-600" />
                                        Send to All Users
                                    </CardTitle>
                                    <CardDescription>Broadcast to everyone in the system</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <form onSubmit={handleSendToAll} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Input
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Notification title..."
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Message</Label>
                                            <Textarea
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Notification message..."
                                                rows={3}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Type</Label>
                                                <Select value={type} onValueChange={setType}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {notificationTypes.types?.map((t) => (
                                                            <SelectItem key={t.value} value={t.value}>
                                                                {t.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Priority</Label>
                                                <Select value={priority} onValueChange={setPriority}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="low">Low</SelectItem>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="high">High</SelectItem>
                                                        <SelectItem value="critical">Critical</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={sending}>
                                            {sending ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4 mr-2" />
                                            )}
                                            Send to All Users
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Emergency Tab */}
                    <TabsContent value="emergency">
                        <Card className="border-red-200 bg-red-50/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-700">
                                    <AlertTriangle className="h-5 w-5" />
                                    Emergency Broadcast
                                </CardTitle>
                                <CardDescription className="text-red-600">
                                    Send critical alerts to ALL users immediately. Use with caution.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                                        <p className="text-sm text-red-800 font-medium">
                                            ⚠️ Emergency notifications will:
                                        </p>
                                        <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                                            <li>Play urgent sounds on all connected devices</li>
                                            <li>Appear with critical priority</li>
                                            <li>Be sent to ALL users including patients</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Emergency Title</Label>
                                        <Input
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="URGENT: Emergency notification title..."
                                            className="border-red-300 focus:border-red-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Emergency Message</Label>
                                        <Textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Describe the emergency situation..."
                                            rows={4}
                                            className="border-red-300 focus:border-red-500"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleEmergency}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                                        disabled={sending || !title.trim() || !message.trim()}
                                    >
                                        {sending ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                        )}
                                        Send Emergency Alert to Everyone
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Notification History
                                </CardTitle>
                                <CardDescription>View and manage sent notifications</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                        <p>No notifications sent yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {notifications.map((notif, index) => (
                                            <div
                                                key={notif.id}
                                                ref={index === notifications.length - 1 ? lastNotificationRef : null}
                                                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium text-gray-900 truncate">{notif.title}</h4>
                                                        {getPriorityBadge(notif.priority)}
                                                        <Badge variant="outline" className="text-xs">{notif.type}</Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2">{notif.message}</p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                        <span>{formatDate(notif.createdAt)}</span>
                                                        <span>Target: {notif.recipientType}</span>
                                                        {notif.readCount !== undefined && (
                                                            <span className="flex items-center gap-1">
                                                                <UserCheck className="h-3 w-3" />
                                                                {notif.readCount} read
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(notif)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}

                                        {/* Loading indicator */}
                                        {loadingMore && (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                title="Delete Notification"
                description="Are you sure you want to delete this notification? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                loading={deleting}
                loadingText="Deleting..."
                success={deleteSuccess}
                successTitle="Notification Deleted"
                successMessage="The notification has been successfully deleted."
                successButtonText="Close"
            />
        </div>
    );
};

export default NotificationManagement;