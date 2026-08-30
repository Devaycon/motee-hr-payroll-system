"use client";

import { ListChecks } from "lucide-react";
import { BarChart } from "@/src/components/shared/charts";
import { useHrAlertCategories } from "@/src/components/hr/hr-alerts";

/**
 * Where the open work actually sits. Magnitude across one dimension, so a
 * single-hue horizontal bar chart — the category labels are long enough that
 * columns would rotate them, and there is no second series to compare.
 */
const BAR_COLOR = "#6366f1";

export function AlertsByCategoryCard() {
  const categories = useHrAlertCategories();

  const rows = categories
    .map((c) => ({ label: c.label, value: c.alerts.length }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  if (rows.length === 0) return null;

  const total = rows.reduce((sum, r) => sum + r.value, 0);

  return (
    <BarChart
      title="Open Items by Category"
      description="Where the outstanding HR actions sit"
      icon={ListChecks}
      height={Math.max(220, rows.length * 28)}
      footer={`${total} open items across ${rows.length} categories`}
      viewMoreHref="/hr-action-center"
      categories={rows.map((r) => r.label)}
      series={[{ name: "Open items", data: rows.map((r) => r.value) }]}
      colors={rows.map(() => BAR_COLOR)}
    />
  );
}
