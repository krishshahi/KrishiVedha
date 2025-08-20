const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

class DataVisualizationService {
  constructor() {
    this.charts = new Map();
    this.chartRenderer = new ChartJSNodeCanvas({ 
      width: 800, 
      height: 600,
      backgroundColour: 'white'
    });
    this.smallChartRenderer = new ChartJSNodeCanvas({ 
      width: 400, 
      height: 300,
      backgroundColour: 'white'
    });
    this.initialized = false;
  }

  /**
   * Initialize data visualization service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('📊 Initializing Data Visualization Service...');
      
      // Ensure charts directory exists
      await this.ensureDirectoryExists('./public/charts');
      
      this.initialized = true;
      console.log('✅ Data Visualization Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Data Visualization Service:', error);
      throw error;
    }
  }

  /**
   * Generate yield trend chart
   */
  async generateYieldTrendChart(farmData, timeRange = '6m') {
    try {
      const chartId = uuidv4();
      const data = this.prepareYieldTrendData(farmData, timeRange);
      
      const configuration = {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'Actual Yield',
              data: data.actualYield,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Predicted Yield',
              data: data.predictedYield,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              borderDash: [5, 5],
              tension: 0.4,
            },
            {
              label: 'Target Yield',
              data: data.targetYield,
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              borderWidth: 1,
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Yield Trends - ${farmData.farmName || 'Farm'} (${timeRange})`,
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: true,
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Time Period'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Yield (kg/hectare)'
              },
              beginAtZero: false
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      };

      const imageBuffer = await this.chartRenderer.renderToBuffer(configuration);
      const chartPath = await this.saveChart(chartId, imageBuffer, 'yield-trend');
      
      const chartInfo = {
        id: chartId,
        type: 'yield_trend',
        title: 'Yield Trends',
        path: chartPath,
        data: data,
        config: configuration,
        farmId: farmData.farmId,
        timeRange,
        createdAt: new Date(),
      };

      this.charts.set(chartId, chartInfo);
      return chartInfo;
    } catch (error) {
      console.error('❌ Error generating yield trend chart:', error);
      throw error;
    }
  }

  /**
   * Generate resource utilization dashboard
   */
  async generateResourceDashboard(farmData) {
    try {
      const charts = [];
      
      // Water Usage Chart
      const waterChart = await this.generateWaterUsageChart(farmData);
      charts.push(waterChart);
      
      // Fertilizer Efficiency Chart
      const fertilizerChart = await this.generateFertilizerChart(farmData);
      charts.push(fertilizerChart);
      
      // Cost Analysis Chart
      const costChart = await this.generateCostAnalysisChart(farmData);
      charts.push(costChart);
      
      // Labor Distribution Chart
      const laborChart = await this.generateLaborChart(farmData);
      charts.push(laborChart);

      const dashboard = {
        id: uuidv4(),
        type: 'resource_dashboard',
        farmId: farmData.farmId,
        charts: charts,
        summary: this.generateResourceSummary(farmData),
        createdAt: new Date(),
      };

      return dashboard;
    } catch (error) {
      console.error('❌ Error generating resource dashboard:', error);
      throw error;
    }
  }

  /**
   * Generate disease pattern heatmap
   */
  async generateDiseaseHeatmap(diseaseData, region) {
    try {
      const chartId = uuidv4();
      const data = this.prepareDiseaseHeatmapData(diseaseData, region);
      
      const configuration = {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'Disease Incidents',
              data: data.incidents,
              backgroundColor: (context) => {
                const severity = context.parsed.y;
                if (severity > 0.7) return 'rgba(255, 0, 0, 0.8)';
                if (severity > 0.4) return 'rgba(255, 165, 0, 0.8)';
                return 'rgba(255, 255, 0, 0.8)';
              },
              pointRadius: (context) => {
                return Math.max(3, context.parsed.y * 15);
              }
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Disease Pattern Analysis - ${region}`,
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                title: (context) => `Location: ${data.locations[context[0].dataIndex]}`,
                label: (context) => `Severity: ${(context.parsed.y * 100).toFixed(1)}%`
              }
            }
          },
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              title: {
                display: true,
                text: 'Geographic Distribution'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Disease Severity'
              },
              min: 0,
              max: 1
            }
          }
        }
      };

      const imageBuffer = await this.chartRenderer.renderToBuffer(configuration);
      const chartPath = await this.saveChart(chartId, imageBuffer, 'disease-heatmap');
      
      const chartInfo = {
        id: chartId,
        type: 'disease_heatmap',
        title: 'Disease Pattern Heatmap',
        path: chartPath,
        data: data,
        config: configuration,
        region,
        createdAt: new Date(),
      };

      this.charts.set(chartId, chartInfo);
      return chartInfo;
    } catch (error) {
      console.error('❌ Error generating disease heatmap:', error);
      throw error;
    }
  }

  /**
   * Generate market price trends chart
   */
  async generateMarketTrendsChart(priceData, cropType) {
    try {
      const chartId = uuidv4();
      const data = this.prepareMarketTrendsData(priceData, cropType);
      
      const configuration = {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'Current Prices',
              data: data.currentPrices,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              fill: true,
            },
            {
              label: 'Predicted Prices',
              data: data.predictedPrices,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              borderDash: [10, 5],
            },
            {
              label: 'Market Average',
              data: data.marketAverage,
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.1)',
              pointRadius: 2,
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Market Price Trends - ${cropType.toUpperCase()}`,
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: true,
              position: 'top',
            }
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Price ($/unit)'
              }
            }
          }
        }
      };

      const imageBuffer = await this.chartRenderer.renderToBuffer(configuration);
      const chartPath = await this.saveChart(chartId, imageBuffer, 'market-trends');
      
      const chartInfo = {
        id: chartId,
        type: 'market_trends',
        title: `Market Trends - ${cropType}`,
        path: chartPath,
        data: data,
        config: configuration,
        cropType,
        createdAt: new Date(),
      };

      this.charts.set(chartId, chartInfo);
      return chartInfo;
    } catch (error) {
      console.error('❌ Error generating market trends chart:', error);
      throw error;
    }
  }

  /**
   * Generate weather correlation analysis
   */
  async generateWeatherCorrelationChart(weatherData, yieldData) {
    try {
      const chartId = uuidv4();
      const data = this.prepareWeatherCorrelationData(weatherData, yieldData);
      
      const configuration = {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: 'Rainfall vs Yield',
              data: data.rainfallYield,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgb(54, 162, 235)',
            },
            {
              label: 'Temperature vs Yield',
              data: data.temperatureYield,
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgb(255, 99, 132)',
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Weather vs Yield Correlation Analysis',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: true,
              position: 'top',
            }
          },
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              title: {
                display: true,
                text: 'Weather Factor'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Yield (kg/hectare)'
              }
            }
          }
        }
      };

      const imageBuffer = await this.chartRenderer.renderToBuffer(configuration);
      const chartPath = await this.saveChart(chartId, imageBuffer, 'weather-correlation');
      
      const chartInfo = {
        id: chartId,
        type: 'weather_correlation',
        title: 'Weather Correlation Analysis',
        path: chartPath,
        data: data,
        config: configuration,
        correlation: data.correlationCoefficient,
        createdAt: new Date(),
      };

      this.charts.set(chartId, chartInfo);
      return chartInfo;
    } catch (error) {
      console.error('❌ Error generating weather correlation chart:', error);
      throw error;
    }
  }

  /**
   * Generate farm comparison chart
   */
  async generateFarmComparisonChart(farmDataList, metric = 'yield') {
    try {
      const chartId = uuidv4();
      const data = this.prepareFarmComparisonData(farmDataList, metric);
      
      const configuration = {
        type: 'radar',
        data: {
          labels: data.labels,
          datasets: data.farms.map((farm, index) => ({
            label: farm.name,
            data: farm.values,
            borderColor: this.getColorPalette()[index],
            backgroundColor: this.getColorPalette()[index].replace('rgb', 'rgba').replace(')', ', 0.2)'),
            pointBackgroundColor: this.getColorPalette()[index],
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: this.getColorPalette()[index],
          }))
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Farm Performance Comparison - ${metric.toUpperCase()}`,
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: true,
              position: 'top',
            }
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 20
              }
            }
          }
        }
      };

      const imageBuffer = await this.chartRenderer.renderToBuffer(configuration);
      const chartPath = await this.saveChart(chartId, imageBuffer, 'farm-comparison');
      
      const chartInfo = {
        id: chartId,
        type: 'farm_comparison',
        title: `Farm Performance Comparison`,
        path: chartPath,
        data: data,
        config: configuration,
        metric,
        farmsCount: farmDataList.length,
        createdAt: new Date(),
      };

      this.charts.set(chartId, chartInfo);
      return chartInfo;
    } catch (error) {
      console.error('❌ Error generating farm comparison chart:', error);
      throw error;
    }
  }

  /**
   * Generate sustainability metrics chart
   */
  async generateSustainabilityChart(sustainabilityData) {
    try {
      const chartId = uuidv4();
      const data = this.prepareSustainabilityData(sustainabilityData);
      
      const configuration = {
        type: 'doughnut',
        data: {
          labels: data.labels,
          datasets: [{
            data: data.values,
            backgroundColor: [
              'rgba(75, 192, 192, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(255, 99, 132, 0.8)',
              'rgba(153, 102, 255, 0.8)',
            ],
            borderColor: [
              'rgb(75, 192, 192)',
              'rgb(54, 162, 235)',
              'rgb(255, 205, 86)',
              'rgb(255, 99, 132)',
              'rgb(153, 102, 255)',
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Sustainability Metrics Overview',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              display: true,
              position: 'right',
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${percentage}%`;
                }
              }
            }
          }
        }
      };

      const imageBuffer = await this.chartRenderer.renderToBuffer(configuration);
      const chartPath = await this.saveChart(chartId, imageBuffer, 'sustainability');
      
      const chartInfo = {
        id: chartId,
        type: 'sustainability',
        title: 'Sustainability Metrics',
        path: chartPath,
        data: data,
        config: configuration,
        overallScore: data.overallScore,
        createdAt: new Date(),
      };

      this.charts.set(chartId, chartInfo);
      return chartInfo;
    } catch (error) {
      console.error('❌ Error generating sustainability chart:', error);
      throw error;
    }
  }

  /**
   * Helper Methods for Data Preparation
   */
  prepareYieldTrendData(farmData, timeRange) {
    const months = this.getTimeRangeMonths(timeRange);
    const labels = months.map(m => moment(m).format('MMM YYYY'));
    
    return {
      labels,
      actualYield: months.map(() => Math.random() * 2000 + 4000),
      predictedYield: months.map(() => Math.random() * 1500 + 4200),
      targetYield: months.map(() => 5500), // Target yield line
    };
  }

  prepareDiseaseHeatmapData(diseaseData, region) {
    // Generate mock disease incident data points
    const incidents = Array.from({ length: 50 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 1,
    }));
    
    const locations = incidents.map((_, i) => `Location ${i + 1}`);
    
    return {
      incidents,
      locations,
      region,
    };
  }

  prepareMarketTrendsData(priceData, cropType) {
    const labels = this.getLast12Months();
    
    return {
      labels,
      currentPrices: labels.map(() => Math.random() * 20 + 40),
      predictedPrices: labels.map(() => Math.random() * 25 + 45),
      marketAverage: labels.map(() => Math.random() * 15 + 50),
    };
  }

  prepareWeatherCorrelationData(weatherData, yieldData) {
    const rainfallYield = Array.from({ length: 20 }, () => ({
      x: Math.random() * 200 + 100, // Rainfall mm
      y: Math.random() * 2000 + 4000, // Yield
    }));
    
    const temperatureYield = Array.from({ length: 20 }, () => ({
      x: Math.random() * 15 + 20, // Temperature C
      y: Math.random() * 2000 + 4000, // Yield
    }));
    
    return {
      rainfallYield,
      temperatureYield,
      correlationCoefficient: {
        rainfall: Math.random() * 0.6 + 0.3, // 0.3 to 0.9
        temperature: Math.random() * 0.4 + 0.4, // 0.4 to 0.8
      }
    };
  }

  prepareFarmComparisonData(farmDataList, metric) {
    const labels = ['Yield', 'Efficiency', 'Sustainability', 'Cost-Effectiveness', 'Innovation'];
    
    const farms = farmDataList.map(farm => ({
      name: farm.name,
      values: labels.map(() => Math.random() * 40 + 60), // 60-100 range
    }));
    
    return { labels, farms };
  }

  prepareSustainabilityData(sustainabilityData) {
    const labels = ['Water Efficiency', 'Soil Health', 'Biodiversity', 'Carbon Footprint', 'Waste Reduction'];
    const values = [85, 78, 92, 65, 88]; // Mock sustainability scores
    const overallScore = values.reduce((a, b) => a + b) / values.length;
    
    return { labels, values, overallScore };
  }

  /**
   * Generate smaller charts for dashboards
   */
  async generateWaterUsageChart(farmData) {
    const data = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Water Usage (L)',
        data: [1200, 1900, 3000, 5000, 2000, 3000],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      }]
    };

    const config = {
      type: 'bar',
      data,
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Water Usage Trends' },
          legend: { display: false }
        }
      }
    };

    const chartId = uuidv4();
    const imageBuffer = await this.smallChartRenderer.renderToBuffer(config);
    const chartPath = await this.saveChart(chartId, imageBuffer, 'water-usage');
    
    return {
      id: chartId,
      type: 'water_usage',
      path: chartPath,
      title: 'Water Usage',
      data
    };
  }

  async generateFertilizerChart(farmData) {
    const data = {
      labels: ['Nitrogen', 'Phosphorus', 'Potassium', 'Organic'],
      datasets: [{
        data: [30, 25, 20, 25],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)'
        ]
      }]
    };

    const config = {
      type: 'pie',
      data,
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Fertilizer Distribution' },
          legend: { position: 'bottom' }
        }
      }
    };

    const chartId = uuidv4();
    const imageBuffer = await this.smallChartRenderer.renderToBuffer(config);
    const chartPath = await this.saveChart(chartId, imageBuffer, 'fertilizer-dist');
    
    return {
      id: chartId,
      type: 'fertilizer_distribution',
      path: chartPath,
      title: 'Fertilizer Distribution',
      data
    };
  }

  async generateCostAnalysisChart(farmData) {
    const data = {
      labels: ['Seeds', 'Fertilizer', 'Water', 'Labor', 'Equipment'],
      datasets: [{
        label: 'Cost ($)',
        data: [500, 800, 300, 1200, 600],
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 1
      }]
    };

    const config = {
      type: 'bar',
      data,
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Cost Breakdown' },
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    };

    const chartId = uuidv4();
    const imageBuffer = await this.smallChartRenderer.renderToBuffer(config);
    const chartPath = await this.saveChart(chartId, imageBuffer, 'cost-analysis');
    
    return {
      id: chartId,
      type: 'cost_analysis',
      path: chartPath,
      title: 'Cost Analysis',
      data
    };
  }

  async generateLaborChart(farmData) {
    const data = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [{
        label: 'Hours',
        data: [40, 35, 50, 45],
        fill: true,
        backgroundColor: 'rgba(255, 205, 86, 0.2)',
        borderColor: 'rgb(255, 205, 86)',
        tension: 0.4
      }]
    };

    const config = {
      type: 'line',
      data,
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Labor Hours' },
          legend: { display: false }
        }
      }
    };

    const chartId = uuidv4();
    const imageBuffer = await this.smallChartRenderer.renderToBuffer(config);
    const chartPath = await this.saveChart(chartId, imageBuffer, 'labor-hours');
    
    return {
      id: chartId,
      type: 'labor_hours',
      path: chartPath,
      title: 'Labor Distribution',
      data
    };
  }

  /**
   * Utility Methods
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async saveChart(chartId, imageBuffer, prefix = 'chart') {
    const filename = `${prefix}-${chartId}.png`;
    const filepath = path.join('./public/charts', filename);
    await fs.writeFile(filepath, imageBuffer);
    return `/charts/${filename}`;
  }

  getTimeRangeMonths(timeRange) {
    const ranges = {
      '3m': 3, '6m': 6, '12m': 12, '24m': 24
    };
    const months = ranges[timeRange] || 6;
    
    return Array.from({ length: months }, (_, i) => 
      moment().subtract(months - 1 - i, 'months')
    );
  }

  getLast12Months() {
    return Array.from({ length: 12 }, (_, i) => 
      moment().subtract(11 - i, 'months').format('MMM')
    );
  }

  getColorPalette() {
    return [
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 205, 86)',
      'rgb(75, 192, 192)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)',
      'rgb(199, 199, 199)',
      'rgb(83, 102, 255)',
    ];
  }

  generateResourceSummary(farmData) {
    return {
      totalCost: '$3,400',
      efficiency: '87%',
      waterSaved: '15%',
      recommendation: 'Consider drip irrigation for better water efficiency',
    };
  }

  /**
   * Get chart by ID
   */
  getChart(chartId) {
    return this.charts.get(chartId);
  }

  /**
   * Get all charts for a farm
   */
  getFarmCharts(farmId) {
    return Array.from(this.charts.values())
      .filter(chart => chart.farmId === farmId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Delete old charts (cleanup)
   */
  async cleanupOldCharts(olderThanDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    for (const [chartId, chart] of this.charts.entries()) {
      if (chart.createdAt < cutoffDate) {
        try {
          // Delete file
          const fullPath = path.join('./public', chart.path);
          await fs.unlink(fullPath);
          
          // Remove from memory
          this.charts.delete(chartId);
        } catch (error) {
          console.error(`Failed to delete chart ${chartId}:`, error);
        }
      }
    }
  }

  /**
   * Health check
   */
  healthCheck() {
    return {
      status: this.initialized ? 'healthy' : 'initializing',
      chartsGenerated: this.charts.size,
      memoryUsage: process.memoryUsage(),
      lastCleanup: new Date(),
    };
  }
}

module.exports = new DataVisualizationService();
