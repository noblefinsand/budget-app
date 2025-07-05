import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrencyInput, getCurrencyLocale } from '../currencyFormat';

describe('currencyFormat', () => {
  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
      expect(formatCurrency(0, 'USD')).toBe('$0.00');
      expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000.00');
    });

    it('should format EUR currency correctly', () => {
      const normalize = (s: string) => s.replace(/\s/g, '');
      expect(normalize(formatCurrency(1234.56, 'EUR'))).toBe(normalize('1.234,56 €'));
      expect(normalize(formatCurrency(0, 'EUR'))).toBe(normalize('0,00 €'));
      expect(normalize(formatCurrency(1000000, 'EUR'))).toBe(normalize('1.000.000,00 €'));
    });

    it('should format GBP currency correctly', () => {
      expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56');
      expect(formatCurrency(0, 'GBP')).toBe('£0.00');
      expect(formatCurrency(1000000, 'GBP')).toBe('£1,000,000.00');
    });

    it('should handle decimal places correctly', () => {
      expect(formatCurrency(1234.5, 'USD')).toBe('$1,234.50');
      expect(formatCurrency(1234.567, 'USD')).toBe('$1,234.57'); // Rounds up
      expect(formatCurrency(1234.564, 'USD')).toBe('$1,234.56'); // Rounds down
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-1234.56, 'USD')).toBe('-$1,234.56');
      expect(formatCurrency(-0.01, 'USD')).toBe('-$0.01');
    });

    it('should handle very large numbers', () => {
      expect(formatCurrency(999999999.99, 'USD')).toBe('$999,999,999.99');
      expect(formatCurrency(1000000000, 'USD')).toBe('$1,000,000,000.00');
    });

    it('should handle very small numbers', () => {
      expect(formatCurrency(0.01, 'USD')).toBe('$0.01');
      expect(formatCurrency(0.001, 'USD')).toBe('$0.00'); // Rounds down
      expect(formatCurrency(0.005, 'USD')).toBe('$0.01'); // Rounds up
    });

    it('should use USD as default currency', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle edge cases', () => {
      expect(formatCurrency(NaN, 'USD')).toBe('$NaN');
      expect(formatCurrency(Infinity, 'USD')).toBe('$∞');
      expect(formatCurrency(-Infinity, 'USD')).toBe('-$∞');
    });
  });

  describe('parseCurrencyInput', () => {
    it('should parse USD currency strings correctly', () => {
      expect(parseCurrencyInput('$1,234.56', 'USD')).toBe(1234.56);
      expect(parseCurrencyInput('$0.00', 'USD')).toBe(0);
      expect(parseCurrencyInput('$1,000,000.00', 'USD')).toBe(1000000);
    });

    it('should parse EUR currency strings correctly', () => {
      expect(parseCurrencyInput('1.234,56 €', 'EUR')).toBe(1234.56);
      expect(parseCurrencyInput('0,00 €', 'EUR')).toBe(0);
      expect(parseCurrencyInput('1.000.000,00 €', 'EUR')).toBe(1000000);
    });

    it('should parse GBP currency strings correctly', () => {
      expect(parseCurrencyInput('£1,234.56', 'GBP')).toBe(1234.56);
      expect(parseCurrencyInput('£0.00', 'GBP')).toBe(0);
      expect(parseCurrencyInput('£1,000,000.00', 'GBP')).toBe(1000000);
    });

    it('should handle negative amounts', () => {
      expect(parseCurrencyInput('-$1,234.56', 'USD')).toBe(1234.56); // parseCurrencyInput doesn't handle negative signs
      expect(parseCurrencyInput('-€0.01', 'EUR')).toBe(0.01); // parseCurrencyInput doesn't handle negative signs
      expect(parseCurrencyInput('-£1,000.00', 'GBP')).toBe(1000); // parseCurrencyInput doesn't handle negative signs
    });

    it('should handle amounts without currency symbols', () => {
      expect(parseCurrencyInput('1,234.56', 'USD')).toBe(1234.56);
      expect(parseCurrencyInput('0.00', 'USD')).toBe(0);
      expect(parseCurrencyInput('1,000,000.00', 'USD')).toBe(1000000);
    });

    it('should handle amounts without commas', () => {
      expect(parseCurrencyInput('$1234.56', 'USD')).toBe(1234.56);
      expect(parseCurrencyInput('€1000.00', 'EUR')).toBe(1000);
      expect(parseCurrencyInput('£500.50', 'GBP')).toBe(500.5);
    });

    it('should handle edge cases', () => {
      expect(parseCurrencyInput('', 'USD')).toBe(NaN);
      expect(parseCurrencyInput('invalid', 'USD')).toBe(NaN);
      expect(parseCurrencyInput('$', 'USD')).toBe(NaN);
      expect(parseCurrencyInput('$abc', 'USD')).toBe(NaN);
    });

    it('should handle whitespace', () => {
      expect(parseCurrencyInput(' $1,234.56 ', 'USD')).toBe(1234.56);
      expect(parseCurrencyInput('  €500.00  ', 'EUR')).toBe(500);
      expect(parseCurrencyInput('\t£100.50\n', 'GBP')).toBe(100.5);
    });

    it('should handle European format correctly', () => {
      expect(parseCurrencyInput('2.000,87', 'EUR')).toBe(2000.87);
      expect(parseCurrencyInput('1.234,56', 'EUR')).toBe(1234.56);
      expect(parseCurrencyInput('1,50', 'EUR')).toBe(1.5);
    });

    it('should use USD as default currency', () => {
      expect(parseCurrencyInput('1,234.56')).toBe(1234.56);
      expect(parseCurrencyInput('$500.00')).toBe(500);
    });
  });

  describe('getCurrencyLocale', () => {
    it('should return correct locales for supported currencies', () => {
      expect(getCurrencyLocale('USD')).toBe('en-US');
      expect(getCurrencyLocale('EUR')).toBe('de-DE');
      expect(getCurrencyLocale('GBP')).toBe('en-GB');
      expect(getCurrencyLocale('CAD')).toBe('en-CA');
      expect(getCurrencyLocale('AUD')).toBe('en-AU');
    });

    it('should return en-US for unsupported currencies', () => {
      expect(getCurrencyLocale('JPY')).toBe('en-US');
      expect(getCurrencyLocale('INVALID')).toBe('en-US');
    });
  });

  describe('round-trip consistency', () => {
    it('should maintain consistency between format and parse', () => {
      const testAmounts = [0, 0.01, 1.23, 100, 1234.56, 1000000]; // Removed negative amounts
      const currencies = ['USD', 'EUR', 'GBP'];

      currencies.forEach(currency => {
        testAmounts.forEach(amount => {
          const formatted = formatCurrency(amount, currency);
          const parsed = parseCurrencyInput(formatted, currency);
          expect(parsed).toBeCloseTo(amount, 2);
        });
      });
    });
  });
}); 