import type { LeaveTypeName } from "@/src/lib/types/leave";

export const LEAVE_TYPE_COLORS: Record<
  LeaveTypeName,
  { bar: string; bg: string }
> = {
  annual: { bar: "#2563EB", bg: "#2563EB18" },
  sick: { bar: "#EF4444", bg: "#EF444418" },
  maternity: { bar: "#EC4899", bg: "#EC489918" },
  paternity: { bar: "#7C3AED", bg: "#7C3AED18" },
  unpaid: { bar: "#6B7280", bg: "#6B728018" },
  compassionate: { bar: "#D97706", bg: "#D9770618" },
  study: { bar: "#0D9488", bg: "#0D948818" },
};
