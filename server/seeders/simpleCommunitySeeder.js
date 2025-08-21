const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/krishivedha';

async function seedSimplePosts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop the geospatial index first
    try {
      await Post.collection.dropIndex('location.coordinates_2dsphere');
      console.log('🗑️ Dropped geospatial index');
    } catch (e) {
      console.log('ℹ️ No geospatial index to drop');
    }

    // Clear existing posts
    await Post.deleteMany({});
    console.log('🗑️ Cleared existing posts');

    // Get first user
    const user = await User.findOne();
    if (!user) {
      console.error('❌ No users found. Please create a user first.');
      return;
    }
    console.log('👤 Using user:', user.username || user.email);

    // Create simple posts without geospatial data
    const posts = [
      {
        author: user._id,
        content: "🌾 My rice crops are showing excellent growth this season! The new organic fertilizer technique is working wonders.",
        category: "Success Stories",
        tags: ["rice", "organic", "fertilizer"],
        isActive: true,
        visibility: "public"
      },
      {
        author: user._id,
        content: "⚠️ URGENT: Brown spots on tomato leaves. Need expert advice!",
        category: "Problems",
        tags: ["tomato", "disease", "help"],
        isActive: true,
        visibility: "public"
      },
      {
        author: user._id,
        content: "💡 TIP: Plant potatoes during waning moon for better yield!",
        category: "Tips",
        tags: ["potato", "tips", "planting"],
        isActive: true,
        visibility: "public"
      },
      {
        author: user._id,
        content: "🌽 Market update: Corn at NPR 45/kg in Kalimati today",
        category: "General",
        tags: ["corn", "market", "price"],
        isActive: true,
        visibility: "public"
      },
      {
        author: user._id,
        content: "❓ What's the best irrigation schedule for wheat in winter?",
        category: "Questions",
        tags: ["wheat", "irrigation", "winter"],
        isActive: true,
        visibility: "public"
      }
    ];

    let createdCount = 0;
    for (const postData of posts) {
      const post = new Post(postData);
      await post.save();
      createdCount++;
      console.log(`✅ Created post ${createdCount}: "${postData.content.substring(0, 40)}..."`);
    }

    console.log(`\n📊 Summary: Created ${createdCount} posts successfully!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

seedSimplePosts();
