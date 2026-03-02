const express = require('express');
const router = express.Router();
const consentFormService = require('../services/consentFormService');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

// Configure multer for file upload (signed PDFs)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

/**
 * GET /api/consent-forms/data/:admissionId
 * Fetch consent form data for an admission
 */
router.get('/data/:admissionId', async (req, res) => {
  try {
    const { admissionId } = req.params;
    
    const consentData = await consentFormService.getConsentFormData(admissionId);
    
    res.json({
      success: true,
      data: consentData
    });
    
  } catch (error) {
    console.error('Error fetching consent form data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch consent form data'
    });
  }
});

/**
 * POST /api/consent-forms/generate/:admissionId
 * Generate pre-filled consent forms
 */
router.post('/generate/:admissionId', async (req, res) => {
  try {
    const { admissionId } = req.params;
    
    console.log('📋 Generating consent forms for admission:', admissionId);
    
    const result = await consentFormService.generateConsentForms(admissionId);
    
    console.log('✅ Consent forms generated successfully');
    console.log('📤 Sending response to frontend:', JSON.stringify({
      success: result.success,
      message: result.message,
      hasFiles: !!result.files,
      hasData: !!result.data
    }));
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error generating consent forms:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate consent forms'
    });
  }
});

/**
 * GET /api/consent-forms/preview/:admissionId/:formType/:filename
 * Preview/download a pre-filled consent form
 */
router.get('/preview/:admissionId/:formType/:filename', async (req, res) => {
  try {
    const { admissionId, formType, filename } = req.params;
    
    // Security: Validate formType
    if (!['ophsureng', 'ansconeng'].includes(formType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form type'
      });
    }
    
    // Security: Validate filename format
    if (!filename.match(/^(ophsureng|ansconeng)_[a-zA-Z0-9-]+_\d+\.pdf$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename format'
      });
    }
    
    const tempDir = path.join(__dirname, '..', '..', 'uploads', 'consent-forms', 'temp');
    const filePath = path.join(tempDir, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Send file
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Error serving consent form:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load consent form'
    });
  }
});

/**
 * POST /api/consent-forms/save-signed/:admissionId/:formType
 * Save a signed consent form
 */
router.post('/save-signed/:admissionId/:formType', upload.single('signedPdf'), async (req, res) => {
  try {
    const { admissionId, formType } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file uploaded'
      });
    }
    
    // Security: Validate formType
    if (!['ophsureng', 'ansconeng'].includes(formType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form type'
      });
    }
    
    const result = await consentFormService.saveSignedConsentForm(
      admissionId,
      formType,
      req.file.buffer
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Error saving signed consent form:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save signed consent form'
    });
  }
});

/**
 * DELETE /api/consent-forms/cleanup/:admissionId
 * Clean up temporary files for an admission
 */
router.delete('/cleanup/:admissionId', async (req, res) => {
  try {
    const { admissionId } = req.params;
    
    const result = await consentFormService.cleanupTempFiles(admissionId);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clean up temporary files'
    });
  }
});

/**
 * GET /api/consent-forms/signed-preview/:admissionId/:formType/:filename
 * Preview signed consent form (inline display in browser)
 */
router.get('/signed-preview/:admissionId/:formType/:filename', async (req, res) => {
  try {
    const { admissionId, formType, filename } = req.params;
    
    // Security: Validate formType
    if (!['ophsureng', 'ansconeng'].includes(formType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form type'
      });
    }
    
    // Security: Validate filename format (signed PDFs)
    if (!filename.match(/^(ophsureng|ansconeng)_signed_\d+\.pdf$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename format'
      });
    }
    
    const permanentDir = path.join(__dirname, '..', '..', 'uploads', 'consent-forms', admissionId);
    const filePath = path.join(permanentDir, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Signed consent form not found'
      });
    }
    
    // Send file for inline display
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Error serving signed consent form:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load signed consent form'
    });
  }
});

/**
 * GET /api/consent-forms/download/:admissionId/:formType/:filename
 * Download saved signed consent form
 */
router.get('/download/:admissionId/:formType/:filename', async (req, res) => {
  try {
    const { admissionId, formType, filename } = req.params;
    
    // Security: Validate formType
    if (!['ophsureng', 'ansconeng'].includes(formType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form type'
      });
    }
    
    const permanentDir = path.join(__dirname, '..', '..', 'uploads', 'consent-forms', admissionId);
    const filePath = path.join(permanentDir, filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Send file
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Error downloading consent form:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download consent form'
    });
  }
});

module.exports = router;
