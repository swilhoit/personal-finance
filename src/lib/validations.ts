/**
 * Centralized validation schemas using Zod
 * Use these schemas for consistent validation across forms and API routes
 */

import { z } from 'zod';

// ============================================
// Auth Schemas
// ============================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password must be less than 100 characters');

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// ============================================
// Category & Budget Schemas
// ============================================

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be less than 50 characters')
    .trim(),
  type: z.enum(['expense', 'income', 'both'], {
    errorMap: () => ({ message: 'Please select a valid category type' }),
  }),
});

export const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Please select a category'),
  amount: z
    .number({ invalid_type_error: 'Please enter a valid amount' })
    .positive('Budget amount must be greater than 0')
    .max(1000000, 'Budget amount is too large'),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Invalid month format (YYYY-MM)'),
});

// ============================================
// Categorization Rule Schemas
// ============================================

export const categorizationRuleSchema = z.object({
  categoryId: z.string().min(1, 'Please select a category'),
  matcherType: z.enum(['contains', 'starts_with', 'ends_with', 'exact', 'regex'], {
    errorMap: () => ({ message: 'Please select a valid matcher type' }),
  }),
  matcherValue: z
    .string()
    .min(1, 'Match value is required')
    .max(200, 'Match value must be less than 200 characters'),
  priority: z
    .number({ invalid_type_error: 'Priority must be a number' })
    .int('Priority must be a whole number')
    .min(0, 'Priority must be 0 or greater')
    .max(1000, 'Priority must be less than 1000')
    .default(0),
});

// ============================================
// Notification Schedule Schemas
// ============================================

export const notificationScheduleSchema = z.object({
  scheduleType: z.enum(['weekly_report', 'daily_summary', 'budget_alert', 'market_alert', 'recurring_reminder'], {
    errorMap: () => ({ message: 'Please select a valid schedule type' }),
  }),
  isEnabled: z.boolean().default(true),
  cronExpression: z
    .string()
    .min(1, 'Schedule is required')
    .regex(/^[\d\s\*\-\/,]+$/, 'Invalid cron expression'),
  timezone: z.string().default('America/New_York'),
  discordGuildId: z.string().optional(),
  discordChannelId: z.string().optional(),
  settings: z.record(z.unknown()).default({}),
});

// ============================================
// Watchlist Schemas
// ============================================

export const addToWatchlistSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Stock symbol is required')
    .max(10, 'Stock symbol is too long')
    .toUpperCase()
    .trim(),
  categoryId: z.string().optional(),
});

// ============================================
// Holdings Schemas
// ============================================

export const holdingSchema = z.object({
  symbol: z
    .string()
    .min(1, 'Stock symbol is required')
    .max(10, 'Stock symbol is too long')
    .toUpperCase()
    .trim(),
  shares: z
    .number({ invalid_type_error: 'Please enter a valid number of shares' })
    .positive('Number of shares must be greater than 0'),
  costBasis: z
    .number({ invalid_type_error: 'Please enter a valid cost basis' })
    .positive('Cost basis must be greater than 0'),
  portfolioCategoryId: z.string().optional(),
});

// ============================================
// Manual Account Schemas
// ============================================

export const manualAccountSchema = z.object({
  name: z
    .string()
    .min(1, 'Account name is required')
    .max(100, 'Account name must be less than 100 characters')
    .trim(),
  type: z.enum(['checking', 'savings', 'credit'], {
    errorMap: () => ({ message: 'Please select a valid account type' }),
  }),
  balance: z
    .number({ invalid_type_error: 'Please enter a valid balance' })
    .optional()
    .default(0),
});

// ============================================
// CSV Import Schemas
// ============================================

export const csvImportSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  accountType: z.enum(['manual', 'teller'], {
    errorMap: () => ({ message: 'Invalid account type' }),
  }),
});

// ============================================
// Manual Transaction Schemas
// ============================================

export const manualTransactionSchema = z.object({
  accountId: z.string().uuid('Please select an account'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters')
    .trim(),
  amount: z.number({ invalid_type_error: 'Please enter a valid amount' }),
  category: z.string().optional(),
});

// ============================================
// Type Exports (inferred from schemas)
// ============================================

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type BudgetFormData = z.infer<typeof budgetSchema>;
export type CategorizationRuleFormData = z.infer<typeof categorizationRuleSchema>;
export type NotificationScheduleFormData = z.infer<typeof notificationScheduleSchema>;
export type AddToWatchlistFormData = z.infer<typeof addToWatchlistSchema>;
export type HoldingFormData = z.infer<typeof holdingSchema>;
export type ManualAccountFormData = z.infer<typeof manualAccountSchema>;
export type CSVImportFormData = z.infer<typeof csvImportSchema>;
export type ManualTransactionFormData = z.infer<typeof manualTransactionSchema>;

// ============================================
// Validation Helper Functions
// ============================================

/**
 * Validate form data and return typed result with errors
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!errors[path]) {
      errors[path] = err.message;
    }
  });

  return { success: false, errors };
}

/**
 * Get first error message from validation result
 */
export function getFirstError(
  schema: z.ZodSchema,
  data: unknown
): string | null {
  const result = schema.safeParse(data);
  if (result.success) return null;
  return result.error.errors[0]?.message ?? 'Validation failed';
}
