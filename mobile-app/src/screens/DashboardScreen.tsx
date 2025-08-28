import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { useAuth } from '../hooks/useAuth';
import CallService from '../services/CallService';
import { useNavigation } from '@react-navigation/native';

interface QuickStat {
  label: string;
  value: string;
  change?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  merchant_name: string | null;
  category: string | null;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickStats, setQuickStats] = useState<QuickStat[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthSpending, setMonthSpending] = useState(0);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      const [accountsResponse, transactionsResponse, spendingResponse] = await Promise.all([
        supabase
          .from('plaid_accounts')
          .select('current_balance')
          .eq('user_id', user.id),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(5),
        supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .gte('date', `${currentMonth}-01`)
          .lt('amount', 0),
      ]);

      if (accountsResponse.data) {
        const total = accountsResponse.data.reduce(
          (sum, acc) => sum + (acc.current_balance || 0),
          0
        );
        setTotalBalance(total);
      }

      if (transactionsResponse.data) {
        setRecentTransactions(transactionsResponse.data);
      }

      if (spendingResponse.data) {
        const spent = Math.abs(
          spendingResponse.data.reduce((sum, t) => sum + t.amount, 0)
        );
        setMonthSpending(spent);
      }

      setQuickStats([
        {
          label: 'Total Balance',
          value: `$${totalBalance.toFixed(2)}`,
          icon: 'wallet',
          color: '#10b981',
        },
        {
          label: 'Month Spending',
          value: `$${monthSpending.toFixed(2)}`,
          icon: 'trending-down',
          color: '#ef4444',
        },
        {
          label: 'Saved This Month',
          value: '$0.00',
          icon: 'shield-checkmark',
          color: '#3b82f6',
        },
        {
          label: 'Pending',
          value: '$0.00',
          icon: 'time',
          color: '#f59e0b',
        },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const testAIFaceTime = () => {
    // Trigger incoming call for testing
    const config = {
      callerName: 'AI Financial Advisor',
      callerNumber: 'Personal Finance Assistant',
      callType: 'video' as const,
    };

    // Use a timeout to make it feel more realistic
    setTimeout(() => {
      CallService.startIncomingCall(config);
      // The CallManager will handle showing the incoming call modal
    }, 500);
  };

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
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.statsGrid}>
        {quickStats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
              <Ionicons name={stat.icon} size={24} color={stat.color} />
            </View>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            {stat.change && (
              <Text style={[styles.statChange, { color: stat.change.startsWith('+') ? '#10b981' : '#ef4444' }]}>
                {stat.change}
              </Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentTransactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <Text style={styles.transactionName}>
                {transaction.merchant_name || transaction.name}
              </Text>
              <Text style={styles.transactionDate}>
                {new Date(transaction.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.transactionRight}>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: transaction.amount < 0 ? '#ef4444' : '#10b981' },
                ]}
              >
                {transaction.amount < 0 ? '-' : '+'}$
                {Math.abs(transaction.amount).toFixed(2)}
              </Text>
              {transaction.category && (
                <Text style={styles.transactionCategory}>{transaction.category}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="add-circle" size={32} color="#10b981" />
            <Text style={styles.actionLabel}>Add Bank</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="sync" size={32} color="#3b82f6" />
            <Text style={styles.actionLabel}>Sync</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={testAIFaceTime}>
            <Ionicons name="videocam" size={32} color="#8b5cf6" />
            <Text style={styles.actionLabel}>AI FaceTime</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="pie-chart" size={32} color="#f59e0b" />
            <Text style={styles.actionLabel}>Budget</Text>
          </TouchableOpacity>
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    margin: '1%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statChange: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAll: {
    fontSize: 14,
    color: '#10b981',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionLeft: {
    flex: 1,
  },
  transactionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  quickActions: {
    margin: 16,
    marginTop: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
});