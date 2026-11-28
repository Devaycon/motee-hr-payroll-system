/**
 * Server report datasets (GET /reports/datasets) in the shape the Reports
 * screens already render (ReportDef), so the approved design shows live data
 * unchanged. Rows come from POST /reports/run as string maps keyed by column.
 */
import {
  Briefcase,
  CalendarDays,
  FileBarChart2,
  GraduationCap,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { formatDate } from "@/src/lib/utils/format-date";
import type { ReportColumnDto, ReportDatasetDto } from "@/src/types/reports";
import { getReport } from "./registry";
import type { AnyReportDef, ReportColumn, ReportFilterDef } from "./types";

export type LiveRow = Record<string, string | null>;

/**
 * Columns whose values are server enums, sent PascalCase (`FullTime`,
 * `OnLeave`); shown as words. Other text (names, departments) is left alone.
 */
const ENUM_KEYS = new Set([
  "status",
  "employmentType",
  "workMode",
  "gender",
  "maritalStatus",
  "condition",
  "category",
  "type",
]);

const words = (v: string) => v.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

const GROUP_ICONS: Record<string, LucideIcon> = {
  people: Users,
  talent: GraduationCap,
  operations: Briefcase,
  time: CalendarDays,
  compliance: ShieldCheck,
};

/** Most distinct values a filter dropdown offers. */
const MAX_FILTER_OPTIONS = 100;

function iconFor(dto: ReportDatasetDto): LucideIcon {
  const local = getReport(dto.key);
  if (local) return local.icon;
  const group = dto.group.toLowerCase();
  const hit = Object.keys(GROUP_ICONS).find((k) => group.includes(k));
  return hit ? GROUP_ICONS[hit] : FileBarChart2;
}

function cellValue(col: ReportColumnDto, row: LiveRow): string | number {
  const raw = row[col.key];
  if (raw == null || raw === "") return "—";
  switch (col.kind) {
    case "number": {
      const n = Number(raw);
      return Number.isFinite(n) ? n : raw;
    }
    case "date":
      return formatDate(raw);
    case "boolean":
      return raw.toLowerCase() === "true" ? "Yes" : raw.toLowerCase() === "false" ? "No" : raw;
    default:
      return ENUM_KEYS.has(col.key) ? words(raw) : raw;
  }
}

function columnsOf(dto: ReportDatasetDto): ReportColumn<LiveRow>[] {
  return dto.columns.map((c) => ({
    key: c.key,
    header: c.header,
    value: (row) => cellValue(c, row),
  }));
}

function filtersOf(dto: ReportDatasetDto): ReportFilterDef<LiveRow>[] {
  return dto.columns
    .filter((c) => c.filterable && (c.kind === "text" || c.kind === "boolean"))
    .map((c) => ({
      key: c.key,
      label: c.header,
      options: (rows) =>
        [...new Set(rows.map((r) => String(cellValue(c, r))).filter((v) => v !== "—"))]
          .sort()
          .slice(0, MAX_FILTER_OPTIONS),
      match: (row, value) => String(cellValue(c, row)) === value,
    }));
}

/** One server dataset as a report definition; `rows` feed its `select`. */
export function liveReportDef(dto: ReportDatasetDto, rows: LiveRow[] = []): AnyReportDef {
  const local = getReport(dto.key);
  const columns = columnsOf(dto);
  return {
    id: dto.key,
    label: dto.label,
    description: local?.description,
    icon: iconFor(dto),
    group: dto.group,
    // The server only lists the datasets and columns you may see.
    permission: "",
    select: () => rows,
    columns,
    filters: filtersOf(dto),
    searchText: (row: LiveRow) =>
      columns.map((c) => String(c.value(row))).join(" "),
    analytics: (list: LiveRow[]) => ({
      stats: [{ label: "Records", value: list.length }],
      charts: [],
    }),
  };
}

/** Group names in the order the server first lists them. */
export function liveReportGroups(datasets: ReportDatasetDto[]): string[] {
  return [...new Set(datasets.map((d) => d.group))];
}
