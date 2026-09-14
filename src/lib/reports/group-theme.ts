/**
 * Per-dataset-group colour so the Analytics and Reports hubs read as one
 * colour-coded system (People / Talent / Operations) instead of a wall of
 * identical primary-tinted tiles.
 */
export interface ReportGroupTheme {
  bg: string;
  text: string;
  ring: string;
  dot: string;
  bar: string;
}

const THEMES: Record<string, ReportGroupTheme> = {
  People: {
    bg: "bg-[#5192FA]/10",
    text: "text-[#5192FA]",
    ring: "ring-[#5192FA]/15",
    dot: "bg-[#5192FA]",
    bar: "from-[#5192FA] to-[#5192FA]/40",
  },
  Talent: {
    bg: "bg-[#7F77DD]/10",
    text: "text-[#7F77DD]",
    ring: "ring-[#7F77DD]/15",
    dot: "bg-[#7F77DD]",
    bar: "from-[#7F77DD] to-[#7F77DD]/40",
  },
  Operations: {
    bg: "bg-[#FE8F44]/10",
    text: "text-[#FE8F44]",
    ring: "ring-[#FE8F44]/15",
    dot: "bg-[#FE8F44]",
    bar: "from-[#FE8F44] to-[#FE8F44]/40",
  },
};

const DEFAULT_THEME: ReportGroupTheme = {
  bg: "bg-primary/10",
  text: "text-primary",
  ring: "ring-primary/15",
  dot: "bg-primary",
  bar: "from-primary to-primary/40",
};

export function reportGroupTheme(group: string): ReportGroupTheme {
  return THEMES[group] ?? DEFAULT_THEME;
}
