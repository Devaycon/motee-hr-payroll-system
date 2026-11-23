/**
 * Ported unchanged from the MOTEE website calculator
 * (motee-solutions/components/calculator/utils/format.ts) so the dashboard and the
 * website give the same figures to the kobo. Keep the two in sync: change the
 * website first, then copy the file here.
 */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}