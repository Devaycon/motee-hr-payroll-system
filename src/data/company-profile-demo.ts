import { ShieldCheck, Clock, CheckCircle2, XCircle, Users, Briefcase, TrendingUp, CalendarCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ORG_NODES = [
  { id: "n-001", name: "Emeka Nwosu", initials: "EN", role: "Chief Executive Officer", dept: "Executive", reportsTo: null },
  { id: "n-002", name: "Chidinma Okeke", initials: "CO", role: "HR Manager", dept: "HR", reportsTo: "n-001" },
  { id: "n-003", name: "Sodiq Olawale", initials: "SO", role: "Head of Operations", dept: "Operations", reportsTo: "n-001" },
  { id: "n-004", name: "Blessing Okafor", initials: "BO", role: "Finance Manager", dept: "Finance", reportsTo: "n-001" },
  { id: "n-005", name: "Adaeze Okonkwo", initials: "AO", role: "Lead Engineer", dept: "Engineering", reportsTo: "n-001" },
  { id: "n-006", name: "Aisha Bello", initials: "AB", role: "Brand Manager", dept: "Marketing", reportsTo: "n-003" },
  { id: "n-007", name: "Chukwuemeka Eze", initials: "CE", role: "Backend Engineer", dept: "Engineering", reportsTo: "n-005" },
  { id: "n-008", name: "Musa Ibrahim", initials: "MI", role: "Accountant", dept: "Finance", reportsTo: "n-004" },
];

export const STAGE_ICONS: Record<string, LucideIcon> = {
  Draft: Clock,
  Submitted: CheckCircle2,
  "Under Review": ShieldCheck,
  Verified: CheckCircle2,
  Rejected: XCircle,
};

export const STAGE_STYLES: Record<string, string> = {
  Draft: "border-slate-400/40 bg-slate-400/10 text-slate-500",
  Submitted: "border-blue-400/40 bg-blue-400/10 text-blue-600",
  "Under Review": "border-amber-400/40 bg-amber-400/10 text-amber-600",
  Verified: "border-emerald-400/40 bg-emerald-400/10 text-emerald-600",
  Rejected: "border-red-400/40 bg-red-400/10 text-red-600",
};

export const ACTIVITY_STATS: { label: string; value: string | number; icon: LucideIcon }[] = [
  { label: "Total Employees", value: 183, icon: Users },
  { label: "Open Positions", value: 12, icon: Briefcase },
  { label: "Turnover Rate", value: "4.2%", icon: TrendingUp },
  { label: "Attendance Rate", value: "94.6%", icon: CalendarCheck },
];
