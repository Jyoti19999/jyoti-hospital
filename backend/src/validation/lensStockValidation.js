const Joi = require('joi');

// Create lens stock validation schema
const createLensStockSchema = Joi.object({
  lensName: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Lens name is required',
    'string.min': 'Lens name must be at least 1 character',
    'string.max': 'Lens name must not exceed 255 characters',
    'any.required': 'Lens name is required'
  }),
  
  lensType: Joi.string().valid(
    'IOL', 
    'TORIC_IOL', 
    'MULTIFOCAL_IOL', 
    'ACCOMMODATING_IOL', 
    'CONTACT_LENS', 
    'SPECIALTY_LENS'
  ).required().messages({
    'any.only': 'Lens type must be IOL, TORIC_IOL, MULTIFOCAL_IOL, ACCOMMODATING_IOL, CONTACT_LENS, or SPECIALTY_LENS',
    'any.required': 'Lens type is required'
  }),
  
  lensCategory: Joi.string().valid(
    'MONOFOCAL', 
    'TORIC', 
    'MULTIFOCAL', 
    'ACCOMMODATING',
    'EXTENDED_DEPTH_FOCUS',
    'LIGHT_ADJUSTABLE',
    'CUSTOM'
  ).required().messages({
    'any.only': 'Lens category must be MONOFOCAL, TORIC, MULTIFOCAL, ACCOMMODATING, EXTENDED_DEPTH_FOCUS, LIGHT_ADJUSTABLE, or CUSTOM',
    'any.required': 'Lens category is required'
  }),
  
  manufacturer: Joi.string().min(1).max(255).optional().allow('').messages({
    'string.min': 'Manufacturer must be at least 1 character',
    'string.max': 'Manufacturer must not exceed 255 characters'
  }),
  
  model: Joi.string().min(1).max(255).optional().allow('').messages({
    'string.min': 'Model must be at least 1 character',
    'string.max': 'Model must not exceed 255 characters'
  }),
  
  power: Joi.string().min(1).max(255).optional().allow('').messages({
    'string.min': 'Power must be at least 1 character',
    'string.max': 'Power must not exceed 255 characters'
  }),

  material: Joi.string().max(255).optional().allow('').messages({
    'string.max': 'Material must not exceed 255 characters'
  }),

  diameter: Joi.string().max(255).optional().allow('').messages({
    'string.max': 'Diameter must not exceed 255 characters'
  }),
  
  lensoCost: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Lens cost must be a number',
    'number.positive': 'Lens cost must be positive',
    'any.required': 'Lens cost is required'
  }),
  
  patientCost: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Patient cost must be a number',
    'number.positive': 'Patient cost must be positive',
    'any.required': 'Patient cost is required'
  }),

  insuranceCoverage: Joi.number().min(0).precision(2).default(0).messages({
    'number.base': 'Insurance coverage must be a number',
    'number.min': 'Insurance coverage cannot be negative'
  }),
  
  stockQuantity: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'Stock quantity must be a number',
    'number.integer': 'Stock quantity must be an integer',
    'number.min': 'Stock quantity cannot be negative'
  }),
  
  reorderLevel: Joi.number().integer().min(0).default(5).messages({
    'number.base': 'Reorder level must be a number',
    'number.integer': 'Reorder level must be an integer',
    'number.min': 'Reorder level cannot be negative'
  }),
  
  batchNumber: Joi.string().max(255).optional().allow('').messages({
    'string.max': 'Batch number must not exceed 255 characters'
  }),
  
  expiryDate: Joi.date().iso().optional().messages({
    'date.format': 'Expiry date must be in ISO format (YYYY-MM-DD)',
    'date.base': 'Expiry date must be a valid date'
  }),
  
  isActive: Joi.boolean().default(true).messages({
    'boolean.base': 'Active status must be a boolean'
  })
});

// Update lens stock validation schema
const updateLensStockSchema = Joi.object({
  lensName: Joi.string().min(1).max(255).optional().messages({
    'string.empty': 'Lens name cannot be empty',
    'string.min': 'Lens name must be at least 1 character',
    'string.max': 'Lens name must not exceed 255 characters'
  }),
  
  lensType: Joi.string().valid('IOL', 'TORIC_IOL', 'MULTIFOCAL_IOL').optional().messages({
    'any.only': 'Lens type must be IOL, TORIC_IOL, or MULTIFOCAL_IOL'
  }),
  
  lensCategory: Joi.string().valid('MONOFOCAL', 'TORIC', 'MULTIFOCAL', 'EXTENDED_DEPTH_FOCUS').optional().messages({
    'any.only': 'Lens category must be MONOFOCAL, TORIC, MULTIFOCAL, or EXTENDED_DEPTH_FOCUS'
  }),
  
  manufacturer: Joi.string().min(1).max(255).optional().messages({
    'string.empty': 'Manufacturer cannot be empty',
    'string.min': 'Manufacturer must be at least 1 character',
    'string.max': 'Manufacturer must not exceed 255 characters'
  }),
  
  model: Joi.string().min(1).max(255).optional().messages({
    'string.empty': 'Model cannot be empty',
    'string.min': 'Model must be at least 1 character',
    'string.max': 'Model must not exceed 255 characters'
  }),
  
  power: Joi.string().min(1).max(255).optional().messages({
    'string.empty': 'Power cannot be empty',
    'string.min': 'Power must be at least 1 character',
    'string.max': 'Power must not exceed 255 characters'
  }),

  material: Joi.string().max(255).optional().allow('').messages({
    'string.max': 'Material must not exceed 255 characters'
  }),

  diameter: Joi.string().max(255).optional().allow('').messages({
    'string.max': 'Diameter must not exceed 255 characters'
  }),
  
  lensoCost: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'Lens cost must be a number',
    'number.positive': 'Lens cost must be positive'
  }),
  
  patientCost: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'Patient cost must be a number',
    'number.positive': 'Patient cost must be positive'
  }),
  
  stockQuantity: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Stock quantity must be a number',
    'number.integer': 'Stock quantity must be an integer',
    'number.min': 'Stock quantity cannot be negative'
  }),
  
  reorderLevel: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Reorder level must be a number',
    'number.integer': 'Reorder level must be an integer',
    'number.min': 'Reorder level cannot be negative'
  }),
  
  batchNumber: Joi.string().max(255).optional().allow('').messages({
    'string.max': 'Batch number must not exceed 255 characters'
  }),
  
  expiryDate: Joi.date().iso().optional().allow(null).messages({
    'date.format': 'Expiry date must be in ISO format (YYYY-MM-DD)',
    'date.base': 'Expiry date must be a valid date'
  }),
  
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'Active status must be a boolean'
  })
});

// Add stock validation schema
const addStockSchema = Joi.object({
  quantity: Joi.number().integer().positive().required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.positive': 'Quantity must be positive',
    'any.required': 'Quantity is required'
  }),
  
  reason: Joi.string().min(1).max(500).required().messages({
    'string.empty': 'Reason is required',
    'string.min': 'Reason must be at least 1 character',
    'string.max': 'Reason must not exceed 500 characters',
    'any.required': 'Reason is required'
  }),
  
  expiryDate: Joi.date().iso().optional().allow(null).messages({
    'date.format': 'Expiry date must be in ISO format (YYYY-MM-DD)',
    'date.base': 'Expiry date must be a valid date'
  }),
  
  batchNumber: Joi.string().max(255).optional().allow('').messages({
    'string.max': 'Batch number must not exceed 255 characters'
  })
});

// Remove stock validation schema
const removeStockSchema = Joi.object({
  quantity: Joi.number().integer().positive().required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.positive': 'Quantity must be positive',
    'any.required': 'Quantity is required'
  }),
  
  reason: Joi.string().min(1).max(500).required().messages({
    'string.empty': 'Reason is required',
    'string.min': 'Reason must be at least 1 character',
    'string.max': 'Reason must not exceed 500 characters',
    'any.required': 'Reason is required'
  })
});

// Adjust stock validation schema
const adjustStockSchema = Joi.object({
  newQuantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'New quantity must be a number',
    'number.integer': 'New quantity must be an integer',
    'number.min': 'New quantity cannot be negative',
    'any.required': 'New quantity is required'
  }),
  
  reason: Joi.string().min(1).max(500).required().messages({
    'string.empty': 'Reason is required',
    'string.min': 'Reason must be at least 1 character',
    'string.max': 'Reason must not exceed 500 characters',
    'any.required': 'Reason is required'
  })
});

// Query filters validation schema
const queryFiltersSchema = Joi.object({
  search: Joi.string().max(255).optional().allow('').messages({
    'string.max': 'Search term must not exceed 255 characters'
  }),
  
  lensType: Joi.string().valid('IOL', 'TORIC_IOL', 'MULTIFOCAL_IOL').optional().messages({
    'any.only': 'Lens type must be IOL, TORIC_IOL, or MULTIFOCAL_IOL'
  }),
  
  lensCategory: Joi.string().valid('MONOFOCAL', 'TORIC', 'MULTIFOCAL', 'EXTENDED_DEPTH_FOCUS').optional().messages({
    'any.only': 'Lens category must be MONOFOCAL, TORIC, MULTIFOCAL, or EXTENDED_DEPTH_FOCUS'
  }),
  
  manufacturer: Joi.string().max(255).optional().allow('').messages({
    'string.max': 'Manufacturer must not exceed 255 characters'
  }),
  
  isActive: Joi.string().valid('true', 'false').optional().messages({
    'any.only': 'Active status must be "true" or "false"'
  }),
  
  lowStock: Joi.string().valid('true', 'false').optional().messages({
    'any.only': 'Low stock filter must be "true" or "false"'
  }),
  
  nearExpiry: Joi.string().valid('true', 'false').optional().messages({
    'any.only': 'Near expiry filter must be "true" or "false"'
  }),
  
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100'
  }),
  
  sortBy: Joi.string().valid(
    'lensName', 'lensType', 'manufacturer', 'stockQuantity', 
    'lensoCost', 'patientCost', 'createdAt', 'updatedAt'
  ).optional().messages({
    'any.only': 'Invalid sort field'
  }),
  
  sortOrder: Joi.string().valid('asc', 'desc').optional().messages({
    'any.only': 'Sort order must be "asc" or "desc"'
  }),
  
  days: Joi.number().integer().min(1).max(365).optional().messages({
    'number.base': 'Days must be a number',
    'number.integer': 'Days must be an integer',
    'number.min': 'Days must be at least 1',
    'number.max': 'Days must not exceed 365'
  }),
  
  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
    'date.base': 'Start date must be a valid date'
  }),
  
  endDate: Joi.date().iso().optional().messages({
    'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
    'date.base': 'End date must be a valid date'
  }),
  
  transactionType: Joi.string().valid('IN', 'OUT', 'ADJUSTMENT').optional().messages({
    'any.only': 'Transaction type must be IN, OUT, or ADJUSTMENT'
  }),
  
  q: Joi.string().max(255).optional().allow('').messages({
    'string.max': 'Search query must not exceed 255 characters'
  })
});

// Validation middleware functions
const validateCreateLensStock = (req, res, next) => {
  const { error } = createLensStockSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};

const validateUpdateLensStock = (req, res, next) => {
  const { error } = updateLensStockSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};

const validateAddStock = (req, res, next) => {
  const { error } = addStockSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};

const validateRemoveStock = (req, res, next) => {
  const { error } = removeStockSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};

const validateAdjustStock = (req, res, next) => {
  const { error } = adjustStockSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};

const validateQueryFilters = (req, res, next) => {
  const { error } = queryFiltersSchema.validate(req.query, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Query validation failed',
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};

module.exports = {
  validateCreateLensStock,
  validateUpdateLensStock,
  validateAddStock,
  validateRemoveStock,
  validateAdjustStock,
  validateQueryFilters,
  createLensStockSchema,
  updateLensStockSchema,
  addStockSchema,
  removeStockSchema,
  adjustStockSchema,
  queryFiltersSchema
};