import QRCode from 'qrcode';

/**
 * Generate QR code with patient phone number and appointment details
 * @param {string} phoneNumber - Patient's phone number
 * @param {Object} appointmentData - Appointment details
 * @returns {Promise<string>} - Base64 data URL of the QR code
 */
export const generatePatientQRCode = async (phoneNumber, appointmentData = {}) => {
  try {
    
    // Create QR code data with phone number and appointment info
    const qrData = {
      phone: phoneNumber,
      patientId: appointmentData.uid || `PAT_${Date.now()}`,
      token: appointmentData.token || '',
      doctor: appointmentData.doctorName || appointmentData.doctor || '',
      date: appointmentData.date || '',
      time: appointmentData.time || '',
      department: appointmentData.department || ''
    };


    // Convert to JSON string for QR code
    const qrCodeData = JSON.stringify(qrData);


    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });


    return qrCodeDataURL;
  } catch (error) {
    throw error;
  }
};

/**
 * Generate QR code as SVG
 * @param {string} phoneNumber - Patient's phone number
 * @param {Object} appointmentData - Appointment details
 * @returns {Promise<string>} - SVG string of the QR code
 */
export const generatePatientQRCodeSVG = async (phoneNumber, appointmentData = {}) => {
  try {
    const qrData = {
      phone: phoneNumber,
      patientId: appointmentData.uid || `PAT_${Date.now()}`,
      token: appointmentData.token || '',
      doctor: appointmentData.doctorName || appointmentData.doctor || '',
      date: appointmentData.date || '',
      time: appointmentData.time || '',
      department: appointmentData.department || ''
    };

    const qrCodeData = JSON.stringify(qrData);

    const svgString = await QRCode.toString(qrCodeData, {
      type: 'svg',
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });

    return svgString;
  } catch (error) {
    throw error;
  }
};
