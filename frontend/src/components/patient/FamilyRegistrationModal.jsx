import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin,
  User,
  Heart,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import patientService from '@/services/patientService';

// Form validation schema
const familyMemberSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Please select a gender',
  }),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  allergies: z.string().optional(),
  relationToPatient: z.string().min(1, 'Please specify your relationship to this person'),
});

const FamilyRegistrationModal = ({ 
  trigger, 
  onSuccess, 
  isOpen: externalIsOpen, 
  onClose: externalOnClose 
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalOnClose !== undefined 
    ? (open) => { if (!open) externalOnClose(); } 
    : setInternalIsOpen;
  
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      emergencyRelation: '',
      allergies: '',
      relationToPatient: '',
    },
  });

  const onSubmit = async (values) => {
    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to register family members.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    setRegistrationResult(null);

    try {

      // Process allergies - convert string to array if provided
      const processedValues = {
        ...values,
        allergies: values.allergies ? values.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
      };

      // Call the backend API to register family member
      const response = await patientService.registerFamilyMember(processedValues);


      const { patient, credentials, referralInfo, emailSent } = response.data;

      setRegistrationResult({
        success: true,
        patient: patient,
        credentials: credentials,
        referralInfo: referralInfo,
        emailSent: emailSent
      });

      toast({
        title: "Family Member Registered Successfully!",
        description: (
          <div className="space-y-1">
            <div>{patient.firstName} {patient.lastName} has been registered.</div>
            <div className="text-sm">Patient Number: <span className="font-mono font-semibold">{patient.patientNumber}</span></div>
            <div className="text-sm">MRN: <span className="font-mono">{patient.mrn}</span></div>
            {credentials.password && (
              <div className="text-xs mt-2 p-2 bg-blue-50 rounded">
                <div>Temporary Password: <span className="font-mono font-bold">{credentials.password}</span></div>
                <div className="text-gray-600">{credentials.message}</div>
              </div>
            )}
          </div>
        ),
      });

      // Reset form
      form.reset();

      // Call success callback if provided
      if (onSuccess) {
        onSuccess({
          patient,
          credentials,
          referralInfo,
          emailSent
        });
      }

    } catch (error) {
      
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      
      setRegistrationResult({
        success: false,
        error: errorMessage
      });

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setRegistrationResult(null);
    form.reset();
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const watchedDateOfBirth = form.watch('dateOfBirth');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="inline-flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Register Family Member</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Register Family Member</span>
              </DialogTitle>
              <DialogDescription className="mt-1">
                Register a family member for medical care. They will receive their own patient number and login credentials.
              </DialogDescription>
            </div>
            <button
              onClick={handleClose}
              className="ml-4 mt-0.5 flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        {registrationResult?.success ? (
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Registration Successful!</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Patient Name:</strong> {registrationResult.patient.firstName} {registrationResult.patient.lastName}</p>
                  <p><strong>Patient Number:</strong> {registrationResult.patient.patientNumber}</p>
                  <p><strong>MRN:</strong> {registrationResult.patient.mrn}</p>
                  <p><strong>Status:</strong> <span className="text-green-600">Family member successfully registered</span></p>
                  {registrationResult.credentials && (
                    <div className="mt-3 p-3 bg-white border border-green-200 rounded">
                      <p className="font-medium text-green-800 mb-2">Login Credentials:</p>
                      <p><strong>Patient Number:</strong> <span className="font-mono">{registrationResult.credentials.patientNumber}</span></p>
                      <p><strong>Temporary Password:</strong> <span className="font-mono bg-gray-100 px-1 rounded">{registrationResult.credentials.password}</span></p>
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <p className="text-blue-800">{registrationResult.credentials.message}</p>
                      </div>
                      {registrationResult.emailSent ? (
                        <p className="text-green-600 text-xs mt-1 flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Login credentials sent via email
                        </p>
                      ) : (
                        <p className="text-orange-600 text-xs mt-1 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Please share these credentials manually with the family member
                        </p>
                      )}
                    </div>
                  )}
                  {registrationResult.referralInfo && (
                    <div className="mt-2 text-xs text-gray-600">
                      <p>Registered as family member referral on {new Date(registrationResult.referralInfo.referralDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <DialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </div>
        ) : registrationResult?.success === false ? (
          <div className="space-y-4">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold text-red-800">Registration Failed</h3>
                </div>
                <p className="text-sm text-red-700">{registrationResult.error}</p>
              </CardContent>
            </Card>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRegistrationResult(null)}>
                Try Again
              </Button>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Basic Information</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                        {watchedDateOfBirth && (
                          <p className="text-xs text-gray-600">
                            Age: {calculateAge(watchedDateOfBirth)} years
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="relationToPatient"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship to You *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Father, Mother, Son, Daughter" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Contact Information</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter complete address (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Emergency Contact</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact person name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emergencyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Emergency phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyRelation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Spouse, Parent, Sibling" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Medical Information</span>
                </h3>
                
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Known Allergies</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List any known allergies, separated by commas (optional)" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Important Notice */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Important Information:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• The family member will receive their own patient number and login credentials</li>
                    <li>• If an email is provided, login credentials will be sent automatically</li>
                    <li>• An initial appointment will be scheduled for the new patient</li>
                    <li>• You are registering this person as a family member under your account</li>
                    <li>• Email and phone uniqueness checks are bypassed for family members</li>
                  </ul>
                </CardContent>
              </Card>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register Family Member
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FamilyRegistrationModal;