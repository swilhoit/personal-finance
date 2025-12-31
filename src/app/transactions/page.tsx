import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TransactionsClient from "./TransactionsClient";

export default async function TransactionsPage() {
  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Fetch transactions, accounts, and categories in parallel
  const [{ data: transactions }, { data: tellerAccounts }, { data: manualAccounts }, { data: categories }] = await Promise.all([
    supabase
      .from("transactions")
      .select("transaction_id, date, name, merchant_name, amount, category, category_id, account_id, manual_account_id")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(500),
    supabase
      .from("teller_accounts")
      .select("id, type")
      .eq("user_id", user.id),
    supabase
      .from("manual_accounts")
      .select("id, type")
      .eq("user_id", user.id),
    supabase
      .from("categories")
      .select("id, name, type")
      .eq("user_id", user.id)
      .order("name"),
  ]);

  // Build account type lookup maps
  const tellerTypeMap = new Map((tellerAccounts ?? []).map(a => [a.id, a.type]));
  const manualTypeMap = new Map((manualAccounts ?? []).map(a => [a.id, a.type === 'credit' ? 'credit' : 'depository']));

  // Map transactions to include account_type
  const mappedTransactions = (transactions ?? []).map(tx => {
    // Look up account type from the maps
    let accountType = 'depository';
    if (tx.account_id && tellerTypeMap.has(tx.account_id)) {
      accountType = tellerTypeMap.get(tx.account_id)!;
    } else if (tx.manual_account_id && manualTypeMap.has(tx.manual_account_id)) {
      accountType = manualTypeMap.get(tx.manual_account_id)!;
    }
    return {
      transaction_id: tx.transaction_id,
      date: tx.date,
      name: tx.name,
      merchant_name: tx.merchant_name,
      amount: tx.amount,
      category: tx.category,
      category_id: tx.category_id,
      account_type: accountType,
    };
  });

  return (
    <TransactionsClient
      transactions={mappedTransactions}
      categories={categories ?? []}
    />
  );
}
