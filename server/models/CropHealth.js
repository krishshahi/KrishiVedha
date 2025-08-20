const mongoose = require('mongoose');

const cropHealthSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  cropType: {
    type: String,
    required: true,
    index: true,
    enum: ['wheat', 'rice', 'cotton', 'maize', 'sugarcane', 'potato', 'onion', 'tomato', 'other']
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
    region: { type: String },
    district: { type: String },
    state: { type: String }
  },
  imageData: {
    type: String, // In production, this would be a secure file reference
    required: false
  },
  analysis: {
    type: {
      type: String,
      enum: ['crop_health', 'disease_detection', 'pest_analysis'],
      default: 'crop_health'
    },
    overallHealth: {
      score: { type: Number, min: 0, max: 100 },
      status: { 
        type: String, 
        enum: ['excellent', 'good', 'fair', 'poor'] 
      },
      trend: { 
        type: String, 
        enum: ['improving', 'stable', 'declining'] 
      }
    },
    diseases: [{
      name: String,
      confidence: { type: Number, min: 0, max: 1 },
      severity: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'] 
      },
      affectedArea: String,
      stage: { 
        type: String, 
        enum: ['initial', 'early', 'moderate', 'advanced'] 
      },
      treatment: {
        immediate: [String],
        preventive: [String],
        cost: Number
      },
      prognosis: String
    }],
    pests: [{
      name: String,
      confidence: { type: Number, min: 0, max: 1 },
      severity: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'] 
      },
      riskLevel: String,
      probability: Number,
      peakActivity: String,
      economicThreshold: String,
      treatment: String
    }],
    nutritionalDeficiency: {
      detected: { type: Boolean, default: false },
      nutrients: [{
        type: String,
        enum: ['nitrogen', 'phosphorus', 'potassium', 'calcium', 'magnesium', 'sulfur', 'iron', 'zinc', 'manganese', 'copper', 'boron']
      }],
      severity: { 
        type: String, 
        enum: ['mild', 'moderate', 'severe'] 
      },
      recommendations: [String]
    },
    growthStage: {
      current: { 
        type: String, 
        enum: ['germination', 'seedling', 'vegetative', 'flowering', 'grain_filling', 'maturity', 'harvest'] 
      },
      expectedNext: String,
      daysToNext: Number,
      healthAtStage: String
    },
    environmentalStress: {
      waterStress: { type: Boolean, default: false },
      heatStress: { type: Boolean, default: false },
      lightStress: { type: Boolean, default: false },
      coldStress: { type: Boolean, default: false },
      windStress: { type: Boolean, default: false },
      salinity: { type: Boolean, default: false }
    },
    recommendations: [String],
    results: mongoose.Schema.Types.Mixed // For disease detection specific results
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
  processingTime: {
    type: Number, // milliseconds
    default: 0
  },
  metadata: {
    imageQuality: String,
    lightingConditions: String,
    weatherConditions: String,
    deviceInfo: String,
    captureDate: Date
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  nextInspection: Date,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'requires_review'],
    default: 'completed'
  },
  tags: [String],
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
cropHealthSchema.index({ user: 1, cropType: 1, createdAt: -1 });
cropHealthSchema.index({ user: 1, 'analysis.type': 1, createdAt: -1 });
cropHealthSchema.index({ user: 1, followUpRequired: 1, nextInspection: 1 });
cropHealthSchema.index({ user: 1, status: 1 });

// Virtual for health score interpretation
cropHealthSchema.virtual('healthScoreInterpretation').get(function() {
  if (!this.analysis || !this.analysis.overallHealth) return null;
  
  const score = this.analysis.overallHealth.score;
  if (score >= 90) return 'Excellent - Crop is in optimal health';
  if (score >= 80) return 'Good - Minor issues that can be easily managed';
  if (score >= 70) return 'Fair - Requires attention and intervention';
  return 'Poor - Immediate action required';
});

// Virtual for risk level
cropHealthSchema.virtual('overallRiskLevel').get(function() {
  if (!this.analysis) return 'unknown';
  
  const diseases = this.analysis.diseases || [];
  const pests = this.analysis.pests || [];
  const environmentalStress = this.analysis.environmentalStress || {};
  
  const highRiskDiseases = diseases.filter(d => d.severity === 'high' || d.severity === 'critical').length;
  const highRiskPests = pests.filter(p => p.severity === 'high' || p.severity === 'critical').length;
  const stressFactors = Object.values(environmentalStress).filter(Boolean).length;
  
  if (highRiskDiseases > 0 || highRiskPests > 0 || stressFactors >= 3) return 'high';
  if (diseases.length > 0 || pests.length > 0 || stressFactors >= 2) return 'medium';
  return 'low';
});

// Method to check if analysis is recent
cropHealthSchema.methods.isRecent = function(days = 7) {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  return this.createdAt >= daysAgo;
};

// Method to get priority actions
cropHealthSchema.methods.getPriorityActions = function() {
  if (!this.analysis) return [];
  
  const actions = [];
  const diseases = this.analysis.diseases || [];
  const pests = this.analysis.pests || [];
  
  // Add disease-related actions
  diseases.forEach(disease => {
    if (disease.severity === 'high' || disease.severity === 'critical') {
      actions.push({
        type: 'disease_treatment',
        priority: 'high',
        action: `Treat ${disease.name} immediately`,
        details: disease.treatment
      });
    }
  });
  
  // Add pest-related actions
  pests.forEach(pest => {
    if (pest.severity === 'high' || pest.severity === 'critical') {
      actions.push({
        type: 'pest_control',
        priority: 'high',
        action: `Control ${pest.name} infestation`,
        details: pest.treatment
      });
    }
  });
  
  // Add nutritional deficiency actions
  if (this.analysis.nutritionalDeficiency && this.analysis.nutritionalDeficiency.detected) {
    actions.push({
      type: 'nutrition',
      priority: 'medium',
      action: 'Address nutritional deficiencies',
      details: this.analysis.nutritionalDeficiency.recommendations
    });
  }
  
  return actions.sort((a, b) => {
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

// Static method to get health statistics for a user
cropHealthSchema.statics.getHealthStatistics = async function(userId, timeframe = 30) {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - timeframe);
  
  const pipeline = [
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: daysAgo },
        'analysis.overallHealth.score': { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        averageHealth: { $avg: '$analysis.overallHealth.score' },
        totalAnalyses: { $sum: 1 },
        excellentCount: {
          $sum: { $cond: [{ $gte: ['$analysis.overallHealth.score', 90] }, 1, 0] }
        },
        goodCount: {
          $sum: { $cond: [{ $and: [{ $gte: ['$analysis.overallHealth.score', 80] }, { $lt: ['$analysis.overallHealth.score', 90] }] }, 1, 0] }
        },
        fairCount: {
          $sum: { $cond: [{ $and: [{ $gte: ['$analysis.overallHealth.score', 70] }, { $lt: ['$analysis.overallHealth.score', 80] }] }, 1, 0] }
        },
        poorCount: {
          $sum: { $cond: [{ $lt: ['$analysis.overallHealth.score', 70] }, 1, 0] }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    averageHealth: 0,
    totalAnalyses: 0,
    excellentCount: 0,
    goodCount: 0,
    fairCount: 0,
    poorCount: 0
  };
};

// Static method to get disease trends
cropHealthSchema.statics.getDiseaseTrends = async function(userId, timeframe = 90) {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - timeframe);
  
  const pipeline = [
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: daysAgo },
        'analysis.diseases.0': { $exists: true }
      }
    },
    { $unwind: '$analysis.diseases' },
    {
      $group: {
        _id: '$analysis.diseases.name',
        count: { $sum: 1 },
        averageSeverity: { $avg: { $switch: {
          branches: [
            { case: { $eq: ['$analysis.diseases.severity', 'low'] }, then: 1 },
            { case: { $eq: ['$analysis.diseases.severity', 'medium'] }, then: 2 },
            { case: { $eq: ['$analysis.diseases.severity', 'high'] }, then: 3 },
            { case: { $eq: ['$analysis.diseases.severity', 'critical'] }, then: 4 }
          ],
          default: 1
        }}},
        latestOccurrence: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ];
  
  return await this.aggregate(pipeline);
};

// Pre-save middleware to calculate processing metrics
cropHealthSchema.pre('save', function(next) {
  if (this.isNew) {
    // Calculate processing time if not set
    if (!this.processingTime && this.metadata && this.metadata.captureDate) {
      this.processingTime = Date.now() - this.metadata.captureDate.getTime();
    }
    
    // Set follow-up requirements based on analysis
    if (this.analysis && this.analysis.diseases) {
      const criticalIssues = this.analysis.diseases.filter(d => 
        d.severity === 'high' || d.severity === 'critical'
      ).length;
      
      if (criticalIssues > 0) {
        this.followUpRequired = true;
        // Set next inspection in 3-5 days for critical issues
        this.nextInspection = new Date(Date.now() + (3 + Math.random() * 2) * 24 * 60 * 60 * 1000);
      }
    }
  }
  next();
});

module.exports = mongoose.model('CropHealth', cropHealthSchema);
