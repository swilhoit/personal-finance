'use client';

import { useRouter } from 'next/navigation';
import { CSVImportWizard } from '@/components/CSVImportWizard';

interface Account {
  id: string;
  name: string;
  type: string;
  source: 'manual' | 'teller';
  institution?: string;
}

interface ImportClientProps {
  accounts: Account[];
}

export default function ImportClient({ accounts }: ImportClientProps) {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/transactions');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-semibold text-gray-900">Import Transactions</h1>
          <p className="text-sm text-gray-600 mt-1">
            Upload CSV files from your bank to import transactions
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CSVImportWizard accounts={accounts} onComplete={handleComplete} />

        {/* Help Section */}
        <div className="mt-8 p-6 bg-white border border-gray-200 rounded-xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            How to Export Transactions from Your Bank
          </h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-900">Chase</p>
              <p>Log in &rarr; Account &rarr; Download account activity &rarr; Select CSV</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">American Express</p>
              <p>Log in &rarr; Statements & Activity &rarr; Download &rarr; CSV</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Capital One</p>
              <p>Log in &rarr; Account details &rarr; Download transactions &rarr; CSV</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Bank of America</p>
              <p>Log in &rarr; Statements &rarr; Download &rarr; Spreadsheet (CSV)</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Wells Fargo</p>
              <p>Log in &rarr; Account Activity &rarr; Download &rarr; Comma Separated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
