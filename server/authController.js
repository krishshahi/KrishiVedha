const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Mock user database (in production, use MongoDB/PostgreSQL)
const users = new Map();
const refreshTokens = new Map();
const deviceSessions = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'AgriTech_JWT_Secret_2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'AgriTech_Refresh_Secret_2024';
const JWT_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth' },
  transports: [
    new winston.transports.File({ filename: 'logs/auth-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/auth.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for auth
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper functions
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { 
      userId, 
      type: 'access',
      iat: Date.now() / 1000
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { 
      userId, 
      type: 'refresh',
      iat: Date.now() / 1000
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const generateUserId = () => {
  return crypto.randomBytes(12).toString('hex');
};

const sanitizeUser = (user) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    const user = users.get(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = sanitizeUser(user);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    logger.error('Token verification failed', { 
      error: error.message,
      token: req.headers.authorization 
    });

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Auth Controller
const AuthController = {
  // Register new user
  async register(req, res) {
    try {
      const { name, email, password, phone, farmName, location } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required'
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Check if user already exists
      for (const [id, user] of users) {
        if (user.email === email.toLowerCase()) {
          return res.status(409).json({
            success: false,
            message: 'User already exists with this email'
          });
        }
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const userId = generateUserId();
      const deviceId = crypto.randomUUID();

      const newUser = {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone || null,
        farmName: farmName || null,
        location: location || null,
        biometricEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true,
        emailVerified: false,
        profile: {
          avatar: null,
          preferences: {
            notifications: true,
            darkMode: false,
            language: 'en',
            units: 'metric'
          }
        }
      };

      users.set(userId, newUser);

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(userId);
      
      // Store refresh token
      refreshTokens.set(refreshToken, {
        userId,
        deviceId,
        createdAt: Date.now(),
        lastUsed: Date.now()
      });

      // Store device session
      deviceSessions.set(deviceId, {
        userId,
        refreshToken,
        deviceInfo: req.body.deviceInfo || {},
        createdAt: Date.now(),
        lastActive: Date.now()
      });

      logger.info('User registered successfully', { 
        userId, 
        email: newUser.email,
        farmName: newUser.farmName 
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: sanitizeUser(newUser),
        token: accessToken,
        refreshToken
      });

    } catch (error) {
      logger.error('Registration failed', { 
        error: error.message, 
        stack: error.stack,
        body: req.body 
      });

      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  },

  // Login user
  async login(req, res) {
    try {
      const { email, password, deviceInfo } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user by email
      let foundUser = null;
      let foundUserId = null;
      for (const [id, user] of users) {
        if (user.email === email.toLowerCase()) {
          foundUser = user;
          foundUserId = id;
          break;
        }
      }

      if (!foundUser || !foundUser.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, foundUser.password);
      if (!isPasswordValid) {
        logger.warn('Invalid login attempt', { 
          email: foundUser.email,
          ip: req.ip 
        });

        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      foundUser.lastLogin = new Date().toISOString();
      foundUser.updatedAt = new Date().toISOString();
      users.set(foundUserId, foundUser);

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(foundUserId);
      const deviceId = crypto.randomUUID();
      
      // Store refresh token
      refreshTokens.set(refreshToken, {
        userId: foundUserId,
        deviceId,
        createdAt: Date.now(),
        lastUsed: Date.now()
      });

      // Store device session
      deviceSessions.set(deviceId, {
        userId: foundUserId,
        refreshToken,
        deviceInfo: deviceInfo || {},
        createdAt: Date.now(),
        lastActive: Date.now()
      });

      logger.info('User logged in successfully', { 
        userId: foundUserId, 
        email: foundUser.email,
        deviceId 
      });

      res.json({
        success: true,
        message: 'Login successful',
        user: sanitizeUser(foundUser),
        token: accessToken,
        refreshToken
      });

    } catch (error) {
      logger.error('Login failed', { 
        error: error.message, 
        stack: error.stack,
        email: req.body.email 
      });

      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  },

  // Refresh token
  async refreshToken(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      const refreshToken = authHeader.split(' ')[1];
      
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Check if refresh token exists in store
      const tokenData = refreshTokens.get(refreshToken);
      if (!tokenData || tokenData.userId !== decoded.userId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      // Check if user exists
      const user = users.get(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
      
      // Remove old refresh token and add new one
      refreshTokens.delete(refreshToken);
      refreshTokens.set(newRefreshToken, {
        userId: decoded.userId,
        deviceId: tokenData.deviceId,
        createdAt: Date.now(),
        lastUsed: Date.now()
      });

      // Update device session
      const deviceSession = deviceSessions.get(tokenData.deviceId);
      if (deviceSession) {
        deviceSession.refreshToken = newRefreshToken;
        deviceSession.lastActive = Date.now();
        deviceSessions.set(tokenData.deviceId, deviceSession);
      }

      logger.info('Token refreshed successfully', { userId: decoded.userId });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        token: accessToken,
        refreshToken: newRefreshToken
      });

    } catch (error) {
      logger.error('Token refresh failed', { 
        error: error.message,
        token: req.headers.authorization 
      });

      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
  },

  // Verify token
  async verifyToken(req, res) {
    // If we reach this point, the token is valid (middleware passed)
    res.json({
      success: true,
      message: 'Token is valid',
      user: req.user
    });
  },

  // Logout user
  async logout(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          
          // Remove all refresh tokens for this user
          for (const [refreshToken, tokenData] of refreshTokens) {
            if (tokenData.userId === decoded.userId) {
              refreshTokens.delete(refreshToken);
            }
          }

          // Remove all device sessions for this user
          for (const [deviceId, session] of deviceSessions) {
            if (session.userId === decoded.userId) {
              deviceSessions.delete(deviceId);
            }
          }

          logger.info('User logged out successfully', { userId: decoded.userId });
        } catch (error) {
          // Token might be invalid, but still return success
          logger.warn('Invalid token during logout', { error: error.message });
        }
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout failed', { error: error.message });
      
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  },

  // Reset password request
  async resetPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Find user by email
      let foundUser = null;
      for (const [id, user] of users) {
        if (user.email === email.toLowerCase()) {
          foundUser = user;
          break;
        }
      }

      // Always return success for security (don't reveal if email exists)
      logger.info('Password reset requested', { 
        email: email.toLowerCase(),
        userFound: !!foundUser 
      });

      // In production, send reset email here
      if (foundUser) {
        // Generate reset token (in production, store this securely)
        const resetToken = crypto.randomBytes(32).toString('hex');
        console.log(`Password reset token for ${email}: ${resetToken}`);
        
        // Store reset token (in production, save to database with expiry)
        foundUser.resetToken = resetToken;
        foundUser.resetTokenExpiry = Date.now() + 3600000; // 1 hour
      }

      res.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.'
      });

    } catch (error) {
      logger.error('Password reset failed', { 
        error: error.message,
        email: req.body.email 
      });

      res.status(500).json({
        success: false,
        message: 'Password reset failed. Please try again.'
      });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.userId;
      const updates = req.body;

      // Get current user
      const user = users.get(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Allowed fields for update
      const allowedFields = ['name', 'phone', 'farmName', 'location', 'profile'];
      const filteredUpdates = {};

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          if (field === 'profile') {
            filteredUpdates[field] = { ...user.profile, ...updates[field] };
          } else {
            filteredUpdates[field] = updates[field];
          }
        }
      }

      // Update user
      const updatedUser = {
        ...user,
        ...filteredUpdates,
        updatedAt: new Date().toISOString()
      };

      users.set(userId, updatedUser);

      logger.info('User profile updated', { 
        userId,
        updatedFields: Object.keys(filteredUpdates) 
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: sanitizeUser(updatedUser)
      });

    } catch (error) {
      logger.error('Profile update failed', { 
        error: error.message,
        userId: req.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Profile update failed. Please try again.'
      });
    }
  },

  // Change password
  async changePassword(req, res) {
    try {
      const userId = req.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long'
        });
      }

      // Get current user
      const user = users.get(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);

      // Update user
      const updatedUser = {
        ...user,
        password: hashedNewPassword,
        updatedAt: new Date().toISOString()
      };

      users.set(userId, updatedUser);

      // Invalidate all refresh tokens for this user (force re-login on all devices)
      for (const [refreshToken, tokenData] of refreshTokens) {
        if (tokenData.userId === userId) {
          refreshTokens.delete(refreshToken);
        }
      }

      // Remove all device sessions for this user
      for (const [deviceId, session] of deviceSessions) {
        if (session.userId === userId) {
          deviceSessions.delete(deviceId);
        }
      }

      logger.info('Password changed successfully', { userId });

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.'
      });

    } catch (error) {
      logger.error('Password change failed', { 
        error: error.message,
        userId: req.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Password change failed. Please try again.'
      });
    }
  },

  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.userId;
      const user = users.get(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user: sanitizeUser(user)
      });

    } catch (error) {
      logger.error('Get profile failed', { 
        error: error.message,
        userId: req.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  },

  // Get user statistics
  async getStats(req, res) {
    try {
      const totalUsers = users.size;
      const activeUsers = Array.from(users.values()).filter(user => user.isActive).length;
      const activeSessions = deviceSessions.size;
      const activeTokens = refreshTokens.size;

      res.json({
        success: true,
        stats: {
          totalUsers,
          activeUsers,
          activeSessions,
          activeTokens,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Get stats failed', { error: error.message });

      res.status(500).json({
        success: false,
        message: 'Failed to get statistics'
      });
    }
  }
};

// Initialize test users
async function initializeTestUsers() {
  try {
    console.log('[AUTH] Initializing test users...');
    
    // Create test user 1
    const testUser1Password = await hashPassword('password123');
    const testUser1 = {
      id: 'test_user_1',
      name: 'Test User',
      email: 'test@example.com',
      password: testUser1Password,
      phone: null,
      farmName: null,
      location: null,
      biometricEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true,
      emailVerified: false,
      profile: {
        avatar: null,
        profilePicture: null,
        preferences: {
          notifications: true,
          darkMode: false,
          language: 'en',
          units: 'metric'
        }
      }
    };
    
    // Create test user 2
    const testUser2Password = await hashPassword('demo123');
    const testUser2 = {
      id: 'demo_user_1',
      name: 'Demo User',
      email: 'demo@krishiveda.com',
      password: testUser2Password,
      phone: null,
      farmName: null,
      location: null,
      biometricEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true,
      emailVerified: false,
      profile: {
        avatar: null,
        profilePicture: null,
        preferences: {
          notifications: true,
          darkMode: false,
          language: 'en',
          units: 'metric'
        }
      }
    };
    
    users.set('test_user_1', testUser1);
    users.set('demo_user_1', testUser2);
    
    console.log('[AUTH] ✅ Test users created:');
    console.log('[AUTH]   - test@example.com / password123');
    console.log('[AUTH]   - demo@krishiveda.com / demo123');
    console.log(`[AUTH] Total users in database: ${users.size}`);
    
    return true;
  } catch (error) {
    console.error('[AUTH] Failed to initialize test users:', error);
    return false;
  }
}

// Initialize test users on startup
initializeTestUsers();

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  // Clean up expired refresh tokens
  for (const [token, data] of refreshTokens) {
    if (now - data.createdAt > oneWeek) {
      refreshTokens.delete(token);
    }
  }

  // Clean up expired device sessions
  for (const [deviceId, session] of deviceSessions) {
    if (now - session.lastActive > oneWeek) {
      deviceSessions.delete(deviceId);
    }
  }
}, 24 * 60 * 60 * 1000); // Run daily

module.exports = {
  AuthController,
  authLimiter,
  loginLimiter,
  verifyToken
};
