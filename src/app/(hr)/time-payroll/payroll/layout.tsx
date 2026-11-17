/**
 * Scopes payroll-only styling (see `.payroll-surface` in globals.css): the HR
 * shell draws a logo watermark behind every page, and payroll's translucent
 * inputs let it show through. `contents` keeps this wrapper out of the layout.
 */
export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  return <div className="payroll-surface contents">{children}</div>;
}
