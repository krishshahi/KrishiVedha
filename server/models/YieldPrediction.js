const mongoose = require('mongoose');

const yieldPredictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  farmData: {
    area: { type: Number, required: true }, // in hectares
    cropType: { type: String, required: true },
    variety: String,
    plantingDate: Date,
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
      region: String,
      district: String,
      state: String
    },
    soilType: String,
    irrigationType: {
      type: String,
      enum: ['rainfed', 'drip', 'sprinkler', 'flood', 'mixed']
    }
  },
  historicalData: {
    previousYields: [{
      year: Number,
      yield: Number,
      unit: String
    }],
    averageYield: Number,
    bestYield: Number,
    worstYield: Number
  },
  weatherData: {
    historical: mongoose.Schema.Types.Mixed,
    forecast: mongoose.Schema.Types.Mixed,
    criticalPeriods: [String]
  },
  marketData: {
    currentPrices: mongoose.Schema.Types.Mixed,
    trends: mongoose.Schema.Types.Mixed,
    demandForecast: String
  },
  prediction: {
    expectedYield: { type: Number, required: true },
    unit: { type: String, default: 'kg' },
    yieldPerHectare: Number,
    qualityGrade: {
      type: String,
      enum: ['A+', 'A', 'B+', 'B', 'C'],
      default: 'A'
    },
    harvestWindow: {
      optimal: Date,
      earliest: Date,
      latest: Date
    },
    estimatedValue: Number,
    profitMargin: Number,
    factors: {
      weather: {
        impact: { type: String, enum: ['positive', 'neutral', 'negative'] },
        contribution: Number, // percentage
        description: String
      },
      soil: {
        impact: { type: String, enum: ['positive', 'neutral', 'negative'] },
        contribution: Number,
        description: String
      },
      management: {
        impact: { type: String, enum: ['positive', 'neutral', 'negative'] },
        contribution: Number,
        description: String
      },
      genetics: {
        impact: { type: String, enum: ['positive', 'neutral', 'negative'] },
        contribution: Number,
        description: String
      },
      market: {
        impact: { type: String, enum: ['positive', 'neutral', 'negative'] },
        contribution: Number,
        description: String
      }
    },
    risks: [{
      type: { 
        type: String, 
        enum: ['weather', 'pest', 'disease', 'market', 'resource', 'policy'] 
      },
      probability: { type: Number, min: 0, max: 1 },
      impact: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'] 
      },
      description: String,
      mitigation: [String]
    }],
    recommendations: [String],
    confidence: {
      level: { type: Number, min: 0, max: 1 },
      factors: [String]
    }
  },
  historicalComparison: {
    lastSeason: {
      yield: Number,
      comparison: String, // e.g., "+15%"
      factors: [String]
    },
    fiveYearAverage: {
      yield: Number,
      comparison: String,
      trend: String
    },
    bestPerformance: {
      year: Number,
      yield: Number,
      comparison: String
    }
  },
  modelVersion: {
    type: String,
    required: true,
    index: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  accuracy: {
    historical: Number, // based on previous predictions vs actual
    factors: [String]
  },
  validationData: {
    crossValidationScore: Number,
    featureImportance: mongoose.Schema.Types.Mixed,
    modelMetrics: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'validated', 'outdated'],
    default: 'completed'
  },
  actualYield: {
    value: Number,
    unit: String,
    harvestDate: Date,
    quality: String,
    actualValue: Number,
    variance: Number, // difference from prediction
    accuracy: Number
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
yieldPredictionSchema.index({ user: 1, 'farmData.cropType': 1, createdAt: -1 });
yieldPredictionSchema.index({ user: 1, status: 1 });
yieldPredictionSchema.index({ user: 1, 'prediction.harvestWindow.optimal': 1 });

// Virtual for yield efficiency
yieldPredictionSchema.virtual('yieldEfficiency').get(function() {
  if (!this.prediction.expectedYield || !this.farmData.area) return 0;
  return Math.round(this.prediction.expectedYield / this.farmData.area);
});

// Virtual for ROI calculation
yieldPredictionSchema.virtual('expectedROI').get(function() {
  if (!this.prediction.estimatedValue || !this.prediction.profitMargin) return null;
  return {
    revenue: this.prediction.estimatedValue,
    profit: this.prediction.profitMargin,
    percentage: Math.round((this.prediction.profitMargin / this.prediction.estimatedValue) * 100)
  };
});

// Virtual for risk assessment
yieldPredictionSchema.virtual('overallRisk').get(function() {
  if (!this.prediction.risks || this.prediction.risks.length === 0) return 'low';
  
  const highRisks = this.prediction.risks.filter(r => 
    (r.impact === 'high' || r.impact === 'critical') && r.probability > 0.3
  ).length;
  
  if (highRisks > 0) return 'high';
  
  const mediumRisks = this.prediction.risks.filter(r => 
    r.impact === 'medium' && r.probability > 0.4
  ).length;
  
  if (mediumRisks > 1) return 'medium';
  return 'low';
});

// Method to check if prediction is still valid
yieldPredictionSchema.methods.isValid = function() {
  if (!this.prediction.harvestWindow.latest) return false;
  return new Date() < this.prediction.harvestWindow.latest;
};

// Method to get days until harvest
yieldPredictionSchema.methods.getDaysUntilHarvest = function() {
  if (!this.prediction.harvestWindow.optimal) return null;
  const now = new Date();
  const harvestDate = new Date(this.prediction.harvestWindow.optimal);
  const diffTime = harvestDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Method to update with actual results
yieldPredictionSchema.methods.updateWithActual = function(actualData) {
  this.actualYield = {
    value: actualData.yield,
    unit: actualData.unit || 'kg',
    harvestDate: actualData.harvestDate || new Date(),
    quality: actualData.quality,
    actualValue: actualData.value
  };
  
  // Calculate variance and accuracy
  if (this.prediction.expectedYield) {
    this.actualYield.variance = actualData.yield - this.prediction.expectedYield;
    this.actualYield.accuracy = 1 - Math.abs(this.actualYield.variance) / this.prediction.expectedYield;
  }
  
  this.status = 'validated';
  return this.save();
};

// Static method to get prediction accuracy statistics
yieldPredictionSchema.statics.getAccuracyStats = async function(userId, timeframe = 365) {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - timeframe);
  
  const pipeline = [
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: daysAgo },
        status: 'validated',
        'actualYield.accuracy': { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        averageAccuracy: { $avg: '$actualYield.accuracy' },
        totalPredictions: { $sum: 1 },
        highAccuracy: {
          $sum: { $cond: [{ $gte: ['$actualYield.accuracy', 0.9] }, 1, 0] }
        },
        mediumAccuracy: {
          $sum: { $cond: [{ $and: [{ $gte: ['$actualYield.accuracy', 0.7] }, { $lt: ['$actualYield.accuracy', 0.9] }] }, 1, 0] }
        },
        lowAccuracy: {
          $sum: { $cond: [{ $lt: ['$actualYield.accuracy', 0.7] }, 1, 0] }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    averageAccuracy: 0,
    totalPredictions: 0,
    highAccuracy: 0,
    mediumAccuracy: 0,
    lowAccuracy: 0
  };
};

// Static method to get yield trends
yieldPredictionSchema.statics.getYieldTrends = async function(userId, cropType, years = 5) {
  const yearsAgo = new Date();
  yearsAgo.setFullYear(yearsAgo.getFullYear() - years);
  
  const pipeline = [
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        'farmData.cropType': cropType,
        createdAt: { $gte: yearsAgo }
      }
    },
    {
      $group: {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        averageYield: { $avg: '$prediction.expectedYield' },
        totalArea: { $sum: '$farmData.area' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ];
  
  return await this.aggregate(pipeline);
};

// Pre-save middleware
yieldPredictionSchema.pre('save', function(next) {
  if (this.isNew) {
    // Calculate yield per hectare
    if (this.prediction.expectedYield && this.farmData.area) {
      this.prediction.yieldPerHectare = this.prediction.expectedYield / this.farmData.area;
    }
    
    // Set status based on harvest window
    if (this.prediction.harvestWindow.latest && new Date() > this.prediction.harvestWindow.latest) {
      this.status = 'outdated';
    }
  }
  next();
});

module.exports = mongoose.model('YieldPrediction', yieldPredictionSchema);
