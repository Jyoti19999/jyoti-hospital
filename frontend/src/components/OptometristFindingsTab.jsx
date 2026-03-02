import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, User, Target, TestTube, Microscope } from "lucide-react";

const OptometristFindingsTab = ({ optometristExamData, loadingOptometristData }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Optometrist Examination Results</CardTitle>
                <p className="text-sm text-gray-600">
                    Previous examination findings and measurements
                </p>
            </CardHeader>
            <CardContent>
                {loadingOptometristData ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading optometrist examination data...</span>
                    </div>
                ) : !optometristExamData ? (
                    <div className="text-center py-8">
                        <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No Optometrist Examination</p>
                        <p className="text-sm text-gray-500 mt-2">
                            This patient was directly routed to ophthalmology (emergency case / paratially completed patients)
                        </p>
                    </div>
                ) : (
                    <Tabs defaultValue="visual-acuity" className="w-full">
                        <TabsList className="grid w-full grid-cols-5 bg-white p-1 h-auto rounded-lg shadow-sm border">
                            <TabsTrigger value="visual-acuity" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                <Target className="h-4 w-4 mr-1" />
                                Visual Acuity
                            </TabsTrigger>
                            <TabsTrigger value="refraction" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                                <Eye className="h-4 w-4 mr-1" />
                                Refraction
                            </TabsTrigger>
                            <TabsTrigger value="iop" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                                <TestTube className="h-4 w-4 mr-1" />
                                IOP
                            </TabsTrigger>
                            <TabsTrigger value="additional" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                                <Microscope className="h-4 w-4 mr-1" />
                                Additional Tests
                            </TabsTrigger>
                            <TabsTrigger value="preop" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                                <Microscope className="h-4 w-4 mr-1" />
                                Pre-Op
                            </TabsTrigger>
                        </TabsList>

                        {/* Visual Acuity Tab */}
                        <TabsContent value="visual-acuity" className="mt-4">
                            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold flex items-center text-base">
                                    <Target className="h-4 w-4 mr-2 text-blue-600" />
                                    Visual Acuity Assessment
                                </h4>
                                
                                {/* Uncorrected Visual Acuity */}
                                <div className="bg-white p-4 rounded-lg">
                                    <h5 className="text-sm font-medium text-gray-600 mb-2">Uncorrected Visual Acuity (UCVA)</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 p-3 rounded">
                                            <span className="font-medium text-blue-800 text-sm">OD (Right Eye):</span>
                                            <div className="text-base">{optometristExamData?.examinationData?.ucvaOD || 'Not recorded'}</div>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded">
                                            <span className="font-medium text-green-800 text-sm">OS (Left Eye):</span>
                                            <div className="text-base">{optometristExamData?.examinationData?.ucvaOS || 'Not recorded'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Best Corrected Visual Acuity */}
                                <div className="bg-white p-4 rounded-lg">
                                    <h5 className="text-sm font-medium text-gray-600 mb-2">Best Corrected Visual Acuity (BCVA / Aided)</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 p-3 rounded">
                                            <span className="font-medium text-blue-800 text-sm">OD (Right Eye):</span>
                                            <div className="text-base">{optometristExamData?.examinationData?.bcvaOD || optometristExamData?.examinationData?.visualAcuity?.aided?.rightEye || 'Not recorded'}</div>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded">
                                            <span className="font-medium text-green-800 text-sm">OS (Left Eye):</span>
                                            <div className="text-base">{optometristExamData?.examinationData?.bcvaOS || optometristExamData?.examinationData?.visualAcuity?.aided?.leftEye || 'Not recorded'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Complex Visual Acuity Data */}
                                {optometristExamData?.examinationData?.visualAcuity && (
                                    <div className="bg-white p-4 rounded-lg">
                                        <h5 className="text-sm font-medium text-gray-600 mb-3">Detailed Visual Acuity Assessment</h5>
                                        <div className="space-y-3">
                                            {/* Distance Vision */}
                                            {optometristExamData.examinationData.visualAcuity.distance && (
                                                <div className="bg-blue-50 p-3 rounded">
                                                    <h6 className="text-sm font-medium text-blue-800 mb-2">Distance Vision</h6>
                                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.visualAcuity.distance.rightEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.visualAcuity.distance.leftEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OU:</span> {optometristExamData.examinationData.visualAcuity.distance.binocular || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Near Vision */}
                                            {optometristExamData.examinationData.visualAcuity.near && (
                                                <div className="bg-green-50 p-3 rounded">
                                                    <h6 className="text-sm font-medium text-green-800 mb-2">Near Vision</h6>
                                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.visualAcuity.near.rightEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.visualAcuity.near.leftEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OU:</span> {optometristExamData.examinationData.visualAcuity.near.binocular || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Aided Vision (BCVA) */}
                                            {optometristExamData.examinationData.visualAcuity.aided && (
                                                <div className="bg-purple-50 p-3 rounded">
                                                    <h6 className="text-sm font-medium text-purple-800 mb-2">Aided Vision (BCVA)</h6>
                                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.visualAcuity.aided.rightEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.visualAcuity.aided.leftEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OU:</span> {optometristExamData.examinationData.visualAcuity.aided.binocular || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unaided Vision (UCVA — same as Distance) */}
                                            {optometristExamData.examinationData.visualAcuity.unaided && (
                                                <div className="bg-orange-50 p-3 rounded">
                                                    <h6 className="text-sm font-medium text-orange-800 mb-2">Unaided Vision (UCVA)</h6>
                                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.visualAcuity.unaided.rightEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.visualAcuity.unaided.leftEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OU:</span> {optometristExamData.examinationData.visualAcuity.unaided.binocular || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Refraction Tab */}
                        <TabsContent value="refraction" className="mt-4">
                            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold flex items-center text-base">
                                    <Eye className="h-4 w-4 mr-2 text-green-600" />
                                    Refraction Assessment
                                </h4>
                                
                                {/* Basic Refraction Data */}
                                <div className="bg-white p-4 rounded-lg">
                                    <h5 className="text-sm font-medium text-gray-600 mb-3">Refraction Values</h5>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="bg-blue-50 p-3 rounded">
                                            <span className="font-medium text-blue-800 text-sm">OD (Right Eye):</span>
                                            <div className="text-base">
                                                {optometristExamData?.examinationData?.refractionSphereOD !== null ?
                                                    ` ${optometristExamData.examinationData.refractionSphereOD > 0 ? '+' : ''}${optometristExamData.examinationData.refractionSphereOD}` : ''
                                                }
                                                {optometristExamData?.examinationData?.refractionCylinderOD !== null ?
                                                    ` ${optometristExamData.examinationData.refractionCylinderOD > 0 ? '+' : ''}${optometristExamData.examinationData.refractionCylinderOD}` : ''
                                                }
                                                {optometristExamData?.examinationData?.refractionAxisOD !== null ?
                                                    ` x ${optometristExamData.examinationData.refractionAxisOD}°` : ''
                                                }
                                                {(!optometristExamData?.examinationData?.refractionSphereOD &&
                                                    !optometristExamData?.examinationData?.refractionCylinderOD &&
                                                    !optometristExamData?.examinationData?.refractionAxisOD) ? 'Not recorded' : ''}
                                            </div>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded">
                                            <span className="font-medium text-green-800 text-sm">OS (Left Eye):</span>
                                            <div className="text-base">
                                                {optometristExamData?.examinationData?.refractionSphereOS !== null ?
                                                    ` ${optometristExamData.examinationData.refractionSphereOS > 0 ? '+' : ''}${optometristExamData.examinationData.refractionSphereOS}` : ''
                                                }
                                                {optometristExamData?.examinationData?.refractionCylinderOS !== null ?
                                                    ` ${optometristExamData.examinationData.refractionCylinderOS > 0 ? '+' : ''}${optometristExamData.examinationData.refractionCylinderOS}` : ''
                                                }
                                                {optometristExamData?.examinationData?.refractionAxisOS !== null ?
                                                    ` x ${optometristExamData.examinationData.refractionAxisOS}°` : ''
                                                }
                                                {(!optometristExamData?.examinationData?.refractionSphereOS &&
                                                    !optometristExamData?.examinationData?.refractionCylinderOS &&
                                                    !optometristExamData?.examinationData?.refractionAxisOS) ? 'Not recorded' : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Refraction Data */}
                                {optometristExamData?.examinationData?.refraction && (
                                    <div className="bg-white p-4 rounded-lg">
                                        <h5 className="text-sm font-medium text-gray-600 mb-3">Detailed Refraction Assessment</h5>
                                        <div className="space-y-3">
                                            {/* Sphere */}
                                            {optometristExamData.examinationData.refraction.sphere && (
                                                <div className="bg-blue-50 p-3 rounded">
                                                    <h6 className="text-sm font-medium text-blue-800 mb-2">Sphere</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.refraction.sphere.rightEye ? `${optometristExamData.examinationData.refraction.sphere.rightEye > 0 ? '+' : ''}${optometristExamData.examinationData.refraction.sphere.rightEye}` : 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.refraction.sphere.leftEye ? `${optometristExamData.examinationData.refraction.sphere.leftEye > 0 ? '+' : ''}${optometristExamData.examinationData.refraction.sphere.leftEye}` : 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Cylinder */}
                                            {optometristExamData.examinationData.refraction.cylinder && (
                                                <div className="bg-green-50 p-3 rounded">
                                                    <h6 className="text-sm font-medium text-green-800 mb-2">Cylinder</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.refraction.cylinder.rightEye ? `${optometristExamData.examinationData.refraction.cylinder.rightEye > 0 ? '+' : ''}${optometristExamData.examinationData.refraction.cylinder.rightEye}` : 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.refraction.cylinder.leftEye ? `${optometristExamData.examinationData.refraction.cylinder.leftEye > 0 ? '+' : ''}${optometristExamData.examinationData.refraction.cylinder.leftEye}` : 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Axis */}
                                            {optometristExamData.examinationData.refraction.axis && (
                                                <div className="bg-purple-50 p-3 rounded">
                                                    <h6 className="text-sm font-medium text-purple-800 mb-2">Axis</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.refraction.axis.rightEye ? `${optometristExamData.examinationData.refraction.axis.rightEye}°` : 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.refraction.axis.leftEye ? `${optometristExamData.examinationData.refraction.axis.leftEye}°` : 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Add Power */}
                                            {optometristExamData.examinationData.refraction.add && (
                                                <div className="bg-orange-50 p-3 rounded">
                                                    <h6 className="text-sm font-medium text-orange-800 mb-2">Add Power</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.refraction.add.rightEye ? `+${optometristExamData.examinationData.refraction.add.rightEye}` : 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.refraction.add.leftEye ? `+${optometristExamData.examinationData.refraction.add.leftEye}` : 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Pupillary Distance */}
                                            {optometristExamData.examinationData.refraction.pd && (
                                                <div className="bg-gray-50 p-3 rounded">
                                                    <h6 className="text-sm font-medium text-gray-800 mb-2">Pupillary Distance (PD)</h6>
                                                    <div className="text-sm">
                                                        <span className="font-medium">PD:</span> {optometristExamData.examinationData.refraction.pd} mm
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* IOP Tab */}
                        <TabsContent value="iop" className="mt-4">
                            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold flex items-center text-base">
                                    <TestTube className="h-4 w-4 mr-2 text-purple-600" />
                                    Intraocular Pressure Assessment
                                </h4>
                                
                                {/* Basic IOP */}
                                <div className="bg-white p-4 rounded-lg">
                                    <h5 className="text-sm font-medium text-gray-600 mb-3">IOP Measurements</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-purple-50 p-3 rounded">
                                            <span className="font-medium text-purple-800 text-sm">OD (Right Eye):</span>
                                            <div className="text-base">{optometristExamData?.examinationData?.iopOD ? `${optometristExamData.examinationData.iopOD} mmHg` : 'Not recorded'}</div>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded">
                                            <span className="font-medium text-blue-800 text-sm">OS (Left Eye):</span>
                                            <div className="text-base">{optometristExamData?.examinationData?.iopOS ? `${optometristExamData.examinationData.iopOS} mmHg` : 'Not recorded'}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 p-2 bg-gray-100 rounded">
                                        <span className="text-sm text-gray-600">Method: {optometristExamData?.examinationData?.iopMethod || 'Not specified'}</span>
                                    </div>
                                </div>

                                {/* Detailed Tonometry */}
                                {optometristExamData?.examinationData?.tonometry && (
                                    <div className="bg-white p-4 rounded-lg">
                                        <h5 className="text-sm font-medium text-gray-600 mb-3">Detailed Tonometry Assessment</h5>
                                        <div className="space-y-3">
                                            {/* IOP Values */}
                                            {optometristExamData.examinationData.tonometry.iop && (
                                                <div className="bg-purple-50 p-3 rounded">
                                                    <h6 className="text-sm font-medium text-purple-800 mb-2">Intraocular Pressure</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.tonometry.iop.rightEye ? `${optometristExamData.examinationData.tonometry.iop.rightEye} mmHg` : 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.tonometry.iop.leftEye ? `${optometristExamData.examinationData.tonometry.iop.leftEye} mmHg` : 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Method */}
                                            {optometristExamData.examinationData.tonometry.method && (
                                                <div className="bg-blue-50 p-3 rounded">
                                                    <h6 className="text-sm font-medium text-blue-800 mb-2">Measurement Method</h6>
                                                    <div className="text-sm">
                                                        <span className="font-medium">Method:</span> {optometristExamData.examinationData.tonometry.method}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Time */}
                                            {optometristExamData.examinationData.tonometry.time && (
                                                <div className="bg-green-50 p-3 rounded">
                                                    <h6 className="text-sm font-medium text-green-800 mb-2">Measurement Time</h6>
                                                    <div className="text-sm">
                                                        <span className="font-medium">Time:</span> {optometristExamData.examinationData.tonometry.time}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Additional Tests Tab */}
                        <TabsContent value="additional" className="mt-4">
                            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold flex items-center text-base">
                                    <Microscope className="h-4 w-4 mr-2 text-orange-600" />
                                    Additional Tests & Clinical Findings
                                </h4>
                                
                                {/* Basic Additional Tests */}
                                <div className="bg-white p-4 rounded-lg">
                                    <h5 className="text-sm font-medium text-gray-600 mb-3">Basic Tests</h5>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="bg-red-50 p-3 rounded">
                                            <span className="font-medium text-red-800 text-sm">Color Vision:</span>
                                            <div className="text-sm">{optometristExamData?.examinationData?.colorVision || 'Not tested'}</div>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded">
                                            <span className="font-medium text-blue-800 text-sm">Pupil Reaction:</span>
                                            <div className="text-sm">{optometristExamData?.examinationData?.pupilReaction || 'Not recorded'}</div>
                                        </div>
                                        <div className="bg-green-50 p-3 rounded">
                                            <span className="font-medium text-green-800 text-sm">Eye Alignment:</span>
                                            <div className="text-sm">{optometristExamData?.examinationData?.eyeAlignment || 'Not recorded'}</div>
                                        </div>
                                        <div className="bg-purple-50 p-3 rounded">
                                            <span className="font-medium text-purple-800 text-sm">Extraocular Movements:</span>
                                            <div className="text-sm">{optometristExamData?.examinationData?.additionalTests?.extraocularMovements || 'Not recorded'}</div>
                                        </div>
                                        <div className="bg-yellow-50 p-3 rounded">
                                            <span className="font-medium text-yellow-800 text-sm">Cover Test:</span>
                                            <div className="text-sm">{optometristExamData?.examinationData?.additionalTests?.coverTest || 'Not recorded'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Anterior Segment */}
                                {optometristExamData?.examinationData?.anteriorSegment && (
                                    <div className="bg-white p-4 rounded-lg">
                                        <h5 className="text-sm font-medium text-gray-600 mb-3">Anterior Segment Assessment</h5>
                                        {typeof optometristExamData.examinationData.anteriorSegment === 'string' ? (
                                            <div className="bg-gray-50 p-3 rounded">
                                                <span className="font-medium text-sm">Findings:</span> <span className="text-sm">{optometristExamData.examinationData.anteriorSegment}</span>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {optometristExamData.examinationData.anteriorSegment.findings && (
                                                    <div className="bg-gray-50 p-3 rounded">
                                                        <h6 className="text-xs font-medium text-gray-800 mb-2">General Findings</h6>
                                                        <div className="text-sm">{optometristExamData.examinationData.anteriorSegment.findings}</div>
                                                    </div>
                                                )}

                                                {optometristExamData.examinationData.anteriorSegment.rightEye && (
                                                    <div className="bg-blue-50 p-3 rounded">
                                                        <h6 className="text-xs font-medium text-blue-800 mb-2">Right Eye (OD)</h6>
                                                        <div className="text-sm">{optometristExamData.examinationData.anteriorSegment.rightEye}</div>
                                                    </div>
                                                )}

                                                {optometristExamData.examinationData.anteriorSegment.leftEye && (
                                                    <div className="bg-green-50 p-3 rounded">
                                                        <h6 className="text-xs font-medium text-green-800 mb-2">Left Eye (OS)</h6>
                                                        <div className="text-sm">{optometristExamData.examinationData.anteriorSegment.leftEye}</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Slit Lamp Findings */}
                                {optometristExamData?.examinationData?.clinicalDetails?.slitLampFindings && (
                                    <div className="bg-white p-4 rounded-lg">
                                        <h5 className="text-sm font-medium text-gray-600 mb-3">Slit Lamp Examination</h5>
                                        <div className="space-y-3">
                                            {optometristExamData.examinationData.clinicalDetails.slitLampFindings.eyelids && (
                                                <div className="bg-blue-50 p-3 rounded">
                                                    <h6 className="text-xs font-medium text-blue-800 mb-2">Eyelids</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.clinicalDetails.slitLampFindings.eyelids.rightEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.clinicalDetails.slitLampFindings.eyelids.leftEye || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {optometristExamData.examinationData.clinicalDetails.slitLampFindings.conjunctiva && (
                                                <div className="bg-green-50 p-3 rounded">
                                                    <h6 className="text-xs font-medium text-green-800 mb-2">Conjunctiva</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.clinicalDetails.slitLampFindings.conjunctiva.rightEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.clinicalDetails.slitLampFindings.conjunctiva.leftEye || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {optometristExamData.examinationData.clinicalDetails.slitLampFindings.cornea && (
                                                <div className="bg-purple-50 p-3 rounded">
                                                    <h6 className="text-xs font-medium text-purple-800 mb-2">Cornea</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.clinicalDetails.slitLampFindings.cornea.rightEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.clinicalDetails.slitLampFindings.cornea.leftEye || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {optometristExamData.examinationData.clinicalDetails.slitLampFindings.lens && (
                                                <div className="bg-orange-50 p-3 rounded">
                                                    <h6 className="text-xs font-medium text-orange-800 mb-2">Lens</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.clinicalDetails.slitLampFindings.lens.rightEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.clinicalDetails.slitLampFindings.lens.leftEye || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Pre-Op Tab */}
                        <TabsContent value="preop" className="mt-4">
                            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h4 className="font-semibold flex items-center text-base">
                                    <Microscope className="h-4 w-4 mr-2 text-indigo-600" />
                                    Pre-Operative Parameters
                                </h4>
                                
                                {optometristExamData?.examinationData?.clinicalDetails?.preOpParams ? (
                                    <div className="bg-white p-4 rounded-lg">
                                        <h5 className="text-sm font-medium text-gray-600 mb-3">Pre-Operative Measurements</h5>
                                        <div className="space-y-3">
                                            {/* K1 Values */}
                                            {optometristExamData.examinationData.clinicalDetails.preOpParams.k1 && (
                                                <div className="bg-blue-50 p-3 rounded">
                                                    <h6 className="text-xs font-medium text-blue-800 mb-2">K1 (Keratometry)</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.k1.rightEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.k1.leftEye || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* K2 Values */}
                                            {optometristExamData.examinationData.clinicalDetails.preOpParams.k2 && (
                                                <div className="bg-green-50 p-3 rounded">
                                                    <h6 className="text-xs font-medium text-green-800 mb-2">K2 (Keratometry)</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.k2.rightEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.k2.leftEye || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ACD Values */}
                                            {optometristExamData.examinationData.clinicalDetails.preOpParams.acd && (
                                                <div className="bg-purple-50 p-3 rounded">
                                                    <h6 className="text-xs font-medium text-purple-800 mb-2">ACD (Anterior Chamber Depth)</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.acd.rightEye || 'N/A'} mm</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.acd.leftEye || 'N/A'} mm</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* AXL Values */}
                                            {optometristExamData.examinationData.clinicalDetails.preOpParams.axl && (
                                                <div className="bg-orange-50 p-3 rounded">
                                                    <h6 className="text-xs font-medium text-orange-800 mb-2">AXL (Axial Length)</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.axl.rightEye || 'N/A'} mm</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.axl.leftEye || 'N/A'} mm</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Flat Axis */}
                                            {optometristExamData.examinationData.clinicalDetails.preOpParams.flatAxis && (
                                                <div className="bg-teal-50 p-3 rounded">
                                                    <h6 className="text-xs font-medium text-teal-800 mb-2">Flat Axis</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.flatAxis.rightEye || 'N/A'}</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.flatAxis.leftEye || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* IOL Power Planned */}
                                            {optometristExamData.examinationData.clinicalDetails.preOpParams.iolPowerPlanned && (
                                                <div className="bg-indigo-50 p-3 rounded">
                                                    <h6 className="text-xs font-medium text-indigo-800 mb-2">IOL Power Planned</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.iolPowerPlanned.rightEye || 'N/A'} D</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.iolPowerPlanned.leftEye || 'N/A'} D</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* IOL Implanted */}
                                            {optometristExamData.examinationData.clinicalDetails.preOpParams.iolImplanted && (
                                                <div className="bg-pink-50 p-3 rounded">
                                                    <h6 className="text-xs font-medium text-pink-800 mb-2">IOL Implanted</h6>
                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                        <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.iolImplanted.rightEye || 'N/A'} D</div>
                                                        <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.iolImplanted.leftEye || 'N/A'} D</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Any Other Details */}
                                            {optometristExamData.examinationData.clinicalDetails.preOpParams.anyOtherDetails && (
                                                (optometristExamData.examinationData.clinicalDetails.preOpParams.anyOtherDetails.rightEye ||
                                                 optometristExamData.examinationData.clinicalDetails.preOpParams.anyOtherDetails.leftEye) && (
                                                    <div className="bg-gray-100 p-3 rounded">
                                                        <h6 className="text-xs font-medium text-gray-800 mb-2">Other Details</h6>
                                                        <div className="space-y-1 text-sm">
                                                            {optometristExamData.examinationData.clinicalDetails.preOpParams.anyOtherDetails.rightEye && (
                                                                <div><span className="font-medium">OD:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.anyOtherDetails.rightEye}</div>
                                                            )}
                                                            {optometristExamData.examinationData.clinicalDetails.preOpParams.anyOtherDetails.leftEye && (
                                                                <div><span className="font-medium">OS:</span> {optometristExamData.examinationData.clinicalDetails.preOpParams.anyOtherDetails.leftEye}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Microscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No pre-operative parameters recorded</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                )}

                {/* Optometrist Information */}
                {optometristExamData && (
                    <>
                        {/* Optometrist Details */}
                        <div className="mt-6">
                            <h4 className="font-semibold mb-3">Examined By</h4>
                            <div className="bg-green-50 p-3 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4 text-green-600" />
                                    <span className="font-medium text-green-800">
                                        {optometristExamData?.optometrist?.name || 'Unknown Optometrist'}
                                    </span>
                                    {optometristExamData?.optometrist?.employeeId && (
                                        <span className="text-sm text-green-600">
                                            (ID: {optometristExamData.optometrist.employeeId})
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-green-600 mt-1">
                                    Completed: {optometristExamData?.completedAt ?
                                        new Date(optometristExamData.completedAt).toLocaleString() :
                                        'Date not available'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Optometrist Notes */}
                        {optometristExamData?.examinationData?.clinicalNotes && (
                            <div className="mt-6">
                                <h4 className="font-semibold mb-3">Optometrist Notes</h4>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-700">
                                        "{optometristExamData.examinationData.clinicalNotes}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Additional Notes */}
                        {optometristExamData?.examinationData?.additionalNotes && (
                            <div className="mt-4">
                                <h4 className="font-semibold mb-3">Additional Notes</h4>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-700">
                                        {optometristExamData.examinationData.additionalNotes}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Preliminary Diagnosis */}
                        {optometristExamData?.examinationData?.preliminaryDiagnosis && (
                            <div className="mt-4">
                                <h4 className="font-semibold mb-2">Preliminary Diagnosis</h4>
                                <Badge className="bg-yellow-100 text-yellow-800">
                                    {optometristExamData.examinationData.preliminaryDiagnosis}
                                </Badge>
                            </div>
                        )}

                        {/* Urgency Level */}
                        {optometristExamData?.examinationData?.urgencyLevel && (
                            <div className="mt-4">
                                <h4 className="font-semibold mb-2">Urgency Level</h4>
                                <Badge className={
                                    optometristExamData.examinationData.urgencyLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                                        optometristExamData.examinationData.urgencyLevel === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                                            'bg-green-100 text-green-800'
                                }>
                                    {optometristExamData.examinationData.urgencyLevel}
                                </Badge>
                            </div>
                        )}

                        {/* Requires Dilation */}
                        {optometristExamData?.examinationData?.requiresDilation && (
                            <div className="mt-4">
                                <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                                    <div className="flex items-center">
                                        <TestTube className="h-4 w-4 text-orange-600 mr-2" />
                                        <span className="font-medium text-orange-800">Dilation Required</span>
                                    </div>
                                    <p className="text-sm text-orange-700 mt-1">
                                        Optometrist has indicated that pupil dilation is required for this examination.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default OptometristFindingsTab;
