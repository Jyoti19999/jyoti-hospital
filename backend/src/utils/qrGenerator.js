// src/utils/qrGenerator.js
const QRCode = require('qrcode');

class QRGenerator {
  /**
   * Generate QR code as base64 data URL
   * @param {string} data - Data to encode in QR code
   * @param {Object} options - QR code options
   * @returns {Promise<string>} Base64 data URL string
   */
  static async generateQR(data, options = {}) {
    try {
      const defaultOptions = {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',  // Black dots
          light: '#FFFFFF'  // White background
        },
        errorCorrectionLevel: 'M'
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // Generate QR code as base64 data URL
      const qrCodeDataURL = await QRCode.toDataURL(data, mergedOptions);
      
      console.log(`QR Code generated successfully for data: ${data.substring(0, 20)}...`);
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code specifically for daily attendance OTP
   * @param {string} otp - 6-digit OTP
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<string>} Base64 data URL string
   */
  static async generateAttendanceQR(otp, date) {
    try {
      // Create structured data for better scanning
      const qrData = otp; // Simple 6-digit OTP only for easy manual entry
      
      const options = {
        width: 300,
        margin: 3,
        color: {
          dark: '#0ea5e9',  // Blue dots to match hospital theme
          light: '#FFFFFF'  // White background
        },
        errorCorrectionLevel: 'H' // High error correction for better scanning
      };

      const qrCodeDataURL = await this.generateQR(qrData, options);
      
      console.log(`Attendance QR code generated for date ${date} with OTP: ${otp}`);
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating attendance QR code:', error);
      throw new Error('Failed to generate attendance QR code');
    }
  }

  /**
   * Generate QR code as SVG string
   * @param {string} data - Data to encode in QR code
   * @param {Object} options - QR code options
   * @returns {Promise<string>} SVG string
   */
  static async generateQRSVG(data, options = {}) {
    try {
      const defaultOptions = {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // Generate QR code as SVG
      const qrCodeSVG = await QRCode.toString(data, { 
        type: 'svg',
        ...mergedOptions 
      });
      
      console.log(`QR Code SVG generated successfully for data: ${data.substring(0, 20)}...`);
      
      return qrCodeSVG;
    } catch (error) {
      console.error('Error generating QR code SVG:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }

  /**
   * Validate QR code data before generation
   * @param {string} data - Data to validate
   * @returns {boolean} True if valid
   */
  static validateQRData(data) {
    if (!data || typeof data !== 'string') {
      return false;
    }
    
    // Check if data is too long (QR codes have limits)
    if (data.length > 2000) {
      return false;
    }
    
    return true;
  }
}

module.exports = QRGenerator;