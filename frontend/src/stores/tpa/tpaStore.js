// TPA (Third Party Administrator) management store for insurance claims processing

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useTpaStore = create(
  persist(
    (set, get) => ({
      // Authentication state
      isAuthenticated: false,
      currentUser: null,
      userRole: null, // 'tpa-admin', 'senior-tpa', 'junior-tpa', 'tpa-reviewer'
      
      // Claims data
      claims: [],
      selectedClaim: null,
      claimsFilter: 'all', // 'all', 'pending', 'under-review', 'approved', 'rejected', 'settled'
      
      // Communication data
      communications: [],
      notifications: [],
      
      // Analytics data
      analytics: {
        totalClaims: 0,
        pendingClaims: 0,
        approvedClaims: 0,
        rejectedClaims: 0,
        settledClaims: 0,
        averageProcessingTime: 0,
        approvalRate: 0,
      },
      
      // User preferences
      preferences: {
        dashboardLayout: 'default',
        notificationSettings: {
          email: true,
          push: true,
          sms: false,
        },
        autoRefresh: true,
        refreshInterval: 30000, // 30 seconds
      },
      
      // Actions
      login: (credentials) => {
        // Mock authentication
        const mockUsers = {
          'admin@tpa.com': { 
            id: '1', 
            name: 'Sarah Johnson', 
            role: 'tpa-admin', 
            department: 'Administration',
            approvalLimit: 1000000 
          },
          'senior@tpa.com': { 
            id: '2', 
            name: 'Michael Chen', 
            role: 'senior-tpa', 
            department: 'Claims Processing',
            approvalLimit: 500000 
          },
          'junior@tpa.com': { 
            id: '3', 
            name: 'Emily Davis', 
            role: 'junior-tpa', 
            department: 'Claims Processing',
            approvalLimit: 100000 
          },
          'reviewer@tpa.com': { 
            id: '4', 
            name: 'David Wilson', 
            role: 'tpa-reviewer', 
            department: 'Document Review',
            approvalLimit: 50000 
          },
        };
        
        const user = mockUsers[credentials.email];
        if (user && credentials.password === 'tpa123') {
          set({
            isAuthenticated: true,
            currentUser: user,
            userRole: user.role,
          });
          
          // Initialize mock data
          get().initializeMockData();
          return { success: true, user };
        }
        
        return { success: false, error: 'Invalid credentials' };
      },
      
      logout: () => {
        set({
          isAuthenticated: false,
          currentUser: null,
          userRole: null,
          selectedClaim: null,
        });
      },
      
      initializeMockData: () => {
        const mockClaims = [
          {
            id: 'CLM001',
            patientName: 'Rajesh Kumar',
            patientId: 'PT12345',
            hospitalName: 'Apollo Hospital',
            hospitalId: 'H001',
            policyNumber: 'POL789456',
            insuranceCompany: 'Star Health Insurance',
            treatmentType: 'Cataract Surgery',
            claimAmount: 75000,
            estimatedAmount: 85000,
            status: 'under-review',
            priority: 'high',
            submittedDate: '2024-01-15',
            lastUpdated: '2024-01-20',
            assignedTo: 'Michael Chen',
            documents: [
              { name: 'Policy Card', type: 'pdf', status: 'verified' },
              { name: 'Medical Report', type: 'pdf', status: 'verified' },
              { name: 'Treatment Estimate', type: 'pdf', status: 'pending' },
              { name: 'Patient ID Proof', type: 'pdf', status: 'verified' },
            ],
            timeline: [
              { date: '2024-01-15', action: 'Claim submitted by hospital', user: 'Hospital Staff' },
              { date: '2024-01-16', action: 'Initial review completed', user: 'Emily Davis' },
              { date: '2024-01-20', action: 'Assigned for detailed review', user: 'Michael Chen' },
            ],
            patientDetails: {
              age: 65,
              gender: 'Male',
              phone: '+91-9876543210',
              email: 'rajesh.kumar@email.com',
              address: 'Mumbai, Maharashtra',
            },
            policyDetails: {
              policyType: 'Individual Health',
              coverageAmount: 500000,
              deductible: 10000,
              waitingPeriod: 'Completed',
              policyStartDate: '2022-01-01',
              policyEndDate: '2025-01-01',
            },
          },
          {
            id: 'CLM002',
            patientName: 'Priya Sharma',
            patientId: 'PT12346',
            hospitalName: 'Fortis Hospital',
            hospitalId: 'H002',
            policyNumber: 'POL789457',
            insuranceCompany: 'HDFC ERGO',
            treatmentType: 'Diabetes Management',
            claimAmount: 25000,
            estimatedAmount: 30000,
            status: 'pending',
            priority: 'standard',
            submittedDate: '2024-01-18',
            lastUpdated: '2024-01-18',
            assignedTo: null,
            documents: [
              { name: 'Policy Card', type: 'pdf', status: 'verified' },
              { name: 'Medical Report', type: 'pdf', status: 'pending' },
              { name: 'Lab Reports', type: 'pdf', status: 'pending' },
            ],
            timeline: [
              { date: '2024-01-18', action: 'Claim submitted by hospital', user: 'Hospital Staff' },
            ],
            patientDetails: {
              age: 45,
              gender: 'Female',
              phone: '+91-9876543211',
              email: 'priya.sharma@email.com',
              address: 'Delhi, India',
            },
            policyDetails: {
              policyType: 'Family Health',
              coverageAmount: 300000,
              deductible: 5000,
              waitingPeriod: 'Completed',
              policyStartDate: '2023-01-01',
              policyEndDate: '2026-01-01',
            },
          },
          {
            id: 'CLM003',
            patientName: 'Amit Patel',
            patientId: 'PT12347',
            hospitalName: 'Max Hospital',
            hospitalId: 'H003',
            policyNumber: 'POL789458',
            insuranceCompany: 'Bajaj Allianz',
            treatmentType: 'Heart Surgery',
            claimAmount: 350000,
            estimatedAmount: 400000,
            status: 'approved',
            priority: 'emergency',
            submittedDate: '2024-01-10',
            lastUpdated: '2024-01-22',
            assignedTo: 'Sarah Johnson',
            approvedBy: 'Sarah Johnson',
            approvedDate: '2024-01-22',
            documents: [
              { name: 'Policy Card', type: 'pdf', status: 'verified' },
              { name: 'Medical Report', type: 'pdf', status: 'verified' },
              { name: 'Surgery Report', type: 'pdf', status: 'verified' },
              { name: 'Anesthesia Report', type: 'pdf', status: 'verified' },
            ],
            timeline: [
              { date: '2024-01-10', action: 'Emergency claim submitted', user: 'Hospital Staff' },
              { date: '2024-01-10', action: 'Fast-track review initiated', user: 'Michael Chen' },
              { date: '2024-01-15', action: 'Medical necessity confirmed', user: 'David Wilson' },
              { date: '2024-01-22', action: 'Claim approved', user: 'Sarah Johnson' },
            ],
            patientDetails: {
              age: 55,
              gender: 'Male',
              phone: '+91-9876543212',
              email: 'amit.patel@email.com',
              address: 'Ahmedabad, Gujarat',
            },
            policyDetails: {
              policyType: 'Premium Health',
              coverageAmount: 1000000,
              deductible: 0,
              waitingPeriod: 'Completed',
              policyStartDate: '2021-01-01',
              policyEndDate: '2025-01-01',
            },
          },
        ];
        
        const mockCommunications = [
          {
            id: 'COM001',
            claimId: 'CLM001',
            from: 'Michael Chen',
            to: 'Apollo Hospital',
            message: 'Please provide updated treatment estimate with detailed breakdown.',
            timestamp: '2024-01-20T10:30:00Z',
            type: 'query',
            status: 'sent',
          },
          {
            id: 'COM002',
            claimId: 'CLM003',
            from: 'Sarah Johnson',
            to: 'Bajaj Allianz',
            message: 'Emergency claim CLM003 has been approved for ₹3,50,000.',
            timestamp: '2024-01-22T14:15:00Z',
            type: 'approval',
            status: 'delivered',
          },
        ];
        
        const mockNotifications = [
          {
            id: 'NOT001',
            title: 'New high-priority claim received',
            message: 'Emergency heart surgery claim from Max Hospital requires immediate attention.',
            type: 'urgent',
            timestamp: '2024-01-23T09:00:00Z',
            read: false,
            claimId: 'CLM004',
          },
          {
            id: 'NOT002',
            title: 'Document verification completed',
            message: 'All documents for claim CLM001 have been verified.',
            type: 'info',
            timestamp: '2024-01-22T16:30:00Z',
            read: true,
            claimId: 'CLM001',
          },
        ];
        
        // Calculate analytics
        const totalClaims = mockClaims.length;
        const pendingClaims = mockClaims.filter(c => c.status === 'pending').length;
        const approvedClaims = mockClaims.filter(c => c.status === 'approved').length;
        const rejectedClaims = mockClaims.filter(c => c.status === 'rejected').length;
        const settledClaims = mockClaims.filter(c => c.status === 'settled').length;
        const approvalRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0;
        
        set({
          claims: mockClaims,
          communications: mockCommunications,
          notifications: mockNotifications,
          analytics: {
            totalClaims,
            pendingClaims,
            approvedClaims,
            rejectedClaims,
            settledClaims,
            averageProcessingTime: 3.5, // days
            approvalRate: Math.round(approvalRate),
          },
        });
      },
      
      // Claim management
      selectClaim: (claimId) => {
        const claim = get().claims.find(c => c.id === claimId);
        set({ selectedClaim: claim });
      },
      
      updateClaimStatus: (claimId, newStatus, note = '') => {
        const currentUser = get().currentUser;
        const timestamp = new Date().toISOString();
        
        set(state => ({
          claims: state.claims.map(claim => {
            if (claim.id === claimId) {
              const updatedClaim = {
                ...claim,
                status: newStatus,
                lastUpdated: timestamp.split('T')[0],
                timeline: [
                  ...claim.timeline,
                  {
                    date: timestamp.split('T')[0],
                    action: `Status changed to ${newStatus}${note ? `: ${note}` : ''}`,
                    user: currentUser?.name || 'System',
                  },
                ],
              };
              
              if (newStatus === 'approved') {
                updatedClaim.approvedBy = currentUser?.name;
                updatedClaim.approvedDate = timestamp.split('T')[0];
              }
              
              return updatedClaim;
            }
            return claim;
          }),
        }));
        
        // Update selected claim if it's the one being updated
        if (get().selectedClaim?.id === claimId) {
          const updatedClaim = get().claims.find(c => c.id === claimId);
          set({ selectedClaim: updatedClaim });
        }
        
        // Recalculate analytics
        get().updateAnalytics();
      },
      
      addCommunication: (claimId, message, recipient) => {
        const currentUser = get().currentUser;
        const newCommunication = {
          id: `COM${Date.now()}`,
          claimId,
          from: currentUser?.name || 'TPA User',
          to: recipient,
          message,
          timestamp: new Date().toISOString(),
          type: 'message',
          status: 'sent',
        };
        
        set(state => ({
          communications: [...state.communications, newCommunication],
        }));
      },
      
      markNotificationAsRead: (notificationId) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }));
      },
      
      updateAnalytics: () => {
        const claims = get().claims;
        const totalClaims = claims.length;
        const pendingClaims = claims.filter(c => c.status === 'pending').length;
        const approvedClaims = claims.filter(c => c.status === 'approved').length;
        const rejectedClaims = claims.filter(c => c.status === 'rejected').length;
        const settledClaims = claims.filter(c => c.status === 'settled').length;
        const approvalRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0;
        
        set({
          analytics: {
            totalClaims,
            pendingClaims,
            approvedClaims,
            rejectedClaims,
            settledClaims,
            averageProcessingTime: 3.5,
            approvalRate: Math.round(approvalRate),
          },
        });
      },
      
      updatePreferences: (newPreferences) => {
        set(state => ({
          preferences: { ...state.preferences, ...newPreferences },
        }));
      },
      
      setClaimsFilter: (filter) => {
        set({ claimsFilter: filter });
      },
      
      getFilteredClaims: () => {
        const { claims, claimsFilter } = get();
        if (claimsFilter === 'all') return claims;
        return claims.filter(claim => claim.status === claimsFilter);
      },
      
      getClaimsByStatus: (status) => {
        return get().claims.filter(claim => claim.status === status);
      },
      
      getUnreadNotifications: () => {
        return get().notifications.filter(n => !n.read);
      },
      
      hasPermission: (action, claimAmount = 0) => {
        const { currentUser, userRole } = get();
        if (!currentUser) return false;
        
        const approvalLimit = currentUser.approvalLimit || 0;
        
        switch (action) {
          case 'approve-claim':
            return claimAmount <= approvalLimit;
          case 'reject-claim':
            return ['tpa-admin', 'senior-tpa'].includes(userRole);
          case 'modify-claim':
            return ['tpa-admin', 'senior-tpa'].includes(userRole);
          case 'view-analytics':
            return ['tpa-admin', 'senior-tpa'].includes(userRole);
          case 'manage-users':
            return userRole === 'tpa-admin';
          default:
            return true;
        }
      },
    }),
    {
      name: 'tpa-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
        preferences: state.preferences,
        claims: state.claims,
        communications: state.communications,
        notifications: state.notifications,
        analytics: state.analytics,
      }),
    }
  )
);

export default useTpaStore;