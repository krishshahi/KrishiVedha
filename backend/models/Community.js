const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'crop-advice', 'pest-control', 'weather', 'equipment', 'market-prices', 'success-story', 'question'],
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  images: [{
    url: String,
    caption: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    country: String,
    state: String,
    city: String
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      likedAt: {
        type: Date,
        default: Date.now
      }
    }],
    replies: [{
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true,
        maxlength: 500
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reportedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
communityPostSchema.index({ author: 1 });
communityPostSchema.index({ category: 1 });
communityPostSchema.index({ tags: 1 });
communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ 'location.coordinates': '2dsphere' });
communityPostSchema.index({ isPinned: -1, createdAt: -1 });

// Virtual for total likes count
communityPostSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for total comments count
communityPostSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

// Method to add a like
communityPostSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  if (!existingLike) {
    this.likes.push({ user: userId });
  }
  return this.save();
};

// Method to remove a like
communityPostSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Method to add a comment
communityPostSchema.methods.addComment = function(authorId, content) {
  this.comments.push({
    author: authorId,
    content: content
  });
  return this.save();
};

// Method to increment view count
communityPostSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to get trending posts
communityPostSchema.statics.getTrendingPosts = function(limit = 10) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: weekAgo },
        isActive: true
      }
    },
    {
      $addFields: {
        likesCount: { $size: '$likes' },
        commentsCount: { $size: '$comments' },
        engagementScore: {
          $add: [
            { $multiply: [{ $size: '$likes' }, 2] },
            { $size: '$comments' },
            { $divide: ['$views', 10] }
          ]
        }
      }
    },
    {
      $sort: { engagementScore: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

module.exports = mongoose.model('CommunityPost', communityPostSchema);

