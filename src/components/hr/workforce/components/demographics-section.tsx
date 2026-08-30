import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { GenderSplitBreakdown } from "@/src/components/shared/gender-figures";
import { WORKFORCE_DEMOGRAPHICS } from "../data";
import type { DemographicItem } from "../types";

interface DemoCardProps {
  title: string;
  items: DemographicItem[];
  colorClass?: string;
}

const AGE_COLORS = [
  "bg-slate-400",
  "bg-violet-500",
  "bg-blue-500",
  "bg-teal-500",
  "bg-emerald-500",
];
const TYPE_COLORS = [
  "bg-blue-500",
  "bg-teal-500",
  "bg-amber-500",
  "bg-violet-500",
];
const TENURE_COLORS = [
  "bg-slate-400",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
];

function DemoCard({
  title,
  items,
  colors,
}: DemoCardProps & { colors: string[] }) {
  const maxCount = Math.max(...items.map((i) => i.count ?? 0), 1);

  return (
    <Card className="border-border/60">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-5">
        <div className="space-y-3.5">
          {items.map((item, idx) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  {item.label}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {item.count ?? 0} · {item.percentage ?? 0}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${colors[idx % colors.length]}`}
                  style={{ width: `${((item.count ?? 0) / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DemographicsSection() {
  const { gender, ageGroup, employmentType, tenure } = WORKFORCE_DEMOGRAPHICS;

  const total = gender.reduce((s, g) => s + g.count, 0);

  return (
    <div className="space-y-6">
      {/* Gender gets figures rather than bars: it is the one breakdown people
          scan for at a glance, and the pictograms read faster than two bars of
          near-equal length. It spans the row because the figures need the
          height.
          The headcount strip that used to sit above this card is gone — it
          repeated the same gender counts in a second colour scheme, which this
          card now states once, with the total. */}
      <Card className="border-border/60">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm font-semibold">
            Gender Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-5">
          <GenderSplitBreakdown
            items={gender.map((g) => ({
              label: g.label,
              count: g.count ?? 0,
              percentage: g.percentage ?? 0,
            }))}
            total={total}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DemoCard title="Age Group" items={ageGroup} colors={AGE_COLORS} />
        <DemoCard
          title="Employment Type"
          items={employmentType}
          colors={TYPE_COLORS}
        />
        <DemoCard title="Tenure Range" items={tenure} colors={TENURE_COLORS} />
      </div>
    </div>
  );
}
