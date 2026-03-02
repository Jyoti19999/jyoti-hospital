import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Target, TestTube, Microscope, FileText, EyeOff } from "lucide-react";

const DetailedExaminationTab = ({
    // Visual Acuity props
    distanceOD, setDistanceOD, distanceOS, setDistanceOS, distanceBinocular, setDistanceBinocular,
    nearOD, setNearOD, nearOS, setNearOS, nearBinocular, setNearBinocular,
    // Refraction props
    refractionSphereOD, setRefractionSphereOD, refractionCylinderOD, setRefractionCylinderOD,
    refractionAxisOD, setRefractionAxisOD, refractionAddOD, setRefractionAddOD,
    refractionSphereOS, setRefractionSphereOS, refractionCylinderOS, setRefractionCylinderOS,
    refractionAxisOS, setRefractionAxisOS, refractionAddOS, setRefractionAddOS,
    refractionPD, setRefractionPD,
    // IOP props
    iopOD, setIopOD, iopOS, setIopOS, iopMethod, setIopMethod,
    // Additional tests
    pupilReaction, setPupilReaction, colorVision, setColorVision,
    eyeAlignment, setEyeAlignment, anteriorSegment, setAnteriorSegment,
    extraocularMovements, setExtraocularMovements, coverTest, setCoverTest,
    // Pre-op params
    k1OD, setK1OD, k1OS, setK1OS, k2OD, setK2OD, k2OS, setK2OS,
    flatAxisOD, setFlatAxisOD, flatAxisOS, setFlatAxisOS,
    acdOD, setAcdOD, acdOS, setAcdOS, axlOD, setAxlOD, axlOS, setAxlOS,
    iolPowerPlannedOD, setIolPowerPlannedOD, iolPowerPlannedOS, setIolPowerPlannedOS,
    iolImplantedOD, setIolImplantedOD, iolImplantedOS, setIolImplantedOS,
    anyOtherDetailsOD, setAnyOtherDetailsOD, anyOtherDetailsOS, setAnyOtherDetailsOS,
    // Slit lamp
    eyelidsOD, setEyelidsOD, eyelidsOS, setEyelidsOS,
    conjunctivaOD, setConjunctivaOD, conjunctivaOS, setConjunctivaOS,
    corneaOD, setCorneaOD, corneaOS, setCorneaOS,
    lensOD, setLensOD, lensOS, setLensOS,
    // Clinical notes
    clinicalNotes, setClinicalNotes, preliminaryDiagnosis, setPreliminaryDiagnosis,
    // Actions
    optometristExamData, loadingOptometristData, preFillFromOptometristData,
    originalOptometristValues, getInputClassName, markFieldAsModified,
    savingDetailed, saveDetailedExaminationData,
    readOnly = false
}) => {
    const distanceOptions = ['6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60', 'CF', 'HM', 'LP', 'NLP'];
    const nearOptions = ['N6', 'N8', 'N10', 'N12', 'N14', 'N18', 'N24', 'N36'];

    const [showPreOpParams, setShowPreOpParams] = useState(false);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Detailed Ophthalmologist Examination</CardTitle>
                        <p className="text-sm text-gray-600">
                            Record comprehensive ophthalmological examination findings
                        </p>
                    </div>
                    {optometristExamData && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => preFillFromOptometristData(optometristExamData)}
                            className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            disabled={loadingOptometristData}
                        >
                            <Eye className="h-4 w-4" />
                            Pre-fill from Optometrist
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Pre-fill Notification */}
                {optometristExamData && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Eye className="h-5 w-5 text-blue-600 mr-2" />
                                <div>
                                    <h4 className="font-semibold text-blue-800">Optometrist Data Available</h4>
                                    <p className="text-sm text-blue-700">
                                        {Object.keys(originalOptometristValues).length > 0
                                            ? `Pre-filled ${Object.keys(originalOptometristValues).length} fields. Modified fields highlighted in orange.`
                                            : 'Click to pre-fill examination fields.'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!optometristExamData && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <Eye className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                                <h4 className="font-semibold text-gray-600">No Optometrist Data</h4>
                                <p className="text-sm text-gray-500">
                                    This patient was directly routed to ophthalmology. Fill in examination details manually.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Visual Acuity Section */}
                <div>
                    <h4 className="font-semibold flex items-center mb-4">
                        <Target className="h-4 w-4 mr-2 text-blue-600" />
                        Visual Acuity Assessment
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h5 className="font-medium text-gray-700">Distance Vision</h5>
                            <div className="grid grid-cols-3 gap-4">
                                {['OD', 'OS', 'Binocular'].map((eye, idx) => {
                                    const value = idx === 0 ? distanceOD : idx === 1 ? distanceOS : distanceBinocular;
                                    const setValue = idx === 0 ? setDistanceOD : idx === 1 ? setDistanceOS : setDistanceBinocular;
                                    const fieldName = idx === 0 ? 'distanceOD' : idx === 1 ? 'distanceOS' : 'distanceBinocular';
                                    return (
                                        <div key={eye}>
                                            <Label>{eye === 'OD' ? 'Right Eye (OD)' : eye === 'OS' ? 'Left Eye (OS)' : 'Binocular'}</Label>
                                            <Select value={value} onValueChange={(v) => { setValue(v); markFieldAsModified(fieldName, v); }}>
                                                <SelectTrigger className={getInputClassName(fieldName)}>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {distanceOptions.map(opt => (
                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h5 className="font-medium text-gray-700">Near Vision</h5>
                            <div className="grid grid-cols-3 gap-4">
                                {['OD', 'OS', 'Binocular'].map((eye, idx) => {
                                    const value = idx === 0 ? nearOD : idx === 1 ? nearOS : nearBinocular;
                                    const setValue = idx === 0 ? setNearOD : idx === 1 ? setNearOS : setNearBinocular;
                                    const fieldName = idx === 0 ? 'nearOD' : idx === 1 ? 'nearOS' : 'nearBinocular';
                                    return (
                                        <div key={eye}>
                                            <Label>{eye === 'OD' ? 'Right Eye (OD)' : eye === 'OS' ? 'Left Eye (OS)' : 'Binocular'}</Label>
                                            <Select value={value} onValueChange={(v) => { setValue(v); markFieldAsModified(fieldName, v); }}>
                                                <SelectTrigger className={getInputClassName(fieldName)}>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {nearOptions.map(opt => (
                                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Refraction Section */}
                <div>
                    <h4 className="font-semibold flex items-center mb-4">
                        <Eye className="h-4 w-4 mr-2 text-green-600" />
                        Refraction Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['OD', 'OS'].map((eye) => {
                            const isOD = eye === 'OD';
                            return (
                                <div key={eye} className="space-y-4">
                                    <h5 className="font-medium text-gray-700">{isOD ? 'Right Eye (OD)' : 'Left Eye (OS)'}</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Sphere (D)</Label>
                                            <Input type="number" step="0.25" min="-20" max="20"
                                                value={isOD ? refractionSphereOD : refractionSphereOS}
                                                onChange={(e) => {
                                                    isOD ? setRefractionSphereOD(e.target.value) : setRefractionSphereOS(e.target.value);
                                                    markFieldAsModified(isOD ? 'refractionSphereOD' : 'refractionSphereOS', e.target.value);
                                                }}
                                                placeholder="0.00"
                                                className={getInputClassName(isOD ? 'refractionSphereOD' : 'refractionSphereOS')}
                                            />
                                        </div>
                                        <div>
                                            <Label>Cylinder (D)</Label>
                                            <Input type="number" step="0.25" min="-6" max="6"
                                                value={isOD ? refractionCylinderOD : refractionCylinderOS}
                                                onChange={(e) => {
                                                    isOD ? setRefractionCylinderOD(e.target.value) : setRefractionCylinderOS(e.target.value);
                                                    markFieldAsModified(isOD ? 'refractionCylinderOD' : 'refractionCylinderOS', e.target.value);
                                                }}
                                                placeholder="0.00"
                                                className={getInputClassName(isOD ? 'refractionCylinderOD' : 'refractionCylinderOS')}
                                            />
                                        </div>
                                        <div>
                                            <Label>Axis (°)</Label>
                                            <Input type="number" min="0" max="180"
                                                value={isOD ? refractionAxisOD : refractionAxisOS}
                                                onChange={(e) => {
                                                    isOD ? setRefractionAxisOD(e.target.value) : setRefractionAxisOS(e.target.value);
                                                    markFieldAsModified(isOD ? 'refractionAxisOD' : 'refractionAxisOS', e.target.value);
                                                }}
                                                placeholder="0"
                                                className={getInputClassName(isOD ? 'refractionAxisOD' : 'refractionAxisOS')}
                                            />
                                        </div>
                                        <div>
                                            <Label>Add (D)</Label>
                                            <Input type="number" step="0.25" min="0" max="4"
                                                value={isOD ? refractionAddOD : refractionAddOS}
                                                onChange={(e) => {
                                                    isOD ? setRefractionAddOD(e.target.value) : setRefractionAddOS(e.target.value);
                                                    markFieldAsModified(isOD ? 'refractionAddOD' : 'refractionAddOS', e.target.value);
                                                }}
                                                placeholder="0.00"
                                                className={getInputClassName(isOD ? 'refractionAddOD' : 'refractionAddOS')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4">
                        <Label>Pupillary Distance (PD)</Label>
                        <Input type="number" min="50" max="80" value={refractionPD}
                            onChange={(e) => { setRefractionPD(e.target.value); markFieldAsModified('refractionPD', e.target.value); }}
                            placeholder="65" className={getInputClassName('refractionPD')}
                        />
                    </div>
                </div>

                {/* Tonometry Section */}
                <div>
                    <h4 className="font-semibold flex items-center mb-4">
                        <TestTube className="h-4 w-4 mr-2 text-purple-600" />
                        Intraocular Pressure (IOP)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label>Right Eye IOP (mmHg)</Label>
                            <Input type="number" min="5" max="50" value={iopOD}
                                onChange={(e) => { setIopOD(e.target.value); markFieldAsModified('iopOD', e.target.value); }}
                                placeholder="15" className={getInputClassName('iopOD')}
                            />
                            {iopOD && (
                                <p className={`text-xs mt-1 ${parseFloat(iopOD) > 21 || parseFloat(iopOD) < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                    {parseFloat(iopOD) > 21 ? 'High IOP' : parseFloat(iopOD) < 10 ? 'Low IOP' : 'Normal range'}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label>Left Eye IOP (mmHg)</Label>
                            <Input type="number" min="5" max="50" value={iopOS}
                                onChange={(e) => { setIopOS(e.target.value); markFieldAsModified('iopOS', e.target.value); }}
                                placeholder="15" className={getInputClassName('iopOS')}
                            />
                            {iopOS && (
                                <p className={`text-xs mt-1 ${parseFloat(iopOS) > 21 || parseFloat(iopOS) < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                    {parseFloat(iopOS) > 21 ? 'High IOP' : parseFloat(iopOS) < 10 ? 'Low IOP' : 'Normal range'}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label>Method</Label>
                            <Select value={iopMethod} onValueChange={(v) => { setIopMethod(v); markFieldAsModified('iopMethod', v); }}>
                                <SelectTrigger className={getInputClassName('iopMethod')}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="goldmann">Goldmann Applanation</SelectItem>
                                    <SelectItem value="nctonometry">Non-contact Tonometry</SelectItem>
                                    <SelectItem value="perkins">Perkins Handheld</SelectItem>
                                    <SelectItem value="tono-pen">Tono-Pen</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Additional Tests Section */}
                <div>
                    <h4 className="font-semibold flex items-center mb-4">
                        <Microscope className="h-4 w-4 mr-2 text-orange-600" />
                        Additional Clinical Tests
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h5 className="font-medium text-gray-700">Pupil & Motility</h5>
                            <div className="space-y-4">
                                <div>
                                    <Label>Pupil Reaction</Label>
                                    <Select value={pupilReaction} onValueChange={(v) => { setPupilReaction(v); markFieldAsModified('pupilReaction', v); }}>
                                        <SelectTrigger className={getInputClassName('pupilReaction')}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="normal">Normal (PERRL)</SelectItem>
                                            <SelectItem value="sluggish">Sluggish</SelectItem>
                                            <SelectItem value="fixed">Fixed</SelectItem>
                                            <SelectItem value="rapd">RAPD Present</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Eye Alignment</Label>
                                    <Select value={eyeAlignment} onValueChange={(v) => { setEyeAlignment(v); markFieldAsModified('eyeAlignment', v); }}>
                                        <SelectTrigger className={getInputClassName('eyeAlignment')}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="normal">Normal (Orthophoric)</SelectItem>
                                            <SelectItem value="esotropia">Esotropia</SelectItem>
                                            <SelectItem value="exotropia">Exotropia</SelectItem>
                                            <SelectItem value="hypertropia">Hypertropia</SelectItem>
                                            <SelectItem value="phoria">Phoria</SelectItem>
                                            <SelectItem value="strabismus">Strabismus (Other)</SelectItem>
                                            <SelectItem value="nystagmus">Nystagmus</SelectItem>
                                            <SelectItem value="pseudostrabismus">Pseudostrabismus</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Extraocular Movements</Label>
                                    <Select value={extraocularMovements} onValueChange={(v) => { setExtraocularMovements(v); markFieldAsModified('extraocularMovements', v); }}>
                                        <SelectTrigger className={getInputClassName('extraocularMovements')}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full">Full in all directions</SelectItem>
                                            <SelectItem value="restricted">Restricted</SelectItem>
                                            <SelectItem value="paralysis">Paralysis present</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Cover Test</Label>
                                    <Select value={coverTest} onValueChange={(v) => { setCoverTest(v); markFieldAsModified('coverTest', v); }}>
                                        <SelectTrigger className={getInputClassName('coverTest')}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="orthophoric">Orthophoric</SelectItem>
                                            <SelectItem value="esotropia">Esotropia</SelectItem>
                                            <SelectItem value="exotropia">Exotropia</SelectItem>
                                            <SelectItem value="hypertropia">Hypertropia</SelectItem>
                                            <SelectItem value="phoria">Phoria</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h5 className="font-medium text-gray-700">Vision & Anterior Segment</h5>
                            <div className="space-y-4">
                                <div>
                                    <Label>Color Vision</Label>
                                    <Select value={colorVision} onValueChange={(v) => { setColorVision(v); markFieldAsModified('colorVision', v); }}>
                                        <SelectTrigger className={getInputClassName('colorVision')}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="red-green-deficiency">Red-Green Deficiency</SelectItem>
                                            <SelectItem value="blue-yellow-deficiency">Blue-Yellow Deficiency</SelectItem>
                                            <SelectItem value="total-color-blindness">Total Color Blindness</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Anterior Segment</Label>
                                    <Select value={anteriorSegment} onValueChange={(v) => { setAnteriorSegment(v); markFieldAsModified('anteriorSegment', v); }}>
                                        <SelectTrigger className={getInputClassName('anteriorSegment')}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="cataract">Cataract</SelectItem>
                                            <SelectItem value="corneal-opacity">Corneal Opacity</SelectItem>
                                            <SelectItem value="conjunctivitis">Conjunctivitis</SelectItem>
                                            <SelectItem value="pterygium">Pterygium</SelectItem>
                                            <SelectItem value="dry-eye">Dry Eye</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Slit Lamp Examination Section */}
                <div>
                    <h4 className="font-semibold flex items-center mb-4">
                        <Microscope className="h-4 w-4 mr-2 text-purple-600" />
                        Slit Lamp Examination
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'Eyelids', odValue: eyelidsOD, osValue: eyelidsOS, setOD: setEyelidsOD, setOS: setEyelidsOS, options: ['normal', 'abnormal'] },
                            { label: 'Conjunctiva', odValue: conjunctivaOD, osValue: conjunctivaOS, setOD: setConjunctivaOD, setOS: setConjunctivaOS, options: ['normal', 'sch', 'congestion', 'mass'] },
                            { label: 'Cornea', odValue: corneaOD, osValue: corneaOS, setOD: setCorneaOD, setOS: setCorneaOS, options: ['clear', 'hazy'] },
                            { label: 'Lens', odValue: lensOD, osValue: lensOS, setOD: setLensOD, setOS: setLensOS, options: ['normal', 'abnormal'] }
                        ].map((field) => (
                            <div key={field.label} className="space-y-2">
                                <Label className="font-semibold">{field.label}</Label>
                                <div className="space-y-2">
                                    <Select value={field.odValue} onValueChange={field.setOD}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Right Eye (OD)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.options.map(opt => (
                                                <SelectItem key={opt} value={opt}>{opt.toUpperCase()}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={field.osValue} onValueChange={field.setOS}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Left Eye (OS)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {field.options.map(opt => (
                                                <SelectItem key={opt} value={opt}>{opt.toUpperCase()}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Preliminary Diagnosis Section */}
                <div>
                    <h4 className="font-semibold flex items-center mb-4">
                        <FileText className="h-4 w-4 mr-2 text-blue-600" />
                        Preliminary Diagnosis
                    </h4>
                    <div>
                        <Label>Preliminary Diagnosis</Label>
                        <Select value={preliminaryDiagnosis} onValueChange={setPreliminaryDiagnosis}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select preliminary diagnosis" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="refractive-error">Refractive Error</SelectItem>
                                <SelectItem value="cataract-suspect">Cataract Suspect</SelectItem>
                                <SelectItem value="glaucoma-suspect">Glaucoma Suspect</SelectItem>
                                <SelectItem value="diabetic-retinopathy">Diabetic Retinopathy Suspect</SelectItem>
                                <SelectItem value="dry-eye">Dry Eye Syndrome</SelectItem>
                                <SelectItem value="conjunctivitis">Conjunctivitis</SelectItem>
                                <SelectItem value="normal">Normal Examination</SelectItem>
                                <SelectItem value="other">Other - See notes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Pre-Operative Parameters Section - Collapsible */}
                <div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPreOpParams(!showPreOpParams)}
                        className="w-full flex items-center justify-between mb-4 hover:bg-indigo-50"
                    >
                        <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-indigo-600" />
                            <span className="font-semibold">Pre-Operative Parameters</span>
                        </div>
                        {showPreOpParams ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                            <Eye className="h-4 w-4 text-indigo-600" />
                        )}
                    </Button>

                    {showPreOpParams && (
                        <div className="space-y-4 border rounded-lg p-4 bg-indigo-50/30">
                            <div className="grid grid-cols-3 gap-x-4 gap-y-2 font-semibold border-b pb-2">
                                <Label>Parameter</Label>
                                <Label>Right Eye (OD)</Label>
                                <Label>Left Eye (OS)</Label>
                            </div>
                            {[
                                { label: 'K1', odValue: k1OD, osValue: k1OS, setOD: setK1OD, setOS: setK1OS, placeholder: '43.5' },
                                { label: 'K2', odValue: k2OD, osValue: k2OS, setOD: setK2OD, setOS: setK2OS, placeholder: '44.0' },
                                { label: 'Flat Axis', odValue: flatAxisOD, osValue: flatAxisOS, setOD: setFlatAxisOD, setOS: setFlatAxisOS, placeholder: '90' },
                                { label: 'ACD', odValue: acdOD, osValue: acdOS, setOD: setAcdOD, setOS: setAcdOS, placeholder: '3.2' },
                                { label: 'AXL', odValue: axlOD, osValue: axlOS, setOD: setAxlOD, setOS: setAxlOS, placeholder: '23.5' },
                                { label: 'IOL Power Planned', odValue: iolPowerPlannedOD, osValue: iolPowerPlannedOS, setOD: setIolPowerPlannedOD, setOS: setIolPowerPlannedOS, placeholder: '+20.0' },
                                { label: 'IOL Implanted', odValue: iolImplantedOD, osValue: iolImplantedOS, setOD: setIolImplantedOD, setOS: setIolImplantedOS, placeholder: '+20.0' }
                            ].map((param) => (
                                <div key={param.label} className="grid grid-cols-3 gap-x-4 items-center py-1.5">
                                    <Label className="font-normal text-sm">{param.label}</Label>
                                    <Input value={param.odValue} onChange={(e) => param.setOD(e.target.value)} placeholder={param.placeholder} />
                                    <Input value={param.osValue} onChange={(e) => param.setOS(e.target.value)} placeholder={param.placeholder} />
                                </div>
                            ))}
                            <div className="grid grid-cols-3 gap-x-4 items-center py-1.5">
                                <Label className="font-normal text-sm">Any Other Details</Label>
                                <Textarea rows={1} value={anyOtherDetailsOD} onChange={(e) => setAnyOtherDetailsOD(e.target.value)} />
                                <Textarea rows={1} value={anyOtherDetailsOS} onChange={(e) => setAnyOtherDetailsOS(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button
                        onClick={saveDetailedExaminationData}
                        disabled={savingDetailed}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {savingDetailed ? 'Saving...' : 'Save Detailed Examination'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default DetailedExaminationTab;
