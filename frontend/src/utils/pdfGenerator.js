// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateAppointmentPDF = async (appointmentData, qrCodeDataURL) => {
  try {
    // A4 portrait dimensions
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
    
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    
    // Premium blue color palette
    const colors = {
      primaryBlue: [37, 99, 235],
      lightBlue: [59, 130, 246],
      veryLightBlue: [219, 234, 254],
      darkBlue: [30, 58, 138],
      white: [255, 255, 255],
      lightGray: [248, 250, 252],
      mediumGray: [148, 163, 184],
      darkGray: [51, 65, 85],
      success: [34, 197, 94]
    };

    // Helper function for rounded rectangles
    const drawRoundedRect = (x, y, w, h, r, style = 'S') => {
      pdf.roundedRect(x, y, w, h, r, r, style);
    };

    let yPosition = 20;
    
    // ========== COMPACT HEADER ==========
    pdf.setFillColor(...colors.primaryBlue);
    drawRoundedRect(margin, yPosition, contentWidth, 35, 4, 'F');
    
    // Success checkmark
    pdf.setFillColor(...colors.success);
    pdf.circle(pageWidth/2 - 40, yPosition + 10, 4, 'F');
    pdf.setTextColor(...colors.white);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('✓', pageWidth/2 - 40, yPosition + 11.2, { align: 'center' });
    
    // Header text - compact
    pdf.setTextColor(...colors.white);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('APPOINTMENT CONFIRMED', pageWidth/2, yPosition + 10, { align: 'center' });
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OHMS Eye Care', pageWidth/2, yPosition + 22, { align: 'center' });
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Excellence in Vision Care', pageWidth/2, yPosition + 29, { align: 'center' });
    
    yPosition += 45;
    
    // ========== TOKEN SECTION ==========
    pdf.setFillColor(...colors.lightBlue);
    drawRoundedRect(margin, yPosition, contentWidth, 40, 4, 'F');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.white);
    pdf.text('YOUR TOKEN NUMBER', pageWidth/2, yPosition + 9, { align: 'center' });
    
    // Token number box
    pdf.setFillColor(255, 255, 255, 0.25);
    drawRoundedRect(margin + 50, yPosition + 14, contentWidth - 100, 17, 3, 'F');
    
    pdf.setFontSize(34);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.white);
    pdf.text(appointmentData.token || 'XXXX', pageWidth/2, yPosition + 26, { align: 'center' });
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Present at reception', pageWidth/2, yPosition + 35, { align: 'center' });
    
    yPosition += 50;
    
    // ========== SIDE BY SIDE: APPOINTMENT DETAILS + QR CODE ==========
    const sectionHeight = 95;
    
    // Left side - Appointment Details (60% width)
    const detailsWidth = contentWidth * 0.58;
    const detailsX = margin;
    
    pdf.setFillColor(...colors.white);
    drawRoundedRect(detailsX, yPosition, detailsWidth, sectionHeight, 4, 'F');
    
    pdf.setDrawColor(...colors.veryLightBlue);
    pdf.setLineWidth(1);
    drawRoundedRect(detailsX, yPosition, detailsWidth, sectionHeight, 4, 'S');
    
    // Section header
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.darkBlue);
    pdf.text('Appointment Details', detailsX + detailsWidth/2, yPosition + 9, { align: 'center' });
    
    // Divider
    pdf.setDrawColor(...colors.lightBlue);
    pdf.setLineWidth(0.5);
    pdf.line(detailsX + 10, yPosition + 13, detailsX + detailsWidth - 10, yPosition + 13);
    
    let detailY = yPosition + 20;
    const detailLeftCol = detailsX + 8;
    const lineSpacing = 13.5;
    
    // Helper function for compact details
    const drawCompactDetail = (label, value, x, y) => {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.mediumGray);
      pdf.text(label, x, y);
      
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.darkGray);
      
      // Truncate long text if needed
      const maxWidth = detailsWidth - 16;
      const truncatedValue = pdf.splitTextToSize(value, maxWidth)[0];
      pdf.text(truncatedValue, x, y + 4.5);
    };
    
    // All details in left column only
    drawCompactDetail('PATIENT', appointmentData.patientName || 'N/A', detailLeftCol, detailY);
    detailY += lineSpacing;
    
    drawCompactDetail('PHONE', appointmentData.patientPhone || 'N/A', detailLeftCol, detailY);
    detailY += lineSpacing;
    
    drawCompactDetail('DOCTOR', appointmentData.doctorName || 'N/A', detailLeftCol, detailY);
    detailY += lineSpacing;
    
    drawCompactDetail('DEPARTMENT', appointmentData.department || 'N/A', detailLeftCol, detailY);
    detailY += lineSpacing;
    
    const formattedDate = new Date(appointmentData.date).toLocaleDateString('en-GB', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    drawCompactDetail('DATE', formattedDate, detailLeftCol, detailY);
    detailY += lineSpacing;
    
    drawCompactDetail('TIME', appointmentData.time || 'N/A', detailLeftCol, detailY);
    
    // Right side - QR Code (40% width)
    const qrSectionWidth = contentWidth * 0.38;
    const qrSectionX = detailsX + detailsWidth + 8;
    
    if (qrCodeDataURL) {
      pdf.setFillColor(...colors.lightGray);
      drawRoundedRect(qrSectionX, yPosition, qrSectionWidth, sectionHeight, 4, 'F');
      
      pdf.setDrawColor(...colors.veryLightBlue);
      pdf.setLineWidth(1);
      drawRoundedRect(qrSectionX, yPosition, qrSectionWidth, sectionHeight, 4, 'S');
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.lightBlue);
      pdf.text('Quick Check-in', qrSectionX + qrSectionWidth/2, yPosition + 9, { align: 'center' });
      
      let qrY = yPosition + 16;
      
      // QR code centered
      const qrSize = 45;
      const qrX = qrSectionX + (qrSectionWidth - qrSize) / 2;
      
      pdf.setFillColor(...colors.white);
      drawRoundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 'F');
      
      pdf.setDrawColor(...colors.lightBlue);
      pdf.setLineWidth(1);
      drawRoundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 'S');
      
      try {
        pdf.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
        
        qrY += qrSize + 5;
        
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.mediumGray);
        const qrText = pdf.splitTextToSize('Scan for instant check-in', qrSectionWidth - 8);
        pdf.text(qrText, qrSectionX + qrSectionWidth/2, qrY, { align: 'center' });
        
      } catch (error) {
        pdf.setFontSize(9);
        pdf.setTextColor(239, 68, 68);
        pdf.text('QR Available\nin digital version', qrSectionX + qrSectionWidth/2, yPosition + 40, { align: 'center' });
      }
    }
    
    yPosition += sectionHeight + 10;
    
    // ========== COMPACT INSTRUCTIONS ==========
    pdf.setFillColor(...colors.veryLightBlue);
    drawRoundedRect(margin, yPosition, contentWidth, 20, 4, 'F');
    
    pdf.setDrawColor(...colors.lightBlue);
    pdf.setLineWidth(0.8);
    drawRoundedRect(margin, yPosition, contentWidth, 20, 4, 'S');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.darkBlue);
    pdf.text('Important:', margin + 8, yPosition + 7);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.darkGray);
    const instructionText = 'Please arrive 15 minutes early with valid ID and previous medical records. Present your token at the reception desk for check-in.';
    const wrappedText = pdf.splitTextToSize(instructionText, contentWidth - 16);
    pdf.text(wrappedText, margin + 8, yPosition + 13);
    
    // ========== FOOTER ==========
    yPosition = pageHeight - 25;
    
    pdf.setDrawColor(...colors.lightBlue);
    pdf.setLineWidth(0.5);
    pdf.line(margin + 40, yPosition, pageWidth - margin - 40, yPosition);
    
    yPosition += 6;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primaryBlue);
    pdf.text('OHMS Eye Care Hospital', pageWidth/2, yPosition, { align: 'center' });
    
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.mediumGray);
    pdf.text('Your Vision, Our Mission  |  Available 24/7', pageWidth/2, yPosition + 5, { align: 'center' });
    
    pdf.setFontSize(8);
    pdf.text('Contact: +91-XXXX-XXXX  |  contact@ohmseyecare.com', pageWidth/2, yPosition + 10, { align: 'center' });
    
    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '');
    const fileName = `OHMS_Appointment_${appointmentData.token || 'XXXX'}_${date}_${time}.pdf`;
    
    pdf.save(fileName);
    
    return { success: true, filename: fileName };
    
  } catch (error) {
    throw new Error('Failed to generate PDF');
  }
};

export const generateAppointmentPDFFromHTML = async (elementId) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;
    
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    const fileName = `OHMS_Appointment_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    return { success: true, filename: fileName };
    
  } catch (error) {
    throw new Error('Failed to generate PDF from HTML');
  }
};


// export const generateAppointmentPDFFromHTML = async (elementId) => {
//   try {
//     const element = document.getElementById(elementId);
//     if (!element) {
//       throw new Error('Element not found');
//     }
    
//     const canvas = await html2canvas(element, {
//       scale: 2,
//       useCORS: true,
//       backgroundColor: '#ffffff'
//     });
    
//     const imgData = canvas.toDataURL('image/png');
//     const pdf = new jsPDF('p', 'mm', 'a4');
    
//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = pdf.internal.pageSize.getHeight();
//     const imgWidth = canvas.width;
//     const imgHeight = canvas.height;
    
//     const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
//     const imgX = (pdfWidth - imgWidth * ratio) / 2;
//     const imgY = 0;
    
//     pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
//     const fileName = `OHMS_Appointment_${new Date().toISOString().split('T')[0]}.pdf`;
//     pdf.save(fileName);
    
//     return { success: true, filename: fileName };
    
//   } catch (error) {
//     console.error('Error generating PDF from HTML:', error);
//     throw new Error('Failed to generate PDF from HTML');
//   }
// };