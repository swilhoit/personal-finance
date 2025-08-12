import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr/dist/module/types";

export async function createSupabaseServerClient(readOnly = false) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        if (readOnly) {
          // Skip setting cookies in read-only mode (for Server Components)
          return;
        }
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        if (readOnly) {
          // Skip removing cookies in read-only mode (for Server Components)
          return;
        }
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}
