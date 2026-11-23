/**
 * Ported unchanged from the MOTEE website calculator
 * (motee-solutions/components/calculator/utils/spreadsheet.ts) so the dashboard and the
 * website give the same figures to the kobo. Keep the two in sync: change the
 * website first, then copy the file here.
 */

import * as XLSX from "xlsx";

export type CellValue = string | number;
export type SheetRow = Record<string, CellValue | undefined>;

export interface SheetColumn {
  header: string;
  /** Values offered in a dropdown on every data row. */
  options?: string[];
  /** Comment shown on the header cell. */
  note?: string;
  /** Format numbers as money (#,##0.00). */
  money?: boolean;
}

export interface SheetData {
  columns: SheetColumn[];
  rows: SheetRow[];
}

// Data rows that get dropdowns in a downloaded workbook.
const DROPDOWN_ROWS = 500;
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Builds and downloads an .xlsx file. SheetJS community edition can't write
 * dropdowns or comments, so workbooks are written with ExcelJS (loaded on demand).
 */
export async function downloadWorkbook(fileName: string, sheetName: string, { columns, rows }: SheetData) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  worksheet.columns = columns.map(({ header }) => ({
    header,
    key: header,
    width: Math.max(14, header.length + 4),
  }));
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  worksheet.addRows(rows);

  columns.forEach((column, i) => {
    const columnNumber = i + 1;
    if (column.money) worksheet.getColumn(columnNumber).numFmt = "#,##0.00";
    if (column.note) headerRow.getCell(columnNumber).note = column.note;
    if (column.options) {
      for (let row = 2; row <= DROPDOWN_ROWS; row++) {
        worksheet.getCell(row, columnNumber).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`"${column.options.join(",")}"`],
          showErrorMessage: true,
          errorTitle: "Invalid value",
          error: `Please choose one of: ${column.options.join(", ")}.`,
        };
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: XLSX_MIME }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Reads the first sheet of an uploaded file into rows keyed by header.
 * Numbers shown as percentages are read as displayed: a cell showing 5%
 * (stored by Excel as 0.05) becomes 5.
 */
export function readSheetRows(data: Uint8Array): Record<string, unknown>[] {
  const workbook = XLSX.read(data, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  for (const [address, cell] of Object.entries(worksheet)) {
    if (address.startsWith("!")) continue;
    const { t, v, w } = cell as XLSX.CellObject;
    if (t === "n" && typeof v === "number" && w?.trim().endsWith("%")) {
      (cell as XLSX.CellObject).v = Math.round(v * 100 * 1e6) / 1e6;
    }
  }

  return XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
}

export type RowReader = ReturnType<typeof createRowReader>;

/**
 * Reads values from an uploaded row by column name. Each name is matched
 * exactly first, then as part of a header, so renamed headers still work.
 */
export function createRowReader(row: Record<string, unknown>) {
  const keys = Object.keys(row);

  const find = (names: string[]): unknown => {
    for (const name of names) {
      const target = name.toLowerCase();
      const key =
        keys.find((k) => k.trim().toLowerCase() === target) ??
        keys.find((k) => k.toLowerCase().includes(target));
      if (key !== undefined && row[key] !== undefined && String(row[key]).trim() !== "") {
        return row[key];
      }
    }
    return undefined;
  };

  const optionalNumber = (names: string[]): number | null => {
    const value = find(names);
    if (value === undefined) return null;
    if (typeof value === "number") return value;
    const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    optionalNumber,
    number: (names: string[], fallback = 0) => optionalNumber(names) ?? fallback,
    text: (names: string[]) => {
      const value = find(names);
      return value === undefined ? undefined : String(value).trim();
    },
    bool: (names: string[], fallback = true) => {
      const value = find(names);
      if (value === undefined) return fallback;
      return ["yes", "true", "1", "y"].includes(String(value).trim().toLowerCase());
    },
    /**
     * Reads a date as yyyy-mm-dd: an Excel date cell, DD/MM/YYYY (UK order)
     * or yyyy-mm-dd text. Returns undefined when blank or unreadable.
     */
    date: (names: string[]): string | undefined => {
      const value = find(names);
      if (value === undefined) return undefined;
      const pad = (n: number) => String(n).padStart(2, "0");
      const iso = (y: number, m: number, d: number) => {
        const date = new Date(Date.UTC(y, m - 1, d));
        return date.getUTCMonth() === m - 1 && date.getUTCDate() === d
          ? `${date.getUTCFullYear()}-${pad(m)}-${pad(d)}`
          : undefined;
      };
      if (typeof value === "number") {
        // Excel serial: days since 30 Dec 1899.
        const date = new Date(Math.round((value - 25569) * 86400000));
        return iso(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
      }
      const text = String(value).trim();
      const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (isoMatch) return iso(+isoMatch[1], +isoMatch[2], +isoMatch[3]);
      const ukMatch = text.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
      if (ukMatch) {
        const year = +ukMatch[3] < 100 ? 2000 + +ukMatch[3] : +ukMatch[3];
        return iso(year, +ukMatch[2], +ukMatch[1]);
      }
      return undefined;
    },
    /** Matches a dropdown label (or the option key itself), case-insensitively. */
    choice: <T extends string>(names: string[], labels: Record<T, string>, fallback: T): T => {
      const value = find(names);
      if (value === undefined) return fallback;
      const target = String(value).trim().toLowerCase();
      const match = (Object.keys(labels) as T[]).find(
        (key) => key.toLowerCase() === target || labels[key].toLowerCase() === target,
      );
      return match ?? fallback;
    },
  };
}
