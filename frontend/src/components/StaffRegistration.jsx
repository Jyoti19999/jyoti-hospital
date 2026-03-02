import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmationDialog from "@/components/ui/confirmation-dialog";
import {
  UserPlus,
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Trash2,
  Power,
  PowerOff,
  Upload,
  FileText,
  X,
  CheckCircle,
  Edit
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Import role-specific field components
import DoctorFields from "./RegistrationSpecificFields/DoctorFields";
import NurseFields from "./RegistrationSpecificFields/NurseFields";
import TechnicianFields from "./RegistrationSpecificFields/TechnicianFields";
import AdminFields from "./RegistrationSpecificFields/AdminFields";
import ReceptionistFields from "./RegistrationSpecificFields/ReceptionistFields";
import OptometristFields from "./RegistrationSpecificFields/OptometristFields";
import AccountantFields from "./RegistrationSpecificFields/AccountantFields";
import QualityCoordinatorFields from "./RegistrationSpecificFields/QualityCoordinatorFields";
import PatientSafetyOfficerFields from "./RegistrationSpecificFields/PatientSafetyOfficerFields";
// Import new OT staff role-specific field components
import OTAdminFields from "./RegistrationSpecificFields/OTAdminFields";
import AnesthesiologistFields from "./RegistrationSpecificFields/AnesthesiologistFields";
import SurgeonFields from "./RegistrationSpecificFields/SurgeonFields";
import SisterFields from "./RegistrationSpecificFields/SisterFields";
// Import TPA role-specific field component
import TPAFields from "./RegistrationSpecificFields/TPAFields";

// Import TanStack Query and services
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { staffService } from '@/services/staffService';
import Loader from '@/components/loader/Loader';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const StaffRegistration = () => {
  const { toast } = useToast();
  const { user, fetchStaffProfile } = useAuth();

  // Fetch staff types dynamically from database
  const { data: staffTypes = [], isLoading: isLoadingStaffTypes } = useQuery({
    queryKey: ['staffTypes'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/staff-types');
      return response.data;
    },
  });

  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [activeTab, setActiveTab] = useState("register");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Delete confirmation dialog states
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');

  // Fetch all staff from database
  useEffect(() => {
    fetchAllStaff();
  }, []);

  const fetchAllStaff = async () => {
    try {
      setLoadingStaff(true);
      const response = await axios.get('/api/v1/super-admin/staff');
      const staffData = response.data.data.staff || response.data.data || [];

      const transformedStaff = staffData.map(s => ({
        id: s.id,
        employeeId: s.employeeId,
        name: `${s.firstName} ${s.lastName}`,
        firstName: s.firstName,
        lastName: s.lastName,
        role: s.staffType,
        department: s.department || 'N/A',
        phone: s.phone || 'N/A',
        email: s.email || 'N/A',
        status: s.isActive ? 'Active' : 'Inactive',
        isActive: s.isActive,
        joinDate: s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : 'N/A'
      }));

      setStaffList(transformedStaff);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive"
      });
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleToggleStatus = async (staffId, currentStatus) => {
    try {
      const endpoint = currentStatus ? 'deactivate' : 'reactivate';
      await axios.patch(`/api/v1/super-admin/staff/${staffId}/${endpoint}`);

      toast({
        title: "Success",
        description: `Staff ${currentStatus ? 'deactivated' : 'activated'} successfully`
      });

      fetchAllStaff(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update staff status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStaffClick = (staff) => {
    setDeletingStaff(staff);
    setDeleteSuccess(false);
    setDeleteError(false);
    setDeleteErrorMessage('');
    setShowDeleteDialog(true);
  };

  const handleDeleteStaffConfirm = async () => {
    if (!deletingStaff) return;

    setDeleteLoading(true);
    try {
      await axios.delete(`/api/v1/super-admin/staff/${deletingStaff.id}`);

      setDeleteSuccess(true);
      setDeleteLoading(false);
      fetchAllStaff();

      // Auto-close after 2 seconds
      setTimeout(() => {
        setShowDeleteDialog(false);
        setDeletingStaff(null);
        setDeleteSuccess(false);
      }, 2000);
    } catch (error) {
      setDeleteLoading(false);
      setDeleteError(true);
      setDeleteErrorMessage(error.response?.data?.error || 'Failed to delete staff member. Please try again.');
    }
  };

  const handleEditStaff = async (staff) => {
    try {
      // Show loading toast
      toast({
        title: "Loading...",
        description: "Fetching staff details for editing"
      });


      // Fetch complete staff details including role-specific data
      const response = await axios.get(`/api/v1/super-admin/staff/${staff.id}`);


      // Extract staff data from response
      const staffData = response.data.data?.staff || response.data.data || response.data;


      // Populate form with staff data
      const formDataToSet = {
        firstName: staffData.firstName || "",
        middleName: staffData.middleName || "",
        lastName: staffData.lastName || "",
        email: staffData.email || "",
        phone: staffData.phone || "",
        dateOfBirth: staffData.dateOfBirth ? staffData.dateOfBirth.split('T')[0] : "",
        gender: staffData.gender || "",
        address: staffData.address || "",
        emergencyContact: staffData.emergencyContact || {
          name: "",
          phone: "",
          relationship: ""
        },
        staffType: staffData.staffType || "",
        department: staffData.department || "",
        employmentStatus: staffData.employmentStatus || "active",
        joiningDate: staffData.joiningDate ? staffData.joiningDate.split('T')[0] : "",
        qualifications: staffData.qualifications || [],
        certifications: staffData.certifications || [],
        languagesSpoken: staffData.languagesSpoken || [],
        roleSpecificData: getRoleSpecificData(staffData) || {},
        documents: []
      };


      setFormData(formDataToSet);

      setIsEditing(true);
      setEditingStaffId(staff.id);

      // Switch to Register Staff tab using controlled state
      setActiveTab("register");

      // Scroll to top after a short delay
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);

      toast({
        title: "Edit Mode Activated",
        description: `Editing ${staff.name}. The form is now populated with their data.`,
        duration: 5000
      });

    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load staff details for editing",
        variant: "destructive"
      });
    }
  };

  // Helper function to extract role-specific data from staff object
  const getRoleSpecificData = (staffData) => {
    // Map staff types to their profile keys
    const profileKeyMap = {
      'doctor': 'doctorProfile',
      'nurse': 'nurseProfile',
      'technician': 'technicianProfile',
      'admin': 'adminProfile',
      'receptionist': 'receptionistProfile',
      'receptionist2': 'receptionist2Profile',
      'optometrist': 'optometristProfile',
      'accountant': 'accountantProfile',
      'quality-coordinator': 'qualityCoordinatorProfile',
      'quality_coordinator': 'qualityCoordinatorProfile',
      'patient-safety-officer': 'patientSafetyOfficerProfile',
      'patient_safety_officer': 'patientSafetyOfficerProfile',
      'ot-admin': 'otAdminProfile',
      'ot_admin': 'otAdminProfile',
      'anesthesiologist': 'anesthesiologistProfile',
      'surgeon': 'surgeonProfile',
      'sister': 'sisterProfile',
      'tpa': 'tpaProfile'
    };

    const profileKey = profileKeyMap[staffData.staffType];
    return staffData[profileKey] || {};
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingStaffId(null);
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      emergencyContact: {
        name: "",
        phone: "",
        relationship: ""
      },
      staffType: "",
      department: "",
      employmentStatus: "",
      joiningDate: "",
      qualifications: [],
      certifications: [],
      languagesSpoken: [],
      roleSpecificData: {},
      documents: []
    });
  };

  const [formData, setFormData] = useState({
    // Basic Information
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: ""
    },

    // Employment Details
    staffType: "",
    department: "",
    employmentStatus: "",
    joiningDate: "",

    // Qualifications & Certifications
    qualifications: [],
    certifications: [],
    languagesSpoken: [],

    // Role-specific data
    roleSpecificData: {},

    // Documents
    documents: []
  });

  // TanStack Query mutation for staff registration
  const registerStaffMutation = useMutation({
    mutationFn: staffService.registerStaff,
    onSuccess: (data) => {
      const emailSent = data.data?.email?.sent;
      const staffName = `${formData.firstName} ${formData.lastName}`;

      toast({
        title: "Staff Registration Successful",
        description: emailSent
          ? `${staffName} has been registered and welcome email with credentials has been sent!`
          : `${staffName} has been registered successfully!`,
        variant: "default",
      });

      // Add to local state for immediate UI update
      const newStaff = {
        id: data.staff?.id || staffList.length + 1,
        name: `${formData.firstName} ${formData.lastName}`,
        role: formData.staffType,
        department: formData.department,
        phone: formData.phone,
        email: formData.email,
        status: formData.employmentStatus === 'active' ? 'Active' : 'Inactive',
        joinDate: formData.joiningDate || new Date().toISOString().split('T')[0]
      };

      setStaffList(prev => [...prev, newStaff]);

      // Reset form after successful registration
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        address: "",
        emergencyContact: {
          name: "",
          phone: "",
          relationship: ""
        },
        staffType: "",
        department: "",
        employmentStatus: "",
        joiningDate: "",
        qualifications: [],
        certifications: [],
        languagesSpoken: [],
        roleSpecificData: {},
        documents: [] // Ensure documents array is properly reset
      });
    },
    onError: (error) => {

      // Extract the server error message
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      }

      // Handle specific HTTP status codes with custom messages
      if (error.status) {
        switch (error.status) {
          case 400:
            errorMessage = error.message || "Invalid data provided. Please check all required fields.";
            break;
          case 401:
            errorMessage = error.message || "Unauthorized. Please check your permissions.";
            break;
          case 403:
            errorMessage = error.message || "Access denied. You don't have permission to register staff.";
            break;
          case 404:
            errorMessage = error.message || "Registration service not found. Please contact support.";
            break;
          case 409:
            errorMessage = error.message || "Staff member with this email already exists.";
            break;
          case 422:
            errorMessage = error.message || "Validation failed. Please check your input data.";
            break;
          case 500:
            errorMessage = error.message || "Server error. Please try again later.";
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = error.message || "Service temporarily unavailable. Please try again later.";
            break;
          default:
            errorMessage = error.message || `Server error (${error.status}). Please try again.`;
        }
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field, value) => {
    // Validation logic
    let validatedValue = value;

    // Name fields validation (firstName, middleName, lastName) - only letters and spaces
    if (field === 'firstName' || field === 'middleName' || field === 'lastName') {
      // Remove any characters that are not letters, spaces, hyphens, or apostrophes
      validatedValue = value.replace(/[^a-zA-Z\s'-]/g, '');


    }

    // Phone number validation - only numbers, max 10 digits
    if (field === 'phone') {
      // Remove any non-digit characters
      validatedValue = value.replace(/\D/g, '');

      // Silently limit to 10 digits (no toast message)
      if (validatedValue.length > 10) {
        validatedValue = validatedValue.slice(0, 10);
      }
    }

    // Email validation - prevent special characters except @ . _ -
    if (field === 'email') {
      // Allow only alphanumeric, @, ., _, -, and +
      validatedValue = value.replace(/[^a-zA-Z0-9@._]/g, '');


    }

    setFormData(prev => ({
      ...prev,
      [field]: validatedValue
    }));
  };

  const handleRoleSpecificChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      roleSpecificData: {
        ...prev.roleSpecificData,
        [field]: value
      }
    }));
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => {
      const currentArray = prev.roleSpecificData[field] || [];
      const newArray = checked
        ? [...currentArray, value]
        : currentArray.filter(item => item !== value);

      return {
        ...prev,
        roleSpecificData: {
          ...prev.roleSpecificData,
          [field]: newArray
        }
      };
    });
  };

  const handleEmergencyContactChange = (field, value) => {
    let validatedValue = value;

    // Phone number validation for emergency contact - only numbers, max 10 digits
    if (field === 'phone') {
      // Remove any non-digit characters
      validatedValue = value.replace(/\D/g, '');

      // Silently limit to 10 digits (no toast message)
      if (validatedValue.length > 10) {
        validatedValue = validatedValue.slice(0, 10);
      }
    }

    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: validatedValue
      }
    }));
  };

  const handleQualificationsChange = (value, checked) => {
    setFormData(prev => {
      const currentArray = prev.qualifications || [];
      const newArray = checked
        ? [...currentArray, value]
        : currentArray.filter(item => item !== value);

      return {
        ...prev,
        qualifications: newArray
      };
    });
  };

  const handleCertificationsChange = (value, checked) => {
    setFormData(prev => {
      const currentArray = prev.certifications || [];
      const newArray = checked
        ? [...currentArray, value]
        : currentArray.filter(item => item !== value);

      return {
        ...prev,
        certifications: newArray
      };
    });
  };

  const handleLanguagesChange = (value, checked) => {
    setFormData(prev => {
      const currentArray = prev.languagesSpoken || [];
      const newArray = checked
        ? [...currentArray, value]
        : currentArray.filter(item => item !== value);

      return {
        ...prev,
        languagesSpoken: newArray
      };
    });
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/svg+xml'
    ];

    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported format. Please upload PDF or image files only.`,
          variant: "destructive",
        });
        return false;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 10MB limit.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      const newDocuments = validFiles.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
        uploadedAt: new Date().toISOString()
      }));

      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...newDocuments]
      }));

      toast({
        title: "Documents Added",
        description: `${validFiles.length} document(s) added successfully.`,
      });
    }

    // Reset the input
    e.target.value = '';
  };

  const removeDocument = (documentId) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.id !== documentId)
    }));

    toast({
      title: "Document Removed",
      description: "Document has been removed from the form.",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Additional validation before submission
    const errors = [];

    // Validate phone number
    if (formData.phone && formData.phone.length !== 10) {
      errors.push('Phone number must be exactly 10 digits');
    }

    // Validate email format
    if (formData.email) {
      const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        errors.push('Please enter a valid email address');
      }
    }

    // Validate name fields - should not be empty and should only contain valid characters
    if (!formData.firstName || !formData.firstName.trim()) {
      errors.push('First name is required');
    }

    if (!formData.lastName || !formData.lastName.trim()) {
      errors.push('Last name is required');
    }

    // Check if names contain only valid characters
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (formData.firstName && !nameRegex.test(formData.firstName)) {
      errors.push('First name can only contain letters, spaces, hyphens, and apostrophes');
    }

    if (formData.middleName && !nameRegex.test(formData.middleName)) {
      errors.push('Middle name can only contain letters, spaces, hyphens, and apostrophes');
    }

    if (formData.lastName && !nameRegex.test(formData.lastName)) {
      errors.push('Last name can only contain letters, spaces, hyphens, and apostrophes');
    }

    // If there are validation errors, show them and stop submission
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: (
          <div className="space-y-1">
            {errors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        ),
        variant: "destructive",
        duration: 5000
      });
      return;
    }

    // Prepare the data structure for backend in the exact format requested
    const staffData = {
      firstName: formData.firstName.trim(),
      middleName: formData.middleName ? formData.middleName.trim() : "",
      lastName: formData.lastName.trim(),
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      address: formData.address,
      emergencyContact: formData.emergencyContact,
      staffType: formData.staffType,
      department: formData.department,
      employmentStatus: formData.employmentStatus,
      joiningDate: formData.joiningDate,
      qualifications: formData.qualifications,
      certifications: formData.certifications,
      languagesSpoken: formData.languagesSpoken,
      roleSpecificData: formData.roleSpecificData,
      documents: formData.documents.map(doc => ({
        name: doc.name,
        type: doc.type,
        size: doc.size,
        uploadedAt: doc.uploadedAt,
        file: doc.file // This will contain the actual file for FormData submission
      }))
    };


    if (isEditing) {
      // Update existing staff
      try {
        await axios.put(`/api/v1/super-admin/staff/${editingStaffId}`, staffData);

        toast({
          title: "Success",
          description: `${formData.firstName} ${formData.lastName} updated successfully!`
        });

        // If the edited staff is the currently logged-in user, refresh their profile
        if (user && user.id === editingStaffId) {
          await fetchStaffProfile();
        }

        // Reset form and editing state
        handleCancelEdit();

        // Refresh staff list
        fetchAllStaff();
      } catch (error) {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to update staff",
          variant: "destructive"
        });
      }
    } else {
      // Use TanStack Query mutation to register new staff
      registerStaffMutation.mutate(staffData);
    }
  };

  const renderRoleSpecificFields = () => {
    switch (formData.staffType) {
      case "doctor":
        return <DoctorFields formData={formData} handleRoleSpecificChange={handleRoleSpecificChange} handleArrayChange={handleArrayChange} />;
      case "nurse":
        return <NurseFields formData={formData} handleRoleSpecificChange={handleRoleSpecificChange} handleArrayChange={handleArrayChange} />;
      case "technician":
        return <TechnicianFields formData={formData} handleRoleSpecificChange={handleRoleSpecificChange} handleArrayChange={handleArrayChange} />;
      case "admin":
        return <AdminFields formData={formData} handleRoleSpecificChange={handleRoleSpecificChange} handleArrayChange={handleArrayChange} />;
      case "receptionist":
        return <ReceptionistFields formData={formData} handleRoleSpecificChange={handleRoleSpecificChange} handleArrayChange={handleArrayChange} />;
      case "receptionist2":
        return <ReceptionistFields formData={formData} handleRoleSpecificChange={handleRoleSpecificChange} handleArrayChange={handleArrayChange} />;
      case "optometrist":
        return <OptometristFields formData={formData} handleRoleSpecificChange={handleRoleSpecificChange} handleArrayChange={handleArrayChange} />;
      case "accountant":
        return <AccountantFields formData={formData} setFormData={setFormData} />;
      case "quality-coordinator":
      case "quality_coordinator":
        return <QualityCoordinatorFields formData={formData} setFormData={setFormData} />;
      case "patient-safety-officer":
      case "patient_safety_officer":
        return <PatientSafetyOfficerFields formData={formData} setFormData={setFormData} />;
      case "ot-admin":
      case "ot_admin":
        return <OTAdminFields formData={formData} handleRoleSpecificChange={handleRoleSpecificChange} handleArrayChange={handleArrayChange} />;
      case "anesthesiologist":
        return <AnesthesiologistFields formData={formData} handleRoleSpecificChange={handleRoleSpecificChange} handleArrayChange={handleArrayChange} />;
      case "surgeon":
        return <SurgeonFields formData={formData} handleRoleSpecificChange={handleRoleSpecificChange} handleArrayChange={handleArrayChange} />;
      case "sister":
        return <SisterFields formData={formData} handleRoleSpecificChange={handleRoleSpecificChange} handleArrayChange={handleArrayChange} />;
      case "tpa":
        return <TPAFields formData={formData} handleRoleSpecificChange={handleRoleSpecificChange} handleArrayChange={handleArrayChange} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      "Active": "bg-green-100 text-green-800 border-green-200",
      "On Leave": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Inactive": "bg-red-100 text-red-800 border-red-200"
    };

    return (
      <Badge className={variants[status] || variants["Active"]}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Staff Management</h2>
            <p className="text-gray-600 mt-1">Register and manage hospital staff members</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Users className="h-3 w-3 mr-1" />
              {staffList.length} Total Staff
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white p-1 rounded-lg shadow-md border mb-6">
            <TabsTrigger value="register" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Register Staff
            </TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Users className="h-4 w-4 mr-2" />
              Manage Staff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <Card className="shadow-sm border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-900">
                    {isEditing ? (
                      <>
                        <Edit className="h-5 w-5 text-orange-600" />
                        <span>Edit Staff Member</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-5 w-5 text-blue-600" />
                        <span>New Staff Registration</span>
                      </>
                    )}
                  </div>
                  {isEditing && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      Editing Mode
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="middleName">Middle Name</Label>
                        <Input
                          id="middleName"
                          value={formData.middleName}
                          onChange={(e) => handleInputChange("middleName", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            className="pl-10"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            type="tel"
                            className="pl-10"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            placeholder="+91-XXXXXXXXXX"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender *</Label>
                        <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="joiningDate">Joining Date *</Label>
                        <Input
                          id="joiningDate"
                          type="date"
                          value={formData.joiningDate}
                          onChange={(e) => handleInputChange("joiningDate", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Textarea
                          id="address"
                          className="pl-10"
                          value={formData.address}
                          onChange={(e) => handleInputChange("address", e.target.value)}
                          rows={2}
                          placeholder="Complete address"
                          required
                        />
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-2">
                      <h4 className="text-md font-medium text-gray-900">Emergency Contact *</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="emergencyName">Name *</Label>
                          <Input
                            id="emergencyName"
                            value={formData.emergencyContact.name}
                            onChange={(e) => handleEmergencyContactChange("name", e.target.value)}
                            placeholder="Contact name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="emergencyPhone">Phone *</Label>
                          <Input
                            id="emergencyPhone"
                            value={formData.emergencyContact.phone}
                            onChange={(e) => handleEmergencyContactChange("phone", e.target.value)}
                            placeholder="+1234567890"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="emergencyRelationship">Relationship *</Label>
                          <Input
                            id="emergencyRelationship"
                            value={formData.emergencyContact.relationship}
                            onChange={(e) => handleEmergencyContactChange("relationship", e.target.value)}
                            placeholder="e.g., spouse, parent"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Employment Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Employment Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="staffType">Staff Type *</Label>
                        <Select value={formData.staffType} onValueChange={(value) => {
                          handleInputChange("staffType", value);
                          // Initialize role-specific data based on the selected role
                          let initialRoleData = {};
                          if (value === "accountant") {
                            initialRoleData = {
                              accountingCertifications: [],
                              softwareProficiency: [],
                              specialization: "",
                              yearsOfExperience: 0
                            };
                          } else if (value === "quality-coordinator") {
                            initialRoleData = {
                              qualityCertifications: [],
                              auditExperience: "",
                              qualityTools: [],
                              yearsInQuality: 0
                            };
                          } else if (value === "patient-safety-officer") {
                            initialRoleData = {
                              safetyCertifications: [],
                              riskAreas: [],
                              investigationExperience: false,
                              yearsInSafety: 0
                            };
                          } else if (value === "ot-admin" || value === "ot_admin") {
                            initialRoleData = {
                              otLicenseNumber: "",
                              adminCertification: "",
                              otRoomsManaged: 0,
                              shiftSchedule: "",
                              yearsOfExperience: 0,
                              emergencyAvailability: false,
                              specializations: [],
                              equipmentExpertise: [],
                              responsibilities: [],
                              canAuthorizeEmergency: false,
                              maxDailySurgeries: 0
                            };
                          } else if (value === "anesthesiologist") {
                            initialRoleData = {
                              medicalLicenseNumber: "",
                              anesthesiaCertification: "",
                              medicalCouncil: "",
                              licenseExpiry: "",
                              yearsOfExperience: 0,
                              specializations: [],
                              anesthesiaTechniques: [],
                              emergencyProcedures: [],
                              consultationFee: 0,
                              availableHours: "",
                              equipmentProficiency: []
                            };
                          } else if (value === "surgeon") {
                            initialRoleData = {
                              medicalLicenseNumber: "",
                              surgicalCertification: "",
                              medicalCouncil: "",
                              surgeryFee: 0,
                              yearsOfExperience: 0,
                              maxSurgeriesPerDay: 0,
                              surgeryHours: "",
                              emergencyAvailable: false,
                              specializations: [],
                              surgicalProcedures: [],
                              equipmentExpertise: []
                            };
                          } else if (value === "sister") {
                            initialRoleData = {
                              nursingRegistrationNumber: "",
                              nursingCouncil: "",
                              nursingQualification: "",
                              otExperienceLevel: "",
                              yearsOfExperience: 0,
                              shiftType: "",
                              specializations: [],
                              responsibilities: [],
                              teamSize: 0,
                              emergencyTraining: [],
                              leadershipExperience: 0
                            };
                          } else {
                            initialRoleData = {};
                          }
                          handleInputChange("roleSpecificData", initialRoleData);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Staff Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingStaffTypes ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                Loading staff types...
                              </div>
                            ) : staffTypes.length === 0 ? (
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                No staff types available. Please add staff types first.
                              </div>
                            ) : (
                              staffTypes.map((type) => (
                                <SelectItem key={type.id} value={type.type}>
                                  {type.type}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="department">Department *</Label>
                        <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ophthalmology">Ophthalmology</SelectItem>
                            <SelectItem value="optometry">Optometry</SelectItem>
                            <SelectItem value="administration">Administration</SelectItem>
                            <SelectItem value="reception">Reception</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                            <SelectItem value="surgery">Surgery</SelectItem>
                            <SelectItem value="operation-theatre">Operation Theatre</SelectItem>
                            <SelectItem value="anesthesia">Anesthesia Department</SelectItem>
                            <SelectItem value="nursing">Nursing Department</SelectItem>
                            <SelectItem value="accounts">Accounts & Finance</SelectItem>
                            <SelectItem value="quality-management">Quality Management</SelectItem>
                            <SelectItem value="patient-safety">Patient Safety</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employmentStatus">Employment Status *</Label>
                        <Select value={formData.employmentStatus} onValueChange={(value) => handleInputChange("employmentStatus", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Employment Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="on-leave">On Leave</SelectItem>
                            <SelectItem value="terminated">Terminated</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="joiningDate">Joining Date *</Label>
                        <Input
                          id="joiningDate"
                          type="date"
                          value={formData.joiningDate}
                          onChange={(e) => handleInputChange("joiningDate", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Qualifications Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Qualifications *</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {["MS Ophthalmology", "MBBS", "MDS", "B.Sc Nursing", "M.Sc Nursing", "Diploma in Nursing", "Pharm D", "B.Pharm", "M.Pharm"].map((qualification) => (
                        <div key={qualification} className="flex items-center space-x-2">
                          <Checkbox
                            id={qualification}
                            checked={formData.qualifications.includes(qualification)}
                            onCheckedChange={(checked) => handleQualificationsChange(qualification, checked)}
                          />
                          <Label htmlFor={qualification} className="text-sm">{qualification}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Certifications *</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {["Board Certified Ophthalmologist", "Registered Nurse", "Certified Medical Assistant", "ACLS Certified", "PALS Certified", "Radiologic Technologist"].map((certification) => (
                        <div key={certification} className="flex items-center space-x-2">
                          <Checkbox
                            id={certification}
                            checked={formData.certifications.includes(certification)}
                            onCheckedChange={(checked) => handleCertificationsChange(certification, checked)}
                          />
                          <Label htmlFor={certification} className="text-sm">{certification}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Languages Spoken Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Languages Spoken *</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi"].map((language) => (
                        <div key={language} className="flex items-center space-x-2">
                          <Checkbox
                            id={language}
                            checked={formData.languagesSpoken.includes(language)}
                            onCheckedChange={(checked) => handleLanguagesChange(language, checked)}
                          />
                          <Label htmlFor={language} className="text-sm">{language}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Role-specific Fields Section */}
                  {formData.staffType && (
                    <div className="border-t pt-6">
                      {renderRoleSpecificFields()}
                    </div>
                  )}

                  {/* Document Upload Section */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Document Upload</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="documents" className="text-sm font-medium text-gray-700">
                          Upload Documents (PDF, Images) - Optional
                        </Label>
                        <p className="text-xs text-gray-500 mb-2">
                          Accepted formats: PDF, JPEG, PNG, GIF, BMP, WebP, SVG (Max: 10MB per file)
                        </p>
                        <div className="mt-2">
                          <input
                            id="documents"
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg,image/*,application/pdf"
                            onChange={handleDocumentUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('documents').click()}
                            className="w-full h-20 border-dashed border-2 border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center gap-2"
                          >
                            <Upload className="h-6 w-6 text-gray-400" />
                            <span className="text-sm text-gray-600">Click to upload documents</span>
                            <span className="text-xs text-gray-400">or drag and drop files here</span>
                          </Button>
                        </div>
                      </div>

                      {/* Display uploaded documents */}
                      {formData.documents && formData.documents.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Uploaded Documents ({formData.documents.length})</h4>
                          <div className="grid gap-2">
                            {formData.documents.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    {doc.type === 'application/pdf' ? (
                                      <FileText className="h-8 w-8 text-red-500" />
                                    ) : doc.file ? (
                                      <img
                                        src={URL.createObjectURL(doc.file)}
                                        alt={doc.name}
                                        className="h-8 w-8 object-cover rounded border"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <FileText className="h-8 w-8 text-gray-500" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(doc.size)} • {doc.type.split('/')[1].toUpperCase()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDocument(doc.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData({
                        firstName: "",
                        middleName: "",
                        lastName: "",
                        email: "",
                        phone: "",
                        dateOfBirth: "",
                        gender: "",
                        address: "",
                        emergencyContact: {
                          name: "",
                          phone: "",
                          relationship: ""
                        },
                        staffType: "",
                        department: "",
                        employmentStatus: "",
                        joiningDate: "",
                        qualifications: [],
                        certifications: [],
                        languagesSpoken: [],
                        roleSpecificData: {},
                        documents: []
                      })}
                    >
                      Clear Form
                    </Button>
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Edit
                      </Button>
                    )}
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={registerStaffMutation.isPending}>
                      {registerStaffMutation.isPending ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4">
                            <Loader color="#ffffff" />
                          </div>
                          <span>{isEditing ? 'Updating Staff...' : 'Registering Staff...'}</span>
                        </div>
                      ) : (
                        <>
                          {isEditing ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Update Staff
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Register Staff
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span>Staff Directory</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input className="pl-10 w-64" placeholder="Search staff..." />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingStaff ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading staff members...</p>
                  </div>
                ) : staffList.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>No staff members found</p>
                    <p className="text-sm mt-2">Register your first staff member using the form above</p>
                  </div>
                ) : (
                  <>
                    {/* Table View */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ID</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Department</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffList
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((staff) => (
                              <tr key={staff.id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {staff.employeeId || staff.id}
                                </td>
                                <td className="py-3 px-4 text-sm font-medium text-gray-900">
                                  {staff.name}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {staff.role}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {staff.department}
                                </td>
                                <td className="py-3 px-4">
                                  {getStatusBadge(staff.status)}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditStaff(staff)}
                                      title="Edit staff details"
                                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleStatus(staff.id, staff.isActive)}
                                      title={staff.isActive ? "Deactivate staff" : "Activate staff"}
                                      className={`h-8 w-8 p-0 ${staff.isActive ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}
                                    >
                                      {staff.isActive ? (
                                        <PowerOff className="h-4 w-4" />
                                      ) : (
                                        <Power className="h-4 w-4" />
                                      )}
                                    </Button>
                                    {/* <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteStaffClick(staff)}
                                    title="Delete staff"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button> */}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {staffList.length > itemsPerPage && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, staffList.length)} of {staffList.length} staff members
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
                            {Array.from({ length: Math.ceil(staffList.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
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
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(staffList.length / itemsPerPage), prev + 1))}
                            disabled={currentPage === Math.ceil(staffList.length / itemsPerPage)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Staff Confirmation Dialog */}
        <ConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeleteStaffConfirm}
          onCancel={() => {
            setShowDeleteDialog(false);
            setDeletingStaff(null);
            setDeleteSuccess(false);
            setDeleteError(false);
            setDeleteErrorMessage('');
          }}
          title="Delete Staff Member"
          description={`Are you sure you want to delete ${deletingStaff?.name}? This action cannot be undone and will remove all associated records.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          loading={deleteLoading}
          loadingText="Deleting..."
          showData={false}
          success={deleteSuccess}
          successTitle="Deleted Successfully"
          successMessage="The staff member has been deleted successfully along with all associated records."
          successButtonText="Close"
          error={deleteError}
          errorTitle="Deletion Failed"
          errorMessage={deleteErrorMessage}
          errorButtonText="Close"
        />
      </div>
    </div>
  );
};

export default StaffRegistration;
