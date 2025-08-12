"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function setTransactionCategory(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const transaction_id = String(formData.get("transaction_id") || "");
  const category_id = String(formData.get("category_id") || "");
  if (!transaction_id) throw new Error("Missing transaction_id");

  const { error } = await supabase
    .from("transactions")
    .update({ category_id })
    .eq("transaction_id", transaction_id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}
