import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AccountsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Please sign in.</div>;

  const { data: accounts } = await supabase
    .from("plaid_accounts")
    .select("item_id, name, official_name, mask, type, subtype, current_balance, available_balance, iso_currency_code")
    .order("name", { ascending: true });

  const { data: items } = await supabase
    .from("plaid_items")
    .select("item_id, institution_id, institution_name, created_at");

  const itemMap = new Map((items ?? []).map((i) => [i.item_id, i]));

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Accounts</h1>
      <div className="space-y-3">
        {(accounts ?? []).map((a) => (
          <div key={a.item_id + a.name} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{a.name ?? a.official_name ?? "Account"} {a.mask ? `•••${a.mask}` : ""}</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {itemMap.get(a.item_id)?.institution_name ?? "Institution"} · {a.type}{a.subtype ? `/${a.subtype}` : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{a.current_balance ?? 0} {a.iso_currency_code ?? "USD"}</div>
              {a.available_balance != null && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400">Available {a.available_balance}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
