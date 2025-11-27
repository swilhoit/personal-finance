-- Migration: Fix transaction amount sign convention
--
-- Teller API returns amounts where:
--   Positive = debit (expense, money leaving account)
--   Negative = credit (income, money entering account)
--
-- Our app convention is:
--   Negative = expense
--   Positive = income
--
-- This migration negates all Teller-sourced transaction amounts to match our convention

-- Fix all existing transactions from Teller
UPDATE transactions
SET amount = -amount
WHERE source = 'teller';

-- Add a comment explaining the convention
COMMENT ON COLUMN transactions.amount IS 'Transaction amount: negative = expense/debit, positive = income/credit';
