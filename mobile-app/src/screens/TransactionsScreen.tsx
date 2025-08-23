import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { useAuth } from '../hooks/useAuth';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface Transaction {
  id: string;
  transaction_id: string;
  name: string | null;
  merchant_name: string | null;
  amount: number;
  date: string;
  category: string | null;
  category_id: string | null;
  pending: boolean | null;
  account_id: string;
  iso_currency_code: string | null;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

export default function TransactionsScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const startDate = startOfMonth(selectedMonth).toISOString().split('T')[0];
      const endDate = endOfMonth(selectedMonth).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
      setFilteredTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [user, selectedMonth]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = transactions.filter(t => {
        const searchLower = searchQuery.toLowerCase();
        return (
          t.name?.toLowerCase().includes(searchLower) ||
          t.merchant_name?.toLowerCase().includes(searchLower) ||
          t.category?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(transactions);
    }
  }, [searchQuery, transactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, [selectedMonth]);

  const updateTransactionCategory = async (transaction: Transaction, categoryId: string) => {
    try {
      const category = categories.find(c => c.id === categoryId);
      
      const { error } = await supabase
        .from('transactions')
        .update({ 
          category_id: categoryId,
          category: category?.name || null 
        })
        .eq('id', transaction.id);

      if (error) throw error;

      // Update local state
      const updatedTransactions = transactions.map(t => 
        t.id === transaction.id 
          ? { ...t, category_id: categoryId, category: category?.name || null }
          : t
      );
      setTransactions(updatedTransactions);
      setCategoryModalVisible(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(selectedMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setSelectedMonth(newMonth);
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.amount > 0) return 'arrow-down';
    if (transaction.category?.toLowerCase().includes('food')) return 'restaurant';
    if (transaction.category?.toLowerCase().includes('transport')) return 'car';
    if (transaction.category?.toLowerCase().includes('shopping')) return 'cart';
    if (transaction.category?.toLowerCase().includes('entertainment')) return 'game-controller';
    if (transaction.category?.toLowerCase().includes('bills')) return 'receipt';
    return 'cash';
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => {
        setSelectedTransaction(item);
        setCategoryModalVisible(true);
      }}
    >
      <View style={styles.transactionLeft}>
        <View style={[styles.iconContainer, { 
          backgroundColor: item.amount > 0 ? '#10b98120' : '#ef444420' 
        }]}>
          <Ionicons 
            name={getTransactionIcon(item) as any} 
            size={24} 
            color={item.amount > 0 ? '#10b981' : '#ef4444'} 
          />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionName}>
            {item.merchant_name || item.name || 'Unknown'}
          </Text>
          <Text style={styles.transactionDate}>
            {format(parseISO(item.date), 'MMM dd, yyyy')}
            {item.pending && ' • Pending'}
          </Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: item.amount > 0 ? '#10b981' : '#ef4444' }
        ]}>
          {item.amount > 0 ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
        </Text>
        <TouchableOpacity style={styles.categoryTag}>
          <Text style={styles.categoryText}>
            {item.category || 'Uncategorized'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryModal = () => (
    <Modal
      visible={categoryModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setCategoryModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryOption}
                onPress={() => selectedTransaction && updateTransactionCategory(selectedTransaction, item.id)}
              >
                <Text style={styles.categoryOptionText}>{item.name}</Text>
                {selectedTransaction?.category_id === item.id && (
                  <Ionicons name="checkmark" size={20} color="#10b981" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const totalSpent = filteredTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalIncome = filteredTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => changeMonth('prev')}>
            <Ionicons name="chevron-back" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {format(selectedMonth, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={() => changeMonth('next')}>
            <Ionicons name="chevron-forward" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              ${totalIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
              ${totalSpent.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Add a bank account to see transactions'}
            </Text>
          </View>
        }
      />

      {renderCategoryModal()}
    </View>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  listContent: {
    paddingVertical: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
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
  categoryTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
});