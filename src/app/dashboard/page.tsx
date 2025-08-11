import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import PlaidLinkButton from "@/components/PlaidLinkButton";
import DashboardCard from "@/components/DashboardCard";
import QuickStats from "@/components/QuickStats";
import RecentTransactionsList from "@/components/RecentTransactionsList";
import SpendingOverview from "@/components/SpendingOverview";
import UserMenu from "@/components/UserMenu";


export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Check if user has connected accounts
  const { data: accounts } = await supabase
    .from("plaid_accounts")
    .select("account_id")
    .eq("user_id", user.id)
    .limit(1);

  const hasAccounts = accounts && accounts.length > 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back!</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Here&apos;s your financial overview
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasAccounts && (
                <form action="/api/plaid/sync-transactions" method="POST">
                  <button className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    Sync
                  </button>
                </form>
              )}
              <PlaidLinkButton />
              <UserMenu userEmail={user.email} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!hasAccounts ? (
          /* Empty State */
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Get started by connecting your bank</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
              Securely connect your accounts to start tracking your finances and getting insights.
            </p>
            <PlaidLinkButton />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Stats */}
            <Suspense fallback={
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
                ))}
              </div>
            }>
              <QuickStats />
            </Suspense>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Transactions - Takes 2 columns on desktop */}
              <div className="lg:col-span-2">
                <DashboardCard title="Recent Transactions">
                  <Suspense fallback={
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      ))}
                    </div>
                  }>
                    <RecentTransactionsList />
                  </Suspense>
                </DashboardCard>
              </div>

              {/* Spending Overview - Takes 1 column */}
              <div>
                <DashboardCard title="Top Categories">
                  <Suspense fallback={
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      ))}
                    </div>
                  }>
                    <SpendingOverview />
                  </Suspense>
                </DashboardCard>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <a href="/transactions" className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-center">
                <svg className="w-6 h-6 mx-auto mb-2 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm font-medium">Transactions</p>
              </a>
              
              <a href="/insights" className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-center">
                <svg className="w-6 h-6 mx-auto mb-2 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm font-medium">Insights</p>
              </a>
              
              <a href="/accounts" className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-center">
                <svg className="w-6 h-6 mx-auto mb-2 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <p className="text-sm font-medium">Accounts</p>
              </a>
              
              <a href="/settings" className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-center">
                <svg className="w-6 h-6 mx-auto mb-2 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm font-medium">Settings</p>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}