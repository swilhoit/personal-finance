import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugQuery() {
  // Get all users
  const { data: users } = await supabase.auth.admin.listUsers();
  console.log('All users:');
  users?.users?.forEach(u => console.log(`  ${u.id} - ${u.email}`));

  // Check transactions by user
  console.log('\n--- Transactions per user ---');
  for (const user of users?.users || []) {
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    console.log(`  ${user.email}: ${count} transactions`);
  }

  // Check transactions without user filter
  console.log('\n--- All transactions (no user filter) ---');
  const { data: allTx, count: totalCount } = await supabase
    .from('transactions')
    .select('transaction_id, user_id, date, name', { count: 'exact' })
    .order('date', { ascending: false })
    .limit(5);
  console.log(`Total: ${totalCount} transactions`);
  allTx?.forEach(t => console.log(`  ${t.user_id}: ${t.date} - ${t.name}`));

  // Check user_id values in transactions
  console.log('\n--- Unique user_ids in transactions ---');
  const { data: userIds } = await supabase
    .from('transactions')
    .select('user_id')
    .limit(100);
  const uniqueUserIds = [...new Set(userIds?.map(t => t.user_id))];
  console.log('Unique user_ids:', uniqueUserIds);

  const userId = users?.users?.[0]?.id;
  console.log('\nUsing user ID:', userId);

  // Test 1: Simple query without joins
  console.log('\n--- Test 1: Simple query without joins ---');
  const { data: simple, error: simpleErr } = await supabase
    .from('transactions')
    .select('transaction_id, date, name, amount, account_id')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5);

  if (simpleErr) {
    console.log('Simple query error:', simpleErr);
  } else {
    console.log('Simple query result:', simple?.length, 'rows');
    simple?.forEach(t => console.log(`  ${t.date}: ${t.name} - $${t.amount}`));
  }

  // Test 2: Query with original join syntax (!)
  console.log('\n--- Test 2: Original join syntax (!) ---');
  const { data: original, error: originalErr } = await supabase
    .from('transactions')
    .select(`
      transaction_id, date, name, amount, account_id,
      teller_accounts!account_id (type)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5);

  if (originalErr) {
    console.log('Original join error:', originalErr);
  } else {
    console.log('Original join result:', original?.length, 'rows');
    original?.forEach(t => {
      const acc = t.teller_accounts;
      console.log(`  ${t.date}: ${t.name} - type: ${acc?.type || 'null'}`);
    });
  }

  // Test 3: Query with my broken syntax (:)
  console.log('\n--- Test 3: Broken join syntax (:) ---');
  const { data: broken, error: brokenErr } = await supabase
    .from('transactions')
    .select(`
      transaction_id, date, name, amount, account_id,
      teller_accounts:account_id (type)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5);

  if (brokenErr) {
    console.log('Broken join error:', brokenErr);
  } else {
    console.log('Broken join result:', broken?.length, 'rows');
  }

  // Test 4: Check if account_id values are valid UUIDs
  console.log('\n--- Test 4: Check account_id validity ---');
  const { data: txWithAccounts } = await supabase
    .from('transactions')
    .select('transaction_id, account_id')
    .eq('user_id', userId)
    .not('account_id', 'is', null)
    .limit(10);

  console.log('Transactions with non-null account_id:', txWithAccounts?.length);

  // Check if these account_ids exist in teller_accounts
  if (txWithAccounts?.length) {
    const accountIds = txWithAccounts.map(t => t.account_id);
    const { data: matchingAccounts } = await supabase
      .from('teller_accounts')
      .select('id')
      .in('id', accountIds);
    console.log('Matching accounts in teller_accounts:', matchingAccounts?.length);
  }

  // Test 5: Count transactions with NULL vs non-NULL account_id
  console.log('\n--- Test 5: NULL vs non-NULL account_id ---');
  const { count: nullCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('account_id', null);

  const { count: nonNullCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('account_id', 'is', null);

  console.log('Transactions with NULL account_id:', nullCount);
  console.log('Transactions with non-NULL account_id:', nonNullCount);

  // Test 6: Check account_id column type
  console.log('\n--- Test 6: Sample account_id values ---');
  const { data: sampleIds } = await supabase
    .from('transactions')
    .select('account_id')
    .eq('user_id', userId)
    .not('account_id', 'is', null)
    .limit(5);

  sampleIds?.forEach(t => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.account_id);
    console.log(`  ${t.account_id} - Valid UUID: ${isUUID}`);
  });
}

debugQuery().catch(console.error);
