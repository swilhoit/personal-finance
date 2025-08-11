import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rules, error } = await supabase
    .from("category_rules")
    .select("id, category_id, matcher_type, matcher_value, priority")
    .eq("user_id", user.id)
    .order("priority", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  for (const r of rules ?? []) {
    if (r.matcher_type === "merchant") {
      await supabase
        .from("transactions")
        .update({ category_id: r.category_id })
        .eq("user_id", user.id)
        .is("category_id", null)
        .ilike("merchant_name", `%${r.matcher_value}%`);
    } else if (r.matcher_type === "name") {
      await supabase
        .from("transactions")
        .update({ category_id: r.category_id })
        .eq("user_id", user.id)
        .is("category_id", null)
        .ilike("name", `%${r.matcher_value}%`);
    }
  }

  return NextResponse.json({ ok: true });
}
