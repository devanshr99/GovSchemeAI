/**
 * Formatting helpers for Indian currency (INR), numbers, and dates.
 */

/**
 * Formats a numeric value or string into the Indian Rupee format (e.g. ₹1,50,000).
 */
export const formatIndianCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === "") return "N/A";
  const num = Number(amount);
  if (isNaN(num)) return String(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

/**
 * Formats a number to standard Indian numbering format (e.g. 1,50,000).
 */
export const formatIndianNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === "") return "0";
  const n = Number(num);
  if (isNaN(n)) return String(num);
  return new Intl.NumberFormat('en-IN').format(n);
};

/**
 * Formats date string or date object into standard Indian format DD/MM/YYYY.
 */
export const formatIndianDate = (dateStr: string | Date | null | undefined): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};
