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
      .select(`
        transaction_id, date, name, merchant_name, amount, category, category_id, account_id,
        teller_accounts!account_id (type)
      `)
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(500),
    supabase
      .from("categories")
      .select("id, name, type")
      .eq("user_id", user.id)
      .order("name"),
  ]);

  // Map transactions to include account_type
  const mappedTransactions = (transactions ?? []).map(tx => {
    // teller_accounts is joined data - could be object or null
    const tellerAccount = tx.teller_accounts as unknown as { type: string } | null;
    return {
      transaction_id: tx.transaction_id,
      date: tx.date,
      name: tx.name,
      merchant_name: tx.merchant_name,
      amount: tx.amount,
      category: tx.category,
      category_id: tx.category_id,
      account_type: tellerAccount?.type || 'depository',
    };
  });

  return (
    <TransactionsClient
      transactions={mappedTransactions}
      categories={categories ?? []}
    />
  );
}
