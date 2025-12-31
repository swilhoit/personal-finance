import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AccountsClient from './AccountsClient';

export default async function AccountsPage() {
  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Fetch both teller and manual accounts in parallel
  const [{ data: tellerAccounts }, { data: manualAccounts }] = await Promise.all([
    supabase
      .from('teller_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('current_balance', { ascending: false }),
    supabase
      .from('manual_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('current_balance', { ascending: false }),
  ]);

  return (
    <AccountsClient
      tellerAccounts={tellerAccounts ?? []}
      manualAccounts={manualAccounts ?? []}
    />
  );
}
