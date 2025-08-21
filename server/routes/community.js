const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const CONFIG = require('../../config/app.config.js');

// Auth middleware
const auth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, CONFIG.auth.jwtSecret, (err, user) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    req.userId = user.userId;
    req.user = user;
    next();
  });
};

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/posts/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// GET trending posts - MUST BE BEFORE /posts/:id route
router.get('/posts/trending', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const posts = await Post.getTrending(parseInt(limit));

    const postsWithLikeStatus = posts.map(post => ({
      ...post.toObject(),
      isLiked: post.isLikedBy(req.userId),
      likeCount: post.likes.length,
      commentCount: post.comments.length
    }));

    res.json({ 
      success: true, 
      data: postsWithLikeStatus 
    });
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching trending posts',
      error: error.message 
    });
  }
});

// GET all posts with pagination and filtering
router.get('/posts', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      search,
      sortBy = 'createdAt',
      order = 'desc',
      userId,
      nearbyOnly = false,
      latitude,
      longitude,
      maxDistance = 50000 // 50km in meters
    } = req.query;

    const skip = (page - 1) * limit;
    const query = { isActive: true };

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by user (for "My Posts")
    if (userId) {
      query.author = userId;
    }

    // Search in content and tags
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Geospatial query for nearby posts
    if (nearbyOnly === 'true' && latitude && longitude) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      };
    }

    // Build sort object
    const sortOptions = {};
    if (sortBy === 'trending') {
      sortOptions['likes.length'] = -1;
      sortOptions.viewCount = -1;
    } else {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    }

    const posts = await Post.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('author', 'name email profilePicture location')
      .populate('comments.author', 'name profilePicture')
      .lean();

    const totalPosts = await Post.countDocuments(query);

    // Add isLiked flag for current user
    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      isLiked: post.likes.some(like => like.user.toString() === req.userId),
      likeCount: post.likes.length,
      commentCount: post.comments.length
    }));

    res.json({
      success: true,
      data: postsWithLikeStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        hasMore: skip + posts.length < totalPosts
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching posts',
      error: error.message 
    });
  }
});

// GET single post by ID
router.get('/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email profilePicture location')
      .populate('comments.author', 'name profilePicture');

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    // Increment view count
    post.viewCount += 1;
    await post.save();

    const postData = post.toObject();
    postData.isLiked = post.isLikedBy(req.userId);

    res.json({ 
      success: true, 
      data: postData 
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching post',
      error: error.message 
    });
  }
});

// CREATE new post
router.post('/posts', auth, upload.array('images', 5), async (req, res) => {
  try {
    const { content, category, tags, visibility, location } = req.body;

    // Process uploaded images
    const images = req.files ? req.files.map(file => ({
      url: `/uploads/posts/${file.filename}`,
      publicId: file.filename
    })) : [];

    // Parse tags if sent as string
    const parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;

    // Parse location if sent as string
    const parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;

    const newPost = new Post({
      author: req.userId,
      content,
      category: category || 'General',
      tags: parsedTags || [],
      visibility: visibility || 'public',
      images,
      location: parsedLocation || {}
    });

    await newPost.save();
    
    // Populate author details before sending response
    await newPost.populate('author', 'name email profilePicture location');

    res.status(201).json({ 
      success: true, 
      message: 'Post created successfully',
      data: newPost 
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating post',
      error: error.message 
    });
  }
});

// UPDATE post
router.put('/posts/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    // Check if user is the author
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only edit your own posts' 
      });
    }

    const { content, category, tags, visibility } = req.body;

    // Update fields if provided
    if (content) post.content = content;
    if (category) post.category = category;
    if (tags) {
      post.tags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : tags;
    }
    if (visibility) post.visibility = visibility;

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/posts/${file.filename}`,
        publicId: file.filename
      }));
      post.images = [...post.images, ...newImages];
    }

    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();
    await post.populate('author', 'name email profilePicture location');

    res.json({ 
      success: true, 
      message: 'Post updated successfully',
      data: post 
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating post',
      error: error.message 
    });
  }
});

// DELETE post
router.delete('/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    // Check if user is the author
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own posts' 
      });
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    res.json({ 
      success: true, 
      message: 'Post deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting post',
      error: error.message 
    });
  }
});

// TOGGLE like on post
router.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    await post.toggleLike(req.userId);

    res.json({ 
      success: true, 
      message: 'Like toggled successfully',
      data: {
        likeCount: post.likes.length,
        isLiked: post.isLikedBy(req.userId)
      }
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error toggling like',
      error: error.message 
    });
  }
});

// ADD comment to post
router.post('/posts/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment content is required' 
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    await post.addComment(req.userId, content);
    
    // Populate the new comment's author
    await post.populate('comments.author', 'name profilePicture');

    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json({ 
      success: true, 
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding comment',
      error: error.message 
    });
  }
});

// DELETE comment from post
router.delete('/posts/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    const commentIndex = post.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }

    // Check if user is the comment author
    if (post.comments[commentIndex].author.toString() !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own comments' 
      });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    res.json({ 
      success: true, 
      message: 'Comment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting comment',
      error: error.message 
    });
  }
});


// REPORT post
router.post('/posts/:id/report', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Report reason is required' 
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: 'Post not found' 
      });
    }

    // Check if user has already reported
    const alreadyReported = post.reported.some(
      r => r.user.toString() === req.userId
    );

    if (alreadyReported) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already reported this post' 
      });
    }

    post.reported.push({
      user: req.userId,
      reason
    });

    await post.save();

    res.json({ 
      success: true, 
      message: 'Post reported successfully' 
    });
  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error reporting post',
      error: error.message 
    });
  }
});

module.exports = router;
