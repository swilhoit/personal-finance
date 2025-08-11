import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCategory, deleteCategory, createBudget, deleteBudget, createRule } from "./actions";

type BudgetWithCategory = {
  id: string;
  month: string;
  amount: number;
  category_id: string;
  categories: { name?: string } | null;
};

type Rule = { id: string; matcher_type: string; matcher_value: string; priority: number; categories: { name?: string } | null };

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Please sign in.</div>;

  const [{ data: categories }, { data: budgetsRaw }, { data: rules }] = await Promise.all([
    supabase.from("categories").select("id, name, type").order("name"),
    supabase
      .from("budgets")
      .select("id, month, amount, category_id, categories(name)")
      .order("month", { ascending: false }),
    supabase
      .from("category_rules")
      .select("id, matcher_type, matcher_value, priority, categories(name)")
      .eq("user_id", user.id)
      .order("priority"),
  ]);

  const budgets: BudgetWithCategory[] = (budgetsRaw as BudgetWithCategory[]) ?? [];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="space-y-3">
        <h2 className="font-medium">Categories</h2>
        <form action={createCategory} className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-sm block">Name</label>
            <input name="name" className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="text-sm block">Type</label>
            <select name="type" className="border rounded px-2 py-1">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <button className="px-3 py-2 border rounded">Add</button>
        </form>
        <ul className="space-y-2">
          {(categories ?? []).map((c) => (
            <li key={c.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">{c.type}</div>
              </div>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <button className="text-sm underline">Delete</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Budgets</h2>
        <form action={createBudget} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
          <div className="col-span-2">
            <label className="text-sm block">Category</label>
            <select name="category_id" className="w-full border rounded px-2 py-1">
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm block">Month</label>
            <input type="month" name="month" className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="text-sm block">Amount</label>
            <input type="number" step="0.01" name="amount" className="w-full border rounded px-2 py-1" />
          </div>
          <div className="col-span-2 sm:col-span-4">
            <button className="px-3 py-2 border rounded">Add Budget</button>
          </div>
        </form>
        <ul className="space-y-2">
          {budgets.map((b) => (
            <li key={b.id} className="border rounded p-3 flex items-center justify-between">
              <div className="text-sm">
                {b.month} · ${Number(b.amount).toFixed(2)} · {b.categories?.name ?? "Category"}
              </div>
              <form action={deleteBudget}>
                <input type="hidden" name="id" value={b.id} />
                <button className="text-sm underline">Delete</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Auto-categorization Rules</h2>
          <form action={async () => { "use server"; await fetch("/api/rules/apply", { method: "POST" }); }}>
            <button className="px-3 py-2 border rounded">Apply rules</button>
          </form>
        </div>
        <form action={createRule} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
          <div className="sm:col-span-2">
            <label className="text-sm block">Category</label>
            <select name="category_id" className="w-full border rounded px-2 py-1">
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm block">Type</label>
            <select name="matcher_type" className="w-full border rounded px-2 py-1">
              <option value="merchant">Merchant</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div>
            <label className="text-sm block">Value</label>
            <input name="matcher_value" className="w-full border rounded px-2 py-1" />
          </div>
          <div>
            <label className="text-sm block">Priority</label>
            <input type="number" name="priority" defaultValue={100} className="w-full border rounded px-2 py-1" />
          </div>
          <div className="sm:col-span-5">
            <button className="px-3 py-2 border rounded">Add Rule</button>
          </div>
        </form>
        <ul className="space-y-2">
          {(rules as Rule[] | null)?.map((r) => (
            <li key={r.id} className="border rounded p-3 flex items-center justify-between">
              <div className="text-sm">{r.categories?.name ?? "Category"} · {r.matcher_type}:{" "}{r.matcher_value} · priority {r.priority}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
