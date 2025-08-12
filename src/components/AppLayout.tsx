import { createSupabaseServerClient } from "@/lib/supabase/server";
import AppHeaderWrapper from "./AppHeaderWrapper";
import MobileNav from "./MobileNav";
import ClientOnlyWrapper from "./ClientOnlyWrapper";
import ChatWidget from "./ChatWidget";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <AppHeaderWrapper userEmail={user?.email} />
      <main className="lg:pt-0 pb-20 lg:pb-0">
        {children}
      </main>
      {user && (
        <>
          <MobileNav />
          <ClientOnlyWrapper>
            <ChatWidget />
          </ClientOnlyWrapper>
        </>
      )}
    </>
  );
}