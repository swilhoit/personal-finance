/**
 * Teller Banking Service
 * Handles bank account connections and transaction syncing via Teller.io
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import https from 'https';
import fs from 'fs';
import path from 'path';

const TELLER_API_BASE = 'https://api.teller.io';

// Create HTTPS agent with mTLS certificates for development/production
function createTellerAgent(): https.Agent | undefined {
  // Support base64-encoded certs (for Vercel) or file paths (for local dev)
  const certBase64 = process.env.TELLER_CERTIFICATE_BASE64;
  const keyBase64 = process.env.TELLER_PRIVATE_KEY_BASE64;
  const certPath = process.env.TELLER_CERTIFICATE_PATH;
  const keyPath = process.env.TELLER_PRIVATE_KEY_PATH;

  let cert: Buffer | undefined;
  let key: Buffer | undefined;

  // Try base64 env vars first (Vercel deployment)
  if (certBase64 && keyBase64) {
    try {
      cert = Buffer.from(certBase64, 'base64');
      key = Buffer.from(keyBase64, 'base64');
      console.log('[Teller] Using base64-encoded certificates');
    } catch (error) {
      console.error('[Teller] Failed to decode base64 certificates:', error);
    }
  }

  // Fall back to file paths (local development)
  if (!cert || !key) {
    if (certPath && keyPath) {
      try {
        const basePath = process.cwd();
        cert = fs.readFileSync(path.resolve(basePath, certPath));
        key = fs.readFileSync(path.resolve(basePath, keyPath));
        console.log('[Teller] Using file-based certificates');
      } catch (error) {
        console.error('[Teller] Failed to load certificate files:', error);
      }
    }
  }

  if (!cert || !key) {
    console.warn('[Teller] No certificates configured - API calls may fail');
    return undefined;
  }

  return new https.Agent({
    cert,
    key,
    rejectUnauthorized: true,
  });
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

  private async makeRequest<T>(endpoint: string, options: { method?: string; body?: string; timeout?: number } = {}): Promise<T> {
    const url = new URL(`${TELLER_API_BASE}${endpoint}`);
    const timeout = options.timeout || 30000; // 30 second default timeout

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: options.method || 'GET',
          agent: this.agent,
          timeout,
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

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Teller API timeout after ${timeout}ms`));
      });

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
 * Uses batch operations to avoid N+1 query issues
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

    // Collect all account data with balances
    const accountRecords: Array<{
      user_id: string;
      enrollment_id: string;
      account_id: string;
      name: string;
      type: string;
      subtype: string;
      institution_name: string;
      last_four: string;
      currency: string;
      current_balance: number | null;
      available_balance: number | null;
      is_active: boolean;
      last_synced_at: string;
    }> = [];

    // Collect all transactions
    const transactionRecords: Array<{
      user_id: string;
      account_id: string;
      transaction_id: string;
      teller_account_id: string;
      teller_transaction_id: string;
      source: string;
      name: string;
      merchant_name: string | null;
      amount: number;
      category: string;
      date: string;
      pending: boolean;
    }> = [];

    for (const account of accounts) {
      // Get balance
      let balance: TellerBalance | null = null;
      try {
        balance = await teller.getBalance(account.id);
      } catch {
        console.warn(`Could not fetch balance for account ${account.id}`);
      }

      // Add to batch
      accountRecords.push({
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
      });

      // Fetch transactions
      const transactions = await teller.getTransactions(account.id, { count: 100 });

      for (const tx of transactions) {
        // Teller returns positive amounts for debits (expenses) and negative for credits (income)
        // Our app convention is opposite: negative = expense, positive = income
        // So we negate the amount to match our convention
        transactionRecords.push({
          user_id: userId,
          account_id: account.id,
          transaction_id: tx.id,
          teller_account_id: account.id,
          teller_transaction_id: tx.id,
          source: 'teller',
          name: tx.description,
          merchant_name: tx.details.counterparty?.name || null,
          amount: -parseFloat(tx.amount),
          category: tx.details.category || 'uncategorized',
          date: tx.date,
          pending: tx.status === 'pending',
        });
      }
    }

    // Batch upsert accounts (single DB call)
    if (accountRecords.length > 0) {
      const { error: accountError } = await supabase
        .from('teller_accounts')
        .upsert(accountRecords, { onConflict: 'account_id' });

      if (accountError) {
        console.error('Error upserting accounts:', accountError);
      } else {
        accountsSynced = accountRecords.length;
      }
    }

    // Fetch the UUID mapping for accounts (teller_account_id -> internal UUID)
    const tellerAccountIds = accountRecords.map(a => a.account_id);
    const { data: accountMapping } = await supabase
      .from('teller_accounts')
      .select('id, account_id')
      .in('account_id', tellerAccountIds);

    // Create a lookup map: Teller account ID -> internal UUID
    const accountIdToUuid: Record<string, string> = {};
    if (accountMapping) {
      for (const acc of accountMapping) {
        accountIdToUuid[acc.account_id] = acc.id;
      }
    }

    // Update transaction records with the correct UUID references
    for (const tx of transactionRecords) {
      const uuid = accountIdToUuid[tx.teller_account_id];
      if (uuid) {
        tx.account_id = uuid;
      }
    }

    // Batch upsert transactions in chunks of 500 (Supabase limit)
    const BATCH_SIZE = 500;
    for (let i = 0; i < transactionRecords.length; i += BATCH_SIZE) {
      const batch = transactionRecords.slice(i, i + BATCH_SIZE);
      const { error: txError } = await supabase
        .from('transactions')
        .upsert(batch, { onConflict: 'transaction_id' });

      if (txError) {
        console.error(`Error upserting transactions batch ${i / BATCH_SIZE + 1}:`, txError);
      } else {
        transactionsSynced += batch.length;
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
