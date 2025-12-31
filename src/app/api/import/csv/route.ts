/**
 * CSV Import API
 * Import transactions from CSV file
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseCSV } from '@/services/csvImportService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const accountId = formData.get('accountId') as string | null;
    const accountType = formData.get('accountType') as 'manual' | 'teller' | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    if (!accountType || !['manual', 'teller'].includes(accountType)) {
      return NextResponse.json({ error: 'Valid account type is required' }, { status: 400 });
    }

    // Verify account ownership
    const accountTable = accountType === 'manual' ? 'manual_accounts' : 'teller_accounts';
    const { data: account, error: accountError } = await supabase
      .from(accountTable)
      .select('id')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Read file content
    const content = await file.text();

    // Parse CSV
    const result = parseCSV(content, accountId);

    if (!result.success || result.transactions.length === 0) {
      return NextResponse.json({
        success: false,
        error: result.errors.join('; ') || 'No transactions to import',
        warnings: result.warnings,
      }, { status: 400 });
    }

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from('csv_imports')
      .insert({
        user_id: user.id,
        account_id: accountId,
        account_type: accountType,
        filename: file.name,
        detected_format: result.format?.name || 'unknown',
        rows_imported: 0,
        rows_skipped: 0,
        import_status: 'pending',
      })
      .select()
      .single();

    if (importError) {
      console.error('Error creating import record:', importError);
      return NextResponse.json(
        { error: 'Failed to create import record' },
        { status: 500 }
      );
    }

    // Check for existing transactions (deduplication)
    const transactionIds = result.transactions.map(t => t.transactionId);
    const { data: existingTransactions } = await supabase
      .from('transactions')
      .select('transaction_id')
      .in('transaction_id', transactionIds);

    const existingIds = new Set((existingTransactions || []).map(t => t.transaction_id));
    const newTransactions = result.transactions.filter(t => !existingIds.has(t.transactionId));
    const skippedCount = result.transactions.length - newTransactions.length;

    // Prepare transaction records
    const transactionRecords = newTransactions.map(tx => ({
      user_id: user.id,
      transaction_id: tx.transactionId,
      manual_account_id: accountType === 'manual' ? accountId : null,
      account_id: accountType === 'teller' ? accountId : null,
      date: tx.date,
      name: tx.description,
      amount: tx.amount,
      source: 'csv_import',
      csv_import_id: importRecord.id,
      pending: false,
    }));

    // Insert transactions in batches
    let insertedCount = 0;
    const BATCH_SIZE = 500;

    for (let i = 0; i < transactionRecords.length; i += BATCH_SIZE) {
      const batch = transactionRecords.slice(i, i + BATCH_SIZE);
      const { error: insertError, count } = await supabase
        .from('transactions')
        .insert(batch)
        .select('id');

      if (insertError) {
        console.error('Error inserting transactions:', insertError);
        // Update import record with error
        await supabase
          .from('csv_imports')
          .update({
            import_status: 'failed',
            error_message: insertError.message,
            rows_imported: insertedCount,
            rows_skipped: skippedCount,
          })
          .eq('id', importRecord.id);

        return NextResponse.json(
          { error: 'Failed to import some transactions', insertedCount, skippedCount },
          { status: 500 }
        );
      }

      insertedCount += count || batch.length;
    }

    // Update import record with success
    await supabase
      .from('csv_imports')
      .update({
        import_status: 'completed',
        rows_imported: insertedCount,
        rows_skipped: skippedCount,
      })
      .eq('id', importRecord.id);

    return NextResponse.json({
      success: true,
      importId: importRecord.id,
      stats: {
        totalParsed: result.transactions.length,
        imported: insertedCount,
        skipped: skippedCount,
        warnings: result.warnings.length,
      },
      format: result.format?.name,
      warnings: result.warnings.slice(0, 10),
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV file' },
      { status: 500 }
    );
  }
}
