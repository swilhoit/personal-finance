import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const admin = createSupabaseAdminClient();

  const email = "tetrahedronglobal@gmail.com";
  const password = "test123!";

  // get or create user
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
  const existing = list.data.users?.find((u) => u.email === email);

  let userId = existing?.id;
  if (!userId) {
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) return NextResponse.json({ error: created.error.message }, { status: 500 });
    userId = created.data.user?.id ?? null;
  } else {
    const updated = await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 500 });
  }

  if (!userId) return NextResponse.json({ error: "No user id" }, { status: 500 });

  // ensure profile exists
  await admin.from("profiles").upsert({ user_id: userId, email, full_name: "Test LA User" }, { onConflict: "user_id" });

  return NextResponse.json({ ok: true, user_id: userId });
}
