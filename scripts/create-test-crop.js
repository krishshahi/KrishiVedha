// Script to create a test crop for upload testing
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./backend/models/User');
const Farm = require('./backend/models/Farm');
const Crop = require('./backend/models/Crop');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agriculture-app';

const createTestCrop = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Create or get test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        username: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: '1234567890',
          address: 'Test Location'
        }
      });
      await testUser.save();
      console.log('✅ Created test user');
    }

    // Create or get test farm
    let testFarm = await Farm.findOne({ name: 'Test Farm', owner: testUser._id });
    if (!testFarm) {
      testFarm = new Farm({
        name: 'Test Farm',
        location: {
          address: 'Test Farm Location',
          coordinates: {
            type: 'Point',
            coordinates: [0, 0]
          }
        },
        size: {
          value: 5,
          unit: 'acres'
        },
        owner: testUser._id,
        farmType: 'crop'
      });
      await testFarm.save();
      console.log('✅ Created test farm');
    }

    // Create test crop with a known ID
    const testCropId = new mongoose.Types.ObjectId('64f8b9c0a8b4c5d6e7f8g9h0');
    let testCrop = await Crop.findById(testCropId);
    
    if (!testCrop) {
      testCrop = new Crop({
        _id: testCropId,
        name: 'Test Tomato',
        variety: 'Cherry Tomato',
        farm: testFarm._id,
        owner: testUser._id,
        plantingDate: new Date(),
        status: 'growing',
        images: [] // Start with empty images array
      });
      await testCrop.save();
      console.log('✅ Created test crop with ID:', testCropId.toString());
    }

    console.log('🎯 Test crop ready for upload testing!');
    console.log('Crop ID to use in tests:', testCropId.toString());
    
    await mongoose.connection.close();
    return testCropId.toString();
  } catch (error) {
    console.error('❌ Error creating test crop:', error);
    await mongoose.connection.close();
    throw error;
  }
};

if (require.main === module) {
  createTestCrop().then(cropId => {
    console.log('Test crop created successfully with ID:', cropId);
    process.exit(0);
  }).catch(error => {
    console.error('Failed to create test crop:', error);
    process.exit(1);
  });
}

module.exports = { createTestCrop };
