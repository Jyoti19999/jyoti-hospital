const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

/**
 * Create claim documents directory structure
 * uploads/{patientNumber}/{ipdNumber}/claim-documents
 */
const createClaimDirectories = async (patientNumber, ipdNumber) => {
  const claimDocsPath = path.join(
    __dirname,
    '../../uploads',
    String(patientNumber),
    ipdNumber,
    'claim-documents'
  );

  try {
    await fs.mkdir(claimDocsPath, { recursive: true });
    console.log('📁 Claim documents directory created/verified:', claimDocsPath);
    return claimDocsPath;
  } catch (error) {
    console.error('❌ Error creating claim directories:', error);
    throw new Error('Failed to create claim documents directory');
  }
};

/**
 * Multer storage configuration for claim documents
 */
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // Get patient number and IPD admission number from the request
      const { patientNumber, ipdNumber } = req.claimMetadata || {};

      if (!patientNumber || !ipdNumber) {
        return cb(new Error('Patient number and IPD number are required for claim upload'));
      }

      const claimDocsPath = await createClaimDirectories(patientNumber, ipdNumber);
      cb(null, claimDocsPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const sanitized = baseName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    cb(null, `claim_${uniqueSuffix}_${sanitized}${ext}`);
  }
});

/**
 * File filter for claim documents - only allow specific types
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF and images are allowed`), false);
  }
};

/**
 * Multer instance for claim document uploads
 */
const claimUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Maximum 10 documents
  }
});

/**
 * Middleware to attach claim metadata before file upload
 * This extracts patient and IPD info and makes it available for storage configuration
 */
const attachClaimMetadata = async (req, res, next) => {
  try {
    const { ipdId } = req.params;

    if (!ipdId) {
      return res.status(400).json({
        success: false,
        message: 'IPD admission ID is required'
      });
    }

    // Use singleton Prisma instance
    const prisma = require('../utils/prisma');

    // Fetch IPD admission with patient details
    const admission = await prisma.ipdAdmission.findUnique({
      where: { id: ipdId },
      include: {
        patient: {
          select: {
            patientNumber: true
          }
        }
      }
    });

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'IPD admission not found'
      });
    }

    if (!admission.patient.patientNumber) {
      return res.status(400).json({
        success: false,
        message: 'Patient number not found for this admission'
      });
    }

    // Attach metadata to request for use in storage configuration
    req.claimMetadata = {
      patientNumber: admission.patient.patientNumber,
      ipdNumber: admission.admissionNumber
    };

    await prisma.$disconnect();
    next();
  } catch (error) {
    console.error('❌ Error attaching claim metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process claim upload request',
      error: error.message
    });
  }
};

/**
 * Combined middleware for claim document upload
 * First attaches metadata, then processes file upload
 */
const uploadClaimDocuments = [
  attachClaimMetadata,
  claimUpload.array('claimDocuments', 10)
];

/**
 * Error handling middleware for multer errors
 */
const handleClaimUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field in file upload'
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};

module.exports = {
  uploadClaimDocuments,
  handleClaimUploadError,
  createClaimDirectories
};
