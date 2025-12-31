/**
 * CSV Import Preview API
 * Parse and preview CSV without committing to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseCSV, parseCSVString, detectFormat, getSupportedFormats } from '@/services/csvImportService';

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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Read file content
    const content = await file.text();

    // Get headers and detect format first
    const { headers, rows } = parseCSVString(content);
    const format = detectFormat(headers);

    if (!format) {
      return NextResponse.json({
        success: false,
        error: 'Unable to detect CSV format',
        headers,
        supportedFormats: getSupportedFormats(),
      }, { status: 400 });
    }

    // Parse with detected format
    const result = parseCSV(content, accountId);

    // Return preview with sample rows
    const sampleTransactions = result.transactions.slice(0, 10);

    return NextResponse.json({
      success: result.success,
      format: {
        name: format.name,
        confidence: format.confidence,
        dateColumn: format.dateColumn,
        descriptionColumn: format.descriptionColumn,
        amountColumn: format.amountColumn,
      },
      preview: {
        totalRows: rows.length,
        parsedTransactions: result.transactions.length,
        sampleTransactions,
        headers,
      },
      errors: result.errors,
      warnings: result.warnings.slice(0, 10), // Limit warnings for preview
      warningsCount: result.warnings.length,
    });
  } catch (error) {
    console.error('Error previewing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to preview CSV file' },
      { status: 500 }
    );
  }
}
