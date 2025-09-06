import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import PlaidLinkButton from "@/components/PlaidLinkButton";
import DashboardCard from "@/components/DashboardCard";
import QuickStats from "@/components/QuickStats";
import RecentTransactionsList from "@/components/RecentTransactionsList";
import SpendingOverview from "@/components/SpendingOverview";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient(true);
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
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-gray-50 border-b-4 border-cyan-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-dm-mono font-black text-gray-900">LEVEL UP!</h1>
              <p className="text-sm font-dm-mono text-gray-600 mt-1">
                YOUR FINANCIAL QUEST CONTINUES
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasAccounts && (
                <form action="/api/plaid/sync-transactions" method="POST">
                  <button className="px-6 py-3 text-sm font-dm-mono text-cyan-700 bg-cyan-100 border-2 border-cyan-400 rounded-xl hover:bg-cyan-200 hover:scale-105 transition-all">
                    🔄 SYNC
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
          <div className="bg-white rounded-3xl border-4 border-cyan-400 p-12 text-center">
            <div className="text-6xl mb-4 animate-bounce">🎮</div>
            <h2 className="text-3xl font-dm-mono font-black mb-2 text-gray-900">NEW GAME</h2>
            <p className="font-dm-mono text-gray-600 mb-6 max-w-sm mx-auto">
              CONNECT YOUR BANK TO START YOUR FINANCIAL ADVENTURE!
            </p>
            <PlaidLinkButton />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Stats */}
            <Suspense fallback={
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
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
                        <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
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
                        <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
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
              <a href="/transactions" className="group relative overflow-hidden p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-cyan-400 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-8 h-8 mb-3 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="font-dm-mono font-semibold text-gray-900">Transactions</p>
                <p className="text-xs font-dm-mono text-gray-600 mt-1">View and categorize</p>
              </a>
              
              <a href="/insights" className="group relative overflow-hidden p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-purple-400 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-8 h-8 mb-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="font-dm-mono font-semibold text-gray-900">Insights</p>
                <p className="text-xs font-dm-mono text-gray-600 mt-1">Spending analytics</p>
              </a>
              
              <a href="/chat" className="group relative overflow-hidden p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-green-400 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-8 h-8 mb-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="font-dm-mono font-semibold text-gray-900">AI Assistant</p>
                <p className="text-xs font-dm-mono text-gray-600 mt-1">Ask questions</p>
              </a>
              
              <a href="/settings" className="group relative overflow-hidden p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-amber-400 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-8 h-8 mb-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="font-dm-mono font-semibold text-gray-900">Settings</p>
                <p className="text-xs font-dm-mono text-gray-600 mt-1">Manage categories</p>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}