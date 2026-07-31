import { downloadBlob } from "@/src/lib/download";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import type { ReportColumn, ReportStat } from "./types";

/**
 * Canvas has hard dimension limits across browsers (and much tighter area
 * limits on iOS Safari), so an image export is capped — past this the file
 * would either fail to encode or be unreadable anyway.
 */
export const PNG_MAX_ROWS = 500;

const SCALE = 2; // draw at 2x so text stays sharp on retina screens
/**
 * Browsers also cap total canvas *area* (iOS Safari is the strictest). A wide
 * table at 2x can cross it and `toBlob` then silently yields null, so step the
 * scale down rather than hand back nothing.
 */
const MAX_AREA = 16_000_000;
const FONT = `-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

// Mirrors the print stylesheet in ./export.ts so the PNG and PDF read as siblings.
const INK = "#0f172a";
const MUTED = "#64748b";
const RULE = "#e2e8f0";
const HEADER_BG = "#f8fafc";
const HEADER_INK = "#475569";
const ZEBRA_BG = "#fbfcfd";

const PAD = 32;
const MIN_WIDTH = 900;
const MIN_COL = 80;
const MAX_COL = 320;
const CELL_PAD = 10;
const ROW_H = 30;
const HEAD_H = 34;

function font(size: number, weight = 400): string {
  return `${weight} ${size}px ${FONT}`;
}

/** Trim `text` with an ellipsis so it fits inside `max` px. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(`${text.slice(0, mid)}…`).width <= max) lo = mid;
    else hi = mid - 1;
  }
  return `${text.slice(0, lo)}…`;
}

function cellText<T>(col: ReportColumn<T>, row: T): string {
  const raw = col.value(row);
  return String(col.money ? formatMoneyLocale(Number(raw)) : raw ?? "");
}

/** Render the report as a PNG and download it. Returns false if nothing was produced. */
export function exportPng<T>(
  name: string,
  title: string,
  columns: ReportColumn<T>[],
  rows: T[],
  stats: ReportStat[] = [],
): boolean {
  if (typeof window === "undefined" || columns.length === 0) return false;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const shown = rows.slice(0, PNG_MAX_ROWS);
  const truncated = rows.length > shown.length;

  // ── measure ────────────────────────────────────────────────────────────────
  // Sample the head of the dataset for widths — measuring every cell of a
  // 500-row table is wasted work when the first 60 settle the column anyway.
  const sample = shown.slice(0, 60);
  const cells = shown.map((r) => columns.map((c) => cellText(c, r)));

  const widths = columns.map((col, i) => {
    ctx.font = font(10, 600);
    let w = ctx.measureText(col.header.toUpperCase()).width;
    ctx.font = font(12);
    for (let r = 0; r < sample.length; r += 1) {
      w = Math.max(w, ctx.measureText(cells[r][i]).width);
    }
    return Math.min(MAX_COL, Math.max(MIN_COL, Math.ceil(w) + CELL_PAD * 2));
  });

  const tableW = widths.reduce((s, w) => s + w, 0);
  const width = Math.max(MIN_WIDTH, tableW + PAD * 2);

  // Stat chips wrap across the available width; lay them out before sizing.
  ctx.font = font(18, 700);
  const chips = stats.map((s) => {
    const value = String(s.money ? formatMoneyLocale(Number(s.value)) : s.value);
    ctx.font = font(11);
    const labelW = ctx.measureText(s.label).width;
    ctx.font = font(18, 700);
    const valueW = ctx.measureText(value).width;
    return { label: s.label, value, w: Math.max(120, Math.ceil(Math.max(labelW, valueW)) + 28) };
  });

  const CHIP_H = 56;
  const CHIP_GAP = 12;
  const chipRows: { label: string; value: string; w: number }[][] = [];
  let line: typeof chips = [];
  let lineW = 0;
  for (const chip of chips) {
    const next = lineW === 0 ? chip.w : lineW + CHIP_GAP + chip.w;
    if (next > width - PAD * 2 && line.length) {
      chipRows.push(line);
      line = [chip];
      lineW = chip.w;
    } else {
      line.push(chip);
      lineW = next;
    }
  }
  if (line.length) chipRows.push(line);

  const statsH = chipRows.length ? chipRows.length * (CHIP_H + CHIP_GAP) + 8 : 0;
  const headerH = 30 + 22; // title + meta line
  const footerH = truncated ? 30 : 0;
  const height = PAD * 2 + headerH + statsH + HEAD_H + shown.length * ROW_H + footerH;

  // ── draw ───────────────────────────────────────────────────────────────────
  const scale = Math.min(SCALE, Math.sqrt(MAX_AREA / (width * height)));
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  ctx.scale(scale, scale);
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  let y = PAD;

  ctx.fillStyle = INK;
  ctx.font = font(20, 700);
  ctx.fillText(title, PAD, y + 10);
  y += 30;

  ctx.fillStyle = MUTED;
  ctx.font = font(12);
  ctx.fillText(
    `${rows.length} record${rows.length === 1 ? "" : "s"} · generated ${new Date().toLocaleString()}`,
    PAD,
    y + 8,
  );
  y += 22;

  if (chipRows.length) {
    y += 8;
    for (const row of chipRows) {
      let x = PAD;
      for (const chip of row) {
        ctx.strokeStyle = RULE;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, chip.w, CHIP_H);
        ctx.fillStyle = MUTED;
        ctx.font = font(11);
        ctx.fillText(chip.label, x + 14, y + 18);
        ctx.fillStyle = INK;
        ctx.font = font(18, 700);
        ctx.fillText(fit(ctx, chip.value, chip.w - 28), x + 14, y + 39);
        x += chip.w + CHIP_GAP;
      }
      y += CHIP_H + CHIP_GAP;
    }
  }

  // header row
  ctx.fillStyle = HEADER_BG;
  ctx.fillRect(PAD, y, tableW, HEAD_H);
  ctx.fillStyle = HEADER_INK;
  ctx.font = font(10, 600);
  let x = PAD;
  columns.forEach((col, i) => {
    ctx.fillText(fit(ctx, col.header.toUpperCase(), widths[i] - CELL_PAD * 2), x + CELL_PAD, y + HEAD_H / 2);
    x += widths[i];
  });
  y += HEAD_H;

  // body rows
  shown.forEach((_, r) => {
    if (r % 2 === 1) {
      ctx.fillStyle = ZEBRA_BG;
      ctx.fillRect(PAD, y, tableW, ROW_H);
    }
    ctx.strokeStyle = RULE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, y + ROW_H - 0.5);
    ctx.lineTo(PAD + tableW, y + ROW_H - 0.5);
    ctx.stroke();

    ctx.fillStyle = INK;
    ctx.font = font(12);
    let cx = PAD;
    columns.forEach((_col, i) => {
      ctx.fillText(fit(ctx, cells[r][i], widths[i] - CELL_PAD * 2), cx + CELL_PAD, y + ROW_H / 2);
      cx += widths[i];
    });
    y += ROW_H;
  });

  if (truncated) {
    ctx.fillStyle = MUTED;
    ctx.font = font(11);
    ctx.fillText(
      `Showing first ${shown.length} of ${rows.length} rows — export CSV or Excel for the full dataset.`,
      PAD,
      y + 18,
    );
  }

  canvas.toBlob((blob) => {
    if (blob) downloadBlob(`${name}.png`, blob);
  }, "image/png");

  return true;
}
