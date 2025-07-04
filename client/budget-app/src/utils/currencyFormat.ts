// Utility for proper international currency formatting
// Maps currencies to their appropriate locales for correct formatting

const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',  // German locale for Euro (uses . for thousands, , for decimals)
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU'
};

/**
 * Formats a number as currency using the appropriate locale for the given currency
 * @param amount - The amount to format
 * @param currency - The currency code (USD, EUR, GBP, CAD, AUD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const locale = CURRENCY_LOCALES[currency] || 'en-US';
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency 
  }).format(amount);
}

/**
 * Gets the appropriate locale for a given currency
 * @param currency - The currency code
 * @returns The locale string
 */
export function getCurrencyLocale(currency: string): string {
  return CURRENCY_LOCALES[currency] || 'en-US';
}

/**
 * Parses a number string that may be in international format and converts it to a JavaScript number
 * Handles formats like:
 * - "2,000.87" (US format)
 * - "2.000,87" (European format)
 * - "2000.87" (no thousands separator)
 * - "2,000" (no decimals)
 * @param value - The string value to parse
 * @param currency - The currency code to determine the expected format
 * @returns The parsed number, or NaN if invalid
 */
export function parseCurrencyInput(value: string, currency: string = 'USD'): number {
  if (!value || value.trim() === '') return NaN;
  
  // Clean the input - remove any currency symbols and extra spaces
  let cleanedValue = value.replace(/[^\d.,]/g, '').trim();
  
  if (!cleanedValue) return NaN;
  
  // Determine the format based on currency
  const isEuropeanFormat = currency === 'EUR';
  
  if (isEuropeanFormat) {
    // European format: 2.000,87 -> 2000.87
    // Check if it looks like European format (has both . and ,)
    if (cleanedValue.includes('.') && cleanedValue.includes(',')) {
      // Remove dots (thousands separators) and replace comma with dot
      cleanedValue = cleanedValue.replace(/\./g, '').replace(',', '.');
    } else if (cleanedValue.includes(',')) {
      // Only comma present - treat as decimal separator
      cleanedValue = cleanedValue.replace(',', '.');
    } else if (cleanedValue.includes('.')) {
      // Only dots present - check if it's likely thousands separator (3 digits after dot)
      const parts = cleanedValue.split('.');
      if (parts.length === 2 && parts[1].length === 3) {
        // Likely thousands separator (e.g., "2.000" -> "2000")
        cleanedValue = cleanedValue.replace(/\./g, '');
      }
      // Otherwise treat as decimal separator (already correct)
    }
  } else {
    // US/Other format: 2,000.87 -> 2000.87
    // Remove commas (thousands separators)
    cleanedValue = cleanedValue.replace(/,/g, '');
  }
  
  const result = Number(cleanedValue);
  return isNaN(result) ? NaN : result;
} 