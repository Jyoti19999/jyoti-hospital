// App.jsx - Main Application Component for OHMS (Ophthalmology Hospital Management System) Frontend
import React from "react";

// UI Framework and State Management
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Core Patient Management System Pages
import Index from "./pages/Index";
import PatientLogin from "./pages/PatientLogin";
import PatientRegistration from "./pages/PatientRegistration";
import PatientRegistrationf from "./pages/PatientRegistrationf";
import OptometristDashboard from "./pages/OptometristDashboard";
import DigitalDisplayPage from "./pages/DigitalDisplayPage";
import NotFound from "./pages/NotFound";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminProfile from "./pages/SuperAdminProfile";
import StaffManagement from "./pages/super-admin/StaffManagement";
import DatabaseViewer from "./pages/super-admin/DatabaseViewer";
import NotificationManagement from "./pages/super-admin/NotificationManagement";
import NotificationSettings from "./components/admin/NotificationSettings";
import LetterheadDesigner from "./pages/superadmin/LetterheadDesigner";
import AdditionalSettings from "./pages/superadmin/AdditionalSettings";

// OHMS (Ophthalmology Hospital Management System) Extension Pages
import StaffAuth from "./pages/auth/StaffAuth";
import SelfCheckIn from "./pages/SelfCheckIn";
import KioskCheckIn from "./pages/ohms/KioskCheckIn";
import StaffCheckIn from "./pages/ohms/StaffCheckIn";
import QueueStatus from "./pages/ohms/QueueStatus";
import OphthalmologistDashboard from "./pages/ohms/OphthalmologistDashboard";
import ConsultationRoom from "./pages/ohms/ConsultationRoom";
import PatientObservation from "./pages/ohms/PatientObservation";
import SurgeryDashboard from "./pages/ohms/SurgeryDashboard";
import PostOpMonitoring from "./pages/ohms/PostOpMonitoring";
import BillingIntegration from "./pages/ohms/BillingIntegration";
import AdvancedStaffDashboard from "./pages/ohms/AdvancedStaffDashboard";
import AnalyticsDashboard from "./pages/ohms/AnalyticsDashboard";
import AuditTrail from "./pages/ohms/AuditTrail";

// TPA (Third Party Administrator) Extension Pages
import TPALogin from "./pages/tpa/TPALogin";
import TPADashboard from "./pages/tpa/TPADashboard";
import TPAClaims from "./pages/tpa/TPAClaims";
import TPAReview from "./pages/tpa/TPAReview";
import TPACommunication from "./pages/tpa/TPACommunication";
import TPAAnalytics from "./pages/tpa/TPAAnalytics";

// Custom fonts import
import "./fonts.css";
import Loader from "./components/loader/Loader";

// Authentication
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { generateProtectedStaffRoutes } from "./components/auth/ProtectedStaffRoutes";
import { generateProtectedPatientRoutes } from "./components/auth/ProtectedPatientRoutes";

// React Query client instance for server state management
const queryClient = new QueryClient();

/**
 * Main App Component
 * 
 * Sets up the application context with:
 * - QueryClientProvider for server state management
 * - AuthProvider for authentication state management
 * - TooltipProvider for accessible tooltips
 * - Dual toast notification systems (Toaster & Sonner)
 * - BrowserRouter for client-side routing with authentication-based protection
 */
const App = () => {
  // Listen for auth expiration events
  React.useEffect(() => {
    const handleAuthExpired = (event) => {
      // Show toast notification
      import('react-hot-toast').then(({ toast }) => {
        toast.error(event.detail.message || 'Your session has expired. Please login again.', {
          duration: 3000,
          position: 'top-center',
        });
      });
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          {/* Toast notification systems */}
          <Toaster />
          <Sonner />
          <HotToaster position="top-right" />

          <BrowserRouter>
            <Routes>
              {/* Default route - redirect to staff-auth */}
              <Route path="/" element={<Navigate to="/staff-auth" replace />} />
              
              {/* Super Admin shortcut */}
              <Route path="/admin" element={<Navigate to="/superadmin-login" replace />} />

              {/* Superadmin Dashboard */}
              <Route path="/admin-dashboard" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />

              {/* Authentication Routes */}
              <Route path="/superadmin-login" element={<SuperAdminLogin />} />
              <Route path="/superadmin-profile" element={
                <ProtectedRoute>
                  <SuperAdminProfile />
                </ProtectedRoute>
              } />

              <Route path="/staff-management" element={
                <ProtectedRoute>
                  <StaffManagement />
                </ProtectedRoute>
              } />

              <Route path="/database-viewer" element={
                <ProtectedRoute>
                  <DatabaseViewer />
                </ProtectedRoute>
              } />

              <Route path="/letterhead-designer" element={
                <ProtectedRoute>
                  <LetterheadDesigner />
                </ProtectedRoute>
              } />

              <Route path="/additional-settings" element={
                <ProtectedRoute>
                  <AdditionalSettings />
                </ProtectedRoute>
              } />

              <Route path="/notification-management" element={
                <ProtectedRoute>
                  <NotificationManagement />
                </ProtectedRoute>
              } />

              <Route path="/notification-settings" element={
                <ProtectedRoute>
                  <NotificationSettings />
                </ProtectedRoute>
              } />

              {/* Patient Management Routes - Protected */}
              <Route path="/patient-login" element={<PatientLogin />} />
              <Route path="/patient-registration" element={<PatientRegistration />} />
              <Route path="/patient-registration-quick" element={<PatientRegistrationf />} />

              {/* 👥 Patient Dashboard Routes - All automatically protected */}
              {generateProtectedPatientRoutes()}            <Route path="/test" element={<Loader />} />


              {/* Staff Dashboard Routes */}
              <Route path="/optometrist" element={<OptometristDashboard />} />
              <Route path="/digital-display" element={<DigitalDisplayPage />} />




              {/* Self Check-In - Public route, no auth needed */}
              <Route path="/self-checkin" element={<SelfCheckIn />} />

              {/* OHMS (Ophthalmology Hospital Management System) Extension Routes */}
              <Route path="/kiosk-checkin" element={<KioskCheckIn />} />
              <Route path="/staff-checkin" element={<StaffCheckIn />} />
              <Route path="/queue-status" element={<QueueStatus />} />
              <Route path="/ophthalmologist-dashboard" element={<OphthalmologistDashboard />} />
              <Route path="/consultation-room" element={<ConsultationRoom />} />
              <Route path="/patient-observation" element={<PatientObservation />} />
              <Route path="/surgery-dashboard" element={<SurgeryDashboard />} />
              <Route path="/post-op-monitoring" element={<PostOpMonitoring />} />
              <Route path="/billing-integration" element={<BillingIntegration />} />
              <Route path="/advanced-staff-dashboard" element={<AdvancedStaffDashboard />} />
              <Route path="/analytics-dashboard" element={<AnalyticsDashboard />} />
              <Route path="/audit-trail" element={<AuditTrail />} />

              {/* TPA (Third Party Administrator) Extension Routes */}
              <Route path="/tpa-login" element={<TPALogin />} />

              <Route path="/staff-auth" element={<StaffAuth />} />

              {/* 🏥 Staff Dashboard Routes - All automatically protected */}
              {generateProtectedStaffRoutes()}


              {/* Catch-all route for 404 errors - MUST BE LAST */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
