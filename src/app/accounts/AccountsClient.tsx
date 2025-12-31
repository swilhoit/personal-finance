'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TellerConnect from '@/components/TellerConnect';
import { ManualAccountModal } from '@/components/ManualAccountModal';
import { Button } from '@/components/ui/Button';

interface ManualAccount {
  id: string;
  account_id: string;
  name: string;
  type: string;
  current_balance: number | null;
  currency: string | null;
  created_at: string | null;
}

interface TellerAccount {
  id: string;
  teller_account_id: string;
  name: string;
  type: string | null;
  subtype: string | null;
  institution_name: string | null;
  current_balance: number | null;
  available_balance: number | null;
  currency: string | null;
  last_synced_at: string | null;
  enrollment_id: string | null;
}

interface AccountsClientProps {
  tellerAccounts: TellerAccount[];
  manualAccounts: ManualAccount[];
}

// Get account type icon
const getAccountIcon = (type: string | null, subtype: string | null) => {
  if (type === 'credit' || type === 'credit_card') return 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z';
  if (subtype?.includes('savings') || type === 'savings') return 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 12h6m-3-3v6';
  if (subtype?.includes('checking') || type === 'depository' || type === 'checking') return 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z';
  return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
};

export default function AccountsClient({ tellerAccounts, manualAccounts }: AccountsClientProps) {
  const router = useRouter();
  const [showManualModal, setShowManualModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Combine and group accounts by institution
  const accountsByInstitution: Record<string, Array<TellerAccount | (ManualAccount & { source: 'manual' })>> = {};

  // Add teller accounts
  tellerAccounts.forEach((account) => {
    const institution = account.institution_name ?? 'Unknown Institution';
    if (!accountsByInstitution[institution]) accountsByInstitution[institution] = [];
    accountsByInstitution[institution].push(account);
  });

  // Add manual accounts under "Manual Accounts" group
  if (manualAccounts.length > 0) {
    accountsByInstitution['Manual Accounts'] = manualAccounts.map(a => ({ ...a, source: 'manual' as const }));
  }

  // Calculate totals
  const allTellerAccounts = tellerAccounts;
  const allManualAccounts = manualAccounts;

  // Teller assets and debt
  const tellerAssets = allTellerAccounts
    .filter(a => a.type === 'depository')
    .reduce((sum, a) => sum + (a.current_balance ?? 0), 0);

  const tellerDebt = allTellerAccounts
    .filter(a => a.type === 'credit')
    .reduce((sum, a) => sum + (a.current_balance ?? 0), 0);

  // Manual assets and debt
  const manualAssets = allManualAccounts
    .filter(a => a.type === 'checking' || a.type === 'savings')
    .reduce((sum, a) => sum + (a.current_balance ?? 0), 0);

  const manualDebt = allManualAccounts
    .filter(a => a.type === 'credit')
    .reduce((sum, a) => sum + (a.current_balance ?? 0), 0);

  const totalAssets = tellerAssets + manualAssets;
  const totalDebt = tellerDebt + manualDebt;
  const netWorth = totalAssets - totalDebt;

  const totalAvailable = allTellerAccounts
    .filter(a => a.type === 'depository')
    .reduce((sum, a) => sum + (a.available_balance ?? 0), 0) + manualAssets;

  const totalAccountCount = tellerAccounts.length + manualAccounts.length;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/teller/sync', { method: 'POST' });
      router.refresh();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAccountSuccess = () => {
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your connected bank accounts and credit cards
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleSync}
                isLoading={isSyncing}
                size="sm"
              >
                Sync Accounts
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/import')}
                size="sm"
              >
                Import CSV
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowManualModal(true)}
                size="sm"
              >
                + Add Manual
              </Button>
              <TellerConnect />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Net Worth</p>
            <p className={`text-2xl font-semibold ${netWorth >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {netWorth < 0 ? '-' : ''}${Math.abs(netWorth).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">Assets minus debt</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Cash & Savings</p>
            <p className="text-2xl font-semibold text-green-600">${totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-500 mt-1">Available: ${totalAvailable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Credit Card Debt</p>
            <p className="text-2xl font-semibold text-red-600">
              {totalDebt > 0 ? '-' : ''}${totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">Amount owed</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Accounts</p>
            <p className="text-2xl font-semibold text-gray-900">{totalAccountCount}</p>
            <p className="text-xs text-gray-500 mt-1">{Object.keys(accountsByInstitution).length} institutions</p>
          </div>
        </div>

        {/* Accounts List */}
        {Object.keys(accountsByInstitution).length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">No Accounts Connected</h2>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Connect your bank accounts or add manual accounts to start tracking your finances.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={() => setShowManualModal(true)}>
                Add Manual Account
              </Button>
              <TellerConnect />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(accountsByInstitution).map(([institution, institutionAccounts]) => (
              <div key={institution}>
                <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  {institution}
                  {institution === 'Manual Accounts' && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      Manual
                    </span>
                  )}
                </h2>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {institutionAccounts.map((account) => {
                      const isManual = 'source' in account && account.source === 'manual';
                      const isTeller = !isManual;
                      const tellerAccount = isTeller ? account as TellerAccount : null;
                      const manualAccount = isManual ? account as ManualAccount & { source: 'manual' } : null;

                      const type = tellerAccount?.type ?? manualAccount?.type ?? null;
                      const subtype = tellerAccount?.subtype ?? null;
                      const balance = tellerAccount?.current_balance ?? manualAccount?.current_balance ?? 0;
                      const availableBalance = tellerAccount?.available_balance;
                      const lastSynced = tellerAccount?.last_synced_at;
                      const createdAt = manualAccount?.created_at;
                      const isCredit = type === 'credit' || type === 'credit_card';

                      return (
                        <div key={account.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getAccountIcon(type, subtype)} />
                                </svg>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                  {account.name}
                                  {isManual && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded">
                                      Manual
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {type}{subtype ? ` - ${subtype.replace(/_/g, ' ')}` : ''}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className={`font-semibold text-lg ${isCredit ? 'text-red-600' : 'text-gray-900'}`}>
                                {isCredit && balance > 0 ? '-' : ''}${Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              {availableBalance != null && availableBalance !== balance && (
                                <div className="text-xs text-gray-500">
                                  Available: ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              )}
                              {lastSynced && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Updated {new Date(lastSynced).toLocaleDateString()}
                                </div>
                              )}
                              {createdAt && !lastSynced && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Added {new Date(createdAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Account Modal */}
      <ManualAccountModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSuccess={handleAccountSuccess}
      />
    </div>
  );
}
