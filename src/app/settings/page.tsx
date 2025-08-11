import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Please sign in.</div>;

  const { data: categories } = await supabase.from("categories").select("id, name, type").order("name");
  const { data: budgets } = await supabase.from("budgets").select("id, month, amount, category_id");

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <section className="space-y-2">
        <h2 className="font-medium">Categories</h2>
        {(categories ?? []).length === 0 && (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">No categories yet.</div>
        )}
        <ul className="space-y-2">
          {(categories ?? []).map((c) => (
            <li key={c.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">{c.type}</div>
              </div>
              <button className="text-sm underline">Edit</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">Budgets</h2>
        {(budgets ?? []).length === 0 && (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">No budgets yet.</div>
        )}
        <ul className="space-y-2">
          {(budgets ?? []).map((b) => (
            <li key={b.id} className="border rounded p-3 flex items-center justify-between">
              <div className="text-sm">{b.month} · ${Number(b.amount).toFixed(2)}</div>
              <button className="text-sm underline">Edit</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
