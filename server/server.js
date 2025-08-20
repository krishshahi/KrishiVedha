const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

// Import dynamic configuration
const CONFIG = require('../config/app.config.js');

// Import models
const User = require('./models/User');
const Farm = require('./models/Farm');
const Crop = require('./models/Crop');
const WeatherData = require('./models/WeatherData');
const CommunityPost = require('./models/Community');

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const app = express();
const PORT = CONFIG.server.port;
const JWT_SECRET = CONFIG.auth.jwtSecret;
const MONGODB_URI = CONFIG.database.uri;

// Log configuration for debugging
console.log('🔧 Server Configuration:', {
  port: PORT,
  host: CONFIG.server.host,
  ip: CONFIG.server.ip,
  database: MONGODB_URI,
  environment: CONFIG.app.environment,
  features: Object.keys(CONFIG.features).filter(key => CONFIG.features[key]),
});

// In-memory storage for testing (fallback if MongoDB fails)
const inMemoryUsers = [];
const inMemoryFarms = [];

// Connect to MongoDB with dynamic configuration
mongoose.connect(MONGODB_URI, CONFIG.database.options)
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

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// API Routes

// ===== IMAGE UPLOAD APIs =====

// Upload single image
app.post('/api/upload/image', (req, res) => {
  try {
    console.log('📤 Image upload request received');
    console.log('📤 Content-Type:', req.headers['content-type']);
    console.log('📤 Request body keys:', Object.keys(req.body));

    // Check if this is a base64 upload (from React Native)
    if (req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('data:image')) {
      console.log('📤 Detected base64 image upload');
      return handleBase64ImageUpload(req, res);
    }
    
    // Otherwise, handle as multipart/form-data with multer
    upload.single('image')(req, res, (multerError) => {
      try {
        if (multerError) {
          console.error('📤 Multer error:', multerError);
          return res.status(400).json({
            success: false,
            message: `Upload error: ${multerError.message}`
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'No image file provided'
          });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        
        res.json({
          success: true,
          data: {
            url: imageUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimeType: req.file.mimetype
          },
          message: 'Image uploaded successfully'
        });
      } catch (error) {
        console.error('Error in multer upload handler:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
});

// Upload multiple images
app.post('/api/upload/images', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    const uploadedImages = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype
    }));
    
    res.json({
      success: true,
      data: uploadedImages,
      message: `${uploadedImages.length} images uploaded successfully`
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images'
    });
  }
});

// Add image to crop with React Native FormData handling
app.post('/api/crops/:id/images', (req, res) => {
  // Log raw request details first
  console.log('🔍 ===== RAW REQUEST DETAILS =====');
  console.log('🔍 Method:', req.method);
  console.log('🔍 URL:', req.url);
  console.log('🔍 Content-Type:', req.headers['content-type']);
  console.log('🔍 Content-Length:', req.headers['content-length']);
  
  // Check if this is a React Native FormData request
  // React Native often sends FormData as JSON, so we need to check for that
  const contentType = req.headers['content-type'] || '';
  const isReactNativeFormData = (
    contentType.includes('application/json') ||
    contentType.includes('multipart/form-data')
  ) && req.body && typeof req.body.image === 'object' && req.body.image.uri;
  
  console.log('🔍 Content-Type:', contentType);
  console.log('🔍 Request body type:', typeof req.body);
  console.log('🔍 Has image in body:', !!req.body?.image);
  console.log('🔍 Image has uri:', !!req.body?.image?.uri);
  
  if (isReactNativeFormData) {
    console.log('🔍 Detected React Native FormData format');
    handleReactNativeImageUpload(req, res);
  } else {
    console.log('🔍 Using standard multer processing');
    // Apply multer middleware for standard uploads
    upload.single('image')(req, res, async (multerError) => {
      try {
        console.log('🔍 ===== AFTER MULTER PROCESSING =====');
        console.log('🔍 Multer error:', multerError);
        console.log('🔍 req.file:', req.file);
        console.log('🔍 req.body:', req.body);
        console.log('🔍 req.body keys:', Object.keys(req.body));
        
        if (multerError) {
          console.log('❌ Multer error occurred:', multerError);
          return res.status(400).json({
            success: false,
            message: `Upload error: ${multerError.message}`
          });
        }
        
        await handleStandardImageUpload(req, res);
      } catch (error) {
        console.error('Error in standard upload handler:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to add image to crop'
        });
      }
    });
  }
});

// Handler for base64 image uploads
async function handleBase64ImageUpload(req, res) {
  try {
    console.log('📤 Processing base64 image upload');
    console.log('📤 Request body keys:', Object.keys(req.body));
    
    const { image, filename } = req.body;
    
    console.log('📤 Image data type:', typeof image);
    console.log('📤 Image data length:', image ? image.length : 0);
    console.log('📤 Image starts with data:image:', image ? image.startsWith('data:image') : false);
    
    if (!image) {
      console.error('📤 No image provided in request body');
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    if (typeof image !== 'string') {
      console.error('📤 Image is not a string, type:', typeof image);
      return res.status(400).json({
        success: false,
        message: 'Image data must be a base64 string'
      });
    }
    
    if (!image.startsWith('data:image')) {
      console.error('📤 Image does not start with data:image, starts with:', image.substring(0, 20));
      return res.status(400).json({
        success: false,
        message: 'Invalid base64 image data format'
      });
    }
    
    try {
      // Extract base64 data and MIME type
      const [mimeTypePart, base64Data] = image.split(',');
      
      if (!base64Data) {
        console.error('📤 No base64 data found after splitting');
        return res.status(400).json({
          success: false,
          message: 'Invalid base64 format - no data found'
        });
      }
      
      const mimeTypeMatch = mimeTypePart.match(/data:([^;]+)/);
      if (!mimeTypeMatch) {
        console.error('📤 Could not extract MIME type from:', mimeTypePart);
        return res.status(400).json({
          success: false,
          message: 'Invalid MIME type in base64 data'
        });
      }
      
      const mimeType = mimeTypeMatch[1];
      const extension = mimeType.split('/')[1] || 'jpg';
      
      console.log('📤 Extracted MIME type:', mimeType);
      console.log('📤 Extracted extension:', extension);
      console.log('📤 Base64 data length:', base64Data.length);
      
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const finalFilename = filename || `image-${uniqueSuffix}.${extension}`;
      const filepath = path.join(uploadsDir, finalFilename);
      
      // Convert base64 to buffer and save
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Validate buffer size
      if (buffer.length === 0) {
        console.error('📤 Buffer is empty after base64 conversion');
        return res.status(400).json({
          success: false,
          message: 'Invalid base64 data - empty buffer'
        });
      }
      
      console.log('📤 Buffer size:', buffer.length, 'bytes');
      
      // Save file
      fs.writeFileSync(filepath, buffer);
      
      const imageUrl = `/uploads/${finalFilename}`;
      const fileSize = buffer.length;
      
      console.log('📤 Base64 image saved successfully to:', filepath);
      console.log('📤 File size:', fileSize, 'bytes');
      console.log('📤 Image URL:', imageUrl);
      
      res.json({
        success: true,
        data: {
          url: imageUrl,
          filename: finalFilename,
          originalName: filename || finalFilename,
          size: fileSize,
          mimeType: mimeType
        },
        message: 'Base64 image uploaded successfully'
      });
      
    } catch (processingError) {
      console.error('📤 Error processing base64 data:', processingError);
      return res.status(400).json({
        success: false,
        message: `Failed to process base64 data: ${processingError.message}`
      });
    }
    
  } catch (error) {
    console.error('📤 General error in base64 image upload:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during image upload'
    });
  }
}

// Handler for React Native FormData uploads
async function handleReactNativeImageUpload(req, res) {
  try {
    const cropId = req.params.id;
    const { caption, stage } = req.body;
    const imageData = req.body.image;
    
    console.log('🔍 React Native image data:', imageData);
    
    if (!imageData || !imageData.uri) {
      console.log('❌ No image data found in React Native request');
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }
    
    // Check if the image data contains base64 encoded data
    let imageUrl = '/uploads/placeholder.jpg'; // Default placeholder
    let filename = `crop-${cropId}-${Date.now()}.jpg`;
    
    if (imageData.uri) {
      if (imageData.uri.startsWith('data:')) {
        // Handle base64 encoded image data
        try {
          const base64Data = imageData.uri.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Generate unique filename
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          filename = `crop-image-${uniqueSuffix}.jpg`;
          const filepath = path.join(uploadsDir, filename);
          
          // Write file to uploads directory
          fs.writeFileSync(filepath, buffer);
          imageUrl = `/uploads/${filename}`;
          
          console.log('✅ Base64 image saved to:', filepath);
        } catch (saveError) {
          console.error('❌ Error saving base64 image:', saveError);
          imageUrl = imageData.uri; // Fallback to original URI
        }
      } else if (imageData.uri.startsWith('file://')) {
        // For React Native file:// URIs, we can't access the actual file from the server
        // We'll create a placeholder and log this for debugging
        console.log('⚠️  Warning: React Native file:// URI detected, using placeholder');
        console.log('⚠️  Original URI:', imageData.uri);
        
        // Create a placeholder image URL that indicates this is a React Native local file
        imageUrl = `/uploads/rn-placeholder-${Date.now()}.jpg`;
        
        // Create a simple placeholder file
        const placeholderPath = path.join(uploadsDir, path.basename(imageUrl));
        try {
          // Create a minimal 1x1 pixel JPEG as placeholder
          const minimalJpeg = Buffer.from([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11,
            0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xFF, 0xC4, 0x00, 0x14, 0x00,
            0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C, 0x03, 0x01, 0x00, 0x02, 0x11,
            0x03, 0x11, 0x00, 0x3F, 0x00, 0x00, 0xFF, 0xD9
          ]);
          fs.writeFileSync(placeholderPath, minimalJpeg);
          console.log('✅ Placeholder image created at:', placeholderPath);
        } catch (placeholderError) {
          console.error('❌ Error creating placeholder:', placeholderError);
        }
      } else {
        // Handle HTTP URLs or other formats
        imageUrl = imageData.uri;
      }
    }
    
    const newImage = {
      url: imageUrl,
      caption: caption || '',
      stage: stage || crop.growthStage,
      uploadDate: new Date(),
      filename: filename
    };
    
    crop.images.push(newImage);
    const savedCrop = await crop.save();
    
    // Get the saved image with its MongoDB-generated _id
    const savedImage = savedCrop.images[savedCrop.images.length - 1];
    
    console.log('✅ React Native image upload successful');
    console.log('✅ Saved image URL:', savedImage.url);
    
    res.json({
      success: true,
      data: {
        id: savedImage._id,
        url: savedImage.url,
        caption: savedImage.caption,
        stage: savedImage.stage,
        uploadDate: savedImage.uploadDate,
        filename: savedImage.filename,
        uploadedAt: savedImage.uploadDate
      },
      message: 'Image added to crop successfully'
    });
  } catch (error) {
    console.error('Error in React Native image upload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add image to crop'
    });
  }
}

// Handler for standard multer uploads
async function handleStandardImageUpload(req, res) {
  const cropId = req.params.id;
  const { caption, stage } = req.body;

  if (!req.file) {
    console.log('❌ No file found in standard request');
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }

  const crop = await Crop.findById(cropId);
  if (!crop) {
    return res.status(404).json({
      success: false,
      message: 'Crop not found'
    });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const newImage = {
    url: imageUrl,
    caption: caption || '',
    stage: stage || crop.growthStage,
    uploadDate: new Date(),
    filename: req.file.filename
  };

  crop.images.push(newImage);
  const savedCrop = await crop.save();
  
  // Get the saved image with its MongoDB-generated _id
  const savedImage = savedCrop.images[savedCrop.images.length - 1];
  
  console.log('✅ Standard image upload successful');
  
  res.json({
    success: true,
    data: {
      id: savedImage._id,
      url: savedImage.url,
      caption: savedImage.caption,
      stage: savedImage.stage,
      uploadDate: savedImage.uploadDate,
      filename: savedImage.filename,
      uploadedAt: savedImage.uploadDate
    },
    message: 'Image added to crop successfully'
  });
}

// Get crop images
app.get('/api/crops/:id/images', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Format images with consistent field names
    const formattedImages = crop.images.map(image => ({
      id: image._id,
      url: image.url,
      caption: image.caption,
      stage: image.stage,
      uploadDate: image.uploadDate,
      filename: image.filename,
      uploadedAt: image.uploadDate
    }));

    res.json({
      success: true,
      data: formattedImages
    });
  } catch (error) {
    console.error('Error fetching crop images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crop images'
    });
  }
});

// Delete crop image
app.delete('/api/crops/:cropId/images/:imageId', async (req, res) => {
  try {
    const { cropId, imageId } = req.params;

    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    const imageIndex = crop.images.findIndex(img => img._id.toString() === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const image = crop.images[imageIndex];
    const imagePath = path.join(uploadsDir, path.basename(image.url));

    // Delete file from filesystem
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Remove from database
    crop.images.splice(imageIndex, 1);
    await crop.save();

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting crop image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete crop image'
    });
  }
});

// ===== ACTIVITY MANAGEMENT APIs =====

// Get crop activities
app.get('/api/crops/:id/activities', async (req, res) => {
  try {
    const crop = await Crop.findById(req.params.id)
      .populate('activities.createdBy', 'username email');
    
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Sort activities by date (most recent first)
    const sortedActivities = crop.activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(activity => ({
        id: activity._id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        date: activity.date,
        metadata: activity.metadata,
        images: activity.images,
        createdBy: activity.createdBy
      }));

    // Debug: Log activity IDs (can be removed in production)
    console.log('📋 Returning', sortedActivities.length, 'activities');
    // sortedActivities.forEach((activity, index) => {
    //   console.log(`  ${index + 1}. ID: ${activity.id} (type: ${typeof activity.id}) - ${activity.type}`);
    // });

    res.json({
      success: true,
      data: sortedActivities
    });
  } catch (error) {
    console.error('Error fetching crop activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crop activities'
    });
  }
});

// Add activity to crop
app.post('/api/crops/:id/activities', async (req, res) => {
  try {
    const cropId = req.params.id;
    const { type, title, description, date, metadata, images, createdBy } = req.body;

    console.log('🔍 Adding activity to crop:', cropId);
    console.log('🔍 Activity data:', { type, title, description, date, metadata, images, createdBy });

    if (!type || !title) {
      console.log('❌ Missing required fields:', { type, title });
      return res.status(400).json({
        success: false,
        message: 'Activity type and title are required'
      });
    }

    const crop = await Crop.findById(cropId);
    if (!crop) {
      console.log('❌ Crop not found:', cropId);
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    console.log('✅ Crop found:', crop.name);

    const newActivity = {
      type,
      title,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      metadata: metadata || {},
      images: images || [],
      createdBy: createdBy || crop.owner
    };

    console.log('🔍 New activity object:', newActivity);

    crop.activities.push(newActivity);
    console.log('🔍 Activity added to crop, saving...');
    
    const savedCrop = await crop.save();
    console.log('✅ Crop saved successfully');
    
    // Get the saved activity with its MongoDB-generated _id
    const savedActivity = savedCrop.activities[savedCrop.activities.length - 1];
    
    // Auto-update irrigation info if it's a watering activity
    if (type === 'watering') {
      crop.irrigation.lastWatered = newActivity.date;
      if (metadata.amount) {
        crop.irrigation.waterAmount = metadata.amount;
      }
      await crop.save();
    }
    
    // Auto-update growth stage if it's a stage change activity
    if (type === 'stage_change' && metadata.newStage) {
      crop.growthStage = metadata.newStage;
      await crop.save();
    }

    // Populate the created by field for response
    await crop.populate('activities.createdBy', 'username email');
    const populatedActivity = crop.activities.find(act => 
      act._id.toString() === savedActivity._id.toString()
    );

    res.status(201).json({
      success: true,
      data: {
        id: populatedActivity._id,
        type: populatedActivity.type,
        title: populatedActivity.title,
        description: populatedActivity.description,
        date: populatedActivity.date,
        metadata: populatedActivity.metadata,
        images: populatedActivity.images,
        createdBy: populatedActivity.createdBy
      },
      message: 'Activity added successfully'
    });
  } catch (error) {
    console.error('❌ Error adding crop activity:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('❌ Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation error: ' + validationErrors.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to add crop activity',
      error: error.message
    });
  }
});

// Update activity
app.put('/api/crops/:cropId/activities/:activityId', async (req, res) => {
  try {
    const { cropId, activityId } = req.params;
    const updates = req.body;

    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    const activityIndex = crop.activities.findIndex(act => 
      act._id.toString() === activityId
    );
    
    if (activityIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Update activity fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== '_id') {
        crop.activities[activityIndex][key] = updates[key];
      }
    });

    await crop.save();
    await crop.populate('activities.createdBy', 'username email');

    const updatedActivity = crop.activities[activityIndex];

    res.json({
      success: true,
      data: {
        id: updatedActivity._id,
        type: updatedActivity.type,
        title: updatedActivity.title,
        description: updatedActivity.description,
        date: updatedActivity.date,
        metadata: updatedActivity.metadata,
        images: updatedActivity.images,
        createdBy: updatedActivity.createdBy
      },
      message: 'Activity updated successfully'
    });
  } catch (error) {
    console.error('Error updating crop activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update crop activity'
    });
  }
});

// Delete activity
app.delete('/api/crops/:cropId/activities/:activityId', async (req, res) => {
  try {
    const { cropId, activityId } = req.params;
    
    console.log('🗑️ Delete activity request:', { cropId, activityId });
    console.log('🗑️ Activity ID type:', typeof activityId);
    console.log('🗑️ Activity ID value:', activityId);

    if (!activityId || activityId === 'undefined') {
      console.log('❌ Invalid activity ID provided');
      return res.status(400).json({
        success: false,
        message: 'Valid activity ID is required'
      });
    }

    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    const activityIndex = crop.activities.findIndex(act => 
      act._id.toString() === activityId
    );
    
    if (activityIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    crop.activities.splice(activityIndex, 1);
    await crop.save();

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting crop activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete crop activity'
    });
  }
});

// ===== KNOWLEDGE BASE APIs =====

// Get knowledge categories
app.get('/api/knowledge/categories', async (req, res) => {
  try {
    // Mock data for knowledge categories
    const categories = [
      { id: '1', name: 'All', icon: '📚', description: 'All farming knowledge', articleCount: 25, color: '#4CAF50' },
      { id: '2', name: 'Crops', icon: '🌾', description: 'Crop cultivation techniques', articleCount: 8, color: '#FF9800' },
      { id: '3', name: 'Pests', icon: '🐛', description: 'Pest management and control', articleCount: 5, color: '#F44336' },
      { id: '4', name: 'Farming', icon: '🚜', description: 'General farming practices', articleCount: 7, color: '#2196F3' },
      { id: '5', name: 'Weather', icon: '🌦️', description: 'Weather and climate guidance', articleCount: 3, color: '#9C27B0' },
      { id: '6', name: 'Technology', icon: '📱', description: 'Modern farming technology', articleCount: 2, color: '#607D8B' }
    ];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching knowledge categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch knowledge categories'
    });
  }
});

// Get knowledge articles
app.get('/api/knowledge/articles', async (req, res) => {
  try {
    const { category, q: searchQuery } = req.query;
    
    // Mock data for knowledge articles
    let articles = [
      {
        id: '1',
        title: 'Natural Pest Management for Vegetable Crops',
        content: 'Comprehensive guide on managing pests using natural methods...',
        summary: 'Learn organic pest control methods that protect your vegetables without harmful chemicals.',
        category: 'Pests',
        author: 'Dr. Raj Kumar',
        authorId: 'author1',
        tags: ['organic', 'pest-control', 'vegetables'],
        readTime: 5,
        views: 245,
        likes: 18,
        isFeatured: false,
        imageUrl: '🐞',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        title: 'Understanding Weather Patterns for Better Crop Planning',
        content: 'Weather plays a crucial role in agricultural success...',
        summary: 'Master the art of reading weather patterns to optimize your planting and harvesting schedules.',
        category: 'Weather',
        author: 'Meteorologist Sita Sharma',
        authorId: 'author2',
        tags: ['weather', 'planning', 'climate'],
        readTime: 8,
        views: 189,
        likes: 22,
        isFeatured: true,
        imageUrl: '🌦️',
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        title: 'Soil Health: The Foundation of Successful Farming',
        content: 'Healthy soil is the cornerstone of productive agriculture...',
        summary: 'Understand soil composition, testing, and improvement techniques for optimal crop growth.',
        category: 'Farming',
        author: 'Soil Expert Maya Patel',
        authorId: 'author3',
        tags: ['soil', 'health', 'nutrients'],
        readTime: 6,
        views: 312,
        likes: 35,
        isFeatured: false,
        imageUrl: '🌿',
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        title: 'Modern Irrigation Techniques for Water Conservation',
        content: 'Water scarcity makes efficient irrigation crucial...',
        summary: 'Explore drip irrigation, sprinkler systems, and smart watering technologies.',
        category: 'Technology',
        author: 'Engineer Anil Thapa',
        authorId: 'author4',
        tags: ['irrigation', 'water', 'technology'],
        readTime: 7,
        views: 156,
        likes: 14,
        isFeatured: false,
        imageUrl: '💧',
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Filter by category if specified
    if (category && category !== 'All') {
      articles = articles.filter(article => article.category === category);
    }
    
    // Filter by search query if specified
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    res.json({
      success: true,
      data: articles
    });
  } catch (error) {
    console.error('Error fetching knowledge articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch knowledge articles'
    });
  }
});

// Get trending topics
app.get('/api/knowledge/trending', async (req, res) => {
  try {
    const trendingTopics = [
      {
        id: '1',
        title: 'Monsoon Farming',
        icon: '🌧️',
        category: 'Weather',
        articleCount: 12,
        popularity: 95,
        description: 'Essential techniques for monsoon season farming'
      },
      {
        id: '2',
        title: 'Organic Farming',
        icon: '🌱',
        category: 'Farming',
        articleCount: 18,
        popularity: 88,
        description: 'Sustainable organic farming practices'
      },
      {
        id: '3',
        title: 'Farm Equipment',
        icon: '🚜',
        category: 'Technology',
        articleCount: 8,
        popularity: 76,
        description: 'Modern farming tools and machinery'
      },
      {
        id: '4',
        title: 'Irrigation',
        icon: '💧',
        category: 'Technology',
        articleCount: 15,
        popularity: 82,
        description: 'Water management and irrigation systems'
      }
    ];
    
    res.json({
      success: true,
      data: trendingTopics
    });
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending topics'
    });
  }
});

// Get video tutorials
app.get('/api/knowledge/videos', async (req, res) => {
  try {
    const videoTutorials = [
      {
        id: '1',
        title: 'How to Prepare Soil for Rice Planting',
        description: 'Step-by-step guide to preparing paddy fields for rice cultivation',
        category: 'Crops',
        author: 'AgriTech Nepal',
        authorId: 'channel1',
        duration: '12:34',
        views: 15420,
        likes: 342,
        thumbnailUrl: '🌾',
        videoUrl: 'https://example.com/video1',
        tags: ['rice', 'soil-preparation', 'tutorial'],
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        title: 'Natural Pesticides for Vegetable Gardens',
        description: 'Learn to make effective organic pesticides using common household items',
        category: 'Pests',
        author: 'Organic Farming Nepal',
        authorId: 'channel2',
        duration: '8:45',
        views: 8230,
        likes: 156,
        thumbnailUrl: '🐛',
        videoUrl: 'https://example.com/video2',
        tags: ['organic', 'pesticides', 'vegetables'],
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        title: 'Setting Up Drip Irrigation System',
        description: 'Complete tutorial on installing a cost-effective drip irrigation system',
        category: 'Technology',
        author: 'Smart Farming Hub',
        authorId: 'channel3',
        duration: '15:22',
        views: 12750,
        likes: 298,
        thumbnailUrl: '💧',
        videoUrl: 'https://example.com/video3',
        tags: ['irrigation', 'technology', 'water-saving'],
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: videoTutorials
    });
  } catch (error) {
    console.error('Error fetching video tutorials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video tutorials'
    });
  }
});

// ===== USER MANAGEMENT APIs =====

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
app.get('/api/farms', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    const requestedUserId = userId || req.user?.userId;
    
    console.log('🏡 === FARMS ENDPOINT DEBUG ===');
    console.log('🏡 Request headers authorization:', req.headers.authorization);
    console.log('🏡 req.user object:', JSON.stringify(req.user, null, 2));
    console.log('🏡 req.user?.userId:', req.user?.userId);
    console.log('🏡 Farms request:', {
      userId,
      requestedUserId,
      authenticatedUser: req.user?.userId
    });
    
    // SECURITY: Always require user authentication and filter by user
    if (!requestedUserId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required to access farms'
      });
    }
    
    // Build query with mandatory user filtering
    let query = { 
      isActive: { $ne: false }, // Exclude soft-deleted farms
      owner: requestedUserId  // Always filter by user to prevent data leakage
    };
    
    console.log('🔍 Farms query:', query);
    
    const farms = await Farm.find(query).populate('owner', 'username email');
    
    console.log(`✅ Found ${farms.length} farms for user ${requestedUserId}`);
    
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
        address: location,
        coordinates: {
          type: 'Point',
          coordinates: [0, 0] // Default coordinates, can be updated later
        }
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
app.get('/api/crops', authenticateToken, async (req, res) => {
  try {
    const { farmId, userId } = req.query;
    const requestedUserId = userId || req.user?.userId;
    
    console.log('🔒 === CROPS ENDPOINT DEBUG ===');
    console.log('🔒 Request headers authorization:', req.headers.authorization);
    console.log('🔒 req.user object:', JSON.stringify(req.user, null, 2));
    console.log('🔒 req.user?.userId:', req.user?.userId);
    console.log('🌾 Crops request:', {
      farmId,
      userId,
      requestedUserId,
      authenticatedUser: req.user?.userId
    });
    
    // SECURITY: Always require user authentication and filter by user
    if (!requestedUserId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required to access crops'
      });
    }
    
    // Build query with mandatory user filtering
    let query = { 
      isActive: true,
      owner: requestedUserId  // Always filter by user to prevent data leakage
    };
    
    // Add farm filter if specified
    if (farmId) {
      query.farm = farmId;
    }
    
    console.log('🔍 Crops query:', query);
    
    const crops = await Crop.find(query)
      .populate('farm', 'name location')
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${crops.length} crops for user ${requestedUserId}`);
    
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

// Get community post by ID
app.get('/api/community/posts/:id', async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
      .populate('author', 'username profile.firstName profile.lastName')
      .populate('comments.author', 'username');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('Error fetching community post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post'
    });
  }
});

// Update community post
app.put('/api/community/posts/:id', async (req, res) => {
  try {
    const post = await CommunityPost.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('author', 'username profile.firstName profile.lastName');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    res.json({
      success: true,
      data: post,
      message: 'Post updated successfully'
    });
  } catch (error) {
    console.error('Error updating community post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post'
    });
  }
});

// Delete community post
app.delete('/api/community/posts/:id', async (req, res) => {
  try {
    const post = await CommunityPost.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting community post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
});

// Like a community post
app.post('/api/community/posts/:id/like', async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?.userId || req.body.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required'
      });
    }
    
    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    await post.addLike(userId);
    
    res.json({
      success: true,
      data: { likes: post.likesCount },
      message: 'Post liked successfully'
    });
  } catch (error) {
    console.error('Error liking community post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like post'
    });
  }
});

// Unlike a community post
app.delete('/api/community/posts/:id/like', async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?.userId || req.body.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required'
      });
    }
    
    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    await post.removeLike(userId);
    
    res.json({
      success: true,
      data: { likes: post.likesCount },
      message: 'Post unliked successfully'
    });
  } catch (error) {
    console.error('Error unliking community post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlike post'
    });
  }
});

// Get comments for a post
app.get('/api/community/posts/:id/comments', async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
      .populate('comments.author', 'username profile.firstName profile.lastName');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    res.json({
      success: true,
      data: post.comments
    });
  } catch (error) {
    console.error('Error fetching post comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    });
  }
});

// Add comment to a post
app.post('/api/community/posts/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;
    const userId = req.user?.userId || req.body.userId;
    
    if (!content || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Content and user ID are required'
      });
    }
    
    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    await post.addComment(userId, content);
    await post.populate('comments.author', 'username profile.firstName profile.lastName');
    
    const newComment = post.comments[post.comments.length - 1];
    
    res.status(201).json({
      success: true,
      data: newComment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
});

// Like a comment
app.post('/api/community/comments/:id/like', async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user?.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required'
      });
    }

    const post = await CommunityPost.findOne({ "comments._id": commentId });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
        return res.status(404).json({
            success: false,
            message: 'Comment not found'
        });
    }
    
    comment.likes.push(userId);
    await post.save();

    res.json({
      success: true,
      message: 'Comment liked successfully'
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like comment'
    });
  }
});

// Search community posts
app.get('/api/community/posts/search', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const posts = await CommunityPost.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } }
          ]
        }
      ]
    })
    .populate('author', 'username profile.firstName profile.lastName')
    .sort({ createdAt: -1 })
    .limit(20);
    
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error searching community posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search posts'
    });
  }
});

// Get trending posts
app.get('/api/community/posts/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const posts = await CommunityPost.getTrendingPosts(parseInt(limit));
    
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending posts'
    });
  }
});

// Submit expert question
app.post('/api/community/expert-questions', async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const userId = req.user?.userId || req.body.userId;
    
    if (!title || !content || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and user ID are required'
      });
    }
    
    const questionPost = new CommunityPost({
      title,
      content,
      category: category || 'question',
      author: userId,
      tags: ['expert-question', 'help-needed']
    });
    
    const savedPost = await questionPost.save();
    await savedPost.populate('author', 'username profile.firstName profile.lastName');
    
    res.status(201).json({
      success: true,
      data: savedPost,
      message: 'Expert question submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting expert question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit expert question'
    });
  }
});

// Get expert advice (questions with expert answers)
app.get('/api/community/expert-advice', async (req, res) => {
  try {
    const posts = await CommunityPost.find({
      isActive: true,
      $or: [
        { category: 'question' },
        { tags: { $in: ['expert-answer', 'expert-advice'] } }
      ],
      'comments.0': { $exists: true } // Has at least one comment (answer)
    })
    .populate('author', 'username profile.firstName profile.lastName')
    .populate('comments.author', 'username profile.firstName profile.lastName')
    .sort({ createdAt: -1 })
    .limit(20);
    
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error fetching expert advice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expert advice'
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

// Import AuthController
const { AuthController, authLimiter, loginLimiter, verifyToken } = require('./authController');

// Authentication endpoints with AuthController

// Use AuthController routes
app.post('/auth/register', authLimiter, AuthController.register);
app.post('/auth/login', loginLimiter, AuthController.login);
app.post('/auth/refresh', AuthController.refreshToken);
app.get('/auth/verify', verifyToken, AuthController.verifyToken);
app.post('/auth/logout', AuthController.logout);
app.post('/auth/reset-password', authLimiter, AuthController.resetPassword);
app.put('/auth/profile', verifyToken, AuthController.updateProfile);
app.post('/auth/change-password', verifyToken, AuthController.changePassword);
app.get('/auth/profile', verifyToken, AuthController.getProfile);
app.get('/auth/stats', AuthController.getStats);

// Legacy authentication endpoints for backward compatibility

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

// Setup test data endpoint
app.post('/api/setup-test-data', async (req, res) => {
  try {
    const testUserId = '685829ea7aa46f0e532ec992';
    const testFarmId = '685829ea7aa46f0e532ec993';

    // Check if test user already exists
    let testUser = await User.findById(testUserId);
    if (!testUser) {
      testUser = new User({
        _id: new mongoose.Types.ObjectId(testUserId),
        username: 'Demo User',
        email: 'demo@krishiveda.com',
        password: 'demo123', // Will be hashed automatically
        profile: {
          firstName: 'Demo',
          lastName: 'User',
          phoneNumber: '+1234567890',
          address: 'Demo Location, India',
          profilePicture: ''
        }
      });
      await testUser.save();
      console.log('✅ Test user created:', testUser.email);
    }

    // Check if test farm already exists
    let testFarm = await Farm.findById(testFarmId);
    if (!testFarm) {
      testFarm = new Farm({
        _id: new mongoose.Types.ObjectId(testFarmId),
        name: 'Demo Farm',
        location: {
          address: 'Demo Farm Location, India',
          coordinates: {
            type: 'Point',
            coordinates: [77.2090, 28.6139] // Delhi coordinates
          }
        },
        size: {
          value: 10,
          unit: 'acres'
        },
        owner: testUserId,
        farmType: 'crop',
        crops: []
      });
      await testFarm.save();
      console.log('✅ Test farm created:', testFarm.name);
    }

    res.json({
      success: true,
      message: 'Test data setup completed',
      data: {
        user: {
          id: testUserId,
          email: 'demo@krishiveda.com',
          password: 'demo123'
        },
        farm: {
          id: testFarmId,
          name: 'Demo Farm'
        }
      }
    });
  } catch (error) {
    console.error('Error setting up test data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup test data',
      error: error.message
    });
  }
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
    const { name, phone, location, profilePicture } = req.body;
    const updateData = {};

    if (name) updateData.username = name;
    if (phone) updateData['profile.phoneNumber'] = phone;
    if (location) updateData['profile.address'] = location;
    if (profilePicture) updateData['profile.profilePicture'] = profilePicture;
    
    console.log('🔍 User profile update request:', { userId, name, phone, location, profilePicture });
    console.log('🔍 Update data:', updateData);
    
    // Remove sensitive fields
    delete req.body.password;
    delete updateData._id;
    delete updateData.id;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData, $currentDate: { updatedAt: true } },
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
      location: user.profile?.address || '',
      phone: user.profile?.phoneNumber || '',
      profilePicture: user.profile?.profilePicture || '',
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

// ===== MACHINE LEARNING APIs =====

// Advanced Crop Health Analysis
app.post('/api/ml/crop-health', authenticateToken, async (req, res) => {
  try {
    const { imageData, cropType, location, metadata, modelVersion } = req.body;
    
    // Simulate ML processing with realistic delay
    const processingDelay = 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, processingDelay));
    
    const healthScore = Math.round(Math.random() * 30 + 70); // 70-100
    
    const analysisResult = {
      success: true,
      modelVersion: modelVersion || 'crop-health-v2.1',
      confidence: Math.round(Math.random() * 20 + 80) / 100,
      analysis: {
        overallHealth: {
          score: healthScore,
          status: healthScore >= 90 ? 'excellent' : healthScore >= 80 ? 'good' : healthScore >= 70 ? 'fair' : 'poor',
          trend: Math.random() > 0.5 ? 'improving' : 'stable'
        },
        diseases: Math.random() > 0.6 ? [{
          name: 'Leaf Blight',
          confidence: 0.87,
          severity: 'medium',
          affectedArea: '15%',
          treatment: {
            immediate: ['Remove affected leaves', 'Apply copper fungicide'],
            cost: 850
          }
        }] : [],
        pests: Math.random() > 0.7 ? [{
          name: 'Aphids',
          confidence: 0.75,
          severity: 'low',
          treatment: 'Apply neem oil spray'
        }] : [],
        nutritionalDeficiency: {
          detected: Math.random() > 0.7,
          nutrients: Math.random() > 0.5 ? ['nitrogen'] : ['phosphorus']
        },
        growthStage: {
          current: ['vegetative', 'flowering', 'grain_filling'][Math.floor(Math.random() * 3)],
          daysToNext: Math.floor(Math.random() * 14 + 3)
        },
        recommendations: [
          'Monitor crop regularly',
          'Maintain proper nutrition',
          'Ensure adequate water supply'
        ]
      },
      processedAt: Date.now()
    };
    
    res.json({
      success: true,
      data: analysisResult
    });
    
  } catch (error) {
    console.error('Crop health analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message
    });
  }
});

// Yield Prediction
app.post('/api/ml/yield-prediction', authenticateToken, async (req, res) => {
  try {
    const { farmData, historicalData, weatherForecast, marketData } = req.body;
    
    // Simulate ML processing
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2500));
    
    const baseYield = (farmData.area || 1) * 2500;
    const variationFactor = 0.8 + Math.random() * 0.4;
    const predictedYield = Math.round(baseYield * variationFactor);
    
    const predictionResult = {
      success: true,
      modelVersion: 'yield-pred-v1.8',
      confidence: Math.round(Math.random() * 15 + 85),
      prediction: {
        expectedYield: predictedYield,
        unit: 'kg',
        qualityGrade: Math.random() > 0.3 ? 'A' : 'B',
        harvestWindow: {
          optimal: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          earliest: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          latest: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        estimatedValue: Math.round(predictedYield * (18 + Math.random() * 8)),
        factors: {
          weather: { impact: 'positive', contribution: 12, description: 'Favorable conditions' },
          soil: { impact: 'positive', contribution: 8, description: 'Good nutrient levels' },
          management: { impact: 'positive', contribution: 15, description: 'Excellent practices' }
        },
        risks: [{
          type: 'weather',
          probability: 0.15,
          impact: 'medium',
          description: 'Potential late season drought'
        }],
        recommendations: [
          'Continue current irrigation schedule',
          'Monitor for pest activity',
          'Plan harvest logistics'
        ]
      },
      historicalComparison: {
        lastSeason: Math.round(predictedYield * (0.85 + Math.random() * 0.3)),
        improvement: '+12%'
      }
    };
    
    res.json({
      success: true,
      data: predictionResult
    });
    
  } catch (error) {
    console.error('Yield prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Yield prediction failed',
      error: error.message
    });
  }
});

// Market Price Forecasting
app.post('/api/ml/market-forecast', authenticateToken, async (req, res) => {
  try {
    const { cropType, region, timeframe } = req.body;
    
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    const currentPrice = 2000 + Math.random() * 1000;
    const periods = timeframe === '1month' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] : ['Month 1', 'Month 2', 'Month 3'];
    
    const priceForecasts = periods.map((period, index) => {
      const trend = Math.random() > 0.5 ? 1 : -1;
      const volatility = Math.random() * 0.1 + 0.02;
      const price = currentPrice * (1 + trend * volatility * (index + 1));
      
      return {
        period,
        price: Math.round(price),
        confidence: Math.round((0.9 - index * 0.1) * 100),
        trend: trend > 0 ? 'bullish' : 'bearish'
      };
    });
    
    const forecastResult = {
      success: true,
      modelVersion: 'market-forecast-v1.5',
      cropType,
      timeframe,
      currentPrice: Math.round(currentPrice),
      forecasts: priceForecasts,
      summary: {
        averagePrice: Math.round(priceForecasts.reduce((sum, f) => sum + f.price, 0) / priceForecasts.length),
        priceRange: {
          min: Math.round(Math.min(...priceForecasts.map(f => f.price))),
          max: Math.round(Math.max(...priceForecasts.map(f => f.price)))
        },
        volatility: Math.round(Math.random() * 15 + 5),
        recommendation: Math.random() > 0.5 ? 'Hold for better prices' : 'Current prices are fair'
      }
    };
    
    res.json({
      success: true,
      data: forecastResult
    });
    
  } catch (error) {
    console.error('Market forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Market forecast failed',
      error: error.message
    });
  }
});

// Soil Analysis
app.post('/api/ml/soil-analysis', authenticateToken, async (req, res) => {
  try {
    const { soilData, cropType, targetYield } = req.body;
    
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1800));
    
    const analysisResult = {
      success: true,
      modelVersion: 'soil-analysis-v1.9',
      analysis: {
        overall: {
          score: Math.round(Math.random() * 30 + 65),
          status: Math.random() > 0.3 ? 'good' : 'fair',
          suitability: 'suitable'
        },
        nutrients: {
          nitrogen: {
            level: Math.round(Math.random() * 100 + 80),
            status: Math.random() > 0.3 ? 'adequate' : 'low',
            recommendation: 'Apply 120 kg/ha urea'
          },
          phosphorus: {
            level: Math.round(Math.random() * 40 + 25),
            status: Math.random() > 0.4 ? 'adequate' : 'low',
            recommendation: 'Apply 60 kg/ha DAP'
          },
          potassium: {
            level: Math.round(Math.random() * 80 + 100),
            status: 'adequate',
            recommendation: 'Apply 40 kg/ha muriate of potash'
          }
        },
        recommendations: {
          immediate: ['Apply recommended fertilizers', 'Test soil pH'],
          seasonal: ['Implement crop rotation', 'Use cover crops'],
          longTerm: ['Build organic matter', 'Implement precision agriculture']
        },
        estimatedCost: Math.round(Math.random() * 5000 + 8000),
        expectedImprovement: Math.round(Math.random() * 20 + 15) + '%'
      }
    };
    
    res.json({
      success: true,
      data: analysisResult
    });
    
  } catch (error) {
    console.error('Soil analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Soil analysis failed',
      error: error.message
    });
  }
});

// Disease Detection
app.post('/api/ml/disease-detection', authenticateToken, async (req, res) => {
  try {
    const { imageData, cropType, symptoms } = req.body;
    
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    const diseases = [
      {
        name: 'Leaf Blight',
        confidence: 0.87,
        severity: 'medium',
        affectedArea: '15%',
        stage: 'early',
        treatment: {
          immediate: ['Remove affected leaves', 'Apply copper fungicide'],
          preventive: ['Improve air circulation', 'Reduce overhead irrigation'],
          cost: 850
        },
        prognosis: 'Good with immediate treatment'
      },
      {
        name: 'Powdery Mildew',
        confidence: 0.72,
        severity: 'low',
        affectedArea: '8%',
        stage: 'initial',
        treatment: {
          immediate: ['Apply sulfur-based fungicide'],
          preventive: ['Maintain proper spacing'],
          cost: 450
        },
        prognosis: 'Excellent with proper management'
      }
    ];
    
    const detectionResult = {
      success: true,
      modelVersion: 'disease-detect-v3.0',
      detectedDiseases: diseases.slice(0, Math.floor(Math.random() * 2) + 1),
      overallRisk: Math.random() > 0.6 ? 'low' : 'medium',
      recommendations: {
        immediate: ['Inspect crops daily', 'Monitor weather conditions'],
        shortTerm: ['Apply preventive treatments', 'Improve farm hygiene'],
        longTerm: ['Consider resistant varieties', 'Implement IPM practices']
      },
      followUpRequired: Math.random() > 0.7
    };
    
    res.json({
      success: true,
      data: detectionResult
    });
    
  } catch (error) {
    console.error('Disease detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Disease detection failed',
      error: error.message
    });
  }
});

// ML Analytics and Metrics
app.get('/api/ml/metrics', authenticateToken, async (req, res) => {
  try {
    const metrics = {
      cropHealth: {
        totalAnalyses: Math.floor(Math.random() * 50 + 10),
        averageConfidence: 0.87,
        accuracyRate: 0.92,
        lastUpdated: new Date()
      },
      yieldPrediction: {
        totalPredictions: Math.floor(Math.random() * 20 + 5),
        averageAccuracy: 0.84,
        predictionVariance: 0.12,
        lastUpdated: new Date()
      },
      marketForecast: {
        totalForecasts: Math.floor(Math.random() * 15 + 5),
        averageAccuracy: 0.78,
        volatilityPrediction: 0.89,
        lastUpdated: new Date()
      },
      soilAnalysis: {
        totalAnalyses: Math.floor(Math.random() * 30 + 8),
        recommendationSuccess: 0.91,
        yieldImprovement: 0.15,
        lastUpdated: new Date()
      }
    };
    
    res.json({
      success: true,
      data: metrics
    });
    
  } catch (error) {
    console.error('ML metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ML metrics',
      error: error.message
    });
  }
});

// ===== IOT INTEGRATION APIs =====

// Get connected IoT devices
app.get('/api/iot/devices', async (req, res) => {
  try {
    const { farmId } = req.query;
    
    // Mock IoT devices data
    const devices = [
      {
        id: 'sensor_001',
        name: 'Environmental Sensor #1',
        type: 'environmental',
        status: 'online',
        batteryLevel: 87,
        location: { zone: 'A', coordinates: [28.6139, 77.2090] },
        sensors: ['temperature', 'humidity', 'soil_moisture'],
        lastUpdate: Date.now() - 300000,
        firmware: 'v2.1.0'
      },
      {
        id: 'irrigation_001',
        name: 'Smart Sprinkler Zone A',
        type: 'irrigation',
        status: 'online',
        batteryLevel: null,
        location: { zone: 'A', coordinates: [28.6140, 77.2091] },
        capabilities: ['water_flow', 'pressure_monitoring'],
        lastUpdate: Date.now() - 180000,
        firmware: 'v1.8.2'
      },
      {
        id: 'weather_001',
        name: 'Weather Station',
        type: 'weather',
        status: 'online',
        batteryLevel: 92,
        location: { zone: 'Central', coordinates: [28.6141, 77.2092] },
        sensors: ['temperature', 'humidity', 'wind_speed', 'rainfall'],
        lastUpdate: Date.now() - 120000,
        firmware: 'v3.0.1'
      }
    ];
    
    res.json({
      success: true,
      devices: devices
    });
  } catch (error) {
    console.error('Error fetching IoT devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch IoT devices'
    });
  }
});

// Get device status
app.get('/api/iot/devices/:id/status', async (req, res) => {
  try {
    const deviceId = req.params.id;
    
    const deviceStatus = {
      id: deviceId,
      status: 'online',
      lastSeen: Date.now() - 120000,
      batteryLevel: Math.round(Math.random() * 40 + 60),
      signalStrength: Math.round(Math.random() * 30 + 70),
      uptime: Math.round(Math.random() * 720 + 24), // hours
      diagnostics: {
        cpu: Math.round(Math.random() * 30 + 20),
        memory: Math.round(Math.random() * 40 + 30),
        temperature: Math.round(Math.random() * 15 + 35)
      }
    };
    
    res.json({
      success: true,
      data: deviceStatus
    });
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device status'
    });
  }
});

// Get all sensor data
app.get('/api/iot/sensors/data', async (req, res) => {
  try {
    const sensorData = {
      temperature: 28.5 + Math.random() * 6 - 3,
      humidity: 65 + Math.random() * 20 - 10,
      soil_moisture: 45 + Math.random() * 20 - 10,
      ph: 6.8 + Math.random() * 0.8 - 0.4,
      light_intensity: 35000 + Math.random() * 10000 - 5000,
      wind_speed: 5.2 + Math.random() * 3 - 1.5,
      rainfall: Math.random() > 0.8 ? Math.random() * 5 : 0
    };
    
    res.json({
      success: true,
      data: sensorData,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor data'
    });
  }
});

// Get environmental data
app.get('/api/iot/environment/:farmId', async (req, res) => {
  try {
    const { farmId } = req.params;
    const { range = '24h' } = req.query;
    
    const hours = range === '24h' ? 24 : range === '7d' ? 168 : 24;
    const data = [];
    
    for (let i = 0; i < hours; i++) {
      data.push({
        timestamp: Date.now() - (hours - i) * 60 * 60 * 1000,
        temperature: 25 + Math.sin(i / 4) * 8 + Math.random() * 2,
        humidity: 60 + Math.cos(i / 6) * 20 + Math.random() * 5,
        soil_moisture: 50 + Math.sin(i / 8) * 15 + Math.random() * 3,
        light_intensity: Math.max(0, 40000 * Math.sin((i % 24) / 24 * Math.PI)),
        wind_speed: 3 + Math.random() * 4,
        atmospheric_pressure: 1013 + Math.random() * 10 - 5
      });
    }
    
    res.json({
      success: true,
      farmId,
      timeRange: range,
      data,
      summary: {
        avgTemperature: data.reduce((sum, d) => sum + d.temperature, 0) / data.length,
        avgHumidity: data.reduce((sum, d) => sum + d.humidity, 0) / data.length,
        avgSoilMoisture: data.reduce((sum, d) => sum + d.soil_moisture, 0) / data.length
      }
    });
  } catch (error) {
    console.error('Error fetching environmental data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch environmental data'
    });
  }
});

// Control irrigation system
app.post('/api/iot/irrigation/control', async (req, res) => {
  try {
    const { zoneId, action, duration, moisture_threshold } = req.body;
    
    // Simulate irrigation control
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const result = {
      success: true,
      zoneId,
      action,
      duration,
      status: action === 'start' ? 'running' : 'stopped',
      startTime: action === 'start' ? Date.now() : null,
      estimatedEndTime: action === 'start' ? Date.now() + (duration * 60 * 1000) : null,
      waterFlow: action === 'start' ? 15.5 : 0,
      pressure: action === 'start' ? 2.3 : 0
    };
    
    res.json({
      success: true,
      data: result,
      message: `Irrigation ${action}ed successfully`
    });
  } catch (error) {
    console.error('Irrigation control error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to control irrigation system'
    });
  }
});

// Get irrigation schedule
app.get('/api/iot/irrigation/schedule', async (req, res) => {
  try {
    const { farmId } = req.query;
    
    const schedule = [
      {
        id: 'schedule_001',
        zone: 'A',
        time: '06:00',
        duration: 30,
        days: ['monday', 'wednesday', 'friday'],
        enabled: true,
        moisture_threshold: 35
      },
      {
        id: 'schedule_002',
        zone: 'B',
        time: '06:30',
        duration: 45,
        days: ['tuesday', 'thursday', 'saturday'],
        enabled: true,
        moisture_threshold: 40
      },
      {
        id: 'schedule_003',
        zone: 'C',
        time: '07:00',
        duration: 25,
        days: ['daily'],
        enabled: false,
        moisture_threshold: 30
      }
    ];
    
    res.json({
      success: true,
      farmId,
      schedule,
      nextIrrigation: {
        zone: 'A',
        scheduledTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        duration: 30
      }
    });
  } catch (error) {
    console.error('Error fetching irrigation schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch irrigation schedule'
    });
  }
});

// Get automation rules
app.get('/api/iot/automation/rules', async (req, res) => {
  try {
    const { farmId } = req.query;
    
    const rules = [
      {
        id: 'rule_001',
        name: 'Auto Irrigation - Low Moisture',
        enabled: true,
        farmId,
        trigger: {
          type: 'sensor_threshold',
          deviceId: 'sensor_001',
          sensorType: 'soil_moisture',
          operator: 'less_than',
          value: 30
        },
        action: {
          type: 'irrigation_start',
          deviceId: 'irrigation_001',
          duration: 20
        },
        cooldown: 3600000, // 1 hour
        lastTriggered: null
      },
      {
        id: 'rule_002',
        name: 'High Temperature Alert',
        enabled: true,
        farmId,
        trigger: {
          type: 'sensor_threshold',
          deviceId: 'sensor_001',
          sensorType: 'temperature',
          operator: 'greater_than',
          value: 35
        },
        action: {
          type: 'send_alert',
          severity: 'warning',
          message: 'High temperature detected in Zone A'
        },
        cooldown: 1800000, // 30 minutes
        lastTriggered: null
      }
    ];
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch automation rules'
    });
  }
});

// Create automation rule
app.post('/api/iot/automation/rules', async (req, res) => {
  try {
    const ruleData = req.body;
    
    // Simulate rule creation
    const newRule = {
      id: `rule_${Date.now()}`,
      ...ruleData,
      createdAt: new Date(),
      lastTriggered: null
    };
    
    res.status(201).json({
      success: true,
      data: newRule,
      message: 'Automation rule created successfully'
    });
  } catch (error) {
    console.error('Error creating automation rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create automation rule'
    });
  }
});

// Update automation rule
app.put('/api/iot/automation/rules/:id', async (req, res) => {
  try {
    const ruleId = req.params.id;
    const updates = req.body;
    
    // Simulate rule update
    const updatedRule = {
      id: ruleId,
      ...updates,
      updatedAt: new Date()
    };
    
    res.json({
      success: true,
      data: updatedRule,
      message: 'Automation rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating automation rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update automation rule'
    });
  }
});

// Get IoT analytics
app.get('/api/iot/analytics/:farmId', async (req, res) => {
  try {
    const { farmId } = req.params;
    const { range = '7d' } = req.query;
    
    const analytics = {
      overview: {
        totalDevices: 8,
        onlineDevices: 7,
        batteryAlerts: 1,
        dataPoints: Math.floor(Math.random() * 50000 + 100000)
      },
      efficiency: {
        irrigationSavings: Math.round(Math.random() * 30 + 20), // percentage
        energyReduction: Math.round(Math.random() * 25 + 15),
        waterUsageOptimization: Math.round(Math.random() * 35 + 25)
      },
      trends: {
        temperatureTrend: Math.random() > 0.5 ? 'increasing' : 'stable',
        moistureTrend: Math.random() > 0.5 ? 'optimal' : 'improving',
        yieldPrediction: '+' + Math.round(Math.random() * 15 + 8) + '%'
      }
    };
    
    res.json({
      success: true,
      farmId,
      timeRange: range,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching IoT analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch IoT analytics'
    });
  }
});

// Get energy consumption data
app.get('/api/iot/energy/:farmId', async (req, res) => {
  try {
    const { farmId } = req.params;
    const { range = '7d' } = req.query;
    
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 7;
    const energyData = [];
    
    for (let i = 0; i < days; i++) {
      energyData.push({
        date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        irrigation: Math.round(Math.random() * 50 + 100), // kWh
        sensors: Math.round(Math.random() * 10 + 5),
        lighting: Math.round(Math.random() * 30 + 20),
        total: 0
      });
    }
    
    // Calculate totals
    energyData.forEach(day => {
      day.total = day.irrigation + day.sensors + day.lighting;
    });
    
    const totalConsumption = energyData.reduce((sum, day) => sum + day.total, 0);
    const avgDaily = Math.round(totalConsumption / days);
    
    res.json({
      success: true,
      farmId,
      timeRange: range,
      data: energyData,
      summary: {
        totalConsumption,
        avgDaily,
        cost: Math.round(totalConsumption * 0.12), // $0.12 per kWh
        carbonFootprint: Math.round(totalConsumption * 0.45) // kg CO2
      }
    });
  } catch (error) {
    console.error('Error fetching energy data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch energy data'
    });
  }
});

// Network utilities
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  // Get all IPv4 addresses
  for (const interfaceName in interfaces) {
    const interfaceList = interfaces[interfaceName];
    for (const iface of interfaceList) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: interfaceName,
          address: iface.address,
          netmask: iface.netmask
        });
      }
    }
  }
  
  return addresses;
};

const getPrimaryIpAddress = () => {
  const addresses = getLocalIpAddress();
  
  // Prefer WiFi or Ethernet interfaces
  const preferred = addresses.find(addr => 
    addr.interface.toLowerCase().includes('wi-fi') || 
    addr.interface.toLowerCase().includes('ethernet') ||
    addr.interface.toLowerCase().includes('wlan') ||
    addr.interface.toLowerCase().includes('eth')
  );
  
  return preferred ? preferred.address : (addresses[0] ? addresses[0].address : 'localhost');
};

const logNetworkInfo = (port) => {
  const addresses = getLocalIpAddress();
  const primaryIp = getPrimaryIpAddress();
  
  console.log('\n🌐 Network Information:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Primary IP: ${primaryIp}`);
  console.log('\n🔗 Available Network Interfaces:');
  addresses.forEach(addr => {
    console.log(`  ${addr.interface}: ${addr.address}`);
  });
  
  console.log('\n📱 Connection URLs:');
  console.log(`  Local: http://localhost:${port}/api`);
  console.log(`  Network: http://${primaryIp}:${port}/api`);
  
  if (addresses.length > 1) {
    console.log('\n🔄 Alternative URLs:');
    addresses.forEach(addr => {
      if (addr.address !== primaryIp) {
        console.log(`  http://${addr.address}:${port}/api`);
      }
    });
  }
  
  console.log('\n💡 Tips:');
  console.log('  • Use the Network URL for mobile device connections');
  console.log('  • If connection fails, try alternative URLs above');
  console.log('  • Ensure your device is on the same network');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

// Create HTTP server
const server = http.createServer(app);

// WebSocket server disabled - enable only when IoT devices are needed
// Uncomment below to enable WebSocket functionality
/*
// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/iot/ws'
});

// Store active WebSocket connections
const iotClients = new Map();

// WebSocket authentication middleware
const authenticateWSToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    // Silently handle auth failures when no devices are expected
    return null;
  }
};

// WebSocket connection handler
wss.on('connection', (ws, request) => {
  // Silently handle connections when no devices are expected
  
  let clientId = null;
  let authenticated = false;
  
  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received WebSocket message:', message.type);
      
      switch (message.type) {
        case 'authenticate':
          const user = authenticateWSToken(message.token);
          if (user) {
            authenticated = true;
            clientId = `user_${user.userId}_${Date.now()}`;
            iotClients.set(clientId, {
              ws,
              userId: user.userId,
              connectedAt: new Date()
            });
            
            ws.send(JSON.stringify({
              type: 'authenticated',
              clientId,
              status: 'success',
              message: 'WebSocket connection authenticated'
            }));
            
            console.log(`✅ WebSocket client authenticated: ${clientId}`);
            
            // Start sending sensor data updates
            startSensorDataStream(clientId);
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Authentication failed'
            }));
            ws.close(1008, 'Authentication failed');
          }
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
          
        case 'subscribe':
          if (!authenticated) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Authentication required'
            }));
            return;
          }
          
          // Handle subscription to specific data streams
          const { topic } = message;
          console.log(`📡 Client ${clientId} subscribed to: ${topic}`);
          
          ws.send(JSON.stringify({
            type: 'subscribed',
            topic,
            status: 'success'
          }));
          break;
          
        case 'unsubscribe':
          if (!authenticated) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Authentication required'
            }));
            return;
          }
          
          const { topic: unsubTopic } = message;
          console.log(`📡 Client ${clientId} unsubscribed from: ${unsubTopic}`);
          
          ws.send(JSON.stringify({
            type: 'unsubscribed',
            topic: unsubTopic,
            status: 'success'
          }));
          break;
          
        default:
          console.log('❓ Unknown WebSocket message type:', message.type);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  // Handle connection close
  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket client disconnected: ${clientId} (${code}: ${reason})`);
    if (clientId) {
      iotClients.delete(clientId);
    }
  });
  
  // Handle connection errors
  ws.on('error', (error) => {
    console.error('🚨 WebSocket error:', error);
  });
  
  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'IoT WebSocket server connected',
    timestamp: Date.now()
  }));
});

// Function to start sensor data streaming
const startSensorDataStream = (clientId) => {
  const client = iotClients.get(clientId);
  if (!client) return;
  
  // Send sensor data every 10 seconds
  const interval = setInterval(() => {
    if (!iotClients.has(clientId)) {
      clearInterval(interval);
      return;
    }
    
    const sensorData = {
      type: 'sensor_data',
      timestamp: Date.now(),
      data: {
        temperature: Math.round((28.5 + Math.random() * 6 - 3) * 10) / 10,
        humidity: Math.round((65 + Math.random() * 20 - 10) * 10) / 10,
        soil_moisture: Math.round((45 + Math.random() * 20 - 10) * 10) / 10,
        ph: Math.round((6.8 + Math.random() * 0.8 - 0.4) * 100) / 100,
        light_intensity: Math.round(35000 + Math.random() * 10000 - 5000),
        wind_speed: Math.round((5.2 + Math.random() * 3 - 1.5) * 10) / 10,
        rainfall: Math.random() > 0.8 ? Math.round(Math.random() * 5 * 10) / 10 : 0
      }
    };
    
    client.ws.send(JSON.stringify(sensorData));
  }, 10000);
};

// Function to broadcast to all connected clients
const broadcastToClients = (message) => {
  iotClients.forEach((client, clientId) => {
    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error broadcasting to client ${clientId}:`, error);
      iotClients.delete(clientId);
    }
  });
};

// Periodic system alerts (every 5 minutes)
setInterval(() => {
  if (iotClients.size > 0) {
    const alerts = [
      {
        type: 'alert',
        level: 'info',
        title: 'System Status',
        message: 'All IoT devices are operating normally',
        timestamp: Date.now()
      },
      {
        type: 'alert',
        level: 'warning', 
        title: 'Low Battery',
        message: 'Sensor #3 battery level is below 20%',
        timestamp: Date.now()
      },
      {
        type: 'alert',
        level: 'success',
        title: 'Irrigation Complete',
        message: 'Zone A irrigation cycle completed successfully',
        timestamp: Date.now()
      }
    ];
    
    // Send random alert
    const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
    broadcastToClients(randomAlert);
  }
}, 300000); // 5 minutes

*/

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Agriculture API Server running on port ${PORT}`);
  console.log(`📶 IoT WebSocket Server: DISABLED (enable by uncommenting WebSocket code)`);
  logNetworkInfo(PORT);
  
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
  console.log('  GET  /api/crops/:id/activities - Get crop activities');
  console.log('  POST /api/crops/:id/activities - Add crop activity');
  console.log('  PUT  /api/crops/:cropId/activities/:activityId - Update crop activity');
  console.log('  DELETE /api/crops/:cropId/activities/:activityId - Delete crop activity');
  console.log('  GET  /api/weather - Get weather data');
  console.log('  GET  /api/community/posts - Get community posts');
  console.log('  POST /api/community/posts - Create community post');
  console.log('');
  console.log('🤖 AI/ML Endpoints:');
  console.log('  POST /api/ml/crop-health - AI crop health analysis');
  console.log('  POST /api/ml/disease-detection - Disease detection & classification');
  console.log('  POST /api/ml/yield-prediction - Yield forecasting');
  console.log('  POST /api/ml/market-forecast - Market price prediction');
  console.log('  POST /api/ml/soil-analysis - Soil health analysis');
  console.log('  GET  /api/ml/metrics - ML model performance metrics');
  console.log('');
  console.log('🔌 IoT Integration Endpoints:');
  console.log('  GET  /api/iot/devices - Get connected IoT devices');
  console.log('  GET  /api/iot/devices/:id/status - Get device status');
  console.log('  POST /api/iot/devices/register - Register new IoT device');
  console.log('  PUT  /api/iot/devices/:id/config - Update device config');
  console.log('  GET  /api/iot/sensors/data - Get all sensor data');
  console.log('  GET  /api/iot/sensors/:deviceId/:sensorType/history - Get sensor history');
  console.log('  GET  /api/iot/environment/:farmId - Get environmental data');
  console.log('  GET  /api/iot/weather-station/:stationId - Get weather station data');
  console.log('  POST /api/iot/irrigation/control - Control irrigation system');
  console.log('  GET  /api/iot/irrigation/schedule - Get irrigation schedule');
  console.log('  POST /api/iot/irrigation/optimize - Optimize irrigation schedule');
  console.log('  GET  /api/iot/automation/rules - Get automation rules');
  console.log('  POST /api/iot/automation/rules - Create automation rule');
  console.log('  PUT  /api/iot/automation/rules/:id - Update automation rule');
  console.log('  DELETE /api/iot/automation/rules/:id - Delete automation rule');
  console.log('  GET  /api/iot/analytics/:farmId - Get IoT analytics');
  console.log('  GET  /api/iot/energy/:farmId - Get energy consumption data');
  console.log('');
  console.log('🔌 WebSocket Endpoints:');
  console.log('  WS   /iot/ws - IoT real-time data stream');
  console.log('    Messages: authenticate, ping, subscribe, unsubscribe');
  console.log('    Streams: sensor_data, alerts, device_status');
  console.log('');
});

module.exports = app;
