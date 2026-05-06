import {
  Banknote,
  PalmtreeIcon,
  Monitor,
  FileText,
  HeartPulse,
  UserPlus,
  UserMinus,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { TicketCategory } from "@/src/lib/types/helpdesk";

export const CATEGORY_ICON_MAP: Record<TicketCategory, LucideIcon> = {
  payroll: Banknote,
  leave: PalmtreeIcon,
  it_support: Monitor,
  hr_policy: FileText,
  benefits: HeartPulse,
  onboarding: UserPlus,
  offboarding: UserMinus,
  other: HelpCircle,
};

export {
  TICKETS,
  FAQ_ARTICLES,
  TICKET_CATEGORY_CONFIG,
  TICKET_CATEGORY_OPTIONS,
  TICKET_STATUS_CONFIG,
  TICKET_STATUS_OPTIONS,
  TICKET_PRIORITY_CONFIG,
  TICKET_PRIORITY_OPTIONS,
  computeHelpdeskStats,
} from "@/src/data/helpdesk-demo";

export type {
  HelpDeskTicket,
  TicketCategory,
  TicketStatus,
  TicketPriority,
  TicketMessage,
  FAQArticle,
} from "@/src/lib/types/helpdesk";

export const MY_NAME = "Emeka Nwosu";
export const MY_INITIALS = "EN";
export const MY_DEPT = "Engineering";

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
