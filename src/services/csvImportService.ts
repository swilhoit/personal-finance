/**
 * CSV Import Service
 * Handles parsing CSV files and detecting bank formats
 */

import { createHash } from 'crypto';

export interface CSVRow {
  date: string;
  description: string;
  amount: number;
  category?: string;
  originalRow: Record<string, string>;
}

export interface DetectedFormat {
  name: string;
  confidence: number;
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string | { debit: string; credit: string };
  amountMultiplier: number; // -1 for banks where positive = expense
  dateFormat: 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'M/D/YYYY';
}

export interface ParsedTransaction {
  date: string; // YYYY-MM-DD format
  description: string;
  amount: number; // Negative = expense, positive = income
  category?: string;
  transactionId: string;
}

export interface ImportResult {
  success: boolean;
  format: DetectedFormat | null;
  transactions: ParsedTransaction[];
  errors: string[];
  warnings: string[];
}

// Bank format signatures for detection
const BANK_FORMATS: Record<string, {
  requiredColumns: string[];
  alternateColumns?: string[];
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string | { debit: string; credit: string };
  amountMultiplier: number;
  dateFormat: DetectedFormat['dateFormat'];
}> = {
  chase: {
    requiredColumns: ['Transaction Date', 'Description', 'Amount'],
    alternateColumns: ['Post Date', 'Details', 'Type'],
    dateColumn: 'Transaction Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    amountMultiplier: 1, // Chase: negative = expense (matches our convention)
    dateFormat: 'MM/DD/YYYY',
  },
  amex: {
    requiredColumns: ['Date', 'Description', 'Amount'],
    alternateColumns: ['Reference', 'Card Member', 'Account #'],
    dateColumn: 'Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    amountMultiplier: -1, // Amex: positive = expense (need to invert)
    dateFormat: 'MM/DD/YYYY',
  },
  capitalOne: {
    requiredColumns: ['Transaction Date', 'Description'],
    alternateColumns: ['Posted Date', 'Card No.', 'Category'],
    dateColumn: 'Transaction Date',
    descriptionColumn: 'Description',
    amountColumn: { debit: 'Debit', credit: 'Credit' },
    amountMultiplier: 1,
    dateFormat: 'YYYY-MM-DD',
  },
  bankOfAmerica: {
    requiredColumns: ['Date', 'Description', 'Amount'],
    alternateColumns: ['Running Bal.', 'Reference Number'],
    dateColumn: 'Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    amountMultiplier: 1,
    dateFormat: 'MM/DD/YYYY',
  },
  wellsFargo: {
    requiredColumns: ['Date', 'Description', 'Amount'],
    alternateColumns: [],
    dateColumn: 'Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    amountMultiplier: 1,
    dateFormat: 'MM/DD/YYYY',
  },
  discover: {
    requiredColumns: ['Trans. Date', 'Description', 'Amount'],
    alternateColumns: ['Post Date', 'Category'],
    dateColumn: 'Trans. Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    amountMultiplier: -1, // Discover: positive = expense
    dateFormat: 'MM/DD/YYYY',
  },
};

/**
 * Parse CSV string into rows
 */
export function parseCSVString(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length !== headers.length) continue; // Skip malformed rows

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Detect bank format from CSV headers
 */
export function detectFormat(headers: string[]): DetectedFormat | null {
  const normalizedHeaders = headers.map(h => h.trim());

  let bestMatch: { format: string; confidence: number } | null = null;

  for (const [formatName, formatSpec] of Object.entries(BANK_FORMATS)) {
    // Check required columns
    const matchedRequired = formatSpec.requiredColumns.filter(col =>
      normalizedHeaders.some(h => h.toLowerCase() === col.toLowerCase())
    );

    if (matchedRequired.length < formatSpec.requiredColumns.length) {
      continue; // Missing required columns
    }

    // Calculate confidence based on alternate columns matches
    let confidence = matchedRequired.length / formatSpec.requiredColumns.length;

    if (formatSpec.alternateColumns && formatSpec.alternateColumns.length > 0) {
      const matchedAlternate = formatSpec.alternateColumns.filter(col =>
        normalizedHeaders.some(h => h.toLowerCase() === col.toLowerCase())
      );
      confidence += (matchedAlternate.length / formatSpec.alternateColumns.length) * 0.3;
    }

    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = { format: formatName, confidence: Math.min(confidence, 1) };
    }
  }

  if (bestMatch && bestMatch.confidence >= 0.5) {
    const spec = BANK_FORMATS[bestMatch.format];

    // Find actual column names (case-insensitive match)
    const findColumn = (target: string) =>
      normalizedHeaders.find(h => h.toLowerCase() === target.toLowerCase()) || target;

    return {
      name: bestMatch.format,
      confidence: bestMatch.confidence,
      dateColumn: findColumn(spec.dateColumn),
      descriptionColumn: findColumn(spec.descriptionColumn),
      amountColumn: typeof spec.amountColumn === 'string'
        ? findColumn(spec.amountColumn)
        : { debit: findColumn(spec.amountColumn.debit), credit: findColumn(spec.amountColumn.credit) },
      amountMultiplier: spec.amountMultiplier,
      dateFormat: spec.dateFormat,
    };
  }

  // Try generic detection
  return detectGenericFormat(normalizedHeaders);
}

/**
 * Detect format using generic column name matching
 */
function detectGenericFormat(headers: string[]): DetectedFormat | null {
  const lowerHeaders = headers.map(h => h.toLowerCase());

  // Find date column
  const datePatterns = ['date', 'transaction date', 'trans date', 'posted', 'post date'];
  const dateIdx = lowerHeaders.findIndex(h => datePatterns.some(p => h.includes(p)));
  if (dateIdx === -1) return null;

  // Find description column
  const descPatterns = ['description', 'memo', 'details', 'name', 'payee', 'merchant'];
  const descIdx = lowerHeaders.findIndex(h => descPatterns.some(p => h.includes(p)));
  if (descIdx === -1) return null;

  // Find amount column
  const amountPatterns = ['amount', 'sum', 'total', 'value'];
  const amountIdx = lowerHeaders.findIndex(h => amountPatterns.some(p => h.includes(p)));
  if (amountIdx === -1) return null;

  return {
    name: 'generic',
    confidence: 0.5,
    dateColumn: headers[dateIdx],
    descriptionColumn: headers[descIdx],
    amountColumn: headers[amountIdx],
    amountMultiplier: 1, // Assume standard convention
    dateFormat: 'MM/DD/YYYY',
  };
}

/**
 * Parse date string to YYYY-MM-DD format
 */
export function parseDate(dateStr: string, format: DetectedFormat['dateFormat']): string {
  const cleaned = dateStr.trim();

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // Handle MM/DD/YYYY or M/D/YYYY
  const slashParts = cleaned.split('/');
  if (slashParts.length === 3) {
    let month: string, day: string, year: string;

    if (format === 'DD/MM/YYYY') {
      [day, month, year] = slashParts;
    } else {
      [month, day, year] = slashParts;
    }

    // Handle 2-digit year
    if (year.length === 2) {
      year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    }

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Handle other formats (e.g., "Jan 15, 2024")
  const date = new Date(cleaned);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  throw new Error(`Unable to parse date: ${dateStr}`);
}

/**
 * Parse amount value
 */
export function parseAmount(value: string, multiplier: number): number {
  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, '').replace(/\(([^)]+)\)/, '-$1');
  const num = parseFloat(cleaned);

  if (isNaN(num)) {
    throw new Error(`Unable to parse amount: ${value}`);
  }

  return num * multiplier;
}

/**
 * Generate deterministic transaction ID for deduplication
 */
export function generateTransactionId(
  accountId: string,
  date: string,
  amount: number,
  description: string
): string {
  const data = `${accountId}:${date}:${amount.toFixed(2)}:${description}`;
  const hash = createHash('sha256').update(data).digest('hex').substring(0, 16);
  return `csv_${hash}`;
}

/**
 * Parse CSV content into transactions
 */
export function parseCSV(
  content: string,
  accountId: string,
  overrideFormat?: Partial<DetectedFormat>
): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const transactions: ParsedTransaction[] = [];

  try {
    // Parse CSV
    const { headers, rows } = parseCSVString(content);

    if (headers.length === 0) {
      return {
        success: false,
        format: null,
        transactions: [],
        errors: ['CSV file is empty or has no headers'],
        warnings: [],
      };
    }

    // Detect format
    let format = detectFormat(headers);
    if (!format) {
      return {
        success: false,
        format: null,
        transactions: [],
        errors: ['Unable to detect CSV format. Please check that your file has headers.'],
        warnings: [],
      };
    }

    // Apply overrides
    if (overrideFormat) {
      format = { ...format, ...overrideFormat };
    }

    // Parse each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Account for header row and 0-index

      try {
        // Get date
        const dateValue = row[format.dateColumn];
        if (!dateValue) {
          warnings.push(`Row ${rowNum}: Missing date, skipping`);
          continue;
        }
        const date = parseDate(dateValue, format.dateFormat);

        // Get description
        const description = row[format.descriptionColumn] || 'Unknown Transaction';

        // Get amount
        let amount: number;
        if (typeof format.amountColumn === 'string') {
          const amountValue = row[format.amountColumn];
          if (!amountValue) {
            warnings.push(`Row ${rowNum}: Missing amount, skipping`);
            continue;
          }
          amount = parseAmount(amountValue, format.amountMultiplier);
        } else {
          // Separate debit/credit columns
          const debitValue = row[format.amountColumn.debit] || '';
          const creditValue = row[format.amountColumn.credit] || '';

          if (debitValue) {
            amount = -Math.abs(parseAmount(debitValue, 1)); // Debits are negative
          } else if (creditValue) {
            amount = Math.abs(parseAmount(creditValue, 1)); // Credits are positive
          } else {
            warnings.push(`Row ${rowNum}: Missing both debit and credit, skipping`);
            continue;
          }
        }

        // Generate transaction ID
        const transactionId = generateTransactionId(accountId, date, amount, description);

        transactions.push({
          date,
          description,
          amount,
          transactionId,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        warnings.push(`Row ${rowNum}: ${message}`);
      }
    }

    if (transactions.length === 0 && rows.length > 0) {
      errors.push('No valid transactions found in CSV. Check the format and data.');
    }

    return {
      success: errors.length === 0 && transactions.length > 0,
      format,
      transactions,
      errors,
      warnings,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      format: null,
      transactions: [],
      errors: [`Failed to parse CSV: ${message}`],
      warnings: [],
    };
  }
}

/**
 * Get list of supported bank formats
 */
export function getSupportedFormats(): string[] {
  return ['Chase', 'Amex', 'Capital One', 'Bank of America', 'Wells Fargo', 'Discover', 'Generic'];
}
