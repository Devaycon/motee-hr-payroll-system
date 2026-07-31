import * as XLSX from "xlsx";
import Papa from "papaparse";
import { downloadFile } from "@/src/lib/download";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import type { ReportColumn, ReportStat } from "./types";

export { exportPng, PNG_MAX_ROWS } from "./png";

function headers<T>(columns: ReportColumn<T>[]): string[] {
  return columns.map((c) => c.header);
}
function matrix<T>(columns: ReportColumn<T>[], rows: T[]): (string | number)[][] {
  return rows.map((r) => columns.map((c) => c.value(r)));
}

export function exportCsv<T>(
  name: string,
  columns: ReportColumn<T>[],
  rows: T[],
): void {
  const csv = Papa.unparse({ fields: headers(columns), data: matrix(columns, rows) });
  downloadFile(`${name}.csv`, csv, "text/csv;charset=utf-8");
}

export function exportJson<T>(
  name: string,
  columns: ReportColumn<T>[],
  rows: T[],
): void {
  const data = rows.map((r) =>
    Object.fromEntries(columns.map((c) => [c.key, c.value(r)])),
  );
  downloadFile(`${name}.json`, JSON.stringify(data, null, 2), "application/json");
}

export function exportXlsx<T>(
  name: string,
  columns: ReportColumn<T>[],
  rows: T[],
): void {
  const aoa = [headers(columns), ...matrix(columns, rows)];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${name}.xlsx`);
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Open a styled print window for the report and trigger the browser's print-to-PDF. */
export function printPdf<T>(
  title: string,
  columns: ReportColumn<T>[],
  rows: T[],
  stats: ReportStat[] = [],
): void {
  if (typeof window === "undefined") return;
  const w = window.open("", "_blank", "width=1024,height=768");
  if (!w) return;

  const statHtml = stats
    .map(
      (s) =>
        `<div class="stat"><div class="stat-label">${esc(s.label)}</div><div class="stat-value">${esc(
          s.money ? formatMoneyLocale(Number(s.value)) : s.value,
        )}</div></div>`,
    )
    .join("");

  const thead = `<tr>${columns.map((c) => `<th>${esc(c.header)}</th>`).join("")}</tr>`;
  const tbody = rows
    .map(
      (r) =>
        `<tr>${columns
          .map((c) => {
            const raw = c.value(r);
            const val = c.money ? formatMoneyLocale(Number(raw)) : raw;
            return `<td>${esc(val)}</td>`;
          })
          .join("")}</tr>`,
    )
    .join("");

  w.document.write(`<!doctype html><html><head><meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  *{box-sizing:border-box;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;}
  body{margin:24px;color:#0f172a;}
  h1{font-size:20px;margin:0 0 2px;}
  .meta{color:#64748b;font-size:12px;margin-bottom:16px;}
  .stats{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px;}
  .stat{border:1px solid #e2e8f0;border-radius:8px;padding:8px 14px;min-width:120px;}
  .stat-label{font-size:11px;color:#64748b;}
  .stat-value{font-size:18px;font-weight:700;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e2e8f0;}
  th{background:#f8fafc;color:#475569;text-transform:uppercase;font-size:10px;letter-spacing:.04em;}
  @media print{.no-print{display:none;}}
</style></head><body>
  <h1>${esc(title)}</h1>
  <div class="meta">${esc(rows.length)} records · generated ${new Date().toLocaleString()}</div>
  ${statHtml ? `<div class="stats">${statHtml}</div>` : ""}
  <table><thead>${thead}</thead><tbody>${tbody}</tbody></table>
  <script>window.onload=function(){setTimeout(function(){window.print();},250);};<\/script>
</body></html>`);
  w.document.close();
}
