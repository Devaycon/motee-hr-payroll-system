/**
 * Privacy Notice content and version (client feedback §2.12).
 *
 * The version string is the important part: consent is only defensible if you
 * can show *which* wording someone agreed to. Bump `PRIVACY_NOTICE_VERSION`
 * whenever the text below changes materially — never edit the text in place
 * without bumping it, or previously-recorded consents become unverifiable.
 */

export const PRIVACY_NOTICE_VERSION = "2026.1";
export const PRIVACY_NOTICE_EFFECTIVE_FROM = "2026-01-01";

export interface PrivacyPurposeRow {
  data: string;
  purpose: string;
}

/** What is collected and why — the mapped table the client specified. */
export const PRIVACY_PURPOSES: PrivacyPurposeRow[] = [
  { data: "Personal details", purpose: "Create and maintain your employee record" },
  { data: "Bank details", purpose: "Pay your salary" },
  { data: "National Insurance number", purpose: "Report earnings and tax to HMRC" },
  { data: "Emergency contact", purpose: "Contact someone on your behalf in an emergency" },
  { data: "Right to Work documents", purpose: "Comply with UK immigration law" },
  { data: "Payroll information", purpose: "Calculate pay, pension and deductions" },
];

/** Who the data is shared with. */
export const PRIVACY_RECIPIENTS: string[] = [
  "Payroll provider",
  "Pension provider",
  "HMRC",
  "Government agencies where legally required",
  "Background checking providers",
];

export interface RetentionRow {
  record: string;
  period: string;
}

/** How long each category is kept. */
export const PRIVACY_RETENTION: RetentionRow[] = [
  { record: "Payroll records", period: "6 years after the end of the tax year" },
  { record: "Right to Work documents", period: "Duration of employment plus 2 years" },
  {
    record: "Recruitment records (unsuccessful applicants)",
    period: "6–12 months",
  },
  { record: "Employee file", period: "Typically 6 years after employment ends" },
];

/** How the data is protected. */
export const PRIVACY_SAFEGUARDS: string[] = [
  "Encryption in transit and at rest",
  "Secure, access-controlled servers",
  "Role-based access — only staff who need the data can see it",
  "Multi-factor authentication for administrators",
  "Regular backups and monitoring",
];

/** The rights a data subject has. */
export const PRIVACY_RIGHTS: string[] = [
  "Access the personal data we hold about you",
  "Ask us to correct anything inaccurate",
  "Ask us to delete data we no longer need",
  "Ask us to restrict how we use your data",
  "Receive a copy of your data in a portable format",
  "Complain to the Information Commissioner's Office",
];

/** Short summary shown before the first form (§2.12 step 1). */
export const PRIVACY_SUMMARY =
  "We collect personal information to employ you, pay you correctly, and meet " +
  "our legal obligations. We only share it with parties who need it — such as " +
  "our payroll and pension providers and HMRC — and we keep it only as long as " +
  "the law requires.";
