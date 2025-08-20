const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const User = require('../models/User');

// Rate limiting configurations
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => req.ip,
    ...restOptions
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    keyGenerator,
    skipSuccessfulRequests,
    skipFailedRequests,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        limit: max,
        windowMs
      });

      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    },
    ...restOptions
  });
};

// Different rate limiters for different endpoints
const rateLimiters = {
  // General API rate limit - 100 requests per 15 minutes
  general: createRateLimiter({
    max: 100,
    windowMs: 15 * 60 * 1000,
    message: 'Too many API requests, please try again later.'
  }),

  // Auth endpoints - 5 requests per 15 minutes (stricter)
  auth: createRateLimiter({
    max: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true // Don't count successful logins against the limit
  }),

  // Password reset - very strict
  passwordReset: createRateLimiter({
    max: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many password reset attempts, please try again later.'
  }),

  // File upload - moderate limit
  upload: createRateLimiter({
    max: 20,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many file upload requests, please wait a moment.'
  }),

  // Community posts/comments - prevent spam
  community: createRateLimiter({
    max: 10,
    windowMs: 10 * 60 * 1000, // 10 minutes
    message: 'Too many community interactions, please slow down.'
  })
};

// Enhanced authentication middleware with better error handling
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      logger.warn('Authentication failed: User not found', {
        userId: decoded.userId,
        ip: req.ip,
        url: req.originalUrl
      });

      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add user to request object
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      isActive: user.isActive !== false
    };

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error.message,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Optional authentication - continues even if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (user && user.isActive !== false) {
      req.user = {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        isActive: true
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next(); // Continue without auth
  }
};

// Authorization middleware for specific resources
const authorizeOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const resourceId = req.params.id || req.params.cropId || req.params.farmId;
      
      // Import models dynamically to avoid circular dependencies
      let Model;
      switch (resourceType) {
        case 'farm':
          Model = require('../models/Farm');
          break;
        case 'crop':
          Model = require('../models/Crop');
          break;
        case 'post':
          Model = require('../models/Community');
          break;
        default:
          return res.status(500).json({
            success: false,
            message: 'Invalid resource type'
          });
      }

      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} not found`
        });
      }

      // Check ownership
      const ownerId = resource.owner?._id || resource.owner || resource.author?._id || resource.author;
      
      if (ownerId.toString() !== req.user.userId) {
        logger.warn('Authorization failed: Not resource owner', {
          userId: req.user.userId,
          resourceType,
          resourceId,
          ownerId: ownerId.toString(),
          url: req.originalUrl
        });

        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only modify your own resources'
        });
      }

      next();
    } catch (error) {
      logger.error('Authorization error', {
        error: error.message,
        resourceType,
        userId: req.user?.userId,
        url: req.originalUrl
      });

      res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// IP whitelist middleware (useful for admin endpoints)
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next(); // No restriction if no IPs specified
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      logger.warn('IP access denied', {
        clientIP,
        allowedIPs,
        url: req.originalUrl,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        message: 'Access denied from this IP address'
      });
    }

    next();
  };
};

// Request sanitization
const sanitizeRequest = (req, res, next) => {
  // Remove potential XSS attempts from string values
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      Object.keys(value).forEach(key => {
        sanitized[key] = sanitizeValue(value[key]);
      });
      return sanitized;
    }
    return value;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  next();
};

module.exports = {
  rateLimiters,
  authenticateToken,
  optionalAuth,
  authorizeOwnership,
  securityHeaders,
  ipWhitelist,
  sanitizeRequest
};
