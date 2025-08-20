const mongoose = require('mongoose');

const marketForecastSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  cropType: {
    type: String,
    required: true,
    index: true
  },
  region: {
    type: String,
    required: true,
    index: true
  },
  timeframe: {
    type: String,
    required: true,
    enum: ['1week', '2weeks', '1month', '3months', '6months']
  },
  forecast: {
    currentPrice: Number,
    forecasts: [{
      period: String,
      price: Number,
      confidence: Number,
      trend: String,
      factors: [String]
    }],
    summary: {
      averagePrice: Number,
      priceRange: {
        min: Number,
        max: Number
      },
      volatility: Number,
      recommendation: String
    },
    marketFactors: {
        supply: {
            domestic: String,
            global: String
        },
        demand: {
            domestic: String,
            export: String
        },
        external: {
            weather: String,
            policy: String,
            global: String
        }
    }
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

module.exports = mongoose.model('MarketForecast', marketForecastSchema);
