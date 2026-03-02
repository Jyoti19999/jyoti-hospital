// src\pages\PrescriptionHistory.jsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { patientService } from '@/services/patientService';
import { Link } from 'react-router-dom';
import {
  Pill,
  Search,
  Calendar,
  LayoutDashboard,
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  Stethoscope,
  Clock,
  Hash,
  FileText,
  PackageOpen,
  Menu,
  LogOut,
  User
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

const PrescriptionHistory = () => {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patient', 'prescriptions', user?.id],
    queryFn: patientService.getPrescriptions,
    enabled: !!user && user.role === 'patient' && !authLoading,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000
  });

  const prescriptions = useMemo(() => data?.data || [], [data]);

  const filtered = useMemo(() => {
    return prescriptions.filter(p => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        p.doctorName?.toLowerCase().includes(term) ||
        p.prescriptionNumber?.toLowerCase().includes(term) ||
        p.chiefComplaint?.toLowerCase().includes(term) ||
        p.items?.some(item => item.medicineName?.toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [prescriptions, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = prescriptions.length;
    const active = prescriptions.filter(p => p.status === 'active').length;
    const totalMeds = prescriptions.reduce((acc, p) => acc + (p.items?.length || 0), 0);
    const latest = prescriptions[0]?.prescriptionDate
      ? format(new Date(prescriptions[0].prescriptionDate), 'dd MMM yyyy')
      : '—';
    return { total, active, totalMeds, latest };
  }, [prescriptions]);

  const groupedVisits = useMemo(() => {
    const groups = {};
    filtered.forEach(p => {
      const key = p.visitNumber
        ? `v-${p.visitNumber}`
        : `d-${p.visitDate || p.prescriptionDate || 'unknown'}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          visitNumber: p.visitNumber,
          visitDate: p.visitDate || p.prescriptionDate,
          doctorName: p.doctorName,
          chiefComplaint: p.chiefComplaint,
          tokenNumber: p.tokenNumber,
          prescriptions: [],
        };
      }
      groups[key].prescriptions.push(p);
    });
    return Object.values(groups).sort((a, b) => {
      const da = a.visitDate ? new Date(a.visitDate) : new Date(0);
      const db = b.visitDate ? new Date(b.visitDate) : new Date(0);
      return db - da;
    });
  }, [filtered]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'discontinued': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-x-hidden">
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 overflow-hidden">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Pill className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold text-slate-800 leading-tight">
                  <span className="hidden sm:inline">Prescription History</span>
                  <span className="sm:hidden">Prescriptions</span>
                </h1>
                <p className="hidden sm:block text-sm text-slate-600">Medications prescribed during your visits</p>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-2">
              <Link to="/patient-profile">
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Link to="/patient-dashboard">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={async () => { try { await logout(); window.location.href = '/patient-login'; } catch {} }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
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
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/patient-dashboard" className="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                  onClick={async () => { try { await logout(); window.location.href = '/patient-login'; } catch {} }}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 overflow-x-hidden">

        {/* Gradient Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 p-3 sm:p-5 text-white shadow-lg">
            <div className="absolute -right-3 -bottom-3 opacity-10">
              <ClipboardList className="h-16 w-16 sm:h-24 sm:w-24" />
            </div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-violet-100 mb-1">Total</p>
            <p className="text-2xl sm:text-4xl font-extrabold leading-none">{isLoading ? '…' : stats.total}</p>
            <p className="text-xs text-violet-200 mt-1 hidden sm:block">All time</p>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 p-3 sm:p-5 text-white shadow-lg">
            <div className="absolute -right-3 -bottom-3 opacity-10">
              <CheckCircle2 className="h-16 w-16 sm:h-24 sm:w-24" />
            </div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-100 mb-1">Active</p>
            <p className="text-2xl sm:text-4xl font-extrabold leading-none">{isLoading ? '…' : stats.active}</p>
            <p className="text-xs text-emerald-100 mt-1 hidden sm:block">Current</p>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 p-3 sm:p-5 text-white shadow-lg">
            <div className="absolute -right-3 -bottom-3 opacity-10">
              <Pill className="h-16 w-16 sm:h-24 sm:w-24" />
            </div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sky-100 mb-1">Medicines</p>
            <p className="text-2xl sm:text-4xl font-extrabold leading-none">{isLoading ? '…' : stats.totalMeds}</p>
            <p className="text-xs text-sky-200 mt-1 hidden sm:block">Across all visits</p>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-3 sm:p-5 text-white shadow-lg">
            <div className="absolute -right-3 -bottom-3 opacity-10">
              <Calendar className="h-16 w-16 sm:h-24 sm:w-24" />
            </div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-100 mb-1">Latest</p>
            <p className="text-base sm:text-2xl font-extrabold leading-none">{isLoading ? '…' : stats.latest}</p>
            <p className="text-xs text-amber-100 mt-1 hidden sm:block">Most recent</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by medicine, doctor, or complaint…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prescriptions</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-200" />
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="pl-6 border-l-2 border-gray-100 ml-4 space-y-2">
                  {[1, 2].map(j => (
                    <div key={j} className="p-4 bg-white rounded-2xl shadow-md">
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                          <div className="h-3 bg-gray-200 rounded w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 bg-white rounded-2xl shadow-md text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Failed to load prescriptions</h3>
            <p className="text-gray-500 mb-4 text-sm">{error.message}</p>
            <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : groupedVisits.length === 0 ? (
          prescriptions.length === 0 ? (
            <div className="py-14 bg-white rounded-2xl shadow-md text-center px-6">
              <div className="flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-2xl mx-auto mb-4">
                <Pill className="h-8 w-8 text-indigo-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">No prescriptions prescribed as of now</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Once your doctor prescribes medicines during a visit, they will show up here grouped by visit date.
              </p>
            </div>
          ) : (
            <div className="py-12 bg-white rounded-2xl shadow-md text-center px-6">
              <div className="flex items-center justify-center w-14 h-14 bg-slate-50 rounded-2xl mx-auto mb-4">
                <Search className="h-7 w-7 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">No matching prescriptions</h3>
              <p className="text-sm text-slate-500 mb-4">Try a different medicine name, doctor name, or remove the status filter.</p>
              <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                Clear filters
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-8">
            <p className="text-sm text-slate-500 font-medium">
              {groupedVisits.length} visit{groupedVisits.length !== 1 ? 's' : ''} &mdash; {filtered.length} prescription{filtered.length !== 1 ? 's' : ''}
            </p>
            {groupedVisits.map((group, groupIdx) => {
              const groupDate = group.visitDate
                ? format(new Date(group.visitDate), 'dd MMM yyyy')
                : '—';
              const allMeds = group.prescriptions.flatMap(p => p.items || []);
              return (
                <div key={group.key} className="bg-white rounded-2xl shadow-md overflow-hidden">
                  {/* Visit Header bar */}
                  <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-3 sm:px-5 py-3 flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 flex-1 min-w-0">
                      {group.visitNumber && (
                        <span className="font-bold text-white text-sm sm:text-base">Visit #{group.visitNumber}</span>
                      )}
                      <span className="text-indigo-100 text-xs sm:text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {groupDate}
                      </span>
                      {group.doctorName && (
                        <span className="text-indigo-100 text-xs sm:text-sm flex items-center gap-1">
                          <Stethoscope className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="truncate max-w-[120px] sm:max-w-none">{group.doctorName}</span>
                        </span>
                      )}
                      {group.tokenNumber && (
                        <span className="text-indigo-200 text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Token {group.tokenNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge className="bg-white/20 text-white border-0 text-xs px-1.5">
                        {group.prescriptions.length} Rx
                      </Badge>
                      <Badge className="bg-white/20 text-white border-0 text-xs px-1.5 hidden sm:inline-flex">
                        {allMeds.length} med{allMeds.length !== 1 ? 's' : ''}
                      </Badge>
                      {groupIdx === 0 && (
                        <Badge className="bg-emerald-400 text-white border-0 text-xs px-1.5">Latest</Badge>
                      )}
                    </div>
                  </div>

                  {/* Visit body */}
                  <div className="px-3 sm:px-5 py-4 space-y-4">
                    {group.chiefComplaint && (
                      <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                        <span className="font-semibold">Chief complaint:</span> {group.chiefComplaint}
                      </p>
                    )}

                    {group.prescriptions.map((prescription, rxIdx) => (
                      <div key={prescription.id}>
                        {/* Rx label — only shown when multiple Rx in the visit */}
                        {group.prescriptions.length > 1 && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                              Rx #{prescription.prescriptionNumber}
                            </span>
                            <Badge className={`${getStatusStyle(prescription.status)} text-xs px-1.5 py-0 border-0`}>
                              {prescription.status || 'active'}
                            </Badge>
                            {rxIdx < group.prescriptions.length - 1 && (
                              <div className="h-px flex-1 bg-slate-100" />
                            )}
                          </div>
                        )}

                        {/* Medicine rows */}
                        {prescription.items && prescription.items.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {prescription.items.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 transition-colors"
                              >
                                <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-[11px] font-bold text-indigo-700">{idx + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                                    <span className="font-semibold text-sm text-slate-800 break-words min-w-0">{item.medicineName}</span>
                                    {item.genericName && (
                                      <span className="text-xs text-slate-400 break-words">({item.genericName})</span>
                                    )}
                                    {item.medicineType && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-slate-500 shrink-0">
                                        {item.medicineType}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-xs text-slate-500">
                                    {item.dosage && <span className="flex items-center gap-1 break-all"><Pill className="h-3 w-3 text-violet-400 shrink-0" />{item.dosage}</span>}
                                    {item.frequency && <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-sky-400 shrink-0" />{item.frequency}</span>}
                                    {item.duration && <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-emerald-400 shrink-0" />{item.duration}</span>}
                                    {item.quantity && <span className="flex items-center gap-1"><Hash className="h-3 w-3 text-orange-400 shrink-0" />Qty: {item.quantity}</span>}
                                  </div>
                                  {item.instructions && (
                                    <p className="mt-1 text-xs text-blue-600 bg-blue-50 rounded px-2 py-0.5 break-words">{item.instructions}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No medicines recorded for this prescription.</p>
                        )}

                        {prescription.validTill && (
                          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Valid till: {format(new Date(prescription.validTill), 'dd MMM yyyy')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionHistory;