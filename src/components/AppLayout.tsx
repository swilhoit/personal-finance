import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppHeader from "./AppHeader";
import MobileNav from "./MobileNav";
import ChatWidget from "./ChatWidget";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <AppHeader userEmail={user?.email} />
      <main className="lg:pt-0 pb-20 lg:pb-0">
        {children}
      </main>
      {user && (
        <>
          <MobileNav />
          <ChatWidget />
        </>
      )}
    </>
  );
}