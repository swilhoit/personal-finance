"use client";

interface Category {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon?: string;
}

interface CategoryBreakdownProps {
  categories: Category[];
}

export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  const getCategoryIcon = (name: string) => {
    const icons: Record<string, string> = {
      "Food & Dining": "M3 3h18v18H3zM12 7.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3z",
      "Transportation": "M4 16V4a2 2 0 012-2h12a2 2 0 012 2v12m-4 4H8m4-4v4",
      "Shopping": "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17",
      "Entertainment": "M7 4v16M17 4v16M3 12h18M3 8h18M3 16h18",
      "Bills & Utilities": "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
      "Healthcare": "M19 14c1.66 0 3 1.34 3 3s-1.34 3-3 3c-1.31 0-2.42-.83-2.83-2H14v2a2 2 0 01-2 2 2 2 0 01-2-2v-2H7.83A2.99 2.99 0 015 21a3 3 0 010-6c1.31 0 2.42.83 2.83 2H10v-2a2 2 0 012-2 2 2 0 012 2v2h2.17c.41-1.17 1.52-2 2.83-2z",
      default: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    };
    return icons[name] || icons.default;
  };

  return (
    <div className="space-y-4">
      {/* Visual breakdown */}
      <div className="flex h-8 rounded-lg overflow-hidden">
        {categories.map((category, index) => (
          <div
            key={index}
            className="transition-all duration-300 hover:opacity-80"
            style={{
              width: `${category.percentage}%`,
              backgroundColor: category.color,
            }}
            title={`${category.name}: ${category.percentage.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Category list */}
      <div className="space-y-3">
        {categories.map((category, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: category.color + "20" }}
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke={category.color} 
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path d={getCategoryIcon(category.name)} />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">{category.name}</p>
                <p className="text-xs text-gray-500">
                  {category.percentage.toFixed(1)}% of total
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">${category.amount.toFixed(2)}</p>
              <div className="flex items-center gap-1 justify-end">
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${category.percentage}%`,
                      backgroundColor: category.color 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
