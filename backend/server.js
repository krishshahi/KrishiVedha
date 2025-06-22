const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Farm = require('./models/Farm');
const Crop = require('./models/Crop');
const WeatherData = require('./models/WeatherData');
const CommunityPost = require('./models/Community');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agriculture-app';

// In-memory storage for testing (fallback if MongoDB fails)
const inMemoryUsers = [];
const inMemoryFarms = [];

// Connect to MongoDB with fallback
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB successfully');
  
  // Create test user if database is empty
  User.countDocuments().then(count => {
    if (count === 0) {
      const testUser = new User({
        username: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: '1234567890',
          address: 'Test Location',
          profilePicture: ''
        }
      });
      testUser.save().then(() => {
        console.log('✅ Test user created: test@example.com / password123');
      }).catch(err => {
        console.error('Error creating test user:', err);
      });
    }
  }).catch(err => console.log('Could not check user count:', err));
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  console.log('📦 Falling back to in-memory storage for testing');
  
  // Add test user to in-memory storage
  const bcrypt = require('bcryptjs');
  bcrypt.hash('password123', 10).then(hashedPassword => {
    inMemoryUsers.push({
      _id: '507f1f77bcf86cd799439011',
      username: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      location: 'Test Location',
      phone: '1234567890',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Test user created in memory: test@example.com / password123');
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// Get all farms
app.get('/api/farms', async (req, res) => {
  try {
    const { userId } = req.query;
    let query = {};
    
    if (userId) {
      query.owner = userId;
    }
    
    const farms = await Farm.find(query).populate('owner', 'username email');
    
    // Convert to API format for backward compatibility
    const formattedFarms = farms.map(farm => ({
      id: farm._id.toString(),
      userId: farm.owner._id.toString(),
      name: farm.name,
      location: farm.location.address || farm.location,
      area: farm.size?.value || 0,
      crops: farm.crops?.map(crop => crop.name) || [],
      createdAt: farm.createdAt,
      updatedAt: farm.updatedAt
    }));
    
    res.json({
      success: true,
      data: formattedFarms
    });
  } catch (error) {
    console.error('Error fetching farms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farms'
    });
  }
});

// Get farm by ID
app.get('/api/farms/:id', async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id).populate('owner', 'username email');
    
    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }
    
    const formattedFarm = {
      id: farm._id.toString(),
      userId: farm.owner._id.toString(),
      name: farm.name,
      location: farm.location.address || farm.location,
      area: farm.size?.value || 0,
      crops: farm.crops?.map(crop => crop.name) || [],
      createdAt: farm.createdAt,
      updatedAt: farm.updatedAt
    };
    
    res.json({
      success: true,
      data: formattedFarm
    });
  } catch (error) {
    console.error('Error fetching farm:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch farm'
    });
  }
});

// Create new farm
app.post('/api/farms', async (req, res) => {
  try {
    const { userId, name, location, area, crops } = req.body;
    
    if (!userId || !name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, name, location'
      });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const newFarm = new Farm({
      name,
      location: {
        address: location
      },
      size: {
        value: area || 0,
        unit: 'hectares'
      },
      owner: userId,
      farmType: 'crop',
      crops: crops ? crops.map(crop => ({ name: crop })) : []
    });
    
    const savedFarm = await newFarm.save();
    await savedFarm.populate('owner', 'username email');
    
    const formattedFarm = {
      id: savedFarm._id.toString(),
      userId: savedFarm.owner._id.toString(),
      name: savedFarm.name,
      location: savedFarm.location.address,
      area: savedFarm.size.value,
      crops: savedFarm.crops.map(crop => crop.name),
      createdAt: savedFarm.createdAt,
      updatedAt: savedFarm.updatedAt
    };
    
    res.status(201).json({
      success: true,
      data: formattedFarm,
      message: 'Farm created successfully'
    });
  } catch (error) {
    console.error('Error creating farm:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create farm'
    });
  }
});

// === CROP ENDPOINTS ===

// Get all crops
app.get('/api/crops', async (req, res) => {
  try {
    const { farmId, userId } = req.query;
    let query = { isActive: true };
    
    if (farmId) query.farm = farmId;
    if (userId) query.owner = userId;
    
    const crops = await Crop.find(query)
      .populate('farm', 'name location')
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: crops
    });
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crops'
    });
  }
});

// Get crop by ID
app.get('/api/crops/:id', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id)
      .populate('farm', 'name location')
      .populate('owner', 'username email');
    
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }
    
    res.json({
      success: true,
      data: crop
    });
  } catch (error) {
    console.error('Error fetching crop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crop'
    });
  }
});

// Create new crop
app.post('/api/crops', async (req, res) => {
  try {
    const { name, variety, farmId, ownerId, plantingDate, expectedHarvestDate, area } = req.body;
    
    if (!name || !farmId || !ownerId || !plantingDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, farmId, ownerId, plantingDate'
      });
    }
    
    // Verify farm and owner exist
    const [farm, owner] = await Promise.all([
      Farm.findById(farmId),
      User.findById(ownerId)
    ]);
    
    if (!farm || !owner) {
      return res.status(400).json({
        success: false,
        message: 'Farm or owner not found'
      });
    }
    
    const newCrop = new Crop({
      name,
      variety,
      farm: farmId,
      owner: ownerId,
      plantingDate: new Date(plantingDate),
      expectedHarvestDate: expectedHarvestDate ? new Date(expectedHarvestDate) : undefined,
      area: area || { value: 0, unit: 'acres' },
      status: 'planned'
    });
    
    const savedCrop = await newCrop.save();
    await savedCrop.populate(['farm', 'owner']);
    
    res.status(201).json({
      success: true,
      data: savedCrop,
      message: 'Crop created successfully'
    });
  } catch (error) {
    console.error('Error creating crop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create crop'
    });
  }
});

// Update crop
app.put('/api/crops/:id', async (req, res) => {
  try {
    const crop = await Crop.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate(['farm', 'owner']);
    
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }
    
    res.json({
      success: true,
      data: crop,
      message: 'Crop updated successfully'
    });
  } catch (error) {
    console.error('Error updating crop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update crop'
    });
  }
});

// Delete crop
app.delete('/api/crops/:id', async (req, res) => {
  try {
    const crop = await Crop.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Crop deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting crop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete crop'
    });
  }
});

// === WEATHER ENDPOINTS ===

// Get weather data
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lng, farmId } = req.query;
    let query = {};
    
    if (farmId) {
      query.farm = farmId;
    } else if (lat && lng) {
      // Find weather data near coordinates
      const weatherData = await WeatherData.findByLocation(parseFloat(lat), parseFloat(lng));
      return res.json({
        success: true,
        data: weatherData
      });
    }
    
    const weatherData = await WeatherData.find(query)
      .populate('farm', 'name location')
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weather data'
    });
  }
});

// === COMMUNITY ENDPOINTS ===

// Get community posts
app.get('/api/community/posts', async (req, res) => {
  try {
    const { category, userId, limit = 20, page = 1 } = req.query;
    let query = { isActive: true };
    
    if (category) query.category = category;
    if (userId) query.author = userId;
    
    const posts = await CommunityPost.find(query)
      .populate('author', 'username profile.firstName profile.lastName')
      .populate('comments.author', 'username')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch community posts'
    });
  }
});

// Create community post
app.post('/api/community/posts', async (req, res) => {
  try {
    const { title, content, category, authorId, tags } = req.body;
    
    if (!title || !content || !category || !authorId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, content, category, authorId'
      });
    }
    
    // Verify author exists
    const author = await User.findById(authorId);
    if (!author) {
      return res.status(400).json({
        success: false,
        message: 'Author not found'
      });
    }
    
    const newPost = new CommunityPost({
      title,
      content,
      category,
      author: authorId,
      tags: tags || []
    });
    
    const savedPost = await newPost.save();
    await savedPost.populate('author', 'username profile.firstName profile.lastName');
    
    res.status(201).json({
      success: true,
      data: savedPost,
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Error creating community post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
});

// Update farm
app.put('/api/farms/:id', async (req, res) => {
  try {
    const farm = await Farm.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('owner', 'username email');
    
    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }
    
    const formattedFarm = {
      id: farm._id.toString(),
      userId: farm.owner._id.toString(),
      name: farm.name,
      location: farm.location.address,
      area: farm.size.value,
      crops: farm.crops.map(crop => crop.name),
      createdAt: farm.createdAt,
      updatedAt: farm.updatedAt
    };
    
    res.json({
      success: true,
      data: formattedFarm,
      message: 'Farm updated successfully'
    });
  } catch (error) {
    console.error('Error updating farm:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update farm'
    });
  }
});

// Delete farm
app.delete('/api/farms/:id', async (req, res) => {
  try {
    const farm = await Farm.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Farm deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting farm:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete farm'
    });
  }
});

// Authentication endpoints

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, location, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    // Create new user (password will be hashed automatically by the User model pre-save hook)
    const newUser = new User({
      username: name,
      email,
      password, // Don't hash here, let the model do it
      profile: {
        firstName: name.split(' ')[0] || '',
        lastName: name.split(' ').slice(1).join(' ') || '',
        phoneNumber: phone || '',
        address: location || '',
        profilePicture: ''
      }
    });
    
    const savedUser = await newUser.save();
    
    // Generate JWT token
    const token = jwt.sign({ 
      userId: savedUser._id.toString(), 
      email: savedUser.email 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    // Format user response (exclude password)
    const userResponse = {
      id: savedUser._id.toString(),
      name: savedUser.username,
      email: savedUser.email,
      location: savedUser.profile?.address || '',
      phone: savedUser.profile?.phoneNumber || '',
      joinDate: savedUser.createdAt.toISOString().split('T')[0],
      farmCount: 0,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    };
    
    res.status(201).json({
      success: true,
      token,
      user: userResponse,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Login attempt:', { email, passwordLength: password?.length });
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    let user;
    let isValidPassword = false;
    let usingInMemory = false;
    
    try {
      // Try MongoDB first
      console.log('🔍 Trying MongoDB...');
      user = await User.findOne({ email });
      console.log('🔍 MongoDB user found:', !!user);
      if (user) {
        isValidPassword = await user.comparePassword(password);
        console.log('🔍 MongoDB password valid:', isValidPassword);
      }
    } catch (mongoError) {
      // Fall back to in-memory storage
      console.log('📦 MongoDB failed, using in-memory storage');
      console.log('📦 In-memory users count:', inMemoryUsers.length);
      console.log('📦 In-memory users:', inMemoryUsers.map(u => ({ email: u.email, hasPassword: !!u.password })));
      
      usingInMemory = true;
      user = inMemoryUsers.find(u => u.email === email);
      console.log('📦 In-memory user found:', !!user);
      if (user) {
        isValidPassword = await bcrypt.compare(password, user.password);
        console.log('📦 In-memory password valid:', isValidPassword);
      }
    }
    
    console.log('🔍 Final result:', { userFound: !!user, passwordValid: isValidPassword, usingInMemory });
    
    if (!user || !isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign({ 
      userId: user._id ? user._id.toString() : user._id, 
      email: user.email 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    // Format user response (exclude password)
    const userResponse = {
      id: user._id ? user._id.toString() : user._id,
      name: user.username,
      email: user.email,
      location: user.profile?.address || user.location || '',
      phone: user.profile?.phoneNumber || user.phone || '',
      joinDate: user.createdAt ? user.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      farmCount: 0, // For in-memory users
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date()
    };
    
    res.json({
      success: true,
      token,
      user: userResponse,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Protected route example
app.get('/api/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth verification endpoint
app.post('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    userId: req.user.userId
  });
});

// User stats endpoint for dashboard
app.get('/api/users/:id/stats', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get farm count and total area
    const farms = await Farm.find({ owner: userId, isActive: { $ne: false } });
    const farmCount = farms.length;
    const totalArea = farms.reduce((sum, farm) => sum + (farm.size?.value || 0), 0);
    
    // Get unique crop types
    const cropTypes = [...new Set(farms.flatMap(farm => 
      farm.crops?.map(crop => crop.name) || []
    ))];
    
    res.json({
      success: true,
      data: {
        farmCount,
        totalArea,
        cropTypes
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
});

// Get user farms endpoint
app.get('/api/users/:id/farms', async (req, res) => {
  try {
    const userId = req.params.id;
    
    const farms = await Farm.find({ owner: userId, isActive: { $ne: false } })
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });
    
    // Convert to API format for backward compatibility
    const formattedFarms = farms.map(farm => ({
      id: farm._id.toString(),
      userId: farm.owner._id.toString(),
      name: farm.name,
      location: farm.location.address || farm.location,
      area: farm.size?.value || 0,
      crops: farm.crops?.map(crop => crop.name) || [],
      createdAt: farm.createdAt,
      updatedAt: farm.updatedAt
    }));
    
    res.json({
      success: true,
      data: formattedFarms
    });
  } catch (error) {
    console.error('Error fetching user farms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user farms'
    });
  }
});

// Update user profile endpoint
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    
    // Remove sensitive fields
    delete updateData.password;
    delete updateData._id;
    delete updateData.id;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Format user response
    const userResponse = {
      id: user._id.toString(),
      name: user.username,
      email: user.email,
      location: user.location,
      phone: user.phone,
      joinDate: user.createdAt.toISOString().split('T')[0],
      farmCount: await Farm.countDocuments({ owner: user._id }),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json({
      success: true,
      data: userResponse,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Agriculture API Server running on port ${PORT}`);
  console.log(`📱 Mobile app can connect to: http://10.0.0.150:${PORT}/api`);
  console.log(`🌐 Web app can connect to: http://192.168.1.89:${PORT}/api`);
  console.log('');
  console.log('📊 Available endpoints:');
  console.log('  POST /api/auth/register - User registration');
  console.log('  POST /api/auth/login - User login');
  console.log('  POST /api/auth/verify - Verify JWT token');
  console.log('  GET  /api/health - Health check');
  console.log('  GET  /api/users - Get all users');
  console.log('  GET  /api/users/:id - Get user by ID');
  console.log('  PUT  /api/users/:id - Update user profile');
  console.log('  GET  /api/users/:id/stats - Get user statistics');
  console.log('  GET  /api/users/:id/farms - Get farms by user');
  console.log('  GET  /api/farms - Get all farms');
  console.log('  POST /api/farms - Create new farm');
  console.log('  PUT  /api/farms/:id - Update farm');
  console.log('  DELETE /api/farms/:id - Delete farm');
  console.log('  GET  /api/crops - Get all crops');
  console.log('  POST /api/crops - Create new crop');
  console.log('  GET  /api/weather - Get weather data');
  console.log('  GET  /api/community/posts - Get community posts');
  console.log('  POST /api/community/posts - Create community post');
  console.log('');
});

module.exports = app;
