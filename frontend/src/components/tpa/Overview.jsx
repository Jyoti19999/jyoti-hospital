import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  User,
  Phone,
  Building,
  Calendar,
  Stethoscope,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { claimService } from '@/services/claimService';
import Loader from '../loader/Loader';

const Overview = () => {
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecentClaims();
  }, []);

  const fetchRecentClaims = async () => {
    try {
      setLoading(true);
      const response = await claimService.getRecentClaims();

      if (response.success) {
        setRecentClaims(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load recent claims',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SETTLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (status) => {
    return status.replace('_', ' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ fontFamily: '"Bricolage Grotesque", sans-serif' }}>
      {/* Recent Claims Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Claims</CardTitle>
          <Button onClick={fetchRecentClaims} variant="outline" size="sm">
            <ArrowRight className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {recentClaims.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <FileText className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500">No recent claims found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-foreground">
                        {claim.patient?.firstName} {claim.patient?.lastName}
                      </h4>
                      <Badge className={getStatusColor(claim.claimStatus)}>
                        {getStatusDisplay(claim.claimStatus)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{claim.patient?.patientNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{claim.patient?.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                        <span>{claim.surgeryTypeDetail?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-gray-400" />
                        <span>{claim.insuranceProvider?.providerName || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Amount: </span>
                        <span className="font-semibold text-gray-700">
                          ₹{claim.claimAmountRequested?.toLocaleString() || '0'}
                        </span>
                      </div>
                      {claim.claimNumber && (
                        <div>
                          <span className="text-gray-500">Claim #: </span>
                          <span className="font-medium text-gray-700">{claim.claimNumber}</span>
                        </div>
                      )}
                      {claim.claimSubmittedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-600">
                            {new Date(claim.claimSubmittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Overview;
