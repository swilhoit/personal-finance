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
      ai_conversation_sessions: {
        Row: { created_at: string | null; ended_at: string | null; id: string; message_count: number | null; session_id: string; session_metadata: Json | null; session_type: string; started_at: string | null; total_tokens_used: number | null; user_id: string }
        Insert: { created_at?: string | null; ended_at?: string | null; id?: string; message_count?: number | null; session_id: string; session_metadata?: Json | null; session_type: string; started_at?: string | null; total_tokens_used?: number | null; user_id: string }
        Update: { created_at?: string | null; ended_at?: string | null; id?: string; message_count?: number | null; session_id?: string; session_metadata?: Json | null; session_type?: string; started_at?: string | null; total_tokens_used?: number | null; user_id?: string }
        Relationships: []
      }
      ai_image_usage: {
        Row: { updated_at: string; usage_date: string; used: number; user_id: string }
        Insert: { updated_at?: string; usage_date?: string; used?: number; user_id: string }
        Update: { updated_at?: string; usage_date?: string; used?: number; user_id?: string }
        Relationships: []
      }
      alert_rules: {
        Row: { alert_type: string; channels: Json; conditions: Json; created_at: string | null; id: string; is_active: boolean | null; last_triggered_at: string | null; name: string; user_id: string }
        Insert: { alert_type: string; channels?: Json; conditions: Json; created_at?: string | null; id?: string; is_active?: boolean | null; last_triggered_at?: string | null; name: string; user_id: string }
        Update: { alert_type?: string; channels?: Json; conditions?: Json; created_at?: string | null; id?: string; is_active?: boolean | null; last_triggered_at?: string | null; name?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "alert_rules_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
      budgets: {
        Row: { amount: number; category_id: string; created_at: string | null; currency: string | null; id: string; month: string; user_id: string }
        Insert: { amount: number; category_id: string; created_at?: string | null; currency?: string | null; id?: string; month: string; user_id: string }
        Update: { amount?: number; category_id?: string; created_at?: string | null; currency?: string | null; id?: string; month?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "budgets_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
          { foreignKeyName: "budgets_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
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
      chat_history: {
        Row: { content: string; created_at: string | null; id: string; metadata: Json | null; role: string; session_id: string; user_id: string }
        Insert: { content: string; created_at?: string | null; id?: string; metadata?: Json | null; role: string; session_id: string; user_id: string }
        Update: { content?: string; created_at?: string | null; id?: string; metadata?: Json | null; role?: string; session_id?: string; user_id?: string }
        Relationships: []
      }
      discord_guilds: {
        Row: { finance_channel_id: string | null; guild_id: string; guild_name: string; id: string; is_active: boolean | null; notification_channel_id: string | null; registered_at: string | null; settings: Json | null; updated_at: string | null; user_id: string }
        Insert: { finance_channel_id?: string | null; guild_id: string; guild_name: string; id?: string; is_active?: boolean | null; notification_channel_id?: string | null; registered_at?: string | null; settings?: Json | null; updated_at?: string | null; user_id: string }
        Update: { finance_channel_id?: string | null; guild_id?: string; guild_name?: string; id?: string; is_active?: boolean | null; notification_channel_id?: string | null; registered_at?: string | null; settings?: Json | null; updated_at?: string | null; user_id?: string }
        Relationships: [
          { foreignKeyName: "discord_guilds_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
      discord_notifications: {
        Row: { channel_id: string; data: Json | null; delivered: boolean | null; guild_id: string; id: number; message: string; notification_type: string; sent_at: string | null; title: string; user_id: string }
        Insert: { channel_id: string; data?: Json | null; delivered?: boolean | null; guild_id: string; id?: number; message: string; notification_type: string; sent_at?: string | null; title: string; user_id: string }
        Update: { channel_id?: string; data?: Json | null; delivered?: boolean | null; guild_id?: string; id?: number; message?: string; notification_type?: string; sent_at?: string | null; title?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "discord_notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
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
      notification_schedule_runs: {
        Row: { completed_at: string | null; duration_ms: number | null; error: string | null; id: string; notifications_sent: number | null; result: Json | null; schedule_id: string; started_at: string | null; status: string; user_id: string }
        Insert: { completed_at?: string | null; duration_ms?: number | null; error?: string | null; id?: string; notifications_sent?: number | null; result?: Json | null; schedule_id: string; started_at?: string | null; status: string; user_id: string }
        Update: { completed_at?: string | null; duration_ms?: number | null; error?: string | null; id?: string; notifications_sent?: number | null; result?: Json | null; schedule_id?: string; started_at?: string | null; status?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "notification_schedule_runs_schedule_id_fkey"; columns: ["schedule_id"]; isOneToOne: false; referencedRelation: "notification_schedules"; referencedColumns: ["id"] },
          { foreignKeyName: "notification_schedule_runs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
      notification_schedules: {
        Row: { created_at: string | null; cron_expression: string; discord_channel_id: string | null; discord_guild_id: string | null; id: string; is_enabled: boolean | null; last_run_at: string | null; next_run_at: string | null; schedule_type: string; settings: Json | null; timezone: string | null; updated_at: string | null; user_id: string }
        Insert: { created_at?: string | null; cron_expression?: string; discord_channel_id?: string | null; discord_guild_id?: string | null; id?: string; is_enabled?: boolean | null; last_run_at?: string | null; next_run_at?: string | null; schedule_type: string; settings?: Json | null; timezone?: string | null; updated_at?: string | null; user_id: string }
        Update: { created_at?: string | null; cron_expression?: string; discord_channel_id?: string | null; discord_guild_id?: string | null; id?: string; is_enabled?: boolean | null; last_run_at?: string | null; next_run_at?: string | null; schedule_type?: string; settings?: Json | null; timezone?: string | null; updated_at?: string | null; user_id?: string }
        Relationships: [
          { foreignKeyName: "notification_schedules_discord_guild_id_fkey"; columns: ["discord_guild_id"]; isOneToOne: false; referencedRelation: "discord_guilds"; referencedColumns: ["guild_id"] },
          { foreignKeyName: "notification_schedules_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
      profiles: {
        Row: { created_at: string | null; email: string | null; full_name: string | null; preferences: Json | null; role: string | null; stripe_customer_id: string | null; stripe_subscription_id: string | null; subscription_tier: string | null; team_id: string | null; team_role: string | null; user_id: string }
        Insert: { created_at?: string | null; email?: string | null; full_name?: string | null; preferences?: Json | null; role?: string | null; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; subscription_tier?: string | null; team_id?: string | null; team_role?: string | null; user_id: string }
        Update: { created_at?: string | null; email?: string | null; full_name?: string | null; preferences?: Json | null; role?: string | null; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; subscription_tier?: string | null; team_id?: string | null; team_role?: string | null; user_id?: string }
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
      teller_accounts: {
        Row: { account_id: string; available_balance: number | null; created_at: string | null; credit_limit: number | null; currency: string | null; current_balance: number | null; enrollment_id: string; id: string; institution_name: string | null; is_active: boolean | null; last_four: string | null; last_synced_at: string | null; name: string; subtype: string | null; type: string; user_id: string }
        Insert: { account_id: string; available_balance?: number | null; created_at?: string | null; credit_limit?: number | null; currency?: string | null; current_balance?: number | null; enrollment_id: string; id?: string; institution_name?: string | null; is_active?: boolean | null; last_four?: string | null; last_synced_at?: string | null; name: string; subtype?: string | null; type: string; user_id: string }
        Update: { account_id?: string; available_balance?: number | null; created_at?: string | null; credit_limit?: number | null; currency?: string | null; current_balance?: number | null; enrollment_id?: string; id?: string; institution_name?: string | null; is_active?: boolean | null; last_four?: string | null; last_synced_at?: string | null; name?: string; subtype?: string | null; type?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "teller_accounts_enrollment_id_fkey"; columns: ["enrollment_id"]; isOneToOne: false; referencedRelation: "teller_enrollments"; referencedColumns: ["enrollment_id"] },
          { foreignKeyName: "teller_accounts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
      teller_enrollments: {
        Row: { access_token: string; created_at: string | null; enrollment_id: string; id: string; institution_id: string | null; institution_name: string; last_synced_at: string | null; status: string | null; updated_at: string | null; user_id: string }
        Insert: { access_token: string; created_at?: string | null; enrollment_id: string; id?: string; institution_id?: string | null; institution_name: string; last_synced_at?: string | null; status?: string | null; updated_at?: string | null; user_id: string }
        Update: { access_token?: string; created_at?: string | null; enrollment_id?: string; id?: string; institution_id?: string | null; institution_name?: string; last_synced_at?: string | null; status?: string | null; updated_at?: string | null; user_id?: string }
        Relationships: [
          { foreignKeyName: "teller_enrollments_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
      transactions: {
        Row: { account_id: string | null; amount: number; category: string | null; category_id: string | null; created_at: string | null; date: string; id: string; iso_currency_code: string | null; merchant_name: string | null; name: string | null; pending: boolean | null; source: string | null; teller_account_id: string | null; teller_transaction_id: string | null; transaction_id: string; user_id: string }
        Insert: { account_id?: string | null; amount: number; category?: string | null; category_id?: string | null; created_at?: string | null; date: string; id?: string; iso_currency_code?: string | null; merchant_name?: string | null; name?: string | null; pending?: boolean | null; source?: string | null; teller_account_id?: string | null; teller_transaction_id?: string | null; transaction_id: string; user_id: string }
        Update: { account_id?: string | null; amount?: number; category?: string | null; category_id?: string | null; created_at?: string | null; date?: string; id?: string; iso_currency_code?: string | null; merchant_name?: string | null; name?: string | null; pending?: boolean | null; source?: string | null; teller_account_id?: string | null; teller_transaction_id?: string | null; transaction_id?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "transactions_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] },
        ]
      }
      user_watchlists: {
        Row: { added_at: string | null; alert_above: number | null; alert_below: number | null; alerts_enabled: boolean | null; id: number; notes: string | null; symbol: string; target_price: number | null; user_id: string }
        Insert: { added_at?: string | null; alert_above?: number | null; alert_below?: number | null; alerts_enabled?: boolean | null; id?: number; notes?: string | null; symbol: string; target_price?: number | null; user_id: string }
        Update: { added_at?: string | null; alert_above?: number | null; alert_below?: number | null; alerts_enabled?: boolean | null; id?: number; notes?: string | null; symbol?: string; target_price?: number | null; user_id?: string }
        Relationships: [
          { foreignKeyName: "user_watchlists_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["user_id"] },
        ]
      }
    }
    Views: {
      v_month_spend_by_category: {
        Row: { category_name: string | null; month: string | null; total_amount: number | null; txn_count: number | null; user_id: string | null }
        Relationships: []
      }
    }
    Functions: {
      calculate_next_run_time: { Args: { p_cron_expression: string; p_timezone?: string }; Returns: string }
    }
    Enums: unknown
    CompositeTypes: unknown
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never
