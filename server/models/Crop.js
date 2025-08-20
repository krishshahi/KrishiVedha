const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  variety: {
    type: String,
    trim: true,
    maxlength: 100
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plantingDate: {
    type: Date,
    required: true
  },
  expectedHarvestDate: {
    type: Date
  },
  actualHarvestDate: {
    type: Date
  },
  area: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['acres', 'hectares', 'sqft', 'sqm'],
      default: 'acres'
    }
  },
  status: {
    type: String,
    enum: ['planned', 'planted', 'growing', 'flowering', 'harvested', 'failed'],
    default: 'planned'
  },
  growthStage: {
    type: String,
    enum: ['seed', 'germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'maturity'],
    default: 'seed'
  },
  soilConditions: {
    ph: {
      type: Number,
      min: 0,
      max: 14
    },
    moisture: {
      type: Number,
      min: 0,
      max: 100
    },
    temperature: Number,
    nutrients: {
      nitrogen: Number,
      phosphorus: Number,
      potassium: Number
    }
  },
  irrigation: {
    method: {
      type: String,
      enum: ['drip', 'sprinkler', 'flood', 'manual', 'none']
    },
    frequency: String,
    lastWatered: Date,
    waterAmount: Number 
  },
  fertilization: [{
    type: String,
    amount: Number,
    unit: String,
    applicationDate: Date,
    notes: String
  }],
  pestControl: [{
    pestType: String,
    treatment: String,
    applicationDate: Date,
    effectiveness: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent']
    },
    notes: String
  }],
  yield: {
    expected: {
      amount: Number,
      unit: String
    },
    actual: {
      amount: Number,
      unit: String
    }
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  images: [{
    url: String,
    caption: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    stage: String
  }],
  // Comprehensive activity log
  activities: [{
    type: {
      type: String,
      enum: [
        'planting', 'watering', 'fertilizing', 'pest_control', 
        'pruning', 'weeding', 'harvesting', 'observation',
        'soil_test', 'stage_change', 'disease_treatment', 'other',
        'pesticide', 'irrigation', 'monitoring'
      ],
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500
    },
    date: {
      type: Date,
      default: Date.now
    },
    metadata: {
      // Flexible object for activity-specific data
      amount: Number,
      unit: String,
      product: String,
      method: String,
      duration: Number,
      weather: String,
      temperature: Number,
      humidity: Number,
      notes: String
    },
    images: [String], // References to image URLs
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for farm queries
cropSchema.index({ farm: 1 });
cropSchema.index({ owner: 1 });
cropSchema.index({ status: 1 });
cropSchema.index({ plantingDate: 1 });

// Virtual for crop age in days
cropSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.plantingDate) / (24 * 60 * 60 * 1000));
});

// Method to calculate days until harvest
cropSchema.methods.getDaysUntilHarvest = function() {
  if (!this.expectedHarvestDate) return null;
  const today = new Date();
  const harvest = new Date(this.expectedHarvestDate);
  return Math.ceil((harvest - today) / (24 * 60 * 60 * 1000));
};

// Method to update growth stage based on age
cropSchema.methods.updateGrowthStage = function() {
  const ageInDays = this.ageInDays;
  
  if (ageInDays < 7) {
    this.growthStage = 'germination';
  } else if (ageInDays < 21) {
    this.growthStage = 'seedling';
  } else if (ageInDays < 60) {
    this.growthStage = 'vegetative';
  } else if (ageInDays < 90) {
    this.growthStage = 'flowering';
  } else if (ageInDays < 120) {
    this.growthStage = 'fruiting';
  } else {
    this.growthStage = 'maturity';
  }
};

module.exports = mongoose.model('Crop', cropSchema);

