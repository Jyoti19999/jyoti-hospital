import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar,
  Filter,
  FileSpreadsheet,
  FileCode,
  Search,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';

const API_URL = import.meta.env.VITE_API_URL;

const GenerateReports = () => {
  const [reportType, setReportType] = useState('optometrist-examinations');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const [claimStatusFilter, setClaimStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [activeExport, setActiveExport] = useState(null); // 'excel' | 'xml' | null
  const [doctors, setDoctors] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [recordCount, setRecordCount] = useState(0);

  const reportTypes = [
    { id: 'optometrist-examinations', label: 'Optometrist Completed Examinations', icon: FileText },
    { id: 'appointments', label: 'Appointments Data', icon: Calendar },
    { id: 'billing', label: 'Billing Export', icon: FileSpreadsheet },
    { id: 'doctor-examinations', label: 'Doctor Examinations', icon: FileText },
    { id: 'completed-surgeries', label: 'Completed Surgeries', icon: FileText },
    { id: 'scheduled-surgeries', label: 'Scheduled Surgeries', icon: Calendar },
    { id: 'anesthesia-cases', label: 'Anesthesia Cases', icon: FileText }
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/doctors-list`, {
        credentials: 'include'
      });
      const result = await response.json();
      if (result.success) {
        setDoctors(result.data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        ...(reportType === 'doctor-examinations' && { doctorId: selectedDoctor }),
        ...(reportType === 'billing' && paymentTypeFilter !== 'all' && { paymentType: paymentTypeFilter }),
        ...(reportType === 'billing' && paymentModeFilter !== 'all' && { paymentMode: paymentModeFilter }),
        ...(reportType === 'billing' && claimStatusFilter !== 'all' && { claimStatus: claimStatusFilter })
      });

      console.log('🔍 Fetching report:', reportType, 'with params:', params.toString());

      const response = await fetch(`${API_URL}/reports/${reportType}?${params}`, {
        credentials: 'include'
      });
      
      const result = await response.json();
      console.log('📊 Report result:', result);
      
      if (result.success) {
        setReportData(result.data);
        setRecordCount(result.count);
        console.log(`✅ Loaded ${result.count} records`);
        return result.data;
      } else {
        console.error('❌ Report fetch failed:', result.message);
        alert(result.message || 'Failed to fetch report data');
      }
      return [];
    } catch (error) {
      console.error('❌ Fetch report data error:', error);
      alert('Failed to fetch report data: ' + error.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setActiveExport('excel');
    const data = await fetchReportData();
    if (!data || data.length === 0) {
      alert('No data to export');
      setActiveExport(null);
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      // Determine column count based on report type
      let columnCount = 6;
      switch(reportType) {
        case 'surgery-payment': columnCount = 20; break;
        case 'consultation-payment': columnCount = 12; break;
        case 'billing': columnCount = 26; break;
        case 'appointments': columnCount = 9; break;
        case 'optometrist-examinations': columnCount = 6; break;
        case 'doctor-examinations': columnCount = 7; break;
        case 'completed-surgeries': columnCount = 45; break;
        case 'scheduled-surgeries': columnCount = 39; break;
        case 'anesthesia-cases': columnCount = 7; break;
        case 'claim-pending':
        case 'claim-completed': columnCount = 7; break;
      }

      // Helper function to convert column number to Excel column letter
      const getColumnLetter = (num) => {
        let letter = '';
        while (num > 0) {
          const remainder = (num - 1) % 26;
          letter = String.fromCharCode(65 + remainder) + letter;
          num = Math.floor((num - 1) / 26);
        }
        return letter;
      };

      // Add title
      const lastCol = getColumnLetter(columnCount);
      worksheet.mergeCells(`A1:${lastCol}1`);
      const titleCell = worksheet.getCell('A1');
      titleCell.value = reportTypes.find(r => r.id === reportType)?.label || 'Report';
      titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 30;

      // Add date range
      worksheet.mergeCells(`A2:${lastCol}2`);
      const dateCell = worksheet.getCell('A2');
      
      // Determine date display based on what's filled
      let dateDisplay = '';
      if (fromDate && toDate) {
        if (fromDate === toDate) {
          dateDisplay = `Date: ${format(new Date(fromDate), 'dd-MM-yyyy')}`;
        } else {
          dateDisplay = `Period: ${format(new Date(fromDate), 'dd-MM-yyyy')} - ${format(new Date(toDate), 'dd-MM-yyyy')}`;
        }
      } else if (fromDate) {
        dateDisplay = `From: ${format(new Date(fromDate), 'dd-MM-yyyy')} to Today`;
      } else if (toDate) {
        dateDisplay = `Up to: ${format(new Date(toDate), 'dd-MM-yyyy')}`;
      } else {
        dateDisplay = 'All Records';
      }
      
      dateCell.value = dateDisplay;
      dateCell.font = { italic: true };
      dateCell.alignment = { horizontal: 'center' };

      // Add headers and data based on report type
      addReportHeaders(worksheet, reportType);
      addReportData(worksheet, data, reportType);

      // Style the worksheet
      styleWorksheet(worksheet, reportType);

      // Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export Excel error:', error);
      alert('Failed to export Excel file');
    } finally {
      setActiveExport(null);
    }
  };

  const addReportHeaders = (worksheet, type) => {
    const headerRow = worksheet.getRow(4);
    headerRow.height = 25;

    switch (type) {
      case 'optometrist-examinations':
        headerRow.values = ['Sr. No.', 'Patient Name', 'Optometrist', 'Completed Date', 'Visual Acuity', 'Remarks'];
        break;
      case 'appointments':
        headerRow.values = ['Sr. No.', 'Patient Name', 'Phone', 'Date', 'Time', 'Type', 'Doctor', 'Status', 'Purpose'];
        break;
      case 'billing':
        headerRow.values = ['Sr. No.', 'Payment Number', 'Patient Name', 'Visit/Admission No', 'Payment Type', 'Total Billed', 'Total Paid', 'Remaining', 'Payment Mode', 'Cash Amount', 'Online Amount', 'Online Payment Details', 'Claim Applied', 'Claim Status', 'Claim Number', 'Claim Requested', 'Claim Sanctioned', 'Insurance Provider', 'Claim Submitted At', 'Claim Settled At', 'Claim Rejection Reason', 'Payment Date', 'Recorded By', 'Notes', 'Receipt Generated', 'Receipt Path'];
        break;
      case 'consultation-payment':
        headerRow.values = ['Sr. No.', 'Patient Name', 'Visit Number', 'Payment Type', 'Total Bill', 'Total Paid', 'Remaining', 'Payment Mode', 'Status', 'Payment Date', 'Receipt Generated', 'Receipt Path'];
        break;
      case 'surgery-payment':
        headerRow.values = ['Sr. No.', 'Patient Name', 'Visit Number', 'Payment Type', 'Total Bill', 'Total Paid', 'Remaining', 'Payment Method', 'Claim Applied', 'Claim Status', 'Claim Number', 'Claim Requested', 'Claim Sanctioned', 'Insurance Provider', 'Claim Submitted At', 'Claim Settled At', 'Rejection Reason', 'Payment Date', 'Receipt Generated', 'Receipt Path'];
        break;
      case 'doctor-examinations':
        headerRow.values = ['Sr. No.', 'Patient Name', 'Visit Number', 'Doctor', 'Completed Date', 'Diagnosis', 'Treatment'];
        break;
      case 'completed-surgeries':
        headerRow.values = ['Sr. No.', 'Patient Name', 'Admission No', 'Admitted By', 'Surgery Date', 'Surgery Time Slot', 'Surgery Type', 'Surgeon', 'Sister', 'Anesthesiologist', 'OT Room', 'Surgery Package', 'IOL Type', 'Lens Required', 'Lens', 'Anesthesia Required', 'Insurance Applicable', 'Insurance Provider', 'Estimated Insurance Cover', 'Claim Initiated', 'Claim Status', 'Claim Number', 'Claim Submitted At', 'Pre-Authorization Required', 'Pre-Authorization Amount', 'Pre-Authorization Approved', 'Claim Rejection Reason', 'Claim Amount Requested', 'Claim Amount Sanctioned', 'Claim Calculated Amount', 'Claim Submitted By', 'Claim Approved By', 'Claim Notes', 'Is Cashless', 'Is Reimbursement', 'Final Surgery Amount', 'Additional Charges For', 'Additional Charges Price', 'Discharged At', 'Discharged By', 'Fitness Assessment At', 'Fitness Assessment By', 'Fitness Cleared', 'Fitness Cleared By', 'Status'];
        break;
      case 'scheduled-surgeries':
        headerRow.values = ['Sr. No.', 'Patient Name', 'Admission No', 'Admitted By', 'Surgery Date', 'Surgery Time Slot', 'Surgery Type', 'Surgeon', 'Sister', 'Anesthesiologist', 'OT Room', 'Surgery Package', 'IOL Type', 'Lens Required', 'Lens', 'Anesthesia Required', 'Insurance Applicable', 'Insurance Provider', 'Estimated Insurance Cover', 'Claim Initiated', 'Claim Status', 'Claim Number', 'Claim Submitted At', 'Pre-Authorization Required', 'Pre-Authorization Amount', 'Pre-Authorization Approved', 'Claim Rejection Reason', 'Claim Amount Requested', 'Claim Amount Sanctioned', 'Claim Calculated Amount', 'Claim Submitted By', 'Claim Approved By', 'Claim Notes', 'Is Cashless', 'Is Reimbursement', 'Final Surgery Amount', 'Additional Charges For', 'Additional Charges Price', 'Status'];
        break;
      case 'anesthesia-cases':
        headerRow.values = ['Sr. No.', 'Patient Name', 'Surgery Type', 'Anesthesiologist', 'Date', 'OT Room', 'Status'];
        break;
      case 'claim-pending':
      case 'claim-completed':
        headerRow.values = ['Sr. No.', 'Patient Name', 'Amount', 'Claim Status', 'Insurance Provider', 'Date', 'Remarks'];
        break;
      default:
        headerRow.values = ['Sr. No.', 'Data'];
    }

    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  };

  const addReportData = (worksheet, data, type) => {
    let rowIndex = 5;

    data.forEach((item, index) => {
      const row = worksheet.getRow(rowIndex);
      const serialNo = index + 1;
      
      switch (type) {
        case 'optometrist-examinations':
          row.values = [
            serialNo,
            `${item.patientVisit?.patient?.firstName || ''} ${item.patientVisit?.patient?.lastName || ''}`,
            `${item.optometrist?.firstName || ''} ${item.optometrist?.lastName || ''}`,
            item.completedAt ? format(new Date(item.completedAt), 'dd-MM-yyyy') : '-',
            item.visualAcuity ? JSON.stringify(item.visualAcuity) : '-',
            item.additionalNotes || item.clinicalNotes || '-'
          ];
          break;
        case 'appointments':
          row.values = [
            serialNo,
            `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`,
            item.patient?.phone || '-',
            item.appointmentDate ? format(new Date(item.appointmentDate), 'dd-MM-yyyy') : '-',
            item.appointmentTime || '-',
            item.appointmentType || '-',
            `${item.doctor?.firstName || ''} ${item.doctor?.lastName || ''}`,
            item.status || '-',
            item.purpose || '-'
          ];
          break;
        case 'billing':
          row.values = [
            serialNo,
            item.paymentNumber || '-',
            `${item.ipdAdmission?.patient?.firstName || item.patientVisit?.patient?.firstName || ''} ${item.ipdAdmission?.patient?.lastName || item.patientVisit?.patient?.lastName || ''}`,
            item.ipdAdmission?.admissionNumber || item.patientVisit?.visitNumber || '-',
            item.paymentType || '-',
            item.totalBilledAmount || 0,
            item.totalPaidAmount || 0,
            item.remainingAmount || 0,
            item.paymentMode || '-',
            item.cashAmount || 0,
            item.onlineAmount || 0,
            item.onlinePaymentDetails ? JSON.stringify(item.onlinePaymentDetails) : '-',
            item.claimApplied ? 'Yes' : 'No',
            item.claimStatus || '-',
            item.claimNumber || '-',
            item.claimAmountRequested || 0,
            item.claimAmountSanctioned || 0,
            item.insuranceProvider?.providerName || '-',
            item.claimSubmittedAt ? format(new Date(item.claimSubmittedAt), 'dd-MM-yyyy') : '-',
            item.claimSettledAt ? format(new Date(item.claimSettledAt), 'dd-MM-yyyy') : '-',
            item.claimRejectionReason || '-',
            item.paymentDate ? format(new Date(item.paymentDate), 'dd-MM-yyyy') : '-',
            `${item.recordedBy?.firstName || ''} ${item.recordedBy?.lastName || ''}`,
            item.notes || '-',
            item.receiptGenerated ? 'Yes' : 'No',
            item.receiptPath || '-'
          ];
          break;
        case 'consultation-payment':
          row.values = [
            serialNo,
            `${item.patientVisit?.patient?.firstName || ''} ${item.patientVisit?.patient?.lastName || ''}`,
            item.patientVisit?.visitNumber || '-',
            item.paymentType || 'OPD',
            item.totalBilledAmount || 0,
            item.totalPaidAmount || 0,
            item.remainingAmount || 0,
            item.paymentMode || '-',
            (item.remainingAmount || 0) === 0 ? 'Completed' : 'Pending',
            item.paymentDate ? format(new Date(item.paymentDate), 'dd-MM-yyyy') : '-',
            item.receiptGenerated ? 'Yes' : 'No',
            item.receiptPath || '-'
          ];
          break;
        case 'surgery-payment':
          row.values = [
            serialNo,
            `${item.ipdAdmission?.patient?.firstName || item.patientVisit?.patient?.firstName || ''} ${item.ipdAdmission?.patient?.lastName || item.patientVisit?.patient?.lastName || ''}`,
            item.ipdAdmission?.admissionNumber || item.patientVisit?.visitNumber || '-',
            item.paymentType || 'IPD',
            item.totalBilledAmount || 0,
            item.totalPaidAmount || 0,
            item.remainingAmount || 0,
            item.paymentMode || '-',
            item.claimApplied ? 'Yes' : 'No',
            item.claimStatus || '-',
            item.claimNumber || '-',
            item.claimAmountRequested || 0,
            item.claimAmountSanctioned || 0,
            item.insuranceProvider?.providerName || item.insuranceProvider?.name || '-',
            item.claimSubmittedAt ? format(new Date(item.claimSubmittedAt), 'dd-MM-yyyy') : '-',
            item.claimSettledAt ? format(new Date(item.claimSettledAt), 'dd-MM-yyyy') : '-',
            item.claimRejectionReason || '-',
            item.paymentDate ? format(new Date(item.paymentDate), 'dd-MM-yyyy') : '-',
            item.receiptGenerated ? 'Yes' : 'No',
            item.receiptPath || '-'
          ];
          break;
        case 'doctor-examinations':
          row.values = [
            serialNo,
            `${item.patientVisit?.patient?.firstName || ''} ${item.patientVisit?.patient?.lastName || ''}`,
            item.patientVisit?.visitNumber || '-',
            `${item.doctor?.firstName || ''} ${item.doctor?.lastName || ''}`,
            item.completedAt ? format(new Date(item.completedAt), 'dd-MM-yyyy') : '-',
            item.preliminaryDiagnosis || item.clinicalImpressions || '-',
            item.treatmentPlan ? JSON.stringify(item.treatmentPlan) : (item.additionalNotes || '-')
          ];
          break;
        case 'completed-surgeries':
          // Parse additional charges
          let chargesNamesCompleted = '-';
          let chargesPricesCompleted = '-';
          if (item.appliedAdditionalCharges && Array.isArray(item.appliedAdditionalCharges) && item.appliedAdditionalCharges.length > 0) {
            chargesNamesCompleted = item.appliedAdditionalCharges.map(charge => charge.name).join(', ');
            chargesPricesCompleted = item.appliedAdditionalCharges.map(charge => charge.price).join(', ');
          }
          
          row.values = [
            serialNo,
            `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`,
            item.admissionNumber || '-',
            `${item.admittingStaff?.firstName || ''} ${item.admittingStaff?.lastName || ''}`,
            item.surgeryDate ? format(new Date(item.surgeryDate), 'dd-MM-yyyy') : '-',
            item.surgeryTimeSlot || '-',
            item.surgeryTypeDetail?.name || '-',
            `${item.surgeon?.firstName || ''} ${item.surgeon?.lastName || ''}`,
            `${item.sister?.firstName || ''} ${item.sister?.lastName || ''}`,
            `${item.anesthesiologist?.firstName || ''} ${item.anesthesiologist?.lastName || ''}`,
            item.otRoom?.roomName || '-',
            item.surgeryPackageDetail?.packageName || item.surgeryPackage || '-',
            item.iolType || '-',
            item.lensRequired ? 'Yes' : 'No',
            item.lens?.name || item.lensId || '-',
            item.requiresAnesthesia ? 'Yes' : 'No',
            item.insuranceApplicable ? 'Yes' : 'No',
            item.insuranceProvider?.providerName || '-',
            item.estimatedInsuranceCover || 0,
            item.claimInitiated ? 'Yes' : 'No',
            item.claimStatus || '-',
            item.claimNumber || '-',
            item.claimSubmittedAt ? format(new Date(item.claimSubmittedAt), 'dd-MM-yyyy') : '-',
            item.preAuthorizationRequired ? 'Yes' : 'No',
            item.preAuthorizationAmount || 0,
            item.preAuthorizationApproved ? 'Yes' : 'No',
            item.claimRejectionReason || '-',
            item.claimAmountRequested || 0,
            item.claimAmountSanctioned || 0,
            item.claimCalculatedAmount || 0,
            `${item.claimSubmitter?.firstName || ''} ${item.claimSubmitter?.lastName || ''}` || '-',
            `${item.claimApprover?.firstName || ''} ${item.claimApprover?.lastName || ''}` || '-',
            item.claimNotes || '-',
            item.isCashless ? 'Yes' : 'No',
            item.isReimbursement ? 'Yes' : 'No',
            item.finalSurgeryAmount || 0,
            chargesNamesCompleted,
            chargesPricesCompleted,
            item.dischargedAt ? format(new Date(item.dischargedAt), 'dd-MM-yyyy') : '-',
            item.dischargedByStaff || '-',
            item.fitnessAssessmentAt ? format(new Date(item.fitnessAssessmentAt), 'dd-MM-yyyy') : '-',
            item.fitnessAssessmentByStaff || '-',
            item.fitnessCleared ? 'Yes' : 'No',
            item.fitnessClearedByStaff || '-',
            'Completed'
          ];
          break;
        case 'scheduled-surgeries':
          // Parse additional charges
          let chargesNames = '-';
          let chargesPrices = '-';
          if (item.appliedAdditionalCharges && Array.isArray(item.appliedAdditionalCharges) && item.appliedAdditionalCharges.length > 0) {
            chargesNames = item.appliedAdditionalCharges.map(charge => charge.name).join(', ');
            chargesPrices = item.appliedAdditionalCharges.map(charge => charge.price).join(', ');
          }
          
          row.values = [
            serialNo,
            `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`,
            item.admissionNumber || '-',
            `${item.admittingStaff?.firstName || ''} ${item.admittingStaff?.lastName || ''}`,
            item.surgeryDate ? format(new Date(item.surgeryDate), 'dd-MM-yyyy') : '-',
            item.surgeryTimeSlot || '-',
            item.surgeryTypeDetail?.name || '-',
            `${item.surgeon?.firstName || ''} ${item.surgeon?.lastName || ''}`,
            `${item.sister?.firstName || ''} ${item.sister?.lastName || ''}`,
            `${item.anesthesiologist?.firstName || ''} ${item.anesthesiologist?.lastName || ''}`,
            item.otRoom?.roomName || '-',
            item.surgeryPackageDetail?.packageName || item.surgeryPackage || '-',
            item.iolType || '-',
            item.lensRequired ? 'Yes' : 'No',
            item.lens?.name || item.lensId || '-',
            item.requiresAnesthesia ? 'Yes' : 'No',
            item.insuranceApplicable ? 'Yes' : 'No',
            item.insuranceProvider?.providerName || '-',
            item.estimatedInsuranceCover || 0,
            item.claimInitiated ? 'Yes' : 'No',
            item.claimStatus || '-',
            item.claimNumber || '-',
            item.claimSubmittedAt ? format(new Date(item.claimSubmittedAt), 'dd-MM-yyyy') : '-',
            item.preAuthorizationRequired ? 'Yes' : 'No',
            item.preAuthorizationAmount || 0,
            item.preAuthorizationApproved ? 'Yes' : 'No',
            item.claimRejectionReason || '-',
            item.claimAmountRequested || 0,
            item.claimAmountSanctioned || 0,
            item.claimCalculatedAmount || 0,
            `${item.claimSubmitter?.firstName || ''} ${item.claimSubmitter?.lastName || ''}` || '-',
            `${item.claimApprover?.firstName || ''} ${item.claimApprover?.lastName || ''}` || '-',
            item.claimNotes || '-',
            item.isCashless ? 'Yes' : 'No',
            item.isReimbursement ? 'Yes' : 'No',
            item.finalSurgeryAmount || 0,
            chargesNames,
            chargesPrices,
            'Scheduled'
          ];
          break;
        case 'anesthesia-cases':
          row.values = [
            serialNo,
            `${item.patient?.firstName || ''} ${item.patient?.lastName || ''}`,
            item.surgeryTypeDetail?.name || '-',
            `${item.anesthesiologist?.firstName || ''} ${item.anesthesiologist?.lastName || ''}`,
            item.surgeryDate ? format(new Date(item.surgeryDate), 'dd-MM-yyyy') : '-',
            item.otRoom?.roomName || '-',
            item.surgeryCompleted ? 'Completed' : 'Scheduled'
          ];
          break;
        case 'claim-pending':
        case 'claim-completed':
          row.values = [
            serialNo,
            `${item.patientVisit?.patient?.firstName || ''} ${item.patientVisit?.patient?.lastName || ''}`,
            item.amount || 0,
            item.claimStatus || '-',
            item.insuranceProvider?.providerName || item.insuranceProvider?.name || '-',
            item.createdAt ? format(new Date(item.createdAt), 'dd-MM-yyyy') : '-',
            item.claimNumber || '-'
          ];
          break;
      }

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      rowIndex++;
    });
  };

  const styleWorksheet = (worksheet, reportType) => {
    worksheet.columns.forEach((column, index) => {
      column.width = 20;
      
      // Increase width for receipt path column (last column in payment reports)
      if (reportType === 'consultation-payment' && index === 11) {
        column.width = 40;
      } else if (reportType === 'surgery-payment' && index === 19) {
        column.width = 40;
      }
    });
  };

  const handleExportXML = async () => {
    setActiveExport('xml');
    const data = await fetchReportData();
    if (!data || data.length === 0) {
      alert('No data to export');
      setActiveExport(null);
      return;
    }

    try {
      const xml = convertToXML(data, reportType);
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.xml`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export XML error:', error);
      alert('Failed to export XML file');
    } finally {
      setActiveExport(null);
    }
  };

  const convertToXML = (data, type) => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<report type="${type}" generated="${new Date().toISOString()}">\n`;
    xml += `  <metadata>\n`;
    if (fromDate) xml += `    <fromDate>${fromDate}</fromDate>\n`;
    if (toDate) xml += `    <toDate>${toDate}</toDate>\n`;
    xml += `    <recordCount>${data.length}</recordCount>\n`;
    xml += `  </metadata>\n`;
    xml += `  <records>\n`;

    data.forEach((item, index) => {
      xml += `    <record id="${index + 1}">\n`;
      
      // Format data based on report type - matching Excel structure
      switch (type) {
        case 'optometrist-examinations':
          xml += `      <patientName>${item.patientVisit?.patient?.firstName || ''} ${item.patientVisit?.patient?.lastName || ''}</patientName>\n`;
          xml += `      <optometrist>${item.optometrist?.firstName || ''} ${item.optometrist?.lastName || ''}</optometrist>\n`;
          xml += `      <completedDate>${item.completedAt ? format(new Date(item.completedAt), 'dd-MM-yyyy') : '-'}</completedDate>\n`;
          xml += `      <visualAcuity>${item.visualAcuity ? JSON.stringify(item.visualAcuity) : '-'}</visualAcuity>\n`;
          xml += `      <remarks>${item.additionalNotes || item.clinicalNotes || '-'}</remarks>\n`;
          break;
          
        case 'appointments':
          xml += `      <patientName>${item.patient?.firstName || ''} ${item.patient?.lastName || ''}</patientName>\n`;
          xml += `      <phone>${item.patient?.phone || '-'}</phone>\n`;
          xml += `      <date>${item.appointmentDate ? format(new Date(item.appointmentDate), 'dd-MM-yyyy') : '-'}</date>\n`;
          xml += `      <time>${item.appointmentTime || '-'}</time>\n`;
          xml += `      <type>${item.appointmentType || '-'}</type>\n`;
          xml += `      <doctor>${item.doctor?.firstName || ''} ${item.doctor?.lastName || ''}</doctor>\n`;
          xml += `      <status>${item.status || '-'}</status>\n`;
          xml += `      <purpose>${item.purpose || '-'}</purpose>\n`;
          break;
          
        case 'billing':
          xml += `      <paymentNumber>${item.paymentNumber || '-'}</paymentNumber>\n`;
          xml += `      <patientName>${item.ipdAdmission?.patient?.firstName || item.patientVisit?.patient?.firstName || ''} ${item.ipdAdmission?.patient?.lastName || item.patientVisit?.patient?.lastName || ''}</patientName>\n`;
          xml += `      <visitAdmissionNo>${item.ipdAdmission?.admissionNumber || item.patientVisit?.visitNumber || '-'}</visitAdmissionNo>\n`;
          xml += `      <paymentType>${item.paymentType || '-'}</paymentType>\n`;
          xml += `      <totalBilled>${item.totalBilledAmount || 0}</totalBilled>\n`;
          xml += `      <totalPaid>${item.totalPaidAmount || 0}</totalPaid>\n`;
          xml += `      <remaining>${item.remainingAmount || 0}</remaining>\n`;
          xml += `      <paymentMode>${item.paymentMode || '-'}</paymentMode>\n`;
          xml += `      <cashAmount>${item.cashAmount || 0}</cashAmount>\n`;
          xml += `      <onlineAmount>${item.onlineAmount || 0}</onlineAmount>\n`;
          xml += `      <onlinePaymentDetails>${item.onlinePaymentDetails ? JSON.stringify(item.onlinePaymentDetails) : '-'}</onlinePaymentDetails>\n`;
          xml += `      <claimApplied>${item.claimApplied ? 'Yes' : 'No'}</claimApplied>\n`;
          xml += `      <claimStatus>${item.claimStatus || '-'}</claimStatus>\n`;
          xml += `      <claimNumber>${item.claimNumber || '-'}</claimNumber>\n`;
          xml += `      <claimRequested>${item.claimAmountRequested || 0}</claimRequested>\n`;
          xml += `      <claimSanctioned>${item.claimAmountSanctioned || 0}</claimSanctioned>\n`;
          xml += `      <insuranceProvider>${item.insuranceProvider?.providerName || '-'}</insuranceProvider>\n`;
          xml += `      <claimSubmittedAt>${item.claimSubmittedAt ? format(new Date(item.claimSubmittedAt), 'dd-MM-yyyy') : '-'}</claimSubmittedAt>\n`;
          xml += `      <claimSettledAt>${item.claimSettledAt ? format(new Date(item.claimSettledAt), 'dd-MM-yyyy') : '-'}</claimSettledAt>\n`;
          xml += `      <claimRejectionReason>${item.claimRejectionReason || '-'}</claimRejectionReason>\n`;
          xml += `      <paymentDate>${item.paymentDate ? format(new Date(item.paymentDate), 'dd-MM-yyyy') : '-'}</paymentDate>\n`;
          xml += `      <recordedBy>${item.recordedBy?.firstName || ''} ${item.recordedBy?.lastName || ''}</recordedBy>\n`;
          xml += `      <notes>${item.notes || '-'}</notes>\n`;
          xml += `      <receiptGenerated>${item.receiptGenerated ? 'Yes' : 'No'}</receiptGenerated>\n`;
          xml += `      <receiptPath>${item.receiptPath || '-'}</receiptPath>\n`;
          break;
          
        case 'doctor-examinations':
          xml += `      <patientName>${item.patientVisit?.patient?.firstName || ''} ${item.patientVisit?.patient?.lastName || ''}</patientName>\n`;
          xml += `      <visitNumber>${item.patientVisit?.visitNumber || '-'}</visitNumber>\n`;
          xml += `      <doctor>${item.doctor?.firstName || ''} ${item.doctor?.lastName || ''}</doctor>\n`;
          xml += `      <completedDate>${item.completedAt ? format(new Date(item.completedAt), 'dd-MM-yyyy') : '-'}</completedDate>\n`;
          xml += `      <diagnosis>${item.preliminaryDiagnosis || item.clinicalImpressions || '-'}</diagnosis>\n`;
          xml += `      <treatment>${item.treatmentPlan ? JSON.stringify(item.treatmentPlan) : (item.additionalNotes || '-')}</treatment>\n`;
          break;
          
        case 'completed-surgeries':
        case 'scheduled-surgeries':
          const chargesNames = item.appliedAdditionalCharges && Array.isArray(item.appliedAdditionalCharges) && item.appliedAdditionalCharges.length > 0
            ? item.appliedAdditionalCharges.map(charge => charge.name).join(', ')
            : '-';
          const chargesPrices = item.appliedAdditionalCharges && Array.isArray(item.appliedAdditionalCharges) && item.appliedAdditionalCharges.length > 0
            ? item.appliedAdditionalCharges.map(charge => charge.price).join(', ')
            : '-';
            
          xml += `      <patientName>${item.patient?.firstName || ''} ${item.patient?.lastName || ''}</patientName>\n`;
          xml += `      <admissionNo>${item.admissionNumber || '-'}</admissionNo>\n`;
          xml += `      <admittedBy>${item.admittingStaff?.firstName || ''} ${item.admittingStaff?.lastName || ''}</admittedBy>\n`;
          xml += `      <surgeryDate>${item.surgeryDate ? format(new Date(item.surgeryDate), 'dd-MM-yyyy') : '-'}</surgeryDate>\n`;
          xml += `      <surgeryTimeSlot>${item.surgeryTimeSlot || '-'}</surgeryTimeSlot>\n`;
          xml += `      <surgeryType>${item.surgeryTypeDetail?.name || '-'}</surgeryType>\n`;
          xml += `      <surgeon>${item.surgeon?.firstName || ''} ${item.surgeon?.lastName || ''}</surgeon>\n`;
          xml += `      <sister>${item.sister?.firstName || ''} ${item.sister?.lastName || ''}</sister>\n`;
          xml += `      <anesthesiologist>${item.anesthesiologist?.firstName || ''} ${item.anesthesiologist?.lastName || ''}</anesthesiologist>\n`;
          xml += `      <otRoom>${item.otRoom?.roomName || '-'}</otRoom>\n`;
          xml += `      <surgeryPackage>${item.surgeryPackageDetail?.packageName || item.surgeryPackage || '-'}</surgeryPackage>\n`;
          xml += `      <iolType>${item.iolType || '-'}</iolType>\n`;
          xml += `      <lensRequired>${item.lensRequired ? 'Yes' : 'No'}</lensRequired>\n`;
          xml += `      <lens>${item.lens?.name || item.lensId || '-'}</lens>\n`;
          xml += `      <anesthesiaRequired>${item.requiresAnesthesia ? 'Yes' : 'No'}</anesthesiaRequired>\n`;
          xml += `      <insuranceApplicable>${item.insuranceApplicable ? 'Yes' : 'No'}</insuranceApplicable>\n`;
          xml += `      <insuranceProvider>${item.insuranceProvider?.providerName || '-'}</insuranceProvider>\n`;
          xml += `      <estimatedInsuranceCover>${item.estimatedInsuranceCover || 0}</estimatedInsuranceCover>\n`;
          xml += `      <claimInitiated>${item.claimInitiated ? 'Yes' : 'No'}</claimInitiated>\n`;
          xml += `      <claimStatus>${item.claimStatus || '-'}</claimStatus>\n`;
          xml += `      <claimNumber>${item.claimNumber || '-'}</claimNumber>\n`;
          xml += `      <claimSubmittedAt>${item.claimSubmittedAt ? format(new Date(item.claimSubmittedAt), 'dd-MM-yyyy') : '-'}</claimSubmittedAt>\n`;
          xml += `      <preAuthorizationRequired>${item.preAuthorizationRequired ? 'Yes' : 'No'}</preAuthorizationRequired>\n`;
          xml += `      <preAuthorizationAmount>${item.preAuthorizationAmount || 0}</preAuthorizationAmount>\n`;
          xml += `      <preAuthorizationApproved>${item.preAuthorizationApproved ? 'Yes' : 'No'}</preAuthorizationApproved>\n`;
          xml += `      <claimRejectionReason>${item.claimRejectionReason || '-'}</claimRejectionReason>\n`;
          xml += `      <claimAmountRequested>${item.claimAmountRequested || 0}</claimAmountRequested>\n`;
          xml += `      <claimAmountSanctioned>${item.claimAmountSanctioned || 0}</claimAmountSanctioned>\n`;
          xml += `      <claimCalculatedAmount>${item.claimCalculatedAmount || 0}</claimCalculatedAmount>\n`;
          xml += `      <claimSubmittedBy>${item.claimSubmitter?.firstName || ''} ${item.claimSubmitter?.lastName || ''}</claimSubmittedBy>\n`;
          xml += `      <claimApprovedBy>${item.claimApprover?.firstName || ''} ${item.claimApprover?.lastName || ''}</claimApprovedBy>\n`;
          xml += `      <claimNotes>${item.claimNotes || '-'}</claimNotes>\n`;
          xml += `      <isCashless>${item.isCashless ? 'Yes' : 'No'}</isCashless>\n`;
          xml += `      <isReimbursement>${item.isReimbursement ? 'Yes' : 'No'}</isReimbursement>\n`;
          xml += `      <finalSurgeryAmount>${item.finalSurgeryAmount || 0}</finalSurgeryAmount>\n`;
          xml += `      <additionalChargesFor>${chargesNames}</additionalChargesFor>\n`;
          xml += `      <additionalChargesPrice>${chargesPrices}</additionalChargesPrice>\n`;
          
          if (type === 'completed-surgeries') {
            xml += `      <dischargedAt>${item.dischargedAt ? format(new Date(item.dischargedAt), 'dd-MM-yyyy') : '-'}</dischargedAt>\n`;
            xml += `      <dischargedBy>${item.dischargedByStaff || '-'}</dischargedBy>\n`;
            xml += `      <fitnessAssessmentAt>${item.fitnessAssessmentAt ? format(new Date(item.fitnessAssessmentAt), 'dd-MM-yyyy') : '-'}</fitnessAssessmentAt>\n`;
            xml += `      <fitnessAssessmentBy>${item.fitnessAssessmentByStaff || '-'}</fitnessAssessmentBy>\n`;
            xml += `      <fitnessCleared>${item.fitnessCleared ? 'Yes' : 'No'}</fitnessCleared>\n`;
            xml += `      <fitnessClearedBy>${item.fitnessClearedByStaff || '-'}</fitnessClearedBy>\n`;
            xml += `      <status>Completed</status>\n`;
          } else {
            xml += `      <status>Scheduled</status>\n`;
          }
          break;
          
        case 'anesthesia-cases':
          xml += `      <patientName>${item.patient?.firstName || ''} ${item.patient?.lastName || ''}</patientName>\n`;
          xml += `      <surgeryType>${item.surgeryTypeDetail?.name || '-'}</surgeryType>\n`;
          xml += `      <anesthesiologist>${item.anesthesiologist?.firstName || ''} ${item.anesthesiologist?.lastName || ''}</anesthesiologist>\n`;
          xml += `      <date>${item.surgeryDate ? format(new Date(item.surgeryDate), 'dd-MM-yyyy') : '-'}</date>\n`;
          xml += `      <otRoom>${item.otRoom?.roomName || '-'}</otRoom>\n`;
          xml += `      <status>${item.surgeryCompleted ? 'Completed' : 'Scheduled'}</status>\n`;
          break;
          
        case 'claim-pending':
        case 'claim-completed':
          xml += `      <patientName>${item.patientVisit?.patient?.firstName || ''} ${item.patientVisit?.patient?.lastName || ''}</patientName>\n`;
          xml += `      <amount>${item.amount || 0}</amount>\n`;
          xml += `      <claimStatus>${item.claimStatus || '-'}</claimStatus>\n`;
          xml += `      <insuranceProvider>${item.insuranceProvider?.providerName || item.insuranceProvider?.name || '-'}</insuranceProvider>\n`;
          xml += `      <date>${item.createdAt ? format(new Date(item.createdAt), 'dd-MM-yyyy') : '-'}</date>\n`;
          xml += `      <remarks>${item.claimNumber || '-'}</remarks>\n`;
          break;
      }
      
      xml += `    </record>\n`;
    });

    xml += `  </records>\n`;
    xml += `</report>`;
    return xml;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-sm border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center justify-between text-gray-900">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Report Filters
              </div>

              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                {recordCount} Records
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Report Type</Label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {reportTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">From Date (Optional)</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border-gray-300"
                  placeholder="Leave empty for all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">To Date (Optional)</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border-gray-300"
                  placeholder="Leave empty for today"
                />
              </div>

              {reportType === 'doctor-examinations' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Select Doctor</Label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Doctors</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.firstName} {doctor.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {reportType === 'billing' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Payment Type</Label>
                    <select
                      value={paymentTypeFilter}
                      onChange={(e) => setPaymentTypeFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All</option>
                      <option value="OPD">OPD (Consultation)</option>
                      <option value="IPD">IPD (Surgery)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Payment Mode</Label>
                    <select
                      value={paymentModeFilter}
                      onChange={(e) => setPaymentModeFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All</option>
                      <option value="FULL_CASH">Full Cash</option>
                      <option value="FULL_ONLINE">Full Online</option>
                      <option value="HYBRID">Hybrid (Cash + Online)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Claim Status</Label>
                    <select
                      value={claimStatusFilter}
                      onChange={(e) => setClaimStatusFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All</option>
                      <option value="NOT_APPLIED">Not Applied</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="SETTLED">Settled</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Download className="h-5 w-5 text-blue-600" />
              Export Options
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                onClick={handleExportExcel}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                {loading && activeExport === 'excel'
                  ? <RefreshCw className="h-4 w-4 animate-spin" />
                  : <FileSpreadsheet className="h-4 w-4" />}
                Export to Excel
              </Button>
              <Button
                onClick={handleExportXML}
                disabled={loading}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 flex items-center gap-2"
              >
                {loading && activeExport === 'xml'
                  ? <RefreshCw className="h-4 w-4 animate-spin" />
                  : <FileCode className="h-4 w-4" />}
                Export to XML
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <FileText className="h-5 w-5 text-blue-600" />
              Report Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500 py-8">
              <p>Select filters and click export to generate your report</p>
              <p className="text-sm mt-2">Report will include all relevant data based on your selections</p>
              {recordCount > 0 && (
                <Badge className="mt-4 bg-blue-100 text-blue-700">
                  Ready to export {recordCount} records
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenerateReports;
