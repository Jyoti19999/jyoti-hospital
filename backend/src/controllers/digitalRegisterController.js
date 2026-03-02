const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/digital-registers');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, and PNG images are allowed!'));
    }
  }
});

// Create a new register definition
const createRegisterDefinition = async (req, res) => {
  try {
    const { name, description, columns, allowedStaffTypes } = req.body;

    // Validate input
    if (!name || !columns || columns.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Register name and at least one column are required'
      });
    }

    // Validate allowedStaffTypes
    if (!allowedStaffTypes || allowedStaffTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one staff type must be selected'
      });
    }

    // Check for duplicate register name
    const existing = await prisma.digitalRegisterDefinition.findUnique({
      where: { name }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A register with this name already exists'
      });
    }

    // Create register with columns
    const register = await prisma.digitalRegisterDefinition.create({
      data: {
        name,
        description,
        allowedStaffTypes,
        createdBy: req.user?.id,
        columns: {
          create: columns.map((col, index) => ({
            columnName: col.columnName,
            columnType: col.columnType,
            isRequired: col.isRequired || false,
            displayOrder: index,
            minLength: col.minLength || null,
            maxLength: col.maxLength || null,
            minValue: col.minValue || null,
            maxValue: col.maxValue || null,
            pattern: col.pattern || null,
            options: col.options || null  // For DROPDOWN and MULTI_SELECT
          }))
        }
      },
      include: {
        columns: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Register created successfully',
      data: register
    });
  } catch (error) {
    console.error('Error creating register:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create register',
      error: error.message
    });
  }
};

// Get all register definitions
const getRegisterDefinitions = async (req, res) => {
  try {
    const registers = await prisma.digitalRegisterDefinition.findMany({
      include: {
        columns: {
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { records: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: registers
    });
  } catch (error) {
    console.error('Error fetching registers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registers',
      error: error.message
    });
  }
};

// Get single register definition
const getRegisterDefinitionById = async (req, res) => {
  try {
    const { id } = req.params;

    const register = await prisma.digitalRegisterDefinition.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { records: true }
        }
      }
    });

    if (!register) {
      return res.status(404).json({
        success: false,
        message: 'Register not found'
      });
    }

    res.json({
      success: true,
      data: register
    });
  } catch (error) {
    console.error('Error fetching register:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch register',
      error: error.message
    });
  }
};

// Update register definition
const updateRegisterDefinition = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, columns, allowedStaffTypes } = req.body;

    // Get existing columns
    const existingRegister = await prisma.digitalRegisterDefinition.findUnique({
      where: { id },
      include: { columns: true }
    });

    if (!existingRegister) {
      return res.status(404).json({
        success: false,
        message: 'Register not found'
      });
    }

    // Identify columns to delete (existing columns not in the new list)
    const existingColumnIds = existingRegister.columns.map(col => col.id);
    const newColumnNames = columns.map(col => col.columnName);
    const columnsToDelete = existingRegister.columns
      .filter(col => !newColumnNames.includes(col.columnName))
      .map(col => col.id);

    // Identify new columns to create
    const existingColumnNames = existingRegister.columns.map(col => col.columnName);
    const newColumns = columns.filter(col => !existingColumnNames.includes(col.columnName));

    // Update register
    const register = await prisma.digitalRegisterDefinition.update({
      where: { id },
      data: {
        name,
        description,
        allowedStaffTypes: allowedStaffTypes || existingRegister.allowedStaffTypes,
        columns: {
          // Delete only removed columns
          deleteMany: columnsToDelete.length > 0 ? {
            id: { in: columnsToDelete }
          } : undefined,
          // Create only new columns
          create: newColumns.map((col, index) => ({
            columnName: col.columnName,
            columnType: col.columnType,
            isRequired: col.isRequired || false,
            displayOrder: existingRegister.columns.length + index,
            minLength: col.minLength || null,
            maxLength: col.maxLength || null,
            minValue: col.minValue || null,
            maxValue: col.maxValue || null,
            pattern: col.pattern || null,
            options: col.options || null  // For DROPDOWN and MULTI_SELECT
          }))
        }
      },
      include: {
        columns: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      message: 'Register updated successfully',
      data: register
    });
  } catch (error) {
    console.error('Error updating register:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update register',
      error: error.message
    });
  }
};

// Delete register definition
const deleteRegisterDefinition = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.digitalRegisterDefinition.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Register deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting register:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete register',
      error: error.message
    });
  }
};

// Create a record in a register
const createRegisterRecord = async (req, res) => {
  try {
    const { id } = req.params; // register ID
    const { values } = req.body; // { columnId: value, ... }

    // Get register with columns
    const register = await prisma.digitalRegisterDefinition.findUnique({
      where: { id },
      include: { columns: true }
    });

    if (!register) {
      return res.status(404).json({
        success: false,
        message: 'Register not found'
      });
    }

    // Validate required fields and data types
    const errors = [];
    const requiredColumns = register.columns.filter(col => col.isRequired);
    
    for (const col of requiredColumns) {
      if (!values[col.id] && values[col.id] !== 0) {
        errors.push(`${col.columnName} is required`);
      }
    }

    // Validate data types and rules
    for (const [columnId, value] of Object.entries(values)) {
      if (!value && value !== 0) continue; // Skip empty optional fields
      
      const column = register.columns.find(c => c.id === columnId);
      if (!column) continue;

      switch (column.columnType) {
        case 'TEXT':
          const strValue = String(value);
          if (column.minLength && strValue.length < column.minLength) {
            errors.push(`${column.columnName} must be at least ${column.minLength} characters`);
          }
          if (column.maxLength && strValue.length > column.maxLength) {
            errors.push(`${column.columnName} must be at most ${column.maxLength} characters`);
          }
          if (column.pattern) {
            const regex = new RegExp(column.pattern);
            if (!regex.test(strValue)) {
              errors.push(`${column.columnName} format is invalid`);
            }
          }
          break;
        case 'EMAIL':
          const emailValue = String(value);
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(emailValue)) {
            errors.push(`${column.columnName} must be a valid email address`);
          }
          break;
        case 'MOBILE':
          const mobileValue = String(value);
          const mobileRegex = /^[0-9]{10}$/;
          if (!mobileRegex.test(mobileValue)) {
            errors.push(`${column.columnName} must be a valid 10-digit mobile number`);
          }
          break;
        case 'URL':
          const urlValue = String(value);
          try {
            new URL(urlValue);
          } catch (e) {
            errors.push(`${column.columnName} must be a valid URL`);
          }
          break;
        case 'NUMBER':
        case 'LONG_NUMBER':
          if (isNaN(value)) {
            errors.push(`${column.columnName} must be a valid number`);
          } else {
            const numValue = parseFloat(value);
            if (column.minValue !== null && numValue < column.minValue) {
              errors.push(`${column.columnName} must be at least ${column.minValue}`);
            }
            if (column.maxValue !== null && numValue > column.maxValue) {
              errors.push(`${column.columnName} must be at most ${column.maxValue}`);
            }
          }
          break;
        case 'DATE':
          if (isNaN(Date.parse(value))) {
            errors.push(`${column.columnName} must be a valid date`);
          }
          break;
        case 'DATETIME':
          if (isNaN(Date.parse(value))) {
            errors.push(`${column.columnName} must be a valid date and time`);
          }
          break;
        case 'TIME':
          // Validate time format HH:MM
          if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
            errors.push(`${column.columnName} must be a valid time (HH:MM)`);
          }
          break;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Create record with values
    const record = await prisma.digitalRegisterRecord.create({
      data: {
        registerId: id,
        createdBy: req.user?.id,
        values: {
          create: Object.entries(values).map(([columnId, value]) => {
            const column = register.columns.find(c => c.id === columnId);
            const valueData = { columnId };

            // Store value in appropriate field based on column type
            if (column.columnType === 'TEXT' || column.columnType === 'TIME' || 
                column.columnType === 'EMAIL' || column.columnType === 'MOBILE' || 
                column.columnType === 'URL' || column.columnType === 'DROPDOWN' || 
                column.columnType === 'MULTI_SELECT' || column.columnType === 'PDF_DOCUMENT') {
              valueData.textValue = String(value);
            } else if (column.columnType === 'NUMBER' || column.columnType === 'LONG_NUMBER') {
              valueData.numberValue = parseFloat(value);
            } else if (column.columnType === 'DATE' || column.columnType === 'DATETIME') {
              valueData.dateValue = new Date(value);
            } else if (column.columnType === 'IMAGE') {
              valueData.imageValue = String(value);
            }

            return valueData;
          })
        }
      },
      include: {
        values: {
          include: { column: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Record created successfully',
      data: record
    });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create record',
      error: error.message
    });
  }
};

// Get all records in a register
const getRegisterRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, search = '' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const records = await prisma.digitalRegisterRecord.findMany({
      where: { registerId: id },
      include: {
        values: {
          include: { column: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.digitalRegisterRecord.count({
      where: { registerId: id }
    });

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch records',
      error: error.message
    });
  }
};

// Update a record
const updateRegisterRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { values } = req.body;

    // Delete existing values and create new ones
    await prisma.digitalRegisterValue.deleteMany({
      where: { recordId }
    });

    // Get the record with register info to check column types
    const existingRecord = await prisma.digitalRegisterRecord.findUnique({
      where: { id: recordId },
      include: {
        register: {
          include: { columns: true }
        }
      }
    });

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    const record = await prisma.digitalRegisterRecord.update({
      where: { id: recordId },
      data: {
        values: {
          create: Object.entries(values).map(([columnId, value]) => {
            const column = existingRecord.register.columns.find(c => c.id === columnId);
            const valueData = { columnId };

            // Store value in appropriate field based on column type
            if (column.columnType === 'TEXT' || column.columnType === 'TIME' || 
                column.columnType === 'EMAIL' || column.columnType === 'MOBILE' || 
                column.columnType === 'URL' || column.columnType === 'DROPDOWN' || 
                column.columnType === 'MULTI_SELECT' || column.columnType === 'PDF_DOCUMENT') {
              valueData.textValue = String(value);
            } else if (column.columnType === 'NUMBER' || column.columnType === 'LONG_NUMBER') {
              valueData.numberValue = parseFloat(value);
            } else if (column.columnType === 'DATE' || column.columnType === 'DATETIME') {
              valueData.dateValue = new Date(value);
            } else if (column.columnType === 'IMAGE') {
              valueData.imageValue = String(value);
            }

            return valueData;
          })
        }
      },
      include: {
        values: {
          include: { column: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Record updated successfully',
      data: record
    });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update record',
      error: error.message
    });
  }
};

// Delete a record
const deleteRegisterRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    await prisma.digitalRegisterRecord.delete({
      where: { id: recordId }
    });

    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete record',
      error: error.message
    });
  }
};

// Upload image
const uploadImage = [
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const filePath = `/uploads/digital-registers/${req.file.filename}`;
      
      res.json({
        success: true,
        message: 'Image uploaded successfully',
        filePath
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: error.message
      });
    }
  }
];

// Configure multer for PDF uploads
const pdfStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/pdfs');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for PDFs
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  }
});

// Upload PDF
const uploadPdf = [
  pdfUpload.single('pdf'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No PDF file provided'
        });
      }

      const filePath = `/uploads/pdfs/${req.file.filename}`;
      
      res.json({
        success: true,
        message: 'PDF uploaded successfully',
        filePath,
        fileName: req.file.originalname,
        fileSize: req.file.size
      });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload PDF',
        error: error.message
      });
    }
  }
];

module.exports = {
  createRegisterDefinition,
  getRegisterDefinitions,
  getRegisterDefinitionById,
  updateRegisterDefinition,
  deleteRegisterDefinition,
  createRegisterRecord,
  getRegisterRecords,
  updateRegisterRecord,
  deleteRegisterRecord,
  uploadImage,
  uploadPdf
};
