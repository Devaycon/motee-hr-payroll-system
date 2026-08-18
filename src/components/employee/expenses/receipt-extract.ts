/**
 * §9.15 — pulling claim details out of a receipt.
 *
 * IMPORTANT: this is *not* image OCR. Reading a photographed receipt needs a
 * vision service this project does not have, and pretending otherwise would
 * ship a feature that silently fails on the only input users would try. What
 * this does is parse receipt *text* — pasted from an email receipt, a PDF
 * selection, or the output of a real OCR engine if one is added later.
 *
 * The function signature is the seam: swap in a provider that returns text
 * from an image, and everything downstream keeps working.
 */
import type {
  ExpenseCategory,
  ExpenseClaim,
} from "@/src/data/employee-expenses-demo";

export interface ExtractedReceipt {
  merchant?: string;
  amount?: number;
  currency?: string;
  dateSubmitted?: string;
  category?: ExpenseCategory;
  /** Fields we could not find, so the UI can say what still needs typing. */
  missing: string[];
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  "£": "GBP",
  $: "USD",
  "€": "EUR",
  "₦": "NGN",
  R: "ZAR",
};

/** Lines that mean "this is the total", strongest signal first. */
const TOTAL_HINTS = [
  /(?:grand\s+)?total\s*(?:due|paid|amount)?\s*[:\-]?\s*([£$€₦R]?)\s*([\d,]+\.\d{2})/i,
  /amount\s*(?:paid|due)?\s*[:\-]?\s*([£$€₦R]?)\s*([\d,]+\.\d{2})/i,
  /balance\s*(?:due)?\s*[:\-]?\s*([£$€₦R]?)\s*([\d,]+\.\d{2})/i,
];

/** Keyword → category, for a sensible default the user can override. */
const CATEGORY_HINTS: [RegExp, ExpenseCategory][] = [
  [/hotel|inn|lodge|airbnb|booking\.com|premier\s?inn|travelodge/i, "accommodation"],
  [/airline|airways|flight|rail|train|taxi|uber|bolt|parking|fuel|petrol|shell|bp\b/i, "travel"],
  [/restaurant|cafe|coffee|bar\b|grill|pizza|deli|catering|starbucks|pret/i, "meals"],
  [/software|saas|subscription|licen[cs]e|adobe|microsoft|google|slack|zoom/i, "software"],
  [/course|training|conference|workshop|seminar/i, "training"],
  [/laptop|monitor|keyboard|hardware|electronics|currys|apple\s+store/i, "equipment"],
];

function parseAmount(raw: string): number | undefined {
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Normalise the date formats that actually turn up on receipts to ISO. */
function parseDate(text: string): string | undefined {
  // 2026-08-14
  const iso = /\b(20\d{2})-(\d{2})-(\d{2})\b/.exec(text);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // 14/08/2026 or 14-08-26 — day-first, which is the UK/EU convention this
  // tenant base uses. A US-format receipt will parse wrong; the user sees the
  // pre-filled date and can correct it, which is why nothing auto-submits.
  const dmy = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/.exec(text);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    if (Number(month) >= 1 && Number(month) <= 12) {
      return `${year}-${month}-${day}`;
    }
  }

  // 14 Aug 2026
  const named =
    /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(20\d{2})\b/i.exec(
      text,
    );
  if (named) {
    const months = [
      "jan", "feb", "mar", "apr", "may", "jun",
      "jul", "aug", "sep", "oct", "nov", "dec",
    ];
    const idx = months.indexOf(named[2].toLowerCase());
    if (idx >= 0) {
      return `${named[3]}-${String(idx + 1).padStart(2, "0")}-${named[1].padStart(2, "0")}`;
    }
  }

  return undefined;
}

/**
 * Best-effort extraction from receipt text. Everything is a suggestion — the
 * caller pre-fills the form and the user confirms, so a wrong guess costs an
 * edit rather than a bad claim.
 */
export function extractFromText(text: string): ExtractedReceipt {
  const result: ExtractedReceipt = { missing: [] };
  if (!text.trim()) {
    return { missing: ["merchant", "amount", "date"] };
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // ── Amount ───────────────────────────────────────────────────────────────
  for (const pattern of TOTAL_HINTS) {
    const hit = pattern.exec(text);
    if (!hit) continue;
    const amount = parseAmount(hit[2]);
    if (amount == null) continue;
    result.amount = amount;
    if (hit[1] && CURRENCY_SYMBOLS[hit[1]]) {
      result.currency = CURRENCY_SYMBOLS[hit[1]];
    }
    break;
  }
  // No "total" line — fall back to the largest money-looking figure, which on
  // a receipt is almost always the total.
  if (result.amount == null) {
    const figures = [...text.matchAll(/([£$€₦R]?)\s*([\d,]+\.\d{2})/g)]
      .map((m) => ({ symbol: m[1], value: parseAmount(m[2]) }))
      .filter((f): f is { symbol: string; value: number } => f.value != null);
    if (figures.length > 0) {
      const largest = figures.reduce((a, b) => (a.value > b.value ? a : b));
      result.amount = largest.value;
      if (largest.symbol && CURRENCY_SYMBOLS[largest.symbol]) {
        result.currency = CURRENCY_SYMBOLS[largest.symbol];
      }
    }
  }

  // ── Merchant: the first line that isn't a number, date or boilerplate. ───
  const merchantLine = lines.find(
    (l) =>
      l.length > 2 &&
      l.length < 60 &&
      !/^\d/.test(l) &&
      !/receipt|invoice|vat|tax|thank you|order|customer/i.test(l),
  );
  if (merchantLine) {
    result.merchant = merchantLine.replace(/[*_#]+/g, "").trim();
  }

  // ── Date ─────────────────────────────────────────────────────────────────
  result.dateSubmitted = parseDate(text);

  // ── Category, guessed from the merchant/body. ───────────────────────────
  for (const [pattern, category] of CATEGORY_HINTS) {
    if (pattern.test(text)) {
      result.category = category;
      break;
    }
  }

  if (!result.merchant) result.missing.push("merchant");
  if (result.amount == null) result.missing.push("amount");
  if (!result.dateSubmitted) result.missing.push("date");

  return result;
}

/** Shape the extraction as a claim patch the form can spread in. */
export function toClaimPatch(
  extracted: ExtractedReceipt,
): Partial<ExpenseClaim> {
  const patch: Partial<ExpenseClaim> = {};
  if (extracted.merchant) patch.merchant = extracted.merchant;
  if (extracted.amount != null) patch.amount = extracted.amount;
  if (extracted.currency) patch.currency = extracted.currency;
  if (extracted.dateSubmitted) patch.dateSubmitted = extracted.dateSubmitted;
  if (extracted.category) patch.category = extracted.category;
  return patch;
}
