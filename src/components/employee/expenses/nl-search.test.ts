import { describe, expect, it } from "vitest";
import { parseExpenseQuery } from "./nl-search";
import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";

/** Fixed "now" so "last month" / "this month" are deterministic. */
const NOW = new Date("2026-08-14T00:00:00Z");

function claim(over: Partial<ExpenseClaim> = {}): ExpenseClaim {
  return {
    id: "e1",
    title: "Taxi to Heathrow",
    category: "travel",
    amount: 120,
    currency: "GBP",
    dateSubmitted: "2026-08-02",
    status: "submitted",
    merchant: "Uber",
    ...over,
  };
}

function matches(query: string, c: ExpenseClaim, merchants: string[] = []) {
  return parseExpenseQuery(query, merchants, NOW).test(c);
}

describe("amounts", () => {
  it("parses 'over N'", () => {
    expect(matches("over 100", claim({ amount: 120 }))).toBe(true);
    expect(matches("over 100", claim({ amount: 80 }))).toBe(false);
  });

  it("parses 'under N' with a currency symbol", () => {
    expect(matches("under £50", claim({ amount: 30 }))).toBe(true);
    expect(matches("under £50", claim({ amount: 70 }))).toBe(false);
  });

  it("parses a 'between X and Y' range", () => {
    expect(matches("between 100 and 200", claim({ amount: 150 }))).toBe(true);
    expect(matches("between 100 and 200", claim({ amount: 250 }))).toBe(false);
  });

  it("does not read a range's lower bound as a standalone 'over'", () => {
    const parsed = parseExpenseQuery("between 100 and 200", [], NOW);
    expect(parsed.terms.filter((t) => t.kind === "amount")).toHaveLength(1);
  });

  it("handles thousands separators", () => {
    expect(matches("over 1,000", claim({ amount: 1500 }))).toBe(true);
  });
});

describe("categories", () => {
  it("matches a category by its own name", () => {
    expect(matches("travel", claim({ category: "travel" }))).toBe(true);
    expect(matches("travel", claim({ category: "meals" }))).toBe(false);
  });

  it("maps synonyms onto the right category", () => {
    expect(matches("hotel", claim({ category: "accommodation" }))).toBe(true);
    expect(matches("lunch", claim({ category: "meals" }))).toBe(true);
    expect(matches("subscription", claim({ category: "software" }))).toBe(true);
  });
});

describe("dates", () => {
  it("parses 'last month' relative to now", () => {
    expect(matches("last month", claim({ dateSubmitted: "2026-07-09" }))).toBe(
      true,
    );
    expect(matches("last month", claim({ dateSubmitted: "2026-08-09" }))).toBe(
      false,
    );
  });

  it("parses 'this month'", () => {
    expect(matches("this month", claim({ dateSubmitted: "2026-08-02" }))).toBe(
      true,
    );
  });

  it("parses a named month", () => {
    expect(matches("in March", claim({ dateSubmitted: "2026-03-11" }))).toBe(
      true,
    );
    expect(matches("in March", claim({ dateSubmitted: "2026-04-11" }))).toBe(
      false,
    );
  });

  it("parses a bare year", () => {
    expect(matches("2025", claim({ dateSubmitted: "2025-02-01" }))).toBe(true);
    expect(matches("2025", claim({ dateSubmitted: "2026-02-01" }))).toBe(false);
  });
});

describe("status", () => {
  it("matches a status by name and by synonym", () => {
    expect(matches("rejected", claim({ status: "rejected" }))).toBe(true);
    expect(matches("pending", claim({ status: "submitted" }))).toBe(true);
    expect(matches("paid", claim({ status: "reimbursed" }))).toBe(true);
  });
});

describe("merchants and free text", () => {
  it("matches a known merchant exactly", () => {
    expect(matches("uber", claim({ merchant: "Uber" }), ["Uber"])).toBe(true);
  });

  it("falls back to substring search over title, merchant and notes", () => {
    expect(
      matches("heathrow", claim({ title: "Taxi to Heathrow" })),
    ).toBe(true);
    expect(matches("heathrow", claim({ title: "Client lunch" }))).toBe(false);
  });

  it("strips filler words rather than searching for them", () => {
    const parsed = parseExpenseQuery("show me all my expenses", [], NOW);
    expect(parsed.empty).toBe(true);
  });
});

describe("combined queries", () => {
  it("ANDs every understood term", () => {
    const q = "travel over 100 last month";
    expect(
      matches(q, claim({ category: "travel", amount: 150, dateSubmitted: "2026-07-04" })),
    ).toBe(true);
    // Right category and amount, wrong month.
    expect(
      matches(q, claim({ category: "travel", amount: 150, dateSubmitted: "2026-08-04" })),
    ).toBe(false);
    // Right month and amount, wrong category.
    expect(
      matches(q, claim({ category: "meals", amount: 150, dateSubmitted: "2026-07-04" })),
    ).toBe(false);
  });

  it("exposes each understood term for the chips, with its source text", () => {
    const parsed = parseExpenseQuery("travel over 500 last month", [], NOW);
    expect(parsed.terms.map((t) => t.kind).sort()).toEqual([
      "amount",
      "category",
      "date",
    ]);
    // The chip's remove button strips `source` from the raw query, so it has
    // to be a substring of what the user typed.
    for (const term of parsed.terms) {
      expect("travel over 500 last month").toContain(term.source);
    }
  });

  it("reports an unparseable query as empty so the caller can fall back", () => {
    expect(parseExpenseQuery("", [], NOW).empty).toBe(true);
  });
});
