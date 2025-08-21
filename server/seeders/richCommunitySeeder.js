const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Post = require('../models/Post');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/krishivedha';

// Rich content for posts
const postContents = [
  {
    content: "🌾 Just harvested my first batch of organic tomatoes! The yield was amazing - almost 500kg from just 0.5 acres. Used only natural fertilizers and neem oil for pest control. The secret? Regular mulching and drip irrigation saved 40% water!",
    category: "Success Stories",
    tags: ["organic", "tomatoes", "harvest", "water-saving"],
    images: []
  },
  {
    content: "Need advice! 🆘 My paddy fields are showing yellow leaves despite regular fertilization. pH level is 6.2, and we had heavy rainfall last week. What could be the issue? Already tried adding nitrogen but no improvement.",
    category: "Questions",
    tags: ["paddy", "fertilizer", "help", "yellow-leaves"],
    images: []
  },
  {
    content: "💡 Pro tip: Mix neem cake with your soil before planting to prevent root diseases. I've been doing this for 3 years, and my plants are always healthy! Also acts as a slow-release fertilizer. Share your organic farming tips below!",
    category: "Tips",
    tags: ["organic", "neem", "soil-health", "prevention"],
    images: []
  },
  {
    content: "🐛 Alert! Spotted armyworm outbreak in our region (Bhaktapur district). They're attacking maize crops heavily. Using pheromone traps and Bt spray. Fellow farmers, please check your fields and take preventive measures!",
    category: "Problems",
    tags: ["pest-alert", "armyworm", "maize", "bhaktapur"],
    images: []
  },
  {
    content: "Started intercropping beans with maize this season. The nitrogen fixation from beans is helping maize growth, and I'm getting two crops from the same land! Planning to add pumpkins next. Anyone else trying permaculture methods?",
    category: "General",
    tags: ["intercropping", "permaculture", "beans", "maize"],
    images: []
  },
  {
    content: "🎉 Our farmers' cooperative just secured a direct export deal! We'll be supplying organic vegetables to Singapore. This means 30% better prices for all members. Join our cooperative if you're interested in collective bargaining power!",
    category: "Success Stories",
    tags: ["export", "cooperative", "organic", "marketing"],
    images: []
  },
  {
    content: "Weather update: Meteorology department predicts early monsoon this year. Time to prepare your fields! I'm strengthening my drainage channels and covering young seedlings. What are your monsoon preparation tips?",
    category: "General",
    tags: ["weather", "monsoon", "preparation", "drainage"],
    images: []
  },
  {
    content: "⚠️ Fungal infection spreading in cucumber plants due to high humidity. Lost 30% of my crop. Now using copper sulfate spray and improving air circulation. Learn from my mistake - always maintain proper spacing!",
    category: "Problems",
    tags: ["fungus", "cucumber", "humidity", "crop-loss"],
    images: []
  },
  {
    content: "Installed solar-powered drip irrigation system. Initial cost was Rs 50,000 but I'm saving Rs 2,000/month on electricity and labor. Water usage down by 60%. Government subsidy covered 40% of the cost. Highly recommended!",
    category: "Success Stories",
    tags: ["solar", "irrigation", "water-saving", "technology"],
    images: []
  },
  {
    content: "Question about soil testing: Where can I get affordable soil testing done in Kathmandu valley? Need NPK levels, pH, and micronutrients analysis. Budget is around Rs 2000. Please share contact details if you know any good labs.",
    category: "Questions",
    tags: ["soil-testing", "laboratory", "kathmandu", "npk"],
    images: []
  },
  {
    content: "🌱 My greenhouse experiment is showing great results! Growing bell peppers and cherry tomatoes year-round. Temperature control and pest management are much easier. Planning to expand to strawberries next.",
    category: "Success Stories",
    tags: ["greenhouse", "bell-pepper", "tomatoes", "controlled-farming"],
    images: []
  },
  {
    content: "Traditional wisdom works! My grandmother's technique of companion planting marigolds with vegetables is keeping aphids away naturally. No pesticides needed. What traditional farming methods do you still use?",
    category: "Tips",
    tags: ["traditional", "companion-planting", "marigolds", "natural-pest-control"],
    images: []
  },
  {
    content: "Market price alert 📈: Cauliflower prices expected to rise next month due to low production. Current wholesale rate: Rs 40/kg. Good time to start nursery preparation. I'm allocating 2 acres for early variety.",
    category: "General",
    tags: ["market-price", "cauliflower", "planning", "profit"],
    images: []
  },
  {
    content: "Help needed! First time growing strawberries. Planted 500 saplings but flowers are falling off. Using coco peat and vermicompost mix. Temperature is 18-22°C. What am I doing wrong?",
    category: "Questions",
    tags: ["strawberry", "help", "flower-drop", "beginner"],
    images: []
  },
  {
    content: "✅ Completed organic certification! It took 3 years of chemical-free farming, but now I can sell at premium prices. The certification cost Rs 15,000 but I'm already getting 40% higher prices. Happy to guide anyone interested!",
    category: "Success Stories",
    tags: ["organic-certification", "premium-price", "chemical-free", "achievement"],
    images: []
  },
  {
    content: "Biogas plant installation complete! Using cow dung from my 5 cows. Getting free cooking gas and the slurry is excellent fertilizer. Total cost: Rs 80,000 with 50% government subsidy. Pays for itself in 2 years!",
    category: "Success Stories",
    tags: ["biogas", "renewable-energy", "fertilizer", "subsidy"],
    images: []
  },
  {
    content: "🌿 Experimenting with vertical farming for leafy vegetables. Using PVC pipes and nutrient solution. Perfect for small spaces! Already harvesting lettuce and spinach every 3 weeks. Urban farmers, this is the future!",
    category: "Tips",
    tags: ["vertical-farming", "urban-farming", "hydroponics", "space-saving"],
    images: []
  },
  {
    content: "Lost 50% potato crop to late blight disease 😔. Should have sprayed preventive fungicide before symptoms appeared. Now I know - prevention is better than cure. Sharing so others can learn from my loss.",
    category: "Problems",
    tags: ["potato", "late-blight", "crop-loss", "lesson-learned"],
    images: []
  },
  {
    content: "Government announcement: New subsidy scheme for drip irrigation - 60% for small farmers! Application deadline is next month. Need land ownership certificate and project proposal. I can share the application format if needed.",
    category: "General",
    tags: ["government-scheme", "subsidy", "drip-irrigation", "deadline"],
    images: []
  },
  {
    content: "My integrated farming model: Fish + Duck + Vegetables. Duck droppings feed the fish, fish pond water irrigates vegetables. Zero waste, multiple income sources! Monthly earning increased from Rs 30k to Rs 75k!",
    category: "Success Stories",
    tags: ["integrated-farming", "fish-farming", "duck", "income"],
    images: []
  },
  {
    content: "Tip for fellow farmers: Start maintaining a farming diary. Record everything - expenses, weather, pest attacks, yields. After 2 years of records, I can predict and prevent most problems. Digital apps work great too!",
    category: "Tips",
    tags: ["record-keeping", "planning", "diary", "management"],
    images: []
  },
  {
    content: "🚨 Fake fertilizer alert! Bought DAP from a new shop in Bhaktapur, but crops showed no improvement. Lab test revealed it's just colored sand! Be careful, buy only from authorized dealers. Shop name: New Agro Suppliers.",
    category: "Problems",
    tags: ["fake-fertilizer", "alert", "scam", "warning"],
    images: []
  },
  {
    content: "Coffee plantation update: 3-year-old plants started producing! Getting 2kg cherry per plant. Processing my own beans and selling directly to cafes at Rs 800/kg. Much better than selling raw cherries at Rs 80/kg!",
    category: "Success Stories",
    tags: ["coffee", "value-addition", "processing", "profit"],
    images: []
  },
  {
    content: "Question: Has anyone tried growing avocados in Nepal? I have 5 ropani land at 1,400m altitude with good drainage. Thinking of importing Hass variety saplings. Please share your experience and challenges.",
    category: "Questions",
    tags: ["avocado", "new-crop", "altitude", "advice"],
    images: []
  },
  {
    content: "Mushroom farming indoors is amazing! Started with 100 bags of oyster mushrooms in a spare room. Harvesting 5kg daily, selling at Rs 300/kg. Low investment, high returns. Perfect for women entrepreneurs!",
    category: "Success Stories",
    tags: ["mushroom", "indoor-farming", "entrepreneurship", "profit"],
    images: []
  }
];

// Comments templates
const comments = [
  "Great advice! I'll try this method.",
  "Thanks for sharing your experience!",
  "I faced the same problem last year. Your solution works!",
  "Very helpful post. Keep sharing!",
  "Can you share more details about the costs?",
  "Which variety did you use?",
  "I'm interested in trying this. Can we connect?",
  "This is exactly what I was looking for!",
  "Your success is inspiring!",
  "Thanks for the warning. I'll be careful.",
  "How long did it take to see results?",
  "What's the best season for this?",
  "I disagree. In my experience, different approach works better.",
  "Adding to your point - temperature control is also important.",
  "Fellow farmer from Pokhara here. We should collaborate!",
  "Government subsidy information is very useful. Thanks!",
  "Your traditional methods are gold! My grandfather did the same.",
  "Market price info helps a lot in planning. Please keep updating.",
  "I can supply the materials you need. Contact me.",
  "Brilliant innovation! This will help many small farmers."
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting rich community data seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing posts
    await Post.deleteMany({});
    console.log('🗑️  Cleared existing posts');

    // Get or create users
    let users = await User.find().limit(5);
    
    if (users.length < 5) {
      console.log('Creating additional test users...');
      
      const userPromises = [];
      const userNames = [
        { name: 'Raj Kumar', email: 'raj@example.com', location: 'Kathmandu' },
        { name: 'Sita Sharma', email: 'sita@example.com', location: 'Pokhara' },
        { name: 'Ram Thapa', email: 'ram@example.com', location: 'Bhaktapur' },
        { name: 'Gita Poudel', email: 'gita@example.com', location: 'Lalitpur' },
        { name: 'Hari Bhandari', email: 'hari@example.com', location: 'Chitwan' }
      ];

      for (const userData of userNames) {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          const hashedPassword = await bcrypt.hash('password123', 10);
          userPromises.push(
            User.create({
              username: userData.name,
              email: userData.email,
              password: hashedPassword,
              profile: {
                firstName: userData.name.split(' ')[0],
                lastName: userData.name.split(' ')[1],
                address: userData.location
              }
            })
          );
        }
      }

      if (userPromises.length > 0) {
        const newUsers = await Promise.all(userPromises);
        users = [...users, ...newUsers];
        console.log(`✅ Created ${newUsers.length} additional users`);
      }
    }

    // Create posts with rich interactions
    const posts = [];
    let postIndex = 0;

    for (const postData of postContents) {
      const authorIndex = postIndex % users.length;
      const author = users[authorIndex];
      
      // Create post
      const post = new Post({
        author: author._id,
        content: postData.content,
        category: postData.category,
        tags: postData.tags,
        visibility: 'public',
        images: postData.images,
        viewCount: Math.floor(Math.random() * 500) + 50,
        shareCount: Math.floor(Math.random() * 50) + 5,
      });

      // Add random likes (0-15 likes per post)
      const likeCount = Math.floor(Math.random() * 15);
      const likedUsers = new Set();
      
      for (let i = 0; i < likeCount; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        if (!likedUsers.has(randomUser._id.toString())) {
          post.likes.push({
            user: randomUser._id,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          });
          likedUsers.add(randomUser._id.toString());
        }
      }

      // Add random comments (0-8 comments per post)
      const commentCount = Math.floor(Math.random() * 8);
      
      for (let i = 0; i < commentCount; i++) {
        const commentAuthor = users[Math.floor(Math.random() * users.length)];
        const commentText = comments[Math.floor(Math.random() * comments.length)];
        
        post.comments.push({
          author: commentAuthor._id,
          content: commentText,
          createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
          likes: Array.from({ length: Math.floor(Math.random() * 5) }, () => 
            users[Math.floor(Math.random() * users.length)]._id
          )
        });
      }

      // Set creation date to spread over last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      post.createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      post.updatedAt = post.createdAt;

      posts.push(post);
      postIndex++;
    }

    // Save all posts
    const savedPosts = await Post.insertMany(posts);
    console.log(`✅ Created ${savedPosts.length} posts with rich interactions`);

    // Display summary
    const totalLikes = posts.reduce((sum, post) => sum + post.likes.length, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);
    const totalViews = posts.reduce((sum, post) => sum + post.viewCount, 0);

    console.log('\n📊 Seeding Summary:');
    console.log(`   - Total Posts: ${savedPosts.length}`);
    console.log(`   - Total Likes: ${totalLikes}`);
    console.log(`   - Total Comments: ${totalComments}`);
    console.log(`   - Total Views: ${totalViews}`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Categories: ${[...new Set(posts.map(p => p.category))].join(', ')}`);

    console.log('\n✅ Rich community data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder
seedDatabase();
