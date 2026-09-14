"use client";

/**
 * A stroke-based progress ring — one arc per segment, stacked around the
 * circle. One segment reads as a gauge (value against `total`); several read
 * as a donut-shaped share-of-total. Same geometry as the dashboard's
 * turnover-rate ring, generalized to N segments via `strokeDashoffset`
 * chaining instead of a single fixed arc.
 */
export interface RingSegment {
  value: number;
  color: string;
  label?: string;
}

export function RingStat({
  segments,
  total,
  size = 108,
  strokeWidth = 10,
  centerValue,
  centerLabel,
}: {
  segments: RingSegment[];
  /** Denominator for the arcs. Defaults to the sum of every segment (share-of-total). */
  total?: number;
  size?: number;
  strokeWidth?: number;
  centerValue: string;
  centerLabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const sum = total ?? (segments.reduce((s, seg) => s + seg.value, 0) || 1);
  const single = segments.length === 1;

  // Running offsets built up front rather than accumulated inside the map, so
  // nothing is reassigned during render.
  const fractions = segments.map((seg) => Math.max(0, Math.min(1, seg.value / sum)));
  const cumulativeStarts = fractions.reduce<number[]>(
    (acc, frac) => [...acc, acc[acc.length - 1]! + frac],
    [0],
  );
  const arcs = segments.map((seg, i) => ({
    key: i,
    color: seg.color,
    dash: fractions[i]! * circumference,
    offset: -cumulativeStarts[i]! * circumference,
  }));

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={`${centerValue}${centerLabel ? ` ${centerLabel}` : ""}`}
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        {arcs.map((arc) => (
          <circle
            key={arc.key}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            stroke={arc.color}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={arc.offset}
            strokeLinecap={single ? "round" : "butt"}
          />
        ))}
      </g>
      <text
        x="50%"
        y={centerLabel ? "45%" : "50%"}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground font-bold tabular-nums"
        style={{ fontSize: size * 0.19 }}
      >
        {centerValue}
      </text>
      {centerLabel && (
        <text
          x="50%"
          y="65%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-muted-foreground"
          style={{ fontSize: size * 0.095 }}
        >
          {centerLabel}
        </text>
      )}
    </svg>
  );
}
