const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Farm = require('./models/Farm');
const Crop = require('./models/Crop');
const WeatherData = require('./models/WeatherData');
const CommunityPost = require('./models/Community');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://192.168.1.89:27017/agriculture-app';

// Sample data
const sampleUsers = [
  {
    username: 'john_farmer',
    email: 'john@example.com',
    password: 'password123',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1-555-0123',
      address: 'California, USA'
    },
    role: 'farmer'
  },
  {
    username: 'mary_grower',
    email: 'mary@example.com',
    password: 'password123',
    profile: {
      firstName: 'Mary',
      lastName: 'Johnson',
      phoneNumber: '+1-555-0456',
      address: 'Texas, USA'
    },
    role: 'farmer'
  },
  {
    username: 'alex_organic',
    email: 'alex@example.com',
    password: 'password123',
    profile: {
      firstName: 'Alex',
      lastName: 'Smith',
      phoneNumber: '+1-555-0789',
      address: 'Oregon, USA'
    },
    role: 'farmer'
  }
];

const sampleFarms = [
  {
    name: 'Sunshine Valley Farm',
    location: {
      address: '123 Farm Road, California, USA',
      coordinates: {
        type: 'Point',
        coordinates: [-119.4179, 36.7783]
      },
      country: 'USA',
      state: 'California',
      city: 'Fresno'
    },
    size: {
      value: 25,
      unit: 'hectares'
    },
    farmType: 'crop',
    crops: [
      { name: 'Wheat', status: 'growing' },
      { name: 'Corn', status: 'planted' }
    ],
    soilData: {
      ph: 6.8,
      nitrogen: 45,
      phosphorus: 30,
      potassium: 180,
      organicMatter: 3.2,
      lastTested: new Date('2024-05-01')
    },
    irrigation: {
      system: 'drip',
      waterSource: 'Well'
    }
  },
  {
    name: 'Green Acres Organic',
    location: {
      address: '456 Organic Lane, Texas, USA',
      coordinates: {
        type: 'Point',
        coordinates: [-99.9018, 31.9686]
      },
      country: 'USA',
      state: 'Texas',
      city: 'Austin'
    },
    size: {
      value: 40,
      unit: 'hectares'
    },
    farmType: 'organic',
    crops: [
      { name: 'Tomatoes', status: 'growing' },
      { name: 'Lettuce', status: 'growing' },
      { name: 'Carrots', status: 'planted' }
    ],
    soilData: {
      ph: 7.1,
      nitrogen: 38,
      phosphorus: 25,
      potassium: 165,
      organicMatter: 4.1,
      lastTested: new Date('2024-04-15')
    },
    irrigation: {
      system: 'sprinkler',
      waterSource: 'Municipal'
    }
  }
];

const sampleCrops = [
  {
    name: 'Winter Wheat',
    variety: 'Hard Red Winter',
    plantingDate: new Date('2024-03-15'),
    expectedHarvestDate: new Date('2024-08-15'),
    area: {
      value: 12,
      unit: 'hectares'
    },
    status: 'growing',
    growthStage: 'vegetative',
    soilConditions: {
      ph: 6.8,
      moisture: 65,
      temperature: 18
    },
    irrigation: {
      method: 'drip',
      frequency: 'Weekly',
      lastWatered: new Date('2024-06-01')
    }
  },
  {
    name: 'Sweet Corn',
    variety: 'Golden Bantam',
    plantingDate: new Date('2024-04-01'),
    expectedHarvestDate: new Date('2024-07-15'),
    area: {
      value: 8,
      unit: 'hectares'
    },
    status: 'flowering',
    growthStage: 'flowering',
    soilConditions: {
      ph: 6.5,
      moisture: 70,
      temperature: 22
    },
    irrigation: {
      method: 'sprinkler',
      frequency: 'Bi-weekly',
      lastWatered: new Date('2024-05-28')
    }
  }
];

const sampleWeatherData = [
  {
    location: {
      coordinates: {
        type: 'Point',
        coordinates: [-119.4179, 36.7783]
      },
      address: 'Fresno, California, USA',
      city: 'Fresno',
      country: 'USA'
    },
    current: {
      temperature: {
        celsius: 25,
        fahrenheit: 77
      },
      humidity: 45,
      pressure: 1013.25,
      windSpeed: 10,
      windDirection: 180,
      precipitation: {
        amount: 0,
        type: 'none'
      },
      conditions: {
        main: 'Clear',
        description: 'Clear sky',
        icon: '01d'
      },
      cloudCover: 10,
      uvIndex: 8
    },
    forecast: [
      {
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        temperature: { high: 28, low: 15 },
        humidity: 40,
        precipitation: { chance: 10, amount: 0 },
        conditions: { main: 'Sunny', description: 'Sunny day' }
      },
      {
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        temperature: { high: 26, low: 14 },
        humidity: 55,
        precipitation: { chance: 30, amount: 2 },
        conditions: { main: 'Partly Cloudy', description: 'Partly cloudy' }
      }
    ],
    dataSource: {
      provider: 'Mock Weather Service',
      lastUpdated: new Date(),
      reliability: 'high'
    }
  }
];

const sampleCommunityPosts = [
  {
    title: 'Best practices for organic farming',
    content: 'I\'ve been farming organically for 5 years now and wanted to share some tips that have worked well for me. First, soil health is everything - focus on composting and crop rotation...',
    category: 'crop-advice',
    tags: ['organic', 'soil-health', 'composting'],
    likes: [],
    comments: [
      {
        content: 'Great advice! I\'ve been thinking about transitioning to organic methods.',
        likes: []
      }
    ]
  },
  {
    title: 'Dealing with aphids naturally',
    content: 'Has anyone tried companion planting to control aphids? I\'m looking for natural alternatives to pesticides.',
    category: 'pest-control',
    tags: ['aphids', 'natural-pest-control', 'companion-planting'],
    likes: [],
    comments: []
  },
  {
    title: 'Weather alert: Heavy rains expected',
    content: 'Weather services are predicting heavy rainfall in the Central Valley this week. Make sure your drainage systems are ready!',
    category: 'weather',
    tags: ['weather-alert', 'rain', 'central-valley'],
    likes: [],
    comments: []
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Farm.deleteMany({}),
      Crop.deleteMany({}),
      WeatherData.deleteMany({}),
      CommunityPost.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
    }
    console.log(`Created ${users.length} users`);

    // Create farms
    const farms = [];
    for (let i = 0; i < sampleFarms.length; i++) {
      const farmData = {
        ...sampleFarms[i],
        owner: users[i % users.length]._id
      };
      const farm = new Farm(farmData);
      await farm.save();
      farms.push(farm);
    }
    console.log(`Created ${farms.length} farms`);

    // Create crops
    const crops = [];
    for (let i = 0; i < sampleCrops.length; i++) {
      const cropData = {
        ...sampleCrops[i],
        farm: farms[i % farms.length]._id,
        owner: users[i % users.length]._id
      };
      const crop = new Crop(cropData);
      await crop.save();
      crops.push(crop);
    }
    console.log(`Created ${crops.length} crops`);

    // Create weather data
    const weatherRecords = [];
    for (let i = 0; i < sampleWeatherData.length; i++) {
      const weatherData = {
        ...sampleWeatherData[i],
        farm: farms[i % farms.length]._id
      };
      const weather = new WeatherData(weatherData);
      await weather.save();
      weatherRecords.push(weather);
    }
    console.log(`Created ${weatherRecords.length} weather records`);

    // Create community posts
    const posts = [];
    for (let i = 0; i < sampleCommunityPosts.length; i++) {
      const postData = {
        ...sampleCommunityPosts[i],
        author: users[i % users.length]._id
      };
      // Add author to comments
      if (postData.comments.length > 0) {
        postData.comments = postData.comments.map(comment => ({
          ...comment,
          author: users[(i + 1) % users.length]._id
        }));
      }
      const post = new CommunityPost(postData);
      await post.save();
      posts.push(post);
    }
    console.log(`Created ${posts.length} community posts`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSample user credentials:');
    sampleUsers.forEach(user => {
      console.log(`Email: ${user.email}, Password: ${user.password}`);
    });
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

