import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NotificationCenter from "@/components/NotificationCenter";
import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { useAttendanceSocket } from '@/hooks/useAttendanceSocket';
import {
  Eye,
  User,
  LogOut,
  LogIn,
  Clock,
  Loader2
} from "lucide-react";

// Custom Avatar Component
const Avatar = ({ src, alt, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 w-20'
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getImageUrl = (profilePhoto) => {
    if (!profilePhoto) return null;
    const baseUrl = import.meta.env.VITE_API_IMG_URL || 'http://localhost:8080';
    return `${baseUrl}${profilePhoto}`;
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}>
      {src && !imageError ? (
        <img
          src={getImageUrl(src)}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <User className={`${size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : size === 'lg' ? 'h-8 w-8' : 'h-10 w-10'} text-gray-400`} />
      )}
    </div>
  );
};

const DashboardHeader = ({
  hospitalName = "OptiCare Hospital",
  instituteName = "Institute of Ophthalmology & Laser Center",
  currentTime,
  onLogout,
  staffInfo = {},
  showNotifications = true,
  customActions = null
}) => {
  const { user } = useAuth();

  // 🔌 WebSocket real-time attendance updates
  useAttendanceSocket();

  const {
    isCheckedIn,
    currentWorkingHours,
    checkInTime,
    checkOutTime,
    handleCheckInToggle,
    isCheckingIn,
    isCheckingOut,
    formatWorkingHours,
    formatTime,
    isLoading: attendanceLoading
  } = useAttendance();

  const isProcessing = isCheckingIn || isCheckingOut;

  return (
    <header className="bg-white shadow-lg border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{hospitalName}</h1>
              <p className="text-sm text-slate-600">{instituteName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">
                {currentTime?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-lg font-bold text-blue-600">
                {currentTime?.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>

            {showNotifications && <NotificationCenter />}

            <div className="flex items-center space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="relative">
                      <Avatar
                        src={user?.profilePhoto}
                        alt={`${user?.firstName} ${user?.lastName}`}
                        size="md"
                        className="border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${attendanceLoading ? 'bg-yellow-500' : isCheckedIn ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                        {attendanceLoading && (
                          <Loader2 className="h-3 w-3 animate-spin text-white" />
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-4 max-w-xs">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={user?.profilePhoto}
                          alt={`${user?.firstName} ${user?.lastName}`}
                          size="lg"
                          className="border-2 border-blue-200"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {staffInfo.name || `${user?.firstName} ${user?.lastName}`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {staffInfo.role || user?.staffType || 'Staff Member'}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <User className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-gray-500">ID: {user?.employeeId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={isCheckedIn ? "default" : "outline"}
                            className={isCheckedIn ?
                              "bg-green-100 text-green-800 border-green-200" :
                              "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            <div className={`w-2 h-2 rounded-full mr-2 ${isCheckedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            {isCheckedIn ? 'Checked-In' : 'Checked-Out'}
                          </Badge>

                          <Button
                            onClick={handleCheckInToggle}
                            disabled={isProcessing || attendanceLoading}
                            size="sm"
                            className={`${isCheckedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                              } text-white disabled:opacity-50`}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : isCheckedIn ? (
                              <LogOut className="h-3 w-3 mr-1" />
                            ) : (
                              <LogIn className="h-3 w-3 mr-1" />
                            )}
                            {isProcessing
                              ? (isCheckingIn ? 'Checking In...' : 'Checking Out...')
                              : (isCheckedIn ? 'Check-Out' : 'Check-In')
                            }
                          </Button>
                        </div>

                        {/* Attendance Details */}
                        <div className="text-xs text-gray-600 space-y-1">
                          {checkInTime && (
                            <div className="flex items-center justify-between">
                              <span>Check-in:</span>
                              <span className="font-medium">{formatTime(checkInTime)}</span>
                            </div>
                          )}
                          {checkOutTime && (
                            <div className="flex items-center justify-between">
                              <span>Check-out:</span>
                              <span className="font-medium">{formatTime(checkOutTime)}</span>
                            </div>
                          )}
                          {isCheckedIn && currentWorkingHours > 0 && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>Working:</span>
                              </div>
                              <span className="font-medium text-blue-600">
                                {formatWorkingHours(currentWorkingHours)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Custom Actions Slot */}
              {customActions}

              <Button
                onClick={onLogout}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;