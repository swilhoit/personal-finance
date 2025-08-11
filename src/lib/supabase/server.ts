import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr/dist/module/types";

export function createSupabaseServerClient() {
  const cookieStorePromise = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name: string) {
        const store = await cookieStorePromise;
        return store.get(name)?.value;
      },
      async set(name: string, value: string, options: CookieOptions) {
        const store = await cookieStorePromise;
        store.set({ name, value, ...options });
      },
      async remove(name: string, options: CookieOptions) {
        const store = await cookieStorePromise;
        store.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });
}
