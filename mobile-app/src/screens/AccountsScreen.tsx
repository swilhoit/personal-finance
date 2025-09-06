import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';
import { useAuth } from '../hooks/useAuth';
// import PlaidLink from 'react-native-plaid-link-sdk';

interface Account {
  id: string;
  account_id: string;
  name: string | null;
  official_name: string | null;
  type: string | null;
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  available_balance: number | null;
  iso_currency_code: string | null;
  item_id: string;
  created_at: string | null;
}

interface PlaidItem {
  id: string;
  item_id: string;
  institution_name: string | null;
  institution_id: string | null;
  created_at: string | null;
}

export default function AccountsScreen() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [plaidItems, setPlaidItems] = useState<PlaidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchAccounts = async () => {
    if (!user) return;

    try {
      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('plaid_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (accountsError) throw accountsError;
      setAccounts(accountsData || []);

      // Fetch Plaid items (institutions)
      const { data: itemsData, error: itemsError } = await supabase
        .from('plaid_items')
        .select('*')
        .eq('user_id', user.id)
        .order('institution_name');

      if (itemsError) throw itemsError;
      setPlaidItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      Alert.alert('Error', 'Failed to load accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
  };

  const syncTransactions = async () => {
    setSyncing(true);
    try {
      // In production, this would call your API to sync with Plaid
      Alert.alert('Sync Started', 'Syncing transactions in the background...');
      
      // Simulate sync
      setTimeout(() => {
        setSyncing(false);
        fetchAccounts();
      }, 3000);
    } catch (error) {
      console.error('Error syncing:', error);
      Alert.alert('Sync Failed', 'Unable to sync transactions');
      setSyncing(false);
    }
  };

  const connectPlaidAccount = () => {
    // In production, this would open Plaid Link
    Alert.alert(
      'Connect Bank Account',
      'Plaid Link integration would open here to connect your bank account securely.',
      [{ text: 'OK' }]
    );
  };

  const removeAccount = async (itemId: string) => {
    Alert.alert(
      'Remove Account',
      'Are you sure you want to remove this account and all its transactions?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('plaid_items')
                .delete()
                .eq('item_id', itemId)
                .eq('user_id', user?.id);

              if (error) throw error;
              
              Alert.alert('Success', 'Account removed successfully');
              fetchAccounts();
            } catch (error) {
              console.error('Error removing account:', error);
              Alert.alert('Error', 'Failed to remove account');
            }
          },
        },
      ]
    );
  };

  const getAccountIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'depository':
        return 'wallet';
      case 'credit':
        return 'card';
      case 'loan':
        return 'cash';
      case 'investment':
        return 'trending-up';
      default:
        return 'wallet';
    }
  };

  const getAccountColor = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'depository':
        return '#10b981';
      case 'credit':
        return '#ef4444';
      case 'loan':
        return '#f59e0b';
      case 'investment':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const groupedAccounts = plaidItems.map(item => ({
    institution: item,
    accounts: accounts.filter(acc => acc.item_id === item.item_id),
  }));

  const totalBalance = accounts.reduce((sum, acc) => {
    return sum + (acc.current_balance || 0);
  }, 0);

  const renderInstitution = ({ item }: { item: typeof groupedAccounts[0] }) => {
    const institutionTotal = item.accounts.reduce(
      (sum, acc) => sum + (acc.current_balance || 0),
      0
    );

    return (
      <View style={styles.institutionCard}>
        <View style={styles.institutionHeader}>
          <View>
            <Text style={styles.institutionName}>
              {item.institution.institution_name || 'Unknown Bank'}
            </Text>
            <Text style={styles.institutionTotal}>
              Total: ${institutionTotal.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => removeAccount(item.institution.item_id)}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {item.accounts.map(account => (
          <View key={account.id} style={styles.accountItem}>
            <View style={styles.accountLeft}>
              <View style={[
                styles.accountIcon,
                { backgroundColor: getAccountColor(account.type) + '20' }
              ]}>
                <Ionicons
                  name={getAccountIcon(account.type) as any}
                  size={20}
                  color={getAccountColor(account.type)}
                />
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>
                  {account.name || account.official_name || 'Account'}
                </Text>
                <Text style={styles.accountType}>
                  {account.subtype || account.type || 'Account'} •••• {account.mask}
                </Text>
              </View>
            </View>
            <View style={styles.accountRight}>
              <Text style={styles.accountBalance}>
                ${(account.current_balance || 0).toFixed(2)}
              </Text>
              {account.available_balance !== null && 
               account.available_balance !== account.current_balance && (
                <Text style={styles.availableBalance}>
                  Available: ${account.available_balance.toFixed(2)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalAmount}>${totalBalance.toFixed(2)}</Text>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.syncButton]}
            onPress={syncTransactions}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="sync" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Sync</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={connectPlaidAccount}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Add Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={groupedAccounts}
        keyExtractor={(item) => item.institution.id}
        renderItem={renderInstitution}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Accounts Connected</Text>
            <Text style={styles.emptyText}>
              Connect your bank accounts to start tracking your finances
            </Text>
            <TouchableOpacity
              style={styles.connectButton}
              onPress={connectPlaidAccount}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.connectButtonText}>Connect Bank Account</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {accounts.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Ionicons name="shield-checkmark" size={20} color="#10b981" />
            <Text style={styles.footerText}>Bank-level encryption</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="lock-closed" size={20} color="#10b981" />
            <Text style={styles.footerText}>Secure with Plaid</Text>
          </View>
        </View>
      )}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  totalSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.45,
    justifyContent: 'center',
  },
  syncButton: {
    backgroundColor: '#3b82f6',
  },
  addButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 16,
  },
  institutionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  institutionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  institutionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  institutionTotal: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  removeButton: {
    padding: 8,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  accountType: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  availableBalance: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
});