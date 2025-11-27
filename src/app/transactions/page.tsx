import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage() {
  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const [{ data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from("transactions")
      .select("transaction_id, date, name, merchant_name, amount, category, category_id")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(500),
    supabase
      .from("categories")
      .select("id, name, type")
      .eq("user_id", user.id)
      .order("name"),
  ]);

  return (
    <TransactionsClient
      transactions={transactions ?? []}
      categories={categories ?? []}
    />
  );
}
