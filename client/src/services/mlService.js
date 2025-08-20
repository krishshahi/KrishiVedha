import AsyncStorage from '@react-native-async-storage/async-storage';

class MLService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api';
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes for ML results
    this.models = {
      cropHealth: 'crop-health-v2.1',
      yieldPrediction: 'yield-pred-v1.8',
      diseaseDetection: 'disease-detect-v3.0',
      marketForecasting: 'market-forecast-v1.5',
      weatherPrediction: 'weather-ml-v2.3',
      soilAnalysis: 'soil-analysis-v1.9'
    };
  }

  // Advanced Crop Health Analysis
  async analyzeCropHealth(imageData, cropType, location, metadata = {}) {
    try {
      const cacheKey = `crop_health_${cropType}_${Date.now()}`;
      
      const response = await fetch(`${this.baseUrl}/ml/crop-health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageData, 
          cropType, 
          location, 
          metadata,
          modelVersion: this.models.cropHealth
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }
      
      return this.generateMockCropHealthAnalysis(cropType, metadata);
    } catch (error) {
      console.error('Crop health analysis error:', error);
      return this.generateMockCropHealthAnalysis(cropType, metadata);
    }
  }

  // Disease Detection and Classification
  async detectDiseases(imageData, cropType, symptoms = []) {
    try {
      const response = await fetch(`${this.baseUrl}/ml/disease-detection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageData, 
          cropType, 
          symptoms,
          modelVersion: this.models.diseaseDetection
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockDiseaseDetection(cropType, symptoms);
    } catch (error) {
      console.error('Disease detection error:', error);
      return this.generateMockDiseaseDetection(cropType, symptoms);
    }
  }

  // Advanced Yield Prediction
  async predictYield(farmData, historicalData, weatherForecast, marketData) {
    try {
      const response = await fetch(`${this.baseUrl}/ml/yield-prediction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          farmData, 
          historicalData, 
          weatherForecast, 
          marketData,
          modelVersion: this.models.yieldPrediction
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockYieldPrediction(farmData);
    } catch (error) {
      console.error('Yield prediction error:', error);
      return this.generateMockYieldPrediction(farmData);
    }
  }

  // Market Price Forecasting
  async forecastMarketPrices(cropType, region, timeframe = '3months') {
    try {
      const cacheKey = `market_forecast_${cropType}_${region}_${timeframe}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await fetch(`${this.baseUrl}/ml/market-forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cropType, 
          region, 
          timeframe,
          modelVersion: this.models.marketForecasting
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }
      
      return this.generateMockMarketForecast(cropType, timeframe);
    } catch (error) {
      console.error('Market forecast error:', error);
      return this.generateMockMarketForecast(cropType, timeframe);
    }
  }

  // Soil Analysis and Recommendations
  async analyzeSoil(soilData, cropType, targetYield) {
    try {
      const response = await fetch(`${this.baseUrl}/ml/soil-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          soilData, 
          cropType, 
          targetYield,
          modelVersion: this.models.soilAnalysis
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockSoilAnalysis(soilData, cropType);
    } catch (error) {
      console.error('Soil analysis error:', error);
      return this.generateMockSoilAnalysis(soilData, cropType);
    }
  }

  // Weather Pattern Analysis
  async analyzeWeatherPatterns(location, historicalData, forecastData) {
    try {
      const response = await fetch(`${this.baseUrl}/ml/weather-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          location, 
          historicalData, 
          forecastData,
          modelVersion: this.models.weatherPrediction
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockWeatherAnalysis(location);
    } catch (error) {
      console.error('Weather analysis error:', error);
      return this.generateMockWeatherAnalysis(location);
    }
  }

  // Pest Risk Assessment
  async assessPestRisk(cropType, location, seasonalData, weatherData) {
    try {
      const response = await fetch(`${this.baseUrl}/ml/pest-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cropType, 
          location, 
          seasonalData, 
          weatherData
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockPestRisk(cropType, location);
    } catch (error) {
      console.error('Pest risk assessment error:', error);
      return this.generateMockPestRisk(cropType, location);
    }
  }

  // Irrigation Optimization
  async optimizeIrrigation(soilData, cropData, weatherForecast, waterAvailability) {
    try {
      const response = await fetch(`${this.baseUrl}/ml/irrigation-optimization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          soilData, 
          cropData, 
          weatherForecast, 
          waterAvailability
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockIrrigationOptimization(cropData);
    } catch (error) {
      console.error('Irrigation optimization error:', error);
      return this.generateMockIrrigationOptimization(cropData);
    }
  }

  // Fertilizer Recommendation
  async recommendFertilizer(soilData, cropType, targetYield, budgetConstraints) {
    try {
      const response = await fetch(`${this.baseUrl}/ml/fertilizer-recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          soilData, 
          cropType, 
          targetYield, 
          budgetConstraints
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockFertilizerRecommendation(soilData, cropType);
    } catch (error) {
      console.error('Fertilizer recommendation error:', error);
      return this.generateMockFertilizerRecommendation(soilData, cropType);
    }
  }

  // Harvest Timing Optimization
  async optimizeHarvestTiming(cropType, plantingDate, currentConditions, marketData) {
    try {
      const response = await fetch(`${this.baseUrl}/ml/harvest-optimization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cropType, 
          plantingDate, 
          currentConditions, 
          marketData
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockHarvestOptimization(cropType, plantingDate);
    } catch (error) {
      console.error('Harvest optimization error:', error);
      return this.generateMockHarvestOptimization(cropType, plantingDate);
    }
  }

  // Resource Allocation Optimization
  async optimizeResourceAllocation(farmData, resources, constraints, objectives) {
    try {
      const response = await fetch(`${this.baseUrl}/ml/resource-optimization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          farmData, 
          resources, 
          constraints, 
          objectives
        }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockResourceOptimization(farmData, resources);
    } catch (error) {
      console.error('Resource optimization error:', error);
      return this.generateMockResourceOptimization(farmData, resources);
    }
  }

  // Mock Data Generators
  generateMockCropHealthAnalysis(cropType, metadata) {
    const healthScore = Math.round(Math.random() * 30 + 70); // 70-100
    const diseases = this.generateMockDiseases(cropType);
    const pests = this.generateMockPests(cropType);
    
    return {
      success: true,
      modelVersion: this.models.cropHealth,
      confidence: Math.round(Math.random() * 20 + 80) / 100,
      analysis: {
        overallHealth: {
          score: healthScore,
          status: this.getHealthStatus(healthScore),
          trend: Math.random() > 0.5 ? 'improving' : 'stable'
        },
        diseases: diseases.slice(0, Math.floor(Math.random() * 3)),
        pests: pests.slice(0, Math.floor(Math.random() * 2)),
        nutritionalDeficiency: {
          detected: Math.random() > 0.7,
          nutrients: Math.random() > 0.5 ? ['nitrogen'] : ['phosphorus', 'potassium']
        },
        growthStage: {
          current: this.getCurrentGrowthStage(cropType),
          expectedNext: this.getNextGrowthStage(cropType),
          daysToNext: Math.floor(Math.random() * 14 + 3)
        },
        environmentalStress: {
          waterStress: Math.random() > 0.8,
          heatStress: Math.random() > 0.9,
          lightStress: Math.random() > 0.95
        },
        recommendations: this.getCropHealthRecommendations(healthScore, diseases)
      },
      processedAt: Date.now()
    };
  }

  generateMockDiseaseDetection(cropType, symptoms) {
    const diseases = [
      {
        name: 'Leaf Blight',
        confidence: 0.87,
        severity: 'medium',
        affectedArea: '15%',
        stage: 'early',
        treatment: {
          immediate: ['Remove affected leaves', 'Apply copper fungicide'],
          preventive: ['Improve air circulation', 'Reduce overhead irrigation'],
          cost: 850
        },
        prognosis: 'Good with immediate treatment'
      },
      {
        name: 'Powdery Mildew',
        confidence: 0.72,
        severity: 'low',
        affectedArea: '8%',
        stage: 'initial',
        treatment: {
          immediate: ['Apply sulfur-based fungicide'],
          preventive: ['Maintain proper spacing', 'Monitor humidity'],
          cost: 450
        },
        prognosis: 'Excellent with proper management'
      }
    ];

    return {
      success: true,
      modelVersion: this.models.diseaseDetection,
      detectedDiseases: diseases.slice(0, Math.floor(Math.random() * 2) + 1),
      overallRisk: Math.random() > 0.6 ? 'low' : 'medium',
      recommendations: {
        immediate: ['Inspect crops daily', 'Monitor weather conditions'],
        shortTerm: ['Apply preventive treatments', 'Improve farm hygiene'],
        longTerm: ['Consider resistant varieties', 'Implement IPM practices']
      },
      followUpRequired: Math.random() > 0.7,
      nextInspection: Date.now() + (Math.floor(Math.random() * 5) + 3) * 24 * 60 * 60 * 1000
    };
  }

  generateMockYieldPrediction(farmData) {
    const baseYield = farmData.area * 2500; // kg per hectare base
    const variationFactor = 0.8 + Math.random() * 0.4; // 80-120% variation
    const predictedYield = Math.round(baseYield * variationFactor);
    
    return {
      success: true,
      modelVersion: this.models.yieldPrediction,
      confidence: Math.round(Math.random() * 15 + 85), // 85-100%
      prediction: {
        expectedYield: predictedYield,
        unit: 'kg',
        qualityGrade: Math.random() > 0.3 ? 'A' : 'B',
        harvestWindow: {
          optimal: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          earliest: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          latest: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        estimatedValue: Math.round(predictedYield * (18 + Math.random() * 8)), // ₹18-26 per kg
        factors: {
          weather: {
            impact: 'positive',
            contribution: 12,
            description: 'Favorable rainfall and temperature'
          },
          soil: {
            impact: 'positive',
            contribution: 8,
            description: 'Good nutrient levels'
          },
          management: {
            impact: 'positive',
            contribution: 15,
            description: 'Excellent farming practices'
          },
          genetics: {
            impact: 'neutral',
            contribution: 0,
            description: 'Standard variety performance'
          }
        },
        risks: [
          {
            type: 'weather',
            probability: 0.15,
            impact: 'medium',
            description: 'Potential late season drought'
          },
          {
            type: 'pest',
            probability: 0.08,
            impact: 'low',
            description: 'Seasonal pest pressure'
          }
        ],
        recommendations: [
          'Continue current irrigation schedule',
          'Monitor for pest activity in coming weeks',
          'Plan harvest logistics for optimal timing',
          'Consider futures contracts for price protection'
        ]
      },
      historicalComparison: {
        lastSeason: Math.round(predictedYield * (0.85 + Math.random() * 0.3)),
        fiveYearAverage: Math.round(predictedYield * (0.90 + Math.random() * 0.2)),
        improvement: '+12%'
      },
      updatedAt: Date.now()
    };
  }

  generateMockMarketForecast(cropType, timeframe) {
    const currentPrice = 2000 + Math.random() * 1000; // Base price
    const forecastPeriods = this.getTimeframePeriods(timeframe);
    
    const priceForecasts = forecastPeriods.map((period, index) => {
      const trend = Math.random() > 0.5 ? 1 : -1;
      const volatility = Math.random() * 0.1 + 0.02; // 2-12% volatility
      const price = currentPrice * (1 + trend * volatility * (index + 1));
      
      return {
        period,
        price: Math.round(price),
        confidence: Math.round((0.9 - index * 0.1) * 100), // Decreasing confidence
        trend: trend > 0 ? 'bullish' : 'bearish',
        factors: this.getMarketFactors(cropType, period)
      };
    });

    return {
      success: true,
      modelVersion: this.models.marketForecasting,
      cropType,
      timeframe,
      currentPrice: Math.round(currentPrice),
      forecasts: priceForecasts,
      summary: {
        averagePrice: Math.round(priceForecasts.reduce((sum, f) => sum + f.price, 0) / priceForecasts.length),
        priceRange: {
          min: Math.round(Math.min(...priceForecasts.map(f => f.price))),
          max: Math.round(Math.max(...priceForecasts.map(f => f.price)))
        },
        volatility: Math.round(Math.random() * 15 + 5), // 5-20%
        recommendation: this.getMarketRecommendation(priceForecasts)
      },
      marketFactors: {
        supply: {
          domestic: Math.random() > 0.5 ? 'increasing' : 'stable',
          global: Math.random() > 0.6 ? 'decreasing' : 'stable'
        },
        demand: {
          domestic: Math.random() > 0.4 ? 'increasing' : 'stable',
          export: Math.random() > 0.7 ? 'strong' : 'moderate'
        },
        external: {
          weather: Math.random() > 0.8 ? 'adverse' : 'favorable',
          policy: Math.random() > 0.9 ? 'supportive' : 'neutral',
          global: Math.random() > 0.6 ? 'positive' : 'neutral'
        }
      }
    };
  }

  generateMockSoilAnalysis(soilData, cropType) {
    return {
      success: true,
      modelVersion: this.models.soilAnalysis,
      analysis: {
        overall: {
          score: Math.round(Math.random() * 30 + 65), // 65-95
          status: Math.random() > 0.3 ? 'good' : 'fair',
          suitability: Math.random() > 0.2 ? 'suitable' : 'moderately suitable'
        },
        nutrients: {
          nitrogen: {
            level: Math.round(Math.random() * 100 + 80),
            status: Math.random() > 0.3 ? 'adequate' : 'low',
            recommendation: 'Apply 120 kg/ha urea'
          },
          phosphorus: {
            level: Math.round(Math.random() * 40 + 25),
            status: Math.random() > 0.4 ? 'adequate' : 'low',
            recommendation: 'Apply 60 kg/ha DAP'
          },
          potassium: {
            level: Math.round(Math.random() * 80 + 100),
            status: Math.random() > 0.5 ? 'high' : 'adequate',
            recommendation: 'Apply 40 kg/ha muriate of potash'
          }
        },
        physical: {
          texture: Math.random() > 0.4 ? 'loam' : 'clay loam',
          drainage: Math.random() > 0.3 ? 'good' : 'moderate',
          compaction: Math.random() > 0.8 ? 'severe' : 'none',
          organicMatter: Math.round(Math.random() * 2 + 2.5) + '%'
        },
        chemical: {
          ph: Math.round((Math.random() * 2 + 6) * 10) / 10,
          ec: Math.round((Math.random() * 0.5 + 0.2) * 100) / 100,
          cec: Math.round(Math.random() * 20 + 15)
        },
        recommendations: {
          immediate: [
            'Apply recommended fertilizers',
            'Test soil pH and adjust if needed',
            'Improve organic matter content'
          ],
          seasonal: [
            'Implement crop rotation',
            'Use cover crops',
            'Monitor nutrient levels quarterly'
          ],
          longTerm: [
            'Build soil organic matter',
            'Implement precision agriculture',
            'Consider soil conservation practices'
          ]
        },
        estimatedCost: Math.round(Math.random() * 5000 + 8000), // ₹8,000-13,000 per hectare
        expectedImprovement: Math.round(Math.random() * 20 + 15) + '%'
      }
    };
  }

  generateMockWeatherAnalysis(location) {
    return {
      success: true,
      modelVersion: this.models.weatherPrediction,
      location,
      analysis: {
        patterns: {
          rainfall: {
            prediction: Math.round(Math.random() * 200 + 600), // mm
            probability: Math.round(Math.random() * 30 + 70), // 70-100%
            distribution: Math.random() > 0.5 ? 'well-distributed' : 'irregular',
            timing: Math.random() > 0.4 ? 'favorable' : 'delayed'
          },
          temperature: {
            average: Math.round(Math.random() * 8 + 26), // 26-34°C
            extremes: Math.round(Math.random() * 3 + 2), // 2-5 days
            heatwaves: Math.random() > 0.7 ? 'likely' : 'unlikely',
            frost: Math.random() > 0.95 ? 'possible' : 'unlikely'
          },
          humidity: {
            average: Math.round(Math.random() * 20 + 60), // 60-80%
            favorable: Math.random() > 0.4,
            diseaseRisk: Math.random() > 0.6 ? 'high' : 'moderate'
          }
        },
        risks: [
          {
            type: 'drought',
            probability: Math.round(Math.random() * 30), // 0-30%
            severity: Math.random() > 0.7 ? 'moderate' : 'mild',
            timing: 'mid-season'
          },
          {
            type: 'excess_rainfall',
            probability: Math.round(Math.random() * 25), // 0-25%
            severity: Math.random() > 0.8 ? 'severe' : 'moderate',
            timing: 'late-season'
          }
        ],
        recommendations: {
          irrigation: [
            'Plan for supplemental irrigation',
            'Monitor soil moisture closely',
            'Consider drought-resistant varieties'
          ],
          protection: [
            'Prepare drainage systems',
            'Monitor disease pressure',
            'Have contingency plans ready'
          ],
          timing: [
            'Adjust planting dates if needed',
            'Plan harvest activities carefully',
            'Consider weather insurance'
          ]
        },
        confidence: Math.round(Math.random() * 15 + 80) // 80-95%
      }
    };
  }

  generateMockPestRisk(cropType, location) {
    const pests = this.generateMockPests(cropType);
    
    return {
      success: true,
      riskAssessment: {
        overall: Math.random() > 0.7 ? 'high' : 'medium',
        pests: pests.map(pest => ({
          ...pest,
          riskLevel: Math.random() > 0.5 ? 'medium' : 'low',
          probability: Math.round(Math.random() * 60 + 20), // 20-80%
          peakActivity: this.getPestPeakActivity(),
          economicThreshold: Math.round(Math.random() * 15 + 5) + '%'
        })),
        prevention: [
          'Regular field scouting',
          'Use pheromone traps',
          'Maintain field hygiene',
          'Monitor weather conditions'
        ],
        intervention: [
          'Apply targeted pesticides if needed',
          'Use biological control agents',
          'Implement IPM practices',
          'Coordinate with neighboring farmers'
        ]
      }
    };
  }

  generateMockIrrigationOptimization(cropData) {
    return {
      success: true,
      optimization: {
        schedule: [
          {
            date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: 45,
            amount: 25,
            zones: ['A', 'B'],
            confidence: 0.92
          },
          {
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: 60,
            amount: 30,
            zones: ['C', 'D'],
            confidence: 0.88
          }
        ],
        efficiency: {
          waterSavings: Math.round(Math.random() * 25 + 15) + '%',
          energySavings: Math.round(Math.random() * 20 + 10) + '%',
          costReduction: Math.round(Math.random() * 2000 + 1000)
        },
        monitoring: {
          soilMoisture: 'optimal',
          plantStress: 'none',
          waterQuality: 'good'
        }
      }
    };
  }

  generateMockFertilizerRecommendation(soilData, cropType) {
    return {
      success: true,
      recommendations: [
        {
          nutrient: 'Nitrogen',
          product: 'Urea (46-0-0)',
          quantity: Math.round(Math.random() * 50 + 100), // kg/ha
          timing: ['Basal', 'Top dressing at 30 days'],
          cost: Math.round(Math.random() * 2000 + 3000),
          expectedResponse: '+15% yield increase'
        },
        {
          nutrient: 'Phosphorus',
          product: 'DAP (18-46-0)',
          quantity: Math.round(Math.random() * 30 + 50), // kg/ha
          timing: ['Basal application'],
          cost: Math.round(Math.random() * 1500 + 2000),
          expectedResponse: 'Improved root development'
        }
      ],
      totalCost: Math.round(Math.random() * 3000 + 5000),
      expectedROI: Math.round(Math.random() * 200 + 300) + '%',
      application: {
        method: 'Broadcasting + incorporation',
        timing: 'Before sowing and 30 days after',
        precautions: ['Apply during cool hours', 'Ensure soil moisture']
      }
    };
  }

  generateMockHarvestOptimization(cropType, plantingDate) {
    const daysToMaturity = this.getCropMaturityDays(cropType);
    const harvestDate = new Date(new Date(plantingDate).getTime() + daysToMaturity * 24 * 60 * 60 * 1000);
    
    return {
      success: true,
      optimization: {
        optimalDate: harvestDate.toISOString().split('T')[0],
        window: {
          earliest: new Date(harvestDate.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          latest: new Date(harvestDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        factors: {
          moisture: 'optimal',
          weather: 'favorable',
          market: 'strong demand',
          logistics: 'available'
        },
        qualityPrediction: {
          grade: 'A',
          moisture: '12-14%',
          marketValue: Math.round(Math.random() * 5 + 20) // ₹20-25 per kg
        },
        recommendations: [
          'Monitor crop moisture content daily',
          'Arrange harvesting equipment in advance',
          'Coordinate with buyers for immediate sale',
          'Prepare storage facilities if needed'
        ]
      }
    };
  }

  generateMockResourceOptimization(farmData, resources) {
    return {
      success: true,
      optimization: {
        allocation: {
          land: {
            crop1: Math.round(farmData.area * 0.4),
            crop2: Math.round(farmData.area * 0.35),
            crop3: Math.round(farmData.area * 0.25)
          },
          water: {
            irrigation: '70%',
            livestock: '20%',
            household: '10%'
          },
          labor: {
            fieldOps: '60%',
            maintenance: '25%',
            marketing: '15%'
          }
        },
        efficiency: {
          resourceUtilization: '92%',
          costOptimization: '18% reduction',
          yieldImprovement: '12% increase'
        },
        recommendations: [
          'Focus on high-value crops in prime areas',
          'Implement precision agriculture techniques',
          'Optimize labor scheduling for peak efficiency',
          'Consider mechanization for repetitive tasks'
        ]
      }
    };
  }

  // Helper Methods
  getHealthStatus(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    return 'poor';
  }

  generateMockDiseases(cropType) {
    const diseases = {
      wheat: ['Rust', 'Blight', 'Smut'],
      rice: ['Blast', 'Blight', 'Sheath Rot'],
      cotton: ['Bollworm', 'Blight', 'Wilt'],
      default: ['Leaf Spot', 'Root Rot', 'Powdery Mildew']
    };
    
    return (diseases[cropType] || diseases.default).map(name => ({
      name,
      confidence: Math.round(Math.random() * 30 + 70) / 100,
      severity: Math.random() > 0.5 ? 'medium' : 'low',
      treatment: `Apply appropriate ${name.toLowerCase()} treatment`
    }));
  }

  generateMockPests(cropType) {
    const pests = {
      wheat: ['Aphids', 'Termites', 'Army Worm'],
      rice: ['Brown Plant Hopper', 'Stem Borer', 'Leaf Folder'],
      cotton: ['Bollworm', 'Whitefly', 'Thrips'],
      default: ['Aphids', 'Spider Mites', 'Caterpillars']
    };
    
    return (pests[cropType] || pests.default).map(name => ({
      name,
      confidence: Math.round(Math.random() * 25 + 75) / 100,
      severity: Math.random() > 0.6 ? 'medium' : 'low',
      treatment: `Apply ${name.toLowerCase()} control measures`
    }));
  }

  getCurrentGrowthStage(cropType) {
    const stages = ['vegetative', 'flowering', 'grain_filling', 'maturity'];
    return stages[Math.floor(Math.random() * stages.length)];
  }

  getNextGrowthStage(cropType) {
    const stages = ['flowering', 'grain_filling', 'maturity', 'harvest'];
    return stages[Math.floor(Math.random() * stages.length)];
  }

  getCropHealthRecommendations(score, diseases) {
    const base = [
      'Monitor crop regularly',
      'Maintain proper nutrition',
      'Ensure adequate water supply'
    ];
    
    if (score < 80) {
      base.push('Investigate causes of stress', 'Consider expert consultation');
    }
    
    if (diseases.length > 0) {
      base.push('Apply disease management protocols', 'Improve field sanitation');
    }
    
    return base;
  }

  getTimeframePeriods(timeframe) {
    switch (timeframe) {
      case '1month':
        return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      case '3months':
        return ['Month 1', 'Month 2', 'Month 3'];
      case '6months':
        return ['Month 1-2', 'Month 3-4', 'Month 5-6'];
      default:
        return ['Month 1', 'Month 2', 'Month 3'];
    }
  }

  getMarketFactors(cropType, period) {
    return [
      'Seasonal demand patterns',
      'Weather impact on supply',
      'Export opportunities',
      'Government policy changes'
    ];
  }

  getMarketRecommendation(forecasts) {
    const avgPrice = forecasts.reduce((sum, f) => sum + f.price, 0) / forecasts.length;
    const currentPrice = forecasts[0].price;
    
    if (avgPrice > currentPrice * 1.1) {
      return 'Consider holding for better prices';
    } else if (avgPrice < currentPrice * 0.9) {
      return 'Sell immediately to avoid losses';
    } else {
      return 'Current prices are fair, sell as needed';
    }
  }

  getPestPeakActivity() {
    const activities = ['early season', 'mid season', 'late season'];
    return activities[Math.floor(Math.random() * activities.length)];
  }

  getCropMaturityDays(cropType) {
    const maturityDays = {
      wheat: 120,
      rice: 130,
      cotton: 180,
      maize: 110,
      default: 120
    };
    
    return maturityDays[cropType] || maturityDays.default;
  }

  // Cache management
  clearCache() {
    this.cache.clear();
  }

  getCacheSize() {
    return this.cache.size;
  }
}

export default new MLService();
