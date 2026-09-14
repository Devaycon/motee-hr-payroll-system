/**
 * Column spans for a per-group dataset-card grid so a group's own last row
 * never ends in dead grid cells (client feedback — no empty space). Each
 * group renders on a 12-column grid, 3-up on desktop / 2-up on tablet;
 * whatever doesn't divide evenly is redistributed across the trailing
 * row so it always sums back to 12, instead of leaving 1-2 blank cells.
 *
 * Tailwind's scanner needs the full class literal in source, so spans are
 * looked up from these maps rather than built with template interpolation.
 */
const SM_SPAN: Record<number, string> = {
  6: "sm:col-span-6",
  12: "sm:col-span-12",
};

const LG_SPAN: Record<number, string> = {
  4: "lg:col-span-4",
  6: "lg:col-span-6",
  12: "lg:col-span-12",
};

function spanFor(count: number, index: number, columns: number): number {
  const per = 12 / columns;
  const remainder = count % columns;
  if (remainder === 0 || index < count - remainder) return per;
  return 12 / remainder;
}

export interface GridSpan {
  /** Column-span classes to apply to the grid item. */
  className: string;
  /** True when this card is alone in its row at the 3-up breakpoint — it
   *  gets the full row width, so it should switch to a wide/banner layout
   *  rather than stretch the normal vertical tile into empty space. */
  wide: boolean;
}

export function gridFillSpans(count: number): GridSpan[] {
  return Array.from({ length: count }, (_, i) => {
    const sm = spanFor(count, i, 2);
    const lg = spanFor(count, i, 3);
    return {
      className: `col-span-12 ${SM_SPAN[sm]} ${LG_SPAN[lg]}`,
      wide: lg === 12,
    };
  });
}
