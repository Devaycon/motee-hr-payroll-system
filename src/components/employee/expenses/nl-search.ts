/**
 * §8.8 — natural-language expense search.
 *
 * "Show me travel over £500 last month" is how people actually describe what
 * they are looking for. This parses that into a predicate over the claim list.
 *
 * It is a deliberately small grammar rather than a model: the query space is
 * narrow (category, amount, date, status, merchant), and a parser that is
 * wrong in predictable ways can be *shown* to the user and corrected. The
 * caller renders the parsed terms as removable chips for exactly that reason —
 * a search that silently returns nothing is the failure worth designing out.
 */
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
  type ExpenseClaim,
  type ExpenseStatus,
} from "@/src/data/employee-expenses-demo";

export type ParsedTermKind =
  | "category"
  | "amount"
  | "date"
  | "status"
  | "text";

export interface ParsedTerm {
  kind: ParsedTermKind;
  /** Chip text, e.g. "over £500" or "Travel". */
  label: string;
  /** The slice of the raw query this came from, so it can be removed. */
  source: string;
  test: (claim: ExpenseClaim) => boolean;
}

export interface ParsedQuery {
  terms: ParsedTerm[];
  /** True when nothing was understood and the caller should fall back. */
  empty: boolean;
  test: (claim: ExpenseClaim) => boolean;
}

/**
 * Words people use that aren't the category's official label. Kept explicit
 * rather than fuzzy-matched — "hotel" meaning accommodation is a fact about
 * English, not something worth inferring at runtime.
 */
const CATEGORY_SYNONYMS: Record<string, ExpenseCategory> = {
  travel: "travel",
  trip: "travel",
  flight: "travel",
  flights: "travel",
  train: "travel",
  taxi: "travel",
  mileage: "travel",
  fuel: "travel",
  meal: "meals",
  meals: "meals",
  food: "meals",
  lunch: "meals",
  dinner: "meals",
  entertainment: "meals",
  hotel: "accommodation",
  hotels: "accommodation",
  accommodation: "accommodation",
  lodging: "accommodation",
  stay: "accommodation",
  equipment: "equipment",
  hardware: "equipment",
  laptop: "equipment",
  kit: "equipment",
  software: "software",
  subscription: "software",
  subscriptions: "software",
  saas: "software",
  licence: "software",
  license: "software",
  training: "training",
  course: "training",
  courses: "training",
  conference: "training",
  other: "other",
  misc: "other",
};

const STATUS_SYNONYMS: Record<string, ExpenseStatus> = {
  draft: "draft",
  drafts: "draft",
  submitted: "submitted",
  pending: "submitted",
  awaiting: "submitted",
  approved: "approved",
  rejected: "rejected",
  declined: "rejected",
  refused: "rejected",
  reimbursed: "reimbursed",
  paid: "reimbursed",
  unpaid: "approved",
};

function claimMonth(claim: ExpenseClaim): string {
  return (claim.dateSubmitted ?? "").slice(0, 7);
}

function monthOffset(base: Date, months: number): string {
  const d = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + months, 1),
  );
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** Which quarter (1-4) a YYYY-MM belongs to. */
function quarterOf(ym: string): number {
  return Math.floor((Number(ym.slice(5, 7)) - 1) / 3) + 1;
}

/**
 * Parse a free-text query. Terms are ANDed: "travel over 500 last month"
 * means all three, which is what the phrasing implies.
 */
export function parseExpenseQuery(
  raw: string,
  knownMerchants: string[] = [],
  now: Date = new Date(),
): ParsedQuery {
  const terms: ParsedTerm[] = [];
  let rest = ` ${raw.toLowerCase()} `;

  /** Consume a matched phrase so it can't also be read as free text. */
  function consume(match: string) {
    rest = rest.replace(match, " ");
  }

  // ── Amounts. Ranges first, so "between 100 and 200" isn't read as "100". ──
  const between = /between\s*[£$€]?\s*(\d[\d,.]*)\s*(?:and|-|to)\s*[£$€]?\s*(\d[\d,.]*)/.exec(
    rest,
  );
  if (between) {
    const lo = Number(between[1].replace(/,/g, ""));
    const hi = Number(between[2].replace(/,/g, ""));
    if (Number.isFinite(lo) && Number.isFinite(hi)) {
      terms.push({
        kind: "amount",
        label: `between ${lo} and ${hi}`,
        source: between[0],
        test: (c) => c.amount >= Math.min(lo, hi) && c.amount <= Math.max(lo, hi),
      });
      consume(between[0]);
    }
  } else {
    const over = /(?:over|above|more than|greater than|>)\s*[£$€]?\s*(\d[\d,.]*)/.exec(
      rest,
    );
    if (over) {
      const n = Number(over[1].replace(/,/g, ""));
      if (Number.isFinite(n)) {
        terms.push({
          kind: "amount",
          label: `over ${n}`,
          source: over[0],
          test: (c) => c.amount > n,
        });
        consume(over[0]);
      }
    }
    const under = /(?:under|below|less than|cheaper than|<)\s*[£$€]?\s*(\d[\d,.]*)/.exec(
      rest,
    );
    if (under) {
      const n = Number(under[1].replace(/,/g, ""));
      if (Number.isFinite(n)) {
        terms.push({
          kind: "amount",
          label: `under ${n}`,
          source: under[0],
          test: (c) => c.amount < n,
        });
        consume(under[0]);
      }
    }
  }

  // ── Dates ────────────────────────────────────────────────────────────────
  const thisMonth = monthOffset(now, 0);
  const lastMonth = monthOffset(now, -1);

  if (/\blast month\b/.test(rest)) {
    terms.push({
      kind: "date",
      label: "last month",
      source: "last month",
      test: (c) => claimMonth(c) === lastMonth,
    });
    consume("last month");
  } else if (/\bthis month\b/.test(rest)) {
    terms.push({
      kind: "date",
      label: "this month",
      source: "this month",
      test: (c) => claimMonth(c) === thisMonth,
    });
    consume("this month");
  }

  if (/\bthis quarter\b/.test(rest)) {
    const q = quarterOf(thisMonth);
    const year = thisMonth.slice(0, 4);
    terms.push({
      kind: "date",
      label: "this quarter",
      source: "this quarter",
      test: (c) => {
        const m = claimMonth(c);
        return m.slice(0, 4) === year && quarterOf(m) === q;
      },
    });
    consume("this quarter");
  }

  // "in March" / "march"
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const name = MONTH_NAMES[i];
    const pattern = new RegExp(`\\b(?:in\\s+)?${name}\\b`);
    const hit = pattern.exec(rest);
    if (!hit) continue;
    const mm = String(i + 1).padStart(2, "0");
    terms.push({
      kind: "date",
      label: name[0].toUpperCase() + name.slice(1),
      source: hit[0],
      test: (c) => claimMonth(c).slice(5, 7) === mm,
    });
    consume(hit[0]);
    break;
  }

  // A bare 4-digit year.
  const year = /\b(20\d{2})\b/.exec(rest);
  if (year) {
    const y = year[1];
    terms.push({
      kind: "date",
      label: y,
      source: year[0],
      test: (c) => (c.dateSubmitted ?? "").startsWith(y),
    });
    consume(year[0]);
  }

  // ── Category ─────────────────────────────────────────────────────────────
  for (const [word, category] of Object.entries(CATEGORY_SYNONYMS)) {
    const pattern = new RegExp(`\\b${word}\\b`);
    if (!pattern.test(rest)) continue;
    terms.push({
      kind: "category",
      label: EXPENSE_CATEGORY_LABELS[category],
      source: word,
      test: (c) => c.category === category,
    });
    consume(word);
    break;
  }

  // ── Status ───────────────────────────────────────────────────────────────
  for (const [word, status] of Object.entries(STATUS_SYNONYMS)) {
    const pattern = new RegExp(`\\b${word}\\b`);
    if (!pattern.test(rest)) continue;
    terms.push({
      kind: "status",
      label: word === "unpaid" ? "unpaid" : status,
      source: word,
      test: (c) => c.status === status,
    });
    consume(word);
    break;
  }

  // ── Merchant, from whatever is left ─────────────────────────────────────
  const leftover = rest
    .replace(/\b(show|me|all|my|expenses?|claims?|from|at|for|the|of|on|in|and)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (leftover) {
    const merchant = knownMerchants.find((m) =>
      m.toLowerCase().includes(leftover),
    );
    if (merchant) {
      terms.push({
        kind: "text",
        label: merchant,
        source: leftover,
        test: (c) => c.merchant.toLowerCase() === merchant.toLowerCase(),
      });
    } else {
      // Not a known merchant — treat it as a plain substring over the fields a
      // person would expect to be searching.
      terms.push({
        kind: "text",
        label: `"${leftover}"`,
        source: leftover,
        test: (c) =>
          `${c.title} ${c.merchant} ${c.notes ?? ""}`
            .toLowerCase()
            .includes(leftover),
      });
    }
  }

  return {
    terms,
    empty: terms.length === 0,
    test: (claim) => terms.every((t) => t.test(claim)),
  };
}
