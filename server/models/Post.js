const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  images: [{
    url: String,
    publicId: String // For cloudinary or similar service
  }],
  category: {
    type: String,
    enum: ['Tips', 'Questions', 'Success Stories', 'Problems', 'General'],
    default: 'General'
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
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
      trim: true,
      maxlength: 500
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['public', 'community', 'private'],
    default: 'public'
  },
  location: {
    district: String,
    province: String,
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        required: function() {
          return this.location && this.location.coordinates && this.location.coordinates.coordinates;
        }
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: function() {
          return this.location && this.location.coordinates && this.location.coordinates.type;
        }
      }
    }
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  reported: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
// Only create geospatial index if coordinates exist
postSchema.index({ 'location.coordinates': '2dsphere' }, { 
  sparse: true,
  background: true 
}); // For geospatial queries

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to check if user has liked the post
postSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Method to toggle like
postSchema.methods.toggleLike = async function(userId) {
  const existingLikeIndex = this.likes.findIndex(
    like => like.user.toString() === userId.toString()
  );
  
  if (existingLikeIndex > -1) {
    // Remove like
    this.likes.splice(existingLikeIndex, 1);
  } else {
    // Add like
    this.likes.push({ user: userId });
  }
  
  return this.save();
};

// Method to add comment
postSchema.methods.addComment = async function(userId, content) {
  this.comments.push({
    author: userId,
    content
  });
  
  return this.save();
};

// Static method to get trending posts
postSchema.statics.getTrending = function(limit = 10) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return this.find({
    isActive: true,
    createdAt: { $gte: oneDayAgo }
  })
  .sort({ 'likes.length': -1, viewCount: -1, createdAt: -1 })
  .limit(limit)
  .populate('author', 'name email profilePicture')
  .populate('comments.author', 'name profilePicture');
};

// Pre-save hook to clean up location field
postSchema.pre('save', function(next) {
  // If location exists but doesn't have valid coordinates, remove it
  if (this.location) {
    if (!this.location.coordinates || 
        !this.location.coordinates.coordinates || 
        !Array.isArray(this.location.coordinates.coordinates) ||
        this.location.coordinates.coordinates.length !== 2) {
      // Remove the coordinates field if it's invalid
      if (this.location.coordinates) {
        this.location.coordinates = undefined;
      }
      // If location has no useful data, remove it entirely
      if (!this.location.district && !this.location.province) {
        this.location = undefined;
      }
    }
  }
  next();
});

// Ensure virtuals are included in JSON
postSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
