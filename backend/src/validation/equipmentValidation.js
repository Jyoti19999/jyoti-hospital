const { body, query, param } = require('express-validator');

// Validation for creating new equipment
const validateCreateEquipment = [
  body('name')
    .notEmpty()
    .withMessage('Equipment name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Equipment name must be between 2 and 100 characters')
    .trim(),
    // Allows letters, numbers, spaces, and special characters like -, /, (), etc.
    
  body('code')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Equipment code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage('Equipment code must contain only uppercase letters, numbers, hyphens, and underscores'),
    
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Surgical Instruments', 'Consumables', 'Devices', 'Diagnostic Equipment', 'Safety Equipment', 'Monitoring Equipment', 'Medicine'])
    .withMessage('Invalid category'),
    
  body('manufacturer')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Manufacturer name cannot exceed 100 characters')
    .trim(),
    // Allows any characters for manufacturer/brand names
    
  body('currentStock')
    .notEmpty()
    .withMessage('Current stock is required')
    .isInt({ min: 0 })
    .withMessage('Current stock must be a non-negative integer'),
    
  body('reorderLevel')
    .notEmpty()
    .withMessage('Reorder level is required')
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),
    
  body('unitCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit cost must be a non-negative number'),
    
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date format')
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
    
  body('batchNumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Batch number cannot exceed 50 characters')
    .trim()
    // Allows alphanumeric and special characters like -, /, #, etc.
];

// Validation for updating equipment
const validateUpdateEquipment = [
  param('id')
    .notEmpty()
    .withMessage('Equipment ID is required')
    .isString()
    .withMessage('Invalid equipment ID format'),
    
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Equipment name must be between 2 and 100 characters')
    .trim(),
    
  body('code')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Equipment code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage('Equipment code must contain only uppercase letters, numbers, hyphens, and underscores'),
    
  body('category')
    .optional()
    .isIn(['Surgical Instruments', 'Consumables', 'Devices', 'Diagnostic Equipment', 'Safety Equipment', 'Monitoring Equipment', 'Medicine'])
    .withMessage('Invalid category'),
    
  body('manufacturer')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Manufacturer name cannot exceed 100 characters')
    .trim(),
    
  body('currentStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Current stock must be a non-negative integer'),
    
  body('reorderLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),
    
  body('unitCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit cost must be a non-negative number'),
    
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date format')
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
    
  body('batchNumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Batch number cannot exceed 50 characters')
    .trim(),
    
  body('register')
    .optional()
    .isIn(['FridgeStockMedicinesRegister', 'EquipmentStockRegister', 'OtEmergencyStockRegister'])
    .withMessage('Invalid register type'),
    
  body('marginDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid margin date format'),
    
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Validation for stock operations
const validateStockOperation = [
  param('id')
    .notEmpty()
    .withMessage('Equipment ID is required')
    .isString()
    .withMessage('Invalid equipment ID format'),
    
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
    
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters')
    .trim(),
    
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date format')
    .custom((value) => {
      if (value && new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
    
  body('batchNumber')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Batch number cannot exceed 50 characters')
    .trim()
];

// Validation for stock adjustment
const validateStockAdjustment = [
  param('id')
    .notEmpty()
    .withMessage('Equipment ID is required')
    .isString()
    .withMessage('Invalid equipment ID format'),
    
  body('newQuantity')
    .notEmpty()
    .withMessage('New quantity is required')
    .isInt({ min: 0 })
    .withMessage('New quantity must be a non-negative integer'),
    
  body('reason')
    .notEmpty()
    .withMessage('Reason is required for stock adjustment')
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters')
];

// Validation for query parameters
const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('search')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Search term must be between 2 and 50 characters'),
    
  query('category')
    .optional()
    .isIn(['Surgical Instruments', 'Consumables', 'Devices', 'Diagnostic Equipment', 'Safety Equipment', 'Monitoring Equipment', 'Medicine'])
    .withMessage('Invalid category'),
    
  query('manufacturer')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Manufacturer filter cannot exceed 100 characters'),
    
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
    
  query('lowStock')
    .optional()
    .isBoolean()
    .withMessage('lowStock must be a boolean value'),
    
  query('nearExpiry')
    .optional()
    .isBoolean()
    .withMessage('nearExpiry must be a boolean value'),
    
  query('sortBy')
    .optional()
    .isIn(['name', 'category', 'currentStock', 'reorderLevel', 'unitCost', 'expiryDate', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
    
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Validation for date range queries
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
    
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((value, { req }) => {
      if (value && req.query.startDate && new Date(value) <= new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
    
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

// Validation for search equipment
const validateSearchEquipment = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Search query must be between 2 and 50 characters'),
    
  query('category')
    .optional()
    .isIn(['Surgical Instruments', 'Consumables', 'Devices', 'Diagnostic Equipment', 'Safety Equipment', 'Monitoring Equipment', 'Medicine'])
    .withMessage('Invalid category'),
    
  query('surgeryTypeId')
    .optional()
    .isString()
    .withMessage('Invalid surgery type ID'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

module.exports = {
  validateCreateEquipment,
  validateUpdateEquipment,
  validateStockOperation,
  validateStockAdjustment,
  validateQueryParams,
  validateDateRange,
  validateSearchEquipment
};