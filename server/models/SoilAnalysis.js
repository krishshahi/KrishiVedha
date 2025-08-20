const mongoose = require('mongoose');

const soilAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  soilData: {
    sampleId: String,
    location: {
      latitude: Number,
      longitude: Number,
      field: String,
      depth: Number
    },
    collectionDate: Date,
    labResults: mongoose.Schema.Types.Mixed
  },
  cropType: {
    type: String,
    required: true
  },
  targetYield: Number,
  analysis: {
    overall: {
      score: Number,
      status: String,
      suitability: String
    },
    nutrients: {
      nitrogen: {
        level: Number,
        status: String,
        recommendation: String
      },
      phosphorus: {
        level: Number,
        status: String,
        recommendation: String
      },
      potassium: {
        level: Number,
        status: String,
        recommendation: String
      }
    },
    physical: {
      texture: String,
      drainage: String,
      compaction: String,
      organicMatter: String
    },
    chemical: {
      ph: Number,
      ec: Number,
      cec: Number
    },
    recommendations: {
      immediate: [String],
      seasonal: [String],
      longTerm: [String]
    },
    estimatedCost: Number,
    expectedImprovement: String
  },
  modelVersion: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SoilAnalysis', soilAnalysisSchema);
