import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import profileService from "@/services/profileService";
import { toast } from "sonner";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    UserCheck,
    AlertTriangle,
    CheckCircle,
    Camera,
    Upload,
    X,
    Stethoscope,
    UserPlus,
    Monitor,
    Heart,
    Eye,
    Building,
    Calculator
} from "lucide-react";

// Helper function to get role-specific icon
const getRoleIcon = (staffType) => {
    switch (staffType?.toLowerCase()) {
        case 'doctor':
            return Stethoscope;
        case 'nurse':
            return Heart;
        case 'receptionist':
            return UserPlus;
        case 'technician':
            return Monitor;
        case 'optometrist':
            return Eye;
        case 'admin':
            return Building;
        case 'accountant':
            return Calculator;
        case 'patient-safety-officer':
            return AlertTriangle;
        case 'quality-coordinator':
            return CheckCircle;
        default:
            return User;
    }
};

// Role-specific field configurations for displaying information
const getRoleSpecificConfig = (staffType) => {
    switch (staffType?.toLowerCase()) {
        case 'doctor':
            return {
                profileKey: 'doctorProfile',
                displayName: 'Doctor',
                color: 'blue',
                fields: [
                    { key: 'medicalLicenseNumber', label: 'Medical License Number', type: 'text' },
                    { key: 'medicalCouncil', label: 'Medical Council', type: 'text' },
                    { key: 'consultationFee', label: 'Consultation Fee', type: 'currency' },
                    { key: 'followUpFee', label: 'Follow-up Fee', type: 'currency' },
                    { key: 'yearsExperience', label: 'Years of Experience', type: 'number' },
                    { key: 'maxPatientsPerDay', label: 'Max Patients Per Day', type: 'number' },
                    { key: 'consultationHours', label: 'Consultation Hours', type: 'text' },
                    { key: 'specialization', label: 'Specialization', type: 'text' },
                    { key: 'certifications', label: 'Certifications', type: 'badges', color: 'bg-blue-100 text-blue-800' },
                    { key: 'availableSlots', label: 'Available Slots', type: 'badges', color: 'bg-green-100 text-green-800' },
                    { key: 'surgeryTypes', label: 'Surgery Types', type: 'badges', color: 'bg-purple-100 text-purple-800' },
                    { key: 'operatingDays', label: 'Operating Days', type: 'badges', color: 'bg-purple-100 text-purple-800' }
                ]
            };
        
        case 'nurse':
            return {
                profileKey: 'nurseProfile',
                displayName: 'Nurse',
                color: 'pink',
                fields: [
                    { key: 'nursingLicenseNumber', label: 'Nursing License Number', type: 'text' },
                    { key: 'nursingDegree', label: 'Nursing Degree', type: 'text' },
                    { key: 'nursingCouncil', label: 'Nursing Council', type: 'text' },
                    { key: 'shiftType', label: 'Shift Type', type: 'text' },
                    { key: 'wardAssignment', label: 'Ward Assignment', type: 'text' },
                    { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number' },
                    { key: 'specializations', label: 'Specializations', type: 'badges', color: 'bg-pink-100 text-pink-800' },
                    { key: 'certifications', label: 'Additional Certifications', type: 'badges', color: 'bg-purple-100 text-purple-800' }
                ]
            };
        
        case 'receptionist':
        case 'receptionist2':
            return {
                profileKey: staffType === 'receptionist' ? 'receptionistProfile' : 'receptionist2Profile',
                displayName: 'Receptionist',
                color: 'cyan',
                fields: [
                    { key: 'shiftTiming', label: 'Shift Timing', type: 'text' },
                    { key: 'departmentAssignment', label: 'Department Assignment', type: 'text' },
                    { key: 'customerServiceExperience', label: 'Customer Service Experience', type: 'number' },
                    { key: 'computerSkills', label: 'Computer Skills', type: 'badges', color: 'bg-yellow-100 text-yellow-800' },
                    { key: 'languageSupport', label: 'Language Support', type: 'badges', color: 'bg-purple-100 text-purple-800' }
                ]
            };
        
        case 'technician':
            return {
                profileKey: 'technicianProfile',
                displayName: 'Technician',
                color: 'orange',
                fields: [
                    { key: 'technicianCertification', label: 'Certification', type: 'text' },
                    { key: 'specializations', label: 'Specializations', type: 'badges', color: 'bg-purple-100 text-purple-800' },
                    { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number' },
                    { key: 'diagnosticEquipment', label: 'Equipment Proficiency', type: 'badges', color: 'bg-blue-100 text-blue-800' },
                    { key: 'maintenanceSkills', label: 'Maintenance Skills', type: 'badges', color: 'bg-green-100 text-green-800' }
                ]
            };
        
        case 'optometrist':
            return {
                profileKey: 'optometristProfile',
                displayName: 'Optometrist',
                color: 'emerald',
                fields: [
                    { key: 'optometryLicenseNumber', label: 'Optometry License Number', type: 'text' },
                    { key: 'optometryDegree', label: 'Optometry Degree', type: 'text' },
                    { key: 'consultationFee', label: 'Consultation Fee', type: 'currency' },
                    { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number' },
                    { key: 'specializations', label: 'Specializations', type: 'badges', color: 'bg-emerald-100 text-emerald-800' },
                    { key: 'canPrescribeMedication', label: 'Can Prescribe Medication', type: 'boolean' }
                ]
            };
        
        case 'admin':
            return {
                profileKey: 'adminProfile',
                displayName: 'Administrator',
                color: 'gray',
                fields: [
                    { key: 'accessLevel', label: 'Admin Access Level', type: 'text' },
                    { key: 'departmentAccess', label: 'Department Access', type: 'badges', color: 'bg-purple-100 text-purple-800' },
                    { key: 'systemPermissions', label: 'Permissions', type: 'badges', color: 'bg-blue-100 text-blue-800' },
                    { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number' }
                ]
            };
        
        case 'accountant':
            return {
                profileKey: 'accountantProfile',
                displayName: 'Accountant',
                color: 'indigo',
                fields: [
                    { key: 'accountingCertifications', label: 'Accounting Certifications', type: 'badges', color: 'bg-blue-100 text-blue-800' },
                    { key: 'softwareProficiency', label: 'Software Proficiency', type: 'badges', color: 'bg-green-100 text-green-800' },
                    { key: 'specialization', label: 'Area of Specialization', type: 'text' },
                    { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number' }
                ]
            };

        case 'quality-coordinator':
            return {
                profileKey: 'qualityCoordinatorProfile',
                displayName: 'Quality Coordinator',
                color: 'teal',
                fields: [
                    { key: 'qualityCertifications', label: 'Quality Certifications', type: 'badges', color: 'bg-blue-100 text-blue-800' },
                    { key: 'qualityTools', label: 'Quality Tools', type: 'badges', color: 'bg-green-100 text-green-800' },
                    { key: 'auditExperience', label: 'Audit Experience', type: 'text' },
                    { key: 'yearsInQuality', label: 'Years in Quality', type: 'number' }
                ]
            };
            
        case 'patient-safety-officer':
            return {
                profileKey: 'patientSafetyOfficerProfile',
                displayName: 'Patient Safety Officer',
                color: 'red',
                fields: [
                    { key: 'riskAreas', label: 'Risk Management Areas', type: 'badges', color: 'bg-red-100 text-red-800' },
                    { key: 'safetyCertifications', label: 'Safety Certifications', type: 'badges', color: 'bg-green-100 text-green-800' },
                    { key: 'investigationExperience', label: 'Investigation Experience', type: 'boolean' },
                    { key: 'yearsInSafety', label: 'Years in Safety', type: 'number' }
                ]
            };
        
        case 'ot-admin':
        case 'ot_admin':
            return {
                profileKey: 'otAdminProfile',
                displayName: 'OT Administrator',
                color: 'blue',
                fields: [
                    { key: 'otLicenseNumber', label: 'OT License Number', type: 'text' },
                    { key: 'adminCertification', label: 'Administration Certification', type: 'text' },
                    { key: 'otRoomsManaged', label: 'OT Rooms Managed', type: 'number' },
                    { key: 'shiftSchedule', label: 'Shift Schedule', type: 'text' },
                    { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number' },
                    { key: 'specializations', label: 'Specializations', type: 'badges', color: 'bg-blue-100 text-blue-800' }
                ]
            };
        
        case 'anesthesiologist':
            return {
                profileKey: 'anesthesiologistProfile',
                displayName: 'Anesthesiologist',
                color: 'purple',
                fields: [
                    { key: 'medicalLicenseNumber', label: 'Medical License Number', type: 'text' },
                    { key: 'anesthesiaCertification', label: 'Anesthesia Certification', type: 'text' },
                    { key: 'medicalCouncil', label: 'Medical Council', type: 'text' },
                    { key: 'licenseExpiry', label: 'License Expiry', type: 'date' },
                    { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number' },
                    { key: 'anesthesiaTypes', label: 'Anesthesia Types', type: 'badges', color: 'bg-purple-100 text-purple-800' },
                    { key: 'specializations', label: 'Specializations', type: 'badges', color: 'bg-blue-100 text-blue-800' }
                ]
            };
        
        case 'surgeon':
            return {
                profileKey: 'surgeonProfile',
                displayName: 'Surgeon',
                color: 'red',
                fields: [
                    { key: 'medicalLicenseNumber', label: 'Medical License Number', type: 'text' },
                    { key: 'surgicalCertification', label: 'Surgical Certification', type: 'text' },
                    { key: 'medicalCouncil', label: 'Medical Council', type: 'text' },
                    { key: 'surgeryFee', label: 'Surgery Fee', type: 'currency' },
                    { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number' },
                    { key: 'surgeryTypes', label: 'Surgery Types', type: 'badges', color: 'bg-red-100 text-red-800' },
                    { key: 'specializations', label: 'Specializations', type: 'badges', color: 'bg-blue-100 text-blue-800' }
                ]
            };
        
        case 'sister':
            return {
                profileKey: 'sisterProfile',
                displayName: 'Sister/Head Nurse',
                color: 'pink',
                fields: [
                    { key: 'nursingRegistrationNumber', label: 'Nursing Registration Number', type: 'text' },
                    { key: 'nursingCouncil', label: 'Nursing Council', type: 'text' },
                    { key: 'shiftType', label: 'Shift Type', type: 'text' },
                    { key: 'wardAssignment', label: 'Ward Assignment', type: 'text' },
                    { key: 'yearsOfExperience', label: 'Years of Experience', type: 'number' },
                    { key: 'specializations', label: 'Specializations', type: 'badges', color: 'bg-pink-100 text-pink-800' },
                    { key: 'certifications', label: 'Certifications', type: 'badges', color: 'bg-purple-100 text-purple-800' }
                ]
            };
        
        default:
            return {
                profileKey: 'generalProfile',
                displayName: staffType || 'Staff Member',
                color: 'gray',
                fields: []
            };
    }
};

// Custom Avatar Component
const Avatar = ({ src, alt, size = 'md', className = '' }) => {
    const [imageError, setImageError] = useState(false);
    
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-20 h-20',
        xxl: 'w-24 h-24'
    };

    const handleImageError = () => {
        setImageError(true);
    };

    return (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center ${className}`}>
            {src && !imageError ? (
                <img
                    src={profileService.getImageUrl(src)}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                />
            ) : (
                <User className={`${size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : size === 'lg' ? 'h-8 w-8' : size === 'xl' ? 'h-10 w-10' : 'h-12 w-12'} text-gray-400`} />
            )}
        </div>
    );
};

const ProfileTab = ({ staffType }) => {
    const { user, fetchStaffProfile } = useAuth();
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [showPhotoUpload, setShowPhotoUpload] = useState(false);
    
    // Get role-specific configuration
    const roleConfig = getRoleSpecificConfig(staffType || user?.staffType);
    const roleProfileData = user?.[roleConfig.profileKey] || {};
    const RoleIcon = getRoleIcon(staffType || user?.staffType);
    
    // Debug: Log the profile data

    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploadingPhoto(true);

        try {
            await profileService.uploadProfilePhoto(file);
            toast.success('Profile photo updated successfully');
            
            // Refresh profile data
            await fetchStaffProfile();
            
            setShowPhotoUpload(false);
            setPhotoPreview(null);
        } catch (error) {
            toast.error(error.message || 'Failed to upload photo');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handlePhotoChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setPhotoPreview(previewUrl);
        }
    };

    const renderFieldValue = (field, value) => {
        if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
            return <span className="text-gray-400 text-sm">Not specified</span>;
        }

        switch (field.type) {
            case 'currency':
                return <span className="font-medium">₹{value}</span>;
            case 'number':
                if (field.key.includes('experience') || field.key.includes('Experience') || field.key === 'yearsExperience') {
                    return <span className="font-medium">{value} years</span>;
                }
                return <span className="font-medium">{value}</span>;
            case 'date':
                try {
                    const date = new Date(value);
                    return <span className="font-medium">{date.toLocaleDateString()}</span>;
                } catch (e) {
                    return <span className="font-medium">{value}</span>;
                }
            case 'boolean':
                return (
                    <div className="flex items-center space-x-2">
                        {value ? (
                            <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="font-medium text-green-700">Yes</span>
                            </>
                        ) : (
                            <>
                                <X className="h-4 w-4 text-red-500" />
                                <span className="font-medium text-red-700">No</span>
                            </>
                        )}
                    </div>
                );
            case 'badges':
                // Handle both arrays and single strings
                const items = Array.isArray(value) ? value : [value];
                return (
                    <div className="flex flex-wrap gap-2">
                        {items.map((item, index) => (
                            <Badge key={index} className={field.color || "bg-gray-100 text-gray-800"}>
                                {item}
                            </Badge>
                        ))}
                    </div>
                );
            case 'text':
            default:
                return <span className="font-medium capitalize">{value}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <RoleIcon className={`h-5 w-5 text-${roleConfig.color}-600`} />
                        <span>Staff Profile</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Profile Photo and Basic Info */}
                    <div className="flex items-start space-x-6">
                        <div className="relative">
                            <Avatar 
                                src={user?.profilePhoto} 
                                alt={`${user?.firstName} ${user?.middleName ? user?.middleName + ' ' : ''}${user?.lastName}`}
                                size="xxl"
                                className="border-2 border-gray-200"
                            />
                            {/* Photo upload button */}
                            <Button
                                size="sm"
                                className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8 bg-blue-600 hover:bg-blue-700"
                                onClick={() => setShowPhotoUpload(true)}
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-2xl font-bold text-gray-800">
                                    {user?.firstName} {user?.middleName ? user?.middleName + ' ' : ''}{user?.lastName}
                                </h3>
                                <Badge className={`bg-${roleConfig.color}-100 text-${roleConfig.color}-800`}>
                                    {roleConfig.displayName}
                                </Badge>
                            </div>
                            <p className="text-lg text-gray-600 mb-1">Employee ID: {user?.employeeId}</p>
                            <p className="text-sm text-gray-500">Department: {user?.department}</p>
                            <div className="flex items-center space-x-4 mt-3">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className={`text-sm font-medium ${user?.isActive ? 'text-green-700' : 'text-red-700'}`}>
                                        {user?.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Joined: {user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Basic Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h4>
                            
                            <div className="flex items-center space-x-3">
                                <Mail className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium">{user?.email || 'Not provided'}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <Phone className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium">{user?.phone || 'Not provided'}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start space-x-3">
                                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-500">Address</p>
                                    <p className="font-medium">{user?.address || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h4>
                            
                            <div className="flex items-center space-x-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Date of Birth</p>
                                    <p className="font-medium">
                                        {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <UserCheck className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Gender</p>
                                    <p className="font-medium capitalize">{user?.gender || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    {user?.emergencyContact && (
                        <div className="border-t pt-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Name</p>
                                    <p className="font-medium">{user.emergencyContact.name || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium">{user.emergencyContact.phone || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Relationship</p>
                                    <p className="font-medium">{user.emergencyContact.relationship || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Professional Qualifications */}
                    {(user?.qualifications?.length > 0 || user?.certifications?.length > 0 || user?.languagesSpoken?.length > 0) && (
                        <div className="border-t pt-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Professional Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {user?.qualifications?.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">Qualifications</p>
                                        <div className="flex flex-wrap gap-2">
                                            {user.qualifications.map((qualification, index) => (
                                                <Badge key={index} className="bg-blue-100 text-blue-800">
                                                    {qualification}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {user?.certifications?.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">Certifications</p>
                                        <div className="flex flex-wrap gap-2">
                                            {user.certifications.map((certification, index) => (
                                                <Badge key={index} className="bg-green-100 text-green-800">
                                                    {certification}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {user?.languagesSpoken?.length > 0 && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-2">Languages Spoken</p>
                                        <div className="flex flex-wrap gap-2">
                                            {user.languagesSpoken.map((language, index) => (
                                                <Badge key={index} className="bg-purple-100 text-purple-800">
                                                    {language}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Role-Specific Information */}
                    {roleConfig.fields.length > 0 && (
                        <div className="border-t pt-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                {roleConfig.displayName} Specific Information
                            </h4>
                            
                            {/* Debug info */}
                            {Object.keys(roleProfileData).length === 0 && (
                                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <div className="flex items-start space-x-2">
                                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-yellow-800">
                                                No {roleConfig.displayName.toLowerCase()} specific data found
                                            </p>
                                            <p className="text-xs text-yellow-700 mt-1">
                                                Profile key: <code className="bg-yellow-100 px-1 rounded">{roleConfig.profileKey}</code>
                                            </p>
                                            <p className="text-xs text-yellow-700 mt-1">
                                                This data should be added during staff registration or profile update.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {roleConfig.fields.map((field) => {
                                    const value = roleProfileData[field.key];
                                    return (
                                        <div key={field.key}>
                                            <p className="text-sm text-gray-500 mb-1">{field.label}</p>
                                            {renderFieldValue(field, value)}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Photo Upload Modal */}
            {showPhotoUpload && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Update Profile Photo</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowPhotoUpload(false);
                                    setPhotoPreview(null);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-center">
                                <Avatar 
                                    src={photoPreview || user?.profilePhoto} 
                                    alt="Profile preview"
                                    size="xxl"
                                    className="border-2 border-gray-200"
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="profilePhoto">Choose new photo</Label>
                                <Input
                                    id="profilePhoto"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        handlePhotoChange(e);
                                        handlePhotoUpload(e);
                                    }}
                                    disabled={isUploadingPhoto}
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Recommended: Square image, max 5MB
                                </p>
                            </div>
                            
                            {isUploadingPhoto && (
                                <div className="flex items-center justify-center py-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        <span className="text-sm text-gray-600">Uploading...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileTab;