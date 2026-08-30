"use client";

import { cn } from "@/src/lib/utils";

/** Default height of the gender pictograms, in px. */
export const GENDER_FIGURE_SIZE = 150;

/**
 * The classic restroom-sign pictogram: round head, arms tucked at the sides,
 * an A-line skirt for the female figure and a straight torso for the male.
 *
 * Hand-drawn rather than taken from an icon set — neither of the project's icon
 * libraries has this silhouette. Tabler ships only `IconMan`/`IconWoman`, which
 * stand in a T-pose with the arms straight out, and lucide has no gendered
 * human figure at all.
 *
 * `aria-hidden`: the label and percentage are printed directly beneath, so the
 * drawing is a restatement rather than new information.
 */
/**
 * One leg: square at the top, rounded only at the foot.
 *
 * A plain `<rect rx>` rounds all four corners, which gave each leg a
 * semicircular top sitting just below the hem — it read as a separate pill
 * rather than a leg joined to the body. The top edge has to be flat, and the
 * leg has to start *inside* the body so the two overlap; legs paint after the
 * body in the same colour, so the overlap is invisible and the join is solid.
 */
function Leg({
  x,
  top,
  width,
  bottom,
}: {
  x: number;
  /** Starts inside the body, not at its hem. */
  top: number;
  width: number;
  bottom: number;
}) {
  const r = width / 2; // a fully rounded foot
  const h = bottom - top;
  return (
    <path
      d={`M${x} ${top} h${width} v${h - r} a${r} ${r} 0 0 1 ${-r} ${r} h${-(width - 2 * r)} a${r} ${r} 0 0 1 ${-r} ${-r} z`}
    />
  );
}

export function GenderPictogram({
  variant,
  size = GENDER_FIGURE_SIZE,
}: {
  variant: "female" | "male";
  size?: number;
}) {
  // Drawn on a 60×100 canvas so the proportions can be reasoned about in
  // percentages: head to y20, body to ~y55–62, legs to y97. The bodies are
  // deliberately broad — a narrower silhouette stops reading as a restroom
  // sign and starts looking like a stick figure.
  return (
    <svg
      viewBox="0 0 60 100"
      height={size}
      width={size * 0.6}
      aria-hidden
      className="fill-current text-primary"
    >
      <circle cx="30" cy="10.5" r="9" />
      {variant === "female" ? (
        <>
          {/* Narrow shoulders opening into a straight-sided A-line skirt with
              a flat hem — the sides are straight lines, not a bell curve. */}
          <path d="M30 21c-5.6 0-9 2.2-10.2 6.6L6.2 60.4a1.6 1.6 0 0 0 1.52 2.1h44.56a1.6 1.6 0 0 0 1.52-2.1L40.2 27.6C39 23.2 35.6 21 30 21z" />
          <Leg x={21.8} top={57} width={7.6} bottom={97.2} />
          <Leg x={30.6} top={57} width={7.6} bottom={97.2} />
        </>
      ) : (
        <>
          {/* Straight torso, arms tucked in. Widest at the shoulders and
              tapering very slightly to the hips — it must not flare outwards,
              which is what makes a male pictogram read as a dress. */}
          <path d="M30 21c-7.2 0-11.6 2.8-12.3 8L19.2 53.4a1.8 1.8 0 0 0 1.79 2h18.02a1.8 1.8 0 0 0 1.79-2L42.3 29c-.7-5.2-5.1-8-12.3-8z" />
          <Leg x={21.6} top={50} width={7.8} bottom={97.2} />
          <Leg x={30.6} top={50} width={7.8} bottom={97.2} />
        </>
      )}
    </svg>
  );
}

export interface GenderDatum {
  label: string;
  count: number;
  percentage: number;
}

/**
 * Which pictogram a label maps to, or `null` for anything that isn't one of the
 * two drawn figures.
 *
 * Female is tested first on purpose: `"female".includes("male")` is true, so
 * checking male first would draw every woman as a man.
 */
function variantFor(label: string): "female" | "male" | null {
  const l = label.trim().toLowerCase();
  if (l.includes("female") || l.includes("woman") || l.includes("women")) {
    return "female";
  }
  if (l.includes("male") || l.includes("man") || l.includes("men")) {
    return "male";
  }
  return null;
}

/** Monochrome ramp for the proportion bar — one hue, so it reads as one measure. */
const SEGMENT_TONES = ["bg-primary", "bg-primary/55", "bg-primary/30"];

/**
 * Gender split drawn as figures rather than bars.
 *
 * Female and male get a pictogram with their share and headcount beneath;
 * anything else (other, undisclosed, non-binary) has no agreed pictogram, so it
 * is listed in text instead of inventing one. The proportion bar underneath
 * carries every category, so the categories without a figure are still visible
 * in the total.
 */
export function GenderSplitBreakdown({
  items,
  total,
  className,
  figureSize = GENDER_FIGURE_SIZE,
}: {
  items: GenderDatum[];
  /** Headcount the percentages are of; summed from `items` when omitted. */
  total?: number;
  className?: string;
  figureSize?: number;
}) {
  const headcount = total ?? items.reduce((sum, i) => sum + i.count, 0);

  const drawn = items
    .map((item) => ({ item, variant: variantFor(item.label) }))
    .filter((x): x is { item: GenderDatum; variant: "female" | "male" } =>
      Boolean(x.variant),
    );
  const rest = items.filter((item) => !variantFor(item.label));

  if (drawn.length === 0) return null;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-6">
        {drawn.map(({ item, variant }) => (
          <div key={item.label} className="text-center">
            <GenderPictogram variant={variant} size={figureSize} />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {item.label}
            </p>
            <p className="text-4xl font-bold leading-none text-foreground tabular-nums">
              {item.percentage}%
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {item.count} {item.count === 1 ? "employee" : "employees"}
            </p>
          </div>
        ))}
      </div>

      {/* Every category, including the ones with no figure, so the bar always
          accounts for the whole headcount. */}
      <div
        className="mt-6 flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={items
          .map((i) => `${i.label} ${i.percentage}%`)
          .join(", ")}
      >
        {items.map((item, i) => (
          <div
            key={item.label}
            className={SEGMENT_TONES[i % SEGMENT_TONES.length]}
            style={{ width: `${item.percentage}%` }}
          />
        ))}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {items.map((item, i) => (
            <span key={item.label} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  SEGMENT_TONES[i % SEGMENT_TONES.length],
                )}
              />
              {item.label} {item.percentage}%
            </span>
          ))}
        </span>
        <span className="tabular-nums">
          {headcount} {headcount === 1 ? "employee" : "employees"} in total
        </span>
      </div>

      {rest.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {rest
            .map((r) => `${r.label}: ${r.count} (${r.percentage}%)`)
            .join(" · ")}{" "}
          — shown in the bar, no standard figure to draw.
        </p>
      )}
    </div>
  );
}
