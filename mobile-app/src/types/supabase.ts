// This file is generated via MCP. Keep it in sync with Supabase.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      budgets: {
        Row: { amount: number; category_id: string; created_at: string | null; currency: string | null; id: string; month: string; user_id: string }
        Insert: { amount: number; category_id: string; created_at?: string | null; currency?: string | null; id?: string; month: string; user_id: string }
        Update: { amount?: number; category_id?: string; created_at?: string | null; currency?: string | null; id?: string; month?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "budgets_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
          { foreignKeyName: "budgets_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
      chat_history: {
        Row: { content: string; created_at: string | null; id: string; metadata: Json | null; role: string; session_id: string; user_id: string }
        Insert: { content: string; created_at?: string | null; id?: string; metadata?: Json | null; role: string; session_id: string; user_id: string }
        Update: { content?: string; created_at?: string | null; id?: string; metadata?: Json | null; role?: string; session_id?: string; user_id?: string }
        Relationships: []
      }
      categories: {
        Row: { created_at: string | null; id: string; name: string; type: string; user_id: string }
        Insert: { created_at?: string | null; id?: string; name: string; type: string; user_id: string }
        Update: { created_at?: string | null; id?: string; name?: string; type?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "categories_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
      category_rules: {
        Row: { category_id: string; created_at: string | null; id: string; matcher_type: string; matcher_value: string; priority: number; user_id: string }
        Insert: { category_id: string; created_at?: string | null; id?: string; matcher_type: string; matcher_value: string; priority?: number; user_id: string }
        Update: { category_id?: string; created_at?: string | null; id?: string; matcher_type?: string; matcher_value?: string; priority?: number; user_id?: string }
        Relationships: [
          { foreignKeyName: "category_rules_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
          { foreignKeyName: "category_rules_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
      insight_cache: {
        Row: { cache_key: string; computed_at: string; id: string; ttl_seconds: number | null; user_id: string; value: Json }
        Insert: { cache_key: string; computed_at?: string; id?: string; ttl_seconds?: number | null; user_id: string; value: Json }
        Update: { cache_key?: string; computed_at?: string; id?: string; ttl_seconds?: number | null; user_id?: string; value?: Json }
        Relationships: [
          { foreignKeyName: "insight_cache_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
      plaid_accounts: {
        Row: { account_id: string; available_balance: number | null; created_at: string | null; current_balance: number | null; id: string; iso_currency_code: string | null; item_id: string; mask: string | null; name: string | null; official_name: string | null; subtype: string | null; type: string | null; user_id: string }
        Insert: { account_id: string; available_balance?: number | null; created_at?: string | null; current_balance?: number | null; id?: string; iso_currency_code?: string | null; item_id: string; mask?: string | null; name?: string | null; official_name?: string | null; subtype?: string | null; type?: string | null; user_id: string }
        Update: { account_id?: string; available_balance?: number | null; created_at?: string | null; current_balance?: number | null; id?: string; iso_currency_code?: string | null; item_id?: string; mask?: string | null; name?: string | null; official_name?: string | null; subtype?: string | null; type?: string | null; user_id?: string }
        Relationships: [
          { foreignKeyName: "plaid_accounts_item_id_fkey"; columns: ["item_id"]; isOneToOne: false; referencedRelation: "plaid_items"; referencedColumns: ["item_id"] },
        ]
      }
      plaid_items: {
        Row: { access_token: string | null; created_at: string | null; id: string; institution_id: string | null; institution_name: string | null; item_id: string; transactions_cursor: string | null; user_id: string }
        Insert: { access_token?: string | null; created_at?: string | null; id?: string; institution_id?: string | null; institution_name?: string | null; item_id: string; transactions_cursor?: string | null; user_id: string }
        Update: { access_token?: string | null; created_at?: string | null; id?: string; institution_id?: string | null; institution_name?: string | null; item_id?: string; transactions_cursor?: string | null; user_id?: string }
        Relationships: [
          { foreignKeyName: "plaid_items_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
      profiles: {
        Row: { created_at: string | null; email: string | null; full_name: string | null; user_id: string }
        Insert: { created_at?: string | null; email?: string | null; full_name?: string | null; user_id: string }
        Update: { created_at?: string | null; email?: string | null; full_name?: string | null; user_id?: string }
        Relationships: []
      }
      recurring_merchants: {
        Row: { avg_amount: number | null; created_at: string | null; id: string; interval_days: number | null; last_seen: string | null; merchant_name: string; user_id: string }
        Insert: { avg_amount?: number | null; created_at?: string | null; id?: string; interval_days?: number | null; last_seen?: string | null; merchant_name: string; user_id: string }
        Update: { avg_amount?: number | null; created_at?: string | null; id?: string; interval_days?: number | null; last_seen?: string | null; merchant_name?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "recurring_merchants_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
      sync_runs: {
        Row: { finished_at: string | null; id: string; item_id: string | null; note: string | null; started_at: string; status: string; user_id: string }
        Insert: { finished_at?: string | null; id?: string; item_id?: string | null; note?: string | null; started_at?: string; status: string; user_id: string }
        Update: { finished_at?: string | null; id?: string; item_id?: string | null; note?: string | null; started_at?: string; status?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "sync_runs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
      transactions: {
        Row: { account_id: string; amount: number; category: string | null; category_id: string | null; created_at: string | null; date: string; id: string; iso_currency_code: string | null; merchant_name: string | null; name: string | null; pending: boolean | null; transaction_id: string; user_id: string }
        Insert: { account_id: string; amount: number; category?: string | null; category_id?: string | null; created_at?: string | null; date: string; id?: string; iso_currency_code?: string | null; merchant_name?: string | null; name?: string | null; pending?: boolean | null; transaction_id: string; user_id: string }
        Update: { account_id?: string; amount?: number; category?: string | null; category_id?: string | null; created_at?: string | null; date?: string; id?: string; iso_currency_code?: string | null; merchant_name?: string | null; name?: string | null; pending?: boolean | null; transaction_id?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "transactions_account_id_fkey"; columns: ["account_id"]; isOneToOne: false; referencedRelation: "plaid_accounts"; referencedColumns: ["account_id"] },
          { foreignKeyName: "transactions_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: {
      v_month_spend_by_category: {
        Row: { category_name: string | null; month: string | null; total_amount: number | null; txn_count: number | null; user_id: string | null }
        Relationships: []
      }
    }
    Functions: unknown
    Enums: unknown
    CompositeTypes: unknown
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never
