import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import DiagnosisAutocomplete from "@/components/DiagnosisAutocomplete";
import surgeryTypeService from "@/services/surgeryTypeService";
import { toast } from "sonner";

const MyExaminationTab = ({
    examinationNotes, setExaminationNotes,
    selectedDiagnoses, setSelectedDiagnoses,
    octChecked, setOctChecked,
    visualFieldChecked, setVisualFieldChecked,
    fundusPhotographyChecked, setFundusPhotographyChecked,
    angiographyChecked, setAngiographyChecked,
    otherTestChecked, setOtherTestChecked,
    otherTestsText, setOtherTestsText,
    followUpRequired, setFollowUpRequired,
    followUpPeriod, setFollowUpPeriod,
    followUpDays, setFollowUpDays,
    followUpDate, setFollowUpDate,
    surgerySuggested, setSurgerySuggested,
    selectedSurgeryTypeId, setSelectedSurgeryTypeId,
    savingDetailed, saveDetailedExaminationData,
    getInputClassName, markFieldAsModified
}) => {
    const [surgeryTypes, setSurgeryTypes] = useState([]);
    const [groupedSurgeryTypes, setGroupedSurgeryTypes] = useState({});
    const [loadingSurgeryTypes, setLoadingSurgeryTypes] = useState(false);
    const [selectedSurgeryTypeDetails, setSelectedSurgeryTypeDetails] = useState(null);

    // Load surgery types when component mounts
    useEffect(() => {
        loadSurgeryTypes();
    }, []);

    // Load surgery type details when a surgery type is selected
    useEffect(() => {
        if (selectedSurgeryTypeId) {
            loadSurgeryTypeDetails(selectedSurgeryTypeId);
        } else {
            setSelectedSurgeryTypeDetails(null);
        }
    }, [selectedSurgeryTypeId]);

    const loadSurgeryTypes = async () => {
        try {
            setLoadingSurgeryTypes(true);
            const response = await surgeryTypeService.getSurgeryTypeDropdown();
            
            if (response.success) {
                const surgeryTypes = response.data.surgeryTypes || [];
                const groupedByCategory = response.data.groupedByCategory || {};
                
                
                setSurgeryTypes(surgeryTypes);
                setGroupedSurgeryTypes(groupedByCategory);
            } else {
                toast.error('Surgery types API returned unsuccessful response');
            }
        } catch (error) {
            toast.error('Failed to load surgery types: ' + error.message);
        } finally {
            setLoadingSurgeryTypes(false);
        }
    };

    const loadSurgeryTypeDetails = async (surgeryTypeId) => {
        try {
            const response = await surgeryTypeService.getSurgeryTypeDetails(surgeryTypeId);
            
            if (response.success) {
                setSelectedSurgeryTypeDetails(response.data);
            }
        } catch (error) {
            // Don't show error toast for details as it's not critical
        }
    };

    const handleSurgeryRecommendationChange = (checked) => {
        setSurgerySuggested(checked);
        markFieldAsModified('surgerySuggested');
        
        // Clear surgery type selection if surgery is not recommended
        if (!checked) {
            setSelectedSurgeryTypeId(null);
            markFieldAsModified('surgeryTypeId');
        }
    };

    const handleSurgeryTypeChange = (surgeryTypeId) => {
        try {
            
            // Validate the surgery type ID
            if (surgeryTypeId && surgeryTypeId !== 'loading' && surgeryTypeId !== 'no-data') {
                setSelectedSurgeryTypeId(surgeryTypeId);
                markFieldAsModified('surgeryTypeId');
                
                // Find and log the selected surgery type details
                const selectedType = surgeryTypes.find(st => st.id === surgeryTypeId);
                if (selectedType) {
                } else {
                }
            } else {
            }
        } catch (error) {
            toast.error('Error selecting surgery type');
        }
    };
    return (
        <Card>
            <CardHeader>
                <CardTitle>Ophthalmologist Examination</CardTitle>
                <p className="text-sm text-gray-600">
                    Record your detailed examination findings
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <Label htmlFor="examination-notes">Clinical Examination Notes</Label>
                    <Textarea
                        id="examination-notes"
                        placeholder="Record your detailed examination findings, observations, and clinical impressions..."
                        value={examinationNotes}
                        onChange={(e) => setExaminationNotes(e.target.value)}
                        rows={6}
                    />
                </div>

                <div>
                    <Label htmlFor="diagnosis-text">Diagnosis</Label>
                    <div className="mt-2">
                        <DiagnosisAutocomplete
                            value={selectedDiagnoses}
                            onChange={setSelectedDiagnoses}
                            placeholder="Search diagnoses by code or name (e.g., cataract, 9B10)..."
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Start typing to search from diagnosis master. You can select multiple diagnoses.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Additional Tests Required</Label>
                        <div className="mt-2 space-y-2">
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" className="rounded" checked={octChecked} onChange={(e) => setOctChecked(e.target.checked)} />
                                <span className="text-sm">OCT</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" className="rounded" checked={visualFieldChecked} onChange={(e) => setVisualFieldChecked(e.target.checked)} />
                                <span className="text-sm">Visual Field Test</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" className="rounded" checked={fundusPhotographyChecked} onChange={(e) => setFundusPhotographyChecked(e.target.checked)} />
                                <span className="text-sm">Fundus Photography</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" className="rounded" checked={angiographyChecked} onChange={(e) => setAngiographyChecked(e.target.checked)} />
                                <span className="text-sm">Fluorescein Angiography</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" className="rounded" checked={otherTestChecked} onChange={(e) => setOtherTestChecked(e.target.checked)} />
                                <span className="text-sm">Other</span>
                            </label>
                            {otherTestChecked && (
                                <Input placeholder="Specify other tests..." value={otherTestsText} onChange={(e) => setOtherTestsText(e.target.value)} className="ml-6" />
                            )}
                        </div>
                    </div>

                    <div>
                        <Label>Follow-up Required</Label>
                        <div className="mt-2 space-y-2">
                            {[
                                { value: '1_week', label: '1 week', days: 7 },
                                { value: '1_month', label: '1 month', days: 30 },
                                { value: '3_months', label: '3 months', days: 90 },
                                { value: '6_months', label: '6 months', days: 180 },
                                { value: 'custom', label: 'Custom', days: null }
                            ].map((option) => (
                                <label key={option.value} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="followup"
                                        className="rounded"
                                        checked={followUpPeriod === option.value}
                                        onChange={() => {
                                            setFollowUpRequired(true);
                                            setFollowUpPeriod(option.value);
                                            if (option.days) {
                                                const date = new Date();
                                                date.setDate(date.getDate() + option.days);
                                                setFollowUpDate(date);
                                                setFollowUpDays('');
                                            }
                                        }}
                                    />
                                    <span className="text-sm">{option.label}</span>
                                </label>
                            ))}
                            {followUpPeriod === 'custom' && (
                                <div className="ml-6 space-y-2">
                                    <div>
                                        <Label className="text-xs">Days</Label>
                                        <Input
                                            type="number"
                                            placeholder="Enter days"
                                            value={followUpDays}
                                            onChange={(e) => {
                                                setFollowUpDays(e.target.value);
                                                if (e.target.value) {
                                                    const date = new Date();
                                                    date.setDate(date.getDate() + parseInt(e.target.value));
                                                    setFollowUpDate(date);
                                                }
                                            }}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Follow-up Date</Label>
                                        <Input
                                            type="date"
                                            value={followUpDate ? followUpDate.toISOString().split('T')[0] : ''}
                                            onChange={(e) => setFollowUpDate(new Date(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name="followup"
                                    className="rounded"
                                    checked={!followUpRequired}
                                    onChange={() => {
                                        setFollowUpRequired(false);
                                        setFollowUpPeriod('');
                                        setFollowUpDays('');
                                        setFollowUpDate(null);
                                    }}
                                />
                                <span className="text-sm">No follow-up required</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Surgery Recommendation */}
                <div className="space-y-4">
                    <Label>Surgery Recommendation</Label>
                    <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className={`rounded ${getInputClassName('surgerySuggested')}`}
                                checked={surgerySuggested}
                                onChange={(e) => handleSurgeryRecommendationChange(e.target.checked)}
                            />
                            <span className="text-sm font-medium">Recommend Surgery</span>
                        </label>
                        {surgerySuggested && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                Surgical Intervention Required
                            </Badge>
                        )}
                    </div>
                    
                    {/* Surgery Type Selection */}
                    {surgerySuggested && (
                        <div className="ml-6 space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div>
                                <Label htmlFor="surgery-type">
                                    Select Surgery Type *
                                    {loadingSurgeryTypes && <span className="ml-2 text-xs text-blue-600">Loading...</span>}
                                </Label>
                                <Select 
                                    value={selectedSurgeryTypeId || ''} 
                                    onValueChange={handleSurgeryTypeChange}
                                    disabled={loadingSurgeryTypes}
                                >
                                    <SelectTrigger className={`mt-1 border-blue-200 focus:border-blue-500 focus:ring-blue-200 ${getInputClassName('surgeryTypeId')}`}>
                                        <SelectValue 
                                            placeholder={loadingSurgeryTypes ? "Loading surgery types..." : "Select surgery type"}
                                            className="text-blue-900"
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Debug info */}
                                        {loadingSurgeryTypes && (
                                            <SelectItem value="loading" disabled>
                                                Loading surgery types...
                                            </SelectItem>
                                        )}
                                        
                                        {/* Show fallback if no data */}
                                        {!loadingSurgeryTypes && Object.keys(groupedSurgeryTypes).length === 0 && surgeryTypes.length === 0 && (
                                            <SelectItem value="no-data" disabled>
                                                No surgery types available
                                            </SelectItem>
                                        )}
                                        
                                        {/* Show all surgery types in a flat list with category prefixes */}
                                        {surgeryTypes.map((surgeryType) => (
                                            <SelectItem 
                                                key={surgeryType.id} 
                                                value={surgeryType.id}
                                                className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center">
                                                        <span className="text-blue-700 font-medium text-xs mr-2 px-2 py-1 bg-blue-100 rounded">
                                                            {surgeryType.category}
                                                        </span>
                                                        <span className="font-medium text-gray-900">{surgeryType.name}</span>
                                                    </div>
                                                    {surgeryType.description && (
                                                        <span className="text-gray-500 text-sm ml-2 max-w-48 truncate">
                                                            {surgeryType.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-600 mt-1">
                                    Choose the specific type of surgery recommended for this patient.
                                </p>
                                
                                {/* Show selected surgery type */}
                                {selectedSurgeryTypeId && (() => {
                                    const selectedSurgery = surgeryTypes.find(st => st.id === selectedSurgeryTypeId);
                                    return selectedSurgery ? (
                                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                                            <div className="text-sm">
                                                <span className="font-medium text-blue-900">Selected: </span>
                                                <span className="inline-flex items-center">
                                                    <span className="text-blue-700 font-medium text-xs mr-2 px-2 py-1 bg-blue-100 rounded">
                                                        {selectedSurgery.category}
                                                    </span>
                                                    <span className="text-blue-800 font-medium">
                                                        {selectedSurgery.name}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    ) : null;
                                })()}
                            </div>

                            {/* Surgery Type Details - HIDDEN FOR NOW, KEEP STRUCTURE FOR FUTURE */}
                            {false && selectedSurgeryTypeDetails && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-700">Duration:</span>
                                            <span className="ml-2">{selectedSurgeryTypeDetails.averageDuration} minutes</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">Complexity:</span>
                                            <span className="ml-2">{selectedSurgeryTypeDetails.complexityLevel}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">Anesthesia:</span>
                                            <span className="ml-2">{selectedSurgeryTypeDetails.requiresAnesthesia}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">Admission:</span>
                                            <span className="ml-2">
                                                {selectedSurgeryTypeDetails.requiresAdmission ? 'Required' : 'Outpatient'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {selectedSurgeryTypeDetails.preOpRequirements && (
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-700">Pre-op Requirements:</span>
                                            <ul className="ml-4 mt-1 list-disc list-inside text-gray-600">
                                                {selectedSurgeryTypeDetails.preOpRequirements.map((req, index) => (
                                                    <li key={index}>{req}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {selectedSurgeryTypeDetails.packages && selectedSurgeryTypeDetails.packages.length > 0 && (
                                        <div className="text-sm">
                                            <span className="font-medium text-gray-700">Available Packages:</span>
                                            <div className="mt-1 space-y-1">
                                                {selectedSurgeryTypeDetails.packages.map((pkg) => (
                                                    <div key={pkg.id} className="flex justify-between items-center bg-white p-2 rounded border">
                                                        <div>
                                                            <span className="font-medium">{pkg.packageName}</span>
                                                            {pkg.isRecommended && (
                                                                <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">Recommended</Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-gray-600">₹{pkg.packageCost.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                        Check this box if you recommend surgical intervention based on examination findings.
                    </p>
                </div>

                {/* Save Button */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button
                        onClick={saveDetailedExaminationData}
                        disabled={savingDetailed}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {savingDetailed ? 'Saving...' : 'Save Examination Data'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default MyExaminationTab;
