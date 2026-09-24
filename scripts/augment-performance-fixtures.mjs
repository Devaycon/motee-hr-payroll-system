// Seeds the Performance module in both tenant locale fixtures:
//
//   · performance.cycles           — the review cycle running now, the one before
//                                    it, and statuses recomputed from their dates
//   · performance.reviews          — completed history for every cycle since
//                                    H2 2025, and a review per person in the
//                                    current cycle spread across every stage
//                                    (not started → draft → self-submitted →
//                                    manager-rated → completed), plus a
//                                    probation review and an overdue PIP
//   · performance.goals            — current- and previous-cycle goals with
//                                    category, description and check-in history;
//                                    unfinished goals from closed cycles that were
//                                    mostly done are closed out as completed
//   · performance.feedback         — recent feedback between colleagues
//   · performance.feedbackRequests — a few open requests
//   · performance.oneOnOnes        — recent manager 1:1s
//
// Deterministic and idempotent: generated rows carry a `-PRF-` id segment and
// are replaced on every run; existing rows are only patched. Dates are
// anchored on the day the script runs, so the current cycle is always open.
//
//   node scripts/augment-performance-fixtures.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALE_DIR = join(__dirname, "..", "src", "data", "locale");
const FILES = [
  { file: "nigeria.json", country: "ng" },
  { file: "uk.json", country: "uk" },
];

// ── deterministic RNG (mulberry32), matching the other augment scripts ──────
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const int = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const iso = (d) => d.toISOString().slice(0, 10);
const TODAY = new Date(`${iso(new Date())}T00:00:00Z`);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const day = (s) => new Date(`${s}T00:00:00Z`);
const pad = (n, w = 4) => String(n).padStart(w, "0");
const GEN = "-PRF-";
const isGenerated = (r) => typeof r?.id === "string" && r.id.includes(GEN);
const shuffle = (rng, arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── cycles ──────────────────────────────────────────────────────────────────
const cycleId = (year, half) => `RC-${year}-${half}`;
const halfOf = (d) => (d.getUTCMonth() < 6 ? "H1" : "H2");
const prevHalf = (year, half) => (half === "H2" ? [year, "H1"] : [year - 1, "H2"]);
/** The review window each half uses in the fixtures: June and November. */
const standardWindow = (year, half) =>
  half === "H1"
    ? { startDate: `${year}-06-01`, endDate: `${year}-06-30` }
    : { startDate: `${year}-11-01`, endDate: `${year}-11-30` };

// ── content banks ───────────────────────────────────────────────────────────
const GOALS_BY_AREA = {
  engineering: [
    ["Cut p95 API latency by 30%", "technical", "Profile the hottest endpoints, add caching where safe and bring p95 latency under 300ms."],
    ["Raise automated test coverage to 80%", "technical", "Add unit and integration tests to owned services and gate merges on coverage."],
    ["Migrate the payments service to the new platform", "technical", "Move the remaining payment flows off the legacy stack with zero customer-facing downtime."],
    ["Mentor a junior engineer through their first release", "leadership", "Pair weekly and review their pull requests until they ship a feature end to end."],
    ["Reduce production incidents by 25%", "operational", "Tighten alerting, write runbooks for the top five failure modes and run a game day."],
  ],
  product: [
    ["Ship the redesigned onboarding flow", "technical", "Launch the new onboarding journey and lift day-7 activation by 10 points."],
    ["Run 12 customer discovery interviews", "communication", "Talk to customers in each segment and share a synthesis with the wider team."],
    ["Publish a 2-quarter product roadmap", "leadership", "Agree priorities with engineering and commercial leads and publish the roadmap."],
    ["Build a reusable design system library", "technical", "Document core components so every squad ships consistent UI."],
  ],
  compliance: [
    ["Complete the annual AML risk assessment", "operational", "Refresh the enterprise-wide risk assessment and present findings to the board."],
    ["Close all open audit findings", "operational", "Remediate outstanding internal audit actions before the next audit cycle."],
    ["Deliver compliance training to every team", "communication", "Run refresher sessions and reach 100% completion of mandatory modules."],
    ["Earn a professional compliance certification", "growth", "Study for and pass the next available certification sitting."],
  ],
  finance: [
    ["Close the books in 5 working days", "operational", "Automate reconciliations so month-end close finishes within five working days."],
    ["Deliver the next-year budget on time", "leadership", "Coordinate department submissions and present the consolidated budget."],
    ["Automate the monthly management report", "technical", "Replace the manual spreadsheet pack with an automated report."],
    ["Complete the next professional exam paper", "growth", "Prepare for and sit the next paper of the professional qualification."],
  ],
  people: [
    ["Reduce time-to-hire to under 30 days", "operational", "Tighten the interview process and shortlist faster to bring time-to-hire under 30 days."],
    ["Launch the manager development programme", "leadership", "Design and run a 6-session programme for first-time managers."],
    ["Lift engagement survey participation to 85%", "communication", "Promote the survey and share results transparently to raise participation."],
    ["Refresh the employee handbook", "operational", "Update policies to reflect current legislation and publish the new handbook."],
  ],
  growth: [
    ["Grow qualified pipeline by 20%", "operational", "Run targeted campaigns that add 20% more qualified opportunities."],
    ["Lower customer acquisition cost by 15%", "operational", "Shift spend to the best-performing channels and cut CAC by 15%."],
    ["Launch two partner co-marketing campaigns", "communication", "Agree and deliver joint campaigns with two strategic partners."],
    ["Close three new enterprise accounts", "operational", "Progress the top enterprise prospects to signed contracts."],
  ],
  support: [
    ["Improve customer satisfaction to 90%", "communication", "Coach the team on tone and follow-up to lift CSAT to 90%."],
    ["Cut first-response time to under 1 hour", "operational", "Rebalance rotas and triage rules to answer every ticket within an hour."],
    ["Publish 20 new help-centre articles", "communication", "Turn the most common questions into self-serve articles."],
    ["Train two team leads in coaching skills", "leadership", "Put two senior agents through coaching training and hand them QA reviews."],
  ],
  operations: [
    ["Improve on-time delivery to 97%", "operational", "Tighten route planning and dispatch to raise on-time delivery to 97%."],
    ["Reduce fleet fuel costs by 10%", "operational", "Use telematics data to cut idling and optimise routes."],
    ["Zero lost-time safety incidents", "operational", "Run monthly toolbox talks and close every near-miss action within a week."],
    ["Complete a warehouse layout redesign", "technical", "Re-slot fast movers to cut average pick time."],
  ],
  leadership: [
    ["Agree next year's company strategy", "leadership", "Lead the leadership offsite and publish the strategy and its measures."],
    ["Build a succession plan for key roles", "leadership", "Identify successors for every leadership role and agree development plans."],
    ["Improve cross-team communication", "communication", "Introduce a monthly all-hands and a written weekly update."],
  ],
};
const COMMON_GOALS = [
  ["Complete a leadership or management course", "growth", "Finish an accredited course and apply one new practice with the team."],
  ["Share knowledge in two internal sessions", "communication", "Run two lunch-and-learn sessions on your area of expertise."],
];

function areaFor(emp) {
  const d = `${emp.departmentName} ${emp.jobTitle}`.toLowerCase();
  if (/chief|executive office|\bceo\b|\bcoo\b|\bcfo\b/.test(d)) return "leadership";
  if (/engineer|platform|devops/.test(d)) return "engineering";
  if (/product|design/.test(d)) return "product";
  if (/risk|compliance|aml/.test(d)) return "compliance";
  if (/finance|account|payroll|treasury/.test(d)) return "finance";
  if (/people|hr |hr$|human|culture/.test(d)) return "people";
  if (/growth|marketing|sales|partnership|account exec/.test(d)) return "growth";
  if (/support|customer|cx/.test(d)) return "support";
  if (/operation|fleet|logistic|warehouse|driver|route/.test(d)) return "operations";
  return "leadership";
}

const STRENGTHS = [
  "Consistently delivers high-quality work on time and raises risks early.",
  "Strong ownership — takes problems end to end without needing to be chased.",
  "Collaborates well across teams and is generous with their time.",
  "Clear, structured communicator in writing and in meetings.",
  "Brings calm judgement to difficult situations and keeps the team focused.",
  "Excellent technical depth and a reliable reviewer for others.",
  "Builds strong relationships with customers and stakeholders.",
];
const IMPROVEMENTS = [
  "Delegate more so they can focus on the highest-impact work.",
  "Share progress more proactively with stakeholders.",
  "Push back earlier when scope grows beyond what is realistic.",
  "Document decisions so the wider team can follow the reasoning.",
  "Build confidence presenting to senior audiences.",
  "Plan capacity more carefully ahead of busy periods.",
];
const SUMMARIES = {
  5: "An outstanding period. Well ahead of expectations on every goal and a role model for the team.",
  4: "A strong period. Exceeded expectations on most goals and grew noticeably in the role.",
  3: "A solid period. Met expectations and delivered what was agreed.",
  2: "A mixed period. Some goals slipped; agreed a clear plan with support to get back on track.",
  1: "A difficult period. Several expectations were not met; a formal improvement plan is in place.",
};
const ACHIEVEMENTS = [
  "Delivered my main project ahead of schedule and handed it over with full documentation.",
  "Took on extra scope when the team was short and still hit my core goals.",
  "Improved our process so the team spends less time on repetitive work.",
  "Built stronger relationships with the teams we depend on, which cut hand-off delays.",
  "Coached a newer colleague who is now working independently.",
];
const CHALLENGES = [
  "Balancing project work with a heavy meeting load. I blocked focus time and it helped.",
  "Shifting priorities mid-quarter. I now confirm scope in writing before starting.",
  "A key dependency slipped; I escalated earlier the second time and we recovered.",
  "Learning a new area quickly. I paired with an expert for the first few weeks.",
];
const DEVELOPMENT = [
  "I want to get better at presenting to senior stakeholders.",
  "I'd like to deepen my technical knowledge in our core platform.",
  "I want to build my people-leadership skills ahead of a lead role.",
  "I'd like to improve how I plan and estimate larger pieces of work.",
];
const SUPPORT = [
  "More regular 1:1s during busy periods.",
  "A training budget for a relevant course this half.",
  "A stretch assignment leading a small cross-team project.",
  "Clearer priorities when requests come from several directions.",
];
const FEEDBACK = {
  peer: [
    "Always willing to help and explains things clearly.",
    "Great to work with on the last project — reliable and thoughtful.",
    "Would love to see more of your ideas in planning sessions.",
    "Your reviews are thorough and genuinely improve the work.",
  ],
  upward: [
    "Gives clear direction and trusts the team to deliver.",
    "Could share context on priority changes a little earlier.",
    "Very supportive in 1:1s — I always leave with a clear next step.",
  ],
  downward: [
    "Excellent progress this quarter — keep raising risks early like you did.",
    "Strong delivery; next step is taking the lead in stakeholder meetings.",
    "Please keep documentation current so others can pick up your work.",
  ],
};
const UPDATE_NOTES = [
  "Kicked off and agreed the plan with stakeholders.",
  "First milestone done; on track for the next one.",
  "Blocked for a week on a dependency — now resolved.",
  "Good progress this sprint; remaining work is scoped.",
  "Behind plan after priorities shifted; agreed a catch-up plan with my manager.",
];
const ONE_ON_ONE_NOTES = [
  "Reviewed goal progress and agreed priorities for the next two weeks.",
  "Talked through the self-assessment and the support needed this half.",
  "Discussed workload, upcoming leave and a stretch opportunity.",
  "Went through recent feedback and set one development action.",
];

// ── generation ──────────────────────────────────────────────────────────────
for (const { file, country } of FILES) {
  const path = join(LOCALE_DIR, file);
  const bundle = JSON.parse(readFileSync(path, "utf8"));
  const rng = makeRng(hashStr(`performance:${country}`));
  const prefix = bundle.employees[0].id.split("-")[0]; // NG / GB
  const perf = (bundle.performance ??= {});
  const employees = bundle.employees;
  const byId = new Map(employees.map((e) => [e.id, e]));
  const current = employees.filter((e) => e.status !== "terminated");
  // Everyone a demo role signs in as needs a record, even if they have left.
  const personaIds = new Set((bundle.roles ?? []).map((r) => r.linkedEmployeeId).filter(Boolean));
  const employeePersona = bundle.roles?.find((r) => r.id === "ROLE-EMP")?.linkedEmployeeId;
  const people = employees.filter((e) => e.status !== "terminated" || personaIds.has(e.id));

  /** The manager if still here, else a senior leader who is. Never themselves. */
  const leaders = current.filter((e) =>
    /chief|head of|director|\bvp\b/i.test(e.jobTitle),
  );
  function reviewerFor(emp) {
    const mgr = emp.managerId ? byId.get(emp.managerId) : null;
    if (mgr && mgr.status !== "terminated" && mgr.id !== emp.id) return mgr.id;
    return (leaders.find((l) => l.id !== emp.id) ?? current.find((e) => e.id !== emp.id))?.id ?? null;
  }
  /** A stable "how this person tends to perform" so ratings stay coherent. */
  const talent = new Map(people.map((e) => [e.id, 2.6 + makeRng(hashStr(e.id))() * 2.2]));
  const rateFor = (id, r) => clamp(Math.round(talent.get(id) + (r() - 0.5) * 1.2), 1, 5);

  // Drop previous runs.
  for (const key of ["reviews", "goals", "feedback", "feedbackRequests", "oneOnOnes"]) {
    perf[key] = (perf[key] ?? []).filter((r) => !isGenerated(r));
  }

  // ── cycles ──
  const year = TODAY.getUTCFullYear();
  const half = halfOf(TODAY);
  const curId = cycleId(year, half);
  const cycles = (perf.cycles ?? []).map((c) => ({ ...c }));
  const upsert = (c) => {
    const i = cycles.findIndex((x) => x.id === c.id);
    if (i >= 0) cycles[i] = { ...cycles[i], ...c };
    else cycles.push(c);
  };
  upsert({
    id: curId,
    name: `${half} ${year} Review`,
    startDate: iso(addDays(TODAY, -24)),
    endDate: iso(addDays(TODAY, 37)),
  });
  // Every half from H2 2025 up to the one before now gets completed history.
  const historyIds = [];
  for (let [y, h] = prevHalf(year, half); y > 2025 || (y === 2025 && h === "H2"); [y, h] = prevHalf(y, h)) {
    const id = cycleId(y, h);
    historyIds.unshift(id);
    if (!cycles.some((c) => c.id === id)) upsert({ id, name: `${h} ${y} Review`, ...standardWindow(y, h) });
  }
  for (const c of cycles) {
    c.status =
      c.endDate < iso(TODAY) ? "completed" : c.startDate > iso(TODAY) ? "planned" : "in_progress";
  }
  cycles.sort((a, b) => a.startDate.localeCompare(b.startDate));
  perf.cycles = cycles;
  const cycleById = new Map(cycles.map((c) => [c.id, c]));
  const cur = cycleById.get(curId);

  let seq = 0;
  const nextId = (kind) => `${prefix}-${kind}${GEN}${pad(++seq)}`;
  const assessmentFor = (r) => ({
    achievements: `${pick(r, ACHIEVEMENTS)} ${pick(r, ACHIEVEMENTS)}`,
    challenges: pick(r, CHALLENGES),
    developmentAreas: pick(r, DEVELOPMENT),
    managerFeedback: pick(r, SUPPORT),
  });

  // ── history reviews: every half since H2 2025 that has none yet ──
  const reviews = [];
  for (const cid of historyIds) {
    if (perf.reviews.some((r) => r.cycleId === cid)) continue;
    const c = cycleById.get(cid);
    for (const emp of people) {
      if (emp.startDate && emp.startDate > c.startDate) continue;
      const r = makeRng(hashStr(`${cid}:${emp.id}`));
      const manager = rateFor(emp.id, r);
      const calibrated = r() < 0.2 ? clamp(manager + (r() < 0.5 ? -1 : 1), 1, 5) : manager;
      const completedAt = iso(addDays(day(c.endDate), int(r, -6, 8)));
      reviews.push({
        id: nextId("REV"),
        employeeId: emp.id,
        cycleId: cid,
        reviewerId: reviewerFor(emp),
        selfRating: clamp(manager + (r() < 0.35 ? 1 : 0), 1, 5),
        managerRating: manager,
        calibratedRating: calibrated,
        summary: SUMMARIES[calibrated],
        strengths: pick(r, STRENGTHS),
        improvements: pick(r, IMPROVEMENTS),
        selfAssessment: assessmentFor(r),
        selfSubmittedAt: iso(addDays(day(c.endDate), -int(r, 8, 14))),
        completedAt,
      });
    }
  }

  // ── current cycle: one review each, spread across every stage ──
  const STAGES = ["not_started", "draft", "submitted", "submitted", "manager_rated", "completed"];
  const order = shuffle(rng, people.map((e) => e.id));
  const stageOf = new Map(order.map((id, i) => [id, STAGES[i % STAGES.length]]));
  // The Employee demo login lands mid-flow: a draft to finish and submit.
  if (employeePersona) stageOf.set(employeePersona, "draft");
  for (const emp of people) {
    const r = makeRng(hashStr(`${curId}:${emp.id}`));
    const stage = stageOf.get(emp.id);
    const row = {
      id: nextId("REV"),
      employeeId: emp.id,
      cycleId: curId,
      reviewerId: reviewerFor(emp),
      dueDate: cur.endDate,
    };
    if (stage !== "not_started") {
      const a = assessmentFor(r);
      row.selfAssessment =
        stage === "draft" ? { ...a, challenges: "", managerFeedback: "" } : a;
    }
    if (stage === "draft") row.status = "in_progress";
    if (["submitted", "manager_rated", "completed"].includes(stage)) {
      row.selfRating = rateFor(emp.id, r);
      row.selfSubmittedAt = iso(addDays(TODAY, -int(r, 1, 12)));
      row.status = "in_progress";
    }
    if (stage === "manager_rated" || stage === "completed") {
      const m = rateFor(emp.id, r);
      row.managerRating = m;
      row.strengths = pick(r, STRENGTHS);
      row.improvements = pick(r, IMPROVEMENTS);
    }
    if (stage === "completed") {
      row.calibratedRating = row.managerRating;
      row.summary = SUMMARIES[row.managerRating];
      row.completedAt = iso(addDays(TODAY, -int(r, 0, 3)));
      row.status = "completed";
    }
    reviews.push(row);
  }

  // ── a probation review coming up, and an overdue PIP ──
  const probation = current.find((e) => /open/i.test(e.probationStatus ?? "")) ?? current.at(-1);
  if (probation) {
    reviews.push({
      id: nextId("REV"),
      employeeId: probation.id,
      type: "probation",
      period: `Probation ${year}`,
      reviewerId: reviewerFor(probation),
      dueDate: iso(addDays(TODAY, 14)),
      status: "not_started",
    });
  }
  const lowest = [...current]
    .filter((e) => e.id !== probation?.id && e.id !== employeePersona)
    .sort((a, b) => talent.get(a.id) - talent.get(b.id))[0];
  if (lowest) {
    reviews.push({
      id: nextId("REV"),
      employeeId: lowest.id,
      type: "pip",
      period: `PIP ${half} ${year}`,
      reviewerId: reviewerFor(lowest),
      dueDate: iso(addDays(TODAY, -5)),
      status: "not_started",
    });
  }
  perf.reviews = [...perf.reviews, ...reviews];

  // ── goals ──
  // Unfinished goals from closed cycles: mostly-done ones were closed out as
  // complete; the rest, once the cycle is over six months gone, were dropped
  // rather than carried forward. Recent misses stay overdue.
  let closedOut = 0;
  const staleBefore = iso(addDays(TODAY, -183));
  for (const g of perf.goals) {
    const c = cycleById.get(g.cycleId);
    if (!c || c.endDate >= iso(TODAY)) continue;
    if (g.status === "completed" || g.status === "cancelled") continue;
    if ((g.progress ?? 0) >= 60) {
      Object.assign(g, { status: "completed", progress: 100, completedAt: c.endDate });
      closedOut++;
    } else if (c.endDate < staleBefore) {
      g.status = "cancelled";
      closedOut++;
    }
  }

  const goals = [];
  const prevId = historyIds.at(-1);
  const prev = prevId ? cycleById.get(prevId) : null;
  for (const emp of people) {
    const r = makeRng(hashStr(`goals:${emp.id}`));
    const bank = shuffle(r, [...GOALS_BY_AREA[areaFor(emp)], ...COMMON_GOALS]);
    const mk = (tpl, cid, extra) => ({
      id: nextId("GOAL"),
      employeeId: emp.id,
      cycleId: cid,
      title: tpl[0],
      category: tpl[1],
      description: tpl[2],
      type: r() < 0.6 ? "SMART" : "OKR",
      ...extra,
    });

    // Previous cycle: mostly delivered.
    if (prev) {
      for (const tpl of bank.slice(3, 5)) {
        const done = r() < 0.75;
        goals.push(
          mk(tpl, prevId, {
            createdAt: iso(addDays(day(prev.startDate), -120)),
            dueDate: prev.endDate,
            progress: done ? 100 : int(r, 30, 55),
            status: done ? "completed" : "overdue",
            ...(done ? { completedAt: iso(addDays(day(prev.endDate), -int(r, 0, 20))) } : {}),
          }),
        );
      }
    }

    // Current cycle: three live goals.
    bank.slice(0, 3).forEach((tpl, i) => {
      const created = addDays(day(cur.startDate), int(r, -3, 5));
      // One goal in five is a short milestone that has already lapsed.
      const lapsed = i === 2 && r() < 0.2;
      const dueDate = lapsed ? iso(addDays(TODAY, -int(r, 5, 14))) : i === 0 ? `${year}-12-31` : iso(addDays(TODAY, int(r, 30, 80)));
      // Where the goal should be by now, on its own timeline.
      const expected = clamp((TODAY - created) / (day(dueDate) - created || 1), 0, 1) * 100;
      const roll = r();
      let progress, status;
      if (lapsed) {
        progress = int(r, 6, 14) * 5;
        status = "overdue";
      } else if (roll < 0.08) {
        progress = 100;
        status = "completed";
      } else if (roll < 0.3) {
        progress = clamp(Math.round((expected - int(r, 20, 30)) / 5) * 5, 5, 95);
        status = "at_risk";
      } else {
        progress = clamp(Math.round((expected + (r() - 0.3) * 30) / 5) * 5, 10, 95);
        status = "on_track";
      }
      const checkins = [];
      const n = int(r, 1, 3);
      for (let k = n; k >= 1; k--) {
        const date = addDays(created, Math.round(((TODAY - created) / 86400000) * (k / (n + 1))));
        checkins.push({
          date: iso(date),
          progress: Math.round((progress * k) / (n + 1) / 5) * 5,
          note: status === "at_risk" && k === n ? UPDATE_NOTES[4] : pick(r, UPDATE_NOTES.slice(0, 4)),
        });
      }
      goals.push(
        mk(tpl, curId, {
          createdAt: iso(created),
          dueDate,
          progress,
          status,
          updates: checkins,
          ...(status === "completed" ? { completedAt: iso(addDays(TODAY, -int(r, 1, 7))) } : {}),
        }),
      );
    });
  }
  perf.goals = [...perf.goals, ...goals];

  // ── feedback: two recent notes each, from people they actually work with ──
  const feedback = [];
  for (const emp of people) {
    const r = makeRng(hashStr(`feedback:${emp.id}`));
    const givers = current.filter(
      (e) =>
        e.id !== emp.id &&
        (e.id === emp.managerId || e.managerId === emp.id || e.departmentId === emp.departmentId),
    );
    for (const giver of shuffle(r, givers).slice(0, 2)) {
      const type =
        giver.id === emp.managerId ? "downward" : giver.managerId === emp.id ? "upward" : "peer";
      feedback.push({
        id: nextId("FB"),
        toEmployeeId: emp.id,
        fromEmployeeId: giver.id,
        type,
        message: pick(r, FEEDBACK[type]),
        createdAt: iso(addDays(TODAY, -int(r, 2, 55))),
      });
    }
  }
  perf.feedback = [...perf.feedback, ...feedback];

  // ── open feedback requests ──
  const requests = [];
  for (const emp of shuffle(rng, people).slice(0, 5)) {
    const peer = current.find((e) => e.id !== emp.id && e.departmentId === emp.departmentId);
    if (!peer) continue;
    requests.push({
      id: nextId("FBR"),
      toEmployeeId: emp.id,
      fromEmployeeId: peer.id,
      context: `We worked together this half — your view on my ${pick(rng, ["communication", "delivery", "collaboration"])} would help my self-assessment.`,
      createdAt: iso(addDays(TODAY, -int(rng, 1, 10))),
    });
  }
  perf.feedbackRequests = [...perf.feedbackRequests, ...requests];

  // ── recent 1:1s with a manager who is still here ──
  const oneOnOnes = [];
  for (const emp of people) {
    const mgr = reviewerFor(emp);
    if (!mgr) continue;
    const r = makeRng(hashStr(`1on1:${emp.id}`));
    for (let k = 0; k < 2; k++) {
      oneOnOnes.push({
        id: nextId("ONE"),
        employeeId: emp.id,
        managerId: mgr,
        date: iso(addDays(TODAY, -(k * 14 + int(r, 1, 6)))),
        notes: pick(r, ONE_ON_ONE_NOTES),
      });
    }
  }
  perf.oneOnOnes = [...perf.oneOnOnes, ...oneOnOnes];

  bundle._meta.performanceAugmentedAt = iso(TODAY);
  writeFileSync(path, JSON.stringify(bundle, null, 2) + "\n");
  console.log(
    `${file}: ${cycles.length} cycles (current ${curId}), ${reviews.length} reviews, ${goals.length} goals ` +
      `(+${closedOut} closed out), ${feedback.length} feedback, ${requests.length} requests, ${oneOnOnes.length} 1:1s`,
  );
}
