const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        index: '2dsphere'
      }
    },
    country: String,
    state: String,
    city: String,
    zipCode: String
  },
  size: {
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
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmType: {
    type: String,
    enum: ['crop', 'livestock', 'mixed', 'organic', 'dairy', 'poultry', 'aquaculture'],
    required: true
  },
  crops: [{
    name: String,
    variety: String,
    plantingDate: Date,
    harvestDate: Date,
    area: Number,
    status: {
      type: String,
      enum: ['planted', 'growing', 'harvested', 'planned'],
      default: 'planned'
    }
  }],
  livestock: [{
    type: String,
    count: Number,
    breed: String,
    healthStatus: String
  }],
  equipment: [{
    name: String,
    type: String,
    purchaseDate: Date,
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    maintenanceSchedule: Date
  }],
  soilData: {
    ph: Number,
    nitrogen: Number,
    phosphorus: Number,
    potassium: Number,
    organicMatter: Number,
    lastTested: Date
  },
  weatherData: {
    lastUpdate: Date,
    temperature: Number,
    humidity: Number,
    rainfall: Number,
    windSpeed: Number
  },
  irrigation: {
    system: {
      type: String,
      enum: ['drip', 'sprinkler', 'flood', 'manual', 'none']
    },
    schedule: [{
      day: String,
      time: String,
      duration: Number, // in minutes
      zones: [String]
    }],
    waterSource: String
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
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  establishedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries
farmSchema.index({ 'location.coordinates': '2dsphere' });

// Index for owner queries
farmSchema.index({ owner: 1 });

// Virtual for farm age
farmSchema.virtual('farmAge').get(function() {
  return Math.floor((Date.now() - this.establishedDate) / (365.25 * 24 * 60 * 60 * 1000));
});

// Method to calculate total crop area
farmSchema.methods.getTotalCropArea = function() {
  return this.crops.reduce((total, crop) => total + (crop.area || 0), 0);
};

// Method to get active crops
farmSchema.methods.getActiveCrops = function() {
  return this.crops.filter(crop => crop.status === 'planted' || crop.status === 'growing');
};

module.exports = mongoose.model('Farm', farmSchema);

