import React from 'react';
import { Button } from "@/components/ui/button";
import NotificationCenter from "@/components/NotificationCenter";
import { Eye, LogOut, User } from "lucide-react";

const Avatar = ({ src, alt, size = 'md', className = '' }) => {
    const [imageError, setImageError] = React.useState(false);

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-20 h-20'
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
                    onError={() => setImageError(true)}
                />
            ) : (
                <User className={`${size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : size === 'lg' ? 'h-8 w-8' : 'h-10 w-10'} text-gray-400`} />
            )}
        </div>
    );
};

const PatientExaminationHeader = ({ user, currentTime, onLogout, inProgressAt }) => {
    return (
        <header className="bg-white shadow-lg border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                            <Eye className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">OptiCare Hospital</h1>
                            <p className="text-sm text-slate-600">Institute of Ophthalmology & Laser Center</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-800">
                                {currentTime.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                            <p className="text-lg font-bold text-blue-600">
                                {currentTime.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}
                            </p>
                        </div>
                        <NotificationCenter />
                        <div className="flex items-center space-x-2">
                            <Avatar
                                src={user?.profilePhoto}
                                alt={`Dr. ${user?.firstName} ${user?.lastName}`}
                                size="md"
                                className="border border-gray-200"
                            />
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

export default PatientExaminationHeader;
