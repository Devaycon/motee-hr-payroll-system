import { PRIORITY_STYLES as BASE_PRIORITY_STYLES } from "@/src/data/employee-dashboard-demo";

export const PRIORITY_STYLES = BASE_PRIORITY_STYLES;

export const CATEGORY_STYLES: Record<string, string> = {
  Training: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
  Performance: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  HR: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Personal: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
};

const TODAY = "2026-04-23";

export function getDueStatus(due: string, done: boolean): "overdue" | "soon" | "ok" {
  if (done) return "ok";
  if (due < TODAY) return "overdue";
  const daysLeft = Math.ceil(
    (new Date(due).getTime() - new Date(TODAY).getTime()) / 86400000,
  );
  return daysLeft <= 3 ? "soon" : "ok";
}

export function formatDue(due: string): string {
  return new Date(due).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
