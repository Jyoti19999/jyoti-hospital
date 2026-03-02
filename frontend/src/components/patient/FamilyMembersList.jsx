import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { patientService, usePatientQueries } from '@/services/patientService';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserCheck, 
  LogIn, 
  Calendar,
  Phone,
  Mail,
  UserPlus,
  Clock,
  AlertCircle,
  CheckCircle2,
  User
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FamilyMembersList = ({ onAddFamilyMember }) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const { user, switchUserAccount } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to get current patient's family members (dynamic based on current user)
  const { 
    data: familyData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['patient', 'currentFamilyMembers'],
    queryFn: patientService.getCurrentPatientFamilyMembers,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation to switch to family member account
  const switchToFamilyMutation = useMutation({
    mutationFn: patientService.switchToFamilyMember,
    onMutate: (familyMemberId) => {
      // Set selected member to show loading state
      setSelectedMember(familyMemberId);
      
      // Show switching toast immediately
      toast({
        title: "Switching Account...",
        description: "Please wait while we switch to the family member account.",
      });
    },
    onSuccess: (response) => {
      
      // Update auth context with new user data - ensure we have the right structure
      const familyMemberData = {
        ...response.data.patient,
        role: 'patient', // Ensure role is set
        switchedFrom: response.data.referralInfo?.switchedFrom // Track original patient
      };
      
      // Update user in auth context first using the smooth switching method
      switchUserAccount(familyMemberData);
      
      // Success message
      toast({
        title: "Account Switched Successfully",
        description: `You are now logged in as ${response.data.patient.firstName} ${response.data.patient.lastName}`,
      });
      
      // Wait a brief moment for auth context to stabilize, then invalidate queries
      setTimeout(() => {
        // Only invalidate specific queries, not all patient queries to avoid auth issues
        queryClient.invalidateQueries({ queryKey: ['patient', 'currentFamilyMembers'] });
        queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] });
        queryClient.invalidateQueries({ queryKey: ['patient', 'profile'] });
      }, 150);

      // Clear selected member
      setSelectedMember(null);
    },
    onError: (error) => {
      
      // Clear selected member
      setSelectedMember(null);
      
      toast({
        title: "Failed to Switch Account",
        description: error.message || "Unable to switch to family member account",
        variant: "destructive"
      });
    }
  });

  const handleSwitchToMember = (familyMember) => {
    setSelectedMember(familyMember.id);
    switchToFamilyMutation.mutate(familyMember.id);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (member) => {
    // Check if this member is the currently logged-in user
    if (member.isCurrentPatient || member.id === user?.id) {
      return (
        <Badge variant="default" className="bg-blue-600 text-white">
          <User className="w-3 h-3 mr-1" />
          Current User
        </Badge>
      );
    }
    
    if (member.hasLoggedIn) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending Login
        </Badge>
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Family Members</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Family Members</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load family members: {error?.message}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                className="ml-2"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const familyMembers = familyData?.data?.familyMembers || [];
  const totalCount = familyData?.data?.totalCount || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center space-x-2 text-base">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>Family Members</span>
              {totalCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {totalCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs mt-0.5 hidden sm:block">
              Manage and access accounts of family members you've registered
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onAddFamilyMember}
            className="shrink-0 text-xs px-2 sm:px-3"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline ml-1.5">Add Member</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {familyMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Family Members Yet</h3>
            <p className="text-gray-600 mb-4">
              You haven't registered any family members yet. Add a family member to get started.
            </p>
            <Button onClick={onAddFamilyMember}>
              <UserPlus className="h-4 w-4 mr-2" />
              Register First Family Member
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {familyMembers.map((member, index) => (
              <div key={member.id}>
                <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <Avatar className="h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs sm:text-sm">
                      {getInitials(member.firstName, member.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-0.5">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {member.fullName}
                      </h3>
                      <div className="hidden sm:block">{getStatusBadge(member)}</div>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span className="font-mono">#{member.patientNumber}</span>
                        <span className="flex items-center hidden sm:flex">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(member.registrationDate)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        {member.phone && (
                          <span className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[90px] sm:max-w-none">{member.phone}</span>
                          </span>
                        )}
                        {member.email && (
                          <span className="flex items-center hidden sm:flex">
                            <Mail className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[120px]">{member.email}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center flex-shrink-0">
                    {member.isCurrentPatient || member.id === user?.id ? (
                      <Badge variant="outline" className="text-xs px-1.5 sm:px-2 py-0.5 whitespace-nowrap">
                        <span className="hidden sm:inline">Current Account</span>
                        <span className="sm:hidden">Current</span>
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSwitchToMember(member)}
                        disabled={switchToFamilyMutation.isPending}
                        className="text-xs px-2 sm:px-3 h-7 sm:h-9"
                      >
                        <LogIn className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">
                          {switchToFamilyMutation.isPending && selectedMember === member.id ? 'Switching...' : 'Switch To'}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
                
                {index < familyMembers.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FamilyMembersList;