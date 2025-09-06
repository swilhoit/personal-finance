import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlaidLinkButton from "@/components/PlaidLinkButton";

type Account = {
  item_id: string;
  account_id: string;
  name: string | null;
  official_name: string | null;
  mask: string | null;
  type: string | null;
  subtype: string | null;
  current_balance: number | null;
  available_balance: number | null;
  iso_currency_code: string | null;
};

type Institution = {
  item_id: string;
  institution_id: string | null;
  institution_name: string | null;
  created_at: string;
};

export default async function AccountsPage() {
  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/sign-in");
  }

  const [{ data: accounts }, { data: items }, { data: lastRun }] = await Promise.all([
    supabase
      .from("plaid_accounts")
      .select("item_id, account_id, name, official_name, mask, type, subtype, current_balance, available_balance, iso_currency_code")
      .eq("user_id", user.id)
      .order("current_balance", { ascending: false }),
    supabase
      .from("plaid_items")
      .select("item_id, institution_id, institution_name, created_at")
      .eq("user_id", user.id),
    supabase
      .from("sync_runs")
      .select("started_at, ended_at, success")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(1),
  ]);

  const itemMap = new Map((items as Institution[] ?? []).map((i) => [i.item_id, i]));
  const lastSync = lastRun?.[0]?.started_at ? new Date(lastRun[0].started_at) : null;
  const lastSyncSuccess = lastRun?.[0]?.success ?? false;
  
  // Group accounts by institution
  const accountsByInstitution = (accounts as Account[] ?? []).reduce((acc, account) => {
    const institution = itemMap.get(account.item_id)?.institution_name ?? "Unknown Institution";
    if (!acc[institution]) acc[institution] = [];
    acc[institution].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  // Calculate totals
  const totalBalance = (accounts as Account[] ?? []).reduce((sum, a) => sum + (a.current_balance ?? 0), 0);
  const totalAvailable = (accounts as Account[] ?? []).reduce((sum, a) => sum + (a.available_balance ?? 0), 0);

  // Get account type icon
  const getAccountIcon = (type: string | null, subtype: string | null) => {
    if (type === "credit") return "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z";
    if (subtype?.includes("savings")) return "M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 12h6m-3-3v6";
    if (subtype?.includes("checking")) return "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z";
    if (type === "investment") return "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6";
    return "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Accounts</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your connected bank accounts and credit cards
              </p>
            </div>
            <div className="flex items-center gap-3">
              {lastSync && (
                <div className="text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${lastSyncSuccess ? 'bg-green-600' : 'bg-red-600'}`} />
                    Last sync: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}
              <form action="/api/plaid/sync-transactions" method="POST">
                <button className="px-4 py-2 text-sm font-dm-mono border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Sync Accounts
                </button>
              </form>
              <PlaidLinkButton />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Balance</p>
            <p className="text-2xl font-bold">${totalBalance.toFixed(2)}</p>
            <p className="text-xs text-gray-600 mt-1">Across all accounts</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Available</p>
            <p className="text-2xl font-bold">${totalAvailable.toFixed(2)}</p>
            <p className="text-xs text-gray-600 mt-1">Ready to spend</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Accounts</p>
            <p className="text-2xl font-bold">{accounts?.length ?? 0}</p>
            <p className="text-xs text-gray-600 mt-1">Connected</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Institutions</p>
            <p className="text-2xl font-bold">{Object.keys(accountsByInstitution).length}</p>
            <p className="text-xs text-gray-600 mt-1">Linked banks</p>
          </div>
        </div>

        {/* Accounts List */}
        {Object.keys(accountsByInstitution).length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">No accounts connected</h2>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Connect your bank accounts to start tracking your finances.
            </p>
            <PlaidLinkButton />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(accountsByInstitution).map(([institution, institutionAccounts]) => (
              <div key={institution}>
                <h2 className="text-sm font-semibold text-gray-600 mb-3">
                  {institution}
                </h2>
                <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {institutionAccounts.map((account) => (
                      <div key={account.account_id} className="p-4 hover:bg-white transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getAccountIcon(account.type, account.subtype)} />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium">
                                {account.name ?? account.official_name ?? "Account"}
                                {account.mask && (
                                  <span className="text-gray-500 ml-2">•••{account.mask}</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">
                                {account.type}{account.subtype ? ` - ${account.subtype.replace(/_/g, ' ')}` : ""}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold text-lg">
                              ${(account.current_balance ?? 0).toFixed(2)}
                            </div>
                            {account.available_balance != null && account.available_balance !== account.current_balance && (
                              <div className="text-xs text-gray-500">
                                Available: ${account.available_balance.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Account Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                          <button className="text-xs font-dm-mono text-blue-600 hover:text-blue-700 transition-colors">
                            View Transactions
                          </button>
                          <span className="text-gray-300">•</span>
                          <button className="text-xs font-dm-mono text-blue-600 hover:text-blue-700 transition-colors">
                            Account Details
                          </button>
                          <span className="text-gray-300">•</span>
                          <button 
                            data-reconnect-item={account.item_id}
                            className="text-xs text-red-600 hover:text-red-700 transition-colors"
                          >
                            Reconnect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Script for Plaid reconnection */}
      <script
        dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('click', async (e) => {
            const target = e.target;
            const id = target?.getAttribute?.('data-reconnect-item');
            if (!id) return;
            try {
              const res = await fetch('/api/plaid/update-link-token?item_id=' + encodeURIComponent(id), { method: 'POST' });
              const data = await res.json();
              if (data.link_token && window.Plaid) {
                const handler = window.Plaid.create({ 
                  token: data.link_token,
                  onSuccess: () => window.location.reload()
                });
                handler.open();
              }
            } catch (error) {
              console.error('Failed to reconnect:', error);
            }
          });
        ` }}
      />
    </div>
  );
}