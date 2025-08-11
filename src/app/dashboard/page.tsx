import PlaidLinkButton from "@/components/PlaidLinkButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ChatQuickActions from "@/components/ChatQuickActions";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {!user ? (
        <div className="p-4 border rounded-md">Please sign in to use the dashboard.</div>
      ) : (
        <div className="space-y-4">
          <PlaidLinkButton />
          <form action={async () => { await fetch("/api/plaid/sync-transactions", { method: "POST" }); }}>
            <button className="rounded-md px-4 py-2 border">Sync last 30 days</button>
          </form>
          <div className="pt-2">
            <ChatQuickActions />
          </div>
        </div>
      )}
    </div>
  );
}
