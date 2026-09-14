import type { PartialTheme } from "@nivo/theming";

/**
 * One Nivo theme shared by every chart, built from the app's CSS variables
 * rather than resolved colors — since those variables already flip with
 * `.dark`, the theme never needs its own light/dark branch.
 */
export const NIVO_THEME: PartialTheme = {
  background: "transparent",
  text: {
    fontSize: 11,
    fill: "var(--muted-foreground)",
  },
  axis: {
    domain: { line: { stroke: "var(--border)", strokeWidth: 1 } },
    ticks: {
      line: { stroke: "var(--border)", strokeWidth: 1 },
      text: { fontSize: 10, fill: "var(--muted-foreground)" },
    },
    legend: { text: { fontSize: 11, fill: "var(--muted-foreground)" } },
  },
  grid: { line: { stroke: "var(--border)", strokeWidth: 1 } },
  legends: {
    text: { fontSize: 11, fill: "var(--muted-foreground)" },
  },
  labels: { text: { fill: "var(--foreground)", fontSize: 11 } },
  dots: { text: { fill: "var(--muted-foreground)" } },
  crosshair: {
    line: { stroke: "var(--muted-foreground)", strokeWidth: 1, strokeOpacity: 0.4 },
  },
  tooltip: {
    container: {
      background: "var(--popover)",
      color: "var(--popover-foreground)",
      fontSize: 12,
      borderRadius: 8,
      border: "1px solid var(--border)",
      boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.25)",
      padding: "6px 10px",
    },
  },
  annotations: { text: { fill: "var(--foreground)" } },
};

/** Compact margins shared by the dashboard's small chart cards. */
export const COMPACT_MARGIN = { top: 12, right: 16, bottom: 28, left: 40 };
