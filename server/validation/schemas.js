const Joi = require('joi');

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
    password: Joi.string().min(6).max(100).required().messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 6 characters long'
    }),
    location: Joi.string().max(100).allow('').messages({
      'string.max': 'Location cannot exceed 100 characters'
    }),
    phone: Joi.string().pattern(/^[+]?[1-9][\d]{0,15}$/).allow('').messages({
      'string.pattern.base': 'Please provide a valid phone number'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required'
    })
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters'
    }),
    phone: Joi.string().pattern(/^[+]?[1-9][\d]{0,15}$/).allow('').messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
    location: Joi.string().max(100).allow('').messages({
      'string.max': 'Location cannot exceed 100 characters'
    })
  })
};

// Farm validation schemas
const farmSchemas = {
  create: Joi.object({
    userId: Joi.string().required().messages({
      'string.empty': 'User ID is required'
    }),
    name: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'Farm name is required',
      'string.min': 'Farm name must be at least 2 characters long',
      'string.max': 'Farm name cannot exceed 100 characters'
    }),
    location: Joi.string().min(5).max(200).required().messages({
      'string.empty': 'Location is required',
      'string.min': 'Location must be at least 5 characters long',
      'string.max': 'Location cannot exceed 200 characters'
    }),
    area: Joi.number().min(0).max(100000).messages({
      'number.min': 'Area cannot be negative',
      'number.max': 'Area cannot exceed 100,000 units'
    }),
    crops: Joi.array().items(Joi.string().max(50)).max(20).messages({
      'array.max': 'Cannot have more than 20 crops'
    })
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).messages({
      'string.min': 'Farm name must be at least 2 characters long',
      'string.max': 'Farm name cannot exceed 100 characters'
    }),
    location: Joi.string().min(5).max(200).messages({
      'string.min': 'Location must be at least 5 characters long',
      'string.max': 'Location cannot exceed 200 characters'
    }),
    area: Joi.number().min(0).max(100000).messages({
      'number.min': 'Area cannot be negative',
      'number.max': 'Area cannot exceed 100,000 units'
    }),
    crops: Joi.array().items(Joi.string().max(50)).max(20).messages({
      'array.max': 'Cannot have more than 20 crops'
    })
  })
};

// Crop validation schemas
const cropSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.empty': 'Crop name is required',
      'string.min': 'Crop name must be at least 2 characters long',
      'string.max': 'Crop name cannot exceed 50 characters'
    }),
    variety: Joi.string().max(50).allow('').messages({
      'string.max': 'Variety cannot exceed 50 characters'
    }),
    farmId: Joi.string().required().messages({
      'string.empty': 'Farm ID is required'
    }),
    ownerId: Joi.string().required().messages({
      'string.empty': 'Owner ID is required'
    }),
    plantingDate: Joi.date().required().messages({
      'date.base': 'Please provide a valid planting date',
      'any.required': 'Planting date is required'
    }),
    expectedHarvestDate: Joi.date().min(Joi.ref('plantingDate')).messages({
      'date.min': 'Expected harvest date must be after planting date'
    }),
    area: Joi.object({
      value: Joi.number().min(0).max(10000),
      unit: Joi.string().valid('acres', 'hectares', 'square_meters')
    })
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(50).messages({
      'string.min': 'Crop name must be at least 2 characters long',
      'string.max': 'Crop name cannot exceed 50 characters'
    }),
    variety: Joi.string().max(50).allow('').messages({
      'string.max': 'Variety cannot exceed 50 characters'
    }),
    plantingDate: Joi.date().messages({
      'date.base': 'Please provide a valid planting date'
    }),
    expectedHarvestDate: Joi.date().when('plantingDate', {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref('plantingDate')),
      otherwise: Joi.date()
    }).messages({
      'date.min': 'Expected harvest date must be after planting date'
    }),
    status: Joi.string().valid('planned', 'planted', 'growing', 'harvested', 'failed'),
    growthStage: Joi.string().valid('seed', 'germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'mature', 'harvest'),
    area: Joi.object({
      value: Joi.number().min(0).max(10000),
      unit: Joi.string().valid('acres', 'hectares', 'square_meters')
    })
  })
};

// Activity validation schemas
const activitySchemas = {
  create: Joi.object({
    type: Joi.string().valid('planting', 'watering', 'fertilizing', 'pesticide', 'weeding', 'harvesting', 'stage_change', 'observation', 'other').required().messages({
      'string.empty': 'Activity type is required',
      'any.only': 'Invalid activity type'
    }),
    title: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'Activity title is required',
      'string.min': 'Title must be at least 2 characters long',
      'string.max': 'Title cannot exceed 100 characters'
    }),
    description: Joi.string().max(500).allow('').messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
    date: Joi.date().max('now').messages({
      'date.max': 'Activity date cannot be in the future'
    }),
    metadata: Joi.object().unknown(true),
    images: Joi.array().items(Joi.string().uri()).max(10).messages({
      'array.max': 'Cannot have more than 10 images'
    }),
    createdBy: Joi.string()
  }),

  update: Joi.object({
    type: Joi.string().valid('planting', 'watering', 'fertilizing', 'pesticide', 'weeding', 'harvesting', 'stage_change', 'observation', 'other').messages({
      'any.only': 'Invalid activity type'
    }),
    title: Joi.string().min(2).max(100).messages({
      'string.min': 'Title must be at least 2 characters long',
      'string.max': 'Title cannot exceed 100 characters'
    }),
    description: Joi.string().max(500).allow('').messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
    date: Joi.date().max('now').messages({
      'date.max': 'Activity date cannot be in the future'
    }),
    metadata: Joi.object().unknown(true),
    images: Joi.array().items(Joi.string().uri()).max(10).messages({
      'array.max': 'Cannot have more than 10 images'
    })
  })
};

// Community post validation schemas
const communitySchemas = {
  createPost: Joi.object({
    title: Joi.string().min(5).max(200).required().messages({
      'string.empty': 'Post title is required',
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title cannot exceed 200 characters'
    }),
    content: Joi.string().min(10).max(5000).required().messages({
      'string.empty': 'Post content is required',
      'string.min': 'Content must be at least 10 characters long',
      'string.max': 'Content cannot exceed 5000 characters'
    }),
    category: Joi.string().valid('general', 'crops', 'pests', 'farming', 'weather', 'technology', 'question', 'advice').required().messages({
      'string.empty': 'Post category is required',
      'any.only': 'Invalid post category'
    }),
    authorId: Joi.string().required().messages({
      'string.empty': 'Author ID is required'
    }),
    tags: Joi.array().items(Joi.string().max(30)).max(10).messages({
      'array.max': 'Cannot have more than 10 tags',
      'string.max': 'Tags cannot exceed 30 characters'
    })
  }),

  updatePost: Joi.object({
    title: Joi.string().min(5).max(200).messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title cannot exceed 200 characters'
    }),
    content: Joi.string().min(10).max(5000).messages({
      'string.min': 'Content must be at least 10 characters long',
      'string.max': 'Content cannot exceed 5000 characters'
    }),
    category: Joi.string().valid('general', 'crops', 'pests', 'farming', 'weather', 'technology', 'question', 'advice').messages({
      'any.only': 'Invalid post category'
    }),
    tags: Joi.array().items(Joi.string().max(30)).max(10).messages({
      'array.max': 'Cannot have more than 10 tags',
      'string.max': 'Tags cannot exceed 30 characters'
    })
  }),

  addComment: Joi.object({
    content: Joi.string().min(1).max(1000).required().messages({
      'string.empty': 'Comment content is required',
      'string.min': 'Comment cannot be empty',
      'string.max': 'Comment cannot exceed 1000 characters'
    }),
    userId: Joi.string().required().messages({
      'string.empty': 'User ID is required'
    })
  })
};

// Pagination schema
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'name', '-name').default('-createdAt')
});

module.exports = {
  userSchemas,
  farmSchemas,
  cropSchemas,
  activitySchemas,
  communitySchemas,
  paginationSchema
};
