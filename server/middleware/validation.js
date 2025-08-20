const { 
  userSchemas, 
  farmSchemas, 
  cropSchemas, 
  activitySchemas, 
  communitySchemas,
  paginationSchema 
} = require('../validation/schemas');
const logger = require('../utils/logger');

// Generic validation middleware
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query : 
                  source === 'params' ? req.params : 
                  req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false, // Include all errors
      stripUnknown: true, // Remove unknown fields
      allowUnknown: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      logger.warn('Validation failed', {
        url: req.originalUrl,
        method: req.method,
        source,
        errors,
        data
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Replace the original data with validated and sanitized data
    if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
};

// Specific validation middlewares for different routes
const validateUser = {
  register: validate(userSchemas.register),
  login: validate(userSchemas.login),
  updateProfile: validate(userSchemas.updateProfile)
};

const validateFarm = {
  create: validate(farmSchemas.create),
  update: validate(farmSchemas.update)
};

const validateCrop = {
  create: validate(cropSchemas.create),
  update: validate(cropSchemas.update)
};

const validateActivity = {
  create: validate(activitySchemas.create),
  update: validate(activitySchemas.update)
};

const validateCommunity = {
  createPost: validate(communitySchemas.createPost),
  updatePost: validate(communitySchemas.updatePost),
  addComment: validate(communitySchemas.addComment)
};

const validatePagination = validate(paginationSchema, 'query');

// MongoDB ObjectId validation
const { ObjectId } = require('mongoose').Types;

const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!ObjectId.isValid(id)) {
      logger.warn('Invalid ObjectId', {
        paramName,
        id,
        url: req.originalUrl,
        method: req.method
      });

      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }

    next();
  };
};

// Multiple ObjectId validation
const validateMultipleObjectIds = (...paramNames) => {
  return (req, res, next) => {
    const invalidParams = [];

    paramNames.forEach(paramName => {
      const id = req.params[paramName];
      if (id && !ObjectId.isValid(id)) {
        invalidParams.push(paramName);
      }
    });

    if (invalidParams.length > 0) {
      logger.warn('Invalid ObjectIds', {
        invalidParams,
        params: req.params,
        url: req.originalUrl,
        method: req.method
      });

      return res.status(400).json({
        success: false,
        message: `Invalid format for: ${invalidParams.join(', ')}`
      });
    }

    next();
  };
};

// File upload validation
const validateFileUpload = (options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFiles = 5
  } = options;

  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next(); // No files to validate
    }

    const files = req.files || [req.file];
    const errors = [];

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
    }

    files.forEach((file, index) => {
      if (file.size > maxSize) {
        errors.push(`File ${index + 1}: Size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      }

      if (!allowedTypes.includes(file.mimetype)) {
        errors.push(`File ${index + 1}: Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      }
    });

    if (errors.length > 0) {
      logger.warn('File upload validation failed', {
        errors,
        files: files.map(f => ({ 
          name: f.originalname, 
          size: f.size, 
          type: f.mimetype 
        })),
        url: req.originalUrl
      });

      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors
      });
    }

    next();
  };
};

// Query parameter sanitization
const sanitizeQuery = (req, res, next) => {
  // Convert string booleans to actual booleans
  Object.keys(req.query).forEach(key => {
    if (req.query[key] === 'true') req.query[key] = true;
    if (req.query[key] === 'false') req.query[key] = false;
    
    // Convert string numbers to numbers where appropriate
    if (key.includes('limit') || key.includes('page') || key.includes('size')) {
      const num = parseInt(req.query[key]);
      if (!isNaN(num)) req.query[key] = num;
    }
  });

  next();
};

module.exports = {
  validate,
  validateUser,
  validateFarm,
  validateCrop,
  validateActivity,
  validateCommunity,
  validatePagination,
  validateObjectId,
  validateMultipleObjectIds,
  validateFileUpload,
  sanitizeQuery
};
