"use client";

/** Tapered horizontal bar funnel — each stage as wide as its share of the first stage. */
export function FunnelStat({
  stages,
}: {
  stages: { stage: string; value: number; fill: string }[];
}) {
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="flex flex-col gap-1.5">
      {stages.map((s, i) => {
        const widthPct = Math.max(12, (s.value / max) * 100);
        const prev = stages[i - 1];
        const dropPct = prev && prev.value > 0
          ? Math.round((1 - s.value / prev.value) * 100)
          : null;
        return (
          <div key={s.stage} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">
              {s.stage}
            </span>
            <div className="flex-1">
              <div
                className="flex h-8 items-center justify-center rounded-md text-xs font-semibold text-white shadow-xs transition-all"
                style={{ width: `${widthPct}%`, backgroundColor: s.fill }}
              >
                {s.value.toLocaleString()}
              </div>
            </div>
            {dropPct !== null && dropPct > 0 && (
              <span className="w-12 shrink-0 text-right text-[11px] text-muted-foreground">
                −{dropPct}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
