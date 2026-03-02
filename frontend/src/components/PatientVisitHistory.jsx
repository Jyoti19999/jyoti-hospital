import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    FileText, 
    Calendar, 
    Eye, 
    Pill, 
    Stethoscope, 
    ChevronDown, 
    ChevronUp,
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    User,
    ClipboardList,
    TestTube,
    Microscope
} from "lucide-react";

// Helper component to display eye measurements
const EyeMeasurement = ({ label, rightEye, leftEye, unit = "" }) => {
    const hasValues = (rightEye !== null && rightEye !== undefined && rightEye !== "") || 
                     (leftEye !== null && leftEye !== undefined && leftEye !== "");
    
    if (!hasValues) return null;
    
    return (
        <div className="grid grid-cols-3 gap-2 text-sm py-1 border-b border-gray-100 last:border-0">
            <div className="font-medium text-gray-700">{label}</div>
            <div className="text-gray-600">
                <span className="text-xs text-gray-500">OD: </span>
                {rightEye !== null && rightEye !== undefined && rightEye !== "" ? `${rightEye}${unit}` : '-'}
            </div>
            <div className="text-gray-600">
                <span className="text-xs text-gray-500">OS: </span>
                {leftEye !== null && leftEye !== undefined && leftEye !== "" ? `${leftEye}${unit}` : '-'}
            </div>
        </div>
    );
};

// Helper component to display section data
const DataSection = ({ title, icon: Icon, children, badge }) => {
    if (!children) return null;
    
    return (
        <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-sm flex items-center text-gray-800">
                    {Icon && <Icon className="h-4 w-4 mr-2" />}
                    {title}
                </h5>
                {badge && badge}
            </div>
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
};

const PatientVisitHistory = ({ patientId }) => {
    const [loading, setLoading] = useState(true);
    const [visitHistory, setVisitHistory] = useState(null);
    const [expandedVisits, setExpandedVisits] = useState(new Set());

    useEffect(() => {
        if (patientId) {
            fetchVisitHistory();
        }
    }, [patientId]);

    const fetchVisitHistory = async () => {
        try {
            setLoading(true);

            if (!patientId) {
                setLoading(false);
                return;
            }

            
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/patients/visit-history/${patientId}`,
                {
                    credentials: 'include', // Send cookies automatically
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
 
            const data = await response.json();
            
            
            if (data.success) {
                // Log each visit in detail
                if (data.data?.visits) {
                    data.data.visits.forEach((visit, index) => {
                        
                        // Log first examination if exists
                        if (visit.ophthalmologistExaminations?.[0]) {
                        }
                        
                        // Log first diagnosis if exists
                        if (visit.diagnoses?.[0]) {
                        }
                        
                        // Log first prescription if exists
                        if (visit.prescriptions?.[0]) {
                        }
                    });
                }
                
                setVisitHistory(data.data);
            } else {
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const toggleVisitExpansion = (visitId) => {
        const newExpanded = new Set(expandedVisits);
        if (newExpanded.has(visitId)) {
            newExpanded.delete(visitId);
        } else {
            newExpanded.add(visitId);
        }
        setExpandedVisits(newExpanded);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!patientId) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
                    <p className="text-gray-600">No patient selected. Please select a patient to view visit history.</p>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading visit history...</span>
                </CardContent>
            </Card>
        );
    }

    if (!visitHistory || !visitHistory.visits || visitHistory.visits.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-gray-400" />
                        Medical Visit History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            No Prior Medical History
                        </h3>
                        <p className="text-gray-500">
                            This patient has no completed visits on record.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-600">
                                {visitHistory.totalVisits}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Total Visits</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-indigo-600">
                                {visitHistory.summary.totalDiagnoses}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Diagnoses</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600">
                                {visitHistory.summary.totalPrescriptions}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Prescriptions</div>
                        </div>
                    </div>
                    {visitHistory.summary.lastVisitDate && (
                        <div className="mt-4 text-center text-sm text-gray-600">
                            Last Visit: {formatDate(visitHistory.summary.lastVisitDate)}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Visit History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-600" />
                        Visit History ({visitHistory.totalVisits} visits)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {visitHistory.visits.map((visit) => {
                        const isExpanded = expandedVisits.has(visit.visitId);
                        
                        // Log visit being rendered
                        
                        return (
                            <Card key={visit.visitId} className="border-l-4 border-l-blue-500">
                                <CardContent className="p-4">
                                    {/* Visit Header */}
                                    <div 
                                        className="flex items-center justify-between cursor-pointer"
                                        onClick={() => toggleVisitExpansion(visit.visitId)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge variant="outline" className="text-blue-700 border-blue-300">
                                                    Visit #{visit.visitNumber}
                                                </Badge>
                                                <span className="text-sm text-gray-600">
                                                    <Calendar className="h-4 w-4 inline mr-1" />
                                                    {formatDate(visit.visitDate)}
                                                </span>
                                                {visit.visitType && (
                                                    <Badge variant="secondary">{visit.visitType}</Badge>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-start gap-2">
                                                <Stethoscope className="h-4 w-4 text-gray-500 mt-1" />
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        Chief Complaint: {
                                                            visit.chiefComplaint !== null && visit.chiefComplaint !== undefined
                                                                ? (typeof visit.chiefComplaint === 'string' 
                                                                    ? visit.chiefComplaint 
                                                                    : JSON.stringify(visit.chiefComplaint))
                                                                : 'Not specified'
                                                        }
                                                    </p>
                                                    {visit.doctor && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Doctor: Dr. {visit.doctor.name}
                                                            {visit.doctor.staffType && 
                                                                ` (${visit.doctor.staffType})`
                                                            }
                                                            {visit.doctor.specialization && 
                                                                ` - ${visit.doctor.specialization}`
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <Button variant="ghost" size="sm">
                                            {isExpanded ? (
                                                <ChevronUp className="h-5 w-5" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5" />
                                            )}
                                        </Button>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="mt-4 space-y-4 border-t pt-4">
                                            {/* Visit Details */}
                                            {visit.presentingSymptoms !== null && visit.presentingSymptoms !== undefined && (
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <h4 className="font-semibold text-sm mb-2">Presenting Symptoms</h4>
                                                    <div className="text-sm text-gray-700">
                                                        {typeof visit.presentingSymptoms === 'string' 
                                                            ? visit.presentingSymptoms 
                                                            : JSON.stringify(visit.presentingSymptoms, null, 2)
                                                        }
                                                    </div>
                                                </div>
                                            )}

                                            {/* Optometrist Examination */}
                                            {visit.optometristExamination && (
                                                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
                                                    <CardHeader className="pb-3">
                                                        <CardTitle className="text-base flex items-center justify-between">
                                                            <span className="flex items-center">
                                                                <Eye className="h-5 w-5 mr-2 text-blue-600" />
                                                                Optometrist Examination
                                                            </span>
                                                            {visit.optometristExamination.optometrist && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    <User className="h-3 w-3 mr-1" />
                                                                    {visit.optometristExamination.optometrist.name}
                                                                </Badge>
                                                            )}
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3">
                                                        {/* Visual Acuity */}
                                                        {(visit.optometristExamination.visualAcuity.ucvaOD || 
                                                          visit.optometristExamination.visualAcuity.ucvaOS ||
                                                          visit.optometristExamination.visualAcuity.bcvaOD ||
                                                          visit.optometristExamination.visualAcuity.bcvaOS) && (
                                                            <DataSection title="Visual Acuity" icon={Eye}>
                                                                <EyeMeasurement 
                                                                    label="UCVA"
                                                                    rightEye={visit.optometristExamination.visualAcuity.ucvaOD}
                                                                    leftEye={visit.optometristExamination.visualAcuity.ucvaOS}
                                                                />
                                                                <EyeMeasurement 
                                                                    label="BCVA"
                                                                    rightEye={visit.optometristExamination.visualAcuity.bcvaOD}
                                                                    leftEye={visit.optometristExamination.visualAcuity.bcvaOS}
                                                                />
                                                            </DataSection>
                                                        )}

                                                        {/* Refraction */}
                                                        {(visit.optometristExamination.refraction.rightEye.sphere !== null ||
                                                          visit.optometristExamination.refraction.leftEye.sphere !== null) && (
                                                            <DataSection title="Refraction" icon={TestTube}>
                                                                <EyeMeasurement 
                                                                    label="Sphere"
                                                                    rightEye={visit.optometristExamination.refraction.rightEye.sphere}
                                                                    leftEye={visit.optometristExamination.refraction.leftEye.sphere}
                                                                    unit=" D"
                                                                />
                                                                <EyeMeasurement 
                                                                    label="Cylinder"
                                                                    rightEye={visit.optometristExamination.refraction.rightEye.cylinder}
                                                                    leftEye={visit.optometristExamination.refraction.leftEye.cylinder}
                                                                    unit=" D"
                                                                />
                                                                <EyeMeasurement 
                                                                    label="Axis"
                                                                    rightEye={visit.optometristExamination.refraction.rightEye.axis}
                                                                    leftEye={visit.optometristExamination.refraction.leftEye.axis}
                                                                    unit="°"
                                                                />
                                                            </DataSection>
                                                        )}

                                                        {/* IOP */}
                                                        {(visit.optometristExamination.iop.iopOD || visit.optometristExamination.iop.iopOS) && (
                                                            <DataSection 
                                                                title="Intraocular Pressure" 
                                                                icon={Activity}
                                                                badge={
                                                                    visit.optometristExamination.iop.iopMethod && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {visit.optometristExamination.iop.iopMethod}
                                                                        </Badge>
                                                                    )
                                                                }
                                                            >
                                                                <EyeMeasurement 
                                                                    label="IOP"
                                                                    rightEye={visit.optometristExamination.iop.iopOD}
                                                                    leftEye={visit.optometristExamination.iop.iopOS}
                                                                    unit=" mmHg"
                                                                />
                                                            </DataSection>
                                                        )}

                                                        {/* Additional Tests */}
                                                        {visit.optometristExamination.additionalTests && (
                                                            <DataSection title="Additional Tests" icon={ClipboardList}>
                                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                                    {visit.optometristExamination.colorVision && (
                                                                        <div>
                                                                            <span className="font-medium">Color Vision: </span>
                                                                            <span className="text-gray-700">{visit.optometristExamination.colorVision}</span>
                                                                        </div>
                                                                    )}
                                                                    {visit.optometristExamination.pupilReaction && (
                                                                        <div>
                                                                            <span className="font-medium">Pupil Reaction: </span>
                                                                            <span className="text-gray-700">{visit.optometristExamination.pupilReaction}</span>
                                                                        </div>
                                                                    )}
                                                                    {visit.optometristExamination.eyeAlignment && (
                                                                        <div>
                                                                            <span className="font-medium">Eye Alignment: </span>
                                                                            <span className="text-gray-700">{visit.optometristExamination.eyeAlignment}</span>
                                                                        </div>
                                                                    )}
                                                                    {visit.optometristExamination.additionalTests.coverTest && (
                                                                        <div>
                                                                            <span className="font-medium">Cover Test: </span>
                                                                            <span className="text-gray-700">{visit.optometristExamination.additionalTests.coverTest}</span>
                                                                        </div>
                                                                    )}
                                                                    {visit.optometristExamination.additionalTests.extraocularMovements && (
                                                                        <div>
                                                                            <span className="font-medium">EOM: </span>
                                                                            <span className="text-gray-700">{visit.optometristExamination.additionalTests.extraocularMovements}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </DataSection>
                                                        )}

                                                        {/* Slit Lamp / Anterior Segment */}
                                                        {visit.optometristExamination.clinicalDetails?.slitLampFindings && (
                                                            <DataSection title="Slit Lamp Findings" icon={Microscope}>
                                                                {Object.entries(visit.optometristExamination.clinicalDetails.slitLampFindings).map(([key, value]) => (
                                                                    <EyeMeasurement 
                                                                        key={key}
                                                                        label={key.charAt(0).toUpperCase() + key.slice(1)}
                                                                        rightEye={value.rightEye}
                                                                        leftEye={value.leftEye}
                                                                    />
                                                                ))}
                                                            </DataSection>
                                                        )}

                                                        {/* Clinical Notes */}
                                                        {(visit.optometristExamination.preliminaryDiagnosis || visit.optometristExamination.clinicalNotes || visit.optometristExamination.additionalNotes) && (
                                                            <DataSection title="Clinical Notes" icon={FileText}>
                                                                {visit.optometristExamination.preliminaryDiagnosis && (
                                                                    <div className="text-sm mb-2">
                                                                        <span className="font-medium">Preliminary Diagnosis: </span>
                                                                        <span className="text-gray-700">{visit.optometristExamination.preliminaryDiagnosis}</span>
                                                                    </div>
                                                                )}
                                                                {visit.optometristExamination.clinicalNotes && (
                                                                    <div className="text-sm mb-2 italic text-gray-700">
                                                                        "{visit.optometristExamination.clinicalNotes}"
                                                                    </div>
                                                                )}
                                                                {visit.optometristExamination.additionalNotes && (
                                                                    <div className="text-sm text-gray-700">
                                                                        {visit.optometristExamination.additionalNotes}
                                                                    </div>
                                                                )}
                                                            </DataSection>
                                                        )}

                                                        {/* Known Allergies */}
                                                        {visit.optometristExamination.knownAllergies?.length > 0 && (
                                                            <DataSection title="Known Allergies" icon={AlertCircle}>
                                                                <div className="space-y-1">
                                                                    {visit.optometristExamination.knownAllergies.map((allergy) => (
                                                                        <div key={allergy.id} className="flex items-center gap-2 text-sm">
                                                                            <Badge variant="destructive" className="text-xs">{allergy.severity}</Badge>
                                                                            <span className="font-medium">{allergy.name}</span>
                                                                            <span className="text-gray-600">- {allergy.reaction}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </DataSection>
                                                        )}

                                                        <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
                                                            Completed: {formatDateTime(visit.optometristExamination.completedAt)}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {/* Ophthalmologist Examinations */}
                                            {visit.ophthalmologistExaminations.length > 0 && (
                                                <div className="space-y-3">
                                                    <h4 className="font-semibold flex items-center text-lg">
                                                        <Activity className="h-5 w-5 mr-2 text-green-600" />
                                                        Ophthalmologist Examinations ({visit.ophthalmologistExaminations.length})
                                                    </h4>
                                                    {visit.ophthalmologistExaminations.map((exam, idx) => (
                                                        <Card key={exam.id} className="bg-gradient-to-br from-green-50 to-emerald-50">
                                                            <CardHeader className="pb-3">
                                                                <CardTitle className="text-base flex items-center justify-between">
                                                                    <span className="flex items-center">
                                                                        <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
                                                                        Examination #{idx + 1}
                                                                    </span>
                                                                    <div className="flex gap-2">
                                                                        {exam.surgeryRecommended && (
                                                                            <Badge className="bg-orange-600 text-xs">
                                                                                Surgery Recommended
                                                                            </Badge>
                                                                        )}
                                                                        {exam.doctor && (
                                                                            <Badge variant="secondary" className="text-xs">
                                                                                <User className="h-3 w-3 mr-1" />
                                                                                Dr. {exam.doctor.name}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent className="space-y-3">
                                                                {/* Visual Acuity */}
                                                                {(exam.visualAcuity.ucvaOD || exam.visualAcuity.ucvaOS || 
                                                                  exam.visualAcuity.bcvaOD || exam.visualAcuity.bcvaOS ||
                                                                  exam.visualAcuity.distanceOD || exam.visualAcuity.nearOD) && (
                                                                    <DataSection title="Visual Acuity" icon={Eye}>
                                                                        <EyeMeasurement 
                                                                            label="UCVA"
                                                                            rightEye={exam.visualAcuity.ucvaOD}
                                                                            leftEye={exam.visualAcuity.ucvaOS}
                                                                        />
                                                                        <EyeMeasurement 
                                                                            label="BCVA"
                                                                            rightEye={exam.visualAcuity.bcvaOD}
                                                                            leftEye={exam.visualAcuity.bcvaOS}
                                                                        />
                                                                        <EyeMeasurement 
                                                                            label="Distance"
                                                                            rightEye={exam.visualAcuity.distanceOD}
                                                                            leftEye={exam.visualAcuity.distanceOS}
                                                                        />
                                                                        <EyeMeasurement 
                                                                            label="Near"
                                                                            rightEye={exam.visualAcuity.nearOD}
                                                                            leftEye={exam.visualAcuity.nearOS}
                                                                        />
                                                                    </DataSection>
                                                                )}

                                                                {/* Refraction */}
                                                                {(exam.refraction.rightEye.sphere !== null || exam.refraction.leftEye.sphere !== null) && (
                                                                    <DataSection title="Refraction" icon={TestTube}>
                                                                        <EyeMeasurement 
                                                                            label="Sphere"
                                                                            rightEye={exam.refraction.rightEye.sphere}
                                                                            leftEye={exam.refraction.leftEye.sphere}
                                                                            unit=" D"
                                                                        />
                                                                        <EyeMeasurement 
                                                                            label="Cylinder"
                                                                            rightEye={exam.refraction.rightEye.cylinder}
                                                                            leftEye={exam.refraction.leftEye.cylinder}
                                                                            unit=" D"
                                                                        />
                                                                        <EyeMeasurement 
                                                                            label="Axis"
                                                                            rightEye={exam.refraction.rightEye.axis}
                                                                            leftEye={exam.refraction.leftEye.axis}
                                                                            unit="°"
                                                                        />
                                                                        <EyeMeasurement 
                                                                            label="Add"
                                                                            rightEye={exam.refraction.rightEye.add}
                                                                            leftEye={exam.refraction.leftEye.add}
                                                                            unit=" D"
                                                                        />
                                                                        {exam.refraction.pd && (
                                                                            <div className="text-sm py-1">
                                                                                <span className="font-medium">PD: </span>
                                                                                <span className="text-gray-700">{exam.refraction.pd} mm</span>
                                                                            </div>
                                                                        )}
                                                                    </DataSection>
                                                                )}

                                                                <div className="grid md:grid-cols-2 gap-3">
                                                                    {/* IOP */}
                                                                    {(exam.iop.iopOD || exam.iop.iopOS) && (
                                                                        <DataSection 
                                                                            title="IOP" 
                                                                            icon={Activity}
                                                                            badge={
                                                                                exam.iop.iopMethod && (
                                                                                    <Badge variant="outline" className="text-xs">
                                                                                        {exam.iop.iopMethod}
                                                                                    </Badge>
                                                                                )
                                                                            }
                                                                        >
                                                                            <EyeMeasurement 
                                                                                label="Pressure"
                                                                                rightEye={exam.iop.iopOD}
                                                                                leftEye={exam.iop.iopOS}
                                                                                unit=" mmHg"
                                                                            />
                                                                        </DataSection>
                                                                    )}

                                                                    {/* Keratometry */}
                                                                    {(exam.keratometry.k1OD || exam.keratometry.k1OS) && (
                                                                        <DataSection title="Keratometry" icon={Activity}>
                                                                            <EyeMeasurement 
                                                                                label="K1"
                                                                                rightEye={exam.keratometry.k1OD}
                                                                                leftEye={exam.keratometry.k1OS}
                                                                                unit=" D"
                                                                            />
                                                                            <EyeMeasurement 
                                                                                label="K2"
                                                                                rightEye={exam.keratometry.k2OD}
                                                                                leftEye={exam.keratometry.k2OS}
                                                                                unit=" D"
                                                                            />
                                                                            <EyeMeasurement 
                                                                                label="Flat Axis"
                                                                                rightEye={exam.keratometry.flatAxisOD}
                                                                                leftEye={exam.keratometry.flatAxisOS}
                                                                                unit="°"
                                                                            />
                                                                        </DataSection>
                                                                    )}
                                                                </div>

                                                                <div className="grid md:grid-cols-2 gap-3">
                                                                    {/* Biometry */}
                                                                    {(exam.biometry.axlOD || exam.biometry.axlOS) && (
                                                                        <DataSection title="Biometry" icon={TestTube}>
                                                                            <EyeMeasurement 
                                                                                label="Axial Length"
                                                                                rightEye={exam.biometry.axlOD}
                                                                                leftEye={exam.biometry.axlOS}
                                                                                unit=" mm"
                                                                            />
                                                                            <EyeMeasurement 
                                                                                label="ACD"
                                                                                rightEye={exam.biometry.acdOD}
                                                                                leftEye={exam.biometry.acdOS}
                                                                                unit=" mm"
                                                                            />
                                                                        </DataSection>
                                                                    )}

                                                                    {/* IOL */}
                                                                    {(exam.iol.iolPowerPlannedOD || exam.iol.iolImplantedOD) && (
                                                                        <DataSection title="IOL Details" icon={Eye}>
                                                                            <EyeMeasurement 
                                                                                label="Planned Power"
                                                                                rightEye={exam.iol.iolPowerPlannedOD}
                                                                                leftEye={exam.iol.iolPowerPlannedOS}
                                                                                unit=" D"
                                                                            />
                                                                            <EyeMeasurement 
                                                                                label="Implanted"
                                                                                rightEye={exam.iol.iolImplantedOD}
                                                                                leftEye={exam.iol.iolImplantedOS}
                                                                            />
                                                                        </DataSection>
                                                                    )}
                                                                </div>

                                                                {/* Slit Lamp */}
                                                                {(exam.slitLamp.eyelidsOD || exam.slitLamp.conjunctivaOD || 
                                                                  exam.slitLamp.corneaOD || exam.slitLamp.lensOD) && (
                                                                    <DataSection title="Slit Lamp Examination" icon={Microscope}>
                                                                        <EyeMeasurement 
                                                                            label="Eyelids"
                                                                            rightEye={exam.slitLamp.eyelidsOD}
                                                                            leftEye={exam.slitLamp.eyelidsOS}
                                                                        />
                                                                        <EyeMeasurement 
                                                                            label="Conjunctiva"
                                                                            rightEye={exam.slitLamp.conjunctivaOD}
                                                                            leftEye={exam.slitLamp.conjunctivaOS}
                                                                        />
                                                                        <EyeMeasurement 
                                                                            label="Cornea"
                                                                            rightEye={exam.slitLamp.corneaOD}
                                                                            leftEye={exam.slitLamp.corneaOS}
                                                                        />
                                                                        <EyeMeasurement 
                                                                            label="Lens"
                                                                            rightEye={exam.slitLamp.lensOD}
                                                                            leftEye={exam.slitLamp.lensOS}
                                                                        />
                                                                    </DataSection>
                                                                )}

                                                                {/* Additional Tests */}
                                                                {exam.additionalTests && Object.keys(exam.additionalTests).length > 0 && (
                                                                    <DataSection title="Additional Tests" icon={ClipboardList}>
                                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                                            {exam.colorVision && (
                                                                                <div>
                                                                                    <span className="font-medium">Color Vision: </span>
                                                                                    <span className="text-gray-700">{exam.colorVision}</span>
                                                                                </div>
                                                                            )}
                                                                            {exam.pupilReaction && (
                                                                                <div>
                                                                                    <span className="font-medium">Pupil Reaction: </span>
                                                                                    <span className="text-gray-700">{exam.pupilReaction}</span>
                                                                                </div>
                                                                            )}
                                                                            {exam.eyeAlignment && (
                                                                                <div>
                                                                                    <span className="font-medium">Eye Alignment: </span>
                                                                                    <span className="text-gray-700">{exam.eyeAlignment}</span>
                                                                                </div>
                                                                            )}
                                                                            {exam.extraocularMovements && (
                                                                                <div>
                                                                                    <span className="font-medium">EOM: </span>
                                                                                    <span className="text-gray-700">{exam.extraocularMovements}</span>
                                                                                </div>
                                                                            )}
                                                                            {exam.coverTest && (
                                                                                <div>
                                                                                    <span className="font-medium">Cover Test: </span>
                                                                                    <span className="text-gray-700">{exam.coverTest}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </DataSection>
                                                                )}

                                                                {/* Clinical Assessment */}
                                                                {(exam.clinicalImpressions || exam.preliminaryDiagnosis || 
                                                                  exam.clinicalNotes || exam.examinationNotes) && (
                                                                    <DataSection title="Clinical Assessment" icon={FileText}>
                                                                        {exam.preliminaryDiagnosis && (
                                                                            <div className="text-sm mb-2">
                                                                                <span className="font-medium">Preliminary Diagnosis: </span>
                                                                                <span className="text-gray-700">{exam.preliminaryDiagnosis}</span>
                                                                            </div>
                                                                        )}
                                                                        {exam.clinicalImpressions && (
                                                                            <div className="text-sm mb-2">
                                                                                <span className="font-medium">Clinical Impressions: </span>
                                                                                <span className="text-gray-700">{exam.clinicalImpressions}</span>
                                                                            </div>
                                                                        )}
                                                                        {exam.clinicalNotes && (
                                                                            <div className="text-sm mb-2 italic text-gray-700">
                                                                                <span className="font-medium">Notes: </span>
                                                                                {exam.clinicalNotes}
                                                                            </div>
                                                                        )}
                                                                        {exam.examinationNotes && (
                                                                            <div className="text-sm text-gray-700">
                                                                                {exam.examinationNotes}
                                                                            </div>
                                                                        )}
                                                                    </DataSection>
                                                                )}

                                                                {/* Treatment Plan */}
                                                                {exam.treatmentPlan && (
                                                                    <DataSection title="Treatment Plan" icon={ClipboardList}>
                                                                        <div className="text-sm text-gray-700">
                                                                            {typeof exam.treatmentPlan === 'string' 
                                                                                ? exam.treatmentPlan 
                                                                                : JSON.stringify(exam.treatmentPlan, null, 2)
                                                                            }
                                                                        </div>
                                                                    </DataSection>
                                                                )}

                                                                {/* Follow-up */}
                                                                {exam.followUpRequired && (
                                                                    <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <Clock className="h-4 w-4 text-yellow-700" />
                                                                            <span className="font-medium">Follow-up Required</span>
                                                                            {exam.followUpDate && (
                                                                                <span className="text-gray-700">
                                                                                    - {formatDate(exam.followUpDate)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
                                                                    Completed: {formatDateTime(exam.examinationDate)}
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Diagnoses */}
                                            {visit.diagnoses.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold flex items-center">
                                                        <AlertCircle className="h-4 w-4 mr-2 text-orange-600" />
                                                        Diagnoses ({visit.diagnoses.length})
                                                    </h4>
                                                    {visit.diagnoses.map((diagnosis) => (
                                                        <div key={diagnosis.id} className="bg-orange-50 p-3 rounded-lg">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-gray-800">
                                                                        {diagnosis.disease?.name 
                                                                            ? (typeof diagnosis.disease.name === 'string' 
                                                                                ? diagnosis.disease.name 
                                                                                : (diagnosis.disease.name['@value'] || diagnosis.disease.name.value || JSON.stringify(diagnosis.disease.name)))
                                                                            : (diagnosis.notes || 'Unnamed Diagnosis')
                                                                        }
                                                                    </p>
                                                                    {diagnosis.disease?.category && (
                                                                        <p className="text-sm text-gray-600">
                                                                            Category: {diagnosis.disease.category}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {diagnosis.isPrimary && (
                                                                        <Badge className="bg-orange-600">Primary</Badge>
                                                                    )}
                                                                    {diagnosis.severity && (
                                                                        <Badge variant="outline">{diagnosis.severity}</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {diagnosis.eyeAffected && (
                                                                <p className="text-sm text-gray-700">
                                                                    Eye Affected: {diagnosis.eyeAffected}
                                                                </p>
                                                            )}
                                                            {diagnosis.notes && (
                                                                <p className="text-sm text-gray-700 mt-2 italic">
                                                                    Notes: {diagnosis.notes}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-500 mt-2">
                                                                Diagnosed by: Dr. {diagnosis.doctor?.name} on {formatDate(diagnosis.diagnosisDate)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Prescriptions */}
                                            {visit.prescriptions.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold flex items-center">
                                                        <Pill className="h-4 w-4 mr-2 text-purple-600" />
                                                        Prescriptions ({visit.prescriptions.length})
                                                    </h4>
                                                    {visit.prescriptions.map((prescription) => (
                                                        <div key={prescription.id} className="bg-purple-50 p-3 rounded-lg">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <p className="font-medium text-gray-800">
                                                                    Rx #{prescription.prescriptionNumber}
                                                                </p>
                                                                <Badge 
                                                                    className={prescription.status === 'active' ? 'bg-green-600' : 'bg-gray-500'}
                                                                >
                                                                    {prescription.status}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-3">
                                                                Prescribed by: Dr. {prescription.doctor?.name} on {formatDate(prescription.prescriptionDate)}
                                                            </p>
                                                            
                                                            {/* Medications */}
                                                            <div className="space-y-2 mb-3">
                                                                {prescription.medications.map((med, medIdx) => (
                                                                    <div key={med.id} className="bg-white p-2 rounded border border-purple-200">
                                                                        <p className="font-medium text-sm text-gray-800">
                                                                            {medIdx + 1}. {med.medicineName}
                                                                        </p>
                                                                        <div className="text-xs text-gray-600 mt-1 grid grid-cols-2 gap-2">
                                                                            <span>Dosage: {med.dosage}</span>
                                                                            <span>Frequency: {med.frequency}</span>
                                                                            <span>Duration: {med.duration}</span>
                                                                            {med.quantity && <span>Qty: {med.quantity}</span>}
                                                                        </div>
                                                                        {med.instructions && (
                                                                            <p className="text-xs text-gray-700 mt-1 italic">
                                                                                {med.instructions}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {prescription.generalInstructions && (
                                                                <p className="text-sm text-gray-700 mt-2">
                                                                    <strong>Instructions:</strong> {prescription.generalInstructions}
                                                                </p>
                                                            )}
                                                            {prescription.validTill && (
                                                                <p className="text-xs text-gray-500 mt-2">
                                                                    Valid until: {formatDate(prescription.validTill)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Follow-up Information */}
                                            {visit.followUp.required && (
                                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                                    <h4 className="font-semibold flex items-center text-yellow-800 mb-2">
                                                        <Clock className="h-4 w-4 mr-2" />
                                                        Follow-up Required
                                                    </h4>
                                                    {visit.followUp.date && (
                                                        <p className="text-sm text-gray-700">
                                                            Scheduled for: {formatDate(visit.followUp.date)}
                                                        </p>
                                                    )}
                                                    {visit.followUp.instructions !== null && visit.followUp.instructions !== undefined && (
                                                        <div className="text-sm text-gray-700 mt-2">
                                                            Instructions: {typeof visit.followUp.instructions === 'string' 
                                                                ? visit.followUp.instructions 
                                                                : JSON.stringify(visit.followUp.instructions)
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Visit Outcome */}
                                            {visit.visitOutcome !== null && visit.visitOutcome !== undefined && (
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <h4 className="font-semibold text-sm mb-2 flex items-center">
                                                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                                        Visit Outcome
                                                    </h4>
                                                    <p className="text-sm text-gray-700">
                                                        {typeof visit.visitOutcome === 'string' 
                                                            ? visit.visitOutcome 
                                                            : JSON.stringify(visit.visitOutcome)
                                                        }
                                                    </p>
                                                    {visit.completedAt && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Completed: {formatDateTime(visit.completedAt)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
};

export default PatientVisitHistory;
