import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

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

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/sign-in");
  }

  const [{ data: categories }, { data: budgetsRaw }, { data: rules }] = await Promise.all([
    supabase.from("categories").select("id, name, type").eq("user_id", user.id).order("name"),
    supabase
      .from("budgets")
      .select("id, month, amount, category_id, categories(name)")
      .eq("user_id", user.id)
      .order("month", { ascending: false }),
    supabase
      .from("category_rules")
      .select("id, matcher_type, matcher_value, priority, category_id, categories(name)")
      .eq("user_id", user.id)
      .order("priority"),
  ]);

  const budgets: BudgetWithCategory[] = (budgetsRaw as BudgetWithCategory[]) ?? [];
  const categoriesList = (categories as Category[]) ?? [];
  const rulesList = (rules as Rule[]) ?? [];

  // Get current month for budget default
  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <SettingsClient 
      categories={categoriesList}
      budgets={budgets}
      rules={rulesList}
      currentMonth={currentMonth}
    />
  );
}