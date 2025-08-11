import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import PlaidLinkButton from "@/components/PlaidLinkButton";
import DashboardCard from "@/components/DashboardCard";
import QuickStats from "@/components/QuickStats";
import RecentTransactionsList from "@/components/RecentTransactionsList";
import SpendingOverview from "@/components/SpendingOverview";

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
    <div className="min-h-screen bg-[#faf8f5] dark:bg-black">
      {/* Header Section */}
      <div className="bg-[#f5f0e8] dark:bg-zinc-900 border-b border-[#e8dfd2] dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back!</h1>
              <p className="text-sm text-[#7d6754] dark:text-zinc-400 mt-1">
                Here&apos;s your financial overview
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasAccounts && (
                <form action="/api/plaid/sync-transactions" method="POST">
                  <button className="px-4 py-2 text-sm border border-[#d4c4b0] dark:border-zinc-700 rounded-lg hover:bg-[#f5f0e8] dark:hover:bg-zinc-800 transition-colors">
                    Sync Transactions
                  </button>
                </form>
              )}
              <PlaidLinkButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!hasAccounts ? (
          /* Empty State */
          <div className="bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-[#d4c4b0] dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">Get started by connecting your bank</h2>
            <p className="text-[#7d6754] dark:text-zinc-400 mb-6 max-w-sm mx-auto">
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
                  <div key={i} className="h-24 bg-[#e8dfd2] dark:bg-zinc-800 rounded-xl animate-pulse" />
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
                        <div key={i} className="h-12 bg-[#f5f0e8] dark:bg-zinc-800 rounded animate-pulse" />
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
                        <div key={i} className="h-8 bg-[#f5f0e8] dark:bg-zinc-800 rounded animate-pulse" />
                      ))}
                    </div>
                  }>
                    <SpendingOverview />
                  </Suspense>
                </DashboardCard>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/transactions" className="group relative overflow-hidden p-6 bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 hover:border-[#7a95a7] dark:hover:border-blue-400 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-[#7a95a7]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-8 h-8 mb-3 text-[#7a95a7] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="font-semibold">Transactions</p>
                <p className="text-xs text-[#7d6754] dark:text-zinc-400 mt-1">View and categorize</p>
              </a>
              
              <a href="/insights" className="group relative overflow-hidden p-6 bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 hover:border-[#9b826f] dark:hover:border-purple-400 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-[#9b826f]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-8 h-8 mb-3 text-[#9b826f] dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="font-semibold">Insights</p>
                <p className="text-xs text-[#7d6754] dark:text-zinc-400 mt-1">Spending analytics</p>
              </a>
              
              <a href="/chat" className="group relative overflow-hidden p-6 bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 hover:border-[#87a878] dark:hover:border-green-400 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-[#87a878]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-8 h-8 mb-3 text-[#87a878] dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="font-semibold">AI Assistant</p>
                <p className="text-xs text-[#7d6754] dark:text-zinc-400 mt-1">Ask questions</p>
              </a>
              
              <a href="/settings" className="group relative overflow-hidden p-6 bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 hover:border-[#d4a574] dark:hover:border-amber-400 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-[#d4a574]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-8 h-8 mb-3 text-[#d4a574] dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="font-semibold">Settings</p>
                <p className="text-xs text-[#7d6754] dark:text-zinc-400 mt-1">Manage categories</p>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}