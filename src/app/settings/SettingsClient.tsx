"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { createCategory, deleteCategory, createBudget, deleteBudget, createRule, deleteRule } from "./actions";

type Category = {
  id: string;
  name: string;
  type: string;
};

type BudgetWithCategory = {
  id: string;
  month: string;
  amount: number;
  category_id: string;
  categories: { name?: string } | null;
};

type Rule = { 
  id: string; 
  matcher_type: string; 
  matcher_value: string; 
  priority: number; 
  category_id: string;
  categories: { name?: string } | null;
};

interface SettingsClientProps {
  categories: Category[];
  budgets: BudgetWithCategory[];
  rules: Rule[];
  currentMonth: string;
}

export default function SettingsClient({ categories, budgets, rules, currentMonth }: SettingsClientProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
              Manage categories, budgets, and automation rules
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Theme Settings */}
          <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Appearance</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Customize how the app looks
              </p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 rounded-lg">
              <div>
                <div className="font-medium text-sm">Theme</div>
                <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  Switch between light and dark mode
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-4 py-2 bg-gray-200 dark:bg-zinc-700 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors"
              >
                {theme === "light" ? (
                  <>
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span className="text-sm font-medium">Dark</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-sm font-medium">Light</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Categories Section */}
          <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Categories</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Organize your transactions into categories
              </p>
            </div>
            
            <form action={createCategory} className="space-y-3 mb-4 p-4 bg-white dark:bg-zinc-800 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 block mb-1">
                    Category Name
                  </label>
                  <input 
                    name="name" 
                    placeholder="e.g., Groceries"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 block mb-1">
                    Type
                  </label>
                  <select 
                    name="type" 
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Add Category
              </button>
            </form>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">
                  No categories yet. Add one above.
                </p>
              ) : (
                categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{c.name}</div>
                      <div className="text-xs text-gray-500 dark:text-zinc-400 capitalize">{c.type}</div>
                    </div>
                    <form action={deleteCategory}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-xs text-red-600 hover:text-red-700 transition-colors">
                        Remove
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Budgets Section */}
          <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Monthly Budgets</h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Set spending limits for each category
              </p>
            </div>

            <form action={createBudget} className="space-y-3 mb-4 p-4 bg-white dark:bg-zinc-800 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 block mb-1">
                    Category
                  </label>
                  <select 
                    name="category_id" 
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.filter(c => c.type === 'expense').map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 block mb-1">
                    Amount
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="amount" 
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 block mb-1">
                  Month
                </label>
                <input 
                  type="month" 
                  name="month" 
                  defaultValue={currentMonth}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                Set Budget
              </button>
            </form>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {budgets.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">
                  No budgets set. Add one above.
                </p>
              ) : (
                budgets.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{b.categories?.name ?? "Category"}</div>
                      <div className="text-xs text-gray-500 dark:text-zinc-400">
                        {new Date(b.month + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · ${Number(b.amount).toFixed(2)}
                      </div>
                    </div>
                    <form action={deleteBudget}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="text-xs text-red-600 hover:text-red-700 transition-colors">
                        Remove
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Auto-Categorization Rules */}
          <div className="lg:col-span-2 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Auto-Categorization Rules</h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  Automatically categorize transactions based on patterns
                </p>
              </div>
              <form action="/api/rules/apply" method="POST">
                <button className="px-4 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors">
                  Apply Rules Now
                </button>
              </form>
            </div>

            <form action={createRule} className="mb-4 p-4 bg-white dark:bg-zinc-800 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                <div className="lg:col-span-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 block mb-1">
                    Category
                  </label>
                  <select 
                    name="category_id" 
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 block mb-1">
                    Match Type
                  </label>
                  <select 
                    name="matcher_type" 
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="merchant">Merchant Name</option>
                    <option value="name">Transaction Name</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 block mb-1">
                    Contains Text
                  </label>
                  <input 
                    name="matcher_value" 
                    placeholder="e.g., Starbucks"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-zinc-400 block mb-1">
                    Priority
                  </label>
                  <input 
                    type="number" 
                    name="priority" 
                    defaultValue={100}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                Add Rule
              </button>
            </form>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {rules.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">
                  No rules configured. Add one above to automate categorization.
                </p>
              ) : (
                rules.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">
                        {r.categories?.name ?? "Category"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-zinc-400">
                        When {r.matcher_type} contains &ldquo;{r.matcher_value}&rdquo; · Priority {r.priority}
                      </div>
                    </div>
                    <form action={deleteRule}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="text-xs text-red-600 hover:text-red-700 transition-colors">
                        Remove
                      </button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}