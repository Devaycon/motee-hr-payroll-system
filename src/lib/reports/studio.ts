import type { AnyReportDef, FieldType, ReportColumn, ReportContext } from "./types";
import { columnsOf } from "./types";

/**
 * MOTEE Report Studio — the engine behind the advanced custom report builder
 * (client feedback B2, Nov 2026). Pure functions: the page and the tests use
 * the same code, so what's previewed is exactly what's exported.
 *
 * A report is a saved spec (dataset, columns, filters, grouping, calculated
 * fields, output), never a copy of data — it reruns against live records
 * every time, and field access is checked on every run.
 */

export type FilterOp = "eq" | "neq" | "contains" | "gt" | "gte" | "lt" | "lte" | "empty" | "not_empty";
export type Aggregate = "sum" | "avg" | "count" | "min" | "max";
export type OutputKind = "table" | "summary" | "chart" | "kpi";
export type Frequency = "daily" | "weekly" | "monthly" | "quarterly";

export const FILTER_OP_LABELS: Record<FilterOp, string> = {
  eq: "is",
  neq: "is not",
  contains: "contains",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  empty: "is empty",
  not_empty: "is not empty",
};

export interface StudioFilter {
  field: string;
  op: FilterOp;
  value: string;
}

export interface CalculatedField {
  key: string;
  label: string;
  /** e.g. "[Gross Pay] - [Net Pay]" — field names in square brackets, + − × ÷ and brackets. */
  formula: string;
  type: "money" | "number" | "percent";
}

export interface ReportSpec {
  id: string;
  name: string;
  description?: string;
  datasetId: string;
  /** Selected fields in order, with an optional rename. */
  columns: { key: string; label?: string }[];
  filters: StudioFilter[];
  match: "all" | "any";
  /** Payroll datasets: pay months "YYYY-MM", inclusive. */
  monthFrom?: string;
  monthTo?: string;
  groupBy?: string;
  /** Aggregation per numeric column when grouped (default sum). */
  aggregates?: Record<string, Aggregate>;
  sort?: { key: string; dir: "asc" | "desc" };
  calculated: CalculatedField[];
  output: OutputKind;
  /** For chart output: the measure plotted per group. */
  chartMeasure?: string;
  schedule?: { frequency: Frequency; recipients: { id: string; name: string }[]; format: "xlsx" | "csv" | "pdf"; nextRun: string } | null;
  status: "active" | "archived";
  template?: boolean;
  owner: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudioField {
  key: string;
  label: string;
  type: FieldType;
  description?: string;
  source?: string;
  section?: string;
  sensitive?: "identifier" | "bank";
  /** The dataset the field comes from (for combined payroll datasets). */
  dataset: string;
  calculated?: boolean;
  value: (row: unknown) => string | number;
}

const isNumeric = (t: FieldType) => t === "money" || t === "number" || t === "percent";

/** Every field a spec can use: the dataset's, plus (for joined datasets) its siblings', plus calculated fields. */
export function fieldsFor(def: AnyReportDef, all: AnyReportDef[], ctx: ReportContext, calculated: CalculatedField[] = []): StudioField[] {
  const family = def.joinGroup ? [def, ...all.filter((d) => d !== def && d.joinGroup === def.joinGroup)] : [def];
  const seen = new Set<string>();
  const out: StudioField[] = [];
  for (const d of family) {
    for (const c of columnsOf(d, ctx) as ReportColumn<unknown>[]) {
      if (seen.has(c.key)) continue;
      seen.add(c.key);
      out.push({
        key: c.key,
        label: c.header,
        type: c.type ?? (c.money ? "money" : "text"),
        description: c.description,
        source: c.source,
        section: c.section,
        sensitive: c.sensitive,
        dataset: d.label,
        value: c.value,
      });
    }
  }
  const base = new Map(out.map((f) => [f.key, f]));
  for (const cf of calculated) {
    const parsed = parseFormula(cf.formula, out);
    if (!parsed.ok) continue;
    out.push({
      key: cf.key,
      label: cf.label,
      type: cf.type,
      description: `Calculated: ${cf.formula}`,
      source: "Calculated field",
      section: "Calculated",
      dataset: def.label,
      calculated: true,
      value: (row) => {
        const v = evalAst(parsed.ast, (k) => Number(base.get(k)?.value(row)) || 0);
        return v === null ? 0 : Math.round(v * 100) / 100;
      },
    });
  }
  return out;
}

// ── Formulas ────────────────────────────────────────────────────────────────

type Ast = { t: "num"; v: number } | { t: "field"; key: string } | { t: "op"; op: "+" | "-" | "*" | "/"; l: Ast; r: Ast } | { t: "neg"; e: Ast };

/**
 * A tiny, safe expression parser: numbers, [Field Name] references, + − × ÷
 * and brackets. Nothing is evaluated as code. Fields must exist and be
 * numeric — a formula on a text field is rejected when it's saved.
 */
export function parseFormula(src: string, fields: Pick<StudioField, "key" | "label" | "type">[]): { ok: true; ast: Ast; refs: string[] } | { ok: false; error: string } {
  const byLabel = new Map(fields.map((f) => [f.label.toLowerCase(), f]));
  const tokens: (string | { field: string })[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "[") {
      const end = src.indexOf("]", i);
      if (end < 0) return { ok: false, error: "A field name is missing its closing ]" };
      const name = src.slice(i + 1, end).trim();
      const f = byLabel.get(name.toLowerCase());
      if (!f) return { ok: false, error: `Unknown field [${name}]` };
      if (!isNumeric(f.type)) return { ok: false, error: `[${name}] isn't a number, so it can't be used in a formula` };
      tokens.push({ field: f.key });
      i = end + 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      tokens.push(src.slice(i, j));
      i = j;
      continue;
    }
    if ("+-*/()×÷".includes(ch)) {
      tokens.push(ch === "×" ? "*" : ch === "÷" ? "/" : ch);
      i++;
      continue;
    }
    return { ok: false, error: `Unexpected “${ch}” — use [Field names], numbers and + − × ÷ ( )` };
  }
  if (!tokens.length) return { ok: false, error: "The formula is empty" };
  let pos = 0;
  const refs: string[] = [];
  const peek = () => tokens[pos];
  function primary(): Ast {
    const tk = tokens[pos++];
    if (tk === undefined) throw new Error("The formula ends too early");
    if (typeof tk === "object") {
      refs.push(tk.field);
      return { t: "field", key: tk.field };
    }
    if (tk === "(") {
      const e = expr();
      if (tokens[pos++] !== ")") throw new Error("A bracket isn't closed");
      return e;
    }
    if (tk === "-") return { t: "neg", e: primary() };
    const n = Number(tk);
    if (Number.isNaN(n)) throw new Error(`“${tk}” isn't a number`);
    return { t: "num", v: n };
  }
  function term(): Ast {
    let l = primary();
    while (peek() === "*" || peek() === "/") {
      const op = tokens[pos++] as "*" | "/";
      l = { t: "op", op, l, r: primary() };
    }
    return l;
  }
  function expr(): Ast {
    let l = term();
    while (peek() === "+" || peek() === "-") {
      const op = tokens[pos++] as "+" | "-";
      l = { t: "op", op, l, r: term() };
    }
    return l;
  }
  try {
    const ast = expr();
    if (pos !== tokens.length) return { ok: false, error: "Two values need an operator between them" };
    return { ok: true, ast, refs };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** null for a division by zero — shown as 0, never Infinity. */
export function evalAst(a: Ast, get: (key: string) => number): number | null {
  switch (a.t) {
    case "num":
      return a.v;
    case "field":
      return get(a.key);
    case "neg": {
      const v = evalAst(a.e, get);
      return v === null ? null : -v;
    }
    case "op": {
      const l = evalAst(a.l, get);
      const r = evalAst(a.r, get);
      if (l === null || r === null) return null;
      if (a.op === "/") return r === 0 ? null : l / r;
      return a.op === "+" ? l + r : a.op === "-" ? l - r : l * r;
    }
  }
}

// ── Running a spec ──────────────────────────────────────────────────────────

/** "••••6624" — restricted values the viewer may not see. */
export const mask = (v: string | number) => {
  const s = String(v ?? "");
  return s ? `••••${s.slice(-4)}` : "";
};

export interface StudioResult {
  columns: { key: string; label: string; type: FieldType; masked: boolean }[];
  rows: (string | number)[][];
  /** Totals of numeric columns over every row in the result. */
  totals: (string | number)[];
  rowCount: number;
  /** Source rows after filtering (before grouping). */
  matched: number;
  /** Restricted fields shown masked for this viewer. */
  maskedFields: string[];
  grouped: boolean;
}

function test(v: string | number, f: StudioFilter, type: FieldType): boolean {
  const s = String(v ?? "").toLowerCase();
  const want = f.value.trim().toLowerCase();
  if (f.op === "empty") return s === "" || s === "—";
  if (f.op === "not_empty") return !(s === "" || s === "—");
  if (isNumeric(type) || ["gt", "gte", "lt", "lte"].includes(f.op)) {
    const a = Number(v);
    const b = Number(f.value);
    if (!Number.isNaN(a) && !Number.isNaN(b) && f.value.trim() !== "") {
      switch (f.op) {
        case "eq":
          return a === b;
        case "neq":
          return a !== b;
        case "gt":
          return a > b;
        case "gte":
          return a >= b;
        case "lt":
          return a < b;
        case "lte":
          return a <= b;
      }
    }
    if (["gt", "gte", "lt", "lte"].includes(f.op)) {
      // Dates and other comparable text compare as strings (ISO dates sort correctly).
      const c = s.localeCompare(want);
      return f.op === "gt" ? c > 0 : f.op === "gte" ? c >= 0 : f.op === "lt" ? c < 0 : c <= 0;
    }
  }
  switch (f.op) {
    case "eq":
      return s === want;
    case "neq":
      return s !== want;
    case "contains":
      return s.includes(want);
    default:
      return true;
  }
}

function aggregate(values: number[], how: Aggregate): number {
  if (how === "count") return values.length;
  if (!values.length) return 0;
  if (how === "min") return Math.min(...values);
  if (how === "max") return Math.max(...values);
  const sum = values.reduce((s, v) => s + v, 0);
  return Math.round((how === "avg" ? sum / values.length : sum) * 100) / 100;
}

export interface RunOpts {
  /** The viewer may see TINs, RSA PINs, NINs and BVNs. */
  canSeeIdentifiers: boolean;
  /** The viewer may see bank account numbers and holder names. */
  canSeeBank: boolean;
  /** Pay month of a row ("YYYY-MM"), for payroll datasets' month range. */
  monthOf?: (row: unknown) => string | undefined;
  limit?: number;
}

export function runSpec(spec: ReportSpec, sourceRows: unknown[], fields: StudioField[], opts: RunOpts): StudioResult {
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const hidden = (f?: StudioField) => !!f?.sensitive && (f.sensitive === "bank" ? !opts.canSeeBank : !opts.canSeeIdentifiers);
  // Filters
  const active = spec.filters.filter((f) => byKey.has(f.field) && (f.op === "empty" || f.op === "not_empty" || f.value.trim() !== ""));
  let rows = sourceRows.filter((r) => {
    if (opts.monthOf && (spec.monthFrom || spec.monthTo)) {
      const m = opts.monthOf(r);
      if (m && spec.monthFrom && m < spec.monthFrom) return false;
      if (m && spec.monthTo && m > spec.monthTo) return false;
    }
    if (!active.length) return true;
    // A restricted field can't be used to filter by someone who can't see it.
    const results = active.map((f) => (hidden(byKey.get(f.field)) ? true : test(byKey.get(f.field)!.value(r), f, byKey.get(f.field)!.type)));
    return spec.match === "any" ? results.some(Boolean) : results.every(Boolean);
  });
  const matched = rows.length;
  const cols = spec.columns.map((c) => byKey.get(c.key)).filter((f): f is StudioField => !!f);
  const columns = cols.map((f) => ({ key: f.key, label: spec.columns.find((c) => c.key === f.key)?.label || f.label, type: f.type, masked: hidden(f) }));
  const cell = (f: StudioField, r: unknown) => (hidden(f) ? mask(f.value(r)) : f.value(r));

  // Sort
  const sortField = spec.sort ? byKey.get(spec.sort.key) : undefined;
  if (sortField && !hidden(sortField)) {
    const dir = spec.sort!.dir === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      const x = sortField.value(a);
      const y = sortField.value(b);
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
    });
  }

  const totals = cols.map((f, i) => (i === 0 ? "Total" : isNumeric(f.type) && f.type !== "percent" ? Math.round(rows.reduce<number>((s, r) => s + (Number(f.value(r)) || 0), 0) * 100) / 100 : ""));

  const groupField = spec.groupBy ? byKey.get(spec.groupBy) : undefined;
  if (groupField && (spec.output !== "table" || spec.groupBy)) {
    const groups = new Map<string, unknown[]>();
    for (const r of rows) {
      const k = String(cell(groupField, r) || "—");
      groups.set(k, [...(groups.get(k) ?? []), r]);
    }
    const gCols = [{ key: groupField.key, label: groupField.label, type: groupField.type, masked: hidden(groupField) }, { key: "__count", label: "Records", type: "number" as FieldType, masked: false }, ...columns.filter((c) => c.key !== groupField.key && isNumeric(c.type))];
    let out = [...groups.entries()].map(([k, rs]) => [
      k,
      rs.length,
      ...gCols.slice(2).map((c) => aggregate(rs.map((r) => Number(byKey.get(c.key)!.value(r)) || 0), spec.aggregates?.[c.key] ?? (c.type === "percent" ? "avg" : "sum"))),
    ]);
    if (sortField && !hidden(sortField)) {
      const idx = gCols.findIndex((c) => c.key === sortField.key);
      if (idx >= 0) out = out.sort((a, b) => ((a[idx] as number) > (b[idx] as number) ? 1 : -1) * (spec.sort!.dir === "asc" ? 1 : -1));
    } else out = out.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    const gTotals = gCols.map((c, i) => (i === 0 ? "Total" : i === 1 ? rows.length : c.type === "percent" ? "" : Math.round(out.reduce((s, r) => s + (Number(r[i]) || 0), 0) * 100) / 100));
    return { columns: gCols.map((c, i) => (i >= 2 ? { ...c, label: `${(spec.aggregates?.[c.key] ?? (c.type === "percent" ? "avg" : "sum")).toUpperCase()} · ${c.label}` } : c)), rows: out, totals: gTotals, rowCount: out.length, matched, maskedFields: columns.filter((c) => c.masked).map((c) => c.label), grouped: true };
  }

  const data = (opts.limit ? rows.slice(0, opts.limit) : rows).map((r) => cols.map((f) => cell(f, r)));
  return { columns, rows: data, totals, rowCount: rows.length, matched, maskedFields: columns.filter((c) => c.masked).map((c) => c.label), grouped: false };
}

/** The next delivery date of a schedule, from `from`. */
export function nextRunOf(frequency: Frequency, from = new Date()): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  if (frequency === "daily") d.setUTCDate(d.getUTCDate() + 1);
  if (frequency === "weekly") d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
  if (frequency === "monthly") d.setUTCMonth(d.getUTCMonth() + 1, 1);
  if (frequency === "quarterly") d.setUTCMonth(Math.floor(d.getUTCMonth() / 3) * 3 + 3, 1);
  return d.toISOString().slice(0, 10);
}

/** Starting points shipped with MOTEE — copied into a new report, never edited in place. */
export const STARTER_TEMPLATES: Omit<ReportSpec, "id" | "owner" | "createdAt" | "updatedAt">[] = [
  {
    name: "Pension schedule by PFA",
    description: "Employee, employer and voluntary contributions grouped by Pension Fund Administrator.",
    datasetId: "pd-pension",
    columns: [{ key: "pfa" }, { key: "eePension" }, { key: "erPension" }, { key: "avc" }, { key: "totalPension" }],
    filters: [],
    match: "all",
    groupBy: "pfa",
    calculated: [],
    output: "summary",
    status: "active",
    template: true,
  },
  {
    name: "PAYE by tax authority",
    description: "Taxable income and PAYE per State IRS.",
    datasetId: "pd-tax",
    columns: [{ key: "taxAuthority" }, { key: "taxableIncome" }, { key: "monthlyPaye" }],
    filters: [],
    match: "all",
    groupBy: "taxAuthority",
    calculated: [],
    output: "chart",
    chartMeasure: "monthlyPaye",
    status: "active",
    template: true,
  },
  {
    name: "Cost to company by cost centre",
    description: "Gross, every employer contribution and CTC per cost centre, with deductions as a share of gross.",
    datasetId: "pd-finance",
    columns: [{ key: "ccCode" }, { key: "grossCost" }, { key: "erPensionCost" }, { key: "nsitfCost" }, { key: "itfCost" }, { key: "groupLifeCost" }, { key: "ctc" }],
    filters: [],
    match: "all",
    groupBy: "ccCode",
    calculated: [],
    output: "summary",
    status: "active",
    template: true,
  },
  {
    name: "Unexplained variances",
    description: "Every employee whose month-on-month movement the system couldn't explain.",
    datasetId: "pd-results",
    columns: [{ key: "period" }, { key: "employeeNumber" }, { key: "name" }, { key: "prevGross" }, { key: "curGross" }, { key: "grossVar" }, { key: "varPct" }, { key: "varReason" }, { key: "varConfidence" }],
    filters: [{ field: "varConfidence", op: "neq", value: "Confirmed" }],
    match: "all",
    calculated: [],
    output: "table",
    sort: { key: "grossVar", dir: "asc" },
    status: "active",
    template: true,
  },
  {
    name: "Deductions as a share of gross",
    description: "A calculated field example: total deductions ÷ gross × 100.",
    datasetId: "pd-earnings",
    columns: [{ key: "period" }, { key: "employeeNumber" }, { key: "name" }, { key: "gross" }, { key: "totalDeductions" }, { key: "calc:dedShare", label: "Deductions % of gross" }],
    filters: [],
    match: "all",
    calculated: [{ key: "calc:dedShare", label: "Deductions % of gross", formula: "[Total Employee Deductions] / [Gross Pay] * 100", type: "percent" }],
    output: "table",
    status: "active",
    template: true,
  },
];
