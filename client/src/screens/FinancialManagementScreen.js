import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import financialService from '../services/financialService';

const { width: screenWidth } = Dimensions.get('window');

const FinancialManagementScreen = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('expense');
  
  // Data states
  const [expenses, setExpenses] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [profitAnalysis, setProfitAnalysis] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loans, setLoans] = useState([]);
  
  // Form states
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'seeds',
    date: new Date(),
    vendor: '',
    paymentMethod: 'cash'
  });

  const [filters, setFilters] = useState({
    dateRange: '1month',
    category: 'all'
  });

  useEffect(() => {
    loadFinancialData();
  }, [filters]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const [expenseData, revenueData, profitData, budgetData, investmentData, loanData] = await Promise.all([
        financialService.getExpenses(null, filters.dateRange, filters.category),
        financialService.getRevenue(null, filters.dateRange),
        financialService.getProfitAnalysis(null, filters.dateRange),
        financialService.getBudgets(),
        financialService.getInvestments(),
        financialService.getLoans()
      ]);

      setExpenses(expenseData.expenses || []);
      setRevenue(revenueData.revenue || []);
      setProfitAnalysis(profitData.analysis || null);
      setBudgets(budgetData.budgets || []);
      setInvestments(investmentData.investments || []);
      setLoans(loanData.loans || []);
    } catch (error) {
      console.error('Load financial data error:', error);
      Alert.alert('Error', 'Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFinancialData();
    setRefreshing(false);
  };

  const handleAddTransaction = async () => {
    if (!formData.description || !formData.amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        date: Date.now()
      };

      if (modalType === 'expense') {
        await financialService.addExpense(transactionData);
      } else {
        await financialService.addRevenue(transactionData);
      }

      setShowAddModal(false);
      setFormData({
        description: '',
        amount: '',
        category: 'seeds',
        date: new Date(),
        vendor: '',
        paymentMethod: 'cash'
      });
      
      loadFinancialData();
      Alert.alert('Success', `${modalType} added successfully`);
    } catch (error) {
      Alert.alert('Error', `Failed to add ${modalType}`);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderOverviewTab = () => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const expenseCategories = {};
    expenses.forEach(expense => {
      expenseCategories[expense.category] = (expenseCategories[expense.category] || 0) + expense.amount;
    });

    const pieData = Object.keys(expenseCategories).map((category, index) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      amount: expenseCategories[category],
      color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'][index % 6],
      legendFontColor: '#333',
      legendFontSize: 12
    }));

    return (
      <ScrollView style={styles.tabContent}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: '#E8F5E8' }]}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={[styles.summaryValue, { color: '#2E7D32' }]}>
              {formatCurrency(totalRevenue)}
            </Text>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: '#FFF3E0' }]}>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
            <Text style={[styles.summaryValue, { color: '#F57C00' }]}>
              {formatCurrency(totalExpenses)}
            </Text>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: netProfit >= 0 ? '#E8F5E8' : '#FFEBEE' }]}>
            <Text style={styles.summaryLabel}>Net Profit</Text>
            <Text style={[styles.summaryValue, { color: netProfit >= 0 ? '#2E7D32' : '#D32F2F' }]}>
              {formatCurrency(netProfit)}
            </Text>
          </View>
        </View>

        {/* Expense Breakdown Chart */}
        {pieData.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Expense Breakdown</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              hasLegend={true}
            />
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {[...expenses, ...revenue]
            .sort((a, b) => b.date - a.date)
            .slice(0, 5)
            .map((transaction, index) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: revenue.includes(transaction) ? '#2E7D32' : '#D32F2F' }
                ]}>
                  {revenue.includes(transaction) ? '+' : '-'}{formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))
          }
        </View>
      </ScrollView>
    );
  };

  const renderExpensesTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Category</Text>
              <Picker
                selectedValue={filters.category}
                onValueChange={(value) => setFilters({...filters, category: value})}
                style={styles.picker}
              >
                <Picker.Item label="All Categories" value="all" />
                <Picker.Item label="Seeds" value="seeds" />
                <Picker.Item label="Fertilizer" value="fertilizer" />
                <Picker.Item label="Equipment" value="equipment" />
                <Picker.Item label="Labor" value="labor" />
                <Picker.Item label="Fuel" value="fuel" />
                <Picker.Item label="Others" value="others" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.expensesList}>
          {expenses.map((expense, index) => (
            <View key={expense.id || index} style={styles.expenseItem}>
              <View style={styles.expenseHeader}>
                <Text style={styles.expenseDescription}>{expense.description}</Text>
                <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
              </View>
              <View style={styles.expenseDetails}>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
                <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
              </View>
              <Text style={styles.expenseVendor}>Vendor: {expense.vendor}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderBudgetsTab = () => {
    return (
      <ScrollView style={styles.tabContent}>
        {budgets.map((budget, index) => {
          const spentPercentage = (budget.spent / budget.totalBudget) * 100;
          const isOverBudget = spentPercentage > 100;
          
          return (
            <View key={budget.id || index} style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetName}>{budget.name}</Text>
                <Text style={[
                  styles.budgetStatus,
                  { color: budget.status === 'active' ? '#2E7D32' : '#757575' }
                ]}>
                  {budget.status.toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.budgetAmounts}>
                <View style={styles.budgetAmount}>
                  <Text style={styles.budgetLabel}>Total Budget</Text>
                  <Text style={styles.budgetValue}>{formatCurrency(budget.totalBudget)}</Text>
                </View>
                <View style={styles.budgetAmount}>
                  <Text style={styles.budgetLabel}>Spent</Text>
                  <Text style={[styles.budgetValue, { color: isOverBudget ? '#D32F2F' : '#F57C00' }]}>
                    {formatCurrency(budget.spent)}
                  </Text>
                </View>
                <View style={styles.budgetAmount}>
                  <Text style={styles.budgetLabel}>Remaining</Text>
                  <Text style={[styles.budgetValue, { color: budget.remaining > 0 ? '#2E7D32' : '#D32F2F' }]}>
                    {formatCurrency(budget.remaining)}
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    { 
                      width: `${Math.min(spentPercentage, 100)}%`,
                      backgroundColor: isOverBudget ? '#D32F2F' : '#4CAF50'
                    }
                  ]} />
                </View>
                <Text style={styles.progressText}>
                  {spentPercentage.toFixed(1)}% used
                </Text>
              </View>

              <View style={styles.budgetBreakdown}>
                {budget.breakdown.map((item, idx) => (
                  <View key={idx} style={styles.breakdownItem}>
                    <Text style={styles.breakdownCategory}>{item.category}</Text>
                    <Text style={styles.breakdownAmount}>
                      {formatCurrency(item.spent)} / {formatCurrency(item.budgeted)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderProfitTab = () => {
    if (!profitAnalysis) return null;

    const chartData = {
      labels: profitAnalysis.monthlyData.slice(-6).map(d => d.month),
      datasets: [
        {
          data: profitAnalysis.monthlyData.slice(-6).map(d => d.profit),
          color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.profitSummary}>
          <View style={styles.profitCard}>
            <Text style={styles.profitLabel}>Total Revenue</Text>
            <Text style={[styles.profitValue, { color: '#2E7D32' }]}>
              {formatCurrency(profitAnalysis.totalRevenue)}
            </Text>
          </View>
          
          <View style={styles.profitCard}>
            <Text style={styles.profitLabel}>Total Expenses</Text>
            <Text style={[styles.profitValue, { color: '#F57C00' }]}>
              {formatCurrency(profitAnalysis.totalExpenses)}
            </Text>
          </View>
          
          <View style={styles.profitCard}>
            <Text style={styles.profitLabel}>Net Profit</Text>
            <Text style={[styles.profitValue, { color: profitAnalysis.totalProfit >= 0 ? '#2E7D32' : '#D32F2F' }]}>
              {formatCurrency(profitAnalysis.totalProfit)}
            </Text>
          </View>
          
          <View style={styles.profitCard}>
            <Text style={styles.profitLabel}>Profit Margin</Text>
            <Text style={[styles.profitValue, { color: profitAnalysis.profitMargin >= 0 ? '#2E7D32' : '#D32F2F' }]}>
              {profitAnalysis.profitMargin}%
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Profit Trends (6 Months)</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          {profitAnalysis.insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <Text style={styles.insightText}>• {insight}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderAddModal = () => {
    return (
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add {modalType === 'expense' ? 'Expense' : 'Revenue'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount"
              value={formData.amount}
              onChangeText={(text) => setFormData({...formData, amount: text})}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Vendor/Buyer"
              value={formData.vendor}
              onChangeText={(text) => setFormData({...formData, vendor: text})}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Category</Text>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => setFormData({...formData, category: value})}
                style={styles.modalPicker}
              >
                <Picker.Item label="Seeds" value="seeds" />
                <Picker.Item label="Fertilizer" value="fertilizer" />
                <Picker.Item label="Equipment" value="equipment" />
                <Picker.Item label="Labor" value="labor" />
                <Picker.Item label="Fuel" value="fuel" />
                <Picker.Item label="Others" value="others" />
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddTransaction}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 12
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setModalType('expense');
            setShowAddModal(true);
          }}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'expenses', label: 'Expenses' },
          { id: 'budgets', label: 'Budgets' },
          { id: 'profit', label: 'Profit' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading financial data...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'expenses' && renderExpensesTab()}
            {activeTab === 'budgets' && renderBudgetsTab()}
            {activeTab === 'profit' && renderProfitTab()}
          </>
        )}
      </ScrollView>

      {renderAddModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50'
  },
  tabText: {
    fontSize: 16,
    color: '#666'
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600'
  },
  content: {
    flex: 1
  },
  tabContent: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  loadingText: {
    fontSize: 16,
    color: '#666'
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  chartContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  chart: {
    borderRadius: 8
  },
  sectionContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  transactionInfo: {
    flex: 1
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  filterContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8
  },
  filterRow: {
    flexDirection: 'row'
  },
  filterItem: {
    flex: 1
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  picker: {
    height: Platform.OS === 'ios' ? 120 : 50
  },
  expensesList: {
    padding: 15
  },
  expenseItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50'
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D32F2F'
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  expenseCategory: {
    fontSize: 12,
    color: '#4CAF50',
    textTransform: 'uppercase'
  },
  expenseDate: {
    fontSize: 12,
    color: '#666'
  },
  expenseVendor: {
    fontSize: 12,
    color: '#666'
  },
  budgetCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  budgetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  budgetStatus: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  budgetAmounts: {
    flexDirection: 'row',
    marginBottom: 15
  },
  budgetAmount: {
    flex: 1,
    alignItems: 'center'
  },
  budgetLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  progressContainer: {
    marginBottom: 15
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%'
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5
  },
  budgetBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5
  },
  breakdownCategory: {
    fontSize: 14,
    color: '#333'
  },
  breakdownAmount: {
    fontSize: 14,
    color: '#666'
  },
  profitSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 10
  },
  profitCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    width: (screenWidth - 50) / 2,
    alignItems: 'center'
  },
  profitLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  profitValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  insightsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 8
  },
  insightItem: {
    marginBottom: 10
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    width: screenWidth - 40
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16
  },
  pickerContainer: {
    marginBottom: 15
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  modalPicker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#f5f5f5'
  },
  saveButton: {
    backgroundColor: '#4CAF50'
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default FinancialManagementScreen;
