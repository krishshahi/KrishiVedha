import AsyncStorage from '@react-native-async-storage/async-storage';

class FinancialService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api';
    this.cache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
  }

  // Expense Management
  async getExpenses(farmId = null, dateRange = null, category = 'all') {
    try {
      const cacheKey = `expenses_${farmId}_${dateRange}_${category}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await fetch(`${this.baseUrl}/financial/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, dateRange, category }),
      });

      if (response.ok) {
        const data = await response.json();
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      }
      
      return this.generateMockExpenses(category);
    } catch (error) {
      console.error('Get expenses error:', error);
      return this.generateMockExpenses(category);
    }
  }

  async addExpense(expenseData) {
    try {
      const response = await fetch(`${this.baseUrl}/financial/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        this.clearExpenseCache();
        return await response.json();
      }
      
      return this.createMockExpense(expenseData);
    } catch (error) {
      console.error('Add expense error:', error);
      return this.createMockExpense(expenseData);
    }
  }

  // Revenue Management
  async getRevenue(farmId = null, dateRange = null) {
    try {
      const response = await fetch(`${this.baseUrl}/financial/revenue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, dateRange }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockRevenue();
    } catch (error) {
      console.error('Get revenue error:', error);
      return this.generateMockRevenue();
    }
  }

  async addRevenue(revenueData) {
    try {
      const response = await fetch(`${this.baseUrl}/financial/revenue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(revenueData),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.createMockRevenue(revenueData);
    } catch (error) {
      console.error('Add revenue error:', error);
      return this.createMockRevenue(revenueData);
    }
  }

  // Profit Analysis
  async getProfitAnalysis(farmId = null, period = '1year') {
    try {
      const response = await fetch(`${this.baseUrl}/financial/profit-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, period }),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockProfitAnalysis();
    } catch (error) {
      console.error('Profit analysis error:', error);
      return this.generateMockProfitAnalysis();
    }
  }

  // Budget Management
  async getBudgets() {
    try {
      const response = await fetch(`${this.baseUrl}/financial/budgets`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockBudgets();
    } catch (error) {
      console.error('Get budgets error:', error);
      return this.generateMockBudgets();
    }
  }

  async createBudget(budgetData) {
    try {
      const response = await fetch(`${this.baseUrl}/financial/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.createMockBudget(budgetData);
    } catch (error) {
      console.error('Create budget error:', error);
      return this.createMockBudget(budgetData);
    }
  }

  // Cost Analysis
  async getCostPerCrop(farmId = null, cropType = 'all') {
    try {
      const analysis = await this.calculateCostAnalysis(farmId, cropType);
      return {
        success: true,
        analysis: {
          cropType,
          totalCost: analysis.totalCost,
          costBreakdown: analysis.breakdown,
          costPerUnit: analysis.perUnit,
          profitability: analysis.profitability,
          recommendations: this.generateCostRecommendations(analysis)
        }
      };
    } catch (error) {
      console.error('Cost analysis error:', error);
      return this.generateMockCostAnalysis(cropType);
    }
  }

  // Investment Tracking
  async getInvestments() {
    try {
      const response = await fetch(`${this.baseUrl}/financial/investments`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockInvestments();
    } catch (error) {
      console.error('Get investments error:', error);
      return this.generateMockInvestments();
    }
  }

  async addInvestment(investmentData) {
    try {
      const response = await fetch(`${this.baseUrl}/financial/investments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(investmentData),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.createMockInvestment(investmentData);
    } catch (error) {
      console.error('Add investment error:', error);
      return this.createMockInvestment(investmentData);
    }
  }

  // Tax Management
  async getTaxSummary(year = new Date().getFullYear()) {
    try {
      const response = await fetch(`${this.baseUrl}/financial/tax-summary/${year}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockTaxSummary(year);
    } catch (error) {
      console.error('Tax summary error:', error);
      return this.generateMockTaxSummary(year);
    }
  }

  // Insurance Management
  async getInsurancePolicies() {
    try {
      const response = await fetch(`${this.baseUrl}/financial/insurance`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockInsurance();
    } catch (error) {
      console.error('Insurance error:', error);
      return this.generateMockInsurance();
    }
  }

  // Financial Reports
  async generateReport(reportType, parameters = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/financial/reports/${reportType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameters),
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockReport(reportType, parameters);
    } catch (error) {
      console.error('Generate report error:', error);
      return this.generateMockReport(reportType, parameters);
    }
  }

  // Loan Management
  async getLoans() {
    try {
      const response = await fetch(`${this.baseUrl}/financial/loans`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        return await response.json();
      }
      
      return this.generateMockLoans();
    } catch (error) {
      console.error('Get loans error:', error);
      return this.generateMockLoans();
    }
  }

  // Mock Data Generators
  generateMockExpenses(category = 'all') {
    const expenses = [
      {
        id: 'e1',
        description: 'Seeds - Wheat variety HI-1563',
        amount: 15000,
        category: 'seeds',
        date: Date.now() - 1000 * 60 * 60 * 24 * 5,
        farm: 'Field A',
        receipt: null,
        vendor: 'Krishna Seeds Ltd',
        paymentMethod: 'cash'
      },
      {
        id: 'e2',
        description: 'Fertilizer - DAP 50kg bags',
        amount: 8500,
        category: 'fertilizer',
        date: Date.now() - 1000 * 60 * 60 * 24 * 3,
        farm: 'Field B',
        receipt: null,
        vendor: 'Kisan Agro Center',
        paymentMethod: 'bank_transfer'
      },
      {
        id: 'e3',
        description: 'Tractor maintenance and repair',
        amount: 12000,
        category: 'equipment',
        date: Date.now() - 1000 * 60 * 60 * 24 * 7,
        farm: 'General',
        receipt: null,
        vendor: 'Mahindra Service Center',
        paymentMethod: 'cash'
      },
      {
        id: 'e4',
        description: 'Labor wages - Harvesting',
        amount: 25000,
        category: 'labor',
        date: Date.now() - 1000 * 60 * 60 * 24 * 2,
        farm: 'Field C',
        receipt: null,
        vendor: 'Local Workers',
        paymentMethod: 'cash'
      },
      {
        id: 'e5',
        description: 'Diesel fuel - 200 liters',
        amount: 18000,
        category: 'fuel',
        date: Date.now() - 1000 * 60 * 60 * 24 * 1,
        farm: 'General',
        receipt: null,
        vendor: 'HP Petrol Pump',
        paymentMethod: 'card'
      }
    ];

    return {
      success: true,
      expenses: category === 'all' ? expenses : expenses.filter(e => e.category === category),
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
      categoryBreakdown: this.calculateCategoryBreakdown(expenses)
    };
  }

  generateMockRevenue() {
    const revenue = [
      {
        id: 'r1',
        description: 'Wheat sale - 100 quintals',
        amount: 185000,
        crop: 'wheat',
        quantity: 10000,
        unit: 'kg',
        pricePerUnit: 18.5,
        date: Date.now() - 1000 * 60 * 60 * 24 * 10,
        buyer: 'Govt Procurement Center',
        paymentStatus: 'paid'
      },
      {
        id: 'r2',
        description: 'Tomato sale - Fresh produce',
        amount: 45000,
        crop: 'tomato',
        quantity: 1500,
        unit: 'kg',
        pricePerUnit: 30,
        date: Date.now() - 1000 * 60 * 60 * 24 * 5,
        buyer: 'Local Market',
        paymentStatus: 'paid'
      },
      {
        id: 'r3',
        description: 'Rice sale - Basmati variety',
        amount: 125000,
        crop: 'rice',
        quantity: 5000,
        unit: 'kg',
        pricePerUnit: 25,
        date: Date.now() - 1000 * 60 * 60 * 24 * 15,
        buyer: 'Export Company',
        paymentStatus: 'pending'
      }
    ];

    return {
      success: true,
      revenue: revenue,
      totalRevenue: revenue.reduce((sum, r) => sum + r.amount, 0),
      paidAmount: revenue.filter(r => r.paymentStatus === 'paid').reduce((sum, r) => sum + r.amount, 0),
      pendingAmount: revenue.filter(r => r.paymentStatus === 'pending').reduce((sum, r) => sum + r.amount, 0)
    };
  }

  generateMockProfitAnalysis() {
    const monthlyData = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const revenue = Math.random() * 100000 + 50000;
      const expenses = Math.random() * 60000 + 30000;
      
      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: Math.round(revenue),
        expenses: Math.round(expenses),
        profit: Math.round(revenue - expenses),
        profitMargin: Math.round(((revenue - expenses) / revenue) * 100)
      });
    }

    const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
    const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
    const totalProfit = totalRevenue - totalExpenses;

    return {
      success: true,
      analysis: {
        period: '12 months',
        totalRevenue,
        totalExpenses,
        totalProfit,
        profitMargin: Math.round((totalProfit / totalRevenue) * 100),
        monthlyData,
        trends: {
          revenueGrowth: 12.5,
          expenseGrowth: 8.2,
          profitGrowth: 18.3
        },
        insights: [
          'Revenue has grown by 12.5% compared to previous year',
          'Expenses increased by 8.2%, showing good cost control',
          'Best performing month was March with ₹85K profit',
          'Fertilizer costs represent 35% of total expenses'
        ]
      }
    };
  }

  generateMockBudgets() {
    return {
      success: true,
      budgets: [
        {
          id: 'b1',
          name: 'Wheat Season 2024',
          category: 'crop',
          totalBudget: 150000,
          spent: 89500,
          remaining: 60500,
          startDate: Date.now() - 1000 * 60 * 60 * 24 * 90,
          endDate: Date.now() + 1000 * 60 * 60 * 24 * 30,
          status: 'active',
          breakdown: [
            { category: 'Seeds', budgeted: 30000, spent: 25000 },
            { category: 'Fertilizer', budgeted: 45000, spent: 38500 },
            { category: 'Labor', budgeted: 40000, spent: 26000 },
            { category: 'Equipment', budgeted: 35000, spent: 0 }
          ]
        },
        {
          id: 'b2',
          name: 'Equipment Maintenance 2024',
          category: 'maintenance',
          totalBudget: 80000,
          spent: 45000,
          remaining: 35000,
          startDate: Date.now() - 1000 * 60 * 60 * 24 * 120,
          endDate: Date.now() + 1000 * 60 * 60 * 24 * 240,
          status: 'active',
          breakdown: [
            { category: 'Tractor Service', budgeted: 40000, spent: 25000 },
            { category: 'Equipment Repair', budgeted: 25000, spent: 20000 },
            { category: 'Parts & Spares', budgeted: 15000, spent: 0 }
          ]
        }
      ]
    };
  }

  generateMockInvestments() {
    return {
      success: true,
      investments: [
        {
          id: 'i1',
          name: 'Drip Irrigation System',
          amount: 250000,
          type: 'equipment',
          date: Date.now() - 1000 * 60 * 60 * 24 * 180,
          expectedROI: 25,
          actualROI: null,
          paybackPeriod: 36,
          status: 'active',
          description: 'Water-efficient irrigation for 5 hectares'
        },
        {
          id: 'i2',
          name: 'Solar Water Pump',
          amount: 180000,
          type: 'renewable_energy',
          date: Date.now() - 1000 * 60 * 60 * 24 * 365,
          expectedROI: 35,
          actualROI: 28,
          paybackPeriod: 42,
          status: 'completed',
          description: '5HP solar-powered water pump with battery backup'
        }
      ]
    };
  }

  generateMockTaxSummary(year) {
    return {
      success: true,
      summary: {
        year,
        totalIncome: 450000,
        agriculturalIncome: 420000,
        otherIncome: 30000,
        totalDeductions: 85000,
        taxableIncome: 365000,
        taxLiability: 18250,
        taxPaid: 15000,
        refundDue: 0,
        balanceDue: 3250,
        deductions: [
          { type: 'Equipment Depreciation', amount: 35000 },
          { type: 'Interest on Agricultural Loan', amount: 25000 },
          { type: 'Insurance Premiums', amount: 15000 },
          { type: 'Professional Consultation', amount: 10000 }
        ]
      }
    };
  }

  generateMockInsurance() {
    return {
      success: true,
      policies: [
        {
          id: 'ins1',
          type: 'Crop Insurance',
          provider: 'National Insurance Company',
          policyNumber: 'NIC/CROP/2024/123456',
          coverage: 350000,
          premium: 12250,
          crops: ['Wheat', 'Rice', 'Cotton'],
          startDate: Date.now() - 1000 * 60 * 60 * 24 * 30,
          endDate: Date.now() + 1000 * 60 * 60 * 24 * 335,
          status: 'active',
          claims: []
        },
        {
          id: 'ins2',
          type: 'Equipment Insurance',
          provider: 'IFFCO Tokio',
          policyNumber: 'IFFCO/EQP/2024/789012',
          coverage: 500000,
          premium: 18000,
          equipment: ['Tractor', 'Thresher', 'Irrigation Pump'],
          startDate: Date.now() - 1000 * 60 * 60 * 24 * 60,
          endDate: Date.now() + 1000 * 60 * 60 * 24 * 305,
          status: 'active',
          claims: [
            {
              id: 'cl1',
              type: 'Tractor Damage',
              amount: 45000,
              claimDate: Date.now() - 1000 * 60 * 60 * 24 * 20,
              status: 'approved',
              settledAmount: 42000
            }
          ]
        }
      ]
    };
  }

  generateMockLoans() {
    return {
      success: true,
      loans: [
        {
          id: 'l1',
          type: 'Kisan Credit Card',
          lender: 'State Bank of India',
          principalAmount: 300000,
          interestRate: 7.0,
          tenure: 12,
          startDate: Date.now() - 1000 * 60 * 60 * 24 * 90,
          endDate: Date.now() + 1000 * 60 * 60 * 24 * 275,
          outstandingAmount: 245000,
          monthlyEMI: 25830,
          status: 'active',
          purpose: 'Crop cultivation and working capital'
        },
        {
          id: 'l2',
          type: 'Equipment Loan',
          lender: 'NABARD',
          principalAmount: 500000,
          interestRate: 8.5,
          tenure: 60,
          startDate: Date.now() - 1000 * 60 * 60 * 24 * 365,
          endDate: Date.now() + 1000 * 60 * 60 * 24 * 1460,
          outstandingAmount: 425000,
          monthlyEMI: 10250,
          status: 'active',
          purpose: 'Tractor and agricultural equipment purchase'
        }
      ]
    };
  }

  // Helper Methods
  calculateCategoryBreakdown(expenses) {
    const breakdown = {};
    expenses.forEach(expense => {
      if (!breakdown[expense.category]) {
        breakdown[expense.category] = 0;
      }
      breakdown[expense.category] += expense.amount;
    });
    return breakdown;
  }

  calculateCostAnalysis(farmId, cropType) {
    // Mock calculation - in real app, this would query actual data
    const totalCost = 125000;
    const breakdown = {
      seeds: 25000,
      fertilizer: 35000,
      labor: 40000,
      equipment: 15000,
      fuel: 10000
    };

    return {
      totalCost,
      breakdown,
      perUnit: totalCost / 5000, // per kg
      profitability: 0.23 // 23% profit margin
    };
  }

  generateCostRecommendations(analysis) {
    return [
      'Consider bulk purchasing of fertilizers to reduce costs by 12%',
      'Labor costs can be optimized using mechanization',
      'Fuel consumption can be reduced with better equipment maintenance',
      'Explore government subsidies for seeds and fertilizers'
    ];
  }

  generateMockReport(reportType, parameters) {
    const reports = {
      profit_loss: {
        type: 'Profit & Loss Statement',
        period: parameters.period || '1 year',
        data: {
          totalRevenue: 650000,
          totalExpenses: 485000,
          grossProfit: 165000,
          netProfit: 142500,
          profitMargin: 21.9
        }
      },
      cash_flow: {
        type: 'Cash Flow Statement',
        period: parameters.period || '1 year',
        data: {
          openingBalance: 85000,
          totalInflows: 650000,
          totalOutflows: 485000,
          closingBalance: 250000
        }
      }
    };

    return {
      success: true,
      report: reports[reportType] || reports.profit_loss
    };
  }

  // Helper methods for mock data creation
  createMockExpense(expenseData) {
    return {
      success: true,
      expense: {
        id: Date.now().toString(),
        ...expenseData,
        date: Date.now(),
        createdAt: Date.now()
      }
    };
  }

  createMockRevenue(revenueData) {
    return {
      success: true,
      revenue: {
        id: Date.now().toString(),
        ...revenueData,
        date: Date.now(),
        createdAt: Date.now()
      }
    };
  }

  createMockBudget(budgetData) {
    return {
      success: true,
      budget: {
        id: Date.now().toString(),
        ...budgetData,
        spent: 0,
        remaining: budgetData.totalBudget,
        status: 'active',
        createdAt: Date.now()
      }
    };
  }

  createMockInvestment(investmentData) {
    return {
      success: true,
      investment: {
        id: Date.now().toString(),
        ...investmentData,
        actualROI: null,
        status: 'active',
        createdAt: Date.now()
      }
    };
  }

  // Cache management
  clearExpenseCache() {
    const expenseKeys = Array.from(this.cache.keys()).filter(key => key.startsWith('expenses_'));
    expenseKeys.forEach(key => this.cache.delete(key));
  }

  clearCache() {
    this.cache.clear();
  }
}

export default new FinancialService();
