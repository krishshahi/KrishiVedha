const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
  location: {
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true,
        index: '2dsphere'
      }
    },
    address: String,
    city: String,
    country: String
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm'
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  current: {
    temperature: {
      celsius: Number,
      fahrenheit: Number
    },
    humidity: {
      type: Number,
      min: 0,
      max: 100
    },
    pressure: Number,
    visibility: Number,
    uvIndex: Number,
    windSpeed: Number,
    windDirection: Number,
    precipitation: {
      amount: Number,
      type: {
        type: String,
        enum: ['none', 'rain', 'snow', 'sleet', 'hail']
      }
    },
    conditions: {
      main: String,
      description: String,
      icon: String
    },
    cloudCover: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  forecast: [{
    date: Date,
    temperature: {
      high: Number,
      low: Number
    },
    humidity: Number,
    precipitation: {
      chance: Number,
      amount: Number
    },
    windSpeed: Number,
    conditions: {
      main: String,
      description: String,
      icon: String
    }
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['warning', 'watch', 'advisory']
    },
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe', 'extreme']
    },
    title: String,
    description: String,
    startTime: Date,
    endTime: Date,
    areas: [String]
  }],
  soilTemperature: {
    surface: Number,
    depth10cm: Number,
    depth50cm: Number
  },
  evapotranspiration: Number,
  dewPoint: Number,
  dataSource: {
    provider: String,
    lastUpdated: Date,
    reliability: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }
}, {
  timestamps: true
});

// Index for location-based queries
weatherDataSchema.index({ 'location.coordinates': '2dsphere' });
weatherDataSchema.index({ farm: 1 });
weatherDataSchema.index({ timestamp: -1 });
weatherDataSchema.index({ 'forecast.date': 1 });

// Method to get weather summary
weatherDataSchema.methods.getSummary = function() {
  return {
    temperature: this.current.temperature.celsius,
    humidity: this.current.humidity,
    conditions: this.current.conditions.main,
    precipitation: this.current.precipitation.amount || 0,
    windSpeed: this.current.windSpeed
  };
};

// Method to check for weather alerts
weatherDataSchema.methods.hasActiveAlerts = function() {
  const now = new Date();
  return this.alerts.some(alert => 
    new Date(alert.startTime) <= now && new Date(alert.endTime) >= now
  );
};

// Static method to find weather by location
weatherDataSchema.statics.findByLocation = function(lat, lng, radiusInKm = 10) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radiusInKm * 1000 // Convert to meters
      }
    }
  }).sort({ timestamp: -1 }).limit(1);
};

module.exports = mongoose.model('WeatherData', weatherDataSchema);

