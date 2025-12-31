'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { FileDropZone } from '@/components/FileDropZone';

type Step = 'select-account' | 'upload' | 'preview' | 'importing' | 'result';

interface Account {
  id: string;
  name: string;
  type: string;
  source: 'manual' | 'teller';
  institution?: string;
}

interface PreviewResult {
  success: boolean;
  format: {
    name: string;
    confidence: number;
    dateColumn: string;
    descriptionColumn: string;
    amountColumn: string | { debit: string; credit: string };
  };
  preview: {
    totalRows: number;
    parsedTransactions: number;
    sampleTransactions: Array<{
      date: string;
      description: string;
      amount: number;
      transactionId: string;
    }>;
    headers: string[];
  };
  errors: string[];
  warnings: string[];
  warningsCount: number;
}

interface ImportResult {
  success: boolean;
  importId?: string;
  stats?: {
    totalParsed: number;
    imported: number;
    skipped: number;
    warnings: number;
  };
  format?: string;
  warnings?: string[];
  error?: string;
}

interface CSVImportWizardProps {
  accounts: Account[];
  onComplete: () => void;
}

export function CSVImportWizard({ accounts, onComplete }: CSVImportWizardProps) {
  const [step, setStep] = useState<Step>('select-account');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setStep('upload');
  };

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedAccount) return;

    setFile(selectedFile);
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('accountId', selectedAccount.id);

      const response = await fetch('/api/import/csv/preview', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to preview file');
        return;
      }

      setPreview(data);
      setStep('preview');
    } catch {
      setError('Failed to preview file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAccount]);

  const handleImport = async () => {
    if (!file || !selectedAccount) return;

    setStep('importing');
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('accountId', selectedAccount.id);
      formData.append('accountType', selectedAccount.source);

      const response = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      setImportResult(data);
      setStep('result');
    } catch {
      setError('Failed to import file. Please try again.');
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('select-account');
    setSelectedAccount(null);
    setFile(null);
    setPreview(null);
    setImportResult(null);
    setError(null);
  };

  const formatAmount = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    return amount < 0 ? `-${formatted}` : formatted;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Progress Steps */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2 text-sm">
          {[
            { key: 'select-account', label: '1. Select Account' },
            { key: 'upload', label: '2. Upload' },
            { key: 'preview', label: '3. Preview' },
            { key: 'result', label: '4. Complete' },
          ].map((s, idx) => (
            <div key={s.key} className="flex items-center">
              {idx > 0 && <div className="w-8 h-px bg-gray-300 mx-2" />}
              <span
                className={`
                  ${step === s.key || (s.key === 'importing' && step === 'result')
                    ? 'text-cyan-600 font-medium'
                    : 'text-gray-400'
                  }
                `}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Select Account */}
        {step === 'select-account' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select an Account
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose the account where you want to import transactions.
            </p>

            {accounts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  You need to create an account first before importing transactions.
                </p>
                <Button variant="secondary" onClick={() => window.location.href = '/accounts'}>
                  Go to Accounts
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleAccountSelect(account)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-500">
                          {account.institution || 'Manual Account'} &middot; {account.type}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {account.source === 'manual' ? 'Manual' : 'Connected'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Upload File */}
        {step === 'upload' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Upload CSV File
                </h3>
                <p className="text-sm text-gray-600">
                  Importing to: <span className="font-medium">{selectedAccount?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setStep('select-account')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Change account
              </button>
            </div>

            <FileDropZone
              onFileSelect={handleFileSelect}
              accept=".csv"
              maxSize={10 * 1024 * 1024}
              disabled={isLoading}
            />

            {isLoading && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Analyzing file...
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Supported formats:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>&bull; Chase, Amex, Capital One, Bank of America, Wells Fargo, Discover</li>
                <li>&bull; Most banks that export transactions as CSV</li>
                <li>&bull; Generic CSV with date, description, and amount columns</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && preview && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Review Import
                </h3>
                <p className="text-sm text-gray-600">
                  File: <span className="font-medium">{file?.name}</span>
                </p>
              </div>
              <button
                onClick={() => setStep('upload')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Choose different file
              </button>
            </div>

            {/* Format Detection */}
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-green-800">
                  Detected format: {preview.format.name.charAt(0).toUpperCase() + preview.format.name.slice(1)}
                  {preview.format.confidence >= 0.8 && ' (high confidence)'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-gray-900">
                  {preview.preview.totalRows}
                </div>
                <div className="text-xs text-gray-600">Total rows</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-green-600">
                  {preview.preview.parsedTransactions}
                </div>
                <div className="text-xs text-gray-600">Valid transactions</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-semibold text-yellow-600">
                  {preview.warningsCount}
                </div>
                <div className="text-xs text-gray-600">Warnings</div>
              </div>
            </div>

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-1">Warnings:</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {preview.warnings.map((w, i) => (
                    <li key={i}>&bull; {w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sample Transactions */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Sample Transactions</span>
              </div>
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {preview.preview.sampleTransactions.map((tx, idx) => (
                  <div key={idx} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{tx.description}</div>
                      <div className="text-xs text-gray-500">{tx.date}</div>
                    </div>
                    <div className={`text-sm font-medium ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatAmount(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setStep('upload')}
                fullWidth
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                isLoading={isLoading}
                fullWidth
              >
                Import {preview.preview.parsedTransactions} Transactions
              </Button>
            </div>
          </div>
        )}

        {/* Step 3.5: Importing */}
        {step === 'importing' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Importing Transactions...
            </h3>
            <p className="text-sm text-gray-600">
              Please wait while we import your transactions.
            </p>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 'result' && importResult && (
          <div className="text-center py-8">
            {importResult.success ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Import Complete!
                </h3>
                <p className="text-gray-600 mb-6">
                  Successfully imported {importResult.stats?.imported} transactions.
                </p>

                {importResult.stats && importResult.stats.skipped > 0 && (
                  <p className="text-sm text-yellow-600 mb-4">
                    {importResult.stats.skipped} duplicate transactions were skipped.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Import Failed
                </h3>
                <p className="text-red-600 mb-6">
                  {importResult.error || 'An error occurred during import.'}
                </p>
              </>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={handleReset}>
                Import Another File
              </Button>
              <Button variant="primary" onClick={onComplete}>
                View Transactions
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
