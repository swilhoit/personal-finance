import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import TellerConnect from "@/components/TellerConnect";
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

  // Check if user has connected accounts via Teller
  const { data: accounts } = await supabase
    .from("teller_accounts")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1);

  const hasAccounts = accounts && accounts.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Overview of your financial accounts
              </p>
            </div>
            <div className="flex items-center gap-3">
              {hasAccounts && (
                <form action="/api/teller/sync" method="POST">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Sync Accounts
                  </button>
                </form>
              )}
              <TellerConnect />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!hasAccounts ? (
          /* Empty State */
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">No Accounts Connected</h2>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Connect your bank account to start tracking your finances and get personalized insights.
            </p>
            <TellerConnect />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Stats */}
            <Suspense fallback={
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-white border border-gray-200 rounded-lg animate-pulse" />
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
                        <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
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
                        <div key={i} className="h-8 bg-gray-50 rounded animate-pulse" />
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
              <a href="/transactions" className="group p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-all">
                <svg className="w-6 h-6 mb-3 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="font-medium text-gray-900">Transactions</p>
                <p className="text-sm text-gray-600 mt-1">View and categorize</p>
              </a>

              <a href="/insights" className="group p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-all">
                <svg className="w-6 h-6 mb-3 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="font-medium text-gray-900">Insights</p>
                <p className="text-sm text-gray-600 mt-1">Spending analytics</p>
              </a>

              <a href="/chat" className="group p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-all">
                <svg className="w-6 h-6 mb-3 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="font-medium text-gray-900">AI Assistant</p>
                <p className="text-sm text-gray-600 mt-1">Financial guidance</p>
              </a>

              <a href="/settings" className="group p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-all">
                <svg className="w-6 h-6 mb-3 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="font-medium text-gray-900">Settings</p>
                <p className="text-sm text-gray-600 mt-1">Manage preferences</p>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
