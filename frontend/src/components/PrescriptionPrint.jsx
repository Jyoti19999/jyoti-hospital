import { useState } from 'react';
import { Button } from '@/components/ui/button';
import LetterheadSelector from './LetterheadSelector';
import { printWithLetterhead, generatePDFWithLetterhead } from '@/utils/letterheadRenderer';
import { Printer } from 'lucide-react';

export default function PrescriptionPrint({ prescription, patient, doctor, hospitalData }) {
  const [showLetterheadSelector, setShowLetterheadSelector] = useState(false);

  // Generate prescription HTML
  const generatePrescriptionHTML = () => {
    return `
      <div style="padding: 20px;">
        <h2 style="text-align: center; margin-bottom: 20px;">PRESCRIPTION</h2>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Prescription No:</strong> ${prescription.prescriptionNumber}</p>
          <p><strong>Date:</strong> ${new Date(prescription.prescriptionDate).toLocaleDateString()}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="border-bottom: 1px solid #333; padding-bottom: 5px;">Patient Information</h3>
          <p><strong>Name:</strong> ${patient.firstName} ${patient.lastName}</p>
          <p><strong>MRN:</strong> ${patient.mrn || 'N/A'}</p>
          <p><strong>Age:</strong> ${patient.dateOfBirth ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / 31557600000) : 'N/A'} years</p>
          <p><strong>Gender:</strong> ${patient.gender || 'N/A'}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="border-bottom: 1px solid #333; padding-bottom: 5px;">Prescribed Medications</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Medicine</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Dosage</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Frequency</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Duration</th>
              </tr>
            </thead>
            <tbody>
              ${prescription.prescriptionItems.map(item => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${item.medicineName}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${item.dosage}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${item.frequency}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${item.duration}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${prescription.generalInstructions ? `
          <div style="margin-bottom: 20px;">
            <h3 style="border-bottom: 1px solid #333; padding-bottom: 5px;">General Instructions</h3>
            <p>${prescription.generalInstructions}</p>
          </div>
        ` : ''}

        ${prescription.followUpInstructions ? `
          <div style="margin-bottom: 20px;">
            <h3 style="border-bottom: 1px solid #333; padding-bottom: 5px;">Follow-up Instructions</h3>
            <p>${prescription.followUpInstructions}</p>
          </div>
        ` : ''}

        <div style="margin-top: 40px; text-align: right;">
          <p><strong>Dr. ${doctor.firstName} ${doctor.lastName}</strong></p>
          <p>${doctor.doctorProfile?.specialization || 'Ophthalmologist'}</p>
          <p>Reg. No: ${doctor.doctorProfile?.registrationNumber || 'N/A'}</p>
        </div>
      </div>
    `;
  };

  const handlePrint = async (templateId) => {
    const prescriptionHTML = generatePrescriptionHTML();
    await printWithLetterhead(prescriptionHTML, templateId, hospitalData);
  };

  const handleDownloadPDF = async (templateId) => {
    const prescriptionHTML = generatePrescriptionHTML();
    await generatePDFWithLetterhead(
      prescriptionHTML, 
      templateId, 
      hospitalData, 
      `prescription-${prescription.prescriptionNumber}.pdf`
    );
  };

  return (
    <>
      <Button onClick={() => setShowLetterheadSelector(true)}>
        <Printer className="h-4 w-4 mr-2" />
        Print Prescription
      </Button>

      <LetterheadSelector
        open={showLetterheadSelector}
        onClose={() => setShowLetterheadSelector(false)}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
        documentType="prescription"
      />
    </>
  );
}
