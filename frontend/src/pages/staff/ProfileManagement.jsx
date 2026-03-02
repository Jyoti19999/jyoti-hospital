import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import NotificationCenter from "@/components/NotificationCenter";
import Loader from "@/components/loader/Loader";
import profileService from "@/services/profileService";

import { toast } from "sonner";
import {
    LogIn,
    LogOut,
    DollarSign,
    FileText,
    CreditCard,
    Calculator,
    TrendingUp,
    Clock,
    Users,
    Calendar,
    Eye,
    AlertTriangle,
    CheckCircle,
    Receipt,
    Building,
    PieChart as PieChartIcon,
    User,
    Edit,
    Save,
    X,
    Mail,
    Phone,
    MapPin,
    UserCheck
} from "lucide-react";

// Helper function to get role-specific field configuration
const getRoleSpecificConfig = (staffType) => {
    const baseProfile = `${staffType.toLowerCase()}Profile`;
    
    switch (staffType.toLowerCase()) {
        case 'accountant':
            return {
                profileKey: 'accountantProfile',
                displayName: 'Accountant',
                fields: {
                    accountingCertifications: {
                        type: 'multiSelect',
                        label: 'Accounting Certifications',
                        options: [
                            { value: 'CPA', label: 'Certified Public Accountant (CPA)' },
                            { value: 'CMA', label: 'Certified Management Accountant (CMA)' },
                            { value: 'CA', label: 'Chartered Accountant (CA)' },
                            { value: 'ACCA', label: 'Association of Chartered Certified Accountants (ACCA)' },
                            { value: 'CFA', label: 'Chartered Financial Analyst (CFA)' },
                            { value: 'CIA', label: 'Certified Internal Auditor (CIA)' }
                        ],
                        badgeColor: 'bg-blue-100 text-blue-800'
                    },
                    softwareProficiency: {
                        type: 'multiSelect',
                        label: 'Software Proficiency',
                        options: [
                            { value: 'Tally', label: 'Tally ERP' },
                            { value: 'QuickBooks', label: 'QuickBooks' },
                            { value: 'SAP', label: 'SAP' },
                            { value: 'Excel', label: 'Microsoft Excel' },
                            { value: 'Zoho Books', label: 'Zoho Books' },
                            { value: 'Busy', label: 'Busy Accounting' },
                            { value: 'Oracle', label: 'Oracle Financials' }
                        ],
                        badgeColor: 'bg-green-100 text-green-800'
                    },
                    specialization: {
                        type: 'select',
                        label: 'Area of Specialization',
                        options: [
                            { value: 'General Accounting', label: 'General Accounting' },
                            { value: 'Tax', label: 'Tax Management' },
                            { value: 'Payroll', label: 'Payroll Management' },
                            { value: 'Audit', label: 'Auditing' },
                            { value: 'Budgeting', label: 'Budgeting & Planning' },
                            { value: 'Cost Accounting', label: 'Cost Accounting' },
                            { value: 'Financial Analysis', label: 'Financial Analysis' }
                        ]
                    },
                    yearsOfExperience: {
                        type: 'number',
                        label: 'Years of Experience',
                        min: 0,
                        max: 50
                    }
                }
            };
        
        case 'receptionist':
            return {
                profileKey: 'receptionistProfile',
                displayName: 'Receptionist',
                fields: {
                    shiftTiming: {
                        type: 'select',
                        label: 'Shift Timing',
                        required: true,
                        options: [
                            { value: 'morning', label: 'Morning' },
                            { value: 'evening', label: 'Evening' },
                            { value: 'night', label: 'Night' },
                            { value: 'rotating', label: 'Rotating' }
                        ]
                    },
                    departmentAssignment: {
                        type: 'select',
                        label: 'Department Assignment',
                        options: [
                            { value: 'main_reception', label: 'Main Reception' },
                            { value: 'specialty_clinic_reception', label: 'Specialty Clinic Reception' },
                            { value: 'emergency_reception', label: 'Emergency Reception' },
                            { value: 'billing_reception', label: 'Billing Reception' }
                        ]
                    },
                    customerServiceExperience: {
                        type: 'number',
                        label: 'Customer Service Experience (Years)',
                        min: 0
                    },
                    languageSupport: {
                        type: 'multiSelect',
                        label: 'Language Support',
                        options: [
                            { value: 'English', label: 'English' },
                            { value: 'Spanish', label: 'Spanish' },
                            { value: 'French', label: 'French' },
                            { value: 'Mandarin', label: 'Mandarin' },
                            { value: 'Hindi', label: 'Hindi' },
                            { value: 'Arabic', label: 'Arabic' },
                            { value: 'Portuguese', label: 'Portuguese' },
                            { value: 'German', label: 'German' }
                        ],
                        badgeColor: 'bg-purple-100 text-purple-800'
                    },
                    computerSkills: {
                        type: 'multiSelect',
                        label: 'Computer Skills',
                        options: [
                            { value: 'Microsoft Office', label: 'Microsoft Office' },
                            { value: 'Hospital Management System', label: 'Hospital Management System' },
                            { value: 'Appointment Scheduling', label: 'Appointment Scheduling' },
                            { value: 'Insurance Verification', label: 'Insurance Verification' },
                            { value: 'Data Entry', label: 'Data Entry' },
                            { value: 'Customer Service Software', label: 'Customer Service Software' }
                        ],
                        badgeColor: 'bg-yellow-100 text-yellow-800'
                    }
                }
            };
        
        default:
            return {
                profileKey: 'generalProfile',
                displayName: staffType,
                fields: {}
            };
    }
};

const ProfileManagement = ({ staffType = 'accountant' }) => {
    const { user, fetchStaffProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Get role-specific configuration
    const roleConfig = getRoleSpecificConfig(staffType);
    const roleProfileData = user?.[roleConfig.profileKey] || {};
    
    const [profileFormData, setProfileFormData] = useState({
        // Basic fields
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        emergencyContact: {
            name: '',
            phone: '',
            relationship: ''
        },
        qualifications: [],
        certifications: [],
        languagesSpoken: [],
        // Role-specific data
        roleSpecificData: {}
    });
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    // Initialize form data with user data
    useEffect(() => {
        if (user) {
            const roleProfile = user[roleConfig.profileKey] || {};
            setProfileFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                gender: user.gender || '',
                address: user.address || '',
                emergencyContact: user.emergencyContact || {
                    name: '',
                    phone: '',
                    relationship: ''
                },
                qualifications: user.qualifications || [],
                certifications: user.certifications || [],
                languagesSpoken: user.languagesSpoken || [],
                roleSpecificData: roleProfile
            });
        }
    }, [user, roleConfig.profileKey]);

    const handleBasicFieldChange = (field, value) => {
        setProfileFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEmergencyContactChange = (field, value) => {
        setProfileFormData(prev => ({
            ...prev,
            emergencyContact: {
                ...prev.emergencyContact,
                [field]: value
            }
        }));
    };

    const handleRoleSpecificChange = (field, value) => {
        setProfileFormData(prev => ({
            ...prev,
            roleSpecificData: {
                ...prev.roleSpecificData,
                [field]: value
            }
        }));
    };

    const handleRoleSpecificArrayChange = (field, value) => {
        if (!profileFormData.roleSpecificData[field].includes(value)) {
            setProfileFormData(prev => ({
                ...prev,
                roleSpecificData: {
                    ...prev.roleSpecificData,
                    [field]: [...prev.roleSpecificData[field], value]
                }
            }));
        }
    };

    const removeRoleSpecificArrayItem = (field, index) => {
        setProfileFormData(prev => ({
            ...prev,
            roleSpecificData: {
                ...prev.roleSpecificData,
                [field]: prev.roleSpecificData[field].filter((_, i) => i !== index)
            }
        }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePhotoFile(file);
            const previewUrl = URL.createObjectURL(file);
            setPhotoPreview(previewUrl);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Upload profile photo first if there's one
            if (profilePhotoFile) {
                await profileService.uploadProfilePhoto(profilePhotoFile);
                toast.success('Profile photo updated successfully');
            }

            // Update profile data
            await profileService.updateStaffProfile(profileFormData);
            toast.success('Profile updated successfully');
            
            // Refresh profile data
            await fetchStaffProfile();
            
            // Reset form state
            setProfilePhotoFile(null);
            setPhotoPreview(null);
            setIsEditing(false);
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setProfilePhotoFile(null);
        setPhotoPreview(null);
        // Reset form data to original user data
        if (user) {
            const roleProfile = user[roleConfig.profileKey] || {};
            setProfileFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
                gender: user.gender || '',
                address: user.address || '',
                emergencyContact: user.emergencyContact || {
                    name: '',
                    phone: '',
                    relationship: ''
                },
                qualifications: user.qualifications || [],
                certifications: user.certifications || [],
                languagesSpoken: user.languagesSpoken || [],
                roleSpecificData: roleProfile
            });
        }
    };

    // Profile View Mode
    const ProfileView = useMemo(() => (
        <div className="space-y-6">
            <Card className="bg-white">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <User className="h-5 w-5 text-blue-600" />
                            <span>Profile Information</span>
                        </CardTitle>
                        <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Profile Photo Display */}
                    <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                            {user?.profilePhoto ? (
                                <img 
                                    src={profileService.getImageUrl(user.profilePhoto)} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover" 
                                />
                            ) : (
                                <User className="h-12 w-12 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">{user?.firstName} {user?.lastName}</h3>
                            <p className="text-lg text-gray-600">{roleConfig.displayName}</p>
                            <p className="text-sm text-gray-500">Employee ID: {user?.employeeId}</p>
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
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
                            <div className="flex items-center space-x-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Date of Birth</p>
                                    <p className="font-medium">
                                        {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <UserCheck className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Gender</p>
                                    <p className="font-medium capitalize">{user?.gender || 'Not provided'}</p>
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

                    {/* Professional Information */}
                    <div className="border-t pt-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Professional Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(roleConfig.fields).map(([fieldKey, fieldConfig]) => {
                                if (fieldConfig.type === 'multiSelect') {
                                    const values = roleProfileData[fieldKey] || [];
                                    return (
                                        <div key={fieldKey}>
                                            <p className="text-sm text-gray-500 mb-2">{fieldConfig.label}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {values.length > 0 ? (
                                                    values.map((value, index) => (
                                                        <Badge key={index} className={fieldConfig.badgeColor || "bg-gray-100 text-gray-800"}>
                                                            {value}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <p className="text-gray-400 text-sm">No {fieldConfig.label.toLowerCase()} added</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                } else if (fieldConfig.type === 'select' || fieldConfig.type === 'number') {
                                    const value = roleProfileData[fieldKey];
                                    return (
                                        <div key={fieldKey}>
                                            <p className="text-sm text-gray-500">{fieldConfig.label}</p>
                                            <p className="font-medium">
                                                {fieldConfig.type === 'number' && fieldKey.includes('experience')
                                                    ? `${value || 0} years`
                                                    : value || 'Not specified'
                                                }
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    ), [user, setIsEditing, roleConfig, roleProfileData]);

    // Profile Edit Mode
    const ProfileEdit = useMemo(() => (
        <div className="space-y-6">
            <Card className="bg-white">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                            <Edit className="h-5 w-5 text-blue-600" />
                            <span>Edit Profile</span>
                        </CardTitle>
                        <div className="flex space-x-2">
                            <Button onClick={handleCancel} variant="outline">
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                                <Save className="h-4 w-4 mr-2" />
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Profile Photo Section */}
                        <div className="space-y-4">
                            <Label>Profile Photo</Label>
                            <div className="flex items-center space-x-4">
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : user?.profilePhoto ? (
                                        <img src={profileService.getImageUrl(user.profilePhoto)} alt="Current" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="h-10 w-10 text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="w-auto"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Upload a new profile photo</p>
                                </div>
                            </div>
                        </div>

                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={profileFormData.firstName}
                                    onChange={(e) => handleBasicFieldChange('firstName', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={profileFormData.lastName}
                                    onChange={(e) => handleBasicFieldChange('lastName', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profileFormData.email}
                                    disabled
                                    className="bg-gray-50"
                                />
                            </div>
                            <div>
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={profileFormData.phone}
                                    onChange={(e) => handleBasicFieldChange('phone', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={profileFormData.dateOfBirth}
                                    onChange={(e) => handleBasicFieldChange('dateOfBirth', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="gender">Gender</Label>
                                <Select value={profileFormData.gender} onValueChange={(value) => handleBasicFieldChange('gender', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={profileFormData.address}
                                onChange={(e) => handleBasicFieldChange('address', e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Emergency Contact */}
                        <div className="space-y-4">
                            <Label>Emergency Contact</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="emergencyName">Name</Label>
                                    <Input
                                        id="emergencyName"
                                        value={profileFormData.emergencyContact.name}
                                        onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="emergencyPhone">Phone</Label>
                                    <Input
                                        id="emergencyPhone"
                                        value={profileFormData.emergencyContact.phone}
                                        onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="emergencyRelationship">Relationship</Label>
                                    <Input
                                        id="emergencyRelationship"
                                        value={profileFormData.emergencyContact.relationship}
                                        onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Role-Specific Fields */}
                        {Object.entries(roleConfig.fields).map(([fieldKey, fieldConfig]) => {
                            if (fieldConfig.type === 'multiSelect') {
                                return (
                                    <div key={fieldKey} className="space-y-4">
                                        <Label>{fieldConfig.label}{fieldConfig.required && ' *'}</Label>
                                        <Select onValueChange={(value) => handleRoleSpecificArrayChange(fieldKey, value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={`Select ${fieldConfig.label.toLowerCase()}`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {fieldConfig.options.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex flex-wrap gap-2">
                                            {(profileFormData.roleSpecificData[fieldKey] || []).map((item, index) => (
                                                <div key={index} className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${fieldConfig.badgeColor || 'bg-gray-100 text-gray-800'}`}>
                                                    {item}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRoleSpecificArrayItem(fieldKey, index)}
                                                        className="ml-1 hover:opacity-70"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            } else if (fieldConfig.type === 'select') {
                                return (
                                    <div key={fieldKey}>
                                        <Label htmlFor={fieldKey}>{fieldConfig.label}{fieldConfig.required && ' *'}</Label>
                                        <Select 
                                            value={profileFormData.roleSpecificData[fieldKey] || ''} 
                                            onValueChange={(value) => handleRoleSpecificChange(fieldKey, value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={`Select ${fieldConfig.label.toLowerCase()}`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {fieldConfig.options.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );
                            } else if (fieldConfig.type === 'number') {
                                return (
                                    <div key={fieldKey}>
                                        <Label htmlFor={fieldKey}>{fieldConfig.label}{fieldConfig.required && ' *'}</Label>
                                        <Input
                                            id={fieldKey}
                                            type="number"
                                            min={fieldConfig.min || 0}
                                            max={fieldConfig.max}
                                            value={profileFormData.roleSpecificData[fieldKey] || ''}
                                            onChange={(e) => handleRoleSpecificChange(fieldKey, parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                );
                            }
                            return null;
                        })}

                        {Object.keys(roleConfig.fields).length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No role-specific fields configured for {roleConfig.displayName}</p>
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    ), [
        handleCancel, 
        handleSubmit, 
        isLoading, 
        photoPreview, 
        user?.profilePhoto, 
        handlePhotoChange, 
        profileFormData, 
        handleBasicFieldChange, 
        handleEmergencyContactChange, 
        handleRoleSpecificArrayChange, 
        removeRoleSpecificArrayItem, 
        handleRoleSpecificChange,
        roleConfig
    ]);

    return isEditing ? ProfileEdit : ProfileView;
};

export default ProfileManagement;