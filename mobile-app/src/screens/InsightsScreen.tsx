import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { useAuth } from '../hooks/useAuth';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const { width: screenWidth } = Dimensions.get('window');

interface SpendingByCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface Budget {
  id: string;
  category_id: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  category_name: string;
}

export default function InsightsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [spendingByCategory, setSpendingByCategory] = useState<SpendingByCategory[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [savingsRate, setSavingsRate] = useState(0);
  const [topMerchants, setTopMerchants] = useState<{ name: string; amount: number }[]>([]);

  const categoryColors = [
    '#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#06b6d4'
  ];

  const fetchInsights = async () => {
    if (!user) return;

    try {
      const currentDate = new Date();
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);

      // Fetch current month transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (transError) throw transError;

      // Calculate spending by category
      const categorySpending: Record<string, number> = {};
      let income = 0;
      let expenses = 0;
      const merchantSpending: Record<string, number> = {};

      transactions?.forEach(t => {
        if (t.amount > 0) {
          income += t.amount;
        } else {
          expenses += Math.abs(t.amount);
          const category = t.category || 'Uncategorized';
          categorySpending[category] = (categorySpending[category] || 0) + Math.abs(t.amount);
          
          if (t.merchant_name) {
            merchantSpending[t.merchant_name] = 
              (merchantSpending[t.merchant_name] || 0) + Math.abs(t.amount);
          }
        }
      });

      setTotalIncome(income);
      setTotalExpenses(expenses);
      setSavingsRate(income > 0 ? ((income - expenses) / income) * 100 : 0);

      // Format spending by category
      const categories = Object.entries(categorySpending)
        .map(([category, amount], index) => ({
          category,
          amount,
          percentage: expenses > 0 ? (amount / expenses) * 100 : 0,
          color: categoryColors[index % categoryColors.length],
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setSpendingByCategory(categories);

      // Get top merchants
      const merchants = Object.entries(merchantSpending)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      
      setTopMerchants(merchants);

      // Fetch monthly trends (last 6 months)
      const trends: MonthlyTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(currentDate, i));
        const monthEnd = endOfMonth(subMonths(currentDate, i));
        
        const { data: monthData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .gte('date', monthStart.toISOString().split('T')[0])
          .lte('date', monthEnd.toISOString().split('T')[0]);

        let monthIncome = 0;
        let monthExpenses = 0;
        
        monthData?.forEach(t => {
          if (t.amount > 0) {
            monthIncome += t.amount;
          } else {
            monthExpenses += Math.abs(t.amount);
          }
        });

        trends.push({
          month: format(monthStart, 'MMM'),
          income: monthIncome,
          expenses: monthExpenses,
          net: monthIncome - monthExpenses,
        });
      }
      
      setMonthlyTrends(trends);

      // Fetch budgets
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .eq('month', format(currentDate, 'yyyy-MM'));

      if (!budgetError && budgetData) {
        const budgetsWithSpending = budgetData.map(budget => {
          const spent = Math.abs(
            transactions
              ?.filter(t => t.category_id === budget.category_id && t.amount < 0)
              .reduce((sum, t) => sum + t.amount, 0) || 0
          );
          
          return {
            id: budget.id,
            category_id: budget.category_id,
            amount: budget.amount,
            spent,
            remaining: budget.amount - spent,
            percentage: (spent / budget.amount) * 100,
            category_name: budget.categories?.name || 'Unknown',
          };
        });
        
        setBudgets(budgetsWithSpending);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInsights();
  };

  const renderSpendingChart = () => {
    const maxAmount = Math.max(...spendingByCategory.map(c => c.amount));
    
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Spending by Category</Text>
        {spendingByCategory.map((category, index) => (
          <View key={index} style={styles.chartRow}>
            <Text style={styles.chartLabel}>{category.category}</Text>
            <View style={styles.chartBarContainer}>
              <View
                style={[
                  styles.chartBar,
                  {
                    backgroundColor: category.color,
                    width: `${(category.amount / maxAmount) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.chartValue}>${category.amount.toFixed(0)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMonthlyTrend = () => {
    const maxValue = Math.max(
      ...monthlyTrends.flatMap(t => [t.income, t.expenses])
    );

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>6-Month Trend</Text>
        <View style={styles.trendChart}>
          {monthlyTrends.map((month, index) => (
            <View key={index} style={styles.trendMonth}>
              <View style={styles.trendBars}>
                <View
                  style={[
                    styles.trendBar,
                    styles.incomeBar,
                    { height: (month.income / maxValue) * 100 },
                  ]}
                />
                <View
                  style={[
                    styles.trendBar,
                    styles.expenseBar,
                    { height: (month.expenses / maxValue) * 100 },
                  ]}
                />
              </View>
              <Text style={styles.trendMonthLabel}>{month.month}</Text>
            </View>
          ))}
        </View>
        <View style={styles.trendLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Expenses</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBudgets = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Budget Overview</Text>
      {budgets.length > 0 ? (
        budgets.map((budget, index) => (
          <View key={index} style={styles.budgetItem}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetCategory}>{budget.category_name}</Text>
              <Text style={styles.budgetAmount}>
                ${budget.spent.toFixed(0)} / ${budget.amount.toFixed(0)}
              </Text>
            </View>
            <View style={styles.budgetProgressContainer}>
              <View
                style={[
                  styles.budgetProgress,
                  {
                    width: `${Math.min(budget.percentage, 100)}%`,
                    backgroundColor: budget.percentage > 100 ? '#ef4444' : 
                                   budget.percentage > 80 ? '#f59e0b' : '#10b981',
                  },
                ]}
              />
            </View>
            <Text style={[
              styles.budgetStatus,
              { color: budget.remaining < 0 ? '#ef4444' : '#6b7280' }
            ]}>
              {budget.remaining >= 0 
                ? `$${budget.remaining.toFixed(0)} remaining`
                : `$${Math.abs(budget.remaining).toFixed(0)} over budget`}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No budgets set for this month</Text>
      )}
    </View>
  );

  const renderTopMerchants = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Top Merchants</Text>
      {topMerchants.map((merchant, index) => (
        <View key={index} style={styles.merchantRow}>
          <Text style={styles.merchantName}>{merchant.name}</Text>
          <Text style={styles.merchantAmount}>${merchant.amount.toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Insights</Text>
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map(period => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#10b98120' }]}>
          <Ionicons name="trending-up" size={24} color="#10b981" />
          <Text style={styles.statValue}>${totalIncome.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Income</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#ef444420' }]}>
          <Ionicons name="trending-down" size={24} color="#ef4444" />
          <Text style={styles.statValue}>${totalExpenses.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#3b82f620' }]}>
          <Ionicons name="wallet" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>
            ${(totalIncome - totalExpenses).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Net</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
          <Ionicons name="cash" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{savingsRate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Savings Rate</Text>
        </View>
      </View>

      {renderSpendingChart()}
      {renderMonthlyTrend()}
      {renderBudgets()}
      {renderTopMerchants()}

      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Ionicons name="bulb" size={24} color="#f59e0b" />
          <Text style={styles.tipsTitle}>Smart Insights</Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            {savingsRate > 20 
              ? "Great job! You're saving over 20% of your income."
              : "Try to increase your savings rate to at least 20% for better financial health."}
          </Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            {spendingByCategory[0] 
              ? `Your highest spending category is ${spendingByCategory[0].category}. Consider setting a budget here.`
              : "Connect your accounts to get personalized insights."}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#fff',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  periodButtonTextActive: {
    color: '#1f2937',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: (screenWidth - 40) / 2,
    margin: 5,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  chartLabel: {
    width: 100,
    fontSize: 12,
    color: '#6b7280',
  },
  chartBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    borderRadius: 10,
  },
  chartValue: {
    width: 60,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  trendChart: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  trendMonth: {
    flex: 1,
    alignItems: 'center',
  },
  trendBars: {
    flexDirection: 'row',
    height: 100,
    alignItems: 'flex-end',
  },
  trendBar: {
    width: 12,
    marginHorizontal: 2,
    borderRadius: 4,
  },
  incomeBar: {
    backgroundColor: '#10b981',
  },
  expenseBar: {
    backgroundColor: '#ef4444',
  },
  trendMonthLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  trendLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  budgetItem: {
    marginVertical: 12,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  budgetAmount: {
    fontSize: 14,
    color: '#6b7280',
  },
  budgetProgressContainer: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetProgress: {
    height: '100%',
    borderRadius: 4,
  },
  budgetStatus: {
    fontSize: 12,
    marginTop: 4,
  },
  merchantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  merchantName: {
    fontSize: 14,
    color: '#1f2937',
  },
  merchantAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
  tipsCard: {
    backgroundColor: '#fef3c7',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    marginBottom: 32,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginLeft: 8,
  },
  tip: {
    marginVertical: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
});