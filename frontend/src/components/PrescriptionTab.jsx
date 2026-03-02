import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MedicineAutocomplete from "@/components/MedicineAutocomplete";
import { Pill, Plus, Edit, Trash2 } from "lucide-react";

const PrescriptionTab = ({
    treatmentPlan, setTreatmentPlan,
    prescription, prescriptionItems,
    selectedMedicine, setSelectedMedicine,
    dosage, setDosage,
    frequency, setFrequency,
    duration, setDuration,
    medicineInstructions, setMedicineInstructions,
    quantity, setQuantity,
    editingItemIndex,
    generalInstructions, setGeneralInstructions,
    followUpInstructions, setFollowUpInstructions,
    savingPrescription,
    handleMedicineSelect,
    handleAddMedicine,
    handleEditItem,
    handleDeleteItem,
    handleCancelEdit,
    handleSavePrescription
}) => {
    return (
        <div className="space-y-6">
            {/* Treatment Plan Notes */}
            <Card>
                <CardHeader>
                    <CardTitle>Treatment Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Outline the recommended treatment approach, procedures, and management plan..."
                        value={treatmentPlan}
                        onChange={(e) => setTreatmentPlan(e.target.value)}
                        rows={4}
                    />
                </CardContent>
            </Card>

            {/* Prescription Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5 text-blue-600" />
                        Prescription
                        {prescription && (
                            <Badge variant="outline" className="ml-2">
                                {prescription.prescriptionNumber}
                            </Badge>
                        )}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                        Add medicines to the prescription
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Add Medicine Form */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold mb-4">
                            {editingItemIndex !== null ? 'Edit Medicine' : 'Add Medicine'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <Label>Search Medicine *</Label>
                                <MedicineAutocomplete
                                    onSelect={handleMedicineSelect}
                                    placeholder="Search by medicine name or code..."
                                />
                                {selectedMedicine && (
                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                        <p className="text-sm font-medium text-blue-900">
                                            Selected: {selectedMedicine.name}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Dosage *</Label>
                                    <Input
                                        value={dosage}
                                        onChange={(e) => setDosage(e.target.value)}
                                        placeholder="e.g., 1 drop, 1 tablet"
                                    />
                                </div>
                                <div>
                                    <Label>Frequency *</Label>
                                    <Select value={frequency} onValueChange={setFrequency}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Once Daily (OD)">Once Daily (OD)</SelectItem>
                                            <SelectItem value="Twice Daily (BD)">Twice Daily (BD)</SelectItem>
                                            <SelectItem value="Three Times Daily (TDS)">Three Times Daily (TDS)</SelectItem>
                                            <SelectItem value="Four Times Daily (QID)">Four Times Daily (QID)</SelectItem>
                                            <SelectItem value="Every 2 Hours">Every 2 Hours</SelectItem>
                                            <SelectItem value="Every 4 Hours">Every 4 Hours</SelectItem>
                                            <SelectItem value="Every 6 Hours">Every 6 Hours</SelectItem>
                                            <SelectItem value="At Bedtime (HS)">At Bedtime (HS)</SelectItem>
                                            <SelectItem value="As Needed (PRN)">As Needed (PRN)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Duration *</Label>
                                    <Input
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        placeholder="e.g., 7 days, 1 month"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Quantity</Label>
                                    <Input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="e.g., 1, 30"
                                    />
                                </div>
                                <div>
                                    <Label>Instructions</Label>
                                    <Input
                                        value={medicineInstructions}
                                        onChange={(e) => setMedicineInstructions(e.target.value)}
                                        placeholder="e.g., Take after meals"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleAddMedicine} className="bg-blue-600 hover:bg-blue-700">
                                    {editingItemIndex !== null ? (
                                        <>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Update Medicine
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Medicine
                                        </>
                                    )}
                                </Button>
                                {editingItemIndex !== null && (
                                    <Button variant="outline" onClick={handleCancelEdit}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Prescription Table */}
                    {prescriptionItems.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-3">Prescribed Medicines</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="text-left p-3 text-sm font-semibold">Medicine</th>
                                            <th className="text-left p-3 text-sm font-semibold">Dosage</th>
                                            <th className="text-left p-3 text-sm font-semibold">Frequency</th>
                                            <th className="text-left p-3 text-sm font-semibold">Duration</th>
                                            <th className="text-left p-3 text-sm font-semibold">Qty</th>
                                            <th className="text-left p-3 text-sm font-semibold">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prescriptionItems.map((item, index) => (
                                            <tr key={index} className="border-t hover:bg-gray-50">
                                                <td className="p-3">
                                                    <div>
                                                        <p className="font-medium text-sm">{item.medicineName}</p>
                                                        {item.medicineCode && (
                                                            <p className="text-xs text-gray-500">{item.medicineCode}</p>
                                                        )}
                                                        {item.genericName && (
                                                            <p className="text-xs text-gray-500">({item.genericName})</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-sm">{item.dosage}</td>
                                                <td className="p-3 text-sm">{item.frequency}</td>
                                                <td className="p-3 text-sm">{item.duration}</td>
                                                <td className="p-3 text-sm">{item.quantity || '-'}</td>
                                                <td className="p-3">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditItem(index)}
                                                        >
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleDeleteItem(index)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* General Instructions */}
                    <div>
                        <Label>General Instructions</Label>
                        <Textarea
                            value={generalInstructions}
                            onChange={(e) => setGeneralInstructions(e.target.value)}
                            placeholder="General instructions for the patient (e.g., Take medicines regularly, avoid eye rubbing...)"
                            rows={3}
                            className="mt-2"
                        />
                    </div>

                    {/* Follow-up Instructions */}
                    <div>
                        <Label>Follow-up Instructions</Label>
                        <Textarea
                            value={followUpInstructions}
                            onChange={(e) => setFollowUpInstructions(e.target.value)}
                            placeholder="Follow-up instructions (e.g., Return after 1 week for review...)"
                            rows={2}
                            className="mt-2"
                        />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            onClick={handleSavePrescription}
                            disabled={savingPrescription || prescriptionItems.length === 0}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {savingPrescription ? 'Saving...' : prescription ? 'Update Prescription' : 'Save Prescription'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PrescriptionTab;
