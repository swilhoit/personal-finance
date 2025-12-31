import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ImportClient from './ImportClient';

export default async function ImportPage() {
  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Fetch both teller and manual accounts for the dropdown
  const [{ data: tellerAccounts }, { data: manualAccounts }] = await Promise.all([
    supabase
      .from('teller_accounts')
      .select('id, name, type, institution_name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('manual_accounts')
      .select('id, name, type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),
  ]);

  const accounts = [
    ...(manualAccounts ?? []).map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      source: 'manual' as const,
      institution: 'Manual',
    })),
    ...(tellerAccounts ?? []).map(a => ({
      id: a.id,
      name: a.name,
      type: a.type || 'unknown',
      source: 'teller' as const,
      institution: a.institution_name || 'Connected Bank',
    })),
  ];

  return <ImportClient accounts={accounts} />;
}
