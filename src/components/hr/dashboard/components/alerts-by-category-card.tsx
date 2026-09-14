"use client";

import { ResponsiveBar } from "@nivo/bar";
import { ListChecks } from "lucide-react";
import { ChartCard, NIVO_THEME } from "@/src/components/shared/charts";
import { useHrAlertCategories } from "@/src/components/hr/hr-alerts";

/**
 * Where the open work actually sits. Magnitude across one dimension, so a
 * single-hue horizontal bar chart — the category labels are long enough that
 * columns would rotate them, and there is no second series to compare.
 */
export function AlertsByCategoryCard() {
  const categories = useHrAlertCategories();

  const rows = categories
    .map((c) => ({ label: c.label, value: c.alerts.length }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  if (rows.length === 0) return null;

  const total = rows.reduce((sum, r) => sum + r.value, 0);

  return (
    <ChartCard
      title="Open Items by Category"
      description="Where the outstanding HR actions sit"
      icon={ListChecks}
      compact
      footer={`${total} open items across ${rows.length} categories`}
      viewMoreHref="/hr-action-center"
    >
      <div style={{ height: Math.max(140, rows.length * 32) }}>
        <ResponsiveBar
          data={rows}
          keys={["value"]}
          indexBy="label"
          layout="horizontal"
          margin={{ top: 4, right: 24, bottom: 24, left: 110 }}
          padding={0.35}
          colors={["#6366f1"]}
          borderRadius={3}
          axisTop={null}
          axisRight={null}
          axisBottom={{ tickSize: 0, tickPadding: 6 }}
          axisLeft={{ tickSize: 0, tickPadding: 8 }}
          enableGridY={false}
          enableGridX
          enableLabel
          labelSkipWidth={20}
          labelTextColor="var(--card)"
          theme={NIVO_THEME}
          motionConfig="gentle"
        />
      </div>
    </ChartCard>
  );
}
