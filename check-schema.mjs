import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  // Check column info for transactions table
  const { data: columns, error } = await supabase
    .rpc('get_table_columns', { table_name: 'transactions' });

  if (error) {
    console.log('RPC not available, trying direct query...');

    // Alternative: query the table and check what we get back
    const { data: sample } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);

    console.log('Sample transaction columns:', Object.keys(sample?.[0] || {}));

    // Check if account_id has values
    const { data: withAccount } = await supabase
      .from('transactions')
      .select('id, account_id, teller_account_id')
      .not('account_id', 'is', null)
      .limit(5);

    console.log('\nTransactions with non-null account_id:');
    withAccount?.forEach(t => console.log(`  ${t.id}: account_id=${t.account_id}`));

    // Check teller_accounts table
    const { data: accounts } = await supabase
      .from('teller_accounts')
      .select('id, account_id, name')
      .limit(5);

    console.log('\nTeller accounts:');
    accounts?.forEach(a => console.log(`  id=${a.id}, account_id=${a.account_id}, name=${a.name}`));

    // Check if account_id in transactions matches id in teller_accounts
    if (withAccount?.length && accounts?.length) {
      const tellerIds = new Set(accounts.map(a => a.id));
      console.log('\nDo transaction account_ids match teller_accounts.id?');
      withAccount.forEach(t => {
        const matches = tellerIds.has(t.account_id);
        console.log(`  ${t.account_id}: ${matches ? 'YES' : 'NO'}`);
      });
    }
  }
}

checkSchema().catch(console.error);
