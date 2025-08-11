"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createCategory(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "").trim();
  if (!name || !type) throw new Error("Missing fields");

  const { error } = await supabase.from("categories").insert({ user_id: user.id, name, type });
  if (error) throw new Error(error.message);
}

export async function deleteCategory(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing id");

  const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
}

export async function createBudget(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const category_id = String(formData.get("category_id") || "");
  const monthInput = String(formData.get("month") || ""); // YYYY-MM
  const amount = Number(formData.get("amount") || 0);
  if (!category_id || !monthInput || !amount) throw new Error("Missing fields");

  const month = `${monthInput}-01`; // store as date string first day
  const { error } = await supabase.from("budgets").insert({ user_id: user.id, category_id, month, amount, currency: "USD" });
  if (error) throw new Error(error.message);
}

export async function deleteBudget(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing id");

  const { error } = await supabase.from("budgets").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
}

export async function createRule(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const category_id = String(formData.get("category_id") || "");
  const matcher_type = String(formData.get("matcher_type") || "");
  const matcher_value = String(formData.get("matcher_value") || "");
  const priority = Number(formData.get("priority") || 100);
  if (!category_id || !matcher_type || !matcher_value) throw new Error("Missing fields");

  const { error } = await supabase.from("category_rules").insert({ user_id: user.id, category_id, matcher_type, matcher_value, priority });
  if (error) throw new Error(error.message);
}
