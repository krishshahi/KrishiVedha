const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for demonstration
const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    location: "California, USA",
    joinDate: "2023-01-15",
    farmCount: 2
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1987654321",
    location: "Texas, USA",
    joinDate: "2023-03-20",
    farmCount: 1
  }
];

const farms = [
  {
    id: 1,
    userId: 1,
    name: "Green Valley Farm",
    location: "Fresno, CA",
    size: "150 acres",
    cropType: "Almonds",
    status: "Active",
    plantingDate: "2022-03-15",
    expectedHarvest: "2024-09-01",
    currentPhase: "Growing",
    soilType: "Sandy Loam",
    irrigationSystem: "Drip Irrigation",
    lastUpdated: "2024-01-10"
  },
  {
    id: 2,
    userId: 1,
    name: "Sunny Acres",
    location: "Modesto, CA",
    size: "200 acres",
    cropType: "Grapes",
    status: "Active",
    plantingDate: "2021-04-10",
    expectedHarvest: "2024-08-15",
    currentPhase: "Fruit Development",
    soilType: "Clay Loam",
    irrigationSystem: "Sprinkler",
    lastUpdated: "2024-01-08"
  },
  {
    id: 3,
    userId: 2,
    name: "Prairie Gold Farm",
    location: "Austin, TX",
    size: "300 acres",
    cropType: "Corn",
    status: "Active",
    plantingDate: "2023-05-01",
    expectedHarvest: "2024-10-15",
    currentPhase: "Tasseling",
    soilType: "Black Clay",
    irrigationSystem: "Center Pivot",
    lastUpdated: "2024-01-12"
  }
];

// API Routes

// Get all users
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: users
  });
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Get all farms
app.get('/api/farms', (req, res) => {
  const { userId } = req.query;
  let filteredFarms = farms;
  
  if (userId) {
    filteredFarms = farms.filter(farm => farm.userId === parseInt(userId));
  }
  
  res.json({
    success: true,
    data: filteredFarms
  });
});

// Get farm by ID
app.get('/api/farms/:id', (req, res) => {
  const farmId = parseInt(req.params.id);
  const farm = farms.find(f => f.id === farmId);
  
  if (!farm) {
    return res.status(404).json({
      success: false,
      message: 'Farm not found'
    });
  }
  
  res.json({
    success: true,
    data: farm
  });
});

// Create new farm
app.post('/api/farms', (req, res) => {
  const { userId, name, location, size, cropType, plantingDate, soilType, irrigationSystem } = req.body;
  
  if (!userId || !name || !location || !size || !cropType) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: userId, name, location, size, cropType'
    });
  }
  
  const newFarm = {
    id: farms.length + 1,
    userId: parseInt(userId),
    name,
    location,
    size,
    cropType,
    status: "Active",
    plantingDate: plantingDate || new Date().toISOString().split('T')[0],
    expectedHarvest: "",
    currentPhase: "Planning",
    soilType: soilType || "Unknown",
    irrigationSystem: irrigationSystem || "Manual",
    lastUpdated: new Date().toISOString().split('T')[0]
  };
  
  farms.push(newFarm);
  
  res.status(201).json({
    success: true,
    data: newFarm,
    message: 'Farm created successfully'
  });
});

// Update farm
app.put('/api/farms/:id', (req, res) => {
  const farmId = parseInt(req.params.id);
  const farmIndex = farms.findIndex(f => f.id === farmId);
  
  if (farmIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Farm not found'
    });
  }
  
  const updatedFarm = {
    ...farms[farmIndex],
    ...req.body,
    id: farmId, // Ensure ID doesn't change
    lastUpdated: new Date().toISOString().split('T')[0]
  };
  
  farms[farmIndex] = updatedFarm;
  
  res.json({
    success: true,
    data: updatedFarm,
    message: 'Farm updated successfully'
  });
});

// Delete farm
app.delete('/api/farms/:id', (req, res) => {
  const farmId = parseInt(req.params.id);
  const farmIndex = farms.findIndex(f => f.id === farmId);
  
  if (farmIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Farm not found'
    });
  }
  
  farms.splice(farmIndex, 1);
  
  res.json({
    success: true,
    message: 'Farm deleted successfully'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});

module.exports = app;

