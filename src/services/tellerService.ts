/**
 * Teller Banking Service
 * Handles bank account connections and transaction syncing via Teller.io
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import https from 'https';
import fs from 'fs';
import path from 'path';

const TELLER_API_BASE = 'https://api.teller.io';

// Create HTTPS agent with mTLS certificates for production
function createTellerAgent(): https.Agent | undefined {
  const certPath = process.env.TELLER_CERTIFICATE_PATH;
  const keyPath = process.env.TELLER_PRIVATE_KEY_PATH;

  if (!certPath || !keyPath) {
    console.warn('[Teller] No certificates configured - API calls may fail in production');
    return undefined;
  }

  try {
    const basePath = process.cwd();
    const cert = fs.readFileSync(path.resolve(basePath, certPath));
    const key = fs.readFileSync(path.resolve(basePath, keyPath));

    return new https.Agent({
      cert,
      key,
      rejectUnauthorized: true,
    });
  } catch (error) {
    console.error('[Teller] Failed to load certificates:', error);
    return undefined;
  }
}

export interface TellerAccount {
  id: string;
  enrollment_id: string;
  name: string;
  type: 'depository' | 'credit';
  subtype: string;
  institution: {
    name: string;
    id: string;
  };
  last_four: string;
  currency: string;
  status: string;
}

export interface TellerBalance {
  account_id: string;
  ledger: string;
  available: string;
  links: {
    self: string;
    account: string;
  };
}

export interface TellerTransaction {
  id: string;
  account_id: string;
  date: string;
  description: string;
  amount: string;
  status: 'posted' | 'pending';
  type: string;
  details: {
    category?: string;
    counterparty?: {
      name: string;
      type: string;
    };
    processing_status: string;
  };
}

export class TellerService {
  private accessToken: string;
  private agent: https.Agent | undefined;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.agent = createTellerAgent();
  }

  private async makeRequest<T>(endpoint: string, options: { method?: string; body?: string } = {}): Promise<T> {
    const url = new URL(`${TELLER_API_BASE}${endpoint}`);

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: options.method || 'GET',
          agent: this.agent,
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.accessToken}:`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(data));
              } catch {
                resolve(data as T);
              }
            } else {
              reject(new Error(`Teller API error: ${res.statusCode} - ${data}`));
            }
          });
        }
      );

      req.on('error', reject);

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  /**
   * List all accounts for the enrollment
   */
  async listAccounts(): Promise<TellerAccount[]> {
    return this.makeRequest<TellerAccount[]>('/accounts');
  }

  /**
   * Get a specific account
   */
  async getAccount(accountId: string): Promise<TellerAccount> {
    return this.makeRequest<TellerAccount>(`/accounts/${accountId}`);
  }

  /**
   * Get account balance
   */
  async getBalance(accountId: string): Promise<TellerBalance> {
    return this.makeRequest<TellerBalance>(`/accounts/${accountId}/balances`);
  }

  /**
   * Get account transactions
   */
  async getTransactions(accountId: string, options?: { count?: number; from_id?: string }): Promise<TellerTransaction[]> {
    const params = new URLSearchParams();
    if (options?.count) params.set('count', options.count.toString());
    if (options?.from_id) params.set('from_id', options.from_id);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest<TellerTransaction[]>(`/accounts/${accountId}/transactions${query}`);
  }

  /**
   * Delete an enrollment (disconnect bank)
   */
  async deleteEnrollment(): Promise<void> {
    await this.makeRequest('/enrollments/self', { method: 'DELETE' });
  }
}

/**
 * Sync Teller data to Supabase
 */
export async function syncTellerToSupabase(
  supabase: SupabaseClient,
  userId: string,
  enrollmentId: string,
  accessToken: string
): Promise<{ accountsSynced: number; transactionsSynced: number }> {
  const teller = new TellerService(accessToken);

  let accountsSynced = 0;
  let transactionsSynced = 0;

  try {
    // Fetch accounts
    const accounts = await teller.listAccounts();

    for (const account of accounts) {
      // Get balance
      let balance: TellerBalance | null = null;
      try {
        balance = await teller.getBalance(account.id);
      } catch {
        console.warn(`Could not fetch balance for account ${account.id}`);
      }

      // Upsert account
      await supabase.from('teller_accounts').upsert({
        user_id: userId,
        enrollment_id: enrollmentId,
        account_id: account.id,
        name: account.name,
        type: account.type,
        subtype: account.subtype,
        institution_name: account.institution.name,
        last_four: account.last_four,
        currency: account.currency,
        current_balance: balance ? parseFloat(balance.ledger) : null,
        available_balance: balance ? parseFloat(balance.available) : null,
        is_active: account.status === 'open',
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'account_id' });

      accountsSynced++;

      // Fetch transactions
      const transactions = await teller.getTransactions(account.id, { count: 100 });

      for (const tx of transactions) {
        await supabase.from('transactions').upsert({
          user_id: userId,
          account_id: account.id,
          transaction_id: tx.id,
          teller_account_id: account.id,
          teller_transaction_id: tx.id,
          source: 'teller',
          name: tx.description,
          merchant_name: tx.details.counterparty?.name || null,
          amount: parseFloat(tx.amount),
          category: tx.details.category || 'uncategorized',
          date: tx.date,
          pending: tx.status === 'pending',
        }, { onConflict: 'transaction_id' });

        transactionsSynced++;
      }
    }

    // Update enrollment last synced
    await supabase.from('teller_enrollments')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('enrollment_id', enrollmentId);

    return { accountsSynced, transactionsSynced };
  } catch (error) {
    console.error('Error syncing Teller data:', error);
    throw error;
  }
}

/**
 * Get Teller Connect URL for enrollment
 */
export function getTellerConnectConfig(options: {
  applicationId: string;
  environment: 'sandbox' | 'development' | 'production';
  userId: string;
  selectAccount?: 'single' | 'multiple' | 'disabled';
}) {
  return {
    applicationId: options.applicationId,
    environment: options.environment,
    selectAccount: options.selectAccount || 'multiple',
    enrollmentId: null, // Set for reconnection
    userId: options.userId,
  };
}






