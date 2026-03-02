const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Create uploads directory structure
const createUploadDirectories = async (employeeId) => {
  const basePath = path.join(__dirname, '../../uploads', employeeId);
  const documentsPath = path.join(basePath, 'documents');
  
  try {
    await fs.mkdir(basePath, { recursive: true });
    await fs.mkdir(documentsPath, { recursive: true });
    return { basePath, documentsPath };
  } catch (error) {
    console.error('Error creating upload directories:', error);
    throw new Error('Failed to create upload directories');
  }
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      // We'll determine the employeeId during processing
      // For now, create a temporary directory
      const tempPath = path.join(__dirname, '../../uploads/temp');
      await fs.mkdir(tempPath, { recursive: true });
      cb(null, tempPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    if (file.fieldname === 'profilePhoto') {
      cb(null, `profile_${uniqueSuffix}${fileExtension}`);
    } else {
      cb(null, `${file.fieldname}_${uniqueSuffix}_${sanitizedOriginalName}`);
    }
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml'];
  const allowedDocumentTypes = ['application/pdf'];
  const allowedTypes = [...allowedImageTypes, ...allowedDocumentTypes];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, JPEG, PNG, GIF, BMP, WebP, SVG`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 20 // Maximum 20 files
  }
});

// Middleware for staff registration file uploads
const uploadStaffFiles = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'documents', maxCount: 15 }
]);

// Conditional upload middleware - only apply multer for multipart requests
const conditionalUploadStaffFiles = (req, res, next) => {
  const contentType = req.get('Content-Type') || '';
  
  console.log('🔍 Upload middleware check:', {
    contentType,
    isMultipart: contentType.includes('multipart/form-data'),
    hasFiles: !!req.files,
    method: req.method,
    url: req.url
  });
  
  // Check if this is a multipart/form-data request
  if (contentType.includes('multipart/form-data')) {
    console.log('📁 Applying multer for file upload');
    // Apply multer middleware for file uploads
    uploadStaffFiles(req, res, next);
  } else {
    console.log('📄 Skipping multer for JSON request');
    // Skip multer for non-multipart requests (e.g., JSON)
    req.files = {}; // Initialize empty files object for consistency
    next();
  }
};

// Helper function to move files from temp to employee folder
const moveFilesToEmployeeFolder = async (employeeId, files) => {
  try {
    const { basePath, documentsPath } = await createUploadDirectories(employeeId);
    const filePaths = {
      profilePhoto: null,
      documents: []
    };

    // Move profile photo
    if (files.profilePhoto && files.profilePhoto[0]) {
      const profileFile = files.profilePhoto[0];
      const newProfilePath = path.join(basePath, `profile${path.extname(profileFile.originalname)}`);
      
      await fs.rename(profileFile.path, newProfilePath);
      filePaths.profilePhoto = `uploads/${employeeId}/profile${path.extname(profileFile.originalname)}`;
    }

    // Move documents
    if (files.documents && files.documents.length > 0) {
      for (const doc of files.documents) {
        const newDocPath = path.join(documentsPath, doc.filename);
        await fs.rename(doc.path, newDocPath);
        filePaths.documents.push(`uploads/${employeeId}/documents/${doc.filename}`);
      }
    }

    return filePaths;
  } catch (error) {
    console.error('Error moving files to employee folder:', error);
    throw new Error('Failed to organize uploaded files');
  }
};

// Helper function to clean up temp files in case of error
const cleanupTempFiles = async (files) => {
  try {
    const allFiles = [
      ...(files.profilePhoto || []),
      ...(files.documents || [])
    ];

    for (const file of allFiles) {
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 20 files allowed'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected field',
        message: 'Only profilePhoto and documents fields are allowed'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: error.message
    });
  }
  
  next(error);
};

module.exports = {
  uploadStaffFiles: conditionalUploadStaffFiles,  // Export the conditional middleware
  moveFilesToEmployeeFolder,
  cleanupTempFiles,
  handleUploadError,
  createUploadDirectories
};