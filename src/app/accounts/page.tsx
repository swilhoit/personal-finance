import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AccountsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Please sign in.</div>;

  const [{ data: accounts }, { data: items }, { data: lastRun }] = await Promise.all([
    supabase
      .from("plaid_accounts")
      .select("item_id, name, official_name, mask, type, subtype, current_balance, available_balance, iso_currency_code")
      .order("name", { ascending: true }),
    supabase
      .from("plaid_items")
      .select("item_id, institution_id, institution_name, created_at"),
    supabase
      .from("sync_runs")
      .select("started_at")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(1),
  ]);

  const itemMap = new Map((items ?? []).map((i) => [i.item_id, i]));
  const lastSync = lastRun?.[0]?.started_at ? new Date(lastRun[0].started_at) : null;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Accounts</h1>
        <form action={async () => { "use server"; await fetch("/api/plaid/sync-transactions", { method: "POST" }); }}>
          <button className="px-3 py-2 border rounded">Sync now</button>
        </form>
      </div>
      {lastSync && (
        <div className="text-xs text-zinc-600 dark:text-zinc-400">Last sync: {lastSync.toLocaleString()}</div>
      )}
      <div className="space-y-3">
        {(accounts ?? []).map((a) => (
          <div key={a.item_id + a.name} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{a.name ?? a.official_name ?? "Account"} {a.mask ? `•••${a.mask}` : ""}</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {itemMap.get(a.item_id)?.institution_name ?? "Institution"} · {a.type}{a.subtype ? `/${a.subtype}` : ""}
              </div>
            </div>
            <div className="text-right flex items-center gap-3">
              <div>
                <div className="font-semibold">{a.current_balance ?? 0} {a.iso_currency_code ?? "USD"}</div>
                {a.available_balance != null && (
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">Available {a.available_balance}</div>
                )}
              </div>
              <button data-reconnect-item={a.item_id} className="text-sm underline">Reconnect</button>
            </div>
          </div>
        ))}
      </div>
      <script
        dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            const id = target?.getAttribute?.('data-reconnect-item');
            if (!id) return;
            const res = await fetch('/api/plaid/update-link-token?item_id=' + encodeURIComponent(id), { method: 'POST' });
            const data = await res.json();
            const handler = (window as any).Plaid?.create({ token: data.link_token });
            if (handler) handler.open();
          });
        ` }}
      />
    </div>
  );
}
