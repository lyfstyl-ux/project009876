import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency values with smart precision:
 * - For values >= $0.01: show 2 decimal places
 * - For values < $0.01 but > 0: show up to 8 significant digits
 * - For zero: show $0.00
 */
export function formatSmartCurrency(value: number | string | null | undefined): string {
  // Handle null, undefined, or non-numeric values
  if (value == null || value === '') return "$0.00";
  
  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN or invalid numbers
  if (isNaN(numValue)) return "$0.00";
  
  if (numValue === 0) return "$0.00";
  
  // For very small values (< $0.01), show more precision
  if (numValue < 0.01) {
    // Format with enough precision to capture the value
    const formatted = numValue.toFixed(8);
    // Remove trailing zeros but keep at least one significant digit visible
    const trimmed = formatted.replace(/\.?0+$/, '');
    // If the value is so small it would round to 0, show it with scientific notation context
    if (parseFloat(trimmed) === 0) {
      // For extremely tiny values, show at least 8 decimals
      return `$${formatted}`;
    }
    return `$${trimmed}`;
  }
  
  // For normal values, use 2 decimal places
  return `$${numValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
