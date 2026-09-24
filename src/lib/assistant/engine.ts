import { applyCollection } from "@/src/lib/profile/collection-edits";
import type { CollectionEditsState } from "@/src/lib/stores/collection-edits-slice";
import type { ApprovalRequest } from "@/src/lib/types/approvals";
import type { LocaleBundle, LocaleEmployee, LocaleLoan } from "@/src/lib/types/locale";
import { activeLeaveFromBundle } from "@/src/lib/utils/active-leave";
import {
  certStatus,
  daysToExpiry,
  type CertificationRecord,
} from "@/src/lib/certifications/status";
import { mandatoryCompliance } from "@/src/lib/learning/mandatory-compliance";
import { loanTypeLabel, nextInstalment, outstandingBalance, summariseLoans, withApproval } from "@/src/lib/loans/loans";
import { profileCompletion, COMPLETION_TARGET } from "@/src/lib/profile/completion";
import { proficiencyLabel, skillGap, toLevel } from "@/src/lib/skills/proficiency";

/**
 * MOTEE HR Assistant — answers everyday HR questions from the tenant's own
 * records. Deterministic intent matching over the same data every screen
 * reads, so an answer can always be traced back to (and linked to) the module
 * that owns it. No data leaves the app.
 */

export type AssistantPortal = "hr" | "employee";

export interface AssistantContext {
  bundle: LocaleBundle;
  edits: Pick<CollectionEditsState, "added" | "edits" | "removed">;
  requests: ApprovalRequest[];
  portal: AssistantPortal;
  me: { employeeId?: string; name?: string };
  country: "ng" | "uk";
  formatMoney: (n: number) => string;
  today?: Date;
}

export interface AnswerRow {
  label: string;
  value: string;
  href?: string;
}

export interface AssistantAnswer {
  text: string;
  rows?: AnswerRow[];
  links?: { label: string; href: string }[];
}

export const EMPLOYEE_SUGGESTIONS = [
  "How many leave days do I have left?",
  "What is my loan balance?",
  "Are any of my certifications expiring?",
  "What's missing from my profile?",
  "Who is my manager?",
];

export const HR_SUGGESTIONS = [
  "Who are the top-performing sales staff this quarter?",
  "Which certifications need renewal next month?",
  "Which departments have compliance risks?",
  "Who is qualified in project management?",
  "Who is on leave today?",
  "How much is outstanding on staff loans?",
];

const profileHref = (id: string, module?: string) =>
  `/organization/employees/${id}${module ? `?module=${module}` : ""}`;

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// ── data access ─────────────────────────────────────────────────────────────
function current(b: LocaleBundle): LocaleEmployee[] {
  return b.employees.filter((e) => e.status !== "terminated");
}

function certifications(ctx: AssistantContext): CertificationRecord[] {
  const learn = ctx.bundle.learning as { certifications?: CertificationRecord[] };
  return applyCollection(learn.certifications ?? [], "learning.certifications", ctx.edits);
}

function loans(ctx: AssistantContext): LocaleLoan[] {
  const byDoc = new Map(
    ctx.requests.filter((r) => r.documentType === "loan_request").map((r) => [r.documentId, r]),
  );
  return applyCollection(ctx.bundle.loans ?? [], "loans", ctx.edits).map((l) =>
    withApproval(l, byDoc.get(l.id)),
  );
}

/** "sales" → "Sales & Partnerships"; null when no department is named. */
function departmentIn(q: string, b: LocaleBundle): string | null {
  const names = [...new Set(b.employees.map((e) => e.departmentName))];
  for (const name of names) {
    const words = name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2 && w !== "and");
    if (words.some((w) => new RegExp(`\\b${w}`).test(q))) return name;
  }
  return null;
}

// ── self-service intents ────────────────────────────────────────────────────
function myLeave(ctx: AssistantContext): AssistantAnswer {
  const id = ctx.me.employeeId;
  const policies = new Map(
    (ctx.bundle.leavePolicies as { id: string; name: string }[]).map((p) => [p.id, p.name]),
  );
  const rows = (ctx.bundle.leaveBalances as {
    employeeId: string;
    leavePolicyId: string;
    entitlement: number;
    used: number;
    remaining: number;
  }[]).filter((r) => r.employeeId === id);
  if (!rows.length) return { text: "I couldn't find any leave balances on your record." };
  const annual = rows.find((r) => /annual/i.test(policies.get(r.leavePolicyId) ?? "")) ?? rows[0];
  return {
    text: `You have ${plural(annual.remaining, "day")} of ${policies.get(annual.leavePolicyId) ?? "leave"} left — ${annual.used} used of ${annual.entitlement}.`,
    rows: rows.map((r) => ({
      label: policies.get(r.leavePolicyId) ?? r.leavePolicyId,
      value: `${r.remaining} of ${r.entitlement} days left`,
    })),
    links: [
      { label: "Request leave", href: "/time-off/request" },
      { label: "My leave", href: "/time-off/balance" },
    ],
  };
}

function myLoans(ctx: AssistantContext): AssistantAnswer {
  const mine = loans(ctx).filter((l) => l.employeeId === ctx.me.employeeId);
  if (!mine.length) {
    return {
      text: "You have no staff loans or salary advances on record.",
      links: [{ label: "Apply for a loan", href: "/employee/loans" }],
    };
  }
  const outstanding = mine.reduce((s, l) => s + outstandingBalance(l), 0);
  const next = mine
    .filter((l) => l.status === "active")
    .map((l) => nextInstalment(l, ctx.today))
    .filter((i): i is NonNullable<typeof i> => !!i)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  return {
    text:
      `Your outstanding loan balance is ${ctx.formatMoney(outstanding)}.` +
      (next ? ` Your next instalment of ${ctx.formatMoney(next.amount)} is due ${next.dueDate}.` : ""),
    rows: mine.map((l) => ({
      label: `${loanTypeLabel(l.loanType)} · ${l.status}`,
      value: `${ctx.formatMoney(outstandingBalance(l))} outstanding of ${ctx.formatMoney(l.amount)}`,
      href: `/employee/loans/${l.id}`,
    })),
    links: [{ label: "My loans", href: "/employee/loans" }],
  };
}

function myCerts(ctx: AssistantContext): AssistantAnswer {
  const mine = certifications(ctx).filter((c) => c.employeeId === ctx.me.employeeId);
  if (!mine.length) return { text: "You have no certifications on record yet." };
  const attention = mine.filter((c) => {
    const s = certStatus(c.expiresAt, ctx.today);
    return s === "expired" || s === "expiring_30" || s === "expiring_60";
  });
  return {
    text: attention.length
      ? `${plural(attention.length, "certification")} need${attention.length === 1 ? "s" : ""} attention.`
      : `All ${plural(mine.length, "certification")} are valid for at least the next 60 days.`,
    rows: (attention.length ? attention : mine).map((c) => {
      const d = daysToExpiry(c.expiresAt, ctx.today);
      return {
        label: `${c.title.replace(/ - Certificate$/, "")}${c.issuingBody ? ` (${c.issuingBody})` : ""}`,
        value: d == null ? "No expiry" : d < 0 ? `Expired ${-d} days ago` : `Expires in ${d} days`,
      };
    }),
  };
}

function myProfile(ctx: AssistantContext): AssistantAnswer {
  const emp = ctx.bundle.employees.find((e) => e.id === ctx.me.employeeId);
  if (!emp) return { text: "I couldn't find your employee record." };
  const count = (rows: { employeeId?: string }[] | undefined, key: string) =>
    applyCollection(rows ?? [], key, ctx.edits).filter((r) => r.employeeId === emp.id).length;
  const docs = applyCollection(
    ctx.bundle.documents as { employeeId?: string; category?: string; name?: string; status?: string }[],
    "documents",
    ctx.edits,
  ).filter((d) => d.employeeId === emp.id);
  const r = profileCompletion({
    employee: emp,
    country: ctx.country,
    documents: docs,
    educationCount: count(ctx.bundle.education, "education"),
    membershipCount: count(ctx.bundle.professionalMemberships, "professionalMemberships"),
    skillCount: count(ctx.bundle.employeeSkills, "employeeSkills"),
    languageCount: count(ctx.bundle.employeeLanguages, "employeeLanguages"),
  });
  return {
    text: r.missing.length
      ? `Your profile is ${r.score}% complete. Still missing: ${r.missing.map((m) => m.label).join(", ")}.`
      : "Your profile is 100% complete — nothing missing.",
    links: [{ label: "Open my profile", href: "/profile/my-profile" }],
  };
}

function myManager(ctx: AssistantContext): AssistantAnswer {
  const emp = ctx.bundle.employees.find((e) => e.id === ctx.me.employeeId);
  const mgr = emp?.managerId ? ctx.bundle.employees.find((e) => e.id === emp.managerId) : null;
  return mgr
    ? { text: `Your line manager is ${mgr.fullName}, ${mgr.jobTitle}.` }
    : { text: "You don't have a line manager recorded." };
}

function myRequests(ctx: AssistantContext): AssistantAnswer {
  const open = ctx.requests.filter(
    (r) => r.submittedBy.employeeId === ctx.me.employeeId && (r.status === "in_progress" || r.status === "returned"),
  );
  return {
    text: open.length
      ? `You have ${plural(open.length, "request")} awaiting a decision.`
      : "You have no requests awaiting a decision.",
    rows: open.slice(0, 8).map((r) => ({
      label: r.documentTitle,
      value: r.status === "returned" ? "Returned to you" : `With ${r.steps[r.currentStepIndex]?.label ?? "approver"}`,
      href: `/employee/submissions/${r.id}`,
    })),
  };
}

// ── HR / manager intents ────────────────────────────────────────────────────
function topPerformers(q: string, ctx: AssistantContext): AssistantAnswer {
  const b = ctx.bundle;
  const perf = b.performance as {
    cycles?: { id: string; name: string; status: string; endDate: string }[];
    reviews?: { employeeId: string; cycleId: string; managerRating?: number; calibratedRating?: number }[];
  };
  const reviews = perf.reviews ?? [];
  const cycles = [...(perf.cycles ?? [])]
    .filter((c) => reviews.some((r) => r.cycleId === c.id))
    .sort((a, c) => c.endDate.localeCompare(a.endDate));
  const cycle = cycles.find((c) => c.status === "completed") ?? cycles[0];
  const dept = departmentIn(q, b);
  const people = new Map(current(b).map((e) => [e.id, e]));
  const ranked = reviews
    .filter((r) => !cycle || r.cycleId === cycle.id)
    .map((r) => ({ r, e: people.get(r.employeeId), rating: r.calibratedRating ?? r.managerRating ?? 0 }))
    .filter((x) => x.e && (!dept || x.e.departmentName === dept))
    .sort((a, c) => c.rating - a.rating)
    .slice(0, 5);
  if (!ranked.length) {
    return { text: `I couldn't find completed reviews${dept ? ` for ${dept}` : ""}${cycle ? ` in ${cycle.name}` : ""}.` };
  }
  return {
    text: `Top performers${dept ? ` in ${dept}` : ""} from the ${cycle?.name ?? "latest review cycle"}, by calibrated rating:`,
    rows: ranked.map(({ e, rating }) => ({
      label: `${e!.fullName} — ${e!.jobTitle}`,
      value: `${rating} / 5`,
      href: profileHref(e!.id, "performance"),
    })),
    links: [{ label: "Open Performance", href: "/talent/performance" }],
  };
}

function headcount(q: string, ctx: AssistantContext): AssistantAnswer {
  const dept = departmentIn(q, ctx.bundle);
  const people = current(ctx.bundle).filter((e) => !dept || e.departmentName === dept);
  const byDept = new Map<string, number>();
  for (const e of people) byDept.set(e.departmentName, (byDept.get(e.departmentName) ?? 0) + 1);
  return {
    text: `${dept ?? "The organisation"} has ${plural(people.length, "current employee")}.`,
    rows: dept
      ? undefined
      : [...byDept.entries()].sort((a, b) => b[1] - a[1]).map(([d, n]) => ({ label: d, value: String(n) })),
    links: [{ label: "Open Employees", href: "/organization/employees" }],
  };
}

function onLeave(ctx: AssistantContext): AssistantAnswer {
  const active = activeLeaveFromBundle(ctx.bundle);
  const rows = current(ctx.bundle)
    .filter((e) => active.has(e.id))
    .map((e) => {
      const l = active.get(e.id)!;
      return { label: e.fullName, value: `${l.label} · back ${l.returnDate}`, href: profileHref(e.id, "leave") };
    });
  return {
    text: rows.length ? `${plural(rows.length, "person is", "people are")} on leave today.` : "Nobody is on leave today.",
    rows,
    links: [{ label: "Leave calendar", href: "/time-payroll/leave" }],
  };
}

function expiringCerts(q: string, ctx: AssistantContext): AssistantAnswer {
  const wantExpired = /expired|lapsed/.test(q) && !/expir(ing|es)/.test(q);
  const window = /next month|30|this month/.test(q) ? 30 : /quarter|90|3 months/.test(q) ? 90 : 60;
  const people = new Map(current(ctx.bundle).map((e) => [e.id, e]));
  const hits = certifications(ctx)
    .filter((c) => people.has(c.employeeId))
    .map((c) => ({ c, d: daysToExpiry(c.expiresAt, ctx.today) }))
    .filter(({ d }) => d != null && (wantExpired ? d < 0 : d >= 0 && d <= window))
    .sort((a, b) => a.d! - b.d!);
  return {
    text: wantExpired
      ? hits.length
        ? `${plural(hits.length, "certification has", "certifications have")} expired and need renewing.`
        : "No certifications have expired."
      : hits.length
        ? `${plural(hits.length, "certification")} expire${hits.length === 1 ? "s" : ""} in the next ${window} days.`
        : `Nothing expires in the next ${window} days.`,
    rows: hits.slice(0, 10).map(({ c, d }) => ({
      label: `${people.get(c.employeeId)!.fullName} — ${c.title.replace(/ - Certificate$/, "")}`,
      value: d! < 0 ? `Expired ${-d!} days ago` : `${d} days`,
      href: profileHref(c.employeeId, "training"),
    })),
    links: [{ label: "Certification Register", href: "/talent/training" }],
  };
}

function complianceRisk(ctx: AssistantContext): AssistantAnswer {
  const learn = ctx.bundle.learning as {
    courses?: { id: string; title: string; mandatory?: boolean }[];
    enrollments?: { employeeId?: string; courseId: string; status: string; dueDate?: string | null }[];
  };
  const m = mandatoryCompliance(
    current(ctx.bundle),
    (learn.courses ?? []).filter((c) => c.mandatory),
    learn.enrollments ?? [],
    ctx.today,
  );
  const expired = certifications(ctx).filter(
    (c) => (daysToExpiry(c.expiresAt, ctx.today) ?? 1) < 0 && current(ctx.bundle).some((e) => e.id === c.employeeId),
  ).length;
  const atRisk = m.departments.filter((d) => d.atRisk);
  return {
    text:
      `Mandatory training is ${m.completionRate}% complete with ${plural(m.employeesOverdue, "employee")} overdue` +
      ` and ${plural(expired, "expired certification")}. ` +
      (atRisk.length
        ? `${plural(atRisk.length, "department is", "departments are")} below ${80}% completion:`
        : "No department is below the 80% target."),
    rows: (atRisk.length ? atRisk : m.departments.slice(0, 5)).map((d) => ({
      label: d.department,
      value: `${d.rate}% complete · ${d.overdue} overdue`,
    })),
    links: [{ label: "Mandatory Compliance", href: "/talent/training" }],
  };
}

function qualified(q: string, ctx: AssistantContext): AssistantAnswer {
  const topic = q
    .replace(/.*?(qualified (in|for|to( do)?)|who (can|knows|has|is good at|is skilled in)|skilled in|experience (in|with)|certified in)\s*/, "")
    .replace(/[?.!]/g, "")
    .replace(/^(a|an|the|do|perform)\s+/, "")
    .trim();
  if (!topic) return { text: "Which skill or qualification should I look for? e.g. \"Who is qualified in SQL?\"" };
  const words = topic.split(/\s+/).filter((w) => w.length > 2);
  const match = (s: string) => {
    const t = s.toLowerCase();
    return t.includes(topic) || (words.length > 0 && words.every((w) => t.includes(w)));
  };
  const people = new Map(current(ctx.bundle).map((e) => [e.id, e]));
  const found = new Map<string, string[]>();
  const add = (id: string, why: string) => {
    if (!people.has(id)) return;
    found.set(id, [...(found.get(id) ?? []), why]);
  };
  for (const s of applyCollection(ctx.bundle.employeeSkills ?? [], "employeeSkills", ctx.edits)) {
    if (match(s.name) && toLevel(s.level) >= 3) add(s.employeeId, `${s.name}: ${proficiencyLabel(s.level)}`);
  }
  for (const c of certifications(ctx)) {
    if ((match(c.title) || match(c.issuingBody ?? "")) && certStatus(c.expiresAt, ctx.today) !== "expired") {
      add(c.employeeId, c.title.replace(/ - Certificate$/, ""));
    }
  }
  for (const ed of applyCollection(ctx.bundle.education ?? [], "education", ctx.edits)) {
    if (match(ed.fieldOfStudy)) add(ed.employeeId, `${ed.qualification} ${ed.fieldOfStudy}`);
  }
  const rows = [...found.entries()].map(([id, why]) => ({
    label: `${people.get(id)!.fullName} — ${people.get(id)!.jobTitle}`,
    value: why.slice(0, 2).join(" · "),
    href: profileHref(id, "skills"),
  }));
  return {
    text: rows.length
      ? `${plural(rows.length, "person matches", "people match")} "${topic}" (intermediate level or above, a valid certification, or a relevant degree):`
      : `Nobody on record matches "${topic}" yet.`,
    rows: rows.slice(0, 10),
  };
}

function skillGaps(ctx: AssistantContext): AssistantAnswer {
  const gaps = new Map<string, { count: number; total: number }>();
  const people = new Set(current(ctx.bundle).map((e) => e.id));
  for (const s of applyCollection(ctx.bundle.employeeSkills ?? [], "employeeSkills", ctx.edits)) {
    if (!people.has(s.employeeId)) continue;
    const g = skillGap(s);
    if (g <= 0) continue;
    const row = gaps.get(s.name) ?? { count: 0, total: 0 };
    row.count += 1;
    row.total += g;
    gaps.set(s.name, row);
  }
  const rows = [...gaps.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 8);
  return {
    text: rows.length
      ? "The most common skill gaps against role requirements:"
      : "No skill gaps against role requirements on record.",
    rows: rows.map(([name, g]) => ({ label: name, value: `${plural(g.count, "person", "people")} below target` })),
  };
}

function loanBook(ctx: AssistantContext): AssistantAnswer {
  const all = loans(ctx).filter((l) => current(ctx.bundle).some((e) => e.id === l.employeeId));
  const s = summariseLoans(all, ctx.today);
  return {
    text: `${plural(s.activeLoans, "active loan")} worth ${ctx.formatMoney(s.loanValue)}, with ${ctx.formatMoney(s.outstanding)} outstanding. ${plural(s.dueThisMonth, "loan has", "loans have")} an instalment due this month; ${s.pending} awaiting approval and ${s.defaulted} defaulted.`,
    links: [{ label: "Loan Register", href: "/organization/loans" }],
  };
}

function dataQuality(ctx: AssistantContext): AssistantAnswer {
  const docs = ctx.bundle.documents as { employeeId?: string; category?: string; name?: string; status?: string }[];
  const count = (rows: { employeeId?: string }[] | undefined, key: string, id: string) =>
    applyCollection(rows ?? [], key, ctx.edits).filter((r) => r.employeeId === id).length;
  const scored = current(ctx.bundle)
    .map((e) => ({
      e,
      r: profileCompletion({
        employee: e,
        country: ctx.country,
        documents: docs.filter((d) => d.employeeId === e.id),
        educationCount: count(ctx.bundle.education, "education", e.id),
        membershipCount: count(ctx.bundle.professionalMemberships, "professionalMemberships", e.id),
        skillCount: count(ctx.bundle.employeeSkills, "employeeSkills", e.id),
        languageCount: count(ctx.bundle.employeeLanguages, "employeeLanguages", e.id),
      }),
    }))
    .sort((a, b) => a.r.score - b.r.score);
  const avg = Math.round(scored.reduce((s, x) => s + x.r.score, 0) / Math.max(1, scored.length));
  const below = scored.filter((x) => x.r.score < COMPLETION_TARGET);
  return {
    text: `Average profile completion is ${avg}%; ${plural(below.length, "profile is", "profiles are")} below ${COMPLETION_TARGET}%. Least complete:`,
    rows: scored.slice(0, 5).map(({ e, r }) => ({
      label: e.fullName,
      value: `${r.score}% · missing ${r.missing.slice(0, 2).map((m) => m.label).join(", ")}${r.missing.length > 2 ? "…" : ""}`,
      href: profileHref(e.id),
    })),
  };
}

// ── router ──────────────────────────────────────────────────────────────────
const isSelf = (q: string) => /\b(i|my|me|mine)\b/.test(q);

export function answerQuestion(question: string, ctx: AssistantContext): AssistantAnswer {
  const q = question.toLowerCase().trim();
  if (!q) return help(ctx);

  // Personal questions work in both portals.
  if (isSelf(q)) {
    if (/leave|holiday|days? off|annual/.test(q)) return myLeave(ctx);
    if (/loan|advance|owe|repay/.test(q)) return myLoans(ctx);
    if (/cert|licen[cs]e|qualification/.test(q)) return myCerts(ctx);
    if (/profile|missing|complete/.test(q)) return myProfile(ctx);
    if (/manager|boss|report to/.test(q)) return myManager(ctx);
    if (/request|submission|pending|approv/.test(q)) return myRequests(ctx);
  }

  const orgWide =
    /top|best|perform|headcount|how many (employees|staff|people)|on leave|off today|certif|renew|expir|complian|mandatory|qualified|who (can|knows|has|is good|is skilled)|skilled in|skill gap|loan|advance|data quality|incomplete|missing/.test(
      q,
    );
  if (orgWide && ctx.portal === "employee") {
    return {
      text: "Here I can only answer questions about your own record — for example your leave, loans, certifications or profile. HR and managers can ask organisation-wide questions from the admin portal.",
    };
  }

  if (/(top|best|highest)[\s-]*(perform|rated)|top performers?/.test(q)) return topPerformers(q, ctx);
  if (/skill[\s-]*gap/.test(q)) return skillGaps(ctx);
  if (/qualified|who (can|knows|has|is good at|is skilled in)|skilled in|certified in|experience (in|with)/.test(q))
    return qualified(q, ctx);
  if (/certif|licen[cs]e/.test(q) || /renew/.test(q)) return expiringCerts(q, ctx);
  if (/complian|mandatory|risk|overdue training/.test(q)) return complianceRisk(ctx);
  if (/on leave|off today|away today|out of office/.test(q)) return onLeave(ctx);
  if (/loan|advance/.test(q)) return loanBook(ctx);
  if (/data quality|incomplete|profile completion|missing (documents|data)/.test(q)) return dataQuality(ctx);
  if (/headcount|how many (employees|staff|people)/.test(q)) return headcount(q, ctx);

  return help(ctx);
}

function help(ctx: AssistantContext): AssistantAnswer {
  return {
    text: "I didn't catch that. Here are some things I can answer:",
    rows: (ctx.portal === "hr" ? [...HR_SUGGESTIONS, ...EMPLOYEE_SUGGESTIONS.slice(0, 2)] : EMPLOYEE_SUGGESTIONS).map(
      (s) => ({ label: s, value: "" }),
    ),
  };
}
