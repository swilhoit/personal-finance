"use client";

import React, { useState, useMemo } from "react";
import { setTransactionCategory } from "./actions";

interface Transaction {
  transaction_id: string;
  date: string;
  name: string;
  merchant_name: string | null;
  amount: number;
  category: string | null;
  category_id: string | null;
  account_type: string; // 'depository' or 'credit'
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface TransactionsClientProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function TransactionsClient({ transactions, categories }: TransactionsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [pendingCategories, setPendingCategories] = useState<Record<string, boolean>>({});

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        (tx.merchant_name?.toLowerCase().includes(searchLower)) ||
        (tx.name?.toLowerCase().includes(searchLower)) ||
        (tx.category?.toLowerCase().includes(searchLower));

      // Type filter
      const isExpense = tx.amount < 0;
      const matchesType = filterType === "all" ||
        (filterType === "expense" && isExpense) ||
        (filterType === "income" && !isExpense);

      // Category filter
      const matchesCategory = filterCategory === "all" ||
        (filterCategory === "uncategorized" && !tx.category_id) ||
        tx.category_id === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchQuery, filterType, filterCategory]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};

    filteredTransactions.forEach((tx) => {
      const date = new Date(tx.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey: string;
      if (date.toDateString() === today.toDateString()) {
        dateKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = "Yesterday";
      } else if (date.getFullYear() === today.getFullYear()) {
        dateKey = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      } else {
        dateKey = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });

    return groups;
  }, [filteredTransactions]);

  // Stats
  const stats = useMemo(() => {
    const totalExpenses = filteredTransactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    // Only count income from depository accounts (checking/savings)
    // Credit card payments (positive amounts on credit accounts) are transfers, not income
    const totalIncome = filteredTransactions
      .filter(tx => tx.amount > 0 && tx.account_type === 'depository')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { totalExpenses, totalIncome, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const handleCategoryChange = async (transactionId: string, categoryId: string) => {
    setPendingCategories(prev => ({ ...prev, [transactionId]: true }));

    const formData = new FormData();
    formData.append("transaction_id", transactionId);
    formData.append("category_id", categoryId);

    await setTransactionCategory(formData);
    setPendingCategories(prev => ({ ...prev, [transactionId]: false }));
  };

  const getCategoryIcon = (categoryName: string | null) => {
    if (!categoryName) return "tag";
    const lower = categoryName.toLowerCase();
    if (lower.includes("food") || lower.includes("restaurant") || lower.includes("dining")) return "utensils";
    if (lower.includes("transport") || lower.includes("uber") || lower.includes("lyft") || lower.includes("gas")) return "car";
    if (lower.includes("shopping") || lower.includes("retail")) return "shopping-bag";
    if (lower.includes("entertainment") || lower.includes("movie") || lower.includes("game")) return "film";
    if (lower.includes("health") || lower.includes("medical") || lower.includes("pharmacy")) return "heart";
    if (lower.includes("bill") || lower.includes("utility")) return "file-text";
    if (lower.includes("subscription") || lower.includes("software")) return "repeat";
    if (lower.includes("income") || lower.includes("salary") || lower.includes("deposit")) return "dollar-sign";
    return "tag";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
              <p className="text-sm text-gray-500 mt-1">
                {stats.count} transaction{stats.count !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-3">
              <div className="bg-red-50 rounded-lg px-4 py-2 border border-red-100">
                <p className="text-xs text-red-600 font-medium">Spent</p>
                <p className="text-lg font-semibold text-red-700">
                  ${stats.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg px-4 py-2 border border-green-100">
                <p className="text-xs text-green-600 font-medium">Earned</p>
                <p className="text-lg font-semibold text-green-700">
                  ${stats.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              {[
                { value: "all", label: "All" },
                { value: "expense", label: "Expenses" },
                { value: "income", label: "Income" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterType(option.value as typeof filterType)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    filterType === option.value
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
            >
              <option value="all">All Categories</option>
              <option value="uncategorized">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery || filterType !== "all" || filterCategory !== "all"
                ? "Try adjusting your filters"
                : "Connect a bank account to start tracking"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDate).map(([dateLabel, txs]) => (
              <div key={dateLabel}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-sm font-medium text-gray-500">{dateLabel}</h2>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">{txs.length} item{txs.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Transactions */}
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                  {txs.map((tx) => {
                    const isExpense = tx.amount < 0;
                    const isIncome = tx.amount > 0 && tx.account_type === 'depository';
                    const isCreditPayment = tx.amount > 0 && tx.account_type === 'credit';
                    const isPending = pendingCategories[tx.transaction_id];

                    return (
                      <div
                        key={tx.transaction_id}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                      >
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isIncome ? 'bg-green-100 text-green-600' :
                          isCreditPayment ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <TransactionIcon name={isCreditPayment ? 'credit-card' : getCategoryIcon(tx.category)} />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {tx.merchant_name || tx.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {/* Category Selector */}
                            <select
                              value={tx.category_id || ""}
                              onChange={(e) => handleCategoryChange(tx.transaction_id, e.target.value)}
                              disabled={isPending}
                              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                tx.category_id
                                  ? 'bg-gray-100 border-gray-200 text-gray-600'
                                  : 'bg-amber-50 border-amber-200 text-amber-700'
                              } ${isPending ? 'opacity-50' : ''} focus:outline-none focus:ring-2 focus:ring-gray-300`}
                            >
                              <option value="">Uncategorized</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right flex-shrink-0">
                          <p className={`font-semibold ${
                            isIncome ? 'text-green-600' :
                            isCreditPayment ? 'text-blue-600' :
                            'text-gray-900'
                          }`}>
                            {isCreditPayment ? '' : (isExpense ? '−' : '+')}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          {isCreditPayment && (
                            <p className="text-xs text-blue-500">Payment</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    "credit-card": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    "utensils": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    "car": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h8m-8 5h8m-4-9a9 9 0 110 18 9 9 0 010-18z" />
      </svg>
    ),
    "shopping-bag": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    "film": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
    "heart": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    "file-text": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    "repeat": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    "dollar-sign": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    "tag": (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  };

  return icons[name] || icons["tag"];
}
