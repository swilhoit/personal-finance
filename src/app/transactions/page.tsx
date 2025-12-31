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
        transaction_id, date, name, merchant_name, amount, category, category_id, account_id, manual_account_id,
        teller_accounts:account_id (type),
        manual_accounts:manual_account_id (type)
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
    // Handle both teller and manual accounts
    const tellerAccount = tx.teller_accounts as unknown as { type: string } | null;
    const manualAccount = tx.manual_accounts as unknown as { type: string } | null;
    // Determine account type: use teller, then manual, then default to depository
    let accountType = 'depository';
    if (tellerAccount?.type) {
      accountType = tellerAccount.type;
    } else if (manualAccount?.type) {
      // Map manual account types to match teller types
      accountType = manualAccount.type === 'credit' ? 'credit' : 'depository';
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
