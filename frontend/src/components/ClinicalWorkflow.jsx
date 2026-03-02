
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Stethoscope, Pill, Scissors, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// Examination data structure:
// { id, patientName, patientNumber, doctorName, examinationType, findings, measurements, status, timestamp }

// DilationRecord data structure:
// { id, patientName, patientNumber, dropsType, administeredTime, administeredBy, callbackTime, status }

// Diagnosis data structure:
// { id, patientName, patientNumber, doctorName, disease, severity, affectedEye, treatmentPlan, status }

const ClinicalWorkflow = () => {
  const [examinations, setExaminations] = useState([
    {
      id: "1",
      patientName: "Snehal Deshmukh",
      patientNumber: "OPH2024001",
      doctorName: "Dr. Abhijeet Agre (Ophthalmologist)",
      examinationType: "Vision Test",
      findings: "Mild myopia, requires corrective lenses",
      measurements: {
        visualAcuity: { left: "20/30", right: "20/25" },
        refraction: { left: "-1.25", right: "-1.00" },
        intraocularPressure: { left: "14 mmHg", right: "15 mmHg" }
      },
      status: "completed",
      timestamp: "2024-01-15T09:45:00"
    },
    {
      id: "2",
      patientName: "Vikram Jadhav",
      patientNumber: "OPH2024002",
      doctorName: "Dr. Siddharth Deshmukh (Senior Ophthalmologist)",
      examinationType: "Retinal Examination",
      findings: "Requires dilation for comprehensive retinal assessment",
      measurements: {},
      status: "requires-dilation",
      timestamp: "2024-01-15T10:30:00"
    }
  ]);

  const [dilationRecords, setDilationRecords] = useState([
    {
      id: "1",
      patientName: "Vikram Jadhav",
      patientNumber: "OPH2024002",
      dropsType: "Tropicamide 1%",
      administeredTime: "2024-01-15T10:35:00",
      administeredBy: "Nurse Shilpa Gaikwad",
      callbackTime: "2024-01-15T11:05:00",
      status: "ready-for-exam"
    }
  ]);

  const [diagnoses, setDiagnoses] = useState([
    {
      id: "1",
      patientName: "Priya Jadhav",
      patientNumber: "OPH2024003",
      doctorName: "Dr. Abhijeet Agre (Ophthalmologist)",
      disease: "Cataract",
      severity: "Moderate",
      affectedEye: "both",
      treatmentPlan: "Phacoemulsification surgery recommended for both eyes",
      status: "surgery-required"
    }
  ]);

  const [newExamination, setNewExamination] = useState({
    patientName: "",
    patientNumber: "",
    doctorName: "",
    examinationType: "",
    findings: "",
    leftEyeVA: "",
    rightEyeVA: "",
    leftEyeIOP: "",
    rightEyeIOP: ""
  });

  const [newDiagnosis, setNewDiagnosis] = useState({
    patientName: "",
    patientNumber: "",
    doctorName: "",
    disease: "",
    severity: "",
    affectedEye: "both",
    treatmentPlan: ""
  });

  const diseaseOptions = [
    "Cataract", "Glaucoma", "Diabetic Retinopathy", "Macular Degeneration",
    "Corneal Dystrophy", "Strabismus", "Ptosis", "Refractive Error",
    "Dry Eye Syndrome", "Conjunctivitis"
  ];

  const examinationTypes = [
    "Vision Test", "Retinal Examination", "Glaucoma Screening",
    "Cataract Assessment", "Corneal Examination", "Eye Pressure Test",
    "Visual Field Test", "OCT Scan", "Fundoscopy"
  ];

  const handleExaminationSubmit = (e) => {
    e.preventDefault();

    const examination = {
      id: Date.now().toString(),
      patientName: newExamination.patientName,
      patientNumber: newExamination.patientNumber,
      doctorName: newExamination.doctorName,
      examinationType: newExamination.examinationType,
      findings: newExamination.findings,
      measurements: {
        visualAcuity: {
          left: newExamination.leftEyeVA,
          right: newExamination.rightEyeVA
        },
        intraocularPressure: {
          left: newExamination.leftEyeIOP,
          right: newExamination.rightEyeIOP
        }
      },
      status: "completed",
      timestamp: new Date().toISOString()
    };

    setExaminations([...examinations, examination]);
    setNewExamination({
      patientName: "",
      patientNumber: "",
      doctorName: "",
      examinationType: "",
      findings: "",
      leftEyeVA: "",
      rightEyeVA: "",
      leftEyeIOP: "",
      rightEyeIOP: ""
    });

    toast.success(`Examination completed for ${examination.patientName}`);
  };

  const handleDiagnosisSubmit = (e) => {
    e.preventDefault();

    const diagnosis = {
      id: Date.now().toString(),
      patientName: newDiagnosis.patientName,
      patientNumber: newDiagnosis.patientNumber,
      doctorName: newDiagnosis.doctorName,
      disease: newDiagnosis.disease,
      severity: newDiagnosis.severity,
      affectedEye: newDiagnosis.affectedEye,
      treatmentPlan: newDiagnosis.treatmentPlan,
      status: newDiagnosis.treatmentPlan.toLowerCase().includes("surgery") ? "surgery-required" : "treatment-planned"
    };

    setDiagnoses([...diagnoses, diagnosis]);
    setNewDiagnosis({
      patientName: "",
      patientNumber: "",
      doctorName: "",
      disease: "",
      severity: "",
      affectedEye: "both",
      treatmentPlan: ""
    });

    toast.success(`Diagnosis recorded for ${diagnosis.patientName}`);
  };

  const administerDilation = (patientName, patientNumber) => {
    const dilationRecord = {
      id: Date.now().toString(),
      patientName,
      patientNumber,
      dropsType: "Tropicamide 1%",
      administeredTime: new Date().toISOString(),
      administeredBy: "Current Staff",
      callbackTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes later
      status: "administered"
    };

    setDilationRecords([...dilationRecords, dilationRecord]);
    toast.success(`Dilation drops administered to ${patientName}. Callback scheduled for ${new Date(dilationRecord.callbackTime).toLocaleTimeString()}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-yellow-100 text-yellow-800";
      case "requires-dilation": return "bg-purple-100 text-purple-800";
      case "administered": return "bg-blue-100 text-blue-800";
      case "ready-for-exam": return "bg-green-100 text-green-800";
      case "diagnosed": return "bg-blue-100 text-blue-800";
      case "treatment-planned": return "bg-yellow-100 text-yellow-800";
      case "surgery-required": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case "mild": return "bg-green-100 text-green-800";
      case "moderate": return "bg-yellow-100 text-yellow-800";
      case "severe": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="examinations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="examinations">Examinations</TabsTrigger>
          <TabsTrigger value="dilation">Dilation Tracking</TabsTrigger>
          <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
          <TabsTrigger value="workflow">Patient Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="examinations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Examination Form */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span>Record Examination</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleExaminationSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="patientName">Patient Name</Label>
                      <Input
                        id="patientName"
                        value={newExamination.patientName}
                        onChange={(e) => setNewExamination({ ...newExamination, patientName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientNumber">Patient Number</Label>
                      <Input
                        id="patientNumber"
                        value={newExamination.patientNumber}
                        onChange={(e) => setNewExamination({ ...newExamination, patientNumber: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="doctorName">Doctor</Label>
                    <Select value={newExamination.doctorName} onValueChange={(value) => setNewExamination({ ...newExamination, doctorName: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dr. Abhijeet Agre (Ophthalmologist)">Dr. Abhijeet Agre (Ophthalmologist)</SelectItem>
                        <SelectItem value="Dr. Siddharth Deshmukh (Senior Ophthalmologist)">Dr. Siddharth Deshmukh (Senior Ophthalmologist)</SelectItem>
                        <SelectItem value="Dr. Vikram Jadhav (Retina Specialist)">Dr. Vikram Jadhav (Retina Specialist)</SelectItem>
                        <SelectItem value="Dr. Aniket Patil (Cornea Specialist)">Dr. Aniket Patil (Cornea Specialist)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="examinationType">Examination Type</Label>
                    <Select value={newExamination.examinationType} onValueChange={(value) => setNewExamination({ ...newExamination, examinationType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select examination type" />
                      </SelectTrigger>
                      <SelectContent>
                        {examinationTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="leftEyeVA">Left Eye Visual Acuity</Label>
                      <Input
                        id="leftEyeVA"
                        placeholder="e.g., 20/20"
                        value={newExamination.leftEyeVA}
                        onChange={(e) => setNewExamination({ ...newExamination, leftEyeVA: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rightEyeVA">Right Eye Visual Acuity</Label>
                      <Input
                        id="rightEyeVA"
                        placeholder="e.g., 20/20"
                        value={newExamination.rightEyeVA}
                        onChange={(e) => setNewExamination({ ...newExamination, rightEyeVA: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="leftEyeIOP">Left Eye IOP</Label>
                      <Input
                        id="leftEyeIOP"
                        placeholder="e.g., 15 mmHg"
                        value={newExamination.leftEyeIOP}
                        onChange={(e) => setNewExamination({ ...newExamination, leftEyeIOP: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rightEyeIOP">Right Eye IOP</Label>
                      <Input
                        id="rightEyeIOP"
                        placeholder="e.g., 15 mmHg"
                        value={newExamination.rightEyeIOP}
                        onChange={(e) => setNewExamination({ ...newExamination, rightEyeIOP: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="findings">Clinical Findings</Label>
                    <Textarea
                      id="findings"
                      value={newExamination.findings}
                      onChange={(e) => setNewExamination({ ...newExamination, findings: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Record Examination
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Examinations List */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Recent Examinations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {examinations.map((exam) => (
                    <div key={exam.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{exam.patientName}</h3>
                          <p className="text-sm text-gray-600">{exam.patientNumber}</p>
                          <p className="text-sm text-gray-500">{exam.doctorName}</p>
                        </div>
                        <Badge className={getStatusColor(exam.status)}>
                          {exam.status.replace('-', ' ')}
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900">{exam.examinationType}</h4>
                        <p className="text-sm text-gray-600 mt-1">{exam.findings}</p>
                      </div>

                      {exam.measurements.visualAcuity && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Visual Acuity:</span>
                            <div className="text-gray-600">
                              L: {exam.measurements.visualAcuity.left}, R: {exam.measurements.visualAcuity.right}
                            </div>
                          </div>
                          {exam.measurements.intraocularPressure && (
                            <div>
                              <span className="font-medium">IOP:</span>
                              <div className="text-gray-600">
                                L: {exam.measurements.intraocularPressure.left}, R: {exam.measurements.intraocularPressure.right}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {exam.status === "requires-dilation" && (
                        <Button
                          onClick={() => administerDilation(exam.patientName, exam.patientNumber)}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          size="sm"
                        >
                          Administer Dilation Drops
                        </Button>
                      )}

                      <div className="text-xs text-gray-500">
                        {new Date(exam.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dilation" className="space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span>Dilation Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dilationRecords.map((record) => {
                  const administeredTime = new Date(record.administeredTime);
                  const callbackTime = new Date(record.callbackTime);
                  const currentTime = new Date();
                  const elapsedMinutes = Math.floor((currentTime.getTime() - administeredTime.getTime()) / (1000 * 60));
                  const isReady = currentTime >= callbackTime;

                  return (
                    <div key={record.id} className="border rounded-lg p-4 space-y-3 bg-purple-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{record.patientName}</h3>
                          <p className="text-sm text-gray-600">{record.patientNumber}</p>
                          <p className="text-sm text-gray-500">Drops: {record.dropsType}</p>
                          <p className="text-sm text-gray-500">By: {record.administeredBy}</p>
                        </div>
                        <Badge className={getStatusColor(isReady ? "ready-for-exam" : "administered")}>
                          {isReady ? "Ready for Exam" : "Waiting"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Administered:</span>
                          <div className="text-gray-600">{administeredTime.toLocaleTimeString()}</div>
                        </div>
                        <div>
                          <span className="font-medium">Callback Time:</span>
                          <div className="text-gray-600">{callbackTime.toLocaleTimeString()}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Elapsed Time:</span>
                          <span className={isReady ? "text-green-600 font-medium" : "text-gray-600"}>
                            {elapsedMinutes} / 30 minutes
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${isReady ? "bg-green-500" : "bg-purple-500"
                              }`}
                            style={{ width: `${Math.min((elapsedMinutes / 30) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {isReady && (
                        <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-2 rounded">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Patient ready for re-examination</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnoses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Diagnosis Form */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Stethoscope className="h-5 w-5 text-green-600" />
                  <span>Record Diagnosis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDiagnosisSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="diagPatientName">Patient Name</Label>
                      <Input
                        id="diagPatientName"
                        value={newDiagnosis.patientName}
                        onChange={(e) => setNewDiagnosis({ ...newDiagnosis, patientName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="diagPatientNumber">Patient Number</Label>
                      <Input
                        id="diagPatientNumber"
                        value={newDiagnosis.patientNumber}
                        onChange={(e) => setNewDiagnosis({ ...newDiagnosis, patientNumber: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="diagDoctorName">Doctor</Label>
                    <Select value={newDiagnosis.doctorName} onValueChange={(value) => setNewDiagnosis({ ...newDiagnosis, doctorName: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dr. Williams (Ophthalmologist)">Dr. Williams (Ophthalmologist)</SelectItem>
                        <SelectItem value="Dr. Johnson (Ophthalmologist)">Dr. Johnson (Ophthalmologist)</SelectItem>
                        <SelectItem value="Dr. Brown (Ophthalmologist)">Dr. Brown (Ophthalmologist)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="disease">Disease/Condition</Label>
                      <Select value={newDiagnosis.disease} onValueChange={(value) => setNewDiagnosis({ ...newDiagnosis, disease: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select disease" />
                        </SelectTrigger>
                        <SelectContent>
                          {diseaseOptions.map((disease) => (
                            <SelectItem key={disease} value={disease}>{disease}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="severity">Severity</Label>
                      <Select value={newDiagnosis.severity} onValueChange={(value) => setNewDiagnosis({ ...newDiagnosis, severity: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mild">Mild</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Severe">Severe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="affectedEye">Affected Eye</Label>
                    <Select value={newDiagnosis.affectedEye} onValueChange={(value) => setNewDiagnosis({ ...newDiagnosis, affectedEye: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left Eye</SelectItem>
                        <SelectItem value="right">Right Eye</SelectItem>
                        <SelectItem value="both">Both Eyes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="treatmentPlan">Treatment Plan</Label>
                    <Textarea
                      id="treatmentPlan"
                      value={newDiagnosis.treatmentPlan}
                      onChange={(e) => setNewDiagnosis({ ...newDiagnosis, treatmentPlan: e.target.value })}
                      rows={3}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    <Pill className="h-4 w-4 mr-2" />
                    Record Diagnosis
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Diagnoses List */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Recent Diagnoses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {diagnoses.map((diagnosis) => (
                    <div key={diagnosis.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{diagnosis.patientName}</h3>
                          <p className="text-sm text-gray-600">{diagnosis.patientNumber}</p>
                          <p className="text-sm text-gray-500">{diagnosis.doctorName}</p>
                        </div>
                        <Badge className={getStatusColor(diagnosis.status)}>
                          {diagnosis.status.replace('-', ' ')}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{diagnosis.disease}</h4>
                          <Badge className={getSeverityColor(diagnosis.severity)}>
                            {diagnosis.severity}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Affected: </span>
                          {diagnosis.affectedEye === "both" ? "Both eyes" : `${diagnosis.affectedEye} eye`}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Treatment: </span>
                          {diagnosis.treatmentPlan}
                        </div>
                      </div>

                      {diagnosis.status === "surgery-required" && (
                        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded">
                          <Scissors className="h-4 w-4" />
                          <span className="text-sm font-medium">Surgery Required - Convert to IPD</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <span>Patient Clinical Workflow</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Workflow Visualization */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-medium text-blue-900">Initial Examination</h3>
                    <p className="text-sm text-blue-700 mt-1">Optometrist - Ground Floor</p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-medium text-purple-900">Dilation (if needed)</h3>
                    <p className="text-sm text-purple-700 mt-1">20-30 minute wait</p>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-medium text-green-900">Specialist Consultation</h3>
                    <p className="text-sm text-green-700 mt-1">Ophthalmologist - Upper Floors</p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Pill className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-medium text-orange-900">Treatment/Discharge</h3>
                    <p className="text-sm text-orange-700 mt-1">Billing & Follow-up</p>
                  </div>
                </div>

                {/* Current Workflow Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Patients in Workflow</h3>
                    <div className="space-y-3">
                      {[
                        { name: "Sarah Johnson", stage: "Initial Examination", status: "completed" },
                        { name: "Michael Chen", stage: "Dilation Waiting", status: "in-progress" },
                        { name: "Emma Davis", stage: "Specialist Consultation", status: "in-progress" },
                        { name: "Robert Wilson", stage: "Treatment Planning", status: "waiting" }
                      ].map((patient, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{patient.name}</span>
                            <p className="text-sm text-gray-600">{patient.stage}</p>
                          </div>
                          <Badge className={getStatusColor(patient.status)}>
                            {patient.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Critical Alerts</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium text-orange-900">Dilation Callback Due</p>
                          <p className="text-sm text-orange-700">Michael Chen - Ready for re-examination</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <Scissors className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-red-900">Surgery Required</p>
                          <p className="text-sm text-red-700">Emma Davis - Convert OPD to IPD</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">Follow-up Scheduled</p>
                          <p className="text-sm text-blue-700">Sarah Johnson - 1 week post-treatment</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClinicalWorkflow;
