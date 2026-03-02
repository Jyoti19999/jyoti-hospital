import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { User, Activity, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PatientSidebar = ({ 
    patientData, 
    loading, 
    onPutOnHold, 
    onCompleteExamination, 
    onResumeFromHold 
}) => {
    const [showReasonDialog, setShowReasonDialog] = useState(false);
    const [selectedReasons, setSelectedReasons] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [eyeDropReasons, setEyeDropReasons] = useState([]);
    const [loadingReasons, setLoadingReasons] = useState(false);

    // Fetch eye drop reasons from API
    useEffect(() => {
        const fetchReasons = async () => {
            try {
                setLoadingReasons(true);
                const response = await fetch(`${import.meta.env.VITE_API_URL}/eye-drop-reasons`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch eye drop reasons');
                }

                const data = await response.json();
                setEyeDropReasons(data.data || []);
            } catch (error) {
                toast.error('Failed to load eye drop reasons');
            } finally {
                setLoadingReasons(false);
            }
        };

        fetchReasons();
    }, []);

    const handleReasonToggle = (reason) => {
        setSelectedReasons(prev => 
            prev.includes(reason)
                ? prev.filter(r => r !== reason)
                : [...prev, reason]
        );
    };

    const handleSubmitEyeDrops = async () => {
        if (selectedReasons.length === 0) {
            toast.error('Please select at least one reason');
            return;
        }

        setIsSubmitting(true);
        try {
            await onPutOnHold(selectedReasons);
            setShowReasonDialog(false);
            setSelectedReasons([]);
        } catch (error) {
            // Error is handled in parent component
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-green-600" />
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {patientData.status === 'IN_PROGRESS' && (
                        <>
                            <Button
                                onClick={() => setShowReasonDialog(true)}
                                className="w-full bg-orange-600 hover:bg-orange-700"
                                disabled={loading}
                            >
                                Process Patient
                            </Button>
                            <Button
                                onClick={onCompleteExamination}
                                className="w-full bg-green-600 hover:bg-green-700"
                                disabled={loading}
                            >
                                Complete Examination
                            </Button>
                        </>
                    )}

                    {patientData.status === 'ON_HOLD' && (
                        <>
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                <p className="text-sm text-orange-800 font-medium">
                                    ⏸️ Patient on hold for eye drops
                                </p>
                                <p className="text-xs text-orange-600 mt-1">
                                    {patientData.estimatedResumeTime ?
                                        'Drops applied - waiting for dilation (≈30 min)' :
                                        'Waiting for Receptionist2 to apply drops'
                                    }
                                </p>
                            </div>
                            {patientData.estimatedResumeTime && (
                                <Button
                                    onClick={onResumeFromHold}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    disabled={loading}
                                >
                                    ▶️ Resume Examination
                                </Button>
                            )}
                            {!patientData.estimatedResumeTime && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-800">
                                        📞 Receptionist2 has been notified to apply eye drops
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => toast.info('Save as draft functionality coming soon')}
                    >
                        Save as Draft
                    </Button>
                </CardContent>
            </Card>

            {/* Eye Drop Reason Selection Dialog */}
            <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Select Reason(s) for Eye Drops</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <p className="text-sm text-gray-600 mb-4">
                            Please select one or more reasons for applying eye drops:
                        </p>
                        {loadingReasons ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                                <span className="ml-2 text-sm text-gray-500">Loading reasons...</span>
                            </div>
                        ) : eyeDropReasons.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-sm text-gray-500">No reasons available</p>
                                <p className="text-xs text-gray-400 mt-1">Please contact admin to add reasons</p>
                            </div>
                        ) : (
                            eyeDropReasons.map((reasonObj) => (
                                <div key={reasonObj.id} className="flex items-center space-x-3">
                                    <Checkbox
                                        id={reasonObj.id}
                                        checked={selectedReasons.includes(reasonObj.reason)}
                                        onCheckedChange={() => handleReasonToggle(reasonObj.reason)}
                                    />
                                    <Label
                                        htmlFor={reasonObj.id}
                                        className="text-sm font-normal cursor-pointer flex-1"
                                    >
                                        {reasonObj.reason}
                                    </Label>
                                </div>
                            ))
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowReasonDialog(false);
                                setSelectedReasons([]);
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitEyeDrops}
                            disabled={selectedReasons.length === 0 || isSubmitting}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PatientSidebar;
