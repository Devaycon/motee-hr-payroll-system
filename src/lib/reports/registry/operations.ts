import {
  Package,
  ShieldAlert,
  Scale,
  Wallet,
  Layers,
  CheckCircle2,
  CircleDot,
  Boxes,
} from "lucide-react";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { defineReport, type AnyReportDef } from "../types";
import {
  countBy,
  sumBy,
  byMonth,
  monthLabel,
  barSpec,
  pieSpec,
  lineSpec,
  radialSpec,
  funnelSpec,
} from "../charts";

function empName(b: LocaleBundle) {
  const m = new Map(b.employees.map((e) => [e.id, e.fullName]));
  return (id: string) => m.get(id) ?? id ?? "—";
}

// ── Assets ────────────────────────────────────────────────────────────────--
interface AssetRow {
  assetTag: string;
  name: string;
  category: string;
  condition: string;
  status: string;
  assignedTo: string;
  value: number;
}
interface RawAsset {
  assetTag?: string;
  name?: string;
  category?: string;
  condition?: string;
  status?: string;
  assignedTo?: string | null;
  value?: number;
}

const assetsReport = defineReport<AssetRow>({
  id: "assets",
  label: "Assets",
  description: "Asset inventory, assignment, condition and value.",
  icon: Package,
  group: "Operations",
  permission: "operations.assets",
  select: (b) => {
    const name = empName(b);
    return ((b.assets ?? []) as RawAsset[]).map((a) => ({
      assetTag: a.assetTag ?? "—",
      name: a.name ?? "—",
      category: a.category ?? "—",
      condition: a.condition ?? "—",
      status: a.status ?? "—",
      assignedTo: a.assignedTo ? name(a.assignedTo) : "Unassigned",
      value: a.value ?? 0,
    }));
  },
  columns: [
    { key: "assetTag", header: "Tag", value: (r) => r.assetTag },
    { key: "name", header: "Asset", value: (r) => r.name },
    { key: "category", header: "Category", value: (r) => r.category },
    { key: "condition", header: "Condition", value: (r) => r.condition },
    { key: "status", header: "Status", value: (r) => r.status },
    { key: "assignedTo", header: "Assigned To", value: (r) => r.assignedTo },
    { key: "value", header: "Value", value: (r) => r.value, money: true },
  ],
  filters: [
    {
      key: "category",
      label: "Category",
      options: (rows) => [...new Set(rows.map((r) => r.category))],
      match: (r, v) => r.category === v,
    },
    {
      key: "status",
      label: "Status",
      options: (rows) => [...new Set(rows.map((r) => r.status))],
      match: (r, v) => r.status === v,
    },
  ],
  searchText: (r) => `${r.assetTag} ${r.name} ${r.category} ${r.assignedTo}`,
  analytics: (rows) => {
    const inUse = rows.filter((r) => r.status === "in_use").length;
    const totalValue = rows.reduce((s, r) => s + r.value, 0);
    const assigned = rows.filter((r) => r.assignedTo !== "Unassigned").length;
    return {
      stats: [
        { label: "Assets", value: rows.length, sub: "Items in inventory", icon: Boxes },
        {
          label: "In Use",
          value: inUse,
          sub: `${Math.round((inUse / (rows.length || 1)) * 100)}% utilisation`,
          icon: CheckCircle2,
          trend: `${inUse}`,
          up: true,
        },
        { label: "Total Value", value: totalValue, money: true, sub: "Book value of assets", icon: Wallet },
        { label: "Categories", value: new Set(rows.map((r) => r.category)).size, sub: "Asset classes", icon: Layers },
      ],
      charts: [
        pieSpec("asset-cat", "By Category", countBy(rows, (r) => r.category), {
          centerLabel: "Assets",
          description: "Inventory split across asset categories.",
        }),
        barSpec("Value by Category", sumBy(rows, (r) => r.category, (r) => r.value), {
          valueLabel: "Value",
          money: true,
          description: "Where capital is tied up by category.",
        }),
        pieSpec("asset-status", "By Status", countBy(rows, (r) => r.status), {
          centerLabel: "Assets",
          description: "Lifecycle status of every asset.",
        }),
        barSpec("By Condition", countBy(rows, (r) => r.condition), {
          valueLabel: "Assets",
          layout: "horizontal",
          description: "Physical condition of the fleet.",
        }),
        barSpec(
          "Top Assets by Value",
          rows
            .slice()
            .sort((a, z) => z.value - a.value)
            .slice(0, 8)
            .map((r) => ({ label: r.name, value: r.value })),
          { valueLabel: "Value", money: true, description: "Highest-value individual assets." },
        ),
        funnelSpec(
          "Asset Lifecycle",
          [
            { label: "Total Assets", value: rows.length },
            { label: "In Use", value: inUse },
            { label: "Assigned", value: assigned },
          ],
          {
            fullWidth: true,
            description: "From inventory to active assignment.",
          },
        ),
        radialSpec(
          "Assignment",
          [
            { key: "assigned", label: "Assigned", value: assigned, color: "#4ED251" },
            {
              key: "unassigned",
              label: "Unassigned",
              value: Math.max(0, rows.length - assigned),
              color: "#64748b",
            },
          ],
          { centerLabel: "Assets", description: "Assigned vs available inventory." },
        ),
      ],
    };
  },
});

// ── Disciplinary ──────────────────────────────────────────────────────────--
interface DiscRow {
  employee: string;
  date: string;
  type: string;
  reason: string;
  status: string;
  outcome: string;
}

const disciplinaryReport = defineReport<DiscRow>({
  id: "disciplinary",
  label: "Disciplinary",
  description: "Disciplinary cases by type, status and outcome.",
  icon: ShieldAlert,
  group: "Operations",
  permission: "admin.grievance",
  select: (b) => {
    const name = empName(b);
    return (b.disciplinaries ?? []).map((d) => ({
      employee: name(d.employeeId),
      date: d.date,
      type: d.type.replace(/_/g, " "),
      reason: d.reason,
      status: d.status,
      outcome: d.outcome,
    }));
  },
  columns: [
    { key: "employee", header: "Employee", value: (r) => r.employee },
    { key: "date", header: "Date", value: (r) => r.date },
    { key: "type", header: "Type", value: (r) => r.type },
    { key: "reason", header: "Reason", value: (r) => r.reason },
    { key: "status", header: "Status", value: (r) => r.status },
    { key: "outcome", header: "Outcome", value: (r) => r.outcome },
  ],
  filters: [
    {
      key: "type",
      label: "Type",
      options: (rows) => [...new Set(rows.map((r) => r.type))],
      match: (r, v) => r.type === v,
    },
    {
      key: "status",
      label: "Status",
      options: (rows) => [...new Set(rows.map((r) => r.status))],
      match: (r, v) => r.status === v,
    },
  ],
  searchText: (r) => `${r.employee} ${r.type} ${r.reason}`,
  analytics: (rows) => {
    const active = rows.filter((r) => r.status === "active" || r.status === "open").length;
    const resolved = rows.filter((r) => r.status === "resolved" || r.status === "closed").length;
    const months = byMonth(rows, (r) => r.date);
    return {
      stats: [
        { label: "Cases", value: rows.length, sub: "All disciplinary cases", icon: ShieldAlert },
        { label: "Active", value: active, sub: "Open / in progress", icon: CircleDot, trend: `${active}`, up: false },
        { label: "Resolved", value: resolved, sub: `${Math.round((resolved / (rows.length || 1)) * 100)}% closed`, icon: CheckCircle2, trend: `${resolved}`, up: true },
        { label: "Types", value: new Set(rows.map((r) => r.type)).size, sub: "Distinct case types", icon: Layers },
      ],
      charts: [
        barSpec("By Type", countBy(rows, (r) => r.type), {
          valueLabel: "Cases",
          description: "Most common disciplinary categories.",
        }),
        pieSpec("disc-status", "By Status", countBy(rows, (r) => r.status), {
          centerLabel: "Cases",
          description: "Where cases sit in the process.",
        }),
        barSpec("By Outcome", countBy(rows, (r) => r.outcome), {
          valueLabel: "Cases",
          layout: "horizontal",
          description: "Resolutions applied to cases.",
        }),
        barSpec("By Reason", countBy(rows, (r) => r.reason).slice(0, 8), {
          valueLabel: "Cases",
          description: "Leading reasons cited.",
        }),
        lineSpec(
          "Cases by Month",
          months.map((m) => ({ month: monthLabel(m.label), cases: m.value })),
          [{ key: "cases", label: "Cases", color: "#ff8b2d" }],
          "month",
          "area",
          { fullWidth: true, description: "Disciplinary case trend over time." },
        ),
        radialSpec(
          "Resolution Rate",
          [
            { key: "resolved", label: "Resolved", value: resolved, color: "#4ED251" },
            { key: "active", label: "Active", value: active, color: "#f43f5e" },
          ],
          { centerLabel: "Cases", description: "Resolved vs active caseload." },
        ),
      ],
    };
  },
});

// ── Grievance / Employee Relations ────────────────────────────────────────--
interface GrvRow {
  id: string;
  category: string;
  severity: string;
  status: string;
  openedAt: string;
  assignedTo: string;
}
interface RawGrievance {
  id?: string;
  category?: string;
  severity?: string;
  priority?: string;
  status?: string;
  openedAt?: string;
  assignedTo?: string;
}

const grievanceReport = defineReport<GrvRow>({
  id: "grievance",
  label: "Grievance / ER Cases",
  description: "Employee relations cases by category, severity and status.",
  icon: Scale,
  group: "Operations",
  permission: "admin.grievance",
  select: (b) => {
    const name = empName(b);
    return ((b.grievances ?? []) as RawGrievance[]).map((g) => ({
      id: g.id ?? "—",
      category: g.category ?? "—",
      severity: g.severity ?? g.priority ?? "—",
      status: g.status ?? "—",
      openedAt: g.openedAt ?? "—",
      assignedTo: g.assignedTo ? name(g.assignedTo) : "—",
    }));
  },
  columns: [
    { key: "id", header: "Case", value: (r) => r.id },
    { key: "category", header: "Category", value: (r) => r.category },
    { key: "severity", header: "Severity", value: (r) => r.severity },
    { key: "status", header: "Status", value: (r) => r.status },
    { key: "openedAt", header: "Opened", value: (r) => r.openedAt },
    { key: "assignedTo", header: "Assigned To", value: (r) => r.assignedTo },
  ],
  filters: [
    {
      key: "category",
      label: "Category",
      options: (rows) => [...new Set(rows.map((r) => r.category))],
      match: (r, v) => r.category === v,
    },
    {
      key: "status",
      label: "Status",
      options: (rows) => [...new Set(rows.map((r) => r.status))],
      match: (r, v) => r.status === v,
    },
  ],
  searchText: (r) => `${r.id} ${r.category} ${r.status}`,
  analytics: (rows) => {
    const open = rows.filter((r) => r.status === "open").length;
    const resolved = rows.filter((r) => r.status === "resolved" || r.status === "closed").length;
    const months = byMonth(rows, (r) => r.openedAt);
    return {
      stats: [
        { label: "Cases", value: rows.length, sub: "All ER cases", icon: Scale },
        { label: "Open", value: open, sub: "Awaiting resolution", icon: CircleDot, trend: `${open}`, up: false },
        { label: "Resolved", value: resolved, sub: `${Math.round((resolved / (rows.length || 1)) * 100)}% closed`, icon: CheckCircle2, trend: `${resolved}`, up: true },
        { label: "Categories", value: new Set(rows.map((r) => r.category)).size, sub: "Issue types", icon: Layers },
      ],
      charts: [
        barSpec("By Category", countBy(rows, (r) => r.category), {
          valueLabel: "Cases",
          description: "Most frequent grievance categories.",
        }),
        pieSpec("grv-status", "By Status", countBy(rows, (r) => r.status), {
          centerLabel: "Cases",
          description: "Case resolution workflow.",
        }),
        pieSpec("grv-severity", "By Severity", countBy(rows, (r) => r.severity), {
          centerLabel: "Cases",
          description: "Severity / priority distribution.",
        }),
        barSpec("By Assignee", countBy(rows, (r) => r.assignedTo).slice(0, 8), {
          valueLabel: "Cases",
          layout: "horizontal",
          description: "Caseload per handler.",
        }),
        lineSpec(
          "Cases Opened by Month",
          months.map((m) => ({ month: monthLabel(m.label), cases: m.value })),
          [{ key: "cases", label: "Cases", color: "#a855f7" }],
          "month",
          "area",
          { fullWidth: true, description: "Grievance volume trend over time." },
        ),
        radialSpec(
          "Resolution Rate",
          [
            { key: "resolved", label: "Resolved", value: resolved, color: "#4ED251" },
            { key: "open", label: "Open", value: open, color: "#f43f5e" },
          ],
          { centerLabel: "Cases", description: "Resolved vs open caseload." },
        ),
      ],
    };
  },
});

export const OPERATIONS_REPORTS: AnyReportDef[] = [
  assetsReport,
  disciplinaryReport,
  grievanceReport,
];
