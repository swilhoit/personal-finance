/**
 * Centralized formatting utilities for consistent display across the app
 */

/**
 * Format a number as USD currency
 * @param value - The numeric value to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(
  value: number | null | undefined,
  options: {
    showSign?: boolean;      // Show +/- prefix
    compact?: boolean;       // Use compact notation (1K, 1M, 1B, 1T)
    decimals?: number;       // Number of decimal places (default: 2)
    showCents?: boolean;     // Show cents even for round numbers (default: true)
  } = {}
): string {
  const { showSign = false, compact = false, decimals = 2, showCents = true } = options;

  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }

  const absValue = Math.abs(value);

  // Compact notation for large numbers
  if (compact) {
    if (absValue >= 1e12) {
      return `${value < 0 ? '-' : showSign && value > 0 ? '+' : ''}$${(absValue / 1e12).toFixed(1)}T`;
    }
    if (absValue >= 1e9) {
      return `${value < 0 ? '-' : showSign && value > 0 ? '+' : ''}$${(absValue / 1e9).toFixed(1)}B`;
    }
    if (absValue >= 1e6) {
      return `${value < 0 ? '-' : showSign && value > 0 ? '+' : ''}$${(absValue / 1e6).toFixed(1)}M`;
    }
    if (absValue >= 1e3) {
      return `${value < 0 ? '-' : showSign && value > 0 ? '+' : ''}$${(absValue / 1e3).toFixed(1)}K`;
    }
  }

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? decimals : 0,
    maximumFractionDigits: decimals,
  }).format(absValue);

  const sign = value < 0 ? '-' : showSign && value > 0 ? '+' : '';

  return sign + formatted;
}

/**
 * Format a number as a percentage
 * @param value - The numeric value (e.g., 5.25 for 5.25%)
 * @param options - Formatting options
 * @returns Formatted percentage string (e.g., "+5.25%")
 */
export function formatPercent(
  value: number | null | undefined,
  options: {
    showSign?: boolean;      // Show +/- prefix (default: true for non-zero)
    decimals?: number;       // Number of decimal places (default: 2)
  } = {}
): string {
  const { showSign = true, decimals = 2 } = options;

  if (value === null || value === undefined || isNaN(value)) {
    return '0.00%';
  }

  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format a date with various styles
 * @param date - Date to format
 * @param style - Format style
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | null | undefined,
  style: 'relative' | 'short' | 'long' | 'monthYear' | 'time' = 'short'
): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  switch (style) {
    case 'relative': {
      // Today, Yesterday, or specific date
      if (dateOnly.getTime() === today.getTime()) {
        return 'Today';
      }
      if (dateOnly.getTime() === yesterday.getTime()) {
        return 'Yesterday';
      }
      // Within last 7 days, show day name
      const daysAgo = Math.floor((today.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo < 7) {
        return d.toLocaleDateString('en-US', { weekday: 'long' });
      }
      // Otherwise show short date
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    case 'short':
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

    case 'long':
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

    case 'monthYear':
      return d.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

    case 'time':
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

    default:
      return d.toLocaleDateString('en-US');
  }
}

/**
 * Format relative time (e.g., "5 minutes ago", "2 hours ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return formatDate(d, 'short');
}

/**
 * Format a number with commas for thousands
 * @param value - Number to format
 * @param decimals - Decimal places (default: 0)
 * @returns Formatted number string (e.g., "1,234,567")
 */
export function formatNumber(
  value: number | null | undefined,
  decimals: number = 0
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format market cap with appropriate suffix (T/B/M/K)
 * @param value - Market cap value
 * @returns Formatted market cap string
 */
export function formatMarketCap(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;

  return `$${value.toFixed(2)}`;
}

/**
 * Get the appropriate CSS class for a value (positive = green, negative = red)
 * @param value - Numeric value
 * @param options - Color options
 * @returns Tailwind CSS class string
 */
export function getValueColorClass(
  value: number | null | undefined,
  options: {
    positiveClass?: string;
    negativeClass?: string;
    neutralClass?: string;
  } = {}
): string {
  const {
    positiveClass = 'text-green-600',
    negativeClass = 'text-red-600',
    neutralClass = 'text-gray-900',
  } = options;

  if (value === null || value === undefined || value === 0) {
    return neutralClass;
  }

  return value > 0 ? positiveClass : negativeClass;
}
