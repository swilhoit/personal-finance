import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TellerConnect from "@/components/TellerConnect";

type Account = {
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
};

type Enrollment = {
  id: string;
  enrollment_id: string;
  institution_name: string | null;
  created_at: string;
};

export default async function AccountsPage() {
  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const [{ data: accounts }, { data: enrollments }] = await Promise.all([
    supabase
      .from("teller_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("current_balance", { ascending: false }),
    supabase
      .from("teller_enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active"),
  ]);

  const enrollmentMap = new Map((enrollments as Enrollment[] ?? []).map((e) => [e.id, e]));

  // Group accounts by institution
  const accountsByInstitution = (accounts as Account[] ?? []).reduce((acc, account) => {
    const institution = account.institution_name ?? "Unknown Institution";
    if (!acc[institution]) acc[institution] = [];
    acc[institution].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  // Calculate totals
  const totalBalance = (accounts as Account[] ?? []).reduce((sum, a) => sum + (a.current_balance ?? 0), 0);
  const totalAvailable = (accounts as Account[] ?? []).reduce((sum, a) => sum + (a.available_balance ?? 0), 0);

  // Get account type icon
  const getAccountIcon = (type: string | null, subtype: string | null) => {
    if (type === "credit" || type === "credit_card") return "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z";
    if (subtype?.includes("savings")) return "M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 12h6m-3-3v6";
    if (subtype?.includes("checking") || type === "depository") return "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z";
    return "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
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
              <form action="/api/teller/sync" method="POST">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Sync Accounts
                </button>
              </form>
              <TellerConnect />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Total Balance</p>
            <p className="text-2xl font-semibold text-gray-900">${totalBalance.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Across all accounts</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Available</p>
            <p className="text-2xl font-semibold text-gray-900">${totalAvailable.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Ready to spend</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Accounts</p>
            <p className="text-2xl font-semibold text-gray-900">{accounts?.length ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Connected</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Institutions</p>
            <p className="text-2xl font-semibold text-gray-900">{Object.keys(accountsByInstitution).length}</p>
            <p className="text-xs text-gray-500 mt-1">Linked banks</p>
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
              Connect your bank accounts to start tracking your finances and get personalized insights.
            </p>
            <TellerConnect />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(accountsByInstitution).map(([institution, institutionAccounts]) => (
              <div key={institution}>
                <h2 className="text-sm font-medium text-gray-700 mb-3">
                  {institution}
                </h2>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {institutionAccounts.map((account) => (
                      <div key={account.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getAccountIcon(account.type, account.subtype)} />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {account.name}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">
                                {account.type}{account.subtype ? ` - ${account.subtype.replace(/_/g, ' ')}` : ""}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-semibold text-lg text-gray-900">
                              ${(account.current_balance ?? 0).toFixed(2)}
                            </div>
                            {account.available_balance != null && account.available_balance !== account.current_balance && (
                              <div className="text-xs text-gray-500">
                                Available: ${account.available_balance.toFixed(2)}
                              </div>
                            )}
                            {account.last_synced_at && (
                              <div className="text-xs text-gray-400 mt-1">
                                Updated {new Date(account.last_synced_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
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
    </div>
  );
}
