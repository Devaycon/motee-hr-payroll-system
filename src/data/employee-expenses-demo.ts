import {
  Plane,
  Utensils,
  Hotel,
  Laptop,
  AppWindow,
  GraduationCap,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import type { FileAttachment } from "@/src/lib/utils/file-attachments";

export type ExpenseStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "reimbursed";

export type ExpenseCategory =
  | "travel"
  | "meals"
  | "accommodation"
  | "equipment"
  | "software"
  | "training"
  | "other";

export interface ExpenseClaim {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  /** ISO 4217 currency code the claim was incurred in (defaults to tenant currency). */
  currency?: string;
  dateSubmitted: string;
  status: ExpenseStatus;
  merchant: string;
  notes?: string;
  /** Receipts and supporting documents attached when the claim was raised. */
  attachments?: FileAttachment[];
}

/** Common payment currencies an employee may file an expense in. */
export const EXPENSE_CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "GBP", label: "GBP £" },
  { value: "USD", label: "USD $" },
  { value: "EUR", label: "EUR €" },
  { value: "NGN", label: "NGN ₦" },
  { value: "CAD", label: "CAD $" },
  { value: "ZAR", label: "ZAR R" },
];

export const EXPENSE_CATEGORY_OPTIONS: {
  value: ExpenseCategory;
  label: string;
}[] = [
  { value: "travel", label: "Travel" },
  { value: "meals", label: "Meals & Entertainment" },
  { value: "accommodation", label: "Accommodation" },
  { value: "equipment", label: "Equipment" },
  { value: "software", label: "Software & Subscriptions" },
  { value: "training", label: "Training & Development" },
  { value: "other", label: "Other" },
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> =
  Object.fromEntries(
    EXPENSE_CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
  ) as Record<ExpenseCategory, string>;

/** Category icons — scannable at a glance in the list (client feedback §8.3). */
export const EXPENSE_CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  travel: Plane,
  meals: Utensils,
  accommodation: Hotel,
  equipment: Laptop,
  software: AppWindow,
  training: GraduationCap,
  other: Receipt,
};

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  reimbursed: "Reimbursed",
};

export const EXPENSE_STATUS_STYLES: Record<ExpenseStatus, string> = {
  draft: "border-border bg-muted text-muted-foreground",
  submitted: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  approved:
    "border-[#4ED251]/40 bg-[#4ED251]/10 text-[#4ED251]",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-600",
  reimbursed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export const EMPLOYEE_EXPENSES: ExpenseClaim[] = [
  {
    id: "exp-1",
    title: "Client visit — Lagos to Abuja flight",
    category: "travel",
    amount: 185000,
    dateSubmitted: "2026-04-18",
    status: "reimbursed",
    merchant: "Air Peace",
    notes: "Return economy ticket for Q2 client review.",
  },
  {
    id: "exp-2",
    title: "Team lunch with new hires",
    category: "meals",
    amount: 42500,
    dateSubmitted: "2026-04-15",
    status: "approved",
    merchant: "The Yellow Chilli",
  },
  {
    id: "exp-3",
    title: "Hotel stay — onboarding workshop",
    category: "accommodation",
    amount: 96000,
    dateSubmitted: "2026-04-12",
    status: "submitted",
    merchant: "Radisson Blu",
    notes: "Two nights during the facilitator workshop.",
  },
  {
    id: "exp-4",
    title: "Noise-cancelling headphones",
    category: "equipment",
    amount: 78000,
    dateSubmitted: "2026-04-10",
    status: "approved",
    merchant: "Slot Systems",
  },
  {
    id: "exp-5",
    title: "Design software annual licence",
    category: "software",
    amount: 132000,
    dateSubmitted: "2026-04-08",
    status: "submitted",
    merchant: "Figma",
  },
  {
    id: "exp-6",
    title: "Project management certification",
    category: "training",
    amount: 210000,
    dateSubmitted: "2026-04-05",
    status: "rejected",
    merchant: "Coursera",
    notes: "Out of this quarter's L&D budget.",
  },
  {
    id: "exp-7",
    title: "Airport taxi & parking",
    category: "travel",
    amount: 15500,
    dateSubmitted: "2026-04-03",
    status: "reimbursed",
    merchant: "Bolt",
  },
  {
    id: "exp-8",
    title: "Stationery for offsite",
    category: "other",
    amount: 8900,
    dateSubmitted: "2026-03-29",
    status: "draft",
    merchant: "Office Mart",
  },
];
