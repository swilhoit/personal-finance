const { createClient } = require("@supabase/supabase-js");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(url, key);

async function main() {
  const email = "tetrahedronglobal@gmail.com";
  const password = "test123!";
  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) {
    let page = 1; let found = null;
    while (!found) {
      const res = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (res.error) throw res.error;
      found = res.data.users?.find((u) => u.email === email) || null;
      if (!found && (!res.data.users || res.data.users.length < 1000)) break;
      page++;
    }
    if (!found) {
      console.error("User not found and createUser failed:", created.error.message);
      process.exit(1);
    }
    const upd = await supabase.auth.admin.updateUserById(found.id, { password, email_confirm: true });
    if (upd.error) {
      console.error("Failed to update user:", upd.error.message);
      process.exit(1);
    }
    console.log("Updated user password successfully");
  } else {
    console.log("Created user successfully");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
