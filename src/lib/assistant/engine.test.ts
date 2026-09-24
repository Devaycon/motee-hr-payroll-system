import { describe, expect, it } from "vitest";
import uk from "@/src/data/locale/uk.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { answerQuestion, type AssistantContext } from "./engine";

const bundle = uk as unknown as LocaleBundle;
const me = bundle.employees.find((e) => e.status === "active" && e.managerId)!;

const ctx = (portal: AssistantContext["portal"]): AssistantContext => ({
  bundle,
  edits: { added: {}, edits: {}, removed: {} },
  requests: [],
  portal,
  me: { employeeId: me.id, name: me.fullName },
  country: "uk",
  formatMoney: (n) => `£${n.toFixed(2)}`,
});

describe("HR assistant", () => {
  it('answers "How many leave days do I have left?" from the employee\'s own balance', () => {
    const a = answerQuestion("How many leave days do I have left?", ctx("employee"));
    expect(a.text).toMatch(/^You have \d+ days? of .+ left/);
    expect(a.rows?.length).toBeGreaterThan(0);
  });

  it('ranks "top-performing sales staff this quarter" within the named department', () => {
    const a = answerQuestion("Who are the top-performing sales staff this quarter?", ctx("hr"));
    expect(a.text).toMatch(/^Top performers in Sales & Partnerships/);
    expect(a.rows?.length).toBeGreaterThan(0);
    for (const row of a.rows ?? []) expect(row.href).toMatch(/^\/organization\/employees\//);
  });

  it("keeps organisation-wide questions out of the employee portal", () => {
    const a = answerQuestion("Who are the top performers?", ctx("employee"));
    expect(a.text).toMatch(/only answer questions about your own record/);
  });

  it("finds people qualified in a skill", () => {
    const a = answerQuestion("Who is qualified in leadership?", ctx("hr"));
    expect(a.rows?.length).toBeGreaterThan(0);
  });

  it("lists certifications due for renewal in the requested window", () => {
    const a = answerQuestion("Which certifications need renewal next month?", ctx("hr"));
    expect(a.text).toMatch(/next 30 days|Nothing expires/);
  });

  it("summarises the loan book and department compliance risk", () => {
    expect(answerQuestion("How much is outstanding on staff loans?", ctx("hr")).text).toMatch(/active loan/);
    expect(answerQuestion("Which departments have compliance risks?", ctx("hr")).text).toMatch(
      /Mandatory training is \d+% complete/,
    );
  });

  it("falls back to suggestions for anything it doesn't understand", () => {
    const a = answerQuestion("What's the weather like?", ctx("hr"));
    expect(a.text).toMatch(/didn't catch that/);
    expect(a.rows?.length).toBeGreaterThan(3);
  });
});
