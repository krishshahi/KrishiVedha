const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/krishivedha';

// Sample post content
const samplePosts = [
  {
    content: "🌾 My rice crops are showing excellent growth this season! The new organic fertilizer technique I learned from this community is working wonders. Yield is expected to increase by 30%.",
    category: "Success Stories",
    tags: ["rice", "organic", "fertilizer", "success"],
    location: {
      district: "Kathmandu",
      province: "Bagmati",
      coordinates: {
        type: "Point",
        coordinates: [85.3240, 27.7172]
      }
    }
  },
  {
    content: "⚠️ URGENT: Noticed brown spots on tomato leaves. Started appearing 3 days ago and spreading rapidly. Need expert advice on treatment. Attached photos for reference.",
    category: "Problems",
    tags: ["tomato", "disease", "help", "urgent"],
    location: {
      district: "Pokhara",
      province: "Gandaki",
      coordinates: {
        type: "Point",
        coordinates: [83.9856, 28.2096]
      }
    }
  },
  {
    content: "💡 TIP: For better potato yield, plant them during the waning moon phase. Traditional knowledge passed down from my grandfather - it really works! Also, mix wood ash in soil for better growth.",
    category: "Tips",
    tags: ["potato", "traditional", "tips", "planting"],
    location: {
      district: "Dhading",
      province: "Bagmati",
      coordinates: {
        type: "Point",
        coordinates: [85.0581, 27.8671]
      }
    }
  },
  {
    content: "🌽 Market price update: Corn is selling at NPR 45/kg in Kalimati market today. Good time to sell if you have stock. Prices expected to drop next week when new harvest arrives.",
    category: "General",
    tags: ["corn", "market", "price", "kalimati"],
    location: {
      district: "Kathmandu",
      province: "Bagmati"
    }
  },
  {
    content: "❓ Question: What's the best irrigation schedule for wheat during winter? My field is 2 hectares and water source is limited. Currently watering every 10 days - is that sufficient?",
    category: "Questions",
    tags: ["wheat", "irrigation", "winter", "water"],
    location: {
      district: "Bhaktapur",
      province: "Bagmati"
    }
  },
  {
    content: "🐛 Successfully controlled aphid infestation using neem oil spray! Mixed 5ml neem oil + 2ml dish soap in 1L water. Sprayed every 3 days for 2 weeks. Completely organic solution!",
    category: "Tips",
    tags: ["pest-control", "aphids", "neem", "organic"],
    location: {
      district: "Lalitpur",
      province: "Bagmati"
    }
  },
  {
    content: "📈 This season's cauliflower harvest exceeded expectations! 2 tons from just 0.5 hectare. Key was proper spacing (45cm) and regular organic compost application.",
    category: "Success Stories",
    tags: ["cauliflower", "harvest", "success", "organic"],
    location: {
      district: "Kavre",
      province: "Bagmati"
    }
  },
  {
    content: "🌧️ Weather alert: Heavy rainfall expected in next 3 days. Harvest ready crops immediately and ensure proper drainage in fields to prevent waterlogging.",
    category: "General",
    tags: ["weather", "rain", "alert", "harvest"],
    location: {
      district: "Sindhupalchok",
      province: "Bagmati"
    }
  },
  {
    content: "🌱 Starting organic farming journey! Converted 1 hectare to fully organic. No chemicals for 6 months now. Seeing improvement in soil quality. Any tips for beginners?",
    category: "General",
    tags: ["organic", "beginner", "soil", "farming"],
    location: {
      district: "Nuwakot",
      province: "Bagmati"
    }
  },
  {
    content: "⚠️ Grasshopper attack in my maize field! They appeared suddenly yesterday. What's the best organic solution? Don't want to use chemical pesticides.",
    category: "Problems",
    tags: ["maize", "grasshopper", "pest", "organic"],
    location: {
      district: "Chitwan",
      province: "Bagmati"
    }
  }
];

// Sample comments
const sampleComments = [
  "Great advice! I'll try this in my field.",
  "I faced the same problem last year. Here's what worked for me...",
  "Thanks for sharing! Very helpful information.",
  "Can you share more details about the process?",
  "Excellent results! What variety did you use?",
  "Try using garlic spray - it's very effective!",
  "Contact the agriculture office for expert help.",
  "This worked perfectly in my farm. Highly recommend!",
  "Be careful with the dosage. Too much can harm the plants.",
  "Great timing! I was just about to ask the same question."
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing posts (optional - comment out if you want to keep existing data)
    await Post.deleteMany({});
    console.log('🗑️ Cleared existing posts');

    // Get or create test users
    let users = await User.find().limit(5);
    
    if (users.length === 0) {
      console.log('Creating test users...');
      const testUsers = [
        { username: 'Ram Bahadur', email: 'ram@test.com', password: 'password123' },
        { username: 'Sita Devi', email: 'sita@test.com', password: 'password123' },
        { username: 'Krishna Thapa', email: 'krishna@test.com', password: 'password123' },
        { username: 'Gita Sharma', email: 'gita@test.com', password: 'password123' },
        { username: 'Hari Prasad', email: 'hari@test.com', password: 'password123' }
      ];

      for (const userData of testUsers) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = new User({
          ...userData,
          password: hashedPassword,
          profile: {
            firstName: userData.username.split(' ')[0],
            lastName: userData.username.split(' ')[1] || '',
            phoneNumber: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
            address: 'Nepal'
          }
        });
        users.push(await user.save());
      }
      console.log('✅ Created test users');
    }

    // Create posts
    const createdPosts = [];
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      
      // Only include location if it has valid coordinates
      const postToSave = {
        content: postData.content,
        category: postData.category,
        tags: postData.tags,
        author: randomUser._id,
        viewCount: Math.floor(Math.random() * 500),
        shareCount: Math.floor(Math.random() * 50),
        isActive: true,
        visibility: 'public'
      };
      
      // Only add location if it has valid coordinates
      if (postData.location && postData.location.coordinates && postData.location.coordinates.coordinates) {
        postToSave.location = postData.location;
      } else if (postData.location) {
        // Add location without coordinates
        postToSave.location = {
          district: postData.location.district,
          province: postData.location.province
        };
      }
      
      const post = new Post(postToSave);

      // Add random likes
      const likeCount = Math.floor(Math.random() * 20);
      for (let j = 0; j < likeCount; j++) {
        const randomLiker = users[Math.floor(Math.random() * users.length)];
        if (!post.likes.some(like => like.user.toString() === randomLiker._id.toString())) {
          post.likes.push({ user: randomLiker._id });
        }
      }

      // Add random comments
      const commentCount = Math.floor(Math.random() * 5);
      for (let j = 0; j < commentCount; j++) {
        const randomCommenter = users[Math.floor(Math.random() * users.length)];
        const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        
        post.comments.push({
          author: randomCommenter._id,
          content: randomComment,
          likes: Array.from({ length: Math.floor(Math.random() * 5) }, () => 
            users[Math.floor(Math.random() * users.length)]._id
          )
        });
      }

      const savedPost = await post.save();
      createdPosts.push(savedPost);
      console.log(`✅ Created post ${i + 1}: "${postData.content.substring(0, 50)}..."`);
    }

    // Populate and display summary
    const populatedPosts = await Post.find()
      .populate('author', 'username email')
      .populate('comments.author', 'username');

    console.log('\n📊 Seeding Summary:');
    console.log(`- Total posts created: ${createdPosts.length}`);
    console.log(`- Total users: ${users.length}`);
    console.log(`- Total likes: ${createdPosts.reduce((sum, post) => sum + post.likes.length, 0)}`);
    console.log(`- Total comments: ${createdPosts.reduce((sum, post) => sum + post.comments.length, 0)}`);
    
    console.log('\n📝 Sample posts created:');
    populatedPosts.slice(0, 3).forEach(post => {
      console.log(`\n- Author: ${post.author.username}`);
      console.log(`  Content: ${post.content.substring(0, 80)}...`);
      console.log(`  Category: ${post.category}`);
      console.log(`  Tags: ${post.tags.join(', ')}`);
      console.log(`  Likes: ${post.likes.length}, Comments: ${post.comments.length}`);
    });

    console.log('\n✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder
seedDatabase();
