import React, { useState, useEffect, useCallback, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell, User, Clock, AlertTriangle, CheckCircle, Eye,
  Phone, Mail, Volume2, VolumeX, Settings, Loader2,
  Calendar, CreditCard, Activity, Radio, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import useNotificationStore from "@/stores/ohms/notificationStore";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreferences,
  updateNotificationPreferences
} from "@/services/notificationService";
import { initAudioContext } from '../utils/soundManager';
import AuthContext from "@/contexts/AuthContext";

const NotificationCenter = ({ user: userProp }) => {
  // Get user from context if not passed as prop
  const { user: contextUser } = useContext(AuthContext);
  const user = userProp || contextUser;

  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [preferences, setPreferences] = useState({
    enableSound: true,
    enablePush: true
  });

  // Socket integration for real-time updates
  const {
    isConnected,
    unreadCount: socketUnreadCount,
    markAsReadViaSocket,
    markAllAsReadViaSocket
  } = useNotificationSocket(user);

  // Calculate unread count from local state
  const unreadCount = notifications.filter(n => !n.isRead).length || socketUnreadCount;

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await getUserNotifications({
        limit: 50,
        unreadOnly: filter === 'unread'
      });

      if (response.success) {
        setNotifications(response.notifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          timestamp: n.createdAt,
          isRead: n.isRead,
          priority: n.priority,
          recipientType: n.recipientType,
          deliveryMethod: n.soundType || 'push',
          actionRequired: n.actionable,
          actionType: n.actionType,
          actionData: n.actionData
        })));
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, filter]);

  // Store actions for syncing
  const updateStoreSettings = useNotificationStore(state => state.updateNotificationSettings);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await getNotificationPreferences();
      if (response.success) {
        setPreferences(response.preferences);
        // Sync backend preferences to local store for the socket hook to use
        updateStoreSettings({ enableSoundAlerts: response.preferences.enableSound });
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    }
  }, [user?.id, updateStoreSettings]);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [isOpen, fetchNotifications, fetchPreferences]);

  // Handle new notification from socket
  useEffect(() => {
    const handleNewNotification = (notification) => {
      setNotifications(prev => [{
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: notification.createdAt,
        isRead: false,
        priority: notification.priority,
        recipientType: notification.recipientType,
        deliveryMethod: notification.soundType || 'push',
        actionRequired: notification.actionable,
        actionType: notification.actionType,
        actionData: notification.actionData
      }, ...prev]);

      // Sound is handled globally by useNotificationSocket hook
      console.log('Notification received in UI:', notification.title);

      // Show toast notification
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000
      });
    };

    // Listen for socket events
    if (isConnected && window.socket) {
      window.socket.on('notification:new', handleNewNotification);
      return () => window.socket.off('notification:new', handleNewNotification);
    }
  }, [isConnected, preferences.enableSound]);

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      markAsReadViaSocket(notificationId);

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      markAllAsReadViaSocket();

      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const toggleSound = async () => {
    const newValue = !preferences.enableSound;
    setPreferences(prev => ({ ...prev, enableSound: newValue }));

    try {
      await updateNotificationPreferences({ enableSound: newValue });

      // Update local store immediately for responsiveness
      updateStoreSettings({ enableSoundAlerts: newValue });

      // Initialize audio context on first interaction
      if (newValue) {
        initAudioContext();
      }

      toast.success(newValue ? 'Sound notifications enabled' : 'Sound notifications muted');
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "normal": return "text-blue-600 bg-blue-50 border-blue-200";
      case "low": return "text-gray-600 bg-gray-50 border-gray-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "queue": return <User className="h-4 w-4" />;
      case "appointment": return <Calendar className="h-4 w-4" />;
      case "surgery": return <Activity className="h-4 w-4" />;
      case "billing": return <CreditCard className="h-4 w-4" />;
      case "emergency": return <AlertTriangle className="h-4 w-4" />;
      case "system": return <CheckCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'urgent') return n.priority === 'critical' || n.priority === 'high';
    return true;
  });

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Handle popover open change to initialize audio context
  const handleOpenChange = (open) => {
    if (open) {
      initAudioContext();
    }
    setIsOpen(open);
  };

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs p-0 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
            {isConnected && (
              <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[calc(100vw-2rem)] sm:w-[380px] md:w-[420px] max-w-[420px] p-0"
          align="end"
          alignOffset={-142}
          sideOffset={8}
        >
          {/* Header */}
          <div className="border-b p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
                {isConnected ? (
                  <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                    <Radio className="h-2 w-2 mr-1" /> Live
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-400 text-xs hidden sm:inline-flex">Offline</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  onClick={fetchNotifications}
                  title="Refresh notifications"
                >
                  <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5] text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  onClick={toggleSound}
                  title={preferences.enableSound ? 'Mute sounds' : 'Enable sounds'}
                >
                  {preferences.enableSound ? (
                    <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  )}
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-blue-600 hover:text-blue-700 text-xs hidden sm:inline-flex"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <Tabs value={filter} onValueChange={setFilter} className="mt-2">
              <TabsList className="grid w-full grid-cols-3 h-9 sm:h-11 gap-1 sm:gap-2 bg-gray-100 p-1 sm:p-1.5 rounded-lg">
                <TabsTrigger
                  value="all"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-1.5 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-1.5 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all"
                >
                  <span className="hidden sm:inline">Unread</span>
                  <span className="sm:hidden">New</span> {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
                <TabsTrigger
                  value="urgent"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-1.5 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all"
                >
                  Urgent
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Notification List */}
          <ScrollArea className="h-[50vh] sm:h-[365px] max-h-[500px]">
            <div className="p-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium text-sm sm:text-base">No notifications</p>
                  <p className="text-xs sm:text-sm text-gray-400">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${!notification.isRead
                        ? 'bg-blue-50/70 border-blue-200 hover:bg-blue-50'
                        : 'bg-white hover:bg-gray-50'
                        }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CardContent className="p-2.5 sm:p-3">
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1.5 sm:gap-2 flex-1 min-w-0">
                              <div className={`p-1 sm:p-1.5 rounded-lg ${getPriorityColor(notification.priority)}`}>
                                {getTypeIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-xs sm:text-sm font-medium truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                  }`}>
                                  {notification.title}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 sm:mt-2 flex-shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="text-[10px] sm:text-xs">{formatTimestamp(notification.timestamp)}</span>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] sm:text-xs capitalize ${notification.priority === 'critical' ? 'border-red-300 text-red-600' :
                                  notification.priority === 'high' ? 'border-orange-300 text-orange-600' :
                                    ''
                                  }`}
                              >
                                {notification.priority}
                              </Badge>
                              {notification.actionRequired && (
                                <Badge className="bg-orange-100 text-orange-800 text-[10px] sm:text-xs">
                                  Action
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NotificationCenter;
