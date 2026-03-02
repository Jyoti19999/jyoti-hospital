// src/pages/MedicalRecords.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { patientService } from '@/services/patientService';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import {
  FileText,
  Calendar,
  User,
  Stethoscope,
  Eye,
  Clock,
  Search,
  LayoutDashboard,
  AlertCircle,
  Timer,
  Activity,
  ClipboardList,
  CheckCircle2,
  CalendarClock,
  Loader2,
  Menu,
  LogOut,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const MedicalRecords = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamination, setSelectedExamination] = useState(null);
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const { data: recordsData, isLoading, error } = useQuery({
    queryKey: ['medical-records'],
    queryFn: patientService.getPatientMedicalRecords,
    staleTime: 2 * 60 * 1000,
  });

  const appointments = recordsData?.data || [];

  // Categorize appointments
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const categorize = (apt) => {
    if (apt.status === 'COMPLETED' || apt.visit?.status === 'COMPLETED') return 'completed';
    if (apt.status === 'CANCELLED') return 'completed';
    if (apt.status === 'IN_PROGRESS' || apt.visit?.status === 'IN_PROGRESS' || apt.status === 'CHECKED_IN') return 'inProgress';
    const date = new Date(apt.appointmentDate);
    date.setHours(0, 0, 0, 0);
    if (date >= now) return 'upcoming';
    return 'completed';
  };

  const upcomingAppointments = appointments.filter(a => categorize(a) === 'upcoming');
  const inProgressAppointments = appointments.filter(a => categorize(a) === 'inProgress');
  const completedAppointments = appointments.filter(a => categorize(a) === 'completed');

  const filterBySearch = (list) =>
    list.filter(a =>
      !searchTerm ||
      a.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tokenNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getStatusBadge = (status) => {
    const map = {
      SCHEDULED: { label: 'Scheduled', cls: 'bg-blue-100 text-blue-800' },
      CHECKED_IN: { label: 'Checked In', cls: 'bg-indigo-100 text-indigo-800' },
      IN_PROGRESS: { label: 'In Progress', cls: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { label: 'Completed', cls: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-800' },
      NO_SHOW: { label: 'No Show', cls: 'bg-gray-100 text-gray-800' },
    };
    const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-800' };
    return <Badge className={s.cls}>{s.label}</Badge>;
  };

  const handleViewExamination = (appointment) => {
    if (!appointment.visit) {
      toast({ title: 'No visit data', description: 'No examination data available for this appointment.', variant: 'destructive' });
      return;
    }
    setSelectedExamination(appointment);
  };

  const renderAppointmentCard = (appointment) => (
    <Card key={appointment.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Stethoscope className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{appointment.doctorName}</h3>
                {getStatusBadge(appointment.status)}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {format(new Date(appointment.appointmentDate), 'dd MMM yyyy')}
                </span>
                {appointment.appointmentTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    {appointment.appointmentTime}
                  </span>
                )}
                <span className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                  Token: {appointment.tokenNumber}
                </span>
              </div>
              {appointment.purpose && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-1">{appointment.purpose}</p>
              )}
              {appointment.doctor?.department && (
                <p className="text-xs text-gray-400 mt-0.5">{appointment.doctor.department}</p>
              )}
            </div>
          </div>

          {appointment.hasExamination && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewExamination(appointment)}
              className="flex-shrink-0 border-blue-200 text-blue-700 hover:bg-blue-50 px-2 sm:px-3"
            >
              <ClipboardList className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">View Report</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderAppointmentList = (list, emptyMessage) => {
    const filtered = filterBySearch(list);
    if (filtered.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      );
    }
    return <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">{filtered.map(renderAppointmentCard)}</div>;
  };

  // --- Examination detail helpers ---

  const renderValueRow = (label, value, unit = '') => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value}{unit ? ` ${unit}` : ''}</span>
      </div>
    );
  };

  const renderSection = (title, icon, children) => {
    const content = React.Children.toArray(children).filter(Boolean);
    if (content.length === 0) return null;
    return (
      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          {icon}
          {title}
        </h4>
        <div>{children}</div>
      </div>
    );
  };

  const renderOptometristExam = (exam) => {
    if (!exam) return null;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Eye className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800">Optometrist Examination</h3>
            {exam.optometrist && (
              <p className="text-xs text-gray-500">By {exam.optometrist.firstName} {exam.optometrist.lastName}</p>
            )}
          </div>
          {exam.completedAt && (
            <span className="ml-auto text-xs text-gray-400">{format(new Date(exam.completedAt), 'PPp')}</span>
          )}
        </div>

        {renderSection('Visual Acuity', <Eye className="h-4 w-4 text-blue-500" />,
          <>
            {renderValueRow('UCVA - Right Eye (OD)', exam.ucvaOD)}
            {renderValueRow('UCVA - Left Eye (OS)', exam.ucvaOS)}
            {renderValueRow('BCVA - Right Eye (OD)', exam.bcvaOD)}
            {renderValueRow('BCVA - Left Eye (OS)', exam.bcvaOS)}
          </>
        )}

        {renderSection('Refraction', <Activity className="h-4 w-4 text-purple-500" />,
          <>
            {renderValueRow('Sphere OD', exam.refractionSphereOD, 'D')}
            {renderValueRow('Cylinder OD', exam.refractionCylinderOD, 'D')}
            {renderValueRow('Axis OD', exam.refractionAxisOD, '°')}
            {renderValueRow('Sphere OS', exam.refractionSphereOS, 'D')}
            {renderValueRow('Cylinder OS', exam.refractionCylinderOS, 'D')}
            {renderValueRow('Axis OS', exam.refractionAxisOS, '°')}
          </>
        )}

        {renderSection('Intraocular Pressure (IOP)', <Activity className="h-4 w-4 text-orange-500" />,
          <>
            {renderValueRow('IOP - Right Eye (OD)', exam.iopOD, 'mmHg')}
            {renderValueRow('IOP - Left Eye (OS)', exam.iopOS, 'mmHg')}
            {renderValueRow('Method', exam.iopMethod)}
          </>
        )}

        {renderSection('Additional Tests', <ClipboardList className="h-4 w-4 text-indigo-500" />,
          <>
            {renderValueRow('Color Vision', exam.colorVision)}
            {renderValueRow('Pupil Reaction', exam.pupilReaction)}
            {renderValueRow('Eye Alignment', exam.eyeAlignment)}
          </>
        )}

        {(exam.preliminaryDiagnosis || exam.clinicalNotes || exam.additionalNotes) && (
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Clinical Notes
            </h4>
            {exam.preliminaryDiagnosis && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Preliminary Diagnosis</span>
                <p className="text-sm text-gray-800 mt-0.5">{exam.preliminaryDiagnosis}</p>
              </div>
            )}
            {exam.clinicalNotes && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Clinical Notes</span>
                <p className="text-sm text-gray-800 mt-0.5">{exam.clinicalNotes}</p>
              </div>
            )}
            {exam.additionalNotes && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Additional Notes</span>
                <p className="text-sm text-gray-800 mt-0.5">{exam.additionalNotes}</p>
              </div>
            )}
          </div>
        )}

        {(exam.requiresDilation || exam.urgencyLevel) && (
          <div className="flex items-center gap-2 flex-wrap">
            {exam.requiresDilation && (
              <Badge className="bg-amber-100 text-amber-800">Dilation Required</Badge>
            )}
            {exam.urgencyLevel && (
              <Badge className={
                exam.urgencyLevel === 'high' ? 'bg-red-100 text-red-800' :
                exam.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }>{exam.urgencyLevel} urgency</Badge>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderOphthalmologistExam = (exams) => {
    if (!exams || exams.length === 0) return null;
    const exam = exams[0];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Stethoscope className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-800">Ophthalmologist Examination</h3>
            {exam.doctor && (
              <p className="text-xs text-gray-500">By Dr. {exam.doctor.firstName} {exam.doctor.lastName}</p>
            )}
          </div>
          {exam.completedAt && (
            <span className="ml-auto text-xs text-gray-400">{format(new Date(exam.completedAt), 'PPp')}</span>
          )}
        </div>

        {renderSection('Distance Vision', <Eye className="h-4 w-4 text-blue-500" />,
          <>
            {renderValueRow('Right Eye (OD)', exam.distanceOD)}
            {renderValueRow('Left Eye (OS)', exam.distanceOS)}
            {renderValueRow('Binocular', exam.distanceBinocular)}
          </>
        )}

        {renderSection('Near Vision', <Eye className="h-4 w-4 text-teal-500" />,
          <>
            {renderValueRow('Right Eye (OD)', exam.nearOD)}
            {renderValueRow('Left Eye (OS)', exam.nearOS)}
            {renderValueRow('Binocular', exam.nearBinocular)}
          </>
        )}

        {renderSection('Refraction', <Activity className="h-4 w-4 text-purple-500" />,
          <>
            {renderValueRow('Sphere OD', exam.refractionSphereOD, 'D')}
            {renderValueRow('Cylinder OD', exam.refractionCylinderOD, 'D')}
            {renderValueRow('Axis OD', exam.refractionAxisOD, '°')}
            {renderValueRow('Sphere OS', exam.refractionSphereOS, 'D')}
            {renderValueRow('Cylinder OS', exam.refractionCylinderOS, 'D')}
            {renderValueRow('Axis OS', exam.refractionAxisOS, '°')}
            {renderValueRow('Add OD', exam.refractionAddOD, 'D')}
            {renderValueRow('Add OS', exam.refractionAddOS, 'D')}
            {renderValueRow('PD', exam.refractionPD, 'mm')}
          </>
        )}

        {renderSection('Intraocular Pressure', <Activity className="h-4 w-4 text-orange-500" />,
          <>
            {renderValueRow('IOP - Right Eye (OD)', exam.iopOD, 'mmHg')}
            {renderValueRow('IOP - Left Eye (OS)', exam.iopOS, 'mmHg')}
            {renderValueRow('Method', exam.iopMethod)}
          </>
        )}

        {renderSection('Additional Tests', <ClipboardList className="h-4 w-4 text-indigo-500" />,
          <>
            {renderValueRow('Pupil Reaction', exam.pupilReaction)}
            {renderValueRow('Color Vision', exam.colorVision)}
            {renderValueRow('Eye Alignment', exam.eyeAlignment)}
            {renderValueRow('Extraocular Movements', exam.extraocularMovements)}
            {renderValueRow('Cover Test', exam.coverTest)}
          </>
        )}

        {renderSection('Slit Lamp Findings', <Eye className="h-4 w-4 text-emerald-500" />,
          <>
            {renderValueRow('Eyelids OD', exam.eyelidsOD)}
            {renderValueRow('Eyelids OS', exam.eyelidsOS)}
            {renderValueRow('Conjunctiva OD', exam.conjunctivaOD)}
            {renderValueRow('Conjunctiva OS', exam.conjunctivaOS)}
            {renderValueRow('Cornea OD', exam.corneaOD)}
            {renderValueRow('Cornea OS', exam.corneaOS)}
            {renderValueRow('Lens OD', exam.lensOD)}
            {renderValueRow('Lens OS', exam.lensOS)}
          </>
        )}

        {(exam.k1OD || exam.k2OD || exam.acdOD || exam.axlOD || exam.iolPowerPlannedOD) &&
          renderSection('Pre-Op Parameters', <Activity className="h-4 w-4 text-rose-500" />,
            <>
              {renderValueRow('K1 OD', exam.k1OD)}
              {renderValueRow('K1 OS', exam.k1OS)}
              {renderValueRow('K2 OD', exam.k2OD)}
              {renderValueRow('K2 OS', exam.k2OS)}
              {renderValueRow('ACD OD', exam.acdOD)}
              {renderValueRow('ACD OS', exam.acdOS)}
              {renderValueRow('Axial Length OD', exam.axlOD)}
              {renderValueRow('Axial Length OS', exam.axlOS)}
              {renderValueRow('IOL Power Planned OD', exam.iolPowerPlannedOD)}
              {renderValueRow('IOL Power Planned OS', exam.iolPowerPlannedOS)}
              {renderValueRow('IOL Implanted OD', exam.iolImplantedOD)}
              {renderValueRow('IOL Implanted OS', exam.iolImplantedOS)}
            </>
          )}

        {(exam.clinicalNotes || exam.preliminaryDiagnosis || exam.examinationNotes) && (
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Clinical Notes
            </h4>
            {exam.preliminaryDiagnosis && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Diagnosis</span>
                <p className="text-sm text-gray-800 mt-0.5">{exam.preliminaryDiagnosis}</p>
              </div>
            )}
            {exam.clinicalNotes && (
              <div className="mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase">Clinical Notes</span>
                <p className="text-sm text-gray-800 mt-0.5">{exam.clinicalNotes}</p>
              </div>
            )}
            {exam.examinationNotes && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Examination Notes</span>
                <p className="text-sm text-gray-800 mt-0.5">{exam.examinationNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Diagnoses */}
        {exam.diagnoses?.length > 0 && (
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Diagnoses
            </h4>
            <div className="space-y-2">
              {exam.diagnoses.map((dx, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{dx.disease?.name || dx.diagnosisText || 'Diagnosis'}</span>
                    {dx.disease?.icd11Code && (
                      <Badge className="bg-gray-200 text-gray-700 text-xs">{dx.disease.icd11Code.code}</Badge>
                    )}
                    {dx.isPrimary && <Badge className="bg-blue-100 text-blue-800 text-xs">Primary</Badge>}
                  </div>
                  {dx.notes && <p className="text-xs text-gray-500 mt-1">{dx.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Follow-up & Surgery */}
        {(exam.followUpRequired || exam.surgeryRecommended) && (
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-500" />
              Recommendations
            </h4>
            {exam.followUpRequired && (
              <div className="mb-2">
                <Badge className="bg-blue-100 text-blue-800 mr-2">Follow-up Required</Badge>
                {exam.followUpDate && (
                  <span className="text-sm text-gray-600">by {format(new Date(exam.followUpDate), 'PPP')}</span>
                )}
                {exam.followUpPeriod && !exam.followUpDate && (
                  <span className="text-sm text-gray-600">in {exam.followUpDays} {exam.followUpPeriod}</span>
                )}
              </div>
            )}
            {exam.surgeryRecommended && (
              <Badge className="bg-red-100 text-red-800">Surgery Recommended</Badge>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden">
      <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-slate-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm sm:text-xl font-bold text-slate-800 dark:text-slate-200">Medical Records</h1>
                <p className="hidden sm:block text-sm text-slate-600 dark:text-slate-400">Your appointments & examination reports</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-2">
                <Link to="/patient-profile">
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4" />
                    <span className="hidden lg:inline ml-1">Profile</span>
                  </Button>
                </Link>
                <Link to="/patient-dashboard">
                  <Button variant="outline" size="sm">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden lg:inline ml-1">Dashboard</span>
                  </Button>
                </Link>
              </div>
              {/* Mobile hamburger */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden px-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/patient-profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/patient-dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="w-4 h-4" />Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                    onClick={async () => { try { await logout(); window.location.href = '/patient-login'; } catch(e) {} }}
                  >
                    <LogOut className="w-4 h-4" />Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-x-hidden">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by doctor name, token, or purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Total */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 p-3 sm:p-5 text-white shadow-lg">
            <div className="absolute -right-3 -bottom-3 opacity-10">
              <FileText className="h-16 w-16 sm:h-24 sm:w-24" />
            </div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-violet-100 mb-1">Total</p>
            <p className="text-2xl sm:text-4xl font-extrabold leading-none">{appointments.length}</p>
            <p className="hidden sm:block text-sm text-violet-200 mt-1">All appointments</p>
          </div>

          {/* Upcoming */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 p-3 sm:p-5 text-white shadow-lg">
            <div className="absolute -right-3 -bottom-3 opacity-10">
              <CalendarClock className="h-16 w-16 sm:h-24 sm:w-24" />
            </div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sky-100 mb-1">Upcoming</p>
            <p className="text-2xl sm:text-4xl font-extrabold leading-none">{upcomingAppointments.length}</p>
            <p className="hidden sm:block text-sm text-sky-200 mt-1">Scheduled visits</p>
          </div>

          {/* In Progress */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-3 sm:p-5 text-white shadow-lg">
            <div className="absolute -right-3 -bottom-3 opacity-10">
              <Loader2 className="h-16 w-16 sm:h-24 sm:w-24" />
            </div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-100 mb-1">In Progress</p>
            <p className="text-2xl sm:text-4xl font-extrabold leading-none">{inProgressAppointments.length}</p>
            <p className="hidden sm:block text-sm text-amber-100 mt-1">Currently active</p>
          </div>

          {/* Completed */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 p-3 sm:p-5 text-white shadow-lg">
            <div className="absolute -right-3 -bottom-3 opacity-10">
              <CheckCircle2 className="h-16 w-16 sm:h-24 sm:w-24" />
            </div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-100 mb-1">Completed</p>
            <p className="text-2xl sm:text-4xl font-extrabold leading-none">{completedAppointments.length}</p>
            <p className="hidden sm:block text-sm text-emerald-100 mt-1">Past visits</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Loading medical records...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-700 mb-1">Failed to load records</h3>
            <p className="text-red-500 text-sm">{error.message}</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="flex flex-wrap sm:flex-nowrap w-full h-auto">
              <TabsTrigger value="all" className="basis-1/2 sm:basis-auto flex-1 text-[11px] sm:text-sm py-1.5 sm:py-2">
                All ({appointments.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="basis-1/2 sm:basis-auto flex-1 text-[11px] sm:text-sm py-1.5 sm:py-2">
                Upcoming ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="inProgress" className="basis-1/2 sm:basis-auto flex-1 text-[11px] sm:text-sm py-1.5 sm:py-2">
                Active ({inProgressAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="basis-1/2 sm:basis-auto flex-1 text-[11px] sm:text-sm py-1.5 sm:py-2">
                Done ({completedAppointments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {renderAppointmentList(appointments, 'No appointments found')}
            </TabsContent>
            <TabsContent value="upcoming">
              {renderAppointmentList(upcomingAppointments, 'No upcoming appointments')}
            </TabsContent>
            <TabsContent value="inProgress">
              {renderAppointmentList(inProgressAppointments, 'No appointments in progress')}
            </TabsContent>
            <TabsContent value="completed">
              {renderAppointmentList(completedAppointments, 'No completed appointments')}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Examination Detail Modal */}
      <Dialog open={!!selectedExamination} onOpenChange={() => setSelectedExamination(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Examination Report
            </DialogTitle>
          </DialogHeader>

          {selectedExamination && (
            <div className="space-y-4">
              {/* Appointment Info Header */}
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Doctor</span>
                    <p className="font-medium">{selectedExamination.doctorName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Date</span>
                    <p className="font-medium">{format(new Date(selectedExamination.appointmentDate), 'PPP')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Token</span>
                    <p className="font-medium">{selectedExamination.tokenNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Time</span>
                    <p className="font-medium">{selectedExamination.appointmentTime || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Examination Tabs */}
              {(selectedExamination.visit?.optometristExamination ||
                selectedExamination.visit?.ophthalmologistExaminations?.length > 0) ? (
                <Tabs
                  defaultValue={
                    selectedExamination.visit?.optometristExamination
                      ? 'optometrist'
                      : 'ophthalmologist'
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="optometrist"
                      disabled={!selectedExamination.visit?.optometristExamination}
                      className="flex items-center gap-1.5"
                    >
                      <Eye className="h-4 w-4" />
                      Optometrist
                    </TabsTrigger>
                    <TabsTrigger
                      value="ophthalmologist"
                      disabled={!selectedExamination.visit?.ophthalmologistExaminations?.length}
                      className="flex items-center gap-1.5"
                    >
                      <Stethoscope className="h-4 w-4" />
                      Ophthalmologist
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="optometrist">
                    {selectedExamination.visit?.optometristExamination && (
                      <div className="border rounded-lg p-4 bg-green-50/30">
                        {renderOptometristExam(selectedExamination.visit.optometristExamination)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="ophthalmologist">
                    {selectedExamination.visit?.ophthalmologistExaminations?.length > 0 && (
                      <div className="border rounded-lg p-4 bg-blue-50/30">
                        {renderOphthalmologistExam(selectedExamination.visit.ophthalmologistExaminations)}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No examination data recorded for this visit.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicalRecords;
